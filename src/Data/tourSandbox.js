// The site tour's sandbox: a guest's changes during the tour — the note it
// writes, the highlight, the day it plans — really happen, but into a
// throwaway copy of the store (its own localStorage namespace, "u:tour:…")
// with version history kept in memory. Leaving wipes all of it and puts the
// guest back where they were. It never runs for a signed-in account.

import { getAuthState, isSandbox, setSandbox } from "./authGate";
import { getActiveUid, setActiveUid } from "./planStore";
import { startNoteHistory, stopNoteHistory, isInMemoryHistory } from "./noteHistory";

const UID = "tour";

function clearTourKeys() {
  try {
    const prefix = `u:${UID}:`;
    const doomed = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) doomed.push(k);
    }
    doomed.forEach((k) => localStorage.removeItem(k));
  } catch (_) {}
}

let previousUid = "anon";

export function enterSandbox() {
  if (isSandbox() || getAuthState() !== "guest") return false;
  clearTourKeys(); // anything a crashed tour left behind
  previousUid = getActiveUid();
  setSandbox(true);
  setActiveUid(UID); // pages re-read: they now see the empty sandbox
  startNoteHistory(UID, { inMemory: true });
  return true;
}

export function leaveSandbox() {
  if (!isSandbox()) return;
  // Someone who signed in mid-tour already has their own history and store:
  // only undo what is still the sandbox's.
  if (isInMemoryHistory()) stopNoteHistory();
  const ours = getActiveUid() === UID;
  clearTourKeys();
  setSandbox(false);
  if (ours) setActiveUid(previousUid); // pages re-read the guest's own view
}
