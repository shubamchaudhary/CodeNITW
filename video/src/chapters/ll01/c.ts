import type { Scene } from "../../lib/types.ts";
import { B, arch, sec } from "./h.ts";
import { ERRORS } from "./diagrams.ts";

// Part C: exactly-once effects, failures and robustness, Layer 1 parsers and
// the anomaly gate.
export const partC: Scene[] = [
  // ------------------------------------------------------------ 9
  sec("9", "Exactly-once effects", "Part nine. Exactly once. The claim interviewers poke at hardest, and the one your own tests broke."),
  {
    kind: "trap",
    myth: "Exactly-once delivery.",
    truth: "Exactly-once delivery over a network is impossible. Exactly-once EFFECT is not.",
    why: "A sender can't tell a lost message from a slow one, so it must retry, and retries duplicate. Make applying twice equal applying once.",
    beats: B(
      "First, the words. Never say exactly once delivery.",
      { say: "Over a network, exactly once delivery is impossible. Exactly once effect is achievable.", term: { word: "Exactly-once effect", meaning: "at-least-once delivery + a write that's safe twice" } },
      { say: "A sender can't tell a lost message from a slow one, so it has to retry, and retries create duplicates. So you deliver at least once, and make applying a message twice give the same result as applying it once.", tone: "key" },
    ),
  },
  {
    kind: "seq",
    title: "Why a marker in the SAME transaction works",
    actors: [
      { id: "k", name: "Kafka", icon: "📨" },
      { id: "c", name: "Consumer", icon: "⚙️" },
      { id: "p", name: "Postgres", icon: "🐘" },
    ],
    msgs: [
      { from: "k", to: "c", label: "part 7 at offset 41", step: 1 },
      { from: "c", to: "c", label: "ranged read + parse, no tx", step: 1 },
      { from: "c", to: "p", label: "BEGIN · insert marker for part 7", step: 2 },
      { from: "c", to: "p", label: "chunks, metrics, counter · COMMIT", step: 2 },
      { from: "c", to: "c", label: "kill -9 here: offset 41 not committed", step: 3, tone: "red" },
      { from: "k", to: "c", label: "part 7 again, after restart", step: 4 },
      { from: "c", to: "p", label: "marker exists → skip", step: 4, tone: "green" },
      { from: "c", to: "k", label: "commit offset 41", step: 5 },
    ],
    note: { step: 6, text: "a separate transaction for the marker would reopen the gap" },
    beats: B(
      "Here's the mechanism.",
      "Kafka delivers part seven at offset forty one. The consumer reads and parses it outside any transaction.",
      "Then it opens one transaction: insert the marker for part seven, then the chunks, the metrics and the counter, and commit.",
      { say: "Now kill the process, with kill minus nine, right after the commit and before the offset commit. The worst possible moment.", tone: "excite" },
      "After restart, Kafka redelivers part seven, because offset forty one was never committed. The consumer sees the marker and skips the writes.",
      "Then it commits offset forty one, and moves on.",
      { say: "Why the same transaction? A transaction is all or nothing, so the database can never hold the data without the marker, or the marker without the data. Write the marker in a separate transaction, and a crash between the two leaves data with no marker, and the redelivery writes it again.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "How the design evolved",
    cols: [
      { title: "Auto-commit offsets", icon: "⏱️", tone: "red", items: ["considered", "committed on a timer", "a crash loses or duplicates, by luck"] },
      { title: "'Idempotent upserts'", icon: "➕", tone: "purple", items: ["what the resume claimed", "metrics: count = count + new", "findings: occurrence_count + 1", "ADDITIVE: redelivery doubles them"] },
      { title: "Marker row, same tx", icon: "🔖", tone: "green", items: ["shipped", "ingest_parts (document_id, part_idx)", "enrich_work_done (work_id)", "proven with kill -9 and replay"] },
    ],
    footer: "never say 'idempotent upserts' when your upserts add",
    beats: B(
      "How it got here. Auto committed offsets were considered. They commit on a timer, so a crash loses work or duplicates it, depending on luck.",
      { say: "Then what the resume originally claimed: idempotent upserts keyed by fingerprint. The mechanism was wrong. The metrics upsert is count equals count plus new, and findings add one to an occurrence count. Both are additive, so a redelivery doubles them.", tone: "excite" },
      "What shipped: a marker row in the same transaction. Ingest parts, keyed by document and part index, for the ingest lane. Enrich work done, keyed by work ID, for the enrichment lane.",
      { say: "Never say idempotent upserts, when your upserts add.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "EnrichConsumer.commit: LLM work outside, effects inside",
    lang: "java",
    code: `if (ledger.isDone(request.workId())) return;   // before the LLM: replay costs 0 tokens
Outcome outcome = callLlmAndEmbed(request);         // slow, no transaction
Boolean won = txTemplate.execute(status -> {
    if (!ledger.claim(request.workId(), request.sessionId()))
        return Boolean.FALSE;               // another delivery already committed
    for (FindingsWriter.Finding f : outcome.findings())
        findingsWriter.upsert(f);
    if (!outcome.embeddings().isEmpty())
        chunkRepository.updateEmbeddings(request.sessionId(), outcome.embeddings());
    sessionRepository.incrementEnrichedWindows(request.sessionId());
    return Boolean.TRUE;
});`,
    highlight: [null, [1, 1], [2, 2], [4, 5], [6, 10]],
    beats: B(
      "The enrichment lane follows the same pattern.",
      "Before calling the LLM at all, it checks the ledger. If this work item is done, it returns, so a redelivery costs zero tokens.",
      "The LLM and embedding calls run outside any transaction.",
      "Then one transaction claims the work ID in the ledger. If the claim fails, another delivery already committed, so nothing is written.",
      { say: "Otherwise, the findings, the embeddings and the enriched window counter commit together with the claim.", tone: "key" },
    ),
  },
  {
    kind: "numbers",
    title: "How it was proven: bench/chaos.py",
    items: [
      { value: "657 vs 621", label: "kill -9 after enrich commit, before", sub: "+5.8% finding occurrences" },
      { value: "315 = 315", label: "the same, after the fix", sub: "3 kills, compared to a clean run" },
      { value: "8,820", label: "LLM calls redone on replay, before", sub: "counts doubled: 382 of 191 windows" },
      { value: "2,379", label: "items skipped on replay, after", sub: "by their enrich_work_done marker" },
    ],
    footer: "plus ExactlyOnceIT (Testcontainers, in CI): every message delivered twice",
    beats: B(
      "How was it proven? A harness runs the real jar and watches its log. The moment a unit of work logs committed, after the database commit and before the offset commit, it sends kill minus nine. Restart, repeat three times, compare every count with a clean run. Before the fix: six hundred and fifty seven finding occurrences against six hundred and twenty one. Five point eight percent too many.",
      "After the fix, three hundred and fifteen against three hundred and fifteen. Exact.",
      { say: "Then replay. Rewind the enrichment group to offset zero and wait for lag zero. The old code redid eight thousand eight hundred and twenty LLM calls, and doubled the counts. One session ended at three hundred and eighty two of a hundred and ninety one windows.", tone: "excite" },
      "After the fix, the measured session is unchanged, and two thousand three hundred and seventy nine items are skipped by their markers.",
      { say: "And there's a white box test in CI, with Testcontainers, that delivers every part and every enrichment item twice and checks the database is identical, and that the LLM is called once.", tone: "key" },
    ),
  },
  {
    kind: "big",
    tone: "myth",
    lead: "The replay bug",
    text: "Replaying the parts topic turned four finished sessions into FAILED.",
    after: "The consumer did its ranged read BEFORE checking the marker, and the staged file was already deleted. Fix: check the marker first; a late failure never fails a completed document.",
    beats: B(
      "Replay is one of Kafka's main promises. When I tried it on the parts topic, four finished sessions turned failed.",
      "The data was correct. Only the status was wrong.",
      { say: "The consumer did the slow ranged read before checking its marker, and the finalizer had already deleted the staged file. Every replayed part threw, retried three times, went to the dead letter queue, and the failure handler marked the session failed. The fix: check the marker first, and never let a late failure mark a completed document failed. Lesson: exactly once also means a redelivery mustn't trip over a precondition that has since changed.", tone: "key" },
    ),
  },
  {
    kind: "drill",
    items: [
      { q: "Why not Kafka transactions?", a: "They make consume-and-produce atomic within Kafka. My effect is a Postgres write, which can't join a Kafka transaction." },
      { q: "An alternative to a marker table?", a: "Store the consumed offset in Postgres with the data and seek() to it on assignment. Exactly-once too, more custom code per consumer." },
      { q: "Anything to watch when deploying it?", a: "Old work has no marker, so replaying across the deploy re-runs it (~1,080 items measured). Backfill markers, or don't rewind past the deploy." },
      { q: "How long is recovery after a crash?", a: "Until the group rebalances: about 30 s measured, bounded by the session timeout." },
    ],
    beats: [
      { say: "Why not Kafka transactions?", hold: 1.5 },
      { say: "They make consuming and producing atomic within Kafka. My effect is a write to Postgres, which can't be part of a Kafka transaction, so I'd still need idempotency in Postgres." },
      { say: "Is there an alternative to a marker table?", hold: 1.5 },
      { say: "Store the consumed offset in Postgres, in the same transaction as the data, and on partition assignment, seek to it. Also exactly once, saves a table, but needs custom code per consumer. At very high message rates I'd switch to it." },
      { say: "Anything to watch when deploying this?", hold: 1.5 },
      { say: "Work finished by the old code has no marker, so replaying across the deploy re-runs it. I measured about a thousand and eighty old items. Backfill the markers, or don't rewind past the deploy. And run the migration that creates the marker table before the new code starts." },
      { say: "How long is recovery after a crash?", hold: 1.5 },
      { say: "Until the group rebalances. Measured at about thirty seconds, bounded by the consumer session timeout." },
    ],
  },

  // ------------------------------------------------------------ 10
  sec("10", "Failures, poison and robustness", "Part ten. What happens when things fail, and the three ways one bad file used to stop ingest for everyone."),
  {
    kind: "compare",
    title: "Retry, poison, dead letter",
    cols: [
      { title: "Retry", icon: "🔁", items: ["fixes transient errors", "timeouts, rate limits"] },
      { title: "Poison message", icon: "☠️", tone: "red", items: ["fails every time", "retry forever → its partition blocks", "everything behind it waits", "head-of-line blocking"] },
      { title: "Dead-letter queue", icon: "🅿️", tone: "green", items: ["park the poison", "the partition moves on", "inspect or replay later"] },
    ],
    beats: B(
      "Three ideas. A retry fixes a transient error, like a timeout or a rate limit.",
      { say: "A poison message fails every time. Retry it forever, and its partition is blocked, and every record behind it waits.", term: { word: "Head-of-line blocking", meaning: "one stuck record blocks its whole partition" } },
      "A dead letter queue is where poison is parked, so the partition can move on.",
    ),
  },
  arch(ERRORS, [
    { all: true },
    { t: "The happy path", b: "Process, commit the transaction with its marker, then acknowledge the offset.", nodes: ["item", "cons", "ok"], edges: ["a", "b"] },
    { t: "Rate limited", b: "A 429 never sleeps a worker: the item goes to the 60 s retry topic with notBefore, and one retry thread re-publishes it when due.", m: "up to 1,440 attempts ≈ 24 h", nodes: ["cons", "retry", "item"], edges: ["c", "g"] },
    { t: "Anything else", b: "Spring's DefaultErrorHandler retries with FixedBackOff(2000 ms, 2): three attempts in total.", m: "setCommitRecovered(true)", nodes: ["cons", "eh"], edges: ["d"] },
    { t: "Then, loudly", b: "The session is marked FAILED with a readable reason, and the record goes to the DLQ with size-capped headers.", m: "the user sees an error, not a spinner", nodes: ["eh", "fail", "dlq"], edges: ["e", "f"] },
  ], B(
    "Here's every path a record can take.",
    "The happy path. Process, commit the transaction with its marker, then acknowledge the offset.",
    "A rate limit, a four two nine, never puts a worker to sleep. The item goes to the sixty second retry topic with a not before time, and one retry thread re-publishes it when it's due. Up to one thousand four hundred and forty attempts, about a day. Nothing is dropped. And every final outcome counts towards completion, so one bad item can't block a session.",
    "Any other error goes to Spring's default error handler with a fixed back off of two seconds, two retries. Three delivery attempts in total.",
    { say: "Then the failure is loud. The session is marked failed, with a reason the user can read, and the record is published to the dead letter queue, with its headers capped in size. You'll see why that cap exists in a minute.", tone: "key" },
  ), "Every path a record can take"),
  {
    kind: "compare",
    title: "8 bad inputs, 256 MB heap: before → after",
    cols: [
      { title: "Stuck before", icon: "🧊", tone: "red", items: ["one NUL byte: stuck in PARSING", "a gzip file: stuck in PARSING", "one 100 MB line: OOM, split consumer stopped", "120k lines in one minute: FAILED, then its partition blocked"] },
      { title: "After", icon: "✅", tone: "green", items: ["NUL: DONE in 0.6 s, 601 of 601 lines", "gzip: FAILED in 0.6 s, readable reason", "100 MB line: DONE in 7.7 s", "busy minute: DONE in 17.5 s, 60 chunks"] },
    ],
    footer: "rule: every upload ends parsed, or FAILED with a reason. Never stuck.",
    beats: B(
      "The robustness test sent eight bad inputs to the real jar with a two hundred and fifty six megabyte heap, and required a clear end state for each. Before the fixes, four went wrong. A single NUL byte, stuck in parsing forever. A gzip file, stuck too. One hundred megabyte line, out of memory, and the split consumer stopped. And a hundred and twenty thousand lines in one minute failed, then blocked its partition.",
      "After: the NUL file parses all six hundred and one lines in nought point six seconds. The gzip file fails in nought point six seconds with a readable message. The huge line finishes in seven point seven seconds, and the busy minute in seventeen and a half, as sixty chunks.",
      { say: "The rule: every upload ends parsed, or failed with a reason. Never stuck, because stuck means a user watching a spinner and nobody alerted.", tone: "key" },
    ),
  },
  {
    kind: "seq",
    title: "Case 1: one byte that froze a session",
    actors: [
      { id: "w", name: "Part worker", icon: "⚙️" },
      { id: "p", name: "Postgres", icon: "🐘" },
      { id: "h", name: "Failure handler", icon: "🚑" },
    ],
    msgs: [
      { from: "w", to: "p", label: "INSERT chunk containing 0x00", step: 1 },
      { from: "p", to: "w", label: "invalid byte sequence for UTF8: 0x00", step: 1, tone: "red", dash: true },
      { from: "w", to: "h", label: "3 attempts failed", step: 2 },
      { from: "h", to: "p", label: "UPDATE sessions SET error = '…0x00…'", step: 3 },
      { from: "p", to: "h", label: "same error: the reason quotes the NUL", step: 3, tone: "red", dash: true },
      { from: "h", to: "h", label: "logs it, gives up: PARSING forever", step: 4, tone: "red" },
    ],
    note: { step: 5, text: "strip NUL at the edge · NUL-safe reasons · reject gzip by magic bytes" },
    beats: B(
      "Case one. One byte that froze a session.",
      "A log line contained a NUL byte. Java strings allow it, but Postgres text does not, so the chunk insert failed.",
      "After three attempts, the failure handler ran.",
      { say: "It tried to save the error message on the session. But the message quoted the failing row, NUL byte included, so the handler's own update failed with the same error.", tone: "excite" },
      "It logged that and gave up, and the session sat in parsing forever. A gzip upload hit the same path, because compressed bytes are full of NULs.",
      { say: "The fixes: strip NUL bytes at the edge, before any SQL. Make the stored failure reason NUL safe. And reject compressed files up front by their first bytes. The lesson: test the error path with the same bad input. An error handler that can fail on its own input turns a failure into a hang.", tone: "key" },
    ),
  },
  {
    kind: "big",
    tone: "myth",
    lead: "Case 2: the zombie consumer",
    text: "A 100 MB line with no newline: the splitter buffered it whole, hit OutOfMemoryError, and Spring stopped that listener container.",
    after: "HTTP kept answering, so health checks passed, while every later upload stayed in CREATED. Fix: bound every buffer, plus -XX:+ExitOnOutOfMemoryError.",
    beats: B(
      "Case two. The zombie consumer.",
      "A hundred megabyte line with no newline. The splitter buffered it whole, hit out of memory at the heap cap, and Spring Kafka stopped that listener container.",
      { say: "But the HTTP API kept answering. A health check would pass, while every later upload sat in created. The real fix: bound every buffer. One megabyte per line in the splitter, sixty four thousand characters per stored line, at most two thousand lines per chunk. And a safety net, exit on out of memory error in the Dockerfile, so the platform restarts the process and Kafka redelivers. The trade off: a record that always ran out of memory would crash loop, which the bounds prevent, and a restart counter alert would catch.", tone: "key" },
    ),
  },
  {
    kind: "numbers",
    title: "Case 3: the DLQ that couldn't accept the message",
    items: [
      { value: "14 MB", label: "busy-minute chunk in the JDBC error", sub: "quoted several times" },
      { value: "42 MB", label: "DLQ record", sub: "full exception text in headers" },
      { value: "1 MB", label: "Kafka's record limit", sub: "RecordTooLargeException" },
      { value: "9.7 KB", label: "headers after the cap", sub: "BoundedExceptionHeaders" },
    ],
    footer: "the last line of defence needs a size limit too",
    beats: B(
      "Case three, found because a chaos run hung for thirty minutes. The busy minute part failed, and the JDBC error message quoted the fourteen megabyte chunk, several times.",
      "Spring's dead letter publisher copies the full exception message and stack trace into the record's headers. So the dead letter record was forty two megabytes.",
      { say: "Kafka's limit is one megabyte. It refused the record. A record that can't be dead lettered is never recovered, so it was retried forever, and blocked its partition for every later upload.", tone: "excite" },
      "The fix caps the headers and writes a compact trace. A unit test drives Spring's real recoverer: forty two million bytes of headers became nine thousand six hundred and eighty one.",
      { say: "The last line of defence needs a size limit too.", tone: "key" },
    ),
  },
  {
    kind: "drill",
    items: [
      { q: "Why not retry forever so nothing is lost?", a: "Only self-clearing errors (rate limits) retry for ~24 h, on a separate topic. Bugs and bad data would block a partition." },
      { q: "Doesn't an OutOfMemoryError just kill one request?", a: "Not in a Kafka listener: an Error stops the container. The process looks healthy while ingest is dead." },
      { q: "What's still missing?", a: "A DLQ replay tool, alerts on DLQ growth, and a job that re-triggers sessions stuck in CORRELATING." },
    ],
    beats: [
      { say: "Why not retry forever, so nothing is ever lost?", hold: 1.5 },
      { say: "Only errors that clear on their own, like rate limits, are retried for about a day, on a separate retry topic. For bugs and bad data, infinite retries just block a partition." },
      { say: "Doesn't an out of memory error just kill one request?", hold: 1.5 },
      { say: "Not inside a Kafka listener. An Error stops the listener container, so the process looks healthy while ingest is dead." },
      { say: "What's still missing?", hold: 1.5 },
      { say: "A tool to replay the dead letter queue, alerts when it grows, and a background job that re-triggers sessions stuck in correlating." },
    ],
  },

  // ------------------------------------------------------------ 11
  sec("11", "Layer 1: deterministic parsers", "Part eleven. Layer one. How lines become exact numbers, with no model involved."),
  {
    kind: "code",
    title: "One line → exact metric rows",
    lang: "text",
    code: `2026-07-15 09:30:02 ERROR [db-proxy] - SQL timeout duration=12000ms

log_metrics (session, 09:30, ERRORS,   errors)        count += 1
log_metrics (session, 09:30, DATABASE, sql_timeouts)  count += 1
log_metrics (session, 09:30, DATABASE, sql_latency_ms) sum_ms += 12000

"How many 503s between 10:00 and 10:10?"  ->  SQL, not an LLM call`,
    highlight: [null, [1, 1], [3, 5], [7, 7]],
    beats: B(
      "Take one line.",
      "Nine thirty and two seconds, error, from the database proxy: SQL timeout, twelve thousand milliseconds.",
      "The parsers turn it into rows: one more error, one more SQL timeout, and a latency sample of twelve thousand milliseconds, all for the nine thirty window. Every line of every minute, no model involved, so the numbers are exact and repeatable.",
      { say: "So, how many five oh threes between ten and ten ten? That's a SQL query, not an LLM call.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "Windowing, caps, eight parsers",
    firstItemStep: 1,
    items: [
      { icon: "🪟", text: "TimeWindowChunker: 60-second buckets", sub: "lines with no timestamp inherit the previous one: a stack trace stays in its minute" },
      { icon: "🧢", text: "Caps: 2,000 lines or 512 KB per chunk", sub: "a busy minute becomes several chunks, same time bucket" },
      { icon: "🔍", text: "8 regex parsers", sub: "ApiCall · Sql · Error · Performance · Auth · Lifecycle · Traffic · Signature" },
      { icon: "➕", text: "Upsert on (session, time_bucket, category, metric)", sub: "count and sum_ms add; p95 keeps the larger value" },
    ],
    beats: B(
      "Four pieces.",
      "Windowing groups lines into sixty second buckets. A line with no timestamp, a stack frame, inherits the timestamp of the line before it, so a stack trace stays in its minute.",
      "Caps, added in the robustness work: at most two thousand lines or five hundred and twelve kilobytes per chunk. A busy minute becomes several chunks with the same time bucket.",
      "Eight parsers, each a set of regular expressions for one topic: API calls, SQL, errors, performance, auth, lifecycle, traffic, and signatures, which counts warnings and normalises error templates.",
      "And the metrics upsert, keyed by session, time bucket, category and metric. Count and summed milliseconds add up. The p95 keeps the larger value.",
    ),
  },
  {
    kind: "trap",
    myth: "The metrics are exact.",
    truth: "Exact per window. The p95 across two parts writing the same minute is an upper bound.",
    why: "Two partial p95s can't be merged exactly. You'd need the raw samples or a sketch like t-digest.",
    beats: B(
      "One precise claim to get right. Are the metrics exact?",
      "Counts are exact, per window. But when two parts write the same minute, the upsert keeps the larger p95, which is an upper bound, not the true p95.",
      { say: "Two partial percentiles can't be merged exactly. An exact merge would need the raw samples, or a sketch like t digest. Saying that unprompted shows you understand percentiles.", tone: "key" },
    ),
  },
  {
    kind: "drill",
    items: [
      { q: "Why regex, not an LLM, for extraction?", a: "Counting must be exact and repeatable. Regexes run on every line for free and give the same answer every time." },
      { q: "Why not template mining like Drain?", a: "Good for unknown formats, but it gives templates, not domain metrics like 'connection pool exhausted'." },
      { q: "A real parser bug?", a: "(?i)\\bERROR\\b counted 'parity error corrected', an INFO line in Loghub BGL. Levels are matched case-sensitively now." },
      { q: "What about unknown timestamp formats?", a: "An honest gap: only ISO-8601 and syslog. On five Loghub formats native recognition was 0%. Fix: configurable formats." },
    ],
    beats: [
      { say: "Why regex, and not an LLM, for extraction?", hold: 1.5 },
      { say: "Counting must be exact and repeatable. Regexes run on every line for free and give the same answer every time. The LLM later receives these numbers as authoritative context, and is told not to compute its own." },
      { say: "Why not template mining, like Drain?", hold: 1.5 },
      { say: "It's good for unknown formats, but it produces message templates, not domain metrics like connection pool exhausted." },
      { say: "Tell me about a real parser bug.", hold: 1.5 },
      { say: "A case insensitive error pattern counted parity error corrected, which is an info line in the Loghub BGL dataset, as an error. Log levels are now matched case sensitively. The old rule survives only in legacy mode." },
      { say: "What about timestamp formats you don't know?", hold: 1.5 },
      { say: "An honest gap. Only ISO and syslog are recognised, and on five Loghub formats native recognition was zero percent. The fix is configurable timestamp formats." },
    ],
  },

  // ------------------------------------------------------------ 12
  sec("12", "The anomaly gate", "Part twelve. The anomaly gate. It decides which minutes the LLM ever sees, so it decides the cost. And your own measurement broke it."),
  {
    kind: "chart",
    title: "The original gate vs traffic (legacy absolute rules)",
    type: "line",
    labels: ["1 line/s", "2", "5", "20", "50"],
    series: [
      { name: "windows flagged, %", values: [20.8, 33.3, 82.5, 100, 99.6], tone: "red", step: 1 },
      { name: "LLM-call reduction, %", values: [77.2, 64.9, 17.2, 0, 0.3], tone: "blue", step: 2 },
    ],
    max: 100,
    unit: "%",
    note: { step: 3, text: "at 20 lines/s every minute has a harmless ERROR: savings 0%" },
    beats: B(
      "The original rules were absolute. Flag a window for any error or exception line, five or more warnings, or latency above three times the session's p95. I measured them with the same generator, changing only the line rate.",
      "Windows flagged: twenty one percent at one line a second. Eighty two percent at five. A hundred percent at twenty.",
      "And the LLM call reduction, the whole point of the gate, fell from seventy seven percent to zero.",
      { say: "At twenty lines a second, every minute contains some harmless error line, an email retry, a client disconnecting, so the gate saved nothing. None of this is visible by reading the code. It only showed up when measured on labelled data across traffic rates.", tone: "key" },
    ),
  },
  {
    kind: "big",
    tone: "idea",
    lead: "Why the p95 rule hid incidents",
    text: "Once an incident covers more than 5% of windows, the incident IS the p95.",
    after: "A payment-latency incident covering 6.7% of a 2-hour log was invisible to the rule meant to catch it.",
    beats: B(
      "And a second, sneakier failure. The latency rule masked itself.",
      "It compared each window with the session's p95. But once an incident covers more than five percent of the windows, the incident becomes the p95.",
      { say: "On a two hour corpus, a payment latency incident covered six point seven percent of windows, and was invisible to the very rule meant to catch it.", tone: "key" },
    ),
  },
  {
    kind: "custom",
    name: "llmad",
    beats: B(
      "So the fix uses robust statistics. Ten minutes of error counts: two, three, two, four, three, two, three, two hundred and fifty, two, three.",
      "The mean is twenty seven point four. One bad minute dragged it up ten times, and inflated the standard deviation with it. A big incident raises the very baseline it's compared against, and hides itself.",
      { say: "The median is three. It ignores the extreme value. In fact, the median barely moves until half the data is abnormal.", term: { word: "Median", meaning: "robust: ignores outliers until half the data is bad" } },
      { say: "The MAD, the median absolute deviation, is the median of the distance from the median. Here, one. Times one point four eight two six, it estimates a standard deviation. The rule: a count of at least three, and above the median plus three point five times that scale, floored at one. Here, eight point two.", term: { word: "MAD", meaning: "median of |x − median|; × 1.4826 ≈ σ" } },
      { say: "Two hundred and fifty has a modified z score of about a hundred and sixty seven. Three point five is the textbook cut off, from Iglewicz and Hoaglin. Textbook, not tuned, which matters when someone asks about overfitting.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "The robust gate: four rules, behind a flag",
    firstItemStep: 1,
    items: [
      { icon: "🧱", text: "Hard rules, local to a window", sub: "FATAL/SEVERE, out of memory, deadlock, pool EXHAUSTED, thread-pool rejection, health DOWN" },
      { icon: "📈", text: "Count spikes", sub: "ERROR, WARN, exceptions, 5xx, 401, 403, SQL failures: ≥ 3 and > median + 3.5 × max(1.4826·MAD, 1)" },
      { icon: "⏱️", text: "Latency spikes", sub: "window p95 > 2 × the median AND a MAD outlier" },
      { icon: "🦄", text: "Rare signatures", sub: "an error template in ≤ 2% of windows: one SSLHandshakeException is caught; all-day retries aren't" },
    ],
    beats: B(
      "The robust gate has four rules, behind a feature flag, anomaly mode, default robust.",
      "Hard rules, local to one window and independent of traffic: fatal or severe, out of memory, deadlock, connection pool exhausted, and not just Hikari pool starting, thread pool rejection, a failed health check.",
      "Count spikes on errors, warnings, exceptions, five hundreds, four oh ones, four oh threes and SQL failures, using the median and MAD rule, with minutes that have zero counted as zero.",
      "Latency spikes: the window's p95 is more than twice the median, and also a MAD outlier.",
      { say: "And rare signatures: an error template that appears in at most two percent of windows. An email retry error that appears all day is ignored. A single SSL handshake exception is caught.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "Two phases, like MapReduce",
    cols: [
      { title: "Map: part threads", icon: "🧩", items: ["see only their own slice", "apply hard rules only", "write counts, p95s, signatures"] },
      { title: "Reduce: the finalizer", icon: "🧮", tone: "green", items: ["runs once per document", "median + MAD per metric, over ALL windows", "one SQL statement: percentile_cont", "UPDATE chunks SET is_anomalous"] },
      { title: "Kept honest", icon: "⚖️", tone: "purple", items: ["Testcontainers: SQL flags = Java flags", "the eval uses the Java version", "real pipeline: 77 windows, 315 calls = eval"] },
    ],
    beats: B(
      "One design subtlety. A part thread sees only its own slice, so it can't know the session's median. So the rules run in two phases, like MapReduce. Part threads apply only the hard rules, and write the counts.",
      "The session wide statistics need every window, so the finalizer runs them once, after all parts are in, as a single SQL statement using percentile cont for the medians, ending in an update that sets the anomaly flag.",
      { say: "And it's kept honest. A Testcontainers test checks that the SQL version flags exactly the same windows as the Java version the eval uses. And the real pipeline, with a stub LLM counting HTTP calls, flagged seventy seven windows and made three hundred and fifteen calls, the same as the eval.", tone: "key" },
    ),
  },
  {
    kind: "numbers",
    title: "Results: same build, flag switched",
    items: [
      { value: "0.576 → 0.901", label: "F1, 6 h medium-noise log", sub: "precision 0.426 → 0.883" },
      { value: "14.8 → 1.5", label: "false alarms per hour", sub: "incident recall 1.0 → 1.0" },
      { value: "0.3 → 74.3%", label: "LLM-call reduction at 50 lines/s", sub: "~75% at every rate" },
      { value: "0.92-0.95", label: "F1 on held-out seeds", sub: "BGL real labels: 0.501 → 0.581" },
    ],
    footer: "a 'silent' credential-stuffing incident, logged only as INFO status=401, is now caught",
    beats: B(
      "Results, same build, only the flag switched. F1 on the six hour medium noise log: point five seven six to point nine oh one. Precision more than doubled.",
      "False alarms: fourteen point eight per hour down to one point five. All twelve injected incidents still caught.",
      "LLM call reduction at fifty lines a second: from nought point three percent to seventy four point three. About seventy five percent at every rate.",
      "And on held out seeds the rules were never tuned on: point nine two to point nine five. On real Loghub BGL labels, point five oh one to point five eight one.",
      { say: "Plus a silent credential stuffing incident, logged only at info level as status four oh one, was invisible to the old rules. The robust gate catches it through the spike in four oh ones.", tone: "key" },
    ),
  },
  {
    kind: "drill",
    items: [
      { q: "MAD is 0 for sparse counts. Doesn't everything fire?", a: "The scale is floored at 1 and at least 3 events are required, so one harmless error never fires." },
      { q: "Your resume says 90% fewer calls. Now you say 75%?", a: "Different data: 87.5% on the demo log; the eval corpus is deliberately incident-dense. Savings depend on the share of abnormal windows." },
      { q: "You wrote the generator AND the rules. Overfitting?", a: "Held-out seeds, real Loghub BGL labels, the owner's real log, and textbook thresholds, not tuned ones." },
      { q: "What does the gate miss?", a: "Slow drifts over hours, changes in what's logged without volume change, and a session abnormal from start to finish." },
      { q: "Why a feature flag?", a: "Measure both rule sets on one build and one dataset, and roll back without a deploy: LOGLENS_ANOMALY_MODE=legacy." },
    ],
    beats: [
      { say: "The MAD is zero for sparse counts. Doesn't everything fire?", hold: 1.5 },
      { say: "The scale is floored at one, and at least three events are required, so a single harmless error never fires." },
      { say: "Your resume said ninety percent fewer calls. Now you're saying seventy five?", hold: 1.5 },
      { say: "Different data. On the demo log it's eighty seven point five percent. The eval corpus is deliberately dense with incidents, so fewer windows should be skipped. Savings depend on the share of abnormal windows." },
      { say: "You wrote the generator and the rules. Isn't that overfitting?", hold: 1.5 },
      { say: "That's why I used held out seeds, real Loghub BGL labels, the owner's real demo log, and textbook thresholds rather than tuned ones." },
      { say: "What does the gate miss?", hold: 1.5 },
      { say: "Slow drifts over hours. Incidents that change what's logged without changing volumes or templates. And a session that's abnormal from start to finish, because the median moves with it. Next steps: baselines per hour of day, or comparing against a known healthy session." },
      { say: "Why a feature flag?", hold: 1.5 },
      { say: "To measure both rule sets on one build and one dataset, and to roll back without a deploy, by setting the anomaly mode to legacy." },
    ],
  },
];
