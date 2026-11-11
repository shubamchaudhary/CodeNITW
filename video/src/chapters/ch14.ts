import type { Chapter, Scene } from "../lib/types.ts";
import { makeCheck } from "./checks.ts";
import { B, custom, q, sec } from "./lc/h.ts";

// Chapter 14 of the AI Stack: LangGraph in depth, topic by topic (the order of
// src/Data/aiStackDocs/CH-14.md): why it exists, state and reducers, nodes and
// edges, super-steps, Send, checkpoints and threads, interrupts, failures,
// memory, streaming, subgraphs and multi-agent, production.
const check = makeCheck();

const scenes: Scene[] = [
  {
    kind: "title",
    eyebrow: "AI Stack · Chapter 14",
    title: "LangGraph in depth",
    subtitle: "state, super-steps, checkpoints and interrupts, topic by topic",
    beats: B("Chapter fourteen. LangGraph, in depth. Chapters five to seven used LangGraph to build agents that remember and wait for approvals. Now we take the runtime itself apart, topic by topic, because that's what interviews probe: not the diagram, but how it actually runs."),
  },

  // ---------------------------------------------------------------- 1
  sec("1", "Why LangGraph exists", "Topic one. Why LangGraph exists."),
  {
    kind: "compare",
    title: "Who decides the steps?",
    cols: [
      { title: "An agent loop", icon: "🔁", tone: "amber", items: ["The model decides every step", "Flexible, few lines (create_agent)", "Can skip a step, loop, go out of order"] },
      { title: "A LangGraph graph", icon: "🕸️", tone: "blue", items: ["You fix the steps that must happen", "The model still decides where you let it", "Plus: saved state, pauses, streaming, replay"] },
    ],
    footer: "Not rivals: create_agent compiles to a LangGraph graph, and an agent can be one node of a bigger graph",
    beats: B(
      "An agent loop lets the model decide every step. That's flexible, and it's also the problem. The model can skip the policy search, call tools in the wrong order, or loop forever.",
      "Many real systems need some steps fixed by you. Always classify first. Always check permissions before a refund. Always ask a human before sending money. LangGraph lets you write that workflow as a graph: nodes are steps, edges say what runs next, and a typed state carries everything the run knows. The model still decides wherever you let it. And the runtime adds what long-running AI work needs: the state saved after every step, pausing for a human, streaming, and replay.",
      { say: "And they aren't rivals. Create agent compiles to a LangGraph graph, and a whole agent can be a single node inside a bigger graph.", tone: "key" },
    ),
  },
  q("LangChain vs LangGraph: when do you reach for LangGraph?", "who controls the steps, and what the runtime adds", "LangChain versus LangGraph. When do you reach for LangGraph?", "When you need to control the steps: a fixed order, parallel branches, approvals at chosen points, several agents. And when you need what the runtime gives: state saved after every step, pause and resume, streaming, replay."),

  // ---------------------------------------------------------------- 2
  sec("2", "State and reducers", "Topic two. State, and reducers. This is the topic interviewers dig into most, so we'll go slowly."),
  {
    kind: "code",
    title: "The state: a typed whiteboard, with a merge rule per key",
    lang: "python",
    code: `from typing import Annotated, TypedDict
import operator
from langgraph.graph.message import add_messages

class State(TypedDict):
    messages: Annotated[list, add_messages]      # append, or replace by id
    sources: Annotated[list[str], operator.add]  # concatenate
    ticket: dict                                 # no reducer: overwrite
    tries: int                                   # no reducer: overwrite`,
    highlight: [[5, 5], [6, 7], [8, 9]],
    beats: B(
      "The state is the run's shared whiteboard: a typed schema, usually a TypedDict. A Pydantic model or a dataclass works too.",
      "Each key can carry a reducer, attached with Annotated. A reducer is the rule for merging a new value into the old one. Add messages appends new messages, and replaces a message that has the same id. Operator dot add concatenates lists.",
      { say: "A key with no reducer is simply overwritten by the newest value. And here's the rule that matters: a node never edits the state. It returns a partial update, a dict with only the keys it changed, and LangGraph merges it in, key by key, using the reducers.", tone: "key" },
    ),
  },
  custom(
    "lgstate",
    {
      title: "Reducers decide how updates merge",
      fields: [
        { key: "sources", reducer: "operator.add" },
        { key: "tries", reducer: "(overwrite)" },
        { key: "answer", reducer: "(overwrite)" },
      ],
      steps: [
        { round: "BEFORE", values: { sources: '["policy.pdf"]', tries: "1", answer: "None" } },
        { round: "ONE NODE RETURNS", updates: [{ node: "retrieve", key: "sources", val: '["faq.md"]' }], values: { sources: '["policy.pdf", "faq.md"]', tries: "1", answer: "None" }, note: "operator.add appends: nothing is lost" },
        { round: "ONE NODE RETURNS", updates: [{ node: "rewrite", key: "tries", val: "2" }], values: { sources: '["policy.pdf", "faq.md"]', tries: "2", answer: "None" }, note: "no reducer: the new value replaces the old one" },
        { round: "TWO PARALLEL NODES", updates: [{ node: "search_web", key: "sources", val: '["blog"]' }, { node: "search_docs", key: "sources", val: '["wiki"]' }], values: { sources: '[…, "blog", "wiki"]', tries: "2", answer: "None" }, note: "parallel writes to a key with a reducer: both are kept" },
        { round: "TWO PARALLEL NODES", updates: [{ node: "draft_a", key: "answer", val: '"A"' }, { node: "draft_b", key: "answer", val: '"B"' }], values: { sources: '[…, "blog", "wiki"]', tries: "2", answer: "?" }, error: "InvalidUpdateError: two writes, no reducer", note: "fix: add a reducer, or give each node its own key" },
      ],
    },
    B(
      "Let's watch it. The state has sources, with operator dot add, and tries and answer, with no reducer.",
      "The retrieve node returns sources: faq. The reducer appends it, so sources now holds both files. Nothing is lost.",
      "The rewrite node returns tries: two. No reducer, so two simply replaces one.",
      "Now two nodes running in parallel both write sources. Because sources has a reducer, both updates are merged in, and both results are kept.",
      { say: "But two parallel nodes writing answer, which has no reducer: LangGraph can't choose a winner, and it raises an invalid update error. That's the interview question: two parallel nodes write the same key, what happens? With a reducer, both merge. Without one, an error. The fix is a reducer, or a separate key per node.", tone: "key" },
    ),
  ),
  {
    kind: "bullets",
    title: "Keep the state small and factual",
    items: [
      { icon: "🧾", text: "Store facts and ids, not formatted prompts or whole documents", sub: "the state is saved after every step" },
      { icon: "✍️", text: "One writer per key, where you can", sub: "fewer surprises, fewer reducers needed" },
      { icon: "🚪", text: "Narrow input and output schemas", sub: "callers send a question and get an answer; internal keys stay private" },
      { icon: "💬", text: "MessagesState for chat graphs", sub: "one messages key with add_messages; subclass it to add fields" },
    ],
    beats: B(
      "Some design rules. Store facts and ids, not formatted prompts or whole documents, because the state is saved after every step.",
      "Give each key one writer where you can.",
      "Declare narrower input and output schemas, so callers send only a question and get back only the answer, while the working keys stay private.",
      { say: "And for chat graphs, MessagesState is a ready-made state with one messages key using add messages. Subclass it to add your own fields.", tone: "key" },
    ),
  },

  // ---------------------------------------------------------------- 3
  sec("3", "Nodes and edges", "Topic three. Nodes and edges."),
  {
    kind: "code",
    title: "Nodes are functions; edges say what runs next",
    lang: "python",
    code: `def classify(state: State):
    return {"ticket": classifier.invoke(state["messages"][-1].content).model_dump()}

def route(state: State) -> str:
    return "refunds" if state["ticket"]["category"] == "billing" else "answer"

g = StateGraph(State)
g.add_node("classify", classify)
g.add_node("refunds", refunds)
g.add_node("answer", answer)
g.add_edge(START, "classify")
g.add_conditional_edges("classify", route, ["refunds", "answer"])
g.add_edge("refunds", END)
g.add_edge("answer", END)
app = g.compile()`,
    highlight: [[1, 2], [4, 5], [7, 14], [15, 15]],
    beats: B(
      "A node is a plain function. It takes the state, and returns a partial update. Classify writes only the ticket key.",
      "A router is a small function that reads the state and returns the name of the next node.",
      "Then you build the graph. Add the nodes. A normal edge from start to classify always goes there. A conditional edge from classify calls the router, and the list says which nodes it may return. Then both branches go to end.",
      { say: "And compile checks the graph, no dangling nodes, and returns an app with the same invoke, stream and batch as any Runnable.", tone: "key" },
    ),
  },
  {
    kind: "flow",
    title: "The same graph, drawn",
    cols: 4,
    rows: 2,
    nodeW: 300,
    nodeH: 120,
    nodes: [
      { id: "s", label: "START", c: 0, r: 0, w: 200 },
      { id: "c", label: "classify", c: 1, r: 0, tone: "amber" },
      { id: "r", label: "refunds", c: 2, r: 0 },
      { id: "a", label: "answer", c: 2, r: 1 },
      { id: "e", label: "END", c: 3, r: 0, w: 200, tone: "green" },
    ],
    edges: [
      { from: "s", to: "c" },
      { from: "c", to: "r", label: "billing" },
      { from: "c", to: "a", label: "anything else" },
      { from: "r", to: "e" },
      { from: "a", to: "e" },
    ],
    show: [["s", "c", "r", "a", "e"], []],
    overlay: { step: 1, text: "Or route from inside a node: return Command(update={\"ticket\": t}, goto=\"refunds\")", tone: "amber" },
    beats: B(
      "Drawn, it's a subway map. Start, classify, and a switch: billing goes to refunds, anything else to answer, and both end.",
      { say: "There's a second way to route. A node can return a Command, with an update and a goto. It changes the state and chooses the next node in one move. Use it when the node that does the work also knows where to go, like a triage step handing off to a specialist.", tone: "key" },
    ),
  },

  // ---------------------------------------------------------------- 4
  sec("4", "How a graph runs: super-steps", "Topic four. How a graph actually runs: super-steps. If you understand this one picture, half the LangGraph interview questions answer themselves."),
  custom(
    "pylanes",
    {
      title: "Super-steps: run the round in parallel, merge, save, decide",
      sub: "a question fans out to three searches, then one node combines them",
      max: 4,
      unit: "",
      legend: false,
      rows: [
        { label: "plan", step: 0, bars: [{ s: 0, e: 0.9, kind: "run", text: "round 1" }] },
        { label: "search_web", step: 1, bars: [{ s: 1, e: 1.9, kind: "run", text: "round 2" }] },
        { label: "search_docs", step: 1, bars: [{ s: 1, e: 1.6, kind: "run" }, { s: 1.6, e: 1.9, kind: "wait" }] },
        { label: "search_tickets", step: 1, bars: [{ s: 1, e: 1.4, kind: "run" }, { s: 1.4, e: 1.9, kind: "wait" }] },
        { label: "combine", step: 3, bars: [{ s: 2, e: 2.9, kind: "run", text: "round 3" }], done: "END" },
      ],
      note: { step: 2, text: "End of every round: merge all updates through the reducers, save a checkpoint, then the edges choose the next round", tone: "amber" },
    },
    B(
      "LangGraph runs in rounds called super-steps, an idea from Google's Pregel system. Round one: the plan node runs.",
      "Its edges point to three search nodes, so round two runs all three in parallel. They all read the state as it was at the start of the round. None of them sees another's update during the round.",
      "At the end of every round, all the updates are merged through the reducers, a checkpoint is saved, and the edges decide what runs next. A fast node that finished early just waits for the round to end.",
      { say: "Round three: combine. It has three incoming edges, and it runs once, after all three searches have finished. That's fan-in. And it explains three interview answers at once: why parallel nodes can't see each other's writes, why a parallel write needs a reducer, and why a crash loses at most the current round.", tone: "key" },
    ),
  ),
  {
    kind: "bullets",
    title: "Loops need brakes",
    items: [
      { icon: "🔢", text: "A counter in the state, checked by the router", sub: "tries < 3 → retry, else → a fallback answer" },
      { icon: "⏳", text: "RemainingSteps: a managed value in the state", sub: "end gracefully before the limit, instead of erroring" },
      { icon: "🛑", text: "recursion_limit in the config: the backstop", sub: "caps super-steps; raises GraphRecursionError; recent versions default very high, so set your own" },
      { icon: "💸", text: "A token, cost and time budget for the whole run", sub: "a loop that never errors can still be expensive" },
    ],
    beats: B(
      "Loops are where graphs go wrong: one strange question, and a rewrite and retrieve loop runs forty times. The first brake is a counter in the state that the router checks, with a fallback route when it runs out.",
      "Remaining steps is a managed value you can put in the state, so a node knows how many rounds are left and can finish gracefully.",
      "The recursion limit, set in the config, is the last-resort backstop. It caps the number of super-steps and raises graph recursion error. The old default was twenty five; recent versions default to a very high number, so set your own.",
      { say: "And a budget on tokens, cost and time for the whole run, because a loop that never errors can still be expensive.", tone: "key" },
    ),
  },
  check({
    topic: "super-steps",
    q: "search_web and search_docs run in the same super-step. Can search_docs read the sources that search_web just wrote?",
    say: "Search web and search docs run in the same super-step. Can search docs read the sources that search web just wrote?",
    options: ["Yes, immediately", "No: updates merge at the end of the round", "Only with a reducer", "Only if search_web finished first"],
    oSay: ["yes, immediately", "no, updates merge at the end of the round", "only with a reducer", "only if search web finished first"],
    answer: 1,
    a: "No. Nodes in one super-step all read the state from the start of the round; updates are merged (and checkpointed) only when the round ends.",
    aSay: "B. No. Every node in a super-step reads the state as it was at the start of the round. Updates are merged, and saved, only when the round ends. The next round sees them.",
  }),

  // ---------------------------------------------------------------- 5
  sec("5", "Fan-out with Send", "Topic five. Fan-out when you only know the number of tasks at run time: Send."),
  {
    kind: "flow",
    title: "Map-reduce with Send",
    cols: 3,
    rows: 3,
    nodeW: 330,
    nodeH: 110,
    nodes: [
      { id: "s", label: "search\nfinds 37 docs", c: 0, r: 1, tone: "amber" },
      { id: "w1", label: "summarise(doc 1)", c: 1, r: 0 },
      { id: "w2", label: "summarise(doc 2)", c: 1, r: 1 },
      { id: "w3", label: "… doc 37", c: 1, r: 2 },
      { id: "c", label: "combine\nwaits for all", c: 2, r: 1, tone: "green" },
    ],
    edges: [
      { from: "s", to: "w1", label: "Send" },
      { from: "s", to: "w2", label: "Send" },
      { from: "s", to: "w3", label: "Send" },
      { from: "w1", to: "c" },
      { from: "w2", to: "c" },
      { from: "w3", to: "c" },
    ],
    show: [["s"], ["w1", "w2", "w3"], ["c"]],
    beats: B(
      "Sometimes you can't draw the fan-out in advance. A search returns thirty seven documents, and next time twelve, and you want to summarise each one in parallel.",
      "So a router returns a list of Send objects, one per document. Each Send names the node to run, and gives that copy its own small input: just its document. All thirty seven copies run in parallel in the next super-step.",
      { say: "Each copy writes into a key with an appending reducer, so the summaries add up instead of overwriting each other, and combine runs once, after all of them. That's map-reduce. In an interview, add: cap the fan-out for rate limits and cost, and decide what one failed copy means for the whole run.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "Send in code",
    lang: "python",
    code: `from langgraph.types import Send

class State(TypedDict):
    docs: list[str]
    summaries: Annotated[list[str], operator.add]   # results add up

def fan_out(state: State):
    return [Send("summarise", {"doc": d}) for d in state["docs"]]

def summarise(task: dict):                         # gets only its own input
    return {"summaries": [llm.invoke(f"Summarise: {task['doc']}").text]}

g.add_conditional_edges("search", fan_out, ["summarise"])
g.add_edge("summarise", "combine")`,
    highlight: [[3, 5], [7, 8], [10, 11], [13, 14]],
    beats: B(
      "The state has the documents, and summaries with operator dot add.",
      "The router returns one Send per document.",
      "Summarise receives only its own input, a dict with one document, not the whole state, and returns a one-item list.",
      { say: "Wire the router as a conditional edge, and an edge from summarise to combine. The reducer collects every copy's result.", tone: "key" },
    ),
  },

  // ---------------------------------------------------------------- 6
  sec("6", "Checkpoints and threads", "Topic six. Persistence: checkpoints and threads. Everything after this topic depends on it."),
  custom(
    "pytape",
    {
      title: "A thread is a line of checkpoints",
      sub: "thread_id = \"conv-42\": one saved snapshot after every super-step",
      cells: ["start", "classify", "retrieve", "grade", "answer"],
      idx: false,
      steps: [
        { pick: [0, 1, 2, 3, 4], note: "each box is a checkpoint: the state, plus what runs next" },
        { ptr: 4, label: "get_state", out: "the latest snapshot: continue the conversation" },
        { ptr: 2, label: "checkpoint_id", out: "replay from here: later steps run again", note: "get_state_history lists every checkpoint, newest first" },
        { ptr: 2, label: "update_state", out: "fork: write a corrected state, run on from there", note: "time travel: change one step of a bad run and see what follows" },
      ],
    },
    B(
      "Compile with a checkpointer, and LangGraph saves a checkpoint after every super-step: a snapshot of the state, plus what runs next. A thread is one line of these, named by a thread id: one conversation, one ticket, one job.",
      "Invoke again with the same thread id, and the run continues from the latest snapshot. That's how a conversation remembers. Get state returns it.",
      "Get state history lists every checkpoint. Pass an older checkpoint's id, and you replay from there: the later steps run again, model calls included.",
      { say: "Or call update state to write a corrected state at that point, and run on: a fork. This is called time travel, and it's a real debugging tool: change one step of a bad run, and see what would have happened.", tone: "key" },
    ),
  ),
  {
    kind: "code",
    title: "Checkpointers, threads, durability",
    lang: "python",
    code: `from langgraph.checkpoint.postgres import PostgresSaver

app = g.compile(checkpointer=PostgresSaver.from_conn_string(DB_URL))
cfg = {"configurable": {"thread_id": "conv-42"}}

app.invoke({"messages": [("user", "Refund order 48213")]}, cfg)
app.invoke({"messages": [("user", "And the second item?")]}, cfg)  # remembers

app.invoke(inputs, cfg, durability="sync")   # save each step before going on
#           "async": save in the background   "exit": save only at the end`,
    highlight: [[1, 4], [6, 7], [9, 10]],
    beats: B(
      "In-memory saver for development, which is gone on restart, and SQLite or Postgres savers for real use. The thread id goes in the config, under configurable.",
      "Two calls with the same thread id: the second question, and the second item, makes sense, because the first exchange is in the saved state.",
      { say: "And durability trades safety for speed. Sync saves each step before going on, async saves in the background, and exit saves only when the run ends. For anything that touches money, sync.", tone: "key" },
    ),
  },

  // ---------------------------------------------------------------- 7
  sec("7", "Interrupts: pausing for a human", "Topic seven. Interrupts: pausing a run for a human, possibly for hours, and resuming exactly where it stopped."),
  {
    kind: "seq",
    title: "interrupt() pauses; Command(resume=…) continues",
    actors: [
      { id: "u", name: "Reviewer app", icon: "🧑‍💼" },
      { id: "g", name: "Graph", icon: "🕸️", tone: "amber" },
      { id: "d", name: "Checkpointer", icon: "🗄️", tone: "cyan" },
    ],
    msgs: [
      { from: "u", to: "g", label: "invoke(request, thread 42)", step: 0 },
      { from: "g", to: "d", label: "approve node calls interrupt(): save", step: 1, tone: "cyan" },
      { from: "g", to: "u", label: "__interrupt__: {order, amount}", step: 1, tone: "amber" },
      { from: "u", to: "g", label: "Command(resume={approved: True}), thread 42", step: 2 },
      { from: "d", to: "g", label: "load thread 42", step: 2, tone: "cyan" },
      { from: "g", to: "u", label: "the node runs again from its first line", step: 3, tone: "red" },
    ],
    beats: B(
      "The reviewer app starts a run on thread forty two.",
      "The approve node calls interrupt, with the details a human should see: the order and the amount. LangGraph saves the run and returns the payload under the interrupt key. The run is now paused, and the server can even restart.",
      "Hours later, the app invokes the same thread with a Command, resume, and the human's decision. LangGraph loads the thread.",
      { say: "And here's the part interviewers check. The paused node runs again, from its first line. This time, interrupt doesn't pause. It returns the resume value. So anything written before the interrupt in that node runs twice.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "The trap: code before interrupt() runs twice",
    lang: "python",
    code: `def approve_refund(state: State):
    notify_manager(state)                 # ✗ runs again on resume: two emails
    decision = interrupt({"order": state["order_id"], "amount": state["amount"]})
    if decision["approved"]:
        issue_refund(state["order_id"])   # ✓ after the interrupt: once
        return {"status": "refunded"}
    return Command(goto="explain_denial")

out = app.invoke(inputs, cfg)                       # pauses
out["__interrupt__"]                                # what to show the human
app.invoke(Command(resume={"approved": True}), cfg) # continues`,
    highlight: [[1, 3], [4, 7], [9, 11]],
    beats: B(
      "So: this node emails the manager, then interrupts. On resume, the node runs from the top, and the manager gets a second email.",
      "Side effects belong after the interrupt, like the refund here, which runs once, or in a separate node, and they should be idempotent anyway. If a node has several interrupts, keep them in the same order every time, because they're matched by position.",
      { say: "And the calls: invoke pauses and returns the interrupt payload, and invoke with Command resume continues the same thread. A checkpointer is required, because the paused run has to be stored somewhere.", tone: "key" },
    ),
  },
  {
    kind: "sayit",
    q: "How does human-in-the-loop work in LangGraph?",
    lines: [
      "interrupt(payload) inside a node saves the run and returns the payload to the caller.",
      "The caller resumes the same thread with Command(resume=value); interrupt returns that value.",
      "On resume the node re-runs from its start: side effects go after the interrupt and are idempotent.",
      "It needs a checkpointer; the pause can last hours, across restarts.",
      "create_agent gets the same through HumanInTheLoopMiddleware.",
    ],
    beats: B(
      { say: "Out loud.", tone: "ask" },
      "Inside a node, interrupt with a payload saves the run, and returns the payload to the caller: what the human needs to see.",
      "The caller resumes the same thread with Command, resume, and the human's decision, and interrupt returns that value inside the node.",
      "On resume, the node re-runs from its first line, so side effects go after the interrupt, and are idempotent.",
      "It needs a checkpointer, and the pause can last hours, across restarts.",
      { say: "And a create agent agent gets the same behaviour through the human in the loop middleware.", tone: "key" },
    ),
  },

  // ---------------------------------------------------------------- 8
  sec("8", "When things fail", "Topic eight. When things fail: retries, crashes, and side effects."),
  {
    kind: "bullets",
    title: "Failures, and what LangGraph does about them",
    items: [
      { icon: "🔁", text: "Transient errors: a retry policy per node", sub: "add_node(\"call_api\", call_api, retry_policy=RetryPolicy(max_attempts=3))" },
      { icon: "💥", text: "A crash: resume the thread with None", sub: "app.invoke(None, cfg) continues from the last checkpoint" },
      { icon: "✅", text: "Finished parallel nodes aren't re-run", sub: "their writes were saved even though the round didn't complete" },
      { icon: "⚠️", text: "The running node re-runs: side effects repeat", sub: "idempotency keys, or wrap the work in @task so its result is saved" },
      { icon: "🗃️", text: "Node caching", sub: "cache_policy=CachePolicy(ttl=…) skips a node whose inputs were seen recently" },
    ],
    beats: B(
      "Transient errors, like a rate limit or a timeout, are handled with a retry policy on the node: max attempts, with backoff.",
      "A crash: with a durable checkpointer, invoke the same thread with None as the input, and the run continues from the last checkpoint.",
      "If the crash happened mid-round, nodes in that round that had already finished aren't re-run, because their writes were saved.",
      "But the node that was running does re-run. So a side effect it had already done, a charge, an email, happens again. Protect those with an idempotency key, or wrap the work in an at task, whose result is saved and reused instead of redone.",
      { say: "And node caching can skip a node entirely when its inputs were seen recently. Retries for the transient, checkpoints for the crash, idempotency for the side effects.", tone: "key" },
    ),
  },
  check({
    topic: "crash recovery",
    q: "A node charges a card, then crashes before returning. You resume the thread. What happens, and how do you prevent the problem?",
    say: "A node charges a card, then crashes before returning. You resume the thread. What happens, and how do you prevent the problem?",
    a: "The node re-runs from its start and charges again. Use an idempotency key with the payment provider (or wrap the charge in @task so its result is saved), or move the charge into its own node after a checkpoint.",
    aSay: "The node re-runs from its start, so the card is charged twice. Pass an idempotency key to the payment provider, so the second charge is recognised and ignored, or wrap the charge in a task so its result is saved, and keep side effects in their own small node.",
  }),

  // ---------------------------------------------------------------- 9
  sec("9", "Memory", "Topic nine. Memory: short-term and long-term, and per-run settings."),
  {
    kind: "flow",
    title: "Thread state, a store, and the run's context",
    cols: 3,
    rows: 2,
    nodeW: 470,
    nodeH: 140,
    nodes: [
      { id: "t", label: "Short-term: the thread's state\nmessages, ticket, tries\nsaved by the checkpointer", c: 0, r: 0, tone: "blue" },
      { id: "n", label: "a node\n(state, runtime)", c: 1, r: 0, tone: "amber", w: 300 },
      { id: "s", label: "Long-term: a Store\nnamespace (\"users\", \"u7\")\nput / get / search", c: 2, r: 0, tone: "green" },
      { id: "c", label: "Context: per-run settings, not state\nuser id, model choice → runtime.context", c: 1, r: 1, tone: "purple", w: 760 },
    ],
    edges: [
      { from: "n", to: "t", label: "state" },
      { from: "n", to: "s", label: "store" },
      { from: "c", to: "n" },
    ],
    show: [["t", "n"], ["s"], ["c"]],
    beats: B(
      "Short-term memory is simply the thread's state, kept by the checkpointer: the conversation and the working data of one thread. As it grows, trim or summarise old messages.",
      "Long-term memory is a store, passed to compile. Items live under namespaces, like users, then the user's id, with put, get, and search by meaning if the store has an embedding index. It's shared across threads, so what the agent learnt about a user last week is there today. Nodes reach it through runtime dot store.",
      { say: "And per-run settings that aren't state, like the user id or which model to use, go in a context schema. You pass context when you invoke, and nodes read runtime dot context. State changes as the run goes; context doesn't.", tone: "key" },
    ),
  },

  // ---------------------------------------------------------------- 10
  sec("10", "Streaming", "Topic ten. Streaming a graph run."),
  {
    kind: "compare",
    title: "Stream modes",
    cols: [
      { title: "values / updates", tone: "blue", items: ["values: the whole state after each super-step", "updates: each node's update, with its name"] },
      { title: "messages", tone: "green", items: ["LLM tokens from any node", "With metadata: which node produced them"] },
      { title: "custom / debug", tone: "amber", items: ["custom: what nodes send via stream_writer", "debug: everything"] },
    ],
    footer: "Several at once with a list · subgraphs=True includes nested events · forward as SSE",
    beats: B(
      "Values streams the whole state after each super-step. Updates streams each node's update, tagged with the node's name: perfect for progress lines in a UI.",
      "Messages streams LLM tokens from any node, with metadata saying which node produced them, so you can show only the final answer's tokens, not the classifier's.",
      { say: "Custom streams whatever a node sends through the stream writer, and debug streams everything. Pass a list for several modes, and subgraphs equals true to include events from inside subgraphs. Then forward them to the browser as server-sent events.", tone: "key" },
    ),
  },

  // ---------------------------------------------------------------- 11
  sec("11", "Subgraphs, multi-agent, and the functional API", "Topic eleven. Subgraphs, multi-agent designs, and the functional API."),
  {
    kind: "flow",
    title: "A supervisor and its specialists",
    cols: 3,
    rows: 3,
    nodeW: 360,
    nodeH: 120,
    nodes: [
      { id: "u", label: "user", c: 1, r: 0, w: 220 },
      { id: "sup", label: "supervisor\npicks who works next", c: 1, r: 1, tone: "amber" },
      { id: "r", label: "research agent\n(a subgraph)", c: 0, r: 2 },
      { id: "w", label: "writer agent\n(a subgraph)", c: 2, r: 2 },
    ],
    edges: [
      { from: "u", to: "sup" },
      { from: "sup", to: "r", bend: -30 },
      { from: "r", to: "sup", bend: -30 },
      { from: "sup", to: "w", bend: 30 },
      { from: "w", to: "sup", bend: 30 },
    ],
    show: [["u", "sup", "r", "w"], [], []],
    overlay: { step: 2, text: "Handoffs instead: an agent passes control directly with Command(goto=\"writer\", graph=Command.PARENT)", tone: "amber" },
    beats: B(
      "A compiled graph can be a node in another graph: a subgraph. If they share state keys, add it directly. If not, call it inside a node and translate the state in and out. Subgraphs let a team own and test one piece. Multi-agent systems are built from them. The supervisor pattern: one coordinator decides which specialist works next, and collects their results.",
      "It's the easier pattern to control, trace and evaluate, because every decision goes through one place.",
      { say: "The alternative is handoffs, sometimes called a swarm: agents pass control to each other directly, with a Command whose graph is the parent. Fewer hops, harder to reason about. And the senior answer: split into several agents only when the parts need different tools or instructions, or can run in parallel. Otherwise one agent with good tools is cheaper and easier to evaluate.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "The functional API: the same runtime, written as plain Python",
    lang: "python",
    code: `from langgraph.func import entrypoint, task

@task
def summarise(doc: str) -> str:            # result saved: not redone on resume
    return llm.invoke(f"Summarise: {doc}").text

@entrypoint(checkpointer=InMemorySaver())
def digest(docs: list[str]) -> str:
    futures = [summarise(d) for d in docs] # run in parallel
    parts = [f.result() for f in futures]
    approved = interrupt({"draft": parts})  # pauses work here too
    return "\\n".join(parts) if approved else ""`,
    highlight: [[3, 5], [7, 10], [11, 12]],
    beats: B(
      "The functional API writes the same workflows as ordinary Python. A task is a unit of work whose result is saved, so on resume it isn't redone.",
      "An entrypoint is the workflow: a normal function that calls tasks. Calling a task returns a future, so you can start many in parallel and collect their results.",
      { say: "Checkpointing, interrupts and streaming all still work. Use it when the workflow is mostly linear code. Use the graph API when you want the structure to be explicit and visible, which, for a team and for an interview whiteboard, is usually the point.", tone: "key" },
    ),
  },

  // ---------------------------------------------------------------- 12
  sec("12", "LangGraph in production", "Topic twelve. Running LangGraph in production, and the design answer that pulls the chapter together."),
  {
    kind: "flow",
    title: "A production setup",
    cols: 4,
    rows: 2,
    nodeW: 340,
    nodeH: 130,
    nodes: [
      { id: "c", label: "client", c: 0, r: 0, w: 220 },
      { id: "a", label: "API\nFastAPI (SSE) or Agent Server", c: 1, r: 0, tone: "amber" },
      { id: "g", label: "compiled graph\nbuilt once at startup", c: 2, r: 0, tone: "blue" },
      { id: "p", label: "Postgres\ncheckpoints + store", c: 3, r: 0, tone: "green" },
      { id: "l", label: "LLM provider\ntimeouts, budgets", c: 2, r: 1 },
      { id: "t", label: "traces\nLangSmith / OTel", c: 3, r: 1, tone: "purple" },
    ],
    edges: [
      { from: "c", to: "a" },
      { from: "a", to: "g" },
      { from: "g", to: "p" },
      { from: "g", to: "l" },
      { from: "g", to: "t" },
    ],
    show: [["c", "a", "g"], ["p"], ["l", "t"]],
    beats: B(
      "The client calls your API, which streams over server-sent events, either your own FastAPI app or LangGraph's Agent Server. The graph is compiled once, at startup. It holds no state itself.",
      "The state lives in Postgres: checkpoints and the store. So any server instance can continue any thread, even after a restart. Thread ids are issued by your system and tied to the user, so nobody can resume someone else's thread.",
      { say: "Every model call has a timeout and sits inside a token and cost budget, and every run is traced. The Agent Server adds background runs, queues, cron jobs, and handling for double-texting: a user sending a new message while the last run is still going.", tone: "key" },
    ),
  },
  {
    kind: "sayit",
    q: "Design a refund agent with LangGraph.",
    lines: [
      "State: messages (add_messages), order, amount, decision, tries; small and factual.",
      "Nodes: classify → fetch order (tool) → policy check → approve (interrupt if over the limit) → refund → reply.",
      "Conditional edges for the policy outcome; a tries counter and recursion_limit as brakes.",
      "Postgres checkpointer, thread per conversation; refund idempotent, after the interrupt.",
      "Stream updates and tokens over SSE; trace runs; evaluate whole trajectories.",
    ],
    beats: B(
      { say: "To finish, a design question you can now answer completely. Design a refund agent with LangGraph.", tone: "ask" },
      "The state: messages with add messages, the order, the amount, the human's decision, and a tries counter. Small and factual.",
      "The nodes: classify the request, fetch the order with a tool, check it against the policy, then an approval node that interrupts when the amount is over the limit, then issue the refund, and reply.",
      "Conditional edges route on the policy outcome, with a tries counter and a recursion limit as brakes.",
      "A Postgres checkpointer with one thread per conversation, so the pause can last hours. And the refund is idempotent, and placed after the interrupt.",
      { say: "Stream updates and tokens over server-sent events, trace every run, and evaluate whole trajectories, not only final answers. Every topic of this chapter, in one answer.", tone: "key" },
    ),
  },
  {
    kind: "drill",
    items: [
      { q: "A node returns {\"tries\": 2}. What happens to the other keys?", a: "Nothing: updates are partial" },
      { q: "Two parallel writes, no reducer?", a: "InvalidUpdateError" },
      { q: "When is a checkpoint saved?", a: "After every super-step" },
      { q: "How do you resume after interrupt?", a: "invoke(Command(resume=…), same thread)" },
      { q: "What runs again on resume?", a: "The interrupted node, from its first line" },
      { q: "Fan-out over a run-time list?", a: "Send, plus an appending reducer" },
      { q: "Resume after a crash?", a: "invoke(None, same thread)" },
    ],
    beats: B(
      { say: "Rapid fire. A node returns tries equals two. What happens to the other keys?", hold: 3 },
      "Nothing. Updates are partial.",
      { say: "Two parallel writes to a key with no reducer?", hold: 3 },
      "Invalid update error.",
      { say: "When is a checkpoint saved?", hold: 3 },
      "After every super-step.",
      { say: "How do you resume after an interrupt?", hold: 3 },
      "Invoke with Command resume, on the same thread.",
      { say: "What runs again on resume?", hold: 3 },
      "The interrupted node, from its first line.",
      { say: "Fan-out over a list you only know at run time?", hold: 3 },
      "Send, plus an appending reducer.",
      { say: "Resume after a crash?", hold: 3 },
      "Invoke with None, on the same thread.",
    ),
  },
  {
    kind: "bullets",
    title: "The framework layer, done",
    items: [
      { icon: "🧱", text: "Chapter 13: LangChain", sub: "models, Runnables, tools, create_agent, middleware" },
      { icon: "🕸️", text: "Chapter 14: LangGraph", sub: "state, super-steps, checkpoints, interrupts, production" },
      { icon: "🎤", text: "The drill below has every answer written out", sub: "say them out loud" },
    ],
    beats: B(
      "That's the framework layer. Chapter thirteen: LangChain's models, Runnables, tools, create agent and middleware.",
      "And this chapter: LangGraph's state and reducers, super-steps, checkpoints, interrupts, and production.",
      { say: "The notes and the interview drill below have every answer written out. Say them out loud, especially the reducer, super-step and interrupt answers. Those are the ones that separate people who've used LangGraph from people who've read about it. Good luck.", tone: "key" },
    ),
  },
];

export const ch14: Chapter = {
  id: "ch14",
  title: "LangGraph in depth",
  voice: "en-US-AndrewMultilingualNeural",
  pace: { normal: "-3%", ask: "-5%", aside: "+4%", excite: "+4%" },
  scenes,
};
