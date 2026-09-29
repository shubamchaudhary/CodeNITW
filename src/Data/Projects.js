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
];

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
    title: "Stories & interview kit",
    summary: "Design decisions, trade-offs, likely questions and answers for LogLens.",
  },
];

const BY_ID = Object.fromEntries(PROJECT_TOPICS.map((t) => [t.id, t]));

export function getProjectTopic(id) {
  return BY_ID[id] || null;
}
