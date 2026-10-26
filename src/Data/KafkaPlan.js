// The Kafka interview plan ("Survive a 1-Hour Kafka Round"), shown in the
// Projects stack's "Kafka plan" section: one topic per phase. The plan itself
// is fixed here — it can't be edited on the page — while every tickable item
// keeps its tick in KEYS.KP_CHECKED (cloud-synced), and the topic's own notes
// stay free to write in below it.
//
// A topic's plan is a list of blocks:
//   { type: "p" | "note", text }          a paragraph, or a highlighted aside
//   { type: "h", text }                    a subheading
//   { type: "list", ordered?, items }      bullets (strings)
//   { type: "table", head, rows }          a table (strings)
//   { type: "pre", text }                  a monospace sketch
//   { type: "check", id, text, answer?, links? }
//                                          a tickable item; `answer` (a block
//                                          list or a string) opens on demand
//   { type: "card", id, title, tag?, blocks }
//                                          a concept with its own tick
// Strings take `code`, **bold** and [label](https://…). Item ids are storage
// keys: never rename or reuse one.

const yt = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
const HI_VIDEO = "https://www.youtube.com/watch?v=DU8o-OTeoCc";
const HI_WRITEUP = "https://www.hellointerview.com/learn/system-design/deep-dives/kafka";
const SRC = {
  tekion: "https://leetcode.com/discuss/post/7774031/tekion-corp-sde-2-interview-experience-m-a4qs/",
  oracle: "https://leetcode.com/discuss/post/7369523/oracle-ic-2-interview-experience-backend-85b8/",
  startup: "https://leetcode.com/discuss/post/8187657/interview-exp-at-a-startup-sde-2-backend-cuxg/",
  kotak: "https://leetcode.com/discuss/post/8459028/kotak-mahindra-bank-sde2-interview-exper-784u/",
  fynd: "https://leetcode.com/discuss/post/6702653",
  blinkit: "https://leetcode.com/discuss/interview-experience/5332560/",
};

const playlistVideo = (n, title, minutes, level, what) => ({
  type: "check",
  id: `kp2-v${n}`,
  text: `**#${n} ${title}** (${minutes} m, ${level}): ${what}`,
  links: [{ label: "Find on YouTube", url: yt(`Concept && Coding ${title} Kafka`) }],
});

export const KAFKA_PLAN = {
  "KP-01": [
    { type: "p", text: "Five phases, about 13 hours in total, finished by a mock 1-hour round. Do them in order. Each phase builds the vocabulary the next one tests." },
    {
      type: "table",
      head: ["Phase", "What", "Time"],
      rows: [
        ["1", "HelloInterview Kafka deep dive", "1 h"],
        ["2", "Trimmed playlist (13 videos at 1.5x)", "5.5 h"],
        ["3", "Core concepts, re-read and draw from memory", "2 h"],
        ["4", "Interview questions: answer out loud, then check", "2 h"],
        ["5", "DeepLogLens defence: fill every blank yourself", "2 h"],
        ["Mock", "Mock 1-hour round with Claude", "1 h"],
      ],
    },
    { type: "p", text: "Tags used: **[Most asked]** comes up in almost every Kafka discussion. **[Often asked]** is a common follow-up. **[Sometimes asked]** is a depth signal for SDE-2." },
    { type: "h", text: "What a 1-hour Kafka-heavy round usually looks like" },
    { type: "p", text: "Interviewers start conceptual, then push on failure edges: what happens when a consumer crashes, can you get exactly-once into Postgres, why is lag high on one partition. Roughly:" },
    {
      type: "list",
      ordered: true,
      items: [
        "0-10 min: walk through your project and why Kafka.",
        "10-30 min: core concepts (partitions, consumer groups, offsets, replication).",
        "30-50 min: failure scenarios (crash, duplicates, rebalancing, lag, poison message).",
        "50-60 min: design trade-offs (Kafka vs alternatives, outbox, scaling).",
      ],
    },
    { type: "note", text: "Rule for every phase: answer each question on paper or out loud before reading the answer. If you can't, that's your weak spot. Mark it, rewatch the mapped video, then try again." },
    { type: "check", id: "kp1-read-plan", text: "Read the plan and blocked the 13 hours in the planner" },
  ],

  "KP-02": [
    { type: "p", text: "Start here because it shows when to use Kafka in a design, which is the lens every later question is asked through. It's a 43-minute video plus a free written version." },
    {
      type: "table",
      head: ["Chapter", "Starts at", "Take away"],
      rows: [
        ["Motivating example", "1:53", "Why a log of events beats direct service calls"],
        ["Overview", "8:09", "Broker, topic, partition, offset, producer, consumer group"],
        ["When to use", "18:41", "Kafka as a queue (async work) vs as a stream (many readers, replay)"],
        ["Deep dives", "23:43", "Hot partitions, durability (acks, replication), retries and DLQ, batching, retention"],
      ],
    },
    {
      type: "check",
      id: "kp1-watched",
      text: "Watched the video or read the write-up",
      links: [
        { label: "Video", url: HI_VIDEO },
        { label: "Write-up", url: HI_WRITEUP },
      ],
    },
    { type: "h", text: "After watching, close the tab and answer" },
    { type: "check", id: "kp1-q-draw", text: "Draw producer → topic (3 partitions) → consumer group (2 consumers). Which consumer gets which partition?" },
    { type: "check", id: "kp1-q-celebrity", text: "One celebrity key gets 50% of all traffic. What breaks, and what are two fixes?" },
    { type: "check", id: "kp1-q-not-kafka", text: "When would you NOT pick Kafka? Name one simpler alternative and say why." },
    { type: "note", text: "The LL-08 Kafka deep dive chapter (LogLens section) covers the same ground in more depth, with diagrams." },
  ],

  "KP-03": [
    { type: "p", text: "Watch 13 of the 27 videos from **Event Driven Architecture (with Kafka) from Basics to Advanced**, by Concept && Coding (Shrayansh), in this order. The demos use Java and Spring Boot, which matches your stack. About 8.2 h, 5.5 h at 1.5x." },
    playlistVideo(2, "Kafka Architecture Part 1", 32, "Must", "topic, partition, offset, broker"),
    playlistVideo(3, "Kafka Architecture Part 2", 31, "Must", "consumer groups, partition assignment"),
    playlistVideo(4, "Kafka Architecture Part 3", 33, "Must", "replication, leader, ISR"),
    playlistVideo(5, "Kafka Architecture Part 4", 29, "Must", "controller, KRaft vs ZooKeeper"),
    playlistVideo(6, "Kafka Architecture Part 5", 17, "Must", "remaining internals (retention, segments)"),
    playlistVideo(8, "How Kafka Producer Works Internally", 46, "Must", "acks, batching, retries, partitioner. Asked as \"why is Kafka fast\" and \"latency vs throughput\"."),
    playlistVideo(10, "Producer Idempotency Internals", 34, "Must", "PID + sequence numbers. Asked directly as producer-level idempotency in an Oracle IC-2 round."),
    playlistVideo(11, "Consumer Setup Part 1", 48, "Must", "poll loop, offset commit, auto vs manual commit"),
    playlistVideo(13, "Consumer Exception Handling and DLT", 59, "Must", "retries, poison messages, dead letter topic"),
    playlistVideo(14, "Consumer Advanced Configs Part 3", 36, "Must", "max.poll.interval.ms, session timeout, rebalancing"),
    playlistVideo(15, "Producer Transaction Handling", 62, "Should, upgraded", "transactional.id, epoch, zombie fencing. \"How does exactly-once work?\" is a standard follow-up, and your resume claims exactly-once effects."),
    playlistVideo(16, "Consumer Transaction Handling", 45, "Should, upgraded", "read_committed, LSO, aborts. Watch with #15 to explain why EOS stops at Kafka."),
    playlistVideo(18, "Outbox Pattern Part 1 (Polling)", 19, "Should", "dual-write problem. Asked directly in a Kotak SDE-2 round."),
    { type: "note", text: "The per-part topics for Architecture Parts 1-5 are approximate. Treat the five together as one block covering all the core architecture." },
    { type: "p", text: "After each video: write 3 lines from memory in your own words in the notes below. If you can't, rewatch only that part at 1x." },
    { type: "h", text: "Second look: the other 14 videos" },
    { type: "p", text: "Verdict: none of them is needed for a backend SDE-2 round. Real SDE-2 backend reports (Oracle IC-2, Tekion, Fynd, Kotak, a startup SDE-2) test producer and consumer reliability, idempotency, outbox, rebalancing, and why Kafka is fast. Kafka Streams shows up in Java question banks, but not in any of those reports. Optional: watch only if the trigger applies." },
    {
      type: "list",
      items: [
        "**#20 Kafka Streams Introduction** (15 m). Trigger: an HLD round with real-time aggregation (leaderboard, ad-click counts, trending). Cheap context.",
        "**#27 Kafka Streams Windowing** (53 m). Same trigger. Tumbling, hopping and session windows; Phase 3 note 20 covers the interview depth.",
        "**#12 Multi-Topic and Multi-Consumer Patterns** (63 m). Trigger: your DeepLogLens consumer uses Spring concurrency > 1 or several listeners. You'll be asked how threads map to partitions.",
        "**#17 Schema Registry with Avro** (84 m). Trigger: the JD mentions Avro, Protobuf or Schema Registry. Otherwise Phase 3 note 19 is enough.",
        "**#19 Outbox Part 2 (CDC, Debezium)** (29 m). Trigger: the JD mentions CDC or Debezium.",
        "**#1 EDA Introduction** (29 m). Trigger: you can't explain event-driven vs request-driven after HelloInterview. Skim at 2x.",
      ],
    },
    { type: "p", text: "Skip: #7 cluster setup, #9 producer setup code, and #21-26 (Streams architecture, setup, KStream vs KTable, SerDes, stateless and stateful nodes). Exception: if a JD says Kafka Streams, Flink or stream processing, watch #20, #21, #23 and #27 before that interview." },
  ],

  "KP-04": [
    { type: "p", text: "Kafka is a distributed, append-only log. Reading a message does not delete it, so many readers can read the same data and replay it later. Every concept below follows from that one idea." },
    { type: "pre", text: "Producer ──► topic orders ─┬─ P0 ─┬─► group A: consumer 1 (P0, P1)\n                         ├─ P1 ─┤   group A: consumer 2 (P2)\n                         └─ P2 ─┴─► group B: consumer 1 (P0, P1, P2)" },
    { type: "p", text: "Redraw this from memory before moving on. If you can, you already hold concepts 1 and 2. Tick each concept only when you can explain it without notes." },
    {
      type: "card",
      id: "kp3-c1",
      title: "1. Topic, partition, offset, key",
      tag: "Most asked",
      blocks: [
        { type: "p", text: "A topic is split into partitions. Each partition is an ordered file where every message gets an increasing number, its offset." },
        {
          type: "list",
          items: [
            "Example: topic `orders` has 3 partitions. Order events for user 42 always land in the same partition because the producer sends `hash(key) % 3` with `key = user42`.",
            "Ordering is guaranteed only inside one partition. Never say \"Kafka guarantees ordering\" without that qualifier.",
            "No key: the producer spreads messages across partitions (sticky partitioner fills one batch, then moves on).",
            "Hot key: one key gets most of the traffic, so one partition and one consumer become the bottleneck. Fix: a better key, or salt the key (`user42-0..3`) if strict per-key order isn't needed.",
            "Partition count can grow but never shrink, and growing it changes which partition a key maps to. Plan it up front.",
          ],
        },
      ],
    },
    {
      type: "card",
      id: "kp3-c2",
      title: "2. Consumer groups",
      tag: "Most asked",
      blocks: [
        { type: "p", text: "Inside one group, each partition is read by exactly one consumer. Different groups each get every message." },
        {
          type: "list",
          items: [
            "3 partitions + 2 consumers: one consumer gets 2 partitions, the other gets 1.",
            "3 partitions + 5 consumers: 2 consumers sit idle. Max parallelism = partition count.",
            "Want the same events to go to search indexing and to analytics? Use two groups. Both read everything, independently.",
          ],
        },
      ],
    },
    {
      type: "card",
      id: "kp3-c3",
      title: "3. Offsets and commits",
      tag: "Most asked",
      blocks: [
        { type: "p", text: "A group saves its position per partition (the committed offset) in an internal topic, `__consumer_offsets`. After a restart, it resumes from there." },
        {
          type: "list",
          items: [
            "Auto-commit (`enable.auto.commit=true`) commits on a timer, which can commit messages you haven't finished processing. A crash then loses them.",
            "Manual commit after processing is the safe default for at-least-once.",
          ],
        },
      ],
    },
    {
      type: "card",
      id: "kp3-c4",
      title: "4. Delivery semantics",
      tag: "Most asked",
      blocks: [
        { type: "p", text: "Where you commit decides what a crash does to you." },
        { type: "pre", text: "At-most-once:  commit -> process -> CRASH         => message lost\nAt-least-once: process -> CRASH -> (no commit) => message reprocessed (duplicate)\nExactly-once effect: at-least-once + idempotent write => duplicate is harmless" },
        {
          type: "list",
          items: [
            "Most real systems run at-least-once plus idempotent handlers. Duplicates are cheap to absorb; lost messages usually aren't.",
            "Idempotent write example: `INSERT ... ON CONFLICT (archive_id, chunk_id) DO NOTHING`. Processing twice leaves one row.",
          ],
        },
      ],
    },
    {
      type: "card",
      id: "kp3-c5",
      title: "5. Replication, ISR, acks",
      tag: "Most asked",
      blocks: [
        { type: "p", text: "Each partition has one leader and some followers on other brokers. ISR (in-sync replicas) = replicas fully caught up with the leader." },
        {
          type: "list",
          items: [
            "`acks=0`: don't wait. Fastest, can lose data.",
            "`acks=1`: leader wrote it. Lost if the leader dies before followers copy it.",
            "`acks=all`: every ISR member has it. Safest.",
            "Common durable setup: replication factor 3, `min.insync.replicas=2`, `acks=all`. One broker can die and writes still succeed. If two die, writes fail instead of silently losing data.",
          ],
        },
        { type: "pre", text: "P0: Broker1 (leader) --copy--> Broker2 (follower, ISR)\n                    --copy--> Broker3 (follower, ISR)\n\nLeader dies -> controller picks a new leader from the ISR" },
        { type: "p", text: "High watermark (HW) = the last offset copied to every ISR member. Consumers can only read up to the HW, so they never see data that could vanish in a leader failover." },
      ],
    },
    {
      type: "card",
      id: "kp3-c6",
      title: "6. Idempotent producer",
      tag: "Often asked",
      blocks: [
        { type: "p", text: "Problem: the producer sends, the ack gets lost, the producer retries, and the broker now has the message twice." },
        {
          type: "list",
          items: [
            "Fix: `enable.idempotence=true` (default since Kafka 3.0). The producer gets a producer ID (PID), and each message carries a sequence number per partition. The broker drops a sequence number it has already seen.",
            "Limit: it only removes duplicates caused by retries within one producer session. It does nothing about consumer-side duplicates.",
          ],
        },
        { type: "p", text: "**Batching: latency vs throughput** (a startup SDE-2 round asked exactly this trade-off):" },
        {
          type: "list",
          items: [
            "`linger.ms` waits a few ms to fill a batch, `batch.size` caps its bytes, and `compression.type` (lz4, zstd) shrinks it. A higher linger gives more throughput at the cost of more latency.",
            "With idempotence on, up to 5 in-flight requests per connection still keep order within a partition.",
          ],
        },
      ],
    },
    {
      type: "card",
      id: "kp3-c7",
      title: "7. Transactions and exactly-once (EOS)",
      tag: "Often asked",
      blocks: [
        { type: "p", text: "Transactions let a producer write to several partitions and commit consumer offsets as one atomic unit. Consumers with `isolation.level=read_committed` never see aborted writes." },
        {
          type: "list",
          items: [
            "This gives exactly-once for Kafka to Kafka pipelines (read topic A, write topic B).",
            "It cannot cover a write to Postgres or an external API. Kafka's transaction doesn't include your database. That's why DB sinks use at-least-once plus idempotent writes.",
          ],
        },
        { type: "p", text: "**How it works** (the follow-up after \"what is EOS?\"):" },
        {
          type: "list",
          items: [
            "The producer sets a `transactional.id`. On startup, a transaction coordinator gives it a PID and an epoch.",
            "Zombie fencing: if an old instance with the same `transactional.id` comes back after a restart, its lower epoch is rejected, so it can't write stale data.",
            "Read-process-write loop: begin, send outputs, `sendOffsetsToTransaction(consumed offsets)`, commit. Outputs and offsets succeed or fail together.",
            "Commit or abort markers go into the partitions. `read_committed` consumers read only up to the last stable offset (LSO), past which nothing is still undecided.",
          ],
        },
        { type: "pre", text: "read topic A -> process -> [ begin | send to B | sendOffsetsToTransaction | commit ] -> read_committed reader sees B" },
      ],
    },
    {
      type: "card",
      id: "kp3-c8",
      title: "8. Rebalancing",
      tag: "Most asked",
      blocks: [
        { type: "p", text: "A rebalance reassigns partitions when a consumer joins, leaves, crashes, or the partition count changes. Kafka decides a consumer is dead in two different ways. Don't mix them up:" },
        {
          type: "list",
          items: [
            "`session.timeout.ms`: no heartbeat from the consumer's background thread, so the process is probably dead.",
            "`max.poll.interval.ms` (default 5 min): the consumer hasn't called `poll()` in time, usually because processing one batch is too slow. It gets kicked out, which triggers a rebalance, and its uncommitted work is redone.",
          ],
        },
        { type: "p", text: "How to reduce rebalance pain:" },
        {
          type: "list",
          items: [
            "Smaller batches (`max.poll.records`), or a longer `max.poll.interval.ms` for slow work.",
            "Cooperative rebalancing (`CooperativeStickyAssignor`): only the moved partitions pause, not the whole group.",
            "Static membership (`group.instance.id`): a pod restarting with the same ID doesn't trigger a rebalance.",
          ],
        },
        { type: "p", text: "Assignment strategies: Range, RoundRobin, Sticky, and CooperativeSticky (moves the fewest partitions)." },
        { type: "p", text: "Modern Kafka: Kafka 4.0 made the new consumer group protocol (KIP-848) generally available. The broker computes assignments and rebalances incrementally, ending stop-the-world rebalances. Consumers opt in with `group.protocol=consumer`. Mentioning this signals you're up to date." },
      ],
    },
    {
      type: "card",
      id: "kp3-c9",
      title: "9. Consumer lag",
      tag: "Often asked",
      blocks: [
        { type: "p", text: "Lag = latest offset in the partition minus the group's committed offset. It's the backlog." },
        {
          type: "list",
          items: [
            "Lag rising evenly on all partitions: consumers are too slow overall. Add consumers, up to the partition count.",
            "Lag rising on one partition only: a hot key, or one slow or poison message stuck on that partition.",
          ],
        },
      ],
    },
    {
      type: "card",
      id: "kp3-c10",
      title: "10. Retries, poison messages, DLT",
      tag: "Often asked",
      blocks: [
        { type: "p", text: "A poison message fails every time, for example malformed data. If you retry forever, that partition is stuck behind it." },
        {
          type: "list",
          items: [
            "Retry a few times with backoff, then send it to a dead letter topic (DLT) and move on. Inspect or replay DLT messages later.",
            "In Spring Kafka: `DefaultErrorHandler` with backoff + `DeadLetterPublishingRecoverer`.",
            "Retry topics (`orders-retry-1m`, `orders-retry-10m`) keep the main partition moving, but they lose strict ordering for that key.",
          ],
        },
      ],
    },
    {
      type: "card",
      id: "kp3-c11",
      title: "11. Outbox pattern",
      tag: "Often asked",
      blocks: [
        { type: "p", text: "Dual-write problem: you save an order to the DB, then publish to Kafka, and the app crashes in between. Now the DB and Kafka disagree." },
        {
          type: "list",
          items: [
            "Fix: in the same DB transaction, write the order AND a row to an `outbox` table. A separate poller (or CDC with Debezium) reads `outbox` and publishes to Kafka.",
            "The publish can repeat, so consumers must still be idempotent.",
          ],
        },
        { type: "pre", text: "[ DB transaction: insert order + insert outbox row ] -> poller/CDC -> Kafka -> consumers (idempotent)" },
      ],
    },
    {
      type: "card",
      id: "kp3-c12",
      title: "12. Why Kafka is fast",
      tag: "Often asked",
      blocks: [
        {
          type: "list",
          items: [
            "Writes are sequential appends to disk, which is fast even on spinning disks.",
            "Reads come from the OS page cache, and zero-copy (`sendfile`) sends bytes from disk to the network without copying through the app.",
            "Producers batch and compress messages.",
            "Partitions spread load across brokers and consumers.",
          ],
        },
        { type: "p", text: "Asked word for word in a Fynd SDE-2 round (2.5 YOE), with the follow-up \"which part of the architecture makes it fast?\" Answer each piece in one line." },
      ],
    },
    {
      type: "card",
      id: "kp3-c13",
      title: "13. KRaft vs ZooKeeper",
      tag: "Sometimes asked",
      blocks: [
        { type: "p", text: "Older Kafka stored cluster metadata (brokers, leaders, configs) in ZooKeeper. KRaft moves it into Kafka itself, using a small quorum of controller nodes running the Raft protocol. Kafka 4.0 removed ZooKeeper entirely. Benefits: one system to run, faster failover, more partitions per cluster." },
        { type: "p", text: "Also new in 4.x: Queues for Kafka (KIP-932, share groups) lets several consumers share one partition with per-message acks, like a classic queue. It was early access in 4.0 and preview in 4.1. Good to know, rarely asked." },
      ],
    },
    {
      type: "card",
      id: "kp3-c14",
      title: "14. Retention and compaction",
      tag: "Sometimes asked",
      blocks: [
        {
          type: "list",
          items: [
            "Time or size retention (`retention.ms`, default 7 days): old segments get deleted whether or not anyone read them.",
            "Log compaction: keeps only the latest value per key. Good for \"current state\" topics like user profiles.",
          ],
        },
      ],
    },
    {
      type: "card",
      id: "kp3-c15",
      title: "15. Kafka vs RabbitMQ or SQS",
      tag: "Often asked",
      blocks: [
        {
          type: "list",
          items: [
            "Kafka: messages stay after reading, there's replay, many independent groups, high throughput, and order within a partition.",
            "RabbitMQ or SQS: a message is gone once acked, with per-message routing and simpler ops. Better for task queues where nobody needs replay.",
            "Interview line: pick Kafka when you need replay, multiple consumers of the same events, or very high throughput. Otherwise a simpler queue is a fair choice.",
          ],
        },
      ],
    },
    {
      type: "card",
      id: "kp3-c16",
      title: "16. auto.offset.reset",
      tag: "Often asked",
      blocks: [
        { type: "p", text: "This is used only when a group has no committed offset (a brand-new group, or its offset expired)." },
        {
          type: "list",
          items: [
            "`latest` (default): start at the end, so a new group misses everything already in the topic.",
            "`earliest`: start from the oldest retained message.",
            "Classic bug: you produce test messages, then start a new consumer group, and it sees nothing. Reason: `latest`.",
          ],
        },
      ],
    },
    {
      type: "card",
      id: "kp3-c17",
      title: "17. Spring Kafka in practice",
      tag: "Often asked in Java roles",
      blocks: [
        {
          type: "list",
          items: [
            "`@KafkaListener(topics = \"x\", groupId = \"g\", concurrency = \"3\")` runs 3 consumer threads. Useful only up to the partition count.",
            "Spring Kafka turns off Kafka auto-commit by default and commits by AckMode: `BATCH` (default, after the whole poll batch is processed), `RECORD`, or `MANUAL` / `MANUAL_IMMEDIATE` (you call `ack.acknowledge()`).",
            "Errors: `DefaultErrorHandler` retries with backoff, then `DeadLetterPublishingRecoverer` sends the record to a DLT.",
            "`KafkaTemplate.send()` is async and returns a `CompletableFuture`. If you never check it, failed sends go unnoticed.",
            "A `KafkaConsumer` is not thread-safe, so it's one consumer per thread.",
          ],
        },
      ],
    },
    {
      type: "card",
      id: "kp3-c18",
      title: "18. Backpressure",
      tag: "Sometimes asked",
      blocks: [
        { type: "p", text: "Asked in a Kotak SDE-2 round. Kafka consumers pull, so a slow consumer is never flooded: it falls behind and lag grows. Kafka absorbs the burst." },
        {
          type: "list",
          items: [
            "Slow downstream (DB, LLM API): lower `max.poll.records`, `pause()` and `resume()` partitions, or rate-limit, and alert on lag.",
            "Producer side: when `buffer.memory` fills, `send()` blocks up to `max.block.ms`, then fails.",
          ],
        },
      ],
    },
    {
      type: "card",
      id: "kp3-c19",
      title: "19. Schema evolution",
      tag: "Sometimes asked",
      blocks: [
        { type: "p", text: "Events outlive code, so a consumer on the old version must still read new messages." },
        {
          type: "list",
          items: [
            "Safe: add an optional field with a default. Unsafe: rename or remove a required field, or change a type.",
            "Schema Registry (with Avro or Protobuf) stores schema versions and rejects incompatible changes at produce time.",
          ],
        },
      ],
    },
    {
      type: "card",
      id: "kp3-c20",
      title: "20. Stream processing windows, for HLD",
      tag: "Sometimes asked",
      blocks: [
        { type: "p", text: "These are for designs like \"count clicks per ad per minute\" or a live leaderboard." },
        {
          type: "list",
          items: [
            "Tumbling: fixed and non-overlapping (12:00-12:01, then 12:01-12:02).",
            "Hopping: fixed size, overlapping (a 5-minute window every minute).",
            "Session: grouped by activity, closes after a gap of inactivity.",
            "Built with Kafka Streams or Flink. Late events are handled with a grace period.",
          ],
        },
      ],
    },
  ],

  "KP-05": [
    { type: "p", text: "These come up again and again in real interview reports and question banks. Cover the answer, speak for 60 seconds, then open it and check. Tick a box only when your answer matched the substance." },
    { type: "h", text: "Asked in real SDE-2 interviews (2024-2026 reports)" },
    { type: "p", text: "Prioritise this block. Each question appears in a candidate's own write-up." },
    {
      type: "check",
      id: "kp4-r1",
      text: "Explain how Kafka works and its components. ([Tekion SDE-2, Java backend](" + SRC.tekion + "))",
      answer: "Producers write to topics split into partitions on brokers. Each partition is replicated (leader + followers, ISR). Consumer groups read partitions and track offsets. KRaft controllers hold cluster metadata. Draw the Phase 3 diagram while you talk.",
    },
    {
      type: "check",
      id: "kp4-r2",
      text: "A producer publishes but the consumer isn't consuming. How do you debug? ([Tekion SDE-2](" + SRC.tekion + "))",
      answer: [
        { type: "p", text: "Go outside in." },
        {
          type: "list",
          items: [
            "First, did the send actually succeed? Check the send callback or future, and the topic name and cluster.",
            "Then run `kafka-consumer-groups --describe --group <g>`: are partitions assigned, are offsets moving, is lag growing?",
            "Common causes: a new group with `auto.offset.reset=latest` misses old messages; more consumers than partitions leaves some idle; a rebalance loop from exceeding `max.poll.interval.ms`; a poison message failing deserialization keeps the consumer stuck at one offset; a hanging transaction blocks `read_committed` readers at the LSO; ACLs or a wrong bootstrap server.",
          ],
        },
      ],
    },
    {
      type: "check",
      id: "kp4-r3",
      text: "Payment retries happen. How do you make sure the balance isn't deducted twice? ([Tekion SDE-2](" + SRC.tekion + "))",
      answer: "The client sends an idempotency key (a request ID). Store it under a unique constraint in the same DB transaction as the deduction. A retry hits the constraint and gets the original result back. In a Kafka flow: idempotent producer, plus consumer dedupe on the payment ID.",
    },
    {
      type: "check",
      id: "kp4-r4",
      text: "How do you implement idempotency at the producer level, and at the consumer level? ([Oracle IC-2, Kafka was the major focus](" + SRC.oracle + "))",
      answer: [
        {
          type: "list",
          items: [
            "Producer: `enable.idempotence=true` (PID + sequence numbers). This only removes duplicates from producer retries.",
            "Consumer: dedupe on a business key, either a unique constraint with upsert, or a `processed_messages(message_id)` row written in the same DB transaction as the business change.",
          ],
        },
      ],
    },
    {
      type: "check",
      id: "kp4-r5",
      text: "What commit strategies exist, and which do you use? ([Oracle IC-2](" + SRC.oracle + "))",
      answer: "Auto (timer-based, risky). `commitSync` blocks and retries, so it's safe but slower. `commitAsync` is fast but doesn't retry, so do a final `commitSync` on shutdown. Per-record commits are safest but slow; per-batch commits are faster and redo a whole batch after a crash.",
    },
    {
      type: "check",
      id: "kp4-r6",
      text: "Design a high-throughput event streaming system like Kafka. ([startup SDE-2, system design round](" + SRC.startup + "))",
      answer: [
        {
          type: "list",
          items: [
            "Storage: an append-only log per partition, stored as segment files with an offset index.",
            "Scaling: partition by key hash, spread partitions across brokers.",
            "Durability: leader-follower replication with ISR, acks, and `min.insync.replicas`.",
            "Metadata and leader election: a Raft controller quorum.",
            "Consumers: pull-based groups, offsets in an internal log, rebalancing.",
            "Trade-offs to state: batching (latency vs throughput), acks and min ISR (durability vs availability).",
          ],
        },
      ],
    },
    { type: "h", text: "Fundamentals" },
    { type: "check", id: "kp4-f1", text: "Does Kafka guarantee message ordering? **[Most asked]**", answer: "Only within one partition. For order per entity, use the entity ID as the key so all its events go to one partition. There's no order across partitions." },
    { type: "check", id: "kp4-f2", text: "A team wants total ordering across millions of events. What do you say? **[Sometimes asked]**", answer: "Total order needs a single partition, which means one consumer and a hard throughput ceiling. Push back: most systems only need order per key (per user, per order). Give them that and keep many partitions." },
    { type: "check", id: "kp4-f3", text: "What happens if a group has more consumers than partitions? **[Most asked]**", answer: "The extras sit idle. Partition count is the max parallelism of a group." },
    { type: "check", id: "kp4-f4", text: "How would you choose the partition count? **[Often asked]**", answer: "Target throughput divided by what one consumer can handle, plus headroom. Partitions can't be reduced, and adding them remaps keys, so over-provision a little up front." },
    { type: "check", id: "kp4-f5", text: "Kafka vs RabbitMQ or SQS: when do you pick which? **[Often asked]**", answer: "Kafka: replay, several independent consumers of the same events, high throughput. RabbitMQ or SQS: simple task queues, per-message routing, nobody needs replay." },
    { type: "h", text: "Reliability" },
    { type: "check", id: "kp4-r-sem", text: "At-most-once, at-least-once, exactly-once: how do you get each? **[Most asked, Oracle IC-2]**", answer: "At-most: commit before processing. At-least: process, then commit (and `acks=all` on the producer). Exactly-once: Kafka transactions for Kafka-to-Kafka. For external sinks, at-least-once plus idempotent writes." },
    { type: "check", id: "kp4-r-pg", text: "Can you get exactly-once from Kafka into Postgres? **[Most asked]**", answer: "Not with Kafka transactions alone, because they don't cover the DB. Use at-least-once plus an idempotent upsert on a unique key. Or store the offset in the same DB transaction as the data and seek to it on restart." },
    { type: "check", id: "kp4-r-dup", text: "You see duplicate messages from the producer. Why, and how do you fix it? **[Often asked]**", answer: "A retry after a lost ack. Fix with `enable.idempotence=true`: PID + per-partition sequence numbers, and the broker drops repeats." },
    { type: "check", id: "kp4-r-miss", text: "Messages are missing after a broker failure. What went wrong? **[Often asked]**", answer: "Likely `acks=1` (or 0) and the leader died before followers copied the data, or unclean leader election picked an out-of-sync replica. Fix: `acks=all`, RF 3, `min.insync.replicas=2`, unclean election off." },
    { type: "check", id: "kp4-r-broker", text: "What happens when a broker dies? **[Often asked]**", answer: "The controller picks new leaders from the ISR for partitions that broker led. Producers and consumers refresh metadata and continue. With RF 3 and min ISR 2, no committed data is lost." },
    { type: "check", id: "kp4-r-poison", text: "A message fails every time. What do you do? **[Often asked]**", answer: "Retry a few times with backoff, then send it to a dead letter topic and move on, so the partition isn't blocked. Alert on DLT volume and replay after the fix." },
    { type: "check", id: "kp4-r-outbox", text: "How do you write to the DB and publish an event atomically? **[Often asked]** ([Kotak SDE-2](" + SRC.kotak + "))", answer: "Outbox pattern: write the data and an outbox row in one DB transaction. A poller or CDC (Debezium) publishes the outbox rows. Consumers stay idempotent because publishing can repeat." },
    { type: "h", text: "Operations and failures" },
    { type: "check", id: "kp4-o1", text: "Consumers keep rebalancing and throughput tanks. Why? **[Most asked]**", answer: "Most often processing takes longer than `max.poll.interval.ms`, so the consumer is kicked out and its batch is redone. Fix: smaller `max.poll.records`, faster processing, or a longer interval. Also use cooperative rebalancing and static membership for pod restarts." },
    { type: "check", id: "kp4-o2", text: "How do you know a consumer is falling behind? **[Most asked]**", answer: "Consumer lag: latest offset minus committed offset, per partition. Monitor it and alert on growth." },
    { type: "check", id: "kp4-o3", text: "Lag is high on one partition while the others are flat. Why? **[Often asked]**", answer: "A hot key skews traffic onto that partition, or one slow or poison message is stuck there. Even lag across all partitions means you need more consumers." },
    { type: "check", id: "kp4-o4", text: "How do you scale consumers? **[Often asked]**", answer: "Add instances up to the partition count, for example Kubernetes autoscaling on lag. Beyond that, add partitions or make processing faster." },
    { type: "h", text: "Internals" },
    { type: "check", id: "kp4-i1", text: "Why is Kafka fast? **[Often asked]** ([Fynd SDE-2](" + SRC.fynd + "))", answer: "Sequential disk appends, OS page cache, zero-copy sends, batching and compression, and partitions for parallelism." },
    { type: "check", id: "kp4-i2", text: "What does ZooKeeper do in Kafka? **[Sometimes asked]**", answer: "In Kafka 4.0, nothing: it's gone. KRaft replaced it, with metadata stored in an internal Raft log on a quorum of controller nodes. Older versions used ZooKeeper for broker membership, leader election and configs." },
    { type: "check", id: "kp4-i3", text: "What are ISR and `min.insync.replicas`? **[Often asked]**", answer: "ISR = replicas caught up with the leader. `min.insync.replicas` = how many must have a write for `acks=all` to succeed. Below that, writes fail rather than risk loss." },
  ],

  "KP-06": [
    { type: "p", text: "The interviewer will grill these resume lines: archives split into window-aligned byte ranges, fanned out over Kafka and read in parallel; offsets commit after durable writes; idempotent upserts turn at-least-once delivery into exactly-once effects." },
    { type: "note", text: "Every blank is yours to fill from your actual code: write your answers in the notes below, not from these hints. If code and claim disagree, fix the code or the claim before any interview. (The LL-08 chapter's Parts 21-23 have the real values, if you get stuck.)" },
    { type: "h", text: "Step 0: Know your own config cold" },
    { type: "p", text: "Fill this table in your notes from the code: your value, and why. Interviewers ask these numbers directly." },
    {
      type: "table",
      head: ["Setting", "Your value", "Why this value"],
      rows: [
        ["Topic name(s)", "", ""],
        ["Partition count", "", ""],
        ["Message key", "", ""],
        ["Message payload fields", "", ""],
        ["Consumer instances / concurrency", "", ""],
        ["Commit mode (auto, manual, batch)", "", ""],
        ["Producer acks + idempotence", "", ""],
        ["max.poll.records / max.poll.interval.ms", "", ""],
        ["Retry + DLT setup", "", ""],
        ["Idempotency key in Postgres", "", ""],
      ],
    },
    { type: "check", id: "kp5-step0", text: "Step 0 table filled in from the code, and recalled without notes" },
    { type: "h", text: "A. Why Kafka at all" },
    { type: "check", id: "kp5-a1", text: "Why Kafka and not a thread pool inside one service?", answer: "Hint: what happens to queued work when the process dies? Can a thread pool spread work across machines?" },
    { type: "check", id: "kp5-a2", text: "Postgres is already in your stack. Why not a job table with `SELECT ... FOR UPDATE SKIP LOCKED`?", answer: "Hint: this is the hardest \"why\" question. Be honest about where it would have been enough, then say what Kafka gave you that the table wouldn't." },
    { type: "check", id: "kp5-a3", text: "Why not RabbitMQ, SQS or Redis Streams?" },
    { type: "h", text: "B. Message and partition design" },
    { type: "check", id: "kp5-b1", text: "What exactly is inside one Kafka message? The log bytes, or a pointer (file + start byte + end byte)?", answer: "Hint: Kafka's default max message size is about 1 MB. A pointer is called the claim-check pattern." },
    { type: "check", id: "kp5-b2", text: "What is your message key, and why?", answer: "Hint: if the key is the archive ID, every range of one archive lands in ONE partition, read by ONE consumer. Does \"read in parallel\" still hold for a single big archive?" },
    { type: "check", id: "kp5-b3", text: "Does ordering matter between windows? If not, say so and explain what that frees you to do." },
    { type: "check", id: "kp5-b4", text: "A log line crosses a byte-range boundary. Who reads it?", answer: "Hint: a common rule is to skip to the first newline at the start (unless offset 0) and read past the end until the line finishes." },
    { type: "h", text: "C. Failures (the core of the grilling)" },
    { type: "check", id: "kp5-c1", text: "A consumer writes chunks to Postgres, then crashes before committing the offset. Walk me through what happens.", answer: "Expected shape: rebalance, another consumer gets the partition, resumes from the last committed offset, reprocesses the range, and the upsert absorbs the duplicate." },
    { type: "check", id: "kp5-c2", text: "What is your idempotency key? Write the SQL." },
    { type: "check", id: "kp5-c3", text: "Why not Kafka transactions for exactly-once?", answer: "Expected shape: Kafka's transaction can't include the Postgres write. Idempotent upserts are the standard pattern for DB sinks." },
    { type: "check", id: "kp5-c4", text: "Does any LLM call run inside the consumer's poll loop? If one window takes 3 minutes, what breaks?", answer: "Hint: `max.poll.interval.ms`, rebalance, redone work." },
    { type: "check", id: "kp5-c5", text: "One range fails every time, for example a corrupt gzip block. What does your pipeline do?", answer: "Hint: if the honest answer is \"it retries forever\", say what you'd add (backoff + DLT)." },
    { type: "check", id: "kp5-c6", text: "The producer gets a timeout and retries. Can a range be published twice? Does it matter?" },
    { type: "check", id: "kp5-c7", text: "Which AckMode do you use? With Spring's default `BATCH`, when exactly is the offset committed relative to your Postgres write?", answer: "Hint: `BATCH` commits after the listener has handled every record in the poll. A crash mid-batch redoes the whole batch. Does your upsert make that safe?" },
    { type: "check", id: "kp5-c8", text: "Is your idempotency at the producer level, the consumer level, or both? What does each protect against?", answer: "Hint: an Oracle IC-2 round asked exactly this split." },
    { type: "check", id: "kp5-c9", text: "If you set listener concurrency to 8 but the topic has 4 partitions, what happens?" },
    { type: "h", text: "D. Coordination, scale and proof" },
    { type: "check", id: "kp5-d1", text: "How do you know when a whole archive has finished ingesting?", answer: "Hint: count of completed window IDs vs the expected total, tracked where?" },
    { type: "check", id: "kp5-d2", text: "You say constant-heap. Prove it. What bounds memory per consumer?" },
    { type: "check", id: "kp5-d3", text: "Your 80% fewer LLM calls: compared to what baseline, measured how?" },
    { type: "check", id: "kp5-d4", text: "10x the data and 100 users. What breaks first: Kafka, consumers, Postgres writes, or HNSW index builds?" },
    { type: "check", id: "kp5-d5", text: "If this went to production tomorrow, what would you add?", answer: "Hint: lag alerts, DLT, outbox for job creation, retention settings." },
    { type: "check", id: "kp5-d6", text: "Did you use Kafka at Blue Yonder?", answer: "Answer honestly: no, in DeepLogLens only. Then steer to what you'd do differently at scale." },
    { type: "check", id: "kp5-d7", text: "How would you know DeepLogLens ingestion is falling behind?", answer: "Hint: lag per partition, and which tool or metric shows it." },
  ],

  "KP-07": [
    { type: "p", text: "Run this only after Phase 5 is filled in. Paste your filled Step 0 table to Claude and say \"start the Kafka mock\". Claude plays the interviewer, asks one question at a time, pushes on weak answers, and scores you at the end." },
    {
      type: "list",
      ordered: true,
      items: [
        "0-10 min: \"Walk me through DeepLogLens. Why Kafka?\"",
        "10-30 min: core concepts from Phase 3, asked as follow-ups on your own design.",
        "30-50 min: failure scenarios (crash before commit, poison range, rebalance storm, hot partition).",
        "50-60 min: \"Redesign it for 100x scale\" and \"What would you change?\"",
      ],
    },
    { type: "note", text: "Pass bar: no \"Kafka guarantees ordering\" or \"Kafka exactly-once\" slip-ups, every failure answered with what happens step by step, and every number from Step 0 recalled without notes." },
    { type: "check", id: "kp6-mock1", text: "Mock 1 done (write the score in your notes)" },
    { type: "check", id: "kp6-weak1", text: "Weak spots from mock 1 re-studied" },
    { type: "check", id: "kp6-mock2", text: "Mock 2 done (write the score in your notes)" },
    { type: "h", text: "Sources" },
    { type: "p", text: "Real interview reports:" },
    {
      type: "list",
      items: [
        "[Tekion SDE-2, March 2026](" + SRC.tekion + ") (Kafka basics, consumer debugging, payment idempotency)",
        "[Oracle IC-2 backend](" + SRC.oracle + ") (Kafka idempotency, offsets, commit strategies)",
        "[Startup SDE-2](" + SRC.startup + ") (design a Kafka-like streaming system)",
        "[Fynd SDE-2, 2.5 YOE](" + SRC.fynd + ") (why Kafka is fast)",
        "[Kotak SDE-2, March 2026](" + SRC.kotak + ") (outbox, backpressure)",
        "[Blinkit SDE-1](" + SRC.blinkit + ") (Kafka deep-dive from resume)",
      ],
    },
    { type: "p", text: "Learning and reference:" },
    {
      type: "list",
      items: [
        "HelloInterview Kafka deep dive: [write-up](" + HI_WRITEUP + ") and [video](" + HI_VIDEO + ")",
        "[Apache Kafka 4.0 release announcement](https://kafka.apache.org/blog/2025/03/18/apache-kafka-4.0.0-release-announcement/) (ZooKeeper removed, KIP-848 GA, Queues early access)",
        "[Confluent: Kafka Internals course by Jun Rao](https://developer.confluent.io/courses/architecture/) (optional depth)",
        "[Kafka interview questions for Java developers](https://www.golinuxcloud.com/kafka-interview-questions/) (delivery semantics, Spring Kafka)",
        "[Kafka interview questions that separate users from operators](https://www.techinterview.org/post/3233477380/kafka-interview-questions/)",
        "[Kafka partitions, consumer groups and delivery guarantees in interviews](https://www.techinterview.org/post/3233476148/kafka-partitions-consumer-groups-delivery-guarantees-interview/)",
      ],
    },
  ],
};

// Every tickable id in a topic's plan, cards and checks alike.
export function planItemIds(blocks = []) {
  return blocks.filter((b) => b.type === "check" || b.type === "card").map((b) => b.id);
}
