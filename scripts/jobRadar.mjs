// Daily job-openings radar. (Manual refresh: push a change to this file, or
// use the Actions "Run workflow" button — workflow_dispatch is enabled.)
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

// ── Relevance filter ─────────────────────────────────────────────────────────
// Tuned for a ~2 YoE backend/GenAI SDE-2 profile (Java/Spring, Kafka,
// Kubernetes, LangChain-style GenAI work):
//   • backend/Java/SDE titles plus Kafka/Kubernetes/GenAI/LLM/agentic roles
//   • excludes seniority far above SDE-2 (staff/principal/lead/architect),
//     new-grad/PhD pipelines, and non-backend disciplines
//   • locations: India, or remote anywhere (foreign remote is fine; only
//     foreign onsite is dropped)
const TITLE_RX =
  /\b(software (development )?engineer|sde|swe|backend|back-end|java|senior engineer|member of technical staff|mts|platform engineer|distributed systems|kafka|kubernetes|k8s|gen\s?ai|genai|llm|agentic|ai engineer)\b/i;
const TITLE_EXCLUDE_RX =
  /\b(intern|staff|principal|director|manager|vp|head of|lead|architect|phd|early career|campus|university|new grad|graduate|frontend|front-end|mobile|ios|android|qa|test|sales|support|designer|data scientist|ml engineer|devops|sre|site reliability|security engineer|hardware|embedded|firmware|computer vision)\b/i;
const INDIA_RX = /\b(india|bangalore|bengaluru|hyderabad|pune|gurgaon|gurugram|noida|delhi|ncr|chennai|mumbai)\b/i;

function isRelevant(title, location) {
  if (!TITLE_RX.test(title || "")) return false;
  if (TITLE_EXCLUDE_RX.test(title || "")) return false;
  if (location && !INDIA_RX.test(location) && !/remote/i.test(location)) return false;
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
  netflix: { type: "eightfold", host: "explore.jobs.netflix.net", domain: "netflix.com" },
  "jp-morgan-chase": { type: "oraclecloud", host: "jpmc.fa.oraclecloud.com", site: "CX_1001" },
  atlassian: { type: "atlassian" },
  nvidia: { type: "workdayUrl", url: "https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite" },
  adobe: { type: "workdayUrl", url: "https://adobe.wd5.myworkdayjobs.com/external_experienced" },
  salesforce: { type: "workdayUrl", url: "https://salesforce.wd12.myworkdayjobs.com/External_Career_Site" },
  "target-india": { type: "workdayUrl", url: "https://target.wd5.myworkdayjobs.com/targetcareers" },
  caterpillar: { type: "workdayUrl", url: "https://cat.wd5.myworkdayjobs.com/CaterpillarCareers" },
  servicenow: { type: "smartrecruiters", slug: "ServiceNow" },
  intuit: { type: "phenom", host: "jobs.intuit.com" },
  razorpay: { type: "greenhouse", slug: "razorpaysoftwareprivatelimited" },
  // Boards that verifiably block server-side fetches (Cloudflare/Akamai/bot
  // TLS filters) or whose public APIs are gone — skipped so a fake slug hit
  // can't pollute the bucket. Apply to these via LinkedIn/manually for now:
  // PayPal, Goldman Sachs, Walmart, Apple, Booking.com, Bank of America.
  meta: { type: "none" },
  linkedin: { type: "none" },
  paypal: { type: "none" },
  "goldman-sachs-eng": { type: "none" },
  "walmart-global-tech": { type: "none" },
  apple: { type: "none" },
  "booking-com": { type: "none" },
  "bank-of-america": { type: "none" },
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
      const url = `https://gcsservices.careers.microsoft.com/search/api/v1/search?q=software%20engineer&lc=India&pg=${pg}&pgSz=20&o=Relevance&flt=true`;
      // This host intermittently rejects non-browser TLS — one retry helps.
      const d = (await get(url)) || (await get(url));
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
    if (!Array.isArray(d?.jobs)) return null;
    return d.jobs.map((j) => ({
      id: String(j.id_icims || j.id),
      title: j.title,
      location: j.normalized_location || j.location || "",
      url: `https://www.amazon.jobs${j.job_path}`,
    }));
  },
  // The v3 JSON API is gone (404); the results page is server-rendered, so job
  // links (with slugged titles) can be pulled straight out of the HTML. The
  // query is already India-filtered, so location is trusted to be India.
  async google() {
    const html = await get(
      "https://www.google.com/about/careers/applications/jobs/results?q=%22software%20engineer%22&location=India",
      { text: true, accept: "text/html" }
    );
    if (!html) return null;
    const seen = new Set();
    const out = [];
    for (const m of html.matchAll(/jobs\/results\/(\d+)-([a-z0-9-]+)/g)) {
      if (seen.has(m[1])) continue;
      seen.add(m[1]);
      out.push({
        id: m[1],
        title: m[2].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        location: "India",
        url: `https://www.google.com/about/careers/applications/jobs/results/${m[1]}-${m[2]}`,
      });
    }
    return out.length ? out : null;
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
    if (!Array.isArray(results)) return null;
    return results.map((j) => ({
      id: String(j.id),
      title: j.title,
      location: (j.allLocations || []).map((l) => `${l.city || ""} ${l.countryName || l.country || ""}`).join("; "),
      url: `https://www.uber.com/global/en/careers/list/${j.id}/`,
    }));
  },
  async eightfold(cfg) {
    const d = await get(
      `https://${cfg.host}/api/apply/v2/jobs?domain=${cfg.domain}&query=software%20engineer&location=India&num=100&start=0`
    );
    const positions = d?.positions;
    if (!Array.isArray(positions)) return null;
    return positions.map((j) => ({
      id: String(j.id),
      title: j.name,
      location: j.location || (j.locations || []).join("; "),
      url: j.canonicalPositionUrl || `https://${cfg.host}/careers/job/${j.id}`,
    }));
  },
  async oraclecloud(cfg) {
    const d = await get(
      `https://${cfg.host}/hcmRestApi/resources/latest/recruitingCEJobRequisitions?onlyData=true&expand=requisitionList&finder=findReqs%3BsiteNumber%3D${cfg.site}%2Ckeyword%3Dengineer&limit=100`
    );
    const list = d?.items?.[0]?.requisitionList;
    if (!Array.isArray(list)) return null;
    return list.map((j) => ({
      id: String(j.Id),
      title: j.Title,
      location: j.PrimaryLocation || "",
      url: `https://${cfg.host}/hcmUI/CandidateExperience/en/sites/${cfg.site}/job/${j.Id}`,
    }));
  },
  async atlassian() {
    const d = await get("https://www.atlassian.com/endpoint/careers/listings");
    if (!Array.isArray(d)) return null;
    return d.map((j) => ({
      id: String(j.id),
      title: j.title,
      location: Array.isArray(j.locations) ? j.locations.join("; ") : j.location || "",
      url: j.applyUrl || `https://www.atlassian.com/company/careers/details/${j.id}`,
    }));
  },
  // Phenom sites answer their search widget's POST API, not a REST GET.
  async phenom(cfg) {
    const d = await get(`https://${cfg.host}/widgets`, {
      method: "POST",
      body: {
        lang: "en_us",
        deviceType: "desktop",
        country: "us",
        pageName: "search-results",
        ddoKey: "refineSearch",
        sortBy: "",
        subsearch: "",
        from: 0,
        jobs: true,
        counts: true,
        all_fields: ["category", "country", "state", "city"],
        size: 100,
        clearAll: false,
        jdsource: "facets",
        isSliderEnable: false,
        pageId: "page10",
        siteType: "external",
        keywords: "software engineer",
        global: true,
        selected_fields: {},
        locationData: {},
      },
    });
    const jobs = d?.refineSearch?.data?.jobs;
    if (!Array.isArray(jobs)) return null;
    return jobs.map((j) => ({
      id: String(j.jobId || j.reqId || j.jobSeqNo),
      title: j.title,
      location: j.cityStateCountry || [j.city, j.state, j.country].filter(Boolean).join(", "),
      url: j.applyUrl || `https://${cfg.host}/job/${j.jobSeqNo}`,
    }));
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

// ── LinkedIn: keyword search across ALL companies, not just tracked boards ───
// LinkedIn has no public jobs API; this hits the unauthenticated "guest" HTML
// search endpoint the public jobs page itself uses. It's best-effort — a
// blocked/rate-limited request just yields fewer LinkedIn openings that day,
// it never fails the run. This is the one source that can surface openings at
// companies our per-board adapters can't reach (PayPal, Goldman Sachs,
// Walmart, Apple, Booking.com, Bank of America — all marked "none" above
// because they block server-side fetches) as well as any of the 475 tracked
// companies whose board just isn't auto-detected.
//
// Gating, per the requested profile: title/location reuse the same
// isRelevant() filter as every other source (Java/Spring/backend/Kafka/
// Kubernetes/GenAI/LLM, India or remote). Experience is restricted
// server-side via LinkedIn's own f_E facet (Entry level + Associate, i.e.
// roughly 0-3 YoE) so senior postings never reach the filter. Company is
// gated to a fuzzy match against the curated 475-company list (already
// screened for solid comp/reputation) — LinkedIn surfaces postings from
// staffing agencies and unknown shell companies we have no salary signal
// for, so anything that doesn't match a tracked company is dropped rather
// than guessed at.
const LINKEDIN_QUERIES = [
  "backend software engineer",
  "java spring boot developer",
  "kafka kubernetes engineer",
  "genai llm engineer",
  "agentic ai backend engineer",
];
const LINKEDIN_GEOS = [{ location: "India" }, { location: "Worldwide", remoteOnly: true }];
const LINKEDIN_EXPERIENCE = "2,3"; // LinkedIn facet: Entry level + Associate
const LINKEDIN_WINDOW_SECONDS = 604800; // 7 days — URL-based dedup handles overlap with prior runs
let linkedinDumped = false; // TEMP: gate the one-time HTML sample dump below

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normName(s) {
  return (s || "")
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function matchCompany(rawName, companies, exactIndex) {
  const n = normName(rawName);
  if (!n) return null;
  const exact = exactIndex.get(n);
  if (exact) return exact;
  if (n.length < 4) return null; // too short to substring-match without false positives
  for (const c of companies) {
    const cn = normName(c.name);
    if (cn.length < 4) continue;
    if (n.includes(cn) || cn.includes(n)) return c;
  }
  return null;
}

function parseLinkedInCards(html) {
  const out = [];
  const blocks = html.split('data-entity-urn="urn:li:jobPosting:').slice(1);
  for (const block of blocks) {
    const id = block.match(/^(\d+)"/)?.[1];
    const title = block.match(/base-search-card__title">\s*([^<]+?)\s*</)?.[1];
    const company = block.match(/base-search-card__subtitle"[\s\S]{0,120}?>([^<]+?)<\/a>/)?.[1];
    const location = block.match(/job-search-card__location">\s*([^<]+?)\s*</)?.[1];
    const url = block.match(/href="(https:\/\/[a-z.]*linkedin\.com\/jobs\/view\/[^"?]+)/)?.[1];
    if (!id || !title || !company || !url) continue;
    out.push({ id, title: title.trim(), company: company.trim(), location: (location || "").trim(), url });
  }
  return out;
}

// Bypasses the shared get() helper: LinkedIn's bot detection cares about a
// realistic browser fingerprint (UA/Accept-Language/Referer), and diagnosing
// a scrape that can't be run locally needs the actual status/body size in
// the CI logs rather than a flattened null on any non-2xx.
async function fetchLinkedInPage(keywords, geo) {
  const params = new URLSearchParams({
    keywords,
    location: geo.location,
    f_E: LINKEDIN_EXPERIENCE,
    f_TPR: `r${LINKEDIN_WINDOW_SECONDS}`,
    start: "0",
  });
  if (geo.remoteOnly) params.set("f_WT", "2");
  const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?${params.toString()}`;
  const label = `${geo.location}${geo.remoteOnly ? " (remote)" : ""} "${keywords}"`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.linkedin.com/jobs/search",
      },
    });
    const html = await res.text();
    const cards = res.ok ? parseLinkedInCards(html) : [];
    console.log(`LinkedIn ${label}: HTTP ${res.status}, ${html.length}B, ${cards.length} cards`);
    // TEMP: dump a sample once so the real markup can be inspected from the CI
    // log — the assumed class names are producing 0 cards despite 200s with
    // real body sizes, so the actual structure needs to be seen, not guessed.
    if (!linkedinDumped && html.length > 200) {
      linkedinDumped = true;
      console.log(`LinkedIn HTML sample (${label}):\n${html.slice(0, 3000)}`);
    }
    return cards;
  } catch (e) {
    console.log(`LinkedIn ${label}: request failed (${e.message})`);
    return [];
  } finally {
    clearTimeout(t);
  }
}

async function linkedinScan(companies) {
  const exactIndex = new Map();
  for (const c of companies) {
    const n = normName(c.name);
    if (n && !exactIndex.has(n)) exactIndex.set(n, c);
  }
  const seenIds = new Set();
  const results = [];
  let requests = 0;
  for (const kw of LINKEDIN_QUERIES) {
    for (const geo of LINKEDIN_GEOS) {
      let cards = [];
      try {
        cards = await fetchLinkedInPage(kw, geo);
      } catch {
        cards = [];
      }
      requests += 1;
      for (const card of cards) {
        if (seenIds.has(card.id)) continue;
        seenIds.add(card.id);
        const location = card.location || (geo.remoteOnly ? "Remote" : geo.location);
        if (!isRelevant(card.title, location)) continue;
        const company = matchCompany(card.company, companies, exactIndex);
        if (!company) continue;
        results.push({
          id: card.id,
          title: card.title,
          location,
          url: card.url,
          companyId: company.id,
          companyName: company.name,
        });
      }
      await sleep(1500);
    }
  }
  console.log(`LinkedIn: ${requests} requests, ${results.length} matched relevant openings`);
  return results;
}

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
    const opts = {
      method: "POST",
      body: { appliedFacets: {}, limit: 20, offset, searchText: "engineer" },
    };
    // Workday rate-limits burst traffic across tenants — one retry per page.
    const d =
      (await get(`${base}/wday/cxs/${tenant}/${site}/jobs`, opts)) ||
      (await get(`${base}/wday/cxs/${tenant}/${site}/jobs`, opts));
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

  // LinkedIn keyword scan runs after the per-board fetches: it's a separate,
  // best-effort source that can surface openings at companies no board
  // adapter reaches at all.
  let linkedinCount = 0;
  try {
    const existingUrls = new Set(openings.map((o) => o.url));
    const linkedinJobs = await linkedinScan(report.results);
    for (const j of linkedinJobs) {
      if (existingUrls.has(j.url)) continue; // already surfaced via that company's own board
      const key = jobKey("linkedin", j.id, j.url);
      if (!seen[key]) seen[key] = now;
      openings.push({
        key,
        companyId: j.companyId,
        company: j.companyName,
        ats: "linkedin",
        title: j.title,
        location: j.location,
        url: j.url,
        firstSeen: seen[key],
      });
      linkedinCount += 1;
    }
  } catch (e) {
    console.log("LinkedIn scan failed:", e.message);
  }

  openings.sort((a, b) => b.firstSeen.localeCompare(a.firstSeen) || a.company.localeCompare(b.company));

  covered.sort();
  const newToday = openings.filter((o) => o.firstSeen === now).length;
  const summary = {
    updatedAt: now,
    boards: jobsSources.length,
    boardsFailed: errors.length,
    liveRelevantOpenings: openings.length,
    newThisRun: newToday,
    linkedinOpenings: linkedinCount,
    coveredCompanyIds: covered,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (errors.length) console.log("Failed boards:", errors.slice(0, 20).join(", "));

  writeFileSync(join(RADAR_DIR, "openings.json"), JSON.stringify({ summary, openings }, null, 1));
  writeFileSync(join(RADAR_DIR, "seen.json"), JSON.stringify(seen, null, 1));
  writeFileSync(join(RADAR_DIR, "atsCache.json"), JSON.stringify(atsCache, null, 1));
}

main();
