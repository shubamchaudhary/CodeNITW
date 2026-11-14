import type { Scene } from "../../lib/types.ts";
import { A, RETRY, type Board } from "./boards.ts";
import { B, L, cells, check, sec } from "./h.ts";

// What Spring builds around one @KafkaListener.
const SPRING: Board = {
  view: [1500, 700],
  groups: [{ x: 420, y: 20, w: 1060, h: 660, t: "your Spring Boot app", nodes: ["props", "cf", "cont", "m"] }],
  nodes: [
    { id: "k", x: 20, y: 290, w: 300, t: "Kafka", s: "order-events · 4 partitions" },
    { id: "props", x: 470, y: 80, w: 420, t: "application.properties", s: "you provide" },
    { id: "cf", x: 1000, y: 80, w: 430, t: "ConsumerFactory", s: "builds KafkaConsumers" },
    { id: "cont", x: 470, y: 290, w: 420, h: 130, t: "Listener container", s: "1 KafkaConsumer + 1 thread\npoll · commit · close", tone: "teal" },
    { id: "m", x: 1000, y: 300, w: 430, t: "@KafkaListener method", s: "you provide" },
    { id: "reg", x: 470, y: 540, w: 420, t: "Endpoint registry", s: "stop · start · pause" },
  ],
  edges: [
    { id: "p-c", from: "props", to: "cf" },
    { id: "c-k", from: "cf", to: "cont", fs: "b", ts: "r", fo: 0, via: [[1215, 230], [960, 230], [960, 340]] },
    { id: "poll", from: "cont", to: "k", fs: "l", ts: "r", l: "poll · commit", lx: 395, ly: 340 },
    { id: "call", from: "cont", to: "m", fs: "r", ts: "l", tof: 13, l: "per record", lx: 945, ly: 392 },
    { id: "reg", from: "reg", to: "cont", fs: "t", ts: "b" },
  ],
};

// Part G and H: Spring Boot producer and consumer, AckMode, assignment and
// scaling; poison pills, blocking and non-blocking retries, the DLT, lag.
export const p5: Scene[] = [
  // ------------------------------------------------------------ 20
  sec("20", "Spring Boot: the producer", "Topic twenty. Spring Boot. First the producer side, which is mostly configuration."),
  {
    kind: "code",
    title: "Producer: topic, properties, send",
    lang: "java",
    code: `@Bean NewTopic orderEvents() {        // KafkaAdmin creates it at startup
  return TopicBuilder.name("order-events").partitions(3).replicas(3)
      .config(TopicConfig.MIN_IN_SYNC_REPLICAS_CONFIG, "2").build();
}

spring.kafka.bootstrap-servers=localhost:9092,localhost:9192
spring.kafka.producer.acks=all
spring.kafka.producer.properties.enable.idempotence=true
spring.kafka.producer.properties.linger.ms=20

kafkaTemplate.send("order-events", order.getOrderId(), order)
    .whenComplete((res, ex) -> {       // runs on the sender thread
        if (ex != null) log.error("send failed", ex);
    });                                // controller answers 202 Accepted`,
    highlight: [[1, 4], [6, 9], [11, 14]],
    beats: B(
      "A new topic bean. At startup, Kafka admin creates the topic if it doesn't exist: three partitions, three replicas, min insync two. Anything not set uses the cluster defaults.",
      "Properties. More than one bootstrap server, so if one broker is down, the producer bootstraps from another. They're only the first contact: the producer fetches full metadata from one of them and then talks to each partition's leader directly. Acks all, idempotence explicitly on, a little linger for batching.",
      { say: "Sending is asynchronous: kafka template dot send returns a completable future, and the HTTP request returns before Kafka confirms. That's why the controller answers two oh two accepted. The callback runs on the sender thread, so keep it light. Calling get makes it synchronous: simple, but one round trip per record and no batching benefit. And for a second serializer in the same app, build a second kafka template from the same properties with one setting overridden. Each template has its own producer, buffer and sender thread.", tone: "key" },
    ),
  },

  // ------------------------------------------------------------ 21
  sec("21", "Spring Boot: the consumer", "Topic twenty one. The consumer side, where Spring writes the poll loop for you, and where most production bugs hide."),
  A(
    SPRING,
    "What Spring builds for you",
    [{ all: true }, { say: "Without Spring, a consumer is a loop you write yourself: properties, new Kafka consumer, subscribe, while true poll, commit, and close in finally. Spring Kafka writes all of that for you. You provide only two things: properties, and the business method.", tone: "key" }],
    [
      { t: "ConsumerFactory", b: "Reads spring.kafka.consumer.* and creates KafkaConsumer objects.", nodes: ["props", "cf"], moves: [{ e: "p-c", t: "group-id, deserializers" }] },
      "The consumer factory reads spring dot kafka dot consumer properties and creates Kafka consumer objects.",
    ],
    [
      { t: "Listener container", b: "Owns one KafkaConsumer and one thread. Runs the poll loop, calls your method once per record, commits, closes on shutdown.", m: "concurrency n = n children", nodes: ["cont", "k", "m"], moves: [{ e: "poll", t: "poll", tone: "teal" }, { e: "poll", t: "records", rev: true, delay: 40 }, { e: "call", t: "order-15", delay: 70 }] },
      { say: "The listener container owns one Kafka consumer and one thread. It runs the poll loop, calls your method once per record, commits offsets, and closes the consumer on shutdown. Each at Kafka listener gets a concurrent container that creates concurrency children, default one, and each child is one consumer plus one thread, named like orders dash zero dash C dash one.", tone: "key", term: { word: "listener container", meaning: "Spring's poll loop: 1 KafkaConsumer + 1 thread" } },
    ],
    [
      { t: "Registry, and a gotcha", b: "Containers live in KafkaListenerEndpointRegistry. @KafkaListener(id = \"orders\") makes 'orders' the group.id.", m: "set groupId explicitly", nodes: ["reg", "cont"], edges: ["reg"] },
      "The containers aren't beans you inject. They live in the endpoint registry, which you use to stop, start or pause a listener. And a gotcha: give the listener an id, and Spring uses that id as the group id, ignoring your group id property. Set group id on the annotation explicitly.",
    ],
  ),
  {
    kind: "code",
    title: "Consumer properties that avoid two real bugs",
    lang: "properties",
    code: `spring.kafka.consumer.group-id=order-consumer-group
spring.kafka.consumer.auto-offset-reset=earliest   # default latest

spring.kafka.consumer.value-deserializer=\\
  org.springframework.kafka.support.serializer.ErrorHandlingDeserializer
spring.kafka.consumer.properties.spring.deserializer.value.delegate.class=\\
  org.springframework.kafka.support.serializer.JsonDeserializer
spring.kafka.consumer.properties.spring.json.use.type.headers=false
spring.kafka.consumer.properties.spring.json.value.default.type=com.eda.consumer.model.Order`,
    highlight: [[1, 2], [4, 9]],
    beats: B(
      { say: "Two properties that each prevent a real bug. Auto offset reset. With the default, latest, a brand new group starts at the end. Orders one to nine were produced, then a new group started, and it received nothing from them. Only orders produced after it joined arrived. For a new service that must see existing data, use earliest.", tone: "key" },
      "And the deserializer: wrap the JSON deserializer in an error handling deserializer, and turn off type headers. Why that matters is the poison pill story, coming up in topic twenty four.",
    ),
  },
  {
    kind: "bullets",
    title: "Inside poll(), with Spring",
    firstItemStep: 1,
    items: [
      { text: "First poll: coordinator, JoinGroup, SyncGroup, committed offsets", sub: "every later poll just fetches", icon: "1️⃣" },
      { text: "Coordinator crash: rediscover, keep consuming, no rejoin", sub: "the group loads from __consumer_offsets", icon: "🧭" },
      { text: "One fetch per leader broker, in parallel; poll() returns <= 500", sub: "fetch limits are bytes; max.poll.records is records", icon: "📥" },
      { text: "Your method: one record at a time, sequentially", sub: "order per partition, partitions interleaved", icon: "🔂" },
    ],
    beats: B(
      "What happens inside poll, with Spring.",
      "The first call does the whole read flow: find the coordinator, join group, sync group, fetch committed offsets or apply auto offset reset. Every later poll just fetches new data and handles commits.",
      { say: "A correction about coordinator crashes. It's often said the group must rejoin and rebalance. On a three broker cluster, the coordinator broker was killed, the consumer logged discovered group coordinator, the new one, and kept consuming. No rejoin, and the generation stayed one. The new coordinator loaded the group from consumer offsets.", tone: "key" },
      "Many partitions: one by one, or in parallel? The consumer sends one fetch request per leader broker, covering all its partitions there, and these go out in parallel. Fetch limits are about bytes over the network; max poll records is about how many records your code gets per poll. Extras wait in a buffer for the next poll.",
      "And in Spring, the container thread calls your method one record at a time, sequentially. Order is kept within each partition, and partitions are interleaved. Set listener type batch to take a whole list instead.",
    ),
  },

  // ------------------------------------------------------------ 22
  sec("22", "Offset commits in Spring: AckMode", "Topic twenty two. Who commits in Spring, and when. The answer changes what a crash costs."),
  L(
    [
      { id: "b", label: "BATCH", sub: "the default" },
      { id: "r", label: "RECORD", sub: "commit each" },
    ],
    "5 records in one poll, crash at offset 2",
    [
      { t: "Spring turns auto-commit off", b: "enable.auto.commit=false: the CONTAINER commits after your method has processed the records, per ack-mode.", m: "ackMode=BATCH by default", rows: { b: { cells: cells("0 1 2 3 4"), ptrs: [{ at: 0, l: "committed" }] }, r: { cells: cells("0 1 2 3 4"), ptrs: [{ at: 0, l: "committed" }] } } },
      { say: "A correction: Spring Kafka sets enable auto commit to false, unless you set it yourself. The container commits instead, after your method has processed the records, based on the ack mode. The default is batch: commit once all records returned by one poll are processed. Record commits after each one.", tone: "key" },
    ],
    [
      { b: "Process 0, 1 OK, then 2 crashes. BATCH has committed nothing; RECORD has committed 2.", rows: { b: { cells: cells("+0 +1 !2 3 4"), ptrs: [{ at: 0, l: "committed", tone: "amber" }] }, r: { cells: cells("+0 +1 !2 3 4"), ptrs: [{ at: 2, l: "committed", tone: "green" }] } } },
      "Five events in one poll. Offsets zero and one process fine, and offset two crashes. Batch mode has committed nothing yet: the committed offset is still zero. Record mode committed after each one: it's at two.",
    ],
    [
      { b: "Restart. BATCH reprocesses 0..4 (0 and 1 twice); RECORD only 2, 3, 4.", m: "both at-least-once, neither loses", rows: { b: { cells: cells("*0 *1 *2 *3 *4"), ptrs: [{ at: 5, l: "committed", tone: "amber" }] }, r: { cells: cells("0 1 *2 *3 *4"), ptrs: [{ at: 5, l: "committed", tone: "green" }] } } },
      { say: "After the restart, batch reprocesses zero to four, so zero and one run twice. Record reprocesses only two, three, four. Batch: fewer commit requests, more duplicates after a crash, up to one whole poll of five hundred. Record: one commit per record, more load on the coordinator, fewer duplicates. Neither loses data. Both are at least once, so your processing must be idempotent.", tone: "key" },
    ],
  ),
  {
    kind: "code",
    title: "MANUAL: your code decides when it's done",
    lang: "java",
    code: `spring.kafka.listener.ack-mode=MANUAL_IMMEDIATE

@KafkaListener(topics = "order-events", groupId = "orders")
public void consume(Order order, Acknowledgment ack) {
    process(order);         // e.g. the DB transaction commits here
    ack.acknowledge();      // only now is this offset marked done
}`,
    highlight: [[1, 1], [3, 7]],
    beats: B(
      "Manual and manual immediate: you call acknowledge yourself. Manual batches the commits and sends them later; manual immediate sends right away.",
      "Use it when done is decided by your code. For example, acknowledge only after the database transaction commits. And if you never call acknowledge, nothing is committed, and the records come back after a restart or rebalance. Say it like this: Spring disables Kafka's auto commit and commits from the container after processing; with the default batch mode a crash replays the whole last poll, record replays only the failed record, and manual lets my code decide.",
    ),
  },

  // ------------------------------------------------------------ 23
  sec("23", "Rebalancing and scaling", "Topic twenty three. Rebalancing and scaling: how partitions move between members, and how to stop that hurting."),
  L(
    [
      { id: "e", label: "Eager", sub: "Range (default)" },
      { id: "c", label: "Cooperative", sub: "CooperativeSticky" },
    ],
    "Consumer A owns P0..P3. Consumer B joins.",
    [
      { t: "A rebalance", b: "Re-dividing partitions when a member joins, leaves, or is considered dead. With the eager protocol all members stop.", rows: { e: { cells: cells("A:P0 A:P1 A:P2 A:P3") }, c: { cells: cells("A:P0 A:P1 A:P2 A:P3") } } },
      { say: "A rebalance re divides partitions when a member joins, leaves or is considered dead. With the default eager protocol, all members stop during it.", tone: "key", term: { word: "rebalance", meaning: "re-dividing partitions when members change" } },
    ],
    [
      { t: "Everyone gives up everything", b: "Eager: A revokes ALL of P0..P3, then gets P0, P1 back. Stop the world. Cooperative: A revokes only P2, P3.", rows: { e: { cells: cells("~P0 ~P1 ~P2 ~P3") }, c: { cells: cells("A:P0 A:P1 ~P2 ~P3") } } },
      "Consumer B joins. Eager, with range: A revokes all four partitions, then gets new ones. Everyone stops consuming during the rebalance, stop the world. Cooperative sticky: A revokes only P two and P three, the ones that move.",
    ],
    [
      { t: "After", b: "Same result, but cooperative kept P0 and P1 consuming the whole time.", m: "default list [Range, CooperativeSticky] = Range", rows: { e: { cells: cells("+A:P0 +A:P1 +B:P2 +B:P3") }, c: { cells: cells("A:P0 A:P1 +B:P2 +B:P3") } } },
      { say: "Same final split, but cooperative kept P zero and P one consuming the whole time. The default list is range and cooperative sticky, and the group uses the first one all members support, so range, eager, is what you get. The cooperative entry is there for a safe two step upgrade: roll out with both, then roll out again with only cooperative sticky.", tone: "key" },
    ],
  ),
  {
    kind: "compare",
    title: "Fewer rebalances, more throughput",
    cols: [
      { title: "Static membership", icon: "📌", tone: "blue", items: ["group.instance.id = the pod name", "restart within session.timeout: same partitions", "rolling deploy: 6 rebalances -> 0"] },
      { title: "Commit on revoke", icon: "💾", tone: "green", items: ["processed, not committed = redone", "onPartitionsRevoked: last chance", "Spring's container does it"] },
      { title: "Scaling", icon: "📈", tone: "amber", items: ["concurrency=3 or more pods", "max useful = partitions", "own groupId per unrelated listener"] },
      { title: "Order", icon: "🔂", tone: "purple", items: ["one thread per partition: order kept", "your own thread pool breaks it", "add partitions + concurrency instead"] },
    ],
    footer: "a deploy, a slow consumer or a dead pod each cost a rebalance",
    beats: B(
      "Static membership for rolling deploys. Restarting three pods normally causes six rebalances: each pod leaves, then joins. Give each pod a fixed group instance id, like its host name, and a longer session timeout. Restart within the timeout and the member gets its partitions back; the rest of the group never notices. The cost: if the pod really dies, its partitions sit unread until the timeout ends.",
      "Commit on revoke. Anything processed but not committed when a partition is taken away gets processed again by the new owner. On partitions revoked is the last chance to commit, and Spring's container does it for you.",
      "Scaling. Listener concurrency three, or more pods with the same group id. On four partitions, concurrency three gives two, one, one, and concurrency five leaves a thread idle. And two unrelated listeners in the same group still share one group, so a rebalance caused by one pauses the other: give independent listeners their own group id.",
      "Order. Each partition is still processed in order by one thread. Handing records to your own thread pool breaks per partition order and makes commits unsafe, because the container may commit before your pool finishes. Need more parallelism? Add partitions plus concurrency.",
      "Every one of these is about the same cost: each deploy, slow consumer or dead pod costs a rebalance.",
    ),
  },
  check({
    topic: "scaling",
    q: "Spring listener concurrency = 10 on a 6-partition topic. How many threads do real work?",
    a: "6. Each child container is one consumer in the group, and a partition has one owner, so 4 threads sit idle.",
    aSay: "Six. Each child container is one consumer in the group, and each partition has exactly one owner, so four of the ten threads sit idle.",
  }),

  // ------------------------------------------------------------ 24
  sec("24", "Poison pills and the dead letter topic", "Topic twenty four. Errors. One bad record can stop a whole partition, and the fix has a price."),
  L(
    [{ id: "p", label: "orders P0", sub: "consumed in order" }],
    "One bad record, four possibilities",
    [
      { t: "Record 42 throws", b: "Each partition has one consumer, reading in order. A record can't be set aside the way a queue can.", rows: { p: { cells: ["40@40", "41@41", "!42@42", "43@43", "44@44"], ptrs: [{ at: 2, l: "stuck", tone: "red" }] } } },
      { say: "Kafka gives each partition to one consumer, which reads it in order. A record can't be set aside the way a queue can. If record forty two keeps failing, there are only four possibilities.", tone: "key" },
    ],
    [
      { b: "1 retry forever: stuck at 42, lag grows (a poison pill). 2 skip silently: data loss. 3 stop the consumer: a human must act.", rows: { p: { cells: ["40@40", "41@41", "!42@42", "~43@43", "~44@44"], ptrs: [{ at: 2, l: "stuck", tone: "red" }] } } },
      "One: retry forever. The partition is stuck at forty two and lag grows forever. That's the classic poison pill. Two: skip it silently. Data loss. Three: stop the consumer. Everything stops until a human acts.",
    ],
    [
      { t: "4: retry a few times, then park it", b: "Bounded retries for transient failures, then the dead letter topic, and the partition keeps moving.", m: "what every real system does", rows: { p: { cells: ["40@40", "41@41", "*42 -> DLT@42", "+43@43", "+44@44"], ptrs: [{ at: 5, l: "moving", tone: "green" }] } } },
      { say: "Four: retry a few times, then move it somewhere safe, a dead letter topic, and continue. Because a partition is consumed in order, one failing record blocks everything behind it, so I retry transient failures a bounded number of times, then park the record in a dead letter topic so the partition keeps moving.", tone: "key", term: { word: "poison pill", meaning: "a record that fails forever and blocks its partition" } },
    ],
  ),
  {
    kind: "compare",
    title: "Would trying again ever help?",
    cols: [
      { title: "Transient", icon: "🌧", tone: "amber", items: ["DB down, timeout, 503", "deadlock, rate limit", "retry with a back-off"] },
      { title: "Permanent", icon: "🧱", tone: "red", items: ["bad JSON, missing field", "broken business rule", "straight to the DLT"] },
      { title: "The deserialization pill", icon: "☠️", tone: "purple", items: ["fails INSIDE poll(): offset never moves", "108,669 errors in 40 s, 594 MB of logs", "fix: ErrorHandlingDeserializer"] },
    ],
    footer: "addNotRetryableExceptions(ValidationException.class) · throw RuntimeException, never Error",
    beats: B(
      "Before retrying, ask one question: would trying again ever help? Transient failures, the DB is down, a timeout, a five oh three, a deadlock, a rate limit: wait a bit and it'll probably succeed. Retry with a back off.",
      "Permanent failures, bad JSON, a missing required field, a broken business rule: retrying ten times gives the same failure ten times, and blocks the partition. Send it to the DLT right away. Spring already treats some exceptions as not retryable, like deserialization and conversion exceptions. Add your own validation errors to that list.",
      { say: "And the worst pill. Spring's JSON serializer adds a type id header with the producer's class name, and the consumer's JSON deserializer prefers that header. If the consumer's class is in a different package, deserialization fails, inside poll, so the offset never advances. The same record failed on every poll: a hundred and eight thousand errors in about forty seconds, a five hundred ninety four megabyte log, and nothing after it was consumed. The fix: turn off type headers, and always wrap in error handling deserializer, which turns the failure into a normal failed record the error handler can skip or dead letter.", tone: "key" },
      "And always throw something that extends runtime exception. An Error skips the error handler and stops the consumer, while the app can still look healthy from outside.",
    ),
  },
  {
    kind: "code",
    title: "Blocking retries: DefaultErrorHandler",
    lang: "java",
    code: `// poll() returned 0..5; records 0, 1, 2 OK; record 3 throws
// 1. container commits 0, 1, 2 first
// 2. handler waits the BackOff, SEEKS back to 3; next poll() returns 3, 4, 5
// 3. retries used up or not retryable -> recoverer -> commit 4

@Bean
DefaultErrorHandler errorHandler(KafkaTemplate<Object, Object> t) {
    var dlt = new DeadLetterPublishingRecoverer(t);              // -> orders-dlt
    var h = new DefaultErrorHandler(dlt, new FixedBackOff(1000L, 2L)); // 2 retries = 3 attempts
    h.addNotRetryableExceptions(IllegalArgumentException.class); // straight to DLT
    return h;
}
// default: FixedBackOff(0, 9) = 10 attempts, no delay, then log and SKIP`,
    highlight: [[1, 2], [3, 4], [6, 12], [13, 13]],
    beats: B(
      { say: "Blocking retries. Blocking means the retry happens on the same partition, in place: nothing behind the failed record is processed until it succeeds or is given up on. In Spring, that's the default error handler. Poll returned zero to five, and record three throws. First, the offsets of records that already succeeded are committed, so a retry never replays them.", tone: "key" },
      "Second, seek, not loop. The handler doesn't call your method again in a for loop. It moves the consumer's position back to three, and the next poll brings three, four, five again. Because it keeps calling poll, the consumer stays alive in the group the whole time. When the exception isn't retryable, or the attempts run out, the recoverer runs, the failed record's offset is committed, and the partition moves on.",
      "In real code you change two things: add a delay, and replace log and skip with publish to a DLT. Fixed back off one thousand, two means two retries, so three attempts in total, one second apart. The second number is retries, not attempts. On one partition: a bad record went straight to the DLT, a DB down record got three attempts, and the next record waited about two and a half seconds behind it. That wait is what blocking costs.",
      { say: "Because the defaults will quietly lose data: ten attempts with zero delay, finished in milliseconds, which does nothing for a database that needs five seconds to come back. Then the record is logged and gone.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "The dead letter topic",
    firstItemStep: 1,
    items: [
      { text: "Name: <topic>-dlt", sub: "old default .DLT", icon: "🏷" },
      { text: "Partition: the SAME number as the original", sub: "orders 6 partitions, orders-dlt 1: P4 can't be published", icon: "🔢" },
      { text: "Key and value unchanged; headers say why", sub: "original topic, partition, offset · exception class, message, stack trace", icon: "📎" },
      { text: "A DLT nobody reads is just data loss with extra steps", sub: "alert · inspect · fix · replay idempotently · long retention", icon: "🚨" },
    ],
    beats: B(
      { say: "A DLT is a normal Kafka topic where records that couldn't be processed are parked, so the main partition can continue and nothing is silently lost.", term: { word: "DLT", meaning: "a topic where failed records are parked" } },
      "The name: the original topic dash dlt. Many blogs show dot DLT; that was the old default.",
      { say: "The partition: the same partition number as the original. The trap: if orders has six partitions and orders dash dlt has one, a failure on partition four can't be published. Give the DLT at least as many partitions, or let Kafka pick with partition minus one.", tone: "key" },
      "Key and value are unchanged, and the headers carry the why, so nobody has to guess later: the original topic, partition, offset, and the exception's class, message and stack trace.",
      { say: "And a DLT nobody reads is just data loss with extra steps. Alert on any DLT traffic, inspect the headers, fix the bug or the data, replay the fixed records, with idempotent consumers, and keep the DLT's retention long enough for humans to react.", tone: "key" },
    ),
  },
  A(
    RETRY,
    "Non-blocking retries: @RetryableTopic",
    [
      { t: "Move it aside", b: "A failing record goes to a separate retry topic, so the main topic keeps flowing.", m: "attempts=4, delay 1000, multiplier 2", nodes: ["main", "lst", "ok"], moves: [{ e: "m-l", t: "pay-7" }, { e: "l-ok", t: "pay-7", delay: 46, tone: "green" }] },
      { say: "Your payment service is down for two minutes. With blocking retries, every payment behind the first failing one waits two minutes, though most of them don't depend on each other. So: move the failing record to a separate retry topic, so the main topic keeps flowing. A retry consumer processes it again after a delay, and after the last attempt, it goes to the DLT.", tone: "key" },
    ],
    [
      { t: "Hop by hop", b: "Each failure hops one topic right: retry-1000, retry-2000, retry-4000, then the DLT. Success at any stage ends it.", m: "two annotations, Spring creates the topics", nodes: ["lst", "r1", "r2", "r3", "dlt"], moves: [{ e: "l-r1", t: "pay-9" }, { e: "r1-r2", t: "pay-9", delay: 50 }, { e: "r2-r3", t: "pay-9", delay: 100 }, { e: "r3-d", t: "pay-9", delay: 150, tone: "red" }] },
      "At retryable topic with four attempts, delay one second, multiplier two. Each failure hops the record one topic to the right: retry one thousand, two thousand, four thousand, about one, two and four seconds later, then the DLT, where the DLT handler method is called. Success at any stage ends it. And the main topic never stopped.",
    ],
    [
      { t: "Waiting without sleeping", b: "The record carries a due-time header. Read too early: pause that partition, seek back, resume on time.", m: "not for batch listeners", nodes: ["r1", "r2", "r3"] },
      "How does it wait without sleeping? The forwarded record carries a due timestamp header. If the retry consumer reads it too early, it pauses that partition, seeks back, and resumes when the time comes. Every record in one retry topic has the same delay, so the first one waiting is always the earliest due.",
    ],
    [
      { t: "The price: ordering", b: "order-1 CREATED fails and moves aside; PAID for the same order is processed now. PAID before CREATED.", m: "fine for email, a bug for a state machine", nodes: ["main", "lst", "r1"], tones: { lst: "red" }, moves: [{ e: "l-r1", t: "CREATED" }, { e: "m-l", t: "PAID", delay: 20, tone: "red" }] },
      { say: "The catch: you just broke ordering. One order, created then paid, same partition. Created fails and moves to the retry topic. Paid is processed now. So paid gets applied before created. For an email sender that's fine. For an order state machine it's a bug.", tone: "key" },
    ],
    [
      { t: "Which one?", b: "Blocking when events of one key depend on each other. Non-blocking when records are independent and outages are long.", m: "often both: quick blocking, then retry topics", nodes: ["dlt", "ops"], edges: ["d-o"] },
      { say: "So decide with one question: do events for the same key depend on each other? Blocking retries when order matters per key, order lifecycle events, account balance updates, and failures are short. Non blocking when records are independent and outages can last minutes. Most teams combine them: a few quick blocking retries for blips, then retry topics. And when order matters and the outage is long? Pause the container, alert, and resume after the fix. Lag grows, but nothing is applied out of order.", tone: "key" },
    ],
  ),
  {
    kind: "bullets",
    title: "Lag, pause and replay",
    firstItemStep: 1,
    items: [
      { text: "Lag = log end offset - committed offset, per partition", sub: "all partitions: too slow · one partition: a hot key or a stuck pill", icon: "📉" },
      { text: "pause(): poll() keeps running, returns nothing, stays in the group", sub: "sleeping would breach max.poll.interval.ms", icon: "⏸" },
      { text: "Replay: offsetsForTimes + seek, or --reset-offsets --to-datetime", sub: "with the group stopped · consumers must be idempotent", icon: "⏪" },
    ],
    beats: B(
      "Three last tools.",
      { say: "Lag tells you something is wrong. Lag is log end offset minus committed offset, per partition: how far behind the group is. Lag on every partition means the consumers are too slow overall. Lag on one partition means a hot key, or a stuck poison record.", tone: "key" },
      "Pause and resume handle a slow downstream. Pause keeps poll running, but it returns nothing, so the consumer stays in the group. Just sleeping would breach max poll interval and trigger a rebalance.",
      "And replay fixes the past. Kafka keeps data after it's read, so after a bug fix you can go back: offsets for times to find the first offset two hours ago, then seek. Or from the command line, with the group stopped, reset offsets to a date time. Replays process records twice, so consumers must be idempotent. Which is exactly where we go next.",
    ),
  },
  check({
    topic: "retries",
    q: "What happens to message ordering when you use retry topics?",
    a: "It breaks for the retried record: later records of the same key are processed before it. Use blocking retries when events of one key depend on each other.",
    aSay: "It breaks for the retried record. It's forwarded to a delayed retry topic while later records, including ones for the same key, keep being processed. So I use blocking retries when events for the same key depend on each other, and retry topics when records are independent.",
  }),
];
