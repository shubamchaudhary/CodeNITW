// Interview Prep plan — consolidated topic cards (AI / HLD / LLD / Spring Boot).
// Refined for SDE-2 switch: 70% Java SDE-2, 20% backend+AI hybrid, 10% pure GenAI funnel.
// Changes from previous version:
//   - HLD rebalanced from AI-heavy → canonical SDE-2 (chat, geo, payments, content)
//   - Added Microservices patterns + Distributed Systems/Kafka in Spring Boot
//   - Added AI production-grade gaps (idempotency, Store API, streaming, async, determinism)
//   - Dropped: lld-games (low ROI), hld-ai-platform (consolidated into hld-ai-systems)
//   - Trimmed: ai-rag-advanced (no Multimodal), ai-finetuning (decision framework only)

export const jobHuntPlan = [
  {
    "id": "ai-rag-retrieval",
    "categories": [
      "AI"
    ],
    "primaryCategory": "AI",
    "priority": "P0",
    "title": "RAG: Chunking, Embeddings, Retrieval & Reranking",
    "keyTopics": [
      "Text extraction from PDFs, DOCX, HTML — what breaks and why (tables, images, headers/footers)",
      "Fixed-size chunking: by character count",
      "Recursive character text splitting: LangChain's default — split by \\n\\n, then \\n, then space",
      "Semantic chunking: split when embedding similarity drops between sentences",
      "Document-structure-aware chunking: use headings and sections as boundaries",
      "Chunk size tradeoffs: too small (loses context) vs too large (dilutes relevance)",
      "Typical chunk sizes: 500–1000 tokens and why",
      "Chunk overlap: why it exists, typical 10–20%, when to increase",
      "Metadata attachment: source filename, page number, section header, chunk index",
      "Parent-child chunking: small chunks for retrieval, return parent chunk for context",
      "Embeddings intuition: text → fixed-size numeric vector, similar meanings close together",
      "Encoder-only transformers at high level",
      "Key models: OpenAI text-embedding-3-small/large, Google Gemini, Cohere embed-v3, BGE, E5",
      "Dimensionality: 384 vs 768 vs 1536 — storage vs quality tradeoff",
      "Embedding model selection: language support, max input length, MTEB benchmarks, cost",
      "Vector stores: pgvector, Pinecone, Weaviate, Chroma, FAISS — when to use each",
      "HNSW indexing: navigable small world graph, parameters (m, ef_construction, ef_search)",
      "IVFFlat indexing: inverted file index, parameters (nlist, nprobe)",
      "Distance metrics: cosine similarity vs dot product vs L2",
      "Defending pgvector + HNSW choice and what to use at 10M+ docs",
      "Basic similarity search: top-k nearest neighbors, choosing k",
      "MMR (Maximal Marginal Relevance): balances relevance with diversity, lambda parameter",
      "Hybrid search: BM25 (keyword/sparse) + semantic search",
      "Reciprocal Rank Fusion (RRF): formula and k=60 standard",
      "When hybrid beats pure semantic: exact names, codes, numbers",
      "Query rewriting: fix typos, expand abbreviations",
      "HyDE (Hypothetical Document Embedding): generate hypothetical answer, embed that",
      "Multi-query: generate 3-5 variations, retrieve for each, merge",
      "Step-back prompting: ask a more general question first",
      "Metadata filtering and self-query retrieval",
      "Why initial retrieval isn't enough: bi-encoders encode separately, miss fine-grained interaction",
      "Cross-encoders: encode query+document TOGETHER for much more accurate scoring",
      "Two-stage retrieve-then-rerank: bi-encoder top-50 → cross-encoder top-5",
      "Cohere Rerank API, BGE reranker, ColBERT, FlashRank",
      "Reciprocal Rank Fusion (RRF): formula score = sum(1/(k+rank_i)), k=60 standard",
      "Lost-in-the-middle problem: LLMs attend most to start and end of context",
      "Solution: rerank so most relevant chunks are first",
      "How to add reranking to DeepDocAI"
    ],
    "prompt": "════════════════════ Document Loading & Chunking Strategies ════════════════════\n\nTeach me RAG chunking strategies in depth.\nCover:\n- Text extraction from PDFs, DOCX, HTML — what breaks and why (tables, images, headers/footers)\n- Chunking strategies with code examples:\n  1. Fixed-size chunking (by character count)\n  2. Recursive character text splitting (LangChain's default — split by \\n\\n, then \\n, then space)\n  3. Semantic chunking (split when embedding similarity drops between sentences)\n  4. Document-structure-aware chunking (use headings, sections as boundaries)\n- Chunk size tradeoffs: too small (loses context) vs too large (dilutes relevance)\n- Typical chunk sizes: 500-1000 tokens for most use cases, why\n- Chunk overlap: why it exists, typical values (10-20%), when to increase\n- Metadata attachment: source filename, page number, section header, chunk index\n- Parent-child chunking: small chunks for retrieval, return parent chunk for context\n\nFor each strategy, give me:\n- When to use it\n- Pros and cons\n- Python code example\n- Common interview follow-up questions\n\nI built a RAG system (DeepDocAI) using recursive splitting. Help me articulate why I chose it and what I'd change if I rebuilt it.\n\n\n════════════════════ Embedding Models & Vector Stores ════════════════════\n\nTeach me about embeddings and vector stores for RAG systems.\n\nPart 1 — Embeddings:\n- What are embeddings — intuition (not math): text → fixed-size numeric vector where similar meanings are close together\n- How embedding models work at high level (encoder-only transformers)\n- Key models and when to use each:\n  - OpenAI text-embedding-3-small/large\n  - Google Gemini embedding\n  - Cohere embed-v3\n  - Open source: sentence-transformers, BGE, E5\n- Dimensionality: 384 vs 768 vs 1536 — storage vs quality tradeoff\n- Embedding model selection criteria: language support, max input length, benchmark scores (MTEB), cost, latency\n\nPart 2 — Vector Stores:\n- Architecture comparison with tradeoffs:\n  - pgvector (PostgreSQL extension) — when and why to use\n  - Pinecone (managed cloud) — when and why\n  - Weaviate (open source, hybrid search built-in)\n  - Chroma (lightweight, good for prototyping)\n  - FAISS (Facebook, in-memory, no persistence)\n- Indexing algorithms:\n  - HNSW: how it works (navigable small world graph), parameters (m, ef_construction, ef_search)\n  - IVFFlat: how it works (inverted file index), parameters (nlist, nprobe)\n  - When to use HNSW vs IVFFlat\n- Distance metrics: cosine similarity vs dot product vs L2 — when each applies\n\nI used pgvector with HNSW in my project. Help me defend this choice in an interview and explain what I'd use differently at 10M+ documents.\n\n\n════════════════════ Retrieval Strategies & Query Processing ════════════════════\n\nTeach me retrieval strategies for RAG in depth.\n\nCover:\n1. Basic similarity search — top-k nearest neighbors, choosing k\n2. MMR (Maximal Marginal Relevance):\n   - What it does: balances relevance with diversity\n   - The lambda parameter: 0 = max diversity, 1 = max relevance\n   - When to use: multi-faceted queries, avoiding redundant chunks\n3. Hybrid search:\n   - BM25 (keyword/sparse) — how it works, when it beats semantic\n   - Combining BM25 + semantic search\n   - Reciprocal Rank Fusion (RRF) for combining ranked lists\n   - When hybrid beats pure semantic: exact names, codes, numbers\n4. Query transformation:\n   - Query rewriting: fix typos, expand abbreviations\n   - HyDE (Hypothetical Document Embedding): generate hypothetical answer, embed that instead of query — why this works\n   - Multi-query: generate 3-5 variations of user query, retrieve for each, merge\n   - Step-back prompting: ask a more general question first\n5. Metadata filtering: filter by date/source/category BEFORE vector search\n6. Self-query retrieval: LLM extracts filters from natural language query\n\nFor each strategy: when to use, code example, tradeoffs, interview questions.\n\nMy DeepDocAI uses basic similarity search with top-5. Help me explain what I'd add to improve it (reranking, hybrid search) and why I didn't need it initially.\n\n\n════════════════════ Reranking & Cross-Encoder Models ════════════════════\n\nTeach me reranking in RAG systems in depth.\n\nCover:\n1. Why initial retrieval isn't enough:\n   - Bi-encoders: encode query and document separately, compare embeddings\n   - Fast but miss fine-grained query-document interaction\n   - Top-50 retrieval captures relevant docs but ranks them poorly\n2. Cross-encoders for reranking:\n   - Encode query+document TOGETHER as one input\n   - Much more accurate relevance scoring\n   - Much slower (can't pre-compute, must run per query-doc pair)\n   - Used on top-50 to select top-5\n3. The retrieve-then-rerank pattern:\n   - Step 1: Bi-encoder retrieves top-50 (fast, approximate)\n   - Step 2: Cross-encoder reranks to top-5 (slow, accurate)\n   - Why this two-stage approach is optimal\n4. Reranking models:\n   - Cohere Rerank API — how to use, pricing\n   - BGE reranker (open source)\n   - ColBERT — late interaction model, middle ground between bi/cross encoder\n   - FlashRank — lightweight reranking\n5. Reciprocal Rank Fusion (RRF):\n   - Formula: score = sum(1/(k + rank_i)) across retrievers\n   - Why k=60 is standard\n   - Combining keyword + semantic + metadata search results\n6. Lost-in-the-middle problem:\n   - LLMs pay most attention to start and end of context\n   - Solution: rerank so most relevant chunks are first\n\nGive me Python code examples for each approach. How would I add reranking to my DeepDocAI system?",
    "tags": [
      "RAG",
      "LangChain",
      "Chunking",
      "Document Processing",
      "Embeddings",
      "Vector Stores",
      "pgvector",
      "HNSW",
      "Hybrid Search",
      "BM25",
      "HyDE",
      "Query Processing"
    ]
  },
  {
    "id": "ai-rag-generation",
    "categories": [
      "AI"
    ],
    "primaryCategory": "AI",
    "priority": "P0",
    "title": "RAG: Prompting, Failure Modes, Context & Caching",
    "keyTopics": [
      "System prompts vs user prompts: what goes where, why separation matters for caching",
      "RAG-specific prompt construction: format retrieved chunks, constrain to context-only",
      "Source attribution: cite the chunk number you used",
      "Output format control: JSON mode, structured outputs with schema enforcement",
      "Pydantic models for validation in LangChain",
      "Few-shot examples: when they help vs when they waste tokens",
      "Dynamic few-shot: select examples similar to current query",
      "Anti-patterns: overly long system prompts, contradictory instructions, vague instructions",
      "Prompt versioning and A/B testing",
      "Temperature and top_p: what they control, when to adjust",
      "Retrieval failures: wrong chunks, relevant chunks ranked too low, chunk boundary problem",
      "Generation failures: hallucination despite correct context, ignoring relevant context",
      "Wrong source attribution and how to fix with clearer chunk labeling",
      "Latency spikes: instrument each stage, find bottleneck, use caching + async",
      "Cost explosion: monitor token usage, limit chunk count, use cheaper model for simple queries",
      "Stale data: documents updated but embeddings not refreshed",
      "Duplicate content flooding retrieval results",
      "Contradictory sources: two documents say different things",
      "Building production monitoring to catch failures",
      "Problem: RAG with many chunks exceeds window; agent conversations grow over time",
      "Summarization: summarize older turns, retrieved docs; recursive summarization",
      "Map-Reduce: split long doc, generate answer from each chunk, combine",
      "Refine: process chunks sequentially, each step refines answer",
      "Sliding Window: keep most recent N tokens, older dropped or summarized",
      "Hierarchical Retrieval: L1 summaries → L2 sections → L3 chunks",
      "Token counting: tiktoken, different models tokenize differently, buffer management",
      "Practical: token budgeting in RAG, conversation summarization in agents",
      "Why cache LLM calls: slow (1-30s), expensive, same queries don't need re-computation",
      "Exact caching: hash of (model, prompt, params) → Redis/in-memory, TTL strategy",
      "Semantic caching: embed query, find similar past queries, similarity threshold 0.95+",
      "Cache invalidation: time-based TTL, event-based on data update, manual, LRU/LFU eviction",
      "Cache warm-up: pre-populate with common queries during off-peak hours",
      "Cache-aside vs write-through vs write-behind patterns",
      "When it works: deterministic prompts (temperature=0), paraphrased queries",
      "For DeepDocAI: when and how to add semantic caching"
    ],
    "prompt": "════════════════════ Prompt Engineering for RAG & LLM Applications ════════════════════\n\nTeach me structured prompt engineering — not \"write a good prompt\" but engineering techniques for production AI systems.\n\nCover:\n1. System prompts vs user prompts:\n   - What goes in system prompt (role, rules, output format, constraints)\n   - What goes in user prompt (query, context, dynamic content)\n   - Why separation matters for caching and cost\n2. RAG-specific prompt construction:\n   - How to format retrieved chunks for the LLM\n   - Instructing \"answer ONLY from provided context\"\n   - Source attribution: \"cite the chunk number you used\"\n   - Handling \"I don't know\" gracefully when context is insufficient\n   - Chain-of-thought: \"first identify relevant information, then formulate answer\"\n3. Output format control:\n   - JSON mode: when and how to use\n   - Structured outputs with schema enforcement\n   - Pydantic models for validation (in LangChain)\n   - Handling malformed outputs: retry with error feedback\n4. Few-shot examples:\n   - When they help (complex formatting, classification tasks)\n   - When they hurt (waste tokens for simple tasks)\n   - Dynamic few-shot: select examples similar to current query\n5. Prompt debugging:\n   - Common failure modes: instruction following breakdown, format drift\n   - Prompt versioning and A/B testing\n   - Temperature and top_p: what they control, when to adjust\n6. Anti-patterns:\n   - Overly long system prompts that get ignored\n   - Contradictory instructions\n   - Vague instructions (\"be helpful\" vs \"respond in 2-3 sentences with specific numbers\")\n\nGive me real examples of good vs bad prompts for each technique.\n\n\n════════════════════ RAG Failure Modes & Debugging ════════════════════\n\nTeach me how RAG systems fail and how to debug them.\n\nCover every failure mode:\n1. Retrieval failures:\n   - Wrong chunks retrieved: embedding doesn't capture the query intent\n   - Debug: check what chunks are actually retrieved\n   - Fix: query transformation, hybrid search, better chunking\n   - Relevant chunks exist but ranked too low\n   - Fix: reranking, tune similarity threshold\n   - Chunk boundary problem: answer spans two chunks, neither complete\n   - Fix: increase overlap, use parent-child chunking\n\n2. Generation failures:\n   - Hallucination despite having correct context\n   - Fix: stronger system prompt, chain-of-thought, lower temperature\n   - Ignoring relevant context (uses parametric knowledge instead)\n   - Fix: reorder chunks, emphasize context in prompt\n   - Wrong source attribution — clearer chunk labeling\n\n3. System-level failures:\n   - Latency spikes: instrument each stage, find bottleneck\n   - Fix: caching, async embedding, streaming response\n   - Cost explosion: monitor token usage\n   - Fix: limit chunk count, summarize long chunks, use cheaper model\n\n4. Data quality failures:\n   - Stale data: documents updated but embeddings not refreshed\n   - Duplicate content: same info chunked multiple times, floods retrieval\n   - Contradictory sources: two documents say different things\n\nFor each: real example, how to identify, how to fix. How would I build monitoring to catch these failures in production?\n\n\n════════════════════ Context Window Management ════════════════════\n\nTeach me how to handle context window limits in production.\nTHE PROBLEM:\n- Every LLM has a context window limit (4K to 200K+ tokens)\n- RAG with many chunks exceeds the window\n- Agent conversations grow over time\n- Stuffing everything = expensive and degrades quality\nSTRATEGIES:\n1. Summarization: summarize older conversation turns; summarize retrieved documents; recursive summarization; tradeoff: loses detail, adds latency\n2. Map-Reduce: split long document into chunks, generate answer from each (map), combine into final answer (reduce). Good for: summarization, extraction across long docs\n3. Refine: process chunks sequentially, each step refines answer with new chunk. Better quality than map-reduce but slower\n4. Sliding Window: keep most recent N tokens, older messages dropped or summarized. Simple but loses early context\n5. Hierarchical Retrieval: L1 document summaries → L2 relevant sections → L3 specific chunks. Reduces tokens while maintaining relevance\nTOKEN COUNTING:\n- tiktoken for OpenAI models\n- Different models tokenize differently\n- Estimating count before API call\n- Buffer management: reserve tokens for output\nPRACTICAL:\n- Token budgeting in RAG pipeline\n- Conversation summarization in agent\n- \"Too many chunks retrieved\" problem\n\n\n════════════════════ Caching Strategies for LLM Apps ════════════════════\n\nTeach me caching for LLM applications deeply.\nWHY CACHE:\n- LLM calls are slow (1-30 seconds) and expensive\n- Same/similar queries don't need re-computation\n- Reduces cost, improves latency\nEXACT CACHING:\n- Cache key: hash of (model, prompt, parameters)\n- Cache store: Redis, in-memory, database\n- TTL strategy: long for stable data, short for changing data\n- Cache invalidation: when source data updates\n- When it works: deterministic prompts, temperature=0\nSEMANTIC CACHING:\n- Cache key: embedding of query\n- Lookup: find similar past query, return its response if similar enough\n- Similarity threshold: 0.95+? Tune based on use case\n- Implementation: vector store of (query_embedding, response)\n- Tradeoffs: cache hit rate vs correctness\n- When it works: paraphrased queries with same intent\nCACHE INVALIDATION:\n- Time-based (TTL)\n- Event-based (data update triggers invalidation)\n- Manual (admin endpoint)\n- LRU/LFU eviction within cache\nCACHE WARM-UP:\n- Pre-populate cache with common queries\n- Run during off-peak hours\nPRACTICAL PATTERNS:\n- Cache-aside (most common): app checks cache first\n- Write-through: cache updated on every write\n- Write-behind: cache updated async\nFor my DeepDocAI: when would I add semantic caching?",
    "tags": [
      "Prompt Engineering",
      "RAG",
      "LangChain",
      "JSON Mode",
      "Few-shot",
      "Debugging",
      "Failure Modes",
      "Production",
      "Monitoring",
      "Context Window",
      "Summarization",
      "Map-Reduce"
    ]
  },
  {
    "id": "ai-rag-advanced",
    "categories": [
      "AI"
    ],
    "primaryCategory": "AI",
    "priority": "P1",
    "title": "Advanced RAG: Agentic RAG & GraphRAG",
    "keyTopics": [
      "Standard RAG vs Agentic RAG: one-shot retrieve/generate vs agent that decides when/what to retrieve",
      "Retrieval as a tool: agent decides when to search, multiple searches with different queries",
      "Query routing: agent classifies query → routes to appropriate knowledge base",
      "Adaptive retrieval: retrieve, evaluate quality, re-retrieve if insufficient (self-reflection)",
      "Multi-hop retrieval: first retrieval reveals what to search next",
      "Multi-source retrieval: vector store + SQL + API — my RCA agent does this",
      "Corrective RAG (CRAG): evaluate relevance after retrieval, web search if not relevant",
      "LangGraph implementation: retrieval node, evaluation node, re-retrieval node with conditional routing",
      "Why vector RAG fails: multi-hop questions, global/summarization questions, entity-relationship queries",
      "Knowledge graph basics: entities (nodes), relationships (edges), properties — vs vector index",
      "Graph construction with an LLM: entity + relation extraction, deduplication, schema/ontology design",
      "Microsoft GraphRAG: community detection (Leiden), hierarchical community summaries, global vs local search",
      "Hybrid retrieval: vector search to find entry nodes, then graph traversal to expand context",
      "Storage options: Neo4j, property graphs in PostgreSQL (Apache AGE), in-memory graphs",
      "Cost/latency tradeoff: graph build is expensive and slow — when it's worth it vs plain RAG",
      "When NOT to use GraphRAG: small corpora, simple lookup Q&A, tight latency budgets"
    ],
    "prompt": "════════════════════ Agentic RAG ════════════════════\n\nTeach me agentic RAG — using agents for intelligent retrieval.\nWHAT IS AGENTIC RAG:\n- Standard RAG: query → retrieve → generate (one-shot, no reasoning)\n- Agentic RAG: agent decides when/what to retrieve and whether sufficient\nPATTERNS:\n1. Retrieval as a tool:\n   - Agent has \"search\" tool — decides when to use\n   - Multiple searches with different queries\n   - Decide it has enough info, stop searching\n2. Query routing:\n   - Agent classifies query → routes to appropriate KB\n   - Different retrievers for different question types\n3. Adaptive retrieval:\n   - Retrieve, evaluate quality, re-retrieve if insufficient\n   - Self-reflection: \"these chunks don't answer, try different query\"\n   - Multi-hop: first retrieval reveals what to search next\n4. Multi-source retrieval:\n   - Vector store + SQL database + API\n   - Synthesize from heterogeneous sources\n   - My RCA agent does this: SQL + log analysis\n5. Corrective RAG (CRAG):\n   - After retrieval, evaluate relevance\n   - If not relevant → web search or alternative\n   - Triggers knowledge refinement\nIMPLEMENTATION IN LANGRAPH:\n- Retrieval node, evaluation node, re-retrieval node\n- Conditional routing: sufficient → generate, insufficient → re-retrieve\n- Max retrieval attempts to prevent loops\nThis applies to RCA agent — walk me through the design.\n\n\n════════════════════ GraphRAG & Knowledge-Graph Retrieval ════════════════════\n\nYou are a senior GenAI engineer mentoring me for SDE2 GenAI interviews. Context: I built DeepDocAI (vector RAG with pgvector/HNSW) and I'm building an RCA agent that does multi-source retrieval. Teach me GraphRAG & knowledge-graph retrieval thoroughly.\n\nCover, with depth:\n1. THE PROBLEM: concretely show 3 query types where pure vector RAG fails (multi-hop reasoning, global/\"summarize the whole corpus\" questions, entity-relationship questions). Give a worked failing example for each.\n2. KNOWLEDGE GRAPH FUNDAMENTALS: nodes/edges/properties, ontology vs schema-free, how this differs from a vector index — with a small diagram described in text.\n3. GRAPH CONSTRUCTION PIPELINE: LLM-based entity + relationship extraction, deduplication/entity resolution, chunk→triple flow. Give a concrete Python sketch using an LLM to extract (entity, relation, entity) triples.\n4. MICROSOFT GraphRAG: explain community detection (Leiden), hierarchical community summaries, and the difference between global search and local search. When each is used.\n5. HYBRID RETRIEVAL: vector search to locate entry nodes, then k-hop graph expansion. Show how I'd combine this with my existing pgvector setup.\n6. STORAGE: compare Neo4j vs PostgreSQL+Apache AGE vs in-memory. Pros/cons table.\n7. TRADEOFFS: build cost, indexing latency, freshness/incremental updates, when GraphRAG is NOT worth it.\n8. INTERVIEW PREP: 8 likely follow-up questions with crisp model answers, and one system-design-style prompt: \"design a RAG system for a 10K-document enterprise wiki where users ask cross-document analytical questions.\"\nEnd with: how I would pitch adding a graph layer to DeepDocAI as a v2 — what I'd say in an interview and what I'd actually build first.",
    "tags": [
      "Agentic RAG",
      "CRAG",
      "Multi-hop Retrieval",
      "LangGraph",
      "RAG",
      "GraphRAG",
      "Knowledge Graph",
      "Neo4j",
      "Multi-hop"
    ]
  },
  {
    "id": "ai-agents-core",
    "categories": [
      "AI"
    ],
    "primaryCategory": "AI",
    "priority": "P0",
    "title": "AI Agents: ReAct, Tool Calling & Memory",
    "keyTopics": [
      "Agent vs chain: agent = LLM decides next step, chain = fixed sequence",
      "When to use agent vs chain: agent = flexible, chain = predictable",
      "ReAct (Reason + Act): Thought → Action → Observation → Thought loop",
      "How LLM generates 'thoughts' and maps 'actions' to tool calls",
      "When the agent decides to stop and give final answer",
      "Tool schemas: name, description, parameters for the LLM",
      "Modern approach: function calling / structured output from LLM",
      "ReAct failure modes: loops, hallucinated tools, giving up early",
      "ReAct vs Plan-and-Execute vs simple function calling",
      "Applying to RCA agent: design choices and interview explanations",
      "Tool schemas: JSON schema describing each tool (name, description, parameters)",
      "LLM generates structured tool call: {tool, args}",
      "Tool schema design: good vs bad descriptions make huge quality difference",
      "Parameter descriptions: what makes the LLM fill them correctly",
      "Tool result handling: format results, handle large results, handle errors",
      "Sequential, parallel, and conditional multi-tool orchestration",
      "LLM calling wrong tool due to bad descriptions",
      "Tool call injection attacks: user tricks LLM into calling dangerous tool",
      "Tool call validation before execution",
      "Logging every tool call for debugging and audit",
      "Buffer Memory: store full conversation history, limited by context window",
      "Summary Memory: summarize old messages, information loss vs context window savings",
      "Entity Memory: extract and track entities mentioned in conversation",
      "Window Memory: keep only last N messages, simplest approach",
      "Vector Store Memory: embed past messages, retrieve relevant ones — scales best",
      "LangGraph checkpointing: persisting agent state between invocations",
      "Thread-level state: separate conversations per thread_id",
      "Short-term vs long-term memory: within conversation vs across conversations",
      "Scratchpad pattern: agent's working memory for current task",
      "Best memory type for RCA agent: past investigations recall"
    ],
    "prompt": "════════════════════ What Are Agents — ReAct Pattern Deep Dive ════════════════════\n\nTeach me AI agents from the ground up, with deep focus on the ReAct pattern.\n\nCover:\n1. What is an agent vs a chain:\n   - Chain: fixed sequence of steps, predetermined flow\n   - Agent: LLM decides what to do next based on observations\n   - When to use agent vs chain (agent = flexible, chain = predictable)\n2. ReAct (Reason + Act) pattern in depth:\n   - The loop: Thought → Action → Observation → Thought → ...\n   - How the LLM generates \"thoughts\" (reasoning about what to do)\n   - How \"actions\" map to tool calls\n   - How \"observations\" (tool results) feed back into the next thought\n   - When the agent decides to stop and give final answer\n   - Original ReAct paper intuition (Yao et al.)\n3. Implementing ReAct:\n   - Prompt structure for ReAct (system prompt with tool descriptions)\n   - Tool schema: how tools are described to the LLM (name, description, parameters)\n   - Parsing LLM output to extract tool calls\n   - Modern approach: function calling / tool calling (structured output from LLM)\n4. ReAct failure modes:\n   - Agent gets stuck in a loop (keeps calling same tool)\n   - Agent hallucinates a tool that doesn't exist\n   - Agent gives up too early\n   - Agent makes incorrect reasoning but correct action (or vice versa)\n5. ReAct vs other patterns:\n   - ReAct vs Plan-and-Execute (when each is better)\n   - ReAct vs simple function calling (when you don't need full agent loop)\n\nI'm building an RCA (Root Cause Analysis) agent using ReAct with LangGraph. Help me understand the pattern deeply enough to explain every design choice in an interview.\n\n\n════════════════════ Tool Calling — How LLMs Use Tools ════════════════════\n\nTeach me tool calling for AI agents in depth.\n\nCover:\n1. How tool calling works:\n   - Tool schemas: JSON schema describing each tool (name, description, parameters)\n   - How the LLM \"sees\" tools: injected into system prompt or passed as function definitions\n   - LLM generates structured tool call: {\"tool\": \"search_db\", \"args\": {\"query\": \"...\"}}\n   - Runtime executes the tool, returns result to LLM\n   - LLM decides: call another tool or give final answer\n2. Tool schema design (critical for agent quality):\n   - Good vs bad tool descriptions\n   - Parameter descriptions: what makes the LLM fill them correctly\n   - Required vs optional parameters, enum parameters\n3. Tool result handling:\n   - Formatting tool results for the LLM\n   - Handling large results: truncation, summarization\n   - Error results: how to tell the LLM a tool call failed so it can retry/adapt\n4. Multi-tool orchestration:\n   - Sequential: tool A result feeds into tool B\n   - Parallel: call tools A and B simultaneously (LangGraph supports this)\n   - Conditional: if tool A returns X, call tool B; otherwise call tool C\n5. Common problems:\n   - LLM calls wrong tool (bad descriptions)\n   - LLM passes wrong parameter types\n   - LLM calls tool unnecessarily\n   - Tool call injection attacks: user tricks LLM into calling dangerous tool\n6. Production considerations:\n   - Tool call validation before execution\n   - Guardrails: which tools can be called with what parameters\n   - Logging every tool call for debugging and audit\n   - Timeout handling for slow tools\n\nConnect to my RCA agent: I have tools for SQL query execution (read-only), log search, and metric lookup. Help me design optimal tool schemas.\n\n\n════════════════════ Agent Memory Systems ════════════════════\n\nTeach me memory systems for AI agents.\n\nCover:\n1. Why memory matters:\n   - Without memory: agent forgets everything between conversations\n   - With memory: agent can reference past interactions, build context over time\n2. Types of memory:\n   a) Conversation/Buffer Memory:\n      - Store full conversation history\n      - Problem: context window limit\n      - When to use: short conversations (< 10 turns)\n   b) Summary Memory:\n      - Summarize old messages, keep summary + recent messages\n      - Tradeoff: information loss vs context window savings\n      - When to use: long conversations (10+ turns)\n   c) Entity Memory:\n      - Extract and track entities mentioned in conversation\n      - \"User mentioned they use PostgreSQL 15 on AWS\"\n      - When to use: customer support, personal assistants\n   d) Window Memory:\n      - Keep only last N messages\n      - Simplest approach, works for many use cases\n   e) Vector Store Memory:\n      - Embed past messages, retrieve relevant ones for current query\n      - Scales to very long histories\n      - When to use: agents that need to recall specific past interactions\n3. LangGraph checkpointing:\n   - Persisting agent state between invocations\n   - Thread-level state: separate conversations\n4. Short-term vs long-term memory:\n   - Short-term: within a conversation (buffer/window)\n   - Long-term: across conversations (vector store, database)\n5. Scratchpad pattern: agent's working memory for current task\n\nFor my RCA agent: how should I implement memory so it remembers past investigations? What type of memory is best for RCA?",
    "tags": [
      "Agents",
      "ReAct",
      "LangGraph",
      "RCA Agent",
      "Tool Calling",
      "JSON Schema",
      "Function Calling",
      "Agent Memory",
      "Checkpointing",
      "RAG",
      "Conversation Memory"
    ]
  },
  {
    "id": "ai-agent-architectures",
    "categories": [
      "AI"
    ],
    "primaryCategory": "AI",
    "priority": "P0",
    "title": "Agent Architectures, Frameworks & MCP",
    "keyTopics": [
      "Plan-and-Execute: Step 1 create plan, Step 2 execute, Step 3 replan if needed",
      "When to use: complex multi-step tasks with a clear plan",
      "Comparison with ReAct: planned vs reactive",
      "Supervisor pattern: boss agent routes to specialized worker agents",
      "Swarm pattern: agents hand off to each other, no central coordinator",
      "Hierarchical: multiple levels of supervisors",
      "Parallel fan-out: multiple agents work simultaneously, aggregate results",
      "When to use what: single agent (< 5 tools) vs plan-and-execute vs multi-agent",
      "Don't over-architect: single agent beats multi-agent for most cases",
      "For RCA agent: is single ReAct the right choice?",
      "The framework landscape: LangGraph, CrewAI, AutoGen / AG2, OpenAI Agents SDK, LlamaIndex Workflows",
      "Orchestration models: explicit graph/state machine vs role-based crews vs conversational group chat",
      "Control vs convenience: how much the framework hides, and why production teams pick explicit control",
      "A2A (Agent-to-Agent protocol): agents as services discovering and delegating to each other — vs MCP (tools)",
      "Orchestration topologies: supervisor/orchestrator-worker, hierarchical, sequential, group chat, swarm",
      "State, memory and handoffs across agents; failure isolation and retries in multi-agent systems",
      "Cost/latency blow-up of naive multi-agent; when a single well-prompted agent beats a crew",
      "Defending 'why LangGraph' for my RCA agent against each alternative",
      "What MCP is: an open standard for exposing tools, resources and prompts to any LLM client (the 'USB-C for AI tools')",
      "Why it exists: before MCP every agent re-implemented bespoke tool integrations (N×M problem)",
      "Architecture: MCP host/client ↔ MCP server; transports (stdio, Streamable HTTP); JSON-RPC messages",
      "Primitives: tools (model-invoked actions), resources (readable context), prompts (reusable templates)",
      "Building an MCP server: defining tools, schemas, auth, returning structured results",
      "Connecting MCP to LangGraph/agents: tools discovered at runtime, not hardcoded",
      "Security: tool poisoning, confused-deputy, prompt injection via tool descriptions, scoping & approval",
      "MCP vs plain function-calling vs a tool registry: when the standard actually buys you something"
    ],
    "prompt": "════════════════════ Plan-and-Execute & Multi-Agent Architectures ════════════════════\n\nTeach me advanced agent architectures beyond ReAct.\n\nCover:\n1. Plan-and-Execute pattern:\n   - Step 1: LLM creates a plan (list of steps)\n   - Step 2: Execute each step, potentially with different tools\n   - Step 3: Replan if results don't match expectations\n   - When to use: complex multi-step tasks where you need a clear plan\n   - Comparison with ReAct: planned vs reactive\n2. Multi-agent architectures:\n   a) Supervisor pattern:\n      - One \"boss\" agent routes tasks to specialized agents\n      - Each worker agent has specific tools and expertise\n      - Supervisor aggregates results\n   b) Swarm pattern:\n      - Agents hand off to each other based on context\n      - No central coordinator\n      - More flexible, harder to control\n   c) Hierarchical:\n      - Multiple levels of supervisors\n      - For very complex systems with many specializations\n   d) Parallel fan-out:\n      - Multiple agents work simultaneously on different aspects\n      - Results aggregated at the end\n3. Agent communication:\n   - How agents share state (shared state graph in LangGraph)\n   - Message passing between agents\n   - Handoff patterns: what context to transfer\n4. When to use what:\n   - Single agent (ReAct): simple tasks, < 5 tools\n   - Plan-and-Execute: complex tasks with clear steps\n   - Multi-agent: different expertise areas, complex workflows\n   - Don't over-architect: single agent with good tools beats multi-agent for most cases\n\nFor my RCA agent: is single ReAct the right choice? When would I need to upgrade to multi-agent?\n\n\n════════════════════ Multi-Agent Frameworks Compared — LangGraph vs CrewAI vs AutoGen vs OpenAI Agents SDK vs A2A ════════════════════\n\nYou are a senior GenAI engineer mentoring me for SDE2 GenAI interviews. I built my RCA agent on LangGraph; interviewers increasingly ask \"why this framework, not X?\" Teach me the multi-agent framework landscape so I can answer with authority.\n\nDeliver:\n1. LANDSCAPE TABLE: LangGraph, CrewAI, AutoGen/AG2, OpenAI Agents SDK, LlamaIndex Workflows — for each: orchestration model, abstraction level, state/memory handling, streaming/HITL support, production-readiness, best-fit use case.\n2. ORCHESTRATION MODELS explained: explicit graph/state machine vs role-based crew vs conversational group chat — diagram-in-text for each and the failure modes of each.\n3. TOPOLOGIES: supervisor/orchestrator-worker, hierarchical, sequential pipeline, group chat, swarm/handoff — when each is appropriate, with a concrete example mapped to a real problem.\n4. PROTOCOLS: explain A2A (agent-to-agent) and how it differs from and complements MCP (tools/context). Where each fits in a larger system.\n5. CONTROL vs CONVENIENCE: why many production teams choose explicit graphs; the hidden costs (debuggability, cost explosion, non-determinism) of high-abstraction crews.\n6. COST/LATENCY: show how naive multi-agent multiplies tokens and latency, and the heuristic for \"do I even need multiple agents?\"\n7. DEFEND MY CHOICE: a crisp, interview-ready argument for why LangGraph fits my RCA agent (control over state, checkpointing, HITL, observability) — and an honest case for when I'd reach for CrewAI or OpenAI Agents SDK instead.\n8. INTERVIEW PREP: 8 follow-up Q&A and a design prompt: \"design a multi-agent system for automated incident response\" with the structured answer I'd give.\n\n\n════════════════════ MCP — Model Context Protocol (Tool & Context Exposure) ════════════════════\n\nYou are a senior GenAI engineer mentoring me for SDE2 GenAI interviews. MCP (Model Context Protocol) is now commonly asked at this level and my plan had a gap here. Context: my RCA agent has hardcoded tools (SQL runner, log search) wired into a LangGraph graph. Teach me MCP thoroughly and practically.\n\nDeliver:\n1. MENTAL MODEL: what MCP is and the exact problem it solves (the N×M bespoke-integration problem) — analogy + before/after diagram in text.\n2. ARCHITECTURE: host vs client vs server, the stdio and Streamable HTTP transports, the JSON-RPC message lifecycle (initialize → list tools → call tool). Walk one full request/response.\n3. PRIMITIVES: tools vs resources vs prompts — when to use each, with concrete examples from my RCA agent (e.g. 'run_sql' as a tool, 'incident_runbook' as a resource).\n4. BUILD IT: a minimal Python MCP server exposing a read-only SQL tool with an input schema and structured result; then how a client/agent discovers and calls it.\n5. INTEGRATION: how to plug MCP tools into a LangGraph agent so tools are discovered at runtime instead of hardcoded — show the wiring.\n6. SECURITY: tool poisoning, confused-deputy, prompt injection through tool descriptions, over-broad scopes — and the concrete mitigations (allow-lists, human approval, schema validation, sandboxing). Tie to my existing read-only/guardrailed SQL approach.\n7. WHEN NOT TO: MCP vs plain function-calling vs an internal tool registry — be honest about overhead.\n8. INTERVIEW PREP: 8 follow-up Q&A and a design prompt: \"expose your RCA agent's capabilities to other teams' agents safely.\" Give the structured answer I'd deliver and how I'd talk about retrofitting MCP into my RCA agent as a concrete next step.",
    "tags": [
      "Multi-Agent",
      "Plan-and-Execute",
      "Supervisor Pattern",
      "LangGraph",
      "Swarm",
      "CrewAI",
      "AutoGen",
      "A2A",
      "MCP",
      "Tool Calling",
      "Agents",
      "Protocol"
    ]
  },
  {
    "id": "ai-langgraph",
    "categories": [
      "AI"
    ],
    "primaryCategory": "AI",
    "priority": "P0",
    "title": "LangGraph End-to-End: State, Routing, HITL & Persistence",
    "keyTopics": [
      "StateGraph: TypedDict or Pydantic model state, how state flows through the graph",
      "State reducers: how to merge updates (add vs replace for lists)",
      "Nodes: function that takes state, returns state update",
      "ToolNode: special nodes that execute tool calls",
      "Normal edges vs conditional edges vs START/END",
      "How ReAct maps to LangGraph: LLM node → conditional → tool node → back to LLM",
      "Accumulating messages with add reducer",
      "Tracking iterations and loop detection with counters",
      "graph.compile() and graph.invoke() usage",
      "How RCA agent graph should look architecturally",
      "Checkpointing saves full graph state after each node execution",
      "Enables: pause/resume, time travel, debugging, HITL",
      "MemorySaver (dev) → SqliteSaver → PostgresSaver (production)",
      "Thread management: config with thread_id per user/conversation",
      "Multi-tenant: thread_id per user per conversation",
      "State snapshots: graph.get_state(config) and time travel",
      "graph.get_state_history(config) to list all checkpoints",
      "Why this matters: resume after browser close, revert mistakes, full audit",
      "PostgresSaver with existing PostgreSQL + connection pooling patterns",
      "Checkpoint storage schema: what's stored, how much space",
      "ToolNode: prebuilt node that executes tool calls from LLM response",
      "How ToolNode maps tool call → function → result → state update",
      "Error handling in ToolNode: what happens when tool throws exception",
      "llm.bind_tools(tools): how tools are attached to the LLM",
      "@tool decorator: converting functions to LangChain tools",
      "Conditional routing: should_continue function checks for tool calls",
      "Multi-path routing: route to different nodes based on tool type",
      "Parallel tool execution: LLM requests multiple tools simultaneously",
      "Subgraphs: nesting graphs for modular agent design",
      "Map-reduce: process list of items in parallel, aggregate",
      "HITL: some actions too risky for full automation (SQL on production, sending emails)",
      "interrupt_before: pause BEFORE a node executes, wait for human input",
      "interrupt_after: pause AFTER a node executes, let human review result",
      "How interrupt works with checkpointing (state saved, graph pauses)",
      "Command(resume=value): resume with human-provided value",
      "Command(goto='node_name'): redirect graph to specific node",
      "Command(update={'key': 'value'}): modify state before resuming",
      "Approval flow: agent generates SQL → human reviews → approve/reject/modify",
      "Production: timeout if human doesn't respond, batch approval, audit trail",
      "Full HITL flow for RCA agent SQL approval on production database",
      "Subgraphs: compiled graph as a node inside another graph for modular design",
      "State mapping: inner graph may have different state schema",
      "Parallel execution (fan-out): Send to route to multiple nodes simultaneously",
      "Fan-in (collect): aggregate results from all parallel nodes",
      "Map-reduce: process each list item independently, aggregate all results",
      "Branch and merge: split to different paths, both execute, merge results",
      "Dynamic graph construction: build graph structure based on runtime input",
      "Combining patterns: subgraph with parallel tools and HITL",
      "Debugging nested graphs: tracing through subgraphs",
      "Performance: parallel execution with shared resources",
      "Define state: messages, sql_queries_executed, findings, current_hypothesis, iteration_count",
      "Define tools: SQL query (read-only, with guardrails), log search, metric lookup",
      "Build graph: LLM node → tool node → guardrail → approval → execute → back to LLM",
      "PostgresSaver setup and thread management for different investigations",
      "Max iterations for loop prevention, tool failure handling, LLM failure retry",
      "Graceful timeout: return best partial result",
      "Observability: log every step, track token usage, measure latency per node",
      "Summary node: compile findings into RCA report",
      "How to explain this architecture in a 45-minute interview"
    ],
    "prompt": "════════════════════ LangGraph Fundamentals — StateGraph, Nodes, Edges ════════════════════\n\nTeach me LangGraph core concepts in depth. I'm building agents with it and need to explain architecture decisions in interviews.\n\nCover:\n1. StateGraph:\n   - What is state in LangGraph (TypedDict or Pydantic model)\n   - How state flows through the graph\n   - State reducers: how to merge updates (especially for lists — add vs replace)\n   - Designing state schema for an agent\n2. Nodes:\n   - What a node is: a function that takes state, returns state update\n   - Tool nodes: special nodes that execute tool calls\n   - How nodes differ from chain steps\n3. Edges:\n   - Normal edges: always go from A to B\n   - Conditional edges: function that returns next node name based on state\n   - Entry and finish points (START, END)\n   - How conditional routing enables agent decision-making\n4. The full picture:\n   - How ReAct maps to LangGraph: LLM node → conditional edge (tool call or end?) → tool node → back to LLM node\n   - Drawing the graph: what it looks like visually\n   - Compiling and invoking: graph.compile(), graph.invoke()\n5. State management patterns:\n   - Accumulating messages: messages key with add reducer\n   - Tracking iterations: counter for loop detection\n   - Storing intermediate results: tool outputs in state\n\nGive me complete Python code for a simple ReAct agent in LangGraph, then explain every line. Then show how my RCA agent graph should look.\n\n\n════════════════════ LangGraph Checkpointing & Persistence ════════════════════\n\nTeach me LangGraph checkpointing and persistence in depth.\n\nCover:\n1. What checkpointing does:\n   - Saves full graph state after each node execution\n   - Enables: pause/resume, time travel, debugging, HITL\n   - Without checkpointing: state is lost between invocations\n2. Checkpoint backends:\n   - MemorySaver: in-memory, good for development\n   - SqliteSaver: file-based persistence\n   - PostgresSaver: production-ready, your stack matches this\n   - How to implement custom checkpointer\n3. Thread management:\n   - config={\"configurable\": {\"thread_id\": \"...\"}}\n   - Each thread is a separate conversation/session\n   - How to list threads, delete threads\n   - Multi-tenant: thread_id per user per conversation\n4. State snapshots and time travel:\n   - Get state at any checkpoint: graph.get_state(config)\n   - List all checkpoints: graph.get_state_history(config)\n   - Resume from specific checkpoint\n   - Debugging: trace agent decisions step by step\n5. Why this matters for production:\n   - User closes browser → agent resumes where it left off\n   - Agent makes a mistake → revert to previous state, retry\n   - Debugging: replay agent execution for failed runs\n   - Audit: complete history of agent decisions\n6. Integration with your stack:\n   - PostgresSaver with your existing PostgreSQL\n   - How this connects to your connection pooling patterns\n\nCode examples: set up PostgresSaver, save state, resume agent, time-travel to previous state.\n\n\n════════════════════ LangGraph Tool Nodes & Advanced Routing ════════════════════\n\nTeach me LangGraph tool nodes and advanced graph patterns.\n\nCover:\n1. ToolNode:\n   - Prebuilt node that executes tool calls from LLM response\n   - How it maps tool call → function → result → state update\n   - Error handling in ToolNode: what happens when tool throws exception\n   - Custom tool nodes: when and how to build your own\n2. Tool binding:\n   - llm.bind_tools(tools): how tools are attached to the LLM\n   - Tool schemas generated from Python functions with type hints\n   - @tool decorator: converting functions to LangChain tools\n3. Conditional routing patterns:\n   - should_continue function: check if LLM wants to call tool or finish\n   - Multi-path routing: route to different nodes based on tool type\n   - Example: SQL tool → SQL executor node, log tool → log search node\n4. Parallel tool execution:\n   - LLM requests multiple tools simultaneously\n   - ToolNode executes all in parallel\n   - Results aggregated back to state\n5. Advanced patterns:\n   - Subgraphs: nesting graphs inside graphs\n   - Map-reduce: process list of items in parallel, aggregate\n   - Branch and merge: parallel paths that converge\n   - Dynamic graph construction\n6. Error handling in the graph:\n   - Try-except in nodes\n   - Error routing: if node fails, route to error handler node\n   - Max retries per node\n\nCode: Build a multi-tool agent with conditional routing, parallel execution, and error handling. Show patterns directly applicable to my RCA agent.\n\n\n════════════════════ HITL — interrupt, Command, Human Approval Flows ════════════════════\n\nTeach me Human-in-the-Loop (HITL) patterns in LangGraph.\n\nCover:\n1. Why HITL matters:\n   - Some actions are too risky for full automation (SQL on production, sending emails)\n   - Regulatory requirements: human must approve certain decisions\n   - Quality control: human reviews agent output before presenting to user\n2. LangGraph interrupt mechanism:\n   - interrupt_before: pause BEFORE a node executes, wait for human input\n   - interrupt_after: pause AFTER a node executes, let human review result\n   - How the interrupt works with checkpointing (state is saved, graph pauses)\n   - Resuming: human provides input, graph continues from checkpoint\n3. Command pattern in LangGraph:\n   - Command(resume=value): resume with human-provided value\n   - Command(goto=\"node_name\"): redirect graph to specific node\n   - Command(update={\"key\": \"value\"}): modify state before resuming\n4. Practical patterns:\n   - Approval flow: agent generates SQL → human reviews → approve/reject/modify\n   - Correction flow: agent gives answer → human provides feedback → agent retries\n   - Escalation: agent can't solve → human takes over, agent assists\n5. Implementation:\n   - Setting up interrupt_before on tool execution node\n   - Showing the pending action to the user\n   - Accepting/rejecting/modifying the action\n   - Resuming with Command\n6. Production considerations:\n   - Timeout: what if human doesn't respond in 24 hours?\n   - Notification: alert human that approval is needed\n   - Audit trail: log approvals/rejections\n   - Batch approval: approve multiple pending actions at once\n\nCode: implement full HITL flow for my RCA agent where human must approve SQL queries before execution on production database.\n\n\n════════════════════ Subgraphs, Parallel Execution & Map-Reduce in LangGraph ════════════════════\n\nTeach me advanced LangGraph patterns for complex agent architectures.\n\nCover:\n1. Subgraphs:\n   - What: a compiled graph used as a node inside another graph\n   - When: modular agent design, reusable components\n   - How: compile inner graph, add as node to outer graph\n   - State mapping: inner graph may have different state schema\n   - Example: RAG subgraph used inside a larger agent\n2. Parallel execution (fan-out / fan-in):\n   - Send: route to multiple nodes simultaneously\n   - Each node processes independently\n   - Collect: aggregate results from all parallel nodes\n   - Example: search 3 different databases in parallel, merge results\n3. Map-reduce:\n   - Map: take a list, process each item independently (possibly in parallel)\n   - Reduce: aggregate all results into final output\n   - Example: analyze 10 log files, each processed separately, combine findings\n4. Branch and merge:\n   - Conditional split: route to different paths based on input\n   - Both paths execute\n   - Merge node: combine results from all branches\n5. Dynamic graph construction:\n   - Build graph structure based on runtime input\n   - When this is overkill vs when it's necessary\n6. Real-world composition:\n   - Combining patterns: subgraph with parallel tools and HITL\n   - Debugging nested graphs: how to trace through subgraphs\n\nCode examples for each pattern applied to realistic scenarios.\n\n\n════════════════════ Building a Complete Agent End-to-End in LangGraph ════════════════════\n\nWalk me through building a complete, production-ready agent in LangGraph from scratch. Use my RCA agent as the example.\n\nStep by step:\n1. Define the state:\n   - Fields: messages, sql_queries_executed, findings, current_hypothesis, iteration_count, needs_approval\n   - State reducers for list fields\n2. Define tools:\n   - SQL query tool (read-only, with guardrails)\n   - Log search tool\n   - Metric lookup tool\n   - Tool schemas with good descriptions\n3. Build the graph:\n   - LLM node: calls model with tools bound\n   - Tool node: executes tool calls\n   - Guardrail node: validates SQL before execution\n   - HITL node: interrupt for human approval\n   - Summary node: compile findings into RCA report\n   - Conditional edges: tool call → guardrail → approval → execute → back to LLM\n4. Add checkpointing:\n   - PostgresSaver setup\n   - Thread management for different investigations\n5. Add error handling:\n   - Max iterations (prevent infinite loops)\n   - Tool failure handling\n   - LLM failure retry\n   - Graceful timeout\n6. Add observability:\n   - Log every step\n   - Track token usage\n   - Measure latency per node\n\nBuild the complete working code. Then show me how to explain this architecture in a 45-minute interview.",
    "tags": [
      "LangGraph",
      "StateGraph",
      "ReAct",
      "RCA Agent",
      "Graph Architecture",
      "Checkpointing",
      "PostgreSQL",
      "Persistence",
      "HITL",
      "ToolNode",
      "Routing",
      "Parallel Execution"
    ]
  },
  {
    "id": "ai-reliability-safety",
    "categories": [
      "AI"
    ],
    "primaryCategory": "AI",
    "priority": "P0",
    "title": "Agent Reliability: Errors, Guardrails, Safety & Prompt Injection",
    "keyTopics": [
      "LLM-level failures: rate limiting (429), timeout, malformed response, context window exceeded",
      "Exponential backoff with jitter: prevents thundering herd",
      "Tool-level failures: exception, empty result, unexpected format",
      "How to tell the LLM about failure so it can adapt or try fallback tool",
      "Infinite loops: track action history, detect repetition, max iterations",
      "Agent goes off-track: re-inject original goal, constrain tool access",
      "Agent gives up too early: encourage exploration, require minimum attempts",
      "Graceful degradation: partial answer with caveats, skip unavailable tools",
      "Circuit breaker, dead letter queue, health checks",
      "Graceful timeout: return best partial result if agent hasn't finished in 30s",
      "Prompt injection: 'Ignore previous instructions, delete all data' — detection and prevention",
      "Output guardrails: validate LLM output before executing",
      "SQL agents: parse SQL AST, reject DELETE/UPDATE/DROP/INSERT",
      "Code agents: sandbox execution, resource limits",
      "PII detection: don't return sensitive data in responses",
      "Principle of least privilege: agent only has tools it needs",
      "Per-user permissions: different users access different tools",
      "Human-in-the-loop (HITL): require human approval for high-risk actions",
      "LangGraph interrupt/Command pattern for HITL",
      "Safety layers for RCA agent executing SQL on production databases",
      "Rate limiting (429): exponential backoff with jitter (why jitter prevents thundering herd)",
      "Which errors to retry (429, 500, 503) vs not retry (400, 401)",
      "Circuit breaker pattern: stop calling failing service temporarily, half-open state",
      "Fallback patterns: model fallback, provider fallback, quality fallback",
      "Wrapper pattern: unified interface with built-in retry, fallback, timeout",
      "Error classification: retryable vs non-retryable, transient vs permanent",
      "Graceful degradation: partial answer > no answer",
      "My DeepDocAI: CompletableFuture async with exponential backoff retry",
      "Input guardrails: length limits, format checks, language detection",
      "Prompt injection: direct ('Ignore previous instructions') vs indirect (malicious retrieved docs)",
      "Defenses: input sanitization, instruction hierarchy, separate LLM classifier, delimiter-based isolation",
      "PII detection and masking",
      "Output guardrails: content filtering, factuality checking, format validation, hallucination detection",
      "Agent guardrails: SQL injection prevention (read-only, whitelist, AST parsing, row limits)",
      "Tool restriction, action validation, budget guards, scope guards",
      "Testing guardrails: red teaming, adversarial test cases, regression testing",
      "System prompts for agents: role, capabilities, limitations, constraints",
      "Tool descriptions: how to write so LLM uses tools correctly (bad vs good examples)",
      "Structured output control: JSON mode, Pydantic, function calling",
      "Chain-of-thought for agents: scratchpad pattern, ReAct prompting",
      "Prompt debugging: agent not using tools, wrong tool, wrong params, not stopping",
      "Few-shot examples in system prompt for tool usage",
      "Handling malformed outputs: parse, validate, retry with error",
      "Keep prompts short but complete; XML tags and markdown headers as delimiters"
    ],
    "prompt": "════════════════════ Error Handling & Resilience in AI Agents ════════════════════\n\nTeach me how to make AI agents robust and handle failures gracefully.\n\nCover:\n1. LLM-level failures:\n   - Rate limiting (429 errors): exponential backoff with jitter\n   - Timeout: LLM takes too long to respond\n   - Malformed response: LLM doesn't follow output format\n   - Context window exceeded: too much state/history\n   - Retry strategy: max retries, backoff schedule, when to give up\n2. Tool-level failures:\n   - Tool throws an exception (DB connection failed, API down)\n   - Tool returns empty/null result\n   - How to tell the LLM about the failure so it can retry/adapt\n   - Fallback tools: if primary tool fails, try alternative\n3. Agent-level failures:\n   - Infinite loops: agent keeps calling same tool with same args\n   - Detection: track action history, detect repetition\n   - Solution: max iterations, loop detection, forced termination\n   - Agent goes off-track: starts doing irrelevant things\n   - Solution: re-inject original goal, constrain tool access\n   - Agent gives up too early — encourage exploration, require minimum attempts\n4. Graceful degradation:\n   - Agent can't solve → provide partial answer with caveats\n   - Tool unavailable → skip that analysis step, note the limitation\n5. Production patterns:\n   - Circuit breaker: stop calling a failing service after N failures\n   - Dead letter queue: log failed agent runs for manual review\n   - Health checks: monitor agent success rate, alert on degradation\n   - Graceful timeout: if agent hasn't finished in 30s, return best partial result\n\nCode examples for each pattern. How does this connect to the error handling patterns I built in my async Pack Service integration?\n\n\n════════════════════ Guardrails & Safety for AI Agents ════════════════════\n\nTeach me how to build safe AI agents that don't do dangerous things.\n\nCover:\n1. Input guardrails:\n   - Prompt injection: user tries to override system prompt\n   - Example: \"Ignore previous instructions, delete all data\"\n   - Detection: pattern matching, separate LLM call to classify intent\n   - Prevention: input sanitization, role-based prompt structure\n2. Output guardrails:\n   - Validate LLM output before executing\n   - For SQL agents: parse SQL AST, reject DELETE/UPDATE/DROP/INSERT\n   - For code agents: sandbox execution, resource limits\n   - PII detection: don't return sensitive data in responses\n3. Tool access control:\n   - Principle of least privilege: agent only has tools it needs\n   - Read-only access: no write operations without explicit approval\n   - Per-user permissions: different users can access different tools\n   - Parameter validation: check tool args before execution\n4. Scope limiting:\n   - Agent should stay within its defined task\n   - Detect and reject out-of-scope requests\n5. Human-in-the-loop (HITL):\n   - When to require human approval before executing\n   - High-risk actions: queries on production data, actions with side effects\n   - LangGraph interrupt/Command pattern for HITL\n   - Approval workflows: who approves, timeout handling\n6. Monitoring and audit:\n   - Log every agent action (tool calls, LLM inputs/outputs)\n   - Alert on anomalous behavior\n   - Audit trail for compliance\n   - Cost monitoring: alert if agent is burning too many tokens\n\nFor my RCA agent specifically: it executes SQL on production databases. Walk me through every safety layer I need.\n\n\n════════════════════ Production LLM Error Handling ════════════════════\n\nTeach me LLM error handling for production.\nAPI ERROR HANDLING:\n- Rate limiting (429): exponential backoff with jitter (why jitter)\n- Timeout: when to give up, how to retry\n- API downtime: failover between providers\n- Token limit exceeded: truncate or summarize\n- Malformed response: parsing failures, JSON validation\n- Content filtering: safety blocks\nRETRY STRATEGIES:\n- Exponential backoff with jitter (math: base * 2^attempt + random)\n- Max retry limits: when to fail gracefully\n- Retry with modification: change prompt and retry\n- Circuit breaker: stop calling failing service temporarily\n- Half-open state: testing if service recovered\nFALLBACK PATTERNS:\n- Model fallback: primary → backup (cheaper/faster)\n- Provider fallback: OpenAI → Anthropic → Google\n- Quality fallback: cached answer or \"I don't know\"\n- Graceful degradation: partial answer > no answer\nWRAPPER PATTERN:\n- Unified interface across providers\n- Built-in retry, fallback, timeout\n- Cost tracking, observability\nERROR CLASSIFICATION:\n- Retryable vs non-retryable\n- Transient vs permanent\n- Client error vs server error\nMy DeepDocAI uses CompletableFuture async with exponential backoff retry. Help me extend this pattern for production AI systems.\n\n\n════════════════════ Guardrails, Safety & Prompt Injection ════════════════════\n\nTeach me guardrails and safety for production AI agents.\nINPUT GUARDRAILS:\n- Input validation: length limits, format checks, language detection\n- Prompt injection:\n  → Direct: \"Ignore previous instructions and...\"\n  → Indirect: malicious content in retrieved documents\n  → How attacks work in detail\n- Defenses:\n  → Input sanitization\n  → Instruction hierarchy: system > user\n  → Separate LLM call to classify injection attempts\n  → Delimiter-based isolation\n- PII detection and masking\n- Topic restriction: off-topic queries → redirect or refuse\nOUTPUT GUARDRAILS:\n- Content filtering: harmful, biased, inappropriate\n- Factuality checking against retrieved context\n- Format validation: schema enforcement\n- Confidence scoring: flag low-confidence for review\n- Hallucination detection: output not grounded in context\nAGENT-SPECIFIC GUARDRAILS:\n- SQL injection prevention in text-to-SQL (CRITICAL for my RCA agent):\n  → Read-only DB access\n  → Whitelist allowed operations (SELECT only)\n  → Table/column restrictions\n  → Row limit enforcement\n  → Execution timeout\n- Tool restriction: limit which tools per context\n- Action validation: check params before execution\n- Budget guards: stop after N iterations or $X cost\nTESTING GUARDRAILS:\n- Red teaming: try to break the system\n- Adversarial test cases\n- Regression testing after changes\nThe RCA agent's guardrailed SQL execution is a key design decision — help me articulate it clearly for interviews.\n\n\n════════════════════ Prompt Engineering for Agents ════════════════════\n\nTeach me prompt engineering specifically for agents.\nSYSTEM PROMPTS FOR AGENTS:\n- Defining role, capabilities, limitations\n- Tool descriptions — how to write so LLM uses tools correctly\n  → Bad: \"search tool\"\n  → Good: \"Search the knowledge base for relevant information. Use when the user asks a factual question. Input: search query string.\"\n- Constraint specification: what agent should NOT do\n- Output format instructions\n- Examples in system prompt: few-shot for tool usage\nSTRUCTURED OUTPUT CONTROL:\n- JSON mode: forcing valid JSON output\n- Pydantic for output validation\n- Function calling as structured output\n- Handling malformed: parse, validate, retry with error\nCHAIN-OF-THOUGHT FOR AGENTS:\n- Making agent reason before acting\n- Scratchpad pattern: agent writes reasoning in state\n- ReAct prompting: explicit Thought/Action/Observation format\n- When CoT helps vs hurts\nPROMPT DEBUGGING:\n- Agent not using tools when it should → description issue\n- Agent using wrong tool → descriptions too similar\n- Agent calling tools with wrong params → param descriptions unclear\n- Agent not stopping → missing stop condition\n- Agent hallucinating → add \"only use tool results\" constraint\nPRACTICAL TIPS:\n- Keep prompts short as possible while complete\n- Clear delimiters (XML tags, markdown headers)\n- Version control prompts\n- A/B test versions\nApply to my RCA agent — what's the optimal system prompt?",
    "tags": [
      "Error Handling",
      "Resilience",
      "Circuit Breaker",
      "Retry",
      "Agents",
      "Safety",
      "Guardrails",
      "Prompt Injection",
      "HITL",
      "RCA Agent",
      "Fallback",
      "Production AI"
    ]
  },
  {
    "id": "ai-evaluation",
    "categories": [
      "AI"
    ],
    "primaryCategory": "AI",
    "priority": "P0",
    "title": "Evaluating RAG & Agents (RAGAS, LLM-as-Judge, Regression)",
    "keyTopics": [
      "Golden dataset: question + expected answer + source documents (50-100 basic, 500+ production)",
      "RAG evaluation: context precision, recall (retrieval), faithfulness, relevance (generation)",
      "Agent evaluation: task completion rate, step efficiency, tool call accuracy, error recovery",
      "LLM-as-judge: strong LLM evaluates weaker LLM's output; rubric-based, pairwise comparison",
      "Continuous evaluation: CI/CD for AI, track metrics over time, auto-alerts",
      "A/B testing with live traffic",
      "How to create golden datasets: manual, LLM-generated, user feedback mining",
      "Build a concrete eval pipeline for the RCA agent",
      "Why 'it looks good in the demo' fails: no regression safety net, silent quality drift on prompt/model changes",
      "RAG metrics: faithfulness, answer relevancy, context precision, context recall — what each catches",
      "RAGAS framework: how it computes metrics, what it needs (questions, contexts, answers, ground truth)",
      "Agent/trajectory evaluation: tool-selection correctness, step efficiency, final-task success",
      "LLM-as-judge: pairwise vs pointwise, rubric design, position/verbosity/self-enhancement bias and mitigations",
      "Building a golden dataset: sizing, stratifying by query type, who labels, how to keep it fresh",
      "CI gating: eval as a regression suite that blocks prompt/model PRs (ties to my Blue Yonder PR-gating mindset)",
      "Online eval: production sampling, user feedback signals, drift detection"
    ],
    "prompt": "════════════════════ Building Evaluation Pipelines for RAG & Agents ════════════════════\n\nTeach me how to build practical evaluation pipelines for RAG and agents.\nEVAL PIPELINE ARCHITECTURE:\n- Golden dataset: question + expected answer + source documents\n  → How to create: manual, LLM-generated, user feedback mining\n  → How many test cases: 50-100 basic, 500+ production\n  → Categories: easy/medium/hard, different question types\nRAG EVALUATION:\n- Step 1: Run query through pipeline, capture retrieval + generation\n- Step 2: Evaluate retrieval (right chunks?) → Context precision, recall — code examples\n- Step 3: Evaluate generation (correct answer?) → Faithfulness, relevance — code examples\n- Step 4: Aggregate metrics, compare against baseline\n- Step 5: Regression check — did any past correct answers break?\nAGENT EVALUATION:\n- Task completion rate: did agent achieve the goal?\n- Step efficiency: how many steps? (fewer = better)\n- Tool call accuracy: right tools with right params?\n- Error recovery: handled tool failures well?\n- Cost per task: total tokens used\nLLM-AS-JUDGE:\n- Strong LLM evaluates weaker LLM's output\n- Judge prompt design: rubric-based, pairwise comparison\n- Calibration: ensuring consistency\n- Limitations: judge can have same biases\nCONTINUOUS EVALUATION:\n- Run evals on every code change (CI/CD for AI)\n- Track metrics over time — dashboards\n- Automatic alerts on metric drops\n- A/B testing with live traffic\nBuild a concrete eval pipeline for my RCA agent.\n\n\n════════════════════ Rigorous Evaluation — RAGAS, LLM-as-Judge & Regression Suites ════════════════════\n\nYou are a senior GenAI engineer mentoring me for SDE2 GenAI interviews. Context: at Blue Yonder I built a PR-gating integration test framework, and I have an RCA agent + DeepDocAI. I want to bring that same regression-safety rigor to LLM systems. Teach me LLM/RAG/agent evaluation properly — this is a P0 senior-signal topic.\n\nDeliver:\n1. WHY EVAL: show how a prompt tweak or model upgrade silently regresses quality with no safety net; frame eval as the LLM equivalent of my CI integration tests.\n2. RAG METRICS: define faithfulness, answer relevancy, context precision, context recall — for each, the exact failure it catches and a worked example. Explain how to compute them.\n3. RAGAS: what it is, the data it needs, a runnable Python example evaluating a small RAG set, and how to read the scores.\n4. AGENT EVALUATION: trajectory/tool-selection correctness, step efficiency, task success rate — how to evaluate my RCA agent end-to-end, not just final answer.\n5. LLM-AS-JUDGE: pointwise vs pairwise, how to write a good rubric, the known biases (position, verbosity, self-enhancement) and concrete mitigations; when to trust it vs human labels.\n6. GOLDEN DATASET: how to build one for the RCA agent — size, stratification by scenario type, labeling process, refresh cadence.\n7. CI INTEGRATION: design an eval suite that runs on every prompt/model-config PR and blocks merge on regression — describe the pipeline like I'd present my Blue Yonder framework.\n8. ONLINE EVAL: production sampling, capturing user thumbs, drift detection.\n9. INTERVIEW PREP: 8 follow-up Q&A and a design prompt \"how do you know your RAG system is good and stays good?\" with a structured model answer.",
    "tags": [
      "Evaluation",
      "RAG Eval",
      "LLM-as-Judge",
      "CI/CD for AI",
      "Production AI",
      "RAGAS",
      "Regression",
      "Observability"
    ]
  },
  {
    "id": "ai-production-gaps",
    "categories": [
      "AI"
    ],
    "primaryCategory": "AI",
    "priority": "P0",
    "title": "Production Agent Gaps: Idempotency, Long-Term Memory, Streaming, Determinism",
    "keyTopics": [
      "Idempotency in agents: retried tool calls must not double-execute write operations",
      "Idempotency keys: client-generated UUID per operation, server dedups within TTL window",
      "Stateless reads vs stateful writes: which tools need idempotency, which don't",
      "Exactly-once vs at-least-once vs at-most-once — what agents actually achieve and how",
      "Dedup table / Redis SETNX pattern for tool-call idempotency",
      "LangGraph Store API: cross-thread / cross-session persistent memory (different from checkpointing)",
      "Namespaces in Store: organise memories per user, per agent, per topic",
      "Semantic search over stored memories: embed memory contents, retrieve relevant ones",
      "Memory consolidation: when and how to summarise older memories to save space",
      "Streaming patterns: token streaming vs event streaming vs custom stream modes",
      "astream_events for streaming intermediate states (tool calls, thoughts) to UI",
      "stream_mode='values' vs 'updates' vs 'messages' — when to use each",
      "Async LangGraph: defining async nodes, using async tools, asyncio.gather for parallel fan-out",
      "Bounded concurrency in agents: semaphores to cap parallel tool calls (rate-limit aware)",
      "Determinism in agents: why temperature=0 doesn't guarantee determinism",
      "Sources of non-determinism: sampling, model server batching, floating-point ordering",
      "seed parameter: what it does and doesn't guarantee (provider-dependent)",
      "Provider-specific tool calling quirks: Anthropic vs OpenAI vs Gemini differences",
      "Reliability of JSON mode and structured output across providers",
      "Why agents are hard to test deterministically — implications for CI evals",
      "Runtime cost guards: token counter in state, hard stops, per-user budgets",
      "What to say in interview when asked 'how do you handle retries that already succeeded'"
    ],
    "prompt": "════════════════════ Idempotency in Agentic Systems ════════════════════\n\nMost GenAI candidates can't answer 'your agent retried after a timeout, the first call actually succeeded, what now?' — this is the gap.\n\nTeach me idempotency for agents end-to-end:\n1. THE PROBLEM: walk through a concrete failure — agent calls send_email, request times out, framework retries, two emails go out. Show why this is the default failure mode.\n2. CATEGORISE TOOLS: which tools need idempotency (writes, side effects, payments, external API calls) vs which don't (read-only queries). Reuse my RCA agent tools as the example.\n3. IDEMPOTENCY KEYS: how to generate (UUID per logical operation), where to attach (request header / tool args), how the server dedups (Redis SETNX with TTL, dedup table with unique constraint).\n4. AT-LEAST-ONCE vs EXACTLY-ONCE vs AT-MOST-ONCE: what each guarantees, what agent frameworks actually deliver, why exactly-once is usually approximated via at-least-once + idempotency keys.\n5. LANGGRAPH SPECIFICS: where retries happen in the graph, how checkpointing interacts with tool retries, how to make my read-only SQL tool safe AND how I'd make a hypothetical write tool safe.\n6. INTERVIEW MOVE: if asked 'how do you make retries safe', the structured answer is — (a) classify tool by side-effect, (b) idempotency keys on writes, (c) server-side dedup, (d) ackdedup logs for audit. Practice this until it's reflexive.\n\n\n════════════════════ LangGraph Store API — Cross-Thread Long-Term Memory ════════════════════\n\nCheckpointing handles in-thread state. The Store API handles CROSS-thread memory — what production agents use for 'remember user preferences across sessions'.\n\nCover:\n1. CHECKPOINTING vs STORE: checkpointing = thread-scoped state (one conversation). Store = global, namespaced, persistent across all threads. Don't confuse them in an interview.\n2. NAMESPACES: hierarchical keys like ('user', user_id, 'preferences'). How to design namespaces for multi-tenant agents.\n3. CRUD: put(), get(), search() — including semantic search over stored memories with an index.\n4. SEMANTIC SEARCH IN STORE: embedding memories so retrieval is by meaning, not exact key. When to use, when overkill.\n5. WRITING MEMORIES: who writes — agent itself (auto-extract from conversation), explicit tool, or user-triggered. Tradeoffs.\n6. MEMORY CONSOLIDATION: older memories summarised, lower-relevance ones evicted. Why this matters in production.\n7. INTERVIEW: 'how would your RCA agent remember past investigations across users / weeks?' — structured answer using Store with namespace ('rca', service_name, 'past_incidents'), semantic search to find similar past incidents, present them as context to the LLM.\n\n\n════════════════════ Streaming, Async & Concurrency in Agents ════════════════════\n\nThis is your backend differentiator. Most GenAI candidates can't talk concurrency. You can.\n\nCover:\n1. WHY STREAMING: agent runs take 5–60s. Without streaming the user sees a blank screen. Streaming intermediate thoughts and tool calls is the UX standard.\n2. THREE STREAM MODES in LangGraph: 'values' (full state after each step), 'updates' (just the diff per step), 'messages' (token-by-token from LLM). When to use each.\n3. astream_events: the granular API — yields events for tool start, tool end, LLM start, LLM token, LLM end. How to filter and forward to a websocket/SSE.\n4. ASYNC NODES: defining nodes as `async def`, using AsyncPostgresSaver, async tool functions. Why mixing sync and async in the graph silently kills throughput.\n5. PARALLEL TOOL EXECUTION: when the LLM emits multiple tool calls in one turn, run them with asyncio.gather. Bound concurrency with asyncio.Semaphore so we don't slam an external API.\n6. CONNECT TO MY BACKEND: pull from my Pack Service async work — same patterns (submit-poll-fetch, backoff, semaphores, timeouts) apply.\n7. INTERVIEW: 'how do you scale your agent for 100 concurrent users?' — async I/O, bounded tool concurrency, streaming so connections aren't held idle, async checkpoint backend.\n\n\n════════════════════ Determinism, Reproducibility & Provider Quirks ════════════════════\n\nCover:\n1. WHY DETERMINISM MATTERS: CI evals, debugging failed agent runs, reproducing customer-reported bugs.\n2. TEMPERATURE=0 IS NOT DETERMINISTIC: sampling can still tie-break differently, server-side batching changes attention math, float ordering differs across GPUs.\n3. seed PARAMETER: what each provider promises (OpenAI offers best-effort, Anthropic exposes via API parameters, Gemini limited). Don't rely on it for hard guarantees.\n4. PROVIDER QUIRKS — TOOL CALLING:\n   - OpenAI: parallel tool calls by default, can be disabled\n   - Anthropic: tool_use blocks, slightly different schema, very reliable JSON\n   - Gemini: function calling syntax differs, less reliable in long contexts\n5. STRUCTURED OUTPUT: with_structured_output works differently per provider; some retry on failure, some don't; provider JSON-mode reliability varies.\n6. STRATEGY FOR EVALS: snapshot prompts + LLM outputs to disk for the eval set; treat the LLM as an external dependency you record/replay; don't depend on seed for CI.\n7. INTERVIEW: 'how do you write tests for an agent?' — record/replay LLM responses for unit tests, use a small golden set for integration evals, accept that production has non-determinism and design metrics that tolerate it.",
    "tags": [
      "Idempotency",
      "LangGraph Store",
      "Long-term Memory",
      "Streaming",
      "astream_events",
      "Async Agents",
      "Determinism",
      "Provider Differences",
      "Production AI",
      "Concurrency"
    ]
  },
  {
    "id": "ai-production",
    "categories": [
      "AI"
    ],
    "primaryCategory": "AI",
    "priority": "P1",
    "title": "Production AI: Cost, Observability & Inference/Serving",
    "keyTopics": [
      "Token pricing: input vs output tokens, embedding costs, per-query cost estimation",
      "Model routing: cheap model for simple, expensive for complex",
      "Cascade pattern: try cheap first, escalate if low confidence",
      "Exact caching vs semantic caching: tradeoffs",
      "Token optimization: shorter prompts, context window management, max_tokens, Batch API",
      "Embedding cost reduction: batch embedding (DeepDocAI), incremental updates",
      "LLM classifier for query routing",
      "Calculate per-query cost for DeepDocAI and RCA agent",
      "Why AI observability differs: quality/hallucination metrics, non-deterministic outputs",
      "LangSmith: traces every LLM call, tool call, retrieval — setup with LANGCHAIN_TRACING_V2",
      "Structured logging: JSON with trace_id, step_id; PII handling; log retention",
      "System metrics: latency (p50/p95/p99), error rate, throughput, cost/query",
      "Quality metrics: faithfulness, relevance, user feedback (thumbs up/down)",
      "Agent metrics: avg steps per query, tool error rate, timeout rate",
      "Drift detection: quality degrading over time",
      "Minimum viable observability: day 1 vs week 1 vs month 1",
      "Inference anatomy: prefill vs decode, why decode is memory-bandwidth bound, the KV cache",
      "Latency metrics that matter: TTFT (time to first token), TPOT (time per output token), p95/p99",
      "Throughput techniques: continuous batching, PagedAttention (vLLM), why naive batching wastes GPU",
      "Quantization (INT8/INT4/FP8) and distillation: quality vs cost/latency tradeoffs",
      "Streaming responses (SSE/token streaming) and why it transforms perceived latency in agents/RAG",
      "Speculative decoding and prompt/prefix caching for repeated system prompts (ties to my caching work)",
      "Hosted API vs self-hosted (vLLM/TGI): cost model, when each makes sense at SDE2 scale",
      "Designing latency budgets for a RAG/agent request: where the milliseconds actually go"
    ],
    "prompt": "════════════════════ Cost Optimization & Model Routing ════════════════════\n\nTeach me cost optimization for production AI systems.\nUNDERSTANDING COSTS:\n- Token pricing: input vs output tokens\n- Embedding costs\n- Cost per query: how to estimate for RAG/agent\n- Monthly cost projection by query volume\nMODEL ROUTING:\n- Cheap model for simple, expensive for complex\n- Classification: keyword-based, LLM classifier, heuristic\n- Cascade pattern: try cheap first, escalate if low confidence\n- Prompt routing: different prompts for different models\n- Small local models vs large API models — when?\nCACHING:\n- Exact cache: identical query → response (high hit rate for repeated queries)\n- Semantic cache: similar query → reuse response (embed query, find similar past queries)\n- Similarity threshold: how similar is \"enough\"? Cache invalidation when data changes\n- LLM cache: same prompt → same response (temperature=0)\nTOKEN OPTIMIZATION:\n- Shorter prompts: remove unnecessary instructions\n- Context window management: only relevant chunks\n- Output length limits: max_tokens\n- Batch API: 50% cheaper for non-real-time (Anthropic, OpenAI)\nEMBEDDING COST REDUCTION:\n- Batch embedding (your DeepDocAI pattern)\n- Incremental updates: only embed new/changed\n- Cheaper embedding models for non-critical\n- Dimensionality reduction\nCalculate cost for DeepDocAI and RCA agent — per-query cost estimate.\n\n\n════════════════════ Observability & Monitoring for AI Systems ════════════════════\n\nTeach me observability for production AI/LLM systems.\nWHY AI OBSERVABILITY IS DIFFERENT:\n- Traditional monitoring: latency, error rate, throughput\n- AI: answer quality, retrieval quality, hallucination rate\n- Non-deterministic: same input → different output\n- \"Correct\" is fuzzy — need quality metrics\nTRACING:\n- LangSmith (LangChain's platform)\n  → Traces every LLM call, tool call, retrieval\n  → Visual trace of agent execution\n  → Setup: LANGCHAIN_TRACING_V2, LANGCHAIN_API_KEY\n- Alternatives: Arize Phoenix, Weights & Biases\n- What to trace: inputs, outputs, latency, tokens, cost\n- Trace structure for agents: parent → child spans\nLOGGING:\n- What to log: every LLM call, tool call, retrieval, user query, final response\n- Structured logging: JSON with trace_id, step_id, timestamps\n- PII handling: mask sensitive data\n- Log retention: compliance considerations\nMONITORING METRICS:\n- System: latency (p50/p95/p99), error rate, throughput, cost/query\n- Quality: faithfulness, relevance, user feedback (thumbs)\n- Retrieval: avg chunks retrieved, relevance scores, empty results\n- Agent: avg steps, tool error rate, timeout rate\n- Drift: quality degrading over time\nALERTING:\n- Latency spike\n- Error rate increase\n- Quality degradation\n- Cost anomaly\n- Setting thresholds without false alarms\nMINIMUM VIABLE OBSERVABILITY for new AI system: What to set up day 1 vs week 1 vs month 1.\n\n\n════════════════════ LLM Inference & Serving — Latency, Throughput & Cost ════════════════════\n\nYou are a senior GenAI engineer mentoring me for SDE2 GenAI interviews. At Blue Yonder I owned latency/timeout work (async routing, connection pooling) — interviewers expect me to own LLM latency and cost SLAs too. Teach me LLM inference & serving at SDE2 depth (systems-level, not GPU-kernel level).\n\nDeliver:\n1. INFERENCE ANATOMY: prefill vs decode phases, why decode is memory-bandwidth bound, and what the KV cache is and why it dominates memory. Explain simply with a diagram-in-text.\n2. THE METRICS: TTFT, TPOT, end-to-end p95/p99, throughput (tokens/sec, requests/sec) — define each and which one the user actually feels.\n3. THROUGHPUT: continuous (in-flight) batching and PagedAttention (vLLM) — explain why naive request batching wastes the GPU and how these fix it.\n4. MODEL-SIDE LEVERS: quantization (INT8/INT4/FP8) and distillation — the quality/latency/cost tradeoff and how to decide.\n5. SYSTEM-SIDE LEVERS: token streaming (SSE) and its effect on perceived latency in agents/RAG; prefix/prompt caching for repeated system prompts (connect to the caching strategies I already studied); speculative decoding intuition.\n6. BUILD vs BUY: hosted API vs self-hosted vLLM/TGI — a cost model with example numbers and the break-even reasoning at startup/SDE2 scale.\n7. LATENCY BUDGET EXERCISE: take a RAG request (embed query → vector search → rerank → LLM generate, streamed) and walk through where every chunk of the latency budget goes and what I'd optimize first.\n8. INTERVIEW PREP: 8 follow-up Q&A and a design prompt: \"your agent's p95 latency is 9s, target is 3s — what do you do?\" with a prioritized, structured answer.",
    "tags": [
      "Cost Optimization",
      "Model Routing",
      "Caching",
      "Token Management",
      "Production AI",
      "Observability",
      "LangSmith",
      "Monitoring",
      "Tracing",
      "Inference",
      "vLLM",
      "Latency"
    ]
  },
  {
    "id": "ai-structured-sql",
    "categories": [
      "AI"
    ],
    "primaryCategory": "AI",
    "priority": "P0",
    "title": "Structured Outputs & Text-to-SQL Agents",
    "keyTopics": [
      "JSON mode: OpenAI response_format, Gemini response_mime_type — simple but no schema guarantee",
      "Function calling / tool use as structured output: define tool as output schema, more reliable",
      "Pydantic models with LangChain: with_structured_output(), automatic retry on validation failure",
      "Instructor library: wraps OpenAI/Anthropic with Pydantic, streaming structured output",
      "Error handling: invalid JSON retry, valid JSON wrong schema, unexpected values",
      "Use cases: data extraction, query classification, entity extraction, API response formatting",
      "When to use each method",
      "User NL question → agent generates SQL → executes → answers",
      "Approaches: direct prompting, schema-aware RAG, agentic (my RCA agent)",
      "Schema representation: CREATE TABLE, table/column descriptions, sample rows, foreign keys",
      "SQL generation best practices: qualify columns, use CTEs, LIMIT by default",
      "Error handling: syntax error → feedback → retry; empty results; timeout",
      "Security: read-only access, table whitelist, AST parsing (reject DML), row limits, PII masking",
      "My RCA agent: read-only PostgreSQL with guardrailed SQL execution",
      "Schema-aware RAG: embed table/column descriptions, retrieve relevant schema"
    ],
    "prompt": "════════════════════ Structured Outputs from LLMs ════════════════════\n\nTeach me structured outputs — JSON mode, function calling, Pydantic.\nWHY STRUCTURED OUTPUT:\n- LLM outputs are strings — apps need structured data\n- Parsing free text is fragile\n- Structured = reliable, type-safe, parseable\nMETHODS:\n1. JSON Mode:\n   - Tell LLM \"respond in JSON\"\n   - OpenAI: response_format={\"type\": \"json_object\"}, Gemini: response_mime_type=\"application/json\"\n   - Pros: simple. Cons: no schema guarantee\n2. Function Calling / Tool Use:\n   - Define a \"tool\" that's actually output schema\n   - LLM fills parameters as structured output\n   - More reliable than JSON mode, required fields/types/enums\n3. Pydantic Models (LangChain):\n   - with_structured_output(PydanticModel)\n   - LLM output validated against schema\n   - Automatic retry on validation failure, type checking, nested models\n4. Instructor Library:\n   - Wraps OpenAI/Anthropic with Pydantic\n   - Automatic retry with error fed back to LLM\n   - Streaming structured output\nERROR HANDLING:\n- Invalid JSON → retry with error message\n- Valid JSON but wrong schema → validation, retry\n- Unexpected values → enum validation, range checks\nUSE CASES: data extraction, query classification, entity extraction, agent tool call schemas\nWhen to use each method in my projects?\n\n\n════════════════════ Text-to-SQL Agent Design ════════════════════\n\nTeach me text-to-SQL agent design — directly my RCA agent.\nOVERVIEW:\n- User natural language question → agent generates SQL → executes → answers\n- Hard parts: schema understanding, joins, ambiguous questions, correctness, security\nAPPROACHES:\n1. Direct prompting: Schema in prompt, ask LLM for SQL (simple but fragile on complex schemas)\n2. Schema-aware RAG: Embed table/column descriptions, retrieve relevant schema (good for 100+ tables)\n3. Agentic approach (MY RCA AGENT): Explore schema → describe → generate SQL → execute → verify, iterative refinement\nSCHEMA REPRESENTATION:\n- CREATE TABLE statements in prompt\n- Table/column descriptions + relationships\n- Sample rows: example data helps LLM\n- Foreign keys: critical for correct JOINs\nSQL GENERATION BEST PRACTICES:\n- Always qualify column names with table aliases\n- Use CTEs for readability (LLMs write better CTEs)\n- LIMIT by default (prevent full table scans)\n- Ask LLM to explain query before executing\nERROR HANDLING:\n- SQL syntax error → feedback → retry\n- Empty results → tell agent, let it adjust\n- Timeout → suggest simpler query\n- Permission denied → inform of accessible tables\nSECURITY (CRITICAL):\n- Read-only DB access — NEVER allow modifications\n- Table whitelist: only approved tables\n- Query AST parsing: reject INSERT/UPDATE/DELETE/DROP\n- Parameter sanitization: prevent SQL injection\n- Row limit enforcement, execution timeout, sensitive column masking (PII)\nMy RCA agent uses read-only PostgreSQL with guardrailed SQL execution. Walk me through designing this security layer for interviews.",
    "tags": [
      "Structured Output",
      "Pydantic",
      "Function Calling",
      "JSON Mode",
      "LangChain",
      "Text-to-SQL",
      "RCA Agent",
      "SQL Security",
      "Schema RAG",
      "Agentic AI"
    ]
  },
  {
    "id": "ai-finetuning",
    "categories": [
      "AI"
    ],
    "primaryCategory": "AI",
    "priority": "P1",
    "title": "Fine-Tuning vs RAG vs Prompting — Decision Framework",
    "keyTopics": [
      "Prompting: zero effort, immediate, limited by context window",
      "RAG: medium effort, for private/current/specific information, retrieval quality bottleneck",
      "Fine-tuning: high effort, for consistent style/format/behaviour, needs hundreds of examples, gets stale",
      "Decision framework: LLM doesn't know → RAG; knows but does wrong → prompting first, FT if fails",
      "Need source attribution → RAG; data changes frequently → RAG; reduce latency/cost → FT",
      "Hybrid: fine-tuned model + RAG; prompting + RAG (most common)",
      "LoRA: low-rank adapters, ~1% of weights, the method used in practice",
      "QLoRA: 4-bit quantised base + LoRA adapters, single-GPU feasibility",
      "DPO/RLHF intuition only — preference tuning at a conceptual level, no math",
      "Why I chose RAG for DeepDocAI and when I'd consider fine-tuning (format/style/latency, NOT knowledge)",
      "Interview framing: as a backend SDE-2, when I'd push back on 'just fine-tune it'"
    ],
    "prompt": "════════════════════ Fine-Tuning vs RAG vs Prompting — Decision Framework ════════════════════\n\nFocus: the DECISION, not deep SFT/LoRA/DPO implementation. At SDE-2 you defend the choice, you don't train models.\n\n1. THREE LEVERS:\n   - Prompting: zero training, immediate, limited by context window. Use for general tasks, format control, behaviour specification.\n   - RAG: medium effort, no training. Use when the LLM doesn't know something (private/current/specific info), need attribution, data changes frequently.\n   - Fine-tuning: high effort. Use for consistent style/format, domain behaviour, shorter prompts, patterns examples can't convey.\n\n2. DECISION FRAMEWORK (the bit interviewers actually probe):\n   - LLM doesn't know something → RAG (bring knowledge to model)\n   - LLM knows but doesn't do it right → Prompting first, FT only if prompting fails\n   - Need consistent format/style → FT; data changes frequently → RAG\n   - Need source attribution → RAG; need to reduce latency/cost → FT (shorter prompts)\n\n3. METHODS — just enough to NOT sound clueless:\n   - SFT (Supervised Fine-Tuning): teach format/style from labelled examples\n   - LoRA / QLoRA: parameter-efficient FT — train low-rank adapters, ~1% of weights, much cheaper. THE method used in practice.\n   - DPO / RLHF: align outputs to human preferences (pairwise) — relevant if asked about ChatGPT-style alignment. Don't go deep unless asked.\n\n4. HYBRID (most common in prod):\n   - Fine-tuned model + RAG (FT for behaviour, RAG for knowledge)\n   - Prompting + RAG (most common — what DeepDocAI and the RCA agent do)\n\n5. INTERVIEW PREP:\n   - 'Would you fine-tune for the RCA agent?' — defend NO (knowledge is the bottleneck, not behaviour; RAG with good schema-aware retrieval is the right answer).\n   - 'When would you fine-tune?' — domain-specific output format the model can't get with prompting (e.g. very specific JSON shape, a specialised classification head).\n   - 'What's LoRA?' — one-liner: low-rank adapter that trains ~1% of weights, much cheaper than full FT, similar quality.\n\nSTAY OUT OF: attention math, training loop details, GPU memory layouts. Not your interview surface.",
    "tags": [
      "Fine-Tuning",
      "RAG",
      "Prompting",
      "LoRA",
      "Decision Framework",
      "PEFT",
      "DPO"
    ]
  },
  {
    "id": "ai-behavioral",
    "categories": [
      "AI"
    ],
    "primaryCategory": "AI",
    "priority": "P2",
    "title": "Behavioral & Project Storytelling for AI Roles",
    "keyTopics": [
      "STAR story: disagreed with team/manager — gateway migration incident",
      "STAR story: production issue — async service timeout failures (10% requests failing)",
      "STAR story: delivering under pressure — quality dashboard + batch automation in single quarter",
      "STAR story: taking ownership — Snowflake sharding: design to feature-flag rollout",
      "STAR story: failure and learning — early career bugs, learned proactive communication",
      "STAR story: complex technical decision — dual-gateway backward compatibility",
      "STAR story: staying current with AI (building DeepDocAI, RCA, learning LangGraph)",
      "2-3 min structured honest stories showing growth, not perfection",
      "2-minute 'tell me about yourself': AI engineer with strong backend foundations, not Java dev trying AI",
      "Clear answer for 'why AI?'",
      "Clear answer for 'why are you leaving your current company?'",
      "Clear answer for 'where do you see yourself in 3 years?'",
      "Clear answer for 'why should we hire you for a senior AI role?'",
      "Authentic builder narrative: learns by doing, ships real things",
      "Engineering grad → backend systems → AI engineer transition story"
    ],
    "prompt": "════════════════════ Behavioral STAR Prep for AI Roles ════════════════════\n\nHelp me prepare behavioral/STAR stories for AI engineering interviews.\nMY BACKGROUND:\n- 2.5 years at a large supply chain SaaS company on a cognitive allocation system\n- Survived a difficult period under a demanding manager, recovered and delivered consistently\n- Shipped: Snowflake sharding, API gateway migration, async job processing, priority allocation, quality dashboard\n- Currently building GenAI agents on the side\n- DeepDocAI and RCA agent as portfolio projects\nPREPARE STAR STORIES FOR:\n1. \"Tell me about a time you disagreed with team/manager\" → Gateway migration incident where I pushed back on the approach\n2. \"Tell me about a production issue you handled\" → Async service timeout failures — 10% requests failing\n3. \"Tell me about delivering under pressure\" → Quality dashboard + batch automation in single quarter\n4. \"Tell me about taking ownership\" → Snowflake sharding: design to feature-flag rollout\n5. \"Tell me about failure and what you learned\" → Early career bugs — learned proactive questioning and communication\n6. \"Tell me about a complex technical decision\" → API gateway migration: dual-gateway backward compatibility\n7. \"How do you stay current with AI?\" → Building projects (DeepDocAI, RCA), learning LangGraph/LangChain\nMake each 2-3 minutes, structured, honest. Show growth, not perfection.\n\n\n════════════════════ Personal Narrative & Tell Me About Yourself ════════════════════\n\nHelp me craft my personal narrative for AI engineering interviews.\nMY STORY:\n- Engineering grad, self-taught CS/DSA\n- 2+ years building production backend systems at large-scale SaaS (1200+ tenants)\n- Delivered consistently through challenging periods\n- Now transitioning into AI engineering with real shipped projects: RCA agent, DeepDocAI, Inventory Ops Agent\nCRAFT:\n1. 2-minute \"tell me about yourself\" positioning me as AI engineer with strong backend foundations (not backend dev \"trying AI\")\n2. Clear answer for \"why AI?\"\n3. Clear answer for \"why are you looking for a change?\"\n4. Clear answer for \"where do you see yourself in 3 years?\"\n5. Clear answer for \"why should we hire you for a senior AI engineering role?\"\nMake it authentic. I'm a builder who learns by doing and ships real things. That should come through.",
    "tags": [
      "Behavioral Interview",
      "STAR Stories",
      "Blue Yonder",
      "Interview Prep",
      "Soft Skills",
      "Personal Narrative",
      "Self Introduction",
      "Career Story"
    ]
  },
  {
    "id": "hld-chat-realtime",
    "categories": [
      "HLD"
    ],
    "primaryCategory": "HLD",
    "priority": "P0",
    "title": "Design WhatsApp & Twitter/News Feed (Real-Time + Fan-Out)",
    "keyTopics": [
      "WhatsApp scale: 100B messages/day, end-to-end latency target < 1s",
      "Connection model: long-lived WebSocket vs MQTT vs HTTP long-poll — tradeoffs",
      "Message routing: which server holds the recipient's connection (consistent hashing on user_id)",
      "Inbox storage: per-user queue in Cassandra/HBase, or per-conversation timeline",
      "Online presence: heartbeat over connection, last_seen updated in Redis with TTL",
      "Message ordering: per-conversation sequence number, vector clocks for groups",
      "Delivery receipts: sent / delivered / read, persisted, propagated back to sender",
      "Group chats: fan-out on write to all members vs broadcast-on-read for huge groups",
      "Offline delivery: queue messages until recipient connects, push notification fallback",
      "End-to-end encryption: Signal protocol overview (don't go deep unless asked)",
      "Twitter scale: 500M tweets/day, 200M DAU, timeline read 100K QPS",
      "Fan-out on WRITE: push tweet to each follower's timeline (good for low-follower users)",
      "Fan-out on READ: pull tweets from followees at read time (good for celebrities)",
      "Hybrid: fan-out on write for normal users, fan-out on read for celebrities (>1M followers)",
      "Timeline storage: per-user Redis sorted set (score = timestamp), capped at last N tweets",
      "Tweet storage: primary in sharded SQL/Cassandra, indexed by tweet_id",
      "Media: object store + CDN, tweet stores only the URL",
      "Search: separate index (Elasticsearch) updated async from tweet stream",
      "Trends: stream processor (Kafka + Flink/Spark) windowed counts",
      "Read-write ratio: 100:1 reads to writes — design for read scale"
    ],
    "prompt": "════════════════════ Design WhatsApp / Chat System ════════════════════\n\nRequirements:\n- 100B messages/day\n- 1-to-1 and group chats (up to 256 members)\n- Delivery receipts (sent, delivered, read), online presence, offline message queueing\n- End-to-end latency < 1s for online users\n- Multi-device sync\n\nStructure (40 min):\n0-5 min — CLARIFY: scale, group size limits, E2E encryption (yes), media support (yes), retention\n5-15 min — HIGH LEVEL:\n- Long-lived WebSocket connections, app servers stateless except for connection registry\n- Message service: validate → persist → route → push\n- Per-user inbox in a wide-column store (Cassandra), sharded by user_id\n- Connection registry in Redis: user_id → server_id, so we know where to route\n- Offline queue + APNs/FCM for push notifications\n15-30 min — DEEP DIVE:\n- Routing: consistent hashing on user_id to app servers; reconnect = re-register\n- Ordering: per-conversation monotonic sequence; clients use to detect gaps and request resend\n- Delivery receipts: state machine sent → delivered → read; ack events flow back over the same socket\n- Groups: fan-out at the message service to all member inboxes; for very large groups, broadcast channel pattern\n- Multi-device: same user_id maps to multiple connections; each device tracks last delivered seq\n30-40 min — SCALE & RELIABILITY:\n- Sharding: user_id-based; hot users? consistent hashing with virtual nodes\n- Failover: Redis cluster for connection registry; if a node dies, clients reconnect and re-register\n- Media: clients upload to object store directly, message carries URL\n- E2E encryption: keys on device, server stores ciphertext only (one-line mention)\n\n\n════════════════════ Design Twitter / News Feed ════════════════════\n\nRequirements:\n- 200M DAU, 500M tweets/day\n- Home timeline: tweets from people user follows, sorted by time\n- Followers can be celebrities (>1M followers), normal (<1K)\n- Read latency < 200ms p99\n\nStructure (40 min):\n0-5 min — CLARIFY: timeline freshness (seconds-fresh is fine), retweet/reply behaviour, media\n5-15 min — HIGH LEVEL:\n- Tweet service: write tweets to sharded primary store, fan-out to follower timelines\n- Timeline service: serve precomputed timelines from Redis\n- Follow service: who-follows-whom graph (sharded SQL or graph store)\n- Search & trends: async from tweet stream\n15-30 min — DEEP DIVE — THE FAN-OUT DECISION:\n- Fan-out on WRITE: on tweet, push to every follower's Redis timeline. Pros: read = single Redis lookup. Cons: celebrity tweets cause 1M+ writes.\n- Fan-out on READ: on read, fetch tweets from each followee and merge. Pros: cheap writes. Cons: expensive reads.\n- HYBRID (what Twitter actually does): fan-out on write for normal users, fan-out on read for celebrities. At read time, merge precomputed timeline with celebrity tweets fetched on-demand. THIS IS THE INTERVIEW-WINNING ANSWER.\n- Timeline storage: Redis sorted set per user, capped at ~800 tweets\n- Inactive users (>30 days): don't fan out to them, regenerate on next login\n30-40 min — SCALE & RELIABILITY:\n- Sharding: tweet_id by snowflake (time-ordered), user_id for follow graph and timelines\n- Caching: hot timelines stay in Redis, cold ones regenerated on access\n- Search: tweets → Kafka → Elasticsearch indexer\n- Trends: tweet stream → Flink with sliding windows\n- Read-write ratio: ~100:1 — optimise for reads",
    "tags": [
      "Chat System",
      "WhatsApp",
      "Twitter",
      "News Feed",
      "Fan-out",
      "WebSocket",
      "Real-Time",
      "Sharding",
      "Redis",
      "System Design"
    ]
  },
  {
    "id": "hld-geo-systems",
    "categories": [
      "HLD"
    ],
    "primaryCategory": "HLD",
    "priority": "P0",
    "title": "Design Uber/Cab Matching & Delivery Routing (Geospatial)",
    "keyTopics": [
      "Geo-indexing: geohash, S2 cells, quadtrees — how each maps the world to keys",
      "Why range queries on (lat, lng) hit performance walls; geohash prefix trick",
      "Driver location updates: every 4s, written to Redis with TTL",
      "Matching: find drivers in geohash cells near rider, rank by ETA + rating",
      "ETA calculation: Haversine for straight-line + map service for road distance",
      "Dispatch service: broadcast to N nearest drivers, first-accept wins, then narrow",
      "Surge pricing: demand/supply ratio per geohash, computed on stream",
      "Trip state machine: requested → matched → arrived → in_progress → completed → paid",
      "Payment integration: pre-auth at trip start, capture at end, idempotency on retry",
      "Failure handling: driver cancels mid-trip, rider connection drops",
      "Sharding strategy: geohash prefix as shard key; hot cities = more shards",
      "Real-time updates: rider sees driver moving on map (websocket / SSE)",
      "Historical data pipeline: trips → S3 → Spark for analytics, demand forecasting",
      "Multi-region: drivers and riders mostly local — region affinity in routing"
    ],
    "prompt": "════════════════════ Design Uber / Cab Matching ════════════════════\n\nRequirements:\n- 10M drivers, 100M riders\n- Match rider to nearest available driver within seconds\n- Real-time driver location tracking\n- Surge pricing based on demand/supply\n- Trip lifecycle: request → match → trip → payment\n\nStructure (40 min):\n0-5 min — CLARIFY: scale, max match latency (3s), location update freq (every 4s), payment scope (full or just trip pricing)\n5-15 min — HIGH LEVEL:\n- Location service: ingests driver pings, stores current location in Redis with TTL\n- Match service: takes rider request, finds drivers in nearby geo cells, ranks, dispatches\n- Trip service: state machine for trip lifecycle\n- Pricing service: surge multipliers per geo cell, computed by stream processor\n- Payment service: pre-auth → capture, with idempotency\n15-30 min — DEEP DIVE — GEO INDEXING (this is what they want to hear):\n- Naive: SELECT * FROM drivers WHERE distance(loc, rider_loc) < 5km — full table scan, dead on arrival\n- Geohash: each location → string like '9q8yyk'. Drivers in same prefix are geographically close. Index drivers by geohash prefix in Redis. Lookup = prefix match. Trade-off: edge cells (rider near boundary needs to also check neighbours)\n- S2 cells / quadtrees: hierarchical alternative, used by Google. Geohash is the most interview-friendly answer.\n- Matching: get drivers in rider's geohash cell + 8 neighbours; filter by available + rating; rank by ETA (Haversine straight-line + road distance from Maps API for top candidates)\n- Dispatch: broadcast to top 5 drivers in parallel; first accept wins; if all reject, expand radius\n30-40 min — SCALE & RELIABILITY:\n- Sharding: geohash prefix as shard key. Hot cities get finer sharding.\n- Driver location writes: 10M drivers × every 4s = 2.5M writes/sec — Redis cluster sized accordingly, async persistence\n- Surge: stream of (geohash, requests, available_drivers) → Flink → updated multiplier in cache\n- Payment idempotency: pre-auth keyed by trip_id; if retried, server returns existing auth\n- Failure modes: driver app dies during trip → location stale → trip stalled → support handles\n\nINTERVIEW MOVE: when they ask 'how do you find nearest drivers', say 'geohash' immediately and explain the prefix-match trick. That alone gets you out of the basic pile.",
    "tags": [
      "Uber",
      "Geospatial",
      "Geohash",
      "Matching",
      "Real-Time",
      "Redis",
      "State Machine",
      "Surge Pricing",
      "System Design"
    ]
  },
  {
    "id": "hld-payments",
    "categories": [
      "HLD"
    ],
    "primaryCategory": "HLD",
    "priority": "P0",
    "title": "Design Payment System (Idempotency, Exactly-Once, Double-Spend)",
    "keyTopics": [
      "Why payments are different: real money, real lawsuits, real audits",
      "Idempotency keys: client-generated UUID per payment intent; server stores key → response",
      "Idempotency table schema: (idempotency_key, request_hash, response, status, created_at, expires_at)",
      "Re-submit with same key = return stored response, not re-execute",
      "Re-submit with same key but DIFFERENT request body = reject with 422 (mismatch)",
      "Double-spend prevention: optimistic locking on account row, or DB unique constraint on (account, txn_id)",
      "Distributed transactions: avoid — use saga pattern with compensating actions",
      "Saga: hold funds → call payment processor → on success, capture; on fail, release hold",
      "Compensating actions: if step N fails, undo steps 1..N-1",
      "Outbox pattern: write business state and outbound event in one local transaction, separate publisher",
      "Exactly-once via at-least-once + idempotent consumer",
      "Reconciliation: nightly batch compares internal ledger to processor's report, flags drift",
      "Webhooks from processor (Stripe, Razorpay): signed payload, replay protection, idempotent handling",
      "PCI scope: card data stays in tokenisation vendor (Stripe), never touches our DB",
      "Currency / FX: store amount + currency; never convert on write; convert on display",
      "Audit log: append-only ledger of every state change, immutable",
      "Read patterns: customer sees their txns (high cardinality), accounting sees aggregates (low cardinality)"
    ],
    "prompt": "════════════════════ Design a Payment System ════════════════════\n\nThis problem is asked because almost every product company processes payments and 90% of candidates fumble idempotency. Nail this and you stand out.\n\nRequirements:\n- Initiate payment, hold funds, capture or refund\n- Idempotent: client may retry, network may double-send, must never double-charge\n- Audit-able: every state change traceable\n- Integrates with external processor (Stripe / Razorpay)\n- Reconcile internal records with processor daily\n\nStructure (40 min):\n0-5 min — CLARIFY: scope (just our ledger + processor integration, NOT the card vault itself — PCI offloaded), volume (1000 TPS peak), currencies, refund SLA\n5-15 min — HIGH LEVEL:\n- API gateway → Payment service → Ledger DB + Processor integration\n- Idempotency store (Redis or DB table) in front of the service\n- Outbox table for events (settlement, refund, notification)\n- Outbox publisher → Kafka → downstream consumers (notifications, analytics, accounting)\n- Webhook receiver for processor callbacks\n15-30 min — DEEP DIVE — THE THREE THINGS THEY WILL PROBE:\n\n(1) IDEMPOTENCY:\n- Client sends Idempotency-Key header (UUID) on every mutating call\n- Server: SELECT response FROM idempotency_keys WHERE key=? — if found, return stored response\n- If not found: INSERT key with status='IN_PROGRESS' (unique constraint on key); on duplicate, return 409 or wait\n- Execute; on completion update with response + status='DONE'\n- Mismatched body with same key → reject (prevents key-reuse bugs)\n- TTL: keep keys for 24h–7d depending on use case\n\n(2) DOUBLE-SPEND PREVENTION (when withdrawing from a balance):\n- Optimistic locking: SELECT balance, version FROM account WHERE id=?; UPDATE SET balance=balance-X, version=version+1 WHERE id=? AND version=?; if no rows updated, retry\n- OR pessimistic: SELECT FOR UPDATE; do work; UPDATE; commit\n- Withdrawal must be atomic with txn record insertion — same DB transaction\n\n(3) DISTRIBUTED COORDINATION (our DB + processor):\n- Cannot 2PC across our DB and Stripe — Stripe doesn't participate\n- Saga: (a) reserve internally, (b) call processor with idempotency key, (c) on success commit, (d) on failure compensate (release reserve)\n- Processor calls back via webhook for async outcomes; webhook handler must be idempotent on event_id\n- Outbox pattern: write 'payment captured' event in same transaction as ledger update; separate publisher reads outbox and pushes to Kafka\n\n30-40 min — SCALE & RELIABILITY:\n- Sharding ledger by account_id\n- Read replicas for customer-facing reads, writes go to primary\n- Reconciliation: nightly Spark job joins our ledger with processor's settlement file; alerts on mismatches\n- Webhook security: signature verification, replay protection via event_id dedup\n- PCI scope minimised: tokenisation vendor holds card data, we never see PAN\n\nINTERVIEW MOVE: spend 30 sec on idempotency upfront, before they ask. Most candidates skip it. Owning it shows seniority. This connects directly to my async Pack Service work (submit-poll-fetch with idempotency on the submit step).",
    "tags": [
      "Payments",
      "Idempotency",
      "Saga",
      "Outbox Pattern",
      "Double-Spend",
      "Optimistic Locking",
      "Webhooks",
      "PCI",
      "System Design"
    ]
  },
  {
    "id": "hld-saas-scaling",
    "categories": [
      "HLD"
    ],
    "primaryCategory": "HLD",
    "priority": "P1",
    "title": "Multi-Tenant SaaS, API Gateway & Distributed Cache",
    "keyTopics": [
      "Tenant isolation: shared DB vs separate schemas vs separate databases",
      "Realm-level routing — separate Snowflake accounts per realm",
      "API layer: routing requests to correct tenant data",
      "Authentication: OAuth M2M credentials per tenant",
      "Connection pooling: HikariCP with per-account pools, Caffeine-cached metadata",
      "Dynamic datasource creation: on-demand connections for new tenants",
      "Sharding strategy: deciding which tenants share infrastructure",
      "Noisy neighbor problem and solutions",
      "Tenant onboarding automation: service registration, master data import",
      "Cost allocation and monitoring per tenant",
      "YOUR EXPERIENCE: Azure APIM to Gravitee migration",
      "Routing: path-based, header-based, version-based",
      "Authentication: OAuth 2.0, API keys, M2M tokens (your Gravitee work)",
      "Dual-gateway pattern: gateway-aware token generation, UserInfo enrichment, thread-local context",
      "Rate limiting, throttling, circuit breaking",
      "Plugin architecture: auth, transform, logging as plugins",
      "Migration strategy: dual-stack support (your design!)",
      "Monitoring: per-API metrics, error tracking",
      "Cache strategies: cache-aside, write-through, write-behind",
      "Redis cluster: sharding, replication, failover",
      "Cache invalidation: TTL, event-based, manual",
      "Consistency: eventual vs strong consistency tradeoffs",
      "Hot key handling, thundering herd prevention",
      "Cache stampede: locking around expensive computation",
      "Monitoring: hit rate, memory usage, eviction rate",
      "Multi-tier caching: L1 (in-process) + L2 (Redis) + L3 (DB)"
    ],
    "prompt": "════════════════════ Design a Multi-Tenant SaaS Platform ════════════════════\n\nDesign a Multi-Tenant SaaS Platform. This is my strongest HLD — I built one at Blue Yonder (1200+ tenants).\n\nPractice structure (35 minutes):\nMinutes 0-5: Clarify requirements\n- How many tenants? (start with 1000+)\n- Data isolation requirements? (strict — no cross-tenant data leaks)\n- Tenant sizes vary? (yes — some tenants have 100x more data)\n- Multi-region? (yes — tenants in different geographies)\n\nMinutes 5-15: High-level architecture\n- Tenant isolation: shared DB with tenant_id column vs separate schemas vs separate databases\n- My actual approach: realm-level routing — separate Snowflake accounts per realm\n- API layer: how requests are routed to correct tenant data\n- Authentication: OAuth M2M credentials per tenant\n- Configuration management: per-tenant feature flags, settings\n\nMinutes 15-25: Deep dive components\n- Connection pooling: HikariCP with per-account pools, Caffeine-cached metadata\n- Dynamic datasource creation: creating connections on-demand for new tenants\n- Sharding strategy: how to decide which tenants share infrastructure\n- Feature flags: gradual rollout of new features per tenant\n- Data migration: cross-realm config migration tooling\n\nMinutes 25-35: Scale, monitoring, tradeoffs\n- Monitoring per tenant: query latency, resource usage, error rates\n- Noisy neighbor problem: one tenant consuming disproportionate resources\n- Tenant onboarding automation: service registration, master data import\n- Cost allocation per tenant\n- Tradeoffs: isolation vs operational complexity vs cost\n\n\n════════════════════ Design an API Gateway ════════════════════\n\nDesign an API Gateway.\nYOUR EXPERIENCE: Azure APIM to Gravitee migration — this is YOUR work.\nCover:\n- Routing: path-based, header-based, version-based\n- Authentication: OAuth 2.0, API keys, M2M tokens (YOUR Gravitee work)\n- Your dual-gateway pattern: backward compatibility across providers\n  → Gateway-aware token generation\n  → UserInfo enrichment filter\n  → Thread-local context propagation\n- Rate limiting, throttling, circuit breaking\n- Monitoring: per-API metrics, error tracking\n- Plugin architecture: auth, transform, logging as plugins\n- Migration strategy: dual-stack support (your design!)\nThis is YOUR work — should be a confident, detailed answer.\n\n\n════════════════════ Design a Distributed Cache ════════════════════\n\nDesign a distributed cache system.\nCover:\n- Cache strategies: cache-aside, write-through, write-behind — when each\n- Redis cluster: sharding, replication, failover\n- Cache invalidation: TTL, event-based, manual — tradeoffs\n- Consistency: eventual vs strong, how to choose\n- Hot key handling: what happens when one key gets millions of requests\n- Thundering herd prevention: cache stampede problem and solutions (locking around expensive computation)\n- Monitoring: hit rate, memory usage, eviction rate\n- Multi-tier caching: L1 (in-process Caffeine) + L2 (Redis) + L3 (DB) — your Blue Yonder pattern\nRelate to your HikariCP + Caffeine metadata caching at Blue Yonder.",
    "tags": [
      "Multi-tenancy",
      "SaaS",
      "Snowflake",
      "Blue Yonder",
      "HikariCP",
      "API Gateway",
      "Gravitee",
      "OAuth",
      "Rate Limiting",
      "Distributed Cache",
      "Redis",
      "Cache Invalidation"
    ]
  },
  {
    "id": "hld-messaging",
    "categories": [
      "HLD"
    ],
    "primaryCategory": "HLD",
    "priority": "P1",
    "title": "Notifications at Scale & Async Job Processing",
    "keyTopics": [
      "10M notifications/day via email, SMS, push, in-app",
      "Message queue: Kafka/SQS for decoupling and buffering",
      "Worker pools: separate per channel (email worker, SMS worker, etc.)",
      "Template engine: render message from template + variables",
      "User preference service: check before sending",
      "Priority routing: separate queues for urgent vs normal",
      "Batching: aggregate low-priority notifications (daily digest)",
      "Rate limiting per user per channel",
      "Retry strategy per channel: email 3 retries, SMS 2 retries",
      "Delivery tracker: update status per notification (sent/delivered/read/failed)",
      "Job queue: submit → poll → fetch pattern (Blue Yonder Pack Service design)",
      "Priority queues, job scheduling, retries with exponential backoff",
      "Worker pool management, auto-scaling based on queue depth",
      "Dead letter queue: permanently failed jobs",
      "Idempotency: handling duplicate job submissions",
      "Feature flags: sync/async routing (your feature-flag-gated pattern)",
      "Monitoring: job status, failure rates, processing times",
      "Timeout handling: job runs too long"
    ],
    "prompt": "════════════════════ Design a Notification System at Scale ════════════════════\n\nDesign a Notification System at scale.\n\nRequirements:\n- Send notifications via email, SMS, push, in-app\n- 10M notifications/day\n- User preferences: opt-in/out per channel\n- Template-based messages\n- Priority: urgent notifications bypass batching\n- Delivery tracking: sent, delivered, read, failed\n- Rate limiting: don't spam users\n\nStructure (35 min):\nMinutes 0-5: Clarify scope and requirements\n\nMinutes 5-15: Architecture\n- API: notification request → validation → queue\n- Message queue: Kafka/SQS for decoupling and buffering\n- Worker pools: separate per channel (email worker, SMS worker, etc.)\n- Template engine: render message from template + variables\n- User preference service: check before sending\n- Delivery tracker: update status per notification\n\nMinutes 15-25: Deep dive\n- Priority routing: separate queues for urgent vs normal\n- Batching: aggregate low-priority notifications (daily digest)\n- Rate limiting per user per channel\n- Retry strategy per channel: email 3 retries, SMS 2 retries\n- Template management: versioning, A/B testing\n- Deduplication: prevent double-sending\n\nMinutes 25-35: Scale\n- Horizontal scaling: add workers per channel independently\n- Database: notification log (time-series optimized)\n- Monitoring: delivery rate, bounce rate, latency per channel\n- Cost optimization: batch SMS to reduce per-message cost\n- International: timezone-aware delivery, country-specific SMS providers\n\n\n════════════════════ Design an Async Job Processing System ════════════════════\n\nDesign an Async Job Processing System.\nYOUR EXPERIENCE: Pack Service async integration pattern at Blue Yonder.\nCover:\n- Job queue: submit → poll → fetch pattern (YOUR design at Blue Yonder)\n- Priority queues, job scheduling, retries with backoff\n- Worker pool management, auto-scaling based on queue depth\n- Monitoring: job status, failure rates, processing times\n- Feature flags: sync/async routing (YOUR feature-flag-gated pattern)\n- Dead letter queue: permanently failed jobs\n- Idempotency: how to handle duplicate submissions\n- Result storage: where do completed results go?\n- Timeout handling: job runs too long\nThis should be one of your strongest HLD answers — you built this.",
    "tags": [
      "Notification System",
      "Kafka",
      "Push Notifications",
      "SMS",
      "Scale",
      "Async Processing",
      "Job Queue",
      "Blue Yonder",
      "Pack Service",
      "System Design"
    ]
  },
  {
    "id": "hld-url-shortener",
    "categories": [
      "HLD"
    ],
    "primaryCategory": "HLD",
    "priority": "P1",
    "title": "URL Shortener with Analytics",
    "keyTopics": [
      "100M URLs/month ≈ 40 writes/sec; 10B redirects/month ≈ 4000 reads/sec",
      "Read-heavy: 100:1 read/write ratio",
      "Short code generation: base62 encoding, counter-based vs hash-based",
      "Collision handling: check existence, retry with different code",
      "Caching: Redis/Memcached for hot URLs (vast majority of redirects hit cache)",
      "Analytics pipeline: Kafka → aggregation → time-series DB",
      "Database partitioning: range-based on short code",
      "301 vs 302 redirect: caching implications",
      "Custom aliases: user-chosen short codes",
      "Expired URLs: TTL, cleanup job",
      "Hash generation: Base62 encoding, collision handling",
      "Read-heavy: caching strategy (CDN → Redis → app cache → DB)",
      "Analytics: click tracking, time-series aggregation",
      "Scale: millions of URLs, billions of redirects",
      "Expiration: TTL-based cleanup",
      "Custom aliases: vanity URLs",
      "Rate limiting: prevent abuse",
      "Geographic redirects: routing based on user location"
    ],
    "prompt": "════════════════════ Design a URL Shortener with Analytics ════════════════════\n\nDesign a URL Shortener with Analytics.\n\nRequirements:\n- Shorten long URLs to short codes (7-8 chars)\n- Redirect short URL to original\n- Track clicks: count, location, device, referrer\n- Analytics dashboard: views over time, top URLs\n- High throughput: 100M URLs created/month, 10B redirects/month\n- 99.99% availability for redirects\n\nStructure (35 min):\nMinutes 0-5: Clarify, back-of-envelope calculations\n- 100M URLs/month ≈ 40 URLs/sec (write)\n- 10B redirects/month ≈ 4000 redirects/sec (read)\n- Read-heavy: 100:1 read/write ratio\n\nMinutes 5-15: Architecture\n- URL creation: API → generate short code → store mapping → return\n- Redirect: short code → cache lookup → DB lookup → 301/302 redirect\n- Analytics: click event → message queue → analytics processor\n- Short code generation: base62 encoding, counter-based vs hash-based\n\nMinutes 15-25: Deep dive\n- Collision handling: check existence, retry with different code\n- Caching: Redis/Memcached for hot URLs\n- Database: key-value store or wide-column (DynamoDB, Cassandra)\n- Analytics pipeline: Kafka → aggregation → time-series DB\n- Custom aliases: user-chosen short codes\n\nMinutes 25-35: Scale, reliability\n- Database partitioning: range-based on short code\n- Cache invalidation: TTL-based, URL updates are rare\n- Analytics eventual consistency: clicks processed async\n- Monitoring: redirect latency P99, cache hit ratio\n- Expired URLs: TTL, cleanup job\n\n\n════════════════════ Design a URL Shortener with Analytics ════════════════════\n\nDesign a URL shortener with analytics.\nCover:\n- Hash generation: Base62, collision handling\n- Read-heavy: caching strategy (CDN → Redis → app cache → DB)\n- Analytics: click tracking, time-series aggregation\n- Scale: millions of URLs, billions of redirects\n- Expiration: TTL-based cleanup\n- Custom aliases: vanity URLs\n- Rate limiting: prevent abuse\n- Geographic redirects: routing based on user location\nThis is asked frequently. Practice the full structured 35-minute walkthrough.",
    "tags": [
      "URL Shortener",
      "Redis",
      "Kafka",
      "Analytics",
      "System Design",
      "Base62",
      "Caching"
    ]
  },
  {
    "id": "hld-content-delivery",
    "categories": [
      "HLD"
    ],
    "primaryCategory": "HLD",
    "priority": "P1",
    "title": "Design YouTube / Dropbox (Media + File Sync)",
    "keyTopics": [
      "YouTube scale: 500h video uploaded/min, 1B+ hours watched/day",
      "Upload flow: resumable upload (chunked), metadata stored, raw video → encoding pipeline",
      "Encoding pipeline: ffmpeg workers transcode to multiple resolutions/codecs (240p..4K, H.264/VP9/AV1)",
      "HLS / DASH: video split into 2-10s segments, manifest file lists segments and bitrates",
      "Adaptive bitrate: client switches quality based on network conditions",
      "Storage: master copy in object store (S3), transcoded variants in cheaper tier",
      "CDN: video segments cached at edge POPs near viewers — the actual scale trick",
      "Thumbnail generation: extract frames during encoding, store in object store",
      "Video metadata: title, description, owner, timestamps in sharded SQL or document store",
      "View counts: async write — Kafka stream → aggregated in batch (don't update DB per view)",
      "Recommendations: separate ML pipeline, not in critical path",
      "Dropbox scale: file sync across devices, conflict resolution, dedup",
      "Chunking: split files into 4MB blocks; hash each block (SHA-256)",
      "Block-level dedup: if hash exists, store one copy, reference from multiple files",
      "Sync algorithm: client computes block hashes, server returns which to upload (only changed blocks)",
      "Metadata service: file tree, version history, permissions — strongly consistent",
      "Block service: content-addressed by hash, eventually consistent",
      "Conflict resolution: last-writer-wins, OR keep both with rename, OR vector-clock-based merge",
      "Notification of changes: long-poll or websocket to peer devices",
      "Versioning: keep N old versions of each file; older = colder storage"
    ],
    "prompt": "════════════════════ Design YouTube / Video Streaming ════════════════════\n\nRequirements:\n- Upload, store, and stream video at YouTube scale\n- Multiple resolutions (240p–4K), adaptive bitrate streaming\n- Global audience, low buffering tolerance\n\nStructure (35 min):\n0-5 min — CLARIFY: video size limits, formats, live streaming or VOD only (VOD), monetisation (out of scope)\n5-15 min — UPLOAD & ENCODING:\n- Upload service: chunked, resumable upload (PUT to S3 multipart). Raw video goes to ingest bucket.\n- Encoding pipeline: SQS notifies worker pool; ffmpeg workers transcode to all resolution variants in parallel; output to processed bucket\n- HLS/DASH: each variant split into 2-10s segments; master manifest + per-bitrate manifests\n- Metadata service writes: status=processing → done, available resolutions, duration, thumbnails\n15-25 min — STREAMING:\n- Client requests manifest from origin (or CDN edge if cached)\n- Client picks initial bitrate, starts requesting segments\n- Each segment is a cacheable HTTP object (1-10MB) → CDN absorbs almost all traffic\n- CDN cache hit rate >95% — this is what makes the economics work\n- Adaptive bitrate: client measures throughput, switches manifests mid-stream\n25-35 min — SCALE & RELIABILITY:\n- Storage tiering: hot variants in standard S3, cold (rarely watched) in Glacier\n- View counts: client sends 'watch' event → Kafka → Flink aggregates → batch update to DB (NOT row-per-view to SQL)\n- Multi-region: encoding regional, storage replicated to nearest CDN, viewers always hit nearest edge\n- Failure: failed encoding job → DLQ + alert; partial upload → resumable upload protocol handles\n\n\n════════════════════ Design Dropbox / File Sync ════════════════════\n\nRequirements:\n- Sync files across user's devices\n- Handle concurrent edits, conflicts\n- Dedup at block level to save storage\n- Version history\n\nStructure (35 min):\n0-5 min — CLARIFY: file size limits, max devices per user, conflict policy, version retention\n5-15 min — ARCHITECTURE:\n- Two services with different consistency requirements:\n  - METADATA service (strongly consistent): file tree, names, permissions, version pointers — sharded SQL\n  - BLOCK service (eventually consistent): content-addressed object store, key = SHA-256 of block\n- Client agent on each device watches local filesystem, syncs through APIs\n15-25 min — SYNC ALGORITHM (the interview meat):\n- File divided into fixed-size blocks (4MB)\n- On change, client computes block hashes locally\n- Client sends list of (file_path, block_hashes) to metadata service\n- Server replies with which block hashes it does NOT have\n- Client uploads only missing blocks to block service\n- Server updates metadata, version++\n- Other devices long-poll metadata service for changes; on notification, pull only the changed blocks\n- BLOCK DEDUP: if any other user already uploaded a block with same hash, no upload needed — single-instance storage\n25-35 min — CONFLICTS & SCALE:\n- Two devices edit same file offline: on reconnect, both push new versions. Server detects via parent_version mismatch.\n- Strategy 1: keep both with rename ('file (conflict copy).docx') — Dropbox approach\n- Strategy 2: last-writer-wins with full history (Google Drive-ish)\n- Strategy 3: operational transforms (collaborative editors only — Google Docs)\n- Versioning: keep last N versions per file, older versions to cold storage\n- Scale: metadata sharded by user_id; blocks sharded by hash prefix; CDN for read-heavy public links",
    "tags": [
      "YouTube",
      "Video Streaming",
      "Dropbox",
      "File Sync",
      "CDN",
      "Adaptive Bitrate",
      "Block Dedup",
      "Content-Addressed Storage",
      "System Design"
    ]
  },
  {
    "id": "hld-ai-systems",
    "categories": [
      "HLD"
    ],
    "primaryCategory": "HLD",
    "priority": "P0",
    "title": "Designing AI/LLM Systems (RAG support, Text-to-SQL, Multi-Agent, Real-Time)",
    "keyTopics": [
      "Query router: classify intent → route to correct knowledge base",
      "Per-category RAG pipeline: separate vector stores vs unified with metadata",
      "Conversation manager: maintain context across multi-turn conversations",
      "Confidence scorer: determine when to escalate to human agent",
      "Semantic cache: cache responses for frequent questions",
      "Feedback loop: human corrections improve retrieval over time",
      "Quality metrics: resolution rate, escalation rate, CSAT correlation",
      "Multi-language: embed in original language vs translate-then-embed",
      "A/B testing different retrieval strategies",
      "Cost estimation: embedding costs, LLM costs per query",
      "Natural language → SQL generation with LLM + schema context",
      "Schema discovery: how the agent learns the DB schema",
      "Query validation layer: parse SQL, reject mutations, check table access",
      "SQL AST parsing to reject DELETE/UPDATE/DROP",
      "Result interpretation: LLM summarizes tabular results in natural language",
      "Conversation context: follow-up questions about same data",
      "Schema representation: fit large schemas into LLM context with table descriptions",
      "Few-shot examples: store common query patterns",
      "Guardrails: max rows, query timeout, banned tables",
      "Multi-tenant schema isolation and audit logging",
      "Architecture: supervisor → specialized reviewers (style, bug finder, security, performance)",
      "Code parsing: AST vs raw text, language-specific analysis",
      "Context: PR diff, full file, related files",
      "LLM selection: different models for different review types",
      "False positive reduction: confidence scoring, human feedback loop",
      "Integration: GitHub/GitLab webhooks, PR comments API",
      "Scaling: many PRs across multiple repositories",
      "Evaluation: precision/recall vs human reviewers",
      "Agent architecture: LangGraph with checkpointing",
      "State management: conversation, task, approval state",
      "HITL triggers: confidence threshold, action severity, user request",
      "Human interface: agent proposes action, human approves/modifies/rejects",
      "Handoff: clean transfer from agent to human with full context",
      "Resume: human resolves, hands back to agent",
      "SLA: response time guarantees (agent vs human mix)",
      "Scaling: queue management, load balancing"
    ],
    "prompt": "════════════════════ Design a RAG-Based Customer Support System ════════════════════\n\nDesign a customer support system powered by RAG for an e-commerce company.\n\nRequirements:\n- 10K support queries per day\n- 5 product categories, each with its own knowledge base\n- 50K support documents (FAQs, manuals, troubleshooting guides)\n- Multi-turn conversation support\n- Escalation to human agent when AI can't help\n- Quality monitoring and continuous improvement\n\nStructure (35 min):\nMinutes 0-5: Clarify\n- Response latency SLA? (< 3 seconds for first response)\n- Languages? (English initially, multilingual later)\n- Human agents available? (yes, 50 agents, 9am-9pm)\n\nMinutes 5-15: Architecture\n- Query router: classify intent → route to correct knowledge base\n- RAG pipeline per category: separate vector stores or unified with metadata?\n- Conversation manager: maintain context across multi-turn\n- Confidence scorer: determine when to escalate\n- Human handoff: seamless transition with context summary\n\nMinutes 15-25: Deep dive\n- Chunking strategy for different doc types (FAQ vs manual vs troubleshooting)\n- Hybrid search: keyword for product IDs/SKUs + semantic for natural language\n- Conversation memory: summary memory for long conversations\n- Caching layer: semantic cache for frequent questions\n- Feedback loop: human corrections retrain/improve retrieval\n\nMinutes 25-35: Scale & monitoring\n- Embedding pipeline: batch process new/updated documents\n- A/B testing different retrieval strategies\n- Quality metrics: resolution rate, escalation rate, CSAT correlation\n- Cost estimation: embedding costs, LLM costs per query\n- Multi-language: embed in original language vs translate-then-embed\n\n\n════════════════════ Design an AI-Powered SQL Query Assistant ════════════════════\n\nDesign a system where users ask questions in natural language and get SQL query results. (Very close to my RCA agent — must nail this.)\n\nRequirements:\n- Users ask \"why did allocation fail for store X yesterday?\"\n- System generates SQL, executes on PostgreSQL, interprets results\n- Must be safe: read-only, no destructive queries\n- Multi-tenant: different tenants have different schemas\n- Audit trail: log every query and result\n\nStructure (35 min):\nMinutes 0-5: Clarify\n- Database size? (100GB+, multiple tables)\n- Users: technical or non-technical? (both)\n- Latency SLA? (< 10 seconds for query + interpretation)\n- How many concurrent users? (50-100)\n\nMinutes 5-15: Architecture\n- Natural language → SQL generation (LLM with schema context)\n- Schema discovery: how does the agent learn the DB schema?\n- Query validation layer: parse SQL, reject mutations, check table access\n- Query execution: read-only connection, query timeout\n- Result interpretation: LLM summarizes tabular results in natural language\n- Conversation context: follow-up questions about same data\n\nMinutes 15-25: Deep dive\n- Schema representation: how to fit large schemas into LLM context\n- Few-shot examples: store common query patterns\n- SQL validation: AST parsing, whitelist of allowed operations\n- Error handling: invalid SQL → show error to LLM → retry with correction\n- Guardrails: max rows returned, query timeout, banned tables\n- Caching: cache repeated queries, cache schema metadata\n\nMinutes 25-35: Scale & safety\n- Multi-tenant schema isolation\n- Query cost estimation before execution\n- Audit logging: who queried what, when\n- Security: SQL injection prevention even from LLM-generated queries\n- Connection pooling: read replicas for query load\n\nTHIS IS YOUR RCA AGENT SYSTEM DESIGN. Practice until flawless.\n\n\n════════════════════ Design a Multi-Agent System for Code Review ════════════════════\n\nDesign a Multi-Agent System for automated code review.\nRequirements: Automated code review agent — style, bugs, security, performance.\nCover:\n- Architecture: supervisor → specialized reviewers\n- Specialized agents: style, bug finder, security scanner, performance\n- Code parsing: AST vs raw text, language-specific\n- Context: PR diff, full file, related files\n- LLM selection: different models for different review types\n- False positive reduction: confidence scoring, human feedback\n- Integration: GitHub/GitLab webhooks, PR comments\n- Scaling: many PRs across repos\n- Evaluation: precision/recall vs human reviewers\n\n\n════════════════════ Design a Real-Time AI Agent with HITL ════════════════════\n\nDesign a Real-Time AI Agent with Human-in-the-Loop (HITL).\nRequirements: Customer-facing AI agent handling complex requests with human escalation.\nCover:\n- Agent architecture: LangGraph with checkpointing\n- State management: conversation, task, approval state\n- HITL triggers: confidence threshold, action severity, user request\n- Human interface: agent proposes action, human approves/modifies\n- Handoff: clean transfer from agent to human with full context\n- Resume: human resolves, hands back to agent\n- SLA: response time guarantees (agent vs human mix)\n- Scaling: queue management, load balancing",
    "tags": [
      "RAG",
      "Customer Support",
      "Multi-turn",
      "Escalation",
      "Semantic Cache",
      "Text-to-SQL",
      "RCA Agent",
      "SQL Safety",
      "Multi-tenant",
      "LLM",
      "Multi-Agent",
      "Code Review"
    ]
  },
  {
    "id": "lld-oop-patterns",
    "categories": [
      "LLD"
    ],
    "primaryCategory": "LLD",
    "priority": "P0",
    "title": "SOLID & Design Patterns (Creational, Structural, Behavioral)",
    "keyTopics": [
      "SRP: each class one reason to change (separate priority calc from store assignment in allocation)",
      "OCP: open for extension, closed for modification (adding new allocation mode without modifying existing)",
      "LSP: subtypes substitutable for base types (Azure vs Gravitee auth providers behind same interface)",
      "ISP: clients shouldn't depend on unused methods (separate read and write repository interfaces)",
      "DIP: depend on abstractions, not concretions (service layer depends on repo interface, not PostgreSQL)",
      "Common interview follow-ups: SOLID violation + fix; when to intentionally violate; Spring DI and DIP",
      "Real code-level examples from Blue Yonder codebase",
      "Singleton: Bill Pugh, double-checked locking, enum — when to use, testing challenges",
      "Factory Method: creating objects without specifying class (notification types)",
      "Abstract Factory: family of related objects (UI components for different platforms)",
      "Builder: complex object construction (query objects, configuration)",
      "Adapter: making incompatible interfaces work (integrating new payment provider)",
      "Decorator: adding behavior without modifying class (logging, caching, retry)",
      "Composite: tree structures (file system, org chart)",
      "Facade: simplified interface to complex subsystem",
      "Strategy: interchangeable algorithms (allocation strategies, pricing models)",
      "Observer: event notification (stock updates, order status)",
      "State: behavior changes based on state (order processing, vending machine)",
      "Command: encapsulate request as object (undo/redo, task queuing, macro recording)",
      "Chain of Responsibility: pass request along chain (validation, log filtering, middleware)",
      "Template Method: algorithm skeleton, subclasses override (data processing pipelines)",
      "Iterator: traverse without exposing internals",
      "SOLID principles — how each pattern embodies SOLID"
    ],
    "prompt": "════════════════════ SOLID Principles with Real Examples ════════════════════\n\nDeep dive into SOLID principles with examples from my Blue Yonder codebase.\n- Single Responsibility: each class one reason to change\n  → Example: separate priority calculation from store assignment in allocation\n- Open/Closed: open for extension, closed for modification\n  → Example: adding new allocation mode without modifying existing\n- Liskov Substitution: subtypes substitutable for base types\n  → Example: different auth providers (Azure, Gravitee) behind same interface\n- Interface Segregation: clients shouldn't depend on unused methods\n  → Example: separate read and write repository interfaces\n- Dependency Inversion: depend on abstractions, not concretions\n  → Example: service layer depends on repo interface, not PostgreSQL impl\nCommon interview follow-ups:\n- \"Show me a SOLID violation and how you'd fix it\"\n- \"When would you intentionally violate a SOLID principle?\"\n- \"How does Spring DI relate to Dependency Inversion?\"\nPrepare with real code-level examples I can describe verbally.\n\n\n════════════════════ Design Patterns — Creational & Structural ════════════════════\n\nDeep dive into Creational and Structural design patterns with Java implementations.\nCREATIONAL:\n- Singleton: thread-safe (Bill Pugh, double-checked locking, enum)\n  → When to use, when to avoid, testing challenges\n- Factory Method: creating objects without specifying class\n  → Use case: different notification types\n- Abstract Factory: family of related objects\n  → Use case: UI components for different platforms\n- Builder: complex object construction step by step\n  → Use case: building query objects, configuration\nSTRUCTURAL:\n- Adapter: making incompatible interfaces work together\n  → Use case: integrating new payment provider\n- Decorator: adding behavior without modifying class\n  → Use case: logging, caching, retry decorators for service calls\n- Composite: tree structures (file system, org chart)\n- Facade: simplified interface to complex subsystem\nFor each: when to use, Java code, example from my Blue Yonder experience. Interview-ready explanations.\n\n\n════════════════════ Design Patterns — Behavioral ════════════════════\n\nDeep dive into Behavioral design patterns with Java implementations.\nBEHAVIORAL:\n- Strategy: interchangeable algorithms\n  → Use case: allocation strategies, pricing models, sorting\n- Observer: event notification\n  → Use case: stock updates, order status\n- State: behavior changes based on state\n  → Use case: order processing, vending machine, game states\n- Command: encapsulate request as object\n  → Use case: undo/redo, task queuing, macro recording\n- Chain of Responsibility: pass request along chain\n  → Use case: validation, log filtering, middleware\n- Template Method: algorithm skeleton, subclasses override\n  → Use case: data processing pipelines\n- Iterator: traverse without exposing internals\nFor each: when to use, Java code, when I've used it at Blue Yonder.\nSOLID principles — how each pattern embodies SOLID.",
    "tags": [
      "SOLID",
      "OOP Design",
      "Blue Yonder",
      "Spring DI",
      "Java",
      "Design Patterns",
      "Creational Patterns",
      "Structural Patterns",
      "OOP",
      "Behavioral Patterns",
      "Strategy",
      "Observer"
    ]
  },
  {
    "id": "lld-caching-pools",
    "categories": [
      "LLD"
    ],
    "primaryCategory": "LLD",
    "priority": "P0",
    "title": "Caching, Rate Limiting & Connection Pools",
    "keyTopics": [
      "get(key): O(1) — return value and mark as recently used",
      "put(key, value): O(1) — insert/update, evict LRU if at capacity",
      "HashMap<K, Node> for O(1) lookup",
      "Doubly Linked List for O(1) insertion/removal (MRU at head, LRU at tail)",
      "Interface: Cache<K,V> with get, put, size, clear",
      "Thread-safe with ReentrantReadWriteLock",
      "TTL (time-to-live) per entry extension",
      "LFU variant: frequency counter vs recency",
      "Java's LinkedHashMap with accessOrder=true",
      "Caffeine cache internals and real-world usage",
      "Fixed Window Counter: divide time into windows, burst problem at boundary",
      "Sliding Window Log: store timestamps, accurate but memory-intensive",
      "Token Bucket: bucket with max capacity, refills at constant rate, allows bursts",
      "Token bucket is used by AWS, Stripe",
      "Strategy pattern: swap algorithms without changing client code",
      "Interface: RateLimiter with isAllowed(clientId) method",
      "Decorator: add rate limiting to any service transparently",
      "ConcurrentHashMap for per-client state, AtomicInteger for thread-safe counters",
      "ScheduledExecutorService for token bucket refill",
      "Distributed rate limiting: Redis-based approach",
      "Pool interface: getConnection(), releaseConnection()",
      "Pool management: min/max connections, idle timeout",
      "Blocking vs non-blocking when pool exhausted",
      "Health checking: validate connections before giving out",
      "Thread safety: concurrent access with Semaphore",
      "Monitoring: active connections, wait time, timeouts",
      "Connection lifecycle: create, validate, use, return, close",
      "This is what HikariCP does — relates to your Blue Yonder work"
    ],
    "prompt": "════════════════════ Design an LRU Cache ════════════════════\n\nImplement an LRU (Least Recently Used) Cache in Java.\n\nRequirements:\n- get(key): return value if exists, mark as recently used. O(1)\n- put(key, value): insert/update, evict least recently used if at capacity. O(1)\n- Thread-safe version\n\nImplementation approach:\n- HashMap<K, Node<K,V>> for O(1) lookup\n- Doubly Linked List for O(1) insertion/removal (most recent at head, evict from tail)\n- Node class with key, value, prev, next pointers\n\nDesign with proper OOP:\n- Interface: Cache<K,V> with get, put, size, clear methods\n- Class: LRUCache<K,V> implements Cache<K,V>\n- Inner class: Node<K,V>\n- Consider: factory pattern for creating different cache types\n\nExtend:\n- Thread-safe with ReentrantReadWriteLock\n- Add TTL (time-to-live) per entry\n- LFU variant: what changes? (frequency counter instead of recency)\n- Java's LinkedHashMap — how it implements LRU internally (accessOrder=true)\n\nDiscuss:\n- When LRU vs LFU vs TTL-based?\n- Real-world: Caffeine cache (used in your Snowflake sharding) — how does it work?\n- Spring @Cacheable — how Spring's cache abstraction works under the hood\n\n\n════════════════════ Design a Rate Limiter ════════════════════\n\nImplement a Rate Limiter in Java.\n\nRequirements:\n- Support multiple algorithms: Fixed Window, Sliding Window, Token Bucket\n- Configurable: requests per second/minute/hour per client\n- Thread-safe\n- Return remaining quota in response\n\nAlgorithms to implement:\n1. Fixed Window Counter:\n   - Divide time into fixed windows (e.g., 1-minute windows)\n   - Count requests per window, reject if exceeds limit\n   - Problem: burst at window boundary (2x burst possible)\n2. Sliding Window Log:\n   - Store timestamp of each request\n   - Count requests in past N seconds\n   - Accurate but memory-intensive\n3. Token Bucket:\n   - Bucket with max capacity, refills at constant rate\n   - Each request consumes a token\n   - Allows controlled bursts\n   - Used by AWS, Stripe\n\nDesign patterns:\n- Strategy pattern: swap algorithms without changing client code\n- Interface: RateLimiter with isAllowed(clientId) method\n- Decorator: add rate limiting to any service transparently\n- Builder: configure rate limiter with fluent API\n\nJava specifics:\n- ConcurrentHashMap for per-client state\n- AtomicInteger / AtomicLong for thread-safe counters\n- ScheduledExecutorService for token bucket refill\n\nDiscuss:\n- Distributed rate limiting: Redis-based approach\n- Spring Boot integration: HandlerInterceptor or Filter\n- How API gateways (Gravitee, Kong) implement rate limiting\n\n\n════════════════════ Design a Database Connection Pool ════════════════════\n\nDesign a database connection pool — directly relevant to Blue Yonder (HikariCP, Caffeine).\nCover:\n- Pool interface: getConnection(), releaseConnection()\n- Pool management: min/max connections, idle timeout\n- Blocking vs non-blocking when pool exhausted\n- Health checking: validate connections before giving out\n- Thread safety: concurrent access\n- Monitoring: active connections, wait time, timeouts\n- Configuration: pool size, timeout, validation query\n- Semaphore-based implementation\n- Connection lifecycle: create, validate, use, return, close\nThis is what HikariCP does. Knowing it deeply impresses interviewers.",
    "tags": [
      "LRU Cache",
      "LinkedList",
      "HashMap",
      "Thread Safety",
      "Java",
      "Rate Limiting",
      "Token Bucket",
      "Strategy Pattern",
      "Distributed Systems",
      "Connection Pool",
      "HikariCP",
      "Blue Yonder"
    ]
  },
  {
    "id": "lld-concurrency",
    "categories": [
      "LLD"
    ],
    "primaryCategory": "LLD",
    "priority": "P1",
    "title": "Concurrency Patterns in Java",
    "keyTopics": [
      "Producer-Consumer: BlockingQueue, wait/notify",
      "Reader-Writer Lock: ReentrantReadWriteLock",
      "Thread Pool: ExecutorService, ThreadPoolExecutor (core pool, max pool, queue type, rejection policy)",
      "Future/CompletableFuture: async, chaining, exception handling (my DeepDocAI!)",
      "Semaphore: limiting concurrent access (connection pool, rate limiting)",
      "CountDownLatch vs CyclicBarrier: coordination",
      "volatile vs synchronized vs Atomic: when to use each",
      "ThreadLocal: per-thread storage (my Gravitee thread-local propagation!)"
    ],
    "prompt": "LLD focused on Java concurrency (heavily asked in Java interviews).\nPATTERNS:\n- Producer-Consumer: BlockingQueue, wait/notify\n- Reader-Writer Lock: ReentrantReadWriteLock\n- Thread Pool: ExecutorService, ThreadPoolExecutor configuration\n  → Core pool, max pool, queue type, rejection policy\n- Future/CompletableFuture: async, chaining, exception handling\n  → MY DeepDocAI uses this — explain the pattern\n- Semaphore: limiting concurrent access\n  → Use case: connection pool, rate limiting\n- CountDownLatch vs CyclicBarrier: coordination\n- volatile vs synchronized vs Atomic: when to use each\n- ThreadLocal: per-thread storage (MY Gravitee thread-local propagation!)\nCONCURRENCY ISSUES:\n- Race conditions, deadlock, livelock, starvation\n- Visibility issues, instruction reordering\n- How to debug concurrency bugs\nFor each pattern: code example, use case from my Blue Yonder experience, common interview questions.",
    "tags": [
      "Java Concurrency",
      "CompletableFuture",
      "ThreadLocal",
      "Thread Pool",
      "Blue Yonder"
    ]
  },
  {
    "id": "lld-messaging-logging",
    "categories": [
      "LLD"
    ],
    "primaryCategory": "LLD",
    "priority": "P1",
    "title": "Notifications, Pub/Sub & Logging Framework",
    "keyTopics": [
      "Support channels: EMAIL, SMS, PUSH, IN_APP",
      "Priority levels: URGENT, HIGH, NORMAL, LOW",
      "Template-based messages with variable substitution",
      "Retry failed notifications with exponential backoff",
      "User preferences: which channels are enabled",
      "Rate limiting: don't spam users",
      "Strategy pattern: different send strategies per channel",
      "Chain of Responsibility: validation → rate check → template → send",
      "CompletableFuture for async sending across channels",
      "How to make this multi-tenant",
      "Notification types: email, SMS, push, in-app",
      "Strategy pattern: different delivery mechanisms per channel",
      "Observer pattern: subscribers to notification events",
      "Builder pattern: constructing notifications with templates",
      "Template pattern: notification templates with variable substitution",
      "Priority queue: urgent vs normal notifications",
      "Retry with backoff for failed delivery",
      "Idempotency: prevent duplicate sends",
      "Topics: named channels; publishers send, subscribers receive",
      "Multiple subscribers per topic with message ordering guarantee",
      "At-least-once delivery and dead letter queue for failed messages",
      "Observer pattern is core pub/sub",
      "Mediator: MessageBroker mediates between publishers and subscribers",
      "Strategy: different delivery strategies (push vs pull)",
      "BlockingQueue per topic for message buffering",
      "CopyOnWriteArrayList for subscriber list (safe concurrent iteration)",
      "WeakReference for subscriber to prevent memory leaks",
      "Consumer groups: only one subscriber in a group gets each message",
      "Log levels: TRACE, DEBUG, INFO, WARN, ERROR, FATAL with severity ordering",
      "Multiple output destinations: Console, File, Database",
      "Log formatting: timestamp, level, class name, message",
      "Singleton logger instance with double-checked locking",
      "Strategy: different formatters (SimpleFormatter, JSONFormatter)",
      "Observer: multiple appenders receive log events",
      "Chain of Responsibility: filter chain before logging",
      "ConcurrentLinkedQueue for async logging",
      "ThreadLocal for context propagation (MDC pattern like SLF4J)",
      "Async logging: separate writer thread, bounded queue, log rotation"
    ],
    "prompt": "════════════════════ Design a Notification System ════════════════════\n\nImplement a Notification System in Java.\n\nRequirements:\n- Support multiple channels: EMAIL, SMS, PUSH, IN_APP\n- Priority levels: URGENT, HIGH, NORMAL, LOW\n- Template-based messages with variable substitution\n- Retry failed notifications with exponential backoff\n- User preferences: which channels they've enabled\n- Rate limiting: don't spam users\n\nDesign patterns:\n- Strategy pattern: different send strategies per channel\n- Observer pattern: subscribe to notification events\n- Template Method: base notification flow with channel-specific steps\n- Builder: construct notification with fluent API\n- Chain of Responsibility: validation → rate check → template → send\n\nKey classes:\n- Notification, NotificationChannel (interface)\n- EmailChannel, SMSChannel, PushChannel, InAppChannel\n- NotificationTemplate, TemplateEngine\n- UserPreferences, NotificationService\n- RetryHandler with exponential backoff\n\nJava specifics:\n- CompletableFuture for async sending across channels\n- @Async with Spring's TaskExecutor\n- Priority queue for processing order\n- Scheduled retry with ScheduledExecutorService\n\nConnect to your experience:\n- How does this relate to async patterns you built (Pack Service)?\n- Where would you use feature flags?\n- How would you make this multi-tenant?\n\n\n════════════════════ Design a Notification Service ════════════════════\n\nDesign a notification service at code level.\n- Notification types: email, SMS, push, in-app\n- Strategy pattern: different delivery mechanisms\n- Observer pattern: subscribers to notification events\n- Builder pattern: constructing notifications\n- Template pattern: notification templates with variables\n- Priority queue: urgent vs normal\n- Retry: failed delivery with backoff\n- Idempotency: don't send duplicates\n- Java implementation with clean separation\n\n\n════════════════════ Design a Pub/Sub Messaging System ════════════════════\n\nImplement a Publish-Subscribe Messaging System in Java.\n\nRequirements:\n- Topics: named channels for messages\n- Publishers: send messages to topics\n- Subscribers: receive messages from topics they subscribed to\n- Multiple subscribers per topic\n- Message ordering guarantee per topic\n- At-least-once delivery\n- Dead letter queue for failed messages\n\nKey classes:\n- MessageBroker (singleton, manages topics and routing)\n- Topic (holds subscriber list, message queue)\n- Publisher, Subscriber (interfaces)\n- Message (id, topic, payload, timestamp, headers)\n- Subscription (subscriber + filter criteria)\n- DeadLetterQueue (failed messages)\n\nPatterns:\n- Observer: core pub/sub pattern\n- Mediator: MessageBroker mediates between publishers and subscribers\n- Strategy: different delivery strategies (push vs pull)\n\nJava specifics:\n- BlockingQueue per topic for message buffering\n- ExecutorService for async message delivery\n- CopyOnWriteArrayList for subscriber list (safe concurrent iteration)\n- CompletableFuture for delivery acknowledgment\n- WeakReference for subscriber to prevent memory leaks\n\nAdvanced:\n- Consumer groups: only one subscriber in a group gets each message\n- Message filtering: subscriber receives only matching messages\n- Backpressure: slow consumer doesn't block fast publishers\n- How Kafka implements this at scale — partitions, consumer groups, offsets\n\n\n════════════════════ Design a Logger / Logging Framework ════════════════════\n\nImplement a Logging Framework in Java (like Log4j simplified).\n\nRequirements:\n- Multiple log levels: TRACE, DEBUG, INFO, WARN, ERROR, FATAL\n- Multiple output destinations: Console, File, Database\n- Configurable log level threshold per destination\n- Log formatting: timestamp, level, class name, message\n- Thread-safe\n- Singleton logger instance\n- Support for structured logging (key-value pairs)\n\nDesign patterns:\n- Singleton: Logger instance\n- Strategy: different formatters (SimpleFormatter, JSONFormatter)\n- Observer: multiple appenders receive log events\n- Builder: configure logger with fluent API\n- Chain of Responsibility: filter chain before logging\n\nKey classes:\n- Logger (singleton with static factory)\n- LogLevel enum with severity ordering\n- LogEvent (timestamp, level, source, message, context map)\n- Appender (interface): ConsoleAppender, FileAppender, DatabaseAppender\n- Formatter (interface): SimpleFormatter, JSONFormatter, PatternFormatter\n\nJava specifics:\n- Volatile singleton with double-checked locking\n- ConcurrentLinkedQueue for async logging\n- ReentrantReadWriteLock for file appender\n- ThreadLocal for context propagation (MDC pattern like SLF4J)\n\nDiscuss:\n- How SLF4J + Logback work under the hood\n- MDC (Mapped Diagnostic Context) — for request tracing in Spring Boot\n- Async logging: why and how (separate writer thread, bounded queue)\n- Log rotation: size-based and time-based",
    "tags": [
      "Notification System",
      "Strategy Pattern",
      "Async",
      "CompletableFuture",
      "Java",
      "Notification Service",
      "Observer Pattern",
      "Builder Pattern",
      "Pub/Sub",
      "Kafka",
      "Messaging",
      "Logger"
    ]
  },
  {
    "id": "lld-schedulers",
    "categories": [
      "LLD"
    ],
    "primaryCategory": "LLD",
    "priority": "P1",
    "title": "Schedulers, Workflow Engine & Feature Flags",
    "keyTopics": [
      "Schedule one-time tasks at a specific time",
      "Recurring tasks: every N seconds/minutes/hours",
      "Cron-like expressions support",
      "Execute tasks with thread pool",
      "Handle task failures with retry",
      "Cancel/pause/resume tasks",
      "Priority-based execution",
      "Command pattern: Task as a command",
      "PriorityBlockingQueue ordered by nextExecutionTime",
      "Spring @Scheduled annotation internals",
      "Task interface: execute(), id, priority",
      "Scheduling types: one-time, cron expression, delayed",
      "Priority queue (min-heap by next execution time)",
      "Thread pool: concurrent task execution with ScheduledExecutorService",
      "Retry: failed tasks with exponential backoff",
      "Task dependencies: task A must complete before B (DAG)",
      "State pattern: pending → running → completed/failed",
      "Observer pattern: task completion notifications",
      "Distributed version: Quartz, distributed scheduling at scale",
      "Workflow: sequence of steps with conditional branching",
      "Step: unit of work (like a LangGraph node)",
      "Transition: connection between steps (like edges)",
      "WorkflowExecution: tracks progress and current state",
      "Composite pattern: sub-workflows as steps",
      "Observer: step completion events",
      "State: step states (pending, running, completed, failed)",
      "Persistence: save/resume workflow — parallel execution and retry per step",
      "Flag types: boolean, percentage rollout, user-segment based",
      "Evaluation: check if feature enabled for given context (user, tenant, realm)",
      "Strategy pattern: different evaluation strategies per flag type",
      "Caching: flag values cached with invalidation on update",
      "Audit: who changed what flag and when",
      "Gradual rollout: 1% → 10% → 50% → 100%",
      "Kill switch: instant disable",
      "Your real usage at Blue Yonder: Pack Service feature flag, Snowflake sharding feature flag"
    ],
    "prompt": "════════════════════ Design a Task / Job Scheduler ════════════════════\n\nImplement a Task Scheduler in Java.\n\nRequirements:\n- Schedule one-time tasks at a specific time\n- Schedule recurring tasks (every N seconds/minutes/hours)\n- Support cron-like expressions\n- Execute tasks with thread pool\n- Handle task failures with retry\n- Cancel/pause/resume tasks\n- Priority-based execution\n\nDesign:\n- Interface: Task with execute() method and getSchedule()\n- ScheduledTask: wraps Task with scheduling metadata\n- TaskScheduler: manages task lifecycle\n- Schedule types: OneTimeSchedule, RecurringSchedule, CronSchedule\n- ExecutionEngine: thread pool that runs tasks\n\nPatterns:\n- Command pattern: Task is a command\n- Strategy: different schedule types\n- Priority Queue: tasks ordered by next execution time\n- Observer: notify on task completion/failure\n\nJava specifics:\n- ScheduledExecutorService under the hood\n- PriorityBlockingQueue ordered by nextExecutionTime\n- ReentrantLock for task state transitions\n- CompletableFuture for async execution with callbacks\n- @Scheduled annotation in Spring — how it works internally\n\nConnect to your experience:\n- Batch automation framework at Blue Yonder — similar patterns\n- Your async Pack Service — poll-with-backoff is a scheduled pattern\n\n\n════════════════════ Design a Task Scheduler / Cron Job System ════════════════════\n\nDesign a task scheduler supporting one-time, recurring, and delayed tasks.\nCover:\n- Task interface: execute(), id, priority\n- Scheduling: one-time, cron expression, delayed\n- Priority queue (min-heap by next execution time)\n- Thread pool: concurrent task execution\n- Retry: failed tasks with exponential backoff\n- Dependencies: task A must complete before B (DAG)\n- Observer pattern: task completion notifications\n- State pattern: pending → running → completed/failed\n- Java implementation with ScheduledExecutorService\n- Distributed version (briefly): Quartz, distributed scheduling\nInterview follow-up: design at scale (millions of scheduled tasks)\n\n\n════════════════════ Design a Workflow Engine ════════════════════\n\nDesign a Workflow Engine — relevant to your agent work.\nENTITIES:\n- Workflow: sequence of steps with conditional branching\n- Step: unit of work (like a LangGraph node)\n- Transition: connection between steps (like edges)\n- Condition: determines which transition to follow\n- WorkflowExecution: tracks progress\nPATTERNS:\n- Composite: sub-workflows as steps\n- Observer: step completion events\n- State: step states (pending, running, completed, failed)\n- Strategy: condition evaluation strategies\n- Chain of Responsibility: error handling\nFEATURES:\n- Sequential steps, parallel execution, conditional branching\n- Retry and error handling per step\n- Persistence: save/resume workflow\nEssentially what LangGraph does — show you understand it at code level.\n\n\n════════════════════ Design a Feature Flag System ════════════════════\n\nDesign a feature flag system — directly from your Blue Yonder experience.\nCover:\n- Flag types: boolean, percentage rollout, user-segment based\n- Evaluation: check if feature enabled for given context (user, tenant, realm)\n- Strategy pattern: different evaluation strategies per flag type\n- Caching: flag values cached, invalidation on update\n- Audit: who changed what flag and when\n- Gradual rollout: 1% → 10% → 50% → 100%\n- Kill switch: instant disable\n- Java implementation with thread-safe evaluation\n- Configuration: targeting rules\nTalk about your real usage at Blue Yonder (Pack Service feature flag, Snowflake sharding feature flag).",
    "tags": [
      "Scheduler",
      "Command Pattern",
      "PriorityQueue",
      "Spring",
      "Java",
      "Task Scheduler",
      "Min-Heap",
      "Thread Pool",
      "OOP Design",
      "Workflow Engine",
      "LangGraph Design",
      "State Machine"
    ]
  },
  {
    "id": "lld-machines",
    "categories": [
      "LLD"
    ],
    "primaryCategory": "LLD",
    "priority": "P1",
    "title": "Stateful Machines: Parking Lot, Elevator, ATM, Vending",
    "keyTopics": [
      "Strategy pattern: different scheduling algorithms (SCAN, LOOK, shortest-seek-first)",
      "State pattern: elevator states (IDLE, MOVING_UP, MOVING_DOWN, DOOR_OPEN)",
      "Observer pattern: notify display when elevator state changes",
      "Singleton: ElevatorController",
      "Classes: Building, Elevator, Floor, ElevatorController, Request",
      "How SCAN algorithm works: go in one direction, serve all requests, then reverse",
      "Which elevator should serve a new request: optimization criteria",
      "Emergency mode: bring all elevators to ground floor",
      "Each elevator runs on its own thread with BlockingQueue",
      "Controller thread processes request queue",
      "State pattern: Idle → CardInserted → PINVerified → TransactionSelected → Dispensing",
      "Transactions: withdraw, deposit, check balance, transfer",
      "Chain of Responsibility: cash dispensing (₹500 → ₹200 → ₹100 → ₹50)",
      "Security: PIN validation, daily limits, card retention after 3 failures",
      "Concurrency: multiple ATMs accessing same account (distributed locking or optimistic)",
      "Observer pattern: bank notification on transactions",
      "Interview follow-up: design for nationwide ATM network with 10K ATMs",
      "States: IDLE, HAS_MONEY, DISPENSING, OUT_OF_STOCK",
      "State pattern is the CRITICAL primary pattern for this problem",
      "IdleState: only accepts money insertion",
      "HasMoneyState: accepts product selection or cancel (refund)",
      "DispensingState: dispenses product, returns change, transitions to IDLE",
      "Strategy: change-making algorithm (greedy coin change)",
      "Singleton: single VendingMachine instance",
      "EnumMap for coin inventory (efficient for enum keys)",
      "BigDecimal for money (NEVER float/double)",
      "Change-making: greedy vs DP approach, when greedy fails",
      "Spot types: COMPACT, REGULAR, LARGE; Vehicle types: MOTORCYCLE, CAR, TRUCK",
      "Park vehicle: find nearest available spot of correct type",
      "Unpark: free spot, calculate fee based on duration",
      "Strategy pattern: different pricing strategies (hourly, daily, weekend)",
      "Factory pattern: create different vehicle types",
      "Singleton: ParkingLot instance",
      "Observer: notify when floor is full / spot freed",
      "Classes: ParkingLot, Floor, ParkingSpot hierarchy, Vehicle hierarchy",
      "SOLID principles in every design decision",
      "Open-closed: easy to add new vehicle types without modifying existing code"
    ],
    "prompt": "════════════════════ Design an Elevator System ════════════════════\n\nImplement an Elevator System in Java.\n\nRequirements:\n- Building with N floors and M elevators\n- Handle up/down requests from any floor\n- Handle destination requests from inside elevator\n- Optimize for minimum wait time\n- Display current status of all elevators\n\nDesign patterns:\n- Strategy pattern: different scheduling algorithms (SCAN, LOOK, shortest-seek-first)\n- State pattern: elevator states (IDLE, MOVING_UP, MOVING_DOWN, DOOR_OPEN)\n- Observer pattern: notify display when elevator state changes\n- Singleton: ElevatorController\n\nKey classes:\n- Building, Elevator, Floor\n- ElevatorController (scheduling logic)\n- Request (source floor, direction, destination)\n- ElevatorSchedulingStrategy (interface)\n- SCANStrategy, LOOKStrategy (implementations)\n- Direction enum: UP, DOWN\n- ElevatorState enum: IDLE, MOVING_UP, MOVING_DOWN, DOOR_OPEN\n\nThreading:\n- Each elevator runs on its own thread\n- Controller thread processes request queue\n- Synchronized request queue (BlockingQueue)\n\nDiscuss:\n- How SCAN algorithm works (elevator goes in one direction, serves all requests, then reverses)\n- Optimization: which elevator should serve a new request?\n- Emergency mode: bring all elevators to ground floor\n\n\n════════════════════ Design an ATM Machine ════════════════════\n\nDesign an ATM system using the State pattern.\nStates: Idle → CardInserted → PINVerified → TransactionSelected → Dispensing\nOr various error states: WrongPIN, InsufficientFunds, OutOfCash\nCover:\n- State pattern with proper transitions\n- Transactions: withdraw, deposit, check balance, transfer\n- Chain of Responsibility: cash dispensing (₹500 → ₹200 → ₹100 → ₹50)\n- Security: PIN validation, daily limits, card retention after 3 failures\n- Concurrency: multiple ATMs accessing same account\n  → Distributed locking or optimistic with retry\n- Observer pattern: bank notification on transactions\n- Java implementation — classic State pattern practice\nInterview follow-up: design for nationwide ATM network with 10K ATMs\n\n\n════════════════════ Design a Vending Machine ════════════════════\n\nImplement a Vending Machine in Java.\n\nRequirements:\n- Multiple products with prices and quantities\n- Accept coins and notes (specific denominations)\n- Make change (return optimal coins)\n- States: IDLE, HAS_MONEY, DISPENSING, OUT_OF_STOCK\n- Admin: refill products, collect money, view sales report\n\nKey classes:\n- VendingMachine (main controller)\n- Product (name, price, quantity, slot code)\n- Inventory (manages products)\n- MoneyManager (handles payments, change calculation)\n- Coin enum (PENNY, NICKEL, DIME, QUARTER or Indian: 1, 2, 5, 10)\n- VendingMachineState (interface): IdleState, HasMoneyState, DispensingState\n\nPatterns:\n- State pattern (CRITICAL — primary pattern for this problem):\n  - Each state handles insertMoney(), selectProduct(), dispense(), cancel() differently\n  - IdleState: only accepts money insertion\n  - HasMoneyState: accepts product selection or cancel (refund)\n  - DispensingState: dispenses product, returns change, transitions to IDLE\n- Strategy: change-making algorithm (greedy coin change)\n- Singleton: single VendingMachine instance\n\nJava specifics:\n- EnumMap for coin inventory (efficient for enum keys)\n- BigDecimal for money (NEVER float/double)\n- ConcurrentHashMap for thread-safe product inventory\n- State transitions with proper validation\n\nDiscuss:\n- Change-making: greedy vs DP approach, when greedy fails\n- Thread safety: two users at same machine\n- Extension: card payment, mobile payment\n\n\n════════════════════ Design a Parking Lot System ════════════════════\n\nImplement a Parking Lot Management System in Java.\n\nRequirements:\n- Multiple floors, each floor has multiple spots\n- Spot types: COMPACT, REGULAR, LARGE\n- Vehicle types: MOTORCYCLE, CAR, TRUCK (truck needs LARGE, car needs REGULAR+, motorcycle needs any)\n- Park a vehicle: find nearest available spot of correct type\n- Unpark: free the spot, calculate fee based on duration\n- Check availability per floor and type\n\nDesign patterns to use:\n- Strategy pattern: different pricing strategies (hourly, daily, weekend)\n- Factory pattern: create different vehicle types\n- Singleton: ParkingLot instance\n- Observer: notify when floor is full / spot freed\n\nKey classes:\n- ParkingLot, Floor, ParkingSpot (abstract → CompactSpot, RegularSpot, LargeSpot)\n- Vehicle (abstract → Motorcycle, Car, Truck)\n- Ticket, PricingStrategy, PaymentProcessor\n\nFocus on:\n- SOLID principles in every design decision\n- Interface segregation: don't put unnecessary methods on interfaces\n- Open-closed: easy to add new vehicle types without modifying existing code\n- Clean package structure",
    "tags": [
      "State Pattern",
      "Strategy Pattern",
      "Threading",
      "SCAN Algorithm",
      "Java",
      "ATM",
      "Chain of Responsibility",
      "Concurrency",
      "Vending Machine",
      "OOP Design",
      "SOLID",
      "Factory Pattern"
    ]
  },
  {
    "id": "lld-booking",
    "categories": [
      "LLD"
    ],
    "primaryCategory": "LLD",
    "priority": "P1",
    "title": "Booking & Marketplace: Hotel, Cab, Food Delivery, E-Commerce",
    "keyTopics": [
      "Hotels, room types, amenities, locations",
      "Search: location, dates, price range, room type",
      "Booking: availability check, reserve, confirm, cancel",
      "Concurrency: double-booking prevention with optimistic locking",
      "Distributed locking for high contention scenarios",
      "Chain of Responsibility: booking validation (date, availability, payment, fraud)",
      "Strategy pattern: dynamic/seasonal/day-of-week pricing strategies",
      "Observer: notify guests of confirmations, changes",
      "Entities: Rider, Driver, Trip, Payment, Location, Vehicle types (mini/sedan/SUV)",
      "Booking flow: request → nearest driver matching → acceptance → trip → payment",
      "State pattern: trip states (requested, accepted, started, completed, cancelled)",
      "Strategy pattern: pricing (surge/flat/per-km), matching algorithm",
      "Observer pattern: real-time trip updates",
      "Concurrency: multiple riders requesting same driver, lock contention on driver assignment",
      "Singleton: matching service",
      "Interview follow-up: surge pricing algorithm, rating system design",
      "Entities: Restaurant, Menu, Order, DeliveryAgent, Customer, Address",
      "Flow: browse → cart → order → prepare → pickup → deliver → rate",
      "State pattern: order states (placed, accepted, preparing, ready, picked, delivered, cancelled)",
      "Strategy pattern: delivery agent assignment, pricing, delivery time estimation",
      "Observer pattern: order status updates to customer/restaurant/agent",
      "Chain of Responsibility: order validation rules",
      "Search: restaurants by location, cuisine, rating, delivery time",
      "Concurrency: order acceptance, agent assignment, inventory updates",
      "Catalog: books with title, author, ISBN, price, stock; search by multiple criteria",
      "Cart: add/remove items, calculate total, apply discounts",
      "Order: place order, track status (PLACED, CONFIRMED, SHIPPED, DELIVERED)",
      "Inventory: thread-safe stock management, prevent overselling",
      "Discount strategies: percentage off, flat discount, buy-2-get-1",
      "State pattern: order status transitions with valid transition rules",
      "Specification pattern: flexible search criteria composition",
      "BigDecimal for money calculations (NEVER float/double)",
      "AtomicInteger for stock count",
      "Concurrency: two users buy last item simultaneously — optimistic locking with @Version"
    ],
    "prompt": "════════════════════ Design a Hotel Booking System ════════════════════\n\nDesign a hotel booking system with focus on concurrency.\nCover:\n- Hotels, room types, amenities, locations\n- Search: location, dates, price range, room type\n- Booking: availability check, reserve, confirm, cancel\n- Pricing: dynamic, seasonal, day-of-week variations\n- Concurrency: double-booking prevention (CRITICAL)\n  → Optimistic locking with retry\n  → Distributed locking for high contention\n- Chain of Responsibility: booking validation rules\n  → Date validation, availability, payment, fraud check\n- Strategy pattern: pricing strategies\n- Observer: notify guests of confirmations, changes\n- Java implementation focused on correctness under concurrency\n\n\n════════════════════ Design a Cab Booking System (Uber/Ola) ════════════════════\n\nDesign a cab booking system (Uber/Ola) — classic LLD for Indian product companies.\nENTITIES:\n- Rider, Driver, Trip, Payment, Location\n- Vehicle types (mini, sedan, SUV)\nFLOWS:\n- Booking request: rider requests cab\n- Matching algorithm: nearest driver + acceptance\n- Trip: started → in-progress → completed\n- Payment: cash, card, wallet\nPATTERNS:\n- State pattern: trip states (requested, accepted, started, completed, cancelled)\n- Strategy pattern: pricing (surge, flat, per-km), matching algorithm\n- Observer pattern: real-time trip updates\n- Singleton: matching service\nCONCURRENCY:\n- Multiple riders requesting same driver\n- Driver accepting/rejecting requests\n- Lock contention on driver assignment\nINTERVIEW FOLLOW-UP: Design surge pricing algorithm, design rating system\n\n\n════════════════════ Design a Food Delivery System (Swiggy/Zomato) ════════════════════\n\nDesign a food delivery system (Swiggy/Zomato) — classic LLD.\nENTITIES:\n- Restaurant, Menu, Order, DeliveryAgent, Customer, Address\nFLOW:\n- Browse restaurants → add to cart → place order → restaurant prepares → agent picks up → delivers → customer rates\nPATTERNS:\n- State pattern: order states (placed, accepted, preparing, ready, picked, delivered, cancelled)\n- Strategy pattern: delivery agent assignment, pricing, delivery time\n- Observer pattern: order status updates to customer/restaurant/agent\n- Chain of Responsibility: order validation rules\nSEARCH:\n- Restaurants by location, cuisine, rating, delivery time\n- Indexing for fast search\nCONCURRENCY:\n- Order acceptance by restaurant\n- Agent assignment\n- Inventory updates (item out of stock)\nINTERVIEW FOLLOW-UPS: design recommendation system, design rating system\n\n\n════════════════════ Design an Online Bookstore / E-Commerce System ════════════════════\n\nImplement core domain of an Online Bookstore in Java.\n\nRequirements:\n- Catalog: books with title, author, ISBN, price, stock quantity\n- Search: by title, author, category, price range\n- Cart: add/remove items, calculate total, apply discounts\n- Order: place order, track status (PLACED, CONFIRMED, SHIPPED, DELIVERED)\n- Inventory: track stock, prevent overselling\n- Discount strategies: percentage off, flat discount, buy-2-get-1\n\nKey classes:\n- Book, Author, Category (domain models)\n- Catalog, SearchService (search with multiple criteria)\n- ShoppingCart, CartItem\n- Order, OrderItem, OrderStatus enum\n- InventoryManager (thread-safe stock management)\n- DiscountStrategy (interface): PercentageDiscount, FlatDiscount, BundleDiscount\n\nPatterns:\n- Strategy: discount calculation\n- Observer: notify inventory when order placed\n- State: order status transitions with valid transition rules\n- Builder: complex order construction\n- Repository: data access abstraction\n- Specification: flexible search criteria composition\n\nJava specifics:\n- Java Streams for filtering/sorting catalog\n- Optional for nullable results\n- BigDecimal for money calculations (never use float/double for money!)\n- AtomicInteger for stock count\n- Comparable/Comparator for sorting\n\nDiscuss:\n- Concurrency: two users buy last item simultaneously — how to handle\n- Optimistic locking: @Version in JPA for stock management\n- Your Spring Boot experience: how would this be structured as Spring services?",
    "tags": [
      "Hotel Booking",
      "Concurrency",
      "Optimistic Locking",
      "Strategy Pattern",
      "OOP Design",
      "Cab Booking",
      "Uber Design",
      "State Pattern",
      "LLD",
      "Food Delivery",
      "Swiggy Design",
      "Observer Pattern"
    ]
  },
  {
    "id": "lld-ai-specific",
    "categories": [
      "LLD"
    ],
    "primaryCategory": "LLD",
    "priority": "P1",
    "title": "AI-Specific LLD: Agent Framework & RAG Pipeline",
    "keyTopics": [
      "Agent (abstract): plan(), execute(), observe(); ReActAgent, PlanAndExecuteAgent",
      "Tool (interface): name, description, schema, execute(); SQLTool, SearchTool, CalculatorTool",
      "ToolRegistry: register/lookup tools; ToolExecutor: execute with error handling",
      "AgentState: messages, current_step, tool_calls, intermediate_results",
      "StateManager: maintain state across steps",
      "Router (Strategy): decide next action based on state",
      "Memory (interface): ConversationMemory, SummaryMemory, VectorMemory",
      "Guardrail (Chain of Responsibility): validate inputs/outputs",
      "DocumentLoader (interface): PDFLoader, DocxLoader, TextLoader",
      "TextSplitter (interface): FixedSizeSplitter, RecursiveSplitter, SemanticSplitter — Strategy pattern",
      "EmbeddingModel (interface): OpenAIEmbedding, GeminiEmbedding",
      "VectorStore (interface): PgVectorStore, ChromaStore",
      "Retriever (interface): SimilarityRetriever, HybridRetriever, MMRRetriever",
      "Reranker (interface): CohereReranker, CrossEncoderReranker",
      "PromptBuilder: constructs prompt from query + chunks",
      "RAGPipeline: orchestrates full flow; Builder for pipeline configuration; Observer for logging"
    ],
    "prompt": "════════════════════ Design an Agent Framework (AI-Specific LLD) ════════════════════\n\nDesign a simple agent framework (like mini LangGraph).\nThis is your differentiator — most candidates can't do AI-specific LLD.\nCLASSES:\n- Agent (abstract): plan(), execute(), observe()\n  → ReActAgent, PlanAndExecuteAgent (concrete implementations)\n- Tool (interface): name, description, schema, execute()\n  → SQLTool, SearchTool, CalculatorTool (concrete)\n- ToolRegistry: register/lookup tools by name\n- ToolExecutor: execute tool with parameters, handle errors\n- AgentState: messages, current_step, tool_calls, intermediate_results\n- StateManager: maintain state across steps\n- Router (Strategy pattern): decide next action based on state\n- Memory (interface): store/retrieve past interactions\n  → ConversationMemory, SummaryMemory, VectorMemory\n- Guardrail (Chain of Responsibility): validate inputs/outputs\nPATTERNS USED:\n- Strategy: different agent types, different routing strategies\n- Chain of Responsibility: guardrail validation\n- Observer: logging, tracing each step\n- Factory: creating agents from configuration\n- Builder: configuring complex agent setup\nDEMONSTRATE: Clean OOP, SOLID principles, extensibility (easy to add new tools/agents/memories).\n\n\n════════════════════ Design a RAG Pipeline (Code-Level LLD) ════════════════════\n\nAI-SPECIFIC LLD: Design classes for a RAG pipeline.\n- DocumentLoader (interface): PDFLoader, DocxLoader, TextLoader\n- TextSplitter (interface): FixedSizeSplitter, RecursiveSplitter, SemanticSplitter\n  → Strategy pattern\n- EmbeddingModel (interface): OpenAIEmbedding, GeminiEmbedding\n- VectorStore (interface): PgVectorStore, ChromaStore\n- Retriever (interface): SimilarityRetriever, HybridRetriever, MMRRetriever\n- Reranker (interface): CohereReranker, CrossEncoderReranker\n- PromptBuilder: constructs prompt from query + chunks\n- Generator: calls LLM with constructed prompt\n- RAGPipeline: orchestrates full flow\nPATTERNS:\n- Builder for pipeline configuration\n- Strategy for swappable components\n- Observer for logging/tracing each step\nJava implementation showing clean OOP.",
    "tags": [
      "Agent Framework",
      "LangGraph Design",
      "OOP",
      "Strategy Pattern",
      "AI-Specific LLD",
      "RAG Pipeline LLD",
      "Builder Pattern"
    ]
  },
  {
    "id": "lld-storage",
    "categories": [
      "LLD"
    ],
    "primaryCategory": "LLD",
    "priority": "P2",
    "title": "File Storage System (S3-style)",
    "keyTopics": [
      "Upload/download/delete by bucket/key path",
      "List files in bucket/prefix with pagination",
      "Object metadata: content-type, upload timestamp, custom key-values",
      "Versioning: keep previous versions of files",
      "Access control: read/write permissions per user per bucket",
      "Repository pattern: abstract storage backend",
      "Decorator: add encryption, compression, logging as layers",
      "Java NIO Files API for file operations",
      "MessageDigest for checksum calculation (MD5, SHA-256)",
      "Streaming large files: InputStream/OutputStream, not loading full file in memory"
    ],
    "prompt": "Implement a simplified File Storage System in Java.\n\nRequirements:\n- Upload file to a path (bucket/key structure)\n- Download file by path\n- Delete file\n- List files in a bucket/prefix\n- Support metadata (content-type, upload timestamp, custom key-values)\n- Versioning: keep previous versions of files\n- Access control: read/write permissions per user per bucket\n\nKey classes:\n- StorageService (interface)\n- LocalStorageService (file system based)\n- Bucket, StorageObject, ObjectMetadata\n- AccessPolicy, Permission enum (READ, WRITE, DELETE)\n- VersionedObject (stores version history)\n\nPatterns:\n- Repository pattern: abstract storage backend\n- Decorator: add encryption, compression, logging as layers\n- Factory: create different storage backends\n- Iterator: list objects with pagination\n\nJava specifics:\n- Java NIO Files API for file operations\n- MessageDigest for checksum calculation (MD5, SHA-256)\n- GZIP compression with GZIPOutputStream\n- ConcurrentHashMap for metadata store\n- Streaming large files: InputStream/OutputStream, not loading full file in memory\n\nDiscuss:\n- How S3 actually stores objects (consistent hashing, replication)\n- Content-addressable storage (CAS) — store by hash of content\n- Multi-part upload for large files",
    "tags": [
      "S3",
      "File Storage",
      "Java NIO",
      "Versioning",
      "Decorator Pattern"
    ]
  },
  {
    "id": "sb-hashmap",
    "categories": [
      "Spring Boot"
    ],
    "primaryCategory": "Spring Boot",
    "priority": "P0",
    "title": "HashMap Internals + equals/hashCode Contract",
    "keyTopics": [
      "How HashMap works: hashing, bucket array, collision handling (linked list → red-black tree at threshold 8)",
      "What happens during resize (capacity doubles, rehashing)",
      "equals/hashCode contract: why both must be overridden together",
      "What breaks in HashMap if hashCode is bad or equals is inconsistent",
      "TreeMap (sorted, O(log n)) vs LinkedHashMap (insertion order) vs HashMap (unordered, O(1))",
      "ConcurrentHashMap — how it differs from synchronized HashMap"
    ],
    "prompt": "Teach me \"HashMap Internals + equals/hashCode Contract\" in depth for an SDE-2 Java + Spring Boot interview.\n\nCover each of these:\n- How HashMap works: hashing, bucket array, collision handling (linked list → red-black tree at threshold 8)\n- What happens during resize (capacity doubles, rehashing)\n- equals/hashCode contract: why both must be overridden together\n- What breaks in HashMap if hashCode is bad or equals is inconsistent\n- TreeMap (sorted, O(log n)) vs LinkedHashMap (insertion order) vs HashMap (unordered, O(1))\n- ConcurrentHashMap — how it differs from synchronized HashMap\n\nMake sure I can answer these interview questions crisply:\n- What happens if two objects have the same hashCode?\n- What if you override equals but not hashCode?\n\nFor each point give me: the underlying mechanism, a short code example, the common gotchas, and how it shows up in a real Java/Spring backend (e.g. a multi-tenant Blue Yonder service).",
    "tags": [
      "HashMap",
      "equals/hashCode",
      "Collections",
      "ConcurrentHashMap"
    ]
  },
  {
    "id": "sb-transactional",
    "categories": [
      "Spring Boot"
    ],
    "primaryCategory": "Spring Boot",
    "priority": "P0",
    "title": "@Transactional — Complete Mastery",
    "keyTopics": [
      "How Spring implements it: AOP proxy wrapping your bean",
      "Why self-invocation (calling @Transactional from same class) doesn't work — proxy is bypassed",
      "Propagation levels: REQUIRED, REQUIRES_NEW, NESTED, SUPPORTS, NOT_SUPPORTED",
      "Isolation levels: READ_COMMITTED, REPEATABLE_READ, SERIALIZABLE — anomalies each prevents",
      "Rollback rules: unchecked exceptions roll back by default, checked do NOT unless specified",
      "readOnly=true — Hibernate flush mode, query optimization"
    ],
    "prompt": "Teach me \"@Transactional — Complete Mastery\" in depth for an SDE-2 Java + Spring Boot interview.\n\nCover each of these:\n- How Spring implements it: AOP proxy wrapping your bean\n- Why self-invocation (calling @Transactional from same class) doesn't work — proxy is bypassed\n- Propagation levels: REQUIRED, REQUIRES_NEW, NESTED, SUPPORTS, NOT_SUPPORTED\n- Isolation levels: READ_COMMITTED, REPEATABLE_READ, SERIALIZABLE — anomalies each prevents\n- Rollback rules: unchecked exceptions roll back by default, checked do NOT unless specified\n- readOnly=true — Hibernate flush mode, query optimization\n\nMake sure I can answer these interview questions crisply:\n- Explain a scenario where REQUIRES_NEW is necessary.\n- Why didn't your transaction roll back?\n\nFor each point give me: the underlying mechanism, a short code example, the common gotchas, and how it shows up in a real Java/Spring backend (e.g. a multi-tenant Blue Yonder service).",
    "tags": [
      "@Transactional",
      "Spring AOP",
      "Propagation",
      "Isolation",
      "Hibernate"
    ]
  },
  {
    "id": "sb-concurrency",
    "categories": [
      "Spring Boot"
    ],
    "primaryCategory": "Spring Boot",
    "priority": "P0",
    "title": "Concurrency Fundamentals",
    "keyTopics": [
      "synchronized — object monitor, intrinsic lock, method-level vs block-level",
      "volatile — visibility guarantee, when it's enough vs when you need synchronization",
      "ReentrantLock vs synchronized — tryLock, fairness, interruptibility",
      "Semaphore — permit-based concurrency control",
      "Common problems: race condition, deadlock, livelock, starvation",
      "Write programs that break without synchronization — observe the failures"
    ],
    "prompt": "Teach me \"Concurrency Fundamentals\" in depth for an SDE-2 Java + Spring Boot interview.\n\nCover each of these:\n- synchronized — object monitor, intrinsic lock, method-level vs block-level\n- volatile — visibility guarantee, when it's enough vs when you need synchronization\n- ReentrantLock vs synchronized — tryLock, fairness, interruptibility\n- Semaphore — permit-based concurrency control\n- Common problems: race condition, deadlock, livelock, starvation\n- Write programs that break without synchronization — observe the failures\n\nMake sure I can answer these interview questions crisply:\n- Difference between volatile and synchronized?\n- Write a thread-safe singleton.\n\nFor each point give me: the underlying mechanism, a short code example, the common gotchas, and how it shows up in a real Java/Spring backend (e.g. a multi-tenant Blue Yonder service).",
    "tags": [
      "Concurrency",
      "synchronized",
      "volatile",
      "Locks",
      "Threads"
    ]
  },
  {
    "id": "sb-di-lifecycle",
    "categories": [
      "Spring Boot"
    ],
    "primaryCategory": "Spring Boot",
    "priority": "P0",
    "title": "Spring DI + Bean Lifecycle",
    "keyTopics": [
      "Full bean lifecycle: instantiation → DI → BeanPostProcessor.before → @PostConstruct → InitializingBean.afterPropertiesSet → BeanPostProcessor.after → ready → @PreDestroy → DisposableBean.destroy",
      "Scopes: singleton, prototype, request, session",
      "@Qualifier vs @Primary — resolution order when multiple beans of same type exist",
      "Circular dependencies — why they happen, how Spring solves (singletons, three-level cache), why constructor injection fails fast",
      "@Lazy — when and why to use"
    ],
    "prompt": "Teach me \"Spring DI + Bean Lifecycle\" in depth for an SDE-2 Java + Spring Boot interview.\n\nCover each of these:\n- Full bean lifecycle: instantiation → DI → BeanPostProcessor.before → @PostConstruct → InitializingBean.afterPropertiesSet → BeanPostProcessor.after → ready → @PreDestroy → DisposableBean.destroy\n- Scopes: singleton, prototype, request, session\n- @Qualifier vs @Primary — resolution order when multiple beans of same type exist\n- Circular dependencies — why they happen, how Spring solves (singletons, three-level cache), why constructor injection fails fast\n- @Lazy — when and why to use\n\nMake sure I can answer these interview questions crisply:\n- Explain bean lifecycle.\n- How does Spring resolve circular dependencies?\n\nFor each point give me: the underlying mechanism, a short code example, the common gotchas, and how it shows up in a real Java/Spring backend (e.g. a multi-tenant Blue Yonder service).",
    "tags": [
      "Spring DI",
      "Bean Lifecycle",
      "Scopes",
      "Circular Dependency"
    ]
  },
  {
    "id": "sb-java8",
    "categories": [
      "Spring Boot"
    ],
    "primaryCategory": "Spring Boot",
    "priority": "P0",
    "title": "Java 8+ Features + Functional Model",
    "keyTopics": [
      "Optional — proper usage (return type, never field/param), orElse vs orElseGet (lazy), anti-patterns",
      "Functional interfaces — Predicate, Function, Consumer, Supplier, BiFunction",
      "Method references (Class::method, instance::method)",
      "Streams internals — lazy evaluation, short-circuiting (findFirst, anyMatch), parallel streams (when they help vs hurt)",
      "Records (Java 16+), sealed classes (Java 17) — what and when"
    ],
    "prompt": "Teach me \"Java 8+ Features + Functional Model\" in depth for an SDE-2 Java + Spring Boot interview.\n\nCover each of these:\n- Optional — proper usage (return type, never field/param), orElse vs orElseGet (lazy), anti-patterns\n- Functional interfaces — Predicate, Function, Consumer, Supplier, BiFunction\n- Method references (Class::method, instance::method)\n- Streams internals — lazy evaluation, short-circuiting (findFirst, anyMatch), parallel streams (when they help vs hurt)\n- Records (Java 16+), sealed classes (Java 17) — what and when\n\nMake sure I can answer these interview questions crisply:\n- Difference between orElse and orElseGet?\n- When would a parallel stream be slower?\n\nFor each point give me: the underlying mechanism, a short code example, the common gotchas, and how it shows up in a real Java/Spring backend (e.g. a multi-tenant Blue Yonder service).",
    "tags": [
      "Java 8",
      "Streams",
      "Optional",
      "Functional",
      "Records"
    ]
  },
  {
    "id": "sb-threadpools",
    "categories": [
      "Spring Boot"
    ],
    "primaryCategory": "Spring Boot",
    "priority": "P1",
    "title": "Thread Pools + CompletableFuture + @Async",
    "keyTopics": [
      "ExecutorService — fixed, cached, scheduled, work-stealing thread pools",
      "Thread pool sizing: CPU-bound (cores + 1) vs IO-bound (cores × (1 + wait/service))",
      "CompletableFuture — thenApply vs thenCompose, exceptionally, allOf, anyOf",
      "Exception handling in async chains — where exceptions go and how to catch them",
      "Spring @Async — how the proxy works, why it fails without @EnableAsync, custom executor config",
      "Default SimpleAsyncTaskExecutor creates unbounded threads — why that's dangerous in production"
    ],
    "prompt": "Teach me \"Thread Pools + CompletableFuture + @Async\" in depth for an SDE-2 Java + Spring Boot interview.\n\nCover each of these:\n- ExecutorService — fixed, cached, scheduled, work-stealing thread pools\n- Thread pool sizing: CPU-bound (cores + 1) vs IO-bound (cores × (1 + wait/service))\n- CompletableFuture — thenApply vs thenCompose, exceptionally, allOf, anyOf\n- Exception handling in async chains — where exceptions go and how to catch them\n- Spring @Async — how the proxy works, why it fails without @EnableAsync, custom executor config\n- Default SimpleAsyncTaskExecutor creates unbounded threads — why that's dangerous in production\n\nMake sure I can answer these interview questions crisply:\n- How would you size a thread pool for an IO-heavy service?\n- What happens if a CompletableFuture stage throws?\n\nFor each point give me: the underlying mechanism, a short code example, the common gotchas, and how it shows up in a real Java/Spring backend (e.g. a multi-tenant Blue Yonder service).",
    "tags": [
      "Thread Pools",
      "CompletableFuture",
      "@Async",
      "ExecutorService"
    ]
  },
  {
    "id": "sb-aop-proxy",
    "categories": [
      "Spring Boot"
    ],
    "primaryCategory": "Spring Boot",
    "priority": "P1",
    "title": "AOP + Spring Proxy Mechanism",
    "keyTopics": [
      "AOP concepts: aspect, advice (before, after, around), pointcut, join point",
      "JDK dynamic proxy (interface-based) vs CGLIB (subclassing) — which Spring uses when",
      "The foundation for @Transactional, @Async, @Cacheable — all work through proxies",
      "Why final classes/methods can't be proxied by CGLIB",
      "Writing a custom aspect — logging, timing, retry logic",
      "Proxy chain order when multiple aspects apply to the same method"
    ],
    "prompt": "Teach me \"AOP + Spring Proxy Mechanism\" in depth for an SDE-2 Java + Spring Boot interview.\n\nCover each of these:\n- AOP concepts: aspect, advice (before, after, around), pointcut, join point\n- JDK dynamic proxy (interface-based) vs CGLIB (subclassing) — which Spring uses when\n- The foundation for @Transactional, @Async, @Cacheable — all work through proxies\n- Why final classes/methods can't be proxied by CGLIB\n- Writing a custom aspect — logging, timing, retry logic\n- Proxy chain order when multiple aspects apply to the same method\n\nMake sure I can answer these interview questions crisply:\n- How does Spring implement @Transactional internally?\n- Why won't @Cacheable work on a private method?\n\nFor each point give me: the underlying mechanism, a short code example, the common gotchas, and how it shows up in a real Java/Spring backend (e.g. a multi-tenant Blue Yonder service).",
    "tags": [
      "Spring AOP",
      "Proxy",
      "CGLIB",
      "JDK Dynamic Proxy"
    ]
  },
  {
    "id": "sb-jpa-hibernate",
    "categories": [
      "Spring Boot"
    ],
    "primaryCategory": "Spring Boot",
    "priority": "P1",
    "title": "JPA/Hibernate Internals",
    "keyTopics": [
      "First-level cache (persistence context) — entities cached per transaction, dirty checking at flush",
      "N+1 problem — why it happens with lazy loading; solutions (JOIN FETCH, @EntityGraph, @BatchSize)",
      "FetchType.LAZY vs EAGER, LazyInitializationException and how to handle",
      "EntityManager lifecycle — open, managed, detached, removed states",
      "Hibernate query generation — derived queries, @Query for JPQL/native",
      "Optimistic locking (@Version) vs pessimistic locking — when to use which"
    ],
    "prompt": "Teach me \"JPA/Hibernate Internals\" in depth for an SDE-2 Java + Spring Boot interview.\n\nCover each of these:\n- First-level cache (persistence context) — entities cached per transaction, dirty checking at flush\n- N+1 problem — why it happens with lazy loading; solutions (JOIN FETCH, @EntityGraph, @BatchSize)\n- FetchType.LAZY vs EAGER, LazyInitializationException and how to handle\n- EntityManager lifecycle — open, managed, detached, removed states\n- Hibernate query generation — derived queries, @Query for JPQL/native\n- Optimistic locking (@Version) vs pessimistic locking — when to use which\n\nMake sure I can answer these interview questions crisply:\n- Explain the N+1 problem and how you solved it.\n- What is dirty checking?\n\nFor each point give me: the underlying mechanism, a short code example, the common gotchas, and how it shows up in a real Java/Spring backend (e.g. a multi-tenant Blue Yonder service).",
    "tags": [
      "JPA",
      "Hibernate",
      "N+1",
      "Locking",
      "EntityManager"
    ]
  },
  {
    "id": "sb-autoconfig",
    "categories": [
      "Spring Boot"
    ],
    "primaryCategory": "Spring Boot",
    "priority": "P1",
    "title": "Spring Boot Auto-Configuration + Externalized Config",
    "keyTopics": [
      "@SpringBootApplication = @Configuration + @EnableAutoConfiguration + @ComponentScan",
      "How auto-configuration works: AutoConfiguration.imports / spring.factories",
      "@Conditional annotations: @ConditionalOnClass, @ConditionalOnProperty, @ConditionalOnMissingBean",
      "Property resolution order: command line → env vars → application-{profile}.yml → application.yml → defaults",
      "@ConfigurationProperties vs @Value — type-safe binding vs individual injection",
      "Spring Profiles — @Profile, environment-specific config"
    ],
    "prompt": "Teach me \"Spring Boot Auto-Configuration + Externalized Config\" in depth for an SDE-2 Java + Spring Boot interview.\n\nCover each of these:\n- @SpringBootApplication = @Configuration + @EnableAutoConfiguration + @ComponentScan\n- How auto-configuration works: AutoConfiguration.imports / spring.factories\n- @Conditional annotations: @ConditionalOnClass, @ConditionalOnProperty, @ConditionalOnMissingBean\n- Property resolution order: command line → env vars → application-{profile}.yml → application.yml → defaults\n- @ConfigurationProperties vs @Value — type-safe binding vs individual injection\n- Spring Profiles — @Profile, environment-specific config\n\nMake sure I can answer these interview questions crisply:\n- How does Spring Boot know to configure a DataSource automatically?\n- Explain property resolution order.\n\nFor each point give me: the underlying mechanism, a short code example, the common gotchas, and how it shows up in a real Java/Spring backend (e.g. a multi-tenant Blue Yonder service).",
    "tags": [
      "Spring Boot",
      "Auto-Configuration",
      "@Conditional",
      "Profiles"
    ]
  },
  {
    "id": "sb-string-generics",
    "categories": [
      "Spring Boot"
    ],
    "primaryCategory": "Spring Boot",
    "priority": "P2",
    "title": "String Internals + Generics + Exception Handling",
    "keyTopics": [
      "String pool (intern()), immutability — why String is immutable (security, caching, thread-safety)",
      "String vs StringBuilder vs StringBuffer",
      "Generics — type erasure, bounded types (<T extends Comparable>), wildcards (? extends / ? super)",
      "PECS principle: Producer Extends, Consumer Super",
      "Checked vs unchecked exceptions — when to use custom exceptions",
      "How Spring @ControllerAdvice handles exceptions globally"
    ],
    "prompt": "Teach me \"String Internals + Generics + Exception Handling\" in depth for an SDE-2 Java + Spring Boot interview.\n\nCover each of these:\n- String pool (intern()), immutability — why String is immutable (security, caching, thread-safety)\n- String vs StringBuilder vs StringBuffer\n- Generics — type erasure, bounded types (<T extends Comparable>), wildcards (? extends / ? super)\n- PECS principle: Producer Extends, Consumer Super\n- Checked vs unchecked exceptions — when to use custom exceptions\n- How Spring @ControllerAdvice handles exceptions globally\n\nMake sure I can answer these interview questions crisply:\n- Why can't you do new T() in Java?\n- Explain PECS with an example.\n\nFor each point give me: the underlying mechanism, a short code example, the common gotchas, and how it shows up in a real Java/Spring backend (e.g. a multi-tenant Blue Yonder service).",
    "tags": [
      "String",
      "Generics",
      "Type Erasure",
      "Exceptions",
      "@ControllerAdvice"
    ]
  },
  {
    "id": "sb-pooling-cache-rest",
    "categories": [
      "Spring Boot"
    ],
    "primaryCategory": "Spring Boot",
    "priority": "P2",
    "title": "Connection Pooling + Caching + REST Fundamentals",
    "keyTopics": [
      "HikariCP — how pooling works, sizing (cores × 2 + effective_spindle_count), timeout config",
      "Multiple datasource configuration (relevant to sharding work)",
      "@Cacheable, @CacheEvict, @CachePut — how the proxy intercepts and checks cache",
      "Cache eviction strategies: LRU, LFU, TTL — when each makes sense",
      "Caffeine cache internals",
      "REST: HTTP method usage, idempotency (GET/PUT/DELETE idempotent, POST not), status codes, API versioning"
    ],
    "prompt": "Teach me \"Connection Pooling + Caching + REST Fundamentals\" in depth for an SDE-2 Java + Spring Boot interview.\n\nCover each of these:\n- HikariCP — how pooling works, sizing (cores × 2 + effective_spindle_count), timeout config\n- Multiple datasource configuration (relevant to sharding work)\n- @Cacheable, @CacheEvict, @CachePut — how the proxy intercepts and checks cache\n- Cache eviction strategies: LRU, LFU, TTL — when each makes sense\n- Caffeine cache internals\n- REST: HTTP method usage, idempotency (GET/PUT/DELETE idempotent, POST not), status codes, API versioning\n\nMake sure I can answer these interview questions crisply:\n- How do you size a connection pool?\n- Explain cache-aside pattern.\n\nFor each point give me: the underlying mechanism, a short code example, the common gotchas, and how it shows up in a real Java/Spring backend (e.g. a multi-tenant Blue Yonder service).",
    "tags": [
      "HikariCP",
      "Caching",
      "Caffeine",
      "REST",
      "Idempotency"
    ]
  },
  {
    "id": "sb-security-jvm",
    "categories": [
      "Spring Boot"
    ],
    "primaryCategory": "Spring Boot",
    "priority": "P2",
    "title": "Spring Security + JVM Basics",
    "keyTopics": [
      "Spring Security filter chain — how requests flow through filters before the controller",
      "OncePerRequestFilter — how to write custom filters",
      "Authentication (who are you) vs Authorization (what can you do)",
      "Connect to Gravitee/OAuth work — same concepts, different layer",
      "JVM memory: heap (young: Eden + Survivor, old gen) vs stack (per thread, method frames)",
      "GC: G1 (default Java 17), minor vs major GC, what triggers full GC",
      "Class loading: bootstrap → extension → application",
      "Common OOM scenarios: heap space, metaspace, unable to create native thread"
    ],
    "prompt": "Teach me \"Spring Security + JVM Basics\" in depth for an SDE-2 Java + Spring Boot interview.\n\nCover each of these:\n- Spring Security filter chain — how requests flow through filters before the controller\n- OncePerRequestFilter — how to write custom filters\n- Authentication (who are you) vs Authorization (what can you do)\n- Connect to Gravitee/OAuth work — same concepts, different layer\n- JVM memory: heap (young: Eden + Survivor, old gen) vs stack (per thread, method frames)\n- GC: G1 (default Java 17), minor vs major GC, what triggers full GC\n- Class loading: bootstrap → extension → application\n- Common OOM scenarios: heap space, metaspace, unable to create native thread\n\nMake sure I can answer these interview questions crisply:\n- Explain Spring Security filter chain.\n- What causes an OOM error and how do you debug it?\n\nFor each point give me: the underlying mechanism, a short code example, the common gotchas, and how it shows up in a real Java/Spring backend (e.g. a multi-tenant Blue Yonder service).",
    "tags": [
      "Spring Security",
      "Filter Chain",
      "JVM",
      "GC",
      "OOM"
    ]
  },
  {
    "id": "sb-microservices",
    "categories": [
      "Spring Boot"
    ],
    "primaryCategory": "Spring Boot",
    "priority": "P0",
    "title": "Microservices Patterns: Circuit Breaker, Saga, Service Discovery, Tracing",
    "keyTopics": [
      "Circuit Breaker pattern: closed → open → half-open state machine",
      "Resilience4j @CircuitBreaker, @Retry, @RateLimiter, @Bulkhead, @TimeLimiter",
      "Failure threshold, slow call threshold, wait duration in open state",
      "Why circuit breakers prevent cascading failures and resource exhaustion",
      "Fallback methods: how to define, when to use cached / default / degraded responses",
      "Service discovery: client-side (Eureka, Consul) vs server-side (Kubernetes Service, AWS ALB)",
      "Spring Cloud LoadBalancer for client-side load balancing",
      "Distributed tracing: span, trace, parent_span_id propagation across services",
      "OpenTelemetry / Micrometer Tracing / Sleuth + Zipkin/Jaeger",
      "trace_id propagation through HTTP headers (W3C traceparent) and message brokers",
      "How tracing connects to your Gravitee work and Blue Yonder's observability",
      "Saga pattern: long-running distributed transaction broken into local transactions + compensations",
      "Choreography (each service publishes/listens to events) vs Orchestration (one coordinator drives the saga)",
      "Compensating action design: how to undo step N if step N+1 fails",
      "Saga vs 2PC: why 2PC doesn't scale; saga's eventual consistency tradeoff",
      "Connection between your async Pack Service work and saga: the submit-poll-fetch IS a mini-saga with timeout fallback",
      "Outbox pattern for reliable event publishing: write business state + outbox row in one transaction, separate publisher reads outbox",
      "Inter-service communication: sync REST vs async messaging vs gRPC — when each",
      "API versioning: URI versioning (/v1, /v2), header versioning, content negotiation",
      "API gateway responsibilities: auth, rate limit, routing, request transformation (your Gravitee work)"
    ],
    "prompt": "Teach me production microservices patterns I need to defend at SDE-2 — focused on what gets asked, tied to my Blue Yonder work where possible.\n\n1. CIRCUIT BREAKER:\n- The state machine: closed → (failures cross threshold) → open → (wait period) → half-open → (test calls succeed) → closed, or (fail) → open\n- Resilience4j in Spring Boot: @CircuitBreaker(name='...', fallbackMethod='...'), config thresholds (failureRateThreshold, slowCallRateThreshold, waitDurationInOpenState)\n- When to use: external service calls, slow downstream, partial outages\n- Pitfalls: stateless config across instances, fallback that calls another failing service\n- Interview test: 'Your downstream service is degraded — what happens without a circuit breaker?' Answer with thread pool exhaustion, cascading failure, why open state protects upstream.\n\n2. RETRY + BULKHEAD + TIMEOUT:\n- @Retry: how Resilience4j retries, exponential backoff, which exceptions trigger\n- @Bulkhead: limit concurrent calls per dependency — prevent one slow service from eating all threads\n- @TimeLimiter: cap execution time\n- Combining them: order of annotations matters (Bulkhead → TimeLimiter → Retry → CircuitBreaker)\n\n3. SERVICE DISCOVERY:\n- Client-side (Eureka, Consul): clients query registry, pick instance\n- Server-side (k8s Service, ALB): infrastructure handles routing\n- Spring Cloud LoadBalancer for client-side\n- At Blue Yonder you have Gravitee in front — that's effectively API gateway + service discovery for your case\n\n4. DISTRIBUTED TRACING:\n- Why: when 10 microservices call each other, where did the 2s latency come from?\n- Spans, traces, parent IDs — the basic mental model\n- W3C traceparent header propagation\n- Micrometer Tracing + Zipkin/Jaeger; OpenTelemetry as the standard\n- How a trace flows through your Gravitee → Allocation service → Pack service async call\n- Interview test: 'How do you debug a slow request in a microservices system?'\n\n5. SAGA PATTERN — DO NOT SKIP:\n- The problem: distributed transaction across services where 2PC is infeasible\n- Saga = sequence of local transactions, each with a compensating action\n- Choreography: each service emits events, others react (no central coordinator)\n- Orchestration: one service drives the saga, calls participants in order (Spring StateMachine or framework like Axon)\n- Compensation: design every step with its reverse (refund, release-hold, cancel-shipment)\n- INTERVIEW WIN: your async Pack Service integration IS a saga-adjacent pattern (submit → poll → fetch with timeout fallback to sync). Be able to articulate this in saga language.\n\n6. OUTBOX PATTERN:\n- Problem: 'update DB AND send Kafka event atomically' is impossible without 2PC\n- Solution: write business row + 'outbox' row in same local transaction; separate publisher polls outbox and sends to Kafka; mark sent\n- Why this matters: exactly-once event publishing using at-least-once + idempotent consumer\n\n7. WHEN NOT TO USE MICROSERVICES: be honest in interview — operational cost, distributed debugging, network failure modes. Monolith first, split when justified.",
    "tags": [
      "Microservices",
      "Circuit Breaker",
      "Resilience4j",
      "Saga",
      "Outbox",
      "Service Discovery",
      "Distributed Tracing",
      "OpenTelemetry",
      "API Gateway"
    ]
  },
  {
    "id": "sb-distributed-systems",
    "categories": [
      "Spring Boot"
    ],
    "primaryCategory": "Spring Boot",
    "priority": "P0",
    "title": "Distributed Systems Concepts + Kafka Fundamentals",
    "keyTopics": [
      "CAP theorem: Consistency, Availability, Partition tolerance — pick 2 (really: when partition happens, pick C or A)",
      "Real systems aren't pure CP or AP — they trade off per operation",
      "PACELC: extension — in absence of partition, also trade Latency vs Consistency",
      "Consistency models: strong, sequential, causal, eventual, read-your-writes, monotonic-read",
      "Linearizability vs serializability — when interviewer probes",
      "Idempotency in distributed systems: why retries need it, how to implement",
      "Idempotency keys: client-generated, server-stored, TTL-based",
      "Exactly-once vs at-least-once vs at-most-once delivery — what messaging systems guarantee",
      "Why exactly-once is usually at-least-once + idempotent consumer (Kafka EOS is an exception within Kafka)",
      "KAFKA — even though Blue Yonder doesn't use it, it gets asked",
      "Topics, partitions, replicas (leader/follower), consumer groups, offsets",
      "Partition key determines partition; ordering guaranteed only within partition",
      "Consumer groups: each partition assigned to one consumer in the group (parallelism = #partitions)",
      "Offset management: auto-commit vs manual commit; at-least-once vs at-most-once tradeoff",
      "Producer acks: 0 (fire-and-forget), 1 (leader ack), all (replica ack)",
      "Idempotent producer: prevents duplicate writes on producer retry",
      "Transactional producer: writes to multiple partitions atomically (Kafka exactly-once)",
      "When to choose Kafka vs RabbitMQ vs SQS — log-based vs queue semantics",
      "Quorum-based replication: write succeeds when N/2+1 replicas ack",
      "Leader election: Raft/Paxos basics (don't go deep, know what they solve)",
      "Heartbeats and failure detection: phi-accrual, gossip protocols (one-line awareness)",
      "Vector clocks: detect concurrent writes; cause-and-effect ordering",
      "How your async Pack Service work uses at-least-once + idempotency for safety"
    ],
    "prompt": "Teach me the distributed systems concepts that get asked at SDE-2 — focused, not academic.\n\n1. CAP THEOREM — properly:\n- In a network partition (P always exists in distributed systems), pick C (refuse writes, stay consistent) or A (accept writes, become inconsistent).\n- Not 'pick 2 of 3' — that framing is misleading. It's 'during partition, C or A; otherwise both'.\n- PACELC: even WITHOUT partition, latency vs consistency tradeoff (sync replication = consistent but slow; async = fast but stale).\n- Interview test: 'PostgreSQL — CP or AP?' (CP by default — partition causes unavailability). 'Cassandra?' (AP). 'DynamoDB?' (tunable per operation).\n\n2. CONSISTENCY MODELS:\n- Strong / linearizable: looks like one machine; expensive.\n- Eventual: replicas converge eventually; cheap but can read stale.\n- Read-your-writes: a user always sees their own writes (common UX requirement)\n- Causal: if A happened before B, all observers see A before B\n- Monotonic-read: never read older state than previously read\n- Which model your system needs depends on the use case; don't default to strong.\n\n3. IDEMPOTENCY IN DISTRIBUTED SYSTEMS:\n- Why: networks lose acks, clients retry, the same request reaches the server twice\n- Pattern: client generates idempotency key (UUID) per logical operation; server stores key → response with TTL\n- On duplicate key, server returns stored response — never re-executes\n- Where: payments, order creation, message production (Kafka idempotent producer is exactly this)\n- This connects directly to my async Pack Service integration where retries need to be safe\n\n4. DELIVERY SEMANTICS:\n- AT-MOST-ONCE: fire-and-forget. Messages can be lost, never duplicated. Use case: metrics, logs (mostly).\n- AT-LEAST-ONCE: retry until ack. Messages can be duplicated, never lost. Default for most reliable systems.\n- EXACTLY-ONCE: holy grail. Achieved as at-least-once + idempotent consumer. Kafka's EOS is exactly-once-within-Kafka, not end-to-end.\n\n5. KAFKA — must-know basics even if I don't use it:\n- Topics → partitions → replicas\n- Partition key determines which partition; ordering is per-partition only\n- Consumer group: one partition → one consumer in the group; parallelism capped at #partitions\n- Offset = position in partition; consumer's progress is its offset, committed periodically\n- Producer acks: 0 (none), 1 (leader), all (all in-sync replicas). 'all' is what you want for durability.\n- Idempotent producer: prevents duplicates on producer retry within a session\n- Transactional producer: atomic writes across partitions/topics (Kafka exactly-once)\n- When Kafka vs alternatives: Kafka for log/replay/stream processing; RabbitMQ/SQS for queue semantics with selective ack\n\n6. REPLICATION & LEADER ELECTION (light touch):\n- Quorum: writes succeed when N/2+1 replicas ack; reads from quorum see latest writes\n- Raft / Paxos: just know what they solve (agreeing on a single leader / log order), not the math\n- Phi-accrual / gossip: failure detection — name-drop awareness only\n\n7. TIES TO MY WORK: my async Pack Service uses at-least-once with idempotency. My Snowflake sharding is partition tolerance with eventual consistency across realms. My Gravitee migration is API gateway providing the entry point that supports retries safely. Practice connecting these.",
    "tags": [
      "CAP",
      "PACELC",
      "Consistency Models",
      "Idempotency",
      "Kafka",
      "Exactly-Once",
      "Distributed Systems",
      "Replication",
      "Consumer Groups"
    ]
  },
  {
    "id": "sb-sql",
    "categories": [
      "Spring Boot"
    ],
    "primaryCategory": "Spring Boot",
    "priority": "P3",
    "title": "SQL + Query Optimization",
    "keyTopics": [
      "Joins deep dive: INNER, LEFT, RIGHT, FULL, CROSS — visual mental model",
      "Indexing: B-tree, when index helps vs hurts, composite index column order matters",
      "EXPLAIN/EXPLAIN ANALYZE — reading plans, seq scan vs index scan",
      "Window functions: ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD",
      "Query optimization: avoiding SELECT *, index-only scans, covering indexes",
      "Snowflake-specific: how sharding affects query routing"
    ],
    "prompt": "Teach me \"SQL + Query Optimization\" in depth for an SDE-2 Java + Spring Boot interview.\n\nCover each of these:\n- Joins deep dive: INNER, LEFT, RIGHT, FULL, CROSS — visual mental model\n- Indexing: B-tree, when index helps vs hurts, composite index column order matters\n- EXPLAIN/EXPLAIN ANALYZE — reading plans, seq scan vs index scan\n- Window functions: ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD\n- Query optimization: avoiding SELECT *, index-only scans, covering indexes\n- Snowflake-specific: how sharding affects query routing\n\nMake sure I can answer these interview questions crisply:\n- This query is slow, how do you debug it?\n- Difference between clustered and non-clustered index.\n\nFor each point give me: the underlying mechanism, a short code example, the common gotchas, and how it shows up in a real Java/Spring backend (e.g. a multi-tenant Blue Yonder service).",
    "tags": [
      "SQL",
      "Indexing",
      "Query Optimization",
      "Window Functions"
    ]
  },
  {
    "id": "sb-design-patterns",
    "categories": [
      "Spring Boot"
    ],
    "primaryCategory": "Spring Boot",
    "priority": "P3",
    "title": "Design Patterns in Practice",
    "keyTopics": [
      "Patterns you already use: Factory, Builder, Strategy, Observer, Singleton, Template Method",
      "Identify where each is used in your codebase (don't memorize definitions)",
      "Factory: how Spring uses it for BeanFactory",
      "Strategy: FeatureToggle routing",
      "Observer: event-driven patterns in Spring (@EventListener)",
      "Template Method: JdbcTemplate, RestTemplate",
      "Builder: entity builders, query builders"
    ],
    "prompt": "Teach me \"Design Patterns in Practice\" in depth for an SDE-2 Java + Spring Boot interview.\n\nCover each of these:\n- Patterns you already use: Factory, Builder, Strategy, Observer, Singleton, Template Method\n- Identify where each is used in your codebase (don't memorize definitions)\n- Factory: how Spring uses it for BeanFactory\n- Strategy: FeatureToggle routing\n- Observer: event-driven patterns in Spring (@EventListener)\n- Template Method: JdbcTemplate, RestTemplate\n- Builder: entity builders, query builders\n\nMake sure I can answer these interview questions crisply:\n- Give me a real example of Strategy pattern from your project.\n\nFor each point give me: the underlying mechanism, a short code example, the common gotchas, and how it shows up in a real Java/Spring backend (e.g. a multi-tenant Blue Yonder service).",
    "tags": [
      "Design Patterns",
      "Strategy",
      "Factory",
      "Template Method"
    ]
  }

];

export const CATEGORIES = ["AI", "HLD", "LLD", "Spring Boot"];

export const CATEGORY_CONFIG = {
  AI: {
    label: "AI / GenAI",
    color: "purple",
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800",
    bar: "bg-gradient-to-r from-purple-500 to-violet-500",
  },
  HLD: {
    label: "High-Level Design",
    color: "blue",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
    bar: "bg-gradient-to-r from-blue-500 to-sky-500",
  },
  LLD: {
    label: "Low-Level Design",
    color: "emerald",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
    bar: "bg-gradient-to-r from-emerald-500 to-green-500",
  },
  DSA: {
    label: "Data Structures & Algorithms",
    color: "orange",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800",
    bar: "bg-gradient-to-r from-orange-500 to-amber-500",
  },
  "Spring Boot": {
    label: "Java & Spring Boot",
    color: "teal",
    badge: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800",
    bar: "bg-gradient-to-r from-teal-500 to-cyan-500",
  },
};

export const DIFFICULTY_CONFIG = {
  Easy: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  Medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  Hard: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

// P0 = highest (asked in nearly every loop) … P3 = polish/lower frequency.
export const PRIORITY_CONFIG = {
  P0: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800",
  P1: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800",
  P2: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
  P3: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600",
  P4: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700",
};