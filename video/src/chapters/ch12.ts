import type { Chapter } from "../lib/types.ts";

// Chapter 12 of the AI Stack: going further, interview-ready. Three requests:
// shrink a ticket classifier, run a model yourself, and connect one CRM to
// three assistants. Ends by rebuilding the whole stack.

export const ch12: Chapter = {
  id: "ch12",
  title: "Going further",
  voice: "en-US-AndrewMultilingualNeural",
  scenes: [
    {
      kind: "custom",
      name: "a12hook",
      beats: [
        { say: "Three requests close the series. A support ticket classifier runs three hundred thousand times a day on a large model. Ninety five percent accurate, but over a second, and too expensive, per ticket. And marketing wants notifications in the brand's voice, which prompting never quite reaches." },
        { say: "Legal asks whether customer data could stay entirely inside your own cloud. That means running a model yourself." },
        { say: "And three teams want the same CRM inside their assistants, without building three integrations. Each needs something new.", tone: "key" },
      ],
    },
    {
      kind: "title",
      eyebrow: "AI Stack · Chapter 12",
      title: "Going further",
      subtitle: "fine-tuning, serving models, and MCP",
      beats: [{ say: "Chapter twelve. Going further." }],
    },
    {
      kind: "bullets",
      title: "By the end, you can answer",
      firstItemStep: 1,
      items: [
        { icon: "🎯", text: "Fine-tune, RAG or prompt? And LoRA, QLoRA, DPO" },
        { icon: "🐣", text: "Distillation and cascades: cheaper at the same quality" },
        { icon: "🚌", text: "Serving: prefill vs decode, batching, PagedAttention" },
        { icon: "🔌", text: "MCP: what it is, and its security catch" },
      ],
      beats: [
        { say: "By the end, you'll be able to answer these." },
        { say: "When to fine tune instead of using RAG or a prompt. And how LoRA, QLoRA and DPO work." },
        { say: "How distillation and cascades cut cost at the same quality." },
        { say: "How models are served: prefill versus decode, continuous batching, and PagedAttention." },
        { say: "And what MCP is, and its security catch." },
      ],
    },

    // ------------------------------------------------------------ 1
    { kind: "section", num: "1", title: "Fine-tuning: changing the model itself", beats: [{ say: "Chapter one said fine tuning is the wrong tool for company policies. Here's why it's the right tool now." }] },
    {
      kind: "compare",
      title: "The manual, or the training?",
      cols: [
        { title: "RAG: the manual", icon: "📘", tone: "blue", items: ["facts", "always current, easy to update", "you can point at the page"] },
        { title: "Fine-tuning: the training", icon: "🏋️", tone: "green", items: ["skills and habits", "a format, a style, a narrow task", "the same way every time"] },
      ],
      footer: "the classifier and the brand voice are behaviour, not knowledge → fine-tuning",
      beats: [
        {
          say: "Fine tuning means continuing to train an existing model on your own examples, so its weights change. Think of a new employee. Handing them the policy manual is RAG: facts, always current, and you can point at the page.",
          term: { word: "Fine-tuning", meaning: "further training on your own examples" },
        },
        { say: "Training them for a week on one job is fine tuning: skills and habits. A format, a style, a narrow task, done the same way every time." },
        { say: "The classifier and the brand voice are behaviour, not knowledge. So they're fine tuning problems.", tone: "key" },
      ],
    },
    {
      kind: "bullets",
      title: "Supervised fine-tuning, done right",
      firstItemStep: 1,
      items: [
        { icon: "💎", text: "Hundreds to a few thousand high-quality examples", sub: "inconsistent labels teach inconsistency" },
        { icon: "🧊", text: "A held-out test set, never trained on" },
        { icon: "📏", text: "A baseline: the best prompt on the original model", sub: "a fine-tune that doesn't beat it isn't worth owning" },
        { icon: "🔁", text: "A plan to retrain as the data drifts" },
      ],
      beats: [
        { say: "Supervised fine tuning trains on input output pairs: a ticket and its correct label." },
        { say: "You need hundreds to a few thousand high quality examples for a narrow task. Quality matters far more than quantity." },
        { say: "A held out test set, never trained on." },
        { say: "A baseline: the best prompt on the original model. A fine tune that doesn't beat it isn't worth owning." },
        { say: "And a plan to retrain, because new product lines and complaint types will make it stale." },
      ],
    },
    {
      kind: "custom",
      name: "a12lora",
      beats: [
        { say: "Updating all of a model's billions of weights needs a lot of GPU memory, and makes a full copy of the model per task. Take one weight matrix: four thousand by four thousand. Nearly seventeen million numbers. Freeze it." },
        {
          say: "LoRA, low rank adaptation, adds two thin matrices beside it, B and A. Their product is a correction added to W, and only they are trained. Like sticky notes on a book, instead of rewriting it.",
          term: { word: "LoRA", meaning: "train a small low-rank correction, freeze W" },
        },
        {
          say: "The thin side is the rank, r. With r equal to eight, that's sixty five thousand trainable numbers: about zero point four percent. Higher rank means more capacity, and more memory.",
          term: { word: "Rank r", meaning: "the width of LoRA's thin matrices" },
        },
        {
          say: "The result is a small adapter file. One base model can serve many adapters, the classifier, the brand voice, swapped per request.",
          term: { word: "Adapter", meaning: "a small file of LoRA weights for one task" },
        },
        {
          say: "And QLoRA does the same on a base model stored in four bit numbers, so even large models can be fine tuned on a single GPU.",
          tone: "key",
          term: { word: "QLoRA", meaning: "LoRA on a 4-bit quantized base model" },
        },
      ],
    },
    {
      kind: "custom",
      name: "a12dpo",
      beats: [
        { say: "For the brand voice, it's easier to say which of two notifications sounds right, than to write the perfect one. That's preference data: a chosen answer, and a rejected one." },
        { say: "RLHF trains a separate reward model on those pairs, then uses reinforcement learning to push the model toward high reward, with a KL penalty that stops it drifting too far from the original. Powerful, and complex to run." },
        {
          say: "Underneath sits the Bradley Terry model: the probability that one answer is preferred is the sigmoid of the difference in their scores.",
          term: { word: "Bradley–Terry", meaning: "preference = sigmoid of score difference" },
        },
        {
          say: "DPO, direct preference optimization, skips the reward model and the reinforcement learning. It trains directly on the pairs: raise the chosen answer's likelihood relative to the original model, lower the rejected one's. Beta plays the role of the KL penalty. Simpler, more stable, and widely used.",
          tone: "key",
          term: { word: "DPO", meaning: "learn preferences directly from pairs" },
        },
      ],
    },
    {
      kind: "custom",
      name: "a12distill",
      beats: [
        {
          say: "Now the classifier. Distillation trains a small model to imitate a large one, on one specific task. The large model labels fifty thousand tickets, with people reviewing the hard ones. The small model is fine tuned on those labels.",
          term: { word: "Distillation", meaning: "a small model learns from a large one" },
        },
        { say: "And a cascade keeps the quality. The small model answers when it's confident. Below a threshold, say zero point eight five, the ticket goes to the large model." },
        { say: "If ninety percent are confident, the bill drops from about six hundred dollars a day to about ninety, and most answers take milliseconds." },
        { say: "Tune the threshold on held out tickets, so the combined accuracy matches the large model. And check the provider's terms before training on another model's outputs.", tone: "key" },
      ],
    },
    {
      kind: "compare",
      title: "What fine-tuning costs you",
      cols: [
        { title: "Ownership", icon: "🏠", tone: "blue", items: ["host, version, monitor, retrain"] },
        { title: "Drift", icon: "📉", tone: "amber", items: ["new products and ticket types", "retrain on fresh labels"] },
        { title: "Forgetting", icon: "🫥", tone: "red", items: ["general abilities can weaken", "LoRA helps; test broadly"] },
        { title: "Evaluation", icon: "🧪", tone: "green", items: ["the same golden sets and gates"] },
      ],
      beats: [
        { say: "And what fine tuning costs you. Ownership: you host, version, monitor and retrain a model." },
        { say: "Drift: new products and new ticket types make it stale." },
        {
          say: "Forgetting: training hard on one task can weaken general abilities. LoRA reduces this, but test broadly.",
          term: { word: "Catastrophic forgetting", meaning: "fine-tuning erodes other skills" },
        },
        { say: "And the same evaluation discipline as everything else.", tone: "key" },
      ],
    },
    {
      kind: "trap",
      myth: "Fine-tune on all our policy documents so the model knows them.",
      truth: "Still no. That's knowledge, not behaviour: blurred recall, no citations, and retraining on every policy change. RAG stays.",
      beats: [
        { say: "And when someone proposes, again, fine tuning on all the policy documents?" },
        { say: "Still no. That's knowledge, not behaviour. The model would answer from a blurred memory, cite nothing, and need retraining with every policy change. RAG stays.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 2
    { kind: "section", num: "2", title: "Running your own model", beats: [{ say: "Legal wants the classifier inside your own cloud. Now you run the model. Serving engines like vLLM, SGLang and TGI do the heavy lifting. Here's what they're doing." }] },
    {
      kind: "custom",
      name: "a12phases",
      beats: [
        { say: "Every request has two phases. Prefill processes the whole prompt at once. Heavy computation, so it's compute bound. It decides time to first token." },
        {
          say: "Decode generates the remaining tokens one by one. Little computation per token, but the weights and the KV cache are re read for every single token. So decode is memory bound. It decides time per output token.",
          term: { word: "Memory-bound", meaning: "limited by memory speed, not compute" },
        },
        { say: "So a GPU serving one request at a time sits mostly idle during decode. The answer is to serve many at once.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "a12bus",
      beats: [
        { say: "Processing requests together, in a batch, shares one pass through the weights. Static batching is a bus that leaves full, and only returns when its last passenger gets off. Short requests finish, and their slots sit idle, while new requests wait outside." },
        {
          say: "Continuous batching lets requests get on and off at every generation step. A freed slot is refilled immediately. It's standard in modern engines, and one of the biggest throughput gains in practice. Bigger batches raise throughput, at a little more latency per request.",
          tone: "key",
          term: { word: "Continuous batching", meaning: "requests join and leave every step" },
        },
      ],
    },
    {
      kind: "custom",
      name: "a12paged",
      beats: [
        { say: "What fills GPU memory and limits the batch? The KV cache: stored keys and values for every token of every active request. Early engines reserved one big block per request, sized for the longest possible answer, and wasted most of it." },
        {
          say: "PagedAttention, introduced by vLLM, manages the cache like an operating system manages memory: small, fixed size pages, handed out as needed. Little is wasted, and many more requests fit.",
          term: { word: "PagedAttention", meaning: "KV cache in small pages, like OS memory" },
        },
        { say: "And requests that share a prefix, like the same system prompt, can share its pages. That's what makes prefix caching cheap.", tone: "key" },
      ],
    },
    {
      kind: "numbers",
      title: "Quantization: a 70-billion-parameter model's weights",
      items: [
        { value: "140 GB", label: "16-bit", sub: "the usual format" },
        { value: "70 GB", label: "8-bit", sub: "usually loses very little" },
        { value: "35 GB", label: "4-bit", sub: "GPTQ, AWQ, GGUF: a little more loss" },
      ],
      footer: "less memory → fewer GPUs, more room for the KV cache, faster decode",
      beats: [
        { say: "Then quantization. A seventy billion parameter model in sixteen bit numbers needs about a hundred and forty gigabytes, for the weights alone." },
        { say: "Eight bit halves that, and usually loses very little." },
        { say: "Four bit, with methods like GPTQ and AWQ, or the GGUF format for laptops, quarters it, with a little more loss." },
        { say: "Less memory means fewer GPUs, more room for the KV cache, and faster decoding, since decode is memory bound.", tone: "key" },
      ],
    },
    {
      kind: "compare",
      title: "More speed-ups worth knowing",
      cols: [
        { title: "Speculative decoding", icon: "🏎️", tone: "green", items: ["a small draft model guesses a few tokens", "the big model checks them in one pass", "faster, identical output"] },
        { title: "Tensor parallelism", icon: "🧩", tone: "blue", items: ["split each layer across GPUs", "when the model won't fit on one"] },
        { title: "Prefill/decode split", icon: "⚖️", tone: "purple", items: ["separate GPU pools for each phase", "long prompts stop stalling decode"] },
      ],
      beats: [
        {
          say: "Three more speed ups. Speculative decoding: a small, fast draft model guesses the next few tokens, and the big model checks them all in one pass, keeping the ones it agrees with. Much faster, with exactly the same output.",
          term: { word: "Speculative decoding", meaning: "a draft model guesses; the big one verifies" },
        },
        { say: "Tensor parallelism: split each layer across several GPUs, when the model doesn't fit on one." },
        { say: "And prefill decode separation: run the two phases on different GPU pools, so long prompts stop stalling everyone's decoding." },
      ],
    },
    {
      kind: "compare",
      title: "At peak, TTFT jumps from 400 ms to 4 s. Look at:",
      cols: [
        { title: "1 · Queueing", icon: "🚶", tone: "amber", items: ["requests waiting for batch slots?", "add replicas; scale on queue length"] },
        { title: "2 · Long prompts", icon: "📜", tone: "blue", items: ["a few huge prompts slow every prefill", "cap length; prefix caching; split phases"] },
        { title: "3 · KV pressure", icon: "🧠", tone: "red", items: ["memory full → requests paused or evicted", "quantize, cap output, add GPUs"] },
      ],
      footer: "self-hosting is cheaper only at high, steady utilisation: idle GPUs cost the same",
      beats: [
        { say: "An interview favourite: at peak, time to first token jumps from four hundred milliseconds to four seconds. What do you look at? First, queueing. Are requests waiting for batch slots? Add replicas, and scale on queue length, not CPU." },
        { say: "Then long prompts. A few huge prompts slow everyone's prefill. Cap length, use prefix caching, or separate the phases." },
        { say: "Then KV cache pressure. If memory is full, the engine pauses or evicts requests. Quantize, cap output length, or add GPUs. And remember: self hosting is cheaper only at high, steady utilization. Idle GPUs cost the same as busy ones.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 3
    { kind: "section", num: "3", title: "MCP: connect once, use everywhere", beats: [{ say: "Last request: one CRM, three assistants." }] },
    {
      kind: "custom",
      name: "a12mcp",
      beats: [
        { say: "Without a standard, every assistant builds its own integration with every system. Three apps, three systems: nine integrations, and each one changes when an API changes." },
        {
          say: "MCP, the Model Context Protocol, is like a USB C port for AI applications. Wrap each system once as an MCP server. Any application whose built in client speaks MCP can connect. N plus M pieces, instead of N times M.",
          tone: "key",
          term: { word: "MCP", meaning: "an open standard connecting AI apps to tools and data" },
        },
      ],
    },
    {
      kind: "compare",
      title: "What an MCP server offers",
      cols: [
        { title: "Tools", icon: "🔧", tone: "green", items: ["actions, like get_account(id)", "the model decides when"] },
        { title: "Resources", icon: "📄", tone: "blue", items: ["data, like crm://accounts/42", "the application decides when"] },
        { title: "Prompts", icon: "📝", tone: "purple", items: ["templates, like “summarise this account”", "the user decides when"] },
      ],
      beats: [
        { say: "An MCP server offers three things. Tools: actions the model can call, like get account. The model decides when." },
        { say: "Resources: data the application can read into the context. The application decides when." },
        { say: "And prompts: reusable templates a person can pick. The user decides when." },
      ],
    },
    {
      kind: "seq",
      title: "A client connecting to an MCP server",
      actors: [
        { id: "H", name: "Host app", icon: "🖥️", tone: "blue" },
        { id: "L", name: "LLM", icon: "🧠", tone: "purple" },
        { id: "S", name: "CRM MCP server", icon: "🔌", tone: "green" },
      ],
      msgs: [
        { from: "H", to: "S", label: "initialize: versions, capabilities", step: 0 },
        { from: "S", to: "H", label: "capabilities: tools, resources", step: 0, dash: true },
        { from: "H", to: "S", label: "tools/list", step: 1 },
        { from: "S", to: "H", label: "get_account, search_deals…", step: 1, dash: true },
        { from: "H", to: "L", label: "messages + those tool definitions", step: 2 },
        { from: "L", to: "H", label: "tool call: get_account(42)", step: 2, dash: true, tone: "amber" },
        { from: "H", to: "S", label: "tools/call get_account(42)", step: 3, tone: "green" },
        { from: "S", to: "H", label: "{name: …, plan: …}", step: 3, dash: true },
      ],
      note: { step: 4, text: "stdio for a local server · Streamable HTTP + OAuth for a remote one", tone: "blue" },
      beats: [
        { say: "Here's what happens when a client connects. Initialize: both sides agree on protocol versions and capabilities." },
        { say: "Then the client lists the server's tools." },
        { say: "The host sends those tool definitions to the model, as usual. The model asks for a tool call, as in chapter five." },
        { say: "And the host invokes it on the server, and returns the result." },
        {
          say: "Two transports: standard I O, for a local server the app starts itself, and streamable HTTP for a remote server shared by many apps, using OAuth so the server acts with the person's own permissions.",
          term: { word: "Transport", meaning: "stdio locally, Streamable HTTP remotely" },
        },
      ],
    },
    {
      kind: "trap",
      myth: "MCP replaces tool calling.",
      truth: "It doesn't. The model still requests tools exactly as before; MCP standardises how apps discover tools and invoke them on servers.",
      beats: [
        { say: "So the trap: MCP replaces tool calling." },
        { say: "It doesn't. The model still requests tools exactly as before. MCP standardizes how applications discover those tools, and invoke them on servers.", tone: "key" },
      ],
    },
    {
      kind: "compare",
      title: "The security catch",
      cols: [
        { title: "Untrusted descriptions", icon: "☠️", tone: "red", items: ["tool descriptions and outputs enter the context", "a channel for prompt injection"] },
        { title: "Changed after approval", icon: "🎭", tone: "amber", items: ["a server can alter a tool later", "pin versions; review updates"] },
        { title: "Two legs in one server", icon: "🔺", tone: "purple", items: ["reads private mail and sends mail", "a lethal trifecta in one install"] },
      ],
      footer: "reviewed servers · pinned versions · narrow credentials · approval for sensitive tools",
      beats: [
        { say: "And the security catch. A third party server's tool descriptions and outputs go straight into the model's context. They're untrusted input: a channel for prompt injection." },
        { say: "A malicious or compromised server can change a tool's description after you approved it. Pin versions, and review updates." },
        { say: "And one popular server that both reads and sends email holds two legs of the lethal trifecta by itself. So: reviewed servers, pinned versions, narrowly scoped credentials, and approval for sensitive tools.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 4
    { kind: "section", num: "4", title: "The whole stack", beats: [{ say: "Finally, step back, and look at everything you've built.", tone: "excite" }] },
    {
      kind: "custom",
      name: "a12finale",
      beats: [
        { say: "Twelve chapters ago, there was a plain chat model, and a question about what happens when you press enter." },
        { say: "Now there's a whole stack. How the model works. Retrieval, and search at scale. Fixing retrieval. Agents, memory, and human approval. Evals, and safe shipping. System design. Security and cost. And fine tuning, serving, and MCP. Every interview question you'll meet is about one of these boxes, or the arrows between them.", tone: "key" },
      ],
    },
    {
      kind: "sayit",
      q: "When would you fine-tune, use RAG, or just prompt?",
      lines: [
        "Prompt first: it's cheapest, fastest to change, and often enough.",
        "RAG for knowledge: large, changing, needs citations or per-user access.",
        "Fine-tune for behaviour: a format, a style, a narrow task at scale.",
        "LoRA or QLoRA to make it cheap; DPO when you have preference pairs.",
        "Distil to a small model with a cascade when cost and latency matter.",
      ],
      beats: [
        { say: "One last model answer. When would you fine tune, use RAG, or just prompt?" },
        { say: "Prompt first. It's the cheapest, fastest to change, and often enough." },
        { say: "RAG for knowledge: large, changing, or needing citations and per user access." },
        { say: "Fine tune for behaviour: a format, a style, or a narrow task at scale." },
        { say: "Use LoRA or QLoRA to make it cheap, and DPO when you have preference pairs." },
        { say: "And distil to a small model, with a cascade, when cost and latency matter.", tone: "key" },
      ],
    },
    {
      kind: "drill",
      items: [
        { q: "What does LoRA train?", a: "Two thin matrices B and A whose product corrects a frozen weight matrix; rank r sets their width." },
        { q: "QLoRA in one line?", a: "LoRA on a base model stored in 4-bit, so big models fine-tune on one GPU." },
        { q: "RLHF vs DPO?", a: "RLHF: reward model + RL with a KL penalty. DPO: train directly on preference pairs, no reward model." },
        { q: "Why is decode memory-bound?", a: "Each token re-reads all weights and the KV cache, with little compute per byte." },
        { q: "What does continuous batching fix?", a: "Idle slots: finished requests leave and new ones join at every step." },
        { q: "What does PagedAttention fix?", a: "KV-cache waste: memory in small pages on demand, with shared prefixes." },
        { q: "MCP tools vs resources vs prompts?", a: "Tools: the model decides. Resources: the app decides. Prompts: the user decides." },
      ],
      beats: [
        { say: "The final rapid fire. What does LoRA train?", tone: "ask", hold: 2.5 },
        { say: "Two thin matrices, B and A, whose product corrects a frozen weight matrix. The rank r sets their width." },
        { say: "QLoRA, in one line?", tone: "ask", hold: 2.5 },
        { say: "LoRA on a base model stored in four bit, so big models fine tune on a single GPU." },
        { say: "RLHF versus DPO?", tone: "ask", hold: 2.5 },
        { say: "RLHF trains a reward model, then uses RL with a KL penalty. DPO trains directly on preference pairs, with no reward model." },
        { say: "Why is decode memory bound?", tone: "ask", hold: 2.5 },
        { say: "Each token re-reads all the weights and the KV cache, with little computation per byte." },
        { say: "What does continuous batching fix?", tone: "ask", hold: 2.5 },
        { say: "Idle slots. Finished requests leave, and new ones join, at every step." },
        { say: "What does PagedAttention fix?", tone: "ask", hold: 2.5 },
        { say: "KV cache waste. Memory in small pages, on demand, with shared prefixes." },
        { say: "Last one of the series. MCP tools, versus resources, versus prompts?", tone: "ask", hold: 2.5 },
        { say: "Tools: the model decides. Resources: the application decides. Prompts: the user decides.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "recap",
      props: {
        items: [
          ["🏋️", "Fine-tuning", "behaviour, not knowledge"],
          ["📎", "LoRA / QLoRA", "small adapters, one GPU"],
          ["⚖️", "DPO", "preferences, no reward model"],
          ["🐣", "Distillation", "+ a cascade"],
          ["🚌", "Serving", "continuous batching, paged KV"],
          ["🔌", "MCP", "connect once; untrusted input"],
        ],
      },
      beats: [
        { say: "Let's lock it in, one last time." },
        { say: "Fine tune for behaviour, not knowledge." },
        { say: "LoRA and QLoRA make it cheap, with small adapters." },
        { say: "DPO learns preferences, with no reward model." },
        { say: "Distillation plus a cascade cuts cost at the same quality." },
        { say: "Serving relies on continuous batching and a paged KV cache." },
        { say: "And MCP connects a tool once, for every app, as untrusted input.", tone: "key" },
      ],
    },
    {
      kind: "pause",
      question: "Close everything. Redraw the whole stack from memory. Pick any box, and explain out loud the problem that forced it to exist.",
      beats: [
        { say: "Your final exercise. Close everything, and redraw the whole stack from memory." },
        { say: "Then pick any box, and explain out loud the problem that forced it to exist. If you can do that for every box, you're ready for the interview.", tone: "key", hold: 3 },
      ],
    },
    {
      kind: "title",
      eyebrow: "AI Stack",
      title: "That's the AI Stack",
      subtitle: "good luck in the interview",
      beats: [{ say: "That's the AI stack. Good luck in the interview.", tone: "excite" }],
    },
  ],
};
