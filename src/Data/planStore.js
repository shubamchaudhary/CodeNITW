// Shared persistence layer for Interview Prep, DSA Prep and the Planning page.
// localStorage is the single source of truth; the Planning page reads/writes the
// SAME completion + notes stores as the prep pages, so ticking a planned card or
// writing notes there stays in sync with the real page (and vice-versa).

import { jobHuntPlan } from "./JobHuntPlan";
import { DSA_PROBLEMS } from "./DSAPrep";

export { DSA_PROBLEMS };

export const KEYS = {
  IP_COMPLETED: "InterviewPrepCompleted",
  IP_NOTES: "InterviewPrepNotes",
  DSA_COMPLETED: "DSAPrepCompleted",
  DSA_NOTES: "DSAPrepNotes",
  DSA_TIMESTAMPS: "DSAPrepSolvedTimestamps",
  DSA_STARRED: "DSAPrepStarred",
  PLAN_DAYS: "PlanningDays",
};

// Solved DSA problems revert to unsolved after this window (spaced repetition).
export const DSA_REVISIT_DAYS = 45;
const DSA_REVISIT_MS = DSA_REVISIT_DAYS * 24 * 60 * 60 * 1000;

// ─── Per-account namespacing ──────────────────────────────────────────────────
// Every persisted value is stored under a key prefixed with the signed-in user's
// uid, so one account can never read another account's cached data on a shared
// browser. Set by the cloud-sync layer on sign-in; "anon" before login.
let activeUid = "anon";

export function setActiveUid(uid) {
  activeUid = uid || "anon";
}

function nsKey(base) {
  return `u:${activeUid}:${base}`;
}

// ─── Low-level JSON storage with a change event for live cross-page sync ──────
const listeners = new Set();

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(key) {
  listeners.forEach((fn) => {
    try {
      fn(key);
    } catch (_) {}
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
  localStorage.setItem(nsKey(key), JSON.stringify(value));
  emit(key);
}

// Write a batch of remote (cloud) values into local storage and notify the UI.
// Used by the Firestore sync layer when another device pushes changes.
export function applyRemote(data) {
  if (!data) return;
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined) return;
    try {
      localStorage.setItem(nsKey(key), JSON.stringify(value));
    } catch (_) {}
    emit(key);
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

export function getInterviewCard(id) {
  return IP_BY_ID[id] || null;
}
export function getDsaProblem(id) {
  return DSA_BY_ID[id] || null;
}

// ─── Completion + notes accessors keyed by source ─────────────────────────────
function keysFor(source) {
  return source === "dsa"
    ? { completed: KEYS.DSA_COMPLETED, notes: KEYS.DSA_NOTES }
    : { completed: KEYS.IP_COMPLETED, notes: KEYS.IP_NOTES };
}

export function isSourceComplete(source, id) {
  return !!loadJSON(keysFor(source).completed, {})[id];
}

export function getSourceNote(source, id) {
  return loadJSON(keysFor(source).notes, {})[id] || "";
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
}

// ─── DSA spaced-repetition + starring ─────────────────────────────────────────
export function getDsaTimestamps() {
  return loadJSON(KEYS.DSA_TIMESTAMPS, {});
}

export function dsaDaysLeft(id) {
  const ts = loadJSON(KEYS.DSA_TIMESTAMPS, {})[id];
  if (!ts) return null;
  return DSA_REVISIT_DAYS - Math.floor((Date.now() - ts) / (24 * 60 * 60 * 1000));
}

export function isDsaStarred(id) {
  return !!loadJSON(KEYS.DSA_STARRED, {})[id];
}

export function setDsaStarred(id, value) {
  const map = loadJSON(KEYS.DSA_STARRED, {});
  map[id] = value;
  saveJSON(KEYS.DSA_STARRED, map);
}

// Auto-revert solves older than the revisit window so they can be re-attempted.
export function pruneExpiredDsaSolves() {
  const now = Date.now();
  const completed = loadJSON(KEYS.DSA_COMPLETED, {});
  const ts = loadJSON(KEYS.DSA_TIMESTAMPS, {});
  let changed = false;
  for (const [id, t] of Object.entries(ts)) {
    if (now - t >= DSA_REVISIT_MS) {
      completed[id] = false;
      delete ts[id];
      changed = true;
    }
  }
  if (changed) {
    saveJSON(KEYS.DSA_COMPLETED, completed);
    saveJSON(KEYS.DSA_TIMESTAMPS, ts);
  }
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
export function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
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
