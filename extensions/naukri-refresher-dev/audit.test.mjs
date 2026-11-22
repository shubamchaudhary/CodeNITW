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
  assert.deepEqual(funnel([]), { seen: 0, cardOut: 0, cardReasons: [], jdOpened: 0, jdOut: 0, jdReasons: [], kept: 0, keptBackend: 0, keptAi: 0, sent: 0, rated: 0 });
});
