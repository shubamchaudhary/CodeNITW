import type { Scene } from "../../lib/types.ts";
import { B, arch, sec } from "./h.ts";
import { ASK, GRAPH1, GRAPH2, LANES } from "./diagrams.ts";

// Part D: rate-limited LLM lanes, Graph 1, evidence and cost, chunks and
// hybrid search, Graph 2, and the live demo's Ask graph.
export const partD: Scene[] = [
  // ------------------------------------------------------------ 13
  sec("13", "LLM lanes under rate limits", "Part thirteen. Calling LLMs on free tier limits. The most original design decision in the project: one Kafka partition per API key."),
  {
    kind: "compare",
    title: "Three ways to stay under a rate limit",
    cols: [
      { title: "Fixed interval", icon: "⏲️", items: ["wait a minimum gap between calls", "60,000 ms ÷ 30 = 2 s"] },
      { title: "Sliding window", icon: "🪟", tone: "green", items: ["remember the last minute's calls and tokens", "wait while the next call wouldn't fit"] },
      { title: "Token bucket", icon: "🪣", tone: "purple", items: ["refills at a steady rate", "each call takes tokens"] },
    ],
    footer: "all easy on ONE thread; across many threads you need a lock or a coordinator",
    beats: B(
      "First, how rate limiters work. A provider limits requests per minute and tokens per minute, per key. A four two nine means slow down. The simplest limiter is a fixed interval: thirty requests a minute means wait two seconds between calls.",
      "A sliding window remembers the last minute's calls and tokens, and waits while the next call wouldn't fit.",
      "A token bucket refills at a steady rate, and each call takes from it.",
      { say: "All of these are easy on a single thread. Across many threads, or many instances, a shared limiter needs a lock or a coordinator, which is easy to get wrong.", tone: "key" },
    ),
  },
  {
    kind: "big",
    tone: "idea",
    lead: "The Kafka trick",
    text: "A consumer group gives each partition to exactly one thread. Pair partition p with API key p, and each key has a single owner.",
    after: "A limiter with a single owner needs no lock.",
    beats: B(
      "Here's the trick.",
      "A consumer group already gives each partition to exactly one thread. So pair partition p with API key p, and every key has a single owner thread.",
      { say: "And a limiter with a single owner needs no lock at all. Kafka's partition assignment does the coordination for you.", tone: "key", term: { word: "Partition-per-key", meaning: "each API key's lane is one partition, one thread" } },
    ),
  },
  arch(LANES, [
    { all: true },
    { t: "Work goes into lanes", b: "The finalizer publishes one item per flagged window, choosing the partition itself.", m: "floorMod(workId.hashCode, slots)", nodes: ["fin", "p0", "p1", "p2", "p3"], edges: ["fp0", "fp1", "fp2", "fp3"] },
    { t: "One owner per key", b: "Lane thread i owns partition i, and with it key i. If there are fewer keys than partitions, lanes share: partition % slots.", m: "single owner across instances too", nodes: ["p0", "p1", "p2", "p3", "t0", "t1", "t2", "t3"], edges: ["pt0", "pt1", "pt2", "pt3"] },
    { t: "Each lane paces itself", b: "One call per 60,000 / (30 × 0.8) ms, plus a sliding 60 s token budget of 6,000 × 0.8. The 0.8 leaves 20% headroom.", m: "2,500 ms · 4,800 tokens per minute", nodes: ["t0", "t1", "t2", "t3", "groq"], edges: ["tg0", "tg1", "tg2", "tg3"] },
    { t: "Commit", b: "Findings and embeddings commit with the enrich_work_done marker.", m: "big windows split on record boundaries, 5,000 chars", nodes: ["t2", "pg"], edges: ["tpg"] },
    { t: "429: never sleep a lane", b: "The item goes to retry.60s with notBefore = now + 60 s. One retry thread waits, then re-publishes it to its lane.", m: "up to 1,440 attempts ≈ 24 h", nodes: ["t3", "retry", "rthread", "p3"], edges: ["t429", "rr", "rp"] },
    { t: "Anything else", b: "Non-retryable errors go to the enrich DLQ, and still count as done, so a session always finishes.", m: "one bad item can't block a session", nodes: ["t3", "dlq"], edges: ["tdlq"] },
  ], B(
    "Here are the lanes.",
    "The finalizer publishes one enrichment item per flagged window, choosing the partition itself, by hashing the work ID modulo the number of key slots.",
    "Lane thread i owns partition i, and with it, key i. If you later have fewer keys than partitions, lanes share, partition modulo slots. And because Kafka assigns each partition to one consumer in the group, a key still has a single owner even with several instances running.",
    "Each lane paces itself, with no shared state. One call every sixty thousand divided by thirty times nought point eight milliseconds: two and a half seconds. Plus a sliding sixty second token budget of six thousand times nought point eight: four thousand eight hundred tokens. The nought point eight leaves twenty percent headroom.",
    "Results commit with the enrich work done marker. And a window bigger than five thousand characters is split on record boundaries into several calls, so a stack trace is never cut across two calls.",
    { say: "A four two nine never puts a lane to sleep. The item goes to the sixty second retry topic with a not before time. One retry thread waits and re-publishes it. Up to one thousand four hundred and forty attempts, about a day. Nothing is dropped.", tone: "key" },
    "Any other error goes to the enrichment dead letter queue, and still counts as done, so a session always finishes.",
  ), "Enrichment lanes: partition per key"),
  {
    kind: "numbers",
    title: "Napkin: which limit actually binds?",
    items: [
      { value: "24 / min", label: "allowed by RPM", sub: "60,000 ÷ 2,500 ms" },
      { value: "≈ 1,600", label: "tokens per call", sub: "5,000 chars ≈ 1,250 + prompt + output" },
      { value: "≈ 3 / min", label: "allowed by TPM", sub: "4,800 ÷ 1,600" },
      { value: "TPM", label: "is the real limit", sub: "for big windows, tokens bind, not requests" },
    ],
    footer: "always compute both limits; the smaller one is your throughput",
    beats: B(
      "Now a napkin calculation interviewers love. Which limit actually binds? By requests: sixty thousand milliseconds over two thousand five hundred is twenty four calls a minute.",
      "By tokens: a full five thousand character segment is about one thousand two hundred and fifty tokens, plus the system prompt, the metrics and the output. Call it sixteen hundred.",
      "Four thousand eight hundred tokens a minute over sixteen hundred per call is about three calls a minute.",
      { say: "So for large windows, the token budget binds, not the request budget. Eight times lower. That's exactly the trap that caused the next story.", tone: "key" },
    ),
  },
  {
    kind: "chart",
    title: "July 16: 7 of 167 windows embedded",
    type: "bars",
    labels: ["first prod run", "fix 429 reading + batch size", "per-key RPM + TPM budgets"],
    series: [{ name: "windows embedded, of 167", values: [7, 87, 167], tone: "green", step: 1 }],
    max: 167,
    note: { step: 4, text: "first theory: daily quota. Dashboard: 14 of 1,000 daily used, TPM at 28.46K of 30K" },
    beats: B(
      "The hardest bug. A production session had a hundred and sixty seven windows, and only seven got embeddings. The chat was useless.",
      "Seven. Then eighty seven. Then all hundred and sixty seven. Here's how.",
      "My first theory: the daily quota was exhausted.",
      "The evidence disagreed. The provider dashboard showed fourteen of a thousand daily requests used, but tokens per minute at twenty eight point four six thousand, of thirty thousand.",
      { say: "So the real limit was tokens per minute. Batches of ten large windows were about sixteen thousand tokens, roughly one call per minute per key. And my client read per minute four two nines as daily quota exhausted, and gave up on healthy keys. Fixing the classification and the batch size gave eighty seven. Per key request and token budgets, so a call is only sent when it fits, gave a hundred and sixty seven.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "Chat vs embeddings: two limiter designs",
    cols: [
      { title: "Chat: ApiKeySlot", icon: "🛤️", items: ["one owner thread per key", "no lock: enforceRateLimit() just sleeps", "429 → retry topic"] },
      { title: "Embeddings: EmbeddingKeyPool", icon: "🏊", tone: "green", items: ["shared by ALL lane threads", "monitor + wait/notifyAll", "per key: 75 of 100 RPM, 24K of 30K TPM", "429 → bench the key 15 s, rotate"] },
    ],
    footer: "why both? embedding batches come from every lane, so they can't have one owner",
    beats: B(
      "And notice there are two limiter designs. Chat uses a key slot owned by one thread. No lock: the enforce rate limit method just sleeps until the interval has passed.",
      "Embeddings use a shared pool, because embedding batches arrive from every lane thread. It's a monitor with wait and notify all, with per key sliding windows of seventy five of the real hundred requests, and twenty four thousand of the real thirty thousand tokens. A four two nine benches that key for fifteen seconds, and callers rotate to the next key.",
      { say: "So if asked why both: embedding work comes from every lane, so it can't have a single owner. The lock is the price of sharing.", tone: "key" },
    ),
  },
  {
    kind: "drill",
    items: [
      { q: "Trade-offs of partition-per-key?", a: "Kafka can't reduce partitions, so fewer keys later means lanes share; and a busy key can't borrow an idle key's capacity." },
      { q: "'I added retries.' What's wrong with that answer?", a: "Retries without pacing just reach the limit faster. Pace first, then retry through a separate topic." },
      { q: "Why not let the lane sleep 60 s on a 429?", a: "It would stall its partition and risk max.poll.interval.ms. The retry thread holds the wait instead." },
    ],
    beats: [
      { say: "What are the trade offs of partition per key?", hold: 1.5 },
      { say: "Kafka can't reduce a topic's partition count, so having fewer keys later means lanes have to share. And a busy key can't borrow capacity from an idle one." },
      { say: "If you just answer, I added retries, what's wrong with that?", hold: 1.5 },
      { say: "Retries without pacing only reach the limit faster. Pace first, then retry through a separate topic." },
      { say: "Why not let the lane simply sleep sixty seconds on a four two nine?", hold: 1.5 },
      { say: "It would stall everything behind it in that partition, and risk the poll deadline, the rebalance storm all over again. The retry thread holds the wait instead." },
    ],
  },

  // ------------------------------------------------------------ 14
  sec("14", "Graph 1: incidents and the judge", "Part fourteen. The first LangGraph graph: turning findings into incidents, without letting the model invent connections."),
  {
    kind: "compare",
    title: "LangGraph in one slide",
    cols: [
      { title: "State", icon: "🗂️", items: ["a typed dict passed step to step", "AnalyzeState: findings, metrics, clusters, attempt, incidents, report"] },
      { title: "Nodes and edges", icon: "🔗", tone: "green", items: ["nodes read state, return updates", "conditional edges pick the next node", "that's what makes loops possible"] },
      { title: "Recursion limit", icon: "🧯", tone: "purple", items: ["a cap on steps per run", "25 by default", "LogLens: 12 + findings × 7"] },
    ],
    beats: B(
      "LangGraph in one slide. The state is a typed dictionary passed from step to step. Here it holds the session, the findings, metrics, clusters, the current cluster, an attempt counter, the incidents and the report.",
      "Nodes are functions that read the state and return updates. Edges are fixed, or conditional, where a function looks at the state and picks the next node. Conditional edges are what make loops possible.",
      "And a recursion limit caps the steps in one run. Twenty five by default. That default caused a real bug, coming up.",
    ),
  },
  arch(GRAPH1, [
    { all: true },
    { t: "load", b: "Read the session's findings and top metrics from Postgres.", nodes: ["load"], edges: [] },
    { t: "cluster, in code", b: "Same category, time ranges within 300 seconds: one cluster. Plain Python, no LLM.", m: "the model can't invent groupings", nodes: ["load", "cluster"], edges: ["a"] },
    { t: "correlate", b: "The LLM writes {narrative, root_cause} for one cluster.", m: "llama-3.3-70b-versatile", nodes: ["cluster", "correlate"], edges: ["b"] },
    { t: "ground_check", b: "A judge prompt answers {grounded, reason}, comparing the story with that cluster's findings.", nodes: ["correlate", "ground"], edges: ["c"] },
    { t: "Loop, with a hard cap", b: "Not grounded and attempts left: write again. At most 3 attempts; the last one is accepted but stored grounded = false.", m: "MAX_CORRELATE_ATTEMPTS = 3", nodes: ["ground", "correlate"], edges: ["no"] },
    { t: "Next cluster", b: "Accepted: move to the next cluster and correlate again.", nodes: ["ground", "correlate"], edges: ["next"] },
    { t: "Write it down", b: "Incidents are saved with the judge's verdict and reason, then the report gets an exact metrics table from SQL.", m: "status DONE", nodes: ["ground", "write", "compose", "save"], edges: ["done", "e", "f"] },
  ], B(
    "Here's Graph one, in the Python orchestrator.",
    "Load reads the session's findings and top metrics from Postgres.",
    "Cluster is plain Python, no LLM. Findings with the same category whose time ranges are within three hundred seconds of each other form one cluster. So the model can't invent which findings belong together.",
    "Correlate asks the LLM for a narrative and a root cause for one cluster, as JSON.",
    { say: "Ground check is the judge. A second prompt answers grounded true or false, with a reason, by comparing the story with that cluster's findings.", term: { word: "LLM-as-judge", meaning: "a second prompt checks the first one's output" } },
    { say: "If it's not grounded and attempts are left, write again. At most three attempts. On the last one the story is accepted, but stored with grounded false and the judge's reason. Visible, not hidden.", tone: "key" },
    "If accepted, move on to the next cluster.",
    "When every cluster is done, write the incidents, compose the report with an exact metrics table straight from SQL, save it, and the session is done.",
  ), "Graph 1: graph_analyze.py"),
  {
    kind: "compare",
    title: "Three real bugs in Graph 1",
    cols: [
      { title: "Recursion limit 25 reached", icon: "🔁", tone: "red", items: ["Llama's judge rejected more often", "the loop ran longer", "LangGraph stopped at 25 steps", "fix: 12 + findings × (3 × 2 + 1)"] },
      { title: "A JSON list crashed a session", icon: "🧾", tone: "purple", items: ["stub returned [...] for an object", "data.get threw → session FAILED", "fix: object contract + ONE repair call", "then a clear error"] },
      { title: "Force-accepted stories hidden", icon: "🙈", tone: "blue", items: ["were only a log line", "now incidents.grounded", "and judge_reason, stored"] },
    ],
    beats: B(
      "Three real bugs, each with a fix. Recursion limit twenty five reached. With Llama, the judge rejected more often, the loop ran longer, and LangGraph stopped at its default. The limit is now sized from the work: twelve, plus findings times seven. Three attempts of two calls each, plus one.",
      "A JSON list crashed the whole session. The stub LLM returned a list where an object was expected, and a dictionary get threw. A real model can do the same. Now there's a contract: the reply must be an object with the required keys, a one element list is accepted, and otherwise the model is asked once more with the contract restated, then a clear error.",
      "And force accepted stories were invisible, just a log line. Now grounded and the judge's reason are columns on every incident.",
    ),
  },
  {
    kind: "trap",
    myth: "The judge proves the story is grounded.",
    truth: "It's a filter, not a proof. The judge is another probabilistic model, from the same family as the writer.",
    why: "Shared blind spots. Its agreement with humans (Cohen's kappa) is UNVERIFIED: it needs ~40 human labels and a judge from another family.",
    beats: B(
      "The trap answer here: the judge proves the story is grounded.",
      "No. The judge is another probabilistic model, and here it's from the same family as the writer. It's a filter, not a proof.",
      { say: "They share blind spots. How often it agrees with a human, measured with Cohen's kappa, is unverified. It needs about forty human labels, and ideally a judge from a different model family. Say unverified, in those words.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "The evidence chain: no id written by a model",
    firstItemStep: 1,
    items: [
      { icon: "📄", text: "Report → Incident (finding_ids)" },
      { icon: "💡", text: "Finding → evidence_chunk_ids", sub: "the chunk the enrichment call was ABOUT, attached by code" },
      { icon: "🪟", text: "Chunk → 60 s window with its line range → raw lines" },
      { icon: "🔑", text: "Fingerprint = SHA-256(category + normalised title)", sub: "repeats merge: occurrence_count + 1" },
    ],
    beats: B(
      "Why can the model never make up a citation in a finding? Follow the chain.",
      "A report points at incidents, and an incident at its finding IDs.",
      { say: "A finding stores evidence chunk IDs, and those are the chunk the enrichment call was about, attached by code. The model's JSON has no ID field at all.", tone: "key" },
      "A chunk is a sixty second window with its line range, which leads to the raw lines.",
      "And repeated findings merge: the fingerprint is a SHA two fifty six of the category and the normalised title, so the same finding seen again adds one to its occurrence count.",
    ),
  },
  {
    kind: "numbers",
    title: "Napkin: what the LLM costs",
    items: [
      { value: "43 vs 345", label: "chat calls, 10k-line demo log", sub: "16 of 167 windows flagged: 87.5% fewer" },
      { value: "≈ 214k", label: "segments if every byte went", sub: "1,073,744,655 B ÷ 5,000 chars" },
      { value: "42,205", label: "calls the gate sends, 1 GB demo", sub: "571 of 3,019 chunks flagged: 80.9% fewer" },
      { value: "≈ 100", label: "calls for ONE full 512 KB chunk", sub: "cost ∝ flagged windows × their size" },
    ],
    footer: "cost grows with anomaly density, not file size; the fix for huge windows is a segment cap",
    beats: B(
      "Now cost, worked out. On the ten thousand line demo log, sixteen of a hundred and sixty seven windows were flagged, so forty three chat calls instead of three hundred and forty five. Eighty seven point five percent fewer.",
      "On the one gigabyte demo, if every byte went to the model in five thousand character segments, that's a billion bytes divided by five thousand, about two hundred and fifteen thousand calls. The site says two hundred and twenty thousand six hundred and fifty seven, because segments end on record boundaries, so they run a little short.",
      "The gate flagged five hundred and seventy one of three thousand and nineteen chunks, and those come to forty two thousand two hundred and five calls. Eighty point nine percent fewer.",
      { say: "And notice: one full five hundred and twelve kilobyte chunk is about a hundred calls by itself. So cost is flagged windows times their size. A file with the same density of incidents costs proportionally more, and the fix for huge windows is a cap on segments per window.", tone: "key" },
    ),
  },
  {
    kind: "big",
    tone: "interview",
    lead: "So could the live demo run that live, on free keys?",
    text: "42,205 calls at ~3 per minute per key is days of work. So the 1 GB demo is precomputed; its incident write-ups took 6 calls.",
    after: "Clusters, counts and evidence lines come from code; one gpt-oss-120b call per incident writes the explanation, and causes citing lines outside the evidence are dropped.",
    beats: B(
      { say: "Which raises a sharp question. Could the live demo run that, live, on free keys?", tone: "ask" },
      "Forty two thousand calls, at about three a minute per key, is days of work. So the one gigabyte demo is precomputed, and its incident write ups took six LLM calls.",
      { say: "Clusters, counts and evidence lines are computed by code. One G P T O S S call per incident writes the title, summary, impact, ranked causes and fixes, and any cause that cites lines outside the evidence is dropped. Knowing that, and saying it, is exactly the honesty interviewers test for.", tone: "key" },
    ),
  },

  // ------------------------------------------------------------ 15
  sec("15", "RAG for logs: chunks and hybrid search", "Part fifteen. Retrieval. How LogLens finds evidence for a question, and the bug that made hybrid search secretly vector only."),
  {
    kind: "compare",
    title: "Two retrievers, opposite strengths",
    cols: [
      { title: "Embeddings", icon: "🧭", items: ["meaning: 'throttled' ≈ 'rate limited'", "weak on exact tokens: ORA-01555, status=429", "read only the start: first 8,000 chars"] },
      { title: "Full-text search", icon: "🔤", tone: "green", items: ["exact words and tokens", "weak on paraphrase", "to_tsvector('simple'): no stemming, no stop words", "SQLTimeoutException stays itself"] },
    ],
    footer: "logs are full of exact tokens, so full text matters more than in prose RAG",
    beats: B(
      "Two retrievers with opposite strengths. Embeddings capture meaning: throttled lands near rate limited. But they're weak at exact tokens like an Oracle error code or status equals four two nine. And an embedding model only reads the beginning of a text: here the first eight thousand characters.",
      "Full text search matches exact words and tokens, and is weak at paraphrase. LogLens uses Postgres's simple configuration: no stemming and no stop words, which suits logs, because SQL timeout exception stays exactly as it is.",
      { say: "Logs are full of exact tokens, so full text matters more here than in ordinary document RAG.", tone: "key" },
    ),
  },
  {
    kind: "big",
    tone: "interview",
    lead: "Why is a chunk one 60-second window?",
    text: "Because the minute is what metrics, flags and findings share, so a citation points at exactly the window that was counted and explained.",
    after: "The cost: a busy minute is ~16 KB, the embedding sees only its start, and one vector averages away the line you need. Vector-only recall@10: 0.393.",
    beats: B(
      { say: "Why is a chunk one sixty second window, rather than, say, fifty lines?", tone: "ask" },
      "Because the minute is the unit metrics, flags and findings already share, so a citation points at exactly the window that was counted and explained.",
      { say: "The cost: at two lines a second, a minute is about a hundred and twenty lines, sixteen kilobytes. The embedding sees only its start, and one vector for sixteen kilobytes averages away the line you need. Vector only recall at ten measured point three nine three. Tested offline, embedding a digest of each window's distinct message shapes raised it to point four eight eight. Not shipped yet.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "RRF: fuse by rank, not by score",
    lang: "python",
    code: `_RRF_K = 60
for ranked in ranked_lists:            # vector top 30, full-text top 30
    for rank, row in enumerate(ranked):   # rank starts at 0
        cid = row["chunk_id"]
        scores[cid] = scores.get(cid, 0.0) + 1.0 / (_RRF_K + rank)
        fused.setdefault(cid, row)
ordered = sorted(fused.values(), key=lambda r: scores[r["chunk_id"]], reverse=True)

# A: 1st in vector, 4th in full text -> 1/60 + 1/63 = 0.0325
# B: 1st in full text only           -> 1/60        = 0.0167`,
    highlight: [null, [2, 2], [5, 5], [9, 10]],
    beats: B(
      { say: "The two lists are fused with reciprocal rank fusion. Why not add the scores? A cosine distance and a ts rank are different units. Adding them needs a normalisation that changes from corpus to corpus.", term: { word: "RRF", meaning: "score = Σ 1 / (k + rank), k = 60" } },
      "So each leg returns its top thirty: the vector leg ordered by cosine distance on the HNSW index, and the full text leg using the GIN index, ordered by ts rank.",
      "Each chunk scores one over sixty plus its rank, summed over the lists. Ranks start at zero, and k equals sixty, the standard value.",
      { say: "Worked example. Chunk A is first in the vector list and fourth in full text: one over sixty plus one over sixty three, nought point nought three two five. Chunk B is first in full text only: one over sixty, nought point nought one six seven. A wins. Agreement between two lists beats being top of one.", tone: "key" },
    ),
  },
  {
    kind: "seq",
    title: "Sep 29: hybrid = vector-only. Why?",
    actors: [
      { id: "q", name: "Question", icon: "❓" },
      { id: "v", name: "Vector leg", icon: "🧭" },
      { id: "f", name: "Full-text leg", icon: "🔤" },
      { id: "r", name: "RRF", icon: "🔀" },
    ],
    msgs: [
      { from: "q", to: "v", label: "embed → 30 rows", step: 1 },
      { from: "q", to: "f", label: "AND of every word", step: 2 },
      { from: "f", to: "r", label: "0 rows", step: 2, tone: "red", dash: true },
      { from: "v", to: "r", label: "30 rows", step: 3, dash: true },
      { from: "r", to: "q", label: "RRF of one list = vector-only", step: 3, tone: "red" },
    ],
    note: { step: 4, text: "fix: OR the meaningful terms, always fuse, store content_tsv · 1,374 ms → 19.3 ms" },
    beats: B(
      { say: "Now the bug. The ablation showed hybrid search scoring exactly like vector only, on every question, to three decimal places. That's not a coincidence.", tone: "excite" },
      "The vector leg returned its thirty rows.",
      "The full text leg used web search to ts query, which ANDs every word. With the simple configuration, which, did and the became required words. No log chunk contains the word which. Zero rows.",
      "So RRF was fusing a single list. And the OR query fallback only ran when both legs were empty, which never happens when an embedding exists.",
      { say: "The fix: OR the meaningful terms, stop words removed, always include both legs, and store the tsvector as a generated column with a GIN index. Ranking had been recomputing the tsvector of every matching sixteen kilobyte row, a median of one thousand three hundred and seventy four milliseconds. With the stored column, nineteen point three.", tone: "key" },
    ),
  },
  {
    kind: "chart",
    title: "The ablation: 51 answerable questions",
    type: "bars",
    labels: ["Recall@5", "Recall@10", "Recall@30", "MRR"],
    series: [
      { name: "vector only (= hybrid before)", values: [0.34, 0.393, 0.441, 0.28], tone: "red", step: 1 },
      { name: "full text only", values: [0.675, 0.779, 0.852, 0.614], tone: "blue", step: 2 },
      { name: "hybrid after", values: [0.547, 0.757, 0.874, 0.449], tone: "green", step: 3 },
    ],
    max: 1,
    note: { step: 4, text: "full text wins at the top (MRR); hybrid wins recall@30, what the grader reads" },
    beats: B(
      "The ablation, on fifty one answerable questions, with a local embedding model standing in for Gemini.",
      "Vector only, which is what hybrid had been: recall at ten point three nine three.",
      "Full text only: point seven seven nine. Much stronger on logs.",
      "Hybrid after the fix: recall at ten point seven five seven, and the best recall at thirty, point eight seven four.",
      { say: "And state the nuance honestly. Full text alone beats hybrid at the very top, an MRR of point six one four against point four four nine, because the weak vector leg's noise rises with equal weights. Hybrid wins at recall at thirty, which matters most here, because the grader reads the top thirty. So never claim hybrid is always better.", tone: "key" },
    ),
  },
  {
    kind: "drill",
    items: [
      { q: "Doesn't the GIN index make ranking fast?", a: "It makes MATCHING fast. Ranking needs each row's tsvector, which is why it's stored." },
      { q: "Why did time-range questions score only 0.167?", a: "'Between when did X happen?' needs the first and last lines, in two distant windows. That's SQL over log_metrics, not RAG." },
      { q: "GIN or B-tree?", a: "B-tree keeps values sorted: time ranges. GIN maps each word to its rows: 'which rows contain stripe'." },
      { q: "What breaks if you change the embedding model?", a: "Vectors from different models aren't comparable: re-embed everything, same model, same dimensions." },
    ],
    beats: [
      { say: "Doesn't the GIN index make ranking fast?", hold: 1.5 },
      { say: "It makes matching fast. Ranking still needs each row's tsvector, which is why it's stored." },
      { say: "Why did questions about time ranges score only point one six seven?", hold: 1.5 },
      { say: "Between what times did X happen needs the first and last lines of an incident, in two distant windows, while retrieval finds the middle. The right tool is SQL over the metrics table, minimum and maximum time. Not RAG." },
      { say: "GIN or B tree?", hold: 1.5 },
      { say: "A B tree keeps whole values in order, which suits time ranges. GIN maps each word to the rows that contain it, which suits which rows contain stripe." },
      { say: "What breaks if you change the embedding model?", hold: 1.5 },
      { say: "Vectors from different models aren't comparable. Stored and query vectors must come from the same model with the same dimensions, so you re-embed everything. That's also why Gemini is asked for seven hundred and sixty eight dimensions: its default of three thousand and seventy two broke the column." },
    ],
  },

  // ------------------------------------------------------------ 16
  sec("16", "Graph 2: corrective RAG", "Part sixteen. Graph two, the question answering graph. Don't trust the first retrieval blindly."),
  arch(GRAPH2, [
    { all: true },
    { t: "retrieve", b: "Embed the question (full-text only if embedding fails), fetch the hybrid top 30.", nodes: ["q", "retrieve"], edges: ["a"] },
    { t: "grade", b: "One LLM call over the retrieved chunks returns {relevant_ids}.", nodes: ["retrieve", "grade"], edges: ["b"] },
    { t: "rewrite, on a budget", b: "Nothing relevant and fewer than 2 rewrites: rewrite the question and retrieve again.", m: "MAX_REWRITES = 2", nodes: ["grade", "rewrite", "retrieve"], edges: ["weak", "again"] },
    { t: "generate", b: "Relevant chunks, or the budget is spent: answer as JSON {answer, citations}. best_docs keeps the first non-empty retrieval.", m: "always ends in an answer", nodes: ["grade", "generate"], edges: ["ok"] },
    { t: "Citations are filtered", b: "Any id the model cites that wasn't retrieved is dropped.", m: "made-up ids: 0, by construction", nodes: ["generate", "filter"], edges: ["c"] },
  ], B(
    "Corrective RAG, as a graph.",
    "Retrieve embeds the question, falling back to full text only if embedding fails, and fetches the hybrid top thirty.",
    "Grade is one LLM call over the retrieved chunks, returning the relevant IDs.",
    { say: "If nothing is relevant, and fewer than two rewrites have happened, rewrite the question and retrieve again. A fixed budget.", term: { word: "Corrective RAG", meaning: "grade the retrieval; rewrite and retry, within a budget" } },
    "Once something's relevant, or the budget is spent, generate an answer as JSON with citations. And a best docs fallback keeps the first non empty retrieval, so a poor rewrite or a strict grader can't leave the answer with nothing.",
    { say: "Finally, the citations are filtered to IDs that were actually retrieved. Made up IDs: zero, by construction.", tone: "key" },
  ), "Graph 2: graph_drilldown.py"),
  {
    kind: "chart",
    title: "What the model could actually SEE",
    type: "bars",
    labels: ["generator", "grader"],
    series: [
      { name: "before: first 800 / 500 chars", values: [10.7, 6.9], tone: "red", step: 1 },
      { name: "after: focus_snippet()", values: [44.1, 37.6], tone: "green", step: 3 },
    ],
    max: 50,
    unit: "%",
    note: { step: 4, text: "same character budget, spent on the lines that match the question" },
    beats: B(
      "Then a quieter bug. What could the model actually see?",
      "The prompts sent the first eight hundred characters of each chunk to the generator, and five hundred to the grader. About five percent of a sixteen kilobyte window. Measuring gold lines present in the exact prompt text: ten point seven percent for the generator, six point nine for the grader.",
      { say: "The model was being asked to cite lines it could not see.", tone: "excite" },
      "The fix, focus snippet, spends the same character budget on the lines that match the question's terms, boosts warning, error and exception lines, and keeps them in log order. Forty four point one and thirty seven point six percent.",
      { say: "Same budget, better lines. And a metric worth naming: evidence visibility, the share of gold lines present in the exact prompt. A retrieved line the model can't see is useless.", tone: "key" },
    ),
  },
  {
    kind: "drill",
    items: [
      { q: "Does the loop guarantee a correct answer?", a: "It guarantees a BOUNDED attempt. If the evidence isn't in the logs, the right answer is 'not found': measured as abstention." },
      { q: "Do valid citations mean the answer is faithful?", a: "No. A valid id proves the chunk was retrieved, not that it supports the claim. That needs a judge or a human." },
      { q: "What does one question cost?", a: "Two calls normally (grade, generate); at most six (three grades, two rewrites, one answer)." },
      { q: "Would you make it agentic?", a: "As a router: counts and time ranges to SQL over log_metrics, 'why' to RAG. Predictable and testable." },
    ],
    beats: [
      { say: "Does the loop guarantee a correct answer?", hold: 1.5 },
      { say: "It guarantees a bounded attempt. If the evidence isn't in the logs, the right answer is not found, which is measured as abstention on the unanswerable questions." },
      { say: "Do valid citations mean the answer is faithful?", hold: 1.5 },
      { say: "No. A valid ID proves the chunk was retrieved, not that it supports the claim. That needs a judge, or a human." },
      { say: "What does one question cost?", hold: 1.5 },
      { say: "Two calls normally, grade and generate. At most six: three gradings, two rewrites, and one answer." },
      { say: "Would you make it agentic?", hold: 1.5 },
      { say: "Partly, as a router. Count and time questions go to SQL over the metrics, which is exact, and why questions go to RAG. Each route stays predictable and testable. And the live demo's Ask is exactly that kind of router." },
    ],
  },

  // ------------------------------------------------------------ 17
  sec("17", "The live Ask: a LangGraph.js decision graph", "Part seventeen. The Ask panel on the live site. It's the newest code, so expect questions on it."),
  arch(ASK, [
    { all: true },
    { t: "Memory first", b: "The last 4 turns of this conversation come from Redis, so a follow-up resolves against what was actually said.", m: "key ask:chat:<conversationId>", nodes: ["mem", "und"], edges: ["m"] },
    { t: "Understand", b: "One LLM call decides the route, whether it's a follow-up (rewritten as a standalone question), and the language.", m: "only a real earlier question can be followed up", nodes: ["und", "chat", "general", "web", "system", "retrieve"], edges: ["r-chat", "r-general", "r-web", "r-system", "r-retrieve"] },
    { t: "Cheap routes", b: "Small talk and general questions answer directly. Web questions use Groq's built-in browser search, and fall back to general knowledge if it fails.", nodes: ["chat", "general", "web", "save"], edges: ["wf", "s1", "s2"] },
    { t: "System questions", b: "Services, tenants, dependencies come from log-profile.json, a summary of the whole log. Not covered? The nearest facts it does have.", nodes: ["system", "nearest", "save"], edges: ["sn", "s3"] },
    { t: "Failures: retrieve", b: "Failure types by pgvector and by full text, fused with RRF (k = 60), plus matching lines, inside any time window the question names.", m: "127k ERROR + WARN records", nodes: ["retrieve", "grade"], edges: ["rg"] },
    { t: "Grade, then maybe rewrite", b: "Weak means no lexical hit, best similarity under 0.55, and no time window. Then the LLM proposes log keywords, once.", m: "at most one rewrite", nodes: ["grade", "rewrite", "retrieve"], edges: ["gw", "wr"] },
    { t: "Generate and verify", b: "Citations not in the context are removed. Numbers in the answer that appear nowhere in the context force confidence to low.", m: "hallucination signal, checked in code", nodes: ["grade", "generate"], edges: ["gg"] },
    { t: "Abstain gracefully", b: "No supported point? Try the system route, then nearest facts. Every turn is saved: question, standalone form, route, answer.", m: "Redis: 20 turns, 24 h TTL", nodes: ["generate", "system", "save"], edges: ["abst", "s4"] },
  ], B(
    "The live Ask runs in a Vercel function, as a LangGraph JS decision graph.",
    "It loads memory first: the last four turns of this conversation, from Redis, keyed by a conversation ID the browser makes. So a follow up resolves against what was actually said.",
    "Understand is one LLM call. It decides the route, whether this is a follow up, rewriting it as a standalone question if so, and the language. A greeting can't be followed up; only a real earlier question can.",
    "The cheap routes answer directly: small talk, and general questions not about this log. A web question uses Groq's built in browser search tool, and if that fails, falls back to general knowledge.",
    "System questions, about services, tenants and dependencies, are answered from a profile of the whole log, precomputed into a JSON file. If the profile doesn't cover it, the nearest facts it does have.",
    "Failure questions retrieve. Failure types by pgvector and by full text, fused with RRF, k sixty, plus matching log lines, restricted to any time window the question names. A hundred and twenty seven thousand error and warning records.",
    "Then grade. Weak means no lexical hit, a best similarity under nought point five five, and no time window. Then the LLM proposes log keywords, and it searches again. Once.",
    { say: "Generate, then verify in code. Citations that aren't in the context are removed. And any number in the answer that appears nowhere in the context forces the confidence to low. A cheap hallucination check.", tone: "key" },
    "If no point is supported, it abstains gracefully: try the system route, then the nearest facts. And every turn is saved back to Redis: the question, its standalone form, the route, and the answer. Twenty turns kept, expiring after a day.",
  ), "Ask: api/_lib/graph.js"),
  {
    kind: "compare",
    title: "Production guards around Ask (api/ask.js)",
    cols: [
      { title: "Abuse and cost", icon: "🛡️", items: ["questions ≤ 300 characters", "25 per visitor per day", "1,500 per day for everyone", "visitor = SHA-256(salt + IP), never the raw IP"] },
      { title: "Speed", icon: "⚡", tone: "green", items: ["opening questions cached in Postgres", "key 'v2:' + normalised question", "bump the prefix when answers change shape", "NDJSON stream: one line per step"] },
      { title: "Resilience", icon: "🧷", tone: "purple", items: ["keys rotate from a random start", "move on after 401, 403, 429, 5xx", "Redis down → Postgres table fallback", "gpt-oss-120b, reasoning_effort low"] },
    ],
    beats: B(
      "And the guards around it, in the Ask endpoint. Abuse and cost: questions under three hundred characters, twenty five per visitor per day, fifteen hundred per day for everyone. And a visitor is a salted SHA two fifty six of the IP address, never the raw IP.",
      "Speed: opening questions are cached in Postgres, keyed by a version prefix plus the normalised question, so the suggested questions answer instantly. Bump the prefix when answers change shape. Follow ups are never cached, because they depend on the conversation. And the response streams as newline delimited JSON, one line per step, so the UI can show what's happening.",
      { say: "Resilience: API keys rotate from a random starting key, and move on after a four oh one, four oh three, four two nine or a server error. A bad request doesn't retry, because it won't succeed on another key. If Redis is down, memory falls back to a Postgres table. And the model is G P T O S S one twenty B, with low reasoning effort, because its reasoning tokens count against max tokens.", tone: "key" },
    ),
  },
  {
    kind: "sayit",
    q: "How does your chat handle follow-ups and hallucinations?",
    lines: [
      "Every turn goes to Redis; the graph reads the last four before it decides anything.",
      "An 'understand' step rewrites a follow-up into a standalone question, so retrieval never sees 'what about it?'.",
      "Answers about the log come from hybrid retrieval with one bounded rewrite.",
      "Then code verifies: citations not in the context are dropped, and unsupported numbers force low confidence.",
      "If nothing is supported, it abstains, then falls back to the log profile, instead of guessing.",
    ],
    beats: B(
      { say: "Model answer. How does your chat handle follow ups, and hallucinations?", tone: "ask" },
      "Every turn goes to Redis, and the graph reads the last four before it decides anything.",
      "An understand step rewrites a follow up into a standalone question, so retrieval never sees something like, what about it.",
      "Answers about the log come from hybrid retrieval, with one bounded rewrite.",
      "Then code verifies. Citations that aren't in the context are dropped, and numbers that don't appear in the context force low confidence.",
      { say: "And if nothing is supported, it abstains, then falls back to the log profile, instead of guessing.", tone: "key" },
    ),
  },
];
