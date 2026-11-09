import type { Scene } from "../../lib/types.ts";
import { B, sec } from "./h.ts";
import { check } from "./k.ts";

// Part 2 (producer side): Kafka in four words, pointer #1 (IngestRequest),
// the splitter's cut rule, pointer #2 (IngestPartRequest), its key, and the
// split options.
export const p2: Scene[] = [
  // ------------------------------------------------------------ 6
  sec("6", "Kafka, and the first pointer", "Topic six. Kafka in four words, and then the first message this system ever produces: the ingest request. We'll open it up field by field."),
  {
    kind: "bullets",
    title: "Kafka in four words",
    items: [
      { icon: "📜", text: "Topic", sub: "a named, append-only log · reading doesn't delete, so you can replay" },
      { icon: "🧩", text: "Partition", sub: "an ordered slice of a topic · the record's key is hashed to pick one" },
      { icon: "🔢", text: "Offset", sub: "a record's position in its partition · committing it means \"done up to here\"" },
      { icon: "👥", text: "Consumer group", sub: "each partition has exactly one owner thread in the group · parallelism = min(partitions, threads)" },
    ],
    beats: B(
      { say: "Kafka in four words. A topic is a named, append only log. Reading a record doesn't delete it, so you can replay a topic from the beginning.", term: { word: "Topic", meaning: "a named, append-only log" } },
      { say: "A topic is split into partitions. Each partition is ordered. When you produce a record with a key, Kafka hashes the key to pick the partition, so the same key always lands in the same partition.", term: { word: "Partition", meaning: "an ordered slice of a topic, chosen by the key's hash" } },
      { say: "Every record in a partition has an offset, its position. When a consumer commits an offset, it's saying: I'm done up to here. After a crash, the next owner starts from the last committed offset.", term: { word: "Offset commit", meaning: "\"done up to here\"" } },
      { say: "And a consumer group shares the work. Each partition has exactly one owner thread in the group. So the parallelism you get is the smaller of the number of partitions and the number of threads.", tone: "key" },
    ),
  },
  {
    kind: "custom",
    name: "dllmsg",
    props: {
      title: "Pointer #1: the IngestRequest, produced by confirm",
      topic: "log.ingest.requests · 6 partitions",
      key: "\"7f3a91c2-…\"   (the sessionId)",
      part: "murmur2(key) % 6 → partition 2",
      intro: "The first record DeepLogLens ever produces. The API's confirm step publishes it right after saving the document row. It carries no log content at all: only where the file is and who it belongs to.",
      fields: [
        { k: "sessionId", v: "\"7f3a91c2-…\"", note: "Which investigation. It names the chunk table the rows will land in, log_chunks_s_7f3a91c2…, and it's also the Kafka key." },
        { k: "userId", v: "\"c41e…\"", note: "Who owns it. Workers carry it along so every row they write can be traced to its owner." },
        { k: "documentId", v: "\"2b9d…\"", note: "Which file. The documents row already exists (status PENDING) before this record is sent." },
        { k: "fileUrl", v: "\"s3://staging/7f3a…/2b9d…\"", note: "Where the bytes are. The splitter will stream the object from here. This is the claim check: the payload stays in the store built for bytes." },
      ],
      foot: "About 200 bytes of JSON stands for a 2 GB file. Key = sessionId, so one session's uploads queue in one partition, in order.",
    },
    beats: B(
      "Here's pointer number one, the ingest request. The confirm step in the API produces it, right after it saves the document row. Look at the envelope first. Topic: log dot ingest dot requests, six partitions. The key is the session ID. And the partition is the murmur two hash of the key, modulo six.",
      "Inside the value, four fields. Session ID: which investigation. It names the chunk table the rows will land in, and it's also the key.",
      "User ID: who owns it, carried along so every row a worker writes can be traced to its owner.",
      "Document ID: which file. The documents row was saved, as pending, before this record was sent.",
      { say: "And file URL: where the bytes are. That's the whole trick. The message is a claim check. The payload stays in the store that's built for bytes, and the queue carries a ticket that says where to find it.", term: { word: "Claim check", meaning: "send a pointer; keep the payload in a store" } },
      { say: "So about two hundred bytes of JSON stands for a two gigabyte file. And because the key is the session ID, one session's uploads queue up in one partition, in order, handled by one splitter at a time.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "Pointer #1: the alternatives",
    cols: [
      { title: "Put the bytes on Kafka", icon: "📦", tone: "red", items: ["1 MB default record limit: 2,000+ records per 2 GB", "the broker stores 2 GB × replication", "every replay re-ships the bytes"] },
      { title: "A jobs table, polled", icon: "🗃", tone: "amber", items: ["what v1 did: poll every 3 s", "lock leases (locked_until) to share work", "no replay, no consumer groups"] },
      { title: "Pointer on Kafka ✓", icon: "🎫", tone: "green", items: ["~200 bytes, replayable", "consumer groups share the work", "bytes stay in blob storage"] },
    ],
    footer: "the argument: the queue carries facts; the store built for bytes carries bytes",
    beats: B(
      "Defend it with two alternatives. One: put the bytes themselves on Kafka. The default record limit is one megabyte, so a two gigabyte file is over two thousand records. The broker now stores the whole file, times the replication factor, and every replay ships the bytes again.",
      "Two: a jobs table in Postgres, polled. That's what version one of this project did. Poll every three seconds, with lock leases so two workers don't take the same job. No replay, and no consumer groups. You end up rebuilding Kafka badly.",
      "A pointer on Kafka. Two hundred bytes, replayable, consumer groups share the work, and the bytes stay where they belong.",
      { say: "Your one liner: the queue carries facts. The store that's built for bytes carries the bytes.", tone: "key" },
    ),
  },
  check({
    topic: "pointer #1",
    q: "The IngestRequest is keyed by sessionId. What does that key decide?",
    options: ["Which blob bucket the file is read from", "The partition: one session's requests always land in the same partition, in order", "The chunk table's primary key", "How many parts the file is split into"],
    answer: 1,
    a: "The partition. murmur2(sessionId) % 6 sends one session's requests to one partition, so they're handled in order by one splitter thread.",
    aSay: "B. The partition. Kafka hashes the session ID, modulo six, so every request for one session lands in the same partition, in order, handled by one splitter thread.",
  }),

  // ------------------------------------------------------------ 7
  sec("7", "The splitter: window-aligned byte ranges", "Topic seven. The splitter. It reads the ingest request, streams the file exactly once, and decides where to cut."),
  {
    kind: "custom",
    name: "llsplit",
    beats: B(
      "Here's a two gigabyte file, about fifteen and a half million lines.",
      "The splitter consumes the ingest request, opens the object as a stream, and reads it exactly once, with a sixty four kilobyte buffer. It counts bytes exactly at every newline, so every offset it remembers is a true byte position in the file. It holds one line and a few counters. Nothing else.",
      { say: "A line is a record start if it begins with a timestamp, ISO eight six oh one or syslog. Stack trace lines, the ones starting with at, have no timestamp, so they're never record starts.", term: { word: "Record start", meaning: "a line that begins with a timestamp" } },
      { say: "The cut rule. At least five megabytes since the last cut, and this line starts a new minute, and it has a timestamp. Then the part ends exactly at this line's first byte. So a minute, and a stack trace, always stay whole. That's what window aligned means.", tone: "key" },
      "Five megabytes is the target size.",
      "Twenty megabytes, four times the target, is a hard cap, still only on a record start, so one runaway minute can't produce a giant part. A file with no timestamps at all is cut every five thousand lines.",
      "Each part becomes a tiny Kafka message: byte start, byte end, and the line number of its first line. We'll open that message in a moment.",
      { say: "And one ordering detail that matters: the total number of parts is saved on the document row before the first part is sent. You'll see why in topic fifteen.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "IngestSplitter: the cut",
    lang: "java",
    code: `boolean recordStart = (ts != null) || !anyTimestamp;
boolean windowBoundary = bucket != null && prevBucket != null
                         && !bucket.equals(prevBucket);
if (linesSinceCut > 0 && recordStart) {
    boolean cut =
        (anyTimestamp && windowBoundary && bytesSinceCut >= partTargetBytes)
     || (!anyTimestamp && linesSinceCut >= fallbackLinesPerPart)
     || (bytesSinceCut >= partTargetBytes * 4L);
    if (cut) emit(partStart, offset, firstLine);   // [partStart, offset)
}
offset += lineBytes;                                // exact, at each '\\n'`,
    highlight: [[1, 1], [2, 3], [6, 6], [8, 8], [9, 9], [11, 11]],
    beats: B(
      "Here it is in code. A record start is a line with a timestamp.",
      "A window boundary is a line whose minute bucket differs from the previous line's.",
      "The main rule: timestamps exist, we're on a minute boundary, and at least the target size has passed.",
      "The safety valve: four times the target, twenty megabytes, cuts anyway, but still only on a record start.",
      { say: "Emit records a half open range: from the part's start, up to but not including this offset. Half open, so neighbouring parts touch exactly, with no gap and no overlap.", term: { word: "Half-open range", meaning: "[start, end): neighbours touch, never overlap" } },
      "And the offset advances by the exact byte length of each line, newline included. That's why every cut is a true byte position.",
    ),
  },
  check({
    topic: "the cut rule",
    q: "Why does the splitter only cut on a line that has a timestamp?",
    options: ["Timestamps are always at 5 MB boundaries", "So a stack trace (lines with no timestamp) and a minute are never split across two parts", "Because ranged GETs need a timestamp", "To keep parts exactly 5 MB"],
    answer: 1,
    a: "Stack-trace lines carry no timestamp, so they're never cut points. A part therefore always starts on a new record in a new minute: windows and stack traces stay whole.",
    aSay: "B. Stack trace lines have no timestamp, so they're never cut points. Every part starts on a new record, in a new minute, so windows and stack traces always stay whole.",
  }),

  // ------------------------------------------------------------ 8
  sec("8", "Pointer #2: the part message", "Topic eight. The second pointer. One message per part, and every field in it has a job. Then the key, and why it's not just the document ID."),
  {
    kind: "custom",
    name: "dllmsg",
    props: {
      title: "Pointer #2: one IngestPartRequest per part",
      topic: "log.ingest.parts · 6 partitions",
      key: "\"2b9d…:3\"   (documentId:partIdx)",
      part: "murmur2(key) % 6 → partition 4",
      intro: "The splitter produces one of these for every part: 205 of them for the 1 GB demo file. Each one is a complete work order. A consumer can process it without asking anyone anything.",
      fields: [
        { k: "sessionId", v: "\"7f3a…\"", note: "Names the chunk table to write: log_chunks_s_7f3a…. Validated as a UUID before it's ever spliced into SQL." },
        { k: "userId", v: "\"c41e…\"", note: "Carried through, so the worker's writes stay attributable to the owner." },
        { k: "documentId", v: "\"2b9d…\"", note: "Which file. With partIdx it forms the part's natural key: (document_id, part_idx)." },
        { k: "fileUrl", v: "\"s3://staging/7f3a…/2b9d…\"", note: "Where to send the ranged GET. Still a pointer: the worker fetches only its own slice." },
        { k: "partIdx", v: "3", note: "This part's position, from 0. Part of the Kafka key and of the part marker." },
        { k: "totalParts", v: "205", note: "The completion target. Saved on the documents row before part 0 is sent, so \"done\" can't be declared early." },
        { k: "byteStart", v: "15728922", note: "First byte, inclusive. Always the first byte of a timestamped line in a new minute." },
        { k: "byteEndExclusive", v: "21004117", note: "End, exclusive: half-open, so part 4 starts at exactly this byte. The ranged GET asks for bytes=15728922-21004116." },
        { k: "firstLineNumber", v: "121408", note: "The global line number of the slice's first line. A worker reading the middle of the file can't count the lines before it, so the splitter tells it. Citations use the original line numbers." },
      ],
      foot: "About 300 bytes of JSON per 5 MB of log. Everything a worker needs, and not one byte of the log itself.",
    },
    beats: B(
      "Pointer number two. The splitter produces one of these per part, two hundred and five of them for the one gigabyte demo file. Topic: log dot ingest dot parts, six partitions. And look at the key: document ID, colon, part index. Hold that thought.",
      "Session ID. It names the chunk table the worker will write. And it's validated as a real U U I D before it's ever spliced into SQL.",
      "User ID, carried through, so the writes stay attributable.",
      "Document ID: which file. Together with the part index, it forms the part's natural key.",
      "File URL: where to send the ranged GET. Still a pointer. The worker fetches only its own slice.",
      "Part index, three. Its position, counting from zero. It's in the Kafka key, and in the part marker table.",
      "Total parts, two hundred and five. The completion target, saved on the documents row before part zero is sent, so nobody can declare the file done too early.",
      "Byte start, inclusive. Always the first byte of a timestamped line, in a new minute.",
      { say: "Byte end, exclusive. Half open, so the next part starts at exactly this byte. The ranged GET asks for bytes from start to end minus one.", term: { word: "Ranged GET", meaning: "HTTP Range: bytes=a-b, read only a slice" } },
      { say: "And first line number. A worker reading from the middle of the file can't know how many lines came before it. So the splitter, which counted them, tells it. That's how citations come out in the original file's line numbers.", tone: "key" },
      { say: "About three hundred bytes of JSON, describing five megabytes of log. Everything a worker needs to do its job without asking anyone, and not one byte of the log itself.", tone: "key" },
    ),
  },
  {
    kind: "custom",
    name: "dllbytes",
    props: {
      title: "From one file to six partitions to three threads",
      file: "app.log · 1 GB · the first 6 of its 205 parts",
      size: "≈ 31.5 MB (of 1,073,744,655)",
      cuts: [0, 0.16, 0.33, 0.49, 0.66, 0.83, 1],
      labels: ["0 – 5.2 MB", "5.2 – 10.4 MB", "10.4 – 15.7 MB", "15.7 – 21.0 MB", "21.0 – 26.2 MB", "26.2 – 31.5 MB"],
      map: [4, 1, 5, 0, 2, 3],
      lanes: 6,
      threads: 3,
      foot: "parallelism = min(partitions, consumer threads) · ordering isn't needed: completion is a counter",
    },
    beats: B(
      "Let's watch it happen. One object in blob storage, read once, never copied. We'll zoom into its first thirty megabytes or so: the first six of its two hundred and five parts.",
      "Each grey line is a byte offset where a new minute starts. These are the only places a cut is allowed.",
      "The splitter cuts at the first minute boundary after five megabytes, again and again. Part zero, part one, part two. Each one is just a pair of numbers, a byte start and a byte end.",
      { say: "Each part becomes a pointer, and the key, document ID colon part index, is hashed to pick a partition. Because the part index is in the key, one file's parts spread across all six partitions.", tone: "key" },
      "Three consumer threads in the group, each owning two partitions. All three work on the same file at the same time, each reading only its own byte ranges.",
      "Parallelism is the smaller of partitions and threads. And notice we don't need ordering. Parts can finish in any order, because completion is a counter, as you'll see.",
    ),
  },
  {
    kind: "compare",
    title: "Choosing the part's key",
    cols: [
      { title: "key = documentId", icon: "1️⃣", tone: "red", items: ["every part of a file hashes to one partition", "one partition = one owner thread", "a 2 GB file gets zero parallelism"] },
      { title: "no key (null)", icon: "🎲", tone: "amber", items: ["the producer spreads records itself", "placement isn't deterministic", "a replay can land parts elsewhere: harder to debug"] },
      { title: "documentId:partIdx ✓", icon: "🔑", tone: "green", items: ["one file spreads over all partitions", "the same part always lands in the same place", "stable across replays and retries"] },
    ],
    footer: "the argument: spread one file across every partition, deterministically",
    beats: B(
      "Defend the key. Alternative one: key by document ID alone. Then every part of a file hashes to the same partition, which has exactly one owner thread. A two gigabyte file gets no parallelism at all.",
      "Alternative two: no key. The producer spreads records itself, but placement isn't deterministic, so a replayed part can land somewhere else, and reasoning about where a part lives gets harder.",
      "Document ID colon part index. One file spreads over every partition, and the same part always lands in the same place, across retries and replays.",
      { say: "Your line: spread one file across every partition, deterministically. And if they ask about ordering: completion doesn't depend on it.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "Three ways to split a big file",
    cols: [
      { title: "One message per file", icon: "📄", tone: "red", items: ["one consumer reads all of it", "memory grows with the file", "one thread does all the work"] },
      { title: "Physical part files", icon: "🗂", tone: "amber", items: ["write the file a second time, in pieces", "N extra objects to clean up", "double the storage I/O"] },
      { title: "Virtual parts ✓", icon: "📐", tone: "green", items: ["byte ranges, never copied", "ranged GETs read the slices", "Hadoop and Spark call them input splits"] },
    ],
    footer: "the argument: describe the slice, don't copy it",
    beats: B(
      "And defend the split itself. One message per file was the first version. One consumer read the whole thing, kept every window in memory, and did all the work on one thread.",
      "Physical part files: write the file again, in pieces. That doubles the storage I O, and leaves N objects to clean up.",
      { say: "Virtual parts: byte ranges that are never copied, read with ranged GETs. Hadoop and Spark call the same idea input splits, and DeepLogLens adds one rule: never cut inside a record, or inside a minute.", term: { word: "Input split", meaning: "a byte range of a file, processed on its own" } },
      { say: "Your line: describe the slice, don't copy it.", tone: "key" },
    ),
  },
  check({
    topic: "pointer #2",
    q: "Why does the part message carry firstLineNumber?",
    options: ["To verify the ranged GET", "A worker reading the middle of the file can't count earlier lines; it needs the global number so citations use original line numbers", "It's the Kafka offset", "To pick the partition"],
    answer: 1,
    a: "Only the splitter saw every earlier line. It passes the global number of the slice's first line, so chunk line ranges, and citations, use the original file's line numbers.",
    aSay: "B. Only the splitter saw the lines before the slice. It passes the global number of the first line, so every chunk's line range, and every citation, uses the original file's line numbers.",
  }),
  check({
    topic: "the key",
    q: "If the parts topic were keyed by documentId alone, what would go wrong?",
    a: "Every part of a file would hash to the same partition, which has one owner thread: the file would be processed serially, with no parallelism.",
    aSay: "Every part of one file would hash to the same partition, and a partition has exactly one owner thread in the group. So the whole file would be processed on one thread. No parallelism at all.",
  }),
];
