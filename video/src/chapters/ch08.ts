import type { Chapter } from "../lib/types.ts";

// Chapter 8 (src/Data/aiStackDocs/CH-08.md): answering the COO. Look first,
// name and count the failures, turn them into checks, check the checker,
// and measure search and answers separately.

export const ch08: Chapter = {
  id: "ch08",
  title: "Is it actually working?",
  voice: "en-US-AndrewMultilingualNeural",
  next: "Chapter 9 — Testing agents and shipping safely",
  scenes: [
    {
      kind: "custom",
      name: "score",
      beats: [
        { say: "The COO's question is sitting in your inbox. Is this thing actually working? And how would we even know? Attached: the forty eight hour screenshot." },
        { say: "The tempting first move: install an evaluation library, run it, and report: helpfulness, four point one out of five." },
        { say: "That number tells her nothing. Not what's wrong. Not how often. Not what to fix.", tone: "key" },
        { say: "So we'll do it the way the best practitioners do. Look first. Name the failures. Count them. And only then, measure.", tone: "excite" },
      ],
    },
    {
      kind: "title",
      eyebrow: "AI Stack · Chapter 8",
      title: "Is it actually working?",
      subtitle: "error analysis, judges, metrics, eval gates",
      beats: [{ say: "Chapter eight. Is it actually working?" }],
    },

    // ------------------------------------------------------------ 1
    { kind: "section", num: "1", title: "Look before you measure", beats: [{ say: "Step one is the one everybody skips." }] },
    {
      kind: "custom",
      name: "piles",
      beats: [
        { say: "A doctor reads the charts before prescribing. So in week one, sample a hundred real traces from production. Every type of question, every day of the week." },
        {
          say: "Read each one, and write down in plain words what went wrong. Cited the twenty twenty three bakery policy. Never searched. Right chunk, wrong number. Or: fine. This is error analysis.",
          term: { word: "Error analysis", meaning: "read real outputs, name the failures, count them" },
        },
        { say: "Then group the notes into piles, and count them. Eleven outdated documents. Six answers that contradict their own chunk. Five order questions with no order lookup. Four answers too long to read on a call." },
        { say: "And look at the biggest pile. It isn't a prompt problem at all. It's old policies that were never deleted. The bakery bug.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "checks",
      beats: [
        { say: "Now turn every pile into a check. Code first, wherever you can. Code checks are cheap, fast, and never disagree with themselves." },
        { say: "Use a model as the judge only where code can't decide. Like: is every claim actually supported by the chunks it cites?" },
        { say: "And grade pass or fail, not one to five. You say three, I say four, and three point four average fixes nothing. Yes or no, we agree. And a no tells you exactly what to fix.", tone: "key" },
        {
          say: "Collect the cases into a golden set: fixed, versioned test cases, with the right sources and the facts each answer must contain.",
          term: { word: "Golden set", meaning: "fixed, versioned test cases with expected outcomes" },
        },
        { say: "Include the awkward ones. Unanswerable questions, ambiguous ones, hidden instructions, and policies that just changed.", tone: "aside" },
      ],
    },
    {
      kind: "custom",
      name: "cigate",
      beats: [
        { say: "Then run it on every change. A pull request edits a prompt. The golden set runs." },
        {
          say: "Compare the results with the main branch, check by check, group by group. Model outputs wobble from run to run, so block only a drop bigger than the normal noise. That's an eval gate.",
          term: { word: "Eval gate", meaning: "CI blocks a change that makes evals worse" },
        },
        { say: "And don't just say blocked. Show exactly which cases got worse, and why.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 2
    { kind: "section", num: "2", title: "Who checks the judge?", beats: [{ say: "Now, the question every interviewer asks next.", tone: "excite" }] },
    {
      kind: "custom",
      name: "judgecal",
      beats: [
        { say: "Some checks need a model as judge. And the COO asks: who checks the judge?", tone: "ask" },
        {
          say: "A judge is a measuring instrument. A kitchen scale that reads two hundred grams low is worse than no scale at all. Because you trust it.",
          tone: "key",
          term: { word: "LLM-as-judge", meaning: "a model grading another model's output" },
        },
        { say: "So calibrate it against a person. Meera labels a hundred and fifty answers, pass or fail. Use half to tune the judge, reading every disagreement. Keep the other half back, and use it once, at the end." },
        {
          say: "Then report two numbers. Of the answers Meera passed, how many did the judge pass? And of the answers she failed, how many did the judge fail? That second one matters most. A judge that never fails anything scores zero on it.",
          term: { word: "TPR / TNR", meaning: "how often the judge agrees on passes / on fails" },
        },
      ],
    },
    {
      kind: "custom",
      name: "biases",
      beats: [
        { say: "Judges have habits. Show two answers, and they often prefer whichever came first. So run both orders, and count only the verdicts that agree." },
        { say: "They prefer longer answers." },
        { say: "They prefer answers from their own model family." },
        { say: "And they're lenient. So give each judge one narrow question, ask for its reasoning before its verdict, and show it failing examples, not just good ones.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 3
    { kind: "section", num: "3", title: "Search, or the answer?", beats: [{ say: "Last: which half is broken?" }] },
    {
      kind: "custom",
      name: "rankmetrics",
      beats: [
        { say: "The bakery failure was a search problem. Right chunk, wrong answer, is an answer problem. To fix the right half, you need numbers that separate them.", tone: "ask" },
        {
          say: "For search: for each test question, you know which chunks answer it. Here, three. Search returns them at positions two, seven, and eleven. In the top five, it found one of three. In the top ten, two of three. That's recall at k.",
          term: { word: "Recall@k", meaning: "share of the right chunks found in the top k" },
        },
        {
          say: "And where does the first right one sit? Second. That's worth one half. Averaged over every question, it's called mean reciprocal rank.",
          term: { word: "MRR", meaning: "how high the first right chunk sits, on average" },
        },
        {
          say: "For the answer: list its claims, and check each one against the chunks. Two of three are supported. That's faithfulness.",
          term: { word: "Faithfulness", meaning: "share of the answer's claims backed by its chunks" },
        },
        { say: "Low recall? Fix search. Good recall, but low faithfulness? Fix the answer step.", tone: "key" },
        { say: "And remember: faithful isn't correct. An answer perfectly faithful to an outdated policy is still wrong.", tone: "aside" },
      ],
    },
    {
      kind: "custom",
      name: "recap",
      props: {
        items: [
          ["🩺", "Error analysis", "look, name, count"],
          ["🏅", "Golden set", "fixed cases, run on every change"],
          ["⛔", "Eval gate", "CI blocks a worse change"],
          ["⚖️", "LLM-as-judge", "an instrument: calibrate it"],
          ["🎯", "Recall@k", "did search find it?"],
          ["🔗", "Faithfulness", "did the answer stick to it?"],
        ],
      },
      beats: [
        { say: "Let's lock it in." },
        { say: "Error analysis: look, name, count. Before any metric." },
        { say: "A golden set runs on every change." },
        { say: "And an eval gate blocks the change that makes it worse." },
        { say: "A judge is an instrument. Calibrate it against a person." },
        { say: "Recall at k asks: did search find it?" },
        { say: "And faithfulness asks: did the answer stick to it?", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "cardlist",
      props: {
        title: "Two new problems",
        items: [
          ["🤖", "Planner Copilot says “Done!”", "and updated the wrong warehouse"],
          ["🎲", "it doesn't behave the same twice", "8 runs out of 10: is that working?"],
          ["📈", "one Tuesday, answers get longer", "nothing in your code changed"],
        ],
        pause: "If the final message can lie, what do you check instead?",
      },
      beats: [
        { say: "The bakery bug can't come back silently now. But two new problems appear." },
        { say: "Planner Copilot takes a dozen steps, and changes data. It can write: done! While having updated the wrong warehouse." },
        { say: "It doesn't behave the same way twice. If it succeeds eight times in ten, is that working?" },
        {
          say: "And one Tuesday, answers suddenly get longer, and a few start refusing. Nothing in your code changed. The provider quietly updated the model. So if the final message can lie, what do you check instead?",
          tone: "ask",
          hold: 3,
        },
      ],
    },
    {
      kind: "title",
      eyebrow: "Next",
      title: "Chapter 9 — Testing agents and shipping safely",
      subtitle: "outcomes, trajectories, pass^k, canaries",
      beats: [{ say: "That's chapter nine. See you there.", tone: "excite" }],
    },
  ],
};
