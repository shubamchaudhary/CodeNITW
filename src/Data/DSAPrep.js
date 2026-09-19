// Curated interview DSA set — 361 problems targeting senior-SDE roles.
//
// `priority` (P0–P3) blends two measured signals, not judgement:
//
//   1. HOW OFTEN IT IS ASKED. Per-company LeetCode tag frequencies from
//      https://github.com/krishnadey30/LeetCode-Questions-CompanyWise across all
//      200 companies in that dataset, normalised per company, weighted toward
//      recent windows, and scaled by how many companies ask it. The top bucket
//      also requires breadth, so one company's favourite can't reach it alone.
//
//   2. WHETHER IT IS A TOPIC IN ITSELF. Blind 75 and NeetCode 150 are curated
//      for pattern coverage — each entry is the canonical representative of a
//      technique. Membership promotes a problem a bucket and floors it (Blind 75
//      never below P1, NeetCode 150 never below P2), because solving one teaches
//      a whole pattern even if it is asked less often.
//
// `pattern` names the technique a problem teaches; `core` marks the Blind 75
// minimal pattern-covering set.
//
// Regenerate with scripts/genDSAPriority.mjs — edit there, not here.

export const DSA_TOPICS = [
  {
    "topic": "Arrays and Two Pointers",
    "problems": [
      {
        "id": "two-sum",
        "title": "Two Sum",
        "link": "https://leetcode.com/problems/two-sum/",
        "difficulty": "Easy",
        "priority": "P0",
        "pattern": "Arrays & Hashing",
        "core": true
      },
      {
        "id": "best-time-to-buy-and-sell-stock",
        "title": "Best Time to Buy and Sell Stock",
        "link": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
        "difficulty": "Easy",
        "priority": "P0",
        "pattern": "Sliding Window",
        "core": true
      },
      {
        "id": "3sum",
        "title": "3Sum",
        "link": "https://leetcode.com/problems/3sum/",
        "difficulty": "Medium",
        "priority": "P0",
        "pattern": "Two Pointers",
        "core": true
      },
      {
        "id": "trapping-rain-water",
        "title": "Trapping Rain Water",
        "link": "https://leetcode.com/problems/trapping-rain-water/",
        "difficulty": "Hard",
        "priority": "P0",
        "pattern": "Two Pointers"
      },
      {
        "id": "merge-sorted-array",
        "title": "Merge Sorted Array",
        "link": "https://leetcode.com/problems/merge-sorted-array/",
        "difficulty": "Easy",
        "priority": "P0"
      },
      {
        "id": "move-zeroes",
        "title": "Move Zeroes",
        "link": "https://leetcode.com/problems/move-zeroes/",
        "difficulty": "Easy",
        "priority": "P0"
      },
      {
        "id": "valid-palindrome",
        "title": "Valid Palindrome",
        "link": "https://leetcode.com/problems/valid-palindrome/",
        "difficulty": "Easy",
        "priority": "P1",
        "pattern": "Two Pointers",
        "core": true
      },
      {
        "id": "longest-consecutive-sequence",
        "title": "Longest Consecutive Sequence",
        "link": "https://leetcode.com/problems/longest-consecutive-sequence/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Arrays & Hashing",
        "core": true
      },
      {
        "id": "container-with-most-water",
        "title": "Container With Most Water",
        "link": "https://leetcode.com/problems/container-with-most-water/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Two Pointers",
        "core": true
      },
      {
        "id": "contains-duplicate",
        "title": "Contains Duplicate",
        "link": "https://leetcode.com/problems/contains-duplicate/",
        "difficulty": "Easy",
        "priority": "P1",
        "pattern": "Arrays & Hashing",
        "core": true
      },
      {
        "id": "first-missing-positive",
        "title": "First Missing Positive",
        "link": "https://leetcode.com/problems/first-missing-positive/",
        "difficulty": "Hard",
        "priority": "P1"
      },
      {
        "id": "next-permutation",
        "title": "Next Permutation",
        "link": "https://leetcode.com/problems/next-permutation/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "find-first-and-last-position-of-element-in-sorted-array",
        "title": "Find First and Last Position of Element in Sorted Array",
        "link": "https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "summary-ranges",
        "title": "Summary Ranges",
        "link": "https://leetcode.com/problems/summary-ranges/",
        "difficulty": "Easy",
        "priority": "P1"
      },
      {
        "id": "squares-of-a-sorted-array",
        "title": "Squares of a Sorted Array",
        "link": "https://leetcode.com/problems/squares-of-a-sorted-array/",
        "difficulty": "Easy",
        "priority": "P1"
      },
      {
        "id": "sort-colors",
        "title": "Sort Colors",
        "link": "https://leetcode.com/problems/sort-colors/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "two-sum-ii-input-array-is-sorted",
        "title": "Two Sum II - Input Array Is Sorted",
        "link": "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/",
        "difficulty": "Medium",
        "priority": "P2",
        "pattern": "Two Pointers"
      },
      {
        "id": "backspace-string-compare",
        "title": "Backspace String Compare",
        "link": "https://leetcode.com/problems/backspace-string-compare/",
        "difficulty": "Easy",
        "priority": "P2"
      },
      {
        "id": "4sum",
        "title": "4Sum",
        "link": "https://leetcode.com/problems/4sum/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "3sum-closest",
        "title": "3Sum Closest",
        "link": "https://leetcode.com/problems/3sum-closest/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "best-time-to-buy-and-sell-stock-ii",
        "title": "Best Time to Buy and Sell Stock II",
        "link": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "majority-element-ii",
        "title": "Majority Element II",
        "link": "https://leetcode.com/problems/majority-element-ii/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "rotate-array",
        "title": "Rotate Array",
        "link": "https://leetcode.com/problems/rotate-array/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "boats-to-save-people",
        "title": "Boats to Save People",
        "link": "https://leetcode.com/problems/boats-to-save-people/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "find-all-duplicates-in-an-array",
        "title": "Find All Duplicates in an Array",
        "link": "https://leetcode.com/problems/find-all-duplicates-in-an-array/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "rank-teams-by-votes",
        "title": "Rank Teams by Votes",
        "link": "https://leetcode.com/problems/rank-teams-by-votes/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "remove-duplicates-from-sorted-array-ii",
        "title": "Remove Duplicates from Sorted Array II",
        "link": "https://leetcode.com/problems/remove-duplicates-from-sorted-array-ii/",
        "difficulty": "Medium",
        "priority": "P3"
      }
    ]
  },
  {
    "topic": "Sliding Window",
    "problems": [
      {
        "id": "longest-substring-without-repeating-characters",
        "title": "Longest Substring Without Repeating Characters",
        "link": "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
        "difficulty": "Medium",
        "priority": "P0",
        "pattern": "Sliding Window",
        "core": true
      },
      {
        "id": "minimum-window-substring",
        "title": "Minimum Window Substring",
        "link": "https://leetcode.com/problems/minimum-window-substring/",
        "difficulty": "Hard",
        "priority": "P0",
        "pattern": "Sliding Window",
        "core": true
      },
      {
        "id": "longest-repeating-character-replacement",
        "title": "Longest Repeating Character Replacement",
        "link": "https://leetcode.com/problems/longest-repeating-character-replacement/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Sliding Window",
        "core": true
      },
      {
        "id": "sliding-window-maximum",
        "title": "Sliding Window Maximum",
        "link": "https://leetcode.com/problems/sliding-window-maximum/",
        "difficulty": "Hard",
        "priority": "P1",
        "pattern": "Sliding Window"
      },
      {
        "id": "minimum-size-subarray-sum",
        "title": "Minimum Size Subarray Sum",
        "link": "https://leetcode.com/problems/minimum-size-subarray-sum/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "permutation-in-string",
        "title": "Permutation in String",
        "link": "https://leetcode.com/problems/permutation-in-string/",
        "difficulty": "Medium",
        "priority": "P2",
        "pattern": "Sliding Window"
      },
      {
        "id": "find-all-anagrams-in-a-string",
        "title": "Find All Anagrams in a String",
        "link": "https://leetcode.com/problems/find-all-anagrams-in-a-string/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "sliding-window-median",
        "title": "Sliding Window Median",
        "link": "https://leetcode.com/problems/sliding-window-median/",
        "difficulty": "Hard",
        "priority": "P2"
      },
      {
        "id": "subarray-product-less-than-k",
        "title": "Subarray Product Less Than K",
        "link": "https://leetcode.com/problems/subarray-product-less-than-k/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "max-consecutive-ones-iii",
        "title": "Max Consecutive Ones III",
        "link": "https://leetcode.com/problems/max-consecutive-ones-iii/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "subarrays-with-k-different-integers",
        "title": "Subarrays with K Different Integers",
        "link": "https://leetcode.com/problems/subarrays-with-k-different-integers/",
        "difficulty": "Hard",
        "priority": "P2"
      },
      {
        "id": "fruit-into-baskets",
        "title": "Fruits Into Baskets",
        "link": "https://leetcode.com/problems/fruit-into-baskets/",
        "difficulty": "Medium",
        "priority": "P2"
      }
    ]
  },
  {
    "topic": "Array Manipulation and Prefix Sums",
    "problems": [
      {
        "id": "product-of-array-except-self",
        "title": "Product of Array Except Self",
        "link": "https://leetcode.com/problems/product-of-array-except-self/",
        "difficulty": "Medium",
        "priority": "P0",
        "pattern": "Arrays & Hashing",
        "core": true
      },
      {
        "id": "maximum-subarray",
        "title": "Maximum Subarray",
        "link": "https://leetcode.com/problems/maximum-subarray/",
        "difficulty": "Medium",
        "priority": "P0",
        "pattern": "Greedy",
        "core": true
      },
      {
        "id": "maximum-product-subarray",
        "title": "Maximum Product Subarray",
        "link": "https://leetcode.com/problems/maximum-product-subarray/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "1-D Dynamic Programming",
        "core": true
      },
      {
        "id": "subarray-sum-equals-k",
        "title": "Subarray Sum Equals K",
        "link": "https://leetcode.com/problems/subarray-sum-equals-k/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "range-sum-query-2d-immutable",
        "title": "Range Sum Query 2D - Immutable",
        "link": "https://leetcode.com/problems/range-sum-query-2d-immutable/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "subarray-sums-divisible-by-k",
        "title": "Subarray Sums Divisible by K",
        "link": "https://leetcode.com/problems/subarray-sums-divisible-by-k/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "count-of-smaller-numbers-after-self",
        "title": "Count of Smaller Numbers After Self",
        "link": "https://leetcode.com/problems/count-of-smaller-numbers-after-self/",
        "difficulty": "Hard",
        "priority": "P2"
      },
      {
        "id": "reverse-pairs",
        "title": "Reverse Pairs",
        "link": "https://leetcode.com/problems/reverse-pairs/",
        "difficulty": "Hard",
        "priority": "P2"
      },
      {
        "id": "continuous-subarray-sum",
        "title": "Continuous Subarray Sum",
        "link": "https://leetcode.com/problems/continuous-subarray-sum/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "maximum-sum-circular-subarray",
        "title": "Maximum Sum Circular Subarray",
        "link": "https://leetcode.com/problems/maximum-sum-circular-subarray/",
        "difficulty": "Medium",
        "priority": "P3"
      },
      {
        "id": "range-sum-query-mutable",
        "title": "Range Sum Query - Mutable",
        "link": "https://leetcode.com/problems/range-sum-query-mutable/",
        "difficulty": "Medium",
        "priority": "P3"
      }
    ]
  },
  {
    "topic": "String Algorithms",
    "problems": [
      {
        "id": "group-anagrams",
        "title": "Group Anagrams",
        "link": "https://leetcode.com/problems/group-anagrams/",
        "difficulty": "Medium",
        "priority": "P0",
        "pattern": "Arrays & Hashing",
        "core": true
      },
      {
        "id": "longest-palindromic-substring",
        "title": "Longest Palindromic Substring",
        "link": "https://leetcode.com/problems/longest-palindromic-substring/",
        "difficulty": "Medium",
        "priority": "P0",
        "pattern": "1-D Dynamic Programming",
        "core": true
      },
      {
        "id": "integer-to-english-words",
        "title": "Integer to English Words",
        "link": "https://leetcode.com/problems/integer-to-english-words/",
        "difficulty": "Hard",
        "priority": "P0"
      },
      {
        "id": "decode-string",
        "title": "Decode String",
        "link": "https://leetcode.com/problems/decode-string/",
        "difficulty": "Medium",
        "priority": "P0"
      },
      {
        "id": "valid-anagram",
        "title": "Valid Anagram",
        "link": "https://leetcode.com/problems/valid-anagram/",
        "difficulty": "Easy",
        "priority": "P1",
        "pattern": "Arrays & Hashing",
        "core": true
      },
      {
        "id": "palindromic-substrings",
        "title": "Palindromic Substrings",
        "link": "https://leetcode.com/problems/palindromic-substrings/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "1-D Dynamic Programming",
        "core": true
      },
      {
        "id": "multiply-strings",
        "title": "Multiply Strings",
        "link": "https://leetcode.com/problems/multiply-strings/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Math & Geometry"
      },
      {
        "id": "text-justification",
        "title": "Text Justification",
        "link": "https://leetcode.com/problems/text-justification/",
        "difficulty": "Hard",
        "priority": "P1"
      },
      {
        "id": "string-compression",
        "title": "String Compression",
        "link": "https://leetcode.com/problems/string-compression/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "first-unique-character-in-a-string",
        "title": "First Unique Character in a String",
        "link": "https://leetcode.com/problems/first-unique-character-in-a-string/",
        "difficulty": "Easy",
        "priority": "P1"
      },
      {
        "id": "string-to-integer-atoi",
        "title": "String to Integer (atoi)",
        "link": "https://leetcode.com/problems/string-to-integer-atoi/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "roman-to-integer",
        "title": "Roman to Integer",
        "link": "https://leetcode.com/problems/roman-to-integer/",
        "difficulty": "Easy",
        "priority": "P1"
      },
      {
        "id": "compare-version-numbers",
        "title": "Compare Version Numbers",
        "link": "https://leetcode.com/problems/compare-version-numbers/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "reverse-string",
        "title": "Reverse String",
        "link": "https://leetcode.com/problems/reverse-string/",
        "difficulty": "Easy",
        "priority": "P2"
      },
      {
        "id": "longest-common-prefix",
        "title": "Longest Common Prefix",
        "link": "https://leetcode.com/problems/longest-common-prefix/",
        "difficulty": "Easy",
        "priority": "P2"
      },
      {
        "id": "isomorphic-strings",
        "title": "Isomorphic Strings",
        "link": "https://leetcode.com/problems/isomorphic-strings/",
        "difficulty": "Easy",
        "priority": "P2"
      },
      {
        "id": "word-pattern",
        "title": "Word Pattern",
        "link": "https://leetcode.com/problems/word-pattern/",
        "difficulty": "Easy",
        "priority": "P2"
      },
      {
        "id": "longest-duplicate-substring",
        "title": "Longest Duplicate Substring",
        "link": "https://leetcode.com/problems/longest-duplicate-substring/",
        "difficulty": "Hard",
        "priority": "P2"
      },
      {
        "id": "shortest-palindrome",
        "title": "Shortest Palindrome",
        "link": "https://leetcode.com/problems/shortest-palindrome/",
        "difficulty": "Hard",
        "priority": "P2"
      },
      {
        "id": "find-and-replace-in-string",
        "title": "Find And Replace in String",
        "link": "https://leetcode.com/problems/find-and-replace-in-string/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "expressive-words",
        "title": "Expressive Words",
        "link": "https://leetcode.com/problems/expressive-words/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "repeated-dna-sequences",
        "title": "Repeated DNA Sequences",
        "link": "https://leetcode.com/problems/repeated-dna-sequences/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "license-key-formatting",
        "title": "License Key Formatting",
        "link": "https://leetcode.com/problems/license-key-formatting/",
        "difficulty": "Easy",
        "priority": "P2"
      },
      {
        "id": "longest-palindromic-subsequence",
        "title": "Longest Palindromic Subsequence",
        "link": "https://leetcode.com/problems/longest-palindromic-subsequence/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "number-of-matching-subsequences",
        "title": "Number of Matching Subsequences",
        "link": "https://leetcode.com/problems/number-of-matching-subsequences/",
        "difficulty": "Medium",
        "priority": "P3"
      },
      {
        "id": "find-the-index-of-the-first-occurrence-in-a-string",
        "title": "Find the Index of the First Occurrence in a String",
        "link": "https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/",
        "difficulty": "Easy",
        "priority": "P3"
      }
    ]
  },
  {
    "topic": "Linked Lists",
    "problems": [
      {
        "id": "reverse-linked-list",
        "title": "Reverse Linked List",
        "link": "https://leetcode.com/problems/reverse-linked-list/",
        "difficulty": "Easy",
        "priority": "P0",
        "pattern": "Linked List",
        "core": true
      },
      {
        "id": "merge-k-sorted-lists",
        "title": "Merge k Sorted Lists",
        "link": "https://leetcode.com/problems/merge-k-sorted-lists/",
        "difficulty": "Hard",
        "priority": "P0",
        "pattern": "Linked List",
        "core": true
      },
      {
        "id": "merge-two-sorted-lists",
        "title": "Merge Two Sorted Lists",
        "link": "https://leetcode.com/problems/merge-two-sorted-lists/",
        "difficulty": "Easy",
        "priority": "P0",
        "pattern": "Linked List",
        "core": true
      },
      {
        "id": "add-two-numbers",
        "title": "Add Two Numbers",
        "link": "https://leetcode.com/problems/add-two-numbers/",
        "difficulty": "Medium",
        "priority": "P0",
        "pattern": "Linked List"
      },
      {
        "id": "reorder-list",
        "title": "Reorder List",
        "link": "https://leetcode.com/problems/reorder-list/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Linked List",
        "core": true
      },
      {
        "id": "linked-list-cycle",
        "title": "Linked List Cycle",
        "link": "https://leetcode.com/problems/linked-list-cycle/",
        "difficulty": "Easy",
        "priority": "P1",
        "pattern": "Linked List",
        "core": true
      },
      {
        "id": "remove-nth-node-from-end-of-list",
        "title": "Remove Nth Node From End of List",
        "link": "https://leetcode.com/problems/remove-nth-node-from-end-of-list/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Linked List",
        "core": true
      },
      {
        "id": "copy-list-with-random-pointer",
        "title": "Copy List with Random Pointer",
        "link": "https://leetcode.com/problems/copy-list-with-random-pointer/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Linked List"
      },
      {
        "id": "reverse-nodes-in-k-group",
        "title": "Reverse Nodes in k-Group",
        "link": "https://leetcode.com/problems/reverse-nodes-in-k-group/",
        "difficulty": "Hard",
        "priority": "P1",
        "pattern": "Linked List"
      },
      {
        "id": "intersection-of-two-linked-lists",
        "title": "Intersection of Two Linked Lists",
        "link": "https://leetcode.com/problems/intersection-of-two-linked-lists/",
        "difficulty": "Easy",
        "priority": "P1"
      },
      {
        "id": "reverse-linked-list-ii",
        "title": "Reverse Linked List II",
        "link": "https://leetcode.com/problems/reverse-linked-list-ii/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "add-two-numbers-ii",
        "title": "Add Two Numbers II",
        "link": "https://leetcode.com/problems/add-two-numbers-ii/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "palindrome-linked-list",
        "title": "Palindrome Linked List",
        "link": "https://leetcode.com/problems/palindrome-linked-list/",
        "difficulty": "Easy",
        "priority": "P1"
      },
      {
        "id": "find-the-duplicate-number",
        "title": "Find the Duplicate Number",
        "link": "https://leetcode.com/problems/find-the-duplicate-number/",
        "difficulty": "Medium",
        "priority": "P2",
        "pattern": "Linked List"
      },
      {
        "id": "sort-list",
        "title": "Sort List",
        "link": "https://leetcode.com/problems/sort-list/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "rotate-list",
        "title": "Rotate List",
        "link": "https://leetcode.com/problems/rotate-list/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "middle-of-the-linked-list",
        "title": "Middle of the Linked List",
        "link": "https://leetcode.com/problems/middle-of-the-linked-list/",
        "difficulty": "Easy",
        "priority": "P3"
      },
      {
        "id": "linked-list-cycle-ii",
        "title": "Linked List Cycle II",
        "link": "https://leetcode.com/problems/linked-list-cycle-ii/",
        "difficulty": "Medium",
        "priority": "P3"
      }
    ]
  },
  {
    "topic": "Stack and Queue",
    "problems": [
      {
        "id": "valid-parentheses",
        "title": "Valid Parentheses",
        "link": "https://leetcode.com/problems/valid-parentheses/",
        "difficulty": "Easy",
        "priority": "P0",
        "pattern": "Stack",
        "core": true
      },
      {
        "id": "min-stack",
        "title": "Min Stack",
        "link": "https://leetcode.com/problems/min-stack/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Stack"
      },
      {
        "id": "evaluate-reverse-polish-notation",
        "title": "Evaluate Reverse Polish Notation",
        "link": "https://leetcode.com/problems/evaluate-reverse-polish-notation/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Stack"
      },
      {
        "id": "basic-calculator",
        "title": "Basic Calculator",
        "link": "https://leetcode.com/problems/basic-calculator/",
        "difficulty": "Hard",
        "priority": "P1"
      },
      {
        "id": "basic-calculator-ii",
        "title": "Basic Calculator II",
        "link": "https://leetcode.com/problems/basic-calculator-ii/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "maximal-rectangle",
        "title": "Maximal Rectangle",
        "link": "https://leetcode.com/problems/maximal-rectangle/",
        "difficulty": "Hard",
        "priority": "P1"
      },
      {
        "id": "asteroid-collision",
        "title": "Asteroid Collision",
        "link": "https://leetcode.com/problems/asteroid-collision/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "exclusive-time-of-functions",
        "title": "Exclusive Time of Functions",
        "link": "https://leetcode.com/problems/exclusive-time-of-functions/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "simplify-path",
        "title": "Simplify Path",
        "link": "https://leetcode.com/problems/simplify-path/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "daily-temperatures",
        "title": "Daily Temperatures",
        "link": "https://leetcode.com/problems/daily-temperatures/",
        "difficulty": "Medium",
        "priority": "P2",
        "pattern": "Stack"
      },
      {
        "id": "largest-rectangle-in-histogram",
        "title": "Largest Rectangle in Histogram",
        "link": "https://leetcode.com/problems/largest-rectangle-in-histogram/",
        "difficulty": "Hard",
        "priority": "P2",
        "pattern": "Stack"
      },
      {
        "id": "car-fleet",
        "title": "Car Fleet",
        "link": "https://leetcode.com/problems/car-fleet/",
        "difficulty": "Medium",
        "priority": "P2",
        "pattern": "Stack"
      },
      {
        "id": "implement-queue-using-stacks",
        "title": "Implement Queue using Stacks",
        "link": "https://leetcode.com/problems/implement-queue-using-stacks/",
        "difficulty": "Easy",
        "priority": "P2"
      },
      {
        "id": "remove-k-digits",
        "title": "Remove K Digits",
        "link": "https://leetcode.com/problems/remove-k-digits/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "maximum-frequency-stack",
        "title": "Maximum Frequency Stack",
        "link": "https://leetcode.com/problems/maximum-frequency-stack/",
        "difficulty": "Hard",
        "priority": "P2"
      },
      {
        "id": "remove-duplicate-letters",
        "title": "Remove Duplicate Letters",
        "link": "https://leetcode.com/problems/remove-duplicate-letters/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "next-greater-element-ii",
        "title": "Next Greater Element II",
        "link": "https://leetcode.com/problems/next-greater-element-ii/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "sum-of-subarray-minimums",
        "title": "Sum of Subarray Minimums",
        "link": "https://leetcode.com/problems/sum-of-subarray-minimums/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "132-pattern",
        "title": "132 Pattern",
        "link": "https://leetcode.com/problems/132-pattern/",
        "difficulty": "Medium",
        "priority": "P3"
      },
      {
        "id": "online-stock-span",
        "title": "Online Stock Span",
        "link": "https://leetcode.com/problems/online-stock-span/",
        "difficulty": "Medium",
        "priority": "P3"
      }
    ]
  },
  {
    "topic": "Trees - Basic and Traversal",
    "problems": [
      {
        "id": "binary-tree-level-order-traversal",
        "title": "Binary Tree Level Order Traversal",
        "link": "https://leetcode.com/problems/binary-tree-level-order-traversal/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Trees",
        "core": true
      },
      {
        "id": "invert-binary-tree",
        "title": "Invert Binary Tree",
        "link": "https://leetcode.com/problems/invert-binary-tree/",
        "difficulty": "Easy",
        "priority": "P1",
        "pattern": "Trees",
        "core": true
      },
      {
        "id": "maximum-depth-of-binary-tree",
        "title": "Maximum Depth of Binary Tree",
        "link": "https://leetcode.com/problems/maximum-depth-of-binary-tree/",
        "difficulty": "Easy",
        "priority": "P1",
        "pattern": "Trees",
        "core": true
      },
      {
        "id": "same-tree",
        "title": "Same Tree",
        "link": "https://leetcode.com/problems/same-tree/",
        "difficulty": "Easy",
        "priority": "P1",
        "pattern": "Trees",
        "core": true
      },
      {
        "id": "binary-tree-right-side-view",
        "title": "Binary Tree Right Side View",
        "link": "https://leetcode.com/problems/binary-tree-right-side-view/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Trees"
      },
      {
        "id": "binary-tree-zigzag-level-order-traversal",
        "title": "Binary Tree Zigzag Level Order Traversal",
        "link": "https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "vertical-order-traversal-of-a-binary-tree",
        "title": "Vertical Order Traversal of a Binary Tree",
        "link": "https://leetcode.com/problems/vertical-order-traversal-of-a-binary-tree/",
        "difficulty": "Hard",
        "priority": "P1"
      },
      {
        "id": "symmetric-tree",
        "title": "Symmetric Tree",
        "link": "https://leetcode.com/problems/symmetric-tree/",
        "difficulty": "Easy",
        "priority": "P2"
      },
      {
        "id": "maximum-width-of-binary-tree",
        "title": "Maximum Width of Binary Tree",
        "link": "https://leetcode.com/problems/maximum-width-of-binary-tree/",
        "difficulty": "Medium",
        "priority": "P2"
      }
    ]
  },
  {
    "topic": "Trees - Advanced Properties",
    "problems": [
      {
        "id": "lowest-common-ancestor-of-a-binary-tree",
        "title": "Lowest Common Ancestor of a Binary Tree",
        "link": "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/",
        "difficulty": "Medium",
        "priority": "P0"
      },
      {
        "id": "binary-tree-maximum-path-sum",
        "title": "Binary Tree Maximum Path Sum",
        "link": "https://leetcode.com/problems/binary-tree-maximum-path-sum/",
        "difficulty": "Hard",
        "priority": "P1",
        "pattern": "Trees",
        "core": true
      },
      {
        "id": "subtree-of-another-tree",
        "title": "Subtree of Another Tree",
        "link": "https://leetcode.com/problems/subtree-of-another-tree/",
        "difficulty": "Easy",
        "priority": "P1",
        "pattern": "Trees",
        "core": true
      },
      {
        "id": "diameter-of-binary-tree",
        "title": "Diameter of Binary Tree",
        "link": "https://leetcode.com/problems/diameter-of-binary-tree/",
        "difficulty": "Easy",
        "priority": "P1",
        "pattern": "Trees"
      },
      {
        "id": "all-nodes-distance-k-in-binary-tree",
        "title": "All Nodes Distance K in Binary Tree",
        "link": "https://leetcode.com/problems/all-nodes-distance-k-in-binary-tree/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "balanced-binary-tree",
        "title": "Balanced Binary Tree",
        "link": "https://leetcode.com/problems/balanced-binary-tree/",
        "difficulty": "Easy",
        "priority": "P2",
        "pattern": "Trees"
      },
      {
        "id": "count-good-nodes-in-binary-tree",
        "title": "Count Good Nodes in Binary Tree",
        "link": "https://leetcode.com/problems/count-good-nodes-in-binary-tree/",
        "difficulty": "Medium",
        "priority": "P2",
        "pattern": "Trees"
      },
      {
        "id": "path-sum-iii",
        "title": "Path Sum III",
        "link": "https://leetcode.com/problems/path-sum-iii/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "path-sum-ii",
        "title": "Path Sum II",
        "link": "https://leetcode.com/problems/path-sum-ii/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "count-complete-tree-nodes",
        "title": "Count Complete Tree Nodes",
        "link": "https://leetcode.com/problems/count-complete-tree-nodes/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "find-duplicate-subtrees",
        "title": "Find Duplicate Subtrees",
        "link": "https://leetcode.com/problems/find-duplicate-subtrees/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "sum-root-to-leaf-numbers",
        "title": "Sum Root to Leaf Numbers",
        "link": "https://leetcode.com/problems/sum-root-to-leaf-numbers/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "house-robber-iii",
        "title": "House Robber III",
        "link": "https://leetcode.com/problems/house-robber-iii/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "longest-univalue-path",
        "title": "Longest Univalue Path",
        "link": "https://leetcode.com/problems/longest-univalue-path/",
        "difficulty": "Medium",
        "priority": "P3"
      },
      {
        "id": "sum-of-distances-in-tree",
        "title": "Sum of Distances in Tree",
        "link": "https://leetcode.com/problems/sum-of-distances-in-tree/",
        "difficulty": "Hard",
        "priority": "P3"
      },
      {
        "id": "step-by-step-directions-from-a-binary-tree-node-to-another",
        "title": "Step-By-Step Directions From a Binary Tree Node to Another",
        "link": "https://leetcode.com/problems/step-by-step-directions-from-a-binary-tree-node-to-another/",
        "difficulty": "Medium",
        "priority": "P3"
      },
      {
        "id": "amount-of-time-for-binary-tree-to-be-infected",
        "title": "Amount of Time for Binary Tree to Be Infected",
        "link": "https://leetcode.com/problems/amount-of-time-for-binary-tree-to-be-infected/",
        "difficulty": "Medium",
        "priority": "P3"
      },
      {
        "id": "longest-path-with-different-adjacent-characters",
        "title": "Longest Path With Different Adjacent Characters",
        "link": "https://leetcode.com/problems/longest-path-with-different-adjacent-characters/",
        "difficulty": "Hard",
        "priority": "P3"
      }
    ]
  },
  {
    "topic": "Trees - Construction and Modification",
    "problems": [
      {
        "id": "serialize-and-deserialize-binary-tree",
        "title": "Serialize and Deserialize Binary Tree",
        "link": "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/",
        "difficulty": "Hard",
        "priority": "P1",
        "pattern": "Trees",
        "core": true
      },
      {
        "id": "construct-binary-tree-from-preorder-and-inorder-traversal",
        "title": "Construct Binary Tree from Preorder and Inorder Traversal",
        "link": "https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Trees",
        "core": true
      },
      {
        "id": "populating-next-right-pointers-in-each-node",
        "title": "Populate Next Right Pointers in Each Node",
        "link": "https://leetcode.com/problems/populating-next-right-pointers-in-each-node/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "flatten-binary-tree-to-linked-list",
        "title": "Flatten Binary Tree to Linked List",
        "link": "https://leetcode.com/problems/flatten-binary-tree-to-linked-list/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "delete-nodes-and-return-forest",
        "title": "Delete Nodes And Return Forest",
        "link": "https://leetcode.com/problems/delete-nodes-and-return-forest/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "construct-binary-tree-from-inorder-and-postorder-traversal",
        "title": "Construct Binary Tree from Inorder and Postorder Traversal",
        "link": "https://leetcode.com/problems/construct-binary-tree-from-inorder-and-postorder-traversal/",
        "difficulty": "Medium",
        "priority": "P3"
      }
    ]
  },
  {
    "topic": "Binary Search Trees",
    "problems": [
      {
        "id": "validate-binary-search-tree",
        "title": "Validate Binary Search Tree",
        "link": "https://leetcode.com/problems/validate-binary-search-tree/",
        "difficulty": "Medium",
        "priority": "P0",
        "pattern": "Trees",
        "core": true
      },
      {
        "id": "kth-smallest-element-in-a-bst",
        "title": "Kth Smallest Element in BST",
        "link": "https://leetcode.com/problems/kth-smallest-element-in-a-bst/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Trees",
        "core": true
      },
      {
        "id": "lowest-common-ancestor-of-a-binary-search-tree",
        "title": "Lowest Common Ancestor of BST",
        "link": "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Trees",
        "core": true
      },
      {
        "id": "binary-search-tree-iterator",
        "title": "Binary Search Tree Iterator",
        "link": "https://leetcode.com/problems/binary-search-tree-iterator/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "serialize-and-deserialize-bst",
        "title": "Serialize and Deserialize BST",
        "link": "https://leetcode.com/problems/serialize-and-deserialize-bst/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "delete-node-in-a-bst",
        "title": "Delete Node in BST",
        "link": "https://leetcode.com/problems/delete-node-in-a-bst/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "insert-into-a-binary-search-tree",
        "title": "Insert into BST",
        "link": "https://leetcode.com/problems/insert-into-a-binary-search-tree/",
        "difficulty": "Medium",
        "priority": "P3"
      }
    ]
  },
  {
    "topic": "Heap and Priority Queue",
    "problems": [
      {
        "id": "find-median-from-data-stream",
        "title": "Find Median from Data Stream",
        "link": "https://leetcode.com/problems/find-median-from-data-stream/",
        "difficulty": "Hard",
        "priority": "P0",
        "pattern": "Heap / Priority Queue",
        "core": true
      },
      {
        "id": "top-k-frequent-elements",
        "title": "Top K Frequent Elements",
        "link": "https://leetcode.com/problems/top-k-frequent-elements/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Arrays & Hashing",
        "core": true
      },
      {
        "id": "k-closest-points-to-origin",
        "title": "K Closest Points to Origin",
        "link": "https://leetcode.com/problems/k-closest-points-to-origin/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Heap / Priority Queue"
      },
      {
        "id": "kth-largest-element-in-an-array",
        "title": "Kth Largest Element in Array",
        "link": "https://leetcode.com/problems/kth-largest-element-in-an-array/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Heap / Priority Queue"
      },
      {
        "id": "top-k-frequent-words",
        "title": "Top K Frequent Words",
        "link": "https://leetcode.com/problems/top-k-frequent-words/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "the-skyline-problem",
        "title": "The Skyline Problem",
        "link": "https://leetcode.com/problems/the-skyline-problem/",
        "difficulty": "Hard",
        "priority": "P1"
      },
      {
        "id": "reorganize-string",
        "title": "Reorganize String",
        "link": "https://leetcode.com/problems/reorganize-string/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "trapping-rain-water-ii",
        "title": "Trapping Rain Water II",
        "link": "https://leetcode.com/problems/trapping-rain-water-ii/",
        "difficulty": "Hard",
        "priority": "P1"
      },
      {
        "id": "kth-largest-element-in-a-stream",
        "title": "Kth Largest Element in a Stream",
        "link": "https://leetcode.com/problems/kth-largest-element-in-a-stream/",
        "difficulty": "Easy",
        "priority": "P2",
        "pattern": "Heap / Priority Queue"
      },
      {
        "id": "task-scheduler",
        "title": "Task Scheduler",
        "link": "https://leetcode.com/problems/task-scheduler/",
        "difficulty": "Medium",
        "priority": "P2",
        "pattern": "Heap / Priority Queue"
      },
      {
        "id": "last-stone-weight",
        "title": "Last Stone Weight",
        "link": "https://leetcode.com/problems/last-stone-weight/",
        "difficulty": "Easy",
        "priority": "P2",
        "pattern": "Heap / Priority Queue"
      },
      {
        "id": "smallest-range-covering-elements-from-k-lists",
        "title": "Smallest Range Covering Elements from K Lists",
        "link": "https://leetcode.com/problems/smallest-range-covering-elements-from-k-lists/",
        "difficulty": "Hard",
        "priority": "P2"
      },
      {
        "id": "minimum-number-of-refueling-stops",
        "title": "Minimum Number of Refueling Stops",
        "link": "https://leetcode.com/problems/minimum-number-of-refueling-stops/",
        "difficulty": "Hard",
        "priority": "P2"
      },
      {
        "id": "minimum-cost-to-hire-k-workers",
        "title": "Minimum Cost to Hire K Workers",
        "link": "https://leetcode.com/problems/minimum-cost-to-hire-k-workers/",
        "difficulty": "Hard",
        "priority": "P3"
      },
      {
        "id": "car-pooling",
        "title": "Car Pooling",
        "link": "https://leetcode.com/problems/car-pooling/",
        "difficulty": "Medium",
        "priority": "P3"
      },
      {
        "id": "single-threaded-cpu",
        "title": "Single-Threaded CPU",
        "link": "https://leetcode.com/problems/single-threaded-cpu/",
        "difficulty": "Medium",
        "priority": "P3"
      },
      {
        "id": "furthest-building-you-can-reach",
        "title": "Furthest Building You Can Reach",
        "link": "https://leetcode.com/problems/furthest-building-you-can-reach/",
        "difficulty": "Medium",
        "priority": "P3"
      },
      {
        "id": "meeting-rooms-iii",
        "title": "Meeting Rooms III",
        "link": "https://leetcode.com/problems/meeting-rooms-iii/",
        "difficulty": "Hard",
        "priority": "P3"
      },
      {
        "id": "ipo",
        "title": "IPO",
        "link": "https://leetcode.com/problems/ipo/",
        "difficulty": "Hard",
        "priority": "P3"
      }
    ]
  },
  {
    "topic": "Binary Search",
    "problems": [
      {
        "id": "search-in-rotated-sorted-array",
        "title": "Search in Rotated Sorted Array",
        "link": "https://leetcode.com/problems/search-in-rotated-sorted-array/",
        "difficulty": "Medium",
        "priority": "P0",
        "pattern": "Binary Search",
        "core": true
      },
      {
        "id": "median-of-two-sorted-arrays",
        "title": "Median of Two Sorted Arrays",
        "link": "https://leetcode.com/problems/median-of-two-sorted-arrays/",
        "difficulty": "Hard",
        "priority": "P0",
        "pattern": "Binary Search"
      },
      {
        "id": "find-minimum-in-rotated-sorted-array",
        "title": "Find Minimum in Rotated Sorted Array",
        "link": "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Binary Search",
        "core": true
      },
      {
        "id": "search-a-2d-matrix-ii",
        "title": "Search a 2D Matrix II",
        "link": "https://leetcode.com/problems/search-a-2d-matrix-ii/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "search-a-2d-matrix",
        "title": "Search a 2D Matrix",
        "link": "https://leetcode.com/problems/search-a-2d-matrix/",
        "difficulty": "Medium",
        "priority": "P2",
        "pattern": "Binary Search"
      },
      {
        "id": "koko-eating-bananas",
        "title": "Koko Eating Bananas",
        "link": "https://leetcode.com/problems/koko-eating-bananas/",
        "difficulty": "Medium",
        "priority": "P2",
        "pattern": "Binary Search"
      },
      {
        "id": "binary-search",
        "title": "Binary Search",
        "link": "https://leetcode.com/problems/binary-search/",
        "difficulty": "Easy",
        "priority": "P2",
        "pattern": "Binary Search"
      },
      {
        "id": "find-k-closest-elements",
        "title": "Find K Closest Elements",
        "link": "https://leetcode.com/problems/find-k-closest-elements/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "find-peak-element",
        "title": "Find Peak Element",
        "link": "https://leetcode.com/problems/find-peak-element/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "single-element-in-a-sorted-array",
        "title": "Single Element in a Sorted Array",
        "link": "https://leetcode.com/problems/single-element-in-a-sorted-array/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "kth-smallest-element-in-a-sorted-matrix",
        "title": "Kth Smallest Element in a Sorted Matrix",
        "link": "https://leetcode.com/problems/kth-smallest-element-in-a-sorted-matrix/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "sqrtx",
        "title": "Sqrt(x)",
        "link": "https://leetcode.com/problems/sqrtx/",
        "difficulty": "Easy",
        "priority": "P2"
      },
      {
        "id": "split-array-largest-sum",
        "title": "Split Array Largest Sum",
        "link": "https://leetcode.com/problems/split-array-largest-sum/",
        "difficulty": "Hard",
        "priority": "P2"
      },
      {
        "id": "capacity-to-ship-packages-within-d-days",
        "title": "Capacity To Ship Packages Within D Days",
        "link": "https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "search-in-rotated-sorted-array-ii",
        "title": "Search in Rotated Sorted Array II",
        "link": "https://leetcode.com/problems/search-in-rotated-sorted-array-ii/",
        "difficulty": "Medium",
        "priority": "P3"
      },
      {
        "id": "find-k-th-smallest-pair-distance",
        "title": "Find K-th Smallest Pair Distance",
        "link": "https://leetcode.com/problems/find-k-th-smallest-pair-distance/",
        "difficulty": "Hard",
        "priority": "P3"
      }
    ]
  },
  {
    "topic": "Dynamic Programming - 1D",
    "problems": [
      {
        "id": "word-break",
        "title": "Word Break",
        "link": "https://leetcode.com/problems/word-break/",
        "difficulty": "Medium",
        "priority": "P0",
        "pattern": "1-D Dynamic Programming",
        "core": true
      },
      {
        "id": "coin-change",
        "title": "Coin Change",
        "link": "https://leetcode.com/problems/coin-change/",
        "difficulty": "Medium",
        "priority": "P0",
        "pattern": "1-D Dynamic Programming",
        "core": true
      },
      {
        "id": "decode-ways",
        "title": "Decode Ways",
        "link": "https://leetcode.com/problems/decode-ways/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "1-D Dynamic Programming",
        "core": true
      },
      {
        "id": "house-robber",
        "title": "House Robber",
        "link": "https://leetcode.com/problems/house-robber/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "1-D Dynamic Programming",
        "core": true
      },
      {
        "id": "longest-increasing-subsequence",
        "title": "Longest Increasing Subsequence",
        "link": "https://leetcode.com/problems/longest-increasing-subsequence/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "1-D Dynamic Programming",
        "core": true
      },
      {
        "id": "jump-game",
        "title": "Jump Game",
        "link": "https://leetcode.com/problems/jump-game/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Greedy",
        "core": true
      },
      {
        "id": "climbing-stairs",
        "title": "Climbing Stairs",
        "link": "https://leetcode.com/problems/climbing-stairs/",
        "difficulty": "Easy",
        "priority": "P1",
        "pattern": "1-D Dynamic Programming",
        "core": true
      },
      {
        "id": "house-robber-ii",
        "title": "House Robber II",
        "link": "https://leetcode.com/problems/house-robber-ii/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "1-D Dynamic Programming",
        "core": true
      },
      {
        "id": "combination-sum-iv",
        "title": "Combination Sum IV",
        "link": "https://leetcode.com/problems/combination-sum-iv/",
        "difficulty": "Medium",
        "priority": "P1",
        "core": true
      },
      {
        "id": "jump-game-ii",
        "title": "Jump Game II",
        "link": "https://leetcode.com/problems/jump-game-ii/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Greedy"
      },
      {
        "id": "longest-string-chain",
        "title": "Longest String Chain",
        "link": "https://leetcode.com/problems/longest-string-chain/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "word-break-ii",
        "title": "Word Break II",
        "link": "https://leetcode.com/problems/word-break-ii/",
        "difficulty": "Hard",
        "priority": "P1"
      },
      {
        "id": "min-cost-climbing-stairs",
        "title": "Min Cost Climbing Stairs",
        "link": "https://leetcode.com/problems/min-cost-climbing-stairs/",
        "difficulty": "Easy",
        "priority": "P2",
        "pattern": "1-D Dynamic Programming"
      },
      {
        "id": "coin-change-2",
        "title": "Coin Change 2",
        "link": "https://leetcode.com/problems/coin-change-2/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "minimum-cost-for-tickets",
        "title": "Minimum Cost For Tickets",
        "link": "https://leetcode.com/problems/minimum-cost-for-tickets/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "number-of-longest-increasing-subsequence",
        "title": "Number of Longest Increasing Subsequence",
        "link": "https://leetcode.com/problems/number-of-longest-increasing-subsequence/",
        "difficulty": "Medium",
        "priority": "P3"
      },
      {
        "id": "flip-string-to-monotone-increasing",
        "title": "Flip String to Monotone Increasing",
        "link": "https://leetcode.com/problems/flip-string-to-monotone-increasing/",
        "difficulty": "Medium",
        "priority": "P3"
      }
    ]
  },
  {
    "topic": "Dynamic Programming - 2D",
    "problems": [
      {
        "id": "longest-common-subsequence",
        "title": "Longest Common Subsequence",
        "link": "https://leetcode.com/problems/longest-common-subsequence/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "2-D Dynamic Programming",
        "core": true
      },
      {
        "id": "unique-paths",
        "title": "Unique Paths",
        "link": "https://leetcode.com/problems/unique-paths/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "2-D Dynamic Programming",
        "core": true
      },
      {
        "id": "regular-expression-matching",
        "title": "Regular Expression Matching",
        "link": "https://leetcode.com/problems/regular-expression-matching/",
        "difficulty": "Hard",
        "priority": "P1",
        "pattern": "2-D Dynamic Programming"
      },
      {
        "id": "edit-distance",
        "title": "Edit Distance",
        "link": "https://leetcode.com/problems/edit-distance/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "2-D Dynamic Programming"
      },
      {
        "id": "interleaving-string",
        "title": "Interleaving String",
        "link": "https://leetcode.com/problems/interleaving-string/",
        "difficulty": "Hard",
        "priority": "P1",
        "pattern": "2-D Dynamic Programming"
      },
      {
        "id": "cherry-pickup",
        "title": "Cherry Pickup",
        "link": "https://leetcode.com/problems/cherry-pickup/",
        "difficulty": "Hard",
        "priority": "P1"
      },
      {
        "id": "maximal-square",
        "title": "Maximum Square",
        "link": "https://leetcode.com/problems/maximal-square/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "distinct-subsequences",
        "title": "Distinct Subsequences",
        "link": "https://leetcode.com/problems/distinct-subsequences/",
        "difficulty": "Hard",
        "priority": "P2",
        "pattern": "2-D Dynamic Programming"
      },
      {
        "id": "partition-equal-subset-sum",
        "title": "Partition Equal Subset Sum",
        "link": "https://leetcode.com/problems/partition-equal-subset-sum/",
        "difficulty": "Medium",
        "priority": "P2",
        "pattern": "1-D Dynamic Programming"
      },
      {
        "id": "target-sum",
        "title": "Target Sum",
        "link": "https://leetcode.com/problems/target-sum/",
        "difficulty": "Medium",
        "priority": "P2",
        "pattern": "2-D Dynamic Programming"
      },
      {
        "id": "best-time-to-buy-and-sell-stock-with-cooldown",
        "title": "Best Time to Buy and Sell Stock with Cooldown",
        "link": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/",
        "difficulty": "Medium",
        "priority": "P2",
        "pattern": "2-D Dynamic Programming"
      },
      {
        "id": "coin-change-ii",
        "title": "Coin Change II",
        "link": "https://leetcode.com/problems/coin-change-ii/",
        "difficulty": "Medium",
        "priority": "P2",
        "pattern": "2-D Dynamic Programming"
      },
      {
        "id": "knight-dialer",
        "title": "Knight Dialer",
        "link": "https://leetcode.com/problems/knight-dialer/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "wildcard-matching",
        "title": "Wildcard Matching",
        "link": "https://leetcode.com/problems/wildcard-matching/",
        "difficulty": "Hard",
        "priority": "P2"
      },
      {
        "id": "minimum-path-sum",
        "title": "Minimum Path Sum",
        "link": "https://leetcode.com/problems/minimum-path-sum/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "unique-paths-ii",
        "title": "Unique Paths II",
        "link": "https://leetcode.com/problems/unique-paths-ii/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "best-time-to-buy-and-sell-stock-iii",
        "title": "Best Time to Buy and Sell Stock III",
        "link": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iii/",
        "difficulty": "Hard",
        "priority": "P2"
      },
      {
        "id": "best-time-to-buy-and-sell-stock-iv",
        "title": "Best Time to Buy and Sell Stock IV",
        "link": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iv/",
        "difficulty": "Hard",
        "priority": "P2"
      },
      {
        "id": "number-of-dice-rolls-with-target-sum",
        "title": "Number of Dice Rolls With Target Sum",
        "link": "https://leetcode.com/problems/number-of-dice-rolls-with-target-sum/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "dungeon-game",
        "title": "Dungeon Game",
        "link": "https://leetcode.com/problems/dungeon-game/",
        "difficulty": "Hard",
        "priority": "P3"
      },
      {
        "id": "maximum-number-of-points-with-cost",
        "title": "Maximum Number of Points with Cost",
        "link": "https://leetcode.com/problems/maximum-number-of-points-with-cost/",
        "difficulty": "Medium",
        "priority": "P3"
      }
    ]
  },
  {
    "topic": "Dynamic Programming - Advanced",
    "problems": [
      {
        "id": "burst-balloons",
        "title": "Burst Balloons",
        "link": "https://leetcode.com/problems/burst-balloons/",
        "difficulty": "Hard",
        "priority": "P2",
        "pattern": "2-D Dynamic Programming"
      },
      {
        "id": "longest-valid-parentheses",
        "title": "Longest Valid Parentheses",
        "link": "https://leetcode.com/problems/longest-valid-parentheses/",
        "difficulty": "Hard",
        "priority": "P2"
      },
      {
        "id": "maximum-profit-in-job-scheduling",
        "title": "Maximum Profit in Job Scheduling",
        "link": "https://leetcode.com/problems/maximum-profit-in-job-scheduling/",
        "difficulty": "Hard",
        "priority": "P2"
      },
      {
        "id": "russian-doll-envelopes",
        "title": "Russian Doll Envelopes",
        "link": "https://leetcode.com/problems/russian-doll-envelopes/",
        "difficulty": "Hard",
        "priority": "P3"
      },
      {
        "id": "minimum-difficulty-of-a-job-schedule",
        "title": "Minimum Difficulty of a Job Schedule",
        "link": "https://leetcode.com/problems/minimum-difficulty-of-a-job-schedule/",
        "difficulty": "Hard",
        "priority": "P3"
      },
      {
        "id": "palindrome-partitioning-ii",
        "title": "Palindrome Partitioning II",
        "link": "https://leetcode.com/problems/palindrome-partitioning-ii/",
        "difficulty": "Hard",
        "priority": "P3"
      }
    ]
  },
  {
    "topic": "Graphs - Basic Traversal",
    "problems": [
      {
        "id": "number-of-islands",
        "title": "Number of Islands",
        "link": "https://leetcode.com/problems/number-of-islands/",
        "difficulty": "Medium",
        "priority": "P0",
        "pattern": "Graphs",
        "core": true
      },
      {
        "id": "word-ladder",
        "title": "Word Ladder",
        "link": "https://leetcode.com/problems/word-ladder/",
        "difficulty": "Hard",
        "priority": "P0",
        "pattern": "Graphs"
      },
      {
        "id": "clone-graph",
        "title": "Clone Graph",
        "link": "https://leetcode.com/problems/clone-graph/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Graphs",
        "core": true
      },
      {
        "id": "pacific-atlantic-water-flow",
        "title": "Pacific Atlantic Water Flow",
        "link": "https://leetcode.com/problems/pacific-atlantic-water-flow/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Graphs",
        "core": true
      },
      {
        "id": "max-area-of-island",
        "title": "Max Area of Island",
        "link": "https://leetcode.com/problems/max-area-of-island/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Graphs"
      },
      {
        "id": "word-ladder-ii",
        "title": "Word Ladder II",
        "link": "https://leetcode.com/problems/word-ladder-ii/",
        "difficulty": "Hard",
        "priority": "P1"
      },
      {
        "id": "rotting-oranges",
        "title": "Rotting Oranges",
        "link": "https://leetcode.com/problems/rotting-oranges/",
        "difficulty": "Medium",
        "priority": "P2",
        "pattern": "Graphs"
      },
      {
        "id": "surrounded-regions",
        "title": "Surrounded Regions",
        "link": "https://leetcode.com/problems/surrounded-regions/",
        "difficulty": "Medium",
        "priority": "P2",
        "pattern": "Graphs"
      },
      {
        "id": "sliding-puzzle",
        "title": "Sliding Puzzle",
        "link": "https://leetcode.com/problems/sliding-puzzle/",
        "difficulty": "Hard",
        "priority": "P2"
      },
      {
        "id": "evaluate-division",
        "title": "Evaluate Division",
        "link": "https://leetcode.com/problems/evaluate-division/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "is-graph-bipartite",
        "title": "Is Graph Bipartite",
        "link": "https://leetcode.com/problems/is-graph-bipartite/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "bus-routes",
        "title": "Bus Routes",
        "link": "https://leetcode.com/problems/bus-routes/",
        "difficulty": "Hard",
        "priority": "P2"
      },
      {
        "id": "shortest-path-in-a-grid-with-obstacles-elimination",
        "title": "Shortest Path in a Grid with Obstacles Elimination",
        "link": "https://leetcode.com/problems/shortest-path-in-a-grid-with-obstacles-elimination/",
        "difficulty": "Hard",
        "priority": "P2"
      },
      {
        "id": "open-the-lock",
        "title": "Open the Lock",
        "link": "https://leetcode.com/problems/open-the-lock/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "shortest-path-to-get-all-keys",
        "title": "Shortest Path to Get All Keys",
        "link": "https://leetcode.com/problems/shortest-path-to-get-all-keys/",
        "difficulty": "Hard",
        "priority": "P2"
      },
      {
        "id": "making-a-large-island",
        "title": "Making A Large Island",
        "link": "https://leetcode.com/problems/making-a-large-island/",
        "difficulty": "Hard",
        "priority": "P3"
      },
      {
        "id": "01-matrix",
        "title": "01 Matrix",
        "link": "https://leetcode.com/problems/01-matrix/",
        "difficulty": "Medium",
        "priority": "P3"
      },
      {
        "id": "possible-bipartition",
        "title": "Possible Bipartition",
        "link": "https://leetcode.com/problems/possible-bipartition/",
        "difficulty": "Medium",
        "priority": "P3"
      },
      {
        "id": "jump-game-iii",
        "title": "Jump Game III",
        "link": "https://leetcode.com/problems/jump-game-iii/",
        "difficulty": "Medium",
        "priority": "P3"
      },
      {
        "id": "detonate-the-maximum-bombs",
        "title": "Detonate the Maximum Bombs",
        "link": "https://leetcode.com/problems/detonate-the-maximum-bombs/",
        "difficulty": "Medium",
        "priority": "P3"
      }
    ]
  },
  {
    "topic": "Graphs - Topological Sort and Cycle Detection",
    "problems": [
      {
        "id": "alien-dictionary",
        "title": "Alien Dictionary",
        "link": "https://leetcode.com/problems/alien-dictionary/",
        "difficulty": "Hard",
        "priority": "P1",
        "pattern": "Advanced Graphs",
        "core": true
      },
      {
        "id": "course-schedule",
        "title": "Course Schedule",
        "link": "https://leetcode.com/problems/course-schedule/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Graphs",
        "core": true
      },
      {
        "id": "course-schedule-ii",
        "title": "Course Schedule II",
        "link": "https://leetcode.com/problems/course-schedule-ii/",
        "difficulty": "Medium",
        "priority": "P2",
        "pattern": "Graphs"
      },
      {
        "id": "minimum-height-trees",
        "title": "Minimum Height Trees",
        "link": "https://leetcode.com/problems/minimum-height-trees/",
        "difficulty": "Medium",
        "priority": "P3"
      },
      {
        "id": "find-eventual-safe-states",
        "title": "Find Eventual Safe States",
        "link": "https://leetcode.com/problems/find-eventual-safe-states/",
        "difficulty": "Medium",
        "priority": "P3"
      },
      {
        "id": "course-schedule-iv",
        "title": "Course Schedule IV",
        "link": "https://leetcode.com/problems/course-schedule-iv/",
        "difficulty": "Medium",
        "priority": "P3"
      },
      {
        "id": "parallel-courses-iii",
        "title": "Parallel Courses III",
        "link": "https://leetcode.com/problems/parallel-courses-iii/",
        "difficulty": "Hard",
        "priority": "P3"
      }
    ]
  },
  {
    "topic": "Graphs - Shortest Path and Advanced",
    "problems": [
      {
        "id": "reconstruct-itinerary",
        "title": "Reconstruct Itinerary",
        "link": "https://leetcode.com/problems/reconstruct-itinerary/",
        "difficulty": "Hard",
        "priority": "P1",
        "pattern": "Advanced Graphs"
      },
      {
        "id": "cheapest-flights-within-k-stops",
        "title": "Cheapest Flights Within K Stops",
        "link": "https://leetcode.com/problems/cheapest-flights-within-k-stops/",
        "difficulty": "Medium",
        "priority": "P2",
        "pattern": "Advanced Graphs"
      },
      {
        "id": "network-delay-time",
        "title": "Network Delay Time",
        "link": "https://leetcode.com/problems/network-delay-time/",
        "difficulty": "Medium",
        "priority": "P2",
        "pattern": "Advanced Graphs"
      },
      {
        "id": "swim-in-rising-water",
        "title": "Swim in Rising Water",
        "link": "https://leetcode.com/problems/swim-in-rising-water/",
        "difficulty": "Hard",
        "priority": "P2",
        "pattern": "Advanced Graphs"
      },
      {
        "id": "min-cost-to-connect-all-points",
        "title": "Min Cost to Connect All Points",
        "link": "https://leetcode.com/problems/min-cost-to-connect-all-points/",
        "difficulty": "Medium",
        "priority": "P2",
        "pattern": "Advanced Graphs"
      },
      {
        "id": "critical-connections-in-a-network",
        "title": "Critical Connections in a Network",
        "link": "https://leetcode.com/problems/critical-connections-in-a-network/",
        "difficulty": "Hard",
        "priority": "P2"
      },
      {
        "id": "shortest-bridge",
        "title": "Shortest Bridge",
        "link": "https://leetcode.com/problems/shortest-bridge/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "minimum-cost-to-make-at-least-one-valid-path-in-a-grid",
        "title": "Minimum Cost to Make at Least One Valid Path in a Grid",
        "link": "https://leetcode.com/problems/minimum-cost-to-make-at-least-one-valid-path-in-a-grid/",
        "difficulty": "Hard",
        "priority": "P3"
      },
      {
        "id": "path-with-maximum-probability",
        "title": "Path with Maximum Probability",
        "link": "https://leetcode.com/problems/path-with-maximum-probability/",
        "difficulty": "Medium",
        "priority": "P3"
      },
      {
        "id": "path-with-minimum-effort",
        "title": "Path With Minimum Effort",
        "link": "https://leetcode.com/problems/path-with-minimum-effort/",
        "difficulty": "Medium",
        "priority": "P3"
      }
    ]
  },
  {
    "topic": "Union Find",
    "problems": [
      {
        "id": "graph-valid-tree",
        "title": "Graph Valid Tree",
        "link": "https://leetcode.com/problems/graph-valid-tree/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Graphs",
        "core": true
      },
      {
        "id": "number-of-connected-components-in-an-undirected-graph",
        "title": "Number of Connected Components in Undirected Graph",
        "link": "https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Graphs",
        "core": true
      },
      {
        "id": "accounts-merge",
        "title": "Accounts Merge",
        "link": "https://leetcode.com/problems/accounts-merge/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "redundant-connection",
        "title": "Redundant Connection",
        "link": "https://leetcode.com/problems/redundant-connection/",
        "difficulty": "Medium",
        "priority": "P2",
        "pattern": "Graphs"
      },
      {
        "id": "most-stones-removed-with-same-row-or-column",
        "title": "Most Stones Removed with Same Row or Column",
        "link": "https://leetcode.com/problems/most-stones-removed-with-same-row-or-column/",
        "difficulty": "Medium",
        "priority": "P3"
      },
      {
        "id": "satisfiability-of-equality-equations",
        "title": "Satisfiability of Equality Equations",
        "link": "https://leetcode.com/problems/satisfiability-of-equality-equations/",
        "difficulty": "Medium",
        "priority": "P3"
      },
      {
        "id": "number-of-provinces",
        "title": "Number of Provinces",
        "link": "https://leetcode.com/problems/number-of-provinces/",
        "difficulty": "Medium",
        "priority": "P3"
      }
    ]
  },
  {
    "topic": "Backtracking",
    "problems": [
      {
        "id": "letter-combinations-of-a-phone-number",
        "title": "Letter Combinations of Phone Number",
        "link": "https://leetcode.com/problems/letter-combinations-of-a-phone-number/",
        "difficulty": "Medium",
        "priority": "P0",
        "pattern": "Backtracking"
      },
      {
        "id": "generate-parentheses",
        "title": "Generate Parentheses",
        "link": "https://leetcode.com/problems/generate-parentheses/",
        "difficulty": "Medium",
        "priority": "P0",
        "pattern": "Backtracking"
      },
      {
        "id": "word-search-ii",
        "title": "Word Search II",
        "link": "https://leetcode.com/problems/word-search-ii/",
        "difficulty": "Hard",
        "priority": "P1",
        "pattern": "Tries",
        "core": true
      },
      {
        "id": "word-search",
        "title": "Word Search",
        "link": "https://leetcode.com/problems/word-search/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Backtracking",
        "core": true
      },
      {
        "id": "permutations",
        "title": "Permutations",
        "link": "https://leetcode.com/problems/permutations/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Backtracking"
      },
      {
        "id": "n-queens",
        "title": "N-Queens",
        "link": "https://leetcode.com/problems/n-queens/",
        "difficulty": "Hard",
        "priority": "P1",
        "pattern": "Backtracking"
      },
      {
        "id": "sudoku-solver",
        "title": "Sudoku Solver",
        "link": "https://leetcode.com/problems/sudoku-solver/",
        "difficulty": "Hard",
        "priority": "P1"
      },
      {
        "id": "remove-invalid-parentheses",
        "title": "Remove Invalid Parentheses",
        "link": "https://leetcode.com/problems/remove-invalid-parentheses/",
        "difficulty": "Hard",
        "priority": "P1"
      },
      {
        "id": "combination-sum",
        "title": "Combination Sum",
        "link": "https://leetcode.com/problems/combination-sum/",
        "difficulty": "Medium",
        "priority": "P2",
        "pattern": "Backtracking"
      },
      {
        "id": "subsets",
        "title": "Subsets",
        "link": "https://leetcode.com/problems/subsets/",
        "difficulty": "Medium",
        "priority": "P2",
        "pattern": "Backtracking"
      },
      {
        "id": "combination-sum-ii",
        "title": "Combination Sum II",
        "link": "https://leetcode.com/problems/combination-sum-ii/",
        "difficulty": "Medium",
        "priority": "P2",
        "pattern": "Backtracking"
      },
      {
        "id": "palindrome-partitioning",
        "title": "Palindrome Partitioning",
        "link": "https://leetcode.com/problems/palindrome-partitioning/",
        "difficulty": "Medium",
        "priority": "P2",
        "pattern": "Backtracking"
      },
      {
        "id": "subsets-ii",
        "title": "Subsets II",
        "link": "https://leetcode.com/problems/subsets-ii/",
        "difficulty": "Medium",
        "priority": "P2",
        "pattern": "Backtracking"
      },
      {
        "id": "expression-add-operators",
        "title": "Expression Add Operators",
        "link": "https://leetcode.com/problems/expression-add-operators/",
        "difficulty": "Hard",
        "priority": "P2"
      },
      {
        "id": "permutations-ii",
        "title": "Permutations II",
        "link": "https://leetcode.com/problems/permutations-ii/",
        "difficulty": "Medium",
        "priority": "P2"
      }
    ]
  },
  {
    "topic": "Greedy & Intervals",
    "problems": [
      {
        "id": "merge-intervals",
        "title": "Merge Intervals",
        "link": "https://leetcode.com/problems/merge-intervals/",
        "difficulty": "Medium",
        "priority": "P0",
        "pattern": "Intervals",
        "core": true
      },
      {
        "id": "meeting-rooms-ii",
        "title": "Meeting Rooms II",
        "link": "https://leetcode.com/problems/meeting-rooms-ii/",
        "difficulty": "Medium",
        "priority": "P0",
        "pattern": "Intervals",
        "core": true
      },
      {
        "id": "insert-interval",
        "title": "Insert Interval",
        "link": "https://leetcode.com/problems/insert-interval/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Intervals",
        "core": true
      },
      {
        "id": "non-overlapping-intervals",
        "title": "Non-overlapping Intervals",
        "link": "https://leetcode.com/problems/non-overlapping-intervals/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Intervals",
        "core": true
      },
      {
        "id": "gas-station",
        "title": "Gas Station",
        "link": "https://leetcode.com/problems/gas-station/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Greedy"
      },
      {
        "id": "my-calendar-i",
        "title": "My Calendar I",
        "link": "https://leetcode.com/problems/my-calendar-i/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "interval-list-intersections",
        "title": "Interval List Intersections",
        "link": "https://leetcode.com/problems/interval-list-intersections/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "hand-of-straights",
        "title": "Hand of Straights",
        "link": "https://leetcode.com/problems/hand-of-straights/",
        "difficulty": "Medium",
        "priority": "P2",
        "pattern": "Greedy"
      },
      {
        "id": "partition-labels",
        "title": "Partition Labels",
        "link": "https://leetcode.com/problems/partition-labels/",
        "difficulty": "Medium",
        "priority": "P2",
        "pattern": "Greedy"
      },
      {
        "id": "valid-parenthesis-string",
        "title": "Valid Parenthesis String",
        "link": "https://leetcode.com/problems/valid-parenthesis-string/",
        "difficulty": "Medium",
        "priority": "P2",
        "pattern": "Greedy"
      },
      {
        "id": "merge-triplets-to-form-target-triplet",
        "title": "Merge Triplets to Form Target Triplet",
        "link": "https://leetcode.com/problems/merge-triplets-to-form-target-triplet/",
        "difficulty": "Medium",
        "priority": "P2",
        "pattern": "Greedy"
      },
      {
        "id": "minimum-interval-to-include-each-query",
        "title": "Minimum Interval to Include Each Query",
        "link": "https://leetcode.com/problems/minimum-interval-to-include-each-query/",
        "difficulty": "Hard",
        "priority": "P2",
        "pattern": "Intervals"
      },
      {
        "id": "range-module",
        "title": "Range Module",
        "link": "https://leetcode.com/problems/range-module/",
        "difficulty": "Hard",
        "priority": "P2"
      },
      {
        "id": "candy",
        "title": "Candy",
        "link": "https://leetcode.com/problems/candy/",
        "difficulty": "Hard",
        "priority": "P2"
      },
      {
        "id": "maximum-number-of-events-that-can-be-attended",
        "title": "Maximum Number of Events That Can Be Attended",
        "link": "https://leetcode.com/problems/maximum-number-of-events-that-can-be-attended/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "queue-reconstruction-by-height",
        "title": "Queue Reconstruction by Height",
        "link": "https://leetcode.com/problems/queue-reconstruction-by-height/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "minimum-number-of-arrows-to-burst-balloons",
        "title": "Minimum Number of Arrows to Burst Balloons",
        "link": "https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "my-calendar-ii",
        "title": "My Calendar II",
        "link": "https://leetcode.com/problems/my-calendar-ii/",
        "difficulty": "Medium",
        "priority": "P3"
      },
      {
        "id": "video-stitching",
        "title": "Video Stitching",
        "link": "https://leetcode.com/problems/video-stitching/",
        "difficulty": "Medium",
        "priority": "P3"
      }
    ]
  },
  {
    "topic": "Trie",
    "problems": [
      {
        "id": "implement-trie-prefix-tree",
        "title": "Implement Trie (Prefix Tree)",
        "link": "https://leetcode.com/problems/implement-trie-prefix-tree/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Tries",
        "core": true
      },
      {
        "id": "design-add-and-search-words-data-structure",
        "title": "Design Add and Search Words Data Structure",
        "link": "https://leetcode.com/problems/design-add-and-search-words-data-structure/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Tries",
        "core": true
      },
      {
        "id": "palindrome-pairs",
        "title": "Palindrome Pairs",
        "link": "https://leetcode.com/problems/palindrome-pairs/",
        "difficulty": "Hard",
        "priority": "P1"
      },
      {
        "id": "concatenated-words",
        "title": "Concatenated Words",
        "link": "https://leetcode.com/problems/concatenated-words/",
        "difficulty": "Hard",
        "priority": "P2"
      },
      {
        "id": "stream-of-characters",
        "title": "Stream of Characters",
        "link": "https://leetcode.com/problems/stream-of-characters/",
        "difficulty": "Hard",
        "priority": "P2"
      },
      {
        "id": "search-suggestions-system",
        "title": "Search Suggestions System",
        "link": "https://leetcode.com/problems/search-suggestions-system/",
        "difficulty": "Medium",
        "priority": "P3"
      },
      {
        "id": "maximum-xor-of-two-numbers-in-an-array",
        "title": "Maximum XOR of Two Numbers in an Array",
        "link": "https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/",
        "difficulty": "Medium",
        "priority": "P3"
      }
    ]
  },
  {
    "topic": "Bit Manipulation",
    "problems": [
      {
        "id": "number-of-1-bits",
        "title": "Number of 1 Bits",
        "link": "https://leetcode.com/problems/number-of-1-bits/",
        "difficulty": "Easy",
        "priority": "P1",
        "pattern": "Bit Manipulation",
        "core": true
      },
      {
        "id": "missing-number",
        "title": "Missing Number",
        "link": "https://leetcode.com/problems/missing-number/",
        "difficulty": "Easy",
        "priority": "P1",
        "pattern": "Bit Manipulation",
        "core": true
      },
      {
        "id": "reverse-bits",
        "title": "Reverse Bits",
        "link": "https://leetcode.com/problems/reverse-bits/",
        "difficulty": "Easy",
        "priority": "P1",
        "pattern": "Bit Manipulation",
        "core": true
      },
      {
        "id": "counting-bits",
        "title": "Counting Bits",
        "link": "https://leetcode.com/problems/counting-bits/",
        "difficulty": "Easy",
        "priority": "P1",
        "pattern": "Bit Manipulation",
        "core": true
      },
      {
        "id": "sum-of-two-integers",
        "title": "Sum of Two Integers",
        "link": "https://leetcode.com/problems/sum-of-two-integers/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Bit Manipulation",
        "core": true
      },
      {
        "id": "single-number",
        "title": "Single Number",
        "link": "https://leetcode.com/problems/single-number/",
        "difficulty": "Easy",
        "priority": "P2",
        "pattern": "Bit Manipulation"
      },
      {
        "id": "single-number-ii",
        "title": "Single Number II",
        "link": "https://leetcode.com/problems/single-number-ii/",
        "difficulty": "Medium",
        "priority": "P3"
      }
    ]
  },
  {
    "topic": "Matrix and 2D Arrays",
    "problems": [
      {
        "id": "spiral-matrix",
        "title": "Spiral Matrix",
        "link": "https://leetcode.com/problems/spiral-matrix/",
        "difficulty": "Medium",
        "priority": "P0",
        "pattern": "Math & Geometry",
        "core": true
      },
      {
        "id": "rotate-image",
        "title": "Rotate Image",
        "link": "https://leetcode.com/problems/rotate-image/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Math & Geometry",
        "core": true
      },
      {
        "id": "set-matrix-zeroes",
        "title": "Set Matrix Zeroes",
        "link": "https://leetcode.com/problems/set-matrix-zeroes/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Math & Geometry",
        "core": true
      },
      {
        "id": "valid-sudoku",
        "title": "Valid Sudoku",
        "link": "https://leetcode.com/problems/valid-sudoku/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Arrays & Hashing"
      },
      {
        "id": "longest-increasing-path-in-a-matrix",
        "title": "Longest Increasing Path in Matrix",
        "link": "https://leetcode.com/problems/longest-increasing-path-in-a-matrix/",
        "difficulty": "Hard",
        "priority": "P1",
        "pattern": "2-D Dynamic Programming"
      },
      {
        "id": "game-of-life",
        "title": "Game of Life",
        "link": "https://leetcode.com/problems/game-of-life/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "spiral-matrix-ii",
        "title": "Spiral Matrix II",
        "link": "https://leetcode.com/problems/spiral-matrix-ii/",
        "difficulty": "Medium",
        "priority": "P2"
      }
    ]
  },
  {
    "topic": "Design and Implementation",
    "problems": [
      {
        "id": "lru-cache",
        "title": "LRU Cache",
        "link": "https://leetcode.com/problems/lru-cache/",
        "difficulty": "Medium",
        "priority": "P0",
        "pattern": "Linked List"
      },
      {
        "id": "insert-delete-getrandom-o1",
        "title": "Insert Delete GetRandom O(1)",
        "link": "https://leetcode.com/problems/insert-delete-getrandom-o1/",
        "difficulty": "Medium",
        "priority": "P0"
      },
      {
        "id": "time-based-key-value-store",
        "title": "Time Based Key-Value Store",
        "link": "https://leetcode.com/problems/time-based-key-value-store/",
        "difficulty": "Medium",
        "priority": "P1",
        "pattern": "Binary Search"
      },
      {
        "id": "design-hashmap",
        "title": "Design HashMap",
        "link": "https://leetcode.com/problems/design-hashmap/",
        "difficulty": "Easy",
        "priority": "P1"
      },
      {
        "id": "design-hit-counter",
        "title": "Design Hit Counter",
        "link": "https://leetcode.com/problems/design-hit-counter/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "flatten-nested-list-iterator",
        "title": "Flatten Nested List Iterator",
        "link": "https://leetcode.com/problems/flatten-nested-list-iterator/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "lfu-cache",
        "title": "LFU Cache",
        "link": "https://leetcode.com/problems/lfu-cache/",
        "difficulty": "Hard",
        "priority": "P1"
      },
      {
        "id": "random-pick-with-weight",
        "title": "Random Pick with Weight",
        "link": "https://leetcode.com/problems/random-pick-with-weight/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "peeking-iterator",
        "title": "Peeking Iterator",
        "link": "https://leetcode.com/problems/peeking-iterator/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "design-circular-queue",
        "title": "Design Circular Queue",
        "link": "https://leetcode.com/problems/design-circular-queue/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "logger-rate-limiter",
        "title": "Design Rate Limiter",
        "link": "https://leetcode.com/problems/logger-rate-limiter/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "design-twitter",
        "title": "Design Twitter",
        "link": "https://leetcode.com/problems/design-twitter/",
        "difficulty": "Medium",
        "priority": "P2",
        "pattern": "Heap / Priority Queue"
      },
      {
        "id": "detect-squares",
        "title": "Detect Squares",
        "link": "https://leetcode.com/problems/detect-squares/",
        "difficulty": "Medium",
        "priority": "P2",
        "pattern": "Math & Geometry"
      },
      {
        "id": "all-oone-data-structure",
        "title": "All O'one Data Structure",
        "link": "https://leetcode.com/problems/all-oone-data-structure/",
        "difficulty": "Hard",
        "priority": "P2"
      },
      {
        "id": "snapshot-array",
        "title": "Snapshot Array",
        "link": "https://leetcode.com/problems/snapshot-array/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "design-in-memory-file-system",
        "title": "Design In-Memory File System",
        "link": "https://leetcode.com/problems/design-in-memory-file-system/",
        "difficulty": "Hard",
        "priority": "P2"
      },
      {
        "id": "design-underground-system",
        "title": "Design Underground System",
        "link": "https://leetcode.com/problems/design-underground-system/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "design-file-system",
        "title": "Design File System",
        "link": "https://leetcode.com/problems/design-file-system/",
        "difficulty": "Medium",
        "priority": "P2"
      },
      {
        "id": "design-browser-history",
        "title": "Design Browser History",
        "link": "https://leetcode.com/problems/design-browser-history/",
        "difficulty": "Medium",
        "priority": "P3"
      },
      {
        "id": "design-circular-deque",
        "title": "Design Circular Deque",
        "link": "https://leetcode.com/problems/design-circular-deque/",
        "difficulty": "Medium",
        "priority": "P3"
      },
      {
        "id": "stock-price-fluctuation",
        "title": "Stock Price Fluctuation",
        "link": "https://leetcode.com/problems/stock-price-fluctuation/",
        "difficulty": "Medium",
        "priority": "P3"
      }
    ]
  },
  {
    "topic": "Math & Number Theory",
    "problems": [
      {
        "id": "happy-number",
        "title": "Happy Number",
        "link": "https://leetcode.com/problems/happy-number/",
        "difficulty": "Easy",
        "priority": "P1",
        "pattern": "Math & Geometry"
      },
      {
        "id": "fraction-to-recurring-decimal",
        "title": "Fraction to Recurring Decimal",
        "link": "https://leetcode.com/problems/fraction-to-recurring-decimal/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "integer-to-roman",
        "title": "Integer to Roman",
        "link": "https://leetcode.com/problems/integer-to-roman/",
        "difficulty": "Medium",
        "priority": "P1"
      },
      {
        "id": "max-points-on-a-line",
        "title": "Max Points on a Line",
        "link": "https://leetcode.com/problems/max-points-on-a-line/",
        "difficulty": "Hard",
        "priority": "P1"
      },
      {
        "id": "reverse-integer",
        "title": "Reverse Integer",
        "link": "https://leetcode.com/problems/reverse-integer/",
        "difficulty": "Medium",
        "priority": "P2",
        "pattern": "Bit Manipulation"
      },
      {
        "id": "powx-n",
        "title": "Pow(x, n)",
        "link": "https://leetcode.com/problems/powx-n/",
        "difficulty": "Medium",
        "priority": "P2",
        "pattern": "Math & Geometry"
      },
      {
        "id": "plus-one",
        "title": "Plus One",
        "link": "https://leetcode.com/problems/plus-one/",
        "difficulty": "Easy",
        "priority": "P2",
        "pattern": "Math & Geometry"
      },
      {
        "id": "minimum-area-rectangle",
        "title": "Minimum Area Rectangle",
        "link": "https://leetcode.com/problems/minimum-area-rectangle/",
        "difficulty": "Medium",
        "priority": "P2"
      }
    ]
  }
];

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

export const DSA_TOTAL = 361;

export const DSA_PRIORITY_COUNTS = {"P0":35,"P1":135,"P2":137,"P3":54};
