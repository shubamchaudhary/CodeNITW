import type { Chapter } from "../lib/types.ts";

// Chapter 12 (src/Data/aiStackDocs/CH-12.md): the finale. Changing the model
// itself, running it yourself, connecting tools once with MCP, and the whole
// FreshCart system, box by box.

export const ch12: Chapter = {
  id: "ch12",
  title: "Going further",
  voice: "en-US-AndrewMultilingualNeural",
  scenes: [
    {
      kind: "custom",
      name: "cardlist",
      props: {
        title: "Three requests close the story",
        items: [
          ["🏷️", "a cheaper, faster classifier, and FreshCart's own voice", "change the model itself"],
          ["🏠", "keep customer data in our own cloud", "run a model yourself"],
          ["🔌", "one inventory connector for three apps", "connect a tool once"],
        ],
      },
      beats: [
        { say: "Three requests close the story. And each needs something new." },
        { say: "A cheaper, faster ticket classifier, and notifications in FreshCart's own voice. That means changing the model itself." },
        { say: "Customer data that never leaves FreshCart's own cloud. That means running a model yourself." },
        { say: "And one inventory connector for three apps. That means connecting a tool, once.", tone: "key" },
      ],
    },
    {
      kind: "title",
      eyebrow: "AI Stack · Chapter 12",
      title: "Going further",
      subtitle: "fine-tuning, serving, MCP, and the whole system",
      beats: [{ say: "Chapter twelve. The finale. Going further.", tone: "excite" }],
    },

    // ------------------------------------------------------------ 1
    { kind: "section", num: "1", title: "Changing the model itself", beats: [{ say: "First, the classifier, and the voice." }] },
    {
      kind: "custom",
      name: "manual",
      beats: [
        { say: "Back in chapter one, we said fine tuning is the wrong tool for policies. So why is it the right tool now?", tone: "ask" },
        { say: "Think about a new employee. For facts, you hand them the manual. Always current, easy to update, and they can point at the page. That's RAG." },
        {
          say: "For a skill, you train them for a week on one job. A format, a style, one narrow task, done the same way every time. Continuing to train the model on your own examples is fine tuning.",
          term: { word: "Fine-tuning", meaning: "more training on your examples, to change behaviour" },
        },
        { say: "The classifier and the brand voice are behaviour, not knowledge. So these two are fine tuning problems.", tone: "key" },
        { say: "And the twelve thousand policies? Still knowledge. Still RAG.", tone: "aside" },
      ],
    },
    {
      kind: "custom",
      name: "stickynotes",
      beats: [
        { say: "But rewriting every one of a model's billions of weights needs a lot of GPU memory, and a full copy of the model for every task." },
        {
          say: "So freeze the book, and add sticky notes. Train only two small matrices beside the frozen weights, often well under one percent of the model. That's LoRA.",
          term: { word: "LoRA", meaning: "train small add-on matrices; the base stays frozen" },
        },
        { say: "The result is a small adapter file. One base model can serve many adapters, swapped per request. The classifier now, the brand voice next.", tone: "key" },
        { say: "QLoRA does the same on a base stored with four bit numbers, so even big models fit on one GPU.", tone: "aside" },
      ],
    },
    {
      kind: "custom",
      name: "pairs",
      beats: [
        { say: "For the brand voice, there's an easier way to teach. Which of these two sounds more like FreshCart? Picking the better one is easier than writing the perfect one." },
        { say: "One approach trains a separate reward model on those picks, then trains the main model by trial and reward. Powerful, but complex." },
        {
          say: "The simpler one trains straight on the pairs. Picked answers become more likely. Rejected ones, less. That's direct preference optimisation.",
          term: { word: "DPO", meaning: "learn directly from picked vs rejected pairs" },
        },
      ],
    },
    {
      kind: "custom",
      name: "apprentice",
      beats: [
        {
          say: "Now the classifier. A master, and an apprentice. A small model learns to imitate a large one, on one narrow task. That's distillation.",
          term: { word: "Distillation", meaning: "a small model learns one task from a big one" },
        },
        { say: "The large model labels a few thousand tickets. People check the hard ones. Fine tune the small model with LoRA. Then test it on tickets it never saw." },
        {
          say: "And keep a safety net. The small model answers when it's confident. When it's unsure, the ticket goes to the large model. That's a cascade.",
          term: { word: "Cascade", meaning: "small model first; unsure cases go to the big one" },
        },
        { say: "Three hundred thousand tickets a day: from about six hundred dollars, to about ninety.", tone: "excite" },
      ],
    },

    // ------------------------------------------------------------ 2
    { kind: "section", num: "2", title: "Running your own model", beats: [{ say: "Next: legal wants it in our own cloud." }] },
    {
      kind: "custom",
      name: "bus",
      beats: [
        { say: "One GPU serving one request at a time is mostly idle. It's a bus, carrying one passenger." },
        { say: "Batch requests together, and they share each pass through the weights. But the simple way is a bus that waits at the terminus until its very last passenger gets off." },
        {
          say: "Instead, let riders get on and off at every stop. A request finishes, its seat frees, and a waiting one takes it, at the very next step. That's continuous batching.",
          tone: "key",
          term: { word: "Continuous batching", meaning: "requests join and leave the batch at every step" },
        },
        { say: "And what runs out first? Memory for the KV cache. Modern engines hand it out in small pages, like an operating system, so many more riders fit.", tone: "aside" },
      ],
    },
    {
      kind: "custom",
      name: "photo",
      beats: [
        { say: "Memory again. A seventy billion parameter model, at sixteen bits per weight, needs about a hundred and forty gigabytes. Several GPUs." },
        {
          say: "Store the weights with fewer bits, like saving a photo at lower quality. Eight bits, about seventy gigabytes. Four bits, under forty. One large GPU. That's quantisation.",
          term: { word: "Quantisation", meaning: "store weights with fewer bits: smaller, faster" },
        },
        { say: "Then measure quality on your own test set, before trusting it.", tone: "key" },
        { say: "One more speed-up: a small draft model guesses the next few tokens, and the big model checks them all in one pass, keeping the ones it agrees with.", tone: "aside" },
      ],
    },

    // ------------------------------------------------------------ 3
    { kind: "section", num: "3", title: "Connect once: MCP", beats: [{ say: "Last request: one connector, three apps." }] },
    {
      kind: "custom",
      name: "usbc",
      beats: [
        { say: "If every app builds its own get stock tool, every change to the inventory system means updating all of them. Three apps, two systems, six integrations. And it grows with every new app." },
        {
          say: "Before USB, every device had its own cable. MCP, the model context protocol, is the USB C port for AI apps. Wrap a system once, as a server, and any app that speaks MCP can use it.",
          tone: "key",
          term: { word: "MCP", meaning: "one standard port between AI apps and tools" },
        },
        { say: "A server offers tools the model can call, resources the app can read, and prompts a person can pick. N plus M pieces, instead of N times M." },
        { say: "But a third party server's descriptions are untrusted input. And one server that both reads and sends email holds two keys of the lethal trifecta. Review, pin, and scope every one.", tone: "aside" },
      ],
    },
    {
      kind: "custom",
      name: "recap",
      props: {
        items: [
          ["🏋️", "Fine-tuning", "for behaviour, not facts"],
          ["📝", "LoRA", "sticky notes on a frozen book"],
          ["🧑‍🎓", "Distillation", "an apprentice, with a cascade"],
          ["🚌", "Continuous batching", "a bus that never waits"],
          ["🖼️", "Quantisation", "a smaller photo"],
          ["🔌", "MCP", "one port for every tool"],
        ],
      },
      beats: [
        { say: "Let's lock in the last chapter." },
        { say: "Fine tuning is for behaviour, not facts." },
        { say: "LoRA: sticky notes on a frozen book." },
        { say: "Distillation: an apprentice, with a cascade behind it." },
        { say: "Continuous batching: a bus that never waits." },
        { say: "Quantisation: a smaller photo." },
        { say: "And MCP: one port, for every tool.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ the whole system
    { kind: "section", num: "✦", title: "The whole system", beats: [{ say: "Now, step back, and look at everything you built.", tone: "excite" }] },
    {
      kind: "custom",
      name: "system",
      beats: [
        { say: "Twelve chapters ago, FreshCart had a plain chat model, and three confused questions." },
        { say: "Then came the models, and retrieval: chunks, hybrid search, and reranking." },
        { say: "Workflows and agents on LangGraph, with tools, MCP servers, checkpoints and memory." },
        { say: "Approvals for risky writes. Guardrails against injection. And evals that watch it all." },
        { say: "And a gateway in front: auth, quotas, routing, and caching." },
        { say: "Every interview question you'll face is about one of these boxes. Or an arrow between them.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "finale",
      beats: [
        { say: "So here's your last exercise. Close the book, and redraw this system from memory." },
        { say: "Then pick any box, and explain, out loud, the problem that forced it to exist. If you can do that for every box, you're ready.", tone: "key", hold: 3 },
      ],
    },
    {
      kind: "title",
      eyebrow: "AI Stack",
      title: "That's the whole stack",
      subtitle: "thanks for building FreshCart with me",
      beats: [{ say: "That's the whole stack. Thanks for building FreshCart with me.", tone: "excite" }],
    },
  ],
};
