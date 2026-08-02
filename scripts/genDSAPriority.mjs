/* Regenerates src/Data/DSAPrep.js with a frequency-derived P0–P3 priority on
   every problem, and folds in high-frequency problems the original curation
   dropped (it excluded Easy entirely).

   PRIORITY IS DERIVED FROM REAL INTERVIEW-FREQUENCY DATA, NOT GUESSED.
   Source: https://github.com/krishnadey30/LeetCode-Questions-CompanyWise
   — per-company CSVs of LeetCode company tags with a Frequency column, split
   into 6month / 1year / 2year / alltime windows.

   Method:
     1. Keep only companies that appear in this user's own 470-company target
        roster (jobTrackerCompanies.js) — 64 of them are present in the dataset
        — so the ranking reflects where they are actually applying.
     2. Normalise Frequency within each CSV (raw scales differ per company) and
        sum across companies, weighting recent windows higher than all-time:
        6months x3, 1year x2, 2year x1.5, alltime x1.
     3. Multiply by log2(1 + breadth), where breadth = how many target companies
        tag the problem. A problem asked at 30 companies is a safer use of study
        time than one asked intensely at a single company.
     4. Bucket by position in that ranking; P0 additionally requires breadth, so
        a problem that is merely one company's favourite cannot reach P0.

   Usage:
     git clone --depth 1 https://github.com/krishnadey30/LeetCode-Questions-CompanyWise /tmp/lcq
     node scripts/genDSAPriority.mjs /tmp/lcq
*/
import { readFileSync, readdirSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { DSA_TOPICS } from "../src/Data/DSAPrep.js";
import { COMPANIES } from "../src/Data/jobTrackerCompanies.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = (process.argv[2] || "/tmp/lcq").replace(/\/$/, "") + "/";

// ── Problems the original curation missed ───────────────────────────────────
// It dropped every Easy problem, which cut out the most-asked question on the
// entire list (Two Sum, tagged at 35 of the target companies). These are all
// free (non-premium) and all clear the same frequency bar as the rest.
const ADDITIONS = [
  // Arrays / two pointers
  ["two-sum", "Two Sum", "Easy", "Arrays and Two Pointers"],
  ["best-time-to-buy-and-sell-stock", "Best Time to Buy and Sell Stock", "Easy", "Arrays and Two Pointers"],
  ["merge-sorted-array", "Merge Sorted Array", "Easy", "Arrays and Two Pointers"],
  ["move-zeroes", "Move Zeroes", "Easy", "Arrays and Two Pointers"],
  ["squares-of-a-sorted-array", "Squares of a Sorted Array", "Easy", "Arrays and Two Pointers"],
  ["valid-palindrome", "Valid Palindrome", "Easy", "Arrays and Two Pointers"],
  // Strings
  ["valid-anagram", "Valid Anagram", "Easy", "String Algorithms"],
  ["longest-common-prefix", "Longest Common Prefix", "Easy", "String Algorithms"],
  ["reverse-string", "Reverse String", "Easy", "String Algorithms"],
  ["string-compression", "String Compression", "Medium", "String Algorithms"],
  ["roman-to-integer", "Roman to Integer", "Easy", "String Algorithms"],
  ["first-unique-character-in-a-string", "First Unique Character in a String", "Easy", "String Algorithms"],
  ["isomorphic-strings", "Isomorphic Strings", "Easy", "String Algorithms"],
  ["text-justification", "Text Justification", "Hard", "String Algorithms"],
  ["integer-to-english-words", "Integer to English Words", "Hard", "String Algorithms"],
  ["basic-calculator", "Basic Calculator", "Hard", "Stack and Queue"],
  // Linked lists
  ["reverse-linked-list", "Reverse Linked List", "Easy", "Linked Lists"],
  ["merge-two-sorted-lists", "Merge Two Sorted Lists", "Easy", "Linked Lists"],
  ["linked-list-cycle", "Linked List Cycle", "Easy", "Linked Lists"],
  ["intersection-of-two-linked-lists", "Intersection of Two Linked Lists", "Easy", "Linked Lists"],
  ["palindrome-linked-list", "Palindrome Linked List", "Easy", "Linked Lists"],
  ["middle-of-the-linked-list", "Middle of the Linked List", "Easy", "Linked Lists"],
  // Trees
  ["symmetric-tree", "Symmetric Tree", "Easy", "Trees - Basic and Traversal"],
  ["maximum-depth-of-binary-tree", "Maximum Depth of Binary Tree", "Easy", "Trees - Basic and Traversal"],
  ["invert-binary-tree", "Invert Binary Tree", "Easy", "Trees - Basic and Traversal"],
  ["diameter-of-binary-tree", "Diameter of Binary Tree", "Easy", "Trees - Advanced Properties"],
  ["balanced-binary-tree", "Balanced Binary Tree", "Easy", "Trees - Advanced Properties"],
  // Stacks / design
  ["design-hashmap", "Design HashMap", "Easy", "Design and Implementation"],
  ["implement-queue-using-stacks", "Implement Queue using Stacks", "Easy", "Stack and Queue"],
  // Maths / bit
  ["number-of-1-bits", "Number of 1 Bits", "Easy", "Bit Manipulation"],
  ["missing-number", "Missing Number", "Easy", "Bit Manipulation"],
  ["single-number", "Single Number", "Easy", "Bit Manipulation"],
  ["happy-number", "Happy Number", "Easy", "Math & Number Theory"],
  // DP
  ["climbing-stairs", "Climbing Stairs", "Easy", "Dynamic Programming - 1D"],
  // Graphs / hard classics
  ["word-ladder-ii", "Word Ladder II", "Hard", "Graphs - Basic Traversal"],
  ["the-skyline-problem", "The Skyline Problem", "Hard", "Heap and Priority Queue"],
  ["cherry-pickup", "Cherry Pickup", "Hard", "Dynamic Programming - 2D"],
];

// ── Aggregate frequency across the user's target companies ──────────────────
const files = readdirSync(DIR).filter((f) => f.endsWith(".csv"));
if (!files.length) {
  console.error(`No CSVs in ${DIR}. Clone the dataset first (see header).`);
  process.exit(1);
}
const avail = new Set(files.map((f) => f.replace(/_(alltime|6months|1year|2year)\.csv$/, "")));
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");

const targets = new Set();
for (const c of COMPANIES) {
  for (const k of [norm(c.name), norm(c.name.split(" ")[0]), c.id]) {
    if (avail.has(k)) { targets.add(k); break; }
  }
}

const WINDOW_WEIGHT = { "6months": 3, "1year": 2, "2year": 1.5, alltime: 1 };

function parseCsv(text) {
  const rows = [];
  for (const line of text.trim().split("\n").slice(1)) {
    const parts = line.split(",");
    if (parts.length < 6) continue;
    const link = parts[parts.length - 1].trim();
    const freq = parseFloat(parts[parts.length - 2]);
    if (!link || isNaN(freq)) continue;
    rows.push({ slug: link.replace(/\/$/, "").split("/").pop(), freq });
  }
  return rows;
}

const agg = new Map();
for (const company of targets) {
  for (const [win, weight] of Object.entries(WINDOW_WEIGHT)) {
    const f = `${company}_${win}.csv`;
    if (!files.includes(f)) continue;
    const rows = parseCsv(readFileSync(DIR + f, "utf8"));
    if (!rows.length) continue;
    const max = Math.max(...rows.map((r) => r.freq));
    if (!max) continue;
    for (const r of rows) {
      if (!agg.has(r.slug)) agg.set(r.slug, { score: 0, companies: new Set() });
      const e = agg.get(r.slug);
      e.score += (r.freq / max) * weight;
      e.companies.add(company);
    }
  }
}

const ranked = [...agg.entries()]
  .map(([slug, e]) => ({ slug, breadth: e.companies.size, rank: e.score * Math.log2(1 + e.companies.size) }))
  .sort((a, b) => b.rank - a.rank);
const pos = new Map(ranked.map((r, i) => [r.slug, i + 1]));
const breadthOf = new Map(ranked.map((r) => [r.slug, r.breadth]));

// ── Merge additions into the curated topic set ──────────────────────────────
const topics = DSA_TOPICS.map((t) => ({ topic: t.topic, problems: t.problems.map((p) => ({ ...p })) }));
const byTopic = new Map(topics.map((t) => [t.topic, t]));
const seen = new Set(topics.flatMap((t) => t.problems.map((p) => p.id)));

for (const [id, title, difficulty, topic] of ADDITIONS) {
  if (seen.has(id)) { console.warn("already present, skipping:", id); continue; }
  const t = byTopic.get(topic);
  if (!t) { console.error("unknown topic:", topic); process.exit(1); }
  t.problems.push({ id, title, link: `https://leetcode.com/problems/${id}/`, difficulty });
  seen.add(id);
}

// ── Assign P0–P3 ────────────────────────────────────────────────────────────
// Cutoffs are positions in the frequency ranking above. P0 also needs breadth
// so a single company's pet problem can't reach the top bucket.
const P0_MAX_POS = 45, P0_MIN_BREADTH = 11;
const P1_MAX_POS = 150;
const P2_MAX_POS = 400;

function priorityOf(id) {
  const p = pos.get(id);
  if (p === undefined) return "P3";            // never tagged at any target company
  const b = breadthOf.get(id) || 0;
  if (p <= P0_MAX_POS && b >= P0_MIN_BREADTH) return "P0";
  if (p <= P1_MAX_POS) return "P1";
  if (p <= P2_MAX_POS) return "P2";
  return "P3";
}

const counts = { P0: 0, P1: 0, P2: 0, P3: 0 };
for (const t of topics) {
  for (const p of t.problems) {
    p.priority = priorityOf(p.id);
    counts[p.priority] += 1;
  }
  // Highest-priority problems first inside each topic, then by frequency rank.
  const order = { P0: 0, P1: 1, P2: 2, P3: 3 };
  t.problems.sort(
    (a, b) => order[a.priority] - order[b.priority] || (pos.get(a.id) ?? 1e9) - (pos.get(b.id) ?? 1e9)
  );
}

const total = topics.reduce((n, t) => n + t.problems.length, 0);
console.log("target companies used:", targets.size);
console.log("problems:", total, "| added:", ADDITIONS.length);
console.log("priority distribution:", counts);
console.log("\nP0 list:");
topics.flatMap((t) => t.problems.filter((p) => p.priority === "P0").map((p) => ({ ...p, t: t.topic })))
  .sort((a, b) => (pos.get(a.id) ?? 1e9) - (pos.get(b.id) ?? 1e9))
  .forEach((p, i) => console.log(`${String(i + 1).padStart(3)}. ${p.title.slice(0, 46).padEnd(47)} ${p.difficulty.padEnd(6)} breadth=${breadthOf.get(p.id)}`));

// ── Emit ────────────────────────────────────────────────────────────────────
const out = `// Curated interview DSA set — ${total} problems targeting senior-SDE roles.
//
// \`priority\` (P0–P3) is derived from real interview-frequency data, not hand
// waving: per-company LeetCode tag frequencies from
// https://github.com/krishnadey30/LeetCode-Questions-CompanyWise, restricted to
// the ${targets.size} companies from this user's own target roster that the dataset
// covers, normalised per company, weighted toward recent windows, and scaled by
// how many of those companies ask each problem. P0 additionally requires the
// problem to be asked broadly, so one company's favourite can't reach the top.
//
// Regenerate with scripts/genDSAPriority.mjs — edit there, not here.

export const DSA_TOPICS = ${JSON.stringify(topics, null, 2)};

export const DSA_DIFFICULTY_CONFIG = {
  Easy: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800",
  Medium:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800",
  Hard: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800",
};

// Ordered most-important first, so filters and lists can rely on the sequence.
export const DSA_PRIORITIES = ["P0", "P1", "P2", "P3"];

export const DSA_PRIORITY_CONFIG = {
  P0: { label: "P0", blurb: "Asked constantly — do these first", cls: "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30" },
  P1: { label: "P1", blurb: "Very common — expect these", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  P2: { label: "P2", blurb: "Shows up regularly", cls: "bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30" },
  P3: { label: "P3", blurb: "Rounds out topic coverage", cls: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30" },
};

// Flat list (id-keyed) for the Planning page picker and cross-page sync.
export const DSA_PROBLEMS = DSA_TOPICS.flatMap((t) =>
  t.problems.map((p) => ({ ...p, topic: t.topic }))
);

export const DSA_TOTAL = ${total};

export const DSA_PRIORITY_COUNTS = ${JSON.stringify(counts)};
`;

writeFileSync(join(__dirname, "../src/Data/DSAPrep.js"), out);
console.log("\nwrote src/Data/DSAPrep.js");
