// Unit tests for the Naukri job finder's rules (extensions/naukri-refresher/jobs-lib.js).
// Run: node --test extensions/naukri-refresher-dev/
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RULES, SEARCHES, searchUrl, trackerDay, nextFinderRun, normalizeJob, postedDay, parseYears, parseLakhs, parsePay,
  titleCheck, makeProfile, makeProfiles, classifyTag, skillCheck, roleKind, rankOf, evaluate, toOpening, payLabel, searchesFor,
} from '../naukri-refresher/jobs-lib.js';

const H = 3_600_000;
const D = 24 * H;
const IST = 5.5 * H;
const prof = makeProfile();
// 2026-11-20 14:00 IST
const NOW = Date.UTC(2026, 10, 20, 8, 30);

let n = 100000000000;
const job = (over = {}) => ({
  jobId: String(n++),
  title: 'Java Developer',
  companyName: 'Acme Software',
  jdURL: `/job-listings-java-developer-acme-bengaluru-2-to-5-years-${n}`,
  createdDate: NOW - 2 * H,
  footerPlaceholderLabel: 'Few Hours Ago',
  placeholders: [
    { type: 'experience', label: '2-5 Yrs' },
    { type: 'salary', label: 'Not disclosed' },
    { type: 'location', label: 'Bengaluru' },
  ],
  tagsAndSkills: 'Java,Spring Boot,Microservices,Kafka,SQL',
  ambitionBoxData: { AggregateRating: '4.1', ReviewsCount: 320 },
  jobDescription: '<p>Build backend services in Java</p>',
  ...over,
});
const profs = makeProfiles();
const verdict = (over) => evaluate(job(over), { now: NOW, profs });

test('search URLs use Naukri\'s own page with its filters: last day, 2 years', () => {
  assert.equal(searchUrl('java spring boot developer'), 'https://www.naukri.com/java-spring-boot-developer-jobs?k=java%20spring%20boot%20developer&experience=2&jobAge=1');
  assert.equal(searchUrl('llm engineer', 3), 'https://www.naukri.com/llm-engineer-jobs-3?k=llm%20engineer&experience=2&jobAge=1');
  assert.ok(SEARCHES.some((s) => s.profile === 'ai') && SEARCHES.some((s) => s.profile === 'backend'), 'searches cover both profiles');
});

test('the day runs 4am to 4am IST, like the job tracker', () => {
  const at = (y, m, d, h, min = 0) => Date.UTC(y, m - 1, d, h, min) - IST; // an IST wall-clock time
  assert.equal(trackerDay(at(2026, 11, 20, 3, 59)), '2026-11-19');
  assert.equal(trackerDay(at(2026, 11, 20, 4, 0)), '2026-11-20');
  assert.equal(trackerDay(at(2026, 11, 20, 23, 30)), '2026-11-20');
});

test('finder runs land within ±7 min of 09, 11, 13, 15, 17, 19 IST and never repeat a slot', () => {
  const at = (h, min = 0) => Date.UTC(2026, 10, 20, h, min) - IST;
  const a = nextFinderRun(at(8, 0), null, () => 0);
  assert.equal(a.slot, '2026-11-20T09');
  assert.equal(a.at, at(8, 53));
  const b = nextFinderRun(at(8, 0), null, () => 1);
  assert.equal(b.at, at(9, 7));
  const c = nextFinderRun(at(9, 30), '2026-11-20T09', () => 0.5);
  assert.equal(c.slot, '2026-11-20T11');
  const late = nextFinderRun(at(20, 0), null, () => 0.5);
  assert.equal(late.slot, '2026-11-21T09');
  const missed = nextFinderRun(at(14, 20), '2026-11-20T11', () => 0.5); // PC slept through 13:00
  assert.equal(missed.slot, '2026-11-20T15');
});

test('a listing is normalized: absolute link, id from the link when missing, labels by type', () => {
  const j = normalizeJob({ title: ' Java  Dev ', companyName: 'X', jdURL: '/job-listings-java-dev-x-201125012345', placeholders: [{ type: 'Experience', label: '1-3 Yrs' }] });
  assert.equal(j.url, 'https://www.naukri.com/job-listings-java-dev-x-201125012345');
  assert.equal(j.id, '201125012345');
  assert.equal(j.title, 'Java Dev');
  assert.equal(j.expText, '1-3 Yrs');
  assert.deepEqual(normalizeJob({ tagsAndSkills: 'Java, java ,Spring Boot,,Kafka' }).tags, ['Java', 'Spring Boot', 'Kafka']);
});

test('posted today: the listing\'s own "x ago" label first, then its creation time; unknown counts as today', () => {
  const base = normalizeJob(job());
  assert.equal(postedDay({ ...base, footer: 'Just Now' }, NOW), '2026-11-20');
  assert.equal(postedDay({ ...base, footer: '1 Day Ago' }, NOW), '2026-11-19');
  assert.equal(postedDay({ ...base, footer: '30+ Days Ago' }, NOW), trackerDay(NOW - 30 * D));
  assert.equal(postedDay({ ...base, footer: '', createdAt: NOW - 30 * H }, NOW), '2026-11-19');
  assert.equal(postedDay({ ...base, footer: '', createdAt: null }, NOW), '2026-11-20');
});

test('experience labels', () => {
  assert.deepEqual(parseYears('2-5 Yrs'), { min: 2, max: 5 });
  assert.deepEqual(parseYears('0 - 2 years'), { min: 0, max: 2 });
  assert.deepEqual(parseYears('3+ Yrs'), { min: 3, max: null });
  assert.deepEqual(parseYears('Fresher'), { min: 0, max: 0 });
  assert.equal(parseYears(''), null);
  assert.equal(parseYears('Not mentioned'), null);
});

test('salary labels in lakhs (lakhs, rupees, crores); "not disclosed" and monthly figures are no CTC', () => {
  assert.deepEqual(parseLakhs('15-25 Lacs PA'), { minL: 15, maxL: 25 });
  assert.deepEqual(parseLakhs('12 LPA'), { minL: 12, maxL: 12 });
  assert.deepEqual(parseLakhs('₹ 6,00,000 - 12,00,000 P.A.'), { minL: 6, maxL: 12 });
  assert.deepEqual(parseLakhs('1-1.5 Cr'), { minL: 100, maxL: 150 });
  assert.equal(parseLakhs('Not disclosed'), null);
  assert.equal(parseLakhs('50,000-70,000 per month'), null);
});

test('pay: shown, hidden by the employer but present in Naukri\'s data, or unknown', () => {
  assert.deepEqual(parsePay(normalizeJob(job({ salaryDetail: { hideSalary: false, minimumSalary: 1800000, maximumSalary: 2600000 } }))), { kind: 'shown', minL: 18, maxL: 26 });
  assert.deepEqual(parsePay(normalizeJob(job({ salaryDetail: { hideSalary: true, minimumSalary: 1500000, maximumSalary: 2200000 } }))), { kind: 'hidden', minL: 15, maxL: 22 });
  assert.deepEqual(parsePay(normalizeJob(job({ salaryDetail: { hideSalary: true, minimumSalary: 0, maximumSalary: 0 } }))), { kind: 'unknown' });
  assert.deepEqual(parsePay(normalizeJob(job({ placeholders: [{ type: 'salary', label: '20-30 Lacs PA' }] }))), { kind: 'shown', minL: 20, maxL: 30 });
  assert.deepEqual(parsePay(normalizeJob(job())), { kind: 'unknown' });
});

test('titles: stacks and levels that aren\'t yours are out; plain software roles are in', () => {
  const out = ['Android Developer', 'iOS Engineer', 'Flutter Developer', '.NET Developer', 'C# Backend Developer', 'PHP Laravel Developer',
    'React Developer', 'Frontend Engineer', 'UI Developer', 'QA Automation Engineer', 'Software Engineer in Test', 'SDET', 'DevOps Engineer',
    'Site Reliability Engineer', 'Data Engineer', 'Data Scientist', 'Power BI Developer', 'SAP ABAP Consultant', 'Salesforce Developer',
    'Embedded Software Engineer', 'Technical Lead - Java', 'Java Architect', 'Engineering Manager', 'Principal Engineer', 'Staff Software Engineer',
    'Java Intern', 'Graduate Engineer Trainee', 'Golang Developer', 'Scala Engineer', 'Technical Support Engineer', 'Business Analyst', 'Consultant'];
  for (const t of out) assert.equal(titleCheck(t, prof).ok, false, t);
  const keep = ['Software Engineer', 'Software Developer', 'SDE 2', 'Member of Technical Staff', 'Java Consultant', 'Backend Engineer',
    'Python Developer', 'Node.js Developer', 'Full Stack Developer (React + Node)', 'Java Full Stack Developer (Angular)',
    'Generative AI Engineer', 'LLM Engineer', 'AI/ML Engineer', 'Associate Software Engineer', 'Senior Software Engineer', 'Application Developer'];
  for (const t of keep) assert.equal(titleCheck(t, prof).ok, true, t);
  assert.ok(titleCheck('Senior Software Engineer', prof).fit < titleCheck('Software Engineer', prof).fit, 'senior ranks a little lower');
  assert.equal(titleCheck('Generative AI Engineer', prof).ai, true);
});

test('tags: your skills (and their variants) match; soft skills and filler are ignored; substitutes count 70%', () => {
  const cls = (t) => classifyTag(t, prof).cls;
  for (const t of ['Java', 'Core Java', 'Spring Boot', 'Microservices', 'Apache Kafka', 'Kubernetes', 'MySQL', 'Generative AI', 'LLMs',
    'Langchain', 'RAG', 'Vector Database', 'Pinecone', 'FastAPI', 'Hibernate', 'REST API', 'Docker', 'Jenkins', 'Prompt Engineering', 'Testcontainers']) {
    assert.equal(cls(t), 'have', t);
  }
  for (const t of ['Communication Skills', 'Problem Solving', 'Software Development', 'B.Tech', 'Fintech', 'Linux', 'Cloud', 'OOPS', 'Agile']) {
    assert.ok(['ignore', 'have'].includes(cls(t)), `${t} → ${cls(t)}`);
  }
  for (const t of ['Angular', 'TypeScript', 'Flask', 'Django', 'RabbitMQ', 'GCP', 'Golang', 'Machine Learning', 'Hugging Face']) {
    assert.equal(cls(t), 'part', t);
  }
  for (const t of ['Deep Learning', 'PyTorch', 'TensorFlow', 'Struts', 'Scala', 'C#']) assert.equal(cls(t), 'missing', t);
  assert.equal(classifyTag('Struts', prof).unknown, true, 'unrecognized tags are flagged for tuning');
});

test('coverage counts each skill once, however many tags name it', () => {
  const s = skillCheck(['Java', 'Core Java', 'Java 8', 'Spring Boot', 'Spring MVC', 'Angular'], prof);
  assert.deepEqual([s.have.length, s.part.length, s.missing.length], [2, 1, 0]);
  assert.equal(Math.round(s.ratio * 100), 90); // (2 + 0.7) / 3
  assert.equal(skillCheck(['Communication', 'Teamwork'], prof).ratio, null, 'nothing to count: no verdict');
});

test('extra skills typed in the settings count as yours', () => {
  const mine = makeProfile(['Struts', 'Apache Camel']);
  assert.equal(classifyTag('Struts', mine).cls, 'have');
  assert.equal(classifyTag('apache camel', mine).cls, 'have');
});

test('which list: AI-first roles (title, or mostly GenAI tech) vs backend-first, never from the search', () => {
  const sk = (tags) => skillCheck(tags, prof);
  assert.equal(roleKind('LLM Engineer', true, sk(['Python'])), 'ai');
  assert.equal(roleKind('Python Developer', false, sk(['Python', 'FastAPI', 'LLM', 'RAG', 'PostgreSQL'])), 'ai');
  assert.equal(roleKind('Java Developer', false, sk(['Java', 'Spring Boot', 'Kafka', 'LLM', 'RAG'])), 'backend');
  assert.equal(roleKind('Software Engineer', false, sk(['Java', 'Spring Boot', 'SQL'])), 'backend');
  assert.equal(roleKind('Software Engineer', false, sk(['Python', 'Generative AI', 'Langchain', 'Vector Database'])), 'ai');
});

test('keeps what fits; a missing detail never drops a job', () => {
  const good = verdict({});
  assert.equal(good.keep, true);
  assert.equal(good.profile, 'backend');
  // nothing about pay, experience or skills on the listing: kept
  const bare = verdict({ title: 'Software Engineer', tagsAndSkills: '', placeholders: [], jobDescription: '' });
  assert.equal(bare.keep, true, 'plain software engineer with no details');
  assert.equal(bare.skills.ratio, null);
  assert.equal(verdict({ placeholders: [{ type: 'salary', label: 'Not disclosed' }] }).keep, true);
});

test('drops only on what the listing does say', () => {
  const why = (over, hint) => verdict(over, hint).why;
  assert.equal(why({ title: 'Android Developer' }), 'Android role');
  assert.equal(why({ placeholders: [{ type: 'experience', label: '3-6 Yrs' }] }), 'asks 3+ years');
  assert.equal(why({ placeholders: [{ type: 'experience', label: '0-1 Yrs' }] }), 'fresher role');
  assert.equal(why({ placeholders: [{ type: 'salary', label: '6-10 Lacs PA' }] }), 'pays under 15L');
  assert.equal(why({ salaryDetail: { hideSalary: true, minimumSalary: 400000, maximumSalary: 800000 } }), 'pays under 15L', 'a hidden but known low salary');
  assert.equal(why({ tagsAndSkills: 'Java,Struts,JSP,Oracle,PL/SQL' }), 'skills under 85%');
  assert.equal(why({ footerPlaceholderLabel: '1 Day Ago', createdDate: NOW - 30 * H }), 'not posted today');
  assert.equal(why({ companyName: '' }), 'incomplete listing');
  assert.equal(verdict({ placeholders: [{ type: 'salary', label: '15-18 Lacs PA' }] }).keep, true, '15L reaches the bar');
  assert.equal(verdict({ placeholders: [{ type: 'experience', label: '2-4 Yrs' }] }).keep, true);
});

test('rank: better fit ranks higher, always 0–100', () => {
  const strong = verdict({ tagsAndSkills: 'Java,Spring Boot,Microservices,Kafka,Docker,Kubernetes', placeholders: [{ type: 'experience', label: '1-3 Yrs' }, { type: 'salary', label: '25-35 Lacs PA' }] });
  const weaker = verdict({ title: 'Senior Software Engineer', tagsAndSkills: 'Java,Spring Boot,Angular,TypeScript,MySQL,Docker', ambitionBoxData: { AggregateRating: '3.1', ReviewsCount: 50 }, createdDate: NOW - 8 * H, footerPlaceholderLabel: '' });
  assert.ok(strong.keep && weaker.keep);
  assert.ok(strong.rank > weaker.rank, `${strong.rank} > ${weaker.rank}`);
  for (const e of [strong, weaker, verdict({ title: 'Software Engineer', tagsAndSkills: '', placeholders: [] })]) assert.ok(e.rank >= 0 && e.rank <= 100);
  assert.ok(rankOf({ fit: 1, skills: { ratio: 1, have: Array(6).fill('x') }, years: { min: 2, max: 4 }, pay: { kind: 'shown', maxL: 30 }, rating: 4.5, reviews: 900, createdAt: NOW - H }, NOW) === 100);
});

test('the opening sent to the site: radar fields plus the finder\'s own', () => {
  const e = verdict({ title: 'Generative AI Engineer', tagsAndSkills: 'Python,Generative AI,LLM,RAG,Langchain', salaryDetail: { hideSalary: true, minimumSalary: 2000000, maximumSalary: 3000000 } }, 'ai');
  const o = toOpening(e, NOW);
  assert.equal(o.finder, 'naukri');
  assert.equal(o.source, 'naukri');
  assert.equal(o.profile, 'ai');
  assert.equal(o.postedAt, '2026-11-20');
  assert.ok(/^https:\/\/www\.naukri\.com\/job-listings-/.test(o.url));
  assert.equal(o.openingId, e.job.id);
  assert.equal(o.pay.verdict, 'hidden');
  assert.match(o.pay.text, /₹20–30L, hidden on the listing/);
  assert.equal(o.coverage, 100);
  assert.equal(o.exp, 'fits');
  assert.equal(o.minYoe, 2);
  assert.ok(o.matchScore > 0 && o.rank > 0);
  assert.equal(o.rating, 4.1);
  const bare = toOpening(verdict({ title: 'Software Engineer', tagsAndSkills: '', placeholders: [], jobDescription: '' }), NOW, 42);
  assert.equal(bare.matchScore, 42, 'no tags: the radar\'s text score stands in');
  assert.equal(bare.coverage, undefined);
  assert.equal(bare.exp, 'unknown');
  assert.deepEqual(payLabel({ kind: 'shown', minL: 15, maxL: 18 }), { verdict: 'fifteen', text: '₹15–18L posted' });
  assert.equal(payLabel({ kind: 'shown', minL: 20, maxL: 30 }).verdict, 'meets');
  assert.equal(payLabel({ kind: 'unknown' }).verdict, 'unknown');
});

test('rules are the agreed ones', () => {
  assert.equal(RULES.minPayL, 15);
  assert.equal(RULES.maxMinYears, 2.5);
  assert.equal(RULES.minCoverage, 0.85);
  assert.equal(RULES.dailyTop, 50);
});

test('two filters: each list checks a job against its own resume', () => {
  // AWS is on the SDE resume only: a full match for the Backend list, a "want" (70%) for the AI list.
  assert.equal(classifyTag('AWS', profs.backend).cls, 'have');
  assert.equal(classifyTag('AWS', profs.ai).cls, 'part');
  const be = verdict({ title: 'Java Developer', tagsAndSkills: 'Java,Spring Boot,AWS' });
  assert.equal(be.profile, 'backend');
  assert.equal(Math.round(be.skills.ratio * 100), 100, 'checked against the SDE resume');
  const ai = verdict({ title: 'Generative AI Engineer', tagsAndSkills: 'Python,LLM,RAG,AWS' });
  assert.equal(ai.profile, 'ai');
  assert.ok(ai.skills.ratio < 1, 'checked against the GenAI resume, which has no AWS');
  const dropped = verdict({ title: 'AI Engineer', tagsAndSkills: 'Python,Deep Learning,PyTorch,TensorFlow' });
  assert.equal(dropped.keep, false);
  assert.equal(dropped.profile, 'ai', 'an AI-first role is judged by the AI filter only');
});

test('each browser can search for one list only', () => {
  assert.ok(searchesFor('backend').every((s) => s.profile === 'backend') && searchesFor('backend').length > 0);
  assert.ok(searchesFor('ai').every((s) => s.profile === 'ai') && searchesFor('ai').length > 0);
  assert.equal(searchesFor('both').length, searchesFor('backend').length + searchesFor('ai').length);
  assert.equal(searchesFor('nonsense').length, searchesFor('both').length);
});
