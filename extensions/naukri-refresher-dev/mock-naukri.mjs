// A fake www.naukri.com (and a fake interviewplanprep.vercel.app: its /api/radar and the Job
// tracker page's job finder handover; and a fake api.groq.com for the AI rating) for end-to-end
// tests. Browsers are pointed at it with --host-resolver-rules (Chromium) or
// network.dns.localDomains (Firefox).
import https from 'node:https';
import { instahyreApi, INSTA_JOBS } from './mock-instahyre.mjs';
import { readFileSync } from 'node:fs';

const API = '/cloudgateway-mynaukri/resman-aggregator-services';
const TOKEN = 'FAKE.TOKEN.VALUE';
export const RADAR_TOKEN = 'TEST-INGEST';
// The site's own pieces: the owner's sign-in (a Firebase ID token there) and the finder's token
// it hands out (api/radar.mjs finderToken makes the real one).
export const OWNER_ID_TOKEN = 'OWNER-ID-TOKEN';
export const FINDER_TOKEN = `nrf1.${'T'.repeat(43)}`;
// The site's real handover code, served to the fake Job tracker page below.
const BRIDGE_FILE = new URL('../../src/pages/JobTracker/finderBridge.js', import.meta.url);
const H = 3_600_000;

// The AI rating's fake Groq: one key it accepts, one it rejects, one that's at its limit.
// Its token counts are kept small (the pacing is checked in rate.test.mjs), so one good key rates every job in the test's time.
export const GROQ_KEYS = { good: `gsk_${'G1'.repeat(26)}`, bad: `gsk_${'B2'.repeat(26)}`, busy: `gsk_${'Z3'.repeat(26)}` };
// The resumes the tests rate against (jobsDev.resume): no Kubernetes on them.
export const TEST_RESUME = {
  sde: 'Software Engineer | Backend\nSummary\nSoftware Engineer with 2+ years in Java, Spring Boot, Microservices, Hibernate and REST APIs.\n'
    + 'Technical Skills\nLanguages: Java, Python (FastAPI), SQL\nData & Messaging: PostgreSQL, MySQL, Redis, Apache Kafka\nCloud & DevOps: Docker, Git\n'
    + 'GenAI: LangChain, RAG, LLM agents, Vector Database search',
  genai: 'Software Engineer | GenAI\nSummary\nSoftware Engineer with 2+ years building LLM agents and RAG in Python and FastAPI.\n'
    + 'Technical Skills\nLanguages: Python (FastAPI), Java, SQL\nGenAI: Generative AI, LLM, RAG, LangChain, Vector Database\nData: PostgreSQL, Redis, Apache Kafka\n'
    + 'Frameworks: Spring Boot, Microservices, Docker',
};
const RATE_SKILLS = ['Java', 'Spring Boot', 'Microservices', 'Kafka', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'Python', 'FastAPI', 'LLM', 'RAG',
  'Langchain', 'Hibernate', 'MySQL', 'SQL', 'REST APIs', 'Vector Database', 'Generative AI'];
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** What the fake model answers: the JD's known skills, met when the resume names them, plus two planted mistakes. */
function groqAnswer(content) {
  const resume = (content.split('\nJOB:\n')[0] || '').split('RESUME SUMMARY (documented evidence only):\n')[1] || '';
  const job = content.split('\nJOB:\n')[1] || '';
  const requirements = [];
  for (const k of RATE_SKILLS) {
    if (!new RegExp(`\\b${esc(k)}\\b`, 'i').test(job)) continue;
    const m = resume.match(new RegExp(`\\b${esc(k)}\\b`, 'i'));
    if (m) requirements.push({ req: k, must: true, met: 'yes', evidence: m[0] });
    else if (k === 'Kubernetes') requirements.push({ req: k, must: true, met: 'yes', evidence: 'Kubernetes in production' }); // not on the resume
    else requirements.push({ req: k, must: true, met: 'no', evidence: '' });
  }
  requirements.push({ req: 'Rust systems programming', must: true, met: 'no', evidence: '' }); // not in the JD
  const title = (job.match(/^Title: (.*)$/m) || [])[1] || '';
  const years = Number((job.match(/^Experience asked: (\d+)/m) || [])[1]);
  return {
    relevance: 80, reject: false, why: `A ${title} role.`,
    requirements, min_years: Number.isFinite(years) ? years : null, role: /\b(ai|llm|genai|generative)\b/i.test(title) ? 'genai' : 'backend', level: 'mid',
    pay_low: null, pay_high: null, pay_known: false,
  };
}

// ---------------------------------------------------------------- the job search fixtures

const idOf = (n) => String(201100000000 + n);
export function listing(n, over = {}) {
  const id = idOf(n);
  return {
    jobId: id,
    title: 'Backend Engineer',
    companyName: `Company ${n}`,
    jdURL: `/job-listings-backend-engineer-company-${n}-bengaluru-2-to-5-years-${id}`,
    createdDate: Date.now() - 2 * H,
    footerPlaceholderLabel: 'Few Hours Ago',
    placeholders: [
      { type: 'experience', label: '2-5 Yrs' },
      { type: 'salary', label: 'Not disclosed' },
      { type: 'location', label: 'Bengaluru' },
    ],
    tagsAndSkills: 'Java,Spring Boot,Docker,Kubernetes',
    ambitionBoxData: { AggregateRating: '3.9', ReviewsCount: 120 },
    jobDescription: '<p>Build backend services.</p>',
    salaryDetail: { hideSalary: true, minimumSalary: 0, maximumSalary: 0 },
    ...over,
  };
}
const exp = (label) => ({ type: 'experience', label });
const sal = (label) => ({ type: 'salary', label });
const loc = { type: 'location', label: 'Pune' };

// What each search returns; ids are the listing numbers above. KEEP/DROP is what the finder must do.
export function fixtures() {
  const java1 = [
    listing(1, { title: 'Java Developer', tagsAndSkills: 'Java,Spring Boot,Microservices,Kafka' }), // KEEP backend
    listing(2, { title: 'Android Developer', tagsAndSkills: 'Kotlin,Android,Java' }), // DROP title
    listing(3, { title: '.NET Developer', tagsAndSkills: 'C#,.Net,SQL Server' }), // DROP title
    listing(4, { title: 'QA Automation Engineer', tagsAndSkills: 'Selenium,Java' }), // DROP title
    listing(5, { title: 'Java Developer', placeholders: [exp('3-6 Yrs'), sal('Not disclosed'), loc] }), // DROP years
    listing(6, { title: 'Java Developer', placeholders: [exp('2-5 Yrs'), sal('6-10 Lacs PA'), loc] }), // DROP pay
    listing(7, { title: 'Java Developer', salaryDetail: { hideSalary: true, minimumSalary: 1800000, maximumSalary: 2600000 } }), // KEEP, pay hidden
    listing(8, { title: 'Java Developer', footerPlaceholderLabel: '3 Days Ago', createdDate: Date.now() - 80 * H }), // DROP: 3+ days old
    listing(65, { title: 'Java Developer', footerPlaceholderLabel: '2 Days Ago', createdDate: Date.now() - 50 * H }), // DROP: over 48 hours
    listing(64, { title: 'Backend Developer', footerPlaceholderLabel: '1 Day Ago', createdDate: Date.now() - 30 * H, tagsAndSkills: 'Java,Spring Boot,Kafka,PostgreSQL' }), // KEEP: the last 48 hours
    listing(9, { title: 'Software Engineer', tagsAndSkills: '', placeholders: [], jobDescription: '' }), // KEEP, nothing known
    listing(10, { title: 'Java Developer', tagsAndSkills: 'Java,Struts,JSP,Oracle,PL/SQL' }), // DROP skills
    listing(11, { title: 'Python Developer', tagsAndSkills: 'Python,FastAPI,LLM,RAG,PostgreSQL', placeholders: [exp('1-3 Yrs'), sal('20-30 Lacs PA'), loc] }), // KEEP ai: Python, FastAPI and GenAI
    ...[12, 13, 14, 15, 16, 17, 18, 19, 20].map((n) => listing(n)), // KEEP backend
  ];
  const java2 = [
    listing(21), // KEEP
    listing(22, { title: 'Lead Java Developer' }), // DROP title
    listing(23, { title: 'Software Developer', tagsAndSkills: 'Java,Hibernate,MySQL' }), // KEEP
    listing(24, { title: 'Java Developer', placeholders: [exp('0-1 Yrs'), sal('Not disclosed'), loc] }), // DROP fresher
    listing(25, { title: 'PHP Developer' }), // DROP title
    listing(61, { title: 'Software Developer', tagsAndSkills: 'Software,Compliance,Partnerships,Strategic' }), // KEEP: filler chips, its JD is Java
    listing(62, { title: 'Software Developer', tagsAndSkills: 'Microsoft Azure,SQL Server,AWS' }), // DROP: fine chips, its JD is .NET
    listing(63, { title: 'Java Developer', tagsAndSkills: 'Java,Spring Boot,Microservices,Docker' }), // KEEP: its page fails, judged by its chips
    listing(66, { title: 'Java Developer', tagsAndSkills: 'Java,Spring Boot,Kafka' }), // DROP: its page's data says you applied
    listing(67, { title: 'Java Developer', tagsAndSkills: 'Java,Spring Boot,Redis' }), // DROP: its page's apply button says "Applied"
    listing(68, { title: 'Java Developer', isApplied: true }), // DROP: its card says you applied (page not opened)
    listing(69, { title: 'Java Developer', companyName: 'Accenture Solutions Pvt Ltd' }), // DROP: a low-pay company (page not opened)
    listing(70, { title: 'Software Engineer', tagsAndSkills: 'React.js,Node.js,MongoDB,Express.js' }), // DROP: MERN chips (page not opened)
    listing(71, { title: 'Software Engineer', tagsAndSkills: 'Software,Strategic' }), // DROP: filler chips; its JD is MERN (page opened)
    listing(72, { title: 'Java Full Stack Developer', tagsAndSkills: 'Java,Spring Boot,React,Microservices' }), // KEEP backend: some frontend is fine
  ];
  return {
    'java spring boot developer': [java1, java2],
    'software engineer': [[
      java1[0], // the same listing in a second search: counted once
      listing(31, { title: 'Software Engineer', tagsAndSkills: 'Java,SQL' }), // KEEP
      listing(32, { title: 'Data Engineer', tagsAndSkills: 'Spark,Python,SQL' }), // DROP title
    ]],
    'generative ai engineer': [[
      listing(41, { title: 'Generative AI Engineer', tagsAndSkills: 'Python,Generative AI,LLM,RAG,Langchain' }), // KEEP ai
      listing(42, { title: 'AI Engineer', tagsAndSkills: 'Python,Machine Learning,Deep Learning,PyTorch,TensorFlow' }), // DROP skills
      listing(43, { title: 'LLM Engineer', tagsAndSkills: 'Python,LLM,Vector Database' }), // KEEP ai
    ]],
  };
}
export const EXPECT = {
  keep: [1, 7, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 31, 41, 43, 61, 63, 64, 72].map(idOf),
  drop: [2, 3, 4, 5, 6, 8, 10, 22, 24, 25, 32, 42, 62, 65, 66, 67, 68, 69, 70, 71].map(idOf),
  ai: [11, 41, 43].map(idOf),
  lowPay: [69].map(idOf),
  mern: { card: [70].map(idOf), jd: [71].map(idOf) },
  cardOnly: [63].map(idOf), // kept on its card: its page couldn't be read
  pageFails: [63].map(idOf),
  applied: { card: [68].map(idOf), data: [66].map(idOf), button: [67].map(idOf) },
  companySite: [12, 13].map(idOf), // "Apply on company site": the job's data has the company's link
  idOf,
};

// The JDs on the job pages. A listing without its own gets one listing its chips as requirements,
// plus a company blurb whose technologies must not count.
const JDS = {
  [idOf(9)]: '<p>Build and run backend services.</p><p><strong>Requirements</strong></p><ul><li>Java, Spring Boot</li><li>REST APIs, PostgreSQL</li><li>Docker</li></ul>',
  [idOf(61)]: '<p>Design, develop, test, and maintain software applications.</p><p><strong>Preferred candidate profile</strong></p><ul><li>Strong Java and Spring Boot, REST APIs, Microservices</li>'
    + '<li>PostgreSQL, Redis, Kafka</li><li>Docker, Kubernetes, CI/CD</li></ul><p>Good to have: Go, Terraform</p><p><strong>About Company</strong></p><p>We work with Salesforce and SAP clients.</p>',
  [idOf(62)]: '<p>The ideal candidate should have a strong foundation in .NET technologies.</p><p><strong>Requirements:</strong></p><ul><li>C#, ASP.NET MVC, .NET Core, Web API</li>'
    + '<li>SQL Server, Entity Framework</li><li>Azure DevOps, Git</li></ul>',
  [idOf(71)]: '<p>Build our customer web app end to end.</p><p><strong>Requirements</strong></p><ul><li>React.js, Redux, TypeScript, HTML, CSS</li>'
    + '<li>Node.js, Express.js, MongoDB, REST APIs</li><li>Docker, Git</li></ul>',
};
function jdFor(l) {
  if (JDS[l.jobId]) return JDS[l.jobId];
  const tags = String(l.tagsAndSkills || '').split(',').map((t) => t.trim()).filter(Boolean);
  return `<p>We are hiring a ${l.title} at ${l.companyName}.</p><p><strong>Requirements</strong></p><ul>${tags.map((t) => `<li>Hands-on experience with ${t}</li>`).join('')}</ul>`
    + '<p><strong>About us</strong></p><p>We work with Salesforce, SAP and ServiceNow customers.</p>';
}

// The search page: like Naukri's, it loads its results with a request of its own after the HTML
// (fetch for some searches, XMLHttpRequest for the AI ones, so both capture paths are tested).
const SRP_PAGE = `<!doctype html><html><head><meta charset="utf-8"><title>Jobs</title></head><body>
<iframe src="/recaptcha/api2/anchor?size=invisible" style="width:0;height:0;border:0;position:absolute"></iframe>
<div id="list">Loading…</div>
<script>
(async () => {
  const m = location.pathname.match(/^\\/(.+?)-jobs(?:-(\\d+))?$/);
  const q = new URLSearchParams(location.search);
  const k = q.get('k') || '';
  const url = '/jobapi/v3/search?noOfResults=20&urlType=search_by_keyword&searchType=adv&keyword=' + encodeURIComponent(k)
    + '&pageNo=' + ((m && m[2]) || '1') + '&experience=' + (q.get('experience') || '') + '&jobAge=' + (q.get('jobAge') || '');
  let status = 0, data = null;
  if (/\\b(ai|llm|genai|langchain|agentic)\\b/.test(k)) {
    await new Promise((ok) => { const x = new XMLHttpRequest(); x.open('GET', url); x.setRequestHeader('appid', '109');
      x.onloadend = () => { status = x.status; try { data = JSON.parse(x.responseText); } catch (e) {} ok(); }; x.send(); });
  } else {
    const r = await fetch(url, { headers: { appid: '109', systemid: 'Naukri' } });
    status = r.status; data = await r.json().catch(() => null);
  }
  const list = document.getElementById('list');
  if (status === 406) {
    list.innerHTML = '<p>Please verify you are human.</p><iframe src="/recaptcha/api2/bframe?k=1" width="300" height="400"></iframe>';
    return;
  }
  const jobs = (data && data.jobDetails) || [];
  list.innerHTML = jobs.length ? jobs.map((j) => '<article class="srp-jobtuple-wrapper" data-job-id="' + j.jobId + '"><a class="title" href="' + j.jdURL + '">' + j.title + '</a></article>').join('') : '<p>No jobs found</p>';
})();
</script></body></html>`;

// The site's Job tracker page, as far as the job finder is concerned: it runs the real
// finderBridge.js, signed in as the owner (or, with ?idt=, as someone else), and reports what
// came of it to /__bridge/result.
const SITE_PAGE = `<!doctype html><html><head><meta charset="utf-8"><title>Job tracker</title></head><body><p id="out">…</p>
<script type="module">
import { connectFinder } from '/__bridge/finderBridge.js';
const idt = new URLSearchParams(location.search).get('idt') || ${JSON.stringify(OWNER_ID_TOKEN)};
const r = await connectFinder({ getIdToken: async () => idt });
document.getElementById('out').textContent = JSON.stringify(r);
await fetch('/__bridge/result', { method: 'POST', body: JSON.stringify(r) });
</script></body></html>`;

// The job page: like Naukri's, it loads the job's details with a request of its own after the HTML.
const JOB_PAGE = `<!doctype html><html><head><meta charset="utf-8"><title>Job</title></head><body>
<iframe src="/recaptcha/api2/anchor?size=invisible" style="width:0;height:0;border:0;position:absolute"></iframe>
<div id="jd">Loading…</div>
<script>
(async () => {
  const id = (location.pathname.match(/-(\\d{9,})$/) || [])[1];
  const r = await fetch('/jobapi/v4/job/' + id + '?microsite=y', { headers: { appid: '121', systemid: 'Naukri' } });
  const box = document.getElementById('jd');
  if (r.status === 406) {
    box.innerHTML = '<p>Please verify you are human.</p><iframe src="/recaptcha/api2/bframe?k=1" width="300" height="400"></iframe>';
    return;
  }
  const d = await r.json().catch(() => null);
  // Its apply button first ("Applied" once you have), and further down other jobs, one of them
  // applied to: only the job's own button counts.
  const apply = d && d.jobDetails && d.jobDetails.mockApplied
    ? '<span id="already-applied" class="styles_already-applied">Applied</span>'
    : d && d.jobDetails && d.jobDetails.applyRedirectUrl
      ? '<button id="company-site-button" class="styles_company-site-button">Apply on company site</button>'
      : '<button id="apply-button" class="styles_apply-button">Apply</button>';
  box.innerHTML = d && d.jobDetails
    ? '<header>' + apply + '</header><section class="styles_job-desc-container"><div class="styles_JDC__dang-inner-html">' + d.jobDetails.description + '</div></section>'
      + '<aside class="similar-jobs"><article><a href="#">Another job</a><button class="styles_applied">Applied</button></article></aside>'
    : '<p>Something went wrong. Please try again.</p>';
})();
</script></body></html>`;

// ---------------------------------------------------------------- the server

export async function startMock({ key, cert }) {
  const state = {};
  // The fake www.instahyre.com (mock-instahyre.mjs).
  const insta = {};
  const instaReset = (over = {}) => Object.assign(insta, { mode: 'ok', jobs: INSTA_JOBS(), applies: [], attempts: [], searches: [], notInterested: [], needsMore: 'j9', limitAfter: 2, format: 'any' }, over);
  instaReset();
  const reset = (over = {}) => Object.assign(state, {
    mode: 'ok', // ok | 500 | 429 | 401 | drop | shape | ignore | wipe
    headline: 'Backend Software Engineer (Java) | 2+ YOE',
    profileId: 'pid-12345678',
    name: 'Test User',
    keySkills: 'Java, Spring Boot, Kafka',
    employments: [{ designation: 'Software Engineer', organization: 'Some Co' }],
    saves: 0,
    requests: [],
    srpMode: 'ok', // ok | captcha
    srpExtra: [], // listings put first on the first page of the Java search
    jobMode: 'ok', // ok | captcha (job pages answer 406)
    radarMode: 'ok', // ok | old (a site that doesn't know the finder)
    finderResetAt: 0, // when the finder last started over
    radarResets: 0,
    radarPosts: [],
    radarPostAuth: [], // which token each upload came with: ingest | finder
    radarChecks: 0,
    radarPairs: 0, // finder tokens handed to the owner's page
    bridgeResults: [], // what each Job tracker page made of the handover
    groqMode: 'ok', // ok | reject (every key 401) | limit (every known key 429)
    groqCalls: [], // each rating request: { key, body }
    groqModelChecks: 0,
    payLookups: [], // the companies the pay lookup asked about
    payDb: new Map(), // the site's company pay database (Firestore companyPay)
    payLog: [], // what happened to it, in order: { op: 'get' | 'put' | 'web', key | company }
  }, over);
  reset();

  // The fake api.groq.com: chat completions for the rating, the models list for "Check keys".
  const groqApi = (req, res, url, body) => {
    const reply = (code, payload, headers = {}) => {
      res.writeHead(code, { 'content-type': 'application/json', ...headers });
      res.end(JSON.stringify(payload));
    };
    const key = String(req.headers.authorization || '').replace(/^Bearer /, '');
    const known = key === GROQ_KEYS.good || key === GROQ_KEYS.busy;
    const rejected = !known || state.groqMode === 'reject';
    if (req.method === 'GET' && url.pathname === '/openai/v1/models') {
      state.groqModelChecks += 1;
      if (rejected) return reply(401, { error: { message: 'Invalid API Key', type: 'invalid_request_error', code: 'invalid_api_key' } });
      return reply(200, { object: 'list', data: [{ id: 'openai/gpt-oss-20b' }, { id: 'openai/gpt-oss-120b' }] });
    }
    if (req.method !== 'POST' || url.pathname !== '/openai/v1/chat/completions') return reply(404, { error: { message: 'not found' } });
    let j = null;
    try { j = JSON.parse(body); } catch { return reply(400, { error: { message: 'bad json' } }); }
    state.groqCalls.push({ key, body: j, t: Date.now() });
    if (rejected) return reply(401, { error: { message: 'Invalid API Key', type: 'invalid_request_error', code: 'invalid_api_key' } });
    if (state.groqMode === 'limit') {
      return reply(429, { error: { message: 'Rate limit reached for model `openai/gpt-oss-20b` in organization `org_mock` on tokens per minute (TPM). Please try again in 0.05s.', type: 'tokens', code: 'rate_limit_exceeded' } }, { 'retry-after': '0.05' });
    }
    if (key === GROQ_KEYS.busy) {
      return reply(429, { error: { message: 'Rate limit reached for model `openai/gpt-oss-20b` in organization `org_mock` on tokens per minute (TPM). Please try again in 2m0s.', type: 'tokens', code: 'rate_limit_exceeded' } }, { 'retry-after': '120' });
    }
    const content = String(j.messages && j.messages[0] && j.messages[0].content);
    // The company pay lookup (browser_search): plain text with a JSON object in it.
    if (Array.isArray(j.tools) && j.tools.some((t) => t && t.type === 'browser_search')) {
      state.payLookups.push((content.match(/what "([^"]+)" pays/) || [])[1] || '');
      state.payLog.push({ op: 'web', company: state.payLookups[state.payLookups.length - 1] });
      return reply(200, {
        id: `chatcmpl-${state.groqCalls.length}`, object: 'chat.completion', model: j.model,
        choices: [{ index: 0, message: { role: 'assistant', content: 'From AmbitionBox and Glassdoor: {"low": 18, "high": 30, "sources": ["AmbitionBox", "Glassdoor"], "reports": 60, "same_company": true, "note": "SDE 1 to 2"}' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 120, completion_tokens: 40, total_tokens: 160 },
      }, { 'x-ratelimit-remaining-tokens': '7000', 'x-ratelimit-reset-tokens': '8.5s', 'x-ratelimit-remaining-requests': '990', 'x-ratelimit-reset-requests': '1m26s' });
    }
    return reply(200, {
      id: `chatcmpl-${state.groqCalls.length}`, object: 'chat.completion', model: j.model,
      choices: [{ index: 0, message: { role: 'assistant', content: JSON.stringify(groqAnswer(content)) }, finish_reason: 'stop' }],
      usage: { prompt_tokens: Math.round(content.length / 4), completion_tokens: 60, total_tokens: Math.round(content.length / 4) + 60, prompt_tokens_details: { cached_tokens: Math.max(0, Math.round(content.length / 4) - 100) } },
    }, { 'x-ratelimit-remaining-tokens': '7000', 'x-ratelimit-reset-tokens': '8.5s', 'x-ratelimit-remaining-requests': '990', 'x-ratelimit-reset-requests': '1m26s' });
  };

  const radarApi = (req, res, url, body) => {
    const reply = (code, payload, type = 'application/json') => {
      res.writeHead(code, { 'content-type': type });
      res.end(typeof payload === 'string' ? payload : JSON.stringify(payload));
    };
    if (req.method === 'GET' && url.pathname === '/job-tracker') return reply(200, SITE_PAGE, 'text/html; charset=utf-8');
    if (req.method === 'GET' && url.pathname === '/__bridge/finderBridge.js') return reply(200, readFileSync(BRIDGE_FILE, 'utf8'), 'text/javascript; charset=utf-8');
    if (req.method === 'POST' && url.pathname === '/__bridge/result') {
      try { state.bridgeResults.push(JSON.parse(body)); } catch { state.bridgeResults.push({ bad: body }); }
      return reply(200, { ok: true });
    }
    if (url.pathname !== '/api/radar' || req.method !== 'POST') return reply(404, { error: 'not-found' });
    let j;
    try { j = JSON.parse(body); } catch { return reply(400, { error: 'bad-json' }); }
    const auth = req.headers.authorization || '';
    const ingest = auth === `Bearer ${RADAR_TOKEN}`;
    const finderKey = auth === `Bearer ${FINDER_TOKEN}`;
    const finder = j.finder === 'naukri';
    // As api/radar.mjs: pairing needs the owner signed in; the finder token sends finder openings only.
    if (finder && j.pair === true && !ingest && !finderKey) {
      if (auth !== `Bearer ${OWNER_ID_TOKEN}`) return reply(401, { error: 'unauthorized' });
      state.radarPairs += 1;
      return reply(200, { ok: true, finder: true, token: FINDER_TOKEN });
    }
    if (!ingest && !(finder && finderKey)) return reply(401, { error: 'unauthorized' });
    // The company pay database (as api/radar.mjs payAction): get by key, put what has evidence.
    if (j.pay === 'get') {
      const found = {};
      for (const k of j.keys || []) {
        state.payLog.push({ op: 'get', key: k });
        if (state.payDb.has(k)) found[k] = state.payDb.get(k);
      }
      return reply(200, { found });
    }
    if (j.pay === 'put') {
      let saved = 0;
      for (const e of j.entries || []) {
        const key = String(e.company || '').toLowerCase().replace(/\b(?:private|pvt|limited|ltd|india|technologies|technology|tech|solutions|services|software|systems|labs)\b/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        if (!key || !(e.sources || []).length || e.same === false) continue;
        state.payLog.push({ op: 'put', key });
        state.payDb.set(key, { key, company: e.company, lo: e.lo, hi: e.hi, n: e.n, sources: e.sources, src: 'web', at: Date.now() });
        saved += 1;
      }
      return reply(200, { saved, kept: 0, rejected: [] });
    }
    if (j.check === true) {
      state.radarChecks += 1;
      return state.radarMode === 'old' ? reply(400, { error: 'no-openings' }) : reply(200, { ok: true, finder: true });
    }
    // Start over, and when it last happened (as api/radar.mjs).
    if (j.state === true) return state.radarMode === 'old' ? reply(400, { error: 'no-openings' }) : reply(200, { ok: true, finder: true, resetAt: state.finderResetAt });
    if (j.reset === true) {
      if (state.radarMode === 'old') return reply(400, { error: 'no-openings' });
      state.finderResetAt = Date.now();
      state.radarResets += 1;
      return reply(200, { ok: true, finder: true, deleted: 21, resetAt: state.finderResetAt });
    }
    if (!Array.isArray(j.openings)) return reply(400, { error: 'no-openings' });
    state.radarPosts.push(j);
    state.radarPostAuth.push(finderKey ? 'finder' : 'ingest');
    return reply(200, { created: j.openings.length, updated: 0, ...(state.radarMode === 'old' ? {} : { finder: true }) });
  };

  const handler = async (req, res) => {
    const url = new URL(req.url, 'https://www.naukri.com');
    let body = '';
    for await (const c of req) body += c;
    const host = String(req.headers.host || '').split(':')[0];
    if (host === 'interviewplanprep.vercel.app') return radarApi(req, res, url, body);
    if (host === 'api.groq.com') return groqApi(req, res, url, body);
    if (host === 'www.instahyre.com') return instahyreApi(req, res, url, body, insta);
    state.requests.push({ method: req.method, path: url.pathname, search: url.search, headers: req.headers, body, t: Date.now() });
    const send = (code, payload, headers = {}) => {
      const html = typeof payload === 'string';
      res.writeHead(code, { 'content-type': html ? 'text/html; charset=utf-8' : 'application/json', ...headers });
      res.end(html ? payload : JSON.stringify(payload));
    };
    const login = { 'set-cookie': `nauk_at=${TOKEN}; Path=/; Secure; SameSite=Lax` };

    if (url.pathname.startsWith('/recaptcha/')) return send(200, '<!doctype html><title>r</title>');
    if (/^\/[a-z0-9-]+-jobs(?:-\d+)?$/.test(url.pathname)) return send(200, SRP_PAGE, login);
    if (/^\/job-listings-.+-\d{9,}$/.test(url.pathname)) return send(200, JOB_PAGE, login);
    const jobApi = url.pathname.match(/^\/jobapi\/v\d+\/job\/(\d+)$/);
    if (jobApi) {
      if (state.jobMode === 'captcha') return send(406, { message: 'recaptcha required' });
      const all = [...Object.values(fixtures()).flat(2), ...state.srpExtra];
      const l = all.find((j) => j.jobId === jobApi[1]);
      if (!l || EXPECT.pageFails.includes(l.jobId)) return send(500, { message: 'server error' });
      return send(200, {
        jobDetails: {
          jobId: l.jobId, title: l.title, description: jdFor(l), keySkills: { other: [], preferred: [] }, applyCount: 140,
          ...(EXPECT.applied.data.includes(l.jobId) ? { applyStatus: 'APPLIED' } : {}),
          ...(EXPECT.applied.button.includes(l.jobId) ? { mockApplied: true } : {}), // only the page shows it
          // Every real job carries its company's homepage and career page: they say nothing about how you apply.
          companyDetail: { websiteUrl: 'https://www.example-corp.com', careerPageUrl: 'https://careers.example-corp.com' },
          ...(EXPECT.companySite.includes(l.jobId) ? { applyRedirectUrl: `https://careers.example.org/jobs/${l.jobId}?src=naukri` } : {}),
        },
      });
    }
    if (url.pathname === '/jobapi/v3/search') {
      if (state.srpMode === 'captcha') return send(406, { message: 'recaptcha required' });
      const k = url.searchParams.get('keyword') || '';
      const page = Number(url.searchParams.get('pageNo')) || 1;
      const pages = fixtures()[k] || [];
      let jobs = pages[page - 1] || [];
      if (k === 'java spring boot developer' && page === 1 && state.srpExtra.length) jobs = [...state.srpExtra, ...jobs].slice(0, 20);
      return send(200, { noOfJobs: pages.flat().length, jobDetails: jobs });
    }
    if (!url.pathname.startsWith(API)) {
      if (url.pathname === '/favicon.ico') return send(404, {});
      // Any page: log the browser in the way the real site does (a JS-readable token cookie).
      return send(200, '<!doctype html><title>Mock Naukri</title><p>mock</p>', login);
    }
    switch (state.mode) {
      case 'drop': return req.socket.destroy();
      case '500': return send(500, { message: 'server error' });
      case '429': return send(429, { message: 'too many requests' });
      case '401': return send(401, { message: 'unauthorized' });
      default: break;
    }
    if (req.headers.authorization !== `Bearer ${TOKEN}`) return send(401, { message: 'no token' });
    if (req.method === 'GET' && url.pathname === `${API}/v2/users/self`) {
      if (state.mode === 'shape') return send(200, { dashboard: { something: 'else' } });
      return send(200, {
        profile: [{ profileId: state.profileId, name: state.name, resumeHeadline: state.headline, keySkills: state.keySkills, modifiedOn: Date.now() }],
        employments: state.employments,
      });
    }
    if (req.method === 'POST' && url.pathname === `${API}/v1/users/self/fullprofiles`) {
      if (req.headers['x-http-method-override'] !== 'PUT') return send(405, { message: 'method' });
      let j;
      try { j = JSON.parse(body); } catch { return send(400, { message: 'bad json' }); }
      const h = j && j.profile && j.profile.resumeHeadline;
      if (j.profileId !== state.profileId || typeof h !== 'string' || !h.trim() || h.length > 250) return send(400, { message: 'bad payload' });
      if (state.mode !== 'ignore') state.headline = h;
      if (state.mode === 'wipe') { state.keySkills = ''; state.employments = []; } // a PUT that clobbers the rest
      state.saves += 1;
      return send(200, { status: 'success' });
    }
    return send(404, { message: 'not found' });
  };

  const servers = [];
  for (const host of ['127.0.0.1', '::1']) {
    const s = https.createServer({ key, cert }, handler);
    await new Promise((ok) => {
      s.once('error', () => ok()); // ::1 may be unavailable; 127.0.0.1 is enough
      s.listen(443, host, () => { servers.push(s); ok(); });
    });
  }
  if (!servers.length) throw new Error('mock Naukri could not listen on port 443');
  return {
    state,
    insta,
    instaReset,
    reset,
    apiCalls: (method) => state.requests.filter((r) => r.path.startsWith(API) && (!method || r.method === method)),
    searchPages: () => state.requests.filter((r) => /-jobs(?:-\d+)?$/.test(r.path)),
    jobPages: () => state.requests.filter((r) => /^\/job-listings-/.test(r.path)),
    close: () => Promise.all(servers.map((s) => new Promise((ok) => { s.closeAllConnections?.(); s.close(() => ok()); }))),
  };
}
