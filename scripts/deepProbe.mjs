// Deep board-discovery probe for companies the radar can't read yet.
//
// The first probe (atsProbe.mjs) guessed provider slugs and sniffed one page
// of careers HTML; ~290 companies stayed dark because their board lives behind
// a link, a redirect, or an ATS with no slug-guessable API. This probe goes
// deeper for exactly those companies:
//
//   1. fetch the careers page, note where it redirects, and follow up to a few
//      same-company links that look job-related (/jobs, /openings, …)
//   2. extract CONCRETE board configs from all gathered HTML — greenhouse
//      tokens, lever/ashby/workable/recruitee slugs, workday/darwinbox/icims/
//      taleo/freshteam/keka/bamboohr/jobvite/zoho hosts, and treat a phenom/
//      eightfold-flavoured careers host as that provider's API host
//   3. VERIFY every candidate against its live jobs endpoint (a config pulled
//      from the company's own page can't be a slug collision, so verification
//      is shape-based: the API answers with a well-formed jobs payload)
//   4. write scripts/board-map.json: verified fetch configs keyed by company
//      id, plus a "leads" section of near-misses (candidate found, endpoint
//      refused) so the next iteration knows what to fix
//
// jobRadar.mjs routes through board-map.json before falling back to the old
// probe report, so every verified entry here becomes an automated board.
//
// Run: node scripts/deepProbe.mjs   (needs unrestricted egress — runs in CI)

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Which companies need deep probing ────────────────────────────────────────
// Mirror jobRadar's routing: a company is already handled if it has an
// OVERRIDE, a working provider API, or a sniffed Workday board. Everything
// else is a target. The "none" overrides are boards that block server-side
// fetches entirely — probing them again just burns time.
const HANDLED_OVERRIDES = new Set([
  "microsoft", "amazon", "google", "uber", "netflix", "jp-morgan-chase",
  "atlassian", "nvidia", "adobe", "salesforce", "target-india", "caterpillar",
  "servicenow", "intuit", "razorpay",
]);
const BLOCKED_OVERRIDES = new Set([
  "meta", "linkedin", "paypal", "goldman-sachs-eng", "walmart-global-tech",
  "apple", "booking-com", "bank-of-america",
]);
const API_ATS = new Set(["greenhouse", "lever", "ashby", "workable", "recruitee", "smartrecruiters"]);

// ── HTTP helper ───────────────────────────────────────────────────────────────
async function req(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.timeout || 10000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      method: opts.method || "GET",
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: opts.accept || "text/html,application/xhtml+xml,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
      },
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, url: res.url, text };
  } catch (e) {
    return { ok: false, status: 0, url, text: "", error: e.message };
  } finally {
    clearTimeout(t);
  }
}

function asJSON(r) {
  if (!r.ok) return null;
  try {
    return JSON.parse(r.text);
  } catch {
    return null;
  }
}

// Registrable domain, naive but good enough: keep 3 labels for co.in-style
// public suffixes, else 2.
function regDomain(host) {
  const parts = host.toLowerCase().split(".");
  if (parts.length <= 2) return host.toLowerCase();
  const sld = parts[parts.length - 2];
  const tld = parts[parts.length - 1];
  if (["co", "com", "org", "net", "gov", "ac"].includes(sld) && tld.length === 2) {
    return parts.slice(-3).join(".");
  }
  return parts.slice(-2).join(".");
}

// ── Board-config extraction from HTML/URLs ────────────────────────────────────
// Each matcher returns {type, ...cfg} candidates found in a blob of HTML (or
// in a URL — redirects often land directly on the board).
function extractCandidates(html, pageUrl) {
  const found = [];
  const push = (c) => found.push(c);
  const scan = html + " " + pageUrl;

  for (const m of scan.matchAll(/boards(?:-api)?\.greenhouse\.io\/(?:v1\/boards\/|embed\/job_board(?:\.js)?\?(?:[^"'\s]*[?&])?for=)?([a-z0-9]+)/gi)) {
    const tok = m[1];
    if (tok && !["v1", "embed", "js"].includes(tok)) push({ type: "greenhouse", slug: tok.toLowerCase() });
  }
  for (const m of scan.matchAll(/job-boards\.greenhouse\.io\/([a-z0-9]+)/gi)) push({ type: "greenhouse", slug: m[1].toLowerCase() });
  for (const m of scan.matchAll(/jobs\.lever\.co\/([A-Za-z0-9-]+)/g)) push({ type: "lever", slug: m[1] });
  for (const m of scan.matchAll(/jobs\.ashbyhq\.com\/([A-Za-z0-9-_.%]+)/g)) push({ type: "ashby", slug: decodeURIComponent(m[1]) });
  for (const m of scan.matchAll(/apply\.workable\.com\/(?:api\/v1\/widget\/accounts\/)?([a-z0-9-]+)/gi)) {
    if (!["api", "assets"].includes(m[1])) push({ type: "workable", slug: m[1].toLowerCase() });
  }
  for (const m of scan.matchAll(/([a-z0-9-]+)\.recruitee\.com/gi)) {
    if (!["www", "api", "assets", "d10zminp1cyta8"].includes(m[1])) push({ type: "recruitee", slug: m[1].toLowerCase() });
  }
  for (const m of scan.matchAll(/(?:careers|jobs)\.smartrecruiters\.com\/([A-Za-z0-9]+)/g)) push({ type: "smartrecruiters", slug: m[1] });
  for (const m of scan.matchAll(/https?:\/\/([a-z0-9-]+)\.(wd\d+)\.myworkdayjobs\.com\/(?:[a-z]{2}-[A-Z]{2}\/)?([A-Za-z0-9_-]+)/g)) {
    push({ type: "workdayUrl", url: `https://${m[1]}.${m[2]}.myworkdayjobs.com/${m[3]}` });
  }
  for (const m of scan.matchAll(/https?:\/\/([a-z0-9-]+\.darwinbox\.(?:in|com))/gi)) push({ type: "darwinbox", host: m[1].toLowerCase() });
  for (const m of scan.matchAll(/https?:\/\/(careers-[a-z0-9-]+\.icims\.com)/gi)) push({ type: "icims", host: m[1].toLowerCase() });
  for (const m of scan.matchAll(/https?:\/\/([a-z0-9-]+\.freshteam\.com)/gi)) push({ type: "freshteam", host: m[1].toLowerCase() });
  for (const m of scan.matchAll(/https?:\/\/([a-z0-9-]+\.(?:keka\.com|kekahire\.com))/gi)) push({ type: "keka", host: m[1].toLowerCase() });
  for (const m of scan.matchAll(/https?:\/\/([a-z0-9-]+\.bamboohr\.com)/gi)) push({ type: "bamboohr", host: m[1].toLowerCase() });
  for (const m of scan.matchAll(/jobs\.jobvite\.com\/([a-z0-9-]+)/gi)) {
    if (!["api", "static"].includes(m[1])) push({ type: "jobvite", slug: m[1].toLowerCase() });
  }
  for (const m of scan.matchAll(/https?:\/\/([a-z0-9-]+\.zohorecruit\.com)/gi)) push({ type: "zohorecruit", host: m[1].toLowerCase() });
  for (const m of scan.matchAll(/https?:\/\/([a-z0-9-]+\.taleo\.net)/gi)) push({ type: "taleo", host: m[1].toLowerCase() });

  // Host-flavoured providers: the careers host itself IS the API host.
  try {
    const host = new URL(pageUrl).host;
    if (/phenompeople|phenom-?platform|ph-?widgets|refineSearch/i.test(html)) push({ type: "phenom", host });
    if (/eightfold\.ai|pcsx?\/api\/apply/i.test(html)) push({ type: "eightfold", host, domain: regDomain(host).replace(/^careers\./, "") });
  } catch {}

  // Generic fallback signal: schema.org JobPosting JSON-LD on the page.
  if (/"@type"\s*:\s*"?JobPosting/i.test(html)) push({ type: "jsonld", url: pageUrl });

  return found;
}

// ── Candidate verification: call the live jobs endpoint, require shape ───────
const verifiers = {
  async greenhouse(c) {
    const d = asJSON(await req(`https://boards-api.greenhouse.io/v1/boards/${c.slug}/jobs`, { accept: "application/json" }));
    return Array.isArray(d?.jobs) ? { jobs: d.jobs.length } : null;
  },
  async lever(c) {
    const d = asJSON(await req(`https://api.lever.co/v0/postings/${c.slug}?mode=json`, { accept: "application/json" }));
    return Array.isArray(d) ? { jobs: d.length } : null;
  },
  async ashby(c) {
    const d = asJSON(await req(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(c.slug)}`, { accept: "application/json" }));
    return Array.isArray(d?.jobs) ? { jobs: d.jobs.length } : null;
  },
  async workable(c) {
    const d = asJSON(await req(`https://apply.workable.com/api/v1/widget/accounts/${c.slug}`, { accept: "application/json" }));
    return Array.isArray(d?.jobs) ? { jobs: d.jobs.length } : null;
  },
  async recruitee(c) {
    const d = asJSON(await req(`https://${c.slug}.recruitee.com/api/offers/`, { accept: "application/json" }));
    return Array.isArray(d?.offers) ? { jobs: d.offers.length } : null;
  },
  async smartrecruiters(c) {
    const d = asJSON(await req(`https://api.smartrecruiters.com/v1/companies/${c.slug}/postings?limit=10`, { accept: "application/json" }));
    return Array.isArray(d?.content) ? { jobs: d.totalFound ?? d.content.length } : null;
  },
  async workdayUrl(c) {
    const m = c.url.match(/https?:\/\/([a-z0-9-]+)\.(wd\d+)\.myworkdayjobs\.com\/([A-Za-z0-9_-]+)/);
    if (!m) return null;
    const d = asJSON(
      await req(`https://${m[1]}.${m[2]}.myworkdayjobs.com/wday/cxs/${m[1]}/${m[3]}/jobs`, {
        method: "POST",
        accept: "application/json",
        body: { appliedFacets: {}, limit: 20, offset: 0, searchText: "" },
      })
    );
    return Array.isArray(d?.jobPostings) ? { jobs: d.total ?? d.jobPostings.length } : null;
  },
  async eightfold(c) {
    const d = asJSON(
      await req(`https://${c.host}/api/apply/v2/jobs?domain=${c.domain}&num=10&start=0`, { accept: "application/json" })
    );
    return Array.isArray(d?.positions) ? { jobs: d.count ?? d.positions.length } : null;
  },
  async phenom(c) {
    const d = asJSON(
      await req(`https://${c.host}/widgets`, {
        method: "POST",
        accept: "application/json",
        body: {
          lang: "en_us", deviceType: "desktop", country: "us", pageName: "search-results",
          ddoKey: "refineSearch", sortBy: "", subsearch: "", from: 0, jobs: true, counts: true,
          all_fields: ["category", "country", "state", "city"], size: 10, clearAll: false,
          jdsource: "facets", isSliderEnable: false, pageId: "page10", siteType: "external",
          keywords: "", global: true, selected_fields: {}, locationData: {},
        },
      })
    );
    const jobs = d?.refineSearch?.data?.jobs;
    return Array.isArray(jobs) ? { jobs: d.refineSearch?.totalHits ?? jobs.length } : null;
  },
  async darwinbox(c) {
    // Darwinbox career-site SPA fetches its listings from this endpoint.
    const d = asJSON(await req(`https://${c.host}/ms/candidate/careers/api/joblist`, { method: "POST", accept: "application/json", body: {} }));
    const list = d?.message?.jobs || d?.jobs || d?.data;
    if (Array.isArray(list)) return { jobs: list.length };
    // Some tenants expose a GET variant.
    const g = asJSON(await req(`https://${c.host}/ms/candidate/api/careers/joblist`, { accept: "application/json" }));
    const gl = g?.message?.jobs || g?.jobs || g?.data;
    return Array.isArray(gl) ? { jobs: gl.length, get: true } : null;
  },
  async icims(c) {
    // The public search page is server-rendered; job links look like /jobs/<id>/<slug>/job
    const r = await req(`https://${c.host}/jobs/search?ss=1`, { timeout: 12000 });
    if (!r.ok) return null;
    const ids = new Set([...r.text.matchAll(/\/jobs\/(\d+)\//g)].map((m) => m[1]));
    return ids.size > 0 ? { jobs: ids.size } : null;
  },
  async freshteam(c) {
    const d = asJSON(await req(`https://${c.host}/hire/widgets/jobs.json`, { accept: "application/json" }));
    const list = d?.jobs || d;
    return Array.isArray(list) ? { jobs: list.length } : null;
  },
  async keka(c) {
    const d = asJSON(await req(`https://${c.host}/careers/api/embedjobs/active`, { accept: "application/json" }));
    const list = d?.data || d;
    return Array.isArray(list) ? { jobs: list.length } : null;
  },
  async bamboohr(c) {
    const d = asJSON(await req(`https://${c.host}/careers/list`, { accept: "application/json" }));
    return Array.isArray(d?.result) ? { jobs: d.result.length } : null;
  },
  async jobvite(c) {
    const r = await req(`https://jobs.jobvite.com/${c.slug}/search?q=`, { timeout: 12000 });
    if (!r.ok) return null;
    const ids = new Set([...r.text.matchAll(/\/job\/([A-Za-z0-9]+)/g)].map((m) => m[1]));
    return ids.size > 0 ? { jobs: ids.size } : null;
  },
  async zohorecruit(c) {
    const r = await req(`https://${c.host}/jobs/Careers`, { timeout: 12000 });
    if (!r.ok) return null;
    return /Careers|job/i.test(r.text) ? { jobs: null, htmlOnly: true } : null;
  },
  async taleo(c) {
    // Taleo needs a careersection id; record the host as a lead, don't verify.
    return null;
  },
  async jsonld(c) {
    const r = await req(c.url, { timeout: 12000 });
    if (!r.ok) return null;
    const count = [...r.text.matchAll(/"@type"\s*:\s*"?JobPosting/gi)].length;
    return count > 0 ? { jobs: count } : null;
  },
};

// Provider priority when several candidates verify — richer APIs first.
const TYPE_PRIORITY = [
  "greenhouse", "lever", "ashby", "smartrecruiters", "workable", "recruitee",
  "workdayUrl", "eightfold", "phenom", "darwinbox", "freshteam", "keka",
  "bamboohr", "icims", "jobvite", "zohorecruit", "jsonld", "taleo",
];

function candKey(c) {
  return JSON.stringify(c);
}

// ── Per-company deep probe ────────────────────────────────────────────────────
const LINK_RX = /href=["']([^"'#?]+)[^"']*["']/gi;
const JOBISH_RX = /job|career|opening|position|vacan|join-?us|work-?with/i;

async function probeCompany(c) {
  const pages = [];
  const first = await req(c.careers, { timeout: 12000 });
  if (first.text) pages.push(first);

  // Follow up to 3 same-company job-ish links (many careers pages are just a
  // landing page linking to the actual board).
  if (first.ok) {
    const base = new URL(first.url);
    const targets = new Set();
    for (const m of first.text.matchAll(LINK_RX)) {
      let href = m[1];
      try {
        const u = new URL(href, base);
        if (!/^https?:$/.test(u.protocol)) continue;
        const sameCompany = regDomain(u.host) === regDomain(base.host);
        const jobish = JOBISH_RX.test(u.pathname) || JOBISH_RX.test(u.host);
        // Off-company links are exactly how boards are found (jobs.lever.co/x),
        // but those are caught by extraction on THIS page — only follow
        // same-company links, to bound the crawl.
        if (sameCompany && jobish && u.href !== first.url) targets.add(u.href.split("#")[0]);
      } catch {}
      if (targets.size >= 3) break;
    }
    for (const t of targets) {
      const r = await req(t, { timeout: 12000 });
      if (r.text) pages.push(r);
    }
  }

  // Extract candidates from every fetched page (HTML + final URL after
  // redirects — landing directly on a board is common).
  const seen = new Set();
  const candidates = [];
  for (const p of pages) {
    for (const cand of extractCandidates(p.text, p.url)) {
      const k = candKey(cand);
      if (!seen.has(k)) {
        seen.add(k);
        candidates.push(cand);
      }
    }
  }
  candidates.sort((a, b) => TYPE_PRIORITY.indexOf(a.type) - TYPE_PRIORITY.indexOf(b.type));

  // Verify in priority order; first verified candidate wins.
  const leads = [];
  for (const cand of candidates) {
    const verify = verifiers[cand.type];
    if (!verify) continue;
    try {
      const v = await verify(cand);
      if (v) return { resolved: { ...cand, ...v }, leads, pagesFetched: pages.length };
      leads.push(cand);
    } catch {
      leads.push(cand);
    }
  }
  return { resolved: null, leads, pagesFetched: pages.length, fetchError: first.ok ? undefined : `HTTP ${first.status} ${first.error || ""}`.trim() };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const report = JSON.parse(readFileSync(join(__dirname, "ats-probe-report.json"), "utf8"));
  const targets = report.results.filter(
    (c) =>
      !HANDLED_OVERRIDES.has(c.id) &&
      !BLOCKED_OVERRIDES.has(c.id) &&
      !(c.api && API_ATS.has(c.ats)) &&
      c.ats !== "workday"
  );
  console.log(`Deep probe: ${targets.length} companies to resolve`);

  const results = {};
  let done = 0;
  const CONCURRENCY = 8;
  let i = 0;
  async function worker() {
    while (i < targets.length) {
      const c = targets[i++];
      const r = await probeCompany(c);
      results[c.id] = { name: c.name, match: c.match, ...r };
      done += 1;
      if (done % 20 === 0) console.log(`…${done}/${targets.length}`);
      if (r.resolved) console.log(`✔ ${c.name}: ${r.resolved.type} (${r.resolved.jobs ?? "?"} jobs)`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const resolved = Object.entries(results).filter(([, r]) => r.resolved);
  const withLeads = Object.entries(results).filter(([, r]) => !r.resolved && r.leads.length);
  const dark = Object.entries(results).filter(([, r]) => !r.resolved && !r.leads.length);

  const byType = {};
  resolved.forEach(([, r]) => { byType[r.resolved.type] = (byType[r.resolved.type] || 0) + 1; });

  const summary = {
    probedAt: new Date().toISOString(),
    targets: targets.length,
    resolved: resolved.length,
    unresolvedWithLeads: withLeads.length,
    dark: dark.length,
    byType,
  };
  console.log(JSON.stringify(summary, null, 2));
  console.log("Unresolved-with-leads:", withLeads.slice(0, 30).map(([id, r]) => `${id}(${r.leads.map((l) => l.type).join("/")})`).join(", "));

  // board-map.json: only verified configs — this is what jobRadar routes on.
  const boardMap = Object.fromEntries(
    resolved.map(([id, r]) => [id, r.resolved])
  );
  writeFileSync(join(__dirname, "board-map.json"), JSON.stringify({ summary, boardMap, leads: Object.fromEntries(withLeads.map(([id, r]) => [id, r.leads])) }, null, 1));
  console.log(`Wrote scripts/board-map.json with ${resolved.length} verified boards`);
}

main();
