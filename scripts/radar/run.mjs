// Daily job radar — runs on your own PC (Windows Task Scheduler, see
// setup.ps1), never in GitHub Actions: the old Actions radar got the GitHub
// account blocked.
//
// Sources, all fetched in parallel:
//   board     — the tracked company boards (scripts/jobRadar.mjs)
//   riley     — the Riley-Dorrington daily dataset, 20k+ companies' ATS boards
//   jobspy    — Naukri, Indeed India and Glassdoor India via JobSpy
//   careerops — career-ops' scanner, for employers on hiring systems the
//               others can't read (career-ops-companies.yml)
// Your resume PDF supplies the keywords (resume.mjs): JobSpy's search terms,
// career-ops' title filter, and the skills each opening is scored against.
// Every job then gets the same checks: backend title in India (or remote that
// includes India), the experience it asks for (≤3 years kept, ≤2 "fits"), pay
// against your 25 LPA minimum (labelled from the posted salary or levels.fyi;
// only a posted salary topping out under 22L drops a role, see pay.mjs), and
// a skills match score with the skills it asks for that your resume lacks.
// Duplicates across sources collapse into one opening.
//
// Results live in .radar/ (gitignored): store.json keeps every opening seen
// in the last week with the day it first appeared. Each run uploads the list
// to the site's /api/radar, which the Jobs page's Openings tab reads.
//
// Run:  node scripts/radar/run.mjs            (full run + upload)
//       node scripts/radar/run.mjs --dry-run  (no upload)
//       node scripts/radar/run.mjs --only=riley,jobspy,careerops --days=3
//       node scripts/radar/run.mjs --linkedin (also sweep LinkedIn; off by default)

import { readFileSync, writeFileSync, mkdirSync, existsSync, appendFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";
import { fetchBoardJobs, isRelevant, INDIA_RX } from "../jobRadar.mjs";
import { buildScorer } from "../scoreOpening.mjs";
import { fetchRileyJobs } from "./riley.mjs";
import { fetchJobspyJobs } from "./jobspy.mjs";
import { fetchCareerOpsJobs, writeCv } from "./careerops.mjs";
import { minYears, experienceTag } from "./experience.mjs";
import { makePayChecker } from "./pay.mjs";
import { DEFAULT_RESUME_PDF, loadResumeText, resumeProfile } from "./resume.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const STATE = join(ROOT, ".radar");
const KEEP_UNSEEN_DAYS = 7; // an opening no source has shown for a week is gone
const MAX_AGE_DAYS = 30; // and none older than this, however often re-listed
const MAX_UPLOAD = 600;
const DEFAULT_UPLOAD_URL = "https://interviewplanprep.vercel.app/api/radar";

// Which copy of a duplicate wins: the employer's own board link first.
const SOURCE_RANK = { board: 0, riley: 1, careerops: 2, indeed: 3, naukri: 4, glassdoor: 5, linkedin: 6 };

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, dflt) => (args.find((a) => a.startsWith(`--${name}=`)) || "").split("=")[1] || dflt;
const ONLY = new Set(opt("only", "board,riley,jobspy,careerops").split(","));
const DAYS = Number(opt("days", 7));

mkdirSync(join(STATE, "logs"), { recursive: true });
const logFile = join(STATE, "logs", `${new Date().toISOString().slice(0, 10)}.log`);
function log(...parts) {
  const line = parts.join(" ");
  console.log(line);
  appendFileSync(logFile, `[${new Date().toISOString().slice(11, 19)}] ${line}\n`);
}

const loadJSON = (name, fallback) => {
  try {
    return JSON.parse(readFileSync(join(STATE, name), "utf8"));
  } catch {
    return fallback;
  }
};
const saveJSON = (name, data) => writeFileSync(join(STATE, name), JSON.stringify(data, null, 1));

// KEY=VALUE lines from .radar/.env (CRON_SECRET, RADAR_UPLOAD_URL).
function localEnv() {
  const p = join(STATE, ".env");
  if (!existsSync(p)) return {};
  return Object.fromEntries(
    readFileSync(p, "utf8")
      .split(/\r?\n/)
      .map((l) => l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/))
      .filter(Boolean)
      .map((m) => [m[1], m[2].replace(/^["']|["']$/g, "")])
  );
}

// India, or remote that India can take (a bare "Remote" from a US startup
// usually means US-only, so it isn't enough on its own).
function inIndia(location) {
  const l = location || "";
  if (INDIA_RX.test(l)) return true;
  return /remote/i.test(l) && /\b(apac|asia|anywhere|worldwide|global)\b/i.test(l);
}

// On top of jobRadar's title rules: no quality/test or frontend roles at all
// ("Front End" with a space slips past jobRadar's list), and a senior-level
// title only when its description says ≤3 years (checked later).
const NOT_BACKEND_RX = /\b(quality|qe|sdet|automation test(ing)?|manual test(ing)?|front[ -]end|frontend|ui developer)\b/i;
const SENIOR_RX = /\b(senior|sr\.?|iii|iv)\b/i;
const keep = (title, location) => isRelevant(title, location) && !NOT_BACKEND_RX.test(title) && (!location || inIndia(location));
// The dataset has no descriptions to rescue a senior title, so they're skipped up front.
const keepDataset = (title, location) => keep(title, location) && !SENIOR_RX.test(title);

// Board slugs ("adyen") and HR-system prefixes ("204 U.S. Bancorp") tidied for display.
function displayCompany(name) {
  const n = String(name || "").replace(/^\d+\s+/, "").trim();
  return /^[a-z0-9-]+$/.test(n) ? n.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : n;
}

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const urlKey = (u) =>
  String(u || "")
    .replace(/#.*$/, "")
    .replace(/[?&](utm_[a-z]+|src|source|ref|lang)=[^&]*/gi, "")
    .replace(/\/+$/, "")
    .toLowerCase();
const hash = (s) => createHash("sha1").update(s).digest("hex").slice(0, 16);
// Same company, same title, same first city → the same opening on two boards.
const fingerprint = (j) =>
  `${norm(j.company).replace(/\b(india|pvt|private|ltd|limited|inc|technologies|software|solutions)\b/g, "").trim()}|${norm(j.title)}|${norm((j.location || "").split(/[,;|/]/)[0])}`;

function clip(s, max = 200) {
  const t = s || "";
  return t.length > max ? t.slice(0, max).trimEnd() + "…" : t;
}

async function main() {
  const started = Date.now();
  const now = new Date().toISOString();
  log(`── Radar run ${now} (sources: ${[...ONLY].join(", ")}${flag("linkedin") ? " + linkedin" : ""})`);

  const env = { ...localEnv(), ...process.env };
  const store = loadJSON("store.json", {});
  const atsCache = loadJSON("atsCache.json", {});
  const payCache = loadJSON("payCache.json", {});
  // Skills to score against: the resume's, plus radar/skills.json's extras
  // (skills the resume implies without naming) and its want list.
  const listed = JSON.parse(readFileSync(join(ROOT, "radar/skills.json"), "utf8"));
  const { text: resumeText, changed: resumeChanged } = loadResumeText({ stateDir: STATE, pdfPath: env.RESUME_PDF || DEFAULT_RESUME_PDF, log });
  const resume = resumeText ? resumeProfile(resumeText) : null;
  // A changed resume means every opening is re-scored, so the dataset source
  // re-fetches descriptions it would otherwise skip.
  const knownUrls = resumeChanged ? new Set() : new Set(Object.values(store).map((o) => o.url));
  const have = [...new Set([...(resume?.skills || []), ...(listed.have || [])])];
  const haveLow = new Set(have.map((s) => s.toLowerCase()));
  const want = (listed.want || []).filter((s) => !haveLow.has(s.toLowerCase()));
  const scorer = buildScorer({ have, want });
  if (resume) {
    log(`Resume: ${resume.skills.length} skills; searching for ${resume.searchTerms.map((t) => `"${t}"`).join(", ")}`);
    writeCv(STATE, resumeText);
  } else {
    log("Resume: none — scoring against radar/skills.json only");
  }
  const titleKeywords = resume?.titleKeywords || ["software engineer", "backend", "java", "sde", "software developer", "platform engineer"];

  const sources = {};
  const run = async (name, fn) => {
    if (!ONLY.has(name)) return [];
    const t = Date.now();
    try {
      const r = await fn();
      sources[name] = { fetched: r.jobs.length, seconds: Math.round((Date.now() - t) / 1000), ...(r.failed ? { failedBoards: r.failed.length } : {}), ...(r.updatedAt ? { datasetUpdatedAt: r.updatedAt } : {}), ...(r.skipped ? { skipped: true } : {}) };
      return r.jobs;
    } catch (e) {
      sources[name] = { error: String(e.message || e).slice(0, 200) };
      log(`${name} failed: ${e.message}`);
      return [];
    }
  };

  const batches = await Promise.all([
    run("board", () => fetchBoardJobs({ atsCache, linkedin: flag("linkedin"), log })),
    run("riley", () => fetchRileyJobs({ days: DAYS, keep: keepDataset, known: knownUrls, log })),
    run("jobspy", () => fetchJobspyJobs({ stateDir: STATE, terms: resume?.searchTerms, hoursOld: Math.min(DAYS, 7) * 24, log })),
    run("careerops", () => fetchCareerOpsJobs({ stateDir: STATE, titleKeywords, sinceDays: Math.max(DAYS, 14), log })),
  ]);
  saveJSON("atsCache.json", atsCache);

  // ── Relevance + de-duplication ──────────────────────────────────────────────
  const dropped = { notRelevant: 0, tooSenior: 0, payBelow: 0, duplicate: 0 };
  const byFp = new Map();
  for (const raw of batches.flat()) {
    if (!keep(raw.title, raw.location)) {
      dropped.notRelevant += 1;
      continue;
    }
    const j = { ...raw, company: displayCompany(raw.company) };
    const fp = fingerprint(j);
    const prev = byFp.get(fp);
    if (!prev) {
      byFp.set(fp, { ...j, sources: [j.source] });
      continue;
    }
    dropped.duplicate += 1;
    const [win, lose] = (SOURCE_RANK[j.source] ?? 9) < (SOURCE_RANK[prev.source] ?? 9) ? [j, prev] : [prev, j];
    byFp.set(fp, {
      ...lose,
      ...win,
      desc: win.desc || lose.desc,
      pay: win.pay || lose.pay,
      experienceRange: win.experienceRange || lose.experienceRange,
      postedAt: win.postedAt || lose.postedAt,
      sources: [...new Set([...(prev.sources || []), j.source])],
    });
  }

  // ── Experience, pay, score ─────────────────────────────────────────────────
  const seenNow = new Set();
  const candidates = [];
  for (const j of byFp.values()) {
    const key = hash(urlKey(j.url));
    const old = store[key];
    seenNow.add(key);
    const years = j.desc || j.experienceRange || !old ? minYears(j) : old.minYoe;
    const exp = experienceTag(years);
    if (exp === "too-senior" || (exp === "unknown" && SENIOR_RX.test(j.title))) {
      dropped.tooSenior += 1;
      delete store[key];
      continue;
    }
    candidates.push({ j, key, old, years, exp });
  }
  // levels.fyi lookups are capped per run, so the best-fitting roles get them first.
  const EXP_ORDER = { fits: 0, stretch: 1, unknown: 2 };
  candidates.sort((a, b) => EXP_ORDER[a.exp] - EXP_ORDER[b.exp]);

  const checkPay = makePayChecker({ cache: payCache });
  for (const { j, key, old, years, exp } of candidates) {
    const pay = await checkPay(j);
    if (pay.verdict === "below") {
      dropped.payBelow += 1;
      delete store[key];
      continue;
    }
    const scored =
      j.desc || !old || resumeChanged
        ? scorer.score({ title: j.title, desc: j.desc, location: j.location })
        : { score: old.matchScore, matched: old.matched, missing: old.missing };

    store[key] = {
      key,
      source: j.source,
      sources: j.sources,
      ats: j.ats,
      company: j.company,
      title: j.title,
      location: j.location,
      url: j.url,
      ...(j.postedAt ? { postedAt: String(j.postedAt).slice(0, 10) } : {}),
      firstSeen: old?.firstSeen || now,
      lastSeen: now,
      ...(years !== undefined ? { minYoe: years } : {}),
      exp,
      pay,
      matchScore: scored.score,
      matched: (scored.matched || []).slice(0, 10),
      missing: scored.missing || [],
      snippet: j.desc ? clip(j.desc) : old?.snippet || "",
    };
  }
  saveJSON("payCache.json", payCache);

  // ── Prune and publish ──────────────────────────────────────────────────────
  const unseenCut = Date.now() - KEEP_UNSEEN_DAYS * 86400000;
  const ageCut = Date.now() - MAX_AGE_DAYS * 86400000;
  for (const [k, o] of Object.entries(store)) {
    if (Date.parse(o.lastSeen) < unseenCut || Date.parse(o.firstSeen) < ageCut) delete store[k];
  }
  saveJSON("store.json", store);

  const openings = Object.values(store).sort(
    (a, b) => b.firstSeen.slice(0, 10).localeCompare(a.firstSeen.slice(0, 10)) || (b.matchScore || 0) - (a.matchScore || 0)
  );
  const summary = {
    updatedAt: now,
    seconds: Math.round((Date.now() - started) / 1000),
    sources,
    dropped,
    openings: openings.length,
    newThisRun: openings.filter((o) => o.firstSeen === now).length,
    seenThisRun: seenNow.size,
    linkedin: flag("linkedin"),
    resume: resume ? { headline: resume.headline, skills: resume.skills.length, searchTerms: resume.searchTerms } : null,
  };
  const payload = { summary, openings: openings.slice(0, MAX_UPLOAD) };
  saveJSON("openings.json", payload);
  log(JSON.stringify(summary));

  const top = openings.filter((o) => o.firstSeen === now).slice(0, 15);
  for (const o of top) log(`  NEW  ${o.exp.padEnd(7)} ${o.pay.verdict.padEnd(7)} ${String(o.matchScore ?? "").padStart(3)}  ${o.company} — ${o.title} (${o.location})`);

  if (flag("dry-run")) return log("Dry run: not uploading.");
  if (!env.CRON_SECRET) return log("Not uploading: set CRON_SECRET in .radar/.env (same value as on Vercel).");
  const url = env.RADAR_UPLOAD_URL || DEFAULT_UPLOAD_URL;
  try {
    const res = await fetch(url, {
      method: "POST",
      signal: AbortSignal.timeout(60000),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.CRON_SECRET}` },
      body: JSON.stringify(payload),
    });
    log(`Upload to ${url}: ${res.status} ${(await res.text()).slice(0, 200)}`);
    if (!res.ok) process.exitCode = 1;
  } catch (e) {
    log(`Upload failed: ${e.message}`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  log(`Radar crashed: ${e.stack || e}`);
  process.exitCode = 1;
});
