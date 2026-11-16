import type { Step } from "../ll01/diagrams.ts";

// Box-and-arrow boards for BRIK-01, drawn with LL-01's llarch scene (view units;
// the scene scales them to fit). The outside board shows only the generic shape
// any visitor could describe; the pipeline board is inference and says so.

type N = { id: string; x: number; y: number; w: number; h?: number; t: string; s?: string; tone?: string };
type E = { id: string; from?: string; to?: string; fs?: "l" | "r" | "t" | "b"; ts?: "l" | "r" | "t" | "b"; fo?: number; tof?: number; via?: [number, number][]; l?: string; lx?: number; ly?: number; la?: "start" | "middle" | "end" };
type Board = { view: [number, number]; nodes: N[]; edges: E[]; groups?: { x: number; y: number; w: number; h: number; t: string; nodes?: string[] }[] };

// The lender's legal check, today: one loan file through the hands it passes.
export const WORKFLOW: Board = {
  view: [1500, 700],
  groups: [{ x: 360, y: 20, w: 760, h: 200, t: "Lender", nodes: ["login", "credit"] }],
  nodes: [
    { id: "borrower", x: 40, y: 80, w: 250, t: "Borrower", s: "deeds · EC · tax receipts" },
    { id: "login", x: 400, y: 80, w: 300, t: "Loan file opened", s: "documents collected" },
    { id: "credit", x: 780, y: 80, w: 300, t: "Credit team", s: "sanction · disbursal" },
    { id: "vendor", x: 600, y: 330, w: 300, t: "Legal vendor", s: "empanelled advocate" },
    { id: "sro", x: 40, y: 570, w: 300, t: "Title chain", s: "deeds, 13 or 30 years" },
    { id: "rev", x: 600, y: 570, w: 300, t: "EC", s: "registered charges" },
    { id: "rera", x: 1160, y: 570, w: 300, t: "Land records", s: "RoR · mutation" },
    { id: "report", x: 1160, y: 330, w: 300, t: "TSR / LSR", s: "in the lender's format" },
  ],
  edges: [
    { id: "b-l", from: "borrower", to: "login" },
    { id: "l-v", from: "login", to: "vendor", fs: "b", ts: "t", fo: 0, tof: -60, l: "file sent out", lx: 560, ly: 280, la: "end" },
    { id: "v-sro", from: "vendor", to: "sro", fs: "b", ts: "t", fo: -110, tof: 60, via: [[640, 500], [250, 500]], l: "scrutiny", lx: 445, ly: 490 },
    { id: "v-rev", from: "vendor", to: "rev", fs: "b", ts: "t" },
    { id: "v-rera", from: "vendor", to: "rera", fs: "b", ts: "t", fo: 110, tof: -60, via: [[860, 500], [1250, 500]] },
    { id: "v-b", from: "vendor", to: "borrower", fs: "l", ts: "b", via: [[165, 372]], l: "queries", lx: 380, ly: 362 },
    { id: "v-rep", from: "vendor", to: "report", l: "opinion", lx: 1030, ly: 362 },
    { id: "rep-c", from: "report", to: "credit", fs: "t", ts: "b", fo: 0, tof: 150 },
  ],
};

export const WORKFLOW_STEPS: Step[] = [
  { all: true },
  { t: "File opened", b: "The borrower hands over the property papers and the lender opens the loan file.", m: "day 0", nodes: ["borrower", "login"], edges: ["b-l"] },
  { t: "Out to a vendor", b: "The lender doesn't check title itself: the file goes to an empanelled advocate or legal vendor firm.", m: "the vendor's turnaround is the lender's", nodes: ["login", "vendor"], edges: ["l-v"] },
  { t: "Scrutiny", b: "The vendor traces the chain of title, reads the EC and checks the state's land records.", m: "every state, its own portal", nodes: ["vendor", "sro", "rev", "rera"], edges: ["v-sro", "v-rev", "v-rera"] },
  { t: "Queries", b: "Gaps go back to the borrower: a missing deed, an EC that stops short, a name that doesn't match.", m: "each round trip adds days", nodes: ["vendor", "borrower"], edges: ["v-b"] },
  { t: "Opinion", b: "The vendor writes the Title Search Report or Legal Scrutiny Report in that lender's own format.", m: "7 to 15 days end to end", nodes: ["vendor", "report"], edges: ["v-rep"] },
  { t: "Decision", b: "Credit reads the opinion and sanctions; then the money goes out.", m: "no clean title, no disbursal", nodes: ["report", "credit"], edges: ["rep-c"] },
];

// The shape any visitor could describe: upload, start a job, watch it live.
export const OUTSIDE: Board = {
  view: [1500, 620],
  nodes: [
    { id: "user", x: 40, y: 260, w: 280, t: "Lender user", s: "browser · web app" },
    { id: "store", x: 600, y: 40, w: 300, t: "Cloud storage", s: "uploaded documents" },
    { id: "api", x: 600, y: 260, w: 300, t: "API functions", s: "serverless" },
    { id: "job", x: 600, y: 480, w: 300, t: "Job record", s: "status · stage" },
    { id: "pipe", x: 1160, y: 260, w: 300, t: "Analysis pipeline", s: "not visible from outside", tone: "teal" },
  ],
  edges: [
    { id: "u-s", from: "user", to: "store", fs: "t", ts: "l", via: [[180, 82]], l: "upload files", lx: 200, ly: 70, la: "start" },
    { id: "u-api", from: "user", to: "api", l: "start analysis", lx: 460, ly: 290 },
    { id: "api-job", from: "api", to: "job", fs: "b", ts: "t", l: "job created", lx: 765, ly: 420, la: "start" },
    { id: "job-u", from: "job", to: "user", fs: "l", ts: "b", via: [[180, 522]], l: "live updates", lx: 200, ly: 510, la: "start" },
    { id: "api-pipe", from: "api", to: "pipe", l: "work", lx: 1030, ly: 290 },
    { id: "pipe-job", from: "pipe", to: "job", fs: "b", ts: "r", via: [[1310, 522]], l: "stage · report", lx: 1030, ly: 510 },
  ],
};

export const OUTSIDE_STEPS: Step[] = [
  { all: true },
  { t: "Upload", b: "Documents go from the browser straight into cloud storage; the API never carries the bytes.", m: "any state, any language", nodes: ["user", "store"], edges: ["u-s"] },
  { t: "Start a job", b: "The browser asks an API function to start the analysis; it records a job and answers at once.", m: "a job, not a 30-minute request", nodes: ["user", "api", "job"], edges: ["u-api", "api-job"] },
  { t: "Work", b: "Behind the function the analysis pipeline runs. None of it is visible from outside.", m: "the next board is inference", nodes: ["api", "pipe"], edges: ["api-pipe"] },
  { t: "Live status", b: "The pipeline updates the job's stage; the browser is pushed each change and opens the report.", m: "live updates, no polling", nodes: ["pipe", "job", "user"], edges: ["pipe-job", "job-u"] },
  { t: "After", b: "The user can edit the report; an organisation pays with shared report credits.", m: "Rs 200 per report, list price", nodes: ["user"] },
];

// The pipeline the product implies (inference, not observation).
export const PIPELINE: Board = {
  view: [1500, 420],
  nodes: [
    { id: "q", x: 40, y: 40, w: 300, t: "Queue", s: "one job per file" },
    { id: "ocr", x: 420, y: 40, w: 300, t: "OCR / vision", s: "per page · handwriting", tone: "teal" },
    { id: "cls", x: 800, y: 40, w: 300, t: "Classify", s: "deed · EC · RoR · plan", tone: "teal" },
    { id: "ext", x: 1160, y: 40, w: 300, t: "Extract", s: "fields with page cites", tone: "teal" },
    { id: "rep", x: 40, y: 290, w: 300, t: "Report JSON", s: "rendered per lender" },
    { id: "gov", x: 420, y: 290, w: 300, t: "Portal checks", s: "one connector each" },
    { id: "rules", x: 800, y: 290, w: 300, t: "Rules (code)", s: "lender · state · loan" },
    { id: "chain", x: 1160, y: 290, w: 300, t: "Title chain (code)", s: "joins the deeds" },
  ],
  edges: [
    { id: "q-o", from: "q", to: "ocr" },
    { id: "o-c", from: "ocr", to: "cls" },
    { id: "c-e", from: "cls", to: "ext" },
    { id: "e-ch", from: "ext", to: "chain", fs: "b", ts: "t" },
    { id: "ch-r", from: "chain", to: "rules", fs: "l", ts: "r" },
    { id: "r-g", from: "rules", to: "gov", fs: "l", ts: "r" },
    { id: "g-rep", from: "gov", to: "rep", fs: "l", ts: "r" },
  ],
};

export const PIPELINE_STEPS: Step[] = [
  { all: true },
  { t: "Read", b: "Each file is a job on a queue; every page goes through OCR or a vision model, in parallel.", m: "the slow, costly step", nodes: ["q", "ocr"], edges: ["q-o"] },
  { t: "Understand", b: "Classify each document, then extract its fields against that type's schema, each with a page reference.", m: "the LLM reads", nodes: ["ocr", "cls", "ext"], edges: ["o-c", "c-e"] },
  { t: "Decide", b: "Code joins the deeds into a title chain and applies the lender's policy, the state's rules and the loan type.", m: "code decides: exact and explainable", nodes: ["ext", "chain", "rules"], edges: ["e-ch", "ch-r"] },
  { t: "Verify", b: "Government portal checks, each its own connector; a portal that's down leaves one check pending.", m: "slow and unreliable, so isolated", nodes: ["rules", "gov"], edges: ["r-g"] },
  { t: "Report", b: "One report JSON with flags, severity and citations, rendered in each lender's format, reviewed by a lawyer.", m: "every correction becomes a test", nodes: ["gov", "rep"], edges: ["g-rep"] },
];
