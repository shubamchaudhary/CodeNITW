/* Regenerates src/Data/CoreStack.js from three inputs:

     scripts/data/coreStackMap.mjs        the curated map — sections, topics,
                                          priorities, resource refs, questions.
     scripts/data/javaSpringPrepTracker.csv
                                          the verified video index: channel,
                                          playlist, playlist URL, position,
                                          title and duration for every video the
                                          original plan used.
     scripts/data/javaSpringPrepHandoff.md
                                          the original per-topic question sets,
                                          inherited by id so nothing is retyped.

   The point of the split: the map is opinion (what to study, in what order),
   the CSV is fact (what a video is called and how long it runs). A `csv:` ref
   that does not resolve is a HARD ERROR — that is what stops a made-up video
   title or playlist position from ever reaching the page.

   Run: node scripts/genCoreStack.mjs
*/

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SECTIONS, TOPICS } from "./data/coreStackMap.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const CSV_PATH = resolve(HERE, "data/javaSpringPrepTracker.csv");
const MD_PATH = resolve(HERE, "data/javaSpringPrepHandoff.md");
const OUT_PATH = resolve(HERE, "../src/Data/CoreStack.js");

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

const csvRows = parseCsv(readFileSync(CSV_PATH, "utf8"));

// source#position → the row describing that video
const VIDEO_INDEX = new Map();
// source → playlist metadata, so a playlist-only reference still resolves
const PLAYLIST_INDEX = new Map();
for (const r of csvRows) {
  VIDEO_INDEX.set(`${r.source}#${r.video_position}`, r);
  if (!PLAYLIST_INDEX.has(r.source)) {
    PLAYLIST_INDEX.set(r.source, {
      channel: r.channel,
      playlist: r.playlist,
      playlistUrl: r.playlist_url,
    });
  }
}

// ─── Handoff markdown: the inherited question sets ───────────────────────────
function stripMd(s) {
  return s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(^|[\s(])\*(?!\s)(.+?)\*/g, "$1$2")
    .replace(/`/g, "")
    .replace(/\\\|/g, "|")
    .trim();
}

// "1. a? 2. b? 3. c?" on one line → three questions. Splits only on the NEXT
// expected number so "Java 8." inside a question is not mistaken for a marker.
function splitRunOn(line) {
  const out = [];
  let rest = line.replace(/^1\.\s*/, "");
  let next = 2;
  for (;;) {
    const m = rest.match(new RegExp(`\\s${next}\\.\\s`));
    if (!m) break;
    out.push(rest.slice(0, m.index).trim());
    rest = rest.slice(m.index + m[0].length);
    next++;
  }
  out.push(rest.trim());
  return out.filter(Boolean);
}

function parseHandoff(text) {
  const out = {};
  for (const section of text.split(/^### /m).slice(1)) {
    const lines = section.split("\n");
    const idMatch = lines[0].match(/^(P\d-\d+)\s*·\s*(.+)$/);
    if (!idMatch) continue;

    const numbered = section
      .split("\n")
      .slice(1)
      .map((l) => l.trim())
      .filter((l) => /^\d+\.\s+\S/.test(l));

    out[idMatch[1]] = (numbered.length === 1
      ? splitRunOn(numbered[0])
      : numbered.map((l) => l.replace(/^\d+\.\s+/, "").trim())
    ).map(stripMd);
  }
  return out;
}

const HANDOFF = parseHandoff(readFileSync(MD_PATH, "utf8"));

// ─── Resolve one resource reference ──────────────────────────────────────────
const errors = [];

function resolveResource(ref, topicId, index) {
  const id = `${topicId}-r${index + 1}`;

  if (ref.csv) {
    const row = VIDEO_INDEX.get(ref.csv);
    if (!row) {
      errors.push(`${topicId}: csv ref "${ref.csv}" is not in javaSpringPrepTracker.csv`);
      return null;
    }
    return {
      id,
      kind: "video",
      title: row.video_title,
      source: row.channel,
      playlist: row.playlist,
      playlistUrl: row.playlist_url,
      position: Number(row.video_position),
      minutes: Number(row.duration_min) || 0,
    };
  }

  if (ref.playlist) {
    const [source, position] = ref.playlist.split("#");
    const meta = PLAYLIST_INDEX.get(source);
    if (!meta) {
      errors.push(`${topicId}: playlist ref "${ref.playlist}" — unknown source "${source}"`);
      return null;
    }
    if (!ref.title) {
      errors.push(`${topicId}: playlist ref "${ref.playlist}" needs an explicit title`);
      return null;
    }
    return {
      id,
      kind: "video",
      title: ref.title,
      source: meta.channel,
      playlist: meta.playlist,
      playlistUrl: meta.playlistUrl,
      position: Number(position),
      // Duration was never tracked for these; the UI omits a runtime rather
      // than printing a guess.
      minutes: 0,
    };
  }

  if (ref.video) {
    const v = ref.video;
    return {
      id,
      kind: "video",
      title: v.title,
      source: v.channel,
      url: v.url,
      minutes: v.minutes || 0,
      note: v.note || "",
    };
  }

  if (ref.doc) {
    const d = ref.doc;
    return {
      id,
      kind: "doc",
      title: d.title,
      source: d.site,
      url: d.url,
      minutes: d.minutes || 0,
      note: d.note || "",
    };
  }

  if (ref.self) {
    return {
      id,
      kind: "self",
      title: ref.self.title,
      source: "Your own codebase",
      minutes: ref.self.minutes || 0,
      note: ref.self.note || "",
    };
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

// ─── Build ───────────────────────────────────────────────────────────────────
const SECTION_KEYS = new Set(SECTIONS.map((s) => s.key));

const topics = TOPICS.map((t) => {
  if (!SECTION_KEYS.has(t.section)) errors.push(`${t.id}: unknown section "${t.section}"`);

  const resources = t.resources.map((r, i) => resolveResource(r, t.id, i)).filter(Boolean);

  const inherited = [];
  for (const key of [t.inherit, t.extraInherit].filter(Boolean)) {
    if (!HANDOFF[key]) errors.push(`${t.id}: inherit "${key}" not found in the handoff map`);
    else inherited.push(...HANDOFF[key]);
  }

  // De-duplicate: a merged topic can inherit the same question from two sets.
  const questions = [...inherited, ...(t.questions || [])].filter(
    (q, i, arr) => arr.findIndex((x) => x.toLowerCase() === q.toLowerCase()) === i
  );
  if (!questions.length) errors.push(`${t.id}: no questions`);

  const minutes = resources.reduce((sum, r) => sum + r.minutes, 0);
  // A topic whose resources include an untimed item can only state a floor.
  const approx = resources.some((r) => !r.minutes && r.kind !== "self");

  return {
    id: t.id,
    section: t.section,
    sectionLabel: SECTIONS.find((s) => s.key === t.section)?.label || t.section,
    priority: t.priority,
    title: t.title,
    why: t.why || "",
    resources,
    minutes,
    duration: minutes ? `${fmtMinutes(minutes)}${approx ? "+" : ""}` : "—",
    questions,
  };
});

if (errors.length) {
  console.error("REFUSING TO WRITE — unresolved references:\n  " + errors.join("\n  "));
  process.exit(1);
}

const priorities = [...new Set(topics.map((t) => t.priority))].sort();
const counts = Object.fromEntries(priorities.map((p) => [p, topics.filter((t) => t.priority === p).length]));
const sectionCounts = Object.fromEntries(
  SECTIONS.map((s) => [s.key, topics.filter((t) => t.section === s.key).length])
);

const header = `// Core Stack — Java, Spring Boot and the non-AI stack from the resume.
//
// GENERATED FILE. Edit scripts/data/coreStackMap.mjs (what to study and in what
// order) or scripts/data/javaSpringPrepTracker.csv (video titles and runtimes)
// and re-run \`node scripts/genCoreStack.mjs\` — do not edit here.
//
// Every video reference is resolved against the CSV index at generation time
// and the build fails on a miss, so no title, playlist position or runtime on
// this page is invented. Resources with kind "self" have no link on purpose:
// they are your own systems, and only your codebase answers those questions.

`;

const out =
  header +
  `export const CORE_STACK_SECTIONS = ${JSON.stringify(SECTIONS, null, 2)};\n\n` +
  `export const CORE_STACK_TOPICS = ${JSON.stringify(topics, null, 2)};\n\n` +
  `export const CORE_STACK_PRIORITIES = ${JSON.stringify(priorities)};\n\n` +
  `export const CORE_STACK_PRIORITY_CONFIG = {
  P0: { label: "P0", blurb: "Asked in nearly every loop, or a resume claim you can't fumble", cls: "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30" },
  P1: { label: "P1", blurb: "Very likely — do before any real interview", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  P2: { label: "P2", blurb: "Depth. Skip under time pressure", cls: "bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30" },
};\n\n` +
  `export const CORE_STACK_TOTAL = ${topics.length};\n\n` +
  `export const CORE_STACK_PRIORITY_COUNTS = ${JSON.stringify(counts)};\n\n` +
  `export const CORE_STACK_SECTION_COUNTS = ${JSON.stringify(sectionCounts)};\n\n` +
  `export const CORE_STACK_MINUTES = ${topics.reduce((n, t) => n + t.minutes, 0)};\n`;

writeFileSync(OUT_PATH, out);

console.log(
  `Wrote ${OUT_PATH}\n` +
    `  ${topics.length} topics · ${topics.reduce((n, t) => n + t.resources.length, 0)} resources · ` +
    `${topics.reduce((n, t) => n + t.questions.length, 0)} questions\n` +
    `  priority ${JSON.stringify(counts)}\n` +
    `  sections ${JSON.stringify(sectionCounts)}\n` +
    `  total tracked time ${fmtMinutes(topics.reduce((n, t) => n + t.minutes, 0))}`
);
