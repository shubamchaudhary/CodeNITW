// Instahyre auto-apply: two buttons (Java backend, GenAI). Each opens your saved Instahyre search (its
// filters are in the link: skills and years) in a visible tab and goes through the list one job at a
// time: open it, read it, apply, pause a few seconds, next; until the list is finished or a stop
// condition (cap, a login or check, Instahyre asking for something more, you pressing Stop).
//
// What it won't apply to (skip rules, on by default): IT-services and consulting firms (the same
// list as the job finder), titles that aren't software engineering work (QA, support, frontend-only,
// lead or senior roles…), and jobs asking for 3 or more years (from the experience badge or the job
// description). A skipped job is left alone: it is never marked "Not interested".
//
// The page is read by its visible text, not its class names (instahyre-page.js). Not tested against
// the real site: "Dry run" opens and reads every job and says what it would do, but clicks no Apply.
// It runs from the background worker, one small step at a time, so a stopped worker just ends it.

import { trackerDay, lowPayList, LOW_PAY_COMPANIES } from './jobs-lib.js';
import { judge, yearsAsked, INSTA_ORIGIN, INSTA_DEFAULTS, cleanCfg } from './instahyre-rules.js';
import { pageObserve, pageOpen, pageApply, pageClose, pageMore } from './instahyre-page.js';
import { loadSettings as loadFinderSettings, keepAlive } from './jobs.js';

export { judge, yearsAsked, INSTA_ORIGIN, INSTA_DEFAULTS, cleanCfg };
const ext = globalThis.browser ?? globalThis.chrome;
const SK = 'instaState';
const CK = 'instaCfg';
export const INSTA_MATCH = `${INSTA_ORIGIN}/*`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (lo, hi) => Math.round(lo + Math.random() * (hi - lo));

async function loadCfg() { return cleanCfg((await ext.storage.local.get(CK))[CK]); }

// ---------------------------------------------------------------- state

const LOG_MAX = 300;
async function loadState() {
  const st = (await ext.storage.local.get(SK))[SK] || {};
  return { running: false, kind: null, tabId: null, started: 0, applied: 0, skipped: 0, seen: 0, note: '', ended: 0, dry: false, day: null, dayApplied: 0, log: [], ...st };
}
const saveState = (st) => ext.storage.local.set({ [SK]: st });

let running = false;
let stopFlag = false;

/** A step in the page: scripting.executeScript with a function; the page's answer or throws "gone". */
async function exec(tabId, func, ...args) {
  try {
    const r = await ext.scripting.executeScript({ target: { tabId }, func, args });
    return (r && r[0] && r[0].result) || null;
  } catch (e) {
    if (/no tab|tab.*(?:closed|id)|cannot access|frame.*(?:removed|detached)/i.test(String(e && e.message))) throw Object.assign(new Error('gone'), { gone: true });
    return null; // a page still loading: the caller looks again
  }
}

async function until(tabId, pred, ms, step = 700, ignoreStop = false) {
  const end = Date.now() + ms;
  let o = null;
  while (Date.now() < end && (ignoreStop || !stopFlag)) {
    o = await exec(tabId, pageObserve);
    if (o && pred(o)) return o;
    await sleep(step);
  }
  return o && pred(o) ? o : null;
}

const note = (st, e) => {
  st.log.push({ t: Date.now(), ...e });
  if (st.log.length > LOG_MAX) st.log.splice(0, st.log.length - LOG_MAX);
};

// ---------------------------------------------------------------- the run

async function runInsta(kind) {
  const cfg = await loadCfg();
  const finder = await loadFinderSettings();
  const lowPay = lowPayList(finder.lowPay || LOW_PAY_COMPANIES);
  const st = await loadState();
  const today = trackerDay(Date.now());
  if (st.day !== today) { st.day = today; st.dayApplied = 0; }
  Object.assign(st, { running: true, kind, tabId: null, started: Date.now(), ended: 0, applied: 0, skipped: 0, seen: 0, note: '', dry: cfg.dry });
  await saveState(st);
  const stopKeep = keepAlive();
  const end = (why) => { st.note = why; };
  try {
    const url = kind === 'ai' ? cfg.urlAi : cfg.urlJava;
    const tab = await ext.tabs.create({ url, active: true });
    st.tabId = tab.id;
    await saveState(st);
    const left = new Set(); // cards left alone this run
    let passApplied = 0;
    let passes = 0;
    let stuck = 0;
    let moreAt = -1;
    while (!stopFlag) {
      const o = await until(st.tabId, (x) => x.cards.length || x.login || x.limit || x.captcha || x.modal || x.empty, 45_000);
      if (o && o.empty && !o.cards.length && !o.modal) {
        // Instahyre shows nothing: the list is used up, or it didn't understand the link.
        end(st.applied + st.skipped > 0
          ? `Done: the list is finished (${st.applied} applied, ${st.skipped} skipped).`
          : 'Instahyre shows "No matching opportunities" for this link. On Instahyre set the search you want (skills and experience), copy the link from the address bar and paste it in the Details page, then start again.');
        break;
      }
      if (!o) { end(stopFlag ? 'Stopped.' : 'The list did not show up (Instahyre may have changed, or the link is wrong): check the tab.'); break; }
      if (o.login) { end('Instahyre wants you to log in: log in in that tab, then start again.'); break; }
      if (o.captcha) { end('Instahyre asked for a check: do it in that tab, then start again.'); break; }
      if (o.limit) { end('Instahyre says the apply limit is reached.'); break; }
      if (o.modal) { await exec(st.tabId, pageClose); await sleep(900); if (++stuck > 4) { end('A job stays open and will not close: check the tab.'); break; } continue; }
      stuck = 0;
      const next = o.cards.findIndex((c) => !left.has(c.key));
      if (next < 0) {
        // "Load more", unless pressing it last time showed nothing new.
        if (o.more && o.cards.length !== moreAt && passes < 60) { moreAt = o.cards.length; passes += 1; await exec(st.tabId, pageMore); await sleep(2500); continue; }
        if (passApplied > 0 && passes < 60) { passes += 1; passApplied = 0; moreAt = -1; await ext.tabs.update(st.tabId, { url }); await sleep(2500); continue; } // applied ones leave the list: look again
        end(`Done: the list is finished (${st.applied} applied, ${st.skipped} skipped).`);
        break;
      }
      if (st.applied >= cfg.maxRun) { end(`Stopped at your cap of ${cfg.maxRun} applications for one run.`); break; }
      if (st.dayApplied >= cfg.maxDay) { end(`Stopped at your cap of ${cfg.maxDay} applications for today.`); break; }

      const card = o.cards[next];
      st.seen += 1;
      await exec(st.tabId, pageOpen, next);
      const m = await until(st.tabId, (x) => !!x.modal, 9000);
      if (!m) {
        left.add(card.key);
        st.skipped += 1;
        note(st, { title: card.title, company: card.company, action: 'skipped', why: "the job didn't open" });
        if (++stuck > 4) { end("Jobs aren't opening: check the tab."); break; }
        continue;
      }
      stuck = 0;
      const j = judge({ company: card.company, title: card.title, text: m.modal.text }, { lowPay, skipRules: cfg.skipRules });
      const base = { title: card.title, company: card.company, yrs: yearsAsked(m.modal.text) };
      if (!j.apply || cfg.dry) {
        await exec(st.tabId, pageClose); // not applying: close the job again
        left.add(card.key);
        st.skipped += 1;
        note(st, { ...base, action: j.apply ? 'dry' : 'skipped', why: j.apply ? 'would apply (dry run)' : j.why });
      } else {
        await exec(st.tabId, pageApply);
        // (Not cut short by Stop: an Apply already pressed is seen through.)
        const after = await until(st.tabId, (x) => !x.modal || x.modal.applied || x.limit || x.captcha, 9000, 500, true);
        if (after && after.limit && after.modal && after.modal.hasApply) {
          note(st, { ...base, action: 'stopped', why: 'the apply limit is reached' });
          end('Instahyre says the apply limit is reached.');
          await exec(st.tabId, pageClose);
          break;
        }
        if (after && after.captcha) { end('Instahyre asked for a check: do it in that tab, then start again.'); break; }
        if (!after || (after.modal && after.modal.hasApply)) {
          // Still open with its Apply button: a question or something more. Leave it for you.
          note(st, { ...base, action: 'stopped', why: 'Instahyre wanted more than a click' });
          end(`Instahyre wanted more than a click for "${card.title}": finish that one by hand in the tab, then start again.`);
          break;
        }
        st.applied += 1;
        st.dayApplied += 1;
        passApplied += 1;
        note(st, { ...base, action: 'applied', why: '' });
      }
      await saveState(st);
      if (stopFlag) break;
      if (!(await until(st.tabId, (x) => !x.modal, 4000))) await exec(st.tabId, pageClose);
      await sleep(rand(cfg.pauseMin, Math.max(cfg.pauseMin, cfg.pauseMax)));
    }
    if (stopFlag && !st.note) end('Stopped.');
  } catch (e) {
    end(e && e.gone ? 'You closed the Instahyre tab: stopped.' : `Stopped by an error: ${e && e.message}`);
  } finally {
    stopKeep();
    st.running = false;
    st.ended = Date.now();
    running = false;
    stopFlag = false;
    await saveState(st);
  }
}

// ---------------------------------------------------------------- what the pages and the popup ask

const hasAccess = () => ext.permissions.contains({ origins: [INSTA_MATCH] }).catch(() => false);

async function status() {
  const st = await loadState();
  const cfg = await loadCfg();
  const live = running;
  // A worker that died mid-run leaves "running": it isn't, unless this worker is in the loop.
  if (st.running && !live) { st.running = false; st.note = st.note || 'The run was interrupted (the extension restarted).'; await saveState(st); }
  return { state: st, cfg, access: await hasAccess(), defaults: INSTA_DEFAULTS };
}

export const instaHandlers = {
  async instaStatus() { return status(); },
  async instaStart(msg) {
    const kind = msg && msg.kind === 'ai' ? 'ai' : 'java';
    if (running) return { result: { kind: 'busy' }, ...(await status()) };
    if (!(await hasAccess())) return { result: { kind: 'error', short: 'no access to instahyre.com yet (allow it when asked)' }, ...(await status()) };
    running = true;
    stopFlag = false;
    runInsta(kind).catch(async (e) => {
      const st = await loadState();
      st.running = false;
      st.note = `Stopped by an error: ${e && e.message}`;
      await saveState(st);
      running = false;
    });
    await sleep(300);
    return { result: { kind: 'started' }, ...(await status()) };
  },
  async instaStop() {
    stopFlag = true;
    return { result: { kind: 'stopping' }, ...(await status()) };
  },
  async instaSave(msg) {
    const cur = await loadCfg();
    await ext.storage.local.set({ [CK]: cleanCfg({ ...cur, ...((msg && msg.patch) || {}) }) });
    return status();
  },
  async instaClearLog() {
    const st = await loadState();
    st.log = [];
    await saveState(st);
    return status();
  },
};
