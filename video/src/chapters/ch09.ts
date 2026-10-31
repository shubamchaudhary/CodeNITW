import type { Chapter } from "../lib/types.ts";

// Chapter 9 (src/Data/aiStackDocs/CH-09.md): extending chapter 8's net to
// agents (outcomes, trajectories, pass^k) and out into production (traces,
// online evals, shadow, canary, A/B).

export const ch09: Chapter = {
  id: "ch09",
  title: "Testing agents and shipping safely",
  voice: "en-US-AndrewMultilingualNeural",
  next: "Chapter 10 — Designing LLM systems",
  scenes: [
    {
      kind: "custom",
      name: "cardlist",
      props: {
        title: "Two things slip through the net",
        items: [
          ["🤖", "Planner Copilot: “Done!”", "and the wrong warehouse changed"],
          ["📈", "Tuesday: answers change", "and nobody changed any code"],
        ],
      },
      beats: [
        { say: "Chapter eight built a safety net: a golden set, a calibrated judge, and a gate. Two things slip straight through it." },
        { say: "Planner Copilot can say done, while having changed the wrong warehouse." },
        { say: "And one Tuesday, answers change, although nobody touched the code. Today, we extend the net to agents, and then out into production.", tone: "key" },
      ],
    },
    {
      kind: "title",
      eyebrow: "AI Stack · Chapter 9",
      title: "Testing agents and shipping safely",
      subtitle: "outcomes, trajectories, pass^k, canaries",
      beats: [{ say: "Chapter nine. Testing agents, and shipping safely." }],
    },

    // ------------------------------------------------------------ 1
    { kind: "section", num: "1", title: "Grade what happened", beats: [{ say: "First rule of testing agents." }] },
    {
      kind: "custom",
      name: "claimvsdb",
      beats: [
        { say: "An agent's final message is a claim. Done! Raised milk safety stock in Pune.", tone: "ask" },
        {
          say: "The truth lives in the database. So check the outcome there. Pune: unchanged. And a warehouse in Nashik: changed. The message lied.",
          tone: "excite",
          term: { word: "Outcome check", meaning: "grade the real result, not the agent's message" },
        },
        {
          say: "Then check the path. The sequence of tool calls is the trajectory. Did it read stock before proposing? Ask for approval before committing? Never touch a delete tool? Stay under twelve steps?",
          term: { word: "Trajectory", meaning: "the agent's sequence of tool calls, checked by rules" },
        },
        { say: "Check rules, not one exact sequence. There's usually more than one good path, and rigid matching punishes good runs.", tone: "aside" },
      ],
    },
    {
      kind: "custom",
      name: "passk",
      beats: [
        { say: "Planner Copilot passes a task eight times out of ten. Is that good? Think about Arjun. He sends each request once, and dozens a week.", tone: "ask" },
        { say: "Run the same task k times. Pass at k asks: did at least one attempt succeed? That fits a person picking the best of several, like code suggestions." },
        {
          say: "Pass to the power k asks: did all of them succeed? That's the one for anything facing customers, or changing data. Watch how fast it falls.",
          term: { word: "pass^k", meaning: "the chance that all k attempts succeed" },
        },
        { say: "At eighty percent per attempt, three requests in a row all go right only about half the time. A coin flip. That's why consistency matters as much as capability.", tone: "key" },
        { say: "So every test run starts in a fresh sandbox. And for conversations, another model plays Arjun, from a scenario card.", tone: "aside" },
      ],
    },

    // ------------------------------------------------------------ 2
    { kind: "section", num: "2", title: "See production", beats: [{ say: "Now, the Tuesday mystery." }] },
    {
      kind: "custom",
      name: "xray",
      beats: [
        { say: "Tuesday morning. Answers are suddenly longer. A few refuse simple questions. And nobody deployed anything. What would you need to have been recording, already?", tone: "ask" },
        {
          say: "A trace for every request. Think of an X-ray: a nested entry for every model call, every search, every tool call. Being able to answer what happened, and why, after the fact, is observability.",
          term: { word: "Observability", meaning: "answering what happened, and why, after the fact" },
        },
        { say: "Each trace holds the model and its exact version, the prompt version, the chunks and scores, tool calls, tokens, time, cost, and who asked." },
        { say: "Traces hold sensitive data, so mask it, and decide up front how long to keep them.", tone: "aside" },
      ],
    },
    {
      kind: "custom",
      name: "online",
      beats: [
        {
          say: "Then grade live traffic. Run your code checks and calibrated judges on a sample of real requests, every day. These are online evals.",
          term: { word: "Online evals", meaning: "checks running on a sample of live traffic" },
        },
        { say: "And chart them per group. Here, Bengaluru dropped hard, while the average barely moved. An average hides a regression in one city.", tone: "key" },
        { say: "As for Tuesday: answer length and refusals jumped together. That's the signature of a model update. So pin dated model versions, run the regression suite daily, and keep the old version one switch away." },
      ],
    },

    // ------------------------------------------------------------ 3
    { kind: "section", num: "3", title: "Ship in steps", beats: [{ say: "Last: shipping without fear." }] },
    {
      kind: "custom",
      name: "rollout",
      beats: [
        { say: "Ship in steps. First, offline: the golden set must pass." },
        {
          say: "Then shadow: the new version answers real questions in parallel, but nobody sees its answers. You compare, with zero risk.",
          term: { word: "Shadow", meaning: "the new version runs on real traffic, hidden" },
        },
        {
          say: "Then a canary: a small group, say five percent of agents in Pune, gets the new version. The success metric and the rollback triggers are written down before it starts.",
          term: { word: "Canary", meaning: "a small group gets the new version first" },
        },
        { say: "Something looks off? Roll back. It's a configuration switch, so it takes seconds, not a redeploy.", tone: "key" },
        { say: "An A B test answers a different question. Not, does it break? But, is it better? Split by agent, pick one metric in advance, and fix the sample size before you start.", tone: "aside" },
        { say: "And version everything together. The prompt, the model, the search settings, the index, as one configuration, stamped on every trace." },
      ],
    },
    {
      kind: "custom",
      name: "recap",
      props: {
        items: [
          ["🗄️", "Outcome check", "trust the database, not the message"],
          ["🛤️", "Trajectory", "rules on the path"],
          ["🎲", "pass^k", "all k attempts succeed"],
          ["🩻", "Observability", "a trace for every request"],
          ["📊", "Online evals", "live traffic, per group"],
          ["🐤", "Canary", "a few first, rollback ready"],
        ],
      },
      beats: [
        { say: "Let's lock it in." },
        { say: "Check the outcome in the database, not the message." },
        { say: "Check the trajectory with rules." },
        { say: "Pass to the power k: every attempt must succeed." },
        { say: "Observability: a trace for every request." },
        { say: "Online evals watch live traffic, per group." },
        { say: "And a canary goes first, with the rollback ready.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "cardlist",
      props: {
        title: "Ask FreshCart for everyone",
        items: [
          ["🏙️", "6 cities · 40 franchises · 2,000 agents", "a million questions a day"],
          ["🔒", "each franchise sees only its own documents", "plus FreshCart's shared ones"],
          ["🗓️", "a 45-minute design review on Thursday", "scale, isolation, outages, cost"],
        ],
        pause: "Before drawing a single box: what are your first five questions?",
      },
      beats: [
        { say: "FreshCart is expanding. Six cities, forty franchise partners, two thousand support agents. A million questions a day." },
        { say: "Each franchise must see only its own private documents, plus FreshCart's shared ones." },
        { say: "Leadership wants a forty five minute design review of Ask FreshCart for everyone. How does it scale? How are franchises kept apart? What if the provider goes down? What does it cost?" },
        { say: "These are the questions of an LLM system design interview. So, before drawing a single box: what would you need to know, and decide? Write down your first five questions.", tone: "ask", hold: 3 },
      ],
    },
    {
      kind: "title",
      eyebrow: "Next",
      title: "Chapter 10 — Designing LLM systems",
      subtitle: "a 7-step frame, napkin numbers, tenants",
      beats: [{ say: "That's chapter ten. See you there.", tone: "excite" }],
    },
  ],
};
