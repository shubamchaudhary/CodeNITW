// Naukri job finder: the background part (rules are in jobs-lib.js, the AI rating in rate.js).
//
// A few times a day it opens Naukri's own job search pages in a muted background tab, one after
// another, and reads the results the page itself loaded (capture.js keeps a copy of the page's
// search response; the result cards are the fallback). For each card that looks right it then
// opens that job's own page and reads its JD the same way (the page's job-details response, or
// the page itself), and keeps the job only if the JD's technologies match yours. It never clicks
// anything, never applies, and makes no Naukri request of its own. The parser's top 400 per list
// are sent to your site's /api/radar, where the Openings tab lists them, one list per account.
//
// Every listing, not a sample: the runs sweep through every page of every search (one page of each
// in turn, so wherever a run stops each search had its share). A run goes on for up to an hour and
// the next one carries on where it stopped; a finished sweep starts again for what's new since.
//
// The AI rating (with your Groq keys): while the sweep goes on, each job sent is also rated by an
// LLM against your resume (rate.js), and sent again with its rating. Your site shows the top 100
// per list by that rating. Without a key the jobs wait, with their JD text, for keys to be saved.
//
// Safety: one run at a time, a few seconds between pages, page caps per run and per day, and it
// pauses (and tells you) the moment Naukri shows a check, a login page or an error, instead of
// retrying. Nothing is uploaded until your site says it knows the job finder.
//
// Two Naukri accounts in two browsers: each browser can search for its own account's list only
// (settings: "Searches for"), so each account reads half the pages. The site token arrives by
// itself: open your site's Job tracker in this browser, signed in, and the page hands the
// extension the finder's own token (site-bridge.js). Pasting a token still works too.

import { NAUKRI_ORIGIN, NAUKRI_MATCH, MIN, HOUR, DAY } from './lib.js';
import {
  RADAR_API_URL, RADAR_API_MATCH, SEARCHES, FINDER_LIMITS, RULES, RULES_VERSION, PROFILES, SCOPES, LOW_PAY_COMPANIES, searchUrl, searchesFor,
  trackerDay, nextFinderRun, cardCheck, jdCheck, cardOnly, mySkills, toOpening, normalizeJob, htmlToText, lowPayList, byParser, parsePay,
} from './jobs-lib.js';
import { RATE, rateText, keyHint } from './rate-lib.js';
import { auditLoad, auditNote, auditDoc, auditSave, auditClear, auditEntries, auditDocOf } from './audit.js';
import { loadResumes, hasGroqAccess, checkKeys, loadQueue, pruneQueue, saveQueue, startRater, loadPayCache, savePayCache } from './rate.js';
import { JOB_PROFILE } from './job-profile.js';

const ext = globalThis.browser ?? globalThis.chrome;
const S = 'jobsSettings';
const K = 'jobs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (lo, hi) => Math.round(lo + Math.random() * (hi - lo));
// The token your site hands over (api/radar.mjs finderToken).
const PAIR_TOKEN = /^nrf1\.[A-Za-z0-9_-]{20,100}$/;

// A Groq API key: one word ("gsk_…"). A model id: "openai/gpt-oss-20b".
const KEY_SHAPE = /^[A-Za-z0-9._-]{20,200}$/;
const MODEL_SHAPE = /^[a-z0-9][a-z0-9._/-]{2,80}$/i;
/** Keys as typed (one per line, or separated by commas or spaces) → a list. */
const splitKeys = (v) => (Array.isArray(v) ? v : String(v ?? '').split(/[\s,;]+/)).map((k) => String(k ?? '').trim()).filter(Boolean);

function cleanSettings(s = {}) {
  const [lo, hi] = RULES.minScoreRange;
  const bar = Number(s.minScore);
  const model = typeof s.rateModel === 'string' ? s.rateModel.trim() : '';
  return {
    enabled: s.enabled === true,
    token: typeof s.token === 'string' ? s.token.trim().slice(0, 300) : '',
    extraSkills: typeof s.extraSkills === 'string' ? s.extraSkills.slice(0, 500) : '',
    scope: SCOPES.includes(s.scope) ? s.scope : 'both',
    pairedAt: typeof s.pairedAt === 'number' ? s.pairedAt : null, // when your site last handed over the token
    minScore: bar >= lo && bar <= hi ? Math.round(bar * 100) / 100 : RULES.minScore, // the JD match bar
    // The AI rating: your Groq keys (kept in this browser, sent only to api.groq.com), the model,
    // and how many Groq calls this browser may make a day.
    groqKeys: [...new Set(splitKeys(s.groqKeys).filter((k) => KEY_SHAPE.test(k)))].slice(0, RATE.maxKeys),
    rateModel: MODEL_SHAPE.test(model) ? model : RATE.model,
    rateCalls: RATE.callsChoices.includes(Number(s.rateCalls)) ? Number(s.rateCalls) : RATE.callsPerDay,
    // Companies left out on the card; null means the default list (LOW_PAY_COMPANIES).
    lowPay: Array.isArray(s.lowPay)
      ? [...new Set(s.lowPay.map((x) => String(x ?? '').replace(/\s+/g, ' ').trim().slice(0, 60)).filter(Boolean))].slice(0, 300)
      : null,
  };
}
const extraList = (settings) => settings.extraSkills.split(',').map((s) => s.trim()).filter(Boolean);

/** Which browser this is, for the site's "last sent" line. */
function browserName() {
  const ua = String(globalThis.navigator && navigator.userAgent);
  if (/Edg\//.test(ua)) return 'Edge';
  if (/Firefox\//.test(ua)) return 'Firefox';
  return 'Chrome';
}
export async function loadSettings() { return cleanSettings((await ext.storage.local.get(S))[S]); }
async function loadState() {
  const st = (await ext.storage.local.get(K))[K] || {};
  st.seen = st.seen && typeof st.seen === 'object' ? st.seen : {};
  st.daily = st.daily || {};
  st.runs = Array.isArray(st.runs) ? st.runs : [];
  st.pending = Array.isArray(st.pending) ? st.pending : [];
  st.queue = Array.isArray(st.queue) ? st.queue : []; // cards whose job pages a run didn't get to
  st.reasons = st.reasons && typeof st.reasons === 'object' ? st.reasons : {};
  st.unknown = st.unknown && typeof st.unknown === 'object' ? st.unknown : {};
  // What each job's JD said, kept 3 days: a job seen again isn't opened again.
  st.memo = st.memo && typeof st.memo === 'object' ? st.memo : {};
  // Each job's AI rating, kept 3 days. A re-scan or new rules keep them: a rating costs money.
  st.rated = st.rated && typeof st.rated === 'object' ? st.rated : {};
  // What this browser has on your site (kept 3 days, like the site keeps it), and what to take off
  // it: a job read again that the rules now turn down.
  st.onSite = st.onSite && typeof st.onSite === 'object' ? st.onSite : {};
  st.unsend = Array.isArray(st.unsend) ? st.unsend : [];
  return st;
}

/** Before verdicts are forgotten (new rules, a re-scan): what they kept is on your site, so it can come off. */
function rememberOnSite(st) {
  const onSite = { ...(st.onSite || {}) };
  for (const [id, m] of Object.entries(st.memo || {})) {
    if (m && m.keep && m.o && m.pool !== false && !onSite[id]) onSite[id] = { t: m.t, company: m.o.company };
  }
  return onSite;
}
const MEMO_DAYS = 3;
const FLUSH_MS = 5 * MIN; // a long run sends what it kept every few minutes
const POOL_WHY = `kept, but below the top ${RULES.poolTop} of its list`;

/** The day's AI rating tally (in st.daily, so a new day starts it again). */
function rateCounts(daily) {
  if (!daily.rate) daily.rate = { calls: 0, rated: { backend: 0, ai: 0 }, tokens: { input: 0, cached: 0, output: 0 }, fails: 0, last: null, keys: {} };
  return daily.rate;
}

/** Record how a run ended (shown in the popup and the settings page). */
function noteRun(st, run) {
  run.seconds = Math.round((Date.now() - run.t) / 1000);
  st.lastRun = run;
  st.runs = [run, ...st.runs].slice(0, 12);
}
const saveState = (st) => ext.storage.local.set({ [K]: st });

/** A new day (4am IST) starts fresh lists; new rules (an update) forget the verdicts they made. */
function rollDay(st, now) {
  const day = trackerDay(now);
  if (st.rulesVersion !== RULES_VERSION) {
    st = {
      ...st, rulesVersion: RULES_VERSION, pending: [], rated: {}, seen: {}, queue: [], unknown: {}, reasons: {}, memo: {}, sweep: null, onSite: rememberOnSite(st),
      daily: { ...(st.daily || {}), read: 0, kept: { backend: 0, ai: 0 } },
    };
  }
  if (st.day === day) return st;
  const cut = now - MEMO_DAYS * DAY;
  const fresh = (o) => Object.fromEntries(Object.entries(o || {}).filter(([, m]) => m && m.t > cut));
  const since = now - RULES.maxAgeH * HOUR;
  return {
    // What it judged stays judged for 3 days (a job seen again is skipped, whatever day it is), and
    // job pages a run didn't get to wait while they're within the 48 hours.
    ...st, day, seen: fresh(st.seen), queue: (st.queue || []).filter((c) => c && c.job && (c.t || 0) > now - 2 * DAY), unknown: {}, reasons: {},
    memo: fresh(st.memo), rated: fresh(st.rated), onSite: fresh(st.onSite),
    // What didn't reach your site yet still goes, while it's within the 48 hours.
    pending: (st.pending || []).filter((o) => o && (o.postedTime || 0) >= since),
    daily: { runs: 0, pages: 0, jds: 0, read: 0, kept: { backend: 0, ai: 0 }, uploaded: 0 },
  };
}

/** Whether the AI rating can run, and if not, why (for the settings page). */
async function ratingSetup(settings, dev, st) {
  const resumes = await loadResumes(dev);
  const access = await hasGroqAccess();
  let why = '';
  if (!settings.groqKeys.length) why = 'no Groq key saved';
  else if (!settings.rateCalls) why = 'switched off (0 calls a day)';
  else if (((st.daily && st.daily.rate && st.daily.rate.calls) || 0) >= settings.rateCalls) why = `today's ${settings.rateCalls} Groq calls are used; it carries on tomorrow`;
  else if (!resumes) why = "your resumes aren't in the extension yet (resume.local.json: run naukri-refresher-dev/make-job-profile.mjs)";
  else if (!access) why = 'no access to api.groq.com yet (press Save keys on the settings page to allow it)';
  else if (st.rateStop) why = `paused: ${st.rateStop.msg}`;
  return { on: !why, why, resumes, access, hash: resumes ? resumes.hash : null };
}

/**
 * A problem no later run can get past by itself (every key rejected, a model Groq doesn't serve)
 * waits for you: new keys or a new model in the settings clear it. Keys at their limits don't.
 */
function noteRater(st, problem) {
  if (!problem || !['key', 'model'].includes(problem.kind)) return;
  st.rateStop = { kind: problem.kind, msg: problem.msg, t: Date.now(), day: st.day };
  notify('nr-rate', 'AI rating paused', `${problem.msg}. Jobs are still found and sent, without a rating.`);
}

/**
 * The shared company pay database on your site (Firestore, through the finder's token): get(key) →
 * its record or null; put(entries) saves the ones with enough evidence. Throws when the site doesn't
 * answer, which the rater counts (three in a row: it goes on without the database for the run).
 */
function sitePayDb(token) {
  if (!token) return null;
  const call = async (body) => {
    const res = await fetch(RADAR_API_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ finder: 'naukri', ...body }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`pay database: HTTP ${res.status}`);
    return res.json();
  };
  return {
    async get(key) { const r = await call({ pay: 'get', keys: [key] }); return (r.found && r.found[key]) || null; },
    put(entries) { return call({ pay: 'put', entries }); },
  };
}

/** What the report keeps of a verdict: the card, how far it got, the decision and its reason. */
function auditOf(v, jd, k, why) {
  const job = (v && v.job) || {};
  const sk = v && v.skills;
  const chips = v && v.chips;
  return {
    title: job.title, company: job.company, loc: job.location, exp: job.expText, sal: job.salaryText, posted: job.footer, url: job.url,
    stage: jd ? 'jd' : 'card', k: k ? 1 : 0, w: k ? '' : why,
    ...(sk ? { have: sk.have.length, total: sk.counted.length, score: sk.score != null ? Math.round(sk.score * 100) : null } : {}),
    ...(!sk && chips ? { score: chips.score != null ? Math.round(chips.score * 100) : null, total: chips.counted ? chips.counted.length : null } : {}),
    ...(k ? { list: v.profile, rank: v.rank } : {}),
    ...(jd && jd.apply ? { apply: jd.apply } : {}),
  };
}

/** The salary a job shows, for the rating's prompt and its pay match (nothing when it shows none). */
function salaryOf(job) {
  const p = parsePay(job || {});
  if (p.kind !== 'shown') return {};
  return { salary: job.salaryText || `${p.minL}-${p.maxL} Lacs PA`, pay: { lo: p.minL, hi: p.maxL } };
}

/** A rating came back: keep it, put it on the job, and send the job to your site again. */
const onRatedFor = (st, rating, run) => (item, ai, dbg = null, localTrace = null) => {
  auditNote(item.id, { ai: ai.s, rel: ai.rel, aiWhy: ai.why, pay: ai.pay && ai.pay.from ? ai.pay : null });
  if (dbg) auditDoc(item.id, { dbg: localTrace ? { ...dbg, ...localTrace, exact: true } : dbg });
  st.rated[item.id] = { t: Date.now(), h: rating.hash ? rating.hash[item.profile] : null, ai };
  run.rated = (run.rated || 0) + 1;
  const m = st.memo[item.id];
  if (m && (!m.keep || m.pool === false)) return; // turned down since it was queued: not sent again
  const o = m ? m.o : null;
  if (o) o.ai = ai;
  // The prompt and the model's answer go to your site with this upload only (the card's "Prompt and
  // answer"); they're never kept here.
  const extra = dbg ? { ai, dbg } : { ai };
  const i = st.pending.findIndex((p) => p && p.openingId === item.id);
  if (i >= 0) st.pending[i] = { ...st.pending[i], ...extra };
  // Its verdict forgotten since (a re-scan, new rules) but it's on your site: the copy it waited with goes.
  else if (o || (item.o && st.onSite[item.id])) st.pending.push({ ...(o || item.o), ...extra });
};

/** The jobs still waiting for a rating, saved for the next run. */
async function persistQueue(st, rq, rating) {
  const items = pruneQueue(rq, { now: Date.now(), rated: st.rated, hash: rating.hash });
  await saveQueue(items);
  st.rateQueued = items.length;
}

// The rating queue of the run in progress (the settings page shows how many wait).
let liveQueue = null;

function notify(id, title, message) {
  try {
    ext.notifications.create(id, { type: 'basic', iconUrl: ext.runtime.getURL('icons/icon128.png'), title, message });
  } catch { /* best-effort */ }
}

// ---------------------------------------------------------------- reading Naukri's pages

// Runs inside the Naukri page (MAIN world). Must be self-contained: it is serialized.
function readSearchPage() {
  const out = { href: location.href, jobs: null, via: null, status: null, total: null };
  try {
    const caps = Array.isArray(window.__nrJobs) ? window.__nrJobs : [];
    const good = caps.filter((c) => c && c.json && Array.isArray(c.json.jobDetails));
    if (good.length) {
      const c = good[good.length - 1];
      out.via = 'api';
      out.status = c.status;
      out.jobs = c.json.jobDetails;
      out.total = c.json.noOfJobs ?? null;
    } else {
      const bad = caps.find((c) => c && c.status >= 400 && /\/search\b/.test(c.url));
      if (bad) {
        out.via = 'api';
        out.status = bad.status;
        out.error = String((bad.json && (bad.json.message || bad.json.statusMessage)) || 'error').slice(0, 120);
      }
    }
    if (!out.jobs) {
      // A page that arrives with its results already in a global
      const seen = new Set();
      const find = (v, depth) => {
        if (!v || typeof v !== 'object' || depth > 6 || seen.has(v)) return null;
        seen.add(v);
        if (Array.isArray(v.jobDetails) && v.jobDetails.length && v.jobDetails[0] && (v.jobDetails[0].jobId || v.jobDetails[0].title)) return v.jobDetails;
        for (const k of Object.keys(v).slice(0, 80)) {
          const r = find(v[k], depth + 1);
          if (r) return r;
        }
        return null;
      };
      for (const name of ['_initialState', '__INITIAL_STATE__', 'initialState', '__NEXT_DATA__', '__APP_STATE__']) {
        let r = null;
        try { r = find(window[name], 0); } catch { r = null; }
        if (r) { out.via = 'state'; out.jobs = r; break; }
      }
    }
    if (!out.jobs) {
      // The result cards themselves
      const txt = (el) => (el && el.textContent ? el.textContent.replace(/\s+/g, ' ').trim() : '');
      const first = (root, sels) => { for (const s of sels) { const el = root.querySelector(s); if (el) return el; } return null; };
      const cards = [...document.querySelectorAll('[data-job-id]')].slice(0, 40);
      if (cards.length) {
        out.via = 'dom';
        out.jobs = cards.map((c) => {
          const a = first(c, ['a.title', 'a[href*="job-listings"]']);
          return {
            jobId: c.getAttribute('data-job-id'),
            title: txt(a || first(c, ['.title'])),
            jdURL: a ? a.getAttribute('href') : '',
            companyName: txt(first(c, ['.comp-name', 'a.subTitle', '.companyInfo a', '.comp-dtls-wrap a'])),
            placeholders: [
              { type: 'experience', label: txt(first(c, ['.expwdth', '.exp-wrap', '.exp'])) },
              { type: 'salary', label: txt(first(c, ['.sal-wrap span', '.sal-wrap', '.sal'])) },
              { type: 'location', label: txt(first(c, ['.locWdth', '.loc-wrap', '.loc'])) },
            ],
            tagsAndSkills: [...c.querySelectorAll('.tags-gt li, ul.tags li, li.tag-li')].map(txt).filter(Boolean).join(','),
            footerPlaceholderLabel: txt(first(c, ['.job-post-day', '.job-post-day span', '.postedDate'])),
            jobDescription: txt(first(c, ['.job-desc', '.job-description'])),
          };
        });
      }
    }
    const body = document.body ? document.body.innerText.slice(0, 4000) : '';
    const visible = (el) => !!el && el.offsetWidth > 20 && el.offsetHeight > 20 && getComputedStyle(el).visibility !== 'hidden';
    // An invisible reCAPTCHA sits on many pages; only a challenge you'd have to answer counts.
    const challenge = [...document.querySelectorAll('iframe[src*="recaptcha"][src*="bframe"], iframe[src*="hcaptcha"], #px-captcha, iframe[src*="challenge"]')].some(visible);
    out.captcha = challenge || /verify (?:that )?you are (?:a )?human|are you a robot|unusual traffic|access denied|request blocked/i.test(body);
    out.loginWall = /\/nlogin\//.test(location.pathname);
    out.empty = /no (?:matching )?(?:jobs|results) found|we couldn.t find any/i.test(body);
    out.ready = document.readyState;
  } catch (e) {
    out.error = String(e && e.message).slice(0, 120);
  }
  return out;
}

// Runs inside a Naukri job page (MAIN world). Must be self-contained: it is serialized.
function readJobPage() {
  const out = { href: location.href, via: null, status: null, jd: null, skills: [] };
  try {
    const seen = new Set();
    // The job's details: the first object holding a real `description`.
    const pick = (v, depth) => {
      if (!v || typeof v !== 'object' || depth > 6 || seen.has(v)) return null;
      seen.add(v);
      if (typeof v.description === 'string' && v.description.length > 80) return v;
      for (const k of Object.keys(v).slice(0, 80)) {
        const r = pick(v[k], depth + 1);
        if (r) return r;
      }
      return null;
    };
    const skillsOf = (d) => {
      const ks = d && d.keySkills;
      const list = Array.isArray(ks) ? ks : ks && typeof ks === 'object' ? [...(ks.preferred || []), ...(ks.other || [])] : [];
      return list.map((s) => (typeof s === 'string' ? s : (s && (s.label || s.name)) || '')).filter(Boolean).slice(0, 40);
    };
    const caps = Array.isArray(window.__nrJobs) ? window.__nrJobs : [];
    let detail = null;
    for (let i = caps.length - 1; i >= 0 && !out.jd; i--) {
      const c = caps[i];
      if (!c || !/\/job\//.test(c.url)) continue;
      if (c.status >= 400 && out.status == null) out.status = c.status;
      const d = c.json && pick(c.json, 0);
      if (d) { out.via = 'api'; out.status = c.status; out.jd = d.description; out.skills = skillsOf(d); detail = d; }
    }
    if (!out.jd) {
      for (const name of ['_initialState', '__INITIAL_STATE__', 'initialState', '__NEXT_DATA__', '__APP_STATE__']) {
        let d = null;
        try { d = pick(window[name], 0); } catch { d = null; }
        if (d) { out.via = 'state'; out.jd = d.description; out.skills = skillsOf(d); detail = d; break; }
      }
    }
    // Applied to it already? Naukri's own flag on the job, or its apply button (the first one on
    // the page, the job's own) saying "Applied".
    const flagged = !!detail && Object.entries(detail).some(([k, v]) =>
      (/^(?:is|has)?applied$/i.test(k) && v === true) || (/^(?:apply|application)status$/i.test(k) && /^applied$/i.test(String(v))));
    const applyBtn = [...document.querySelectorAll('button, [id*="appl" i], [class*="appl" i]')]
      .find((e) => /^\W*(?:apply|applied|already\s+applied|apply on company site|i am interested|interested)\W*$/i.test((e.textContent || '').trim()));
    out.applied = flagged || !!(applyBtn && /^\W*(?:already\s+)?applied\W*$/i.test(applyBtn.textContent.trim()));
    // How you apply: on Naukri ("Apply"), or on the company's own site ("Apply on company site"),
    // and that site's link when the page has it: in the job's data (a field naming apply,
    // redirect, career or company with a link off Naukri), or as the button's own link. Read, never
    // clicked: a click could count as an application on Naukri.
    const offNaukri = (u) => {
      try {
        const x = new URL(String(u), location.href);
        return /^https?:$/.test(x.protocol)
          && !/(?:^|\.)(?:naukri\.com|naukimg\.com|ambitionbox\.com|google\.com|googleapis\.com|gstatic\.com|facebook\.com|linkedin\.com|twitter\.com|x\.com|instagram\.com|youtube\.com|whatsapp\.com)$/i.test(x.hostname)
          && !/\.(?:png|jpe?g|gif|svg|webp|ico|css|js|pdf)$/i.test(x.pathname) ? x.href : null;
      } catch { return null; }
    };
    let applyUrl = null;
    const applyKeys = [];
    if (detail) {
      const seen2 = new Set();
      const scan = (v, depth, key) => {
        if (!v || depth > 4) return;
        if (typeof v === 'string') {
          // Only fields that are about APPLYING (a redirect or external apply link). Not "website" or
          // "career": every job carries its company's homepage under such a field.
          if (/apply.?(?:redirect|url|link)|redirect.?(?:url|link)|external.?(?:apply|url|link)/i.test(key)) {
            applyKeys.push(key);
            if (!applyUrl) applyUrl = offNaukri(v);
          }
          return;
        }
        if (typeof v !== 'object' || seen2.has(v)) return;
        seen2.add(v);
        for (const k of Object.keys(v).slice(0, 150)) scan(v[k], depth + 1, k);
      };
      scan(detail, 0, '');
    }
    const btnText = applyBtn ? applyBtn.textContent.trim() : '';
    if (!applyUrl && applyBtn) {
      const a = applyBtn.closest('a[href]') || applyBtn.querySelector('a[href]');
      if (a) applyUrl = offNaukri(a.getAttribute('href'));
    }
    const companyFlag = !!detail && Object.entries(detail).some(([k, v]) => v === true && /^(?:is)?(?:external|companysite|redirect)(?:apply|job|url)?$/i.test(k));
    // The button decides: "Apply on company site" or plain "Apply". Only a page with no readable
    // button falls back on the job's data (a redirect link, or an external-apply flag).
    const byButton = /company\s*site/i.test(btnText) ? 'company' : /^\W*apply(?:\s+now)?\W*$/i.test(btnText) ? 'naukri' : null;
    out.apply = byButton || (applyUrl || companyFlag ? 'company' : null);
    if (out.apply !== 'company') applyUrl = null; // a Naukri-apply job has no company-site link to keep
    out.applyUrl = applyUrl;
    out.applyInfo = { button: btnText.slice(0, 40), keys: [...new Set(applyKeys)].slice(0, 12), link: applyUrl ? new URL(applyUrl).hostname : null };
    if (!out.jd) {
      // The page itself: the JD block and its "Key Skills" chips.
      for (const sel of ['[class*="dang-inner-html"]', '[class*="job-desc"]', '[class*="JDC"]', '[class*="jobDescription"]', 'section.job-desc', '#job_description', '.jd-desc']) {
        const el = document.querySelector(sel);
        if (el && el.innerText && el.innerText.trim().length > 80) { out.via = 'dom'; out.jd = el.innerHTML; break; }
      }
      if (out.jd) {
        const chips = [...document.querySelectorAll('[class*="key-skill"] a, [class*="key-skill"] span, [class*="keySkill"] a, [class*="keySkill"] span')]
          .map((e) => (e.textContent || '').trim()).filter((t) => t && t.length <= 60);
        out.skills = [...new Set(chips)].slice(0, 40);
      }
    }
    if (out.jd) out.jd = String(out.jd).slice(0, 30000);
    const body = document.body ? document.body.innerText.slice(0, 4000) : '';
    const visible = (el) => !!el && el.offsetWidth > 20 && el.offsetHeight > 20 && getComputedStyle(el).visibility !== 'hidden';
    const challenge = [...document.querySelectorAll('iframe[src*="recaptcha"][src*="bframe"], iframe[src*="hcaptcha"], #px-captcha, iframe[src*="challenge"]')].some(visible);
    out.captcha = challenge || /verify (?:that )?you are (?:a )?human|are you a robot|unusual traffic|access denied|request blocked/i.test(body);
    out.loginWall = /\/nlogin\//.test(location.pathname);
    out.closed = !out.jd && /job (?:has )?expired|no longer (?:available|accepting)|this job is (?:closed|no longer)/i.test(body);
  } catch (e) {
    out.error = String(e && e.message).slice(0, 120);
  }
  return out;
}

async function readIn(tabId, func) {
  try {
    const res = await ext.scripting.executeScript({ target: { tabId }, world: 'MAIN', func });
    return (res && res[0] && res[0].result) || null;
  } catch {
    return null;
  }
}

/** Navigate the finder's tab to a page; `ready(r, waited)` says when what it read is enough. */
async function loadPage(tabId, url, prevHref, func, ready) {
  const want = new URL(url);
  try { await ext.tabs.update(tabId, { url }); } catch { return { gone: true }; } // the tab was closed
  const t0 = Date.now();
  let last = null;
  while (Date.now() - t0 < FINDER_LIMITS.pageWaitMs + 30_000) {
    await sleep(700);
    let tab;
    try { tab = await ext.tabs.get(tabId); } catch { return { gone: true }; }
    if (tab.status !== 'complete' && Date.now() - t0 < 30_000) continue;
    if (!tab.url || tab.url.startsWith('about:')) continue; // the navigation hasn't started yet
    if (!tab.url.startsWith(`${NAUKRI_ORIGIN}/`)) return { offsite: tab.url };
    const r = await readIn(tabId, func);
    if (!r) continue;
    let here = false;
    try { here = new URL(r.href).pathname === want.pathname || (!!prevHref && r.href !== prevHref); } catch { here = false; }
    if (!here) {
      if (r.loginWall) return r;
      continue; // still the previous page
    }
    last = r;
    const waited = Date.now() - t0;
    if (ready(r, waited)) return r;
    if (waited > FINDER_LIMITS.pageWaitMs + 2_000) return r;
  }
  return last || { timeout: true };
}

/** One search page and its results. */
const loadSearch = (tabId, url, prevHref) => loadPage(tabId, url, prevHref, readSearchPage, (r, waited) => {
  if ((r.via === 'api' || r.via === 'state') && r.jobs) return true;
  if (r.captcha || r.loginWall || (r.status && r.status >= 400)) return true;
  if (r.jobs && r.jobs.length && waited > 5_000) return true; // cards, and the page made no capturable call
  return !!(r.empty && waited > 4_000);
});

/** One job's own page and its JD. */
const loadJob = (tabId, url, prevHref) => loadPage(tabId, url, prevHref, readJobPage, (r, waited) => {
  if (r.jd && (r.via === 'api' || r.via === 'state' || waited > 3_000)) return true;
  return !!(r.captcha || r.loginWall || r.closed || (r.status && r.status >= 400));
});

// ---------------------------------------------------------------- one run

let running = false;

export function keepAlive() {
  const id = setInterval(() => { ext.runtime.getPlatformInfo().catch(() => {}); }, 20_000);
  return () => clearInterval(id);
}

async function hasAccess() {
  const [naukri, site] = await Promise.all([
    ext.permissions.contains({ origins: [NAUKRI_MATCH] }).catch(() => false),
    ext.permissions.contains({ origins: [RADAR_API_MATCH] }).catch(() => false),
  ]);
  return { naukri, site };
}

/** A finder request to your site that answers JSON: → { status, j } ({ status: 0 } when unreachable). */
async function sitePost(token, body) {
  try {
    const res = await fetch(RADAR_API_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ finder: 'naukri', ...body }),
    });
    return { status: res.status, j: await res.json().catch(() => null) };
  } catch (e) {
    return { status: 0, err: e && e.message };
  }
}

/** When you last started over (in any browser), as your site remembers it: 0 when it doesn't say. */
async function siteResetAt(token) {
  const { status, j } = await sitePost(token, { state: true });
  return status === 200 && j && j.finder === true ? Number(j.resetAt) || 0 : 0;
}

/** "Start over": your site deletes every job the finder put there, both lists. */
async function siteReset(token) {
  const { status, j, err } = await sitePost(token, { reset: true });
  if (status === 200 && j && j.finder === true && Number(j.resetAt) > 0) return { ok: true, deleted: Number(j.deleted) || 0, resetAt: Number(j.resetAt) };
  if (status === 401) return { ok: false, short: 'site token rejected' };
  if (status === 0) return { ok: false, short: `could not reach your site (${err})` };
  return { ok: false, short: status === 400 ? "your site doesn't know Start over yet (deploy the site changes)" : `your site answered HTTP ${status}` };
}

/**
 * Forget everything this browser read, as if the finder were new: the next run reads every listing
 * of the last 48 hours again, opens every good-looking JD, and sends what fits. Ratings from the
 * last 3 days stay (same job, same resume, same rating), and so do the day's run log and caps.
 */
function freshStart(st, resetAt, { ratings = false } = {}) {
  Object.assign(st, { seen: {}, memo: {}, queue: [], sweep: null, onSite: {}, unsend: [], pending: [], reasons: {}, unknown: {}, rateQueued: 0 });
  if (ratings) st.rated = {}; // "Start fresh": rated again too (company pay lookups are kept)
  st.resetSeen = resetAt;
  st.startedOver = Date.now();
  const kept = st.daily.kept || (st.daily.kept = {});
  kept.backend = 0;
  kept.ai = 0;
  st.daily.read = 0;
  st.daily.pages = 0; // a fresh start gets the whole day's page caps for its sweep
  st.daily.jds = 0;
}

/** Ask the site whether it knows the finder; writes nothing. */
async function siteCheck(token) {
  try {
    const res = await fetch(RADAR_API_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ finder: 'naukri', check: true }),
    });
    const j = await res.json().catch(() => null);
    if (res.status === 401) return { ok: false, short: 'site token rejected', msg: "your site rejected the token: open your site's Job tracker in this browser (signed in) and it reconnects by itself" };
    if (res.ok && j && j.finder === true) return { ok: true };
    if (res.status === 400 || res.ok) return { ok: false, short: 'site not updated', msg: "your site's /api/radar doesn't know the job finder yet: deploy the site changes, then Resume" };
    return { ok: false, transient: true, short: `site HTTP ${res.status}`, msg: `your site answered HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, transient: true, short: 'site unreachable', msg: `could not reach your site (${e && e.message})` };
  }
}

async function upload(token, openings, summary, remove = []) {
  try {
    const res = await fetch(RADAR_API_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ finder: 'naukri', summary, openings, remove }),
    });
    const j = await res.json().catch(() => null);
    if (res.ok && j && j.finder === true) return { ok: true, created: j.created || 0, updated: j.updated || 0 };
    if (res.status === 401) return { ok: false, short: 'site token rejected' };
    return { ok: false, transient: res.status >= 500 || res.status === 429, short: `site HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, transient: true, short: 'site unreachable', msg: e && e.message };
  }
}

/**
 * Sends st.pending to your site in batches, with the jobs to take off it (st.unsend). A job that
 * changed while its batch was on the way (a rating came back) stays for the next batch.
 * → { ok } or upload()'s failure.
 */
async function sendPending(st, token, summary, onSent) {
  while (st.pending.length || st.unsend.length) {
    const batch = st.pending.slice(0, FINDER_LIMITS.uploadMax);
    const gone = st.unsend.slice(0, FINDER_LIMITS.uploadMax);
    const u = await upload(token, batch, summary, gone);
    if (!u.ok) return u;
    const sent = new Set(batch);
    st.pending = st.pending.filter((o) => !sent.has(o));
    st.unsend = st.unsend.slice(gone.length);
    const t = Date.now();
    for (const o of batch) {
      const m = st.memo[o.openingId];
      if (m && m.keep) m.sent = t;
      st.onSite[o.openingId] = { t, company: o.company };
      auditNote(o.openingId, { sent: 1 });
    }
    onSent(batch.length);
  }
  return { ok: true };
}

/** A job your site has that the rules now turn down: taken off it with the next upload. */
function unlist(st, id, why) {
  const on = st.onSite[id];
  if (!on || why === 'posted over 48 hours ago') return; // that one leaves your site's 48 hours by itself
  delete st.onSite[id];
  if (!st.unsend.some((r) => r.openingId === id)) st.unsend.push({ company: on.company, openingId: id });
  st.pending = st.pending.filter((o) => o.openingId !== id);
}

async function halt(st, short, msg, until = null) {
  st.halted = { short, msg, t: Date.now(), ...(until ? { until } : {}) };
  st.plan = null;
  await saveState(st);
  // Paused until a time (every Groq key retired): it wakes up by itself then. Otherwise you press Resume.
  if (until) await ext.alarms.create('jobs', { when: until + 5000 });
  else await ext.alarms.clear('jobs');
  notify('nr-jobs', 'Job finder paused', `${msg}.`);
}

/** Test knobs (jobsDev.rate): shorter waits for the 429 rule, so a test needn't sit through 5 minutes and an hour. */
const raterKnobs = (dev) => (dev && dev.rate && typeof dev.rate === 'object' ? { limitBaseMs: dev.rate.limitBaseMs, limitStopMs: dev.rate.limitStopMs, retireMs: dev.rate.retireMs } : {});

/** Every key's retirement forgotten (you pressed Resume): they're tried again at once. */
function unretireKeys(st) {
  for (const k of Object.values((st.daily && st.daily.rate && st.daily.rate.keys) || {})) k.retiredUntil = 0;
}

async function closeTab(st) {
  const t = st.tab;
  st.tab = null;
  if (!t) return;
  try {
    if (t.winId != null) await ext.windows.remove(t.winId);
    else await ext.tabs.remove(t.tabId);
  } catch { /* already closed */ }
}

async function openTab(url) {
  try {
    const tab = await ext.tabs.create({ url, active: false });
    try { await ext.tabs.update(tab.id, { muted: true }); } catch { /* not critical */ }
    return { tabId: tab.id, winId: null };
  } catch {
    const w = await ext.windows.create({ url, state: 'minimized' }); // no window open
    return { tabId: w.tabs[0].id, winId: w.id };
  }
}

const LOGIN = { short: 'Naukri sent it to a login page', msg: 'Naukri asked to log in. Log in to naukri.com in this browser, then press Resume in the job finder' };
const CHECK = (r) => ({
  short: 'Naukri asked for a check',
  msg: `Naukri ${r.captcha ? 'showed a "are you human?" check' : `answered ${r.status}`}. Open a Naukri job search in this browser, finish any check it shows, then press Resume in the job finder`,
});

/** The whole run. Returns a short outcome for the popup; state is saved as it goes. */
async function findJobs(trigger) {
  const settings = await loadSettings();
  const access = await hasAccess();
  let st = rollDay(await loadState(), Date.now());
  if (!access.naukri || !access.site) return { kind: 'setup', short: 'needs access', msg: 'allow access to naukri.com and your site in the popup' };
  if (!settings.token) return { kind: 'setup', short: 'not connected to your site', msg: "open your site's Job tracker in this browser (signed in) and it connects by itself" };
  if (st.halted) return { kind: 'halted', short: st.halted.short };
  if (st.lock && st.lock.until > Date.now()) return { kind: 'busy' };
  st.lock = { until: Date.now() + FINDER_LIMITS.lockTtlMin * MIN };
  await saveState(st);

  const started = Date.now();
  // Test knob (the end-to-end tests only): shorter pauses and fewer searches.
  const dev = (await ext.storage.local.get('jobsDev')).jobsDev || {};
  const mine = searchesFor(settings.scope); // this browser's searches: both lists, or its account's
  const searches = Array.isArray(dev.searches) ? mine.filter((s) => dev.searches.includes(s.k)) : mine;
  const pause = () => sleep(Array.isArray(dev.pause) ? rand(dev.pause[0], dev.pause[1]) : rand(FINDER_LIMITS.pauseMin, FINDER_LIMITS.pauseMax));
  const skills = mySkills(extraList(settings));
  const lowPay = lowPayList(settings.lowPay || LOW_PAY_COMPANIES);
  const { minScore } = settings;
  const run = { t: started, trigger, scope: settings.scope, pages: 0, jds: 0, read: 0, kept: 0, fresh: 0, uploaded: 0, rated: 0, outcome: 'ok', note: '' };
  const kept = st.daily.kept || (st.daily.kept = { backend: 0, ai: 0 });
  let outcome = null;
  let prevHref = null;
  let jdFails = 0;
  let jdOff = false; // stopped opening job pages this run: it couldn't read them
  const budget = () => run.pages < FINDER_LIMITS.pagesPerRun && (st.daily.pages || 0) < FINDER_LIMITS.pagesPerDay
    && Date.now() - started < FINDER_LIMITS.runMinutes * MIN;
  const jdBudget = () => budget() && (st.daily.jds || 0) < FINDER_LIMITS.jdPerDay;
  let reopened = 0;
  // The finder's tab: opened when there's none, and again when the one it had is gone (closed by you,
  // or discarded by the browser), so a closed tab never ends a run.
  const tab = async () => {
    if (st.tab) {
      try { await ext.tabs.get(st.tab.tabId); } catch { st.tab = null; reopened += 1; run.note = `the finder tab was closed: opened a new one (${reopened})`; }
    }
    if (!st.tab) { st.tab = await openTab('about:blank'); prevHref = null; await saveState(st); }
    return st.tab.tabId;
  };
  // Loads a page, opening a new tab and trying again if the tab goes missing (3 times a run at most).
  const loadIn = async (load, url) => {
    for (;;) {
      const r = await load(await tab(), url, prevHref);
      if (!(r && r.gone) || reopened >= 3) return r;
      reopened += 1;
      st.tab = null;
      run.note = `the finder tab was closed: opened a new one (${reopened})`;
    }
  };

  // The AI rating: each job sent waits in `rq` with its JD text, and the rater (started once the
  // site check passes) works through them while the sweep goes on.
  await auditLoad();
  const rating = await ratingSetup(settings, dev, st);
  const rq = pruneQueue(await loadQueue(), { now: Date.now(), rated: st.rated, hash: rating.hash });
  liveQueue = rq;
  let rater = null;
  let payCache = null;
  const ratingOk = (c, profile) => !!c && (!rating.hash || c.h === rating.hash[profile]);
  // A job turned down now needs no rating.
  const unqueue = (id) => {
    const i = rq.findIndex((it) => it.id === id);
    if (i >= 0) rq.splice(i, 1);
  };

  // In the parser's top RULES.poolTop of its list (the last 48 hours, by JD match)? Only those go
  // to your site and get a rating.
  const inPool = (o) => {
    const since = Date.now() - RULES.maxAgeH * HOUR;
    let above = 0;
    for (const m of Object.values(st.memo)) {
      if (!m || !m.keep || !m.o || m.o === o || m.profile !== o.profile || m.o.openingId === o.openingId) continue;
      if ((m.o.postedTime || 0) < since || byParser(m.o, o) >= 0) continue;
      if (++above >= RULES.poolTop) return false;
    }
    return true;
  };

  // A decision on one job, recorded. `jd` ({ text, skills }) is what its page said, for the rating.
  const decide = (id, v, jd = null) => {
    if (jd?.text) auditDoc(id, { dbg: null, jd: String(jd.text).slice(0, 16000), skills: jd.skills || [] });
    if (!v.keep) {
      auditNote(id, auditOf(v, jd, false, v.why));
      st.seen[id] = { t: Date.now(), k: 0, w: v.why };
      st.reasons[v.why] = (st.reasons[v.why] || 0) + 1;
      unlist(st, id, v.why); // on your site from before (older rules)? It comes off.
      unqueue(id);
      return;
    }
    if ((kept[v.profile] || 0) >= FINDER_LIMITS.perListDay) { auditNote(id, auditOf(v, jd, false, 'daily cap')); st.seen[id] = { t: Date.now(), k: 0, w: 'daily cap' }; return; }
    const m = st.memo[id];
    const o = m && m.keep && m.o ? m.o : toOpening(v, Date.now());
    if (!inPool(o)) {
      auditNote(id, auditOf(v, jd, false, POOL_WHY));
      if (m) m.pool = false;
      st.seen[id] = { t: Date.now(), k: 0, w: POOL_WHY };
      st.reasons[POOL_WHY] = (st.reasons[POOL_WHY] || 0) + 1;
      unlist(st, id, POOL_WHY);
      unqueue(id);
      return;
    }
    if (m) m.pool = true;
    auditNote(id, auditOf(v, jd, true, ''));
    kept[v.profile] = (kept[v.profile] || 0) + 1;
    st.seen[id] = { t: Date.now(), k: 1, r: v.rank, p: v.profile, s: v.skills.score };
    const c = st.rated[id];
    // How you apply: on Naukri (counts toward its 50 a day) or on the company's own site.
    if (jd && jd.apply) o.apply = jd.apply;
    if (jd && jd.applyUrl) o.applyUrl = jd.applyUrl;
    if (ratingOk(c, v.profile)) o.ai = c.ai; // rated in the last few days: no new call
    else if (jd && jd.text) {
      rq.push({
        id, profile: v.profile, post: o.postedTime, t: Date.now(),
        p: { coverage: o.coverage, fewSkills: o.fewSkills, rank: o.rank },
        text: rateText(jd.text), skills: (jd.skills || []).slice(0, 20),
        job: { title: o.title, company: o.company, exp: v.job.expText, location: o.location, ...salaryOf(v.job) },
        o, // the job as sent, for when its verdict is forgotten before its rating comes back
      });
    }
    st.pending.push(o);
    run.kept += 1;
  };

  // Open one card's job page, read its JD, decide. False when the run has to stop.
  const openJd = async (card) => {
    const id = card.job.id;
    if (jdOff) { decide(id, cardOnly(card, { now: Date.now(), minScore })); return true; }
    await pause();
    const r = await loadIn(loadJob, card.job.url);
    if (r && r.href) prevHref = r.href;
    run.pages += 1;
    run.jds += 1;
    st.daily.pages = (st.daily.pages || 0) + 1;
    st.daily.jds = (st.daily.jds || 0) + 1;
    if (r.gone) { st.tab = null; run.note = 'the finder tab was closed'; st.queue.unshift(card); return false; }
    if (r.offsite || r.loginWall) { outcome = LOGIN; st.queue.unshift(card); return false; }
    if (!r.jd && (r.captcha || [403, 406, 429].includes(r.status))) { outcome = CHECK(r); st.queue.unshift(card); return false; }
    const now = Date.now();
    if (r.applied) {
      const v = { keep: false, why: 'you applied on Naukri' };
      st.memo[id] = { t: now, ...v };
      decide(id, { ...v, job: card.job }, { applied: true }); // (the report records what it was)
      return true;
    }
    if (r.closed) { decide(id, { keep: false, why: 'job closed', job: card.job }, { closed: true }); return true; }
    if (r.jd) {
      jdFails = 0;
      const text = htmlToText(r.jd);
      if (!st.jdSample || st.jdSample.reader || now - st.jdSample.t > 6 * 3600_000) {
        st.jdSample = { t: now, url: card.job.url, via: r.via, chars: text.length, keySkills: r.skills.slice(0, 20), apply: r.apply || null, applyInfo: r.applyInfo || null, start: text.slice(0, 600) };
      }
      const v = jdCheck(card, { text, skills: r.skills }, { now, mine: skills, minScore });
      // What the JD said, so the job isn't opened again while it's fresh.
      st.memo[id] = v.keep
        ? { t: now, keep: true, profile: v.profile, o: toOpening(v, now) }
        : { t: now, keep: false, why: v.why };
      decide(id, v, { text, skills: r.skills, apply: r.apply, applyUrl: r.applyUrl });
    } else {
      jdFails += 1;
      st.jdSample = { t: now, url: card.job.url, reader: { ...r, jd: undefined } };
      if (jdFails >= FINDER_LIMITS.jdFailStop) { jdOff = true; run.note = "couldn't read job pages; judged the rest by their cards"; }
      decide(id, cardOnly(card, { now, minScore }));
    }
    return true;
  };

  // Send what was kept so far (also anything a failed upload left behind), so a long run's jobs
  // reach your site as it goes. False when the site refused it; a passing failure waits for later.
  let refused = false;
  let flushed = Date.now();
  const flush = async () => {
    flushed = Date.now();
    await auditSave();
    if ((!st.pending.length && !st.unsend.length) || refused) return !refused;
    const summary = {
      ranAt: new Date(started).toISOString(), seconds: Math.round((Date.now() - started) / 1000), trigger,
      pages: run.pages, jds: run.jds, read: run.read, kept: run.kept, rated: run.rated, day: st.day, scope: settings.scope, browser: browserName(),
      keptToday: st.daily.kept, minScore, rating: rating.on ? settings.rateModel : null, version: ext.runtime.getManifest().version,
    };
    const u = await sendPending(st, settings.token, summary, (n) => {
      run.uploaded += n;
      st.daily.uploaded = (st.daily.uploaded || 0) + n;
    });
    if (!u.ok) {
      run.note = `upload failed: ${u.short}`;
      if (u.transient) return true;
      refused = true;
      outcome = outcome || { short: u.short, msg: `your site refused the upload (${u.short})` };
      return false;
    }
    if (/^upload failed/.test(run.note)) run.note = '';
    await saveState(st);
    return true;
  };

  // Job pages waiting to be read, best card first. False when the run has to stop.
  // Every Groq key retired (429 for 5 minutes running): the run pauses until the first is back, and
  // carries on by itself then. What's found so far is sent (unrated) and keeps waiting for a rating.
  const keysOut = () => {
    const p = rater && rater.problem;
    if (!p || p.kind !== 'retired') return false;
    outcome = outcome || { short: 'every Groq key is out', msg: p.msg, until: p.until };
    return true;
  };
  const readQueue = async () => {
    // (A new day empties the queue; a run going past 4am keeps the cards it found after it.)
    st.queue = st.queue.filter((c) => c && c.job).sort((a, b) => b.cardRank - a.cardRank);
    if (keysOut()) return false;
    while (st.queue.length) {
      if (!jdOff && !jdBudget()) return true; // the rest wait for the next run
      const ok = await openJd(st.queue.shift());
      await saveState(st);
      if (!ok || keysOut()) return false;
    }
    return true;
  };

  try {
    // Is the site ready? Checked once a day, and before anything is ever uploaded.
    if (st.siteOkDay !== st.day) {
      const c = await siteCheck(settings.token);
      if (!c.ok) {
        run.outcome = c.transient ? 'error' : 'paused';
        run.note = c.short;
        noteRun(st, run);
        st.lock = null;
        if (c.transient) { await saveState(st); return { kind: 'transient', short: c.short, msg: c.msg }; }
        await halt(st, c.short, c.msg);
        return { kind: 'halted', short: c.short, msg: c.msg };
      }
      st.siteOkDay = st.day;
    }

    // Started over since (in this browser or in your other one)? Your site no longer has what this
    // browser sent, so it forgets what it read too, and this sweep reads everything again.
    const resetAt = await siteResetAt(settings.token);
    if (resetAt > (st.resetSeen || 0)) {
      freshStart(st, resetAt);
      await auditClear();
      rq.length = 0;
      run.note = 'started over: reading every listing of the last 48 hours again';
      await saveState(st);
    }

    // The rating runs alongside the sweep (it only talks to api.groq.com, never to Naukri).
    if (rating.on) {
      payCache = await loadPayCache();
      rater = startRater(rq, {
        keys: settings.groqKeys, model: settings.rateModel, resumes: rating.resumes, callsPerDay: settings.rateCalls,
        counts: rateCounts(st.daily), onRated: onRatedFor(st, rating, run), payCache, payDb: sitePayDb(settings.token), ...raterKnobs(dev),
      });
    }

    // The sweep: every page of every search, a page of each in turn, so wherever a run stops every
    // search got its share. A run carries on where the last one stopped; once every search has run
    // out of pages the sweep is complete, and the next run starts a new one (for what's new since).
    const key = searches.map((s) => s.k).join('|');
    if (!st.sweep || st.sweep.key !== key || st.sweep.done) {
      st.sweep = { key, size: searches.length, n: ((st.sweep && st.sweep.n) || 0) + 1, started: Date.now(), pages: 0, next: {}, over: {}, sig: {} };
    }
    const sw = st.sweep;
    let unreadable = 0;
    // Job pages an earlier run didn't get to come first.
    if (await readQueue()) {
      outer: for (;;) {
        const open = searches.filter((s) => !sw.over[s.k]);
        if (!open.length) { sw.done = true; sw.finished = Date.now(); break; } // every search read to the end
        for (const s of open) {
          if (!budget() || (!jdOff && !jdBudget())) {
            // A stretch's own cap: it rests, then carries on. The day's cap: tomorrow's run carries on.
            run.capped = (st.daily.pages || 0) >= FINDER_LIMITS.pagesPerDay || (st.daily.jds || 0) >= FINDER_LIMITS.jdPerDay ? 'day' : 'stretch';
            run.note = run.note || (run.capped === 'day' ? "stopped at the day's page cap; tomorrow's run carries on" : 'stopped at its time or page cap; it carries on after a short rest');
            break outer;
          }
          if (run.pages > 0) await pause();
          const page = sw.next[s.k] || 1;
          const url = searchUrl(s.k, page);
          const r = await loadIn(loadSearch, url);
          if (r && r.href) prevHref = r.href;
          run.pages += 1;
          sw.pages += 1;
          st.daily.pages = (st.daily.pages || 0) + 1;
          if (r.gone) { st.tab = null; run.note = 'the finder tab was closed'; break outer; }
          if (r.offsite || r.loginWall) { outcome = LOGIN; break outer; }
          const jobs = Array.isArray(r.jobs) ? r.jobs : [];
          if (!jobs.length && (r.captcha || [403, 406, 429].includes(r.status))) { outcome = CHECK(r); break outer; }
          if (!jobs.length) {
            if (r.empty || (r.via === 'api' && r.status === 200)) { sw.over[s.k] = true; continue; } // no (more) results
            unreadable += 1;
            st.sample = { t: Date.now(), url, reader: { ...r, jobs: undefined } };
            if (unreadable >= 3) {
              outcome = { short: 'could not read Naukri results', msg: "Naukri's search page didn't show results the finder can read (3 pages in a row). It may have changed; see the finder settings' last-page details" };
              break outer;
            }
            sw.next[s.k] = page + 1;
            continue;
          }
          unreadable = 0;
          if (!st.sample || st.sample.reader || Date.now() - st.sample.t > 6 * 3600_000) {
            st.sample = { t: Date.now(), url, via: r.via, total: r.total, first: jobs[0] };
          }
          // Past its last page a search may show that page again: the same listings mean the end.
          const sig = `${normalizeJob(jobs[0] || {}).id}|${normalizeJob(jobs[jobs.length - 1] || {}).id}`;
          if (page > 1 && sw.sig[s.k] === sig) { sw.over[s.k] = true; await saveState(st); continue; }
          sw.sig[s.k] = sig;

          // The cards: what looks right waits for its job page to be read.
          let fresh = 0;
          const now = Date.now();
          for (const raw of jobs) {
            const id = normalizeJob(raw || {}).id;
            if (!id || st.seen[id]) continue;
            fresh += 1;
            run.read += 1;
            st.daily.read = (st.daily.read || 0) + 1;
            const c = cardCheck(raw, { now, mine: skills, minScore, lowPay });
            for (const u of (c.chips && c.chips.unknown) || []) st.unknown[u] = (st.unknown[u] || 0) + 1;
            if (!c.keep) { decide(id, c); continue; }
            const m = st.memo[id];
            if (m) {
              // Its JD was read in the last few days: the same verdict, no page opened. Your site
              // already has it; it's sent again only if it never got there or has a newer rating.
              if (!m.keep) { decide(id, { keep: false, why: m.why, job: c.job }); continue; }
              st.seen[id] = { t: Date.now(), k: 1, p: m.profile, memo: true };
              if (m.pool === false || (kept[m.profile] || 0) >= FINDER_LIMITS.perListDay) continue;
              kept[m.profile] = (kept[m.profile] || 0) + 1;
              run.kept += 1;
              const r2 = st.rated[id];
              const newer = ratingOk(r2, m.profile) && !(m.o.ai && m.o.ai.t === r2.ai.t);
              if (newer) m.o.ai = r2.ai;
              if (!m.sent || newer) st.pending.push(m.o);
              continue;
            }
            st.seen[id] = { t: Date.now(), k: 2 }; // its job page is next
            st.queue.push({ ...c, t: Date.now() });
          }
          run.fresh += fresh;
          // This search is read to the end when its results run out: Naukri's own total reached, or a
          // short page when it gives none (or the safety cap on one search).
          const total = Number(r.total) || 0;
          if ((total ? page * 20 >= total : jobs.length < 20) || page >= FINDER_LIMITS.pagesPerSearch) sw.over[s.k] = true;
          else sw.next[s.k] = page + 1;
          await saveState(st); // progress survives a stopped worker
          if (!(await readQueue())) break outer;
          if (Date.now() - flushed > FLUSH_MS && !(await flush())) break outer;
        }
      }
    }
  } catch (e) {
    if (rater) await rater.stop();
    throw e;
  } finally {
    await closeTab(st);
  }

  // The sweep is over (or stopped): the rater gets a few more minutes for what's still waiting.
  if (rater) {
    const left = (FINDER_LIMITS.lockTtlMin - 5) * MIN - (Date.now() - started);
    await rater.drain(Math.max(0, Math.min(RATE.drainMs, left)));
    noteRater(st, rater.problem);
    if (rater.problem && !run.note) run.note = `AI rating stopped: ${rater.problem.msg}`;
    if (payCache) await savePayCache(payCache);
    // Every key retired with jobs still waiting: paused until the first is back (it rates them then).
    if (rater.problem && rater.problem.kind === 'retired' && !outcome && rq.length) outcome = { short: 'every Groq key is out', msg: rater.problem.msg, until: rater.problem.until };
  }
  await flush(); // what's left
  await auditSave(true);
  await persistQueue(st, rq, rating);

  st.daily.runs = (st.daily.runs || 0) + 1;
  if (outcome) { run.outcome = 'paused'; run.note = outcome.short; }
  noteRun(st, run);
  st.lock = null;
  if (outcome) {
    await halt(st, outcome.short, outcome.msg, outcome.until);
    return { kind: 'halted', ...outcome };
  }
  await saveState(st);
  return { kind: 'ok', ...run };
}

/**
 * One run: stretch after stretch (each up to an hour), with a short rest between them, until the
 * sweep has read every listing, Naukri asks for a check, or the day's caps are reached.
 */
async function runGuarded(trigger) {
  if (running) return { kind: 'busy' };
  running = true;
  const stop = keepAlive();
  try {
    let r = null;
    for (let stretch = 1; stretch <= FINDER_LIMITS.stretches; stretch++) {
      r = await findJobs(stretch === 1 ? trigger : `${trigger}, part ${stretch}`);
      if (r.kind !== 'ok' || r.capped !== 'stretch' || stretch === FINDER_LIMITS.stretches) break;
      const st = await loadState();
      st.resting = { until: Date.now() + FINDER_LIMITS.restMin * MIN, part: stretch + 1 };
      await saveState(st);
      await sleep(FINDER_LIMITS.restMin * MIN);
      const after = await loadState();
      after.resting = null;
      await saveState(after);
      if (after.halted || !(await loadSettings()).token) break;
    }
    return r;
  } catch (e) {
    const st = await loadState();
    await closeTab(st);
    st.lock = null;
    st.lastRun = { t: Date.now(), trigger, outcome: 'error', note: `internal error: ${e && e.message}` };
    st.runs = [st.lastRun, ...st.runs].slice(0, 12);
    await saveState(st);
    return { kind: 'error', short: 'internal error', msg: String(e && e.message) };
  } finally {
    stop();
    running = false;
    liveQueue = null;
    const st = await loadState();
    if (st.lock || st.resting) { st.lock = null; st.resting = null; await saveState(st); }
  }
}

/**
 * "Rate waiting jobs now": the rating on its own, no Naukri page opened. It works through the jobs
 * that wait (say, those found before a key was saved) and sends their ratings to your site.
 */
async function rateOnly() {
  const settings = await loadSettings();
  const st = rollDay(await loadState(), Date.now());
  const dev = (await ext.storage.local.get('jobsDev')).jobsDev || {};
  const t0 = Date.now();
  const rating = await ratingSetup(settings, dev, st);
  if (!rating.on) {
    st.lastRate = { t: t0, seconds: 0, rated: 0, left: st.rateQueued || 0, note: rating.why };
    await saveState(st);
    return { kind: 'off', short: rating.why };
  }
  st.lock = { until: Date.now() + RATE.drainMs + 5 * MIN };
  await saveState(st);
  await auditLoad();
  const rq = pruneQueue(await loadQueue(), { now: t0, rated: st.rated, hash: rating.hash });
  liveQueue = rq;
  const run = { rated: 0 };
  const payCache = await loadPayCache();
  const rater = startRater(rq, {
    keys: settings.groqKeys, model: settings.rateModel, resumes: rating.resumes, callsPerDay: settings.rateCalls,
    counts: rateCounts(st.daily), onRated: onRatedFor(st, rating, run), payCache, payDb: sitePayDb(settings.token), ...raterKnobs(dev),
  });
  const saver = setInterval(() => { saveState(st).catch(() => {}); }, 5000);
  try { await rater.drain(RATE.drainMs); } finally { clearInterval(saver); }
  await savePayCache(payCache);
  await auditSave(true);
  noteRater(st, rater.problem);
  let note = rater.problem ? rater.problem.msg : '';
  // The ratings go to your site (when it's known to take the finder's uploads), else with the next run.
  if ((st.pending.length || st.unsend.length) && settings.token) {
    let siteOk = st.siteOkDay === st.day;
    if (!siteOk) {
      siteOk = (await siteCheck(settings.token)).ok;
      if (siteOk) st.siteOkDay = st.day;
    }
    if (siteOk) {
      const summary = {
        ranAt: new Date(t0).toISOString(), seconds: Math.round((Date.now() - t0) / 1000), trigger: 'rate', pages: 0, jds: 0, read: 0, kept: 0,
        rated: run.rated, day: st.day, scope: settings.scope, browser: browserName(), keptToday: st.daily.kept, minScore: settings.minScore,
        rating: settings.rateModel, version: ext.runtime.getManifest().version,
      };
      const u = await sendPending(st, settings.token, summary, (n) => { st.daily.uploaded = (st.daily.uploaded || 0) + n; });
      if (!u.ok) note = note || `upload failed: ${u.short}`;
    } else note = note || "not sent yet: your site didn't answer; the next run sends them";
  }
  await persistQueue(st, rq, rating);
  st.lastRate = { t: t0, seconds: Math.round((Date.now() - t0) / 1000), rated: run.rated, left: st.rateQueued, note };
  st.lock = null;
  await saveState(st);
  return { kind: 'ok', rated: run.rated };
}

async function rateGuarded() {
  if (running) return { kind: 'busy' };
  running = true;
  const stop = keepAlive();
  try {
    return await rateOnly();
  } catch (e) {
    const st = await loadState();
    st.lock = null;
    st.lastRate = { t: Date.now(), seconds: 0, rated: 0, note: `internal error: ${e && e.message}` };
    await saveState(st);
    return { kind: 'error', short: 'internal error' };
  } finally {
    stop();
    running = false;
    liveQueue = null;
    const st = await loadState();
    if (st.lock) { st.lock = null; await saveState(st); }
  }
}

// ---------------------------------------------------------------- schedule

export async function jobsTick() {
  const settings = await loadSettings();
  let st = await loadState();
  const now = Date.now();
  // A worker stopped mid-run can leave the finder's tab open: close it once the run's lock is gone.
  if (st.tab && !running && !(st.lock && st.lock.until > now)) { await closeTab(st); await saveState(st); }
  // Paused until every Groq key's hour is over: still paused, or back, and the sweep carries on.
  let carryOn = false;
  // (A run you started yourself resumes too, whatever the schedule switch says.)
  if (st.halted && st.halted.until && settings.token) {
    if (now < st.halted.until) {
      const a = await ext.alarms.get('jobs');
      if (!a || Math.abs(a.scheduledTime - (st.halted.until + 5000)) > 1000) await ext.alarms.create('jobs', { when: st.halted.until + 5000 });
      return;
    }
    st.halted = null;
    st.plan = null;
    await saveState(st);
    carryOn = true;
  }
  if (carryOn && !running && !(st.lock && st.lock.until > now)) {
    // The sweep isn't over: it carries on (and rates as it goes); otherwise only the waiting jobs are rated.
    if (st.sweep && !st.sweep.done) await runGuarded('keys are back');
    else await rateGuarded();
    st = await loadState();
    if (st.halted) return; // out again: paused again, with its own wake-up
  }
  if (!settings.enabled || st.halted || !settings.token) {
    if (st.plan) { st.plan = null; await saveState(st); }
    await ext.alarms.clear('jobs');
    return;
  }

  if (!st.plan) {
    st.plan = nextFinderRun(now, st.lastSlot);
    await saveState(st);
  }
  if (!st.plan) return;
  if (now < st.plan.at) {
    const a = await ext.alarms.get('jobs');
    if (!a || Math.abs(a.scheduledTime - st.plan.at) > 1000) await ext.alarms.create('jobs', { when: st.plan.at });
    return;
  }
  if (running || (st.lock && st.lock.until > now)) return;
  const plan = st.plan;
  // A run you started yourself in the last 45 minutes already covered this slot.
  const recent = st.lastRun && st.lastRun.outcome === 'ok' && now - st.lastRun.t < 45 * MIN;
  const r = recent ? { kind: 'skipped' } : await runGuarded('scheduled');
  if (r.kind === 'busy') return;
  st = await loadState();
  st.lastSlot = plan.slot;
  st.plan = st.halted ? null : nextFinderRun(Date.now(), st.lastSlot);
  await saveState(st);
  if (st.plan) await ext.alarms.create('jobs', { when: st.plan.at });
}

export async function jobsOnStartup() {
  const st = await loadState();
  st.tab = null; // tab ids from the last browser session mean nothing now
  st.lock = null;
  st.resting = null;
  await saveState(st);
}

// ---------------------------------------------------------------- popup and settings page

async function jobsStatus() {
  const settings = await loadSettings();
  const st = rollDay(await loadState(), Date.now());
  const access = await hasAccess();
  const dev = (await ext.storage.local.get('jobsDev')).jobsDev || {};
  const rating = await ratingSetup(settings, dev, st);
  const top = (o, n) => Object.entries(o || {}).sort((a, b) => b[1] - a[1]).slice(0, n);
  const sw = st.sweep;
  // How far the sweep through every search's pages has got.
  const sweep = sw ? {
    n: sw.n, started: sw.started, finished: sw.finished || null, done: !!sw.done, pages: sw.pages,
    searches: sw.size || Object.keys(sw.next || {}).length, over: Object.keys(sw.over || {}).length,
    at: Object.fromEntries(Object.entries(sw.next || {}).filter(([k]) => !(sw.over || {})[k])),
  } : null;
  return {
    settings: {
      enabled: settings.enabled, hasToken: !!settings.token, extraSkills: settings.extraSkills, scope: settings.scope,
      pairedAt: settings.pairedAt, viaSite: PAIR_TOKEN.test(settings.token), minScore: settings.minScore,
    },
    access, running: running || !!(st.lock && st.lock.until > Date.now()),
    day: st.day, daily: st.daily, plan: st.plan || null, halted: st.halted || null,
    lastRun: st.lastRun || null, runs: st.runs, pending: st.pending.length, queued: st.queue.length, sweep,
    resting: st.resting && st.resting.until > Date.now() ? st.resting : null, startedOver: st.startedOver || null, removing: st.unsend.length,
    judged: Object.keys(st.seen).length,
    reasons: top(st.reasons, 24), unknown: top(st.unknown, 15), sample: st.sample || null, jdSample: st.jdSample || null,
    searches: searchesFor(settings.scope).map((s) => s.k), allSearches: SEARCHES.map((s) => ({ k: s.k, profile: s.profile })),
    rules: RULES, limits: FINDER_LIMITS, profiles: PROFILES,
    skillCount: mySkills(extraList(settings)).size, resumeSkills: JOB_PROFILE.skills.length, skillsGenerated: JOB_PROFILE.generated,
    // The AI rating. Never a key itself: only the last 4 characters of each.
    rating: {
      on: rating.on, why: rating.why, keys: settings.groqKeys.map(keyHint), model: settings.rateModel, defaultModel: RATE.model,
      calls: settings.rateCalls, access: rating.access,
      resumes: rating.resumes ? { sde: rating.resumes.sde.length, genai: rating.resumes.genai.length, generated: rating.resumes.generated, from: rating.resumes.from } : null,
      today: (st.daily && st.daily.rate) || null, stop: st.rateStop || null, last: st.lastRate || null,
      queued: liveQueue ? liveQueue.length : st.rateQueued || 0, ratedKept: Object.keys(st.rated).length,
    },
    rate: RATE,
    lowPay: { names: settings.lowPay || [...LOW_PAY_COMPANIES], custom: !!settings.lowPay },
  };
}

/** Your site's page asks, through site-bridge.js: is there a finder here, and does it need a token? */
async function jobsBridgeHello() {
  const s = await loadSettings();
  const st = await loadState();
  const rejected = !!(st.halted && st.halted.short === 'site token rejected');
  return { version: ext.runtime.getManifest().version, scope: s.scope, enabled: s.enabled, needsToken: !s.token || rejected };
}

/**
 * Your site's page, signed in as you, hands over the finder's token (through site-bridge.js).
 * Kept only if your site accepts it; a token it rejects leaves the current one in place.
 */
async function jobsPair({ token }) {
  const t = typeof token === 'string' ? token.trim() : '';
  if (!PAIR_TOKEN.test(t)) return { ok: false, short: 'not a finder token' };
  const access = await hasAccess();
  if (!access.site) return { ok: false, short: 'no access to your site yet (press Allow access in the popup)' };
  const c = await siteCheck(t);
  if (!c.ok && !c.transient) return { ok: false, short: c.short };
  const cur = await loadSettings();
  await ext.storage.local.set({ [S]: cleanSettings({ ...cur, token: t, pairedAt: Date.now() }) });
  const st = await loadState();
  st.siteOkDay = c.ok ? trackerDay(Date.now()) : null;
  if (st.halted && /token|site/.test(st.halted.short)) st.halted = null;
  await saveState(st);
  await jobsTick();
  return { ok: true, checked: c.ok, scope: cur.scope };
}

// What a content script (your site's page, through site-bridge.js) may ask; nothing else.
export const BRIDGE_TYPES = Object.freeze(['jobsBridgeHello', 'jobsPair']);

export const jobsHandlers = {
  jobsStatus,
  jobsBridgeHello,
  jobsPair,
  async jobsSave({ patch = {} }) {
    const cur = await loadSettings();
    const { pairedAt, ...allowed } = patch; // only a token from your site counts as paired
    if ('groqKeys' in allowed) {
      const typed = splitKeys(allowed.groqKeys);
      const bad = typed.filter((k) => !KEY_SHAPE.test(k)).length;
      if (bad) return { ...(await jobsStatus()), error: `${bad} of those ${bad === 1 ? "doesn't" : "don't"} look like a Groq API key (one word each, like gsk_…); nothing saved` };
      if (typed.length > RATE.maxKeys) return { ...(await jobsStatus()), error: `at most ${RATE.maxKeys} keys; nothing saved` };
    }
    const next = cleanSettings({ ...cur, ...allowed, ...('token' in allowed ? { pairedAt: null } : {}) });
    await ext.storage.local.set({ [S]: next });
    // New keys, model or daily cap: whatever stopped the rating may be fixed now.
    if (next.groqKeys.join() !== cur.groqKeys.join() || next.rateModel !== cur.rateModel || next.rateCalls !== cur.rateCalls) {
      const st = await loadState();
      if (st.rateStop) { st.rateStop = null; await saveState(st); }
    }
    if ('token' in patch) {
      const st = await loadState();
      st.siteOkDay = null; // re-check the site with the new token
      if (st.halted && /token|site/.test(st.halted.short)) st.halted = null;
      await saveState(st);
    }
    if ('enabled' in patch && next.enabled) {
      const st = await loadState();
      st.halted = null;
      await saveState(st);
    }
    await jobsTick();
    return jobsStatus();
  },
  async jobsNow() {
    if (running) return { result: { kind: 'busy' }, status: await jobsStatus() };
    const st = await loadState();
    if (st.halted) return { result: { kind: 'halted', short: st.halted.short }, status: await jobsStatus() };
    runGuarded('manual'); // takes minutes: the popup follows it through jobsStatus
    await sleep(300);
    return { result: { kind: 'started' }, status: await jobsStatus() };
  },
  // The report page: every listing judged (3 days) and, for one kept job, its JD and its rating's prompt and answer.
  async jobsAudit() {
    const list = await auditEntries();
    const st = await loadState();
    return { entries: list, day: st.day, sweep: st.sweep || null, daily: st.daily || {} };
  },
  async jobsAuditDoc(msg) {
    return { doc: await auditDocOf(String(msg && msg.id)) };
  },
  // Wakes the finder as its alarm would (a timed pause is over); returns at once.
  async jobsTickNow() {
    jobsTick().catch(() => {});
    await sleep(300);
    return jobsStatus();
  },
  /**
   * "Unlock": a run that died (the worker was stopped, the extension reloaded) leaves its lock for up
   * to 90 minutes, and the page says "Running now…" with every button off. This clears the lock and
   * closes the finder's tab. Refused while this worker really is in a run.
   */
  async jobsUnlock() {
    if (running) return { result: { kind: 'busy' }, status: await jobsStatus() };
    const st = await loadState();
    await closeTab(st);
    st.lock = null;
    st.resting = null;
    await saveState(st);
    return { result: { kind: 'unlocked' }, status: await jobsStatus() };
  },
  // Test only (needs the jobsDev switch): closes the finder's tab, as you might mid-run.
  async jobsDevCloseTab() {
    const dev = (await ext.storage.local.get('jobsDev')).jobsDev;
    const st = await loadState();
    if (!dev || !st.tab) return { closed: false };
    try { await ext.tabs.remove(st.tab.tabId); } catch { return { closed: false }; }
    return { closed: true };
  },
  async jobsResume() {
    const st = await loadState();
    st.halted = null;
    unretireKeys(st);
    st.siteOkDay = null;
    st.plan = null;
    await saveState(st);
    await jobsTick();
    return jobsStatus();
  },
  async jobsTest() {
    const s = await loadSettings();
    if (!s.token) return { ok: false, short: 'no token yet' };
    const access = await hasAccess();
    if (!access.site) return { ok: false, short: 'no access to your site yet' };
    return siteCheck(s.token);
  },
  // What xAI says about the saved key (never the key itself), and whether it has the model.
  async jobsKeyCheck() {
    const s = await loadSettings();
    return checkKeys(s.groqKeys, s.rateModel);
  },
  /**
   * "Start over": your site deletes every job the finder put there (both lists); this browser forgets
   * what it read and starts a fresh sweep of the last 48 hours right away, stretch after stretch
   * until every listing is read. Your other browser starts over at its next run (it sees the time).
   */
  async jobsStartOver() {
    const settings = await loadSettings();
    const st0 = await loadState();
    const access = await hasAccess();
    const no = (short) => ({ result: { kind: 'error', short } });
    if (running || (st0.lock && st0.lock.until > Date.now())) return { result: { kind: 'busy' }, status: await jobsStatus() };
    if (!access.naukri || !access.site) return { ...no('needs access to naukri.com and your site (popup → Allow access)'), status: await jobsStatus() };
    if (!settings.token) return { ...no('not connected to your site yet'), status: await jobsStatus() };
    if (st0.halted) return { ...no(`paused (${st0.halted.short}): press Resume first`), status: await jobsStatus() };
    const r = await siteReset(settings.token);
    if (!r.ok) return { ...no(r.short), status: await jobsStatus() };
    const st = rollDay(await loadState(), Date.now());
    freshStart(st, r.resetAt, { ratings: true });
    await auditClear(); // the report starts fresh with it
    await saveState(st);
    await saveQueue([]);
    runGuarded('start over'); // takes a while: the settings page follows it through jobsStatus
    await sleep(300);
    return { result: { kind: 'started', deleted: r.deleted }, status: await jobsStatus() };
  },
  async jobsRateNow() {
    const st = await loadState();
    if (running || (st.lock && st.lock.until > Date.now())) return { result: { kind: 'busy' }, status: await jobsStatus() };
    rateGuarded(); // takes minutes: the settings page follows it through jobsStatus
    await sleep(300);
    return { result: { kind: 'started' }, status: await jobsStatus() };
  },
  async jobsRescan() {
    // Forget today's verdicts (the site keeps what it already has): the next run re-reads everything,
    // from every search's first page.
    const st = await loadState();
    st.sweep = null;
    st.seen = {};
    st.reasons = {};
    st.unknown = {};
    st.queue = [];
    st.onSite = rememberOnSite(st); // what those verdicts put on your site, so it can come off if they change
    st.memo = {}; // and the JDs it read: new skills or a new bar can change their verdicts
    st.daily = { ...st.daily, read: 0, kept: { backend: 0, ai: 0 } };
    await saveState(st);
    return jobsStatus();
  },
};
