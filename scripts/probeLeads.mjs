// Endpoint-shape debugger for deep-probe leads.
//
// The deep probe found concrete board hosts for ~30 companies but the first
// endpoint guess failed verification (scripts/board-map.json "leads"). This
// script tries a battery of endpoint variants per ATS flavour and logs the
// status + a body snippet for each, so the correct API shape can be read
// straight from the CI log and wired into deepProbe/jobRadar. Diagnostics
// only — writes nothing.
//
// Run: node scripts/probeLeads.mjs   (needs unrestricted egress — runs in CI)

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function req(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.timeout || 10000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      method: opts.method || "GET",
      body: opts.body,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: opts.accept || "application/json, text/html;q=0.9, */*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        ...(opts.headers || {}),
      },
    });
    const text = await res.text();
    return { status: res.status, url: res.url, text };
  } catch (e) {
    return { status: 0, url, text: `ERR ${e.message}` };
  } finally {
    clearTimeout(t);
  }
}

function snip(r, n = 260) {
  const t = (r.text || "").replace(/\s+/g, " ").slice(0, n);
  return `HTTP ${r.status} :: ${t}`;
}

const JSONH = { "Content-Type": "application/json" };
const FORMH = { "Content-Type": "application/x-www-form-urlencoded", "X-Requested-With": "XMLHttpRequest" };

const batteries = {
  async darwinbox(host) {
    console.log(`\n── darwinbox ${host}`);
    console.log("  joblist POST json   :", snip(await req(`https://${host}/ms/candidate/careers/api/joblist`, { method: "POST", body: "{}", headers: JSONH })));
    console.log("  joblist POST form   :", snip(await req(`https://${host}/ms/candidate/careers/api/joblist`, { method: "POST", body: "page=1", headers: FORMH })));
    console.log("  careers page GET    :", snip(await req(`https://${host}/ms/candidate/careers`, { accept: "text/html" })));
    console.log("  loadjobs POST form  :", snip(await req(`https://${host}/ms/candidate/careers/api/loadjobs`, { method: "POST", body: "", headers: FORMH })));
    console.log("  jobs-search POST    :", snip(await req(`https://${host}/ms/candidate/api/careers/jobs-search`, { method: "POST", body: "{}", headers: JSONH })));
  },
  async icims(host) {
    console.log(`\n── icims ${host}`);
    console.log("  /jobs/search?ss=1              :", snip(await req(`https://${host}/jobs/search?ss=1`, { accept: "text/html", timeout: 14000 })));
    console.log("  /jobs/search?ss=1&in_iframe=1  :", snip(await req(`https://${host}/jobs/search?ss=1&in_iframe=1`, { accept: "text/html", timeout: 14000 })));
    console.log("  /jobs/intro?in_iframe=1        :", snip(await req(`https://${host}/jobs/intro?in_iframe=1`, { accept: "text/html", timeout: 14000 })));
  },
  async eightfold(host, domain) {
    console.log(`\n── eightfold ${host} (domain guess: ${domain})`);
    for (const dom of [...new Set([domain, host.replace(/^(www|jobs|careers|in|sg)\./, ""), host])]) {
      console.log(`  ?domain=${dom}`.padEnd(36), ":", snip(await req(`https://${host}/api/apply/v2/jobs?domain=${dom}&num=1&start=0`)));
    }
    console.log("  careersite home                :", snip(await req(`https://${host}/careers`, { accept: "text/html" }), 180));
  },
  async phenom(host) {
    console.log(`\n── phenom ${host}`);
    const body = {
      lang: "en_us", deviceType: "desktop", country: "us", pageName: "search-results",
      ddoKey: "refineSearch", sortBy: "", subsearch: "", from: 0, jobs: true, counts: true,
      all_fields: ["category", "country", "state", "city"], size: 5, clearAll: false,
      jdsource: "facets", isSliderEnable: false, pageId: "page10", siteType: "external",
      keywords: "", global: true, selected_fields: {}, locationData: {},
    };
    console.log("  /widgets POST        :", snip(await req(`https://${host}/widgets`, { method: "POST", body: JSON.stringify(body), headers: JSONH })));
    console.log("  /api/apply/v2/jobs   :", snip(await req(`https://${host}/api/apply/v2/jobs?num=1`)));
    console.log("  home                 :", snip(await req(`https://${host}/`, { accept: "text/html" }), 180));
  },
  async keka(host) {
    console.log(`\n── keka ${host}`);
    console.log("  /careers/api/embedjobs/active :", snip(await req(`https://${host}/careers/api/embedjobs/active`)));
    console.log("  /careers/api/embedjobs        :", snip(await req(`https://${host}/careers/api/embedjobs`)));
    console.log("  /careers/api/jobs             :", snip(await req(`https://${host}/careers/api/jobs`)));
    console.log("  /careers/ (html)              :", snip(await req(`https://${host}/careers/`, { accept: "text/html" })));
  },
  async lever(slug) {
    console.log(`\n── lever ${slug}`);
    console.log("  postings:", snip(await req(`https://api.lever.co/v0/postings/${slug}?mode=json`)));
  },
  async greenhouse(slug) {
    console.log(`\n── greenhouse ${slug}`);
    console.log("  boards-api:", snip(await req(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`)));
  },
  async taleo(host) {
    console.log(`\n── taleo ${host}`);
    console.log("  careersection home:", snip(await req(`https://${host}/careersection/10000/jobsearch.ftl?lang=en`, { accept: "text/html", timeout: 14000 })));
    console.log(
      "  rest searchjobs   :",
      snip(
        await req(`https://${host}/careersection/rest/jobboard/searchjobs?lang=en&portal=101430233`, {
          method: "POST",
          body: JSON.stringify({ multilineEnabled: false, sortingSelection: { sortBySelectionParam: "3", ascendingSortingOrder: "false" }, fieldData: { fields: {}, valid: true }, filterSelectionParam: { searchFilterSelections: [] }, advancedSearchFiltersSelectionParam: { searchFilterSelections: [] }, pageNo: 1 }),
          headers: { ...JSONH, "tz": "GMT+05:30" },
        })
      )
    );
  },
  async zohorecruit(host) {
    console.log(`\n── zohorecruit ${host}`);
    console.log("  /careers (html)          :", snip(await req(`https://${host}/jobs/Careers`, { accept: "text/html" })));
    console.log("  /recruit/v2 public jobs  :", snip(await req(`https://${host}/recruit/PortalDetail.na`)));
  },
};

async function main() {
  const map = JSON.parse(readFileSync(join(__dirname, "board-map.json"), "utf8"));
  const leads = map.leads || {};
  const seen = new Set();
  for (const [id, cands] of Object.entries(leads)) {
    for (const c of cands) {
      const key = `${c.type}:${c.host || c.slug || c.url}`;
      if (seen.has(key)) continue;
      seen.add(key);
      // Skip obvious non-board darwinbox marketing hosts.
      if (c.type === "darwinbox" && /^(explore|blog|academy|help|newsroom|dbx)\./.test(c.host || "")) continue;
      const fn = batteries[c.type];
      if (!fn) continue;
      try {
        if (c.type === "eightfold") await fn(c.host, c.domain);
        else await fn(c.host || c.slug);
      } catch (e) {
        console.log(`  battery failed for ${key}: ${e.message}`);
      }
    }
  }
  console.log("\nDone.");
}

main();
