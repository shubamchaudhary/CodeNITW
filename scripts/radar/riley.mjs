// Riley-Dorrington job-board dataset source for the radar.
//
// github.com/Riley-Dorrington/job-board-aggregator scrapes Greenhouse, Lever,
// Ashby, Workday, iCIMS, BambooHR and Paylocity boards of 20,000+ companies
// once a day and publishes the result as gzipped JSON chunks on GitHub Pages.
// We only download those static files (~70 MB) and filter them here, so this
// one source covers far more companies than our own board list without us
// crawling anything.
//
// The dataset has no job descriptions, so for the few fresh India matches we
// fetch the description from the board's own public API (Greenhouse, Lever,
// Workday) for the experience and skills checks.

import { existsSync, readFileSync, writeFileSync } from "fs";
import { gunzipSync } from "zlib";
import { stripHtml } from "../jobRadar.mjs";

const BASE = "https://riley-dorrington.github.io/job-board-data/data/chunks";
const DETAIL_LIMIT = 250; // descriptions fetched per run, newest first

async function getJSON(url, timeout = 30000) {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeout), headers: { "User-Agent": "Mozilla/5.0 (job-radar)" } });
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  return res.json();
}

async function getGz(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(120000) });
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  return JSON.parse(gunzipSync(Buffer.from(await res.arrayBuffer())).toString("utf8"));
}

// Description and company display name from the board's own API, or null.
async function fetchDetail(job) {
  const u = job.url;
  try {
    let m = u.match(/greenhouse\.io\/([^/]+)\/jobs\/(\d+)/) || u.match(/gh_jid=(\d+)/);
    if (m && /gh_jid/.test(m[0])) m = [null, job.company, m[1]];
    if (m && (job.ats || "").toLowerCase() === "greenhouse") {
      const d = await getJSON(`https://boards-api.greenhouse.io/v1/boards/${m[1]}/jobs/${m[2]}`, 15000);
      return { desc: stripHtml(d.content?.replace(/&lt;/g, "<").replace(/&gt;/g, ">")), company: d.company_name };
    }
    m = u.match(/jobs\.lever\.co\/([^/]+)\/([0-9a-f-]{36})/);
    if (m) {
      const d = await getJSON(`https://api.lever.co/v0/postings/${m[1]}/${m[2]}`, 15000);
      const lists = (d.lists || []).map((l) => `${l.text} ${l.content}`).join(" ");
      return { desc: stripHtml(`${d.descriptionPlain || d.description || ""} ${lists}`) };
    }
    m = u.match(/^(https:\/\/([^.]+)\.(wd\d+)\.myworkdayjobs\.com)\/(?:[a-z]{2}-[A-Z]{2}\/)?([^/]+)(\/job\/.+)$/);
    if (m) {
      const res = await fetch(`${m[1]}/wday/cxs/${m[2]}/${m[4]}${m[5]}`, {
        signal: AbortSignal.timeout(15000),
        headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 (job-radar)" },
      });
      if (!res.ok) return null;
      const d = await res.json();
      const info = d.jobPostingInfo || {};
      return { desc: stripHtml(info.jobDescription || ""), company: d.hiringOrganization?.name };
    }
  } catch (_) {
    // best-effort: the opening stays title-only
  }
  return null;
}

// Fresh relevant jobs from the dataset:
//   [{ source, ats, id, company, companySlug, title, location, url, postedAt, desc }]
// `keep(title, location)` decides relevance; `known` holds URLs the radar
// already has, whose descriptions needn't be fetched again.
// The dataset changes once a day, so with several runs a day the ~70 MB
// download is skipped when `cacheFile` already holds this version's matches.
export async function fetchRileyJobs({ days = 7, keep, known = new Set(), cacheFile, log = console.log } = {}) {
  const manifest = await getJSON(`${BASE}/jobs_manifest.json?t=${Date.now()}`);
  const cutoff = Date.now() - days * 86400000;
  const v = encodeURIComponent(manifest.last_updated);
  let cache = null;
  try {
    cache = cacheFile && existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile, "utf8")) : null;
  } catch (_) {
    cache = null;
  }

  let hits = [];
  if (cache?.lastUpdated === manifest.last_updated && cache.days === days) {
    hits = cache.hits.filter((j) => Date.parse(j.first_seen || "") >= cutoff);
    log(`Riley dataset: unchanged since ${manifest.last_updated}, ${hits.length} fresh matches from the last download`);
  } else {
    log(`Riley dataset: ${manifest.totalJobs} jobs in ${manifest.chunks.length} chunks, updated ${manifest.last_updated}`);
    let ci = 0;
    let failedChunks = 0;
    await Promise.all(
      Array.from({ length: 4 }, async () => {
        while (ci < manifest.chunks.length) {
          const name = manifest.chunks[ci++];
          let data;
          try {
            data = await getGz(`${BASE}/${name}?v=${v}`);
          } catch (e) {
            failedChunks += 1;
            continue;
          }
          for (const j of Array.isArray(data) ? data : []) {
            if (j.is_recruiter) continue;
            const seen = Date.parse(j.first_seen || "");
            if (!(seen >= cutoff)) continue;
            if (!keep(j.title || "", j.location || "")) continue;
            hits.push(j);
          }
        }
      })
    );
    log(`Riley dataset: ${hits.length} fresh matches${failedChunks ? `, ${failedChunks} chunks failed` : ""}`);
    // Only a complete download is worth reusing.
    if (cacheFile && !failedChunks) writeFileSync(cacheFile, JSON.stringify({ lastUpdated: manifest.last_updated, days, hits }));
  }

  const jobs = hits
    .sort((a, b) => (b.first_seen || "").localeCompare(a.first_seen || ""))
    .map((j) => ({
      source: "riley",
      ats: (j.ats || "").toLowerCase(),
      id: j.url,
      company: j.company,
      companySlug: j.company,
      title: (j.title || "").trim(),
      location: j.location || "",
      url: j.url,
      postedAt: j.first_seen,
      desc: "",
    }));

  const todo = jobs.filter((j) => !known.has(j.url)).slice(0, DETAIL_LIMIT);
  let di = 0;
  await Promise.all(
    Array.from({ length: 6 }, async () => {
      while (di < todo.length) {
        const j = todo[di++];
        const d = await fetchDetail(j);
        if (d?.desc) j.desc = d.desc;
        if (d?.company) j.company = d.company;
      }
    })
  );
  return { jobs, updatedAt: manifest.last_updated };
}
