// The radar's AI rating: the same Groq rating the Naukri job finder gives its jobs
// (extensions/naukri-refresher/rate-lib.js, rate.js: the LLM only lists the JD's requirements
// and quotes your resume as proof; the 1–100 rating is worked out in code), for the radar's own
// openings, so the Openings tab can show only the good ones.
//
// Keys: GROQ_API_KEYS in .radar/.env, comma-separated (key1,key2,…). Each key is kept under 70%
// of Groq's free limits, as in the extension; the day's tally per key is kept in
// .radar/rate-state.json. RADAR_RATE_PER_DAY caps the radar's calls a day (default 400).
// Without keys nothing is rated and the radar works as before. `--rerate` (run.mjs) rates every
// opening again; a key Groq answers 429 for 5 minutes running is retired for an hour (kept in the
// state file), and with every key out the run's rating stops and the next run carries on.
//
// Each opening is rated once: its rating stays on the stored opening. One whose description
// isn't fetched this run keeps a trimmed copy of it (jdText) until it's rated. The prompt and the
// model's answer (dbg) go up with that run's upload only; the PC doesn't keep them.
//
// Pay: the radar's own pay check (pay.mjs: the posted salary, levels.fyi, Glassdoor) stands in for
// the extension's web lookup, so the radar makes no extra calls for it.

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { RATE, RATE_VERSION, rateText, cleanResume, rateHash } from "../../extensions/naukri-refresher/rate-lib.js";
import { startRater } from "../../extensions/naukri-refresher/rate.js";
import { findSkills } from "../../extensions/naukri-refresher/skills-dict.js";
import { stackWeights, stackVerdict } from "../../extensions/naukri-refresher/jobs-lib.js";

const DRAIN_MS = 20 * 60_000; // how long a radar run may spend rating
const DEFAULT_PER_DAY = 400;
export const MIN_RATING = 70; // an opening the LLM rated under this isn't kept (RADAR_MIN_RATING in .radar/.env)

/** Whether an opening's AI rating is under the bar (one not rated yet is never "under"). */
export const underBar = (entry, min = MIN_RATING) => !!(entry && entry.ai && entry.ai.s < min);

// Keep measured pay ranges. Legacy verdicts lack the numbers behind their labels.
export function payFigure(pay) {
  return pay?.companyRange ?? null;
}

/** The job's list (Backend or AI resume), or why its stack isn't yours (MERN, .NET…), from its text. */
export function stackOfJob(title, text) {
  const found = findSkills(`${title}\n${text}`);
  const titleSkills = new Set(findSkills(title).keys());
  const v = stackVerdict(stackWeights(found, titleSkills), { fastApi: found.has("FastAPI") });
  if (!v) return { profile: "backend" };
  return v;
}

/**
 * Rates the openings of this run that have no rating yet. `jobs` are { key, j (the source job, with
 * desc when fetched), entry (the store's copy, mutated) }. → { rated, calls, why, dbg: Map key → prompt and answer }
 */
export async function rateOpenings(jobs, { env, stateDir, resumeTexts, log, rerate = false, knobs = {} }) {
  const keys = String(env.GROQ_API_KEYS || env.GROQ_API_KEY || "").split(/[\s,;]+/).map((k) => k.trim()).filter(Boolean).slice(0, RATE.maxKeys);
  const dbg = new Map();
  if (!keys.length) return { rated: 0, calls: 0, why: "no GROQ_API_KEYS in .radar/.env", dbg };
  if (resumeTexts.length < 1) return { rated: 0, calls: 0, why: "no resume text", dbg };
  const resumes = { sde: cleanResume(resumeTexts[0]), genai: cleanResume(resumeTexts[1] || resumeTexts[0]) };
  const hash = { backend: rateHash(resumes.sde), ai: rateHash(resumes.genai) };
  const statePath = join(stateDir, "rate-state.json");
  const day = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10); // IST date
  let state = existsSync(statePath) ? JSON.parse(readFileSync(statePath, "utf8")) : {};
  if (state.day !== day) state = { day, counts: { calls: 0, rated: { backend: 0, ai: 0 }, tokens: { input: 0, cached: 0, output: 0 }, fails: 0, last: null, keys: {} } };
  const perDay = Number(env.RADAR_RATE_PER_DAY) >= 0 && env.RADAR_RATE_PER_DAY !== "" && env.RADAR_RATE_PER_DAY !== undefined ? Number(env.RADAR_RATE_PER_DAY) : DEFAULT_PER_DAY;

  const queue = [];
  for (const { key, j, entry } of jobs) {
    const text = j.desc ? rateText(j.desc) : entry.jdText || "";
    if (!rerate && entry.ai && entry.ai.v === RATE_VERSION && entry.aiHash === hash[entry.aiProfile || "backend"]) continue; // rated already
    if (!text || text.length < 200) continue; // nothing to read yet
    const st = stackOfJob(j.title, text);
    entry.jdText = text; // until it's rated (a later run may not fetch the description again)
    if (st.out) {
      entry.stackOut = st.out;
      continue;
    }
    delete entry.stackOut;
    queue.push({
      id: key, profile: st.profile, post: Date.now(), t: Date.now(),
      p: { coverage: entry.matchScore, rank: entry.matchScore },
      text, skills: [], job: { pay: entry.pay?.postedRange, salary: entry.pay?.postedRange ? entry.pay.text : undefined, title: j.title, company: j.company, exp: entry.minYoe != null ? `${entry.minYoe}${entry.maxYoe != null ? `-${entry.maxYoe}` : "+"} Yrs` : "", location: j.location },
      entry,
    });
  }
  if (!queue.length) return { rated: 0, calls: 0, why: "nothing new to rate", dbg };
  if (state.counts.calls >= perDay) return { rated: 0, calls: 0, why: `today's ${perDay} calls are used`, dbg };

  let rated = 0;
  const callsBefore = state.counts.calls;
  const rater = startRater(queue, {
    keys, model: env.GROQ_MODEL || RATE.model, resumes, callsPerDay: perDay, counts: state.counts, ...knobs,
    payFor: (item) => payFigure(item.entry.pay),
    onRated: (item, ai, d) => {
      if (d) dbg.set(item.id, d);
      item.entry.ai = ai;
      item.entry.aiProfile = item.profile;
      item.entry.aiHash = hash[item.profile];
      delete item.entry.jdText;
      rated += 1;
    },
  });
  await rater.drain(DRAIN_MS);
  writeFileSync(statePath, JSON.stringify(state));
  const why = rater.problem ? rater.problem.msg : queue.length ? `${queue.length} left for the next run` : "";
  log(`AI rating: ${rated} rated in ${state.counts.calls - callsBefore} Groq calls${why ? ` (${why})` : ""}`);
  return { rated, calls: state.counts.calls - callsBefore, left: queue.length, why, dbg };
}

