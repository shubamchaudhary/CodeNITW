import type { Step } from "../ll01/diagrams.ts";

// Box-and-arrow boards for BRIK-01, drawn with LL-01's llarch scene (view units;
// the scene scales them to fit). Observed boards show only what any visitor's
// browser sees; inferred boards are labelled as such in their titles.

type N = { id: string; x: number; y: number; w: number; h?: number; t: string; s?: string; tone?: string };
type E = { id: string; from?: string; to?: string; fs?: "l" | "r" | "t" | "b"; ts?: "l" | "r" | "t" | "b"; fo?: number; tof?: number; via?: [number, number][]; l?: string; lx?: number; ly?: number; la?: "start" | "middle" | "end" };
type Board = { view: [number, number]; nodes: N[]; edges: E[]; groups?: { x: number; y: number; w: number; h: number; t: string; nodes?: string[] }[] };

// The lender's legal check, today: one loan file through the hands it passes.
export const WORKFLOW: Board = {
  view: [1500, 700],
  groups: [{ x: 360, y: 20, w: 760, h: 200, t: "Lender", nodes: ["login", "credit"] }],
  nodes: [
    { id: "borrower", x: 40, y: 80, w: 250, t: "Borrower", s: "deeds · EC · tax receipts" },
    { id: "login", x: 400, y: 80, w: 300, t: "Loan login", s: "file opened in the LOS" },
    { id: "credit", x: 780, y: 80, w: 300, t: "Credit team", s: "sanction · disbursal" },
    { id: "vendor", x: 600, y: 330, w: 300, t: "Legal vendor", s: "empanelled advocate" },
    { id: "sro", x: 40, y: 570, w: 300, t: "Sub-Registrar / IGR", s: "EC · index search" },
    { id: "rev", x: 600, y: 570, w: 300, t: "Revenue portal", s: "RoR · mutation" },
    { id: "rera", x: 1160, y: 570, w: 300, t: "RERA · authority", s: "project · approvals" },
    { id: "report", x: 1160, y: 330, w: 300, t: "TSR / LSR", s: "in the lender's format" },
  ],
  edges: [
    { id: "b-l", from: "borrower", to: "login" },
    { id: "l-v", from: "login", to: "vendor", fs: "b", ts: "t", fo: 0, tof: -60, l: "file sent out", lx: 560, ly: 280, la: "end" },
    { id: "v-sro", from: "vendor", to: "sro", fs: "b", ts: "t", fo: -110, tof: 60, via: [[640, 500], [250, 500]], l: "search 13 or 30 years", lx: 445, ly: 490 },
    { id: "v-rev", from: "vendor", to: "rev", fs: "b", ts: "t" },
    { id: "v-rera", from: "vendor", to: "rera", fs: "b", ts: "t", fo: 110, tof: -60, via: [[860, 500], [1250, 500]] },
    { id: "v-b", from: "vendor", to: "borrower", fs: "l", ts: "b", via: [[165, 372]], l: "queries", lx: 380, ly: 362 },
    { id: "v-rep", from: "vendor", to: "report", l: "opinion", lx: 1030, ly: 362 },
    { id: "rep-c", from: "report", to: "credit", fs: "t", ts: "b", fo: 0, tof: 150 },
  ],
};

export const WORKFLOW_STEPS: Step[] = [
  { all: true },
  { t: "Login", b: "The borrower hands over the property papers; the lender opens the file in its loan-origination system.", m: "day 0", nodes: ["borrower", "login"], edges: ["b-l"] },
  { t: "Out to a vendor", b: "Legal scrutiny is outsourced to an empanelled advocate or a legal vendor firm, file by file.", m: "the vendor's TAT becomes the lender's", nodes: ["login", "vendor"], edges: ["l-v"] },
  { t: "Search", b: "The vendor traces the title back 13 or 30 years: EC and index searches at the registrar, revenue records, approvals and RERA.", m: "state portals, one per state", nodes: ["vendor", "sro", "rev", "rera"], edges: ["v-sro", "v-rev", "v-rera"] },
  { t: "Queries", b: "Gaps go back to the borrower: a missing link deed, an EC that stops short, a name that differs from the revenue record.", m: "each round trip adds days", nodes: ["vendor", "borrower"], edges: ["v-b"] },
  { t: "Opinion", b: "The vendor writes the Title Search Report or Legal Scrutiny Report in that lender's own format.", m: "4 to 15 days end to end", nodes: ["vendor", "report"], edges: ["v-rep"] },
  { t: "Decision", b: "Credit reads the opinion, sanctions, and the mortgage is created at disbursal.", m: "no clean title, no disbursal", nodes: ["report", "credit"], edges: ["rep-c"] },
];

// What any visitor's browser shows: the client stack and the calls it makes.
export const OBSERVED: Board = {
  view: [1500, 720],
  nodes: [
    { id: "user", x: 40, y: 300, w: 260, t: "Browser", s: "React SPA · Vite" },
    { id: "host", x: 40, y: 40, w: 260, t: "Firebase Hosting", s: "Google edge · CDN" },
    { id: "auth", x: 40, y: 580, w: 260, t: "Firebase Auth", s: "ID token" },
    { id: "gcs", x: 560, y: 40, w: 300, t: "Cloud Storage", s: "uploaded documents" },
    { id: "api", x: 560, y: 300, w: 300, t: "/api functions", s: "Cloud Functions" },
    { id: "fs", x: 560, y: 580, w: 300, t: "Firestore", s: "job doc · status, stage" },
    { id: "back", x: 1140, y: 300, w: 320, t: "Pipeline", s: "not visible from outside", tone: "teal" },
    { id: "pay", x: 1140, y: 30, w: 320, t: "Razorpay", s: "report credits" },
    { id: "ph", x: 1140, y: 160, w: 320, t: "PostHog", s: "product analytics" },
  ],
  edges: [
    { id: "u-h", from: "user", to: "host", fs: "t", ts: "b", l: "app shell", lx: 182, ly: 220, la: "start" },
    { id: "u-a", from: "user", to: "auth", fs: "b", ts: "t", l: "sign in", lx: 182, ly: 500, la: "start" },
    { id: "u-g", from: "user", to: "gcs", fs: "r", ts: "l", fo: -30, via: [[430, 312], [430, 82]], l: "upload files", lx: 440, ly: 190, la: "start" },
    { id: "u-api", from: "user", to: "api", l: "create job", lx: 430, ly: 334 },
    { id: "api-fs", from: "api", to: "fs", fs: "b", ts: "t", l: "job created", lx: 722, ly: 500, la: "start" },
    { id: "fs-u", from: "fs", to: "user", fs: "l", ts: "r", via: [[430, 622], [430, 372]], fo: 0, tof: 30, l: "live status", lx: 440, ly: 500, la: "start" },
    { id: "api-back", from: "api", to: "back", l: "work", lx: 1000, ly: 330 },
    { id: "back-fs", from: "back", to: "fs", fs: "b", ts: "r", via: [[1300, 622]], l: "stage · report id", lx: 1000, ly: 612 },
    { id: "u-pay", from: "user", to: "pay", fs: "t", ts: "l", fo: 80, via: [[250, 12], [1100, 12], [1100, 72]] },
  ],
};

export const OBSERVED_STEPS: Step[] = [
  { all: true },
  { t: "Shell", b: "A single-page React app served by Firebase Hosting from Google's edge. Sign-in is Firebase Auth.", m: "a lean, serverless GCP stack", nodes: ["user", "host", "auth"], edges: ["u-h", "u-a"] },
  { t: "Upload", b: "Documents go from the browser into Cloud Storage: PDFs and images, up to 50 MB each, folders allowed.", m: "the API never carries the bytes", nodes: ["user", "gcs"], edges: ["u-g"] },
  { t: "Create a job", b: "The browser calls a same-origin /api function with its ID token. The function records a job and returns its id.", m: "an async job, not a long request", nodes: ["user", "api", "fs"], edges: ["u-api", "api-fs"] },
  { t: "Work", b: "Behind the function, the real pipeline runs. None of it is visible from outside, so the next board is inference.", m: "this is where the interview is", nodes: ["api", "back"], edges: ["api-back"] },
  { t: "Live status", b: "The worker updates the job document's stage; the browser listens to it and opens the report when it completes.", m: "a listener, no polling", nodes: ["back", "fs", "user"], edges: ["back-fs", "fs-u"] },
  { t: "Credits", b: "Organisations share a pool of report credits, bought through Razorpay. Product events go to PostHog.", m: "Rs 200 per report, list price", nodes: ["user", "pay", "ph"], edges: ["u-pay"] },
];

// The pipeline the product implies (inference, not observation).
export const PIPELINE: Board = {
  view: [1500, 760],
  nodes: [
    { id: "api", x: 40, y: 40, w: 250, t: "Create job", s: "idempotency key" },
    { id: "q", x: 380, y: 40, w: 250, t: "Queue", s: "Cloud Tasks · Pub/Sub" },
    { id: "split", x: 720, y: 40, w: 300, t: "Split + hash", s: "one task per page" },
    { id: "ocr", x: 1110, y: 40, w: 350, t: "OCR / vision", s: "Indic · handwriting", tone: "teal" },
    { id: "cls", x: 1110, y: 250, w: 350, t: "Classify", s: "deed · EC · RoR · plan", tone: "teal" },
    { id: "ext", x: 720, y: 250, w: 300, t: "Extract", s: "schema · page cites", tone: "teal" },
    { id: "chain", x: 380, y: 250, w: 250, t: "Title chain", s: "code joins deeds" },
    { id: "rules", x: 40, y: 250, w: 250, t: "Rules", s: "state · lender · loan" },
    { id: "gov", x: 40, y: 480, w: 250, t: "Portal agents", s: "RoR · EC · RERA" },
    { id: "rep", x: 380, y: 480, w: 250, t: "Report JSON", s: "flags · severity" },
    { id: "db", x: 720, y: 480, w: 300, t: "Report store", s: "versioned · edits" },
    { id: "out", x: 1110, y: 480, w: 350, t: "Outbox", s: "signed webhook" },
    { id: "rev", x: 380, y: 660, w: 640, h: 70, t: "Human review", s: "" },
  ],
  edges: [
    { id: "a-q", from: "api", to: "q" },
    { id: "q-s", from: "q", to: "split" },
    { id: "s-o", from: "split", to: "ocr", l: "fan out", lx: 1065, ly: 30 },
    { id: "o-c", from: "ocr", to: "cls", fs: "b", ts: "t" },
    { id: "c-e", from: "cls", to: "ext" },
    { id: "e-ch", from: "ext", to: "chain" },
    { id: "ch-r", from: "chain", to: "rules" },
    { id: "r-g", from: "rules", to: "gov", fs: "b", ts: "t" },
    { id: "g-rep", from: "gov", to: "rep" },
    { id: "rep-db", from: "rep", to: "db" },
    { id: "db-out", from: "db", to: "out", l: "same tx", lx: 1065, ly: 512 },
    { id: "db-rev", from: "db", to: "rev", fs: "b", ts: "t", fo: 0, tof: 220 },
  ],
};

export const PIPELINE_STEPS: Step[] = [
  { all: true },
  { t: "Accept", b: "Create the job with an idempotency key and answer at once; the work goes on a queue.", m: "milliseconds on the request path", nodes: ["api", "q"], edges: ["a-q"] },
  { t: "Split", b: "Render every page and hash it. A page is the unit of retry, of parallelism, and of caching.", m: "~13 documents, ~70 pages a file", nodes: ["q", "split"], edges: ["q-s"] },
  { t: "Read", b: "OCR or a vision model per page, in parallel: regional scripts, stamps, handwriting. The slow, flaky, expensive step.", m: "most of the cost, most of the time", nodes: ["split", "ocr"], edges: ["s-o"] },
  { t: "Understand", b: "Classify each document, then extract its fields against that type's schema, every field with a page reference.", m: "structured output, not prose", nodes: ["ocr", "cls", "ext"], edges: ["o-c", "c-e"] },
  { t: "Chain and rules", b: "Code joins deeds into a title chain on parties and survey numbers; rules apply the state, the lender's policy and the loan type.", m: "exact and explainable", nodes: ["ext", "chain", "rules"], edges: ["e-ch", "ch-r"] },
  { t: "Verify", b: "Portal agents fetch revenue records, ECs and RERA entries and reconcile them with the documents.", m: "slow and unreliable, so isolated", nodes: ["rules", "gov"], edges: ["r-g"] },
  { t: "Report", b: "One canonical, versioned JSON with flags, severity and citations; a human reviews and edits it; every format renders from it.", m: "edits become eval data", nodes: ["gov", "rep", "db", "rev"], edges: ["g-rep", "rep-db", "db-rev"] },
  { t: "Deliver", b: "The ready event is written in the same transaction as the report, then sent to the lender as a signed webhook.", m: "never lost · receiver dedupes", nodes: ["db", "out"], edges: ["db-out"] },
];

// One portal check as a tool the agent calls.
export const AGENTS: Board = {
  view: [1500, 700],
  nodes: [
    { id: "plan", x: 40, y: 290, w: 280, t: "Planner", s: "which checks this file needs", tone: "teal" },
    { id: "lim", x: 450, y: 60, w: 300, t: "Rate limiter", s: "token bucket per portal" },
    { id: "cache", x: 450, y: 520, w: 300, t: "Record cache", s: "portal + id · TTL" },
    { id: "c1", x: 880, y: 60, w: 280, t: "Bhoomi connector", s: "RoR by survey no." },
    { id: "c2", x: 880, y: 290, w: 280, t: "IGR connector", s: "EC · index search" },
    { id: "c3", x: 880, y: 520, w: 280, t: "RERA connector", s: "project status" },
    { id: "ev", x: 1240, y: 290, w: 220, t: "Evidence", s: "raw page kept" },
    { id: "rec", x: 450, y: 290, w: 300, t: "Reconcile", s: "portal vs documents", tone: "teal" },
  ],
  edges: [
    { id: "p-l", from: "plan", to: "lim", fs: "t", ts: "l", via: [[180, 102]] },
    { id: "p-c", from: "plan", to: "cache", fs: "b", ts: "l", via: [[180, 562]], l: "hit? reuse", lx: 190, ly: 470, la: "start" },
    { id: "l-1", from: "lim", to: "c1" },
    { id: "l-2", from: "lim", to: "c2", fs: "r", ts: "l", fo: 30, tof: -22, via: [[850, 132], [850, 310]] },
    { id: "c-ev", from: "c2", to: "ev" },
    { id: "c2-rec", from: "c2", to: "rec", l: "record", lx: 805, ly: 322 },
    { id: "rec-p", from: "rec", to: "plan", l: "flags", lx: 385, ly: 322 },
  ],
};

export const AGENTS_STEPS: Step[] = [
  { all: true },
  { t: "Plan", b: "The planner reads the extracted documents and decides which portal checks this file needs: state, document types, loan type.", m: "tools chosen per file", nodes: ["plan"] },
  { t: "Cache first", b: "A record fetched for the same property in the last few hours is reused.", m: "cheaper and kinder to the portal", nodes: ["plan", "cache"], edges: ["p-c"] },
  { t: "Politely", b: "Every portal has its own token bucket and a small concurrency limit, shared by all workers.", m: "rate limits nobody documents", nodes: ["plan", "lim", "c1", "c2", "c3"], edges: ["p-l", "l-1", "l-2"] },
  { t: "One connector per portal", b: "Each connector replays the portal's session and form steps, parses the HTML into a schema, and keeps the raw page as evidence.", m: "a parse failure is an alert", nodes: ["c2", "ev"], edges: ["c-ev"] },
  { t: "Reconcile", b: "The structured record is compared with the documents: an owner who differs, a charge missing from the EC. Differences become flags.", m: "every flag cites the portal page", nodes: ["c2", "rec", "plan"], edges: ["c2-rec", "rec-p"] },
];
