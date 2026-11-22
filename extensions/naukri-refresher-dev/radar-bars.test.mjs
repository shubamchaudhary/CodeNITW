// The radar's bars for openings from the other sources: pay floor 15 LPA (posted salary, or the
// company's median on levels.fyi), and the AI rating bar of 70. (Years: scripts/radar/experience.mjs.)
// Run: node --test extensions/naukri-refresher-dev/
import test from 'node:test';
import assert from 'node:assert/strict';
import { makePayChecker, FLOOR_LPA } from '../../scripts/radar/pay.mjs';
import { underBar, MIN_RATING } from '../../scripts/radar/rate.mjs';
import { experienceRange } from '../../scripts/radar/experience.mjs';

const co = (p50, p90 = p50 * 1.6) => ({ at: Date.now(), data: { slug: 'x', p10: p50 * 0.6, p25: p50 * 0.8, p50, p75: p50 * 1.3, p90, n: 40 } });

test('pay: a posted salary under 15L, or a company whose median is under 15L, is dropped; the rest is kept and labelled', async () => {
  assert.equal(FLOOR_LPA, 15);
  const check = makePayChecker({ cache: { acme: co(12), zeta: co(18, 22), omega: co(40) } });
  assert.equal((await check({ company: 'Acme', pay: { minL: 8, maxL: 12 } })).verdict, 'below', 'posted 12L');
  assert.equal((await check({ company: 'Zeta', pay: { minL: 14, maxL: 16 } })).verdict, 'close', 'posted 16L: kept (it was dropped under 22L before)');
  assert.equal((await check({ company: 'Acme' })).verdict, 'below', 'no posted salary: the company median is 12L');
  assert.equal((await check({ company: 'Zeta' })).verdict, 'unlikely', 'median 18L: kept, labelled');
  assert.equal((await check({ company: 'Omega' })).verdict, 'likely');
  assert.equal((await check({ company: 'Nobody Inc', pay: { minL: 20, maxL: 30, fromText: true } })).verdict, 'meets');
  assert.equal((await check({ company: 'Acme', pay: { minL: 5, maxL: 14, fromText: true } })).verdict, 'close', 'a figure read from the description text never drops a role');
});

test('rating: under 70 is not kept; one not rated yet is', () => {
  assert.equal(MIN_RATING, 70);
  assert.equal(underBar({ ai: { s: 69 } }), true);
  assert.equal(underBar({ ai: { s: 70 } }), false);
  assert.equal(underBar({ ai: { s: 95 } }), false);
  assert.equal(underBar({}), false, 'not rated: kept (no keys, or still waiting its turn)');
  assert.equal(underBar({ ai: { s: 60 } }, 50), false, 'RADAR_MIN_RATING');
});

test('years: 3+ and 3-5 are dropped, 2-5 and 1-3 stay (the range must include 2)', () => {
  assert.equal(experienceRange({ title: 'x', experienceRange: '3+ Yrs' }).min, 3);
  assert.equal(experienceRange({ title: 'x', experienceRange: '2-5 Yrs' }).min, 2);
  assert.equal(experienceRange({ title: 'Software Engineer', desc: 'We need 3+ years of professional software development experience.' }).min, 3);
});
