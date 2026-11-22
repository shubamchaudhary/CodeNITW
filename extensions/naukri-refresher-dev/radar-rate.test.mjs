// The radar's AI rating (scripts/radar/rate.mjs): the finder's rules, for the radar's own openings,
// against a fake Groq. Nothing here calls Groq.
// Run: node --test extensions/naukri-refresher-dev/
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { rateOpenings, payFigure, stackOfJob } from '../../scripts/radar/rate.mjs';
import { RATE, RATE_VERSION } from '../naukri-refresher/rate-lib.js';

const RESUME = `Software Engineer | Distributed Systems, Microservices, GenAI
Summary
Software Engineer with 2+ years in Java, Spring Boot, PostgreSQL, Azure, Redis and GenAI at Blue Yonder.
Technical Skills
Languages: Java, Python (FastAPI), SQL
Frameworks: Spring Boot, Spring Data JPA, Hibernate, Microservices, REST APIs
Data & Messaging: PostgreSQL, Redis, Apache Kafka
GenAI: LangGraph, LangChain, RAG (hybrid search, pgvector)`;
const JAVA_JD = `We build payments.
Requirements
- 2-5 years building microservices in Java and Spring Boot
- Kafka for messaging, PostgreSQL and Redis
- REST APIs, Docker, CI/CD
- Write clean, tested code and own services in production end to end with the team.`;
const MERN_JD = `Requirements
- 2+ years with MongoDB, Express, React and Node.js (MERN)
- Build REST APIs in Node.js and Express, React frontends with Redux
- MongoDB schema design, JavaScript and TypeScript
- Deploy on AWS; write clean code with the team every day.`;

const ANSWER = JSON.stringify({
  relevance: 91, reject: false, why: 'A Java and Spring Boot backend role.',
  requirements: [
    { req: 'Java', must: true, met: 'yes', evidence: 'Java' },
    { req: 'Spring Boot', must: true, met: 'yes', evidence: 'Spring Boot' },
    { req: 'Kafka', must: true, met: 'yes', evidence: 'Apache Kafka' },
    { req: 'PostgreSQL', must: true, met: 'yes', evidence: 'PostgreSQL' },
  ],
  min_years: 2, role: 'backend', level: 'mid', pay_low: null, pay_high: null, pay_known: false,
});

test("the radar's openings get the finder's rating; a wrong stack is marked; the prompt and answer come back once", async () => {
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push(JSON.parse(init.body));
    return new Response(JSON.stringify({ choices: [{ message: { content: ANSWER } }], usage: { prompt_tokens: 900, completion_tokens: 150 } }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const dir = mkdtempSync(join(tmpdir(), 'radar-rate-'));
  const java = { key: 'k1', j: { title: 'Backend Engineer', company: 'Orbit', desc: JAVA_JD }, entry: { matchScore: 80, pay: { verdict: 'likely' } } };
  const mern = { key: 'k2', j: { title: 'MERN Stack Developer', company: 'Zeta', desc: MERN_JD }, entry: { matchScore: 40 } };
  const cheap = { key: 'k3', j: { title: 'Java Developer', company: 'Low Co', desc: JAVA_JD }, entry: { matchScore: 80, pay: { verdict: 'unlikely' } } };
  const env = { GROQ_API_KEYS: `gsk_${'a'.repeat(52)},gsk_${'b'.repeat(52)}` };
  const r = await rateOpenings([java, mern, cheap], { env, stateDir: dir, resumeTexts: [RESUME, RESUME], log: () => {} });
  assert.equal(r.rated, 2);
  assert.equal(calls.length, 2, 'no call for the wrong stack');
  assert.ok(calls.every((b) => !b.tools), 'no web lookups: the radar has its own pay check');
  assert.equal(mern.entry.stackOut && typeof mern.entry.stackOut, 'string');
  assert.equal(java.entry.ai.v, RATE_VERSION);
  assert.equal(java.entry.ai.rel, 91);
  assert.ok(java.entry.ai.s >= RATE.minShow);
  assert.equal(java.entry.ai.pay.from, 'web');
  assert.equal(cheap.entry.ai.s, RATE.lowPayCap, "levels.fyi: even its top 10% earn under 25L");
  assert.equal(java.entry.jdText, undefined, 'the working copy goes once rated');
  assert.match(r.dbg.get('k1').p, /^THE CANDIDATE/);
  assert.ok(existsSync(join(dir, 'rate-state.json')));

  const again = await rateOpenings([java], { env, stateDir: dir, resumeTexts: [RESUME, RESUME], log: () => {} });
  assert.equal(again.calls, 0, 'rated once');
  assert.equal((await rateOpenings([java], { env: {}, stateDir: dir, resumeTexts: [RESUME], log: () => {} })).why, 'no GROQ_API_KEYS in .radar/.env');
});

test('pay figures from the radar and the stack of a job', () => {
  assert.deepEqual(payFigure({ verdict: 'unlikely' }), { lo: 18, hi: 18 });
  assert.equal(payFigure({ verdict: 'unknown' }), null);
  assert.equal(stackOfJob('Java Developer', JAVA_JD).profile, 'backend');
});

test('the radar: rated again when the resume changes; nothing past the day cap; a short description waits', async () => {
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push(1);
    return new Response(JSON.stringify({ choices: [{ message: { content: ANSWER } }], usage: { prompt_tokens: 900, completion_tokens: 150 } }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const dir = mkdtempSync(join(tmpdir(), 'radar-rate-'));
  const env = { GROQ_API_KEYS: `gsk_${'a'.repeat(52)}`, RADAR_RATE_PER_DAY: '1' };
  const a = { key: 'a', j: { title: 'Java Developer', company: 'A', desc: JAVA_JD }, entry: { matchScore: 80 } };
  const b = { key: 'b', j: { title: 'Java Developer', company: 'B', desc: JAVA_JD }, entry: { matchScore: 70 } };
  const short = { key: 's', j: { title: 'Java Developer', company: 'S', desc: 'Java.' }, entry: { matchScore: 70 } };
  let r = await rateOpenings([a, b, short], { env, stateDir: dir, resumeTexts: [RESUME, RESUME], log: () => {} });
  assert.equal(r.calls, 1, 'RADAR_RATE_PER_DAY caps the calls');
  assert.equal(calls.length, 1);
  assert.equal(short.entry.ai, undefined);
  const waiting = [a, b].find((x) => !x.entry.ai);
  assert.ok(waiting.entry.jdText, 'the unrated one keeps its text for the next run');
  r = await rateOpenings([b], { env, stateDir: dir, resumeTexts: [RESUME, RESUME], log: () => {} });
  assert.match(r.why, /calls are used|nothing new/);
  // A new resume: rated again (another day's budget).
  const env2 = { ...env, RADAR_RATE_PER_DAY: '10' };
  const before = calls.length;
  const rated = [a, b].find((x) => x.entry.ai);
  await rateOpenings([rated], { env: env2, stateDir: mkdtempSync(join(tmpdir(), 'radar-rate-')), resumeTexts: [`${RESUME}\nNew line`, RESUME], log: () => {} });
  assert.equal(calls.length, before + 1, 'a changed resume means rated again');
});

test('the radar: --rerate rates everything again, and a key retired in one run stays out of the next', async () => {
  let n = 0;
  let mode = 'ok';
  globalThis.fetch = async () => {
    n += 1;
    if (mode === 'limit') return new Response(JSON.stringify({ error: { message: 'tokens per minute (TPM). Please try again in 0.01s.' } }), { status: 429, headers: { 'content-type': 'application/json' } });
    return new Response(JSON.stringify({ choices: [{ message: { content: ANSWER } }], usage: { prompt_tokens: 900, completion_tokens: 150 } }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const dir = mkdtempSync(join(tmpdir(), 'radar-rate-'));
  const env = { GROQ_API_KEYS: `gsk_${'a'.repeat(52)}`, RADAR_RATE_PER_DAY: '50' };
  const a = { key: 'a', j: { title: 'Java Developer', company: 'A', desc: JAVA_JD }, entry: { matchScore: 80 } };
  const opts = { env, stateDir: dir, resumeTexts: [RESUME, RESUME], log: () => {} };
  await rateOpenings([a], opts);
  assert.equal(n, 1);
  await rateOpenings([a], opts);
  assert.equal(n, 1, 'rated once');
  await rateOpenings([a], { ...opts, rerate: true });
  assert.equal(n, 2, '--rerate: again');
});

test('the radar: every key answered 429 for 5 minutes is retired for an hour, and the next run leaves it alone', async () => {
  let n = 0;
  let mode = 'limit';
  globalThis.fetch = async () => {
    n += 1;
    if (mode === 'limit') return new Response(JSON.stringify({ error: { message: 'tokens per minute (TPM). Please try again in 0.01s.' } }), { status: 429, headers: { 'content-type': 'application/json' } });
    return new Response(JSON.stringify({ choices: [{ message: { content: ANSWER } }], usage: { prompt_tokens: 900, completion_tokens: 150 } }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const dir = mkdtempSync(join(tmpdir(), 'radar-rate-'));
  const env = { GROQ_API_KEYS: `gsk_${'a'.repeat(52)}`, RADAR_RATE_PER_DAY: '50' };
  const a = { key: 'a', j: { title: 'Java Developer', company: 'A', desc: JAVA_JD }, entry: { matchScore: 80 } };
  const opts = { env, stateDir: dir, resumeTexts: [RESUME, RESUME], log: () => {}, knobs: { limitBaseMs: 20, limitStopMs: 150, retireMs: 3_600_000 } };
  let r = await rateOpenings([a], opts);
  assert.equal(r.rated, 0);
  assert.match(r.why, /pauses until/);
  assert.equal(a.entry.ai, undefined);
  const calls = n;
  mode = 'ok';
  r = await rateOpenings([a], opts);
  assert.equal(n, calls, 'the retired key is not called in the next run');
  assert.match(r.why, /pauses until/);
  assert.equal(a.entry.ai, undefined);
  assert.ok(a.entry.jdText, 'it waits, with its text, for the key to come back');
});
