import type { Scene } from "../../lib/types.ts";
import { B, amap, arch, check, sec } from "./h.ts";
import { CKPT, CKPT_STEPS } from "./boards.ts";

// Part E: production plumbing: checkpointing, integrations, observability.
export const partE: Scene[] = [
  // ------------------------------------------------------------ 18
  sec("18", "Checkpointing: memory between requests", "Topic eighteen. Checkpointing. You've already seen why the interrupt needs it. Now, how it's built."),
  {
    kind: "big",
    tone: "idea",
    lead: "From scratch",
    text: "A checkpoint is a saved copy of the graph state after each super-step.",
    after: "a super-step is one tick of the graph: the ready nodes run, the reducers merge their updates, and the result is saved",
    beats: B(
      "From scratch, again.",
      { say: "A checkpoint is a saved copy of the graph state, taken after each super step.", tone: "key" },
      "And a super step is one tick of the graph. The nodes that are ready run, the reducers from topic nine merge their updates, and the result is saved. One turn can have many super steps, so it writes many checkpoints.",
    ),
  },
  amap(
    "Meeting notes",
    "📒 a meeting",
    "⚙️ the caching checkpointer",
    [
      { icon: "📂", a: "When the meeting starts, you pull out the last minutes", b: "seed the in-memory saver from Postgres, on first touch" },
      { icon: "✏️", a: "During the meeting, you scribble on a notepad", b: "every checkpoint read and write hits memory: microseconds" },
      { icon: "⌨️", a: "Afterwards, you type it into the official record, once", b: "aflush_thread(): one write to Postgres per turn" },
      { icon: "🗑", a: "Then you throw the notepad away", b: "evict_thread(): free the memory" },
      { icon: "🔥", a: "If the room catches fire mid-meeting, the scribbles are lost", b: "a mid-turn crash loses that turn; the planner retries" },
    ],
    B(
      "Here's the picture: taking notes in a meeting.",
      "When the meeting starts, you pull out the minutes from last time. The first time a turn needs the conversation, the in memory saver is seeded from Postgres.",
      "During the meeting, you scribble on a notepad, fast. Every checkpoint read and write during the turn hits memory. Microseconds, not database round trips.",
      { say: "Afterwards, you type it all into the official record, once. At the end of the turn, a flush thread call writes it to Postgres in one go.", tone: "key" },
      "Then you throw the notepad away. Evict thread frees the memory.",
      { say: "And the trade off. If the room catches fire mid meeting, the scribbles are lost. A crash mid turn loses that turn's intermediate steps. The turn fails visibly, and the planner retries it.", tone: "key" },
    ),
  ),
  arch(
    CKPT,
    CKPT_STEPS,
    B(
      "And the same thing as a board. It's a class called the caching Postgres checkpointer, wrapped around LangGraph's async Postgres saver.",
      "First touch. The in memory saver is seeded from Postgres. The thread is the conversation id.",
      "During the turn, every super step writes to memory.",
      "When the turn ends, the thread is flushed to Postgres, once.",
      "Then it's evicted from memory. The next turn seeds it again.",
      { say: "And notice: a turn that ends in an interrupt is still a turn end, so it's flushed too. That's what lets an approval resume minutes later, on any worker.", tone: "key" },
    ),
    "CachingPostgresCheckpointer",
  ),
  {
    kind: "bullets",
    title: "Three details to say precisely",
    items: [
      { icon: "🧰", text: "get_default_checkpointer()", sub: "wraps LangGraph's AsyncPostgresSaver in the CachingPostgresCheckpointer" },
      { icon: "🧵", text: "thread_id = conversation_id", sub: "also set as metadata.session_id, so traces line up with conversations" },
      { icon: "🚫", text: "Not the UICache", sub: "checkpoints live in the app's own Postgres; parameters live in each instance's UICache" },
    ],
    beats: B(
      "Three details to say precisely. Get default checkpointer builds it: LangGraph's async Postgres saver, wrapped in the caching checkpointer.",
      "The thread id is the conversation id. It's also set as the session id in the metadata, so a trace can be matched to a conversation.",
      { say: "And this is not the UI cache. Checkpoints live in the app's own Postgres. The parameters live in each instance's UI cache. Two different databases.", tone: "key" },
    ),
  },
  {
    kind: "decision",
    question: "Flush once per turn, or write every checkpoint to Postgres?",
    answer: "Once per turn: far fewer writes and lower latency. A failed turn is visible and retried.",
    left: { title: "Flush once per turn ✓", items: ["one database write per turn", "microsecond reads and writes inside it", "a mid-turn crash loses only that turn", "a pause is a turn end: flushed"] },
    right: { title: "Every checkpoint", items: ["a database round trip per super-step", "slower turns", "durable mid-turn", "rarely worth it here"] },
    footer: "the one place durability is essential, the approval pause, is covered",
    beats: B(
      "So, the trade off as a decision. Flush once per turn, or write every checkpoint straight to Postgres?",
      "Once per turn. Far fewer writes, and lower latency. A failed turn is visible, and the planner retries.",
      "Writing every checkpoint would make the turn durable mid way, at the price of a database round trip on every super step.",
      { say: "And the one place where durability really matters, the approval pause, is covered, because the pause ends a turn, and turn ends are flushed.", tone: "key" },
    ),
  },
  check({
    topic: "checkpointing",
    q: "A worker crashes halfway through a turn. What is lost?",
    options: ["The whole conversation", "That turn's intermediate steps; the turn fails visibly and is retried", "Approved writes", "Nothing at all"],
    answer: 1,
    a: "Only that turn's intermediate steps. Earlier turns were flushed; the turn fails visibly and the planner retries it.",
    aSay: "B. Only that turn's intermediate steps. Earlier turns were flushed to Postgres. The turn fails visibly, and the planner retries it.",
  }),
  check({
    topic: "checkpointing",
    q: "Why is losing a mid-turn crash acceptable, but not losing an approval pause, and how is the pause protected?",
    a: "A failed turn is visible and retried. A pause must survive minutes and a new request, so a turn that ends in an interrupt is flushed to Postgres.",
    aSay: "A failed turn is visible, and simply retried. But a pause has to survive minutes, and a brand new request, maybe on another worker. So a turn that ends in an interrupt is flushed to Postgres, like any turn end.",
  }),

  // ------------------------------------------------------------ 19
  sec("19", "Talking to the outside world", "Topic nineteen. External integrations. Three protocols, and how to choose between them."),
  amap(
    "Three ways to reach something outside",
    "🧸 the picture",
    "⚙️ the protocol",
    [
      { icon: "🔌", a: "A standard wall socket that any appliance can use", b: "MCP: tools and context for any agent · Atlas entity resolution, the context server" },
      { icon: "🤝", a: "Asking a colleague to take a whole task off your hands", b: "A2A: delegate a goal to another agent · the forecast agent" },
      { icon: "🍽", a: "Ordering from a fixed menu", b: "REST: platform APIs with fixed contracts · httpx, JWT, tenacity retries" },
    ],
    B(
      "There are three ways this agent reaches something outside itself. Here's a picture for each.",
      "M C P, the Model Context Protocol, is like a standard wall socket. Any appliance with the right plug can use it. It exposes tools and context to any agent. Here, an M C P server called Atlas does entity resolution, turning names into ids, and another serves context.",
      { say: "A to A, agent to agent, is like asking a colleague to take a whole task off your hands. You delegate a goal, not a function call. Here, that's the forecast agent.", tone: "key" },
      "And REST is ordering from a fixed menu: ordinary platform A P I s with fixed contracts, called with an async H T T P client, a bearer token, and automatic retries.",
    ),
  ),
  {
    kind: "compare",
    title: "Everything it connects to",
    cols: [
      { title: "Data", icon: "🗄", tone: "green", items: ["UICache Postgres: per-instance creds", "Redis: namespaced keys + TTL", "Snowflake: analytics"] },
      { title: "Secrets & services", icon: "🔐", tone: "amber", items: ["Key Vault: DefaultAzureCredential + SecretClient", "upstream REST: httpx, JWT, tenacity", "LLMs: Azure OpenAI · OpenAI · Anthropic"] },
      { title: "Agents & tools", icon: "🤝", tone: "purple", items: ["Atlas MCP: names → ids", "Context MCP: context", "Forecast agent: A2A"] },
    ],
    footer: "all configured through typed pydantic-settings models",
    beats: B(
      "For data: the instance's Postgres with per instance credentials, Redis with namespaced keys and a time to live, and Snowflake for analytics.",
      "For secrets and services: Key Vault, through Azure's default credential and a secret client. Upstream REST services, with an async client, a bearer J W T, and tenacity for retries. And the three LLM providers.",
      "For agents and tools: Atlas over M C P, a context server over M C P, and the forecast agent over A to A.",
      "And all of it is configured through typed pydantic settings models, one per area.",
    ),
  },
  check({
    topic: "integrations",
    q: "How is the forecast agent called, and why that protocol?",
    options: ["MCP", "A2A", "REST", "Direct SQL"],
    answer: 1,
    a: "A2A. You delegate a goal to another agent, not a function call. MCP would be for exposing tools and context; REST for fixed-contract services.",
    aSay: "B. A to A. You're delegating a goal to another agent, not calling a function. M C P is for exposing tools and context, and REST is for ordinary services with fixed contracts.",
  }),

  // ------------------------------------------------------------ 20
  sec("20", "Observability", "Topic twenty. Observability. Short, but it's what you'd reach for first when something goes wrong."),
  {
    kind: "bullets",
    title: "A flight recorder for every turn",
    items: [
      { icon: "🛰", text: "Tracing", sub: "OpenTelemetry + OTLP-HTTP · OpenInference for LangChain, OpenAI agents and MCP · Langfuse-shaped · one agent-run trace per run" },
      { icon: "🪵", text: "Logging", sub: "structlog everywhere: structured key/value logs" },
      { icon: "📈", text: "APM", sub: "an Elastic APM transaction per request; a no-op when APM is absent" },
    ],
    beats: B(
      "Think of a flight recorder. Tracing first. The OpenTelemetry S D K exports over O T L P H T T P. OpenInference instruments LangChain, Open A I agents and M C P automatically. The traces are shaped for Langfuse, and each run is wrapped in one agent run trace.",
      "Logging: struct log everywhere, so logs are key value pairs, not free text.",
      "And A P M: an Elastic transaction wrapped around each request, which simply does nothing when A P M isn't configured.",
    ),
  },
  {
    kind: "sayit",
    q: "A planner says “the agent did something weird”. What do you look at first?",
    lines: [
      "The trace for that conversation, found by its session id.",
      "Which subagent was dispatched, and which tools were called with which arguments.",
      "What the model actually saw: the markdown summary.",
      "Whether an interrupt fired, and how it was resumed.",
    ],
    beats: B(
      { say: "A planner says: the agent did something weird. What do you look at first?", tone: "ask" },
      "The trace for that conversation, found by its session id, which is the conversation id.",
      "Which subagent was dispatched, and which tools were called, with which arguments.",
      "What the model actually saw. The markdown summary, not the raw rows.",
      { say: "And whether an interrupt fired, and how it was resumed.", tone: "key" },
    ),
  },
  check({
    topic: "observability",
    q: "How do you find the trace for one planner's conversation?",
    a: "By the session id: the conversation id is the thread_id and is also set as metadata.session_id, so traces correlate with conversations.",
    aSay: "By the session id. The conversation id is the thread id, and it's also set as the session id in the metadata, so every trace lines up with its conversation.",
  }),
];
