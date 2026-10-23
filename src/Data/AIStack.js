// AI Stack — the GenAI topic set, one card per topic.
//
// GENERATED FILE. Edit scripts/data/aiStackMap.mjs (what to study and in what
// order), scripts/data/genaiPrepMap.md (the original fifteen topics and the skip
// list) or scripts/data/aiStackVideos.csv (written by scripts/verifyAIVideos.mjs)
// and re-run `node scripts/genAIStack.mjs` — do not edit here.
//
// Every video is resolved against the CSV at generation time and the build fails
// on a miss, so no title, channel or runtime on this page is invented. Resources
// with kind "self" have no link on purpose: they are your own code or your own
// memory, and only that answers those questions. Paid courses say so in their
// source line. Topics are ordered by section, then priority.

export const AI_STACK_SECTIONS = [
  {
    "key": "R",
    "label": "Your systems — resume defence",
    "chip": "Resume"
  },
  {
    "key": "A",
    "label": "RAG",
    "chip": "RAG"
  },
  {
    "key": "C",
    "label": "Is my AI actually working?",
    "chip": "Evals"
  },
  {
    "key": "B",
    "label": "LangChain + LangGraph",
    "chip": "LangGraph"
  },
  {
    "key": "D",
    "label": "Production essentials",
    "chip": "Production"
  },
  {
    "key": "E",
    "label": "Python for AI engineers",
    "chip": "Python"
  },
  {
    "key": "F",
    "label": "LLM fundamentals",
    "chip": "LLMs"
  },
  {
    "key": "G",
    "label": "LLM system design",
    "chip": "Design"
  },
  {
    "key": "H",
    "label": "Beyond the core",
    "chip": "Beyond"
  }
];

export const AI_STACK_TOPICS = [
  {
    "id": "R1",
    "section": "R",
    "sectionLabel": "Your systems — resume defence",
    "priority": "P0",
    "title": "DeepLogLens — the numbers and the judge",
    "why": "Every AI loop opens with “walk me through a system you shipped”, then asks how you measured it. Your LogLens eval harness is the answer most candidates cannot give, and three things in it will be probed: the LLM-call reduction figure (resume says 80%, the README ~90%, your own eval measured 77.8%), a judge nobody has checked against human labels, and answer-quality metrics that exist only as a dry run.",
    "resumeLinked": true,
    "flag": "Resume claims: ~80% fewer LLM calls, an LLM-as-judge groundedness loop, hybrid search.",
    "ceiling": {
      "enough": "say the number and where it came from, name the judge's biases and what you did about them, and state what your golden set cannot tell you.",
      "tooDeep": "inter-annotator-agreement theory beyond Cohen's kappa."
    },
    "resources": [
      {
        "id": "R1-r1",
        "kind": "self",
        "title": "LogLens — evals/README.md, evals/results/*/REPORT.md, evals/thresholds.json",
        "source": "Your own codebase",
        "minutes": 45,
        "note": "Read your own reports first. Then run run_llm_evals.py with --judge anthropic, export 40 items with --export-judge-sample, label them yourself and run --kappa. Count how often the grounding loop force-accepts (grounded=false is already stored)."
      },
      {
        "id": "R1-r2",
        "kind": "video",
        "title": "LLM Evals: Common Mistakes",
        "source": "Hamel Husain",
        "url": "https://www.youtube.com/watch?v=GL0XhAj5LPE",
        "minutes": 28,
        "note": "Hold your harness up against each mistake he lists: generic metrics, unvalidated judges, no error analysis."
      }
    ],
    "minutes": 73,
    "duration": "1h 13m",
    "questions": [
      "How did you get “~80% fewer LLM calls”? Where does the number come from, and on what data?",
      "Your retrieval eval has full-text search beating vector search at recall@10. Why ship hybrid at all?",
      "Is your LLM judge any good? How do you know — against what?",
      "The production grounding check uses the same model family as the generator. What is the risk?",
      "What happens when the grounding loop never passes? How often does that happen?",
      "Your golden set is synthetic and labelled by the generator. What can it not tell you?",
      "You report recall@k on 51 answerable questions. How much do you trust a 0.02 difference?",
      "You have one week. How do you prove faithfulness on real answers?"
    ]
  },
  {
    "id": "R2",
    "section": "R",
    "sectionLabel": "Your systems — resume defence",
    "priority": "P0",
    "title": "DeepLogLens — retrieval: hybrid, per-session HNSW, RRF",
    "why": "“Hybrid search, pgvector” is on your resume, so expect “did hybrid beat vector-only, and by how much?”. Your eval answers it: on log data full-text wins recall@10 (0.78 against 0.39 for vector-only, with bge-small standing in for the production embedder), hybrid wins recall@30 (0.87 against 0.85) but loses MRR to full-text (0.45 against 0.61). That gap is the argument for a reranker.",
    "resumeLinked": true,
    "flag": "Resume claims: hybrid vector + full-text search, pgvector, per-session HNSW/GIN-indexed chunk tables.",
    "ceiling": {
      "enough": "quote your own numbers, explain why logs favour lexical search, and say what you would add next.",
      "tooDeep": "ANN algorithm proofs; embedding model training."
    },
    "resources": [
      {
        "id": "R2-r1",
        "kind": "self",
        "title": "LogLens — rag-orchestrator/app/db.py (retrieve_chunks, _rrf_fuse), evals/run_retrieval.py, evals/results/retrieval/*/REPORT.md",
        "source": "Your own codebase",
        "minutes": 40,
        "note": "Add a cross-encoder reranker after RRF, re-run run_retrieval.py and write down MRR before and after."
      },
      {
        "id": "R2-r2",
        "kind": "video",
        "title": "PostgreSQL Hybrid Search Course – Keyword (BM25) + Vector Retrieval",
        "source": "freeCodeCamp.org",
        "url": "https://www.youtube.com/watch?v=kT7nXO32L-Q",
        "minutes": 60,
        "note": "07:20 BM25 (IDF, term frequency, document length); 27:40 BM25 inside Postgres; 43:28 Reciprocal Rank Fusion. It is your stack: Postgres plus pgvector."
      },
      {
        "id": "R2-r3",
        "kind": "doc",
        "title": "Hybrid Search in PostgreSQL: The Missing Manual",
        "source": "paradedb.com",
        "url": "https://www.paradedb.com/blog/hybrid-search-in-postgresql-the-missing-manual",
        "minutes": 20,
        "estimate": true,
        "note": "Why ts_rank is not BM25, and how RRF is done in SQL."
      }
    ],
    "minutes": 120,
    "duration": "≈2h",
    "questions": [
      "Why hybrid? Give your own numbers: vector-only, full-text and hybrid, at recall@10 and MRR.",
      "Hybrid has a lower MRR than full-text alone on your data. What do you do about it?",
      "Is Postgres ts_rank BM25? What is missing?",
      "Why does vector-only do so badly on logs? (Identifiers; chunks of ~15.7K characters against an embedder that sees ~512 tokens; a stand-in embedder.)",
      "Why one chunk table and one HNSW index per session instead of one shared table?",
      "What does that design cost you? (Many tables and indexes, catalogue bloat, per-session build time, cleanup.)",
      "Write the RRF formula. Why k = 60? Why rank-based rather than score-based?",
      "Time-range questions get 0.167 recall@10 from every retriever (only 3 questions). Why, and where does your three-tier query design send them?"
    ]
  },
  {
    "id": "R3",
    "section": "R",
    "sectionLabel": "Your systems — resume defence",
    "priority": "P0",
    "title": "DeepLogLens — ingest: Kafka, idempotent effects, rate limits",
    "why": "“Exactly-once effects on at-least-once delivery” is a strong claim and a favourite follow-up. Be ready to say what is guaranteed (a marker row in the same transaction as the data makes redelivery a no-op), what is not (Kafka transactions cover Kafka-to-Kafka only), and to say “effectively once” rather than “exactly once”.",
    "resumeLinked": true,
    "flag": "Resume claims: constant-heap streaming ingest, offsets committed after durable writes, idempotent upserts turning at-least-once into exactly-once effects.",
    "ceiling": {
      "enough": "walk one part through the transaction, say what each crash point does, and name the limit of your guarantee.",
      "tooDeep": "Kafka broker internals, ISR and controller election."
    },
    "resources": [
      {
        "id": "R3-r1",
        "kind": "self",
        "title": "LogLens — loglens-backend ingest/* (IngestSplitter, PartConsumer, IngestFinalizer), bench/BENCHMARKS.md, bench/results/chaos_*.json",
        "source": "Your own codebase",
        "minutes": 40,
        "note": "Trace one redelivered part through PartConsumer by hand. Then read what your chaos run covered, and what it did not."
      },
      {
        "id": "R3-r2",
        "kind": "video",
        "title": "How Kafka Actually Achieves Exactly-Once Semantics",
        "source": "Arpit Bhayani",
        "url": "https://www.youtube.com/watch?v=iRhDCIzhm4A",
        "minutes": 18,
        "note": ""
      },
      {
        "id": "R3-r3",
        "kind": "video",
        "title": "Fix Duplicate Messages with the Idempotent Consumer Pattern",
        "source": "Milan Jovanović",
        "url": "https://www.youtube.com/watch?v=GsZ_ZtlRCBg",
        "minutes": 14,
        "note": ""
      },
      {
        "id": "R3-r4",
        "kind": "doc",
        "title": "Exactly-once Semantics is Possible: Here's How Apache Kafka Does it",
        "source": "confluent.io",
        "url": "https://www.confluent.io/blog/exactly-once-semantics-are-possible-heres-how-apache-kafka-does-it/",
        "minutes": 20,
        "estimate": true,
        "note": "Read it to see precisely what Kafka's guarantee excludes: side effects outside Kafka, such as your DB write."
      }
    ],
    "minutes": 92,
    "duration": "≈1h 32m",
    "questions": [
      "What exactly makes a redelivered part harmless in your pipeline? Walk the transaction.",
      "Why not Kafka transactions? What do they cover, and what do they not?",
      "A consumer crashes after the DB commit but before the offset commit. What happens? And in the opposite order?",
      "How does the streaming splitter keep heap constant on a 10 GB file? (Window-aligned byte ranges and ranged GETs.)",
      "Why one partition per API key? What does it cost you? (Parallelism capped by partition count; one hot key stalls its partition.)",
      "How do you know the fan-out to the LLM stage fires exactly once when the last part finishes? (The atomic claim in the finalizer.)",
      "What did your chaos benchmark show, and what failure did it not cover?",
      "Where does this break first at 100 times the volume?"
    ]
  },
  {
    "id": "R4",
    "section": "R",
    "sectionLabel": "Your systems — resume defence",
    "priority": "P0",
    "title": "Blue Yonder agent — HITL, Base+Overlay writes, SQL safety",
    "why": "This is the system you will be asked about longest, and its code is not on your machine to re-read, so rehearse it from memory at architecture level. Tool-using agents are probed on the same five things: what the model can change, who approves, what happens when approval never arrives, how a bad write is prevented, and how you measured the benefit.",
    "resumeLinked": true,
    "flag": "Resume claims: LangGraph agent, hierarchy-aware PostgreSQL querying, Redis-staged writes with Base+Overlay persistence, human-in-the-loop approval via interrupts, minutes instead of multi-day tickets.",
    "ceiling": {
      "enough": "describe the design without confidential detail, name the guardrails in layers, and give one measured outcome.",
      "tooDeep": "prompt wording and customer-specific schema."
    },
    "resources": [
      {
        "id": "R4-r1",
        "kind": "self",
        "title": "Your Blue Yonder LangGraph agent — from memory",
        "source": "Your own memory of the system",
        "minutes": 45,
        "note": "Architecture level only, nothing confidential. Write the answers down, then say them aloud."
      },
      {
        "id": "R4-r2",
        "kind": "video",
        "title": "Design a Text-to-SQL Agent | Applied AI System Design",
        "source": "Aniket Wattamwar",
        "url": "https://www.youtube.com/watch?v=phxEKe3ngK0",
        "minutes": 27,
        "note": "A design walkthrough of a text-to-SQL agent. Compare its guardrails with yours."
      },
      {
        "id": "R4-r3",
        "kind": "video",
        "title": "Human in the loop (HITL) using LangGraph | CampusX",
        "source": "CampusX",
        "url": "https://www.youtube.com/watch?v=xxqZzVZ4gE0",
        "minutes": 40,
        "note": "14:21 HITL from a LangGraph perspective, 16:30 the interrupt workflow, 22:49 code. Hinglish."
      }
    ],
    "minutes": 112,
    "duration": "1h 52m",
    "questions": [
      "How does a planner's sentence become a safe update? What can the model change, and what is enforced in code?",
      "Is the “hierarchy-aware PostgreSQL querying” text-to-SQL? What stops a bad query? (Read-only role, allowlist, tenant scope in the database, timeout, row limit.)",
      "Base + Overlay with Redis-staged writes: what is staged, when does it commit, and what is the TTL?",
      "Two planners edit the same parameter at once. What happens?",
      "interrupt() re-runs the node from its start on resume. What did you have to make idempotent?",
      "The approver never responds. What happens to the staged write?",
      "The underlying data changed while the human was deciding. Now what?",
      "How did you measure “minutes instead of multi-day tickets”? Give the number.",
      "What did it get wrong in the first month, and what did you change?",
      "How do you trace a bad run, and how do you catch a regression when the prompt changes?"
    ]
  },
  {
    "id": "R5",
    "section": "R",
    "sectionLabel": "Your systems — resume defence",
    "priority": "P0",
    "title": "Tell the story — a 90-second and a 5-minute version",
    "why": "Interview guides frame the project round the same way: one system you understand end to end, your own responsibility, a baseline, the architecture decision, how you evaluated it, a launch guardrail, and a change driven by real feedback. Two scripts per project (DeepLogLens and the Blue Yonder agent) cover most openers, and they stop you rambling.",
    "resumeLinked": true,
    "flag": "Both projects are on the resume; each will be asked about in your own words.",
    "ceiling": {
      "enough": "two scripts per project, spoken aloud once and recorded, with a number in each.",
      "tooDeep": "polishing slides or a diagram you will never draw in the interview."
    },
    "resources": [
      {
        "id": "R5-r1",
        "kind": "self",
        "title": "Your two projects — the scripts",
        "source": "Your own words",
        "minutes": 60,
        "note": "For each: problem, baseline, key design decision, how you evaluated it, a guardrail, a change after real feedback or failure. Write both versions, say them aloud, record yourself once, cut the filler."
      },
      {
        "id": "R5-r2",
        "kind": "video",
        "title": "Best way to Answer DSA Questions and Explain Projects | Product Based Companies",
        "source": "Striver",
        "url": "https://www.youtube.com/watch?v=PG4t_6qjxz0",
        "minutes": 15,
        "note": "Generic and a few years old, but sound on structure. Apply it to AI projects."
      },
      {
        "id": "R5-r3",
        "kind": "doc",
        "title": "AI Engineer Interview Questions 2026: RAG, Agents, Evals, and Production Systems",
        "source": "prachub.com",
        "url": "https://prachub.com/resources/ai-engineer-interview-questions-2026-rag-agents-evals-and-production-systems",
        "minutes": 25,
        "estimate": true,
        "note": "Practice material, not leaked questions. Read the project-ownership and ship-decision entries."
      },
      {
        "id": "R5-r4",
        "kind": "doc",
        "title": "How to explain a RAG project in an AI/ML interview",
        "source": "faceprep.in",
        "url": "https://faceprep.in/article/how-to-explain-a-rag-project-in-an-ai-ml-interview-2026/",
        "minutes": 10,
        "estimate": true,
        "note": ""
      }
    ],
    "minutes": 110,
    "duration": "≈1h 50m",
    "questions": [
      "Walk me through an AI system you shipped, end to end.",
      "What was the baseline, and how did you know the AI version was better?",
      "What was your specific contribution, as opposed to the team's?",
      "What broke in production, and what did you change?",
      "Why build this instead of using a managed service?",
      "What would you do differently?",
      "A customer says the bot “feels dumb”. What do you change first?"
    ]
  },
  {
    "id": "A2",
    "section": "A",
    "sectionLabel": "RAG",
    "priority": "P0",
    "title": "Vector index internals — HNSW, ANN, filtering",
    "why": "Your resume claims per-session HNSW tables to avoid filtered-ANN recall loss, so “pre-filter vs post-filter” will be asked live. Know HNSW well enough to explain m, ef_construction and ef_search, and why a filter applied after the index search throws away results the index had already narrowed.",
    "resumeLinked": true,
    "flag": "Your resume claims HNSW + post-filtered ANN recall loss.",
    "ceiling": {
      "enough": "HNSW is a layered graph you greedily descend; it's approximate; m/ef_construction/ef_search trade recall for speed; filtering after the ANN search throws away results the index already narrowed.",
      "tooDeep": "skip-list probability distributions, graph pruning heuristics, SIMD distance kernels."
    },
    "resources": [
      {
        "id": "A2-r1",
        "kind": "video",
        "title": "Vector Database Search - Hierarchical Navigable Small Worlds (HNSW) Explained",
        "source": "DataMListic",
        "url": "https://www.youtube.com/watch?v=77QH0Y2PYKg",
        "minutes": 8,
        "note": ""
      },
      {
        "id": "A2-r2",
        "kind": "video",
        "title": "HNSW for Vector Search Explained and Implemented with Faiss (Python)",
        "source": "James Briggs",
        "url": "https://www.youtube.com/watch?v=QvKMwLjdK-s",
        "minutes": 35,
        "note": ""
      },
      {
        "id": "A2-r3",
        "kind": "video",
        "title": "Metadata Filtering for Vector Search + Latest Filter Tech",
        "source": "James Briggs",
        "url": "https://www.youtube.com/watch?v=H_kJDHvu-v8",
        "minutes": 34,
        "note": "02:03–12:22 is the concept: why filter, pre-filter, post-filter, single-stage. The rest is Pinecone API code you can skip."
      },
      {
        "id": "A2-r4",
        "kind": "doc",
        "title": "pgvector README",
        "source": "",
        "url": "https://github.com/pgvector/pgvector",
        "minutes": 30,
        "estimate": true,
        "note": "read the Indexing and Filtering sections"
      }
    ],
    "minutes": 107,
    "duration": "≈1h 47m",
    "questions": [
      "Explain HNSW in three sentences. Why layers?",
      "HNSW vs IVFFlat — build time, query time, recall, memory. When does IVFFlat win?",
      "What do m, ef_construction, ef_search control?",
      "What is ANN recall and why isn't it 100%?",
      "Pre-filter vs post-filter. Why does post-filtering lose recall? ← the one that backs your per-session-table decision",
      "Why is exact KNN fine at 10k vectors and fatal at 10M?",
      "Why pgvector over Pinecone/Qdrant? Give the honest tradeoff, not a sales pitch.",
      "pgvector 0.8 added iterative index scans. What problem do they address, and how is that different from your per-session tables?"
    ]
  },
  {
    "id": "A3",
    "section": "A",
    "sectionLabel": "RAG",
    "priority": "P0",
    "title": "Hybrid search + reranking",
    "why": "Hybrid and RRF are on your resume. Expect: when keyword wins and when vector wins, the RRF formula, why a cross-encoder can rerank but cannot retrieve, and, because your own numbers show hybrid's MRR below full-text's, what you would add. Reranking is not free: know its p99 cost and when to skip it.",
    "resumeLinked": true,
    "flag": "Resume: hybrid vector + full-text, GIN indexes.",
    "ceiling": {
      "enough": "bi-encoder retrieves fast and lossy, cross-encoder reranks slow and accurate; you can't afford the cross-encoder at corpus scale.",
      "tooDeep": "ColBERT late interaction, training a reranker."
    },
    "resources": [
      {
        "id": "A3-r1",
        "kind": "video",
        "title": "Understanding Reciprocal Rank Fusion in Hybrid Search [Advanced RAG]",
        "source": "TechViz - The Data Science Guy",
        "url": "https://www.youtube.com/watch?v=6dDvfGrxFns",
        "minutes": 8,
        "note": ""
      },
      {
        "id": "A3-r2",
        "kind": "video",
        "title": "Rerank for better RAG (Explained)",
        "source": "vectorize",
        "url": "https://www.youtube.com/watch?v=K1F8BIgcoNk",
        "minutes": 14,
        "note": ""
      },
      {
        "id": "A3-r3",
        "kind": "video",
        "title": "Do Reranking Models Actually Improve RAG?",
        "source": "Adam Lucek",
        "url": "https://www.youtube.com/watch?v=7ZU85v4Kt-Y",
        "minutes": 32,
        "note": "A sceptical test of whether rerankers help. Use it for “when is reranking not worth it?”."
      },
      {
        "id": "A3-r4",
        "kind": "doc",
        "title": "Rerankers and Two-Stage Retrieval",
        "source": "Pinecone Learn",
        "url": "https://pinecone.io/learn/series/rag/rerankers",
        "minutes": 30,
        "estimate": true,
        "note": ""
      }
    ],
    "minutes": 84,
    "duration": "≈1h 24m",
    "questions": [
      "Give a query where keyword search wins and vector search fails. Then the reverse.",
      "How do you merge two ranked lists? Explain Reciprocal Rank Fusion.",
      "Bi-encoder vs cross-encoder — why is the cross-encoder more accurate?",
      "Why not just use the cross-encoder for retrieval?",
      "Retrieve 100 → rerank to 5. What's the p99 latency cost?",
      "When is reranking not worth it?"
    ]
  },
  {
    "id": "A4",
    "section": "A",
    "sectionLabel": "RAG",
    "priority": "P0",
    "title": "Corrective / agentic RAG",
    "why": "Corrective RAG is on your resume, so draw the graph from memory: retrieve, grade, rewrite, re-retrieve, with the loop bounded. Yours caps rewrites at 2 and falls back to the first useful retrieval, so a bad grader cannot force an empty answer. Expect the cost question: every grade and every rewrite is another LLM call.",
    "resumeLinked": true,
    "flag": "Your resume claims retrieve → grade → rewrite → re-retrieve.",
    "ceiling": {
      "enough": "draw the graph, name every branch, state the latency cost, say when plain RAG is better.",
      "tooDeep": "the CRAG paper's benchmark tables."
    },
    "resources": [
      {
        "id": "A4-r1",
        "kind": "video",
        "title": "Self-reflective RAG with LangGraph: Self-RAG and CRAG",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=pbAd8O1Lvm4",
        "minutes": 18,
        "note": ""
      },
      {
        "id": "A4-r2",
        "kind": "video",
        "title": "Building Corrective RAG from scratch with open-source, local LLMs",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=E2shqsYwxck",
        "minutes": 26,
        "note": ""
      },
      {
        "id": "A4-r3",
        "kind": "doc",
        "title": "Agentic RAG tutorial",
        "source": "LangGraph docs → Tutorials → RAG",
        "url": "https://langchain-ai.github.io/langgraph",
        "minutes": 40,
        "estimate": true,
        "note": ""
      }
    ],
    "minutes": 84,
    "duration": "≈1h 24m",
    "questions": [
      "What does the grading node check, and who grades?",
      "Grader says \"irrelevant.\" Walk every branch from there.",
      "Why does query rewriting help? What was wrong with the original query?",
      "What's the p99 latency cost vs plain RAG? When would you not use corrective-RAG?",
      "How do you bound the retrieve→rewrite loop?",
      "The corpus genuinely lacks the answer. How does the system say \"I don't know\" instead of hallucinating?",
      "Self-RAG vs Corrective-RAG vs Agentic RAG — one line each."
    ]
  },
  {
    "id": "A6",
    "section": "A",
    "sectionLabel": "RAG",
    "priority": "P1",
    "title": "RAG end to end — what happens between Enter and the answer",
    "why": "The standard phone-screen question: “you have a 200-page PDF and a question; what happens between pressing Enter and the answer coming back?” It tests whether you can walk load, split, embed, index, retrieve, prompt and generate in about three minutes, with a deliberate choice at each step. Four short videos from the LangChain engineer who teaches RAG-from-scratch.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "walk the pipeline in order and name one deliberate choice per stage: chunk size, embedder, k, prompt.",
      "tooDeep": "framework APIs, and the query-translation variants (do those later)."
    },
    "resources": [
      {
        "id": "A6-r1",
        "kind": "video",
        "title": "RAG From Scratch: Part 1 (Overview)",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=wd7TZ4w1mSw",
        "minutes": 5,
        "note": ""
      },
      {
        "id": "A6-r2",
        "kind": "video",
        "title": "RAG From Scratch: Part 2 (Indexing)",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=bjb_EMsTDKI",
        "minutes": 5,
        "note": ""
      },
      {
        "id": "A6-r3",
        "kind": "video",
        "title": "RAG From Scratch: Part 3 (Retrieval)",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=LxNVgdIz9sU",
        "minutes": 5,
        "note": ""
      },
      {
        "id": "A6-r4",
        "kind": "video",
        "title": "RAG From Scratch: Part 4 (Generation)",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=Vw52xyyFsB8",
        "minutes": 6,
        "note": ""
      }
    ],
    "minutes": 21,
    "duration": "21m",
    "questions": [
      "You have a 200-page PDF and a question. What happens between pressing Enter and the answer coming back?",
      "Where does the latency go in that path, stage by stage?",
      "Which stages would you cache, and what invalidates each cache?",
      "The PDF is edited tomorrow. What has to change in the index?",
      "How do you choose k?",
      "When would you not use RAG at all? (The document fits in the context window; the facts change faster than the index.)",
      "How do you make the answer cite its sources, and verify the citations are real?"
    ]
  },
  {
    "id": "A1",
    "section": "A",
    "sectionLabel": "RAG",
    "priority": "P1",
    "title": "Chunking & embeddings",
    "why": "Chunking is the first “next layer” question after the RAG diagram. Fixed 512-token windows are the lazy default and can split sentences; structure-aware chunking usually does better at the cost of more code. Your own eval shows why it matters: LogLens chunks average ~15.7K characters while the embedder sees ~512 tokens.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "name the strategies, say which you picked for logs and why, know what breaks at each size extreme.",
      "tooDeep": "embedding model architecture, training objectives, contrastive loss."
    },
    "resources": [
      {
        "id": "A1-r1",
        "kind": "video",
        "title": "The BEST Way to Chunk Text for RAG",
        "source": "Adam Lucek",
        "url": "https://www.youtube.com/watch?v=Pk2BeaGbcTE",
        "minutes": 33,
        "note": ""
      },
      {
        "id": "A1-r2",
        "kind": "video",
        "title": "Text Embeddings, Classification, and Semantic Search (w/ Python Code)",
        "source": "Shaw Talebi",
        "url": "https://www.youtube.com/watch?v=sNa_uiqSlJo",
        "minutes": 24,
        "note": "The embeddings half: what a vector is and how similarity search uses it."
      },
      {
        "id": "A1-r3",
        "kind": "video",
        "title": "The Best RAG Technique Yet? Anthropic’s Contextual Retrieval Explained!",
        "source": "Prompt Engineering",
        "url": "https://www.youtube.com/watch?v=tmiBae2goJM",
        "minutes": 16,
        "note": "Contextual retrieval: prefixing each chunk with context before embedding."
      },
      {
        "id": "A1-r4",
        "kind": "doc",
        "title": "Chunking Strategies for LLM Applications",
        "source": "Pinecone Learn",
        "url": "https://pinecone.io/learn/chunking-strategies",
        "minutes": 30,
        "estimate": true,
        "note": ""
      }
    ],
    "minutes": 103,
    "duration": "≈1h 43m",
    "questions": [
      "Chunk too small → what breaks? Too large → what breaks?",
      "What is overlap for, and what does it cost you?",
      "Fixed-size vs recursive vs semantic vs structure-aware. Pick one for log data and defend it.",
      "Why can't you compare embeddings from two different models?",
      "You swap embedding models. What happens to your existing index?",
      "Retrieval returns garbage. Give your debug order: chunking → embedding → index → query → top-k.",
      "Where does document extraction fail? (Tables, multi-column PDFs, scans, headers.)",
      "Your chunks average ~15.7K characters but the embedder reads ~512 tokens. What does vector search actually see, and what would you change?"
    ]
  },
  {
    "id": "A5",
    "section": "A",
    "sectionLabel": "RAG",
    "priority": "P1",
    "title": "RAG failure taxonomy",
    "why": "“The right document exists but the answer is wrong; debug it” is a standard question. Strong answers split the pipeline stage by stage (ingestion, freshness, filters, chunking, query rewrite, retrieval, rerank, context assembly, generation) and measure retrieval and generation separately before touching a prompt.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "name where a RAG pipeline breaks and which metric catches each.",
      "tooDeep": "survey papers."
    },
    "resources": [
      {
        "id": "A5-r1",
        "kind": "video",
        "title": "Building Production-Ready RAG Applications: Jerry Liu",
        "source": "AI Engineer",
        "url": "https://www.youtube.com/watch?v=TRjq7t2Ms5I",
        "minutes": 19,
        "note": ""
      },
      {
        "id": "A5-r2",
        "kind": "video",
        "title": "How to debug Retrieval for RAG",
        "source": "Hamel Husain",
        "url": "https://www.youtube.com/watch?v=N9SZ9o2gReE",
        "minutes": 41,
        "note": "04:36 how DCG and NDCG work; 18:11 “the first thing to do on any RAG team”; 37:02 the inner and outer loops of retrieval quality."
      },
      {
        "id": "A5-r3",
        "kind": "video",
        "title": "Lost in the Middle: How Language Models use Long Context - Explained!",
        "source": "Weaviate vector database",
        "url": "https://www.youtube.com/watch?v=Kf3LeaUGwlg",
        "minutes": 24,
        "note": ""
      },
      {
        "id": "A5-r4",
        "kind": "course",
        "title": "Systematically Improving RAG Applications",
        "source": "Maven · Jason Liu · paid",
        "url": "https://maven.com/applied-llms/rag-playbook",
        "minutes": 0,
        "estimate": false,
        "note": "Paid cohort course. Optional: the free videos above cover what a 2-year loop asks. Check the page for the current price and dates."
      },
      {
        "id": "A5-r5",
        "kind": "doc",
        "title": "RAG series, intro chapter",
        "source": "Pinecone Learn",
        "url": "https://pinecone.io/learn/series/rag",
        "minutes": 30,
        "estimate": true,
        "note": ""
      }
    ],
    "minutes": 114,
    "duration": "≈1h 54m",
    "questions": [
      "A RAG answer is wrong. Name every stage that could be at fault. (Extraction → chunking → embedding → index → retrieval → reranking → prompt → generation.)",
      "Retrieval returned the right chunk but the answer is still wrong. Where's the bug?",
      "Retrieval returned nothing relevant but the answer sounded confident. What's missing from your system?",
      "How do you make the model cite its source? How do you verify the citation is real?",
      "\"Lost in the middle\" — what is it and how do you mitigate it?",
      "When is RAG the wrong architecture entirely?"
    ]
  },
  {
    "id": "C2",
    "section": "C",
    "sectionLabel": "Is my AI actually working?",
    "priority": "P0",
    "title": "LLM-as-judge + building an eval loop",
    "why": "“Who judges the judge?” is the follow-up to every LLM-as-judge claim, and that claim is on your resume. Strong answers treat the judge as a measurement instrument: a task-specific rubric, a check for order and verbosity bias, agreement with human labels, disagreements investigated by slice, and recalibration after a model or prompt change.",
    "resumeLinked": true,
    "flag": "Your resume claims an LLM-as-judge groundedness loop.",
    "ceiling": {
      "enough": "explain how you'd build a golden set, validate the judge against humans, and gate changes on it.",
      "tooDeep": "judge-model fine-tuning, academic agreement statistics."
    },
    "resources": [
      {
        "id": "C2-r1",
        "kind": "video",
        "title": "LLM as a Judge: Scaling AI Evaluation Strategies",
        "source": "IBM Technology",
        "url": "https://www.youtube.com/watch?v=trfUBIDeI1Y",
        "minutes": 6,
        "note": ""
      },
      {
        "id": "C2-r2",
        "kind": "video",
        "title": "How To Build AI Evals",
        "source": "Hamel Husain",
        "url": "https://www.youtube.com/watch?v=mF4CaijvJos",
        "minutes": 34,
        "note": "A case study. 19:05 calibrating judges against production; 20:44 judges as a CI gate and on daily production samples."
      },
      {
        "id": "C2-r3",
        "kind": "video",
        "title": "AI Evals For Engineers: Course Preview (Chapters 1-3 of 8)",
        "source": "Hamel Husain",
        "url": "https://www.youtube.com/watch?v=OJItZndMUII",
        "minutes": 64,
        "note": "Free preview of the course below: chapters 1–3 of 8."
      },
      {
        "id": "C2-r4",
        "kind": "doc",
        "title": "LLM Evals: Everything You Need to Know (FAQ)",
        "source": "hamel.dev",
        "url": "https://hamel.dev/blog/posts/evals-faq/",
        "minutes": 30,
        "estimate": true,
        "note": "Short answers on judges, error analysis, golden-set size and agreement."
      },
      {
        "id": "C2-r5",
        "kind": "course",
        "title": "AI Evals For Engineers & PMs",
        "source": "Maven · Hamel Husain & Shreya Shankar · paid",
        "url": "https://maven.com/parlance-labs/evals",
        "minutes": 0,
        "estimate": false,
        "note": "Paid, $4,200 on the course page on 2026-10-23, with cohorts listed for Oct–Nov 2026 and Jan–Mar 2027. Optional. The free preview above and the FAQ cover most of it."
      },
      {
        "id": "C2-r6",
        "kind": "doc",
        "title": "Your AI Product Needs Evals",
        "source": "Hamel Husain",
        "url": "https://hamel.dev/blog/posts/evals",
        "minutes": 40,
        "estimate": true,
        "note": ""
      }
    ],
    "minutes": 174,
    "duration": "≈2h 54m",
    "questions": [
      "Who judges the judge? How do you know yours isn't drifting?",
      "Name three known LLM-judge biases. (Position, verbosity, self-preference.)",
      "How do you validate a judge against human labels? What agreement is good enough?",
      "Binary pass/fail vs 1–5 scale — which is more reliable and why?",
      "How big should a golden set be? How do you build one without manual-labelling hell?",
      "Your judge and your generator are the same model. What's the problem?",
      "Error analysis: 50 failures in front of you. What's your process?",
      "How did you know LogLens's groundedness loop was actually working? ← answer this honestly; \"we didn't fully validate it\" is a strong answer",
      "40 items, the judge and you agree on 34, and both label half the items pass. Compute Cohen's kappa. (p_o = 0.85, p_e = 0.5, so kappa = 0.70.)"
    ]
  },
  {
    "id": "C1",
    "section": "C",
    "sectionLabel": "Is my AI actually working?",
    "priority": "P1",
    "title": "RAG metrics",
    "why": "Evals are the round people fail most often. Start with the four RAG metrics (faithfulness, answer relevancy, context precision, context recall) and the ranking metrics (recall@k, MRR, nDCG), and be able to diagnose a system from its scores.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "define the four core metrics, say which measure retrieval vs generation, and diagnose a system from its scores.",
      "tooDeep": "the RAGAS paper's math, every metric in the library."
    },
    "resources": [
      {
        "id": "C1-r1",
        "kind": "video",
        "title": "RAG Evaluation: Precision, Recall, Faithfulness, RAGAS Explained Clearly",
        "source": "Logical Lenses",
        "url": "https://www.youtube.com/watch?v=7_LTU0LA374",
        "minutes": 12,
        "note": ""
      },
      {
        "id": "C1-r2",
        "kind": "video",
        "title": "Every Ranking Metric : MRR, MAP, NDCG",
        "source": "ritvikmath",
        "url": "https://www.youtube.com/watch?v=2XegvMul_mE",
        "minutes": 21,
        "note": "The ranking metrics: MRR, MAP and NDCG, with worked examples."
      },
      {
        "id": "C1-r3",
        "kind": "video",
        "title": "RAGAS: How to Evaluate a RAG Application Like a Pro for Beginners",
        "source": "Mervin Praison",
        "url": "https://www.youtube.com/watch?v=5fp6e5nhJRk",
        "minutes": 9,
        "note": ""
      },
      {
        "id": "C1-r4",
        "kind": "course",
        "title": "Building and Evaluating Advanced RAG Applications",
        "source": "DeepLearning.AI · LlamaIndex & TruEra",
        "url": "https://www.deeplearning.ai/courses/building-evaluating-advanced-rag",
        "minutes": 125,
        "estimate": true,
        "note": "About 2 hours; teaches the RAG triad (context relevance, groundedness, answer relevance). DeepLearning.AI marks some items PRO, so check what is free."
      },
      {
        "id": "C1-r5",
        "kind": "doc",
        "title": "Core Concepts → Metrics",
        "source": "RAGAS docs",
        "url": "https://docs.ragas.io",
        "minutes": 40,
        "estimate": true,
        "note": ""
      }
    ],
    "minutes": 207,
    "duration": "≈3h 27m",
    "questions": [
      "Define faithfulness, answer relevancy, context precision, context recall. Which two measure retrieval, which two measure generation?",
      "Faithfulness is 0.91 but users say answers miss key information. Which metric catches it, and why did faithfulness stay high? (Context recall. The retriever missed a doc; the generator answered coherently from partial context.)",
      "How is faithfulness computed? (Decompose the answer into claims, entailment-check each against context.)",
      "Context precision vs context recall — which do you fix by changing top-k, and which by changing chunking?",
      "Reference-free vs reference-based eval. When do you need ground truth?",
      "All four scores are high but users are unhappy. What are you not measuring?",
      "A query has three relevant chunks at ranks 2, 7 and 11. Compute recall@5, MRR and the rank-based part of nDCG@10 by hand."
    ]
  },
  {
    "id": "C3",
    "section": "C",
    "sectionLabel": "Is my AI actually working?",
    "priority": "P1",
    "title": "Production monitoring + regression",
    "why": "Three layers: offline evals gate merges, online evals sample production, monitoring alerts on drift. The question that sounds senior is “the provider silently updated the model; how do you find out before your users do?”.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "describe the three-layer pattern — offline eval gates merges, online eval samples production, monitoring alerts on drift.",
      "tooDeep": "LangSmith's full API surface."
    },
    "resources": [
      {
        "id": "C3-r1",
        "kind": "video",
        "title": "Getting Started with LangSmith (5/8): Datasets & Evaluations",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=iEgjJyk3aTw",
        "minutes": 12,
        "note": ""
      },
      {
        "id": "C3-r2",
        "kind": "video",
        "title": "10 min Walkthrough of Langfuse – Open Source LLM Observability, Evaluation, and Prompt Management",
        "source": "Langfuse",
        "url": "https://www.youtube.com/watch?v=2E8iTvGo9Hs",
        "minutes": 10,
        "note": ""
      },
      {
        "id": "C3-r3",
        "kind": "video",
        "title": "How to evaluate agents in practice",
        "source": "Google Cloud Tech",
        "url": "https://www.youtube.com/watch?v=vuBvf7ZRKTA",
        "minutes": 11,
        "note": ""
      },
      {
        "id": "C3-r4",
        "kind": "video",
        "title": "Lessons from the Trenches: Building LLM Evals That Work IRL: Aparna Dhinkaran",
        "source": "AI Engineer",
        "url": "https://www.youtube.com/watch?v=nbZzSC5A6hs",
        "minutes": 19,
        "note": ""
      },
      {
        "id": "C3-r5",
        "kind": "doc",
        "title": "Evaluation Concepts",
        "source": "LangSmith docs → Evaluation",
        "url": "https://docs.smith.langchain.com",
        "minutes": 40,
        "estimate": true,
        "note": ""
      }
    ],
    "minutes": 92,
    "duration": "≈1h 32m",
    "questions": [
      "Offline eval vs online eval vs monitoring — what does each catch that the others miss?",
      "How do you gate a merge on eval scores in CI?",
      "The provider silently updates the model. How do you find out before your users do?",
      "What do you trace in an LLM app that you don't in a normal service? (Prompt, completion, tokens, per-step latency, tool calls, cost.)",
      "What alerts on an LLM feature? (Not just 5xx — cost spikes, groundedness drops, tool error rates, retrieval-miss rate.)",
      "How do you A/B test a prompt change safely?",
      "Same input, different output. How do you debug that?",
      "How do you version prompts like code?"
    ]
  },
  {
    "id": "B2",
    "section": "B",
    "sectionLabel": "LangChain + LangGraph",
    "priority": "P0",
    "title": "LangGraph core — state, edges, routing, checkpointing, HITL",
    "why": "“Human-in-the-loop via LangGraph interrupts” is a resume claim, so expect the mechanics: a checkpointer is required, resume is by thread_id, and on resume the node re-runs from its start, so anything before the interrupt must be idempotent. And the question your own system makes personal: the human never answers, so what happens to the staged write?",
    "resumeLinked": true,
    "flag": "Covers your HITL interrupt claim directly (Lesson 5).",
    "ceiling": {
      "enough": "draw your own graph on a whiteboard, explain state/reducers, explain what a checkpointer buys you, explain what happens across a crash and across a human wait.",
      "tooDeep": "LangGraph internals, Pregel execution model."
    },
    "resources": [
      {
        "id": "B2-r1",
        "kind": "video",
        "title": "LangGraph interrupt: Making it easier to build human-in-the-loop agents",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=6t7YJcEFUIY",
        "minutes": 8,
        "note": ""
      },
      {
        "id": "B2-r2",
        "kind": "video",
        "title": "Persistence in LangGraph | Time Travel in LangGraph | CampusX",
        "source": "CampusX",
        "url": "https://www.youtube.com/watch?v=_IPP7_Bi8uA",
        "minutes": 58,
        "note": "14:50 checkpointer, 20:10 threads, 38:05 fault tolerance, 44:28 human in the loop. Hinglish."
      },
      {
        "id": "B2-r3",
        "kind": "course",
        "title": "Quickstart: LangGraph Essentials (Python)",
        "source": "LangChain Academy",
        "url": "https://academy.langchain.com/courses/langgraph-essentials-python",
        "minutes": 60,
        "estimate": true,
        "note": "Free, official, and the only source guaranteed current — the API changes quarterly and most tutorials are two versions stale."
      }
    ],
    "minutes": 126,
    "duration": "≈2h 6m",
    "questions": [
      "Why a graph instead of a chain? What does the graph buy you?",
      "What is state? How do reducers merge writes from parallel nodes?",
      "What is a checkpointer? What breaks without one?",
      "Where does the checkpoint live in production, and what does that mean for horizontal scaling?",
      "Your graph crashes mid-run. What resumes, and from where?",
      "How do you prevent infinite loops in a cyclic graph?",
      "Static breakpoint vs dynamic interrupt() — when do you need each?",
      "The human approval never arrives. What happens to your staged write? ← your system",
      "Can the human edit state, or only approve? How?",
      "The underlying data changed while the human was deciding. Now what?",
      "interrupt() re-runs the node from the top on resume. What does that mean for a node that writes to Redis before the interrupt?"
    ]
  },
  {
    "id": "B3",
    "section": "B",
    "sectionLabel": "LangChain + LangGraph",
    "priority": "P1",
    "title": "Agents — ReAct, tool calling, and when not to",
    "why": "“Workflow or agent: which is your default?” separates people who have shipped agents from people who have read about them. The answer interviewers reward is the simplest thing that works, with budgets, stop conditions and approval points. Also expect to write a tool-calling loop with a step cap and no framework.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "explain the ReAct loop, name the workflow patterns, and argue for the simplest thing that works.",
      "tooDeep": "the ReAct paper's benchmarks, agent-framework comparisons."
    },
    "resources": [
      {
        "id": "B3-r1",
        "kind": "video",
        "title": "How We Build Effective Agents: Barry Zhang, Anthropic",
        "source": "AI Engineer",
        "url": "https://www.youtube.com/watch?v=D7_ipDqhtwk",
        "minutes": 15,
        "note": ""
      },
      {
        "id": "B3-r2",
        "kind": "video",
        "title": "LLM Function Calling - AI Tools Deep Dive",
        "source": "Adam Lucek",
        "url": "https://www.youtube.com/watch?v=gMeTK6zzaO4",
        "minutes": 31,
        "note": ""
      },
      {
        "id": "B3-r3",
        "kind": "doc",
        "title": "Building Effective Agents",
        "source": "Anthropic",
        "url": "https://anthropic.com/engineering/building-effective-agents",
        "minutes": 30,
        "estimate": true,
        "note": ""
      }
    ],
    "minutes": 76,
    "duration": "≈1h 16m",
    "questions": [
      "Explain the ReAct loop. What is the reasoning step actually doing?",
      "Workflow vs agent — what's the real difference, and which is your default? (Simplest thing that works. Say it.)",
      "How does tool calling work mechanically? Who parses what?",
      "Model calls a nonexistent tool, or passes bad args. What happens?",
      "The agent loops forever on the same tool. How do you stop it?",
      "3 fat tools or 15 thin ones? How do you decide granularity?",
      "Why does the tool description matter more than the tool code?",
      "Token cost of a 10-step loop vs one call. Why does it compound?",
      "When is an agent the wrong choice?"
    ]
  },
  {
    "id": "B1",
    "section": "B",
    "sectionLabel": "LangChain + LangGraph",
    "priority": "P1",
    "title": "LangChain — what it is, and when not to use it",
    "why": "LangChain is on your skills line, so “LangChain vs LangGraph: when each, and would you use LangChain in production?” is a near-certain opener. The credible answer names what the abstraction buys (streaming, batching, tracing) and what it costs when you debug.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "it's an abstraction layer over models/retrievers/tools; LCEL composes them; you know when the abstraction costs more than it saves.",
      "tooDeep": "memorising integration APIs."
    },
    "resources": [
      {
        "id": "B1-r1",
        "kind": "video",
        "title": "LangChain vs LangGraph: A Tale of Two Frameworks",
        "source": "IBM Technology",
        "url": "https://www.youtube.com/watch?v=qAF1NjEVHhY",
        "minutes": 10,
        "note": ""
      },
      {
        "id": "B1-r2",
        "kind": "video",
        "title": "LangChain Expression Language (LCEL) Explained!",
        "source": "James Briggs",
        "url": "https://www.youtube.com/watch?v=O0dUOtOIrfs",
        "minutes": 26,
        "note": ""
      },
      {
        "id": "B1-r3",
        "kind": "doc",
        "title": "Conceptual Guide",
        "source": "LangChain docs → Conceptual guide",
        "url": "https://python.langchain.com",
        "minutes": 30,
        "estimate": true,
        "note": ""
      }
    ],
    "minutes": 66,
    "duration": "≈1h 6m",
    "questions": [
      "LangChain vs LangGraph — when do you use each? (Chains and retrieval flows → LangChain. Stateful, cyclic, needs checkpointing → LangGraph.)",
      "What does LCEL give you over plain function calls? (Streaming, batching, async, tracing — for free.)",
      "Would you use LangChain in production, or call the provider SDK directly? Defend it.",
      "What's the cost of the abstraction when you need to debug?",
      "How do you swap providers without rewriting the pipeline?"
    ]
  },
  {
    "id": "B4",
    "section": "B",
    "sectionLabel": "LangChain + LangGraph",
    "priority": "P2",
    "title": "Memory — short-term vs long-term",
    "why": "Memory is asked as “thread-scoped vs cross-thread” and as “the conversation exceeds the context window: three strategies, three tradeoffs”. Low weight in a backend-leaning loop, but know the vocabulary.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "thread-scoped vs cross-thread, what you store, when you write.",
      "tooDeep": "memory-architecture research, Mem0 internals."
    },
    "resources": [
      {
        "id": "B4-r1",
        "kind": "video",
        "title": "Memory for agents (conceptual video)",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=JTL0yp85FsE",
        "minutes": 7,
        "note": ""
      },
      {
        "id": "B4-r2",
        "kind": "video",
        "title": "How to add long-term memory using PostgreSQL to LangGraph ReAct agent🤖: Python — LangGraph #3",
        "source": "Code AI with Rok",
        "url": "https://www.youtube.com/watch?v=hE8C2M8GRLo",
        "minutes": 11,
        "note": ""
      },
      {
        "id": "B4-r3",
        "kind": "doc",
        "title": "Ambient Agents, Module 5: Memory",
        "source": "LangChain Academy",
        "url": "https://academy.langchain.com/courses/ambient-agents",
        "minutes": 20,
        "estimate": true,
        "note": ""
      }
    ],
    "minutes": 38,
    "duration": "≈38m",
    "questions": [
      "Thread-scoped vs cross-thread memory — what's the storage difference?",
      "Conversation exceeds the context window. Three strategies, three tradeoffs.",
      "When do you write to long-term memory — every turn or on a trigger?",
      "How do you retrieve the right memory instead of all of it?",
      "Two memories contradict. Now what?",
      "Isn't long-term memory just RAG over chat history? (Mostly. Say so, then say what's different.)"
    ]
  },
  {
    "id": "D2",
    "section": "D",
    "sectionLabel": "Production essentials",
    "priority": "P0",
    "title": "Structured outputs + text-to-SQL guardrails",
    "why": "Guarded SQL and structured output are on your resume. The answer to “how do you stop the model writing DROP TABLE?” is layers, not a prompt: AST validation, a read-only role, a table allowlist, tenant scope enforced in the database, a statement timeout and a row limit.",
    "resumeLinked": true,
    "flag": "Resume: guardrailed SQL via sqlglot in the RCA agent.",
    "ceiling": {
      "enough": "three ways to force structure and their reliability; why SQL needs layered defence.",
      "tooDeep": "constrained-decoding/grammar internals."
    },
    "resources": [
      {
        "id": "D2-r1",
        "kind": "video",
        "title": "AI & Text to SQL: How LLMs & Schema Power Data Analytics",
        "source": "IBM Technology",
        "url": "https://www.youtube.com/watch?v=S5ezVVJhQmE",
        "minutes": 9,
        "note": ""
      },
      {
        "id": "D2-r2",
        "kind": "video",
        "title": "Structured Output from LLMs: Grammars, Regex, and State Machines",
        "source": "Efficient NLP",
        "url": "https://www.youtube.com/watch?v=xpvFinvqRCA",
        "minutes": 17,
        "note": ""
      },
      {
        "id": "D2-r3",
        "kind": "doc",
        "title": "Structured outputs",
        "source": "LangChain docs → Conceptual guide → Structured outputs",
        "url": "https://python.langchain.com",
        "minutes": 30,
        "estimate": true,
        "note": ""
      }
    ],
    "minutes": 56,
    "duration": "≈56m",
    "questions": [
      "Prompting vs function calling vs constrained decoding — which actually guarantees valid JSON?",
      "Model returns malformed JSON. Retry strategy — and does it terminate?",
      "How do you stop the model writing DROP TABLE? (Three layers: AST validation via sqlglot, read-only DB role, table allowlist. Not one.)",
      "Why is \"please don't delete anything\" in the prompt not a guardrail?",
      "How do you give schema context without blowing the token budget?",
      "Generated SQL is valid but semantically wrong. How do you catch it?",
      "Multi-tenant row-level security in generated SQL — how?"
    ]
  },
  {
    "id": "D1",
    "section": "D",
    "sectionLabel": "Production essentials",
    "priority": "P2",
    "title": "Prompt injection + guardrails",
    "why": "Indirect prompt injection (instructions hidden in retrieved text or tool output) is the threat to know for RAG and agents. The line interviewers want: a prompt instruction is not an access control; authorise at retrieval time and at action time.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "direct vs indirect injection, why prompting alone can't fix it, where guardrails sit.",
      "tooDeep": "jailbreak taxonomies, adversarial ML."
    },
    "resources": [
      {
        "id": "D1-r1",
        "kind": "video",
        "title": "Prompt Injection, explained",
        "source": "Simon Willison",
        "url": "https://www.youtube.com/watch?v=FgxwCaL6UTA",
        "minutes": 12,
        "note": ""
      },
      {
        "id": "D1-r2",
        "kind": "video",
        "title": "OWASP's Top 10 Ways to Attack LLMs: AI Vulnerabilities Exposed",
        "source": "IBM Technology",
        "url": "https://www.youtube.com/watch?v=gUNXZMcd2jU",
        "minutes": 25,
        "note": "A tour of the OWASP LLM risks. Prompt injection is the one to keep."
      },
      {
        "id": "D1-r3",
        "kind": "doc",
        "title": "The lethal trifecta for AI agents",
        "source": "simonwillison.net",
        "url": "https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/",
        "minutes": 10,
        "estimate": true,
        "note": "Private data, untrusted content and a way to communicate out: remove one of the three."
      },
      {
        "id": "D1-r4",
        "kind": "doc",
        "title": "OWASP Top 10 for LLM Applications",
        "source": "",
        "url": "https://genai.owasp.org",
        "minutes": 30,
        "estimate": true,
        "note": "read LLM01 and LLM02 only"
      }
    ],
    "minutes": 77,
    "duration": "≈1h 17m",
    "questions": [
      "Prompt injection vs jailbreaking — different problems, different defences. Explain.",
      "Direct vs indirect injection. Which threatens a RAG system, and why is it worse?",
      "A retrieved log line says \"ignore previous instructions.\" What stops it?",
      "Why can't better prompting fully solve injection?",
      "Input guardrails vs output guardrails — what does each catch?",
      "How do you stop an agent's tool from being used to exfiltrate data?"
    ]
  },
  {
    "id": "D3",
    "section": "D",
    "sectionLabel": "Production essentials",
    "priority": "P2",
    "title": "Cost, latency, caching",
    "why": "Where latency and money go: input tokens, output tokens, time to first token against total time, and what caching changes. “Quality improved but latency and cost are too high; what do you do?” is the standard prompt. Answer with a latency breakdown and interventions you test on the same eval set.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "where the time and money go, and what caching changes.",
      "tooDeep": "KV-cache internals, GPU serving."
    },
    "resources": [
      {
        "id": "D3-r1",
        "kind": "video",
        "title": "Prompt Caching Explained: Stop Overpaying for AI Agents",
        "source": "Hugging Face",
        "url": "https://www.youtube.com/watch?v=SkM4k4SKvCM",
        "minutes": 17,
        "note": ""
      },
      {
        "id": "D3-r2",
        "kind": "video",
        "title": "What is Prompt Caching? Optimize LLM Latency with AI Transformers",
        "source": "IBM Technology",
        "url": "https://www.youtube.com/watch?v=u57EnkQaUTY",
        "minutes": 9,
        "note": ""
      },
      {
        "id": "D3-r3",
        "kind": "doc",
        "title": "Prompt caching",
        "source": "Anthropic docs → Build with Claude → Prompt caching",
        "url": "https://docs.claude.com",
        "minutes": 30,
        "estimate": true,
        "note": ""
      }
    ],
    "minutes": 56,
    "duration": "≈56m",
    "questions": [
      "What gets cached, and what invalidates the cache?",
      "Where do you place a cache breakpoint in a RAG prompt? (Static system + schema before dynamic context.)",
      "Where does latency actually go in an LLM call? (TTFT vs total; prefill vs decode.)",
      "How do you cap spend per tenant?",
      "Different providers, different tokenizers. How do you compare cost fairly?",
      "Temperature 0 — is output deterministic? (No. Explain why.)",
      "Quality improved but p95 latency doubled and cost tripled. What do you do, in order?",
      "Define “cost per resolved task” and say why it beats cost per request."
    ]
  },
  {
    "id": "E1",
    "section": "E",
    "sectionLabel": "Python for AI engineers",
    "priority": "P1",
    "title": "asyncio and concurrency for LLM calls",
    "why": "AI roles code live in Python, and your resume is Java-first. Know the event loop, gather against TaskGroup, and how to fan out many embedding or LLM calls under a rate limit with a semaphore. Your key-pool and rate-limit work is the real-world version of this.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "explain the event loop, write gather with a semaphore and a timeout, and know when asyncio does not help (CPU-bound work).",
      "tooDeep": "writing your own event loop; protocols and transports."
    },
    "resources": [
      {
        "id": "E1-r1",
        "kind": "video",
        "title": "Asyncio in Python - Full Tutorial",
        "source": "Tech With Tim",
        "url": "https://www.youtube.com/watch?v=Qb9s3UiMSTA",
        "minutes": 25,
        "note": ""
      },
      {
        "id": "E1-r2",
        "kind": "video",
        "title": "Asynchronous requests and rate limiting (HTTPX and asyncio.Semaphore)",
        "source": "mildlyoverfitted",
        "url": "https://www.youtube.com/watch?v=luWsr9exlE4",
        "minutes": 12,
        "note": "Rate limiting with a semaphore: the exact pattern for a batch of embedding calls."
      },
      {
        "id": "E1-r3",
        "kind": "doc",
        "title": "Coroutines and Tasks (gather, TaskGroup, timeouts)",
        "source": "docs.python.org",
        "url": "https://docs.python.org/3/library/asyncio-task.html",
        "minutes": 20,
        "estimate": true,
        "note": ""
      }
    ],
    "minutes": 57,
    "duration": "≈57m",
    "questions": [
      "What does await actually do? What blocks the event loop?",
      "Fan out 500 embedding calls with at most 20 in flight and a per-call timeout. Write it.",
      "gather vs TaskGroup: what happens to the other tasks when one raises?",
      "Threads, asyncio or multiprocessing for: 1,000 HTTP calls; parsing PDFs; numpy-heavy scoring?",
      "What is the GIL, and does it matter for a service that mostly waits on LLM calls?",
      "A 429 arrives mid-batch. Retry with backoff and jitter. What goes wrong if every worker retries at the same moment?",
      "How do you stream tokens to a client while the model is still generating?"
    ]
  },
  {
    "id": "E2",
    "section": "E",
    "sectionLabel": "Python for AI engineers",
    "priority": "P1",
    "title": "FastAPI, pydantic and streaming",
    "why": "Your orchestrator is FastAPI plus LangGraph in Python, so expect to sketch an LLM-backed endpoint: schema validation, dependency injection, async handlers, streaming the answer over SSE, and timeouts.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "sketch an endpoint that validates input, calls a model and streams the answer, and say how it fails.",
      "tooDeep": "ASGI internals; writing middleware from scratch."
    },
    "resources": [
      {
        "id": "E2-r1",
        "kind": "video",
        "title": "FastAPI Crash Course - Modern Python API Development",
        "source": "Traversy Media",
        "url": "https://www.youtube.com/watch?v=8TMQcRcBnW8",
        "minutes": 60,
        "note": "0:00–54:37 covers routes, Pydantic schemas, CRUD, middleware and CORS. Skip the deploy section."
      },
      {
        "id": "E2-r2",
        "kind": "video",
        "title": "Pydantic V2 - Full Course - Learn the BEST Library for Data Validation and Parsing",
        "source": "Coding Crash Courses",
        "url": "https://www.youtube.com/watch?v=7aBRk_JP-qY",
        "minutes": 30,
        "note": ""
      },
      {
        "id": "E2-r3",
        "kind": "video",
        "title": "Streaming LLM Responses with FastAPI",
        "source": "Irtiza Hafiz",
        "url": "https://www.youtube.com/watch?v=xTTtqwGWemw",
        "minutes": 11,
        "note": "Token streaming: the part interviewers ask you to sketch."
      }
    ],
    "minutes": 101,
    "duration": "1h 41m",
    "questions": [
      "Sketch an endpoint that takes a question and streams the answer. What does the client receive, and in what format?",
      "SSE or WebSockets for token streaming? Why?",
      "Where do you validate the model's JSON, and what do you do when it fails? (pydantic; one bounded retry; then a clean error.)",
      "What does Depends give you? How would you inject a DB connection and an LLM client so tests can replace them?",
      "A synchronous library call sits inside an async endpoint. What happens, and what is the fix?",
      "How do you time out and cancel a slow LLM call without leaking the connection?"
    ]
  },
  {
    "id": "E3",
    "section": "E",
    "sectionLabel": "Python for AI engineers",
    "priority": "P1",
    "title": "From-scratch drills — the thing under the framework",
    "why": "Live-coding rounds ask for what sits under the framework: a retriever, BM25, RRF, a chunker, a retry wrapper, an agent loop. Build each in under 30 minutes, with one test. The card is the drill; the videos are the safety net.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "each one runs, has a test, and you can explain every line.",
      "tooDeep": "optimising for speed; building a vector database."
    },
    "resources": [
      {
        "id": "E3-r1",
        "kind": "self",
        "title": "Build all nine drills below, in Python, each with one test",
        "source": "Your own codebase",
        "minutes": 180,
        "note": "Thirty minutes each, no framework. Keep them in one repo; they double as interview talking points."
      },
      {
        "id": "E3-r2",
        "kind": "video",
        "title": "Learn RAG From Scratch – Python AI Tutorial from a LangChain Engineer",
        "source": "freeCodeCamp.org",
        "url": "https://www.youtube.com/watch?v=sVcwVQRHIc8",
        "minutes": 153,
        "note": "Code along with 0:00–0:22 (indexing, retrieval, generation) and 0:28 RAG Fusion (RRF). CRAG is at 1:26:32 and Adaptive RAG at 1:44:09."
      },
      {
        "id": "E3-r3",
        "kind": "video",
        "title": "Build a ReAct AI Agent from Scratch in Python | No LangChain, No Frameworks",
        "source": "Siddhardhan",
        "url": "https://www.youtube.com/watch?v=5hnt-bWeeOM",
        "minutes": 66,
        "note": "A ReAct agent in plain Python. Watch it, then rebuild it without looking."
      },
      {
        "id": "E3-r4",
        "kind": "video",
        "title": "A no nonsense intro to BM25",
        "source": "Abhishek Thakur",
        "url": "https://www.youtube.com/watch?v=TW9vHU1GpU4",
        "minutes": 16,
        "note": ""
      },
      {
        "id": "E3-r5",
        "kind": "doc",
        "title": "Exponential Backoff And Jitter",
        "source": "aws.amazon.com",
        "url": "https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/",
        "minutes": 10,
        "estimate": true,
        "note": "Why full jitter beats plain backoff when many clients retry together."
      }
    ],
    "minutes": 425,
    "duration": "≈7h 5m",
    "questions": [
      "Cosine top-k over 10,000 vectors with numpy and no Python loop. Then normalise at index time and use a dot product: why is it equivalent?",
      "BM25 over a small corpus: write idf, term-frequency saturation (k1) and length normalisation (b). Compare it with TF-IDF on three queries.",
      "Reciprocal Rank Fusion of two ranked lists with k = 60. What happens to an item that appears in only one list?",
      "A text chunker with overlap that counts tokens, not characters, and never splits mid-sentence.",
      "Retry with exponential backoff and full jitter, only on 429 and 5xx, honouring Retry-After.",
      "Async batched embedding calls: a semaphore for concurrency, a token bucket for rate, results returned in input order.",
      "An LRU cache with a TTL. Then a semantic cache keyed by embedding similarity: when is it dangerous?",
      "A minimal agent loop: model call, tool call, append the result, repeat, with a step cap and a token budget. What do you return when the cap is hit?",
      "Parse a model's JSON reply with pydantic. On failure retry once with the error message, then give up cleanly."
    ]
  },
  {
    "id": "F1",
    "section": "F",
    "sectionLabel": "LLM fundamentals",
    "priority": "P1",
    "title": "Tokens, context windows, sampling and hallucination",
    "why": "The LLM-basics round is short but unforgiving of vagueness: tokens against words, why long context costs more, what temperature changes, and why temperature 0 still is not deterministic. Karpathy's one-hour talk is the best single use of an hour here.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "explain tokenisation, context windows, the KV cache, sampling and hallucination in plain words, with one example each.",
      "tooDeep": "attention maths, positional encodings, training objectives."
    },
    "resources": [
      {
        "id": "F1-r1",
        "kind": "video",
        "title": "Large Language Models explained briefly",
        "source": "3Blue1Brown",
        "url": "https://www.youtube.com/watch?v=LPZh9BOjkQs",
        "minutes": 8,
        "note": ""
      },
      {
        "id": "F1-r2",
        "kind": "video",
        "title": "[1hr Talk] Intro to Large Language Models",
        "source": "Andrej Karpathy",
        "url": "https://www.youtube.com/watch?v=zjkBMFhNj_g",
        "minutes": 60,
        "note": "00:00–17:52 how they work; 27:43 tool use; 45:43–58:37 security (jailbreaks, and prompt injection at 51:30). Skip the appendix."
      },
      {
        "id": "F1-r3",
        "kind": "video",
        "title": "LLM Prompt Engineering with Random Sampling: Temperature, Top-k, Top-p",
        "source": "DataMListic",
        "url": "https://www.youtube.com/watch?v=-BBulGM6xF0",
        "minutes": 8,
        "note": ""
      },
      {
        "id": "F1-r4",
        "kind": "video",
        "title": "Why Large Language Models Hallucinate",
        "source": "IBM Technology",
        "url": "https://www.youtube.com/watch?v=cfqtFvWOfg0",
        "minutes": 10,
        "note": ""
      },
      {
        "id": "F1-r5",
        "kind": "video",
        "title": "How KV Cache Speeds Up LLMs for Faster AI Models on GPUs",
        "source": "IBM Technology",
        "url": "https://www.youtube.com/watch?v=o0gkdZBtwEg",
        "minutes": 11,
        "note": ""
      }
    ],
    "minutes": 97,
    "duration": "1h 37m",
    "questions": [
      "Why do token counts differ from word counts, and why does it matter for cost and for chunking?",
      "Why does a longer prompt cost more latency and money? What is the KV cache?",
      "What do temperature, top-p and top-k change? Why is temperature 0 still not fully deterministic?",
      "Name three causes of hallucination and one mitigation for each.",
      "What is the context window, and what happens at its limit?",
      "Prompting, RAG or fine-tuning: one sentence on when each.",
      "Why do different providers report different token counts for the same text?"
    ]
  },
  {
    "id": "F2",
    "section": "F",
    "sectionLabel": "LLM fundamentals",
    "priority": "P1",
    "title": "Prompting and context engineering",
    "why": "Context engineering (what goes in the window, in what order, and what gets trimmed) has replaced “prompt tricks” as the senior framing. Expect: structure the prompt for caching with static content first, when to summarise and when to trim, and how you choose between prompting, RAG and fine-tuning.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "order a RAG prompt for cost and quality, and give three ways to handle a conversation that outgrows the window.",
      "tooDeep": "prompt-optimisation research; automatic prompt search."
    },
    "resources": [
      {
        "id": "F2-r1",
        "kind": "video",
        "title": "Context Engineering for Agents",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=4GiqzUHD5AA",
        "minutes": 22,
        "note": ""
      },
      {
        "id": "F2-r2",
        "kind": "video",
        "title": "RAG vs Fine-Tuning vs Prompt Engineering: Optimizing AI Models",
        "source": "IBM Technology",
        "url": "https://www.youtube.com/watch?v=zYGDpG-pTho",
        "minutes": 13,
        "note": ""
      },
      {
        "id": "F2-r3",
        "kind": "doc",
        "title": "Effective context engineering for AI agents",
        "source": "anthropic.com",
        "url": "https://www.anthropic.com/research/effective-context-engineering-for-ai-agents",
        "minutes": 25,
        "estimate": true,
        "note": ""
      }
    ],
    "minutes": 60,
    "duration": "≈1h",
    "questions": [
      "What is the difference between prompt engineering and context engineering?",
      "Order the parts of a RAG prompt for cost and quality: system, schema, examples, retrieved chunks, question. Why that order?",
      "The conversation exceeds the window. Three strategies and the tradeoff of each. (Trim, summarise, retrieve.)",
      "When would you fine-tune instead of using RAG? Give a case RAG cannot solve.",
      "How do you version prompts so a regression can be traced to a change?"
    ]
  },
  {
    "id": "G1",
    "section": "G",
    "sectionLabel": "LLM system design",
    "priority": "P2",
    "title": "Design: enterprise document Q&A (tenants, permissions, freshness)",
    "why": "The canonical applied-AI design question. Strong answers cover ingestion and freshness (change capture, deletes, re-indexing), access control at retrieval time, multi-tenancy, a latency budget and an eval plan, not only the box diagram.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "a 35-minute design with the data flow, one permission model, a latency budget and an eval plan.",
      "tooDeep": "sizing GPUs; vendor comparisons."
    },
    "resources": [
      {
        "id": "G1-r1",
        "kind": "video",
        "title": "AI System Design Tutorial",
        "source": "codebasics",
        "url": "https://www.youtube.com/watch?v=S6jy0T85DFs",
        "minutes": 43,
        "note": "05:58 gateway and auth, 10:53 guardrails, 13:59 semantic cache, 17:15 data freshness and CDC, 21:01 human in the loop, 23:15 model router, 30:03 fallback provider, 35:14 observability."
      },
      {
        "id": "G1-r2",
        "kind": "video",
        "title": "RAG at 10 Million Documents — System Design",
        "source": "Code with Lucian",
        "url": "https://www.youtube.com/watch?v=NQZqET-jjws",
        "minutes": 15,
        "note": ""
      },
      {
        "id": "G1-r3",
        "kind": "video",
        "title": "Access control for RAG and LLMs",
        "source": "Cerbos",
        "url": "https://www.youtube.com/watch?v=4VBHpziqw3o",
        "minutes": 7,
        "note": ""
      },
      {
        "id": "G1-r4",
        "kind": "doc",
        "title": "Patterns for Building LLM-based Systems & Products",
        "source": "eugeneyan.com",
        "url": "https://eugeneyan.com/writing/llm-patterns/",
        "minutes": 40,
        "estimate": true,
        "note": "Seven patterns: evals, RAG, fine-tuning, caching, guardrails, defensive UX and user feedback."
      }
    ],
    "minutes": 105,
    "duration": "≈1h 45m",
    "questions": [
      "Design document Q&A for 500 tenants and 10M documents. Walk me from ingestion to answer.",
      "A user may only see documents they have permission for. Where is that enforced, and why not in the prompt?",
      "A document is deleted or updated. How does the index stay correct?",
      "How do you keep tenant A's chunks out of tenant B's results: table per tenant, partition, or filter? Tradeoffs.",
      "Set a latency budget for the whole path. Where do the milliseconds go?",
      "How do you know the system is helping and not making things worse?",
      "What is your fallback when the vector store or the LLM provider is down?"
    ]
  },
  {
    "id": "G2",
    "section": "G",
    "sectionLabel": "LLM system design",
    "priority": "P2",
    "title": "Design: support assistant with evals and human handoff",
    "why": "“Design a support assistant; how do you know it is helping and not making things worse?” is the eval-centred design round. Define success first (resolution rate, escalation rate, satisfaction), baseline against humans, and ship behind shadow traffic or a small cohort with rollback thresholds.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "name the success metric and baseline, the handoff rule, the launch plan and the rollback trigger.",
      "tooDeep": "building the ticketing integration."
    },
    "resources": [
      {
        "id": "G2-r1",
        "kind": "video",
        "title": "Design a Customer Support Agent | Applied AI System Design",
        "source": "Aniket Wattamwar",
        "url": "https://www.youtube.com/watch?v=un1IJdX-ImQ",
        "minutes": 29,
        "note": ""
      },
      {
        "id": "G2-r2",
        "kind": "video",
        "title": "You Can Learn AI Agent System Design In 19 Min | RAG, Vector Database, Evals, Function Calling",
        "source": "Sean‘s AI Stories",
        "url": "https://www.youtube.com/watch?v=CyLYY_xb5bQ",
        "minutes": 19,
        "note": ""
      },
      {
        "id": "G2-r3",
        "kind": "video",
        "title": "AI Evals Explained | How to evaluate AI Agents?",
        "source": "Aishwarya Srinivasan",
        "url": "https://www.youtube.com/watch?v=_Er8Hao_gmQ",
        "minutes": 23,
        "note": ""
      }
    ],
    "minutes": 71,
    "duration": "1h 11m",
    "questions": [
      "Design a support assistant. How do you know it is helping and not making things worse?",
      "Define the success metric and the baseline before building anything. What are they?",
      "When does the bot hand off to a human, and how is the context passed on?",
      "A stakeholder wants to ship but the evidence is weak. What do you say, and what bounded launch do you propose?",
      "A model update makes answers worse in one product area. How do you detect it, and how do you roll back?",
      "How do you measure cost per resolved ticket?"
    ]
  },
  {
    "id": "G3",
    "section": "G",
    "sectionLabel": "LLM system design",
    "priority": "P2",
    "title": "Design: tool-using agent with approvals",
    "why": "Agent design questions test controls more than cleverness: tool schemas, least-privilege access, step and spend limits, idempotent tools, approval points, and verifying the outcome in the system of record. Your Blue Yonder agent is the reference answer.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "list the controls, say which ones are enforced in code, and say how you would test the agent before launch.",
      "tooDeep": "multi-agent research architectures."
    },
    "resources": [
      {
        "id": "G3-r1",
        "kind": "video",
        "title": "Agent AI System Design Explained in 27 Minutes",
        "source": "Aishwarya Srinivasan",
        "url": "https://www.youtube.com/watch?v=mwN75EiGfCE",
        "minutes": 27,
        "note": ""
      },
      {
        "id": "G3-r2",
        "kind": "video",
        "title": "20 Agentic AI System Design Interview Questions & Solutions",
        "source": "Keerti Purswani",
        "url": "https://www.youtube.com/watch?v=I4sGn8Z1vpI",
        "minutes": 30,
        "note": ""
      }
    ],
    "minutes": 57,
    "duration": "57m",
    "questions": [
      "Design an agent that can read and update inventory parameters. What can it do on its own, and what needs approval?",
      "How do you cap steps, tokens and spend per request?",
      "A tool call times out and the agent retries. How do you make sure a write is not applied twice?",
      "How do you verify the agent's claim of success? (In the system of record.)",
      "How do you test an agent before launch? (Replay fixed cases; check the trajectory, not only the final answer.)",
      "Which tools get which permissions, and where is that enforced?",
      "What do you trace so a run can be debugged after the fact?"
    ]
  },
  {
    "id": "G4",
    "section": "G",
    "sectionLabel": "LLM system design",
    "priority": "P2",
    "title": "Design: batch pipeline and LLM gateway",
    "why": "This is your strongest ground (Kafka, rate limits, key pools, idempotency), applied to LLMs. Be able to describe the pipeline (queue, workers, retries, dead-letter queue, a rate budget per key) and a gateway that routes between providers with fallbacks, budgets and caching.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "describe the pipeline and the gateway from your own code, and name what goes wrong with naive fallback.",
      "tooDeep": "building a gateway product."
    },
    "resources": [
      {
        "id": "G4-r1",
        "kind": "self",
        "title": "LogLens — loglens-backend llm/ (LlmGateway, ApiKeyManager, EmbeddingKeyPool) and enrich/ (EnrichConsumer, RetryConsumer, DLQ)",
        "source": "Your own codebase",
        "minutes": 30,
        "note": "You built the reference answer. Re-read it so you can describe it without notes."
      },
      {
        "id": "G4-r2",
        "kind": "video",
        "title": "LiteLLM: Free Open Source Gateway to Manage All Your LLM Providers",
        "source": "Elestio",
        "url": "https://www.youtube.com/watch?v=mwP4sdp7gW0",
        "minutes": 8,
        "note": ""
      },
      {
        "id": "G4-r3",
        "kind": "video",
        "title": "Rate Limiter System Design: Token Bucket, Leaky Bucket, Scaling",
        "source": "ByteByteGo",
        "url": "https://www.youtube.com/watch?v=YXkOdWBwqaA",
        "minutes": 8,
        "note": ""
      },
      {
        "id": "G4-r4",
        "kind": "doc",
        "title": "Building A Generative AI Platform",
        "source": "huyenchip.com",
        "url": "https://huyenchip.com/2024/07/25/genai-platform.html",
        "minutes": 40,
        "estimate": true,
        "note": "Gateway, guardrails, caching and orchestration as one platform diagram."
      }
    ],
    "minutes": 86,
    "duration": "≈1h 26m",
    "questions": [
      "Embed and summarise 50M documents overnight. Design the pipeline.",
      "Providers rate-limit per key. How do you stay under it, and what do you do on a 429?",
      "Design an LLM gateway: routing, fallbacks, budgets, caching, logging. What goes wrong with naive fallback? (Quality drift, different schemas and tokenisers, doubled latency and cost.)",
      "How do you cap spend per tenant?",
      "How would you add semantic caching, and what can go wrong?",
      "Where do poison messages go, and how do you replay them?",
      "How do you version prompts and models together so a rollout can be rolled back?"
    ]
  },
  {
    "id": "H2",
    "section": "H",
    "sectionLabel": "Beyond the core",
    "priority": "P3",
    "title": "MCP, and calling provider APIs directly",
    "why": "Interviewers increasingly test “without framework hand-waving”: call the provider's tool-use API yourself, and know the MCP vocabulary of tools, resources, prompts and transports. Check the current spec before quoting details.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "explain what MCP adds over plain function calling, and write a tool-calling loop against a provider SDK.",
      "tooDeep": "writing an MCP server; the transport specification."
    },
    "resources": [
      {
        "id": "H2-r1",
        "kind": "video",
        "title": "Model Context Protocol Clearly Explained | MCP Beyond the Hype",
        "source": "codebasics",
        "url": "https://www.youtube.com/watch?v=tzrwxLNHtRY",
        "minutes": 15,
        "note": ""
      },
      {
        "id": "H2-r2",
        "kind": "video",
        "title": "The Model Context Protocol (MCP)",
        "source": "Anthropic",
        "url": "https://www.youtube.com/watch?v=CQywdSdi5iA",
        "minutes": 20,
        "note": ""
      },
      {
        "id": "H2-r3",
        "kind": "course",
        "title": "Introduction to Model Context Protocol",
        "source": "Anthropic Academy",
        "url": "https://anthropic.skilljar.com/introduction-to-model-context-protocol",
        "minutes": 90,
        "estimate": true,
        "note": "Free, self-paced; builds an MCP server and client in Python. Listings put it at 1–2 hours."
      },
      {
        "id": "H2-r4",
        "kind": "doc",
        "title": "What is the Model Context Protocol?",
        "source": "modelcontextprotocol.io",
        "url": "https://modelcontextprotocol.io/docs/getting-started/intro",
        "minutes": 15,
        "estimate": true,
        "note": ""
      }
    ],
    "minutes": 140,
    "duration": "≈2h 20m",
    "questions": [
      "What problem does MCP solve that plain function calling does not?",
      "Tools, resources and prompts in MCP: one example of each.",
      "How do you treat a third-party MCP server's tool descriptions? (As untrusted input: they are a prompt-injection surface.)",
      "Write a tool-calling loop against a provider SDK with no framework.",
      "When would you use the stdio transport and when HTTP?"
    ]
  },
  {
    "id": "H1",
    "section": "H",
    "sectionLabel": "Beyond the core",
    "priority": "P3",
    "title": "Fine-tuning basics (conceptual)",
    "why": "Asked as “when would you fine-tune instead of using RAG?”, not as a training exercise. One paragraph each on SFT, LoRA and QLoRA, preference tuning (RLHF, DPO) and distillation is the whole ceiling for an application-layer role at this level.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "know what each technique changes, and when it beats RAG or prompting.",
      "tooDeep": "training loop internals, hyperparameter tuning, GPU memory arithmetic."
    },
    "resources": [
      {
        "id": "H1-r1",
        "kind": "video",
        "title": "What is Low-Rank Adaptation (LoRA) | explained by the inventor",
        "source": "Edward Hu",
        "url": "https://www.youtube.com/watch?v=DhRoTONcyZE",
        "minutes": 7,
        "note": ""
      },
      {
        "id": "H1-r2",
        "kind": "video",
        "title": "LoRA & QLoRA Fine-tuning Explained In-Depth",
        "source": "Mark Hennings",
        "url": "https://www.youtube.com/watch?v=t1caDsMzWBk",
        "minutes": 15,
        "note": ""
      },
      {
        "id": "H1-r3",
        "kind": "video",
        "title": "Reinforcement Learning with Human Feedback (RLHF), Clearly Explained!!!",
        "source": "StatQuest with Josh Starmer",
        "url": "https://www.youtube.com/watch?v=qPN_XZcJf_s",
        "minutes": 18,
        "note": ""
      },
      {
        "id": "H1-r4",
        "kind": "video",
        "title": "Direct Preference Optimization (DPO) - How to fine-tune LLMs directly without reinforcement learning",
        "source": "Luis Serrano Academy",
        "url": "https://www.youtube.com/watch?v=k2pD3k1485A",
        "minutes": 21,
        "note": ""
      }
    ],
    "minutes": 61,
    "duration": "1h 1m",
    "questions": [
      "When would you fine-tune instead of using RAG? Give a case RAG cannot solve.",
      "What does LoRA change, and why is it cheaper than full fine-tuning?",
      "QLoRA in one sentence.",
      "SFT, RLHF and DPO: what does each optimise?",
      "Fine-tuning for new facts against fine-tuning for style or format: which works?",
      "How would you evaluate a fine-tuned model against the base model plus a good prompt?"
    ]
  },
  {
    "id": "H3",
    "section": "H",
    "sectionLabel": "Beyond the core",
    "priority": "P3",
    "title": "Inference serving concepts — batching, KV cache, vLLM",
    "why": "Conceptual only: “design a batching system for LLM inference” has been reported in 2026 applied-AI loops. Know why requests are batched continuously, what the KV cache holds and what PagedAttention fixes, then say plainly that you have not served models yourself.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "explain continuous batching, the KV cache and PagedAttention in a few sentences each.",
      "tooDeep": "CUDA kernels, tensor parallelism, speculative decoding internals."
    },
    "resources": [
      {
        "id": "H3-r1",
        "kind": "video",
        "title": "What Is LLM Inference? How AI Models Generate Responses",
        "source": "IBM Technology",
        "url": "https://www.youtube.com/watch?v=615-yWyS1n0",
        "minutes": 8,
        "note": ""
      },
      {
        "id": "H3-r2",
        "kind": "video",
        "title": "PagedAttention: Behind vLLM's Insane Speed",
        "source": "Tales Of Tensors",
        "url": "https://www.youtube.com/watch?v=6uPnLkCiy5g",
        "minutes": 7,
        "note": ""
      },
      {
        "id": "H3-r3",
        "kind": "video",
        "title": "What is vLLM? Efficient AI Inference for Large Language Models",
        "source": "IBM Technology",
        "url": "https://www.youtube.com/watch?v=McLdlg5Gc9s",
        "minutes": 5,
        "note": ""
      },
      {
        "id": "H3-r4",
        "kind": "doc",
        "title": "vLLM: Easy, Fast, and Cheap LLM Serving with PagedAttention",
        "source": "vllm.ai",
        "url": "https://vllm.ai/blog/2023-06-20-vllm",
        "minutes": 15,
        "estimate": true,
        "note": ""
      }
    ],
    "minutes": 35,
    "duration": "≈35m",
    "questions": [
      "Why batch LLM requests, and why is static batching wasteful?",
      "What does the KV cache store, and why does it grow with context length?",
      "What problem does PagedAttention solve?",
      "Time to first token against inter-token latency: what drives each?",
      "Design a batching layer in front of a GPU server. What do you trade off?",
      "Have you served a model yourself? (Say what is true: application layer, concepts understood.)"
    ]
  },
  {
    "id": "H4",
    "section": "H",
    "sectionLabel": "Beyond the core",
    "priority": "P3",
    "title": "Classical ML metrics refresher",
    "why": "Only for “ML Engineer” job descriptions; backend-leaning GenAI roles rarely go beyond precision, recall and F1. Half an hour so a metrics question never catches you cold.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "precision, recall, F1 and AUC with one example each, and how they map to precision@k and recall@k.",
      "tooDeep": "deriving losses; model-selection theory."
    },
    "resources": [
      {
        "id": "H4-r1",
        "kind": "video",
        "title": "ROC and AUC, Clearly Explained!",
        "source": "StatQuest with Josh Starmer",
        "url": "https://www.youtube.com/watch?v=4jRBRDbJemM",
        "minutes": 16,
        "note": ""
      },
      {
        "id": "H4-r2",
        "kind": "video",
        "title": "Precision, Recall, F1 score, True Positive|Deep Learning Tutorial 19 (Tensorflow2.0, Keras & Python)",
        "source": "codebasics",
        "url": "https://www.youtube.com/watch?v=2osIZ-dSPGE",
        "minutes": 12,
        "note": ""
      }
    ],
    "minutes": 28,
    "duration": "28m",
    "questions": [
      "Precision against recall: give an example where each matters more.",
      "What is F1, and why not accuracy on imbalanced data?",
      "What does AUC measure?",
      "How do precision and recall map to precision@k and recall@k in retrieval?",
      "Bias against variance, in two sentences."
    ]
  }
];

export const AI_STACK_SKIP = {
  "topics": [
    "Transformer internals",
    "attention math",
    "pretraining from scratch",
    "GPU kernels and serving internals",
    "model architecture comparisons",
    "multimodal and voice"
  ],
  "line": "I work at the application layer — I've shipped agents and RAG in production, and I understand fine-tuning and serving at the concept level, but I haven't trained or served models myself."
};

export const AI_STACK_PRIORITIES = ["P0","P1","P2","P3"];

export const AI_STACK_PRIORITY_CONFIG = {
  P0: { label: "P0", blurb: "A resume claim you can't fumble — your systems and the concepts under them", cls: "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30" },
  P1: { label: "P1", blurb: "Asked in almost every loop — do before any real interview", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  P2: { label: "P2", blurb: "System design and production — after P0 and P1", cls: "bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30" },
  P3: { label: "P3", blurb: "Differentiators. Skip under time pressure", cls: "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30" },
};

export const AI_STACK_TOTAL = 34;

export const AI_STACK_PRIORITY_COUNTS = {"P0":11,"P1":12,"P2":7,"P3":4};

export const AI_STACK_SECTION_COUNTS = {"R":5,"A":6,"C":3,"B":4,"D":3,"E":3,"F":2,"G":4,"H":4};

export const AI_STACK_MINUTES = 3311;
