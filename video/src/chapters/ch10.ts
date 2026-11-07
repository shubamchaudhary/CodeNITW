import type { Chapter } from "../lib/types.ts";

// Chapter 10 of the AI Stack: designing LLM systems, interview-ready. Two
// worked designs: document Q&A for 500 customer companies, and an agent that
// changes subscriptions across billing and CRM.

export const ch10: Chapter = {
  id: "ch10",
  title: "Designing LLM systems",
  voice: "en-US-AndrewMultilingualNeural",
  next: "Chapter 11 — Safe, fast, affordable",
  scenes: [
    {
      kind: "custom",
      name: "a10hook",
      beats: [
        { say: "Forty five minutes, and a whiteboard." },
        { say: "Design an assistant for five hundred customer companies. A million questions a day. Each company sees only its own documents. First words within two seconds." },
        { say: "That's the shape of an LLM system design interview. And the strongest answers don't start with the model. They start with the people, the numbers, and the cost of being wrong.", tone: "key" },
      ],
    },
    {
      kind: "title",
      eyebrow: "AI Stack · Chapter 10",
      title: "Designing LLM systems",
      subtitle: "a frame, two worked designs, and the traps",
      beats: [{ say: "Chapter ten. Designing LLM systems." }],
    },
    {
      kind: "bullets",
      title: "By the end, you can answer",
      firstItemStep: 1,
      items: [
        { icon: "🧭", text: "A frame you can run in any design interview" },
        { icon: "🏢", text: "Many tenants: isolation, permissions, freshness" },
        { icon: "🤖", text: "Workflow or agent, and how to cage an agent" },
        { icon: "🔄", text: "An agent that changes data across two systems" },
      ],
      beats: [
        { say: "By the end, you'll be able to answer these." },
        { say: "A frame you can run in any design interview." },
        { say: "How to serve many tenants: isolation, permissions, and freshness." },
        { say: "Workflow or agent, and how to cage an agent." },
        { say: "And how an agent can change data across two systems, safely." },
      ],
    },

    // ------------------------------------------------------------ 1
    { kind: "section", num: "1", title: "A frame you can run every time", beats: [{ say: "Weak answers jump to boxes: a vector database, an LLM, done. Here's a structure that never forgets the important parts." }] },
    {
      kind: "custom",
      name: "a10steps",
      beats: [
        { say: "Seven steps, said out loud. First, clarify: who uses it, how many, how fast, and what does a wrong answer cost? Then the success metric, and the baseline: what happens today, without it. About five minutes." },
        { say: "Then the simplest design that works, and the components and data flow. About fifteen minutes." },
        { say: "Then the eval plan, the cost and latency budget with real numbers, and finally failures, fallbacks and launch. Another fifteen." },
        { say: "Most weak answers forget three things: evals, guardrails, and fallbacks. This frame puts them on the board every time.", tone: "key" },
      ],
    },
    {
      kind: "compare",
      title: "Simplest design first: climb only when you must",
      cols: [
        { title: "One model call", icon: "1️⃣", tone: "green", items: ["with a good prompt", "classify, extract, draft"] },
        { title: "+ Retrieval", icon: "📚", tone: "blue", items: ["facts it never saw", "RAG"] },
        { title: "Workflow", icon: "🛤️", tone: "purple", items: ["your code decides the steps", "testable, predictable"] },
        { title: "Agent", icon: "🤖", tone: "amber", items: ["the model decides the steps", "only when steps can't be known"] },
      ],
      footer: "justify every step up the ladder",
      beats: [
        { say: "Step three deserves its own picture. Start with one model call, and a good prompt." },
        { say: "Add retrieval if it needs facts it never saw." },
        { say: "A workflow, where your code decides the steps, if the task has several known steps." },
        { say: "And an agent, where the model decides the steps, only when the steps genuinely can't be known in advance. Justify every step up the ladder.", tone: "key" },
      ],
    },
    {
      kind: "numbers",
      title: "Napkin maths, out loud",
      items: [
        { value: "12/s", label: "average", sub: "1M questions / 86,400 s" },
        { value: "50/s", label: "peak", sub: "office hours, about 4×" },
        { value: "200", label: "in flight", sub: "50/s × 4 s each (Little's law)" },
        { value: "$16k", label: "per day", sub: "4K tokens in, 300 out, at $3 / $15 per M" },
      ],
      footer: "the peak in-flight number decides rate limits · input tokens dominate the bill",
      beats: [
        { say: "Now the numbers. A million questions a day is about twelve a second, on average." },
        { say: "But traffic bunches into office hours. Plan for a peak around fifty a second." },
        {
          say: "Little's law: requests in flight equal arrival rate times time per request. Fifty a second, four seconds each including streaming: two hundred in flight. That number, not the daily total, decides whether you hit the provider's limits.",
          term: { word: "Little's law", meaning: "in flight = arrival rate × time each" },
        },
        { say: "And cost. Four thousand input tokens and three hundred output per question, at three and fifteen dollars per million: about sixteen thousand dollars a day." },
        { say: "Say these are assumptions. Then notice: input tokens dominate the bill. That's where caching and shorter prompts will pay off.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 2
    { kind: "section", num: "2", title: "Design 1: document Q&A for 500 companies", beats: [{ say: "The most common applied AI design question. Let's run it." }] },
    {
      kind: "flow",
      title: "Keep the index fresh; answer every question",
      cols: 5,
      rows: 2,
      nodeW: 320,
      nodeH: 150,
      nodes: [
        { id: "SRC", c: 0, r: 0, label: "Source change\ncreated, edited, deleted,\naccess changed", tone: "purple" },
        { id: "Q", c: 1, r: 0, label: "Event queue", tone: "purple" },
        { id: "W", c: 2, r: 0, label: "Workers\nparse, chunk, embed", tone: "purple" },
        { id: "IDX", c: 3, r: 0, label: "Index\ntenant, doc, version,\naccess list", tone: "amber" },
        { id: "U", c: 0, r: 1, label: "User question", tone: "blue" },
        { id: "GW", c: 1, r: 1, label: "LLM gateway\nauth, quotas, routing,\ncache, logs", tone: "blue" },
        { id: "RET", c: 2, r: 1, label: "Hybrid search\nfiltered by tenant\n+ groups, rerank", tone: "blue" },
        { id: "LLM", c: 3, r: 1, label: "Model\nanswer + citations", tone: "green" },
        { id: "CHK", c: 4, r: 1, label: "Groundedness check\nthen stream", tone: "green" },
      ],
      edges: [
        { from: "SRC", to: "Q" },
        { from: "Q", to: "W" },
        { from: "W", to: "IDX" },
        { from: "U", to: "GW" },
        { from: "GW", to: "RET" },
        { from: "IDX", to: "RET" },
        { from: "RET", to: "LLM" },
        { from: "LLM", to: "CHK" },
      ],
      show: [["SRC", "Q", "W", "IDX"], ["U", "GW"], ["RET"], ["LLM", "CHK"]],
      beats: [
        { say: "The ingestion path. Every change to a document, created, edited, deleted, or access changed, becomes an event on a queue. Workers parse, chunk and embed, and store each chunk tagged with its tenant, document, version, and access list. An update deletes the old chunks. A delete removes them everywhere, caches included." },
        {
          say: "The question path starts at an LLM gateway: one entry point in front of all models. It checks who's calling, applies the tenant's quota, picks the model, serves caches, and logs.",
          term: { word: "LLM gateway", meaning: "one front door: auth, quotas, routing, cache" },
        },
        {
          say: "Hybrid search runs, filtered to the user's tenant and groups, then reranks to five chunks. The access list on every chunk is what makes that filter possible.",
          term: { word: "Access list", meaning: "the groups allowed to see a chunk" },
        },
        { say: "The model answers with citations, a groundedness check removes unsupported sentences, and the answer streams. Every step writes to the trace.", tone: "key" },
      ],
    },
    {
      kind: "compare",
      title: "Keeping tenants apart",
      cols: [
        { title: "Index per tenant", icon: "🧱", tone: "green", items: ["strong isolation", "no filtered-search trap", "deleting a tenant is trivial", "500 indexes; small ones waste resources"] },
        { title: "Shared index + filter", icon: "🗂️", tone: "amber", items: ["efficient", "every search is filtered", "one bug leaks data across tenants"] },
        { title: "Hybrid", icon: "⚖️", tone: "blue", items: ["big tenants get their own partition", "the rest share", "filter enforced below the app: row-level security"] },
      ],
      beats: [
        { say: "How do you keep tenants apart? An index per tenant: strong isolation, no filtered search trap, and deleting a tenant's data is trivial. But five hundred indexes to run." },
        { say: "One shared index with a mandatory filter: efficient, but every search is a filtered vector search, and one bug leaks data across companies." },
        {
          say: "The usual answer is a hybrid. Large tenants get their own partition, small ones share, and the tenant filter is enforced below the application, for example by Postgres row level security, which filters rows per user automatically.",
          tone: "key",
          term: { word: "Row-level security", meaning: "the database filters rows per user" },
        },
      ],
    },
    {
      kind: "trap",
      myth: "Tell the model: “only use documents the user is allowed to see.”",
      truth: "Permissions are enforced at retrieval, never in the prompt. A chunk the user may not see must never reach the prompt.",
      why: "The model can't check permissions, and injected text can override instructions. Store access by group; resolve groups at question time, so revoking a person needs no re-indexing.",
      beats: [
        { say: "The classic trap: just tell the model, only use documents the user is allowed to see." },
        { say: "Permissions are enforced at retrieval, never in the prompt. A chunk the user may not see must never reach the prompt at all.", tone: "key" },
        { say: "The model can't check permissions, and injected text can override instructions. Store access by group, and resolve the user's groups at question time, so revoking one person needs no re-indexing." },
      ],
    },
    {
      kind: "custom",
      name: "a10budget",
      beats: [
        { say: "Step six, the time budget. First words within two thousand milliseconds. Identity and groups, fifty. Embed the question, thirty. Hybrid search, eighty. Rerank, a hundred and fifty. Build the prompt, twenty. And the model's first token: six hundred to twelve hundred. It fits." },
        { say: "Then stream the rest. Over budget? Skip reranking for simple questions, send fewer chunks, use a faster model, or cache frequent questions.", tone: "key" },
      ],
    },
    {
      kind: "compare",
      title: "Step 7: when things fail",
      cols: [
        { title: "Vector index down", icon: "🗄️", tone: "blue", items: ["keyword-only search", "with a banner"] },
        { title: "Provider down", icon: "☁️", tone: "red", items: ["fallback model via the gateway", "tested on the golden set", "last resort: top documents as links"] },
        { title: "Doc deleted", icon: "🗑️", tone: "amber", items: ["an event, within 5 minutes", "nightly reconcile catches misses"] },
        { title: "Quiet drift", icon: "📉", tone: "purple", items: ["pinned model versions", "online evals per tenant"] },
      ],
      beats: [
        { say: "Step seven: when things fail. Vector index down: fall back to keyword search, with a banner." },
        { say: "Model provider down, or rate limited: a fallback model through the gateway, already tested on the golden set. If everything fails, show the top documents as links." },
        { say: "A document deleted, or access revoked: an event processed within minutes, plus a nightly job comparing sources with the index, to catch missed events." },
        { say: "And quality drifting quietly: pinned model versions, and online evals per tenant.", tone: "key" },
      ],
    },
    {
      kind: "compare",
      title: "Scaling further",
      cols: [
        { title: "Hot tenants", icon: "🔥", tone: "red", items: ["one tenant sends 30% of traffic", "own partition + own rate-limit budget"] },
        { title: "Three caches", icon: "⚡", tone: "green", items: ["provider prompt cache: fixed instructions", "embedding cache: repeated questions", "answer cache: per tenant + group, keyed to doc versions"] },
        { title: "Data lifecycle", icon: "♻️", tone: "blue", items: ["retention for traces and chats", "full deletion when a tenant leaves", "regional data where required"] },
      ],
      beats: [
        { say: "Scaling further. Hot tenants: if one company sends thirty percent of traffic, give it its own partition and rate limit budget, so its peaks don't slow everyone else." },
        {
          say: "Caching at three levels. The provider's prompt cache for fixed instructions. An embedding cache for repeated questions. And an answer cache, even a semantic cache that matches similar questions, but kept separate per tenant and permission group, and keyed to the document versions it used, so an update invalidates exactly the right answers.",
          term: { word: "Semantic cache", meaning: "reuse answers for similar questions" },
        },
        { say: "And the data lifecycle: retention for traces and conversations, complete deletion when a tenant leaves, and regional storage where contracts require it." },
      ],
    },

    // ------------------------------------------------------------ 3
    { kind: "section", num: "3", title: "Workflow or agent?", beats: [{ say: "Then the mandate from an offsite: make it fully autonomous. Let the AI decide everything. What do you say?", tone: "ask" }] },
    {
      kind: "compare",
      title: "Who decides the steps?",
      cols: [
        { title: "Workflow", icon: "🛤️", tone: "blue", items: ["your code decides the order", "model calls at fixed points", "cheaper, faster, testable step by step"] },
        { title: "Agent", icon: "🤖", tone: "amber", items: ["the model decides at run time", "open-ended tasks", "mistakes cheap to catch, or gated"] },
      ],
      beats: [
        {
          say: "In a workflow, your code decides the order of steps, and model calls happen at fixed points. Cheaper, faster, predictable, and testable step by step.",
          term: { word: "Workflow", meaning: "code decides the steps; models fill them" },
        },
        { say: "In an agent, the model decides the steps at run time. Agents earn their place on open ended tasks, where the steps can't be known in advance, and where mistakes are cheap to catch, or gated by approval.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "a10patterns",
      beats: [
        { say: "Anthropic's widely cited guide, building effective agents, names five workflow patterns. Prompt chaining: a fixed sequence of calls, with code checking between them." },
        { say: "Routing: classify first, then send down the right path." },
        { say: "Parallelization: split independent work, or ask several times and vote." },
        {
          say: "Orchestrator workers: one model breaks a task into subtasks at run time, and workers handle each.",
          term: { word: "Orchestrator-workers", meaning: "a model splits work at run time" },
        },
        { say: "And evaluator optimizer: draft, critique against criteria, and revise until it passes." },
      ],
    },
    {
      kind: "compare",
      title: "How agents plan",
      cols: [
        { title: "ReAct", icon: "🔁", tone: "blue", items: ["reason, act, observe, repeat", "flexible; can wander on long tasks"] },
        { title: "Plan-and-execute", icon: "📋", tone: "green", items: ["write the plan first, then run it", "revise only when a step fails", "predictable; a smaller model can execute"] },
        { title: "Reflection", icon: "🪞", tone: "purple", items: ["check the result, try again", "pays off with a reliable check, like tests"] },
      ],
      beats: [
        {
          say: "How do agents plan? ReAct, reason plus act, thinks briefly, makes one tool call, looks at the result, and thinks again. Flexible, but it can wander on long tasks.",
          term: { word: "ReAct", meaning: "reason, act, observe, repeat" },
        },
        {
          say: "Plan and execute writes the whole plan first, runs the steps, and revises only when a step fails. More predictable, easier to check, and cheaper when a smaller model executes.",
          term: { word: "Plan-and-execute", meaning: "plan up front, then run the steps" },
        },
        { say: "And reflection adds a check at the end that sends work back for another try. It pays off when the check is reliable, like running tests on generated code, and mostly adds cost when it isn't." },
      ],
    },
    {
      kind: "custom",
      name: "a10cage",
      beats: [
        { say: "Whatever the planner, every agent needs a cage. Step, time and cost limits. Allow listed tools only. And it acts with the user's own permissions, never more." },
        { say: "Approval before risky writes. Verify outcomes in the system of record. And audit every action." },
        { say: "All enforced in code, none in the prompt. So the answer to the offsite: the assistant stays a workflow, because its steps are known. Autonomy goes where steps aren't known, and even there, inside the cage.", tone: "key" },
      ],
    },
    {
      kind: "bullets",
      title: "From “12-Factor Agents” (HumanLayer)",
      firstItemStep: 1,
      items: [
        { icon: "📝", text: "Own your prompts and your context window" },
        { icon: "🧾", text: "Tool calls are just structured output" },
        { icon: "🙋", text: "Contact humans with tool calls" },
        { icon: "🎯", text: "Small, focused agents beat one giant loop" },
      ],
      beats: [
        { say: "A useful set of principles comes from the twelve factor agents guide." },
        { say: "Own your prompts, and own your context window. Don't let a framework hide what the model sees." },
        { say: "Tool calls are just structured output: JSON your code decides how to execute." },
        { say: "Contact humans with tool calls. Asking for approval is just another tool, so pausing is ordinary control flow." },
        { say: "And small, focused agents beat one giant loop. And a last principle, from Anthropic: tools are an agent's whole view of the world. Teams often spend more time refining tools than prompts.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 4
    { kind: "section", num: "4", title: "Design 2: an agent that changes data", beats: [{ say: "The second classic question: design an agent that changes data in business systems, safely. Say, support reps ask an agent to change a customer's subscription." }] },
    {
      kind: "custom",
      name: "a10tools",
      beats: [
        { say: "Tools first, split cleanly between reading and writing. Query account: read only, through parameterized queries on allowed views. Simulate change: a what if on a copy, showing the new invoice." },
        { say: "Propose change writes to a staging overlay only. And commit change applies an approved proposal. The agent can't call it directly. Only the approval step can." },
        { say: "And every call carries the rep's identity, through the same permission checks as the normal admin screens. If the rep can't do it by hand, the agent can't do it either.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "a10saga",
      beats: [
        { say: "Now the hard part. Changing a plan touches the billing system and the CRM. No database transaction spans both. If the second call fails after the first succeeded, the data is half changed." },
        {
          say: "The standard answer is a saga: a sequence of steps, each with a compensating action that undoes it. Change the plan in billing. Update the CRM. Notify the customer, last, since an email can't be unsent.",
          term: { word: "Saga", meaning: "steps with compensating undo actions" },
        },
        { say: "The CRM update fails, for good." },
        {
          say: "So the earlier steps are undone, in reverse order: restore the old plan in billing. Each step is idempotent, and checkpoints record which steps completed, so a crash mid saga resumes, or undoes, correctly.",
          tone: "key",
          term: { word: "Compensating action", meaning: "a step that undoes an earlier step" },
        },
      ],
    },
    {
      kind: "compare",
      title: "Hosted model or your own?",
      cols: [
        { title: "Hosted API", icon: "☁️", tone: "blue", items: ["strongest models, no infrastructure", "pay per token", "data leaves your network; their limits, their uptime"] },
        { title: "Open weights, self-hosted", icon: "🖥️", tone: "green", items: ["full control of data", "cheaper at high, steady volume", "fine-tune freely; you run the serving stack"] },
      ],
      footer: "most start hosted, then move high-volume or sensitive tasks in-house when the numbers justify it",
      beats: [
        { say: "Interviewers often close with: hosted model, or your own? Hosted APIs give the strongest models with no infrastructure, paid per token. But data leaves your network, and you depend on their limits and uptime." },
        { say: "Open weight models you run yourself give full control of data, predictable cost at high, steady volume, and freedom to fine tune. But you run the serving stack, chapter twelve." },
        { say: "Most companies start hosted, and move specific high volume or sensitive tasks in house, when the numbers justify it.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 5
    { kind: "section", num: "5", title: "Interview round", beats: [{ say: "Interview round.", tone: "excite" }] },
    {
      kind: "sayit",
      q: "Design document Q&A for 500 companies, each seeing only its own data.",
      lines: [
        "Clarify scale, latency, freshness and the cost of a wrong answer; define success per tenant.",
        "Event-driven ingestion: chunks tagged with tenant, doc, version and access list.",
        "Gateway → hybrid search filtered by tenant and groups → rerank → cited answer → grounding check.",
        "Isolation below the app: partitions for big tenants, row-level security; never permissions in the prompt.",
        "Budget latency and cost with numbers; fallbacks per dependency; golden set, online evals, canary.",
      ],
      beats: [
        { say: "Design document Q and A, for five hundred companies, each seeing only its own data." },
        { say: "Clarify the scale, latency, freshness, and the cost of a wrong answer. And define success per tenant." },
        { say: "Event driven ingestion, with chunks tagged by tenant, document, version, and access list." },
        { say: "A gateway, then hybrid search filtered by tenant and groups, a rerank, a cited answer, and a groundedness check." },
        { say: "Isolation enforced below the application: partitions for big tenants, row level security. Never permissions in the prompt." },
        { say: "Then a latency and cost budget with numbers, fallbacks for each dependency, and a golden set, online evals, and a canary.", tone: "key" },
      ],
    },
    {
      kind: "drill",
      items: [
        { q: "1M requests a day, 4 s each. How many in flight at a 4× peak?", a: "≈ 46/s peak × 4 s ≈ 185, call it 200 (Little's law)." },
        { q: "Where are document permissions enforced?", a: "At retrieval, as a filter on every chunk's access list; never in the prompt." },
        { q: "Index per tenant or shared?", a: "Hybrid: big tenants partitioned, small ones shared, filter enforced by the database." },
        { q: "What does an LLM gateway do?", a: "Auth, quotas, model routing and fallback, caching, logging: one front door." },
        { q: "Workflow or agent?", a: "Workflow when steps are known; an agent only when they can't be, inside a cage." },
        { q: "Two systems, no shared transaction. How?", a: "A saga: idempotent steps with compensating actions, undone in reverse." },
        { q: "Risk of a semantic cache?", a: "Similar isn't same, and leaks across tenants; key by tenant and group, tie to doc versions." },
      ],
      beats: [
        { say: "Rapid fire. A million requests a day, four seconds each. How many in flight at a four times peak?", tone: "ask", hold: 3 },
        { say: "About forty six a second, times four seconds: about a hundred and eighty five. Call it two hundred. Little's law." },
        { say: "Where are document permissions enforced?", tone: "ask", hold: 2.5 },
        { say: "At retrieval, as a filter on every chunk's access list. Never in the prompt." },
        { say: "Index per tenant, or shared?", tone: "ask", hold: 2.5 },
        { say: "Usually a hybrid. Big tenants partitioned, small ones shared, with the filter enforced by the database." },
        { say: "What does an LLM gateway do?", tone: "ask", hold: 2.5 },
        { say: "Auth, quotas, model routing and fallback, caching, and logging. One front door." },
        { say: "Workflow, or agent?", tone: "ask", hold: 2.5 },
        { say: "A workflow when the steps are known. An agent only when they can't be, and inside a cage." },
        { say: "Two systems, no shared transaction. How do you change both safely?", tone: "ask", hold: 2.5 },
        { say: "A saga. Idempotent steps with compensating actions, undone in reverse order." },
        { say: "Last one. What's the risk of a semantic cache?", tone: "ask", hold: 2.5 },
        { say: "Similar isn't the same, and it can leak across tenants. Key it by tenant and group, and tie it to document versions.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "recap",
      props: {
        items: [
          ["🧭", "7-step frame", "clarify → launch"],
          ["🧮", "Napkin maths", "Little's law, tokens, dollars"],
          ["🔐", "Permissions", "at retrieval, never in the prompt"],
          ["🏢", "Tenants", "partitions + row-level security"],
          ["🛤️", "Workflow first", "agents only inside a cage"],
          ["🔄", "Saga", "compensate in reverse"],
        ],
      },
      beats: [
        { say: "Let's lock it in." },
        { say: "Run the seven step frame, from clarify to launch." },
        { say: "Do the napkin maths out loud: Little's law, tokens, dollars." },
        { say: "Enforce permissions at retrieval, never in the prompt." },
        { say: "Keep tenants apart with partitions and row level security." },
        { say: "Prefer workflows. Use agents only inside a cage." },
        { say: "And change two systems with a saga, compensating in reverse.", tone: "key" },
      ],
    },
    {
      kind: "pause",
      question: "Two emails arrive. Security: a customer email hid white-on-white text telling the assistant to forward contracts. Finance: the first monthly bill, and 4-second waits. Which first?",
      beats: [
        { say: "The design review goes well. Then two emails arrive. Security: a document hid white on white text, telling the assistant to forward contracts to an outside address. And the assistant can send email." },
        { say: "Finance: the first monthly bill, and users now wait four seconds for the first word. Which do you handle first, and how?", tone: "ask", hold: 3 },
      ],
    },
    {
      kind: "title",
      eyebrow: "Next",
      title: "Chapter 11 — Safe, fast, affordable",
      subtitle: "prompt injection, guardrails, cost and latency",
      beats: [{ say: "That's chapter eleven. See you there.", tone: "excite" }],
    },
  ],
};
