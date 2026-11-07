// Box-and-arrow boards for LL-01, in view units (the scene scales them to fit).
// SITE is the diagram on the LogLens site itself (Architecture.jsx), node for
// node and path for path, so the video and the app show the same picture.

type N = { id: string; x: number; y: number; w: number; h?: number; t: string; s?: string; tone?: string; at?: number };
type E = { id: string; from?: string; to?: string; fs?: "l" | "r" | "t" | "b"; ts?: "l" | "r" | "t" | "b"; fo?: number; tof?: number; via?: [number, number][]; d?: string; l?: string; lx?: number; ly?: number; la?: "start" | "middle" | "end"; at?: number };
export type Step = { n?: string; t?: string; b?: string; m?: string; nodes?: string[]; edges?: string[]; all?: boolean };
type Board = { view: [number, number]; nodes: N[]; edges: E[]; groups?: { x: number; y: number; w: number; h: number; t: string; nodes?: string[] }[] };

export const SITE: Board = {
  view: [1060, 540],
  groups: [{ x: 270, y: 140, w: 520, h: 180, t: "Application server", nodes: ["api", "workers"] }],
  nodes: [
    { id: "client", x: 30, y: 200, w: 150, h: 80, t: "Client" },
    { id: "blob", x: 30, y: 30, w: 150, h: 80, t: "Blob Store", s: "holds the log file" },
    { id: "api", x: 315, y: 190, w: 180, h: 80, t: "API", s: "handles requests" },
    { id: "workers", x: 575, y: 190, w: 180, h: 80, t: "Workers", s: "split · parse · detect" },
    { id: "kafka", x: 445, y: 400, w: 170, h: 80, t: "Kafka", s: "job queue" },
    { id: "langgraph", x: 700, y: 400, w: 150, h: 80, t: "LangGraph", s: "root cause + Q&A" },
    { id: "llm", x: 890, y: 30, w: 150, h: 80, t: "LLM", s: "Groq · Gemini" },
    { id: "pg", x: 890, y: 200, w: 150, h: 80, t: "Postgres", s: "data + vectors" },
    { id: "redis", x: 890, y: 400, w: 150, h: 80, t: "Redis", s: "chat history" },
  ],
  edges: [
    { id: "client-blob", d: "M105 200 L105 110", l: "upload", lx: 117, ly: 160, la: "start" },
    { id: "client-api", d: "M180 240 L315 240" },
    { id: "api-kafka", d: "M390 290 L390 440 L445 440", l: "queue the job", lx: 398, ly: 372, la: "start" },
    { id: "kafka-workers", d: "M615 440 L665 440 L665 290", l: "hand out pieces", lx: 675, ly: 372, la: "start" },
    { id: "workers-blob", d: "M665 190 L665 70 L180 70", l: "read file slices", lx: 420, ly: 60, la: "middle" },
    { id: "workers-llm", d: "M755 205 L830 205 L830 70 L890 70", l: "flagged minutes", lx: 822, ly: 125, la: "end" },
    { id: "workers-pg", d: "M755 255 L890 255", l: "save results", lx: 822, ly: 247, la: "middle" },
    { id: "api-langgraph", d: "M335 290 L335 510 L775 510 L775 480", l: "analyze · ask", lx: 555, ly: 503, la: "middle" },
    { id: "langgraph-pg", d: "M850 420 L870 420 L870 300 L965 300 L965 280", l: "hybrid SQL", lx: 880, ly: 360, la: "start" },
    { id: "langgraph-redis", d: "M850 440 L890 440" },
  ],
};

// The seven steps exactly as the site tells them (utils/pipeline.js), with the
// 1 GB demo run's numbers.
export const SITE_STEPS: Step[] = [
  { all: true },
  { t: "Upload", b: "The browser sends the file straight to the blob store with a short-lived upload link. The API checks it arrived and starts the analysis.", m: "1.0 GB uploaded directly to storage", nodes: ["client", "blob", "api"], edges: ["client-blob", "client-api"] },
  { t: "Split", b: "A splitter reads the file once and cuts it into pieces of about 5 MB, always at a minute boundary. A small pointer to each piece goes on Kafka.", m: "205 pieces", nodes: ["api", "kafka", "workers", "blob"], edges: ["api-kafka", "kafka-workers", "workers-blob"] },
  { t: "Parse", b: "Workers take the pieces in parallel and read only their slice. Eight parsers count errors, 5xx, latency and SQL failures per minute; each piece is one transaction.", m: "3,019 windows, 65,456 metric rows", nodes: ["workers", "blob", "pg", "kafka"], edges: ["kafka-workers", "workers-blob", "workers-pg"] },
  { t: "Detect", b: "Each minute is compared with the rest of the same log: median-based baselines, rare error patterns, and hard rules like out-of-memory or deadlocks.", m: "101 of 591 minutes flagged", nodes: ["workers", "pg"], edges: ["workers-pg"] },
  { t: "Explain", b: "Only the flagged minutes go to the LLM. Every API key has its own Kafka partition and worker, so each key runs at its full rate limit.", m: "42,205 LLM calls, out of 220,657 possible", nodes: ["workers", "llm", "kafka"], edges: ["kafka-workers", "workers-llm"] },
  { t: "Root cause", b: "A LangGraph pipeline groups related findings into incidents and ranks likely causes. A judge checks each story against the evidence it cites.", m: "6 incidents with ranked causes", nodes: ["api", "langgraph", "pg"], edges: ["api-langgraph", "langgraph-pg"] },
  { t: "Ask", b: "A LangGraph decision graph reads the chat so far from Redis, resolves follow-ups, and picks a route: hybrid search, the log profile, or general knowledge.", m: "answers cite exact log lines", nodes: ["client", "api", "langgraph", "pg", "redis"], edges: ["client-api", "api-langgraph", "langgraph-pg", "langgraph-redis"] },
];

// Ingest, box by box: which component calls which, from upload to enrich items.
export const INGEST: Board = {
  view: [1500, 740],
  nodes: [
    { id: "browser", x: 40, y: 40, w: 220, t: "Browser", s: "React SPA" },
    { id: "api", x: 400, y: 40, w: 240, t: "API", s: "DocumentController" },
    { id: "kreq", x: 780, y: 40, w: 260, t: "requests topic", s: "log.ingest.requests · 6" },
    { id: "splitter", x: 1180, y: 40, w: 280, t: "Splitter", s: "1 thread · streams once" },
    { id: "blob", x: 40, y: 330, w: 220, t: "Blob store", s: "MinIO · Backblaze B2" },
    { id: "workers", x: 780, y: 330, w: 260, t: "Part workers", s: "3 local · 2 in prod" },
    { id: "kparts", x: 1180, y: 330, w: 280, t: "parts topic", s: "log.ingest.parts · 6" },
    { id: "pg", x: 400, y: 590, w: 640, t: "Postgres 16 + pgvector", s: "documents · ingest_parts · chunks · log_metrics" },
    { id: "fin", x: 1180, y: 590, w: 280, t: "Finalizer", s: "atomic claim · stats" },
    { id: "kenr", x: 40, y: 590, w: 220, t: "enrich topic", s: "flagged windows" },
  ],
  edges: [
    { id: "pc", from: "browser", to: "api", l: "presign · confirm", lx: 330, ly: 28 },
    { id: "up", from: "browser", to: "blob", fs: "b", ts: "t", fo: -40, tof: -40, l: "PUT the bytes", lx: 122, ly: 230, la: "start" },
    { id: "ptr", from: "api", to: "kreq", l: "pointer", lx: 710, ly: 28 },
    { id: "k1", from: "kreq", to: "splitter" },
    { id: "sread", from: "splitter", to: "blob", fs: "b", ts: "t", fo: -70, tof: 50, via: [[1250, 250], [200, 250]], l: "stream the object once", lx: 725, ly: 240 },
    { id: "sparts", from: "splitter", to: "kparts", fs: "b", ts: "t", l: "N part pointers", lx: 1332, ly: 230, la: "start" },
    { id: "kw", from: "kparts", to: "workers", l: "byte ranges", lx: 1110, ly: 318 },
    { id: "wread", from: "workers", to: "blob", l: "ranged GET", lx: 520, ly: 362 },
    { id: "wtx", from: "workers", to: "pg", fs: "b", ts: "t", fo: -40, tof: 150, l: "one tx: marker + data", lx: 882, ly: 520, la: "start" },
    { id: "wfin", from: "workers", to: "fin", fs: "b", ts: "t", fo: 80, via: [[990, 500], [1320, 500]], l: "tryFinalize", lx: 1155, ly: 490 },
    { id: "fpg", from: "fin", to: "pg", l: "claim · flag", lx: 1110, ly: 578 },
    { id: "fen", from: "fin", to: "kenr", fs: "b", ts: "b", via: [[1320, 715], [150, 715]], l: "enrich items", lx: 725, ly: 706 },
  ],
};

// Enrichment: one Kafka partition per chat API key, a retry topic, a DLQ.
export const LANES: Board = {
  view: [1500, 720],
  nodes: [
    { id: "fin", x: 40, y: 40, w: 250, t: "Finalizer", s: "1 item per flagged window" },
    ...[0, 1, 2, 3].map((i) => ({ id: `p${i}`, x: 400, y: 40 + i * 130, w: 240, t: `partition ${i}`, s: `lane for key ${i}` })),
    ...[0, 1, 2, 3].map((i) => ({ id: `t${i}`, x: 760, y: 40 + i * 130, w: 260, t: `lane thread ${i}`, s: `owns key ${i} only` })),
    { id: "groq", x: 1160, y: 40, w: 300, h: 170, t: "Groq", s: "llama-3.1-8b-instant\n30 RPM · 6K TPM per key" },
    { id: "pg", x: 1160, y: 260, w: 300, h: 120, t: "Postgres", s: "one tx: marker\n+ findings + embeddings" },
    { id: "rthread", x: 400, y: 600, w: 240, t: "retry thread", s: "only it waits" },
    { id: "retry", x: 760, y: 600, w: 260, t: "retry.60s topic", s: "attempt + 1 · notBefore" },
    { id: "dlq", x: 1160, y: 600, w: 300, t: "enrich DLQ", s: "non-retryable · counted done" },
  ],
  edges: [
    ...[0, 1, 2, 3].map((i) => ({ id: `fp${i}`, from: "fin", to: `p${i}`, fs: "r" as const, ts: "l" as const, ...(i === 0 ? { l: "floorMod(hash, keys)", lx: 345, ly: 30 } : {}) })),
    ...[0, 1, 2, 3].map((i) => ({ id: `pt${i}`, from: `p${i}`, to: `t${i}` })),
    ...[0, 1, 2, 3].map((i) => ({ id: `tg${i}`, from: `t${i}`, to: "groq", fs: "r" as const, ts: "l" as const, tof: -60 + i * 40 })),
    { id: "tpg", from: "t2", to: "pg", fs: "r", ts: "l", fo: 20, tof: 20, l: "commit", lx: 1100, ly: 380 },
    { id: "t429", from: "t3", to: "retry", fs: "b", ts: "t", l: "429", lx: 902, ly: 565, la: "start" },
    { id: "rr", from: "retry", to: "rthread", l: "after 60 s", lx: 700, ly: 632 },
    { id: "rp", from: "rthread", to: "p3", fs: "t", ts: "b", l: "re-publish", lx: 532, ly: 565, la: "start" },
    { id: "tdlq", from: "t3", to: "dlq", fs: "r", ts: "t", fo: 20, via: [[1310, 512]], l: "other error", lx: 1300, ly: 560, la: "end" },
  ],
};

// Graph 1 (rag-orchestrator/app/graph_analyze.py): findings to a judged report.
export const GRAPH1: Board = {
  view: [1500, 470],
  nodes: [
    { id: "load", x: 40, y: 110, w: 210, t: "load", s: "findings + metrics" },
    { id: "cluster", x: 310, y: 110, w: 230, t: "cluster", s: "code · 300 s, same category" },
    { id: "correlate", x: 600, y: 110, w: 230, t: "correlate", s: "LLM: story + cause", tone: "teal" },
    { id: "ground", x: 890, y: 110, w: 240, t: "ground_check", s: "LLM judge", tone: "teal" },
    { id: "write", x: 1190, y: 110, w: 270, t: "write_incidents", s: "grounded + reason stored" },
    { id: "compose", x: 1190, y: 350, w: 270, t: "compose_report", s: "exact metrics table" },
    { id: "save", x: 890, y: 350, w: 240, t: "save_report", s: "status DONE" },
  ],
  edges: [
    { id: "a", from: "load", to: "cluster" },
    { id: "b", from: "cluster", to: "correlate" },
    { id: "c", from: "correlate", to: "ground" },
    { id: "no", from: "ground", to: "correlate", fs: "b", ts: "b", fo: -40, tof: 40, via: [[970, 270], [755, 270]], l: "not grounded, attempts left", lx: 862, ly: 296 },
    { id: "next", from: "ground", to: "correlate", fs: "t", ts: "t", fo: -40, tof: 40, via: [[970, 50], [755, 50]], l: "accepted: next cluster", lx: 862, ly: 38 },
    { id: "done", from: "ground", to: "write", l: "all done", lx: 1160, ly: 98 },
    { id: "e", from: "write", to: "compose", fs: "b", ts: "t" },
    { id: "f", from: "compose", to: "save" },
    { id: "skip", from: "cluster", to: "compose", fs: "b", ts: "l", via: [[425, 455], [1150, 455], [1150, 392]], l: "no findings", lx: 640, ly: 445 },
  ],
};

// Graph 2 (graph_drilldown.py): corrective RAG with a rewrite budget.
export const GRAPH2: Board = {
  view: [1300, 440],
  nodes: [
    { id: "q", x: 30, y: 200, w: 190, t: "question" },
    { id: "retrieve", x: 300, y: 200, w: 250, t: "retrieve", s: "embed · hybrid top 30" },
    { id: "grade", x: 650, y: 200, w: 240, t: "grade", s: "LLM: relevant ids", tone: "teal" },
    { id: "rewrite", x: 650, y: 20, w: 240, t: "rewrite", s: "LLM · at most 2", tone: "teal" },
    { id: "generate", x: 1000, y: 200, w: 270, t: "generate", s: "JSON: answer + citations", tone: "teal" },
    { id: "filter", x: 1000, y: 340, w: 270, h: 80, t: "filter citations", s: "only retrieved ids" },
  ],
  edges: [
    { id: "a", from: "q", to: "retrieve" },
    { id: "b", from: "retrieve", to: "grade" },
    { id: "ok", from: "grade", to: "generate", l: "relevant, or budget spent", lx: 945, ly: 300 },
    { id: "weak", from: "grade", to: "rewrite", fs: "t", ts: "b", l: "none relevant", lx: 782, ly: 165, la: "start" },
    { id: "again", from: "rewrite", to: "retrieve", fs: "l", ts: "t", l: "search again", lx: 440, ly: 50 },
    { id: "c", from: "generate", to: "filter", fs: "b", ts: "t" },
  ],
};

// The live demo's Ask (loglens-frontend/api/_lib/graph.js), a LangGraph.js graph.
export const ASK: Board = {
  view: [1500, 850],
  nodes: [
    { id: "mem", x: 40, y: 40, w: 250, t: "load_memory", s: "Redis: last 4 turns" },
    { id: "und", x: 40, y: 330, w: 250, t: "understand", s: "route · follow-up · language", tone: "teal" },
    { id: "chat", x: 420, y: 40, w: 230, t: "chat", s: "small talk" },
    { id: "general", x: 420, y: 170, w: 230, t: "general", s: "not about this log" },
    { id: "web", x: 420, y: 300, w: 230, t: "web", s: "Groq browser search" },
    { id: "system", x: 420, y: 430, w: 230, t: "system", s: "log-profile.json" },
    { id: "retrieve", x: 420, y: 600, w: 230, t: "retrieve", s: "pgvector + FTS, RRF" },
    { id: "nearest", x: 780, y: 430, w: 240, t: "nearest", s: "closest facts it has" },
    { id: "grade", x: 780, y: 600, w: 240, t: "grade", s: "lexical hit or sim ≥ 0.55" },
    { id: "rewrite", x: 780, y: 750, w: 240, h: 80, t: "rewrite", s: "keywords · once", tone: "teal" },
    { id: "generate", x: 1130, y: 600, w: 300, t: "generate + verify", s: "drop citations not in context", tone: "teal" },
    { id: "save", x: 1130, y: 40, w: 300, t: "save_memory", s: "Redis list · 20 turns · 24 h" },
  ],
  edges: [
    { id: "m", from: "mem", to: "und", fs: "b", ts: "t" },
    ...["chat", "general", "web", "system", "retrieve"].map((r, i) => ({ id: `r-${r}`, from: "und", to: r, fs: "r" as const, ts: "l" as const, ...(i === 2 ? { l: "route", lx: 355, ly: 330 } : {}) })),
    { id: "wf", from: "web", to: "general", fs: "t", ts: "b", l: "search failed", lx: 547, ly: 285, la: "start" },
    { id: "sn", from: "system", to: "nearest", l: "not covered", lx: 715, ly: 420 },
    { id: "rg", from: "retrieve", to: "grade" },
    { id: "gw", from: "grade", to: "rewrite", fs: "b", ts: "t", l: "weak", lx: 912, ly: 728, la: "start" },
    { id: "wr", from: "rewrite", to: "retrieve", fs: "l", ts: "b", l: "search again", lx: 560, ly: 812 },
    { id: "gg", from: "grade", to: "generate", l: "strong", lx: 1075, ly: 632 },
    { id: "abst", from: "generate", to: "system", fs: "t", ts: "r", fo: -60, via: [[1220, 560], [720, 560], [720, 482]], tof: 10, l: "no supported point", lx: 980, ly: 550 },
    { id: "s1", from: "chat", to: "save" },
    { id: "s2", from: "general", to: "save", fs: "r", ts: "l", tof: 20 },
    { id: "s3", from: "nearest", to: "save", fs: "r", ts: "b", tof: -60 },
    { id: "s4", from: "generate", to: "save", fs: "r", ts: "r", via: [[1475, 642], [1475, 82]] },
  ],
};

// Where each piece runs in production, and which one calls which.
export const DEPLOY: Board = {
  view: [1500, 720],
  nodes: [
    { id: "user", x: 40, y: 333, w: 200, t: "Browser" },
    { id: "vercel", x: 320, y: 320, w: 260, h: 110, t: "Vercel", s: "React SPA\n/api/ask · /api/log" },
    { id: "render", x: 700, y: 320, w: 290, h: 110, t: "Render: loglens-api", s: "Spring Boot in Docker\nAPI + every Kafka worker" },
    { id: "b2", x: 700, y: 60, w: 290, t: "Backblaze B2", s: "S3 API · staging only" },
    { id: "red", x: 700, y: 600, w: 290, t: "Redpanda Cloud", s: "Kafka · SASL_SSL SCRAM" },
    { id: "orch", x: 1110, y: 320, w: 350, h: 110, t: "Render: orchestrator", s: "FastAPI + LangGraph\nGraph 1 · Graph 2" },
    { id: "llm", x: 1110, y: 60, w: 350, t: "Groq · Gemini", s: "chat · embeddings" },
    { id: "rpg", x: 1110, y: 600, w: 350, t: "Postgres 16 + pgvector", s: "single source of truth" },
    { id: "neon", x: 300, y: 600, w: 300, t: "Neon + Redis", s: "live demo: search · memory" },
  ],
  edges: [
    { id: "uv", from: "user", to: "vercel", fs: "r", ts: "l", tof: 0 },
    { id: "ub", from: "user", to: "b2", fs: "t", ts: "l", via: [[140, 102]], l: "presigned PUT", lx: 152, ly: 200, la: "start" },
    { id: "vr", from: "vercel", to: "render", l: "REST + SSE", lx: 640, ly: 308 },
    { id: "rb", from: "render", to: "b2", fs: "t", ts: "b", l: "ranged GET", lx: 857, ly: 240, la: "start" },
    { id: "rk", from: "render", to: "red", fs: "b", ts: "t", l: "pointers", lx: 857, ly: 520, la: "start" },
    { id: "ro", from: "render", to: "orch", l: "graphs", lx: 1050, ly: 365 },
    { id: "rl", from: "render", to: "llm", fs: "r", ts: "l", fo: -40, via: [[1045, 335], [1045, 102]] },
    { id: "rp", from: "render", to: "rpg", fs: "r", ts: "l", fo: 40, via: [[1065, 415], [1065, 642]], l: "JDBC", lx: 1075, ly: 540, la: "start" },
    { id: "ol", from: "orch", to: "llm", fs: "t", ts: "b" },
    { id: "op", from: "orch", to: "rpg", fs: "b", ts: "t", fo: 60, tof: 60, l: "hybrid SQL", lx: 1357, ly: 520, la: "start" },
    { id: "vn", from: "vercel", to: "neon", fs: "b", ts: "t", l: "Ask: retrieve + memory", lx: 462, ly: 520, la: "start" },
    { id: "vl", from: "vercel", to: "llm", fs: "t", ts: "t", fo: 60, via: [[510, 25], [1285, 25]], l: "Ask: gpt-oss-120b", lx: 900, ly: 15 },
  ],
};

// The same pipeline for 1,000 tenants and 1 TB a day.
export const SCALE: Board = {
  view: [1500, 620],
  nodes: [
    { id: "ten", x: 40, y: 250, w: 220, t: "Tenants", s: "1 GB / day each" },
    { id: "api", x: 340, y: 250, w: 240, t: "API fleet", s: "presign · confirm" },
    { id: "s3", x: 340, y: 40, w: 240, t: "Object store", s: "11.6 MB/s in" },
    { id: "k", x: 660, y: 250, w: 260, t: "Kafka", s: "64+ partitions · quotas" },
    { id: "iw", x: 1000, y: 40, w: 240, t: "Ingest workers", s: "autoscale on lag · ≥ 6" },
    { id: "ew", x: 1000, y: 460, w: 240, t: "Enrich workers", s: "per-key lanes" },
    { id: "llm", x: 1280, y: 460, w: 200, t: "LLM pool", s: "cheap + strong" },
    { id: "pg", x: 1000, y: 250, w: 240, t: "Postgres", s: "partitions: tenant, day" },
    { id: "qs", x: 1280, y: 250, w: 200, t: "Query service", s: "SQL router + RAG" },
    { id: "obx", x: 340, y: 460, w: 240, t: "Outbox relay", s: "no lost events" },
  ],
  edges: [
    { id: "a", from: "ten", to: "api" },
    { id: "b", from: "ten", to: "s3", fs: "t", ts: "l", via: [[150, 82]] },
    { id: "c", from: "api", to: "obx", fs: "b", ts: "t", l: "row + event, one tx", lx: 472, ly: 400, la: "start" },
    { id: "d", from: "obx", to: "k", fs: "r", ts: "b" },
    { id: "e", from: "k", to: "iw", fs: "t", ts: "l", tof: 20 },
    { id: "f", from: "iw", to: "s3", fs: "l", ts: "r", fo: -20, tof: -20, l: "ranged GET", lx: 790, ly: 52 },
    { id: "g", from: "iw", to: "pg", fs: "b", ts: "t" },
    { id: "h", from: "k", to: "ew", fs: "b", ts: "l", fo: 40 },
    { id: "i", from: "ew", to: "llm" },
    { id: "j", from: "ew", to: "pg", fs: "t", ts: "b" },
    { id: "l", from: "qs", to: "pg", fs: "l", ts: "r" },
  ],
};

// One status column drives the whole UI; the browser hears each change over SSE.
export const STATUS: Board = {
  view: [1500, 400],
  nodes: [
    ...["CREATED", "CHUNKING", "PARSING", "ENRICHING", "CORRELATING", "REPORTING", "DONE"].map((t, i) => ({ id: t, x: 20 + i * 210, y: 60, w: 190, t, tone: t === "DONE" ? "green" : undefined })),
    { id: "FAILED", x: 650, y: 290, w: 220, t: "FAILED", s: "with a reason", tone: "red" },
  ],
  edges: [
    ...["CREATED", "CHUNKING", "PARSING", "ENRICHING", "CORRELATING", "REPORTING"].map((t, i) => ({ id: `${t}>`, from: t, to: ["CHUNKING", "PARSING", "ENRICHING", "CORRELATING", "REPORTING", "DONE"][i] })),
    ...["CHUNKING", "PARSING", "ENRICHING", "CORRELATING", "REPORTING"].map((t) => ({ id: `${t}!`, from: t, to: "FAILED", fs: "b" as const, ts: "t" as const })),
  ],
};

// What happens to one enrichment item, and to one poisoned ingest record.
export const ERRORS: Board = {
  view: [1500, 560],
  nodes: [
    { id: "item", x: 40, y: 60, w: 230, t: "Kafka record", s: "part or enrich item" },
    { id: "cons", x: 360, y: 60, w: 250, t: "Consumer", s: "manual ack after tx" },
    { id: "ok", x: 720, y: 60, w: 300, t: "Commit tx + marker", s: "then ack the offset", tone: "green" },
    { id: "retry", x: 720, y: 240, w: 300, t: "retry.60s", s: "429 only · ~24 h of tries" },
    { id: "eh", x: 360, y: 420, w: 250, t: "Error handler", s: "3 attempts · 2 s apart" },
    { id: "fail", x: 720, y: 420, w: 300, t: "Session FAILED", s: "NUL-safe reason", tone: "red" },
    { id: "dlq", x: 1130, y: 420, w: 330, t: "DLQ", s: "headers capped · partition moves on" },
  ],
  edges: [
    { id: "a", from: "item", to: "cons" },
    { id: "b", from: "cons", to: "ok", l: "ok", lx: 665, ly: 90 },
    { id: "c", from: "cons", to: "retry", fs: "b", ts: "l", fo: 60, l: "429", lx: 680, ly: 270 },
    { id: "d", from: "cons", to: "eh", fs: "b", ts: "t", fo: -40, tof: -40, l: "throws", lx: 457, ly: 330, la: "end" },
    { id: "e", from: "eh", to: "fail" },
    { id: "f", from: "fail", to: "dlq" },
    { id: "g", from: "retry", to: "item", fs: "r", ts: "t", via: [[1080, 282], [1080, 20], [155, 20]], l: "re-published when due", lx: 620, ly: 12 },
  ],
};
