import type { Scene } from "../../lib/types.ts";
import { A, TOPIC } from "./boards.ts";
import { B, L, cells, check, sec } from "./h.ts";

// Part B: reading. Consumer groups, committed offsets and __consumer_offsets,
// auto-commit vs manual commit.
export const p2: Scene[] = [
  // ------------------------------------------------------------ 6
  sec("6", "Consumers and consumer groups", "Topic six. Consumers and consumer groups. Two rules explain almost every question about them."),
  A(
    TOPIC,
    "Inside a group, partitions are shared out",
    [
      { t: "A consumer pulls", b: "It calls poll() again and again; Kafka returns the next events, in offset order per partition.", m: "pull, not push", nodes: ["p0", "c1"], moves: [{ e: "r0", t: "poll" , rev: true, tone: "teal" }, { e: "r0", t: "E0 E3", delay: 40 }] },
      { say: "A consumer is an application that reads events from a topic. It pulls: it calls poll again and again, and Kafka returns the next events. It reads each partition in offset order.", term: { word: "consumer", meaning: "pulls events with poll(), per partition in offset order" } },
    ],
    [
      { t: "A consumer group", b: "All consumers with the same group.id. Together they split the topic's partitions. Usually one group = one service.", m: "group.id = notification-service", nodes: ["c1", "c2", "c3", "p0", "p1", "p2"], moves: [{ e: "r0", t: "P0" }, { e: "r1", t: "P1" }, { e: "r2", t: "P2" }] },
      { say: "A consumer group is all the consumers that share the same group dot id. Together they split the partitions of the topic, so the work is shared. Usually one group is one service: three instances of the notification service, all with group id notification service.", term: { word: "consumer group", meaning: "consumers with one group.id that split the partitions" } },
    ],
    [
      { t: "Rule 1", b: "Inside one group, a partition goes to only one consumer. One consumer can read many partitions.", m: "never two readers of P0 in one group", nodes: ["p0", "c1"], edges: ["r0"] },
      { say: "Rule one. Inside one group, a partition goes to only one consumer. The same partition is never read by two consumers of the group at the same time. One consumer can read many partitions. Why? If two instances of the same service both read P zero, both would process the same events, duplicates, and the per partition order would break.", tone: "key" },
    ],
    [
      { t: "Rule 2", b: "Different groups are fully independent. Each group gets every event.", m: "queue inside a group, pub/sub across groups", nodes: ["p0", "p1", "p2", "an"], moves: [{ e: "a0", t: "E0" }, { e: "a1", t: "E1", delay: 10 }, { e: "a2", t: "E2", delay: 20 }] },
      { say: "Rule two. Different groups are fully independent, and each group gets every event. The analytics group has one consumer, so it reads all three partitions, the same events notification is reading. Inside a group, partitions are shared out, queue style. Across groups, every group gets every event, pub sub style.", tone: "key" },
    ],
  ),
  {
    kind: "compare",
    title: "Consumers vs partitions in one group",
    cols: [
      { title: "3 partitions, 3 consumers", icon: "⚖️", tone: "green", items: ["C1 -> P0", "C2 -> P1", "C3 -> P2"] },
      { title: "6 partitions, 3 consumers", icon: "📦", tone: "blue", items: ["C1 -> P0, P1", "C2 -> P2, P3", "C3 -> P4, P5", "split depends on the strategy"] },
      { title: "3 partitions, 5 consumers", icon: "💤", tone: "amber", items: ["C1 -> P0, C2 -> P1, C3 -> P2", "C4, C5 idle", "standbys if one dies"] },
    ],
    footer: "max useful consumers in a group = number of partitions",
    beats: B(
      "Three cases. Consumers equal partitions: one each.",
      "Fewer consumers: each gets two. The exact split depends on the assignment strategy, but what never changes is that each partition has exactly one owner in the group.",
      "More consumers than partitions: consumers four and five sit idle. They take over if an active one dies.",
      { say: "So the maximum useful consumers in a group is the number of partitions. Traffic doubles, and you add three more consumers to a three partition topic? Throughput doesn't move: they're idle. You have to add partitions first, and remember that remaps keys.", tone: "key" },
    ),
  },
  check({
    topic: "consumer groups",
    q: "Notification has 6 instances, analytics has 1; the topic has 4 partitions. How many instances do work, and how many times is each event processed?",
    a: "Notification: 4 busy, 2 idle. Analytics: its one instance reads all 4. Each event is processed twice in total, once per group.",
    aSay: "In notification, only four of the six get a partition, and two sit idle. In analytics, the single instance reads all four partitions. Groups are independent, so each event is processed twice in total: once by notification, once by analytics.",
  }),

  // ------------------------------------------------------------ 7
  sec("7", "Committed offsets", "Topic seven. Committed offsets: how a group remembers where it stopped, and where that memory lives."),
  L(
    [{ id: "p", label: "ord1-0", sub: "one partition" }],
    "One partition, two groups, two positions",
    [
      { t: "Committed offset", b: "Per (group, topic, partition): the NEXT offset to read, not the last one processed.", m: "processed 0..99 -> commit 100", rows: { p: { cells: cells("E0 E1 E2 E3 E4 E5") } } },
      { say: "Each group remembers, per partition, how far it has got. That's the committed offset, stored per group, topic and partition. And the correct meaning is the next offset to read, not the last one processed. If you processed offsets zero to ninety nine, you commit one hundred.", tone: "key", term: { word: "committed offset", meaning: "per (group, topic, partition): the next offset to read" } },
    ],
    [
      { b: "notification read all six: committed 6, lag 0. analytics read two: committed 2, lag 4.", m: "lag = log end - committed", rows: { p: { cells: cells("E0 E1 E2 E3 E4 E5"), ptrs: [{ at: 6, l: "notification", tone: "green" }, { at: 2, l: "analytics", tone: "amber", top: true }] } } },
      "Partition ord one zero has six events. Notification read all six, so it committed six. Analytics read only two, so it committed two. Same partition, two different numbers: groups don't affect each other. Lag is log end minus committed: zero for notification, four for analytics.",
    ],
    [
      { b: "analytics restarts: its first event is offset 2. It continues where it stopped.", rows: { p: { cells: cells("E0 E1 *E2 *E3 *E4 *E5"), ptrs: [{ at: 6, l: "notification", tone: "green" }, { at: 6, l: "analytics", tone: "amber", top: true }] } } },
      "When analytics starts again, its first event is offset two. It continues exactly where it stopped, and reads two through five.",
    ],
  ),
  {
    kind: "code",
    title: "Where commits live: __consumer_offsets",
    lang: "text",
    code: `__consumer_offsets   internal topic, 50 partitions, compacted

key   (group = "analytics", topic = "ord1", partition = 0)
value offset = 2

partition = abs(groupId.hashCode()) % 50
  "notification"  -> partition 3
  "analytics"     -> partition 10

leader of that partition = the group coordinator

restart:
  1. consumer -> any broker: "who is the coordinator for analytics?"
  2. broker computes % 50 = 10 -> "the leader of partition 10"
  3. consumer -> coordinator: "committed offset for ord1 P0?" -> 2
  4. read ord1-0 from offset 2`,
    highlight: [[1, 4], [6, 9], [11, 15]],
    beats: B(
      "Where are commits stored? In Kafka itself, in an internal topic called underscore underscore consumer offsets. Fifty partitions by default, and compacted: Kafka keeps only the latest value per key, so old commits get cleaned. Each commit is a record. The key is group, topic, partition. The value is the offset.",
      { say: "All commits of one group go to one partition of that topic: the absolute value of the group id's hash code, mod fifty. And the broker that leads that partition is the group's coordinator. It keeps an in memory map from those records: group, topic, partition to committed offset.", tone: "key", term: { word: "group coordinator", meaning: "leader of the group's __consumer_offsets partition" } },
      "Recovery after a crash. The new consumer asks any broker: who is the coordinator for group analytics? A correction here: the consumer doesn't compute the hash itself. The broker does the math and answers: the leader of partition ten. The consumer asks that coordinator for its committed offset, gets two, and reads from two. And if a group has no committed offset yet, auto offset reset decides: latest, the default, meaning only new events, or earliest, from the beginning.",
    ),
  },
  check({
    topic: "commits",
    q: "You processed offsets 0 to 99 and committed. What value is stored, and where does the next consumer of the group start?",
    a: "100, the next offset to read. The next consumer starts at 100.",
    aSay: "One hundred. The committed offset is the next offset to read, so the next consumer in that group starts at offset one hundred.",
  }),

  // ------------------------------------------------------------ 8
  sec("8", "Auto-commit vs manual commit", "Topic eight. Auto commit versus manual commit. When the offset moves decides whether a crash repeats work or loses it."),
  L(
    [
      { id: "c1", label: "Case 1", sub: "process in the loop" },
      { id: "c2", label: "Case 2", sub: "hand off to a thread" },
    ],
    "Auto-commit: it runs inside poll()",
    [
      { t: "When auto-commit fires", b: "Not on a timer mid-work: inside poll(). When 5 s have passed, poll commits what the PREVIOUS poll returned.", m: "enable.auto.commit=true · 5 s", rows: { c1: { cells: cells("0 1 2 3 4 5"), ptrs: [{ at: 0, l: "committed" }] }, c2: { cells: cells("0 1 2 3 4 5"), ptrs: [{ at: 0, l: "committed" }] } } },
      { say: "Auto commit is the plain client's default: enable auto commit true, every five seconds. A correct fact about how it works: the commit doesn't fire on a separate timer in the middle of your work. It happens inside poll. When poll is called and five seconds have passed, it commits the offsets of the events the previous poll returned.", tone: "key" },
    ],
    [
      { t: "Case 1: duplicates", b: "poll returned 0..5, processing, crash before the next poll: no poll, no commit. Restart reads 0..5 again.", m: "nothing lost, some repeated", rows: { c1: { cells: cells("!0 !1 !2 3 4 5"), ptrs: [{ at: 0, l: "committed", tone: "amber" }] }, c2: { cells: cells("0 1 2 3 4 5"), ptrs: [{ at: 0, l: "committed" }] } } },
      "Case one, the normal way: you process inside the poll loop. Poll returns zero to five, you process for three seconds, and crash before the next poll. The interval passed, but there was no poll, so no commit. After a restart, it reads zero to five again. Duplicates, nothing lost.",
    ],
    [
      { t: "Case 2: lost events", b: "Events handed to a worker; poll again auto-commits 6 while the worker is still busy; crash. Restart starts at 6.", m: "0..5 never processed", rows: { c1: { cells: cells("!0 !1 !2 3 4 5"), ptrs: [{ at: 0, l: "committed", tone: "amber" }] }, c2: { cells: cells("~0 ~1 ~2 ~3 ~4 ~5"), ptrs: [{ at: 6, l: "committed", tone: "red" }] } } },
      { say: "Case two. You hand events zero to five to another thread and keep polling. One and a half seconds later, poll runs again and auto commits six, but the worker isn't done. Then the process crashes. After a restart it starts at six. Events zero to five are lost. Auto commit is simple, but you don't control when an offset is marked done, so you can get duplicates, or with asynchronous processing, lost events.", tone: "key" },
    ],
  ),
  {
    kind: "code",
    title: "Manual commit: process all, then commit",
    lang: "java",
    code: `props.put("enable.auto.commit", "false");

ConsumerRecords<String, String> records = consumer.poll(Duration.ofSeconds(1));
for (var r : records) process(r);
consumer.commitSync();   // processed 0..5 -> commits 6

// crash BEFORE commitSync -> read again   (duplicates, at-least-once)
// crash AFTER  commitSync -> nothing read again
// commitAsync(): no block, NO retry (an old commit could overwrite a newer one)`,
    highlight: [[1, 1], [3, 5], [7, 8], [9, 9]],
    beats: B(
      "Manual commit. Turn auto commit off.",
      "Poll, process all of the records, then commit sync. It commits the position, last processed plus one, six here, and waits for Kafka to confirm.",
      { say: "Crash before commit sync, and the events are read again after the restart. Crash after, and nothing is read again. So nothing is lost, but duplicates are possible. That's at least once, and so the processing must be idempotent: running it twice has the same effect as once. For example, store the processed order id and skip it if you've already seen it.", tone: "key" },
      "One more often asked detail. Commit sync blocks and retries. Commit async doesn't block and does not retry, because a retried old commit could overwrite a newer one. The common pattern: commit async inside the loop for speed, and commit sync once in the finally block before close.",
    ),
  },
  {
    kind: "sayit",
    q: "Auto-commit vs manual commit: which is dangerous and why?",
    lines: [
      "Auto-commit commits inside poll() every 5 seconds, for what the previous poll returned.",
      "Crash before the next poll: duplicates. Hand work to a thread: the commit runs ahead and events are lost.",
      "Manual commit after processing gives at-least-once: nothing lost, duplicates possible.",
      "So the consumer must be idempotent.",
    ],
    beats: B(
      "Say it like this.",
      "Auto commit commits inside poll, every five seconds, for what the previous poll returned.",
      "If I crash before the next poll I get duplicates, and if I hand work to another thread, the commit runs ahead of the processing and I can lose events.",
      "With manual commit after processing, I get at least once: nothing lost, duplicates possible.",
      { say: "So my consumer logic must be idempotent.", tone: "key" },
    ),
  },
];
