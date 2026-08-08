/* Regenerates src/Data/AIStack.js — the GenAI topic set behind the AI Stack page.

   Source: scripts/data/genaiPrepMap.md, one section per topic, grouped into
   parts (A RAG, B LangChain/LangGraph, C evaluation, D production). Unlike the
   Core Stack tracker there is exactly ONE resource per topic — that is the
   map's central rule — plus a depth ceiling saying where to stop reading, and
   the interview questions for that topic.

   Part E is the explicit skip list; it becomes a single note on the page rather
   than cards, since there is nothing to study there.

   Run: node scripts/genAIStack.mjs
*/

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const MD_PATH = resolve(HERE, "data/genaiPrepMap.md");
const OUT_PATH = resolve(HERE, "../src/Data/AIStack.js");

// Short chip labels for the filter row — the part headings are too long for it.
const PART_CHIPS = {
  A: "RAG",
  B: "LangGraph",
  C: "Evals",
  D: "Production",
};

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
  if (!m) return { duration: "", minutes: 0 };
  const h = Number(m[1] || 0);
  const min = Number(m[2] || 0);
  return { duration: text.trim(), minutes: h * 60 + min };
}

// Split "Publisher — Resource name" into its two halves. Several resources have
// no publisher prefix ("pgvector README"), which is fine.
function splitResourceTitle(raw) {
  const clean = stripMd(raw.replace(/^📖\s*/, ""));
  const dash = clean.indexOf(" — ");
  if (dash === -1) return { publisher: "", name: clean };
  return { publisher: clean.slice(0, dash).trim(), name: clean.slice(dash + 3).trim() };
}

const md = readFileSync(MD_PATH, "utf8");

const topics = [];
const sections = [];
let skip = null;

for (const chunk of md.split(/^# PART /m).slice(1)) {
  const heading = chunk.split("\n")[0];
  const letter = heading.trim()[0];

  if (letter === "E") {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    const list = lines.find((l) => l.includes("·"));
    const ifAsked = lines.find((l) => l.startsWith("**If asked:**"));
    skip = {
      topics: list ? stripMd(list).split(" · ").map((s) => s.trim()) : [],
      line: ifAsked ? stripMd(ifAsked.replace(/^\*\*If asked:\*\*\s*/, "")) : "",
    };
    continue;
  }

  const label = stripMd(heading.replace(/^[A-Z]\s*—\s*/, "").replace(/\s*\(~[^)]*\)\s*$/, ""));
  sections.push({ key: letter, label, chip: PART_CHIPS[letter] || letter });

  for (const section of chunk.split(/^### /m).slice(1)) {
    const lines = section.split("\n");
    const idMatch = lines[0].match(/^([A-Z]\d+)\s*·\s*(.+)$/);
    if (!idMatch) continue;

    const topic = {
      id: idMatch[1],
      part: letter,
      section: label,
      title: stripMd(idMatch[2]),
      resource: null,
      duration: "",
      minutes: 0,
      resumeLinked: false,
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
        const { duration, minutes } = parseDuration(durSeg);

        topic.resource = {
          publisher,
          name,
          url: link.url,
          path: link.path,
          readNote: readSeg ? stripMd(readSeg.replace(/^—\s*/, "")) : "",
        };
        topic.duration = duration || durSeg;
        topic.minutes = minutes;
        continue;
      }

      // ⚠️ — this topic backs a resume claim and will be probed directly.
      if (line.includes("⚠️")) {
        topic.resumeLinked = true;
        topic.flag = stripMd(line.replace(/⚠️/g, "")).trim();
        continue;
      }

      // *Resume: …* / a plain italic aside about the resource.
      if (/^\*[^*]/.test(line) && line.endsWith("*")) {
        const text = stripMd(line);
        if (/^Resume:/i.test(text)) {
          topic.resumeLinked = true;
          topic.flag = topic.flag || text;
        } else {
          topic.note = text;
        }
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

      if (/^\d+\.\s+\S/.test(line)) {
        topic.questions.push(stripMd(line.replace(/^\d+\.\s+/, "")));
      }
    }

    topics.push(topic);
  }
}

const counts = Object.fromEntries(
  sections.map((s) => [s.key, topics.filter((t) => t.part === s.key).length])
);

const header = `// AI Stack — the GenAI topic set, one card per topic.
//
// GENERATED FILE. Edit scripts/data/genaiPrepMap.md and re-run
// \`node scripts/genAIStack.mjs\` — do not edit here.
//
// One resource per topic, by design: the map's first rule is that if a resource
// isn't listed, it isn't read. Each topic also carries a depth ceiling — what is
// enough, and where going deeper stops paying — and the questions to attempt
// before opening the resource.
//
// \`resource.path\` is an in-site route ("Tutorials → RAG") for docs whose deep
// links move; the URL points at the stable entry page and the path says where to
// go from there.

`;

const out =
  header +
  `export const AI_STACK_SECTIONS = ${JSON.stringify(sections, null, 2)};\n\n` +
  `export const AI_STACK_TOPICS = ${JSON.stringify(topics, null, 2)};\n\n` +
  `export const AI_STACK_SKIP = ${JSON.stringify(skip, null, 2)};\n\n` +
  `export const AI_STACK_TOTAL = ${topics.length};\n\n` +
  `export const AI_STACK_SECTION_COUNTS = ${JSON.stringify(counts)};\n\n` +
  `export const AI_STACK_MINUTES = ${topics.reduce((n, t) => n + t.minutes, 0)};\n`;

writeFileSync(OUT_PATH, out);

const problems = topics.filter(
  (t) => !t.resource?.url || !t.questions.length || !t.ceiling.enough || !t.minutes
);
console.log(
  `Wrote ${OUT_PATH}\n  ${topics.length} topics across ${sections.length} parts, ${topics.reduce((n, t) => n + t.minutes, 0)} min\n  counts ${JSON.stringify(counts)}` +
    (problems.length ? `\n  WARNING incomplete: ${problems.map((t) => t.id).join(", ")}` : "")
);
