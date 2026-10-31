import type { Chapter } from "../lib/types.ts";

// Chapter 5 (src/Data/aiStackDocs/CH-05.md): Ask FreshCart learns to look
// things up and act, first by hand, then with LangChain and LangGraph.

export const ch05: Chapter = {
  id: "ch05",
  title: "From assistant to agent",
  voice: "en-US-AndrewMultilingualNeural",
  next: "Chapter 6 — Agents that remember",
  scenes: [
    {
      kind: "custom",
      name: "cardlist",
      props: {
        title: "No document holds these answers",
        items: [
          ["📦", "“Where is order FC-20931 right now?”", "the orders database"],
          ["🥛", "“Is there milk in the Kothrud warehouse?”", "the inventory service"],
          ["💸", "“Issue a 150 rupee credit.”", "the payments API, and it's an action"],
        ],
      },
      beats: [
        { say: "Last time, three requests arrived that no document can answer." },
        { say: "Where is this order? That lives in the orders database." },
        { say: "Is there milk in Kothrud? That's the inventory service." },
        { say: "And issue a credit. That's the payments system. And it's not a question. It's an action. Today, Ask FreshCart stops just reading, and starts doing.", tone: "key" },
      ],
    },
    {
      kind: "title",
      eyebrow: "AI Stack · Chapter 5",
      title: "From assistant to agent",
      subtitle: "tools, structured output, the agent loop",
      beats: [{ say: "Chapter five. From assistant, to agent." }],
    },

    // ------------------------------------------------------------ 1
    { kind: "section", num: "1", title: "The model writes the order slip", beats: [{ say: "First, the obvious shortcut." }] },
    {
      kind: "custom",
      name: "restaurant",
      beats: [
        { say: "Why not just give the model a connection to the database, and let it run queries? What could go wrong?", tone: "ask" },
        { say: "Everything. A model can get confused. It can be tricked by text it reads. And it can't be held accountable.", tone: "key" },
        { say: "Think of a restaurant. The customer doesn't walk into the kitchen. They write an order on a slip. The waiter checks it. And the kitchen cooks." },
        {
          say: "That's tool calling. The model is the customer, writing slips. Your code is the waiter, and the kitchen.",
          tone: "key",
          term: { word: "Tool calling", meaning: "the model asks; your code checks and runs it" },
        },
      ],
    },
    {
      kind: "custom",
      name: "toolcard",
      beats: [
        { say: "So what does the model see? A tool is one of your functions, described in plain words. A name, get order. And a description of what it does, and when to use it." },
        { say: "Plus a schema: the exact shape of its arguments. Here, one order id, as a string." },
        {
          say: "When the model wants a tool, its reply isn't text. It's a tool call: the name, the arguments, and an id.",
          term: { word: "Tool call", meaning: "a request to run a tool: name, args, id" },
        },
        { say: "And notice. The model has run nothing. Your code checks the call, runs it, and sends back the result, tagged with that same id.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "control",
      beats: [
        { say: "This changes where safety lives. Only issue credits under two hundred rupees, written in the prompt, is a suggestion. The same check inside the function is a control.", tone: "key" },
        { say: "The model's arguments are untrusted input. Validate them like data from a stranger: types, ranges, and whether this user may touch this order." },
        { say: "And errors are results too. If the orders service times out, send that back as the tool's result, so the model can adapt instead of crashing." },
      ],
    },
    {
      kind: "custom",
      name: "toolbelt",
      beats: [
        { say: "Meera asks for a smart assistant with twenty five tools, one for every FreshCart system." },
        { say: "Push back. Similar tools confuse the model's choice. Every tool's description costs tokens on every single request. And every tool can be misused.", tone: "ask" },
        { say: "Support needs about five. Get the order, search the policy, check stock, issue a credit behind an approval, and hand over to a human.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 2
    { kind: "section", num: "2", title: "Answers code can read", beats: [{ say: "Next, answers that code can trust." }] },
    {
      kind: "custom",
      name: "form",
      beats: [
        { say: "Ask a model for JSON, and sometimes you get: sure, here is the JSON. Or order id spelled differently. Your parser crashes." },
        {
          say: "So don't ask for a paragraph. Hand it a form. Fixed fields, fixed choices. The provider only lets the model produce output that fits. This is structured output.",
          term: { word: "Structured output", meaning: "replies in an exact shape your code can rely on" },
        },
        { say: "One warning. The form can be filled perfectly, and still be wrong. Valid shape is not a correct answer.", tone: "aside" },
      ],
    },

    // ------------------------------------------------------------ 3
    { kind: "section", num: "3", title: "The agent loop", beats: [{ say: "Now, the big one.", tone: "excite" }] },
    {
      kind: "custom",
      name: "agentloop",
      beats: [
        { say: "FC two zero nine three one is late, and the milk was spoiled. What do I do? One tool call isn't enough. It needs the order. Then the policy. Then maybe a credit." },
        {
          say: "So put the tool call in a loop. The model thinks, asks for a tool, sees the result, and thinks again. Until it can answer. A model in a loop, choosing its next tool, is an agent.",
          tone: "key",
          term: { word: "Agent", meaning: "a model in a loop, choosing its next tool" },
        },
        { say: "Even this tiny loop needs a step limit, validation before running anything, errors returned as results, and every result tied to its call id.", tone: "aside" },
      ],
    },

    // ------------------------------------------------------------ 4
    { kind: "section", num: "4", title: "LangChain and middleware", beats: [{ say: "You'll write that loop in every project." }] },
    {
      kind: "custom",
      name: "conveyor",
      beats: [
        { say: "And every time, you'll add the same things around it. Retries. A fallback model. Limits. Streaming. Traces. Approvals." },
        {
          say: "LangChain packages all of that. Its create agent function builds exactly the loop we just drew.",
          term: { word: "LangChain", meaning: "a library that packages the agent loop" },
        },
        { say: "Then production arrives. One chat makes forty tool calls. A customer's email lands in a trace. The provider goes down on a Friday evening. Long chats get slow." },
        {
          say: "Middleware fixes these without rewriting the loop. Think of checkpoints on a conveyor belt. Every request passes a call limit, a data mask, a retry and fallback, and a summariser, on its way to the model.",
          term: { word: "Middleware", meaning: "hooks that run at fixed points around the loop" },
        },
        { say: "Order matters. The first in the list wraps everything, so put logging and retries there. Put masking last, right before the model.", tone: "aside" },
      ],
    },

    // ------------------------------------------------------------ 5
    { kind: "section", num: "5", title: "LangGraph: your own map", beats: [{ say: "Last idea of the day." }] },
    {
      kind: "custom",
      name: "subway",
      beats: [
        { say: "Meera reads a week of chats. Some refund answers never searched the policy. The model decided it didn't need to. She wants rules. Can a loop where the model decides everything guarantee them?", tone: "ask" },
        {
          say: "It can't. When you need to decide the order of steps, you draw it yourself, like a subway map. Stations are steps. Lines are what runs next. And a switch sends the train back to rewrite when the results are weak. That's LangGraph.",
          term: { word: "LangGraph", meaning: "your workflow as an explicit graph of steps" },
        },
        {
          say: "Every station reads from a shared whiteboard, and writes only its own fields. That whiteboard is the state.",
          term: { word: "State", meaning: "the run's shared whiteboard" },
        },
        { say: "Now the policy search can't be skipped. There's simply no line around it.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "superstep",
      beats: [
        {
          say: "LangGraph runs in rounds, called super steps.",
          term: { word: "Super-step", meaning: "one round: run, merge, save" },
        },
        { say: "In a round, every triggered step runs side by side. Searching the policy and fetching the order, together. Neither sees the other's update." },
        { say: "At the end of the round, the updates are merged, the state is saved, and the lines decide the next round.", tone: "key" },
        { say: "Two parallel steps writing the same field, with no rule for merging, is an error. And a recursion limit caps the rounds, so nothing loops forever.", tone: "aside" },
      ],
    },
    {
      kind: "custom",
      name: "recap",
      props: {
        items: [
          ["🧾", "Tool calling", "the model asks, your code runs"],
          ["📐", "Structured output", "a form, not a paragraph"],
          ["🔄", "Agent", "a model in a loop"],
          ["🧱", "Middleware", "checkpoints on the conveyor"],
          ["🗺️", "LangGraph", "your own subway map"],
          ["🧑‍🏫", "State", "the shared whiteboard"],
        ],
      },
      beats: [
        { say: "Let's lock it in." },
        { say: "Tool calling: the model writes the slip, your code cooks." },
        { say: "Structured output: hand it a form, not a blank page." },
        { say: "An agent is a model in a loop, choosing its next tool." },
        { say: "Middleware adds checkpoints, without rewriting the loop." },
        { say: "LangGraph lets you draw the map yourself." },
        { say: "And state is the whiteboard every step shares.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "cardlist",
      props: {
        title: "Then production happens",
        items: [
          ["🧠", "10:20: “and was the bread delivered?”", "every call starts from nothing"],
          ["💥", "the server crashes mid-answer", "start over"],
          ["💸💸", "a crash, a retry: ₹150 credited twice", "the worst one"],
          ["🐌", "long chats get slower and pricier", "every message"],
        ],
        pause: "Where does state survive a crash? How is a credit safe to run twice?",
      },
      beats: [
        { say: "Ask FreshCart is a real agent now. Then production happens." },
        { say: "An agent asks about an order, steps away, and twenty minutes later types: and was the bread delivered? Ask FreshCart has no idea which order they mean." },
        { say: "The server crashes in the middle of an answer." },
        { say: "After one crash and an automatic retry, a customer is credited a hundred and fifty rupees. Twice.", tone: "excite" },
        {
          say: "And long chats get slower and pricier with every message. So where should a conversation live, so it survives a crash? And how do you make issue a credit safe to run twice?",
          tone: "ask",
          hold: 3,
        },
      ],
    },
    {
      kind: "title",
      eyebrow: "Next",
      title: "Chapter 6 — Agents that remember",
      subtitle: "checkpoints, idempotency, memory, many agents",
      beats: [{ say: "That's chapter six. See you there.", tone: "excite" }],
    },
  ],
};
