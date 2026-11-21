// Unit tests for the job finder's AI rating: its rules (rate-lib.js) and its Groq client, key
// rotation and worker (rate.js), against a fake fetch. Nothing here calls Groq.
// Run: node --test extensions/naukri-refresher-dev/
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RATE, RATE_SCHEMA, RATE_INSTRUCTIONS, WEIGHTS, scoreRating, cleanResume, rateText, buildInput, requestBody, outputText, usageOf, parseWait,
  normText, inJob, inResume, rateHash, keyHint, scrub,
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
const rate = (a, profile = 'backend') => scoreRating(a, { resume: RESUME, jd: JD, profile });

test('the rating is worked out from what the model found, with fixed weights; the model gives no number', () => {
  assert.equal(WEIGHTS.must + WEIGHTS.nice + WEIGHTS.years + WEIGHTS.role + WEIGHTS.level, 100);
  const r = rate(answer());
  // must-haves 5 of 6 met → 50 × 5/6; nice-to-haves 0 of 1; years, role, level full
  assert.equal(r.s, Math.round(50 * (5 / 6) + 0 + 15 + 15 + 10));
  assert.deepEqual(r.m, [5, 6]);
  assert.deepEqual(r.miss, ['Kubernetes']);
  assert.deepEqual(r.have, ['Java', 'Spring Boot', 'microservices', 'Kafka or RabbitMQ', 'PostgreSQL']);
  assert.equal(r.uv, 0);
  assert.equal(r.thin, false);
  assert.ok(!/score|rating/i.test(JSON.stringify(RATE_SCHEMA)), 'the answer has no score field');
  assert.match(RATE_INSTRUCTIONS, /never give an overall score/);
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
  assert.ok(inJob('building microservice', normText(JD)), 'the first 5 letters of a word will do');
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
  assert.ok(rate(answer({ min_years: 4 })).s < rate(answer({ min_years: 3 })).s);
  assert.ok(rate(answer({ min_years: null })).s < base && rate(answer({ min_years: null })).s > rate(answer({ min_years: 3 })).s);
  assert.ok(rate(answer({ level: 'senior' })).s < rate(answer({ level: 'junior' })).s);
  assert.ok(rate(answer({ role: 'genai' }), 'ai').s > rate(answer({ role: 'genai' }), 'backend').s, 'GenAI work fits the AI list best');
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
  assert.ok(b.messages[0].content.startsWith(RATE_INSTRUCTIONS));
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
    return new Response(JSON.stringify(r.json ?? { choices: [{ message: { content: OK_ANSWER } }], usage: { prompt_tokens: 3000, completion_tokens: 400, prompt_tokens_details: { cached_tokens: 2000 } } }), {
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

test('the worker rates the best-ranked jobs first, moves past a rejected or busy key, and keeps to the daily cap', async () => {
  const calls = fakeGroq((key) => {
    if (key === KEY('b')) return { status: 401, json: { error: { message: 'Invalid API Key' } } };
    if (key === KEY('c')) return { status: 429, headers: { 'retry-after': '120' }, json: { error: { message: 'Rate limit reached ... (TPM)' } } };
    return null;
  });
  const queue = [item('low', 'backend', 61), item('top', 'backend', 95), item('mid', 'backend', 75), item('ai1', 'ai', 90)];
  const c = counts();
  const rated = [];
  const rater = startRater(queue, {
    keys: [KEY('b'), KEY('a'), KEY('c')], model: RATE.model, resumes: RESUMES, perDay: 2, counts: c,
    onRated: (it, ai) => rated.push([it.id, ai.s]),
  });
  await rater.drain(20_000);
  assert.equal(rater.problem, null, JSON.stringify(rater.problem));
  assert.deepEqual(rated.map(([id]) => id).filter((id) => id !== 'ai1').sort(), ['mid', 'top'], 'the best two, two a day on the Backend list');
  assert.ok(rated.some(([id]) => id === 'ai1'), 'the AI list has its own cap');
  assert.deepEqual(queue.map((i) => i.id), ['low'], 'what the cap held back waits');
  assert.ok(rated.every(([, s]) => s >= 1 && s <= 100));
  assert.equal(rater.pool.slots[0].dead !== null, true, 'the rejected key is left out');
  assert.ok(rater.pool.slots[2].until > Date.now() + 60_000, 'the busy key rests');
  assert.ok(calls.filter((x) => x.key === KEY('b')).length === 1, 'a rejected key is not tried again');
  assert.equal(c.rated.backend, 2);
  assert.equal(c.tokens.cached > 0, true);
  const sentResume = calls.find((x) => x.key === KEY('a') && /GenAI first/.test(x.body.messages[0].content));
  assert.ok(sentResume, 'an AI-list job is rated against the GenAI resume');
});

test('every key rejected, or every key at its limit for long: the worker stops and says why', async () => {
  fakeGroq(() => ({ status: 401, json: { error: { message: 'Invalid API Key' } } }));
  let rater = startRater([item('x')], { keys: [KEY('a'), KEY('b')], model: RATE.model, resumes: RESUMES, perDay: 10, counts: counts(), onRated: () => {} });
  await rater.drain(10_000);
  assert.equal(rater.problem && rater.problem.kind, 'key');
  fakeGroq(() => ({ status: 429, json: { error: { message: 'tokens per day (TPD): Limit 200000. Please try again in 2h0m0s.' } } }));
  rater = startRater([item('y')], { keys: [KEY('a')], model: RATE.model, resumes: RESUMES, perDay: 10, counts: counts(), onRated: () => {} });
  await rater.drain(10_000);
  assert.equal(rater.problem && rater.problem.kind, 'quota');
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
