// Cloud persistence: mirrors all progress (interview/DSA completion, notes,
// stars, timestamps and the planning days) to Firestore so it follows the
// account across devices and survives a refresh / re-login.
//
// Design:
//   • localStorage (namespaced per uid) is the instant local cache — on refresh
//     the UI shows the last known state immediately, no waiting on the network.
//   • Firestore is the durable, cross-device store. Writes are optimistic: the
//     UI updates synchronously, and the full document is pushed in the
//     background (debounced), so saving never blocks the UI.
//   • Loads use document-level last-write-wins (a numeric `updatedAt` rev): we
//     only overwrite the local cache when the cloud copy is strictly newer than
//     what this device last synced — so a refresh never clobbers in-session
//     edits, while another device's newer changes are pulled in live.
//
// NOTE: lock this down in the Firebase console with a security rule so only the
// owner's uid can read/write its document, e.g.
//   match /userProgress/{uid} { allow read, write: if request.auth.uid == uid; }

import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { KEYS, loadJSON, applyRemote, subscribe, setActiveUid } from "./planStore";

const SYNC_KEYS = [
  KEYS.IP_COMPLETED,
  KEYS.IP_NOTES,
  KEYS.CS_COMPLETED,
  KEYS.CS_NOTES,
  KEYS.CS_TIMESTAMPS,
  KEYS.DSA_COMPLETED,
  KEYS.DSA_NOTES,
  KEYS.DSA_TIMESTAMPS,
  KEYS.DSA_STARRED,
  KEYS.PLAN_DAYS,
  KEYS.JOB_TRACKER,
];

let currentUid = null;
let unsubscribeSnapshot = null;
let applyingRemote = false;
let pushTimer = null;
let localListenerAttached = false;
// Single-device durability bookkeeping:
//   dirty       — there are local changes not yet acknowledged by a push.
//   pushing     — a push is currently in flight (avoid overlapping writes).
//   retryTimer  — backoff timer for a failed push.
//   retryDelay  — current backoff delay, grows on each consecutive failure.
let dirty = false;
let pushing = false;
let retryTimer = null;
let retryDelay = 0;
const PUSH_DEBOUNCE_MS = 800;
const RETRY_MIN_MS = 1000;
const RETRY_MAX_MS = 30000;

function userDocRef(uid) {
  return doc(db, "userProgress", uid);
}

// The highest doc revision this device has already incorporated (pushed or
// pulled). Persisted so a refresh knows its local cache is already current.
function revKey(uid) {
  return `sync:rev:${uid}`;
}
function getLocalRev(uid) {
  return Number(localStorage.getItem(revKey(uid))) || 0;
}
function setLocalRev(uid, rev) {
  try {
    localStorage.setItem(revKey(uid), String(rev));
  } catch (_) {}
}

function collectLocal() {
  const out = {};
  SYNC_KEYS.forEach((k) => {
    out[k] = loadJSON(k, {});
  });
  return out;
}

// Core write. Resolves once Firestore has ACCEPTED the write. With offline
// persistence enabled the write is durably queued in IndexedDB even when
// offline, so this resolving means the change will reach the server (now or on
// reconnect) and cannot be lost on this device. Returns true on success.
async function doPush(uid) {
  if (!uid) return false;
  const rev = Date.now();
  await setDoc(userDocRef(uid), { ...collectLocal(), updatedAt: rev }, { merge: true });
  setLocalRev(uid, rev);
  return true;
}

// Attempt a push now. On failure, schedule a backoff retry instead of dropping
// the change silently — so a transient error can't leave the DB stale forever.
async function pushNow() {
  if (applyingRemote || !currentUid || pushing) return;
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  const uid = currentUid;
  pushing = true;
  dirty = false; // optimistic; re-set on failure
  try {
    await doPush(uid);
    retryDelay = 0; // success resets backoff
  } catch (err) {
    console.error("[cloudSync] push failed, will retry:", err);
    dirty = true; // still have unsynced changes
    retryDelay = Math.min(retryDelay ? retryDelay * 2 : RETRY_MIN_MS, RETRY_MAX_MS);
    if (currentUid) {
      retryTimer = setTimeout(() => {
        retryTimer = null;
        pushNow();
      }, retryDelay);
    }
  } finally {
    pushing = false;
  }
}

function schedulePush() {
  if (applyingRemote || !currentUid) return;
  dirty = true;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(pushNow, PUSH_DEBOUNCE_MS);
}

// Flush any pending debounced change immediately. Called when the page is being
// hidden/closed so a change made in the debounce window still reaches the
// durable write queue before the tab goes away.
function flushPending() {
  if (!currentUid) return;
  if (dirty || pushTimer) {
    pushNow();
  }
}

// Fire a synchronous-as-possible flush on the events that precede a tab
// closing, navigating away, or backgrounding. `pagehide`/`visibilitychange`
// are the reliable ones on mobile; `beforeunload` covers desktop refresh.
function attachUnloadFlush() {
  if (typeof window === "undefined") return;
  const onHide = () => flushPending();
  window.addEventListener("pagehide", onHide);
  window.addEventListener("beforeunload", onHide);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushPending();
  });
}

// Attach the local-change listener exactly once for the app's lifetime.
function ensureLocalListener() {
  if (localListenerAttached) return;
  localListenerAttached = true;
  subscribe(() => schedulePush());
  attachUnloadFlush();
}

export function startCloudSync(uid) {
  ensureLocalListener();
  if (currentUid === uid && unsubscribeSnapshot) return;
  stopCloudSync();
  currentUid = uid;
  // Scope all local reads/writes to this account before touching storage.
  setActiveUid(uid);

  unsubscribeSnapshot = onSnapshot(
    userDocRef(uid),
    (snap) => {
      if (currentUid !== uid) return;

      if (!snap.exists()) {
        // Fresh account → seed the cloud from whatever this account has locally.
        schedulePush();
        return;
      }

      // Ignore our own not-yet-acknowledged write echoes; we already have them.
      if (snap.metadata.hasPendingWrites) return;

      const data = snap.data() || {};
      const remoteRev = Number(data.updatedAt) || 0;
      // Only apply if the cloud is strictly newer than what we last synced —
      // this keeps an ordinary refresh from overwriting fresh local edits.
      if (remoteRev <= getLocalRev(uid)) return;

      const remote = {};
      SYNC_KEYS.forEach((k) => {
        if (data[k] !== undefined) remote[k] = data[k];
      });

      applyingRemote = true;
      try {
        applyRemote(remote);
      } finally {
        applyingRemote = false;
      }
      setLocalRev(uid, remoteRev);
    },
    (err) => console.error("[cloudSync] listener failed:", err)
  );
}

export function stopCloudSync() {
  // Try to flush any pending change before tearing down (e.g. on sign-out) so a
  // last-moment edit isn't stranded in the debounce window.
  flushPending();
  if (unsubscribeSnapshot) {
    unsubscribeSnapshot();
    unsubscribeSnapshot = null;
  }
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  retryDelay = 0;
  currentUid = null;
  setActiveUid(null);
}

// One-shot fetch of interview prep completions from Firestore.
// Used by InterviewPrep to hydrate from DB on load instead of browser cache.
export async function fetchIPCompletions(uid) {
  if (!uid) return {};
  try {
    const snap = await getDoc(userDocRef(uid));
    if (!snap.exists()) return {};
    return snap.data()?.[KEYS.IP_COMPLETED] || {};
  } catch (err) {
    console.error("[cloudSync] fetchIPCompletions:", err);
    return {};
  }
}
