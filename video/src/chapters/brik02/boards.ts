import type { Step } from "../ll01/diagrams.ts";

// BRIK-02's board: Brikby's pipeline (observed front, inferred back), each box
// lit with the project of yours that proves you can build it.

type N = { id: string; x: number; y: number; w: number; h?: number; t: string; s?: string; tone?: string };
type E = { id: string; from?: string; to?: string; fs?: "l" | "r" | "t" | "b"; ts?: "l" | "r" | "t" | "b"; fo?: number; tof?: number; via?: [number, number][]; l?: string; lx?: number; ly?: number; la?: "start" | "middle" | "end" };
type Board = { view: [number, number]; nodes: N[]; edges: E[]; groups?: { x: number; y: number; w: number; h: number; t: string; nodes?: string[] }[] };

export const BRIDGE: Board = {
  view: [1500, 760],
  groups: [
    { x: 20, y: 20, w: 400, h: 720, t: "front half · InterviewPlanPrep", nodes: ["auth", "upload", "live"] },
    { x: 470, y: 20, w: 1010, h: 720, t: "back half · DeepLogLens", nodes: ["job", "fan", "llm", "code", "evals", "report", "deliver", "portals"] },
  ],
  nodes: [
    { id: "auth", x: 60, y: 80, w: 320, t: "Auth + ID token", s: "verifyIdToken in functions" },
    { id: "upload", x: 60, y: 330, w: 320, t: "Direct upload", s: "bytes bypass the API" },
    { id: "live", x: 60, y: 580, w: 320, t: "Live status", s: "Firestore listeners" },
    { id: "job", x: 520, y: 80, w: 280, t: "Job + queue", s: "idempotent create" },
    { id: "fan", x: 860, y: 80, w: 280, t: "Fan out", s: "parts · pages" },
    { id: "llm", x: 1180, y: 80, w: 260, t: "LLM where needed", s: "gate · extraction", tone: "teal" },
    { id: "code", x: 1180, y: 330, w: 260, t: "Code decides", s: "parsers · rules" },
    { id: "portals", x: 860, y: 330, w: 280, t: "Flaky sources", s: "lanes · retry · DLQ" },
    { id: "report", x: 520, y: 330, w: 280, t: "Grounded report", s: "every claim cited" },
    { id: "evals", x: 520, y: 580, w: 280, t: "Evals in CI", s: "thresholds · judge κ", tone: "teal" },
    { id: "deliver", x: 860, y: 580, w: 580, t: "Versioned, delivered once", s: "CAS + append-only history · outbox · signed webhook" },
  ],
  edges: [
    { id: "a-u", from: "auth", to: "upload", fs: "b", ts: "t" },
    { id: "u-l", from: "upload", to: "live", fs: "b", ts: "t" },
    { id: "u-j", from: "upload", to: "job", fs: "r", ts: "l", via: [[450, 372], [450, 122]] },
    { id: "j-f", from: "job", to: "fan" },
    { id: "f-l", from: "fan", to: "llm" },
    { id: "l-c", from: "llm", to: "code", fs: "b", ts: "t" },
    { id: "c-p", from: "code", to: "portals" },
    { id: "p-r", from: "portals", to: "report" },
    { id: "r-e", from: "report", to: "evals", fs: "b", ts: "t" },
    { id: "r-d", from: "report", to: "deliver", fs: "b", ts: "t", fo: 100, tof: -180 },
  ],
};

export const BRIDGE_STEPS: Step[] = [
  { all: true },
  { t: "Front half", b: "Firebase Auth with ID tokens verified in functions, bytes straight to storage, status pushed by listeners. You run exactly this in InterviewPlanPrep.", m: "zero ramp-up", nodes: ["auth", "upload", "live"], edges: ["a-u", "u-l"] },
  { t: "Accept, then fan out", b: "A job created once, then the work split into parts processed in parallel: DeepLogLens's byte-range parts over Kafka.", m: "205 parts of a 1 GB file", nodes: ["upload", "job", "fan"], edges: ["u-j", "j-f"] },
  { t: "LLM only where needed", b: "Deterministic code counts and decides; the model reads and explains only what needs it.", m: "42,205 LLM calls, not 220,657", nodes: ["fan", "llm", "code"], edges: ["f-l", "l-c"] },
  { t: "Sources that fail", b: "Rate-limited lanes, a retry topic with notBefore, a DLQ, and never stuck: the shape of a portal connector.", m: "every upload ends done or failed with a reason", nodes: ["code", "portals"], edges: ["c-p"] },
  { t: "Grounded and measured", b: "Every claim points at stored evidence; a seeded eval in CI fails the build below its thresholds.", m: "F1 0.90 · judge κ 0.625", nodes: ["portals", "report", "evals"], edges: ["p-r", "r-e"] },
  { t: "Versioned, delivered once", b: "Revisions with compare-and-swap and append-only history for edits; effects that happen once for delivery.", m: "IPP's notes, DLL's upserts", nodes: ["report", "deliver"], edges: ["r-d"] },
];
