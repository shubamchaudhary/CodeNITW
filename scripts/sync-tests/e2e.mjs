// End-to-end: the app's real sync code in two browsers ("devices") against the
// Firestore and Auth emulators with the real rules, starting from an account
// shaped like one from before the split (everything in the main document).
// See README.md for how to run it.
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
import admin from 'firebase-admin';
import { chromium } from 'playwright';
import { isDeepStrictEqual } from 'node:util';

admin.initializeApp({ projectId: 'demo-test' });
const fs = admin.firestore();
const UID = 'u1', EMAIL = 't@t.dev', PW = 'secret12';
const BASE = process.env.APP_URL || 'http://localhost:5174';
let pass = 0, fail = 0;
const check = (name, ok, detail = '') => { ok ? pass++ : fail++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${name}${ok || !detail ? '' : '\n        ' + detail}`); };

// ── Seed: an account from before the split — everything in the main document.
await fetch('http://127.0.0.1:8080/emulator/v1/projects/demo-test/databases/(default)/documents', { method: 'DELETE' });
await fetch('http://127.0.0.1:9099/emulator/v1/projects/demo-test/accounts', { method: 'DELETE' });
await admin.auth().createUser({ uid: UID, email: EMAIL, password: PW });
const T0 = Date.now() - 86400000;
const SEED = {
  updatedAt: T0,
  DSAPrepCompleted: { 'two-sum': true, 'lru-cache': true },
  DSAPrepSolvedTimestamps: { 'two-sum': T0 - 1000, 'lru-cache': T0 - 2000 },
  DSAPrepStarred: { 'lru-cache': true },
  PlanningDays: { '2026-10-11': { tasks: [{ uid: 't1', title: 'Revise', done: true }] } },
  PlanningTimeLog: { '2026-10-11': { 't1': 1500000 } },
  CoreStackCompleted: { 'JAVA-01': true },
  CoreStackCheckedTimestamps: { 'JAVA-01': T0 },
  CoreStackNotes: { 'JAVA-02': '## Old note\n\nline one\nline two\nline three\n', 'JAVA-03': 'note three' },
  CoreStackAnnotations: { 'JAVA-02': [{ id: 'a1', quote: 'line one', body: 'my comment', createdAt: T0 }] },
  InterviewKitNotes: { 'ik-1': 'kit note' },
  JobTrackerState: { companies: { uber: { status: 'toApply', links: [{ id: 'u1', label: 'SDE-2', url: 'https://x.dev/1' }] } }, custom: [], contacts: [] },
  _meta: {
    DSAPrepCompleted: { 'two-sum': T0, 'lru-cache': T0 }, DSAPrepSolvedTimestamps: { 'two-sum': T0, 'lru-cache': T0 }, DSAPrepStarred: { 'lru-cache': T0 },
    PlanningDays: { '2026-10-11': T0 }, PlanningTimeLog: { '2026-10-11': T0 },
    CoreStackCompleted: { 'JAVA-01': T0 }, CoreStackCheckedTimestamps: { 'JAVA-01': T0 },
    JobTrackerState: { companies: T0, custom: T0, contacts: T0 },
  },
  _rev: { CoreStackNotes: { 'JAVA-02': 7, 'JAVA-03': 2 }, CoreStackAnnotations: { 'JAVA-02': 3 }, InterviewKitNotes: { 'ik-1': 1 } },
};
await fs.doc(`userProgress/${UID}`).set(SEED);
const main = async () => (await fs.doc(`userProgress/${UID}`).get()).data();
const note = async (key, id) => (await fs.doc(`userProgress/${UID}/notes/${key}~${encodeURIComponent(id)}`).get()).data();
const data = async (key) => (await fs.doc(`userProgress/${UID}/data/${key}`).get()).data();
// Every field of the main document except the ones expected to change.
const untouched = (m, allowed) => Object.keys(SEED).filter((k) => !allowed.includes(k)).every((k) => isDeepStrictEqual(m[k], SEED[k]));

// ── Browser helpers
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
async function device(name) {
  const ctx = await browser.newContext();
  await ctx.route('**/fonts.googleapis.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log(`  [${name}] PAGEERR`, e.message.slice(0, 200)));
  p.on('console', (m) => { if ((m.type() === 'error' && /cloudSync/.test(m.text())) || /\[history\]|NOTICE/.test(m.text())) console.log(`  [${name}] ${m.type()}`, m.text().slice(0, 300)); });
  await p.goto(`${BASE}/contests`);
  await p.waitForFunction(() => !!window.__emulatorSignIn, null, { timeout: 90000 });
  await p.evaluate(([e, pw]) => window.__emulatorSignIn(e, pw), [EMAIL, PW]);
  await synced(p);
  await p.evaluate(async () => { const m = await import('/src/Data/cloudSync.js'); m.onSyncNotice((n) => console.log('NOTICE ' + JSON.stringify(n))); });
  return p;
}
async function synced(p, ms = 30000) {
  await p.evaluate(async () => { window.__sync = await import('/src/Data/cloudSync.js'); });
  // Settled: synced, nothing pending, and still so a moment later.
  for (let i = 0; i < 2; i++) {
    await p.waitForFunction((uid) =>
      window.__sync.getSyncStatus().state === 'synced' && !localStorage.getItem(`sync:pending:${uid}`) && localStorage.getItem(`u:${uid}:CoreStackNotes`) !== null,
      UID, { timeout: ms, polling: 200 });
    await p.waitForTimeout(700);
  }
}
const local = (p, key) => p.evaluate(([uid, k]) => JSON.parse(localStorage.getItem(`u:${uid}:${k}`) || 'null'), [UID, key]);
const save = (p, key, fn) => p.evaluate(async ([k, f]) => {
  const s = await import('/src/Data/planStore.js');
  const prev = s.loadJSON(k, {});
  s.saveJSON(k, new Function('prev', `return (${f})(prev)`)(prev));
}, [key, fn.toString()]);

// ── 1. Device A signs in: the old copies are readable, nothing is written.
console.log('\n1. Signing in on an old-style account');
const A = await device('A');
check('A sees the old notes', isDeepStrictEqual(await local(A, 'CoreStackNotes'), SEED.CoreStackNotes));
check('A sees the old personal notes', isDeepStrictEqual(await local(A, 'CoreStackAnnotations'), SEED.CoreStackAnnotations));
check('A sees Core Stack ticks', isDeepStrictEqual(await local(A, 'CoreStackCompleted'), SEED.CoreStackCompleted));
check('A sees DSA progress', isDeepStrictEqual(await local(A, 'DSAPrepCompleted'), SEED.DSAPrepCompleted));
check('A sees planning', isDeepStrictEqual(await local(A, 'PlanningDays'), SEED.PlanningDays));
check('A sees the job tracker', isDeepStrictEqual(await local(A, 'JobTrackerState'), SEED.JobTrackerState));
check('signing in wrote nothing to the main document', isDeepStrictEqual(await main(), SEED));
check('…and created no new documents', (await fs.collection(`userProgress/${UID}/notes`).get()).empty && (await fs.collection(`userProgress/${UID}/data`).get()).empty);

// ── 2. Edits on A.
console.log('\n2. Editing on A');
await save(A, 'CoreStackNotes', (p) => ({ ...p, 'JAVA-02': p['JAVA-02'] + 'line four\n', 'JAVA-09': 'brand new note' }));
await save(A, 'CoreStackCompleted', (p) => ({ ...p, 'JAVA-05': true }));
await save(A, 'DSAPrepCompleted', (p) => ({ ...p, 'binary-search': true }));
await save(A, 'PlanningDays', (p) => ({ ...p, '2026-10-12': { tasks: [] } }));
await save(A, 'InterviewKitNotes', () => ({}));
await save(A, 'JobTrackerState', (p) => ({ ...p, companies: { ...p.companies, stripe: { status: 'applied', links: [] } } }));
await synced(A);
const m1 = await main();
check('main document: notes, ticks, jobs and all revisions untouched', untouched(m1, ['DSAPrepCompleted', 'PlanningDays', '_meta', 'updatedAt']));
check('main document: old note text still there (the backup)', m1.CoreStackNotes['JAVA-02'] === SEED.CoreStackNotes['JAVA-02'] && m1.InterviewKitNotes['ik-1'] === 'kit note');
check('main document: DSA tick written there, as before', m1.DSAPrepCompleted['binary-search'] === true && !!m1._meta.DSAPrepCompleted['binary-search']);
check('main document: planning written there, as before', !!m1.PlanningDays['2026-10-12']);
const metaOk = Object.keys(SEED._meta).filter((k) => !['DSAPrepCompleted', 'PlanningDays'].includes(k)).every((k) => isDeepStrictEqual(m1._meta[k], SEED._meta[k]));
check('main document: edit times of moved keys untouched', metaOk && Object.keys(m1._meta).every((k) => k in SEED._meta));
const n2 = await note('CoreStackNotes', 'JAVA-02');
check('edited note → its own document, building on the main revision (7 → 8)', n2?.rev === 8 && n2?.base === 7 && n2?.value.endsWith('line four\n'), JSON.stringify(n2));
const n9 = await note('CoreStackNotes', 'JAVA-09');
check('new note → its own document at revision 1', n9?.rev === 1 && n9?.base === 0 && n9?.value === 'brand new note', JSON.stringify(n9));
const nIk = await note('InterviewKitNotes', 'ik-1');
check('deleted note → its document marked deleted (1 → 2)', nIk?.deleted === true && nIk?.rev === 2 && nIk?.value === null, JSON.stringify(nIk));
check('untouched notes have no document yet', !(await note('CoreStackNotes', 'JAVA-03')) && !(await note('CoreStackAnnotations', 'JAVA-02')));
const dCs = await data('CoreStackCompleted');
check('Core Stack tick → data/CoreStackCompleted with only the new entry', isDeepStrictEqual(dCs?.value, { 'JAVA-05': true }) && !!dCs?._meta?.['JAVA-05'], JSON.stringify(dCs));
const dJt = await data('JobTrackerState');
check('job tracker → data/JobTrackerState', dJt?.value?.companies?.stripe?.status === 'applied' && !!dJt?._meta?.companies, JSON.stringify(dJt).slice(0, 200));
check('no data/ document for DSA or planning', !(await data('DSAPrepCompleted')) && !(await data('PlanningDays')));
check("A's own view still complete (old ticks + new)", isDeepStrictEqual(await local(A, 'CoreStackCompleted'), { 'JAVA-01': true, 'JAVA-05': true }));

// ── 3. A second device sees the combined picture.
console.log('\n3. Device B signs in');
const B = await device('B');
const bNotes = await local(B, 'CoreStackNotes');
check('B: edited note comes from its new document', bNotes['JAVA-02'].endsWith('line four\n'));
check('B: untouched note still read from the main copy', bNotes['JAVA-03'] === 'note three');
check('B: new note present', bNotes['JAVA-09'] === 'brand new note');
check("B: deleted note stays deleted (main copy doesn't come back)", isDeepStrictEqual(await local(B, 'InterviewKitNotes'), {}), JSON.stringify(await local(B, 'InterviewKitNotes')));
check('B: personal notes from the main copy', isDeepStrictEqual(await local(B, 'CoreStackAnnotations'), SEED.CoreStackAnnotations));
check('B: Core Stack ticks = old + new', isDeepStrictEqual(await local(B, 'CoreStackCompleted'), { 'JAVA-01': true, 'JAVA-05': true }));
check('B: job tracker has old + new company', !!(await local(B, 'JobTrackerState'))?.companies?.uber && !!(await local(B, 'JobTrackerState'))?.companies?.stripe);
check('B: DSA progress', isDeepStrictEqual(await local(B, 'DSAPrepCompleted'), { ...SEED.DSAPrepCompleted, 'binary-search': true }));
check('B: planning', !!(await local(B, 'PlanningDays'))['2026-10-12'] && !!(await local(B, 'PlanningDays'))['2026-10-11']);

// ── 4. The same note edited on both at once, different lines → merged.
console.log('\n4. Same note, both devices at once');
await Promise.all([
  save(A, 'CoreStackNotes', (p) => ({ ...p, 'JAVA-02': p['JAVA-02'].replace('line one', 'LINE ONE (A)') })),
  save(B, 'CoreStackNotes', (p) => ({ ...p, 'JAVA-02': p['JAVA-02'].replace('line three', 'LINE THREE (B)') })),
]);
await synced(A); await synced(B);
await new Promise((r) => setTimeout(r, 1500));
await synced(A); await synced(B);
const nm = await note('CoreStackNotes', 'JAVA-02');
check('both edits kept in the cloud', nm.value.includes('LINE ONE (A)') && nm.value.includes('LINE THREE (B)'), JSON.stringify(nm));
check('revision moved by one per save (8 → 10)', nm.rev === 10, `rev ${nm.rev}`);
check('A and B agree', (await local(A, 'CoreStackNotes'))['JAVA-02'] === nm.value && (await local(B, 'CoreStackNotes'))['JAVA-02'] === nm.value);

// ── 5. Ticks on both devices, then reload A.
console.log('\n5. Ticks on both, then reload');
await save(A, 'CoreStackCompleted', (p) => ({ ...p, 'JAVA-06': true }));
await save(B, 'CoreStackCompleted', (p) => { const n = { ...p }; delete n['JAVA-01']; return n; });
await synced(A); await synced(B);
await new Promise((r) => setTimeout(r, 1500));
await A.reload(); await synced(A);
const want = { 'JAVA-05': true, 'JAVA-06': true };
check('untick of an old main-document tick sticks', isDeepStrictEqual(await local(A, 'CoreStackCompleted'), want) && isDeepStrictEqual(await local(B, 'CoreStackCompleted'), want), JSON.stringify([await local(A, 'CoreStackCompleted'), await local(B, 'CoreStackCompleted')]));
const m2 = await main();
check('main document still holds the untouched old copies', untouched(m2, ['DSAPrepCompleted', 'PlanningDays', '_meta', 'updatedAt']));
check('nothing pending on A after reload', await A.evaluate((uid) => !localStorage.getItem(`sync:pending:${uid}`), UID));

// ── 6. Same line on both → conflict: one version stays, the other goes to history.
console.log('\n6. Same line edited on both (conflict)');
await Promise.all([
  save(A, 'CoreStackNotes', (p) => ({ ...p, 'JAVA-03': 'note three — edited on A' })),
  save(B, 'CoreStackNotes', (p) => ({ ...p, 'JAVA-03': 'note three — edited on B' })),
]);
await new Promise((r) => setTimeout(r, 2500));
await synced(A); await synced(B);
const nc = await note('CoreStackNotes', 'JAVA-03');
const aV = (await local(A, 'CoreStackNotes'))['JAVA-03'], bV = (await local(B, 'CoreStackNotes'))['JAVA-03'];
check('one version won, both devices show it', /edited on [AB]$/.test(nc?.value) && aV === nc.value && bV === nc.value, JSON.stringify({ nc, aV, bV }));
check('it built on the main copy (2 → 3), loser refused', nc?.rev === 3, `rev ${nc?.rev}`);
let hist, kept = [];
for (let i = 0; i < 20 && !kept.length; i++) {
  hist = await fs.collection(`userProgress/${UID}/history/CoreStackNotes~JAVA-03/revisions`).get();
  kept = hist.docs.map((d) => d.data()).filter((d) => d.reason === 'conflict' && /edited on [AB]$/.test(d.text) && d.text !== nc.value);
  if (!kept.length) await new Promise((r) => setTimeout(r, 500));
}
check("the losing edit is saved in the note's history", kept.length >= 1, `history: ${hist.docs.map((d) => JSON.stringify([d.data().reason, d.data().text])).join(' | ')}`);
check('main copy of JAVA-03 still the original', (await main()).CoreStackNotes['JAVA-03'] === 'note three');

// ── 7. Offline edit on A, then back online.
console.log('\n7. Offline edit');
await A.context().setOffline(true);
await save(A, 'CoreStackNotes', (p) => ({ ...p, 'JAVA-09': 'written offline' }));
await save(A, 'CoreStackCompleted', (p) => ({ ...p, 'JAVA-07': true }));
await A.waitForTimeout(1500);
check('while offline: nothing reached the cloud', (await note('CoreStackNotes', 'JAVA-09')).value === 'brand new note');
await A.context().setOffline(false);
await synced(A, 60000);
check('back online: the note went to its document (1 → 2)', (await note('CoreStackNotes', 'JAVA-09'))?.rev === 2 && (await note('CoreStackNotes', 'JAVA-09'))?.value === 'written offline');
check('back online: the tick went to data/', (await data('CoreStackCompleted'))?.value?.['JAVA-07'] === true);
await synced(B);
check('B picks both up', (await local(B, 'CoreStackNotes'))['JAVA-09'] === 'written offline' && (await local(B, 'CoreStackCompleted'))['JAVA-07'] === true);

// ── 8. A brand-new account.
console.log('\n8. Brand-new account');
await admin.auth().createUser({ uid: 'u2', email: 'n@t.dev', password: PW });
const ctx2 = await browser.newContext();
await ctx2.route('**/fonts.googleapis.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
const C = await ctx2.newPage();
await C.goto(`${BASE}/contests`);
await C.waitForFunction(() => !!window.__emulatorSignIn, null, { timeout: 90000 });
await C.evaluate(([e, pw]) => window.__emulatorSignIn(e, pw), ['n@t.dev', PW]);
await C.evaluate(async () => { window.__sync = await import('/src/Data/cloudSync.js'); });
await C.waitForFunction(() => window.__sync.getSyncStatus().state === 'synced', null, { timeout: 30000 });
await C.waitForTimeout(1500);
await C.evaluate(async () => {
  const s = await import('/src/Data/planStore.js');
  s.saveJSON('CoreStackNotes', { 'JAVA-01': 'first note ever' });
  s.saveJSON('DSAPrepCompleted', { 'two-sum': true });
  s.saveJSON('CoreStackCompleted', { 'JAVA-01': true });
});
await C.waitForFunction(() => window.__sync.getSyncStatus().state === 'synced' && !localStorage.getItem('sync:pending:u2'), null, { timeout: 30000, polling: 200 });
await C.waitForTimeout(1000);
const m3 = (await fs.doc('userProgress/u2').get()).data();
const n3 = (await fs.doc('userProgress/u2/notes/CoreStackNotes~JAVA-01').get()).data();
const d3 = (await fs.doc('userProgress/u2/data/CoreStackCompleted').get()).data();
check('new account: main document created, holds only DSA (no notes)', m3?.DSAPrepCompleted?.['two-sum'] === true && !m3?.CoreStackNotes && !m3?.CoreStackCompleted, JSON.stringify(m3));
check('new account: note in its own document at revision 1', n3?.rev === 1 && n3?.value === 'first note ever', JSON.stringify(n3));
check('new account: tick in data/', d3?.value?.['JAVA-01'] === true);

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail ? 1 : 0);
