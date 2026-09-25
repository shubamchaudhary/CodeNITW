// Shared persistence layer for Interview Prep, DSA Prep and the Planning page.
// localStorage is the single source of truth; the Planning page reads/writes the
// SAME completion + notes stores as the prep pages, so ticking a planned card or
// writing notes there stays in sync with the real page (and vice-versa).

import { jobHuntPlan } from "./JobHuntPlan";
import { DSA_PROBLEMS } from "./DSAPrep";
import { CORE_STACK_TOPICS } from "./CoreStack";
import { AI_STACK_TOPICS } from "./AIStack";
import { getAuthState, requestSignIn } from "./authGate";

export { DSA_PROBLEMS, CORE_STACK_TOPICS, AI_STACK_TOPICS };

export const KEYS = {
  IP_COMPLETED: "InterviewPrepCompleted",
  IP_NOTES: "InterviewPrepNotes",
  CS_COMPLETED: "CoreStackCompleted",
  CS_NOTES: "CoreStackNotes",
  CS_TIMESTAMPS: "CoreStackCheckedTimestamps",
  // Personal notes pinned to a passage of a topic's notes page, kept apart
  // from the note text so annotating never edits the markdown (or code).
  CS_ANNOTATIONS: "CoreStackAnnotations",
  AI_COMPLETED: "AIStackCompleted",
  AI_NOTES: "AIStackNotes",
  AI_TIMESTAMPS: "AIStackCheckedTimestamps",
  AI_ANNOTATIONS: "AIStackAnnotations",
  DSA_COMPLETED: "DSAPrepCompleted",
  DSA_NOTES: "DSAPrepNotes",
  DSA_TIMESTAMPS: "DSAPrepSolvedTimestamps",
  DSA_STARRED: "DSAPrepStarred",
  // Interview Kit checklists (behavioral, STAR, HR, design, Java, LogLens).
  IK_COMPLETED: "InterviewKitCompleted",
  IK_NOTES: "InterviewKitNotes",
  PLAN_DAYS: "PlanningDays",
  JOB_TRACKER: "JobTrackerState",
  POMO_STATE: "PlanningPomoState",
};

// A solve is permanent. DSA_TIMESTAMPS records *when* each problem was solved
// so the UI can show how long ago it was, but nothing ever un-solves it.

// ─── Per-account namespacing ──────────────────────────────────────────────────
// Every persisted value is stored under a key prefixed with the signed-in user's
// uid, so one account can never read another account's cached data on a shared
// browser. Set by the cloud-sync layer on sign-in; "anon" before login.
let activeUid = "anon";

export function setActiveUid(uid) {
  const next = uid || "anon";
  if (next === activeUid) return;
  activeUid = next;
  // Pages were showing the previous account's (or a guest's empty) data: tell
  // every one of them to re-read from the new namespace.
  Object.values(KEYS).forEach((key) => emit(key, { account: true }));
}

function nsKey(base) {
  return `u:${activeUid}:${base}`;
}

// ─── Guests can read everything but change nothing ────────────────────────────
// Everything a person would expect to keep is refused for a guest; they're asked
// to sign in instead. The Pomodoro timer's state is a device convenience, not
// progress, so it stays usable signed out.
const USER_DATA = new Set(Object.values(KEYS).filter((k) => k !== KEYS.POMO_STATE));

// Writes made by the app itself (one-off migrations and backfills on page
// load) are refused silently for a guest — only a person's action should pop
// the sign-in prompt.
let quietDepth = 0;
export function quietly(fn) {
  quietDepth++;
  try {
    return fn();
  } finally {
    quietDepth--;
  }
}

function refuseGuestWrite(key) {
  if (!USER_DATA.has(key) || getAuthState() === "user") return false;
  if (quietDepth === 0 && getAuthState() === "guest") requestSignIn();
  // Pages update their own state right after calling the store; once that
  // handler has finished, have them re-read storage so the change visibly
  // doesn't stick (a ticked box un-ticks).
  setTimeout(() => emit(key, { blocked: true }), 0);
  return true;
}

// ─── Low-level JSON storage with a change event for live cross-page sync ──────
// Listeners get (key, info). info says where the change came from:
//   { ids }      a local save — ids are the entries that changed (null = all)
//   { remote }   the cloud-sync layer applied data from Firestore
//   { external } another tab of this browser wrote it (same localStorage)
//   { account }  the signed-in account changed — re-read everything
//   { blocked }  a guest's write was refused — re-read to undo it on screen
const listeners = new Set();

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(key, info = {}) {
  listeners.forEach((fn) => {
    try {
      fn(key, info);
    } catch (_) {}
  });
}

const isMap = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

// Which entries of a stored map differ between two versions. null means the
// value isn't a map, so treat the whole thing as changed.
export function changedIds(prev, next) {
  if (!isMap(prev) || !isMap(next)) return null;
  const ids = [];
  for (const id of new Set([...Object.keys(prev), ...Object.keys(next)])) {
    if (JSON.stringify(prev[id]) !== JSON.stringify(next[id])) ids.push(id);
  }
  return ids;
}

// Another tab wrote to the same localStorage: tell this tab's pages, so no
// tab keeps showing (and later saving back) an outdated copy.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    const prefix = `u:${activeUid}:`;
    if (e.key && e.key.startsWith(prefix)) emit(e.key.slice(prefix.length), { external: true });
  });
}

export function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(nsKey(key));
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}

export function saveJSON(key, value) {
  if (refuseGuestWrite(key)) return false;
  const prev = loadJSON(key, undefined);
  // A first save of a map counts as adding its entries, not replacing the
  // whole key — so it can't wipe entries another device already synced.
  const ids = changedIds(prev === undefined && isMap(value) ? {} : prev, value);
  if (ids && !ids.length) return; // nothing changed — don't wake sync or the UI
  localStorage.setItem(nsKey(key), JSON.stringify(value));
  emit(key, { ids });
}

// Write a batch of remote (cloud) values into local storage and notify the UI.
// Used by the Firestore sync layer. Keys whose value is unchanged are skipped,
// so a snapshot that only confirms what we have doesn't re-render every page.
export function applyRemote(data) {
  if (!data) return;
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined) return;
    const next = JSON.stringify(value);
    try {
      if (localStorage.getItem(nsKey(key)) === next) return;
      localStorage.setItem(nsKey(key), next);
    } catch (_) {
      return;
    }
    emit(key, { remote: true });
  });
}

// ─── Interview Prep cards (DSA decoupled — topics only) ───────────────────────
// Each plan card keeps AI/HLD/LLD categories; the legacy "DSA" tag and the
// per-card daily-DSA coupling are dropped so the page stays topic-oriented.
export const INTERVIEW_CARDS = jobHuntPlan.map((card) => ({
  ...card,
  categories: card.categories.filter((c) => c !== "DSA"),
}));

const IP_BY_ID = Object.fromEntries(INTERVIEW_CARDS.map((c) => [c.id, c]));
const DSA_BY_ID = Object.fromEntries(DSA_PROBLEMS.map((p) => [p.id, p]));
const CS_BY_ID = Object.fromEntries(CORE_STACK_TOPICS.map((t) => [t.id, t]));
const AI_BY_ID = Object.fromEntries(AI_STACK_TOPICS.map((t) => [t.id, t]));

export function getInterviewCard(id) {
  return IP_BY_ID[id] || null;
}
export function getDsaProblem(id) {
  return DSA_BY_ID[id] || null;
}
export function getCoreStackTopic(id) {
  return CS_BY_ID[id] || null;
}
export function getAIStackTopic(id) {
  return AI_BY_ID[id] || null;
}

// ─── Completion + notes accessors keyed by source ─────────────────────────────
// "interview" is the legacy Topics page: its store stays readable so days that
// already reference an interview card keep working, but nothing writes new ones.
function keysFor(source) {
  if (source === "dsa") return { completed: KEYS.DSA_COMPLETED, notes: KEYS.DSA_NOTES };
  if (source === "corestack") return { completed: KEYS.CS_COMPLETED, notes: KEYS.CS_NOTES };
  if (source === "aistack") return { completed: KEYS.AI_COMPLETED, notes: KEYS.AI_NOTES };
  if (source === "interviewkit") return { completed: KEYS.IK_COMPLETED, notes: KEYS.IK_NOTES };
  return { completed: KEYS.IP_COMPLETED, notes: KEYS.IP_NOTES };
}

export function isSourceComplete(source, id) {
  return !!loadJSON(keysFor(source).completed, {})[id];
}

export function getSourceNote(source, id) {
  return loadJSON(keysFor(source).notes, {})[id] || "";
}

// Annotations exist only on the full notes pages (Core Stack, AI Stack).
export function annotationsKey(source) {
  if (source === "corestack") return KEYS.CS_ANNOTATIONS;
  if (source === "aistack") return KEYS.AI_ANNOTATIONS;
  return null;
}

export function getAnnotations(source, id) {
  const key = annotationsKey(source);
  return (key && loadJSON(key, {})[id]) || [];
}

export function setAnnotations(source, id, list) {
  const key = annotationsKey(source);
  if (!key) return;
  const map = loadJSON(key, {});
  if (list.length) map[id] = list;
  else delete map[id];
  saveJSON(key, map);
}

export function setSourceComplete(source, id, value) {
  const key = keysFor(source).completed;
  const map = loadJSON(key, {});
  map[id] = value;
  saveJSON(key, map);
  // Solving a DSA problem starts (or clears) its 45-day revisit timer.
  if (source === "dsa") {
    const ts = loadJSON(KEYS.DSA_TIMESTAMPS, {});
    if (value) ts[id] = Date.now();
    else delete ts[id];
    saveJSON(KEYS.DSA_TIMESTAMPS, ts);
  }
  // Core Stack records when a topic was ticked so the card can show its age.
  if (source === "corestack") {
    const ts = loadJSON(KEYS.CS_TIMESTAMPS, {});
    if (value) ts[id] = Date.now();
    else delete ts[id];
    saveJSON(KEYS.CS_TIMESTAMPS, ts);
  }
  // AI Stack, same idea, its own store.
  if (source === "aistack") {
    const ts = loadJSON(KEYS.AI_TIMESTAMPS, {});
    if (value) ts[id] = Date.now();
    else delete ts[id];
    saveJSON(KEYS.AI_TIMESTAMPS, ts);
  }
}

// How many days ago this Core Stack topic was ticked (0 = today), or null if it
// isn't ticked. Informational only — nothing ever expires a tick.
export function coreStackDaysSinceChecked(id) {
  return daysSinceStamp(KEYS.CS_TIMESTAMPS, id);
}

export function aiStackDaysSinceChecked(id) {
  return daysSinceStamp(KEYS.AI_TIMESTAMPS, id);
}

function daysSinceStamp(key, id) {
  const ts = loadJSON(key, {})[id];
  if (!ts) return null;
  return Math.floor((Date.now() - ts) / (24 * 60 * 60 * 1000));
}

// ─── DSA solve history + starring ─────────────────────────────────────────────
export function getDsaTimestamps() {
  return loadJSON(KEYS.DSA_TIMESTAMPS, {});
}

// How many days ago this problem was solved (0 = today), or null if it isn't
// solved / predates timestamp tracking. Purely informational — a solve never
// expires, this just tells you how stale your last attempt is.
export function dsaDaysSinceSolved(id) {
  const ts = loadJSON(KEYS.DSA_TIMESTAMPS, {})[id];
  if (!ts) return null;
  return Math.floor((Date.now() - ts) / (24 * 60 * 60 * 1000));
}

export function isDsaStarred(id) {
  return !!loadJSON(KEYS.DSA_STARRED, {})[id];
}

export function setDsaStarred(id, value) {
  const map = loadJSON(KEYS.DSA_STARRED, {});
  map[id] = value;
  saveJSON(KEYS.DSA_STARRED, map);
}

// Backfill a solve timestamp for anything ticked before timestamps existed (or
// whose timestamp the old 45-day expiry deleted), so those rows can still show
// a "solved N days ago" age instead of nothing. Runs once per load; cheap.
export function backfillDsaTimestamps() {
  const completed = loadJSON(KEYS.DSA_COMPLETED, {});
  const ts = loadJSON(KEYS.DSA_TIMESTAMPS, {});
  let changed = false;
  for (const [id, done] of Object.entries(completed)) {
    if (done && !ts[id]) {
      ts[id] = Date.now();
      changed = true;
    }
  }
  // Runs by itself on page load, so for a guest it's refused without a prompt.
  if (changed) quietly(() => saveJSON(KEYS.DSA_TIMESTAMPS, ts));
  return changed;
}

export function setSourceNote(source, id, value) {
  const key = keysFor(source).notes;
  const map = loadJSON(key, {});
  map[id] = value;
  saveJSON(key, map);
}

// ─── One-time migration from the old Personal Plan progress ───────────────────
// The DSA set was curated from the Personal Plan, so titles match exactly. We
// map the old (device-local, name-keyed) solved/starred maps onto the new DSA
// slug ids and merge them into the signed-in account (so they then cloud-sync).
const LEGACY_SOLVED_KEY = "PersonalDSASolvedQuestions";
const LEGACY_STARRED_KEY = "PersonalDSAStarredQuestions";
const MIGRATED_FLAG = "PersonalPlanMigrated";

function rawGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export function hasLegacyPersonalPlanData() {
  const solved = rawGet(LEGACY_SOLVED_KEY) || {};
  const starred = rawGet(LEGACY_STARRED_KEY) || {};
  return Object.values(solved).some(Boolean) || Object.values(starred).some(Boolean);
}

export function isPersonalPlanMigrated() {
  return !!loadJSON(MIGRATED_FLAG, false);
}

export function dismissPersonalPlanImport() {
  saveJSON(MIGRATED_FLAG, true);
}

export function migratePersonalPlanProgress() {
  const oldSolved = rawGet(LEGACY_SOLVED_KEY) || {};
  const oldStarred = rawGet(LEGACY_STARRED_KEY) || {};
  const byTitle = {};
  DSA_PROBLEMS.forEach((p) => {
    byTitle[p.title] = p.id;
  });

  const completed = loadJSON(KEYS.DSA_COMPLETED, {});
  const timestamps = loadJSON(KEYS.DSA_TIMESTAMPS, {});
  const starred = loadJSON(KEYS.DSA_STARRED, {});
  const now = Date.now();
  let count = 0;

  Object.entries(oldSolved).forEach(([title, val]) => {
    const id = byTitle[title];
    if (val && id && !completed[id]) {
      completed[id] = true;
      timestamps[id] = now;
      count += 1;
    }
  });
  Object.entries(oldStarred).forEach(([title, val]) => {
    const id = byTitle[title];
    if (val && id) starred[id] = true;
  });

  saveJSON(KEYS.DSA_COMPLETED, completed);
  saveJSON(KEYS.DSA_TIMESTAMPS, timestamps);
  saveJSON(KEYS.DSA_STARRED, starred);
  saveJSON(MIGRATED_FLAG, true);
  return count;
}

// ─── Date helpers for the planning timeline ───────────────────────────────────
// Day boundary is 5:00 AM IST (UTC+5:30), not midnight. If the current IST time
// is before 5 AM, the active "planning day" is still the previous calendar date.
export function dateKey(d = new Date()) {
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 5.5 * 3600000);
  if (ist.getHours() < 5) ist.setDate(ist.getDate() - 1);
  const y = ist.getFullYear();
  const m = String(ist.getMonth() + 1).padStart(2, "0");
  const day = String(ist.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(key, delta) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return dateKey(dt);
}

export function prettyDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function relativeLabel(key) {
  const today = dateKey();
  if (key === today) return "Today";
  if (key === addDays(today, -1)) return "Yesterday";
  if (key === addDays(today, 1)) return "Tomorrow";
  const diff = Math.round(
    (new Date(key) - new Date(today)) / (1000 * 60 * 60 * 24)
  );
  return diff < 0 ? `${-diff} days ago` : `In ${diff} days`;
}

// ─── Planning days CRUD ───────────────────────────────────────────────────────
// PLAN_DAYS shape: { "YYYY-MM-DD": [ planItem, ... ] }
// planItem: { uid, source: "interview"|"dsa"|"custom", refId?, title, meta?,
//             completed?(custom only), notes?(custom only) }
export function getDay(key) {
  return loadJSON(KEYS.PLAN_DAYS, {})[key] || [];
}

export function setDay(key, items) {
  const all = loadJSON(KEYS.PLAN_DAYS, {});
  all[key] = items;
  saveJSON(KEYS.PLAN_DAYS, all);
}

export function getAllDayKeys() {
  return Object.keys(loadJSON(KEYS.PLAN_DAYS, {})).sort().reverse();
}

// ─── Add-to-a-day helpers ─────────────────────────────────────────────────────
// Used by the prep pages so a problem can be pushed straight onto a plan day
// without going to the Planning page and searching for it. Writes through
// setDay, so the Planning page's PLAN_DAYS subscription picks it up live.
export function planItemUid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Is this interview/dsa item already on that day? (custom items have no refId)
export function isPlanned(key, source, refId) {
  return getDay(key).some((i) => i.source === source && i.refId === refId);
}

// Adds unless the same source+refId is already there. Returns whether it added.
export function addToPlanDay(key, item) {
  const items = getDay(key);
  if (item.source !== "custom" && items.some((i) => i.source === item.source && i.refId === item.refId)) {
    return false;
  }
  setDay(key, [...items, item]);
  return true;
}

export function removeFromPlanDay(key, source, refId) {
  const items = getDay(key);
  const next = items.filter((i) => !(i.source === source && i.refId === refId));
  if (next.length === items.length) return false;
  setDay(key, next);
  return true;
}

// Build the plan item for a Core Stack topic — the estimate is the topic's own
// watch time, so a planned day adds up to something real.
export function coreStackPlanItem(topic) {
  return {
    uid: planItemUid(),
    source: "corestack",
    refId: topic.id,
    title: topic.title,
    meta: topic.priority,
    estimatedMinutes: topic.minutes || 30,
  };
}

// Build the plan item for an AI Stack topic.
export function aiStackPlanItem(topic) {
  return {
    uid: planItemUid(),
    source: "aistack",
    refId: topic.id,
    title: topic.title,
    meta: topic.id,
    link: topic.resource?.url,
    estimatedMinutes: topic.minutes || 30,
  };
}

// Build the plan item for a DSA problem — one shape, shared by every caller.
export function dsaPlanItem(problem, topic) {
  return {
    uid: planItemUid(),
    source: "dsa",
    refId: problem.id,
    title: problem.title,
    meta: problem.topic || topic || "",
    link: problem.link,
    estimatedMinutes: 25,
  };
}
