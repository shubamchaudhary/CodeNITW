// Naukri job finder: the pure rules (no browser APIs), shared by the background worker, the
// settings page and the Node tests.
//
// What it keeps — "best effort", not a blind filter: a detail the listing leaves out never
// drops a job; only a detail it states can.
//   posted today                 (the tracker's day: 4am to 4am IST)
//   title                        not a stack you don't do (Android, .NET, QA, frontend…), not lead+
//   experience                   asks for less than 2.5 years, and isn't a 0–1 fresher role
//   pay                          reaches 15 LPA (a salary the employer hid still counts if Naukri's
//                                data carries it); no salary at all → assumed in range
//   skills                       ≥ 85% of the tech the job asks for is yours (Naukri's own skill
//                                tags; soft skills and vague tags ignored, close substitutes 70%)
//
// Two filters, one per Naukri account: an AI-first role (an AI title, or mostly GenAI tech) is
// checked against your GenAI resume and goes on the AI list; any other role against your SDE
// resume, on the Backend list. A job is on one list only, so you never apply to it twice. Each
// list keeps its own top 50 a day, ranked 0–100.

import { SKILL_DEFS } from './score-opening.js';
import { JOB_PROFILE } from './job-profile.js';
import { NAUKRI_ORIGIN, MIN, HOUR, DAY } from './lib.js';

export const SITE_ORIGIN = 'https://interviewplanprep.vercel.app';
export const RADAR_API_URL = `${SITE_ORIGIN}/api/radar`;
export const RADAR_API_MATCH = `${SITE_ORIGIN}/*`;
// Opening this page in a browser, signed in to your site, connects that browser's job finder.
export const SITE_JOBS_URL = `${SITE_ORIGIN}/job-tracker?tab=openings`;

export const RULES = Object.freeze({
  minPayL: 15, // LPA the top of a known salary range must reach
  maxMinYears: 2.5, // the range must start below this ("less than 2.5 years")
  minMaxYears: 2, // ...and reach this, so "0–1 yrs" fresher roles are out
  minCoverage: 0.85, // share of the job's tech you have
  partial: 0.7, // a close substitute (Angular when you know React) or a "want" skill
  dailyTop: 50, // Naukri's apply cap per account per day: the site shows the top 50 per profile
});

export const FINDER_LIMITS = Object.freeze({
  pagesPerRun: 40,
  pagesPerDay: 220,
  runMinutes: 25,
  pauseMin: 4_000, // ms between page loads, picked at random in [min, max]
  pauseMax: 9_000,
  pageWaitMs: 15_000, // how long a page may take to show its results
  uploadMax: 150, // openings per upload
  perProfileDay: 150, // kept openings per profile per day
  lockTtlMin: 30,
});

// Your two Naukri accounts, one per resume. Each filter checks a job against its own resume's
// skills, plus radar/skills.json's extras and any typed in the finder's settings.
export const PROFILES = Object.freeze({
  backend: Object.freeze({ id: 'backend', label: 'Backend', resume: 'SDE resume', roles: 'backend-first roles' }),
  ai: Object.freeze({ id: 'ai', label: 'AI', resume: 'GenAI resume', roles: 'AI-first roles' }),
});
// What one browser searches for: both lists, or only the one its Naukri account applies to.
export const SCOPES = Object.freeze(['both', 'backend', 'ai']);

// The searches, Naukri's own filters on each: posted in the last day, 2 years of experience.
// `profile` is the list a search is for. What a job turns out to be decides its list: an AI-first
// role found by a backend search still goes on the AI list.
export const SEARCHES = Object.freeze([
  { k: 'java spring boot developer', profile: 'backend', pages: 3 },
  { k: 'java backend developer', profile: 'backend', pages: 2 },
  { k: 'java microservices', profile: 'backend', pages: 2 },
  { k: 'python fastapi developer', profile: 'backend', pages: 2 },
  { k: 'software engineer', profile: 'backend', pages: 3 },
  { k: 'software developer', profile: 'backend', pages: 3 },
  { k: 'generative ai engineer', profile: 'ai', pages: 3 },
  { k: 'genai developer', profile: 'ai', pages: 2 },
  { k: 'llm engineer', profile: 'ai', pages: 2 },
  { k: 'ai engineer', profile: 'ai', pages: 3 },
  { k: 'agentic ai', profile: 'ai', pages: 2 },
  { k: 'langchain', profile: 'ai', pages: 2 },
]);

/** The searches one browser runs: its own list's, or all of them. */
export function searchesFor(scope) {
  return scope === 'backend' || scope === 'ai' ? SEARCHES.filter((s) => s.profile === scope) : SEARCHES;
}

// Run times (IST hours); each lands at a random minute within ±7 of the hour.
export const RUN_HOURS = Object.freeze([9, 11, 13, 15, 17, 19]);
const RUN_JITTER = 7 * MIN;

/** Naukri's own search page for a keyword, with its filters in the URL. */
export function searchUrl(k, page = 1) {
  const slug = String(k).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `${NAUKRI_ORIGIN}/${slug}-jobs${page > 1 ? `-${page}` : ''}?k=${encodeURIComponent(k)}&experience=2&jobAge=1`;
}

// ---------------------------------------------------------------- days and run times

const IST = 330 * MIN;
const DAY_SHIFT = IST - 4 * HOUR; // the job tracker's day: 4am to 4am IST
export const trackerDay = (ms) => new Date(ms + DAY_SHIFT).toISOString().slice(0, 10);

/** The next run at or after `from`: a random minute around the next RUN_HOURS slot. */
export function nextFinderRun(from, lastSlot = null, rand = Math.random) {
  const dayStart = Math.floor((from + IST) / DAY) * DAY - IST; // IST midnight
  for (let d = 0; d < 3; d++) {
    for (const h of RUN_HOURS) {
      const slotAt = dayStart + d * DAY + h * HOUR;
      const slot = new Date(slotAt + IST).toISOString().slice(0, 13);
      if (lastSlot && slot <= lastSlot) continue;
      if (slotAt + RUN_JITTER < from) continue;
      const lo = Math.max(slotAt - RUN_JITTER, from);
      return { slot, at: Math.round(lo + rand() * (slotAt + RUN_JITTER - lo)) };
    }
  }
  return null;
}

// ---------------------------------------------------------------- a listing, normalized

const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const num = (v) => (v === null || v === undefined || v === '' || !isFinite(Number(v)) ? null : Number(v));
export const stripHtml = (s) => clean(String(s ?? '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))));

/** A job as Naukri's search API returns it (or as read off a result card) → one flat shape. */
export function normalizeJob(raw) {
  const labels = {};
  for (const p of Array.isArray(raw && raw.placeholders) ? raw.placeholders : []) {
    if (p && p.type && p.label) labels[String(p.type).toLowerCase()] = p.label;
  }
  const jd = clean(raw.jdURL || raw.url || '');
  const url = !jd ? null : /^https?:\/\//.test(jd) ? jd : `${NAUKRI_ORIGIN}${jd.startsWith('/') ? '' : '/'}${jd}`;
  const fromUrl = url && (url.match(/-(\d{9,})(?:[?#/]|$)/) || [])[1];
  const box = raw.ambitionBoxData || {};
  return {
    id: clean(raw.jobId) || fromUrl || '',
    url,
    title: clean(raw.title),
    company: clean(raw.companyName || raw.company),
    location: clean(labels.location || raw.location || ''),
    expText: clean(labels.experience || raw.experienceText || raw.experience || ''),
    salaryText: clean(labels.salary || raw.salaryText || ''),
    salary: raw.salaryDetail && typeof raw.salaryDetail === 'object' ? raw.salaryDetail : null,
    tags: splitTags(raw.tagsAndSkills),
    createdAt: num(raw.createdDate),
    footer: clean(raw.footerPlaceholderLabel || ''),
    rating: num(box.AggregateRating),
    reviews: num(box.ReviewsCount),
    snippet: stripHtml(raw.jobDescription || '').slice(0, 400),
  };
}

export function splitTags(s) {
  const seen = new Set();
  const out = [];
  for (const t of String(s ?? '').split(/,|\|/)) {
    const c = clean(t);
    if (c && c.length <= 60 && !seen.has(c.toLowerCase())) {
      seen.add(c.toLowerCase());
      out.push(c);
    }
  }
  return out;
}

// ---------------------------------------------------------------- posted when

/** The tracker day the listing was posted on; a listing that doesn't say counts as today. */
export function postedDay(job, now) {
  const f = job.footer.toLowerCase();
  if (/just now|few (?:hours|minutes|mins)|\d+\s*(?:hours?|hrs?|minutes?|mins?)\s*ago|\btoday\b/.test(f)) return trackerDay(now);
  const d = f.match(/(\d+)\+?\s*days?\s*ago/);
  if (d) return trackerDay(now - Number(d[1]) * DAY);
  if (/yesterday/.test(f)) return trackerDay(now - DAY);
  if (job.createdAt && job.createdAt <= now + HOUR) return trackerDay(job.createdAt);
  return trackerDay(now);
}

// ---------------------------------------------------------------- experience and pay

/** "2-5 Yrs" → {min:2,max:5}; "5+ years" → {min:5,max:null}; "Fresher" → 0–0; else null. */
export function parseYears(text) {
  const t = String(text ?? '').toLowerCase();
  let m = t.match(/(\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(\d+(?:\.\d+)?)\s*(?:\+\s*)?(?:yrs?|years?)/);
  if (m) return { min: Number(m[1]), max: Number(m[2]) };
  m = t.match(/(\d+(?:\.\d+)?)\s*(\+)?\s*(?:yrs?|years?)/);
  if (m) return { min: Number(m[1]), max: m[2] ? null : Number(m[1]) };
  if (/\bfreshers?\b/.test(t)) return { min: 0, max: 0 };
  return null;
}

/** A salary label in lakhs: "15-25 Lacs PA", "12 LPA", "₹ 6,00,000 - 12,00,000 P.A.", "1-1.5 Cr". */
export function parseLakhs(label) {
  const t = String(label ?? '').toLowerCase().replace(/,/g, '');
  if (!t || /not disclosed|undisclosed|confidential|best in|as per|negotiable|unpaid/.test(t)) return null;
  const nums = (t.match(/\d+(?:\.\d+)?/g) || []).map(Number).filter((n) => n > 0);
  if (!nums.length) return null;
  let toL;
  if (/\bcr(?:ore)?s?\b/.test(t)) toL = (n) => n * 100;
  else if (/lac|lakh|lpa|\bl\b/.test(t)) toL = (n) => n;
  else if (Math.max(...nums) >= 10_000) toL = (n) => n / 1e5; // plain rupees a year
  else return null;
  const vals = nums.slice(0, 2).map((n) => Math.round(toL(n) * 10) / 10);
  if (/month|\/m\b|per mon/.test(t)) return null; // a stipend or monthly figure: not a CTC
  return { minL: Math.min(...vals), maxL: Math.max(...vals) };
}

/** shown (the listing shows it) | hidden (employer hid it, Naukri's data still has it) | unknown. */
export function parsePay(job) {
  const sd = job.salary || {};
  const toL = (v) => {
    const n = Number(v);
    if (!(n > 0)) return null;
    return n < 1000 ? n : Math.round(n / 1e4) / 10; // already in lakhs, or rupees a year
  };
  const min = toL(sd.minimumSalary);
  const max = toL(sd.maximumSalary);
  if (!sd.hideSalary && (min || max)) return { kind: 'shown', minL: min || max, maxL: max || min };
  const label = parseLakhs(job.salaryText);
  if (label) return { kind: 'shown', ...label };
  if (sd.hideSalary && (min || max)) return { kind: 'hidden', minL: min || max, maxL: max || min };
  return { kind: 'unknown' };
}

// ---------------------------------------------------------------- titles

// A title naming one of these is a stack or a level you don't apply for.
const TITLE_OUT = [
  [/\bandroid\b/i, 'Android'],
  [/\bios\b|\bswift(?:ui)?\b|objective[- ]?c\b|\bxcode\b/i, 'iOS'],
  [/\bflutter\b|react[\s-]?native|\bmobile\b|\bxamarin\b|\bionic\b/i, 'mobile'],
  [/\.net\b|\bdot\s?net\b|\bc#|\basp\.?net\b|\bvb\.?net\b|\bwpf\b/i, '.NET'],
  [/\bphp\b|\blaravel\b|\bwordpress\b|\bdrupal\b|\bmagento\b|\bshopify\b|\bcodeigniter\b|\bjoomla\b/i, 'PHP/CMS'],
  [/\bruby\b|\brails\b/i, 'Ruby'],
  [/\bfront[\s-]?end\b|\bui\b|\bux\b|\bweb designer\b|\breact(?:\.?js)?\s+(?:developer|engineer)\b|\bangular\b|\bvue(?:\.?js)?\b/i, 'frontend'],
  [/\bqa\b|\bquality\b|\btest(?:ing|er|s)?\b|\bsdet\b|\bselenium\b|\b(?:test|qa) automation\b|\bautomation (?:test|qa)/i, 'QA/testing'],
  [/\bdev\s?ops\b|\bdevsecops\b|\bsre\b|site reliability|\bcloud (?:engineer|architect|admin|administrator|support)\b|\binfrastructure\b|\bsystems? admin|\bnetwork\b/i, 'DevOps/infra'],
  [/\bdata (?:analyst|scientist|science|engineer(?:ing)?|analytics|architect|modeler)\b|\bbig data\b|\bbusiness intelligence\b|\bbi (?:developer|engineer|analyst)\b|\bpower ?bi\b|\btableau\b|\betl\b|\binformatica\b|\bdatabricks\b|\bsnowflake developer\b/i, 'data'],
  [/\bsap\b|\bsalesforce\b|\bservicenow\b|\bmainframe\b|\bcobol\b|\bpega\b|\bappian\b|\bmulesoft\b|\bguidewire\b|\boracle (?:apps|ebs|fusion|hcm|erp|cloud)\b|\bpl\s?\/\s?sql\b|\bdynamics\b|\bsharepoint\b|\bpower (?:apps|platform|automate)\b|\buipath\b|\brpa\b|\bblue prism\b|\baem\b|\bsitecore\b|\bodoo\b|\bworkday\b|\bnetsuite\b|\bsiebel\b|\btibco\b|\bboomi\b/i, 'enterprise platform'],
  [/\bembedded\b|\bfirmware\b|\bvlsi\b|\bhardware\b|\bfpga\b|\basic\b|\bautosar\b|\bplc\b|\bscada\b|\bdevice driver|\bbsp\b|\bkernel\b|\brtos\b/i, 'embedded/hardware'],
  [/\bgame\b|\bgaming engine\b|\bunity\b|\bunreal\b|\bblockchain\b|\bweb3\b|\bsolidity\b|\bsmart contract/i, 'games/web3'],
  [/\bsupport\b|\bhelp ?desk\b|\bdesktop support\b|\b(?:l1|l2|l3)\b|\bdba\b|\bdatabase admin|\boperations\b|\bnoc\b/i, 'support/ops'],
  [/\bcomputer vision\b|\bimage processing\b|\bspeech\b|\bscientist\b/i, 'research/vision'],
  [/\bsecurity\b|\bsoc\b|\bcyber\b|\bpenetration\b|\bpentest|\bethical hack|\bvapt\b|\biam\b/i, 'security'],
  [/\b(?:manager|lead|architect|principal|head|director|vp|vice president|chief|cto|president)\b|(?<!technical\s)\bstaff\b/i, 'lead or above'],
  [/\bintern(?:ship)?\b|\btrainee\b|\bfreshers?\b|\bapprentice\b|\bgraduate engineer\b|\bget\b/i, 'intern/fresher'],
  [/\bsales\b|\bmarketing\b|\brecruit|\bhr\b|\btalent acquisition\b|\bbusiness (?:development|analyst)\b|\baccount (?:manager|executive)\b|\bcustomer success\b|\bproduct (?:manager|owner)\b|\bproject (?:manager|coordinator)\b|\bscrum master\b|\bpre[- ]?sales\b|\btechnical writer\b|\bcontent\b|\bseo\b/i, 'non-engineering'],
];
// "Consultant" alone is a consulting role; "Java Consultant" / "Consultant - Software Engineer" is a dev job.
const CONSULTANT = /\bconsultant\b/i;
const DEV_WORD = /\b(?:developer|engineer|programmer|java|python|backend|back end|software|full[\s-]?stack|sde|ai|genai|llm)\b/i;

// The title's own language or framework: if it names only stacks you don't have, it's not yours.
const TITLE_STACKS = new Set(['Java', 'Kotlin', 'Python', 'Go', 'C++', 'C', 'C#', 'JavaScript', 'TypeScript', 'Scala', 'Rust', 'Ruby',
  'PHP', 'Perl', 'Spring', 'Node.js', 'Django', 'Flask', 'FastAPI', 'Rails', 'React', 'Angular', 'Vue', 'Next.js', 'Svelte',
  'Micronaut', 'Quarkus', 'Ktor', 'NestJS', 'Express', 'Salesforce', 'SAP ABAP', 'Mainframe']);
// Close enough that a title naming them is still yours.
const CLOSE = { typescript: 'JavaScript', flask: 'Python', django: 'Python', nestjs: 'Node.js', express: 'Node.js', 'next.js': 'React' };

const CORE_TITLE = /\b(?:java|spring|back[\s-]?end|sde|swe|software (?:development )?engineer|software developer|platform engineer|microservices?|full[\s-]?stack|python (?:developer|engineer)|fast\s?api|node(?:\.?js)? (?:developer|engineer)|api developer|application (?:developer|engineer)|member of technical staff|mts)\b/i;
const AI_TITLE = /\b(?:gen\s?ai|generative ai|llms?|ai (?:engineer|developer|application|solutions? engineer|agents?)|applied ai|agentic|ai\s?\/\s?ml|ai[\s-]ml|ml engineer|machine learning engineer|prompt engineer|conversational ai|nlp engineer|rag)\b/i;
const ANY_ENG_TITLE = /\b(?:developer|engineer|programmer|sde|swe|coder)\b/i;
const SENIOR = /\b(?:senior|sr\.?|iii|iv)\b/i;

/** → { ok:false, why } or { ok:true, fit 0–1, ai } */
export function titleCheck(title, prof) {
  const t = ` ${title} `;
  for (const [rx, why] of TITLE_OUT) {
    if (!rx.test(t)) continue;
    if (why === 'frontend' && /full[\s-]?stack/i.test(t)) continue; // full stack is fine
    return { ok: false, why: `${why} role` };
  }
  if (CONSULTANT.test(t) && !DEV_WORD.test(t)) return { ok: false, why: 'consulting role' };
  const stacks = SKILL_DEFS.filter(([label, rx]) => TITLE_STACKS.has(label) && rx.test(t)).map(([label]) => label);
  if (stacks.length && !stacks.some((l) => prof.hasLabel(l) || prof.hasLabel(CLOSE[l.toLowerCase()] || ''))) {
    return { ok: false, why: `${stacks[0]} role` };
  }
  const ai = AI_TITLE.test(t);
  let fit = ai || CORE_TITLE.test(t) ? 1 : ANY_ENG_TITLE.test(t) ? 0.8 : 0.6;
  if (SENIOR.test(t)) fit *= 0.8;
  return { ok: true, fit, ai };
}

// ---------------------------------------------------------------- skills

// Tags that say nothing about the stack: soft skills, degrees, domains, filler.
const IGNORE_TAG = /^(?:(?:good |strong |excellent )?(?:communication|verbal|written|english|interpersonal)(?: skills?)?|team ?work|team player|leadership|ownership|problem[- ]solving(?: skills?)?|analytical(?: skills?| thinking)?|critical thinking|attention to detail|time management|stakeholder(?: management)?|client (?:handling|facing|interaction|management)|customer (?:focus|service|handling)|presentation(?: skills)?|negotiation|collaboration|mentoring|self[- ]motivated|quick learner|adaptability|multitasking|b\.?\s?tech|b\.?\s?e\.?|m\.?\s?tech|bachelor'?s?(?: degree)?|master'?s?(?: degree)?|mca|bca|b\.?sc|degree|graduate|post graduate|computer science|computer engineering|cse|it|ites|information technology|engineering|technology|technical|software|it skills|tech|immediate joiner|work from (?:home|office)|wfh|hybrid|remote|night shift|fintech|banking|bfsi|payments?|e-?commerce|retail|healthcare|insurance|telecom|logistics|supply chain|saas|b2b|b2c|startup|product|product based|crm|erp|edtech|media|travel|hospitality|real estate|manufacturing|it services|consulting)$/i;

// Generic engineering words: count when they're on your resume, ignored when not.
const GENERIC_TAG = /^(?:software development|software engineering|software developer|software engineer|development|programming|coding|application development|web development|product development|backend development|back[- ]?end|full[- ]?stack(?: development)?|end to end|coding standards|code review|debugging|troubleshooting|documentation|sdlc|agile(?: methodology)?|scrum|kanban|jira|confluence|version control|design|architecture|software architecture|low level design|high level design|lld|hld|scalability|performance(?: tuning)?|optimization|high availability|data structures?(?: and algorithms)?|algorithms?|dsa|problem solving|oops?|object oriented(?: programming| design)?|design principles|solid principles|clean code|integration|api|apis|api development|api integration|web services|cloud|cloud computing|cloud services|cloud platforms?|cloud native|devops|linux|unix|windows|scripting|shell(?: scripting)?|bash|databases?|database design|database management|rdbms|dbms)$/i;

// [tag, the resume skill it hangs off, have | part]: a tag that counts when you have that skill.
const NEAR = [
  [/^(?:j2ee|jee|java ?ee|jakarta ee|jsp|servlets?|jdbc|jvm|java collections|collections|lombok|maven|gradle|ant|tomcat|apache tomcat|log4j|slf4j|swagger|open ?api|postman|jms|java 8|java 11|java 17|java 21|core java|advanced java|java programming|java developer|java development)$/i, 'Java', 'have'],
  [/^(?:spring (?:mvc|security|cloud|batch|data|integration|core|framework)|spring data jpa|jpa|spring ?boot|springboot)$/i, 'Spring', 'have'],
  [/^(?:webflux|spring webflux|reactive programming|project reactor|vert\.?x)$/i, 'Spring', 'part'],
  [/^(?:multi-?threading|threads?|concurrency|executor service)$/i, 'Java', 'have'],
  [/^(?:pydantic|asyncio|async ?io|sqlalchemy|alembic|uvicorn|gunicorn|pip|poetry|pytest|virtualenv|python ?3|python programming|python developer|python development)$/i, 'Python', 'have'],
  [/^(?:pandas|numpy|jupyter|matplotlib|streamlit|gradio|celery)$/i, 'Python', 'part'],
  [/^(?:flask|django|django rest framework|drf)$/i, 'Python', 'part'],
  [/^(?:express|express\.?js|npm|node|nodejs)$/i, 'Node.js', 'have'],
  [/^(?:nest\.?js|nestjs|koa)$/i, 'Node.js', 'part'],
  [/^(?:typescript|ts)$/i, 'JavaScript', 'part'],
  [/^(?:jquery|ajax|json|xml|yaml|es6|ecmascript)$/i, 'JavaScript', 'have'],
  [/^(?:redux|react hooks|react\.?js|reactjs|jsx|material ui|mui)$/i, 'React', 'have'],
  [/^(?:angular(?:js| ?\d+)?|vue(?:\.?js)?|next\.?js|nextjs|svelte)$/i, 'React', 'part'],
  [/^(?:html5?|css3?|bootstrap|sass|scss|tailwind(?: css)?)$/i, 'HTML/CSS', 'have'],
  [/^(?:mysql|mariadb|sql server|ms ?sql|mssql|t-?sql|oracle(?: db| database| sql)?|sqlite|postgres|postgre ?sql|sql|nosql databases?|relational databases?)$/i, 'SQL', 'have'],
  [/^(?:pl ?\/ ?sql|plsql|stored procedures)$/i, 'SQL', 'part'],
  [/^(?:nosql|no-?sql|document db|document databases?)$/i, 'MongoDB', 'have'],
  [/^(?:dynamo ?db|cassandra|couchbase|couchdb|hbase|cosmos ?db|firestore)$/i, 'MongoDB', 'part'],
  [/^(?:kafka streams|confluent|event streaming|message queues?|messaging|message brokers?|pub ?\/ ?sub|event[- ]driven(?: architecture)?)$/i, 'Kafka', 'have'],
  [/^(?:rabbit ?mq|active ?mq|ibm mq|sqs|sns|kinesis|event hubs?|pulsar|nats|service bus)$/i, 'Kafka', 'part'],
  [/^(?:azure (?:functions|devops|apim|key vault|service bus|cosmos db|app service|blob storage|aks|openai)|aks|apim|key vault|microsoft azure)$/i, 'Azure', 'have'],
  [/^(?:s3|amazon s3|aws s3)$/i, 'AWS', 'have'],
  [/^(?:ec2|lambda|aws lambda|ecs|eks|cloudwatch|rds|api gateway|cloudformation|aws services|amazon web services)$/i, 'AWS', 'part'],
  [/^(?:jenkins|github actions|gitlab ci|azure devops|argo ?cd|circle ?ci|teamcity|bamboo|ci|cd|ci\s?\/\s?cd(?: pipelines?)?)$/i, 'CI/CD', 'have'],
  [/^(?:k8s|kubernetes)$/i, 'Kubernetes', 'have'],
  [/^(?:helm|openshift|rancher|gke)$/i, 'Kubernetes', 'part'],
  [/^(?:containers?|containeri[sz]ation|docker compose|podman)$/i, 'Docker', 'have'],
  [/^(?:elk|kibana|logstash|opensearch|solr|lucene)$/i, 'Elasticsearch', 'part'],
  [/^(?:memcached|caching|hazelcast|ehcache|distributed caching)$/i, 'Redis', 'part'],
  [/^(?:oauth ?2(?:\.0)?|openid(?: connect)?|oidc|jwt|sso|keycloak|okta|authentication|authorization)$/i, 'OAuth', 'have'],
  [/^(?:distributed computing|scalable systems|high-?scale systems|large scale systems)$/i, 'Distributed Systems', 'have'],
  // GenAI
  [/^(?:prompt engineering|prompt design|prompting|prompts?|llm apis?|chat ?gpt|gpt(?:-?4o?)?|claude|gemini|anthropic|llama ?\d*|mistral|open ?source llms?|foundation models?|large language models?|llms?)$/i, 'LLM', 'have'],
  [/^(?:artificial intelligence|ai|generative ai|gen ?ai|genai|ai applications?|ai development|chatbots?|conversational ai|ai solutions?)$/i, 'GenAI', 'have'],
  [/^(?:ai agents?|agents?|multi-?agent(?: systems)?|agentic(?: ai| workflows?| systems| frameworks?)?|autonomous agents?)$/i, 'Agentic AI', 'have'],
  [/^(?:tool use|tool calling|function calling)$/i, 'Function Calling', 'have'],
  [/^(?:mcp|model context protocol)$/i, 'Function Calling', 'part'],
  [/^(?:crew ?ai|autogen|semantic kernel|haystack|dspy|llama ?index|langsmith|langfuse|lang ?flow)$/i, 'LangChain', 'part'],
  [/^(?:hugging ?face|transformers|nlp|natural language processing|text classification|ner|sentiment analysis|machine learning|ml|ai\s?\/\s?ml|ai ?& ?ml|aiml)$/i, 'LLM', 'part'],
  [/^(?:semantic search|similarity search|embeddings?|vector search|vector (?:db|database|store)s?|pinecone|faiss|chroma ?db|chroma|weaviate|milvus|qdrant|pgvector)$/i, 'Vector DB', 'have'],
  [/^(?:rag|retrieval augmented generation|retrieval-augmented generation|rag pipelines?|advanced rag)$/i, 'RAG', 'have'],
  [/^(?:graph ?rag|knowledge graphs?)$/i, 'RAG', 'part'],
  [/^(?:llm ?ops|evals?|evaluation|guardrails|llm evaluation)$/i, 'LLM Evals', 'part'],
  [/^(?:openai|azure openai|openai api)$/i, 'OpenAI API', 'have'],
];

/**
 * Skills you have, as a matcher: by default both resumes and radar/skills.json's extras together.
 * `extra` are skills typed in the finder's settings.
 */
export function makeProfile(extra = [], skills = [...JOB_PROFILE.backend, ...JOB_PROFILE.ai, ...JOB_PROFILE.extra], wantList = JOB_PROFILE.want) {
  const have = [...new Set([...skills, ...extra.map(clean).filter(Boolean)])];
  const haveLow = new Set(have.map((s) => s.toLowerCase()));
  const want = wantList.filter((s) => !haveLow.has(s.toLowerCase()));
  const wantLow = new Set(want.map((s) => s.toLowerCase()));
  // Your own skills that aren't in the dictionary still match a tag that names them.
  const known = new Set(SKILL_DEFS.map(([l]) => l.toLowerCase()));
  const own = have.filter((s) => !known.has(s.toLowerCase()) && s.length >= 2)
    .map((s) => ({ label: s, rx: new RegExp(`(?:^|[^a-z0-9+#.])${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|[^a-z0-9+#])`, 'i') }));
  return {
    have, want,
    hasLabel: (l) => !!l && haveLow.has(String(l).toLowerCase()),
    wantsLabel: (l) => !!l && wantLow.has(String(l).toLowerCase()),
    own,
  };
}

/** The two filters' matchers: Backend from your SDE resume, AI from your GenAI resume. */
export function makeProfiles(extra = [], base = JOB_PROFILE) {
  return {
    backend: makeProfile(extra, [...base.backend, ...base.extra], base.want),
    ai: makeProfile(extra, [...base.ai, ...base.extra], base.want),
  };
}

// The radar's generic skills (scripts/scoreOpening.mjs): mentioned by nearly every job.
const GENERIC_LABELS = new Set(['agile', 'testing', 'git', 'github actions', 'ci/cd', 'data structures', 'design patterns', 'rest',
  'rest apis', 'backend', 'full stack', 'system design', 'caching', 'concurrency', 'multithreading and concurrency', 'security',
  'observability', 'linux', 'sql', 'junit', 'mockito', 'gradle', 'shell']);
export const AI_LABELS = new Set(['genai', 'llm', 'langchain', 'langgraph', 'llamaindex', 'agentic ai', 'rag', 'vector db', 'embeddings',
  'prompt engineering', 'fine-tuning', 'openai api', 'function calling', 'llm evals', 'hybrid search', 'nlp', 'machine learning',
  'deep learning', 'mlops', 'pytorch', 'tensorflow', 'corrective rag', 'llm-as-judge', 'human-in-the-loop', 'azure openai']);

/** One tag → { cls: have | part | missing | ignore, key, label }. */
export function classifyTag(tag, prof) {
  const t = clean(tag).replace(/\s*\((?:[^)]*)\)\s*$/, '').toLowerCase(); // "Azure (APIM)" → "azure"
  if (!t) return { cls: 'ignore', key: '', label: tag };
  if (IGNORE_TAG.test(t)) return { cls: 'ignore', key: t, label: tag };
  for (const [rx, need, cls] of NEAR) {
    if (!rx.test(t)) continue;
    // A variant of the skill itself ("Core Java", "Spring Boot") is that skill: one entry however
    // many tags name it. A substitute ("Angular" for React) is its own requirement.
    const key = cls === 'have' ? need.toLowerCase() : `${need.toLowerCase()}~${t}`;
    if (prof.hasLabel(need)) return { cls, key, label: tag, of: need };
    if (prof.wantsLabel(need)) return { cls: 'part', key: `${need.toLowerCase()}~${t}`, label: tag, of: need };
    break; // a known near-tag of a skill you don't have: decide by the dictionary below
  }
  const padded = ` ${t} `;
  const labels = SKILL_DEFS.filter(([, rx]) => rx.test(padded)).map(([l]) => l);
  if (labels.length) {
    // A tag naming several skills ("Java Spring Boot") counts by its weakest one.
    const rank = { have: 3, ignore: 2, part: 1, missing: 0 };
    let worst = null;
    for (const l of labels) {
      const low = l.toLowerCase();
      const cls = prof.hasLabel(l) ? 'have' : GENERIC_LABELS.has(low) ? 'ignore' : prof.wantsLabel(l) ? 'part' : 'missing';
      if (!worst || rank[cls] < rank[worst.cls]) worst = { cls, key: low, label: tag, of: l };
    }
    return worst;
  }
  if (GENERIC_TAG.test(t)) return { cls: 'ignore', key: t, label: tag };
  const mine = prof.own.find((o) => o.rx.test(padded));
  if (mine) return { cls: 'have', key: mine.label.toLowerCase(), label: tag, of: mine.label };
  return { cls: 'missing', key: t, label: tag, unknown: true };
}

/** The job's tags against your skills → coverage (null when nothing counted). */
export function skillCheck(tags, prof) {
  const by = new Map(); // one entry per skill, however many tags name it
  const ignored = [];
  const unknown = [];
  for (const tag of tags) {
    const c = classifyTag(tag, prof);
    if (c.cls === 'ignore') { ignored.push(tag); continue; }
    if (c.unknown) unknown.push(c.key);
    const prev = by.get(c.key);
    const order = { have: 2, part: 1, missing: 0 };
    if (!prev || order[c.cls] > order[prev.cls]) by.set(c.key, c);
  }
  const list = [...by.values()];
  const pick = (cls) => list.filter((c) => c.cls === cls).map((c) => c.label);
  const have = pick('have');
  const part = pick('part');
  const missing = pick('missing');
  const counted = list.length;
  const ratio = counted ? (have.length + RULES.partial * part.length) / counted : null;
  const ai = list.filter((c) => AI_LABELS.has(String(c.of || c.key).toLowerCase())).length;
  return { have, part, missing, ignored, unknown, counted, ratio, ai };
}

/** Tags for a listing that shows none: the skills its title and description name. */
function tagsFromText(job) {
  const t = ` ${job.title} ${job.snippet} `;
  return SKILL_DEFS.filter(([, rx]) => rx.test(t)).map(([l]) => l);
}

// ---------------------------------------------------------------- profile and rank

/**
 * AI-first or backend-first, from the listing alone (never from which search found it, so two
 * browsers always agree): an AI title, or mostly GenAI tech, is AI-first.
 */
export function roleKind(title, titleAi, skills) {
  if (titleAi) return 'ai';
  const ai = skills.ai;
  if (ai >= 3) return 'ai';
  // Two AI skills make it AI-first unless the title is a Java one (Java + a little LLM stays backend).
  if (ai >= 2 && (ai * 2 >= skills.counted || !/\bjava\b/i.test(title))) return 'ai';
  return 'backend';
}

const clamp01 = (x) => Math.max(0, Math.min(1, x));

/** 0–100: skills (35), title (15), experience (15), pay (15), company rating (10), freshness (10). */
export function rankOf({ fit, skills, years, pay, rating, reviews, createdAt }, now) {
  let skill = 0.55;
  if (skills.ratio != null) {
    const cov = 0.7 + 0.3 * clamp01((skills.ratio - RULES.minCoverage) / (1 - RULES.minCoverage));
    const depth = Math.min(skills.have.length, 6) / 6;
    skill = 0.65 * cov + 0.35 * depth;
  }
  const exp = !years ? 0.7 : years.min >= 1 && years.min <= 2 ? 1 : 0.85;
  const payS = pay.kind === 'unknown' ? 0.6 : pay.maxL >= 25 ? 1 : pay.maxL >= 20 ? 0.85 : 0.7;
  let co = 0.55;
  if (rating != null) {
    co = rating >= 4 ? 1 : rating >= 3.7 ? 0.8 : rating >= 3.3 ? 0.6 : 0.4;
    if (!(reviews >= 20)) co = (co + 0.55) / 2; // a handful of reviews says little
  }
  const ageH = createdAt && createdAt <= now ? (now - createdAt) / HOUR : null;
  const fresh = ageH == null ? 0.6 : ageH <= 3 ? 1 : ageH <= 8 ? 0.8 : 0.6;
  return Math.round(100 * (0.35 * skill + 0.15 * fit + 0.15 * exp + 0.15 * payS + 0.1 * co + 0.1 * fresh));
}

// ---------------------------------------------------------------- the verdict on one listing

/**
 * → { keep:false, why, job, profile? } or { keep:true, job, years, pay, skills, profile, rank, fit }
 * `profile` is the list it belongs on (backend | ai); `why` a short reason for the run stats.
 * `profs` are the two filters' matchers (makeProfiles); a single `prof` serves both.
 */
export function evaluate(raw, { now, profs, prof }) {
  const P = profs || { backend: prof, ai: prof };
  const job = normalizeJob(raw || {});
  if (!job.id || !job.title || !job.url || !job.company) return { keep: false, why: 'incomplete listing', job };
  const day = postedDay(job, now);
  if (day !== trackerDay(now)) return { keep: false, why: 'not posted today', job, day };
  const fromTags = job.tags.length > 0;
  const tags = fromTags ? job.tags : tagsFromText(job);
  // Which filter: how much of it is GenAI work doesn't depend on whose skills are asked.
  const asAi = skillCheck(tags, P.ai);
  const profile = roleKind(job.title, AI_TITLE.test(` ${job.title} `), asAi);
  const t = titleCheck(job.title, P[profile]);
  if (!t.ok) return { keep: false, why: t.why, job, profile };
  const years = parseYears(job.expText);
  if (years && years.min >= RULES.maxMinYears) return { keep: false, why: `asks ${years.min}+ years`, job, profile };
  if (years && years.max != null && years.max < RULES.minMaxYears) return { keep: false, why: 'fresher role', job, profile };
  const pay = parsePay(job);
  if (pay.kind !== 'unknown' && pay.maxL < RULES.minPayL) return { keep: false, why: 'pays under 15L', job, profile };
  // An AI-first role against your GenAI resume, any other against your SDE resume.
  const skills = profile === 'ai' || P.ai === P.backend ? asAi : skillCheck(tags, P.backend);
  if (skills.ratio != null && skills.ratio < RULES.minCoverage) return { keep: false, why: 'skills under 85%', job, skills, profile };
  const rank = rankOf({ fit: t.fit, skills, years, pay, rating: job.rating, reviews: job.reviews, createdAt: job.createdAt }, now);
  return { keep: true, job, day, years, pay, skills, fromTags, profile, rank, fit: t.fit };
}

/** The pay label for the site (verdict names the Openings tab knows). */
export function payLabel(pay) {
  const range = (p) => `₹${p.minL}${p.maxL !== p.minL ? `–${p.maxL}` : ''}L`;
  if (pay.kind === 'shown') {
    return { verdict: pay.maxL >= 25 ? 'meets' : pay.maxL >= 22 ? 'close' : 'fifteen', text: `${range(pay)} posted` };
  }
  if (pay.kind === 'hidden') return { verdict: 'hidden', text: `${range(pay)}, hidden on the listing` };
  return { verdict: 'unknown', text: 'Not disclosed on the listing' };
}

/** A kept listing → the opening /api/radar stores (the radar's fields, plus the finder's own). */
export function toOpening(e, now, fallbackScore = null) {
  const { job, years, pay, skills, profile, rank } = e;
  const matchScore = skills.ratio != null ? Math.round(skills.ratio * 100) : Math.max(1, Number(fallbackScore) || 50);
  return {
    company: job.company,
    openingId: job.id,
    title: job.title,
    location: job.location || 'India',
    url: job.url,
    source: 'naukri',
    sources: ['naukri'],
    ats: 'naukri',
    finder: 'naukri',
    postedAt: e.day,
    seenSince: now,
    ...(job.createdAt ? { postedTime: job.createdAt } : {}),
    ...(years ? { minYoe: years.min, ...(years.max != null ? { maxYoe: years.max } : {}) } : {}),
    exp: years ? 'fits' : 'unknown',
    pay: payLabel(pay),
    matchScore,
    ...(skills.ratio != null ? { coverage: Math.round(skills.ratio * 100) } : {}),
    skillsHave: skills.have.length,
    skillsTotal: skills.counted,
    matched: [...skills.have.map((s) => ({ skill: s, type: 'have' })), ...skills.part.map((s) => ({ skill: s, type: 'want' }))].slice(0, 10),
    missing: skills.missing.slice(0, 6),
    rank,
    profile,
    ...(job.rating != null ? { rating: job.rating } : {}),
    ...(job.reviews != null ? { reviews: job.reviews } : {}),
    snippet: job.snippet.slice(0, 250),
  };
}
