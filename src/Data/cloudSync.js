// Cloud persistence: mirrors all progress (interview/DSA completion, notes,
// highlights, personal notes, stars, timestamps and the planning days) to
// Firestore so it follows the account across devices and survives a refresh
// or re-login.
//
// Design:
//   • localStorage (namespaced per uid) is the instant local cache — the UI
//     reads and writes it synchronously and never waits on the network.
//   • Every local change is recorded, per entry, in a PENDING JOURNAL that is
//     itself kept in localStorage — so it survives a refresh, a crash or a
//     closed tab, and every tab of the browser sees the same list.
//   • A push sends only the pending entries (a delete is sent as a delete) and
//     clears an entry once Firestore has acknowledged a push taken after its
//     last change. A change made while a push is in flight stays pending and
//     goes in the next push.
//   • Data arriving from Firestore is applied UNDER the journal: every pending
//     entry keeps its local value. A slow acknowledgement, a refresh, or
//     another tab can therefore never roll back an edit that hasn't reached
//     the cloud yet.
//
// NOTE: lock this down in the Firebase console with a security rule so only the
// owner's uid can read/write its document, e.g.
//   match /userProgress/{uid} { allow read, write: if request.auth.uid == uid; }

import { doc, onSnapshot, setDoc, getDoc, deleteField, FieldPath } from "firebase/firestore";
import { db } from "../firebase";
import { KEYS, loadJSON, applyRemote, subscribe, setActiveUid, changedIds } from "./planStore";

const SYNC_KEYS = [
  KEYS.IP_COMPLETED,
  KEYS.IP_NOTES,
  KEYS.CS_COMPLETED,
  KEYS.CS_NOTES,
  KEYS.CS_TIMESTAMPS,
  KEYS.CS_ANNOTATIONS,
  KEYS.CS_LEARNT,
  KEYS.AI_COMPLETED,
  KEYS.AI_NOTES,
  KEYS.AI_TIMESTAMPS,
  KEYS.AI_ANNOTATIONS,
  KEYS.AI_LEARNT,
  KEYS.DSA_COMPLETED,
  KEYS.DSA_NOTES,
  KEYS.DSA_TIMESTAMPS,
  KEYS.DSA_STARRED,
  KEYS.IK_COMPLETED,
  KEYS.IK_NOTES,
  KEYS.PLAN_DAYS,
  KEYS.JOB_TRACKER,
];
const SYNCED = new Set(SYNC_KEYS);
const WHOLE = "*"; // journal marker: the whole key changed, not single entries

let currentUid = null;
let unsubscribeSnapshot = null;
let applyingRemote = false;
let pushTimer = null;
let retryTimer = null;
let retryDelay = 0;
let pushing = false;
let listenersAttached = false;
const PUSH_DEBOUNCE_MS = 800;
const RETRY_MIN_MS = 1000;
const RETRY_MAX_MS = 30000;

function userDocRef(uid) {
  return doc(db, "userProgress", uid);
}

const isMap = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

// ─── Sync status, for the UI ─────────────────────────────────────────────────
// synced   everything local is in the cloud
// pending  local changes waiting for the debounce / next push
// syncing  a push is on its way
// offline  local changes waiting for the network
// error    the last push failed; retrying
let status = { state: "synced" };
const statusListeners = new Set();

function setStatus(state, detail = "") {
  if (status.state === state && status.detail === detail) return;
  status = { state, detail, at: Date.now() };
  statusListeners.forEach((fn) => {
    try {
      fn(status);
    } catch (_) {}
  });
}

export function getSyncStatus() {
  return status;
}

export function subscribeSyncStatus(fn) {
  statusListeners.add(fn);
  return () => statusListeners.delete(fn);
}

function waitingState() {
  return typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "syncing";
}

// ─── The pending journal ─────────────────────────────────────────────────────
// { [key]: { [entryId]: changedAtMs } }, per account, in localStorage.
function journalKey(uid) {
  return `sync:pending:${uid}`;
}

function loadJournal(uid) {
  try {
    return JSON.parse(localStorage.getItem(journalKey(uid))) || {};
  } catch (_) {
    return {};
  }
}

function saveJournal(uid, journal) {
  try {
    if (Object.keys(journal).length) localStorage.setItem(journalKey(uid), JSON.stringify(journal));
    else localStorage.removeItem(journalKey(uid));
  } catch (_) {}
}

function hasPending(uid) {
  return Object.keys(loadJournal(uid)).length > 0;
}

function recordPending(uid, key, ids) {
  const journal = loadJournal(uid);
  const entries = journal[key] || (journal[key] = {});
  const now = Date.now();
  for (const id of ids || [WHOLE]) entries[id] = now;
  saveJournal(uid, journal);
}

// After an acknowledged push: forget every entry whose last change is covered
// by it. Anything changed after the push was taken stays pending.
function clearAcknowledged(uid, takenAt) {
  const journal = loadJournal(uid);
  for (const key of Object.keys(journal)) {
    for (const [id, at] of Object.entries(journal[key])) if (at <= takenAt) delete journal[key][id];
    if (!Object.keys(journal[key]).length) delete journal[key];
  }
  saveJournal(uid, journal);
}

// ─── Push ────────────────────────────────────────────────────────────────────
// Only the pending entries, each written (or deleted) at its own field path, so
// a push can't overwrite entries this browser never touched — and deletions
// actually reach the cloud.
async function doPush(uid) {
  const journal = loadJournal(uid);
  const keys = Object.keys(journal).filter((k) => SYNCED.has(k));
  if (!keys.length) return;

  const takenAt = Date.now();
  const data = { updatedAt: takenAt };
  const fields = [new FieldPath("updatedAt")];
  for (const key of keys) {
    const local = loadJSON(key, {});
    const ids = Object.keys(journal[key]);
    if (ids.includes(WHOLE) || !isMap(local)) {
      data[key] = local;
      fields.push(new FieldPath(key));
      continue;
    }
    data[key] = {};
    for (const id of ids) {
      data[key][id] = local[id] === undefined ? deleteField() : local[id];
      fields.push(new FieldPath(key, id));
    }
  }

  // Resolves when Firestore has acknowledged the write. Offline, the write is
  // queued in IndexedDB and this waits — the journal keeps the entries pending
  // until then, whatever happens to this tab.
  await setDoc(userDocRef(uid), data, { mergeFields: fields });
  if (currentUid === uid) clearAcknowledged(uid, takenAt);
}

async function pushNow() {
  const uid = currentUid;
  if (!uid || applyingRemote) return;
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  if (pushing) return; // the in-flight push re-checks the journal when it lands
  if (!hasPending(uid)) {
    setStatus("synced");
    return;
  }
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }

  pushing = true;
  setStatus(waitingState());
  let ok = false;
  try {
    await doPush(uid);
    ok = true;
    retryDelay = 0;
  } catch (err) {
    console.error("[cloudSync] push failed, will retry:", err);
    retryDelay = Math.min(retryDelay ? retryDelay * 2 : RETRY_MIN_MS, RETRY_MAX_MS);
    setStatus("error", err?.code || "");
    if (currentUid === uid) {
      retryTimer = setTimeout(() => {
        retryTimer = null;
        pushNow();
      }, retryDelay);
    }
  } finally {
    pushing = false;
  }

  // Changes that arrived while this push was in flight go out now.
  if (ok && currentUid === uid) {
    if (hasPending(uid)) schedulePush(0);
    else setStatus("synced");
  }
}

function schedulePush(delay = PUSH_DEBOUNCE_MS) {
  if (!currentUid) return;
  if (!pushing) setStatus("pending");
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(pushNow, delay);
}

// Flush any pending change immediately. Called when the page is being
// hidden/closed so a change made in the debounce window is handed to
// Firestore's durable queue before the tab goes away. (If it isn't, the
// journal still has it and the next visit pushes it.)
function flushPending() {
  if (currentUid && hasPending(currentUid)) pushNow();
}

// ─── Pull ────────────────────────────────────────────────────────────────────
// Cloud data with every pending local entry laid back on top.
function mergeUnderPending(uid, data) {
  const journal = loadJournal(uid);
  const out = {};
  for (const key of SYNC_KEYS) {
    if (data[key] === undefined) continue;
    const pending = journal[key];
    if (!pending) {
      out[key] = data[key];
      continue;
    }
    if (pending[WHOLE] || !isMap(data[key])) continue; // local owns the whole key until pushed
    const local = loadJSON(key, {});
    const merged = { ...data[key] };
    for (const id of Object.keys(pending)) {
      if (local[id] === undefined) delete merged[id];
      else merged[id] = local[id];
    }
    out[key] = merged;
  }
  return out;
}

// One-time upgrade from the old document-level sync, which had no journal:
// changes it never managed to push are only in localStorage. The old rule was
// "the cloud wins only if its revision is newer than the last one this browser
// synced", so honour that once — if the cloud isn't newer, every local entry
// that differs from it becomes pending instead of being overwritten.
function migrateOnce(uid, data) {
  const marker = `sync:v2:${uid}`;
  if (localStorage.getItem(marker)) return;
  const lastRev = Number(localStorage.getItem(`sync:rev:${uid}`)) || 0;
  const remoteRev = Number(data.updatedAt) || 0;
  if (remoteRev <= lastRev) {
    for (const key of SYNC_KEYS) {
      const local = loadJSON(key, undefined);
      if (local === undefined) continue;
      const remote = data[key];
      if (remote === undefined) {
        recordPending(uid, key, null);
        continue;
      }
      const ids = changedIds(remote, local);
      if (ids === null) {
        if (JSON.stringify(remote) !== JSON.stringify(local)) recordPending(uid, key, null);
      } else {
        // Only entries this browser has; an entry missing here is not a delete.
        const differing = ids.filter((id) => local[id] !== undefined);
        if (differing.length) recordPending(uid, key, differing);
      }
    }
  }
  try {
    localStorage.setItem(marker, "1");
    localStorage.removeItem(`sync:rev:${uid}`);
  } catch (_) {}
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────
function attachListeners() {
  if (listenersAttached) return;
  listenersAttached = true;

  // Local saves: journal the changed entries, then push. Cloud applications
  // and other tabs' writes aren't ours to journal (the writing tab did that).
  subscribe((key, info = {}) => {
    if (!currentUid || applyingRemote || !SYNCED.has(key)) return;
    // Only a real local save is ours to push — not cloud data, another tab's
    // write, an account switch, or a guest's refused write.
    if (info.remote || info.external || info.account || info.blocked) return;
    recordPending(currentUid, key, info.ids);
    schedulePush();
  });

  if (typeof window === "undefined") return;
  const onHide = () => flushPending();
  window.addEventListener("pagehide", onHide);
  window.addEventListener("beforeunload", onHide);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushPending();
  });
  window.addEventListener("online", () => {
    if (currentUid && hasPending(currentUid)) {
      retryDelay = 0;
      pushNow();
    }
  });
  window.addEventListener("offline", () => {
    if (currentUid && hasPending(currentUid)) setStatus("offline");
  });
}

export function startCloudSync(uid) {
  attachListeners();
  if (currentUid === uid && unsubscribeSnapshot) return;
  stopCloudSync();
  currentUid = uid;
  // Scope all local reads/writes to this account before touching storage.
  setActiveUid(uid);

  unsubscribeSnapshot = onSnapshot(
    userDocRef(uid),
    { includeMetadataChanges: true },
    (snap) => {
      if (currentUid !== uid) return;

      if (!snap.exists()) {
        // Fresh account → seed the cloud from whatever this account has locally.
        for (const key of SYNC_KEYS) if (loadJSON(key, undefined) !== undefined) recordPending(uid, key, null);
        schedulePush(0);
        return;
      }

      // Our own writes, not yet acknowledged: local already has them.
      if (snap.metadata.hasPendingWrites) return;

      const data = snap.data() || {};
      migrateOnce(uid, data);
      applyingRemote = true;
      try {
        applyRemote(mergeUnderPending(uid, data));
      } finally {
        applyingRemote = false;
      }
      if (hasPending(uid)) schedulePush();
    },
    (err) => {
      console.error("[cloudSync] listener failed:", err);
      setStatus("error", err?.code || "");
    }
  );

  // Anything a previous visit couldn't push goes out now.
  if (hasPending(uid)) schedulePush(0);
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
