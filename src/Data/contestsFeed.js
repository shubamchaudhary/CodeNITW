// The upcoming-contests list from /api/contests, fetched once and reused for
// a minute: the site tour warms it up so the Contests page opens with its
// data, and a quick revisit doesn't refetch. `fresh` skips the cache (Retry).
const TTL_MS = 60 * 1000;
let cached = null; // { at, promise, data once it arrives }

export function fetchContests({ fresh = false } = {}) {
  if (!fresh && cached && Date.now() - cached.at < TTL_MS) return cached.promise;
  const promise = fetch("/api/contests")
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
    .then((d) => ({ contests: d.contests || [], failed: d.failed || [] }));
  const entry = { at: Date.now(), promise };
  cached = entry;
  promise.then((d) => { entry.data = d; }, () => {});
  promise.catch(() => { if (cached === entry) cached = null; });
  return promise;
}

// The list, if a fresh copy has already arrived: lets the page open with it
// instead of flashing its loading state for a frame.
export function peekContests() {
  return cached && Date.now() - cached.at < TTL_MS ? cached.data || null : null;
}
