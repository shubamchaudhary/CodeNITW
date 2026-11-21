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
const { POST, finderToken, snapshotParts, snapshotFrom, planFinderUpload, compressed } = await import('../../api/radar.mjs');
const { gunzipSync } = await import('node:zlib');
const { randomBytes } = await import('node:crypto');

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

// ---------------------------------------------------------------- the snapshot and the finder's uploads

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 10, 21, 9, 0);
const stored = (base, openedAt, over = {}) => ({ id: `${base}:${openedAt}`, base, company: base.split(':')[0], openingId: base.split(':')[1], openedAt, lastSeen: openedAt, runs: 1, sources: ['naukri'], ...over });
const upload = (list) => new Map(list.map((o) => [`${o.company.toLowerCase().replace(/[^a-z0-9]+/g, '-')}:${o.openingId}`, { company: o.company, o }]));
const opening = (company, openingId, over = {}) => ({
  company, openingId, title: 'Java Developer', url: `https://www.naukri.com/job-listings-x-${openingId}`, source: 'naukri', sources: ['naukri'], finder: 'naukri',
  postedAt: '2026-11-21', seenSince: NOW, profile: 'backend', coverage: 80, rank: 70, ...over,
});

test('the snapshot goes over as many documents as it needs, and parts from different writes are never mixed', () => {
  const many = Array.from({ length: 4000 }, (_, i) => ({ id: `c${i}:${i}`, base: `c${i}`, snippet: randomBytes(200).toString('base64'), openedAt: NOW - i }));
  const parts = snapshotParts(many, 7, NOW);
  assert.ok(parts.length > 1, `${parts.length} parts`);
  assert.equal(parts[0].parts, parts.length);
  assert.equal(parts[0].count, 4000);
  assert.ok(parts.every((p) => p.rev === 7 && p.data.length <= 900 * 1024));
  assert.deepEqual(snapshotFrom(parts), many);
  assert.equal(snapshotFrom([parts[0], { ...parts[1], rev: 6 }, ...parts.slice(2)]), null, 'a part from another write');
  assert.equal(snapshotFrom(parts.slice(0, 1)), null, 'a part missing');
  assert.equal(snapshotFrom([{ tooBig: true }]), null);
  const one = snapshotParts([{ id: 'a:1', openedAt: 1 }], 1, NOW);
  assert.equal(one.length, 1);
  assert.deepEqual(snapshotFrom([{ data: one[0].data }]), [{ id: 'a:1', openedAt: 1 }], 'the old one-document snapshot still reads');
});

test("a finder upload: known openings updated, new ones created, old ones pruned, all from the snapshot", () => {
  const current = [
    stored('acme:111', NOW - DAY, { finder: 'naukri', title: 'Old title' }),
    stored('old-co:222', NOW - 4 * DAY, { finder: 'naukri' }), // a finder opening past its 3 days
    stored('radar-co:333', NOW - 5 * DAY), // the radar's, kept 15 days
    stored('ancient:444', NOW - 16 * DAY),
  ];
  const ai = { s: 87, m: [5, 6], have: ['Java'], part: [], miss: ['Go'], role: 'backend', lvl: 'mid', yrs: 2, uv: 0, inv: 0, thin: false, v: 1, t: NOW };
  const plan = planFinderUpload({
    current,
    incoming: upload([opening('Acme', '111', { title: 'New title', ai }), opening('Fresh Co', '555')]),
    now: NOW,
  });
  assert.deepEqual(plan.counts, { created: 1, updated: 1, tooOld: 0, removed: 0, deleted: 2 });
  const byId = Object.fromEntries(plan.openings.map((o) => [o.id, o]));
  assert.equal(byId[`acme:111:${NOW - DAY}`].title, 'New title');
  assert.equal(byId[`acme:111:${NOW - DAY}`].runs, 2);
  assert.deepEqual(byId[`acme:111:${NOW - DAY}`].ai, ai, 'the rating is stored as sent');
  assert.ok(Object.keys(byId).some((id) => id.startsWith('fresh-co:555:')));
  assert.ok(!Object.keys(byId).some((id) => id.startsWith('old-co') || id.startsWith('ancient')), 'pruned');
  assert.ok(byId[`radar-co:333:${NOW - 5 * DAY}`], "the radar's opening stays its 15 days");
  assert.deepEqual(plan.writes.map((w) => w.op).sort(), ['create', 'delete', 'delete', 'update']);
  assert.deepEqual(plan.openings.map((o) => o.openedAt), [...plan.openings.map((o) => o.openedAt)].sort((a, b) => b - a), 'newest first');
});

test('a stored opening the snapshot missed is updated, never duplicated; the write budget is kept', () => {
  const found = [stored('acme:111', NOW - DAY, { finder: 'naukri' })];
  const plan = planFinderUpload({ current: [], found, incoming: upload([opening('Acme', '111')]), now: NOW });
  assert.deepEqual(plan.counts, { created: 0, updated: 1, tooOld: 0, removed: 0, deleted: 0 });
  assert.equal(plan.openings.length, 1);
  const old = Array.from({ length: 50 }, (_, i) => stored(`o${i}:${i}`, NOW - 5 * DAY, { finder: 'naukri' }));
  const tight = planFinderUpload({ current: old, incoming: upload([opening('A', '1'), opening('B', '2')]), now: NOW, room: 12 });
  assert.equal(tight.writes.length, 12);
  assert.equal(tight.counts.deleted, 10);
  assert.equal(tight.openings.length, 50 - 10 + 2, 'what it had no room to prune stays for the next upload');
  const bad = planFinderUpload({ current: [], incoming: upload([opening('A', '1', { ai: { s: 140 } }), opening('B', '2', { ai: { s: 55, have: 'Java' } })]), now: NOW });
  const ais = Object.fromEntries(bad.openings.map((o) => [o.company, o.ai]));
  assert.equal(ais.A, undefined, 'a rating out of 1–100 is not stored');
  assert.deepEqual([ais.B.s, ais.B.have, ais.B.thin], [55, [], false]);
});

test('every opening in one answer goes gzipped when it is large and the browser takes gzip', async () => {
  const big = { openings: Array.from({ length: 6000 }, (_, i) => ({ id: `x${i}`, title: 'Backend Engineer, Java and Spring Boot', i })) };
  const req = (enc) => new Request('https://interviewplanprep.vercel.app/api/radar?all=1', { headers: enc ? { 'accept-encoding': enc } : {} });
  const z = compressed(req('gzip, deflate, br'), big);
  assert.equal(z.headers.get('content-encoding'), 'gzip');
  assert.deepEqual(JSON.parse(gunzipSync(Buffer.from(await z.arrayBuffer())).toString('utf8')), big);
  assert.equal(compressed(req(null), big).headers.get('content-encoding'), null, 'no gzip unless the browser takes it');
  assert.deepEqual(await compressed(req('gzip'), { openings: [] }).json(), { openings: [] }, 'small answers go as they are');
});

test("the finder takes off only its own openings, and never one it's sending in the same upload", () => {
  const current = [
    stored('acme:111', NOW - DAY, { finder: 'naukri' }),
    stored('radar-co:333', NOW - DAY), // the radar's: the finder can't remove it
    stored('beta:222', NOW - DAY, { finder: 'naukri' }),
  ];
  const plan = planFinderUpload({ current, incoming: upload([opening('Beta', '222')]), remove: ['acme:111', 'radar-co:333', 'beta:222', 'nobody:9'], now: NOW });
  assert.equal(plan.counts.removed, 1);
  assert.deepEqual(plan.openings.map((o) => o.base).sort(), ['beta:222', 'radar-co:333']);
  assert.deepEqual(plan.writes.filter((w) => w.op === 'delete').map((w) => w.id), [`acme:111:${NOW - DAY}`]);
});
