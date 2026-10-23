/* THE CURATED AI STACK MAP — edit this, then run `node scripts/genAIStack.mjs`.

   Scope: what an AI Engineer loop asks at ~2 years of experience, for a
   backend engineer who ships GenAI. Built from the 2026 interview guides
   (PracHub, techinterview.org, Exponent, FACE Prep) and from the resume — a
   claim the resume makes is a topic that is going to be probed.

   ── Priorities ─────────────────────────────────────────────────────────────
   P0  A resume claim you cannot fumble: your systems, and the concepts they
       stand on (HNSW filtering, hybrid + RRF, corrective RAG, LLM-as-judge,
       HITL interrupts, guarded SQL).
   P1  Asked in almost every loop. Do before any real interview.
   P2  System design and production. Do after P0 and P1.
   P3  Differentiators. Skip under time pressure.

   ── Two sources, merged ────────────────────────────────────────────────────
   scripts/data/genaiPrepMap.md holds the first fifteen topics (A1–D3): title,
   depth ceiling, resume flag, questions and the one written resource each. An
   entry below with the same id ADDS to it — priority, why, videos, extra
   questions — and never retypes it. An entry with an id the markdown does not
   know is a new topic and carries everything itself.

   ── Resource kinds ─────────────────────────────────────────────────────────
   video:  "ID"      → a YouTube video id. Resolved against
                       scripts/data/aiStackVideos.csv (channel, exact title,
                       runtime, fetched from YouTube by verifyAIVideos.mjs).
                       The generator FAILS on an id the CSV does not hold, so
                       no title, channel or runtime here is typed by hand.
                       { video, note } says which part of a long video to watch.
   doc:    {...}     → a written reference.
   course: {...}     → a structured course; `paid: true` marks a paid one.
   self:   {...}     → your own code or your own memory. No link on purpose.

   Order in TOPICS is display order: sections as listed, topics within a
   section by priority. A topic id is a storage key (ticks, notes, plan items
   hang off it): never renumber or reuse one.
*/

export const SECTIONS = [
  { key: "R", label: "Your systems — resume defence", chip: "Resume" },
  { key: "A", label: "RAG", chip: "RAG" },
  { key: "C", label: "Is my AI actually working?", chip: "Evals" },
  { key: "B", label: "LangChain + LangGraph", chip: "LangGraph" },
  { key: "D", label: "Production essentials", chip: "Production" },
  { key: "E", label: "Python for AI engineers", chip: "Python" },
  { key: "F", label: "LLM fundamentals", chip: "LLMs" },
  { key: "G", label: "LLM system design", chip: "Design" },
  { key: "H", label: "Beyond the core", chip: "Beyond" },
];

export const TOPICS = [
  // ─── R · Your systems — resume defence ────────────────────────────────────
  {
    id: "R1",
    section: "R",
    priority: "P0",
    title: "DeepLogLens — the numbers and the judge",
    why: "Every AI loop opens with “walk me through a system you shipped”, then asks how you measured it. Your LogLens eval harness is the answer most candidates cannot give, and three things in it will be probed: the LLM-call reduction figure (resume says 80%, the README ~90%, your own eval measured 77.8%), a judge nobody has checked against human labels, and answer-quality metrics that exist only as a dry run.",
    flag: "Resume claims: ~80% fewer LLM calls, an LLM-as-judge groundedness loop, hybrid search.",
    ceiling: {
      enough: "say the number and where it came from, name the judge's biases and what you did about them, and state what your golden set cannot tell you.",
      tooDeep: "inter-annotator-agreement theory beyond Cohen's kappa.",
    },
    resources: [
      {
        self: {
          title: "LogLens — evals/README.md, evals/results/*/REPORT.md, evals/thresholds.json",
          minutes: 45,
          note: "Read your own reports first. Then run run_llm_evals.py with --judge anthropic, export 40 items with --export-judge-sample, label them yourself and run --kappa. Count how often the grounding loop force-accepts (grounded=false is already stored).",
        },
      },
      { video: "GL0XhAj5LPE", note: "Hold your harness up against each mistake he lists: generic metrics, unvalidated judges, no error analysis." },
    ],
    questions: [
      "How did you get “~80% fewer LLM calls”? Where does the number come from, and on what data?",
      "Your retrieval eval has full-text search beating vector search at recall@10. Why ship hybrid at all?",
      "Is your LLM judge any good? How do you know — against what?",
      "The production grounding check uses the same model family as the generator. What is the risk?",
      "What happens when the grounding loop never passes? How often does that happen?",
      "Your golden set is synthetic and labelled by the generator. What can it not tell you?",
      "You report recall@k on 51 answerable questions. How much do you trust a 0.02 difference?",
      "You have one week. How do you prove faithfulness on real answers?",
    ],
  },
  {
    id: "R2",
    section: "R",
    priority: "P0",
    title: "DeepLogLens — retrieval: hybrid, per-session HNSW, RRF",
    why: "“Hybrid search, pgvector” is on your resume, so expect “did hybrid beat vector-only, and by how much?”. Your eval answers it: on log data full-text wins recall@10 (0.78 against 0.39 for vector-only, with bge-small standing in for the production embedder), hybrid wins recall@30 (0.87 against 0.85) but loses MRR to full-text (0.45 against 0.61). That gap is the argument for a reranker.",
    flag: "Resume claims: hybrid vector + full-text search, pgvector, per-session HNSW/GIN-indexed chunk tables.",
    ceiling: {
      enough: "quote your own numbers, explain why logs favour lexical search, and say what you would add next.",
      tooDeep: "ANN algorithm proofs; embedding model training.",
    },
    resources: [
      {
        self: {
          title: "LogLens — rag-orchestrator/app/db.py (retrieve_chunks, _rrf_fuse), evals/run_retrieval.py, evals/results/retrieval/*/REPORT.md",
          minutes: 40,
          note: "Add a cross-encoder reranker after RRF, re-run run_retrieval.py and write down MRR before and after.",
        },
      },
      {
        video: "kT7nXO32L-Q",
        note: "07:20 BM25 (IDF, term frequency, document length); 27:40 BM25 inside Postgres; 43:28 Reciprocal Rank Fusion. It is your stack: Postgres plus pgvector.",
      },
      {
        doc: {
          title: "Hybrid Search in PostgreSQL: The Missing Manual",
          site: "paradedb.com",
          url: "https://www.paradedb.com/blog/hybrid-search-in-postgresql-the-missing-manual",
          minutes: 20,
          estimate: true,
          note: "Why ts_rank is not BM25, and how RRF is done in SQL.",
        },
      },
    ],
    questions: [
      "Why hybrid? Give your own numbers: vector-only, full-text and hybrid, at recall@10 and MRR.",
      "Hybrid has a lower MRR than full-text alone on your data. What do you do about it?",
      "Is Postgres ts_rank BM25? What is missing?",
      "Why does vector-only do so badly on logs? (Identifiers; chunks of ~15.7K characters against an embedder that sees ~512 tokens; a stand-in embedder.)",
      "Why one chunk table and one HNSW index per session instead of one shared table?",
      "What does that design cost you? (Many tables and indexes, catalogue bloat, per-session build time, cleanup.)",
      "Write the RRF formula. Why k = 60? Why rank-based rather than score-based?",
      "Time-range questions get 0.167 recall@10 from every retriever (only 3 questions). Why, and where does your three-tier query design send them?",
    ],
  },
  {
    id: "R3",
    section: "R",
    priority: "P0",
    title: "DeepLogLens — ingest: Kafka, idempotent effects, rate limits",
    why: "“Exactly-once effects on at-least-once delivery” is a strong claim and a favourite follow-up. Be ready to say what is guaranteed (a marker row in the same transaction as the data makes redelivery a no-op), what is not (Kafka transactions cover Kafka-to-Kafka only), and to say “effectively once” rather than “exactly once”.",
    flag: "Resume claims: constant-heap streaming ingest, offsets committed after durable writes, idempotent upserts turning at-least-once into exactly-once effects.",
    ceiling: {
      enough: "walk one part through the transaction, say what each crash point does, and name the limit of your guarantee.",
      tooDeep: "Kafka broker internals, ISR and controller election.",
    },
    resources: [
      {
        self: {
          title: "LogLens — loglens-backend ingest/* (IngestSplitter, PartConsumer, IngestFinalizer), bench/BENCHMARKS.md, bench/results/chaos_*.json",
          minutes: 40,
          note: "Trace one redelivered part through PartConsumer by hand. Then read what your chaos run covered, and what it did not.",
        },
      },
      { video: "iRhDCIzhm4A" },
      { video: "GsZ_ZtlRCBg" },
      {
        doc: {
          title: "Exactly-once Semantics is Possible: Here's How Apache Kafka Does it",
          site: "confluent.io",
          url: "https://www.confluent.io/blog/exactly-once-semantics-are-possible-heres-how-apache-kafka-does-it/",
          minutes: 20,
          estimate: true,
          note: "Read it to see precisely what Kafka's guarantee excludes: side effects outside Kafka, such as your DB write.",
        },
      },
    ],
    questions: [
      "What exactly makes a redelivered part harmless in your pipeline? Walk the transaction.",
      "Why not Kafka transactions? What do they cover, and what do they not?",
      "A consumer crashes after the DB commit but before the offset commit. What happens? And in the opposite order?",
      "How does the streaming splitter keep heap constant on a 10 GB file? (Window-aligned byte ranges and ranged GETs.)",
      "Why one partition per API key? What does it cost you? (Parallelism capped by partition count; one hot key stalls its partition.)",
      "How do you know the fan-out to the LLM stage fires exactly once when the last part finishes? (The atomic claim in the finalizer.)",
      "What did your chaos benchmark show, and what failure did it not cover?",
      "Where does this break first at 100 times the volume?",
    ],
  },
  {
    id: "R4",
    section: "R",
    priority: "P0",
    title: "Blue Yonder agent — HITL, Base+Overlay writes, SQL safety",
    why: "This is the system you will be asked about longest, and its code is not on your machine to re-read, so rehearse it from memory at architecture level. Tool-using agents are probed on the same five things: what the model can change, who approves, what happens when approval never arrives, how a bad write is prevented, and how you measured the benefit.",
    flag: "Resume claims: LangGraph agent, hierarchy-aware PostgreSQL querying, Redis-staged writes with Base+Overlay persistence, human-in-the-loop approval via interrupts, minutes instead of multi-day tickets.",
    ceiling: {
      enough: "describe the design without confidential detail, name the guardrails in layers, and give one measured outcome.",
      tooDeep: "prompt wording and customer-specific schema.",
    },
    resources: [
      {
        self: {
          title: "Your Blue Yonder LangGraph agent — from memory",
          source: "Your own memory of the system",
          minutes: 45,
          note: "Architecture level only, nothing confidential. Write the answers down, then say them aloud.",
        },
      },
      { video: "phxEKe3ngK0", note: "A design walkthrough of a text-to-SQL agent. Compare its guardrails with yours." },
      { video: "xxqZzVZ4gE0", note: "14:21 HITL from a LangGraph perspective, 16:30 the interrupt workflow, 22:49 code. Hinglish." },
    ],
    questions: [
      "How does a planner's sentence become a safe update? What can the model change, and what is enforced in code?",
      "Is the “hierarchy-aware PostgreSQL querying” text-to-SQL? What stops a bad query? (Read-only role, allowlist, tenant scope in the database, timeout, row limit.)",
      "Base + Overlay with Redis-staged writes: what is staged, when does it commit, and what is the TTL?",
      "Two planners edit the same parameter at once. What happens?",
      "interrupt() re-runs the node from its start on resume. What did you have to make idempotent?",
      "The approver never responds. What happens to the staged write?",
      "The underlying data changed while the human was deciding. Now what?",
      "How did you measure “minutes instead of multi-day tickets”? Give the number.",
      "What did it get wrong in the first month, and what did you change?",
      "How do you trace a bad run, and how do you catch a regression when the prompt changes?",
    ],
  },
  {
    id: "R5",
    section: "R",
    priority: "P0",
    title: "Tell the story — a 90-second and a 5-minute version",
    why: "Interview guides frame the project round the same way: one system you understand end to end, your own responsibility, a baseline, the architecture decision, how you evaluated it, a launch guardrail, and a change driven by real feedback. Two scripts per project (DeepLogLens and the Blue Yonder agent) cover most openers, and they stop you rambling.",
    flag: "Both projects are on the resume; each will be asked about in your own words.",
    ceiling: {
      enough: "two scripts per project, spoken aloud once and recorded, with a number in each.",
      tooDeep: "polishing slides or a diagram you will never draw in the interview.",
    },
    resources: [
      {
        self: {
          title: "Your two projects — the scripts",
          source: "Your own words",
          minutes: 60,
          note: "For each: problem, baseline, key design decision, how you evaluated it, a guardrail, a change after real feedback or failure. Write both versions, say them aloud, record yourself once, cut the filler.",
        },
      },
      { video: "PG4t_6qjxz0", note: "Generic and a few years old, but sound on structure. Apply it to AI projects." },
      {
        doc: {
          title: "AI Engineer Interview Questions 2026: RAG, Agents, Evals, and Production Systems",
          site: "prachub.com",
          url: "https://prachub.com/resources/ai-engineer-interview-questions-2026-rag-agents-evals-and-production-systems",
          minutes: 25,
          estimate: true,
          note: "Practice material, not leaked questions. Read the project-ownership and ship-decision entries.",
        },
      },
      {
        doc: {
          title: "How to explain a RAG project in an AI/ML interview",
          site: "faceprep.in",
          url: "https://faceprep.in/article/how-to-explain-a-rag-project-in-an-ai-ml-interview-2026/",
          minutes: 10,
          estimate: true,
        },
      },
    ],
    questions: [
      "Walk me through an AI system you shipped, end to end.",
      "What was the baseline, and how did you know the AI version was better?",
      "What was your specific contribution, as opposed to the team's?",
      "What broke in production, and what did you change?",
      "Why build this instead of using a managed service?",
      "What would you do differently?",
      "A customer says the bot “feels dumb”. What do you change first?",
    ],
  },

  // ─── A · RAG ──────────────────────────────────────────────────────────────
  {
    id: "A2",
    priority: "P0",
    why: "Your resume claims per-session HNSW tables to avoid filtered-ANN recall loss, so “pre-filter vs post-filter” will be asked live. Know HNSW well enough to explain m, ef_construction and ef_search, and why a filter applied after the index search throws away results the index had already narrowed.",
    resources: [
      { video: "77QH0Y2PYKg" },
      { video: "QvKMwLjdK-s" },
      {
        video: "H_kJDHvu-v8",
        note: "02:03–12:22 is the concept: why filter, pre-filter, post-filter, single-stage. The rest is Pinecone API code you can skip.",
      },
    ],
    extraQuestions: [
      "pgvector 0.8 added iterative index scans. What problem do they address, and how is that different from your per-session tables?",
    ],
  },
  {
    id: "A3",
    priority: "P0",
    why: "Hybrid and RRF are on your resume. Expect: when keyword wins and when vector wins, the RRF formula, why a cross-encoder can rerank but cannot retrieve, and, because your own numbers show hybrid's MRR below full-text's, what you would add. Reranking is not free: know its p99 cost and when to skip it.",
    resources: [
      { video: "6dDvfGrxFns" },
      { video: "K1F8BIgcoNk" },
      { video: "7ZU85v4Kt-Y", note: "A sceptical test of whether rerankers help. Use it for “when is reranking not worth it?”." },
    ],
  },
  {
    id: "A4",
    priority: "P0",
    why: "Corrective RAG is on your resume, so draw the graph from memory: retrieve, grade, rewrite, re-retrieve, with the loop bounded. Yours caps rewrites at 2 and falls back to the first useful retrieval, so a bad grader cannot force an empty answer. Expect the cost question: every grade and every rewrite is another LLM call.",
    resources: [{ video: "pbAd8O1Lvm4" }, { video: "E2shqsYwxck" }],
  },
  {
    id: "A6",
    section: "A",
    priority: "P1",
    title: "RAG end to end — what happens between Enter and the answer",
    why: "The standard phone-screen question: “you have a 200-page PDF and a question; what happens between pressing Enter and the answer coming back?” It tests whether you can walk load, split, embed, index, retrieve, prompt and generate in about three minutes, with a deliberate choice at each step. Four short videos from the LangChain engineer who teaches RAG-from-scratch.",
    ceiling: {
      enough: "walk the pipeline in order and name one deliberate choice per stage: chunk size, embedder, k, prompt.",
      tooDeep: "framework APIs, and the query-translation variants (do those later).",
    },
    resources: [{ video: "wd7TZ4w1mSw" }, { video: "bjb_EMsTDKI" }, { video: "LxNVgdIz9sU" }, { video: "Vw52xyyFsB8" }],
    questions: [
      "You have a 200-page PDF and a question. What happens between pressing Enter and the answer coming back?",
      "Where does the latency go in that path, stage by stage?",
      "Which stages would you cache, and what invalidates each cache?",
      "The PDF is edited tomorrow. What has to change in the index?",
      "How do you choose k?",
      "When would you not use RAG at all? (The document fits in the context window; the facts change faster than the index.)",
      "How do you make the answer cite its sources, and verify the citations are real?",
    ],
  },
  {
    id: "A1",
    priority: "P1",
    why: "Chunking is the first “next layer” question after the RAG diagram. Fixed 512-token windows are the lazy default and can split sentences; structure-aware chunking usually does better at the cost of more code. Your own eval shows why it matters: LogLens chunks average ~15.7K characters while the embedder sees ~512 tokens.",
    resources: [
      { video: "Pk2BeaGbcTE" },
      { video: "sNa_uiqSlJo", note: "The embeddings half: what a vector is and how similarity search uses it." },
      { video: "tmiBae2goJM", note: "Contextual retrieval: prefixing each chunk with context before embedding." },
    ],
    extraQuestions: [
      "Your chunks average ~15.7K characters but the embedder reads ~512 tokens. What does vector search actually see, and what would you change?",
    ],
  },
  {
    id: "A5",
    priority: "P1",
    why: "“The right document exists but the answer is wrong; debug it” is a standard question. Strong answers split the pipeline stage by stage (ingestion, freshness, filters, chunking, query rewrite, retrieval, rerank, context assembly, generation) and measure retrieval and generation separately before touching a prompt.",
    resources: [
      { video: "TRjq7t2Ms5I" },
      { video: "N9SZ9o2gReE", note: "04:36 how DCG and NDCG work; 18:11 “the first thing to do on any RAG team”; 37:02 the inner and outer loops of retrieval quality." },
      { video: "Kf3LeaUGwlg" },
      {
        course: {
          title: "Systematically Improving RAG Applications",
          site: "Maven · Jason Liu",
          url: "https://maven.com/applied-llms/rag-playbook",
          paid: true,
          note: "Paid cohort course. Optional: the free videos above cover what a 2-year loop asks. Check the page for the current price and dates.",
        },
      },
    ],
  },

  // ─── C · Is my AI actually working? ───────────────────────────────────────
  {
    id: "C2",
    priority: "P0",
    why: "“Who judges the judge?” is the follow-up to every LLM-as-judge claim, and that claim is on your resume. Strong answers treat the judge as a measurement instrument: a task-specific rubric, a check for order and verbosity bias, agreement with human labels, disagreements investigated by slice, and recalibration after a model or prompt change.",
    resources: [
      { video: "trfUBIDeI1Y" },
      { video: "mF4CaijvJos", note: "A case study. 19:05 calibrating judges against production; 20:44 judges as a CI gate and on daily production samples." },
      { video: "OJItZndMUII", note: "Free preview of the course below: chapters 1–3 of 8." },
      {
        doc: {
          title: "LLM Evals: Everything You Need to Know (FAQ)",
          site: "hamel.dev",
          url: "https://hamel.dev/blog/posts/evals-faq/",
          minutes: 30,
          estimate: true,
          note: "Short answers on judges, error analysis, golden-set size and agreement.",
        },
      },
      {
        course: {
          title: "AI Evals For Engineers & PMs",
          site: "Maven · Hamel Husain & Shreya Shankar",
          url: "https://maven.com/parlance-labs/evals",
          paid: true,
          note: "Paid, $4,200 on the course page on 2026-10-23, with cohorts listed for Oct–Nov 2026 and Jan–Mar 2027. Optional. The free preview above and the FAQ cover most of it.",
        },
      },
    ],
    extraQuestions: [
      "40 items, the judge and you agree on 34, and both label half the items pass. Compute Cohen's kappa. (p_o = 0.85, p_e = 0.5, so kappa = 0.70.)",
    ],
  },
  {
    id: "C1",
    priority: "P1",
    why: "Evals are the round people fail most often. Start with the four RAG metrics (faithfulness, answer relevancy, context precision, context recall) and the ranking metrics (recall@k, MRR, nDCG), and be able to diagnose a system from its scores.",
    resources: [
      { video: "7_LTU0LA374" },
      { video: "2XegvMul_mE", note: "The ranking metrics: MRR, MAP and NDCG, with worked examples." },
      { video: "5fp6e5nhJRk" },
      {
        course: {
          title: "Building and Evaluating Advanced RAG Applications",
          site: "DeepLearning.AI · LlamaIndex & TruEra",
          url: "https://www.deeplearning.ai/courses/building-evaluating-advanced-rag",
          minutes: 125,
          estimate: true,
          note: "About 2 hours; teaches the RAG triad (context relevance, groundedness, answer relevance). DeepLearning.AI marks some items PRO, so check what is free.",
        },
      },
    ],
    extraQuestions: [
      "A query has three relevant chunks at ranks 2, 7 and 11. Compute recall@5, MRR and the rank-based part of nDCG@10 by hand.",
    ],
  },
  {
    id: "C3",
    priority: "P1",
    why: "Three layers: offline evals gate merges, online evals sample production, monitoring alerts on drift. The question that sounds senior is “the provider silently updated the model; how do you find out before your users do?”.",
    resources: [
      { video: "iEgjJyk3aTw" },
      { video: "2E8iTvGo9Hs" },
      { video: "vuBvf7ZRKTA" },
      { video: "nbZzSC5A6hs" },
    ],
  },

  // ─── B · LangChain + LangGraph ────────────────────────────────────────────
  {
    id: "B2",
    priority: "P0",
    baseKind: "course",
    why: "“Human-in-the-loop via LangGraph interrupts” is a resume claim, so expect the mechanics: a checkpointer is required, resume is by thread_id, and on resume the node re-runs from its start, so anything before the interrupt must be idempotent. And the question your own system makes personal: the human never answers, so what happens to the staged write?",
    resources: [
      { video: "6t7YJcEFUIY" },
      {
        video: "_IPP7_Bi8uA",
        note: "14:50 checkpointer, 20:10 threads, 38:05 fault tolerance, 44:28 human in the loop. Hinglish.",
      },
    ],
    extraQuestions: [
      "interrupt() re-runs the node from the top on resume. What does that mean for a node that writes to Redis before the interrupt?",
    ],
  },
  {
    id: "B3",
    priority: "P1",
    why: "“Workflow or agent: which is your default?” separates people who have shipped agents from people who have read about them. The answer interviewers reward is the simplest thing that works, with budgets, stop conditions and approval points. Also expect to write a tool-calling loop with a step cap and no framework.",
    resources: [{ video: "D7_ipDqhtwk" }, { video: "gMeTK6zzaO4" }],
  },
  {
    id: "B1",
    priority: "P1",
    why: "LangChain is on your skills line, so “LangChain vs LangGraph: when each, and would you use LangChain in production?” is a near-certain opener. The credible answer names what the abstraction buys (streaming, batching, tracing) and what it costs when you debug.",
    resources: [{ video: "qAF1NjEVHhY" }, { video: "O0dUOtOIrfs" }],
  },
  {
    id: "B4",
    priority: "P2",
    why: "Memory is asked as “thread-scoped vs cross-thread” and as “the conversation exceeds the context window: three strategies, three tradeoffs”. Low weight in a backend-leaning loop, but know the vocabulary.",
    resources: [{ video: "JTL0yp85FsE" }, { video: "hE8C2M8GRLo" }],
  },

  // ─── D · Production essentials ────────────────────────────────────────────
  {
    id: "D2",
    priority: "P0",
    why: "Guarded SQL and structured output are on your resume. The answer to “how do you stop the model writing DROP TABLE?” is layers, not a prompt: AST validation, a read-only role, a table allowlist, tenant scope enforced in the database, a statement timeout and a row limit.",
    resources: [{ video: "S5ezVVJhQmE" }, { video: "xpvFinvqRCA" }],
  },
  {
    id: "D1",
    priority: "P2",
    why: "Indirect prompt injection (instructions hidden in retrieved text or tool output) is the threat to know for RAG and agents. The line interviewers want: a prompt instruction is not an access control; authorise at retrieval time and at action time.",
    resources: [
      { video: "FgxwCaL6UTA" },
      { video: "gUNXZMcd2jU", note: "A tour of the OWASP LLM risks. Prompt injection is the one to keep." },
      {
        doc: {
          title: "The lethal trifecta for AI agents",
          site: "simonwillison.net",
          url: "https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/",
          minutes: 10,
          estimate: true,
          note: "Private data, untrusted content and a way to communicate out: remove one of the three.",
        },
      },
    ],
  },
  {
    id: "D3",
    priority: "P2",
    why: "Where latency and money go: input tokens, output tokens, time to first token against total time, and what caching changes. “Quality improved but latency and cost are too high; what do you do?” is the standard prompt. Answer with a latency breakdown and interventions you test on the same eval set.",
    resources: [{ video: "SkM4k4SKvCM" }, { video: "u57EnkQaUTY" }],
    extraQuestions: [
      "Quality improved but p95 latency doubled and cost tripled. What do you do, in order?",
      "Define “cost per resolved task” and say why it beats cost per request.",
    ],
  },

  // ─── E · Python for AI engineers ──────────────────────────────────────────
  {
    id: "E1",
    section: "E",
    priority: "P1",
    title: "asyncio and concurrency for LLM calls",
    why: "AI roles code live in Python, and your resume is Java-first. Know the event loop, gather against TaskGroup, and how to fan out many embedding or LLM calls under a rate limit with a semaphore. Your key-pool and rate-limit work is the real-world version of this.",
    ceiling: {
      enough: "explain the event loop, write gather with a semaphore and a timeout, and know when asyncio does not help (CPU-bound work).",
      tooDeep: "writing your own event loop; protocols and transports.",
    },
    resources: [
      { video: "Qb9s3UiMSTA" },
      { video: "luWsr9exlE4", note: "Rate limiting with a semaphore: the exact pattern for a batch of embedding calls." },
      {
        doc: {
          title: "Coroutines and Tasks (gather, TaskGroup, timeouts)",
          site: "docs.python.org",
          url: "https://docs.python.org/3/library/asyncio-task.html",
          minutes: 20,
          estimate: true,
        },
      },
    ],
    questions: [
      "What does await actually do? What blocks the event loop?",
      "Fan out 500 embedding calls with at most 20 in flight and a per-call timeout. Write it.",
      "gather vs TaskGroup: what happens to the other tasks when one raises?",
      "Threads, asyncio or multiprocessing for: 1,000 HTTP calls; parsing PDFs; numpy-heavy scoring?",
      "What is the GIL, and does it matter for a service that mostly waits on LLM calls?",
      "A 429 arrives mid-batch. Retry with backoff and jitter. What goes wrong if every worker retries at the same moment?",
      "How do you stream tokens to a client while the model is still generating?",
    ],
  },
  {
    id: "E2",
    section: "E",
    priority: "P1",
    title: "FastAPI, pydantic and streaming",
    why: "Your orchestrator is FastAPI plus LangGraph in Python, so expect to sketch an LLM-backed endpoint: schema validation, dependency injection, async handlers, streaming the answer over SSE, and timeouts.",
    ceiling: {
      enough: "sketch an endpoint that validates input, calls a model and streams the answer, and say how it fails.",
      tooDeep: "ASGI internals; writing middleware from scratch.",
    },
    resources: [
      { video: "8TMQcRcBnW8", note: "0:00–54:37 covers routes, Pydantic schemas, CRUD, middleware and CORS. Skip the deploy section." },
      { video: "7aBRk_JP-qY" },
      { video: "xTTtqwGWemw", note: "Token streaming: the part interviewers ask you to sketch." },
    ],
    questions: [
      "Sketch an endpoint that takes a question and streams the answer. What does the client receive, and in what format?",
      "SSE or WebSockets for token streaming? Why?",
      "Where do you validate the model's JSON, and what do you do when it fails? (pydantic; one bounded retry; then a clean error.)",
      "What does Depends give you? How would you inject a DB connection and an LLM client so tests can replace them?",
      "A synchronous library call sits inside an async endpoint. What happens, and what is the fix?",
      "How do you time out and cancel a slow LLM call without leaking the connection?",
    ],
  },
  {
    id: "E3",
    section: "E",
    priority: "P1",
    title: "From-scratch drills — the thing under the framework",
    why: "Live-coding rounds ask for what sits under the framework: a retriever, BM25, RRF, a chunker, a retry wrapper, an agent loop. Build each in under 30 minutes, with one test. The card is the drill; the videos are the safety net.",
    ceiling: {
      enough: "each one runs, has a test, and you can explain every line.",
      tooDeep: "optimising for speed; building a vector database.",
    },
    resources: [
      {
        self: {
          title: "Build all nine drills below, in Python, each with one test",
          minutes: 180,
          note: "Thirty minutes each, no framework. Keep them in one repo; they double as interview talking points.",
        },
      },
      {
        video: "sVcwVQRHIc8",
        note: "Code along with 0:00–0:22 (indexing, retrieval, generation) and 0:28 RAG Fusion (RRF). CRAG is at 1:26:32 and Adaptive RAG at 1:44:09.",
      },
      { video: "5hnt-bWeeOM", note: "A ReAct agent in plain Python. Watch it, then rebuild it without looking." },
      { video: "TW9vHU1GpU4" },
      {
        doc: {
          title: "Exponential Backoff And Jitter",
          site: "aws.amazon.com",
          url: "https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/",
          minutes: 10,
          estimate: true,
          note: "Why full jitter beats plain backoff when many clients retry together.",
        },
      },
    ],
    questions: [
      "Cosine top-k over 10,000 vectors with numpy and no Python loop. Then normalise at index time and use a dot product: why is it equivalent?",
      "BM25 over a small corpus: write idf, term-frequency saturation (k1) and length normalisation (b). Compare it with TF-IDF on three queries.",
      "Reciprocal Rank Fusion of two ranked lists with k = 60. What happens to an item that appears in only one list?",
      "A text chunker with overlap that counts tokens, not characters, and never splits mid-sentence.",
      "Retry with exponential backoff and full jitter, only on 429 and 5xx, honouring Retry-After.",
      "Async batched embedding calls: a semaphore for concurrency, a token bucket for rate, results returned in input order.",
      "An LRU cache with a TTL. Then a semantic cache keyed by embedding similarity: when is it dangerous?",
      "A minimal agent loop: model call, tool call, append the result, repeat, with a step cap and a token budget. What do you return when the cap is hit?",
      "Parse a model's JSON reply with pydantic. On failure retry once with the error message, then give up cleanly.",
    ],
  },

  // ─── F · LLM fundamentals ─────────────────────────────────────────────────
  {
    id: "F1",
    section: "F",
    priority: "P1",
    title: "Tokens, context windows, sampling and hallucination",
    why: "The LLM-basics round is short but unforgiving of vagueness: tokens against words, why long context costs more, what temperature changes, and why temperature 0 still is not deterministic. Karpathy's one-hour talk is the best single use of an hour here.",
    ceiling: {
      enough: "explain tokenisation, context windows, the KV cache, sampling and hallucination in plain words, with one example each.",
      tooDeep: "attention maths, positional encodings, training objectives.",
    },
    resources: [
      { video: "LPZh9BOjkQs" },
      {
        video: "zjkBMFhNj_g",
        note: "00:00–17:52 how they work; 27:43 tool use; 45:43–58:37 security (jailbreaks, and prompt injection at 51:30). Skip the appendix.",
      },
      { video: "-BBulGM6xF0" },
      { video: "cfqtFvWOfg0" },
      { video: "o0gkdZBtwEg" },
    ],
    questions: [
      "Why do token counts differ from word counts, and why does it matter for cost and for chunking?",
      "Why does a longer prompt cost more latency and money? What is the KV cache?",
      "What do temperature, top-p and top-k change? Why is temperature 0 still not fully deterministic?",
      "Name three causes of hallucination and one mitigation for each.",
      "What is the context window, and what happens at its limit?",
      "Prompting, RAG or fine-tuning: one sentence on when each.",
      "Why do different providers report different token counts for the same text?",
    ],
  },
  {
    id: "F2",
    section: "F",
    priority: "P1",
    title: "Prompting and context engineering",
    why: "Context engineering (what goes in the window, in what order, and what gets trimmed) has replaced “prompt tricks” as the senior framing. Expect: structure the prompt for caching with static content first, when to summarise and when to trim, and how you choose between prompting, RAG and fine-tuning.",
    ceiling: {
      enough: "order a RAG prompt for cost and quality, and give three ways to handle a conversation that outgrows the window.",
      tooDeep: "prompt-optimisation research; automatic prompt search.",
    },
    resources: [
      { video: "4GiqzUHD5AA" },
      { video: "zYGDpG-pTho" },
      {
        doc: {
          title: "Effective context engineering for AI agents",
          site: "anthropic.com",
          url: "https://www.anthropic.com/research/effective-context-engineering-for-ai-agents",
          minutes: 25,
          estimate: true,
        },
      },
    ],
    questions: [
      "What is the difference between prompt engineering and context engineering?",
      "Order the parts of a RAG prompt for cost and quality: system, schema, examples, retrieved chunks, question. Why that order?",
      "The conversation exceeds the window. Three strategies and the tradeoff of each. (Trim, summarise, retrieve.)",
      "When would you fine-tune instead of using RAG? Give a case RAG cannot solve.",
      "How do you version prompts so a regression can be traced to a change?",
    ],
  },

  // ─── G · LLM system design ────────────────────────────────────────────────
  {
    id: "G1",
    section: "G",
    priority: "P2",
    title: "Design: enterprise document Q&A (tenants, permissions, freshness)",
    why: "The canonical applied-AI design question. Strong answers cover ingestion and freshness (change capture, deletes, re-indexing), access control at retrieval time, multi-tenancy, a latency budget and an eval plan, not only the box diagram.",
    ceiling: {
      enough: "a 35-minute design with the data flow, one permission model, a latency budget and an eval plan.",
      tooDeep: "sizing GPUs; vendor comparisons.",
    },
    resources: [
      {
        video: "S6jy0T85DFs",
        note: "05:58 gateway and auth, 10:53 guardrails, 13:59 semantic cache, 17:15 data freshness and CDC, 21:01 human in the loop, 23:15 model router, 30:03 fallback provider, 35:14 observability.",
      },
      { video: "NQZqET-jjws" },
      { video: "4VBHpziqw3o" },
      {
        doc: {
          title: "Patterns for Building LLM-based Systems & Products",
          site: "eugeneyan.com",
          url: "https://eugeneyan.com/writing/llm-patterns/",
          minutes: 40,
          estimate: true,
          note: "Seven patterns: evals, RAG, fine-tuning, caching, guardrails, defensive UX and user feedback.",
        },
      },
    ],
    questions: [
      "Design document Q&A for 500 tenants and 10M documents. Walk me from ingestion to answer.",
      "A user may only see documents they have permission for. Where is that enforced, and why not in the prompt?",
      "A document is deleted or updated. How does the index stay correct?",
      "How do you keep tenant A's chunks out of tenant B's results: table per tenant, partition, or filter? Tradeoffs.",
      "Set a latency budget for the whole path. Where do the milliseconds go?",
      "How do you know the system is helping and not making things worse?",
      "What is your fallback when the vector store or the LLM provider is down?",
    ],
  },
  {
    id: "G2",
    section: "G",
    priority: "P2",
    title: "Design: support assistant with evals and human handoff",
    why: "“Design a support assistant; how do you know it is helping and not making things worse?” is the eval-centred design round. Define success first (resolution rate, escalation rate, satisfaction), baseline against humans, and ship behind shadow traffic or a small cohort with rollback thresholds.",
    ceiling: {
      enough: "name the success metric and baseline, the handoff rule, the launch plan and the rollback trigger.",
      tooDeep: "building the ticketing integration.",
    },
    resources: [{ video: "un1IJdX-ImQ" }, { video: "CyLYY_xb5bQ" }, { video: "_Er8Hao_gmQ" }],
    questions: [
      "Design a support assistant. How do you know it is helping and not making things worse?",
      "Define the success metric and the baseline before building anything. What are they?",
      "When does the bot hand off to a human, and how is the context passed on?",
      "A stakeholder wants to ship but the evidence is weak. What do you say, and what bounded launch do you propose?",
      "A model update makes answers worse in one product area. How do you detect it, and how do you roll back?",
      "How do you measure cost per resolved ticket?",
    ],
  },
  {
    id: "G3",
    section: "G",
    priority: "P2",
    title: "Design: tool-using agent with approvals",
    why: "Agent design questions test controls more than cleverness: tool schemas, least-privilege access, step and spend limits, idempotent tools, approval points, and verifying the outcome in the system of record. Your Blue Yonder agent is the reference answer.",
    ceiling: {
      enough: "list the controls, say which ones are enforced in code, and say how you would test the agent before launch.",
      tooDeep: "multi-agent research architectures.",
    },
    resources: [{ video: "mwN75EiGfCE" }, { video: "I4sGn8Z1vpI" }],
    questions: [
      "Design an agent that can read and update inventory parameters. What can it do on its own, and what needs approval?",
      "How do you cap steps, tokens and spend per request?",
      "A tool call times out and the agent retries. How do you make sure a write is not applied twice?",
      "How do you verify the agent's claim of success? (In the system of record.)",
      "How do you test an agent before launch? (Replay fixed cases; check the trajectory, not only the final answer.)",
      "Which tools get which permissions, and where is that enforced?",
      "What do you trace so a run can be debugged after the fact?",
    ],
  },
  {
    id: "G4",
    section: "G",
    priority: "P2",
    title: "Design: batch pipeline and LLM gateway",
    why: "This is your strongest ground (Kafka, rate limits, key pools, idempotency), applied to LLMs. Be able to describe the pipeline (queue, workers, retries, dead-letter queue, a rate budget per key) and a gateway that routes between providers with fallbacks, budgets and caching.",
    ceiling: {
      enough: "describe the pipeline and the gateway from your own code, and name what goes wrong with naive fallback.",
      tooDeep: "building a gateway product.",
    },
    resources: [
      {
        self: {
          title: "LogLens — loglens-backend llm/ (LlmGateway, ApiKeyManager, EmbeddingKeyPool) and enrich/ (EnrichConsumer, RetryConsumer, DLQ)",
          minutes: 30,
          note: "You built the reference answer. Re-read it so you can describe it without notes.",
        },
      },
      { video: "mwP4sdp7gW0" },
      { video: "YXkOdWBwqaA" },
      {
        doc: {
          title: "Building A Generative AI Platform",
          site: "huyenchip.com",
          url: "https://huyenchip.com/2024/07/25/genai-platform.html",
          minutes: 40,
          estimate: true,
          note: "Gateway, guardrails, caching and orchestration as one platform diagram.",
        },
      },
    ],
    questions: [
      "Embed and summarise 50M documents overnight. Design the pipeline.",
      "Providers rate-limit per key. How do you stay under it, and what do you do on a 429?",
      "Design an LLM gateway: routing, fallbacks, budgets, caching, logging. What goes wrong with naive fallback? (Quality drift, different schemas and tokenisers, doubled latency and cost.)",
      "How do you cap spend per tenant?",
      "How would you add semantic caching, and what can go wrong?",
      "Where do poison messages go, and how do you replay them?",
      "How do you version prompts and models together so a rollout can be rolled back?",
    ],
  },

  // ─── H · Beyond the core ──────────────────────────────────────────────────
  {
    id: "H2",
    section: "H",
    priority: "P3",
    title: "MCP, and calling provider APIs directly",
    why: "Interviewers increasingly test “without framework hand-waving”: call the provider's tool-use API yourself, and know the MCP vocabulary of tools, resources, prompts and transports. Check the current spec before quoting details.",
    ceiling: {
      enough: "explain what MCP adds over plain function calling, and write a tool-calling loop against a provider SDK.",
      tooDeep: "writing an MCP server; the transport specification.",
    },
    resources: [
      { video: "tzrwxLNHtRY" },
      { video: "CQywdSdi5iA" },
      {
        course: {
          title: "Introduction to Model Context Protocol",
          site: "Anthropic Academy",
          url: "https://anthropic.skilljar.com/introduction-to-model-context-protocol",
          minutes: 90,
          estimate: true,
          note: "Free, self-paced; builds an MCP server and client in Python. Listings put it at 1–2 hours.",
        },
      },
      {
        doc: {
          title: "What is the Model Context Protocol?",
          site: "modelcontextprotocol.io",
          url: "https://modelcontextprotocol.io/docs/getting-started/intro",
          minutes: 15,
          estimate: true,
        },
      },
    ],
    questions: [
      "What problem does MCP solve that plain function calling does not?",
      "Tools, resources and prompts in MCP: one example of each.",
      "How do you treat a third-party MCP server's tool descriptions? (As untrusted input: they are a prompt-injection surface.)",
      "Write a tool-calling loop against a provider SDK with no framework.",
      "When would you use the stdio transport and when HTTP?",
    ],
  },
  {
    id: "H1",
    section: "H",
    priority: "P3",
    title: "Fine-tuning basics (conceptual)",
    why: "Asked as “when would you fine-tune instead of using RAG?”, not as a training exercise. One paragraph each on SFT, LoRA and QLoRA, preference tuning (RLHF, DPO) and distillation is the whole ceiling for an application-layer role at this level.",
    ceiling: {
      enough: "know what each technique changes, and when it beats RAG or prompting.",
      tooDeep: "training loop internals, hyperparameter tuning, GPU memory arithmetic.",
    },
    resources: [{ video: "DhRoTONcyZE" }, { video: "t1caDsMzWBk" }, { video: "qPN_XZcJf_s" }, { video: "k2pD3k1485A" }],
    questions: [
      "When would you fine-tune instead of using RAG? Give a case RAG cannot solve.",
      "What does LoRA change, and why is it cheaper than full fine-tuning?",
      "QLoRA in one sentence.",
      "SFT, RLHF and DPO: what does each optimise?",
      "Fine-tuning for new facts against fine-tuning for style or format: which works?",
      "How would you evaluate a fine-tuned model against the base model plus a good prompt?",
    ],
  },
  {
    id: "H3",
    section: "H",
    priority: "P3",
    title: "Inference serving concepts — batching, KV cache, vLLM",
    why: "Conceptual only: “design a batching system for LLM inference” has been reported in 2026 applied-AI loops. Know why requests are batched continuously, what the KV cache holds and what PagedAttention fixes, then say plainly that you have not served models yourself.",
    ceiling: {
      enough: "explain continuous batching, the KV cache and PagedAttention in a few sentences each.",
      tooDeep: "CUDA kernels, tensor parallelism, speculative decoding internals.",
    },
    resources: [
      { video: "615-yWyS1n0" },
      { video: "6uPnLkCiy5g" },
      { video: "McLdlg5Gc9s" },
      {
        doc: {
          title: "vLLM: Easy, Fast, and Cheap LLM Serving with PagedAttention",
          site: "vllm.ai",
          url: "https://vllm.ai/blog/2023-06-20-vllm",
          minutes: 15,
          estimate: true,
        },
      },
    ],
    questions: [
      "Why batch LLM requests, and why is static batching wasteful?",
      "What does the KV cache store, and why does it grow with context length?",
      "What problem does PagedAttention solve?",
      "Time to first token against inter-token latency: what drives each?",
      "Design a batching layer in front of a GPU server. What do you trade off?",
      "Have you served a model yourself? (Say what is true: application layer, concepts understood.)",
    ],
  },
  {
    id: "H4",
    section: "H",
    priority: "P3",
    title: "Classical ML metrics refresher",
    why: "Only for “ML Engineer” job descriptions; backend-leaning GenAI roles rarely go beyond precision, recall and F1. Half an hour so a metrics question never catches you cold.",
    ceiling: {
      enough: "precision, recall, F1 and AUC with one example each, and how they map to precision@k and recall@k.",
      tooDeep: "deriving losses; model-selection theory.",
    },
    resources: [{ video: "4jRBRDbJemM" }, { video: "2osIZ-dSPGE" }],
    questions: [
      "Precision against recall: give an example where each matters more.",
      "What is F1, and why not accuracy on imbalanced data?",
      "What does AUC measure?",
      "How do precision and recall map to precision@k and recall@k in retrieval?",
      "Bias against variance, in two sentences.",
    ],
  },
];
