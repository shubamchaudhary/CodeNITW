import type { Scene } from "../../lib/types.ts";
import { B, sec } from "./h.ts";
import { check } from "./k.ts";

// Part 8: per-session chunk tables. Why (post-filtering on a shared HNSW
// index), every alternative measured, the costs, the way out at scale, and
// how to defend it.
export const p8: Scene[] = [
  // ------------------------------------------------------------ 22
  sec("22", "Why a new table for every session", "Topic twenty two. The design choice interviewers question most. Why does every session get its own chunk table? The answer is one word: selectivity."),
  {
    kind: "big",
    tone: "idea",
    lead: "Start from the query",
    text: "Every search is \"nearest chunks, within this one session\".",
    after: "a vector search with a filter, and the filter is very selective",
    beats: B(
      "Start from the query, not the schema.",
      { say: "Every search in DeepLogLens is: the nearest chunks to this question, within this one session. Never across sessions.", tone: "key" },
      "So it's a vector search with a filter. And the filter is very selective: one session is a tiny fraction of all the chunks on the server.",
    ),
  },
  {
    kind: "bullets",
    title: "How an HNSW search walks",
    items: [
      { icon: "🪜", text: "Layers: few nodes with long links on top, every node with short links at the bottom", sub: "each vector is linked to about m = 16 neighbours" },
      { icon: "🚶", text: "A greedy walk: start at the top, move towards the query, drop a layer, repeat", sub: "it never looks at most of the vectors: that's why it's fast" },
      { icon: "📋", text: "It keeps the best ef_search candidates (40 by default)", sub: "a longer list = better recall, slower search · approximate: it can miss a true neighbour" },
      { icon: "🚫", text: "It knows nothing about your WHERE clause", sub: "the filter runs after the walk: post-filtering" },
    ],
    beats: B(
      { say: "Quickly, how an H N S W search walks. The index is a stack of layers. A few nodes with long links on top, every node with short links at the bottom. Each vector links to about sixteen neighbours.", term: { word: "HNSW", meaning: "a layered graph of near neighbours, walked greedily" } },
      "A search starts at the top, walks greedily towards the query, drops a layer, and repeats. It never looks at most of the vectors, which is why it's fast.",
      { say: "On the way, it keeps a list of the best candidates, ef search of them, forty by default. A longer list means better recall, and a slower search. It's approximate: it can miss a true neighbour the walk never reached.", term: { word: "ef_search", meaning: "how many candidates the walk keeps" } },
      { say: "And here's the catch. The walk knows nothing about your where clause. The session filter runs after the walk. That's called post filtering.", tone: "key" },
    ),
  },
  {
    kind: "custom",
    name: "llfilter",
    beats: B(
      "Watch what that does. One shared table, a hundred and twenty thousand vectors, from a hundred and one sessions. A small session, s oh five oh, owns less than one percent of the rows.",
      "Its question vector arrives, and the shared H N S W index is walked.",
      { say: "The walk keeps its forty best candidates, without knowing about the filter. Almost all forty belong to other sessions.", term: { word: "Post-filtering", meaning: "the index searches first, the WHERE filters after" } },
      { say: "Then the session filter runs, and almost nothing survives. Measured: nought point six eight rows back, of the ten that were asked for. Recall nought point oh six eight.", tone: "excite" },
      { say: "With its own table, the walk only ever sees that session's vectors. Recall one point oh, in a quarter of a millisecond.", tone: "key" },
    ),
  },
  {
    kind: "chart",
    title: "Small session s050: recall@10 as ef_search grows",
    type: "line",
    labels: ["40", "100", "200", "400"],
    series: [
      { name: "own table per session", values: [1, 1, 1, 1], tone: "green", step: 1 },
      { name: "shared + iterative scan (pgvector 0.8)", values: [0.256, 0.256, 0.256, 0.256], tone: "purple", step: 2 },
      { name: "shared HNSW, then filter", values: [0.068, 0.134, 0.208, 0.244], tone: "red", step: 3 },
    ],
    max: 1,
    xLabel: "ef_search",
    note: { step: 4, text: "10× more candidates: 0.7 → 2.4 rows of 10. The extra candidates are spent on other sessions.", tone: "red" },
    beats: B(
      "Can't you just raise ef search? Here's what was measured, for the same small session.",
      "Its own table: one point oh, at every setting.",
      "The shared table with pgvector's newer iterative scan, which keeps walking when the filter removes too much: nought point two five six. It stops at its scan cap of twenty thousand tuples.",
      "The shared table with plain post filtering: nought point oh six eight at forty, rising to only nought point two four four at four hundred.",
      { say: "Ten times more candidates moved it from about one row of ten to about two. The extra candidates are spent on other sessions' vectors.", tone: "key" },
    ),
  },
  {
    kind: "big",
    tone: "idea",
    lead: "The insight to say out loud",
    text: "What breaks filtered vector search is selectivity, not table size.",
    after: "and a quick test hides it: on a small match, the planner skips HNSW and scans exactly",
    beats: B(
      "So here's the sentence to say out loud.",
      { say: "What breaks filtered vector search is selectivity, not table size. The smaller the session's share of the table, the worse the recall.", tone: "key" },
      { say: "And why nobody notices: a quick test passes. When the filter matches only a thousand rows, the planner skips H N S W and does an exact scan. Two sessions of the same size measured sixty five percent and seven percent, depending on which plan the planner picked.", tone: "key" },
    ),
  },
  check({
    topic: "per-session tables",
    q: "On a shared table, why does raising ef_search barely help a small session?",
    options: ["ef_search only affects index builds", "The walk ignores the filter, so the extra candidates mostly belong to other sessions and are filtered out afterwards", "Small sessions have no embeddings", "HNSW caps results at 10"],
    answer: 1,
    a: "Post-filtering: the walk doesn't know the WHERE clause. More candidates are mostly other sessions' vectors, removed after the walk: 10× ef_search moved recall from 0.068 to 0.244.",
    aSay: "B. It's post filtering. The walk doesn't know about the where clause, so the extra candidates are mostly other sessions' vectors, and they're thrown away after the walk. Ten times the ef search moved recall from nought point oh six eight to only nought point two four.",
  }),

  // ------------------------------------------------------------ 23
  sec("23", "Every alternative, and how to defend the choice", "Topic twenty three. Six other ways to store per session vectors. Each one measured or reasoned, so you can say why you didn't pick it."),
  {
    kind: "custom",
    name: "dlltable",
    props: {
      title: "Seven layouts for filtered vector search",
      name: "s050 · 120k vectors · 101 sessions",
      sub: "recall@10 · p50",
      cols: [
        { n: "shared HNSW + WHERE", t: "0.068 · 0.36 ms", k: "✗", note: "Fast, and wrong. Post-filtering throws away almost every candidate: 0.68 rows of the 10 asked for." },
        { n: "shared + iterative", t: "0.256 · 0.48 ms", k: "✗", note: "pgvector 0.8 keeps walking when the filter empties the list, but stops at max_scan_tuples (20,000). Better, still mostly wrong for small sessions." },
        { n: "shared, exact scan", t: "1.00 · 0.55 ms", k: "~", note: "B-tree on session_id, then sort by distance. Correct, but cost grows linearly with the session: a 100,000-chunk session compares 100,000 vectors per query." },
        { n: "partial HNSW index", t: "1.00 · 0.29 ms", k: "~", note: "CREATE INDEX … WHERE session_id = '…'. Correct and fast, but still DDL per session, the query's predicate must match the index's exactly, and deletes leave dead rows in the shared heap." },
        { n: "LIST partitions", t: "1.00 · 0.40 ms", k: "~", note: "The closest alternative: same isolation, partition pruning, the same catalog cost. It's the path for scale-out (next slide)." },
        { n: "separate vector DB", t: "native filters", k: "✗", note: "Pinecone/Qdrant namespaces filter natively, but it's a second store: two writes per chunk that can drift, no joins with metrics or findings, no shared transaction, and the idempotent single-transaction write is gone." },
        { n: "own table / session", t: "1.00 · 0.24 ms", k: "✓", note: "What shipped. Recall 1.0 at the lowest latency, because the HNSW graph only ever contains its own session's vectors." },
      ],
      foot: "the argument: correct recall at the lowest latency, inside the one database that already holds the truth",
    },
    beats: B(
      "Here are seven layouts, measured on the same hundred and twenty thousand vectors, for the same small session. Recall at ten, and median latency.",
      "One. A shared table, H N S W, and a where clause. Fast, and wrong. Nought point oh six eight.",
      "Two. Shared, with pgvector's iterative scan. It keeps walking when the filter empties the list, but stops at its tuple cap. Nought point two five six. Better, still mostly wrong.",
      { say: "Three. Shared, but exact: a B tree on the session ID, then sort by distance. Correct, recall one point oh. But its cost grows linearly with the session. A hundred thousand chunk session compares a hundred thousand vectors on every query.", tone: "key" },
      "Four. A partial H N S W index per session, create index where session ID equals. Correct and fast. But it's still D D L per session, the query's predicate has to match the index's exactly or the planner won't use it, and deleting a session leaves dead rows in the shared table.",
      { say: "Five. A list partition per session. The closest alternative, and I'd say so. The same isolation, partition pruning, the same catalog cost. It's the path for scale, on the next slide.", tone: "key" },
      "Six. A separate vector database, with namespaces that filter natively. But it's a second store. Two writes per chunk that can drift apart, no joins with the metrics or findings, no shared transaction, and the idempotent single transaction write from topic eleven is gone.",
      { say: "Seven. Its own table per session. What shipped. Recall one point oh, at the lowest latency, a quarter of a millisecond, because the H N S W graph only contains that session's vectors.", tone: "key" },
      { say: "Your argument in one line: correct recall at the lowest latency, inside the one database that already holds the truth.", tone: "key" },
    ),
  },
  {
    kind: "decision",
    question: "A table per session: what does it buy, and what does it cost?",
    answer: "It buys recall 1.0 and isolation; it costs runtime DDL and catalog growth, and partitions are the way out.",
    left: { title: "Buys", items: ["recall 1.00 in 0.24-0.60 ms", "each graph holds only its own rows", "DROP TABLE: instant, no vacuum", "small builds: 3.3 s vs 15.4 s shared"] },
    right: { title: "Costs", items: ["runtime DDL (UUID-validated name)", "raw JDBC: JPA can't map it", "catalog growth slows planning", "migrations loop over every table"] },
    footer: "the way out at scale: LIST/HASH partitions by tenant, then day; only name resolution changes",
    beats: B(
      "Now the honest trade off, as a decision. What does a table per session buy, and what does it cost?",
      "It buys recall and isolation. It costs runtime D D L and catalog growth. And partitions are the way out when it gets big.",
      { say: "What it buys. Recall one point oh in a quarter to sixty hundredths of a millisecond. Each graph holds only its own rows. Deleting a session is a drop table: instant, no dead rows, nothing to vacuum. And small index builds: three per session tables built in three point three seconds, against fifteen point four for one shared index. What it costs. Tables are created at runtime, so the name is built only from a validated U U I D, which makes injection impossible. Raw JDBC, because JPA can't map a dynamic table. Catalog growth: tens of thousands of tables slow the planner. And migrations have to loop over every table.", tone: "key" },
      { say: "And the way out. At thousands of tenants, move to list or hash partitions, by tenant, then by day. Only the name resolution changes. The queries stay the same.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "The table's life",
    items: [
      { icon: "🐣", text: "Created with the session", sub: "CREATE TABLE + HNSW, GIN and B-tree indexes · if that fails, the session row is removed" },
      { icon: "✍️", text: "Written by ingest, updated by enrichment", sub: "insert at parse time; one UPDATE per chunk for the embedding (one dead tuple, autovacuum cleans it)" },
      { icon: "🧨", text: "Deleted with DROP TABLE", sub: "instant · nothing to vacuum · the shared tables are cleaned by session_id" },
    ],
    beats: B(
      "The table's life, in three steps. It's created with the session, with its three indexes. If creating it fails, the session row is removed, so a session never exists without its table.",
      "It's written by ingest, and updated once per chunk when the embedding arrives. One dead tuple per update, which autovacuum cleans up.",
      { say: "And it's deleted with drop table. Instant, and nothing to vacuum.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "How to choose, in general",
    items: [
      { icon: "🟢", text: "The filter matches most rows", sub: "a shared HNSW index plus a WHERE is fine" },
      { icon: "🟡", text: "A few percent or less, up to thousands of tenants", sub: "own table, or a partial index (DeepLogLens today)" },
      { icon: "🔵", text: "Many thousands of tenants", sub: "LIST or HASH partitions" },
      { icon: "🟣", text: "You can't isolate at all", sub: "iterative scan: tune max_scan_tuples and watch latency" },
    ],
    beats: B(
      "And the general rule, so you sound like you'd make the same call on a different system. If the filter matches most rows, a shared index with a where clause is fine.",
      "If it matches a few percent or less, with up to thousands of tenants: an own table, or a partial index. That's DeepLogLens today.",
      "Many thousands of tenants: list or hash partitions.",
      "And if you can't isolate at all, use the iterative scan, tune its tuple cap, and watch the latency.",
    ),
  },
  {
    kind: "sayit",
    q: "\"Why a new table for each session? Isn't that an anti-pattern?\"",
    lines: [
      "Every query is a vector search filtered to one session, and that filter is very selective.",
      "A shared HNSW index post-filters: for a small session I measured recall 0.068.",
      "Raising ef_search 10× only reached 0.24, and the iterative scan 0.26.",
      "A table per session gives recall 1.0 at 0.24 ms, and deleting a session is a DROP TABLE.",
      "The cost is runtime DDL and catalog growth; at thousands of tenants I'd move to LIST partitions.",
    ],
    beats: B(
      { say: "Say it with me. Why a new table for each session? Isn't that an anti pattern?", tone: "ask" },
      "Every query is a vector search filtered to one session, and that filter is very selective.",
      "A shared H N S W index post filters. For a small session, I measured recall of nought point oh six eight.",
      "Raising ef search ten times only reached nought point two four, and the iterative scan nought point two six.",
      "A table per session gives recall one point oh at a quarter of a millisecond, and deleting a session is a drop table.",
      { say: "The cost is runtime D D L and catalog growth. At thousands of tenants, I'd move to list partitions, and only the name resolution would change.", tone: "key" },
    ),
  },
  check({
    topic: "the alternatives",
    q: "Which alternative is closest to a table per session, and when would you switch to it?",
    options: ["A separate vector DB, at any scale", "LIST partitions per session (or tenant, then day), once table count makes the catalog and planning slow", "The iterative scan, immediately", "One shared table with a bigger ef_search"],
    answer: 1,
    a: "LIST (or HASH) partitions: the same isolation and recall, with pruning. Switch at thousands of tenants, when tens of thousands of tables slow planning; only the table-name resolution changes.",
    aSay: "B. List partitions. The same isolation and recall, with partition pruning. You'd switch at thousands of tenants, when tens of thousands of tables start to slow the planner, and only the table name resolution changes.",
  }),
  check({
    topic: "the alternatives",
    q: "\"Why not a dedicated vector database?\" Give two arguments.",
    a: "1) It's a second store: two writes per chunk that can drift, no shared transaction, so the idempotent single-transaction write breaks. 2) No joins with metrics, findings and line ranges, which every answer needs.",
    aSay: "Two arguments. One: it's a second store, so every chunk needs two writes that can drift apart, with no shared transaction, and the idempotent single transaction write breaks. Two: no joins with the metrics, the findings and the line ranges, which every answer needs. And the measured bottlenecks were parsing and writes, never vector search.",
  }),
];
