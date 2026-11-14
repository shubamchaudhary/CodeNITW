import type { Scene } from "../../lib/types.ts";
import { B, sec } from "../ll01/h.ts";
import { check } from "./k.ts";

// Part 2: where you're stronger, where they are, the pitch, the hard questions.
export const p2: Scene[] = [
  // ------------------------------------------------------------ 6
  sec("6", "Where your version is stronger", "Topic six. Where your version is stronger. Not to show off: to show exactly what you'd bring on day one."),
  {
    kind: "bullets",
    title: "What you bring, with evidence",
    firstItemStep: 1,
    items: [
      { icon: "🎯", text: "Exactly-once effects on at-least-once delivery", sub: "fingerprint PK · offsets after commit · kill -9 tested → no double credits, flags or webhooks" },
      { icon: "🚦", text: "Rate-limit-aware fan-out that never gets stuck", sub: "a lane per key · 429 → retry with notBefore · DLQ → LLM quotas and portals" },
      { icon: "📏", text: "Evals in CI with thresholds", sub: "F1 0.90 · retrieval recall · judge κ 0.625 → \"build evals that keep it fixed\"" },
      { icon: "💸", text: "Cost discipline", sub: "LLM on 20% of windows: 42,205 calls, not 220,657 → cost per file at month-end" },
      { icon: "🔥", text: "The same Firebase stack, already in production", sub: "Auth, ID tokens, listeners, rules, admin SDK → zero ramp-up on the front half" },
    ],
    beats: B(
      "Five strengths, each with its evidence, and each mapped to something Brikby needs.",
      { say: "One. Exactly once effects on at least once delivery. Fingerprint keys, offsets after the commit, tested with kill dash nine. At Brikby, that's no double charged credits, no duplicate flags, no duplicate webhooks.", tone: "key" },
      "Two. Fan out that respects rate limits and never gets stuck. A lane per API key, four twenty nines to a retry topic with a not before time, and a dead letter queue. That's the pattern for LLM quotas, and for government portals.",
      "Three. Evals in CI with thresholds. F1 of point nine, retrieval recall, and an LLM judge calibrated against humans with a kappa of point six two five. Their job description literally says: build evals that keep it fixed.",
      "Four. Cost discipline. The LLM only ran on twenty percent of the windows. Forty two thousand calls instead of two hundred and twenty thousand. That's cost per file at a month end peak.",
      { say: "And five. The same Firebase stack, already in production, with real users. Auth, ID tokens, listeners, rules, the admin SDK. Zero ramp up on their front half.", tone: "key" },
    ),
  },
  {
    kind: "big",
    tone: "idea",
    lead: "A sixth, easy to miss",
    text: "Your contests page is a small portal connector: clist first, platform APIs as fallback, allSettled, 8 s timeouts, the last good list kept per platform.",
    after: "flaky external sources, handled without one of them holding up the rest",
    beats: B(
      "And a sixth strength, easy to miss.",
      { say: "Your contests page is a small portal connector. clist first, each platform's own API as a fallback, Promise all settled with eight second timeouts so one slow platform can't hold up the others, and the last good list kept per platform when one fails.", tone: "key" },
      "That's exactly the shape of a government source connector. Smaller, friendlier sources, but the same thinking.",
    ),
  },
  check({
    topic: "your strengths",
    q: "Pick the three strengths that map most directly onto their job description.",
    a: "Idempotency and exactly-once effects (queues, retries, idempotency); evals in CI (traces and evals); rate-limited fan-out with retries and a DLQ (government sources with rate limits).",
    aSay: "Idempotency and exactly once effects, for their line on queues, retries and idempotency. Evals in CI, for traces and evals. And rate limited fan out with retries and a dead letter queue, for government sources with rate limits.",
  }),

  // ------------------------------------------------------------ 7
  sec("7", "Where their version is stronger", "Topic seven. Where their version is stronger. Saying this honestly is itself a strength in a founding engineer interview."),
  {
    kind: "compare",
    title: "Their strengths, and what to say",
    cols: [
      { title: "Real customers", icon: "🏦", tone: "blue", items: ["15,000+ files since January", "\"shaped by lenders; mine by test sets\""] },
      { title: "Messy input", icon: "✍️", tone: "red", items: ["handwritten, 50+ languages", "\"harder than parsing logs\""] },
      { title: "Domain encoded", icon: "📚", tone: "green", items: ["state rules, lender formats", "\"that's the moat\""] },
      { title: "Simplicity", icon: "🪶", tone: "amber", items: ["managed, serverless", "\"Kafka would be wrong at your size\""] },
    ],
    footer: "and portals with sessions and CAPTCHAs: \"a gap I'd close fast\"",
    beats: B(
      "Their strengths, and what to say about each. Real customers. Fifteen thousand files since January. Say: your system has been shaped by lenders; mine was shaped by test sets.",
      "Messy input. Scanned, handwritten, fifty plus languages. Say: OCR and vision on handwritten regional documents is harder than parsing log lines, and I'd want to learn how you evaluate it.",
      "Domain knowledge, encoded. State rules, lender policies, bank formats. Say: that's the moat. I'd bring the engineering around it.",
      "Simplicity, for a tiny team. Managed and serverless, with little to operate. Say: Kafka would be the wrong call at your size.",
      { say: "And government portals with sessions and CAPTCHAs. Say: I've built against flaky APIs with fallbacks and timeouts, not against portals with sessions and CAPTCHAs. That's a gap I'd close fast.", tone: "key" },
    ),
  },
  check({
    topic: "their strengths",
    q: "Which gap will you admit, and how do you turn it?",
    a: "OCR on handwritten regional scans and stateful portal scraping; turn it with what transfers: evals that measure it, and connectors built like your lanes (limits, retries, timeouts, evidence, never stuck).",
    aSay: "Admit OCR on handwritten regional scans, and stateful portal scraping. Then turn it with what transfers: evals that measure it, and connectors built like your lanes, with rate limits, retries, timeouts, evidence, and never stuck.",
  }),

  // ------------------------------------------------------------ 8
  sec("8", "Why they need you", "Topic eight. Why they need you. Their job description, line by line, against your proof."),
  {
    kind: "compare",
    title: "Their JD → your proof → what you'd do first",
    cols: [
      { title: "Reliability", icon: "🔁", tone: "blue", items: ["queues, retries, idempotency", "→ DLL lanes, DLQ, upserts", "→ idempotency keys per step"] },
      { title: "Delivery", icon: "📮", tone: "green", items: ["outbox, signed webhooks", "→ IPP HMAC links, DLL effects", "→ outbox to the lender's LOS"] },
      { title: "Quality", icon: "📏", tone: "amber", items: ["LLM errors, evals", "→ DLL eval harness in CI", "→ golden set per state + doc type"] },
      { title: "Agents", icon: "🤖", tone: "purple", items: ["multi-agent, gov sources", "→ IOA supervisor + HITL", "→ a connector framework"] },
    ],
    footer: "and a trace per file: TAT, cost, the slowest step: \"instrument what you ship\"",
    beats: B(
      "Their job description, four lines at a time. Reliability: queues, retries, idempotency. Your proof: DeepLogLens's lanes, dead letter queue and upserts. What you'd do first: idempotency keys on every step.",
      "Delivery: the outbox and signed webhooks. Your proof: InterviewPlanPrep's HMAC signed links checked with timing safe equal, and DeepLogLens's exactly once effects. First: an outbox to deliver reports into lenders' systems.",
      "Quality: find why LLM output goes wrong, and build evals. Your proof: the DeepLogLens eval harness, in CI, with thresholds. First: a golden set per state and document type.",
      "Agents over government sources. Your proof: the Inventory Ops Agent at Blue Yonder, a LangGraph supervisor with human approval. First: a connector framework, with rate limits, a cache, evidence, and pending checks.",
      { say: "And across all of it, a trace per file: turnaround, cost, and the slowest step. Their words: instrument what you ship.", tone: "key" },
    ),
  },
  {
    kind: "sayit",
    q: "The 30-second pitch",
    lines: [
      "\"Your front half is the stack I run InterviewPlanPrep on: Firebase Auth, ID tokens to functions, Firestore listeners, security rules.",
      "Your back half is the problem DeepLogLens solves: huge messy input, fanned out asynchronously,",
      "code for what must be exact, an LLM only where it's needed, every claim grounded, and evals in CI.",
      "What I haven't done is OCR on handwritten regional documents or scraping state portals: that's what I'd want to learn here,",
      "and I'd bring the reliability and eval discipline around it.\"",
    ],
    beats: B(
      "So, the thirty second pitch.",
      "Your front half is the stack I run InterviewPlanPrep on: Firebase Auth, ID tokens to functions, Firestore listeners, security rules.",
      "Your back half is the problem DeepLogLens solves: huge, messy input, fanned out asynchronously.",
      "Code for what must be exact, an LLM only where it's needed, every claim grounded, and evals in CI.",
      "What I haven't done is OCR on handwritten regional documents, or scraping state portals. That's what I'd want to learn here.",
      { say: "And I'd bring the reliability and evaluation discipline around it.", tone: "key" },
    ),
  },
  check({
    topic: "the pitch",
    q: "Say the 30-second pitch out loud, from memory.",
    say: "Say the thirty second pitch out loud, from memory.",
    a: "Front half = IPP's Firebase stack · back half = DLL's pipeline discipline · the honest gap = OCR and portals · the offer = reliability and evals around it.",
    aSay: "Four beats. Your front half is my InterviewPlanPrep stack. Your back half is the DeepLogLens problem. My honest gap is OCR and portals. And what I bring is reliability and evals around it.",
    hold: 20,
  }),

  // ------------------------------------------------------------ 9
  sec("9", "The hard questions", "Topic nine. The hardest questions they could ask about your fit, and the answers."),
  {
    kind: "drill",
    items: [
      { q: "\"Your projects are small. Anything at scale?\"", a: "DLL at GB scale: 2 GB in a 256 MB heap, 205 parallel parts, 42K rate-limited LLM calls; Blue Yonder in production. And your scale is a correctness problem more than a throughput one." },
      { q: "\"Would you use Kafka here?\"", a: "Not today: Cloud Tasks or Pub/Sub with idempotent steps; Kafka when replay or per-key ordering at volume earns it." },
      { q: "\"Firestore or Postgres for reports?\"", a: "Firestore for jobs and live status; relational for reports, users, billing if you need joins and audits; versions append-only either way." },
      { q: "\"How would you make 30 minutes reliable?\"", a: "Fan out per page and per portal, timeouts, backoff, a pending state for a down portal, and a trace per file." },
      { q: "\"Why you over someone with OCR experience?\"", a: "OCR is a component you can call; making the pipeline around it correct, idempotent, measurable and cheap is the job, and I've built that twice." },
    ],
    beats: B(
      { say: "Rapid fire. Your projects are small. Have you run anything at scale?", hold: 4 },
      "DeepLogLens was built and measured at gigabyte scale: two gigabytes in a two hundred and fifty six megabyte heap, two hundred and five parts in parallel, forty two thousand rate limited LLM calls. Blue Yonder was production. And your scale today is a correctness problem more than a throughput problem.",
      { say: "Would you use Kafka here?", hold: 4 },
      "Not today. Cloud Tasks or Pub Sub, with idempotent steps. Kafka when replay or per key ordering at volume earns it.",
      { say: "Firestore or Postgres for reports?", hold: 4 },
      "Firestore for the job and live status. A relational store for reports, users and billing, if you need joins and audits. And the versions append only, either way.",
      { say: "How would you make a thirty minute turnaround reliable?", hold: 4 },
      "Fan out per page and per portal, with timeouts and backoff. A pending state for a portal that's down. And a trace per file, so the slowest step is visible.",
      { say: "Why should we hire you over someone with OCR experience?", hold: 4 },
      { say: "OCR is a component you can call. Making the pipeline around it correct, idempotent, measurable and cheap is the job, and I've built that twice.", tone: "key" },
    ),
  },
  check({
    topic: "the hard questions",
    q: "What's the one decision you'd copy from your projects into Brikby on day one?",
    a: "Idempotent steps keyed by content (a page hash per step), so a retried or redelivered task can never double-charge, double-flag or double-notify: DeepLogLens's fingerprint keys, applied to pages.",
    aSay: "Idempotent steps keyed by content: a page hash per step, so a retried or redelivered task can never double charge, double flag, or double notify. It's DeepLogLens's fingerprint keys, applied to pages. Good luck. You've built more of this than you think.",
  }),
];
