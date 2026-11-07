import type { Chapter } from "../lib/types.ts";

// Chapter 9 of the AI Stack: testing agents and shipping safely,
// interview-ready. The running example is a store's refund agent that said
// "Done!" after refunding the wrong order.

export const ch09: Chapter = {
  id: "ch09",
  title: "Testing agents and shipping safely",
  voice: "en-US-AndrewMultilingualNeural",
  next: "Chapter 10 — Designing LLM systems",
  scenes: [
    {
      kind: "custom",
      name: "a9hook",
      beats: [
        { say: "Chapter eight built a safety net for answers. Two things slip through it. First: a customer asks for a refund on order four eight two one three, and the agent replies: done, refund issued." },
        { say: "But the payments database shows the refund went to order four eight two three one. The wrong order. The message was confident, and false." },
        { say: "Second: one Tuesday, answers are suddenly longer, and a few start refusing simple questions. Nobody deployed anything. This chapter extends the net to agents, and out into production.", tone: "key" },
      ],
    },
    {
      kind: "title",
      eyebrow: "AI Stack · Chapter 9",
      title: "Testing agents, shipping safely",
      subtitle: "outcomes, trajectories, pass^k, traces, canaries",
      beats: [{ say: "Chapter nine. Testing agents, and shipping safely." }],
    },
    {
      kind: "bullets",
      title: "By the end, you can answer",
      firstItemStep: 1,
      items: [
        { icon: "🧪", text: "How do you test an agent, not just an answer?" },
        { icon: "🔁", text: "pass@k vs pass^k: which matters, and when?" },
        { icon: "🔭", text: "What goes into a trace; offline vs online evals" },
        { icon: "🐤", text: "Shadow, canary, A/B: how do you ship a change?" },
      ],
      beats: [
        { say: "By the end, you'll be able to answer these." },
        { say: "How to test an agent, not just an answer." },
        { say: "Pass at k versus pass to the power k, and which one matters for you." },
        { say: "What goes into a trace, and the difference between offline and online evals." },
        { say: "And how to ship a change: shadow, canary, and A B tests." },
      ],
    },

    // ------------------------------------------------------------ 1
    { kind: "section", num: "1", title: "Grade what happened, not what it says", beats: [{ say: "First rule: an agent's final message is a claim. Not evidence." }] },
    {
      kind: "custom",
      name: "a9levels",
      beats: [
        {
          say: "The truth lives in the system of record: the database that actually holds the data. So the first level is the final outcome. After the run, query it: exactly one forty dollar refund, on order four eight two one three, and none on any other order.",
          term: { word: "System of record", meaning: "where the real data lives" },
        },
        {
          say: "The second level is the trajectory: the sequence of tool calls the agent made, checked against rules. Read before write. Approval before refund. At most twelve steps. Never call delete. Rarely demand one exact sequence: there are usually several valid paths.",
          term: { word: "Trajectory", meaning: "the agent's sequence of tool calls" },
        },
        { say: "The third level is a single step: given this exact state, is the next tool call the right one? It shows where a run goes wrong." },
        {
          say: "And every run starts in a fresh sandbox: a test database seeded with known data, and fake external services, so runs can't touch real systems, or each other.",
          tone: "key",
          term: { word: "Sandbox", meaning: "an isolated, seeded test environment" },
        },
      ],
    },
    {
      kind: "compare",
      title: "Matching a trajectory (as in AgentEvals)",
      cols: [
        { title: "Strict", icon: "📏", tone: "red", items: ["same calls, same order", "brittle"] },
        { title: "Unordered", icon: "🔀", tone: "blue", items: ["same calls, any order"] },
        { title: "Subset / superset", icon: "⊆", tone: "purple", items: ["only allowed calls,", "or at least the required ones"] },
        { title: "LLM judge", icon: "🧑‍⚖️", tone: "green", items: ["“was this a reasonable path?”", "calibrate it first"] },
      ],
      footer: "prefer rules and loose matches: good runs take different paths",
      beats: [
        { say: "Libraries like AgentEvals offer match modes for trajectories. Strict: the same calls in the same order. Usually too brittle." },
        { say: "Unordered: the same calls, in any order." },
        { say: "Subset and superset: only allowed calls, or at least the required ones." },
        { say: "Or an LLM judge asking: was this a reasonable path? Calibrated, like any judge. Prefer rules and loose matches, because good runs take different paths.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "a9pyramid",
      beats: [
        {
          say: "Put together, it's a three tier test pyramid. At the base, component tests: each tool, prompt and parser on its own. Fast, and many.",
          term: { word: "Test pyramid", meaning: "many unit tests, fewer runs, few reviews" },
        },
        { say: "In the middle, trajectory tests: whole runs in a sandbox, graded on outcome and path rules." },
        { say: "And at the top, human review: a weekly sample of full conversations, end to end. Fewer, slower, and the only way to catch what nobody wrote a check for.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 2
    { kind: "section", num: "2", title: "One success isn't reliability", beats: [{ say: "The agent passes a task eight times out of ten. Is that good?", tone: "ask" }] },
    {
      kind: "custom",
      name: "a9passk",
      beats: [
        { say: "Run the same task ten times. Eight pass. Eighty percent per attempt." },
        {
          say: "Pass at k: the chance at least one of k attempts succeeds. It fits tools where a person picks the best attempt, like code suggestions. Pass at three is ninety nine percent.",
          term: { word: "pass@k", meaning: "at least one of k attempts succeeds" },
        },
        {
          say: "Pass to the power k: the chance all k attempts succeed. It fits anything facing customers or changing data, because each real request gets exactly one attempt. Eighty percent cubed: fifty one percent.",
          tone: "key",
          term: { word: "pass^k", meaning: "all k attempts succeed: reliability" },
        },
        { say: "So an agent that works eighty percent of the time handles three requests in a row correctly only about half the time. And it keeps falling. That's the case for working on consistency, not just capability. The metric comes from tau bench, a benchmark of customer service agents." },
      ],
    },
    {
      kind: "compare",
      title: "Testing conversations, and finding where it breaks",
      cols: [
        { title: "Simulated user", icon: "🎭", tone: "purple", items: ["a model plays the customer from a scenario card", "goal, known facts, when to give up", "read a sample: unrealistic users mislead"] },
        { title: "Where it breaks", icon: "🔬", tone: "blue", items: ["tool selection accuracy", "argument accuracy: right order id?", "steps and cost per success", "recovery rate after a tool error"] },
      ],
      beats: [
        {
          say: "For multi turn agents, a simulated user stands in for a person. A model plays the customer from a scenario card: their goal, what they know, and when they give up. Then grade the outcome and the conversation, and read some transcripts by hand.",
          term: { word: "Simulated user", meaning: "a model playing the customer in tests" },
        },
        { say: "And measure where runs break. Tool selection accuracy. Argument accuracy, like the right order id. Steps and cost per successful task. And recovery rate: after a tool error, did it recover, or give up?", tone: "key" },
      ],
    },
    {
      kind: "trap",
      myth: "Our model scores well on SWE-bench and tau-bench, so our agent will work.",
      truth: "Public benchmarks compare models in general. They say little about your tools, data and users. Use them to shortlist; decide on your own tasks.",
      beats: [
        { say: "The trap: our model scores well on public agent benchmarks, like SWE bench or tau bench, so our agent will work." },
        { say: "Benchmarks compare models in general. They say little about your tools, your data, and your users. Use them to shortlist. Decide with your own tasks.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 3
    { kind: "section", num: "3", title: "See every request", beats: [{ say: "Now Tuesday's mystery. What would you need to have been recording, already, to find out what changed?" }] },
    {
      kind: "custom",
      name: "a9trace",
      beats: [
        {
          say: "Observability means being able to answer: what happened in this request, and why, after the fact. Its core is the trace: one record per request, with a nested span for every model call, search, and tool call. Tools like LangSmith and Langfuse store and show them.",
          term: { word: "Observability", meaning: "explain any request after the fact" },
        },
        {
          say: "Each span carries what you'll need later. The model and its exact version, the prompt version, tokens in and out, time to first token, cost, the tool arguments, results and errors, and the chunk ids and scores.",
          term: { word: "Span", meaning: "one timed step inside a trace" },
        },
        { say: "Plus who asked, the configuration version, and the thumbs up or down that arrives later. Mask personal data, decide retention up front, and follow the OpenTelemetry conventions so tools can read it.", tone: "key" },
      ],
    },
    {
      kind: "compare",
      title: "Offline vs online evals",
      cols: [
        { title: "Offline", icon: "🧪", tone: "blue", items: ["golden set, before shipping", "known expected outcomes", "blocks bad changes"] },
        { title: "Online", icon: "📡", tone: "green", items: ["a sample of live traces, continuously", "no known answer: code checks + calibrated judges", "charted per group, with alerts"] },
      ],
      footer: "also watch: thumbs-down, re-asks, escalations, refusals, length, cost",
      beats: [
        { say: "Offline evals run the golden set before shipping, against known expected outcomes, and block bad changes." },
        {
          say: "Online evals run checks on a sample of real production traces, continuously. Live questions have no known answer, so they use code checks and calibrated judges. Chart them per group, and alert on drops. An average hides a regression in one area.",
          term: { word: "Online eval", meaning: "checks on a sample of live traffic" },
        },
        { say: "And watch the cheap signals too: thumbs down, the same question asked again in other words, escalations, refusals, answer length, and cost.", tone: "key" },
      ],
    },
    {
      kind: "chart",
      title: "Tuesday: nobody deployed anything",
      type: "line",
      labels: ["Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"],
      series: [{ name: "average answer length (words)", values: [82, 85, 80, 83, 84, 131, 128], tone: "amber", step: 1 }],
      max: 160,
      note: { step: 2, text: "the provider updated the model behind an alias", tone: "red" },
      beats: [
        { say: "Here's what Tuesday looked like in the dashboards." },
        { say: "Average answer length, flat for a week, then a jump of more than fifty percent overnight. Refusals rose too. No deploy." },
        {
          say: "The provider had updated the model behind an alias. That's model drift, and it's exactly why you record the model version on every trace.",
          tone: "key",
          term: { word: "Model drift", meaning: "behaviour changes with no code change" },
        },
      ],
    },
    {
      kind: "bullets",
      title: "Catch a silent model change before users do",
      firstItemStep: 1,
      items: [
        { icon: "📌", text: "Pin dated model versions", sub: "updates happen when you choose" },
        { icon: "📆", text: "Run the regression suite daily, against the live model" },
        { icon: "📈", text: "Alert on signals that move instantly", sub: "length, refusals, format failures, tokens" },
        { icon: "⏪", text: "Keep the previous version one config switch away" },
      ],
      beats: [
        { say: "Four habits catch a silent model change before your users do." },
        { say: "Pin dated model versions, so updates happen when you choose." },
        { say: "Run the regression suite daily, against the live model." },
        { say: "Alert on the signals that move instantly when a model changes: answer length, refusal rate, format failures, and token counts." },
        { say: "And keep the previous version one configuration switch away." },
      ],
    },

    // ------------------------------------------------------------ 4
    { kind: "section", num: "4", title: "Ship in steps", beats: [{ say: "Finally, how a new version reaches users." }] },
    {
      kind: "custom",
      name: "a9rollout",
      beats: [
        { say: "Offline first: the golden set must pass before anything ships." },
        {
          say: "Then shadow mode. The new version answers real questions in parallel, but users still see the old answers. You compare, with no risk.",
          term: { word: "Shadow mode", meaning: "new version runs live; users see the old one" },
        },
        {
          say: "Then a canary: a small group, say five percent, gets the new version. The success metric and the rollback triggers are written down before it starts.",
          term: { word: "Canary", meaning: "a small slice of users gets the new version" },
        },
        { say: "Then twenty five percent, then everyone, with online evals watching. Every new failure becomes a golden set case." },
        { say: "And if thumbs down or escalations cross a trigger, roll back. A configuration switch that takes seconds, not a redeploy.", tone: "key" },
      ],
    },
    {
      kind: "compare",
      title: "A/B tests answer a different question: is it better?",
      cols: [
        { title: "Design", icon: "🎲", tone: "blue", items: ["split by person, not by request", "one primary metric, chosen in advance", "guardrail metrics that must not drop"] },
        { title: "Discipline", icon: "⏱️", tone: "amber", items: ["fix the sample size in advance", "no stopping early when it looks good", "run past the novelty effect"] },
      ],
      beats: [
        {
          say: "Canaries ask: does it break? A B tests ask: is it better? Split users randomly, by person, not by request, so each sees one consistent version. Choose one primary metric in advance, like resolved without escalation, plus guardrails that must not get worse.",
          term: { word: "A/B test", meaning: "random split to measure which is better" },
        },
        { say: "Fix the sample size in advance. Stopping as soon as it looks good produces false wins. And run long enough to see past the novelty.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "a9config",
      beats: [
        { say: "One more habit. Behaviour can change because of the prompt, the model, the reranker, the index, or the tools." },
        {
          say: "So record them together as one configuration version, on every trace.",
          term: { word: "Config version", meaning: "one id for prompt, model, index, tools" },
        },
        { say: "Then every score, experiment, and incident maps to an exact configuration. And rolling back means switching to an earlier one.", tone: "key" },
      ],
    },
    {
      kind: "trap",
      myth: "The evidence is weak, so just tell the stakeholder no.",
      truth: "State what the evals do and don't show, then propose a shadow run or a small canary, with a written success metric and rollback trigger.",
      why: "Review a daily sample by hand, and set a date to decide from the data.",
      beats: [
        { say: "A favourite behavioural question. A stakeholder wants to launch, but the evidence is weak. Do you just say no?" },
        { say: "Don't just say no. State what the evals do, and don't, show. Then propose a shadow run, or a small canary, with a written success metric, and a rollback trigger.", tone: "key" },
        { say: "Review a daily sample by hand, and set a date to decide from the data." },
      ],
    },

    // ------------------------------------------------------------ 5
    { kind: "section", num: "5", title: "Interview round", beats: [{ say: "Interview round.", tone: "excite" }] },
    {
      kind: "sayit",
      q: "How do you test an agent and ship it safely?",
      lines: [
        "Grade outcomes in the system of record, not the agent's message, in a seeded sandbox.",
        "Check trajectories with rules: read before write, approval before actions, step limits.",
        "Run each task several times and report pass^k, because users get one attempt.",
        "Trace every request with model, prompt and config versions; run online evals per group.",
        "Ship offline → shadow → canary → full, with written rollback triggers; pin model versions.",
      ],
      beats: [
        { say: "How do you test an agent, and ship it safely?" },
        { say: "Grade outcomes in the system of record, not the agent's message, in a seeded sandbox." },
        { say: "Check trajectories with rules: read before write, approval before actions, and step limits." },
        { say: "Run each task several times, and report pass to the power k, because users get one attempt." },
        { say: "Trace every request with the model, prompt and config versions, and run online evals per group." },
        { say: "And ship offline, then shadow, then canary, then full, with written rollback triggers, and pinned model versions.", tone: "key" },
      ],
    },
    {
      kind: "drill",
      items: [
        { q: "The agent says “Done!”. How do you check?", a: "Query the system of record; the message is only a claim." },
        { q: "80% per attempt. What is pass^3?", a: "0.8³ ≈ 0.51: three in a row only about half the time." },
        { q: "When is pass@k the right metric?", a: "When a person picks the best of several attempts, like code suggestions." },
        { q: "Why not exact trajectory matching?", a: "There are many valid paths; rigid matching punishes good runs. Use rules." },
        { q: "Answers got longer and nobody deployed. Why?", a: "Likely model drift behind an alias. Pin versions; watch length and refusals." },
        { q: "Shadow vs canary?", a: "Shadow: runs live but users see the old version. Canary: a small slice really gets it." },
        { q: "Why split an A/B test by person?", a: "Each user sees one consistent version, so results aren't mixed." },
      ],
      beats: [
        { say: "Rapid fire. The agent says done. How do you check?", tone: "ask", hold: 2.5 },
        { say: "Query the system of record. The message is only a claim." },
        { say: "Eighty percent per attempt. What is pass to the power three?", tone: "ask", hold: 2.5 },
        { say: "Zero point eight cubed, about zero point five one. Three in a row, only about half the time." },
        { say: "When is pass at k the right metric?", tone: "ask", hold: 2.5 },
        { say: "When a person picks the best of several attempts, like code suggestions." },
        { say: "Why not exact trajectory matching?", tone: "ask", hold: 2.5 },
        { say: "There are many valid paths, and rigid matching punishes good runs. Use rules instead." },
        { say: "Answers got longer, and nobody deployed. Why?", tone: "ask", hold: 2.5 },
        { say: "Most likely model drift behind an alias. Pin versions, and watch length and refusals." },
        { say: "Shadow versus canary?", tone: "ask", hold: 2.5 },
        { say: "Shadow runs live, but users see the old version. A canary is a small slice that really gets the new one." },
        { say: "Last one. Why split an A B test by person?", tone: "ask", hold: 2.5 },
        { say: "So each user sees one consistent version, and results aren't mixed.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "recap",
      props: {
        items: [
          ["🗄️", "Outcome", "check the system of record"],
          ["🛤️", "Trajectory", "rules, not exact paths"],
          ["🔁", "pass^k", "reliability, one attempt each"],
          ["🔭", "Traces", "versions, tokens, tools, cost"],
          ["📡", "Online evals", "per group, with alerts"],
          ["🐤", "Shadow → canary", "rollback in seconds"],
        ],
      },
      beats: [
        { say: "Let's lock it in." },
        { say: "Grade the outcome in the system of record." },
        { say: "Check the trajectory with rules, not exact paths." },
        { say: "Report pass to the power k, because users get one attempt." },
        { say: "Trace every request, with versions, tokens, tools and cost." },
        { say: "Run online evals per group, with alerts." },
        { say: "And ship through shadow and canary, with rollback in seconds.", tone: "key" },
      ],
    },
    {
      kind: "pause",
      question: "Leadership wants the assistant for 500 customer companies, a million questions a day, each seeing only its own documents. What do you ask before drawing a single box?",
      beats: [
        { say: "Then the big one arrives. Leadership wants the assistant for five hundred customer companies. A million questions a day. Each company sees only its own documents." },
        { say: "Before drawing a single box, what would you ask?", tone: "ask", hold: 3 },
      ],
    },
    {
      kind: "title",
      eyebrow: "Next",
      title: "Chapter 10 — Designing LLM systems",
      subtitle: "the system design interview, step by step",
      beats: [{ say: "That's chapter ten. See you there.", tone: "excite" }],
    },
  ],
};
