// One-off diagnostic for failing radar adapters: hit each candidate endpoint
// and print status + a body sample so the right URL/shape can be locked in.
// Run in CI (unrestricted egress); read the output in the workflow log.

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

async function probe(name, url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      method: opts.method || "GET",
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: opts.accept || "application/json",
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
        ...(opts.headers || {}),
      },
    });
    const text = await res.text();
    console.log(`\n### ${name} -> HTTP ${res.status} (${res.headers.get("content-type")})`);
    console.log(text.slice(0, 500).replace(/\s+/g, " "));
  } catch (e) {
    console.log(`\n### ${name} -> ERROR ${e.message}`);
  } finally {
    clearTimeout(t);
  }
}

await probe(
  "microsoft-v1",
  "https://gcsservices.careers.microsoft.com/search/api/v1/search?q=software%20engineer&lc=India&pg=1&pgSz=20&o=Relevance&flt=true"
);
await probe(
  "google-v3",
  "https://careers.google.com/api/v3/search/?q=%22software%20engineer%22&location=India&page_size=20"
);
await probe(
  "google-html",
  "https://www.google.com/about/careers/applications/jobs/results?q=%22software%20engineer%22&location=India",
  { accept: "text/html" }
);
await probe(
  "netflix-eightfold",
  "https://explore.jobs.netflix.net/api/apply/v2/jobs?domain=netflix.com&query=software%20engineer&location=India&num=10&start=0"
);
await probe(
  "paypal-pypl",
  "https://careers.pypl.com/api/apply/v2/jobs?domain=paypal.com&query=software%20engineer&location=India&num=10&start=0"
);
await probe(
  "paypal-eightfold",
  "https://paypal.eightfold.ai/api/apply/v2/jobs?domain=paypal.com&query=software%20engineer&location=India&num=10&start=0"
);
await probe(
  "jpmc-orc",
  "https://jpmc.fa.oraclecloud.com/hcmRestApi/resources/latest/recruitingCEJobRequisitions?onlyData=true&expand=requisitionList&finder=findReqs%3BsiteNumber%3DCX_1001%2Ckeyword%3Dengineer&limit=10"
);
await probe(
  "jpmc-orc-plain",
  "https://jpmc.fa.oraclecloud.com/hcmRestApi/resources/latest/recruitingCEJobRequisitions?onlyData=true&finder=findReqs;siteNumber=CX_1001,keyword=engineer&limit=10"
);
await probe("gs-higher", "https://higher.gs.com/api/search?limit=10&offset=0&query=engineer");
await probe("gs-roles", "https://higher.gs.com/services/roles?limit=10&offset=0&searchTerm=engineer");
await probe(
  "walmart-api",
  "https://careers.walmart.com/api/search?q=software%20engineer&page=1&sort=rank"
);
await probe(
  "nvidia-cxs",
  "https://nvidia.wd5.myworkdayjobs.com/wday/cxs/nvidia/NVIDIAExternalCareerSite/jobs",
  { method: "POST", body: { appliedFacets: {}, limit: 20, offset: 0, searchText: "engineer" } }
);
await probe("booking-root", "https://booking.wd3.myworkdayjobs.com/", { accept: "text/html" });
await probe("booking-careers", "https://jobs.booking.com/booking/jobs", { accept: "text/html" });
await probe(
  "intuit-phenom",
  "https://jobs.intuit.com/api/jobs?keywords=software%20engineer&location=India&page=1"
);
await probe(
  "intuit-phenom-search",
  "https://jobs.intuit.com/search-jobs/software%20engineer/India",
  { accept: "text/html" }
);
await probe("apple-search", "https://jobs.apple.com/api/role/search", {
  method: "POST",
  body: { query: "software engineer", filters: { locations: ["postLocation-IND"] }, page: 1, locale: "en-us" },
});
await probe("apple-csrf", "https://jobs.apple.com/api/csrfToken");
await probe(
  "caterpillar-cxs",
  "https://cat.wd5.myworkdayjobs.com/wday/cxs/cat/CaterpillarCareers/jobs",
  { method: "POST", body: { appliedFacets: {}, limit: 20, offset: 0, searchText: "engineer" } }
);
await probe("caterpillar-careers", "https://careers.caterpillar.com/en/jobs/", { accept: "text/html" });
await probe("bofa-careers", "https://careers.bankofamerica.com/en-us/job-search?search=engineer", {
  accept: "text/html",
});

console.log("\nDONE");
