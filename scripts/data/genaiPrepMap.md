# GenAI Interview Prep Map

Source for `scripts/genAIStack.mjs` — one resource, one depth ceiling and one
question set per topic. Companion to the Java + Spring Boot topic map.

---

## Rules

1. **One resource per topic. No alternatives listed.** If it's not here, don't read it.
2. **Every topic has a DEPTH CEILING.** Stop there. Going deeper is wasted time.
3. **The ceiling is set by what you built.** You're positioned as *a backend engineer who ships GenAI*, not an AI researcher. Your answers should sound like someone who's debugged this at 2am, not someone who read a paper.

**Total: ~8h 30m.** Part A (RAG) and Part C (evals) are weighted heaviest.

---

## Why the ceiling matters more than the depth

The interviewer in a backend loop usually hasn't shipped an agent. They cannot out-depth you. So:

- **You don't lose by not knowing** the HNSW graph-construction proof.
- **You lose by being vague** about a decision you actually made.

A confident *"we didn't do that, and here's the tradeoff we accepted"* beats a hazy recital of theory every time.

---

# PART A — RAG (~2h 40m)

### A1 · Chunking & embeddings
**📖 Pinecone Learn — *Chunking Strategies for LLM Applications*** (pinecone.io/learn/chunking-strategies) · ~30m · ☐

**Depth ceiling**
- ✅ Enough: name the strategies, say which you picked for logs and why, know what breaks at each size extreme.
- ❌ Too deep: embedding model architecture, training objectives, contrastive loss.

**Questions**
1. Chunk too small → what breaks? Too large → what breaks?
2. What is overlap for, and what does it cost you?
3. Fixed-size vs recursive vs semantic vs structure-aware. Pick one for log data and defend it.
4. Why can't you compare embeddings from two different models?
5. You swap embedding models. What happens to your existing index?
6. Retrieval returns garbage. Give your debug order: chunking → embedding → index → query → top-k.
7. Where does document extraction fail? (Tables, multi-column PDFs, scans, headers.)

---

### A2 · Vector index internals — HNSW, ANN, filtering
**📖 pgvector README** (github.com/pgvector/pgvector) — read the **Indexing** and **Filtering** sections · ~30m · ☐
**⚠️ Your resume claims HNSW + post-filtered ANN recall loss.**

**Depth ceiling**
- ✅ Enough: HNSW is a layered graph you greedily descend; it's approximate; `m`/`ef_construction`/`ef_search` trade recall for speed; filtering after the ANN search throws away results the index already narrowed.
- ❌ Too deep: skip-list probability distributions, graph pruning heuristics, SIMD distance kernels.

**Questions**
1. Explain HNSW in three sentences. Why layers?
2. HNSW vs IVFFlat — build time, query time, recall, memory. When does IVFFlat win?
3. What do `m`, `ef_construction`, `ef_search` control?
4. What is ANN recall and why isn't it 100%?
5. **Pre-filter vs post-filter. Why does post-filtering lose recall?** ← the one that backs your per-session-table decision
6. Why is exact KNN fine at 10k vectors and fatal at 10M?
7. Why pgvector over Pinecone/Qdrant? Give the honest tradeoff, not a sales pitch.

---

### A3 · Hybrid search + reranking
**📖 Pinecone Learn — *Rerankers and Two-Stage Retrieval*** (pinecone.io/learn/series/rag/rerankers) · ~30m · ☐
*Resume: hybrid vector + full-text, GIN indexes.*

**Depth ceiling**
- ✅ Enough: bi-encoder retrieves fast and lossy, cross-encoder reranks slow and accurate; you can't afford the cross-encoder at corpus scale.
- ❌ Too deep: ColBERT late interaction, training a reranker.

**Questions**
1. Give a query where keyword search wins and vector search fails. Then the reverse.
2. How do you merge two ranked lists? Explain Reciprocal Rank Fusion.
3. Bi-encoder vs cross-encoder — why is the cross-encoder more accurate?
4. Why not just use the cross-encoder for retrieval?
5. Retrieve 100 → rerank to 5. What's the p99 latency cost?
6. When is reranking not worth it?

---

### A4 · Corrective / agentic RAG
**📖 LangGraph docs — *Agentic RAG* tutorial** (langchain-ai.github.io/langgraph → Tutorials → RAG) · ~40m · ☐
**⚠️ Your resume claims retrieve → grade → rewrite → re-retrieve.**

**Depth ceiling**
- ✅ Enough: draw the graph, name every branch, state the latency cost, say when plain RAG is better.
- ❌ Too deep: the CRAG paper's benchmark tables.

**Questions**
1. What does the grading node check, and who grades?
2. Grader says "irrelevant." Walk every branch from there.
3. Why does query rewriting help? What was wrong with the original query?
4. **What's the p99 latency cost vs plain RAG? When would you not use corrective-RAG?**
5. How do you bound the retrieve→rewrite loop?
6. The corpus genuinely lacks the answer. How does the system say "I don't know" instead of hallucinating?
7. Self-RAG vs Corrective-RAG vs Agentic RAG — one line each.

---

### A5 · RAG failure taxonomy
**📖 Pinecone Learn — RAG series, intro chapter** (pinecone.io/learn/series/rag) · ~30m · ☐

**Depth ceiling**
- ✅ Enough: name where a RAG pipeline breaks and which metric catches each.
- ❌ Too deep: survey papers.

**Questions**
1. **A RAG answer is wrong. Name every stage that could be at fault.** (Extraction → chunking → embedding → index → retrieval → reranking → prompt → generation.)
2. Retrieval returned the right chunk but the answer is still wrong. Where's the bug?
3. Retrieval returned nothing relevant but the answer sounded confident. What's missing from your system?
4. How do you make the model cite its source? How do you verify the citation is real?
5. "Lost in the middle" — what is it and how do you mitigate it?
6. When is RAG the wrong architecture entirely?

---

# PART B — LangChain + LangGraph (~2h 20m)

### B1 · LangChain — what it is, and when not to use it
**📖 LangChain docs — Conceptual Guide** (python.langchain.com → Conceptual guide) · ~30m · ☐

**Depth ceiling**
- ✅ Enough: it's an abstraction layer over models/retrievers/tools; LCEL composes them; you know when the abstraction costs more than it saves.
- ❌ Too deep: memorising integration APIs.

**Questions**
1. **LangChain vs LangGraph — when do you use each?** (Chains and retrieval flows → LangChain. Stateful, cyclic, needs checkpointing → LangGraph.)
2. What does LCEL give you over plain function calls? (Streaming, batching, async, tracing — for free.)
3. Would you use LangChain in production, or call the provider SDK directly? Defend it.
4. What's the cost of the abstraction when you need to debug?
5. How do you swap providers without rewriting the pipeline?

---

### B2 · LangGraph core — state, edges, routing, checkpointing, HITL
**📖 LangChain Academy — *Quickstart: LangGraph Essentials (Python)*** (academy.langchain.com/courses/langgraph-essentials-python) · 13 lessons, ~1h · ☐
**⚠️ Covers your HITL interrupt claim directly (Lesson 5).**

*Free, official, and the only source guaranteed current — the API changes quarterly and most tutorials are two versions stale.*

**Depth ceiling**
- ✅ Enough: draw your own graph on a whiteboard, explain state/reducers, explain what a checkpointer buys you, explain what happens across a crash and across a human wait.
- ❌ Too deep: LangGraph internals, Pregel execution model.

**Questions**
1. Why a graph instead of a chain? What does the graph buy you?
2. What is state? How do reducers merge writes from parallel nodes?
3. What is a checkpointer? What breaks without one?
4. Where does the checkpoint live in production, and what does that mean for horizontal scaling?
5. Your graph crashes mid-run. What resumes, and from where?
6. How do you prevent infinite loops in a cyclic graph?
7. Static breakpoint vs dynamic `interrupt()` — when do you need each?
8. **The human approval never arrives. What happens to your staged write?** ← your system
9. Can the human edit state, or only approve? How?
10. The underlying data changed while the human was deciding. Now what?

---

### B3 · Agents — ReAct, tool calling, and when not to
**📖 Anthropic — *Building Effective Agents*** (anthropic.com/engineering/building-effective-agents) · ~30m · ☐

**Depth ceiling**
- ✅ Enough: explain the ReAct loop, name the workflow patterns, and argue for the *simplest* thing that works.
- ❌ Too deep: the ReAct paper's benchmarks, agent-framework comparisons.

**Questions**
1. Explain the ReAct loop. What is the reasoning step actually doing?
2. **Workflow vs agent — what's the real difference, and which is your default?** (Simplest thing that works. Say it.)
3. How does tool calling work mechanically? Who parses what?
4. Model calls a nonexistent tool, or passes bad args. What happens?
5. The agent loops forever on the same tool. How do you stop it?
6. 3 fat tools or 15 thin ones? How do you decide granularity?
7. Why does the tool *description* matter more than the tool code?
8. Token cost of a 10-step loop vs one call. Why does it compound?
9. **When is an agent the wrong choice?**

---

### B4 · Memory — short-term vs long-term
**📖 LangChain Academy — *Ambient Agents*, Module 5: Memory** (academy.langchain.com/courses/ambient-agents) · ~20m · ☐

**Depth ceiling**
- ✅ Enough: thread-scoped vs cross-thread, what you store, when you write.
- ❌ Too deep: memory-architecture research, Mem0 internals.

**Questions**
1. Thread-scoped vs cross-thread memory — what's the storage difference?
2. Conversation exceeds the context window. Three strategies, three tradeoffs.
3. When do you write to long-term memory — every turn or on a trigger?
4. How do you retrieve the *right* memory instead of all of it?
5. Two memories contradict. Now what?
6. Isn't long-term memory just RAG over chat history? (Mostly. Say so, then say what's different.)

---

# PART C — "Is my AI actually working?" (~2h)

> **This is your differentiator.** Most candidates who've "used LangChain" cannot answer a single question in this section. It's also the section where your LogLens LLM-as-judge claim gets probed.

### C1 · RAG metrics
**📖 RAGAS docs — Core Concepts → Metrics** (docs.ragas.io) · ~40m · ☐

**Depth ceiling**
- ✅ Enough: define the four core metrics, say which measure retrieval vs generation, and diagnose a system from its scores.
- ❌ Too deep: the RAGAS paper's math, every metric in the library.

**Questions**
1. Define faithfulness, answer relevancy, context precision, context recall. **Which two measure retrieval, which two measure generation?**
2. **Faithfulness is 0.91 but users say answers miss key information. Which metric catches it, and why did faithfulness stay high?** (Context recall. The retriever missed a doc; the generator answered coherently from partial context.)
3. How is faithfulness computed? (Decompose the answer into claims, entailment-check each against context.)
4. Context precision vs context recall — which do you fix by changing top-k, and which by changing chunking?
5. Reference-free vs reference-based eval. When do you need ground truth?
6. All four scores are high but users are unhappy. What are you not measuring?

---

### C2 · LLM-as-judge + building an eval loop
**📖 Hamel Husain — *Your AI Product Needs Evals*** (hamel.dev/blog/posts/evals) · ~40m · ☐
**⚠️ Your resume claims an LLM-as-judge groundedness loop.**

**Depth ceiling**
- ✅ Enough: explain how you'd build a golden set, validate the judge against humans, and gate changes on it.
- ❌ Too deep: judge-model fine-tuning, academic agreement statistics.

**Questions**
1. **Who judges the judge?** How do you know yours isn't drifting?
2. Name three known LLM-judge biases. (Position, verbosity, self-preference.)
3. How do you validate a judge against human labels? What agreement is good enough?
4. Binary pass/fail vs 1–5 scale — which is more reliable and why?
5. How big should a golden set be? How do you build one without manual-labelling hell?
6. Your judge and your generator are the same model. What's the problem?
7. Error analysis: 50 failures in front of you. What's your process?
8. **How did you know LogLens's groundedness loop was actually working?** ← answer this honestly; "we didn't fully validate it" is a strong answer

---

### C3 · Production monitoring + regression
**📖 LangSmith docs — Evaluation Concepts** (docs.smith.langchain.com → Evaluation) · ~40m · ☐

**Depth ceiling**
- ✅ Enough: describe the three-layer pattern — offline eval gates merges, online eval samples production, monitoring alerts on drift.
- ❌ Too deep: LangSmith's full API surface.

**Questions**
1. Offline eval vs online eval vs monitoring — what does each catch that the others miss?
2. How do you gate a merge on eval scores in CI?
3. **The provider silently updates the model. How do you find out before your users do?**
4. What do you trace in an LLM app that you don't in a normal service? (Prompt, completion, tokens, per-step latency, tool calls, cost.)
5. What alerts on an LLM feature? (Not just 5xx — cost spikes, groundedness drops, tool error rates, retrieval-miss rate.)
6. How do you A/B test a prompt change safely?
7. Same input, different output. How do you debug that?
8. How do you version prompts like code?

---

# PART D — Production essentials (~1h 30m)

### D1 · Prompt injection + guardrails
**📖 OWASP Top 10 for LLM Applications** (genai.owasp.org) — read LLM01 and LLM02 only · ~30m · ☐

**Depth ceiling**
- ✅ Enough: direct vs indirect injection, why prompting alone can't fix it, where guardrails sit.
- ❌ Too deep: jailbreak taxonomies, adversarial ML.

**Questions**
1. Prompt injection vs jailbreaking — different problems, different defences. Explain.
2. **Direct vs indirect injection. Which threatens a RAG system, and why is it worse?**
3. A retrieved log line says "ignore previous instructions." What stops it?
4. Why can't better prompting fully solve injection?
5. Input guardrails vs output guardrails — what does each catch?
6. How do you stop an agent's tool from being used to exfiltrate data?

---

### D2 · Structured outputs + text-to-SQL guardrails
**📖 LangChain docs — Structured outputs** (python.langchain.com → Conceptual guide → Structured outputs) · ~30m · ☐
*Resume: guardrailed SQL via sqlglot in the RCA agent.*

**Depth ceiling**
- ✅ Enough: three ways to force structure and their reliability; why SQL needs layered defence.
- ❌ Too deep: constrained-decoding/grammar internals.

**Questions**
1. Prompting vs function calling vs constrained decoding — which actually guarantees valid JSON?
2. Model returns malformed JSON. Retry strategy — and does it terminate?
3. **How do you stop the model writing `DROP TABLE`?** (Three layers: AST validation via sqlglot, read-only DB role, table allowlist. Not one.)
4. Why is "please don't delete anything" in the prompt not a guardrail?
5. How do you give schema context without blowing the token budget?
6. Generated SQL is valid but semantically wrong. How do you catch it?
7. Multi-tenant row-level security in generated SQL — how?

---

### D3 · Cost, latency, caching
**📖 Anthropic docs — Prompt caching** (docs.claude.com → Build with Claude → Prompt caching) · ~30m · ☐

**Depth ceiling**
- ✅ Enough: where the time and money go, and what caching changes.
- ❌ Too deep: KV-cache internals, GPU serving.

**Questions**
1. What gets cached, and what invalidates the cache?
2. Where do you place a cache breakpoint in a RAG prompt? (Static system + schema before dynamic context.)
3. Where does latency actually go in an LLM call? (TTFT vs total; prefill vs decode.)
4. How do you cap spend per tenant?
5. Different providers, different tokenizers. How do you compare cost fairly?
6. Temperature 0 — is output deterministic? (No. Explain why.)

---

# PART E — SKIP

Transformer internals · attention math · training/RLHF · quantization · vLLM/GPU serving · model architecture comparisons.

**If asked:** *"I work at the application layer — I've shipped agents and RAG in production, but I haven't trained or served models myself."*

Honest, positions you correctly, closes the thread. **Do not bluff here.** It's the one area where someone who does know will catch you in a single follow-up.

---

# Execution

**Order:** A1 → A2 → A4 → C1 → C2 → B2 → B3 → A3 → A5 → B1 → B4 → C3 → D1 → D2 → D3

Evals (C1, C2) come early — before LangGraph — because "how do you know it works" is the question most candidates fail and it reframes everything you say afterward.

**Per topic:** attempt the questions cold → read the one resource → say the answers out loud, recorded → mock. Done = you can answer without notes, not "I read it."

| Part | Hours |
|---|---|
| A — RAG | 2h 40m |
| B — LangChain/LangGraph | 2h 20m |
| C — Evaluation | 2h 00m |
| D — Production | 1h 30m |
| **Total** | **8h 30m** |

---

## The line this document does not cross

Six topics are marked ⚠️. At each, the general concept is necessary but not sufficient — knowing what post-filtered recall loss *is* isn't the same as saying why you chose per-session chunk tables to avoid it.

That half is your codebase. Re-read it and write down the *why* for every decision. No document substitutes for that.
