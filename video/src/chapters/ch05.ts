import type { Chapter } from "../lib/types.ts";

// Chapter 5 of the AI Stack: from assistant to agent, interview-ready. The
// running example is an airline support agent that looks things up and acts
// through tools.

const LOOP = `MAX_STEPS = 8

def run_agent(client, question, tools, impls, schemas):
    messages = [{"role": "user", "content": question}]
    for step in range(MAX_STEPS):
        resp = client.messages.create(model=MODEL, tools=tools,
                                      messages=messages)
        messages.append({"role": "assistant", "content": resp.content})
        calls = [b for b in resp.content if b.type == "tool_use"]
        if not calls:
            return "".join(b.text for b in resp.content if b.type == "text")
        results = []
        for call in calls:
            try:
                args = schemas[call.name](**call.input)   # validate first
                out = impls[call.name](args)
            except Exception as e:
                out = f"error: {e}"                       # errors are results
            results.append({"type": "tool_result",
                            "tool_use_id": call.id, "content": str(out)})
        messages.append({"role": "user", "content": results})
    return "Stopped: step limit reached."`;

export const ch05: Chapter = {
  id: "ch05",
  title: "From assistant to agent",
  voice: "en-US-AndrewMultilingualNeural",
  next: "Chapter 6 — Agents that remember",
  scenes: [
    {
      kind: "custom",
      name: "a5hook",
      beats: [
        { say: "A passenger writes to the airline's assistant: my flight A B one two three was cancelled. Rebook me on the next one. Do I get compensation?" },
        { say: "And our RAG assistant can only say: I answer from documents. Here's the rebooking policy." },
        { say: "The answers live in live systems. Flight status. The booking. And rebooking isn't even a question: it's an action. To handle this, the assistant has to become an agent.", tone: "key" },
      ],
    },
    {
      kind: "title",
      eyebrow: "AI Stack · Chapter 5",
      title: "From assistant to agent",
      subtitle: "tools, the agent loop, LangChain and LangGraph",
      beats: [{ say: "Chapter five. From assistant, to agent." }],
    },
    {
      kind: "bullets",
      title: "By the end, you can answer",
      firstItemStep: 1,
      items: [
        { icon: "🔧", text: "How does tool calling actually work?" },
        { icon: "🔁", text: "Write an agent loop: what must it include?" },
        { icon: "🧱", text: "LangChain vs LangGraph: when do you use which?" },
        { icon: "🛑", text: "How do you stop an agent looping or misusing tools?" },
      ],
      beats: [
        { say: "By the end, you'll be able to answer these." },
        { say: "How tool calling actually works, message by message." },
        { say: "How to write an agent loop, and what it must include." },
        { say: "LangChain versus LangGraph, and when you'd use each." },
        { say: "And how to stop an agent from looping, or misusing its tools." },
      ],
    },

    // ------------------------------------------------------------ 1
    { kind: "section", num: "1", title: "The model writes the order slip", beats: [{ say: "First, a tempting shortcut: give the model a database connection, and let it run queries. What could go wrong?", tone: "ask" }] },
    {
      kind: "custom",
      name: "a5slip",
      beats: [
        { say: "Everything. A model can be confused, can be tricked by text it reads, and can't be held accountable. So think of a restaurant instead. The customer writes an order slip. The waiter checks it. The kitchen cooks." },
        {
          say: "With tool calling, the model is the customer. It writes a request: which tool, with which arguments. Your code is the waiter, checking it, and the kitchen, running the real function.",
          term: { word: "Tool calling", meaning: "the model requests a function; your code runs it" },
        },
        { say: "The model never touches your systems. It only asks.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "a5toolcard",
      beats: [
        {
          say: "A tool is described to the model in three parts. A name: get flight status.",
          term: { word: "Tool", meaning: "a function described by name, description, schema" },
        },
        { say: "A description in plain words: what it does, and when to use it. The description is a prompt. It decides whether the model picks this tool." },
        {
          say: "And a schema: the exact shape of the arguments, written in JSON schema. Here, a flight number, matching a pattern.",
          term: { word: "JSON Schema", meaning: "a standard format describing data shapes" },
        },
        { say: "A tool called flights A P I gets misused. One whose description says what and when gets used correctly. And remember: every tool definition is sent with every request. More tools cost more tokens, and confuse the choice.", tone: "key" },
      ],
    },
    {
      kind: "seq",
      title: "One tool call, message by message",
      actors: [
        { id: "U", name: "Passenger", icon: "🧑" },
        { id: "A", name: "Your app", icon: "⚙️", tone: "blue" },
        { id: "S", name: "Flight service", icon: "✈️", tone: "green" },
        { id: "L", name: "LLM", icon: "🧠", tone: "purple" },
      ],
      msgs: [
        { from: "U", to: "A", label: "AB123 cancelled?", step: 0 },
        { from: "A", to: "L", label: "messages + tool definitions", step: 1 },
        { from: "L", to: "A", label: "tool_use: get_flight_status(AB123), id=t1", step: 2, tone: "amber", dash: true },
        { from: "A", to: "A", label: "validate args, check permissions", step: 3 },
        { from: "A", to: "S", label: "GET /flights/AB123", step: 3, tone: "green" },
        { from: "S", to: "A", label: "{status: cancelled}", step: 3, dash: true },
        { from: "A", to: "L", label: "tool_result id=t1: cancelled", step: 4 },
        { from: "L", to: "U", label: "“AB123 is cancelled. Next flight: AB125…”", step: 5, tone: "green", dash: true },
      ],
      beats: [
        { say: "Here's one tool call, message by message. The passenger asks about A B one two three." },
        { say: "Your app sends the conversation to the model, along with the tool definitions." },
        {
          say: "The model replies not with text, but with a tool call: the tool's name, the arguments, and an id. It has run nothing.",
          term: { word: "Tool call", meaning: "the model's request: name, arguments, id" },
        },
        { say: "Your app validates the arguments, checks this passenger may see this booking, and calls the real flight service." },
        { say: "The result goes back to the model as a tool result, tied to the same id." },
        { say: "And now the model answers in plain words. One reply can also request several tools at once. Run them in parallel, and return each result with its own id.", tone: "key" },
      ],
    },
    {
      kind: "compare",
      title: "What follows from “the model only asks”",
      cols: [
        { title: "Safety lives in code", icon: "🛡️", tone: "green", items: ["“refunds under €200” in a prompt is a suggestion", "a check inside issue_refund is a control"] },
        { title: "Arguments are untrusted", icon: "🧪", tone: "amber", items: ["validate types and ranges", "check this user may act on this booking", "never paste them into SQL or a shell"] },
        { title: "Errors are results", icon: "📨", tone: "blue", items: ["return the error as the tool's result", "the model can adapt instead of crashing"] },
      ],
      beats: [
        { say: "Three rules follow. Safety lives in your code. Refunds under two hundred euros, written in the prompt, is a suggestion. A check inside the refund function is a control.", tone: "key" },
        { say: "Arguments are untrusted input. Treat them like data from an unknown user. Validate types and ranges, check permissions, and never paste them into SQL or a shell command." },
        { say: "And errors are results. If the flight service times out, return that as the tool's result, so the model can adapt, instead of crashing the run." },
      ],
    },
    {
      kind: "custom",
      name: "a5errors",
      beats: [
        { say: "Different errors deserve different handling. A timeout: return the error as the tool's result." },
        {
          say: "Rate limited, or the service is briefly down: retry, with waits that double each time, plus a little randomness, so thousands of clients don't all retry at the same instant. That's exponential backoff with jitter.",
          term: { word: "Exponential backoff", meaning: "retry with doubling waits + randomness" },
        },
        { say: "Bad arguments: return the error message, and let the model fix its call." },
        { say: "And not allowed: never retry. Tell the user.", tone: "key" },
      ],
    },
    {
      kind: "bullets",
      title: "A good tool (and fewer of them)",
      firstItemStep: 1,
      items: [
        { icon: "🎯", text: "One clear job, named for its action", sub: "rebook_flight, not flights_api" },
        { icon: "📝", text: "A description of when to use it, and when not" },
        { icon: "🔒", text: "Tight arguments: enums, exact formats" },
        { icon: "✂️", text: "Short output, clear errors", sub: "the six fields needed, not a 50 KB record" },
      ],
      beats: [
        { say: "Someone asks for a smart assistant with twenty five tools. Push back. Similar tools confuse the choice, each costs tokens on every request, and each can be misused. Support needs about five. And a good tool has four properties." },
        { say: "One clear job, named for its action." },
        { say: "A description of when to use it, and when not to." },
        { say: "Tight arguments: fixed lists of allowed values, and exact formats." },
        {
          say: "And short output, with clear error messages. You can also steer the choice with a tool choice setting: auto, required, one specific tool, or none.",
          term: { word: "tool_choice", meaning: "auto · required · a named tool · none" },
        },
      ],
    },

    // ------------------------------------------------------------ 2
    { kind: "section", num: "2", title: "Structured output", beats: [{ say: "Next: answers that other code has to read." }] },
    {
      kind: "custom",
      name: "a5structured",
      beats: [
        { say: "Say the agent first classifies each request: status, rebook, or refund. Code reads that. And, sure, here is the JSON, breaks a parser." },
        {
          say: "From weakest to strongest. Ask for JSON in the prompt. JSON mode: guaranteed valid JSON, but not your fields. Your schema passed as a tool, so the model fills in your fields. And strict schemas, where the model can only produce output that fits.",
          term: { word: "Structured output", meaning: "replies guaranteed to match your schema" },
        },
        {
          say: "Here's the broken version: parse whatever came back, and crash on chatter, or on a renamed field. The fixed version declares a Pydantic class, and passes it as the schema. On a validation error, retry once with the error included, then fail cleanly.",
          term: { word: "Pydantic", meaning: "Python classes that validate data" },
        },
      ],
    },
    {
      kind: "trap",
      myth: "With structured output, the answers are correct.",
      truth: "Valid structure isn't a correct answer. The JSON can be perfect and the intent wrong. It removes parsing failures, not the need to test quality.",
      beats: [
        { say: "The trap: with structured output, the answers are correct." },
        { say: "No. The JSON can be perfect, and the intent wrong. Structured output removes parsing failures. It doesn't remove the need to test answer quality.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 3
    { kind: "section", num: "3", title: "The agent loop", beats: [{ say: "One tool call isn't enough for our passenger.", tone: "excite" }] },
    {
      kind: "custom",
      name: "a5loop",
      beats: [
        {
          say: "The model needs the flight status, then the booking, then the compensation policy. So put tool calling in a loop. Ask the model. Run whatever it requests. Append the results. Ask again. That's an agent: a model in a loop, deciding which tool to call next.",
          term: { word: "Agent", meaning: "a model in a loop, choosing tools until done" },
        },
        { say: "Step one, flight status: cancelled. Step two, the booking. Step three, the compensation policy." },
        { say: "When the model replies with no tool calls, that's the final answer. Cancelled, here's the next flight, and you're owed two hundred and fifty euros." },
        { say: "And always a hard stop. A maximum number of steps, so a confused model can't loop forever.", tone: "key" },
      ],
    },
    {
      kind: "code",
      title: "The agent loop, written out (Anthropic SDK)",
      lang: "python",
      code: LOOP,
      highlight: [
        [1, 1],
        [3, 5],
        [6, 9],
        [10, 11],
        [13, 18],
        [19, 21],
        [22, 22],
      ],
      beats: [
        { say: "Interviewers often ask you to write exactly this. Start with a step limit." },
        { say: "Keep the conversation as a list of messages, and loop, at most max steps times." },
        { say: "Call the model with the messages and the tool definitions. Append its reply. Collect any tool calls." },
        { say: "No tool calls? That's the final answer. Return the text." },
        { say: "Otherwise, for each call: validate the arguments before running anything. Run it. And if it fails, the error becomes the result." },
        { say: "Each result is tied to its call's id, and all of them go back as one message." },
        { say: "And if the limit is hit, stop cleanly. Step limit, validation, errors as results, and ids. That's what a correct loop needs.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 4
    { kind: "section", num: "4", title: "LangChain: the loop, packaged", beats: [{ say: "You'll write that loop in every project, and then add the same things around it. Retries, fallbacks, limits, streaming, traces. That's what a framework is for." }] },
    {
      kind: "bullets",
      title: "What LangChain v1 gives you",
      firstItemStep: 1,
      items: [
        { icon: "🔌", text: "One model interface, any provider", sub: "init_chat_model(\"provider:model\") · invoke, stream, batch" },
        { icon: "🔁", text: "create_agent: the loop above", sub: "built on LangGraph, so it can save state and pause" },
        { icon: "🧅", text: "Middleware: controls around the loop" },
        { icon: "🔭", text: "LangSmith: traces and evals" },
      ],
      beats: [
        { say: "LangChain version one, released in October twenty twenty five, packages that loop." },
        { say: "One interface for chat models from any provider, with the same invoke, stream, and batch everywhere." },
        {
          say: "Create agent builds exactly the loop we just wrote. Underneath, it runs on LangGraph, so even a simple agent can save its state, and pause.",
          term: { word: "create_agent", meaning: "LangChain v1's packaged agent loop" },
        },
        { say: "Middleware adds production controls around the loop, without rewriting it." },
        { say: "And LangSmith records every model call, tool call and step, as a trace." },
      ],
    },
    {
      kind: "trap",
      myth: "LangChain agents are AgentExecutor, and you build everything from chains.",
      truth: "That's 2023-era LangChain. In v1, create_agent replaced create_react_agent and AgentExecutor; old chains moved to langchain-classic.",
      why: "Use it selectively: pin versions, keep prompts and tools as your own plain, testable code. A one-call batch job needs the SDK, not a framework.",
      beats: [
        { say: "Interviewers use this to check you're current. If you answer with agent executor, and chains for everything..." },
        { say: "That's twenty twenty three LangChain. In version one, create agent replaced create react agent and agent executor, and the old chains moved to a separate classic package.", tone: "key" },
        { say: "Would you use it in production? Yes, selectively. Pin versions, keep prompts and tools as your own plain, testable code. And a one call batch job needs the SDK and a retry wrapper, not an agent framework." },
      ],
    },
    {
      kind: "custom",
      name: "a5middleware",
      beats: [
        {
          say: "Middleware wraps the loop at fixed points, like middleware in a web framework. Before hooks run in order: m one, m two, m three. After hooks run in reverse. And wrap hooks nest like an onion, with m one outermost.",
          term: { word: "Middleware", meaning: "hooks around the agent loop" },
        },
        { say: "So put logging and retries first, where they see everything. And put personal data masking last, right before the model." },
        { say: "Built ins map to real production problems. Forty tool calls in one run: call limits. An email address in a trace: P I I masking. A provider outage: retry and fallback models. Long conversations: summarization. And a refund that needs a person: human in the loop, in chapter seven.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 5
    { kind: "section", num: "5", title: "LangGraph: explicit steps", beats: [{ say: "Sometimes you can't let the model choose the order. Every booking change must look up the booking first. Every policy answer must search the policy. Then you write the workflow yourself." }] },
    {
      kind: "custom",
      name: "a5graph",
      beats: [
        {
          say: "LangGraph describes a workflow as a graph. The state is the run's shared whiteboard: messages, the intent, the booking, a tries counter.",
          term: { word: "StateGraph", meaning: "a workflow of nodes over a shared state" },
        },
        {
          say: "Nodes are the steps: plain functions that read the state, and return only the fields they change.",
          term: { word: "Node", meaning: "a step: reads state, returns updates" },
        },
        {
          say: "Edges are the arrows. A fixed edge always goes to the same node. A conditional edge calls a small router function that reads the state, and picks the next node: a question goes to the policy search, a change goes to the booking.",
          term: { word: "Conditional edge", meaning: "a router function picks the next node" },
        },
        {
          say: "Reducers are the rules for writing on the whiteboard. By default, a new value replaces the old. For lists you often append, like add messages.",
          term: { word: "Reducer", meaning: "how an update merges into the state" },
        },
        { say: "And now the policy search can't be skipped, because the graph has no path around it.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "a5super",
      beats: [
        {
          say: "How does a graph run? In rounds, called super steps, an idea borrowed from Google's Pregel. In each round, every node triggered by the last round runs.",
          term: { word: "Super-step", meaning: "one round: triggered nodes run, then merge" },
        },
        { say: "If several are triggered, they run in parallel. At the end of the round, their updates are merged through the reducers, the state is saved, and the edges pick the next round." },
        { say: "What interviewers probe: two parallel nodes write the same field, with no reducer. LangGraph can't pick a winner, and raises an invalid update error. Add a reducer, or give each node its own field.", tone: "key" },
        { say: "And the brakes against loops: a counter in the state, a fallback route, a recursion limit as the last resort backstop, and a budget on tokens and time." },
      ],
    },
    {
      kind: "compare",
      title: "SDK, LangChain, or LangGraph?",
      cols: [
        { title: "Plain SDK", icon: "🧰", tone: "blue", items: ["one model call, or a fixed pipeline", "batch jobs, classifiers"] },
        { title: "LangChain create_agent", icon: "🔁", tone: "purple", items: ["the model decides the steps", "standard tools + middleware"] },
        { title: "LangGraph", icon: "🕸️", tone: "green", items: ["you decide the steps", "branches, loops, parallelism, saved state"] },
      ],
      footer: "start simple; add structure only when the task needs it",
      beats: [
        { say: "So which do you use? One model call, or a fixed pipeline, like a nightly classifier: the plain SDK." },
        { say: "A model that decides its own steps, with standard tools and production controls: LangChain's create agent." },
        { say: "And when you must decide the steps yourself, with branches, loops, parallel work and saved state: LangGraph." },
        { say: "Start simple. Add structure only when the task needs it.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 6
    { kind: "section", num: "6", title: "Interview round", beats: [{ say: "Interview round.", tone: "excite" }] },
    {
      kind: "sayit",
      q: "Explain tool calling, and what a production agent loop needs.",
      lines: [
        "Tools are described by name, description and JSON schema, sent with each request.",
        "The model replies with a tool call (name, arguments, id); my code validates and runs it.",
        "Results go back tied to the call id; the loop repeats until a reply has no tool calls.",
        "Controls live in code: permissions, argument validation, errors returned as results.",
        "Brakes: a step limit, retries with backoff, timeouts, and a token and cost budget.",
      ],
      beats: [
        { say: "Explain tool calling, and what a production agent loop needs." },
        { say: "Tools are described by a name, a description, and a JSON schema, sent with each request." },
        { say: "The model replies with a tool call: name, arguments and an id. My code validates it, and runs it." },
        { say: "Results go back tied to the call id, and the loop repeats until a reply contains no tool calls." },
        { say: "The controls live in code: permissions, argument validation, and errors returned as results." },
        { say: "And brakes: a step limit, retries with backoff, timeouts, and a budget for tokens and cost.", tone: "key" },
      ],
    },
    {
      kind: "drill",
      items: [
        { q: "Does the model execute tools?", a: "No. It returns a tool call; your code validates and runs it." },
        { q: "Why tie each tool result to an id?", a: "One reply can request several tools; ids match each result to its call." },
        { q: "A tool times out. What does the loop do?", a: "Return the error as the tool result so the model can adapt; retry transient errors with backoff." },
        { q: "JSON mode vs strict structured output?", a: "JSON mode guarantees valid JSON; strict schemas guarantee your fields and types." },
        { q: "Middleware order for m1, m2, m3?", a: "before hooks m1→m3, after hooks m3→m1, wrap hooks nest with m1 outermost." },
        { q: "What causes InvalidUpdateError in LangGraph?", a: "Parallel nodes writing the same state field without a reducer." },
        { q: "LangChain or LangGraph?", a: "create_agent when the model chooses steps; LangGraph when you must control the steps." },
      ],
      beats: [
        { say: "Rapid fire. Does the model execute tools?", tone: "ask", hold: 2.5 },
        { say: "No. It returns a tool call. Your code validates it, and runs it." },
        { say: "Why tie each tool result to an id?", tone: "ask", hold: 2.5 },
        { say: "One reply can request several tools. The ids match each result to its call." },
        { say: "A tool times out. What does the loop do?", tone: "ask", hold: 2.5 },
        { say: "Return the error as the tool result, so the model can adapt. And retry transient errors with backoff." },
        { say: "JSON mode versus strict structured output?", tone: "ask", hold: 2.5 },
        { say: "JSON mode guarantees valid JSON. Strict schemas guarantee your fields and types." },
        { say: "Middleware order, for m one, m two, m three?", tone: "ask", hold: 2.5 },
        { say: "Before hooks run m one to m three. After hooks run m three to m one. Wrap hooks nest, with m one outermost." },
        { say: "What causes an invalid update error in LangGraph?", tone: "ask", hold: 2.5 },
        { say: "Parallel nodes writing the same state field, without a reducer." },
        { say: "Last one. LangChain, or LangGraph?", tone: "ask", hold: 2.5 },
        { say: "Create agent when the model chooses the steps. LangGraph when you must control them.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "recap",
      props: {
        items: [
          ["📝", "Tool calling", "the model asks, code acts"],
          ["🛡️", "Controls in code", "validate, permit, errors as results"],
          ["🧾", "Structured output", "schemas, not parsing"],
          ["🔁", "Agent loop", "until no tool calls, with a limit"],
          ["🧅", "Middleware", "limits, retries, PII, fallbacks"],
          ["🕸️", "LangGraph", "state, nodes, edges, reducers"],
        ],
      },
      beats: [
        { say: "Let's lock it in." },
        { say: "Tool calling: the model asks, your code acts." },
        { say: "Controls live in code: validation, permissions, and errors as results." },
        { say: "Structured output gives you schemas, not parsing." },
        { say: "The agent loop runs until a reply has no tool calls, with a hard limit." },
        { say: "Middleware adds limits, retries, masking and fallbacks around the loop." },
        { say: "And LangGraph makes the steps explicit: state, nodes, edges and reducers.", tone: "key" },
      ],
    },
    {
      kind: "pause",
      question: "The passenger comes back 20 minutes later: “and my bag?”. The server crashed mid-run. A retry refunded them twice. What's missing?",
      beats: [
        { say: "The agent works. Then production happens. The passenger comes back twenty minutes later: and my bag? The agent has no idea which booking they mean." },
        { say: "The server crashed in the middle of a run. And after an automatic retry, a refund was issued twice. What's missing?", tone: "ask", hold: 3 },
      ],
    },
    {
      kind: "title",
      eyebrow: "Next",
      title: "Chapter 6 — Agents that remember",
      subtitle: "checkpoints, idempotency, memory, multi-agent",
      beats: [{ say: "That's chapter six. See you there.", tone: "excite" }],
    },
  ],
};
