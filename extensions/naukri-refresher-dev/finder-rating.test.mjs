import test from 'node:test';
import assert from 'node:assert/strict';
import { finderEligibility, finderOpening, finderSalary } from '../naukri-refresher/jobs-lib.js';
import { finderRequest, finderVerdict } from '../naukri-refresher/finder-rating.js';
import { pruneQueue, startRater } from '../naukri-refresher/rate.js';
import { RATE } from '../naukri-refresher/rate-lib.js';
import { listing, TEST_RESUME } from './mock-naukri.mjs';

const now = Date.now();
const hour = 3_600_000;
const card = (over = {}) => finderEligibility(listing(1, over), now);
const summaries = { backend: 'Documented skills: Java, Spring Boot, Apache Kafka, PostgreSQL, REST APIs, Redis',
  ai: 'Documented skills: Python, LangGraph, RAG, pgvector, FastAPI' };
const item = { id: 'one', joint: true, job: { title: 'Software Engineer', company: 'Acme' }, skills: [], text: 'Build Spring Boot services and support the Angular team.' };
const answer = { primary: 'java_backend', score: 85, reason: 'Spring Boot services are the main responsibility.',
  duties: [1], stack: [{ line: 1, terms: ['Spring Boot'] }] };

test('Naukri admits each dated eligible card regardless of its salary, title, company or chips', () => {
  for (const experience of ['0-2 Yrs', '2-6 Yrs', '2+ years', 'up to 3 years', '1 year to 4 years', 'minimum 1 year', '']) {
    const c = card({ title: 'Frontend Engineer', companyName: 'Accenture', tagsAndSkills: 'MERN',
      placeholders: [{ type: 'experience', label: experience }, { type: 'salary', label: '8-10 LPA' }] });
    assert.equal(c.keep, true);
    assert.equal(finderOpening(c, {}, now).profile, undefined);
  }
  for (const experience of ['2.5-5 Yrs', '3+ years', '0-1 Yrs', 'max 1 year', 'minimum 3 years', 'Fresher']) {
    assert.equal(card({ placeholders: [{ type: 'experience', label: experience }] }).keep, false, experience);
  }
  assert.equal(card({ isApplied: true }).keep, false);
  assert.equal(card({ createdDate: null, footerPlaceholderLabel: '' }).keep, false);
  assert.equal(card({ createdDate: now - 47 * hour, footerPlaceholderLabel: '2 days ago' }).keep, true);
  assert.equal(card({ createdDate: now - 48 * hour, footerPlaceholderLabel: '2 days ago' }).keep, false);
});

test('only disclosed closed pay ranges supply a numeric ceiling', () => {
  assert.equal(finderSalary({ salaryText: '12+ LPA' }).pay, undefined);
  assert.deepEqual(finderSalary({ salaryText: '17–22 LPA' }).pay, { lo: 17, hi: 22 });
  assert.equal(finderSalary({ salaryText: '', salary: { hideSalary: true, maximumSalary: 900000 } }).pay, undefined);
});

test('one scoring request carries both summaries, the original duty text and unknown pay', () => {
  const body = finderRequest(RATE.model, summaries, item);
  assert.equal(body.response_format.json_schema.strict, true);
  for (const text of [...Object.values(summaries), item.text, 'Posted pay: undisclosed', 'Frontend', '18 LPA']) {
    assert.ok(body.messages[0].content.toLowerCase().includes(text.toLowerCase()));
  }
  assert.equal(body.tools, undefined);
});

test('recommendations require JD citations, documented stack and a valid score', () => {
  assert.equal(finderVerdict(answer, item, summaries).s, 85);
  for (const invalid of [{ score: 101 }, { score: '95' }, { duties: [17] }, { duties: [0] },
    { stack: [{ line: 1, terms: ['Go'] }] }, { primary: 'invented' }]) {
    assert.equal(finderVerdict({ ...answer, ...invalid }, item, summaries), null);
  }
  assert.equal(finderVerdict({ ...answer, stack: [{ line: 1, terms: ['Java'] }] }, { ...item, text: 'Build JavaScript frontends.' }, summaries), null);
  const rejected = finderVerdict({ ...answer, primary: 'support_ops', duties: [], stack: [] }, item, summaries);
  assert.equal(rejected.rej, true);
  for (const [max, label] of [[17, 'low'], [18, 'flex'], [20, 'close'], [25, 'ok']]) {
    const result = finderVerdict(answer, { ...item, job: { ...item.job, pay: { lo: 12, hi: max } } }, summaries);
    assert.equal(result.pay.ok, label);
    assert.equal(result.rej, max < 18);
  }
  assert.equal(finderVerdict(answer, item, summaries).pay.ok, 'unknown');
});

test('80% of mandatory technologies qualifies, including a Java backend without a Spring keyword', () => {
  const jd = { ...item, text: 'Develop Java REST APIs for payments.\nRequired: Java, REST APIs, Kafka, PostgreSQL, Redis, DynamoDB.\nNice to have: React and Angular.' };
  const r = finderVerdict({ ...answer, stack: [{ line: 1, terms: ['Java', 'REST APIs'] }] }, jd, summaries);
  assert.equal(r.role, 'java_backend');
  assert.deepEqual(r.m, [5, 6]);
  assert.deepEqual(r.supporting, [4, 5]);
  assert.deepEqual(r.miss, ['DynamoDB']);
  assert.equal(r.match, true);
  assert.equal(r.s, 85);
  const weaker = finderVerdict({ ...answer, score: 100, stack: [] }, { ...jd, text: jd.text.replace('Redis, ', '') }, summaries);
  assert.deepEqual(weaker.m, [4, 5]);
  assert.deepEqual(weaker.supporting, [3, 4]);
  assert.equal(weaker.match, false);
  assert.ok(weaker.s < 70);
});

test('a misleading Python/React title can qualify on agentic duties, including an explicit choice of frameworks', () => {
  const jd = { ...item, job: { ...item.job, title: 'Python React Azure resource Professional' },
    text: 'Build RAG pipelines and agent workflows in Python.\nUse LangChain or LangGraph, pgvector and Bedrock.' };
  const r = finderVerdict({ ...answer, primary: 'genai_app',
    stack: [{ line: 1, terms: ['RAG', 'Python'] }, { line: 2, terms: ['LangChain or LangGraph', 'pgvector', 'Bedrock'] }] }, jd, summaries);
  assert.equal(r.role, 'genai_app');
  assert.deepEqual(r.m, [4, 5]);
  assert.equal(r.fit, 80);
  assert.equal(r.s, 85);
  // An additional required AWS service drops this otherwise relevant role below the threshold.
  const weaker = finderVerdict({ ...answer, primary: 'genai_app', stack: [
    { line: 1, terms: ['RAG', 'Python'] }, { line: 2, terms: ['LangChain or LangGraph', 'pgvector', 'Bedrock', 'Lambda'] },
  ] }, { ...jd, text: jd.text.replace('Bedrock.', 'Bedrock and Lambda.') }, summaries);
  assert.deepEqual(weaker.m, [4, 6]);
  assert.ok(weaker.s < 70);
});

test('even a high model score cannot promote incidental technology use in the reported roles', () => {
  for (const [primary, text, tech] of [
    ['java_backend', 'Develop, support and troubleshoot Spring Boot applications, focusing on performance tuning.', 'Spring Boot'],
    ['genai_app', 'Develop machine learning solutions in Python and backend applications using Flask.', 'Python'],
    ['genai_app', 'Develop backend services using FastAPI and build interactive dashboards using Angular.', 'FastAPI'],
    ['genai_app', 'Conduct product demonstrations and presentations showcasing RAG capabilities to customers.', 'RAG'],
    ['genai_app', 'Explore generative AI, including RAG workflows, alongside demand forecasting.', 'RAG'],
    ['genai_app', 'Design and train computer vision models and predictive analytics algorithms in Python.', 'Python'],
    ['genai_app', 'Build responsive web applications with React and backend services using Python.', 'Python'],
  ]) {
    const r = finderVerdict({ ...answer, primary, score: 99, stack: [{ line: 1, terms: [tech] }] }, { ...item, text }, summaries);
    assert.equal(r.role, 'unclear', text);
    assert.ok(r.s < 70);
  }
});

test('company and optional sections cannot supply the primary duty or inflate the denominator', () => {
  const jd = { ...item, text: 'About us\nWe build RAG pipelines for hospitals.\nResponsibilities\nInvestigate threats and write incident reports.\nNice to have: LangGraph' };
  const r = finderVerdict({ ...answer, primary: 'genai_app', duties: [2, 4], stack: [{ line: 2, terms: ['RAG'] }, { line: 5, terms: ['LangGraph'] }] }, jd, summaries);
  assert.equal(r.role, 'unclear');
  assert.deepEqual(r.m, [0, 0]);
  const actualWork = { ...item, text: 'About us\nWe use AWS.\nYou will build Spring Boot services.\nGood to have skills:\nAngular and GraphQL.' };
  const positive = finderVerdict({ ...answer, duties: [3], stack: [{ line: 3, terms: ['Spring Boot'] }, { line: 5, terms: ['Angular', 'GraphQL'] }] }, actualWork, summaries);
  assert.equal(positive.role, 'java_backend');
  assert.deepEqual(positive.m, [1, 1]);
  const mixed = { ...item, text: 'Build Spring Boot services for the sales team using AI-assisted coding; Angular is a plus.' };
  assert.deepEqual(finderVerdict({ ...answer, stack: [{ line: 1, terms: ['Spring Boot', 'Angular'] }] }, mixed, summaries).m, [1, 1]);
});

test('a required ML stack counts in a hybrid JD even when the model overlooks it', () => {
  const jd = { ...item, text: 'Build RAG applications in Python.\nRequired Skills\nExperience training models using PyTorch and TensorFlow.\nGood to Have\nLangGraph' };
  const r = finderVerdict({ ...answer, primary: 'genai_app', stack: [{ line: 1, terms: ['RAG', 'Python'] }] }, jd, summaries);
  assert.ok(r.miss.includes('TensorFlow') && r.miss.includes('PyTorch'));
  assert.ok(r.fit < 80);
});

test('an express target assignment disputed by the model is recoverable in review', () => {
  const jd = { ...item, text: 'Your primary responsibility is to build Spring Boot services for payments.' };
  const negative = { ...answer, primary: 'other', duties: [], stack: [], score: 25 };
  const r = finderVerdict(negative, jd, summaries);
  assert.deepEqual([r.profile, r.match, r.rej], ['backend', false, false]);
  assert.equal(finderVerdict({ ...negative, primary: 'ineligible' }, jd, summaries).rej, true);
});

test('alternatives do not establish primary Java, and knowing a category does not prove a named product', () => {
  let jd = { ...item, text: 'Build backend services in Java or Go.' };
  let r = finderVerdict({ ...answer, stack: [{ line: 1, terms: ['Java or Go'] }] }, jd, summaries);
  assert.equal(r.role, 'unclear');
  jd = { ...item, text: 'Own a RAG application in production.\nRequired: RAG, Ragas, Azure AI Search.' };
  r = finderVerdict({ ...answer, primary: 'genai_app', stack: [] }, jd, { ai: 'Documented skills: RAG, LLM Evals, Azure' });
  assert.deepEqual(r.m, [1, 3]);
  assert.ok(r.fit < 80);
  jd = { ...item, text: 'Your primary focus is frontend development.\nBuild Java backend services occasionally.' };
  r = finderVerdict({ ...answer, duties: [2], stack: [{ line: 2, terms: ['Java'] }] }, jd, summaries);
  assert.equal(r.role, 'unclear');
});

test('the backlog survives quota and the 48-hour discovery window, including jobs beyond the former 500 limit', () => {
  const batch = Array.from({ length: 900 }, (_, i) => ({ ...item, id: String(i), t: i, post: now - 72 * hour }));
  const queue = pruneQueue([...batch, batch[2]], { now, rated: { 42: { h: 'current' } }, hash: { finder: 'current' } });
  assert.deepEqual(queue.map(i => i.id), batch.filter(i => i.id !== '42').map(i => i.id));
});

test('five keys share distinct jobs, invalid evidence stays queued, exact prompts survive and unrelated jobs can finish', async t => {
  const jobs = Array.from({ length: 10 }, (_, i) => ({ ...item, id: String(i), job: { ...item.job, title: 'Role ' + i } }));
  const requests = [];
  const seen = [];
  const errors = [];
  t.mock.method(globalThis, 'fetch', async (_url, opts) => {
    const prompt = JSON.parse(opts.body).messages[0].content;
    const id = prompt.match(/Title: Role (\d+)/)[1];
    requests.push({ id, prompt, key: opts.headers.authorization });
    await new Promise(resolve => setTimeout(resolve, 5));
    const raw = JSON.stringify(Number(id) < 5 ? { ...answer, duties: [777] } : { ...answer, score: 21, primary: 'other', duties: [], stack: [] });
    return new Response(JSON.stringify({ choices: [{ message: { content: raw } }] }));
  });
  const counts = { calls: 0, rated: {}, tokens: { input: 0, cached: 0, output: 0 }, fails: 0 };
  const rater = startRater(jobs, { keys: [1, 2, 3, 4, 5].map(n => 'mock-key-' + n), model: RATE.model, resumes: TEST_RESUME, callsPerDay: 50, counts,
    onRated: (it, ai, site, local) => seen.push({ id: it.id, ai, site, local }),
    onRatingError: (it, p, o) => errors.push({ id: it.id, p, o }) });
  await rater.drain(2000);
  assert.equal(new Set(requests.map(x => x.key)).size, 5);
  assert.equal(requests.length, 10);
  assert.deepEqual(jobs.map(x => x.id).sort(), ['0', '1', '2', '3', '4']);
  assert.equal(seen.length, 5);
  for (const x of seen) {
    assert.equal(x.local.p, requests.find(r => r.id === x.id).prompt);
    assert.ok(x.site.p.includes('[AI profile summary]'));
    assert.ok(x.ai.rej);
  }
  for (const x of errors) assert.deepEqual(JSON.parse(x.o).duties, [777]);
  assert.equal(errors.length, 5);
});
