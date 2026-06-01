// Most-Asked DSA — a tight, interview-cram subset of the full 200-problem set.
// Organised into readiness TIERS so you can decide what to grind based on how
// much time you have before the interview:
//   Tier 1 → the night before / 1 day left   (the non-negotiables)
//   Tier 2 → 2–3 days left
//   Tier 3 → a full week left
//
// Problem `id`s reuse the LeetCode slug and match the main DSA page wherever the
// problem also lives there, so ticking one as solved syncs across both pages and
// to the cloud. A handful of foundational easies (Two Sum, Valid Parentheses…)
// are not in the curated 200 but are included here because they show up
// constantly in real interviews.
//
// `asked` flags problems a company is known to have asked recently.

export const MOST_ASKED_TIERS = [
  {
    tier: "Tier 1",
    label: "Night before · 1 day left",
    blurb:
      "The non-negotiables. If you only have a few hours, these are the patterns interviewers reach for most often. Do every one of these.",
    problems: [
      { id: "two-sum", title: "Two Sum", link: "https://leetcode.com/problems/two-sum/", difficulty: "Easy", topic: "Hashing", pattern: "Hash map complement lookup — the canonical warm-up." },
      { id: "3sum", title: "3Sum", link: "https://leetcode.com/problems/3sum/", difficulty: "Medium", topic: "Two Pointers", pattern: "Sort + two pointers, skip duplicates.", asked: "Cvent" },
      { id: "container-with-most-water", title: "Container With Most Water", link: "https://leetcode.com/problems/container-with-most-water/", difficulty: "Medium", topic: "Two Pointers", pattern: "Shrink from the shorter wall inward." },
      { id: "best-time-to-buy-and-sell-stock", title: "Best Time to Buy and Sell Stock", link: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", difficulty: "Easy", topic: "Arrays", pattern: "Track running min, max profit." },
      { id: "maximum-subarray", title: "Maximum Subarray", link: "https://leetcode.com/problems/maximum-subarray/", difficulty: "Medium", topic: "Arrays / DP", pattern: "Kadane's algorithm." },
      { id: "product-of-array-except-self", title: "Product of Array Except Self", link: "https://leetcode.com/problems/product-of-array-except-self/", difficulty: "Medium", topic: "Arrays", pattern: "Prefix · suffix products, no division." },
      { id: "merge-intervals", title: "Merge Intervals", link: "https://leetcode.com/problems/merge-intervals/", difficulty: "Medium", topic: "Intervals", pattern: "Sort by start, merge overlaps." },
      { id: "valid-parentheses", title: "Valid Parentheses", link: "https://leetcode.com/problems/valid-parentheses/", difficulty: "Easy", topic: "Stack", pattern: "Push opens, match on close." },
      { id: "lru-cache", title: "LRU Cache", link: "https://leetcode.com/problems/lru-cache/", difficulty: "Medium", topic: "Design", pattern: "Hash map + doubly linked list, O(1) get/put.", asked: "Cvent" },
      { id: "min-stack", title: "Min Stack", link: "https://leetcode.com/problems/min-stack/", difficulty: "Medium", topic: "Stack / Design", pattern: "Auxiliary stack tracking the running min." },
      { id: "group-anagrams", title: "Group Anagrams", link: "https://leetcode.com/problems/group-anagrams/", difficulty: "Medium", topic: "Hashing", pattern: "Key by sorted string / char count." },
      { id: "top-k-frequent-elements", title: "Top K Frequent Elements", link: "https://leetcode.com/problems/top-k-frequent-elements/", difficulty: "Medium", topic: "Heap / Hashing", pattern: "Count + heap, or bucket sort." },
      { id: "longest-substring-without-repeating-characters", title: "Longest Substring Without Repeating Characters", link: "https://leetcode.com/problems/longest-substring-without-repeating-characters/", difficulty: "Medium", topic: "Sliding Window", pattern: "Window + last-seen index map." },
      { id: "reverse-linked-list", title: "Reverse Linked List", link: "https://leetcode.com/problems/reverse-linked-list/", difficulty: "Easy", topic: "Linked List", pattern: "Iterative prev/curr pointer flip." },
      { id: "merge-two-sorted-lists", title: "Merge Two Sorted Lists", link: "https://leetcode.com/problems/merge-two-sorted-lists/", difficulty: "Easy", topic: "Linked List", pattern: "Dummy head, splice smaller node." },
      { id: "linked-list-cycle", title: "Linked List Cycle", link: "https://leetcode.com/problems/linked-list-cycle/", difficulty: "Easy", topic: "Linked List", pattern: "Floyd's fast/slow pointers." },
      { id: "number-of-islands", title: "Number of Islands", link: "https://leetcode.com/problems/number-of-islands/", difficulty: "Medium", topic: "Graphs / DFS", pattern: "Flood fill each unvisited land cell." },
      { id: "binary-tree-level-order-traversal", title: "Binary Tree Level Order Traversal", link: "https://leetcode.com/problems/binary-tree-level-order-traversal/", difficulty: "Medium", topic: "Trees / BFS", pattern: "Queue, process level by level." },
      { id: "validate-binary-search-tree", title: "Validate Binary Search Tree", link: "https://leetcode.com/problems/validate-binary-search-tree/", difficulty: "Medium", topic: "Trees", pattern: "Carry (min, max) bounds down the tree." },
      { id: "lowest-common-ancestor-of-a-binary-tree", title: "Lowest Common Ancestor of a Binary Tree", link: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/", difficulty: "Medium", topic: "Trees", pattern: "Post-order: return where both sides report a hit." },
      { id: "climbing-stairs", title: "Climbing Stairs", link: "https://leetcode.com/problems/climbing-stairs/", difficulty: "Easy", topic: "DP", pattern: "Fibonacci — the DP gateway problem." },
      { id: "coin-change", title: "Coin Change", link: "https://leetcode.com/problems/coin-change/", difficulty: "Medium", topic: "DP", pattern: "Unbounded knapsack, min coins." },
      { id: "kth-largest-element-in-an-array", title: "Kth Largest Element in an Array", link: "https://leetcode.com/problems/kth-largest-element-in-an-array/", difficulty: "Medium", topic: "Heap / Quickselect", pattern: "Min-heap of size k, or quickselect." },
      { id: "course-schedule", title: "Course Schedule", link: "https://leetcode.com/problems/course-schedule/", difficulty: "Medium", topic: "Graphs", pattern: "Cycle detection / topological sort." },
      { id: "search-in-rotated-sorted-array", title: "Search in Rotated Sorted Array", link: "https://leetcode.com/problems/search-in-rotated-sorted-array/", difficulty: "Medium", topic: "Binary Search", pattern: "Decide which half is sorted, then bound." },
    ],
  },
  {
    tier: "Tier 2",
    label: "2–3 days left",
    blurb:
      "Build on Tier 1. These round out the core patterns — more linked lists, trees, DP and the classic hard that interviewers love to drop in.",
    problems: [
      { id: "valid-anagram", title: "Valid Anagram", link: "https://leetcode.com/problems/valid-anagram/", difficulty: "Easy", topic: "Hashing", pattern: "Char-count comparison." },
      { id: "trapping-rain-water", title: "Trapping Rain Water", link: "https://leetcode.com/problems/trapping-rain-water/", difficulty: "Hard", topic: "Two Pointers", pattern: "Two pointers with left/right max." },
      { id: "longest-palindromic-substring", title: "Longest Palindromic Substring", link: "https://leetcode.com/problems/longest-palindromic-substring/", difficulty: "Medium", topic: "Strings / DP", pattern: "Expand around each center." },
      { id: "set-matrix-zeroes", title: "Set Matrix Zeroes", link: "https://leetcode.com/problems/set-matrix-zeroes/", difficulty: "Medium", topic: "Matrix", pattern: "Use first row/col as markers, O(1) space." },
      { id: "spiral-matrix", title: "Spiral Matrix", link: "https://leetcode.com/problems/spiral-matrix/", difficulty: "Medium", topic: "Matrix", pattern: "Shrink the four boundaries." },
      { id: "rotate-image", title: "Rotate Image", link: "https://leetcode.com/problems/rotate-image/", difficulty: "Medium", topic: "Matrix", pattern: "Transpose then reverse each row." },
      { id: "subarray-sum-equals-k", title: "Subarray Sum Equals K", link: "https://leetcode.com/problems/subarray-sum-equals-k/", difficulty: "Medium", topic: "Hashing", pattern: "Prefix-sum count in a map." },
      { id: "maximum-product-subarray", title: "Maximum Product Subarray", link: "https://leetcode.com/problems/maximum-product-subarray/", difficulty: "Medium", topic: "DP", pattern: "Track running max AND min (negatives flip)." },
      { id: "house-robber", title: "House Robber", link: "https://leetcode.com/problems/house-robber/", difficulty: "Medium", topic: "DP", pattern: "rob[i] = max(skip, take + i-2)." },
      { id: "longest-increasing-subsequence", title: "Longest Increasing Subsequence", link: "https://leetcode.com/problems/longest-increasing-subsequence/", difficulty: "Medium", topic: "DP", pattern: "Patience sorting / binary search, O(n log n)." },
      { id: "unique-paths", title: "Unique Paths", link: "https://leetcode.com/problems/unique-paths/", difficulty: "Medium", topic: "DP", pattern: "Grid DP, paths = up + left." },
      { id: "word-break", title: "Word Break", link: "https://leetcode.com/problems/word-break/", difficulty: "Medium", topic: "DP", pattern: "dp[i] true if a dict word ends at i." },
      { id: "add-two-numbers", title: "Add Two Numbers", link: "https://leetcode.com/problems/add-two-numbers/", difficulty: "Medium", topic: "Linked List", pattern: "Digit-by-digit with carry." },
      { id: "copy-list-with-random-pointer", title: "Copy List with Random Pointer", link: "https://leetcode.com/problems/copy-list-with-random-pointer/", difficulty: "Medium", topic: "Linked List", pattern: "Interleave clones, or hash old→new." },
      { id: "remove-nth-node-from-end-of-list", title: "Remove Nth Node From End of List", link: "https://leetcode.com/problems/remove-nth-node-from-end-of-list/", difficulty: "Medium", topic: "Linked List", pattern: "Two pointers n apart." },
      { id: "reorder-list", title: "Reorder List", link: "https://leetcode.com/problems/reorder-list/", difficulty: "Medium", topic: "Linked List", pattern: "Find mid, reverse second half, merge." },
      { id: "merge-k-sorted-lists", title: "Merge k Sorted Lists", link: "https://leetcode.com/problems/merge-k-sorted-lists/", difficulty: "Hard", topic: "Heap / Linked List", pattern: "Min-heap of heads, or pairwise merge." },
      { id: "maximum-depth-of-binary-tree", title: "Maximum Depth of Binary Tree", link: "https://leetcode.com/problems/maximum-depth-of-binary-tree/", difficulty: "Easy", topic: "Trees", pattern: "1 + max(left, right)." },
      { id: "invert-binary-tree", title: "Invert Binary Tree", link: "https://leetcode.com/problems/invert-binary-tree/", difficulty: "Easy", topic: "Trees", pattern: "Swap children recursively." },
      { id: "diameter-of-binary-tree", title: "Diameter of Binary Tree", link: "https://leetcode.com/problems/diameter-of-binary-tree/", difficulty: "Easy", topic: "Trees", pattern: "Height DFS, update best left+right." },
      { id: "binary-tree-right-side-view", title: "Binary Tree Right Side View", link: "https://leetcode.com/problems/binary-tree-right-side-view/", difficulty: "Medium", topic: "Trees / BFS", pattern: "Last node of each BFS level." },
      { id: "serialize-and-deserialize-binary-tree", title: "Serialize and Deserialize Binary Tree", link: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/", difficulty: "Hard", topic: "Trees / Design", pattern: "Pre-order with null markers." },
      { id: "clone-graph", title: "Clone Graph", link: "https://leetcode.com/problems/clone-graph/", difficulty: "Medium", topic: "Graphs", pattern: "DFS/BFS with old→clone map." },
      { id: "rotting-oranges", title: "Rotting Oranges", link: "https://leetcode.com/problems/rotting-oranges/", difficulty: "Medium", topic: "Graphs / BFS", pattern: "Multi-source BFS, count minutes." },
      { id: "course-schedule-ii", title: "Course Schedule II", link: "https://leetcode.com/problems/course-schedule-ii/", difficulty: "Medium", topic: "Graphs", pattern: "Topological sort (Kahn's)." },
      { id: "combination-sum", title: "Combination Sum", link: "https://leetcode.com/problems/combination-sum/", difficulty: "Medium", topic: "Backtracking", pattern: "Reuse allowed — recurse on same index." },
      { id: "subsets", title: "Subsets", link: "https://leetcode.com/problems/subsets/", difficulty: "Medium", topic: "Backtracking", pattern: "Include/exclude each element." },
      { id: "permutations", title: "Permutations", link: "https://leetcode.com/problems/permutations/", difficulty: "Medium", topic: "Backtracking", pattern: "Swap-in-place or used[] array." },
      { id: "find-median-from-data-stream", title: "Find Median from Data Stream", link: "https://leetcode.com/problems/find-median-from-data-stream/", difficulty: "Hard", topic: "Heap / Design", pattern: "Two balanced heaps." },
    ],
  },
  {
    tier: "Tier 3",
    label: "A full week left",
    blurb:
      "Depth and breadth. The trickier hards, design questions and the patterns that separate a strong candidate. Get through these and you've covered the field.",
    problems: [
      { id: "median-of-two-sorted-arrays", title: "Median of Two Sorted Arrays", link: "https://leetcode.com/problems/median-of-two-sorted-arrays/", difficulty: "Hard", topic: "Binary Search", pattern: "Partition the smaller array." },
      { id: "first-missing-positive", title: "First Missing Positive", link: "https://leetcode.com/problems/first-missing-positive/", difficulty: "Hard", topic: "Arrays", pattern: "Index-as-hash, place n at index n-1." },
      { id: "minimum-window-substring", title: "Minimum Window Substring", link: "https://leetcode.com/problems/minimum-window-substring/", difficulty: "Hard", topic: "Sliding Window", pattern: "Expand to satisfy, shrink to minimise." },
      { id: "sliding-window-maximum", title: "Sliding Window Maximum", link: "https://leetcode.com/problems/sliding-window-maximum/", difficulty: "Hard", topic: "Deque", pattern: "Monotonic decreasing deque." },
      { id: "find-all-anagrams-in-a-string", title: "Find All Anagrams in a String", link: "https://leetcode.com/problems/find-all-anagrams-in-a-string/", difficulty: "Medium", topic: "Sliding Window", pattern: "Fixed window char-count match." },
      { id: "longest-consecutive-sequence", title: "Longest Consecutive Sequence", link: "https://leetcode.com/problems/longest-consecutive-sequence/", difficulty: "Medium", topic: "Hashing", pattern: "Set; start runs only at sequence heads." },
      { id: "word-search", title: "Word Search", link: "https://leetcode.com/problems/word-search/", difficulty: "Medium", topic: "Backtracking", pattern: "DFS from each cell, mark visited." },
      { id: "generate-parentheses", title: "Generate Parentheses", link: "https://leetcode.com/problems/generate-parentheses/", difficulty: "Medium", topic: "Backtracking", pattern: "Track open/close counts." },
      { id: "n-queens", title: "N-Queens", link: "https://leetcode.com/problems/n-queens/", difficulty: "Hard", topic: "Backtracking", pattern: "Column + diagonal sets." },
      { id: "palindrome-partitioning", title: "Palindrome Partitioning", link: "https://leetcode.com/problems/palindrome-partitioning/", difficulty: "Medium", topic: "Backtracking", pattern: "Cut at each palindromic prefix." },
      { id: "implement-trie-prefix-tree", title: "Implement Trie (Prefix Tree)", link: "https://leetcode.com/problems/implement-trie-prefix-tree/", difficulty: "Medium", topic: "Trie / Design", pattern: "Children map + isEnd flag." },
      { id: "word-ladder", title: "Word Ladder", link: "https://leetcode.com/problems/word-ladder/", difficulty: "Hard", topic: "Graphs / BFS", pattern: "BFS over one-letter transforms." },
      { id: "pacific-atlantic-water-flow", title: "Pacific Atlantic Water Flow", link: "https://leetcode.com/problems/pacific-atlantic-water-flow/", difficulty: "Medium", topic: "Graphs / DFS", pattern: "DFS inward from both oceans." },
      { id: "number-of-provinces", title: "Number of Provinces", link: "https://leetcode.com/problems/number-of-provinces/", difficulty: "Medium", topic: "Union-Find", pattern: "Connected components / DSU." },
      { id: "edit-distance", title: "Edit Distance", link: "https://leetcode.com/problems/edit-distance/", difficulty: "Hard", topic: "DP", pattern: "2-D DP over insert/delete/replace." },
      { id: "longest-common-subsequence", title: "Longest Common Subsequence", link: "https://leetcode.com/problems/longest-common-subsequence/", difficulty: "Medium", topic: "DP", pattern: "Classic 2-D string DP." },
      { id: "partition-equal-subset-sum", title: "Partition Equal Subset Sum", link: "https://leetcode.com/problems/partition-equal-subset-sum/", difficulty: "Medium", topic: "DP", pattern: "0/1 knapsack on sum/2." },
      { id: "decode-ways", title: "Decode Ways", link: "https://leetcode.com/problems/decode-ways/", difficulty: "Medium", topic: "DP", pattern: "Fibonacci-style with validity checks." },
      { id: "jump-game", title: "Jump Game", link: "https://leetcode.com/problems/jump-game/", difficulty: "Medium", topic: "Greedy", pattern: "Track furthest reachable index." },
      { id: "gas-station", title: "Gas Station", link: "https://leetcode.com/problems/gas-station/", difficulty: "Medium", topic: "Greedy", pattern: "Reset start when tank goes negative." },
      { id: "task-scheduler", title: "Task Scheduler", link: "https://leetcode.com/problems/task-scheduler/", difficulty: "Medium", topic: "Greedy / Heap", pattern: "Fill idle slots around most frequent task." },
      { id: "daily-temperatures", title: "Daily Temperatures", link: "https://leetcode.com/problems/daily-temperatures/", difficulty: "Medium", topic: "Monotonic Stack", pattern: "Stack of indices awaiting a warmer day." },
      { id: "largest-rectangle-in-histogram", title: "Largest Rectangle in Histogram", link: "https://leetcode.com/problems/largest-rectangle-in-histogram/", difficulty: "Hard", topic: "Monotonic Stack", pattern: "Pop while shorter, compute width." },
      { id: "kth-smallest-element-in-a-bst", title: "Kth Smallest Element in a BST", link: "https://leetcode.com/problems/kth-smallest-element-in-a-bst/", difficulty: "Medium", topic: "Trees", pattern: "In-order traversal, stop at k." },
      { id: "insert-interval", title: "Insert Interval", link: "https://leetcode.com/problems/insert-interval/", difficulty: "Medium", topic: "Intervals", pattern: "Before / overlap / after partition." },
      { id: "non-overlapping-intervals", title: "Non-overlapping Intervals", link: "https://leetcode.com/problems/non-overlapping-intervals/", difficulty: "Medium", topic: "Greedy / Intervals", pattern: "Sort by end, count keepers." },
      { id: "time-based-key-value-store", title: "Time Based Key-Value Store", link: "https://leetcode.com/problems/time-based-key-value-store/", difficulty: "Medium", topic: "Design / Binary Search", pattern: "Per-key sorted list + binary search." },
      { id: "insert-delete-getrandom-o1", title: "Insert Delete GetRandom O(1)", link: "https://leetcode.com/problems/insert-delete-getrandom-o1/", difficulty: "Medium", topic: "Design", pattern: "Array + index map, swap-remove." },
    ],
  },
];

export const MOST_ASKED_PROBLEMS = MOST_ASKED_TIERS.flatMap((t) =>
  t.problems.map((p) => ({ ...p, tier: t.tier }))
);

export const MOST_ASKED_TOTAL = MOST_ASKED_PROBLEMS.length;
