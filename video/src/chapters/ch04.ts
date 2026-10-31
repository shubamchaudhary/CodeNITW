import type { Chapter } from "../lib/types.ts";

// Chapter 4 (src/Data/aiStackDocs/CH-04.md): four failures that survive good
// search, each breaking at a different place in the pipeline.

export const ch04: Chapter = {
  id: "ch04",
  title: "When retrieval still fails",
  voice: "en-US-AndrewMultilingualNeural",
  next: "Chapter 5 — From assistant to agent",
  scenes: [
    {
      kind: "custom",
      name: "cardlist",
      props: {
        title: "Meera's inbox, this week",
        items: [
          ["❓", "“it keeps failing after the update, what changed?”", "an answer built from noise"],
          ["↩️", "“and for bakery?”", "right after a dairy question: nothing found"],
          ["❌", "“48 hours”, with a confident citation", "the policy says 12"],
          ["📄", "answers inside PDF tables", "fail far more than the rest"],
        ],
      },
      beats: [
        { say: "Search is fast and accurate now. And Meera, who runs support, still forwards you four kinds of failure." },
        { say: "A vague question gets an answer built from noise." },
        { say: "A follow-up, and for bakery, finds nothing at all." },
        { say: "A confident citation, with the wrong number." },
        { say: "And anything that lives inside a PDF table keeps failing.", tone: "key" },
      ],
    },
    {
      kind: "title",
      eyebrow: "AI Stack · Chapter 4",
      title: "When retrieval still fails",
      subtitle: "better questions, self-checking, messy documents",
      beats: [{ say: "Chapter four. When retrieval still fails." }],
    },
    {
      kind: "custom",
      name: "wheremap",
      beats: [
        { say: "Here's the habit that saves weeks. Before fixing anything, find where it breaks.", tone: "key" },
        { say: "The vague question and the follow-up break right here, at the question. The search engine is fine. The question is a bad search query." },
        { say: "Sometimes search itself comes back weak." },
        { say: "The wrong number breaks after search. The right document arrived, and the answer still went wrong." },
        { say: "And the PDF tables? They broke before anyone asked anything. In the documents.", tone: "excite" },
      ],
    },

    // ------------------------------------------------------------ 1
    { kind: "section", num: "1", title: "Fix the question first", beats: [{ say: "So let's start at the question." }] },
    {
      kind: "custom",
      name: "rewrite",
      beats: [
        { say: "It keeps failing after the update. What changed? There's nothing here to search with. No product, no code, no date. So search returns noise." },
        {
          say: "The fix is one extra model call before searching. Ask a model to rewrite the question three ways, each one sharp. This is called multi query.",
          term: { word: "Multi-query", meaning: "rewrite one vague question into several sharp ones" },
        },
        { say: "Search each one, then merge the lists with rank fusion, the trick from chapter three." },
        { say: "A two part question gets the opposite treatment. Compare the Pune and Bengaluru slot rules becomes two questions, searched separately, then combined." },
        { say: "Every rewrite costs a call and some waiting. So switch each one on only where your test questions show that failure.", tone: "aside" },
      ],
    },
    {
      kind: "custom",
      name: "hyde",
      beats: [
        { say: "Here's a stranger trick. On the meaning map, answers live in one neighbourhood. Long paragraphs that explain things." },
        { say: "But a question is short, and shaped like a question. It lands far away from the answers it's looking for." },
        {
          say: "So ask a model to write a fake answer first. Then search with the fake. A paragraph shaped like an answer lands right next to the real answers.",
          tone: "excite",
          term: { word: "HyDE", meaning: "search with a made-up answer, not the question" },
        },
        { say: "The risk: a confidently wrong fake answer pulls in the wrong documents.", tone: "aside" },
      ],
    },
    {
      kind: "custom",
      name: "condense",
      beats: [
        { say: "Now the follow-up. What is the refund window for dairy? Answered. Then: and for bakery?" },
        { say: "Search that, on its own, and you get nothing. And for bakery means something only next to the conversation.", tone: "key" },
        {
          say: "So before searching, a model rewrites the last message into a standalone question, using the chat. What is the refund window for bakery? This is called condensing.",
          term: { word: "Condensing", meaning: "turn a follow-up into a standalone question" },
        },
        { say: "Search uses only the rewrite. But the answer still sees the whole chat, so it can say: unlike dairy, bakery is twelve hours.", tone: "aside" },
      ],
    },

    // ------------------------------------------------------------ 2
    { kind: "section", num: "2", title: "Check the evidence first", beats: [{ say: "Next: when search itself comes back weak." }] },
    {
      kind: "custom",
      name: "corrective",
      beats: [
        { say: "Sometimes none of the five chunks really answers the question. And right now, the model answers from them anyway.", tone: "ask" },
        { say: "A good student doesn't do that. They flip to the chapter, read it, and say: wrong chapter. Let me look again." },
        {
          say: "So add a grader after search. A small, cheap model checks: do these chunks answer it? If yes, answer. If not, rewrite the question, and search again. This is corrective RAG.",
          term: { word: "Corrective RAG", meaning: "grade the evidence; if weak, rewrite and search again" },
        },
        { say: "Three brakes stop it looping forever. A tries counter. A hard step limit. And a fallback: answer from the best chunks seen so far, or say, I could not find this." },
        { say: "Never an empty answer. Never an invented one.", tone: "key" },
        { say: "And measure it. If the grader fires on most questions, your search is the real problem. If it rarely changes an answer, delete it.", tone: "aside" },
      ],
    },

    // ------------------------------------------------------------ 3
    { kind: "section", num: "3", title: "Right document, wrong answer", beats: [{ say: "Now the strangest one. The wrong number.", tone: "excite" }] },
    {
      kind: "custom",
      name: "backwards",
      beats: [
        { say: "Bakery refunds, forty eight hours, with a citation. Search found the right policy. The grader said relevant. The policy says twelve. So where did it go wrong?", tone: "ask" },
        { say: "Most teams start editing the prompt and hoping. That's how weeks disappear. Instead, walk backwards, with evidence.", tone: "key" },
        {
          say: "The evidence is a trace. For every question, a record of the rewritten query, every chunk found and its score, the exact final prompt, and the answer.",
          term: { word: "Trace", meaning: "the full record of one question's journey" },
        },
        { say: "Then walk it backwards. Was the right document indexed? Yes. Was it in the results? Yes. Did it reach the prompt? Yes. So the problem is in the answer step." },
        { say: "And there it is. The prompt held two bakery chunks. Today's policy, twelve hours. And a twenty twenty three version, forty eight hours, that nobody ever deleted.", tone: "excite" },
        { say: "The fix lives in the data, not the prompt. Every chunk carries a version and a status, and superseded documents are filtered out.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "lostmiddle",
      beats: [
        { say: "While we're here: more text in the prompt is not safer." },
        {
          say: "Models use what's at the start and the end of a long prompt best. Put the answer in the middle, and accuracy drops. It's called lost in the middle.",
          term: { word: "Lost in the middle", meaning: "models miss facts buried mid-prompt" },
        },
        { say: "So send fewer, better chunks. And put the best one first.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 4
    { kind: "section", num: "4", title: "Messy documents", beats: [{ say: "Last one: the PDF tables." }] },
    {
      kind: "custom",
      name: "shred",
      beats: [
        { say: "Refund questions fail three times more than others. Look at what search actually sees. Dairy twenty four, bakery twelve, frozen six, photo, photo, none. Page seven.", tone: "ask" },
        { say: "Here's the page. Two columns, a table, a footer. The first parser read straight across both columns, flattened the table into one line, and kept the footer, forty times." },
        { say: "Search can only ever be as good as this text.", tone: "key" },
        { say: "So parse with layout. Find the columns, headings and tables, and write every table row as its own sentence, with the column names repeated." },
        { say: "Scanned pages need OCR, which turns pictures of text into text, with its own typos. And very large tables belong in a database, not in chunks.", tone: "aside" },
      ],
    },
    {
      kind: "flow",
      title: "Before search: ingestion",
      cols: 4,
      rows: 2,
      nodeW: 360,
      nodeH: 140,
      nodes: [
        { id: "S", c: 0, r: 0, label: "Wiki, PDFs,\ntickets" },
        { id: "P", c: 1, r: 0, label: "Parse with layout:\ncolumns, tables" },
        { id: "CL", c: 2, r: 0, label: "Clean: no footers,\nmask phone numbers" },
        { id: "CH", c: 3, r: 0, label: "Chunk +\nversion, status", tone: "amber" },
        { id: "E", c: 3, r: 1, label: "Embed + index", tone: "green" },
        { id: "Q", c: 1.5, r: 1, label: "Read samples of the\nparsed text", tone: "purple" },
      ],
      edges: [
        { from: "S", to: "P" },
        { from: "P", to: "CL" },
        { from: "CL", to: "CH" },
        { from: "CH", to: "E" },
        { from: "E", to: "Q" },
      ],
      show: [["S", "P", "CL"], ["CH", "E"], ["Q"]],
      beats: [
        {
          say: "Everything between a document existing somewhere, and its chunks sitting in the index, is called ingestion. Parse, clean, and drop the footers.",
          term: { word: "Ingestion", meaning: "turning raw documents into clean, indexed chunks" },
        },
        { say: "Then chunk, with the version and status attached, and index." },
        { say: "And before tuning anything else, read the parsed text of your most important documents. Many failing systems never did.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "recap",
      props: {
        items: [
          ["🔀", "Multi-query", "one vague question → several sharp ones"],
          ["🪞", "HyDE", "search with a fake answer"],
          ["↩️", "Condensing", "follow-up → standalone question"],
          ["🧑‍🎓", "Corrective RAG", "grade, retry, fall back"],
          ["🧾", "Trace", "walk backwards with evidence"],
          ["📄", "Ingestion", "parse well before searching"],
        ],
      },
      beats: [
        { say: "Let's lock it in." },
        { say: "Multi query turns one vague question into several sharp ones." },
        { say: "HyDE searches with a fake answer." },
        { say: "Condensing turns a follow-up into a standalone question." },
        { say: "Corrective RAG checks the evidence, and retries before answering." },
        { say: "A trace lets you walk a wrong answer backwards." },
        { say: "And ingestion decides how good search can ever be.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "cardlist",
      props: {
        title: "Then the questions change",
        items: [
          ["📦", "“Where is order FC-20931 right now?”", "live data, not a document"],
          ["🥛", "“Is there milk in the Kothrud warehouse?”", "live stock"],
          ["💸", "“Issue a 150 rupee credit to this customer.”", "not a question: an action"],
        ],
        pause: "The model only writes text. How could it look up an order, or issue a credit?",
      },
      beats: [
        { say: "Ask FreshCart now answers policy questions well, and admits when it can't. Then the questions change." },
        { say: "Where is order F C two zero nine three one, right now?" },
        { say: "Is there milk in the Kothrud warehouse?" },
        {
          say: "And: the milk was spoiled. Issue a hundred and fifty rupee credit. That's not even a question. None of these answers lives in any document. The model only writes text. So how could it look up an order? Or issue a credit?",
          tone: "ask",
          hold: 3,
        },
      ],
    },
    {
      kind: "title",
      eyebrow: "Next",
      title: "Chapter 5 — From assistant to agent",
      subtitle: "tools, structured output, the agent loop",
      beats: [{ say: "That's chapter five. See you there.", tone: "excite" }],
    },
  ],
};
