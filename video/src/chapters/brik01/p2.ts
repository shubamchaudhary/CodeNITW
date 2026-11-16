import type { Scene } from "../../lib/types.ts";
import { B, sec } from "../ll01/h.ts";
import { check } from "./k.ts";

// Part 2: what Brikby sells (section 3) and the business around it (section 4).
export const p2: Scene[] = [
  // ------------------------------------------------------------ 3
  sec("3", "What Brikby sells", "Section three. What Brikby sells, from their own public pages."),
  {
    kind: "bullets",
    title: "Upload a file, get a report in under 30 minutes",
    firstItemStep: 1,
    items: [
      { icon: "📄", text: "Document scrutiny", sub: "each document's parties, dates, survey numbers, registration" },
      { icon: "🔗", text: "Title flow", sub: "the chain of title rebuilt across the deeds" },
      { icon: "🚩", text: "Missing documents and red flags, by severity", sub: "high: missing title deed · medium: fresh EC · low: name spelt differently" },
      { icon: "🏦", text: "In the customer's own format", sub: "\"bank format-trained, bank policy-trained\" · loan-type insights" },
      { icon: "🏛", text: "Checked against government records", sub: "not just the documents supplied" },
    ],
    beats: B(
      "Brikby does instant property ownership verification for banks and NBFCs. You upload a file's documents, any state, any language, handwritten included, and in under thirty minutes you get a report.",
      "Document scrutiny. Each document with its key fields: the parties, dates, survey numbers, registration details.",
      "Title flow. The chain of title, rebuilt across the deeds.",
      { say: "Missing documents, like a deed the EC mentions that nobody supplied. And red flags by severity. High: a missing title document. Medium: a fresh EC needed. Low: a name spelt differently.", tone: "key" },
      "Loan type insights, because a home loan, a LAP, a balance transfer and self construction ask different questions. A balance transfer cares about the existing lender's charge being released; self construction cares about the plot and the approved plan. And the report comes out in the customer's own format. Their words: bank format trained, bank policy trained.",
      "And checks against government records, not just the documents the borrower happened to supply. That's what catches the charge nobody mentioned.",
    ),
  },
  {
    kind: "numbers",
    title: "Their public numbers",
    items: [
      { value: "80 %", label: "faster", sub: "4 days → under 30 min", tone: "green" },
      { value: "95 %+", label: "accuracy", sub: "claimed", tone: "amber" },
      { value: "50+", label: "regional languages", sub: "handwritten included", tone: "purple" },
      { value: "15,000+", label: "loan files", sub: "since January", tone: "blue" },
    ],
    footer: "Gurugram · founded 2025 · BFSI first, then ownership verification for any use case",
    beats: B(
      "Their public numbers. Eighty percent faster. Turnaround from four days to under thirty minutes.",
      "Ninety five percent plus accuracy, claimed.",
      "Fifty plus regional languages.",
      "And fifteen thousand plus loan files since January.",
      "They're a twenty twenty five company in Gurugram, and the plan is: become the standard in banking and financial services, then ownership verification for any use case.",
    ),
  },
  {
    kind: "compare",
    title: "The founders",
    cols: [
      { title: "Rishabh Agarwal · CEO", icon: "🏘", tone: "blue", items: ["ex-Savills", "real estate valuations"] },
      { title: "Sahith Desham · CTO", icon: "🛠", tone: "green", items: ["ex-UBS", "data engineer"] },
    ],
    footer: "the property side, and the data side",
    beats: B(
      "The founders, both public. Rishabh Agarwal, the CEO, ex Savills, in real estate valuations. He knows the property and lender side.",
      "Sahith Desham, the CTO, ex UBS, a data engineer. Expect him to care about pipelines, and how you know the output is right.",
      "So, the property side and the data side.",
    ),
  },
  {
    kind: "big",
    tone: "interview",
    lead: "In one sentence",
    text: "Days of an advocate's manual title check, replaced by an AI-drafted report in under 30 minutes that a lawyer reviews.",
    after: "the lawyer or credit team still signs off",
    beats: B(
      { say: "If you remember one sentence, make it this. Brikby replaces days of an advocate's manual title check with an AI drafted report in under thirty minutes, that the lawyer or the credit team reviews.", tone: "key" },
    ),
  },
  check({
    topic: "what they sell",
    q: "Name three things in a Brikby report.",
    a: "Any three of: document scrutiny, the title flow, missing documents, red flags by severity, loan-type insights, the customer's own format, government-record checks.",
    aSay: "Any three of these. Document scrutiny. The title flow. Missing documents. Red flags by severity. Loan type insights. The customer's own format. And checks against government records.",
  }),

  // ------------------------------------------------------------ 4
  sec("4", "The business", "Section four. The business. Who pays, why they pay, and what the moat is."),
  {
    kind: "compare",
    title: "Who pays, and why",
    cols: [
      { title: "Customers", icon: "👥", tone: "blue", items: ["lenders' legal and credit teams", "the vendor firms they empanel"] },
      { title: "Pricing", icon: "💳", tone: "green", items: ["shared report credits", "Rs 200 / report, self-serve"] },
      { title: "Why they pay", icon: "⏱", tone: "amber", items: ["faster disbursal", "fewer people · same quality"] },
      { title: "Moat", icon: "🏰", tone: "purple", items: ["every state, every lender format", "the eval data that proves it"] },
    ],
    footer: "it replaces advocate time: a few thousand rupees a file (estimate)",
    beats: B(
      "The customers. Lenders' legal and credit teams, at banks, NBFCs and housing finance companies. And the legal vendor firms they empanel.",
      "Pricing, publicly. Report credits, shared by an organisation. The self serve list price is two hundred rupees a report. Enterprise deals are presumably negotiated, but that's an estimate.",
      "Why they pay. Faster disbursal wins borrowers: in lending, the lender that sanctions first often gets the loan. Fewer people per file. The same quality across every vendor and branch, instead of opinions that differ. And month end peaks handled, when every lender rushes to close its numbers and the advocates are buried.",
      { say: "And the moat. Not the model. The long tail. Every state's documents and portals, every lender's format and policy, and the eval data that proves accuracy on them.", tone: "key" },
      "What it replaces is advocate time, a few thousand rupees per file, as an estimate. So at two hundred rupees a report, the saving is obvious, and the real sale is speed and consistency.",
    ),
  },
  {
    kind: "compare",
    title: "The neighbourhood",
    cols: [
      { title: "TEAL", icon: "🔷", tone: "blue", items: ["API due diligence", "for lenders"] },
      { title: "Landeed", icon: "🟢", tone: "green", items: ["AI title reports"] },
      { title: "Square Yards", icon: "🟧", tone: "amber", items: ["property data", "and risk"] },
    ],
    footer: "Brikby's angle: the lender's own format and policy, and the handwritten long tail",
    beats: B(
      "Know the competitors, briefly. TEAL, API due diligence for lenders.",
      "Landeed, AI title reports.",
      "Square Yards, property data and risk.",
      "If they ask how Brikby is different, the honest answer from their own pages is the lender's own format and policy, and the handwritten, regional long tail.",
    ),
  },
  {
    kind: "big",
    tone: "interview",
    lead: "The value line",
    text: "Speed, without giving up a defensible legal opinion.",
    after: "the vendor's turnaround is the lender's disbursal time · a missed defect is the lender's loss",
    beats: B(
      { say: "The value line. The vendor's turnaround is the lender's disbursal time, and a missed defect is the lender's loss. So Brikby sells speed, without giving up a defensible legal opinion.", tone: "key" },
      "And why the customer's own format matters: lenders won't change their report format for a vendor. Matching it is what makes adoption easy.",
    ),
  },
  check({
    topic: "the business",
    q: "Why does \"bank format-trained\" matter commercially?",
    options: ["It reduces the OCR cost", "Lenders won't change their format for a vendor, so matching it makes adoption easy", "It's an RBI requirement", "It makes the model more accurate"],
    answer: 1,
    a: "Lenders won't change their report format for a vendor. Producing their own format means they adopt it without changing how they work.",
    aSay: "B. Lenders won't change their report format for a vendor. Producing each lender's own format means they can adopt it without changing how they work.",
  }),
];
