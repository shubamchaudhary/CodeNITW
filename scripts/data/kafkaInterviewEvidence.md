# Interview evidence: what 2024–26 interviews asked about Kafka

The ground under the Kafka section of the Projects stack (`src/Data/Projects.js`,
KFK-01 … KFK-15) and the "Asked in interviews" list fixed under its question
bank, KFK-14 (`src/Data/KafkaAsked.js`). Same method as the Java/Spring
(`interviewEvidence.md`) and Python (`pythonInterviewEvidence.md`) passes.

## How it was collected (Oct 2026)

- **LeetCode Discuss**, through its public GraphQL search (same queries as
  `scripts/hld/collect.py`), newest first and stopped at the window start, for:
  kafka, apache kafka, kafka interview, kafka experience, spring kafka, kafka
  consumer, kafka producer, rabbitmq, message queue, outbox, dead letter, exactly
  once, consumer group, event driven, java backend / SDE 2 / backend interview
  experience, spring boot interview, microservices. 11,439 posts listed; the
  5,786 with experience-like titles from 29 Oct 2024 on were downloaded in full,
  then merged with the 18,854 posts of the Python pass: **21,683 posts**.
- Kept only **candidate interview write-ups** in the window — titles that read
  like an experience (experience, round, onsite, offer, reject, selected, a
  company followed by `|`); guides, prep journeys, frameworks, question lists,
  advice requests and titles ending in "?" were dropped: **4,798 write-ups**,
  of which **232 mention Kafka**.
- Code blocks were stripped. Each question has a pattern, matched only in the
  text near a Kafka / broker / consumer / producer / topic / queue mention, so
  database partitioning or replication in an unrelated design round doesn't count.
  A question's count is the number of distinct write-ups whose text matches.
- Companies come from the title (a known-company list, then the title's first
  words), cleaned by hand.

## Read the numbers as an ordering, not a percentage

- LeetCode Discuss leans to product companies and DSA rounds; most write-ups
  summarise ("a few Kafka questions"), so every count is a lower bound.
- Some write-ups list topics rather than questions (EPAM's "Kafka: consumer
  groups, partitions, offsets, rebalancing…"), which counts each topic once.
- Kafka questions arrive two ways: as **concept questions** in a Java/backend
  round, and as **follow-ups in system design** ("why Kafka here?", "what if the
  consumer gets the same event twice?"). Both are counted.

## Asked (write-ups, of 232)

| Question | Write-ups | Kafka page |
|---|---:|---|
| Partitions: what they are, how the producer picks one, why the key matters | 40 | KFK-06 |
| What is Kafka, how it works — brokers, topics, partitions, offsets | 29 | KFK-01 |
| Duplicate messages / idempotent consumer (payment must not charge twice) | 24 | KFK-08 |
| Kafka vs RabbitMQ / SQS — why Kafka | 22 | KFK-01 |
| Event-driven architecture vs synchronous calls | 20 | KFK-15 |
| Ordering guarantee | 19 | KFK-02 |
| Consumer groups (and more consumers than partitions) | 17 | KFK-02 |
| Replication, leader, ISR, broker failure | 14 | KFK-03 |
| Retries, dead letter topic, poison message | 13 | KFK-09 |
| Queue vs pub/sub, pull vs push | 13 | KFK-02 |
| How you used Kafka in your project, and why | 10 | — |
| Offsets, auto vs manual commit | 9 | KFK-08 |
| Saga / consistency across services | 8 | — |
| Rebalancing | 7 | KFK-10 |
| Outbox pattern / dual write | 7 | KFK-13 |
| Kafka Streams, KStream vs KTable | 7 | — |
| acks, min.insync.replicas, no message loss | 5 | KFK-06 |
| Delivery semantics (at-most / at-least / exactly once) | 5 | KFK-08 |
| Consumer lag | 5 | KFK-10 |
| Why Kafka is fast | 5 | KFK-06 |
| Retention, segments, compaction | 4 | KFK-05 |
| How many partitions / changing them | 4 | KFK-01 |
| Producer sent it, consumer never got it — debug | 3 | KFK-08 |
| Schema Registry / Avro | 3 | — |
| Sync vs async between microservices | 3 | KFK-15 |
| ZooKeeper vs KRaft, the controller | 2 | KFK-04 |
| session timeout vs heartbeat vs max.poll.interval | 2 | KFK-10 |
| **Kafka transactions** (transactional.id, coordinator, read_committed) | **0** | was KFK-11/12 |
| **Idempotent producer internals** (PID, sequence numbers) | **0** by name | KFK-07 |

Most-named companies: Walmart, Goldman Sachs, Uber, EPAM, MobiKwik, Zomato,
Dell, Groww, Astrotalk, Tekion, Microsoft.

## What it changed in the playlist (27 videos → 12 + question bank)

The 13-video list already skipped setup demos, multi-topic consumers, Schema
Registry, CDC outbox and the eight Kafka Streams videos. The counts confirm
those skips (Schema Registry 3, Streams 7 — mostly a line in a project
description) and change three things:

- **Dropped KFK-11 Producer Transaction Handling (62 min) and KFK-12 Consumer
  Transaction Handling (45 min).** No write-up asked about Kafka transactions;
  delivery semantics (5) is answered on the question bank, including why EOS
  stops at Kafka and what to do instead (idempotent consumer).
- **Added KFK-15 Event Driven Architecture Introduction (#1, 30 min)**: event-driven
  vs synchronous was asked in 20 write-ups and sync vs async in 3 more.
- KFK-07 (idempotent producer) was kept — already watched — but it is asked only
  as part of "how do you avoid duplicates?".

Net: 107 minutes of video out, 30 in.
