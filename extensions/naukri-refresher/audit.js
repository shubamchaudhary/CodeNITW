// The finder's audit trail: what it saw and what it decided about every listing, so you can check
// its work. One entry per listing judged (its card, the decision and the reason, how far it got:
// the card or the JD, its JD match, its rating, whether it reached your site), kept 3 days; and
// for a kept job the JD text and the rating's prompt and raw answer. All of it stays in this
// browser (storage.local); the report page (jobs-report.html) reads it, nothing else does.

const ext = globalThis.browser ?? globalThis.chrome;
const AK = 'jobsAudit';
const DK = 'jobsAuditDoc';
export const AUDIT_KEEP_MS = 3 * 24 * 3_600_000;
const MAX_ENTRIES = 6000;
const SAVE_EVERY_MS = 3000;

let entries = null; // id → entry
let docs = null; // id → { jd, dbg }
let dirty = false;
let savedAt = 0;
let loading = null;

const prune = (now) => {
  const cut = now - AUDIT_KEEP_MS;
  for (const [id, e] of Object.entries(entries)) if (!e.pending && (e.t || 0) < cut) { delete entries[id]; delete docs[id]; }
  const ids = Object.keys(entries);
  if (ids.length > MAX_ENTRIES) {
    ids.filter(id => !entries[id].pending).sort((a, b) => (entries[a].t || 0) - (entries[b].t || 0)).slice(0, ids.length - MAX_ENTRIES).forEach((id) => { delete entries[id]; delete docs[id]; });
  }
  for (const id of Object.keys(docs)) if (!entries[id]) delete docs[id];
};

export async function auditLoad(now = Date.now()) {
  if (entries) return;
  loading = loading || (async () => {
    const got = await ext.storage.local.get([AK, DK]);
    entries = got[AK] && typeof got[AK] === 'object' ? got[AK] : {};
    docs = got[DK] && typeof got[DK] === 'object' ? got[DK] : {};
    prune(now);
  })();
  await loading;
  loading = null;
}

/** What the finder decided about a listing. Fields add up: a later note (its rating, its upload) joins the first. */
export function auditNote(id, fields, now = Date.now()) {
  if (!entries || !id) return;
  if (!entries[id] && !fields.title) return; // a late note (its rating, its upload) joins an entry the finder made
  entries[id] = { ...(entries[id] || { id }), ...fields, t: now };
  dirty = true;
}

/** The JD text, and the prompt and answer of its rating. */
export function auditDoc(id, fields) {
  if (!docs || !id) return;
  docs[id] = { ...(docs[id] || {}), ...fields };
  dirty = true;
}

export async function auditSave(force = false, now = Date.now(), checkpoint = null) {
  if (!entries || !dirty || (!force && now - savedAt < SAVE_EVERY_MS)) {
    if (checkpoint) await ext.storage.local.set(checkpoint);
    return;
  }
  prune(now);
  dirty = false;
  savedAt = now;
  try {
    await ext.storage.local.set({ ...checkpoint, [AK]: entries, [DK]: docs });
  } catch (error) {
    dirty = true;
    throw error;
  }
}

/** Everything forgotten ("Start fresh"). */
export async function auditClear() {
  entries = {};
  docs = {};
  dirty = false;
  await ext.storage.local.set({ [AK]: {}, [DK]: {} });
}

export async function auditEntries() {
  await auditLoad();
  await auditSave(true);
  return Object.values(entries);
}

export async function auditDocOf(id) {
  await auditLoad();
  return docs[id] || null;
}

/**
 * The funnel from a list of entries (pure: the page and the tests use it).
 *   seen        distinct listings judged
 *   cardOut     left out on the card alone (age, company, title, years, pay…), by reason
 *   jdOpened    job pages opened; jdOut those left out after reading the JD, by reason
 *   kept        kept for your site; sent reached it; rated got an AI rating
 */
export function funnel(list) {
  const by = (xs) => xs.reduce((m, e) => { const k = e.w || 'other'; m[k] = (m[k] || 0) + 1; return m; }, {});
  const sorted = (m) => Object.entries(m).sort((a, b) => b[1] - a[1]);
  const out = list.filter((e) => !e.k && !e.pending);
  const cardOut = out.filter((e) => e.stage !== 'jd');
  const jdOut = out.filter((e) => e.stage === 'jd');
  const kept = list.filter((e) => e.k);
  return {
    seen: list.length,
    pending: list.filter(e => e.pending).length,
    cardOut: cardOut.length,
    cardReasons: sorted(by(cardOut)),
    jdOpened: list.filter((e) => e.stage === 'jd').length,
    jdOut: jdOut.length,
    jdReasons: sorted(by(jdOut)),
    kept: kept.length,
    keptBackend: kept.filter((e) => e.list === 'backend').length,
    keptAi: kept.filter((e) => e.list === 'ai').length,
    sent: kept.filter((e) => e.sent).length,
    rated: list.filter((e) => e.ai != null).length,
  };
}
