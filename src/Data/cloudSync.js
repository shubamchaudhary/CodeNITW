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

function schedulePush() {
  if (applyingRemote || !currentUid) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    const uid = currentUid;
    if (!uid) return;
    const rev = Date.now();
    try {
      await setDoc(userDocRef(uid), { ...collectLocal(), updatedAt: rev }, { merge: true });
      setLocalRev(uid, rev);
    } catch (err) {
      console.error("[cloudSync] push failed:", err);
    }
  }, 1000);
}

// Attach the local-change listener exactly once for the app's lifetime.
function ensureLocalListener() {
  if (localListenerAttached) return;
  localListenerAttached = true;
  subscribe(() => schedulePush());
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
  if (unsubscribeSnapshot) {
    unsubscribeSnapshot();
    unsubscribeSnapshot = null;
  }
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
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
