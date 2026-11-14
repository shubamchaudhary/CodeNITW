import type { Scene } from "../../lib/types.ts";
import { B, arch, sec } from "../ll01/h.ts";
import { check } from "./k.ts";
import { WORKFLOW, WORKFLOW_STEPS } from "./boards.ts";

// Part 1: how the lecture works, the lender's problem, the workflow, and the
// documents and portals behind it.
export const p1: Scene[] = [
  {
    kind: "title",
    eyebrow: "Company prep · Brikby",
    title: "Brikby: the business, the workflow, the architecture",
    subtitle: "Property due diligence for Indian lenders, from public signals",
    beats: B(
      "Brikby. An AI company that automates property due diligence for Indian banks, NBFCs and legal vendors. You have a system design round with them in two days. By the end of this lecture you should be able to explain their customer's problem better than most of their customers can, sketch how their system probably works, and ask two questions that make you sound like you've already joined. We'll go slowly, and after every topic, I'll stop and ask you a question.",
    ),
  },
  {
    kind: "bullets",
    title: "Three labels on every claim",
    firstItemStep: 1,
    items: [
      { icon: "🌐", text: "Public", sub: "their website, careers page, LinkedIn: say it freely" },
      { icon: "🔎", text: "Observed", sub: "what any visitor's browser downloads: use it to aim questions, never quote it" },
      { icon: "🧮", text: "Estimate", sub: "my arithmetic or an industry assumption: say it, and say it's an estimate" },
    ],
    beats: B(
      "Before anything else, a rule about evidence. Every claim in this lecture carries one of three labels.",
      "Public. It's on their website, their careers page, or LinkedIn. You can say it in the room, freely. I read your site.",
      { say: "Observed. It's what any visitor's browser downloads when it opens their site: the page's scripts, its headers, its DNS. Nothing behind a login, no calls to their API. You use this only to aim your questions. You never quote it.", tone: "key" },
      "Estimate. My arithmetic, or an industry assumption. You can say it, as long as you say it's an estimate.",
    ),
  },
  {
    kind: "big",
    tone: "idea",
    lead: "The goal for the interview",
    text: "Sound like you understand their customer, not like you studied their code.",
    after: "business first · then the system it implies · then two good questions",
    beats: B(
      "And the goal, in one line.",
      { say: "Sound like you understand their customer. Not like you studied their code. Business first, then the system that business implies, then two good questions.", tone: "key" },
    ),
  },

  // ------------------------------------------------------------ 1
  sec("1", "The problem", "Topic one. The problem. Why does a lender need property due diligence at all?"),
  {
    kind: "big",
    tone: "idea",
    lead: "The scenario",
    text: "A home loan is only as safe as the title of the house behind it.",
    after: "if the title is defective, the security is worthless",
    beats: B(
      "Picture the scenario. A borrower applies for a home loan, or a loan against property, which everyone calls LAP.",
      "The loan is secured by the property. If the borrower stops paying, the lender's protection is that it can enforce its mortgage on the house.",
      { say: "So a home loan is only as safe as the title of the house behind it. If the seller never really owned it, or someone else already holds a charge on it, the security is worthless.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "What the lender must know before it disburses",
    cols: [
      { title: "Ownership", icon: "🏠", tone: "blue", items: ["the borrower or mortgagor", "really owns it"] },
      { title: "Clean chain", icon: "🔗", tone: "green", items: ["every transfer, 13 or 30 years back", "no gap, no break"] },
      { title: "No charges", icon: "🔒", tone: "amber", items: ["no other mortgage", "no lien, no attachment"] },
      { title: "Approvals", icon: "📜", tone: "purple", items: ["plan, OC, conversion", "RERA for projects"] },
    ],
    footer: "a legal opinion on every single file, before disbursal",
    beats: B(
      "Before it disburses, the lender needs four answers. Ownership: the borrower, or the mortgagor, really owns the property.",
      "A clean chain of title. Every transfer, going back thirteen or thirty years, with no gap and no break.",
      "No charges. No other mortgage, no lien, no attachment by a court or a tax authority.",
      "And approvals. A sanctioned plan, an occupancy certificate, land converted from agricultural use, and for a project, registration under RERA.",
      { say: "And it needs these answers as a legal opinion, on every single file, before a rupee is disbursed.", tone: "key" },
    ),
  },
  {
    kind: "numbers",
    title: "Why it hurts today (Brikby's own numbers)",
    items: [
      { value: "7-15 days", label: "manual verification cycle", sub: "their customers: 4 days → under 30 min", tone: "red" },
      { value: "30-40 %", label: "of review time", sub: "spent on regional and handwritten records", tone: "amber" },
      { value: "0", label: "standard workflow", sub: "inconsistent opinions across vendors", tone: "purple" },
    ],
    footer: "a vendor's turnaround is the lender's disbursal time",
    beats: B(
      "Here's why it hurts, in Brikby's own public numbers. A manual verification cycle runs seven to fifteen days. For their customers, they say they've cut it from four days to under thirty minutes.",
      "Thirty to forty percent of a reviewer's time goes into interpreting regional language and handwritten records.",
      "And there's no standard workflow, so legal opinions are inconsistent across vendors and branches.",
      { say: "Keep this line. A vendor's turnaround is the lender's disbursal time. And in lending, the faster disbursal often wins the borrower.", tone: "key" },
    ),
  },
  check({
    topic: "the problem",
    q: "If a title defect is missed, who carries the loss?",
    options: ["The borrower", "The legal vendor, always", "The lender: its security can't be enforced", "The registrar's office"],
    answer: 2,
    a: "The lender. Its mortgage is only as good as the title, which is why it pays for a legal opinion on every file and cares about accuracy before speed.",
    aSay: "C. The lender. Its mortgage is only as good as the title behind it. That's why it pays for a legal opinion on every file, and why accuracy matters even more than speed.",
  }),

  // ------------------------------------------------------------ 2
  sec("2", "The lender's workflow", "Topic two. The workflow Brikby plugs into, step by step. One loan file, through every hand it passes."),
  arch(
    WORKFLOW,
    WORKFLOW_STEPS,
    B(
      "Here's the board. The borrower on the left. The lender at the top: its loan login desk and its credit team. In the middle, the legal vendor. Along the bottom, the government sources: the sub registrar, the revenue portal, and RERA and the development authority. And on the right, the report.",
      "Step one. Loan login. The borrower hands over the property papers, and the lender opens the file in its loan origination system, its LOS.",
      { say: "Step two. The lender doesn't check the title itself. It sends the file out to an empanelled advocate, or a legal vendor firm. So the vendor's turnaround becomes the lender's turnaround.", tone: "key" },
      "Step three, the search. The vendor traces the title back thirteen or thirty years. An encumbrance search at the sub registrar, the revenue records, approvals, and RERA. Each state does this on its own portal.",
      "Step four, queries. Every gap goes back to the borrower. A missing link deed. An encumbrance certificate that stops four years short. A name that's spelt differently in the deed and the revenue record. Each round trip adds days.",
      "Step five, the opinion. The vendor writes a Title Search Report, or a Legal Scrutiny Report, in that lender's own format. Four to fifteen days, end to end.",
      { say: "Step six. Credit reads the opinion and sanctions, and the mortgage is created at disbursal. No clean title, no disbursal.", tone: "key" },
    ),
    "One loan file, through the legal check",
  ),
  {
    kind: "compare",
    title: "The vocabulary of the job",
    cols: [
      { title: "Chain of title", icon: "🔗", tone: "blue", items: ["mother deed → today's owner", "sale, gift, partition, will"] },
      { title: "EC", icon: "🧾", tone: "amber", items: ["Encumbrance Certificate", "charges and transfers, by year"] },
      { title: "RoR + mutation", icon: "🗺", tone: "green", items: ["the state's record of owner", "updated after each transfer"] },
      { title: "Red flags", icon: "🚩", tone: "red", items: ["POA sale in the chain", "gap in the search period"] },
    ],
    footer: "13 years for smaller retail loans, 30 otherwise: set by each lender's policy",
    beats: B(
      "Now the vocabulary. You must be able to speak it. The chain of title: every transfer from the oldest deed, which people call the mother deed, down to today's owner. Sale deeds, gift deeds, partition deeds, wills.",
      { say: "The EC, the Encumbrance Certificate. It lists the registered charges and transfers on the property, year by year, over the search period.", term: { word: "EC", meaning: "Encumbrance Certificate: registered charges on a property, by year" } },
      "The RoR, the record of rights. Who the state's land records show as the owner. And mutation, the update to that record after each transfer. A sale deed with no mutation in the buyer's favour is a query.",
      "And the classic red flags. A power of attorney sale in the chain. A gap in the search period. A name that doesn't match across documents.",
      { say: "And the search period itself: commonly thirteen years for smaller retail loans, and thirty years otherwise. Each lender sets it in its own policy.", tone: "key" },
    ),
  },
  check({
    topic: "the workflow",
    q: "The EC covers 34 of the 38 years the policy asks for. Pass or query?",
    say: "The encumbrance certificate covers thirty four of the thirty eight years the policy asks for. Pass, or query?",
    a: "Query: a charge registered in the missing four years would be invisible, so the vendor asks for a fresh EC covering the gap.",
    aSay: "Query. A charge registered in those four missing years would be invisible. So the vendor asks for a fresh encumbrance certificate that covers the gap. Brikby's own sample report flags exactly this, as a medium severity query.",
  }),

  // ------------------------------------------------------------ 3
  sec("3", "The documents and the portals", "Topic three. Why this is hard. Every state keeps its land records its own way."),
  {
    kind: "compare",
    title: "Same idea, a different record in every state",
    cols: [
      { title: "Uttar Pradesh", icon: "📗", tone: "blue", items: ["Khatauni", "UP Bhulekh"] },
      { title: "Karnataka", icon: "📘", tone: "green", items: ["RTC / Pahani · Bhoomi", "registration, EC · Kaveri 2.0"] },
      { title: "Telangana", icon: "📙", tone: "amber", items: ["Pahani, passbook", "Dharani → Bhu Bharati (2025)"] },
      { title: "Maharashtra", icon: "📕", tone: "purple", items: ["7/12 extract, property card", "IGR: Index II, e-search"] },
    ],
    footer: "also: Jamabandi (Haryana, Punjab) · Patta and Chitta (Tamil Nadu) · a RERA site per state",
    beats: B(
      "Here's the same idea, the record of who owns the land, in four states. Uttar Pradesh calls it the Khatauni, on the UP Bhulekh portal.",
      "Karnataka has the RTC, also called the Pahani, on Bhoomi. And registrations and encumbrance certificates on a separate portal, Kaveri two point oh.",
      { say: "Telangana had Dharani. In April twenty twenty five it was replaced by a new portal, Bhu Bharati, under a new act. If anyone in the room mentions Dharani, you can say it's Bhu Bharati now. That's the kind of detail that shows you've done the reading.", tone: "key" },
      "Maharashtra has the seven twelve extract and the property card, and the IGR portal for the Index Two and the e-search of registered documents.",
      "And so on. Jamabandi in Haryana and Punjab. Patta and Chitta in Tamil Nadu. And a separate RERA website for every state.",
    ),
  },
  {
    kind: "bullets",
    title: "What these portals are like to integrate with",
    firstItemStep: 1,
    items: [
      { icon: "🍪", text: "Sessions and multi-step forms", sub: "district → tehsil → village, each dropdown loads the next" },
      { icon: "🧩", text: "HTML tables and scanned PDFs", sub: "no API, no schema, layouts that change" },
      { icon: "🐢", text: "Downtime and undocumented rate limits", sub: "worst exactly when everyone files: month-end" },
      { icon: "🔐", text: "CAPTCHAs", sub: "a policy question, not a technical one" },
    ],
    beats: B(
      "And here's what these portals are like to integrate with. This is the line in their job description about websites and APIs that were never built for you.",
      "Sessions and multi step forms. Pick a district, which loads the tehsils, which loads the villages.",
      "HTML tables and scanned PDFs. No API, no schema, and layouts that change without notice.",
      "Downtime, and rate limits nobody documents. Worst exactly when everyone is filing, at month end.",
      { say: "And CAPTCHAs. Treat those as a policy question, not a technical challenge. We'll come back to that in topic ten.", tone: "key" },
    ),
  },
  {
    kind: "big",
    tone: "idea",
    lead: "The core difficulty",
    text: "One product has to read every state's documents, in a dozen scripts, often scanned or handwritten.",
    after: "28 states · their own record names · their own portals · their own rules",
    beats: B(
      { say: "So the core difficulty, in one sentence. One product has to read every state's documents, in a dozen scripts, often scanned, often handwritten. Brikby claims fifty plus regional languages. That long tail is both the hard part and the moat.", tone: "key" },
    ),
  },
  check({
    topic: "documents and portals",
    q: "Which portal replaced Telangana's Dharani, and when?",
    options: ["Bhoomi, in 2019", "Bhu Bharati, in April 2025", "Kaveri 2.0, in 2023", "Bhulekh, in 2024"],
    answer: 1,
    a: "Bhu Bharati, launched in April 2025 under a new act; existing records migrated.",
    aSay: "B. Bhu Bharati, in April twenty twenty five, under a new act. The records migrated, so old Dharani references in documents are still valid history, but a connector has to target the new portal.",
  }),
];
