// The shared company pay database: the rules (pay-lib.js), the API actions (api/radar.mjs payAction,
// on a fake Firestore) and the lookup order in the rater: database, then the internet, save only
// with enough evidence. Nothing here calls Groq or Firestore.
// Run: node --test extensions/naukri-refresher-dev/
import test from 'node:test';
import assert from 'node:assert/strict';
import buffer from 'node:buffer';

if (!buffer.SlowBuffer) buffer.SlowBuffer = buffer.Buffer;
process.env.FIREBASE_SERVICE_ACCOUNT = '{}';
process.env.RADAR_INGEST_TOKEN = 'ingest-test-token';
const { payAction, POST, finderToken } = await import('../../api/radar.mjs');
const { payKey, confidentPay, knownSources, payRecord, payFresh } = await import('../naukri-refresher/pay-lib.js');
const { startRater } = await import('../naukri-refresher/rate.js');
const { RATE } = await import('../naukri-refresher/rate-lib.js');
const { makePayChecker } = await import('../../scripts/radar/pay.mjs');
const { makePayDb } = await import('../../scripts/radar/paydb.mjs');

test('keys: lowercase words, legal suffixes and "India" aside', () => {
  assert.equal(payKey('Acme Technologies Pvt. Ltd.'), 'acme');
  assert.equal(payKey('ACME India Private Limited'), 'acme');
  assert.equal(payKey('Walmart Global Tech'), 'walmart-global');
  assert.equal(payKey('  '), '');
  assert.equal(payKey('A/B & C'), 'a-b-and-c');
});

test('confidence: only figures with enough evidence are saved', () => {
  const web = (o) => ({ lo: 14, hi: 24, src: 'web', same: true, sources: ['AmbitionBox', 'Glassdoor India'], n: null, ...o });
  assert.equal(confidentPay(web({})).ok, true, 'two reputable sources agree');
  assert.equal(confidentPay(web({ sources: ['levels.fyi'] })).ok, false, 'one source, no report count');
  assert.equal(confidentPay(web({ sources: ['levels.fyi'], n: 45 })).ok, true, 'one source, 45 reports');
  assert.equal(confidentPay(web({ sources: ['levels.fyi'], n: 12 })).ok, false, 'one source, too few reports');
  assert.equal(confidentPay(web({ sources: ['a blog', 'reddit'] })).ok, false, 'not reputable sources');
  assert.equal(confidentPay(web({ same: false })).ok, false, 'not sure it is the same company');
  assert.equal(confidentPay(web({ lo: 4, hi: 40 })).ok, false, 'a range that wide says nothing');
  assert.equal(confidentPay(web({ lo: 2, hi: 3 })).ok, false, 'under 3 LPA is a typo');
  assert.equal(confidentPay(web({ lo: 20, hi: 400 })).ok, false);
  assert.equal(confidentPay(web({ lo: null, hi: null })).ok, false);
  assert.equal(confidentPay({ lo: 20, hi: 45, src: 'levels', n: 40 }).ok, true, "levels.fyi's own figures with 40 reports");
  assert.equal(confidentPay({ lo: 20, hi: 45, src: 'levels', n: 4 }).ok, false);
  assert.deepEqual(knownSources(['AmbitionBox', 'www.glassdoor.co.in/Salary', 'my cousin']), ['ambitionbox', 'glassdoor']);
  const rec = payRecord({ lo: 14.04, hi: 24, src: 'web', sources: ['AmbitionBox', 'Glassdoor'], n: 80 }, 'Acme Pvt Ltd', 1000);
  assert.deepEqual([rec.key, rec.lo, rec.sources, rec.src, rec.at], ['acme', 14, ['ambitionbox', 'glassdoor'], 'web', 1000]);
  assert.equal(payFresh(rec, 1000 + 89 * 86_400_000), true);
  assert.equal(payFresh(rec, 1000 + 91 * 86_400_000), false, 'looked up again after 90 days');
});

// A fake Firestore: just the calls payAction makes.
function fakeStore(initial = {}) {
  const data = new Map(Object.entries(initial));
  const doc = (id) => ({ id, _id: id });
  return {
    data,
    collection: () => ({ doc }),
    getAll: async (...refs) => refs.map((r) => ({ id: r._id, exists: data.has(r._id), data: () => data.get(r._id) })),
    batch: () => {
      const ops = [];
      return { set: (r, v) => ops.push([r._id, v]), commit: async () => ops.forEach(([k, v]) => data.set(k, v)) };
    },
  };
}

test('the API: get returns fresh records only; put saves only what has evidence, says why for the rest, never overwrites a recent figure', async () => {
  const NOW = Date.UTC(2026, 10, 22);
  const store = fakeStore({
    acme: payRecord({ lo: 14, hi: 24, src: 'web', sources: ['AmbitionBox', 'Glassdoor'] }, 'Acme', NOW - 5 * 86_400_000),
    old: payRecord({ lo: 14, hi: 24, src: 'web', sources: ['AmbitionBox', 'Glassdoor'] }, 'Old Co', NOW - 120 * 86_400_000),
  });
  const got = await payAction({ pay: 'get', keys: ['Acme India', 'old co', 'nobody'] }, NOW, store);
  assert.deepEqual(Object.keys(got.found), ['acme'], 'a missing one and a 120-day-old one are not returned');
  const out = await payAction({
    pay: 'put',
    entries: [
      { company: 'Zeta Ltd', lo: 18, hi: 30, src: 'web', sources: ['AmbitionBox', 'levels.fyi'], same: true },
      { company: 'Weak Inc', lo: 18, hi: 30, src: 'web', sources: ['a blog'], same: true },
      { company: 'Acme', lo: 40, hi: 60, src: 'web', sources: ['AmbitionBox', 'Glassdoor'], same: true },
      { company: '', lo: 18, hi: 30, src: 'web', sources: ['AmbitionBox', 'Glassdoor'], same: true },
    ],
  }, NOW, store);
  assert.equal(out.saved, 1);
  assert.equal(out.kept, 1, "Acme's figure from 5 days ago stays");
  assert.deepEqual(out.rejected.map((r) => r.company), ['Weak Inc', '']);
  assert.match(out.rejected[0].why, /reputable source/);
  assert.equal(store.data.get('zeta').hi, 30);
  assert.equal(store.data.get('acme').hi, 24, 'not overwritten');
  assert.ok(!store.data.has('weak'), 'a weak figure is never saved');
});

test('the API: only the finder token or the radar token reaches the pay database', async () => {
  const call = async (token, body) => {
    const res = await POST(new Request('https://x/api/radar', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    }));
    return res.status;
  };
  assert.equal(await call(null, { pay: 'get', keys: ['a'] }), 401);
  assert.equal(await call('wrong', { finder: 'naukri', pay: 'get', keys: ['a'] }), 401);
  assert.equal(await call(finderToken('ingest-test-token'), { pay: 'get', keys: ['a'] }), 401, "the finder's token must say it is the finder");
});

// ---- the rater: database, then the internet, save only when sure
const KEY = (c) => `gsk_${c.repeat(52)}`;
const RESUME = 'Software Engineer\nJava, Spring Boot, Kafka, PostgreSQL\nBuilt services at Blue Yonder with 2 years of Java and Spring Boot work.';
const JDX = 'Requirements\n- 2-5 years of Java and Spring Boot\n- Kafka and PostgreSQL\n- REST APIs and Docker\n- write clean tested code in production services every day';
const ANSWER = JSON.stringify({
  relevance: 85, reject: false, why: 'Java backend.',
  requirements: [
    { req: 'Java', must: true, met: 'yes', evidence: 'Java' },
    { req: 'Kafka', must: true, met: 'yes', evidence: 'Kafka' },
    { req: 'PostgreSQL', must: true, met: 'yes', evidence: 'PostgreSQL' },
  ],
  min_years: 2, role: 'backend', level: 'mid', pay_low: null, pay_high: null, pay_known: false,
});
function fakeGroq(payAnswer) {
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    const body = JSON.parse(init.body);
    calls.push(body);
    const content = body.tools ? payAnswer : ANSWER;
    return new Response(JSON.stringify({ choices: [{ message: { content } }], usage: { prompt_tokens: 300, completion_tokens: 60 } }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  return calls;
}
const job = (id, company) => ({ id, profile: 'backend', post: Date.now(), p: { coverage: 80, rank: 50 }, text: JDX, skills: ['Java'], job: { title: 'Java Developer', company, exp: '2-5 Yrs', location: 'Pune' } });
const run = async (queue, ctx) => {
  const c = { calls: 0, rated: { backend: 0, ai: 0 }, tokens: { input: 0, cached: 0, output: 0 }, fails: 0, last: null };
  const out = [];
  const r = startRater(queue, { keys: [KEY('a')], model: RATE.model, resumes: { sde: RESUME, genai: RESUME }, callsPerDay: 100, counts: c, onRated: (it, ai) => out.push(ai), payPerDay: 10, ...ctx });
  await r.drain(20_000);
  return { c, out, r };
};
const SURE = 'Pay: {"low": 20, "high": 32, "sources": ["AmbitionBox", "Glassdoor"], "reports": 90, "same_company": true, "note": ""}';
const UNSURE = 'Pay: {"low": 20, "high": 32, "sources": ["a forum post"], "reports": null, "same_company": true, "note": ""}';

test('the order: a company in the database is not looked up on the internet', async () => {
  const calls = fakeGroq(SURE);
  const asked = [];
  const payDb = {
    get: async (k) => { asked.push(k); return { lo: 22, hi: 35, n: 50, sources: ['levels'], src: 'levels', at: Date.now() }; },
    put: async () => { throw new Error('nothing to save'); },
  };
  const { c, out } = await run([job('a', 'Acme Pvt Ltd'), job('b', 'Acme India')], { payCache: {}, payDb });
  assert.deepEqual(asked, ['acme'], 'asked once for the company');
  assert.equal(calls.filter((b) => b.tools).length, 0, 'no web lookup');
  assert.equal(out.length, 2);
  assert.ok(out.every((a) => a.pay.from === 'web' && a.pay.hi === 35));
  assert.equal(c.pay.db.hits, 1);
});

test('not in the database: the internet is asked, and a sure answer is saved', async () => {
  const calls = fakeGroq(SURE);
  const saved = [];
  const payDb = { get: async () => null, put: async (entries) => { saved.push(...entries); return { saved: entries.length }; } };
  const { c, out } = await run([job('a', 'Zeta Labs'), job('b', 'Zeta Labs')], { payCache: {}, payDb });
  assert.equal(calls.filter((b) => b.tools).length, 1, 'one lookup');
  assert.equal(saved.length, 1);
  assert.deepEqual([saved[0].company, saved[0].lo, saved[0].hi, saved[0].sources, saved[0].same], ['Zeta Labs', 20, 32, ['AmbitionBox', 'Glassdoor'], true]);
  assert.equal(c.pay.db.saved, 1);
  assert.ok(out.every((a) => a.pay.hi === 32));
});

test('an answer that is not sure is neither used nor saved; the jobs are rated without it', async () => {
  const calls = fakeGroq(UNSURE);
  const saved = [];
  const payDb = { get: async () => null, put: async (e) => { saved.push(...e); return { saved: 1 }; } };
  const cache = {};
  const { c, out } = await run([job('a', 'Hazy Co')], { payCache: cache, payDb });
  assert.equal(calls.filter((b) => b.tools).length, 1);
  assert.equal(saved.length, 0, 'nothing weak is saved');
  assert.equal(out.length, 1);
  assert.equal(out[0].pay.from, null, 'and not counted in the rating');
  assert.equal(c.pay.db.notSure, 1);
  assert.match(cache['hazy-co'].weak, /source/);
});

test('the database not answering: the internet is used, three failures switch it off for the run, and nothing breaks', async () => {
  const calls = fakeGroq(SURE);
  let asks = 0;
  const payDb = { get: async () => { asks += 1; throw new Error('HTTP 500'); }, put: async () => { throw new Error('HTTP 500'); } };
  const { c, out } = await run([job('a', 'One Co'), job('b', 'Two Co'), job('c', 'Three Co'), job('d', 'Four Co')], { payCache: {}, payDb });
  assert.equal(out.length, 4, 'every job is still rated');
  assert.equal(asks, 2, 'failed asks and failed saves both count: after three failures (ask, save, ask) it is not asked again');
  assert.equal(calls.filter((b) => b.tools).length, 4, 'the internet covers for it');
  assert.ok(c.pay.db.errors >= 3);
});

test("the radar's checker: the database first, then levels.fyi", async () => {
  const rec = { key: 'dbco', lo: 10, hi: 14, med: 12, n: 30, sources: ['ambitionbox', 'glassdoor'], src: 'web', at: Date.now() };
  const puts = [];
  const db = { get: async (c) => (/db co/i.test(c) ? rec : null), put: async (e) => { puts.push(e); return { saved: 1 }; } };
  const check = makePayChecker({ cache: {}, db });
  const r = await check({ company: 'Db Co' });
  assert.equal(r.verdict, 'below', "the database says the company's median is 12L: under the floor");
  assert.match(r.text, /pay database/);
  assert.equal(puts.length, 0);
  // A figure already in the PC's cache is used as it is and not written again.
  const cache = { fresh: { at: Date.now(), data: { slug: 'fresh', p25: 20, p50: 28, p90: 45, n: 40 } } };
  const c2 = makePayChecker({ cache, db });
  assert.equal((await c2({ company: 'Fresh' })).verdict, 'maybe');
  assert.equal(puts.length, 0);
});

test('the radar door: get and put go to the API with the ingest token; failures throw, three switch it off', async () => {
  const sent = [];
  const fetchImpl = async (url, init) => {
    sent.push({ url, auth: init.headers.Authorization, body: JSON.parse(init.body) });
    return new Response(JSON.stringify({ found: { acme: { lo: 1 } }, saved: 1 }), { status: 200 });
  };
  const db = makePayDb({ apiUrl: 'https://x/api/radar', token: 'tok', fetchImpl });
  assert.deepEqual(await db.get('Acme Ltd'), { lo: 1 });
  await db.put({ company: 'Acme' });
  assert.deepEqual(sent.map((s) => [s.auth, s.body.pay]), [['Bearer tok', 'get'], ['Bearer tok', 'put']]);
  assert.equal(sent[0].body.keys[0], 'acme');
  assert.equal(makePayDb({ apiUrl: '', token: 'tok' }), null, 'no token or address: no database');
  const bad = makePayDb({ apiUrl: 'https://x', token: 't', fetchImpl: async () => new Response('', { status: 500 }) });
  for (let i = 0; i < 3; i++) await assert.rejects(bad.get('Zed'));
  await assert.rejects(bad.get('Zed'), /off for this run/);
});
