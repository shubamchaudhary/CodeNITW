// AI Stack — the GenAI topic set, one card per topic.
//
// GENERATED FILE. Edit scripts/data/aiStackMap.mjs (what to study, in what
// order, and the interview drill) or scripts/data/aiStackVideos.csv (written by
// scripts/verifyAIVideos.mjs) and re-run `node scripts/genAIStack.mjs` — do not
// edit here.
//
// Every video is resolved against the CSV at generation time and the build fails
// on a miss, so no title, channel or runtime on this page is invented. Resources
// with kind "self" have no link on purpose: they are your own work or memory.
// Paid courses say so in their source line. Topics are ordered by section, then
// priority. The drill answers live in AIStackAsked.js, loaded on demand.

export const AI_STACK_SECTIONS = [
  {
    "key": "B",
    "label": "Part 1 · Foundations",
    "chip": "Foundations"
  },
  {
    "key": "R",
    "label": "Part 2 · RAG",
    "chip": "RAG"
  },
  {
    "key": "A",
    "label": "Part 3 · Agents",
    "chip": "Agents"
  },
  {
    "key": "E",
    "label": "Part 4 · Evals",
    "chip": "Evals"
  },
  {
    "key": "D",
    "label": "Part 5 · Production",
    "chip": "Production"
  },
  {
    "key": "P",
    "label": "Part 6 · System design",
    "chip": "Design"
  }
];

export const AI_STACK_TOPICS = [
  {
    "id": "CH-01",
    "section": "B",
    "sectionLabel": "Part 1 · Foundations",
    "priority": "P0",
    "title": "Chapter 1 — How LLMs work and how to steer them",
    "why": "Everything else in AI engineering sits on this: what a model actually does when it answers, why answers vary and sometimes invent facts, what tokens and context windows cost, what is inside a transformer, and how to steer a model with prompts instead of hoping.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "explain next-token prediction, sampling and temperature, tokens and the context window, attention in plain words, and how you'd structure and test a production prompt.",
      "tooDeep": "attention maths, training objectives, positional-encoding formulas."
    },
    "know": [
      "Tokens aren't words (English averages roughly ¾ of a word per token; code and other languages differ). Billing, limits and chunking are all in tokens, and tokenisers differ between providers.",
      "Generation is next-token prediction: the model outputs a probability distribution, sampling picks a token, repeat. Temperature reshapes the distribution; top-p and top-k truncate it.",
      "Structure: role and goal, rules with edge cases, examples, output schema, and clearly delimited input.",
      "Few-shot examples should cover hard boundaries, balance labels and vary wording; dynamic few-shot retrieves similar examples per input.",
      "Tokens are embedded as vectors plus position information; every later step works on that list of vectors.",
      "Attention: each token's query is compared with earlier tokens' keys, giving weights for a mix of their values; multi-head runs several in parallel.",
      "Fine-tuning teaches behaviour (format, style, a narrow task) reliably and facts unreliably; facts stay in RAG.",
      "SFT trains on input-output pairs; quality beats quantity; always compare with the best prompt on the base model.",
      "Prefill processes the prompt (decides time to first token); decode generates token by token (limited by memory speed).",
      "Continuous batching adds and removes requests every step, keeping GPUs busy; bigger batches trade latency for throughput."
    ],
    "resources": [],
    "minutes": 0,
    "duration": "—",
    "questions": [
      "Why do token counts differ from word counts, and why does it matter?",
      "What do temperature, top-p and top-k change? Why is temperature 0 still not deterministic?",
      "Why does a longer prompt cost more latency and money? What is the KV cache?",
      "Name three causes of hallucination and a mitigation for each.",
      "What happens at the context-window limit?",
      "How do you structure a production prompt?",
      "When does chain-of-thought help, and when doesn't it?",
      "How do you choose few-shot examples?",
      "Your team keeps hand-patching a prompt and each fix breaks something else. What process do you put in place?",
      "Explain attention in one minute.",
      "Encoder vs decoder models — which do you use where?",
      "What is a mixture-of-experts model?",
      "When would you fine-tune instead of using RAG?",
      "What does LoRA change, and why is it cheaper?",
      "RLHF vs DPO?",
      "Your extraction prompt is 95% accurate on a large model but too slow and expensive. What do you do?"
    ],
    "asked": {
      "posts": 0,
      "items": 16
    }
  },
  {
    "id": "CH-02",
    "section": "R",
    "sectionLabel": "Part 2 · RAG",
    "priority": "P0",
    "title": "Chapter 2 — RAG end to end: embeddings, chunking, ingestion and grounded answers",
    "why": "The standard opener of an AI interview: how does a model answer from your own documents? Walk the pipeline from pasting text into the prompt, to chunks, embeddings and search, and know why each step exists, what it costs, and how embeddings learn what “similar” means.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "draw both RAG pipelines from memory, choose and justify a chunking strategy, explain embeddings and contrastive training, and say when not to use RAG.",
      "tooDeep": "framework loader APIs; training embedding models from scratch."
    },
    "know": [
      "Offline: load → parse (tables, headings) → chunk → embed → index (vector + keyword), with metadata: source, version, ACL, timestamp.",
      "Online: query → (rewrite) → retrieve top-k → (rerank to top-n) → assemble context with ids → generate with citations → (check groundedness).",
      "Strategies: fixed-size with overlap · recursive by separators (paragraph → line → sentence) · structure-aware (headings, sections, tables) · semantic (split where neighbouring sentences stop being similar). Recursive at a few hundred tokens is a strong baseline.",
      "Count tokens, not characters: an embedder silently truncates past its maximum input, often 512 tokens.",
      "Embedding models learn “similar” from pairs that belong together (question-answer, query-click), pulled together while non-matching texts are pushed apart (contrastive learning).",
      "In-batch negatives come free from other pairs in a batch; hard negatives (similar but wrong) teach fine distinctions."
    ],
    "resources": [],
    "minutes": 0,
    "duration": "—",
    "questions": [
      "You have a 200-page PDF and a question. What happens between pressing Enter and the answer?",
      "Where does the latency go, and what would you cache?",
      "When would you not use RAG?",
      "How do you make the answer cite sources, and check that the citations are real?",
      "A source document is edited. What has to change in the index?",
      "How do you choose chunk size and overlap?",
      "What is parent-child retrieval, and when does it help?",
      "What is contextual retrieval, and what does it cost?",
      "How would you pick an embedding model?",
      "Cosine similarity, dot product or L2 — which, and why?",
      "Why do embeddings put similar meanings close together?",
      "What are hard negatives, and why do they matter?",
      "Your domain vocabulary keeps defeating the embedding model. What do you do, in order?",
      "What are Matryoshka embeddings, and why would you use them?",
      "How would you handle tables in a RAG system?",
      "Some of your PDFs are scans. What changes?",
      "How do you keep the index in sync as 12,000 documents change?",
      "Models have million-token context windows now. Is RAG dead?",
      "“How many tickets were escalated last month, by region?” — RAG or SQL?"
    ],
    "asked": {
      "posts": 0,
      "items": 19
    }
  },
  {
    "id": "CH-03",
    "section": "R",
    "sectionLabel": "Part 2 · RAG",
    "priority": "P0",
    "title": "Chapter 3 — Making retrieval good: indexes, hybrid search, reranking and query rewriting",
    "why": "Once search works, it must be fast at millions of vectors and right on exact codes and names. HNSW, the filtering trap, BM25, rank fusion, rerankers and the choice of vector store are where interviewers go one level deeper.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "explain HNSW and its knobs, the post-filtering trap and fixes, BM25 and RRF with a worked example, bi- vs cross-encoders, and how you'd choose a vector store.",
      "tooDeep": "ANN proofs, learning-to-rank theory, vendor feature tables."
    },
    "know": [
      "ANN trades exactness for speed: you tune recall against latency, and you should measure recall against an exact scan on a sample.",
      "HNSW: a multi-layer proximity graph; search enters at the sparse top layer and greedily descends. `m` = links per node (recall and memory up), `ef_construction` = build-time candidate list (quality and build time up), `ef_search` = query-time candidate list (recall and latency up).",
      "Vector search wins on paraphrase and meaning; keyword search (BM25) wins on exact identifiers, codes, names and rare terms. Logs, SKUs and error codes are lexical.",
      "BM25 = IDF (rare terms weigh more) × saturating term frequency (k1) × length normalisation (b). Postgres `ts_rank` is not BM25: it has no corpus-wide IDF.",
      "pgvector: vectors next to your data with transactions, joins, access control; great until scale or filtered-search needs outgrow it.",
      "Dedicated vector databases (Qdrant, Weaviate, Milvus, managed Pinecone): filtering, sharding and replication built in.",
      "Multi-query / RAG-Fusion: 3–5 rephrasings, retrieve for each, fuse with RRF. Lifts recall on vague questions; costs one LLM call and N retrievals.",
      "Decomposition splits multi-part questions; step-back asks a more general question first; HyDE embeds a hypothetical answer instead of the question.",
      "First question: was the answer in the retrieved context? No → ingestion or retrieval. Yes → context assembly or generation.",
      "Ingestion: bad parsing (tables, scanned PDFs), missing documents, a stale index, a wrong ACL filter. Retrieval: chunk boundaries, vocabulary mismatch, k too small, poor ranking.",
      "Detect the document type first: a digital PDF has a text layer; a scan needs OCR.",
      "Layout-aware parsers (Docling, Unstructured, or a vision model per page) recover reading order, headings and tables.",
      "Long context doesn't remove RAG: cost and latency scale with tokens, quality degrades with length, and there's no per-user access control, freshness or citation by default. Combine them: retrieve, then use a generous window.",
      "Prompt caching makes long static context cheap — the right answer for a small, stable corpus."
    ],
    "resources": [],
    "minutes": 0,
    "duration": "—",
    "questions": [
      "Explain how HNSW finds nearest neighbours.",
      "What do m, ef_construction and ef_search control? How would you tune them?",
      "Pre-filtering vs post-filtering in vector search — what goes wrong with each?",
      "HNSW or IVFFlat in pgvector?",
      "Why one HNSW index per session instead of one shared table with a filter?",
      "Write the RRF formula. Why k = 60, and why rank-based?",
      "Explain BM25. What does it do better than TF-IDF?",
      "Bi-encoder vs cross-encoder — why not retrieve with the cross-encoder?",
      "On your data, hybrid search had a lower MRR than keyword search alone. What do you do?",
      "When is reranking not worth it?",
      "pgvector or a dedicated vector database?",
      "When would you pick Elasticsearch or OpenSearch for RAG?",
      "Why isn't FAISS a database?",
      "Draw corrective RAG. What stops it looping forever?",
      "What does corrective RAG cost, and how do you know it's worth it?",
      "Multi-query, HyDE or decomposition — when each?",
      "What is agentic RAG, and what are its risks?",
      "How would you route a query between a vector index, SQL and “no retrieval”?",
      "The right document exists, but the answer is wrong. Debug it.",
      "How do you tell a retrieval failure from a generation failure at scale?",
      "What is “lost in the middle”, and what do you do about it?",
      "The model answers confidently when the context doesn't contain the answer. Fix it.",
      "What problem does GraphRAG solve that vector RAG doesn't?"
    ],
    "asked": {
      "posts": 0,
      "items": 23
    }
  },
  {
    "id": "CH-05",
    "section": "A",
    "sectionLabel": "Part 3 · Agents",
    "priority": "P0",
    "title": "Chapter 4 — Agents and workflows: tools, the loop, context and memory",
    "why": "Agents are built on one primitive, the tool call, and every framework hides the same loop. Knowing the loop by hand, structured output, what LangChain v1 and its middleware give you, and when to write an explicit LangGraph workflow is what agent questions test.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "write the tool-calling loop by hand, get reliable structured output, explain LangChain v1 vs LangGraph and middleware order, and sketch a LangGraph workflow with state, reducers and a capped loop.",
      "tooDeep": "LCEL internals; every built-in middleware option."
    },
    "know": [
      "Tool calling: you send tool names, descriptions and JSON schemas; the model returns a tool call (name + JSON arguments) instead of text; your code runs it and appends the result as a tool message with the call's id; repeat until a final answer or a cap.",
      "The model never executes anything — your code does. Validate arguments, check permissions, and return errors as tool results the model can read.",
      "Layers: LangGraph = the low-level runtime (state, graph, checkpointing, interrupts, streaming). LangChain = `create_agent` + model, tool and message abstractions + middleware, built on LangGraph. Deep Agents = an opinionated harness (planning, filesystem, subagents) on top.",
      "Use `create_agent` when the design is the standard tool-calling loop; drop to LangGraph for custom control flow — fixed steps, parallel branches, approval gates at chosen points, several agents.",
      "Map-reduce: a conditional edge returns `[Send('node', payload) ...]`; branches run in one super-step; a list reducer collects results; cap with `max_concurrency`.",
      "Subgraphs are compiled graphs used as nodes, with their own state and checkpoint namespace; shared fields flow by name.",
      "Patterns: supervisor (one router agent delegates) · handoffs / swarm (agents pass control with `Command(goto=...)`) · agent-as-tool / subagents (a main agent calls specialists and gets back a summary).",
      "Several agents help when work is parallel and separable (research breadth), one window can't hold all the intermediate work, or tools and prompts need isolation. They hurt when steps depend on each other's decisions."
    ],
    "resources": [],
    "minutes": 0,
    "duration": "—",
    "questions": [
      "Write a tool-calling agent loop without a framework.",
      "How does the model “know” about your tools? What actually reaches it?",
      "How do you get reliable structured output from an LLM?",
      "A tool call fails or times out. What does the agent do?",
      "What makes a good tool for an agent?",
      "How would you send easy questions to a cheap model and hard ones to a strong model?",
      "Why is a model fallback risky, and how do you make it safe?",
      "Workflow or agent — which is your default, and why?",
      "Name the workflow patterns and a use for each.",
      "What controls does every production agent need?",
      "What is the agent-computer interface, and why does it matter?",
      "The conversation exceeds the context window. What are your options?",
      "What can go wrong with long-term memory?",
      "Prompt engineering vs context engineering?",
      "One agent or several — how do you decide?",
      "Supervisor vs swarm (handoffs) — what's the difference?",
      "What did Anthropic learn from building their multi-agent research system?",
      "What is a “deep agent”?"
    ],
    "asked": {
      "posts": 0,
      "items": 18
    }
  },
  {
    "id": "CH-06",
    "section": "A",
    "sectionLabel": "Part 3 · Agents",
    "priority": "P0",
    "title": "Chapter 5 — Production agents with LangGraph and LangChain: state, checkpoints, human-in-the-loop",
    "why": "LangGraph is how teams build agents whose steps they control, and interviews probe whether you understand the runtime, not just the diagram: reducers and parallel writes, super-steps, Send, checkpoints and threads, interrupt and resume (and why the node re-runs), retries and crash recovery, memory, streaming, subgraphs and multi-agent designs, and how it runs in production.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "write a graph with typed state, reducers, a conditional edge and a capped loop; explain super-steps, Send, checkpoints, threads and time travel; implement an approval with interrupt and Command(resume); and describe a production setup.",
      "tooDeep": "Pregel internals; the Agent Server's API; every checkpointer backend."
    },
    "know": [
      "State is a typed schema; nodes return partial updates; each key's reducer merges them: none = overwrite, operator.add = concatenate, add_messages = append or replace by id. Two parallel writes to a key without a reducer raise InvalidUpdateError.",
      "Edges: add_edge (always), add_conditional_edges with a router returning node names, or a node returning Command(update=..., goto=...). compile() returns a runnable app.",
      "Super-steps: all scheduled nodes run in parallel on the state as it was; updates merge at the end of the round; a checkpoint is saved; edges pick the next round. Fan-in waits for every branch.",
      "Send(\"node\", input) from a router fans out a run-time number of parallel tasks (map-reduce); results merge through an appending reducer.",
      "A checkpointer saves state after every super-step under a thread_id; get_state, get_state_history, update_state and checkpoint_id give replay and forking (time travel); durability sync/async/exit trades safety for speed.",
      "interrupt(payload) pauses and saves; Command(resume=value) continues the same thread; the node re-runs from its first line on resume, so side effects go after the interrupt or must be idempotent.",
      "recursion_limit caps super-steps (raises GraphRecursionError; recent versions default very high, so set your own); prefer a counter in state or RemainingSteps for a graceful exit.",
      "Retry policies per node; resume after a crash by invoking with None on the same thread; side effects need idempotency or @task.",
      "Memory: thread state (short-term) and a Store with namespaces (long-term) via runtime.store; per-run settings via context_schema and runtime.context.",
      "Stream modes: values, updates, messages, custom, debug; subgraphs=True includes nested events. Subgraphs as nodes; supervisor vs handoffs (Command.PARENT); functional API with @entrypoint and @task.",
      "Packages: langchain-core (messages, Runnables, tools), provider packages (langchain-openai, langchain-anthropic…), langchain (create_agent, middleware), langgraph (the runtime underneath), langchain-classic (old chains), LangSmith (tracing and evals, a service).",
      "init_chat_model(\"provider:model\") gives one interface everywhere: invoke, stream, batch and their async versions; messages are System, Human, AI (text and tool_calls) and Tool (result, linked by tool_call_id)."
    ],
    "resources": [],
    "minutes": 0,
    "duration": "—",
    "questions": [
      "Why LangGraph instead of a plain agent loop, or plain Python?",
      "What is a reducer, and what happens when two parallel nodes write the same key?",
      "Explain super-steps.",
      "How do you run a step once per item when the number of items is only known at run time?",
      "What is a checkpoint, and what is a thread?",
      "How does interrupt work, and what is the trap?",
      "A run's rewrite-and-retrieve loop ran 40 times on one strange question. How do you stop that?",
      "The server crashes mid-run. What happens, and what can go wrong?",
      "Short-term vs long-term memory in LangGraph?",
      "How do you run a LangGraph agent in production?",
      "Sketch a LangGraph agent: state, nodes, edges.",
      "Conditional edge or Command — when each?",
      "Why must nodes be idempotent in LangGraph?",
      "Thread vs checkpoint vs store?",
      "What is time travel in LangGraph, and when would you use it?",
      "Which durability mode would you choose?",
      "Summarise 500 documents and combine the summaries. Model it in LangGraph.",
      "When would you use a subgraph?",
      "A tool call times out and the agent retries. How do you stop a write applying twice?",
      "Walk through what happens when a node calls interrupt().",
      "The node writes to Redis and then calls interrupt(). What happens on resume?",
      "Why can't you call interrupt() in a loop over a list that may change?",
      "Two parallel branches are both waiting for approval. How do you resume?",
      "Design approvals for an agent that can change inventory parameters. What needs a human?",
      "Why “approve the proposal, not the intent”?",
      "The approver never responds. What happens to the staged write?",
      "The underlying data changed while the human was deciding. Now what?",
      "You deploy a new version of the graph while 200 runs are paused at an interrupt. What breaks?",
      "What is LangChain today, and what changed in version 1?",
      "LangChain vs LangGraph: what's the difference, and when do you use each?",
      "What is LCEL, and is it still worth using?",
      "How does the model know how to call your tool? What makes a good tool?",
      "How do you get reliable structured output in LangChain?",
      "What does create_agent build, and what do you get for free?",
      "Middleware: what hooks exist, and in what order do [m1, m2, m3] run?",
      "A conversation loops through 40 tool calls, leaks an email into traces, and dies when the provider has an outage. Which middleware?",
      "How does memory work in a LangChain agent?",
      "How would you stream an agent's answer and its progress to a web UI?",
      "Would you use LangChain in production?"
    ],
    "asked": {
      "posts": 0,
      "items": 39
    }
  },
  {
    "id": "CH-08",
    "section": "E",
    "sectionLabel": "Part 4 · Evals",
    "priority": "P0",
    "title": "Chapter 6 — Evals: error analysis, LLM judges, RAG and agent evaluation",
    "why": "Evals are the round people fail most often and the strongest signal of real experience. Start from real failures, build a golden set, trust an LLM judge only after measuring it, and compute retrieval and answer metrics by hand.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "describe the error-analysis-to-CI loop, calibrate a judge with TPR/TNR and kappa, and compute recall@k, MRR and nDCG for a small example.",
      "tooDeep": "statistical theory; training reward models."
    },
    "know": [
      "Error analysis: read ~100 traces, note what went wrong in plain words (open coding), group the notes into failure categories (axial coding), count them. Fix the biggest category first.",
      "One evaluator per failure mode: code checks first (format, schema, regex, right tool called, SQL runs), LLM judges only for subjective criteria, humans to calibrate both.",
      "Judge types: single output against criteria (pass/fail), reference-based (compare with a gold answer), pairwise (A vs B).",
      "Biases: position (pairwise order), verbosity (longer wins), self-preference (its own family's outputs), leniency. Mitigate: swap order and require agreement, length-neutral rubrics, a different model family, examples of failures, critique before verdict.",
      "recall@k = relevant items in the top k ÷ all relevant items. precision@k = relevant in the top k ÷ k. hit rate@k = did any relevant item appear.",
      "MRR = the mean, over queries, of 1 / rank of the first relevant result.",
      "Three levels: final outcome (did the task succeed? check the system of record), trajectory (the sequence of tool calls against rules or a reference), single step (given this state, is the next call right?).",
      "Grade outcomes over exact paths — rigid step matching punishes valid alternatives. Use trajectory checks for must / must-not rules (approval before a write; never call delete).",
      "A trace is a tree of spans per request: each LLM call, retrieval and tool call with inputs, outputs, model, tokens, latency, cost and errors (LangSmith, Langfuse, or OpenTelemetry's GenAI conventions).",
      "Online evals: run reference-free checks (judges, code assertions) on a sample of production traces; alert on drops per criterion and slice."
    ],
    "resources": [],
    "minutes": 0,
    "duration": "—",
    "questions": [
      "An LLM feature has no evals today. How do you start?",
      "Why binary pass/fail instead of a 1–5 score?",
      "Capability evals vs regression evals?",
      "Your golden set is 50 synthetic questions. What can't it tell you?",
      "How do evals fit into CI/CD?",
      "Is your LLM judge any good? How do you know?",
      "40 items: you and the judge agree on 34, and each of you labels half as pass. Compute Cohen's kappa.",
      "Name the biases of LLM judges and how you control each.",
      "Your production grounding check uses the same model family as the generator. What's the risk?",
      "Write a judge prompt for “is the answer grounded in the context?”.",
      "Three relevant chunks sit at ranks 2, 7 and 11. Compute recall@5, recall@10, MRR and nDCG@10 (binary relevance).",
      "Define faithfulness, answer relevance, context precision and context recall. Which need a reference answer?",
      "Faithfulness is 0.95 but users say the answers are wrong. What's going on?",
      "You report recall@10 on 51 questions. How much do you trust a 0.02 difference?",
      "How would you evaluate a tool-using LangGraph agent before launch?",
      "pass@k or pass^k for a support agent? Compute pass^3 at 80% per-trial success.",
      "Trajectory evaluation — exact match or not?",
      "How do you test a multi-turn conversational agent?",
      "The provider silently updated the model. How do you find out before your users do?",
      "What do you log for each LLM request?",
      "A stakeholder wants to launch, but the eval evidence is weak. What do you say?",
      "Which online signals tell you the assistant is getting worse?"
    ],
    "asked": {
      "posts": 0,
      "items": 22
    }
  },
  {
    "id": "CH-11",
    "section": "D",
    "sectionLabel": "Part 5 · Production",
    "priority": "P0",
    "title": "Chapter 7 — Security, cost, latency and serving",
    "why": "Every design question ends with “how do you stop it being abused?” and “what does it cost?”. Prompt injection and the lethal trifecta, safe text-to-SQL, and the levers on latency and the monthly bill are where answers become senior.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "explain indirect injection and the trifecta, layer text-to-SQL safety, estimate a monthly bill, and order the cost and latency levers.",
      "tooDeep": "jailbreak research; inference-kernel tuning."
    },
    "know": [
      "Direct injection: the user tries to override the instructions. Indirect: instructions hidden in documents, web pages, emails or tool output the model reads.",
      "A prompt instruction is not an access control. Authorise in code at retrieval time (ACL filters) and at action time (tool permissions, approvals).",
      "Latency = time to first token (grows with input length: prefill) + output tokens × time per token (decode). Output tokens cost more and take longer than input tokens.",
      "Prompt caching: the provider reuses an exact cached prefix — static content first; cached input is much cheaper and faster.",
      "Prefill processes the prompt (decides time to first token); decode generates token by token (limited by memory speed).",
      "Continuous batching adds and removes requests every step, keeping GPUs busy; bigger batches trade latency for throughput."
    ],
    "resources": [],
    "minutes": 0,
    "duration": "—",
    "questions": [
      "How do you stop a text-to-SQL agent from running DROP TABLE?",
      "What is indirect prompt injection, and how do you defend a RAG agent against it?",
      "Explain the lethal trifecta.",
      "A user may only see documents they're permitted to. Where is that enforced?",
      "Quality improved but p95 latency doubled and cost tripled. What do you do, in order?",
      "How would you add semantic caching, and what can go wrong?",
      "What drives time to first token, and what drives total latency?",
      "Define cost per resolved task, and say why it beats cost per request.",
      "Why is continuous batching faster than static batching?",
      "What problem does PagedAttention solve?",
      "Time to first token jumped from 400 ms to 4 seconds at peak. What do you check?",
      "What does quantisation trade off?",
      "Rough cost estimate: 1M queries a day, 3K input and 300 output tokens each.",
      "Which failure modes would you design for in any LLM system?",
      "Set a latency budget for the whole path.",
      "What's your fallback when the vector store or the model provider is down?",
      "Which tools get which permissions, and where is that enforced?",
      "What do you trace so a bad run can be debugged after the fact?"
    ],
    "asked": {
      "posts": 0,
      "items": 18
    }
  },
  {
    "id": "DP-00",
    "section": "P",
    "sectionLabel": "Part 6 · System design",
    "priority": "P0",
    "title": "Start here — The AI system design delivery framework",
    "why": "Every AI design question shares one skeleton and one delivery order. Interviewers score structure as much as content: requirements and success metrics first, numbers that change the design, the simplest design that works, deep dives on the hardest parts, and never skipping evals and cost.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "draw the reference architecture from memory, run the seven steps with their time boxes, state AI-specific requirements and success metrics, do token and cost estimation, and handle a vague or half-built prompt by restating, assuming and checking in.",
      "tooDeep": "provider-specific pricing tables; GPU kernel details."
    },
    "know": [
      "The reference architecture: API/edge, orchestrator (workflow or agent), context layer (retrieval, memory, tools), model gateway, guardrails, ingestion pipeline, traces and evals.",
      "Seven steps: requirements (~5 min), success metrics (~3), entities/API/numbers (~5), high-level design (~10), deep dives (15-20), evals and safety (~5), cost/scale/trade-offs (~3).",
      "AI-specific requirement questions: quality bar, actions, latency, freshness, data sensitivity and tenancy, budget per request.",
      "Estimation in tokens: tokens per request x requests = tokens per day; cost = input x input price + output x output price; concurrency = QPS x stream duration.",
      "Start with the simplest design (workflow before agent, RAG before fine-tuning, hosted before self-hosted) and add complexity only when a requirement forces it."
    ],
    "resources": [],
    "minutes": 0,
    "duration": "—",
    "questions": [
      "You get a vague prompt, or a half-built system to extend. What do you do in the first five minutes?",
      "How do you estimate the cost of an LLM feature in an interview?",
      "When do you choose an agent over a workflow?",
      "How do you structure an LLM system design answer?",
      "What are the components of a production LLM platform?"
    ],
    "asked": {
      "posts": 0,
      "items": 5
    }
  },
  {
    "id": "DP-01",
    "section": "P",
    "sectionLabel": "Part 6 · System design",
    "priority": "P0",
    "title": "Design 1 — Enterprise document Q&A (multi-tenant RAG with permissions)",
    "why": "The most common AI design prompt. It tests whether you can turn RAG into a product: ingestion at scale, tenant isolation, permissions enforced at retrieval time, freshness, citations, latency and evals.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "draw ingestion and query paths, enforce per-user permissions inside retrieval, keep the index fresh, and explain hybrid search, reranking, citations and evals with numbers.",
      "tooDeep": "embedding model training; vector index internals beyond HNSW basics."
    },
    "know": [
      "Two paths: an async ingestion pipeline (connectors -> parse -> chunk -> embed -> index, with ACLs copied onto every chunk) and a sync query path (auth -> rewrite -> hybrid retrieve with ACL filter -> rerank -> generate with citations -> stream).",
      "Permissions are enforced as a filter inside the retrieval query (pre-filtering on tenant and ACL groups), never by asking the model or filtering after generation.",
      "Freshness comes from change events or incremental syncs per connector, idempotent upserts keyed by document id and version, and deletes that remove every chunk of a document.",
      "Quality: hybrid search (BM25 + vectors) plus a reranker; abstain when evidence is weak; measure recall@k, groundedness and citation accuracy per tenant."
    ],
    "resources": [],
    "minutes": 0,
    "duration": "—",
    "questions": [
      "Where do you enforce document permissions in a RAG system, and why there?",
      "How do you keep the index fresh when source documents change or are deleted?",
      "Answers are fluent but sometimes cite the wrong document. How do you debug it?",
      "Design document Q&A for 500 tenants and 10M documents. Walk me from ingestion to answer.",
      "An index per tenant, partitions, or a shared index with a filter — trade-offs?",
      "A document is deleted or a user loses access. How does the index stay correct, and how fast?"
    ],
    "asked": {
      "posts": 0,
      "items": 6
    }
  },
  {
    "id": "DP-02",
    "section": "P",
    "sectionLabel": "Part 6 · System design",
    "priority": "P0",
    "title": "Design 2 — Customer-support agent that takes actions (refunds, approvals)",
    "why": "Tests agent design under real stakes: tools that change money and data, policy enforcement in code, human approval, idempotency, escalation to people and measuring resolution, not just answers.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "design the agent loop with scoped tools, policy checks in code, approval thresholds, idempotent side effects, durable state across an approval, human handoff, and success metrics.",
      "tooDeep": "training the model; contact-center telephony."
    },
    "know": [
      "Split read tools (order lookup, policy search) from write tools (refund, cancel); write tools validate policy and permissions in code and are idempotent with a key per action.",
      "Above a threshold or outside policy, the agent proposes and a person approves; the run pauses durably (checkpointed) and resumes on the decision.",
      "Identity comes from the authenticated session, never from the model; the agent can only act on the signed-in customer's records.",
      "Measure resolution without escalation, wrong-action rate, cost per resolved ticket and pass^k on scripted scenarios, not only answer quality."
    ],
    "resources": [],
    "minutes": 0,
    "duration": "—",
    "questions": [
      "How do you stop the agent refunding the wrong order or the wrong amount?",
      "A refund needs a manager's approval that may take hours. How does the system handle the wait?",
      "How would you measure whether the support agent is good?",
      "How do you verify the agent's claim that it succeeded?"
    ],
    "asked": {
      "posts": 0,
      "items": 4
    }
  },
  {
    "id": "DP-03",
    "section": "P",
    "sectionLabel": "Part 6 · System design",
    "priority": "P0",
    "title": "Design 3 — ChatGPT-style assistant with memory (streaming, context budget, limits)",
    "why": "Tests the chat product end to end at scale: streaming tokens, storing and trimming conversation history, context-window management, long-term memory, rate limits and abuse controls, and cost per user.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "design streaming over SSE, the conversation store, context assembly within a token budget, memory, per-user quotas, moderation, and the cost math.",
      "tooDeep": "model training and RLHF; GPU kernel optimisation."
    },
    "know": [
      "Stream with SSE: the API opens a stream to the model provider and relays tokens; the full message is persisted when the stream ends (or partially on disconnect).",
      "Conversation history lives in a database keyed by conversation id; each turn assembles a context within a token budget: system prompt, summary of old turns, recent turns, retrieved memories.",
      "Abuse and cost controls: token-based rate limits per user and plan (token bucket), max output tokens, input and output moderation, and kill switches per feature.",
      "Cost is dominated by input tokens of long conversations: summarisation, prompt caching of the stable prefix and routing simple turns to a cheaper model."
    ],
    "resources": [],
    "minutes": 0,
    "duration": "—",
    "questions": [
      "How do you stream responses, and what happens if the user disconnects mid-answer?",
      "A conversation has 300 turns. What goes into the next model call?",
      "How do you rate-limit an LLM chat product fairly?"
    ],
    "asked": {
      "posts": 0,
      "items": 3
    }
  },
  {
    "id": "DP-04",
    "section": "P",
    "sectionLabel": "Part 6 · System design",
    "priority": "P0",
    "title": "Design 4 — Coding agent (a long-running multi-step agent)",
    "why": "Tests long-running agent design: planning, tool use over a repository, sandboxed execution, context management for large codebases, verification with tests, cost and safety controls.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "design the plan-act-observe loop, repository context (search, not stuffing), sandboxed execution, verification by tests, step and cost budgets, and human review of changes.",
      "tooDeep": "training code models; IDE plugin internals."
    },
    "know": [
      "The agent loop: read the task, gather context (code search, file reads), edit, run tests or the build in a sandbox, read the results, repeat until tests pass or a budget is hit.",
      "Context for big repos comes from tools (grep, symbol search, embeddings over code) and summaries, not from pasting the repository into the prompt.",
      "Execution happens in an isolated, resource-limited sandbox (container or microVM) with no secrets and restricted network.",
      "Verification by tests and the build, a step and token budget per task, and a human reviews the diff before merge; success measured as tasks passing hidden tests, reported as pass^k."
    ],
    "resources": [],
    "minutes": 0,
    "duration": "—",
    "questions": [
      "How does the agent understand a codebase too large for the context window?",
      "How do you run model-generated code safely?",
      "How do you know the coding agent works?"
    ],
    "asked": {
      "posts": 0,
      "items": 3
    }
  },
  {
    "id": "DP-05",
    "section": "P",
    "sectionLabel": "Part 6 · System design",
    "priority": "P0",
    "title": "Design 5 — LLM gateway (routing, fallbacks, limits, caching)",
    "why": "Tests platform thinking: one internal service in front of every model provider that enforces limits and budgets, routes and falls back, caches, redacts and records every call, so product teams do not each reinvent it.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "design the gateway's request path, provider abstraction, routing and fallback, token-based quotas per tenant, exact and semantic caching, PII redaction, and cost and trace recording.",
      "tooDeep": "building a model provider; network proxy internals."
    },
    "know": [
      "One API for all models; providers behind adapters; the gateway adds auth, quotas, routing, retries with fallback, caching, redaction and logging on every call.",
      "Quotas are token-based per tenant and per key (token buckets in Redis), with budgets in money per month, separate from the provider's own rate limits.",
      "Routing by policy (cheapest model that meets the task's quality bar), fallback to another provider or region on errors or timeouts, circuit breakers per provider.",
      "Every call emits a record: tenant, model, tokens, cost, latency, cache hit, error; this powers chargeback, dashboards and incident debugging."
    ],
    "resources": [],
    "minutes": 0,
    "duration": "—",
    "questions": [
      "Why put a gateway in front of LLM providers instead of calling them directly?",
      "How do you implement per-tenant token limits?",
      "What is semantic caching, and when is it dangerous?"
    ],
    "asked": {
      "posts": 0,
      "items": 3
    }
  },
  {
    "id": "DP-06",
    "section": "P",
    "sectionLabel": "Part 6 · System design",
    "priority": "P0",
    "title": "Design 6 — Batch LLM pipeline (millions of documents)",
    "why": "Tests backend fundamentals applied to LLM work: queues, workers, rate limits, retries, idempotency, checkpointing, cost control and quality sampling for a job that runs for hours or days.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "design job submission, chunked work items on a queue, workers with provider rate limiting, retries and dead-letter handling, idempotent writes, progress and resume, batch APIs for cost, and quality checks on samples.",
      "tooDeep": "distributed data processing frameworks in depth; model fine-tuning."
    },
    "know": [
      "A job is split into work items (one per document or batch) stored with a status; workers pull from a queue, call the model, validate the output against a schema and write results idempotently keyed by (job, item, version).",
      "Throughput is bounded by provider limits (requests and tokens per minute), so a shared rate limiter paces all workers; 429s back off with jitter.",
      "Failures retry with backoff a limited number of times, then go to a dead-letter queue for inspection; the job can resume from item status without redoing finished work.",
      "Cost: provider batch APIs (about half price, asynchronous), smaller models for easy items, caching identical inputs, and an up-front cost estimate; quality: validation plus judge sampling per slice."
    ],
    "resources": [],
    "minutes": 0,
    "duration": "—",
    "questions": [
      "How do you make a million-document LLM job resumable and safe to retry?",
      "The provider allows 2M tokens per minute. How do you design the throughput?",
      "How do you know the extractions are correct across a million documents?"
    ],
    "asked": {
      "posts": 0,
      "items": 3
    }
  },
  {
    "id": "DP-07",
    "section": "P",
    "sectionLabel": "Part 6 · System design",
    "priority": "P0",
    "title": "Design 7 — Text-to-SQL for data analysts",
    "why": "Tests a high-stakes generation problem: grounding the model in a large schema, generating correct SQL, executing it safely with permissions, verifying results and evaluating by execution, not by string match.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "design schema retrieval, SQL generation with examples, validation and safe execution (read-only, row and cost limits, permissions), self-correction on errors, result explanation, and execution-based evals.",
      "tooDeep": "query optimiser internals; training text-to-SQL models."
    },
    "know": [
      "The model cannot see a 2,000-table schema, so retrieve the relevant tables, columns, descriptions, join paths and example queries (a semantic layer) for each question.",
      "Generated SQL is parsed and checked before running: read-only, allowed tables only, row-level security applied, LIMIT and timeouts, cost estimate via EXPLAIN.",
      "Errors from the database are fed back for a bounded number of self-corrections; ambiguous questions get a clarifying question instead of a guess.",
      "Evaluate by execution accuracy: run generated and reference SQL on a test database and compare result sets; also track ambiguity handling and analyst acceptance."
    ],
    "resources": [],
    "minutes": 0,
    "duration": "—",
    "questions": [
      "How do you stop text-to-SQL from running something dangerous or leaking data?",
      "How does the model know which tables to use in a huge warehouse?",
      "How do you evaluate a text-to-SQL system?"
    ],
    "asked": {
      "posts": 0,
      "items": 3
    }
  },
  {
    "id": "DP-08",
    "section": "P",
    "sectionLabel": "Part 6 · System design",
    "priority": "P0",
    "title": "Design 8 — Document processing pipeline (OCR, extraction, validation, human review)",
    "why": "Tests an end-to-end AI workflow for regulated businesses: uploading scanned documents, OCR, classification, structured extraction with confidence, validation against rules and external sources, human review queues and an auditable final report.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "design upload and storage, an orchestrated multi-step workflow, OCR and layout handling, schema-driven extraction with evidence, validation, confidence-based routing to human review, delivery of results by webhook, and evals per field.",
      "tooDeep": "OCR model internals; training document models."
    },
    "know": [
      "A durable workflow per case: upload -> OCR and layout -> classify document type -> extract fields to a schema with source evidence -> validate -> route to review if needed -> assemble report -> deliver.",
      "Each extracted field carries its value, the page and region it came from, and a confidence signal; low confidence or failed validation goes to a human review queue.",
      "Every step is idempotent and retried independently; the workflow state is persisted so long waits (human review, external checks) survive restarts.",
      "Quality is measured per field and document type against labelled documents, with straight-through-processing rate and reviewer correction rate as business metrics."
    ],
    "resources": [],
    "minutes": 0,
    "duration": "—",
    "questions": [
      "How do you decide which extracted fields a human must review?",
      "Why a workflow engine for document processing instead of a chain of queue consumers?",
      "How do you deliver results reliably to the customer's system?"
    ],
    "asked": {
      "posts": 0,
      "items": 3
    }
  }
];

export const AI_STACK_PRIORITIES = ["P0","P1","P2","P3"];

export const AI_STACK_PRIORITY_CONFIG = {
  P0: { label: "P0", blurb: "Asked in nearly every AI loop", cls: "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30" },
  P1: { label: "P1", blurb: "Asked often — do before any real interview", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  P2: { label: "P2", blurb: "Design rounds and depth — after P0 and P1", cls: "bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30" },
  P3: { label: "P3", blurb: "Differentiators. Skip under time pressure", cls: "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30" },
};

export const AI_STACK_TOTAL = 16;

export const AI_STACK_PRIORITY_COUNTS = {"P0":16,"P1":0,"P2":0,"P3":0};

export const AI_STACK_SECTION_COUNTS = {"B":1,"R":2,"A":2,"E":1,"D":1,"P":9};

export const AI_STACK_MINUTES = 0;
