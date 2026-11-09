import type { Scene } from "../../lib/types.ts";
import { B, sec } from "./h.ts";
import { check } from "./k.ts";

// Part 4: the idempotent-upsert transaction, crash points, proof and
// alternatives; constant heap; the parsers; the anomaly gate and the 80%.
export const p4: Scene[] = [
  // ------------------------------------------------------------ 11
  sec("11", "Idempotent upserts: exactly-once effects", "Topic eleven. The whole transaction, statement by statement. Then we'll crash it at every possible moment, and see that the database always ends up the same."),
  {
    kind: "code",
    title: "One part, one transaction",
    lang: "sql",
    code: `-- fast path, before any I/O:
SELECT 1 FROM ingest_parts WHERE document_id = ? AND part_idx = ?;
BEGIN;
INSERT INTO log_chunks_s_7f3a (chunk_id, document_id, time_bucket,
                               line_start, line_end, content, is_anomalous)
VALUES (...), (...), (...)
ON CONFLICT (chunk_id) DO NOTHING
RETURNING chunk_id;                        -- only the chunks that are new
INSERT INTO log_metrics (...)               -- metrics of RETURNED chunks only
VALUES (...)
ON CONFLICT (session_id, time_bucket, category, metric) DO UPDATE
SET count = log_metrics.count + EXCLUDED.count,
    p95_ms = GREATEST(log_metrics.p95_ms, EXCLUDED.p95_ms);
INSERT INTO ingest_parts (document_id, part_idx) VALUES (?, ?)
ON CONFLICT DO NOTHING;                     -- 1 row = first time
UPDATE documents SET parsed_parts = parsed_parts + 1
WHERE id = ?;                               -- only if that row was new
COMMIT;
-- only now: ack.acknowledge()  → the offset commits`,
    highlight: [[1, 2], [3, 8], [7, 8], [9, 13], [14, 15], [16, 17], [18, 19], null],
    beats: B(
      "Here's the whole thing. Before any I O, the fast path: one select on the part markers. If the part is done, skip it.",
      "Then begin, and insert the chunks. Batches of rows, each with its fingerprint as the primary key.",
      { say: "On conflict on chunk ID, do nothing, returning chunk ID. Returning tells you exactly which chunks are new. On a first delivery, all of them. On a redelivery, none.", tone: "key" },
      { say: "Then the metrics. This upsert is additive, it adds counts. So it's only given the metrics of the chunks that returning handed back. A redelivered part has none, so it adds nothing.", tone: "key" },
      "Then the part marker, keyed by document and part index. Insert, on conflict do nothing. One row inserted means this is the first time.",
      "And the parsed parts counter goes up by one, only if that marker row was new. So the counter can never be bumped twice for the same part.",
      { say: "Commit. And only after commit returns, acknowledge, and the offset commits. Offsets commit after durable writes.", tone: "key" },
      { say: "Every statement in that transaction is an idempotent upsert, keyed by something deterministic. Chunks by their content fingerprint. Parts by their natural key. And everything additive is gated on what was new.", tone: "key" },
    ),
  },
  {
    kind: "big",
    tone: "idea",
    lead: "The one rule",
    text: "Insert-if-absent on a deterministic key. Anything additive runs only for what was new.",
    after: "the same rule is used again on the enrichment lane, with a different key",
    beats: B(
      "If you remember one rule from this topic, make it this one.",
      { say: "Insert if absent, on a deterministic key. And anything additive runs only for what was actually new.", tone: "key" },
      "You'll see the exact same rule again on the enrichment lane in topic eighteen, just with a different key.",
    ),
  },
  {
    kind: "seq",
    title: "Two workers, the same part, at the same time",
    actors: [
      { id: "w1", name: "Worker 1", icon: "⚙" },
      { id: "pg", name: "Postgres", icon: "🐘" },
      { id: "w2", name: "Worker 2", icon: "⚙" },
    ],
    msgs: [
      { from: "w1", to: "pg", label: "INSERT chunk 9f2c… (tx open)", step: 1 },
      { from: "w2", to: "pg", label: "INSERT chunk 9f2c… → waits on the key", step: 2, tone: "amber" },
      { from: "w1", to: "pg", label: "COMMIT", step: 3, tone: "green" },
      { from: "pg", to: "w2", label: "conflict → DO NOTHING · RETURNING []", step: 4, dash: true },
    ],
    note: { step: 5, text: "the unique index serialises the race: one writer wins, the other adds nothing", tone: "green" },
    beats: B(
      "One more case an interviewer loves. After a rebalance, for a moment, two workers can hold the same part at once.",
      "Worker one inserts the chunk with fingerprint nine f two c. Its transaction is still open.",
      { say: "Worker two inserts the same key. Postgres makes it wait. A unique index won't let two uncommitted rows share a key, so the second insert blocks until the first transaction finishes.", tone: "key" },
      "Worker one commits.",
      "Now worker two's insert sees the committed row, takes the conflict path, does nothing, and returning is empty. So it adds no metrics.",
      { say: "No lock service, no leader election. The unique index serialises the race. One writer wins, and the other adds nothing.", tone: "key" },
    ),
  },
  {
    kind: "custom",
    name: "dllcrash",
    props: {
      title: "Crash it at every moment",
      boxes: ["poll part 3 · offset 41", "ranged GET + parse · no tx", "BEGIN · upserts · COMMIT", "ack: offset 41 commits", "poll the next part"],
      crashes: [
        { gap: 1, label: "before COMMIT", outcome: "The transaction never committed, so Postgres has nothing from this part. The offset didn't commit either: Kafka redelivers, and the part runs as if for the first time." },
        { gap: 2, label: "after COMMIT, before ack", outcome: "Everything is in Postgres, but offset 41 isn't committed. Kafka redelivers. The fast path finds the marker and skips the read; and even without it, every chunk_id conflicts, RETURNING is empty, no count moves." },
        { gap: 3, label: "after the ack", outcome: "Both committed. Kafka never redelivers part 3. Nothing to do." },
      ],
      foot: "three crash points · one final database state",
    },
    beats: B(
      "Now let's crash it. Here's the consumer's timeline. Poll, ranged read and parse with no transaction, the transaction, the acknowledgement, then the next part.",
      { say: "Crash A, before the commit. The transaction never committed, so Postgres has nothing from this part. The offset didn't commit either, so Kafka redelivers, and the part simply runs as if for the first time.", tone: "key" },
      { say: "Crash B, after the commit, before the acknowledgement. This is the dangerous one. Everything is in Postgres, but offset forty one isn't committed, so Kafka redelivers. The fast path finds the marker and skips the read. And even if it didn't, every chunk ID would conflict, returning would be empty, and no count would move.", tone: "key" },
      "Crash C, after the acknowledgement. Both committed. Kafka never redelivers this part. Nothing to do.",
      { say: "Three crash points, and the database ends in the same state every time. That's exactly once effects.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "How it was proven, not just argued",
    items: [
      { icon: "🔪", text: "kill -9 at the worst moment, three times", sub: "a harness watches the log; the instant a part logs \"committed\" (after COMMIT, before the ack) it kills the JVM, restarts it, repeats ×3" },
      { icon: "⏪", text: "Replay the whole topic from offset 0", sub: "every part delivered again: no count moves, no session changes state" },
      { icon: "🔀", text: "Rebalance: kill one of two instances mid-run", sub: "partitions move; counts equal the clean run" },
      { icon: "🧪", text: "An integration test in CI (Testcontainers)", sub: "every part and every enrichment item delivered twice → an identical database" },
    ],
    beats: B(
      "And this wasn't just argued. It was proven. A fault injection harness runs the real jar and watches its log. The instant a part logs committed, after the commit but before the ack, the worst moment, it sends kill minus nine. Restart, and repeat three times. Every count matched a clean run.",
      "Then a replay: reset the consumer group to offset zero, so every part is delivered again. No count moved.",
      "Then a rebalance: run two instances and kill one mid run, so its partitions move to the other. Equal counts.",
      { say: "And an integration test in C I, with Testcontainers: real Kafka, real Postgres, every part and every enrichment item delivered twice. The database comes out identical, and the LLM is called once per item.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "Exactly-once effects: the alternatives",
    cols: [
      { title: "Kafka transactions (EOS)", icon: "🔒", tone: "red", items: ["atomic consume → produce, inside Kafka", "a Postgres write can't join the Kafka transaction", "solves the wrong boundary"] },
      { title: "Offsets stored in Postgres", icon: "📌", tone: "amber", items: ["write the offset in the same tx; seek() on assignment", "exactly-once too, and a valid design", "but tied to partitions: a replay, a new group or a re-publish duplicates"] },
      { title: "Idempotent upserts on data keys ✓", icon: "🧬", tone: "green", items: ["the key comes from the data itself", "holds for redelivery, replay, rebalance and manual re-runs", "plain SQL, no custom rebalance code"] },
    ],
    footer: "the argument: make idempotency a property of the data, not of the delivery",
    beats: B(
      "Now the alternatives. If they ask, why not Kafka transactions? Kafka's exactly once makes consume and produce atomic, inside Kafka. But the effect here is a Postgres write, and Postgres can't join a Kafka transaction. It solves the wrong boundary.",
      { say: "Option two, and a good one: store the consumed offset in Postgres, in the same transaction as the data, and seek to it when a partition is assigned. That's exactly once too, and I'd say so. But it ties correctness to the partition and the consumer group. Replay through a new group, or re publish a part, and you get duplicates. And every consumer needs custom rebalance code.", tone: "key" },
      "Idempotent upserts on keys that come from the data itself. It holds for a redelivery, a replay, a rebalance, even a manual re run, with plain SQL.",
      { say: "Your line: I made idempotency a property of the data, not of the delivery.", tone: "key" },
    ),
  },
  {
    kind: "sayit",
    q: "\"How do you get exactly-once processing?\"",
    lines: [
      "I don't claim exactly-once delivery: Kafka delivers at least once.",
      "Offsets commit only after the database transaction commits: manual ack.",
      "Every write is an idempotent upsert on a deterministic key: chunks by a SHA-256 content fingerprint, parts by (document, part index).",
      "Additive writes, like metric counts, only run for rows RETURNING reports as new.",
      "Proven with kill -9 at the worst moment, a full replay, a rebalance, and a CI test that delivers everything twice.",
    ],
    beats: B(
      { say: "Say it out loud with me. How do you get exactly once processing?", tone: "ask" },
      "I don't claim exactly once delivery. Kafka delivers at least once.",
      "Offsets commit only after the database transaction commits. Manual acknowledgement.",
      "Every write is an idempotent upsert on a deterministic key. Chunks by a S H A two fifty six content fingerprint, parts by document and part index.",
      "Additive writes, like metric counts, only run for the rows that returning reports as new.",
      { say: "And I proved it. Kill minus nine at the worst moment, a full replay, a rebalance, and a C I test that delivers everything twice.", tone: "key" },
    ),
  },
  check({
    topic: "exactly-once",
    q: "Crash B: the transaction committed, the ack didn't. What exactly happens on the redelivery?",
    options: ["Duplicate chunks are inserted, then cleaned up", "The fast path sees the part marker and skips; even without it, every chunk_id conflicts and RETURNING is empty, so no count moves", "The session is marked FAILED", "Kafka skips the record automatically"],
    answer: 1,
    a: "Kafka redelivers. The fast path finds ingest_parts and skips the read; if it didn't, each INSERT would hit its chunk_id, do nothing, and RETURNING would be empty: no metrics added.",
    aSay: "B. Kafka redelivers the part. The fast path finds the part marker and skips the read. And even without the fast path, every chunk insert would hit its fingerprint key, do nothing, and returning would be empty, so no metric moves.",
  }),
  check({
    topic: "exactly-once",
    q: "Why not store the Kafka offset in Postgres instead? Give the honest answer.",
    a: "It works, and is exactly-once too. But it ties correctness to one group's partitions: a replay through a new group or a re-published part duplicates, and each consumer needs custom seek-on-assign code. Data-keyed upserts hold however the data arrives.",
    aSay: "It's a valid design, exactly once too, and I'd say that first. But it ties correctness to one consumer group's partitions. A replay through a new group, or a re published part, would duplicate. And every consumer needs custom seek on assignment code. Keys from the data hold no matter how the data arrives.",
  }),

  // ------------------------------------------------------------ 12
  sec("12", "Constant-heap streaming ingest", "Topic twelve. Constant heap. What exactly is in memory, and the right number to prove it doesn't grow."),
  {
    kind: "bullets",
    title: "What is in memory, at any moment",
    items: [
      { icon: "✂️", text: "The splitter: one line and a few counters", sub: "64 KB read buffer · a line buffer capped at 1 MB · it never holds the file" },
      { icon: "⚙", text: "Each part thread: one part in flight", sub: "a 5 MB slice is 10-15 MB as Java strings, plus its windows and metric rows" },
      { icon: "🧮", text: "So memory ≈ threads × one part + a fixed baseline", sub: "Spring, the Kafka clients and the connection pool" },
    ],
    beats: B(
      "What is in memory at any moment? The splitter holds one line and a few counters. A sixty four kilobyte read buffer, and a line buffer capped at one megabyte. It never holds the file.",
      "Each part thread holds one part in flight. A five megabyte slice is ten to fifteen megabytes as Java strings, plus its windows and metric rows.",
      { say: "So memory is the number of threads, times one part, plus a fixed baseline for Spring, the Kafka clients, and the pool. Nothing in that sum depends on the size of the file. That's constant heap.", tone: "key" },
    ),
  },
  {
    kind: "chart",
    title: "Peak heap vs live set, -Xmx256m (MB)",
    type: "bars",
    labels: ["100 MB", "500 MB", "1 GB", "2 GB"],
    series: [
      { name: "peak heap used", values: [186, 228, 227, 204], tone: "red", step: 1 },
      { name: "live set after full GC", values: [76, 91, 92, 81], tone: "green", step: 2 },
    ],
    max: 256,
    unit: " MB",
    note: { step: 3, text: "input grew 20×; the live set stayed 70-92 MB", tone: "green" },
    beats: B(
      "The experiment. The real jar, with a hard heap limit of two hundred and fifty six megabytes, so a leak would crash instead of hiding. Files of one hundred megabytes to two gigabytes, from a clean state each time.",
      { say: "Peak heap used rose from one eighty six to two twenty eight. It looks like growth. It isn't. Peak heap is the top of the garbage collector's sawtooth, just before a collection. It follows the collector's timing, not your program.", term: { word: "Peak heap", meaning: "top of the GC sawtooth: follows GC timing" } },
      { say: "The live set is the bottom of the sawtooth, measured right after a full collection. It's what the program really holds. Seventy six, ninety one, ninety two, eighty one.", term: { word: "Live set", meaning: "heap still in use right after a full GC" } },
      { say: "The input grew twenty times. The live set stayed between seventy and ninety two megabytes, and the two gigabyte run was even lower than the one gigabyte run. Fifteen and a half million lines in nine hundred and seventy seven seconds.", tone: "key" },
    ),
  },
  {
    kind: "numbers",
    title: "The memory knob is threads, not file size",
    items: [
      { value: "56 MB", label: "1 thread", sub: "0.81 MB/s", tone: "blue" },
      { value: "81 MB", label: "2 threads", sub: "1.35 MB/s", tone: "blue" },
      { value: "111 MB", label: "4 threads", sub: "2.15 MB/s", tone: "green" },
      { value: "163 MB", label: "8 threads", sub: "2.25 MB/s: +5% speed for +47% memory", tone: "amber" },
    ],
    footer: "~15-25 MB of live set per part thread · throughput stops at the core count (parsing is CPU-bound)",
    beats: B(
      "And here's the knob. One part thread: fifty six megabytes of live set.",
      "Two threads, eighty one.",
      "Four threads, a hundred and eleven, at two point one five megabytes a second.",
      "Eight threads, a hundred and sixty three. Five percent more speed for forty seven percent more memory, because parsing is regex work, bound by the four cores.",
      { say: "So memory grows with the number of threads, about fifteen to twenty five megabytes each, never with the file.", tone: "key" },
    ),
  },
  check({
    topic: "constant heap",
    q: "Which number proves memory doesn't grow with the file: peak heap used, or the live set after a full GC? Why?",
    a: "The live set after a full GC. Peak heap is the top of the GC sawtooth and follows collector timing; the live set is what the program really holds, and it stayed 70-92 MB from 100 MB to 2 GB.",
    aSay: "The live set after a full collection. Peak heap is just the top of the sawtooth, and it follows the collector's timing. The live set is what the program really holds, and it stayed between seventy and ninety two megabytes from a hundred megabytes up to two gigabytes.",
  }),

  // ------------------------------------------------------------ 13
  sec("13", "Deterministic parsers compute all metrics", "Topic thirteen. Layer one. How one log line becomes exact numbers, with no model anywhere."),
  {
    kind: "code",
    title: "One line → exact metric rows",
    lang: "text",
    code: `2026-09-29 09:30:02 ERROR [db-proxy] - SQL timeout duration=12000ms

log_metrics (session, 09:30, ERRORS,   errors)          count  += 1
log_metrics (session, 09:30, DATABASE, sql_timeouts)    count  += 1
log_metrics (session, 09:30, DATABASE, sql_latency_ms)  sum_ms += 12000`,
    highlight: [[1, 1], [3, 3], [4, 5]],
    beats: B(
      "Take one line. Nine thirty and two seconds, ERROR, from the database proxy, SQL timeout, twelve thousand milliseconds.",
      "The error parser sees the level, and adds one to the errors metric for the nine thirty window.",
      { say: "The SQL parser sees the timeout, adds one SQL timeout, and adds twelve thousand milliseconds to the latency sum. No model involved. Every line, every time, the same answer.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "Eight parsers, one pass per window",
    items: [
      { icon: "🌐", text: "ApiCall", sub: "calls, 2xx / 4xx / 5xx, latency" },
      { icon: "🗄", text: "Sql", sub: "queries, timeouts, deadlocks, pool waits" },
      { icon: "🚨", text: "Error · Performance · Auth", sub: "ERROR/FATAL and exceptions · slow operations · 401 / 403 spikes" },
      { icon: "🔄", text: "Lifecycle · Traffic · Signature", sub: "restarts, health DOWN · request volume · normalised error templates" },
    ],
    beats: B(
      "There are eight parsers, and each window goes through all of them in one pass. The API call parser counts calls, two, four and five xx responses, and latency.",
      "The SQL parser: queries, timeouts, deadlocks, pool waits.",
      "Error, performance and auth: error and fatal lines and exceptions, slow operations, and four oh one and four oh three counts.",
      "Lifecycle, traffic and signature: restarts and health checks going down, request volume, and normalised error templates, which the anomaly gate uses to spot rare errors.",
    ),
  },
  {
    kind: "compare",
    title: "Extracting metrics: the alternatives",
    cols: [
      { title: "Ask an LLM to extract", icon: "🤖", tone: "red", items: ["not repeatable: two runs, two answers", "costs tokens on every line", "and it still estimates"] },
      { title: "Template mining (e.g. Drain)", icon: "🧩", tone: "amber", items: ["learns templates from unknown formats", "gives templates, not domain metrics", "no \"pool exhausted\" or p95 latency"] },
      { title: "Deterministic parsers ✓", icon: "🧮", tone: "green", items: ["exact, repeatable, free per line", "domain metrics an SRE asks about", "the LLM gets them as authoritative facts"] },
    ],
    footer: "the argument: numbers must be exact and repeatable, so code computes all of them",
    beats: B(
      "Alternatives. Ask an LLM to extract the metrics: two runs give two answers, it costs tokens on every line, and it's still estimating.",
      "Template mining, like the Drain algorithm. Great for unknown formats, but it gives you templates, not the domain metrics an on call engineer asks about, like pool exhaustion or p ninety five latency.",
      { say: "Deterministic parsers. Exact, repeatable, free per line. And later, the LLM receives these numbers in its prompt, labelled authoritative, and is told never to compute its own.", tone: "key" },
      { say: "Your line: numbers must be exact and repeatable, so code computes all of them.", tone: "key" },
    ),
  },
  check({
    topic: "parsers",
    q: "\"How many 503s between 10:00 and 10:10?\" Which component answers, and how?",
    options: ["The LLM, from the retrieved chunks", "SQL over log_metrics: an index scan summing count for that range", "The judge in Graph 1", "Full-text search over chunks"],
    answer: 1,
    a: "SQL over log_metrics: sum the api_5xx counts for buckets 10:00-10:10, via the composite index. No LLM.",
    aSay: "B. A SQL query over log metrics. Sum the five xx counts for the buckets from ten o'clock to ten past, using the composite index. No LLM anywhere.",
  }),

  // ------------------------------------------------------------ 14
  sec("14", "The anomaly gate: cutting LLM calls by 80%", "Topic fourteen. The gate. It decides which windows the LLM ever sees, so it decides the bill."),
  {
    kind: "big",
    tone: "idea",
    lead: "Where LLM cost comes from",
    text: "LLM cost = flagged windows × their size. Not file size.",
    after: "so the gate, not the model, is the cost control",
    beats: B(
      "First, where the LLM bill comes from.",
      { say: "Cost is the number of flagged windows, times their size. Not the size of the file.", tone: "key" },
      "So the gate, not the model, is the real cost control. A window that isn't flagged costs zero tokens.",
    ),
  },
  {
    kind: "custom",
    name: "llmad",
    beats: B(
      "So how does the gate decide what's abnormal? Ten minutes of error counts: two, three, two, four, three, two, three, two hundred and fifty, two, three.",
      "The mean is twenty seven point four. One bad minute dragged it up ten times, and inflated the standard deviation with it. With mean plus three sigma, a big incident raises the very baseline it's compared against, and hides itself.",
      { say: "The median is three. It ignores the extreme value. In fact, the median barely moves until half the data is abnormal.", term: { word: "Median", meaning: "robust: ignores outliers until half the data is bad" } },
      { say: "The MAD, the median absolute deviation, is the median of the distance from the median. Here, one. Times one point four eight two six, it estimates a standard deviation. The rule: a count of at least three, and above the median plus three point five times that scale, floored at one. Here, eight point two.", term: { word: "MAD", meaning: "median of |x − median|; × 1.4826 ≈ σ" } },
      { say: "Two hundred and fifty has a modified z score of about a hundred and sixty seven. Three point five is the textbook cut off, from Iglewicz and Hoaglin. Textbook, not tuned, which matters when someone asks about overfitting.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "The gate: four rules, two phases",
    items: [
      { icon: "🧱", text: "Hard rules, inside the part thread", sub: "FATAL, out of memory, deadlock, pool EXHAUSTED, health DOWN: flagged at insert" },
      { icon: "📈", text: "Count spikes, session-wide", sub: "ERROR, WARN, exceptions, 5xx, 401, 403, SQL failures: ≥ 3 and > median + 3.5 × max(1.4826·MAD, 1)" },
      { icon: "⏱", text: "Latency spikes, session-wide", sub: "a window's p95 above 2 × the median, and a MAD outlier" },
      { icon: "🦄", text: "Rare signatures, session-wide", sub: "an error template seen in ≤ 2% of windows: one SSLHandshakeException is caught; an all-day retry isn't" },
    ],
    beats: B(
      "Four rules, in two phases, like map and reduce. Hard rules run inside each part thread, because they need nothing but the window itself. A fatal, an out of memory, a deadlock, an exhausted pool, a health check down. Flagged at insert.",
      "Count spikes need the whole session's median, which no single part can know. So they run once, in the finalizer, as one SQL statement over log metrics. At least three events, and above the median plus three and a half scaled MADs.",
      "Latency spikes, also session wide: a window's p ninety five above twice the median, and a MAD outlier.",
      { say: "And rare signatures. An error template seen in two percent of windows or fewer. So a single S S L handshake exception is caught, while a harmless retry that happens all day is ignored.", tone: "key" },
    ),
  },
  {
    kind: "numbers",
    title: "Cutting LLM calls by 80%",
    items: [
      { value: "220,657", label: "LLM calls without the gate", sub: "every 5,000-char segment of the 1 GB run", tone: "red" },
      { value: "42,205", label: "LLM calls with the gate", sub: "571 of 3,019 chunks flagged", tone: "green" },
      { value: "80.9%", label: "fewer LLM calls", sub: "on the 1 GB demo run", tone: "blue" },
      { value: "≥ 71%", label: "at every traffic level", sub: "1 to 50 lines/s, on incident-dense eval logs", tone: "amber" },
    ],
    footer: "the saving depends on how much of the log is abnormal: the more incident-dense, the less you can skip",
    beats: B(
      "And here's the eighty percent. Without the gate, every five thousand character segment of the one gigabyte run would go to the model. Two hundred and twenty thousand six hundred and fifty seven calls.",
      "With the gate, five hundred and seventy one of three thousand and nineteen chunks are flagged. Forty two thousand two hundred and five calls.",
      { say: "Eighty point nine percent fewer LLM calls. That's the eighty percent on your resume.", tone: "key" },
      "And on the evaluation logs, which are deliberately packed with incidents, the gate still saves at least seventy one percent at every traffic level, from one to fifty lines a second.",
      { say: "If they ask why the number varies: the saving depends on how much of the log is abnormal. The more incident dense the log, the less you can skip. Always quote the number with its dataset.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "Choosing what the LLM sees",
    cols: [
      { title: "Send every window", icon: "🌊", tone: "red", items: ["≈ 5× the calls", "pays for quiet minutes", "days of free-tier quota"] },
      { title: "Mean + 3σ", icon: "📉", tone: "amber", items: ["the spike inflates σ and masks itself", "with 10 points, no point can exceed 2.85σ", "misses exactly the big incidents"] },
      { title: "Median + MAD + rules ✓", icon: "🎯", tone: "green", items: ["robust until half the data is bad", "textbook cut-off 3.5, not tuned", "F1 0.90 · 36 of 36 incidents found"] },
    ],
    footer: "the argument: use statistics that a big incident can't drag along with it",
    beats: B(
      "Defend the gate. Sending every window costs about five times the calls, and on free tier quota that's days of work, paying for quiet minutes.",
      { say: "Mean plus three sigma. The spike inflates the sigma and masks itself. There's even a hard limit: with ten points, no single point can be more than two point eight five standard deviations from their mean. So mean plus three sigma can never flag one spiked minute out of ten.", tone: "key" },
      "Median, MAD and rules. Robust until half the data is bad, a textbook cut off, and on the evaluation set, an F one of nought point nine, with thirty six of thirty six injected incidents found.",
      { say: "Your line: use statistics that a big incident can't drag along with it.", tone: "key" },
    ),
  },
  check({
    topic: "the gate",
    q: "Why can't a single part thread run the count-spike rule?",
    options: ["It has no database connection", "The rule needs the session-wide median and MAD, which only exist after every part is in", "Count spikes need the LLM", "Part threads can't read log_metrics"],
    answer: 1,
    a: "A part sees ~5 MB of the log. The median and MAD come from every window of the session, so the finalizer runs those rules once, in SQL, after all parts commit.",
    aSay: "B. A part only sees its own five megabytes. The median and MAD come from every window in the session, so the finalizer runs those rules once, in one SQL statement, after every part has committed.",
  }),
  check({
    topic: "the gate",
    q: "Your resume says 80% fewer LLM calls. Where does the number come from, exactly?",
    a: "The 1 GB demo run: 42,205 calls instead of 220,657 possible = 80.9% fewer (571 of 3,019 chunks flagged). On incident-dense eval logs it is at least 71% at every traffic level.",
    aSay: "The one gigabyte demo run. Forty two thousand two hundred and five calls, instead of two hundred and twenty thousand six hundred and fifty seven. Eighty point nine percent fewer. And on the incident dense eval logs, at least seventy one percent at every traffic level.",
  }),
];
