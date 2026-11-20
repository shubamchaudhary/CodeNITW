// Unit tests for the Naukri job finder's rules (extensions/naukri-refresher/jobs-lib.js).
// Run: node --test extensions/naukri-refresher-dev/
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RULES, SEARCHES, searchUrl, searchesFor, trackerDay, nextFinderRun, normalizeJob, postedDay, parseYears, parseLakhs, parsePay,
  titleCheck, mySkills, chipCheck, cardCheck, jdSections, jdCheck, cardOnly, htmlToText, rankOf, toOpening, payLabel,
} from '../naukri-refresher/jobs-lib.js';

const H = 3_600_000;
const D = 24 * H;
const IST = 5.5 * H;
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
const card = (over) => cardCheck(job(over), { now: NOW });
const JAVA_JD = 'Roles and Responsibilities\nBuild and run backend services.\nPreferred candidate profile\n• Java, Spring Boot, Microservices, REST APIs\n'
  + '• PostgreSQL, Redis, Apache Kafka\n• Docker, Kubernetes, CI/CD\nGood to have: Go, Terraform, Rust\nAbout Company\nWe partner with Salesforce, SAP and ServiceNow.';
const DOTNET_JD = 'Requirements:\n• C#, ASP.NET MVC, .NET Core, Web API\n• SQL Server, Entity Framework\n• Azure DevOps, Git';
const AI_JD = 'Key Responsibilities\nBuild agentic AI workflows with LangGraph and LangChain, RAG pipelines over pgvector, embeddings and evals.\n'
  + 'Requirements\nPython, FastAPI, Docker. OpenAI and Azure OpenAI APIs. Prompt engineering.\nNice to have: fine-tuning, PyTorch.';
const ML_JD = 'Requirements\nDeep learning with PyTorch and TensorFlow, computer vision, CNNs, model training at scale, MLOps with Kubeflow, Python, CUDA.';

test("search URLs use Naukri's own page with its filters: last day, 2 years", () => {
  assert.equal(searchUrl('java spring boot developer'), 'https://www.naukri.com/java-spring-boot-developer-jobs?k=java%20spring%20boot%20developer&experience=2&jobAge=1');
  assert.equal(searchUrl('llm engineer', 3), 'https://www.naukri.com/llm-engineer-jobs-3?k=llm%20engineer&experience=2&jobAge=1');
  assert.ok(SEARCHES.some((s) => s.profile === 'ai') && SEARCHES.some((s) => s.profile === 'backend'), 'searches cover both lists');
});

test('each browser can search for one list only', () => {
  assert.ok(searchesFor('backend').length > 0 && searchesFor('backend').every((s) => s.profile === 'backend'));
  assert.ok(searchesFor('ai').length > 0 && searchesFor('ai').every((s) => s.profile === 'ai'));
  assert.equal(searchesFor('both').length, searchesFor('backend').length + searchesFor('ai').length);
  assert.equal(searchesFor('nonsense').length, SEARCHES.length);
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
  assert.equal(nextFinderRun(at(8, 0), null, () => 1).at, at(9, 7));
  assert.equal(nextFinderRun(at(9, 30), '2026-11-20T09', () => 0.5).slot, '2026-11-20T11');
  assert.equal(nextFinderRun(at(20, 0), null, () => 0.5).slot, '2026-11-21T09');
  assert.equal(nextFinderRun(at(14, 20), '2026-11-20T11', () => 0.5).slot, '2026-11-20T15', 'a slot the PC slept through is skipped');
});

test('a listing is normalized: absolute link, id from the link when missing, labels by type', () => {
  const j = normalizeJob({ title: ' Java  Dev ', companyName: 'X', jdURL: '/job-listings-java-dev-x-201125012345', placeholders: [{ type: 'Experience', label: '1-3 Yrs' }] });
  assert.equal(j.url, 'https://www.naukri.com/job-listings-java-dev-x-201125012345');
  assert.equal(j.id, '201125012345');
  assert.equal(j.title, 'Java Dev');
  assert.equal(j.expText, '1-3 Yrs');
  assert.deepEqual(normalizeJob({ tagsAndSkills: 'Java, java ,Spring Boot,,Kafka' }).tags, ['Java', 'Spring Boot', 'Kafka']);
});

test("posted today: the listing's own \"x ago\" label first, then its creation time; unknown counts as today", () => {
  const base = normalizeJob(job());
  assert.equal(postedDay({ ...base, footer: 'Just Now' }, NOW), '2026-11-20');
  assert.equal(postedDay({ ...base, footer: '1 Day Ago' }, NOW), '2026-11-19');
  assert.equal(postedDay({ ...base, footer: '30+ Days Ago' }, NOW), trackerDay(NOW - 30 * D));
  assert.equal(postedDay({ ...base, footer: '', createdAt: NOW - 30 * H }, NOW), '2026-11-19');
  assert.equal(postedDay({ ...base, footer: '', createdAt: null }, NOW), '2026-11-20');
});

test('experience and salary labels', () => {
  assert.deepEqual(parseYears('2-5 Yrs'), { min: 2, max: 5 });
  assert.deepEqual(parseYears('3+ Yrs'), { min: 3, max: null });
  assert.deepEqual(parseYears('Fresher'), { min: 0, max: 0 });
  assert.equal(parseYears('Not mentioned'), null);
  assert.deepEqual(parseLakhs('15-25 Lacs PA'), { minL: 15, maxL: 25 });
  assert.deepEqual(parseLakhs('₹ 6,00,000 - 12,00,000 P.A.'), { minL: 6, maxL: 12 });
  assert.deepEqual(parseLakhs('1-1.5 Cr'), { minL: 100, maxL: 150 });
  assert.equal(parseLakhs('Not disclosed'), null);
  assert.equal(parseLakhs('50,000-70,000 per month'), null);
  assert.deepEqual(parsePay(normalizeJob(job({ salaryDetail: { hideSalary: true, minimumSalary: 1500000, maximumSalary: 2200000 } }))), { kind: 'hidden', minL: 15, maxL: 22 });
  assert.deepEqual(parsePay(normalizeJob(job())), { kind: 'unknown' });
});

test("titles: stacks and levels that aren't yours are out; plain software roles are in", () => {
  const out = ['Android Developer', 'iOS Engineer', 'Flutter Developer', '.NET Developer', 'C# Backend Developer', 'PHP Laravel Developer',
    'React Developer', 'Frontend Engineer', 'QA Automation Engineer', 'SDET', 'DevOps Engineer', 'Data Engineer', 'SAP ABAP Consultant',
    'Embedded Software Engineer', 'Technical Lead - Java', 'Java Architect', 'Engineering Manager', 'Staff Software Engineer', 'Java Intern',
    'Golang Developer', 'Scala Engineer', 'C++ Developer', 'Telecom Software Developer - C/C++ & Kubernetes', 'Technical Support Engineer', 'Consultant',
    'AI Builder (Senior Product Designer)'];
  for (const t of out) assert.equal(titleCheck(t).ok, false, t);
  const keep = ['Software Engineer', 'Software Developer', 'SDE 2', 'Member of Technical Staff', 'Java Consultant', 'Backend Engineer',
    'Python Developer', 'Node.js Developer', 'Full Stack Developer (React + Node)', 'Java Full Stack Developer (Angular)', 'TypeScript Developer',
    'Generative AI Engineer', 'LLM Engineer', 'AI/ML Engineer', 'Senior Software Engineer', 'Application Developer'];
  for (const t of keep) assert.equal(titleCheck(t).ok, true, t);
  assert.equal(titleCheck('Telecom Software Developer - C/C++').why, 'C/C++ role');
  assert.ok(titleCheck('Senior Software Engineer').fit < titleCheck('Software Engineer').fit, 'senior ranks a little lower');
});

test('a JD from its HTML keeps its lines; its requirements leave out nice-to-haves, company blurbs and perks', () => {
  const text = htmlToText('<p><b>Requirements</b></p><ul><li>Java &amp; Spring Boot</li><li>Kafka</li></ul><p>Nice to have: Go</p><p><b>About us</b></p><p>We use SAP.</p>');
  assert.equal(text, 'Requirements\n• Java & Spring Boot\n• Kafka\nNice to have: Go\nAbout us\nWe use SAP.');
  const { req, opt } = jdSections(text);
  assert.match(req, /Spring Boot/);
  assert.match(req, /Kafka/);
  assert.doesNotMatch(req, /Go|SAP/);
  assert.match(opt, /Go/);
  assert.match(jdSections('Preferred candidate profile\nJava, Spring Boot').req, /Spring Boot/, "Naukri's \"Preferred candidate profile\" is the requirements");
  assert.doesNotMatch(jdSections('Experience with Kafka.\nKnowledge of Rust is a plus.').req, /Rust/);
});

test('chips: technologies count, filler is ignored', () => {
  const c = chipCheck(['Software', 'Software Development', 'Compliance', 'Partnerships', 'Strategic']);
  assert.equal(c.counted.length, 0);
  assert.deepEqual(c.unknown, ['Software', 'Compliance', 'Partnerships', 'Strategic']);
  assert.deepEqual(chipCheck(['Go', 'C']).counted.sort(), ['C', 'Go'], 'a chip is a name on its own');
  const j = chipCheck(['Core Java', 'Spring Boot', 'Microsoft Azure', 'SQL Server']);
  assert.deepEqual([j.have.length, j.counted.length], [3, 4]);
});

test('the card: worth opening its JD unless what it says rules the job out; a missing detail never does', () => {
  assert.equal(card({}).keep, true);
  assert.equal(card({ title: 'Software Developer', tagsAndSkills: 'Software,Compliance,Partnerships,Strategic', placeholders: [] }).keep, true, 'filler chips');
  assert.equal(card({ title: 'Software Engineer', tagsAndSkills: '', placeholders: [], jobDescription: '' }).keep, true, 'nothing said');
  const why = (over) => card(over).why;
  assert.equal(why({ title: 'Android Developer' }), 'Android role');
  assert.equal(why({ placeholders: [{ type: 'experience', label: '3-6 Yrs' }] }), 'asks 3+ years');
  assert.equal(why({ placeholders: [{ type: 'experience', label: '0-1 Yrs' }] }), 'fresher role');
  assert.equal(why({ placeholders: [{ type: 'salary', label: '6-10 Lacs PA' }] }), 'pays under 15L');
  assert.equal(why({ salaryDetail: { hideSalary: true, minimumSalary: 400000, maximumSalary: 800000 } }), 'pays under 15L', 'a hidden but known low salary');
  assert.equal(why({ title: 'Software Developer', tagsAndSkills: 'C#,.NET,ASP.NET,SQL Server,Entity Framework' }), "card's skills are another stack");
  assert.equal(why({ footerPlaceholderLabel: '1 Day Ago', createdDate: NOW - 30 * H }), 'not posted today');
  assert.equal(why({ companyName: '' }), 'incomplete listing');
  assert.equal(card({ placeholders: [{ type: 'salary', label: '15-18 Lacs PA' }] }).keep, true, '15L reaches the bar');
});

test('the JD: kept when enough of the technologies it asks for are yours; its share decides the list', () => {
  const java = jdCheck(card({}), { text: JAVA_JD }, { now: NOW });
  assert.equal(java.keep, true);
  assert.equal(java.profile, 'backend');
  assert.ok(java.skills.score >= 0.8, `${java.skills.have.length}/${java.skills.counted.length}`);
  assert.ok(!java.skills.counted.includes('Go') && !java.skills.counted.includes('Salesforce'), 'nice-to-haves and the company blurb left out');

  const dotnet = jdCheck(card({ title: 'Software Developer', tagsAndSkills: 'Microsoft Azure,SQL Server,AWS' }), { text: DOTNET_JD }, { now: NOW });
  assert.equal(dotnet.keep, false);
  assert.equal(dotnet.why, 'JD match under 60%');

  const ai = jdCheck(card({ title: 'AI Engineer', tagsAndSkills: 'Python,LLM,RAG' }), { text: AI_JD }, { now: NOW });
  assert.equal(ai.keep, true);
  assert.equal(ai.profile, 'ai');
  assert.ok(!ai.skills.counted.includes('PyTorch'), 'a nice-to-have');

  const ml = jdCheck(card({ title: 'Software Engineer', tagsAndSkills: '' }), { text: ML_JD }, { now: NOW });
  assert.equal(ml.profile, 'ai', 'mostly ML work');
  assert.equal(ml.keep, false, 'and not yours');

  const mixed = jdCheck(card({ title: 'Software Engineer' }), { text: 'Java, Spring Boot, Kafka, PostgreSQL microservices. Some LLM integration.' }, { now: NOW });
  assert.equal(mixed.profile, 'backend', 'a little LLM work keeps it backend-first');
});

test("the JD's own key skills count too, and the bar can be raised", () => {
  const c = card({ title: 'Software Engineer', tagsAndSkills: '' });
  const v = jdCheck(c, { text: 'Build services.', skills: ['Java', 'Spring Boot', 'Kafka', 'Go', 'GCP'] }, { now: NOW });
  assert.deepEqual([v.skills.have.length, v.skills.counted.length], [3, 5]);
  assert.equal(v.keep, true, '60% reaches the default bar');
  assert.equal(jdCheck(c, { text: 'Build services.', skills: ['Java', 'Spring Boot', 'Kafka', 'Go', 'GCP'] }, { now: NOW, minScore: 0.8 }).keep, false);
});

test('a JD naming few technologies is held to the same bar, and ranked a little lower', () => {
  const few = jdCheck(card({ title: 'Software Engineer', tagsAndSkills: '' }), { text: 'Strong Java skills.' }, { now: NOW });
  assert.equal(few.keep, true);
  assert.equal(few.few, true);
  assert.equal(jdCheck(card({ title: 'Software Engineer', tagsAndSkills: '' }), { text: 'Rust and Go services.' }, { now: NOW }).keep, false);
  assert.equal(jdCheck(card({ title: 'Software Engineer', tagsAndSkills: '' }), { text: 'Java and Go services.' }, { now: NOW }).keep, false, '1 of 2 is under 60%');
  assert.equal(jdCheck(card({ title: 'Software Engineer', tagsAndSkills: '' }), { text: 'Build great products.' }, { now: NOW }).keep, true, 'names none: nothing to judge');
});

test("a job page that can't be read: judged on its card's chips, only when they say enough", () => {
  assert.equal(cardOnly(card({ tagsAndSkills: 'Java,Spring Boot,Kafka,Docker' }), { now: NOW }).keep, true);
  assert.equal(cardOnly(card({ tagsAndSkills: 'Java,Spring Boot' }), { now: NOW }).keep, false, 'two chips say too little');
  assert.equal(cardOnly(card({ tagsAndSkills: 'Java,Spring Boot,Kafka,Docker' }), { now: NOW }).jd, false);
});

test('rank: a better fit ranks higher, always 0–100', () => {
  const good = jdCheck(card({ placeholders: [{ type: 'experience', label: '1-3 Yrs' }, { type: 'salary', label: '25-35 Lacs PA' }] }), { text: JAVA_JD }, { now: NOW });
  const weaker = jdCheck(card({ title: 'Senior Software Engineer', ambitionBoxData: { AggregateRating: '3.1', ReviewsCount: 50 }, createdDate: NOW - 8 * H, footerPlaceholderLabel: '' }),
    { text: 'Java, Spring Boot, Kafka, Angular, TypeScript, MySQL, Jenkins' }, { now: NOW, minScore: 0.4 });
  assert.ok(good.keep && weaker.keep);
  assert.ok(good.rank > weaker.rank, `${good.rank} > ${weaker.rank}`);
  assert.equal(rankOf({ fit: 1, score: 1, have: 8, years: { min: 2, max: 4 }, pay: { kind: 'shown', maxL: 30 }, rating: 4.5, reviews: 900, createdAt: NOW - H }, NOW), 100);
});

test("the opening sent to the site: the radar's fields plus the finder's own", () => {
  const v = jdCheck(card({ title: 'AI Engineer', tagsAndSkills: 'Python,LLM,RAG', salaryDetail: { hideSalary: true, minimumSalary: 2000000, maximumSalary: 3000000 } }), { text: AI_JD }, { now: NOW });
  const o = toOpening(v, NOW);
  assert.equal(o.finder, 'naukri');
  assert.equal(o.profile, 'ai');
  assert.equal(o.jd, true);
  assert.equal(o.postedAt, '2026-11-20');
  assert.ok(/^https:\/\/www\.naukri\.com\/job-listings-/.test(o.url));
  assert.equal(o.pay.verdict, 'hidden');
  assert.equal(o.coverage, Math.round(v.skills.score * 100));
  assert.equal(o.skillsTotal, v.skills.counted.length);
  assert.ok(o.aiShare >= 0.4 && o.rank > 0 && o.matched.every((m) => m.type === 'have'));
  const few = toOpening(jdCheck(card({ title: 'Software Engineer', tagsAndSkills: '' }), { text: 'Strong Java skills.' }, { now: NOW }), NOW);
  assert.equal(few.fewSkills, true);
  assert.deepEqual(payLabel({ kind: 'shown', minL: 15, maxL: 18 }), { verdict: 'fifteen', text: '₹15–18L posted' });
});

test('your skills: both resumes, plus extras typed in the settings', () => {
  const mine = mySkills();
  assert.ok(mine.has('Spring Boot') && mine.has('LangGraph') && mine.has('Java'));
  assert.ok(!mine.has('Struts'));
  assert.ok(mySkills(['Struts', 'Apache Camel']).has('Struts'));
});

test('rules are the agreed ones', () => {
  assert.equal(RULES.minPayL, 15);
  assert.equal(RULES.maxMinYears, 2.5);
  assert.equal(RULES.minScore, 0.6);
  assert.equal(RULES.dailyTarget, 100);
});
