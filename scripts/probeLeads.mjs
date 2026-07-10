// Endpoint-shape debugger for deep-probe leads — round 3.
//
// Round 2 results: taleo/socgen solved (wired into the radar). Still open:
//   darwinbox — api route not in the first 4 bundles; the hashed runtime and
//               main chunks were never fetched. Also loads Cloudflare
//               Turnstile, so the API may be challenge-gated anyway.
//   keka      — shell has no <script src=…>; assets come from cdn.keka.com
//               some other way. Dump the shell, grep every .js URL + inline
//               "api" strings, and try a few likely endpoint names.
//   eightfold — v2 API is CSRF-gated (400 "Please reload the page"). Try the
//               cookie + csrf dance the SPA itself performs.
//
// Diagnostics only — writes nothing.
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
    let cookies = [];
    try {
      cookies = res.headers.getSetCookie();
    } catch {}
    return { status: res.status, url: res.url, text, cookies };
  } catch (e) {
    return { status: 0, url, text: `ERR ${e.message}`, cookies: [] };
  } finally {
    clearTimeout(t);
  }
}

const snip = (r, n = 240) => `HTTP ${r.status} :: ${(r.text || "").replace(/\s+/g, " ").slice(0, n)}`;
const JSONH = { "Content-Type": "application/json" };

async function main() {
  // ── darwinbox: fetch runtime + every same-host bundle, grep for api routes
  for (const host of ["clevertap.darwinbox.in"]) {
    console.log(`\n━━ darwinbox ${host}`);
    const shell = await req(`https://${host}/ms/candidate/careers`, { accept: "text/html" });
    const srcs = [...shell.text.matchAll(/src=["']([^"']+\.js[^"']*)["']/g)].map((m) => m[1]);
    console.log("  all script srcs:", JSON.stringify(srcs));
    const routes = new Set();
    const chunks = new Set();
    for (const src of srcs.filter((s) => !/^https?:\/\/(challenges|www\.google)/.test(s))) {
      let u;
      try {
        u = new URL(src, `https://${host}/ms/candidate/`).href;
      } catch {
        continue;
      }
      const js = await req(u, { accept: "*/*", timeout: 15000 });
      console.log(`  bundle ${u.split("/").pop().slice(0, 48)}: HTTP ${js.status}, ${js.text.length}B`);
      if (js.status !== 200) continue;
      for (const m of js.text.matchAll(/["'`]((?:\.{0,2}\/)?[A-Za-z0-9_-]*(?:api|job|career)[A-Za-z0-9/_.-]*)["'`]/gi)) {
        if (m[1].length > 5 && m[1].length < 90 && m[1].includes("/")) routes.add(m[1]);
      }
      // Angular runtime: chunk-name map like {403:"403.abc123"} — collect main/lazy chunk file names.
      for (const m of js.text.matchAll(/["']([a-z0-9_-]+\.[a-f0-9]{16,}\.js)["']/gi)) chunks.add(m[1]);
      for (const m of js.text.matchAll(/(main\.[a-f0-9]+\.js)/gi)) chunks.add(m[1]);
    }
    console.log("  chunk files referenced:", [...chunks].slice(0, 10).join(", ") || "none");
    for (const ch of [...chunks].slice(0, 4)) {
      const js = await req(`https://${host}/ms/candidate/${ch}`, { accept: "*/*", timeout: 15000 });
      console.log(`  chunk ${ch.slice(0, 44)}: HTTP ${js.status}, ${js.text.length}B`);
      if (js.status !== 200) continue;
      for (const m of js.text.matchAll(/["'`]((?:\.{0,2}\/)?[A-Za-z0-9_-]*(?:api|joblist|jobs|career)[A-Za-z0-9/_.-]*)["'`]/gi)) {
        if (m[1].length > 5 && m[1].length < 90 && m[1].includes("/")) routes.add(m[1]);
      }
    }
    console.log("  api-ish routes:", JSON.stringify([...routes].slice(0, 60)));
    // Try the most jobby-looking discovered routes + a few known-name guesses.
    const guesses = [...routes].filter((r) => /job|opening/i.test(r)).slice(0, 8);
    guesses.push("careers/api/getalljobs", "careers/api/joblisting", "api/careers/joblist");
    for (const g of guesses) {
      const path = g.startsWith("/") ? g : `/ms/candidate/${g.replace(/^\.\//, "")}`;
      const url = `https://${host}${path}`;
      console.log(`  GET  ${path}`.padEnd(66), ":", snip(await req(url), 140));
      console.log(`  POST ${path}`.padEnd(66), ":", snip(await req(url, { method: "POST", body: "{}", headers: JSONH }), 140));
    }
  }

  // ── keka: dump the shell, find every .js/api reference anywhere in it
  for (const host of ["unicommerce.keka.com"]) {
    console.log(`\n━━ keka ${host}`);
    const shell = await req(`https://${host}/careers/`, { accept: "text/html" });
    console.log("  shell dump (first 1800):");
    console.log("   ", shell.text.replace(/\s+/g, " ").slice(0, 1800));
    const jsUrls = new Set([...shell.text.matchAll(/https?:\/\/[^"'\s]+\.js[^"'\s]*/g)].map((m) => m[0]));
    console.log("  js urls anywhere:", [...jsUrls].slice(0, 8).join(" | ") || "none");
    const routes = new Set();
    for (const u of [...jsUrls].slice(0, 4)) {
      const js = await req(u, { accept: "*/*", timeout: 15000 });
      console.log(`  bundle ${u.split("/").pop().slice(0, 44)}: HTTP ${js.status}, ${js.text.length}B`);
      if (js.status !== 200) continue;
      for (const m of js.text.matchAll(/["'`]((?:\.{0,2}\/)?[A-Za-z0-9_-]*(?:api|job|position|career)[A-Za-z0-9/_.-]*)["'`]/gi)) {
        if (m[1].length > 5 && m[1].length < 90 && m[1].includes("/")) routes.add(m[1]);
      }
    }
    console.log("  api-ish routes:", JSON.stringify([...routes].slice(0, 50)));
    const guesses = [...routes].filter((r) => /job|position/i.test(r)).slice(0, 8);
    guesses.push("careers/api/publicpositions", "careers/api/jobs/active", "careers/api/jobdetails");
    for (const g of guesses) {
      const path = g.startsWith("/") ? g : `/${g.replace(/^\.\//, "")}`;
      const url = `https://${host}${path}`;
      console.log(`  GET  ${path}`.padEnd(56), ":", snip(await req(url), 160));
    }
  }

  // ── eightfold: cookie + csrf dance on one representative tenant
  console.log("\n━━ eightfold jobs.twilio.com (csrf dance)");
  {
    const shell = await req("https://jobs.twilio.com/careers", { accept: "text/html" });
    console.log("  shell:", `HTTP ${shell.status}, cookies: ${shell.cookies.length}`);
    shell.cookies.forEach((c) => console.log("   set-cookie:", c.split(";")[0].slice(0, 80)));
    const csrfInline = shell.text.match(/csrf[_-]?token["']?\s*[:=]\s*["']([^"']+)["']/i)?.[1];
    console.log("  inline csrf token:", csrfInline || "none");
    const cookieHeader = shell.cookies.map((c) => c.split(";")[0]).join("; ");
    const csrfCookie = shell.cookies.map((c) => c.split(";")[0]).find((c) => /csrf/i.test(c));
    const token = csrfInline || (csrfCookie ? csrfCookie.split("=").slice(1).join("=") : "");
    console.log("  using token:", token ? token.slice(0, 24) + "…" : "none");
    const attempts = [
      ["GET + cookies", () => req("https://jobs.twilio.com/api/apply/v2/jobs?domain=twilio.com&num=1&start=0", { headers: { Cookie: cookieHeader } })],
      ["POST + cookies + x-csrf-token", () =>
        req("https://jobs.twilio.com/api/apply/v2/jobs?domain=twilio.com", {
          method: "POST",
          headers: { ...JSONH, Cookie: cookieHeader, "x-csrf-token": token },
          body: JSON.stringify({ num: 1, start: 0, domain: "twilio.com" }),
        })],
      ["GET pcsx search + cookies", () => req("https://jobs.twilio.com/api/pcsx/search?domain=twilio.com&num=1", { headers: { Cookie: cookieHeader } })],
    ];
    for (const [label, fn] of attempts) {
      console.log(`  ${label}`.padEnd(38), ":", snip(await fn(), 180));
    }
  }

  console.log("\nDone.");
}

main();
