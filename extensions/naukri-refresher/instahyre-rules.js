// Instahyre auto-apply's skip rules (no browser APIs: instahyre.js and the tests use them).
// A job it won't apply to: an IT-services or consulting firm (the finder's low-pay list), a title that
// isn't software engineering work (the finder's title rules), or one asking for 3 or more years.

import { titleCheck } from './jobs-lib.js';
import { lowPayMatch } from './low-pay.js';

const YEARS = /(\d{1,2})(?:\s*(?:-|–|—|to)\s*(\d{1,2}))?\s*\+?\s*(?:years?|yrs?)\b/gi;
const CORE = /\b(?:professional|industry|overall|total|relevant|software (?:development|engineering)|engineering experience|development experience|work experience)\b/i;
const PREFERRED = /\b(?:preferred qualifications|preferred skills|nice[ -]to[ -]have|good to have|bonus points|preferred:)/i;

/**
 * The years a job asks for, from the text of its open view: the experience badge ("2-4 Years", before
 * the job description) and the description's overall ask ("4-8 years of overall software engineering
 * experience"; a side skill's "2+ years with Kafka" doesn't count). → the highest floor, or null.
 */
export function yearsAsked(text) {
  const t = String(text ?? '');
  const cut = t.search(/job description/i);
  const head = cut > 0 ? t.slice(0, cut) : '';
  let body = cut > 0 ? t.slice(cut) : t;
  const pref = body.search(PREFERRED);
  if (pref > 200) body = body.slice(0, pref);
  const floors = [];
  for (const m of head.matchAll(YEARS)) { const n = Number(m[1]); if (n <= 20) { floors.push(n); break; } }
  const core = [];
  const any = [];
  for (const m of body.matchAll(YEARS)) {
    const n = Number(m[1]);
    if (n > 20) continue;
    // The sentence it's in (a neighbour's words don't count), and not one that calls it a plus.
    const end = m.index + m[0].length;
    const from = Math.max(body.lastIndexOf('.', m.index), body.lastIndexOf('\n', m.index), body.lastIndexOf('•', m.index), body.lastIndexOf(';', m.index));
    const stops = [body.indexOf('.', end), body.indexOf('\n', end), body.indexOf('•', end)].filter((i) => i >= 0);
    const sentence = body.slice(from + 1, stops.length ? Math.min(...stops) : body.length);
    if (!/\bexp(?:erience|ertise)?\b/i.test(sentence) || /\b(?:plus|preferred|bonus|nice to have|good to have|advantage)\b/i.test(sentence)) continue;
    any.push(n);
    if (CORE.test(sentence)) core.push(n);
  }
  if (core.length) floors.push(Math.max(...core));
  else if (any.length) floors.push(Math.min(...any));
  return floors.length ? Math.max(...floors) : null;
}

/**
 * Should this job get an application? → { apply, why }. `job`: { company, title, text } (the open
 * view's text); `lowPay`: the IT-services list; skipRules false applies to everything the search shows.
 */
export function judge(job, { lowPay, skipRules = true } = {}) {
  if (!skipRules) return { apply: true, why: '' };
  if (job.company && lowPayMatch(job.company, lowPay)) return { apply: false, why: 'IT services / low-pay company' };
  const t = titleCheck(job.title || '');
  if (!t.ok) return { apply: false, why: t.why };
  const y = yearsAsked(job.text);
  if (y != null && y >= 3) return { apply: false, why: `asks ${y}+ years` };
  return { apply: true, why: '' };
}


// ---------------------------------------------------------------- the settings

export const INSTA_ORIGIN = 'https://www.instahyre.com';
const SEARCH = `${INSTA_ORIGIN}/candidate/opportunities/?company_size=0&job_type=0&search=true`;
// Several skills are written skills=a,b,c with "+" for a space and %2B for a plus (the links Instahyre made for the owner's searches).
export const INSTA_DEFAULTS = Object.freeze({
  urlJava: `${SEARCH}&skills=Java,Spring+Boot`,
  urlAi: `${SEARCH}&skills=PostgreSQL,Snowflake,Redis,Kafka,Amazon+S3,Azure,Firebase,Docker,LangGraph,LangChain,LLMs,Agentic+AI&years=2`,
  maxRun: 100, // applies in one run
  maxDay: 200, // applies in a day (4am to 4am IST, as the job tracker's day)
  skipRules: false, // applies to everything the search shows; the box on the page turns the skip rules on
  v: 3,
  dry: false,
  pauseMin: 2500,
  pauseMax: 6500,
});

const okUrl = (u) => {
  try { const x = new URL(String(u)); return x.origin === INSTA_ORIGIN && x.pathname.startsWith('/candidate/') ? x.href : null; } catch { return null; }
};
const int = (v, lo, hi, d) => (Number.isFinite(Number(v)) && Number(v) >= lo && Number(v) <= hi ? Math.round(Number(v)) : d);

// Links earlier versions defaulted to (settings saved with one of them move to the new default), and
// settings saved before version 2 (the safer first defaults) take the new ones too.
const OLD_URLS = new Set([
  `${SEARCH}&skills=Java,Python,FastAPI,C%2B%2B,JavaScript,Node.js,SQL,Spring+Boot,Spring+Data,JPA,Hibernate,React.js,Microservices,API+Testing,OAuth&years=2`,
  `${SEARCH}&skills=Java&years=2`,
  `${SEARCH}&skills=LLMs,rag,LangGraph&years=2`,
  `${SEARCH}&skills=LLMs&skills=rag&skills=LangGraph&years=2`,
  `${SEARCH}&skills=java,Spring+Boot,PostgreSQL,Python,LangGraph,LangChain,Azure+Blob+Storage,JavaScript,React.js,LLMs,Java&years=2`,
  `${SEARCH}&skills=Python,LangGraph,LangChain,LLMs&years=2`,
]);
// URLSearchParams decodes Spring+Boot and C%2B%2B correctly. Keep other filters so recovery
// can never silently broaden a search with a location, company size or other constraint.
export function savedSearch(link) {
  const u = new URL(link);
  if (u.origin !== INSTA_ORIGIN || !/^\/candidate\/opportunities\/?$/.test(u.pathname) ||
      u.searchParams.get('search') !== 'true' || u.searchParams.has('matching')) {
    throw new Error('Save the link from the Instahyre Search Results tab after pressing Search.');
  }
  const skills = [...new Set(u.searchParams.getAll('skills').flatMap((v) => v.split(',')).map((v) => v.trim()).filter(Boolean))];
  if (!skills.length) throw new Error('The saved search needs at least one skill.');
  const filters = [...u.searchParams].filter(([k]) => !['search', 'skills', 'page'].includes(k));
  return { skills, filters };
}

export function cleanCfg(c = {}) {
  const D = INSTA_DEFAULTS;
  const fresh = (Number(c.v) || 1) < 2; // saved by the first version: its defaults weren't chosen by you
  const link = (u, d) => { const x = okUrl(u); return !x || ((Number(c.v) || 1) < 3 && OLD_URLS.has(x)) ? d : x; };
  return {
    v: 3,
    urlJava: link(c.urlJava, D.urlJava),
    urlAi: link(c.urlAi, D.urlAi),
    maxRun: fresh ? D.maxRun : int(c.maxRun, 1, 300, D.maxRun),
    maxDay: fresh ? D.maxDay : int(c.maxDay, 1, 500, D.maxDay),
    skipRules: fresh ? D.skipRules : c.skipRules === true,
    dry: c.dry === true,
    pauseMin: int(c.pauseMin, 0, 60000, D.pauseMin),
    pauseMax: int(c.pauseMax, 0, 120000, D.pauseMax),
  };
}
