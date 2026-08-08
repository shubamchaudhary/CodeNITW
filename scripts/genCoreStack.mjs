/* Regenerates src/Data/CoreStack.js — the Java + Spring Boot topic set behind
   the Core Stack page.

   Two hand-maintained sources, both checked in beside this script:

     scripts/data/javaSpringPrepTracker.csv
       One row per VIDEO: topic id, priority, topic name, source code, channel,
       playlist, playlist URL, position in that playlist, video title, duration.
       This is what the page links out to.

     scripts/data/javaSpringPrepHandoff.md
       One section per TOPIC: the total watch time, whether the topic backs a
       resume claim, and the interview-question chain to attempt cold before
       watching anything.

   Topic ORDER is the CSV's row order (P0-01 → P2-39) and is deliberate — it is
   the sequence the plan is meant to be worked through, so the generator never
   re-sorts.

   YouTube exposes no per-video URL in either source (a playlist page lists
   positions, not ids), so each video gets a title+channel search link. It lands
   on the right video without inventing an id that could rot.

   Run: node scripts/genCoreStack.mjs
*/

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const CSV_PATH = resolve(HERE, "data/javaSpringPrepTracker.csv");
const MD_PATH = resolve(HERE, "data/javaSpringPrepHandoff.md");
const OUT_PATH = resolve(HERE, "../src/Data/CoreStack.js");

// ─── CSV ─────────────────────────────────────────────────────────────────────
// Minimal RFC-4180 reader: quoted fields, doubled quotes, commas inside quotes.
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

// ─── Handoff markdown ────────────────────────────────────────────────────────
// Topic headings come in two shapes:
//   P0/P1 → "### P0-01 · Title"           then "**1h 41m** · ☐ · *Resume: X*"
//   P2    → "### P2-25 · Title — **41m** · ☐"
// Questions are a numbered list for P0/P1 and a single run-on line for P2.
function parseHandoff(text) {
  const out = {};
  const sections = text.split(/^### /m).slice(1);

  for (const section of sections) {
    const lines = section.split("\n");
    const heading = lines[0];
    const idMatch = heading.match(/^(P\d-\d+)\s*·\s*(.+)$/);
    if (!idMatch) continue;
    const id = idMatch[1];

    const body = lines.slice(1).join("\n");
    const durMatch = section.match(/\*\*((?:\d+h\s*)?\d+m)\*\*/);
    const resumeLinked = /Resume:|Directly backs/i.test(section);

    // P0/P1 write one question per line; P2 runs the whole set together on a
    // single line ("1. … 2. … 3. …"), so a lone line gets unpacked below.
    const numbered = body
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => /^\d+\.\s+\S/.test(l));

    const questions =
      numbered.length === 1
        ? splitRunOn(numbered[0])
        : numbered.map((l) => l.replace(/^\d+\.\s+/, "").trim());

    out[id] = {
      duration: durMatch ? durMatch[1].replace(/\s+/g, " ") : "",
      resumeLinked,
      questions: questions.map(stripMd),
    };
  }
  return out;
}

// Unpack "1. first? 2. second? 3. third?" into three questions. Splits only on
// the NEXT expected number, so a "Java 8." or "top 50." inside a question can't
// be mistaken for a list marker.
function splitRunOn(line) {
  const out = [];
  let rest = line.replace(/^1\.\s*/, "");
  let next = 2;
  for (;;) {
    const marker = new RegExp(`\\s${next}\\.\\s`);
    const m = rest.match(marker);
    if (!m) break;
    out.push(rest.slice(0, m.index).trim());
    rest = rest.slice(m.index + m[0].length);
    next++;
  }
  out.push(rest.trim());
  return out.filter(Boolean);
}

// Interview questions are read as plain text in the UI, so strip the inline
// markdown the handoff writes them with (`code`, **bold**, *italic*).
function stripMd(s) {
  return s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(^|[\s(])\*(?!\s)(.+?)\*/g, "$1$2")
    .replace(/`/g, "")
    .replace(/\\\|/g, "|")
    .trim();
}

// ─── Build ───────────────────────────────────────────────────────────────────
const rows = parseCsv(readFileSync(CSV_PATH, "utf8"));
const handoff = parseHandoff(readFileSync(MD_PATH, "utf8"));

function videoSearchUrl(title, channel) {
  // Channel suffix disambiguates near-identical titles across the playlists.
  const channelName = channel.split(" - ")[0];
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} ${channelName}`)}`;
}

function fmtMinutes(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

const byTopic = new Map();
for (const r of rows) {
  const id = r.topic_id;
  if (!byTopic.has(id)) {
    const meta = handoff[id] || {};
    byTopic.set(id, {
      id,
      priority: r.priority,
      title: r.topic,
      section: "Java and Spring Boot",
      duration: meta.duration || "",
      resumeLinked: r.resume_linked === "yes" || !!meta.resumeLinked,
      videos: [],
      questions: meta.questions || [],
    });
  }
  const topic = byTopic.get(id);
  if (r.resume_linked === "yes") topic.resumeLinked = true;
  topic.videos.push({
    id: `${id}-${r.source}-${r.video_position}`,
    source: r.source,
    channel: r.channel,
    playlist: r.playlist,
    playlistUrl: r.playlist_url,
    position: Number(r.video_position),
    title: r.video_title,
    minutes: Number(r.duration_min) || 0,
    videoUrl: videoSearchUrl(r.video_title, r.channel),
  });
}

const topics = [...byTopic.values()].map((t) => {
  const minutes = t.videos.reduce((sum, v) => sum + v.minutes, 0);
  return { ...t, minutes, duration: t.duration || fmtMinutes(minutes) };
});

const priorities = [...new Set(topics.map((t) => t.priority))].sort();
const counts = Object.fromEntries(
  priorities.map((p) => [p, topics.filter((t) => t.priority === p).length])
);

const header = `// Core Stack — the Java + Spring Boot topic set, one card per topic.
//
// GENERATED FILE. Edit scripts/data/javaSpringPrepTracker.csv (videos) or
// scripts/data/javaSpringPrepHandoff.md (durations, resume flags, interview
// questions) and re-run \`node scripts/genCoreStack.mjs\` — do not edit here.
//
// Order is the study order: topics are emitted in the CSV's row order and the
// page never re-sorts them.
//
// \`videoUrl\` is a YouTube search for the video's title + channel rather than a
// watch link: neither source carries per-video ids, and a search that always
// resolves beats a guessed id that rots.

`;

const out =
  header +
  `export const CORE_STACK_SECTION = "Java and Spring Boot";\n\n` +
  `export const CORE_STACK_TOPICS = ${JSON.stringify(topics, null, 2)};\n\n` +
  `export const CORE_STACK_PRIORITIES = ${JSON.stringify(priorities)};\n\n` +
  `export const CORE_STACK_PRIORITY_CONFIG = {
  P0: { label: "P0", blurb: "Asked in ~every loop", cls: "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30" },
  P1: { label: "P1", blurb: "Common, and claimed on the resume", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  P2: { label: "P2", blurb: "Depth differentiator", cls: "bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30" },
  P3: { label: "P3", blurb: "Remedial only", cls: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30" },
};\n\n` +
  `export const CORE_STACK_TOTAL = ${topics.length};\n\n` +
  `export const CORE_STACK_PRIORITY_COUNTS = ${JSON.stringify(counts)};\n\n` +
  `export const CORE_STACK_VIDEO_TOTAL = ${topics.reduce((n, t) => n + t.videos.length, 0)};\n`;

writeFileSync(OUT_PATH, out);

const missingQuestions = topics.filter((t) => t.questions.length === 0).map((t) => t.id);
console.log(
  `Wrote ${OUT_PATH}\n  ${topics.length} topics, ${topics.reduce((n, t) => n + t.videos.length, 0)} videos\n  counts ${JSON.stringify(counts)}` +
    (missingQuestions.length ? `\n  WARNING no questions parsed for: ${missingQuestions.join(", ")}` : "")
);
