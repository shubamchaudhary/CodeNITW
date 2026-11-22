// The radar's door to the shared company pay database (Firestore collection companyPay, through
// /api/radar with the ingest token; the Naukri job finder uses the same database). Looked in first,
// the internet second, and a figure is saved only with enough evidence (extensions/naukri-refresher/
// pay-lib.js confidentPay, checked again by the API). Any failure just means "carry on without it".

import { payKey } from "../../extensions/naukri-refresher/pay-lib.js";

export function makePayDb({ apiUrl, token, fetchImpl = fetch, log = () => {} }) {
  if (!apiUrl || !token) return null;
  let errors = 0;
  const stats = { hits: 0, misses: 0, saved: 0, errors: 0 };
  async function call(body) {
    if (errors >= 3) throw new Error("pay database off for this run");
    try {
      const res = await fetchImpl(apiUrl, {
        method: "POST",
        signal: AbortSignal.timeout(20000),
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      errors += 1;
      stats.errors += 1;
      if (errors === 3) log(`pay database: ${e.message}; going on without it this run`);
      throw e;
    }
  }
  return {
    stats,
    /** A company's saved figure ({ lo, hi, med, n, sources, src, at }) or null. */
    async get(company) {
      const key = payKey(company);
      if (!key) return null;
      const r = await call({ pay: "get", keys: [key] });
      const rec = r.found && r.found[key];
      if (rec) stats.hits += 1;
      else stats.misses += 1;
      return rec || null;
    },
    /** Saves a figure the internet gave, when it has enough evidence (the API says if it did). */
    async put(entry) {
      const r = await call({ pay: "put", entries: [entry] });
      stats.saved += r.saved || 0;
      return r;
    },
  };
}
