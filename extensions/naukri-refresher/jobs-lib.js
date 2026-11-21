// Naukri job finder: the pure rules (no browser APIs), shared by the background worker, the
// settings page and the Node tests.
//
// The finder reads every page of every search (see SEARCHES), and two steps decide each listing:
//   1. The card (what Naukri's search results show). Posted in the last 48 hours ("Just now",
//      "Few hours ago", "1 day ago"; "2 days ago" is out); not one you've applied to on Naukri; not
//      from a company on the low-pay list (IT services and consulting firms, editable in the
//      settings); a title that isn't a stack or level you don't do; asks for under 2.5 years and
//      pays 15 LPA+ when it says; and its skill chips don't clearly belong to another stack. A
//      detail the card leaves out never drops a job, and chips that aren't technologies are ignored.
//   2. The JD (the job's own page, opened for every card that passes). Every technology it asks for
//      is found with the skills dictionary (skills-dict.js) and compared with your skills (both
//      resumes, job-profile.js). It's kept when the share you have reaches the bar (60% by
//      default; "nice to have" lines and company blurbs don't count). How much of it is GenAI work
//      decides its list: AI-first or backend-first. A job is on one list only.
// The parser's top 400 per list (last 48 hours, by JD match) go to your site, and each one is then
// rated by Grok against your resume (rate-lib.js). Your site shows the top 100 per list that you
// haven't taken yet, highest rating first.

import { findSkills, skillOf, withParents } from './skills-dict.js';
import { JOB_PROFILE } from './job-profile.js';
import { NAUKRI_ORIGIN, MIN, HOUR, DAY } from './lib.js';

export const SITE_ORIGIN = 'https://interviewplanprep.vercel.app';
export const RADAR_API_URL = `${SITE_ORIGIN}/api/radar`;
export const RADAR_API_MATCH = `${SITE_ORIGIN}/*`;
// Opening this page in a browser, signed in to your site, connects that browser's job finder.
export const SITE_JOBS_URL = `${SITE_ORIGIN}/job-tracker?tab=openings`;

// Bump when the rules change: the finder then forgets today's verdicts and reads everything again.
export const RULES_VERSION = 4;

export const RULES = Object.freeze({
  maxAgeH: 48, // the last 48 hours (Just now, Few hours ago, 1 day ago); "2 days ago" is out
  poolTop: 400, // the parser's best this many per list (last 48 hours, by JD match) go to your site and are rated
  showHours: 48, // your site lists the top `showTop` per list posted in the last 48 hours, not yet taken,
  showTop: 100, // highest AI rating first (jobs not rated yet after, by JD match)
  minPayL: 15, // LPA the top of a salary the job shows must reach
  maxMinYears: 2.5, // the years it asks for must start below this ("less than 2.5 years")
  minMaxYears: 2, // ...and reach this, so "0–1 yrs" fresher roles are out
  minScore: 0.6, // the bar: share of the JD's technologies that are yours (the settings can change it)
  minScoreRange: Object.freeze([0.4, 0.95]),
  cardFloor: 0.4, // a card whose chips name 3+ known skills and match under this isn't opened
  minJdSkills: 4, // a JD naming fewer technologies says little: same bar, ranked a little lower
  aiShare: 0.4, // AI-first when GenAI/ML work is at least this share of the JD's technology
});

// Every page of every search, so a run can be long: it works up to an hour, and the next run picks
// up where it stopped. The caps are a safety net, not a target.
export const FINDER_LIMITS = Object.freeze({
  runMinutes: 60,
  pagesPerRun: 500, // search pages and job pages together
  pagesPerDay: 2000,
  jdPerDay: 1000, // job pages opened per day
  pagesPerSearch: 100, // 2,000 results: past that a search is too broad to be about you
  pauseMin: 4_000, // ms between page loads, picked at random in [min, max]
  pauseMax: 9_000,
  pageWaitMs: 15_000, // how long a page may take to show its results
  uploadMax: 150, // openings per upload
  perListDay: 1000, // kept per list per day, at most
  lockTtlMin: 90,
  jdFailStop: 3, // job pages in a row it can't read before it stops opening them this run
});

// Two lists, one per Naukri account. Your skills are the same on both resumes; what the job is
// about decides the list.
export const PROFILES = Object.freeze({
  backend: Object.freeze({ id: 'backend', label: 'Backend', roles: 'backend-first roles' }),
  ai: Object.freeze({ id: 'ai', label: 'AI', roles: 'AI-first roles' }),
});
// What one browser searches for: both lists, or only the one its Naukri account applies to.
export const SCOPES = Object.freeze(['both', 'backend', 'ai']);

// The searches, with Naukri's own filters on each: 2 years of experience, posted in the last 3 days
// (Naukri has no 48-hour filter; the card check drops "2 days ago"). Every page of each is read.
// `profile` is the list a search is for; what a job turns out to be decides its list, and a job
// several searches find is read once.
export const SEARCHES = Object.freeze([
  { k: 'java spring boot developer', profile: 'backend' },
  { k: 'java backend developer', profile: 'backend' },
  { k: 'java developer', profile: 'backend' },
  { k: 'java microservices', profile: 'backend' },
  { k: 'spring boot', profile: 'backend' },
  { k: 'backend developer', profile: 'backend' },
  { k: 'backend engineer', profile: 'backend' },
  { k: 'python developer', profile: 'backend' },
  { k: 'python backend developer', profile: 'backend' },
  { k: 'python fastapi developer', profile: 'backend' },
  { k: 'node js developer', profile: 'backend' },
  { k: 'full stack developer', profile: 'backend' },
  { k: 'software engineer', profile: 'backend' },
  { k: 'software developer', profile: 'backend' },
  { k: 'sde', profile: 'backend' },
  { k: 'api developer', profile: 'backend' },
  { k: 'generative ai engineer', profile: 'ai' },
  { k: 'genai developer', profile: 'ai' },
  { k: 'llm engineer', profile: 'ai' },
  { k: 'ai engineer', profile: 'ai' },
  { k: 'ai developer', profile: 'ai' },
  { k: 'ai ml engineer', profile: 'ai' },
  { k: 'agentic ai', profile: 'ai' },
  { k: 'langchain', profile: 'ai' },
  { k: 'rag developer', profile: 'ai' },
  { k: 'machine learning engineer', profile: 'ai' },
  { k: 'nlp engineer', profile: 'ai' },
  { k: 'prompt engineer', profile: 'ai' },
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
  return `${NAUKRI_ORIGIN}/${slug}-jobs${page > 1 ? `-${page}` : ''}?k=${encodeURIComponent(k)}&experience=2&jobAge=3`;
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

/** A JD's HTML → text that keeps its lines (headings, bullets), so its sections can be told apart. */
export function htmlToText(html) {
  return String(html ?? '')
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '\n• ')
    .replace(/<\/\s*(?:p|div|li|ul|ol|h[1-6]|tr|section|strong|b)\s*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .split('\n')
    .map((l) => l.replace(/[ \t ]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

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
    applied: appliedOnNaukri(raw),
  };
}

/**
 * Whether Naukri's own data says this account already applied: a true "applied"/"isApplied" flag,
 * or an apply status of "applied". Counts of other applicants ("applyCount") don't count.
 */
function appliedOnNaukri(raw) {
  for (const [k, v] of Object.entries(raw || {})) {
    if (/^(?:is|has)?applied$/i.test(k) && v === true) return true;
    if (/^(?:apply|application)status$/i.test(k) && /^applied$/i.test(String(v))) return true;
  }
  return false;
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

/**
 * How many hours ago the listing was posted, as Naukri shows it: its own "x ago" label first
 * (what you see, and what Naukri's freshness filter goes by), else its creation time; null when it
 * says neither.
 */
export function postedAgeH(job, now) {
  const f = job.footer.toLowerCase();
  if (/just now|few (?:minutes|mins)|\d+\s*(?:minutes?|mins?)\s*ago/.test(f)) return 0;
  const h = f.match(/(\d+)\s*(?:hours?|hrs?)\s*ago/);
  if (h) return Number(h[1]);
  if (/few hours|\btoday\b/.test(f)) return 6;
  const d = f.match(/(\d+)\+?\s*days?\s*ago/);
  if (d) return Number(d[1]) * 24;
  if (/yesterday/.test(f)) return 24;
  if (job.createdAt && job.createdAt <= now + HOUR) return Math.max(0, (now - job.createdAt) / HOUR);
  return null;
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

// ---------------------------------------------------------------- your skills

/** Your skills: both resumes and radar/skills.json (job-profile.js), extras from the settings, and what they imply. */
export function mySkills(extra = [], base = JOB_PROFILE) {
  const fromExtra = extra.flatMap((x) => [...findSkills(x, { keepParents: true }).keys()]);
  return withParents([...base.skills, ...fromExtra]);
}
const MY_SKILLS = mySkills();

// ---------------------------------------------------------------- companies

// Employers whose pay at about 2 years of experience is well under your bar: India's IT services,
// consulting, outsourcing and engineering-services firms. Their listings are dropped on the card,
// before any JD is opened. The finder's settings can change this list (one company per line).
// Each name matches whole words of the company's name, so "HCL" isn't "HCLTech" (both are listed).
export const LOW_PAY_COMPANIES = Object.freeze([
  'Accenture', 'TCS', 'Tata Consultancy Services', 'Infosys', 'Wipro', 'Cognizant', 'Capgemini', 'HCL', 'HCLTech', 'Tech Mahindra',
  'LTIMindtree', 'Mindtree', 'L&T Infotech', 'Larsen & Toubro', 'L&T Technology Services', 'LTTS', 'Mphasis', 'Hexaware',
  'Persistent Systems', 'Coforge', 'NIIT Technologies', 'Birlasoft', 'Zensar', 'Sonata Software', 'Mastek', 'Cyient', 'KPIT',
  'Happiest Minds', 'NTT DATA', 'DXC Technology', 'Virtusa', 'UST Global', 'UST', 'IBM', 'Deloitte', 'PwC', 'PricewaterhouseCoopers',
  'EY', 'Ernst & Young', 'KPMG', 'Genpact', 'WNS', 'EXL', 'EXL Service', 'Concentrix', 'Teleperformance', 'Firstsource', 'Sutherland',
  'HGS', 'Hinduja Global Solutions', 'iGate', 'Syntel', 'Atos', 'Sopra Steria', 'CGI', 'Unisys', 'Fujitsu', 'NEC', 'Datamatics',
  '3i Infotech', 'Cybage', 'Quest Global', 'Tata Elxsi', 'Tata Technologies', 'Sasken', 'Expleo', 'Alten', 'Infinite Computer Solutions',
  'Trigent', 'Kellton', 'InfoBeans', 'Saksoft', 'Mindteck', 'Intellect Design Arena', 'Nucleus Software', 'R Systems', 'Infogain',
  'Ness Digital Engineering',
]);

const companyWords = (s) => ` ${String(s ?? '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim()} `;

/** A list of company names (yours from the settings, or the default) → what cardCheck matches against. */
export function lowPayList(names = LOW_PAY_COMPANIES) {
  return [...new Set((Array.isArray(names) ? names : []).map(companyWords).filter((w) => w.trim()))];
}
const LOW_PAY = lowPayList();

/** The entry of `list` a company's name matches, or null. */
export function lowPayMatch(company, list = LOW_PAY) {
  const name = companyWords(company);
  return list.find((w) => name.includes(w)) || null;
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
  [/\bsales\b|\bmarketing\b|\brecruit|\bhr\b|\btalent acquisition\b|\bbusiness (?:development|analyst)\b|\baccount (?:manager|executive)\b|\bcustomer success\b|\bproduct (?:manager|owner)\b|\bproject (?:manager|coordinator)\b|\bscrum master\b|\bpre[- ]?sales\b|\btechnical writer\b|\bcontent\b|\bseo\b|\bdesigner\b/i, 'non-engineering'],
];
// "Consultant" alone is a consulting role; "Java Consultant" / "Consultant - Software Engineer" is a dev job.
const CONSULTANT = /\bconsultant\b/i;
const DEV_WORD = /\b(?:developer|engineer|programmer|java|python|backend|back end|software|full[\s-]?stack|sde|ai|genai|llm)\b/i;
// A title's own languages and frameworks: one that names only stacks you don't have isn't yours.
const STACK_AREAS = new Set(['lang', 'backend', 'frontend', 'mobile']);
// On your resume, but not a stack you apply for: a "C++ Developer" job is systems work.
const NOT_TARGET = new Set(['C', 'C++']);
// Close enough that a title naming them is still yours.
const CLOSE = { TypeScript: 'JavaScript', Flask: 'Python', Django: 'Python', NestJS: 'Node.js', 'Express.js': 'Node.js', 'Next.js': 'React' };

const CORE_TITLE = /\b(?:java|spring|back[\s-]?end|sde|swe|software (?:development )?engineer|software developer|platform engineer|microservices?|full[\s-]?stack|python (?:developer|engineer)|fast\s?api|node(?:\.?js)? (?:developer|engineer)|api developer|application (?:developer|engineer)|member of technical staff|mts)\b/i;
export const AI_TITLE = /\b(?:gen\s?ai|generative ai|llms?|ai (?:engineer|developer|application|solutions? engineer|agents?)|applied ai|agentic|ai\s?\/\s?ml|ai[\s-]ml|ml engineer|machine learning engineer|prompt engineer|conversational ai|nlp engineer|rag)\b/i;
const ANY_ENG_TITLE = /\b(?:developer|engineer|programmer|sde|swe|coder)\b/i;
const SENIOR = /\b(?:senior|sr\.?|iii|iv)\b/i;

/** → { ok:false, why } or { ok:true, fit 0–1, ai } */
export function titleCheck(title, mine = MY_SKILLS) {
  const t = ` ${title} `;
  for (const [rx, why] of TITLE_OUT) {
    if (!rx.test(t)) continue;
    if (why === 'frontend' && /full[\s-]?stack/i.test(t)) continue; // full stack is fine
    return { ok: false, why: `${why} role` };
  }
  if (CONSULTANT.test(t) && !DEV_WORD.test(t)) return { ok: false, why: 'consulting role' };
  const stacks = [...findSkills(title).keys()].filter((l) => STACK_AREAS.has(skillOf(l).area));
  const yours = (l) => !NOT_TARGET.has(l) && (mine.has(l) || mine.has(CLOSE[l] || ''));
  if (stacks.length && !stacks.some(yours)) return { ok: false, why: `${stacks.join('/')} role` };
  const ai = AI_TITLE.test(t);
  let fit = ai || CORE_TITLE.test(t) ? 1 : ANY_ENG_TITLE.test(t) ? 0.8 : 0.6;
  if (SENIOR.test(t)) fit *= 0.8;
  return { ok: true, fit, ai };
}

// ---------------------------------------------------------------- skills against yours

/** A set of found skills → how many of them you have, and how AI-heavy they are. */
function weigh(found, mine, titleSkills = new Set()) {
  const counted = [...found.keys()].filter((l) => skillOf(l).count);
  const have = counted.filter((l) => mine.has(l));
  const missing = counted.filter((l) => !mine.has(l));
  let ai = 0;
  let all = 0;
  for (const l of counted) {
    const s = skillOf(l);
    const w = s.weight * Math.min(found.get(l), 3) * (titleSkills.has(l) ? 2 : 1);
    all += w;
    if (s.ai) ai += w;
  }
  return { counted, have, missing, score: counted.length ? have.length / counted.length : null, aiShare: all ? ai / all : 0 };
}

/**
 * Skill chips (a card's, or a job page's "Key Skills") → Map(label → 1) and the chips it doesn't
 * know. A chip is a skill's name on its own, so "Go" or "C" alone count, unlike in running text.
 */
function chipSkills(tags) {
  const found = new Map();
  const unknown = [];
  for (const tag of tags) {
    const exact = skillOf(clean(tag));
    const f = exact ? new Map([[exact.label, 1]]) : findSkills(tag);
    if (!f.size) { unknown.push(tag); continue; }
    for (const [l] of f) found.set(l, (found.get(l) || 0) + 1);
  }
  return { found, unknown };
}

/** The card's skill chips. Chips the dictionary doesn't know (filler like "Strategic") are ignored. */
export function chipCheck(tags, mine = MY_SKILLS) {
  const { found, unknown } = chipSkills(tags);
  return { ...weigh(found, mine), unknown };
}

// A line that marks what follows (or itself) as optional; sections that aren't the job.
const OPTIONAL_CUE = /nice[- ]to[- ]have|good[- ]to[- ]have|\bbonus\b|added advantage|\b(?:is|would be|will be) a plus\b|\ba plus\b|plus point|preferred (?:skills|qualifications|experience)|\boptional\b|familiarity with|exposure to|\bideally\b/i;
const REQ_HEAD = /^(?:job description|responsibilit|roles? (?:and|&) responsibilit|key responsibilit|requirement|qualification|minimum|basic|must[- ]have|key skills|skills|technical skills|desired candidate|preferred candidate|candidate profile|what you|who you|you will|you'll|your|about the (?:role|job|team|position)|about you|the role|role overview|role|what we(?:'re| are|’re) looking|tech stack|technology stack|experience)/i;
const ABOUT_HEAD = /^(?:about (?:us|the company|company|[a-z][\w&.\- ]{1,40})|who we are|our (?:mission|story|values|culture|commitment|benefits)|why (?:join|work)|benefits|perks|what we offer|compensation|equal (?:opportunity|employment)|eeo\b|pay transparency|life at|total rewards|company (?:profile|description|overview)|industry type|department|employment type|role category|education)/i;

/** A JD's text → the part that's the job's requirements (no "nice to have", no company blurb or perks). */
export function jdSections(text) {
  const req = [];
  const opt = [];
  let mode = 'req';
  for (const raw of String(text ?? '').split(/\n+/)) {
    const line = raw.replace(/^[\s•·*\-–]+/, '').trim();
    if (!line) continue;
    const head = line.replace(/[:\s]+$/, '');
    // A heading line: short, and either ends with ":" or has no ":" at all ("Nice to have: Go" is content).
    const heading = line.length <= 70 && !/[.;!?]\s/.test(line) && (/:\s*$/.test(line) || (!line.includes(':') && line.split(' ').length <= 6));
    if (heading && REQ_HEAD.test(head)) { mode = OPTIONAL_CUE.test(head) ? 'opt' : 'req'; continue; }
    if (heading && OPTIONAL_CUE.test(head)) { mode = 'opt'; continue; }
    if (heading && ABOUT_HEAD.test(head)) { mode = 'about'; continue; }
    if (mode === 'about') continue;
    if (mode === 'opt' || OPTIONAL_CUE.test(line)) opt.push(line);
    else req.push(line);
  }
  return { req: req.join('\n'), opt: opt.join('\n') };
}

// ---------------------------------------------------------------- rank

const clamp01 = (x) => Math.max(0, Math.min(1, x));

/** 0–100: skills (40), title (15), experience (15), pay (10), company rating (10), freshness (10). */
export function rankOf({ fit, score, have = 0, years, pay, rating, reviews, createdAt }, now, minScore = RULES.minScore) {
  let skill = 0.55;
  if (score != null) {
    const cov = 0.6 + 0.4 * clamp01((score - minScore) / Math.max(0.05, 1 - minScore));
    const depth = Math.min(have, 8) / 8;
    skill = 0.7 * cov + 0.3 * depth;
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
  return Math.round(100 * (0.4 * skill + 0.15 * fit + 0.15 * exp + 0.1 * payS + 0.1 * co + 0.1 * fresh));
}

// ---------------------------------------------------------------- step 1: the card

/**
 * → { keep:false, why, job } or { keep:true, job, day, years, pay, fit, titleAi, chips, cardRank }
 * `keep` here means "worth opening its JD".
 */
export function cardCheck(raw, { now, mine = MY_SKILLS, minScore = RULES.minScore, lowPay = LOW_PAY } = {}) {
  const job = normalizeJob(raw || {});
  if (!job.id || !job.title || !job.url || !job.company) return { keep: false, why: 'incomplete listing', job };
  if (job.applied) return { keep: false, why: 'you applied on Naukri', job };
  if (lowPayMatch(job.company, lowPay)) return { keep: false, why: 'low-pay company', job };
  const ageH = postedAgeH(job, now);
  if (ageH != null && ageH >= RULES.maxAgeH) return { keep: false, why: 'posted over 48 hours ago', job };
  const day = trackerDay(now); // the day it's found on
  const t = titleCheck(job.title, mine);
  if (!t.ok) return { keep: false, why: t.why, job };
  const years = parseYears(job.expText);
  if (years && years.min >= RULES.maxMinYears) return { keep: false, why: `asks ${years.min}+ years`, job };
  if (years && years.max != null && years.max < RULES.minMaxYears) return { keep: false, why: 'fresher role', job };
  const pay = parsePay(job);
  if (pay.kind !== 'unknown' && pay.maxL < RULES.minPayL) return { keep: false, why: 'pays under 15L', job };
  const chips = chipCheck(job.tags, mine);
  if (chips.counted.length >= 3 && chips.score < RULES.cardFloor) return { keep: false, why: "card's skills are another stack", job, chips };
  const cardRank = rankOf({
    fit: t.fit, score: chips.counted.length >= 2 ? chips.score : null, have: chips.have.length,
    years, pay, rating: job.rating, reviews: job.reviews, createdAt: job.createdAt,
  }, now, minScore);
  return { keep: true, job, day, ageH, years, pay, fit: t.fit, titleAi: t.ai, chips, cardRank };
}

// ---------------------------------------------------------------- step 2: the JD

/**
 * The card's verdict and the JD read off the job's page ({ text, skills: Naukri's key skills }) →
 * { keep, why?, profile, jd: true, skills: { counted, have, missing, score }, aiShare, rank, few? }
 */
export function jdCheck(card, { text = '', skills = [] } = {}, { now, mine = MY_SKILLS, minScore = RULES.minScore } = {}) {
  const { req } = jdSections(text);
  const found = findSkills(`${card.job.title}\n${req}`);
  for (const [l, k] of chipSkills(skills).found) found.set(l, Math.max(found.get(l) || 0, k)); // the page's "Key Skills"
  const w = weigh(found, mine, new Set(findSkills(card.job.title).keys()));
  const profile = card.titleAi || w.aiShare >= RULES.aiShare ? 'ai' : 'backend';
  const v = {
    job: card.job, day: card.day, ageH: card.ageH, years: card.years, pay: card.pay, fit: card.fit, profile, jd: true,
    aiShare: w.aiShare, skills: { counted: w.counted, have: w.have, missing: w.missing, score: w.score },
  };
  const rank = (score) => rankOf({
    fit: card.fit, score, have: w.have.length, years: card.years, pay: card.pay,
    rating: card.job.rating, reviews: card.job.reviews, createdAt: card.job.createdAt,
  }, now, minScore);
  if (w.score != null && w.score < minScore) return { keep: false, why: `JD match under ${Math.round(minScore * 100)}%`, ...v };
  // A JD naming few technologies (or none) says little: kept on the same bar, ranked a little lower.
  if (w.counted.length < RULES.minJdSkills) return { keep: true, few: true, ...v, rank: Math.max(0, rank(w.score) - 5) };
  return { keep: true, ...v, rank: rank(w.score) };
}

/** A job whose page couldn't be read: judged on its chips alone, and only when they say enough. */
export function cardOnly(card, { now, minScore = RULES.minScore } = {}) {
  const c = card.chips;
  const v = {
    job: card.job, day: card.day, ageH: card.ageH, years: card.years, pay: card.pay, fit: card.fit, jd: false,
    profile: card.titleAi || c.aiShare >= RULES.aiShare ? 'ai' : 'backend', aiShare: c.aiShare,
    skills: { counted: c.counted, have: c.have, missing: c.missing, score: c.score },
  };
  if (!(c.counted.length >= 3 && c.score >= minScore)) return { keep: false, why: "job page unreadable, card doesn't say enough", ...v };
  return {
    keep: true, ...v,
    rank: rankOf({ fit: card.fit, score: c.score, have: c.have.length, years: card.years, pay: card.pay, rating: card.job.rating, reviews: card.job.reviews, createdAt: card.job.createdAt }, now, minScore),
  };
}

// ---------------------------------------------------------------- what the site gets

// The parser's order (your site's too, for jobs not rated yet): highest JD match first. A JD that
// names only a few technologies says little, so those come after the ones that name enough, and one
// naming none comes last; the rank (title, experience, pay, company rating) breaks ties.
export const parserTier = (o) => (o.coverage == null ? 2 : o.fewSkills ? 1 : 0);
export const byParser = (a, b) => parserTier(a) - parserTier(b) || (b.coverage || 0) - (a.coverage || 0) || (b.rank || 0) - (a.rank || 0);

/** The pay label for the site (verdict names the Openings tab knows). */
export function payLabel(pay) {
  const range = (p) => `₹${p.minL}${p.maxL !== p.minL ? `–${p.maxL}` : ''}L`;
  if (pay.kind === 'shown') {
    return { verdict: pay.maxL >= 25 ? 'meets' : pay.maxL >= 22 ? 'close' : 'fifteen', text: `${range(pay)} posted` };
  }
  if (pay.kind === 'hidden') return { verdict: 'hidden', text: `${range(pay)}, hidden on the listing` };
  return { verdict: 'unknown', text: 'Not disclosed on the listing' };
}

/**
 * When it was posted, for your site's 48-hour window: Naukri's own time when it agrees with the
 * "x ago" label (a reposted job keeps its old creation time; the label is what Naukri goes by),
 * else the label's estimate, else when it was found.
 */
export function postedTimeOf(job, ageH, now) {
  if (ageH == null) return job.createdAt && job.createdAt <= now + HOUR ? job.createdAt : now;
  const fromLabel = Math.round(now - ageH * HOUR);
  return job.createdAt && Math.abs(job.createdAt - fromLabel) <= 24 * HOUR ? job.createdAt : fromLabel;
}

/** A kept job (jdCheck or cardOnly) → the opening /api/radar stores (the radar's fields, plus the finder's own). */
export function toOpening(v, now) {
  const { job, years, pay, skills, profile, rank } = v;
  const pct = skills.score != null ? Math.round(skills.score * 100) : null;
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
    postedAt: v.day,
    seenSince: now,
    postedTime: postedTimeOf(job, v.ageH, now),
    ...(years ? { minYoe: years.min, ...(years.max != null ? { maxYoe: years.max } : {}) } : {}),
    exp: years ? 'fits' : 'unknown',
    pay: payLabel(pay),
    matchScore: pct != null ? Math.max(1, pct) : 50,
    ...(pct != null ? { coverage: pct } : {}),
    skillsHave: skills.have.length,
    skillsTotal: skills.counted.length,
    matched: skills.have.slice(0, 10).map((s) => ({ skill: s, type: 'have' })),
    missing: skills.missing.slice(0, 6),
    rank,
    profile,
    jd: v.jd === true,
    aiShare: Math.round((v.aiShare || 0) * 100) / 100,
    ...(v.few ? { fewSkills: true } : {}),
    ...(job.rating != null ? { rating: job.rating } : {}),
    ...(job.reviews != null ? { reviews: job.reviews } : {}),
    snippet: job.snippet.slice(0, 250),
  };
}
