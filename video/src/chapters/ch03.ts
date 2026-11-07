import type { Chapter } from "../lib/types.ts";

// Chapter 3 of the AI Stack: search fast, search well, interview-ready. The
// running example is a support assistant searching 10 million chunks for 500
// customer workspaces.

export const ch03: Chapter = {
  id: "ch03",
  title: "Search fast, search well",
  voice: "en-US-AndrewMultilingualNeural",
  next: "Chapter 4 — When retrieval still fails",
  scenes: [
    {
      kind: "custom",
      name: "a3hook",
      beats: [
        { say: "Version one of your RAG assistant shipped. Then it grew to ten million chunks, for five hundred customer workspaces. And four bugs arrived. Searches take two point four seconds." },
        { say: "Workspace acme gets no results at all, although its documents are right there." },
        { say: "A search for the error code, E R R token expired, finds nothing useful, although a runbook names it exactly." },
        { say: "And when the right answer is found, it ranks fourth, and the model trusts the first ones." },
        { say: "Four bugs. Four ideas that every retrieval interview probes.", tone: "key" },
      ],
    },
    {
      kind: "title",
      eyebrow: "AI Stack · Chapter 3",
      title: "Search fast, search well",
      subtitle: "HNSW, filters, hybrid search, reranking",
      beats: [{ say: "Chapter three. Search fast, and search well." }],
    },
    {
      kind: "bullets",
      title: "By the end, you can answer",
      firstItemStep: 1,
      items: [
        { icon: "🕸️", text: "How does HNSW work, and what do its knobs trade?" },
        { icon: "🫥", text: "Why can a filtered vector search return nothing?" },
        { icon: "🔀", text: "What is hybrid search, and how does RRF merge rankings?" },
        { icon: "🎯", text: "Bi-encoder vs cross-encoder: why rerank?" },
      ],
      beats: [
        { say: "By the end, you'll be able to answer these." },
        { say: "How HNSW works, and what its settings trade off." },
        { say: "Why a filtered vector search can come back empty." },
        { say: "What hybrid search is, and how reciprocal rank fusion merges two rankings." },
        { say: "And bi encoders versus cross encoders: why we rerank." },
      ],
    },

    // ------------------------------------------------------------ 1
    { kind: "section", num: "1", title: "Why exact search is slow", beats: [{ say: "Bug one: speed." }] },
    {
      kind: "custom",
      name: "a3brute",
      beats: [
        {
          say: "Version one finds the nearest chunks the honest way. Compare the question's vector with every stored vector, and sort. Ten million vectors, a thousand numbers each: about ten billion multiplications, per question.",
          term: { word: "Exact search", meaning: "compare with every vector: correct, slow" },
        },
        { say: "Always correct. And like finding the nearest coffee shop by measuring the distance to every coffee shop in the country." },
        {
          say: "You'd start from your own neighbourhood. An approximate nearest neighbour index does exactly that: it looks at a small, cleverly chosen part of the data, and answers in milliseconds.",
          tone: "key",
          term: { word: "ANN index", meaning: "approximate nearest neighbours, fast" },
        },
        {
          say: "The price: it occasionally misses a true neighbour. We measure that as recall. Of the true ten nearest, how many came back? Nine means a recall of zero point nine.",
          term: { word: "Recall@k", meaning: "share of the true top k that came back" },
        },
      ],
    },

    // ------------------------------------------------------------ 2
    { kind: "section", num: "2", title: "HNSW: highways and local roads", beats: [{ say: "The most popular ANN index is HNSW. To get it, start with a simpler idea.", tone: "excite" }] },
    {
      kind: "custom",
      name: "a3skip",
      beats: [
        {
          say: "Find forty seven in a sorted linked list. Walking item by item takes nine hops. A skip list adds express lanes: a few items linked with long jumps above the full list.",
          term: { word: "Skip list", meaning: "a sorted list with express lanes" },
        },
        { say: "Ride the express lane while you can. Three, twenty four, forty seven. Found." },
        { say: "Three hops instead of nine. Express lanes, and drop down a level when the next jump would overshoot. Keep that picture.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "a3hnsw",
      beats: [
        {
          say: "HNSW does the same with vectors. Hierarchical navigable small world. Every chunk is a point, linked to a few of its nearest neighbours: local roads. A random few also live on higher layers, with long links: the highways.",
          term: { word: "HNSW", meaning: "a layered graph: highways down to local roads" },
        },
        { say: "Here's the question, the pink circle, down in the bottom layer." },
        { say: "Search starts at an entry point on top. Hop to whichever neighbour is closer to the question. When none is closer, drop a layer, and repeat, with shorter links." },
        {
          say: "In the bottom layer, it keeps a short list of the best candidates seen so far, and returns the top ten from it. The length of that list is called ef search.",
          term: { word: "ef_search", meaning: "candidate list size: recall vs speed" },
        },
        { say: "It's approximate because a greedy walk can stop at a spot that's only locally best, like a driver who turns into a nearby dead end. A longer candidate list explores more side streets." },
      ],
    },
    {
      kind: "compare",
      title: "Three knobs (pgvector defaults)",
      cols: [
        { title: "m · 16", icon: "🔗", tone: "blue", items: ["links per point", "more: better recall, more memory, slower build"] },
        { title: "ef_construction · 64", icon: "🏗️", tone: "purple", items: ["how hard the build searches for good links", "more: better graph, slower build"] },
        { title: "ef_search · 40", icon: "🔎", tone: "green", items: ["candidate list at query time", "more: better recall, slower queries"] },
      ],
      footer: "the alternative, IVFFlat: k-means clusters; scan only the nearest few",
      beats: [
        { say: "Three knobs. M: how many links each point keeps. More links, better recall, but more memory, and a slower build." },
        { say: "E F construction: how hard the build works to find good links. Higher builds a better graph, more slowly." },
        { say: "And E F search: the candidate list at query time. Higher means better recall, and slower queries. It's the one you tune most." },
        {
          say: "You'll also hear about I V F flat. It groups vectors into clusters with k means, then scans only the few clusters nearest the question. It builds faster and uses less memory, but must be rebuilt as the data shifts. HNSW is the usual default.",
          term: { word: "IVFFlat", meaning: "cluster first, then scan the nearest clusters" },
        },
      ],
    },
    {
      kind: "chart",
      title: "Tune ef_search by measuring",
      type: "line",
      labels: ["10", "20", "40", "80", "160", "320"],
      xLabel: "ef_search",
      series: [{ name: "recall@10 (illustrative)", values: [78, 88, 94, 97, 98.5, 99], tone: "green", step: 1 }],
      max: 100,
      unit: "%",
      note: { step: 2, text: "stop where recall meets the target · watch p95 latency", tone: "green" },
      beats: [
        { say: "How do you pick ef search? Take a thousand real questions, and find their true top ten with an exact scan. That's your answer key." },
        { say: "Raise ef search step by step, and record recall. The first steps buy a lot. The last ones buy almost nothing, and cost latency." },
        {
          say: "Stop where recall meets your target, while watching p ninety five latency: the time within which ninety five percent of searches finish.",
          tone: "key",
          term: { word: "p95 latency", meaning: "95% of requests finish within this" },
        },
      ],
    },

    // ------------------------------------------------------------ 3
    { kind: "section", num: "3", title: "When filters make results vanish", beats: [{ say: "Bug two. Workspace acme sees nothing." }] },
    {
      kind: "custom",
      name: "a3filter",
      beats: [
        { say: "All five hundred workspaces share one index. Acme's search is: the ten nearest chunks, where workspace equals acme. And acme owns one percent of the chunks." },
        {
          say: "The index knows nothing about workspaces. It returns its forty best from everyone, and only then does the filter run. On average, less than one of those forty belongs to acme. The user asked for ten. That's post filtering.",
          tone: "key",
          term: { word: "Post-filtering", meaning: "search first, filter after: results vanish" },
        },
        {
          say: "Filter during the walk instead? That's pre filtering, and it has its own problem. If ninety nine percent of points are off limits, the walk keeps hitting dead ends, and recall drops again.",
          term: { word: "Pre-filtering", meaning: "filter during the search: dead ends" },
        },
        { say: "Fixes, from most robust. Partition by the filter: one index per large tenant. The filter becomes free, and each graph is small." },
        { say: "Or use filter aware, iterative scans, which keep walking until enough rows pass. Pgvector added this in version zero point eight. And over fetching, asking for four hundred to keep ten, is a quick patch, not a design." },
      ],
    },
    {
      kind: "trap",
      myth: "For multi-tenant vector search, just add a WHERE clause.",
      truth: "With a selective filter, post-filtering silently returns too few results. Partition, or use filter-aware scans, and test filtered recall.",
      beats: [
        { say: "So the trap: for multi tenant vector search, just add a where clause." },
        { say: "With a selective filter, that silently returns too few results. Partition, or use filter aware scans. And measure recall with the filter on.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 4
    { kind: "section", num: "4", title: "When the index outgrows memory", beats: [{ say: "HNSW is fast because the whole graph sits in memory. What happens when it doesn't fit?" }] },
    {
      kind: "custom",
      name: "a3quant",
      beats: [
        { say: "One vector: a thousand and twenty four 32 bit numbers. Four kilobytes. Ten million of them: forty gigabytes, before the graph's own overhead." },
        {
          say: "Store smaller numbers. Sixteen bits halves it, with almost no loss. Eight bits, a quarter, with a small loss. That's quantization.",
          term: { word: "Quantization", meaning: "store each number in fewer bits" },
        },
        {
          say: "Binary quantization keeps just one bit per number: is it positive or negative? Thirty two times smaller, and comparing becomes counting differing bits, which is extremely fast.",
          term: { word: "Binary quantization", meaning: "1 bit per number: 32× smaller" },
        },
        { say: "Too rough on its own, so pair it with rescoring. Search the tiny index for two hundred rough candidates, then rescore just those with the full vectors. Hugging Face reported this keeping around ninety six percent of retrieval quality.", tone: "key" },
        { say: "Beyond that: disk based indexes like disk A N N, and sharding the index across machines, with replicas for capacity and failover.", tone: "aside" },
      ],
    },

    // ------------------------------------------------------------ 5
    { kind: "section", num: "5", title: "Exact words are back: BM25", beats: [{ say: "Bug three. The error code." }] },
    {
      kind: "compare",
      title: "Meaning search and keyword search fail in opposite places",
      cols: [
        { title: "Vector search wins", icon: "📍", tone: "blue", items: ["paraphrase: “logged out after an hour” → “session timeout”", "typos, synonyms, other languages"] },
        { title: "Keyword search wins", icon: "🔤", tone: "amber", items: ["exact codes: ERR_TOKEN_EXPIRED", "IDs, product names, rare terms"] },
      ],
      footer: "run both: hybrid search",
      beats: [
        { say: "E R R token expired means nothing to an embedding model. It maps the question to a vague, login trouble neighbourhood. Vector search wins on paraphrase: logged out after an hour finds session timeout." },
        { say: "Keyword search wins on exact codes, IDs, product names, and rare terms." },
        {
          say: "They fail in opposite places. So you run both. That's hybrid search.",
          tone: "key",
          term: { word: "Hybrid search", meaning: "keyword + vector search, merged" },
        },
      ],
    },
    {
      kind: "custom",
      name: "a3bm25",
      beats: [
        {
          say: "The keyword side almost always uses BM25, the classic ranking formula behind search engines. For each word of the query, it asks three questions.",
          term: { word: "BM25", meaning: "keyword ranking: rarity, frequency, length" },
        },
        {
          say: "How rare is the word? E R R token expired appears in three chunks out of ten million. A match is very telling. Login appears everywhere, so a match means little. That's inverse document frequency.",
          term: { word: "IDF", meaning: "rarer words count for more" },
        },
        { say: "How often does it appear in this chunk? More is better, with diminishing returns. A setting called k one controls how quickly it levels off." },
        { say: "And is the chunk just long? Long chunks contain more words by chance, so scores are adjusted for length. That's the setting b." },
      ],
    },
    {
      kind: "trap",
      myth: "Postgres full-text ranking (ts_rank) is BM25.",
      truth: "It isn't. ts_rank ignores how rare a word is across the collection, so a rare code isn't rewarded. Use real BM25, e.g. an extension or a search engine.",
      beats: [
        { say: "A trap for Postgres users. Built in full text ranking, T S rank, is BM25." },
        { say: "It isn't. It ignores how rare a word is across the whole collection, so a rare error code isn't rewarded the way it should be. Use a real BM25 implementation.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 6
    { kind: "section", num: "6", title: "One list from two: RRF", beats: [{ say: "Now we have two ranked lists. How do we merge them?", tone: "ask" }] },
    {
      kind: "custom",
      name: "a3rrf",
      beats: [
        { say: "Keyword search says runbook seventeen scores fourteen point two. Vector search says F A Q three scores zero point eight three. Completely different scales." },
        {
          say: "So don't combine scores at all. Combine positions. Reciprocal rank fusion gives each chunk one over sixty plus its rank, in every list it appears in, and adds them up.",
          term: { word: "RRF", meaning: "sum of 1 / (60 + rank) across lists" },
        },
        { say: "F A Q three: one over sixty two, plus one over sixty one. Runbook seventeen: one over sixty one, plus one over sixty three. Incident nine, only found once: one over sixty two." },
        { say: "Chunks both searches found rise to the top. A chunk found by one still gets some points. And the sixty keeps any single list from dominating.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 7
    { kind: "section", num: "7", title: "Best first: reranking", beats: [{ say: "Bug four. The right answer ranks fourth." }] },
    {
      kind: "custom",
      name: "a3rerank",
      beats: [
        {
          say: "The embedding model we search with is a bi encoder. The question and each chunk become vectors separately, so chunk vectors are computed in advance, and searching millions takes milliseconds. But question and chunk never actually see each other.",
          term: { word: "Bi-encoder", meaning: "encodes query and chunk separately" },
        },
        {
          say: "A cross encoder reads the question and one chunk together, as one input, and outputs a relevance score. It sees how each word relates to each word, so it judges far more accurately. But nothing can be precomputed.",
          term: { word: "Cross-encoder", meaning: "reads query + chunk together, scores it" },
        },
        { say: "So it's like hiring. Screen ten thousand CVs with a quick filter. Then properly interview the top twenty. Nobody interviews all ten thousand.", tone: "key" },
      ],
    },
    {
      kind: "flow",
      title: "Two stages: don't miss it, then put it first",
      cols: 4,
      rows: 2,
      nodeW: 360,
      nodeH: 140,
      nodes: [
        { id: "KW", c: 0, r: 0, label: "BM25\ntop 50", tone: "amber" },
        { id: "VS", c: 0, r: 1, label: "Vector search\ntop 50", tone: "blue" },
        { id: "RRF", c: 1, r: 0, label: "Fuse with RRF\n~100 → one list", tone: "purple" },
        { id: "RR", c: 2, r: 0, label: "Cross-encoder\nreranks the list", tone: "pink" },
        { id: "OUT", c: 3, r: 0, label: "Best 3–5\ninto the prompt", tone: "green" },
        { id: "G1", c: 1, r: 1, label: "goal: recall\ndon't miss it", tone: "muted" },
        { id: "G2", c: 2, r: 1, label: "goal: order\nput it first", tone: "muted" },
      ],
      edges: [
        { from: "KW", to: "RRF" },
        { from: "VS", to: "RRF" },
        { from: "RRF", to: "RR" },
        { from: "RR", to: "OUT" },
      ],
      show: [["KW", "VS"], ["RRF", "G1"], ["RR", "G2"], ["OUT"]],
      beats: [
        { say: "So the full retrieval stage. Run BM25 and vector search, fifty candidates each." },
        { say: "Fuse them with RRF. The goal here is recall: the right chunk must be somewhere in the list." },
        { say: "Then a cross encoder reranks that list. The goal here is order: the right chunk must end up first." },
        { say: "And the best three to five go into the prompt.", tone: "key" },
      ],
    },
    {
      kind: "compare",
      title: "The reranker adds 200 ms. Keep it?",
      cols: [
        { title: "Measure, with and without", icon: "📏", tone: "blue", items: ["recall@5: right chunk in the top 5?", "MRR: 1 / position of the first right chunk", "added p95 latency, cost per 1,000 queries"] },
        { title: "Skip it when…", icon: "⏭️", tone: "amber", items: ["the right chunk is nearly always top 3 already", "latency is tight: voice, autocomplete", "you only send 3 chunks anyway"] },
      ],
      beats: [
        {
          say: "Should you keep a reranker that adds two hundred milliseconds? Measure, with and without. Recall at five. And M R R, mean reciprocal rank: one over the position of the first right chunk, averaged. Plus latency and cost.",
          term: { word: "MRR", meaning: "average of 1 / rank of the first right result" },
        },
        { say: "Skip it when the right chunk is already nearly always in the top three, when latency is tight, like voice, or when you only send three chunks anyway." },
      ],
    },
    {
      kind: "custom",
      name: "a3mmr",
      beats: [
        { say: "Two finishing touches. Here's a top five by score alone. Three of them are the same fact: the policy, the F A Q, and a training deck." },
        {
          say: "Maximal marginal relevance picks chunks one at a time: each one relevant to the question, but least similar to those already picked. One fact, once. Room for the runbook and the incident.",
          term: { word: "MMR", meaning: "relevant, but unlike what's already picked" },
        },
        { say: "And a score threshold. Always sending the top five means always sending five, even when nothing is relevant. Drop low scores, and the assistant can honestly say it couldn't find the answer.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 8
    { kind: "section", num: "8", title: "Where should the vectors live?", beats: [{ say: "Finally, the architecture review question." }] },
    {
      kind: "compare",
      title: "Four homes for vectors",
      cols: [
        { title: "Extension", icon: "🐘", tone: "blue", items: ["pgvector in Postgres", "joins, transactions, backups you already run"] },
        { title: "Vector database", icon: "🗄️", tone: "purple", items: ["Qdrant, Weaviate, Milvus, Pinecone", "scale, filtering, sharding built in"] },
        { title: "Search engine", icon: "🔎", tone: "amber", items: ["Elasticsearch, OpenSearch", "great BM25 + filters, vectors added"] },
        { title: "Library", icon: "📦", tone: "green", items: ["FAISS", "fast in-process; no storage or updates"] },
      ],
      footer: "decide on numbers: filtered recall, p95 at peak, re-index time, monthly cost",
      beats: [
        { say: "Where should the vectors live? Four families. An extension in the database you already run, like pgvector in Postgres. Joins, transactions, and backups come for free." },
        { say: "A dedicated vector database, like Qdrant, Weaviate, Milvus, or Pinecone. Built for scale, with filtering and sharding handled for you." },
        { say: "A search engine with vectors added, like Elasticsearch or OpenSearch. Excellent BM25 and filtering in the same engine." },
        { say: "And a library like FAISS: very fast inside your program, but no storage, updates or durability. Great for experiments." },
        { say: "Decide on numbers, from your own data: filtered recall, p ninety five at peak load, re-index time, and the monthly bill. And keep retrieval behind a small interface, so switching later is cheap.", tone: "key" },
      ],
    },
    {
      kind: "trap",
      myth: "We need a vector database because we're doing RAG.",
      truth: "Not a reason. Many production RAG systems run on pgvector or Elasticsearch. Choose by scale, filtering, keyword needs, and who runs it at 3 a.m.",
      beats: [
        { say: "And the classic trap: we need a vector database, because we're doing RAG." },
        { say: "That's not a reason. Plenty of production RAG systems run on pgvector or Elasticsearch. Choose by scale, filtering, keyword needs, and who will run it at three in the morning.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 9
    { kind: "section", num: "9", title: "Interview round", beats: [{ say: "Interview round.", tone: "excite" }] },
    {
      kind: "sayit",
      q: "How does HNSW work, and how would you tune it?",
      lines: [
        "A multi-layer graph: every vector on the bottom layer, a random few on higher layers with longer links.",
        "Search starts at the top, greedily hops toward the query, and drops a layer when stuck.",
        "On the bottom layer it keeps ef_search candidates and returns the best k.",
        "m and ef_construction shape the graph; ef_search trades recall for latency at query time.",
        "Tune ef_search against exact-scan ground truth, watching recall@10 and p95.",
      ],
      beats: [
        { say: "How does HNSW work, and how would you tune it?" },
        { say: "It's a multi layer graph. Every vector is on the bottom layer, and a random few also live on higher layers, with longer links." },
        { say: "Search starts at the top, greedily hops toward the query, and drops a layer when no neighbour is closer." },
        { say: "On the bottom layer, it keeps ef search candidates, and returns the best k." },
        { say: "M and ef construction shape the graph. Ef search trades recall for latency, at query time." },
        { say: "I'd tune ef search against exact scan ground truth, watching recall at ten and p ninety five.", tone: "key" },
      ],
    },
    {
      kind: "drill",
      items: [
        { q: "Why does a filtered vector search return too few results?", a: "Post-filtering: the index returns its best k from everyone, then the filter removes most. Partition or use filter-aware scans." },
        { q: "Why RRF instead of adding scores?", a: "Scores sit on different, shifting scales; ranks are always comparable." },
        { q: "Bi-encoder vs cross-encoder?", a: "Bi-encoder: separate vectors, precomputed, fast, rough. Cross-encoder: reads both together, accurate, only for a shortlist." },
        { q: "What does IDF do in BM25?", a: "Rewards rare words: a match on a rare code is far more telling than on a common word." },
        { q: "How do you fit 10M vectors in less memory?", a: "Quantize: float16, int8, or binary with rescoring; or fewer dimensions; or a disk-based index." },
        { q: "What is MRR?", a: "The average of 1 / the rank of the first relevant result." },
        { q: "HNSW or IVFFlat?", a: "HNSW by default: better recall and speed. IVFFlat builds faster and uses less memory, but needs rebuilding as data shifts." },
      ],
      beats: [
        { say: "Rapid fire. Why does a filtered vector search return too few results?", tone: "ask", hold: 2.5 },
        { say: "Post filtering. The index returns its best k from everyone, then the filter removes most of them. Partition, or use filter aware scans." },
        { say: "Why RRF, instead of adding scores?", tone: "ask", hold: 2.5 },
        { say: "Scores sit on different scales that shift from query to query. Ranks are always comparable." },
        { say: "Bi encoder versus cross encoder?", tone: "ask", hold: 2.5 },
        { say: "A bi encoder makes separate vectors: precomputed, fast, and rough. A cross encoder reads both together: accurate, so only for a shortlist." },
        { say: "What does I D F do in BM25?", tone: "ask", hold: 2.5 },
        { say: "It rewards rare words. A match on a rare code is far more telling than a match on a common word." },
        { say: "How do you fit ten million vectors in less memory?", tone: "ask", hold: 2.5 },
        { say: "Quantize: sixteen bit, eight bit, or binary with rescoring. Or use fewer dimensions, or a disk based index." },
        { say: "What is M R R?", tone: "ask", hold: 2.5 },
        { say: "The average of one over the rank of the first relevant result." },
        { say: "Last one. HNSW, or I V F flat?", tone: "ask", hold: 2.5 },
        { say: "HNSW by default, for better recall and speed. I V F flat builds faster and uses less memory, but needs rebuilding as the data shifts.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "recap",
      props: {
        items: [
          ["🕸️", "HNSW", "highways down to local roads"],
          ["🎚️", "ef_search", "recall vs latency, measured"],
          ["🫥", "Filters", "post-filtering empties results"],
          ["🗜️", "Quantization", "binary + rescoring"],
          ["🔀", "Hybrid + RRF", "BM25 and vectors, by rank"],
          ["🎯", "Rerank", "cross-encoder on a shortlist"],
        ],
      },
      beats: [
        { say: "Let's lock it in." },
        { say: "HNSW: highways down to local roads, with a greedy walk." },
        { say: "Ef search trades recall for latency. Tune it by measuring." },
        { say: "Post filtering can empty your results. Partition, or filter during the scan." },
        { say: "Quantization shrinks vectors. Binary plus rescoring keeps most of the quality." },
        { say: "Hybrid search runs BM25 and vectors, merged by rank with RRF." },
        { say: "And a cross encoder reranks the shortlist, so the best chunk comes first.", tone: "key" },
      ],
    },
    {
      kind: "pause",
      visual: "docs",
      question: "Search is now fast and precise. But users ask vague questions, follow-ups like “and for contractors?”, and PDFs with tables come out garbled. What breaks first?",
      beats: [
        { say: "Search is now fast, and precise." },
        { say: "But users ask vague questions. They send follow ups like, and for contractors? And PDF tables come out garbled. Which of these breaks your answers first?", tone: "ask", hold: 3 },
      ],
    },
    {
      kind: "title",
      eyebrow: "Next",
      title: "Chapter 4 — When retrieval still fails",
      subtitle: "rewriting, correcting, and fixing the pipeline",
      beats: [{ say: "That's chapter four. See you there.", tone: "excite" }],
    },
  ],
};
