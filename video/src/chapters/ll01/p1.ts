import type { Scene } from "../../lib/types.ts";
import { B, arch, sec } from "./h.ts";
import { check } from "./k.ts";
import { SITE, SITE_STEPS } from "./diagrams.ts";

// Part 1: how the lecture works, the problem, the resume as a map, the
// vocabulary, the whole board, and the upload path.
export const p1: Scene[] = [
  {
    kind: "title",
    eyebrow: "Projects · DeepLogLens",
    title: "DeepLogLens, end to end",
    subtitle: "Grounded RAG log intelligence over an async Kafka pipeline",
    beats: B(
      "DeepLogLens. A grounded RAG log intelligence platform, built on an asynchronous Kafka pipeline. We are going to go slowly. One idea at a time. And after every idea, I'll stop and ask you a question, so you know it has stuck before we build the next thing on top of it.",
    ),
  },
  {
    kind: "bullets",
    title: "How each topic will go",
    firstItemStep: 1,
    items: [
      { icon: "🎯", text: "The problem it solves", sub: "why the piece exists at all" },
      { icon: "🧱", text: "The mechanism, box by box", sub: "messages, tables, transactions, drawn and filled in step by step" },
      { icon: "⚖️", text: "The options you rejected", sub: "one or two real alternatives, and the argument for your choice" },
      { icon: "✋", text: "A check", sub: "a question with a pause: answer it out loud before the answer appears" },
    ],
    beats: B(
      "Here's how each topic will go.",
      "First, the problem the piece solves. If you can't say why something exists, you can't defend it.",
      "Then the mechanism, box by box. The actual messages, the actual tables, the actual transaction. We'll fill each diagram in one step at a time.",
      { say: "Then the options you didn't choose. One or two real alternatives for every big decision, and the argument for the one you chose. That's what makes an interviewer believe the design is yours: you know what else you could have done, and why you didn't.", tone: "key" },
      "And then a check. A question appears, a ring counts down a few seconds of thinking time, and you answer out loud, with the reason, before the answer appears.",
    ),
  },
  {
    kind: "big",
    tone: "idea",
    lead: "One rule for the whole lecture",
    text: "Every sentence here matches a line on your resume.",
    after: "the resume is the map; this lecture is the territory behind each phrase",
    beats: B(
      "One rule for this whole lecture.",
      { say: "Every sentence you'll hear matches a line on your resume. Your resume is the map. This lecture is the territory behind each phrase on it.", tone: "key" },
      "So when an interviewer points at any phrase, idempotent upserts, corrective RAG, per session tables, you'll know the mechanism, the alternatives, and the numbers behind it.",
    ),
  },

  // ------------------------------------------------------------ 1
  sec("1", "The problem", "Topic one. The problem. What is DeepLogLens actually for?"),
  {
    kind: "big",
    tone: "idea",
    lead: "The scenario",
    text: "3 AM. Checkout returns 503. You have a 2 GB log archive.",
    after: "what broke · since when · how many users were hit",
    beats: B(
      "Picture the scenario it's built for.",
      "It's three in the morning. Checkout is returning five oh threes. You have a two gigabyte log archive from a dozen services.",
      { say: "And your manager wants three answers. What broke, since when, and how many users were hit.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "Why \"just paste the logs into an LLM\" fails",
    cols: [
      { title: "Volume", icon: "📦", tone: "blue", items: ["2 GB ≈ 15 million lines", "no context window holds it"] },
      { title: "Counting", icon: "🔢", tone: "red", items: ["\"how many 503s?\"", "a model estimates; it does not count"] },
      { title: "Trust", icon: "🔍", tone: "amber", items: ["no line numbers", "nobody can check the answer"] },
      { title: "Cost", icon: "💸", tone: "purple", items: ["you pay for every minute of logs", "to learn about the few that matter"] },
    ],
    footer: "so: code counts, the LLM explains only what's abnormal, every claim points at stored evidence",
    beats: B(
      "The naive fix is to paste the logs into a chat model. It fails four separate ways. Volume: two gigabytes is about fifteen million lines. No context window holds that.",
      "Counting. Ask how many five oh threes there were. A language model estimates from what it sees. It doesn't count.",
      "Trust. The answer comes with no line numbers, so nobody can check it.",
      "Cost. You pay to send every minute of logs, to learn about the handful of minutes that matter.",
      { say: "So DeepLogLens gives each job to the tool that's good at it. Code counts every line, exactly. The LLM only explains the minutes that look abnormal. And every claim points at stored evidence, down to the line numbers.", tone: "key" },
    ),
  },
  {
    kind: "numbers",
    title: "The constraints it was built under",
    items: [
      { value: "512 MB", label: "the whole box", sub: "Render free tier · heap ≈ 256 MB", tone: "blue" },
      { value: "30 RPM", label: "per Groq key", sub: "and 6,000 tokens per minute", tone: "amber" },
      { value: "100 %", label: "exact counts", sub: "even after a crash and a redelivery", tone: "green" },
    ],
    footer: "three constraints explain most of the design: bounded memory, rate limits, exactly-once effects",
    beats: B(
      "And it was built under three hard constraints. First, the box. Five hundred and twelve megabytes of RAM for the whole service, so a heap of about two hundred and fifty six megabytes. A two gigabyte file can never be loaded.",
      "Second, rate limits. Thirty requests and six thousand tokens per minute, per Groq key, on the free tier.",
      "Third, correctness. Counts have to be exact, a hundred percent, even after a crash and a redelivery.",
      { say: "Remember these three. Bounded memory, rate limits, exactly once effects. They explain almost every box we're about to draw.", tone: "key" },
    ),
  },
  check({
    topic: "the problem",
    q: "Why does DeepLogLens never ask the LLM \"how many 503s were there?\"",
    options: ["The context window is too small for the question", "A model estimates from what it sees; deterministic parsers count every line exactly", "Groq doesn't allow numeric answers", "Counting would cost too many tokens per window"],
    answer: 1,
    a: "Because a language model estimates; it doesn't count. Parsers count every line exactly, so numbers always come from code.",
    aSay: "B. A language model estimates from what it sees. It doesn't count. So every number comes from deterministic parsers that see every line, and the LLM is only asked to explain.",
  }),

  // ------------------------------------------------------------ 2
  sec("2", "Your resume, as a map", "Topic two. Your resume, read as a map of this lecture. Three bullets, and every phrase in them gets its own topic."),
  {
    kind: "bullets",
    title: "Bullet 1: what it does",
    items: [
      { icon: "📚", text: "Log intelligence over GB-scale archives", sub: "detects anomalies · writes grounded incident reports · answers questions citing exact log lines" },
      { icon: "🧮", text: "Deterministic parsers compute all metrics", sub: "topic 13: eight parsers, exact per-minute counts in Postgres" },
      { icon: "🚦", text: "LLM runs only on flagged windows, cutting LLM calls by 80%", sub: "topic 14: the anomaly gate · 42,205 calls instead of 220,657 on the 1 GB run" },
    ],
    beats: B(
      "Bullet one says what it does. Log intelligence over gigabyte scale archives. It detects anomalies, writes grounded incident reports, and answers questions citing exact log lines.",
      "Deterministic parsers compute all the metrics. That's topic thirteen.",
      { say: "And the LLM runs only on flagged windows, cutting LLM calls by eighty percent. That's the anomaly gate, topic fourteen. On the one gigabyte demo run: forty two thousand two hundred and five calls, instead of two hundred and twenty thousand six hundred and fifty seven. Eighty point nine percent fewer.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "Bullet 2: how it ingests",
    items: [
      { icon: "📏", text: "Constant-heap streaming ingest", sub: "topic 12: live set 70-92 MB from 100 MB to 2 GB files" },
      { icon: "✂️", text: "Window-aligned byte ranges, fanned out over Kafka, read in parallel", sub: "topics 6 to 8: the pointers, the splitter, the partitions" },
      { icon: "✅", text: "Offsets commit after durable writes", sub: "topic 9: manual ack, only after the transaction commits" },
      { icon: "🔁", text: "Idempotent upserts: at-least-once delivery → exactly-once effects", sub: "topics 10 and 11: the content-fingerprint primary key" },
    ],
    beats: B(
      "Bullet two says how it ingests. Constant heap streaming ingest. Memory doesn't grow with the file. That's topic twelve.",
      "Archives split into window aligned byte ranges, fanned out over Kafka, and read in parallel. Topics six to eight: the pointers, the splitter, the partitions.",
      "Offsets commit after durable writes. Topic nine.",
      { say: "And idempotent upserts turn at least once delivery into exactly once effects. Topics ten and eleven. The content fingerprint primary key. This is the part you said you want to defend best, so we'll go slowest there.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "Bullet 3: the two graphs and the search",
    items: [
      { icon: "🧑‍⚖️", text: "Ingest-time graph with an LLM-as-judge groundedness loop", sub: "topic 19: write the incident story, judge it, rewrite it, at most 3 times" },
      { icon: "🔄", text: "Query-time corrective RAG: retrieve → grade → rewrite → re-retrieve", sub: "topic 21" },
      { icon: "🔀", text: "Hybrid vector + full-text search", sub: "topic 20: HNSW and GIN, fused with Reciprocal Rank Fusion" },
      { icon: "🗂", text: "Per-session HNSW/GIN-indexed chunk tables", sub: "topics 22 and 23: why a table per session, and every alternative" },
    ],
    beats: B(
      "Bullet three is the AI part. Two LangGraph graphs. The ingest time one writes incident stories, with an LLM as judge groundedness loop. Topic nineteen.",
      "The query time one is corrective RAG. Retrieve, grade, rewrite, re retrieve. Topic twenty one.",
      "Over hybrid search: vector plus full text. Topic twenty.",
      { say: "On per session chunk tables, each with its own H N S W and gin index. Topics twenty two and twenty three. Why a new table for every session, and every alternative you could have picked instead.", tone: "key" },
    ),
  },
  check({
    topic: "the resume map",
    q: "Which resume phrase is the reason a Kafka redelivery never doubles a count?",
    options: ["Constant-heap streaming ingest", "Window-aligned byte ranges", "Idempotent upserts", "Corrective RAG"],
    answer: 2,
    a: "Idempotent upserts. Kafka delivers at least once; an upsert that is safe to apply twice turns that into exactly-once effects.",
    aSay: "C. Idempotent upserts. Kafka can deliver a message more than once. An upsert that's safe to apply twice is what turns at least once delivery into exactly once effects.",
  }),

  // ------------------------------------------------------------ 3
  sec("3", "The vocabulary", "Topic three. Eight words. Every later topic uses them, so let's pin them down first."),
  {
    kind: "bullets",
    title: "Eight words",
    items: [
      { icon: "🗂", text: "Session · Document", sub: "one investigation, which owns its own chunk table · one uploaded file, e.g. app.log, 2 GB" },
      { icon: "✂️", text: "Part", sub: "a byte range of a document · never copied, only pointed at" },
      { icon: "🪟", text: "Window (chunk)", sub: "60 seconds of lines, one row, with its exact line range · keyed by a content fingerprint" },
      { icon: "🔢", text: "Metric", sub: "an exact count for one window and category: API / api_5xx = 212" },
      { icon: "💡", text: "Finding · Incident · Report", sub: "the LLM's explanation of a window · related findings with a judged story · the session summary" },
    ],
    beats: B(
      "Eight words, largest container first. A session is one investigation: checkout outage, September the twenty ninth. Remember, each session owns its own chunk table. And a document is one uploaded file in it: app dot log, two gigabytes.",
      { say: "A part is a byte range of a document. Bytes fifteen million to twenty one million, say. It's never copied. It's only pointed at.", term: { word: "Part", meaning: "a byte range of a file, only pointed at" } },
      { say: "A window, which we also call a chunk, is sixty seconds of log lines, stored as one row, with its exact first and last line numbers. And its primary key is a fingerprint of its content. Hold on to that.", term: { word: "Chunk", meaning: "one 60 s window of lines, one row" } },
      "A metric is an exact count for one window and one category. API, five xx responses, two hundred and twelve.",
      "And three things the AI produces. A finding is the LLM's explanation of one flagged window. An incident is a group of related findings with a judged story. And the report summarises the session.",
    ),
  },
  {
    kind: "big",
    tone: "idea",
    lead: "Why the window is the centre",
    text: "Metrics, flags, findings, search and citations all share the same 60-second window.",
    after: "so a citation points at exactly the minute that was counted, flagged and explained",
    beats: B(
      "Why is the window the centre of everything?",
      "Because the metrics, the anomaly flags, the findings, the search results, and the citations all share the same sixty second window.",
      { say: "So when an answer cites a window, it points at exactly the minute that was counted, flagged, and explained, with its line range. That's what citing exact log lines means.", tone: "key" },
    ),
  },
  check({
    topic: "vocabulary",
    q: "A part and a chunk: what's the difference?",
    a: "A part is a byte range of the uploaded file, a unit of parallel work (about 5 MB). A chunk is one 60-second window of lines, stored as a row (many per part).",
    aSay: "A part is a byte range of the uploaded file, about five megabytes, and it's the unit of parallel work on Kafka. A chunk is one sixty second window of lines, stored as a row in Postgres. One part produces many chunks.",
  }),

  // ------------------------------------------------------------ 4
  sec("4", "The whole system on one board", "Topic four. The whole system on one board. Then we'll zoom into each box."),
  {
    kind: "big",
    tone: "idea",
    lead: "The two golden rules",
    text: "The request path never does heavy work. Kafka moves facts, blob storage moves bytes, Postgres holds the truth.",
    beats: B(
      "Before the board, two golden rules. Everything else follows from them.",
      { say: "One. The user facing request path never does heavy work. Upload returns in milliseconds, and everything expensive happens asynchronously, behind Kafka. Two. Kafka moves facts, blob storage moves bytes, Postgres holds the truth.", tone: "key" },
    ),
  },
  arch(
    SITE,
    SITE_STEPS,
    B(
      "Here's the board. The client, the blob store, one application server with the API and the workers, Kafka, the LLM providers, Postgres for data and vectors, LangGraph for root cause and questions, and Redis for chat history. Let's follow one file through it, in seven steps, with the numbers from the one gigabyte demo run.",
      "Upload. The browser sends the file straight to the blob store with a short lived upload link. The API only checks that it arrived. One gigabyte, and the API never held a byte of it.",
      "Split. A splitter reads the file once and cuts it into pieces of about five megabytes, always at a minute boundary. A tiny pointer to each piece goes on Kafka. Two hundred and five pieces.",
      "Parse. Workers take the pieces in parallel, and each reads only its own slice. Eight parsers count errors, five xx responses, latency and SQL failures per minute. Each piece commits in one transaction. Three thousand and nineteen windows, sixty five thousand metric rows.",
      "Detect. Each minute is compared with the rest of the same log, using median based baselines, rare error patterns, and hard rules. A hundred and one of five hundred and ninety one minutes flagged.",
      { say: "Explain. Only the flagged windows go to the LLM, through one Kafka partition per API key. Forty two thousand calls instead of two hundred and twenty thousand.", tone: "key" },
      "Root cause. The first LangGraph graph groups findings into incidents, and a judge checks each story against its evidence. Six incidents.",
      "Ask. Questions are answered by the second graph, corrective RAG over hybrid search, citing the exact windows and lines it used.",
    ),
    "DeepLogLens: one file, seven steps",
  ),
  check({
    topic: "the board",
    q: "What travels on Kafka in DeepLogLens: the log bytes, or something else?",
    options: ["The log bytes, compressed", "Pointers: an ingest request, then byte ranges", "The parsed metrics", "Embeddings"],
    answer: 1,
    a: "Pointers. Kafka moves facts (an ingest request, then byte-range pointers); the bytes only ever live in blob storage.",
    aSay: "B. Pointers. Kafka moves facts: first an ingest request, then one pointer per byte range. The bytes themselves only ever live in blob storage.",
  }),

  // ------------------------------------------------------------ 5
  sec("5", "The upload: presign, PUT, confirm", "Topic five. Getting two gigabytes in, without the API ever holding them."),
  {
    kind: "seq",
    title: "Presign, PUT, confirm",
    actors: [
      { id: "b", name: "Browser", icon: "🖥" },
      { id: "a", name: "API", icon: "☕" },
      { id: "s", name: "Blob store", icon: "🪣" },
      { id: "k", name: "Kafka", icon: "📨" },
    ],
    msgs: [
      { from: "b", to: "a", label: "POST presign (name, size)", step: 1 },
      { from: "a", to: "b", label: "PUT URL, valid 15 min", step: 2, dash: true },
      { from: "b", to: "s", label: "PUT 2 GB directly", step: 3, tone: "blue" },
      { from: "b", to: "a", label: "POST confirm", step: 4 },
      { from: "a", to: "s", label: "stat the object: real size", step: 5 },
      { from: "a", to: "k", label: "IngestRequest pointer", step: 6, tone: "green" },
    ],
    note: { step: 7, text: "202 Accepted in milliseconds · the API never held a byte", tone: "green" },
    beats: B(
      "Here's the upload, as a sequence. Four actors.",
      "The browser asks the API for an upload link, sending the file name and size.",
      { say: "The API signs a presigned URL for exactly one object, valid for fifteen minutes. A presigned URL is signed on the server with the storage credentials, so whoever holds it can upload that one object without ever seeing the credentials.", term: { word: "Presigned URL", meaning: "a signed, time-limited URL for one object" } },
      { say: "The browser PUTs the two gigabytes straight into the blob store. Not through the API.", tone: "key" },
      "Then the browser calls confirm.",
      "And the API doesn't trust the client's word. It stats the object itself, so the size it records is the real size.",
      "Then it saves the document row and publishes one small pointer to Kafka: the ingest request. We'll open that message up in topic six.",
      { say: "The API answers two oh two accepted, in milliseconds. Golden rule one: the request path did no heavy work.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "Three ways to get 2 GB in",
    cols: [
      { title: "Save to the server's disk", icon: "💾", tone: "red", items: ["Render's disk is wiped on deploy", "API and workers can't share it", "a request thread held for minutes"] },
      { title: "Stream through the API", icon: "🚰", tone: "amber", items: ["bytes pass through the JVM", "a thread and buffers per upload", "the 512 MB box is the bottleneck"] },
      { title: "Presigned PUT + confirm ✓", icon: "🔑", tone: "green", items: ["bytes never touch the API", "the blob store scales the upload", "confirm = one explicit event"] },
    ],
    footer: "the argument: on a 512 MB box, the cheapest byte is the one the API never touches",
    beats: B(
      "Three ways to get the file in. Saving it to the server's disk: on Render, the disk is wiped on every deploy, and the API and the workers can't share it.",
      "Streaming it through the API into blob storage works, but every byte passes through the JVM, holding a thread and buffers for minutes, on a five hundred and twelve megabyte box.",
      "Presigned PUT plus confirm. The bytes never touch the API. The blob store does the heavy lifting. And confirm becomes one explicit event to publish.",
      { say: "Your one line argument: on a five hundred and twelve megabyte box, the cheapest byte is the one the API never touches.", tone: "key" },
    ),
  },
  check({
    topic: "the upload",
    q: "Why does confirm stat the object instead of trusting the size the browser sent?",
    a: "So the size and existence recorded in Postgres are real: the server checks the object itself, and only then saves the row and publishes the pointer.",
    aSay: "Because the client could be wrong, or lying. The server checks the object itself, so the size and existence in Postgres are real, and only then saves the document row and publishes the pointer.",
  }),
];
