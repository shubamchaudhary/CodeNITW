// Pay check for the radar: could an opening pay MIN_LPA (your minimum CTC) or more?
//
// Only one thing drops an opening: the employer's own posted salary topping
// out clearly under the bar (below DROP_UNDER_LPA). Everything else is kept and
// labelled, so a role that pays enough is never lost to an average:
//   meets    — posted salary reaches 25L
//   close    — posted salary tops out just under it (22–25L: worth asking), or
//              the figure was read out of the description text, not stated
//   likely   — no posted salary; the company's India software-engineer pay
//              on levels.fyi has p25 ≥ 25L
//   maybe    — its median ≥ 25L (or a Glassdoor estimate ≥ 25L)
//   low      — its median is under 25L, but its top 10% earn 25L+
//   unlikely — even its top 10% earn under 25L
//   unknown  — no data
// levels.fyi pages are cached for 30 days (misses for 14), and only a few new
// companies are looked up per run.

export const MIN_LPA = 25;
const DROP_UNDER_LPA = 22;

const LOOKUPS_PER_RUN = 80; // levels.fyi page requests, 1.5 s apart
const HIT_TTL = 30 * 86400000;
const MISS_TTL = 14 * 86400000;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

// A few employers whose names on job boards don't slug to their levels.fyi page.
const ALIASES = {
  "amazon dev center india": "amazon",
  adci: "amazon",
  "amazon development centre india": "amazon",
  "walmart global tech": "walmart",
  "walmart global tech india": "walmart",
  "tata consultancy services": "tata-consultancy-services",
  tcs: "tata-consultancy-services",
  "jp morgan chase": "jpmorgan-chase",
  "jpmorgan chase & co.": "jpmorgan-chase",
  "goldman sachs": "goldman-sachs",
  "american express": "american-express",
  "flipkart internet": "flipkart",
};

const SUFFIX_RX =
  /\b(india|pvt\.?|private|ltd\.?|limited|inc\.?|llc|llp|corp(oration)?|technologies|technology|tech|software|solutions|services|labs|global|group|co\.?|hq|work|security|systems)\b/g;

const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function candidates(names) {
  const out = [];
  for (const n of names.filter(Boolean)) {
    const low = String(n).toLowerCase().trim();
    if (ALIASES[low]) out.push(ALIASES[low]);
    out.push(slugify(low));
    out.push(slugify(low.replace(SUFFIX_RX, " ")));
    // ATS board slugs like "gleanwork" or "cleoindia"
    out.push(slugify(low.replace(/(work|india|hq|inc|careers|jobs)$/, "")));
  }
  return [...new Set(out.filter((s) => s && s.length > 1))];
}

async function levelsIndia(slug) {
  const url = `https://www.levels.fyi/companies/${slug}/salaries/software-engineer/locations/india`;
  const res = await fetch(url, { signal: AbortSignal.timeout(20000), headers: { "User-Agent": UA, Accept: "text/html" } });
  if (!res.ok) return null;
  const html = await res.text();
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return null;
  const p = JSON.parse(m[1]).props?.pageProps || {};
  const tc = p.percentiles?.tc;
  const rate = p.locationExchangeRate;
  if (!tc || !rate || !p.percentiles.count || p.locationSlug !== "india") return null;
  // levels.fyi stores amounts in USD; the page's exchange rate turns them into INR.
  const L = (usd) => Math.round(((usd * rate) / 1e5) * 10) / 10;
  return { slug, p10: L(tc.p10), p25: L(tc.p25), p50: L(tc.p50), p75: L(tc.p75), p90: L(tc.p90), n: p.percentiles.count };
}

export function makePayChecker({ cache }) {
  let lookups = 0;

  async function companyPay(names) {
    const key = slugify(names.find(Boolean));
    const hit = cache[key];
    const complete = !hit?.data || hit.data.p90 !== undefined; // older entries lack p90
    if (hit && complete && Date.now() - hit.at < (hit.data ? HIT_TTL : MISS_TTL)) return hit.data;
    if (lookups >= LOOKUPS_PER_RUN) return undefined; // not looked up this run
    let data = null;
    for (const slug of candidates(names).slice(0, 4)) {
      lookups += 1;
      try {
        data = await levelsIndia(slug);
      } catch (_) {
        data = null;
      }
      await new Promise((r) => setTimeout(r, 1500));
      if (data) break;
    }
    cache[key] = { at: Date.now(), data };
    return data;
  }

  // → { verdict, text } — see the top of this file. Only "below" is dropped.
  return async function checkPay(job) {
    const posted = job.pay;
    if (posted && !posted.estimate && (posted.maxL || posted.minL)) {
      const hi = posted.maxL || posted.minL;
      const lo = posted.minL || posted.maxL;
      const text = `₹${lo}${hi !== lo ? `–${hi}` : ""}L ${posted.fromText ? "in the description" : "posted"}`;
      if (hi >= MIN_LPA) return { verdict: "meets", text };
      // A figure parsed out of free text can be a bonus or a typo, so it never drops a role.
      if (hi >= DROP_UNDER_LPA || posted.fromText) return { verdict: "close", text };
      return { verdict: "below", text };
    }
    const co = await companyPay([job.company, job.companySlug]);
    if (co) {
      const top = co.p90 !== undefined ? ` · top 10% ₹${co.p90}L+` : "";
      const text = `levels.fyi India: p25 ₹${co.p25}L · median ₹${co.p50}L${top} (${co.n} reports)`;
      if (co.p25 >= MIN_LPA) return { verdict: "likely", text };
      if (co.p50 >= MIN_LPA) return { verdict: "maybe", text };
      if (co.p90 === undefined || co.p90 >= MIN_LPA) return { verdict: "low", text };
      return { verdict: "unlikely", text };
    }
    if (posted && (posted.maxL || posted.minL)) {
      const hi = posted.maxL || posted.minL;
      return { verdict: hi >= MIN_LPA ? "maybe" : "low", text: `≈₹${hi}L (Glassdoor estimate)` };
    }
    return { verdict: "unknown", text: "" };
  };
}
