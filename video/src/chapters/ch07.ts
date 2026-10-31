import type { Chapter } from "../lib/types.ts";

// Chapter 7 (src/Data/aiStackDocs/CH-07.md): Planner Copilot stops, shows
// Arjun the exact change, waits as long as it takes, and resumes correctly.

export const ch07: Chapter = {
  id: "ch07",
  title: "Ask before acting",
  voice: "en-US-AndrewMultilingualNeural",
  next: "Chapter 8 — Is it actually working?",
  scenes: [
    {
      kind: "custom",
      name: "diffcard",
      beats: [
        { say: "Planner Copilot has worked out its change. Milk, six Pune warehouses, safety stock from four hundred to four eighty, each." },
        { say: "Now it has to stop before writing anything, show Arjun exactly this, and wait. Maybe until tomorrow. Maybe across a deploy." },
        {
          say: "Chapter six gave you half the answer: saving the run. The other half is stopping on purpose. Together, they make human in the loop.",
          tone: "key",
          term: { word: "Human-in-the-loop", meaning: "the agent pauses so a person can approve, edit or reject" },
        },
      ],
    },
    {
      kind: "title",
      eyebrow: "AI Stack · Chapter 7",
      title: "Ask before acting",
      subtitle: "interrupt, resume, approvals that stay correct",
      beats: [{ say: "Chapter seven. Ask before acting." }],
    },

    // ------------------------------------------------------------ 1
    { kind: "section", num: "1", title: "Freeze the run", beats: [{ say: "First, how to stop." }] },
    {
      kind: "custom",
      name: "freeze",
      beats: [
        { say: "LangGraph gives you two pieces. Watch the run move from plan, to review." },
        {
          say: "Inside the review step, call interrupt, with the diff. The run freezes, and the diff goes to Arjun's screen.",
          term: { word: "Interrupt", meaning: "pause the run and hand a question to a person" },
        },
        { say: "And here's the beautiful part. While it waits, nothing is running. No process, no connection. The paused run is just rows in a database. It can wait a week.", tone: "key" },
        {
          say: "When Arjun decides, any server resumes it, on the same thread, with his answer. Inside the step, interrupt simply returns approve. Like a function call that took a day.",
          term: { word: "Resume", meaning: "continue a paused run with the person's answer" },
        },
      ],
    },
    {
      kind: "custom",
      name: "replay",
      beats: [
        { say: "But wait. A Python function can't be frozen halfway, and thawed tomorrow on a different server. So where does it actually restart?", tone: "ask" },
        { say: "From the first line of the step. Every line before interrupt runs again.", tone: "excite" },
        { say: "So if that step saved the proposal before pausing, it saves it twice. Two rows, for one proposal.", tone: "key" },
        { say: "The fix: put the side effect in its own earlier step, which won't re-run. And key it by the proposal id, so a repeat does nothing anyway." },
        { say: "Two more rules. Never wrap interrupt in a catch-everything block: the pause is an exception, and you'd swallow it. And ask once, with the whole batch.", tone: "aside" },
      ],
    },

    // ------------------------------------------------------------ 2
    { kind: "section", num: "2", title: "What needs a human", beats: [{ say: "Now, what should actually need Arjun?" }] },
    {
      kind: "custom",
      name: "rubberstamp",
      beats: [
        { say: "Version one asked Arjun to approve everything. Even show me milk stock. After a week, he approved each one in two seconds, without reading. Including a forty percent jump.", tone: "ask" },
        { say: "The approval became theatre. A bank vault's two person rule works precisely because it's rare, and deliberate.", tone: "key" },
        { say: "So sort actions by damage, and by how easy they are to undo. Reads run automatically. Small, reversible changes run and get logged. Bigger ones need Arjun. Huge ones need his manager too." },
        { say: "And those thresholds live in code. A prompt can be ignored. A check in code can't.", tone: "aside" },
      ],
    },
    {
      kind: "custom",
      name: "reviewcard",
      beats: [
        { say: "Next: approve the exact change, not the idea. If Arjun approves a sentence, and the agent builds the update afterwards, it can still get it wrong. All of Maharashtra, instead of Pune." },
        { say: "So his card shows the exact diff. Why the agent proposed it. Risk flags, like this is double the usual size. And his options: approve, edit the number, or reject with a reason.", tone: "key" },
        { say: "Then measure the gate. If everything is approved in three seconds, it adds nothing.", tone: "aside" },
      ],
    },

    // ------------------------------------------------------------ 3
    { kind: "section", num: "3", title: "Where the change waits", beats: [{ say: "While Arjun thinks, where does the change live?" }] },
    {
      kind: "custom",
      name: "overlay",
      beats: [
        { say: "Not in the live table. Ordering systems read it, and trucks would move on a number nobody approved." },
        {
          say: "Instead, it's a sticky note on the live sheet. The proposal sits in a separate staging area, the overlay, while the base stays at four hundred.",
          term: { word: "Overlay", meaning: "a staging area for changes not yet approved" },
        },
        { say: "Approve, and the note is applied in one transaction. All six rows, or none.", tone: "key" },
        { say: "Reject, or let it expire, and the note is simply removed. The reason goes back to the agent, so it can try again." },
      ],
    },

    // ------------------------------------------------------------ 4
    { kind: "section", num: "4", title: "While it waits", beats: [{ say: "Last: the world doesn't wait with you." }] },
    {
      kind: "custom",
      name: "stale",
      beats: [
        { say: "Sixty planners use it now. What can go wrong between the proposal, and the commit?", tone: "ask" },
        {
          say: "The data changes. Another planner raised Kothrud an hour later. So every row carries a version. The commit only succeeds if it's still the version Arjun saw. Otherwise, zero rows change, and the agent re-proposes on fresh data. That's optimistic concurrency.",
          term: { word: "Optimistic concurrency", meaning: "commit only if nothing changed since you looked" },
        },
        { say: "Arjun goes on leave. So every proposal expires, with a reminder and a backup approver." },
        { say: "Two planners approve conflicting changes. Allow one open proposal per item, and key every commit by its proposal id." },
        { say: "And a deploy lands while two hundred runs are paused. Keep changes backward compatible, or let them drain first.", tone: "aside" },
      ],
    },
    {
      kind: "custom",
      name: "recap",
      props: {
        items: [
          ["🙋", "Human-in-the-loop", "pause for a person"],
          ["❄️", "Interrupt", "freeze the run, ask"],
          ["▶️", "Resume", "the answer comes back"],
          ["🔁", "The trap", "the step restarts at line 1"],
          ["📝", "Overlay", "a sticky note on the live sheet"],
          ["🔢", "Optimistic concurrency", "commit only if unchanged"],
        ],
      },
      beats: [
        { say: "Let's lock it in." },
        { say: "Human in the loop: the agent pauses for a person." },
        { say: "Interrupt freezes the run, and asks." },
        { say: "Resume brings the answer back." },
        { say: "The trap: the step restarts from its first line." },
        { say: "The overlay holds the change, like a sticky note." },
        { say: "And optimistic concurrency commits only if nothing changed.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "cardlist",
      props: {
        title: "Three months later",
        items: [
          ["📱", "the COO forwards a screenshot", "“bakery: refunds within 48 hours” · the policy says 12"],
          ["💬", "“Is this thing actually working?”", "“and how would we even know?”"],
          ["🤷", "today's honest answer", "“agents seem to like it”"],
        ],
        pause: "How do you prove free-text answers are good, when no unit test fits?",
      },
      beats: [
        { say: "Both agents are in production. Three months later, the COO forwards a screenshot." },
        { say: "Ask FreshCart told an agent that bakery refunds take forty eight hours. The policy says twelve." },
        { say: "Her message has one line. Is this thing actually working? And how would we even know?", tone: "key" },
        {
          say: "The honest answer, today, is: agents seem to like it. That's not an answer. So how would you prove an assistant works, when its answers are free text, and there's no unit test for a good answer?",
          tone: "ask",
          hold: 3,
        },
      ],
    },
    {
      kind: "title",
      eyebrow: "Next",
      title: "Chapter 8 — Is it actually working?",
      subtitle: "error analysis, judges, metrics, eval gates",
      beats: [{ say: "That's chapter eight. See you there.", tone: "excite" }],
    },
  ],
};
