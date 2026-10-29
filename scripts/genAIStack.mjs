/* Regenerates src/Data/AIStack.js and src/Data/AIStackAsked.js — the GenAI
   topic set behind the AI Stack page, and the interview drill under each topic.

   Two inputs, same split as the Core Stack generator:

     scripts/data/aiStackMap.mjs      the curated map — sections, priorities,
                                      why, what to know cold, resources and the
                                      interview drill with model answers. Opinion.
     scripts/data/aiStackVideos.csv   the verified video index: channel, exact
                                      title and runtime of every YouTube video
                                      the map uses (node scripts/verifyAIVideos.mjs).
                                      Fact. A video id the CSV lacks is a HARD
                                      ERROR, so no title or runtime is invented.

   Every topic needs a priority, a "why", a depth ceiling, at least three
   things to know, at least one video and at least three drill questions with
   answers; topics must be in section order and, within a section, in priority
   order. The build fails otherwise.

   Run: node scripts/genAIStack.mjs
*/

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SECTIONS, TOPICS } from "./data/aiStackMap.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const CSV_PATH = resolve(HERE, "data/aiStackVideos.csv");
const OUT_PATH = resolve(HERE, "../src/Data/AIStack.js");
const ASKED_PATH = resolve(HERE, "../src/Data/AIStackAsked.js");

const PRIORITIES = ["P0", "P1", "P2", "P3"];
const ID_RE = /^[A-Z]+-\d{2}$/;

// ─── CSV: the verified video index ───────────────────────────────────────────
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f !== "")) rows.push(row);
  const [header, ...body] = rows;
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
}

const VIDEOS = new Map(parseCsv(readFileSync(CSV_PATH, "utf8")).map((r) => [r.video_id, r]));

// ─── Resolve one resource reference ──────────────────────────────────────────
const errors = [];

function resolveResource(ref, topicId, index) {
  const id = `${topicId}-r${index + 1}`;

  if (ref.video) {
    const row = VIDEOS.get(ref.video);
    if (!row) {
      errors.push(`${topicId}: video "${ref.video}" is not in aiStackVideos.csv — run node scripts/verifyAIVideos.mjs`);
      return null;
    }
    return {
      id,
      kind: "video",
      title: row.title,
      source: row.channel,
      url: `https://www.youtube.com/watch?v=${row.video_id}`,
      minutes: Number(row.duration_min) || 0,
      note: ref.note || "",
    };
  }

  if (ref.doc) {
    const d = ref.doc;
    if (!d.url || !d.title) errors.push(`${topicId}: doc ${index + 1} needs a title and url`);
    return { id, kind: "doc", title: d.title, source: d.site || "", url: d.url, minutes: d.minutes || 0, estimate: !!d.estimate, note: d.note || "" };
  }

  if (ref.course) {
    const c = ref.course;
    if (!c.url || !c.title) errors.push(`${topicId}: course ${index + 1} needs a title and url`);
    return {
      id,
      kind: "course",
      title: c.title,
      source: [c.site, c.paid ? "paid" : ""].filter(Boolean).join(" · "),
      url: c.url,
      minutes: c.minutes || 0,
      estimate: !!c.estimate,
      note: c.note || "",
    };
  }

  if (ref.self) {
    const s = ref.self;
    return { id, kind: "self", title: s.title, source: s.source || "Your own work", minutes: s.minutes || 0, note: s.note || "" };
  }

  errors.push(`${topicId}: resource ${index + 1} has no recognised kind`);
  return null;
}

function fmtMinutes(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

// A drill answer is markdown: a string, or an array of lines.
const answerText = (a) => (Array.isArray(a) ? a.join("\n") : a || "").trim();

// ─── Build ───────────────────────────────────────────────────────────────────
const SECTION_INDEX = new Map(SECTIONS.map((s, i) => [s.key, i]));
const seen = new Set();
const topics = [];
const asked = {};
let prev = null;

for (const t of TOPICS) {
  if (!ID_RE.test(t.id || "")) errors.push(`${t.id}: id must look like RAG-01`);
  if (seen.has(t.id)) errors.push(`${t.id}: listed twice in aiStackMap.mjs`);
  seen.add(t.id);

  if (!SECTION_INDEX.has(t.section)) errors.push(`${t.id}: unknown section "${t.section}"`);
  if (!PRIORITIES.includes(t.priority)) errors.push(`${t.id}: priority must be one of ${PRIORITIES.join(", ")}`);
  if (!t.title) errors.push(`${t.id}: needs a title`);
  if (!t.why) errors.push(`${t.id}: needs a why`);
  if (!t.ceiling?.enough) errors.push(`${t.id}: needs a depth ceiling (enough)`);
  if (!Array.isArray(t.know) || t.know.length < 3) errors.push(`${t.id}: needs at least three things to know`);

  const drill = (t.drill || []).map((d, i) => {
    const a = answerText(d.a);
    if (!d.q || !a) errors.push(`${t.id}: drill item ${i + 1} needs q and a`);
    return { q: d.q, a, ...(d.resume ? { resume: true } : {}) };
  });
  if (drill.length < 3) errors.push(`${t.id}: needs at least three drill questions`);
  const dupe = drill.find((d, i) => drill.findIndex((x) => x.q === d.q) !== i);
  if (dupe) errors.push(`${t.id}: drill question listed twice — "${dupe.q}"`);

  const resources = (t.resources || []).map((r, i) => resolveResource(r, t.id, i)).filter(Boolean);
  if (!resources.some((r) => r.kind === "video")) errors.push(`${t.id}: every topic needs at least one video`);

  // Order: sections as listed, then priority within a section.
  const si = SECTION_INDEX.get(t.section);
  if (prev) {
    if (si < prev.si) errors.push(`${t.id}: section ${t.section} is out of order (after ${prev.id})`);
    else if (si === prev.si && PRIORITIES.indexOf(t.priority) < PRIORITIES.indexOf(prev.priority)) {
      errors.push(`${t.id}: ${t.priority} listed after ${prev.priority} in section ${t.section} — sort by priority`);
    }
  }
  prev = { id: t.id, si, priority: t.priority };

  const minutes = resources.reduce((sum, r) => sum + r.minutes, 0);
  // A topic with an untimed or estimated item can only state a floor.
  const approx = resources.some((r) => (!r.minutes && r.kind !== "self") || r.estimate);

  asked[t.id] = { posts: 0, items: drill };
  topics.push({
    id: t.id,
    section: t.section,
    sectionLabel: SECTIONS.find((s) => s.key === t.section)?.label || t.section,
    priority: t.priority,
    title: t.title,
    why: t.why,
    resumeLinked: !!t.flag,
    flag: t.flag || "",
    ceiling: { enough: t.ceiling?.enough || "", tooDeep: t.ceiling?.tooDeep || "" },
    know: t.know || [],
    resources,
    minutes,
    duration: minutes ? `${approx ? "≈" : ""}${fmtMinutes(minutes)}` : "—",
    // The drill's questions, for the planner card; the answers load on demand.
    questions: drill.map((d) => d.q),
    asked: { posts: 0, items: drill.length },
  });
}

if (errors.length) {
  console.error("REFUSING TO WRITE — problems:\n  " + errors.join("\n  "));
  process.exit(1);
}

const sections = SECTIONS.map((s) => ({ key: s.key, label: s.label, chip: s.chip }));
const counts = Object.fromEntries(sections.map((s) => [s.key, topics.filter((t) => t.section === s.key).length]));
const priorityCounts = Object.fromEntries(PRIORITIES.map((p) => [p, topics.filter((t) => t.priority === p).length]));

const header = `// AI Stack — the GenAI topic set, one card per topic.
//
// GENERATED FILE. Edit scripts/data/aiStackMap.mjs (what to study, in what
// order, and the interview drill) or scripts/data/aiStackVideos.csv (written by
// scripts/verifyAIVideos.mjs) and re-run \`node scripts/genAIStack.mjs\` — do not
// edit here.
//
// Every video is resolved against the CSV at generation time and the build fails
// on a miss, so no title, channel or runtime on this page is invented. Resources
// with kind "self" have no link on purpose: they are your own work or memory.
// Paid courses say so in their source line. Topics are ordered by section, then
// priority. The drill answers live in AIStackAsked.js, loaded on demand.

`;

writeFileSync(
  OUT_PATH,
  header +
    `export const AI_STACK_SECTIONS = ${JSON.stringify(sections, null, 2)};\n\n` +
    `export const AI_STACK_TOPICS = ${JSON.stringify(topics, null, 2)};\n\n` +
    `export const AI_STACK_PRIORITIES = ${JSON.stringify(PRIORITIES)};\n\n` +
    `export const AI_STACK_PRIORITY_CONFIG = {
  P0: { label: "P0", blurb: "Asked in nearly every AI loop, or stands behind a resume claim", cls: "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30" },
  P1: { label: "P1", blurb: "Asked often — do before any real interview", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  P2: { label: "P2", blurb: "Design rounds and depth — after P0 and P1", cls: "bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30" },
  P3: { label: "P3", blurb: "Differentiators. Skip under time pressure", cls: "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30" },
};\n\n` +
    `export const AI_STACK_TOTAL = ${topics.length};\n\n` +
    `export const AI_STACK_PRIORITY_COUNTS = ${JSON.stringify(priorityCounts)};\n\n` +
    `export const AI_STACK_SECTION_COUNTS = ${JSON.stringify(counts)};\n\n` +
    `export const AI_STACK_MINUTES = ${topics.reduce((n, t) => n + t.minutes, 0)};\n`
);

// The drill shares the asked-questions footer with Core Stack and Kafka, so it
// carries its own wording: these are model answers, not counted interview reports.
const askedMeta = {
  eyebrow: "Interview drill",
  heading: "Say it out loud, then open the answer",
  blurb: "Model answers at the depth a 2-year AI engineer loop expects. Answer each one aloud first; the ones marked “From your resume” are follow-ups your own resume invites.",
  footer: "Written from the sources in this topic's reading list and the current LangChain and LangGraph docs (checked 2026-10-30). Numbers quoted from a source are that source's; check the provider's current docs before quoting API details.",
  counts: false,
};

writeFileSync(
  ASKED_PATH,
  `// AI Stack — the interview drill: per topic, questions with model answers,
// shown fixed under the topic's note. GENERATED by scripts/genAIStack.mjs from
// scripts/data/aiStackMap.mjs — do not edit here.
// Each item: q, a (markdown), resume (a follow-up the resume invites).

export const AI_STACK_ASKED_META = ${JSON.stringify(askedMeta, null, 2)};

export const AI_STACK_ASKED = ${JSON.stringify(asked, null, 2)};
`
);

const drillCount = topics.reduce((n, t) => n + t.asked.items, 0);
console.log(
  `Wrote ${OUT_PATH}\n  and ${ASKED_PATH}\n` +
    `  ${topics.length} topics · ${topics.reduce((n, t) => n + t.resources.length, 0)} resources ` +
    `(${topics.reduce((n, t) => n + t.resources.filter((r) => r.kind === "video").length, 0)} videos) · ` +
    `${drillCount} drill questions with answers\n` +
    `  priority ${JSON.stringify(priorityCounts)}\n` +
    `  sections ${JSON.stringify(counts)}\n` +
    `  total tracked time ${fmtMinutes(topics.reduce((n, t) => n + t.minutes, 0))}`
);
