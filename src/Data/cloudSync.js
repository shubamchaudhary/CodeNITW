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
//   • Nothing is pushed until this session has heard from the server.
//
// NOTES (note text and personal notes) are versioned like git, fast-forward
// only. Each note has a revision number in the cloud (`_rev`). An edit
// remembers the revision it started from (its base); saving it names that
// base, and the Firestore rules refuse the save unless the base is still the
// newest revision. So an edit made on an out-of-date copy — a phone that
// missed the laptop's change — can never land on top of a newer version.
// When that happens, the device does what git does:
//   • it fetches the newer version and merges both edits line by line (a
//     three-way merge against the base); if they touched different parts,
//     both are kept and saved as the next revision;
//   • if both changed the same lines, the newer version stays, and this
//     device's edit is saved to the note's history as a conflicting copy.
//
// EVERYTHING ELSE (ticks, plans, the job tracker…) is decided per entry by
// edit time: the newer edit wins; an old unsent edit loses to a newer saved
// one; and if the cloud goes back in time for an entry, a device holding the
// newer copy puts it back.
//
// See firestore.rules for the server side of both.

import { doc, onSnapshot, setDoc, getDoc, deleteField, FieldPath } from "firebase/firestore";
import { db } from "../firebase";
import { KEYS, loadJSON, applyRemote, subscribe, setActiveUid, changedIds } from "./planStore";
import { merge3, mergeById } from "./merge3";
import { recordNotKept, recordNow } from "./noteHistory";

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
  KEYS.PJ_COMPLETED,
  KEYS.PJ_NOTES,
  KEYS.PJ_TIMESTAMPS,
  KEYS.PJ_ANNOTATIONS,
  KEYS.PJ_LEARNT,
  KEYS.DSA_COMPLETED,
  KEYS.DSA_NOTES,
  KEYS.DSA_TIMESTAMPS,
  KEYS.DSA_STARRED,
  KEYS.IK_COMPLETED,
  KEYS.IK_NOTES,
  KEYS.PLAN_DAYS,
  KEYS.TIME_LOG,
  KEYS.JOB_TRACKER,
];
const SYNCED = new Set(SYNC_KEYS);
// Versioned, fast-forward-only keys. Keep in step with noteFields() in
// firestore.rules.
export const VERSIONED = new Set([
  KEYS.CS_NOTES,
  KEYS.CS_ANNOTATIONS,
  KEYS.AI_NOTES,
  KEYS.AI_ANNOTATIONS,
  KEYS.PJ_NOTES,
  KEYS.PJ_ANNOTATIONS,
  KEYS.DSA_NOTES,
  KEYS.IK_NOTES,
  KEYS.IP_NOTES,
]);
const TEXT_KEYS = new Set([KEYS.CS_NOTES, KEYS.AI_NOTES, KEYS.PJ_NOTES, KEYS.DSA_NOTES, KEYS.IK_NOTES, KEYS.IP_NOTES]);
// Personal notes (annotations) belong to the note text they're pinned to.
const NOTES_OF = { [KEYS.CS_ANNOTATIONS]: KEYS.CS_NOTES, [KEYS.AI_ANNOTATIONS]: KEYS.AI_NOTES, [KEYS.PJ_ANNOTATIONS]: KEYS.PJ_NOTES };
const WHOLE = "*"; // journal marker: the whole key changed, not single entries
const META = "_meta"; // cloud: { key: { entryId: editedAtMs } } for unversioned keys
const REV = "_rev"; // cloud: { key: { entryId: revision } } — each note's head
const WRITE = "_write"; // cloud: { key, id, base } — what a note save changed, on top of what
// Device clocks drift a little; "the cloud went back in time" only counts when
// it went back by more than this, so two slightly-off clocks can't keep
// undoing each other.
const SKEW_MS = 5 * 60 * 1000;

let currentUid = null;
let unsubscribeSnapshot = null;
let applyingRemote = false;
let serverReady = false; // this session has reconciled with the server
let sessionStartedAt = 0;
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
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

// ─── Sync status and notices, for the UI ─────────────────────────────────────
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

// { type: "merged" | "conflict", key, id } — a note that was edited on two
// devices at once, and what happened to it. { type: "size", bytes } — the
// account's synced data is nearing Firestore's 1 MiB document limit.
const noticeListeners = new Set();
export function onSyncNotice(fn) {
  noticeListeners.add(fn);
  return () => noticeListeners.delete(fn);
}
function notice(n) {
  noticeListeners.forEach((fn) => {
    try {
      fn(n);
    } catch (_) {}
  });
}

// A Firestore document holds at most 1 MiB, and this one holds all of an
// account's progress and notes. Say so well before a save gets refused.
const SIZE_WARN_BYTES = 800 * 1024;
let sizeWarned = false;
let sizeCheckedAt = 0;
function warnIfLarge(data) {
  if (sizeWarned || Date.now() - sizeCheckedAt < 60 * 1000) return;
  sizeCheckedAt = Date.now();
  let bytes = 0;
  try {
    bytes = new TextEncoder().encode(JSON.stringify(data)).length;
  } catch (_) {
    return;
  }
  if (bytes < SIZE_WARN_BYTES) return;
  sizeWarned = true;
  notice({ type: "size", bytes });
}

function waitingState() {
  return typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "syncing";
}

// ─── Small persisted maps ────────────────────────────────────────────────────
// journal: { key: { id: editedAtMs } }      changes not yet in the cloud
// meta:    { key: { id: editedAtMs } }      when this copy of an entry was edited
// heads:   { key: { id: revision } }        the note revision this copy matches
// bases:   { key: { id: { rev, copy } } }   for a note being edited: the
//                                           revision and text it started from
function readMap(name) {
  try {
    return JSON.parse(localStorage.getItem(name)) || {};
  } catch (_) {
    return {};
  }
}
function writeMap(name, value) {
  try {
    const empty = !Object.keys(value).some((k) => !isMap(value[k]) || Object.keys(value[k]).length);
    if (!empty) localStorage.setItem(name, JSON.stringify(value));
    else localStorage.removeItem(name);
  } catch (_) {}
}
const store = (suffix) => ({
  load: (uid) => readMap(`sync:${suffix}:${uid}`),
  save: (uid, v) => writeMap(`sync:${suffix}:${uid}`, v),
});
const journalStore = store("pending");
const metaStore = store("meta");
const headStore = store("heads");
const baseStore = store("base");
const loadJournal = journalStore.load;
const saveJournal = journalStore.save;

function hasPending(uid) {
  const j = loadJournal(uid);
  return Object.keys(j).some((k) => Object.keys(j[k] || {}).length);
}

function recordPending(uid, key, ids, { at = Date.now(), prev, baseRev } = {}) {
  const journal = loadJournal(uid);
  const meta = metaStore.load(uid);
  const entries = journal[key] || (journal[key] = {});
  const times = meta[key] || (meta[key] = {});
  const versioned = VERSIONED.has(key) && ids;
  const heads = versioned ? headStore.load(uid) : null;
  const bases = versioned ? baseStore.load(uid) : null;
  for (const id of ids || [WHOLE]) {
    // A note edit starting now remembers what it started from.
    if (versioned && entries[id] === undefined && !(bases[key] && bases[key][id])) {
      (bases[key] || (bases[key] = {}))[id] = {
        rev: baseRev !== undefined ? baseRev : heads[key]?.[id] ?? null,
        copy: prev === undefined ? undefined : prev[id] ?? null,
      };
    }
    entries[id] = at;
    times[id] = at;
  }
  saveJournal(uid, journal);
  metaStore.save(uid, meta);
  if (versioned) baseStore.save(uid, bases);
}

function dropPending(uid, key, id) {
  const journal = loadJournal(uid);
  if (journal[key]) {
    delete journal[key][id];
    if (!Object.keys(journal[key]).length) delete journal[key];
    saveJournal(uid, journal);
  }
  const bases = baseStore.load(uid);
  if (bases[key]) {
    delete bases[key][id];
    baseStore.save(uid, bases);
  }
}

function setHead(uid, key, id, rev) {
  const heads = headStore.load(uid);
  (heads[key] || (heads[key] = {}))[id] = rev;
  headStore.save(uid, heads);
}

// ─── Deciding a note that both sides have touched ────────────────────────────
// ours: this device's pending edit; theirs: the cloud's head at `theirRev`.
// → { take: "ours" | "theirs" | "merged", value?, rebase? }
function decideNote(key, base, ours, theirs, theirRev) {
  if (base && base.rev !== null && theirRev < base.rev) return { take: "ours" }; // a snapshot behind us: old news
  // Has the cloud's copy moved since this edit started? The content decides
  // when it's known (a save from an older version of the app changes the
  // text without moving the revision); otherwise the revision does.
  const unmoved = base && (base.copy !== undefined ? same(base.copy, theirs) : base.rev !== null && base.rev === theirRev);
  if (unmoved) return { take: "ours", rebase: base.rev !== theirRev }; // fast-forward
  if (same(ours, theirs)) return { take: "theirs" };
  // The head moved while we were editing: try to keep both.
  if (base && base.copy !== undefined) {
    const m = TEXT_KEYS.has(key)
      ? merge3(base.copy ?? "", ours ?? "", theirs ?? "")
      : mergeById(base.copy, ours, theirs);
    if (m.ok) return { take: "merged", value: TEXT_KEYS.has(key) ? m.text : m.value };
  }
  return { take: "conflict" };
}

// ─── Push ────────────────────────────────────────────────────────────────────
async function doPush(uid) {
  const journal = loadJournal(uid);
  const keys = Object.keys(journal).filter((k) => SYNCED.has(k) && Object.keys(journal[k]).length);
  if (!keys.length) return;

  // 1. Unversioned keys: one write, each entry with its edit time.
  const plain = keys.filter((k) => !VERSIONED.has(k));
  if (plain.length) {
    const takenAt = Date.now();
    const data = { updatedAt: takenAt, [META]: {} };
    const fields = [new FieldPath("updatedAt")];
    const sent = {};
    for (const key of plain) {
      const local = loadJSON(key, {});
      const pending = journal[key];
      sent[key] = { ...pending };
      data[META][key] = {};
      const ids = Object.keys(pending);
      if (ids.includes(WHOLE) || !isMap(local)) {
        data[key] = local;
        fields.push(new FieldPath(key));
        data[META][key][WHOLE] = pending[WHOLE] ?? Math.max(...Object.values(pending));
        fields.push(new FieldPath(META, key, WHOLE));
        continue;
      }
      data[key] = {};
      for (const id of ids) {
        data[key][id] = local[id] === undefined ? deleteField() : local[id];
        fields.push(new FieldPath(key, id));
        data[META][key][id] = pending[id]; // kept after a delete: a tombstone
        fields.push(new FieldPath(META, key, id));
      }
    }
    await setDoc(userDocRef(uid), data, { mergeFields: fields });
    if (currentUid !== uid) return;
    const j = loadJournal(uid);
    for (const key of plain) {
      for (const [id, at] of Object.entries(sent[key])) if (j[key] && j[key][id] === at) delete j[key][id];
      if (j[key] && !Object.keys(j[key]).length) delete j[key];
    }
    saveJournal(uid, j);
  }

  // 2. Notes: one write per note, naming the revision it's based on. The
  //    rules refuse it unless that revision is still the head. A note the
  //    server keeps refusing mustn't hold up the others: push the rest, then
  //    fail the push so it's retried with backoff.
  let stuck = null;
  for (const key of keys.filter((k) => VERSIONED.has(k))) {
    for (const id of Object.keys(journal[key])) {
      if (currentUid !== uid) return;
      try {
        await pushNote(uid, key, id);
      } catch (err) {
        stuck ||= err;
      }
    }
  }
  if (stuck) throw stuck;
}

async function pushNote(uid, key, id) {
  const journal = loadJournal(uid);
  const at = journal[key]?.[id];
  if (at === undefined) return;
  let base = baseStore.load(uid)[key]?.[id];
  if (!base || base.rev === null) {
    // No known base (a brand-new note, or an edit from before this device
    // knew the cloud's revisions): let the server's current copy decide.
    const snap = await getDoc(userDocRef(uid));
    if (currentUid !== uid) return;
    settleNotes(uid, snap.exists() ? snap.data() || {} : {}, [[key, id]]);
    base = baseStore.load(uid)[key]?.[id];
    if (!base || base.rev === null || loadJournal(uid)[key]?.[id] === undefined) return;
  }

  const value = loadJSON(key, {})[id];
  const rev = base.rev + 1;
  const data = {
    updatedAt: Date.now(),
    [key]: { [id]: value === undefined ? deleteField() : value },
    [REV]: { [key]: { [id]: rev } },
    [WRITE]: { key, id, base: base.rev },
  };
  try {
    await setDoc(userDocRef(uid), data, {
      mergeFields: [new FieldPath("updatedAt"), new FieldPath(key, id), new FieldPath(REV, key, id), new FieldPath(WRITE)],
    });
  } catch (err) {
    if (err?.code !== "permission-denied") throw err;
    // Refused: the head moved on. Fetch it and decide, exactly as a snapshot would.
    const snap = await getDoc(userDocRef(uid));
    if (currentUid === uid && snap.exists()) settleNotes(uid, snap.data() || {}, [[key, id]]);
    // Still pending on the same base: the head hadn't moved, so this wasn't a
    // conflict to resolve (e.g. rules that don't know this note field yet).
    // Fail the push so it backs off and retries, rather than spinning.
    const after = baseStore.load(uid)[key]?.[id];
    if (currentUid === uid && loadJournal(uid)[key]?.[id] !== undefined && after && after.rev === base.rev) throw err;
    return;
  }
  if (currentUid !== uid) return;
  setHead(uid, key, id, rev);
  const now = loadJournal(uid)[key]?.[id];
  if (now === at) {
    dropPending(uid, key, id);
  } else {
    // Edited again while this was on its way: the next save builds on it.
    const bases = baseStore.load(uid);
    (bases[key] || (bases[key] = {}))[id] = { rev, copy: value ?? null };
    baseStore.save(uid, bases);
  }
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
  // Not before this session has compared notes with the server: the first
  // server snapshot schedules the push once it has reconciled.
  if (!serverReady) {
    setStatus(typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "pending");
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

// ─── Pull: reconcile the cloud with this device ──────────────────────────────
// Notes: pending edits are decided against the cloud's head (see decideNote);
// everything not pending simply takes the cloud's version and its revision.
// `only` limits it to some [key, id] pairs (after a refused save).
function settleNotes(uid, data, only = null) {
  const journal = loadJournal(uid);
  const bases = baseStore.load(uid);
  const heads = headStore.load(uid);
  const remoteRevs = isMap(data[REV]) ? data[REV] : {};
  const out = {};
  const after = []; // history + notices, once the store has the result

  for (const key of VERSIONED) {
    const wanted = only ? only.filter(([k]) => k === key).map(([, id]) => id) : null;
    if (only && !wanted.length) continue;
    const remote = isMap(data[key]) ? data[key] : {};
    const local = loadJSON(key, undefined);
    const localMap = isMap(local) ? local : {};
    const revs = isMap(remoteRevs[key]) ? remoteRevs[key] : {};
    const pending = journal[key] || {};
    const keyHeads = heads[key] || (heads[key] = {});
    // A full snapshot starts from the cloud's map; a single refused save
    // changes only its own entry.
    const result = only ? { ...localMap } : { ...remote };
    const put = (id, v) => {
      if (v === undefined) delete result[id];
      else result[id] = v;
    };
    const ids = wanted || [...new Set([...Object.keys(remote), ...Object.keys(localMap), ...Object.keys(pending)])];

    for (const id of ids) {
      const theirRev = Number(revs[id]) || 0;
      const theirs = remote[id];
      if (pending[id] === undefined) {
        if ((keyHeads[id] ?? -1) > theirRev) {
          put(id, localMap[id]); // this copy is ahead of the snapshot: keep it
          continue;
        }
        keyHeads[id] = theirRev;
        put(id, theirs);
        continue;
      }
      const ours = localMap[id];
      const base = bases[key]?.[id];
      const d = decideNote(key, base, ours, theirs, theirRev);
      if (d.take === "ours") {
        if (d.rebase) bases[key][id] = { ...base, rev: theirRev };
        put(id, ours);
      } else if (d.take === "merged") {
        (bases[key] || (bases[key] = {}))[id] = { rev: theirRev, copy: theirs ?? null };
        put(id, d.value);
        after.push({ type: "merged", key, id });
      } else {
        // "theirs" (already identical) or "conflict": the cloud's head stands.
        if (d.take === "conflict") after.push({ type: "conflict", key, id, ours, at: pending[id] });
        delete pending[id];
        if (bases[key]) delete bases[key][id];
        keyHeads[id] = theirRev;
        put(id, theirs);
      }
    }
    if (!Object.keys(pending).length) delete journal[key];
    else journal[key] = pending;
    out[key] = result;
  }

  saveJournal(uid, journal);
  baseStore.save(uid, bases);
  headStore.save(uid, heads);

  if (only) {
    applyingRemote = true;
    try {
      applyRemote(out);
    } finally {
      applyingRemote = false;
    }
    finishNotes(after);
    return null;
  }
  return { data: out, after };
}

// History and notices for notes decided above, once the store holds the result.
function finishNotes(after) {
  for (const a of after) {
    const notesKey = TEXT_KEYS.has(a.key) ? a.key : NOTES_OF[a.key];
    if (a.type === "conflict") recordNotKept(a.key, a.id, a.ours, a.at, "conflict");
    else recordNow(notesKey, a.id, "merge");
    notice({ type: a.type, key: a.key, id: a.id });
  }
}

// Everything else: for every entry both sides have an opinion on, the newer
// edit wins.
//   • An entry the cloud has no edit time for yet (saved before edit times
//     existed) counts as edited when the document was last pushed — when the
//     local edit is from before this session (an old unsent edit, the risky
//     kind), which then loses to it. An edit made during this session wins.
//   • A pending local edit that's newer stays, and is pushed.
//   • A pending local edit that's older is dropped.
//   • An entry the cloud has moved BACK in time (older than what this device
//     already had) is put back: this device's newer copy is kept and pushed.
export function reconcile(uid, data, since = sessionStartedAt) {
  const journal = loadJournal(uid);
  const meta = metaStore.load(uid);
  const remoteMeta = isMap(data[META]) ? data[META] : {};
  const docAt = Number(data.updatedAt) || 0;
  const out = {};

  for (const key of SYNC_KEYS) {
    if (VERSIONED.has(key) || data[key] === undefined) continue;
    const remote = data[key];
    const local = loadJSON(key, undefined);
    const rMeta = isMap(remoteMeta[key]) ? remoteMeta[key] : {};
    const lMeta = meta[key] || (meta[key] = {});
    const pending = journal[key];
    const remoteAt = (id, localAt) => {
      const m = rMeta[id] ?? rMeta[WHOLE];
      if (m !== undefined) return Number(m) || 0;
      return localAt >= since ? 0 : docAt;
    };
    const wentBack = (id) => rMeta[id] !== undefined && (lMeta[id] || 0) - rMeta[id] > SKEW_MS;

    // A key that isn't a map (or changed as a whole) is decided as one entry.
    if (!isMap(remote) || !isMap(local) || (pending && pending[WHOLE])) {
      if (pending) {
        const localAt = pending[WHOLE] ?? Math.max(...Object.values(pending));
        if (localAt > remoteAt(WHOLE, localAt)) continue; // ours is newer: keep it, push it
        delete journal[key];
      } else if (wentBack(WHOLE) && !same(local, remote)) {
        journal[key] = { [WHOLE]: lMeta[WHOLE] }; // the cloud went back: restore ours
        continue;
      }
      if (rMeta[WHOLE] !== undefined) lMeta[WHOLE] = rMeta[WHOLE];
      out[key] = remote;
      continue;
    }

    const merged = { ...remote };
    const ids = new Set([...Object.keys(remote), ...Object.keys(local), ...Object.keys(pending || {})]);
    for (const id of ids) {
      if (pending && pending[id] !== undefined) {
        const localAt = pending[id];
        if (localAt > remoteAt(id, localAt)) {
          if (local[id] === undefined) delete merged[id];
          else merged[id] = local[id];
          continue;
        }
        delete pending[id];
      } else if (wentBack(id) && !same(local[id], remote[id])) {
        // The cloud went back in time for this entry: keep ours and push it.
        if (local[id] === undefined) delete merged[id];
        else merged[id] = local[id];
        (journal[key] || (journal[key] = {}))[id] = lMeta[id];
        continue;
      }
      if (rMeta[id] !== undefined) lMeta[id] = rMeta[id];
    }
    if (pending && !Object.keys(pending).length) delete journal[key];
    out[key] = merged;
  }

  saveJournal(uid, journal);
  metaStore.save(uid, meta);
  const notes = settleNotes(uid, data);
  return { data: { ...out, ...notes.data }, after: notes.after };
}

// One-time upgrade from the old document-level sync, which had no journal:
// changes it never managed to push are only in localStorage. The old rule was
// "the cloud wins only if its revision is newer than the last one this browser
// synced", so honour that once — if the cloud isn't newer, every local entry
// that differs from it becomes pending, dated to that last sync (not to now,
// which would make old data look fresh). A note recorded this way has no known
// base, so it only lands if the cloud's copy is unchanged.
function migrateOnce(uid, data) {
  const marker = `sync:v2:${uid}`;
  if (localStorage.getItem(marker)) return;
  const lastRev = Number(localStorage.getItem(`sync:rev:${uid}`)) || 0;
  const remoteRev = Number(data.updatedAt) || 0;
  if (lastRev && remoteRev <= lastRev) {
    for (const key of SYNC_KEYS) {
      const local = loadJSON(key, undefined);
      if (local === undefined) continue;
      const remote = data[key];
      if (remote === undefined) {
        recordPending(uid, key, VERSIONED.has(key) && isMap(local) ? Object.keys(local) : null, { at: lastRev });
        continue;
      }
      const ids = changedIds(remote, local);
      if (ids === null) {
        if (!same(remote, local)) recordPending(uid, key, null, { at: lastRev });
      } else {
        // Only entries this browser has; an entry missing here is not a delete.
        const differing = ids.filter((id) => local[id] !== undefined);
        if (differing.length) recordPending(uid, key, differing, { at: lastRev });
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
    recordPending(currentUid, key, info.ids, { prev: info.prev || {} });
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
  serverReady = false;
  sessionStartedAt = Date.now();
  sizeWarned = false;
  sizeCheckedAt = 0;
  // Scope all local reads/writes to this account before touching storage.
  setActiveUid(uid);

  unsubscribeSnapshot = onSnapshot(
    userDocRef(uid),
    { includeMetadataChanges: true },
    (snap) => {
      if (currentUid !== uid) return;
      const fromServer = !snap.metadata.fromCache;

      if (!snap.exists()) {
        // A cached "doesn't exist" proves nothing; wait for the server.
        if (!fromServer) return;
        // Fresh account → seed the cloud from whatever this account has locally.
        for (const key of SYNC_KEYS) {
          const local = loadJSON(key, undefined);
          if (local === undefined) continue;
          if (VERSIONED.has(key) && isMap(local)) recordPending(uid, key, Object.keys(local), { prev: {}, baseRev: 0 });
          else recordPending(uid, key, null);
        }
        serverReady = true;
        schedulePush(0);
        return;
      }

      // Our own writes, not yet acknowledged: local already has them.
      if (snap.metadata.hasPendingWrites) return;

      const data = snap.data() || {};
      if (fromServer) {
        migrateOnce(uid, data);
        warnIfLarge(data);
      }
      const { data: merged, after } = reconcile(uid, data);
      applyingRemote = true;
      try {
        applyRemote(merged);
      } finally {
        applyingRemote = false;
      }
      finishNotes(after);

      if (fromServer) serverReady = true;
      if (hasPending(uid)) schedulePush(serverReady ? PUSH_DEBOUNCE_MS : 0);
      else if (serverReady) setStatus("synced");
    },
    (err) => {
      console.error("[cloudSync] listener failed:", err);
      setStatus("error", err?.code || "");
    }
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
  serverReady = false;
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
