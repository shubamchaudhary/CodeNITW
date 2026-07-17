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
import { buildScorer } from "./scoreOpening.mjs";

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

// Turn an ATS job description (HTML or plain text) into clean plain text for the
// skills scorer. Strips tags/entities; capped generously so a long JD still
// yields plenty of skill keywords without keeping megabytes in memory.
function stripHtml(s, max = 8000) {
  if (!s) return "";
  const text = String(s)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&rsquo;|&lsquo;/gi, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/gi, '"')
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? text.slice(0, max) : text;
}

// Short snippet stored on each opening for a UI "why" tooltip (the full JD is
// only used transiently for scoring, never committed).
function clip(s, max = 220) {
  const t = s || "";
  return t.length > max ? t.slice(0, max).trimEnd() + "…" : t;
}

// Openings requiring more than this many years of experience are dropped
// (profile is ~2 YoE; 0-2 preferred, 3 max).
const MAX_YOE = 3;

// Best-effort minimum-years-of-experience parse from a full JD. Scans for
// "N years", "N+ years", "N-M years", "minimum N years" etc., but only counts a
// number when "experience" sits nearby, so unrelated counts ("team of 10",
// "5 services") don't leak in. Returns the smallest required floor, or undefined
// when the JD says nothing about experience.
function parseMinYoe(text) {
  if (!text) return undefined;
  const t = text.toLowerCase();
  let min;
  const rx = /(\d{1,2})\s*(?:\+|-|–|—|to)?\s*(?:\d{1,2})?\s*\+?\s*years?/g;
  let m;
  while ((m = rx.exec(t))) {
    const around = t.slice(Math.max(0, m.index - 30), m.index + m[0].length + 40);
    if (!/exp(?:erience)?\b/.test(around)) continue;
    const low = parseInt(m[1], 10);
    if (!isNaN(low) && low >= 0 && low <= 30) min = min === undefined ? low : Math.min(min, low);
  }
  return min;
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
  // Verified via lead probe: rest searchjobs answers with requisitionList for
  // this portal id (the careersection UI path is 10000).
  "societe-generale": { type: "taleo", host: "socgen.taleo.net", portal: "101430233", cs: "10000" },
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
    // content=true returns the (HTML) job description inline — one call, no N+1.
    const d = await get(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`);
    if (!d || !Array.isArray(d.jobs)) return null;
    return d.jobs.map((j) => ({ id: String(j.id), title: j.title, location: j.location?.name || "", url: j.absolute_url, desc: j.content }));
  },
  async lever(slug) {
    const d = await get(`https://api.lever.co/v0/postings/${slug}?mode=json`);
    if (!Array.isArray(d)) return null;
    return d.map((j) => ({ id: j.id, title: j.text, location: j.categories?.location || "", url: j.hostedUrl, desc: j.descriptionPlain || j.description }));
  },
  async ashby(slug) {
    const d = await get(`https://api.ashbyhq.com/posting-api/job-board/${slug}`);
    if (!d || !Array.isArray(d.jobs)) return null;
    return d.jobs.map((j) => ({ id: j.id, title: j.title, location: j.location || "", url: j.jobUrl, desc: j.descriptionPlain || j.descriptionHtml }));
  },
  async workable(slug) {
    const d = await get(`https://apply.workable.com/api/v1/widget/accounts/${slug}`);
    if (!d || !Array.isArray(d.jobs)) return null;
    return d.jobs.map((j) => ({ id: j.shortcode || j.id, title: j.title, location: `${j.city || ""} ${j.country || ""}`.trim(), url: j.shortlink, desc: j.description }));
  },
  async recruitee(slug) {
    const d = await get(`https://${slug}.recruitee.com/api/offers/`);
    if (!d || !Array.isArray(d.offers)) return null;
    return d.offers.map((j) => ({ id: String(j.id), title: j.title, location: j.location || "", url: j.careers_url, desc: j.description }));
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
          desc: [j.properties?.description, j.properties?.responsibilities, j.properties?.qualifications]
            .filter(Boolean)
            .join(" "),
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
      desc: [j.description, j.basic_qualifications, j.preferred_qualifications].filter(Boolean).join(" "),
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
      desc: j.description || "",
    }));
  },
  // Eightfold's public `/api/apply/v2/jobs` now 403s ("Not authorized for
  // PCSX"). The careers SPA instead calls `/api/pcsx/search`, which works for
  // anonymous clients IF they carry the `_vs`/`_vscid` cookies the shell sets.
  // So: GET the careers page for a Set-Cookie, then hit pcsx/search with it.
  // (Verified live in CI against jobs.twilio.com — real positions returned.)
  async eightfold(cfg) {
    let cookie = "";
    try {
      const shell = await fetch(`https://${cfg.host}/careers`, {
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 (job-radar)", Accept: "text/html" },
      });
      const setC = shell.headers.getSetCookie?.() || [];
      cookie = setC.map((c) => c.split(";")[0]).join("; ");
    } catch {
      /* fall through — some tenants don't gate pcsx on a cookie */
    }
    const headers = { Accept: "application/json", ...(cookie ? { Cookie: cookie } : {}) };
    const out = [];
    for (let start = 0; start < 200; start += 50) {
      const d = await get(
        `https://${cfg.host}/api/pcsx/search?domain=${cfg.domain}&query=engineer&location=India&num=50&start=${start}&sort_by=relevance`,
        { headers }
      );
      const positions = d?.data?.positions || d?.positions;
      if (!Array.isArray(positions) || positions.length === 0) break;
      for (const j of positions) {
        out.push({
          id: String(j.id || j.pid || j.displayJobId),
          title: j.name,
          location: j.location || (j.locations || []).join("; "),
          url: j.canonicalPositionUrl || `https://${cfg.host}/careers/job/${j.id}`,
          desc: j.job_description || j.description || "",
        });
      }
      if (positions.length < 50) break;
    }
    return out.length ? out : null;
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
      desc: j.ShortDescriptionStr || j.ExternalDescriptionStr || "",
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
      desc: [j.overview, j.responsibilities, j.qualifications, j.content].filter(Boolean).join(" "),
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
      desc: j.description || j.descriptionTeaser || j.jobDescription || "",
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
  // Taleo career sections: the rest/jobboard/searchjobs endpoint returns
  // requisitionList JSON when called with the tenant's portal id (verified for
  // SocGen in CI: 24 requisitions). Titles live in column[0]; locations are
  // often absent, so those pass the location filter as unknown.
  async taleo(cfg) {
    const d = await get(`https://${cfg.host}/careersection/rest/jobboard/searchjobs?lang=en&portal=${cfg.portal}`, {
      method: "POST",
      headers: { tz: "GMT+05:30" },
      body: {
        multilineEnabled: false,
        sortingSelection: { sortBySelectionParam: "3", ascendingSortingOrder: "false" },
        fieldData: { fields: {}, valid: true },
        filterSelectionParam: { searchFilterSelections: [] },
        advancedSearchFiltersSelectionParam: { searchFilterSelections: [] },
        pageNo: 1,
      },
    });
    if (!Array.isArray(d?.requisitionList)) return null;
    return d.requisitionList.map((j) => ({
      id: String(j.contestNo || j.jobId),
      title: Array.isArray(j.column) ? j.column[0] : "",
      location: (j.locationsColumns || []).flat().filter(Boolean).join("; "),
      url: `https://${cfg.host}/careersection/${cfg.cs}/jobdetail.ftl?job=${encodeURIComponent(j.contestNo || j.jobId)}&lang=en`,
    }));
  },
};

// ── Board-map adapters (configs discovered + verified by deepProbe.mjs) ──────
// scripts/board-map.json holds fetch configs the deep probe extracted from
// each company's own careers pages and verified against the live endpoint —
// so slugs/hosts here can't be name collisions. Standard providers reuse the
// adapters above; the rest are small ATS-specific fetchers.
const boardMapAdapters = {
  greenhouse: (cfg) => adapters.greenhouse(cfg.slug),
  lever: (cfg) => adapters.lever(cfg.slug),
  ashby: (cfg) => adapters.ashby(cfg.slug),
  workable: (cfg) => adapters.workable(cfg.slug),
  recruitee: (cfg) => adapters.recruitee(cfg.slug),
  smartrecruiters: (cfg) => adapters.smartrecruiters(cfg.slug),
  workdayUrl: (cfg) => customAdapters.workdayUrl(cfg),
  eightfold: (cfg) => customAdapters.eightfold(cfg),
  phenom: (cfg) => customAdapters.phenom(cfg),
  async freshteam(cfg) {
    const d = await get(`https://${cfg.host}/hire/widgets/jobs.json`);
    const list = Array.isArray(d?.jobs) ? d.jobs : Array.isArray(d) ? d : null;
    if (!list) return null;
    return list.map((j) => ({
      id: String(j.id),
      title: j.title,
      location: [j.branch?.city, j.branch?.state, j.branch?.country_code].filter(Boolean).join(", ") || (j.remote ? "Remote" : ""),
      url: j.url || `https://${cfg.host}/jobs/${j.id}`,
      desc: j.description,
    }));
  },
  async bamboohr(cfg) {
    const d = await get(`https://${cfg.host}/careers/list`);
    if (!Array.isArray(d?.result)) return null;
    return d.result.map((j) => ({
      id: String(j.id),
      title: j.jobOpeningName,
      location:
        [j.location?.city, j.location?.state, j.location?.country].filter(Boolean).join(", ") +
        (j.isRemote ? " Remote" : ""),
      url: `https://${cfg.host}/careers/${j.id}`,
    }));
  },
  // Keka career sites render into a static HTML fragment the shell fetches
  // from /ats/documents/<guid>/careerportal/<hash>.html. The path is emitted
  // inline in a fetch() call on the shell; the fragment carries anchor tags to
  // each posting (…/careers/<jobId>). Grab the shell, follow the fragment,
  // pull the job links out.
  async keka(cfg) {
    const shell = await get(`https://${cfg.host}/careers/`, { text: true, accept: "text/html" });
    if (!shell) return null;
    const frag = shell.match(/fetch\(\s*['"](\/ats\/documents\/[^'"]+careerportal\/[^'"]+\.html)['"]/i)?.[1];
    const html = frag ? await get(`https://${cfg.host}${frag}`, { text: true, accept: "text/html" }) : shell;
    if (!html) return null;
    const seen = new Set();
    const out = [];
    // Each posting links to /careers/<jobId>; the visible anchor text is the
    // role title. Capture id + inner text.
    for (const m of html.matchAll(/href=["'](?:https?:\/\/[^"']+)?\/careers\/([0-9]+)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi)) {
      const id = m[1];
      if (seen.has(id)) continue;
      seen.add(id);
      const title = m[2].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      if (!title) continue;
      out.push({ id, title, location: "", url: `https://${cfg.host}/careers/${id}` });
    }
    return out.length ? out : null;
  },
  // Generic fallback: schema.org JobPosting JSON-LD embedded in the careers
  // page (usually only a handful of postings, but they're real).
  async jsonld(cfg) {
    const html = await get(cfg.url, { text: true, accept: "text/html" });
    if (!html) return null;
    const out = [];
    for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
      let data;
      try {
        data = JSON.parse(m[1]);
      } catch {
        continue;
      }
      const nodes = Array.isArray(data) ? data : data["@graph"] || [data];
      for (const n of nodes) {
        const t = n?.["@type"];
        if (t !== "JobPosting" && !(Array.isArray(t) && t.includes("JobPosting"))) continue;
        const locNodes = Array.isArray(n.jobLocation) ? n.jobLocation : [n.jobLocation];
        const location =
          locNodes
            .filter(Boolean)
            .map((l) => [l.address?.addressLocality, l.address?.addressCountry].filter(Boolean).join(", "))
            .filter(Boolean)
            .join("; ") || (n.jobLocationType === "TELECOMMUTE" ? "Remote" : "");
        out.push({
          id: String(n.identifier?.value || n.url || n.title),
          title: n.title,
          location,
          url: n.url || cfg.url,
          desc: typeof n.description === "string" ? n.description : "",
        });
      }
    }
    return out.length ? out : null;
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

// ── Targeted sweep for companies no board adapter can read ────────────────────
// ~290 of the tracked companies have no readable board: bot-blocked career
// sites (PayPal, Goldman Sachs, Walmart, Apple, Meta, Booking.com, BofA),
// flaky adapters (Microsoft, Intuit), and companies with no detectable ATS.
// For the high-match ones, query LinkedIn by company name so their postings
// still land in the bucket. A rotating daily slice keeps the request count
// small; the rotation period matching the f_TPR posting window means a
// company swept once per cycle still sees everything it posted in between.
// The Medium-tier names here are force-included because their boards are
// verifiably unscrapable — LinkedIn is the ONLY automated path to them.
const SWEEP_ROTATION_DAYS = 7;
const FORCE_SWEEP_IDS = new Set([
  "meta", "apple", "bank-of-america", "paypal", "goldman-sachs-eng",
  "walmart-global-tech", "booking-com", "microsoft", "intuit",
  // iCIMS boards sit behind an AWS WAF human-verification wall (deep probe,
  // round 1) — LinkedIn is the only automated path to these too.
  "github", "amd", "docusign",
  // Confirmed dead ends from the lead probes: eightfold tenants that 403 the
  // public API (CSRF-gated), darwinbox SPAs behind Cloudflare Turnstile,
  // bot-gated shells, and boards that moved to unknown slugs. Medium tier,
  // so they'd never enter the sweep pool on match alone — force them since
  // no board adapter can reach them. Any that later verify via the deep
  // probe drop out automatically (sweep only targets uncovered companies).
  "honeywell", "morgan-stanley", "millennium-management", "john-deere",
  "astrazeneca", "micron", "optum-unitedhealth", "segment-twilio",
  "weights-biases", "coda", "clevertap", "pharmeasy", "bharatpe", "spinny",
  "leadsquared", "lendingkart", "upgrad", "physicswallah",
]);

function sweepTargets(companies, coveredIds) {
  const pool = companies
    .filter(
      (c) =>
        !coveredIds.has(c.id) &&
        c.id !== "linkedin" && // searching LinkedIn for "LinkedIn engineer" drowns in noise
        (FORCE_SWEEP_IDS.has(c.id) || ["Very High", "High"].includes(c.match))
    )
    .sort((a, b) => a.id.localeCompare(b.id));
  if (pool.length === 0) return [];
  const per = Math.ceil(pool.length / SWEEP_ROTATION_DAYS);
  const day = Math.floor(Date.now() / 86400000) % SWEEP_ROTATION_DAYS;
  return pool.slice(day * per, (day + 1) * per);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normName(s) {
  return (s || "")
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// Common corporate-suffix words stripped before token comparison, so
// "Walmart Global Tech India" still lines up with "Walmart Global Tech".
const NAME_STOPWORDS = new Set([
  "india", "global", "tech", "technologies", "technology", "inc", "incorporated",
  "ltd", "limited", "pvt", "private", "llc", "llp", "corp", "corporation", "group",
  "labs", "lab", "solutions", "systems", "software", "services", "co", "company",
  "the", "and", "holdings", "international",
]);

function coreTokens(s) {
  return (s || "")
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !NAME_STOPWORDS.has(t));
}

function matchCompany(rawName, companies, exactIndex) {
  const n = normName(rawName);
  if (!n) return null;
  const exact = exactIndex.get(n);
  if (exact) return exact;
  // Whole-word token overlap, not character-substring containment — plain
  // substring matching let "Ariba" false-match inside "BNP Paribas" (their
  // normalized forms happen to share the character run "ariba"). Comparing
  // tokenized words instead means only a real shared word counts.
  const cardTokens = coreTokens(rawName);
  if (cardTokens.length === 0) return null;
  for (const c of companies) {
    const listTokens = coreTokens(c.name);
    if (listTokens.length === 0) continue;
    const shorter = cardTokens.length <= listTokens.length ? cardTokens : listTokens;
    const longerSet = new Set(cardTokens.length <= listTokens.length ? listTokens : cardTokens);
    if (shorter.every((t) => longerSet.has(t))) return c;
  }
  return null;
}

function parseLinkedInCards(html) {
  const out = [];
  const blocks = html.split('data-entity-urn="urn:li:jobPosting:').slice(1);
  for (const block of blocks) {
    const id = block.match(/^(\d+)"/)?.[1];
    const title = block.match(/base-search-card__title">\s*([^<]+?)\s*</)?.[1];
    const company = block.match(/base-search-card__subtitle">\s*<a[^>]*>\s*([^<]+?)\s*<\/a>/)?.[1];
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
    return cards;
  } catch (e) {
    console.log(`LinkedIn ${label}: request failed (${e.message})`);
    return [];
  } finally {
    clearTimeout(t);
  }
}

async function linkedinScan(companies, coveredIds) {
  const exactIndex = new Map();
  for (const c of companies) {
    const n = normName(c.name);
    if (n && !exactIndex.has(n)) exactIndex.set(n, c);
  }
  const seenIds = new Set();
  const results = [];
  let requests = 0;

  // A card from any query is kept the same way: dedupe by posting id, pass the
  // title/location relevance filter, and resolve to a tracked company (a
  // targeted query can legitimately surface a different list company — that's
  // still a valid catch, credited to whoever it really belongs to).
  const collect = (cards, fallbackLocation) => {
    for (const card of cards) {
      if (seenIds.has(card.id)) continue;
      seenIds.add(card.id);
      const location = card.location || fallbackLocation;
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
  };

  for (const kw of LINKEDIN_QUERIES) {
    for (const geo of LINKEDIN_GEOS) {
      let cards = [];
      try {
        cards = await fetchLinkedInPage(kw, geo);
      } catch {
        cards = [];
      }
      requests += 1;
      collect(cards, geo.remoteOnly ? "Remote" : geo.location);
      await sleep(1500);
    }
  }

  // Targeted by-name sweep of today's slice of unautomatable companies.
  const targets = sweepTargets(companies, coveredIds || new Set());
  if (targets.length) {
    console.log(`LinkedIn sweep: ${targets.length} uncovered boards targeted today (${targets.map((c) => c.id).join(", ")})`);
  }
  for (const c of targets) {
    const q = `${c.name.replace(/\(.*?\)/g, " ").replace(/\s+/g, " ").trim()} engineer`;
    let cards = [];
    try {
      cards = await fetchLinkedInPage(q, { location: "India" });
    } catch {
      cards = [];
    }
    requests += 1;
    collect(cards, "India");
    await sleep(1500);
  }

  // The search cards carry no JD, so every LinkedIn opening would otherwise be
  // scored title-only. Fetch the full description per matched opening from the
  // guest job-posting endpoint (sequential + spaced to respect rate limits) so
  // the scorer sees real skills. Best-effort: a miss just leaves it title-only.
  let withDesc = 0;
  for (const r of results) {
    const desc = await fetchLinkedInDesc(r.id);
    if (desc) {
      r.desc = desc;
      withDesc += 1;
    }
    await sleep(800);
  }
  console.log(`LinkedIn: ${requests} requests, ${results.length} matched relevant openings, ${withDesc} with descriptions`);
  return results;
}

// Fetch a single LinkedIn posting's full description HTML from the guest
// job-posting endpoint (same one the public "See more" job pane uses). Returns
// plain-ish HTML (the caller strips it) or "" on any failure.
async function fetchLinkedInDesc(jobId) {
  const url = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`;
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
    if (!res.ok) return "";
    const html = await res.text();
    // The JD sits inside the description markup container; fall back to the
    // whole document if the class name shifts (LinkedIn tweaks markup often).
    const m = html.match(/description__text[^>]*>([\s\S]*?)<\/section>/i) ||
      html.match(/show-more-less-html__markup[^>]*>([\s\S]*?)<\/div>/i);
    return m ? m[1] : html;
  } catch {
    return "";
  } finally {
    clearTimeout(t);
  }
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
        externalPath: j.externalPath,
      });
    }
    if (postings.length < 20) break;
  }
  if (!out.length) return null;

  // The list API carries no job description. Fetch it per-posting from the CxS
  // job endpoint — but ONLY for postings that already pass the relevance filter,
  // so a company adds at most a handful of extra calls (not one per posting).
  // Best-effort: a failed/absent description just leaves the opening title-only.
  const relevant = out.filter((o) => isRelevant(o.title, o.location) && o.externalPath);
  let ri = 0;
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (ri < relevant.length) {
        const o = relevant[ri++];
        const jd = await get(`${base}/wday/cxs/${tenant}/${site}${o.externalPath}`);
        const info = jd?.jobPostingInfo;
        if (info) o.desc = info.jobDescription || info.jobDescriptionSummary || "";
      }
    })
  );
  return out;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const report = loadJSON(join(__dirname, "ats-probe-report.json"), null);
  if (!report) throw new Error("scripts/ats-probe-report.json missing — run atsProbe first");

  mkdirSync(RADAR_DIR, { recursive: true });
  const seen = loadJSON(join(RADAR_DIR, "seen.json"), {});
  const atsCache = loadJSON(join(RADAR_DIR, "atsCache.json"), {});
  const now = new Date().toISOString();

  // Build the résumé-match scorer from your editable skills list. If the file is
  // missing/empty, openings are still emitted — just without a matchScore.
  const skills = loadJSON(join(RADAR_DIR, "skills.json"), { have: [], want: [] });
  const scorer = buildScorer({ have: skills.have || [], want: skills.want || [] });
  console.log(`Scoring against ${skills.have?.length || 0} have + ${skills.want?.length || 0} want skills`);

  // Verified board configs from the deep probe (extracted from each company's
  // own careers pages, so no slug collisions).
  const boardMap = loadJSON(join(__dirname, "board-map.json"), {}).boardMap || {};

  // Route every company to its best fetcher: manual override > deep-probe
  // board map > probe API mapping > sniffed-Workday resolution. Everything
  // else stays uncovered (and the LinkedIn sweep picks up the high-match ones).
  const jobsSources = [];
  for (const r of report.results) {
    const ov = OVERRIDES[r.id];
    const bm = boardMap[r.id];
    if (ov) {
      if (ov.type !== "none") {
        jobsSources.push({ c: { ...r, ats: ov.type }, fetch: () => customAdapters[ov.type](ov) });
      }
    } else if (bm && boardMapAdapters[bm.type]) {
      jobsSources.push({
        c: { ...r, ats: bm.type === "workdayUrl" ? "workday" : bm.type },
        fetch: () => boardMapAdapters[bm.type](bm),
      });
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
      // Score on the FULL job description, then store only the score + matched
      // skills + a short snippet (the full JD is never committed).
      const fullDesc = stripHtml(j.desc);
      const minYoe = parseMinYoe(fullDesc);
      if (minYoe !== undefined && minYoe > MAX_YOE) continue; // too senior for this profile
      const { score, matched } = scorer.score({ title: j.title, desc: fullDesc, location: j.location });
      openings.push({
        key,
        companyId: c.id,
        company: c.name,
        ats: c.ats,
        title: j.title,
        location: j.location,
        url: j.url,
        desc: clip(fullDesc),
        matchScore: score,
        matched,
        ...(minYoe !== undefined ? { minYoe } : {}),
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
    const linkedinJobs = await linkedinScan(report.results, new Set(covered));
    for (const j of linkedinJobs) {
      if (existingUrls.has(j.url)) continue; // already surfaced via that company's own board
      const key = jobKey("linkedin", j.id, j.url);
      if (!seen[key]) seen[key] = now;
      // Score on the full JD fetched by linkedinScan when available; otherwise
      // the scorer's title fallback gives a low-but-real number so the opening
      // still ranks and shows a fit badge.
      const fullDesc = stripHtml(j.desc);
      const minYoe = parseMinYoe(fullDesc);
      if (minYoe !== undefined && minYoe > MAX_YOE) continue; // too senior for this profile
      const { score, matched } = scorer.score({ title: j.title, desc: fullDesc, location: j.location });
      openings.push({
        key,
        companyId: j.companyId,
        company: j.companyName,
        ats: "linkedin",
        title: j.title,
        location: j.location,
        url: j.url,
        desc: clip(fullDesc),
        matchScore: score,
        matched,
        ...(minYoe !== undefined ? { minYoe } : {}),
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
