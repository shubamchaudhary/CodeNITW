// Naukri Refresher: background worker (Chrome/Edge service worker, Firefox event page).
//
// How a refresh works: the two API calls (read profile, save headline) run *inside a
// naukri.com page* (MAIN world), so they are same-origin requests with the page's own
// cookies, identical to what the profile page sends. It uses a Naukri tab you already have
// open; if there is none (or it is asleep/logged out) it opens a muted background tab for a
// few seconds and closes it again.
//
// Robustness: all state lives in storage (survives worker restarts and browser restarts); a
// 1-minute watchdog alarm re-derives what to do, so a lost alarm or a killed worker can't stop
// the schedule; every attempt is recorded *before* it runs, so a crash can't cause a retry loop.

import {
  NAUKRI_ORIGIN, NAUKRI_MATCH, HOME_URL, LOGIN_URL, PROFILE_URL, SAVE_URL, API_HEADERS,
  MIN, HOUR, LIMITS, cleanSettings, settingsSig, dailyCapFor, nextRun, retryDelay, gate, nextHeadline,
  normalizeHeadline, extractProfile, lostFields, classifyStatus, describeFailure, istDayKey, fmtWhen,
  pruneHistory, changedTimestamp, shortReason,
} from './lib.js';
import { jobsTick, jobsHandlers, jobsOnStartup, BRIDGE_TYPES } from './jobs.js';
import { SITE_ORIGIN } from './jobs-lib.js';

const ext = globalThis.browser ?? globalThis.chrome;
const PLAN_V = 1;
const KEYS = ['settings', 'plan', 'lastSlot', 'halted', 'lastWriteAt', 'lastSuccessAt', 'day',
  'backoffUntil', 'account', 'memo', 'log', 'lock', 'ownTab', 'verifiedAt', 'backupMeta', 'history', 'headlineNow'];
// The profile backup itself ('backup') is stored separately and only read by backup.html.

// ---------------------------------------------------------------- storage & log

async function load() {
  const st = await ext.storage.local.get(KEYS);
  st.settings = cleanSettings(st.settings);
  st.log = Array.isArray(st.log) ? st.log : [];
  return st;
}
const put = (patch) => ext.storage.local.set(patch);

async function addLog(level, msg) {
  const { log } = await ext.storage.local.get('log');
  const list = Array.isArray(log) ? log : [];
  list.unshift({ t: Date.now(), level, msg: String(msg).slice(0, 300) });
  await put({ log: list.slice(0, 80) });
}

/** One line in the popup's day history (today + yesterday are kept). */
async function addEvent(e) {
  const now = Date.now();
  const { history } = await ext.storage.local.get('history');
  const list = pruneHistory(history, now);
  list.unshift({ t: now, ...e });
  await put({ history: list.slice(0, 200) });
}

// ---------------------------------------------------------------- alarms, badge, notifications

async function ensureWatchdog() {
  const a = await ext.alarms.get('tick');
  if (!a || !a.periodInMinutes) await ext.alarms.create('tick', { delayInMinutes: 1, periodInMinutes: 1 });
}

async function armDue(at) {
  const a = await ext.alarms.get('due');
  if (!a || Math.abs(a.scheduledTime - at) > 1000) await ext.alarms.create('due', { when: Math.max(at, Date.now() + 1000) });
}

async function badge(st, running = false) {
  st = st || (await load());
  let text = '';
  let color = '#f97316';
  let title = 'Naukri Refresher';
  if (running) {
    text = '…';
  } else if (st.halted) {
    text = '!';
    color = '#dc2626';
    title += ` — paused: ${st.halted.reason}`;
  } else if (!st.settings.enabled) {
    text = 'off';
    color = '#6b7280';
    title += ' — off';
  } else if (!st.verifiedAt) {
    text = '?';
    title += ' — open me and press "Refresh now" once to start';
  } else if (st.plan) {
    title += ` — next refresh ${fmtWhen(st.plan.at)} IST`;
  }
  try {
    await ext.action.setBadgeText({ text });
    await ext.action.setBadgeBackgroundColor({ color });
    await ext.action.setTitle({ title });
  } catch { /* badge is cosmetic */ }
}

function notify(id, title, message) {
  try {
    ext.notifications.create(id, {
      type: 'basic',
      iconUrl: ext.runtime.getURL('icons/icon128.png'),
      title,
      message,
    });
  } catch { /* notifications are best-effort */ }
}

// ---------------------------------------------------------------- keep the PC awake (Chrome/Edge)

const powerApi = !!(ext.power && ext.power.requestKeepAwake);
const keepAwakeWanted = (st) => powerApi && st.settings.keepAwake && st.settings.enabled && !st.halted && !!st.verifiedAt;

function syncKeepAwake(st) {
  // 'system' blocks idle sleep only: the screen still turns off, the user can still sleep the
  // PC manually, and the request ends when auto-refresh stops or the browser closes.
  if (!powerApi) return;
  try {
    if (keepAwakeWanted(st)) ext.power.requestKeepAwake('system');
    else ext.power.releaseKeepAwake();
  } catch { /* best-effort */ }
}

// ---------------------------------------------------------------- planning

function planValid(st) {
  const p = st.plan;
  return !!p && p.v === PLAN_V && p.sig === settingsSig(st.settings) && !(st.lastSlot && p.slot <= st.lastSlot);
}

async function replan(st, now = Date.now()) {
  const n = nextRun(now, st.settings, st.lastSlot);
  const plan = n ? { ...n, v: PLAN_V, sig: settingsSig(st.settings), attempts: 0 } : null;
  st.plan = plan;
  await put({ plan });
  if (plan) await armDue(plan.at);
  else await ext.alarms.clear('due');
  return plan;
}

async function finishSlot(st, plan, now) {
  st.lastSlot = plan.slot;
  await put({ lastSlot: plan.slot });
  await replan(st, now);
}

// ---------------------------------------------------------------- exclusivity

let running = false; // this worker instance
const lockHeld = (st, now) => !!(st.lock && st.lock.until > now);

function keepAlive() {
  // Chrome may stop an idle service worker after ~30 s; any extension API call resets that.
  const id = setInterval(() => { ext.runtime.getPlatformInfo().catch(() => {}); }, 20_000);
  return () => clearInterval(id);
}

const BUSY = Object.freeze({ kind: 'busy', msg: 'a refresh is already running' });

async function exclusive(fn) {
  if (running) return BUSY; // checked and set with no await in between: no double runs
  running = true;
  const stop = keepAlive();
  let acquired = false;
  try {
    const now = Date.now();
    if (lockHeld(await load(), now)) return BUSY; // another worker instance is mid-run
    await put({ lock: { until: now + LIMITS.lockTtlMin * MIN } });
    acquired = true;
    await badge(null, true);
    return await fn();
  } catch (e) {
    return { kind: 'transient', short: 'internal error', msg: `internal error: ${e && e.message}` };
  } finally {
    stop();
    running = false;
    if (acquired) {
      await put({ lock: null });
      await badge();
    }
  }
}

// ---------------------------------------------------------------- the refresh itself

// Runs inside the Naukri page (MAIN world). Must be self-contained: it is serialized.
async function inPageFetch(req) {
  const m = document.cookie.match(/(?:^|;\s*)nauk_at=([^;]+)/);
  const headers = Object.assign({}, req.headers);
  if (m) headers.authorization = `Bearer ${decodeURIComponent(m[1])}`;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), req.timeoutMs);
  try {
    const res = await fetch(req.url, {
      method: req.method, headers, body: req.body, credentials: 'include', cache: 'no-store', signal: ctl.signal,
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* not JSON */ }
    return { status: res.status, json, snippet: json ? null : text.slice(0, 120) };
  } catch (e) {
    return { status: 0, error: e && e.name === 'AbortError' ? 'timed out' : `network error (${e && e.message})` };
  } finally {
    clearTimeout(timer);
  }
}

function withTimeout(promise, ms, msg) {
  let t;
  return Promise.race([promise, new Promise((_, rej) => { t = setTimeout(() => rej(new Error(msg)), ms); })])
    .finally(() => clearTimeout(t));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** One HTTP call made from inside the tab. Returns {status,...} or {kind:'tab'} if the tab can't run it. */
async function pageFetch(tabId, req) {
  try {
    const results = await withTimeout(ext.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: inPageFetch,
      args: [{ method: 'GET', ...req, headers: { ...API_HEADERS, ...(req.headers || {}) }, timeoutMs: 20_000 }],
    }), 35_000, 'the page did not respond');
    const r = results && results[0] && results[0].result;
    if (!r || typeof r.status !== 'number') return { kind: 'tab', short: 'page not responding', msg: 'could not run inside the Naukri page' };
    return r;
  } catch (e) {
    return { kind: 'tab', short: 'page not responding', msg: `could not run inside the Naukri page (${e && e.message})` };
  }
}

const nowState = (headline) => ({ t: Date.now(), text: normalizeHeadline(headline) });

/** Read → (back up once → toggle the dot → save → read back to verify). */
async function work(tabId, dryRun, st) {
  const read = await pageFetch(tabId, { url: PROFILE_URL });
  if (read.kind) return read;
  const k1 = classifyStatus(read.status);
  if (k1 !== 'ok') return { kind: k1, short: shortReason(k1, read), msg: describeFailure(k1, 'Reading your profile', read) };
  const prof = extractProfile(read.json);
  if (!prof) return { kind: 'fatal', short: 'unexpected response', msg: 'Naukri\'s profile response has changed shape (no profileId/resumeHeadline). The extension needs an update' };
  const account = { name: prof.name, idTail: prof.profileId.slice(-4) };

  if (dryRun) {
    return {
      kind: 'ok', dry: true, account, headlineNow: nowState(prof.headline),
      msg: `connected as ${prof.name || 'your account'}; headline is ${normalizeHeadline(prof.headline).length}/${LIMITS.headlineMax} characters; nothing was changed`,
    };
  }

  const plan = nextHeadline(prof.headline, st.memo, prof.profileId);
  if (!plan.ok) return { kind: 'fatal', account, short: plan.short, msg: plan.reason, headlineNow: nowState(prof.headline) };

  // Before the very first save for this account, keep a full copy of the profile exactly as
  // Naukri returned it (local to this browser), so anything could be restored by hand.
  if (!st.backupMeta || st.backupMeta.profileId !== prof.profileId) {
    const backupMeta = { t: Date.now(), profileId: prof.profileId, name: prof.name };
    await put({ backup: { ...backupMeta, json: read.json }, backupMeta });
    st.backupMeta = backupMeta;
  }

  const save = await pageFetch(tabId, {
    url: SAVE_URL,
    method: 'POST',
    headers: { 'x-http-method-override': 'PUT' },
    body: JSON.stringify({ profile: { resumeHeadline: plan.next }, profileId: prof.profileId }),
  });
  if (save.kind) return save;
  const k2 = classifyStatus(save.status);
  if (k2 !== 'ok') return { kind: k2, account, short: shortReason(k2, save), msg: describeFailure(k2, 'Saving the headline', save) };
  const result = {
    kind: 'ok', account, action: plan.action.startsWith('added') ? 'added' : 'removed',
    memo: { profileId: prof.profileId, base: plan.base, last: plan.next },
  };

  // Verify the save really landed (re-read once more after 3 s in case of replica lag) and
  // that it touched nothing else: any field that had a value and is now empty stops everything.
  // Only a matching re-read counts as "confirmed"; the popup shows what Naukri returned.
  let lastSeen = null;
  for (let i = 0; i < 2; i++) {
    if (i) await sleep(3000);
    const check = await pageFetch(tabId, { url: PROFILE_URL });
    if (check.kind || classifyStatus(check.status) !== 'ok') return { ...result, unverified: true };
    const lost = lostFields(read.json, check.json);
    const after = extractProfile(check.json);
    if (after) lastSeen = nowState(after.headline);
    if (lost.length) {
      return {
        kind: 'fatal', account, short: 'other fields emptied', headlineNow: lastSeen,
        msg: `after the save Naukri shows these profile fields as empty: ${lost.slice(0, 6).join(', ')}. Stopped to be safe; check your profile`,
      };
    }
    if (after && normalizeHeadline(after.headline) === plan.next) {
      const stamp = changedTimestamp(read.json, check.json, Date.now());
      return { ...result, headlineNow: lastSeen, naukriAt: stamp ? stamp.ms : null };
    }
  }
  return {
    kind: 'fatal', account, short: 'save not applied', headlineNow: lastSeen,
    msg: 'Naukri accepted the save but the headline did not change, so it stopped to be safe',
  };
}

/** A Naukri tab the user already has open that can run scripts right now. */
async function pickUserTab(ownTabId) {
  const tabs = await ext.tabs.query({ url: NAUKRI_MATCH });
  // Job search pages are skipped: the job finder may be moving its tab from one to the next.
  const searching = (u) => { try { return /-jobs(?:-\d+)?$/.test(new URL(u).pathname); } catch { return false; } };
  const ok = tabs.filter((t) => t.id !== ownTabId && !t.discarded && t.status === 'complete' && !t.incognito && !searching(t.url));
  ok.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
  return ok[0] || null;
}

async function waitForLoad(tabId, ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    let t;
    try { t = await ext.tabs.get(tabId); } catch { return { ok: false, msg: 'the background tab was closed' }; }
    if (t.status === 'complete' && t.url && !t.url.startsWith('about:')) return { ok: true, url: t.url };
    await sleep(500);
  }
  return { ok: false, msg: 'Naukri took too long to load' };
}

/** Open a muted background Naukri tab (fresh session), run fn in it, always close it. */
async function withOwnTab(fn) {
  let tabId = null;
  let winId = null;
  try {
    try {
      tabId = (await ext.tabs.create({ url: HOME_URL, active: false })).id;
    } catch {
      // No browser window open (browser running in the background): use a minimized window.
      const w = await ext.windows.create({ url: HOME_URL, state: 'minimized' });
      winId = w.id;
      tabId = w.tabs[0].id;
    }
    await put({ ownTab: { tabId, winId, t: Date.now() } });
    try { await ext.tabs.update(tabId, { muted: true }); } catch { /* not critical */ }
    const loaded = await waitForLoad(tabId, 45_000);
    if (!loaded.ok) return { kind: 'transient', short: 'Naukri did not load', msg: loaded.msg };
    if (!loaded.url.startsWith(`${NAUKRI_ORIGIN}/`)) {
      return { kind: 'auth', short: 'logged out', msg: 'Naukri sent the browser to another site (logged out?). Log in to naukri.com here, then press Resume' };
    }
    await sleep(2500); // let the page finish its own session bootstrap
    const r = await fn(tabId);
    return r.kind === 'tab' ? { kind: 'transient', short: r.short, msg: r.msg } : r;
  } finally {
    if (winId != null) await ext.windows.remove(winId).catch(() => {});
    else if (tabId != null) await ext.tabs.remove(tabId).catch(() => {});
    await put({ ownTab: null });
  }
}

async function refresh(dryRun) {
  const access = await ext.permissions.contains({ origins: [NAUKRI_MATCH] });
  if (!access) return { kind: 'fatal', short: 'no access to naukri.com', msg: 'the extension has no access to naukri.com. Open its popup and click "Allow"' };
  const st = await load();
  const tab = await pickUserTab(st.ownTab && st.ownTab.tabId);
  if (tab) {
    const r = await work(tab.id, dryRun, st);
    // A logged-out/stale page or a frozen tab gets one more try in a freshly loaded page.
    if (r.kind !== 'auth' && r.kind !== 'tab') return { ...r, via: 'your Naukri tab' };
  }
  const r = await withOwnTab((id) => work(id, dryRun, st));
  return { ...r, via: 'a background tab' };
}

// ---------------------------------------------------------------- outcomes

async function halt(st, kind, reason, short) {
  st.halted = { kind, reason, short: short || (kind === 'auth' ? 'logged out' : 'stopped to be safe'), t: Date.now() };
  await put({ halted: st.halted });
  syncKeepAwake(st); // paused: let the PC sleep normally again
  await ext.alarms.clear('due');
  await addLog('err', `Paused: ${reason}.`);
  notify(kind === 'auth' ? 'nr-auth' : 'nr-halt', kind === 'auth' ? 'Naukri Refresher paused: log in again' : 'Naukri Refresher paused', `${reason}.`);
}

async function recordSuccess(st, r, now) {
  const prev = st.account;
  if (prev && prev.idTail && r.account && r.account.idTail !== prev.idTail) {
    await addLog('info', `This browser is now logged in to a different Naukri account (${r.account.name || r.account.idTail}).`);
  }
  const patch = { account: r.account || prev || null };
  if (r.headlineNow) patch.headlineNow = r.headlineNow; // only ever what Naukri itself returned
  if (!r.dry) {
    // Only a real, read-back-verified save unlocks the hourly schedule (a check is read-only).
    const day = st.day && st.day.key === istDayKey(now) ? st.day : { key: istDayKey(now), writes: 0 };
    Object.assign(patch, {
      lastSuccessAt: now, lastWriteAt: now, day: { key: day.key, writes: day.writes + 1 }, memo: r.memo,
    });
    // The read-back must actually have run before the hourly schedule is unlocked.
    if (!st.verifiedAt && !r.unverified) patch.verifiedAt = now;
  }
  Object.assign(st, patch);
  await put(patch);
}

async function handleResult(st, r, source, plan) {
  const now = Date.now();
  const label = source === 'scheduled' ? `${plan.label} run` : 'Manual refresh';
  const src = source === 'scheduled' ? 'auto' : 'manual';
  if (r.kind !== 'ok' && r.headlineNow) await put({ headlineNow: r.headlineNow });
  switch (r.kind) {
    case 'ok': {
      const first = !st.verifiedAt;
      await recordSuccess(st, r, now);
      await addEvent({ type: 'save', src, action: r.action, confirmed: !r.unverified, naukriAt: r.naukriAt || null });
      await addLog('ok', `${label}: ${r.action} "." on the headline via ${r.via}${r.unverified ? ' (save OK, read-back failed: not confirmed)' : ', confirmed by re-reading it from Naukri'}.`);
      if (first && st.verifiedAt) await addLog('info', 'First save verified (headline changed, no other field touched). Hourly refresh is now active.');
      else if (first) await addLog('warn', 'Saved, but the read-back check could not run, so the hourly schedule has not started. Press "Refresh now" again in a minute.');
      if (plan) await finishSlot(st, plan, now);
      break;
    }
    case 'ratelimit':
      st.backoffUntil = now + LIMITS.backoffHours * HOUR;
      await put({ backoffUntil: st.backoffUntil });
      await addEvent({ type: 'fail', src, reason: r.short || 'too many requests', note: 'resting 2 h' });
      await addLog('warn', `${label}: ${r.msg}. Resting until ${fmtWhen(st.backoffUntil, now)} IST.`);
      if (plan) await finishSlot(st, plan, now);
      break;
    case 'auth':
    case 'fatal':
      await addEvent({ type: 'pause', src, reason: r.short || (r.kind === 'auth' ? 'logged out' : 'stopped to be safe') });
      await halt(st, r.kind, r.msg, r.short);
      break;
    default: // transient
      if (plan && plan.attempts < LIMITS.maxAttempts && now + retryDelay(() => 1) <= plan.deadline) {
        plan.at = now + retryDelay();
        st.plan = plan;
        await put({ plan });
        await armDue(plan.at);
        await addEvent({ type: 'fail', src, reason: r.short || 'network error', retryAt: plan.at });
        await addLog('warn', `${label}: ${r.msg}. Retrying at ${fmtWhen(plan.at, now)} IST (attempt ${plan.attempts + 1}/${LIMITS.maxAttempts}).`);
      } else {
        await addEvent({ type: 'fail', src, reason: r.short || 'network error', note: plan ? 'gave up on this hour' : '' });
        await addLog('warn', `${label}: ${r.msg}.${plan ? ' Giving up on this slot.' : ''}`);
        if (plan) await finishSlot(st, plan, now);
      }
  }
}

// ---------------------------------------------------------------- the watchdog tick

async function closeOrphanTab(st, now) {
  // A worker killed mid-run can leave its background tab open; close it on the next tick.
  const o = st.ownTab;
  if (!o || lockHeld(st, now) || running || now - o.t < 2 * MIN) return;
  try {
    const t = await ext.tabs.get(o.tabId);
    if (t.url && t.url.startsWith(`${NAUKRI_ORIGIN}/`)) {
      if (o.winId != null) await ext.windows.remove(o.winId);
      else await ext.tabs.remove(o.tabId);
    }
  } catch { /* already gone */ }
  await put({ ownTab: null });
}

let ticking = null;
function tick() {
  ticking = ticking || doTick().catch((e) => addLog('err', `Internal error: ${e && e.message}`)).finally(() => { ticking = null; });
  return ticking;
}

async function doTick() {
  const now = Date.now();
  const st = await load();
  syncKeepAwake(st);
  await closeOrphanTab(st, now);
  if (!st.settings.enabled || st.halted || !st.verifiedAt) {
    // Off, paused, or not yet verified: nothing is scheduled. Automatic saves only start after
    // the user's own "Refresh now" succeeded once (so the first real save happens supervised).
    await ext.alarms.clear('due');
    if (st.plan) await put({ plan: null });
    return badge(st);
  }
  let plan = planValid(st) ? st.plan : await replan(st, now);
  if (!plan) return badge(st);

  if (now > plan.deadline) {
    await addLog('warn', `Missed the ${plan.label} run: the browser or PC was asleep or closed.`);
    await addEvent({ type: 'skip', src: 'auto', reason: `${plan.label} missed (PC asleep)` });
    await finishSlot(st, plan, now);
    return badge(st);
  }
  if (now < plan.at) {
    await armDue(plan.at);
    return badge(st);
  }
  if (running || lockHeld(st, now)) return undefined;

  const why = gate(st, now, 'scheduled');
  if (why) {
    await addLog('info', `Skipped the ${plan.label} run: ${why.msg}.`);
    await addEvent({ type: 'skip', src: 'auto', reason: why.short });
    await finishSlot(st, plan, now);
    return badge(st);
  }
  if (plan.attempts >= LIMITS.maxAttempts) {
    await addLog('warn', `Gave up on the ${plan.label} run after ${plan.attempts} attempts.`);
    await addEvent({ type: 'skip', src: 'auto', reason: `gave up after ${plan.attempts} tries` });
    await finishSlot(st, plan, now);
    return badge(st);
  }
  const r = await exclusive(async () => {
    plan.attempts += 1; // recorded before running, so a crash mid-run can't loop
    await put({ plan });
    return refresh(false);
  });
  if (r.kind === 'busy') return undefined;
  await handleResult(await load(), r, 'scheduled', plan);
  return badge();
}

// ---------------------------------------------------------------- popup messages

async function status() {
  const st = await load();
  const access = await ext.permissions.contains({ origins: [NAUKRI_MATCH] }).catch(() => false);
  return {
    settings: st.settings, plan: st.plan || null, halted: st.halted || null, account: st.account || null,
    lastSuccessAt: st.lastSuccessAt || null, lastWriteAt: st.lastWriteAt || null,
    writesToday: st.day && st.day.key === istDayKey(Date.now()) ? st.day.writes : 0,
    dailyCap: dailyCapFor(st.settings), backoffUntil: st.backoffUntil || null,
    log: st.log, running: running || lockHeld(st, Date.now()), access, verified: !!st.verifiedAt,
    backup: st.backupMeta || null,
    history: pruneHistory(st.history, Date.now()), headlineNow: st.headlineNow || null,
    keepAwake: { available: powerApi, active: keepAwakeWanted(st) },
    version: ext.runtime.getManifest().version,
  };
}

const handlers = {
  status,
  async tick() { await tick(); return status(); },
  async saveSettings({ patch }) {
    const st = await load();
    const settings = cleanSettings({ ...st.settings, ...patch });
    const changes = { settings };
    if (patch && patch.enabled === true) changes.halted = null; // switching on also resumes
    await put(changes);
    let note = 'Settings changed; schedule recalculated.';
    if (patch && 'enabled' in patch) note = `Auto-refresh switched ${settings.enabled ? 'on' : 'off'}.`;
    else if (patch && 'keepAwake' in patch) note = `Keep laptop awake switched ${settings.keepAwake ? 'on' : 'off'}.`;
    await addLog('info', note);
    await tick();
    return status();
  },
  async resume() {
    const st = await load();
    await put({ halted: null, settings: { ...st.settings, enabled: true } });
    await addLog('info', 'Resumed.');
    await tick();
    return status();
  },
  async runNow() {
    const st = await load();
    const why = gate(st, Date.now(), 'manual');
    if (why) return { result: { kind: 'skipped', short: why.short, msg: `Not refreshed: ${why.msg}.` }, status: await status() };
    const r = await exclusive(() => refresh(false));
    if (r.kind !== 'busy') await handleResult(await load(), r, 'manual', null);
    await tick();
    return { result: r, status: await status() };
  },
  async check() {
    const r = await exclusive(() => refresh(true));
    if (r.kind === 'ok') {
      const st = await load();
      await recordSuccess(st, r, Date.now());
      await addLog('info', `Connection check: ${r.msg} (via ${r.via}).${st.verifiedAt ? '' : ' Next: press "Refresh now" once to start the hourly schedule.'}`);
    } else if (r.kind !== 'busy') {
      await addLog('warn', `Connection check failed: ${r.msg}.`);
    }
    return { result: r, status: await status() };
  },
  ...jobsHandlers, // the job finder (jobs.js)
};

// The job finder rides on the same 1-minute watchdog, plus its own precise alarm.
let jobsTicking = null;
function jobsTickSafe() {
  jobsTicking = jobsTicking || jobsTick().catch((e) => addLog('err', `Job finder internal error: ${e && e.message}`)).finally(() => { jobsTicking = null; });
  return jobsTicking;
}

// A message from a web page's content script (only site-bridge.js, on your own site) may only
// ask the two bridge questions; the popup and settings pages may ask anything.
function allowed(msg, sender) {
  if (!sender || sender.id !== ext.runtime.id) return false;
  if (sender.url && sender.url.startsWith(ext.runtime.getURL(''))) return true; // popup, settings
  if (!sender.url) return !sender.tab; // the extension's own background, never a page
  let origin = '';
  try { origin = new URL(sender.url).origin; } catch { return false; }
  return origin === SITE_ORIGIN && BRIDGE_TYPES.includes(msg.type);
}

ext.runtime.onMessage.addListener((msg, sender, reply) => {
  const h = msg && handlers[msg.type];
  if (!h || !allowed(msg, sender)) return false;
  h(msg).then(reply, (e) => reply({ error: String(e && e.message) }));
  return true;
});

ext.alarms.onAlarm.addListener((a) => {
  if (a.name === 'tick' || a.name === 'due') tick();
  if (a.name === 'tick' || a.name === 'jobs') jobsTickSafe();
});

ext.notifications.onClicked.addListener((id) => {
  if (id === 'nr-auth') ext.tabs.create({ url: LOGIN_URL });
  if (id === 'nr-jobs') ext.tabs.create({ url: ext.runtime.getURL('jobs.html') });
  ext.notifications.clear(id);
});

ext.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') await addLog('info', 'Installed. Log in to naukri.com in this browser, then press "Refresh now" once: the hourly schedule starts after that first save is verified.');
  await ensureWatchdog();
  await tick();
});

ext.runtime.onStartup.addListener(async () => {
  // Tab ids and locks from the previous browser session mean nothing now. Forget them so
  // the orphan-tab cleanup can never close one of the user's restored tabs.
  await put({ ownTab: null, lock: null });
  await jobsOnStartup();
  await ensureWatchdog();
  await tick();
});

ensureWatchdog(); // every worker start: make sure the watchdog exists (cheap, idempotent)
