// ATS coverage probe for the Job Tracker companies list.
//
// For every company in src/Data/jobTrackerCompanies.js it tries to discover a
// public job-board API (Greenhouse, Lever, Ashby, SmartRecruiters, Workable,
// Recruitee) by probing candidate slugs, and falls back to sniffing the
// careers page HTML for ATS signatures (Workday, Darwinbox, Eightfold, etc.).
//
// For boards with a readable API it also counts openings that look relevant
// for an SDE-2 backend/Java search in India/Remote, so the report answers
// "how many of today's relevant openings would a daily radar catch".
//
// Run: node scripts/atsProbe.mjs   → writes scripts/ats-probe-report.json
// Needs unrestricted egress (run in CI, not the Claude sandbox).

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load companies from the data file ────────────────────────────────────────
function loadCompanies() {
  const src = readFileSync(join(__dirname, "../src/Data/jobTrackerCompanies.js"), "utf8");
  const start = src.indexOf("export const COMPANIES = ") + "export const COMPANIES = ".length;
  const end = src.indexOf("export const REFERRAL_TEMPLATES");
  let txt = src.slice(start, end).trim();
  if (txt.endsWith(";")) txt = txt.slice(0, -1);
  return JSON.parse(txt);
}

// ── Relevance filter (same logic the radar would use) ────────────────────────
const TITLE_RX =
  /\b(software (development )?engineer|sde|swe|backend|back-end|java|senior engineer|member of technical staff|mts|platform engineer|distributed systems)\b/i;
const TITLE_EXCLUDE_RX =
  /\b(intern|staff|principal|director|manager|vp|head of|frontend|front-end|mobile|ios|android|qa|test|sales|support|designer|data scientist|ml engineer|devops|sre|site reliability|security engineer|hardware|embedded)\b/i;
const LOCATION_RX = /\b(india|bangalore|bengaluru|hyderabad|pune|gurgaon|gurugram|noida|delhi|ncr|chennai|mumbai|remote)\b/i;

function isRelevant(title, location) {
  if (!TITLE_RX.test(title || "")) return false;
  if (TITLE_EXCLUDE_RX.test(title || "")) return false;
  // Empty location strings (fully-remote boards often omit it) pass through.
  if (location && !LOCATION_RX.test(location)) return false;
  return true;
}

// ── HTTP helper ───────────────────────────────────────────────────────────────
async function get(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.timeout || 9000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (job-radar probe)", Accept: opts.accept || "application/json" },
    });
    if (!res.ok) return null;
    return opts.text ? await res.text() : await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// ── Candidate slugs per company ───────────────────────────────────────────────
function slugCandidates(c) {
  const out = new Set();
  const base = c.name
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/&/g, "and")
    .trim();
  out.add(c.id);
  out.add(base.replace(/[^a-z0-9]+/g, ""));
  out.add(base.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  // Drop common suffixes: "SAP Labs" → "sap", "Zeta (Directi)" → "zeta"
  const first = base.split(/[\s/]+/)[0];
  if (first.length > 2) out.add(first);
  try {
    const host = new URL(c.careers).host.replace(/^(www|careers|jobs|apply)\./, "");
    out.add(host.split(".")[0]);
  } catch {}
  return [...out].filter((s) => s && s.length > 1);
}

// Names must roughly agree before we trust a slug hit on a name-exposing API,
// otherwise "target" or "neon" style slugs match unrelated boards.
function nameMatches(companyName, boardName) {
  if (!boardName) return false;
  const norm = (s) => s.toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9]/g, "");
  const a = norm(companyName);
  const b = norm(boardName);
  if (!a || !b) return false;
  return a.includes(b) || b.includes(a);
}

// ── Per-provider probes: return jobs[] or null ────────────────────────────────
// Every provider returns 200 + an empty list for some unknown slugs, so an
// empty board is treated as "no hit" — these companies are all hiring at
// scale, a genuinely 0-job board is indistinguishable from a false positive.
const providers = {
  async greenhouse(slug, company) {
    const board = await get(`https://boards-api.greenhouse.io/v1/boards/${slug}`);
    if (!board || !nameMatches(company.name, board.name)) return null;
    const d = await get(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`);
    if (!d || !Array.isArray(d.jobs) || d.jobs.length === 0) return null;
    return d.jobs.map((j) => ({ title: j.title, location: j.location?.name || "", url: j.absolute_url }));
  },
  async lever(slug) {
    const d = await get(`https://api.lever.co/v0/postings/${slug}?mode=json`);
    if (!Array.isArray(d) || d.length === 0) return null;
    return d.map((j) => ({ title: j.text, location: j.categories?.location || "", url: j.hostedUrl }));
  },
  async ashby(slug) {
    const d = await get(`https://api.ashbyhq.com/posting-api/job-board/${slug}`);
    if (!d || !Array.isArray(d.jobs) || d.jobs.length === 0) return null;
    return d.jobs.map((j) => ({ title: j.title, location: j.location || "", url: j.jobUrl }));
  },
  async workable(slug) {
    const d = await get(`https://apply.workable.com/api/v1/widget/accounts/${slug}`);
    if (!d || !Array.isArray(d.jobs) || d.jobs.length === 0) return null;
    return d.jobs.map((j) => ({ title: j.title, location: `${j.city || ""} ${j.country || ""}`, url: j.shortlink }));
  },
  async recruitee(slug) {
    const d = await get(`https://${slug}.recruitee.com/api/offers/`);
    if (!d || !Array.isArray(d.offers) || d.offers.length === 0) return null;
    return d.offers.map((j) => ({ title: j.title, location: j.location || "", url: j.careers_url }));
  },
  // Last: its API answers 200 for any slug, so it needs the name check.
  async smartrecruiters(slug, company) {
    const info = await get(`https://api.smartrecruiters.com/v1/companies/${slug}`);
    if (!info || !nameMatches(company.name, info.name)) return null;
    const d = await get(`https://api.smartrecruiters.com/v1/companies/${slug}/postings?limit=100`);
    if (!d || !Array.isArray(d.content) || d.content.length === 0) return null;
    return d.content.map((j) => ({
      title: j.name,
      location: `${j.location?.city || ""} ${j.location?.country || ""}`,
      url: `https://jobs.smartrecruiters.com/${slug}/${j.id}`,
    }));
  },
};

// ── HTML sniffing fallback (identifies the ATS even without a JSON API) ───────
const HTML_SIGNATURES = [
  ["workday", /myworkdayjobs\.com|workday\.com\/.*\/careers|wd\d\.myworkdaysite/i],
  ["greenhouse", /greenhouse\.io/i],
  ["lever", /lever\.co/i],
  ["ashby", /ashbyhq\.com/i],
  ["smartrecruiters", /smartrecruiters\.com/i],
  ["workable", /workable\.com/i],
  ["darwinbox", /darwinbox\.(in|com)/i],
  ["eightfold", /eightfold\.ai/i],
  ["phenom", /phenompeople|phenom\.com/i],
  ["successfactors", /successfactors|career5?\.sapsf/i],
  ["taleo", /taleo\.net/i],
  ["icims", /icims\.com/i],
  ["jobvite", /jobvite\.com/i],
  ["bamboohr", /bamboohr\.com/i],
  ["zohorecruit", /zohorecruit\.com/i],
  ["keka", /keka\.com|kekahire/i],
  ["freshteam", /freshteam\.com/i],
  ["greenhouse-embed", /grnh\.se/i],
];

async function sniffCareersPage(c) {
  const html = await get(c.careers, { text: true, accept: "text/html", timeout: 12000 });
  if (!html) return null;
  for (const [ats, rx] of HTML_SIGNATURES) {
    if (rx.test(html)) return ats;
  }
  return null;
}

// ── Probe one company ─────────────────────────────────────────────────────────
async function probeCompany(c) {
  const slugs = slugCandidates(c);
  for (const [name, fn] of Object.entries(providers)) {
    for (const slug of slugs) {
      const jobs = await fn(slug, c);
      if (jobs) {
        const relevant = jobs.filter((j) => isRelevant(j.title, j.location));
        return {
          ats: name,
          slug,
          api: true,
          totalJobs: jobs.length,
          relevantJobs: relevant.length,
          sampleRelevant: relevant.slice(0, 3).map((j) => j.title),
        };
      }
    }
  }
  const sniffed = await sniffCareersPage(c);
  if (sniffed) return { ats: sniffed, slug: null, api: false, totalJobs: null, relevantJobs: null };
  return { ats: null, slug: null, api: false, totalJobs: null, relevantJobs: null };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const companies = loadCompanies();
  console.log(`Probing ${companies.length} companies…`);
  const results = [];
  const CONCURRENCY = 12;
  let i = 0;
  async function worker() {
    while (i < companies.length) {
      const idx = i++;
      const c = companies[idx];
      const r = await probeCompany(c);
      results[idx] = { id: c.id, name: c.name, tier: c.tier, match: c.match, javaFit: c.javaFit, careers: c.careers, ...r };
      if (idx % 25 === 0) console.log(`…${idx}/${companies.length}`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const withApi = results.filter((r) => r.api);
  const sniffOnly = results.filter((r) => !r.api && r.ats);
  const unknown = results.filter((r) => !r.ats);
  const relevantOpenings = withApi.reduce((s, r) => s + (r.relevantJobs || 0), 0);
  const highValue = results.filter((r) => ["Very High", "High"].includes(r.match));
  const highValueApi = highValue.filter((r) => r.api);

  const summary = {
    probedAt: new Date().toISOString(),
    totalCompanies: results.length,
    apiCoverage: withApi.length,
    sniffedOnly: sniffOnly.length,
    undetected: unknown.length,
    relevantOpeningsToday: relevantOpenings,
    highValueCompanies: highValue.length,
    highValueWithApi: highValueApi.length,
    byAts: Object.fromEntries(
      [...new Set(results.map((r) => r.ats).filter(Boolean))].map((a) => [
        a,
        results.filter((r) => r.ats === a).length,
      ])
    ),
  };
  console.log(JSON.stringify(summary, null, 2));
  writeFileSync(join(__dirname, "ats-probe-report.json"), JSON.stringify({ summary, results }, null, 1));
  console.log("Report written to scripts/ats-probe-report.json");
}

main();
