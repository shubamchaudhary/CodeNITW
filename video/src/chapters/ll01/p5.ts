import type { Scene } from "../../lib/types.ts";
import { B, arch, sec } from "./h.ts";
import { check } from "./k.ts";
import { LANES } from "./diagrams.ts";

// Part 5: the finalizer (who declares a file done), when embeddings and
// enrichment start, pointer #3 (EnrichRequest), and the rate-limited lanes.
export const p5: Scene[] = [
  // ------------------------------------------------------------ 15
  sec("15", "The finalizer, and when embeddings start", "Topic fifteen. Two hundred and five parts finish in any order, on different threads. Who notices that the last one is done? And what happens next is the answer to: when are embeddings created?"),
  {
    kind: "code",
    title: "The atomic finalize claim: no coordinator",
    lang: "sql",
    code: `-- every part calls tryFinalize() after its transaction
-- (and on the fast path too)
UPDATE documents
SET    processing_status = 'COMPLETED'
WHERE  id = :documentId
  AND  total_parts > 0
  AND  parsed_parts >= total_parts
  AND  processing_status = 'PROCESSING';
-- rows updated: 1 for exactly one caller, 0 for everyone else`,
    highlight: [[1, 2], [3, 5], [6, 7], [8, 8], [9, 9]],
    beats: B(
      "Every part, after its transaction commits, calls try finalize. And so does the fast path, for a reason you'll see in a second.",
      "Try finalize is one conditional update on the documents row.",
      "It only matches if the target is set, and parsed parts has reached total parts. That's why total parts had to be saved before part zero went out. The target exists before anyone can reach it.",
      "And only if the status is still processing.",
      { say: "Postgres locks the row for the update. So exactly one caller gets one row back, and every other caller gets zero. No coordinator, no lock service, no leader election. A conditional update is the lock.", tone: "key" },
    ),
  },
  {
    kind: "big",
    tone: "idea",
    lead: "Why the fast path calls it too",
    text: "The last part commits, then the JVM dies before tryFinalize.",
    after: "its redelivery skips the writes, but still has to finalize, so every path calls tryFinalize",
    beats: B(
      "Why does even the skip path call try finalize?",
      "Picture the last part. It commits, and then the JVM dies, before it calls try finalize.",
      { say: "On redelivery, the fast path skips the writes. If it also skipped try finalize, nobody would ever finalize that file. So every path calls it, and the conditional update makes the extra calls harmless.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "What the winner does, in order",
    firstItemStep: 1,
    items: [
      { icon: "📊", text: "1. Run the session-wide gate rules in one SQL statement", sub: "median, MAD, latency and rare-signature flags: UPDATE chunks SET is_anomalous" },
      { icon: "🧮", text: "2. Count the work and move to ENRICHING", sub: "one item per flagged window + one per 80 chunks · target set before anything is sent" },
      { icon: "📨", text: "3. Publish the enrichment work items", sub: "ENRICH_WINDOW for flagged chunks · EMBED_BATCH for ALL chunks" },
      { icon: "🗑", text: "4. Delete the staged file", sub: "the chunks in Postgres are the durable copy now" },
    ],
    beats: B(
      "The one caller that wins does four things, in order.",
      "First, the session wide gate rules from topic fourteen, as one SQL statement. Now the anomaly flags are final.",
      "Second, count the work items, save that as the completion target, and move the session to enriching. Target first, again, before anything is sent.",
      { say: "Third, publish the work. One enrich window item for every flagged chunk, and embed batch items covering every chunk, eighty at a time.", tone: "key" },
      "Fourth, delete the staged file from blob storage. The chunks in Postgres are the durable copy now.",
    ),
  },
  {
    kind: "big",
    tone: "idea",
    lead: "When are embeddings created?",
    text: "After the finalizer's claim: once every part has committed, on their own rate-limited lane.",
    after: "never inside the ingest transaction, never at query time",
    beats: B(
      "So now you can answer the question directly. When are embeddings created?",
      { say: "After the finalizer's claim. Once every part of the document has committed, on their own rate limited Kafka lane.", tone: "key" },
      { say: "Never inside the ingest transaction, and never at query time. Every chunk already has its row, with the embedding column NULL, waiting.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "Why embed then, and not earlier",
    items: [
      { icon: "🐢", text: "Network calls never sit inside the ingest transaction", sub: "a slow provider would hold a pool connection, and slow the whole ingest" },
      { icon: "🚦", text: "The provider is rate-limited", sub: "100 requests a minute per Gemini key: it needs its own paced lane" },
      { icon: "🏁", text: "Flags are only final after the finalizer", sub: "enrichment needs the final flags; embeddings ride the same lane and the same completion counter" },
      { icon: "📈", text: "Ingest speed stays independent of LLM quota", sub: "parsing runs at CPU speed; the lane drains at quota speed" },
    ],
    beats: B(
      "Four reasons to embed then, and not earlier. One: a network call never sits inside the ingest transaction. A slow provider would hold a pool connection and slow everything.",
      "Two: the provider is rate limited. A hundred requests a minute per Gemini key. It needs its own paced lane.",
      "Three: the anomaly flags are only final after the finalizer. Enrichment has to wait for them anyway, and embeddings ride the same lane and the same completion counter.",
      { say: "Four: ingest speed stays independent of the LLM quota. Parsing runs at CPU speed, and the lane drains at quota speed. Neither waits for the other.", tone: "key" },
    ),
  },
  {
    kind: "custom",
    name: "dllmsg",
    props: {
      title: "Pointer #3: one EnrichRequest per unit of LLM work",
      topic: "llm.enrich.requests · 1 partition per API key",
      key: "\"7f3a…\"   (sessionId)",
      part: "chosen explicitly: floorMod(hash(workId), keySlots)",
      intro: "The finalizer publishes these. For the 1 GB run: 571 ENRICH_WINDOW items (one per flagged chunk) and 38 EMBED_BATCH items (3,019 chunks ÷ 80). Still pointers: chunk ids, never chunk text.",
      fields: [
        { k: "workId", v: "\"e7a0…\"", note: "This item's identity, stable across redeliveries and retries. It's the idempotency key of the enrichment lane, and its hash picks the partition, so a retried item returns to the same lane." },
        { k: "sessionId", v: "\"7f3a…\"", note: "Which session's chunk table to read from and write to." },
        { k: "kind", v: "\"EMBED_BATCH\"", note: "ENRICH_WINDOW: explain one flagged window. EMBED_BATCH: embed up to 80 chunks. Both share the lanes, so one rate limit governs both." },
        { k: "chunkIds", v: "[\"9f2c41d7…e41a\", …]", note: "The content fingerprints of the chunks to work on: one for ENRICH_WINDOW, up to 80 for EMBED_BATCH. The worker reads the text from Postgres." },
        { k: "attempt", v: "0", note: "Delivery attempt. A 429 re-publishes with attempt + 1; rate-limited work is retried for about a day (1,440 attempts) before the DLQ." },
        { k: "notBeforeEpochMs", v: "0", note: "Earliest time the retry lane may release it: now + 60 s after a 429. Zero on the first attempt." },
      ],
      foot: "Six fields. Every LLM and embedding call in the system starts from one of these, and the workId is how a redelivery is recognised.",
    },
    beats: B(
      "And here's pointer number three, the enrich request. The topic is llm dot enrich dot requests, with one partition per API key. And this time the producer picks the partition itself: the hash of the work ID, modulo the number of key slots. For the one gigabyte run, five hundred and seventy one enrich window items and thirty eight embed batch items.",
      { say: "Work ID. This item's identity, stable across redeliveries and retries. It's the idempotency key for this whole lane. And its hash picks the partition, so a retried item always comes back to the same lane.", tone: "key" },
      "Session ID: which session's chunk table to read and write.",
      "Kind. Enrich window means: explain one flagged window. Embed batch means: embed up to eighty chunks. Both share the same lanes, so one rate limit governs both.",
      { say: "Chunk IDs. The content fingerprints of the chunks to work on. One for an enrich window, up to eighty for a batch. Still pointers: the worker reads the text from Postgres.", tone: "key" },
      "Attempt. A four two nine re publishes the item with attempt plus one. Rate limited work is retried for about a day, one thousand four hundred and forty attempts, before it's dead lettered.",
      "And not before: the earliest time the retry lane may release it. Now plus sixty seconds, after a four two nine.",
      "Six fields. Every LLM and embedding call in the system starts from one of these, and the work ID is how a redelivery gets recognised.",
    ),
  },
  {
    kind: "compare",
    title: "Who declares the file done?",
    cols: [
      { title: "A coordinator service", icon: "🧭", tone: "red", items: ["counts part completions", "another service to deploy and keep alive", "its own crash recovery"] },
      { title: "A \"last part\" message", icon: "🏁", tone: "amber", items: ["parts finish out of order", "\"last sent\" isn't \"last finished\"", "still needs a count"] },
      { title: "Conditional UPDATE ✓", icon: "🔐", tone: "green", items: ["parsed_parts >= total_parts", "the row lock picks one winner", "every path may call it"] },
    ],
    footer: "the argument: the database you already trust is the coordinator",
    beats: B(
      "Defend the finalizer. A coordinator service could count completions, but that's another service to deploy, keep alive, and recover after its own crashes.",
      "A last part message doesn't work, because parts finish out of order. The last one sent isn't the last one finished.",
      "A conditional update. Parsed parts reached total parts, and the row lock picks exactly one winner, no matter how many callers there are.",
      { say: "Your line: the database I already trust is the coordinator.", tone: "key" },
    ),
  },
  check({
    topic: "the finalizer",
    q: "When exactly are a chunk's embeddings created?",
    options: ["Inside the part's ingest transaction", "When the first question is asked", "After the finalizer's claim, by EMBED_BATCH items on the enrichment lane", "By a nightly batch job"],
    answer: 2,
    a: "After every part has committed and one caller wins the finalize claim: it publishes EMBED_BATCH items, and the enrichment lane writes the vectors into the NULL embedding column.",
    aSay: "C. After every part has committed and one caller wins the finalize claim. The winner publishes embed batch items, and the enrichment lane fills in the embedding column, which was NULL until then.",
  }),
  check({
    topic: "the finalizer",
    q: "Why must total_parts be saved before part 0 is sent?",
    a: "So the target exists before any part can finish: the claim compares parsed_parts with total_parts, and a missing or late target could let a file be declared done early (or never).",
    aSay: "So the target exists before any part can finish. The claim compares parsed parts with total parts. If the target were written late, a fast part could see the wrong target, and the file could be declared done too early, or never.",
  }),

  // ------------------------------------------------------------ 16
  sec("16", "Lanes: one partition per API key", "Topic sixteen. How the work items are paced under free tier rate limits, using nothing but Kafka's own assignment rule."),
  {
    kind: "bullets",
    title: "The problem: many threads, strict per-key limits",
    items: [
      { icon: "🔑", text: "Several free API keys", sub: "each: 30 requests and 6,000 tokens per minute (Groq)" },
      { icon: "🧵", text: "Many worker threads, maybe several instances", sub: "a shared limiter needs a lock, or a coordinator such as Redis" },
      { icon: "💡", text: "Kafka already gives each partition exactly one owner", sub: "pair partition p with key p, and each key has a single owner: its limiter needs no lock" },
    ],
    beats: B(
      "The problem. Several free API keys, each limited to thirty requests and six thousand tokens per minute.",
      "And many worker threads, maybe on several instances. A shared rate limiter across all of them needs a lock, or a coordinator like Redis.",
      { say: "But Kafka already gives every partition exactly one owner in the group. So pair partition p with API key p. Now each key has a single owner thread, and a limiter with a single owner needs no lock at all.", tone: "key" },
    ),
  },
  arch(
    LANES,
    [
      { all: true },
      { t: "Work goes into lanes", b: "The finalizer publishes each item to the partition it picks itself.", m: "floorMod(hash(workId), keySlots)", nodes: ["fin", "p0", "p1", "p2", "p3"], edges: ["fp0", "fp1", "fp2", "fp3"] },
      { t: "One owner per key", b: "Lane thread i owns partition i, and with it key i. With fewer keys than partitions, lanes share: partition % slots.", m: "a single owner, even across instances", nodes: ["p0", "p1", "p2", "p3", "t0", "t1", "t2", "t3"], edges: ["pt0", "pt1", "pt2", "pt3"] },
      { t: "Each lane paces itself", b: "One call per 60,000 / (30 × 0.8) ms, plus a sliding 60 s token budget of 6,000 × 0.8.", m: "2,500 ms · 4,800 tokens per minute", nodes: ["t0", "t1", "t2", "t3", "groq"], edges: ["tg0", "tg1", "tg2", "tg3"] },
      { t: "Commit", b: "Results commit in one transaction with the work marker.", m: "insert-if-absent on workId", nodes: ["t2", "pg"], edges: ["tpg"] },
      { t: "429: never sleep a lane", b: "The item goes to retry.60s with notBefore = now + 60 s. One retry thread waits, then re-publishes it.", m: "up to 1,440 attempts ≈ 24 h", nodes: ["t3", "retry", "rthread", "p3"], edges: ["t429", "rr", "rp"] },
      { t: "Anything else", b: "Non-retryable errors go to the DLQ and still count as done, so a session always finishes.", m: "one bad item can't block a session", nodes: ["t3", "dlq"], edges: ["tdlq"] },
    ],
    B(
      "Here are the lanes.",
      "The finalizer publishes each item to the partition it picks itself, by hashing the work ID modulo the number of key slots.",
      "Lane thread i owns partition i, and with it, key i. If you later have fewer keys than partitions, lanes share, partition modulo slots. And because Kafka gives each partition to one consumer in the group, a key still has a single owner even with several instances.",
      { say: "Each lane paces itself, with no shared state. One call every sixty thousand divided by thirty times nought point eight milliseconds: two and a half seconds. Plus a sliding sixty second token budget of four thousand eight hundred tokens. The nought point eight leaves twenty percent headroom.", tone: "key" },
      "Results commit in one transaction, with the work marker. We'll open that transaction in topic eighteen.",
      { say: "A four two nine never puts a lane to sleep. The item goes to a sixty second retry topic with a not before time, and one retry thread waits and re publishes it. Nothing is dropped.", tone: "key" },
      "Anything non retryable goes to the dead letter topic, and still counts as done, so one bad item can never block a session from finishing.",
    ),
    "The enrichment lanes",
  ),
  {
    kind: "numbers",
    title: "Napkin: which limit binds?",
    items: [
      { value: "24", label: "calls/min by requests", sub: "60,000 ms ÷ 2,500 ms", tone: "blue" },
      { value: "~1,600", label: "tokens per call", sub: "5,000 chars ≈ 1,250 + prompt, metrics, output", tone: "amber" },
      { value: "~3", label: "calls/min by tokens", sub: "4,800 ÷ 1,600: the token budget binds", tone: "red" },
    ],
    footer: "always compute both limits: for big windows, tokens bind 8× harder than requests",
    beats: B(
      "A napkin check you should be able to do on a whiteboard. By requests: sixty thousand milliseconds divided by two thousand five hundred is twenty four calls a minute per key.",
      "But a full window segment is five thousand characters, about twelve hundred and fifty tokens, plus the prompt, the metrics and the output: about sixteen hundred tokens per call.",
      "Four thousand eight hundred divided by sixteen hundred: about three calls a minute.",
      { say: "So for big windows, the token budget binds, eight times harder than the request budget. Always compute both.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "Rate limiting across threads: the alternatives",
    cols: [
      { title: "A shared limiter with a lock", icon: "🔒", tone: "amber", items: ["one token bucket, every thread", "works in one JVM", "breaks across instances"] },
      { title: "A Redis token bucket", icon: "🧰", tone: "amber", items: ["works across instances", "a network call before every LLM call", "another system that can fail"] },
      { title: "Partition per key ✓", icon: "🛣", tone: "green", items: ["Kafka's assignment = a single owner per key", "no lock, no extra system", "trade-off: partitions can't shrink; no borrowing between keys"] },
    ],
    footer: "the argument: reuse Kafka's ownership rule instead of building a distributed lock",
    beats: B(
      "Defend it. A shared limiter with a lock works inside one JVM, but breaks as soon as you run a second instance.",
      "A Redis token bucket works across instances, at the cost of a network call before every LLM call, and one more system that can fail.",
      { say: "Partition per key reuses Kafka's ownership rule. No lock, no extra system. And name the trade off yourself: Kafka can't shrink partitions, so fewer keys later means lanes share, and a busy key can't borrow an idle key's capacity.", tone: "key" },
      { say: "Your line: I reused Kafka's ownership rule instead of building a distributed lock.", tone: "key" },
    ),
  },
  check({
    topic: "lanes",
    q: "Why does a lane's rate limiter need no lock?",
    options: ["Groq enforces the limit for us", "Kafka gives each partition one owner thread, and partition p is paired with key p, so each key's limiter has a single owner", "The limiter uses atomic integers", "Calls are made one per second globally"],
    answer: 1,
    a: "A consumer group gives each partition exactly one owner. With partition p paired with key p, every key's limiter is touched by one thread only: no shared state, no lock.",
    aSay: "B. A consumer group gives each partition exactly one owner thread. Pair partition p with key p, and every key's limiter is only ever touched by one thread. No shared state, so no lock.",
  }),
  check({
    topic: "lanes",
    q: "A call returns 429. Why not just sleep the lane for 60 seconds?",
    a: "The lane would stall its whole partition, and long blocking risks max.poll.interval and a rebalance. Instead the item goes to retry.60s with notBefore, and only the retry thread waits.",
    aSay: "Sleeping would stall the whole partition behind one item, and long blocking risks blowing the poll interval and triggering a rebalance. Instead, the item goes to the sixty second retry topic with a not before time, and only the retry thread waits.",
  }),
];
