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
  PLAN_DAYS: "PlanningDays",
};

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
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}

export function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  emit(key);
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
}

export function setSourceNote(source, id, value) {
  const key = keysFor(source).notes;
  const map = loadJSON(key, {});
  map[id] = value;
  saveJSON(key, map);
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
