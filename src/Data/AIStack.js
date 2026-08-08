// AI Stack — the GenAI topic set, one card per topic.
//
// GENERATED FILE. Edit scripts/data/genaiPrepMap.md and re-run
// `node scripts/genAIStack.mjs` — do not edit here.
//
// One resource per topic, by design: the map's first rule is that if a resource
// isn't listed, it isn't read. Each topic also carries a depth ceiling — what is
// enough, and where going deeper stops paying — and the questions to attempt
// before opening the resource.
//
// `resource.path` is an in-site route ("Tutorials → RAG") for docs whose deep
// links move; the URL points at the stable entry page and the path says where to
// go from there.

export const AI_STACK_SECTIONS = [
  {
    "key": "A",
    "label": "RAG",
    "chip": "RAG"
  },
  {
    "key": "B",
    "label": "LangChain + LangGraph",
    "chip": "LangGraph"
  },
  {
    "key": "C",
    "label": "Is my AI actually working?",
    "chip": "Evals"
  },
  {
    "key": "D",
    "label": "Production essentials",
    "chip": "Production"
  }
];

export const AI_STACK_TOPICS = [
  {
    "id": "A1",
    "part": "A",
    "section": "RAG",
    "title": "Chunking & embeddings",
    "resource": {
      "publisher": "Pinecone Learn",
      "name": "Chunking Strategies for LLM Applications",
      "url": "https://pinecone.io/learn/chunking-strategies",
      "path": "",
      "readNote": ""
    },
    "duration": "~30m",
    "minutes": 30,
    "resumeLinked": false,
    "flag": "",
    "note": "",
    "ceiling": {
      "enough": "name the strategies, say which you picked for logs and why, know what breaks at each size extreme.",
      "tooDeep": "embedding model architecture, training objectives, contrastive loss."
    },
    "questions": [
      "Chunk too small → what breaks? Too large → what breaks?",
      "What is overlap for, and what does it cost you?",
      "Fixed-size vs recursive vs semantic vs structure-aware. Pick one for log data and defend it.",
      "Why can't you compare embeddings from two different models?",
      "You swap embedding models. What happens to your existing index?",
      "Retrieval returns garbage. Give your debug order: chunking → embedding → index → query → top-k.",
      "Where does document extraction fail? (Tables, multi-column PDFs, scans, headers.)"
    ]
  },
  {
    "id": "A2",
    "part": "A",
    "section": "RAG",
    "title": "Vector index internals — HNSW, ANN, filtering",
    "resource": {
      "publisher": "",
      "name": "pgvector README",
      "url": "https://github.com/pgvector/pgvector",
      "path": "",
      "readNote": "read the Indexing and Filtering sections"
    },
    "duration": "~30m",
    "minutes": 30,
    "resumeLinked": true,
    "flag": "Your resume claims HNSW + post-filtered ANN recall loss.",
    "note": "",
    "ceiling": {
      "enough": "HNSW is a layered graph you greedily descend; it's approximate; m/ef_construction/ef_search trade recall for speed; filtering after the ANN search throws away results the index already narrowed.",
      "tooDeep": "skip-list probability distributions, graph pruning heuristics, SIMD distance kernels."
    },
    "questions": [
      "Explain HNSW in three sentences. Why layers?",
      "HNSW vs IVFFlat — build time, query time, recall, memory. When does IVFFlat win?",
      "What do m, ef_construction, ef_search control?",
      "What is ANN recall and why isn't it 100%?",
      "Pre-filter vs post-filter. Why does post-filtering lose recall? ← the one that backs your per-session-table decision",
      "Why is exact KNN fine at 10k vectors and fatal at 10M?",
      "Why pgvector over Pinecone/Qdrant? Give the honest tradeoff, not a sales pitch."
    ]
  },
  {
    "id": "A3",
    "part": "A",
    "section": "RAG",
    "title": "Hybrid search + reranking",
    "resource": {
      "publisher": "Pinecone Learn",
      "name": "Rerankers and Two-Stage Retrieval",
      "url": "https://pinecone.io/learn/series/rag/rerankers",
      "path": "",
      "readNote": ""
    },
    "duration": "~30m",
    "minutes": 30,
    "resumeLinked": true,
    "flag": "Resume: hybrid vector + full-text, GIN indexes.",
    "note": "",
    "ceiling": {
      "enough": "bi-encoder retrieves fast and lossy, cross-encoder reranks slow and accurate; you can't afford the cross-encoder at corpus scale.",
      "tooDeep": "ColBERT late interaction, training a reranker."
    },
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
    "part": "A",
    "section": "RAG",
    "title": "Corrective / agentic RAG",
    "resource": {
      "publisher": "LangGraph docs",
      "name": "Agentic RAG tutorial",
      "url": "https://langchain-ai.github.io/langgraph",
      "path": "Tutorials → RAG",
      "readNote": ""
    },
    "duration": "~40m",
    "minutes": 40,
    "resumeLinked": true,
    "flag": "Your resume claims retrieve → grade → rewrite → re-retrieve.",
    "note": "",
    "ceiling": {
      "enough": "draw the graph, name every branch, state the latency cost, say when plain RAG is better.",
      "tooDeep": "the CRAG paper's benchmark tables."
    },
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
    "id": "A5",
    "part": "A",
    "section": "RAG",
    "title": "RAG failure taxonomy",
    "resource": {
      "publisher": "Pinecone Learn",
      "name": "RAG series, intro chapter",
      "url": "https://pinecone.io/learn/series/rag",
      "path": "",
      "readNote": ""
    },
    "duration": "~30m",
    "minutes": 30,
    "resumeLinked": false,
    "flag": "",
    "note": "",
    "ceiling": {
      "enough": "name where a RAG pipeline breaks and which metric catches each.",
      "tooDeep": "survey papers."
    },
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
    "id": "B1",
    "part": "B",
    "section": "LangChain + LangGraph",
    "title": "LangChain — what it is, and when not to use it",
    "resource": {
      "publisher": "LangChain docs",
      "name": "Conceptual Guide",
      "url": "https://python.langchain.com",
      "path": "Conceptual guide",
      "readNote": ""
    },
    "duration": "~30m",
    "minutes": 30,
    "resumeLinked": false,
    "flag": "",
    "note": "",
    "ceiling": {
      "enough": "it's an abstraction layer over models/retrievers/tools; LCEL composes them; you know when the abstraction costs more than it saves.",
      "tooDeep": "memorising integration APIs."
    },
    "questions": [
      "LangChain vs LangGraph — when do you use each? (Chains and retrieval flows → LangChain. Stateful, cyclic, needs checkpointing → LangGraph.)",
      "What does LCEL give you over plain function calls? (Streaming, batching, async, tracing — for free.)",
      "Would you use LangChain in production, or call the provider SDK directly? Defend it.",
      "What's the cost of the abstraction when you need to debug?",
      "How do you swap providers without rewriting the pipeline?"
    ]
  },
  {
    "id": "B2",
    "part": "B",
    "section": "LangChain + LangGraph",
    "title": "LangGraph core — state, edges, routing, checkpointing, HITL",
    "resource": {
      "publisher": "LangChain Academy",
      "name": "Quickstart: LangGraph Essentials (Python)",
      "url": "https://academy.langchain.com/courses/langgraph-essentials-python",
      "path": "",
      "readNote": ""
    },
    "duration": "13 lessons, ~1h",
    "minutes": 60,
    "resumeLinked": true,
    "flag": "Covers your HITL interrupt claim directly (Lesson 5).",
    "note": "Free, official, and the only source guaranteed current — the API changes quarterly and most tutorials are two versions stale.",
    "ceiling": {
      "enough": "draw your own graph on a whiteboard, explain state/reducers, explain what a checkpointer buys you, explain what happens across a crash and across a human wait.",
      "tooDeep": "LangGraph internals, Pregel execution model."
    },
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
      "The underlying data changed while the human was deciding. Now what?"
    ]
  },
  {
    "id": "B3",
    "part": "B",
    "section": "LangChain + LangGraph",
    "title": "Agents — ReAct, tool calling, and when not to",
    "resource": {
      "publisher": "Anthropic",
      "name": "Building Effective Agents",
      "url": "https://anthropic.com/engineering/building-effective-agents",
      "path": "",
      "readNote": ""
    },
    "duration": "~30m",
    "minutes": 30,
    "resumeLinked": false,
    "flag": "",
    "note": "",
    "ceiling": {
      "enough": "explain the ReAct loop, name the workflow patterns, and argue for the simplest thing that works.",
      "tooDeep": "the ReAct paper's benchmarks, agent-framework comparisons."
    },
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
    "id": "B4",
    "part": "B",
    "section": "LangChain + LangGraph",
    "title": "Memory — short-term vs long-term",
    "resource": {
      "publisher": "LangChain Academy",
      "name": "Ambient Agents, Module 5: Memory",
      "url": "https://academy.langchain.com/courses/ambient-agents",
      "path": "",
      "readNote": ""
    },
    "duration": "~20m",
    "minutes": 20,
    "resumeLinked": false,
    "flag": "",
    "note": "",
    "ceiling": {
      "enough": "thread-scoped vs cross-thread, what you store, when you write.",
      "tooDeep": "memory-architecture research, Mem0 internals."
    },
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
    "id": "C1",
    "part": "C",
    "section": "Is my AI actually working?",
    "title": "RAG metrics",
    "resource": {
      "publisher": "RAGAS docs",
      "name": "Core Concepts → Metrics",
      "url": "https://docs.ragas.io",
      "path": "",
      "readNote": ""
    },
    "duration": "~40m",
    "minutes": 40,
    "resumeLinked": false,
    "flag": "",
    "note": "",
    "ceiling": {
      "enough": "define the four core metrics, say which measure retrieval vs generation, and diagnose a system from its scores.",
      "tooDeep": "the RAGAS paper's math, every metric in the library."
    },
    "questions": [
      "Define faithfulness, answer relevancy, context precision, context recall. Which two measure retrieval, which two measure generation?",
      "Faithfulness is 0.91 but users say answers miss key information. Which metric catches it, and why did faithfulness stay high? (Context recall. The retriever missed a doc; the generator answered coherently from partial context.)",
      "How is faithfulness computed? (Decompose the answer into claims, entailment-check each against context.)",
      "Context precision vs context recall — which do you fix by changing top-k, and which by changing chunking?",
      "Reference-free vs reference-based eval. When do you need ground truth?",
      "All four scores are high but users are unhappy. What are you not measuring?"
    ]
  },
  {
    "id": "C2",
    "part": "C",
    "section": "Is my AI actually working?",
    "title": "LLM-as-judge + building an eval loop",
    "resource": {
      "publisher": "Hamel Husain",
      "name": "Your AI Product Needs Evals",
      "url": "https://hamel.dev/blog/posts/evals",
      "path": "",
      "readNote": ""
    },
    "duration": "~40m",
    "minutes": 40,
    "resumeLinked": true,
    "flag": "Your resume claims an LLM-as-judge groundedness loop.",
    "note": "",
    "ceiling": {
      "enough": "explain how you'd build a golden set, validate the judge against humans, and gate changes on it.",
      "tooDeep": "judge-model fine-tuning, academic agreement statistics."
    },
    "questions": [
      "Who judges the judge? How do you know yours isn't drifting?",
      "Name three known LLM-judge biases. (Position, verbosity, self-preference.)",
      "How do you validate a judge against human labels? What agreement is good enough?",
      "Binary pass/fail vs 1–5 scale — which is more reliable and why?",
      "How big should a golden set be? How do you build one without manual-labelling hell?",
      "Your judge and your generator are the same model. What's the problem?",
      "Error analysis: 50 failures in front of you. What's your process?",
      "How did you know LogLens's groundedness loop was actually working? ← answer this honestly; \"we didn't fully validate it\" is a strong answer"
    ]
  },
  {
    "id": "C3",
    "part": "C",
    "section": "Is my AI actually working?",
    "title": "Production monitoring + regression",
    "resource": {
      "publisher": "LangSmith docs",
      "name": "Evaluation Concepts",
      "url": "https://docs.smith.langchain.com",
      "path": "Evaluation",
      "readNote": ""
    },
    "duration": "~40m",
    "minutes": 40,
    "resumeLinked": false,
    "flag": "",
    "note": "",
    "ceiling": {
      "enough": "describe the three-layer pattern — offline eval gates merges, online eval samples production, monitoring alerts on drift.",
      "tooDeep": "LangSmith's full API surface."
    },
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
    "id": "D1",
    "part": "D",
    "section": "Production essentials",
    "title": "Prompt injection + guardrails",
    "resource": {
      "publisher": "",
      "name": "OWASP Top 10 for LLM Applications",
      "url": "https://genai.owasp.org",
      "path": "",
      "readNote": "read LLM01 and LLM02 only"
    },
    "duration": "~30m",
    "minutes": 30,
    "resumeLinked": false,
    "flag": "",
    "note": "",
    "ceiling": {
      "enough": "direct vs indirect injection, why prompting alone can't fix it, where guardrails sit.",
      "tooDeep": "jailbreak taxonomies, adversarial ML."
    },
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
    "id": "D2",
    "part": "D",
    "section": "Production essentials",
    "title": "Structured outputs + text-to-SQL guardrails",
    "resource": {
      "publisher": "LangChain docs",
      "name": "Structured outputs",
      "url": "https://python.langchain.com",
      "path": "Conceptual guide → Structured outputs",
      "readNote": ""
    },
    "duration": "~30m",
    "minutes": 30,
    "resumeLinked": true,
    "flag": "Resume: guardrailed SQL via sqlglot in the RCA agent.",
    "note": "",
    "ceiling": {
      "enough": "three ways to force structure and their reliability; why SQL needs layered defence.",
      "tooDeep": "constrained-decoding/grammar internals."
    },
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
    "id": "D3",
    "part": "D",
    "section": "Production essentials",
    "title": "Cost, latency, caching",
    "resource": {
      "publisher": "Anthropic docs",
      "name": "Prompt caching",
      "url": "https://docs.claude.com",
      "path": "Build with Claude → Prompt caching",
      "readNote": ""
    },
    "duration": "~30m",
    "minutes": 30,
    "resumeLinked": false,
    "flag": "",
    "note": "",
    "ceiling": {
      "enough": "where the time and money go, and what caching changes.",
      "tooDeep": "KV-cache internals, GPU serving."
    },
    "questions": [
      "What gets cached, and what invalidates the cache?",
      "Where do you place a cache breakpoint in a RAG prompt? (Static system + schema before dynamic context.)",
      "Where does latency actually go in an LLM call? (TTFT vs total; prefill vs decode.)",
      "How do you cap spend per tenant?",
      "Different providers, different tokenizers. How do you compare cost fairly?",
      "Temperature 0 — is output deterministic? (No. Explain why.)"
    ]
  }
];

export const AI_STACK_SKIP = {
  "topics": [
    "Transformer internals",
    "attention math",
    "training/RLHF",
    "quantization",
    "vLLM/GPU serving",
    "model architecture comparisons."
  ],
  "line": "I work at the application layer — I've shipped agents and RAG in production, but I haven't trained or served models myself."
};

export const AI_STACK_TOTAL = 15;

export const AI_STACK_SECTION_COUNTS = {"A":5,"B":4,"C":3,"D":3};

export const AI_STACK_MINUTES = 510;
