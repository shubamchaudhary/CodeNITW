import type { Chapter } from "../lib/types.ts";

// Chapter 2 of the AI Stack (src/Data/aiStackDocs/CH-02.md) as a short
// animated lecture, in the same story-first style as chapter 1: each attempt
// fixes the last one's problem and shows the next.

export const ch02: Chapter = {
  id: "ch02",
  title: "RAG from scratch",
  voice: "en-US-AndrewMultilingualNeural",
  next: "Chapter 3 — Searching fast and searching well",
  scenes: [
    {
      kind: "custom",
      name: "openbook",
      beats: [
        { say: "Meera asks: can bakery items be refunded after six hours? The answer is sitting in FreshCart's refund policy. Page four. In a table." },
        { say: "Last time we saw the problem. The model never read that page. And we can't paste in all twelve thousand documents.", tone: "aside" },
        { say: "So think about how you'd answer it yourself. Would you memorise twelve thousand documents?", tone: "ask" },
        { say: "Of course not. You'd open the right policy, find the right paragraph, read it, and answer. An open-book exam.", tone: "key" },
        {
          say: "That's the whole idea. First, find the few passages that answer the question. Then hand them to the model and say: answer only from these, and show me where. This is called RAG: retrieval augmented generation.",
          term: { word: "RAG", meaning: "find the right passages, then answer from them" },
        },
        { say: "The model stops being the source of facts. It becomes a reader of the evidence you hand it.", tone: "key" },
      ],
    },
    {
      kind: "title",
      eyebrow: "AI Stack · Chapter 2",
      title: "RAG from scratch",
      subtitle: "from one question to 12,000 documents",
      beats: [{ say: "Chapter two. Let's build it, one attempt at a time." }],
    },

    // ------------------------------------------------------------ 1
    { kind: "section", num: "1", title: "Find the right page", beats: [{ say: "Attempt zero: just paste the document." }] },
    {
      kind: "custom",
      name: "pasteall",
      beats: [
        { say: "For one question about one policy, the simplest thing works. Paste the forty-page refund policy into the prompt, add the question, done." },
        { say: "And keep this in your pocket: when your knowledge is small and rarely changes, that's genuinely the right design. No search, no search mistakes.", tone: "aside" },
        { say: "But agents ask about everything. Refunds, slots, warehouses, franchises. Twelve thousand documents. It will never fit.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "keyword",
      beats: [
        { say: "Attempt one: search the way you search your own files. Find documents that contain the words of the question.", term: { word: "Keyword search", meaning: "find documents that share the question's words" } },
        { say: "Ask about error slot expired, and exactly one runbook contains that code. Perfect." },
        { say: "Then an agent types: eggs broken on arrival, can they get money back?" },
        { say: "The policy says: damaged items reported within twenty-four hours get a full refund. Look closely. They share almost no words.", tone: "key" },
        { say: "Broken versus damaged. Money back versus refund. Keyword search finds nothing. And people will always use different words.", tone: "aside" },
      ],
    },

    // ------------------------------------------------------------ 2
    { kind: "section", num: "2", title: "Search by meaning", beats: [{ say: "So how can a computer tell that two sentences mean the same thing?", tone: "ask" }] },
    {
      kind: "custom",
      name: "meaningmap",
      beats: [
        { say: "Imagine a map where every sentence has a spot, and sentences that mean similar things live next door." },
        { say: "Refund within twenty-four hours, and money back for damaged items, are neighbours. Delivery slot moved lives in a totally different neighbourhood." },
        {
          say: "That spot is called an embedding: a list of numbers, the sentence's coordinates in meaning.",
          tone: "key",
          term: { word: "Embedding", meaning: "a sentence's coordinates on the map of meaning" },
        },
        { say: "Now drop the question on the map. Eggs broken, money back. It lands right next to damaged items, even with no words in common.", tone: "excite" },
        { say: "Grab whatever is nearest. That's vector search.", term: { word: "Vector search", meaning: "find the stored points nearest the question" } },
        { say: "The real map has hundreds of directions, not two. But the idea is exactly this.", tone: "aside" },
      ],
    },
    {
      kind: "custom",
      name: "magnets",
      beats: [
        { say: "How does a model learn where to put things? This is the part interviewers love.", tone: "ask" },
        { say: "Feed it millions of pairs that belong together: a question and its answer. A search and the page people clicked." },
        { say: "Pull each pair together. Push everything else apart. Over and over.", tone: "key" },
        { say: "That's called contrastive learning. And the best teachers are look-alike wrong answers, like the bakery rule for a dairy question, because they teach fine differences.", term: { word: "Contrastive learning", meaning: "pull matching pairs together, push the rest apart" } },
        { say: "One warning: switch embedding models later, and every document must be embedded again. Different models make different maps.", tone: "aside" },
      ],
    },

    // ------------------------------------------------------------ 3
    { kind: "section", num: "3", title: "Cut it into cards", beats: [{ say: "Now, a trap.", tone: "excite" }] },
    {
      kind: "custom",
      name: "chunker",
      beats: [
        { say: "Embed the whole forty-page policy as one spot on the map. Where does it land?", tone: "ask" },
        { say: "It covers dairy, bakery, frozen food, fees, fraud... so it lands in the blurry middle of everything. A weak match for every question. A sharp match for none.", tone: "key" },
        { say: "So cut documents into small cards, one idea each. Each card gets its own sharp spot.", term: { word: "Chunk", meaning: "a small piece of a document, searched on its own" } },
        { say: "Too big, and it's blurry again. Too small, and you get: the limit is twenty-four hours. The limit on what?" },
        { say: "So keep the heading on every card. Refund policy, damaged items, dairy. Now it means something.", tone: "key" },
        { say: "What size is right? Don't guess. Try three sizes on real agent questions, and keep the winner. That's the answer interviewers want.", tone: "aside" },
      ],
    },
    {
      kind: "custom",
      name: "parentchild",
      beats: [
        { say: "Here's a neat trick to get both: precision and context." },
        { say: "Search the small cards, because small cards are sharp. But when one matches, hand the model its whole section." },
        { say: "Now the model sees the dairy rule, and the photo-proof rule sitting right next to it. This is called parent-child retrieval.", term: { word: "Parent-child", meaning: "search small chunks, send their bigger section" } },
      ],
    },

    // ------------------------------------------------------------ 4
    { kind: "section", num: "4", title: "Ask FreshCart, version one", beats: [{ say: "Let's put it all together.", tone: "excite" }] },
    {
      kind: "custom",
      name: "pipeline",
      beats: [
        { say: "There are two machines, running at different times." },
        { say: "Offline, whenever a document changes: read it, cut it into cards, embed each card, and store them in a vector index." },
        { say: "Online, for every question: embed the question, and grab the twenty nearest cards." },
        { say: "Then a slower, sharper model rereads those twenty and keeps the best five. That's a reranker.", term: { word: "Reranker", meaning: "rereads candidates and keeps the best few" } },
        { say: "Build the prompt: rules first, the five cards with their labels, the question last." },
        { say: "And the answer cites its sources, so an agent can click and check.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "versions",
      beats: [
        { say: "One bug catches almost everyone. The refund policy gets updated to version four." },
        { say: "The team adds the new cards... and forgets to delete the old ones." },
        { say: "Now versions three and four are both searchable, and answers quietly mix them.", tone: "key" },
        { say: "Worse: a deleted document stays searchable. That's not a stale answer. That's a data leak. So every update deletes the old version, in the same step.", tone: "aside" },
      ],
    },
    {
      kind: "custom",
      name: "notrag",
      beats: [
        { say: "Last thing. Interviewers rarely ask what RAG is. They ask: why RAG, and not something else?", tone: "ask" },
        { say: "Missing facts that are large and changing? RAG. Small and fixed? Just put them in the prompt." },
        { say: "Live data, like stock levels? Ask the live system. And: how many refunds did we issue last week?" },
        { say: "Search can't count. That's a database query, not RAG.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "recap",
      props: {
        items: [
          ["📖", "RAG", "find the passages, then answer from them"],
          ["🔤", "Keyword search", "great for exact codes, blind to synonyms"],
          ["🗺️", "Embedding", "a spot on the map of meaning"],
          ["🃏", "Chunk", "one idea per card, heading attached"],
          ["🎯", "Reranker", "twenty candidates in, best five out"],
        ],
      },
      beats: [
        { say: "Let's lock it in." },
        { say: "RAG: find the passages first, then answer only from them." },
        { say: "Keyword search: perfect for exact codes, blind to different words." },
        { say: "Embeddings put meaning on a map, so similar ideas sit close together." },
        { say: "Chunks: one idea per card, with its heading attached." },
        { say: "And a reranker picks the best five from the twenty nearest.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "complaints",
      beats: [
        { say: "Ask FreshCart goes live. Agents love it. Then, within two weeks, three complaints arrive." },
        { say: "One: it's slow. Every question is compared against two million cards." },
        { say: "Two: the Bengaluru North franchise gets no results at all for its own documents." },
        { say: "Three: error codes fail again. The exact-match power of keyword search got lost." },
        { say: "How would you search two million cards without checking every one? And how do you combine a keyword ranking with a meaning ranking?", tone: "ask", hold: 3 },
      ],
    },
    {
      kind: "title",
      eyebrow: "Next",
      title: "Chapter 3 — Search fast, search well",
      subtitle: "vector indexes, hybrid search, reranking",
      beats: [{ say: "That's chapter three. See you there.", tone: "excite" }],
    },
  ],
};
