import { adminConfigured, db } from "./admin.mjs";
import { PLATFORMS, fetchUpcomingContests } from "./contests.mjs";

// Upcoming contests, cached — the one way the page and the reminder job get
// them.
//
//   • A good answer is kept for TTL (10 min). Until then nobody asks
//     LeetCode, Codeforces or CodeChef again.
//   • After that, the next request asks them. Success replaces the cache and
//     restarts the 10 minutes. Failure serves the cache as it is, and the
//     sources are left alone for RETRY_AFTER before the next try.
//   • It's per platform: if only CodeChef fails, CodeChef keeps its last
//     known contests while the other two are refreshed — and the cache counts
//     as not refreshed, so CodeChef is retried after RETRY_AFTER.
//
// The cache lives in Firestore (appCache/contests), so every server instance
// and the reminder job share one copy, with a copy in memory in front of it.
// Without Firebase configured (local dev) it's the in-memory copy alone.

export const TTL = 10 * 60 * 1000;
export const RETRY_AFTER = 60 * 1000;

export function makeContestCache({ fetchFresh, load, save }) {
  let memory = null; // { contests, fetchedAt, attemptedAt, failed }

  const fresh = (e, now) => e && now - e.fetchedAt < TTL;
  const resting = (e, now) => e && now - (e.attemptedAt || 0) < RETRY_AFTER;

  async function refresh(stored, now) {
    const r = await fetchFresh(now).catch((e) => ({ contests: [], errors: { all: String(e?.message || e) } }));
    const failed = Object.keys(PLATFORMS).filter((p) => r.errors?.[p] || r.errors?.all);
    // Platforms that failed keep what the cache last knew about them.
    const kept = (stored?.contests || []).filter((c) => failed.includes(c.platform));
    const byId = new Map([...kept, ...r.contests.filter((c) => !failed.includes(c.platform))].map((c) => [c.id, c]));
    return {
      contests: [...byId.values()].sort((a, b) => a.start - b.start),
      // The 10 minutes restart only on a complete success.
      fetchedAt: failed.length ? stored?.fetchedAt || 0 : now,
      attemptedAt: now,
      failed,
    };
  }

  return async function getContests(now = Date.now()) {
    let entry = memory;
    if (!fresh(entry, now)) {
      // Another instance (or the reminder job) may have refreshed it.
      const stored = await load().catch(() => null);
      if (stored && (!entry || stored.attemptedAt >= (entry.attemptedAt || 0))) entry = stored;
    }
    if (!fresh(entry, now) && !resting(entry, now)) {
      entry = await refresh(entry, now);
      await save(entry).catch(() => {});
    }
    memory = entry;
    return {
      contests: (entry?.contests || []).filter((c) => c.start > now),
      // Platforms with nothing to show because they failed and had no cache.
      failed: (entry?.failed || []).filter((p) => !(entry?.contests || []).some((c) => c.platform === p)),
      fetchedAt: entry?.fetchedAt || null,
    };
  };
}

const doc = () => db().collection("appCache").doc("contests");

export const getContests = makeContestCache({
  fetchFresh: (now) => fetchUpcomingContests({ now }),
  load: async () => {
    if (!adminConfigured()) return null;
    const snap = await doc().get();
    return snap.exists ? snap.data() : null;
  },
  save: async (entry) => {
    if (adminConfigured()) await doc().set(entry);
  },
});
