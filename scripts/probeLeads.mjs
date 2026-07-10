// Endpoint-shape debugger for deep-probe leads — round 2.
//
// Round 1 showed each lead family fails for a different, identifiable reason:
//   darwinbox  — SPA at /ms/candidate/; the API route is inside the JS bundle
//   keka       — same story, bundle served from cdn.keka.com
//   eightfold  — API answers 403 "Not authorized for PCSX"; the correct
//                `domain` value is embedded in the careers page config
//   honeywell  — the "phenom" page actually references Oracle CDN → likely
//                Oracle Recruiting Cloud (we already have that adapter)
//   wandb/grammarly — dead slugs; boards moved, try sibling slugs/providers
//   taleo/socgen    — WORKS (requisitionList JSON); confirm portal handling
//   icims      — AWS WAF human-verification wall; unautomatable from CI
//
// This round greps SPA bundles/page configs for the real API routes and
// auto-tries every discovered candidate in the same run, logging status +
// body snippets. Diagnostics only — writes nothing.
//
// Run: node scripts/probeLeads.mjs   (needs unrestricted egress — runs in CI)

async function req(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.timeout || 12000);
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

const snip = (r, n = 240) => `HTTP ${r.status} :: ${(r.text || "").replace(/\s+/g, " ").slice(0, n)}`;
const JSONH = { "Content-Type": "application/json" };

// Fetch a page, list its script srcs, fetch a few bundles, and grep every
// api-looking route string out of them.
async function grepBundles(pageUrl, baseForScripts, bundleFilter = /./) {
  const shell = await req(pageUrl, { accept: "text/html" });
  console.log("  shell:", snip(shell, 120));
  if (shell.status !== 200) return [];
  const srcs = [...shell.text.matchAll(/src=["']([^"']+\.js[^"']*)["']/g)]
    .map((m) => m[1])
    .filter((s) => bundleFilter.test(s));
  console.log("  bundles found:", srcs.slice(0, 6).join(" | ") || "none");
  const routes = new Set();
  for (const src of srcs.slice(0, 4)) {
    let u;
    try {
      u = new URL(src, baseForScripts || pageUrl).href;
    } catch {
      continue;
    }
    const js = await req(u, { accept: "*/*", timeout: 15000 });
    if (js.status !== 200) {
      console.log(`  bundle ${u.slice(-60)}: HTTP ${js.status}`);
      continue;
    }
    for (const m of js.text.matchAll(/["'`]((?:\.{0,2}\/)?[A-Za-z0-9_-]*(?:api|career|job)[A-Za-z0-9/_-]*)["'`]/g)) {
      const r = m[1];
      if (r.length > 5 && r.length < 90 && /[/]/.test(r) && !/\.(png|svg|css|jpg|woff|js)$/.test(r)) routes.add(r);
    }
  }
  const list = [...routes].slice(0, 50);
  console.log("  api-ish routes in bundles:", JSON.stringify(list));
  return list;
}

async function tryRoutes(host, basePath, routes) {
  const jobish = routes.filter((r) => /job|opening|position|vacan/i.test(r)).slice(0, 10);
  for (const r of jobish) {
    const path = r.startsWith("/") ? r : `${basePath}/${r.replace(/^\.\//, "")}`;
    const url = `https://${host}${path}`;
    console.log(`  GET  ${path}`.padEnd(64), ":", snip(await req(url)));
    console.log(`  POST ${path}`.padEnd(64), ":", snip(await req(url, { method: "POST", body: "{}", headers: JSONH })));
  }
}

async function main() {
  // ── darwinbox: bundle-grep one representative host, then confirm on a second
  for (const host of ["clevertap.darwinbox.in", "upgrad.darwinbox.in"]) {
    console.log(`\n━━ darwinbox ${host}`);
    const routes = await grepBundles(`https://${host}/ms/candidate/careers`, `https://${host}/ms/candidate/`);
    await tryRoutes(host, "/ms/candidate", routes);
  }

  // ── keka: same treatment
  for (const host of ["unicommerce.keka.com", "jupiter.keka.com"]) {
    console.log(`\n━━ keka ${host}`);
    const routes = await grepBundles(`https://${host}/careers/`, undefined, /keka|careers/);
    await tryRoutes(host, "/careers", routes);
  }

  // ── eightfold: pull the embedded config off the careers shell, then retry
  //    the v2 API with every domain-looking value found.
  for (const host of ["jobs.twilio.com", "jobs.amdocs.com", "app.eightfold.ai"]) {
    console.log(`\n━━ eightfold ${host}`);
    const shell = await req(`https://${host}/careers`, { accept: "text/html" });
    console.log("  shell:", snip(shell, 100));
    const cfgVals = new Set();
    for (const m of shell.text.matchAll(/["'](?:domain|pcsDomain|companyDomain|microSiteDomain)["']\s*[:=]\s*["']([a-z0-9.-]+)["']/gi)) cfgVals.add(m[1]);
    for (const m of shell.text.matchAll(/domain=([a-z0-9.-]+\.[a-z]{2,})/gi)) cfgVals.add(m[1]);
    console.log("  domain-ish config values:", [...cfgVals].join(", ") || "none");
    for (const dom of [...cfgVals].slice(0, 4)) {
      console.log(`  v2?domain=${dom}`.padEnd(44), ":", snip(await req(`https://${host}/api/apply/v2/jobs?domain=${dom}&num=1&start=0`)));
    }
    // Some tenants only answer the POST search used by the SPA itself.
    console.log(
      "  POST /api/apply/v2/jobs".padEnd(44),
      ":",
      snip(await req(`https://${host}/api/apply/v2/jobs`, { method: "POST", headers: JSONH, body: JSON.stringify({ num: 1, start: 0 }) }))
    );
    console.log("  GET /api/apply/v2/jobs (no domain)".padEnd(44), ":", snip(await req(`https://${host}/api/apply/v2/jobs?num=1&start=0`)));
  }

  // ── honeywell: is it Oracle Recruiting Cloud? grep the page for ORC hosts.
  console.log("\n━━ honeywell careers.honeywell.com");
  {
    const page = await req("https://careers.honeywell.com/us/en", { accept: "text/html", timeout: 15000 });
    console.log("  page:", snip(page, 100));
    const orc = new Set([...page.text.matchAll(/([a-z0-9-]+\.fa\.oraclecloud\.com)/gi)].map((m) => m[1].toLowerCase()));
    const sites = new Set([...page.text.matchAll(/(CX_\d+)/g)].map((m) => m[1]));
    const phenomSig = /phenompeople|refineSearch|ph-widgets/i.test(page.text);
    console.log("  oraclecloud hosts:", [...orc].join(", ") || "none", "| CX sites:", [...sites].join(", ") || "none", "| phenom signature:", phenomSig);
    for (const h of [...orc].slice(0, 2)) {
      const site = [...sites][0] || "CX_1";
      console.log(
        `  ORC finder ${h} ${site}`.padEnd(44),
        ":",
        snip(await req(`https://${h}/hcmRestApi/resources/latest/recruitingCEJobRequisitions?onlyData=true&expand=requisitionList&finder=findReqs%3BsiteNumber%3D${site}%2Ckeyword%3Dengineer&limit=5`))
      );
    }
    // Phenom sites sometimes mount widgets under a locale prefix.
    console.log("  POST /us/en/widgets".padEnd(44), ":", snip(await req("https://careers.honeywell.com/us/en/widgets", { method: "POST", headers: JSONH, body: JSON.stringify({ lang: "en_us", pageName: "search-results", ddoKey: "refineSearch", from: 0, jobs: true, size: 5, keywords: "", global: true, selected_fields: {}, locationData: {} }) })));
  }

  // ── moved boards: sibling slugs across providers
  console.log("\n━━ slug variants");
  for (const slug of ["wandb", "weights-and-biases", "weightsandbiases"]) {
    console.log(`  ashby ${slug}`.padEnd(34), ":", snip(await req(`https://api.ashbyhq.com/posting-api/job-board/${slug}`), 120));
  }
  for (const slug of ["wandb", "weightsandbiases"]) {
    console.log(`  greenhouse ${slug}`.padEnd(34), ":", snip(await req(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`), 120));
  }
  for (const slug of ["grammarly", "grammarlyinc", "coda", "codainc"]) {
    console.log(`  greenhouse ${slug}`.padEnd(34), ":", snip(await req(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`), 120));
    console.log(`  ashby ${slug}`.padEnd(34), ":", snip(await req(`https://api.ashbyhq.com/posting-api/job-board/${slug}`), 120));
  }

  // ── taleo socgen: confirm portal handling for the adapter
  console.log("\n━━ taleo socgen.taleo.net");
  const taleoBody = JSON.stringify({
    multilineEnabled: false,
    sortingSelection: { sortBySelectionParam: "3", ascendingSortingOrder: "false" },
    fieldData: { fields: {}, valid: true },
    filterSelectionParam: { searchFilterSelections: [] },
    advancedSearchFiltersSelectionParam: { searchFilterSelections: [] },
    pageNo: 1,
  });
  for (const qs of ["?lang=en&portal=101430233", "?lang=en", "?lang=en&portal=1"]) {
    const r = await req(`https://socgen.taleo.net/careersection/rest/jobboard/searchjobs${qs}`, { method: "POST", headers: { ...JSONH, tz: "GMT+05:30" }, body: taleoBody });
    let count = "?";
    try {
      const j = JSON.parse(r.text);
      count = Array.isArray(j.requisitionList) ? j.requisitionList.length : `null (unavailable=${j.careerSectionUnAvailable})`;
    } catch {}
    console.log(`  searchjobs ${qs}`.padEnd(44), `: HTTP ${r.status}, requisitions: ${count}`);
  }

  console.log("\nDone.");
}

main();
