import type { Scene } from "../../lib/types.ts";
import { B, arch, sec } from "../ll01/h.ts";
import { check } from "./k.ts";
import { WORKFLOW, WORKFLOW_STEPS } from "./boards.ts";

// Part 1: the labels, the lender's problem (section 1), and the workflow and
// its vocabulary (section 2).
export const p1: Scene[] = [
  {
    kind: "title",
    eyebrow: "Company prep · Brikby",
    title: "Brikby: the business, and what they do",
    subtitle: "Property title checks for Indian lenders, from public signals",
    beats: B(
      "Brikby. A Gurugram startup that automates property title checks for Indian lenders. This lecture is about the business first: the problem, what they sell, who pays and why, and how big they are. Then a high level view of the system, two questions to ask, and what to say. Eight short sections, and one check after each.",
    ),
  },
  {
    kind: "bullets",
    title: "Three labels on every claim",
    firstItemStep: 1,
    items: [
      { icon: "🌐", text: "Public", sub: "their site, careers page, LinkedIn: say it freely" },
      { icon: "🔎", text: "Observed", sub: "what any visitor's browser downloads: aim questions with it, never quote it" },
      { icon: "🧮", text: "Estimate", sub: "my arithmetic or an industry assumption: say it as an estimate" },
    ],
    beats: B(
      "First, a rule about evidence. Every claim carries one of three labels.",
      "Public. It's on their site, their careers page, or LinkedIn. Say it freely: I read your site.",
      { say: "Observed. What any visitor's browser downloads when it opens their site. You use it only to aim your questions. You never quote it in the room.", tone: "key" },
      "Estimate. My arithmetic, or an industry assumption. Fine to say, as long as you call it an estimate.",
    ),
  },

  // ------------------------------------------------------------ 1
  sec("1", "The problem they solve", "Section one. The problem they solve. Why does a lender need a title check at all?"),
  {
    kind: "big",
    tone: "idea",
    lead: "The scenario",
    text: "A home loan is only as safe as the title of the property behind it.",
    after: "if the title is bad, the lender's security is worthless",
    beats: B(
      "A home loan, or a loan against property, which everyone calls LAP, is secured by the property. If the borrower stops paying, the lender's protection is the property.",
      { say: "So before the lender pays out, it must be sure of three things. The borrower really owns the property. The title is clean. And nobody else has a charge on it. If the title is bad, the security is worthless.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "Lenders send every file to an advocate, who:",
    firstItemStep: 1,
    items: [
      { icon: "📄", text: "Reads every property document in the file", sub: "sale deeds, gift deeds, tax receipts, approvals" },
      { icon: "🔗", text: "Traces ownership back 13 or 30 years", sub: "the period is set by the lender's policy" },
      { icon: "🏛", text: "Checks government records for charges", sub: "loans or mortgages already on the property" },
      { icon: "🧾", text: "Writes a TSR or LSR in the lender's format", sub: "Title Search Report · Legal Scrutiny Report" },
    ],
    beats: B(
      "Lenders don't check this themselves. Each file goes to an empanelled advocate, or a legal vendor firm. And the advocate does four things.",
      "Reads every property document in the file. Sale deeds, gift deeds, tax receipts, approvals. Often dozens of pages each.",
      "Traces ownership back thirteen or thirty years. The lender's policy sets which.",
      "Checks the government's records for any loan or charge already on the property.",
      { say: "And writes a Title Search Report, or a Legal Scrutiny Report, in that lender's own format. Only then does credit sanction the loan and the money go out.", tone: "key" },
    ),
  },
  {
    kind: "numbers",
    title: "Why it hurts today (their public numbers)",
    items: [
      { value: "7-15 days", label: "per file", sub: "a manual verification cycle", tone: "red" },
      { value: "30-40 %", label: "of review time", sub: "reading regional and handwritten records", tone: "amber" },
      { value: "≠", label: "opinions", sub: "differ across vendors and branches", tone: "purple" },
    ],
    footer: "a missed defect is the lender's loss: accuracy matters more than speed",
    beats: B(
      "Why it hurts, in Brikby's own public numbers. Seven to fifteen days per file.",
      "Thirty to forty percent of the reviewer's time goes to reading regional and handwritten records.",
      "And manual review misses things, and opinions differ across vendors and branches.",
      { say: "So who loses if a defect is missed? The lender. The property can't be enforced as security. That's why accuracy matters even more than speed.", tone: "key" },
    ),
  },
  check({
    topic: "the problem",
    q: "If a title defect is missed, who carries the loss?",
    options: ["The borrower", "The advocate, always", "The lender: its security can't be enforced", "The registrar's office"],
    answer: 2,
    a: "The lender. Its security is only as good as the title, which is why it pays for a legal opinion on every file.",
    aSay: "C. The lender. Its security is only as good as the title behind it, which is why it pays for a legal opinion on every single file.",
  }),

  // ------------------------------------------------------------ 2
  sec("2", "The workflow, and the words to know", "Section two. The workflow Brikby plugs into, and the words you need to speak it."),
  arch(
    WORKFLOW,
    WORKFLOW_STEPS,
    B(
      "Here's one loan file. The borrower on the left, the lender at the top, the legal vendor in the middle, what the vendor checks along the bottom, and the report on the right.",
      "Step one. The borrower hands over the property papers and the lender opens the loan file.",
      { say: "Step two. The file goes out to an empanelled advocate or a legal vendor firm. So the vendor's turnaround becomes the lender's turnaround.", tone: "key" },
      "Step three, scrutiny. The vendor traces the chain of title, reads the encumbrance certificate, and checks the state's land records.",
      "Step four, queries. Every gap goes back to the borrower. A missing link deed. An EC that stops a few years short. A name spelt one way in the deed and another in the land record. Each round trip adds days.",
      "Step five. The vendor writes the Title Search Report, or Legal Scrutiny Report, in that lender's own format. Seven to fifteen days, end to end.",
      { say: "Step six. Credit reads it, sanctions, and then the money goes out. No clean title, no disbursal.", tone: "key" },
    ),
    "One loan file, through the legal check",
  ),
  {
    kind: "compare",
    title: "The words to know",
    cols: [
      { title: "Chain of title", icon: "🔗", tone: "blue", items: ["mother deed → today's owner", "no gap"] },
      { title: "EC", icon: "🧾", tone: "amber", items: ["Encumbrance Certificate", "sales, mortgages, charges"] },
      { title: "RoR + mutation", icon: "🗺", tone: "green", items: ["who the land records show", "updated after a sale"] },
      { title: "Red flags", icon: "🚩", tone: "red", items: ["gap in the EC · missing deed", "POA sale · names don't match"] },
    ],
    footer: "approvals too: sanctioned plan, occupancy certificate, RERA for projects",
    beats: B(
      "Now the vocabulary. The chain of title: every transfer from the oldest deed, the mother deed, to today's owner, with no gap.",
      { say: "The EC, the Encumbrance Certificate. The registrar's list of registered sales, mortgages and charges on the property over the search period.", term: { word: "EC", meaning: "Encumbrance Certificate: registered charges on a property over the search period" } },
      "The RoR, the record of rights: who the state's land records show as owner. And mutation, that record updated after a sale. A deed without mutation is a query.",
      "And the red flags. A gap in the EC. A missing deed. A power of attorney sale in the chain. Names that don't match.",
      "Plus approvals: a sanctioned building plan, an occupancy certificate, and RERA registration for projects.",
    ),
  },
  {
    kind: "big",
    tone: "idea",
    lead: "The core difficulty",
    text: "Every state keeps land records its own way, on its own portal, in its own language.",
    after: "Khatauni in UP · 7/12 in Maharashtra · RTC in Karnataka · often scanned or handwritten",
    beats: B(
      { say: "And the core difficulty. Every state keeps its land records its own way, on its own portal, in its own language. The Khatauni in Uttar Pradesh, the seven twelve in Maharashtra, the RTC in Karnataka. Often scanned, often handwritten.", tone: "key" },
      "One current fact worth knowing: Telangana's Dharani portal was replaced by Bhu Bharati in April twenty twenty five.",
    ),
  },
  check({
    topic: "the workflow",
    q: "The EC covers 34 of the 38 years the policy asks for. Pass or query?",
    say: "The encumbrance certificate covers thirty four of the thirty eight years the policy asks for. Pass, or query?",
    a: "Query: a charge registered in the missing four years would be invisible, so the vendor asks for a fresh EC covering the gap.",
    aSay: "Query. A charge registered in those four missing years would be invisible, so the vendor asks for a fresh encumbrance certificate that covers the gap.",
  }),
];
