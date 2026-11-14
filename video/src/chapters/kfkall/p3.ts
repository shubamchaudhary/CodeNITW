import type { Scene } from "../../lib/types.ts";
import { A, CLUSTER, QUORUM, type Board } from "./boards.ts";
import { B, L, cells, check, sec } from "./h.ts";

// Zero-copy: the normal four-copy path vs sendfile.
const FAST: Board = {
  view: [1500, 640],
  groups: [{ x: 380, y: 80, w: 760, h: 230, t: "kernel", nodes: ["pc", "sock"] }],
  nodes: [
    { id: "disk", x: 30, y: 160, w: 260, t: "Disk", s: ".log segment" },
    { id: "pc", x: 420, y: 160, w: 300, t: "Page cache", s: "RAM, kernel" },
    { id: "sock", x: 800, y: 160, w: 300, t: "Socket buffer", s: "kernel" },
    { id: "nic", x: 1200, y: 160, w: 270, t: "Network card", s: "to the consumer" },
    { id: "jvm", x: 560, y: 470, w: 400, t: "Kafka JVM heap", s: "application memory" },
  ],
  edges: [
    { id: "d-p", from: "disk", to: "pc" },
    { id: "p-j", from: "pc", to: "jvm", fs: "b", ts: "l", via: [[570, 512]], l: "copy in", lx: 582, ly: 400, la: "start" },
    { id: "j-s", from: "jvm", to: "sock", fs: "r", ts: "b", via: [[950, 512]], l: "copy back", lx: 962, ly: 400, la: "start" },
    { id: "s-n", from: "sock", to: "nic" },
    { id: "zc", from: "pc", to: "nic", fs: "t", ts: "t", via: [[570, 40], [1335, 40]], l: "sendfile(): kernel to network", lx: 950, ly: 28 },
  ],
};

const ISR = [
  { id: "l", label: "Broker 1", sub: "leader" },
  { id: "f2", label: "Broker 2", sub: "follower" },
  { id: "f3", label: "Broker 3", sub: "follower" },
];

// Part C and D: replication, the controller and KRaft, ISR, acks,
// min.insync.replicas; the complete write and read flows; retention and
// compaction; why Kafka is fast.
export const p3: Scene[] = [
  // ------------------------------------------------------------ 9
  sec("9", "Replication: leaders and followers", "Topic nine. Replication. Every partition is copied to several brokers, and exactly one copy is in charge."),
  A(
    CLUSTER,
    "One partition, three replicas",
    [{ all: true }, "This is the cluster board we'll use for the rest of the lecture. A producer on the left. Three brokers in the middle. Controllers and a consumer on the right. We'll follow one partition, order events P one, with replication factor three."],
    [
      { t: "Replicas", b: "Each copy of a partition is a replica. One is the leader, the others are followers. RF counts all copies.", m: "RF 3 = 1 leader + 2 followers", nodes: ["b1", "b2", "b3"], tones: { b2: "green" } },
      { say: "Each partition is copied to several brokers, and each copy is a replica. For every partition, one replica is the leader and the others are followers. The replication factor counts all copies, leader included. Replication factor three is one leader and two followers.", tone: "key", term: { word: "replica", meaning: "one copy of a partition; one leader, the rest followers" } },
    ],
    [
      { t: "The leader serves", b: "All producer writes and consumer reads for P1 go to its leader, Broker 2. It tracks how far each follower has copied.", m: "followers serve no producers", nodes: ["prod", "b2", "cons"], tones: { b2: "green" }, moves: [{ e: "pw", t: "write" }, { e: "c2", t: "read", delay: 30 }] },
      "The leader handles all producer writes for the partition, and the consumer reads. It keeps the partition log and tracks how far each follower has copied. Followers do not serve producers, and by default they don't serve consumers either. Since two point four, consumers can be set to read from a nearby follower, to save cross data center traffic, but it's off by default.",
    ],
    [
      { t: "Followers pull", b: "Followers copy the leader by fetching from it, exactly like a consumer. Nothing is pushed to them.", m: "fetch, not push", nodes: ["b1", "b2", "b3"], tones: { b2: "green" }, moves: [{ e: "f1", t: "fetch" }, { e: "f3", t: "fetch", delay: 8 }, { e: "f1", t: "records", rev: true, delay: 44, tone: "green" }, { e: "f3", t: "records", rev: true, delay: 50, tone: "green" }] },
      { say: "And the followers copy data from the leader by pulling it. They send fetch requests to the leader, just like a consumer, and stay in sync, ready to become the leader if the current one fails.", tone: "key" },
    ],
    [
      { t: "Always different brokers", b: "Replicas of one partition never share a machine; leaders of different partitions are spread out.", m: "RF can't exceed the broker count", nodes: ["b1", "b2", "b3"] },
      "Two things to notice. The replicas of a partition are always on different brokers: a copy on the same machine wouldn't help when that machine dies. So the replication factor can't be more than the number of brokers. Replication factor two on a one broker cluster simply fails to create the topic. And leaders of different partitions are spread out, P zero on one broker, P one on another, so no single broker takes all the traffic.",
    ],
    [
      { t: "The leader's broker dies", b: "An in-sync follower becomes the leader and clients switch to it. Nothing acknowledged is lost if it was in sync.", m: "only leadership moves, not data", nodes: ["b1", "b3", "prod", "cons"], dead: ["b2"], tones: { b1: "green" }, subs: { b1: "P1 leader (new)" }, moves: [{ e: "f31", t: "fetch" }, { e: "pm", t: "write", delay: 20 }, { e: "c1", t: "read", delay: 40 }] },
      { say: "And this is why it all exists. Broker two dies. Broker one, an in sync follower, becomes the leader of P one. Broker three now fetches from it, and the producer and consumer switch to it. If the followers were in sync, nothing is lost. Say it like this: each partition has one leader replica that serves reads and writes, and follower replicas on other brokers that pull from it; if the leader's broker dies, an in sync follower takes over.", tone: "key" },
    ],
  ),

  // ------------------------------------------------------------ 10
  sec("10", "The controller and KRaft", "Topic ten. The controller. Someone has to decide which broker holds which replica, and which one leads. And someone has to decide who that someone is."),
  A(
    QUORUM,
    "Controllers: one active, the rest standby",
    [
      { t: "The controller", b: "Owns the cluster metadata: creates topics, picks leaders, detects dead brokers by heartbeats (2 s, dead after 9 s), fails leadership over.", m: "a special broker role", nodes: ["k1"], tones: { k1: "green" } },
      { say: "That someone is the controller, a special role that manages the cluster's metadata: facts about topics, partitions, brokers and leaders. It creates and deletes topics, chooses the leader and followers of each partition, and detects broker failures with heartbeats. Each broker sends one every two seconds, and a broker silent for nine seconds is treated as dead. Then the controller picks new leaders for its partitions from the in sync followers.", tone: "key", term: { word: "controller", meaning: "owns cluster metadata: topics, leaders, failover" } },
    ],
    [
      { t: "It moves no data", b: "When a broker dies, the controller only switches leadership to a follower that already has a copy.", m: "Leader 5 -> Leader 6, Replicas 5,6,4 unchanged", nodes: ["k1"] },
      "Two corrections. The controller does not move data when a broker dies. It only switches leadership to a follower that already has a copy. Leader five became leader six, and the replica list stayed five, six, four.",
    ],
    [
      { t: "Brokers pull the metadata", b: "In KRaft the controller pushes nothing: brokers fetch the metadata log from the active controller and apply each change.", m: "brokers appear as Observers", nodes: ["k1", "x1", "x2", "x3"], moves: [{ e: "b1k", t: "fetch", rev: false }, { e: "b2k", t: "fetch", delay: 8 }, { e: "b3k", t: "fetch", delay: 16 }] },
      { say: "And in KRaft, brokers pull the metadata. The controller does not push it to them. Brokers fetch the metadata log from the active controller and apply each change. In the quorum, they appear as observers: they copy the log, but they can't vote.", tone: "key" },
    ],
    [
      { t: "Why not one controller", b: "A single controller is a single point of failure. Run 3: one active (the Raft leader), two standby with the full log.", m: "ZooKeeper removed in Kafka 4.0", nodes: ["k1", "k2", "k3"], tones: { k1: "green" }, moves: [{ e: "s21", t: "fetch" }, { e: "s31", t: "fetch", delay: 10 }] },
      "One controller would be a single point of failure. So you run several, usually three. Only one is active, the Raft leader. The others are standby followers, and keep a full copy of the metadata log by fetching it. This used to live in ZooKeeper, a separate system you had to deploy and run. KRaft, Kafka Raft, builds it into Kafka itself: production ready in three point three, ZooKeeper deprecated in three point five and removed in four point oh.",
    ],
    [
      { t: "Who picks the active one?", b: "Not a controller of controllers, which would loop forever. The controllers vote using Raft; a majority wins.", m: "quorum = floor(N/2) + 1", nodes: ["k1", "k2", "k3"] },
      { say: "Who decides which controller is active? Not a controller of controllers, which would loop forever. The controllers vote among themselves using Raft, and a majority wins. A quorum is a majority of the voting controllers: N over two, rounded down, plus one. A decision is final only when a majority agrees.", tone: "key", term: { word: "quorum", meaning: "a majority of voting controllers: floor(N/2) + 1" } },
    ],
  ),
  {
    kind: "numbers",
    title: "How many controllers?",
    items: [
      { value: "1", label: "can lose 0", tone: "red" },
      { value: "2", label: "can lose 0", sub: "worse than it looks", tone: "red" },
      { value: "3", label: "can lose 1", tone: "green" },
      { value: "5", label: "can lose 2", tone: "green" },
    ],
    footer: "any two majorities share a node, so there can never be two leaders",
    beats: B(
      "One controller: quorum is one, it can lose nothing.",
      "Two controllers: quorum is two, so losing either one stops all metadata changes. Two tolerates zero failures, same as one.",
      "Three: quorum two, it can lose one. Four doesn't help: quorum three, it can still lose only one.",
      "Five: quorum three, it can lose two. That's why controller counts are odd.",
      { say: "And why a majority? Any two majorities of the same group always share at least one node, so two controllers can never both be elected leader at the same time. No split brain.", tone: "key" },
    ),
  },
  A(
    QUORUM,
    "How one metadata change commits",
    [
      { t: "Append", b: "The log is at 99, all committed. A new record arrives: the active controller appends 100 to its own log.", m: "committed = 99", nodes: ["k1"], subs: { k1: "log ..99, 100\ncommitted 99" } },
      "Example. The metadata log is at offset ninety nine, all committed. A new record arrives, say a topic was created. The active controller appends record one hundred to its own log.",
    ],
    [
      { t: "Standbys fetch", b: "Controller 2 fetches and appends 100. Active + one standby = 2 of 3 = majority.", m: "it does not wait for both", nodes: ["k1", "k2"], subs: { k1: "log ..100\ncommitted 99", k2: "log ..100" }, moves: [{ e: "s21", t: "fetch 100" }, { e: "s21", t: "100", rev: true, delay: 44, tone: "green" }] },
      { say: "Standbys fetch from it and append one hundred. The active controller counts itself, so with three controllers, one standby confirming is enough. Two of three is a majority. It doesn't wait for both.", tone: "key" },
    ],
    [
      { t: "Committed", b: "The active controller moves committed to 100 (the high watermark). The next fetch replies carry it; brokers apply 100.", m: "pull-based Raft", nodes: ["k1", "k2", "k3", "x1", "x2", "x3"], subs: { k1: "committed 100", k2: "committed 100", k3: "committed 100" }, moves: [{ e: "b1k", t: "100" , rev: true, tone: "green" }, { e: "b2k", t: "100", rev: true, delay: 8, tone: "green" }, { e: "b3k", t: "100", rev: true, delay: 16, tone: "green" }] },
      "The active controller moves committed to one hundred, its high watermark. The next fetch replies tell the standbys and the brokers: committed is one hundred. Brokers apply record one hundred to their view of the cluster. In KRaft, standbys and brokers pull from the active controller, and the committed offset comes back in those fetch replies. Raft textbooks describe the leader pushing entries with heartbeats; Kafka's version is pull based.",
    ],
    [
      { t: "Lose 2 of 3", b: "No new topics, no leader failover. But existing leaders keep serving reads and acks=all writes; metadata is safe on disk.", m: "the data path keeps running", dead: ["k2", "k3"], nodes: ["k1", "x1", "x2", "x3"] },
      { say: "And what if two of the three die? A correction: the cluster does not go fully down, and metadata is not lost. Creating a topic times out, and leader election can't happen. But existing partition leaders keep serving data: a producer with acks all still writes, a consumer still reads. The real risk is that the cluster can't react to the next failure.", tone: "key" },
    ],
  ),
  check({
    topic: "the controller",
    q: "3 controllers, 2 crash. Can you create a topic? Can a producer still write to an existing one?",
    a: "No topic (1 of 3 is not a majority, nothing can be committed). Yes, the write works: partition leaders on brokers keep serving; only failover is frozen.",
    aSay: "No topic can be created: one of three isn't a majority, so nothing can be committed. But yes, the producer can still write, because partition leaders live on the brokers and keep working. Leader failover just won't happen until a majority is back.",
  }),

  // ------------------------------------------------------------ 11
  sec("11", "ISR, acks and min.insync.replicas", "Topic eleven. In sync replicas, acks, and min insync replicas. Three settings that together decide whether an acknowledged write can ever be lost."),
  L(
    ISR,
    "ISR: the replicas caught up with the leader",
    [
      { t: "In-sync replicas", b: "For one partition: the replicas caught up with the leader. The leader is always in. The controller stores the ISR.", m: "ISR = {1, 2, 3}", rows: { l: { cells: cells("0 1 2 3 4 5 6"), ptrs: [{ at: 7, l: "log end" }] }, f2: { cells: cells("0 1 2 3 4 5 6") }, f3: { cells: cells("0 1 2 3 4 5 6") } } },
      { say: "ISR, the in sync replicas, is the set of replicas of one partition that are caught up with the leader. The leader is always in it, and the controller stores the ISR as part of the cluster metadata.", tone: "key", term: { word: "ISR", meaning: "the replicas caught up with the leader" } },
    ],
    [
      { b: "Broker 3 gets stuck: slow disk, GC pause. The leader keeps appending; Broker 2 keeps up.", rows: { l: { cells: cells("0 1 2 3 4 5 6 +7 +8 +9"), ptrs: [{ at: 10, l: "log end" }] }, f2: { cells: cells("0 1 2 3 4 5 6 +7 +8 +9") }, f3: { cells: cells("0 1 2 3 4 5 6"), tone: "amber" } } },
      "The leader keeps appending, seven, eight, nine. Broker two keeps up. Broker three is stuck behind, a slow disk or a long garbage collection pause.",
    ],
    [
      { t: "Time-based, not count-based", b: "In the ISR if it fully caught up at least once in the last replica.lag.time.max.ms (30 s). Slow but alive: the leader asks the controller to shrink it.", m: "ISR = {1, 2}", rows: { l: { cells: cells("0 1 2 3 4 5 6 7 8 9") }, f2: { cells: cells("0 1 2 3 4 5 6 7 8 9") }, f3: { cells: cells("0 1 2 3 4 5 6"), tone: "red", sub: "out of ISR" } } },
      { say: "When is a follower in sync? The correct rule is time based, not how many messages behind. It stays in the ISR if it has fully caught up to the leader's log end at least once in the last replica lag time max, thirty seconds by default. Three messages behind for a moment is fine. Not catching up for thirty seconds is not. A slow follower is removed by the leader asking the controller; a dead one, by the controller after nine seconds without heartbeats. It rejoins once it catches up.", tone: "key" },
    ],
    [
      { t: "Why it matters", b: "Only an ISR member can become leader: it has all committed data, so nothing acknowledged is lost on failover.", rows: { l: { cells: cells("0 1 2 3 4 5 6 7 8 9"), dead: true }, f2: { cells: cells("0 1 2 3 4 5 6 7 8 9"), tone: "green", sub: "new leader" }, f3: { cells: cells("0 1 2 3 4 5 6"), tone: "red", sub: "can't lead" } } },
      { say: "Why does the ISR matter? Only an ISR member can become the new leader. It has all committed data, so nothing acknowledged is lost on failover. Broker three, which is missing seven to nine, can never be elected.", tone: "key" },
    ],
  ),
  {
    kind: "compare",
    title: "acks: when is a write done?",
    cols: [
      { title: "acks=0", icon: "🚀", tone: "red", items: ["fire and forget", "no reply: offset -1", "can't know if it landed"] },
      { title: "acks=1", icon: "1️⃣", tone: "amber", items: ["wait for the leader only", "leader acks 50, dies before copies", "new leader has 0..49: 50 gone"] },
      { title: "acks=all (-1)", icon: "🛡", tone: "green", items: ["wait for all current ISR replicas", "safest, slower", "the default since 3.0"] },
    ],
    footer: "catch: all = all in the ISR NOW; if the ISR is just the leader, all behaves like 1",
    beats: B(
      "The producer's acks setting decides when a write counts as done. Acks zero: fire and forget. The producer doesn't wait at all, can't even know if the write landed, and gets offset minus one back.",
      "Acks one: wait for the leader only. The loss case: the leader writes offset fifty, replies success, and crashes before the followers copied it. A follower becomes leader with only zero to forty nine. Offset fifty is gone, but the producer was told it succeeded.",
      "Acks all, the same as minus one: wait for all current ISR replicas. Safest, slower, and the default since Kafka three point oh.",
      { say: "The catch: all means all replicas currently in the ISR, not all replicas. If the ISR has shrunk to only the leader, acks all behaves like acks one. That's why the next setting exists.", tone: "key" },
    ),
  },
  L(
    [
      { id: "b4", label: "Broker 4", sub: "leader" },
      { id: "b5", label: "Broker 5", sub: "replica" },
      { id: "b6", label: "Broker 6", sub: "replica" },
    ],
    "RF 3 · min.insync.replicas=2 · brokers dying",
    [
      { t: "min.insync.replicas", b: "The minimum ISR size a partition needs to ACCEPT acks=all writes. Default 1. It does not stop the ISR shrinking.", m: "ISR {4,5,6}: acks=all OK", rows: { b4: { cells: cells("0 1 2") }, b5: { cells: cells("0 1 2") }, b6: { cells: cells("0 1 2") } } },
      { say: "Min insync replicas is the minimum ISR size a partition must have to accept acks all writes. You set it per topic or per broker, and the default is one. A correction: it does not stop the ISR from shrinking, and the ISR can become empty. It only makes the leader reject acks all writes when the ISR is too small.", tone: "key", term: { word: "min.insync.replicas", meaning: "smallest ISR that still accepts acks=all writes" } },
    ],
    [
      { b: "Kill broker 5: ISR {6,4}, 2 >= 2, acks=all still OK.", m: "lose one broker: no loss, still writing", rows: { b4: { cells: cells("0 1 2 +3") }, b5: { cells: cells("0 1 2"), dead: true }, b6: { cells: cells("0 1 2 +3") } } },
      "Replication factor three, min insync two. Kill broker five. The ISR is six and four. Two is at least two, so acks all writes still succeed.",
    ],
    [
      { b: "Kill broker 6: ISR {4}. acks=all REJECTED (NotEnoughReplicas). acks=1 and acks=0 accepted; reads work.", m: "writes stop instead of risking loss", rows: { b4: { cells: cells("0 1 2 3 !x") }, b5: { cells: cells("0 1 2"), dead: true }, b6: { cells: cells("0 1 2 3"), dead: true } } },
      { say: "Kill broker six. The ISR shrinks to just four, anyway. Now acks all writes are rejected with not enough replicas exception. Acks one and acks zero writes are still accepted, and reading old data works. So unavailable isn't the whole story: only acks all writes fail.", tone: "key" },
    ],
    [
      { b: "Kill broker 4 too: ISR {}, no leader, partition offline. Restart 5: out of sync, so NOT made leader.", m: "safety over availability", rows: { b4: { cells: cells("0 1 2 3"), dead: true }, b5: { cells: cells("0 1 2"), dead: true, sub: "back, out of sync" }, b6: { cells: cells("0 1 2 3"), dead: true } } },
      "Kill broker four too. The ISR is empty, there's no leader, and the partition is offline. Restart broker five: it's alive, but it was out of sync and may miss acknowledged data, so it is not made leader. The standard safe setup is replication factor three, min insync two, acks all. Lose one broker, no loss and still writing. Lose two, and writes stop instead of risking loss. And min insync equal to the replication factor would block writes on every single broker restart.",
    ],
  ),
  check({
    topic: "acks and ISR",
    q: "RF 3, min.insync.replicas=3, acks=all. One broker restarts for a deploy. What happens to writes?",
    a: "The ISR drops to 2 < 3, so every acks=all write is rejected until it is back and caught up. That's why RF 3 with min.insync 2 is the usual choice.",
    aSay: "The ISR drops to two, which is less than three, so every acks all write is rejected until that broker is back and caught up. Setting min insync equal to the replication factor means any single restart blocks writes. That's why replication factor three with min insync two is the usual choice.",
  }),

  // ------------------------------------------------------------ 12
  sec("12", "The complete write flow", "Topic twelve. The complete write flow: one keyed event, from the producer's send to the acknowledgement, across three machines."),
  {
    kind: "bullets",
    title: "Two words both flows turn on",
    firstItemStep: 1,
    items: [
      { text: "Log end offset (LEO): the next offset to be written", sub: "a replica holding 0..510 has LEO 511", icon: "⏭" },
      { text: "High watermark (HW): the lowest LEO across the ISR", sub: "below the HW = committed: every in-sync replica has it", icon: "🌊" },
    ],
    beats: B(
      "Two terms first. Both flows turn on them.",
      "The log end offset is the next offset to be written. A replica holding zero to five hundred ten has a log end offset of five eleven.",
      { say: "And the high watermark is the lowest log end offset across all the ISR replicas. Records below the high watermark are committed: every in sync replica has them. Remember the high watermark. Both flows turn on it.", tone: "key", term: { word: "high watermark", meaning: "lowest LEO in the ISR; below it = committed" } },
    ),
  },
  A(
    CLUSTER,
    "Write: key order-123, acks=all",
    [
      { t: "A. Find the leader", b: "The producer asks any bootstrap broker for metadata. The broker answers from its own cache; the producer caches it (5 min).", m: "not forwarded to the controller", nodes: ["prod", "b1"], moves: [{ e: "pm", t: "metadata?" }, { e: "pm", t: "P1 on Broker 2", rev: true, delay: 46, tone: "green" }] },
      { say: "Phase A, find the leader. The producer only knows a few bootstrap server addresses. It asks any one broker: for order events, which broker leads each partition? The broker answers from its own copy of the cluster metadata. A correction: it does not forward the request to the active controller. Even with two of three controllers dead, a freshly started producer still got metadata and wrote. The producer caches the answer and refreshes every five minutes, or when a broker says I am not the leader.", tone: "key" },
    ],
    [
      { t: "Pick the partition", b: "The producer computes murmur2(order-123) mod 3 = 1 itself. Leader of P1 = Broker 2.", m: "the phone book once, then dial direct", nodes: ["prod"], subs: { prod: "murmur2 % 3 = 1" } },
      "Then it computes the partition itself: murmur two of order one two three, mod three, is one. The leader of P one is broker two. Like looking up the phone book once, then dialling the right person directly, instead of calling reception for every message.",
    ],
    [
      { t: "B. Send and write", b: "Batched (up to 16 KB, linger 5 ms), sent straight to the leader. Appended to the OS page cache at offset 101; LEO = 102.", m: "no other broker in the path", nodes: ["prod", "b2"], subs: { b2: "P1 leader\n101 appended · LEO 102" }, tones: { b2: "green" }, moves: [{ e: "pw", t: "batch: order-123", once: true }] },
      "Phase B, send and write. The producer doesn't send each record alone. It groups records for the same partition into a batch, waiting up to linger dot ms, five milliseconds, and sends the batch straight to broker two. Broker two appends it to the end of the P one log, and the record gets offset one oh one. Writes to disk really means writes to the operating system's page cache. Fast.",
    ],
    [
      { t: "C. Followers pull", b: "Brokers 1 and 3 fetch from 101 and get record 101. Their next fetch, from 102, says: I have 101.", m: "the fetch offset IS the ack", nodes: ["b1", "b2", "b3"], tones: { b2: "green" }, subs: { b1: "fetch from 101 -> has 101", b3: "fetch from 101 -> has 101", b2: "P1 leader · LEO 102" }, moves: [{ e: "f1", t: "fetch 101" }, { e: "f3", t: "fetch 101", delay: 6 }, { e: "f1", t: "101", rev: true, delay: 46, tone: "green" }, { e: "f3", t: "101", rev: true, delay: 52, tone: "green" }] },
      { say: "Phase C, the followers copy, and they pull. Brokers one and three send fetch from one oh one, and get the record. Then they fetch from one oh two. And that fetch offset carries the information: asking for one oh two means I already have everything up to one oh one. No separate ack message is needed.", tone: "key" },
    ],
    [
      { t: "HW moves to 102", b: "Every ISR replica has passed 101, so the leader moves the high watermark to 102. Offset 101 is committed.", nodes: ["b2"], tones: { b2: "green" }, subs: { b2: "HW 102 · 101 committed", b1: "has 101", b3: "has 101" }, moves: [{ e: "f1", t: "fetch 102" }, { e: "f3", t: "fetch 102", delay: 6 }] },
      "When every ISR replica has passed one oh one, the leader moves the high watermark to one oh two. Offset one oh one is now committed.",
    ],
    [
      { t: "D. Reply", b: "acks=all: after the HW passes the record. acks=1: right after phase B. acks=0: no reply at all.", m: "Success: partition 1, offset 101", nodes: ["prod", "b2"], tones: { b2: "green" }, subs: { b2: "HW 102 · 101 committed" }, moves: [{ e: "pw", t: "ok: P1 @101", rev: true, tone: "green", once: true }] },
      { say: "Phase D, the reply. With acks all, the leader answers the producer only after the high watermark passes the record: success, partition one, offset one oh one. With acks one, the reply would have gone right after phase B, before any follower had it. With acks zero, there's no reply at all.", tone: "key" },
    ],
    [
      { t: "If the leader moved meanwhile", b: "The send fails (connection error or 'not leader'). The producer refreshes metadata and retries on the new leader; your code sees nothing.", m: "until delivery.timeout.ms (2 min)", nodes: ["prod", "b1"], dead: ["b2"], tones: { b1: "green" }, subs: { b1: "P1 leader (new)" }, moves: [{ e: "pm", t: "retry batch" }] },
      "And if broker two died between phase A and phase B? The send fails, with a connection error, or not leader for partition. The producer refreshes its metadata, learns broker one leads now, and retries the batch there automatically. Your application code sees nothing, unless the retries run out at delivery timeout, two minutes by default.",
    ],
  ),
  L(
    [
      { id: "l", label: "Broker 2", sub: "leader P1" },
      { id: "a", label: "Broker 1", sub: "follower" },
      { id: "c", label: "Broker 3", sub: "follower" },
    ],
    "The high watermark, record by record",
    [
      { b: "Leader appends 101: LEO 102. Followers still at LEO 101. HW stays 101: 101 is not committed yet.", rows: { l: { cells: cells("98@98 99@99 100@100 +101@101"), ptrs: [{ at: 3, l: "HW" }] }, a: { cells: cells("98@98 99@99 100@100") }, c: { cells: cells("98@98 99@99 100@100") } } },
      "The same thing as logs. The leader appends one oh one, so its log end offset is one oh two. The followers are still at one oh one. The high watermark, the lowest log end in the ISR, stays at one oh one. So one oh one isn't committed yet.",
    ],
    [
      { b: "Both followers fetch 101. Lowest LEO in the ISR = 102, so HW = 102: 101 committed, the producer gets its ack.", m: "consumers only see below the HW", rows: { l: { cells: cells("98@98 99@99 100@100 +101@101"), ptrs: [{ at: 4, l: "HW" }] }, a: { cells: cells("98@98 99@99 100@100 +101@101") }, c: { cells: cells("98@98 99@99 100@100 +101@101") } } },
      { say: "Both followers fetch it. Now the lowest log end in the ISR is one oh two, the high watermark moves to one oh two, and one oh one is committed. That's the moment the acks all producer is answered. And as we'll see next, it's also the line consumers can't read past.", tone: "key" },
    ],
  ),

  // ------------------------------------------------------------ 13
  sec("13", "The complete read flow", "Topic thirteen. The complete read flow. A consumer of notification service ends up owning P one. Seven requests, in order."),
  A(
    CLUSTER,
    "Read: group notification-service",
    [
      { t: "A. Coordinator and leaders", b: "Metadata from any broker, then FindCoordinator. The BROKER computes abs(hash) % 50 = 23: the leader of __consumer_offsets P23 is Broker 3.", m: "the consumer doesn't hash", nodes: ["cons", "b3"], moves: [{ e: "cc", t: "FindCoordinator" }, { e: "cc", t: "Broker 3", rev: true, delay: 46, tone: "green" }] },
      { say: "Phase A. Metadata, the same as for the producer: which broker leads each partition. Then find the group coordinator: the broker that tracks this group's members and commits. The consumer just asks: who is the coordinator for notification service? The broker computes the absolute hash mod fifty, twenty three, and the leader of consumer offsets partition twenty three, broker three, is the coordinator.", tone: "key" },
    ],
    [
      { t: "B. Join the group", b: "JoinGroup, then SyncGroup: the coordinator waits for all members and hands each its partitions. This consumer gets P1.", m: "classic: a CONSUMER computes the split", nodes: ["cons", "b3"], moves: [{ e: "cc", t: "JoinGroup" }, { e: "cc", t: "SyncGroup", delay: 24 }, { e: "cc", t: "you own P1", rev: true, delay: 60, tone: "green" }] },
      { say: "Phase B, join the group. The consumer asks the coordinator to join, the coordinator waits for all members, then gives each one its partitions. A correction on who computes the split. In the default classic protocol, one consumer is picked as group leader and computes the assignment. The coordinator only collects it and hands it out: that's the sync group step. In the newer protocol, group protocol equals consumer, the coordinator computes it. The default is still classic.", tone: "key" },
    ],
    [
      { t: "C. Where did we stop?", b: "OffsetFetch for (notification-service, order-events, 1): 100, the next offset to read.", m: "start AT 100, not 101", nodes: ["cons", "b3"], moves: [{ e: "cc", t: "OffsetFetch" }, { e: "cc", t: "100", rev: true, delay: 46, tone: "green" }] },
      "Phase C, where did the group stop? The coordinator looks up the key notification service, order events, partition one, in its map built from consumer offsets partition twenty three, and returns one hundred. One hundred means the next offset to read, so the consumer starts at one hundred, not one oh one. And this is group progress data in an ordinary internal topic on brokers, not the controllers' metadata.",
    ],
    [
      { t: "D. Fetch from the leader", b: "Fetch P1 from 100, straight from the partition leader. Returns 100..500, only below the HW. Up to 1 MB per partition, 500 per poll.", m: "the coordinator is not in this path", nodes: ["cons", "b2"], tones: { b2: "green" }, moves: [{ e: "c2", t: "fetch from 100", rev: true }, { e: "c2", t: "100..500", delay: 46 }] },
      { say: "Phase D. The consumer fetches directly from the leader of the partition, broker two. The coordinator isn't in this path. Size limits per request: one megabyte per partition, fifty megabytes total, and poll returns at most five hundred records at a time. And the leader returns only records below the high watermark. Uncommitted records stay invisible, so a consumer never reads something that could vanish in a leader failover.", tone: "key" },
    ],
    [
      { t: "Process, commit 501", b: "After processing 100..500 it commits 501. The coordinator appends to __consumer_offsets P23 and waits for that partition's ISR, like acks=all.", m: "the consumer has no acks setting", nodes: ["cons", "b3"], moves: [{ e: "cc", t: "OffsetCommit 501" }, { e: "cc", t: "commit OK", rev: true, delay: 50, tone: "green" }] },
      "After processing one hundred to five hundred, the consumer commits five oh one, the next one to read. The coordinator writes that commit to consumer offsets partition twenty three and waits until that partition's in sync replicas have it, like acks all. The consumer has no acks setting for commits.",
    ],
    [
      { t: "Loop, and pull", b: "Next fetch from 501. Every movement is a fetch. Empty topic: long polling (fetch.min.bytes 1, fetch.max.wait.ms 500).", m: "own speed · batching · replay", nodes: ["cons", "b2"], tones: { b2: "green" }, moves: [{ e: "c2", t: "fetch from 501", rev: true }, { e: "c2", t: "501..", delay: 46 }] },
      { say: "Then the loop: the next fetch starts at five oh one. Notice that in both flows every data movement is a fetch. Kafka never pushes data to consumers. Pull lets each consumer set its own speed without being flooded, gives good batching, and makes replay trivial: just fetch an older offset. And with no new data? Long polling. The broker holds the request open until at least fetch min bytes of data exists, or five hundred milliseconds pass. No busy loop.", tone: "key" },
    ],
  ),
  check({
    topic: "the read flow",
    q: "The consumer processed 100..500, then crashed before the commit. A new member takes over P1. Where does it start?",
    a: "At 100. The last commit was still 100, so 100..500 are processed again: at-least-once.",
    aSay: "At one hundred. The last commit was still one hundred, so records one hundred to five hundred are processed again. Duplicates: that's at least once, and why processing should be idempotent.",
  }),

  // ------------------------------------------------------------ 14
  sec("14", "Retention and compaction", "Topic fourteen, briefly. How old data leaves: delete by time or size, or compact by key."),
  {
    kind: "compare",
    title: "cleanup.policy",
    cols: [
      { title: "delete by time", icon: "⏳", tone: "blue", items: ["retention.ms: 7 days", "whole segment, once its NEWEST record is older", "offsets never restart"] },
      { title: "delete by size", icon: "📏", tone: "amber", items: ["retention.bytes, PER PARTITION", "drop oldest only while the rest stays >= limit", "1 GB: 600 + 600 + 300 MB -> nothing deleted"] },
      { title: "compact", icon: "🗜", tone: "green", items: ["keep the latest value per key", "offsets and order kept, with gaps", "never the active segment"] },
    ],
    footer: "always by whole segment, by a background cleaner",
    beats: B(
      "The setting is cleanup policy: delete, the default, or compact. Delete by time: retention dot ms, seven days by default. A segment is deleted once its newest record is older than that, by record timestamps, not the file's creation time. Even the active segment goes once it expires; Kafka rolls a new empty one, and offsets never restart: the next record still gets the next number.",
      "Delete by size: retention bytes, and the limit is per partition, not per topic. Kafka deletes the oldest segments, but only while what remains stays at or above the limit. Limit one gigabyte, segments of six hundred, six hundred and three hundred megabytes: nothing is deleted, because removing the first would leave nine hundred, below the limit.",
      "Compact keeps only the latest value for each key. For topics that are current state per key, like a user's profile. Kafka's own consumer offsets topic is compacted.",
      "And both work by whole segment, in background threads, with no promise of when.",
    ),
  },
  L(
    [{ id: "t", label: "profiles", sub: "compacted" }],
    "Compaction keeps the last value per key",
    [
      { b: "user1 v1, user2 v1, user1 v2, user3 v1, user2 v2.", rows: { t: { cells: ["u1 v1@100", "u2 v1@101", "u1 v2@102", "u3 v1@103", "u2 v2@104"] } } },
      "Five records: user one version one, user two version one, user one version two, user three, user two version two.",
    ],
    [
      { t: "After compaction", b: "Only the latest per key: 102, 103, 104. Offsets don't change, order is kept, with gaps.", m: "survivors are not renumbered", rows: { t: { cells: ["~u1 v1@100", "~u2 v1@101", "+u1 v2@102", "+u3 v1@103", "+u2 v2@104"] } } },
      { say: "After compaction, only the latest per key survives: one oh two, one oh three, one oh four, in that order. Offsets don't change and order is kept, with gaps where records were removed. Survivors are never renumbered or reordered.", tone: "key" },
    ],
    [
      { t: "The active segment", b: "user1 v3 lands in the active segment, which is never compacted: user1 appears twice. Readers take the LAST value per key.", rows: { t: { cells: ["+u1 v2@102", "+u3 v1@103", "+u2 v2@104", "u4 v1@105", "*u1 v3@106"] } } },
      "But the active segment is never compacted. User one version three lands at one oh six, in the newer segment, so user one still appears twice. A reader of a compacted topic must take the last value per key, not assume one record per key.",
    ],
  ),

  // ------------------------------------------------------------ 15
  sec("15", "Why Kafka is fast", "Topic fifteen. Why Kafka is fast, even though it writes everything to disk. Asked in almost every Kafka interview."),
  A(
    FAST,
    "Sequential writes, page cache, zero-copy",
    [
      { t: "Writes: append + page cache", b: "Disk is slow when you jump around. Kafka only appends: sequential I/O. write() returns once the data is in the OS page cache.", m: "no fsync per message by default", nodes: ["disk", "pc"], moves: [{ e: "d-p", t: "flush later", rev: true, tone: "teal" }] },
      { say: "Disk is slow when you jump around: random access. Kafka never jumps around on writes. The log is append only: no insert in the middle, no update in place. So every write lands at the end of the file. That's sequential I O, the fastest thing a disk can do. And the write doesn't even wait for the disk. Kafka hands the data to the operating system, which keeps it in RAM, the page cache, and writes it to disk later. No forced disk sync per message by default.", tone: "key" },
    ],
    [
      { t: "Durability from replication", b: "With acks=all every ISR replica has the write, so one machine losing power before its flush loses nothing.", m: "not from fsync", nodes: ["pc"] },
      "So where does durability come from? Replication, not syncing each write. With acks all, a write is confirmed only after every in sync replica has it. If one machine loses power before its flush, the other replicas still have the data. And consumers mostly read what was just written, so reads usually come straight from the page cache too.",
    ],
    [
      { t: "The normal way: four copies", b: "Disk, page cache, copy into the JVM heap, copy back to a socket buffer, network card.", m: "CPU, memory and GC for nothing", nodes: ["disk", "pc", "jvm", "sock", "nic"], moves: [{ e: "d-p", t: "1" }, { e: "p-j", t: "2", delay: 30 }, { e: "j-s", t: "3", delay: 60 }, { e: "s-n", t: "4", delay: 90 }] },
      "Reads. The normal way to send a file over the network is four copies: disk to page cache, copy into the application's memory, the JVM heap, copy back into a kernel socket buffer, then to the network card.",
    ],
    [
      { t: "Zero-copy: sendfile()", b: "Kafka says only: send bytes X..Y of this file to this socket. The kernel moves them from the page cache to the network.", m: "works because disk format = network format", nodes: ["pc", "nic"], moves: [{ e: "zc", t: "sendfile", tone: "green" }] },
      { say: "Kafka's way: don't bring the data into my process at all. It calls sendfile, saying only: send bytes X to Y of this file to this socket. The data never enters the Kafka JVM. No copy into the heap and back, so less CPU, less memory, and less garbage collection. It works because Kafka stores batches on disk in the exact format it sends over the network. There's nothing to change on the way out. It's lost with TLS, because the data must be encrypted inside the JVM, and with old clients that need format conversion.", tone: "key" },
    ],
  ),
  {
    kind: "sayit",
    q: "How does Kafka achieve high throughput?",
    lines: [
      "Writes are sequential appends into the OS page cache.",
      "Durability comes from replication, not a per-write fsync.",
      "Reads use zero-copy sendfile: page cache to socket, never through the JVM.",
      "And producers batch and compress per partition.",
    ],
    beats: B(
      "Say it like this.",
      "Kafka is fast because writes are sequential appends into the operating system's page cache,",
      "durability comes from replication instead of a per write fsync,",
      "and reads use zero copy sendfile, so data goes from the page cache to the socket without entering the JVM.",
      { say: "And on top, producers batch and compress records per partition, so there are few, large requests.", tone: "key" },
    ),
  },
];
