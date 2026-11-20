// The site API's job finder rules (api/radar.mjs): the finder's own token, pairing, and what
// each token may do. Only the answers given before Firestore is touched are run here; the
// page-to-extension handover runs end to end in e2e.mjs.
// Run: node --test extensions/naukri-refresher-dev/
import test from 'node:test';
import assert from 'node:assert/strict';
import buffer from 'node:buffer';

// firebase-admin 11 reads buffer.SlowBuffer when it loads, and Node 25+ no longer has it.
if (!buffer.SlowBuffer) buffer.SlowBuffer = buffer.Buffer;
const INGEST = 'ingest-test-token';
process.env.FIREBASE_SERVICE_ACCOUNT = '{}'; // "configured"; any Firestore or Auth call would fail
process.env.RADAR_INGEST_TOKEN = INGEST;
const { POST, finderToken } = await import('../../api/radar.mjs');

const call = async (token, body) => {
  const res = await POST(new Request('https://interviewplanprep.vercel.app/api/radar', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }));
  return { status: res.status, body: await res.json() };
};
const FINDER = finderToken(INGEST);

test("the finder's token comes from the ingest token: stable, its own, and the shape the extension expects", () => {
  assert.equal(finderToken(INGEST), FINDER);
  assert.notEqual(finderToken('another-ingest-token'), FINDER, 'a new ingest token makes a new finder token');
  assert.match(FINDER, /^nrf1\.[A-Za-z0-9_-]{20,100}$/); // jobs.js PAIR_TOKEN
  assert.ok(!FINDER.includes(INGEST));
  assert.equal(finderToken(''), null);
});

test('the finder token can ask "do you know me?" and nothing beyond finder uploads', async () => {
  assert.deepEqual(await call(FINDER, { finder: 'naukri', check: true }), { status: 200, body: { ok: true, finder: true } });
  assert.deepEqual(await call(INGEST, { finder: 'naukri', check: true }), { status: 200, body: { ok: true, finder: true } });
  assert.equal((await call(FINDER, { openings: [], remove: [] })).status, 401, 'not a radar upload');
  assert.equal((await call(FINDER, { finder: 'other', openings: [] })).status, 401);
  assert.equal((await call('nrf1.wrongwrongwrongwrongwrongwrong', { finder: 'naukri', check: true })).status, 401);
  assert.equal((await call(null, { finder: 'naukri', check: true })).status, 401);
  assert.equal((await call(INGEST, '{not json')).status, 400);
  assert.equal((await call('someone', '{not json')).status, 401, 'a stranger learns nothing from a bad body');
});

test('pairing hands the token only to the signed-in owner', async () => {
  const stranger = await call('not-a-firebase-id-token', { finder: 'naukri', pair: true });
  assert.equal(stranger.status, 401);
  assert.equal(stranger.body.token, undefined);
  assert.equal((await call(null, { finder: 'naukri', pair: true })).status, 401);
  assert.equal((await call(FINDER, { finder: 'naukri', pair: true })).body.token, undefined, 'a finder token gets no token back');
});

test('no ingest token configured: the API says so instead of guessing', async () => {
  delete process.env.RADAR_INGEST_TOKEN;
  try {
    assert.equal((await call(FINDER, { finder: 'naukri', check: true })).status, 503);
  } finally {
    process.env.RADAR_INGEST_TOKEN = INGEST;
  }
});
