import type { Chapter } from "../lib/types.ts";

// Chapter 3 (src/Data/aiStackDocs/CH-03.md): the three complaints about
// Ask FreshCart v1 turn out to be the three classic problems of search.

export const ch03: Chapter = {
  id: "ch03",
  title: "Search fast, search well",
  voice: "en-US-AndrewMultilingualNeural",
  next: "Chapter 4 — When retrieval still fails",
  scenes: [
    {
      kind: "custom",
      name: "cardlist",
      props: {
        title: "Three complaints on your desk",
        items: [
          ["🐢", "It's slow at peak", "speed"],
          ["🏙️", "Bengaluru-North gets no results", "filtering"],
          ["🔢", "ERR_SLOT_EXPIRED → vague answers", "exact words"],
        ],
      },
      beats: [
        { say: "Ask FreshCart works. And three complaints just landed on your desk." },
        { say: "One. It's slow at peak." },
        { say: "Two. The Bengaluru North franchise gets no results, for its own documents." },
        { say: "Three. Ask about an error code, and you get vague answers about delivery delays." },
        { say: "They look unrelated. They're actually the three classic problems of search: speed, filtering, and exact words.", tone: "key" },
      ],
    },
    {
      kind: "title",
      eyebrow: "AI Stack · Chapter 3",
      title: "Search fast, search well",
      subtitle: "indexes, hybrid search, reranking",
      beats: [{ say: "Chapter three. Let's fix all three." }],
    },

    // ------------------------------------------------------------ 1
    { kind: "section", num: "1", title: "Fast: don't check everything", beats: [{ say: "First, speed." }] },
    {
      kind: "custom",
      name: "bruteforce",
      beats: [
        { say: "Right now, every question is compared with all two million cards. Every single one. That's over a billion multiplications, per question." },
        { say: "It's like finding your nearest coffee shop by measuring the distance to every coffee shop in India.", tone: "excite" },
        { say: "You'd never do that. You'd just look around your own neighbourhood.", tone: "key" },
        {
          say: "An index that does exactly that is called an approximate nearest neighbour index. It checks a small, clever part of the data, in milliseconds. Once in a while it misses one.",
          term: { word: "ANN index", meaning: "search a clever small part, not everything" },
        },
        { say: "How much it misses is called recall. Recall of point nine five means it finds nine and a half of the true top ten, on average.", term: { word: "Recall", meaning: "how many of the true nearest it actually found" } },
      ],
    },
    {
      kind: "custom",
      name: "hnsw",
      beats: [
        { say: "The most popular index works like driving across a country." },
        { say: "You take a highway to the right region. Then a main road to the right town. Then local streets, to the exact door." },
        { say: "This index builds those roads between your cards. A few cards on the highway layer, more on the main roads, and every card on the local streets. It's called HNSW.", term: { word: "HNSW", meaning: "a layered map: highways, then local streets" } },
        { say: "A search starts on the highway, hops closer and closer, drops a layer, and repeats, until it reaches the closest cards.", tone: "key" },
        { say: "One dial matters most: how many candidates it keeps while searching. Turn it up, and you find more of the true neighbours, a little slower. Measure, then stop where recall is good enough.", tone: "aside" },
      ],
    },

    // ------------------------------------------------------------ 2
    { kind: "section", num: "2", title: "The Bengaluru bug", beats: [{ say: "Now, the Bengaluru mystery.", tone: "excite" }] },
    {
      kind: "custom",
      name: "postfilter",
      beats: [
        { say: "All forty franchises share one index. Bengaluru North owns just one percent of the cards." },
        { say: "The index finds its forty best candidates, from every franchise. It knows nothing about franchises." },
        { say: "Then the filter runs: keep only Bengaluru North. On average, zero point four of those forty survive. Usually, none.", tone: "key" },
        { say: "Filtering after the search is called post filtering, and with a rare filter it quietly returns nothing.", term: { word: "Post-filtering", meaning: "filter after search: rare filters return nothing" } },
        { say: "The fix: give big franchises their own index, so the filter is free. Or tell the index to keep walking until it finds enough matches.", tone: "aside" },
      ],
    },

    // ------------------------------------------------------------ 3
    { kind: "section", num: "3", title: "Exact words are back", beats: [{ say: "Complaint three: the error code." }] },
    {
      kind: "custom",
      name: "bm25",
      beats: [
        { say: "Meaning search is great with different words. But an error code means nothing to it. It just lands in a vague delivery trouble neighbourhood." },
        { say: "Keyword search finds that code instantly. They fail in opposite places. So run both.", tone: "key", term: { word: "Hybrid search", meaning: "keyword search and meaning search, together" } },
        { say: "The keyword side uses a scoring recipe called BM25. Think of a librarian asking three questions about each word." },
        { say: "How rare is it? This error code appears in three cards out of two million, so a match is a huge clue. Delivery appears everywhere, so it barely counts." },
        { say: "How often does it appear in this card? More is better, but the tenth time adds almost nothing. And is the card just long? Long cards contain more words by chance.", term: { word: "BM25", meaning: "keyword scoring: rare words count most" } },
      ],
    },
    {
      kind: "custom",
      name: "rrf",
      beats: [
        { say: "Now we have two ranked lists. One gives scores like fourteen. The other gives scores like zero point eight. How do you combine those?", tone: "ask" },
        { say: "You don't. Ignore the scores. Use only the positions.", tone: "key" },
        { say: "Every card gets points from each list: one, divided by sixty plus its rank. First place gets a bit more than second, but not much more." },
        { say: "Cards that both searches found rise to the top. This is called reciprocal rank fusion.", term: { word: "RRF", meaning: "merge rankings using positions, not scores" } },
      ],
    },

    // ------------------------------------------------------------ 4
    { kind: "section", num: "4", title: "Best first: reranking", beats: [{ say: "One last upgrade." }] },
    {
      kind: "custom",
      name: "hiring",
      beats: [
        { say: "Fusion often puts the right card fourth or fifth, not first. And order matters: models trust the first passages most." },
        { say: "Think about hiring. You screen ten thousand CVs with a quick filter. Then you properly interview the top twenty." },
        { say: "Our search is the quick screen. The question and each card are turned into numbers separately, then compared. Fast, but they never really meet." },
        {
          say: "The interview is a cross encoder. It reads the question and one card together, word by word, and scores how well they fit. Slow, but sharp.",
          term: { word: "Cross-encoder", meaning: "reads question + card together to score them" },
        },
        { say: "So: search wide to make sure the right card is somewhere in the top hundred. Then rerank, to make sure it ends up first.", tone: "key" },
        { say: "Two finishing touches. Drop cards below a minimum score, so the system can honestly say: I found nothing. And skip near-duplicates, so five slots don't hold the same fact five times.", tone: "aside" },
      ],
    },
    {
      kind: "flow",
      title: "Ask FreshCart v2",
      cols: 4,
      rows: 2,
      nodeW: 340,
      nodeH: 150,
      nodes: [
        { id: "Q", c: 0, r: 0.5, label: "Question\nfrom a blr-north\nagent" },
        { id: "KW", c: 1, r: 0, label: "BM25 on the\nfranchise's index" },
        { id: "VS", c: 1, r: 1, label: "HNSW on the\nsame, tuned" },
        { id: "F", c: 2, r: 0.5, label: "RRF:\none list", tone: "amber" },
        { id: "RR", c: 3, r: 0.5, label: "Rerank, threshold,\nno duplicates", tone: "green" },
      ],
      edges: [
        { from: "Q", to: "KW" },
        { from: "Q", to: "VS" },
        { from: "KW", to: "F" },
        { from: "VS", to: "F" },
        { from: "F", to: "RR" },
      ],
      show: [["Q"], ["KW", "VS"], ["F"], ["RR"]],
      beats: [
        { say: "Here's version two. A question comes in from a Bengaluru North agent." },
        { say: "Keyword search and meaning search run side by side, on that franchise's own index. Fast, and nothing filtered away." },
        { say: "Rank fusion merges them into one list." },
        { say: "And the reranker puts the best first. All three complaints: fixed.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "recap",
      props: {
        items: [
          ["🛣️", "HNSW", "highways, then local streets"],
          ["🎯", "Recall", "how many true neighbours were found"],
          ["🚫", "Post-filtering", "rare filters return nothing"],
          ["🔀", "Hybrid + RRF", "two searches, merged by position"],
          ["🧑‍⚖️", "Reranker", "screen wide, then interview the top"],
        ],
      },
      beats: [
        { say: "Let's lock it in." },
        { say: "HNSW: highways first, then local streets." },
        { say: "Recall: how many of the true neighbours you actually found." },
        { say: "Filtering after search can silently return nothing." },
        { say: "Hybrid search runs keyword and meaning search together, and rank fusion merges them by position." },
        { say: "And a reranker interviews the shortlist, so the best comes first.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "cardlist",
      props: {
        title: "Search is great now. And yet…",
        items: [
          ["❓", "“it keeps failing after the update, what changed?”", "no product, no code, no date"],
          ["↩️", "“and for bakery?”", "a follow-up finds nothing"],
          ["❌", "“48 hours” with a confident citation", "the policy says 12"],
          ["📄", "answers hidden in PDF tables fail", "far more than the rest"],
        ],
        pause: "Is the problem the question, the documents, or what happens after search?",
      },
      beats: [
        { say: "Search is fast and accurate now. And yet, new complaints arrive." },
        { say: "A vague question: it keeps failing after the update, what changed? No product. No code. Search returns noise." },
        { say: "A follow-up: and for bakery? Finds nothing." },
        { say: "A confident citation, with the wrong number." },
        { say: "And anything hidden in a PDF table keeps failing. So where is each one going wrong? The question? The documents? Or what happens after search?", tone: "ask", hold: 3 },
      ],
    },
    {
      kind: "title",
      eyebrow: "Next",
      title: "Chapter 4 — When retrieval still fails",
      subtitle: "better questions, self-checking, messy documents",
      beats: [{ say: "That's chapter four. See you there.", tone: "excite" }],
    },
  ],
};
