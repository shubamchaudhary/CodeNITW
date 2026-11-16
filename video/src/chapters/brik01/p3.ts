import type { Scene } from "../../lib/types.ts";
import { B, arch, sec } from "../ll01/h.ts";
import { check } from "./k.ts";
import { OUTSIDE, OUTSIDE_STEPS, PIPELINE, PIPELINE_STEPS } from "./boards.ts";

// Part 3: scale (section 5) and the infrastructure, high level (section 6).
export const p3: Scene[] = [
  // ------------------------------------------------------------ 5
  sec("5", "Scale", "Section five. How big are they, roughly? These are all estimates, from their public fifteen thousand files."),
  {
    kind: "numbers",
    title: "Estimates, from 15,000+ public files",
    items: [
      { value: "~1,400", label: "files / month", sub: "estimate", tone: "blue" },
      { value: "~65", label: "files / working day", sub: "2-3x at month-end", tone: "amber" },
      { value: "1000s", label: "pages / day", sub: "~13 docs, ~70 pages a file", tone: "green" },
      { value: "5-8", label: "files in flight", sub: "at a busy hour", tone: "purple" },
    ],
    footer: "estimates: say \"roughly\"",
    beats: B(
      "Fifteen thousand files since January is about fourteen hundred files a month.",
      "About sixty five a working day. And month end in lending is real, so two to three times that on a peak day.",
      "A file has about thirteen documents and seventy pages. So thousands of pages a day.",
      "And only five to eight files in flight at a busy hour. Two hundred files over a ten hour peak day is twenty an hour, and each takes well under thirty minutes.",
      { say: "All estimates. Say roughly. And if they correct you with real numbers, that's a win: you've started a conversation about their system.", tone: "key" },
    ),
  },
  {
    kind: "big",
    tone: "interview",
    lead: "The point to make",
    text: "At this size throughput is easy. Correctness, slow portals, cost per file and auditability are hard.",
    after: "every flag traceable to a page",
    beats: B(
      { say: "So here's the point to make. At this size, throughput is easy. The hard problems are correctness on messy documents, slow and flaky government portals, cost per file, and auditability: every flag traceable to a page, because a lawyer signs the opinion.", tone: "key" },
    ),
  },
  check({
    topic: "scale",
    q: "At their size, is throughput the hard problem? If not, what is?",
    a: "No. A few thousand pages a day is small. The hard parts are correctness, slow portals, cost per file and auditability.",
    aSay: "No. A few thousand pages a day is small. The hard parts are correctness on messy documents, slow portals, cost per file, and auditability.",
  }),

  // ------------------------------------------------------------ 6
  sec("6", "The infrastructure, high level", "Section six. The infrastructure, at a high level. First what it looks like from outside, then how I'd expect the pipeline to work."),
  arch(
    OUTSIDE,
    OUTSIDE_STEPS,
    B(
      { say: "This is observed, so in the room you say only one thing: it looks like Firebase and GCP from the outside. Here's the shape. A web app in the browser, cloud storage, serverless API functions, a job record, and the analysis pipeline nobody outside can see.", tone: "key" },
      "Upload. The documents go from the browser straight into cloud storage.",
      "Start. The browser asks an API function to start the analysis. It records a job and answers at once. An analysis is a job, not a thirty minute request.",
      "Behind it, the pipeline runs. None of that is visible, so the next board is inference.",
      "Live status. The pipeline updates the job's stage, and the browser is pushed each change. No polling.",
      "And afterwards, the user can edit the report, and payment is in report credits.",
    ),
    "From outside: it looks like Firebase / GCP",
  ),
  arch(
    PIPELINE,
    PIPELINE_STEPS,
    B(
      "Now how I'd expect the pipeline to work. This is an estimate. Draw it in the room as, here's how I'd build it.",
      "Each file is a job on a queue. Every page goes through OCR or a vision model, in parallel.",
      "Classify each document. Is it a sale deed, an EC, a land record, a plan? Then extract its fields, each with a page reference.",
      { say: "Then code takes over. It joins the deeds into a title chain, and applies the lender's policy, the state's rules and the loan type.", tone: "key" },
      "Then the government portal checks: the land records, the EC, RERA. These are the slowest and least reliable step, so each one is isolated.",
      "And finally one report JSON with the flags, rendered in each lender's format.",
    ),
    "Inference: how I'd build it",
  ),
  {
    kind: "bullets",
    title: "Five design points",
    firstItemStep: 1,
    items: [
      { icon: "🧠", text: "The LLM reads, code decides", sub: "chain and policy must be exact and explainable" },
      { icon: "📌", text: "Every flag cites its page", sub: "a lawyer verifies it in seconds" },
      { icon: "🔁", text: "Durable jobs", sub: "queue, retries, idempotency keys, an outbox" },
      { icon: "🐢", text: "Portals are unreliable", sub: "one connector each · a down portal marks one check pending" },
      { icon: "📏", text: "Accuracy is measured", sub: "a test set per state; every correction becomes a test" },
    ],
    beats: B(
      "Five design points to go with it, one line each.",
      { say: "The LLM reads, code decides. Models turn messy pages into fields. Code builds the chain and applies policy, because that must be exact and explainable.", tone: "key" },
      "Every flag cites its page, so a lawyer can verify it in seconds.",
      "Durable jobs. A queue, retries, idempotency keys so a double click never charges twice, and an outbox so report ready is never lost.",
      "Portals are unreliable. Each one is a separate connector, and a portal that's down marks one check pending instead of blocking the report.",
      "And accuracy is measured. A test set per state and document type, and every lawyer correction becomes a test case.",
    ),
  },
  {
    kind: "trap",
    myth: "I looked at your page scripts and your API is …",
    truth: "\"From outside it looks like a Firebase / GCP stack.\"",
    why: "never quote endpoint names, regions, bucket names or customer formats",
    beats: B(
      "And the trap. Don't say, I looked at your page scripts.",
      { say: "Say, from outside it looks like a Firebase and GCP stack. Never quote endpoint names, regions, bucket names or customer formats. It sounds like reconnaissance, not curiosity.", tone: "key" },
    ),
  },
  check({
    topic: "the infrastructure",
    q: "Why should code, not the LLM, build the title chain and apply lender policy?",
    a: "It must be exact and explainable: the same input gives the same answer, and every decision traces to a rule and a page.",
    aSay: "Because that part must be exact and explainable. The same file gives the same answer, and every decision traces back to a rule and a page. The model reads; code decides.",
  }),
];
