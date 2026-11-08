// Box-and-arrow boards for IOA-01, in view units (LLArch scales them to fit).
// Built from the IOA-01 notes (projectsDocs/IOA-01.md), which come from the
// team's code-level documentation.
import type { Step } from "../ll01/diagrams.ts";

type N = { id: string; x: number; y: number; w: number; h?: number; t: string; s?: string; tone?: string; at?: number };
type E = { id: string; from?: string; to?: string; fs?: "l" | "r" | "t" | "b"; ts?: "l" | "r" | "t" | "b"; fo?: number; tof?: number; via?: [number, number][]; d?: string; l?: string; lx?: number; ly?: number; la?: "start" | "middle" | "end"; at?: number };
type Board = { view: [number, number]; nodes: N[]; edges: E[]; groups?: { x: number; y: number; w: number; h: number; t: string; nodes?: string[] }[] };

// One chat turn, end to end.
export const SYSTEM: Board = {
  view: [1200, 660],
  groups: [{ x: 470, y: 168, w: 540, h: 152, t: "middleware stack", nodes: ["idm", "sup"] }],
  nodes: [
    { id: "ui", x: 20, y: 40, w: 210, t: "Planning UI", s: "chat · approve card" },
    { id: "api", x: 290, y: 40, w: 240, t: "FastAPI", s: "POST /inventory_ops" },
    { id: "agent", x: 590, y: 40, w: 290, t: "InventoryOpsAgent", s: "execute() · astream_events" },
    { id: "cp", x: 940, y: 40, w: 240, t: "Checkpointer", s: "app Postgres · state" },
    { id: "idm", x: 500, y: 212, w: 230, t: "Identity", s: "user · scenario · instance" },
    { id: "sup", x: 760, y: 212, w: 220, t: "Supervisor", s: "one tool: task()" },
    { id: "alloc", x: 20, y: 390, w: 200, t: "Allocation" },
    { id: "mss", x: 240, y: 390, w: 230, t: "MSS / Sourcing" },
    { id: "rep", x: 490, y: 390, w: 290, t: "Replenishment / BBO", s: "your data layer" },
    { id: "so", x: 800, y: 390, w: 270, t: "Supplier Ordering" },
    { id: "redis", x: 120, y: 560, w: 290, t: "Redis", s: "param_read · param_prepared" },
    { id: "tools", x: 490, y: 560, w: 290, t: "Data-layer tools", s: "read · stage · commit" },
    { id: "uic", x: 850, y: 560, w: 330, t: "UICache Postgres", s: "Base VIEWs · <kind>_u overlay" },
  ],
  edges: [
    { id: "ui-api", from: "ui", to: "api" },
    { id: "api-agent", from: "api", to: "agent" },
    { id: "agent-cp", from: "agent", to: "cp" },
    { id: "agent-sup", from: "agent", to: "sup", fs: "b", ts: "t", fo: 135 },
    { id: "idm-sup", from: "idm", to: "sup" },
    { id: "sup-rep", from: "sup", to: "rep", fs: "b", ts: "t", l: "task(...)", lx: 700, ly: 334 },
    { id: "sup-alloc", from: "sup", to: "alloc", fs: "b", ts: "t" },
    { id: "sup-mss", from: "sup", to: "mss", fs: "b", ts: "t" },
    { id: "sup-so", from: "sup", to: "so", fs: "b", ts: "t" },
    { id: "rep-tools", from: "rep", to: "tools", fs: "b", ts: "t" },
    { id: "tools-redis", from: "tools", to: "redis" },
    { id: "tools-uic", from: "tools", to: "uic" },
    { id: "agent-ui", from: "agent", to: "ui", fs: "t", ts: "t", fo: -80, via: [[655, 12], [125, 12]], l: "SSE: delta · complete", lx: 390, ly: 6 },
  ],
};

// The eight steps of one turn (notes section 2).
export const TURN_STEPS: Step[] = [
  { all: true },
  { t: "Planner → FastAPI", b: "The planning UI posts the message to one endpoint with the user's JWT. The router injects identity and the LLM client and builds the agent.", m: "POST /inventory_ops", nodes: ["ui", "api", "agent"], edges: ["ui-api", "api-agent"] },
  { t: "Agent → supervisor", b: "execute() runs the supervisor graph with astream_events, so every token, tool call and subagent step can be streamed.", m: "astream_events(version=\"v2\")", nodes: ["agent", "sup"], edges: ["agent-sup"] },
  { t: "Identity first", b: "The first middleware seeds realm, user and scenario onto the graph state, from the request, not from the model.", m: "the model never supplies them", nodes: ["idm", "sup"], edges: ["idm-sup"] },
  { t: "Supervisor → subagent", b: "The supervisor's one real capability is task(): it hands the goal to one of four domain subagents.", m: "task(replenishment, goal)", nodes: ["sup", "rep", "alloc", "mss", "so"], edges: ["sup-rep", "sup-alloc", "sup-mss", "sup-so"] },
  { t: "Subagent → tools", b: "The Replenishment / BBO subagent calls the data-layer tools: read, stage, commit.", m: "the part you built", nodes: ["rep", "tools"], edges: ["rep-tools"] },
  { t: "Tools → the stores", b: "Reads go to the Base VIEWs of that instance's Postgres. Staged edits sit in Redis. Approved edits are UPSERTed into the overlay.", m: "Base is never written", nodes: ["tools", "redis", "uic"], edges: ["tools-redis", "tools-uic"] },
  { t: "Back to the planner", b: "Events stream back as SSE envelopes: delta, complete, error. An approval request is a complete with interrupted = true.", m: "complete · interrupted = true", nodes: ["agent", "ui"], edges: ["agent-ui"] },
  { t: "Saved for next time", b: "The conversation state is checkpointed, so the next HTTP request, including an approval, continues the same conversation.", m: "thread_id = conversation id", nodes: ["agent", "cp"], edges: ["agent-cp"] },
];

// "Set ordering cost to 12 for Milk in the West", on the same board.
export const WALK_STEPS: Step[] = [
  { all: true },
  { n: "R1", t: "Read: the question", b: "“Show me the BBO parameters for the Milk class in the West.” The supervisor dispatches to Replenishment.", m: "task(replenishment, …)", nodes: ["ui", "api", "agent", "sup", "rep"], edges: ["ui-api", "api-agent", "agent-sup", "sup-rep"] },
  { n: "R2", t: "Read: the query", b: "read_parameters joins the Base view to the item and location dimensions, filtered at class and region level.", m: "SELECT … JOIN dim_item, dim_loc", nodes: ["rep", "tools", "uic"], edges: ["rep-tools", "tools-uic"] },
  { n: "R3", t: "Read: cache + summary", b: "The raw rows go to Redis under param_read; the model gets a short markdown table.", m: "param_read:{conv}:…", nodes: ["tools", "redis", "agent", "ui"], edges: ["tools-redis", "agent-ui"] },
  { n: "S", t: "Stage", b: "“Set ordering cost to 12.” prepare_parameter_update loads param_read, resolves the column, checks the range, and saves the proposal.", m: "param_prepared:{conv}:{uuid}", nodes: ["rep", "tools", "redis"], edges: ["rep-tools", "tools-redis"] },
  { n: "A1", t: "Approve: the pause", b: "The model calls update_parameters. The HITL middleware raises an interrupt before the tool body runs; state is saved.", m: "GraphInterrupt", nodes: ["rep", "agent", "cp"], edges: ["agent-cp"] },
  { n: "A2", t: "Approve: the card", b: "The stream ends with complete, interrupted = true, and the pending action. The planner sees Approve or Reject.", m: "pending_actions", nodes: ["agent", "ui"], edges: ["agent-ui"] },
  { n: "A3", t: "Approve: the resume", b: "The planner says yes in a new request. The agent finds the pending interrupt and resumes with the decision.", m: "Command(resume={decisions})", nodes: ["ui", "api", "agent", "cp"], edges: ["ui-api", "api-agent", "agent-cp"] },
  { n: "C", t: "Commit", b: "update_parameters reads param_prepared, re-reads Base, stamps user and scenario, and UPSERTs into the overlay in one transaction.", m: "INSERT … ON CONFLICT DO UPDATE", nodes: ["tools", "redis", "uic"], edges: ["tools-redis", "tools-uic"] },
  { n: "✓", t: "Done", b: "“Updated 9 rows.” The connection cache is invalidated so the next read shows the new value.", m: "Base untouched", nodes: ["agent", "ui", "uic"], edges: ["agent-ui"] },
];

// The supervisor and its four specialists.
export const SUPER: Board = {
  view: [1100, 540],
  nodes: [
    { id: "sup", x: 400, y: 30, w: 300, t: "Supervisor LLM", s: "one tool: task()" },
    { id: "rep", x: 10, y: 220, w: 260, t: "Replenishment / BBO" },
    { id: "alloc", x: 290, y: 220, w: 250, t: "Allocation" },
    { id: "mss", x: 560, y: 220, w: 250, t: "MSS / Sourcing" },
    { id: "so", x: 830, y: 220, w: 260, t: "Supplier Ordering" },
    { id: "t1", x: 10, y: 400, w: 260, h: 120, t: "read_parameters", s: "prepare_parameter_update\nupdate_parameters (gated)" },
    { id: "t2", x: 290, y: 400, w: 250, h: 120, t: "get_profile · …", s: "allocation_create (gated)\napply_status_change (gated)" },
    { id: "t3", x: 560, y: 400, w: 250, h: 120, t: "query_sourcing · …", s: "modify_percentages (gated)\nmodify_dc_splits (gated)" },
    { id: "t4", x: 830, y: 400, w: 260, h: 120, t: "detail_summary · …", s: "approve_soq (gated)\napply_recalculate (gated)" },
  ],
  edges: [
    { id: "s-rep", from: "sup", to: "rep", fs: "b", ts: "t", l: "task(subagent, goal)", lx: 300, ly: 158 },
    { id: "s-alloc", from: "sup", to: "alloc", fs: "b", ts: "t" },
    { id: "s-mss", from: "sup", to: "mss", fs: "b", ts: "t" },
    { id: "s-so", from: "sup", to: "so", fs: "b", ts: "t" },
    { id: "rep-t", from: "rep", to: "t1", fs: "b", ts: "t" },
    { id: "alloc-t", from: "alloc", to: "t2", fs: "b", ts: "t" },
    { id: "mss-t", from: "mss", to: "t3", fs: "b", ts: "t" },
    { id: "so-t", from: "so", to: "t4", fs: "b", ts: "t" },
  ],
};

// Finding the right database for a planning instance.
export const RESOLVER: Board = {
  view: [1060, 540],
  nodes: [
    { id: "hier", x: 20, y: 40, w: 280, t: "Hierarchy cache", s: "uicache:hierarchy:{id}" },
    { id: "ctrl", x: 390, y: 40, w: 280, t: "Controller API", s: "host · schema · levels" },
    { id: "kv", x: 760, y: 40, w: 280, t: "Azure Key Vault", s: "the DB password" },
    { id: "tool", x: 20, y: 250, w: 280, t: "A tool needs the DB", s: "instance id from state" },
    { id: "cache", x: 390, y: 250, w: 280, t: "Resolved recently?", s: "short-TTL cache" },
    { id: "dict", x: 760, y: 237, w: 280, h: 110, t: "Connection dict", s: "host · port · dbname · user\npassword · sslmode · schema" },
    { id: "conn", x: 760, y: 440, w: 280, t: "psycopg connector", s: "sets search_path" },
  ],
  edges: [
    { id: "tool-cache", from: "tool", to: "cache" },
    { id: "cache-ctrl", from: "cache", to: "ctrl", fs: "t", ts: "b", l: "miss", lx: 542, ly: 196, la: "start" },
    { id: "ctrl-hier", from: "ctrl", to: "hier" },
    { id: "ctrl-kv", from: "ctrl", to: "kv" },
    { id: "kv-dict", from: "kv", to: "dict", fs: "b", ts: "t", l: "password", lx: 912, ly: 190, la: "start" },
    { id: "cache-dict", from: "cache", to: "dict", l: "hit", lx: 715, ly: 282 },
    { id: "dict-conn", from: "dict", to: "conn", fs: "b", ts: "t", l: "connect", lx: 912, ly: 400, la: "start" },
  ],
};

export const RESOLVER_STEPS: Step[] = [
  { all: true },
  { t: "Which database?", b: "A tool needs the UICache. It knows the planning instance from the graph state, never from the model.", m: "planning_instance_id", nodes: ["tool", "cache"], edges: ["tool-cache"] },
  { t: "Cache miss: ask the controller", b: "Nothing resolved recently, so the resolver asks the controller API for this instance's host and schema.", m: "resolve(planning_instance_id, headers)", nodes: ["cache", "ctrl"], edges: ["cache-ctrl"] },
  { t: "The hierarchy, cached apart", b: "The controller also returns the item and location levels. They are cached separately, under their own key.", m: "uicache:hierarchy:{id}", nodes: ["ctrl", "hier"], edges: ["ctrl-hier"] },
  { t: "The password", b: "The database password comes from Azure Key Vault, per instance, at resolve time. Never from config, never in a prompt.", m: "Key Vault", nodes: ["ctrl", "kv"], edges: ["ctrl-kv"] },
  { t: "Assemble and remember", b: "Host, port, database, user, password, SSL mode and schema become one connection dict, cached with a short TTL.", m: "short TTL", nodes: ["kv", "dict", "cache"], edges: ["kv-dict", "cache-dict"] },
  { t: "Connect into the right schema", b: "The connector sets search_path and session variables on connect, so queries use plain table names in the right schema.", m: "search_path", nodes: ["dict", "conn"], edges: ["dict-conn"] },
  { t: "The next tool call", b: "Within the TTL, the next call is a cache hit: no controller call, no Key Vault round trip.", m: "hit", nodes: ["tool", "cache", "dict", "conn"], edges: ["tool-cache", "cache-dict", "dict-conn"] },
  { t: "After a commit", b: "The connection cache is invalidated on purpose, so the next read reflects the change.", m: "invalidate", nodes: ["cache"], edges: [] },
];

// The caching checkpointer: memory during a turn, Postgres once per turn.
export const CKPT: Board = {
  view: [1180, 400],
  nodes: [
    { id: "turn", x: 20, y: 40, w: 250, t: "A turn starts", s: "thread = conversation" },
    { id: "seed", x: 330, y: 40, w: 250, t: "Seed memory", s: "first touch: load once" },
    { id: "mem", x: 660, y: 40, w: 250, t: "In-memory saver", s: "every super-step · µs" },
    { id: "pg", x: 330, y: 262, w: 250, h: 100, t: "App Postgres", s: "AsyncPostgresSaver\nnot the UICache" },
    { id: "flush", x: 660, y: 270, w: 250, t: "aflush_thread()", s: "once, at turn end" },
    { id: "evict", x: 950, y: 270, w: 210, t: "evict_thread()", s: "free the memory" },
  ],
  edges: [
    { id: "turn-seed", from: "turn", to: "seed" },
    { id: "pg-seed", from: "pg", to: "seed", fs: "t", ts: "b", l: "load", lx: 467, ly: 205, la: "start" },
    { id: "seed-mem", from: "seed", to: "mem" },
    { id: "mem-flush", from: "mem", to: "flush", fs: "b", ts: "t", l: "turn ends", lx: 797, ly: 205, la: "start" },
    { id: "flush-pg", from: "flush", to: "pg" },
    { id: "flush-evict", from: "flush", to: "evict" },
  ],
};

export const CKPT_STEPS: Step[] = [
  { all: true },
  { t: "First touch", b: "The first time a turn needs the conversation, the in-memory saver is seeded from Postgres.", m: "thread_id = conversation_id", nodes: ["turn", "seed", "pg"], edges: ["turn-seed", "pg-seed"] },
  { t: "During the turn", b: "A turn writes many checkpoints, one per super-step. Every read and write hits memory: microseconds.", m: "no database round trips", nodes: ["seed", "mem"], edges: ["seed-mem"] },
  { t: "Flush once", b: "At the end of the turn, the thread is flushed to Postgres in one go.", m: "aflush_thread()", nodes: ["mem", "flush", "pg"], edges: ["mem-flush", "flush-pg"] },
  { t: "Evict", b: "Then the thread is evicted from memory. The next turn seeds it again.", m: "evict_thread()", nodes: ["flush", "evict"], edges: ["flush-evict"] },
  { t: "A pause is a turn end", b: "A turn that ends in an interrupt is flushed too, so the approval can resume minutes later, on any worker.", m: "the pause survives", nodes: ["mem", "flush", "pg"], edges: ["mem-flush", "flush-pg"] },
];
