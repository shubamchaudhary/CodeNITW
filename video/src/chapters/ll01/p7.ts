import type { Scene } from "../../lib/types.ts";
import { B, arch, sec } from "./h.ts";
import { check } from "./k.ts";
import { GRAPH1, GRAPH2 } from "./diagrams.ts";

// Part 7: Graph 1 (ingest-time incidents with an LLM-as-judge loop), hybrid
// search with RRF, and Graph 2 (query-time corrective RAG with citations).
export const p7: Scene[] = [
  // ------------------------------------------------------------ 19
  sec("19", "Graph 1: incidents, with an LLM-as-judge loop", "Topic nineteen. The ingest time graph. Findings go in. Incidents with judged stories, and the report, come out."),
  {
    kind: "seq",
    title: "How Graph 1 gets started",
    actors: [
      { id: "lane", name: "Enrich lane", icon: "🛣" },
      { id: "pg", name: "Postgres", icon: "🐘" },
      { id: "java", name: "Java API", icon: "☕" },
      { id: "py", name: "Python · LangGraph", icon: "🐍" },
    ],
    msgs: [
      { from: "lane", to: "pg", label: "enriched_windows += 1 (each item)", step: 1 },
      { from: "lane", to: "pg", label: "claim: enriched >= total → CORRELATING", step: 2, tone: "green" },
      { from: "java", to: "py", label: "POST /analyze/{session_id}", step: 3 },
      { from: "py", to: "java", label: "202 Accepted · graph runs in the background", step: 4, dash: true },
      { from: "py", to: "pg", label: "incidents · report · status DONE", step: 5, tone: "green" },
    ],
    beats: B(
      "First, how Graph one gets started. Four actors: the enrichment lane, Postgres, the Java API, and the Python orchestrator.",
      "Every committed work item bumps the session's enriched windows counter.",
      "The same counter and claim pattern as the finalizer. When enriched reaches the total, one caller wins, and the session moves to correlating.",
      "The Java side calls the Python orchestrator: post analyze, with the session ID.",
      "Python answers two oh two accepted, and runs the graph in the background.",
      "The graph writes the incidents and the report into Postgres, and sets the status to done. The UI watches that status over server sent events.",
    ),
  },
  {
    kind: "bullets",
    title: "LangGraph in four words",
    items: [
      { icon: "🗃", text: "State", sub: "a typed dict passed between nodes: session, findings, metrics, clusters, current cluster, attempt, incidents, report" },
      { icon: "🔵", text: "Nodes", sub: "plain functions: read the state, return updates" },
      { icon: "↪", text: "Conditional edges", sub: "pick the next node from the state: this is what makes a loop" },
      { icon: "🛑", text: "Recursion limit", sub: "a hard cap on steps: sized as 12 + findings × 7 here" },
    ],
    beats: B(
      { say: "LangGraph in four words. State is a typed dictionary passed between nodes. Here: the session, its findings and metrics, the clusters, the current cluster, the attempt number, the incidents, and the report.", term: { word: "Graph state", meaning: "the typed dict every node reads and updates" } },
      "Nodes are plain functions. They read the state and return updates.",
      { say: "Conditional edges look at the state and pick the next node. That's what makes a loop possible.", term: { word: "Conditional edge", meaning: "chooses the next node from the state" } },
      "And the recursion limit is a hard cap on steps, so a loop can never run forever. Here it's sized from the data: twelve, plus seven per finding.",
    ),
  },
  arch(
    GRAPH1,
    [
      { all: true },
      { t: "load", b: "Read the session's findings and top metrics from Postgres.", nodes: ["load"], edges: [] },
      { t: "cluster, in code", b: "Same category, time ranges within 300 seconds: one cluster. Plain Python, no LLM.", m: "the model can't invent groupings", nodes: ["load", "cluster"], edges: ["a"] },
      { t: "correlate", b: "The LLM writes {narrative, root_cause} for one cluster.", m: "llama-3.3-70b-versatile", nodes: ["cluster", "correlate"], edges: ["b"] },
      { t: "ground_check: the judge", b: "A second prompt answers {grounded, reason}, comparing the story with that cluster's findings.", nodes: ["correlate", "ground"], edges: ["c"] },
      { t: "Loop, with a hard cap", b: "Not grounded and attempts left: write it again. At most 3 attempts; the last is kept, stored grounded = false with the reason.", m: "MAX_CORRELATE_ATTEMPTS = 3", nodes: ["ground", "correlate"], edges: ["no"] },
      { t: "Next cluster", b: "Accepted: move to the next cluster and correlate again.", nodes: ["ground", "correlate"], edges: ["next"] },
      { t: "Write it down", b: "Incidents are saved with the judge's verdict and reason; the report gets an exact metrics table from SQL.", m: "status DONE", nodes: ["ground", "write", "compose", "save"], edges: ["done", "e", "f"] },
    ],
    B(
      "Here's Graph one.",
      "Load reads the session's findings and its top metrics from Postgres.",
      { say: "Cluster is plain Python, no LLM. Findings with the same category whose time ranges are within three hundred seconds form one cluster. Grouping is a fact about time and category, so code does it, and the model can't invent connections.", tone: "key" },
      "Correlate asks the LLM for a narrative and a root cause for one cluster, as JSON.",
      { say: "Ground check is the judge. A second prompt answers: is this story grounded, true or false, with a reason, by comparing the story against that cluster's findings.", term: { word: "LLM-as-judge", meaning: "a second prompt grades the first one's output" } },
      { say: "If it isn't grounded and attempts are left, the conditional edge loops back to correlate, which writes it again. At most three attempts. The last one is kept, but stored with grounded false and the judge's reason, visible to the user. That's the groundedness loop on your resume.", tone: "key" },
      "When a story is accepted, the edge moves on to the next cluster.",
      "When every cluster is done, write the incidents with the verdict and reason, compose the report with an exact metrics table straight from SQL, save it, and set the status to done.",
    ),
    "Graph 1: graph_analyze.py",
  ),
  {
    kind: "code",
    title: "ground_check: the loop's decision",
    lang: "python",
    code: `verdict = llm.chat_json_object(prompts.GROUND_CHECK_SYSTEM,
                               prompts.ground_check_user(cluster, narrative, root_cause),
                               ("grounded",))
grounded = verdict.get("grounded") in (True, "true", "True")
last_attempt = attempt + 1 >= config.MAX_CORRELATE_ATTEMPTS     # 3
if grounded or last_attempt:
    incident = {..., "grounded": grounded, "judge_reason": reason}  # stored, visible
    # → next cluster
else:
    # → back to correlate, attempt + 1`,
    highlight: [[1, 3], [4, 4], [5, 7], [9, 10]],
    beats: B(
      "In code. The judge is called with a JSON contract that must contain grounded.",
      "The verdict is read defensively: true, or the string true.",
      { say: "If it's grounded, or this was the last attempt, the incident is kept, with grounded and the judge's reason stored. A force accepted story is never hidden. It's marked.", tone: "key" },
      "Otherwise, back to correlate, with the attempt counter plus one.",
    ),
  },
  {
    kind: "compare",
    title: "Checking the story: the alternatives",
    cols: [
      { title: "No check", icon: "🙈", tone: "red", items: ["one shot at the story", "an unsupported cause ships as fact", "nothing to show the user"] },
      { title: "Self-critique in the same prompt", icon: "🪞", tone: "amber", items: ["the writer grades itself, in one pass", "it tends to agree with itself", "no separate verdict to store"] },
      { title: "A separate judge, in a capped loop ✓", icon: "🧑‍⚖️", tone: "green", items: ["an independent verdict + reason", "rewrite up to 3 times", "the verdict is stored and shown"] },
    ],
    footer: "and say the limit: a judge is a filter, not a proof; calibrate it against human labels",
    beats: B(
      "Defend the loop. No check: one shot at the story, and an unsupported root cause ships as fact.",
      "Self critique inside the same prompt: the writer grades itself in one pass, tends to agree with itself, and there's no separate verdict to store.",
      "A separate judge in a capped loop: an independent verdict with a reason, up to three rewrites, and the verdict is stored and shown to the user.",
      { say: "And say the limit before they do. A judge is another probabilistic model. It's a filter, not a proof. You'd calibrate it against human labels, and topic twenty six shows how.", tone: "key" },
    ),
  },
  check({
    topic: "Graph 1",
    q: "Why is clustering done in plain Python and not by the LLM?",
    options: ["Python is faster than Groq", "Grouping by category and time overlap is a fact code can compute; a model costs tokens and can invent connections", "LangGraph can't call an LLM in a loop", "The judge does the clustering"],
    answer: 1,
    a: "Same category and time ranges within 300 s are facts. Code computes them exactly and for free; asking a model to group findings costs tokens and can invent links.",
    aSay: "B. Same category and time ranges within three hundred seconds are facts. Code computes them exactly and for free. Asking a model to group findings costs tokens, and it can invent connections that aren't there.",
  }),
  check({
    topic: "Graph 1",
    q: "The judge rejects a cluster's story three times. What happens?",
    a: "The loop stops (MAX_CORRELATE_ATTEMPTS = 3). The third story is kept, stored with grounded = false and the judge's reason, so the user sees it was not verified.",
    aSay: "The loop stops at three attempts. The third story is kept, but stored with grounded false and the judge's reason, so the user can see it wasn't verified. The loop is bounded, and nothing is hidden.",
  }),

  // ------------------------------------------------------------ 20
  sec("20", "Hybrid search: vector + full text", "Topic twenty. Retrieval. Two searches over the same chunk table, fused by rank. This is the search every answer stands on."),
  {
    kind: "compare",
    title: "Two kinds of search, two kinds of miss",
    cols: [
      { title: "Vector (embeddings)", icon: "🧭", tone: "blue", items: ["good at meaning: \"throttled\" ≈ \"rate limited\"", "weak at exact tokens", "HNSW index, cosine distance"] },
      { title: "Full text", icon: "🔤", tone: "amber", items: ["good at exact tokens: ORA-01555, status=429", "weak at paraphrase", "GIN index on content_tsv, 'simple' config"] },
    ],
    footer: "logs are full of exact tokens, so full text matters more here than in prose RAG",
    beats: B(
      { say: "Two kinds of search, and each misses differently. Vector search, over the embeddings, is good at meaning. Throttled is close to rate limited. But it's weak at exact tokens, like an error code.", term: { word: "Hybrid search", meaning: "vector + full text, results fused" } },
      { say: "Full text is the opposite. Exact tokens like O R A oh one five five five, or status equals four two nine. Weak at paraphrase. It uses the gin index on the stored text vector, with the simple configuration: no stemming, no stop words, because log tokens shouldn't be stemmed.", tone: "key" },
      { say: "And logs are full of exact tokens. So full text matters more here than it does in ordinary document RAG.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "The two legs, over one session's table",
    lang: "sql",
    code: `-- vector leg: HNSW, cosine distance
SELECT chunk_id, line_start, line_end
FROM   log_chunks_s_7f3a
ORDER  BY embedding <=> :question_vector
LIMIT  30;

-- full-text leg: GIN on the stored tsvector, terms ORed
SELECT chunk_id, line_start, line_end
FROM   log_chunks_s_7f3a
WHERE  content_tsv @@ to_tsquery('simple', 'upstream | provider | throttled | payment')
ORDER  BY ts_rank(content_tsv, query) DESC
LIMIT  30;`,
    highlight: [[1, 5], [4, 4], [7, 12], [10, 10]],
    beats: B(
      "Both legs run over the same session's table. The vector leg: order by the embedding's cosine distance to the question's vector, top thirty. The H N S W index answers that.",
      "The angle bracket, equals, angle bracket operator is P G vector's cosine distance.",
      "The full text leg: rows whose stored text vector matches the query, ranked by T S rank, top thirty.",
      { say: "And notice the terms are ORed. A question like which upstream provider throttled payment requests becomes upstream, or provider, or throttled, or payment. Requiring every word would match almost nothing in a log line.", tone: "key" },
    ),
  },
  {
    kind: "custom",
    name: "dllrrf",
    beats: B(
      "Now fuse them. Two ranked lists of chunks: the vector leg on the left, the full text leg on the right.",
      { say: "Reciprocal Rank Fusion. Each list adds one over sixty plus the chunk's rank, with ranks counted from zero. Only ranks. Never the raw scores, because cosine distance and T S rank are in different units, and adding them would need a normalisation that changes with every corpus.", term: { word: "RRF", meaning: "score = Σ 1 / (k + rank), k = 60" } },
      "Chunk A is first in the vector list and fourth in full text. One over sixty, plus one over sixty three: nought point oh three two five.",
      "Chunk C is second and fifth: nought point oh three two. Agreement between the two lists again.",
      { say: "Chunk B is first in full text, but missing from the vector list. Just one over sixty: nought point oh one six seven. So A and C beat B. Agreement between lists beats being top of one.", tone: "key" },
      "The fused order: A, C, B, G, D. That's what the grader in Graph two reads.",
    ),
  },
  {
    kind: "numbers",
    title: "What hybrid search measured",
    items: [
      { value: "0.757", label: "recall@10, hybrid", sub: "vector alone: 0.393", tone: "green" },
      { value: "0.874", label: "recall@30, hybrid", sub: "the 30 the grader reads", tone: "blue" },
      { value: "36 ms", label: "p50 latency", sub: "p95: 45 ms", tone: "amber" },
    ],
    footer: "51 answerable questions, gold lines computed by code (topic 25)",
    beats: B(
      "And the numbers. Recall at ten for hybrid: nought point seven five seven. Vector alone: nought point three nine three.",
      "Recall at thirty: nought point eight seven four. Thirty is what matters most, because the grader reads exactly thirty chunks.",
      "Thirty six milliseconds at the median, forty five at p ninety five.",
      "Measured on fifty one answerable questions whose gold lines were computed by code. Topic twenty five shows how.",
    ),
  },
  {
    kind: "compare",
    title: "Retrieval: the alternatives",
    cols: [
      { title: "Vector only", icon: "🧭", tone: "red", items: ["misses exact error codes", "recall@10 0.393 here", "long windows average away the one line"] },
      { title: "Weighted score sum", icon: "➕", tone: "amber", items: ["needs scores in one unit", "normalisation shifts per corpus", "weights to tune and re-tune"] },
      { title: "Hybrid + RRF ✓", icon: "🔀", tone: "green", items: ["ranks only: no units to reconcile", "k = 60, one constant, not tuned", "recall@10 0.757"] },
    ],
    footer: "the argument: two searches that fail differently, fused by rank",
    beats: B(
      "Defend it. Vector only misses exact error codes, and on long windows one embedding averages away the single line you need.",
      "A weighted sum of scores needs both scores in one unit, a normalisation that shifts with every corpus, and weights to keep tuning.",
      "Hybrid with RRF: ranks only, nothing to reconcile, one constant from the original paper, sixty, and recall at ten of nought point seven six.",
      { say: "Your line: two searches that fail differently, fused by rank.", tone: "key" },
    ),
  },
  check({
    topic: "RRF",
    q: "Chunk X is rank 0 in the vector list only. Chunk Y is rank 1 in both lists. Which ranks higher after RRF (k = 60)?",
    options: ["X: 1/60 beats everything", "Y: 1/61 + 1/61 ≈ 0.0328 > 1/60 ≈ 0.0167", "They tie", "It depends on the cosine scores"],
    answer: 1,
    a: "Y. 1/61 + 1/61 ≈ 0.0328, against 1/60 ≈ 0.0167 for X. Agreement between the lists beats being top of one.",
    aSay: "B. Y. One over sixty one, twice, is about nought point oh three two eight. X gets one over sixty, about nought point oh one six seven. Agreement between the two lists beats being top of one.",
  }),

  // ------------------------------------------------------------ 21
  sec("21", "Graph 2: corrective RAG, citing exact lines", "Topic twenty one. The query time graph. Retrieve, grade, rewrite, re retrieve. And how a citation becomes exact log lines."),
  {
    kind: "bullets",
    title: "First, a router: three tiers of question",
    items: [
      { icon: "🔢", text: "\"How many / between when?\" → SQL", sub: "over log_metrics: exact, no LLM" },
      { icon: "📋", text: "\"What's the summary?\" → the stored report", sub: "already written by Graph 1: no LLM" },
      { icon: "❓", text: "\"Why / what happened?\" → corrective RAG", sub: "Graph 2, with citations" },
    ],
    beats: B(
      "First, not every question needs RAG. Counts and time ranges go straight to SQL over log metrics. Exact, and no LLM.",
      "A summary question gets the stored report, which Graph one already wrote.",
      { say: "Only the why and what happened questions go to corrective RAG. The right tool for each question, and the expensive one last.", tone: "key" },
    ),
  },
  arch(
    GRAPH2,
    [
      { all: true },
      { t: "retrieve", b: "Embed the question (full-text only if embedding fails), fetch the hybrid top 30.", nodes: ["q", "retrieve"], edges: ["a"] },
      { t: "grade", b: "One LLM call over the retrieved chunks returns {relevant_ids}.", nodes: ["retrieve", "grade"], edges: ["b"] },
      { t: "rewrite, on a budget", b: "Nothing relevant and fewer than 2 rewrites: rewrite the question and retrieve again.", m: "MAX_REWRITES = 2", nodes: ["grade", "rewrite", "retrieve"], edges: ["weak", "again"] },
      { t: "generate", b: "Relevant chunks, or the budget is spent: answer as JSON {answer, citations}. best_docs keeps the first non-empty retrieval.", m: "always ends in an answer", nodes: ["grade", "generate"], edges: ["ok"] },
      { t: "Citations are filtered", b: "Any id the model cites that wasn't retrieved is dropped.", m: "made-up ids: 0, by construction", nodes: ["generate", "filter"], edges: ["c"] },
    ],
    B(
      "Here's Graph two.",
      "Retrieve embeds the question, falling back to full text only if embedding fails, and fetches the hybrid top thirty.",
      "Grade is one LLM call over those chunks, returning the IDs that are actually relevant.",
      { say: "If nothing is relevant, and fewer than two rewrites have happened, rewrite the question and retrieve again. Retrieve, grade, rewrite, re retrieve. On a fixed budget.", term: { word: "Corrective RAG", meaning: "grade the retrieval; rewrite and retry, on a budget" } },
      "Once something is relevant, or the budget is spent, generate the answer as JSON, with citations. A best docs fallback keeps the first non empty retrieval, so a weak rewrite can't leave the answer with nothing.",
      { say: "And the citations are filtered to IDs that were actually retrieved. Made up IDs: zero, by construction.", tone: "key" },
    ),
    "Graph 2: graph_drilldown.py",
  ),
  {
    kind: "code",
    title: "The two lines that bound the loop and the citations",
    lang: "python",
    code: `def _after_grade(state: DrilldownState) -> str:
    if state.get("graded"):
        return "generate"
    if state.get("rewrites", 0) < config.MAX_REWRITES:   # 2
        return "rewrite"
    return "generate"   # budget spent: answer from what we have

citations = [str(c) for c in data.get("citations", []) if str(c) in valid_ids]`,
    highlight: [[1, 3], [4, 5], [6, 6], [8, 8]],
    beats: B(
      "The conditional edge after grade. If something was graded relevant, generate.",
      "If not, and fewer than two rewrites so far, rewrite.",
      "Otherwise, the budget is spent: generate anyway, from what we have. The loop always ends.",
      { say: "And the citation filter. A cited ID survives only if it's in the set of IDs that were actually retrieved.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "From a citation to exact log lines",
    items: [
      { icon: "🧬", text: "The answer cites chunk ids", sub: "\"9f2c41d7…e41a\": a fingerprint that was retrieved" },
      { icon: "📍", text: "Each id resolves to its row", sub: "GET /sessions/{id}/evidence?chunkIds=… → line_start 3,401 … line_end 4,610" },
      { icon: "📜", text: "The UI shows those exact lines, numbered", sub: "original file line numbers, thanks to firstLineNumber" },
    ],
    beats: B(
      "So how does an answer cite exact log lines? The answer cites chunk IDs. Fingerprints, and only ones that were retrieved.",
      "Each ID resolves to its row through the evidence endpoint: line start three thousand four hundred and one, line end four thousand six hundred and ten.",
      { say: "And the UI shows those exact lines, with the original file's line numbers. That number came all the way from the splitter, in the part message's first line number. Every piece connects.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "Answering questions: the alternatives",
    cols: [
      { title: "Plain RAG", icon: "📥", tone: "amber", items: ["retrieve once, answer", "one LLM call, cheap", "no check that retrieval found anything"] },
      { title: "A free agent with tools", icon: "🤹", tone: "red", items: ["picks its own tools and steps", "unpredictable cost and latency", "hard to evaluate"] },
      { title: "Corrective RAG, on a budget ✓", icon: "🔄", tone: "green", items: ["checks its own retrieval", "2 calls normally, at most 6", "citations filtered to retrieved ids"] },
    ],
    footer: "the argument: self-checking, but bounded: 3 grades + 2 rewrites + 1 answer at most",
    beats: B(
      "Defend it. Plain RAG retrieves once and answers. Cheap, one call, but nothing checks that the retrieval found anything relevant.",
      "A free agent with tools picks its own steps. Flexible, but unpredictable in cost and latency, and hard to evaluate.",
      "Corrective RAG on a budget checks its own retrieval, normally costs two calls, at most six, and filters its citations.",
      { say: "Your line: self checking, but bounded. Three grades, two rewrites and one answer, at most.", tone: "key" },
    ),
  },
  {
    kind: "sayit",
    q: "\"How do you stop hallucinated citations?\"",
    lines: [
      "Evidence ids are never written by a model: code attaches them at enrichment.",
      "At query time, a cited id survives only if it was actually retrieved.",
      "Each id is a content fingerprint that resolves to exact line numbers.",
      "And a judge loop marks any incident story it couldn't verify.",
    ],
    beats: B(
      { say: "Say it out loud. How do you stop hallucinated citations?", tone: "ask" },
      "Evidence IDs are never written by a model. Code attaches them at enrichment.",
      "At query time, a cited ID survives only if it was actually retrieved.",
      "Each ID is a content fingerprint that resolves to exact line numbers.",
      { say: "And a judge loop marks any incident story it couldn't verify.", tone: "key" },
    ),
  },
  check({
    topic: "Graph 2",
    q: "What is the most LLM calls one question can cost in Graph 2, and why is it bounded?",
    a: "Six: three grades, two rewrites, one answer. MAX_REWRITES = 2 caps the loop, and after the budget the edge goes to generate regardless.",
    aSay: "Six. Three grades, two rewrites, and one answer. Max rewrites is two, and once the budget is spent the conditional edge goes to generate no matter what.",
  }),
  check({
    topic: "Graph 2",
    q: "A model cites a chunk id that was never retrieved. What happens to it?",
    options: ["It's shown with a warning", "It's dropped: citations are filtered to retrieved ids", "The judge rewrites it", "It triggers a rewrite"],
    answer: 1,
    a: "It's dropped. The filter keeps only ids in the retrieved set, so fabricated citations are zero by construction.",
    aSay: "B. It's dropped. The filter keeps only IDs that were in the retrieved set, so fabricated citations are zero by construction.",
  }),
];
