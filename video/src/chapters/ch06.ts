import type { Chapter } from "../lib/types.ts";

// Chapter 6 of the AI Stack: agents that remember, interview-ready. The
// running example is an online store's support agent that must survive
// crashes, never refund twice, and remember its customers.

export const ch06: Chapter = {
  id: "ch06",
  title: "Agents that remember",
  voice: "en-US-AndrewMultilingualNeural",
  next: "Chapter 7 — Ask before acting",
  scenes: [
    {
      kind: "custom",
      name: "a6hook",
      beats: [
        { say: "Our support agent works. Then production happens. A customer asks about order four eight two one three, steps away, and comes back with: and the second item? The agent has no idea. Every call starts from zero." },
        { say: "The server crashes in the middle of a run. The whole run starts over." },
        { say: "After one crash and an automatic retry, a forty dollar refund is issued twice.", tone: "excite" },
        { say: "And by message sixty, every call carries forty thousand tokens. Slower, and pricier, every turn. Four problems, four ideas interviewers love.", tone: "key" },
      ],
    },
    {
      kind: "title",
      eyebrow: "AI Stack · Chapter 6",
      title: "Agents that remember",
      subtitle: "checkpoints, idempotency, memory, fan-out, teams",
      beats: [{ say: "Chapter six. Agents that remember." }],
    },
    {
      kind: "bullets",
      title: "By the end, you can answer",
      firstItemStep: 1,
      items: [
        { icon: "💾", text: "How do checkpoints and threads make agents durable?" },
        { icon: "🔂", text: "Why isn't it exactly-once, and what is idempotency?" },
        { icon: "🧠", text: "Short-term vs long-term memory; context engineering" },
        { icon: "👥", text: "Map-reduce fan-out, and when to use several agents" },
      ],
      beats: [
        { say: "By the end, you'll be able to answer these." },
        { say: "How checkpoints and threads make an agent durable." },
        { say: "Why that isn't exactly once, and what idempotency means." },
        { say: "Short term versus long term memory, and what context engineering is." },
        { say: "And how to fan work out in parallel, and when several agents beat one." },
      ],
    },

    // ------------------------------------------------------------ 1
    { kind: "section", num: "1", title: "Save the game: checkpoints and threads", beats: [{ say: "Video games solved this long ago. You don't replay the whole game after losing a level. You load the last save." }] },
    {
      kind: "custom",
      name: "a6save",
      beats: [
        {
          say: "LangGraph does the same. Each conversation is a thread, named by a thread id you choose. Call the graph again with the same thread id, and it continues where it left off. That alone fixes, and the second item?",
          term: { word: "Thread", meaning: "one conversation's chain of saved states" },
        },
        {
          say: "A checkpointer saves the whole state to a database after every super step. Each save is a checkpoint. In production, a real database, like the Postgres saver. The in memory saver is for tests only.",
          term: { word: "Checkpointer", meaning: "saves the state after every step" },
        },
        { say: "Now the server crashes, right in the middle of issue refund." },
        { say: "Resume on the same thread. Classify, get order, and check policy are not repeated. But notice: the interrupted step runs again, from its first line.", tone: "key" },
      ],
    },
    {
      kind: "compare",
      title: "How often to save: durability",
      cols: [
        { title: "exit", icon: "🏁", tone: "red", items: ["save when the run ends or pauses", "fastest; a crash loses the run"] },
        { title: "async", icon: "⏩", tone: "blue", items: ["save in the background while the next step runs", "a sensible default"] },
        { title: "sync", icon: "🔒", tone: "green", items: ["save before the next step starts", "long runs, side effects, waiting for a person"] },
      ],
      beats: [
        { say: "How often to save is a setting called durability. Exit: save only when the run finishes or pauses. Fastest, but a crash loses everything." },
        { say: "Async: save in the background while the next step runs. A sensible default." },
        { say: "Sync: save before the next step starts. Safest. Use it for expensive runs, anything with side effects, and anything waiting for a person.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 2
    { kind: "section", num: "2", title: "Safe to repeat: idempotency", beats: [{ say: "So if the interrupted step was issue refund, what happened?", tone: "ask" }] },
    {
      kind: "custom",
      name: "a6lift",
      beats: [
        {
          say: "Think of a lift button. Press it five times, and the lift comes once. Repeating it has no extra effect. That's idempotent.",
          term: { word: "Idempotent", meaning: "safe to repeat: no extra effect" },
        },
        { say: "Here's the broken version. Issue refund calls the payments service. Re run the step after a crash, and the customer is refunded twice." },
        {
          say: "The fix: send an idempotency key, built from things that don't change on a retry: the order and the case. Not a random id, and not a timestamp.",
          term: { word: "Idempotency key", meaning: "a stable id that makes repeats harmless" },
        },
        { say: "The payments service remembers every key it has processed. The first call refunds forty dollars. The retry sees a known key, and just returns the first result.", tone: "key" },
      ],
    },
    {
      kind: "bullets",
      title: "Other ways to make steps safe to repeat",
      firstItemStep: 1,
      items: [
        { icon: "🗃️", text: "Upserts keyed by something deterministic" },
        { icon: "🧩", text: "Each side effect in its own small step", sub: "a later failure won't re-run it" },
        { icon: "⏸️", text: "Side effects after a pause, not before it" },
        { icon: "📦", text: "@task: the result is saved and reused on resume" },
      ],
      beats: [
        { say: "Other ways to the same safety." },
        { say: "Database upserts, keyed by something deterministic: insert, or update if the row exists." },
        { say: "Put each side effect in its own small step, so a later failure doesn't re run it." },
        { say: "Place side effects after a pause for approval, never before it. Chapter seven shows why." },
        { say: "And wrap work in LangGraph's task, whose result is saved and reused on resume, instead of redone." },
      ],
    },
    {
      kind: "trap",
      myth: "The checkpointer gives exactly-once execution.",
      truth: "It makes runs resumable, not exactly-once. The interrupted step is redone, so outside effects are safe only if they're idempotent.",
      beats: [
        { say: "The classic trap: the checkpointer gives exactly once execution." },
        { say: "No. It makes runs resumable. The interrupted step is redone, so anything outside the graph is safe only if it's idempotent.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "a6time",
      beats: [
        { say: "Saved state brings two gifts. Every checkpoint is kept, so you can list a thread's whole history." },
        {
          say: "Why did the agent give that wrong answer? Open the checkpoint from that moment, and see exactly what it saw. That's time travel.",
          term: { word: "Time travel", meaning: "inspect or replay a thread from any checkpoint" },
        },
        { say: "You can also correct the state at an old checkpoint and continue. That forks a new branch, and later steps, model calls included, run again." },
        {
          say: "And one thread must run one thing at a time. A customer sends a second message before the first answer arrives. Choose on purpose: reject it, queue it, interrupt the first run, or roll it back and start fresh.",
          term: { word: "Double-texting", meaning: "a new message while a run is active" },
        },
      ],
    },

    // ------------------------------------------------------------ 3
    { kind: "section", num: "3", title: "Context engineering", beats: [{ say: "Now the slow, expensive conversations." }] },
    {
      kind: "custom",
      name: "a6context",
      beats: [
        {
          say: "Context engineering is deciding exactly what goes into the context window on every call. In a multi step agent, it matters more than the wording of the prompt. And there are four moves. Write: save notes outside the window, in a scratchpad or a memory store.",
          term: { word: "Context engineering", meaning: "choosing what enters the window, each call" },
        },
        { say: "Select: pull in only what this step needs. The relevant memories, the relevant documents, even the relevant tools." },
        { say: "Compress: summarize old turns, and trim tool output once it's been used." },
        { say: "Isolate: split the work across sub agents, or separate state fields, so each context stays small and focused.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "a6window",
      beats: [
        {
          say: "Short term memory is the current conversation. At sixty messages, it's forty thousand tokens, and the order number from message one is buried.",
          term: { word: "Short-term memory", meaning: "the current thread's messages" },
        },
        { say: "Keep recent messages word for word, and replace older ones with a summary." },
        { say: "Pin key facts, like the order id and the customer id, in their own state fields, so trimming can never drop them." },
        { say: "And tool outputs are usually the biggest consumers. Clear them once used, and keep big ones in a store, with only a reference in the chat. Then order the context with fixed parts first, so prompt caching works.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 4
    { kind: "section", num: "4", title: "Long-term memory", beats: [{ say: "Threads end. Some things should be remembered anyway." }] },
    {
      kind: "custom",
      name: "a6store",
      beats: [
        {
          say: "Long term memory lives in a store: JSON documents under namespaces, like customers, c nine eight one. Readable from any thread, and searchable by meaning. Each fact keeps a timestamp and a source.",
          term: { word: "Long-term memory", meaning: "facts kept across threads, in a store" },
        },
        { say: "Three kinds are commonly named. Semantic: facts, like prefers email. Episodic: past experiences, like how the last dispute was solved. And procedural: how to behave, usually the instructions themselves." },
        { say: "When to write them is a design choice. In the hot path, the agent calls a save memory tool mid chat: immediate, but slower. Or in the background, a job extracts memories after the chat: no added latency, slightly delayed.", tone: "key" },
      ],
    },
    {
      kind: "compare",
      title: "What goes wrong with memory",
      cols: [
        { title: "Stale", icon: "⏳", tone: "amber", items: ["old facts used confidently", "timestamps; newer wins"] },
        { title: "Private", icon: "🔐", tone: "blue", items: ["memories are personal data", "users can see and delete them"] },
        { title: "Poisoned", icon: "☠️", tone: "red", items: ["planted text saved as memory", "treat memory writes as untrusted"] },
        { title: "Bloated", icon: "🎈", tone: "purple", items: ["loading everything", "retrieve a few relevant ones"] },
      ],
      beats: [
        { say: "What goes wrong, and the guard for each. Stale memories used with confidence: keep timestamps, and let newer facts win." },
        { say: "Privacy: memories about people are personal data. Users must be able to see and delete them." },
        { say: "Poisoning: text planted by an attacker and saved as a memory affects every future conversation. Treat memory writes as untrusted." },
        { say: "And bloat: retrieve a few relevant memories. Never load them all." },
      ],
    },
    {
      kind: "trap",
      myth: "Models have a million-token window now, so memory is solved.",
      truth: "Cost and latency grow with every token, and quality falls as the context fills with irrelevant history. Memory is about choosing.",
      beats: [
        { say: "And the trap: models have a million token window now, so memory is solved." },
        { say: "Cost and latency grow with every token, and quality falls as the window fills with irrelevant history. Memory is about choosing what to bring back.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 5
    { kind: "section", num: "5", title: "Bigger workflows: fan-out", beats: [{ say: "A new job: every Monday, summarize last week's five hundred complaint emails into one report." }] },
    {
      kind: "custom",
      name: "a6fanout",
      beats: [
        { say: "A loop, one email at a time, takes an hour. But the pieces are independent, and their number changes every week." },
        {
          say: "That's map reduce. In LangGraph, a conditional edge returns a list of Send objects, one per email. Each Send starts its own run of the summarize node, and they all run in the same round.",
          term: { word: "Send", meaning: "start one node run per item, in parallel" },
        },
        {
          say: "A list reducer collects all five hundred summaries, and combine runs once, after every branch finishes.",
          term: { word: "Map-reduce", meaning: "same step on every piece, then combine" },
        },
        { say: "Production details: cap parallelism below the provider's rate limit, attach a retry policy with backoff, and with a checkpointer, finished branches aren't redone after a crash.", tone: "key" },
      ],
    },
    {
      kind: "compare",
      title: "Two more building blocks",
      cols: [
        { title: "Subgraphs", icon: "🧩", tone: "purple", items: ["a compiled graph used as one node", "shared fields flow in and out by name", "scratch fields stay private"] },
        { title: "Streaming", icon: "📡", tone: "blue", items: ["messages: the model's words as they come", "updates: each step's changes → status lines", "custom: “summarised 120 of 500”"] },
      ],
      footer: "the server forwards the stream to the browser over Server-Sent Events",
      beats: [
        {
          say: "Two more building blocks. A subgraph is a whole compiled graph used as one node. Retrieve, grade, rewrite becomes one reusable piece. Fields shared by name flow in and out; its scratch fields stay private.",
          term: { word: "Subgraph", meaning: "a graph used as a node in another" },
        },
        { say: "And streaming. Stream the model's words as they're generated. Stream each step's updates, which a UI turns into status lines. And stream your own events, like: summarized a hundred and twenty of five hundred." },
        { say: "The server forwards them to the browser over server sent events: a simple one way stream over HTTP.", tone: "aside" },
      ],
    },

    // ------------------------------------------------------------ 6
    { kind: "section", num: "6", title: "One agent or a team?", beats: [{ say: "Finally, the question every team asks: should we use several agents?", tone: "ask" }] },
    {
      kind: "custom",
      name: "a6team",
      beats: [
        {
          say: "Three common shapes. A supervisor: a manager agent sees every turn, hands work to a worker, and decides what's next. Easy to log and reason about, with one extra hop each time.",
          term: { word: "Supervisor", meaning: "a manager agent routes work to workers" },
        },
        {
          say: "Handoffs, sometimes called a swarm: the active agent passes control directly to another. Faster, but company wide rules are harder to enforce.",
          term: { word: "Handoff", meaning: "one agent passes control to another" },
        },
        { say: "And agent as a tool: specialists are tools of one main agent, and return only summaries, so the main agent keeps the whole picture." },
      ],
    },
    {
      kind: "compare",
      title: "When does splitting help?",
      cols: [
        { title: "Helps", icon: "✅", tone: "green", items: ["parallel, separable work: search ten sources at once", "one context can't hold all the work", "roles need different tools or permissions"] },
        { title: "Hurts", icon: "⚠️", tone: "red", items: ["steps depend on each other's decisions", "a decision inside one agent is invisible to others", "multi-agent runs use ~15× the tokens of a chat (Anthropic)"] },
      ],
      footer: "start with one agent and good tools; split when a measured limit forces it",
      beats: [
        { say: "When does splitting help? When work is parallel and separable, like searching ten sources at once. When one context window can't hold all the intermediate work. Or when roles need different tools and permissions." },
        { say: "When does it hurt? When steps depend on each other's decisions. A decision made inside one agent's context is invisible to the others, so they act on different assumptions. And it's expensive: Anthropic reported multi agent systems using about fifteen times the tokens of a chat." },
        { say: "So start with one agent and good tools. Split when a measured limit forces you to.", tone: "key" },
      ],
    },
    {
      kind: "compare",
      title: "Deep agents: four ingredients",
      cols: [
        { title: "A plan", icon: "📋", tone: "blue", items: ["a to-do list tool", "keeps long tasks on track"] },
        { title: "Sub-agents", icon: "👥", tone: "purple", items: ["isolated context per sub-task", "only summaries come back"] },
        { title: "A file system", icon: "🗂️", tone: "green", items: ["notes and results outside the window", "write, then select"] },
        { title: "A detailed prompt", icon: "📜", tone: "amber", items: ["long, specific instructions", "how to use each tool"] },
      ],
      beats: [
        {
          say: "You'll also hear about deep agents, the pattern behind long running research and coding agents. Four ingredients. A planning tool, like a to do list, that keeps long tasks on track.",
          term: { word: "Deep agent", meaning: "plan + sub-agents + files + detailed prompt" },
        },
        { say: "Sub agents, each with its own isolated context, returning only summaries." },
        { say: "A file system, so notes and results live outside the window. That's write, then select." },
        { say: "And a long, detailed system prompt. Notice: it's context engineering, all the way down.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 7
    { kind: "section", num: "7", title: "Interview round", beats: [{ say: "Interview round.", tone: "excite" }] },
    {
      kind: "sayit",
      q: "How do you make an agent survive crashes without refunding twice?",
      lines: [
        "Run it as a graph with a database-backed checkpointer and a thread id per conversation.",
        "State is saved after every super-step; on restart, resume the same thread.",
        "The interrupted step re-runs from its first line, so it's at-least-once, not exactly-once.",
        "Every side effect gets an idempotency key from stable ids; the service ignores repeats.",
        "Keep side effects in small steps, after any approval pause; use sync durability for them.",
      ],
      beats: [
        { say: "How do you make an agent survive crashes, without refunding twice?" },
        { say: "Run it as a graph, with a database backed checkpointer, and one thread id per conversation." },
        { say: "State is saved after every super step. On restart, resume the same thread." },
        { say: "The interrupted step re-runs from its first line. So it's at least once, not exactly once." },
        { say: "So every side effect gets an idempotency key, built from stable ids, and the service ignores repeats." },
        { say: "And keep side effects in small steps, after any approval pause, with sync durability.", tone: "key" },
      ],
    },
    {
      kind: "drill",
      items: [
        { q: "Checkpoint vs thread?", a: "A checkpoint is one saved snapshot of state; a thread is a conversation's chain of them, keyed by thread_id." },
        { q: "Does a checkpointer give exactly-once?", a: "No: resumable, at-least-once. Make side effects idempotent." },
        { q: "What makes a good idempotency key?", a: "Stable ids of the logical action (order + case), never a random id or timestamp." },
        { q: "The four context-engineering moves?", a: "Write, select, compress, isolate." },
        { q: "Semantic vs episodic memory?", a: "Semantic: facts. Episodic: past experiences, like how a case was solved." },
        { q: "How do you fan out over 500 items in LangGraph?", a: "A conditional edge returns Send objects; a list reducer collects; a combine node reduces." },
        { q: "Supervisor or handoffs?", a: "Supervisor: central control and logging. Handoffs: faster, rules harder to enforce." },
      ],
      beats: [
        { say: "Rapid fire. Checkpoint versus thread?", tone: "ask", hold: 2.5 },
        { say: "A checkpoint is one saved snapshot of the state. A thread is a conversation's chain of them, keyed by thread id." },
        { say: "Does a checkpointer give exactly once execution?", tone: "ask", hold: 2.5 },
        { say: "No. It's resumable, at least once. Make side effects idempotent." },
        { say: "What makes a good idempotency key?", tone: "ask", hold: 2.5 },
        { say: "Stable ids of the logical action, like the order and the case. Never a random id, or a timestamp." },
        { say: "The four context engineering moves?", tone: "ask", hold: 2.5 },
        { say: "Write, select, compress, and isolate." },
        { say: "Semantic versus episodic memory?", tone: "ask", hold: 2.5 },
        { say: "Semantic is facts. Episodic is past experiences, like how a case was solved." },
        { say: "How do you fan out over five hundred items in LangGraph?", tone: "ask", hold: 2.5 },
        { say: "A conditional edge returns Send objects. A list reducer collects the results, and a combine node reduces them." },
        { say: "Last one. Supervisor, or handoffs?", tone: "ask", hold: 2.5 },
        { say: "A supervisor gives central control and logging. Handoffs are faster, but rules are harder to enforce.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "recap",
      props: {
        items: [
          ["💾", "Checkpoints + threads", "resume, don't restart"],
          ["🛗", "Idempotency", "keys make retries harmless"],
          ["🗜️", "Context engineering", "write, select, compress, isolate"],
          ["🧠", "Long-term memory", "a store, with timestamps"],
          ["🌿", "Send", "map-reduce fan-out"],
          ["👥", "Multi-agent", "only when a limit forces it"],
        ],
      },
      beats: [
        { say: "Let's lock it in." },
        { say: "Checkpoints and threads let a run resume, not restart." },
        { say: "Idempotency keys make retries harmless." },
        { say: "Context engineering: write, select, compress, isolate." },
        { say: "Long term memory lives in a store, with timestamps and sources." },
        { say: "Send fans work out in parallel, map reduce style." },
        { say: "And use several agents only when a measured limit forces it.", tone: "key" },
      ],
    },
    {
      kind: "pause",
      question: "A refund over $200 must wait for a manager's approval, which can take hours. The run can't block a server that long. What do you do?",
      beats: [
        { say: "One more requirement arrives. Any refund over two hundred dollars needs a manager's approval. That can take hours." },
        { say: "The run can't block a server that long. So what do you do?", tone: "ask", hold: 3 },
      ],
    },
    {
      kind: "title",
      eyebrow: "Next",
      title: "Chapter 7 — Ask before acting",
      subtitle: "interrupts, approvals, and stale data",
      beats: [{ say: "That's chapter seven. See you there.", tone: "excite" }],
    },
  ],
};
