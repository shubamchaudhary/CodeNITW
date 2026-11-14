// The Projects stack (owner-only, like AI Stack): personal projects to be
// able to explain end to end in an interview, one section per project and one
// topic per chapter. Only titles and one-line summaries live here — the
// chapters themselves are written (pasted) into each topic's notes, which are
// stored in the owner's own progress document and never ship with the site,
// except where a built-in document replaces them (Data/projectsDocs: IPP-01/02, LL-01, IOA-01/02, BY-00..06, BRIK-01/02).
// `parts` lists which "# Part N" chapters of the InterviewPlanPrep study guide
// a topic holds, so the whole guide can be imported as one file and split.

export const PROJECT_SECTIONS = [
  { key: "ipp", label: "InterviewPlanPrep" },
  { key: "loglens", label: "DeepLogLens" },
  { key: "invops", label: "Inventory Ops Agent" },
  { key: "byjob", label: "Blue Yonder work" },
  { key: "brikby", label: "Company prep: Brikby" },
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
    title: "InterviewPlanPrep, end to end",
    summary: "This site as a signed-in student uses it, every resume line defended: the React shell, the offline-first store, highlights and pinned notes, git-style notes with compare-and-swap and three-way merge, the planner and its timer, contests and reminders.",
  },
  {
    id: "IPP-02",
    section: "ipp",
    sectionLabel: "InterviewPlanPrep",
    title: "Firebase and Firestore, and how InterviewPlanPrep uses them",
    summary: "From zero: Firebase Auth and ID tokens, documents and queries, writes and transactions, listeners and the offline cache, security rules and compare-and-swap, the admin SDK, limits and cost; each mapped to this site's code, with the answers to give.",
  },
  {
    id: "LL-01",
    section: "loglens",
    sectionLabel: "DeepLogLens",
    title: "DeepLogLens, end to end",
    summary: "The architecture as your resume states it, taught slowly: the Kafka pointers, the chunk table and its content-fingerprint upserts, embeddings and enrichment, the evals, per-session tables, and the alternatives behind every decision.",
  },
  // A previous job's LLM inventory-operations agent: its architecture and the
  // data-management layer built there, from the team's code documentation.
  {
    id: "IOA-01",
    section: "invops",
    sectionLabel: "Inventory Ops Agent",
    title: "Inventory Ops Agent, end to end",
    summary: "The LangGraph supervisor and its four subagents, and the data layer you built: hierarchy-aware reads, Redis-staged writes, HITL interrupts and Base + Overlay commits, with the follow-ups.",
  },
  {
    id: "IOA-02",
    section: "invops",
    sectionLabel: "Inventory Ops Agent",
    title: "Inventory Ops Agent: the interview story",
    summary: "The 25-minute script: what changed, the stack and why, the problem you faced (an approval interrupt retried away), the team around you, and follow-ups IOA-01 does not cover.",
  },
  // The Blue Yonder resume stories, from the team's design documents, written
  // at interview level (no internal names): what changed, the stack and why, the
  // story to tell, one problem faced, the team, and follow-ups.
  {
    id: "BY-00",
    section: "byjob",
    sectionLabel: "Blue Yonder work",
    title: "The allocation platform, end to end",
    summary: "The system every allocation story lives in: API vs batch, the partitioner and processors, one run from reader to publisher, where each story plugs in, and the gotchas.",
  },
  {
    id: "BY-01",
    section: "byjob",
    sectionLabel: "Blue Yonder work",
    title: "Priority Allocation",
    summary: "Ranking stores from a business measure instead of static network config: the roll-up, direction, fair share on ties, the determinism bug, the need-service contract. ~25 min.",
  },
  {
    id: "BY-02",
    section: "byjob",
    sectionLabel: "Blue Yonder work",
    title: "Lifecycle-Driven Allocation",
    summary: "The assortment plan as the source of truth: three gates (where, when, groups), need bridges, double-gated and fail-open rollout, the load-bearing call order. ~25 min.",
  },
  {
    id: "BY-03",
    section: "byjob",
    sectionLabel: "Blue Yonder work",
    title: "Runtime Snowflake Connection Routing",
    summary: "Standard, OAuth and sharded modes per request: flags vs properties, lazy pools, session prep, rollout, and the tenant id that leaked across pooled threads. ~25 min.",
  },
  {
    id: "BY-04",
    section: "byjob",
    sectionLabel: "Blue Yonder work",
    title: "Pack Service Integration",
    summary: "The sync/async router for the case-pack optimizer: submit, poll, fetch, retries and fallback rules, and why a 400 never falls back. ~10 min.",
  },
  {
    id: "BY-05",
    section: "byjob",
    sectionLabel: "Blue Yonder work",
    title: "Dual APIM Support",
    summary: "Azure APIM and Gravitee in parallel: gateway-agnostic JWT validation, one internal identity across sync, async and batch, target-aware S2S tokens. ~10 min.",
  },
  {
    id: "BY-06",
    section: "byjob",
    sectionLabel: "Blue Yonder work",
    title: "Internship: onboarding, import/export, Testcontainers",
    summary: "Tenant onboarding with Key Vault credentials, ZIP-of-CSV config import/export, and the PostgreSQL Testcontainers framework gating every PR. ~10 min.",
  },
  // Prep for a company's system design round, from public signals only: the
  // customer problem, the business and scale (labelled estimates), the observed
  // stack vs the inferred pipeline, and two design questions to raise.
  {
    id: "BRIK-01",
    section: "brikby",
    sectionLabel: "Company prep: Brikby",
    title: "Brikby: the business, the workflow, the architecture",
    summary: "Lender property due diligence in India (title chain, EC, state land-record portals), what Brikby sells and at what scale, the observed stack vs the inferred pipeline, durable jobs and portal agents, evals, cost per file, and two questions to raise.",
  },
  {
    id: "BRIK-02",
    section: "brikby",
    sectionLabel: "Company prep: Brikby",
    title: "Your designs vs Brikby's",
    summary: "DeepLogLens and InterviewPlanPrep next to Brikby: the decisions made the same way, the different ones and how to defend them, where your version is stronger and where theirs is, and the pitch for why they need you.",
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
