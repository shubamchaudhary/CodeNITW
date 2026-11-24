// Unit tests for the Naukri job finder's rules (extensions/naukri-refresher/jobs-lib.js).
// Run: node --test extensions/naukri-refresher-dev/
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RULES, FINDER_LIMITS, SEARCHES, RUN_HOURS, searchUrl, searchesFor, trackerDay, nextFinderRun, normalizeJob, postedAgeH, postedTimeOf, parseYears,
  parseLakhs, parsePay, titleCheck, mySkills, chipCheck, cardCheck, jdSections, jdCheck, cardOnly, htmlToText, rankOf, toOpening, payLabel,
  LOW_PAY_COMPANIES, lowPayList, lowPayMatch, byParser,
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

test("search URLs use Naukri's own page with its filters: last 3 days, 2 years", () => {
  assert.equal(searchUrl('java spring boot developer'), 'https://www.naukri.com/java-spring-boot-developer-jobs?k=java%20spring%20boot%20developer&experience=2&jobAge=3');
  assert.equal(searchUrl('llm engineer', 3), 'https://www.naukri.com/llm-engineer-jobs-3?k=llm%20engineer&experience=2&jobAge=3');
  assert.ok(SEARCHES.some((s) => s.profile === 'ai') && SEARCHES.some((s) => s.profile === 'backend'), 'searches cover both lists');
  assert.equal(new Set(SEARCHES.map((s) => s.k)).size, SEARCHES.length, 'no search twice');
  assert.ok(SEARCHES.every((s) => !('pages' in s)), 'no page count: every page of every search is read');
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

test('the finder runs once a day, within ±7 min of 17:00 IST, and never repeats a day', () => {
  assert.deepEqual([...RUN_HOURS], [17]);
  const at = (h, min = 0, d = 20) => Date.UTC(2026, 10, d, h, min) - IST;
  const a = nextFinderRun(at(8, 0), null, () => 0);
  assert.equal(a.slot, '2026-11-20T17');
  assert.equal(a.at, at(16, 53));
  assert.equal(nextFinderRun(at(8, 0), null, () => 1).at, at(17, 7));
  assert.equal(nextFinderRun(at(17, 30), '2026-11-20T17', () => 0.5).slot, '2026-11-21T17', 'the next day after today has run');
  assert.equal(nextFinderRun(at(20, 0), null, () => 0.5).slot, '2026-11-21T17', 'a day the PC slept through 17:00 waits for tomorrow');
  assert.equal(nextFinderRun(at(17, 3), null, () => 0).at, at(17, 3), 'within the window: right away');
});

test('a listing is normalized: absolute link, id from the link when missing, labels by type', () => {
  const j = normalizeJob({ title: ' Java  Dev ', companyName: 'X', jdURL: '/job-listings-java-dev-x-201125012345', placeholders: [{ type: 'Experience', label: '1-3 Yrs' }] });
  assert.equal(j.url, 'https://www.naukri.com/job-listings-java-dev-x-201125012345');
  assert.equal(j.id, '201125012345');
  assert.equal(j.title, 'Java Dev');
  assert.equal(j.expText, '1-3 Yrs');
  assert.deepEqual(normalizeJob({ tagsAndSkills: 'Java, java ,Spring Boot,,Kafka' }).tags, ['Java', 'Spring Boot', 'Kafka']);
});

test("how long ago it was posted: the listing's own \"x ago\" label first, then its creation time", () => {
  const base = normalizeJob(job());
  assert.equal(postedAgeH({ ...base, footer: 'Just Now' }, NOW), 0);
  assert.equal(postedAgeH({ ...base, footer: '5 hours ago' }, NOW), 5);
  assert.equal(postedAgeH({ ...base, footer: 'Few Hours Ago' }, NOW), 6);
  assert.equal(postedAgeH({ ...base, footer: '1 Day Ago' }, NOW), 24);
  assert.equal(postedAgeH({ ...base, footer: '30+ Days Ago' }, NOW), 720);
  assert.equal(postedAgeH({ ...base, footer: '', createdAt: NOW - 30 * H }, NOW), 30);
  assert.equal(postedAgeH({ ...base, footer: '', createdAt: null }, NOW), null, "it doesn't say");
});

test("when it was posted, for the site's 48 hours: Naukri's own time when it agrees with the label", () => {
  const base = normalizeJob(job());
  assert.equal(postedTimeOf({ ...base, createdAt: NOW - 30 * H }, 24, NOW), NOW - 30 * H, '"1 day ago" and created 30 h ago agree');
  assert.equal(postedTimeOf({ ...base, createdAt: NOW - 10 * D }, 24, NOW), NOW - 24 * H, 'a reposted job: the label wins');
  assert.equal(postedTimeOf({ ...base, createdAt: null }, 6, NOW), NOW - 6 * H, 'only the label');
  assert.equal(postedTimeOf({ ...base, createdAt: NOW - 5 * H }, null, NOW), NOW - 5 * H, 'only its own time');
  assert.equal(postedTimeOf({ ...base, createdAt: null }, null, NOW), NOW, "neither: when it's found");
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
    'AI Builder (Senior Product Designer)',
    // Your lists are Java/Spring Boot and Python/GenAI: a title naming only a JavaScript stack is out.
    'Node.js Developer', 'Full Stack Developer (React + Node)', 'TypeScript Developer', 'MERN Stack Developer', 'MEAN Stack Developer', 'NestJS Backend Developer',
    // Not a software job at all.
    'Gardener', 'Accountant', 'Store Associate', 'Chef'];
  for (const t of out) assert.equal(titleCheck(t).ok, false, t);
  const keep = ['Software Engineer', 'Software Developer', 'SDE 2', 'Member of Technical Staff', 'Java Consultant', 'Backend Engineer',
    'Python Developer', 'Full Stack Developer', 'Java Full Stack Developer (Angular)', 'Full Stack Engineer (Java, React)',
    'Generative AI Engineer', 'LLM Engineer', 'AI/ML Engineer', 'Senior Software Engineer', 'Application Developer',
    'Member Technical Staff', 'Software Development Specialist', 'Programmer Analyst'];
  for (const t of keep) assert.equal(titleCheck(t).ok, true, t);
  assert.equal(titleCheck('Telecom Software Developer - C/C++').why, 'C/C++ role');
  assert.equal(titleCheck('MERN Stack Developer').why, 'MERN/MEAN stack role');
  assert.equal(titleCheck('Gardener').why, 'not a software role');
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
  assert.equal(why({ placeholders: [{ type: 'salary', label: '6-10 Lacs PA' }] }), 'pays under 18L');
  assert.equal(why({ salaryDetail: { hideSalary: true, minimumSalary: 400000, maximumSalary: 800000 } }), 'pays under 18L', 'a hidden but known low salary');
  assert.equal(why({ title: 'Software Developer', tagsAndSkills: 'C#,.NET,ASP.NET,SQL Server,Entity Framework' }), "card's skills are another stack");
  assert.equal(why({ footerPlaceholderLabel: '3 Days Ago', createdDate: NOW - 80 * H }), 'posted over 48 hours ago');
  assert.equal(why({ footerPlaceholderLabel: '2 Days Ago', createdDate: NOW - 50 * H }), 'posted over 48 hours ago');
  assert.equal(card({ footerPlaceholderLabel: '1 Day Ago', createdDate: NOW - 30 * H }).keep, true, 'the last 48 hours, as Naukri labels them');
  assert.equal(card({ footerPlaceholderLabel: '', createdDate: NOW - 47 * H }).keep, true);
  assert.equal(why({ footerPlaceholderLabel: '', createdDate: NOW - 49 * H }), 'posted over 48 hours ago', 'no label: its own time');
  assert.equal(why({ isApplied: true }), 'you applied on Naukri');
  assert.equal(why({ applyStatus: 'APPLIED' }), 'you applied on Naukri');
  assert.equal(card({ applyCount: 250, isApplied: false }).keep, true, "other people's applications don't count");
  assert.equal(card({ footerPlaceholderLabel: '', createdDate: null }).keep, true, "doesn't say when: kept");
  assert.equal(why({ companyName: '' }), 'incomplete listing');
  assert.equal(card({ placeholders: [{ type: 'salary', label: '15-18 Lacs PA' }] }).keep, true, 'the upper end reaches 18L');
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
  assert.equal(jdCheck(card({ title: 'Software Engineer', tagsAndSkills: '' }), { text: 'Build great products.' }, { now: NOW }).keep, false, 'a bare engineering title cannot establish a target stack');
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
  assert.equal(o.postedAt, '2026-11-20', 'the day it was found');
  assert.equal(o.postedTime, NOW - 2 * H, "Naukri's own posting time (it agrees with \"Few Hours Ago\")");
  const reposted = toOpening(jdCheck(card({ title: 'AI Engineer', tagsAndSkills: 'Python,LLM,RAG', createdDate: NOW - 9 * D, footerPlaceholderLabel: '1 Day Ago' }), { text: AI_JD }, { now: NOW }), NOW);
  assert.equal(reposted.postedTime, NOW - 24 * H, 'reposted: the label, so the 48 hours count from it');
  assert.ok(/^https:\/\/www\.naukri\.com\/job-listings-/.test(o.url));
  assert.equal(o.pay.verdict, 'hidden');
  assert.equal(o.coverage, Math.round(v.skills.score * 100));
  assert.equal(o.skillsTotal, v.skills.counted.length);
  assert.ok(o.aiShare >= 0.4 && o.rank > 0 && o.matched.every((m) => m.type === 'have'));
  const few = toOpening(jdCheck(card({ title: 'Software Engineer', tagsAndSkills: '' }), { text: 'Strong Java skills.' }, { now: NOW }), NOW);
  assert.equal(few.fewSkills, true);
  assert.deepEqual(payLabel({ kind: 'shown', minL: 15, maxL: 18 }), { verdict: 'negotiable', text: '₹15–18L posted' });
});

test('your skills: both resumes, plus extras typed in the settings', () => {
  const mine = mySkills();
  assert.ok(mine.has('Spring Boot') && mine.has('LangGraph') && mine.has('Java'));
  assert.ok(!mine.has('Struts'));
  assert.ok(mySkills(['Struts', 'Apache Camel']).has('Struts'));
});

test('low-pay companies are out on the card, matched on whole words of the name; your list replaces the default', () => {
  for (const name of ['Accenture Solutions Pvt Ltd', 'Tata Consultancy Services Limited', 'TCS', 'Infosys BPM', 'Cognizant Technology Solutions India',
    'HCLTech', 'HCL Technologies', 'LTIMindtree', 'Larsen & Toubro Infotech', 'Ernst & Young', 'EY GDS', 'Capgemini Technology Services India Limited']) {
    assert.ok(lowPayMatch(name), name);
    assert.equal(card({ companyName: name }).why, 'low-pay company', name);
  }
  // Left off the list on purpose: they can reach your bar, or the name catches more than the services arm.
  for (const name of ['Acme Software', 'Bey Labs', 'Trust Bank', 'Atlassian', 'Thoughtworks', 'Hclean Foods', 'Tata 1mg', 'Persistent Ventures',
    'NTT DATA', 'Persistent Systems', 'CGI', 'IBM India Pvt Ltd', 'Fujitsu Research of India', 'Nucleus Software', 'Infogain', 'Larsen & Toubro Limited', 'L&T Finance']) {
    assert.equal(lowPayMatch(name), null, name);
  }
  assert.equal(card({ companyName: 'Accenture', isApplied: true }).why, 'you applied on Naukri', 'applied is said first');
  const mine = lowPayList(['Acme Software']);
  assert.equal(cardCheck(job({ companyName: 'Acme Software Pvt Ltd' }), { now: NOW, lowPay: mine }).why, 'low-pay company');
  assert.equal(cardCheck(job({ companyName: 'Accenture' }), { now: NOW, lowPay: mine }).keep, true, 'your list replaces the default one');
  assert.equal(cardCheck(job({ companyName: 'Accenture' }), { now: NOW, lowPay: lowPayList([]) }).keep, true, 'an empty list leaves nobody out');
  assert.ok(LOW_PAY_COMPANIES.length >= 50 && LOW_PAY_COMPANIES.includes('Accenture'));
});

test('the main stack decides: Java is Backend, Python with GenAI (or FastAPI) is AI; JavaScript, MERN and other stacks are out', () => {
  const jd = (title, text, over = {}) => jdCheck(card({ title, tagsAndSkills: '', ...over }), { text: `Requirements\n${text}` }, { now: NOW, minScore: 0.4 });
  const mern = jd('Software Engineer', '• React, Node.js, Express.js, MongoDB, JavaScript, TypeScript, HTML, CSS, REST APIs\n• Java is a plus');
  assert.deepEqual([mern.keep, mern.why], [false, 'frontend or MERN stack'], 'a plain Software Engineer card is opened, and its JD decides');
  const javaFs = jd('Full Stack Developer', '• Java, Spring Boot, Microservices, Hibernate, PostgreSQL\n• React or Angular for the UI');
  assert.deepEqual([javaFs.keep, javaFs.profile], [true, 'backend'], 'some frontend next to a Java core is fine');
  const genai = jd('Software Engineer', '• Python, FastAPI, LangChain, LangGraph, RAG, vector databases\n• PostgreSQL, Docker');
  assert.deepEqual([genai.keep, genai.profile], [true, 'ai']);
  const fastapi = jd('Backend Developer', '• Python, FastAPI, PostgreSQL, Docker, Kafka, Redis');
  assert.equal(fastapi.keep, false, 'FastAPI alone is not GenAI application work');
  const django = jd('Python Developer', '• Python, Django, Flask, Celery, PostgreSQL, REST APIs');
  assert.deepEqual([django.keep, django.why], [false, 'Python role without GenAI']);
  const javaAi = jd('Backend Engineer', '• Java, Spring Boot, Kafka, PostgreSQL\n• Integrate LLM APIs (OpenAI) into services');
  assert.deepEqual([javaAi.keep, javaAi.profile], [true, 'backend'], 'Java with some AI: Backend');
  const dotnet = jd('Software Engineer', '• C#, ASP.NET Core, Entity Framework, SQL Server, Azure', { tagsAndSkills: '' });
  assert.equal(dotnet.keep, false);
  // The card: chips that are all JavaScript (or all another stack) aren't opened.
  assert.equal(card({ title: 'Software Engineer', tagsAndSkills: 'React.js,Node.js,MongoDB,Express.js' }).why, 'frontend or MERN stack');
  assert.equal(card({ title: 'Full Stack Developer', tagsAndSkills: 'Java,Spring Boot,React,Angular' }).keep, true);
  assert.equal(card({ title: 'Software Engineer', tagsAndSkills: 'Software,Strategic,Communication' }).keep, true, 'filler chips: its JD decides');
});

test("the parser's order: JD match first, few-skills JDs after, then no-skills ones; rank breaks ties", () => {
  const list = [
    { id: 'a', coverage: 70, rank: 60 }, { id: 'b', coverage: 90, rank: 40 }, { id: 'c', coverage: 95, fewSkills: true, rank: 90 },
    { id: 'd', coverage: null, rank: 99 }, { id: 'e', coverage: 70, rank: 80 },
  ].sort(byParser);
  assert.deepEqual(list.map((o) => o.id), ['b', 'e', 'a', 'c', 'd']);
});

test('rules are the agreed ones', () => {
  assert.equal(RULES.maxAgeH, 48, 'the last 48 hours ("2 days ago" is out)');
  assert.equal(RULES.showHours, 48);
  assert.equal(RULES.poolTop, 1000, 'every job it keeps goes to your site and is rated (up to 1,000 a list)');
  assert.equal(RULES.showTop, 100, 'your site shows the top 100 per list, highest rating first');
  assert.equal(RULES.minPayL, 18);
  assert.equal(RULES.maxMinYears, 2.5);
  assert.equal(RULES.minScore, 0.6);
  assert.equal(RULES.dailyTarget, undefined, 'no daily target: every listing is read');
  assert.equal(FINDER_LIMITS.runMinutes, 60, 'a run may take up to an hour');
});

test('primary work decides the list when React, Java or AI tools appear together', () => {
  const check = (title, text) => jdCheck(card({ title, tagsAndSkills: '' }), { text }, { now: NOW });
  const backend = check('Full Stack Developer', 'Backend-first role building Java Spring Boot services. Occasional React, Angular, CSS and TypeScript.');
  assert.deepEqual([backend.keep, backend.profile], [true, 'backend']);
  assert.equal(check('Java Spring Boot Developer', 'This posting contains only a company overview.').keep, true, 'a target title gets a chance to be reviewed');
  const ui = check('Full Stack Developer', 'Primary responsibility is owning the React UI. Consume Java Spring Boot APIs.');
  assert.equal(ui.keep, false);
  assert.equal(check('AI Engineer', 'Manage administrative processes and coordinate travel.').keep, false);
  const aid = check('SDE-Backend', 'Build Java Spring Boot services. Use AI-assisted coding tools (LLM APIs) in your daily workflow.');
  assert.deepEqual([aid.keep, aid.profile], [true, 'backend']);
  const core = check('AI Engineer', 'Develop RAG pipelines using LangGraph and Python. Maintain Kubernetes, Terraform, Helm, Argo CD, GCP and Istio.');
  assert.deepEqual([core.keep, core.profile], [true, 'ai']);
  assert.equal(card({title: 'Java Spring Boot Developer', tagsAndSkills: 'React, TypeScript, HTML, CSS'}).keep, true, 'read the JD when a target title conflicts with chips');
});

test('pay boundaries for negotiable, target and preferred listings', () => {
  for (const [hi, verdict] of [[17.99, 'below'], [18, 'negotiable'], [19.9, 'negotiable'], [20, 'target'], [24.9, 'target'], [25, 'meets']]) {
    assert.equal(payLabel({kind: 'shown', minL: 16, maxL: hi}).verdict, verdict);
    assert.equal(card({salaryDetail: {minimumSalary: 1600000, maximumSalary: hi * 100000}}).keep, hi >= 18);
  }
});
