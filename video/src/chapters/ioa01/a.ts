import type { Scene } from "../../lib/types.ts";
import { B, amap, arch, check, sec } from "./h.ts";
import { SYSTEM, TURN_STEPS } from "./boards.ts";

// Part A: how the lecture works, the problem, six words, what an agent does,
// and the whole system on one board.
export const partA: Scene[] = [
  {
    kind: "title",
    eyebrow: "Projects · IOA-01",
    title: "The Inventory Ops Agent",
    subtitle: "slowly, one idea at a time, with a check after each",
    beats: B("The Inventory Ops Agent. We are going to go slowly. One idea at a time, and after every idea, I'll stop and ask you a question, so you know it has stuck before we build anything on top of it."),
  },
  {
    kind: "bullets",
    title: "How this lecture works",
    firstItemStep: 1,
    items: [
      { icon: "🧸", text: "First an everyday picture", sub: "something you already understand" },
      { icon: "🗺️", text: "Then the real mechanism, on a diagram", sub: "the same picture, with the system's names" },
      { icon: "✋", text: "Then a check", sub: "pause, answer out loud, then compare" },
      { icon: "🔁", text: "Every idea comes back later", sub: "so a missed check costs you twice" },
    ],
    beats: B(
      "Here's how each topic will go.",
      "First, an everyday picture. Something you already understand, like a shopping cart or a sheet of tracing paper.",
      "Then the real mechanism, on a diagram, with the names the system actually uses.",
      "Then a check. A question appears, a ring counts down a few seconds of thinking time. Pause the video if you need more. Answer out loud, with the reason, and then compare with mine.",
      { say: "And every idea comes back later. The interrupt from topic fifteen depends on the checkpointer, which depends on the graph state. So if you miss a check, rewind to the start of that topic before moving on.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "Your resume line, as four claims",
    lead: "LLM Inventory Operations Agent: “…planners read and update inventory parameters conversationally in minutes instead of multi-day ticket cycles…”",
    firstItemStep: 1,
    items: [
      { icon: "🤖", text: "A LangGraph data-management agent" },
      { icon: "🌳", text: "Hierarchy-aware PostgreSQL querying" },
      { icon: "📥", text: "Redis-staged writes with Base + Overlay persistence" },
      { icon: "✋", text: "Human-in-the-loop approval via LangGraph interrupts" },
    ],
    beats: B(
      "This is the line on your resume. Planners read and update inventory parameters by chatting, in minutes, instead of multi day ticket cycles. Inside it are four claims, and by the end of this lecture you will be able to defend every one of them.",
      "One. You built a LangGraph data management agent.",
      "Two. Hierarchy aware PostgreSQL querying. Planners ask about a whole class of items or a whole region, not one row.",
      "Three. Writes that are staged in Redis, and saved with a pattern called Base plus Overlay.",
      { say: "Four. A human approves every write, and that approval is built on a LangGraph feature called an interrupt.", tone: "key" },
    ),
  },
  {
    kind: "big",
    tone: "idea",
    lead: "The whole system, in one sentence",
    text: "The LLM decides what to do. Middleware decides what it's allowed to do. Redis holds what it wants to do. Postgres only changes after a human says yes.",
    beats: B(
      "And here is the whole system in one sentence. Don't try to understand it yet. Just hear it once.",
      { say: "The LLM decides what to do. Middleware decides what it's allowed to do. Redis holds what it wants to do. And Postgres only changes after a human says yes.", tone: "key" },
      "By the end, every word of that sentence will mean something precise to you. We'll come back to it three times.",
    ),
  },

  // ------------------------------------------------------------ 1
  sec("1", "The problem", "Topic one. The problem this agent solves. Every good system design answer starts here."),
  {
    kind: "seq",
    title: "Before the agent: a ticket for one dial",
    actors: [
      { id: "p", name: "Planner", icon: "👤", tone: "blue" },
      { id: "q", name: "Ticket queue", icon: "🎫", tone: "amber" },
      { id: "e", name: "Engineer", icon: "🧑‍💻", tone: "purple" },
      { id: "d", name: "Database", icon: "🐘", tone: "muted" },
    ],
    msgs: [
      { from: "p", to: "q", label: "ticket: Milk, West DCs, ordering cost 10 → 12", step: 2, tone: "blue" },
      { from: "q", to: "e", label: "picked up… days later", step: 3, tone: "amber", dash: true },
      { from: "e", to: "d", label: "a one-line change", step: 4, tone: "purple" },
      { from: "e", to: "p", label: "done", step: 4, tone: "purple" },
    ],
    note: { step: 4, text: "a multi-day cycle, for turning one dial", tone: "amber" },
    beats: B(
      "Meet an inventory planner. Their job is replenishment: making sure every distribution centre and store gets restocked at the right time, in the right amount.",
      "To do that, the planning system uses parameters for each item at each location. Ordering cost, safety stock, and the like. Think of them as the dials on a thermostat. The heating system runs by itself, but someone has to set the dials.",
      "Now our planner decides that the ordering cost for Milk at the West distribution centres should be twelve, not ten. But they can't turn the dial themselves. They raise a ticket.",
      "The ticket waits in a queue for someone who has access to the database.",
      { say: "Days later, an engineer makes what is often a one line change, and replies on the ticket. That's the problem. A multi day cycle, for turning one dial.", tone: "key" },
    ),
  },
  {
    kind: "chat",
    title: "After: reading, in a chat",
    messages: [
      { from: "user", who: "Planner", text: "Show me the BBO parameters for Milk at the West DCs.", step: 1 },
      { from: "bot", who: "Agent", text: "Here are 9 item-location rows. Ordering cost is 10 on all of them.", step: 2 },
    ],
    beats: B(
      "Now the same change, after the agent. It lives in a chat panel inside the planning UI.",
      "The planner asks: show me the B B O parameters for Milk at the West D Cs. B B O is the name your team used for this replenishment domain.",
      "The agent reads the live values. In this example, nine item location rows, all with an ordering cost of ten.",
    ),
  },
  {
    kind: "chat",
    title: "After: changing, in a chat",
    messages: [
      { from: "user", who: "Planner", text: "Set ordering cost to 12.", step: 0 },
      { from: "bot", who: "Agent", text: "Proposed update: 9 rows, ordering cost 10 → 12. Approve or reject?", step: 1 },
      { from: "user", who: "Planner", text: "Approve.", step: 2 },
      { from: "bot", who: "Agent", text: "Updated 9 rows in your scenario.", step: 3 },
    ],
    beats: B(
      "The planner says: set ordering cost to twelve.",
      { say: "And now notice what the agent does not do. It does not change anything. It proposes. Nine rows, ten becomes twelve. Approve, or reject?", tone: "key" },
      "The planner says approve.",
      "And only then is the change written, into the planner's own scenario.",
      { say: "Minutes, instead of days.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "Two guarantees on every write",
    cols: [
      { title: "A human said yes", icon: "✋", tone: "green", items: ["the agent proposes; it never writes on its own", "the write tool pauses the graph for approval", "rejected means nothing changes"] },
      { title: "It landed in your own scenario", icon: "🧪", tone: "blue", items: ["a scenario is the planner's what-if workspace", "the shared plan is never modified", "who and where are stamped on every row"] },
    ],
    footer: "remember these two; every design decision protects one of them",
    beats: B(
      "Out of that chat, take two guarantees. Every write in this system has both. Guarantee one. A human said yes. The agent can propose, but it cannot write on its own. Its write tool physically pauses the whole agent until the planner approves. Reject, and nothing changes.",
      "Guarantee two. The change landed in that planner's own scenario. A scenario is a planner's what if workspace. The shared plan that everyone else uses is never modified, and every written row records who made it and in which scenario.",
      { say: "Hold on to those two. Almost every design decision in this lecture exists to protect one of them.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "What you built, and what you built on",
    cols: [
      { title: "You built: the data-management layer", icon: "🛠", tone: "green", items: ["hierarchy-aware reads", "Redis-staged writes", "Base + Overlay persistence", "human-in-the-loop approval"] },
      { title: "The team's platform", icon: "🏗", tone: "purple", items: ["the supervisor and subagents", "the middleware stack", "checkpointing", "streaming over SSE"] },
    ],
    footer: "“I built X; the team owned Y; here is how they connect”",
    beats: B(
      "One more thing before any mechanism. Be precise about what's yours. Your resume claims the data management layer behind the replenishment subagent. Hierarchy aware reads. Redis staged writes. Base plus Overlay persistence. And the human in the loop approval. Those four, you own in depth.",
      "The supervisor, the middleware stack, checkpointing and streaming were the agent platform you built on. You should understand them well, because your layer plugs into them, but say our supervisor, or the framework we built on.",
      { say: "Interviewers respect a clear sentence like this: I built X, the team owned Y, and here is exactly how they connect. Far more than vague ownership of everything.", tone: "key" },
    ),
  },
  check({
    topic: "the problem",
    q: "What are the two guarantees every write in this system has?",
    a: "A human approved it before it ran, and it landed only in that planner's own scenario, never in the shared plan.",
    aSay: "One. A human approved it before it ran. The agent only proposes. Two. It landed only in that planner's own scenario, never in the shared plan that everyone else reads.",
  }),
  check({
    topic: "the problem",
    q: "Which part of the system is yours to defend in depth?",
    options: ["The supervisor and its middleware", "The data-management layer behind the replenishment subagent", "The SSE streaming layer", "The checkpointer"],
    answer: 1,
    a: "The data-management layer: hierarchy-aware reads, Redis staging, Base + Overlay, and the approval.",
    aSay: "B. The data management layer behind the replenishment subagent. Hierarchy aware reads, Redis staging, Base plus Overlay, and the approval. The others are the platform you built on.",
  }),

  // ------------------------------------------------------------ 2
  sec("2", "Six words you'll need", "Topic two. Six words. The rest of the lecture is built out of them, so we'll take each one slowly, with a picture."),
  amap(
    "Six words, each with a picture",
    "🧸 the picture",
    "⚙️ the system",
    [
      { icon: "🏢", a: "A separate office for each customer, with its own filing cabinet", b: "Planning instance: one customer environment, with its own PostgreSQL, the UICache" },
      { icon: "📄", a: "A photocopy of the plan that you're allowed to scribble on", b: "Scenario: a planner's what-if workspace; edits are scoped to (user, scenario)" },
      { icon: "🗺️", a: "The printed map that everyone shares", b: "Base: the shared planning data, read through VIEWs; the agent never writes it" },
      { icon: "📝", a: "Your own sheet of tracing paper laid over the map", b: "Overlay: the <kind>_u tables holding one user's scenario edits" },
      { icon: "📮", a: "A postal address: state, city, street", b: "Hierarchy: item levels (department, class, item) and location levels (region, DC, store)" },
      { icon: "🩺", a: "Specialist doctors behind one front desk", b: "Subagent: Allocation · MSS / Sourcing · Replenishment / BBO · Supplier Ordering" },
    ],
    B(
      "On the left, an everyday picture. On the right, the system's word for it. Let's go one row at a time.",
      "Word one. Planning instance. Picture a company that serves many customers, and gives each customer a separate office with its own filing cabinet. In this system, each planning instance is one customer environment, and it has its own PostgreSQL database. The team calls that database the UI cache. So there isn't one database. There are many, one per instance.",
      "Word two. Scenario. Imagine getting a photocopy of the plan that you're allowed to scribble on, to try ideas out. That's a scenario: a planner's what if workspace. Every edit is scoped to a pair: which user, and which scenario.",
      "Word three. Base. The printed map that everybody shares. Base is the shared planning data. The agent reads it through database views, and it never, ever writes to it.",
      "Word four. Overlay. Your own sheet of tracing paper, laid over that shared map. You draw your changes on the tracing paper, and the map underneath stays clean. In the system, the overlay is a set of tables whose names end in underscore U. They hold one user's edits, for one scenario.",
      "Word five. Hierarchy. Like a postal address, which goes from state, to city, to street. Items have levels too: department, then class, then the item itself. And locations have levels: region, then distribution centre, then store.",
      { say: "Word six. Subagent. Picture a hospital with one front desk and four specialist doctors behind it. A subagent is a domain specialist. There are four: Allocation, M S S or Sourcing, Replenishment or B B O, and Supplier Ordering.", tone: "key" },
    ),
  ),
  {
    kind: "big",
    tone: "interview",
    lead: "Acronyms",
    text: "BBO, MSS, SOQ: the documentation uses them without expanding them. Expand them the way your team did.",
    beats: B(
      "A small warning about acronyms. B B O, M S S, S O Q. The documentation uses them without ever expanding them.",
      { say: "So before the interview, recall how your team expanded them, and say it that way. Don't guess an expansion in the room.", tone: "key" },
    ),
  },
  check({
    topic: "six words",
    q: "A planner edits ordering cost in their what-if. Where does that edit finally live?",
    options: ["In the Base table, overwriting the old value", "In an overlay table, tagged with their user and scenario", "In Redis, permanently", "In the checkpointer"],
    answer: 1,
    a: "In an overlay (<kind>_u) table, on a row tagged with that user and that scenario. Base is never written.",
    aSay: "B. In an overlay table, the one ending in underscore U, on a row tagged with that user and that scenario. Base is never written.",
    why: "Redis only holds the proposal until it's approved; the checkpointer holds conversation state, not parameters.",
    whySay: "Redis only holds the proposal until it's approved, so not C. And the checkpointer holds the conversation, not inventory parameters, so not D.",
  }),
  check({
    topic: "six words",
    q: "Why can't the database connection be one fixed setting in a config file?",
    a: "There is no single database: every planning instance has its own PostgreSQL (UICache), so the agent must find the right one for each request.",
    aSay: "Because there isn't one database. Every planning instance, every customer environment, has its own PostgreSQL, its own UI cache. So for each request, the agent has to work out which database, and fetch its credentials.",
  }),

  // ------------------------------------------------------------ 3
  sec("3", "What an agent actually does", "Topic three. Before the architecture, let's be exact about what an LLM agent actually does. This one idea makes all the safety design obvious."),
  {
    kind: "seq",
    title: "One tool call, step by step",
    actors: [
      { id: "p", name: "Planner", icon: "👤", tone: "blue" },
      { id: "m", name: "LLM", icon: "🧠", tone: "purple" },
      { id: "c", name: "Agent code", icon: "⚙️", tone: "green" },
      { id: "d", name: "Database", icon: "🐘", tone: "amber" },
    ],
    msgs: [
      { from: "p", to: "m", label: "show BBO params for Milk, West", step: 1 },
      { from: "m", to: "c", label: "tool call: read_parameters({…})", step: 2, tone: "purple", dash: true },
      { from: "c", to: "d", label: "SELECT …", step: 3, tone: "green" },
      { from: "d", to: "c", label: "rows", step: 3, tone: "amber" },
      { from: "c", to: "m", label: "result: a markdown table", step: 4, tone: "green" },
      { from: "m", to: "p", label: "Here are 9 rows…", step: 5 },
    ],
    note: { step: 6, text: "the model only writes a request; code decides whether it runs", tone: "green" },
    beats: B(
      "Here are the four players in one tool call. The planner, the LLM, our agent code, and the database.",
      "The planner's message goes to the LLM.",
      "Now, an LLM is a text predictor. It cannot open a database connection. What it can do is write a special kind of text: a tool call. A tool name, here read parameters, and some arguments, as structured data. It's a request, nothing more.",
      "Our code reads that request, checks it, and runs the real function. That function queries the database and gets rows back.",
      "Code hands the result back to the model, here as a small markdown table.",
      "And the model writes the answer to the planner. If it needed another tool, the loop would simply go round again.",
      { say: "So, the key point. The model only ever writes a request. Whether that request runs is decided by code.", tone: "key" },
    ),
  },
  {
    kind: "big",
    tone: "idea",
    lead: "The idea every safety feature uses",
    text: "The model proposes. Code disposes.",
    after: "approval, scoping, limits: each one is code standing between a request and its effect",
    beats: B(
      { say: "Here's the idea in four words. The model proposes. Code disposes.", tone: "key" },
      "Every safety feature you'll see, the approval pause, the scenario scoping, the loop limits, is code standing between the model's request and its effect. None of them relies on the model behaving well.",
    ),
  },
  check({
    topic: "what an agent does",
    q: "The LLM outputs a tool call to update_parameters. What has happened to the database at that instant?",
    say: "The LLM outputs a tool call to update parameters. What has happened to the database at that instant?",
    options: ["It has been updated", "Nothing: a tool call is only a request, written as text", "The rows are locked", "A pending row is inserted"],
    answer: 1,
    a: "Nothing. A tool call is a request written as text. Code decides whether it runs, and for this tool, a human decides first.",
    aSay: "B. Nothing at all. A tool call is just a request, written as text. Code decides whether it runs. And for this particular tool, as we'll see, a human has to say yes first.",
  }),

  // ------------------------------------------------------------ 4
  sec("4", "The whole system on one board", "Topic four. The whole system on one board. We'll follow a single chat turn through it, in eight steps, slowly."),
  arch(
    SYSTEM,
    TURN_STEPS,
    B(
      "Here's the board. Top row: the planning UI, the Fast A P I service, the agent object, and a checkpointer. In the middle, the middleware stack around the supervisor. Then four subagents. And at the bottom, the data layer tools, Redis, and the planning instance's Postgres.",
      "Step one. The planning UI posts the planner's message to a single endpoint, slash inventory ops, along with the user's J W T, the login token. The router injects the identity and an LLM client, and builds an Inventory Ops Agent object for this request.",
      "Step two. The agent's execute method runs the supervisor graph using a LangGraph function called a stream events, version two. That function emits an event for every token, every tool call, and every subagent step, which is what lets the UI watch the turn happen live.",
      { say: "Step three. Identity first. Before the model does anything, the first middleware writes the realm, the user, and the scenario onto the graph's state. It takes them from the authenticated request. Not from the model.", tone: "key" },
      "Step four. The supervisor. Its one real capability is a tool called task, which hands a goal to one of the four domain subagents. For a parameter change, that's Replenishment.",
      "Step five. The Replenishment subagent calls the data layer tools. Read, stage, and commit. This is the part you built.",
      "Step six. Those tools touch the stores. Reads go to the Base views of that instance's Postgres. Staged edits sit in Redis. And only approved edits are upserted into the overlay tables.",
      "Step seven. Back to the planner. Events stream back over S S E, as small envelopes called delta, complete and error. When approval is needed, the turn ends with a complete envelope that says interrupted equals true.",
      { say: "Step eight. Saved for next time. The conversation's state is checkpointed, so the planner's next HTTP request, including their approval, continues the very same conversation.", tone: "key" },
    ),
    "One chat turn, end to end",
  ),
  amap(
    "The one sentence, clause by clause",
    "🗣 the sentence",
    "⚙️ where it lives on the board",
    [
      { icon: "🧠", a: "“The LLM decides what to do”", b: "supervisor picks a subagent; subagent picks a tool" },
      { icon: "🛡", a: "“Middleware decides what it's allowed to do”", b: "identity from the request · limits · the approval interrupt" },
      { icon: "📥", a: "“Redis holds what it wants to do”", b: "param_read and param_prepared keys, with a TTL" },
      { icon: "🐘", a: "“Postgres only changes after a human says yes”", b: "UPSERT into <kind>_u, only on resume with approve" },
    ],
    B(
      "Now let's pin the sentence onto the board, clause by clause.",
      "The LLM decides what to do. That's the supervisor choosing a subagent, and the subagent choosing a tool.",
      "Middleware decides what it's allowed to do. Identity comes from the request, there are hard limits on loops, and the write tool is an approval interrupt.",
      "Redis holds what it wants to do. The rows the planner saw, and the proposed change, live in Redis keys that expire on their own.",
      { say: "And Postgres only changes after a human says yes. The upsert into the overlay table runs only when the agent resumes with an approval.", tone: "key" },
    ),
  ),
  check({
    topic: "the board",
    q: "Where does the scenario id on a write come from?",
    options: ["The LLM passes it as a tool argument", "The identity middleware, from the authenticated request", "It's read back from Redis", "The planner types it in the chat"],
    answer: 1,
    a: "The identity middleware puts it on the graph state from the authenticated request; tools read it from state.",
    aSay: "B. The identity middleware puts it on the graph state, from the authenticated request, and the tools read it from state. The model never supplies it.",
    why: "If the model supplied it, a prompt injection could redirect a write to someone else's scenario.",
    whySay: "Why does that matter? If the model supplied the scenario, then text hidden in the data could talk it into writing to somebody else's scenario.",
  }),
  check({
    topic: "the board",
    q: "Without looking: the eight steps of one turn, in order.",
    a: "UI → FastAPI · agent runs the graph · identity seeded · supervisor task() → subagent · subagent → tools · tools → Postgres / Redis / overlay · SSE back · checkpoint saved.",
    aSay: "Planner to Fast A P I. The agent runs the supervisor graph. Identity is seeded onto state. The supervisor calls task to dispatch a subagent. The subagent calls the data tools. The tools read Postgres, stage in Redis, or commit to the overlay. Events stream back over S S E. And the state is checkpointed for the next turn.",
    hold: 12,
  }),
];
