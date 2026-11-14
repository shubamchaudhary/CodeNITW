import type { Scene } from "../../lib/types.ts";
import { A, CLUSTER, OUTBOX, TXN } from "./boards.ts";
import { B, L, check, sec } from "./h.ts";

// Part I: exactly-once. Delivery semantics, idempotent consumers, Kafka
// transactions, the outbox; then the whole system once more.
export const p6: Scene[] = [
  // ------------------------------------------------------------ 25
  sec("25", "Delivery semantics", "Topic twenty five. Delivery semantics. Where you commit decides what a crash costs."),
  {
    kind: "compare",
    title: "Pull the plug while processing record 42",
    cols: [
      { title: "At-most-once", icon: "🕳", tone: "red", items: ["commit 43, then process 42", "crash in between", "42 skipped forever: LOST"] },
      { title: "At-least-once", icon: "🔁", tone: "amber", items: ["process 42, then commit 43", "crash in between", "42 again: DUPLICATE · the default"] },
      { title: "Exactly-once", icon: "🎯", tone: "green", items: ["the work and the commit", "as one atomic step", "only possible inside Kafka"] },
    ],
    footer: "brokers keep the log and the commits; your consumer's position dies with it",
    beats: B(
      "First, who holds what. The Kafka brokers store the log and the committed offsets, and they survive your crash. The consumer is a client library inside your app; its in memory position dies with the crash, and after a restart it asks the brokers where its group committed. At most once: commit, then process. The commit said forty two was done before it was. The brokers believe it, so forty two is skipped forever. Lost.",
      "At least once: process, then commit. Crash in between, and the offset never moved, so forty two comes back and the work runs twice. Nothing lost, duplicates possible. This is the normal default.",
      { say: "Exactly once: the work and the commit as one atomic step. And that's only possible when the work itself lives inside Kafka, as we'll see.", tone: "key" },
      "Keep the who holds what picture in mind for the rest of this part.",
    ),
  },
  A(
    TXN,
    "Exactly-once inside Kafka: one transaction",
    [
      { t: "Who does what", b: "Kafka never calls a database or an API. Your app holds two clients: a consumer to read, a transactional producer to write.", m: "the coordinator is a broker's job", nodes: ["kc", "kp", "tc"] },
      { say: "Who does what. Kafka never calls a database or an API. The brokers only store records and answer requests. Every call is made by your app, which holds two Kafka clients: a consumer to read, and a transactional producer to write. The transaction coordinator isn't a separate server: it's a job one of the brokers does for your producer, chosen by its fixed transactional id, and it records each transaction's state in another internal topic, transaction state.", tone: "key", term: { word: "transaction coordinator", meaning: "a broker's job: records txn state, writes the markers" } },
    ],
    [
      { t: "1-2: read and process", b: "poll record 42; process it in memory: result R42. The group is still at 42.", nodes: ["in", "kc", "pr"], moves: [{ e: "poll", t: "42", rev: true }, { e: "kcp", t: "42", delay: 40 }] },
      "Steps one and two: poll record forty two, and process it in memory into a result, R forty two. Right now R forty two exists only in your app's memory, and the group is still at forty two.",
    ],
    [
      { t: "3-4: pending writes", b: "The producer writes R42 to payment-results and offset 43 to __consumer_offsets, both PENDING: read_committed readers skip them.", m: "pending = in the log, not yet real", nodes: ["pr", "kp", "out", "co"], subs: { out: "R42 PENDING", co: "43 PENDING (still 42)" }, moves: [{ e: "prk", t: "R42" }, { e: "wo", t: "R42", delay: 30 }, { e: "wc", t: "43", delay: 40 }] },
      "Steps three and four: the producer writes R forty two to the output topic, and offset forty three to consumer offsets, both as pending records: already in the log, but tagged with a transaction that hasn't finished. Readers using read committed skip them for now, and the pending offset doesn't count yet.",
    ],
    [
      { t: "5-6: commit, markers", b: "commitTransaction(): the coordinator saves PrepareCommit, then writes a COMMIT marker into both partitions.", m: "R42 visible and group -> 43, at the same moment", nodes: ["kp", "tc", "out", "co"], tones: { out: "green", co: "green" }, subs: { out: "R42 COMMITTED", co: "payment-svc -> 43" }, moves: [{ e: "end", t: "commit" }, { e: "mo", t: "COMMIT", delay: 50, tone: "green" }, { e: "mc", t: "COMMIT", delay: 56, tone: "green" }] },
      { say: "Step five, commit transaction. The coordinator saves prepare commit, and then step six: it writes a commit marker, a small control record, into both partitions. Now the result and the offset become real at the same moment. The input, the output and the committed offset all live inside the cluster, so the coordinator controls every write. That's why this can be atomic.", tone: "key" },
    ],
    [
      { t: "Crash before the commit", b: "Restart with the same transactional.id: initTransactions() makes the coordinator ABORT the open transaction. R42 hidden forever, group still 42.", m: "42 reprocessed, readers see one R42", nodes: ["tc", "out", "co", "kp"], tones: { out: "red", co: "red" }, subs: { out: "first R42 ABORTED", co: "still 42" }, moves: [{ e: "end", t: "initTransactions" }, { e: "mo", t: "ABORT", delay: 50, tone: "red" }, { e: "mc", t: "ABORT", delay: 56, tone: "red" }] },
      "Crash before the commit. The app restarts with the same transactional id and calls init transactions. The coordinator sees an open transaction from the old instance and aborts it. If the app never comes back, it's aborted anyway after the transaction timeout, sixty seconds. Abort markers hide the first R forty two forever, the pending offset is thrown away, and the group is still at forty two. The app reads forty two again, processes it again, and commits. A downstream read committed consumer sees R forty two exactly once.",
    ],
    [
      { t: "Where it breaks", b: "process() charged the bank Rs 500, then crashed. The abort undoes only what the cluster stores. The retry charges again.", m: "outside effects need idempotency", nodes: ["pr"], tones: { pr: "red" }, subs: { pr: "bank charged twice" } },
      { say: "And where it breaks. Your process step calls a bank API and charges five hundred rupees, then crashes before the commit. The abort undoes only what the cluster stores, the pending result and the pending offset. The bank call was made by your app to a system outside the cluster, and nothing can undo it. The retry charges the customer again. So what real systems build is at least once delivery plus idempotent processing, equals exactly once effect.", tone: "key" },
    ],
  ),
  check({
    topic: "delivery semantics",
    q: "At-least-once, at-most-once, exactly-once: which is Kafka's default, and what does exactly-once cover?",
    a: "At-least-once (process, then commit). Kafka's exactly-once covers Kafka-to-Kafka processing via transactions; side effects outside Kafka need idempotent consumers.",
    aSay: "At least once is the default: process, then commit. Kafka's exactly once covers Kafka to Kafka processing through transactions. When the side effect is outside Kafka, I run at least once and make the consumer idempotent, so a duplicate delivery has no extra effect.",
  }),

  // ------------------------------------------------------------ 26
  sec("26", "Idempotent consumers", "Topic twenty six. Idempotent consumers. Duplicates will happen; two rules make them harmless."),
  {
    kind: "bullets",
    title: "Duplicates will happen",
    firstItemStep: 1,
    items: [
      { text: "A crash after processing, before the offset commit", icon: "💥" },
      { text: "A rebalance before the commit; the error handler seeking back", icon: "🔀" },
      { text: "A manual replay; an upstream that publishes twice (an outbox relay)", icon: "⏪" },
    ],
    beats: B(
      "First, accept that duplicates will happen. Every one of these redelivers a record.",
      "A crash after processing, but before the offset commit.",
      "A rebalance that moves a partition before its offsets were committed. The error handler seeking back and retrying.",
      { say: "A manual replay. An upstream publisher sending the same event twice, like an outbox relay. You can't stop all of these. You can make them harmless, with two rules.", tone: "key" },
    ),
  },
  L(
    [
      { id: "db", label: "Postgres", sub: "log_chunks" },
      { id: "k", label: "log-windows", sub: "partition 0" },
    ],
    "Rule 1 and 2, one crash at a time",
    [
      { t: "Rule 1: commit after the write", b: "The DB transaction commits first; only then the offset moves. Spring does this: the container commits after your listener returns.", rows: { db: { cells: [] }, k: { cells: ["w-6@41", "w-7@42"], ptrs: [{ at: 1, l: "committed" }] } } },
      { say: "Rule one: commit the offset only after the write is durable. The database transaction commits first, and only then does the offset move. In Spring this happens naturally: the container commits offsets after your listener returns, so if the listener calls a transactional service, the database commit always comes first. Flip the order and the crash window becomes data loss.", tone: "key" },
    ],
    [
      { b: "Window w-7 stored, crash before the offset commit. Record 42 comes back.", m: "the write must be a no-op the second time", rows: { db: { cells: ["+w-7 c0", "+w-7 c1", "+w-7 c2"] }, k: { cells: ["w-6@41", "!w-7@42"], ptrs: [{ at: 1, l: "committed", tone: "amber" }] } } },
      "Record forty two, window w seven. The chunks are upserted and the transaction commits. Then a crash, before the offset commit. After the restart the committed offset is still forty two, so the record comes back. The write must be a no op the second time. That's rule two.",
    ],
    [
      { t: "Rule 2: an idempotent write", b: "Upsert on a deterministic key: ON CONFLICT DO NOTHING. 0 rows changed; commit offset 43.", m: "stored once", rows: { db: { cells: ["w-7 c0", "w-7 c1", "w-7 c2"] }, k: { cells: ["w-6@41", "+w-7@42"], ptrs: [{ at: 2, l: "committed", tone: "green" }] } } },
      { say: "Rule two: make the write itself idempotent. The upsert of w seven conflicts on the primary key, zero rows change, and the consumer commits forty three. The chunks of w seven are stored once.", tone: "key" },
    ],
  ),
  {
    kind: "code",
    title: "Four ways to make a write idempotent",
    lang: "sql",
    code: `-- a) natural: SET status = 'SHIPPED' is safe; balance = balance + 10 is not

-- b) upsert on a deterministic key (from the data, never random)
INSERT INTO log_chunks (file_id, window_start, chunk_no, content)
VALUES (:fileId, :windowStart, :chunkNo, :content)
ON CONFLICT (file_id, window_start, chunk_no) DO NOTHING;
--    latest state: DO UPDATE ... WHERE orders.version < EXCLUDED.version

-- c) dedup table, in the SAME transaction as the business change
INSERT INTO processed_events VALUES (:eventId, now()) ON CONFLICT DO NOTHING;
--    0 rows -> seen before, skip; else add 10 to the balance

-- d) external API: pass the event id as an Idempotency-Key header`,
    highlight: [[1, 1], [3, 7], [9, 11], [13, 13]],
    beats: B(
      "Pick the cheapest technique that fits. A: natural idempotency. Setting status to shipped gives the same result run once or five times. Adding ten to a balance does not.",
      { say: "B, the most common: upsert on a deterministic key. A unique constraint on a key that comes from the data, and let the database reject the second insert. The key must be the same on every redelivery: derived from the source data, like file id plus byte offset, or an event id the producer assigned. Never a random UUID generated in the consumer: every redelivery would make a new id and insert a new row. For latest state rows, do update, guarded by a version so an older event can't overwrite a newer one.", tone: "key" },
      "C: a dedup table, an inbox, when the effect can't be an upsert. Record which events were applied, in the same database transaction as the business change. Zero rows inserted means seen before, skip. If the two were separate transactions, a crash between them would skip a real event or apply it twice.",
      "D: an idempotency key for external APIs. You can't put a unique constraint on someone else's system, so pass the event id as, say, Stripe's idempotency key header.",
    ),
  },
  {
    kind: "drill",
    items: [
      { q: "So is it exactly-once?", a: "Delivery at-least-once; the effect is exactly-once. Don't call it Kafka EOS: that means transactions." },
      { q: "Why not Kafka transactions?", a: "They cover Kafka writes and offsets. Postgres is outside, and Kafka does no XA with a database." },
      { q: "Why not (topic, partition, offset) as the key?", a: "It misses the same event published twice: the copy gets a new offset. A data key or event id catches both." },
      { q: "Batch crashed at 60 of 100?", a: "All 100 come back; 60 conflict and do nothing, 40 insert. No cleanup code." },
    ],
    beats: B(
      { say: "The follow ups this design gets. So, is it exactly once?", hold: 2 },
      "Delivery is at least once. The effect is exactly once. Say exactly once effect. Don't call it Kafka exactly once semantics, which means transactions, or you'll be asked how your transactions work.",
      { say: "Why not just use Kafka transactions?", hold: 2 },
      "They make Kafka writes and offset commits atomic. Your write goes to Postgres, which is outside the transaction, and Kafka doesn't join XA transactions with a database.",
      { say: "Why not use topic, partition and offset as the dedup key?", hold: 2 },
      "It's stable across redeliveries of the same record, but it fails when the same event is published twice, because the copy gets a new offset. A key from the data, or a producer assigned event id, catches both.",
      { say: "The batch crashed halfway: sixty of a hundred records written?", hold: 2 },
      "The offset wasn't committed, so all hundred come back. Sixty conflict and do nothing, forty are inserted. No cleanup code needed. That's the payoff of idempotent writes.",
    ),
  },

  // ------------------------------------------------------------ 27
  sec("27", "Kafka transactions", "Topic twenty seven. Kafka transactions: what they add on top of the idempotent producer, and what they cost readers."),
  {
    kind: "code",
    title: "A transaction across two topics",
    lang: "java",
    code: `props.put("transactional.id", "order-service-1"); // stable per instance
producer.initTransactions();                        // raises the epoch: fences zombies

producer.beginTransaction();
try {
    producer.send(new ProducerRecord<>("orders", key, orderPlaced));
    producer.send(new ProducerRecord<>("inventory", key, inventoryReserved));
    // consume-process-produce: also the input offsets
    producer.sendOffsetsToTransaction(nextOffsets(records), consumer.groupMetadata());
    producer.commitTransaction();                   // all visible, or...
} catch (KafkaException e) {
    producer.abortTransaction();                    // ...none
}`,
    highlight: [[1, 2], [4, 7], [8, 9], [10, 13]],
    beats: B(
      { say: "What the idempotent producer can't fix. Problem A: an order service publishes order placed to orders, and inventory reserved to inventory, and crashes between the two sends. Now one event exists without the other. Problem B: consume, process, produce: write the result, crash before committing the input, and write a second result after the restart. Both need a group of writes that become visible all together or not at all. Setting a transactional id turns on idempotence automatically. Init transactions maps the id back to the same PID and raises the epoch, so an old instance still running, a zombie, is fenced: its writes are rejected.", tone: "key" },
      "Begin, then the sends. Data goes to the partition leaders as usual and lands in the logs immediately, marked transactional. The coordinator records which partitions this transaction touches, so it knows where to write the markers.",
      "For consume, process, produce, put the input offsets in the same transaction with send offsets to transaction. The group metadata lets the broker reject a commit from a consumer that already lost the partition in a rebalance.",
      "Commit, in two steps. Prepare commit to transaction state: from that moment the commit will happen, even if the coordinator crashes, because a new one reads the log and finishes it. Then commit markers in every partition. Abort is the same flow with abort markers.",
    ),
  },
  L(
    [{ id: "p", label: "orders P0", sub: "transactional" }],
    "Aborted data stays in the log",
    [
      { t: "Commit A, abort B, commit C", b: "Markers are control records and take offsets, so offsets have gaps. Aborted B is physically there.", m: "never assume next = last + 1", rows: { p: { cells: ["A@0", "#COMMIT@1", "~B@2", "#ABORT@3", "C@4"] } } },
      "Commit A, abort B, commit C, on one partition. The markers are control records and take offsets, so transactional topics have gaps, at one and three. And B is sitting right there in the log. Whether a consumer reads it depends on the consumer.",
    ],
    [
      { t: "read_uncommitted, the default", b: "Sees A, B, C: aborted data included.", m: "isolation.level=read_uncommitted", rows: { p: { cells: ["+A@0", "#COMMIT@1", "!B@2", "#ABORT@3", "+C@4"] } } },
      { say: "A correction: a transactional producer is not enough on its own. A consumer left at the default, read uncommitted, still reads aborted records. It sees A, B and C.", tone: "key" },
    ],
    [
      { t: "read_committed", b: "Sees A and C only. Every downstream consumer must opt in.", rows: { p: { cells: ["+A@0", "#COMMIT@1", "~B@2", "#ABORT@3", "+C@4"] } } },
      "With isolation level read committed, it sees only A and C. Every downstream consumer must set it, and Spring Boot doesn't set it for you.",
    ],
    [
      { t: "The price: the LSO", b: "read_committed reads only up to the Last Stable Offset: the first offset of the oldest OPEN transaction. E is committed but hidden behind open D.", m: "one stuck producer stalls every reader (60 s)", rows: { p: { cells: ["A@0", "C@2", "*D open@4", "~E@5"], ptrs: [{ at: 2, l: "LSO", tone: "amber" }] } } },
      { say: "And there's a price. A read committed consumer reads only up to the last stable offset: the first offset of the oldest transaction still open in that partition. E is committed, but it sits behind D, whose transaction is still open. So one slow or stuck producer stalls every read committed reader of that partition, until the transaction timeout, sixty seconds, aborts it. Keep transactions short, and commit batches, not single records.", tone: "key" },
    ],
  ),
  {
    kind: "bullets",
    title: "Transactions in Spring, and the trap",
    firstItemStep: 1,
    items: [
      { text: "transaction-id-prefix=order-svc- turns it on", sub: "plus isolation-level=read_committed on consumers", icon: "⚙️" },
      { text: "In a @KafkaListener: the container starts it, your send() joins it, offsets added, committed on return", sub: "a plain send() outside a transaction now fails", icon: "🧩" },
      { text: "@Transactional over a DB save AND a Kafka send is still TWO commits", sub: "a crash between them: the DB and Kafka disagree", icon: "⚠️" },
    ],
    beats: B(
      "In Spring Boot.",
      "One property turns it on: the producer's transaction id prefix. Plus read committed on the consumers, which Boot doesn't set for you.",
      "Inside a Kafka listener, the container starts the transaction, your kafka template send joins it, and the container adds the offsets and commits when the method returns. On an exception it rolls back. And once a template is transactional, a plain send outside a transaction fails: use execute in transaction.",
      { say: "The trap: a transactional method that saves to the database and sends to Kafka does not make them atomic. Spring can synchronize the two, so the Kafka commit happens right after the database commit, but that's still two commits. A crash between them leaves the database and Kafka disagreeing. That gap is the last topic.", tone: "key" },
    ),
  },

  // ------------------------------------------------------------ 28
  sec("28", "Dual writes and the outbox", "Topic twenty eight. The dual write problem, and the outbox pattern, the standard production answer to exactly once across services."),
  A(
    OUTBOX,
    "From two writes to one",
    [
      { t: "The dual write", b: "save the order, then send the event: two systems, no shared commit.", m: "no ordering survives a crash", nodes: ["svc", "orders", "k"], edges: ["tx", "direct"], moves: [{ e: "tx", t: "save" }, { e: "direct", t: "OrderPlaced", delay: 30 }] },
      "Almost every service does this. Save the order to the database, then send order placed to Kafka. Two systems, two writes, and no way to commit them together.",
    ],
    [
      { t: "Lost, or a ghost", b: "Send after the commit, crash: the event is lost. Send inside the transaction, DB rolls back: a ghost event ships an order that doesn't exist.", m: "retrying doesn't help if the process dies", nodes: ["svc", "orders", "k"], tones: { k: "red" }, subs: { k: "no event, or a ghost" }, moves: [{ e: "direct", t: "OrderPlaced", tone: "red" }] },
      { say: "Try every ordering. Send after the database commit: a crash in between loses the event. Send inside the transaction: the database rolls back after the event is out, a ghost event, and downstream ships an order that doesn't exist. Retry the send in a loop: useless if the process itself dies. No ordering of two independent writes survives a crash. So stop doing two writes.", tone: "key" },
    ],
    [
      { t: "1. One transaction", b: "INSERT the order AND the event into an outbox table, in the same local DB transaction. Together or not at all.", m: "no ghost events, no lost events", nodes: ["svc", "orders", "outbox"], tones: { orders: "green", outbox: "green" }, moves: [{ e: "tx", t: "order" }, { e: "tx2", t: "event", delay: 6 }] },
      { say: "Make it one write. Insert the event into an outbox table, in the same database, in the same transaction as the business row. The order row and the outbox row are saved together or not at all. No ghost events, no lost events.", tone: "key", term: { word: "outbox", meaning: "an event table written in the business transaction" } },
    ],
    [
      { t: "2-4. Poll, publish, mark", b: "A relay reads the oldest unpublished rows (FOR UPDATE SKIP LOCKED), publishes with acks=all, waits for the ack, and only then marks them.", m: "ack before mark", nodes: ["relay", "outbox", "k", "cons"], moves: [{ e: "rd", t: "read", delay: 0 }, { e: "pub", t: "event 17", delay: 40 }, { e: "mark", t: "mark 17", delay: 90, tone: "teal" }, { e: "kc", t: "event 17", delay: 90 }] },
      "A separate relay does the rest. Every few hundred milliseconds it reads the oldest unpublished rows, with for update skip locked, so two relay instances never grab the same rows. It sends each to Kafka and waits for the ack. Only after the ack does it mark the rows published, or delete them. Mark first and then fail the send, and the event is lost forever. And the event's UUID is fine here, unlike in a consumer: it's generated once, when the event is created, and stored, so every republish carries the same id.",
    ],
    [
      { t: "It still duplicates", b: "Publish 17, ack, crash before marking: after restart 17 is published again. At-least-once publishing.", m: "the consumer dedupes on the event id", nodes: ["relay", "k", "cons"], dead: ["relay"], moves: [{ e: "kc", t: "event 17 again", tone: "amber" }] },
      { say: "And it still duplicates. The relay publishes row seventeen, gets the ack, and crashes before marking it. After a restart it publishes seventeen again. The outbox gives at least once publishing: never lost, sometimes duplicated. The consumer dedupes on the event id. Outbox on the producer side, plus idempotent consumer on the other side, is the standard production answer to exactly once across services.", tone: "key" },
    ],
    [
      { t: "What they push on", b: "Ordering: key by aggregate_id; several relays can still reorder. Growth: delete published rows. Relay down: alert on the oldest row's age. CDC: Debezium reads the WAL.", m: "still at-least-once", nodes: ["relay", "outbox", "k"] },
      "The details interviewers push on. Ordering: use the aggregate id as the Kafka key so one order's events share a partition, and publish in created order. But skip locked with several relays can publish two events of the same order in parallel, out of order: use one active relay, split the work by a hash of the aggregate id, or put version numbers on events. Table growth: delete or archive published rows on a schedule. Relay down: events pile up in the table, nothing is lost, so alert on the age of the oldest unpublished row. And instead of polling, a CDC tool like Debezium can read the database's transaction log. Lower latency and no polling queries, but one more system to run, and still at least once.",
    ],
  ),
  check({
    topic: "the outbox",
    q: "Why can't you just send to Kafka inside the @Transactional method that saves the order?",
    a: "Two systems, two commits: send then roll back = a ghost event; commit then crash before the send = a lost event. Write the event to an outbox table in the same DB transaction and relay it.",
    aSay: "Because that's two writes to two systems with no shared commit. If the send goes out and the database then rolls back, I've published a ghost event. If the database commits and I crash before the send, the event is lost. So I insert the event into an outbox table in the same local transaction, and a relay publishes it with acks all, marking it only after the ack. Consumers dedupe on the event id.",
  }),

  // ------------------------------------------------------------ the end
  sec("29", "The whole system, once more", "Last, the whole system, once more, on one board. One event, end to end."),
  A(
    CLUSTER,
    "One event, end to end",
    [
      { t: "Write", b: "Hash the key to P1, batch, send to leader Broker 2, append at 101, followers fetch, HW 102, ack.", m: "acks=all · RF 3 · min.insync 2", nodes: ["prod", "b1", "b2", "b3"], tones: { b2: "green" }, moves: [{ e: "pw", t: "order-123" }, { e: "f1", t: "101", rev: true, delay: 40, tone: "green" }, { e: "f3", t: "101", rev: true, delay: 46, tone: "green" }, { e: "pw", t: "ack @101", rev: true, delay: 90, tone: "green" }] },
      "The producer hashes order one two three to P one, batches it, and sends it to the leader, broker two. Appended at one oh one, the followers fetch it, the high watermark moves to one oh two, and the producer gets its ack.",
    ],
    [
      { t: "Read", b: "Coordinator on Broker 3, committed 100, fetch below the HW from the leader, process idempotently, commit 501.", m: "at-least-once + idempotent = exactly-once effect", nodes: ["cons", "b2", "b3"], tones: { b2: "green" }, moves: [{ e: "cc", t: "offset? 100" }, { e: "c2", t: "100..500", delay: 40 }, { e: "cc", t: "commit 501", delay: 90 }] },
      "The consumer finds its coordinator on broker three, gets committed offset one hundred, fetches from the leader below the high watermark, processes idempotently, and commits five oh one.",
    ],
    [
      { t: "Kill the leader", b: "9 s later the controller promotes Broker 1 from the ISR; clients fail, refresh, retry. Nothing acknowledged is lost.", m: "only leadership moves", nodes: ["prod", "b1", "b3", "cons", "ctl"], dead: ["b2"], tones: { b1: "green" }, subs: { b1: "P1 leader (new)" }, moves: [{ e: "pm", t: "retry" }, { e: "f31", t: "fetch", delay: 20 }, { e: "c1", t: "records", delay: 40 }] },
      { say: "And kill the leader. Nine seconds later the controller promotes broker one from the ISR. Clients fail, refresh their metadata and retry. Nothing acknowledged is lost, and the consumer's duplicates change nothing. That's Kafka end to end. The recall task: draw this board from memory, trace one event through it, then kill the leader's broker and say what happens to every piece.", tone: "key" },
    ],
  ),
];
