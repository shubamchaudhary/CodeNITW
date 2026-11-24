// Unit tests for the job finder's AI rating: its rules (rate-lib.js) and its Groq client, key
// rotation and worker (rate.js), against a fake fetch. Nothing here calls Groq.
// Run: node --test extensions/naukri-refresher-dev/
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RATE, RATE_SCHEMA, RATE_INSTRUCTIONS, PROFILE_RULES, instructionsFor, payMatch, payFromAnswer, firstJson, dbgOf, payRequestBody, WEIGHTS, scoreRating, cleanResume, rateText, buildInput, requestBody, outputText, usageOf, parseWait,
  normText, inJob, inResume, profileSummary, rateHash, keyHint, scrub,
} from '../naukri-refresher/rate-lib.js';
import { callGroq, keyPool, pruneQueue, startRater } from '../naukri-refresher/rate.js';

const RESUME = `Software Engineer | Distributed Systems, Microservices, GenAI
Summary
Software Engineer with 2+ years in Java, Spring Boot, PostgreSQL, Azure, Redis and GenAI at Blue Yonder.
Technical Skills
Languages: Java, Python (FastAPI), C++, JavaScript (Node.js), SQL
Frameworks: Spring Boot, Spring Data JPA, Hibernate, React, Microservices, REST APIs
Data & Messaging: PostgreSQL, Snowflake, Redis, Apache Kafka, Event-Driven Architecture
Cloud & DevOps: Azure (APIM, Key Vault), Docker, Git
GenAI: LangGraph, LangChain, RAG (hybrid search, pgvector), LLM-as-Judge`;
const JD = `Java Backend Developer
Java, Spring Boot, Kafka
Requirements
• 2-5 years building microservices in Java and Spring Boot
• Kafka or RabbitMQ for messaging
• PostgreSQL, Redis
• Kubernetes in production
Nice to have:
Go, GCP`;
const req = (r, met, evidence = '', must = true) => ({ req: r, must, met, evidence });
const answer = (over = {}) => ({
  requirements: [
    req('Java', 'yes', 'Java'),
    req('Spring Boot', 'yes', 'Spring Boot'),
    req('microservices', 'yes', 'Microservices'),
    req('Kafka or RabbitMQ', 'yes', 'Apache Kafka'),
    req('PostgreSQL', 'yes', 'PostgreSQL'),
    req('Kubernetes', 'no'),
    req('Go', 'no', '', false),
  ],
  min_years: 2,
  role: 'backend',
  level: 'mid',
  ...over,
});
const rate = (a, profile = 'backend') => scoreRating(a, { resume: RESUME, jd: JD, profile, experience: a?.min_years == null ? '' : String(a.min_years) + ' years' });

test('the rubric part: worked out from what the model found, with fixed weights (an answer without a relevance is the rubric alone)', () => {
  assert.equal(WEIGHTS.must + WEIGHTS.nice + WEIGHTS.years + WEIGHTS.role + WEIGHTS.level, 100);
  const r = rate(answer());
  // must-haves 5 of 6 met → 50 × 5/6; nice-to-haves 0 of 1; years, role, level full
  assert.equal(r.s, Math.round(50 * (5 / 6) + 0 + 15 + 15 + 10));
  assert.deepEqual(r.m, [5, 6]);
  assert.deepEqual(r.miss, ['Kubernetes']);
  assert.deepEqual(r.have, ['Java', 'Spring Boot', 'microservices', 'Kafka or RabbitMQ', 'PostgreSQL']);
  assert.equal(r.uv, 0);
  assert.equal(r.thin, false);
  assert.equal(r.rel, null);
  assert.equal(r.fit, r.s);
});

test("a claim without proof doesn't count: the quote must be in the resume, word for word", () => {
  const r = rate(answer({
    requirements: [
      req('Java', 'yes', 'Java'),
      req('Kubernetes', 'yes', 'Kubernetes in production'), // that's the JD, not the resume
      req('Spring Boot', 'yes', 'Spring  Boot,'), // case, spacing and punctuation aside, it's there
      req('PostgreSQL', 'partial', 'Postgres DBA'), // made up
    ],
  }));
  assert.equal(r.uv, 2);
  assert.deepEqual(r.miss, ['Kubernetes', 'PostgreSQL']);
  assert.deepEqual(r.m, [2, 4]);
  assert.ok(inResume('python (fastapi)', normText(RESUME)));
  assert.ok(!inResume('Kuber', normText(RESUME)), 'part of a word is not a quote');
  assert.ok(!inResume('', normText(RESUME)));
});

test("a requirement that isn't in the JD is left out, whatever it says", () => {
  const r = rate(answer({ requirements: [...answer().requirements, req('Rust systems programming', 'no'), req('10x ninja', 'yes', 'Java')] }));
  assert.equal(r.inv, 2);
  assert.ok(!r.miss.includes('Rust systems programming'));
  assert.ok(inJob('Kafka or RabbitMQ', normText(JD)));
  assert.ok(inJob('building microservice', normText(JD)), 'plural inflection is permitted');
  assert.ok(inJob('NodeJS', normText('Node.js and React')), 'dots and dashes aside');
  assert.ok(!inJob('Terraform', normText(JD)));
});

test('caps: QA, support or mobile roles; lead roles or 5+ years; a JD naming fewer than 3 requirements', () => {
  assert.equal(rate(answer({ role: 'qa' })).s, 20);
  assert.ok(rate(answer({ role: 'mobile' })).s <= 20);
  assert.ok(rate(answer({ level: 'lead' })).s <= 30);
  assert.ok(rate(answer({ min_years: 6 })).s <= 30);
  const thin = rate(answer({ requirements: [req('Java', 'yes', 'Java'), req('Spring Boot', 'yes', 'Spring Boot')] }));
  assert.equal(thin.thin, true);
  assert.ok(thin.s <= 75, String(thin.s));
});

test('years asked, role and level each move the rating; the lists value roles differently', () => {
  const base = rate(answer()).s;
  assert.ok(rate(answer({ min_years: 3 })).s < base);
  assert.ok(rate(answer({ min_years: 4 })).s <= rate(answer({ min_years: 3 })).s);
  assert.ok(rate(answer({ min_years: null })).s < base && rate(answer({ min_years: null })).s > rate(answer({ min_years: 3 })).s);
  assert.ok(rate(answer({ level: 'senior' })).s < rate(answer({ level: 'junior' })).s);
  assert.ok(rate(answer({ role: 'genai', relevance: 95 }), 'ai').s < RATE.minShow, 'model cannot turn a Java posting into a GenAI match');
  assert.ok(rate(answer({ role: 'backend' }), 'backend').s > rate(answer({ role: 'backend' }), 'ai').s);
});

test('a rating is always 1–100, and an unusable answer gives none', () => {
  assert.equal(rate(null), null);
  assert.equal(rate({ requirements: 'Java' }), null);
  const none = rate(answer({ requirements: [], role: 'support', level: 'lead', min_years: 9 }));
  assert.ok(none.s >= 1 && none.s <= 20);
  const odd = rate({ requirements: [req('Java', 'maybe', 'Java')], min_years: 'two', role: 'wizard', level: 'god' });
  assert.equal(odd.role, 'other');
  assert.equal(odd.lvl, 'mid');
  assert.equal(odd.yrs, null);
  assert.deepEqual(odd.miss, ['Java'], 'an unknown "met" is not met');
});

test("the resume sent leaves out your name and contact lines", () => {
  const raw = `                           Asha Verma

           Software Engineer | Distributed Systems | B.Tech, NIT Warangal
+91 98765 43210 | asha.verma@example.com | linkedin.com/in/asha | github.com/asha

Summary

Software Engineer with 2+ years in Java   and Spring Boot.
National Institute of Technology Warangal | B.Tech, CGPA: 8.11       2020 – 2024`;
  const out = cleanResume(raw);
  assert.ok(!/Asha|@|linkedin|github|98765/.test(out), out);
  assert.match(out, /^Software Engineer \| Distributed Systems/);
  assert.match(out, /2\+ years in Java and Spring Boot\./, 'runs of spaces squeezed');
  assert.match(out, /2020 – 2024/, 'years are not a phone number');
});

test('what the model reads: the JD without its company blurb, after the resume', () => {
  const text = rateText('Requirements\n• Java, Spring Boot\nGood to have: Go\nAbout Us\nWe are a leading SAP partner.');
  assert.match(text, /Java, Spring Boot/);
  assert.match(text, /Nice to have:\nGood to have: Go/);
  assert.doesNotMatch(text, /SAP/);
  assert.ok(rateText('x'.repeat(10_000)).length <= RATE.maxTextChars);
  const input = buildInput({ resume: RESUME, job: { title: 'Java Dev', company: 'Acme', exp: '2-5 Yrs', location: 'Pune' }, text, skills: ['Java', 'Kafka'] });
  assert.ok(input.indexOf('RESUME') < input.indexOf('JOB:'), 'the resume first, so its prefix is cached');
  assert.match(input, /Key skills on the listing: Java, Kafka/);
});

test('the request: Groq chat completions, strict JSON schema on gpt-oss, short reasoning, rules first in one message', () => {
  const b = requestBody({ model: RATE.model, input: 'RESUME…' });
  assert.equal(RATE.model, 'openai/gpt-oss-20b', "not DeepLogLens's gpt-oss-120b: Groq's free limits are per model");
  assert.equal(b.response_format.type, 'json_schema');
  assert.equal(b.response_format.json_schema.strict, true);
  assert.equal(b.reasoning_effort, 'low');
  assert.equal(b.messages.length, 1);
  assert.ok(b.messages[0].content.startsWith(PROFILE_RULES.backend), "the list's own rules first");
  assert.ok(b.messages[0].content.includes(RATE_INSTRUCTIONS));
  assert.ok(requestBody({ model: RATE.model, input: 'x', profile: 'ai' }).messages[0].content.startsWith(PROFILE_RULES.ai));
  const llama = requestBody({ model: 'llama-3.3-70b-versatile', input: 'x' });
  assert.deepEqual(llama.response_format, { type: 'json_object' });
  assert.equal(llama.reasoning_effort, undefined);
  // Strict mode: every field required, no extras, no length or count keywords.
  const walk = (s) => {
    if (s.type === 'object') {
      assert.deepEqual([...s.required].sort(), Object.keys(s.properties).sort());
      assert.equal(s.additionalProperties, false);
      Object.values(s.properties).forEach(walk);
    }
    if (s.items) walk(s.items);
    for (const k of ['maxLength', 'minLength', 'maxItems', 'minItems']) assert.equal(s[k], undefined, k);
  };
  walk(RATE_SCHEMA);
});

test('answers, token counts and waits are read the way Groq sends them', () => {
  assert.equal(outputText({ choices: [{ message: { content: '{"a":1}' } }] }), '{"a":1}');
  assert.equal(outputText({ output: [{ type: 'message', content: [{ type: 'output_text', text: '{}' }] }] }), '{}');
  assert.deepEqual(usageOf({ usage: { prompt_tokens: 3000, completion_tokens: 500, prompt_tokens_details: { cached_tokens: 2048 } } }), { input: 3000, cached: 2048, output: 500 });
  assert.equal(parseWait('2m59.56s'), 179560);
  assert.equal(parseWait('7.66s'), 7660);
  assert.equal(parseWait('1h2m3s'), 3723000);
  assert.equal(parseWait('350ms'), 350);
  assert.equal(parseWait('12'), 12000);
  assert.equal(parseWait('soon'), null);
  assert.equal(parseWait(null), null);
});

test('keys never show: hints only, and error text is scrubbed', () => {
  const key = `gsk_${'A1b2'.repeat(13)}`;
  assert.equal(keyHint(key), '…A1b2');
  const s = scrub(`Invalid API Key ${key} for organization org_01abcDEF in Bearer ${key}`);
  assert.ok(!s.includes(key) && !s.includes('org_01abcDEF'), s);
  assert.notEqual(rateHash(RESUME), rateHash(`${RESUME} `), 'a changed resume means rate again');
});

// ---------------------------------------------------------------- the client and the worker, on a fake Groq

const OK_ANSWER = JSON.stringify(answer());
function fakeGroq(script) {
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    const key = String((init.headers || {}).authorization || '').replace('Bearer ', '');
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ url: String(url), key, body });
    const r = script(key, calls.length, body) || {};
    return new Response(JSON.stringify(r.json ?? { choices: [{ message: { content: OK_ANSWER } }], usage: { prompt_tokens: 1000, completion_tokens: 200, prompt_tokens_details: { cached_tokens: 800 } } }), {
      status: r.status || 200,
      headers: { 'content-type': 'application/json', ...(r.headers || {}) },
    });
  };
  return calls;
}
const KEY = (c) => `gsk_${c.repeat(52)}`;

test("Groq's answers are sorted: a rejected key, a key at its limit, a model it doesn't serve, a bad answer", async () => {
  fakeGroq(() => ({ status: 401, json: { error: { message: `Invalid API Key ${KEY('a')}`, code: 'invalid_api_key' } } }));
  let r = await callGroq({ key: KEY('a'), model: RATE.model, input: 'x' });
  assert.equal(r.kind, 'key');
  assert.ok(!r.msg.includes(KEY('a')), r.msg);
  fakeGroq(() => ({ status: 429, headers: { 'retry-after': '7' }, json: { error: { message: 'Rate limit reached ... tokens per minute (TPM) ... Please try again in 6.5s.' } } }));
  r = await callGroq({ key: KEY('a'), model: RATE.model, input: 'x' });
  assert.deepEqual([r.kind, r.wait, r.day], ['rate', 7000, false]);
  fakeGroq(() => ({ status: 429, json: { error: { message: 'Rate limit reached for model `openai/gpt-oss-20b` in organization `org_x1` on tokens per day (TPD): Limit 200000. Please try again in 23m10.5s.' } } }));
  r = await callGroq({ key: KEY('a'), model: RATE.model, input: 'x' });
  assert.deepEqual([r.kind, r.wait, r.day], ['rate', 1390500, true]);
  assert.ok(!r.msg.includes('org_x1'));
  fakeGroq(() => ({ status: 404, json: { error: { message: 'The model `x` does not exist', code: 'model_not_found' } } }));
  assert.equal((await callGroq({ key: KEY('a'), model: 'x', input: 'x' })).kind, 'model');
  fakeGroq(() => ({ status: 400, json: { error: { message: 'Failed to generate JSON', code: 'json_validate_failed' } } }));
  assert.equal((await callGroq({ key: KEY('a'), model: RATE.model, input: 'x' })).kind, 'answer');
  fakeGroq(() => ({ status: 503 }));
  assert.equal((await callGroq({ key: KEY('a'), model: RATE.model, input: 'x' })).kind, 'transient');
  fakeGroq(() => ({ headers: { 'x-ratelimit-remaining-tokens': '1200', 'x-ratelimit-reset-tokens': '41.2s', 'x-ratelimit-remaining-requests': '998' } }));
  r = await callGroq({ key: KEY('a'), model: RATE.model, input: 'x' });
  assert.equal(r.ok, true);
  assert.equal(r.answer.role, 'backend');
  assert.deepEqual(r.limits, { requestsLeft: 998, requestsReset: null, tokensLeft: 1200, tokensReset: 41200 });
});

test('the keys are taken in turn; one at its per-minute budget rests until Groq says, a rejected one is left out', () => {
  const pool = keyPool([KEY('a'), KEY('b'), KEY('c')], 0);
  const now = 1_000_000;
  assert.deepEqual([pool.take(now).hint, pool.take(now).hint, pool.take(now).hint, pool.take(now).hint], ['…aaaa', '…bbbb', '…cccc', '…aaaa']);
  pool.note(pool.slots[1], { tokensLeft: 900, tokensReset: 30_000 }, now);
  pool.slots[2].dead = 'rejected';
  assert.deepEqual([pool.take(now).hint, pool.take(now).hint], ['…aaaa', '…aaaa']);
  pool.slots[0].until = now + 10_000;
  assert.equal(pool.take(now), null);
  assert.equal(pool.wait(now), 10_000);
  pool.slots[0].dead = 'x';
  pool.slots[1].dead = 'x';
  assert.equal(pool.wait(now), Infinity);
});

const item = (id, profile = 'backend', coverage = 80, post = Date.now()) => ({
  id, profile, post, p: { coverage, rank: 50 }, text: JD, skills: ['Java'], job: { title: 'Java Backend Developer', company: `Co ${id}`, exp: '2-5 Yrs', location: 'Pune' },
});
const counts = () => ({ calls: 0, rated: { backend: 0, ai: 0 }, tokens: { input: 0, cached: 0, output: 0 }, fails: 0, last: null });
const RESUMES = { sde: RESUME, genai: `${RESUME}\nGenAI first` };

test('the worker moves past a rejected key and a busy one, best-ranked job first, the right resume for each list', async () => {
  const calls = fakeGroq((key) => {
    if (key === KEY('b')) return { status: 401, json: { error: { message: 'Invalid API Key' } } };
    if (key === KEY('c')) return { status: 429, headers: { 'retry-after': '120' }, json: { error: { message: 'Rate limit reached ... (TPM)' } } };
    return null;
  });
  const queue = [item('low', 'backend', 61), item('top', 'backend', 95), item('mid', 'backend', 75), item('ai1', 'ai', 90)];
  const c = counts();
  const rated = [];
  const rater = startRater(queue, {
    keys: [KEY('b'), KEY('a'), KEY('c'), KEY('d')], model: RATE.model, resumes: RESUMES, callsPerDay: 100, counts: c,
    onRated: (it, ai) => rated.push([it.id, ai.s]),
  });
  await rater.drain(20_000);
  assert.equal(rater.problem, null, JSON.stringify(rater.problem));
  assert.deepEqual(rated.map(([id]) => id).sort(), ['ai1', 'low', 'mid', 'top']);
  assert.ok(rated.every(([, s]) => s >= 1 && s <= 100));
  assert.equal(rater.pool.slots[0].deadKind, 'rejected', 'the rejected key is left out');
  assert.ok(rater.pool.slots[2].until > Date.now() + 60_000, 'the busy key rests as long as Groq says');
  assert.equal(calls.filter((x) => x.key === KEY('b')).length, 1, 'a rejected key is not tried again');
  assert.equal(c.calls, calls.length);
  assert.ok(c.tokens.cached > 0);
  assert.ok(calls.find((x) => x.body.messages[0].content.startsWith(PROFILE_RULES.ai) && (x.key === KEY('a') || x.key === KEY('d'))), 'an AI-list job is rated against the GenAI resume');
});

test("the day's call cap: no more Groq calls than the settings allow; the best jobs get them", async () => {
  const calls = fakeGroq(() => null);
  const queue = [item('low', 'backend', 61), item('top', 'backend', 95), item('mid', 'backend', 75)];
  const rated = [];
  const c = counts();
  const rater = startRater(queue, { keys: [KEY('a')], model: RATE.model, resumes: RESUMES, callsPerDay: 2, counts: c, onRated: (it) => rated.push(it.id) });
  await rater.drain(20_000);
  assert.deepEqual(rated, ['top', 'mid']);
  assert.equal(calls.length, 2);
  assert.deepEqual(queue.map((i) => i.id), ['low'], 'the rest wait for tomorrow');
  assert.equal(RATE.callsPerDay, 750, '750 a browser: 1,500 a day with two');
});

test('a key at its limit rests longer each time; 429 for 5 minutes running retires it for an hour, and with every key retired the run pauses until the first is back', async () => {
  const calls = fakeGroq(() => ({ status: 429, json: { error: { message: 'Rate limit reached on tokens per minute (TPM). Please try again in 0.01s.' } } }));
  const rater = startRater([item('x')], { keys: [KEY('a')], model: RATE.model, resumes: RESUMES, callsPerDay: 100, counts: counts(), onRated: () => {}, limitBaseMs: 100, limitStopMs: 1000 });
  await rater.drain(10_000);
  assert.equal(rater.problem && rater.problem.kind, 'retired');
  const slot = rater.pool.slots[0];
  assert.equal(slot.deadKind, 'retired');
  assert.ok(slot.day.retiredUntil > Date.now() + 59 * 60_000 && slot.day.retiredUntil <= Date.now() + 60 * 60_000, 'for an hour');
  assert.equal(rater.problem.until, slot.day.retiredUntil, 'the run pauses until the key is back');
  assert.match(rater.problem.msg, /pauses until/);
  assert.ok(calls.length >= 3 && calls.length <= 6, `backed off: ${calls.length} tries`);

  // Later (another run, same day's tally): still retired, not called at all; an hour later it's back.
  const ledger = { [slot.hint]: slot.day };
  const c2 = fakeGroq(() => null);
  const again = startRater([item('y')], { keys: [KEY('a')], model: RATE.model, resumes: RESUMES, callsPerDay: 100, counts: { ...counts(), keys: ledger }, onRated: () => {} });
  await again.drain(5_000);
  assert.equal(c2.length, 0, 'a retired key is left alone in the next run');
  assert.equal(again.problem.kind, 'retired');
  slot.day.retiredUntil = Date.now() - 1; // the hour is over
  const rated = [];
  const back = startRater([item('z')], { keys: [KEY('a')], model: RATE.model, resumes: RESUMES, callsPerDay: 100, counts: { ...counts(), keys: ledger }, onRated: (it) => rated.push(it.id) });
  await back.drain(5_000);
  assert.deepEqual(rated, ['z']);
  assert.equal(back.problem, null);
  assert.equal(ledger[slot.hint].retiredUntil, 0);
});

test('one key retired, another fine: the run carries on with the other; a 429 under 5 minutes never retires', async () => {
  fakeGroq((key) => (key === KEY('a') ? { status: 429, json: { error: { message: 'tokens per minute (TPM). Please try again in 0.01s.' } } } : null));
  const rated = [];
  const r = startRater([item('p'), item('q'), item('r')], { keys: [KEY('a'), KEY('b')], model: RATE.model, resumes: RESUMES, callsPerDay: 100, counts: counts(), onRated: (it) => rated.push(it.id), limitBaseMs: 50, limitStopMs: 300 });
  await r.drain(20_000);
  assert.deepEqual(rated.sort(), ['p', 'q', 'r']);
  assert.equal(r.problem, null);
  // Short 429 spells (under the retire time) only rest the key.
  fakeGroq((key, n) => (n === 1 ? { status: 429, json: { error: { message: 'tokens per minute (TPM). Please try again in 0.01s.' } } } : null));
  const ok = [];
  const r2 = startRater([item('s')], { keys: [KEY('c')], model: RATE.model, resumes: RESUMES, callsPerDay: 100, counts: counts(), onRated: (it) => ok.push(it.id), limitBaseMs: 50 });
  await r2.drain(20_000);
  assert.deepEqual(ok, ['s']);
  assert.equal(r2.pool.slots[0].deadKind, null);
  assert.ok(!r2.pool.slots[0].day.retiredUntil);
});

test('every key rejected, or at its daily limit: the worker stops and says why', async () => {
  fakeGroq(() => ({ status: 401, json: { error: { message: 'Invalid API Key' } } }));
  let rater = startRater([item('x')], { keys: [KEY('a'), KEY('b')], model: RATE.model, resumes: RESUMES, callsPerDay: 10, counts: counts(), onRated: () => {} });
  await rater.drain(10_000);
  assert.equal(rater.problem && rater.problem.kind, 'key');
  fakeGroq(() => ({ status: 429, json: { error: { message: 'tokens per day (TPD): Limit 200000. Please try again in 2h0m0s.' } } }));
  rater = startRater([item('y')], { keys: [KEY('a')], model: RATE.model, resumes: RESUMES, callsPerDay: 10, counts: counts(), onRated: () => {} });
  await rater.drain(10_000);
  assert.equal(rater.problem && rater.problem.kind, 'quota');
});

test("each key stays under 70% of Groq's free limits: a minute's tokens and requests, a day's, and what Groq's headers say", () => {
  const ledger = {};
  const pool = keyPool([KEY('a')], 0, ledger);
  assert.deepEqual(pool.cap, { rpm: 21, tpm: 5600, rpd: 700, tpd: 140000 });
  const now = 5_000_000;
  const s = pool.take(now);
  pool.used(s, { input: 3000, cached: 0, output: 300 }, now); // 3,300 counted
  assert.equal(pool.take(now), null, 'another 2,800 or so would pass 5,600 tokens this minute');
  assert.equal(pool.slots[0].until, now + 60_000, 'it rests until that call leaves the minute');
  assert.ok(pool.take(now + 60_001));
  pool.used(s, { input: 2000, cached: 1800, output: 200 }, now + 60_001); // cached tokens don't count: 400
  assert.equal(ledger['…aaaa'].tok, 3700);
  assert.equal(ledger['…aaaa'].req, 2, "the day's tally is kept per key");
  ledger['…aaaa'].req = 700;
  assert.equal(pool.take(now + 200_000), null);
  assert.equal(pool.slots[0].deadKind, 'budget', "700 requests: done for the day");
  const p2 = keyPool([KEY('b')], 0, {});
  p2.note(p2.slots[0], { requestsLeft: 250, tokensLeft: 8000 }, now);
  assert.equal(p2.slots[0].deadKind, 'budget', "Groq says under 30% of the day's requests are left (another browser used them)");
  const p3 = keyPool([KEY('c')], 0, {});
  p3.note(p3.slots[0], { requestsLeft: 900, tokensLeft: 2000, tokensReset: 15_000 }, now);
  assert.equal(p3.slots[0].until, now + 15_000, "under 30% of the minute's tokens left: it rests until Groq's reset");
});

test('the queue between runs: the last 48 hours, not rated yet, best first, no repeats', () => {
  const now = Date.now();
  const hash = { backend: 'h1', ai: 'h2' };
  const out = pruneQueue([item('old', 'backend', 99, now - 50 * 3_600_000), item('a', 'backend', 70), item('b', 'backend', 90), item('a', 'backend', 70), item('done')], {
    now, rated: { done: { h: 'h1' } }, hash,
  });
  assert.deepEqual(out.map((i) => i.id), ['b', 'a']);
  assert.deepEqual(pruneQueue([item('done')], { now, rated: { done: { h: 'old-resume' } }, hash }).map((i) => i.id), ['done'], 'a changed resume: rated again');
});

test("the list's strict rules: the model's relevance is 55% of the rating, a never-wanted job 15 at most", () => {
  const fit = rate(answer()).s;
  const r = rate(answer({ relevance: 90, reject: false, why: 'A Java backend role.' }));
  assert.equal(r.rel, 90);
  assert.equal(r.fit, fit);
  assert.equal(r.s, Math.round(0.55 * 90 + 0.45 * fit));
  assert.equal(r.why, 'A Java backend role.');
  const gardener = rate(answer({ relevance: 70, reject: true, why: 'Not a software job.' }));
  assert.equal(gardener.rej, true);
  assert.ok(gardener.s <= RATE.rejectCap);
  const vague = rate(answer({ relevance: 10, reject: false }));
  assert.ok(vague.s < RATE.minShow, 'a low relevance keeps it off your site, however well the skills match');
  for (const p of ['backend', 'ai']) {
    assert.match(PROFILE_RULES[p], /NEVER WANTED/);
    assert.match(PROFILE_RULES[p], /gardener|operator|biomedical/i);
    assert.match(PROFILE_RULES[p], /NICE CXone|IVR/);
    assert.ok(instructionsFor(p).endsWith(RATE_INSTRUCTIONS));
  }
  assert.match(PROFILE_RULES.ai, /Python developer role with no LLM, RAG or agent work[^.]*: 35 at most/);
  assert.match(PROFILE_RULES.backend, /Node.js or MERN/);
});

test('pay: the salary shown, else the web lookup, without unsourced model estimates; a top under 18 LPA caps it at 35', () => {
  assert.deepEqual(payMatch({}), { lo: null, hi: null, from: null, ok: 'unknown' });
  for (const [hi, band] of [[17.99, 'low'], [18, 'flex'], [19.9, 'flex'], [20, 'close'], [24.9, 'close'], [25, 'ok']]) {
    assert.equal(payMatch({ posted: {lo: 15, hi} }).ok, band);
  }
  assert.equal(payMatch({ posted: { lo: 18, hi: 30 }, web: { lo: 8, hi: 12 } }).from, 'posted');
  assert.equal(payMatch({ web: { lo: 22, hi: 28 } }).ok, 'ok');
  assert.equal(payMatch({ web: { lo: 18, hi: 22 } }).ok, 'close');
  assert.equal(payMatch({ model: { lo: 5, hi: 9 } }).ok, 'low');
  const high = answer({ relevance: 95, reject: false });
  assert.ok(rate(high).s > 80);
  const cheap = scoreRating(high, { resume: RESUME, jd: JD, profile: 'backend', web: { lo: 6, hi: 10 } });
  assert.equal(cheap.pay.from, 'web');
  assert.equal(cheap.s, RATE.lowPayCap);
  const known = rate(answer({ relevance: 95, reject: false, pay_low: 7, pay_high: 11, pay_known: true }));
  assert.equal(known.pay.from, null);
  assert.ok(known.s > RATE.lowPayCap);
  const guess = rate(answer({ relevance: 95, reject: false, pay_low: 7, pay_high: 11, pay_known: false }));
  assert.equal(guess.pay.from, null, 'an unsupported pay estimate stays unknown');
  assert.ok(guess.s > 80, '…but never held against the job');
  assert.deepEqual(payFromAnswer(firstJson('Found it. {"low": 14, "high": 22, "sources": ["AmbitionBox", "Glassdoor"], "reports": 40, "same_company": true, "note": "SDE 1"} ok')),
    { lo: 14, hi: 22, src: 'web', n: 40, sources: ['AmbitionBox', 'Glassdoor'], same: true, note: 'SDE 1' });
  assert.equal(payFromAnswer(firstJson('{"low": 14, "high": 22, "source": "AmbitionBox"}')).same, false, 'the model must say it is the same company');
  assert.equal(payFromAnswer(firstJson('{"low": null, "high": null, "source": "none", "note": ""}')), null);
  const b = payRequestBody({ model: RATE.model, company: 'Acme' });
  assert.deepEqual(b.tools, [{ type: 'browser_search' }]);
  assert.equal(b.response_format, undefined, "plain text: the tool and a JSON schema don't mix");
});

test("each rating keeps the prompt it was sent (your resume left out) and the model's raw answer", () => {
  const input = buildInput({ resume: RESUME, job: { title: 'Java Dev', company: 'Acme', exp: '2-5 Yrs', location: 'Pune', salary: '20-30 Lacs PA' }, text: JD });
  assert.match(input, /Salary shown: 20-30 Lacs PA/);
  const d = dbgOf({ profile: 'backend', input, resume: RESUME, raw: '{"relevance": 90}', model: RATE.model, pay: 'Pay lookup: …' });
  assert.ok(d.p.startsWith(PROFILE_RULES.backend));
  assert.ok(!d.p.includes(RESUME), 'the resume itself is left out');
  assert.match(d.p, /\[your Backend resume, \d+ characters/);
  assert.match(d.p, /Title: Java Dev/);
  assert.equal(d.o, '{"relevance": 90}');
  assert.equal(d.pay, 'Pay lookup: …');
});

test("a company's pay is looked up on the web once (browser_search), before its jobs are rated; a refused tool doesn't stop the rating", async () => {
  const calls = fakeGroq((key, n, body) => (body.tools
    ? { json: { choices: [{ message: { content: 'From AmbitionBox and Glassdoor: {"low": 7, "high": 11, "sources": ["AmbitionBox", "Glassdoor"], "reports": 80, "same_company": true, "note": "SDE 1, 2 yrs"}' } }], usage: { prompt_tokens: 600, completion_tokens: 100 } } }
    : { json: { choices: [{ message: { content: JSON.stringify(answer({ relevance: 92, reject: false, why: 'Java backend.' })) } }], usage: { prompt_tokens: 1000, completion_tokens: 200 } } }));
  const payCache = {};
  const got = [];
  const queue = [item('a1'), item('a2'), item('b1')];
  queue[1].job = { ...queue[1].job, company: 'Co a1 Pvt Ltd' }; // the same company as a1
  const c = counts();
  const rater = startRater(queue, {
    keys: [KEY('a'), KEY('b')], model: RATE.model, resumes: RESUMES, callsPerDay: 100, counts: c, payCache, payPerDay: 10,
    onRated: (it, ai, dbg) => got.push({ id: it.id, ai, dbg }),
  });
  await rater.drain(20_000);
  assert.equal(rater.problem, null, JSON.stringify(rater.problem));
  assert.deepEqual(Object.keys(payCache).sort(), ['co-a1', 'co-b1']);
  assert.equal(calls.filter((x) => x.body.tools).length, 2, 'one lookup per company: ' + JSON.stringify(calls.filter((x) => x.body.tools).map((x) => x.body.messages[0].content.match(/what "([^"]+)"/)[1])));
  assert.equal(c.pay.calls, 2);
  assert.equal(got.length, 3);
  for (const g of got) {
    assert.equal(g.ai.pay.from, 'web');
    assert.equal(g.ai.s, RATE.lowPayCap, 'its pay tops out at 11 LPA');
    assert.match(g.dbg.p, /^THE CANDIDATE/);
    assert.match(g.dbg.o, /"relevance":92/);
    assert.match(g.dbg.pay, /AmbitionBox/);
  }

  fakeGroq((key, n, body) => (body.tools ? { status: 400, json: { error: { message: 'tool browser_search is not supported' } } } : null));
  const got2 = [];
  const c2 = counts();
  const r2 = startRater([item('x1'), item('x2')], { keys: [KEY('a')], model: RATE.model, resumes: RESUMES, callsPerDay: 100, counts: c2, payCache: {}, payPerDay: 10, onRated: (it) => got2.push(it.id) });
  await r2.drain(20_000);
  assert.deepEqual(got2.sort(), ['x1', 'x2']);
  assert.equal(c2.pay.calls, 1, 'after a refusal, no more lookups this run');
  assert.match(c2.pay.off.msg, /not supported/);
});

test('pay lookups: a fresh one is reused, an old one (30+ days) is redone, none past the day cap, and a 429 rests the key and tries again', async () => {
  const PAY = { json: { choices: [{ message: { content: '{"low": 26, "high": 40, "sources": ["levels.fyi", "AmbitionBox"], "reports": 60, "same_company": true, "note": ""}' } }], usage: { prompt_tokens: 100, completion_tokens: 20 } } };
  // A fresh entry is reused; an entry 31 days old is looked up again.
  let calls = fakeGroq((key, n, body) => (body.tools ? PAY : null));
  const old = Date.now() - 31 * 86_400_000;
  const cache = { 'co-f1': { lo: 30, hi: 45, t: Date.now(), raw: 'fresh' }, 'co-o1': { lo: 5, hi: 6, t: old, raw: 'old' } };
  const got = {};
  let r = startRater([item('f1'), item('o1')], { keys: [KEY('a')], model: RATE.model, resumes: RESUMES, callsPerDay: 100, counts: counts(), payCache: cache, payPerDay: 10, onRated: (it, ai) => { got[it.id] = ai; } });
  await r.drain(20_000);
  assert.equal(calls.filter((c) => c.body.tools).length, 1, 'only the old one is looked up');
  assert.match(calls.find((c) => c.body.tools).body.messages[0].content, /"Co o1"/);
  assert.deepEqual([got.f1.pay.hi, got.o1.pay.hi], [45, 40]);
  assert.ok(cache['co-o1'].t > old);

  // The day's lookups are used: jobs are still rated, from what's known.
  calls = fakeGroq(() => null);
  const c = counts();
  c.pay = { calls: 10, found: 10 };
  const rated = [];
  r = startRater([item('n1')], { keys: [KEY('a')], model: RATE.model, resumes: RESUMES, callsPerDay: 100, counts: c, payCache: {}, payPerDay: 10, onRated: (it, ai) => rated.push(ai) });
  await r.drain(20_000);
  assert.equal(calls.filter((x) => x.body.tools).length, 0);
  assert.equal(rated.length, 1);
  assert.equal(rated[0].pay.from, null);

  // A 429 on a lookup (a web search costs far more tokens than a rating): lookups are off for the run,
  // the jobs are rated without them, and the key is never retired for it.
  calls = fakeGroq((key, n, body) => (body.tools ? { status: 429, json: { error: { message: 'Rate limit reached on tokens per minute (TPM). Please try again in 0.05s.' } } } : null));
  const done = [];
  const c3 = counts();
  r = startRater([item('r1'), item('r2'), item('r3')], { keys: [KEY('a')], model: RATE.model, resumes: RESUMES, callsPerDay: 100, counts: c3, payCache: {}, payPerDay: 10, onRated: (it, ai) => done.push(ai), limitBaseMs: 50, limitStopMs: 100 });
  await r.drain(20_000);
  assert.equal(r.problem, null, JSON.stringify(r.problem));
  assert.equal(calls.filter((x) => x.body.tools).length, 3, 'three refusals in a row, then no more lookups this run');
  assert.equal(done.length, 3, 'every job is still rated');
  assert.equal(done[0].pay.from, null);
  assert.match(c3.pay.off.msg, /web lookups hit Groq's limit/);
  assert.ok(!r.pool.slots[0].day.retiredUntil, 'a lookup never retires a key');

  // The radar's own pay figure: no web lookups at all.
  calls = fakeGroq(() => null);
  const radar = [];
  r = startRater([item('p1')], { keys: [KEY('a')], model: RATE.model, resumes: RESUMES, callsPerDay: 100, counts: counts(), payCache: {}, payFor: () => ({ lo: 12, hi: 12 }), onRated: (it, ai) => radar.push(ai) });
  await r.drain(20_000);
  assert.equal(calls.filter((x) => x.body.tools).length, 0);
  assert.equal(radar[0].pay.from, 'web');
  assert.equal(radar[0].pay.ok, 'low');
});

test('an AI-list job gets the AI prompt and the GenAI resume; a backend job the Backend prompt', async () => {
  const calls = fakeGroq(() => null);
  const r = startRater([item('b', 'backend'), item('g', 'ai')], { keys: [KEY('a'), KEY('b')], model: RATE.model, resumes: RESUMES, callsPerDay: 100, counts: counts(), onRated: () => {} });
  await r.drain(20_000);
  const ai = calls.find((c) => c.body.messages[0].content.includes('Company: Co g'));
  const be = calls.find((c) => c.body.messages[0].content.includes('Company: Co b'));
  assert.ok(ai.body.messages[0].content.startsWith(PROFILE_RULES.ai) && !ai.body.messages[0].content.includes('GenAI first'));
  assert.ok(be.body.messages[0].content.startsWith(PROFILE_RULES.backend) && !be.body.messages[0].content.includes('GenAI first'));
});

test('only the selected summary reaches the model and ungrounded requirements cannot promote a job', async () => {
  const resumes = {sde: RESUME + '\nPrivate backend detail 781', genai: 'Python FastAPI LangGraph RAG\nPrivate AI detail 249'};
  const calls = fakeGroq(() => null);
  const rater = startRater([item('j'), item('g', 'ai')], { keys: [KEY('a')], model: RATE.model, resumes, callsPerDay: 10, counts: counts(), onRated() {} });
  await rater.drain(20000);
  const messages = calls.filter((c) => !c.body.tools).map((c) => c.body.messages[0].content);
  assert.equal(messages.length, 2);
  for (const [key, profile, company] of [['sde', 'backend', 'Co j'], ['genai', 'ai', 'Co g']]) {
    const prompt = messages.find((m) => m.includes('Company: ' + company));
    assert.ok(prompt.includes(profileSummary(resumes[key], profile)));
    assert.doesNotMatch(prompt, /Private (?:backend|AI) detail/);
  }
  const claimed = answer({relevance: 100, requirements: [req('Kubernetes', 'yes', 'Java'), req('Quantum microservices', 'yes', 'Microservices')]});
  const checked = rate(claimed);
  assert.equal(checked.inv, 1);
  assert.equal(checked.uv, 1);
  assert.equal(rate(answer({ requirements: [req('Kubernetes', 'partial', 'Spring Boot')] })).uv, 1);
  assert.ok(checked.s < RATE.minShow);
  assert.ok(rate(answer({relevance: 100, role: 'frontend'})).s < RATE.minShow);
  assert.ok(rate(answer({relevance: 69})).s < RATE.minShow);
});
