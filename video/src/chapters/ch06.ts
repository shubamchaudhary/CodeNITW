import type { Chapter } from "../lib/types.ts";

// Chapter 6 (src/Data/aiStackDocs/CH-06.md): the agent gets a memory that
// survives crashes, safe-to-repeat actions, a lean context, memories about
// people, bigger workflows, and the "team of agents" question.

export const ch06: Chapter = {
  id: "ch06",
  title: "Agents that remember",
  voice: "en-US-AndrewMultilingualNeural",
  next: "Chapter 7 — Ask before acting",
  scenes: [
    {
      kind: "custom",
      name: "cardlist",
      props: {
        title: "Production is teaching it manners",
        items: [
          ["🧠", "“and was the bread delivered?”", "every call starts from zero"],
          ["💥", "a crash mid-answer", "start over"],
          ["💸💸", "₹150 credited twice", "after a crash and a retry"],
          ["🐌", "long chats", "slower and pricier every message"],
        ],
      },
      beats: [
        { say: "Ask FreshCart is an agent now. And production is teaching it some manners." },
        { say: "It forgets. Every call starts from zero." },
        { say: "A crash in the middle of an answer means starting over." },
        { say: "One crash, one automatic retry, and a customer got a hundred and fifty rupees. Twice.", tone: "excite" },
        { say: "And long chats get slower and pricier with every message.", tone: "key" },
      ],
    },
    {
      kind: "title",
      eyebrow: "AI Stack · Chapter 6",
      title: "Agents that remember",
      subtitle: "checkpoints, idempotency, memory, many agents",
      beats: [{ say: "Chapter six. Agents that remember." }],
    },

    // ------------------------------------------------------------ 1
    { kind: "section", num: "1", title: "Save the game", beats: [{ say: "Video games solved this long ago." }] },
    {
      kind: "custom",
      name: "savegame",
      beats: [
        { say: "Lose a level, and you don't replay the whole game. You load the last save." },
        {
          say: "LangGraph does the same. After every round, a checkpointer saves the whole state to a database. Each save is a checkpoint.",
          term: { word: "Checkpointer", meaning: "saves the run's state after every round" },
        },
        {
          say: "One conversation's chain of saves is a thread, named by an id you choose. Call again with the same thread id, and it picks up where it left off. So at ten twenty, and was the bread delivered, knows exactly which order.",
          term: { word: "Thread", meaning: "one conversation's chain of saves" },
        },
        { say: "And crashes? The answer step dies midway. Restart, load the last save, after retrieve, and only the answer step runs again. From its first line.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "liftbutton",
      beats: [
        { say: "From its first line. So if that step was issuing the credit, it issued it again. That's our double credit.", tone: "ask" },
        {
          say: "The fix has a long name, and a simple idea. A lift button. Press it five times, and the lift still comes once. That's idempotent: safe to repeat.",
          term: { word: "Idempotent", meaning: "safe to repeat: the second run changes nothing" },
        },
        { say: "So every credit carries an idempotency key. The payments service remembers keys it has seen, and ignores the repeat." },
        { say: "Remember this one. Checkpoints make a run resumable. They don't make it exactly once.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 2
    { kind: "section", num: "2", title: "What goes on the desk", beats: [{ say: "Now, conversations that remember also grow." }] },
    {
      kind: "custom",
      name: "desk",
      beats: [
        { say: "Think of the context window as a desk. After sixty messages, it holds forty thousand tokens. Every answer is slower, pricier, and the order number from message one is buried under the pile.", tone: "ask" },
        {
          say: "Deciding exactly what goes on the desk, for every single call, is called context engineering. In a long-running agent, it matters more than clever wording.",
          term: { word: "Context engineering", meaning: "choosing what goes into the window, every call" },
        },
        { say: "Keep the recent messages, word for word." },
        { say: "Squeeze the older ones into a running summary. And pin key facts, like the order id, in their own fields, so they can never be trimmed away.", tone: "key" },
        { say: "Old tool outputs are usually the biggest eaters, so shrink them first. And put fixed parts first, so they can be cached, with the question last.", tone: "aside" },
      ],
    },

    // ------------------------------------------------------------ 3
    { kind: "section", num: "3", title: "Remembering people", beats: [{ say: "Threads end. People don't." }] },
    {
      kind: "custom",
      name: "notebook",
      beats: [
        { say: "Agents are annoyed that every new chat starts from zero. Ask FreshCart never remembers that agent seven handles only Pune." },
        {
          say: "So keep a notebook about each person, outside any thread. When a chat ends, extract the lasting facts. When a new one starts, search the notebook and bring in a few. That's long term memory.",
          term: { word: "Long-term memory", meaning: "facts about people that outlive any one chat" },
        },
        { say: "It holds facts, past experiences, and even how to behave." },
        { say: "And it needs guards. Old facts go stale. Memories about people are personal data. Planted text can poison every future chat. So timestamp them, let people delete them, and treat every write as untrusted.", tone: "aside" },
      ],
    },

    // ------------------------------------------------------------ 4
    { kind: "section", num: "4", title: "Bigger jobs", beats: [{ say: "Next, a bigger job." }] },
    {
      kind: "custom",
      name: "fanout",
      beats: [
        { say: "Every Monday, summarise five hundred complaint emails into one report. One by one, it takes an hour." },
        {
          say: "But each email is independent. So split: one branch per email, all running in the same round. Then one step combines every summary. Split, run in parallel, combine. That's fan out.",
          tone: "excite",
          term: { word: "Fan-out", meaning: "one branch per piece, run in parallel, then combine" },
        },
        { say: "Cap how many run at once, below the provider's rate limit. And retry failures, waiting a little longer each time.", tone: "aside" },
        { say: "And because of checkpoints, if the job crashes, finished branches aren't redone." },
      ],
    },
    {
      kind: "custom",
      name: "reuse",
      beats: [
        { say: "Chapter four's retrieve, grade, rewrite loop is now needed in three different workflows." },
        {
          say: "So package it as one piece, a whole graph used as a single step inside other graphs. A subgraph.",
          term: { word: "Subgraph", meaning: "a whole graph used as one step in another" },
        },
        {
          say: "And while all this runs, stream progress to the screen. Classified. Found five passages. Summarised a hundred and twenty of five hundred.",
          term: { word: "Streaming", meaning: "sending progress and words as they happen" },
        },
        { say: "A slow answer feels fast, when you can watch it work.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 5
    { kind: "section", num: "5", title: "One agent, or a team?", beats: [{ say: "Finally, the question every team asks." }] },
    {
      kind: "custom",
      name: "team",
      beats: [
        { say: "Leadership wants a team of agents. Support, refunds, logistics, and a manager coordinating them. Sounds powerful, right?", tone: "ask" },
        {
          say: "There are three common shapes. A supervisor: a manager agent sees every turn, and hands out work.",
          term: { word: "Multi-agent", meaning: "work split between several agents" },
        },
        { say: "Handoffs: the active agent passes control straight to the next one." },
        { say: "Or agents as tools: specialists that return only a short summary to one main agent." },
        { say: "Here's the catch. A decision made inside one agent's context is invisible to the others. Refunds decides to refund. Logistics decides to send a fresh pack.", tone: "key" },
        { say: "And it costs. One study measured agents at about four times the tokens of a chat, and many agents at about fifteen times.", tone: "aside" },
      ],
    },
    {
      kind: "custom",
      name: "handover",
      beats: [
        { say: "When you do split, don't hand over twenty five messages. Hand over a short note: the order, what happened, what the customer wants." },
        { say: "So what do you tell leadership? One agent with five good tools, first. Split only when a measured failure shows you need to.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "recap",
      props: {
        items: [
          ["💾", "Checkpointer", "save the game after every round"],
          ["🧵", "Thread", "one conversation's saves"],
          ["🛗", "Idempotent", "safe to press twice"],
          ["🗂️", "Context engineering", "what goes on the desk"],
          ["📓", "Long-term memory", "a notebook about people"],
          ["🌿", "Fan-out", "split, run in parallel, combine"],
        ],
      },
      beats: [
        { say: "Let's lock it in." },
        { say: "A checkpointer saves the game after every round." },
        { say: "A thread is one conversation's chain of saves." },
        { say: "Idempotent means safe to press twice." },
        { say: "Context engineering decides what goes on the desk." },
        { say: "Long term memory is a notebook about people." },
        { say: "And fan out splits big jobs into parallel lanes.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "cardlist",
      props: {
        title: "Planner Copilot",
        items: [
          ["🧑‍💼", "Arjun: “raise milk safety stock 20% before Diwali”", "6 warehouses · SKU-881 · 400 → 480"],
          ["⚠️", "a wrong change empties shelves", "or wastes lakhs of rupees of dairy"],
          ["✋", "nothing is written until Arjun approves", "maybe tomorrow morning"],
          ["🌙", "the service may redeploy overnight", "nothing can just keep running"],
        ],
        pause: "How does an agent stop, wait for hours, and resume exactly there?",
      },
      beats: [
        { say: "Now the planning team wants an agent. Meet Arjun. He plans stock for the Pune warehouses." },
        { say: "He types: raise safety stock for milk in all Pune warehouses by twenty percent, before Diwali. The agent works it out. Six warehouses, milk, four hundred units to four eighty each." },
        { say: "A wrong change empties shelves, or wastes lakhs of rupees of dairy.", tone: "key" },
        { say: "So nothing gets written until Arjun approves. And he might approve tomorrow morning." },
        {
          say: "And the service might be redeployed overnight. So how does an agent stop in the middle, show a person exactly what it's about to do, wait for hours with nothing running, and continue exactly where it stopped? You already have one of the two pieces.",
          tone: "ask",
          hold: 3,
        },
      ],
    },
    {
      kind: "title",
      eyebrow: "Next",
      title: "Chapter 7 — Ask before acting",
      subtitle: "interrupt, resume, approvals that stay correct",
      beats: [{ say: "That's chapter seven. See you there.", tone: "excite" }],
    },
  ],
};
