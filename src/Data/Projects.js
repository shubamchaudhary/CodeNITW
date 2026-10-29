// The Projects stack (owner-only, like AI Stack): personal projects to be
// able to explain end to end in an interview, one section per project and one
// topic per chapter. Only titles and one-line summaries live here — the
// chapters themselves are written (pasted) into each topic's notes, which are
// stored in the owner's own progress document and never ship with the site.
// `parts` lists which "# Part N" chapters of the InterviewPlanPrep study guide
// a topic holds, so the whole guide can be imported as one file and split.

export const PROJECT_SECTIONS = [
  { key: "ipp", label: "InterviewPlanPrep" },
  { key: "loglens", label: "LogLens" },
  { key: "kafka", label: "Kafka" },
];

// Kafka, learnt from the Concept && Coding playlist: one topic per video, its
// notes written while watching, then a question bank to finish.
const KAFKA_PLAYLIST = "https://www.youtube.com/playlist?list=PL6W8uoQQ2c62YCR2kkE-0tg3-y1QwaIWk";
const kafkaResource = (id, [position, videoId, title, minutes], i) => ({
  id: `${id}-r${i + 1}`,
  kind: "video",
  title,
  source: "Concept && Coding - by Shrayansh",
  playlist: "Event Driven Architecture (with Kafka) from Basics to Advanced",
  playlistUrl: KAFKA_PLAYLIST,
  url: `https://www.youtube.com/watch?v=${videoId}&list=PL6W8uoQQ2c62YCR2kkE-0tg3-y1QwaIWk&index=${position}`,
  position,
  minutes,
  note: "",
});
// A topic covering several videos: `videos` is [[position, videoId, title, minutes], ...].
const kafkaTopic = (n, title, summary, videos) => {
  const id = `KFK-${String(n).padStart(2, "0")}`;
  return {
    id,
    section: "kafka",
    sectionLabel: "Kafka",
    title,
    summary,
    resources: videos.map((v, i) => kafkaResource(id, v, i)),
  };
};
const kafkaVideo = (n, position, videoId, title, minutes, summary) =>
  kafkaTopic(n, title, summary, [[position, videoId, title, minutes]]);

export const PROJECT_TOPICS = [
  {
    id: "IPP-01",
    parts: [0],
    section: "ipp",
    sectionLabel: "InterviewPlanPrep",
    title: "Overview & architecture",
    summary: "The pitch, the architecture diagram, the tech stack and why each piece was chosen, and where everything lives in the repo.",
  },
  {
    id: "IPP-02",
    parts: [1, 2],
    section: "ipp",
    sectionLabel: "InterviewPlanPrep",
    title: "JavaScript & React",
    summary: "Closures, async and the event loop; components, hooks, rendering, and why state lives in a small publish/subscribe store.",
  },
  {
    id: "IPP-03",
    parts: [3, 4, 5, 6],
    section: "ipp",
    sectionLabel: "InterviewPlanPrep",
    title: "Routing, performance, CSS, browser & Vite",
    summary: "Client-side routing, code splitting (−61% JS), Tailwind and layout, browser storage and security, and the build tool.",
  },
  {
    id: "IPP-04",
    parts: [7, 8, 9, 10],
    section: "ipp",
    sectionLabel: "InterviewPlanPrep",
    title: "Firebase, Auth, Firestore & rules",
    summary: "JWT sign-in, the Firestore data model and limits, the fast-forward security rule line by line, and NoSQL vs SQL.",
  },
  {
    id: "IPP-05",
    parts: [11, 12, 13],
    section: "ipp",
    sectionLabel: "InterviewPlanPrep",
    title: "Serverless, APIs & email",
    summary: "Vercel functions, cron and CDN caching; REST vs GraphQL; SMTP, deliverability and signed links.",
  },
  {
    id: "IPP-06",
    parts: [14, 15, 16],
    section: "ipp",
    sectionLabel: "InterviewPlanPrep",
    title: "Sync engine, merge & history",
    summary: "The offline-first sync engine, git-style notes with three-way merge, and append-only version history.",
  },
  {
    id: "IPP-07",
    parts: [17, 18, 19],
    section: "ipp",
    sectionLabel: "InterviewPlanPrep",
    title: "Contests, reminders & time log",
    summary: "The contest cache with per-platform fallback, the idempotent reminder pipeline, and the planner's per-day time log.",
  },
  {
    id: "IPP-08",
    parts: [20, 21],
    section: "ipp",
    sectionLabel: "InterviewPlanPrep",
    title: "Stories & interview kit",
    summary: "STAR stories, the three walkthroughs to say out loud, a question bank, limitations and a final checklist.",
  },
  {
    id: "LL-01",
    section: "loglens",
    sectionLabel: "LogLens",
    title: "Overview & architecture",
    summary: "What LogLens does, the pitch, and how ingest, analysis and querying fit together.",
  },
  {
    id: "LL-02",
    section: "loglens",
    sectionLabel: "LogLens",
    title: "Streaming ingest over Kafka",
    summary: "Constant-heap ingest of GB-scale archives: window-aligned byte ranges, ranged blob reads, offsets and idempotent upserts.",
  },
  {
    id: "LL-03",
    section: "loglens",
    sectionLabel: "LogLens",
    title: "Anomalies & grounded narratives",
    summary: "Deterministic parsers and metrics, LLM calls gated to flagged windows, and the LLM-as-judge groundedness loop.",
  },
  {
    id: "LL-04",
    section: "loglens",
    sectionLabel: "LogLens",
    title: "Corrective RAG & hybrid search",
    summary: "The query-time LangGraph graph: retrieve → grade → rewrite → re-retrieve over vector + full-text search, with citations.",
  },
  {
    id: "LL-05",
    section: "loglens",
    sectionLabel: "LogLens",
    title: "PostgreSQL, pgvector & indexes",
    summary: "Per-session chunk tables with HNSW, GIN and B-tree indexes, and why that avoids post-filtered ANN recall loss.",
  },
  {
    id: "LL-06",
    section: "loglens",
    sectionLabel: "LogLens",
    title: "Evals, benchmarks & performance",
    summary: "How quality and speed are measured: retrieval, groundedness and anomaly evals, ingest and query benchmarks, with real numbers.",
  },
  {
    id: "LL-07",
    section: "loglens",
    sectionLabel: "LogLens",
    title: "Stories & interview kit",
    summary: "Design decisions, trade-offs, the pitch and demo, likely questions and answers for LogLens.",
  },
  // Checked against 232 real interview write-ups (scripts/data/kafkaInterviewEvidence.md):
  // event-driven basics were asked in 20, so the playlist's intro (#1) joins as
  // KFK-00. Kafka transactions were asked in none, but KFK-10 keeps them: the resume's
  // "exactly-once effects" line invites "why not Kafka transactions?".
  kafkaVideo(0, 1, "QNfIUIZQ9Vo", "Event Driven Architecture (EDA) Introduction", 30, "Events vs synchronous calls, pub/sub vs queues, and what you trade for loose coupling."),
  kafkaVideo(1, 2, "fsmhYmzU-2M", "Kafka Architecture - Part 1", 32, "Topic, partition, offset, broker."),
  kafkaVideo(2, 3, "75iKJ0sISKU", "Kafka Architecture - Part 2", 31, "Consumer groups and partition assignment."),
  kafkaVideo(3, 4, "TQLGDfJdXrQ", "Kafka Architecture - Part 3", 33, "Replication, leader and ISR."),
  kafkaVideo(4, 5, "5phy_mbrOBw", "Kafka Architecture - Part 4", 29, "The controller, KRaft vs ZooKeeper."),
  kafkaVideo(5, 6, "OaBkjyqS7jU", "Kafka Architecture - Part 5", 17, "Remaining internals: retention and segments."),
  kafkaVideo(6, 8, "eR_BYV-8WOQ", "How Kafka Producer Works Internally", 46, "acks, batching, retries, the partitioner — \"why is Kafka fast\" and latency vs throughput."),
  kafkaVideo(7, 10, "oNlds6FQym0", "Kafka Producer Idempotency Internals", 34, "PID, sequence numbers and duplicate prevention."),
  kafkaVideo(8, 11, "f8lYPOvNGrU", "Kafka Consumer Setup - Part 1", 48, "The poll loop, offset commits, auto vs manual commit."),
  kafkaTopic(9, "Consumer errors, Dead Letter Topic & advanced configs", "Retries, poison messages and the DLT; max.poll.interval.ms, session timeout and rebalancing edge cases.", [
    [13, "b61vljmLVLY", "Kafka Consumer Exception Handling & Dead Letter Topic", 59],
    [14, "Jwgh9h44h7s", "Kafka Consumer Advanced Configurations - Part 3", 36],
  ]),
  kafkaTopic(10, "Transactions, exactly-once & the outbox pattern", "Transaction coordinator, epoch and zombie fencing; EOS, LSO and read_committed — why exactly-once stops at Kafka (hence DeepLogLens's idempotent upserts); the dual-write problem and the polling outbox.", [
    [15, "3IR7JSag5JY", "Kafka Producer Transaction Handling", 62],
    [16, "QqKzDe5NB5E", "Kafka Consumer Transaction Handling", 45],
    [18, "sgWmFGzHpdU", "Kafka: Outbox Pattern (Part 1) - Polling Strategy", 19],
  ]),
  {
    id: "KFK-11",
    section: "kafka",
    sectionLabel: "Kafka",
    title: "Question bank",
    summary: "Kafka questions real interviews asked (232 write-ups, 2024–26), plus the ones your resume invites, with answers — after all 14 videos (11 topics).",
    // Only the asked questions (src/Data/KafkaAsked.js): no note to write here.
    asked: true,
    noteless: true,
  },
];

const BY_ID = Object.fromEntries(PROJECT_TOPICS.map((t) => [t.id, t]));

export function getProjectTopic(id) {
  return BY_ID[id] || null;
}
