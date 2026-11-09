import type { Scene } from "../../lib/types.ts";
import { B, sec } from "./h.ts";
import { check } from "./k.ts";

// Part 9: how the evals are calculated: the gate (precision, recall, F1,
// incident recall, call reduction), retrieval (recall@k, MRR, the ablation),
// answers (citations, abstention, faithfulness), the judge's calibration and
// the CI gate.
export const p9: Scene[] = [
  // ------------------------------------------------------------ 24
  sec("24", "Evals I: scoring the anomaly gate", "Topic twenty four. How the evals are calculated. Starting with the gate, because it decides both the quality and the cost."),
  {
    kind: "bullets",
    title: "First, you need labels",
    items: [
      { icon: "🧪", text: "A seeded log generator", sub: "Spring-style app logs · 6 hours, 2 lines/s ≈ 43,700 lines, 360 windows · byte-identical for a given seed" },
      { icon: "🎯", text: "12 injected incidents per log, with gold timelines and gold line numbers", sub: "three background-noise levels: low, medium, high" },
      { icon: "🔒", text: "Held-out seeds 101, 202, 303", sub: "never looked at while building the rules" },
      { icon: "🌍", text: "Real logs too", sub: "Loghub BGL (real alert labels), Thunderbird, HDFS, Spark, Apache · and the owner's own 10k-line log" },
    ],
    beats: B(
      "You can't score a detector without labels, and nobody labels forty thousand log lines by hand. So the first piece is a seeded log generator. Spring style application logs, six hours at two lines a second, about forty three thousand seven hundred lines, three hundred and sixty one minute windows. The same seed always produces the same bytes.",
      { say: "Into each log it injects twelve incidents, and it writes down their gold timelines and the gold line numbers. So the ground truth is exact. Three levels of background noise.", term: { word: "Gold labels", meaning: "the known right answer, written by the generator" } },
      "Held out seeds, one oh one, two oh two and three oh three, that were never looked at while building the rules. That's the defence against overfitting.",
      "And real logs too: the Loghub B G L set with real alert labels, four other Loghub formats, and your own ten thousand line log.",
    ),
  },
  {
    kind: "big",
    tone: "idea",
    lead: "Score the production code",
    text: "The eval runs the production chunker, parsers and gate. No copy, no LLM.",
    after: "a Testcontainers test checks the SQL rules flag exactly the windows the Java rules do",
    beats: B(
      "And one rule that makes the numbers trustworthy.",
      { say: "The eval runs the production chunker, the production parsers, and the production gate. Not a copy, and no LLM. So it costs nothing, it's deterministic, and it measures what actually ships.", tone: "key" },
      "And since the finalizer runs the session wide rules as SQL, an integration test checks that the SQL flags exactly the same windows as the Java rules the eval uses.",
    ),
  },
  {
    kind: "custom",
    name: "dlleval",
    beats: B(
      "Let's calculate the metrics by hand, on thirty one minute windows.",
      "The gold labels: an injected incident covers these ten windows. Three incidents: five minutes, four minutes, and one.",
      "The gate flags nine windows. These are the ones that would go to the LLM.",
      { say: "Now compare them, window by window. Flagged and real: a true positive, seven of them. Flagged but not real: a false positive, two. Real but missed: a false negative, three. And eighteen quiet windows, correctly left alone.", term: { word: "TP · FP · FN", meaning: "flagged & real · flagged & not · real & missed" } },
      { say: "Precision: of what you flagged, how much was real. True positives over true plus false positives. Seven over nine: nought point seven eight.", term: { word: "Precision", meaning: "TP / (TP + FP)" } },
      { say: "Recall: of what was real, how much you caught. Seven over seven plus three: nought point seven.", term: { word: "Recall", meaning: "TP / (TP + FN)" } },
      { say: "F one, the harmonic mean, so neither can hide the other. Two times P times R, over P plus R: nought point seven four.", term: { word: "F1", meaning: "2PR / (P + R)" } },
      { say: "And two more. Incident recall: did each incident get at least one flagged minute? All three did: one point oh. And the call reduction: one minus the calls with the gate over the calls without it. Here nine of thirty windows go to the model: seventy percent fewer.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "Two more, that an SRE cares about",
    items: [
      { icon: "🔔", text: "False alarms per hour", sub: "false positives ÷ hours of log · what an on-call engineer actually feels" },
      { icon: "⏱", text: "Detection delay", sub: "first flagged window − the incident's start, in seconds" },
      { icon: "🧮", text: "Call reduction, in real calls", sub: "calls = Σ segments of 5,000 chars (split on record boundaries) over the windows sent" },
    ],
    beats: B(
      "Two more metrics an on call engineer cares about. False alarms per hour: false positives divided by the hours of log. Precision is abstract; a pager going off is not.",
      "Detection delay: the first flagged window minus the incident's start, in seconds.",
      { say: "And the call reduction is counted in real calls, not windows. A window becomes as many calls as it has five thousand character segments, so big windows count for more.", tone: "key" },
    ),
  },
  {
    kind: "numbers",
    title: "What the gate eval measured",
    items: [
      { value: "0.90", label: "F1, medium noise", sub: "precision 0.88 · recall 0.92", tone: "green" },
      { value: "36 / 36", label: "incidents found", sub: "12 per noise level", tone: "blue" },
      { value: "1.5", label: "false alarms per hour", sub: "medium noise", tone: "amber" },
      { value: "0.92-0.95", label: "F1 on held-out seeds", sub: "logs never tuned on", tone: "purple" },
    ],
    footer: "and at least 71% fewer LLM calls at every traffic rate from 1 to 50 lines/s",
    beats: B(
      "And the real numbers. F one of nought point nine on the medium noise corpus. Precision nought point eight eight, recall nought point nine two.",
      "Thirty six of thirty six injected incidents found, twelve at each noise level.",
      "One and a half false alarms per hour.",
      { say: "And on the held out seeds, the logs the rules were never tuned on, F one between nought point nine two and nought point nine five. That's the answer to: aren't you overfitting your own generator?", tone: "key" },
      "And the call reduction stayed at least seventy one percent at every traffic rate, from one line a second to fifty.",
    ),
  },
  check({
    topic: "gate evals",
    q: "The gate flags 18 windows; 15 are real. There were 20 real incident windows. Precision, recall?",
    options: ["P 0.75 · R 0.83", "P 0.83 · R 0.75", "P 0.90 · R 0.75", "P 0.83 · R 0.90"],
    answer: 1,
    a: "Precision = 15 / 18 = 0.83 (of what you flagged, how much was real). Recall = 15 / 20 = 0.75 (of what was real, how much you caught). F1 ≈ 0.79.",
    aSay: "B. Precision is fifteen over eighteen, nought point eight three: of what you flagged, how much was real. Recall is fifteen over twenty, nought point seven five: of what was real, how much you caught. F one comes out at about nought point seven nine.",
  }),

  // ------------------------------------------------------------ 25
  sec("25", "Evals II: scoring retrieval", "Topic twenty five. Retrieval. Does the search put the right windows in front of the model?"),
  {
    kind: "bullets",
    title: "The golden Q&A set",
    items: [
      { icon: "❓", text: "65 questions over the medium-noise log", sub: "\"why did checkout return 503s after 10:40?\" · \"which provider throttled payments?\"" },
      { icon: "🚫", text: "21.5% are unanswerable on purpose", sub: "the right answer is \"not in the logs\"" },
      { icon: "🧮", text: "Gold answers and gold line numbers are computed by code", sub: "from the incident labels, not written by hand" },
      { icon: "🎯", text: "A gold chunk = a chunk whose line range contains a gold line", sub: "line_start ≤ gold line ≤ line_end" },
    ],
    beats: B(
      "The retrieval eval needs questions with known answers. Sixty five of them, over the medium noise log. Why did checkout return five oh threes after ten forty. Which provider throttled payments.",
      "Twenty one and a half percent are unanswerable on purpose. The right answer to those is: that's not in the logs.",
      { say: "And the gold answers and gold line numbers are computed by code from the incident labels, not written by hand. So they're exact, and cheap to regenerate.", tone: "key" },
      "A gold chunk is any chunk whose line range contains a gold line. Line start, less than or equal to the gold line, less than or equal to line end.",
    ),
  },
  {
    kind: "bullets",
    title: "Recall@k and MRR, worked once",
    items: [
      { icon: "🎣", text: "recall@k = gold chunks in the top k ÷ all gold chunks", sub: "2 gold chunks, 1 of them in the top 10 → recall@10 = 0.5 · averaged over questions" },
      { icon: "🥇", text: "MRR = 1 ÷ rank of the first gold chunk", sub: "first gold chunk at rank 3 → 1/3 · averaged: how close to the top the best evidence is" },
      { icon: "📐", text: "Why report k = 5, 10 and 30", sub: "30 is what the grader reads; 5 and 10 show what a smaller context would lose" },
    ],
    beats: B(
      { say: "Recall at k: the gold chunks that made it into the top k, divided by all the gold chunks for that question. Two gold chunks, one in the top ten: recall at ten is a half. Then average over the questions.", term: { word: "recall@k", meaning: "gold found in the top k ÷ all gold" } },
      { say: "M R R, mean reciprocal rank: one over the rank of the first gold chunk. First gold chunk at rank three: one third. It says how close to the top the best evidence lands.", term: { word: "MRR", meaning: "mean of 1 / rank of the first gold hit" } },
      "And why k equals five, ten and thirty? Thirty is exactly what the grader in Graph two reads. Five and ten show what you'd lose with a smaller context.",
    ),
  },
  {
    kind: "chart",
    title: "The ablation: recall@10 and recall@30 by retriever",
    type: "bars",
    labels: ["vector only", "full text only", "hybrid (RRF)"],
    series: [
      { name: "recall@10", values: [0.393, 0.779, 0.757], tone: "blue", step: 1 },
      { name: "recall@30", values: [0.441, 0.852, 0.874], tone: "green", step: 2 },
    ],
    max: 1,
    note: { step: 3, text: "hybrid wins at depth 30, the depth the grader reads", tone: "green" },
    beats: B(
      "Then an ablation: switch off one leg at a time, same questions.",
      "Recall at ten. Vector only, nought point three nine. Full text only, nought point seven eight. Hybrid, nought point seven six.",
      "Recall at thirty. Vector only, nought point four four. Full text only, nought point eight five. Hybrid, nought point eight seven, the best.",
      { say: "So hybrid wins at depth thirty, which is exactly the depth the grader reads. And in logs, the full text leg carries a lot of the weight, because of exact tokens. Say that nuance yourself; it shows you read your own numbers.", tone: "key" },
    ),
  },
  {
    kind: "seq",
    title: "The bug the ablation found",
    actors: [
      { id: "q", name: "Question", icon: "❓" },
      { id: "v", name: "Vector leg", icon: "🧭" },
      { id: "f", name: "Full-text leg", icon: "🔤" },
      { id: "r", name: "RRF", icon: "🔀" },
    ],
    msgs: [
      { from: "q", to: "v", label: "embed → 30 rows", step: 1 },
      { from: "q", to: "f", label: "which AND upstream AND provider AND …", step: 2, tone: "red" },
      { from: "f", to: "r", label: "0 rows", step: 3, tone: "red", dash: true },
      { from: "v", to: "r", label: "30 rows: \"hybrid\" = vector only", step: 4, dash: true },
    ],
    note: { step: 5, text: "fix: OR the meaningful terms + a stored tsvector · recall@10 0.393 → 0.757 · 1,374 ms → 19 ms", tone: "green" },
    beats: B(
      "And here's the best story the evals produced. In the first ablation, hybrid scored exactly the same as vector only, to three decimal places. That's not a coincidence. It's a dead leg.",
      "The vector leg returned its thirty rows, as expected.",
      "But the full text leg used a query function that ANDs every word. With the simple configuration, words like which and the became required.",
      "So it matched zero rows, for any natural question.",
      "And RRF fused a single list. Hybrid was vector only, behind a UI that looked fine.",
      { say: "The fix: OR the meaningful terms, and store the text vector as a generated column with a gin index. Recall at ten went from nought point three nine to nought point seven six, and the full text leg from over a second to nineteen milliseconds. That's the interview story: my eval found it, and I fixed it with a before and an after.", tone: "key" },
    ),
  },
  check({
    topic: "retrieval evals",
    q: "A question has 4 gold chunks; 3 are in the top 30, and the first one is at rank 2. Recall@30 and reciprocal rank?",
    a: "recall@30 = 3 / 4 = 0.75. Reciprocal rank = 1 / 2 = 0.5 (ranks counted from 1 here). MRR is that, averaged over all questions.",
    aSay: "Recall at thirty is three over four, nought point seven five. The reciprocal rank is one over two, a half, counting ranks from one. M R R is that value, averaged over every question.",
  }),

  // ------------------------------------------------------------ 26
  sec("26", "Evals III: answers, the judge, and CI", "Topic twenty six. Scoring the answers themselves, how far to trust an LLM judge, and how all of it guards every commit."),
  {
    kind: "bullets",
    title: "Scoring an answer: check by code first",
    items: [
      { icon: "✅", text: "Correctness, checked by code", sub: "numbers, times and entities compared with the gold answer: no judge needed" },
      { icon: "🙅", text: "Abstention", sub: "unanswerable: did it say \"not in the logs\"? · answerable: did it refuse wrongly?" },
      { icon: "🔗", text: "Citations: validity, precision, recall", sub: "cited ids were retrieved · share of cited chunks with a gold line · at least one cited gold chunk" },
      { icon: "🧑‍⚖️", text: "Faithfulness, by an LLM judge", sub: "supported claims ÷ claims in the answer · only for what code can't check" },
    ],
    beats: B(
      { say: "Scoring an answer. Check by code first. Correctness for numbers, times and entities is compared with the gold answer by code. No judge needed.", tone: "key" },
      "Abstention. On the unanswerable questions: did it correctly say not in the logs? On the answerable ones: did it refuse when it shouldn't have?",
      { say: "Citations. Validity: were the cited IDs actually retrieved. Precision: the share of cited chunks that contain a gold line. Recall: did at least one cited chunk contain a gold line. An answer citing four chunks, three with gold lines, has citation precision nought point seven five.", term: { word: "Citation precision", meaning: "cited chunks with a gold line ÷ cited chunks" } },
      { say: "And faithfulness, by an LLM judge: the share of the answer's claims that the cited text supports. Five claims, four supported: nought point eight. Only for the free text claims that code can't check.", term: { word: "Faithfulness", meaning: "supported claims ÷ claims" } },
    ),
  },
  {
    kind: "bullets",
    title: "How far to trust a judge",
    items: [
      { icon: "🪞", text: "Self-preference", sub: "a judge favours its own model family's style → judge with a different family" },
      { icon: "🥇", text: "Position and length bias", sub: "favours the first option, or the longer answer → fixed formats, temperature 0" },
      { icon: "🧑‍🔬", text: "Calibrate against ~40 human labels", sub: "Cohen's kappa = (p_o − p_e) / (1 − p_e) · trust the totals at κ ≥ 0.6" },
      { icon: "💾", text: "Cache every call, cap the spend", sub: "key = hash(prompt, model, params, endpoint) · hard stop at $5" },
    ],
    beats: B(
      "How far can you trust a judge? It has known biases. Self preference: it favours its own model family's style, so judge with a different family than the writer.",
      "Position and length bias: it favours whichever option comes first, or the longer answer. Fixed formats, and temperature zero.",
      { say: "And calibrate it. Label about forty answers yourself, and compute Cohen's kappa: agreement beyond chance. Observed agreement minus expected agreement, over one minus expected. Say you agree on thirty four of forty, so p o is nought point eight five, and chance agreement p e is nought point six. Kappa is nought point two five over nought point four: nought point six two five. At nought point six or above, you trust the judge's totals.", term: { word: "Cohen's kappa", meaning: "agreement beyond chance: (pₒ − pₑ) / (1 − pₑ)" } },
      "And cost control: every LLM call in the evals is cached by a hash of the prompt, model, parameters and endpoint, and the harness stops hard at five dollars.",
    ),
  },
  {
    kind: "code",
    title: "The CI gate: evals/thresholds.json",
    lang: "json",
    code: `{
  "_why": "Set from the first robust-mode run (eval_mediumnoise: F1 0.901,
           incident recall 1.0, call reduction 77.8%). The eval is
           deterministic, so any drop is a real behaviour change, not noise.",
  "anomaly_gating": {
    "eval_mediumnoise": {
      "window.f1": 0.88,
      "incident_recall": 1.0,
      "gating.call_reduction": 0.75
    }
  }
}`,
    highlight: [[2, 4], [7, 7], [8, 8], [9, 9]],
    beats: B(
      { say: "And the evals guard every commit. C I runs the unit tests, the Testcontainers tests, and the fast seeded eval, in about a minute, for zero dollars, and fails the build below these thresholds. They were set from the first robust run, and because the eval is deterministic, a drop is a real change in behaviour, not noise.", tone: "key" },
      "Window F one must stay at or above nought point eight eight.",
      "Incident recall must stay at one: every injected incident found.",
      "And the call reduction must stay at or above seventy five percent on this corpus. A change that quietly sends more windows to the LLM fails the build.",
    ),
  },
  {
    kind: "big",
    tone: "idea",
    lead: "Quote numbers honestly",
    text: "Quote answer-quality numbers only from a run you have done with a real model.",
    after: "the harness is wired and cached; faithfulness and kappa come from that run, with its date and commit",
    beats: B(
      "One honesty rule for the interview.",
      { say: "The gate and retrieval numbers are deterministic and free, so quote them. The answer quality numbers need a real model and an API key. Quote them only from a run you've actually done, with its date and commit hash.", tone: "key" },
      "The harness writes both into every report, so that's easy to do.",
    ),
  },
  check({
    topic: "answer evals",
    q: "Which answer metrics need an LLM judge, and which are checked by code?",
    options: ["All of them need a judge", "Correctness, abstention and citations by code; only faithfulness by a judge", "Only abstention needs a judge", "Citations need a judge"],
    answer: 1,
    a: "Code checks correctness (numbers, times, entities), abstention and all three citation metrics. Only faithfulness (claims supported by the cited text) needs a judge.",
    aSay: "B. Code checks correctness for numbers, times and entities, abstention, and all three citation metrics. Only faithfulness, whether the claims are supported by the cited text, needs a judge.",
  }),
  check({
    topic: "the judge",
    q: "Your judge reports 95% faithfulness. An interviewer asks: \"so 5% hallucination?\" What do you say?",
    a: "Only if the judge agrees with humans. I'd show its Cohen's kappa against ~40 human labels; at κ ≥ 0.6 the total is trustworthy, below it the judge prompt needs fixing first.",
    aSay: "Only if the judge agrees with humans. I'd calibrate it against about forty human labels and report Cohen's kappa. At nought point six or above, I trust the total. Below that, I fix the judge before I quote its number.",
  }),
];
