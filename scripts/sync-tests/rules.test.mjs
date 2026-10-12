// Direct checks of firestore.rules for the notes/ and data/ documents and the
// main document's note fields. Needs the Firestore emulator on 127.0.0.1:8080.
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const env = await initializeTestEnvironment({
  projectId: 'demo-rules',
  firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 },
});
await env.clearFirestore();
await env.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(doc(ctx.firestore(), 'userProgress/u1'), {
    updatedAt: 1, CoreStackNotes: { 'JAVA-02': 'old text' }, _rev: { CoreStackNotes: { 'JAVA-02': 4 } },
  });
});
const me = env.authenticatedContext('u1').firestore();
const other = env.authenticatedContext('u2').firestore();
const note = (o) => ({ key: 'CoreStackNotes', id: 'JAVA-02', value: 'x', deleted: false, rev: 5, base: 4, updatedAt: 1, ...o });
const ref = (db, id = 'CoreStackNotes~JAVA-02') => doc(db, 'userProgress/u1/notes', id);
let pass = 0, fail = 0;
const t = async (name, p) => { try { await p; pass++; console.log('  ok  ', name); } catch (e) { fail++; console.log('  FAIL', name, '-', e.message.split('\n')[0]); } };

await t('first save must build on the main copy (base 3 ≠ head 4) → refused', assertFails(setDoc(ref(me), note({ rev: 4, base: 3 }))));
await t('first save on the main head (base 4 → rev 5) → allowed', assertSucceeds(setDoc(ref(me), note())));
await t('stale save (base 4, head is now 5) → refused', assertFails(setDoc(ref(me), note({ value: 'y' }))));
await t('next save (base 5 → rev 6) → allowed', assertSucceeds(setDoc(ref(me), note({ rev: 6, base: 5, value: 'y' }))));
await t('skipping a revision (base 6 → rev 8) → refused', assertFails(setDoc(ref(me), note({ rev: 8, base: 6 }))));
await t('changing which note a document holds → refused', assertFails(setDoc(ref(me), note({ id: 'JAVA-03', rev: 7, base: 6 }))));
await t('deleting a note document → refused', assertFails(deleteDoc(ref(me))));
await t('marking deleted (tombstone, base 6 → rev 7) → allowed', assertSucceeds(setDoc(ref(me), note({ rev: 7, base: 6, value: null, deleted: true }))));
await t('brand-new note (no main copy, base 0 → rev 1) → allowed', assertSucceeds(setDoc(ref(me, 'CoreStackNotes~NEW-1'), note({ id: 'NEW-1', rev: 1, base: 0 }))));
await t('unknown key → refused', assertFails(setDoc(ref(me, 'Bogus~A'), note({ key: 'Bogus', id: 'A', rev: 1, base: 0 }))));
await t('document id not matching its key → refused', assertFails(setDoc(ref(me, 'CoreStackNotes~X'), note({ key: 'AIStackNotes', id: 'X', rev: 1, base: 0 }))));
await t('extra field → refused', assertFails(setDoc(ref(me, 'CoreStackNotes~E'), { ...note({ id: 'E', rev: 1, base: 0 }), hack: 1 })));
await t("another account can't read my note", assertFails(getDoc(ref(other))));
await t("another account can't write my note", assertFails(setDoc(doc(other, 'userProgress/u1/notes', 'CoreStackNotes~Z'), note({ id: 'Z', rev: 1, base: 0 }))));
await t('data/: owner can write', assertSucceeds(setDoc(doc(me, 'userProgress/u1/data/CoreStackCompleted'), { value: { a: true }, _meta: { a: 1 }, updatedAt: 1 })));
await t('data/: owner can update', assertSucceeds(updateDoc(doc(me, 'userProgress/u1/data/CoreStackCompleted'), { 'value.b': true })));
await t("data/: can't be deleted", assertFails(deleteDoc(doc(me, 'userProgress/u1/data/CoreStackCompleted'))));
await t("data/: another account can't read", assertFails(getDoc(doc(other, 'userProgress/u1/data/CoreStackCompleted'))));
await t('note kind the main doc never had (AIStackNotes, base 0) → allowed', assertSucceeds(setDoc(ref(me, 'AIStackNotes~A'), note({ key: 'AIStackNotes', id: 'A', rev: 1, base: 0 }))));
const u3 = env.authenticatedContext('u3').firestore();
await t('account with no main document: first note (base 0) → allowed', assertSucceeds(setDoc(doc(u3, 'userProgress/u3/notes', 'CoreStackNotes~JAVA-01'), note({ id: 'JAVA-01', rev: 1, base: 0 }))));
await t('account with no main document: base 2 → refused', assertFails(setDoc(doc(u3, 'userProgress/u3/notes', 'CoreStackNotes~JAVA-05'), note({ id: 'JAVA-05', rev: 3, base: 2 }))));
// The old main-document rules still behave as before.
await t('main doc: a non-note write (DSA tick) → allowed', assertSucceeds(setDoc(doc(me, 'userProgress/u1'), { DSAPrepCompleted: { 'two-sum': true } }, { merge: true })));
await t('main doc: changing a note field without the fast-forward marker → refused', assertFails(setDoc(doc(me, 'userProgress/u1'), { CoreStackNotes: { 'JAVA-02': 'sneaky' } }, { merge: true })));
console.log(`\n${pass} passed, ${fail} failed`);
await env.cleanup();
process.exit(fail ? 1 : 0);
