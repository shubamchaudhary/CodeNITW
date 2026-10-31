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
    "key": "S",
    "label": "Start here",
    "chip": "Start"
  },
  {
    "key": "B",
    "label": "How LLMs work",
    "chip": "Basics"
  },
  {
    "key": "R",
    "label": "RAG",
    "chip": "RAG"
  },
  {
    "key": "L",
    "label": "LangChain + LangGraph",
    "chip": "LangGraph"
  },
  {
    "key": "H",
    "label": "Human-in-the-loop",
    "chip": "HITL"
  },
  {
    "key": "E",
    "label": "Evals",
    "chip": "Evals"
  },
  {
    "key": "D",
    "label": "AI system design",
    "chip": "Design"
  },
  {
    "key": "F",
    "label": "Advanced: MCP, fine-tuning, serving",
    "chip": "Advanced"
  }
];

export const AI_STACK_TOPICS = [
  {
    "id": "AIE-02",
    "section": "S",
    "sectionLabel": "Start here",
    "priority": "P0",
    "title": "Talking about your AI project — the openers and follow-ups",
    "why": "Almost every AI engineer loop opens with “walk me through an AI system you built”, and every claim in that walkthrough becomes the next question. Reviewers see “RAG chatbot with LangChain and a vector DB” everywhere; what stands out is evidence: a number that came from an eval, a cost or latency figure, a guardrail or approval step that shows you know how these systems fail.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "a two-minute walkthrough of one project with a measured result, and an answer for each follow-up below.",
      "tooDeep": "polishing slides; listing every framework you have touched."
    },
    "know": [
      "The walkthrough shape: problem and baseline → the key design decision → how you measured it → what broke → what's next.",
      "Signals that count: real users · an eval with a number (recall@k, faithfulness, pass rate) · cost or latency figures · guardrails or human approval · tracing.",
      "Signals that read as tutorial work: “built a chatbot”, framework lists with no outcome, “improved accuracy” with no baseline.",
      "Every claim is a question: a percentage needs a denominator, an improvement needs a baseline and the data it was measured on.",
      "If you can't explain a claim for ten minutes, reword it or drop it."
    ],
    "resources": [
      {
        "id": "AIE-02-r1",
        "kind": "doc",
        "title": "Your AI Product Needs Evals",
        "source": "hamel.dev",
        "url": "https://hamel.dev/blog/posts/evals/",
        "minutes": 25,
        "estimate": true,
        "note": "Why a measured result is the strongest thing a project can show, and what a real eval loop looks like."
      },
      {
        "id": "AIE-02-r2",
        "kind": "video",
        "title": "5 AI Engineer Projects to Build in 2026 | Ex-Google, Microsoft",
        "source": "Aishwarya Srinivasan",
        "url": "https://www.youtube.com/watch?v=9WIsvEswZTk",
        "minutes": 20,
        "note": "Use it as a checklist of what reviewers expect a project to show — evals, deployment, monitoring — not as ideas to copy."
      }
    ],
    "minutes": 45,
    "duration": "≈45m",
    "questions": [
      "Walk me through an LLM feature you built, in two minutes.",
      "Your background is backend. Why an AI role?",
      "You say hybrid search helped. Did it beat vector-only, and by how much?",
      "You cut LLM calls by 80%. 80% of what, measured how?",
      "What would make your project production-grade?"
    ],
    "asked": {
      "posts": 0,
      "items": 5
    }
  },
  {
    "id": "LLM-01",
    "section": "B",
    "sectionLabel": "How LLMs work",
    "priority": "P1",
    "title": "How LLMs behave — tokens, context, sampling, hallucination",
    "why": "The LLM-basics questions are short but unforgiving of vagueness: tokens against words, why long context costs more, what temperature changes, why temperature 0 still isn't deterministic, and where hallucinations come from. Karpathy's one-hour talk is the best single use of an hour here.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "explain tokenisation, the context window, the KV cache, sampling and hallucination in plain words, with one example each.",
      "tooDeep": "attention maths, positional encodings, training objectives."
    },
    "know": [
      "Tokens aren't words (English averages roughly ¾ of a word per token; code and other languages differ). Billing, limits and chunking are all in tokens, and tokenisers differ between providers.",
      "Generation is next-token prediction: the model outputs a probability distribution, sampling picks a token, repeat. Temperature reshapes the distribution; top-p and top-k truncate it.",
      "Temperature 0 isn't fully deterministic: batched inference makes floating-point results depend on server load (batch invariance), and providers change things underneath.",
      "The KV cache stores attention keys and values for tokens already processed, so each new token doesn't recompute the prefix; it grows with context length — one reason long contexts are costly.",
      "Hallucination: the model produces likely, fluent text, not verified facts. Causes: missing knowledge, ambiguous prompts, pressure to answer. Mitigate with grounding, an abstain path, verification, lower temperature for factual tasks.",
      "The context window caps input plus output tokens; quality degrades well before the hard limit."
    ],
    "resources": [
      {
        "id": "LLM-01-r1",
        "kind": "video",
        "title": "[1hr Talk] Intro to Large Language Models",
        "source": "Andrej Karpathy",
        "url": "https://www.youtube.com/watch?v=zjkBMFhNj_g",
        "minutes": 60,
        "note": "00:00–17:52 how they work; 27:43 tool use; 45:43–58:37 security (jailbreaks, and prompt injection at 51:30). Skip the appendix."
      },
      {
        "id": "LLM-01-r2",
        "kind": "video",
        "title": "Large Language Models explained briefly",
        "source": "3Blue1Brown",
        "url": "https://www.youtube.com/watch?v=LPZh9BOjkQs",
        "minutes": 8,
        "note": ""
      },
      {
        "id": "LLM-01-r3",
        "kind": "video",
        "title": "LLM Prompt Engineering with Random Sampling: Temperature, Top-k, Top-p",
        "source": "DataMListic",
        "url": "https://www.youtube.com/watch?v=-BBulGM6xF0",
        "minutes": 8,
        "note": ""
      },
      {
        "id": "LLM-01-r4",
        "kind": "video",
        "title": "Why Large Language Models Hallucinate",
        "source": "IBM Technology",
        "url": "https://www.youtube.com/watch?v=cfqtFvWOfg0",
        "minutes": 10,
        "note": ""
      },
      {
        "id": "LLM-01-r5",
        "kind": "video",
        "title": "How KV Cache Speeds Up LLMs for Faster AI Models on GPUs",
        "source": "IBM Technology",
        "url": "https://www.youtube.com/watch?v=o0gkdZBtwEg",
        "minutes": 11,
        "note": ""
      },
      {
        "id": "LLM-01-r6",
        "kind": "doc",
        "title": "Defeating Nondeterminism in LLM Inference",
        "source": "thinkingmachines.ai",
        "url": "https://thinkingmachines.ai/blog/defeating-nondeterminism-in-llm-inference/",
        "minutes": 30,
        "estimate": true,
        "note": "The real reason temperature 0 still varies. Read the introduction and the batch-invariance section."
      }
    ],
    "minutes": 127,
    "duration": "≈2h 7m",
    "questions": [
      "Why do token counts differ from word counts, and why does it matter?",
      "What do temperature, top-p and top-k change? Why is temperature 0 still not deterministic?",
      "Why does a longer prompt cost more latency and money? What is the KV cache?",
      "Name three causes of hallucination and a mitigation for each.",
      "What happens at the context-window limit?"
    ],
    "asked": {
      "posts": 0,
      "items": 5
    }
  },
  {
    "id": "LLM-04",
    "section": "B",
    "sectionLabel": "How LLMs work",
    "priority": "P1",
    "title": "Prompting techniques — structure, few-shot, chain-of-thought, prompts as code",
    "why": "Every AI engineer writes prompts daily, and interviewers check you treat it as engineering: a clear structure, examples chosen on purpose, chain-of-thought and self-consistency where they help, prompt chaining instead of one giant prompt, and every change tested on a labelled set.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "structure a production prompt, choose few-shot examples well, say when chain-of-thought helps, and describe a versioned, tested prompt workflow.",
      "tooDeep": "prompt-optimisation research; collecting “magic phrases”."
    },
    "know": [
      "Structure: role and goal, rules with edge cases, examples, output schema, and clearly delimited input.",
      "Few-shot examples should cover hard boundaries, balance labels and vary wording; dynamic few-shot retrieves similar examples per input.",
      "Chain-of-thought helps multi-step reasoning on standard models; self-consistency samples several paths and votes; reasoning models think internally.",
      "ReAct alternates thought, tool call and observation; describe tools and stop rules well.",
      "Split big prompts into chains with code checks between steps.",
      "Prompts are code: version control, test set per category, version recorded on every trace, re-test on model upgrades."
    ],
    "resources": [
      {
        "id": "LLM-04-r1",
        "kind": "video",
        "title": "Prompting 101 | Code w/ Claude",
        "source": "Anthropic",
        "url": "https://www.youtube.com/watch?v=ysPbXH0LpIE",
        "minutes": 25,
        "note": ""
      },
      {
        "id": "LLM-04-r2",
        "kind": "video",
        "title": "AI prompt engineering: A deep dive",
        "source": "Anthropic",
        "url": "https://www.youtube.com/watch?v=T9aRN5JkmL8",
        "minutes": 77,
        "note": "Long: Anthropic's prompt engineers discussing how they actually work. Listen to the first half."
      },
      {
        "id": "LLM-04-r3",
        "kind": "doc",
        "title": "Prompt engineering overview",
        "source": "platform.claude.com",
        "url": "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview",
        "minutes": 25,
        "estimate": true,
        "note": ""
      },
      {
        "id": "LLM-04-r4",
        "kind": "doc",
        "title": "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models",
        "source": "arxiv.org",
        "url": "https://arxiv.org/abs/2201.11903",
        "minutes": 10,
        "estimate": true,
        "note": "Read the abstract and the first figure."
      }
    ],
    "minutes": 137,
    "duration": "≈2h 17m",
    "questions": [
      "How do you structure a production prompt?",
      "When does chain-of-thought help, and when doesn't it?",
      "How do you choose few-shot examples?",
      "Your team keeps hand-patching a prompt and each fix breaks something else. What process do you put in place?"
    ],
    "asked": {
      "posts": 0,
      "items": 4
    }
  },
  {
    "id": "LLM-07",
    "section": "B",
    "sectionLabel": "How LLMs work",
    "priority": "P1",
    "title": "How transformers work — tokens, attention, layers (conceptual)",
    "why": "AI engineer loops don't ask you to derive attention, but they do ask “explain attention in a minute”, “why does a longer prompt cost more?”, “why is long context hard?” and “what is a mixture-of-experts model?”. The conceptual picture of the transformer answers all of them and grounds everything about context, cost and KV caches.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "walk text → tokens → vectors → attention and feed-forward layers → next-token probabilities, and use it to explain cost, long-context limits and the KV cache.",
      "tooDeep": "attention maths, positional-encoding formulas, training objectives."
    },
    "know": [
      "Tokens are embedded as vectors plus position information; every later step works on that list of vectors.",
      "Attention: each token's query is compared with earlier tokens' keys, giving weights for a mix of their values; multi-head runs several in parallel.",
      "Chat models are decoder-only with causal attention (only look backwards); embedding models and rerankers are usually encoders.",
      "A layer is attention plus a feed-forward network; much factual knowledge sits in feed-forward weights.",
      "Attention work grows roughly with the square of the length; the KV cache grows with context and limits batch size.",
      "Mixture of experts: a router sends each token to a few expert networks, so only part of a huge model runs per token."
    ],
    "resources": [
      {
        "id": "LLM-07-r1",
        "kind": "video",
        "title": "Transformers, the tech behind LLMs | Deep Learning Chapter 5",
        "source": "3Blue1Brown",
        "url": "https://www.youtube.com/watch?v=wjZofJX0v4M",
        "minutes": 27,
        "note": ""
      },
      {
        "id": "LLM-07-r2",
        "kind": "video",
        "title": "Attention in transformers, step-by-step | Deep Learning Chapter 6",
        "source": "3Blue1Brown",
        "url": "https://www.youtube.com/watch?v=eMlx5fFNoYc",
        "minutes": 26,
        "note": ""
      },
      {
        "id": "LLM-07-r3",
        "kind": "doc",
        "title": "The Illustrated Transformer",
        "source": "jalammar.github.io",
        "url": "https://jalammar.github.io/illustrated-transformer/",
        "minutes": 30,
        "estimate": true,
        "note": "The classic visual walkthrough of queries, keys, values and multi-head attention."
      }
    ],
    "minutes": 83,
    "duration": "≈1h 23m",
    "questions": [
      "Explain attention in one minute.",
      "Why does a longer prompt cost more time and money?",
      "Encoder vs decoder models — which do you use where?",
      "What is a mixture-of-experts model?"
    ],
    "asked": {
      "posts": 0,
      "items": 4
    }
  },
  {
    "id": "RAG-01",
    "section": "R",
    "sectionLabel": "RAG",
    "priority": "P0",
    "title": "RAG end to end — every stage, and the choice you make at each",
    "why": "The standard opener: “you have 10,000 documents and a question — what happens between pressing Enter and the answer?”. It tests whether you can walk the offline and online pipelines in order, name a deliberate choice at each stage, and say when you wouldn't use RAG at all. Every other topic in this section zooms into one of these stages.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "draw both pipelines from memory and name one choice and its trade-off per stage.",
      "tooDeep": "framework loader APIs; every query-transformation variant (that's RAG-05)."
    },
    "know": [
      "Offline: load → parse (tables, headings) → chunk → embed → index (vector + keyword), with metadata: source, version, ACL, timestamp.",
      "Online: query → (rewrite) → retrieve top-k → (rerank to top-n) → assemble context with ids → generate with citations → (check groundedness).",
      "The levers in order of payoff: retrieval quality, then context assembly, then the prompt. Most “hallucinations” are retrieval misses.",
      "Measure retrieval and generation separately: recall@k says whether the answer was even in the context.",
      "Skip RAG when the corpus is small and static (put it in the prompt and cache it), when the question is an aggregation (SQL), or when the gap is behaviour, not knowledge."
    ],
    "resources": [
      {
        "id": "RAG-01-r1",
        "kind": "video",
        "title": "RAG From Scratch: Part 1 (Overview)",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=wd7TZ4w1mSw",
        "minutes": 5,
        "note": "Parts 1–4 of Lance Martin's RAG From Scratch: five minutes each, the whole pipeline."
      },
      {
        "id": "RAG-01-r2",
        "kind": "video",
        "title": "RAG From Scratch: Part 2 (Indexing)",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=bjb_EMsTDKI",
        "minutes": 5,
        "note": ""
      },
      {
        "id": "RAG-01-r3",
        "kind": "video",
        "title": "RAG From Scratch: Part 3 (Retrieval)",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=LxNVgdIz9sU",
        "minutes": 5,
        "note": ""
      },
      {
        "id": "RAG-01-r4",
        "kind": "video",
        "title": "RAG From Scratch: Part 4 (Generation)",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=Vw52xyyFsB8",
        "minutes": 6,
        "note": ""
      },
      {
        "id": "RAG-01-r5",
        "kind": "video",
        "title": "Building Production-Ready RAG Applications: Jerry Liu",
        "source": "AI Engineer",
        "url": "https://www.youtube.com/watch?v=TRjq7t2Ms5I",
        "minutes": 19,
        "note": "What changes between a demo and production RAG: parsing, chunking, retrieval, evaluation."
      },
      {
        "id": "RAG-01-r6",
        "kind": "doc",
        "title": "Build a custom RAG agent with LangGraph",
        "source": "docs.langchain.com",
        "url": "https://docs.langchain.com/oss/python/langgraph/agentic-rag",
        "minutes": 30,
        "estimate": true,
        "note": "The current reference implementation: retrieval as a tool, document grading and query rewriting in a graph."
      }
    ],
    "minutes": 70,
    "duration": "≈1h 10m",
    "questions": [
      "You have a 200-page PDF and a question. What happens between pressing Enter and the answer?",
      "Where does the latency go, and what would you cache?",
      "When would you not use RAG?",
      "How do you make the answer cite sources, and check that the citations are real?",
      "A source document is edited. What has to change in the index?"
    ],
    "asked": {
      "posts": 0,
      "items": 5
    }
  },
  {
    "id": "RAG-02",
    "section": "R",
    "sectionLabel": "RAG",
    "priority": "P0",
    "title": "Chunking and embeddings",
    "why": "Chunking is the first “one level deeper” question after the RAG diagram and the cheapest lever you control. Chunks too large dilute the embedding and waste context; too small lose the meaning around them. Expect “how did you choose your chunk size?” — the only strong answer is “I swept it against a retrieval eval” — and “how did you pick the embedding model?”.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "explain four chunking strategies with their trade-offs, parent-child retrieval, contextual retrieval, and how you'd pick an embedder for your own data.",
      "tooDeep": "training embedding models; transformer pooling internals."
    },
    "know": [
      "Strategies: fixed-size with overlap · recursive by separators (paragraph → line → sentence) · structure-aware (headings, sections, tables) · semantic (split where neighbouring sentences stop being similar). Recursive at a few hundred tokens is a strong baseline.",
      "Count tokens, not characters: an embedder silently truncates past its maximum input, often 512 tokens.",
      "Parent-child (small-to-big): embed small chunks for precise matching, return their parent section for context.",
      "Contextual retrieval: prepend an LLM-written sentence that situates each chunk in its document, for both embedding and BM25. Anthropic reports far fewer retrieval failures, and fewer still with a reranker.",
      "Pick an embedder on your own eval set, not the MTEB leaderboard. Weigh dimensions, maximum input length, languages, cost and self-hosting.",
      "Normalised vectors make cosine equal to dot product. Changing the embedder means re-embedding the whole corpus."
    ],
    "resources": [
      {
        "id": "RAG-02-r1",
        "kind": "video",
        "title": "The BEST Way to Chunk Text for RAG",
        "source": "Adam Lucek",
        "url": "https://www.youtube.com/watch?v=Pk2BeaGbcTE",
        "minutes": 33,
        "note": ""
      },
      {
        "id": "RAG-02-r2",
        "kind": "video",
        "title": "Stop Picking Embedding Models Off The MTEB Leaderboard",
        "source": "Hamel Husain",
        "url": "https://www.youtube.com/watch?v=0KUHkwkThyc",
        "minutes": 22,
        "note": ""
      },
      {
        "id": "RAG-02-r3",
        "kind": "video",
        "title": "The Best RAG Technique Yet? Anthropic’s Contextual Retrieval Explained!",
        "source": "Prompt Engineering",
        "url": "https://www.youtube.com/watch?v=tmiBae2goJM",
        "minutes": 16,
        "note": "Contextual retrieval: why a chunk out of context retrieves badly, and the fix."
      },
      {
        "id": "RAG-02-r4",
        "kind": "doc",
        "title": "Evaluating Chunking Strategies for Retrieval",
        "source": "trychroma.com",
        "url": "https://www.trychroma.com/research/evaluating-chunking",
        "minutes": 20,
        "estimate": true,
        "note": "Measures chunkers by token-level recall and precision. The method is the thing to copy for your own sweep."
      },
      {
        "id": "RAG-02-r5",
        "kind": "doc",
        "title": "Introducing Contextual Retrieval",
        "source": "anthropic.com",
        "url": "https://www.anthropic.com/research/contextual-retrieval",
        "minutes": 15,
        "estimate": true,
        "note": ""
      }
    ],
    "minutes": 106,
    "duration": "≈1h 46m",
    "questions": [
      "How do you choose chunk size and overlap?",
      "What is parent-child retrieval, and when does it help?",
      "What is contextual retrieval, and what does it cost?",
      "How would you pick an embedding model?",
      "Cosine similarity, dot product or L2 — which, and why?"
    ],
    "asked": {
      "posts": 0,
      "items": 5
    }
  },
  {
    "id": "RAG-03",
    "section": "R",
    "sectionLabel": "RAG",
    "priority": "P0",
    "title": "Vector search internals — HNSW, IVF, filtering, pgvector",
    "why": "HNSW and pgvector sit under almost every RAG system, so expect “how does HNSW work?” and “what happens when you filter?”. You need HNSW at the level of the graph and its three parameters, IVF as the alternative, and the filtered-search problem: a filter applied after the ANN search throws away results, which is exactly what partitioned indexes and pgvector's iterative scans exist to fix.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "explain HNSW layers and greedy search, what m / ef_construction / ef_search trade, pre- vs post-filtering, and IVF lists and probes.",
      "tooDeep": "ANN proofs, product-quantisation maths, writing an index from scratch."
    },
    "know": [
      "ANN trades exactness for speed: you tune recall against latency, and you should measure recall against an exact scan on a sample.",
      "HNSW: a multi-layer proximity graph; search enters at the sparse top layer and greedily descends. `m` = links per node (recall and memory up), `ef_construction` = build-time candidate list (quality and build time up), `ef_search` = query-time candidate list (recall and latency up).",
      "IVFFlat: k-means into `lists`; a query scans the nearest `probes` lists. Faster to build and smaller, but needs training data and degrades as data drifts.",
      "Post-filtering after ANN can return fewer than k (the index only kept ef_search candidates); pre-filtering inside the graph breaks its connectivity. Fixes: partition by the filter, pgvector ≥ 0.8 iterative index scans, filter-aware engines.",
      "pgvector specifics: `hnsw.ef_search`, `hnsw.iterative_scan`; the operator class must match the query's distance operator; no index means an exact sequential scan."
    ],
    "resources": [
      {
        "id": "RAG-03-r1",
        "kind": "video",
        "title": "Vector Database Search - Hierarchical Navigable Small Worlds (HNSW) Explained",
        "source": "DataMListic",
        "url": "https://www.youtube.com/watch?v=77QH0Y2PYKg",
        "minutes": 8,
        "note": ""
      },
      {
        "id": "RAG-03-r2",
        "kind": "video",
        "title": "HNSW for Vector Search Explained and Implemented with Faiss (Python)",
        "source": "James Briggs",
        "url": "https://www.youtube.com/watch?v=QvKMwLjdK-s",
        "minutes": 35,
        "note": ""
      },
      {
        "id": "RAG-03-r3",
        "kind": "video",
        "title": "Metadata Filtering for Vector Search + Latest Filter Tech",
        "source": "James Briggs",
        "url": "https://www.youtube.com/watch?v=H_kJDHvu-v8",
        "minutes": 34,
        "note": "02:03–12:22 is the concept: why filter, pre-filter, post-filter, single-stage. The rest is Pinecone API code you can skip."
      },
      {
        "id": "RAG-03-r4",
        "kind": "doc",
        "title": "Hierarchical Navigable Small Worlds (HNSW)",
        "source": "pinecone.io",
        "url": "https://www.pinecone.io/learn/series/faiss/hnsw/",
        "minutes": 25,
        "estimate": true,
        "note": ""
      },
      {
        "id": "RAG-03-r5",
        "kind": "doc",
        "title": "pgvector README",
        "source": "github.com/pgvector",
        "url": "https://github.com/pgvector/pgvector",
        "minutes": 20,
        "estimate": true,
        "note": "Read the HNSW, IVFFlat, Filtering and Iterative Index Scans sections."
      }
    ],
    "minutes": 122,
    "duration": "≈2h 2m",
    "questions": [
      "Explain how HNSW finds nearest neighbours.",
      "What do m, ef_construction and ef_search control? How would you tune them?",
      "Pre-filtering vs post-filtering in vector search — what goes wrong with each?",
      "HNSW or IVFFlat in pgvector?",
      "Why one HNSW index per session instead of one shared table with a filter?"
    ],
    "asked": {
      "posts": 0,
      "items": 5
    }
  },
  {
    "id": "RAG-04",
    "section": "R",
    "sectionLabel": "RAG",
    "priority": "P0",
    "title": "Hybrid search and reranking — BM25, RRF, cross-encoders",
    "why": "Hybrid search is the standard production retrieval setup, so expect: when keyword beats vector, how BM25 scores, how you merge two ranked lists (RRF), and why a cross-encoder can rerank but can't retrieve. Then the cost push: a reranker adds latency to every query, so know when it pays and how you'd prove it.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "write BM25's ingredients and the RRF formula, explain bi- vs cross-encoders, and give a latency budget for a reranker.",
      "tooDeep": "learning-to-rank theory; training your own reranker."
    },
    "know": [
      "Vector search wins on paraphrase and meaning; keyword search (BM25) wins on exact identifiers, codes, names and rare terms. Logs, SKUs and error codes are lexical.",
      "BM25 = IDF (rare terms weigh more) × saturating term frequency (k1) × length normalisation (b). Postgres `ts_rank` is not BM25: it has no corpus-wide IDF.",
      "RRF: score(d) = Σ 1 / (k + rank_i(d)), k ≈ 60. Rank-based, so no score calibration between retrievers; a document found by both lists rises.",
      "Two-stage retrieval: cheap, recall-oriented retrieval of 50–100 candidates → an expensive, precision-oriented reranker keeps the top 5–10.",
      "Bi-encoder: query and document embedded separately (precomputable, fast). Cross-encoder: both read together (accurate, nothing precomputable, cost grows with candidates). ColBERT's late interaction sits between.",
      "A reranker costs roughly 50–300 ms per query; weigh the MRR gain against the p95 it adds."
    ],
    "resources": [
      {
        "id": "RAG-04-r1",
        "kind": "video",
        "title": "PostgreSQL Hybrid Search Course – Keyword (BM25) + Vector Retrieval",
        "source": "freeCodeCamp.org",
        "url": "https://www.youtube.com/watch?v=kT7nXO32L-Q",
        "minutes": 60,
        "note": "07:20 BM25 (IDF, term frequency, document length); 27:40 BM25 inside Postgres; 43:28 Reciprocal Rank Fusion. Your own stack: Postgres plus pgvector."
      },
      {
        "id": "RAG-04-r2",
        "kind": "video",
        "title": "Understanding Reciprocal Rank Fusion in Hybrid Search [Advanced RAG]",
        "source": "TechViz - The Data Science Guy",
        "url": "https://www.youtube.com/watch?v=6dDvfGrxFns",
        "minutes": 8,
        "note": ""
      },
      {
        "id": "RAG-04-r3",
        "kind": "video",
        "title": "Rerank for better RAG (Explained)",
        "source": "vectorize",
        "url": "https://www.youtube.com/watch?v=K1F8BIgcoNk",
        "minutes": 14,
        "note": ""
      },
      {
        "id": "RAG-04-r4",
        "kind": "video",
        "title": "Do Reranking Models Actually Improve RAG?",
        "source": "Adam Lucek",
        "url": "https://www.youtube.com/watch?v=7ZU85v4Kt-Y",
        "minutes": 32,
        "note": "A sceptical test of whether rerankers help. Use it for “when is reranking not worth it?”."
      },
      {
        "id": "RAG-04-r5",
        "kind": "doc",
        "title": "Rerankers and Two-Stage Retrieval",
        "source": "pinecone.io",
        "url": "https://www.pinecone.io/learn/series/rag/rerankers/",
        "minutes": 20,
        "estimate": true,
        "note": ""
      },
      {
        "id": "RAG-04-r6",
        "kind": "doc",
        "title": "Hybrid Search in PostgreSQL: The Missing Manual",
        "source": "paradedb.com",
        "url": "https://www.paradedb.com/blog/hybrid-search-in-postgresql-the-missing-manual",
        "minutes": 20,
        "estimate": true,
        "note": "Why ts_rank is not BM25, and how RRF is done in SQL."
      }
    ],
    "minutes": 154,
    "duration": "≈2h 34m",
    "questions": [
      "Write the RRF formula. Why k = 60, and why rank-based?",
      "Explain BM25. What does it do better than TF-IDF?",
      "Bi-encoder vs cross-encoder — why not retrieve with the cross-encoder?",
      "On your data, hybrid search had a lower MRR than keyword search alone. What do you do?",
      "When is reranking not worth it?"
    ],
    "asked": {
      "posts": 0,
      "items": 5
    }
  },
  {
    "id": "RAG-05",
    "section": "R",
    "sectionLabel": "RAG",
    "priority": "P0",
    "title": "Query transformation, routing and corrective RAG",
    "why": "The user's question is often a bad search query: vague, multi-part, or phrased unlike the documents. Query transformation fixes the input; corrective RAG checks the retrieval and loops when it's weak. Draw corrective RAG from memory with its loop bound and fallback, and be ready for the cost question: every grade and every rewrite is another LLM call.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "name four query transformations with one use each, draw corrective RAG with its bound and fallback, and say what it costs per query.",
      "tooDeep": "every RAG paper variant; how Self-RAG's reflection tokens are trained."
    },
    "know": [
      "Multi-query / RAG-Fusion: 3–5 rephrasings, retrieve for each, fuse with RRF. Lifts recall on vague questions; costs one LLM call and N retrievals.",
      "Decomposition splits multi-part questions; step-back asks a more general question first; HyDE embeds a hypothetical answer instead of the question.",
      "Routing: classify the query and send it to the right index, tool or SQL — or to no retrieval at all.",
      "Corrective RAG: retrieve → grade relevance → if weak, rewrite the query (or search elsewhere) and re-retrieve → generate. Bound the loop (e.g. 2 rewrites) and fall back to the best retrieval so far.",
      "Self-RAG / adaptive RAG: decide whether to retrieve at all, and check the answer is supported. In practice: a groundedness check after generation.",
      "Agentic RAG: retrieval exposed as a tool the agent calls when it chooses. Flexible, but harder to bound and to evaluate."
    ],
    "resources": [
      {
        "id": "RAG-05-r1",
        "kind": "video",
        "title": "Self-reflective RAG with LangGraph: Self-RAG and CRAG",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=pbAd8O1Lvm4",
        "minutes": 18,
        "note": "Self-RAG and corrective RAG as LangGraph graphs — the shape to draw in an interview."
      },
      {
        "id": "RAG-05-r2",
        "kind": "video",
        "title": "RAG from scratch: Part 5 (Query Translation -- Multi Query)",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=JChPi0CRnDY",
        "minutes": 6,
        "note": ""
      },
      {
        "id": "RAG-05-r3",
        "kind": "video",
        "title": "RAG from scratch: Part 7 (Query Translation -- Decomposition)",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=h0OPWlEOank",
        "minutes": 7,
        "note": ""
      },
      {
        "id": "RAG-05-r4",
        "kind": "video",
        "title": "RAG from scratch: Part 9 (Query Translation -- HyDE)",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=SaDzIVkYqyY",
        "minutes": 5,
        "note": ""
      },
      {
        "id": "RAG-05-r5",
        "kind": "video",
        "title": "RAG from scratch: Part 10 (Routing)",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=pfpIndq7Fi8",
        "minutes": 7,
        "note": ""
      },
      {
        "id": "RAG-05-r6",
        "kind": "doc",
        "title": "Corrective Retrieval Augmented Generation",
        "source": "arxiv.org",
        "url": "https://arxiv.org/abs/2401.15884",
        "minutes": 15,
        "estimate": true,
        "note": "Skim the abstract and the method figure: a retrieval evaluator and three actions (correct, incorrect, ambiguous)."
      }
    ],
    "minutes": 58,
    "duration": "≈58m",
    "questions": [
      "Draw corrective RAG. What stops it looping forever?",
      "What does corrective RAG cost, and how do you know it's worth it?",
      "Multi-query, HyDE or decomposition — when each?",
      "What is agentic RAG, and what are its risks?",
      "How would you route a query between a vector index, SQL and “no retrieval”?"
    ],
    "asked": {
      "posts": 0,
      "items": 5
    }
  },
  {
    "id": "RAG-06",
    "section": "R",
    "sectionLabel": "RAG",
    "priority": "P1",
    "title": "Debugging RAG — the failure taxonomy",
    "why": "“The right document exists but the answer is wrong — debug it” is a standard question. Strong answers split the pipeline and test each stage — ingestion, freshness, filters, chunking, query, retrieval, ranking, context assembly, generation — measuring retrieval and generation separately before anyone touches the prompt.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "put a failing answer into a stage within minutes of opening its trace, and name the fix for each stage.",
      "tooDeep": "building an observability product."
    },
    "know": [
      "First question: was the answer in the retrieved context? No → ingestion or retrieval. Yes → context assembly or generation.",
      "Ingestion: bad parsing (tables, scanned PDFs), missing documents, a stale index, a wrong ACL filter. Retrieval: chunk boundaries, vocabulary mismatch, k too small, poor ranking.",
      "Context assembly: the right chunk was retrieved but cut by the token budget, buried mid-context, or contradicted by another chunk.",
      "Generation: the model prefers its own knowledge to the context, answers when the context is insufficient, or cites the wrong source.",
      "Lost in the middle and context rot: long, noisy context degrades how well relevant facts are used — fewer, better chunks usually beat more.",
      "Fix by failure category, measured on the eval set — never by tweaking the prompt against one example."
    ],
    "resources": [
      {
        "id": "RAG-06-r1",
        "kind": "video",
        "title": "How to debug Retrieval for RAG",
        "source": "Hamel Husain",
        "url": "https://www.youtube.com/watch?v=N9SZ9o2gReE",
        "minutes": 41,
        "note": "04:36 how DCG and NDCG work; 18:11 “the first thing to do on any RAG team”; 37:02 the inner and outer loops of retrieval quality."
      },
      {
        "id": "RAG-06-r2",
        "kind": "video",
        "title": "Lost in the Middle: How Language Models use Long Context - Explained!",
        "source": "Weaviate vector database",
        "url": "https://www.youtube.com/watch?v=Kf3LeaUGwlg",
        "minutes": 24,
        "note": ""
      },
      {
        "id": "RAG-06-r3",
        "kind": "doc",
        "title": "Systematically Improving Your RAG",
        "source": "jxnl.co",
        "url": "https://jxnl.co/writing/2024/05/22/systematically-improving-your-rag/",
        "minutes": 20,
        "estimate": true,
        "note": "Segment questions by type, find the segments that fail, fix those first."
      },
      {
        "id": "RAG-06-r4",
        "kind": "doc",
        "title": "Context Rot: How Increasing Input Tokens Impacts LLM Performance",
        "source": "trychroma.com",
        "url": "https://www.trychroma.com/research/context-rot",
        "minutes": 20,
        "estimate": true,
        "note": "Evidence that adding tokens degrades performance even on simple tasks — the case for fewer, better chunks."
      }
    ],
    "minutes": 105,
    "duration": "≈1h 45m",
    "questions": [
      "The right document exists, but the answer is wrong. Debug it.",
      "How do you tell a retrieval failure from a generation failure at scale?",
      "What is “lost in the middle”, and what do you do about it?",
      "The model answers confidently when the context doesn't contain the answer. Fix it."
    ],
    "asked": {
      "posts": 0,
      "items": 4
    }
  },
  {
    "id": "RAG-08",
    "section": "R",
    "sectionLabel": "RAG",
    "priority": "P1",
    "title": "Embeddings in depth — how they are trained, dimensions, fine-tuning",
    "why": "After “how does RAG work?” comes “why do embeddings put similar meanings close together, and what do you do when they don't for your domain?”. Knowing contrastive training, query/document prefixes, Matryoshka dimensions and when to fine-tune an embedder separates people who used an embedding API from people who can fix retrieval.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "explain contrastive training with in-batch and hard negatives, bi-encoder asymmetry, dimension and precision trade-offs, and the steps to fine-tune an embedder on your own pairs.",
      "tooDeep": "transformer pooling variants; training loss derivations."
    },
    "know": [
      "Embedding models learn “similar” from pairs that belong together (question-answer, query-click), pulled together while non-matching texts are pushed apart (contrastive learning).",
      "In-batch negatives come free from other pairs in a batch; hard negatives (similar but wrong) teach fine distinctions.",
      "Many models expect prefixes such as `query:` and `passage:`; using the wrong one silently lowers quality.",
      "Matryoshka embeddings stay useful when truncated to fewer dimensions; dimensions × precision decide memory.",
      "Fine-tune an embedder on real query-chunk pairs plus mined hard negatives when domain vocabulary defeats general models; measure recall@k before switching."
    ],
    "resources": [
      {
        "id": "RAG-08-r1",
        "kind": "video",
        "title": "Training State-of-the-Art Sentence Embedding Models",
        "source": "Nils Reimers",
        "url": "https://www.youtube.com/watch?v=RHXZKUr8qOY",
        "minutes": 44,
        "note": "From the author of sentence-transformers: how state-of-the-art embedding models are trained."
      },
      {
        "id": "RAG-08-r2",
        "kind": "video",
        "title": "Stop Picking Embedding Models Off The MTEB Leaderboard",
        "source": "Hamel Husain",
        "url": "https://www.youtube.com/watch?v=0KUHkwkThyc",
        "minutes": 22,
        "note": ""
      },
      {
        "id": "RAG-08-r3",
        "kind": "doc",
        "title": "SentenceTransformers documentation",
        "source": "sbert.net",
        "url": "https://sbert.net/",
        "minutes": 20,
        "estimate": true,
        "note": "Read the training overview and the losses page (MultipleNegativesRankingLoss is the in-batch negatives loss)."
      },
      {
        "id": "RAG-08-r4",
        "kind": "doc",
        "title": "Binary and Scalar Embedding Quantization",
        "source": "huggingface.co",
        "url": "https://huggingface.co/blog/embedding-quantization",
        "minutes": 20,
        "estimate": true,
        "note": ""
      }
    ],
    "minutes": 106,
    "duration": "≈1h 46m",
    "questions": [
      "Why do embeddings put similar meanings close together?",
      "What are hard negatives, and why do they matter?",
      "Your domain vocabulary keeps defeating the embedding model. What do you do, in order?",
      "What are Matryoshka embeddings, and why would you use them?"
    ],
    "asked": {
      "posts": 0,
      "items": 4
    }
  },
  {
    "id": "RAG-10",
    "section": "R",
    "sectionLabel": "RAG",
    "priority": "P1",
    "title": "Document ingestion — PDFs, tables, OCR and keeping the index in sync",
    "why": "Most real RAG failures start before retrieval: two-column PDFs read in the wrong order, tables flattened into one line, scanned pages with no text, headers repeated on every chunk. Interviewers who have shipped RAG ask how you handle tables and scans, and how the index stays in sync as documents change.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "walk the ingestion pipeline, explain how you'd handle tables, scans and boilerplate, and describe incremental re-indexing with content hashes.",
      "tooDeep": "OCR model internals; writing your own layout parser."
    },
    "know": [
      "Detect the document type first: a digital PDF has a text layer; a scan needs OCR.",
      "Layout-aware parsers (Docling, Unstructured, or a vision model per page) recover reading order, headings and tables.",
      "Tables: one chunk per row with column names repeated, a summary chunk for the table, and SQL for very large tables.",
      "Clean before chunking: drop headers, footers and boilerplate; mask personal data.",
      "Incremental ingestion: hash each document, re-process only changes, delete old chunks in the same step, track parser version."
    ],
    "resources": [
      {
        "id": "RAG-10-r1",
        "kind": "video",
        "title": "What Is Docling? Transforming Unstructured Data for RAG and AI",
        "source": "IBM Technology",
        "url": "https://www.youtube.com/watch?v=zSA7ylHP6AY",
        "minutes": 8,
        "note": ""
      },
      {
        "id": "RAG-10-r2",
        "kind": "doc",
        "title": "Docling documentation",
        "source": "docling-project.github.io",
        "url": "https://docling-project.github.io/docling/",
        "minutes": 15,
        "estimate": true,
        "note": "An open-source parser that recovers layout, reading order and tables from PDFs and office documents."
      }
    ],
    "minutes": 23,
    "duration": "≈23m",
    "questions": [
      "How would you handle tables in a RAG system?",
      "Some of your PDFs are scans. What changes?",
      "How do you keep the index in sync as 12,000 documents change?"
    ],
    "asked": {
      "posts": 0,
      "items": 3
    }
  },
  {
    "id": "RAG-07",
    "section": "R",
    "sectionLabel": "RAG",
    "priority": "P2",
    "title": "Beyond vector RAG — long context, GraphRAG, structured data",
    "why": "Follow-ups that sound senior: “with million-token windows, is RAG dead?”, “how would you answer questions across the whole corpus?”, and “the answer lives in a database table”. Know when to put everything in the context, when a knowledge graph earns its indexing cost (multi-hop and global questions), and when retrieval is really text-to-SQL.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "argue long context against RAG on cost, latency, recall and access control, and say what GraphRAG's global search is for.",
      "tooDeep": "building GraphRAG; graph-database internals."
    },
    "know": [
      "Long context doesn't remove RAG: cost and latency scale with tokens, quality degrades with length, and there's no per-user access control, freshness or citation by default. Combine them: retrieve, then use a generous window.",
      "Prompt caching makes long static context cheap — the right answer for a small, stable corpus.",
      "GraphRAG: extract entities and relations into a graph, cluster it into communities and pre-summarise them. Local search for entity questions; global search for “what are the main themes across everything?”. Indexing is expensive.",
      "Structured data: counts, sums and filters belong in SQL — a guarded text-to-SQL tool or a typed API."
    ],
    "resources": [
      {
        "id": "RAG-07-r1",
        "kind": "video",
        "title": "Is RAG Still Needed? Choosing the Best Approach for LLMs",
        "source": "IBM Technology",
        "url": "https://www.youtube.com/watch?v=UabBYexBD4k",
        "minutes": 11,
        "note": ""
      },
      {
        "id": "RAG-07-r2",
        "kind": "video",
        "title": "GraphRAG vs. Traditional RAG: Higher Accuracy & Insight with LLM",
        "source": "IBM Technology",
        "url": "https://www.youtube.com/watch?v=Aw7iQjKAX2k",
        "minutes": 4,
        "note": ""
      },
      {
        "id": "RAG-07-r3",
        "kind": "video",
        "title": "Graph RAG Simply Explained",
        "source": "codebasics",
        "url": "https://www.youtube.com/watch?v=2o0Q85JUZNk",
        "minutes": 14,
        "note": ""
      },
      {
        "id": "RAG-07-r4",
        "kind": "doc",
        "title": "GraphRAG documentation",
        "source": "microsoft.github.io",
        "url": "https://microsoft.github.io/graphrag/",
        "minutes": 20,
        "estimate": true,
        "note": "Read the overview and the local-search and global-search pages."
      }
    ],
    "minutes": 49,
    "duration": "≈49m",
    "questions": [
      "Models have million-token context windows now. Is RAG dead?",
      "What problem does GraphRAG solve that vector RAG doesn't?",
      "“How many tickets were escalated last month, by region?” — RAG or SQL?"
    ],
    "asked": {
      "posts": 0,
      "items": 3
    }
  },
  {
    "id": "RAG-09",
    "section": "R",
    "sectionLabel": "RAG",
    "priority": "P2",
    "title": "Choosing a vector store — pgvector, dedicated databases, search engines",
    "why": "“pgvector or Pinecone?” is a common design follow-up, and “we need a vector database because we're doing RAG” is the weak answer. Know the four families (extension, dedicated database, search engine, library) and the questions that actually decide it: scale, filtering, hybrid search, transactions, write rate and operations.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "name the four families, the deciding questions, and how you'd benchmark two options on your own data.",
      "tooDeep": "feature-by-feature vendor comparisons; internal storage engines."
    },
    "know": [
      "pgvector: vectors next to your data with transactions, joins, access control; great until scale or filtered-search needs outgrow it.",
      "Dedicated vector databases (Qdrant, Weaviate, Milvus, managed Pinecone): filtering, sharding and replication built in.",
      "Search engines (Elasticsearch, OpenSearch): strong BM25 and aggregations with vector fields added.",
      "FAISS is a library: fast in-process search, no durability, filtering or updates.",
      "Decide by benchmarking filtered recall, p95 latency, re-index time and cost on your own data; keep retrieval behind a small interface so you can switch."
    ],
    "resources": [
      {
        "id": "RAG-09-r1",
        "kind": "video",
        "title": "What is a Vector Database? Powering Semantic Search & AI Applications",
        "source": "IBM Technology",
        "url": "https://www.youtube.com/watch?v=gl1r1XV0SLw",
        "minutes": 10,
        "note": ""
      },
      {
        "id": "RAG-09-r2",
        "kind": "doc",
        "title": "What is a Vector Database?",
        "source": "qdrant.tech",
        "url": "https://qdrant.tech/articles/what-is-a-vector-database/",
        "minutes": 15,
        "estimate": true,
        "note": "Written by a vendor; useful for what a dedicated database adds (filtering, sharding, quantisation). Weigh the claims accordingly."
      }
    ],
    "minutes": 25,
    "duration": "≈25m",
    "questions": [
      "pgvector or a dedicated vector database?",
      "When would you pick Elasticsearch or OpenSearch for RAG?",
      "Why isn't FAISS a database?"
    ],
    "asked": {
      "posts": 0,
      "items": 3
    }
  },
  {
    "id": "LC-01",
    "section": "L",
    "sectionLabel": "LangChain + LangGraph",
    "priority": "P0",
    "title": "LangChain v1 — what it is now, and LangChain vs LangGraph",
    "why": "LangChain is on your skills line, so “LangChain vs LangGraph — when each, and would you use LangChain in production?” is a near-certain opener. The answer changed with v1 (October 2025): LangChain is now a thin agent layer — create_agent, standard model and message interfaces, middleware — running on LangGraph's runtime, and the old chains moved to langchain-classic. Answering with 2023-era LangChain is a tell.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "describe the v1 layering (LangChain on LangGraph, Deep Agents on top), what each layer gives you, and when you'd drop down a level.",
      "tooDeep": "LCEL internals; every integration package."
    },
    "know": [
      "Layers: LangGraph = the low-level runtime (state, graph, checkpointing, interrupts, streaming). LangChain = `create_agent` + model, tool and message abstractions + middleware, built on LangGraph. Deep Agents = an opinionated harness (planning, filesystem, subagents) on top.",
      "Use `create_agent` when the design is the standard tool-calling loop; drop to LangGraph for custom control flow — fixed steps, parallel branches, approval gates at chosen points, several agents.",
      "Standard interfaces: chat models with `invoke` / `stream` / `batch`, messages with standard content blocks, `bind_tools`, `with_structured_output` — swap providers without rewriting.",
      "v1 moved legacy chains, retrievers and `LLMChain`-era APIs to `langchain-classic`. LCEL `Runnable`s still live in `langchain-core`.",
      "Production verdict: fine when you own the prompts and trace every call; the costs are abstraction depth when debugging, and version churn."
    ],
    "resources": [
      {
        "id": "LC-01-r1",
        "kind": "doc",
        "title": "What's new in LangChain v1",
        "source": "docs.langchain.com",
        "url": "https://docs.langchain.com/oss/python/releases/langchain-v1",
        "minutes": 15,
        "estimate": true,
        "note": ""
      },
      {
        "id": "LC-01-r2",
        "kind": "video",
        "title": "LangChain vs LangGraph: A Tale of Two Frameworks",
        "source": "IBM Technology",
        "url": "https://www.youtube.com/watch?v=qAF1NjEVHhY",
        "minutes": 10,
        "note": ""
      },
      {
        "id": "LC-01-r3",
        "kind": "video",
        "title": "Deep Agents or LangGraph? The LangChain agentic ecosystem explained",
        "source": "Edward Donner",
        "url": "https://www.youtube.com/watch?v=6VquSiCBVJs",
        "minutes": 15,
        "note": "How LangChain, LangGraph and Deep Agents fit together today — the layering interviewers ask about."
      },
      {
        "id": "LC-01-r4",
        "kind": "course",
        "title": "Introduction to LangChain — Python",
        "source": "LangChain Academy · free",
        "url": "https://academy.langchain.com/courses/foundation-introduction-to-langchain-python",
        "minutes": 0,
        "estimate": false,
        "note": "The official v1 course: create_agent, tools, structured output, middleware, tracing in LangSmith."
      }
    ],
    "minutes": 40,
    "duration": "≈40m",
    "questions": [
      "LangChain vs LangGraph — when do you use each?",
      "Would you use LangChain in production?",
      "What changed in LangChain v1?",
      "What does LCEL give you, and is it still relevant?"
    ],
    "asked": {
      "posts": 0,
      "items": 4
    }
  },
  {
    "id": "LC-02",
    "section": "L",
    "sectionLabel": "LangChain + LangGraph",
    "priority": "P0",
    "title": "Tool calling and structured output — what the framework hides",
    "why": "Every agent rests on two primitives: the model emitting a structured tool call, and your code validating and running it. Interviewers check you understand the loop without a framework and how you get reliable JSON. Practical rounds often ask for exactly this — a tool-calling loop with a step cap against a raw provider SDK.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "write the tool-calling loop by hand, explain how tool schemas reach the model, and give three ways to get valid structured output with their failure modes.",
      "tooDeep": "constrained-decoding internals; every provider's API differences."
    },
    "know": [
      "Tool calling: you send tool names, descriptions and JSON schemas; the model returns a tool call (name + JSON arguments) instead of text; your code runs it and appends the result as a tool message with the call's id; repeat until a final answer or a cap.",
      "The model never executes anything — your code does. Validate arguments, check permissions, and return errors as tool results the model can read.",
      "Tool definitions cost input tokens on every call, and their descriptions are prompts: vague ones cause wrong tool choice.",
      "Structured output, weakest to strongest: “please return JSON” → JSON mode → tool calling with a schema → provider-native strict schemas (constrained decoding). Always validate (Pydantic) and retry once with the error.",
      "Parallel tool calls: one turn can contain several calls; run them concurrently and return each result under its own id."
    ],
    "resources": [
      {
        "id": "LC-02-r1",
        "kind": "video",
        "title": "How LLM Tool Calling Works",
        "source": "Tommy Eberle",
        "url": "https://www.youtube.com/watch?v=QiRdYCNXAxk",
        "minutes": 16,
        "note": ""
      },
      {
        "id": "LC-02-r2",
        "kind": "video",
        "title": "LLM Function Calling - AI Tools Deep Dive",
        "source": "Adam Lucek",
        "url": "https://www.youtube.com/watch?v=gMeTK6zzaO4",
        "minutes": 31,
        "note": ""
      },
      {
        "id": "LC-02-r3",
        "kind": "video",
        "title": "Structured Output from LLMs: Grammars, Regex, and State Machines",
        "source": "Efficient NLP",
        "url": "https://www.youtube.com/watch?v=xpvFinvqRCA",
        "minutes": 17,
        "note": "How strict structured output works underneath: constraining which tokens the model may emit."
      },
      {
        "id": "LC-02-r4",
        "kind": "doc",
        "title": "Writing effective tools for AI agents",
        "source": "anthropic.com",
        "url": "https://www.anthropic.com/engineering/writing-tools-for-agents",
        "minutes": 25,
        "estimate": true,
        "note": "How to design and evaluate tools for agents — the best source for “what makes a good tool?”."
      },
      {
        "id": "LC-02-r5",
        "kind": "doc",
        "title": "Function calling",
        "source": "developers.openai.com",
        "url": "https://developers.openai.com/api/docs/guides/function-calling",
        "minutes": 20,
        "estimate": true,
        "note": "The raw API flow without a framework: tool schemas, tool calls, results, strict mode."
      },
      {
        "id": "LC-02-r6",
        "kind": "doc",
        "title": "Structured output",
        "source": "docs.langchain.com",
        "url": "https://docs.langchain.com/oss/python/langchain/structured-output",
        "minutes": 15,
        "estimate": true,
        "note": ""
      }
    ],
    "minutes": 124,
    "duration": "≈2h 4m",
    "questions": [
      "Write a tool-calling agent loop without a framework.",
      "How does the model “know” about your tools? What actually reaches it?",
      "How do you get reliable structured output from an LLM?",
      "A tool call fails or times out. What does the agent do?",
      "What makes a good tool for an agent?"
    ],
    "asked": {
      "posts": 0,
      "items": 5
    }
  },
  {
    "id": "LG-01",
    "section": "L",
    "sectionLabel": "LangChain + LangGraph",
    "priority": "P0",
    "title": "The graph model — state, reducers, nodes, edges, super-steps",
    "why": "Expect to sketch a LangGraph workflow and explain how state flows through it. Interviewers check the mental model: state is a typed schema, nodes return partial updates, reducers merge them, edges (fixed or conditional) decide what runs next, and execution moves in super-steps where nodes triggered together run in parallel.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "sketch a graph with a typed state, a reducer, a conditional edge and a capped loop, and explain what happens in one super-step.",
      "tooDeep": "Pregel channel internals; the functional API in depth."
    },
    "know": [
      "State: a TypedDict or Pydantic schema. Nodes are functions `state → partial update`; they never mutate state in place.",
      "Reducers decide how updates merge: the default overwrites; `Annotated[list, operator.add]` appends; `add_messages` appends or replaces by message id. Two parallel writes to a key with no reducer raise an error.",
      "Edges: `add_edge` (fixed), `add_conditional_edges` (a router function picks the next node or nodes), or a node returns `Command(goto=..., update=...)` to route and update in one step.",
      "Super-steps (Pregel-style): nodes triggered together run in parallel; their updates apply at the end of the step; checkpoints are saved at step boundaries.",
      "Every loop needs an exit condition in state, with `recursion_limit` (it raises `GraphRecursionError`) as the backstop.",
      "Per-run configuration that isn't state (user id, model choice) goes through `context_schema` and the node's `Runtime`."
    ],
    "resources": [
      {
        "id": "LG-01-r1",
        "kind": "course",
        "title": "Introduction to LangGraph — Python",
        "source": "LangChain Academy · free",
        "url": "https://academy.langchain.com/courses/intro-to-langgraph",
        "minutes": 0,
        "estimate": false,
        "note": "The official course. Modules 1–3 cover state, reducers, routing, agents, memory and human-in-the-loop — most of this section."
      },
      {
        "id": "LG-01-r2",
        "kind": "video",
        "title": "LangGraph Explained for Beginners",
        "source": "KodeKloud",
        "url": "https://www.youtube.com/watch?v=cUfLrn3TM3M",
        "minutes": 13,
        "note": ""
      },
      {
        "id": "LG-01-r3",
        "kind": "doc",
        "title": "Graph API overview",
        "source": "docs.langchain.com",
        "url": "https://docs.langchain.com/oss/python/langgraph/graph-api",
        "minutes": 30,
        "estimate": true,
        "note": "State, reducers, nodes, edges, Send, Command and super-steps — the reference for every question here."
      }
    ],
    "minutes": 43,
    "duration": "≈43m",
    "questions": [
      "Sketch a LangGraph agent: state, nodes, edges.",
      "What is a reducer, and what happens without one when two nodes write the same key in parallel?",
      "Conditional edge or Command — when each?",
      "What is a super-step?",
      "How do you stop a LangGraph loop from running forever?"
    ],
    "asked": {
      "posts": 0,
      "items": 5
    }
  },
  {
    "id": "LG-02",
    "section": "L",
    "sectionLabel": "LangChain + LangGraph",
    "priority": "P0",
    "title": "Persistence and durable execution — checkpointers, threads, replay",
    "why": "Checkpointing is what makes LangGraph more than a while-loop: it gives you conversation memory, human-in-the-loop pauses, fault tolerance and time travel. Human-in-the-loop only works because of this layer, so expect “where is the state stored, what happens if the process dies mid-run, and what exactly happens on resume?”.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "explain threads, checkpoints per super-step, the durability modes, resume after a crash, and why side effects must be idempotent.",
      "tooDeep": "writing your own checkpointer; checkpoint serialisation formats."
    },
    "know": [
      "A checkpointer saves a `StateSnapshot` at every super-step, keyed by `thread_id` (and `checkpoint_id`). Same thread_id = continue that run; a new one = fresh state.",
      "Production savers: `PostgresSaver` / `AsyncPostgresSaver` (also MongoDB and others). `InMemorySaver` is for tests: state dies with the process.",
      "Durability modes: `'exit'` (persist only at exit or interrupt; fastest, loses mid-run progress), `'async'` (persist in the background), `'sync'` (persist before the next step; safest).",
      "Fault tolerance: resume from the last checkpoint; nodes that succeeded in the failed step keep their pending writes and don't re-run.",
      "Resume re-executes the interrupted node from its start, so side effects must be idempotent — or wrapped in a `@task`, whose result is saved and reused.",
      "Time travel: `get_state_history`, replay from a `checkpoint_id`, fork with `update_state` (which goes through reducers).",
      "Checkpointer = per-thread state. Store = cross-thread long-term memory."
    ],
    "resources": [
      {
        "id": "LG-02-r1",
        "kind": "doc",
        "title": "Persistence",
        "source": "docs.langchain.com",
        "url": "https://docs.langchain.com/oss/python/langgraph/persistence",
        "minutes": 25,
        "estimate": true,
        "note": "Threads, checkpoints, the store, and durable execution (the durable-execution page now redirects here)."
      },
      {
        "id": "LG-02-r2",
        "kind": "doc",
        "title": "Checkpointers",
        "source": "docs.langchain.com",
        "url": "https://docs.langchain.com/oss/python/langgraph/checkpointers",
        "minutes": 15,
        "estimate": true,
        "note": "Saver implementations, durability modes, pending writes and time travel."
      },
      {
        "id": "LG-02-r3",
        "kind": "video",
        "title": "Persistence in LangGraph | Time Travel in LangGraph | CampusX",
        "source": "CampusX",
        "url": "https://www.youtube.com/watch?v=_IPP7_Bi8uA",
        "minutes": 58,
        "note": "14:50 checkpointer, 20:10 threads, 38:05 fault tolerance, 44:28 human in the loop. Hinglish."
      },
      {
        "id": "LG-02-r4",
        "kind": "video",
        "title": "Langgraph checkpointers with Postgres - Let's give memory to our AI Agent",
        "source": "Amitav Roy",
        "url": "https://www.youtube.com/watch?v=N4VUnYRA3BY",
        "minutes": 10,
        "note": "Swapping the in-memory saver for Postgres — what production persistence looks like."
      }
    ],
    "minutes": 108,
    "duration": "≈1h 48m",
    "questions": [
      "Where is LangGraph state stored, and what happens if the process crashes mid-run?",
      "Why must nodes be idempotent in LangGraph?",
      "Thread vs checkpoint vs store?",
      "What is time travel in LangGraph, and when would you use it?",
      "Which durability mode would you choose?"
    ],
    "asked": {
      "posts": 0,
      "items": 5
    }
  },
  {
    "id": "LG-04",
    "section": "L",
    "sectionLabel": "LangChain + LangGraph",
    "priority": "P1",
    "title": "Multi-agent and Deep Agents — supervisor, handoffs, subagents",
    "why": "“Would you use several agents?” is a judgement question. The evidence cuts both ways: Anthropic's research system gained a lot from parallel subagents but spent about 15× the tokens of a chat, while Cognition argues most tasks should stay single-agent because decisions get lost between agents. Know the patterns, then default to one agent until a measured need appears.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "describe the supervisor, handoff and agent-as-tool patterns, when parallel subagents pay off, and what Deep Agents add.",
      "tooDeep": "agent-to-agent protocols; negotiation between agents."
    },
    "know": [
      "Patterns: supervisor (one router agent delegates) · handoffs / swarm (agents pass control with `Command(goto=...)`) · agent-as-tool / subagents (a main agent calls specialists and gets back a summary).",
      "Several agents help when work is parallel and separable (research breadth), one window can't hold all the intermediate work, or tools and prompts need isolation. They hurt when steps depend on each other's decisions.",
      "Costs: many more tokens (Anthropic: agents ~4×, multi-agent ~15× a chat), coordination failures, harder evals and debugging.",
      "The real problem is context engineering: what each subagent sees, and how its results are compressed back.",
      "Deep Agents (LangChain): a planning tool (todo list), a filesystem for offloading context, subagents via a `task` tool, and a detailed system prompt — the harness behind long-running agents."
    ],
    "resources": [
      {
        "id": "LG-04-r1",
        "kind": "doc",
        "title": "How we built our multi-agent research system",
        "source": "anthropic.com",
        "url": "https://www.anthropic.com/engineering/multi-agent-research-system",
        "minutes": 25,
        "estimate": true,
        "note": "The best production case study: orchestrator plus parallel subagents, token costs, prompting and evaluation lessons."
      },
      {
        "id": "LG-04-r2",
        "kind": "doc",
        "title": "Don't Build Multi-Agents",
        "source": "cognition.com",
        "url": "https://cognition.com/blog/dont-build-multi-agents",
        "minutes": 15,
        "estimate": true,
        "note": "The counter-argument: share full context or don't split. Read both and form your own position."
      },
      {
        "id": "LG-04-r3",
        "kind": "video",
        "title": "What are Deep Agents?",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=IVts6ztrkFg",
        "minutes": 8,
        "note": ""
      },
      {
        "id": "LG-04-r4",
        "kind": "video",
        "title": "Hierarchical multi-agent systems with LangGraph",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=B_0TNuYi56w",
        "minutes": 12,
        "note": ""
      },
      {
        "id": "LG-04-r5",
        "kind": "doc",
        "title": "Multi-agent",
        "source": "docs.langchain.com",
        "url": "https://docs.langchain.com/oss/python/langchain/multi-agent",
        "minutes": 20,
        "estimate": true,
        "note": ""
      },
      {
        "id": "LG-04-r6",
        "kind": "course",
        "title": "Introduction to Deep Agents",
        "source": "LangChain Academy · free",
        "url": "https://academy.langchain.com/courses/foundation-introduction-to-deepagents",
        "minutes": 0,
        "estimate": false,
        "note": ""
      }
    ],
    "minutes": 80,
    "duration": "≈1h 20m",
    "questions": [
      "One agent or several — how do you decide?",
      "Supervisor vs swarm (handoffs) — what's the difference?",
      "What did Anthropic learn from building their multi-agent research system?",
      "What is a “deep agent”?"
    ],
    "asked": {
      "posts": 0,
      "items": 4
    }
  },
  {
    "id": "LC-03",
    "section": "L",
    "sectionLabel": "LangChain + LangGraph",
    "priority": "P1",
    "title": "Middleware — limits, retries, fallbacks, PII and approvals in create_agent",
    "why": "Middleware is how LangChain v1 adds production controls to the agent loop without rewriting it, and its hooks map one-to-one onto the controls design rounds ask about: call limits, retries, model fallbacks, PII masking, summarising long history and approvals. Knowing it signals current hands-on experience.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "name the hooks and their order, map five built-ins to the problems they solve, and write a small custom wrap_model_call hook.",
      "tooDeep": "every option of every built-in middleware."
    },
    "know": [
      "Node-style hooks: `before_agent`, `before_model`, `after_model`, `after_agent` (can update state; model hooks can jump). Wrap-style: `wrap_model_call`, `wrap_tool_call` (modify, skip or retry).",
      "Order for [m1, m2, m3]: before hooks m1→m3, wrap hooks nested with m1 outermost, after hooks m3→m1.",
      "Built-ins: ModelCallLimit, ToolCallLimit, ModelRetry, ToolRetry, ModelFallback, Summarization, ContextEditing, PII, LLMToolSelector, HumanInTheLoop, TodoList.",
      "Custom middleware for per-request model routing, per-user tool filtering, cost accounting and output checks.",
      "Middleware changes requests invisibly: test with the full stack and log when fallbacks or summaries fire."
    ],
    "resources": [
      {
        "id": "LC-03-r1",
        "kind": "doc",
        "title": "Middleware overview",
        "source": "docs.langchain.com",
        "url": "https://docs.langchain.com/oss/python/langchain/middleware/overview",
        "minutes": 15,
        "estimate": true,
        "note": ""
      },
      {
        "id": "LC-03-r2",
        "kind": "doc",
        "title": "Prebuilt middleware",
        "source": "docs.langchain.com",
        "url": "https://docs.langchain.com/oss/python/langchain/middleware/built-in",
        "minutes": 20,
        "estimate": true,
        "note": ""
      },
      {
        "id": "LC-03-r3",
        "kind": "video",
        "title": "Human in the Loop Middleware (Python)",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=SpfT6-YAVPk",
        "minutes": 6,
        "note": ""
      },
      {
        "id": "LC-03-r4",
        "kind": "video",
        "title": "LangChain v1 Middleware: Building Safe, Reliable & Controllable AI Agents",
        "source": "Vaibhav Arora",
        "url": "https://www.youtube.com/watch?v=ecqPrHBCY2s",
        "minutes": 39,
        "note": "A longer walkthrough of v1 middleware in code; skim to the parts on limits, fallbacks and custom hooks."
      }
    ],
    "minutes": 80,
    "duration": "≈1h 20m",
    "questions": [
      "Your agent loops and burns tokens. What middleware do you add?",
      "In what order do middleware hooks run?",
      "How would you send easy questions to a cheap model and hard ones to a strong model?",
      "Why is a model fallback risky, and how do you make it safe?"
    ],
    "asked": {
      "posts": 0,
      "items": 4
    }
  },
  {
    "id": "LG-03",
    "section": "L",
    "sectionLabel": "LangChain + LangGraph",
    "priority": "P1",
    "title": "LangGraph control flow — Send fan-out, subgraphs, streaming, retries",
    "why": "Design rounds turn workflows into graphs: “summarise 500 documents”, “reuse this retrieval loop in three workflows”, “show progress while the agent works”, “the payments API fails one call in fifty”. Send-based map-reduce, subgraphs, stream modes and node retry/cache policies are the tools for exactly these.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "model a map-reduce with Send and a reducer, explain subgraph state boundaries, pick stream modes for a UI, and say where retry and cache policies belong.",
      "tooDeep": "custom channels; distributed execution internals."
    },
    "know": [
      "Map-reduce: a conditional edge returns `[Send('node', payload) ...]`; branches run in one super-step; a list reducer collects results; cap with `max_concurrency`.",
      "Subgraphs are compiled graphs used as nodes, with their own state and checkpoint namespace; shared fields flow by name.",
      "`Command(graph=Command.PARENT, goto=...)` jumps from a subgraph to the parent graph.",
      "Stream modes: messages (tokens), updates (per-node changes), values (full state), custom (your events), debug.",
      "Retry policies for flaky nodes, cache policies for expensive deterministic ones, per-node timeouts in recent versions."
    ],
    "resources": [
      {
        "id": "LG-03-r1",
        "kind": "doc",
        "title": "Workflows and agents",
        "source": "docs.langchain.com",
        "url": "https://docs.langchain.com/oss/python/langgraph/workflows-agents",
        "minutes": 25,
        "estimate": true,
        "note": "Each workflow pattern, including orchestrator-workers with Send, implemented in LangGraph."
      },
      {
        "id": "LG-03-r2",
        "kind": "video",
        "title": "LangGraph - Controllability with Map Reduce",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=JQznvlSatPQ",
        "minutes": 9,
        "note": ""
      },
      {
        "id": "LG-03-r3",
        "kind": "video",
        "title": "Streaming in LangGraph | CampusX",
        "source": "CampusX",
        "url": "https://www.youtube.com/watch?v=D1PcZaeQ2eg",
        "minutes": 25,
        "note": ""
      },
      {
        "id": "LG-03-r4",
        "kind": "doc",
        "title": "Streaming",
        "source": "docs.langchain.com",
        "url": "https://docs.langchain.com/oss/python/langgraph/streaming",
        "minutes": 15,
        "estimate": true,
        "note": ""
      }
    ],
    "minutes": 74,
    "duration": "≈1h 14m",
    "questions": [
      "Summarise 500 documents and combine the summaries. Model it in LangGraph.",
      "When would you use a subgraph?",
      "How would you stream a multi-step agent's progress to a UI?"
    ],
    "asked": {
      "posts": 0,
      "items": 3
    }
  },
  {
    "id": "LG-05",
    "section": "L",
    "sectionLabel": "LangChain + LangGraph",
    "priority": "P1",
    "title": "Context engineering and memory — short-term, long-term, what goes in the window",
    "why": "Agents fail more from bad context than bad wording: forgotten facts in long conversations, bloated tool outputs, irrelevant history. Expect “the conversation exceeds the window — your options?”, “short-term vs long-term memory?” and “in what order do you build the prompt?”.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "compare trim, summarise and retrieve; explain semantic, episodic and procedural memory and when memories are written; order a prompt for caching and quality.",
      "tooDeep": "memory framework comparisons; cognitive-science taxonomies."
    },
    "know": [
      "Context engineering: deciding what goes into the window on every call, in what order, and what is left out.",
      "Short-term memory is the thread's state; manage it by trimming, summarising, retrieving old turns, and pinning key facts in state fields.",
      "Long-term memory lives in the store: semantic (facts), episodic (past experiences), procedural (instructions).",
      "Write memories in the hot path (a tool call) or in the background (after the conversation); guard against stale, private and poisoned memories.",
      "Order: instructions, tools, examples, memories, retrieved documents, history, question — fixed parts first for prompt caching.",
      "Long-running agents: write, select, compress, isolate."
    ],
    "resources": [
      {
        "id": "LG-05-r1",
        "kind": "doc",
        "title": "Effective context engineering for AI agents",
        "source": "anthropic.com",
        "url": "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents",
        "minutes": 25,
        "estimate": true,
        "note": ""
      },
      {
        "id": "LG-05-r2",
        "kind": "video",
        "title": "Context Engineering for Agents",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=4GiqzUHD5AA",
        "minutes": 22,
        "note": "Write, select, compress, isolate — the four strategies with examples from real agents."
      },
      {
        "id": "LG-05-r3",
        "kind": "video",
        "title": "Memory for agents (conceptual video)",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=JTL0yp85FsE",
        "minutes": 7,
        "note": ""
      },
      {
        "id": "LG-05-r4",
        "kind": "doc",
        "title": "Memory overview",
        "source": "docs.langchain.com",
        "url": "https://docs.langchain.com/oss/python/concepts/memory",
        "minutes": 20,
        "estimate": true,
        "note": ""
      }
    ],
    "minutes": 74,
    "duration": "≈1h 14m",
    "questions": [
      "The conversation exceeds the context window. What are your options?",
      "Short-term vs long-term memory in LangGraph?",
      "What can go wrong with long-term memory?",
      "Prompt engineering vs context engineering?"
    ],
    "asked": {
      "posts": 0,
      "items": 4
    }
  },
  {
    "id": "HITL-01",
    "section": "H",
    "sectionLabel": "Human-in-the-loop",
    "priority": "P0",
    "title": "interrupt() and resume — the mechanics interviewers probe",
    "why": "Human-in-the-loop with LangGraph interrupts is probed on its exact mechanics: a checkpointer is required, the run pauses and hands back a payload, resume is by thread_id with Command(resume=...), and the interrupted node re-runs from its first line — so anything before the interrupt() must be idempotent. Get these exactly right; vague answers here are easy to spot.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "explain the pause, the payload, the resume value and node re-execution, the rules for several interrupts, and dynamic vs static interrupts.",
      "tooDeep": "checkpoint serialisation; LangGraph Platform internals."
    },
    "know": [
      "`interrupt(payload)` raises a special signal, the checkpointer saves state, and the caller receives the payload (`result['__interrupt__']`). Needs a checkpointer and a `thread_id`.",
      "Resume: invoke again with `Command(resume=value)` on the same `thread_id`; `value` becomes the return value of `interrupt()`.",
      "On resume the node restarts **from its first line** — code before `interrupt()` runs twice. Make it idempotent, or move side effects after the interrupt or into another node.",
      "Several `interrupt()` calls in one node are matched to resume values **by order**, so their number and order must be deterministic. Parallel interrupts resume with a map of interrupt id → value.",
      "Never wrap `interrupt()` in a bare `try/except` (it swallows the pause). Payloads must be JSON-serialisable.",
      "Static `interrupt_before` / `interrupt_after` are for debugging; real approvals use `interrupt()`. An interrupt inside a tool makes the approval travel with that tool."
    ],
    "resources": [
      {
        "id": "HITL-01-r1",
        "kind": "doc",
        "title": "Interrupts",
        "source": "docs.langchain.com",
        "url": "https://docs.langchain.com/oss/python/langgraph/interrupts",
        "minutes": 20,
        "estimate": true,
        "note": "Read the rules section twice — every pitfall interviewers probe is listed there."
      },
      {
        "id": "HITL-01-r2",
        "kind": "video",
        "title": "LangGraph interrupt: Making it easier to build human-in-the-loop agents",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=6t7YJcEFUIY",
        "minutes": 8,
        "note": ""
      },
      {
        "id": "HITL-01-r3",
        "kind": "video",
        "title": "Human in the loop (HITL) using LangGraph | CampusX",
        "source": "CampusX",
        "url": "https://www.youtube.com/watch?v=xxqZzVZ4gE0",
        "minutes": 40,
        "note": "14:21 HITL from a LangGraph perspective, 16:30 the interrupt workflow, 22:49 code. Hinglish."
      },
      {
        "id": "HITL-01-r4",
        "kind": "doc",
        "title": "Human-in-the-loop (middleware)",
        "source": "docs.langchain.com",
        "url": "https://docs.langchain.com/oss/python/langchain/human-in-the-loop",
        "minutes": 15,
        "estimate": true,
        "note": "The same mechanism packaged for create_agent: approve, edit, reject or respond per tool call."
      }
    ],
    "minutes": 83,
    "duration": "≈1h 23m",
    "questions": [
      "Walk through what happens when a node calls interrupt().",
      "The node writes to Redis and then calls interrupt(). What happens on resume?",
      "Why can't you call interrupt() in a loop over a list that may change?",
      "Dynamic interrupt() vs interrupt_before / interrupt_after?",
      "Two parallel branches are both waiting for approval. How do you resume?"
    ],
    "asked": {
      "posts": 0,
      "items": 5
    }
  },
  {
    "id": "HITL-02",
    "section": "H",
    "sectionLabel": "Human-in-the-loop",
    "priority": "P0",
    "title": "Designing approval flows — what needs a human, and how they decide",
    "why": "Design rounds probe controls more than cleverness: what the agent may do alone, what needs approval, what the reviewer sees, and what happens to the change while it waits. The reference pattern is staged writes, an approval interrupt, then commit, generalised as: risk-tiered actions, a reviewable proposal, approve / edit / reject, and an audit trail.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "tier actions by risk, design the reviewer's payload and decisions, and describe the staged-write pattern end to end.",
      "tooDeep": "approval UI design; workflow-engine products."
    },
    "know": [
      "Tier actions by risk: read-only → automatic; reversible, low-impact writes → automatic with audit; irreversible, financial, external-communication or bulk writes → human approval.",
      "Approve the **proposal, not the intent**: show the exact tool call or diff (what changes, before → after, blast radius), the agent's reasoning and its sources.",
      "Decisions: approve · edit (change the arguments) · reject with feedback the agent sees · respond (answer instead of running). Rejections and edits feed the eval set.",
      "Staged-write pattern: the agent writes to a staging overlay → a human reviews the diff → commit to the base on approval → discard on rejection or expiry. The base is never touched before approval.",
      "12-factor agents: contact humans with tool calls — “request approval” is just another tool, so pausing and resuming is ordinary control flow.",
      "Async approvals (ambient agents): the agent runs in the background and posts to an inbox; the run waits durably until someone answers."
    ],
    "resources": [
      {
        "id": "HITL-02-r1",
        "kind": "doc",
        "title": "12-Factor Agents",
        "source": "github.com/humanlayer",
        "url": "https://github.com/humanlayer/12-factor-agents",
        "minutes": 40,
        "estimate": true,
        "note": "Factors 6 (launch / pause / resume) and 7 (contact humans with tool calls) are the HITL ones. All twelve are short and worth reading."
      },
      {
        "id": "HITL-02-r2",
        "kind": "video",
        "title": "Ambient Agents and the New Agent Inbox ft. Harrison Chase",
        "source": "Sequoia Capital",
        "url": "https://www.youtube.com/watch?v=egSh4TxS5go",
        "minutes": 8,
        "note": "Why the future of agents is background work plus an inbox for human decisions."
      },
      {
        "id": "HITL-02-r3",
        "kind": "video",
        "title": "Open Source Agent Inbox for LangGraph",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=gF341XMN8cY",
        "minutes": 11,
        "note": ""
      },
      {
        "id": "HITL-02-r4",
        "kind": "doc",
        "title": "Introducing ambient agents",
        "source": "langchain.com",
        "url": "https://www.langchain.com/blog/introducing-ambient-agents",
        "minutes": 10,
        "estimate": true,
        "note": "The three human-in-the-loop patterns: notify, question, review."
      }
    ],
    "minutes": 69,
    "duration": "≈1h 9m",
    "questions": [
      "Design approvals for an agent that can change inventory parameters. What needs a human?",
      "What should the approver see, and why does it matter?",
      "Why “approve the proposal, not the intent”?",
      "How do rejections make the agent better over time?"
    ],
    "asked": {
      "posts": 0,
      "items": 4
    }
  },
  {
    "id": "HITL-03",
    "section": "H",
    "sectionLabel": "Human-in-the-loop",
    "priority": "P1",
    "title": "HITL in production — timeouts, stale data, concurrency, audit",
    "why": "After the happy path come the operational questions: the approver never answers, the data changed while they were deciding, two people approve conflicting changes, the service was redeployed while runs were paused. Each has a standard answer, and having them ready is what makes your HITL claim credible.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "answer each failure case below and say how it's enforced in code.",
      "tooDeep": "distributed-locking theory; BPM engines."
    },
    "know": [
      "A paused run costs only storage; a durable checkpointer (Postgres) keeps it across restarts and deploys.",
      "Expiry: staged writes and pending approvals carry a TTL; a sweeper expires them, discards the overlay and notifies; resuming an expired run is refused.",
      "Stale data: re-validate at commit with a compare-and-set on a version or `updated_at`; if the base changed, re-propose instead of committing a stale diff.",
      "Concurrency: one open proposal per entity (lock or unique constraint), optimistic versioning at commit, and idempotent commits keyed by proposal id so a double click can't apply twice.",
      "Deploys: paused threads were checkpointed by the old graph — keep node names and state backward-compatible, or drain and expire paused runs first.",
      "Audit: who approved what, when, with which payload and outcome — an append-only log."
    ],
    "resources": [
      {
        "id": "HITL-03-r1",
        "kind": "video",
        "title": "Optimistic Locking - What, When, Why, and How?",
        "source": "Arpit Bhayani",
        "url": "https://www.youtube.com/watch?v=eMotoFvgdUo",
        "minutes": 17,
        "note": "Compare-and-set with a version column: the fix for “the data changed while the approver was deciding”."
      },
      {
        "id": "HITL-03-r2",
        "kind": "video",
        "title": "Fix Duplicate Messages with the Idempotent Consumer Pattern",
        "source": "Milan Jovanović",
        "url": "https://www.youtube.com/watch?v=GsZ_ZtlRCBg",
        "minutes": 14,
        "note": "Idempotency keys: why a retried or double-clicked approval must apply once."
      }
    ],
    "minutes": 31,
    "duration": "31m",
    "questions": [
      "The approver never responds. What happens to the staged write?",
      "The underlying data changed while the human was deciding. Now what?",
      "Two planners approve conflicting changes to the same parameter. What happens?",
      "You deploy a new version of the graph while 200 runs are paused at an interrupt. What breaks?",
      "How would you audit an agent that makes approved changes?"
    ],
    "asked": {
      "posts": 0,
      "items": 5
    }
  },
  {
    "id": "EV-01",
    "section": "E",
    "sectionLabel": "Evals",
    "priority": "P0",
    "title": "Eval-driven development — error analysis first, then metrics",
    "why": "Evals are the round people fail most often and the strongest signal that someone has shipped AI for real. Practitioners (Hamel Husain, Shreya Shankar, Anthropic) agree on the method: read real traces and categorise failures first, write cheap targeted checks for the failures that matter, and only then automate with judges — not generic “helpfulness” scores from a library.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "describe the loop — sample traces, open and axial coding, a failure taxonomy, targeted evaluators, a golden set, a CI gate — and capability vs regression evals.",
      "tooDeep": "statistical testing theory; building an eval platform."
    },
    "know": [
      "Error analysis: read ~100 traces, note what went wrong in plain words (open coding), group the notes into failure categories (axial coding), count them. Fix the biggest category first.",
      "One evaluator per failure mode: code checks first (format, schema, regex, right tool called, SQL runs), LLM judges only for subjective criteria, humans to calibrate both.",
      "Binary pass/fail per criterion beats 1–5 scales: more consistent, easier to act on, easier to validate.",
      "Golden set: real cases over synthetic; include edge cases and unanswerable ones; version it; grow it from production failures.",
      "Capability evals start low and climb; regression evals should sit near 100% and gate merges.",
      "Generic metrics (“helpfulness”, BLEU) rarely track product quality; task-specific ones do."
    ],
    "resources": [
      {
        "id": "EV-01-r1",
        "kind": "video",
        "title": "Error Analysis: The Highest ROI Technique In AI Engineering",
        "source": "Hamel Husain",
        "url": "https://www.youtube.com/watch?v=e2i6JbU2R-s",
        "minutes": 12,
        "note": ""
      },
      {
        "id": "EV-01-r2",
        "kind": "video",
        "title": "LLM Evals: Common Mistakes",
        "source": "Hamel Husain",
        "url": "https://www.youtube.com/watch?v=GL0XhAj5LPE",
        "minutes": 28,
        "note": "Hold any eval setup up against each mistake: generic metrics, unvalidated judges, no error analysis."
      },
      {
        "id": "EV-01-r3",
        "kind": "video",
        "title": "AI Evals For Engineers: Course Preview (Chapters 1-3 of 8)",
        "source": "Hamel Husain",
        "url": "https://www.youtube.com/watch?v=OJItZndMUII",
        "minutes": 64,
        "note": "Free preview of the course below: chapters 1–3 of 8."
      },
      {
        "id": "EV-01-r4",
        "kind": "doc",
        "title": "LLM Evals: Everything You Need to Know (FAQ)",
        "source": "hamel.dev",
        "url": "https://hamel.dev/blog/posts/evals-faq/",
        "minutes": 40,
        "estimate": true,
        "note": "Short answers to every practical question: judges, error analysis, golden-set size, agreement, tooling."
      }
    ],
    "minutes": 144,
    "duration": "≈2h 24m",
    "questions": [
      "An LLM feature has no evals today. How do you start?",
      "Why binary pass/fail instead of a 1–5 score?",
      "Capability evals vs regression evals?",
      "Your golden set is 50 synthetic questions. What can't it tell you?",
      "How do evals fit into CI/CD?"
    ],
    "asked": {
      "posts": 0,
      "items": 5
    }
  },
  {
    "id": "EV-02",
    "section": "E",
    "sectionLabel": "Evals",
    "priority": "P0",
    "title": "LLM-as-judge you can trust — rubrics, biases, calibration",
    "why": "“Who judges the judge?” is the follow-up to every LLM-as-judge claim. Strong answers treat the judge as a measuring instrument: one narrow criterion, a binary verdict with a critique, known biases controlled, agreement with human labels measured on a held-out set, and recalibration whenever the judge's model or prompt changes.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "write a judge prompt, name four biases with their mitigations, and compute agreement (TPR/TNR, Cohen's kappa) by hand.",
      "tooDeep": "training reward models; agreement statistics beyond kappa."
    },
    "know": [
      "Judge types: single output against criteria (pass/fail), reference-based (compare with a gold answer), pairwise (A vs B).",
      "Biases: position (pairwise order), verbosity (longer wins), self-preference (its own family's outputs), leniency. Mitigate: swap order and require agreement, length-neutral rubrics, a different model family, examples of failures, critique before verdict.",
      "Calibrate: label 100–200 examples yourself, split dev / test, iterate the judge prompt on dev, report TPR and TNR (or kappa) on test. A judge that never says fail is useless.",
      "Cohen's kappa = (p_o − p_e) / (1 − p_e): agreement corrected for chance.",
      "Criteria drift (Shankar et al.): grading outputs changes what you think the criteria are — expect to rewrite the rubric after labelling.",
      "Recalibrate after any change to the judge's model or prompt, and spot-check production verdicts regularly."
    ],
    "resources": [
      {
        "id": "EV-02-r1",
        "kind": "doc",
        "title": "Using LLM-as-a-Judge For Evaluation: A Complete Guide",
        "source": "hamel.dev",
        "url": "https://hamel.dev/blog/posts/llm-judge/",
        "minutes": 30,
        "estimate": true,
        "note": "The step-by-step method: a domain expert, binary verdicts with critiques, iterate until the judge agrees with the expert."
      },
      {
        "id": "EV-02-r2",
        "kind": "video",
        "title": "How To Build AI Evals",
        "source": "Hamel Husain",
        "url": "https://www.youtube.com/watch?v=mF4CaijvJos",
        "minutes": 34,
        "note": "A case study. 19:05 calibrating judges against production; 20:44 judges as a CI gate and on daily production samples."
      },
      {
        "id": "EV-02-r3",
        "kind": "video",
        "title": "How to Automate AI Evals (Correctly)",
        "source": "Hamel Husain",
        "url": "https://www.youtube.com/watch?v=tqUDjc1HzO4",
        "minutes": 27,
        "note": ""
      },
      {
        "id": "EV-02-r4",
        "kind": "video",
        "title": "LLM as a Judge: Scaling AI Evaluation Strategies",
        "source": "IBM Technology",
        "url": "https://www.youtube.com/watch?v=trfUBIDeI1Y",
        "minutes": 6,
        "note": ""
      },
      {
        "id": "EV-02-r5",
        "kind": "doc",
        "title": "Evaluating the Effectiveness of LLM-Evaluators (aka LLM-as-Judge)",
        "source": "eugeneyan.com",
        "url": "https://eugeneyan.com/writing/llm-evaluators/",
        "minutes": 40,
        "estimate": true,
        "note": "The survey: which judge setups agree with humans, and where they fail."
      }
    ],
    "minutes": 137,
    "duration": "≈2h 17m",
    "questions": [
      "Is your LLM judge any good? How do you know?",
      "40 items: you and the judge agree on 34, and each of you labels half as pass. Compute Cohen's kappa.",
      "Name the biases of LLM judges and how you control each.",
      "Your production grounding check uses the same model family as the generator. What's the risk?",
      "Write a judge prompt for “is the answer grounded in the context?”."
    ],
    "asked": {
      "posts": 0,
      "items": 5
    }
  },
  {
    "id": "EV-03",
    "section": "E",
    "sectionLabel": "Evals",
    "priority": "P0",
    "title": "RAG metrics — retrieval and generation, computed by hand",
    "why": "Expect to define and compute the metrics, not just name them: recall@k, precision@k, MRR and nDCG for retrieval; faithfulness, answer relevance, context precision and context recall for generation. Then diagnose a system from its numbers — which one says fix retrieval, and which says fix generation.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "compute recall@k, MRR and nDCG@k by hand on a small example, define the four RAGAS metrics, and diagnose from scores.",
      "tooDeep": "metric axioms; learning-to-rank losses."
    },
    "know": [
      "recall@k = relevant items in the top k ÷ all relevant items. precision@k = relevant in the top k ÷ k. hit rate@k = did any relevant item appear.",
      "MRR = the mean, over queries, of 1 / rank of the first relevant result.",
      "nDCG@k = DCG ÷ IDCG, with DCG = Σ rel_i / log2(i + 1): rewards relevant items near the top and supports graded relevance.",
      "Faithfulness = supported claims ÷ all claims (against the context). Answer relevance = does the answer address the question. Context precision = relevant chunks ranked high. Context recall = the facts the reference answer needs are present in the context.",
      "Retrieval metrics need labelled relevant chunks per question; generation metrics are usually LLM-judged — so they need calibrating too.",
      "Diagnose: low context recall → retrieval; high recall and low faithfulness → generation; both high but users unhappy → wrong metric or wrong data."
    ],
    "resources": [
      {
        "id": "EV-03-r1",
        "kind": "video",
        "title": "Every Ranking Metric : MRR, MAP, NDCG",
        "source": "ritvikmath",
        "url": "https://www.youtube.com/watch?v=2XegvMul_mE",
        "minutes": 21,
        "note": "The ranking metrics — MRR, MAP and NDCG — with worked examples."
      },
      {
        "id": "EV-03-r2",
        "kind": "video",
        "title": "RAG Evaluation: Precision, Recall, Faithfulness, RAGAS Explained Clearly",
        "source": "Logical Lenses",
        "url": "https://www.youtube.com/watch?v=7_LTU0LA374",
        "minutes": 12,
        "note": ""
      },
      {
        "id": "EV-03-r3",
        "kind": "doc",
        "title": "List of available metrics",
        "source": "docs.ragas.io",
        "url": "https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/",
        "minutes": 25,
        "estimate": true,
        "note": "Read faithfulness, response relevancy, context precision and context recall."
      }
    ],
    "minutes": 58,
    "duration": "≈58m",
    "questions": [
      "Three relevant chunks sit at ranks 2, 7 and 11. Compute recall@5, recall@10, MRR and nDCG@10 (binary relevance).",
      "Define faithfulness, answer relevance, context precision and context recall. Which need a reference answer?",
      "Faithfulness is 0.95 but users say the answers are wrong. What's going on?",
      "You report recall@10 on 51 questions. How much do you trust a 0.02 difference?"
    ],
    "asked": {
      "posts": 0,
      "items": 4
    }
  },
  {
    "id": "EV-04",
    "section": "E",
    "sectionLabel": "Evals",
    "priority": "P1",
    "title": "Evaluating agents — outcome, trajectory, pass^k",
    "why": "Agents are harder to evaluate than RAG: many steps, tool calls, side effects and non-determinism. Interviewers ask how you'd evaluate a LangGraph agent: grade the final outcome in the environment, check the trajectory where the path matters (right tools, right arguments, nothing forbidden), and run several trials, because one success isn't reliability.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "explain outcome vs trajectory vs single-step evals, pass@k vs pass^k with a worked number, and how you'd test before launch.",
      "tooDeep": "benchmark leaderboards; building user simulators."
    },
    "know": [
      "Three levels: final outcome (did the task succeed? check the system of record), trajectory (the sequence of tool calls against rules or a reference), single step (given this state, is the next call right?).",
      "Grade outcomes over exact paths — rigid step matching punishes valid alternatives. Use trajectory checks for must / must-not rules (approval before a write; never call delete).",
      "pass@k = P(at least one of k trials succeeds); pass^k = P(all k succeed) ≈ p^k. Customer-facing agents need pass^k: at 75% per trial, pass^3 ≈ 42%.",
      "A clean, isolated environment per trial; mock or sandbox external tools.",
      "Simulated users (an LLM playing the customer from a scenario) for multi-turn agents; read transcripts to confirm failures are real.",
      "Track cost, steps and latency per task next to success."
    ],
    "resources": [
      {
        "id": "EV-04-r1",
        "kind": "doc",
        "title": "Demystifying evals for AI agents",
        "source": "anthropic.com",
        "url": "https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents",
        "minutes": 20,
        "estimate": true,
        "note": "Graders (code, model, human), capability vs regression, pass@k vs pass^k, and an eight-step roadmap that starts from 20–50 real failures."
      },
      {
        "id": "EV-04-r2",
        "kind": "video",
        "title": "How to evaluate agent trajectories with AgentEvals",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=FCKjETgr54U",
        "minutes": 12,
        "note": ""
      },
      {
        "id": "EV-04-r3",
        "kind": "video",
        "title": "How to evaluate agents in practice",
        "source": "Google Cloud Tech",
        "url": "https://www.youtube.com/watch?v=vuBvf7ZRKTA",
        "minutes": 11,
        "note": ""
      },
      {
        "id": "EV-04-r4",
        "kind": "video",
        "title": "AI Evals Explained | How to evaluate AI Agents?",
        "source": "Aishwarya Srinivasan",
        "url": "https://www.youtube.com/watch?v=_Er8Hao_gmQ",
        "minutes": 23,
        "note": ""
      }
    ],
    "minutes": 66,
    "duration": "≈1h 6m",
    "questions": [
      "How would you evaluate a tool-using LangGraph agent before launch?",
      "pass@k or pass^k for a support agent? Compute pass^3 at 80% per-trial success.",
      "Trajectory evaluation — exact match or not?",
      "How do you test a multi-turn conversational agent?"
    ],
    "asked": {
      "posts": 0,
      "items": 4
    }
  },
  {
    "id": "EV-05",
    "section": "E",
    "sectionLabel": "Evals",
    "priority": "P1",
    "title": "Observability, online evals and safe launches",
    "why": "Offline evals gate merges; production needs three more things: a trace for every request, online evaluation of sampled traffic, and launches you can roll back. The question that sounds senior: “the provider silently updated the model — how do you find out before your users do?”.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "describe what a trace holds, which online signals you'd watch, and a shadow → canary → rollout plan with rollback triggers.",
      "tooDeep": "building a tracing backend; OpenTelemetry internals."
    },
    "know": [
      "A trace is a tree of spans per request: each LLM call, retrieval and tool call with inputs, outputs, model, tokens, latency, cost and errors (LangSmith, Langfuse, or OpenTelemetry's GenAI conventions).",
      "Online evals: run reference-free checks (judges, code assertions) on a sample of production traces; alert on drops per criterion and slice.",
      "Implicit signals: thumbs up/down, regenerate, copy, escalation to a human, abandonment, “that's wrong” follow-ups.",
      "Pin model versions; run the regression suite on any model or prompt change; canary on a small share; roll back automatically on thresholds.",
      "Launch ladder: offline eval → shadow (runs on real traffic, not shown) → canary or cohort → A/B → full. Define the success metric and the rollback trigger before launch.",
      "Cost and latency are quality metrics: p95 latency, tokens and cost per request and per resolved task."
    ],
    "resources": [
      {
        "id": "EV-05-r1",
        "kind": "video",
        "title": "Observability and Evals for AI Agents: A Simple Breakdown",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=FDVdLrloFOw",
        "minutes": 15,
        "note": ""
      },
      {
        "id": "EV-05-r2",
        "kind": "video",
        "title": "10 min Walkthrough of Langfuse – Open Source LLM Observability, Evaluation, and Prompt Management",
        "source": "Langfuse",
        "url": "https://www.youtube.com/watch?v=2E8iTvGo9Hs",
        "minutes": 10,
        "note": ""
      },
      {
        "id": "EV-05-r3",
        "kind": "video",
        "title": "Lessons from the Trenches: Building LLM Evals That Work IRL: Aparna Dhinkaran",
        "source": "AI Engineer",
        "url": "https://www.youtube.com/watch?v=nbZzSC5A6hs",
        "minutes": 19,
        "note": ""
      },
      {
        "id": "EV-05-r4",
        "kind": "course",
        "title": "LangSmith Essentials",
        "source": "LangChain Academy · free",
        "url": "https://academy.langchain.com/courses/quickstart-langsmith-essentials",
        "minutes": 0,
        "estimate": false,
        "note": "Tracing, datasets, experiments and online evaluation in the tool your stack already uses."
      },
      {
        "id": "EV-05-r5",
        "kind": "doc",
        "title": "Evaluation concepts",
        "source": "docs.langchain.com",
        "url": "https://docs.langchain.com/langsmith/evaluation-concepts",
        "minutes": 20,
        "estimate": true,
        "note": "Offline vs online evaluation, evaluator types, datasets and experiments."
      }
    ],
    "minutes": 64,
    "duration": "≈1h 4m",
    "questions": [
      "The provider silently updated the model. How do you find out before your users do?",
      "What do you log for each LLM request?",
      "A stakeholder wants to launch, but the eval evidence is weak. What do you say?",
      "Which online signals tell you the assistant is getting worse?"
    ],
    "asked": {
      "posts": 0,
      "items": 4
    }
  },
  {
    "id": "SD-01",
    "section": "D",
    "sectionLabel": "AI system design",
    "priority": "P0",
    "title": "The LLM system design round — a framework for 45 minutes",
    "why": "The design round is where a 2-year candidate can look senior — not by drawing more boxes, but by defining success first and designing for quality, cost, latency and failure. Use one repeatable structure so you never forget the three things weaker answers leave out: evals, guardrails and the fallback.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "run the framework on any prompt in 35 minutes, with numbers for latency and cost, an eval plan and a launch plan.",
      "tooDeep": "GPU capacity planning; vendor comparisons."
    },
    "know": [
      "1 · Clarify: users, task, quality bar, scale (QPS, corpus size), latency target, budget, and the cost of a wrong answer.",
      "2 · Success metrics and the baseline (today's human or process), offline and online.",
      "3 · The simplest architecture first (prompt → RAG → workflow → agent); justify every step up.",
      "4 · Components: gateway (auth, rate limits, routing, fallbacks), data and retrieval, orchestration, tools, guardrails, caches, observability.",
      "5 · Eval plan: golden set, per-component metrics, calibrated judges, a CI gate, online evals.",
      "6 · A cost and latency budget per request: where to cache, which model where.",
      "7 · Failure modes and fallbacks, the launch (shadow → canary) and rollback triggers, the feedback loop."
    ],
    "resources": [
      {
        "id": "SD-01-r1",
        "kind": "doc",
        "title": "Building A Generative AI Platform",
        "source": "huyenchip.com",
        "url": "https://huyenchip.com/2024/07/25/genai-platform.html",
        "minutes": 40,
        "estimate": true,
        "note": "Builds the platform one component at a time — context, guardrails, router and gateway, caches, agents, observability. The diagram to have in your head."
      },
      {
        "id": "SD-01-r2",
        "kind": "video",
        "title": "AI System Design Tutorial",
        "source": "codebasics",
        "url": "https://www.youtube.com/watch?v=S6jy0T85DFs",
        "minutes": 43,
        "note": "05:58 gateway and auth, 10:53 guardrails, 13:59 semantic cache, 17:15 data freshness and CDC, 21:01 human in the loop, 23:15 model router, 30:03 fallback provider, 35:14 observability."
      },
      {
        "id": "SD-01-r3",
        "kind": "video",
        "title": "You Can Learn AI Agent System Design In 19 Min | RAG, Vector Database, Evals, Function Calling",
        "source": "Sean‘s AI Stories",
        "url": "https://www.youtube.com/watch?v=CyLYY_xb5bQ",
        "minutes": 19,
        "note": ""
      },
      {
        "id": "SD-01-r4",
        "kind": "doc",
        "title": "Patterns for Building LLM-based Systems & Products",
        "source": "eugeneyan.com",
        "url": "https://eugeneyan.com/writing/llm-patterns/",
        "minutes": 40,
        "estimate": true,
        "note": "Seven patterns: evals, RAG, fine-tuning, caching, guardrails, defensive UX and user feedback."
      }
    ],
    "minutes": 142,
    "duration": "≈2h 22m",
    "questions": [
      "How do you structure an LLM system design answer?",
      "Rough cost estimate: 1M queries a day, 3K input and 300 output tokens each.",
      "What are the components of a production LLM platform?",
      "Which failure modes would you design for in any LLM system?"
    ],
    "asked": {
      "posts": 0,
      "items": 4
    }
  },
  {
    "id": "SD-02",
    "section": "D",
    "sectionLabel": "AI system design",
    "priority": "P1",
    "title": "Workflows vs agents — choosing the simplest architecture that works",
    "why": "“Workflow or agent — which is your default?” separates people who have shipped agents from people who have read about them. The answer interviewers reward — and the argument of Anthropic's “Building effective agents” — is the simplest thing that works: a single call, then a fixed workflow, and an autonomous agent only when the steps can't be known in advance, always with budgets, stop conditions and approval points.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "name the five workflow patterns, say when an agent is justified, and list the controls every agent needs.",
      "tooDeep": "agent research papers; long-horizon autonomous agents."
    },
    "know": [
      "The ladder: one LLM call (with retrieval and tools) → a workflow (code decides the steps) → an agent (the model decides the steps). Climb only when the eval shows the lower rung failing.",
      "Workflow patterns: prompt chaining · routing · parallelisation · orchestrator-workers · evaluator-optimizer.",
      "Agents fit open-ended tasks where the number and order of steps can't be predicted, and where mistakes are cheap to catch (tests, review, sandboxes).",
      "Every agent needs: step, token and cost caps; a stop condition; tool permissions; approval for risky actions; tracing; an outcome check.",
      "12-factor agents: most production “agents” are deterministic code with LLM steps at chosen points — own your prompts, your context window and your control flow.",
      "Tool design — the agent-computer interface — usually matters more than the prompt."
    ],
    "resources": [
      {
        "id": "SD-02-r1",
        "kind": "doc",
        "title": "Building effective agents",
        "source": "anthropic.com",
        "url": "https://www.anthropic.com/engineering/building-effective-agents",
        "minutes": 25,
        "estimate": true,
        "note": "The most-cited agent design reference. Know its five workflow patterns by name."
      },
      {
        "id": "SD-02-r2",
        "kind": "video",
        "title": "How We Build Effective Agents: Barry Zhang, Anthropic",
        "source": "AI Engineer",
        "url": "https://www.youtube.com/watch?v=D7_ipDqhtwk",
        "minutes": 15,
        "note": ""
      },
      {
        "id": "SD-02-r3",
        "kind": "video",
        "title": "12-Factor Agents: Patterns of reliable LLM applications — Dex Horthy, HumanLayer",
        "source": "AI Engineer",
        "url": "https://www.youtube.com/watch?v=8kMaTybvDUw",
        "minutes": 17,
        "note": "Twelve principles for agents that survive production — most of them are about owning control flow and context."
      },
      {
        "id": "SD-02-r4",
        "kind": "doc",
        "title": "A practical guide to building agents",
        "source": "openai.com",
        "url": "https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf",
        "minutes": 30,
        "estimate": true,
        "note": "When to build an agent, single- vs multi-agent orchestration, and layered guardrails."
      }
    ],
    "minutes": 87,
    "duration": "≈1h 27m",
    "questions": [
      "Workflow or agent — which is your default, and why?",
      "Name the workflow patterns and a use for each.",
      "What controls does every production agent need?",
      "What is the agent-computer interface, and why does it matter?"
    ],
    "asked": {
      "posts": 0,
      "items": 4
    }
  },
  {
    "id": "SD-04",
    "section": "D",
    "sectionLabel": "AI system design",
    "priority": "P1",
    "title": "Guardrails and security — prompt injection, least privilege, safe SQL",
    "why": "Every agent and RAG design question gets a security follow-up. Indirect prompt injection — instructions hidden in retrieved text or tool output — can't be reliably prevented by prompting, so the answer is architecture: treat model output as untrusted, enforce permissions outside the model, and never combine private data, untrusted content and an outbound channel without a human between them. Expect “how do you stop a text-to-SQL agent writing DROP TABLE?”.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "explain direct vs indirect injection, the lethal trifecta, layered text-to-SQL safety and the four kinds of guardrail.",
      "tooDeep": "jailbreak research; red-teaming tooling."
    },
    "know": [
      "Direct injection: the user tries to override the instructions. Indirect: instructions hidden in documents, web pages, emails or tool output the model reads.",
      "A prompt instruction is not an access control. Authorise in code at retrieval time (ACL filters) and at action time (tool permissions, approvals).",
      "The lethal trifecta (Willison): private data + untrusted content + external communication = an exfiltration risk. Remove one leg.",
      "Defensive patterns: plan-then-execute, action-selector, dual LLM (a quarantined model reads untrusted text; the privileged model never sees it), context minimisation.",
      "Text-to-SQL layers: a read-only role · allow-listed tables and views · tenant scope enforced in the database (RLS or views) · SQL parsed and validated · statement timeout · row limit · one statement only.",
      "Guardrail kinds: input (scope, injection heuristics, PII), output (schema, groundedness, policy, PII), tool (argument validation, permission, approval), budget (rate, cost).",
      "OWASP Top 10 for LLM applications (2025) heads the list with prompt injection, sensitive-information disclosure, improper output handling and excessive agency."
    ],
    "resources": [
      {
        "id": "SD-04-r1",
        "kind": "video",
        "title": "Prompt Injection, explained",
        "source": "Simon Willison",
        "url": "https://www.youtube.com/watch?v=FgxwCaL6UTA",
        "minutes": 12,
        "note": ""
      },
      {
        "id": "SD-04-r2",
        "kind": "video",
        "title": "LLM Chronicles #6.9: Design Patterns for Securing LLM Agents Against Prompt Injection (Paper Review)",
        "source": "Donato Capitella",
        "url": "https://www.youtube.com/watch?v=2Er7bmyhPfM",
        "minutes": 34,
        "note": "The six design patterns for agents that resist prompt injection, from the 2025 paper."
      },
      {
        "id": "SD-04-r3",
        "kind": "video",
        "title": "Design a Text-to-SQL Agent | Applied AI System Design",
        "source": "Aniket Wattamwar",
        "url": "https://www.youtube.com/watch?v=phxEKe3ngK0",
        "minutes": 27,
        "note": "A text-to-SQL agent designed end to end. Compare its guardrails with the layers listed here."
      },
      {
        "id": "SD-04-r4",
        "kind": "doc",
        "title": "The lethal trifecta for AI agents",
        "source": "simonwillison.net",
        "url": "https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/",
        "minutes": 10,
        "estimate": true,
        "note": "Private data, untrusted content and a way to communicate out: remove one of the three."
      },
      {
        "id": "SD-04-r5",
        "kind": "doc",
        "title": "Design Patterns for Securing LLM Agents against Prompt Injections",
        "source": "simonwillison.net",
        "url": "https://simonwillison.net/2025/Jun/13/prompt-injection-design-patterns/",
        "minutes": 20,
        "estimate": true,
        "note": ""
      },
      {
        "id": "SD-04-r6",
        "kind": "doc",
        "title": "OWASP Top 10 for LLM Applications",
        "source": "genai.owasp.org",
        "url": "https://genai.owasp.org/llm-top-10/",
        "minutes": 20,
        "estimate": true,
        "note": "Skim all ten; know prompt injection, improper output handling, excessive agency and unbounded consumption well."
      }
    ],
    "minutes": 123,
    "duration": "≈2h 3m",
    "questions": [
      "How do you stop a text-to-SQL agent from running DROP TABLE?",
      "What is indirect prompt injection, and how do you defend a RAG agent against it?",
      "Explain the lethal trifecta.",
      "A user may only see documents they're permitted to. Where is that enforced?"
    ],
    "asked": {
      "posts": 0,
      "items": 4
    }
  },
  {
    "id": "SD-05",
    "section": "D",
    "sectionLabel": "AI system design",
    "priority": "P1",
    "title": "Cost and latency — caching, routing, streaming, batching",
    "why": "“Quality improved but latency and cost are too high — what do you do?” is a standard prompt, and cost discipline is a hiring signal. Answer with a breakdown first (where do the tokens and milliseconds go?), then interventions you'd test on the same eval set: prompt caching, shorter contexts, model routing, semantic caching with care, streaming and batching.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "split a request's latency into time-to-first-token and generation, list six cost levers with their risks, and define cost per resolved task.",
      "tooDeep": "inference-kernel optimisation; GPU pricing."
    },
    "know": [
      "Latency = time to first token (grows with input length: prefill) + output tokens × time per token (decode). Output tokens cost more and take longer than input tokens.",
      "Prompt caching: the provider reuses an exact cached prefix — static content first; cached input is much cheaper and faster.",
      "Semantic caching reuses answers to similar queries. The danger: similar isn't same (“cancel my order” vs “don't cancel my order”), and answers can be stale or user-specific. High thresholds, per-user or per-tenant scope, TTLs.",
      "Model routing and cascades: a small model for easy queries; escalate on low confidence or failed validation.",
      "Fewer tokens: rerank and send fewer chunks, compress history, concise outputs.",
      "Stream for perceived latency; batch APIs (asynchronous, roughly half price) for offline jobs; run independent calls in parallel.",
      "Cost per resolved task beats cost per request: a cheap model that fails twice is expensive."
    ],
    "resources": [
      {
        "id": "SD-05-r1",
        "kind": "video",
        "title": "Prompt Caching Explained: Stop Overpaying for AI Agents",
        "source": "Hugging Face",
        "url": "https://www.youtube.com/watch?v=SkM4k4SKvCM",
        "minutes": 17,
        "note": ""
      },
      {
        "id": "SD-05-r2",
        "kind": "video",
        "title": "What is Prompt Caching? Optimize LLM Latency with AI Transformers",
        "source": "IBM Technology",
        "url": "https://www.youtube.com/watch?v=u57EnkQaUTY",
        "minutes": 9,
        "note": ""
      },
      {
        "id": "SD-05-r3",
        "kind": "video",
        "title": "Semantic Caching with Valkey and Redis: Reducing LLM Cost and Latency - Martin Visser",
        "source": "Percona",
        "url": "https://www.youtube.com/watch?v=7vdFUJgGOSs",
        "minutes": 26,
        "note": "Semantic caching in practice — thresholds, scoping and where it goes wrong."
      },
      {
        "id": "SD-05-r4",
        "kind": "doc",
        "title": "Prompt caching",
        "source": "platform.claude.com",
        "url": "https://platform.claude.com/docs/en/build-with-claude/prompt-caching",
        "minutes": 15,
        "estimate": true,
        "note": "How prefix caching works and what it costs; the same idea applies across providers."
      }
    ],
    "minutes": 67,
    "duration": "≈1h 7m",
    "questions": [
      "Quality improved but p95 latency doubled and cost tripled. What do you do, in order?",
      "How would you add semantic caching, and what can go wrong?",
      "What drives time to first token, and what drives total latency?",
      "Define cost per resolved task, and say why it beats cost per request."
    ],
    "asked": {
      "posts": 0,
      "items": 4
    }
  },
  {
    "id": "SD-06",
    "section": "D",
    "sectionLabel": "AI system design",
    "priority": "P2",
    "title": "Design: enterprise document Q&A (tenants, permissions, freshness)",
    "why": "The canonical applied-AI design question. Strong answers cover ingestion and freshness (change capture, deletes, re-indexing), access control at retrieval time, multi-tenancy, a latency budget and an eval plan — not only the box diagram.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "a 35-minute design with the data flow, one permission model, a latency budget, an eval plan and fallbacks.",
      "tooDeep": "sizing GPUs; vendor comparisons."
    },
    "know": [
      "Ingestion: connectors → parse → chunk → embed → index, with document id, version, tenant, ACL and timestamps as metadata.",
      "Freshness: change capture (webhooks, CDC, scheduled diffs); an update replaces all of a document's chunks; deletes and revocations propagate fast.",
      "Isolation: an index or partition per tenant (strong isolation, more operations) vs a shared index with a mandatory tenant filter (cheaper; needs filtering that keeps recall).",
      "Query path: auth → ACL-filtered hybrid retrieval → rerank → grounded answer with citations → groundedness check.",
      "A latency budget (say ~2 s to first token), evals per tenant slice, and fallbacks when the vector store or the model is down."
    ],
    "resources": [
      {
        "id": "SD-06-r1",
        "kind": "video",
        "title": "RAG at 10 Million Documents — System Design",
        "source": "Code with Lucian",
        "url": "https://www.youtube.com/watch?v=NQZqET-jjws",
        "minutes": 15,
        "note": ""
      },
      {
        "id": "SD-06-r2",
        "kind": "video",
        "title": "Access control for RAG and LLMs",
        "source": "Cerbos",
        "url": "https://www.youtube.com/watch?v=4VBHpziqw3o",
        "minutes": 7,
        "note": ""
      },
      {
        "id": "SD-06-r3",
        "kind": "doc",
        "title": "Build a custom RAG agent with LangGraph",
        "source": "docs.langchain.com",
        "url": "https://docs.langchain.com/oss/python/langgraph/agentic-rag",
        "minutes": 30,
        "estimate": true,
        "note": "Use it as the query-time core; the design question is everything around it."
      }
    ],
    "minutes": 52,
    "duration": "≈52m",
    "questions": [
      "Design document Q&A for 500 tenants and 10M documents. Walk me from ingestion to answer.",
      "An index per tenant, partitions, or a shared index with a filter — trade-offs?",
      "A document is deleted or a user loses access. How does the index stay correct, and how fast?",
      "Set a latency budget for the whole path.",
      "What's your fallback when the vector store or the model provider is down?"
    ],
    "asked": {
      "posts": 0,
      "items": 5
    }
  },
  {
    "id": "SD-08",
    "section": "D",
    "sectionLabel": "AI system design",
    "priority": "P2",
    "title": "Design: tool-using agent with approvals",
    "why": "Agent design questions test controls more than cleverness: tool schemas, least-privilege access, step and spend limits, idempotent tools, approval points, and verifying the outcome in the system of record.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "list the controls, say which are enforced in code, and say how you'd test the agent before launch.",
      "tooDeep": "multi-agent research architectures."
    },
    "know": [
      "Tools: typed and least-privilege; reads separate from writes; writes go through propose → approve → commit.",
      "Controls in code: per-user and per-tool permissions, caps on steps, tokens and spend, idempotency keys, approval tiers, timeouts.",
      "Verify success in the system of record — never trust the agent's claim that it worked.",
      "Testing: replay fixed scenarios in a sandbox, check the end state and the trajectory rules, several trials each.",
      "Trace every step with inputs and outputs for debugging and audit."
    ],
    "resources": [
      {
        "id": "SD-08-r1",
        "kind": "video",
        "title": "20 Agentic AI System Design Interview Questions & Solutions",
        "source": "Keerti Purswani",
        "url": "https://www.youtube.com/watch?v=I4sGn8Z1vpI",
        "minutes": 30,
        "note": ""
      },
      {
        "id": "SD-08-r2",
        "kind": "video",
        "title": "Agentic AI System Design Explained in 27 Minutes",
        "source": "Aishwarya Srinivasan",
        "url": "https://www.youtube.com/watch?v=mwN75EiGfCE",
        "minutes": 27,
        "note": "An agent system design walkthrough — note where approvals and limits sit."
      },
      {
        "id": "SD-08-r3",
        "kind": "doc",
        "title": "Writing effective tools for AI agents",
        "source": "anthropic.com",
        "url": "https://www.anthropic.com/engineering/writing-tools-for-agents",
        "minutes": 25,
        "estimate": true,
        "note": ""
      }
    ],
    "minutes": 82,
    "duration": "≈1h 22m",
    "questions": [
      "Design an agent that lets planners query and change replenishment settings in plain English.",
      "A tool call times out and the agent retries. How do you stop a write applying twice?",
      "How do you verify the agent's claim that it succeeded?",
      "Which tools get which permissions, and where is that enforced?",
      "What do you trace so a bad run can be debugged after the fact?"
    ],
    "asked": {
      "posts": 0,
      "items": 5
    }
  },
  {
    "id": "LLM-02",
    "section": "F",
    "sectionLabel": "Advanced: MCP, fine-tuning, serving",
    "priority": "P2",
    "title": "MCP and calling provider APIs directly",
    "why": "Interviewers increasingly ask without framework hand-waving: call the provider's tool-use API yourself, and know the MCP vocabulary — tools, resources, prompts, transports — plus its security problem. MCP is moving fast (LangChain 1.4 moved its MCP support into langchain.mcp), so check the current spec before quoting details.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "explain what MCP adds over plain function calling, its three server primitives, the two transports, and why third-party servers are untrusted.",
      "tooDeep": "writing an MCP server; the transport specification."
    },
    "know": [
      "MCP standardises how applications expose tools and data to models: servers offer tools (actions), resources (data to read) and prompts (templates); the host application's client connects and passes them to the model.",
      "Transports: stdio for local servers; Streamable HTTP for remote ones, with authorisation.",
      "MCP doesn't replace function calling — it's how tools are discovered and served; the model still emits tool calls.",
      "A third-party server's tool descriptions and outputs are untrusted input — a prompt-injection surface. Review servers and scope their permissions."
    ],
    "resources": [
      {
        "id": "LLM-02-r1",
        "kind": "video",
        "title": "Model Context Protocol Clearly Explained | MCP Beyond the Hype",
        "source": "codebasics",
        "url": "https://www.youtube.com/watch?v=tzrwxLNHtRY",
        "minutes": 15,
        "note": ""
      },
      {
        "id": "LLM-02-r2",
        "kind": "video",
        "title": "The Model Context Protocol (MCP)",
        "source": "Anthropic",
        "url": "https://www.youtube.com/watch?v=CQywdSdi5iA",
        "minutes": 20,
        "note": ""
      },
      {
        "id": "LLM-02-r3",
        "kind": "course",
        "title": "Introduction to Model Context Protocol",
        "source": "Anthropic Academy · free",
        "url": "https://anthropic.skilljar.com/introduction-to-model-context-protocol",
        "minutes": 90,
        "estimate": true,
        "note": "Self-paced; builds an MCP server and client in Python."
      },
      {
        "id": "LLM-02-r4",
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
      "What problem does MCP solve that plain function calling doesn't?",
      "Tools, resources and prompts in MCP — an example of each.",
      "How do you treat a third-party MCP server's tool descriptions?",
      "stdio or HTTP transport — when each?"
    ],
    "asked": {
      "posts": 0,
      "items": 4
    }
  },
  {
    "id": "LLM-03",
    "section": "F",
    "sectionLabel": "Advanced: MCP, fine-tuning, serving",
    "priority": "P2",
    "title": "Fine-tuning — SFT, LoRA/QLoRA, RLHF vs DPO, distillation",
    "why": "Asked as “when would you fine-tune instead of using RAG?”, “what does LoRA change?” and “RLHF vs DPO?”. The strong answer separates behaviour (fine-tune) from knowledge (RAG), knows the parameter-efficient methods, and reaches for distillation when a big model is too slow or costly for a narrow task.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "explain what SFT, LoRA, QLoRA, RLHF, DPO and distillation each change, and when fine-tuning beats prompting or RAG.",
      "tooDeep": "training-loop internals, hyperparameter tuning, GPU memory arithmetic."
    },
    "know": [
      "Fine-tuning teaches behaviour (format, style, a narrow task) reliably and facts unreliably; facts stay in RAG.",
      "SFT trains on input-output pairs; quality beats quantity; always compare with the best prompt on the base model.",
      "LoRA freezes the model and trains a small low-rank correction (an adapter); QLoRA does it on a 4-bit base.",
      "RLHF: a reward model learned from human comparisons, then reinforcement learning; DPO trains directly on preferred/rejected pairs.",
      "Distillation: a small model trained on a large model's outputs for one task, often with a cascade for uncertain cases."
    ],
    "resources": [
      {
        "id": "LLM-03-r1",
        "kind": "video",
        "title": "What is Low-Rank Adaptation (LoRA) | explained by the inventor",
        "source": "Edward Hu",
        "url": "https://www.youtube.com/watch?v=DhRoTONcyZE",
        "minutes": 7,
        "note": ""
      },
      {
        "id": "LLM-03-r2",
        "kind": "video",
        "title": "LoRA & QLoRA Fine-tuning Explained In-Depth",
        "source": "Mark Hennings",
        "url": "https://www.youtube.com/watch?v=t1caDsMzWBk",
        "minutes": 15,
        "note": ""
      },
      {
        "id": "LLM-03-r3",
        "kind": "video",
        "title": "Reinforcement Learning with Human Feedback (RLHF), Clearly Explained!!!",
        "source": "StatQuest with Josh Starmer",
        "url": "https://www.youtube.com/watch?v=qPN_XZcJf_s",
        "minutes": 18,
        "note": ""
      },
      {
        "id": "LLM-03-r4",
        "kind": "video",
        "title": "Direct Preference Optimization (DPO) - How to fine-tune LLMs directly without reinforcement learning",
        "source": "Luis Serrano Academy",
        "url": "https://www.youtube.com/watch?v=k2pD3k1485A",
        "minutes": 21,
        "note": ""
      },
      {
        "id": "LLM-03-r5",
        "kind": "doc",
        "title": "LoRA: Low-Rank Adaptation of Large Language Models",
        "source": "arxiv.org",
        "url": "https://arxiv.org/abs/2106.09685",
        "minutes": 10,
        "estimate": true,
        "note": "Read the abstract and the method figure."
      }
    ],
    "minutes": 71,
    "duration": "≈1h 11m",
    "questions": [
      "When would you fine-tune instead of using RAG?",
      "What does LoRA change, and why is it cheaper?",
      "RLHF vs DPO?",
      "Your extraction prompt is 95% accurate on a large model but too slow and expensive. What do you do?"
    ],
    "asked": {
      "posts": 0,
      "items": 4
    }
  },
  {
    "id": "LLM-06",
    "section": "F",
    "sectionLabel": "Advanced: MCP, fine-tuning, serving",
    "priority": "P2",
    "title": "Serving and inference — batching, KV cache, quantisation, vLLM",
    "why": "Once a company runs its own models, the AI engineer owns why throughput collapses at peak, why GPUs run out of memory and why the first token is slow. Interviews ask these at the concept level: prefill vs decode, continuous batching, PagedAttention, quantisation and speculative decoding.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "explain prefill vs decode, continuous batching, the KV cache and PagedAttention, quantisation trade-offs, speculative decoding, and how you'd debug slow time-to-first-token.",
      "tooDeep": "CUDA kernels, tensor-parallel communication internals."
    },
    "know": [
      "Prefill processes the prompt (decides time to first token); decode generates token by token (limited by memory speed).",
      "Continuous batching adds and removes requests every step, keeping GPUs busy; bigger batches trade latency for throughput.",
      "The KV cache grows with every active token; PagedAttention allocates it in pages, wasting little and enabling prefix sharing.",
      "Quantisation (8-bit, 4-bit: GPTQ, AWQ, GGUF) cuts memory and speeds decoding; measure quality on your own test set.",
      "Speculative decoding: a draft model proposes tokens, the big model verifies them in one pass, same output quality.",
      "Self-hosting pays only at high, steady utilisation; autoscale on queue length and keep warm capacity."
    ],
    "resources": [
      {
        "id": "LLM-06-r1",
        "kind": "video",
        "title": "What Is LLM Inference? How AI Models Generate Responses",
        "source": "IBM Technology",
        "url": "https://www.youtube.com/watch?v=615-yWyS1n0",
        "minutes": 8,
        "note": ""
      },
      {
        "id": "LLM-06-r2",
        "kind": "video",
        "title": "PagedAttention: Behind vLLM's Insane Speed",
        "source": "Tales Of Tensors",
        "url": "https://www.youtube.com/watch?v=6uPnLkCiy5g",
        "minutes": 7,
        "note": ""
      },
      {
        "id": "LLM-06-r3",
        "kind": "video",
        "title": "How LLMs survive in low precision | Quantization Fundamentals",
        "source": "Julia Turc",
        "url": "https://www.youtube.com/watch?v=qoQJq5UwV1c",
        "minutes": 21,
        "note": ""
      },
      {
        "id": "LLM-06-r4",
        "kind": "video",
        "title": "What is vLLM? Efficient AI Inference for Large Language Models",
        "source": "IBM Technology",
        "url": "https://www.youtube.com/watch?v=McLdlg5Gc9s",
        "minutes": 5,
        "note": ""
      },
      {
        "id": "LLM-06-r5",
        "kind": "doc",
        "title": "vLLM: Easy, Fast, and Cheap LLM Serving with PagedAttention",
        "source": "vllm.ai",
        "url": "https://vllm.ai/blog/2023-06-20-vllm",
        "minutes": 15,
        "estimate": true,
        "note": ""
      }
    ],
    "minutes": 56,
    "duration": "≈56m",
    "questions": [
      "Why is continuous batching faster than static batching?",
      "What problem does PagedAttention solve?",
      "Time to first token jumped from 400 ms to 4 seconds at peak. What do you check?",
      "What does quantisation trade off?"
    ],
    "asked": {
      "posts": 0,
      "items": 4
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

export const AI_STACK_TOTAL = 39;

export const AI_STACK_PRIORITY_COUNTS = {"P0":16,"P1":16,"P2":7,"P3":0};

export const AI_STACK_SECTION_COUNTS = {"S":1,"B":3,"R":10,"L":8,"H":3,"E":5,"D":6,"F":3};

export const AI_STACK_MINUTES = 3305;
