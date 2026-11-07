import type { Scene } from "../../lib/types.ts";
import { B, arch, sec } from "./h.ts";
import { DEPLOY, SITE, SITE_STEPS, STATUS } from "./diagrams.ts";

// Part A: the problem, the requirements, the whole system on one board, and
// the history that forced each piece.
export const partA: Scene[] = [
  {
    kind: "title",
    eyebrow: "Projects · LL-01",
    title: "LogLens, end to end",
    subtitle: "every decision, every number, every follow-up",
    beats: B("LogLens, end to end. The architecture, every decision behind it, how each number was measured, and the follow-up questions an AI engineering interview will throw at you."),
  },
  {
    kind: "bullets",
    title: "By the end, you can defend",
    firstItemStep: 1,
    items: [
      { icon: "🗺️", text: "The whole system, box by box: who calls whom, and why" },
      { icon: "📏", text: "Every number: where it came from, and how to re-derive it" },
      { icon: "⚖️", text: "Every decision: the options, what was tried, what shipped" },
      { icon: "🧨", text: "The bugs your own tests found, with before and after" },
      { icon: "🎯", text: "The follow-ups, and the gaps to admit before you're asked" },
    ],
    beats: B(
      "By the end of this, you should be able to defend five things.",
      "The whole system, box by box. Which service calls which, and why it's built that way.",
      "Every number. Where it came from, and how to work it out again on a whiteboard.",
      "Every decision. What the options were, what you tried first, and what shipped.",
      "The bugs your own tests found, each with a before and an after.",
      { say: "And the follow-up questions, including the gaps you should admit before anyone asks.", tone: "key" },
    ),
  },

  // ------------------------------------------------------------ 1
  sec("1", "The problem", "Start where every design interview starts. The problem."),
  {
    kind: "big",
    tone: "idea",
    lead: "3 AM. Checkout returns 503.",
    text: "You have a 2 GB log archive from 12 services. What broke, since when, and how many users were hit?",
    beats: B(
      "It's three in the morning, and checkout is returning five oh threes.",
      "You have a two gigabyte log archive from twelve services, and your manager wants three answers. What broke. Since when. And how many users were hit.",
      "The obvious move is to paste the logs into a chat model. It fails, in four separate ways.",
    ),
  },
  {
    kind: "numbers",
    title: "Why “just ask an LLM” fails",
    items: [
      { value: "15M", label: "lines in 2 GB", sub: "no context window holds that" },
      { value: "≈", label: "it estimates counts", sub: "“how many 503s?” needs exact" },
      { value: "0", label: "line numbers to check", sub: "nobody can verify the answer" },
      { value: "$$$", label: "pay for every minute", sub: "to learn about the few that matter" },
    ],
    footer: "give each job to the tool that is good at it",
    beats: B(
      "One. Volume. Two gigabytes is about fifteen million lines. No context window holds that.",
      "Two. Counting. Ask how many five oh threes there were, and a language model estimates from what it happens to see. It does not count.",
      "Three. Trust. The answer comes back with no line numbers, so nobody can check it.",
      "Four. Cost. You pay for every minute of logs, just to learn about the handful of minutes that matter.",
      { say: "So LogLens gives each job to the tool that's good at it. Code counts every line exactly. The model only explains the minutes that look abnormal. And every claim points at stored evidence.", tone: "key" },
    ),
  },
  {
    kind: "sayit",
    q: "What is LogLens, in thirty seconds?",
    lines: [
      "It turns a large log archive into a cited incident report and a Q&A chat.",
      "Parsers compute exact per-minute metrics on every line, and a statistical gate picks the few abnormal minutes.",
      "Only those go to an LLM, which explains them; a LangGraph pipeline groups them into incidents, with a judge checking each story.",
      "Questions are answered by corrective RAG over hybrid search, citing the exact log windows used.",
      "Java, Spring Boot and Kafka for ingest; Postgres with pgvector for everything stored; Python LangGraph for the two graphs.",
      "And I built evals and fault-injection tests that found real bugs, each fixed with a before-and-after number.",
    ],
    beats: B(
      { say: "If someone asks what LogLens is, in thirty seconds, say this.", tone: "ask" },
      "It turns a large log archive into a cited incident report, and a question and answer chat.",
      "Parsers compute exact per minute metrics on every line, and a statistical gate picks out the few abnormal minutes.",
      "Only those go to an LLM, which explains them. A LangGraph pipeline groups the explanations into incidents, with a judge checking each story.",
      "Questions are answered with corrective RAG over hybrid search, citing the exact log windows it used.",
      "It's Java, Spring Boot and Kafka for ingest, Postgres with pgvector for everything stored, and Python LangGraph for the two graphs.",
      { say: "And I built evals and fault injection tests for it, which found real bugs, each fixed with a before and after number.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "Requirements, the way a design round wants them",
    cols: [
      { title: "Functional", icon: "✅", items: ["Upload an archive of several GB", "Watch progress live", "Exact per-minute metrics", "A report: incidents with root causes and evidence", "Ask questions, get cited answers"] },
      { title: "Non-functional", icon: "📐", tone: "green", items: ["512 MB box, ~256 MB heap", "Free-tier LLM rate limits", "Counts 100% exact, even after crashes", "Every claim traceable", "Cost grows with anomalies, not bytes"] },
      { title: "Out of scope", icon: "✂️", tone: "purple", items: ["Live streaming from agents", "Alerting, long retention", "gzip or zip uploads (rejected clearly)", "Timestamp formats beyond ISO-8601 and syslog"] },
    ],
    footer: "name the three hard ones early: bounded memory, rate limits, exactly-once",
    beats: B(
      "Lay out the requirements the way a system design round expects. Functional first: upload an archive of several gigabytes, watch progress live, see exact per minute metrics, get a report of incidents with root causes and evidence, and ask questions with cited answers.",
      "Then the non functional ones, which are what actually shaped the design. A five hundred and twelve megabyte box, so a heap of about two hundred and fifty six. Free tier LLM rate limits. Counts that are exactly right, even after a crash. Every claim traceable. And cost that grows with anomalies, not with bytes.",
      "And say what's out of scope. No live streaming from log agents, no alerting, no long retention. Compressed uploads are rejected with a clear message. And only ISO and syslog timestamps are recognised.",
      { say: "In an interview, name the three hardest constraints early: bounded memory, provider rate limits, and exactly once effects under crashes. They explain most of the design before anyone asks.", tone: "key" },
    ),
  },
  {
    kind: "trap",
    myth: "It has to be real-time.",
    truth: "It doesn't. The upload returns at once; a report within minutes is fine.",
    why: "Claiming real-time drags the interview towards a streaming design you didn't build.",
    beats: B(
      "One phrase to avoid. Real time.",
      "It doesn't need to be. The upload returns immediately, and a report within a few minutes is fine.",
      "If you say real time, you pull the conversation towards a streaming design you never built.",
    ),
  },
  {
    kind: "numbers",
    title: "The constraints, in numbers",
    items: [
      { value: "512 MB", label: "Render free box", sub: "heap capped at 50% ≈ 256 MB" },
      { value: "30 / 6K", label: "Groq per key", sub: "requests · tokens per minute" },
      { value: "100 / 30K", label: "Gemini embeddings per key", sub: "requests · tokens per minute" },
      { value: "100%", label: "exact counts", sub: "LLMs estimate; crashes double-count" },
    ],
    footer: "every one of these shows up later as a design decision",
    beats: B(
      "Here are the constraints as numbers. Render's free tier gives you five hundred and twelve megabytes, and the JVM is told to use fifty percent of it, so the heap is about two hundred and fifty six.",
      "Groq allows thirty requests and six thousand tokens per minute, per key.",
      "Gemini embeddings allow a hundred requests and thirty thousand tokens per minute, per key.",
      "And the counts must be one hundred percent exact. Language models estimate, and crashes can double count.",
      "Every one of these comes back later as a design decision.",
    ),
  },
  {
    kind: "bullets",
    title: "Core entities: the window is the centre",
    firstItemStep: 1,
    items: [
      { icon: "📁", text: "Session · Document", sub: "one investigation · one uploaded file" },
      { icon: "✂️", text: "Part", sub: "a byte range of a document, never copied" },
      { icon: "🪟", text: "Window (chunk)", sub: "60 seconds of lines, one row, with its line range" },
      { icon: "🔢", text: "Metric", sub: "an exact count for one window and category" },
      { icon: "💡", text: "Finding · Incident · Report", sub: "LLM explanation · grouped findings + judge verdict · summary" },
    ],
    beats: B(
      "Now the core entities.",
      "A session is one investigation. A document is one uploaded file.",
      "A part is a byte range of a document. It's never copied, just described by two offsets.",
      { say: "And the central one. A window, also called a chunk: sixty seconds of log lines, stored as one row, with its exact line range.", term: { word: "Window", meaning: "60 s of log lines, the unit of everything" } },
      "A metric is an exact count for one window and one category, like five oh threes at nine thirty one.",
      "Then a finding is the LLM's explanation of one window, an incident groups related findings with a judge's verdict, and the report summarises the session.",
    ),
  },
  {
    kind: "big",
    tone: "interview",
    text: "Metrics, anomaly flags, findings, search results and citations all share the window.",
    after: "So a citation points at exactly the minute that was counted and explained.",
    beats: B(
      { say: "Why is the window the centre? Because metrics, anomaly flags, findings, search results and citations all share it.", tone: "ask" },
      { say: "So a citation points at exactly the minute that was counted, flagged and explained. That one choice keeps the whole system consistent.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "The API, in the order a file moves",
    lang: "http",
    code: `POST /api/v1/sessions                          create session + its chunk table
POST /sessions/{id}/documents/presign          15-min upload URL, or "duplicate"
PUT  <presigned URL>                           browser -> blob store, directly
POST /sessions/{id}/documents/{doc}/confirm    stat object, save row, Kafka pointer
GET  /sessions/{id}/progress                   SSE: status changes
GET  /sessions/{id}/metrics|findings|incidents|report
POST /sessions/{id}/drilldown                  ask a question
GET  /sessions/{id}/evidence?chunkIds=...      cited windows + line ranges
--- Java -> Python (internal) ---
POST /analyze/{session_id}   -> 202, runs in the background
POST /drilldown`,
    highlight: [null, [1, 1], [2, 3], [4, 4], [5, 5], [6, 8], [9, 11]],
    beats: B(
      "And the API, in the order a file moves through it.",
      "Create a session. That also creates the session's own table for its chunks, which matters a lot later.",
      "Ask for a presigned upload link, valid for fifteen minutes, then the browser puts the file straight into blob storage. The bytes never touch the API.",
      "Then confirm. The server checks the object really exists and how big it is, saves the document row, and sends a small pointer to Kafka.",
      "Progress comes back as server sent events.",
      "Then the results: metrics, findings, incidents, the report. A question goes to drilldown, and evidence returns the cited windows with their line ranges.",
      "Internally, Java calls the Python service: analyze, which returns two oh two and runs in the background, and drilldown for questions.",
    ),
  },

  // ------------------------------------------------------------ 2
  sec("2", "The whole system on one board", "Now the whole system, on one board. This is the same diagram the LogLens site shows."),
  arch(SITE, SITE_STEPS, B(
    "Here it is. The client, the blob store, the application server with the API and the workers inside it, Kafka, the LLM providers, Postgres for data and vectors, LangGraph for root cause and questions, and Redis for chat history. Follow one file through it, in seven steps.",
    "Step one. Upload. The browser sends the file straight to the blob store with a short lived link, and the API only checks that it arrived. In the live demo, that's a one gigabyte file.",
    "Step two. Split. A splitter reads the file once and cuts it into pieces of about five megabytes, always at a minute boundary, and puts a small pointer to each piece on Kafka. The demo file became two hundred and five pieces.",
    "Step three. Parse. Workers take pieces in parallel, read only their slice with a ranged read, and eight parsers count errors, five hundreds, latency and SQL failures for every minute. Each piece is saved in one database transaction. Three thousand and nineteen windows.",
    "Step four. Detect. Each minute is compared with the rest of the same log, using median based baselines, rare error patterns, and hard rules like out of memory or deadlocks. A hundred and one of five hundred and ninety one minutes were flagged.",
    "Step five. Explain. Only flagged minutes go to the LLM. Every API key has its own Kafka partition and its own worker, so each key runs at its full rate limit. Forty two thousand calls, out of two hundred and twenty thousand possible.",
    "Step six. Root cause. A LangGraph pipeline groups related findings into incidents and ranks the likely causes, and a judge checks each story against its evidence. Six incidents.",
    { say: "Step seven. Ask. A decision graph reads the chat so far from Redis, works out whether you're following up, and picks a route: hybrid search over the failures in Postgres, the log profile, or general knowledge. Answers about the log cite exact lines.", tone: "key" },
  )),
  {
    kind: "big",
    tone: "idea",
    text: "Kafka moves facts. Blob storage moves bytes. Postgres holds the truth.",
    beats: B({ say: "One sentence explains most of that board. Kafka moves facts. Blob storage moves bytes. Postgres holds the truth.", tone: "key" }),
  },
  arch(DEPLOY, [
    { all: true },
    { t: "Where it runs", b: "The frontend and two small serverless functions on Vercel. One Spring Boot jar on Render's free tier runs the API and every Kafka worker.", m: "1 Java deployable + 1 Python sidecar", nodes: ["user", "vercel", "render"], edges: ["uv", "vr"] },
    { t: "Bytes", b: "The browser PUTs the file to Backblaze B2 with a presigned URL. Workers read it back in byte ranges.", m: "staged object deleted after ingest", nodes: ["user", "b2", "render"], edges: ["ub", "rb"] },
    { t: "Facts", b: "Redpanda Cloud speaks the Kafka protocol, over SASL_SSL with SCRAM-SHA-256. Messages are pointers, never file content.", m: "6 topics", nodes: ["render", "red"], edges: ["rk"] },
    { t: "Truth", b: "Render's Postgres 16 with pgvector holds rows, vectors and full text. Workers write it over JDBC with a pool of 5.", m: "Hikari pool: 5 in prod, 30 locally", nodes: ["render", "rpg"], edges: ["rp"] },
    { t: "Models", b: "Groq for chat, Gemini for embeddings, from both Java and Python.", m: "Groq has no embedding models", nodes: ["render", "orch", "llm"], edges: ["rl", "ol"] },
    { t: "Graphs", b: "A FastAPI + LangGraph service on its own free instance. Java calls it over public HTTPS; it reads Postgres directly.", m: "/analyze -> 202, background task", nodes: ["render", "orch", "rpg"], edges: ["ro", "op"] },
    { t: "The live demo", b: "The public demo replays a precomputed 1 GB run, and its Ask runs in Vercel functions over Neon pgvector, with Redis memory.", m: "LangGraph.js · gpt-oss-120b", nodes: ["vercel", "neon", "llm"], edges: ["vn", "vl"] },
  ], B(
    "That was the logical picture. Here's where each piece actually runs, and which one calls which.",
    "The React app and two small serverless functions live on Vercel. A single Spring Boot jar, in Docker on Render's free tier, runs the API and every Kafka worker. One Java deployable and one Python sidecar. That's a modular monolith.",
    "Bytes go from the browser to Backblaze B2 with a presigned URL. B2 speaks the S3 API, so the same code runs against MinIO on a laptop. Workers read the file back in byte ranges, and the staged object is deleted after ingest.",
    "Facts go through Redpanda Cloud, which speaks the Kafka protocol, secured with SASL over TLS and SCRAM SHA two fifty six. Messages are pointers, never file content.",
    "The truth lives in Render's Postgres sixteen with pgvector. Note the connection pool: five in production, thirty locally, because the free database allows few connections.",
    "Groq serves chat and Gemini serves embeddings, called from both Java and Python. They're split because Groq has no embedding models.",
    "The two graphs run in a FastAPI and LangGraph service on its own free instance. Java calls it over public HTTPS, because free Render services can't talk on a private network, and Python reads Postgres directly.",
    { say: "And be precise about the public demo. It replays a precomputed one gigabyte run, made by the same Java parsers and gate, and its Ask runs live in Vercel functions over Neon pgvector, with Redis memory. Say that before an interviewer finds it.", tone: "key" },
  ), "Where each piece runs, and who calls whom"),
  {
    kind: "seq",
    title: "Upload to report, end to end",
    actors: [
      { id: "b", name: "Browser", icon: "🖥️" },
      { id: "a", name: "API", icon: "🧩" },
      { id: "k", name: "Kafka", icon: "📨" },
      { id: "w", name: "Workers", icon: "⚙️" },
      { id: "p", name: "Postgres", icon: "🐘" },
      { id: "o", name: "Python graphs", icon: "🕸️" },
    ],
    msgs: [
      { from: "b", to: "a", label: "presign, PUT to blob, confirm", step: 1 },
      { from: "a", to: "k", label: "IngestRequest pointer", step: 1 },
      { from: "k", to: "w", label: "splitter reads the file once", step: 2 },
      { from: "w", to: "k", label: "N part pointers, byte ranges", step: 2, dash: true },
      { from: "k", to: "w", label: "parts in parallel, ranged reads", step: 3 },
      { from: "w", to: "p", label: "one tx per part + marker row", step: 3 },
      { from: "w", to: "p", label: "finalizer claims, flags windows", step: 4 },
      { from: "w", to: "k", label: "enrich items: flagged only", step: 4, dash: true },
      { from: "k", to: "w", label: "LLM explains, embeddings stored", step: 5 },
      { from: "w", to: "o", label: "POST /analyze", step: 6 },
      { from: "o", to: "p", label: "incidents, judged report, DONE", step: 6 },
    ],
    note: { step: 7, text: "the browser watches every step over SSE" },
    beats: B(
      "The same story as a sequence, because you'll be asked to walk through it.",
      "The browser presigns, uploads straight to blob storage, and confirms. The API puts one ingest request on Kafka.",
      "The splitter consumes it, streams the file once, and publishes one pointer per part, each a byte range.",
      "Part workers consume those in parallel, each doing a ranged read, and each part commits in one transaction, together with a marker row.",
      "When the last part lands, the finalizer claims the document, runs the session wide statistics, and publishes enrichment items, for flagged windows only.",
      "The enrichment lanes call the LLM and store findings and embeddings.",
      "When every item is done, Java calls the Python service, which builds incidents with a judge loop and writes the report. Status: done.",
      { say: "And the whole time, the browser is watching over server sent events.", tone: "key" },
    ),
  },
  arch(STATUS, [
    { all: true },
    { t: "One column drives the UI", b: "sessions.analysis_status moves forward one state at a time. Each state is something the UI already knows how to draw.", m: "SSE: checked every 1.5 s", nodes: ["CREATED", "CHUNKING", "PARSING", "ENRICHING", "CORRELATING", "REPORTING", "DONE"], edges: ["CREATED>", "CHUNKING>", "PARSING>", "ENRICHING>", "CORRELATING>", "REPORTING>"] },
    { t: "Any stage can fail", b: "A failure is a state too, with a reason the user can read. Never an endless spinner.", m: "FAILED + error_message", nodes: ["FAILED", "CHUNKING", "PARSING", "ENRICHING", "CORRELATING", "REPORTING"], edges: ["CHUNKING!", "PARSING!", "ENRICHING!", "CORRELATING!", "REPORTING!"] },
    { t: "Where it can stick", b: "If Python is cold or restarts mid-run, a session can wait in CORRELATING: the trigger is best-effort and the graph runs as a background task.", m: "gap: no re-trigger job yet", nodes: ["CORRELATING"], edges: [] },
  ], B(
    "Progress is one status column on the session, moving forward one state at a time.",
    "Created, chunking, parsing, enriching, correlating, reporting, done. A scheduled check runs every one and a half seconds and pushes an event when a subscribed session's status changes.",
    "Any stage can fail, and failure is a state too, with a reason the user can read. The rule the robustness tests enforce: every upload ends in a clear state, never an endless spinner.",
    { say: "And here's a gap I found reading the code. Java's call to Python is best effort, three attempts, and the graph runs as a FastAPI background task. If the Python service is cold or restarts mid run, a session can wait in correlating. The fix is a small job that re-triggers stuck sessions. Mention it yourself.", tone: "key" },
  ), "The session status machine"),
  {
    kind: "drill",
    items: [
      { q: "Why does the browser upload straight to blob storage?", a: "So a 2 GB upload costs the 512 MB API no memory and no threads. The API returns in milliseconds." },
      { q: "What travels on Kafka: bytes or pointers?", a: "Pointers. An ingest request, then byte ranges. The file itself only ever lives in blob storage." },
      { q: "Why one Java deployable instead of microservices?", a: "One deployable fits the free tier, and consumer groups already let you run more copies. Split out the enrichment lane first if you must." },
      { q: "Is the public demo running the whole pipeline live?", a: "No. It replays a precomputed 1 GB run from the same Java parsers and gate. Its Ask is live." },
    ],
    beats: [
      { say: "Quick check. Why does the browser upload straight to blob storage?", hold: 1.5 },
      { say: "So a two gigabyte upload costs the five hundred megabyte API no memory and no threads. The API answers in milliseconds." },
      { say: "What travels on Kafka, bytes or pointers?", hold: 1.5 },
      { say: "Pointers. An ingest request, then byte ranges. The file itself only ever lives in blob storage." },
      { say: "Why one Java deployable, instead of microservices?", hold: 1.5 },
      { say: "One deployable fits the free tier, and Kafka consumer groups already let you run more copies of it. If you had to split something out, it would be the enrichment lane, which is slow, rate limited, and scales differently from HTTP." },
      { say: "Is the public demo running the whole pipeline live?", hold: 1.5 },
      { say: "No. It replays a precomputed one gigabyte run, made by the same Java parsers and gate. Its question answering is live." },
    ],
  },

  // ------------------------------------------------------------ 3
  sec("3", "How it got here", "Before the mechanics, the history. Every piece of this design was forced by something that broke, and interviewers love those stories."),
  {
    kind: "compare",
    title: "Version 1 (2025): three failures that shaped everything",
    cols: [
      { title: "Duplicate jobs", icon: "👯", items: ["CompletableFuture.allOf() without .join()", "the scheduler's transaction committed early", "locks released while jobs still ran", "fix: join first; later, Kafka"] },
      { title: "Pool exhausted", icon: "🚰", tone: "green", items: ["@Transactional around a 2-5 min embedding job", "one DB connection held the whole time", "rule: short tx, slow I/O outside, short tx"] },
      { title: "Out of memory", icon: "💥", tone: "purple", items: ["whole files and big batches in memory", "on a 512 MB box", "fix: SerialGC, heap at 50%, smaller batches"] },
    ],
    footer: "the short-transaction rule is still everywhere in the code",
    beats: B(
      "LogLens began in twenty twenty five as a document question and answer app. Jobs sat in a Postgres table that a worker polled every three seconds. Three failures from that version shaped everything after. First: the same document processed twice. CompletableFuture all of was called without join, so the scheduler returned at once, its transaction committed, and the job locks were released while the jobs were still running.",
      "Second: the connection pool ran dry. A transactional annotation wrapped a two to five minute embedding job, holding one database connection the entire time. That produced the rule you'll see everywhere: short transaction, then slow I O with no transaction, then another short transaction.",
      "Third: out of memory crashes on the five hundred megabyte box, from holding whole files and big batches. The fixes: the serial garbage collector, a heap capped at half the RAM, and smaller batches.",
      "That short transaction rule is still in every consumer today.",
    ),
  },
  {
    kind: "bullets",
    title: "Then the pivot, and the walls",
    firstItemStep: 1,
    items: [
      { icon: "🔄", text: "Jul 14, 2026: pivot to logs, with a written cut list", sub: "Elasticsearch cut: Postgres GIN covers one-session search" },
      { icon: "🧱", text: "Jul 15: Gemini's free chat tier fell to 20 requests a day", sub: "chat moved to Groq; embeddings stayed on Gemini" },
      { icon: "📉", text: "Jul 16: 7 of 167 windows embedded in production", sub: "and a rebalance storm in the consumers" },
      { icon: "✂️", text: "Jul 22: byte-range ingest and presigned uploads", sub: "memory stopped growing with the file" },
      { icon: "🔬", text: "Sep 29-30: evals, fault injection, robustness", sub: "the project had no tests; they found 12 fixes" },
    ],
    beats: B(
      "Then the pivot to log analysis, and a series of walls.",
      "July fourteenth, twenty twenty six. The design doc for logs included a cut list: things deliberately left out. The main one was Elasticsearch. Evidence lookup is by ID, and exact token search only ever runs inside one session, which a Postgres GIN index covers. Being able to name what you removed, and why, is a strong signal.",
      "July fifteenth. Gemini's free tier dropped to twenty requests a day, so chat moved to Groq. Groq has no embedding models, so embeddings stayed on Gemini.",
      "July sixteenth. A production session embedded only seven of a hundred and sixty seven windows, and the consumers fell into a rebalance storm. Both stories come later, in full.",
      "July twenty second. Byte range ingest and presigned uploads shipped, and memory stopped growing with the file.",
      { say: "And September twenty ninth and thirtieth. The project had no tests at all. Evals, benchmarks and fault injection found twelve real fixes, each with a before and after number. That pass is the backbone of how you defend this project.", tone: "key" },
    ),
  },
  {
    kind: "numbers",
    title: "What the measurement pass found",
    items: [
      { value: "+5.8%", label: "double-count after kill -9", sub: "enrichment lane → exact" },
      { value: "0 → 74%", label: "LLM savings on busy logs", sub: "gate F1 0.576 → 0.901" },
      { value: "0.39 → 0.76", label: "hybrid recall@10", sub: "full-text leg was dead" },
      { value: "10.7 → 44%", label: "evidence the model could see", sub: "query-focused snippets" },
    ],
    footer: "every fix started with a measurement that disagreed with what I expected",
    beats: B(
      "Here's what that pass found, as four numbers you should know cold. Killing the JVM at the worst moment showed the enrichment lane double counted by five point eight percent. Now it's exact.",
      "The anomaly gate's savings fell to zero on busy logs. After the fix, about seventy four percent, and its F1 went from point five seven six to point nine oh one.",
      "Hybrid search turned out to be secretly vector only. Fixing the full text leg took recall at ten from point three nine to point seven six.",
      "And the model could see only ten point seven percent of the evidence it was asked to cite. Now forty four.",
      { say: "The common thread: every fix started with a measurement that disagreed with what I expected, and twice, the measurement proved my first theory wrong.", tone: "key" },
    ),
  },
  {
    kind: "sayit",
    q: "What would you do differently?",
    lines: [
      "Write the evals before the features.",
      "Two real bugs, the non-exactly-once enrichment lane and the dead full-text leg, hid for months behind a UI that looked fine.",
      "And at demo scale, fewer moving parts: an in-JVM queue and a Java state machine would do. Kafka and Python are there for the scaled shape.",
    ],
    beats: B(
      { say: "Which sets up a classic question. What would you do differently?", tone: "ask" },
      "Write the evals before the features.",
      "Two real bugs, an enrichment lane that wasn't exactly once, and a full text search leg that returned nothing, hid for months behind a UI that looked fine.",
      { say: "And at demo scale, fewer moving parts. An in JVM queue and a Java state machine would be enough. Kafka and Python are there to show the scaled design, and it's fine to say so.", tone: "key" },
    ),
  },
];
