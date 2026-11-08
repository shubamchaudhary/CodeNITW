import type { Scene } from "../../lib/types.ts";
import { B, check, sec } from "./h.ts";

// Part F: the interview: trade-offs, failure modes, follow-ups, honest gaps,
// numbers, stories, and the close.
const Q = (q: string, a: string) => [
  { say: q, tone: "ask" as const, hold: 4 },
  { say: a },
];

export const partF: Scene[] = [
  // ------------------------------------------------------------ 21
  sec("21", "Every decision has a cost", "Topic twenty one. Design decisions. You've heard the why for each one. In an interview, the follow up is always: and what did it cost you? Answer each before I do."),
  {
    kind: "drill",
    items: [
      { q: "Supervisor + 4 subagents: the cost?", a: "An extra LLM hop per turn, partly saved by SkipSynthesis." },
      { q: "create_agent + middleware instead of a hand-built graph: the cost?", a: "Ordering subtleties, like excluding task() from tool retry." },
      { q: "Tools with schemas instead of text-to-SQL: the cost?", a: "A new kind of question may need a tool change." },
      { q: "Hierarchy-aware SQL: the cost?", a: "Per-instance level → column maps, resolved and cached." },
      { q: "Staging in Redis: the cost?", a: "If Redis evicts the key before approval, the planner re-prepares." },
      { q: "HITL as an interrupt: the cost?", a: "It needs a checkpointer and resume handling." },
      { q: "Base + Overlay: the cost?", a: "Reads must layer the overlay; overlays need publishing or cleanup." },
      { q: "Per-instance credentials: the cost?", a: "A resolver and a cache." },
      { q: "Caching checkpointer: the cost?", a: "A crash mid-turn loses that turn." },
      { q: "SSE: the cost?", a: "Each user message is a new request." },
    ],
    beats: [
      ...Q("Supervisor plus four subagents. What did it cost?", "An extra LLM hop on every turn, partly won back by skip synthesis."),
      ...Q("Create agent plus middleware, instead of a hand built graph. The cost?", "Ordering subtleties. Like having to exclude task from tool retry."),
      ...Q("Tools with schemas, instead of text to SQL. The cost?", "A genuinely new kind of question may need a tool change."),
      ...Q("Hierarchy aware SQL. The cost?", "Per instance level to column maps, which have to be resolved and cached."),
      ...Q("Staging in Redis. The cost?", "If Redis evicts the key before approval, the planner has to re-prepare."),
      ...Q("Approval as an interrupt. The cost?", "It needs a checkpointer, and resume handling."),
      ...Q("Base plus Overlay. The cost?", "Reads must layer the overlay over Base, and overlays eventually need publishing or cleanup."),
      ...Q("Per instance credentials. The cost?", "A resolver, and a cache."),
      ...Q("The caching checkpointer. The cost?", "A crash in the middle of a turn loses that turn."),
      ...Q("S S E. The cost?", "Each user message is a new HTTP request. Which, here, is exactly what we want."),
    ],
  },

  // ------------------------------------------------------------ 22
  sec("22", "Failure modes: what happens when…", "Topic twenty two. Failure modes. Each one is a question. Say what happens, then hear mine. If you've followed the checks so far, you know every answer already."),
  {
    kind: "drill",
    items: [
      { q: "Azure returns 429 Too Many Requests.", a: "Model retry, up to 2, then the optional fallback model. Bounded, then fail visibly." },
      { q: "The model starts looping.", a: "The 40-model-call or 8-dispatch limit stops the run. Limits live in code." },
      { q: "A conversation gets very long.", a: "Summarise at 50 messages / 40k tokens; clear old tool payloads at 80k." },
      { q: "prepare is called with no prior read.", a: "No param_read entry: the tool refuses." },
      { q: "The Redis proposal expired before approval.", a: "The commit finds no param_prepared payload, so nothing is written. Re-read and re-prepare." },
      { q: "A database error, halfway through the commit.", a: "The transaction rolls back. All or nothing." },
      { q: "The planner rejects.", a: "No write. The proposal expires. Base and Overlay untouched." },
    ],
    beats: [
      ...Q("Azure returns four twenty nine, too many requests.", "Model retry, up to two times, then the optional fallback model. Bounded retries, then fail visibly."),
      ...Q("The model starts looping.", "The forty model call limit, or the eight dispatch limit, stops the run. The limits live in code."),
      ...Q("A conversation gets very long.", "Summarise at fifty messages or forty thousand tokens. And clear old tool payloads at eighty thousand."),
      ...Q("Prepare is called, with no read before it.", "There's no param read entry, so the tool refuses."),
      ...Q("The Redis proposal expired before the planner approved.", "The commit finds no param prepared payload, so nothing is written. The planner re-reads and re-prepares. That one is inferred from the design, so say it that way."),
      ...Q("A database error, halfway through the commit.", "The transaction rolls back. All or nothing."),
      ...Q("The planner rejects.", "No write. The proposal expires. Base and Overlay are untouched."),
    ],
  },
  {
    kind: "drill",
    items: [
      { q: "A write would touch over 5,000 rows.", a: "Refused by MAX_WRITE_ROWS. Narrow the scope." },
      { q: "An edit to item or location, or to a non-whitelisted column.", a: "Refused. The model can't change keys or arbitrary columns." },
      { q: "Two planners edit the same item.", a: "Different (user, scenario) keys: separate overlay rows." },
      { q: "The same planner's approval is processed twice.", a: "The UPSERT updates the same row. Idempotent." },
      { q: "Database credentials rotate.", a: "Short TTL on the resolved connection; invalidated after commits. Self-heals." },
      { q: "A prompt injection: “write this to scenario X”.", a: "Scenario and user come from state, set from the request. The model never supplies them." },
    ],
    beats: [
      ...Q("A write would touch more than five thousand rows.", "Refused, by max write rows. The planner narrows the scope."),
      ...Q("An edit to the item or location, or to a column that isn't whitelisted.", "Refused. The model cannot change keys, or arbitrary columns."),
      ...Q("Two planners edit the same item at the same location.", "Different user and scenario keys, so separate overlay rows. No interference."),
      ...Q("The same planner's approval is processed twice.", "The upsert updates the same row. Idempotent."),
      ...Q("The database credentials rotate.", "The resolved connection has a short time to live, and is invalidated after commits. It heals itself."),
      ...Q("A prompt injection says: write this to scenario X.", "The scenario and user come from the state, set from the authenticated request. The model never supplies them."),
    ],
  },

  // ------------------------------------------------------------ 23
  sec("23", "The follow-up questions", "Topic twenty three. The follow ups you should expect, with answers you can say in your own words."),
  {
    kind: "sayit",
    q: "What is LangGraph, and why use it over plain function calling?",
    lines: [
      "A graph runtime for LLM workflows: typed state with reducers, nodes, conditional edges.",
      "Plus checkpointing, interrupts, and event streaming.",
      "Plain function calling gives you the loop. This product needed durable state, a pause for a human, and streaming.",
    ],
    beats: B(
      { say: "What is LangGraph, and why use it over plain function calling?", tone: "ask" },
      "It's a graph runtime for LLM workflows. Typed state with reducers, nodes, and conditional edges.",
      "Plus checkpointing, interrupts, and event streaming, built in.",
      { say: "Plain function calling gives you the loop. This product needed durable state, a pause for a human, and streaming. That's LangGraph.", tone: "key" },
    ),
  },
  {
    kind: "sayit",
    q: "What is DeepAgents, and what did you use from it?",
    lines: [
      "LangChain's library for “deep” agents: planning, subagents, a scratch filesystem.",
      "Only its subagent middleware is used here.",
      "It provides the task() tool, which dispatches to compiled subagents and streams their events.",
    ],
    beats: B(
      { say: "What is Deep Agents, and what did you use from it?", tone: "ask" },
      "It's LangChain's library for deep agents: planning, subagents, and a scratch file system.",
      "Here, only its subagent middleware is used.",
      "It provides the task tool, which dispatches to compiled subagents, and streams their events.",
    ),
  },
  {
    kind: "sayit",
    q: "How would you evaluate this agent?",
    lines: [
      "The doc describes no formal evals, so say what you'd build.",
      "Offline: recorded planner requests with the expected subagent, tool and arguments: routing and argument accuracy.",
      "For writes: the expected rows and values, checked on a test instance; and the approval classifier's accuracy on real replies.",
      "Online: approve vs reject rate, edits later reverted, turns per task, latency and cost per turn from the traces.",
    ],
    beats: B(
      { say: "How would you evaluate this agent?", tone: "ask" },
      { say: "Be honest first: the documentation doesn't describe formal evals. So describe what you'd build.", tone: "key" },
      "Offline, a set of recorded planner requests, each with the expected subagent, tool, and arguments. That measures routing accuracy and argument accuracy.",
      "For writes, the expected rows and values, checked against a test instance. And the approval classifier's accuracy, on real planner replies.",
      "Online, from the traces: the approve versus reject rate, edits that were later reverted, turns per completed task, and latency and cost per turn.",
    ),
  },
  {
    kind: "sayit",
    q: "How does it scale across many customers?",
    lines: [
      "Each planning instance has its own database and credentials; the resolver caches per instance.",
      "The API is stateless between turns: state in the checkpointer, proposals in Redis.",
      "So workers scale horizontally.",
    ],
    beats: B(
      { say: "How does it scale across many customers?", tone: "ask" },
      "Each planning instance has its own database and credentials, and the resolver caches them per instance.",
      "The A P I is stateless between turns. The state is in the checkpointer, and the proposals are in Redis.",
      { say: "So any worker can serve any request, and workers scale horizontally.", tone: "key" },
    ),
  },
  {
    kind: "sayit",
    q: "Name one concern in the design.",
    lines: [
      "The UICache connector is synchronous psycopg inside an async FastAPI service.",
      "Under load, blocking calls stall the event loop.",
      "Fix: a thread pool, or an async connection pool.",
    ],
    beats: B(
      { say: "Name one concern in the design. This shows maturity, so have one ready.", tone: "ask" },
      "The U I cache connector is synchronous, inside an async Fast A P I service.",
      "Under load, a blocking database call stalls the event loop, and every other request on that worker waits.",
      { say: "The fix: run those calls in a thread pool, or move to an async connection pool.", tone: "key" },
    ),
  },
  {
    kind: "sayit",
    q: "How did you test it?",
    lines: [
      "pytest with coverage; ruff and mypy for linting and types.",
      "A local test mode for the UICache with local credentials.",
      "Mention unit tests on the identifier guard, the UPSERT builder and the resume builder, if you wrote them.",
    ],
    beats: B(
      { say: "How did you test it?", tone: "ask" },
      "Pytest with coverage, and ruff and mypy for linting and type checks.",
      "A local test mode for the U I cache, using local credentials.",
      "And if you wrote them, mention unit tests around the identifier guard, the upsert builder, and the resume command builder. Only if you wrote them.",
    ),
  },
  {
    kind: "drill",
    items: [
      { q: "Can the LLM write without approval?", a: "No. The write tool is an interrupt point in middleware; its body can't run without a resume carrying an approval." },
      { q: "Can it write to someone else's scenario?", a: "No. User and scenario come from state, set by the identity middleware from the request." },
      { q: "Where do database passwords live?", a: "In Azure Key Vault, per instance, fetched at resolve time, cached briefly. Never in config or prompts." },
      { q: "How do you handle prompt injection through data?", a: "Gating and scoping are in code, so injected text can at most make the model propose something, which a human sees and can reject." },
    ],
    beats: [
      ...Q("Security, rapid fire. Can the LLM write without approval?", "No. The write tool is an interrupt point in middleware. Its body cannot run without a resume command carrying an approval."),
      ...Q("Can it write to someone else's scenario?", "No. The user and scenario come from the state, set by the identity middleware from the request."),
      ...Q("Where do the database passwords live?", "In Azure Key Vault, per instance, fetched at resolve time and cached briefly. Never in config, never in prompts."),
      ...Q("How do you handle prompt injection through the data?", "The gating and scoping are in code. So injected text can, at most, make the model propose something, which a human then sees, and can reject."),
    ],
  },

  // ------------------------------------------------------------ 24
  sec("24", "Honest gaps: what you'd do next", "Topic twenty four. Honest gaps. Say these as what I'd do next. None of them is claimed by the documentation as built."),
  {
    kind: "bullets",
    title: "What I'd do next (1 of 2)",
    items: [
      { icon: "🔒", text: "Optimistic concurrency at commit", sub: "stage the “before” values; refuse or re-ask if Base changed since the read" },
      { icon: "✏️", text: "Approve-with-changes", sub: "structured approve / reject / edit in the UI, instead of classifying free text" },
      { icon: "⏳", text: "TTL alignment", sub: "a proposal lives at least as long as an approval can take; tell the planner when it expired" },
      { icon: "🔑", text: "An idempotency key on resume", sub: "record the staged {uuid} with the commit: double resumes become provably harmless" },
    ],
    beats: B(
      "One. Optimistic concurrency at commit. Store the before values in the staged payload, and if Base has changed since the read, refuse, or ask again.",
      "Two. Approve with changes. Structured approve, reject and edit decisions in the UI, instead of classifying free text.",
      "Three. Time to live alignment. Make a proposal live at least as long as an approval can reasonably take, and tell the planner when it has expired.",
      "Four. An idempotency key on resume. The staged unique id already identifies the change. Record it with the commit, and double resumes become provably harmless. The upsert already makes them mostly harmless.",
    ),
  },
  {
    kind: "bullets",
    title: "What I'd do next (2 of 2)",
    items: [
      { icon: "⚡", text: "Async database access", sub: "an async pool for the UICache instead of a synchronous connector" },
      { icon: "🧪", text: "Evals in CI", sub: "the routing, argument and write-correctness set, on every prompt change" },
      { icon: "🔍", text: "A diff preview", sub: "old → new per row in the approval card, for large updates" },
    ],
    beats: B(
      "Five. Async database access, with an async pool for the U I cache.",
      "Six. Evals in C I. The routing, argument and write correctness set, run on every prompt change.",
      { say: "Seven. A diff preview. Old to new, per row, in the approval card, for large updates. Saying these before you're asked is a strength, not a weakness.", tone: "key" },
    ),
  },

  // ------------------------------------------------------------ 25
  sec("25", "Numbers to know", "Topic twenty five. The numbers. There are only ten, and every one of them has come up already."),
  {
    kind: "numbers",
    title: "Numbers to know (1 of 2)",
    items: [
      { value: "1", label: "endpoint", sub: "POST /inventory_ops" },
      { value: "4", label: "domain subagents" },
      { value: "12", label: "middleware layers" },
      { value: "2", label: "model retries" },
      { value: "40", label: "max model calls / run" },
    ],
    beats: B(
      "One endpoint. Slash inventory ops.",
      "Four domain subagents.",
      "Twelve middleware layers on the supervisor.",
      "Two model retries.",
      "Forty model calls, at most, in one run.",
    ),
  },
  {
    kind: "numbers",
    title: "Numbers to know (2 of 2)",
    items: [
      { value: "8", label: "max task() dispatches / run" },
      { value: "50 / 40k", label: "summarise at", sub: "messages / tokens" },
      { value: "80k", label: "prune tool payloads at", sub: "tokens" },
      { value: "5,000", label: "max rows per write", sub: "MAX_WRITE_ROWS default" },
      { value: "4", label: "steps of the write", sub: "read · stage · approve · commit" },
    ],
    footer: "the doc gives no usage or latency figures: recall your own",
    beats: B(
      "Eight task dispatches, at most, per run.",
      "Summarise at fifty messages, or forty thousand tokens.",
      "Prune old tool payloads at eighty thousand tokens.",
      "Five thousand rows, at most, per write.",
      "And four steps in the write: read, stage, approve, commit.",
      { say: "The documentation gives no usage or latency figures. Before the interview, recall your own: how many planners used it, how many changes went through, typical turn latency, how long the old ticket cycle took. If you don't know one, say so, and say how you'd measure it from the traces.", tone: "key" },
    ),
  },
  {
    kind: "drill",
    items: [
      { q: "40 and 8: what are they?", a: "Max model calls, and max task() dispatches, per run." },
      { q: "5,000?", a: "MAX_WRITE_ROWS: the default cap on rows per write." },
      { q: "50 messages, 40k tokens, and 80k tokens?", a: "Summarise at 50 / 40k; clear old tool payloads at 80k." },
    ],
    beats: [
      ...Q("Numbers check. Forty, and eight. What are they?", "At most forty model calls, and eight task dispatches, in one run."),
      ...Q("Five thousand?", "Max write rows. The default cap on rows in one write."),
      ...Q("Fifty messages, forty thousand tokens, and eighty thousand tokens?", "Summarise at fifty messages or forty thousand tokens. Clear old tool payloads at eighty thousand."),
    ],
  },

  // ------------------------------------------------------------ 26
  sec("26", "Three stories", "Topic twenty six. Three stories, for the behavioural side of the interview. Each one is a mechanism you now understand, told as a story."),
  {
    kind: "sayit",
    q: "Story A · making writes safe",
    lines: [
      "Planners needed to change live planning parameters by chat, but an LLM must never write on its own.",
      "I split the write into read, stage, approve and commit: reads cached in Redis, the proposal staged in Redis, not the database.",
      "The commit tool is a LangGraph interrupt, so it physically can't run until the planner approves.",
      "The commit is an UPSERT into a per-(user, scenario) overlay, so Base is never modified.",
      "Result: a chat turn instead of a multi-day ticket, and every write approved, scoped and auditable.",
    ],
    beats: B(
      { say: "Story A. Making writes safe. A story about design under constraints.", tone: "ask" },
      "Planners needed to change live planning parameters by chat. But an LLM must never write on its own.",
      "So I split the write into read, stage, approve and commit. Reads are cached in Redis, and the proposal is staged in Redis, not in the database.",
      "The commit tool is registered as a LangGraph interrupt, so it physically can't run until the planner approves.",
      "And the commit itself is an upsert into a per user, per scenario overlay table, so Base is never modified.",
      { say: "The result: planners change parameters in a chat turn instead of a multi day ticket, and every write is approved, scoped, and auditable.", tone: "key" },
    ),
  },
  {
    kind: "sayit",
    q: "Story B · the interrupt that would have been retried away",
    lines: [
      "Our supervisor wraps tool calls in retry middleware, for transient errors.",
      "An approval interrupt is raised like an exception: GraphInterrupt.",
      "A retry wrapper around the subagent dispatch would catch it and retry, and the approval would never reach the planner.",
      "So the dispatch tool is deliberately excluded from tool retry.",
      "Lesson: retries are for failures, not for control flow.",
    ],
    beats: B(
      { say: "Story B. The interrupt that would have been retried away. A story about a subtle class of bug.", tone: "ask" },
      "Our supervisor wraps tool calls in retry middleware, for transient errors.",
      "But an approval interrupt is raised like an exception: a Graph Interrupt.",
      "So a retry wrapper around the subagent dispatch would catch it and retry it, and the approval would never reach the planner.",
      "That's why the dispatch tool is deliberately excluded from tool retry.",
      { say: "The lesson: retries are for failures, not for control flow.", tone: "key" },
    ),
  },
  {
    kind: "sayit",
    q: "Story C · hierarchy-aware reads",
    lines: [
      "Planners don't think in item-location pairs; they ask about a class or a region.",
      "I made the read join the fact view to the item and location dimensions, and filter at any level.",
      "Level → column maps come from each planning instance's hierarchy.",
      "Identifiers checked against a safe pattern; values always bound.",
      "Results summarised to markdown for the model; raw rows cached for staging.",
    ],
    beats: B(
      { say: "Story C. Hierarchy aware reads.", tone: "ask" },
      "Planners don't think in item location pairs. They ask about a class, or a region.",
      "So I made the read join the fact view to the item and location dimensions, and filter at any level.",
      "The level to column maps come from each planning instance's own hierarchy.",
      "Identifiers are checked against a safe pattern, and values are always bound as parameters.",
      { say: "And the results are summarised to markdown for the model, while the raw rows are cached for staging.", tone: "key" },
    ),
  },
  check({
    topic: "stories",
    q: "Which story fits “tell me about a subtle bug or design detail”?",
    options: ["Story A: making writes safe", "Story B: the interrupt that would have been retried away", "Story C: hierarchy-aware reads", "None of them"],
    answer: 1,
    a: "Story B. Retry middleware would have swallowed the approval interrupt; task() is excluded. Retries are for failures, not control flow.",
    aSay: "B. The interrupt that would have been retried away. Retry middleware would have swallowed the approval, so task is excluded. Retries are for failures, not control flow.",
  }),

  // ------------------------------------------------------------ 27
  sec("27", "Putting it together", "Last topic. Putting it all together, so you can say it in thirty seconds, or in two minutes."),
  {
    kind: "sayit",
    q: "The 30-second pitch",
    lines: [
      "It's a LangGraph agent inside our planning UI. A supervisor routes each request to one of four domain subagents.",
      "I built the data-management layer behind the replenishment subagent.",
      "Hierarchy-aware PostgreSQL reads, so a planner can ask about a whole class or region.",
      "Writes staged in Redis; a human-in-the-loop approval as a LangGraph interrupt.",
      "On approval, a scenario-scoped UPSERT into an Overlay table, so the shared Base data is never modified.",
      "Planners went from multi-day ticket cycles to a chat turn.",
    ],
    beats: B(
      { say: "The thirty second pitch.", tone: "ask" },
      "It's a LangGraph agent inside our planning UI. A supervisor routes each request to one of four domain subagents, each with its own tools.",
      "I built the data management layer behind the replenishment subagent.",
      "Hierarchy aware PostgreSQL reads, so a planner can ask about a whole class or region, rather than one item.",
      "Writes that are staged in Redis instead of hitting the database, and a human in the loop approval, implemented as a LangGraph interrupt.",
      "And on approval, a scenario scoped upsert into an Overlay table, so the shared Base data is never modified.",
      { say: "Planners went from multi day ticket cycles, to a chat turn.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "The two-minute version adds three points",
    items: [
      { icon: "🛡", text: "Safety by construction", sub: "the LLM proposes, it can't write: the write tool is an interrupt; scenario and user come from the request" },
      { icon: "📝", text: "Base + Overlay", sub: "edits are rows in a per-(user, scenario) overlay: isolated, idempotent, auditable; Base stays clean" },
      { icon: "🏭", text: "Production plumbing", sub: "SSE streaming · Postgres checkpoints with an in-memory cache · Key Vault · retries, fallbacks, limits · summarisation · OpenTelemetry" },
    ],
    beats: B(
      { say: "Safety by construction. The LLM can propose, but it cannot write. The write tool is an interrupt point, so the graph physically stops until a human approves. And the scenario and user come from the authenticated request, never from the model.", tone: "key" },
      "Base plus Overlay. Edits are rows in a per user, per scenario overlay, keyed by the natural primary key. So they're isolated, idempotent, and auditable, and Base stays clean for everyone else.",
      "Production plumbing. Streaming over S S E. Conversation state checkpointed to Postgres, with an in memory cache during a turn. Per instance database credentials from Key Vault. Retries, fallback models, hard loop limits, summarisation, and OpenTelemetry traces.",
    ),
  },
  {
    kind: "big",
    tone: "idea",
    lead: "The sentence, one last time",
    text: "The LLM decides what to do. Middleware decides what it's allowed to do. Redis holds what it wants to do. Postgres only changes after a human says yes.",
    beats: B(
      "And the sentence from the start. One last time. This time, you know what every word means.",
      { say: "The LLM decides what to do. Middleware decides what it's allowed to do. Redis holds what it wants to do. And Postgres only changes after a human says yes.", tone: "key" },
      "The supervisor and the subagents decide. The identity, the limits and the interrupt allow. param read and param prepared hold. And the upsert into the overlay changes Postgres, only on an approved resume.",
    ),
  },
  check({
    topic: "the whole lecture",
    q: "Last check. Draw the board from memory, and say the sentence, clause by clause, pointing at each box.",
    a: "UI → FastAPI → agent → identity + supervisor → task() → Replenishment → tools → Redis / UICache, SSE back, checkpoint saved. Decide · allow · hold · change only after yes.",
    aSay: "Planning UI, Fast A P I, the agent, identity and the supervisor, task to Replenishment, the tools, Redis and the U I cache, S S E back, and the checkpointer. Then: the LLM decides, middleware allows, Redis holds, and Postgres changes only after a human says yes.",
    hold: 20,
  }),
  {
    kind: "custom",
    name: "recall",
    props: { a: "Tonight: draw the board, then walk “set ordering cost to 12” through it, out loud.", b: "If any step is fuzzy, rewind to that topic's check." },
    beats: B(
      "Your homework for tonight. Draw the board on paper, from memory. Then walk set ordering cost to twelve through it, out loud, naming every Redis key and table.",
      { say: "If any step feels fuzzy, rewind to that topic's check, not to the start. That's the Inventory Ops Agent. You've got this.", tone: "key" },
    ),
  },
];
