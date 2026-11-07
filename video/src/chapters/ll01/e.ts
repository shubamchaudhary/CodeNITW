import type { Scene } from "../../lib/types.ts";
import { B, arch, sec } from "./h.ts";
import { SCALE } from "./diagrams.ts";

// Part E: Postgres and per-session tables, evals and benchmarks, the 1 TB a day
// design, the gaps, the stories, and a closing drill.
export const partE: Scene[] = [
  // ------------------------------------------------------------ 18
  sec("18", "Postgres as the single source of truth", "Part eighteen. Storage. Why one Postgres holds everything, and why every session gets its own table."),
  {
    kind: "compare",
    title: "Where should chunks, vectors and text live?",
    cols: [
      { title: "Elasticsearch + Postgres", icon: "🔎", tone: "red", items: ["the v2 draft; cut July 14", "lookup is by id; search is one session", "a GIN index covers that", "another cluster to run and sync"] },
      { title: "Vector DB + Postgres", icon: "🧲", tone: "purple", items: ["considered", "two writes per chunk that can drift", "no joins, no shared transaction"] },
      { title: "Postgres 16 + pgvector", icon: "🐘", tone: "green", items: ["shipped", "rows, vectors, full text: one tx", "join anything", "the risk, filtered search, was measured"] },
    ],
    footer: "one transaction covers a chunk, its vector, its tsvector and its findings",
    beats: B(
      "Three options. Elasticsearch next to Postgres was the version two draft, cut on July fourteenth. Evidence lookup is by ID, and exact token search only runs within one session, which a GIN index covers. It would have been another cluster to run, back up and keep consistent.",
      "A dedicated vector database next to Postgres was considered. Every chunk would need two writes that can drift apart, with no joins and no shared transaction.",
      { say: "What shipped: Postgres sixteen with pgvector as the only store. pgvector adds a vector column, distance operators, and approximate nearest neighbour indexes.", term: { word: "pgvector", meaning: "vector type + <=> cosine distance + HNSW in Postgres" } },
      { say: "So one transaction covers a chunk, its vector, its full text index and its findings. The real risk, filtered vector search, was measured, and that's the next scene.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "The schema, and one table per session",
    lang: "sql",
    code: `sessions          id · analysis_status · window counters
documents         unique(session, file name, size) · total_parts · parsed_parts
ingest_parts      PK (document_id, part_idx)               -- ingest marker
enrich_work_done  PK (work_id)                             -- enrich marker
log_metrics       PK (session, time_bucket, category, metric)   additive upsert
log_findings      unique (session, fingerprint)   occurrence_count
incidents         narrative · grounded · judge_reason
reports           PK (session)

CREATE TABLE log_chunks_s_<uuid> (chunk_id uuid PK, document_id, time_bucket,
  line_start, line_end, content text, embedding vector(768), is_anomalous,
  content_tsv tsvector GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED);
-- HNSW (vector_cosine_ops, m=16, ef_construction=64) · GIN (content_tsv) · B-tree (time_bucket)`,
    highlight: [null, [1, 2], [3, 4], [5, 8], [10, 12], [13, 13]],
    beats: B(
      "The schema, in one screen.",
      "Sessions carry the status and window counters. Documents are unique per session, file name and size, which is how a duplicate upload returns the existing row, and they hold total parts and parsed parts.",
      "The two marker tables: ingest parts, keyed by document and part, and enrich work done, keyed by work ID.",
      "Metrics keyed by session, time bucket, category and metric, with the additive upsert. Findings unique per fingerprint. Incidents with the judge's verdict. One report per session.",
      "And one chunk table per session, named from the session's UUID: the text, the line range, a seven hundred and sixty eight dimension vector, the anomaly flag, and the stored tsvector column.",
      { say: "With three indexes: HNSW on the vector, with m sixteen and ef construction sixty four, GIN on the tsvector, and a B tree on the time bucket. And the table name is built only from a parsed UUID, in Java and in Python, so SQL injection through it is impossible.", tone: "key" },
    ),
  },
  {
    kind: "custom",
    name: "llfilter",
    beats: B(
      "Why a table per session? Picture one shared table, a hundred and twenty thousand vectors from a hundred and one sessions. A small session, s oh five oh, owns less than one percent of the rows.",
      "Its query vector arrives, and the shared HNSW index is walked.",
      { say: "HNSW keeps its forty best candidates, ef search forty, without knowing about the filter. Those forty belong to everybody else.", term: { word: "Post-filtering", meaning: "the index searches first, the WHERE filters after" } },
      { say: "Then the session filter runs, and almost nothing survives. Measured: nought point six eight rows back, of ten asked for. Recall nought point oh six eight.", tone: "excite" },
      { say: "With its own table, the walk only ever sees that session's vectors. Recall one point oh, in a quarter of a millisecond. What breaks filtered vector search is selectivity, not table size.", tone: "key" },
    ),
  },
  {
    kind: "chart",
    title: "Small session s050: recall@10 vs ef_search",
    type: "line",
    labels: ["40", "100", "200", "400"],
    series: [
      { name: "own table per session", values: [1, 1, 1, 1], tone: "green", step: 1 },
      { name: "shared + iterative scan (pgvector 0.8)", values: [0.256, 0.256, 0.256, 0.256], tone: "purple", step: 2 },
      { name: "shared HNSW, then filter", values: [0.068, 0.134, 0.208, 0.244], tone: "red", step: 3 },
    ],
    max: 1,
    note: { step: 4, text: "raising ef_search 10× moved the shared index from 0.7 to 2.5 rows of 10" },
    beats: B(
      "Can't you just raise ef search? Measured, on the same vectors in seven layouts.",
      "Own table per session: one point oh, at every setting.",
      "Shared table with pgvector point eight's iterative scan: stuck at point two five six, because the scan stops at its cap of twenty thousand tuples.",
      "Shared HNSW, then filter: from point oh six eight up to point two four four.",
      { say: "A tenfold larger ef search moved it from nought point seven rows to two and a half, out of ten. The extra candidates are spent on other sessions. And one more nuance: a quick test on a small session passes, because for a thousand matching rows the planner skips HNSW and does an exact scan. Two sessions of the same size got sixty five and seven percent. That's an intermittent, customer specific bug.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "The trade-off, both sides",
    cols: [
      { title: "What it buys", icon: "✅", tone: "green", items: ["recall 1.00, 0.24-0.60 ms", "fastest layout: a graph of only its rows", "delete a session = DROP TABLE", "no dead rows, nothing to vacuum"] },
      { title: "What it costs", icon: "💸", tone: "red", items: ["tables created at runtime", "raw JDBC: JPA can't map dynamic tables", "catalog growth: tens of thousands of tables slow planning", "way out: LIST/HASH partitions"] },
    ],
    footer: "partitions only change how the table name is resolved: every query is already session-scoped",
    beats: B(
      "So the trade off. What it buys: recall one point oh, in a quarter to six tenths of a millisecond, the fastest layout, because each graph holds only its own rows. Deleting a session is a drop table: instant, no dead rows, nothing to vacuum.",
      "What it costs: tables created at runtime, raw JDBC because JPA can't map dynamic tables, and catalog growth. Tens of thousands of tables slow query planning. The way out is partitions.",
      { say: "And moving to partitions is cheap, because every query is already scoped to one session. Only the table name resolution changes.", tone: "key" },
    ),
  },
  {
    kind: "drill",
    items: [
      { q: "Is the HNSW index always used?", a: "No. On a 360-row session the planner does a seq scan + top-N sort: 2.06 ms, exact. Forced HNSW: 0.84 ms." },
      { q: "Why a composite index on (session_id, category, time_bucket)?", a: "Leftmost-prefix rule: one index serves session; session + category; session + category + time range." },
      { q: "What do m and ef_construction trade?", a: "Build time: m = links per node (memory, recall ceiling), ef_construction = build care. ef_search is query time: recall vs latency." },
      { q: "Each chunk is inserted, then UPDATEd with its embedding. Problem?", a: "One dead tuple per chunk for autovacuum. At scale: embed first and insert once, or fillfactor < 100 for HOT updates." },
      { q: "Wouldn't a vector database help at 100×?", a: "The measured bottlenecks are parsing CPU, Postgres writes and catalog size. None is vector search." },
    ],
    beats: [
      { say: "Is the HNSW index always used?", hold: 1.5 },
      { say: "No. On a three hundred and sixty row session, the planner chose a sequential scan with a top N sort: two milliseconds, and exact. Forcing HNSW gave nought point eight four. The planner compares estimated costs, and EXPLAIN shows it." },
      { say: "Why a composite index on session, category and time bucket?", hold: 1.5 },
      { say: "The leftmost prefix rule. One index serves filtering by session, by session and category, and by session, category and time range. Those metric queries run in a fifth of a millisecond." },
      { say: "What do m and ef construction trade?", hold: 1.5 },
      { say: "They're fixed at build time. M is links per node, which sets memory and the recall ceiling. Ef construction is how carefully the graph is built. Ef search is the query time knob, recall against latency. On isolated tables, going from forty to four hundred was two point one times slower, with no gain." },
      { say: "Each chunk is inserted, then updated with its embedding. Any problem?", hold: 1.5 },
      { say: "One dead row version per chunk for autovacuum to clean. At scale, compute the embedding first and insert once, or set fill factor below a hundred so updates can be HOT updates." },
      { say: "Wouldn't a vector database help at a hundred times the scale?", hold: 1.5 },
      { say: "The measured bottlenecks are CPU for parsing, then Postgres writes and catalog size. None of them is vector search. Never say pgvector doesn't scale, so I'd use Pinecone. What was measured was a filtering problem." },
    ],
  },

  // ------------------------------------------------------------ 19
  sec("19", "Evals, benchmarks and CI", "Part nineteen. How you know any of this works. This is where an AI engineering round spends the most time."),
  {
    kind: "numbers",
    title: "The metrics, worked once",
    items: [
      { value: "0.83", label: "precision = 15 / 18", sub: "flags that were real" },
      { value: "0.75", label: "recall = 15 / 20", sub: "incident windows caught" },
      { value: "0.79", label: "F1 = 2PR / (P + R)", sub: "high only if both are" },
      { value: "1/3", label: "MRR, gold chunk at rank 3", sub: "recall@k counts it for k ≥ 3" },
    ],
    footer: "plus evidence visibility, citation precision, faithfulness, abstention",
    beats: B(
      "Work the metrics once, out loud. A log has twenty incident windows. The gate flags eighteen, and fifteen of those are real. Precision: fifteen over eighteen, nought point eight three. Low precision means wasted LLM calls.",
      "Recall: fifteen over twenty, nought point seven five. Low recall means missed problems.",
      "F1: two P R over P plus R, nought point seven nine. It's high only when both are.",
      "For retrieval, if the gold chunk comes back third, the reciprocal rank is one third, and recall at k counts it for any k of three or more. MRR rewards putting the best evidence first.",
      { say: "Then the LLM specific ones: evidence visibility, citation precision, faithfulness from a judge, and abstention on questions the logs can't answer.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "The datasets",
    firstItemStep: 1,
    items: [
      { icon: "🧪", text: "Synthetic, seeded: 6 h, ~43.7k lines, 360 windows", sub: "12 injected incidents with gold line numbers · 3 noise levels" },
      { icon: "🙈", text: "Held-out seeds 101, 202, 303", sub: "same generator, never tuned on" },
      { icon: "🌍", text: "Loghub 2k samples: BGL, Thunderbird, HDFS, Spark, Apache", sub: "BGL has 143 labelled alert lines" },
      { icon: "📝", text: "golden_qa.json: 65 questions, 21.5% unanswerable", sub: "gold answers and lines COMPUTED BY CODE from the incident labels" },
    ],
    beats: B(
      "The datasets.",
      "A seeded synthetic corpus: six hours, about forty four thousand lines, three hundred and sixty windows, with twelve injected incidents and their gold line numbers, at three noise levels. The generator deliberately adds incident shaped noise: harmless errors, warning bursts at the owner's real warning rate of one point seven percent, and an incident logged only at info level.",
      "Held out seeds that the rules were never tuned on.",
      "Real Loghub samples, BGL, Thunderbird, HDFS, Spark and Apache. BGL has labelled alert lines.",
      { say: "And a golden set of sixty five questions, twenty one and a half percent unanswerable, whose gold answers and gold lines are computed by code from the incident labels. Not hand written.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "Evals use production code, and are cheap",
    cols: [
      { title: "Same code", icon: "🧬", items: ["WindowEvalCli runs the PRODUCTION chunker, parsers, gate, splitter", "no LLM", "measures exactly what ships"] },
      { title: "Cross-checked", icon: "🔁", tone: "green", items: ["SQL rules = Java rules (Testcontainers)", "real pipeline with a stub LLM", "77 windows, 315 calls: same as eval"] },
      { title: "Cost-guarded", icon: "💰", tone: "purple", items: ["LLM evals cache every call", "key: hash(prompt, model, params, endpoint)", "stop before $5"] },
    ],
    beats: B(
      "Three properties make these evals trustworthy. They run the same code: a Java entry point runs the production chunker, parsers, gate and splitter over a file, with no LLM, so the eval measures exactly what ships.",
      "They're cross checked: the SQL rules match the Java rules in a Testcontainers test, and the real pipeline, with a stub LLM counting calls, agrees with the eval.",
      "And the LLM evals are cost guarded. Every call is cached by a hash of prompt, model, parameters and endpoint, and the run stops before spending five dollars.",
    ),
  },
  {
    kind: "code",
    title: "The CI gate: evals/thresholds.json",
    lang: "json",
    code: `{
  "_why": "Set from the first robust-mode run (2026-09-29, eval_mediumnoise:
           F1 0.901, incident recall 1.0, call reduction 77.8%). The eval is
           deterministic, so any drop is a real behaviour change, not noise.",
  "anomaly_gating": {
    "eval_mediumnoise": { "window.f1": 0.88,
                          "incident_recall": 1.0,
                          "gating.call_reduction": 0.75 }
  }
}`,
    highlight: [null, [6, 8], [2, 4]],
    beats: B(
      "And this is how a regression is caught tomorrow. Continuous integration runs unit tests, Testcontainers integration tests, and a fast seeded eval, about a minute, no cost.",
      "It fails the build if window F1 drops below nought point eight eight, incident recall below one, or the call reduction below seventy five percent.",
      { say: "Thresholds sit just under the first robust run. Because the eval is deterministic, any drop is a real behaviour change, not noise, and an intentional change updates this file in the same pull request. And a prompt version string is written into every eval report, so a prompt change shows up next to its effect.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "Six times the benchmark was wrong, not the system",
    firstItemStep: 1,
    items: [
      { icon: "📈", text: "'The heap is growing'", sub: "peak follows GC timing → report the live set" },
      { icon: "🐢", text: "'Throughput looks too low'", sub: "old parts left in Kafka → reset groups, drop sessions, every run" },
      { icon: "💥", text: "ClassNotFoundException mid-run", sub: "jar rebuilt under a running JVM → each launch copies its jar" },
      { icon: "🧮", text: "'Exact search has 40% recall'", sub: "133 rows tie with the 10th best → tie-aware recall" },
      { icon: "🧪", text: "Replay test reported another run's numbers", sub: "wait for lag 0, count stub calls, only this run's log" },
    ],
    beats: B(
      "And a story that shows maturity: the benchmark was wrong more often than the system was.",
      "The heap is growing: no, peak occupancy follows GC timing. Report the live set.",
      "Throughput looks too low: parts left in Kafka by an interrupted run were being consumed during the next one. Start every run clean, resetting groups and dropping old sessions.",
      "A class not found exception mid run: the jar was rebuilt while a JVM was still loading classes from it. Each launch now runs its own copy.",
      "Exact search has forty percent recall, which is impossible by definition. Log lines repeat, so on average a hundred and thirty three rows tie with the tenth best similarity. Use tie aware recall, and exact search scores one.",
      { say: "And the replay test reported another run's numbers, counting skip messages in a log appended across runs, after a fixed forty second wait. Now it waits for lag zero and counts the stub's calls. The attitude: a benchmark is an experiment. Suspect the measurement first.", tone: "key" },
    ),
  },
  {
    kind: "drill",
    items: [
      { q: "Your eval set is synthetic. Isn't it meaningless?", a: "Synthetic on purpose: exact ground truth. Overfitting guarded with held-out seeds, Loghub BGL and the owner's real log. Absolute numbers on customer logs would differ." },
      { q: "Why a stub LLM in benchmarks?", a: "With a real provider you'd measure their rate limits. The stub answers instantly, so any slowness is yours." },
      { q: "One small VM: do the numbers mean anything?", a: "The SHAPE holds: flat live set, CPU-bound parsing. Never quote 2 MB/s as a service level." },
      { q: "What's UNVERIFIED?", a: "Answer faithfulness, citation precision and recall, abstention with a real model, and the judge's kappa. The harness is ready; it needs an API key." },
    ],
    beats: [
      { say: "Your eval set is synthetic. Isn't it meaningless?", hold: 1.5 },
      { say: "It's synthetic on purpose, so the ground truth is known exactly. Overfitting is guarded with held out seeds, real Loghub BGL labels, and the owner's real log. Absolute numbers on customer logs would differ, and I'd say so." },
      { say: "Why a stub LLM in the benchmarks?", hold: 1.5 },
      { say: "With a real provider I'd be measuring their rate limits, not my pipeline. The stub answers instantly, so any slowness is mine. Quality is measured separately." },
      { say: "It ran on one small VM. Do the numbers mean anything?", hold: 1.5 },
      { say: "The shape holds on bigger machines: a flat live set, CPU bound parsing, where the time goes. The absolute megabytes per second don't. I'd never quote two megabytes a second as a service level." },
      { say: "What's still unverified?", hold: 1.5 },
      { say: "Answer faithfulness, citation precision and recall, and abstention with a real model, plus the judge's agreement with humans. The harness is built and wired against the stub. It needs an API key and a budget. Say unverified, plainly." },
    ],
  },

  // ------------------------------------------------------------ 20
  sec("20", "Scaling to 1,000 tenants and 1 TB a day", "Part twenty. The system design follow up. Same pipeline, a thousand tenants, a terabyte a day. Work the numbers first."),
  {
    kind: "numbers",
    title: "Napkin math, out loud",
    items: [
      { value: "11.6 MB/s", label: "1 TB ÷ 86,400 s", sub: "≈ 75k lines/s at ~150 B/line" },
      { value: "1.44M", label: "windows a day", sub: "1,000 tenants × 1,440 minutes" },
      { value: "6.7 / s", label: "chat calls", sub: "10% flagged × ~4 segments = 576k a day" },
      { value: "≥ 6", label: "ingest machines", sub: "11.6 ÷ ~2 MB/s per 4-vCPU box, before headroom" },
    ],
    footer: "and vectors: 1.44M × 768 × 4 B ≈ 4.4 GB a day, before the index",
    beats: B(
      "One terabyte a day, divided by eighty six thousand four hundred seconds, is about eleven point six megabytes a second. At around a hundred and fifty bytes a line, seventy five thousand lines a second. That's roughly a gigabyte a day per tenant.",
      "Windows: a thousand tenants times one thousand four hundred and forty minutes, one point four four million a day.",
      "If ten percent are flagged, at about four segments each, that's five hundred and seventy six thousand chat calls a day. Six point seven a second, sustained.",
      "At the measured two megabytes a second per four core machine, ingest alone needs at least six machines, before any headroom.",
      { say: "And storage for vectors: one point four four million times seven hundred and sixty eight dimensions times four bytes is about four point four gigabytes a day, before the index. Doing this out loud, in this order, is what the round is really testing.", tone: "key" },
    ),
  },
  arch(SCALE, [
    { all: true },
    { t: "Bytes still bypass the API", b: "Presigned uploads and ranged reads stay. The API fleet only signs and confirms.", nodes: ["ten", "api", "s3"], edges: ["a", "b"] },
    { t: "Outbox, not dual write", b: "The document row and its event commit together; a relay publishes to Kafka.", m: "fixes today's unawaited send", nodes: ["api", "obx", "k"], edges: ["c", "d"] },
    { t: "Ingest fleet", b: "64+ partitions, workers autoscaled on consumer lag, separate from the API. Per-tenant quotas so one tenant can't starve the rest.", m: "COPY for inserts", nodes: ["k", "iw", "s3", "pg"], edges: ["e", "f", "g"] },
    { t: "Partitions, not tables", b: "Chunks partitioned by tenant, then by day, each with its own HNSW and GIN. Retention = drop old day partitions.", m: "raw chunks 7-30 days; metrics longer", nodes: ["pg"], edges: [] },
    { t: "Enrich fleet, cheaper models", b: "Per-key lanes as today; a cheap model for window explanations, a stronger one for reports.", nodes: ["k", "ew", "llm", "pg"], edges: ["h", "i", "j"] },
    { t: "Route before you retrieve", b: "Counts and time ranges go to SQL over metrics; only 'why' questions pay for RAG.", nodes: ["qs", "pg"], edges: ["l"] },
  ], B(
    "And the design.",
    "Bytes still bypass the API. Presigned uploads and ranged reads stay exactly as they are. The API fleet only signs and confirms.",
    "Fix the dual write with an outbox: the document row and its event commit together, and a relay publishes to Kafka.",
    "A separate ingest fleet, on sixty four or more partitions, autoscaled on consumer lag, with per tenant quotas so one noisy tenant can't starve the others. And COPY instead of row inserts, because Postgres writes are the next bottleneck after CPU.",
    "Replace per session tables with partitions: by tenant, then by day, each with its own HNSW and GIN index. Retention becomes dropping old day partitions. Raw chunks for seven to thirty days, metrics and findings for longer.",
    "A separate enrichment fleet, with per key lanes as today, a cheap model for window explanations and a stronger one for reports.",
    { say: "And a query service that routes before it retrieves. Counts and time ranges go to SQL over metrics. Only why questions pay for RAG.", tone: "key" },
  ), "LogLens at 1,000 tenants, 1 TB a day"),
  {
    kind: "compare",
    title: "Trade-offs to name at scale",
    cols: [
      { title: "Isolation", icon: "🧱", items: ["partitions vs per-tenant tables", "catalog limits vs perfect isolation"] },
      { title: "Recall vs latency", icon: "🎚️", tone: "green", items: ["ef_search", "iterative scan and its tuple cap"] },
      { title: "Baselines", icon: "📊", tone: "purple", items: ["shared vs per-tenant statistics", "one noisy tenant skewing the median"] },
      { title: "What breaks first", icon: "🧯", tone: "amber", items: ["10×: parsing CPU, then PG writes", "100×: catalog, GIN write cost, metrics table size"] },
    ],
    beats: B(
      "Name the trade offs. Isolation: partitions against per tenant tables, catalog limits against perfect isolation.",
      "Recall against latency: ef search, and the iterative scan with its tuple cap.",
      "Baselines: shared statistics, or per tenant ones, so one noisy tenant can't skew everyone's median.",
      "And what breaks first. At ten times: CPU for parsing, then Postgres writes. At a hundred times: catalog size, GIN write cost, and the size of the shared metrics table.",
    ),
  },

  // ------------------------------------------------------------ 21
  sec("21", "Gaps, security and operations", "Part twenty one. The honest list. Gaps found reading the code, and the security and operations answers."),
  {
    kind: "bullets",
    title: "Gaps to raise yourself (from reading the code)",
    firstItemStep: 1,
    items: [
      { icon: "📨", text: "Dual write: kafkaTemplate.send not awaited", sub: "confirm, splitter, retry re-publish → transactional outbox" },
      { icon: "🏁", text: "Finalizer: claim commits before its follow-up work", sub: "a crash after the claim strands the session → FINALIZING state + sweeper" },
      { icon: "🐍", text: "Graph 1 as a FastAPI BackgroundTask; trigger best-effort ×3", sub: "a Python restart leaves CORRELATING → re-trigger job" },
      { icon: "🔌", text: "Python opens a psycopg connection per query", sub: "no pool → psycopg_pool, sized to the free DB's limit" },
      { icon: "⚖️", text: "Judge from the same model family; kappa not measured", sub: "→ another family, 40 human labels" },
    ],
    beats: B(
      "Raise these before you're asked. Each one shows you know the system better than its happy path.",
      "One. The dual write. The Kafka send isn't awaited after the database commit, in confirm, in the splitter, and in the retry re-publish. Fix: a transactional outbox.",
      "Two. The finalizer's claim commits before its follow up work, so a crash right after the claim strands the session. Fix: a finalizing state with a sweeper, or a re-runnable follow up.",
      "Three. Graph one runs as a FastAPI background task, and Java's trigger is best effort, three attempts. A Python restart leaves the session in correlating. Fix: a re-trigger job, or put analyze on a Kafka topic too.",
      "Four. The Python service opens a new Postgres connection per query, with no pool. Fix: a connection pool sized to the free database's connection limit.",
      { say: "Five. The judge is from the same model family as the writer, and its agreement with humans isn't measured. Fix: a judge from another family, and forty human labels for kappa.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "Security and operations",
    cols: [
      { title: "Auth", icon: "🔐", items: ["stateless JWT, HMAC-signed, 24 h", "prod needs JWT_SECRET: no default", "guest login opens one demo session"] },
      { title: "Access", icon: "🚪", tone: "green", items: ["SessionAccess: 404 if missing, 403 if not yours", "RETURNS the status, doesn't throw", "a catch-all handler would turn a 403 into a 500"] },
      { title: "Operations", icon: "🛠️", tone: "purple", items: ["migration first, then deploy", "ExitOnOutOfMemoryError", "LOGLENS_ANOMALY_MODE=legacy rolls back", "keep-alive ping every 14 min vs spin-down"] },
    ],
    beats: B(
      "Security. Authentication is a stateless JWT, signed with HMAC, expiring after twenty four hours. Production requires the secret, with no insecure default, and Render generates it. Guest login opens one designated demo session.",
      { say: "Access. Every analysis endpoint asks one guard whether the caller owns the session: four oh four if it doesn't exist, four oh three if it belongs to someone else. And a nice detail: it returns the status rather than throwing, because the app's catch all exception handler would turn a thrown four oh three into a five hundred.", tone: "key" },
      "Operations. Run the idempotent migration first, then deploy the code. Exit on out of memory. Roll the gate back with one environment variable. And a keep alive ping every fourteen minutes, eight hundred and forty thousand milliseconds, because Render's free tier spins a service down after fifteen idle minutes, and a cold start takes about fifty seconds.",
    ),
  },
  {
    kind: "compare",
    title: "The first dashboard (proposed, not built)",
    cols: [
      { title: "Pipeline", icon: "📊", items: ["consumer lag per topic", "DLQ size", "429 rate per key"] },
      { title: "Model", icon: "🤖", tone: "green", items: ["LLM calls, tokens, cost per session", "share of windows flagged (> 40% = gate drift)", "'no evidence' rate"] },
      { title: "Input", icon: "📥", tone: "purple", items: ["share of lines with a recognised timestamp (< 90% = new format)", "new message templates"] },
    ],
    footer: "these would have shown every production incident in the project's history",
    beats: B(
      "Monitoring, proposed and not built, so say so. Pipeline: consumer lag per topic, dead letter queue size, the four two nine rate per key.",
      "Model: calls, tokens and cost per session, the share of windows flagged, where over forty percent means the gate is drifting, and the no evidence rate.",
      "Input: the share of lines with a recognised timestamp, where under ninety percent means a new log format, and new message templates.",
      { say: "Those signals would have shown every production incident in this project's history: the rate limit wall, the rebalance storm, and the gate collapse.", tone: "key" },
    ),
  },

  // ------------------------------------------------------------ 22
  sec("22", "Stories, and a final drill", "Last part. The stories to tell, in about sixty seconds each, and a final rapid fire drill."),
  {
    kind: "sayit",
    q: "Tell me about a hard bug. (The rate-limit wall)",
    lines: [
      "Situation: a production session had 167 windows and only 7 got embeddings; the chat was useless.",
      "My first theory was an exhausted daily quota. The dashboard said 14 of 1,000 daily requests, but TPM at 28.46K of 30K.",
      "So: ~16K-token batches, one call a minute per key, and a client misreading per-minute 429s as 'daily quota' and dropping healthy keys.",
      "I fixed the classification and batch size: 87 of 167. Then per-key request and token budgets, with 429s cycling through a retry topic: 167 of 167.",
      "What it taught me: let the evidence overrule the first theory.",
    ],
    beats: B(
      { say: "Story one, for tell me about a hard bug. The rate limit wall.", tone: "ask" },
      "A production session had a hundred and sixty seven windows, and only seven got embeddings. The chat was useless.",
      "My first theory was an exhausted daily quota. The dashboard said fourteen of a thousand daily requests used, but tokens per minute at twenty eight point four six thousand of thirty.",
      "So the causes were batches of about sixteen thousand tokens, one call a minute per key, and a client misreading per minute four two nines as daily quota exhausted, and dropping healthy keys.",
      "I fixed the classification and the batch size: eighty seven of a hundred and sixty seven. Then per key request and token budgets, with rate limited work cycling through a retry topic: all hundred and sixty seven.",
      { say: "What it taught me: let the evidence overrule the first theory.", tone: "key" },
    ),
  },
  {
    kind: "sayit",
    q: "A decision under constraints. (Partition-per-key)",
    lines: [
      "Several free API keys, strict per-key limits, bursty work, many threads.",
      "I made one Kafka partition per key. A consumer group gives each partition to one thread, so each key has one owner pacing itself, with no shared state.",
      "2.5 s between calls plus a rolling token budget; 429s go to a 60-second retry topic so lanes never sleep.",
      "Trade-off: Kafka can't shrink partitions, so fewer keys later means lanes share, and a busy key can't borrow from an idle one.",
    ],
    beats: B(
      { say: "Story two, for a design decision under constraints. Partition per key.", tone: "ask" },
      "Several free API keys, strict limits per key, bursty work, and many threads.",
      "I made one Kafka partition per key. A consumer group gives each partition to one thread, so each key has exactly one owner, pacing itself with no shared state.",
      "Two and a half seconds between calls, plus a rolling token budget. Four two nines go to a sixty second retry topic, so lanes never sleep.",
      { say: "The trade off: Kafka can't shrink a partition count, so fewer keys later means lanes share, and a busy key can't borrow from an idle one.", tone: "key" },
    ),
  },
  {
    kind: "sayit",
    q: "Checking your own claims. (kill -9 and the search leg)",
    lines: [
      "My resume claimed exactly-once effects; the project had no tests. I sent kill -9 to the real JVM right after a commit, three times, and added a replay from offset 0.",
      "Ingest held, thanks to its marker rows. Enrichment didn't: +5.8% after crashes, and a replay redid 8,820 LLM calls.",
      "A marker in the same transaction, checked before the LLM call: counts exact, replay costs nothing.",
      "Same habit on retrieval: an ablation showed hybrid equal to vector-only to three decimals. websearch_to_tsquery ANDed every word. Recall@10 0.39 → 0.76.",
    ],
    beats: B(
      { say: "Story three, for how do you know your system works.", tone: "ask" },
      "My resume claimed exactly once effects, and the project had no tests. I built a harness that sends kill minus nine to the real JVM right after a commit, three times, and added a replay from offset zero.",
      "Ingest held, thanks to its marker rows. Enrichment didn't: five point eight percent too many after crashes, and a replay redid eight thousand eight hundred and twenty LLM calls.",
      "A marker in the same transaction, checked before the LLM call, made the counts exact, and a replay now costs nothing.",
      { say: "Same habit on retrieval. An ablation showed hybrid equal to vector only, to three decimals. The full text query ANDed every word. Recall at ten went from point three nine to point seven six.", tone: "key" },
    ),
  },
  {
    kind: "drill",
    items: [
      { q: "How big is a part?", a: "~5 MB, cut at minute boundaries on a timestamped line; hard cap 20 MB." },
      { q: "Why max.poll.records = 1?", a: "Records block ~90 s on rate limits; 500 per poll blew the 15-min poll interval: rebalance storm." },
      { q: "What makes ingest exactly-once?", a: "ingest_parts marker in the same tx as chunks, metrics and the counter; offsets acked after commit." },
      { q: "Live set on 2 GB at -Xmx256m?", a: "81 MB max, 70 median, after full GC. Never quote peak occupancy." },
      { q: "The gate's threshold?", a: "count ≥ 3 and > median + 3.5 × max(1.4826 × MAD, 1)." },
      { q: "Groq lane pacing?", a: "60,000 / (30 × 0.8) = 2,500 ms, plus 4,800 tokens per sliding minute." },
      { q: "RRF constant?", a: "k = 60, ranks from 0, top 30 per leg." },
      { q: "Per-session tables vs shared, small session?", a: "Recall 1.00 vs 0.068 (0.68 rows of 10)." },
      { q: "Graph 1's loop limit?", a: "3 attempts per cluster; then stored grounded = false with the judge's reason." },
      { q: "What does CI check?", a: "Seeded eval: F1 ≥ 0.88, incident recall 1.0, call reduction ≥ 75%." },
    ],
    beats: [
      { say: "Final rapid fire. Say each answer before I do. How big is a part?", hold: 2 },
      { say: "About five megabytes, cut at a minute boundary on a timestamped line. Hard cap twenty." },
      { say: "Why max poll records one?", hold: 2 },
      { say: "Records block for about ninety seconds on rate limits. Five hundred per poll blew the fifteen minute poll interval. The rebalance storm." },
      { say: "What makes ingest exactly once?", hold: 2 },
      { say: "The ingest parts marker, in the same transaction as the chunks, the metrics and the counter, with offsets acknowledged after the commit." },
      { say: "Live set on two gigabytes, at a two fifty six megabyte heap?", hold: 2 },
      { say: "Eighty one megabytes maximum, seventy median, after full collection. Never quote peak occupancy." },
      { say: "The gate's threshold?", hold: 2 },
      { say: "A count of at least three, and above the median plus three point five times the larger of one point four eight two six MAD, and one." },
      { say: "Groq lane pacing?", hold: 2 },
      { say: "Sixty thousand over thirty times nought point eight: two thousand five hundred milliseconds. Plus four thousand eight hundred tokens per sliding minute." },
      { say: "The RRF constant?", hold: 2 },
      { say: "K equals sixty, ranks from zero, top thirty per leg." },
      { say: "Per session tables against a shared index, for a small session?", hold: 2 },
      { say: "Recall one point oh, against nought point oh six eight. Nought point six eight rows back, of ten." },
      { say: "Graph one's loop limit?", hold: 2 },
      { say: "Three attempts per cluster, then stored with grounded false and the judge's reason." },
      { say: "What does CI check?", hold: 2 },
      { say: "A seeded eval: F1 at least nought point eight eight, incident recall one, call reduction at least seventy five percent." },
    ],
  },
  {
    kind: "big",
    tone: "idea",
    lead: "The one rule for every challenge",
    text: "Number, scope, evidence, limit, next step. Never argue from adjectives.",
    after: "Say 'exactly-once effects', 'cited windows with line ranges', '87.5% on the demo corpus', and 'unverified' where it is.",
    beats: B(
      "One rule to end on, for any challenge to any claim.",
      { say: "State the number, and its scope. Name the evidence: a file, a test, a commit. Name the known limit. Then say what you'd measure next. Never argue from adjectives.", tone: "key" },
      "And use the precise words. Exactly once effects. Cited windows with exact line ranges. Eighty seven and a half percent on the demo corpus. And unverified, wherever it is. Good luck in the interview.",
    ),
  },
];
