// Naukri job finder: the background part (rules are in jobs-lib.js).
//
// A few times a day it opens Naukri's own job search pages in a muted background tab, one after
// another, and reads the results the page itself loaded (capture.js keeps a copy of the page's
// search response; the result cards are the fallback). For each card that looks right it then
// opens that job's own page and reads its JD the same way (the page's job-details response, or
// the page itself), and keeps the job only if the JD's technologies match yours. It never clicks
// anything, never applies, and makes no Naukri request of its own. Kept jobs are sent to your
// site's /api/radar, where the Openings tab lists them, best first, one list per Naukri account.
//
// Safety: one run at a time, a few seconds between pages, page caps per run and per day, and it
// pauses (and tells you) the moment Naukri shows a check, a login page or an error, instead of
// retrying. Nothing is uploaded until your site says it knows the job finder.
//
// Two Naukri accounts in two browsers: each browser can search for its own account's list only
// (settings: "Searches for"), so each account reads half the pages. The site token arrives by
// itself: open your site's Job tracker in this browser, signed in, and the page hands the
// extension the finder's own token (site-bridge.js). Pasting a token still works too.

import { NAUKRI_ORIGIN, NAUKRI_MATCH, MIN } from './lib.js';
import {
  RADAR_API_URL, RADAR_API_MATCH, SEARCHES, FINDER_LIMITS, RULES, PROFILES, SCOPES, searchUrl, searchesFor, trackerDay,
  nextFinderRun, cardCheck, jdCheck, cardOnly, mySkills, toOpening, normalizeJob, htmlToText,
} from './jobs-lib.js';
import { JOB_PROFILE } from './job-profile.js';

const ext = globalThis.browser ?? globalThis.chrome;
const S = 'jobsSettings';
const K = 'jobs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (lo, hi) => Math.round(lo + Math.random() * (hi - lo));
// The token your site hands over (api/radar.mjs finderToken).
const PAIR_TOKEN = /^nrf1\.[A-Za-z0-9_-]{20,100}$/;

function cleanSettings(s = {}) {
  const [lo, hi] = RULES.minScoreRange;
  const bar = Number(s.minScore);
  return {
    enabled: s.enabled === true,
    token: typeof s.token === 'string' ? s.token.trim().slice(0, 300) : '',
    extraSkills: typeof s.extraSkills === 'string' ? s.extraSkills.slice(0, 500) : '',
    scope: SCOPES.includes(s.scope) ? s.scope : 'both',
    pairedAt: typeof s.pairedAt === 'number' ? s.pairedAt : null, // when your site last handed over the token
    minScore: bar >= lo && bar <= hi ? Math.round(bar * 100) / 100 : RULES.minScore, // the JD match bar
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
async function loadSettings() { return cleanSettings((await ext.storage.local.get(S))[S]); }
async function loadState() {
  const st = (await ext.storage.local.get(K))[K] || {};
  st.seen = st.seen && typeof st.seen === 'object' ? st.seen : {};
  st.daily = st.daily || {};
  st.runs = Array.isArray(st.runs) ? st.runs : [];
  st.pending = Array.isArray(st.pending) ? st.pending : [];
  st.queue = Array.isArray(st.queue) ? st.queue : []; // cards whose job pages a run didn't get to
  st.reasons = st.reasons && typeof st.reasons === 'object' ? st.reasons : {};
  st.unknown = st.unknown && typeof st.unknown === 'object' ? st.unknown : {};
  return st;
}

/** Record how a run ended (shown in the popup and the settings page). */
function noteRun(st, run) {
  run.seconds = Math.round((Date.now() - run.t) / 1000);
  st.lastRun = run;
  st.runs = [run, ...st.runs].slice(0, 12);
}
const saveState = (st) => ext.storage.local.set({ [K]: st });

/** A new day (4am IST) starts fresh lists. */
function rollDay(st, now) {
  const day = trackerDay(now);
  if (st.day === day) return st;
  return {
    ...st, day, seen: {}, pending: [], queue: [], unknown: {}, reasons: {},
    daily: { runs: 0, pages: 0, jds: 0, read: 0, kept: { backend: 0, ai: 0 }, uploaded: 0 },
  };
}

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
    for (let i = caps.length - 1; i >= 0 && !out.jd; i--) {
      const c = caps[i];
      if (!c || !/\/job\//.test(c.url)) continue;
      if (c.status >= 400 && out.status == null) out.status = c.status;
      const d = c.json && pick(c.json, 0);
      if (d) { out.via = 'api'; out.status = c.status; out.jd = d.description; out.skills = skillsOf(d); }
    }
    if (!out.jd) {
      for (const name of ['_initialState', '__INITIAL_STATE__', 'initialState', '__NEXT_DATA__', '__APP_STATE__']) {
        let d = null;
        try { d = pick(window[name], 0); } catch { d = null; }
        if (d) { out.via = 'state'; out.jd = d.description; out.skills = skillsOf(d); break; }
      }
    }
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
  await ext.tabs.update(tabId, { url });
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

function keepAlive() {
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

async function upload(token, openings, summary) {
  try {
    const res = await fetch(RADAR_API_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ finder: 'naukri', summary, openings, remove: [] }),
    });
    const j = await res.json().catch(() => null);
    if (res.ok && j && j.finder === true) return { ok: true, created: j.created || 0, updated: j.updated || 0 };
    if (res.status === 401) return { ok: false, short: 'site token rejected' };
    return { ok: false, transient: res.status >= 500 || res.status === 429, short: `site HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, transient: true, short: 'site unreachable', msg: e && e.message };
  }
}

async function halt(st, short, msg) {
  st.halted = { short, msg, t: Date.now() };
  st.plan = null;
  await saveState(st);
  await ext.alarms.clear('jobs');
  notify('nr-jobs', 'Job finder paused', `${msg}.`);
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
  const { minScore } = settings;
  const run = { t: started, trigger, scope: settings.scope, pages: 0, jds: 0, read: 0, kept: 0, fresh: 0, uploaded: 0, outcome: 'ok', note: '' };
  const kept = st.daily.kept || (st.daily.kept = { backend: 0, ai: 0 });
  let outcome = null;
  let prevHref = null;
  let jdFails = 0;
  let jdOff = false; // stopped opening job pages this run: it couldn't read them
  const budget = () => run.pages < FINDER_LIMITS.pagesPerRun && (st.daily.pages || 0) < FINDER_LIMITS.pagesPerDay
    && Date.now() - started < FINDER_LIMITS.runMinutes * MIN;
  const jdBudget = () => budget() && (st.daily.jds || 0) < FINDER_LIMITS.jdPerDay;
  const tab = async () => {
    if (!st.tab) { st.tab = await openTab('about:blank'); await saveState(st); }
    return st.tab.tabId;
  };

  // A decision on one job, recorded.
  const record = (id, v) => {
    if (!v.keep) {
      st.seen[id] = { k: 0, w: v.why };
      st.reasons[v.why] = (st.reasons[v.why] || 0) + 1;
      return;
    }
    if ((kept[v.profile] || 0) >= FINDER_LIMITS.perListDay) { st.seen[id] = { k: 0, w: 'daily cap' }; return; }
    kept[v.profile] = (kept[v.profile] || 0) + 1;
    st.seen[id] = { k: 1, r: v.rank, p: v.profile, s: v.skills.score };
    st.pending.push(toOpening(v, Date.now()));
    run.kept += 1;
  };

  // Open one card's job page, read its JD, decide. False when the run has to stop.
  const openJd = async (card) => {
    const id = card.job.id;
    if (jdOff) { record(id, cardOnly(card, { now: Date.now(), minScore })); return true; }
    const tabId = await tab();
    await pause();
    const r = await loadJob(tabId, card.job.url, prevHref);
    if (r && r.href) prevHref = r.href;
    run.pages += 1;
    run.jds += 1;
    st.daily.pages = (st.daily.pages || 0) + 1;
    st.daily.jds = (st.daily.jds || 0) + 1;
    if (r.gone) { st.tab = null; run.note = 'the finder tab was closed'; st.queue.unshift(card); return false; }
    if (r.offsite || r.loginWall) { outcome = LOGIN; st.queue.unshift(card); return false; }
    if (!r.jd && (r.captcha || [403, 406, 429].includes(r.status))) { outcome = CHECK(r); st.queue.unshift(card); return false; }
    const now = Date.now();
    if (r.closed) { record(id, { keep: false, why: 'job closed' }); return true; }
    if (r.jd) {
      jdFails = 0;
      const text = htmlToText(r.jd);
      if (!st.jdSample || st.jdSample.reader || now - st.jdSample.t > 6 * 3600_000) {
        st.jdSample = { t: now, url: card.job.url, via: r.via, chars: text.length, keySkills: r.skills.slice(0, 20), start: text.slice(0, 600) };
      }
      record(id, jdCheck(card, { text, skills: r.skills }, { now, mine: skills, minScore }));
    } else {
      jdFails += 1;
      st.jdSample = { t: now, url: card.job.url, reader: { ...r, jd: undefined } };
      if (jdFails >= FINDER_LIMITS.jdFailStop) { jdOff = true; run.note = "couldn't read job pages; judged the rest by their cards"; }
      record(id, cardOnly(card, { now, minScore }));
    }
    return true;
  };

  // Job pages waiting to be read, best card first. False when the run has to stop.
  const readQueue = async () => {
    st.queue = st.queue.filter((c) => c && c.day === st.day && c.job).sort((a, b) => b.cardRank - a.cardRank);
    while (st.queue.length) {
      if (!jdOff && !jdBudget()) return true; // the rest wait for the next run
      const ok = await openJd(st.queue.shift());
      await saveState(st);
      if (!ok) return false;
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

    const firstToday = !(st.daily.runs > 0);
    let unreadable = 0;
    // Job pages an earlier run didn't get to come first.
    if (await readQueue()) {
      outer: for (const s of searches) {
        if ((kept[s.profile] || 0) >= RULES.dailyTarget) continue; // this list has its 100 for today
        const maxPages = firstToday ? s.pages : Math.min(s.pages, 2);
        for (let page = 1; page <= maxPages; page++) {
          if (!budget() || (!jdOff && !jdBudget())) { run.note = run.note || 'page cap reached'; break outer; }
          const url = searchUrl(s.k, page);
          const r = await loadSearch(await tab(), url, prevHref);
          if (r && r.href) prevHref = r.href;
          run.pages += 1;
          st.daily.pages = (st.daily.pages || 0) + 1;
          if (r.gone) { st.tab = null; run.note = 'the finder tab was closed'; break outer; }
          if (r.offsite || r.loginWall) { outcome = LOGIN; break outer; }
          const jobs = Array.isArray(r.jobs) ? r.jobs : [];
          if (!jobs.length && (r.captcha || [403, 406, 429].includes(r.status))) { outcome = CHECK(r); break outer; }
          if (!jobs.length) {
            if (r.empty || (r.via === 'api' && r.status === 200)) break; // no (more) results for this search
            unreadable += 1;
            st.sample = { t: Date.now(), url, reader: { ...r, jobs: undefined } };
            if (unreadable >= 3) {
              outcome = { short: 'could not read Naukri results', msg: "Naukri's search page didn't show results the finder can read (3 pages in a row). It may have changed; see the finder settings' last-page details" };
              break outer;
            }
            continue;
          }
          unreadable = 0;
          if (!st.sample || st.sample.reader || Date.now() - st.sample.t > 6 * 3600_000) {
            st.sample = { t: Date.now(), url, via: r.via, total: r.total, first: jobs[0] };
          }

          // The cards: what looks right waits for its job page to be read.
          let fresh = 0;
          const now = Date.now();
          for (const raw of jobs) {
            const id = normalizeJob(raw || {}).id;
            if (!id || st.seen[id]) continue;
            fresh += 1;
            run.read += 1;
            st.daily.read = (st.daily.read || 0) + 1;
            const c = cardCheck(raw, { now, mine: skills, minScore });
            for (const u of (c.chips && c.chips.unknown) || []) st.unknown[u] = (st.unknown[u] || 0) + 1;
            if (!c.keep) { record(id, c); continue; }
            st.seen[id] = { k: 2 }; // its job page is next
            st.queue.push(c);
          }
          run.fresh += fresh;
          await saveState(st); // progress survives a stopped worker
          if (!(await readQueue())) break outer;
          // Next page only while this one was full and still turning up new listings.
          if (jobs.length < 20 || fresh < 3) break;
          await pause();
        }
        await pause();
      }
    }
  } finally {
    await closeTab(st);
  }

  // Send what was kept (also anything a failed upload left behind).
  if (st.pending.length) {
    const summary = {
      ranAt: new Date(started).toISOString(), seconds: Math.round((Date.now() - started) / 1000), trigger,
      pages: run.pages, jds: run.jds, read: run.read, kept: run.kept, day: st.day, scope: settings.scope, browser: browserName(),
      keptToday: st.daily.kept, minScore, version: ext.runtime.getManifest().version,
    };
    while (st.pending.length) {
      const batch = st.pending.slice(0, FINDER_LIMITS.uploadMax);
      const u = await upload(settings.token, batch, summary);
      if (!u.ok) {
        run.note = `upload failed: ${u.short}`;
        if (!u.transient) outcome = outcome || { short: u.short, msg: `your site refused the upload (${u.short})` };
        break;
      }
      st.pending = st.pending.slice(batch.length);
      run.uploaded += batch.length;
      st.daily.uploaded = (st.daily.uploaded || 0) + batch.length;
    }
  }

  st.daily.runs = (st.daily.runs || 0) + 1;
  if (outcome) { run.outcome = 'paused'; run.note = outcome.short; }
  noteRun(st, run);
  st.lock = null;
  if (outcome) {
    await halt(st, outcome.short, outcome.msg);
    return { kind: 'halted', ...outcome };
  }
  await saveState(st);
  return { kind: 'ok', ...run };
}

async function runGuarded(trigger) {
  if (running) return { kind: 'busy' };
  running = true;
  const stop = keepAlive();
  try {
    return await findJobs(trigger);
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
  await saveState(st);
}

// ---------------------------------------------------------------- popup and settings page

async function jobsStatus() {
  const settings = await loadSettings();
  const st = rollDay(await loadState(), Date.now());
  const access = await hasAccess();
  const top = (o, n) => Object.entries(o || {}).sort((a, b) => b[1] - a[1]).slice(0, n);
  return {
    settings: {
      enabled: settings.enabled, hasToken: !!settings.token, extraSkills: settings.extraSkills, scope: settings.scope,
      pairedAt: settings.pairedAt, viaSite: PAIR_TOKEN.test(settings.token), minScore: settings.minScore,
    },
    access, running: running || !!(st.lock && st.lock.until > Date.now()),
    day: st.day, daily: st.daily, plan: st.plan || null, halted: st.halted || null,
    lastRun: st.lastRun || null, runs: st.runs, pending: st.pending.length, queued: st.queue.length,
    reasons: top(st.reasons, 14), unknown: top(st.unknown, 15), sample: st.sample || null, jdSample: st.jdSample || null,
    searches: searchesFor(settings.scope).map((s) => s.k), allSearches: SEARCHES.map((s) => ({ k: s.k, profile: s.profile })),
    rules: RULES, profiles: PROFILES,
    skillCount: mySkills(extraList(settings)).size, resumeSkills: JOB_PROFILE.skills.length, skillsGenerated: JOB_PROFILE.generated,
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
    const next = cleanSettings({ ...cur, ...allowed, ...('token' in allowed ? { pairedAt: null } : {}) });
    await ext.storage.local.set({ [S]: next });
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
  async jobsResume() {
    const st = await loadState();
    st.halted = null;
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
  async jobsRescan() {
    // Forget today's verdicts (the site keeps what it already has): the next run re-reads everything.
    const st = await loadState();
    st.seen = {};
    st.reasons = {};
    st.unknown = {};
    st.queue = [];
    st.daily = { ...st.daily, read: 0, kept: { backend: 0, ai: 0 } };
    await saveState(st);
    return jobsStatus();
  },
};
