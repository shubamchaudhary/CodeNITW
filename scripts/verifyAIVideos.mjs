/* Fetches the facts about every YouTube video the AI Stack map uses and writes
   them to scripts/data/aiStackVideos.csv: channel, exact title and runtime, as
   YouTube reports them. The map says WHICH videos to watch (opinion); this file
   says what they are called and how long they run (fact). genAIStack.mjs reads
   the CSV and refuses to build when a map id is missing from it, so a typo'd id
   or a deleted video can never reach the page.

   Only ids not already in the CSV are fetched. `--refresh` re-fetches all of
   them (run it now and then: videos get removed and retitled).

   Uses YouTube's public oEmbed endpoint for title and channel, and the watch
   page's lengthSeconds for the runtime. A video that fails either is reported
   and the script exits 1.

   Run: node scripts/verifyAIVideos.mjs [--refresh]
*/

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { TOPICS } from "./data/aiStackMap.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const CSV_PATH = resolve(HERE, "data/aiStackVideos.csv");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const HEADER = ["video_id", "channel", "title", "duration_min", "verified_on"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const quote = (s) => (/[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

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

async function fetchVideo(id) {
  const o = await fetch(`https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${id}`);
  if (!o.ok) throw new Error(`oEmbed ${o.status}`);
  const meta = await o.json();

  const page = await (await fetch(`https://www.youtube.com/watch?v=${id}&hl=en`, { headers: { "user-agent": UA } })).text();
  const seconds = Number((page.match(/"lengthSeconds":"(\d+)"/) || [])[1]);
  const status = (page.match(/"playabilityStatus":\{"status":"([A-Z_]+)"/) || [])[1];
  if (status && status !== "OK") throw new Error(`playability ${status}`);
  if (!seconds) throw new Error("no runtime on the watch page");

  return { video_id: id, channel: meta.author_name, title: meta.title, duration_min: String(Math.max(1, Math.round(seconds / 60))) };
}

const wanted = [
  ...new Set(
    TOPICS.flatMap((t) => (t.resources || []).map((r) => r.video).filter(Boolean))
  ),
];

const have = new Map(existsSync(CSV_PATH) ? parseCsv(readFileSync(CSV_PATH, "utf8")).map((r) => [r.video_id, r]) : []);
const refresh = process.argv.includes("--refresh");
const todo = wanted.filter((id) => refresh || !have.has(id));

const failures = [];
const today = new Date().toISOString().slice(0, 10);
for (const id of todo) {
  let result = null;
  for (let attempt = 0; attempt < 3 && !result; attempt++) {
    try {
      result = { ...(await fetchVideo(id)), verified_on: today };
    } catch (e) {
      if (attempt === 2) failures.push(`${id}: ${e.message}`);
      else await sleep(1500 * (attempt + 1));
    }
  }
  if (result) {
    have.set(id, result);
    console.log(`ok   ${id}  ${result.duration_min}m  ${result.channel} — ${result.title}`);
  }
  await sleep(350);
}

// Keep only ids the map still uses, in map order, so the CSV never goes stale.
const rows = wanted.filter((id) => have.has(id)).map((id) => have.get(id));
writeFileSync(
  CSV_PATH,
  [HEADER.join(","), ...rows.map((r) => HEADER.map((h) => quote(r[h] ?? "")).join(","))].join("\n") + "\n"
);

console.log(`\n${rows.length}/${wanted.length} videos in ${CSV_PATH}`);
if (failures.length) {
  console.error("FAILED:\n  " + failures.join("\n  "));
  process.exit(1);
}
