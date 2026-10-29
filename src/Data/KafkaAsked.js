// Kafka — questions real interviews asked, with answers, shown fixed under the
// Kafka question bank (KFK-14). Research and method: scripts/data/kafkaInterviewEvidence.md.
// Each item: q, a (markdown), n (distinct write-ups that asked it), companies,
// video (the Kafka page that teaches it).

export const KAFKA_ASKED_META = {
  "window": "Oct 2024 – Oct 2026",
  "posts": 4798,
  "sources": "candidate-written interview write-ups on LeetCode Discuss that mention Kafka; question banks excluded"
};

export const KAFKA_ASKED = {
  "KFK-14": {
    "posts": 232,
    "items": [
      {
        "q": "What is a partition, how does the producer pick one, and why does the message key matter?",
        "a": "A **partition** is one ordered, append-only slice of a topic, stored on one broker (plus replicas). Partitions are how a topic scales: they spread across brokers, and each one is read by one consumer per group — so they cap parallelism and are the unit of ordering.\n\nHow the producer picks one:\n- **Key present** → `murmur2(key) % numPartitions`. Same key → same partition → **ordered** for that key (all events of order-42 in sequence).\n- **No key** → the *sticky partitioner* fills a batch for one partition, then moves on (better batching than pure round-robin).\n- **Explicit partition** or a **custom `Partitioner`** when you need control.\n\nConsequences interviewers probe:\n- **Hot partition**: one huge key (a celebrity user, one big tenant) lands on one partition and one consumer → lag on that partition only. Fix: better key, add a salt/suffix to split that key (gives up strict per-key order), or route big tenants separately.\n- **Adding partitions** changes `hash % n` → existing keys move → ordering for a key breaks across the change. Plan partition count up front.",
        "n": 40,
        "companies": [
          "Walmart",
          "Goldman Sachs",
          "Uber",
          "MoEngage",
          "Zomato",
          "EPAM",
          "MobiKwik",
          "Astrotalk",
          "TripJack",
          "eBay",
          "Wells Fargo",
          "Nexturn"
        ],
        "video": "KFK-06"
      },
      {
        "q": "What is Kafka, and how does it work — brokers, topics, partitions, offsets?",
        "a": "A **distributed, replicated, append-only log**. Producers write records, consumers read them, and Kafka keeps them for a set time whether or not anyone has read them.\n\n- **Broker**: one Kafka server. A cluster is several brokers.\n- **Topic**: a named stream (`orders`, `payments`).\n- **Partition**: a topic is split into partitions — each one an ordered, append-only log living on one broker (plus replicas). Partitions are the unit of **parallelism** and of **ordering**.\n- **Offset**: a record's position inside its partition (0, 1, 2…). Consumers track \"how far I've read\" as an offset.\n- **Producer** picks the partition (by key hash, or spread when there's no key) and appends.\n- **Consumer group**: consumers sharing a `group.id` split the partitions between them; each partition is read by one member.\n- **Controller** (KRaft, or ZooKeeper in old clusters): manages metadata and elects partition leaders.\n\nOne line to open with: *\"Kafka is a commit log that many services can read independently, at their own pace, and replay.\"*",
        "n": 29,
        "companies": [
          "Zomato",
          "EPAM",
          "MobiKwik",
          "Goldman Sachs",
          "Nexturn",
          "Apple",
          "Walmart",
          "Tekion",
          "Ciena",
          "Found It",
          "Blackrock",
          "Kotak Mahindra Bank"
        ],
        "video": "KFK-01"
      },
      {
        "q": "How do you handle duplicate messages — e.g. a retried payment event must not charge twice?",
        "a": "Assume duplicates will come (producer retries, consumer crash before commit, rebalance) and make the **consumer idempotent**:\n\n1. **Idempotency key**: every event carries a unique id (eventId / paymentId / orderId+version).\n2. **Dedupe in the same DB transaction as the effect**:\n   ```sql\n   INSERT INTO processed_events(event_id) VALUES (?)   -- unique constraint\n   -- + the business write, same transaction\n   ```\n   Duplicate → unique violation → skip and commit the offset.\n3. Or make the write **naturally idempotent**: upsert, `UPDATE … WHERE status = 'PENDING'`, version checks.\n4. For external calls (payment gateway), pass the idempotency key to the provider so *it* dedupes.\n\nThen commit the offset after the transaction. Producer side, `enable.idempotence=true` stops retry duplicates in the log — but it can't stop the consumer reprocessing, so you still need step 2.\n\nA Redis \"seen\" set with TTL works for best-effort dedupe, but it isn't atomic with the DB write — say so.",
        "n": 24,
        "companies": [
          "Kotak Mahindra Bank",
          "Microsoft",
          "Zomato",
          "Dell",
          "MobiKwik",
          "Square Yards",
          "Astrotalk",
          "Twilio",
          "Blinkit",
          "TripJack",
          "Nexturn",
          "Visa"
        ],
        "video": "KFK-08"
      },
      {
        "q": "Kafka vs RabbitMQ (or SQS) — why Kafka, and when would you pick the other?",
        "a": "| | Kafka | RabbitMQ / SQS |\n|---|---|---|\n| Model | Log: records **stay** after reading (retention) | Queue: a message is **deleted** once acked |\n| Readers | Many groups read the same data independently; can **replay** | Each message goes to one consumer (fan-out needs extra queues/exchanges) |\n| Consumers | **Pull**, track their own offset | Broker **pushes**, tracks per-message acks |\n| Ordering | Per partition | Per queue, lost with competing consumers |\n| Throughput | Very high (sequential disk, batching) | Lower, but richer routing |\n| Per-message features | Weak (no per-message TTL, delay, priority) | Routing keys, priorities, delayed messages, per-message retry |\n\n**Pick Kafka** for event streams, many independent consumers, replay, high volume, ordering per key (orders, clickstream, CDC, logs).\n**Pick RabbitMQ/SQS** for task queues: \"do this job once\", complex routing, per-message delays/priorities, low volume.",
        "n": 22,
        "companies": [
          "Kotak Mahindra Bank",
          "Groww",
          "Astrotalk",
          "Twilio",
          "Avathon",
          "Aspora",
          "Zscaler",
          "Okta",
          "Delivery Hero",
          "Intuit",
          "SAP",
          "Microsoft"
        ],
        "video": "KFK-01"
      },
      {
        "q": "What is event-driven architecture — and when is it better than synchronous REST calls between services?",
        "a": "Services **publish events** (\"OrderPlaced\") about facts that happened; other services **react** to them, instead of the publisher calling each one.\n\n**Wins over sync REST**:\n- **Loose coupling**: the order service doesn't know who listens; add a new consumer (analytics, notifications) with no change to it.\n- **Resilience**: if the email service is down, events wait in Kafka; the order still succeeds.\n- **Absorbs spikes**: consumers work at their own pace.\n\n**Costs**: **eventual consistency** (the read side lags), harder debugging/tracing across services, duplicates and ordering to handle, schema evolution of events.\n\n**Use sync** when the caller needs the answer now (check stock before confirming, auth). **Use events** for side effects and fan-out (send email, update search index, analytics).\n\nRelated terms: **event sourcing** stores the events themselves as the source of truth and rebuilds state by replaying; **CQRS** splits the write model from read models that are built from events.",
        "n": 20,
        "companies": [
          "Tekion",
          "Microsoft",
          "Dell",
          "EPAM",
          "Blinkit",
          "Avathon",
          "Salesforce",
          "PhonePe",
          "Tamara",
          "LinkedIn",
          "NetApp",
          "Morgan Stanley"
        ],
        "video": "KFK-15"
      },
      {
        "q": "How does Kafka guarantee message ordering?",
        "a": "**Only within a partition**, never across a topic.\n\nTo keep order for an entity:\n1. **Key by the entity id** (orderId, userId) so all its events hit one partition.\n2. Producer: `enable.idempotence=true` (default since Kafka 3.0). Without it, a retry can land batch 2 before batch 1 when `max.in.flight.requests.per.connection > 1`; idempotence keeps order with up to 5 in flight.\n3. Consumer: process one partition's records **sequentially** — don't hand them to a thread pool and commit out of order.\n\nNeed a global order? One partition — and you've given up all parallelism. Almost always the real need is *per-key* order.",
        "n": 19,
        "companies": [
          "Uber",
          "Oracle",
          "EPAM",
          "Groww",
          "Blinkit",
          "Wells Fargo",
          "Nexturn",
          "Okta",
          "PayU",
          "Cleartrip",
          "Deloitte",
          "MoEngage"
        ],
        "video": "KFK-02"
      },
      {
        "q": "What is a consumer group? What happens with more consumers than partitions?",
        "a": "Consumers sharing a `group.id`. Kafka assigns **each partition to exactly one consumer in the group**, so the group splits the work and each record is processed once *per group*.\n\n- **6 partitions, 3 consumers** → 2 partitions each.\n- **6 partitions, 10 consumers** → 6 busy, **4 idle** (standbys that take over on failure). Partition count is the ceiling on parallelism inside one group.\n- **Two different groups** (e.g. `billing` and `analytics`) each get **every** record — that's how Kafka does pub/sub.\n- One consumer can own several partitions; one partition is never shared inside a group (that would break ordering).\n\nSpring follow-up: `@KafkaListener(concurrency = \"10\")` on a 6-partition topic → only 6 threads do work.",
        "n": 17,
        "companies": [
          "Walmart",
          "EPAM",
          "MobiKwik",
          "Zomato",
          "Nike",
          "Morgan Stanley",
          "Found It",
          "Uber",
          "MoEngage",
          "Pine Labs",
          "Oracle",
          "Target"
        ],
        "video": "KFK-02"
      },
      {
        "q": "How does replication work — leader, followers, ISR? What happens when a broker goes down?",
        "a": "Each partition has a **replication factor** (say 3): one **leader** and two **followers** on other brokers. Producers and consumers talk to the leader; followers fetch from it.\n\n- **ISR (in-sync replicas)**: replicas caught up within `replica.lag.time.max.ms` (30s). A lagging follower drops out of the ISR.\n- **High watermark**: the highest offset copied to every ISR member. Consumers only see records up to it, so they never read data that could vanish in a failover.\n- **Broker dies** → the controller picks a new leader **from the ISR** for each partition it led; clients refresh metadata and carry on. No committed data is lost if acks=all.\n- `unclean.leader.election.enable=false` (default): never elect an out-of-sync replica — availability lost rather than data.\n- Followers on different racks/AZs (`broker.rack`) so one AZ outage doesn't take all copies.",
        "n": 14,
        "companies": [
          "Dream11",
          "Zomato",
          "Visa",
          "Found It",
          "Ocrolus",
          "Oblivious",
          "LinkedIn",
          "PayPay",
          "Walmart"
        ],
        "video": "KFK-03"
      },
      {
        "q": "A message keeps failing to process — how do you retry, and what is a dead letter topic?",
        "a": "Separate the two kinds of failure:\n- **Transient** (DB timeout, 503 downstream) → retry with backoff.\n- **Permanent / poison** (bad JSON, failed validation, deserialization error) → retrying never helps; it blocks the partition forever.\n\nPatterns:\n1. **Blocking retry in place** — a few attempts with backoff (Spring `DefaultErrorHandler` + `FixedBackOff`/`ExponentialBackOff`). Keeps order, but stalls the partition and must stay under `max.poll.interval.ms`.\n2. **Non-blocking retry topics** — on failure publish to `orders-retry-1m`, `orders-retry-10m`, commit and move on (Spring `@RetryableTopic`). Partition keeps flowing; you **lose ordering** for that key.\n3. **Dead letter topic (DLT)** — after N attempts (or immediately for non-retryable exceptions) publish the record + headers (exception, original topic/partition/offset) to `orders.DLT`, commit, continue. Alert on it, inspect, fix, **replay** with a small tool.\n\nDeserialization errors: wrap the deserializer in `ErrorHandlingDeserializer` so a bad record goes to the DLT instead of crashing the poll loop.",
        "n": 13,
        "companies": [
          "EPAM",
          "MobiKwik",
          "UiPath",
          "Uber",
          "Salesforce",
          "Tamara",
          "MoEngage",
          "Oracle",
          "Lowe's",
          "PayPay",
          "WheelsEye"
        ],
        "video": "KFK-09"
      },
      {
        "q": "Point-to-point queue vs publish-subscribe — and why does Kafka pull instead of push?",
        "a": "- **Queue (point-to-point)**: each message goes to **one** consumer; competing consumers share load.\n- **Pub/sub**: every **subscriber** gets every message.\n\nKafka does both with consumer groups: inside a group it's a queue (partitions split across members); across groups it's pub/sub (each group reads everything).\n\n**Pull**: consumers fetch at their own pace, so a slow consumer can't be flooded (natural backpressure), they can **batch** fetches, and **rewind** to an old offset. Cost: idle consumers poll — Kafka handles that with long polling (`fetch.max.wait.ms`). Push systems (RabbitMQ) have lower latency per message but need prefetch limits to avoid overwhelming consumers.",
        "n": 13,
        "companies": [
          "Dell",
          "Target",
          "UiPath",
          "Walmart",
          "Trip Jack",
          "Amazon",
          "Uber",
          "Fortinet",
          "MoEngage",
          "Salesforce"
        ],
        "video": "KFK-02"
      },
      {
        "q": "Where did you use Kafka in your project — and why Kafka there?",
        "a": "Have a 60-second answer ready. Structure:\n\n1. **What flows through it**: the topics, what one message is, rough volume.\n2. **Why async / why Kafka**: decouple a slow step from the request path, absorb bursts, fan-out to several consumers, replay.\n3. **Key decisions**: the key and why (ordering for X), partition count, consumer groups, commit after the DB write (at-least-once), how you made consumers **idempotent**, retries and DLT.\n4. **A failure you handled**: a duplicate, a lag spike, a poison message, a rebalance storm.\n5. **What you'd change**: an honest gap (dual write → outbox, RF=1 in dev, no lag alerting).\n\nFor LogLens: pointers not bytes through Kafka, keyed by `documentId:partIdx`, manual acks after the Postgres commit, idempotent upserts, a 60-second retry topic for 429s, DLQs. Interviewers then drill into exactly these choices — the answers above are the drill.",
        "n": 10,
        "companies": [
          "PayPay",
          "Astrotalk",
          "Goldman Sachs",
          "Delivery Hero",
          "Amazon",
          "Trip Jack",
          "Intuit",
          "PayPal",
          "Zamp"
        ]
      },
      {
        "q": "What is an offset, where is it stored, and auto-commit vs manual commit?",
        "a": "An offset is a record's position in its partition. A consumer group **commits** \"the next offset I'll read\" per partition into the internal topic **`__consumer_offsets`**. After a restart or rebalance, the new owner resumes from the committed offset.\n\n- **Auto-commit** (`enable.auto.commit=true`, every `auto.commit.interval.ms` = 5s, done inside `poll()`): easy, but commit timing is decoupled from processing → crash after commit but before processing = **loss**; crash after processing but before commit = **duplicates**.\n- **Manual commit** (`commitSync` / `commitAsync`, Spring `AckMode.MANUAL` / `RECORD` / `BATCH`): commit **after** the work is durably done → **at-least-once**. Pair with an idempotent consumer.\n- `commitSync` retries and blocks; `commitAsync` doesn't retry (an older commit could overwrite a newer one) — common pattern: async in the loop, sync on shutdown/rebalance.\n- **`auto.offset.reset`**: where to start when the group has no committed offset — `latest` (default), `earliest`, or `none` (throw).",
        "n": 9,
        "companies": [
          "EPAM",
          "MobiKwik",
          "Nike",
          "Found It",
          "MoEngage",
          "Oracle"
        ],
        "video": "KFK-08"
      },
      {
        "q": "How do you keep data consistent across microservices without a distributed transaction — what is a saga?",
        "a": "No 2PC across services (it blocks, and Kafka/most services can't take part). Instead a **saga**: a sequence of **local transactions**, each publishing an event that triggers the next; if a step fails, run **compensating** actions to undo the earlier ones.\n\nExample — order: `create order (PENDING)` → `reserve stock` → `charge payment` → `confirm order`. Payment fails → `release stock`, `cancel order`.\n\n- **Choreography**: each service listens to events and publishes its own. Simple, no central piece; the flow is hard to see as it grows.\n- **Orchestration**: one orchestrator tells each service what to do and tracks state. Clear flow and timeouts; one more component.\n\nMust-haves: each step publishes reliably (**outbox**), consumers are **idempotent**, compensations are idempotent too, and the system is **eventually** consistent (intermediate states are visible — design the UI/status for it).",
        "n": 8,
        "companies": [
          "Dell",
          "Target",
          "Visa",
          "LinkedIn",
          "PayPay",
          "Oracle",
          "EPAM",
          "Goldman Sachs"
        ]
      },
      {
        "q": "What is a rebalance, what triggers it, and how do you reduce its impact?",
        "a": "Reassigning partitions among a group's members. The **group coordinator** (a broker) runs it; one member (leader) computes the assignment.\n\n**Triggers**: a consumer joins/leaves (deploy, scale), a consumer is considered dead — missed heartbeats past `session.timeout.ms` or didn't call `poll()` within `max.poll.interval.ms` — or partitions are added / subscription regex matches a new topic.\n\n**Impact**: with the old *eager* protocol every member stops and gives up all partitions (stop-the-world); in-flight work whose offset isn't committed gets reprocessed → duplicates.\n\n**Reduce it**:\n- **CooperativeStickyAssignor** (incremental rebalance): only the moved partitions pause.\n- **Static membership** (`group.instance.id`): a pod restarting within the session timeout gets its partitions back, no rebalance.\n- Keep processing per poll short (`max.poll.records`), or raise `max.poll.interval.ms` for slow work.\n- Commit offsets in `onPartitionsRevoked` (ConsumerRebalanceListener).\n- Newer: the KIP-848 consumer protocol (`group.protocol=consumer`, Kafka 4.0) moves assignment to the broker and drops the global sync barrier.",
        "n": 7,
        "companies": [
          "EPAM",
          "MobiKwik",
          "Uber",
          "Oracle",
          "Dream11",
          "Walmart"
        ],
        "video": "KFK-10"
      },
      {
        "q": "How do you update the database and publish an event reliably — what is the outbox pattern?",
        "a": "**Dual-write problem**: `save(order)` then `kafka.send(OrderCreated)` — two systems, no shared transaction. Crash between them, or the send fails → DB and Kafka disagree. Sending first is no better.\n\n**Transactional outbox**:\n1. In the **same DB transaction** as the business write, insert the event into an `outbox` table (id, aggregate id, type, payload, status/created_at).\n2. A separate relay publishes outbox rows to Kafka and marks them sent:\n   - **Polling**: a scheduled job `SELECT … WHERE status='NEW' ORDER BY id LIMIT 100 FOR UPDATE SKIP LOCKED`, send, mark SENT. Simple; adds latency and DB load.\n   - **CDC** (Debezium reads the DB's WAL/binlog): near real-time, no polling load, more infrastructure.\n3. The relay can crash after sending but before marking → **at-least-once** → consumers must be idempotent (use the outbox row id as the event id).\n\nKeep ordering per aggregate by keying the Kafka record with the aggregate id. Clean old rows on a schedule.",
        "n": 7,
        "companies": [
          "Groww",
          "Tekion",
          "Salesforce",
          "BitGo",
          "Joveo",
          "Urban Company"
        ],
        "video": "KFK-13"
      },
      {
        "q": "What is Kafka Streams — KStream vs KTable?",
        "a": "A **Java library** (not a cluster) for processing topics: filter, map, join, aggregate, window — runs inside your app; scaling = run more instances (partitions are split like a consumer group).\n\n- **KStream**: every record is an independent event (clicks, payments).\n- **KTable**: a changelog — the **latest value per key** (user profile, account balance). A new record for a key *updates* it.\n- **GlobalKTable**: a full copy of a small table on every instance, for joins without co-partitioning.\n- **State stores** (RocksDB) hold aggregates locally, backed up to a compacted changelog topic for recovery.\n- **Exactly-once**: `processing.guarantee=exactly_once_v2`.\n\nFor a backend SDE-2 loop this is a \"know what it is\" question: one paragraph plus KStream vs KTable is enough.",
        "n": 7,
        "companies": [
          "New Relic",
          "Angel One",
          "Ocrolus",
          "Urban Company",
          "Uber",
          "WheelsEye",
          "Goldman Sachs"
        ]
      },
      {
        "q": "acks=0 / 1 / all and min.insync.replicas — how do you make sure no message is lost?",
        "a": "- **acks=0**: fire and forget. Fastest, can lose anything.\n- **acks=1**: the leader wrote it. Lost if the leader dies before followers copy it.\n- **acks=all** (default since 3.0): every **in-sync** replica has it.\n\nacks=all alone isn't enough: if the ISR shrinks to just the leader, \"all\" means one copy. So set **`min.insync.replicas=2`** with **RF=3** — writes fail (`NotEnoughReplicas`) rather than being accepted with one copy, and you survive one broker loss.\n\nNo-loss checklist:\n- Producer: `acks=all`, `enable.idempotence=true`, retries on (default effectively infinite within `delivery.timeout.ms`), **handle the send callback / future** — an unchecked failed send is the most common real loss.\n- Topic: RF=3, `min.insync.replicas=2`, no unclean leader election.\n- Consumer: commit offsets **after** processing.",
        "n": 5,
        "companies": [
          "Uber",
          "Pluang",
          "Dream11",
          "Walmart"
        ],
        "video": "KFK-06"
      },
      {
        "q": "At-most-once, at-least-once, exactly-once — which does Kafka give you, and how?",
        "a": "- **At-most-once**: commit the offset, then process. Crash mid-way → message skipped. No duplicates, possible loss.\n- **At-least-once** (the practical default): process, then commit. Crash after processing, before commit → reprocessed. No loss, possible **duplicates**.\n- **Exactly-once**: each record's effect happens once.\n\nKafka's own **EOS** = idempotent producer + **transactions** + consumers with `isolation.level=read_committed`. It's exactly-once for **read-from-Kafka → write-to-Kafka** (consume-transform-produce, Kafka Streams `exactly_once_v2`): output records and the consumer's offsets commit in one transaction.\n\nIt does **not** cover side effects outside Kafka (DB write, email, payment API). There the real answer is **at-least-once + idempotent consumer** (dedupe on a message/business id with a unique constraint, or store the offset in the same DB transaction as the result).",
        "n": 5,
        "companies": [
          "EPAM",
          "Uber",
          "PayPal",
          "MoEngage",
          "Swiggy"
        ],
        "video": "KFK-08"
      },
      {
        "q": "Consumer lag keeps growing — how do you find the cause and fix it?",
        "a": "**Lag** = log-end offset − committed offset, per partition. Check with `kafka-consumer-groups.sh --describe --group g`, the `records-lag-max` metric, or Burrow/Grafana.\n\nRead the shape first:\n- **All partitions lagging** → consumers too slow overall. Scale consumers **up to the partition count**; beyond that add partitions. Make processing faster: batch DB writes, async I/O, fix the slow downstream call, larger `fetch.min.bytes`/`max.poll.records`.\n- **One partition lagging** → **hot key / skew**, or one stuck consumer. Fix the key, or look for a poison message that's being retried forever.\n- **Lag + frequent rebalances** → processing exceeds `max.poll.interval.ms`, the consumer is kicked out and the work is redone. Smaller `max.poll.records` or a bigger interval.\n- **Lag with no throughput at all** → consumer is dead/blocked (thread dump), or commits failing.\n\nDon't process in a separate pool without managing offsets — that hides lag and breaks ordering. If the input is bursty, lag that drains is fine; alert on lag *growth*, not a fixed number.",
        "n": 5,
        "companies": [
          "MobiKwik",
          "PayPay",
          "Amazon",
          "MoEngage",
          "Uber"
        ],
        "video": "KFK-10"
      },
      {
        "q": "Kafka writes to disk — so why is it so fast?",
        "a": "1. **Sequential I/O**: append-only log; reads and writes are sequential, which disks (even HDDs) do very fast.\n2. **OS page cache**: Kafka doesn't keep its own big cache; recent data is served from memory by the OS.\n3. **Zero-copy** (`sendfile`): data goes from the page cache to the socket without being copied through the JVM.\n4. **Batching + compression**: the producer groups records per partition (`batch.size`, `linger.ms`) and compresses the whole batch (lz4/zstd/snappy); the broker stores the batch as-is.\n5. **Partitions** spread load across brokers and consumers in parallel.\n6. **Pull model**: consumers fetch big chunks at their own pace; the broker doesn't track per-message state.\n\nTrade-off knob: `linger.ms` / `batch.size` up → throughput up, latency up.",
        "n": 5,
        "companies": [
          "Nike",
          "Delivery Hero",
          "Uber",
          "Illumio"
        ],
        "video": "KFK-06"
      },
      {
        "q": "How long does Kafka keep messages — retention, segments and log compaction?",
        "a": "Messages are **not deleted when consumed**; consumers just move their offset.\n\n- Each partition is stored as **segment files** (`.log` + `.index` + `.timeindex`), rolled at `segment.bytes` (1 GB) or `segment.ms`. Only the active segment is written.\n- **Delete policy** (default): whole closed segments are deleted past `retention.ms` (7 days default) or `retention.bytes`.\n- **Compact policy** (`cleanup.policy=compact`): keep at least the **latest value per key**; older values for the key are removed in the background. A record with a null value (**tombstone**) deletes the key. Used for changelogs/state (`__consumer_offsets` itself is compacted).\n- Both together: `compact,delete`.\n\nRetention is what makes **replay** possible: reset a group's offset (`--reset-offsets --to-datetime`) and reprocess.",
        "n": 4,
        "companies": [
          "EPAM",
          "MoEngage",
          "Illumio",
          "Lowe's"
        ],
        "video": "KFK-05"
      },
      {
        "q": "How do you choose the number of partitions — and can you change it later?",
        "a": "Partitions cap consumer parallelism, so size for **peak throughput**:\n\n`partitions ≥ max(target MB/s ÷ per-partition producer MB/s, target ÷ per-consumer MB/s)`, and at least the max consumers you expect in one group. Leave headroom for growth (e.g. 2× today).\n\n- **Increase**: yes, any time — but `hash(key) % n` changes, so existing keys move and **per-key ordering breaks** across the change.\n- **Decrease**: not possible; create a new topic and migrate.\n- Too many has a cost: more open files, slower leader elections/failover, more memory on clients, longer rebalances. Thousands per broker is fine with KRaft, but don't create 1,000 for a topic doing 1 MB/s.",
        "n": 4,
        "companies": [
          "Blinkit",
          "Walmart",
          "Zomato",
          "6Sense"
        ],
        "video": "KFK-01"
      },
      {
        "q": "The producer says it published, but the consumer never gets the message — how do you debug it?",
        "a": "Walk the path, producer → broker → consumer:\n\n1. **Did the send actually succeed?** Check the send callback / `future.get()` — errors (timeout, `NotEnoughReplicas`, serialization) are silent if ignored. Is the record still sitting in the producer buffer (`linger.ms`, never flushed before shutdown)?\n2. **Is it in the topic?** `kafka-console-consumer --from-beginning` or check end offsets with `kafka-get-offsets`. Right topic name, right cluster/env?\n3. **Consumer side**:\n   - Group already committed past it, or **`auto.offset.reset=latest`** on a new group → it starts after the message.\n   - Another consumer in the **same group** owns that partition and took it.\n   - Consumer stuck in a **rebalance loop** or blocked on a poison record earlier in the partition.\n   - **Deserialization error** swallowed/logged; or a filter drops it.\n   - `read_committed` and the producer's transaction never committed.\n4. `kafka-consumer-groups --describe`: which member owns which partition, committed offset vs end offset (lag).",
        "n": 3,
        "companies": [
          "MobiKwik",
          "Visa",
          "Tekion"
        ],
        "video": "KFK-08"
      },
      {
        "q": "How do you serialize Kafka messages and evolve their schema safely — what is Schema Registry?",
        "a": "Kafka stores **bytes**; producer and consumer agree on a format via **serializers/deserializers** (String, JSON, Avro, Protobuf).\n\nProblem: the producer adds or renames a field and consumers break.\n\n**Schema Registry**: a service storing versioned schemas per topic. The producer registers the schema and sends a small **schema id** in each message instead of the full schema; the consumer fetches the schema by id. On register, the registry **checks compatibility**:\n- **Backward** (default): new consumers can read old data — add fields **with defaults**, remove fields.\n- **Forward**: old consumers can read new data.\n- **Full**: both.\n\nAvro/Protobuf give compact binary + enforced schemas; JSON is easy to read but has no enforcement unless you add JSON Schema. A bad record that can't be deserialized should go to a DLT via `ErrorHandlingDeserializer`, not crash the consumer.",
        "n": 3,
        "companies": [
          "Delivery Hero",
          "HackerRank",
          "Goldman Sachs"
        ]
      },
      {
        "q": "Sync vs async communication between microservices — when do you put a queue between them?",
        "a": "- **Sync (REST/gRPC)**: caller waits for a response. Simple, immediate answer; but **temporal coupling** — callee down or slow → caller fails or its threads pile up (needs timeouts, retries, circuit breakers).\n- **Async (Kafka/RabbitMQ/SQS)**: caller publishes and moves on. Survives the consumer being down, smooths spikes, allows fan-out; costs eventual consistency, duplicates to handle, harder tracing.\n\nPut a queue in when: the work is **slow** (video processing, reports, emails), the caller **doesn't need the result** right now, **several services** react to one event, or you need to **absorb bursts**.\n\nKeep it sync when the user is waiting for the answer (price, stock check, login). Typical design: sync for the request path, events for everything after the commit (via an outbox).",
        "n": 3,
        "companies": [
          "EPAM",
          "Goldman Sachs"
        ],
        "video": "KFK-15"
      },
      {
        "q": "ZooKeeper vs KRaft — what does the controller do?",
        "a": "The **controller** manages cluster metadata: which brokers are alive, topic/partition configs, **who leads each partition**, ISR changes — and runs leader election when a broker dies.\n\n- **ZooKeeper mode** (old): metadata lived in a separate ZooKeeper ensemble; one broker was elected controller through ZK. Two systems to run and secure; controller failover meant reloading all metadata from ZK — slow with many partitions.\n- **KRaft** (Kafka Raft; production-ready 3.3, **ZooKeeper removed in Kafka 4.0**): a quorum of controller nodes stores metadata as an internal **Raft-replicated log** (`__cluster_metadata`). Brokers follow that log. One system, faster failover, millions of partitions.\n\nTypical: 3 controllers (tolerates 1 failure) or 5 (tolerates 2), separate from or combined with brokers.",
        "n": 2,
        "companies": [
          "Avathon",
          "Uber"
        ],
        "video": "KFK-04"
      },
      {
        "q": "session.timeout.ms vs heartbeat.interval.ms vs max.poll.interval.ms — why does a slow consumer get kicked out?",
        "a": "Two separate liveness checks:\n\n- **Heartbeats** (background thread every `heartbeat.interval.ms`, 3s): \"the process is alive\". Missed for `session.timeout.ms` (45s) → member removed → rebalance. Catches **crashed** consumers.\n- **Poll interval**: if the app doesn't call `poll()` again within `max.poll.interval.ms` (5 min), the consumer leaves the group even though heartbeats are fine. Catches **stuck/slow processing**.\n\nClassic bug: `max.poll.records=500`, each record takes 1s → 500s > 300s → kicked out, its commit fails, the batch is redone by another member, which also times out → endless rebalances and duplicates.\n\nFix: lower `max.poll.records`, speed up processing, or raise `max.poll.interval.ms`; for long jobs, `pause()` the partitions, process elsewhere, keep polling, `resume()`.",
        "n": 2,
        "companies": [
          "MobiKwik"
        ],
        "video": "KFK-10"
      }
    ]
  }
};
