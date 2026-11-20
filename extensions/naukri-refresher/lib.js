// Naukri Refresher: pure logic shared by the background worker, the popup and the Node tests.
// Nothing in this file touches browser APIs, so every rule here is unit-tested.

// ---------- Naukri endpoints (the same calls the profile page makes) ----------
export const NAUKRI_ORIGIN = 'https://www.naukri.com';
export const NAUKRI_MATCH = 'https://www.naukri.com/*';
export const HOME_URL = `${NAUKRI_ORIGIN}/mnjuser/homepage`;
export const LOGIN_URL = `${NAUKRI_ORIGIN}/nlogin/login`;
const API = `${NAUKRI_ORIGIN}/cloudgateway-mynaukri/resman-aggregator-services`;
export const PROFILE_URL = `${API}/v2/users/self?expand_level=4`;
export const SAVE_URL = `${API}/v1/users/self/fullprofiles`;
export const API_HEADERS = Object.freeze({
  accept: 'application/json',
  'content-type': 'application/json',
  appid: '105',
  systemid: 'Naukri',
  clientid: 'd3skt0p',
  'x-requested-with': 'XMLHttpRequest',
});

// ---------- time (everything is IST, whatever the PC's timezone; India has no DST) ----------
export const MIN = 60_000;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;
export const IST_OFFSET = 330 * MIN;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const istDate = (ms) => new Date(ms + IST_OFFSET); // read it with getUTC*()
export const istDayStart = (ms) => Math.floor((ms + IST_OFFSET) / DAY) * DAY - IST_OFFSET;
export const istDayKey = (ms) => istDate(ms).toISOString().slice(0, 10); // "2026-11-20"
export const slotKeyOf = (slotMs) => istDate(slotMs).toISOString().slice(0, 13); // "2026-11-20T07"
export const istWeekday = (ms) => istDate(ms).getUTCDay(); // 0 = Sunday
export const istHM = (ms) => istDate(ms).toISOString().slice(11, 16); // "07:06"

export function fmtWhen(ms, now = Date.now()) {
  if (!ms) return '—';
  const hm = istHM(ms);
  const days = Math.round((istDayStart(ms) - istDayStart(now)) / DAY);
  if (days === 0) return hm;
  if (days === 1) return `tomorrow ${hm}`;
  if (days === -1) return `yesterday ${hm}`;
  const d = istDate(ms);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${hm}`;
}

// ---------- settings ----------
export const DEFAULTS = Object.freeze({
  enabled: true,
  startHour: 7, // first slot 07:00 IST
  endHour: 19, // last slot 19:00 IST
  jitterMin: 7.5, // each run lands anywhere in slot ± 7.5 min
  skipWeekends: false,
  keepAwake: true, // Chrome/Edge: stop the PC idle-sleeping while auto-refresh is on (screen may still turn off)
});

// Safety rails. These are deliberately not user-editable.
export const LIMITS = Object.freeze({
  manualPerDay: 3, // daily ceiling = one save per hourly slot in the window + this many (16 for 07–19)
  minGapMin: 20, // a scheduled save is skipped if any save happened this recently
  manualCooldownSec: 60, // "Refresh now" double-click guard
  maxAttempts: 3, // per slot, for network / 5xx failures
  retryMinMin: 2,
  retryMaxMin: 5,
  graceMin: 20, // retries may run until the slot window closes + this
  backoffHours: 2, // after HTTP 429
  headlineMax: 250, // Naukri's resume-headline limit
  lockTtlMin: 4, // a run that never finished (worker killed) frees the lock after this
});

export function cleanSettings(raw = {}) {
  const s = { ...DEFAULTS, ...(raw || {}) };
  const int = (v, lo, hi, d) => (Number.isInteger(Number(v)) && Number(v) >= lo && Number(v) <= hi ? Number(v) : d);
  const startHour = int(s.startHour, 0, 23, DEFAULTS.startHour);
  let endHour = int(s.endHour, 0, 23, DEFAULTS.endHour);
  if (endHour < startHour) endHour = startHour;
  const j = Number(s.jitterMin);
  const jitterMin = Number.isFinite(j) && j >= 0 && j <= 25 ? j : DEFAULTS.jitterMin;
  return {
    enabled: s.enabled !== false, startHour, endHour, jitterMin,
    skipWeekends: s.skipWeekends === true, keepAwake: s.keepAwake !== false,
  };
}

/** Hard ceiling on saves per IST day: every hourly slot in the window plus a few manual ones. */
export const dailyCapFor = (settings) => {
  const s = cleanSettings(settings);
  return s.endHour - s.startHour + 1 + LIMITS.manualPerDay;
};

export const settingsSig = (s) => {
  const c = cleanSettings(s);
  return `${c.startHour}-${c.endHour}-${c.jitterMin}-${c.skipWeekends ? 1 : 0}`;
};

// ---------- schedule ----------
/**
 * The next run: walk hourly slots (startHour..endHour, IST) from today on, skip slots already
 * done (<= lastSlot), and pick a uniform random moment in [slot − jitter, slot + jitter],
 * clamped to the day's window, so 07:00 runs 07:00–07:07:30 and 19:00 runs 18:52:30–19:00.
 * If we are already inside a slot's window, the pick is from the rest of that window.
 */
export function nextRun(now, settings, lastSlot = null, rand = Math.random) {
  const s = cleanSettings(settings);
  const jitter = s.jitterMin * MIN;
  const today = istDayStart(now);
  const earliest = now + 30_000;
  for (let d = 0; d < 9; d++) {
    const day = today + d * DAY;
    if (s.skipWeekends && (istWeekday(day) === 0 || istWeekday(day) === 6)) continue;
    const winStart = day + s.startHour * HOUR;
    const winEnd = day + s.endHour * HOUR;
    for (let h = s.startHour; h <= s.endHour; h++) {
      const slotAt = day + h * HOUR;
      const slot = slotKeyOf(slotAt);
      if (lastSlot && slot <= lastSlot) continue;
      const lo = Math.max(slotAt - jitter, winStart);
      const hi = Math.min(slotAt + jitter, winEnd);
      if (hi < earliest) continue;
      const from = Math.max(lo, earliest);
      const at = Math.round(from + rand() * (hi - from));
      return { slot, slotAt, at, windowEnd: hi, deadline: hi + LIMITS.graceMin * MIN, label: istHM(slotAt) };
    }
  }
  return null;
}

export const retryDelay = (rand = Math.random) =>
  Math.round((LIMITS.retryMinMin + rand() * (LIMITS.retryMaxMin - LIMITS.retryMinMin)) * MIN);

/** Why a run must not happen now: null = go, else { short, msg }. `kind` is 'scheduled' or 'manual'. */
export function gate(st, now, kind) {
  const writes = st.day && st.day.key === istDayKey(now) ? st.day.writes : 0;
  const cap = dailyCapFor(st.settings);
  if (writes >= cap) return { short: 'daily cap reached', msg: `the daily safety cap of ${cap} saves is reached` };
  if (st.backoffUntil && now < st.backoffUntil) {
    return { short: 'resting (Naukri asked to slow down)', msg: `Naukri asked to slow down, so it is resting until ${fmtWhen(st.backoffUntil, now)} IST` };
  }
  if (kind === 'scheduled') {
    if (st.lastWriteAt && now - st.lastWriteAt < LIMITS.minGapMin * MIN) {
      const ago = Math.max(1, Math.round((now - st.lastWriteAt) / MIN));
      return { short: `saved ${ago} min ago`, msg: `the profile was already saved ${ago} min ago` };
    }
  } else if (st.lastWriteAt && now - st.lastWriteAt < LIMITS.manualCooldownSec * 1000) {
    return { short: 'refreshed <1 min ago', msg: 'it was refreshed less than a minute ago' };
  }
  return null;
}

// ---------- history: what the popup lists (today + yesterday, IST) ----------
export function pruneHistory(list, now) {
  const keep = new Set([istDayKey(now), istDayKey(now - DAY)]);
  return (Array.isArray(list) ? list : []).filter((e) => e && keep.has(istDayKey(e.t)));
}

const toMs = (v) => {
  if (typeof v === 'number') {
    if (v > 1e12 && v < 1e13) return v; // epoch ms
    if (v > 1e9 && v < 1e10) return v * 1000; // epoch s
    return null;
  }
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(v)) {
    const ms = Date.parse(v.replace(' ', 'T'));
    return Number.isFinite(ms) ? ms : null;
  }
  return null;
};
const flatPrimitives = (json) => {
  const out = {};
  if (!json || typeof json !== 'object') return out;
  for (const [k, v] of Object.entries(json)) if (k !== 'profile' && (typeof v === 'string' || typeof v === 'number')) out[k] = v;
  const p = Array.isArray(json.profile) ? json.profile[0] : json.profile;
  if (p && typeof p === 'object') {
    for (const [k, v] of Object.entries(p)) if (typeof v === 'string' || typeof v === 'number') out[`profile.${k}`] = v;
  }
  return out;
};

/**
 * Naukri's own evidence of the save: a "modified/updated"-type timestamp field that changed
 * between the read before the save and the read after it, and is within 10 min of now.
 * Returns { field, ms } or null (if Naukri's response has no such field, we say nothing).
 */
export function changedTimestamp(before, after, now) {
  const a = flatPrimitives(before);
  const b = flatPrimitives(after);
  for (const [k, v] of Object.entries(b)) {
    if (a[k] === v || !/modif|updat|lastmod|changed|mtime/i.test(k)) continue;
    const ms = toMs(v);
    if (ms && Math.abs(ms - now) < 10 * MIN) return { field: k, ms };
  }
  return null;
}

/** A few words for the history list. */
export function shortReason(kind, res = {}) {
  if (kind === 'auth') return 'logged out';
  if (kind === 'ratelimit') return 'too many requests';
  if (res.status) return `HTTP ${res.status}`;
  if (res.error) return res.error.startsWith('timed out') ? 'timed out' : 'network error';
  return kind === 'fatal' ? 'unexpected response' : 'network error';
}

// ---------- headline ----------
export const normalizeHeadline = (s) => String(s ?? '').replace(/\s+$/, '');
const variantOf = (base) => (base.endsWith('.') ? base.slice(0, -1) : `${base}.`);

/**
 * The only edit this extension ever makes: toggle ONE trailing "." on the resume headline.
 * `memo` remembers the original ("base") so the text never drifts: the headline only ever
 * alternates between `base` and `base` ± "." (an ellipsis "..." can't erode one dot at a time).
 * If the headline isn't what we last wrote, the user edited it, so their text becomes the base.
 */
export function nextHeadline(current, memo, profileId, maxLen = LIMITS.headlineMax) {
  const cur = normalizeHeadline(current);
  if (!cur.trim()) return { ok: false, short: 'headline empty', reason: 'your resume headline is empty. Add one on Naukri first' };
  const remembered = memo && memo.profileId === profileId && memo.last === cur && typeof memo.base === 'string';
  const base = remembered ? memo.base : cur;
  const next = cur === base ? variantOf(base) : base;
  if (next.length > maxLen) {
    return { ok: false, short: 'headline full', reason: `the headline is ${cur.length}/${maxLen} characters, so a "." can't be added. Shorten it by one character` };
  }
  // Hard invariant: the write differs from what's live by exactly one trailing "." and is never blank.
  const oneDot = next === `${cur}.` || cur === `${next}.`;
  if (!oneDot || !next.trim()) return { ok: false, short: 'unexpected change', reason: 'refusing an unexpected headline change' };
  return { ok: true, next, base, action: next.length > cur.length ? 'added "."' : 'removed "."' };
}

// ---------- API responses ----------
export function extractProfile(json) {
  if (!json || typeof json !== 'object') return null;
  const p = Array.isArray(json.profile) ? json.profile[0] : json.profile;
  if (!p || typeof p !== 'object') return null;
  const id = p.profileId ?? p.id;
  if ((typeof id !== 'string' && typeof id !== 'number') || String(id) === '') return null;
  if (typeof p.resumeHeadline !== 'string') return null;
  const name = [p.name, json.user && json.user.name, json.name].find((v) => typeof v === 'string' && v.trim());
  return { profileId: String(id), headline: p.resumeHeadline, name: name ? name.trim() : null };
}

const isFilled = (v) => v !== null && v !== undefined && v !== ''
  && !(Array.isArray(v) && v.length === 0)
  && !(typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0);

/** Names of the profile fields that hold a value (the headline itself excluded). */
export function filledFields(json) {
  const out = new Set();
  if (!json || typeof json !== 'object') return out;
  for (const [k, v] of Object.entries(json)) if (k !== 'profile' && isFilled(v)) out.add(k);
  const p = Array.isArray(json.profile) ? json.profile[0] : json.profile;
  if (p && typeof p === 'object') {
    for (const [k, v] of Object.entries(p)) if (k !== 'resumeHeadline' && isFilled(v)) out.add(`profile.${k}`);
  }
  return out;
}

/** Fields that had a value before the save and are empty after it: collateral damage. */
export function lostFields(before, after) {
  const now = filledFields(after);
  return [...filledFields(before)].filter((k) => !now.has(k));
}

/** ok | auth (logged out) | ratelimit | transient (retry later) | fatal (stop: API changed) */
export function classifyStatus(status) {
  if (status >= 200 && status < 300) return 'ok';
  if (status === 401 || status === 403) return 'auth';
  if (status === 429) return 'ratelimit';
  if (status === 0 || status === 408 || status >= 500) return 'transient';
  return 'fatal';
}

export function describeFailure(kind, what, res) {
  const code = res.status ? `HTTP ${res.status}` : res.error || 'network error';
  switch (kind) {
    case 'auth':
      return `Naukri says this browser is logged out (${code}). Log in to naukri.com here, then press Resume`;
    case 'ratelimit':
      return `Naukri asked to slow down (${code})`;
    case 'transient':
      return `${what} failed (${code})`;
    default:
      return `${what} failed with ${code}${res.snippet ? `: ${res.snippet}` : ''}. Naukri may have changed its API`;
  }
}
