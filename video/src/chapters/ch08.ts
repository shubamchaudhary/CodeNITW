import type { Chapter } from "../lib/types.ts";

// Chapter 8 of the AI Stack: is it actually working? Interview-ready evals.
// The running example is a software company's support chatbot that told a
// customer refunds are allowed for 60 days (the policy says 30).

const JUDGE = `Check one property: is every factual claim in ANSWER
supported by CONTEXT? Supported means stated in, or directly
implied by, the context. Ignore style.

1. List each claim.
2. For each, quote the supporting context, or write NONE.
Then output JSON: {"critique": "...", "grounded": true | false}
grounded is false if any claim is NONE.

<two passing and two failing examples, each with its critique>

CONTEXT: ...
ANSWER: ...`;

export const ch08: Chapter = {
  id: "ch08",
  title: "Is it actually working?",
  voice: "en-US-AndrewMultilingualNeural",
  next: "Chapter 9 — Testing agents and shipping safely",
  scenes: [
    {
      kind: "custom",
      name: "a8hook",
      beats: [
        { say: "A message from the VP of support. Is this thing actually working? And how would we even know?" },
        { say: "Attached, a screenshot. The bot told a customer they can request a refund within sixty days. The policy says thirty." },
        { say: "The tempting move: install an evaluation library, and report helpfulness, four point one out of five. That number says nothing. Not what's wrong, not how often, not what to fix. Let's do it the way the best practitioners do.", tone: "key" },
      ],
    },
    {
      kind: "title",
      eyebrow: "AI Stack · Chapter 8",
      title: "Is it actually working?",
      subtitle: "error analysis, checks, judges and metrics",
      beats: [{ say: "Chapter eight. Is it actually working?" }],
    },
    {
      kind: "bullets",
      title: "By the end, you can answer",
      firstItemStep: 1,
      items: [
        { icon: "🔎", text: "What is error analysis, and why does it come first?" },
        { icon: "⚖️", text: "Code checks vs LLM judges; why pass/fail labels?" },
        { icon: "🧪", text: "How do you know your LLM judge is right?" },
        { icon: "📏", text: "Retrieval metrics vs answer metrics: which tell you what?" },
      ],
      beats: [
        { say: "By the end, you'll be able to answer these." },
        { say: "What error analysis is, and why it comes before any metric." },
        { say: "When to use code checks versus an LLM judge, and why pass or fail beats a one to five score." },
        { say: "How you know your LLM judge is actually right." },
        { say: "And how retrieval metrics and answer metrics split every failure." },
      ],
    },

    // ------------------------------------------------------------ 1
    { kind: "section", num: "1", title: "Look before you measure", beats: [{ say: "First, a definition, and then the most valuable habit in AI engineering." }] },
    {
      kind: "compare",
      title: "An eval is an exam, not a unit test",
      cols: [
        { title: "Unit test", icon: "🧮", tone: "blue", items: ["add(2, 3) == 5", "one right answer, exact check"] },
        { title: "Eval", icon: "📝", tone: "green", items: ["“refunds within 30 days, from the purchase date”", "many correct wordings", "graded by code, a model judge, or a person"] },
      ],
      footer: "golden set: a fixed, versioned set of cases with expected outcomes, run on every change",
      beats: [
        { say: "A unit test checks add two and three equals five. One right answer, an exact check." },
        {
          say: "An eval is a test for an AI system. Give it an input, and grade the output. But an answer like refunds within thirty days has many correct wordings. So grading can mean a code check, a model acting as a judge, or a person's verdict.",
          term: { word: "Eval", meaning: "a graded test for an AI system's output" },
        },
        {
          say: "And a golden set is a fixed, versioned collection of test cases, with their expected outcomes, run against every change.",
          tone: "key",
          term: { word: "Golden set", meaning: "versioned test cases with expected outcomes" },
        },
      ],
    },
    {
      kind: "custom",
      name: "a8piles",
      beats: [
        {
          say: "A doctor doesn't prescribe before reading the charts. So week one: sample a hundred real traces from production, spread across question types and days. That's error analysis.",
          term: { word: "Error analysis", meaning: "read real traces, name and count failures" },
        },
        {
          say: "Read each trace, and write a short note in plain words. Cited the twenty twenty three refund policy. Never searched, answered from memory. Fine. That's open coding.",
          term: { word: "Open coding", meaning: "free-text notes on each trace" },
        },
        {
          say: "Then group the notes into categories, and count them. That's axial coding. Outdated policy version: eleven. Right chunk found, answer contradicts it: six. Account never looked up: five. Too long: four.",
          term: { word: "Axial coding", meaning: "group notes into counted categories" },
        },
        { say: "Now you know what to fix first. And the biggest pile isn't a prompt problem at all. It's old documents that were never deleted. That's the sixty day bug.", tone: "key" },
      ],
    },
    {
      kind: "bullets",
      title: "Common eval mistakes",
      firstItemStep: 1,
      items: [
        { icon: "🏆", text: "Treating benchmark scores as your app's quality" },
        { icon: "📦", text: "Generic metrics instead of your own failure modes" },
        { icon: "🙈", text: "Not looking at the data; outsourcing labels to non-experts" },
        { icon: "🎯", text: "Overfitting prompts to the test set" },
      ],
      beats: [
        { say: "Practitioners like Hamel Husain and Shreya Shankar see the same mistakes again and again." },
        { say: "Treating a model's benchmark scores as your application's quality. They measure different things." },
        { say: "Generic metrics, like helpfulness, instead of checks built from your own failure categories." },
        { say: "Not looking at the data. And handing labelling to people who don't know the domain. The expert who knows the policies must label." },
        { say: "And tweaking prompts until the test set passes. Keep a held back set you don't tune against.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 2
    { kind: "section", num: "2", title: "Turning failures into checks", beats: [{ say: "Four failure categories. How do you check each one automatically?", tone: "ask" }] },
    {
      kind: "custom",
      name: "a8checks",
      beats: [
        { say: "Code first, where code can decide. Every cited chunk is the latest version. The account tool was called whenever an account id appears. The answer is under a hundred and twenty words." },
        {
          say: "A model as judge only where code can't decide. Is every claim actually supported by the chunks it cites?",
          term: { word: "LLM-as-judge", meaning: "a model grading output against criteria" },
        },
        { say: "So: code first, because it's cheap, fast, and never disagrees with itself. A judge where judgement is needed, checked against people. And people, the domain experts, to label examples.", tone: "key" },
      ],
    },
    {
      kind: "compare",
      title: "Pass/fail, not 1 to 5",
      cols: [
        { title: "1–5 scores", icon: "🎚️", tone: "red", items: ["people disagree: is it a 3 or a 4?", "“3.4 average” says nothing to fix"] },
        { title: "Binary checks", icon: "✅", tone: "green", items: ["“cites the correct policy: yes or no?”", "far more agreement", "a failure says exactly what to fix", "nuance = several checks, each with a reason"] },
      ],
      beats: [
        { say: "People, and models, disagree about whether an answer is a three or a four. And three point four, on average, tells you nothing to fix." },
        { say: "They agree far more on yes or no: does it cite the correct policy? A failed check tells you exactly what to fix. Capture nuance as several separate yes or no checks, each with a short written reason.", tone: "key" },
      ],
    },
    {
      kind: "compare",
      title: "Two kinds of suite",
      cols: [
        { title: "Capability evals", icon: "🚀", tone: "purple", items: ["“can it do this hard thing yet?”", "pass rate starts low; you raise it", "e.g. questions about several orders at once"] },
        { title: "Regression evals", icon: "🛡️", tone: "blue", items: ["“does it still do what it did yesterday?”", "near 100%; a drop blocks the change", "solved capability tasks graduate here"] },
      ],
      beats: [
        {
          say: "Keep two kinds of suite. Capability evals ask: can it do this hard thing yet? The pass rate starts low, and you work to raise it.",
          term: { word: "Capability eval", meaning: "can it do this yet? starts low" },
        },
        {
          say: "Regression evals ask: does it still do what it did yesterday? They should stay near a hundred percent, and a drop blocks the change. Once a capability is reliably solved, it graduates into the regression suite.",
          term: { word: "Regression eval", meaning: "still works? stays near 100%" },
        },
      ],
    },
    {
      kind: "bullets",
      title: "A golden set that means something",
      firstItemStep: 1,
      items: [
        { icon: "📐", text: "Start with 50–100 cases; grow to a few hundred" },
        { icon: "🗺️", text: "Spread across every group", sub: "question type, language, difficulty: report per group" },
        { icon: "🧨", text: "Awkward cases on purpose", sub: "unanswerable, ambiguous, adversarial, recently changed" },
        { icon: "🧬", text: "Synthetic from a grid, then reviewed", sub: "type × language × difficulty × persona; real questions keep it honest" },
      ],
      beats: [
        { say: "How to build a golden set that means something." },
        { say: "Start with fifty to a hundred cases, drawn from real failures, and grow towards a few hundred." },
        { say: "Spread them across every group, so you can report results per group, not just one average." },
        { say: "Include awkward cases on purpose: unanswerable questions, ambiguous ones, adversarial ones, and questions about policies that just changed." },
        { say: "And if you generate cases, generate from a grid of type, language, difficulty and persona, and review every one. Questions written from a document reuse its words, and make search look better than it is.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "a8gate",
      beats: [
        {
          say: "Then gate every change in CI. A prompt change opens a pull request. The golden set runs, and results are compared with the main branch, per group.",
          term: { word: "Eval gate", meaning: "CI blocks changes that regress the golden set" },
        },
        { say: "Billing improved slightly. Account questions held. But refund questions dropped from ninety seven to eighty eight percent." },
        { say: "So the merge is blocked. A fix for one category often breaks another, and an average would have hidden it.", tone: "key" },
        { say: "Because model outputs vary between runs: compare with main rather than a fixed number, re run flaky cases a few times, show which cases changed, and cache responses for unchanged inputs." },
      ],
    },

    // ------------------------------------------------------------ 3
    { kind: "section", num: "3", title: "Checking the checker", beats: [{ say: "Now the question every interviewer asks next: and who checks the judge?", tone: "ask" }] },
    {
      kind: "custom",
      name: "a8judge",
      beats: [
        { say: "A judge is a measuring instrument. A kitchen scale that reads two hundred grams low is worse than no scale, because you trust it. So calibrate it. Two hundred answers, labelled pass or fail by the domain expert. Twenty five become examples in the judge's prompt. A hundred are a dev set to iterate on. And seventy five are held back, used once, at the end." },
        { say: "Run the judge on the held back set, and compare with the expert." },
        {
          say: "True positive rate: of the answers the expert passed, the share the judge also passed. Ninety out of a hundred: zero point nine.",
          term: { word: "TPR", meaning: "of real passes, share the judge passed" },
        },
        {
          say: "True negative rate: of the answers the expert failed, the share the judge also failed. This matters most. A judge that misses failures gives false comfort, and one that never fails anything has a TNR of zero.",
          tone: "key",
          term: { word: "TNR", meaning: "of real failures, share the judge caught" },
        },
      ],
    },
    {
      kind: "custom",
      name: "a8kappa",
      beats: [
        {
          say: "Raw agreement can flatter. Say you and the judge agree on thirty four of forty answers. Eighty five percent.",
          term: { word: "Cohen's kappa", meaning: "agreement beyond what chance would give" },
        },
        { say: "But two people flipping coins agree half the time. That's not skill. If each of you passes half the answers, chance agreement is zero point five." },
        { say: "Cohen's kappa removes it: observed minus chance, over one minus chance. Zero point eight five minus zero point five, over zero point five. Zero point seven." },
        { say: "Usually read as substantial agreement.", tone: "key" },
      ],
    },
    {
      kind: "compare",
      title: "How judges go wrong",
      cols: [
        { title: "Position bias", icon: "↔️", tone: "blue", items: ["prefers whichever answer is first", "run both orders; count consistent wins"] },
        { title: "Verbosity bias", icon: "📜", tone: "amber", items: ["prefers longer answers", "criteria about content, not length"] },
        { title: "Self-preference", icon: "🪞", tone: "purple", items: ["prefers its own model family", "judge with a different family"] },
        { title: "Leniency", icon: "😇", tone: "red", items: ["passes too much", "failing examples; reason first; watch TNR"] },
      ],
      footer: "one narrow criterion per judge · “is it helpful?” produces noise",
      beats: [
        { say: "How judges go wrong. Position bias: in a pairwise comparison, it prefers whichever answer comes first. Run both orders, and count only consistent verdicts." },
        { say: "Verbosity bias: it prefers longer answers. Write criteria about content, not length." },
        { say: "Self preference: it prefers answers from its own model family. Judge with a different family." },
        { say: "Leniency: it passes too much. Include failing examples, ask for its reasoning before the verdict, and watch TNR. And one narrow criterion per judge. Is it helpful? produces noise.", tone: "key" },
      ],
    },
    {
      kind: "code",
      title: "A judge prompt that works",
      lang: "text",
      code: JUDGE,
      highlight: [
        [1, 3],
        [5, 6],
        [7, 8],
        [10, 10],
        [12, 13],
      ],
      beats: [
        { say: "Here's a judge prompt that works. One property, defined precisely: is every claim supported by the context?" },
        { say: "Reasoning before the verdict: list each claim, and quote its support, or write none." },
        { say: "A yes or no output, in structured JSON, with a critique." },
        { say: "Examples of failure, as well as success." },
        { say: "And the context and answer fenced off at the end. Narrow, reasoned, binary, with examples." },
      ],
    },
    {
      kind: "custom",
      name: "a8correct",
      beats: [
        { say: "A bonus that impresses interviewers. The judge says eighty two percent of production answers are grounded. But the judge itself isn't perfect." },
        { say: "Knowing its TPR and TNR, you can correct the rate: observed plus TNR minus one, over TPR plus TNR minus one." },
        { say: "Zero point eight two plus zero point eight minus one, over zero point nine plus zero point eight minus one. Zero point six two, over zero point seven. About eighty nine percent." },
        { say: "It's the Rogan Gladen correction, from medical testing. And it only works when TPR plus TNR is clearly above one, another reason to measure them.", tone: "aside" },
      ],
    },

    // ------------------------------------------------------------ 4
    { kind: "section", num: "4", title: "Search metrics and answer metrics", beats: [{ say: "The sixty day bug was a search problem. Right chunk, wrong answer is an answer problem. To fix the right half, measure them separately." }] },
    {
      kind: "custom",
      name: "a8ranks",
      beats: [
        { say: "Search metrics need, for each test question, the chunks that actually answer it. Say three chunks are relevant, and search ranks them at positions two, seven, and eleven." },
        {
          say: "Recall at five: one of three relevant chunks is in the top five. Zero point three three. Recall at ten: two of three. Zero point six seven. Did we find it?",
          term: { word: "Recall@k", meaning: "share of relevant items in the top k" },
        },
        { say: "Reciprocal rank: the first relevant chunk is at position two, so one half. Averaged over questions, that's MRR." },
        {
          say: "Average precision: the precision at each relevant hit, averaged over all relevant chunks. One half, plus two sevenths, over three. Zero point two six. Averaged over questions, that's MAP.",
          term: { word: "MAP", meaning: "mean of average precision over queries" },
        },
        {
          say: "And n D C G: every relevant chunk earns credit, discounted by the log of its position, divided by the score of the perfect order. Zero point four five. Reading: the material is found, but ranked poorly. Add a reranker.",
          tone: "key",
          term: { word: "nDCG", meaning: "position-discounted gain vs the ideal order" },
        },
      ],
    },
    {
      kind: "compare",
      title: "Answer metrics (popularised by RAGAS)",
      cols: [
        { title: "Faithfulness", icon: "🧷", tone: "green", items: ["claims supported by the chunks", "no reference needed"] },
        { title: "Answer relevance", icon: "🎯", tone: "blue", items: ["addresses the question asked", "no reference needed"] },
        { title: "Context precision", icon: "🥇", tone: "purple", items: ["relevant chunks ranked high", "needs relevance labels"] },
        { title: "Context recall", icon: "🧺", tone: "amber", items: ["needed facts were retrieved", "needs a reference answer"] },
      ],
      footer: "low context recall → fix search · good recall, low faithfulness → fix generation",
      beats: [
        { say: "On the answer side, four metrics popularised by the RAGAS library. Faithfulness: the share of the answer's claims supported by the retrieved chunks." },
        { say: "Answer relevance: does it address the question that was asked?" },
        { say: "Context precision: are the relevant chunks ranked near the top?" },
        { say: "And context recall: of the facts in a reference answer, how many were in the retrieved chunks? Low context recall: fix search. Good recall but low faithfulness: fix generation.", tone: "key" },
      ],
    },
    {
      kind: "trap",
      myth: "Faithfulness is 0.95, so the answers are correct.",
      truth: "Faithful isn't correct. An answer perfectly faithful to an outdated policy is still wrong.",
      why: "Suspect the chunks (stale or wrong documents), check context recall and answer relevance, and check the judge's TNR.",
      beats: [
        { say: "The trap: faithfulness is zero point nine five, so the answers are correct." },
        { say: "Faithful isn't correct. An answer perfectly faithful to an outdated policy is still wrong.", tone: "key" },
        { say: "So suspect the chunks: a stale or wrong document. Check context recall and answer relevance. And check the judge isn't lenient." },
      ],
    },
    {
      kind: "trap",
      myth: "Recall@10 rose by 0.02 on 51 questions. Ship it.",
      truth: "0.02 of 51 is about one question. Look at which questions changed, use a paired test, or grow the set.",
      beats: [
        { say: "And one more. Recall at ten went up by zero point zero two, on fifty one questions. Ship it?" },
        { say: "Zero point zero two of fifty one is about one question flipping. Look at which questions improved and which got worse, use a paired test, like a bootstrap, or grow the set to a few hundred.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 5
    { kind: "section", num: "5", title: "Interview round", beats: [{ say: "Interview round.", tone: "excite" }] },
    {
      kind: "sayit",
      q: "How would you evaluate a RAG chatbot?",
      lines: [
        "Start with error analysis: read ~100 real traces, code the failures, count the categories.",
        "Turn each category into a binary check: code where possible, an LLM judge where needed.",
        "Calibrate the judge on expert labels; report TPR and TNR on a held-out set.",
        "Measure search (recall@k, MRR, nDCG) and answers (faithfulness, relevance) separately.",
        "Gate changes in CI per group against main; keep sampling production and growing the set.",
      ],
      beats: [
        { say: "How would you evaluate a RAG chatbot?" },
        { say: "Start with error analysis. Read about a hundred real traces, code the failures, and count the categories." },
        { say: "Turn each category into a binary check. Code where possible, an LLM judge where needed." },
        { say: "Calibrate the judge on expert labels, and report its TPR and TNR on a held out set." },
        { say: "Measure search and answers separately: recall, MRR and n D C G for search, faithfulness and relevance for answers." },
        { say: "And gate changes in CI, per group, against main. Keep sampling production, and keep growing the set.", tone: "key" },
      ],
    },
    {
      kind: "drill",
      items: [
        { q: "Open coding vs axial coding?", a: "Open: a free note per trace. Axial: group notes into categories and count them." },
        { q: "Why binary labels over 1–5?", a: "Higher agreement, and a failure says exactly what to fix." },
        { q: "Which matters more for a judge, TPR or TNR?", a: "Usually TNR: a judge that misses failures gives false comfort." },
        { q: "Why Cohen's kappa instead of raw agreement?", a: "It removes agreement that chance alone would produce." },
        { q: "Recall@k vs precision@k?", a: "Recall: share of relevant items found. Precision: share of the top k that is relevant." },
        { q: "Faithfulness is high but answers are wrong. Why?", a: "The chunks are wrong or stale, or the judge is lenient. Faithful isn't correct." },
        { q: "Capability vs regression eval?", a: "Capability: can it do it yet, starts low. Regression: still works, near 100%, blocks merges." },
      ],
      beats: [
        { say: "Rapid fire. Open coding versus axial coding?", tone: "ask", hold: 2.5 },
        { say: "Open coding is a free note on each trace. Axial coding groups the notes into categories, and counts them." },
        { say: "Why binary labels, over one to five?", tone: "ask", hold: 2.5 },
        { say: "Higher agreement. And a failure says exactly what to fix." },
        { say: "Which matters more for a judge: TPR, or TNR?", tone: "ask", hold: 2.5 },
        { say: "Usually TNR. A judge that misses failures gives false comfort." },
        { say: "Why Cohen's kappa, instead of raw agreement?", tone: "ask", hold: 2.5 },
        { say: "It removes the agreement that chance alone would produce." },
        { say: "Recall at k, versus precision at k?", tone: "ask", hold: 2.5 },
        { say: "Recall is the share of relevant items you found. Precision is the share of the top k that's relevant." },
        { say: "Faithfulness is high, but answers are wrong. Why?", tone: "ask", hold: 2.5 },
        { say: "The chunks are wrong or stale, or the judge is lenient. Faithful isn't correct." },
        { say: "Last one. Capability eval, versus regression eval?", tone: "ask", hold: 2.5 },
        { say: "Capability asks, can it do it yet, and starts low. Regression asks, does it still work. It stays near a hundred percent, and blocks merges.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "recap",
      props: {
        items: [
          ["🔎", "Error analysis", "read, code, count"],
          ["✅", "Binary checks", "code first, judge where needed"],
          ["🧪", "Golden set + CI gate", "per group, against main"],
          ["⚖️", "Judge calibration", "TPR, TNR, kappa"],
          ["📏", "Search metrics", "recall@k, MRR, MAP, nDCG"],
          ["🧷", "Answer metrics", "faithful isn't correct"],
        ],
      },
      beats: [
        { say: "Let's lock it in." },
        { say: "Error analysis first: read real traces, code the failures, and count them." },
        { say: "Binary checks: code first, a judge only where needed." },
        { say: "A golden set, and a CI gate that compares each group against main." },
        { say: "Calibrate every judge: TPR, TNR, and kappa." },
        { say: "Search metrics: recall, MRR, MAP, and n D C G." },
        { say: "And answer metrics, remembering that faithful isn't correct.", tone: "key" },
      ],
    },
    {
      kind: "pause",
      question: "An agent replies “Done! Refund issued.” But it refunded the wrong order. And the same test passes on Monday and fails on Tuesday. How do you test an agent?",
      beats: [
        { say: "Answers are measured now. But agents act." },
        { say: "One replies: done, refund issued. It refunded the wrong order. And the same test passes on Monday, and fails on Tuesday. How do you test an agent?", tone: "ask", hold: 3 },
      ],
    },
    {
      kind: "title",
      eyebrow: "Next",
      title: "Chapter 9 — Testing agents, shipping safely",
      subtitle: "outcomes, trajectories, pass^k, canaries",
      beats: [{ say: "That's chapter nine. See you there.", tone: "excite" }],
    },
  ],
};
