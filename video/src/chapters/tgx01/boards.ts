import type { Step } from "../ll01/diagrams.ts";

// Box-and-arrow boards for TGX-01, drawn with LL-01's llarch scene (view units;
// the scene scales them to fit). Every box is a real file or folder of the
// TheragenX-Assisment repository; nothing here is inferred.

type N = { id: string; x: number; y: number; w: number; h?: number; t: string; s?: string; tone?: string };
type E = { id: string; from?: string; to?: string; fs?: "l" | "r" | "t" | "b"; ts?: "l" | "r" | "t" | "b"; fo?: number; tof?: number; via?: [number, number][]; l?: string; lx?: number; ly?: number; la?: "start" | "middle" | "end" };
type Board = { view: [number, number]; nodes: N[]; edges: E[]; groups?: { x: number; y: number; w: number; h: number; t: string; nodes?: string[] }[] };

// The whole system: three ways in (live, replay, review), one pipeline.
export const SYSTEM: Board = {
  view: [1500, 760],
  nodes: [
    { id: "src", x: 40, y: 60, w: 300, t: "Report text", s: "exact UTF-8 bytes" },
    { id: "prompt", x: 420, y: 60, w: 300, t: "Prompt + Evidence", s: "numbered passages" },
    { id: "llm", x: 800, y: 60, w: 300, t: "LLM", s: "qwen3.8-27b on Groq", tone: "teal" },
    { id: "cat", x: 40, y: 300, w: 300, t: "Field catalog", s: "16 fields · 7 types" },
    { id: "fix", x: 800, y: 300, w: 300, t: "fixtures/", s: "request + every attempt" },
    { id: "ext", x: 1160, y: 300, w: 300, t: "Extraction", s: "validate · cite · calibrate" },
    { id: "rev", x: 40, y: 540, w: 300, t: "review-state/", s: "decisions + sign-offs" },
    { id: "desk", x: 420, y: 540, w: 300, t: "React desk", s: "draft · check · sign" },
    { id: "api", x: 800, y: 540, w: 300, t: "Review API", s: "REST · Checks" },
    { id: "out", x: 1160, y: 540, w: 300, t: "out/*.json", s: "+ duplicates.json" },
  ],
  edges: [
    { id: "s-p", from: "src", to: "prompt" },
    { id: "c-p", from: "cat", to: "prompt", fs: "r", ts: "b", via: [[570, 342]] },
    { id: "p-m", from: "prompt", to: "llm", l: "one request", lx: 760, ly: 90 },
    { id: "m-f", from: "llm", to: "fix", fs: "b", ts: "t", l: "recorded", lx: 965, ly: 230, la: "start" },
    { id: "f-x", from: "fix", to: "ext", l: "replay starts here", lx: 1130, ly: 290, la: "end" },
    { id: "c-x", from: "cat", to: "ext", fs: "b", ts: "b", tof: -80, via: [[190, 470], [1230, 470]], l: "today's catalog", lx: 760, ly: 460 },
    { id: "x-o", from: "ext", to: "out", fs: "b", ts: "t", fo: 60, tof: 60 },
    { id: "o-a", from: "out", to: "api" },
    { id: "a-d", from: "api", to: "desk", fs: "l", ts: "r", fo: -18, tof: -18, l: "GET", lx: 760, ly: 552 },
    { id: "d-a", from: "desk", to: "api", fs: "r", ts: "l", fo: 18, tof: 18, l: "PATCH · sign", lx: 760, ly: 628 },
    { id: "a-r", from: "api", to: "rev", fs: "b", ts: "b", via: [[950, 700], [190, 700]], l: "decisions", lx: 570, ly: 690 },
  ],
};

export const SYSTEM_STEPS: Step[] = [
  { all: true },
  { t: "Input", b: "A report's exact bytes, and the catalog: the only place a field is defined.", m: "8 core + 4 stretch reports", nodes: ["src", "cat"] },
  { t: "One request", b: "Java numbers the report's passages and sends them with the catalog's fields to the model.", m: "the model returns passage IDs, never offsets", nodes: ["src", "cat", "prompt", "llm"], edges: ["s-p", "c-p", "p-m"] },
  { t: "Recorded", b: "The request and every attempt, failures included, are written to a fixture before anything is parsed.", m: "live reads its own recording", nodes: ["llm", "fix"], edges: ["m-f"] },
  { t: "Decide", b: "Java checks each proposal against today's catalog, resolves each citation to exact offsets and lowers unsupported confidence.", m: "replay enters here: no key, no network", nodes: ["fix", "ext", "cat"], edges: ["f-x", "c-x"] },
  { t: "Output", b: "One JSON per report, every catalog field in every case, plus the duplicate index.", m: "committed, and byte-identical on replay", nodes: ["ext", "out"], edges: ["x-o"] },
  { t: "Review", b: "Spring serves the outputs with deterministic checks; the desk numbers each quote and arrows it to every field it feeds.", m: "the reviewer works at once", nodes: ["out", "api", "desk"], edges: ["o-a", "a-d"] },
  { t: "Decisions", b: "Accept, reject or edit goes back over PATCH; a named sign-off locks the case. Both are keyed by the document's revision.", m: "the model's value is never overwritten", nodes: ["desk", "api", "rev"], edges: ["d-a", "a-r"] },
];

// The code map: which class does what, in the order a report meets them.
export const CODEMAP: Board = {
  view: [1500, 700],
  nodes: [
    { id: "intake", x: 40, y: 40, w: 300, t: "Intake", s: "main · --mode" },
    { id: "pipeline", x: 420, y: 40, w: 300, t: "Pipeline", s: "the per-report loop" },
    { id: "model", x: 800, y: 40, w: 300, t: "LanguageModel", s: "HttpModel · Recording", tone: "teal" },
    { id: "prompt", x: 1160, y: 40, w: 300, t: "Prompt · Evidence", s: "passages · masking" },
    { id: "offline", x: 40, y: 220, w: 300, t: "OfflineReplay", s: "replay.sh · JDK only" },
    { id: "sources", x: 420, y: 220, w: 300, t: "Sources · Scans", s: "read · digest · PDF pages" },
    { id: "repair", x: 800, y: 220, w: 300, t: "CaseRepair", s: "one scoped retry" },
    { id: "catcheck", x: 1160, y: 220, w: 300, t: "CatalogCheck", s: "fails with the field name" },
    { id: "json", x: 420, y: 400, w: 300, t: "Json", s: "strict read · atomic LF write" },
    { id: "extraction", x: 800, y: 400, w: 300, t: "Extraction", s: "Rules · Confidence" },
    { id: "dup", x: 1160, y: 400, w: 300, t: "Duplicates", s: "pairs → duplicates.json" },
    { id: "ui", x: 40, y: 580, w: 300, t: "React desk", s: "Flow · Source · Fields · arrows" },
    { id: "api", x: 420, y: 580, w: 300, t: "ReviewApi", s: "+ Checks · AssistantApi" },
    { id: "files", x: 800, y: 580, w: 300, t: "Files", s: "out · fixtures · review-state" },
  ],
  edges: [
    { id: "i-p", from: "intake", to: "pipeline" },
    { id: "o-p", from: "offline", to: "pipeline", tof: 22 },
    { id: "p-s", from: "pipeline", to: "sources", fs: "b", ts: "t" },
    { id: "p-m", from: "pipeline", to: "model", l: "predict", lx: 760, ly: 70 },
    { id: "m-pr", from: "model", to: "prompt" },
    { id: "m-r", from: "model", to: "repair", fs: "b", ts: "t" },
    { id: "r-x", from: "repair", to: "extraction", fs: "b", ts: "t" },
    { id: "x-j", from: "extraction", to: "json", l: "write", lx: 760, ly: 430 },
    { id: "x-d", from: "extraction", to: "dup" },
    { id: "u-a", from: "ui", to: "api", l: "fetch", lx: 380, ly: 610 },
    { id: "a-f", from: "api", to: "files" },
    { id: "x-f", from: "extraction", to: "files", fs: "b", ts: "t" },
  ],
};

export const CODEMAP_STEPS: Step[] = [
  { all: true },
  { t: "Entry points", b: "Intake picks the mode; OfflineReplay is a JDK-only main for replay.sh. Both call the same Pipeline.", m: "src/main/java/dev/caseintake", nodes: ["intake", "offline", "pipeline"], edges: ["i-p", "o-p"] },
  { t: "Read", b: "Sources finds and reads reports (TXT over PDF) and hashes the bytes; Scans pulls JPEG pages out of an image-only PDF.", m: "the SHA-256 is the report's identity", nodes: ["pipeline", "sources"], edges: ["p-s"] },
  { t: "Ask", b: "One interface, two implementations. Prompt and Evidence build the request from numbered passages.", m: "live and replay share one reader", nodes: ["pipeline", "model", "prompt"], edges: ["p-m", "m-pr"] },
  { t: "Repair", b: "A patient whose fields came back as bare values gets one focused follow-up, with its own recording.", m: "D04's infant", nodes: ["model", "repair"], edges: ["m-r"] },
  { t: "Decide", b: "Extraction walks the catalog; Rules checks types, Confidence gates high. CatalogCheck rejects a broken catalog first.", m: "every failure becomes unknown, with a reason", nodes: ["repair", "extraction", "catcheck"], edges: ["r-x"] },
  { t: "Write", b: "Json writes each output atomically with LF endings; Duplicates indexes candidate pairs.", m: "replay leaves a clean checkout", nodes: ["extraction", "json", "dup", "files"], edges: ["x-j", "x-d", "x-f"] },
  { t: "Serve", b: "Spring's ReviewApi (with Checks) and AssistantApi read the files; the React desk talks only to them.", m: "one process, one port", nodes: ["ui", "api", "files"], edges: ["u-a", "a-f"] },
];

// One real field, D01's age, from bytes to pixels.
export const FIELD: Board = {
  view: [1500, 460],
  nodes: [
    { id: "bytes", x: 40, y: 40, w: 300, t: "D01.txt", s: "bytes · SHA-256" },
    { id: "passages", x: 420, y: 40, w: 300, t: "Evidence.index", s: "passage 8: the age sentence" },
    { id: "request", x: 800, y: 40, w: 300, t: "Prompt.request", s: "catalog + passages" },
    { id: "reply", x: 1160, y: 40, w: 300, t: "Model reply", s: "54 · high · quotes [8]", tone: "teal" },
    { id: "desk", x: 40, y: 320, w: 300, t: "Source.tsx", s: "passage 8 · 3 arrows" },
    { id: "out", x: 420, y: 320, w: 300, t: "out/D01.json", s: "extracted · high · [201, 347)" },
    { id: "ext", x: 800, y: 320, w: 300, t: "Extraction", s: "integer · 0–120 · gate" },
    { id: "fixture", x: 1160, y: 320, w: 300, t: "fixtures/D01.json", s: "429 · 429 · 200" },
  ],
  edges: [
    { id: "b-p", from: "bytes", to: "passages" },
    { id: "p-r", from: "passages", to: "request" },
    { id: "r-m", from: "request", to: "reply" },
    { id: "m-f", from: "reply", to: "fixture", fs: "b", ts: "t" },
    { id: "f-x", from: "fixture", to: "ext" },
    { id: "x-o", from: "ext", to: "out" },
    { id: "o-d", from: "out", to: "desk" },
  ],
};

export const FIELD_STEPS: Step[] = [
  { all: true },
  { t: "Bytes", b: "Java reads D01.txt, decodes it as strict UTF-8 and hashes the bytes.", m: "a TXT wins over its PDF", nodes: ["bytes"] },
  { t: "Passages", b: "The report is split at sentence and line boundaries. The age sentence is passage 8.", m: "offsets in code points", nodes: ["bytes", "passages"], edges: ["b-p"] },
  { t: "Request", b: "System message: the policy. User message: the catalog's fields and the numbered passages, as data.", m: "temperature 0 · JSON mode", nodes: ["passages", "request"], edges: ["p-r"] },
  { t: "Proposal", b: "The model answers: value 54, confidence high, quotes [8]. A passage number, not a position.", m: "what the model actually said", nodes: ["request", "reply"], edges: ["r-m"] },
  { t: "Recorded", b: "The whole exchange is in fixtures/D01.json: two rate-limited attempts, then HTTP 200.", m: "replay reads exactly this", nodes: ["reply", "fixture"], edges: ["m-f"] },
  { t: "Checked", b: "An integer, inside 0 to 120, and the number 54 is literally in passage 8, so it stays high.", m: "Rules + Confidence", nodes: ["fixture", "ext"], edges: ["f-x"] },
  { t: "Written", b: "Status extracted, confidence high, and the span: start 201, end 347, with the quote.", m: "start inclusive, end exclusive", nodes: ["ext", "out"], edges: ["x-o"] },
  { t: "Shown", b: "The desk slices by code point, highlights 201 to 347, marks it passage 8 and draws arrows to initials, age and sex.", m: "Java and React count the same way", nodes: ["out", "desk"], edges: ["o-d"] },
];
