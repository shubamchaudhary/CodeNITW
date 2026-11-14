import type { Scene } from "../../lib/types.ts";
import { B, arch, sec } from "../ll01/h.ts";
import { check } from "./k.ts";
import { BRIDGE, BRIDGE_STEPS } from "./boards.ts";

// Part 1: the three systems, the same decisions, the different ones, and how
// to defend DeepLogLens's and InterviewPlanPrep's choices.
export const p1: Scene[] = [
  {
    kind: "title",
    eyebrow: "Company prep · Brikby",
    title: "Your designs vs Brikby's",
    subtitle: "Same decisions, different decisions, and why they need you",
    beats: B(
      "Your designs, next to Brikby's. Your two projects, DeepLogLens and InterviewPlanPrep, side by side with what we know and what we infer about Brikby. Where you decided the same way. Where you decided differently, and how to defend it. Where your version is stronger, where theirs is, and how to turn all of it into one pitch: you need someone who has already built this. Same rules as before: public facts you can say, observed facts you never quote, and inferences you call guesses.",
    ),
  },

  // ------------------------------------------------------------ 1
  sec("1", "Three systems, one picture", "Topic one. Three systems, one picture. Which of your projects is their front half, and which is their back half."),
  arch(
    BRIDGE,
    BRIDGE_STEPS,
    B(
      "Here's Brikby's pipeline as one board. The front half on the left, the back half on the right. And every box is lit with the project of yours that proves you can build it.",
      { say: "The front half. Firebase Auth, with ID tokens verified in functions. Bytes straight to storage. Status pushed by Firestore listeners. You run exactly this stack in InterviewPlanPrep. Zero ramp up.", tone: "key" },
      "Accept, then fan out. A job created once, then the work split into parts and processed in parallel. That's DeepLogLens's byte range parts over Kafka: two hundred and five parts for a one gigabyte file.",
      "LLM only where needed. Deterministic code counts and decides. The model reads and explains only what needs it. Forty two thousand calls instead of two hundred and twenty thousand.",
      "Sources that fail. Rate limited lanes, a retry topic, a dead letter queue, and the rule that nothing is ever stuck. That's the shape of a government portal connector.",
      "Grounded and measured. Every claim points at stored evidence, and a seeded evaluation runs in CI and fails the build below its thresholds.",
      { say: "And versioned, delivered once. Revisions with compare and swap and append only history, from your notes. And effects that happen exactly once, from your upserts. That's what a lawyer's edits and a lender webhook need.", tone: "key" },
    ),
    "Their pipeline, lit by your projects",
  ),
  check({
    topic: "the picture",
    q: "Which of your projects is Brikby's front half, and which is its back half?",
    a: "InterviewPlanPrep is the front half (Firebase Auth, ID tokens to functions, Firestore listeners); DeepLogLens is the back half (messy input, async fan-out, LLM only where needed, grounded output, evals).",
    aSay: "InterviewPlanPrep is their front half: Firebase Auth, ID tokens to functions, Firestore listeners. DeepLogLens is their back half: large messy input, asynchronous fan out, the LLM only where needed, grounded output, and evals.",
  }),

  // ------------------------------------------------------------ 2
  sec("2", "The decisions you made the same way", "Topic two. The decisions you made the same way as Brikby. These are your credibility: you didn't read about them, you built them."),
  {
    kind: "compare",
    title: "Same decision, same reason",
    cols: [
      { title: "Heavy work off the request path", icon: "🚚", tone: "blue", items: ["DLL: upload returns in ms", "Brikby: analysis is a job"] },
      { title: "Bytes bypass the API", icon: "🪣", tone: "green", items: ["DLL: presigned PUT to B2", "Brikby: straight to Cloud Storage"] },
      { title: "Trust the token, not the body", icon: "🪪", tone: "amber", items: ["IPP: verifyIdToken", "Brikby: Bearer ID token"] },
      { title: "Push, don't poll", icon: "📡", tone: "purple", items: ["IPP: snapshot listeners", "Brikby: job status listener"] },
    ],
    footer: "and: code decides what must be exact · every claim cites evidence · instrument what you ship",
    beats: B(
      "Four decisions you made exactly the way they did. One: heavy work never sits on the request path. In DeepLogLens, the upload returns in milliseconds and the work runs behind Kafka. At Brikby, an analysis is a job, not a long request.",
      "Two: the bytes bypass the API. DeepLogLens uploads with a presigned PUT straight to Backblaze. Brikby's browser uploads straight to Cloud Storage.",
      "Three: the server trusts a Google signed token, never the request body. InterviewPlanPrep verifies the ID token in every function. Brikby sends the same bearer token to its functions.",
      "Four: push, don't poll. Your notes and ticks arrive by snapshot listeners. Their job status arrives the same way.",
      { say: "And three more, at the level of principle. Code decides what must be exact. Every claim cites its evidence. And you instrument what you ship. Their job description uses almost those words.", tone: "key" },
    ),
  },
  check({
    topic: "same decisions",
    q: "Name two decisions you and Brikby made the same way, with the reason for each.",
    a: "Bytes go straight to storage, never through the API (the API stays small and fast); live status is pushed by a Firestore listener, not polled (no wasted requests, every tab updates at once).",
    aSay: "For example: bytes go straight to storage, never through the API, so the API stays small and fast. And live status is pushed by a Firestore listener rather than polled, so there are no wasted requests and every open tab updates at once.",
  }),

  // ------------------------------------------------------------ 3
  sec("3", "The decisions you made differently", "Topic three. Where you decided differently. Each difference has a reason, and for one of them, the honest answer is that you'd change it at Brikby."),
  {
    kind: "compare",
    title: "Different decision, different constraint",
    cols: [
      { title: "Queue", icon: "📨", tone: "blue", items: ["you: Kafka", "them: a managed queue (guess)", "lanes per key, replay vs simplicity"] },
      { title: "Database", icon: "🗄", tone: "green", items: ["you: Postgres + pgvector", "them: Firestore (+ SQL)", "SQL and search vs live documents"] },
      { title: "Compute", icon: "⚙️", tone: "amber", items: ["you: one long-running JVM", "them: functions + workers (guess)", "consumers live forever"] },
      { title: "The report", icon: "📑", tone: "purple", items: ["you: one canonical, server-side", "them: unknown: your question 1"] },
    ],
    footer: "offline-first (IPP) vs online jobs (Brikby): a lawyer's report isn't edited on a plane",
    beats: B(
      "Four real differences. The queue. You used Kafka. They likely use a managed queue, like Cloud Tasks or Pub Sub: that's a guess. The difference is partitions as rate limit lanes and replay, against simplicity.",
      "The database. You used Postgres with pgvector. They use Firestore, and their job description mentions SQL, so likely both. The difference is SQL aggregation and search, against live per user documents.",
      "Compute. DeepLogLens is one long running Java process, because Kafka consumers live forever. They run functions, plus some worker runtime we can't see.",
      "And the report. DeepLogLens composes one canonical report on the server and stores it. How Brikby assembles theirs, you don't say. That's what your first design question is for.",
      "And one difference that just reflects the product. InterviewPlanPrep is offline first. Brikby's jobs are online. A lawyer's report isn't edited on a plane.",
    ),
  },
  check({
    topic: "different decisions",
    q: "Which of your differences would you change at Brikby, and which would you keep?",
    a: "Change: Kafka → a managed queue (Cloud Tasks / Pub/Sub) at their volume. Keep: one canonical server-side report, idempotent steps keyed by content, evals in CI.",
    aSay: "Change: Kafka, for a managed queue like Cloud Tasks or Pub Sub at their volume. Keep: one canonical report on the server, idempotent steps keyed by content, and evals in CI.",
  }),

  // ------------------------------------------------------------ 4
  sec("4", "Defending DeepLogLens", "Topic four. Defending DeepLogLens's choices, when someone from a serverless startup asks why you built it that way."),
  {
    kind: "sayit",
    q: "\"Why Kafka for a side project? Isn't that overkill?\"",
    lines: [
      "\"The constraints chose it: 30 requests a minute per Groq key,",
      "so every key got its own partition and one consumer thread: a lane at its own full rate, never blocking the others.",
      "Kafka also gave me replay for testing exactly-once effects, plus a retry topic and a DLQ.",
      "For a system your size I'd start with Cloud Tasks or Pub/Sub, and reach for Kafka only when replay or per-key ordering at volume earned it.\"",
    ],
    beats: B(
      "The question you'll most likely get. Why Kafka for a side project? Isn't that overkill?",
      "The constraints chose it. Thirty requests a minute per Groq key.",
      "So every key got its own partition and one consumer thread. A lane that runs at its own full rate, and never blocks the others.",
      "Kafka also gave me replay, to test exactly once effects, plus a retry topic and a dead letter queue.",
      { say: "And for a system your size, I'd start with Cloud Tasks or Pub Sub, and reach for Kafka only when replay or per key ordering at volume earned it.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "Three more DeepLogLens defences",
    cols: [
      { title: "Postgres, not Firestore", icon: "🗄", tone: "blue", items: ["exact counts per minute, joins", "a part's marker + rows in one tx", "vector + full-text, one place"] },
      { title: "One deployable", icon: "📦", tone: "green", items: ["fits the free tier", "consumer groups = more copies", "split enrichment first"] },
      { title: "\"Exactly-once?\"", icon: "🎯", tone: "amber", items: ["at-least-once delivery", "exactly-once effects", "content-fingerprint PK · kill -9 tested"] },
    ],
    footer: "and a v1 lesson: a polled jobs table was tried first and rejected: no replay, no consumer groups",
    beats: B(
      "Three more. Why Postgres, not Firestore? Every question was relational or search. Exact counts per minute and category, joins from findings to chunks, a transaction that writes a part's marker and its rows together, and hybrid vector plus full text search, all in one place.",
      "Why one deployable, not microservices? It fit the free tier, and Kafka consumer groups already let you run more copies. The first thing you'd split out is enrichment: it's rate limited, and scales with anomalies, not traffic.",
      { say: "And, is it really exactly once? Say it precisely: at least once delivery, exactly once effects. Every chunk's primary key is a fingerprint of its content and position, so a redelivered part writes nothing new. Tested with kill dash nine, replays and rebalances.", tone: "key" },
      "And a bonus story. Your first version used a polled jobs table, and you rejected it: no replay, and no consumer groups. That shows you've tried the simple thing, and know exactly when it stops being enough.",
    ),
  },
  check({
    topic: "defending DeepLogLens",
    q: "In one sentence: why is Kafka defensible in DeepLogLens, but not what you'd pick for Brikby today?",
    a: "In DeepLogLens partitions were the rate-limit lanes and replay was the test harness; at Brikby's volume a managed queue gives retries and rate control with nothing to operate.",
    aSay: "In DeepLogLens, partitions were the rate limit lanes and replay was the test harness. At Brikby's volume, a managed queue gives retries and rate control with nothing to operate.",
  }),

  // ------------------------------------------------------------ 5
  sec("5", "Defending InterviewPlanPrep", "Topic five. Defending InterviewPlanPrep's choices, and building the bridge to their product."),
  {
    kind: "compare",
    title: "Three InterviewPlanPrep defences",
    cols: [
      { title: "CAS in the rules", icon: "🛡", tone: "blue", items: ["devices edit offline", "client check isn't atomic", "rule = check + write, every client"] },
      { title: "Vercel, not Cloud Functions", icon: "▲", tone: "green", items: ["same repo and deploy", "CDN in front · cron free", "admin SDK looks the same"] },
      { title: "Three local layers", icon: "🧱", tone: "amber", items: ["store: sync reads", "journal: what and when", "Firestore cache: offline queue"] },
    ],
    footer: "each answer is a constraint, not a preference",
    beats: B(
      "Three InterviewPlanPrep defences. Why compare and swap in the security rules? Because devices edit offline, so a transaction is impossible, and a client side check isn't atomic. The rule is the check and the write in one step, for every client.",
      "Why Vercel functions, not Cloud Functions? Same repo and deploy as the site, the CDN in front, cron for free, and to Firestore the admin SDK looks the same either way.",
      "Why three local layers? The store gives synchronous reads, the journal records what changed and when, and Firestore's cache handles the offline queue. Each does a job the others can't.",
      { say: "Notice the pattern. Each answer is a constraint, not a preference. That's what makes a design sound like yours.", tone: "key" },
    ),
  },
  {
    kind: "big",
    tone: "interview",
    lead: "The bridge to their product",
    text: "A lawyer's edit to a report is a note edit: revision one is the AI draft, every save names its base, history is append-only.",
    after: "an audit trail for a legal opinion · the AI-vs-final diff is free eval data",
    beats: B(
      "And here's the bridge. If they ask how your notes relate to their product, say this.",
      { say: "A lawyer's edit to a report is a note edit. Revision one is the AI draft. Every save names the revision it was built on, a stale save is refused and merged, and the history is append only.", tone: "key" },
      { say: "That gives a regulated lender an audit trail of who changed what in a legal opinion. And the difference between the AI draft and the final version is free evaluation data.", tone: "key" },
    ),
  },
  check({
    topic: "defending InterviewPlanPrep",
    q: "What's the bridge from your notes versioning to Brikby's product?",
    a: "Report edits as revisions with compare-and-swap and append-only history: an audit trail for a legal opinion, and the AI-vs-final diff as eval data.",
    aSay: "Treat report edits as revisions, with compare and swap and append only history. That's an audit trail for a legal opinion, and the diff between the AI draft and the final report becomes evaluation data.",
  }),
];
