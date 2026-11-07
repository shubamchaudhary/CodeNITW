import type { Scene } from "../../lib/types.ts";
import { B, arch, sec } from "./h.ts";
import { INGEST } from "./diagrams.ts";

// Part B: the upload, Kafka, the splitter, part workers and the finalizer, and
// the bounded-memory measurement.
export const partB: Scene[] = [
  // ------------------------------------------------------------ 4
  sec("4", "The upload path", "Now the mechanics, in the order a file meets them. First, the upload."),
  {
    kind: "compare",
    title: "Three ways to get 2 GB into the system",
    cols: [
      { title: "Server's disk", icon: "💾", tone: "red", items: ["tried in v1", "Render's disk is wiped on every deploy", "API and workers can't share it"] },
      { title: "Stream through the API", icon: "🚰", tone: "purple", items: ["the endpoint still exists", "bytes still pass through the JVM", "holds a request thread for minutes"] },
      { title: "Presigned PUT + confirm", icon: "🔑", tone: "green", items: ["shipped July 22", "browser → blob store directly", "API answers in milliseconds", "never holds the file"] },
    ],
    footer: "a 2 GB upload costs the 512 MB API no memory and no threads",
    beats: B(
      "Three ways to get a two gigabyte file in. One: save it to the server's disk. Version one did that, and Render wipes that disk on every deploy, and the API and workers can't share it anyway.",
      "Two: stream it through the backend into blob storage. That endpoint still exists. It works, but the bytes still pass through the JVM, and a request thread is held for minutes.",
      "Three, what shipped: a presigned upload straight from the browser to blob storage, then a confirm call where the server checks the object.",
      { say: "So a two gigabyte upload costs the five hundred megabyte API no memory and no threads.", tone: "key" },
    ),
  },
  {
    kind: "seq",
    title: "Presign, PUT, confirm",
    actors: [
      { id: "b", name: "Browser", icon: "🖥️" },
      { id: "a", name: "API", icon: "🧩" },
      { id: "s", name: "Blob store", icon: "🪣" },
      { id: "p", name: "Postgres", icon: "🐘" },
      { id: "k", name: "Kafka", icon: "📨" },
    ],
    msgs: [
      { from: "b", to: "a", label: "presign", step: 1 },
      { from: "a", to: "p", label: "same name + size?", step: 1 },
      { from: "a", to: "b", label: "PUT URL, 15 min", step: 2, dash: true },
      { from: "b", to: "s", label: "PUT the file, directly", step: 3 },
      { from: "b", to: "a", label: "POST confirm", step: 4 },
      { from: "a", to: "s", label: "stat: real size", step: 4 },
      { from: "a", to: "p", label: "save document row", step: 5 },
      { from: "a", to: "k", label: "IngestRequest pointer", step: 5 },
    ],
    note: { step: 6, text: "kafkaTemplate.send is not awaited: a dual write" },
    beats: B(
      "Here's the exchange.",
      "The browser asks to presign, with the file name and size. The API first checks whether the same session already has a file with that name and size.",
      "If so, it answers duplicate, and the upload is skipped entirely. Otherwise it returns a document ID and a presigned PUT URL, valid for fifteen minutes.",
      "The browser PUTs the file straight to the blob store. The API sees none of it.",
      "Then the browser calls confirm, and the API asks the blob store whether the object exists and how big it really is. It doesn't trust the client.",
      "Only then does it save the document row, and put a small ingest request on Kafka.",
      { say: "And here's a gap to admit before you're asked. The Kafka send isn't awaited. If Kafka is down right after the database commit, the row exists but no message was sent.", tone: "key" },
    ),
  },
  {
    kind: "decision",
    question: "Kafka is down right after confirm commits. What happens, and what's the fix?",
    answer: "The document row exists, the event is lost: a dual write. Fix it with a transactional outbox.",
    left: { title: "Transactional outbox", items: ["write the event into an outbox table", "in the same transaction as the row", "a relay publishes it, retrying", "consumers are idempotent anyway"] },
    right: { title: "What runs today", items: ["DB commit, then kafkaTemplate.send", "send is not awaited", "same pattern in the splitter", "and in the retry re-publish"] },
    footer: "name the gap and the standard fix before the interviewer does",
    beats: B(
      { say: "That's a classic follow-up. Kafka is down right after confirm commits. What happens?", tone: "ask" },
      "The document row exists, and the event is lost. That's a dual write: two systems updated without one transaction across them.",
      "The standard fix is a transactional outbox. Write the event into an outbox table in the same transaction as the row, and let a relay publish it to Kafka, retrying until it lands. Duplicates are fine, because the consumers are already idempotent. Today the same unawaited send pattern also appears in the splitter and in the retry path.",
      { say: "Name the gap, and the fix, before the interviewer does. It turns a weakness into a design discussion you're leading.", tone: "key" },
    ),
  },
  {
    kind: "drill",
    items: [
      { q: "Why a confirm step instead of trusting the client?", a: "The server stats the object itself, so size and existence in the DB are real, and 'upload finished' becomes one explicit event." },
      { q: "Why is the staged file deleted after ingest?", a: "The chunks in Postgres are the durable copy. Blob storage is staging only." },
      { q: "Inside Docker, the API reaches MinIO at minio:9000. How does the browser's URL work?", a: "Presigned URLs are signed with a separate client for the public endpoint, because the host is part of the signature." },
    ],
    beats: [
      { say: "Why a confirm step, instead of trusting the client?", hold: 1.5 },
      { say: "The server checks the object itself, so the size and existence recorded in the database are real. And confirm turns the upload finished into one explicit event to publish." },
      { say: "Why is the staged file deleted after ingest?", hold: 1.5 },
      { say: "Because the chunks in Postgres are the durable copy. Blob storage is only staging." },
      { say: "A detail from the code. Inside Docker, the API reaches MinIO at the host name minio. How does a URL handed to the browser still work?", hold: 1.5 },
      { say: "Presigned URLs are signed with a second client configured with the public endpoint. The host is part of the signature, so signing with the internal name would break it." },
    ],
  },

  // ------------------------------------------------------------ 5
  sec("5", "Kafka, and why it's here", "Next, Kafka. What it is, how LogLens uses it, and why it's there at all."),
  {
    kind: "compare",
    title: "Topic, partition, consumer group",
    cols: [
      { title: "Topic", icon: "📜", items: ["a named, append-only log", "records stay until retention ends", "reading doesn't delete: replay works"] },
      { title: "Partition", icon: "🧱", tone: "green", items: ["an ordered slice of a topic", "records numbered by offset", "key hash picks the partition"] },
      { title: "Consumer group", icon: "👥", tone: "purple", items: ["each partition has ONE owner in the group", "6 partitions → at most 6 busy threads", "commit an offset = 'done up to here'"] },
    ],
    footer: "parallelism = min(partitions, consumer threads)",
    beats: B(
      { say: "A topic is a named log that only grows at the end. Reading doesn't delete anything; records stay until retention ends. That's what makes replay possible.", term: { word: "Replay", meaning: "rewind a group's offsets, consume again" } },
      "A topic is split into partitions. Each one is an ordered list of records numbered by offset, and the producer hashes the record's key to pick a partition, so the same key always lands in the same place, in order.",
      { say: "And a consumer group is a set of consumers reading together. Kafka gives each partition to exactly one member at a time. So six partitions means at most six threads doing work, and a seventh sits idle.", term: { word: "Consumer group", meaning: "each partition has one owner at a time" } },
      { say: "Parallelism is the minimum of partitions and consumer threads.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "Delivery semantics: where you commit decides",
    cols: [
      { title: "At-most-once", icon: "🕳️", tone: "red", items: ["commit, then process", "crash → work lost"] },
      { title: "At-least-once", icon: "🔁", tone: "purple", items: ["process, then commit", "crash → redelivered", "duplicates happen"] },
      { title: "Exactly-once effect", icon: "🎯", tone: "green", items: ["at-least-once delivery", "+ an idempotent write", "LogLens: marker row in the same tx"] },
    ],
    footer: "LogLens: auto-commit off, manual ack after the DB commit",
    beats: B(
      "Where you commit the offset decides what a crash does. Commit first, then process, and a crash loses the work. At most once.",
      "Process first, then commit, and a crash means the record is delivered again. At least once. Duplicates happen.",
      "And an exactly once effect is at least once delivery, plus a write that's harmless to apply twice. In LogLens, that's a marker row committed in the same transaction as the data. Part nine is all about it.",
      { say: "LogLens turns auto commit off, and acknowledges each record manually, after the database commit.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "The six topics",
    lang: "text",
    code: `topic                  partitions   key                   consumer group
log.ingest.requests    6            sessionId             ingest-workers      1 thread
log.ingest.parts       6            documentId:partIdx    ingest-part-workers 3 local, 2 prod
log.ingest.dlq         1            -                     (parked)
llm.enrich.requests    1 per key    chosen explicitly     llm-workers         1 thread per key
llm.enrich.retry.60s   1 per key    sessionId             llm-retry           1 thread
llm.enrich.dlq         1            sessionId             (parked)

consumer: enable-auto-commit=false  ack-mode=MANUAL  max.poll.records=1
          max.poll.interval.ms=900000  auto-offset-reset=earliest`,
    highlight: [null, [2, 2], [3, 3], [4, 4], [5, 5], [6, 7], [9, 10]],
    beats: B(
      "Six topics. Learn this table.",
      "Ingest requests: six partitions, keyed by session, one splitter thread. One record per uploaded file.",
      "Ingest parts: six partitions, keyed by document ID and part index. Three part threads locally, two in production.",
      "The ingest dead letter queue, one partition, where poison records are parked.",
      "Enrichment requests: one partition per chat API key, with the partition chosen explicitly by the producer, and one thread per key. That's the rate limiting design.",
      "A sixty second retry topic for rate limited items, with a single retry thread, and an enrichment dead letter queue.",
      { say: "And the consumer settings: auto commit off, manual acknowledgement, one record per poll, a fifteen minute poll interval, and start from the earliest offset.", tone: "key" },
    ),
  },
  {
    kind: "big",
    tone: "interview",
    lead: "Why is the parts topic keyed by documentId:partIdx?",
    text: "A document-only key sends every part of a file to one partition: one thread, no parallelism.",
    after: "The composite key spreads one file's parts across all six partitions.",
    beats: B(
      { say: "A favourite detail question. Why is the parts topic keyed by document and part index, and not just the document?", tone: "ask" },
      "Because the key picks the partition. With only the document as key, every part of one file lands in the same partition, which one thread owns. No parallelism at all.",
      { say: "The composite key spreads a single file's parts across all six partitions.", tone: "key" },
    ),
  },
  {
    kind: "seq",
    title: "July 16: the rebalance storm",
    actors: [
      { id: "c", name: "Consumer", icon: "⚙️" },
      { id: "g", name: "Group coordinator", icon: "🧭" },
      { id: "l", name: "Rate-limited LLM", icon: "🐢" },
    ],
    msgs: [
      { from: "g", to: "c", label: "poll → 500 records", step: 1 },
      { from: "c", to: "l", label: "record 1 … ~90 s blocked", step: 1 },
      { from: "c", to: "l", label: "record 2 … still blocked", step: 1 },
      { from: "g", to: "c", label: "no poll in 15 min: you're out", step: 2, tone: "red" },
      { from: "c", to: "g", label: "rejoin · same records again", step: 3, dash: true },
      { from: "g", to: "c", label: "max.poll.records = 1", step: 4, tone: "green" },
    ],
    note: { step: 4, text: "one slow record can't push a consumer past its deadline" },
    beats: B(
      "Now the first production incident in Kafka: the rebalance storm.",
      "Each poll returned up to five hundred records, the default. Enrichment records can block for about ninety seconds while waiting on rate limits, and Spring processes every record from one poll before polling again.",
      { say: "Five hundred slow records blew past the fifteen minute max poll interval. The coordinator decided the consumer was dead and removed it from the group.", term: { word: "Rebalance", meaning: "the group redistributes partitions" } },
      "It rejoined, got the same uncommitted records back, and the cycle repeated. Offsets never committed, so embeddings were never saved.",
      { say: "The fix was one line: max poll records equals one. Each poll returns one record, so one slow record can't push the consumer past its deadline.", tone: "key" },
    ),
  },
  {
    kind: "drill",
    items: [
      { q: "Why Kafka, and not RabbitMQ or a database table?", a: "Replay, partitions as per-key lanes, consumer groups. RabbitMQ deletes on ack; the DB table was v1." },
      { q: "Doesn't Kafka's exactly-once mean no duplicates?", a: "It covers Kafka-to-Kafka inside a Kafka transaction. My effects are in Postgres." },
      { q: "Isn't Kafka overkill for a small app?", a: "At demo scale, yes; an in-JVM queue would work. The design targets the scaled shape, and the tests rely on replay." },
      { q: "Does processing need ordering?", a: "No. Completion is a counter plus an atomic claim, so parts can finish in any order." },
    ],
    beats: [
      { say: "Why Kafka, and not RabbitMQ or a database table?", hold: 1.5 },
      { say: "I needed replay, for rebuilding and for testing. Partitions as per key lanes for rate limiting. And consumer groups for parallelism. RabbitMQ removes a message once it's acknowledged, and has no partition level ordering. A database table is what version one used, with three second polling and lock leases, and I removed it." },
      { say: "Doesn't Kafka's exactly once mean duplicates can't happen?", hold: 1.5 },
      { say: "Kafka's exactly once covers reading from and writing to Kafka, inside a Kafka transaction. Consumers still see redelivered records after a crash, and my side effects go to Postgres, so they have to be idempotent there." },
      { say: "Isn't Kafka overkill for a small app?", hold: 1.5 },
      { say: "At demo scale, honestly, yes. An in JVM queue would work. The design targets the scaled shape, the rate limiting depends on partitions, and the crash tests depend on replay." },
      { say: "Does processing need ordering?", hold: 1.5 },
      { say: "No. Completion is a counter plus an atomic claim, so parts can finish in any order." },
    ],
  },

  // ------------------------------------------------------------ 6
  sec("6", "The splitter: virtual parts", "Now the most interesting piece of ingest. How do you split a two gigabyte log so several workers can parse it at once, without copying it, and without cutting a stack trace in half?"),
  {
    kind: "compare",
    title: "Three ways to parallelise one big file",
    cols: [
      { title: "One message per file", icon: "1️⃣", tone: "red", items: ["tried, July 15", "one consumer kept every window in a list", "memory grew with the file", "one thread did all the work"] },
      { title: "Physical part files", icon: "📄", tone: "purple", items: ["considered, July 17 spec", "parallel", "but writes the whole file again", "N objects to clean up"] },
      { title: "Virtual parts", icon: "📐", tone: "green", items: ["shipped July 22", "byte ranges, cut on minute boundaries", "workers do ranged GETs", "no copy is ever written"] },
    ],
    footer: "Hadoop calls them input splits; LogLens adds 'never cut a record or a minute'",
    beats: B(
      "Three options. The first version sent one message per file, and a single consumer collected every window of the file in a list. Memory grew with the file, and one thread did everything.",
      "The July seventeenth spec considered physical part files: write five megabyte pieces to storage. Parallel, but it writes the whole file a second time, and leaves N objects to clean up.",
      { say: "What shipped: virtual parts. Byte ranges cut at minute boundaries, which workers read with ranged GETs. No copy of the file is ever written.", term: { word: "Virtual part", meaning: "a byte range of the file, never copied" } },
      "If that sounds familiar, Hadoop and Spark call them input splits. LogLens adds one rule: never cut inside a log record, or inside a minute.",
    ),
  },
  {
    kind: "custom",
    name: "llsplit",
    beats: B(
      "Here's a two gigabyte file, about fifteen and a half million lines.",
      "The splitter reads the object exactly once, as a stream, with a sixty four kilobyte buffer, counting bytes exactly at each newline, so every offset is a true byte position. It holds one line and a few counters. Nothing else.",
      { say: "A line counts as a record start if it begins with a timestamp, ISO eight six oh one or syslog. Stack trace lines, the ones starting with at, have no timestamp. They're never record starts.", term: { word: "Record start", meaning: "a line that begins with a timestamp" } },
      { say: "The cut rule: at least five megabytes since the last cut, and this line starts a new minute, and it has a timestamp. Then the part ends at this line's first byte. So stack traces and minutes always stay whole.", tone: "key" },
      "The numbers. Five megabytes is the target.",
      "Twenty megabytes, four times the target, is a hard cap, still only on a record start, so one runaway minute can't produce a giant part. And a file with no timestamps at all is cut every five thousand lines.",
      "Each part becomes a tiny Kafka message: its index, the total, the byte start and end, and the global line number of its first line, so citations later use the original line numbers.",
      { say: "And total parts is saved before the first part is sent, so the finalizer can never run early. The file itself is never copied.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "IngestSplitter.computeParts: the cut",
    lang: "java",
    code: `boolean recordStart = (ts != null) || !anyTimestamp;
boolean windowBoundary = bucket != null && prevBucket != null
                         && !bucket.equals(prevBucket);
if (linesSinceCut > 0 && recordStart) {
    boolean cut =
        (anyTimestamp && windowBoundary && bytesSinceCut >= partTargetBytes)
        || (!anyTimestamp && linesSinceCut >= fallbackLinesPerPart)
        || (bytesSinceCut >= partTargetBytes * 4L);
    if (cut) emit(partStart, offset, firstLine);
}`,
    highlight: [null, [1, 1], [2, 3], [6, 6], [7, 7], [8, 8]],
    beats: B(
      "The real code is short.",
      "Record start: the line has a timestamp, or the file has none at all.",
      "Window boundary: this line's minute differs from the previous line's.",
      "The normal cut: timestamps exist, a new minute starts, and five megabytes have accumulated.",
      "The no timestamp fallback: five thousand lines.",
      { say: "And the hard cap at four times the target. Notice it's still inside the record start check, so even the cap never splits a stack trace.", tone: "key" },
    ),
  },
  {
    kind: "numbers",
    title: "Napkin: parts and windows, from the file alone",
    items: [
      { value: "≈ 129 B", label: "per line", sub: "2,000 MB ÷ 15.5M lines" },
      { value: "≈ 400", label: "parts in 2 GB", sub: "2 GB ÷ a bit over 5 MB" },
      { value: "12,920", label: "windows in the bench file", sub: "15.5M lines ÷ 20 lines/s ÷ 60" },
      { value: "205 · 3,019", label: "demo: parts · chunks", sub: "1 GB, 591 minutes, ~9k lines/min" },
    ],
    footer: "a busy minute is split into several chunks: at most 2,000 lines or 512 KB each",
    beats: B(
      "Interviewers love it when you can re-derive your own numbers. Two gigabytes over fifteen and a half million lines is about a hundred and twenty nine bytes per line.",
      "A part is cut just after five megabytes, at the next minute boundary, so two gigabytes is roughly four hundred parts.",
      "The benchmark file was generated at twenty lines per second. Fifteen and a half million lines, divided by twenty, divided by sixty, is about twelve thousand nine hundred minutes. The run produced twelve thousand nine hundred and twenty chunks. One per minute, exactly as designed.",
      "The demo file is denser: one gigabyte over five hundred and ninety one minutes, about nine thousand lines a minute, so about three minutes per part, which gives two hundred and five parts.",
      { say: "And why three thousand and nineteen chunks for five hundred and ninety one minutes? Because a chunk is capped at two thousand lines or five hundred and twelve kilobytes. Nine thousand lines a minute is about five chunks per minute, all with the same time bucket.", tone: "key" },
    ),
  },
  {
    kind: "drill",
    items: [
      { q: "How do you avoid splitting a stack trace?", a: "Cuts only happen on a timestamped line that starts a new minute. Stack frames have no timestamp." },
      { q: "Don't ranged reads need the whole object first?", a: "No. S3 and MinIO serve Range: bytes=a-b directly; only the slice is streamed." },
      { q: "What if the log has no timestamps?", a: "5,000-line parts, 500-line windows, bucketed by global line number so parts agree without talking." },
      { q: "How much memory does the splitter use?", a: "One line, at most 1 MB, plus counters. It streams with a 64 KB buffer." },
    ],
    beats: [
      { say: "How do you avoid splitting a stack trace?", hold: 1.5 },
      { say: "Cuts only happen on a line that has a timestamp and starts a new minute. Stack frames have no timestamp, so they always stay with their record." },
      { say: "Don't ranged reads need the whole object downloaded first?", hold: 1.5 },
      { say: "No. S3 and MinIO serve a range header directly, and the client streams only that slice." },
      { say: "What if the log has no timestamps?", hold: 1.5 },
      { say: "Parts of five thousand lines and windows of five hundred, and window buckets come from the global line number, so independent parts agree without coordinating." },
      { say: "How much memory does the splitter use?", hold: 1.5 },
      { say: "One line, capped at one megabyte, and a few counters. It streams with a sixty four kilobyte buffer. Never say it loads the file." },
    ],
  },

  // ------------------------------------------------------------ 7
  sec("7", "Part workers and the finalizer", "Now the workers that process each part, and the trick that decides when a whole file is finished, without any coordinator."),
  arch(INGEST, [
    { all: true },
    { t: "Presign", b: "The browser asks the API for an upload link.", nodes: ["browser", "api"], edges: ["pc"] },
    { t: "PUT", b: "The bytes go straight to the blob store.", m: "the API never sees them", nodes: ["browser", "blob"], edges: ["up"] },
    { t: "Confirm", b: "The API stats the object, saves the row, and publishes one pointer.", m: "IngestRequest{sessionId, documentId, fileUrl}", nodes: ["browser", "api", "kreq"], edges: ["pc", "ptr"] },
    { t: "Split", b: "One splitter thread consumes it and streams the object once.", m: "≈ 14.6 MB/s on the 2 GB run", nodes: ["kreq", "splitter", "blob"], edges: ["k1", "sread"] },
    { t: "Fan out", b: "One pointer per part, with byte offsets and the first line number.", m: "total_parts saved first", nodes: ["splitter", "kparts"], edges: ["sparts"] },
    { t: "Ranged reads", b: "Part workers take parts in parallel and read only their slice.", m: "Range: bytes=a-b", nodes: ["kparts", "workers", "blob"], edges: ["kw", "wread"] },
    { t: "One short transaction", b: "Marker row, chunks, metrics and the parsed_parts counter commit together.", m: "slow work happens before it", nodes: ["workers", "pg"], edges: ["wtx"] },
    { t: "Finalize", b: "Every part tries the atomic claim. Exactly one wins and runs the session-wide statistics.", m: "UPDATE … WHERE parsed >= total", nodes: ["workers", "fin", "pg"], edges: ["wfin", "fpg"] },
    { t: "Enrich items", b: "The winner publishes work for flagged windows only, then deletes the staged file.", m: "embedding batches for all chunks", nodes: ["fin", "kenr"], edges: ["fen"] },
  ], B(
    "Here's ingest, component by component. Follow the amber path.",
    "The browser asks the API for an upload link.",
    "The bytes go straight to the blob store.",
    "Confirm: the API checks the object, saves the row, and publishes one pointer on the requests topic.",
    "One splitter thread consumes it and streams the object once. On the two gigabyte run, the splitter reached the end after a hundred and thirty seven seconds, about fourteen and a half megabytes a second.",
    "It publishes one pointer per part, with byte offsets and the first line number. Total parts was saved before the first of them.",
    "Part workers take parts in parallel, and each reads only its slice with a ranged GET.",
    "Each part ends in one short transaction: the marker row, the chunks, the metrics, and an increment of the parsed parts counter, all together. All the slow work happened before the transaction opened.",
    "Then every part, on every path, tries the atomic finalize claim. Exactly one caller wins, and runs the session wide statistics.",
    { say: "The winner publishes enrichment items, for flagged windows only, plus embedding batches for every chunk, and deletes the staged file.", tone: "key" },
  ), "Ingest, component by component"),
  {
    kind: "code",
    title: "PartConsumer.process (shortened)",
    lang: "java",
    code: `if (partRepository.isProcessed(documentId, part.partIdx())) {
    finalizer.tryFinalize(sessionId, documentId, part.fileUrl()); // redelivery
    return;                                                        // no read at all
}
// --- slow work OUTSIDE any transaction ---
List<String> lines = readSlice(part.fileUrl(), part.byteStart(), length);
// chunk into 60 s windows, run the 8 parsers, apply the local hard rules
// --- ONE short transaction ---
Boolean processed = txTemplate.execute(status -> {
    if (!partRepository.claimPart(documentId, part.partIdx()))
        return Boolean.FALSE;                          // someone already did it
    chunkRepository.insertBatch(sessionId, chunkRows);
    metricsWriter.upsert(sessionId, metricRows);
    documentRepository.incrementParsedParts(documentId);
    return Boolean.TRUE;
});
finalizer.tryFinalize(sessionId, documentId, part.fileUrl());`,
    highlight: [null, [1, 4], [5, 7], [9, 11], [12, 15], [17, 17]],
    beats: B(
      "This is the part consumer, shortened from the real code. Four moves.",
      "One. Check the marker first, with a cheap select. If this part was already processed, skip it before doing any I O, but still call try finalize.",
      "Two. Do the slow work outside any transaction. The ranged read, chunking into sixty second windows, the eight parsers, the local hard rules.",
      { say: "Three. One short transaction. Claim part inserts the marker row with on conflict do nothing. One row inserted means this part is mine. Zero means someone already did it, so write nothing.", term: { word: "Marker row", meaning: "\"this work is done\", in the same tx as its data" } },
      "Inside the same transaction: insert the chunks, upsert the metrics, and increment parsed parts.",
      { say: "Four. Always call try finalize, on every path, even when the part was skipped.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "DocumentRepository.claimFinalize: no coordinator needed",
    lang: "java",
    code: `@Query("update Document d set d.processingStatus = COMPLETED "
     + "where d.id = :id and d.totalParts > 0 "
     + "and d.parsedParts >= d.totalParts "
     + "and d.processingStatus = PROCESSING")
int claimFinalize(@Param("id") UUID id);  // 1 for the winner, 0 for the rest`,
    highlight: [null, [2, 3], [4, 4], [5, 5]],
    beats: B(
      "Four parts finish in random order. How do you know the last one is done, and make the finishing step run exactly once, with no coordinator?",
      "One conditional update. It only matches when total parts is known and parsed parts has reached it.",
      "And only while the status is still processing. The update itself flips it to completed.",
      { say: "So Postgres row locking lets exactly one caller get one row back. Everyone else gets zero. No lock service, no leader election, no ZooKeeper.", tone: "key" },
    ),
  },
  {
    kind: "big",
    tone: "interview",
    lead: "Why does every path call tryFinalize?",
    text: "The last part commits, then the JVM dies before tryFinalize. On redelivery, the marker skips the writes, but the finalizer still has to run.",
    after: "Calling it on every path, guarded by the atomic claim, covers that crash window.",
    beats: B(
      { say: "Why does even the skip path call try finalize?", tone: "ask" },
      "Picture the last part committing its transaction, and the JVM dying before try finalize runs. When the part is redelivered, the marker says it's done and the writes are skipped. But the finalizer still has to run, or the session waits forever.",
      { say: "Calling it on every path, guarded by the atomic claim, covers that crash window.", tone: "key" },
    ),
  },
  {
    kind: "trap",
    myth: "So the finalizer is crash-proof.",
    truth: "Not quite. The claim commits first; the stats SQL, the enrich publishes and the file delete run after it, outside that transaction.",
    why: "A crash after the claim leaves a session no one can re-claim. Fix: a FINALIZING state with a sweeper, or make the follow-up idempotent and re-runnable.",
    beats: B(
      "But here's a subtler gap I found reading the code. Is the finalizer crash proof?",
      "Not quite. The claim commits first. The outlier statistics, the enrichment publishes and the file delete run after it, outside that transaction.",
      { say: "If the process dies right after the claim, the claim can never be won again, so nobody publishes the enrichment work. The fix: a finalizing state plus a sweeper that resumes it, or make the follow up idempotent and re-runnable. That's a strong thing to raise yourself.", tone: "key" },
    ),
  },

  // ------------------------------------------------------------ 8
  sec("8", "Bounded memory, measured", "The headline claim of ingest is bounded memory. Here's how JVM memory works, how it was measured, and how the first measurement misled me."),
  {
    kind: "compare",
    title: "Reading a JVM heap",
    cols: [
      { title: "Young generation", icon: "🐣", items: ["new objects: a parsed line, a temp string", "most die young", "minor GC: quick and frequent"] },
      { title: "Old generation", icon: "🏛️", tone: "green", items: ["survivors get promoted", "full GC cleans everything", "slower, stops the app"] },
      { title: "The sawtooth", icon: "📈", tone: "purple", items: ["peak heap used: the top, before a GC", "follows GC timing and -Xmx", "live set: the bottom, after a FULL GC", "what the program really holds"] },
    ],
    footer: "prove bounded memory with the live set, not the peak",
    beats: B(
      "A quick model of the heap, with the serial collector production uses. New objects are created in the young generation. Most die young, a parsed line, a temporary string, and a minor collection clears them quickly and often.",
      "Objects that survive several collections are promoted to the old generation. A full collection cleans the whole heap. It's slower, and it stops the application.",
      { say: "So memory in use looks like a sawtooth. The top of each tooth, peak heap used, depends on when the collector decides to run, and SerialGC lets the heap fill close to its limit first. The bottom, right after a full collection, is the live set: what the program really holds.", term: { word: "Live set", meaning: "heap still in use right after a full GC" } },
      { say: "To prove memory is bounded, use the live set, not the peak.", tone: "key" },
    ),
  },
  {
    kind: "chart",
    title: "Peak heap vs live set, -Xmx256m",
    type: "line",
    labels: ["100 MB", "500 MB", "1 GB", "2 GB"],
    series: [
      { name: "peak heap used (jstat)", values: [186, 228, 227, 204], tone: "red", step: 1 },
      { name: "live set after full GC, max", values: [76, 91, 92, 81], tone: "green", step: 2 },
      { name: "live set, median", values: [69, 75, 76, 70], tone: "blue", step: 3 },
    ],
    max: 256,
    unit: "MB",
    note: { step: 4, text: "input grew 20×; what the program holds stayed at 70-92 MB" },
    beats: B(
      "The setup: the real backend jar, with a hard heap cap of two hundred and fifty six megabytes, so a leak would crash instead of hiding. SerialGC, three part threads, embeddings off, a stub LLM, and seeded files of a hundred megabytes, five hundred, one gigabyte and two gigabytes, each from a clean state.",
      { say: "The first measurement misled me. Peak heap from jstat went from a hundred and eighty six to two hundred and twenty eight megabytes as the input grew. It looked like a leak, and I nearly went hunting for one.", tone: "excite" },
      "It wasn't. It was the top of the sawtooth. Reading the live set from the GC log, the heap left after each full collection, the maximum was seventy six, ninety one, ninety two, and eighty one megabytes.",
      "The median, even flatter: sixty nine to seventy six.",
      { say: "The input grew twenty times. What the program holds stayed between seventy and ninety two megabytes. And the two gigabyte run peaked lower than the one gigabyte run, which proves the peak is just GC timing.", tone: "key" },
    ),
  },
  {
    kind: "numbers",
    title: "The 2 GB run, -Xmx256m",
    items: [
      { value: "977 s", label: "upload to parsed", sub: "15,502,276 lines" },
      { value: "2.05 MB/s", label: "throughput", sub: "15,870 lines/s, CPU-bound" },
      { value: "3.5%", label: "of time in GC", sub: "5,904 pauses, max 196 ms" },
      { value: "562 MB", label: "peak RSS", sub: "flat across sizes: 554-633" },
    ],
    footer: "what grows with the file: time, messages, rows, GC count. Not memory.",
    beats: B(
      "The two gigabyte run, in four numbers. Nine hundred and seventy seven seconds from confirm until every part was parsed. Fifteen and a half million lines.",
      "Two gigabytes over nine hundred and seventy seven seconds is two point oh five megabytes a second, about fifteen thousand nine hundred lines a second.",
      "Garbage collection took three and a half percent of the run. Thousands of pauses, the longest a hundred and ninety six milliseconds, a full collection on a small heap. Fine for a batch pipeline, not for a latency sensitive API.",
      "Process memory, the RSS, stayed between five hundred and fifty and six hundred and thirty megabytes at every size. That's heap plus metaspace, thread stacks and code cache.",
      { say: "So what grows with the file? Time, messages, rows, and the number of collections. Not memory.", tone: "key" },
    ),
  },
  {
    kind: "chart",
    title: "The memory knob is threads, not file size (1 GB, -Xmx1g)",
    type: "bars",
    labels: ["1 thread", "2", "4", "8"],
    series: [{ name: "live set max, MB", values: [56, 81, 111, 163], tone: "green", step: 1 }],
    max: 180,
    unit: "MB",
    note: { step: 2, text: "live set ≈ threads × one part in flight + baseline" },
    beats: B(
      "So what does control memory? Same one gigabyte file, a bigger cap, and one, two, four and eight part threads.",
      "Live set: fifty six, eighty one, a hundred and eleven, a hundred and sixty three megabytes. Each extra thread adds fifteen to twenty five megabytes, its part in flight. A five megabyte slice held as Java strings is ten to fifteen.",
      { say: "So the live set is roughly threads times one part in flight, plus a baseline for Spring, the Kafka clients and the pool. Independent of file size.", tone: "key" },
    ),
  },
  {
    kind: "chart",
    title: "Throughput vs part threads (1 GB, 4 vCPUs)",
    type: "bars",
    labels: ["1 thread", "2", "4", "8"],
    series: [{ name: "ingest MB/s", values: [0.81, 1.35, 2.15, 2.25], tone: "blue", step: 1 }],
    max: 2.5,
    unit: "MB/s",
    note: { step: 2, text: "8 threads on 4 cores: +5% throughput for +47% live memory" },
    beats: B(
      "And throughput on the same runs.",
      "Nought point eight one, one point three five, two point one five, two point two five megabytes a second. Close to linear up to the four cores, then flat.",
      { say: "Eight threads on four cores bought five percent more throughput, for forty seven percent more live memory. So more partitions only help until CPU, then the database, is the bottleneck.", tone: "key" },
    ),
  },
  {
    kind: "sayit",
    q: "Prove that memory is constant.",
    lines: [
      "I ran the real jar with -Xmx256m on seeded files from 100 MB to 2 GB, from a clean state each time.",
      "The live set after full GC stayed between 70 and 92 MB, with no OutOfMemoryError.",
      "I used the live set from GC logs, not peak heap, because the peak follows collector timing.",
      "What grows with the file is time, messages, rows and GC count; GC stayed at 3-3.5% of the run.",
      "The knob is concurrency: about 15-25 MB of live set per part thread.",
    ],
    beats: B(
      { say: "So when someone says, prove that memory is constant, say this.", tone: "ask" },
      "I ran the real jar with a two hundred and fifty six megabyte heap cap, on seeded files from a hundred megabytes to two gigabytes, from a clean state each time.",
      "The live set after full collection stayed between seventy and ninety two megabytes, with no out of memory error.",
      "I used the live set from the GC logs, not peak heap, because the peak follows when the collector runs.",
      "What grows with the file is time, messages, rows and the number of collections, and collection stayed at three to three and a half percent of the run.",
      { say: "And the real knob is concurrency: about fifteen to twenty five megabytes of live set per part thread.", tone: "key" },
    ),
  },
  {
    kind: "drill",
    items: [
      { q: "Is memory constant for any input?", a: "For any file size. Not for any line size: one 100 MB line caused an OOM. Lines are now capped at 1 MB, stored at 64K characters." },
      { q: "Why SerialGC?", a: "Lowest overhead on a small heap with one or two cores; G1's per-region bookkeeping costs memory the free tier doesn't have." },
      { q: "Why do slow work outside the transaction?", a: "A transaction around slow I/O holds a pooled connection the whole time. v1 exhausted its pool that way; prod has 5 connections." },
      { q: "Where does throughput stop scaling, and why?", a: "At the core count: regex parsing is CPU-bound and shares 4 vCPUs with Postgres and Kafka. Plus the splitter is a serial part (Amdahl)." },
    ],
    beats: [
      { say: "Is memory constant for any input?", hold: 1.5 },
      { say: "For any file size. Not for any line size. A single hundred megabyte line with no newline caused an out of memory error, which comes back in part ten. Lines are now capped at one megabyte in the splitter, and sixty four thousand characters when stored." },
      { say: "Why SerialGC?", hold: 1.5 },
      { say: "It has the lowest overhead on a small heap with one or two cores. G1's per region bookkeeping costs memory the free tier doesn't have. A nuance: the benchmarks ran on JDK twenty one, the production image is Temurin seventeen, with the same collector and flags." },
      { say: "Why do the slow work outside the transaction?", hold: 1.5 },
      { say: "A transaction around slow I O holds a pooled connection the whole time. Version one exhausted its pool that way, and production has only five connections." },
      { say: "Where does throughput stop scaling, and why?", hold: 1.5 },
      { say: "At the core count. Regex parsing is CPU bound and shares four virtual CPUs with Postgres and Kafka. And the splitter reads each file once, a serial part that caps how fast one file can finish. Amdahl's law. Several files in parallel don't share that cap." },
    ],
  },
];
