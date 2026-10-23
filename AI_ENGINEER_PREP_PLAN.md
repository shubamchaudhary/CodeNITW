# AI Engineer Interview Plan: 2 YOE, backend-leaning (Java + Python)

Made 2026-10-23 from your resume (SHUBAM_CHAUDHARY_RESUME_SDE.pdf), your LogLens repo (`C:\PROJECTS\LogLens`: orchestrator, evals, bench) and 2026 interview guides (sources at the bottom). Blue Yonder code was not available, so that section is built from the resume text only.

Order = priority. Do P0 before P1 before P2. Tick boxes as you go. Hour estimates are rough.

---

## 1. What AI Engineer loops test in 2026

| Round | What they check | Typical prompt |
|---|---|---|
| Phone screen | Working knowledge of retrieval and prompting, not trivia | "200-page PDF and a question: what happens between Enter and the answer?" |
| Project deep-dive | One system you shipped, end to end, with a baseline and a measurement | "Walk me through an AI system you built." |
| Live coding / debugging | Fix an integration without framework hand-waving | "An agent loops forever on some inputs. Find out why." |
| Take-home | Build and measure a Q&A system | "50 markdown docs, 20-question eval set, report recall@5 and faithfulness." |
| System design | Eval and serving design around a model you do not control | "Design a support assistant. How do you know it helps?" |

Strong answers name the metric, state the tradeoff, and say when the technique is the wrong tool. Weak answers add boxes to a diagram and tune by feel. The eval round is the one people fail most often.

## 2. Where you stand

| Strong (lean on these) | Gaps (close these) |
|---|---|
| A real RAG system with an eval harness: recall@k, MRR, nDCG, vector vs FTS vs hybrid ablation, golden set, CI thresholds. Most 2 YOE candidates have none of this. | The answer-quality eval was only a dry run, so you have no real faithfulness number. |
| Kafka ingest with idempotent effects, rate limits as partitions, constant-heap streaming. Strong backend story. | The judge was never calibrated against human labels. The tooling exists (`--export-judge-sample`, `--kappa`), it has not been run. |
| Corrective RAG and a judge loop in LangGraph, plus an HITL agent at work. | Hybrid has lower MRR than FTS-only on your data (0.44 vs 0.61) and there is no reranker. |
| Provider gateway, key pool, multi-model split (chat vs embeddings). | Resume is Java-first. AI loops often code live in Python. |
| | No stated number for the Blue Yonder agent (accuracy, adoption, time saved). |

---

## 3. The plan

### P0: Defend your own resume (about 15 h). Every loop starts here.

**P0-1. Fix the numbers and close the eval gaps in DeepLogLens (about 5 h)**
- [ ] Pick ONE number for LLM-call reduction and know where it comes from. Resume says 80%, README says ~90%, your eval measured 77.8% on the synthetic corpus (threshold 0.75). Say "~78% on my eval".
- [ ] Run the answer-quality eval with the real judge: `python evals/run_llm_evals.py --session <id> --judge anthropic` (guard is $5).
- [ ] Run `--export-judge-sample 40`, label the 40 items yourself, then `--kappa`. You now have judge-vs-human agreement. Also check position and verbosity bias (swap answer order, compare scores on long vs short answers).
- [ ] Count how often the ground-check loop force-accepts an ungrounded narrative (`grounded=false` is already persisted). That is your failure rate.
- [ ] Add a reranker (cross-encoder such as bge-reranker) after RRF and re-run `run_retrieval.py`. Goal: recover the MRR that hybrid loses to FTS-only. Report before and after.
- [ ] Make sure the live demo is warm and you have a 2-minute screen-share path (free-tier cold starts kill demos).

**P0-2. Be able to defend every DeepLogLens claim**

Be able to answer, with your own numbers:
- Why hybrid? (Your data: vector-only recall@10 0.39, FTS 0.78, hybrid 0.76; hybrid wins at recall@30, 0.87 vs 0.85, and loses at MRR. Logs are identifier-heavy, so lexical wins. Embedding digests lifted vector recall@10 to 0.49.)
- Why were vector numbers weak? (Chunks average ~15.7K chars but bge-small sees about 512 tokens. Embedding stand-in is not the production model. Say this before they find it.)
- What is RRF, the formula, and why k=60? (`score = sum 1/(k + rank_i)`; rank-based, so no score normalisation between cosine and ts_rank.)
- Is `ts_rank` BM25? (No. Postgres FTS has no corpus-level IDF. BM25 needs an extension like ParadeDB pg_search.)
- Why one chunk table with an HNSW index per session? (Filtered ANN recall collapse on a shared table: the index returns top `ef_search` candidates, then the filter removes most of them. Alternatives: pgvector 0.8 iterative scans, partitioning, partial indexes. Cost of yours: many tables and indexes, catalog bloat.)
- HNSW parameters: `m` (default 16), `ef_construction` (64), `hnsw.ef_search` (40). What each trades (recall, build time, memory, latency).
- How does the corrective loop behave? (Grader returns `relevant_ids`; max 2 rewrites; falls back to `best_docs` so a bad grader cannot force an empty answer.) Cost: extra LLM calls per question. Know your `corrective_loop_trigger_rate` once you have run it.
- Is your judge trustworthy? (Self-preference: the production ground-check uses the same model family as the generator, the eval judge is a different family. Kappa on 40 labels. Force-accept is visible, not silent.)
- "Exactly-once effects": marker row in the same DB transaction as the data, plus idempotent upserts. Why not Kafka transactions? (EOS covers Kafka-to-Kafka only. A DB write is outside it. Offsets commit after the durable write, so a crash causes redelivery, and the marker makes redelivery a no-op.) Also say "effectively-once".
- Why one partition per API key? (Per-key rate limit with no distributed lock. Limit: partition count caps parallelism, and a hot key stalls its partition.)
- Why deterministic parsers plus an LLM only on flagged windows? (An LLM cannot count. Cost scales with incidents, not log size.) What happens when the anomaly gate misses a real incident? (Your eval: incident recall 1.0, window F1 0.90 on synthetic data. Say the limit: synthetic corpus, held-out seeds, Loghub BGL for real labels.)
- Weak spots to volunteer honestly: golden set is synthetic and generator-labelled (51 answerable questions is small); time-range questions get 0.167 recall@10 from every retriever, which is why the SQL tier exists.

**P0-3. Defend the Blue Yonder LangGraph agent (about 4 h)**

Prepare answers at architecture level (no confidential detail). Likely questions:
- How does the model turn a planner's sentence into a safe update? (Tool schemas, validation against business rules, per-tenant authorization enforced in code, never in the prompt.)
- "Hierarchy-aware PostgreSQL querying": is this text-to-SQL? If so: read-only DB role, table and column allowlist, tenant scoping enforced in the DB (row-level security or forced WHERE), statement timeout, row limit.
- Base + Overlay with Redis-staged writes: what is staged, when does it commit, what if the user abandons, what if two planners edit the same parameter, what is the TTL?
- `interrupt()` semantics: the node re-runs from its start on resume, so any side effect before the interrupt must be idempotent (or put the interrupt first or in its own node). Needs a checkpointer and `thread_id`. What persists the checkpoint in your setup? What happens if approval never comes?
- How did you measure "minutes instead of multi-day tickets"? Have a real number: median time before and after, adoption, correct-parse rate, rejection rate at approval.
- How did you evaluate it and catch regressions when the prompt changed? How do you trace a bad run? Which model (Azure OpenAI), how is the prompt versioned, what are the latency and cost per request?
- What did it get wrong in the first month, and what did you change?

**P0-4. Two scripts, spoken aloud (about 2 h)**
- [ ] 90-second version and 5-minute version for each project: problem, baseline, key design decision, how you evaluated, guardrail, a change you made after real feedback or failure.
- [ ] Record yourself once. Cut filler.

---

### P1: Concepts asked in almost every loop (about 30 h)

**P1-1. RAG, one level deeper than the diagram (about 6 h)**
- [ ] Chunking: fixed vs structure-aware vs semantic, overlap, parent-document retrieval, contextual retrieval, late chunking. Choosing chunk size (balance specificity vs context).
- [ ] Embeddings: bi-encoder vs cross-encoder, cosine vs inner product (normalised vectors make them equal), dimension vs cost, embedding drift when the model changes (re-index everything, never mix models).
- [ ] Hybrid search and fusion (RRF, weighted score fusion), reranking, query rewriting, multi-query, HyDE, metadata filters.
- [ ] Choosing k, "lost in the middle", context budget, when to skip RAG (small corpus fits in context, fast-changing facts).
- [ ] Access control at retrieval time, index freshness, deletes and re-indexing.
- [ ] The debug checklist for "right document exists but the answer is wrong": ingestion, freshness, filters, chunking, query rewrite, retrieval, rerank, context assembly, generation. Log retrieved IDs and scores, measure retrieval and generation separately, add the case to the regression set.
- Done when: you can explain the 200-page PDF question in 3 minutes without notes.

**P1-2. Evals (about 6 h). Highest-failure round.**
- [ ] Retrieval metrics by hand on 5 queries: recall@k, precision@k, MRR, nDCG.
- [ ] Generation metrics: faithfulness, answer relevance, context precision, context recall (RAGAS names), plus code-checked correctness and abstention.
- [ ] LLM-as-judge: position bias, verbosity bias, self-preference. Mitigations: swap order, different model family, rubric, calibrate against human labels with Cohen's kappa (0.6 to 0.8 is substantial). Retest after a model or prompt change.
- [ ] Eval set design: from requirements, production failures, edge cases, unanswerable questions. Report slices, not one average. Regression gate in CI with latency, cost and safety limits (you already have `thresholds.json`).
- [ ] Offline vs online: shadow traffic, canary, A/B, thumbs, task success. Agent evals: final outcome plus trajectory.
- Done when: you can answer "how do you know this change should ship?" using your own repo as the example.

**P1-3. Agents and LangGraph (about 7 h)**
- [ ] Workflow vs agent: use a workflow when steps are known, an agent only when flexible tool choice justifies the latency, cost and uncertainty. Patterns: chaining, routing, parallelisation, orchestrator-workers, evaluator-optimizer.
- [ ] Agent loop from scratch, with no framework: call model, run tool calls, append results, repeat until final answer or a limit. Know the failure modes: same-tool loop burning the budget, context blow-up, tool misuse, silent partial failure.
- [ ] Controls: max iterations, token and spend budget, timeouts, retries with backoff, idempotent tools, least-privilege tools, approval points, verify the outcome in the system of record rather than trusting "done".
- [ ] LangGraph: `StateGraph`, state schema and reducers (`Annotated[list, add_messages]`), conditional edges, checkpointers (Postgres) and `thread_id`, `interrupt()` and `Command(resume=...)`, subgraphs, streaming modes, `recursion_limit` (your analyze graph computes one), durability modes. Why LangGraph over a plain loop.
- [ ] Memory: short-term (thread state) vs long-term (store), summarisation vs trimming.
- [ ] Tool calling and structured output: JSON schema, pydantic validation, refusals and missing fields, bounded retries, explicit error path.
- [ ] Observability: trace each step (LangSmith, Langfuse or OpenTelemetry), replay failed runs before shipping a prompt change.
- Done when: you can write a 40-line tool-calling loop with a step cap on a whiteboard.

**P1-4. Python fluency and from-scratch builds (about 8 h)**

Your resume is Java-first; AI roles often test Python live.
- [ ] Python core: `asyncio` (gather, semaphore, timeouts), generators and streaming, dataclasses and pydantic v2, type hints, context managers, GIL (threads vs asyncio vs multiprocessing), pytest.
- [ ] FastAPI: dependency injection, async endpoints, SSE streaming, background tasks, validation.
- [ ] Build each of these from scratch, in Python, in under 30 minutes:
  - [ ] cosine top-k with numpy
  - [ ] BM25 over a small corpus
  - [ ] RRF fusion of two ranked lists
  - [ ] text chunker with overlap and token counting
  - [ ] retry with exponential backoff and jitter
  - [ ] async batched embedding calls with a semaphore and a token bucket
  - [ ] LRU cache and a simple semantic cache
  - [ ] minimal agent loop with two tools and a step cap
- Done when: each runs and has one test.

**P1-5. LLM fundamentals (about 4 h)**
- [ ] Tokenisation and why token counts differ from word counts, context window, attention at a high level, KV cache, why long context costs more.
- [ ] Sampling: temperature, top-p, top-k, seeds, why outputs still vary.
- [ ] Hallucination causes and mitigations. Prompting vs RAG vs fine-tuning: when each.
- [ ] Structured outputs and constrained decoding. Prompt caching (static prefix first). Context engineering: what goes in, in what order, what gets trimmed.
- [ ] Model choice: small model for routing and extraction, large for reasoning. Know the current model families well enough to compare cost, latency and context.

---

### P2: System design and production (about 15 h)

**P2-1. LLM system designs (about 7 h).** Practise each on paper in 35 minutes: components, data flow, eval plan, failure modes, cost.
- [ ] Enterprise doc Q&A (multi-tenant, access control, 10M documents, freshness)
- [ ] Customer-support assistant with human handoff
- [ ] Log or incident analysis (your own system, as a reference answer)
- [ ] Tool-using agent with approvals (your Blue Yonder agent, generalised)
- [ ] Batch pipeline over millions of documents (queues, retries, idempotency, rate limits). This is your strongest ground.
- [ ] LLM gateway with fallback across providers (your `LlmGateway` and key pool)
- For each, have an answer for: latency budget, cost per resolved task, caching (prompt and semantic), routing small vs large model, streaming, 429 handling, versioning prompts and models together, canary and rollback, incident response after a model or prompt change.

**P2-2. Vector search internals (about 3 h)**
- [ ] HNSW vs IVF-Flat vs IVF-PQ vs exact scan: recall, latency, memory, build cost, updates.
- [ ] Filtered ANN problem and its fixes. Quantisation (scalar, binary, PQ).
- [ ] pgvector vs a dedicated store (Qdrant, Pinecone, Weaviate, Milvus): when pgvector is enough, when it is not.

**P2-3. Security and guardrails (about 3 h)**
- [ ] Direct and indirect prompt injection (retrieved text and tool output are untrusted), data exfiltration, cross-tenant leakage, PII handling.
- [ ] Authorization at retrieval and at action time. A prompt instruction is not an access control.
- [ ] Guardrail timing: some SDK input guardrails run in parallel with the agent, so a tool may already have run when a tripwire fires. Design around it.
- [ ] Text-to-SQL safety (read-only role, allowlist, tenant scope in the DB).

**P2-4. Cost, latency and serving (about 2 h)**
- [ ] Break latency down by stage, look at tail latency, then apply: smaller model for routing, shorter context, parallel independent calls, streaming, caching, fewer agent turns. Test each on the same eval set and state the quality loss you accept.
- [ ] Inference serving concepts: continuous batching, KV cache, PagedAttention (vLLM), speculative decoding, quantisation. Conceptual depth is enough at 2 YOE.

---

### P3: Differentiators (about 8 h). Only after P0 to P2.

- [ ] **Other stacks:** call a model API directly with no framework (interviewers test this). Skim LlamaIndex, the OpenAI Agents SDK, and MCP (tools, resources, prompts, transports). Check the current MCP spec before quoting details.
- [ ] **Fine-tuning basics:** SFT, LoRA and QLoRA, DPO and RLHF at one-paragraph level, distillation, embedding fine-tuning, when fine-tuning beats RAG.
- [ ] **Classical ML basics:** precision, recall, F1, ROC-AUC, bias-variance, cross-validation. Needed for "ML Engineer" JDs, rarely for backend-leaning GenAI roles.
- [ ] **Skip unless the JD asks:** multimodal, voice, image generation, training from scratch.

---

## 4. Schedule

If your 26 Oct coding round is still on, use Oct 23 to 26 for it and start Week 1 on Oct 27.

| Week | Focus | Output |
|---|---|---|
| 1 | P0-1 to P0-4, start P1-1 | Judge kappa number, reranker result, aligned resume numbers, two project scripts recorded |
| 2 | P1-1, P1-2, P1-3 | Can explain RAG, evals and agents without notes; agent loop from scratch |
| 3 | P1-4, P1-5, P2-1 | Eight from-scratch builds done; four system designs written |
| 4 | P2-2 to P2-4, P3, mocks | Two mock interviews (project deep-dive, system design), gaps list |

Seven days only? Do P0-1 (first four boxes), P0-2, P0-3, P1-1, P1-2, and two P2-1 designs.

## 5. Resume edits to consider (nothing was changed)

- Skills line lists "LLM-as-Judge": only keep it if you have run the kappa check, or be ready to say the judge is calibrated on 40 labels.
- Add one eval line to DeepLogLens once the numbers exist, for example recall@10 and faithfulness from your harness. Most candidates cannot show this.
- LLM-call reduction: use the figure your eval measured.
- Summary says "2.5+ years" and the Blue Yonder entry says "Present". Your notes say 2+ years with a last working day in Aug 2026. Make sure the resume and your spoken answer match.

## 6. Sources

- [AI Engineer Interview Questions 2026: RAG, Agents, Evals, and Production Systems (PracHub)](https://prachub.com/resources/ai-engineer-interview-questions-2026-rag-agents-evals-and-production-systems)
- [What applied-AI engineer interviews test in 2026 (techinterview.org)](https://www.techinterview.org/post/3233476824/ai-engineer-interview-rag-agents-evals/)
- [AI Engineer Interview Questions (Exponent)](https://www.tryexponent.com/blog/ai-engineer-interview-questions)
- [Generative AI, LLM and RAG Interview Questions 2026 (lets-code)](https://lets-code.co.in/articles/generative-ai-interview-questions)
- [How to explain a RAG project in an AI/ML interview (FACE Prep)](https://faceprep.in/article/how-to-explain-a-rag-project-in-an-ai-ml-interview-2026/)
- [LangGraph interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts.md) and [persistence](https://docs.langchain.com/oss/javascript/langgraph/persistence)
- [LLMs-as-Judges survey (arXiv)](https://arxiv.org/pdf/2412.05579)

These are prep sites, not leaked questions. Treat them as practice material. Your own numbers come from `evals/results/` in LogLens (run 2026-09-29).
