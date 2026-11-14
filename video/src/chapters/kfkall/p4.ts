import type { Scene } from "../../lib/types.ts";
import { A, CLUSTER, PIPE, QUORUM } from "./boards.ts";
import { B, L, cells, check, sec } from "./h.ts";

// Part E and F: failures on both sides; inside the producer; the idempotent
// producer.
export const p4: Scene[] = [
  // ------------------------------------------------------------ 16
  sec("16", "When brokers fail", "Topic sixteen. When things fail on the broker side: the controller, a partition leader, a follower, a whole broker. Each one is noticed by a specific timer."),
  {
    kind: "numbers",
    title: "Who notices, and how fast",
    items: [
      { value: "2 s", label: "standbys notice", sub: "the active controller is gone", tone: "purple" },
      { value: "9 s", label: "controller notices", sub: "a broker is gone", tone: "red" },
      { value: "30 s", label: "leader notices", sub: "a follower is too slow", tone: "amber" },
      { value: "45 s", label: "coordinator notices", sub: "a consumer is gone", tone: "blue" },
      { value: "5 min", label: "consumer notices", sub: "it is stuck processing", tone: "green" },
    ],
    footer: "heartbeats every 3 s from consumers, every 2 s from brokers",
    beats: B(
      "The timers, all defaults. Two seconds: controller quorum fetch timeout. Standby controllers notice the active one is gone.",
      "Nine seconds: broker session timeout. The controller notices a broker is gone.",
      "Thirty seconds: replica lag time max. A leader notices a follower is too slow.",
      "Forty five seconds: session timeout. The group coordinator notices a consumer is gone.",
      "Five minutes: max poll interval. A consumer notices it's stuck processing.",
      "Brokers heartbeat every two seconds, consumers every three. Keep these in your head; every failure story below is one of them firing.",
    ),
  },
  A(
    QUORUM,
    "The active controller fails",
    [
      { t: "Standbys keep fetching", b: "In KRaft the active controller pushes no heartbeats: standbys fetch from it, and that is how they know it is alive.", nodes: ["k1", "k2", "k3"], moves: [{ e: "s21", t: "fetch" }, { e: "s31", t: "fetch", delay: 10 }] },
      "Controller one is active, two and three are standbys, and the standbys keep fetching the metadata log from it.",
    ],
    [
      { t: "No reply for 2 s", b: "Controller 1 crashes. Fetches get no answer for 2 s: controller.quorum.fetch.timeout.ms.", m: "noticing", dead: ["k1"], nodes: ["k2", "k3"], moves: [{ e: "s21", t: "fetch?", tone: "red" }] },
      { say: "Controller one crashes. In KRaft the active controller doesn't push heartbeats; the standbys keep fetching from it, and when a fetch gets no answer for two seconds, they know it's gone.", tone: "key" },
    ],
    [
      { t: "Pre-vote, then vote", b: "Controller 2 asks 'would you vote for me?', then raises the epoch 1 to 2, votes for itself and asks. 2 of 3 = majority.", m: "one vote per voter per epoch", dead: ["k1"], nodes: ["k2", "k3"], subs: { k2: "candidate · epoch 2" }, moves: [{ e: "v23", t: "pre-vote" }, { e: "v23", t: "yes", rev: true, delay: 40, tone: "green" }, { e: "v23", t: "vote, epoch 2", delay: 80 }] },
      "First a pre vote: would you vote for me? That way a node that only lost its own network briefly can't disturb a healthy leader. Then the real election: controller two raises the epoch from one to two, votes for itself, and asks the others. Its own vote plus one more is two of three, a majority. Each voter gives at most one vote per epoch, so there can never be two winners.",
    ],
    [
      { t: "Everyone follows", b: "Brokers fetch metadata from Controller 2. Data traffic never stopped; only metadata changes paused ~2 s.", m: "the old one returns as a standby", dead: ["k1"], nodes: ["k2", "k3", "x1", "x2", "x3"], tones: { k2: "green" }, subs: { k2: "active · epoch 2" }, moves: [{ e: "b1n", t: "fetch" }, { e: "b2n", t: "fetch", delay: 8 }, { e: "b3n", t: "fetch", delay: 16 }] },
      { say: "Brokers and the remaining standby now fetch from controller two. Producers and consumers never noticed: partition leaders live on brokers and kept serving. Only metadata changes paused, for about two seconds. When controller one comes back, it sees the higher epoch and joins as a standby.", tone: "key" },
    ],
  ),
  A(
    CLUSTER,
    "A partition leader's broker fails",
    [
      { t: "Heartbeats", b: "Every broker heartbeats to the controller every 2 s. The controller watches brokers, not partitions.", nodes: ["b1", "ctl"], moves: [{ e: "h", t: "heartbeat" }] },
      "Setup: P one, replication factor three, min insync two, leader on broker two, ISR one two three, the producer on acks all. Every broker heartbeats to the controller. The controller watches brokers, not individual partitions.",
    ],
    [
      { t: "Broker 2 crashes", b: "Produce requests to it fail; the producer keeps retrying. No heartbeat for 9 s: broker.session.timeout.ms.", m: "the detection window", dead: ["b2"], nodes: ["prod"], moves: [{ e: "pw", t: "produce", tone: "red" }] },
      "Broker two crashes. The producer's sends to it fail, and it keeps retrying. After nine seconds without a heartbeat, the controller marks broker two dead.",
    ],
    [
      { t: "New leader from the ISR", b: "For every partition Broker 2 led: a new leader from the ISR only. Leader = Broker 1, ISR = {1, 3}, replica list unchanged.", m: "no data moves", dead: ["b2"], nodes: ["b1", "ctl"], tones: { b1: "green" }, subs: { b1: "P1 leader (new)\nISR {1, 3}" }, moves: [{ e: "h", t: "you lead P1", rev: true, tone: "green" }] },
      { say: "For every partition broker two led, the controller picks a new leader from the ISR only. ISR members have all committed records, so nothing acknowledged is lost. The replica list doesn't change, and no data is moved. Broker one fetches the change: it's the leader of P one now.", tone: "key" },
    ],
    [
      { t: "Clients find out by failing", b: "Nothing is pushed to clients. The failed request makes the producer refresh metadata from a live broker and retry there.", m: "3000 sent · 3000 acked · 0 lost · slowest 8.6 s", dead: ["b2"], nodes: ["prod", "b1", "b3"], tones: { b1: "green" }, subs: { b1: "P1 leader (new)" }, moves: [{ e: "pm", t: "metadata, retry" }, { e: "f31", t: "fetch", delay: 30 }] },
      "Clients are not pushed anything. The producer finds out because its request failed. It refreshes metadata from any live broker, sees the new leader, and retries there. Broker three now fetches from broker one. A producer sent three thousand keyed records with acks all, one every ten milliseconds, while a leader was killed: three thousand acked, zero lost, and the slowest single send took eight point six seconds. That's the nine second detection window. Records were only delayed.",
    ],
    [
      { t: "Two edges", b: "acks=1: records the old leader acked but followers hadn't fetched are gone. No ISR member alive: no leader, partition offline.", m: "unclean.leader.election.enable=false", dead: ["b2", "b1", "b3"], nodes: ["prod"] },
      { say: "Two edges. No data loss holds only for committed records, which needs acks all. With acks one, records the old leader acknowledged, but the followers hadn't fetched yet, are gone after failover, although the producer got success. And if no ISR member is alive, the partition has no leader and is offline. Kafka will not promote an out of sync replica, because it could be missing acknowledged data. Availability is traded for safety.", tone: "key" },
    ],
  ),
  {
    kind: "bullets",
    title: "Followers, whole brokers, coordinators, comebacks",
    firstItemStep: 1,
    items: [
      { text: "A follower dies: dropped from the ISR, no downtime while ISR >= min.insync", sub: "dead: controller, 9 s · slow: leader, 30 s", icon: "🩹" },
      { text: "A broker dies: leaders it held move to ISR members; partitions it followed shrink their ISR", icon: "🖥" },
      { text: "A topic never fails as a whole: only partitions lose their leader", icon: "🧩" },
      { text: "The coordinator's broker dies: it is just a partition leader, it fails over the same way", sub: "consumers ask 'who is my coordinator?' again", icon: "🧭" },
      { text: "Coming back: follower, truncate the uncommitted tail, catch up, rejoin the ISR, get leadership back", sub: "preferred leader = first in the replica list, checked every 5 min", icon: "↩️" },
    ],
    beats: B(
      "The rest of the broker side, quickly.",
      "A follower dies: after nine seconds the controller drops it from the ISR, and acks all now waits for fewer replicas. No downtime while the ISR stays at or above min insync. If it's alive but slow, the leader asks for its removal after thirty seconds.",
      "A whole broker dies: both at once. Partitions where it was the leader get a new leader from the ISR. Partitions where it was a follower just drop it from the ISR and keep running.",
      "A topic can't fail as a whole: it's just a name for partitions. A partition with no live ISR replica is unavailable, so keys that hash there can't be written, and the other partitions keep working.",
      "The group coordinator is simply the leader of one consumer offsets partition, so it fails over like any partition leader. Consumers' heartbeats and commits fail, they ask who is my coordinator again, and the commits are safe, because they were replicated.",
      { say: "And when a failed broker comes back: it registers, it's a follower everywhere, it cuts off any uncommitted tail the new leader never got, fetches what it missed, rejoins the ISR, and later gets its leadership back by preferred leader election, so load stays balanced. That truncation is exactly why only committed data is guaranteed.", tone: "key" },
    ),
  },

  // ------------------------------------------------------------ 17
  sec("17", "When consumers fail", "Topic seventeen. When consumers fail. Two separate checks, and the one people get wrong."),
  {
    kind: "compare",
    title: "Three ways a consumer goes away",
    cols: [
      { title: "Dead or frozen", icon: "💀", tone: "red", items: ["no heartbeats", "removed after session.timeout.ms (45 s)", "its partitions unread till then"] },
      { title: "Alive but stuck", icon: "🐢", tone: "amber", items: ["STILL heartbeating", "no poll() for max.poll.interval.ms (5 min)", "it leaves the group itself"] },
      { title: "Stops cleanly", icon: "👋", tone: "green", items: ["close() sends LeaveGroup", "rebalance immediately", "always close on shutdown"] },
    ],
    footer: "heartbeats prove alive · poll() proves progress",
    beats: B(
      "A Java consumer has two separate checks. A background heartbeat thread, every three seconds even while you process, proves the process is alive. Your poll loop, at least every five minutes, proves it's making progress. Dead or frozen: no heartbeats, removed after forty five seconds, and its partitions aren't read in the meantime.",
      "Alive but stuck in slow processing: it's still heartbeating, so it isn't caught by the session timeout at all.",
      "Stops cleanly: close sends leave group right away and the rebalance starts immediately, with no forty five second gap. Always close consumers on shutdown.",
      { say: "Heartbeats prove alive. Poll proves progress.", tone: "key" },
    ),
  },
  {
    kind: "seq",
    title: "max.poll.interval.ms exceeded",
    actors: [
      { id: "app", name: "Poll thread", icon: "🧵" },
      { id: "hb", name: "Heartbeat thread", icon: "💓" },
      { id: "gc", name: "Coordinator", icon: "🧭" },
      { id: "oth", name: "Other consumer", icon: "👤" },
    ],
    msgs: [
      { from: "hb", to: "gc", label: "heartbeat (every 3 s) OK", step: 1 },
      { from: "hb", to: "gc", label: "LeaveGroup: poll timeout", step: 2, tone: "red" },
      { from: "gc", to: "oth", label: "rebalance: you own P2", step: 3 },
      { from: "oth", to: "gc", label: "OffsetFetch: last commit", step: 3 },
      { from: "app", to: "gc", label: "commitSync()", step: 4 },
      { from: "gc", to: "app", label: "rejected: CommitFailedException", step: 4, tone: "red", dash: true },
    ],
    beats: B(
      "One batch takes six minutes, and max poll interval is five.",
      "The whole time, the heartbeat thread keeps succeeding, so the coordinator thinks everything is fine.",
      { say: "A slow consumer is still heartbeating. It's not detected by missing heartbeats. The consumer itself sees that poll hasn't been called for too long, and it leaves the group on its own.", tone: "key" },
      "Rebalance. Another consumer gets P two and starts from the last commit.",
      { say: "Then the slow one finishes and tries to commit. It's no longer the owner, so the commit is rejected with commit failed exception. The result: the work is wasted and duplicated. The new owner reprocesses the same records from the last commit.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "The fixes",
    firstItemStep: 1,
    items: [
      { text: "Increase max.poll.interval.ms if processing is truly that long", icon: "⏱" },
      { text: "Reduce max.poll.records (500), so each batch finishes faster", sub: "500 x 1 s = 500 s > 300 s: a rebalance every poll", icon: "✂️" },
      { text: "Make the processing faster", icon: "⚡" },
      { text: "Or a thread pool + pause(), committing only fully processed offsets", icon: "⏸" },
    ],
    beats: B(
      "Four fixes.",
      "Increase max poll interval, if the processing time is truly that long.",
      { say: "Reduce max poll records, default five hundred, so each batch finishes faster. The classic trap: five hundred records at one second each is five hundred seconds, over the three hundred allowed. That's a rebalance every single poll, and every commit fails.", tone: "key" },
      "Make the processing faster.",
      "Or process in a separate thread pool and keep calling poll, with pause on those partitions so poll returns nothing new, and commit only offsets that are fully processed. Otherwise you're back to losing records.",
    ),
  },
  check({
    topic: "slow consumers",
    q: "Your consumer takes 1 s per record, max.poll.records is 500, max.poll.interval.ms is the default. What goes wrong?",
    a: "500 s per batch > 300 s: the consumer leaves the group every batch, its partitions rebalance, and its commits fail with CommitFailedException. Lower max.poll.records (say 200) or speed up.",
    aSay: "Five hundred records times one second is five hundred seconds, more than the five minute default. So it leaves the group on every batch, its partitions are rebalanced and reprocessed, and its commits keep failing. Set max poll records below three hundred, say two hundred, or speed up processing.",
  }),

  // ------------------------------------------------------------ 18
  sec("18", "Inside the producer", "Topic eighteen. Inside the producer. What really happens when you call send, which turns out to be not sending."),
  A(
    PIPE,
    "send() does not send",
    [{ all: true }, { say: "send does not send anything over the network. The record passes through stages inside the producer, on your thread, and a separate background thread does the network call later.", tone: "key" }],
    [
      { t: "0 and 1: metadata, serializer", b: "First send waits for metadata. Kafka stores only bytes: key and value become byte[].", m: "a serializer that throws: send() throws, no Future", nodes: ["send", "ser"], moves: [{ e: "a", t: "Order" }] },
      "Stage zero: the producer must know the partitions and their leaders; the first send waits for that. Stage one, the serializer. Kafka only stores bytes, so the key and value become byte arrays. String serializer, or for objects, the JSON serializer that comes from spring Kafka. If serialization fails, send itself throws immediately. No future, no callback.",
    ],
    [
      { t: "2: partitioner", b: "Partition given, key hash, or sticky. The partition number is decided on your thread.", nodes: ["ser", "part"], moves: [{ e: "b", t: "bytes" }] },
      "Stage two, the partitioner: the partition you gave, the key's hash, or sticky with no key.",
    ],
    [
      { t: "3: record accumulator", b: "An in-memory buffer holding one open batch per partition. send() returns here, with a Future.", m: "batching is where the throughput comes from", nodes: ["part", "acc", "fut"], moves: [{ e: "c", t: "-> P1 batch" }, { e: "ret", t: "Future", delay: 40, tone: "teal" }] },
      { say: "Stage three, the record accumulator: an in memory buffer that keeps one open batch per topic partition. send returns here, with a future. Batching is the main reason producers achieve high throughput.", tone: "key", term: { word: "record accumulator", meaning: "in-memory buffer, one open batch per partition" } },
    ],
    [
      { t: "4 and 5: compress, send", b: "The whole batch is compressed. The one sender thread groups ready batches by leader broker: one ProduceRequest per broker.", m: "acks, retries, then callbacks", nodes: ["acc", "cmp", "snd", "bA", "bB"], moves: [{ e: "d", t: "batch" }, { e: "e", t: "zstd", delay: 24 }, { e: "g", t: "P0+P2", delay: 60 }, { e: "h", t: "P1", delay: 60 }] },
      "Stage four, compression of the whole batch. Stage five, the sender thread, exactly one per producer. It takes ready batches, groups them by leader broker, and packs them into one produce request per broker. Then it handles the acks, retries failed batches, completes the futures and runs your callbacks.",
    ],
    [
      { t: "send() can still block", b: "On your thread, for metadata or buffer space (32 MB), up to max.block.ms = 60 s.", m: "a REST thread can hang a minute", nodes: ["send", "acc"], subs: { acc: "buffer.memory full\nsend() blocks up to 60 s" }, tones: { acc: "red" } },
      { say: "Two things the pipeline picture hides. send can still block, on your thread, waiting for metadata or for buffer space. The buffer is thirty two megabytes shared by all batches; if the broker is slow and batches pile up, send blocks for up to max block ms, sixty seconds, then fails. In a REST controller that's a request thread hanging for a minute, so lower it if callers must fail fast. And failures show up in two places: before the accumulator, thrown by send; after it, through the future.", tone: "key" },
    ],
  ),
  {
    kind: "code",
    title: "Batching, compression, the sender",
    lang: "properties",
    code: `batch.size  = 16384     # 16 KB max per partition batch
linger.ms   = 5         # max wait for more records (old clients: 0)
# whichever comes first makes the batch ready

max.request.size = 1 MB # a 100 KB record with batch.size 32 KB: its own batch

compression.type = snappy   # none | gzip | snappy | lz4 | zstd
# 100 order JSONs: 13,577 bytes plain -> 1,996 with snappy

max.in.flight.requests.per.connection = 5
acks = all   retries = 2147483647   delivery.timeout.ms = 120000`,
    highlight: [[1, 3], [5, 5], [7, 8], [10, 11]],
    beats: B(
      { say: "Two knobs decide when a batch is ready to send, and whichever happens first wins. Batch size, sixteen kilobytes: once full, it's ready. Linger dot ms, five milliseconds: under low traffic a batch never fills, so after waiting that long it's sent half empty. Bigger values give more throughput and better compression, but more latency per record.", tone: "key" },
      "The often asked follow up: batch size is thirty two kilobytes, but one record is a hundred? It's not rejected. It goes alone in its own batch. A hundred kilobyte record was stored as one batch of a hundred thousand and seventy three bytes. The real limit is max request size, one megabyte.",
      "Compression is per batch. The broker stores the batch still compressed, and consumers decompress, so it saves network and broker disk. A hundred repetitive order JSONs went from thirteen and a half kilobytes to under two with snappy. Real data compresses less. Lz four or snappy for speed, zstd for the best ratio.",
      "And the sender keeps up to five requests in flight per broker connection, without waiting, which pipelines. Today's defaults: acks all, idempotence on, retries effectively infinite. The real limit is delivery timeout, two minutes, from send to success or final failure. Kafka's guidance is to leave retries alone and tune delivery timeout. One more: callbacks run on that single sender thread, so never do slow work, a DB call or an HTTP call, inside a callback. It stalls sending for the whole producer.",
    ),
  },

  // ------------------------------------------------------------ 19
  sec("19", "The idempotent producer", "Topic nineteen. The idempotent producer. Two problems retries create, and how a producer id and sequence numbers solve both."),
  L(
    [{ id: "p", label: "P0 log", sub: "idempotence OFF" }],
    "Problem 1: duplicates (needs only retries)",
    [
      { t: "The write lands, the reply doesn't", b: "The broker writes CREATED at offset 0, but the ack is lost on the network.", rows: { p: { cells: ["CREATED"] } } },
      "Problem one. The producer sends a batch: created. The broker writes it at offset zero, but the reply is lost on the network.",
    ],
    [
      { t: "Retry: written again", b: "The producer can't tell 'not written' from 'written, reply lost'. It retries: CREATED again at offset 1.", m: "even with max.in.flight=1", rows: { p: { cells: ["CREATED", "!CREATED", "PAID", "SHIPPED"] } } },
      { say: "The producer can't tell not written from written, reply lost. So it retries, and the broker writes it again, at offset one. And a correction: duplicates do not need more than one in flight request. Any retry after a lost reply causes them, even with max in flight one. The app was even told created was acked at offset one; it never knew offset zero existed.", tone: "key" },
    ],
  ),
  L(
    [{ id: "p", label: "P0 log", sub: "idempotence OFF" }],
    "Problem 2: reordering (retries AND in-flight > 1)",
    [
      { b: "Batch 1 (CREATED) is lost; batch 2 (PAID) was sent without waiting and is written first.", rows: { p: { cells: ["PAID"] } } },
      "Problem two needs retries and more than one request in flight. Batch one, created, is lost on the network. Batch two, paid, was already sent without waiting, and is written at offset zero.",
    ],
    [
      { b: "The retry of batch 1 lands after: PAID, then CREATED. A consumer sees the order paid before it was created.", m: "order broken", rows: { p: { cells: ["PAID", "!CREATED"] } } },
      "Batch one is retried and lands at offset one. Paid, then created. A consumer sees the order paid before it existed.",
    ],
  ),
  L(
    [{ id: "p", label: "Topic-A P0", sub: "PID 1001" }],
    "The fix: PID + sequence per partition",
    [
      { t: "PID and sequence", b: "The producer gets a unique PID at startup. Each record gets a sequence number counting by 1, separately per partition; the batch carries base and last.", m: "stored in the batch header", rows: { p: { cells: ["s0", "s1", "s2"] } } },
      { say: "The fix has two ideas. A PID, a producer id: a unique number the producer gets from the cluster at startup. And a sequence number: each record gets one, increasing by one, separately for each partition. A batch carries its first and last sequence. This batch for topic A, P zero, is sequence zero to two, so the next batch for that partition starts at three. Both are written into the batch header on disk.", tone: "key", term: { word: "idempotent producer", meaning: "PID + per-partition sequence; the broker drops repeats" } },
    ],
    [
      { t: "Expected next: write", b: "The leader remembers, per (PID, partition), the last sequence: 2. Batch 3..5 arrives: 3 = 2 + 1, write it.", rows: { p: { cells: ["s0", "s1", "s2", "+s3", "+s4", "+s5"] } } },
      "The partition leader remembers, for every PID and partition, the last sequence it wrote. Last was two. A batch with base three arrives: three is two plus one, the expected next. Write it, remember five.",
    ],
    [
      { t: "Lower: a duplicate", b: "The retry of 3..5 arrives again: already written. Not written again, but the reply is SUCCESS with the original offset.", m: "the producer gets the offset it lost", rows: { p: { cells: ["s0", "s1", "s2", "s3", "s4", "s5"] } } },
      { say: "Now the retry of that same batch arrives: base three again, lower than expected. It's a duplicate. The broker does not write it again, but still replies success, with the original offset. With idempotence on, the dropped reply test gave created at offset zero, paid at one, shipped at two. No duplicate.", tone: "key" },
    ],
    [
      { t: "Higher: a gap", b: "Expected 6, got 9: an earlier batch is missing. Rejected as out of order; the producer resends in order.", m: "this fixes reordering", rows: { p: { cells: ["s0", "s1", "s2", "s3", "s4", "s5", "~s9"] } } },
      "And a batch that arrives with a gap, expected six, got nine, means an earlier batch is missing. It's rejected as out of order, and the producer resends the earlier batch first. That's reordering fixed. And this state survives failover: PID and sequence are in every batch header, replicated to followers, so a new leader can rebuild it and keep deduplicating.",
    ],
  ),
  {
    kind: "compare",
    title: "What it needs, and what it does not cover",
    cols: [
      { title: "acks=all", icon: "🛡", tone: "green", items: ["acks=1: acked too early,", "lost on failover", "dedup can't bring data back"] },
      { title: "max.in.flight <= 5", icon: "5️⃣", tone: "blue", items: ["the broker keeps the last 5 BATCHES", "per (PID, partition)", "6: ConfigException at startup"] },
      { title: "Silent switch-off", icon: "🔕", tone: "amber", items: ["acks=1 alone: idempotence OFF", "only a log line says so", "set enable.idempotence=true explicitly"] },
      { title: "Not covered", icon: "🚫", tone: "red", items: ["a restart = new PID, seq 0", "send() called twice by the app", "consumer-side duplicates"] },
    ],
    footer: "exactly-once writes per partition, for one producer session",
    beats: B(
      "What it needs. Acks all. With acks one, the leader replies before followers copy the batch. If it dies, the new leader may not have the batch or its sequence state, the producer was already told success, and the record is simply lost. Idempotence stops duplicates from retries; it can't bring back data acknowledged too early.",
      "Max in flight at most five, because the broker keeps details of only the last five batches per PID and partition to recognize duplicates. Five batches, not five sequence numbers. The client refuses to start with six.",
      { say: "And the trap: it's on by default since three point oh, but acks one silently turns it off. Only a log line says idempotence will be disabled because acks is set to one. Set enable idempotence true explicitly, and then a bad config fails at startup instead of quietly dropping the guarantee.", tone: "key" },
      "What it does not cover. A producer restart gets a new PID, starting at sequence zero, so the broker can't link it to the old one: crash before the ack, restart, resend, and the records are written twice. Nor the app calling send twice for one event, nor all or nothing writes across partitions, nor consumer side duplicates. A fixed transactional id fixes the restart gap; that's the last part.",
      { say: "Say it like this: idempotence gives exactly once writes per partition for one producer session; it doesn't survive a producer restart, and it isn't end to end exactly once.", tone: "key" },
    ),
  },
  check({
    topic: "idempotence",
    q: "enable.idempotence=true is set. Can a downstream sink still see duplicates?",
    a: "Yes: a producer restart (new PID), the app sending twice, or a consumer crashing before its commit all duplicate. Idempotence only removes duplicates from one producer session's retries to one partition.",
    aSay: "Yes. Idempotence only removes duplicates caused by one producer session's own retries to one partition. A restart gets a new PID, the app can call send twice for the same event, and a consumer that crashes before committing reprocesses. The sink still has to be idempotent.",
  }),
];
