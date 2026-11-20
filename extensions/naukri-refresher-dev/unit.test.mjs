// Unit tests for the pure rules. Run: node --test extensions/naukri-refresher-dev/
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MIN, HOUR, DAY, IST_OFFSET, LIMITS, cleanSettings, nextRun, gate, nextHeadline, extractProfile,
  classifyStatus, istDayKey, istHM, slotKeyOf, fmtWhen, retryDelay, filledFields, lostFields, dailyCapFor,
  pruneHistory, changedTimestamp, shortReason,
} from '../naukri-refresher/lib.js';

const ist = (y, mo, d, h = 0, mi = 0) => Date.UTC(y, mo - 1, d, h, mi) - IST_OFFSET; // IST wall time → ms
const seeded = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);

/** Simulate the background loop: run every plan as it comes due. */
function simulate(fromMs, toMs, settings = {}, rand = Math.random) {
  const runs = [];
  let now = fromMs;
  let last = null;
  for (;;) {
    const p = nextRun(now, settings, last, rand);
    if (!p || p.at > toMs) return runs;
    runs.push(p);
    now = p.at;
    last = p.slot;
  }
}

test('one run per hourly slot, 07:00–19:00 IST, each within ±7.5 min and inside the window', () => {
  for (let seed = 1; seed <= 300; seed++) {
    const runs = simulate(ist(2026, 11, 23, 0), ist(2026, 11, 24, 0), {}, seeded(seed));
    assert.equal(runs.length, 13, 'thirteen slots: 07..19');
    runs.forEach((r, i) => {
      assert.equal(istHM(r.slotAt), `${String(7 + i).padStart(2, '0')}:00`);
      assert.ok(Math.abs(r.at - r.slotAt) <= 7.5 * MIN, `within ±7.5 min (${istHM(r.at)})`);
      assert.ok(r.at >= ist(2026, 11, 23, 7) && r.at <= ist(2026, 11, 23, 19), 'inside 07:00–19:00');
      if (i) {
        const gap = r.at - runs[i - 1].at;
        assert.ok(gap >= 45 * MIN && gap <= 75 * MIN, `gap ${gap / MIN} min`);
      }
    });
  }
});

test('times are really spread out (not clustered on the hour)', () => {
  const offsets = [];
  for (let seed = 1; seed <= 200; seed++) {
    for (const r of simulate(ist(2026, 11, 23, 0), ist(2026, 11, 24, 0), {}, seeded(seed)).slice(1, -1)) {
      offsets.push((r.at - r.slotAt) / MIN);
    }
  }
  const before = offsets.filter((o) => o < 0).length / offsets.length;
  assert.ok(before > 0.4 && before < 0.6, `about half run before the hour (${before.toFixed(2)})`);
  assert.ok(Math.min(...offsets) < -7 && Math.max(...offsets) > 7, 'uses the full ±7.5 range');
  const mean = offsets.reduce((a, b) => a + b, 0) / offsets.length;
  assert.ok(Math.abs(mean) < 0.5, `centred on the hour (mean ${mean.toFixed(2)})`);
});

test('the example from the request: a 7:06 run can be followed by 7:58', () => {
  const r1 = nextRun(ist(2026, 11, 23, 6, 0), {}, null, () => 0.8); // 07:00 slot window is 07:00–07:07:30
  assert.equal(istHM(r1.at), '07:06');
  const r2 = nextRun(r1.at, {}, r1.slot, () => 0.37); // 08:00 slot window 07:52:30–08:07:30
  assert.equal(istHM(r2.at), '07:58');
  assert.equal(r2.label, '08:00');
});

test('first slot never runs before 07:00 and the last never after 19:00', () => {
  const first = nextRun(ist(2026, 11, 23, 5), {}, null, () => 0);
  assert.equal(istHM(first.at), '07:00');
  const last = nextRun(ist(2026, 11, 23, 18, 40), {}, '2026-11-23T18', () => 1);
  assert.equal(istHM(last.at), '19:00');
  assert.equal(last.label, '19:00');
});

test('after 19:00 the next run is tomorrow’s 07:00 slot', () => {
  const p = nextRun(ist(2026, 11, 23, 19, 30), {}, '2026-11-23T19', () => 0.5);
  assert.equal(istDayKey(p.at), '2026-11-24');
  assert.equal(p.label, '07:00');
});

test('starting inside a slot window picks from the rest of that window only', () => {
  const now = ist(2026, 11, 23, 10, 3);
  for (const r of [0, 0.5, 1]) {
    const p = nextRun(now, {}, '2026-11-23T09', () => r);
    assert.equal(p.label, '10:00');
    assert.ok(p.at >= now + 30_000 && p.at <= ist(2026, 11, 23, 10, 7) + 30_000);
  }
});

test('slot already done is never repeated', () => {
  const p = nextRun(ist(2026, 11, 23, 10, 1), {}, '2026-11-23T10', () => 0);
  assert.equal(p.label, '11:00');
});

test('skip weekends jumps from Friday evening to Monday 07:00', () => {
  const p = nextRun(ist(2026, 11, 20, 19, 30), { skipWeekends: true }, '2026-11-20T19', () => 0); // Fri
  assert.equal(istDayKey(p.at), '2026-11-23'); // Mon
  assert.equal(istHM(p.at), '07:00');
});

test('custom window and the PC timezone do not matter (all IST maths)', () => {
  const runs = simulate(ist(2026, 11, 23, 0), ist(2026, 11, 24, 0), { startHour: 9, endHour: 11 }, seeded(7));
  assert.deepEqual(runs.map((r) => r.label), ['09:00', '10:00', '11:00']);
  assert.equal(slotKeyOf(ist(2026, 11, 23, 9)), '2026-11-23T09');
});

test('settings are validated', () => {
  assert.deepEqual(cleanSettings({ startHour: '25', endHour: -1, jitterMin: 99 }), cleanSettings({}));
  assert.equal(cleanSettings({ startHour: 10, endHour: 8 }).endHour, 10);
  assert.equal(cleanSettings({ enabled: false }).enabled, false);
});

test('retry delay is 2–5 minutes', () => {
  assert.equal(retryDelay(() => 0), 2 * MIN);
  assert.equal(retryDelay(() => 1), 5 * MIN);
});

test('headline: toggles one trailing dot and always returns to the original', () => {
  const H = 'Backend Software Engineer (Java) | 2+ YOE';
  let memo = null;
  let live = H;
  const seen = [];
  for (let i = 0; i < 6; i++) {
    const r = nextHeadline(live, memo, 'P1');
    assert.ok(r.ok);
    memo = { profileId: 'P1', base: r.base, last: r.next };
    live = r.next;
    seen.push(live);
  }
  assert.deepEqual(seen, [`${H}.`, H, `${H}.`, H, `${H}.`, H]);
});

test('headline ending in "..." never erodes', () => {
  const H = 'Open to work...';
  let memo = null;
  let live = H;
  for (let i = 0; i < 9; i++) {
    const r = nextHeadline(live, memo, 'P1');
    memo = { profileId: 'P1', base: r.base, last: r.next };
    live = r.next;
    assert.ok(live === H || live === 'Open to work..', live);
  }
});

test('headline edited by the user becomes the new base', () => {
  const memo = { profileId: 'P1', base: 'Old', last: 'Old.' };
  const r = nextHeadline('New headline', memo, 'P1');
  assert.equal(r.next, 'New headline.');
  assert.equal(r.base, 'New headline');
});

test('headline memo from another account is ignored', () => {
  const r = nextHeadline('Abc.', { profileId: 'OTHER', base: 'Abc', last: 'Abc.' }, 'P1');
  assert.equal(r.next, 'Abc'); // treated fresh: "Abc." toggles to "Abc"
});

test('headline safety: empty, at the 250 limit, trailing spaces', () => {
  assert.equal(nextHeadline('   ', null, 'P1').ok, false);
  assert.equal(nextHeadline('', null, 'P1').ok, false);
  assert.equal(nextHeadline('.', null, 'P1').ok, false, 'never writes an empty headline');
  assert.equal(nextHeadline('x'.repeat(250), null, 'P1').ok, false);
  assert.equal(nextHeadline(`${'x'.repeat(249)}.`, null, 'P1').next.length, 249);
  assert.equal(nextHeadline('x'.repeat(249), null, 'P1').next.length, 250);
  assert.equal(nextHeadline('Abc  ', null, 'P1').next, 'Abc.');
  // Both real headlines fit.
  assert.ok(nextHeadline('B'.repeat(218), null, 'P').ok && nextHeadline('A'.repeat(238), null, 'P').ok);
});

test('profile parsing accepts array/object shapes and rejects anything else', () => {
  assert.deepEqual(extractProfile({ profile: [{ profileId: 'abc', resumeHeadline: 'H', name: 'N' }] }), { profileId: 'abc', headline: 'H', name: 'N' });
  assert.equal(extractProfile({ profile: { profileId: 42, resumeHeadline: 'H' } }).profileId, '42');
  assert.equal(extractProfile({ profile: [{ resumeHeadline: 'H' }] }), null);
  assert.equal(extractProfile({ profile: [{ profileId: 'a' }] }), null);
  assert.equal(extractProfile({ something: 1 }), null);
  assert.equal(extractProfile(null), null);
});

test('collateral-damage check: fields that became empty after a save', () => {
  const before = { profile: [{ profileId: 'p', resumeHeadline: 'H', keySkills: 'Java', summary: 'S', modifiedOn: 1 }], employments: [{ a: 1 }], meta: {} };
  const same = { profile: [{ profileId: 'p', resumeHeadline: 'H.', keySkills: 'Java', summary: 'S', modifiedOn: 2 }], employments: [{ a: 1 }] };
  assert.deepEqual(lostFields(before, same), [], 'headline and timestamp changes are fine');
  const wiped = { profile: [{ profileId: 'p', resumeHeadline: 'H.', keySkills: '', summary: null, modifiedOn: 2 }], employments: [] };
  assert.deepEqual(lostFields(before, wiped).sort(), ['employments', 'profile.keySkills', 'profile.summary']);
  assert.deepEqual(lostFields(before, { profile: [{ profileId: 'p', resumeHeadline: '' }] }).sort(),
    ['employments', 'profile.keySkills', 'profile.modifiedOn', 'profile.summary']);
  assert.ok(filledFields({ profile: [{ resumeHeadline: 'x', n: 0, f: false }] }).has('profile.n'), '0/false count as values');
});

test('HTTP status classification', () => {
  assert.equal(classifyStatus(200), 'ok');
  assert.equal(classifyStatus(204), 'ok');
  assert.equal(classifyStatus(401), 'auth');
  assert.equal(classifyStatus(403), 'auth');
  assert.equal(classifyStatus(429), 'ratelimit');
  assert.equal(classifyStatus(0), 'transient');
  assert.equal(classifyStatus(503), 'transient');
  assert.equal(classifyStatus(400), 'fatal');
  assert.equal(classifyStatus(404), 'fatal');
});

test('daily cap = hourly slots in the window + 3 manual', () => {
  assert.equal(dailyCapFor({}), 16); // 07–19: 13 slots
  assert.equal(dailyCapFor({ startHour: 6, endHour: 20 }), 18); // 15 slots
  const now = ist(2026, 11, 23, 12);
  const key = istDayKey(now);
  const wide = { startHour: 6, endHour: 20 };
  assert.equal(gate({ settings: wide, day: { key, writes: 16 } }, now, 'manual'), null, '06–20 still allows a manual refresh at 16');
  assert.match(gate({ settings: wide, day: { key, writes: 18 } }, now, 'scheduled').msg, /cap of 18/);
});

test('keep-awake defaults on and can be switched off', () => {
  assert.equal(cleanSettings({}).keepAwake, true);
  assert.equal(cleanSettings({ keepAwake: false }).keepAwake, false);
});

test('gate: daily cap, min gap, manual cooldown, 429 backoff', () => {
  const now = ist(2026, 11, 23, 12);
  const day = { key: istDayKey(now), writes: dailyCapFor({}) };
  assert.match(gate({ day }, now, 'scheduled').msg, /daily safety cap/);
  assert.match(gate({ day }, now, 'manual').msg, /daily safety cap/);
  assert.equal(gate({ day: { key: '2026-11-22', writes: 99 } }, now, 'scheduled'), null, 'cap resets each IST day');
  assert.match(gate({ lastWriteAt: now - 10 * MIN }, now, 'scheduled').msg, /saved 10 min ago/);
  assert.equal(gate({ lastWriteAt: now - 10 * MIN }, now, 'scheduled').short, 'saved 10 min ago');
  assert.equal(gate({ lastWriteAt: now - 10 * MIN }, now, 'manual'), null);
  assert.match(gate({ lastWriteAt: now - 30_000 }, now, 'manual').msg, /less than a minute/);
  assert.match(gate({ backoffUntil: now + HOUR }, now, 'manual').msg, /slow down/);
  assert.equal(gate({ backoffUntil: now - 1 }, now, 'scheduled'), null);
});

test('history keeps today and yesterday (IST) and drops older days', () => {
  const now = ist(2026, 11, 21, 0, 30); // just after midnight IST
  const list = [
    { t: ist(2026, 11, 21, 0, 10) }, // today
    { t: ist(2026, 11, 20, 19, 0) }, // yesterday evening
    { t: ist(2026, 11, 20, 0, 0) }, // yesterday's first minute
    { t: ist(2026, 11, 19, 23, 59) }, // day before yesterday
  ];
  assert.deepEqual(pruneHistory(list, now).map((e) => istHM(e.t)), ['00:10', '19:00', '00:00']);
  assert.deepEqual(pruneHistory(null, now), []);
});

test("Naukri's own timestamp: only a changed modified/updated field near now counts", () => {
  const now = ist(2026, 11, 23, 9, 4);
  const before = { profile: [{ profileId: 'p', resumeHeadline: 'H', lastModified: ist(2026, 11, 23, 8, 2), loginCount: 5 }] };
  const after = { profile: [{ profileId: 'p', resumeHeadline: 'H.', lastModified: ist(2026, 11, 23, 9, 3), loginCount: 6 }] };
  assert.deepEqual(changedTimestamp(before, after, now), { field: 'profile.lastModified', ms: ist(2026, 11, 23, 9, 3) });
  // ISO strings and epoch seconds work too
  const iso = { profile: [{ updatedOn: '2026-11-23T03:33:00Z' }] }; // = 09:03 IST
  assert.equal(changedTimestamp({ profile: [{ updatedOn: '2026-11-22T03:33:00Z' }] }, iso, now).ms, ist(2026, 11, 23, 9, 3));
  const secs = { profile: [{ mod_dt: Math.floor(ist(2026, 11, 23, 9, 3) / 1000) }] };
  assert.equal(changedTimestamp({ profile: [{ mod_dt: 1 }] }, secs, now), null, '"mod_dt" is not a recognised name');
  // unchanged, unrelated or stale fields are ignored
  assert.equal(changedTimestamp(before, before, now), null);
  assert.equal(changedTimestamp({ profile: [{ createdOn: 1 }] }, { profile: [{ createdOn: now }] }, now), null);
  assert.equal(changedTimestamp({ profile: [{ modifiedOn: 1 }] }, { profile: [{ modifiedOn: now - 3 * HOUR }] }, now), null);
});

test('short reasons for the history list', () => {
  assert.equal(shortReason('auth', { status: 401 }), 'logged out');
  assert.equal(shortReason('ratelimit', { status: 429 }), 'too many requests');
  assert.equal(shortReason('transient', { status: 503 }), 'HTTP 503');
  assert.equal(shortReason('transient', { status: 0, error: 'timed out' }), 'timed out');
  assert.equal(shortReason('transient', { status: 0, error: 'network error (Failed to fetch)' }), 'network error');
  assert.equal(shortReason('fatal', { status: 400 }), 'HTTP 400');
  assert.equal(nextHeadline('', null, 'P').short, 'headline empty');
  assert.equal(nextHeadline('x'.repeat(250), null, 'P').short, 'headline full');
});

test('display times are IST', () => {
  const now = ist(2026, 11, 23, 12);
  assert.equal(fmtWhen(ist(2026, 11, 23, 14, 5), now), '14:05');
  assert.equal(fmtWhen(ist(2026, 11, 24, 7, 2), now), 'tomorrow 07:02');
  assert.equal(fmtWhen(ist(2026, 11, 26, 7, 2), now), '26 Nov 07:02');
  assert.equal(fmtWhen(now + DAY * 0, now), '12:00');
});
