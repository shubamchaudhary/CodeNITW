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
const summaries = { backend: 'Builds Spring Boot services.', ai: 'Builds retrieval pipelines with LangGraph.' };
const item = { id: 'one', joint: true, job: { title: 'Software Engineer', company: 'Acme' }, skills: [], text: 'Build Spring Boot services and support the Angular team.' };
const answer = { profile: 'backend', score: 85, reason: 'Spring Boot services are the main responsibility.', duty: 'Build Spring Boot services', evidence: 'Spring Boot' };

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

test('recommendations require actual quotes from the JD and selected profile and a valid score', () => {
  assert.equal(finderVerdict(answer, item, summaries).s, 85);
  for (const invalid of [{ score: 101 }, { score: '95' }, { duty: 'Java 21' }, { duty: '' },
    { evidence: 'LangGraph' }, { profile: 'neither', evidence: '' }, { profile: 'frontend' }]) {
    assert.equal(finderVerdict({ ...answer, ...invalid }, item, summaries), null);
  }
  assert.equal(finderVerdict({ ...answer, duty: 'Java' }, { ...item, text: 'Build JavaScript frontends.' }, summaries), null);
  const rejected = finderVerdict({ ...answer, score: 16, profile: 'neither', evidence: '' }, item, summaries);
  assert.equal(rejected.rej, true);
  for (const [max, label] of [[17, 'low'], [18, 'flex'], [20, 'close'], [25, 'ok']]) {
    const result = finderVerdict(answer, { ...item, job: { ...item.job, pay: { lo: 12, hi: max } } }, summaries);
    assert.equal(result.pay.ok, label);
    assert.equal(result.rej, max < 18);
  }
  assert.equal(finderVerdict(answer, item, summaries).pay.ok, 'unknown');
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
    const raw = JSON.stringify(Number(id) < 5 ? { ...answer, duty: 'invented' } : { ...answer, score: 21, profile: 'neither', evidence: '' });
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
  for (const x of errors) assert.equal(JSON.parse(x.o).duty, 'invented');
  assert.equal(errors.length, 5);
});
