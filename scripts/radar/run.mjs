// Job radar — runs on your own PC five times a day (Windows Task Scheduler,
// see setup.ps1), never in GitHub Actions: the old Actions radar got the
// GitHub account blocked.
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
// includes India), the experience it asks for (its range must include 2
// years: "0-2", "1-3", "2-5" stay, "3+" and "0-1" go), a skills match above 0, pay
// against your 25 LPA minimum (labelled from the posted salary or levels.fyi;
// only a posted salary topping out under 22L drops a role, see pay.mjs), and
// a skills match score with the skills it asks for that your resume lacks.
// Duplicates across sources collapse into one opening.
//
// Each run POSTs every opening it found to the site's /api/radar, which keeps
// them in Firestore — the permanent record, readable from any device through
// GET /api/radar (see api/radar.mjs) and shown in the Jobs page's Openings tab.
// .radar/ (gitignored) only caches: first-seen dates, pay lookups, uploads
// that failed and wait for the next run.
//
// Run:  node scripts/radar/run.mjs            (full run + upload)
//       node scripts/radar/run.mjs --dry-run  (no upload)
//       node scripts/radar/run.mjs --only=riley,jobspy,careerops --days=3
//       node scripts/radar/run.mjs --linkedin (also sweep LinkedIn; off by default)

import { readFileSync, writeFileSync, mkdirSync, existsSync, appendFileSync, readdirSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";
import { fetchBoardJobs, isRelevant, INDIA_RX } from "../jobRadar.mjs";
import { buildScorer } from "../scoreOpening.mjs";
import { fetchRileyJobs } from "./riley.mjs";
import { fetchJobspyJobs } from "./jobspy.mjs";
import { fetchCareerOpsJobs, writeCv } from "./careerops.mjs";
import { experienceRange, experienceTag } from "./experience.mjs";
import { makePayChecker } from "./pay.mjs";
import { DEFAULT_RESUME_PDF, loadResumeText, resumeProfile } from "./resume.mjs";
import { openingIdOf } from "./ids.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const STATE = join(ROOT, ".radar");
// The local store is only a cache (first-seen dates, scores of jobs whose
// description isn't re-fetched); Firestore, through /api/radar, is the record.
// An opening stays cached while a source still lists it, so its first-seen
// date never resets; one no source has shown for a week is dropped.
const KEEP_UNSEEN_DAYS = 7;
const DEFAULT_API_URL = "https://interviewplanprep.vercel.app/api/radar";

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

// KEY=VALUE lines from .radar/.env (RADAR_INGEST_TOKEN, RADAR_API_URL, RESUME_PDF).
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

// Upload to /api/radar. A failed upload is kept in .radar/pending/ and sent
// before the next run's, so a day without internet, a wrong token or an API
// not deployed yet loses nothing (the last MAX_PENDING uploads are kept).
const MAX_PENDING = 15; // three days of runs at five a day

async function upload(payload, env) {
  const url = env.RADAR_API_URL || DEFAULT_API_URL;
  const pendingDir = join(STATE, "pending");
  mkdirSync(pendingDir, { recursive: true });
  const waiting = readdirSync(pendingDir).filter((f) => f.endsWith(".json")).sort();
  for (const f of waiting.slice(0, Math.max(0, waiting.length - (MAX_PENDING - 1)))) rmSync(join(pendingDir, f), { force: true });
  const queue = waiting
    .slice(-(MAX_PENDING - 1))
    .filter((f) => existsSync(join(pendingDir, f)))
    .map((f) => ({ file: join(pendingDir, f), body: readFileSync(join(pendingDir, f), "utf8") }));
  const current = { file: join(pendingDir, `${Date.now()}.json`), body: JSON.stringify(payload) };
  writeFileSync(current.file, current.body);
  queue.push(current);

  for (const item of queue) {
    try {
      const res = await fetch(url, {
        method: "POST",
        signal: AbortSignal.timeout(120000),
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.RADAR_INGEST_TOKEN}` },
        body: item.body,
      });
      const text = (await res.text()).slice(0, 300);
      log(`Upload ${item === current ? "" : "(retry) "}to ${url}: ${res.status} ${text}`);
      // Only a rejected body (400) or one too large (413) won't get better by retrying.
      if (res.ok || res.status === 400 || res.status === 413) rmSync(item.file, { force: true });
      if (!res.ok) process.exitCode = 1;
    } catch (e) {
      log(`Upload failed (${e.message}); kept for the next run`);
      process.exitCode = 1;
      break;
    }
  }
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
    run("riley", () => fetchRileyJobs({ days: DAYS, keep: keepDataset, known: knownUrls, cacheFile: join(STATE, "riley-cache.json"), log })),
    run("jobspy", () => fetchJobspyJobs({ stateDir: STATE, terms: resume?.searchTerms, hoursOld: Math.min(DAYS, 7) * 24, log })),
    run("careerops", () => fetchCareerOpsJobs({ stateDir: STATE, titleKeywords, sinceDays: Math.max(DAYS, 14), log })),
  ]);
  saveJSON("atsCache.json", atsCache);

  // ── Relevance + de-duplication ──────────────────────────────────────────────
  const dropped = { notRelevant: 0, experience: 0, noSkillMatch: 0, payBelow: 0, duplicate: 0 };
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

  // ── Experience, skills match, pay ──────────────────────────────────────────
  // An opening dropped here is also sent to the API to delete, in case an
  // earlier run (or earlier rules) stored it.
  const seenNow = new Set();
  const candidates = [];
  const remove = [];
  const drop = (counter, key, j) => {
    dropped[counter] += 1;
    delete store[key];
    remove.push({ company: j.company, openingId: openingIdOf(j.url) });
  };
  for (const j of byFp.values()) {
    const key = hash(urlKey(j.url));
    const old = store[key];
    seenNow.add(key);
    const range =
      j.desc || j.experienceRange || !old
        ? experienceRange(j)
        : old.minYoe !== undefined
          ? { min: old.minYoe, max: old.maxYoe ?? null }
          : undefined;
    const exp = experienceTag(range);
    // 2 years must be inside what it asks; a senior title that doesn't say is out too.
    if (exp === "too-senior" || exp === "too-junior" || (exp === "unknown" && SENIOR_RX.test(j.title))) {
      drop("experience", key, j);
      continue;
    }
    const scored =
      j.desc || !old || resumeChanged
        ? scorer.score({ title: j.title, desc: j.desc, location: j.location })
        : { score: old.matchScore, matched: old.matched, missing: old.missing };
    if (!(scored.score > 0)) {
      drop("noSkillMatch", key, j);
      continue;
    }
    candidates.push({ j, key, old, range, exp, scored });
  }
  // levels.fyi lookups are capped per run, so the roles that fit get them first.
  candidates.sort((a, b) => (a.exp === "fits" ? 0 : 1) - (b.exp === "fits" ? 0 : 1));

  const checkPay = makePayChecker({ cache: payCache });
  for (const { j, key, old, range, exp, scored } of candidates) {
    const pay = await checkPay(j);
    if (pay.verdict === "below") {
      drop("payBelow", key, j);
      continue;
    }

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
      ...(range ? { minYoe: range.min, ...(range.max !== null ? { maxYoe: range.max } : {}) } : {}),
      exp,
      pay,
      matchScore: scored.score,
      matched: (scored.matched || []).slice(0, 10),
      missing: scored.missing || [],
      snippet: j.desc ? clip(j.desc) : old?.snippet || "",
    };
  }
  saveJSON("payCache.json", payCache);

  // ── Cache upkeep and upload ─────────────────────────────────────────────────
  const unseenCut = Date.now() - KEEP_UNSEEN_DAYS * 86400000;
  for (const [k, o] of Object.entries(store)) if (Date.parse(o.lastSeen) < unseenCut) delete store[k];
  saveJSON("store.json", store);

  // Everything this run found goes up; the API keeps the record and the history.
  const found = Object.values(store)
    .filter((o) => o.lastSeen === now)
    .map((o) => ({ ...o, openingId: openingIdOf(o.url), seenSince: o.firstSeen }));
  const summary = {
    ranAt: now,
    seconds: Math.round((Date.now() - started) / 1000),
    sources,
    dropped,
    found: found.length,
    newToThisPc: found.filter((o) => o.firstSeen === now).length,
    linkedin: flag("linkedin"),
    resume: resume ? { headline: resume.headline, skills: resume.skills.length, searchTerms: resume.searchTerms } : null,
  };
  const payload = { summary, openings: found, remove };
  saveJSON("openings.json", payload);
  log(JSON.stringify(summary));
  for (const o of found.filter((x) => x.firstSeen === now).slice(0, 15)) {
    log(`  NEW  ${o.exp.padEnd(7)} ${o.pay.verdict.padEnd(8)} ${String(o.matchScore ?? "").padStart(3)}  ${o.company} — ${o.title} (${o.location})`);
  }

  if (flag("dry-run")) return log("Dry run: not uploading.");
  if (!env.RADAR_INGEST_TOKEN) return log("Not uploading: set RADAR_INGEST_TOKEN in .radar/.env (the same value as on Vercel).");
  await upload(payload, env);
}

main().catch((e) => {
  log(`Radar crashed: ${e.stack || e}`);
  process.exitCode = 1;
});
