// Cloud persistence: mirrors all progress (interview/DSA completion, notes,
// stars, timestamps and the planning days) to Firestore so it follows the
// account across devices. localStorage stays as a fast local cache; Firestore
// is the cross-device source of truth.
//
// Flow:
//   • startCloudSync(uid) on sign-in → live onSnapshot listener pulls remote
//     changes into localStorage (and the UI).
//   • Any local change (via planStore.saveJSON → subscribe) schedules a
//     debounced push of the full progress document to Firestore.
//
// NOTE: lock this down in the Firebase console with a security rule so only the
// owner's uid can read/write its document, e.g.
//   match /userProgress/{uid} { allow read, write: if request.auth.uid == uid; }

import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { KEYS, loadJSON, applyRemote, subscribe } from "./planStore";

const SYNC_KEYS = [
  KEYS.IP_COMPLETED,
  KEYS.IP_NOTES,
  KEYS.DSA_COMPLETED,
  KEYS.DSA_NOTES,
  KEYS.DSA_TIMESTAMPS,
  KEYS.DSA_STARRED,
  KEYS.PLAN_DAYS,
];

let currentUid = null;
let unsubscribeSnapshot = null;
let applyingRemote = false;
let pushTimer = null;
let localListenerAttached = false;

function userDocRef(uid) {
  return doc(db, "userProgress", uid);
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
    if (!currentUid) return;
    try {
      await setDoc(
        userDocRef(currentUid),
        { ...collectLocal(), updatedAt: Date.now() },
        { merge: true }
      );
    } catch (err) {
      console.error("[cloudSync] push failed:", err);
    }
  }, 1200);
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
  unsubscribeSnapshot = onSnapshot(
    userDocRef(uid),
    (snap) => {
      if (!snap.exists()) {
        // First sign-in on a fresh account → seed the cloud with local data.
        schedulePush();
        return;
      }
      const data = snap.data() || {};
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
}
