import type { Scene } from "../../lib/types.ts";
import { B, sec } from "../ll01/h.ts";
import { check } from "./k.ts";

// Part 2: what Brikby sells, the business around it, and its likely scale.
export const p2: Scene[] = [
  // ------------------------------------------------------------ 4
  sec("4", "What Brikby sells", "Topic four. What Brikby actually sells, from their own public pages."),
  {
    kind: "bullets",
    title: "Upload a file, get a report in under 30 minutes",
    firstItemStep: 1,
    items: [
      { icon: "📄", text: "Document scrutiny", sub: "every document, its parties, dates, survey and khata numbers, SRO" },
      { icon: "🔗", text: "Title flow", sub: "the chain of title rebuilt across the deeds" },
      { icon: "🚩", text: "Missing documents and red flags, with severity", sub: "a deed the EC mentions but nobody supplied · high · medium · low" },
      { icon: "🏦", text: "In the customer's format", sub: "\"bank format-trained, bank policy-trained\" · loan-type insights" },
      { icon: "🏛", text: "Checked against government records", sub: "\"in real time\"" },
    ],
    beats: B(
      "Brikby's pitch is: upload a file's documents, any state, any language, any format, handwritten included, and get a structured due diligence report in under thirty minutes. The report has six parts.",
      "Document scrutiny. Every document listed with its key fields: parties, dates, survey, khasra and khata numbers, the sub registrar's office.",
      "Title flow. The chain of title, rebuilt across the deeds. Their sample traces a nineteen eighty five sale deed through to today's owner.",
      { say: "Missing documents, for example a deed the encumbrance certificate mentions, that nobody supplied. And red flags, with severity. In their public sample: high, a missing title document. Medium, a fresh EC required because of a four year search gap. Low, the owner's name written differently in the deed and the revenue record.", tone: "key" },
      "And it comes out in the customer's own format. Their words: bank format trained, bank policy trained. With insights specific to the loan type.",
      "And, they say, the documents are verified against government records in real time. That's where their agents come in.",
    ),
  },
  {
    kind: "numbers",
    title: "Their public numbers",
    items: [
      { value: "15,000+", label: "loan logins", sub: "processed since January", tone: "blue" },
      { value: "< 30 min", label: "turnaround", sub: "down from 4 days", tone: "green" },
      { value: "95 %+", label: "accuracy claimed", sub: "AI risk flagging", tone: "amber" },
      { value: "50+", label: "regional languages", sub: "handwritten included", tone: "purple" },
    ],
    footer: "Gurugram · founded 2025 · BFSI first, then any ownership-verification use case",
    beats: B(
      "Their public numbers. Fifteen thousand plus loan logins processed since January.",
      "Turnaround under thirty minutes, down from four days.",
      "Ninety five percent plus accuracy, claimed, on risk flagging. Hold on to that one. In topic eleven we'll ask: ninety five percent of what?",
      "And fifty plus regional languages.",
      { say: "They're a twenty twenty five company in Gurugram. The plan they state publicly: become the gold standard in banking and financial services first, then sell ownership verification for any use case. Consumers, infrastructure, telecom.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "Who you'll probably meet",
    cols: [
      { title: "Rishabh Agarwal · CEO", icon: "🏘", tone: "blue", items: ["co-founder", "ex-Savills, real estate valuations", "the property and lender side"] },
      { title: "Sahith Desham · CTO", icon: "🛠", tone: "green", items: ["co-founder", "ex-UBS, investment bank data engineer", "pipelines and data quality"] },
    ],
    footer: "their loop: intro call · walk through something you built, then solve a real problem · founders · offer",
    beats: B(
      "Who you'll probably meet. Two founders, both on their public team page. Rishabh Agarwal, co founder and CEO. Ex Savills, in real estate valuations. He knows the property and lender side cold.",
      "And Sahith Desham, co founder and CTO. Ex UBS, an investment bank data engineer. Expect him to care about pipelines, data quality, and how you know your output is right.",
      { say: "And their careers page spells out the loop. A twenty minute intro. A technical interview: walk us through something you built, then solve a real problem with us. A founder conversation. Then an offer. So, bring one project you can walk through end to end, and expect the real problem to look a lot like their pipeline.", tone: "key" },
    ),
  },
  check({
    topic: "what they sell",
    q: "In one sentence: what does Brikby replace?",
    a: "Days of an empanelled advocate's manual scrutiny per file, with an AI draft in under 30 minutes, in the customer's format, that a lawyer or credit officer reviews.",
    aSay: "Days of an empanelled advocate's manual legal scrutiny on every file, with an AI draft in under thirty minutes, in the customer's own format, that a lawyer or a credit officer then reviews.",
  }),

  // ------------------------------------------------------------ 5
  sec("5", "The business", "Topic five. The business. Who pays, why they pay, and what the moat is."),
  {
    kind: "compare",
    title: "Who uses it, who pays, why",
    cols: [
      { title: "Users", icon: "👥", tone: "blue", items: ["lenders' legal and credit teams", "the legal vendor firms they empanel"] },
      { title: "Pricing", icon: "💳", tone: "green", items: ["shared report credits per organisation", "self-serve list price Rs 200 / report"] },
      { title: "Why they pay", icon: "⏱", tone: "amber", items: ["faster disbursal", "fewer people per file · smoother month-end"] },
      { title: "Moat", icon: "🏰", tone: "purple", items: ["every state's documents and rules", "every lender's format · the eval set"] },
    ],
    footer: "speed, without giving up the defensibility of the legal opinion",
    beats: B(
      "Who uses it. Lenders' legal and credit teams, and the legal vendor firms those lenders empanel. Both sides of the same transaction.",
      "How they price, publicly. An organisation shares a pool of report credits across its members. The self serve list price is two hundred rupees a report, pay per use. Enterprise deals are presumably negotiated, but that's an estimate.",
      "Why they pay. Faster disbursal. Fewer people per file: their site says four times productivity, and less manpower. And a smoother month end, when every lender rushes to close its numbers.",
      "And the moat. Not the model. The long tail. Every state's documents and rules, every lender's format and policy, and the evaluation set that proves the accuracy on them.",
      { say: "If you remember one value line, make it this. Brikby sells speed, without giving up the defensibility of the legal opinion.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "The neighbourhood",
    cols: [
      { title: "TEAL", icon: "🔷", tone: "blue", items: ["API-based property due diligence", "for banks, HFCs, law firms"] },
      { title: "Landeed", icon: "🟢", tone: "green", items: ["record retrieval", "AI title reports"] },
      { title: "Square Yards", icon: "🟧", tone: "amber", items: ["data and risk suite", "ownership verification"] },
    ],
    footer: "the differentiator to probe: the lender's own format and policy, and the handwritten long tail",
    beats: B(
      "Know the neighbourhood, briefly. TEAL sells API based property due diligence to banks, housing finance companies and law firms.",
      "Landeed does record retrieval and AI title reports.",
      "Square Yards has a property data and risk suite, including ownership verification.",
      { say: "You don't need to compare them in the room. But if they ask how they're different, the honest answer from their own pages is: the lender's own format and policy, and the handwritten, regional long tail.", tone: "key" },
    ),
  },
  check({
    topic: "the business",
    q: "Why does \"bank format-trained\" matter commercially?",
    options: ["It reduces the OCR cost", "Lenders won't change their report formats for a vendor, so matching them removes the adoption cost", "It is a legal requirement from RBI", "It makes the LLM more accurate"],
    answer: 1,
    a: "Lenders don't change their formats for a vendor. Producing each lender's own format and policy means a lender or vendor adopts it without changing its process.",
    aSay: "B. Lenders don't change their report formats for a vendor. Producing each lender's own format, and applying its own policy, means a lender or a vendor can adopt it without changing anything about how they work.",
  }),

  // ------------------------------------------------------------ 6
  sec("6", "Their likely scale", "Topic six. How big are they, probably? Evidence first, then arithmetic, clearly labelled as estimates."),
  {
    kind: "numbers",
    title: "Estimates, from 15,000 logins in ~10.5 months",
    items: [
      { value: "~1,400", label: "files / month", sub: "estimate", tone: "blue" },
      { value: "~65", label: "files / working day", sub: "peaks 150-200 at month-end", tone: "amber" },
      { value: "~4,500", label: "pages / day", sub: "~13 docs × ~5 pages each", tone: "green" },
      { value: "5-8", label: "files in flight", sub: "at a busy peak hour", tone: "purple" },
    ],
    footer: "estimates: say them as estimates",
    beats: B(
      "Start from the one hard public number: fifteen thousand loan logins since January. That's about ten and a half months. So, about fourteen hundred files a month. An estimate.",
      "Divide by twenty two working days. About sixty five files a day. And month end in lending is real: assume two to three times that, a hundred and fifty to two hundred files on a peak day.",
      "Their own sample report has thirteen documents. Sale deeds run ten to forty pages, encumbrance certificates and land records one to five. Call it sixty to eighty pages a file. So about four and a half thousand pages a day, maybe twelve thousand at peak.",
      "And concurrency. Two hundred files over a ten hour peak day is twenty an hour. At fifteen to twenty five minutes each, that's five to eight files in flight at once.",
      { say: "All of these are estimates. Say them as estimates. And if they correct you with the real numbers, that's a win: you've started a conversation about their system.", tone: "key" },
    ),
  },
  {
    kind: "big",
    tone: "interview",
    lead: "The insight to say out loud",
    text: "At this scale throughput is easy. Correctness, tail latency and cost per file are the hard problems.",
    after: "and auditability: every flag traceable to a page",
    beats: B(
      "So here's the insight to say out loud, if they ask what you think is hard.",
      { say: "At this scale, throughput is easy. A few thousand pages a day is nothing. The hard problems are correctness on messy documents, tail latency from slow government portals and model calls, and cost per file. Plus auditability: every flag has to trace back to a page, because a lawyer signs the opinion.", tone: "key" },
      "And growth changes the picture. A couple of large lenders onboarding could mean ten times the volume within a year. So the design should scale out per page, but it doesn't need to start complicated.",
    ),
  },
  check({
    topic: "scale",
    q: "Roughly how many pages a day, and is that a hard throughput problem?",
    a: "A few thousand a day, low tens of thousands at peak (estimate). Not a throughput problem: a correctness, tail-latency and cost problem.",
    aSay: "A few thousand pages a day, low tens of thousands at a month end peak, as an estimate. That is not a throughput problem. It's a correctness, tail latency, and cost per file problem.",
  }),
];
