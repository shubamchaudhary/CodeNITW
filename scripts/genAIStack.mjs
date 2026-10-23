/* Regenerates src/Data/AIStack.js — the GenAI topic set behind the AI Stack page.

   Three inputs, same split as the Core Stack generator:

     scripts/data/aiStackMap.mjs      the curated map — sections, priorities,
                                      why, resources, new topics. Opinion.
     scripts/data/aiStackVideos.csv   the verified video index: channel, exact
                                      title and runtime of every YouTube video
                                      the map uses (node scripts/verifyAIVideos.mjs).
                                      Fact. A video id the CSV lacks is a HARD
                                      ERROR, so no title or runtime is invented.
     scripts/data/genaiPrepMap.md     the original fifteen topics (A1–D3): title,
                                      depth ceiling, resume flag, questions and
                                      the one written resource each. The map's
                                      entry for the same id adds to it; nothing
                                      is retyped. Part X is the skip list.

   Every topic needs a priority, a "why", at least one video and at least one
   question; topics must be in section order and, within a section, in priority
   order. The build fails otherwise.

   Run: node scripts/genAIStack.mjs
*/

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SECTIONS, TOPICS } from "./data/aiStackMap.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const MD_PATH = resolve(HERE, "data/genaiPrepMap.md");
const CSV_PATH = resolve(HERE, "data/aiStackVideos.csv");
const OUT_PATH = resolve(HERE, "../src/Data/AIStack.js");

const PRIORITIES = ["P0", "P1", "P2", "P3"];

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

// ─── Markdown: the original fifteen topics and the skip list ─────────────────
function stripMd(s) {
  return s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(?!\s)(.+?)\*/g, "$1")
    .replace(/`/g, "")
    .replace(/^["“](.*)["”]$/, "$1")
    .trim();
}

// "pinecone.io/learn/x" → a real URL. A spec may carry an in-site path after an
// arrow ("langchain-ai.github.io/langgraph → Tutorials → RAG"); that part is a
// human instruction, not a URL, so it is kept separately.
function parseLink(spec) {
  const [domainPart, ...rest] = spec.split("→");
  const host = domainPart.trim();
  return {
    url: /^https?:\/\//.test(host) ? host : `https://${host}`,
    path: rest.map((s) => s.trim()).join(" → "),
  };
}

function parseDuration(text) {
  const m = text.match(/~\s*(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?/);
  if (!m) return 0;
  return Number(m[1] || 0) * 60 + Number(m[2] || 0);
}

// Split "Publisher — Resource name" into its two halves. Several resources have
// no publisher prefix ("pgvector README"), which is fine.
function splitResourceTitle(raw) {
  const clean = stripMd(raw.replace(/^📖\s*/, ""));
  const dash = clean.indexOf(" — ");
  if (dash === -1) return { publisher: "", name: clean };
  return { publisher: clean.slice(0, dash).trim(), name: clean.slice(dash + 3).trim() };
}

const md = readFileSync(MD_PATH, "utf8").replace(/\r\n?/g, "\n");

const base = new Map();
let skip = { topics: [], line: "" };

for (const chunk of md.split(/^# PART /m).slice(1)) {
  const heading = chunk.split("\n")[0];
  const letter = heading.trim()[0];

  if (letter === "X") {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    const list = lines.find((l) => l.includes("·"));
    const ifAsked = lines.find((l) => l.startsWith("**If asked:**"));
    skip = {
      topics: list ? stripMd(list).split(" · ").map((s) => s.trim().replace(/\.$/, "")) : [],
      line: ifAsked ? stripMd(ifAsked.replace(/^\*\*If asked:\*\*\s*/, "")) : "",
    };
    continue;
  }

  for (const section of chunk.split(/^### /m).slice(1)) {
    const lines = section.split("\n");
    const idMatch = lines[0].match(/^([A-Z]\d+)\s*·\s*(.+)$/);
    if (!idMatch) continue;

    const topic = {
      id: idMatch[1],
      part: letter,
      title: stripMd(idMatch[2]),
      resource: null,
      minutes: 0,
      flag: "",
      note: "",
      ceiling: { enough: "", tooDeep: "" },
      questions: [],
    };

    for (const raw of lines.slice(1)) {
      const line = raw.trim();
      if (!line) continue;

      // Resource: **📖 Title** (link) — read note · ~30m · ☐
      if (line.startsWith("**📖")) {
        // `\*\*(?!\*)` so a title that ends in italics ("…**Name*** (url)")
        // closes on the bold pair, not on the italic marker before it.
        const m = line.match(/^\*\*📖\s*(.+?)\*\*(?!\*)\s*(.*)$/);
        if (!m) continue;
        const { publisher, name } = splitResourceTitle(m[1]);
        let rest = m[2];
        const linkMatch = rest.match(/^\(([^)]+)\)/);
        const link = linkMatch ? parseLink(linkMatch[1]) : { url: "", path: "" };
        if (linkMatch) rest = rest.slice(linkMatch[0].length);
        const segments = rest.split("·").map((s) => s.trim()).filter(Boolean);
        const durSeg = segments.find((s) => /~|lesson/.test(s)) || "";
        const readSeg = segments.find((s) => s.startsWith("—")) || "";
        topic.minutes = parseDuration(durSeg);
        topic.resource = {
          publisher,
          name,
          url: link.url,
          path: link.path,
          readNote: readSeg ? stripMd(readSeg.replace(/^—\s*/, "")) : "",
        };
        continue;
      }

      // ⚠️ — this topic backs a resume claim and will be probed directly.
      if (line.includes("⚠️")) {
        topic.flag = stripMd(line.replace(/⚠️/g, "")).trim();
        continue;
      }

      // *Resume: …* / a plain italic aside about the resource.
      if (/^\*[^*]/.test(line) && line.endsWith("*")) {
        const text = stripMd(line);
        if (/^Resume:/i.test(text)) topic.flag = topic.flag || text;
        else topic.note = text;
        continue;
      }

      if (line.startsWith("- ✅")) {
        topic.ceiling.enough = stripMd(line.replace(/^- ✅\s*Enough:\s*/, ""));
        continue;
      }
      if (line.startsWith("- ❌")) {
        topic.ceiling.tooDeep = stripMd(line.replace(/^- ❌\s*Too deep:\s*/, ""));
        continue;
      }
      if (/^\d+\.\s+\S/.test(line)) topic.questions.push(stripMd(line.replace(/^\d+\.\s+/, "")));
    }

    base.set(topic.id, topic);
  }
}

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
    return { id, kind: "self", title: s.title, source: s.source || "Your own codebase", minutes: s.minutes || 0, note: s.note || "" };
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
const SECTION_INDEX = new Map(SECTIONS.map((s, i) => [s.key, i]));
const mapIds = new Set();

for (const b of base.values()) {
  if (!TOPICS.some((t) => t.id === b.id)) errors.push(`${b.id}: in genaiPrepMap.md but missing from aiStackMap.mjs`);
}

const topics = [];
let prev = null;

for (const t of TOPICS) {
  if (mapIds.has(t.id)) errors.push(`${t.id}: listed twice in aiStackMap.mjs`);
  mapIds.add(t.id);

  const b = base.get(t.id);
  const sectionKey = b ? b.part : t.section;
  if (!SECTION_INDEX.has(sectionKey)) errors.push(`${t.id}: unknown section "${sectionKey}"`);
  if (!PRIORITIES.includes(t.priority)) errors.push(`${t.id}: priority must be one of ${PRIORITIES.join(", ")}`);
  if (!t.why) errors.push(`${t.id}: needs a why`);

  const title = b ? b.title : t.title;
  const ceiling = b ? b.ceiling : t.ceiling || { enough: "", tooDeep: "" };
  const flag = (b ? b.flag : t.flag) || "";
  const questions = [...(b ? b.questions : t.questions || []), ...(t.extraQuestions || [])].filter(
    (q, i, arr) => arr.findIndex((x) => x.toLowerCase() === q.toLowerCase()) === i
  );
  if (!title) errors.push(`${t.id}: needs a title`);
  if (!ceiling.enough) errors.push(`${t.id}: needs a depth ceiling (enough)`);
  if (!questions.length) errors.push(`${t.id}: no questions`);

  // Mapped resources first (videos lead), then the written resource the
  // markdown gave an original topic.
  const refs = [...(t.resources || [])];
  const resources = refs.map((r, i) => resolveResource(r, t.id, i)).filter(Boolean);
  if (b?.resource) {
    const r = b.resource;
    resources.push({
      id: `${t.id}-r${resources.length + 1}`,
      kind: t.baseKind || "doc",
      title: r.name,
      source: [r.publisher, r.path && `→ ${r.path}`].filter(Boolean).join(" "),
      url: r.url,
      minutes: b.minutes,
      estimate: true,
      note: [r.readNote, b.note].filter(Boolean).join(" — "),
    });
  }
  if (!resources.some((r) => r.kind === "video")) errors.push(`${t.id}: every topic needs at least one video`);

  // Order: sections as listed, then priority within a section.
  const si = SECTION_INDEX.get(sectionKey);
  if (prev) {
    if (si < prev.si) errors.push(`${t.id}: section ${sectionKey} is out of order (after ${prev.id})`);
    else if (si === prev.si && PRIORITIES.indexOf(t.priority) < PRIORITIES.indexOf(prev.priority)) {
      errors.push(`${t.id}: ${t.priority} listed after ${prev.priority} in section ${sectionKey} — sort by priority`);
    }
  }
  prev = { id: t.id, si, priority: t.priority };

  const minutes = resources.reduce((sum, r) => sum + r.minutes, 0);
  // A topic with an untimed or estimated item can only state a floor.
  const approx = resources.some((r) => (!r.minutes && r.kind !== "self") || r.estimate);

  topics.push({
    id: t.id,
    section: sectionKey,
    sectionLabel: SECTIONS.find((s) => s.key === sectionKey)?.label || sectionKey,
    priority: t.priority,
    title,
    why: t.why || "",
    resumeLinked: !!flag,
    flag,
    ceiling,
    resources,
    minutes,
    duration: minutes ? `${approx ? "≈" : ""}${fmtMinutes(minutes)}` : "—",
    questions,
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
// GENERATED FILE. Edit scripts/data/aiStackMap.mjs (what to study and in what
// order), scripts/data/genaiPrepMap.md (the original fifteen topics and the skip
// list) or scripts/data/aiStackVideos.csv (written by scripts/verifyAIVideos.mjs)
// and re-run \`node scripts/genAIStack.mjs\` — do not edit here.
//
// Every video is resolved against the CSV at generation time and the build fails
// on a miss, so no title, channel or runtime on this page is invented. Resources
// with kind "self" have no link on purpose: they are your own code or your own
// memory, and only that answers those questions. Paid courses say so in their
// source line. Topics are ordered by section, then priority.

`;

const out =
  header +
  `export const AI_STACK_SECTIONS = ${JSON.stringify(sections, null, 2)};\n\n` +
  `export const AI_STACK_TOPICS = ${JSON.stringify(topics, null, 2)};\n\n` +
  `export const AI_STACK_SKIP = ${JSON.stringify(skip, null, 2)};\n\n` +
  `export const AI_STACK_PRIORITIES = ${JSON.stringify(PRIORITIES)};\n\n` +
  `export const AI_STACK_PRIORITY_CONFIG = {
  P0: { label: "P0", blurb: "A resume claim you can't fumble — your systems and the concepts under them", cls: "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30" },
  P1: { label: "P1", blurb: "Asked in almost every loop — do before any real interview", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  P2: { label: "P2", blurb: "System design and production — after P0 and P1", cls: "bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30" },
  P3: { label: "P3", blurb: "Differentiators. Skip under time pressure", cls: "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30" },
};\n\n` +
  `export const AI_STACK_TOTAL = ${topics.length};\n\n` +
  `export const AI_STACK_PRIORITY_COUNTS = ${JSON.stringify(priorityCounts)};\n\n` +
  `export const AI_STACK_SECTION_COUNTS = ${JSON.stringify(counts)};\n\n` +
  `export const AI_STACK_MINUTES = ${topics.reduce((n, t) => n + t.minutes, 0)};\n`;

writeFileSync(OUT_PATH, out);

console.log(
  `Wrote ${OUT_PATH}\n` +
    `  ${topics.length} topics · ${topics.reduce((n, t) => n + t.resources.length, 0)} resources ` +
    `(${topics.reduce((n, t) => n + t.resources.filter((r) => r.kind === "video").length, 0)} videos) · ` +
    `${topics.reduce((n, t) => n + t.questions.length, 0)} questions\n` +
    `  priority ${JSON.stringify(priorityCounts)}\n` +
    `  sections ${JSON.stringify(counts)}\n` +
    `  total tracked time ${fmtMinutes(topics.reduce((n, t) => n + t.minutes, 0))}`
);
