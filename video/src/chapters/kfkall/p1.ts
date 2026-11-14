import type { Scene } from "../../lib/types.ts";
import { A, TOPIC } from "./boards.ts";
import { B, L, cells, check, sec } from "./h.ts";

const P3 = [
  { id: "p0", label: "P0", sub: "order-events-0" },
  { id: "p1", label: "P1", sub: "order-events-1" },
  { id: "p2", label: "P2", sub: "order-events-2" },
];

// Part A: the log. What Kafka is, topics, partitions, offsets and order,
// segments, which partition an event goes to, brokers.
export const p1: Scene[] = [
  {
    kind: "title",
    eyebrow: "Kafka · end to end",
    title: "Kafka, from one event to exactly-once",
    subtitle: "The log, groups, the cluster, failures, producers, Spring, retries, transactions",
    beats: B(
      "Kafka, end to end. One running example the whole way: an order service publishes order events, keyed by the order id, and payment, inventory, notification and analytics services read them. We'll start with a single event landing in a log, and finish with exactly-once effects across services. Every box you see is a separate machine or process, so watch what moves between them.",
    ),
  },
  {
    kind: "seq",
    title: "The map of this lecture",
    actors: [
      { id: "a", name: "The log", icon: "📜" },
      { id: "b", name: "Reading", icon: "👥" },
      { id: "c", name: "The cluster", icon: "🖥" },
      { id: "d", name: "Failures", icon: "💥" },
      { id: "e", name: "Exactly-once", icon: "🎯" },
    ],
    msgs: [
      { from: "a", to: "b", label: "partitions, offsets, keys", step: 1 },
      { from: "b", to: "c", label: "groups and commits", step: 2 },
      { from: "c", to: "d", label: "replicas, ISR, acks, flows", step: 3 },
      { from: "d", to: "e", label: "producer, Spring, retries", step: 4 },
    ],
    beats: B(
      "Here's the map.",
      "First the log: topics, partitions, offsets, and how a key picks a partition.",
      "Then reading: consumer groups and committed offsets, which decide whether a crash loses or repeats work.",
      "Then the cluster: replicas, the controller, in-sync replicas and acks, and the complete write and read paths.",
      "Then what breaks and how it heals, the producer's insides, Spring Boot, retries and dead letter topics, and finally exactly-once.",
    ),
  },

  // ------------------------------------------------------------ 1
  sec("1", "What Kafka is", "Topic one. What Kafka actually is, and the one property that makes it different from a queue."),
  {
    kind: "bullets",
    title: "A distributed event streaming system",
    firstItemStep: 1,
    items: [
      { text: "Publish events (write)", icon: "📤" },
      { text: "Store events (on disk, kept for a retention time)", icon: "💾" },
      { text: "Subscribe to events (read)", icon: "📥" },
      { text: "Reading does not delete: replay any time", icon: "🔁", sub: "the big difference from a queue" },
    ],
    beats: B(
      { say: "Kafka is a distributed event streaming system. Not a classic pub sub queue. It does three things.", tone: "key" },
      "Publish. Producers write events.",
      "Store. Kafka keeps them on disk, for a retention time, say seven days.",
      "Subscribe. Consumers read them.",
      { say: "And here's the key point about store. Reading an event does not delete it. The same event can be read again and again, from the start if you like. In a normal queue, a message is gone once it's consumed. In Kafka, it stays.", tone: "key" },
    ),
  },
  A(
    TOPIC,
    "One topic, many readers",
    [{ all: true }, "Here's our system. The order service on the left. A topic called order events in the middle, split into three partitions. And two groups of readers on the right: a notification service with three consumers, and an analytics service with one."],
    [
      { t: "Producer", b: "An application that publishes events. It knows only Kafka, never who will read.", m: "decoupled from consumers", nodes: ["prod", "p1"], moves: [{ e: "w1", t: "123 CREATED" }] },
      { say: "A producer is an application that publishes events to Kafka. It does not know or care who will consume them. It talks to Kafka, and that's all.", term: { word: "producer", meaning: "an app that writes events to a topic" } },
    ],
    [
      { t: "Topic", b: "A named category events are published to, like a folder: all order events go to order-events.", m: "many producers, one topic", nodes: ["p0", "p1", "p2"] },
      { say: "A topic is a named category, like a folder, that events are published to. All order events go to order events. Many producers can write to the same topic.", term: { word: "topic", meaning: "a named stream of related events" } },
    ],
    [
      { t: "Read twice, by two services", b: "Notification and analytics each read the same event. Reading deleted nothing.", m: "the event stays on disk", nodes: ["p1", "c2", "an"], moves: [{ e: "r1", t: "123 CREATED" }, { e: "a1", t: "123 CREATED", delay: 20 }] },
      "And watch what happens on the right: notification reads that event, and analytics reads the very same event. Two services, one stored copy. That only works because reading doesn't delete.",
    ],
  ),
  check({
    topic: "what Kafka is",
    q: "A consumer reads an event. Is it still in Kafka afterwards?",
    a: "Yes. Reading does not delete; the event stays until retention removes it, and any group can re-read it.",
    aSay: "Yes. Reading does not delete it. It stays on disk until retention removes it, and any consumer can read it again, even from the very start. That's the difference from a normal queue.",
  }),

  // ------------------------------------------------------------ 2
  sec("2", "Partitions and offsets", "Topic two. Partitions and offsets. This is where Kafka's ordering guarantee comes from, and where it stops."),
  {
    kind: "bullets",
    title: "A partition: physical, ordered, append-only",
    firstItemStep: 1,
    items: [
      { text: "Physical: a directory on the broker's disk", sub: "order-events-0/, order-events-1/, order-events-2/", icon: "📁" },
      { text: "Ordered: every event gets the next offset", sub: "offsets start at 0", icon: "🔢" },
      { text: "Append-only: added at the end, never edited or moved", icon: "➕" },
    ],
    beats: B(
      { say: "A topic is split into partitions. And a partition is a physical, ordered, append only log. Three words, one by one.", tone: "key" },
      "Physical. Events really are stored on disk. Each partition is a directory on the broker, named topic dash partition number: order events dash zero, dash one, dash two. Inside that directory are the actual data files.",
      "Ordered. Each event gets an increasing number called an offset. Offsets start at zero, not one.",
      "Append only. New events are only added at the end. Old events are never edited or moved. Why split a topic at all? So one topic can be spread over many machines, and read by many consumers in parallel. More partitions, more parallelism.",
    ),
  },
  L(
    P3,
    "Offsets: one counter per partition",
    [
      { t: "Each partition counts on its own", b: "An arriving event gets that partition's next offset and goes to the end.", m: "offsets start at 0", rows: { p0: { cells: cells("E0 E3") }, p1: { cells: cells("E1 E4") }, p2: { cells: cells("E2") } } },
      "Here are the three partitions as logs. Each one keeps its own next offset counter. P zero has E zero at offset zero and E three at offset one. P two has only E two.",
    ],
    [
      { b: "E5 arrives for P2: it gets offset 1, appended at the end. Nothing in the middle changes.", rows: { p0: { cells: cells("E0 E3") }, p1: { cells: cells("E1 E4") }, p2: { cells: cells("E2 +E5") } } },
      "Now E five arrives for P two. Kafka gives it P two's next offset, which is one, and appends it at the end. Nothing in the middle changes. That's append only.",
    ],
    [
      { t: "Order: inside one partition only", b: "Inside P0, E3 surely came after E0. Across partitions, offset 1 here and offset 1 there say nothing.", m: "no order across partitions", rows: { p0: { cells: cells("*E0 *E3") }, p1: { cells: cells("E1 E4") }, p2: { cells: cells("E2 E5") } } },
      { say: "So here's the guarantee. Inside one partition, order is guaranteed: events are written in sequence and read in increasing offset order, and Kafka never reorders a partition. E three in P zero surely happened after E zero. But across partitions there's no order guarantee at all. Offset one in P zero and offset one in P one say nothing about which happened first.", tone: "key" },
    ],
  ),
  L(
    [
      { id: "p1", label: "P1", sub: "key 789" },
      { id: "p2", label: "P2", sub: "keys 123, 456" },
    ],
    "Keyed by orderId: what a reader sees",
    [
      { t: "Produced in this order", b: "123 CREATED, 456 CREATED, 789 CREATED, 123 PAID, 456 PAID, 123 SHIPPED.", m: "3 partitions, key = orderId", rows: { p1: { cells: [] }, p2: { cells: [] } } },
      "A small run. Three partitions, key is the order id. Produced in this order: one two three created, four five six created, seven eight nine created, then one two three paid, four five six paid, one two three shipped.",
    ],
    [
      { b: "123 and 456 both hash to P2, 789 to P1. Each order's own steps stay in order inside P2.", rows: { p1: { cells: ["789 C"] }, p2: { cells: ["123 C", "456 C", "123 P", "456 P", "123 S"] } } },
      "One two three and four five six both hash to P two. Seven eight nine goes to P one. Inside P two, every order's own steps are in order: created, paid, shipped.",
    ],
    [
      { b: "A reader of the whole topic saw 789 CREATED last, though it was produced third.", m: "order kept per key, not per topic", rows: { p1: { cells: ["!789 C"] }, p2: { cells: ["123 C", "456 C", "123 P", "456 P", "123 S"] } } },
      { say: "But a consumer reading the whole topic got all of P two first, and seven eight nine created last, even though it was produced third. Across partitions, the order broke. Need one global order for a whole topic? The only way is one partition, and then there's no parallelism. You almost never need that. You need order per key: per order, per user.", tone: "key" },
    ],
  ),
  check({
    topic: "ordering",
    q: "What ordering does Kafka guarantee, and at what scope?",
    a: "Order within a partition only, by offset. Nothing across partitions; for per-key order, send every event of a key to one partition.",
    aSay: "Kafka guarantees order only within a partition, in offset order. Nothing across the topic. So if I need an order's events in sequence, every event of that order must land in the same partition.",
  }),

  // ------------------------------------------------------------ 3
  sec("3", "Segments and the index", "Topic three, briefly. How a partition sits on disk: segments and a sparse index, so Kafka can find any offset fast."),
  {
    kind: "code",
    title: "Inside order-events-0/",
    lang: "text",
    code: `order-events-0/
  00000000000000000000.log         offsets 0 .. 1024
  00000000000000000000.index       offset -> byte position
  00000000000000000000.timeindex   timestamp -> offset
  00000000000000001025.log         offsets 1025 .. 2048
  00000000000000002049.log         active, being written

read offset 1500:
  1. segment: largest base offset <= 1500  -> 1025.log
  2. index:   binary search, entry <= 1500 -> byte position
  3. jump there, scan a few records        -> found`,
    highlight: [[1, 1], [2, 6], [8, 11]],
    beats: B(
      "One partition directory does not hold one giant file.",
      { say: "The log is cut into segments. When the current segment reaches segment dot bytes, one gigabyte by default, Kafka closes it and starts a new one. Each segment file is named by the first offset inside it, padded to twenty digits. Next to each log file sits an index, from offset to byte position, and a time index, from timestamp to offset.", tone: "key" },
      "To read offset fifteen hundred: pick the segment whose base offset is the largest one at or below fifteen hundred, that's the one starting at ten twenty five. Binary search its sparse index, roughly one entry every four kilobytes. Jump to that byte, scan a few records. Small segments also make deleting old data cheap: Kafka deletes whole old segments.",
    ),
  },

  // ------------------------------------------------------------ 4
  sec("4", "Which partition does an event go to?", "Topic four. Which partition does an event go to? The producer decides, and the answer is different with a key and without one."),
  {
    kind: "compare",
    title: "The producer picks the partition",
    cols: [
      { title: "Partition given", icon: "🎯", tone: "blue", items: ["use it as is", "the partitioner does nothing"] },
      { title: "Key given", icon: "🔑", tone: "green", items: ["murmur2(keyBytes) % numPartitions", "same key -> same partition", "so per-key order holds"] },
      { title: "No key", icon: "🧲", tone: "amber", items: ["sticky (Kafka 2.4+), not round robin", "fills ~one batch (16 KB), then switches", "even over time, not short-term"] },
    ],
    footer: "a partition holds many keys · adding partitions remaps keys",
    beats: B(
      "Three cases. If the record names a partition, that's it.",
      { say: "With a key, the partition is murmur two of the key bytes, mod the number of partitions. Kafka's own murmur two hash, not Java's hash code. Same key, same partition, always, while the partition count stays the same. Same partition means order. So all events of one key stay in order.", tone: "key" },
      "With no key, a correction to what many people say: the default producer is not round robin per event. Since Kafka two point four it uses a sticky partitioner. It fills one partition for a while, about a batch worth of data, sixteen kilobytes, then moves to another. Even over time, not in the short run. Why? Round robin spreads five records into three tiny batches and three sends. Sticky makes one full batch and one send. Bigger batches, fewer requests, better throughput.",
      "Two things people get wrong. A partition holds many keys, not one partition per key. And adding partitions breaks the mapping, because the formula uses mod the partition count.",
    ),
  },
  A(
    TOPIC,
    "Same key, same partition",
    [
      { t: "Hash the key", b: "Every event of order 123 hashes to the same partition, so CREATED, PAID, SHIPPED stay in order.", m: "murmur2(\"123\") % 3 = 2", nodes: ["prod", "p2"], moves: [{ e: "w2", t: "123 CREATED" }, { e: "w2", t: "123 PAID", delay: 26 }, { e: "w2", t: "123 SHIPPED", delay: 52 }] },
      "Watch order one two three. Created, paid, shipped: the key hashes to P two every time, so all three land in one partition, in that order.",
    ],
    [
      { t: "Grow to 5 partitions", b: "murmur2(\"123\") % 5 = 0: 123 DELIVERED lands in P0 while its history sits in P2. Kafka never moves old data.", m: "pick the count up front for keyed topics", nodes: ["prod", "p0", "p2"], subs: { p0: "now holds 123 DELIVERED", p2: "123 CREATED · PAID · SHIPPED" }, tones: { p0: "red" }, moves: [{ e: "w0", t: "123 DELIVERED", tone: "red" }] },
      { say: "Now someone grows the topic from three partitions to five. One two three delivered is sent. Mod five, it goes to P zero, while the older events sit in P two. Order one two three is now split across two partitions, and a consumer can see delivered before shipped. Kafka doesn't move old data. So for keyed topics, pick the partition count up front.", tone: "key" },
    ],
    [
      { t: "No key: sticky", b: "With no key, a run of records fills one partition's batch, then the producer switches.", m: "bigger batches, fewer requests", nodes: ["prod", "p1"], moves: [{ e: "w1", t: "E0" }, { e: "w1", t: "E1", delay: 12 }, { e: "w1", t: "E2", delay: 24 }, { e: "w1", t: "E3", delay: 36 }] },
      "And with no key, watch: a whole run of events goes to one partition, then the producer switches. Nine small events with no key went all to P one. That's sticky.",
    ],
  ),
  check({
    topic: "partitioning",
    q: "A keyed topic grows from 3 to 5 partitions. What breaks?",
    a: "The key-to-partition mapping: new events of an old key can land in a different partition from its history, so per-key order breaks.",
    aSay: "The mapping breaks. The partition is the hash mod the partition count, so new events of an existing key can land in a different partition from its older events, and a consumer can see them out of order. Kafka doesn't move old data.",
  }),

  // ------------------------------------------------------------ 5
  sec("5", "The broker", "Topic five. The broker: the machine that actually holds the partitions."),
  {
    kind: "compare",
    title: "Partitions spread across brokers",
    cols: [
      { title: "Broker 1", icon: "🖥", tone: "blue", items: ["order-events-0", "payments-1"] },
      { title: "Broker 2", icon: "🖥", tone: "green", items: ["order-events-1", "payments-0"] },
      { title: "Broker 3", icon: "🖥", tone: "amber", items: ["order-events-2"] },
    ],
    footer: "one broker holds some partitions of some topics · copies come next",
    beats: B(
      { say: "A broker is one Kafka server, one running Kafka process. It really stores the data, as partition directories on its disk, and it serves clients: producers write to it, consumers read from it.", tone: "key" },
      "But a broker stores some partitions of some topics. Not everything.",
      "So one broker doesn't hold all topics, and doesn't hold all partitions of a topic.",
      "This picture shows one copy of each partition. Keeping extra copies on other brokers is replication, and that's coming in the cluster part. Say it like this: a broker is one Kafka server that stores some partitions and serves reads and writes for them; partitions of a topic are spread across brokers.",
    ),
  },
];
