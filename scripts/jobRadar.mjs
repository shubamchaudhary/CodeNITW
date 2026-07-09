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
const INDIA_RX = /\b(india|bangalore|bengaluru|hyderabad|pune|gurgaon|gurugram|noida|delhi|ncr|chennai|mumbai)\b/i;
// "Remote" pinned to another country is not applicable (e.g. "Remote, USA").
const FOREIGN_RX =
  /\b(usa|u\.s\.a?|united states|america|canada|mexico|uk|united kingdom|england|germany|france|poland|netherlands|spain|portugal|ireland|emea|europe|australia|new zealand|singapore|japan|korea|china|vietnam|philippines|brazil|latam|argentina|colombia|israel|dubai|uae|africa)\b/i;

function isRelevant(title, location) {
  if (!TITLE_RX.test(title || "")) return false;
  if (TITLE_EXCLUDE_RX.test(title || "")) return false;
  if (location && !INDIA_RX.test(location)) {
    if (FOREIGN_RX.test(location)) return false;
    if (!/remote/i.test(location)) return false;
  }
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
        ...(opts.headers || {}),
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

// ── Manual overrides for big custom boards + probe false-positive fixes ──────
// The probe can't detect custom career sites (FAANG etc.) and providers that
// don't expose a board name can hit an unrelated org with the same slug
// (Salesforce/Meta on "recruitee", LinkedIn on "lever" are collisions).
// type "none" = skip entirely rather than fetch a wrong company's jobs.
const OVERRIDES = {
  microsoft: { type: "microsoft" },
  amazon: { type: "amazon" },
  google: { type: "google" },
  uber: { type: "uber" },
  netflix: { type: "netflix" },
  apple: { type: "apple" },
  paypal: { type: "eightfold", host: "paypal.eightfold.ai", domain: "paypal.com" },
  "jp-morgan-chase": { type: "oraclecloud", host: "jpmc.fa.oraclecloud.com", site: "CX_1001" },
  "goldman-sachs-eng": { type: "gs" },
  "walmart-global-tech": { type: "walmart" },
  atlassian: { type: "atlassian" },
  nvidia: { type: "workdayUrl", url: "https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite" },
  adobe: { type: "workdayUrl", url: "https://adobe.wd5.myworkdayjobs.com/external_experienced" },
  salesforce: { type: "workdayUrl", url: "https://salesforce.wd12.myworkdayjobs.com/External_Career_Site" },
  "target-india": { type: "workdayUrl", url: "https://target.wd5.myworkdayjobs.com/targetcareers" },
  "booking-com": { type: "workdayUrl", url: "https://booking.wd3.myworkdayjobs.com/Booking_com" },
  servicenow: { type: "smartrecruiters", slug: "ServiceNow" },
  intuit: { type: "phenom", host: "jobs.intuit.com" },
  razorpay: { type: "greenhouse", slug: "razorpaysoftwareprivatelimited" },
  meta: { type: "none" },
  linkedin: { type: "none" },
};

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

// ── Custom-board adapters (each verified against the live endpoint in CI) ────
const customAdapters = {
  async microsoft() {
    const out = [];
    for (let pg = 1; pg <= 5; pg++) {
      const d = await get(
        `https://gcsservices.careers.microsoft.com/search/api/v1/search?q=software%20engineer&lc=India&pg=${pg}&pgSz=20&o=Relevance&flt=true`
      );
      const jobs = d?.operationResult?.result?.jobs;
      if (!Array.isArray(jobs) || jobs.length === 0) break;
      for (const j of jobs) {
        out.push({
          id: String(j.jobId),
          title: j.title,
          location: (j.properties?.locations || []).join("; "),
          url: `https://jobs.careers.microsoft.com/global/en/job/${j.jobId}`,
        });
      }
    }
    return out.length ? out : null;
  },
  async amazon() {
    const d = await get(
      "https://www.amazon.jobs/en/search.json?base_query=software%20engineer&country=IND&result_limit=100&offset=0"
    );
    if (!Array.isArray(d?.jobs) || d.jobs.length === 0) return null;
    return d.jobs.map((j) => ({
      id: String(j.id_icims || j.id),
      title: j.title,
      location: j.normalized_location || j.location || "",
      url: `https://www.amazon.jobs${j.job_path}`,
    }));
  },
  async google() {
    const d = await get(
      "https://careers.google.com/api/v3/search/?q=%22software%20engineer%22&location=India&page_size=100"
    );
    if (!Array.isArray(d?.jobs) || d.jobs.length === 0) return null;
    return d.jobs.map((j) => ({
      id: String(j.id || "").replace(/\D/g, "") || j.id,
      title: j.title,
      location: (j.locations || []).map((l) => l.display).join("; "),
      url: j.apply_url || `https://www.google.com/about/careers/applications/${j.id}`,
    }));
  },
  async uber() {
    const d = await get("https://www.uber.com/api/loadSearchJobsResults?localeCode=en", {
      method: "POST",
      body: {
        limit: 100,
        page: 0,
        params: { query: "software engineer", location: [{ country: "IND", region: "", city: "" }] },
      },
      headers: { "x-csrf-token": "x" },
    });
    const results = d?.data?.results;
    if (!Array.isArray(results) || results.length === 0) return null;
    return results.map((j) => ({
      id: String(j.id),
      title: j.title,
      location: (j.allLocations || []).map((l) => `${l.city || ""} ${l.countryName || l.country || ""}`).join("; "),
      url: `https://www.uber.com/global/en/careers/list/${j.id}/`,
    }));
  },
  async netflix() {
    const d = await get("https://jobs.netflix.com/api/search?q=software%20engineer&location=India");
    const postings = d?.records?.postings;
    if (!Array.isArray(postings) || postings.length === 0) return null;
    return postings.map((j) => ({
      id: String(j.external_id || j.id),
      title: j.text,
      location: j.location || (j.locations || []).join("; "),
      url: `https://jobs.netflix.com/jobs/${j.external_id || j.id}`,
    }));
  },
  async apple() {
    const d = await get("https://jobs.apple.com/api/role/search", {
      method: "POST",
      body: { query: "software engineer", filters: { locations: ["postLocation-IND"] }, page: 1, locale: "en-us" },
    });
    const jobs = d?.searchResults;
    if (!Array.isArray(jobs) || jobs.length === 0) return null;
    return jobs.map((j) => ({
      id: String(j.positionId || j.id),
      title: j.postingTitle || j.title,
      location: (j.locations || []).map((l) => l.name).join("; "),
      url: `https://jobs.apple.com/en-in/details/${j.positionId || j.id}`,
    }));
  },
  async eightfold(cfg) {
    const d = await get(
      `https://${cfg.host}/api/apply/v2/jobs?domain=${cfg.domain}&query=software%20engineer&location=India&num=100&start=0`
    );
    const positions = d?.positions;
    if (!Array.isArray(positions) || positions.length === 0) return null;
    return positions.map((j) => ({
      id: String(j.id),
      title: j.name,
      location: j.location || (j.locations || []).join("; "),
      url: j.canonicalPositionUrl || `https://${cfg.host}/careers/job/${j.id}`,
    }));
  },
  async oraclecloud(cfg) {
    const d = await get(
      `https://${cfg.host}/hcmRestApi/resources/latest/recruitingCEJobRequisitions?onlyData=true&finder=findReqs;siteNumber=${cfg.site},keyword=%22software%20engineer%22&limit=100`
    );
    const list = d?.items?.[0]?.requisitionList;
    if (!Array.isArray(list) || list.length === 0) return null;
    return list.map((j) => ({
      id: String(j.Id),
      title: j.Title,
      location: j.PrimaryLocation || "",
      url: `https://${cfg.host}/hcmUI/CandidateExperience/en/sites/${cfg.site}/job/${j.Id}`,
    }));
  },
  async gs() {
    const d = await get("https://higher.gs.com/api/search?limit=100&offset=0&query=software%20engineer");
    const items = d?.results || d?.items || d?.jobs;
    if (!Array.isArray(items) || items.length === 0) return null;
    return items.map((j) => ({
      id: String(j.id || j.jobId || j.reference),
      title: j.title || j.name || j.role,
      location: j.location || j.city || (j.locations || []).join("; "),
      url: j.url || `https://higher.gs.com/roles/${j.id || j.jobId}`,
    }));
  },
  async walmart() {
    const d = await get(
      "https://careers.walmart.com/api/search?q=software%20engineer&page=1&sort=rank&expand=department,brand,type,rate"
    );
    const jobs = d?.jobs || d?.data?.jobs;
    if (!Array.isArray(jobs) || jobs.length === 0) return null;
    return jobs.map((j) => ({
      id: String(j.id || j.requisitionId),
      title: j.title,
      location: j.location || (j.locations || []).map((l) => l.name || l).join("; "),
      url: j.url ? (j.url.startsWith("http") ? j.url : `https://careers.walmart.com${j.url}`) : "",
    }));
  },
  async atlassian() {
    const d = await get("https://www.atlassian.com/endpoint/careers/listings");
    if (!Array.isArray(d) || d.length === 0) return null;
    return d.map((j) => ({
      id: String(j.id),
      title: j.title,
      location: Array.isArray(j.locations) ? j.locations.join("; ") : j.location || "",
      url: j.applyUrl || `https://www.atlassian.com/company/careers/details/${j.id}`,
    }));
  },
  async phenom(cfg) {
    const d = await get(`https://${cfg.host}/api/jobs?keywords=software%20engineer&location=India&page=1`);
    const jobs = d?.jobs || d?.data?.jobs || d?.listData?.jobs;
    if (!Array.isArray(jobs) || jobs.length === 0) return null;
    return jobs.map((j) => {
      const job = j.data || j;
      return {
        id: String(job.req_id || job.jobId || job.id),
        title: job.title,
        location: job.full_location || job.location || (job.locations || []).join("; "),
        url: job.apply_url || job.canonical_url || `https://${cfg.host}${job.job_url || ""}`,
      };
    });
  },
  async smartrecruiters(cfg) {
    return adapters.smartrecruiters(cfg.slug);
  },
  async greenhouse(cfg) {
    return adapters.greenhouse(cfg.slug);
  },
  async workdayUrl(cfg) {
    const m = cfg.url.match(WORKDAY_URL_RX);
    return m ? fetchWorkday({ tenant: m[1], wd: m[2], site: m[3] }) : null;
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

  // Route every company to its best fetcher: manual override > probe API
  // mapping > sniffed-Workday resolution. Everything else stays uncovered.
  const jobsSources = [];
  for (const r of report.results) {
    const ov = OVERRIDES[r.id];
    if (ov) {
      if (ov.type !== "none") {
        jobsSources.push({ c: { ...r, ats: ov.type }, fetch: () => customAdapters[ov.type](ov) });
      }
    } else if (r.api && adapters[r.ats]) {
      jobsSources.push({ c: r, fetch: () => adapters[r.ats](r.slug) });
    } else if (r.ats === "workday") {
      jobsSources.push({
        c: { ...r, ats: "workday" },
        fetch: async () => {
          const board = await resolveWorkday(r.careers, atsCache);
          return board ? fetchWorkday(board) : null;
        },
      });
    }
  }
  console.log(`Radar: ${jobsSources.length} boards to fetch`);

  const openings = [];
  const errors = [];
  const covered = [];
  let done = 0;

  async function processCompany(c, fetchJobs) {
    const jobs = await fetchJobs();
    done += 1;
    if (done % 25 === 0) console.log(`…${done} boards`);
    if (!jobs) {
      errors.push(c.name);
      return;
    }
    covered.push(c.id);
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

  const queue = jobsSources.map(({ c, fetch }) => () => processCompany(c, fetch));

  const CONCURRENCY = 10;
  let qi = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (qi < queue.length) await queue[qi++]();
    })
  );

  openings.sort((a, b) => b.firstSeen.localeCompare(a.firstSeen) || a.company.localeCompare(b.company));

  covered.sort();
  const newToday = openings.filter((o) => o.firstSeen === now).length;
  const summary = {
    updatedAt: now,
    boards: jobsSources.length,
    boardsFailed: errors.length,
    liveRelevantOpenings: openings.length,
    newThisRun: newToday,
    coveredCompanyIds: covered,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (errors.length) console.log("Failed boards:", errors.slice(0, 20).join(", "));

  writeFileSync(join(RADAR_DIR, "openings.json"), JSON.stringify({ summary, openings }, null, 1));
  writeFileSync(join(RADAR_DIR, "seen.json"), JSON.stringify(seen, null, 1));
  writeFileSync(join(RADAR_DIR, "atsCache.json"), JSON.stringify(atsCache, null, 1));
}

main();
