import type { Chapter } from "../lib/types.ts";

// Chapter 2 of the AI Stack: RAG from scratch, interview-ready. The running
// example is a company HR assistant that must answer from 3,000 internal
// documents it was never trained on.

export const ch02: Chapter = {
  id: "ch02",
  title: "RAG from scratch",
  voice: "en-US-AndrewMultilingualNeural",
  next: "Chapter 3 — Search fast, search well",
  scenes: [
    {
      kind: "custom",
      name: "a2hook",
      beats: [
        { say: "An employee asks the company's new HR assistant: how many weeks of parental leave do I get? And it answers, instantly and politely: most companies offer around twelve weeks." },
        { say: "Wrong. Your handbook says twenty six.", tone: "excite" },
        { say: "And the model never had a chance. Your employee handbook is private. It was never in its training data." },
        { say: "The fix is the one architecture you'll be asked about in almost every AI engineering interview. RAG.", tone: "key" },
      ],
    },
    {
      kind: "title",
      eyebrow: "AI Stack · Chapter 2",
      title: "RAG from scratch",
      subtitle: "find the right pages, then answer from them",
      beats: [{ say: "Chapter two. Retrieval augmented generation, from scratch." }],
    },
    {
      kind: "bullets",
      title: "By the end, you can answer",
      firstItemStep: 1,
      items: [
        { icon: "🧭", text: "Why RAG, and when is it the wrong tool?" },
        { icon: "📍", text: "How do embeddings capture meaning, and how are they trained?" },
        { icon: "✂️", text: "How would you chunk these documents, and why?" },
        { icon: "🛠️", text: "Walk me through a RAG pipeline, end to end" },
      ],
      beats: [
        { say: "By the end, you'll be able to answer these." },
        { say: "Why RAG, and when it's the wrong tool." },
        { say: "How embeddings capture meaning, and how embedding models are trained." },
        { say: "How you'd chunk a set of documents, and why." },
        { say: "And the big one: walk me through a RAG pipeline, end to end." },
      ],
    },

    // ------------------------------------------------------------ 1
    { kind: "section", num: "1", title: "An open-book exam", beats: [{ say: "First, the idea, in one picture." }] },
    {
      kind: "custom",
      name: "a2openbook",
      beats: [
        { say: "Right now, the model is sitting a closed book exam. It answers from memory, and when it doesn't know, it guesses something plausible." },
        { say: "RAG turns it into an open book exam. Before answering, find the few pages that matter, and put them in front of the model." },
        {
          say: "That's retrieval augmented generation. Two jobs. Retrieve the relevant chunks. Then generate an answer, only from them, with citations.",
          tone: "key",
          term: { word: "RAG", meaning: "retrieve relevant text, then generate from it" },
        },
        { say: "The model doesn't need to know your facts. It needs to read them at the right moment." },
      ],
    },
    {
      kind: "numbers",
      title: "Why not paste in every document?",
      items: [
        { value: "3,000", label: "internal documents", sub: "handbook, policies, wiki" },
        { value: "20M", label: "tokens in total", sub: "roughly" },
        { value: "1M", label: "largest context windows", sub: "and slower, the fuller they get" },
        { value: "$60", label: "per question", sub: "at $3 per million input tokens" },
      ],
      footer: "find the few relevant chunks first: that is the whole game",
      beats: [
        { say: "Why not skip retrieval, and paste in every document? Say the company has three thousand internal documents." },
        { say: "That's roughly twenty million tokens." },
        { say: "Even the largest context windows hold about a million, and models use a very full window less reliably." },
        { say: "And even if it fit, at three dollars per million input tokens, that's sixty dollars for every single question." },
        { say: "So the whole game is finding the few chunks that matter, first.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 2
    { kind: "section", num: "2", title: "Search by keywords", beats: [{ say: "So, how do we find them? The obvious first try: keywords." }] },
    {
      kind: "custom",
      name: "a2keyword",
      beats: [
        {
          say: "The employee writes: how much time off do I get when my baby is born? Keyword search ranks documents by the words they share with the question.",
          term: { word: "Keyword search", meaning: "rank documents by shared words" },
        },
        { say: "Time off request form: time, off, a perfect match. Number one. The parental leave policy shares no words at all. It lands at number nine." },
        {
          say: "That's the vocabulary mismatch problem. People describe the same thing in different words.",
          tone: "key",
          term: { word: "Vocabulary mismatch", meaning: "same meaning, different words" },
        },
        { say: "But don't throw keyword search away. For exact codes, error numbers and names, like error E four zero one two, nothing beats it. Chapter three combines both." },
      ],
    },

    // ------------------------------------------------------------ 3
    { kind: "section", num: "3", title: "Search by meaning: embeddings", beats: [{ say: "We need search that understands meaning, not spelling.", tone: "excite" }] },
    {
      kind: "custom",
      name: "a2meaning",
      beats: [
        {
          say: "An embedding model turns any piece of text into a vector: a list of, say, a thousand numbers. Texts with similar meaning get nearby numbers, even when they share no words.",
          term: { word: "Embedding model", meaning: "turns text into a vector of meaning" },
        },
        { say: "Embed every chunk of every document once, and store them. You get a map: leave policies in one corner, expenses in another, IT help in a third." },
        { say: "Now embed the question. Time off, when my baby is born, lands right next to parental leave. No shared words needed." },
        {
          say: "Return the nearest few. That's vector search, and the data structure that answers which vectors are nearest, fast, is a vector index.",
          tone: "key",
          term: { word: "Vector search", meaning: "embed the question, return the nearest chunks" },
        },
      ],
    },
    {
      kind: "custom",
      name: "a2cosine",
      beats: [
        {
          say: "How do we measure near? Cosine similarity compares the directions two vectors point in, and ignores their length. One means same direction. Zero means unrelated.",
          term: { word: "Cosine similarity", meaning: "how closely two vectors point the same way" },
        },
        { say: "The dot product multiplies the vectors number by number, and adds it all up. It cares about direction and length." },
        { say: "And Euclidean distance is the straight line between the two points." },
        {
          say: "The practical trick: scale every vector to length one when you store it. Then cosine and dot product give the same answer, and Euclidean ranks results in the same order. So you normalise once, and use the cheapest: the dot product.",
          tone: "key",
          term: { word: "Normalise", meaning: "scale every vector to length 1" },
        },
      ],
    },
    {
      kind: "custom",
      name: "a2contrastive",
      beats: [
        {
          say: "The interview favourite: how does the model learn where to put things? From millions of pairs that belong together. A question and its answer. A search and the page people clicked.",
          term: { word: "Contrastive learning", meaning: "pull matching pairs together, push others apart" },
        },
        {
          say: "In each batch, every question has its own passage. And every other passage in the batch is a wrong answer, for free. Those are in batch negatives.",
          term: { word: "In-batch negatives", meaning: "other pairs' passages used as wrong answers" },
        },
        { say: "Training pulls each real pair together, and pushes the wrong ones apart. Step by step, the loss falls, and the diagonal lights up." },
        {
          say: "The best training sets add hard negatives: wrong answers that look almost right. Carry over leave, versus parental leave. They teach the fine distinctions.",
          tone: "key",
          term: { word: "Hard negative", meaning: "a wrong answer that looks almost right" },
        },
      ],
    },
    {
      kind: "bullets",
      title: "Choosing an embedding model",
      firstItemStep: 1,
      items: [
        { icon: "🧪", text: "Test on your own questions", sub: "50–100 questions with known answers; leaderboards like MTEB are a shortlist" },
        { icon: "📏", text: "Check the input limit", sub: "often 512 tokens; the rest is silently ignored" },
        { icon: "🪆", text: "Dimensions cost memory and speed", sub: "Matryoshka models let you keep just the first 256 numbers" },
        { icon: "🏷️", text: "Use the query / passage prefixes", sub: "forgetting them quietly lowers quality" },
      ],
      beats: [
        { say: "How do you pick an embedding model? Four checks." },
        { say: "Test on your own questions. Fifty to a hundred, where you know the right document. Public leaderboards like M T E B give you a shortlist, not a decision." },
        { say: "Check the input limit. Many models read only five hundred and twelve tokens, and silently ignore the rest." },
        {
          say: "Dimensions cost memory and speed. Matryoshka models are trained so that just the first part of the vector works on its own.",
          term: { word: "Matryoshka", meaning: "a vector whose first part works alone" },
        },
        { say: "And use the prefixes. Many models expect a query marker on questions, and a passage marker on documents. Forget them, and quality drops quietly." },
      ],
    },
    {
      kind: "trap",
      myth: "Switching embedding models later is just a config change.",
      truth: "Vectors from different models live in different spaces. They can't be compared, so every chunk must be embedded again.",
      beats: [
        { say: "A trap that sounds harmless: we can switch embedding models later. It's just a config change." },
        { say: "It isn't. Vectors from different models live in different spaces, and can't be compared. Every chunk has to be embedded again.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 4
    { kind: "section", num: "4", title: "Chunking", beats: [{ say: "Now, what exactly do we embed?" }] },
    {
      kind: "custom",
      name: "a2onevector",
      beats: [
        { say: "Say we embed the whole forty page handbook as one vector. Leave, expenses, IT, conduct, all in one point." },
        { say: "That point is an average of everything. It's close to nothing in particular. The leave question can't find it." },
        {
          say: "So we cut documents into chunks, a few hundred tokens each. Every chunk is a sharp point, and one of them lands right next to the question.",
          tone: "key",
          term: { word: "Chunk", meaning: "a small piece of a document, embedded alone" },
        },
        { say: "But cut too small, and a chunk loses its meaning. It is twenty six weeks for the primary carer. What is it?" },
      ],
    },
    {
      kind: "custom",
      name: "a2chunkers",
      beats: [
        {
          say: "Four ways to cut, from crude to clever. Fixed size: every so many characters or tokens. Simple, but it slices words and sentences in half.",
          term: { word: "Fixed-size chunking", meaning: "cut every N characters or tokens" },
        },
        {
          say: "Add overlap, so neighbouring chunks share an edge. A sentence that gets cut still survives whole in one of them.",
          term: { word: "Overlap", meaning: "neighbouring chunks share some text" },
        },
        {
          say: "Recursive splitting tries the biggest natural break first: paragraphs, then sentences, then words, until each piece fits. It's the sensible default.",
          tone: "key",
          term: { word: "Recursive splitting", meaning: "split by paragraph, sentence, then word" },
        },
        {
          say: "Semantic chunking embeds each sentence, and cuts where neighbouring sentences stop being similar: here, where leave turns into expenses. Smarter, and slower to build.",
          term: { word: "Semantic chunking", meaning: "cut where the meaning shifts" },
        },
      ],
    },
    {
      kind: "chart",
      title: "Which chunk size? Measure it",
      type: "bars",
      labels: ["200 tokens", "400 tokens", "800 tokens"],
      series: [{ name: "right passage in top 10 (example)", values: [71, 84, 76], tone: "green", step: 1 }],
      max: 100,
      unit: "%",
      note: { step: 2, text: "“I compared three sizes on our real questions” beats “512, because everyone uses it”" },
      beats: [
        { say: "So which chunk size? Don't guess. Take eighty real questions, mark the passage that answers each one, and build the index three times." },
        { say: "Count how often the right passage lands in the top ten. Here, four hundred tokens wins. On your data, it may not." },
        { say: "In an interview, I compared three sizes on our real questions, beats five twelve, because everyone uses it.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "a2parent",
      beats: [
        {
          say: "Two upgrades fix the too small problem. First, parent child retrieval. Embed small, sharp chunks, but each one remembers the section it came from: its parent.",
          term: { word: "Parent-child retrieval", meaning: "search small chunks, return their parent" },
        },
        { say: "The question, how long is parental leave, matches one small child chunk." },
        { say: "But the model receives the whole parent section: the twenty six weeks, the start date, and the notice rule. Precise search, full context.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "a2context",
      beats: [
        { say: "Second: contextual retrieval. Here's a chunk as stored. It is twenty six weeks for the primary carer. Alone, it makes no sense." },
        {
          say: "Before indexing, an LLM reads each chunk together with its whole document, and writes one sentence that places it. From the twenty twenty six employee handbook, section four point two, parental leave. That's glued on, before embedding.",
          term: { word: "Contextual retrieval", meaning: "prefix each chunk with where it came from" },
        },
        { say: "Anthropic reported this cut failed retrievals by thirty five percent. And by forty nine percent, when the keyword index gets the same treatment." },
        { say: "The cost: one model call per chunk, once, at indexing time. Prompt caching makes the repeated document cheap.", tone: "aside" },
      ],
    },

    // ------------------------------------------------------------ 5
    { kind: "section", num: "5", title: "The full pipeline", beats: [{ say: "Let's put the whole pipeline together.", tone: "excite" }] },
    {
      kind: "flow",
      title: "Two halves: indexing offline, answering online",
      cols: 4,
      rows: 2,
      nodeW: 360,
      nodeH: 150,
      nodes: [
        { id: "PARSE", c: 0, r: 0, label: "Parse\nPDFs, wiki → clean text", tone: "purple" },
        { id: "CHUNK", c: 1, r: 0, label: "Chunk\n+ metadata: doc, version,\nwho may see it", tone: "purple" },
        { id: "EMB", c: 2, r: 0, label: "Embed\nevery chunk", tone: "purple" },
        { id: "STORE", c: 3, r: 0, label: "Store\nvector index +\nkeyword index", tone: "purple" },
        { id: "Q", c: 0, r: 1, label: "Embed the question\nsame model", tone: "blue" },
        { id: "SEARCH", c: 1, r: 1, label: "Search top 20\nonly chunks this\nuser may see", tone: "blue" },
        { id: "RERANK", c: 2, r: 1, label: "Rerank → best 5\nslower, sharper\n(chapter 3)", tone: "blue" },
        { id: "GEN", c: 3, r: 1, label: "Generate\nanswer + citations", tone: "green" },
      ],
      edges: [
        { from: "PARSE", to: "CHUNK" },
        { from: "CHUNK", to: "EMB" },
        { from: "EMB", to: "STORE" },
        { from: "Q", to: "SEARCH" },
        { from: "SEARCH", to: "RERANK" },
        { from: "RERANK", to: "GEN" },
        { from: "STORE", to: "SEARCH", bend: 0 },
      ],
      show: [["PARSE", "CHUNK"], ["EMB", "STORE"], ["Q", "SEARCH"], ["RERANK", "GEN"]],
      beats: [
        {
          say: "The offline half runs whenever a document changes. Parse PDFs and wiki pages into clean text. Cut it into chunks, each with metadata: which document, which version, and who's allowed to see it.",
          term: { word: "Indexing", meaning: "parse, chunk, embed, store: done ahead of time" },
        },
        { say: "Embed every chunk, and store it in a vector index, and in a keyword index too, for exact codes." },
        { say: "The online half runs for every question. Embed the question with the same model. Search for the best twenty candidates, but only among chunks this user may see." },
        { say: "A reranker rereads those twenty, and keeps the best five. Then the model generates an answer, with citations.", tone: "key" },
      ],
    },
    {
      kind: "seq",
      title: "One question, step by step",
      actors: [
        { id: "U", name: "Employee", icon: "🧑‍💼" },
        { id: "A", name: "RAG service", icon: "⚙️", tone: "blue" },
        { id: "E", name: "Embedder", icon: "📍", tone: "purple" },
        { id: "V", name: "Vector index", icon: "🗄️", tone: "amber" },
        { id: "L", name: "LLM", icon: "🧠", tone: "green" },
      ],
      msgs: [
        { from: "U", to: "A", label: "parental leave weeks?", step: 0 },
        { from: "A", to: "E", label: "embed(question)", step: 1 },
        { from: "E", to: "A", label: "[0.12, −0.48, …]", step: 1, dash: true },
        { from: "A", to: "V", label: "top 20, groups ∋ user", step: 2, tone: "amber" },
        { from: "V", to: "A", label: "20 chunks", step: 2, dash: true },
        { from: "A", to: "A", label: "rerank → 5", step: 3 },
        { from: "A", to: "L", label: "rules + 5 chunks + question", step: 4, tone: "green" },
        { from: "L", to: "U", label: "“26 weeks” [hb-2026:4.2]", step: 5, tone: "green", dash: true },
      ],
      note: { step: 5, text: "stream the answer: people start reading at the first word", tone: "blue" },
      beats: [
        { say: "Here's the same thing as calls between services. The employee's question reaches the RAG service." },
        { say: "It's embedded, with the same model used for the documents." },
        { say: "The vector index returns the top twenty chunks, filtered to the groups this employee belongs to. Permissions are checked during search, never after." },
        { say: "The reranker keeps the best five." },
        { say: "The LLM gets the rules, the five chunks, and the question." },
        { say: "And the answer streams back, with a citation the employee can click to check. Streaming matters: people start reading at the first word, not the last.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "a2prompt",
      beats: [
        { say: "Inside that prompt, order matters. Instructions first. Answer only from the documents below. If they don't answer it, say so. Cite every passage you use." },
        { say: "Then the documents, each wrapped with an id, a title, and an updated date. The date lets the model prefer the newer of two passages that disagree." },
        { say: "And the question, last." },
        { say: "Fixed parts first, so prompt caching can reuse them. And remove near duplicate chunks, so one fact doesn't take five slots." },
        { say: "A typical budget is about four thousand tokens. When answers need more evidence, the fix is better chunks or better ranking. More chunks often make answers worse.", tone: "key" },
      ],
    },
    {
      kind: "compare",
      title: "Citations you can trust",
      cols: [
        { title: "Ask for structure", icon: "🧾", tone: "blue", items: ["structured output: answer + citations", "every claim names a chunk id"] },
        { title: "Check in code", icon: "🔍", tone: "amber", items: ["drop any id that wasn't retrieved", "the model can invent ids too"] },
        { title: "Check support", icon: "✅", tone: "green", items: ["a second call: is each sentence backed by its chunk?", "unsupported → removed, or “not found”"] },
      ],
      beats: [
        { say: "And citations need checking too. First, ask for structured output: an answer field, and a citations field." },
        { say: "Then, in code, drop any cited id that wasn't actually retrieved. Models can invent ids, just like they invent court cases." },
        {
          say: "Finally, a second model call checks each sentence: is it actually supported by the chunk it cites? If not, remove it, or say the answer wasn't found. That measures groundedness.",
          term: { word: "Groundedness", meaning: "every claim backed by retrieved text" },
        },
      ],
    },

    // ------------------------------------------------------------ 6
    { kind: "section", num: "6", title: "Keeping it fresh, and the numbers", beats: [{ say: "Documents change. The index has to keep up." }] },
    {
      kind: "custom",
      name: "a2update",
      beats: [
        { say: "The handbook goes from version three to version four. Parental leave changes from sixteen weeks to twenty six." },
        { say: "The classic bug: add the new chunks, and forget to delete the old ones. Now both versions are searchable, and answers mix them. Worse, a deleted or restricted document stays searchable. That's a data leak." },
        { say: "The fix: every chunk stores its document id and version. On an update, insert the new chunks, and delete every old chunk of that document, in both indexes, as one operation. Triggered by a webhook, or a nightly check of content hashes.", tone: "key" },
        { say: "Now the index holds version four only." },
        {
          say: "A bigger change, like a new embedding model, means rebuilding everything. Build the new index beside the old one, test it, switch queries over in one step, and keep the old one for rollback.",
          term: { word: "Blue-green re-index", meaning: "build beside the old index, then switch" },
        },
      ],
    },
    {
      kind: "numbers",
      title: "Napkin maths for the index",
      items: [
        { value: "50,000", label: "chunks", sub: "20M tokens ÷ 400 per chunk" },
        { value: "0.2 GB", label: "of vectors", sub: "1,024 numbers × 4 bytes each" },
        { value: "$0.40", label: "to embed everything", sub: "20M tokens at $0.02 per million" },
      ],
      footer: "embedding is cheap · generating answers is where the money goes",
      beats: [
        { say: "A quick estimate makes any design answer stronger. Three thousand documents, about twenty million tokens. At four hundred tokens per chunk: about fifty thousand chunks." },
        { say: "At a thousand and twenty four numbers, four bytes each, that's about zero point two gigabytes of vectors. It fits in memory on one machine." },
        { say: "And embedding all twenty million tokens costs about forty cents." },
        { say: "Embedding is cheap. Generating answers is where the money goes.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 7
    { kind: "section", num: "7", title: "When RAG is the wrong tool", beats: [{ say: "Interviewers rarely ask what is RAG. They ask: why RAG, and not something else?", tone: "ask" }] },
    {
      kind: "compare",
      title: "What is missing from the answer?",
      cols: [
        { title: "Facts it never saw", icon: "📚", tone: "green", items: ["large, changing, needs citations or per-user access", "use RAG"] },
        { title: "Small, fixed facts", icon: "📄", tone: "blue", items: ["fits in the prompt", "paste it all in, cache it"] },
        { title: "A behaviour", icon: "🎭", tone: "purple", items: ["format, tone, a narrow task", "prompt first, then fine-tune"] },
        { title: "Live data, or counts", icon: "📊", tone: "amber", items: ["leave balance, “how many…?”", "call a tool, or run SQL"] },
      ],
      footer: "“How many leave requests last month?” is a database query, not search",
      beats: [
        { say: "Ask what's missing from the answer. Facts the model never saw, that are large, changing, or need citations and per user access? That's RAG." },
        { say: "A small, fixed set of facts that fits in the prompt? Just paste it all in, and cache it. No retrieval needed." },
        { say: "A behaviour, like a format, a tone, or a narrow task? Prompting first, and fine tuning if that's not enough." },
        { say: "Live data, like my leave balance, or a count, like how many requests last month? Call a tool, or run a database query." },
        { say: "That last one is the trap. Search returns some leave documents. It can never count all the leave records.", tone: "key" },
      ],
    },
    {
      kind: "trap",
      myth: "The top model on the leaderboard will be the best one for us.",
      truth: "Test on your own questions. A smaller model, fine-tuned on your own question–passage pairs, can beat it on your data.",
      why: "Order of fixes for domain words: add keyword search, better chunk context, try other models, and fine-tune last, because then you own a model.",
      beats: [
        { say: "One last trap. The top model on the leaderboard will be the best one for us." },
        { say: "Often false. Leaderboard tasks aren't your documents. A smaller model, fine tuned on your own question and passage pairs, can beat it on your data.", tone: "key" },
        { say: "But fine tune last. First add keyword search, better chunk context, and try other models. Fine tuning means you own a model, and re-embed everything when it changes." },
      ],
    },

    // ------------------------------------------------------------ 8
    { kind: "section", num: "8", title: "Interview round", beats: [{ say: "Interview round.", tone: "excite" }] },
    {
      kind: "sayit",
      q: "Walk me through a RAG pipeline, end to end.",
      lines: [
        "Offline: parse documents, chunk them with metadata, embed each chunk, store in vector + keyword indexes.",
        "Updates replace a document's chunks atomically; model changes use a blue-green rebuild.",
        "Online: embed the question with the same model; retrieve the top ~20, filtered by permissions.",
        "Rerank to the best ~5; build the prompt: rules, chunks with ids and dates, question last.",
        "Generate with citations; verify cited ids and support; stream the answer.",
        "Measure retrieval and answers separately on a labelled question set.",
      ],
      beats: [
        { say: "Walk me through a RAG pipeline, end to end." },
        { say: "Offline: parse the documents, chunk them with metadata, embed each chunk, and store them in a vector index and a keyword index." },
        { say: "Updates replace a document's chunks in one operation. Model changes use a blue green rebuild." },
        { say: "Online: embed the question with the same model, and retrieve the top twenty or so, filtered by the user's permissions." },
        { say: "Rerank to the best five. Build the prompt: rules first, then chunks with ids and dates, and the question last." },
        { say: "Generate with citations, verify the cited ids and their support, and stream the answer." },
        { say: "And measure retrieval and answer quality separately, on a labelled set of real questions.", tone: "key" },
      ],
    },
    {
      kind: "drill",
      items: [
        { q: "Cosine similarity or dot product?", a: "Normalise vectors to length 1 and they're identical; then use the dot product, the cheapest." },
        { q: "How are embedding models trained?", a: "Contrastive learning on matching pairs: pull pairs together, push in-batch and hard negatives apart." },
        { q: "Why not embed whole documents?", a: "One vector averages every topic and matches none; chunks keep each point sharp." },
        { q: "What does chunk overlap buy you?", a: "A sentence cut at a boundary still appears whole in one neighbouring chunk." },
        { q: "What is parent-child retrieval?", a: "Search small child chunks for precision, then send their larger parent section for context." },
        { q: "Where do you enforce document permissions?", a: "As a filter inside the search, using metadata on every chunk; never after the answer." },
        { q: "“How many requests last month?” Use RAG?", a: "No. Search can't count all records; that's a database query or a tool." },
      ],
      beats: [
        { say: "Rapid fire. Cosine similarity, or dot product?", tone: "ask", hold: 2.5 },
        { say: "Normalise the vectors to length one, and they're identical. Then use the dot product, because it's cheapest." },
        { say: "How are embedding models trained?", tone: "ask", hold: 2.5 },
        { say: "Contrastive learning on matching pairs. Pull each pair together, and push in batch and hard negatives apart." },
        { say: "Why not embed whole documents?", tone: "ask", hold: 2.5 },
        { say: "One vector averages every topic, and matches none. Chunks keep each point sharp." },
        { say: "What does chunk overlap buy you?", tone: "ask", hold: 2.5 },
        { say: "A sentence cut at a boundary still appears whole, in one of the neighbouring chunks." },
        { say: "What is parent child retrieval?", tone: "ask", hold: 2.5 },
        { say: "Search small child chunks for precision, then send their larger parent section, for context." },
        { say: "Where do you enforce document permissions?", tone: "ask", hold: 2.5 },
        { say: "As a filter inside the search, using metadata stored on every chunk. Never after the answer is written." },
        { say: "Last one. How many requests last month: would you use RAG?", tone: "ask", hold: 2.5 },
        { say: "No. Search can't count all the records. That's a database query, or a tool.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "recap",
      props: {
        items: [
          ["📖", "RAG", "retrieve, then generate"],
          ["📍", "Embeddings", "meaning as nearby vectors"],
          ["🧲", "Contrastive training", "pairs pulled together"],
          ["✂️", "Chunking", "recursive by default; measure size"],
          ["🛠️", "Pipeline", "index offline, answer online"],
          ["🧭", "Right tool?", "RAG, prompt, tool, or SQL"],
        ],
      },
      beats: [
        { say: "Let's lock it in." },
        { say: "RAG means retrieve first, then generate from what you found." },
        { say: "Embeddings put similar meanings close together." },
        { say: "They're trained by pulling matching pairs together, and pushing negatives apart." },
        { say: "Chunk recursively by default, and measure the size on real questions." },
        { say: "Index offline. Answer online, with permissions, reranking and citations." },
        { say: "And always ask: is this RAG, a prompt, a tool, or a database query?", tone: "key" },
      ],
    },
    {
      kind: "pause",
      visual: "docs",
      question: "The company grows to 10 million chunks. Search slows down, error codes get missed, and filters empty the results. What would you change?",
      beats: [
        { say: "Version one works. Then the company grows to ten million chunks." },
        { say: "Search slows down. Exact error codes get missed. And permission filters sometimes leave no results at all. What would you change?", tone: "ask", hold: 3 },
      ],
    },
    {
      kind: "title",
      eyebrow: "Next",
      title: "Chapter 3 — Search fast, search well",
      subtitle: "HNSW, hybrid search and reranking",
      beats: [{ say: "That's chapter three. See you there.", tone: "excite" }],
    },
  ],
};
