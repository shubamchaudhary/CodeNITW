import type { Scene } from "../../lib/types.ts";
import { B, sec } from "../ll01/h.ts";
import { check } from "./k.ts";

// Part 4: two questions to ask them (section 7) and what to say (section 8).
export const p4: Scene[] = [
  // ------------------------------------------------------------ 7
  sec("7", "Two questions to ask them", "Section seven. Two questions to ask them. Both are about the business as much as the system."),
  {
    kind: "sayit",
    q: "Question 1: how reports reach lenders",
    lines: [
      "\"How do reports reach your lenders today:",
      "download, or an integration into their loan system?",
      "And when a lawyer edits a field, which version is the source of truth?\"",
    ],
    beats: B(
      "Question one. Here's how you'd say it.",
      "How do reports reach your lenders today?",
      "Download, or an integration into their loan system?",
      { say: "And when a lawyer edits a field, which version is the source of truth? Where it leads: one canonical report, delivered by a signed webhook.", tone: "ask" },
    ),
  },
  {
    kind: "sayit",
    q: "Question 2: where processing runs",
    lines: [
      "\"Where does processing run?",
      "For lender documents I'd keep storage, OCR, models and the database in one Indian region,",
      "which also helps with lenders' security reviews and data-residency questions.\"",
    ],
    beats: B(
      "Question two.",
      "Where does processing run?",
      "For lender documents, I'd keep storage, OCR, the models and the database in one Indian region.",
      { say: "Which also helps with lenders' security reviews and data residency questions. It's a cost, latency and sales question at once.", tone: "ask" },
    ),
  },
  {
    kind: "bullets",
    title: "Others, if there's time",
    firstItemStep: 1,
    items: [
      { icon: "🛠", text: "Which step produces most of the lawyers' corrections?" },
      { icon: "🗺", text: "Which states are hardest?" },
      { icon: "📏", text: "How do you measure accuracy?" },
    ],
    beats: B(
      "And others, if there's time.",
      "Which step produces most of the lawyers' corrections?",
      "Which states are the hardest?",
      "And how do you measure accuracy?",
    ),
  },
  check({
    topic: "the questions",
    q: "Where does question 1 lead, as a design?",
    a: "One canonical report on the server, with lawyer edits versioned on it, delivered into the lender's system by a signed webhook.",
    aSay: "To one canonical report on the server, with the lawyer's edits versioned on it, delivered into the lender's system by a signed webhook.",
  }),

  // ------------------------------------------------------------ 8
  sec("8", "What to say", "Section eight. What to say. The sixty second answer, your work against their job description, and why this role."),
  {
    kind: "sayit",
    q: "What do you know about us? In 60 seconds",
    lines: [
      "\"Lenders can't disburse a home loan or LAP until a legal vendor confirms the title: 13 or 30 years of deeds, the EC, land records, in the lender's own format.",
      "That's days of an advocate's time per file, much of it reading regional and handwritten records.",
      "Brikby reads the whole file, rebuilds the chain of title, flags what's missing with severity, checks government records,",
      "and produces the report in the customer's format in under 30 minutes, with 15,000+ files done this year.",
      "At your size the hard part isn't throughput, it's correctness, slow portals and cost per file, and that's the part I'd want to own.\"",
    ],
    beats: B(
      "When they ask, what do you know about us, here's the sixty second version.",
      "Lenders can't disburse a home loan or a LAP until a legal vendor confirms the title. Thirteen or thirty years of deeds, the encumbrance certificate, land records, written up in the lender's own format.",
      "That's days of an advocate's time per file, much of it reading regional and handwritten records.",
      "Brikby reads the whole file, rebuilds the chain of title, flags what's missing with severity, checks government records,",
      "and produces the report in the customer's format in under thirty minutes, with fifteen thousand plus files done this year.",
      { say: "At your size, the hard part isn't throughput. It's correctness, slow portals and cost per file. And that's the part I'd want to own.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "Their job description, your work",
    cols: [
      { title: "Queues, retries, idempotency", icon: "🔁", tone: "blue", items: ["DeepLogLens: Kafka", "commits after durable writes"] },
      { title: "Agents with approval", icon: "🧠", tone: "green", items: ["Inventory Ops Agent", "LangGraph approval interrupts"] },
      { title: "Traces and evals", icon: "📏", tone: "amber", items: ["DeepLogLens: LLM judge", "labelled set, recall"] },
      { title: "Firebase, React", icon: "⚛️", tone: "purple", items: ["InterviewPlanPrep", "250+ students"] },
    ],
    footer: "messy input → exact, auditable output, async, with an LLM in the loop",
    beats: B(
      "Now your work, against their job description. Queues, retries and idempotency: DeepLogLens. Kafka, commits after durable writes, and idempotent upserts.",
      "Agents with human approval: the Inventory Ops Agent, LangGraph with approval interrupts.",
      "Traces and evals: DeepLogLens again. An LLM judge, a labelled set, and recall numbers.",
      "Firebase, React, and shipping end to end: InterviewPlanPrep. Firebase Auth and Firestore, React, and two hundred and fifty plus students.",
      { say: "And the thread through all of it: messy input turned into exact, auditable output, asynchronously, with an LLM in the loop. That's their problem too.", tone: "key" },
    ),
  },
  {
    kind: "big",
    tone: "interview",
    lead: "\"Why this role?\"",
    text: "It's the problem I've been solving, but with real lenders depending on it, and I'd own it end to end.",
    after: "messy input → exact, auditable output · async pipeline · LLM in the loop",
    beats: B(
      { say: "And why this role? It's the problem I've been solving. Messy input turned into exact, auditable output, through an async pipeline with an LLM in the loop. But with real lenders depending on it, and I'd own it end to end.", tone: "key" },
    ),
  },
  check({
    topic: "what to say",
    q: "Name three things you never say from their page scripts.",
    a: "Endpoint names, regions, bucket names and customer formats. At most: \"it looks like Firebase / GCP from outside\".",
    aSay: "Endpoint names, regions, bucket names, and customer formats. At most, it looks like Firebase and GCP from the outside. Good luck. You're ready for this one.",
  }),
];
