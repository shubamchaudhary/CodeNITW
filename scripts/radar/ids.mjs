// The job's own id on its board, read from its URL: the "openingID" part of
// the API's company:openingID:timestamp key (api/radar.mjs). A URL no pattern
// knows gets a hash of the URL instead, which is just as stable.

import { createHash } from "crypto";

const ID_PATTERNS = [
  /[?&]gh_jid=(\d+)/, // Greenhouse on a company's own site
  /greenhouse\.io\/[^/]+\/jobs\/(\d+)/,
  /jobs\.lever\.co\/[^/]+\/([0-9a-f-]{36})/,
  /jobs\.ashbyhq\.com\/[^/]+\/([0-9a-f-]{36})/,
  /myworkdayjobs\.com\/.*_([A-Za-z]*-?\d[\w-]*?)(?:\/apply)?\/?$/, // …/Software-Engineer_R-12345[/apply]
  /amazon\.jobs\/(?:[a-z-]+\/)?jobs\/(\d+)/,
  /naukri\.com\/job-listings-.*?-(\d{9,})/,
  /indeed\.[a-z.]+\/.*[?&]jk=([0-9a-f]+)/i,
  /linkedin\.com\/jobs\/view\/(?:[^/]*-)?(\d+)/,
  /glassdoor\.[a-z.]+\/.*[?&]jl=(\d+)/,
  /smartrecruiters\.com\/[^/]+\/(\d+)/,
  /icims\.com\/jobs\/(\d+)/,
  /freshteam\.com\/jobs\/([A-Za-z0-9]+)/,
  /oraclecloud\.com\/.*\/(?:job|preview)\/(\d+)/,
  /careers\.microsoft\.com\/.*\/job\/(\d+)/,
  /(?:careers\/applications\/jobs\/results|careers\.google\.com\/jobs\/results)\/(\d+)/, // Google
  /eightfold\.ai\/careers\/job\/(\d+)/,
  /contacthr\.com\/(\d+)/,
  /\/job\/([A-Z]{1,3}-?\d{4,})\b/, // …/job/R-95778
  /[?&](?:jobId|job_id|jid|job|vacancyNo|rx_jobId|tm_job|id)=([\w-]+)/i,
  /\/(\d{5,})(?:[/?#-]|$)/, // a long number in the path: …/job-detail/26038314/…
];

const urlKey = (u) =>
  String(u || "")
    .replace(/#.*$/, "")
    .replace(/[?&](utm_[a-z]+|src|source|ref|lang)=[^&]*/gi, "")
    .replace(/\/+$/, "")
    .toLowerCase();

export function openingIdOf(url) {
  const u = String(url || "").replace(/#.*$/, "");
  for (const rx of ID_PATTERNS) {
    const m = u.match(rx);
    if (m) return m[1];
  }
  return `u${createHash("sha1").update(urlKey(u)).digest("hex").slice(0, 12)}`;
}
