import type { Scene } from "../../lib/types.ts";
import { B, sec } from "../ll01/h.ts";
import { check } from "./k.ts";

// Part 4: evals and traces, cost and latency on GCP, the two questions to
// raise, and how to present all of it.
export const p4: Scene[] = [
  // ------------------------------------------------------------ 11
  sec("11", "Getting the LLM right", "Topic eleven. Structured outputs, traces and evals. How you'd know the reports are right, and keep them right."),
  {
    kind: "compare",
    title: "Four habits that make LLM output trustworthy",
    cols: [
      { title: "Structured", icon: "🧱", tone: "blue", items: ["a JSON schema per document type", "validate · re-ask once on failure"] },
      { title: "Grounded", icon: "📍", tone: "green", items: ["every field and flag cites a page", "no citation, no flag"] },
      { title: "Traced", icon: "🧵", tone: "amber", items: ["per job: inputs, model, prompt version", "tokens, latency, output, per step"] },
      { title: "Evaluated", icon: "📏", tone: "purple", items: ["golden set per state and doc type", "every lawyer's correction → a test"] },
    ],
    footer: "find why the output went wrong, fix it at the root, and build the eval that keeps it fixed",
    beats: B(
      "Four habits. One, structured. Every document type has a JSON schema, the model must fill it, the output is validated, and a failure is re asked once with the validation error.",
      "Two, grounded. Every extracted field and every flag carries its document and page, and ideally the quote or the bounding box. No citation, no flag.",
      "Three, traced. Every job leaves a trace: for each step, the inputs, the model, the prompt version, the tokens, the latency and the output. When a lawyer says this flag is wrong, you can open the exact step that produced it.",
      "Four, evaluated. A golden set per state and document type. And every correction a lawyer makes becomes a regression test that runs on every prompt or model change.",
      { say: "That's almost word for word one line of their job description. Find out why LLM output goes wrong, fix it at the root, and build evals that keep it fixed.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "\"95% accuracy\": 95% of what?",
    cols: [
      { title: "Field accuracy", icon: "🔤", tone: "blue", items: ["survey no., dates, parties", "per field, per document type"] },
      { title: "Flag precision", icon: "🎯", tone: "amber", items: ["of the flags raised, how many were real", "false flags cost reviewer minutes"] },
      { title: "Flag recall", icon: "🛟", tone: "red", items: ["of the real defects, how many were caught", "a miss can cost the security"] },
    ],
    footer: "for a lender, recall on high-severity flags is the number that matters most",
    beats: B(
      "And here's a thoughtful question to carry in. Their site says ninety five percent accuracy. Ninety five percent of what? There are at least three different numbers. Field accuracy: did we read the survey number, the dates and the parties correctly?",
      "Flag precision. Of the flags we raised, how many were real problems? A false flag costs a reviewer a few minutes.",
      "Flag recall. Of the real defects, how many did we catch? A miss can cost the lender its security.",
      { say: "So, for a lender, recall on high severity flags is the number that matters most, and it should be measured on its own. Asking how they measure accuracy, and which number lenders ask for, is a great question for the CTO.", tone: "key" },
    ),
  },
  check({
    topic: "evals",
    q: "Which error is worse here: a false flag or a missed one?",
    options: ["A false flag: it annoys the customer", "A missed high-severity flag: it can cost the lender its security", "They're equally bad", "Neither matters if a lawyer reviews"],
    answer: 1,
    a: "A missed high-severity flag. A false flag costs minutes; a miss can cost the security. Tune for recall on critical flags and measure it separately.",
    aSay: "B. A missed high severity flag. A false flag costs a reviewer a few minutes. A miss can cost the lender its security. So you tune for recall on the critical flags, and you measure it separately from everything else.",
  }),

  // ------------------------------------------------------------ 12
  sec("12", "Cost and latency on GCP", "Topic twelve. Cost and latency on GCP. Their job description says: run it on GCP with an eye on cost and latency. So let's put a rough number on a file."),
  {
    kind: "numbers",
    title: "Cost per file, order of magnitude (estimate)",
    items: [
      { value: "~$0.10", label: "OCR", sub: "~70 pages at ~$1.5 / 1,000", tone: "blue" },
      { value: "~$0.10", label: "fast model", sub: "classify + extract, ~1.5K tokens / page", tone: "green" },
      { value: "~$0.15", label: "strong model", sub: "the chain and ambiguity only", tone: "amber" },
      { value: "Rs 25-45", label: "per file, all in", sub: "vs a Rs 200 list price", tone: "purple" },
    ],
    footer: "estimates from public list prices: check current pricing before quoting",
    beats: B(
      "A rough cost model, per file. Order of magnitude only, and labelled as an estimate. OCR: about seventy pages, at around a dollar and a half per thousand pages. About ten cents.",
      "A fast model to classify and extract: about fifteen hundred tokens of input per page, plus the structured output. Another ten cents or so.",
      "A stronger model, used only for the chain and the ambiguous cases. Maybe fifteen cents.",
      { say: "All in, roughly thirty to fifty cents. Twenty five to forty five rupees a file, against a two hundred rupee list price.", tone: "key" },
      "These come from public list prices, so check current pricing before you quote them. And with margins like that, the real cost question is the tail: the files with two hundred pages, and the retries.",
    ),
  },
  {
    kind: "bullets",
    title: "Five levers, in the order I'd pull them",
    firstItemStep: 1,
    items: [
      { icon: "♻️", text: "Page-hash caching", sub: "the same deed arrives again: resales, resubmissions, balance transfers" },
      { icon: "🔀", text: "Model routing", sub: "a fast model by default; the strong one only for ambiguity" },
      { icon: "📦", text: "Batch where latency allows", sub: "re-runs and back-fills at batch prices, never the 30-minute path" },
      { icon: "⚡", text: "Fan out for latency", sub: "TAT = the slowest page + the slowest portal: parallelise both, with timeouts" },
      { icon: "📍", text: "Keep compute next to data", sub: "bucket, workers, models, database in one region" },
    ],
    beats: B(
      "And five levers, in the order I'd pull them.",
      "One, page hash caching. The same deed arrives again and again: in resales, resubmissions, balance transfers. Read it once.",
      "Two, model routing. A fast model by default. The strong model only when the fast one is unsure, or for the chain.",
      "Three, batch where latency allows. Re runs and back fills can go through batch prediction at roughly half price. Never the thirty minute path.",
      { say: "Four, fan out for latency. The turnaround is the slowest page plus the slowest portal. So parallelise both, and put timeouts on both.", tone: "key" },
      "Five, keep compute next to data. The bucket, the workers, the model endpoints and the database, in one region. Hold on to that one. It's our second question.",
    ),
  },
  check({
    topic: "cost and latency",
    q: "Where do the 30 minutes go, and what do you parallelise?",
    say: "Where do the thirty minutes go, and what do you parallelise?",
    a: "Mostly OCR / model calls and portal fetches. Fan out per page and per portal; the critical path becomes the slowest page plus the chain and the report.",
    aSay: "Mostly OCR and model calls, and portal fetches. Fan out per page and per portal, with timeouts, and the critical path becomes the slowest single page, plus the chain and the report.",
  }),

  // ------------------------------------------------------------ 13
  sec("13", "Two questions worth raising", "Topic thirteen. Only two gaps, phrased as design questions. Each one starts with, for a pipeline like this I'd expect, and neither depends on anything you could only know from their code."),
  {
    kind: "sayit",
    q: "Question 1: the report as data, delivered by integration",
    lines: [
      "\"For a pipeline like this I'd expect the report to exist once, as a canonical versioned JSON on the server,",
      "with every lender format rendered from it,",
      "and the result pushed into the lender's LOS by a signed webhook through an outbox.",
      "How do reports reach your lenders today: download and upload, or an integration?",
      "And when a lawyer edits a field, which version is the source of truth?\"",
    ],
    beats: B(
      "Question one. The report as data, delivered by integration. Here's how you'd say it.",
      "For a pipeline like this, I'd expect the report to exist once, as a canonical, versioned JSON on the server.",
      "With every lender's format rendered from it.",
      "And the result pushed into the lender's loan origination system by a signed webhook, through an outbox.",
      "How do reports reach your lenders today? Download and upload, or an integration?",
      { say: "And when a lawyer edits a field, which version is the source of truth?", tone: "ask" },
    ),
  },
  {
    kind: "bullets",
    title: "Why question 1 lands",
    firstItemStep: 1,
    items: [
      { icon: "🔌", text: "Lenders at volume want reports inside their LOS", sub: "not in email, not re-typed" },
      { icon: "🧩", text: "One JSON makes formats cheap", sub: "a new lender is a new template, not a new pipeline" },
      { icon: "🧾", text: "Edits become auditable and learnable", sub: "AI draft vs final: who changed what, and eval data for free" },
      { icon: "📮", text: "It uses their JD's own words", sub: "outbox, signed webhooks, idempotency" },
    ],
    beats: B(
      "Why this question lands.",
      "Lenders at volume want reports inside their own systems. Not in email, and not re typed by someone.",
      "One canonical JSON makes formats cheap. A new lender becomes a new template, not a new pipeline.",
      { say: "Edits become auditable and learnable. The AI draft versus the final: who changed what, and why. That diff is free evaluation data.", tone: "key" },
      "And it puts their own job description to work. Outbox, signed webhooks, idempotency.",
    ),
  },
  {
    kind: "sayit",
    q: "Question 2: where processing runs",
    lines: [
      "\"For lender documents I'd keep storage, OCR, the model endpoints and the database in one Indian region, Mumbai or Delhi.",
      "Lenders' vendor-risk reviews under RBI's IT outsourcing directions ask where data is stored and processed,",
      "the DPDP Act adds its own duties,",
      "and same-region also saves egress and a round trip on every call.",
      "How do you answer data-residency questions in lender security reviews?\"",
    ],
    beats: B(
      "Question two. Where processing runs.",
      "For lender documents, I'd keep storage, OCR, the model endpoints and the database in one Indian region. Mumbai or Delhi.",
      "Lenders' vendor risk reviews, under the RBI's directions on outsourcing IT services, ask where data is stored and processed.",
      "The Digital Personal Data Protection Act adds its own duties.",
      "And keeping it in one region also saves egress, and a round trip on every single call.",
      { say: "How do you answer data residency questions in lender security reviews?", tone: "ask" },
    ),
  },
  {
    kind: "big",
    tone: "interview",
    lead: "Why question 2 lands",
    text: "It's a cost question, a latency question and a sales question at once.",
    after: "a founding engineer who raises it unprompted has sat through an enterprise security review",
    beats: B(
      { say: "Why it lands. It's a cost question, a latency question and a sales question, all at once. A founding engineer who raises it unprompted sounds like someone who has sat through an enterprise security review. And it ties straight to their line about running on GCP with an eye on cost and latency.", tone: "key" },
    ),
  },
  check({
    topic: "the two questions",
    q: "Why are these two good questions, beyond being correct?",
    a: "Each ties a JD line (outbox and signed webhooks; GCP cost and latency) to revenue (integrations, enterprise sales), and neither implies you looked at their systems.",
    aSay: "Each one ties a line from their job description, the outbox and signed webhooks, or cost and latency on GCP, to revenue: integrations, and enterprise sales. And neither one implies that you looked at their systems.",
  }),

  // ------------------------------------------------------------ 14
  sec("14", "How to present it", "Topic fourteen. How to put all of this into the interview. The sixty second version, your stories mapped to their job description, and what not to say."),
  {
    kind: "sayit",
    q: "\"What do you know about us?\" The 60-second version",
    lines: [
      "\"Lenders can't disburse a home loan or LAP until a legal vendor confirms the title: 13 or 30 years of deeds, the EC, revenue records, approvals.",
      "Today that's days of an advocate's time per file, much of it reading regional and handwritten records.",
      "Brikby reads the whole file, rebuilds the chain of title, flags what's missing with severity, checks government records, in the lender's format, in under 30 minutes.",
      "At your scale throughput isn't the problem: correctness, tail latency and cost per file are,",
      "and that's the part of the system I'd want to own.\"",
    ],
    beats: B(
      "When they ask, what do you know about us, here's the sixty second version.",
      "Lenders can't disburse a home loan or a LAP until a legal vendor confirms the title. Thirteen or thirty years of deeds, the encumbrance certificate, revenue records, approvals.",
      "Today, that's days of an advocate's time per file, and much of it is spent reading regional and handwritten records.",
      "Brikby reads the whole file, rebuilds the chain of title, flags what's missing with severity, checks it against government records, and produces it in the lender's format, in under thirty minutes.",
      { say: "At your scale, throughput isn't the problem. Correctness, tail latency, and cost per file are.", tone: "key" },
      "And that's the part of the system I'd want to own.",
    ),
  },
  {
    kind: "compare",
    title: "Their JD, your stories",
    cols: [
      { title: "Queues, retries, idempotency", icon: "🔁", tone: "blue", items: ["DeepLogLens: Kafka, offsets after durable writes", "content-fingerprint upserts"] },
      { title: "Agents, HITL, evals", icon: "🧠", tone: "green", items: ["Inventory Ops Agent: LangGraph, approvals", "DeepLogLens: LLM-as-judge, labelled set"] },
      { title: "SQL, cost, scale", icon: "🗄", tone: "amber", items: ["Blue Yonder: Postgres, Snowflake", "per-request connection routing"] },
      { title: "React, Node, Firebase", icon: "⚛️", tone: "purple", items: ["InterviewPlanPrep, end to end", "Firestore listeners, security rules"] },
    ],
    footer: "same problem: messy input → exact, auditable output, async, with an LLM in the loop",
    beats: B(
      "Now map your own work onto their job description. Queues, retries and idempotency: DeepLogLens. Kafka with offsets committed after durable writes, and content fingerprint upserts.",
      "Agents, human in the loop and evals: the Inventory Ops Agent, a LangGraph supervisor with approval interrupts. And DeepLogLens's LLM as judge loop and labelled incident set.",
      "SQL, cost and scale: Blue Yonder. Postgres, Snowflake, and per request connection routing.",
      "React, Node and Firebase: InterviewPlanPrep, which you built end to end on Firebase. You already know Firestore listeners and security rules, which is their stack.",
      { say: "And the thread through all of it: messy input turned into exact, auditable output, asynchronously, with an LLM in the loop. That's their problem too.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "Questions to ask them (pick two)",
    firstItemStep: 1,
    items: [
      { icon: "🛠", text: "Where do lawyers' corrections come from today?", sub: "reading, chain building, or policy" },
      { icon: "📏", text: "How do you measure accuracy?", sub: "and which number do lenders ask for" },
      { icon: "🗺", text: "Which states or document types are hardest?", sub: "and how do you pick the next state" },
      { icon: "🔌", text: "How do lenders receive reports today?", sub: "and what does an integration look like" },
    ],
    beats: B(
      "And four questions to ask them. Pick two.",
      "Which part of the pipeline produces most of the corrections lawyers make today? The reading, the chain building, or the policy?",
      "How do you measure accuracy, and which number do lenders ask for?",
      "Which states or document types are the hardest, and how do you decide which state to add next?",
      "And how do lenders receive reports today, and what does an integration look like? That one opens the door to your first design question.",
    ),
  },
  {
    kind: "trap",
    myth: "Quoting endpoints, regions, bucket names or customer formats",
    truth: "Public facts, your own reasoning, and estimates you call estimates",
    why: "the goal is to sound like you understand their customer, not like you studied their code",
    beats: B(
      "And the last trap. Don't quote endpoints, regions, bucket names or customer formats. Even though a browser can see them.",
      "Use public facts, your own reasoning, and estimates that you call estimates.",
      { say: "Remember the goal from the very start. Sound like you understand their customer, not like you studied their code.", tone: "key" },
    ),
  },
  check({
    topic: "presenting it",
    q: "They ask \"why this role?\" What's your one-line answer?",
    a: "\"It's the problem I've been solving, messy input turned into exact, auditable output through an async pipeline with an LLM in the loop, but with real lenders depending on it and a team where I'd own it end to end.\"",
    aSay: "It's the problem I've been solving already: messy input, turned into exact, auditable output, through an asynchronous pipeline with an LLM in the loop. But here, real lenders depend on it, and I'd own it end to end. Good luck. You're ready for this one.",
  }),
];
