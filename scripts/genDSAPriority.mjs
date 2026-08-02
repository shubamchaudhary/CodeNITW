/* Regenerates src/Data/DSAPrep.js with a frequency-derived P0–P3 priority on
   every problem, and folds in high-frequency problems the original curation
   dropped (it excluded Easy entirely).

   PRIORITY IS DERIVED FROM DATA, NOT GUESSED. It blends two signals.

   SIGNAL 1 — how often a problem is actually asked.
   Source: https://github.com/krishnadey30/LeetCode-Questions-CompanyWise
   — per-company CSVs of LeetCode company tags with a Frequency column, split
   into 6month / 1year / 2year / alltime windows. ALL companies in the dataset
   are used (every one of them is an SDE employer that runs DSA interviews),
   not just the ones on this user's target roster.
     1. Normalise Frequency within each CSV (raw scales differ per company) and
        sum across companies, weighting recent windows higher than all-time:
        6months x3, 1year x2, 2year x1.5, alltime x1.
     2. Multiply by log2(1 + breadth), where breadth = how many companies tag
        the problem. A problem asked at 60 companies is a safer use of study
        time than one asked intensely at a single company.
     3. Bucket by position in that ranking; the top bucket additionally requires
        breadth, so one company's favourite cannot reach it on intensity alone.

   SIGNAL 2 — whether the problem IS a topic in its own right.
   Source: scripts/data/patternLists.json (Blind 75 + NeetCode 150, both curated
   for pattern coverage — each entry is the canonical representative of a
   technique, which is why the lists are small). Solving one of these teaches a
   whole pattern, so membership sets a FLOOR on its bucket:
     • Blind 75      → never ranked below P1.
     • NeetCode 150  → never ranked below P2.
   It is a floor and not a promotion on purpose: P0 stays strictly "asked
   constantly", which is what makes it trustworthy as a do-these-first list,
   while a pattern anchor that is rarely asked still can't sink out of sight.
   Each such problem also carries its pattern name (e.g. "Sliding Window") so
   the UI can show what technique it teaches.

   Usage:
     git clone --depth 1 https://github.com/krishnadey30/LeetCode-Questions-CompanyWise /tmp/lcq
     node scripts/genDSAPriority.mjs /tmp/lcq
*/
import { readFileSync, readdirSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { DSA_TOPICS } from "../src/Data/DSAPrep.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = (process.argv[2] || "/tmp/lcq").replace(/\/$/, "") + "/";

const PATTERNS = JSON.parse(readFileSync(join(__dirname, "data/patternLists.json"), "utf8"));
const alias = (s) => PATTERNS.aliases[s] || s;
const BLIND75 = new Set(PATTERNS.blind75.map(alias));
const NC150 = new Map(PATTERNS.neetcode150.map((p) => [alias(p.slug), p.pattern]));

// ── Problems the original curation missed ───────────────────────────────────
// It dropped every Easy problem, which cut out the most-asked question on the
// entire list (Two Sum, tagged at 72 of the 200 companies), and it predated the
// pattern lists so it was missing several technique anchors. All non-premium.
// Re-running is safe: anything already present is skipped.
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

  // ── Pattern anchors from Blind 75 / NeetCode 150 that were still absent ──
  // Each of these is the canonical representative of a technique, so the set
  // now covers every pattern those lists cover. (Three further entries —
  // Encode and Decode Strings, Meeting Rooms, Walls and Gates — are LeetCode
  // Premium and their patterns are already covered here by Meeting Rooms II
  // and Rotting Oranges, so they are deliberately left out.)
  ["contains-duplicate", "Contains Duplicate", "Easy", "Arrays and Two Pointers"],
  ["two-sum-ii-input-array-is-sorted", "Two Sum II - Input Array Is Sorted", "Medium", "Arrays and Two Pointers"],
  ["plus-one", "Plus One", "Easy", "Math & Number Theory"],
  ["reverse-integer", "Reverse Integer", "Medium", "Math & Number Theory"],
  ["detect-squares", "Detect Squares", "Medium", "Design and Implementation"],
  ["car-fleet", "Car Fleet", "Medium", "Stack and Queue"],
  ["binary-search", "Binary Search", "Easy", "Binary Search"],
  ["same-tree", "Same Tree", "Easy", "Trees - Basic and Traversal"],
  ["subtree-of-another-tree", "Subtree of Another Tree", "Easy", "Trees - Advanced Properties"],
  ["count-good-nodes-in-binary-tree", "Count Good Nodes in Binary Tree", "Medium", "Trees - Advanced Properties"],
  ["kth-largest-element-in-a-stream", "Kth Largest Element in a Stream", "Easy", "Heap and Priority Queue"],
  ["last-stone-weight", "Last Stone Weight", "Easy", "Heap and Priority Queue"],
  ["min-cost-climbing-stairs", "Min Cost Climbing Stairs", "Easy", "Dynamic Programming - 1D"],
  ["coin-change-ii", "Coin Change II", "Medium", "Dynamic Programming - 2D"],
  ["combination-sum-iv", "Combination Sum IV", "Medium", "Dynamic Programming - 1D"],
  ["hand-of-straights", "Hand of Straights", "Medium", "Greedy & Intervals"],
  ["merge-triplets-to-form-target-triplet", "Merge Triplets to Form Target Triplet", "Medium", "Greedy & Intervals"],
  ["valid-parenthesis-string", "Valid Parenthesis String", "Medium", "Greedy & Intervals"],
  ["minimum-interval-to-include-each-query", "Minimum Interval to Include Each Query", "Hard", "Greedy & Intervals"],
  ["counting-bits", "Counting Bits", "Easy", "Bit Manipulation"],
  ["reverse-bits", "Reverse Bits", "Easy", "Bit Manipulation"],
];

// ── Aggregate frequency across the user's target companies ──────────────────
const files = readdirSync(DIR).filter((f) => f.endsWith(".csv"));
if (!files.length) {
  console.error(`No CSVs in ${DIR}. Clone the dataset first (see header).`);
  process.exit(1);
}
// Every company in the dataset — they are all SDE employers running DSA
// interviews, so restricting to one roster only threw away signal.
const targets = new Set(files.map((f) => f.replace(/_(alltime|6months|1year|2year)\.csv$/, "")));

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
// Frequency decides the base bucket; being a pattern anchor then promotes it.
const P0_MAX_POS = 55, P0_MIN_BREADTH = 22;
const P1_MAX_POS = 190;
const P2_MAX_POS = 600;

function freqTier(id) {
  const p = pos.get(id);
  if (p === undefined) return 3;               // never tagged at any company
  const b = breadthOf.get(id) || 0;
  if (p <= P0_MAX_POS && b >= P0_MIN_BREADTH) return 0;
  if (p <= P1_MAX_POS) return 1;
  if (p <= P2_MAX_POS) return 2;
  return 3;
}

// A problem that IS a technique is worth doing even when it isn't asked often,
// so being a pattern anchor sets a FLOOR on its bucket — it can't sink out of
// sight. It is deliberately not a promotion: P0 stays "asked constantly", which
// is what makes that bucket worth trusting as a do-these-first list.
function priorityOf(id) {
  const t = freqTier(id);
  if (BLIND75.has(id)) return `P${Math.min(t, 1)}`;   // never below P1
  if (NC150.has(id)) return `P${Math.min(t, 2)}`;     // never below P2
  return `P${t}`;
}

const counts = { P0: 0, P1: 0, P2: 0, P3: 0 };
let anchors = 0;
for (const t of topics) {
  for (const p of t.problems) {
    p.priority = priorityOf(p.id);
    // What technique this problem teaches, when it is a recognised anchor.
    const pattern = NC150.get(p.id);
    if (pattern) p.pattern = pattern;
    if (BLIND75.has(p.id)) p.core = true;      // the minimal pattern-covering set
    if (pattern || p.core) anchors += 1;
    counts[p.priority] += 1;
  }
  // Highest-priority problems first inside each topic, then by frequency rank.
  const order = { P0: 0, P1: 1, P2: 2, P3: 3 };
  t.problems.sort(
    (a, b) => order[a.priority] - order[b.priority] || (pos.get(a.id) ?? 1e9) - (pos.get(b.id) ?? 1e9)
  );
}

const total = topics.reduce((n, t) => n + t.problems.length, 0);
console.log("companies used:", targets.size);
console.log("problems:", total, "| pattern anchors:", anchors);
console.log("priority distribution:", counts);
console.log("\nP0 list:");
topics.flatMap((t) => t.problems.filter((p) => p.priority === "P0").map((p) => ({ ...p, t: t.topic })))
  .sort((a, b) => (pos.get(a.id) ?? 1e9) - (pos.get(b.id) ?? 1e9))
  .forEach((p, i) => console.log(`${String(i + 1).padStart(3)}. ${p.title.slice(0, 46).padEnd(47)} ${p.difficulty.padEnd(6)} breadth=${breadthOf.get(p.id)}`));

// ── Emit ────────────────────────────────────────────────────────────────────
const out = `// Curated interview DSA set — ${total} problems targeting senior-SDE roles.
//
// \`priority\` (P0–P3) blends two measured signals, not judgement:
//
//   1. HOW OFTEN IT IS ASKED. Per-company LeetCode tag frequencies from
//      https://github.com/krishnadey30/LeetCode-Questions-CompanyWise across all
//      ${targets.size} companies in that dataset, normalised per company, weighted toward
//      recent windows, and scaled by how many companies ask it. The top bucket
//      also requires breadth, so one company's favourite can't reach it alone.
//
//   2. WHETHER IT IS A TOPIC IN ITSELF. Blind 75 and NeetCode 150 are curated
//      for pattern coverage — each entry is the canonical representative of a
//      technique. Membership promotes a problem a bucket and floors it (Blind 75
//      never below P1, NeetCode 150 never below P2), because solving one teaches
//      a whole pattern even if it is asked less often.
//
// \`pattern\` names the technique a problem teaches; \`core\` marks the Blind 75
// minimal pattern-covering set.
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
