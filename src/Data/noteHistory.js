// Version history for notes, modelled on git.
//
//   • Every change to a note becomes a REVISION: a full snapshot of the note's
//     text and its personal notes, with the time and the device it came from.
//     Like a commit, a revision is never changed or deleted afterwards — the
//     Firestore rules only allow creating them.
//   • The note itself (in the progress document) is the "HEAD": the newest
//     version. Restoring an old revision writes it back as the newest version,
//     which is saved as a new revision in turn — nothing after it is lost.
//   • Typing is grouped: a revision when you pause for IDLE_MS, and at least
//     one every MAX_OPEN_MS while you keep going. A discrete action (a
//     highlight, a saved section, a personal note, a restore) is its own
//     revision straight away.
//
// Stored at userProgress/{uid}/history/{target}/revisions/{revisionId}, where
// target names the note ("CoreStackNotes~JAVA-01") and the revision id is
// "<time>-<device>", so revisions sort by time and a retried write can't make
// a duplicate.

import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { KEYS, loadJSON, subscribe } from "./planStore";

const NOTE_KEYS = new Set([KEYS.CS_NOTES, KEYS.AI_NOTES, KEYS.PJ_NOTES, KEYS.DSA_NOTES, KEYS.IK_NOTES, KEYS.IP_NOTES]);
const ANNOTATIONS_FOR = {
  [KEYS.CS_NOTES]: KEYS.CS_ANNOTATIONS,
  [KEYS.AI_NOTES]: KEYS.AI_ANNOTATIONS,
  [KEYS.PJ_NOTES]: KEYS.PJ_ANNOTATIONS,
};
const NOTES_FOR = Object.fromEntries(Object.entries(ANNOTATIONS_FOR).map(([notes, ann]) => [ann, notes]));

const IDLE_MS = 20 * 1000;
const MAX_OPEN_MS = 2 * 60 * 1000;
const MAX_CHARS = 900000; // a Firestore document holds at most 1 MB

export const targetOf = (notesKey, id) => `${notesKey}~${id}`;
const splitTarget = (target) => {
  const i = target.indexOf("~");
  return [target.slice(0, i), target.slice(i + 1)];
};

// ─── Content and its fingerprint ─────────────────────────────────────────────
export function contentOf(notesKey, id) {
  const annKey = ANNOTATIONS_FOR[notesKey];
  return {
    text: loadJSON(notesKey, {})[id] || "",
    annotations: annKey ? loadJSON(annKey, {})[id] || [] : null,
  };
}

// cyrb53: a fast 53-bit string hash — enough to tell two versions apart.
function cyrb53(str) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

export function hashContent({ text, annotations }) {
  return cyrb53(JSON.stringify([text || "", annotations || []]));
}

const wordCount = (s) => (String(s || "").match(/\S+/g) || []).length;

// ─── This device ─────────────────────────────────────────────────────────────
function deviceInfo() {
  let id;
  try {
    id = localStorage.getItem("hist:device");
    if (!id) {
      id = Math.random().toString(36).slice(2, 8);
      localStorage.setItem("hist:device", id);
    }
  } catch (_) {
    id = "unknown";
  }
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const os = /Android/i.test(ua)
    ? "Android"
    : /iPhone|iPad|iPod/i.test(ua)
    ? "iPhone"
    : /Mac OS X/i.test(ua)
    ? "Mac"
    : /Windows/i.test(ua)
    ? "Windows"
    : /Linux/i.test(ua)
    ? "Linux"
    : "Device";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const mobile = /Mobi|Android|iPhone/i.test(ua);
  return { id, label: `${os} · ${browser}`, mobile };
}

// ─── Writing revisions ───────────────────────────────────────────────────────
let uid = null;
let unsubscribe = null;
const open = new Map(); // target → { firstAt, timer } for typing not yet recorded
const touched = new Set(); // targets whose "before" state this session has recorded
const labelled = new Map(); // target → { reason, extra } for the next revision
let warned = false;

const lastKey = (target) => `hist:last:${uid}:${target}`;
function lastHash(target) {
  try {
    return localStorage.getItem(lastKey(target));
  } catch (_) {
    return null;
  }
}
function setLastHash(target, hash) {
  try {
    localStorage.setItem(lastKey(target), hash);
  } catch (_) {}
}

function write(target, content, { at = Date.now(), reason = "edit", extra = {} } = {}) {
  if (!uid) return;
  const hash = hashContent(content);
  const sideCopy = reason === "not-kept" || reason === "conflict"; // not what's on the page
  if (!sideCopy && hash === lastHash(target)) return; // nothing new
  const size = (content.text || "").length + JSON.stringify(content.annotations || []).length;
  if (size > MAX_CHARS) {
    console.warn(`[history] ${target} is too large to snapshot (${size} chars)`);
    return;
  }
  const device = deviceInfo();
  const id = `${at}-${device.id}`;
  if (!sideCopy) setLastHash(target, hash);
  // Not awaited: offline, Firestore queues it and sends it later — harmless,
  // since a revision is only ever created, never changed.
  setDoc(doc(db, "userProgress", uid, "history", target, "revisions", id), {
    text: content.text || "",
    annotations: content.annotations ?? null,
    at,
    savedAt: serverTimestamp(),
    device,
    words: wordCount(content.text),
    hash,
    reason,
    ...extra,
  }).catch((err) => {
    if (!warned) {
      warned = true;
      console.warn("[history] couldn't save a revision:", err?.code || err);
    }
  });
}

// Before the first change a session makes to a note, keep what it was — so
// the version being replaced is always in history, even from before history
// existed.
function recordBefore(target, prevContent) {
  if (touched.has(target)) return;
  touched.add(target);
  if (prevContent && (prevContent.text || (prevContent.annotations || []).length)) {
    write(target, prevContent, { at: Date.now() - 1, reason: "before" });
  }
}

function close(target, reason = "edit", extra) {
  const entry = open.get(target);
  if (entry) {
    clearTimeout(entry.timer);
    open.delete(target);
  }
  const label = labelled.get(target);
  if (label) {
    reason = label.reason;
    extra = label.extra;
  }
  const [notesKey, id] = splitTarget(target);
  write(target, contentOf(notesKey, id), { reason, extra });
}

function noteChanged(target) {
  const now = Date.now();
  const entry = open.get(target) || { firstAt: now, timer: null };
  clearTimeout(entry.timer);
  if (now - entry.firstAt >= MAX_OPEN_MS) {
    open.delete(target);
    close(target);
    return;
  }
  entry.timer = setTimeout(() => close(target), IDLE_MS);
  open.set(target, entry);
}

// A discrete change (highlight, saved section, personal note, restore):
// record it now rather than waiting for a pause.
export function recordNow(notesKey, id, reason = "edit", extra) {
  if (!uid) return;
  close(targetOf(notesKey, id), reason, extra);
}

// Put an old version back: `apply` writes its text (and personal notes) to the
// store, and the result is recorded as one revision marked as a restore of
// `fromId` — git's "revert": a new commit on top, history untouched.
export function restoreVersion(notesKey, id, fromId, apply) {
  const target = targetOf(notesKey, id);
  labelled.set(target, { reason: "restore", extra: { restoredFrom: fromId } });
  try {
    apply();
    if (uid) close(target);
  } finally {
    labelled.delete(target);
  }
}

// The sync layer didn't keep a local edit — older than the saved version
// ("not-kept"), or clashing with a newer one ("conflict"). It still goes into
// history, so nothing is ever silently lost.
export function recordNotKept(key, id, value, at, reason = "not-kept") {
  if (!uid || id === "*") return;
  let content;
  if (NOTE_KEYS.has(key)) content = { ...contentOf(key, id), text: typeof value === "string" ? value : "" };
  else if (NOTES_FOR[key]) content = { ...contentOf(NOTES_FOR[key], id), annotations: Array.isArray(value) ? value : [] };
  else return;
  const notesKey = NOTES_FOR[key] || key;
  write(targetOf(notesKey, id), content, { at, reason });
}

function flushAll() {
  for (const target of [...open.keys()]) close(target);
}

export function startNoteHistory(nextUid) {
  if (uid === nextUid && unsubscribe) return;
  stopNoteHistory();
  uid = nextUid;
  unsubscribe = subscribe((key, info = {}) => {
    // Only this device's own saves; other devices record their own.
    if (!uid || info.remote || info.external || info.account || info.blocked || !Array.isArray(info.ids)) return;
    const notesKey = NOTE_KEYS.has(key) ? key : NOTES_FOR[key];
    if (!notesKey) return;
    for (const id of info.ids) {
      const target = targetOf(notesKey, id);
      if (!touched.has(target)) {
        const before = contentOf(notesKey, id);
        if (key === notesKey) before.text = (info.prev && info.prev[id]) || "";
        else before.annotations = (info.prev && info.prev[id]) || [];
        recordBefore(target, before);
      }
      // Personal notes change in whole steps; typing is grouped.
      if (key === notesKey) noteChanged(target);
      else close(target);
    }
  });
  if (typeof window !== "undefined") {
    window.addEventListener("pagehide", flushAll);
    document.addEventListener("visibilitychange", onHidden);
  }
}

function onHidden() {
  if (document.visibilityState === "hidden") flushAll();
}

export function stopNoteHistory() {
  flushAll();
  if (unsubscribe) unsubscribe();
  unsubscribe = null;
  uid = null;
  touched.clear();
  if (typeof window !== "undefined") {
    window.removeEventListener("pagehide", flushAll);
    document.removeEventListener("visibilitychange", onHidden);
  }
}

// ─── Reading history ─────────────────────────────────────────────────────────
export async function listRevisions(notesKey, id, max = 100) {
  if (!uid) return [];
  const snap = await getDocs(
    query(collection(db, "userProgress", uid, "history", targetOf(notesKey, id), "revisions"), orderBy("at", "desc"), limit(max))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
