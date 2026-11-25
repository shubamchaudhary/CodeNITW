// The report's funnel (extensions/naukri-refresher/audit.js): the numbers add up.
// Run: node --test extensions/naukri-refresher-dev/
import test from 'node:test';
import assert from 'node:assert/strict';
import { funnel } from '../naukri-refresher/audit.js';

const e = (over) => ({ id: String(Math.random()), t: 1, k: 0, stage: 'card', w: 'posted over 48 hours ago', ...over });

test('the funnel: seen = left out on the card + left out after the JD + kept; reasons counted; sent and rated among the kept', () => {
  const list = [
    e({}), e({}), e({ w: 'low-pay company' }),
    e({ stage: 'jd', w: 'JD match under 60%' }), e({ stage: 'jd', w: 'JD match under 60%' }), e({ stage: 'jd', w: 'Node.js stack' }),
    e({ k: 1, w: '', stage: 'jd', list: 'backend', sent: 1, ai: 80 }),
    e({ k: 1, w: '', stage: 'jd', list: 'ai', sent: 1 }),
    e({ k: 1, w: '', stage: 'jd', list: 'backend' }),
  ];
  const f = funnel(list);
  assert.equal(f.seen, 9);
  assert.equal(f.cardOut + f.jdOut + f.kept, f.seen, 'nothing lost between the stages');
  assert.equal(f.cardOut, 3);
  assert.deepEqual(f.cardReasons, [['posted over 48 hours ago', 2], ['low-pay company', 1]]);
  assert.equal(f.jdOpened, 6, 'every job page opened: the ones left out after it, and the kept');
  assert.deepEqual(f.jdReasons, [['JD match under 60%', 2], ['Node.js stack', 1]]);
  assert.deepEqual([f.kept, f.keptBackend, f.keptAi, f.sent, f.rated], [3, 2, 1, 2, 1]);
  assert.deepEqual(funnel([]), { seen: 0, pending: 0, cardOut: 0, cardReasons: [], jdOpened: 0, jdOut: 0, jdReasons: [], kept: 0, keptBackend: 0, keptAi: 0, sent: 0, rated: 0 });
});

test('pending work outlives the audit window and the exact decision is saved with its checkpoint', async t => {
  const writes = [];
  const old = Date.now() - 5 * 86_400_000;
  const previous = { jobsAudit: { a: { id: 'a', title: 'Developer', t: old, pending: true } }, jobsAuditDoc: {} };
  const local = { get: async () => previous, set: async data => writes.push(structuredClone(data)) };
  const chrome = globalThis.chrome;
  globalThis.chrome = { storage: { local } };
  t.after(() => { if (chrome === undefined) delete globalThis.chrome; else globalThis.chrome = chrome; });
  const audit = await import('../naukri-refresher/audit.js?checkpoint-test');
  await audit.auditLoad();
  assert.equal((await audit.auditEntries())[0].id, 'a');
  audit.auditNote('a', { ai: 22, pending: false, w: 'Outside both profiles' });
  audit.auditDoc('a', { dbg: { p: 'exact prompt', o: 'exact answer' } });
  await audit.auditSave(true, Date.now(), { jobsRateQ: { items: [] } });
  assert.equal(writes.length, 1);
  assert.deepEqual(writes[0].jobsRateQ.items, []);
  assert.equal(writes[0].jobsAudit.a.ai, 22);
  assert.equal(writes[0].jobsAuditDoc.a.dbg.o, 'exact answer');
  assert.equal(funnel(Object.values(writes[0].jobsAudit)).rated, 1);
});
