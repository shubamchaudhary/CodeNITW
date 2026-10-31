import type { Chapter } from "../lib/types.ts";

// Chapter 1 of the AI Stack (src/Data/aiStackDocs/CH-01.md), as a narrated
// lecture. The narration follows the chapter's own lines; images credited on
// screen are Jay Alammar's (CC BY-NC-SA 4.0) and Wikimedia Commons (CC0).

const JAY_GPT2 = "Jay Alammar, The Illustrated GPT-2 (CC BY-NC-SA 4.0)";
const JAY_TF = "Jay Alammar, The Illustrated Transformer (CC BY-NC-SA 4.0)";

export const ch01: Chapter = {
  id: "ch01",
  title: "How an LLM works",
  voice: "en-US-AndrewMultilingualNeural",
  rate: "+0%",
  next: "Chapter 2 — RAG from scratch",
  scenes: [
    {
      kind: "title",
      eyebrow: "AI Stack · Chapter 1",
      title: "How an LLM works",
      subtitle: "from next-word prediction to good prompts",
      beats: [{ say: "Chapter 1. How an LLM works: from next-word prediction to good prompts." }],
    },
    {
      kind: "story",
      intro: "Your first week at FreshCart: a plain chat model, and a notebook of questions.",
      cards: [
        { who: "Meera", role: "Leads support", tone: "pink", text: "I asked it the same thing twice and got two different answers. Which one is right?" },
        { who: "Finance", role: "Pays the bills", tone: "amber", text: "Why does a question in Marathi cost more than the same question in English?" },
        { who: "Everyone", role: "After one bad afternoon", tone: "blue", text: "It told me a refund rule with total confidence, and the rule does not exist. How can it just make things up?" },
      ],
      closing: "Three classic interview questions, in disguise.",
      beats: [
        { say: "It is your first week at FreshCart, a grocery delivery company in Pune and Bengaluru. Nobody expects you to build anything yet." },
        { say: "Your manager says: let people try a plain chat model for a week, and write down every question they ask about it. By Friday you have three questions that come up again and again." },
        { say: "Meera, who leads support: I asked it the same thing twice and got two different answers. Which one is right?" },
        { say: "Someone from finance: why does a question in Marathi cost more than the same question in English?" },
        { say: "And everyone, after one bad afternoon: it told me a refund rule with total confidence, and the rule does not exist. How can it just make things up?" },
        { say: "Each of these is a classic interview question in disguise. By the end of this chapter you will be able to answer all three, look inside the model to see why, and use the one tool you have to steer it: the prompt." },
      ],
    },
    {
      kind: "flow",
      title: "The path through this chapter",
      cols: 3,
      rows: 2,
      nodeW: 440,
      nodeH: 150,
      nodes: [
        { id: "A", c: 0, r: 0, label: "What a model is:\npredict the next\npiece of text" },
        { id: "B", c: 1, r: 0, label: "Why answers vary:\nsampling and\ntemperature" },
        { id: "C", c: 2, r: 0, label: "Why it makes\nthings up, and\nhow it was trained" },
        { id: "D", c: 2, r: 1, label: "Inside the model:\ntokens, attention,\nlayers" },
        { id: "E", c: 1, r: 1, label: "Steering it:\nprompts that\nactually work" },
        { id: "F", c: 0, r: 1, label: "The wall: it does\nnot know FreshCart", tone: "red" },
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "B", to: "C" },
        { from: "C", to: "D" },
        { from: "D", to: "E" },
        { from: "E", to: "F" },
      ],
      show: [["A"], ["B"], ["C"], ["D"], ["E"], ["F"]],
      beats: [
        { say: "Here is the path. First, what a model is: something that predicts the next piece of text." },
        { say: "Then why answers vary: sampling and temperature." },
        { say: "Then why it makes things up, and how it was trained." },
        { say: "Then inside the model: tokens, attention and layers." },
        { say: "Then steering it, with prompts that actually work." },
        { say: "And finally, the wall you will hit: it does not know FreshCart." },
      ],
    },

    // ---------------------------------------------------------------- 1
    { kind: "section", num: "1", title: "Autocomplete, scaled up enormously", beats: [{ say: "Part 1. Autocomplete, scaled up enormously." }] },
    {
      kind: "custom",
      name: "phone",
      beats: [
        { say: "Your phone's keyboard suggests the next word as you type. Type: see you, and it offers: tomorrow. It learned that from millions of messages." },
        { say: "A large language model, an LLM, is exactly that idea, taken to an extreme. It is a program that reads some text and predicts what text is likely to come next. That is the whole job." },
      ],
    },
    {
      kind: "bullets",
      title: "What makes it large",
      items: [
        { icon: "📚", text: "Trained on trillions of words", sub: "books, websites, code, forums" },
        { icon: "🎛️", text: "Billions of adjustable numbers: parameters", sub: "tuned during training until its predictions became very good" },
      ],
      beats: [
        { say: "What makes it large? It was trained on trillions of words: books, websites, code, forums." },
        { say: "And it contains billions of adjustable numbers, called parameters, that were tuned during training until its predictions became very good." },
      ],
    },
    {
      kind: "image",
      src: "ch01/img/gpt3_gpt3-training-examples-sliding-window.png",
      credit: "Jay Alammar, How GPT3 Works (CC BY-NC-SA 4.0)",
      title: "How plain text becomes training material",
      notes: ["Every position in a sentence is a small quiz.", "Guess, get corrected, adjust. Repeat trillions of times."],
      focus: [[50, 50, 1], [50, 62, 1.12]],
      beats: [
        { say: "How does that training work? Take any sentence from the internet. Every position in it becomes a small quiz: here is the text so far, what comes next?" },
        { say: "The model guesses, gets corrected, and its parameters shift very slightly. Repeat that trillions of times, and the guesses become very good." },
      ],
    },
    {
      kind: "custom",
      name: "fill",
      props: {
        items: [
          { before: "The capital of France is", answer: "Paris", note: "needs a fact" },
          { before: "12 crates of 4 bottles, plus 3 loose. Total? Step 1:", answer: "12 × 4 = 48", note: "needs something like reasoning" },
        ],
      },
      beats: [
        { say: "Here is the surprising part. To predict the next word well across that much text, the model had to absorb grammar, facts about the world, writing styles, and even patterns of step-by-step reasoning." },
        { say: "If the text so far is: the capital of France is, then predicting Paris requires knowing a fact." },
        { say: "If the text is a maths problem followed by: step 1, then predicting a good next line requires something that looks like reasoning." },
        { say: "So a machine whose only job is: guess the next word, ends up able to answer questions, write code and summarise documents." },
      ],
    },
    {
      kind: "big",
      tone: "idea",
      lead: "Keep this in your head for the rest of the stack",
      text: "The model produces text that is likely, not text that is checked.",
      after: "Usually likely = correct. When it isn't: confident nonsense.",
      beats: [
        { say: "Keep one consequence in your head for the rest of this stack, because it explains most of what goes wrong." },
        { say: "The model produces text that is likely, not text that is checked." },
        { say: "Most of the time, likely and correct are the same thing. When they are not, you get confident nonsense." },
      ],
    },

    // ---------------------------------------------------------------- 2
    { kind: "section", num: "2", title: "Tokens: the Lego pieces of text", beats: [{ say: "Part 2. Tokens: the Lego pieces of text." }] },
    {
      kind: "custom",
      name: "tokens",
      beats: [
        { say: "Models do not read letters, and they do not read whole words either. They read tokens: pieces of text from a fixed vocabulary, a bit like a box of Lego bricks." },
        { say: "Before the model sees your text, a tokeniser breaks it into those bricks." },
        { say: "Each brick is an id number from the vocabulary. That list of numbers is what the model actually receives." },
        { say: "Common English words are often a single brick. Rarer words get split into several bricks. Every tokeniser splits a little differently." },
        { say: "Codes like error slot expired, long numbers, and many non-English scripts get split into many small bricks." },
        { say: "A rule of thumb worth remembering: 100 tokens is about 75 English words." },
      ],
    },
    {
      kind: "custom",
      name: "marathi",
      beats: [
        { say: "Now finance's question answers itself. The tokeniser's vocabulary was built mostly from English text, so English words map to few bricks." },
        { say: "Marathi, written in the Devanagari script, has fewer ready-made bricks in the box, so the same sentence needs more of them." },
        { say: "Providers charge per token, so the same question costs more." },
      ],
    },
    {
      kind: "bullets",
      title: "Everything practical is counted in tokens",
      items: [
        { icon: "💰", text: "The price of a call", sub: "input and output tokens priced separately; output usually higher" },
        { icon: "📏", text: "How much text one call can hold", sub: "the context window" },
        { icon: "⏱️", text: "How fast you may send requests", sub: "rate limits" },
        { icon: "✂️", text: "How documents get cut up for search", sub: "later in this stack" },
      ],
      beats: [
        { say: "Everything practical in this field is counted in tokens. The price of a call: input tokens and output tokens are priced separately, and output is usually more expensive." },
        { say: "How much text one call can hold: the context window, which you will meet in part 5." },
        { say: "How fast you are allowed to send requests: rate limits." },
        { say: "And later in this stack, how documents get cut into pieces for search. One more catch: different providers use different tokenisers, so the same text has a different count, and a different price, on different models." },
      ],
    },

    // ---------------------------------------------------------------- 3
    { kind: "section", num: "3", title: "Why the same question gets two answers", beats: [{ say: "Part 3. Why the same question gets two answers." }] },
    {
      kind: "chat",
      title: "Meera asks the same question twice",
      messages: [
        { from: "user", who: "Meera", text: "Can bakery items be refunded after 6 hours?", step: 0 },
        { from: "bot", text: "Bakery items can be refunded within 6 hours of delivery, so not after that.", step: 0 },
        { from: "user", who: "Meera", text: "Can bakery items be refunded after 6 hours?", step: 1 },
        { from: "bot", text: "Bakery items can only be refunded if the problem is reported in the first 6 hours.", step: 1 },
      ],
      beats: [
        { say: "Meera asks: can bakery items be refunded after 6 hours?" },
        { say: "She asks again, and gets a differently worded answer. To see why, slow the model down and watch it write." },
      ],
    },
    {
      kind: "custom",
      name: "sampling",
      props: { mode: "basic" },
      beats: [
        { say: "The model looks at the text so far, and gives every token in its vocabulary a score. These raw scores are called logits." },
        { say: "A small function called softmax turns the scores into probabilities that add up to 1. Within: 62 percent. Only: 21 percent. Up: 9 percent. And tiny amounts for everything else." },
        { say: "The model picks one token by rolling a weighted die. Within comes up 62 times in 100, only comes up 21 times. This step is called sampling." },
        { say: "The chosen token is glued onto the text, and the whole thing runs again for the next token. An answer of 100 tokens is 100 rolls." },
        { say: "If one early roll lands on only instead of within, every later token is predicted from a different start, so the whole answer can come out differently. That is Meera's two answers." },
      ],
    },
    {
      kind: "image",
      src: "ch01/img/xlnet_gpt-2-autoregression-2.gif",
      gif: true,
      credit: JAY_GPT2,
      title: "The loop, in motion",
      notes: ["Each new token is appended to the input.", "Then the model runs again."],
      beats: [
        { say: "Here is that loop in motion. Each new token is appended to the input, and the model runs again to produce the next one. One token at a time, until the answer is finished." },
      ],
    },
    {
      kind: "custom",
      name: "sampling",
      props: { mode: "temp" },
      beats: [
        { say: "You control the die with two settings." },
        { say: "Temperature changes how lopsided the die is. Low temperature makes the favourite even more likely, so answers become predictable." },
        { say: "High temperature evens the odds, so unusual tokens get picked more often, and answers become varied, or creative." },
        { say: "Temperature 0 means: always pick the favourite. No roll at all." },
        { say: "Top-p, and its cousin top-k, remove the long tail of unlikely tokens before the roll." },
        { say: "With top-p 0.9, the model only rolls among the smallest set of tokens whose probabilities add up to 90 percent, so it can never pick something absurd." },
        { say: "For refund rules you want boring and consistent: low temperature. For writing ten different subject lines for a marketing email, you want variety: a higher temperature." },
      ],
    },
    {
      kind: "bullets",
      title: "Temperature 0 is reproducible?",
      tone: "myth",
      lead: "Not on hosted models.",
      items: [
        { icon: "🖥️", text: "Your request shares a GPU batch with strangers", sub: "tiny rounding differences depend on how each batch is made up" },
        { icon: "⚖️", text: "Near-ties can flip", sub: "when two tokens are almost tied, a rounding difference changes the pick" },
        { icon: "📌", text: "Models change silently", sub: "design for some variation, and pin the exact model version" },
      ],
      firstItemStep: 1,
      beats: [
        { say: "A correction that interviewers love: set temperature to 0 and the output is reproducible. That is wrong for hosted models." },
        { say: "Models run on GPUs, chips built for the enormous number of multiplications involved. Providers process many people's requests together on the same GPUs, and tiny rounding differences depend on how each batch of requests happens to be made up." },
        { say: "When two tokens are almost tied, that tiny difference can flip the choice." },
        { say: "Providers also update models without telling you. So design for some variation, and pin the exact model version you use." },
      ],
    },

    // ---------------------------------------------------------------- 4
    { kind: "section", num: "4", title: "Why it makes things up", beats: [{ say: "Part 4. Why it makes things up." }] },
    {
      kind: "chat",
      title: "The invented refund rule",
      messages: [
        { from: "user", who: "Agent", text: "What is FreshCart's refund window for frozen food?", step: 0 },
        { from: "bot", text: "Frozen items can be refunded within 48 hours if they arrive thawed, with a photo of the packaging.", step: 1 },
      ],
      stamp: { text: "HALLUCINATION", step: 2 },
      beats: [
        { say: "Back to the invented refund rule. FreshCart's policies were never in the model's training data." },
        { say: "Asked about them, the model does what it always does: it writes the most likely-sounding continuation, which is a plausible, generic refund rule." },
        { say: "Fluent, confident, and wrong. This is called a hallucination." },
      ],
    },
    {
      kind: "flow",
      title: "How a chat model is made",
      cols: 4,
      rows: 2,
      nodeW: 360,
      nodeH: 160,
      nodes: [
        { id: "PT", c: 0, r: 0, label: "Pretraining:\npredict the next token\non trillions of tokens" },
        { id: "BASE", c: 1, r: 0, label: "Base model:\nknows a lot, only\ncontinues text", tone: "muted" },
        { id: "SFT", c: 2, r: 0, label: "Instruction tuning:\nexamples of good\nanswers to requests" },
        { id: "PREF", c: 3, r: 0, label: "Preference training:\nwhich of two answers\npeople prefer" },
        { id: "CHAT", c: 3, r: 1, label: "Chat model:\nhelpful, polite,\nrefuses some things", tone: "green" },
        { id: "RL", c: 2, r: 1, label: "Reasoning training:\nrewarded for correct\nfinal answers" },
        { id: "RSN", c: 1, r: 1, label: "Reasoning model:\nthinks at length\nbefore answering", tone: "green" },
      ],
      edges: [
        { from: "PT", to: "BASE" },
        { from: "BASE", to: "SFT" },
        { from: "SFT", to: "PREF" },
        { from: "PREF", to: "CHAT" },
        { from: "CHAT", to: "RL" },
        { from: "RL", to: "RSN" },
      ],
      show: [[], ["PT", "BASE"], ["SFT"], ["PREF", "CHAT"], ["RL"], ["RSN"], []],
      overlay: { step: 6, text: "Missing from every stage: FreshCart's refund policy", tone: "red" },
      beats: [
        { say: "It helps to know how a chat model is made, because each stage leaves fingerprints on its behaviour." },
        { say: "Pretraining is the predict-the-next-token stage, on a huge pile of text. It produces a base model. Ask a base model a question and it may simply continue with three more questions, because that is what text on the internet often looks like. Its knowledge stops at a knowledge cutoff date." },
        { say: "Instruction tuning shows it thousands of examples of a request and a good answer, so it learns to respond like an assistant." },
        { say: "Preference training shows it pairs of answers where people picked the better one. This is where its helpful tone, and its refusals, come from." },
        { say: "Reasoning models get one more stage: reinforcement learning, which is training by trial and reward. The model attempts problems with checkable answers, like maths and code, and is rewarded when the final answer is right." },
        { say: "It learns to write out a long hidden chain of thought before answering. Much better at multi-step problems. Slower and more expensive, because all that thinking is generated, and billed, token by token." },
        { say: "Now notice what is missing from every stage: FreshCart. Nothing in this process ever showed the model your refund policy." },
      ],
    },
    {
      kind: "bullets",
      title: "Each cause of hallucination has its own fix",
      items: [
        { icon: "🔎", text: "Missing knowledge → look the facts up", sub: "and give them to the model with the question: chapters 2 to 4" },
        { icon: "❓", text: "Vague questions → clearer instructions", sub: "or let the model ask a clarifying question back" },
        { icon: "🚪", text: "Pressure to always answer → give it an exit", sub: "\"if you are not sure, say so\", then check against the source" },
      ],
      beats: [
        { say: "Each cause of hallucination has its own fix. Missing knowledge, meaning private, recent or rare facts: look the facts up and give them to the model together with the question. That is the subject of the next three chapters." },
        { say: "Vague questions: clearer instructions, or let the model ask a clarifying question back." },
        { say: "Pressure to always answer: give it an exit, like: if you are not sure, say so. And check its answer against the source afterwards." },
      ],
    },
    {
      kind: "decision",
      question: "\"Let's train the model on FreshCart's policies so it just knows them.\"",
      answer: "That is fine-tuning: continuing the model's training on your own examples.",
      left: { title: "Behaviour: reliable ✓", items: ["a format", "a tone", "a narrow task"] },
      right: { title: "Facts: unreliable ✗", items: ["can't say where it learned them", "blends them with older knowledge", "retrain on every policy change"] },
      footer: "Chapter 12 shows where fine-tuning does pay off.",
      beats: [
        { say: "Decision point. A manager suggests training the model on FreshCart's policies, so it just knows them." },
        { say: "That is fine-tuning: continuing the model's training on your own examples. It sounds right, and it is usually the wrong tool for facts." },
        { say: "Fine-tuning reliably teaches behaviour: a format, a tone, a narrow task. And it unreliably teaches facts: the model cannot say where it learned something, may blend it with older knowledge, and must be retrained whenever a policy changes." },
        { say: "Chapter 12 shows where fine-tuning does pay off." },
      ],
    },
    {
      kind: "pause",
      question: "Why does a longer prompt cost more, even for the same short answer? And why can't we paste all 12,000 documents into the prompt?",
      beats: [
        { say: "Pause and think. Finance's director asks two more questions. Why does a longer prompt cost more, even for the same short answer? And why can't we simply paste all 12,000 of our documents into the prompt?" },
        { say: "Before going on, guess: what inside the model would make long inputs expensive?", hold: 5 },
      ],
    },

    // ---------------------------------------------------------------- 5
    { kind: "section", num: "5", title: "Inside the model: vectors, attention and layers", beats: [{ say: "Part 5. Inside the model: vectors, attention and layers. You do not need the maths for an AI engineer interview. You do need this picture." }] },
    {
      kind: "custom",
      name: "embed",
      beats: [
        { say: "Step one: every token becomes a list of numbers. The model keeps a big lookup table. Each token id is replaced by a vector, which is simply a list of numbers, for example 4,096 of them, learned during training." },
        { say: "Think of it as the token's coordinates in a space of meaning. Tokens used in similar ways end up with similar numbers, so they sit close together." },
        { say: "Position information is added too, because dog bites man, and man bites dog, contain the same tokens in a different order." },
      ],
    },
    {
      kind: "custom",
      name: "attention",
      beats: [
        { say: "Step two: tokens look at each other. Take the sentence: the milk was spoiled, so the customer returned it." },
        { say: "To understand it, the model must look back and realise that it means the milk. The mechanism that does this is called attention." },
      ],
    },
    {
      kind: "image",
      src: "ch01/img/t_transformer_self-attention_visualization.png",
      credit: JAY_TF,
      title: "A real attention pattern",
      notes: ["Processing \"it\": this head looks mostly at \"The animal\"."],
      focus: [[50, 50, 1]],
      beats: [
        { say: "Here is a real attention pattern from a trained model. While processing the word it, this attention head looks mostly at: the animal. Exactly the link we just drew." },
      ],
    },
    {
      kind: "image",
      src: "ch01/img/gpt2_self-attention-example-folders-3.png",
      credit: JAY_GPT2,
      title: "Query, key and value",
      notes: [
        "Each token asks; earlier tokens answer.",
        "Query: what am I looking for?",
        "Key: what do I contain?  Value: what do I pass on?",
      ],
      focus: [[50, 50, 1], [25, 45, 1.35], [65, 35, 1.25]],
      beats: [
        { say: "In plain words: each token asks a question, and every earlier token offers an answer. In this picture, the token it holds up its question like a sticky note." },
        { say: "That note is the query: what am I looking for?" },
        { say: "Every earlier token is a folder. On its tab is a key: what do I contain? And inside is a value: what do I pass on if you pick me?" },
      ],
    },
    {
      kind: "image",
      src: "ch01/img/gpt2_self-attention-example-folders-scores-3.png",
      credit: JAY_GPT2,
      title: "Matching the query against every key",
      notes: ["Good matches get high weight: robot 50%, a 30%."],
      focus: [[55, 40, 1.1]],
      beats: [
        { say: "The query of it is compared with the key of every earlier token. Good matches get high weight. Here, robot gets 50 percent, and a gets 30 percent." },
      ],
    },
    {
      kind: "image",
      src: "ch01/img/gpt2_gpt2-value-vector-sum.png",
      credit: JAY_GPT2,
      title: "A weighted blend of the values",
      notes: ["New vector for \"it\" = values × scores, summed.", "In our sentence: mostly \"milk\", a bit of \"spoiled\"."],
      focus: [[50, 50, 1], [75, 70, 1.25]],
      beats: [
        { say: "The new vector for it is a weighted blend of the values: each value multiplied by its score, then added up." },
        { say: "Here that is mostly robot. In our FreshCart sentence, it would be mostly milk, and a bit of spoiled." },
      ],
    },
    {
      kind: "image",
      src: "ch01/img/t_transformer_self-attention_visualization_2.png",
      credit: JAY_TF,
      title: "Multi-head attention",
      notes: ["Several attention heads run in parallel,", "each noticing a different relationship."],
      focus: [[50, 50, 1]],
      beats: [
        { say: "Multi-head attention runs several of these in parallel, each free to notice a different kind of relationship: who did what, which word refers to which, grammar. Here, two heads look at different words for the same token." },
      ],
    },
    {
      kind: "image",
      src: "ch01/img/gpt2_self-attention-and-masked-self-attention.png",
      credit: JAY_GPT2,
      title: "A writer only looks backwards",
      notes: ["Right: masked self-attention.", "The future does not exist yet."],
      focus: [[75, 55, 1.15]],
      beats: [
        { say: "In a model that writes text, a token may only look at tokens before it, never after. Because while writing, the future does not exist yet." },
      ],
    },
    {
      kind: "custom",
      name: "layers",
      beats: [
        { say: "Step three: repeat in layers. A layer is one round of attention, where tokens share information, followed by a small feed-forward network that transforms each token's vector on its own." },
        { say: "A large model stacks dozens of layers, like an assembly line where each station refines the meaning a little more. Much of what the model knows as facts is stored in the feed-forward parts." },
        { say: "At the end, the vector of the last token is turned into scores for the next token, and you are back at the weighted die from part 3." },
      ],
    },
    {
      kind: "image",
      src: "ch01/img/full-gpt-architecture.png",
      credit: "\"Full GPT architecture\" by Marxav, vectorised by Mrmw, Wikimedia Commons (CC0)",
      title: "The whole design in one picture",
      notes: ["Bottom: token + position embeddings", "Middle: a stack of transformer blocks", "Top: next-token probabilities"],
      focus: [[50, 50, 1], [50, 85, 1.5], [50, 50, 1.3], [50, 12, 1.6]],
      beats: [
        { say: "Here is the whole design in one picture." },
        { say: "At the bottom, token and position embeddings." },
        { say: "In the middle, a stack of transformer blocks: attention, plus feed-forward, repeated." },
        { say: "And at the top, the final step that produces next-token probabilities." },
      ],
    },
    {
      kind: "custom",
      name: "encdec",
      beats: [
        { say: "This whole design is called a transformer. Every major chat model today is a transformer that only looks backwards: a decoder-only model." },
        { say: "Embedding models and rerankers, which you will meet in chapters 2 and 3, are usually the other kind, an encoder, which looks both ways across a fixed piece of text, because it only needs to understand it, not continue it." },
      ],
    },
    {
      kind: "custom",
      name: "director",
      beats: [
        { say: "Now, the director's questions." },
        { say: "Why does a longer prompt cost more? Before writing anything, the model must run every prompt token through every layer. This first pass is called prefill." },
        { say: "And attention compares each token with every earlier token, so doubling the prompt more than doubles that work. You pay per input token, and you wait longer for the first word." },
        { say: "Why not paste in all 12,000 documents? First, they would be hundreds of millions of tokens, far beyond any model's context window: the maximum number of tokens one call can handle, prompt plus answer. Today's windows range from tens of thousands to over a million tokens." },
        { say: "Second, even inside the window, attention spread over a huge input gets diluted. Models use information buried in the middle of a long input noticeably less reliably." },
        { say: "Third, while writing, the model keeps the attention keys and values of every earlier token in GPU memory, so it does not recompute them for each new token. This is called the KV cache. That memory grows with the length of the input, and limits how many users one GPU can serve." },
      ],
    },
    {
      kind: "custom",
      name: "cache",
      beats: [
        { say: "One more trick worth knowing now: prompt caching. If many requests start with exactly the same text, like the same long instructions, the provider can keep the processed start and reuse it. Requests become cheaper and faster." },
        { say: "That is why well-built assistants put their fixed instructions at the very start of every prompt, and the changing parts at the end." },
      ],
    },
    {
      kind: "big",
      tone: "myth",
      lead: "Correction",
      text: "\"The model reads the whole document like a person.\"",
      after: "Reliability drops as the input grows: what you put in the context, and where, matters.",
      beats: [
        { say: "A correction: the model reads the whole document like a person. That is misleading." },
        { say: "Its reliability drops as the input grows, so what you put in the context, and where, matters a great deal." },
      ],
    },
    {
      kind: "pause",
      question: "You cannot retrain the model, and you cannot paste in everything. What is left that you control on every single call?",
      beats: [
        { say: "Pause and think. You cannot retrain the model, and you cannot paste in everything. What is left that you control on every single call?", hold: 4 },
      ],
    },

    // ---------------------------------------------------------------- 6
    { kind: "section", num: "6", title: "Steering the model: prompts that work", beats: [{ say: "Part 6. Steering the model: prompts that work." }] },
    {
      kind: "custom",
      name: "tickets",
      beats: [
        { say: "What you control is the prompt: the text instructions you send with each request." },
        { say: "FreshCart gives you a small first task to practise on. About 3,000 customer tickets arrive every day, and two people spend their mornings sorting them by hand into refund, late delivery, missing item, and other. Can the model do the sorting?" },
      ],
    },
    {
      kind: "custom",
      name: "attempt1",
      beats: [
        { say: "Attempt one. You write: classify this ticket as refund, late delivery, missing item or other." },
        { say: "Meera's team has hand-labelled 200 tickets as a test set. Your prompt gets 81 percent right." },
        { say: "Then the patching starts. Someone adds: IMPORTANT, refunds are not complaints, with three exclamation marks. Another adds a rule for late deliveries. And every fix breaks something else." },
        { say: "Prompting looks like writing. Done well, it is engineering." },
      ],
    },
    {
      kind: "flow",
      title: "A structure that works: brief a smart new colleague",
      cols: 5,
      rows: 1,
      nodeW: 310,
      nodeH: 180,
      nodes: [
        { id: "R", c: 0, r: 0, label: "Role and goal:\nyou sort FreshCart\nsupport tickets" },
        { id: "C", c: 1, r: 0, label: "Definitions and\nrules for the\nconfusing cases" },
        { id: "E", c: 2, r: 0, label: "A few examples,\nchosen from the\nhard cases" },
        { id: "F", c: 3, r: 0, label: "Exact output\nformat, machine-\nreadable" },
        { id: "I", c: 4, r: 0, label: "The ticket itself,\nclearly fenced off" },
      ],
      edges: [
        { from: "R", to: "C" },
        { from: "C", to: "E" },
        { from: "E", to: "F" },
        { from: "F", to: "I" },
      ],
      show: [[], ["R"], ["C"], ["E"], ["F"], ["I"], []],
      overlay: { step: 6, text: "Clear rules beat emphasis: \"IMPORTANT!!!\" adds nothing a definition doesn't do better", tone: "green" },
      beats: [
        { say: "A structure that works. Think of briefing a smart new colleague on their first day: who they are helping, what the categories mean, a few examples of tricky cases, and exactly what form you want the answer in." },
        { say: "Role and goal, in a sentence or two." },
        { say: "Definitions and rules, including how to resolve the cases people disagree on. If money back is requested, it is refund, even if the order was also late." },
        { say: "A few examples, chosen from the hard cases." },
        { say: "The output format: a precise description of the fields and allowed values, called a schema. Most providers offer structured output, a feature that forces the reply to follow your schema, so your code never has to parse chatty text." },
        { say: "And the input, fenced off with tags, so that words inside a ticket, like: ignore your instructions, are treated as data, not instructions." },
        { say: "Clear rules beat emphasis. IMPORTANT, in capital letters, does nothing that a precise definition does not do better." },
      ],
    },
    {
      kind: "bullets",
      title: "Examples teach faster than rules",
      lead: "zero-shot: no examples · few-shot: a handful, and the model copies the pattern",
      items: [
        { icon: "🧱", text: "Show the hard boundaries", sub: "not the easy cases" },
        { icon: "⚖️", text: "Balance the labels", sub: "7 of 8 examples are refunds → it leans towards refund" },
        { icon: "🔀", text: "Vary the wording", sub: "or it copies surface features" },
        { icon: "🧲", text: "Dynamic few-shot", sub: "pick the most similar labelled tickets for each new one: chapter 2's search problem" },
      ],
      firstItemStep: 1,
      beats: [
        { say: "Examples teach faster than rules. Giving no examples is called zero-shot prompting. Adding a handful of input-output examples is few-shot prompting, and the model copies the pattern. So choose examples on purpose." },
        { say: "Show the hard boundaries, not the easy cases." },
        { say: "Balance the labels. If seven of eight examples are refunds, the model leans towards refund." },
        { say: "Vary the wording, or the model copies surface features." },
        { say: "Better still, keep a pool of a few hundred labelled tickets, and for each new ticket, use the most similar ones as examples. This is called dynamic few-shot. Finding the most similar ones is exactly the search problem the next chapter solves." },
      ],
    },
    {
      kind: "flow",
      title: "Letting the model think",
      cols: 3,
      rows: 3,
      nodeW: 380,
      nodeH: 130,
      nodes: [
        { id: "Q", c: 0, r: 1, label: "Ordered Monday, slot\nmoved twice, arrived\nThursday spoiled" },
        { id: "P1", c: 1, r: 0, label: "Path 1: reasons,\nanswers rule B" },
        { id: "P2", c: 1, r: 1, label: "Path 2: reasons,\nanswers rule B" },
        { id: "P3", c: 1, r: 2, label: "Path 3: reasons,\nanswers rule A", tone: "muted" },
        { id: "V", c: 2, r: 1, label: "Majority vote:\nrule B", tone: "green" },
      ],
      edges: [
        { from: "Q", to: "P1" },
        { from: "Q", to: "P2" },
        { from: "Q", to: "P3" },
        { from: "P1", to: "V" },
        { from: "P2", to: "V" },
        { from: "P3", to: "V" },
      ],
      show: [["Q"], ["P1"], ["P2", "P3", "V"], []],
      overlay: { step: 3, text: "More reliable, and 3× the cost", tone: "amber" },
      beats: [
        { say: "Letting the model think. Some tickets need steps: ordered Monday, slot moved twice, arrived Thursday spoiled. Which rule applies?" },
        { say: "Asking the model to reason step by step before answering, called chain-of-thought, measurably helps on multi-step problems, because the model can build on its own written intermediate steps. Keep that reasoning in a separate field, so your code only reads the final answer." },
        { say: "Self-consistency goes further: sample several reasoning paths, at a temperature above zero, and take the majority answer." },
        { say: "More reliable, and three times the cost. Reasoning models already think internally; for them, give the goal and the constraints, rather than a procedure." },
      ],
    },
    {
      kind: "flow",
      title: "Split big jobs: prompt chaining",
      cols: 4,
      rows: 2,
      nodeW: 330,
      nodeH: 120,
      nodes: [
        { id: "M", c: 1.5, r: 0, label: "One prompt: classify, extract the order id,\ncheck the policy, draft a reply", tone: "red" },
        { id: "C1", c: 0, r: 1, label: "Classify" },
        { id: "C2", c: 1, r: 1, label: "Extract\norder id" },
        { id: "C3", c: 2, r: 1, label: "Check\nthe policy" },
        { id: "C4", c: 3, r: 1, label: "Draft\nthe reply", tone: "green" },
      ],
      edges: [
        { from: "C1", to: "C2", label: "code checks" },
        { from: "C2", to: "C3", label: "code checks" },
        { from: "C3", to: "C4", label: "code checks" },
      ],
      show: [["M"], ["C1", "C2", "C3", "C4"]],
      hide: [[], ["M"]],
      beats: [
        { say: "Split big jobs. When one prompt tries to classify, extract the order id, check the policy, and draft a reply, it does all of them a bit worse." },
        { say: "A chain of small prompts, with plain code between the steps checking each output, is easier to test, and can run on smaller, cheaper models. This is called prompt chaining." },
      ],
    },
    {
      kind: "flow",
      title: "Treat prompts as code",
      cols: 4,
      rows: 2,
      nodeW: 340,
      nodeH: 140,
      nodes: [
        { id: "CH", c: 0, r: 0.5, label: "Prompt change\nas a pull request" },
        { id: "TS", c: 1, r: 0.5, label: "Run on 200\nlabelled tickets,\nper category" },
        { id: "CMP", c: 2, r: 0.5, label: "Compare with\ncurrent version" },
        { id: "SHIP", c: 3, r: 0, label: "Ship it,\nrecord version", tone: "green" },
        { id: "FIX", c: 3, r: 1, label: "Fix or drop", tone: "red" },
      ],
      edges: [
        { from: "CH", to: "TS" },
        { from: "TS", to: "CMP" },
        { from: "CMP", to: "SHIP", label: "better, nothing worse" },
        { from: "CMP", to: "FIX", label: "worse somewhere" },
      ],
      show: [["CH"], ["TS", "CMP"], ["SHIP", "FIX"], []],
      overlay: { step: 3, text: "Every production request records its prompt version", tone: "blue" },
      beats: [
        { say: "Treat prompts as code. Prompts live in version control, next to the code." },
        { say: "Every change runs against the 200 labelled tickets, with accuracy per category, because a fix for refunds often breaks complaints." },
        { say: "Ship a change only if it is better, without making any category worse." },
        { say: "Every request in production records which prompt version produced it, so a bad answer can be traced to its prompt. And re-run the test set whenever the model version changes." },
      ],
    },
    {
      kind: "code",
      title: "Attempt two",
      lang: "text",
      code: `You sort FreshCart grocery-delivery support tickets so they reach the right team.

Categories:
- refund: the customer asks for money back, for any reason.
- late_delivery: the order arrived after its slot, and no money is requested.
- missing_item: something ordered was not in the delivery.
- other: anything else, including general complaints.

Rules for unclear cases:
- If money back is requested, it is refund, even if the order was also late.
- Anger alone does not make a ticket a refund.

Examples:
<ticket>Order came 2 hours late, I want my delivery fee back</ticket> -> refund
<ticket>Driver was rude and the slot was missed</ticket> -> late_delivery
<ticket>No bread in my bag today</ticket> -> missing_item

Reply with JSON only: {"intent": "<one of the four categories>"}

<ticket>{ticket}</ticket>`,
      highlight: [null, [3, 7], [9, 11], [13, 16], [18, 20], null],
      badge: { step: 5, from: 81, to: 93, label: "accuracy on 200 tickets" },
      beats: [
        { say: "Attempt two: the prompt after applying all of this." },
        { say: "Every category gets a definition." },
        { say: "The confusing boundary gets an explicit rule." },
        { say: "The examples show the hard cases." },
        { say: "And the output is a format code can read, with the ticket fenced off at the end." },
        { say: "On the same 200 tickets, it scores around 93 percent. Nothing magic happened. The gains come from clear instructions, good examples, sensible splitting of the task, and measurement. Not from magic phrases." },
      ],
    },

    // ---------------------------------------------------------------- 7
    { kind: "section", num: "7", title: "Complete example: the weighted die, by hand", beats: [{ say: "Part 7. A complete example: the weighted die, by hand." }] },
    {
      kind: "code",
      title: "sample.py",
      lang: "python",
      code: `import math, random

def softmax(logits, temperature):
    # turn raw scores into probabilities that add up to 1
    if temperature == 0:
        best = max(range(len(logits)), key=lambda i: logits[i])
        return [1.0 if i == best else 0.0 for i in range(len(logits))]
    scaled = [l / temperature for l in logits]
    m = max(scaled)
    exps = [math.exp(s - m) for s in scaled]
    total = sum(exps)
    return [e / total for e in exps]

def top_p_filter(probs, p):
    # keep the most likely tokens until their probabilities reach p
    order = sorted(range(len(probs)), key=lambda i: probs[i], reverse=True)
    kept, running = [], 0.0
    for i in order:
        kept.append(i)
        running += probs[i]
        if running >= p:
            break
    total = sum(probs[i] for i in kept)
    return {i: probs[i] / total for i in kept}

def sample(tokens, logits, temperature=0.7, top_p=0.9, rng=random):
    probs = top_p_filter(softmax(logits, temperature), top_p)
    r, acc = rng.random(), 0.0
    for i, pr in probs.items():
        acc += pr
        if r <= acc:
            return tokens[i]
    return tokens[max(probs, key=probs.get)]`,
      highlight: [null, [3, 12], [14, 24], [26, 33]],
      beats: [
        { say: "Here is the whole sampling process in about thirty lines of Python." },
        { say: "Softmax turns raw scores into probabilities that add up to 1. At temperature 0, it simply picks the best one." },
        { say: "The top-p filter keeps the most likely tokens until their probabilities reach p." },
        { say: "And sample rolls the weighted die over whatever is left." },
      ],
    },
    {
      kind: "custom",
      name: "sampling",
      props: { mode: "example" },
      beats: [
        { say: "Try it with three tokens: within, only and up, with scores 2, 0.9 and 0.1. At temperature 0, within always wins." },
        { say: "At temperature 1, the probabilities are about 0.67, 0.22 and 0.10. At temperature 2, the odds even out, to about 0.51, 0.29 and 0.20, so only and up come up more often." },
        { say: "And top-p at 0.85, at temperature 1, keeps within and only, because together they reach 0.90, the first point at or above 0.85. Up is dropped entirely." },
      ],
    },
    {
      kind: "big",
      tone: "interview",
      lead: "Also asked: \"Explain attention in one minute\"",
      text: "Each token compares its query with the keys of earlier tokens, turns the matches into weights, and takes a weighted blend of their values.",
      after: "So every token's vector absorbs information from the tokens that matter to it.",
      beats: [
        { say: "Also asked in interviews: explain attention in one minute." },
        { say: "Each token compares its query with the keys of earlier tokens, turns the matches into weights, and takes a weighted blend of their values." },
        { say: "So every token's vector absorbs information from the tokens that matter to it." },
      ],
    },

    // ---------------------------------------------------------------- next
    { kind: "section", num: "→", title: "What breaks next", beats: [{ say: "What breaks next." }] },
    {
      kind: "chat",
      title: "Meera wants the real thing",
      messages: [
        { from: "user", who: "Meera", text: "The sorter is great. Can it answer my agents' questions? Like: can bakery items be refunded after 6 hours?", step: 0 },
        { from: "bot", text: "The answer lives in FreshCart's refund policy, which I never saw.", step: 1 },
      ],
      stamp: { text: "PROMPTING CAN'T FIX THIS", step: 2 },
      beats: [
        { say: "The ticket sorter works. Meera is impressed, and asks for the real thing: can it answer my agents' questions? Things like: can bakery items be refunded after 6 hours?" },
        { say: "You now know exactly why the plain model cannot. The answer lives in FreshCart's refund policy, which the model never saw." },
        { say: "Prompting cannot fix that, because the prompt would need to contain the policy. And you cannot put every policy into every prompt: 12,000 documents are hundreds of millions of tokens, far past the context window, and even a model with a huge window gets worse and slower as the input grows." },
      ],
    },
    {
      kind: "pause",
      visual: "docs",
      question: "Only 2 or 3 pages out of 12,000 documents matter for each question. If you could find them first, in a fraction of a second, what would you do with them?",
      beats: [
        { say: "Pause and think. For each question, only two or three pages out of 12,000 documents actually matter. If you could somehow find those pages first, in a fraction of a second, what would you do with them?" },
        { say: "And how would a computer know which pages match a question that uses completely different words from the document?", hold: 4 },
      ],
    },
    {
      kind: "title",
      eyebrow: "Next",
      title: "Chapter 2 — RAG from scratch",
      subtitle: "from one question to 12,000 documents",
      beats: [{ say: "That is chapter 2." }],
    },
  ],
};
