/* Regenerates src/Data/DSAPrep.js: which problems are in the set, a P0–P3
   priority and a 0–100 `importance` on each, and an easy→hard `level` the
   question picker (src/Data/dsaPicker.js) uses to walk a topic in order.

   PRIORITY IS DERIVED FROM DATA, NOT GUESSED. It blends two signals.

   SIGNAL 1 — how often a problem is asked, weighted toward RECENT asks.
   LeetCode's company tags, as scraped into three public datasets:
     • liquidslr/interview-company-wise-problems  (≈470 companies, refreshed
       Oct 2026) — windows: 30 days / 3 months / 6 months / older.
     • snehasishroy/leetcode-companywise-interview-questions (≈660 companies,
       Aug 2026) — same windows; a second scrape, so one dataset's gaps or
       glitches don't decide a rank.
     • krishnadey30/LeetCode-Questions-CompanyWise (≈200 companies, 2022) —
       the long-run record, so a classic that had a quiet half-year doesn't
       vanish.
   Per company and window the Frequency column is normalised to that file's
   max (raw scales differ), then summed across companies:
       recent = 4·(30 days) + 2.5·(3 months) + 1.5·(6 months)
       old    = "more than six months" + the 2022 dataset
       freq   = (0.7·recent + 0.3·old) · log2(2 + companies asking in 6 months)
   The breadth term means a problem asked at 40 companies outranks one asked
   intensely at one.

   SIGNAL 2 — whether the problem is on the curated lists people prep from.
   Blind 75 (×1.0), NeetCode 150 (×0.8), Grind 169 (×0.8), LeetCode Top
   Interview 150 (×0.7), Striver's SDE Sheet (×0.6), LeetCode 75 (×0.5). These
   are picked for pattern coverage, so being on several means the problem is a
   technique in itself. Lists live in scripts/data/patternLists.json and
   scripts/data/curatedLists.json.

   importance = 100 · (0.65 · freqPct + 0.35 · min(1, listWeight / 3))
     where freqPct = 1 − ln(rank) / ln(#problems on LeetCode), rank by freq.
   P0–P3 are cut from importance (P0 also needs 8+ companies in 6 months),
   with floors: Blind 75 never below P1, NeetCode 150 never below P2, a
   problem on 3+ lists never below P1.

   level (1–4) is how far into a topic a problem sits: Easy = 1, Medium
   split at the set's median acceptance rate into 2 (gentler) and 3, Hard = 4.

   LeetCode Premium problems are never in the set — they're dropped here even
   if a list or an earlier round added them.

   Usage (clones are big; keep them out of the repo):
     git clone --depth 1 https://github.com/liquidslr/interview-company-wise-problems  <dir>/liq
     git clone --depth 1 https://github.com/snehasishroy/leetcode-companywise-interview-questions <dir>/sneh
     git clone --depth 1 https://github.com/krishnadey30/LeetCode-Questions-CompanyWise <dir>/lcq
     node scripts/fetchLeetCodeCatalog.mjs <dir>/catalog.json
     node scripts/genDSAPriority.mjs <dir>            (add --dry to only print)
*/
import { readFileSync, readdirSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import * as CURRENT from "../src/Data/DSAPrep.js";

// The set as it stands is the baseline: this script only ever edits it.
const { DSA_TOPICS } = CURRENT;
// Problems taken out in earlier runs. Kept so a solve on one is never lost:
// the DSA page still shows (and counts) a retired problem you already solved.
const PREV_RETIRED = CURRENT.DSA_RETIRED || [];

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = (process.argv[2] || "").replace(/[\\/]$/, "");
const DRY = process.argv.includes("--dry");
if (!DIR || !existsSync(`${DIR}/catalog.json`)) {
  console.error("Pass the folder holding liq/, sneh/, lcq/ and catalog.json (see header).");
  process.exit(1);
}

const PATTERNS = JSON.parse(readFileSync(join(__dirname, "data/patternLists.json"), "utf8"));
const CURATED = JSON.parse(readFileSync(join(__dirname, "data/curatedLists.json"), "utf8"));
const alias = (s) => PATTERNS.aliases[s] || s;
const BLIND75 = new Set(PATTERNS.blind75.map(alias));
const NC150 = new Map(PATTERNS.neetcode150.map((p) => [alias(p.slug), p.pattern]));
const CATALOG = new Map(JSON.parse(readFileSync(`${DIR}/catalog.json`, "utf8")).map((q) => [q.titleSlug, q]));

// ── Round 1 (Oct 2026): problems the original curation missed ───────────────
// Already folded into DSAPrep.js; kept as the record of why each was added.
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

  // ── Harder follow-ups and product-company favourites ──
  // Scheduling with heaps, BFS over (cell, extra state), binary search on the
  // answer, design-a-class and range-query problems: the variants that show
  // up after the pattern anchor is solved. Premium-only problems and
  // near-duplicates of problems already here were left out.
  // Arrays / two pointers / sliding window
  ["summary-ranges", "Summary Ranges", "Easy", "Arrays and Two Pointers"],
  ["backspace-string-compare", "Backspace String Compare", "Easy", "Arrays and Two Pointers"],
  ["minimum-size-subarray-sum", "Minimum Size Subarray Sum", "Medium", "Sliding Window"],
  ["subarrays-with-k-different-integers", "Subarrays with K Different Integers", "Hard", "Sliding Window"],
  ["sliding-window-median", "Sliding Window Median", "Hard", "Sliding Window"],
  // Range queries
  ["range-sum-query-mutable", "Range Sum Query - Mutable", "Medium", "Array Manipulation and Prefix Sums"],
  ["count-of-smaller-numbers-after-self", "Count of Smaller Numbers After Self", "Hard", "Array Manipulation and Prefix Sums"],
  ["reverse-pairs", "Reverse Pairs", "Hard", "Array Manipulation and Prefix Sums"],
  // Strings
  ["license-key-formatting", "License Key Formatting", "Easy", "String Algorithms"],
  ["word-pattern", "Word Pattern", "Easy", "String Algorithms"],
  ["find-the-index-of-the-first-occurrence-in-a-string", "Find the Index of the First Occurrence in a String", "Easy", "String Algorithms"],
  ["expressive-words", "Expressive Words", "Medium", "String Algorithms"],
  ["find-and-replace-in-string", "Find And Replace in String", "Medium", "String Algorithms"],
  ["number-of-matching-subsequences", "Number of Matching Subsequences", "Medium", "String Algorithms"],
  ["repeated-dna-sequences", "Repeated DNA Sequences", "Medium", "String Algorithms"],
  ["longest-duplicate-substring", "Longest Duplicate Substring", "Hard", "String Algorithms"],
  ["shortest-palindrome", "Shortest Palindrome", "Hard", "String Algorithms"],
  // Stacks
  ["online-stock-span", "Online Stock Span", "Medium", "Stack and Queue"],
  ["exclusive-time-of-functions", "Exclusive Time of Functions", "Medium", "Stack and Queue"],
  ["remove-duplicate-letters", "Remove Duplicate Letters", "Medium", "Stack and Queue"],
  // Trees
  ["maximum-width-of-binary-tree", "Maximum Width of Binary Tree", "Medium", "Trees - Basic and Traversal"],
  ["house-robber-iii", "House Robber III", "Medium", "Trees - Advanced Properties"],
  ["step-by-step-directions-from-a-binary-tree-node-to-another", "Step-By-Step Directions From a Binary Tree Node to Another", "Medium", "Trees - Advanced Properties"],
  ["find-duplicate-subtrees", "Find Duplicate Subtrees", "Medium", "Trees - Advanced Properties"],
  ["longest-univalue-path", "Longest Univalue Path", "Medium", "Trees - Advanced Properties"],
  ["amount-of-time-for-binary-tree-to-be-infected", "Amount of Time for Binary Tree to Be Infected", "Medium", "Trees - Advanced Properties"],
  ["longest-path-with-different-adjacent-characters", "Longest Path With Different Adjacent Characters", "Hard", "Trees - Advanced Properties"],
  ["sum-of-distances-in-tree", "Sum of Distances in Tree", "Hard", "Trees - Advanced Properties"],
  ["delete-nodes-and-return-forest", "Delete Nodes And Return Forest", "Medium", "Trees - Construction and Modification"],
  // Heaps / scheduling
  ["single-threaded-cpu", "Single-Threaded CPU", "Medium", "Heap and Priority Queue"],
  ["furthest-building-you-can-reach", "Furthest Building You Can Reach", "Medium", "Heap and Priority Queue"],
  ["meeting-rooms-iii", "Meeting Rooms III", "Hard", "Heap and Priority Queue"],
  ["ipo", "IPO", "Hard", "Heap and Priority Queue"],
  ["smallest-range-covering-elements-from-k-lists", "Smallest Range Covering Elements from K Lists", "Hard", "Heap and Priority Queue"],
  ["minimum-cost-to-hire-k-workers", "Minimum Cost to Hire K Workers", "Hard", "Heap and Priority Queue"],
  ["minimum-number-of-refueling-stops", "Minimum Number of Refueling Stops", "Hard", "Heap and Priority Queue"],
  ["trapping-rain-water-ii", "Trapping Rain Water II", "Hard", "Heap and Priority Queue"],
  // Binary search
  ["sqrtx", "Sqrt(x)", "Easy", "Binary Search"],
  ["find-k-closest-elements", "Find K Closest Elements", "Medium", "Binary Search"],
  ["kth-smallest-element-in-a-sorted-matrix", "Kth Smallest Element in a Sorted Matrix", "Medium", "Binary Search"],
  ["find-k-th-smallest-pair-distance", "Find K-th Smallest Pair Distance", "Hard", "Binary Search"],
  // DP
  ["longest-string-chain", "Longest String Chain", "Medium", "Dynamic Programming - 1D"],
  ["flip-string-to-monotone-increasing", "Flip String to Monotone Increasing", "Medium", "Dynamic Programming - 1D"],
  ["minimum-cost-for-tickets", "Minimum Cost For Tickets", "Medium", "Dynamic Programming - 1D"],
  ["knight-dialer", "Knight Dialer", "Medium", "Dynamic Programming - 2D"],
  ["maximum-number-of-points-with-cost", "Maximum Number of Points with Cost", "Medium", "Dynamic Programming - 2D"],
  ["number-of-dice-rolls-with-target-sum", "Number of Dice Rolls With Target Sum", "Medium", "Dynamic Programming - 2D"],
  ["dungeon-game", "Dungeon Game", "Hard", "Dynamic Programming - 2D"],
  ["maximum-profit-in-job-scheduling", "Maximum Profit in Job Scheduling", "Hard", "Dynamic Programming - Advanced"],
  ["minimum-difficulty-of-a-job-schedule", "Minimum Difficulty of a Job Schedule", "Hard", "Dynamic Programming - Advanced"],
  ["russian-doll-envelopes", "Russian Doll Envelopes", "Hard", "Dynamic Programming - Advanced"],
  // Graphs
  ["jump-game-iii", "Jump Game III", "Medium", "Graphs - Basic Traversal"],
  ["possible-bipartition", "Possible Bipartition", "Medium", "Graphs - Basic Traversal"],
  ["detonate-the-maximum-bombs", "Detonate the Maximum Bombs", "Medium", "Graphs - Basic Traversal"],
  ["making-a-large-island", "Making A Large Island", "Hard", "Graphs - Basic Traversal"],
  ["shortest-path-in-a-grid-with-obstacles-elimination", "Shortest Path in a Grid with Obstacles Elimination", "Hard", "Graphs - Basic Traversal"],
  ["shortest-path-to-get-all-keys", "Shortest Path to Get All Keys", "Hard", "Graphs - Basic Traversal"],
  ["bus-routes", "Bus Routes", "Hard", "Graphs - Basic Traversal"],
  ["sliding-puzzle", "Sliding Puzzle", "Hard", "Graphs - Basic Traversal"],
  ["parallel-courses-iii", "Parallel Courses III", "Hard", "Graphs - Topological Sort and Cycle Detection"],
  ["path-with-minimum-effort", "Path With Minimum Effort", "Medium", "Graphs - Shortest Path and Advanced"],
  ["minimum-cost-to-make-at-least-one-valid-path-in-a-grid", "Minimum Cost to Make at Least One Valid Path in a Grid", "Hard", "Graphs - Shortest Path and Advanced"],
  ["critical-connections-in-a-network", "Critical Connections in a Network", "Hard", "Graphs - Shortest Path and Advanced"],
  ["most-stones-removed-with-same-row-or-column", "Most Stones Removed with Same Row or Column", "Medium", "Union Find"],
  ["satisfiability-of-equality-equations", "Satisfiability of Equality Equations", "Medium", "Union Find"],
  // Backtracking
  ["expression-add-operators", "Expression Add Operators", "Hard", "Backtracking"],
  ["remove-invalid-parentheses", "Remove Invalid Parentheses", "Hard", "Backtracking"],
  // Greedy & intervals
  ["queue-reconstruction-by-height", "Queue Reconstruction by Height", "Medium", "Greedy & Intervals"],
  ["video-stitching", "Video Stitching", "Medium", "Greedy & Intervals"],
  ["maximum-number-of-events-that-can-be-attended", "Maximum Number of Events That Can Be Attended", "Medium", "Greedy & Intervals"],
  ["my-calendar-i", "My Calendar I", "Medium", "Greedy & Intervals"],
  ["my-calendar-ii", "My Calendar II", "Medium", "Greedy & Intervals"],
  ["candy", "Candy", "Hard", "Greedy & Intervals"],
  ["range-module", "Range Module", "Hard", "Greedy & Intervals"],
  // Trie
  ["search-suggestions-system", "Search Suggestions System", "Medium", "Trie"],
  ["maximum-xor-of-two-numbers-in-an-array", "Maximum XOR of Two Numbers in an Array", "Medium", "Trie"],
  ["stream-of-characters", "Stream of Characters", "Hard", "Trie"],
  ["palindrome-pairs", "Palindrome Pairs", "Hard", "Trie"],
  ["concatenated-words", "Concatenated Words", "Hard", "Trie"],
  // Design
  ["snapshot-array", "Snapshot Array", "Medium", "Design and Implementation"],
  ["stock-price-fluctuation", "Stock Price Fluctuation", "Medium", "Design and Implementation"],
  ["peeking-iterator", "Peeking Iterator", "Medium", "Design and Implementation"],
  // Math & geometry
  ["fraction-to-recurring-decimal", "Fraction to Recurring Decimal", "Medium", "Math & Number Theory"],
  ["minimum-area-rectangle", "Minimum Area Rectangle", "Medium", "Math & Number Theory"],
  ["max-points-on-a-line", "Max Points on a Line", "Hard", "Math & Number Theory"],
];

// ── Round 2 (Nov 2026): high-signal problems still missing ──────────────────
// Picked from the fresh 2026 frequency ranking and the curated lists, skipping
// SQL, JS-only and trivial problems. Several are the Easy way into a topic
// that had none (Sliding Window, Prefix Sums, BST, Graphs, Greedy), which the
// picker needs so a topic can start gently.
const ADDITIONS_R2 = [
  // Arrays
  ["majority-element", "Majority Element", "Easy", "Arrays and Two Pointers"],
  ["remove-duplicates-from-sorted-array", "Remove Duplicates from Sorted Array", "Easy", "Arrays and Two Pointers"],
  // Prefix sums
  ["find-pivot-index", "Find Pivot Index", "Easy", "Array Manipulation and Prefix Sums"],
  ["range-sum-query-immutable", "Range Sum Query - Immutable", "Easy", "Array Manipulation and Prefix Sums"],
  ["contiguous-array", "Contiguous Array", "Medium", "Array Manipulation and Prefix Sums"],
  ["shortest-subarray-with-sum-at-least-k", "Shortest Subarray with Sum at Least K", "Hard", "Array Manipulation and Prefix Sums"],
  // Sliding window
  ["contains-duplicate-ii", "Contains Duplicate II", "Easy", "Sliding Window"],
  ["maximum-average-subarray-i", "Maximum Average Subarray I", "Easy", "Sliding Window"],
  ["maximum-points-you-can-obtain-from-cards", "Maximum Points You Can Obtain from Cards", "Medium", "Sliding Window"],
  ["count-number-of-nice-subarrays", "Count Number of Nice Subarrays", "Medium", "Sliding Window"],
  ["longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit", "Longest Continuous Subarray With Absolute Diff Less Than or Equal to Limit", "Medium", "Sliding Window"],
  // Strings
  ["reverse-words-in-a-string", "Reverse Words in a String", "Medium", "String Algorithms"],
  ["zigzag-conversion", "Zigzag Conversion", "Medium", "String Algorithms"],
  ["valid-palindrome-ii", "Valid Palindrome II", "Easy", "String Algorithms"],
  ["is-subsequence", "Is Subsequence", "Easy", "String Algorithms"],
  ["ransom-note", "Ransom Note", "Easy", "String Algorithms"],
  // Linked lists
  ["remove-duplicates-from-sorted-list", "Remove Duplicates from Sorted List", "Easy", "Linked Lists"],
  ["odd-even-linked-list", "Odd Even Linked List", "Medium", "Linked Lists"],
  ["swap-nodes-in-pairs", "Swap Nodes in Pairs", "Medium", "Linked Lists"],
  // Stack and queue
  ["next-greater-element-i", "Next Greater Element I", "Easy", "Stack and Queue"],
  ["remove-all-adjacent-duplicates-in-string", "Remove All Adjacent Duplicates In String", "Easy", "Stack and Queue"],
  ["remove-all-adjacent-duplicates-in-string-ii", "Remove All Adjacent Duplicates in String II", "Medium", "Stack and Queue"],
  ["minimum-add-to-make-parentheses-valid", "Minimum Add to Make Parentheses Valid", "Medium", "Stack and Queue"],
  ["find-the-winner-of-the-circular-game", "Find the Winner of the Circular Game", "Medium", "Stack and Queue"],
  // Trees
  ["binary-tree-inorder-traversal", "Binary Tree Inorder Traversal", "Easy", "Trees - Basic and Traversal"],
  ["path-sum", "Path Sum", "Easy", "Trees - Advanced Properties"],
  ["binary-tree-cameras", "Binary Tree Cameras", "Hard", "Trees - Advanced Properties"],
  // BST
  ["convert-sorted-array-to-binary-search-tree", "Convert Sorted Array to Binary Search Tree", "Easy", "Binary Search Trees"],
  ["search-in-a-binary-search-tree", "Search in a Binary Search Tree", "Easy", "Binary Search Trees"],
  ["construct-binary-search-tree-from-preorder-traversal", "Construct Binary Search Tree from Preorder Traversal", "Medium", "Binary Search Trees"],
  // Heap
  ["sort-characters-by-frequency", "Sort Characters By Frequency", "Medium", "Heap and Priority Queue"],
  ["find-k-pairs-with-smallest-sums", "Find K Pairs with Smallest Sums", "Medium", "Heap and Priority Queue"],
  // Binary search
  ["search-insert-position", "Search Insert Position", "Easy", "Binary Search"],
  ["first-bad-version", "First Bad Version", "Easy", "Binary Search"],
  ["minimum-number-of-days-to-make-m-bouquets", "Minimum Number of Days to Make m Bouquets", "Medium", "Binary Search"],
  // DP
  ["pascals-triangle", "Pascal's Triangle", "Easy", "Dynamic Programming - 1D"],
  ["delete-and-earn", "Delete and Earn", "Medium", "Dynamic Programming - 1D"],
  ["perfect-squares", "Perfect Squares", "Medium", "Dynamic Programming - 1D"],
  ["triangle", "Triangle", "Medium", "Dynamic Programming - 2D"],
  // Graphs
  ["flood-fill", "Flood Fill", "Easy", "Graphs - Basic Traversal"],
  ["find-if-path-exists-in-graph", "Find if Path Exists in Graph", "Easy", "Graphs - Basic Traversal"],
  ["keys-and-rooms", "Keys and Rooms", "Medium", "Graphs - Basic Traversal"],
  ["shortest-path-in-binary-matrix", "Shortest Path in Binary Matrix", "Medium", "Graphs - Basic Traversal"],
  ["snakes-and-ladders", "Snakes and Ladders", "Medium", "Graphs - Basic Traversal"],
  ["find-the-safest-path-in-a-grid", "Find the Safest Path in a Grid", "Medium", "Graphs - Shortest Path and Advanced"],
  // Union find — replaces the two Premium-only anchors dropped below
  ["number-of-operations-to-make-network-connected", "Number of Operations to Make Network Connected", "Medium", "Union Find"],
  ["minimize-malware-spread", "Minimize Malware Spread", "Hard", "Union Find"],
  // Backtracking
  ["combinations", "Combinations", "Medium", "Backtracking"],
  ["restore-ip-addresses", "Restore IP Addresses", "Medium", "Backtracking"],
  // Greedy
  ["can-place-flowers", "Can Place Flowers", "Easy", "Greedy & Intervals"],
  ["lemonade-change", "Lemonade Change", "Easy", "Greedy & Intervals"],
  ["largest-number", "Largest Number", "Medium", "Greedy & Intervals"],
  // Design — recent asks, and stand-ins for the Premium-only design classics
  ["design-authentication-manager", "Design Authentication Manager", "Medium", "Design and Implementation"],
  ["design-memory-allocator", "Design Memory Allocator", "Medium", "Design and Implementation"],
  // Math / bits
  ["palindrome-number", "Palindrome Number", "Easy", "Math & Number Theory"],
  ["add-binary", "Add Binary", "Easy", "Math & Number Theory"],
  ["count-primes", "Count Primes", "Medium", "Math & Number Theory"],
  ["power-of-two", "Power of Two", "Easy", "Bit Manipulation"],
];

// ── Removals (Nov 2026) ─────────────────────────────────────────────────────
// Applied after every addition, so a removal always wins. Premium-only
// problems are removed automatically on top of this list.
// Ids that were the same problem under a wrong slug: a solve on the old id is
// carried over to the new one (planStore.migrateDsaAliases) and the old entry
// is dropped outright rather than retired.
const ID_ALIASES = {
  "coin-change-2": "coin-change-ii",
};

const REMOVALS = [
  // Rarely asked anywhere in 2025–26 (outside the top ~1000 by frequency,
  // on no curated list) — they cost a day each and almost never come up.
  "peeking-iterator", "number-of-matching-subsequences", "find-duplicate-subtrees",
  "longest-duplicate-substring", "number-of-dice-rolls-with-target-sum",
  "queue-reconstruction-by-height", "sliding-puzzle", "jump-game-iii", "stream-of-characters",
  "find-and-replace-in-string", "sum-of-distances-in-tree", "design-circular-deque",
  "expressive-words", "stock-price-fluctuation", "range-sum-query-mutable",
  "find-k-th-smallest-pair-distance", "longest-univalue-path", "path-with-maximum-probability",
  "longest-path-with-different-adjacent-characters", "license-key-formatting", "my-calendar-ii",
  "flip-string-to-monotone-increasing", "video-stitching", "course-schedule-iv",
  "maximum-number-of-points-with-cost", "concatenated-words", "range-module",
  "minimum-cost-to-make-at-least-one-valid-path-in-a-grid",
  // NeetCode-150 pattern anchors that are almost never asked (rank 1500+);
  // the patterns are still covered by Merge Intervals / Gas Station etc.
  "detect-squares", "minimum-interval-to-include-each-query", "merge-triplets-to-form-target-triplet",
];

// ── Frequency data ──────────────────────────────────────────────────────────
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 1);
}
const slugOf = (url) => url.trim().replace(/\/$/, "").split("/").pop();
const companyKey = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// One 2026 dataset → Map(slug → { win: {d30,m3,m6,old: Σ normalised freq}, cos: {win: Set} }).
function loadWindowed(dir, files, cols) {
  const agg = new Map();
  for (const company of readdirSync(dir)) {
    for (const [win, file] of Object.entries(files)) {
      const path = `${dir}/${company}/${file}`;
      if (!existsSync(path)) continue;
      const rows = parseCsv(readFileSync(path, "utf8"));
      const head = rows.shift() || [];
      const li = head.indexOf(cols.link), fi = head.indexOf(cols.freq);
      const data = rows
        .map((r) => ({ slug: slugOf(r[li] || ""), f: parseFloat(r[fi]) }))
        .filter((r) => r.slug && !isNaN(r.f));
      const max = Math.max(0, ...data.map((d) => d.f));
      if (!max) continue;
      for (const d of data) {
        if (!agg.has(d.slug)) agg.set(d.slug, { win: {}, cos: {} });
        const e = agg.get(d.slug);
        e.win[win] = (e.win[win] || 0) + d.f / max;
        (e.cos[win] ||= new Set()).add(companyKey(company));
      }
    }
  }
  return agg;
}
const WINDOWS = ["d30", "m3", "m6", "old"];
const liq = loadWindowed(`${DIR}/liq`,
  Object.fromEntries(WINDOWS.map((w, i) => [w, ["1. Thirty Days.csv", "2. Three Months.csv", "3. Six Months.csv", "4. More Than Six Months.csv"][i]])),
  { link: "Link", freq: "Frequency" });
const sneh = loadWindowed(`${DIR}/sneh`,
  Object.fromEntries(WINDOWS.map((w, i) => [w, ["thirty-days.csv", "three-months.csv", "six-months.csv", "more-than-six-months.csv"][i]])),
  { link: "URL", freq: "Frequency %" });

// The 2022 dataset: flat company_window.csv files, last two columns freq + link.
const legacy = new Map();
{
  const W = { "6months": 3, "1year": 2, "2year": 1.5, alltime: 1 };
  for (const f of readdirSync(`${DIR}/lcq`)) {
    const m = f.match(/^(.*)_(alltime|6months|1year|2year)\.csv$/);
    if (!m) continue;
    const rows = parseCsv(readFileSync(`${DIR}/lcq/${f}`, "utf8")).slice(1);
    const data = rows.map((r) => ({ slug: slugOf(r[r.length - 1]), f: parseFloat(r[r.length - 2]) })).filter((r) => r.slug && !isNaN(r.f));
    const max = Math.max(0, ...data.map((d) => d.f));
    if (!max) continue;
    for (const d of data) legacy.set(d.slug, (legacy.get(d.slug) || 0) + (d.f / max) * W[m[2]]);
  }
}

const recentOf = (e) => (e ? 4 * (e.win.d30 || 0) + 2.5 * (e.win.m3 || 0) + 1.5 * (e.win.m6 || 0) : 0);
const companiesIn = (slug, wins) => {
  const s = new Set();
  for (const d of [liq, sneh]) {
    const e = d.get(slug);
    if (e) for (const w of wins) for (const c of e.cos[w] || []) s.add(c);
  }
  return s.size;
};

const ALL = [...CATALOG.keys()];
const maxBy = (fn) => Math.max(...ALL.map(fn)) || 1;
const rLiq = (s) => recentOf(liq.get(s)), rSneh = (s) => recentOf(sneh.get(s));
const oNew = (s) => (liq.get(s)?.win.old || 0) + (sneh.get(s)?.win.old || 0), oLegacy = (s) => legacy.get(s) || 0;
const MX = { rLiq: maxBy(rLiq), rSneh: maxBy(rSneh), oNew: maxBy(oNew), oLegacy: maxBy(oLegacy) };

const LIST_WEIGHTS = [
  ["blind75", BLIND75, 1.0],
  ["nc150", new Set(NC150.keys()), 0.8],
  ["grind169", new Set(CURATED.grind169), 0.8],
  ["ti150", new Set(CURATED.topInterview150), 0.7],
  ["striver", new Set(CURATED.striverSDE), 0.6],
  ["lc75", new Set(CURATED.leetcode75), 0.5],
];

const stats = new Map();
for (const s of ALL) {
  const recent = 0.6 * (rLiq(s) / MX.rLiq) + 0.4 * (rSneh(s) / MX.rSneh);
  const old = 0.5 * (oNew(s) / MX.oNew) + 0.5 * (oLegacy(s) / MX.oLegacy);
  const companies = companiesIn(s, ["d30", "m3", "m6"]);
  const lists = LIST_WEIGHTS.filter(([, set]) => set.has(s));
  stats.set(s, {
    freq: (0.7 * recent + 0.3 * old) * Math.log2(2 + companies),
    companies,
    recent: companiesIn(s, ["d30"]),
    lists: lists.map(([k]) => k),
    listWeight: lists.reduce((n, [, , w]) => n + w, 0),
  });
}
ALL.slice().sort((a, b) => stats.get(b).freq - stats.get(a).freq).forEach((s, i) => (stats.get(s).rank = i + 1));

// ── Build the set ───────────────────────────────────────────────────────────
const topics = DSA_TOPICS.map((t) => ({ topic: t.topic, problems: t.problems.map((p) => ({ ...p })) }));
const byTopic = new Map(topics.map((t) => [t.topic, t]));
const seen = new Set(topics.flatMap((t) => t.problems.map((p) => p.id)));
for (const [id, title, difficulty, topic] of [...ADDITIONS, ...ADDITIONS_R2]) {
  if (seen.has(id)) continue;
  const t = byTopic.get(topic);
  if (!t) { console.error("unknown topic:", topic); process.exit(1); }
  t.problems.push({ id, title, link: `https://leetcode.com/problems/${id}/`, difficulty });
  seen.add(id);
}
const removed = [];
const retired = new Map(PREV_RETIRED.map((p) => [p.id, p]));
const drop = new Set(REMOVALS);
for (const t of topics) {
  t.problems = t.problems.filter((p) => {
    const q = CATALOG.get(p.id);
    const why = ID_ALIASES[p.id] ? "duplicate" : drop.has(p.id) ? "listed" : !q ? "not on LeetCode" : q.isPaidOnly ? "Premium" : null;
    if (!why) return true;
    removed.push(`${p.id} (${why})`);
    if (!ID_ALIASES[p.id]) {
      retired.set(p.id, {
        id: p.id, title: p.title, link: p.link, difficulty: p.difficulty,
        topic: t.topic, retired: why === "Premium" ? "Premium" : "Rarely asked",
      });
    }
    return false;
  });
}
// A problem added back since it was retired is live again.
for (const t of topics) for (const p of t.problems) retired.delete(p.id);

// ── Score, level, priority ─────────────────────────────────────────────────
const problems = topics.flatMap((t) => t.problems);
const LN_N = Math.log(ALL.length);
for (const p of problems) {
  const q = CATALOG.get(p.id), st = stats.get(p.id);
  p.difficulty = q.difficulty;                      // LeetCode's own label wins
  p.title = q.title;
  const freqPct = Math.max(0, 1 - Math.log(st.rank) / LN_N);
  p.importance = Math.round(100 * (0.65 * freqPct + 0.35 * Math.min(1, st.listWeight / 3)));
  p.companies = st.companies;
  if (st.recent) p.recent = st.recent; else delete p.recent;
  if (st.lists.length) p.lists = st.lists; else delete p.lists;
}
// Medium is split at the set's median acceptance rate: the gentler half sits
// at level 2, the half people get wrong more often at level 3.
const medAc = problems.filter((p) => p.difficulty === "Medium").map((p) => CATALOG.get(p.id).acRate).sort((a, b) => a - b);
const MEDIAN_AC = medAc[Math.floor(medAc.length / 2)];
for (const p of problems) {
  p.level = p.difficulty === "Easy" ? 1 : p.difficulty === "Hard" ? 4 : CATALOG.get(p.id).acRate >= MEDIAN_AC ? 2 : 3;
}

// Buckets by importance order; floors keep pattern anchors visible.
const P0_COUNT = 40, P1_UPTO = 150, P2_UPTO = 285, P0_MIN_COMPANIES = 8;
const order = problems.slice().sort((a, b) => b.importance - a.importance || stats.get(a.id).rank - stats.get(b.id).rank);
order.forEach((p, i) => {
  let tier = i < P0_COUNT ? 0 : i < P1_UPTO ? 1 : i < P2_UPTO ? 2 : 3;
  if (tier === 0 && p.companies < P0_MIN_COMPANIES) tier = 1;
  if (BLIND75.has(p.id) || (p.lists || []).length >= 3) tier = Math.min(tier, 1);
  if (NC150.has(p.id)) tier = Math.min(tier, 2);
  p.priority = `P${tier}`;
  const pattern = NC150.get(p.id);
  if (pattern) p.pattern = pattern;
  if (BLIND75.has(p.id)) p.core = true; else delete p.core;
});

const counts = { P0: 0, P1: 0, P2: 0, P3: 0 };
const KEY_ORDER = ["id", "title", "link", "difficulty", "priority", "importance", "level", "companies", "recent", "lists", "pattern", "core"];
for (const t of topics) {
  t.problems.sort((a, b) => a.priority.localeCompare(b.priority) || b.importance - a.importance);
  t.problems = t.problems.map((p) => {
    counts[p.priority] += 1;
    return Object.fromEntries(KEY_ORDER.filter((k) => p[k] !== undefined).map((k) => [k, p[k]]));
  });
}
const total = problems.length;

console.log("problems:", total, "| removed:", removed.length, "| median Medium acceptance:", MEDIAN_AC.toFixed(1));
console.log("priority:", counts);
console.log("levels:", [1, 2, 3, 4].map((l) => `L${l}=${problems.filter((p) => p.level === l).length}`).join(" "));
console.log("removed:", removed.join(", "));
for (const t of topics) {
  const lv = [1, 2, 3, 4].map((l) => t.problems.filter((p) => p.level === l).length).join("/");
  console.log(`  ${t.topic.padEnd(46)} ${String(t.problems.length).padStart(3)}  L1-4 ${lv}`);
}
if (process.argv.includes("--list")) {
  order.forEach((p, i) => console.log(`${String(i + 1).padStart(4)} ${p.priority} imp=${String(p.importance).padStart(3)} L${p.level} co=${String(p.companies).padStart(3)} r30=${p.recent || 0} ${p.id} [${(p.lists || []).join(",")}]`));
}
if (DRY) process.exit(0);

// ── Emit ────────────────────────────────────────────────────────────────────
const out = `// Curated interview DSA set — ${total} problems, LeetCode Premium excluded.
//
// \`priority\` (P0–P3) and \`importance\` (0–100) blend two measured signals:
//
//   1. HOW OFTEN IT IS ASKED, weighted toward the last 30 days / 3 / 6 months.
//      LeetCode company tags from two 2026 scrapes (liquidslr, Oct 2026;
//      snehasishroy, Aug 2026 — ~1,100 companies) plus the 2022
//      krishnadey30 dataset as the long-run record, normalised per company and
//      scaled by how many companies asked it in the last 6 months.
//
//   2. WHETHER IT IS A TOPIC IN ITSELF — membership of Blind 75, NeetCode 150,
//      Grind 169, LeetCode Top Interview 150, Striver's SDE Sheet, LeetCode 75.
//
// \`level\` (1–4) is how deep into its topic a problem sits (Easy → gentler
// Medium → harder Medium → Hard); the question picker walks topics in that
// order. \`companies\` = companies asking it in the last 6 months, \`recent\` =
// in the last 30 days. \`pattern\` names the technique a NeetCode-150 problem
// teaches; \`core\` marks Blind 75.
//
// Regenerate with scripts/genDSAPriority.mjs — edit there, not here.

export const DSA_TOPICS = ${JSON.stringify(topics, null, 2).replace(
  // Keep each problem's \`lists\` on one line instead of one slug per line.
  /\[\n\s+((?:"[a-z0-9]+",?\n\s+)+)\]/g,
  (_, inner) => `[${inner.trim().split(/,?\s*\n\s*/).join(", ")}]`
)};

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

// Short names for the curated lists a problem is on (\`lists\`).
export const DSA_LIST_LABELS = {
  blind75: "Blind 75",
  nc150: "NeetCode 150",
  grind169: "Grind 169",
  ti150: "Top Interview 150",
  striver: "Striver SDE",
  lc75: "LeetCode 75",
};

// Problems taken out of the set. Never offered or counted for a new user, but
// the DSA page shows any you already solved under its old topic, so a solve
// is never lost to a re-ranking.
export const DSA_RETIRED = ${JSON.stringify([...retired.values()], null, 2)};

// Old id → current id for the same problem; a solve moves across on load.
export const DSA_ID_ALIASES = ${JSON.stringify(ID_ALIASES)};

// Flat list (id-keyed) for the Planning page picker and cross-page sync.
export const DSA_PROBLEMS = DSA_TOPICS.flatMap((t) =>
  t.problems.map((p) => ({ ...p, topic: t.topic }))
);

export const DSA_TOTAL = ${total};

export const DSA_PRIORITY_COUNTS = ${JSON.stringify(counts)};
`;

writeFileSync(join(__dirname, "../src/Data/DSAPrep.js"), out);
console.log("\nwrote src/Data/DSAPrep.js");
