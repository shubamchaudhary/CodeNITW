// Daily job-openings radar.
//
// Reads the ATS mapping discovered by atsProbe (scripts/ats-probe-report.json),
// fetches every readable job board, filters for SDE-2/backend/Java roles in
// India/Remote, and diffs against previously seen job keys. Results are
// committed by the workflow:
//   radar/openings.json  — every currently-live relevant opening (+firstSeen)
//   radar/seen.json      — job keys already surfaced, so "new" stays stable
//   radar/atsCache.json  — resolved Workday board URLs (avoids re-sniffing)
//
// The tracker UI fetches radar/openings.json from raw.githubusercontent.com at
// runtime, so a radar run needs no app redeploy and no server.
//
// Run: node scripts/jobRadar.mjs   (needs unrestricted egress — runs in CI)

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createHash } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RADAR_DIR = join(__dirname, "../radar");

// ── Relevance filter (kept in sync with scripts/atsProbe.mjs) ────────────────
const TITLE_RX =
  /\b(software (development )?engineer|sde|swe|backend|back-end|java|senior engineer|member of technical staff|mts|platform engineer|distributed systems)\b/i;
const TITLE_EXCLUDE_RX =
  /\b(intern|staff|principal|director|manager|vp|head of|frontend|front-end|mobile|ios|android|qa|test|sales|support|designer|data scientist|ml engineer|devops|sre|site reliability|security engineer|hardware|embedded)\b/i;
const LOCATION_RX = /\b(india|bangalore|bengaluru|hyderabad|pune|gurgaon|gurugram|noida|delhi|ncr|chennai|mumbai|remote)\b/i;

function isRelevant(title, location) {
  if (!TITLE_RX.test(title || "")) return false;
  if (TITLE_EXCLUDE_RX.test(title || "")) return false;
  if (location && !LOCATION_RX.test(location)) return false;
  return true;
}

// ── IO helpers ────────────────────────────────────────────────────────────────
function loadJSON(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

async function get(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.timeout || 12000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      method: opts.method || "GET",
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      headers: {
        "User-Agent": "Mozilla/5.0 (job-radar)",
        Accept: opts.accept || "application/json",
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
      },
    });
    if (!res.ok) return null;
    return opts.text ? await res.text() : await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function jobKey(ats, id, url) {
  const raw = id ? `${ats}:${id}` : `${ats}:${(url || "").replace(/[?#].*$/, "")}`;
  return createHash("sha1").update(raw).digest("hex").slice(0, 16);
}

// ── API adapters: mapping entry → [{id,title,location,url}] ──────────────────
const adapters = {
  async greenhouse(slug) {
    const d = await get(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`);
    if (!d || !Array.isArray(d.jobs)) return null;
    return d.jobs.map((j) => ({ id: String(j.id), title: j.title, location: j.location?.name || "", url: j.absolute_url }));
  },
  async lever(slug) {
    const d = await get(`https://api.lever.co/v0/postings/${slug}?mode=json`);
    if (!Array.isArray(d)) return null;
    return d.map((j) => ({ id: j.id, title: j.text, location: j.categories?.location || "", url: j.hostedUrl }));
  },
  async ashby(slug) {
    const d = await get(`https://api.ashbyhq.com/posting-api/job-board/${slug}`);
    if (!d || !Array.isArray(d.jobs)) return null;
    return d.jobs.map((j) => ({ id: j.id, title: j.title, location: j.location || "", url: j.jobUrl }));
  },
  async workable(slug) {
    const d = await get(`https://apply.workable.com/api/v1/widget/accounts/${slug}`);
    if (!d || !Array.isArray(d.jobs)) return null;
    return d.jobs.map((j) => ({ id: j.shortcode || j.id, title: j.title, location: `${j.city || ""} ${j.country || ""}`.trim(), url: j.shortlink }));
  },
  async recruitee(slug) {
    const d = await get(`https://${slug}.recruitee.com/api/offers/`);
    if (!d || !Array.isArray(d.offers)) return null;
    return d.offers.map((j) => ({ id: String(j.id), title: j.title, location: j.location || "", url: j.careers_url }));
  },
  async smartrecruiters(slug) {
    const d = await get(`https://api.smartrecruiters.com/v1/companies/${slug}/postings?limit=100`);
    if (!d || !Array.isArray(d.content)) return null;
    return d.content.map((j) => ({
      id: String(j.id),
      title: j.name,
      location: `${j.location?.city || ""} ${j.location?.country || ""}`.trim(),
      url: `https://jobs.smartrecruiters.com/${slug}/${j.id}`,
    }));
  },
};

// ── Workday: resolve board URL from the careers page, then use the CxS API ───
const WORKDAY_URL_RX = /https?:\/\/([a-z0-9-]+)\.(wd\d+)\.myworkdayjobs\.com\/(?:[a-z]{2}-[A-Z]{2}\/)?([A-Za-z0-9_-]+)/;

async function resolveWorkday(careersUrl, cache) {
  if (cache[careersUrl] !== undefined) return cache[careersUrl];
  const html = await get(careersUrl, { text: true, accept: "text/html", timeout: 15000 });
  const m = html && html.match(WORKDAY_URL_RX);
  cache[careersUrl] = m ? { tenant: m[1], wd: m[2], site: m[3] } : null;
  return cache[careersUrl];
}

async function fetchWorkday(board) {
  const { tenant, wd, site } = board;
  const base = `https://${tenant}.${wd}.myworkdayjobs.com`;
  const out = [];
  for (let offset = 0; offset < 160; offset += 20) {
    const d = await get(`${base}/wday/cxs/${tenant}/${site}/jobs`, {
      method: "POST",
      body: { appliedFacets: {}, limit: 20, offset, searchText: "engineer" },
    });
    const postings = d?.jobPostings;
    if (!Array.isArray(postings) || postings.length === 0) break;
    for (const j of postings) {
      out.push({
        id: j.bulletFields?.[0] || j.externalPath,
        title: j.title,
        location: j.locationsText || "",
        url: `${base}/${site}${j.externalPath}`,
      });
    }
    if (postings.length < 20) break;
  }
  return out.length ? out : null;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const report = loadJSON(join(__dirname, "ats-probe-report.json"), null);
  if (!report) throw new Error("scripts/ats-probe-report.json missing — run atsProbe first");

  mkdirSync(RADAR_DIR, { recursive: true });
  const seen = loadJSON(join(RADAR_DIR, "seen.json"), {});
  const atsCache = loadJSON(join(RADAR_DIR, "atsCache.json"), {});
  const now = new Date().toISOString();

  const apiCompanies = report.results.filter((r) => r.api && adapters[r.ats]);
  const workdayCompanies = report.results.filter((r) => !r.api && r.ats === "workday");
  console.log(`Radar: ${apiCompanies.length} API boards + ${workdayCompanies.length} Workday boards`);

  const openings = [];
  const errors = [];
  let done = 0;

  async function processCompany(c, fetchJobs) {
    const jobs = await fetchJobs();
    done += 1;
    if (done % 25 === 0) console.log(`…${done} boards`);
    if (!jobs) {
      errors.push(c.name);
      return;
    }
    for (const j of jobs) {
      if (!isRelevant(j.title, j.location)) continue;
      const key = jobKey(c.ats, j.id, j.url);
      if (!seen[key]) seen[key] = now;
      openings.push({
        key,
        companyId: c.id,
        company: c.name,
        ats: c.ats,
        title: j.title,
        location: j.location,
        url: j.url,
        firstSeen: seen[key],
      });
    }
  }

  const queue = [
    ...apiCompanies.map((c) => () => processCompany(c, () => adapters[c.ats](c.slug))),
    ...workdayCompanies.map((c) => () =>
      processCompany({ ...c, ats: "workday" }, async () => {
        const board = await resolveWorkday(c.careers, atsCache);
        return board ? fetchWorkday(board) : null;
      })
    ),
  ];

  const CONCURRENCY = 10;
  let qi = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (qi < queue.length) await queue[qi++]();
    })
  );

  openings.sort((a, b) => b.firstSeen.localeCompare(a.firstSeen) || a.company.localeCompare(b.company));

  const newToday = openings.filter((o) => o.firstSeen === now).length;
  const summary = {
    updatedAt: now,
    boards: apiCompanies.length + workdayCompanies.length,
    boardsFailed: errors.length,
    liveRelevantOpenings: openings.length,
    newThisRun: newToday,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (errors.length) console.log("Failed boards:", errors.slice(0, 20).join(", "));

  writeFileSync(join(RADAR_DIR, "openings.json"), JSON.stringify({ summary, openings }, null, 1));
  writeFileSync(join(RADAR_DIR, "seen.json"), JSON.stringify(seen, null, 1));
  writeFileSync(join(RADAR_DIR, "atsCache.json"), JSON.stringify(atsCache, null, 1));
}

main();
