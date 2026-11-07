import type { Chapter } from "../lib/types.ts";

// Chapter 4 of the AI Stack: when retrieval still fails, interview-ready. The
// running example is a company knowledge assistant over policies, runbooks
// and PDFs.

export const ch04: Chapter = {
  id: "ch04",
  title: "When retrieval still fails",
  voice: "en-US-AndrewMultilingualNeural",
  next: "Chapter 5 — From assistant to agent",
  scenes: [
    {
      kind: "custom",
      name: "a4hook",
      beats: [
        { say: "Search is fast and precise now. And answers still fail. Here's the inbox. One: it keeps failing after the update, what changed? There's nothing useful to search with." },
        { say: "Two: and in Germany? On its own, that means nothing." },
        { say: "Three: the right policy was found, and the answer still says sixteen weeks. The policy says twenty six." },
        { say: "And four: a PDF table that came out of the parser as a soup of numbers and page footers. Each failure has a standard fix, and interviewers love asking which one you'd reach for.", tone: "key" },
      ],
    },
    {
      kind: "title",
      eyebrow: "AI Stack · Chapter 4",
      title: "When retrieval still fails",
      subtitle: "fix the question, check the evidence, debug the pipeline",
      beats: [{ say: "Chapter four. When retrieval still fails." }],
    },
    {
      kind: "bullets",
      title: "By the end, you can answer",
      firstItemStep: 1,
      items: [
        { icon: "✍️", text: "How do you handle vague and follow-up questions?" },
        { icon: "🔁", text: "What is corrective RAG, and when is it worth it?" },
        { icon: "🩺", text: "The answer is wrong: how do you debug it?" },
        { icon: "📄", text: "Messy PDFs, long context, GraphRAG: when do they matter?" },
      ],
      beats: [
        { say: "By the end, you'll be able to answer these." },
        { say: "How to handle vague questions, and follow ups." },
        { say: "What corrective RAG is, and when it's worth the cost." },
        { say: "How to debug a wrong answer, step by step." },
        { say: "And when messy PDFs, long context, or GraphRAG come into play." },
      ],
    },

    // ------------------------------------------------------------ 1
    { kind: "section", num: "1", title: "Fix the question before searching", beats: [{ say: "Start with the question itself. Often, the search engine is fine. The question is a bad search query." }] },
    {
      kind: "custom",
      name: "a4multi",
      beats: [
        { say: "It keeps failing after the update, what changed? Search for that, and you get vague matches about updates in general." },
        {
          say: "Multi query: one extra model call writes three to five sharper rephrasings. App crashes after version four point two. Login error since the latest release. What changed in release four point two.",
          term: { word: "Multi-query", meaning: "search several rephrasings, merge the results" },
        },
        { say: "Each one is searched, and the lists are merged with reciprocal rank fusion. Now the release notes come back." },
        { say: "The cost: one more model call, before every search. So turn it on where your test questions show vague questions failing.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "a4hyde",
      beats: [
        { say: "A cleverer trick. Short questions and long answer paragraphs look different, even when they're about the same thing. How long do refunds take sits far from the real answer paragraphs." },
        {
          say: "So ask a model to write a plausible, fake answer. Refunds are usually processed within five to ten business days, and so on.",
          term: { word: "HyDE", meaning: "embed a fake answer instead of the question" },
        },
        { say: "Embed the fake answer instead of the question. Shaped like an answer, it lands right among the real ones. That's hypothetical document embeddings." },
        { say: "The risk: a confidently wrong fake answer pulls in the wrong documents.", tone: "key" },
      ],
    },
    {
      kind: "compare",
      title: "Three more ways to fix the question",
      cols: [
        { title: "Decomposition", icon: "🧩", tone: "blue", items: ["“compare UK and German leave”", "→ two questions, searched separately, then combined"] },
        { title: "Step-back", icon: "🔭", tone: "purple", items: ["also search a broader version", "the general rule comes back next to the detail"] },
        { title: "Routing", icon: "🔀", tone: "amber", items: ["policies, incidents, a database, or nowhere?", "a wrong route caps the answer: test the router"] },
      ],
      footer: "each costs latency: turn it on where tests show the failure",
      beats: [
        {
          say: "Three more. Decomposition: compare UK and German parental leave becomes two questions, searched separately, and answered together.",
          term: { word: "Decomposition", meaning: "split a multi-part question" },
        },
        { say: "Step back: also search a broader version of the question, so the general rule comes back next to the specific detail." },
        {
          say: "And routing: decide where the question should go at all. Policy documents, the incident archive, a database, or nowhere, for small talk. A wrong route caps the whole answer, so test the router on its own.",
          term: { word: "Routing", meaning: "choose the right source for a question" },
        },
        { say: "Every one of these costs latency. Use each only where your tests show the failure it fixes.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 2
    { kind: "section", num: "2", title: "Follow-ups and hidden filters", beats: [{ say: "Next, conversations." }] },
    {
      kind: "custom",
      name: "a4condense",
      beats: [
        { say: "What's the parental leave policy in the UK? Answered. Then: and in Germany? Search for that literally, and nothing relevant comes back." },
        {
          say: "The fix is condensing. Before searching, a model rewrites the latest message, together with the chat history, into one standalone question. What is the parental leave policy in Germany? Now search works.",
          term: { word: "Condensing", meaning: "rewrite a follow-up as a standalone question" },
        },
        { say: "Search uses the standalone question, but the answer still sees the chat, so it can say: unlike the UK, Germany... And skip the extra call when the message already stands alone." },
      ],
    },
    {
      kind: "custom",
      name: "a4selfquery",
      beats: [
        { say: "A related trick. Berlin incident reports from last week about outages. That's a meaning to search for, plus exact filters, hiding in one sentence." },
        {
          say: "Self query: a model splits it into search text, outages, and structured filters: city, type, and date, chosen from a list of allowed metadata fields. Filters run exactly. Meaning ranks what's left.",
          term: { word: "Self-query", meaning: "split a question into search text + filters" },
        },
        { say: "Validate every generated filter, because models invent fields. And a generated filter must never widen what the user is allowed to see.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 3
    { kind: "section", num: "3", title: "Corrective RAG", beats: [{ say: "Sometimes, even a good question gets weak search results. Could the system notice?", tone: "ask" }] },
    {
      kind: "flow",
      title: "Check the evidence before answering",
      cols: 4,
      rows: 2,
      nodeW: 340,
      nodeH: 140,
      nodes: [
        { id: "Q", c: 0, r: 0, label: "Question", tone: "blue" },
        { id: "S", c: 1, r: 0, label: "Search\nkeep the best set so far", tone: "blue" },
        { id: "G", c: 2, r: 0, label: "Grade each chunk\nsmall model: relevant?", tone: "purple" },
        { id: "A", c: 3, r: 0, label: "Answer\nfrom the evidence", tone: "green" },
        { id: "R", c: 1, r: 1, label: "Rewrite the query\ntries + 1", tone: "amber" },
        { id: "F", c: 3, r: 1, label: "Fallback\nbest set, or\n“I couldn't find it”", tone: "red" },
      ],
      edges: [
        { from: "Q", to: "S" },
        { from: "S", to: "G" },
        { from: "G", to: "A", label: "relevant" },
        { from: "G", to: "R", label: "weak, tries left" },
        { from: "R", to: "S" },
        { from: "G", to: "F", label: "no tries left" },
      ],
      show: [["Q", "S", "G"], ["A"], ["R"], ["F"]],
      beats: [
        {
          say: "Corrective RAG adds a grader after retrieval. A small, cheap model reads each chunk and answers, in structured output: relevant, yes or no?",
          term: { word: "Corrective RAG", meaning: "grade the evidence; retry or stop if weak" },
        },
        { say: "If the evidence is relevant, answer from it." },
        { say: "If it's weak, and tries are left, rewrite the query, and search again. Like a student who flips to a chapter and says: wrong chapter, let me look again." },
        { say: "And when no tries are left, stop. Answer from the best set seen so far, or say: I couldn't find this. Never an empty answer. Never an invented one. A counter, a step limit, and this fallback keep it from looping forever.", tone: "key" },
      ],
    },
    {
      kind: "compare",
      title: "Is the grader worth it?",
      cols: [
        { title: "Keep it if…", icon: "✅", tone: "green", items: ["retries rescue questions the first search missed", "measured on your test questions"] },
        { title: "Fix search if…", icon: "🔧", tone: "red", items: ["the grader fires on most questions", "then search itself is the problem"] },
        { title: "Related names", icon: "🏷️", tone: "purple", items: ["Self-RAG: decide to search, check the answer", "Agentic RAG: an agent searches when it wants"] },
      ],
      beats: [
        { say: "The grader adds a model call to every question, and retries roughly double latency. Keep it only if, on your test questions, retries rescue questions the first search missed." },
        { say: "If it fires on most questions, your search is the real problem. Fix that instead." },
        {
          say: "Related names you'll hear: self RAG, which decides whether to search at all and checks its own answer. And agentic RAG, where an agent calls search whenever it wants, across many sources. More flexible, harder to bound and test.",
          term: { word: "Agentic RAG", meaning: "an agent decides when and where to search" },
        },
      ],
    },

    // ------------------------------------------------------------ 4
    { kind: "section", num: "4", title: "Right document, wrong answer", beats: [{ say: "The hardest bug: search worked, and the answer is still wrong." }] },
    {
      kind: "custom",
      name: "a4trace",
      beats: [
        {
          say: "Guessing and editing the prompt is how teams lose weeks. You need the trace: a record of one question's whole journey. The rewritten query, every chunk with its score, what the reranker kept, the exact final prompt, the answer, and the time of each step.",
          term: { word: "Trace", meaning: "a record of every step for one request" },
        },
        { say: "Then walk backwards from the answer, checking each step. The answer: wrong. The final prompt..." },
        { say: "There it is. The prompt held two versions of the policy. Twenty twenty six says twenty six weeks. A twenty twenty three copy, never deleted, says sixteen. The model picked the wrong one.", tone: "key" },
      ],
    },
    {
      kind: "compare",
      title: "Two numbers split every failure",
      cols: [
        { title: "Low context recall", icon: "🔍", tone: "red", items: ["the needed facts weren't retrieved", "fix search or ingestion"] },
        { title: "Low faithfulness", icon: "🗣️", tone: "amber", items: ["facts retrieved, answer strays", "fix generation: prompt, model"] },
        { title: "Both high, still wrong", icon: "📚", tone: "purple", items: ["the documents are wrong or stale", "fix the data"] },
      ],
      beats: [
        {
          say: "One trace can be read by hand. A thousand need numbers. Context recall: did the retrieved chunks contain the facts the answer needed? If not, fix search or ingestion.",
          term: { word: "Context recall", meaning: "did retrieval bring the needed facts?" },
        },
        {
          say: "Faithfulness: is every claim in the answer supported by those chunks? If the facts were there and the answer strayed, fix generation.",
          term: { word: "Faithfulness", meaning: "is the answer backed by the chunks?" },
        },
        { say: "And if both are high, and the answer is still wrong, the documents themselves are wrong or out of date. Chapter eight computes these properly.", tone: "key" },
      ],
    },
    {
      kind: "chart",
      title: "Lost in the middle",
      type: "line",
      labels: ["1st", "5th", "10th", "15th", "20th"],
      xLabel: "position of the right document among 20",
      series: [{ name: "answer accuracy (shape from Liu et al., 2023)", values: [75, 57, 54, 56, 63], tone: "pink", step: 1 }],
      max: 100,
      unit: "%",
      note: { step: 2, text: "send fewer, better chunks · most relevant first" },
      beats: [
        { say: "And more text is not safer. Researchers put the one document containing the answer at different positions among twenty." },
        {
          say: "Accuracy was best when it came first, good when it came last, and worst in the middle. A U shape. That's the lost in the middle finding, and later studies on context rot point the same way: quality drops as inputs grow.",
          term: { word: "Lost in the middle", meaning: "models underuse text mid-prompt" },
        },
        { say: "So send fewer, better chunks, with the most relevant first.", tone: "key" },
      ],
    },
    {
      kind: "compare",
      title: "Conflicts and gaps are data problems",
      cols: [
        { title: "When documents disagree", icon: "⚖️", tone: "blue", items: ["every chunk: version, effective date, status", "superseded docs filtered out by default", "one owner document per policy; copies link to it", "two current docs disagree → say so, cite both"] },
        { title: "When evidence is missing", icon: "🕳️", tone: "amber", items: ["instruction + example: say you couldn't find it", "an answerable: true/false field first", "weak best score → don't generate at all", "keep unanswerable questions in the test set"] },
      ],
      beats: [
        { say: "Two data problems to fix in the data, not the prompt. When documents disagree: every chunk carries a version, an effective date, and a status. Superseded documents are filtered out by default. And each policy has one owner document." },
        { say: "When the evidence is missing and the model answers anyway, defend in layers. A clear instruction with an example. A structured answerable field before the answer. No generation at all when the best search score is weak. And unanswerable questions in your test set, checking that it declines. Declining too often is a failure too.", tone: "key" },
      ],
    },
    {
      kind: "trap",
      myth: "Fix a RAG bug by editing the prompt until the failing example passes.",
      truth: "That usually breaks other questions. Add the example to the test set, find the failure category, and fix the category.",
      beats: [
        { say: "The trap: fix a RAG bug by tweaking the prompt until the failing example passes." },
        { say: "That usually breaks other questions. Add the example to your test set, find its failure category, and fix the category.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 5
    { kind: "section", num: "5", title: "Messy documents: ingestion", beats: [{ say: "Now, the failure that happens before search ever runs." }] },
    {
      kind: "custom",
      name: "a4pdf",
      beats: [
        {
          say: "Most real RAG failures start at ingestion: turning documents into text. Here's a policy PDF: two columns, a table, a footer. A naive extractor reads straight across both columns.",
          term: { word: "Ingestion", meaning: "documents → clean text → chunks in the index" },
        },
        {
          say: "Columns interleaved. The table flattened into one line of numbers. The footer repeated forty times. And scanned PDFs are only pictures, so they need OCR, which brings its own errors.",
          term: { word: "OCR", meaning: "turns images of text into text" },
        },
        { say: "Layout aware parsers, like Docling or Unstructured, find columns, headings, and tables, and output clean Markdown. For awkward pages, some teams hand the page image to a vision model, and ask for Markdown.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "a4table",
      beats: [
        { say: "Tables hold many of the most asked facts, so treat them specially." },
        { say: "Write each row as its own chunk, with the column names repeated: parental leave, country UK, weeks twenty six, full pay. Add one summary chunk for overview questions." },
        { say: "And a five thousand row price list? Don't chunk it at all. Load it into a database, and answer with SQL.", tone: "key" },
      ],
    },
    {
      kind: "bullets",
      title: "Keep ingestion honest",
      firstItemStep: 1,
      items: [
        { icon: "🔑", text: "Fingerprint every document (hash)", sub: "skip unchanged; reprocess changed; deletions are urgent" },
        { icon: "🏷️", text: "Record the parser version per chunk", sub: "a parser upgrade reprocesses only what it affects" },
        { icon: "🧹", text: "Clean before indexing", sub: "headers, footers, menus out; personal data masked" },
        { icon: "🥇", text: "Golden documents", sub: "known-correct parsed output, checked on every parser change" },
      ],
      beats: [
        { say: "Four habits keep ingestion honest." },
        { say: "Fingerprint every document with a hash. Skip unchanged ones, reprocess changed ones, and treat deletions and access changes as urgent." },
        { say: "Record which parser version produced each chunk, so an upgrade reprocesses only what it affects." },
        { say: "Clean before indexing: strip headers, footers and menus, and mask personal data before it ever reaches the index." },
        { say: "And keep a few golden documents, whose correct parsed output is known, and check them on every parser change." },
      ],
    },
    {
      kind: "trap",
      myth: "The PDF loader handles it.",
      truth: "That assumption sits behind many failing RAG systems. Read the parsed text of your most important documents before tuning anything else.",
      beats: [
        { say: "So when someone says: the PDF loader handles it." },
        { say: "Read the parsed text of your most important documents, before tuning anything else. It's the cheapest win in RAG.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 6
    { kind: "section", num: "6", title: "When chunk search isn't the right shape", beats: [{ say: "Finally, three questions from an architecture review." }] },
    {
      kind: "trap",
      myth: "Models read a million tokens now. Skip retrieval and give them everything.",
      truth: "Every question pays for every token in money and latency, quality drops as inputs grow, permissions can't be enforced, and citations get harder.",
      why: "Long context fits a small, fixed corpus: load it once and let the provider cache it. That's cache-augmented generation (CAG).",
      beats: [
        { say: "One. Models read a million tokens now. Why not skip retrieval, and give them everything?" },
        { say: "Because every question pays for every token, in money and in waiting. Quality drops as inputs grow. A stuffed prompt can't hide documents a user isn't allowed to see. And citations come naturally from retrieval.", tone: "key" },
        {
          say: "Long context is right for a small, fixed corpus, like a forty page handbook. Load it once, and let the provider cache it. That's cache augmented generation.",
          term: { word: "CAG", meaning: "a small corpus kept in a cached prompt" },
        },
      ],
    },
    {
      kind: "custom",
      name: "a4graph",
      beats: [
        {
          say: "Two. Some questions defeat chunk search. GraphRAG, from Microsoft, uses an LLM to extract entities and relationships from every document, into a knowledge graph.",
          term: { word: "GraphRAG", meaning: "retrieve over an LLM-built knowledge graph" },
        },
        { say: "Multi hop questions, like: which vendors of Acme had security incidents? need following links. Acme, to vendor B, to incident twelve." },
        { say: "Whole corpus questions, like: what are the main complaint themes? live in no single chunk. GraphRAG groups the graph into communities, and summarizes each one." },
        { say: "But it's slow and costly to build, and hard to update. Use it when those question types really matter, and measure the gain.", tone: "key" },
      ],
    },
    {
      kind: "trap",
      myth: "How many incidents last week? Search will find them.",
      truth: "Search returns some incident documents; it can't count all of them. That's a database query, through a safe SQL tool.",
      beats: [
        { say: "And three: how many incidents last week? Search will find them." },
        { say: "Search returns some incident documents. It can never count all of them. That's a database query, through a safe SQL tool. Keep RAG for the why questions that follow.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 7
    { kind: "section", num: "7", title: "Interview round", beats: [{ say: "Interview round.", tone: "excite" }] },
    {
      kind: "sayit",
      q: "Your RAG system gives a wrong answer. How do you debug it?",
      lines: [
        "Pull the trace: query rewrite, retrieved chunks with scores, reranked set, final prompt, answer.",
        "Walk backwards: was the needed fact in the prompt? If not, check retrieval, then ingestion.",
        "If it was there, check faithfulness: conflicting versions, lost in the middle, prompt rules.",
        "At scale, split failures with context recall and faithfulness over a labelled set.",
        "Fix the failure category, add the case to the test set, and re-run everything.",
      ],
      beats: [
        { say: "Your RAG system gives a wrong answer. How do you debug it?" },
        { say: "Pull the trace: the rewritten query, retrieved chunks with scores, the reranked set, the final prompt, and the answer." },
        { say: "Walk backwards. Was the needed fact in the prompt? If not, check retrieval, and then ingestion." },
        { say: "If it was there, check faithfulness: conflicting versions, a fact lost in the middle, or the prompt's rules." },
        { say: "At scale, split failures with context recall and faithfulness, over a labelled question set." },
        { say: "Then fix the failure category, add the case to the test set, and re-run everything.", tone: "key" },
      ],
    },
    {
      kind: "drill",
      items: [
        { q: "“And in Germany?” returns nothing. Fix?", a: "Condense the chat into a standalone question before searching." },
        { q: "What is HyDE, and its risk?", a: "Embed a model-written fake answer instead of the question; a wrong fake answer retrieves wrong documents." },
        { q: "How does corrective RAG avoid looping forever?", a: "A tries counter, a hard step limit, and a fallback: best evidence so far, or “not found”." },
        { q: "What is “lost in the middle”?", a: "Models use facts at the start and end of a long prompt better than in the middle." },
        { q: "Context recall low, faithfulness high. Where's the bug?", a: "Retrieval or ingestion: the needed facts never reached the prompt." },
        { q: "How do you chunk a table?", a: "One chunk per row with headers repeated, plus a summary chunk; huge tables go in a database." },
        { q: "When does GraphRAG help?", a: "Multi-hop and whole-corpus questions, like themes across thousands of documents." },
      ],
      beats: [
        { say: "Rapid fire. And in Germany, returns nothing. What's the fix?", tone: "ask", hold: 2.5 },
        { say: "Condense the chat into a standalone question, before searching." },
        { say: "What is HyDE, and what's its risk?", tone: "ask", hold: 2.5 },
        { say: "Embed a model written fake answer, instead of the question. A wrong fake answer retrieves the wrong documents." },
        { say: "How does corrective RAG avoid looping forever?", tone: "ask", hold: 2.5 },
        { say: "A tries counter, a hard step limit, and a fallback: the best evidence so far, or not found." },
        { say: "What is lost in the middle?", tone: "ask", hold: 2.5 },
        { say: "Models use facts at the start and end of a long prompt better than facts in the middle." },
        { say: "Context recall is low, faithfulness is high. Where's the bug?", tone: "ask", hold: 2.5 },
        { say: "Retrieval, or ingestion. The needed facts never reached the prompt." },
        { say: "How do you chunk a table?", tone: "ask", hold: 2.5 },
        { say: "One chunk per row with the headers repeated, plus a summary chunk. Huge tables go in a database." },
        { say: "Last one. When does GraphRAG help?", tone: "ask", hold: 2.5 },
        { say: "Multi hop questions, and whole corpus questions, like themes across thousands of documents.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "recap",
      props: {
        items: [
          ["✍️", "Fix the question", "multi-query, HyDE, routing"],
          ["↩️", "Condense", "follow-ups → standalone"],
          ["🔁", "Corrective RAG", "grade, retry, fall back"],
          ["🩺", "Debug with traces", "walk backwards"],
          ["📄", "Ingestion", "parse layout, rows as chunks"],
          ["🧭", "Right shape?", "CAG, GraphRAG, or SQL"],
        ],
      },
      beats: [
        { say: "Let's lock it in." },
        { say: "Fix the question first: multi query, HyDE, decomposition, routing." },
        { say: "Condense follow ups into standalone questions." },
        { say: "Corrective RAG grades the evidence, retries, and falls back honestly." },
        { say: "Debug with traces, walking backwards from the answer." },
        { say: "Parse layout properly, and treat table rows as chunks." },
        { say: "And ask whether the question needs CAG, GraphRAG, or a database instead.", tone: "key" },
      ],
    },
    {
      kind: "pause",
      question: "“What's my leave balance?” “Reset my VPN.” “Book the meeting room.” No document can answer these. What does the assistant need?",
      beats: [
        { say: "And now, a different kind of request arrives." },
        { say: "What's my leave balance? Reset my VPN. Book the meeting room. No document can answer these. What does the assistant need?", tone: "ask", hold: 3 },
      ],
    },
    {
      kind: "title",
      eyebrow: "Next",
      title: "Chapter 5 — From assistant to agent",
      subtitle: "tools, the agent loop, LangGraph",
      beats: [{ say: "That's chapter five. See you there.", tone: "excite" }],
    },
  ],
};
