import type { Chapter } from "../lib/types.ts";

// Chapter 1 of the AI Stack (src/Data/aiStackDocs/CH-01.md) as a short
// animated lecture. Not a reading of the notes: each idea starts as something
// you can picture, and only then gets its name (the beat's `term`), so the
// word sticks. Coverage is deliberately lighter than the notes.

export const ch01: Chapter = {
  id: "ch01",
  title: "How an LLM works",
  voice: "en-US-AndrewMultilingualNeural",
  next: "Chapter 2 — RAG from scratch",
  scenes: [
    {
      kind: "custom",
      name: "hook",
      beats: [
        { say: "Here's a strange thing.", tone: "excite" },
        { say: "You ask a chatbot about your company's refund policy. It answers instantly. Clear. Confident. Polite." },
        { say: "And the rule it just gave you... does not exist.", tone: "key" },
        { say: "How can a machine make something up, with a straight face? By the end of this video, you'll know exactly why. And you'll know the one thing you control to keep it in line." },
      ],
    },
    {
      kind: "title",
      eyebrow: "AI Stack · Chapter 1",
      title: "How an LLM works",
      subtitle: "explained like you're new to it",
      beats: [{ say: "Chapter one. How a large language model actually works." }],
    },

    // ------------------------------------------------------------ 1
    { kind: "section", num: "1", title: "A very, very fancy autocomplete", beats: [{ say: "Let's start with something you use every day." }] },
    {
      kind: "custom",
      name: "phone2",
      beats: [
        { say: "Type: see you, on your phone. The keyboard suggests: tomorrow." },
        { say: "It doesn't understand you. It has just seen, see you tomorrow, so many times that tomorrow is the most likely next word." },
        { say: "Now imagine that keyboard has read... almost the entire internet.", tone: "excite" },
        {
          say: "That's it. That's a large language model. A machine that predicts the next piece of text.",
          tone: "key",
          term: { word: "LLM", meaning: "a machine that predicts the next piece of text" },
        },
      ],
    },
    {
      kind: "custom",
      name: "quiz",
      beats: [
        { say: "So how does it get so good at guessing? Practice. Trillions of tiny quizzes.", tone: "ask" },
        { say: "Hide the next word. Let the model guess. Wrong? Nudge its internal dials, just a little." },
        { say: "Those dials are called parameters. Big models have billions of them.", term: { word: "Parameters", meaning: "billions of dials, tuned by practice" } },
        { say: "Repeat that trillions of times, and something surprising happens. To guess Paris, it had to learn a fact. To guess the next line of a maths problem, it had to learn something that looks like reasoning." },
        { say: "Nobody taught it facts. Facts were just useful for guessing the next word.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "idea",
      beats: [
        { say: "But here's the catch. Remember this one sentence, because it explains almost every failure you'll ever see." },
        { say: "It writes what is likely. Not what is checked.", tone: "key" },
        { say: "Usually, likely and true are the same thing. When they're not, you get that confident, made-up refund rule." },
      ],
    },
    {
      kind: "custom",
      name: "bricks",
      beats: [
        { say: "One more detail. The model doesn't actually read words. It reads chunks, a bit like Lego bricks." },
        { say: "Refund might be two bricks: ref, and und. Milk is just one." },
        { say: "These bricks are called tokens. And each one is really just a number.", tone: "key", term: { word: "Token", meaning: "a chunk of text the model reads, stored as a number" } },
        { say: "Handy rule: a hundred tokens is about seventy-five English words.", tone: "aside" },
      ],
    },
    {
      kind: "custom",
      name: "brickcost",
      beats: [
        { say: "This solves a puzzle from finance: why does the same question cost more in Marathi?", tone: "ask" },
        { say: "The box of bricks was built mostly from English. English words fit in a few big bricks. Marathi needs lots of small ones." },
        { say: "And you pay per brick. Same question. Bigger bill.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 2
    { kind: "section", num: "2", title: "Why the same question gets two answers", beats: [{ say: "Now, a mystery.", tone: "excite" }] },
    {
      kind: "custom",
      name: "wheel",
      props: { mode: "basic" },
      beats: [
        { say: "Meera runs support. She asked the chatbot the same question twice, and got two different answers." },
        { say: "Here's why. When the model picks the next word, it doesn't have one answer. It has a list of options, each with a chance." },
        { say: "Within: sixty-two percent. Only: twenty-one percent. And a long tail of others." },
        { say: "And then... it spins the wheel.", tone: "excite" },
        { say: "That spin is called sampling. One spin, for every single word.", tone: "key", term: { word: "Sampling", meaning: "picking the next token by a weighted spin" } },
        { say: "So if an early spin lands on only, instead of within, the whole answer heads somewhere else." },
        { say: "Same question. Different spin. Different answer. Mystery solved.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "wheel",
      props: { mode: "temp" },
      beats: [
        { say: "And you control the wheel, with a dial called temperature.", term: { word: "Temperature", meaning: "how even the wheel's slices are" } },
        { say: "Turn it down, and the favourite slice grows. Answers become predictable." },
        { say: "Turn it up, and the slices even out. Answers get creative. Sometimes, a little weird." },
        { say: "At zero, there's no spin at all. It always takes the favourite.", tone: "key" },
        { say: "There's also a pair of scissors called top p. It cuts away the tiny, absurd slices before the spin.", term: { word: "Top-p", meaning: "cut the unlikely tail before spinning" } },
        { say: "So: refund rules? Low temperature. Ten catchy email subject lines? Turn it up." },
        { say: "One thing interviewers love: even at zero, a hosted model isn't perfectly repeatable. Tiny rounding differences on shared chips can flip a near tie. So pin the model version, and expect small variations.", tone: "aside" },
      ],
    },

    // ------------------------------------------------------------ 3
    { kind: "section", num: "3", title: "Why it makes things up", beats: [{ say: "Back to that invented refund rule." }] },
    {
      kind: "custom",
      name: "nopolicy",
      beats: [
        { say: "The model learned from the public internet. FreshCart's refund policy? Private. It was never in there." },
        { say: "So when you ask about it, the model does what it always does: it writes the most likely-sounding answer." },
        {
          say: "A generic, believable refund rule. Fluent. Confident. Wrong. This is called a hallucination.",
          tone: "key",
          term: { word: "Hallucination", meaning: "likely-sounding text that isn't true" },
        },
        { say: "Can't we just train it on our policies? Usually, no. Training teaches habits and style well, but facts learned that way are fuzzy, and you'd retrain every time a policy changes." },
      ],
    },
    {
      kind: "flow",
      title: "How a text predictor becomes a chatbot",
      cols: 4,
      rows: 1,
      nodeW: 380,
      nodeH: 190,
      nodes: [
        { id: "PT", c: 0, r: 0, label: "Pretraining\nread the internet,\npredict next words" },
        { id: "SFT", c: 1, r: 0, label: "Instruction tuning\nexamples of\ngood answers" },
        { id: "PREF", c: 2, r: 0, label: "Preference training\npeople pick the\nbetter answer", tone: "green" },
        { id: "RL", c: 3, r: 0, label: "Reasoning training\nrewarded for right\nmaths and code", tone: "purple" },
      ],
      edges: [
        { from: "PT", to: "SFT" },
        { from: "SFT", to: "PREF" },
        { from: "PREF", to: "RL" },
      ],
      show: [["PT"], ["SFT"], ["PREF"], ["RL"]],
      beats: [
        { say: "Quick detour. How does a next-word predictor become a helpful chatbot? First, pretraining: read the internet, predict next words. Ask that raw model a question, and it might just continue with more questions." },
        { say: "Then instruction tuning: thousands of examples of good answers." },
        { say: "Then preference training: people pick the better of two answers. That's where the polite, helpful tone comes from." },
        { say: "And newer reasoning models get rewarded for getting maths and code right, so they learn to think step by step before answering." },
      ],
    },
    {
      kind: "pause",
      question: "Why does a longer prompt cost more, even when the answer is short?",
      beats: [{ say: "Quick question for you. Why would a longer prompt cost more, even when the answer is short? Think about it for a second.", tone: "ask", hold: 3 }],
    },

    // ------------------------------------------------------------ 4
    { kind: "section", num: "4", title: "A peek inside", beats: [{ say: "To answer that, let's peek inside." }] },
    {
      kind: "custom",
      name: "spotlight",
      beats: [
        { say: "First, every token becomes a list of numbers: its spot on a giant map of meaning. Words used in similar ways land close together." },
        { say: "Now the clever part. Take this sentence: The milk was spoiled, so the customer returned it." },
        { say: "What does it mean? You know instantly: the milk. The model works it out by letting it look back at every earlier word, and shine a light on the ones that matter.", at: "the" },
        { say: "That's called attention.", tone: "key", term: { word: "Attention", meaning: "each word looks back at the words that matter to it" } },
        { say: "Stack dozens of these layers, each one refining the meaning, and out the other end comes... the spinning wheel for the next word." },
      ],
    },
    {
      kind: "custom",
      name: "cost",
      beats: [
        { say: "Now the cost question answers itself. Before writing a single word, every token of your prompt goes through every layer. And attention compares each token with all the ones before it." },
        { say: "Double the prompt, and the work more than doubles.", tone: "key" },
        { say: "It's also why you can't paste in all twelve thousand company documents. They won't fit in the model's context window: the most text it can handle at once.", term: { word: "Context window", meaning: "the most text one call can hold" } },
        { say: "And even when it fits, things buried in the middle of a huge prompt get overlooked.", tone: "aside" },
      ],
    },

    // ------------------------------------------------------------ 5
    { kind: "section", num: "5", title: "Steering it with the prompt", beats: [{ say: "So what can you actually control?", tone: "ask" }] },
    {
      kind: "custom",
      name: "tickets2",
      beats: [
        { say: "You can't retrain it. You can't paste in everything. What's left is the prompt: the instructions you send with every request.", tone: "key", term: { word: "Prompt", meaning: "your instructions, sent with every request" } },
        { say: "First real task: three thousand support tickets a day, sorted by hand into refund, late delivery, missing item, and other." },
        { say: "Attempt one: a single line of instructions. Eighty-one percent correct. Not bad." },
        { say: "Then people start adding patches. IMPORTANT! Refunds are not complaints! And every patch breaks something else." },
      ],
    },
    {
      kind: "custom",
      name: "brief",
      beats: [
        { say: "Here's what works. Brief it like a smart new colleague on day one." },
        { say: "Who it is, and what the goal is." },
        { say: "Clear definitions, especially for the confusing cases." },
        { say: "A few examples, picked from the hard ones. That's called few-shot prompting.", term: { word: "Few-shot", meaning: "showing a few examples in the prompt" } },
        { say: "And exactly what shape the answer should take." },
        { say: "Same model. Ninety-three percent.", tone: "excite" },
        { say: "No magic words. Clear instructions, good examples, and testing every change against those labelled tickets. Prompting, done well, is engineering.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "recap",
      beats: [
        { say: "Let's lock it in." },
        { say: "An LLM predicts the next token." },
        { say: "It picks by spinning a weighted wheel, and temperature shapes that wheel." },
        { say: "It writes what's likely, not what's checked, so it hallucinates about things it never saw." },
        { say: "Attention lets each word look back at the words that matter." },
        { say: "And the prompt is your steering wheel.", tone: "key" },
      ],
    },
    {
      kind: "pause",
      visual: "docs",
      question: "Only 2 or 3 pages out of 12,000 matter for each question. If you could find them first, what would you do with them?",
      beats: [
        { say: "But Meera wants the real thing now: answers from FreshCart's actual policies." },
        { say: "Only two or three pages, out of twelve thousand documents, matter for each question. If you could find those pages first, in a split second... what would you do with them?", tone: "ask", hold: 3 },
      ],
    },
    {
      kind: "title",
      eyebrow: "Next",
      title: "Chapter 2 — RAG from scratch",
      subtitle: "find the right pages, then answer",
      beats: [{ say: "That's chapter two. See you there.", tone: "excite" }],
    },
  ],
};
