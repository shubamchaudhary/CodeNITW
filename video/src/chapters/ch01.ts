import type { Chapter } from "../lib/types.ts";

// Chapter 1 of the AI Stack: how an LLM works, interview-ready. One sentence,
// "The capital of France is", is followed through the whole machine; every
// idea is pictured first and named second (the beat's `term`), then said the
// way an interview answer should sound, and drilled at the end.

export const ch01: Chapter = {
  id: "ch01",
  title: "How an LLM works",
  voice: "en-US-AndrewMultilingualNeural",
  next: "Chapter 2 — RAG from scratch",
  scenes: [
    {
      kind: "custom",
      name: "a1hook",
      beats: [
        { say: "Here's a question that shows up in almost every AI engineering interview. What actually happens between pressing enter, and the first word appearing?", tone: "ask" },
        { say: "Millions of people use these models every day. Very few can explain that answer, step by step.", tone: "excite" },
        { say: "So in this lecture, we'll follow one short sentence all the way through the machine. Tokens. Vectors. Attention. Probabilities. And out comes the answer." },
        { say: "By the end, you'll be able to explain every station, and handle the follow up questions that usually catch people out.", tone: "key" },
      ],
    },
    {
      kind: "title",
      eyebrow: "AI Stack · Chapter 1",
      title: "How an LLM works",
      subtitle: "from one sentence to the next token",
      beats: [{ say: "Chapter one. How a large language model actually works." }],
    },
    {
      kind: "bullets",
      title: "By the end, you can answer",
      firstItemStep: 1,
      items: [
        { icon: "🔤", text: "What is a token, and why do some languages cost more?" },
        { icon: "🔦", text: "How does self-attention work: queries, keys, values?" },
        { icon: "🎲", text: "Temperature vs top-p, and why answers vary at zero" },
        { icon: "🤥", text: "Why models hallucinate, and how to reduce it" },
      ],
      beats: [
        { say: "Here's what you'll be able to answer by the end." },
        { say: "What a token is, and why the same question costs more in some languages." },
        { say: "How self attention works, with queries, keys and values." },
        { say: "Temperature versus top p, and why answers can still vary at temperature zero." },
        { say: "And why models make things up, and what you can do about it. Plus how to write prompts that actually work." },
      ],
    },

    // ------------------------------------------------------------ 1
    { kind: "section", num: "1", title: "Autocomplete at enormous scale", beats: [{ say: "Let's start with the one idea everything else is built on." }] },
    {
      kind: "custom",
      name: "a1next",
      beats: [
        { say: "Type: the capital of France is. The model doesn't look up an answer anywhere. It scores every possible next token." },
        { say: "Paris gets ninety two percent. A, the, located, and a long tail of others share the rest." },
        {
          say: "It picks one, appends it to the text, and runs the whole model again on the longer text. One token at a time. This loop is called autoregressive generation.",
          term: { word: "Autoregressive", meaning: "each new token is fed back in to predict the next" },
        },
        { say: "That's why answers stream in word by word. And why a long answer takes longer: every single token is one more full pass through the model.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "a1practice",
      beats: [
        { say: "So how does it get so good at guessing? Practice. Trillions of tiny fill in the blank quizzes, cut from ordinary text." },
        {
          say: "Hide the last word. The model guesses: London. Wrong. A number measures how wrong it was. That's the loss.",
          term: { word: "Loss", meaning: "a number for how wrong the guess was" },
        },
        {
          say: "Then every one of billions of internal dials, called parameters, is nudged a tiny bit, so the right answer becomes more likely next time.",
          term: { word: "Parameters", meaning: "billions of learned numbers inside the model" },
        },
        {
          say: "Repeat that trillions of times. This stage is called pretraining.",
          term: { word: "Pretraining", meaning: "learning to predict the next token on huge text" },
        },
        { say: "And here's the surprise. To guess well, the model had to absorb facts, grammar, and patterns that look a lot like reasoning. Nobody taught it facts. Facts were simply useful for guessing the next word.", tone: "key" },
      ],
    },
    {
      kind: "numbers",
      title: "The scale of it",
      items: [
        { value: "15T+", label: "training tokens", sub: "Meta's Llama 3" },
        { value: "70B", label: "parameters", sub: "Llama 3, large version" },
        { value: "0.75", label: "words per token", sub: "English, on average" },
      ],
      footer: "more data + more parameters + more compute → predictably lower loss",
      beats: [
        { say: "Some numbers to anchor that. Meta's Llama three was trained on over fifteen trillion tokens." },
        { say: "Its large version has seventy billion parameters." },
        { say: "And in English, one token is about three quarters of a word." },
        {
          say: "Researchers found that loss falls smoothly and predictably as you add data, parameters and compute. Those are the scaling laws, and they're why models kept getting bigger.",
          term: { word: "Scaling laws", meaning: "loss falls predictably with data, size and compute" },
        },
      ],
    },
    {
      kind: "trap",
      myth: "It looks the answer up in a database of facts.",
      truth: "There is no lookup. It writes what is likely, given everything it read. Usually likely and true agree. Not always.",
      why: "Keep this sentence in mind: it explains hallucinations, in section six.",
      beats: [
        { say: "A belief that trips people up: the model looks the answer up, in some database of facts." },
        { say: "It doesn't. There is no lookup. It writes what is likely, given everything it read. Usually likely and true agree. Not always.", tone: "key" },
        { say: "Hold on to that sentence. It explains hallucinations, which we'll get to in section six." },
      ],
    },

    // ------------------------------------------------------------ 2
    { kind: "section", num: "2", title: "Tokens: what the model actually reads", beats: [{ say: "Next: what the model actually reads." }] },
    {
      kind: "custom",
      name: "a1tokens",
      beats: [
        {
          say: "The model never sees letters, or even words. It sees tokens: chunks of text, each mapped to a number in its vocabulary.",
          term: { word: "Token", meaning: "a chunk of text, stored as a number" },
        },
        { say: "Common words are a single token. Rarer ones split into pieces. Unbelievably becomes un, believ, and ably." },
        {
          say: "The pieces come from byte pair encoding. Start with single characters, and keep merging the pair that appears together most often, until the vocabulary has, say, a hundred thousand entries.",
          term: { word: "BPE", meaning: "byte-pair encoding: merge frequent pairs" },
        },
        { say: "Why not whole words? You'd need millions, and any typo or new name would break it. Why not letters? Sequences get far too long. Sub words are the sweet spot." },
        { say: "Handy rule: a hundred tokens is about seventy five English words.", tone: "aside" },
      ],
    },
    {
      kind: "trap",
      myth: "If it can write essays, counting the r's in “strawberry” is trivial.",
      truth: "It never sees the letters. “strawberry” arrives as a few tokens, like str · aw · berry.",
      why: "Counting letters means reasoning about pieces it can't see inside. Spelling, rhymes and arithmetic on long numbers all suffer for the same reason.",
      beats: [
        { say: "A classic interview question: why can a model write an essay, but miscount the r's in strawberry?" },
        { say: "Because it never sees the letters. Strawberry arrives as a few tokens, like str, aw, and berry.", tone: "key" },
        { say: "Counting letters means reasoning about pieces it can't see inside. Spelling, rhymes, and arithmetic on long numbers suffer for the same reason." },
      ],
    },
    {
      kind: "custom",
      name: "a1lang",
      beats: [
        { say: "Tokens also explain a puzzle about cost. Here's: how are you today, in English. A handful of tokens." },
        { say: "Now the same sentence in Hindi. Several times the tokens. Tokenizers were trained mostly on English text, so English gets big efficient pieces, and many other languages get small ones." },
        { say: "And you're billed per token. So the same question costs more, answers come slower, and less fits in the context. Output tokens usually cost several times more than input tokens, too.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "a1window",
      beats: [
        {
          say: "Every call also has a hard limit: the context window. Instructions, question and answer, all together, must fit inside it.",
          term: { word: "Context window", meaning: "the most tokens one call can hold" },
        },
        { say: "Today's windows range from about a hundred and twenty eight thousand tokens, roughly a three hundred page book, to over a million." },
        { say: "But here's what surprises people: the model remembers nothing between calls. In a chat, your app resends the whole conversation every turn. So long chats get slower and more expensive, until old turns must be dropped or summarized.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 3
    { kind: "section", num: "3", title: "From tokens to meaning", beats: [{ say: "So the model has a list of numbers. How does it get meaning out of them?" }] },
    {
      kind: "custom",
      name: "a1embed",
      beats: [
        {
          say: "Each token id is swapped for a row from a huge learned table: a list of a few thousand numbers. That row is the token's embedding.",
          term: { word: "Embedding", meaning: "a token's learned list of numbers" },
        },
        { say: "Think of those numbers as coordinates on a map of meaning. Words used in similar ways land close together. Cat near dog. Paris near Rome." },
        { say: "Even directions carry meaning. The step from France to Paris is roughly the same step as Italy to Rome. Country, to capital." },
        { say: "One more ingredient: position. Dog bites man, and man bites dog, have the same tokens. So the model also adds where each token sits." },
        { say: "But one row per token has a problem. Bank is the same token in river bank and in cash at the bank. Fixing that is the job of attention.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 4
    { kind: "section", num: "4", title: "Attention: tokens looking at each other", beats: [{ say: "Now the heart of the transformer.", tone: "excite" }] },
    {
      kind: "custom",
      name: "a1attn",
      beats: [
        { say: "Two sentences. She sat on the river bank. And: she paid cash at the bank." },
        { say: "Same token, same starting vector. To know which bank, it has to look back at the words before it." },
        { say: "In the first sentence, bank looks hard at river. In the second, at cash, and at paid. And it blends their meaning into its own vector." },
        {
          say: "That's self attention. Every token looks at the earlier tokens, weighs how relevant each one is, and mixes in their meaning.",
          tone: "key",
          term: { word: "Self-attention", meaning: "each token blends in the tokens relevant to it" },
        },
        { say: "So bank leaves this layer as two different vectors. One about water. One about money." },
      ],
    },
    {
      kind: "custom",
      name: "a1qkv",
      beats: [
        {
          say: "How does it decide what's relevant? Each token makes three vectors. A query: what am I looking for. A key: what do I contain. And a value: what I pass on, if picked.",
          term: { word: "Query, key, value", meaning: "what I seek, what I hold, what I pass on" },
        },
        { say: "Bank's query is compared with every earlier key, using a dot product. A big number means a good match. Cash scores highest, then paid." },
        { say: "Softmax turns those scores into weights that add up to one. Fifty three percent cash. Thirty two percent paid." },
        { say: "And the new vector for bank is the weighted mix of the values. Mostly cash, a good part paid." },
        { say: "In one line: softmax of Q times K transposed, divided by the square root of d, times V. The square root keeps the scores from growing so large that softmax puts everything on one token.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "a1mask",
      beats: [
        {
          say: "One rule while generating: a token may only look backwards. The future hasn't been written yet. A causal mask sets every score for a later token to minus infinity, so its weight becomes zero.",
          term: { word: "Causal mask", meaning: "no token may look at later tokens" },
        },
        { say: "That same mask makes training efficient. Every position in a sentence is its own next word quiz, and all of them are learned in one pass.", tone: "aside" },
        {
          say: "And attention doesn't run once per layer. It runs as many heads in parallel, each with its own queries, keys and values.",
          term: { word: "Multi-head attention", meaning: "many attention patterns side by side" },
        },
        { say: "One head might track the previous word. Another links a verb to its subject. Their outputs are joined, and mixed back into one vector." },
      ],
    },
    {
      kind: "custom",
      name: "a1stack",
      beats: [
        {
          say: "Attention is one half of a layer. The other half is a feed forward network, which works on each token's vector on its own. Much of the model's stored knowledge seems to live there.",
          term: { word: "Feed-forward", meaning: "per-token network inside every layer" },
        },
        {
          say: "Attention plus feed forward, with shortcut connections around each, is one layer. Stack dozens of them, thirty two in Llama three eight B, and you have a transformer.",
          term: { word: "Transformer", meaning: "a stack of attention + feed-forward layers" },
        },
        {
          say: "At the top, the last token's vector is compared with every token in the vocabulary, giving one raw score each. These scores are called logits.",
          term: { word: "Logits", meaning: "raw scores, one per vocabulary token" },
        },
        { say: "Softmax turns them into probabilities. And we're back where we started. Paris, ninety two percent.", tone: "key" },
      ],
    },
    {
      kind: "compare",
      title: "Three shapes of transformer",
      cols: [
        { title: "Encoder-only", icon: "🔍", tone: "blue", items: ["looks both ways", "understands a fixed text", "BERT: embeddings, classifiers, rerankers"] },
        { title: "Decoder-only", icon: "✍️", tone: "green", items: ["looks backwards only", "writes text, token by token", "GPT, Llama: today's chat models"] },
        { title: "Encoder–decoder", icon: "🔁", tone: "purple", items: ["encoder reads, decoder writes", "translation, summarising", "T5, and the original 2017 design"] },
      ],
      footer: "chat models are decoder-only · embedding models are usually encoders",
      beats: [
        { say: "Interviewers often ask about the three shapes. An encoder looks both ways across a fixed text. It's built to understand, not continue. BERT is the classic, used for embeddings, classifiers and rerankers." },
        { say: "A decoder only looks backwards, with that causal mask, and writes text token by token. GPT and Llama are decoders, like today's chat models." },
        { say: "And an encoder decoder reads with one half and writes with the other, which suits translation. That was the original transformer, from twenty seventeen." },
        { say: "So: chat models are decoder only. The embedding models you'll meet in chapter two are usually encoders.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "a1prefill",
      beats: [
        { say: "Now a favourite follow up. Why does a long prompt cost more, and make you wait longer for the first word?", tone: "ask" },
        {
          say: "Generation has two phases. First, prefill. All the prompt tokens go through every layer at once, in parallel. That sets your time to first token.",
          term: { word: "Prefill", meaning: "processing the whole prompt in one parallel pass" },
        },
        {
          say: "Then decode: one new token per step. To avoid recomputing the past, the model keeps every earlier token's keys and values in GPU memory. That's the KV cache.",
          term: { word: "KV cache", meaning: "stored keys and values of earlier tokens" },
        },
        { say: "Attention compares each token with all the earlier ones, so doubling the prompt can roughly quadruple that work. And the KV cache grows with every token, which limits how many users one GPU can serve.", tone: "key" },
        {
          say: "That's why input tokens are billed too. And why providers offer prompt caching: if many requests start with exactly the same prefix, its processing is reused, so calls get cheaper and faster.",
          term: { word: "Prompt caching", meaning: "reusing the work for an identical prefix" },
        },
      ],
    },
    {
      kind: "sayit",
      q: "Explain self-attention in simple terms.",
      lines: [
        "Each token is a vector; attention lets it pull in information from other tokens.",
        "Every token produces a query, a key and a value.",
        "Query·key scores, scaled by √d and softmaxed, become attention weights.",
        "The output is the weighted sum of the values: a context-aware vector.",
        "Decoders mask future tokens; many heads run in parallel, each learning a different relation.",
      ],
      beats: [
        { say: "Let's say it the way you would in an interview. Explain self attention in simple terms." },
        { say: "Each token is a vector, and attention lets it pull in information from the other tokens." },
        { say: "Every token produces a query, a key, and a value." },
        { say: "Query key dot products, scaled by the square root of d and passed through softmax, become the attention weights." },
        { say: "The output is the weighted sum of the values: a context aware vector." },
        { say: "In a decoder, future tokens are masked. And many heads run in parallel, each learning a different kind of relation.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 5
    { kind: "section", num: "5", title: "Choosing the next token", beats: [{ say: "We have probabilities. Now, how does the model choose?" }] },
    {
      kind: "custom",
      name: "a1sample",
      beats: [
        {
          say: "Take: my favourite colour is. The simplest choice is to always take the top token. That's greedy decoding.",
          term: { word: "Greedy decoding", meaning: "always pick the most likely token" },
        },
        {
          say: "Greedy is predictable, but often bland and repetitive. So usually we sample: pick at random, weighted by the probabilities. Like spinning a weighted wheel. This time it lands on green.",
          term: { word: "Sampling", meaning: "a weighted random pick of the next token" },
        },
        {
          say: "Temperature reshapes the wheel before the spin. The logits are divided by it before the softmax. Turn it down, and the favourite takes over.",
          term: { word: "Temperature", meaning: "divides logits: low sharpens, high flattens" },
        },
        { say: "Turn it up, and the bars even out. Unlikely tokens get a real chance. More creative. Sometimes nonsense." },
        {
          say: "Top p trims the tail. Keep only the smallest set of tokens whose probabilities add up to, say, ninety percent, and spin among those. Top k simply keeps the k best.",
          term: { word: "Top-p", meaning: "sample only from the top 90% of probability" },
        },
        { say: "Rule of thumb: extraction, classification and code, at zero to zero point two. Chat around zero point seven. Brainstorming, higher. And tune temperature or top p, usually not both.", tone: "aside" },
      ],
    },
    {
      kind: "trap",
      myth: "Temperature zero makes a hosted model fully deterministic.",
      truth: "Close, not exact. Your request is batched with others, which changes the order of floating-point maths, so near ties can flip.",
      why: "Pin the model version, use a seed where offered, and test with repeated runs. Design for small variations.",
      beats: [
        { say: "Now the trap. Many people believe temperature zero makes a hosted model fully deterministic." },
        { say: "Close, but not exact. Your request is batched with other people's, which changes the order of floating point maths. Tiny rounding differences can flip a near tie, and the answer heads somewhere else.", tone: "key" },
        { say: "So pin the model version, use a seed where the provider offers one, and test with repeated runs. Design for small variations." },
      ],
    },

    // ------------------------------------------------------------ 6
    { kind: "section", num: "6", title: "From predictor to assistant, and why it makes things up", beats: [{ say: "A next token predictor isn't an assistant yet. Let's see how it becomes one." }] },
    {
      kind: "flow",
      title: "How a text predictor becomes an assistant",
      cols: 4,
      rows: 1,
      nodeW: 380,
      nodeH: 200,
      nodes: [
        { id: "PT", c: 0, r: 0, label: "Pretraining\npredict the next token\non trillions of tokens" },
        { id: "SFT", c: 1, r: 0, label: "Supervised fine-tuning\nexample conversations\nwritten by people", tone: "cyan" },
        { id: "PREF", c: 2, r: 0, label: "Preference tuning\npeople pick the better\nanswer · RLHF, DPO", tone: "green" },
        { id: "RL", c: 3, r: 0, label: "Reasoning RL\nrewarded for checkable\nanswers: maths, code", tone: "purple" },
      ],
      edges: [
        { from: "PT", to: "SFT" },
        { from: "SFT", to: "PREF" },
        { from: "PREF", to: "RL" },
      ],
      show: [["PT"], ["SFT"], ["PREF"], ["RL"]],
      beats: [
        { say: "After pretraining, the model only continues text. Ask it for the capital of France, and it might reply with three more quiz questions, like a page from a quiz book." },
        {
          say: "So next comes supervised fine tuning: thousands of example conversations, written by people, showing what a good answer looks like.",
          term: { word: "SFT", meaning: "fine-tuning on example conversations" },
        },
        {
          say: "Then preference tuning. People compare two answers and pick the better one. A reward model learns those preferences, and reinforcement learning pushes the model toward them. That's RLHF. D P O gets a similar effect straight from the pairs, without a separate reward model.",
          term: { word: "RLHF", meaning: "reinforcement learning from human preferences" },
        },
        { say: "And reasoning models get one more stage: reinforcement learning on problems with checkable answers, like maths and code. They learn to think step by step before they answer." },
      ],
    },
    {
      kind: "custom",
      name: "a1halluc",
      beats: [
        { say: "Now the failure everyone asks about. In twenty twenty three, lawyers in New York filed a brief citing court cases that a chatbot had made up. Real looking names. Real looking citations. The cases did not exist." },
        {
          say: "That's a hallucination: fluent, confident text that isn't true.",
          tone: "key",
          term: { word: "Hallucination", meaning: "fluent, confident text that isn't true" },
        },
        { say: "Why does it happen? Remember: it writes what's likely, not what's checked. A citation has a very likely shape. So it produces that shape, even when there's no real case to put inside it." },
        { say: "And training often rewards guessing. On most tests, a confident guess sometimes scores, while I don't know never does. So models learn to bluff." },
      ],
    },
    {
      kind: "compare",
      title: "Reducing hallucinations",
      cols: [
        { title: "Ground it", icon: "📚", tone: "blue", items: ["put the source text in the prompt", "ask for quotes and citations", "this is RAG: chapter 2"] },
        { title: "Let it abstain", icon: "🙋", tone: "green", items: ["allow “I don't know”", "low temperature for facts", "say what to do when unsure"] },
        { title: "Check it", icon: "🔎", tone: "amber", items: ["verify citations and numbers in code", "use tools for live facts", "measure it: chapter 8"] },
      ],
      footer: "you can reduce hallucinations, never promise zero",
      beats: [
        { say: "So what do you say when asked how to reduce it? First, ground it. Put the real source text in the prompt, and ask for quotes and citations. That's retrieval, the topic of chapter two." },
        { say: "Second, let it abstain. Explicitly allow I don't know, keep temperature low for factual answers, and say what to do when the context doesn't cover the question." },
        { say: "Third, check it. Verify citations and numbers in code, use tools like search or a database for live facts, and measure the hallucination rate." },
        { say: "And be honest in the interview: you can reduce hallucinations a lot, but never promise zero.", tone: "key" },
      ],
    },
    {
      kind: "trap",
      myth: "Fine-tune the model on our documents and it will know them.",
      truth: "Fine-tuning shapes behaviour, style and format well. Facts learned that way are fuzzy, hard to update, and can't be cited.",
      why: "For knowledge that changes, retrieve it at question time. That's RAG, chapter 2.",
      beats: [
        { say: "One more trap. Just fine tune the model on our documents, and it will know them." },
        { say: "Fine tuning is great for behaviour, style, and output format. But facts learned that way are fuzzy, hard to update, and impossible to cite.", tone: "key" },
        { say: "For knowledge that changes, retrieve it at question time. That's RAG, in chapter two." },
      ],
    },

    // ------------------------------------------------------------ 7
    { kind: "section", num: "7", title: "Steering it with the prompt", beats: [{ say: "Finally, the thing you control on every single call.", tone: "ask" }] },
    {
      kind: "custom",
      name: "a1prompt",
      beats: [
        { say: "You can't retrain the model on every call. What you control is the prompt. Say you're routing support emails to four teams: billing, bug, account, or other. Attempt one: a single line. Seventy eight percent correct, on three hundred labelled emails." },
        { say: "Then the patching starts. Important, in capitals. Exclamation marks. And every patch breaks something else." },
        {
          say: "Instead, brief it like a smart new colleague. Start with the role and the goal, usually in the system prompt: instructions that apply to the whole conversation.",
          term: { word: "System prompt", meaning: "standing instructions for the whole chat" },
        },
        { say: "Then rules for the confusing cases. A refund request is billing, even if it mentions a bug." },
        {
          say: "Then a few examples of the hard cases. That's few shot prompting. Balance the labels, and vary the wording, or the model copies the wrong pattern.",
          term: { word: "Few-shot", meaning: "teaching by a few examples in the prompt" },
        },
        { say: "Fence off the input with tags, so text inside an email is treated as data, not as instructions." },
        {
          say: "And demand an exact output format. With structured output, the provider forces valid JSON that matches your schema, so your code never parses chatty text.",
          term: { word: "Structured output", meaning: "replies forced to match a JSON schema" },
        },
        { say: "Same model. Ninety three percent.", tone: "excite" },
      ],
    },
    {
      kind: "custom",
      name: "a1vote",
      beats: [
        {
          say: "For multi step problems, ask the model to reason step by step before answering. That's chain of thought. Writing the steps gives it room to build on them. Here, it avoids the tempting answer, ten cents.",
          term: { word: "Chain-of-thought", meaning: "reasoning written out before the answer" },
        },
        {
          say: "Self consistency goes further. Sample several reasoning paths, and take the majority answer. More reliable, at three times the cost.",
          term: { word: "Self-consistency", meaning: "majority vote over several reasoning paths" },
        },
        { say: "Reasoning models already think internally. For them, state the goal and the constraints, rather than spelling out every step.", tone: "aside" },
      ],
    },
    {
      kind: "bullets",
      title: "Treat prompts like code",
      firstItemStep: 1,
      items: [
        { icon: "🗂️", text: "In version control, reviewed like code" },
        { icon: "🧪", text: "Every change runs on a labelled test set", sub: "accuracy per category: a fix for one often breaks another" },
        { icon: "🏷️", text: "Every response logs its prompt and model version" },
        { icon: "🔗", text: "Big jobs become a chain of small prompts", sub: "plain code checks each step's output" },
      ],
      beats: [
        { say: "And in production, treat prompts like code." },
        { say: "They live in version control, and changes get reviewed." },
        { say: "Every change runs against a labelled test set, with accuracy per category, because a fix for one category often breaks another." },
        { say: "Every response records which prompt and model version produced it, so a bad answer can be traced." },
        {
          say: "And big jobs are split into a chain of small prompts, with plain code checking each step. That's prompt chaining.",
          term: { word: "Prompt chaining", meaning: "a pipeline of small, checked prompts" },
        },
      ],
    },
    {
      kind: "trap",
      myth: "Prompt engineering is about finding magic phrases.",
      truth: "The gains come from clear definitions, examples of the hard cases, structured output, and measuring every change.",
      beats: [
        { say: "So if someone says prompt engineering is about magic phrases..." },
        { say: "Correct them. The gains come from clear definitions, examples of the hard cases, structured output, and measuring every change.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 8
    { kind: "section", num: "8", title: "Interview round", beats: [{ say: "Time to put it all together, the way an interviewer will ask it.", tone: "excite" }] },
    {
      kind: "sayit",
      q: "Walk me through what happens when you send a prompt to an LLM.",
      lines: [
        "The text is split into tokens; each id becomes an embedding plus position.",
        "Prefill runs all prompt tokens through dozens of transformer layers in parallel.",
        "Each layer: masked multi-head self-attention, then a feed-forward network.",
        "The last vector becomes logits over the vocabulary; softmax gives probabilities.",
        "A token is sampled with temperature and top-p, appended, and decode repeats using the KV cache.",
        "It stops at an end token or the length limit; you pay for input and output tokens.",
      ],
      beats: [
        { say: "Here's the opening question again. Walk me through what happens when you send a prompt to an LLM." },
        { say: "The text is split into tokens, and each token id becomes an embedding, plus position information." },
        { say: "Prefill runs all the prompt tokens through dozens of transformer layers, in parallel." },
        { say: "Each layer applies masked multi head self attention, then a feed forward network." },
        { say: "The last token's vector becomes logits over the vocabulary, and softmax turns them into probabilities." },
        { say: "A token is sampled, using temperature and top p. It's appended, and decoding repeats, reusing the KV cache." },
        { say: "Generation stops at an end token or a length limit. And you pay for both input and output tokens.", tone: "key" },
      ],
    },
    {
      kind: "drill",
      items: [
        { q: "Why does the same question cost more in Hindi than in English?", a: "Tokenizers are trained mostly on English, so Hindi splits into more tokens, and you pay per token." },
        { q: "Why are output tokens priced higher than input tokens?", a: "Input is processed in one parallel prefill pass; output is generated one token at a time, each a full pass." },
        { q: "What does the causal mask do?", a: "Sets scores for later tokens to minus infinity, so each token only uses earlier ones." },
        { q: "Why divide by √d in attention?", a: "Dot products grow with vector size; scaling keeps softmax from collapsing onto one token." },
        { q: "Temperature vs top-p?", a: "Temperature reshapes the whole distribution; top-p keeps the smallest set covering p of the probability. Usually tune one." },
        { q: "What is the KV cache, and why does it matter?", a: "Stored keys and values of earlier tokens, so decoding doesn't recompute them. It grows with length and limits users per GPU." },
        { q: "Fine-tuning or RAG to add company knowledge?", a: "RAG for facts that change and need citations; fine-tuning for behaviour, format and style." },
      ],
      beats: [
        { say: "Now, rapid fire. Answer each one out loud before I do. Why does the same question cost more in Hindi than in English?", tone: "ask", hold: 2.5 },
        { say: "Tokenizers are trained mostly on English, so Hindi splits into more tokens. And you pay per token." },
        { say: "Why are output tokens priced higher than input tokens?", tone: "ask", hold: 2.5 },
        { say: "Input is processed in one parallel prefill pass. Output is generated one token at a time, each a full pass." },
        { say: "What does the causal mask do?", tone: "ask", hold: 2.5 },
        { say: "It sets the scores for later tokens to minus infinity, so each token only uses earlier ones." },
        { say: "Why divide by the square root of d, in attention?", tone: "ask", hold: 2.5 },
        { say: "Dot products grow with the vector size. Scaling keeps softmax from collapsing onto a single token." },
        { say: "Temperature versus top p?", tone: "ask", hold: 2.5 },
        { say: "Temperature reshapes the whole distribution. Top p keeps the smallest set of tokens covering p of the probability. Usually, tune just one." },
        { say: "What is the KV cache, and why does it matter?", tone: "ask", hold: 2.5 },
        { say: "It stores the keys and values of earlier tokens, so decoding doesn't recompute them. It grows with length, and limits how many users fit on a GPU." },
        { say: "Last one. Fine tuning, or RAG, to add company knowledge?", tone: "ask", hold: 2.5 },
        { say: "RAG for facts that change and need citations. Fine tuning for behaviour, format, and style.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "recap",
      props: {
        items: [
          ["🔁", "Next token", "one full pass per token"],
          ["🔤", "Tokens", "sub-word pieces, billed"],
          ["🔦", "Attention", "softmax(QKᵀ/√d)·V"],
          ["⚡", "Prefill + KV cache", "why long prompts cost"],
          ["🎲", "Temperature, top-p", "shape the spin"],
          ["🛞", "Prompt", "brief, examples, schema, tests"],
        ],
      },
      beats: [
        { say: "Let's lock it in." },
        { say: "An LLM predicts one token at a time, with one full pass per token." },
        { say: "It reads tokens, sub word pieces, and you're billed for every one." },
        { say: "Attention lets each token blend in the tokens that matter: softmax of Q K transposed over root d, times V." },
        { say: "Prefill and the KV cache explain why long prompts cost time and memory." },
        { say: "Temperature and top p shape the spin for the next token." },
        { say: "And the prompt is your steering wheel: a clear brief, hard examples, a schema, and tests.", tone: "key" },
      ],
    },
    {
      kind: "pause",
      visual: "docs",
      question: "The model has never seen your company's documents. If you could find the 3 pages that matter in a split second, what would you do with them?",
      beats: [
        { say: "One problem is left. The model has never seen your company's private documents." },
        { say: "If you could find the three pages that matter for a question, in a split second... what would you do with them?", tone: "ask", hold: 3 },
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
