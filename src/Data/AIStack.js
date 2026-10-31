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
    "label": "Part 1 · How LLMs work",
    "chip": "Basics"
  },
  {
    "key": "R",
    "label": "Part 2 · Retrieval (RAG)",
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
    "label": "Part 5 · System design",
    "chip": "Design"
  },
  {
    "key": "F",
    "label": "Part 6 · Advanced",
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
    "id": "CH-01",
    "section": "B",
    "sectionLabel": "Part 1 · How LLMs work",
    "priority": "P0",
    "title": "Chapter 1 — How an LLM works: from next-word prediction to good prompts",
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
      "Attention: each token's query is compared with earlier tokens' keys, giving weights for a mix of their values; multi-head runs several in parallel."
    ],
    "resources": [
      {
        "id": "CH-01-r1",
        "kind": "video",
        "title": "[1hr Talk] Intro to Large Language Models",
        "source": "Andrej Karpathy",
        "url": "https://www.youtube.com/watch?v=zjkBMFhNj_g",
        "minutes": 60,
        "note": "00:00–17:52 how they work; 27:43 tool use; 45:43–58:37 security (jailbreaks, and prompt injection at 51:30). Skip the appendix."
      },
      {
        "id": "CH-01-r2",
        "kind": "video",
        "title": "Large Language Models explained briefly",
        "source": "3Blue1Brown",
        "url": "https://www.youtube.com/watch?v=LPZh9BOjkQs",
        "minutes": 8,
        "note": ""
      },
      {
        "id": "CH-01-r3",
        "kind": "video",
        "title": "Transformers, the tech behind LLMs | Deep Learning Chapter 5",
        "source": "3Blue1Brown",
        "url": "https://www.youtube.com/watch?v=wjZofJX0v4M",
        "minutes": 27,
        "note": ""
      },
      {
        "id": "CH-01-r4",
        "kind": "video",
        "title": "Attention in transformers, step-by-step | Deep Learning Chapter 6",
        "source": "3Blue1Brown",
        "url": "https://www.youtube.com/watch?v=eMlx5fFNoYc",
        "minutes": 26,
        "note": ""
      },
      {
        "id": "CH-01-r5",
        "kind": "doc",
        "title": "The Illustrated Transformer",
        "source": "jalammar.github.io",
        "url": "https://jalammar.github.io/illustrated-transformer/",
        "minutes": 30,
        "estimate": true,
        "note": "The classic visual walkthrough of queries, keys, values and multi-head attention."
      },
      {
        "id": "CH-01-r6",
        "kind": "video",
        "title": "Prompting 101 | Code w/ Claude",
        "source": "Anthropic",
        "url": "https://www.youtube.com/watch?v=ysPbXH0LpIE",
        "minutes": 25,
        "note": ""
      },
      {
        "id": "CH-01-r7",
        "kind": "doc",
        "title": "Prompt engineering overview",
        "source": "platform.claude.com",
        "url": "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview",
        "minutes": 25,
        "estimate": true,
        "note": ""
      },
      {
        "id": "CH-01-r8",
        "kind": "doc",
        "title": "Defeating Nondeterminism in LLM Inference",
        "source": "thinkingmachines.ai",
        "url": "https://thinkingmachines.ai/blog/defeating-nondeterminism-in-llm-inference/",
        "minutes": 30,
        "estimate": true,
        "note": "The real reason temperature 0 still varies. Read the introduction and the batch-invariance section."
      }
    ],
    "minutes": 231,
    "duration": "≈3h 51m",
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
      "Why does a longer prompt cost more time and money?",
      "Encoder vs decoder models — which do you use where?",
      "What is a mixture-of-experts model?"
    ],
    "asked": {
      "posts": 0,
      "items": 13
    }
  },
  {
    "id": "CH-02",
    "section": "R",
    "sectionLabel": "Part 2 · Retrieval (RAG)",
    "priority": "P0",
    "title": "Chapter 2 — RAG from scratch: from one question to 12,000 documents",
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
    "resources": [
      {
        "id": "CH-02-r1",
        "kind": "video",
        "title": "RAG From Scratch: Part 1 (Overview)",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=wd7TZ4w1mSw",
        "minutes": 5,
        "note": "Parts 1–4 of Lance Martin's RAG From Scratch: five minutes each, the whole pipeline."
      },
      {
        "id": "CH-02-r2",
        "kind": "video",
        "title": "RAG From Scratch: Part 2 (Indexing)",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=bjb_EMsTDKI",
        "minutes": 5,
        "note": ""
      },
      {
        "id": "CH-02-r3",
        "kind": "video",
        "title": "RAG From Scratch: Part 3 (Retrieval)",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=LxNVgdIz9sU",
        "minutes": 5,
        "note": ""
      },
      {
        "id": "CH-02-r4",
        "kind": "video",
        "title": "RAG From Scratch: Part 4 (Generation)",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=Vw52xyyFsB8",
        "minutes": 6,
        "note": ""
      },
      {
        "id": "CH-02-r5",
        "kind": "video",
        "title": "The BEST Way to Chunk Text for RAG",
        "source": "Adam Lucek",
        "url": "https://www.youtube.com/watch?v=Pk2BeaGbcTE",
        "minutes": 33,
        "note": ""
      },
      {
        "id": "CH-02-r6",
        "kind": "video",
        "title": "Training State-of-the-Art Sentence Embedding Models",
        "source": "Nils Reimers",
        "url": "https://www.youtube.com/watch?v=RHXZKUr8qOY",
        "minutes": 44,
        "note": "From the author of sentence-transformers: how state-of-the-art embedding models are trained."
      },
      {
        "id": "CH-02-r7",
        "kind": "video",
        "title": "The Best RAG Technique Yet? Anthropic’s Contextual Retrieval Explained!",
        "source": "Prompt Engineering",
        "url": "https://www.youtube.com/watch?v=tmiBae2goJM",
        "minutes": 16,
        "note": "Contextual retrieval: why a chunk out of context retrieves badly, and the fix."
      },
      {
        "id": "CH-02-r8",
        "kind": "doc",
        "title": "Introducing Contextual Retrieval",
        "source": "anthropic.com",
        "url": "https://www.anthropic.com/research/contextual-retrieval",
        "minutes": 15,
        "estimate": true,
        "note": ""
      },
      {
        "id": "CH-02-r9",
        "kind": "doc",
        "title": "SentenceTransformers documentation",
        "source": "sbert.net",
        "url": "https://sbert.net/",
        "minutes": 20,
        "estimate": true,
        "note": "Read the training overview and the losses page (MultipleNegativesRankingLoss is the in-batch negatives loss)."
      }
    ],
    "minutes": 149,
    "duration": "≈2h 29m",
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
      "What are Matryoshka embeddings, and why would you use them?"
    ],
    "asked": {
      "posts": 0,
      "items": 14
    }
  },
  {
    "id": "CH-03",
    "section": "R",
    "sectionLabel": "Part 2 · Retrieval (RAG)",
    "priority": "P0",
    "title": "Chapter 3 — Searching fast and searching well: vector indexes, hybrid search, reranking",
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
      "Dedicated vector databases (Qdrant, Weaviate, Milvus, managed Pinecone): filtering, sharding and replication built in."
    ],
    "resources": [
      {
        "id": "CH-03-r1",
        "kind": "video",
        "title": "Vector Database Search - Hierarchical Navigable Small Worlds (HNSW) Explained",
        "source": "DataMListic",
        "url": "https://www.youtube.com/watch?v=77QH0Y2PYKg",
        "minutes": 8,
        "note": ""
      },
      {
        "id": "CH-03-r2",
        "kind": "video",
        "title": "Metadata Filtering for Vector Search + Latest Filter Tech",
        "source": "James Briggs",
        "url": "https://www.youtube.com/watch?v=H_kJDHvu-v8",
        "minutes": 34,
        "note": "02:03–12:22 is the concept: why filter, pre-filter, post-filter, single-stage. The rest is Pinecone API code you can skip."
      },
      {
        "id": "CH-03-r3",
        "kind": "doc",
        "title": "Hierarchical Navigable Small Worlds (HNSW)",
        "source": "pinecone.io",
        "url": "https://www.pinecone.io/learn/series/faiss/hnsw/",
        "minutes": 25,
        "estimate": true,
        "note": ""
      },
      {
        "id": "CH-03-r4",
        "kind": "video",
        "title": "PostgreSQL Hybrid Search Course – Keyword (BM25) + Vector Retrieval",
        "source": "freeCodeCamp.org",
        "url": "https://www.youtube.com/watch?v=kT7nXO32L-Q",
        "minutes": 60,
        "note": "07:20 BM25 (IDF, term frequency, document length); 27:40 BM25 inside Postgres; 43:28 Reciprocal Rank Fusion. Your own stack: Postgres plus pgvector."
      },
      {
        "id": "CH-03-r5",
        "kind": "video",
        "title": "Understanding Reciprocal Rank Fusion in Hybrid Search [Advanced RAG]",
        "source": "TechViz - The Data Science Guy",
        "url": "https://www.youtube.com/watch?v=6dDvfGrxFns",
        "minutes": 8,
        "note": ""
      },
      {
        "id": "CH-03-r6",
        "kind": "video",
        "title": "Rerank for better RAG (Explained)",
        "source": "vectorize",
        "url": "https://www.youtube.com/watch?v=K1F8BIgcoNk",
        "minutes": 14,
        "note": ""
      },
      {
        "id": "CH-03-r7",
        "kind": "doc",
        "title": "Rerankers and Two-Stage Retrieval",
        "source": "pinecone.io",
        "url": "https://www.pinecone.io/learn/series/rag/rerankers/",
        "minutes": 20,
        "estimate": true,
        "note": ""
      },
      {
        "id": "CH-03-r8",
        "kind": "video",
        "title": "What is a Vector Database? Powering Semantic Search & AI Applications",
        "source": "IBM Technology",
        "url": "https://www.youtube.com/watch?v=gl1r1XV0SLw",
        "minutes": 10,
        "note": ""
      },
      {
        "id": "CH-03-r9",
        "kind": "doc",
        "title": "pgvector README",
        "source": "github.com/pgvector",
        "url": "https://github.com/pgvector/pgvector",
        "minutes": 20,
        "estimate": true,
        "note": "Read the HNSW, IVFFlat, Filtering and Iterative Index Scans sections."
      }
    ],
    "minutes": 199,
    "duration": "≈3h 19m",
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
      "Why isn't FAISS a database?"
    ],
    "asked": {
      "posts": 0,
      "items": 13
    }
  },
  {
    "id": "CH-04",
    "section": "R",
    "sectionLabel": "Part 2 · Retrieval (RAG)",
    "priority": "P1",
    "title": "Chapter 4 — When retrieval fails: better questions, self-correction, messy documents",
    "why": "Real RAG systems fail on vague questions, follow-ups, bad parsing and stale documents. Query rewriting, corrective RAG, a disciplined debugging walk, ingestion of PDFs and tables, and knowing when RAG is the wrong tool are what separate people who shipped RAG from people who demoed it.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "name the query transformations, draw corrective RAG with its loop bound, debug a wrong answer stage by stage, handle tables and scans, and argue long context vs RAG.",
      "tooDeep": "every RAG paper variant; building GraphRAG."
    },
    "know": [
      "Multi-query / RAG-Fusion: 3–5 rephrasings, retrieve for each, fuse with RRF. Lifts recall on vague questions; costs one LLM call and N retrievals.",
      "Decomposition splits multi-part questions; step-back asks a more general question first; HyDE embeds a hypothetical answer instead of the question.",
      "First question: was the answer in the retrieved context? No → ingestion or retrieval. Yes → context assembly or generation.",
      "Ingestion: bad parsing (tables, scanned PDFs), missing documents, a stale index, a wrong ACL filter. Retrieval: chunk boundaries, vocabulary mismatch, k too small, poor ranking.",
      "Detect the document type first: a digital PDF has a text layer; a scan needs OCR.",
      "Layout-aware parsers (Docling, Unstructured, or a vision model per page) recover reading order, headings and tables.",
      "Long context doesn't remove RAG: cost and latency scale with tokens, quality degrades with length, and there's no per-user access control, freshness or citation by default. Combine them: retrieve, then use a generous window.",
      "Prompt caching makes long static context cheap — the right answer for a small, stable corpus."
    ],
    "resources": [
      {
        "id": "CH-04-r1",
        "kind": "video",
        "title": "Self-reflective RAG with LangGraph: Self-RAG and CRAG",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=pbAd8O1Lvm4",
        "minutes": 18,
        "note": "Self-RAG and corrective RAG as LangGraph graphs — the shape to draw in an interview."
      },
      {
        "id": "CH-04-r2",
        "kind": "video",
        "title": "RAG from scratch: Part 5 (Query Translation -- Multi Query)",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=JChPi0CRnDY",
        "minutes": 6,
        "note": ""
      },
      {
        "id": "CH-04-r3",
        "kind": "video",
        "title": "How to debug Retrieval for RAG",
        "source": "Hamel Husain",
        "url": "https://www.youtube.com/watch?v=N9SZ9o2gReE",
        "minutes": 41,
        "note": "04:36 how DCG and NDCG work; 18:11 “the first thing to do on any RAG team”; 37:02 the inner and outer loops of retrieval quality."
      },
      {
        "id": "CH-04-r4",
        "kind": "video",
        "title": "Lost in the Middle: How Language Models use Long Context - Explained!",
        "source": "Weaviate vector database",
        "url": "https://www.youtube.com/watch?v=Kf3LeaUGwlg",
        "minutes": 24,
        "note": ""
      },
      {
        "id": "CH-04-r5",
        "kind": "doc",
        "title": "Systematically Improving Your RAG",
        "source": "jxnl.co",
        "url": "https://jxnl.co/writing/2024/05/22/systematically-improving-your-rag/",
        "minutes": 20,
        "estimate": true,
        "note": "Segment questions by type, find the segments that fail, fix those first."
      },
      {
        "id": "CH-04-r6",
        "kind": "video",
        "title": "What Is Docling? Transforming Unstructured Data for RAG and AI",
        "source": "IBM Technology",
        "url": "https://www.youtube.com/watch?v=zSA7ylHP6AY",
        "minutes": 8,
        "note": ""
      },
      {
        "id": "CH-04-r7",
        "kind": "video",
        "title": "Is RAG Still Needed? Choosing the Best Approach for LLMs",
        "source": "IBM Technology",
        "url": "https://www.youtube.com/watch?v=UabBYexBD4k",
        "minutes": 11,
        "note": ""
      },
      {
        "id": "CH-04-r8",
        "kind": "video",
        "title": "Graph RAG Simply Explained",
        "source": "codebasics",
        "url": "https://www.youtube.com/watch?v=2o0Q85JUZNk",
        "minutes": 14,
        "note": ""
      },
      {
        "id": "CH-04-r9",
        "kind": "doc",
        "title": "Context Rot: How Increasing Input Tokens Impacts LLM Performance",
        "source": "trychroma.com",
        "url": "https://www.trychroma.com/research/context-rot",
        "minutes": 20,
        "estimate": true,
        "note": "Evidence that adding tokens degrades performance even on simple tasks — the case for fewer, better chunks."
      }
    ],
    "minutes": 162,
    "duration": "≈2h 42m",
    "questions": [
      "Draw corrective RAG. What stops it looping forever?",
      "What does corrective RAG cost, and how do you know it's worth it?",
      "Multi-query, HyDE or decomposition — when each?",
      "What is agentic RAG, and what are its risks?",
      "How would you route a query between a vector index, SQL and “no retrieval”?",
      "The right document exists, but the answer is wrong. Debug it.",
      "How do you tell a retrieval failure from a generation failure at scale?",
      "What is “lost in the middle”, and what do you do about it?",
      "The model answers confidently when the context doesn't contain the answer. Fix it.",
      "How would you handle tables in a RAG system?",
      "Some of your PDFs are scans. What changes?",
      "How do you keep the index in sync as 12,000 documents change?",
      "Models have million-token context windows now. Is RAG dead?",
      "What problem does GraphRAG solve that vector RAG doesn't?",
      "“How many tickets were escalated last month, by region?” — RAG or SQL?"
    ],
    "asked": {
      "posts": 0,
      "items": 15
    }
  },
  {
    "id": "CH-05",
    "section": "A",
    "sectionLabel": "Part 3 · Agents",
    "priority": "P0",
    "title": "Chapter 5 — From assistant to agent: tools, LangChain and LangGraph",
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
      "Node-style hooks: `before_agent`, `before_model`, `after_model`, `after_agent` (can update state; model hooks can jump). Wrap-style: `wrap_model_call`, `wrap_tool_call` (modify, skip or retry).",
      "Order for [m1, m2, m3]: before hooks m1→m3, wrap hooks nested with m1 outermost, after hooks m3→m1.",
      "State: a TypedDict or Pydantic schema. Nodes are functions `state → partial update`; they never mutate state in place.",
      "Reducers decide how updates merge: the default overwrites; `Annotated[list, operator.add]` appends; `add_messages` appends or replaces by message id. Two parallel writes to a key with no reducer raise an error."
    ],
    "resources": [
      {
        "id": "CH-05-r1",
        "kind": "video",
        "title": "How LLM Tool Calling Works",
        "source": "Tommy Eberle",
        "url": "https://www.youtube.com/watch?v=QiRdYCNXAxk",
        "minutes": 16,
        "note": ""
      },
      {
        "id": "CH-05-r2",
        "kind": "doc",
        "title": "Writing effective tools for AI agents",
        "source": "anthropic.com",
        "url": "https://www.anthropic.com/engineering/writing-tools-for-agents",
        "minutes": 25,
        "estimate": true,
        "note": "How to design and evaluate tools for agents — the best source for “what makes a good tool?”."
      },
      {
        "id": "CH-05-r3",
        "kind": "video",
        "title": "LangChain vs LangGraph: A Tale of Two Frameworks",
        "source": "IBM Technology",
        "url": "https://www.youtube.com/watch?v=qAF1NjEVHhY",
        "minutes": 10,
        "note": ""
      },
      {
        "id": "CH-05-r4",
        "kind": "doc",
        "title": "What's new in LangChain v1",
        "source": "docs.langchain.com",
        "url": "https://docs.langchain.com/oss/python/releases/langchain-v1",
        "minutes": 15,
        "estimate": true,
        "note": ""
      },
      {
        "id": "CH-05-r5",
        "kind": "course",
        "title": "Introduction to LangChain — Python",
        "source": "LangChain Academy · free",
        "url": "https://academy.langchain.com/courses/foundation-introduction-to-langchain-python",
        "minutes": 0,
        "estimate": false,
        "note": "The official v1 course: create_agent, tools, structured output, middleware, tracing in LangSmith."
      },
      {
        "id": "CH-05-r6",
        "kind": "doc",
        "title": "Middleware overview",
        "source": "docs.langchain.com",
        "url": "https://docs.langchain.com/oss/python/langchain/middleware/overview",
        "minutes": 15,
        "estimate": true,
        "note": ""
      },
      {
        "id": "CH-05-r7",
        "kind": "course",
        "title": "Introduction to LangGraph — Python",
        "source": "LangChain Academy · free",
        "url": "https://academy.langchain.com/courses/intro-to-langgraph",
        "minutes": 0,
        "estimate": false,
        "note": "The official course. Modules 1–3 cover state, reducers, routing, agents, memory and human-in-the-loop — most of this section."
      },
      {
        "id": "CH-05-r8",
        "kind": "video",
        "title": "LangGraph Explained for Beginners",
        "source": "KodeKloud",
        "url": "https://www.youtube.com/watch?v=cUfLrn3TM3M",
        "minutes": 13,
        "note": ""
      },
      {
        "id": "CH-05-r9",
        "kind": "doc",
        "title": "Graph API overview",
        "source": "docs.langchain.com",
        "url": "https://docs.langchain.com/oss/python/langgraph/graph-api",
        "minutes": 30,
        "estimate": true,
        "note": "State, reducers, nodes, edges, Send, Command and super-steps — the reference for every question here."
      }
    ],
    "minutes": 124,
    "duration": "≈2h 4m",
    "questions": [
      "Write a tool-calling agent loop without a framework.",
      "How does the model “know” about your tools? What actually reaches it?",
      "How do you get reliable structured output from an LLM?",
      "A tool call fails or times out. What does the agent do?",
      "What makes a good tool for an agent?",
      "LangChain vs LangGraph — when do you use each?",
      "Would you use LangChain in production?",
      "What changed in LangChain v1?",
      "What does LCEL give you, and is it still relevant?",
      "Your agent loops and burns tokens. What middleware do you add?",
      "In what order do middleware hooks run?",
      "How would you send easy questions to a cheap model and hard ones to a strong model?",
      "Why is a model fallback risky, and how do you make it safe?",
      "Sketch a LangGraph agent: state, nodes, edges.",
      "What is a reducer, and what happens without one when two nodes write the same key in parallel?",
      "Conditional edge or Command — when each?",
      "What is a super-step?",
      "How do you stop a LangGraph loop from running forever?"
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
    "title": "Chapter 6 — Agents that remember and keep going: persistence, memory, fan-out and teams",
    "why": "Production agents crash, get redeployed, hold long conversations, process thousands of items and sometimes split work between agents. Checkpoints and idempotency, memory and context engineering, fan-out with Send, and the multi-agent trade-offs are the follow-ups to any agent design.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "explain threads and checkpoints, what re-runs after a crash and why side effects must be idempotent, trim vs summarise vs retrieve, Send-based map-reduce, and when multi-agent pays off.",
      "tooDeep": "writing your own checkpointer; agent-to-agent protocols."
    },
    "know": [
      "A checkpointer saves a `StateSnapshot` at every super-step, keyed by `thread_id` (and `checkpoint_id`). Same thread_id = continue that run; a new one = fresh state.",
      "Production savers: `PostgresSaver` / `AsyncPostgresSaver` (also MongoDB and others). `InMemorySaver` is for tests: state dies with the process.",
      "Context engineering: deciding what goes into the window on every call, in what order, and what is left out.",
      "Short-term memory is the thread's state; manage it by trimming, summarising, retrieving old turns, and pinning key facts in state fields.",
      "Map-reduce: a conditional edge returns `[Send('node', payload) ...]`; branches run in one super-step; a list reducer collects results; cap with `max_concurrency`.",
      "Subgraphs are compiled graphs used as nodes, with their own state and checkpoint namespace; shared fields flow by name.",
      "Patterns: supervisor (one router agent delegates) · handoffs / swarm (agents pass control with `Command(goto=...)`) · agent-as-tool / subagents (a main agent calls specialists and gets back a summary).",
      "Several agents help when work is parallel and separable (research breadth), one window can't hold all the intermediate work, or tools and prompts need isolation. They hurt when steps depend on each other's decisions."
    ],
    "resources": [
      {
        "id": "CH-06-r1",
        "kind": "video",
        "title": "Persistence in LangGraph | Time Travel in LangGraph | CampusX",
        "source": "CampusX",
        "url": "https://www.youtube.com/watch?v=_IPP7_Bi8uA",
        "minutes": 58,
        "note": "14:50 checkpointer, 20:10 threads, 38:05 fault tolerance, 44:28 human in the loop. Hinglish."
      },
      {
        "id": "CH-06-r2",
        "kind": "doc",
        "title": "Persistence",
        "source": "docs.langchain.com",
        "url": "https://docs.langchain.com/oss/python/langgraph/persistence",
        "minutes": 25,
        "estimate": true,
        "note": "Threads, checkpoints, the store, and durable execution (the durable-execution page now redirects here)."
      },
      {
        "id": "CH-06-r3",
        "kind": "video",
        "title": "Context Engineering for Agents",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=4GiqzUHD5AA",
        "minutes": 22,
        "note": "Write, select, compress, isolate — the four strategies with examples from real agents."
      },
      {
        "id": "CH-06-r4",
        "kind": "doc",
        "title": "Effective context engineering for AI agents",
        "source": "anthropic.com",
        "url": "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents",
        "minutes": 25,
        "estimate": true,
        "note": ""
      },
      {
        "id": "CH-06-r5",
        "kind": "video",
        "title": "LangGraph - Controllability with Map Reduce",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=JQznvlSatPQ",
        "minutes": 9,
        "note": ""
      },
      {
        "id": "CH-06-r6",
        "kind": "doc",
        "title": "How we built our multi-agent research system",
        "source": "anthropic.com",
        "url": "https://www.anthropic.com/engineering/multi-agent-research-system",
        "minutes": 25,
        "estimate": true,
        "note": "The best production case study: orchestrator plus parallel subagents, token costs, prompting and evaluation lessons."
      },
      {
        "id": "CH-06-r7",
        "kind": "doc",
        "title": "Don't Build Multi-Agents",
        "source": "cognition.com",
        "url": "https://cognition.com/blog/dont-build-multi-agents",
        "minutes": 15,
        "estimate": true,
        "note": "The counter-argument: share full context or don't split. Read both and form your own position."
      },
      {
        "id": "CH-06-r8",
        "kind": "video",
        "title": "What are Deep Agents?",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=IVts6ztrkFg",
        "minutes": 8,
        "note": ""
      }
    ],
    "minutes": 187,
    "duration": "≈3h 7m",
    "questions": [
      "Where is LangGraph state stored, and what happens if the process crashes mid-run?",
      "Why must nodes be idempotent in LangGraph?",
      "Thread vs checkpoint vs store?",
      "What is time travel in LangGraph, and when would you use it?",
      "Which durability mode would you choose?",
      "The conversation exceeds the context window. What are your options?",
      "Short-term vs long-term memory in LangGraph?",
      "What can go wrong with long-term memory?",
      "Prompt engineering vs context engineering?",
      "Summarise 500 documents and combine the summaries. Model it in LangGraph.",
      "When would you use a subgraph?",
      "How would you stream a multi-step agent's progress to a UI?",
      "One agent or several — how do you decide?",
      "Supervisor vs swarm (handoffs) — what's the difference?",
      "What did Anthropic learn from building their multi-agent research system?",
      "What is a “deep agent”?"
    ],
    "asked": {
      "posts": 0,
      "items": 16
    }
  },
  {
    "id": "CH-07",
    "section": "A",
    "sectionLabel": "Part 3 · Agents",
    "priority": "P0",
    "title": "Chapter 7 — Agents that ask before they act: human-in-the-loop",
    "why": "Any agent that changes real data needs approvals, and interviewers probe the exact mechanics (interrupt, resume, what re-runs) and the operational follow-ups: what needs a human, what they see, and what happens when nobody answers or the data changed meanwhile.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "walk interrupt and resume exactly, design risk-tiered approvals with staged writes, and answer the expiry, stale-data, concurrency and deploy questions.",
      "tooDeep": "checkpoint serialisation; workflow-engine products."
    },
    "know": [
      "`interrupt(payload)` raises a special signal, the checkpointer saves state, and the caller receives the payload (`result['__interrupt__']`). Needs a checkpointer and a `thread_id`.",
      "Resume: invoke again with `Command(resume=value)` on the same `thread_id`; `value` becomes the return value of `interrupt()`.",
      "Tier actions by risk: read-only → automatic; reversible, low-impact writes → automatic with audit; irreversible, financial, external-communication or bulk writes → human approval.",
      "Approve the **proposal, not the intent**: show the exact tool call or diff (what changes, before → after, blast radius), the agent's reasoning and its sources.",
      "A paused run costs only storage; a durable checkpointer (Postgres) keeps it across restarts and deploys.",
      "Expiry: staged writes and pending approvals carry a TTL; a sweeper expires them, discards the overlay and notifies; resuming an expired run is refused."
    ],
    "resources": [
      {
        "id": "CH-07-r1",
        "kind": "doc",
        "title": "Interrupts",
        "source": "docs.langchain.com",
        "url": "https://docs.langchain.com/oss/python/langgraph/interrupts",
        "minutes": 20,
        "estimate": true,
        "note": "Read the rules section twice — every pitfall interviewers probe is listed there."
      },
      {
        "id": "CH-07-r2",
        "kind": "video",
        "title": "LangGraph interrupt: Making it easier to build human-in-the-loop agents",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=6t7YJcEFUIY",
        "minutes": 8,
        "note": ""
      },
      {
        "id": "CH-07-r3",
        "kind": "video",
        "title": "Human in the loop (HITL) using LangGraph | CampusX",
        "source": "CampusX",
        "url": "https://www.youtube.com/watch?v=xxqZzVZ4gE0",
        "minutes": 40,
        "note": "14:21 HITL from a LangGraph perspective, 16:30 the interrupt workflow, 22:49 code. Hinglish."
      },
      {
        "id": "CH-07-r4",
        "kind": "doc",
        "title": "Human-in-the-loop (middleware)",
        "source": "docs.langchain.com",
        "url": "https://docs.langchain.com/oss/python/langchain/human-in-the-loop",
        "minutes": 15,
        "estimate": true,
        "note": "The same mechanism packaged for create_agent: approve, edit, reject or respond per tool call."
      },
      {
        "id": "CH-07-r5",
        "kind": "doc",
        "title": "12-Factor Agents",
        "source": "github.com/humanlayer",
        "url": "https://github.com/humanlayer/12-factor-agents",
        "minutes": 40,
        "estimate": true,
        "note": "Factors 6 (launch / pause / resume) and 7 (contact humans with tool calls) are the HITL ones. All twelve are short and worth reading."
      },
      {
        "id": "CH-07-r6",
        "kind": "video",
        "title": "Ambient Agents and the New Agent Inbox ft. Harrison Chase",
        "source": "Sequoia Capital",
        "url": "https://www.youtube.com/watch?v=egSh4TxS5go",
        "minutes": 8,
        "note": "Why the future of agents is background work plus an inbox for human decisions."
      },
      {
        "id": "CH-07-r7",
        "kind": "video",
        "title": "Optimistic Locking - What, When, Why, and How?",
        "source": "Arpit Bhayani",
        "url": "https://www.youtube.com/watch?v=eMotoFvgdUo",
        "minutes": 17,
        "note": "Compare-and-set with a version column: the fix for “the data changed while the approver was deciding”."
      }
    ],
    "minutes": 148,
    "duration": "≈2h 28m",
    "questions": [
      "Walk through what happens when a node calls interrupt().",
      "The node writes to Redis and then calls interrupt(). What happens on resume?",
      "Why can't you call interrupt() in a loop over a list that may change?",
      "Dynamic interrupt() vs interrupt_before / interrupt_after?",
      "Two parallel branches are both waiting for approval. How do you resume?",
      "Design approvals for an agent that can change inventory parameters. What needs a human?",
      "What should the approver see, and why does it matter?",
      "Why “approve the proposal, not the intent”?",
      "How do rejections make the agent better over time?",
      "The approver never responds. What happens to the staged write?",
      "The underlying data changed while the human was deciding. Now what?",
      "Two planners approve conflicting changes to the same parameter. What happens?",
      "You deploy a new version of the graph while 200 runs are paused at an interrupt. What breaks?",
      "How would you audit an agent that makes approved changes?"
    ],
    "asked": {
      "posts": 0,
      "items": 14
    }
  },
  {
    "id": "CH-08",
    "section": "E",
    "sectionLabel": "Part 4 · Evals",
    "priority": "P0",
    "title": "Chapter 8 — Is it actually working? Error analysis, LLM judges and RAG metrics",
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
      "MRR = the mean, over queries, of 1 / rank of the first relevant result."
    ],
    "resources": [
      {
        "id": "CH-08-r1",
        "kind": "video",
        "title": "Error Analysis: The Highest ROI Technique In AI Engineering",
        "source": "Hamel Husain",
        "url": "https://www.youtube.com/watch?v=e2i6JbU2R-s",
        "minutes": 12,
        "note": ""
      },
      {
        "id": "CH-08-r2",
        "kind": "video",
        "title": "LLM Evals: Common Mistakes",
        "source": "Hamel Husain",
        "url": "https://www.youtube.com/watch?v=GL0XhAj5LPE",
        "minutes": 28,
        "note": "Hold any eval setup up against each mistake: generic metrics, unvalidated judges, no error analysis."
      },
      {
        "id": "CH-08-r3",
        "kind": "doc",
        "title": "LLM Evals: Everything You Need to Know (FAQ)",
        "source": "hamel.dev",
        "url": "https://hamel.dev/blog/posts/evals-faq/",
        "minutes": 40,
        "estimate": true,
        "note": "Short answers to every practical question: judges, error analysis, golden-set size, agreement, tooling."
      },
      {
        "id": "CH-08-r4",
        "kind": "doc",
        "title": "Using LLM-as-a-Judge For Evaluation: A Complete Guide",
        "source": "hamel.dev",
        "url": "https://hamel.dev/blog/posts/llm-judge/",
        "minutes": 30,
        "estimate": true,
        "note": "The step-by-step method: a domain expert, binary verdicts with critiques, iterate until the judge agrees with the expert."
      },
      {
        "id": "CH-08-r5",
        "kind": "video",
        "title": "How To Build AI Evals",
        "source": "Hamel Husain",
        "url": "https://www.youtube.com/watch?v=mF4CaijvJos",
        "minutes": 34,
        "note": "A case study. 19:05 calibrating judges against production; 20:44 judges as a CI gate and on daily production samples."
      },
      {
        "id": "CH-08-r6",
        "kind": "doc",
        "title": "Evaluating the Effectiveness of LLM-Evaluators (aka LLM-as-Judge)",
        "source": "eugeneyan.com",
        "url": "https://eugeneyan.com/writing/llm-evaluators/",
        "minutes": 40,
        "estimate": true,
        "note": "The survey: which judge setups agree with humans, and where they fail."
      },
      {
        "id": "CH-08-r7",
        "kind": "video",
        "title": "Every Ranking Metric : MRR, MAP, NDCG",
        "source": "ritvikmath",
        "url": "https://www.youtube.com/watch?v=2XegvMul_mE",
        "minutes": 21,
        "note": "The ranking metrics — MRR, MAP and NDCG — with worked examples."
      },
      {
        "id": "CH-08-r8",
        "kind": "doc",
        "title": "List of available metrics",
        "source": "docs.ragas.io",
        "url": "https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/",
        "minutes": 25,
        "estimate": true,
        "note": "Read faithfulness, response relevancy, context precision and context recall."
      }
    ],
    "minutes": 230,
    "duration": "≈3h 50m",
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
      "You report recall@10 on 51 questions. How much do you trust a 0.02 difference?"
    ],
    "asked": {
      "posts": 0,
      "items": 14
    }
  },
  {
    "id": "CH-09",
    "section": "E",
    "sectionLabel": "Part 4 · Evals",
    "priority": "P1",
    "title": "Chapter 9 — Evaluating agents and shipping safely",
    "why": "Agents take many steps, change data and vary between runs, so they need outcome and trajectory checks and pass^k. Then production: traces, online evals, shadow and canary launches, A/B tests, and catching a silent model change before users do.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "evaluate an agent before launch, compute pass^k, design a launch ladder with rollback triggers, and list what a trace must hold.",
      "tooDeep": "benchmark leaderboards; building a tracing backend."
    },
    "know": [
      "Three levels: final outcome (did the task succeed? check the system of record), trajectory (the sequence of tool calls against rules or a reference), single step (given this state, is the next call right?).",
      "Grade outcomes over exact paths — rigid step matching punishes valid alternatives. Use trajectory checks for must / must-not rules (approval before a write; never call delete).",
      "A trace is a tree of spans per request: each LLM call, retrieval and tool call with inputs, outputs, model, tokens, latency, cost and errors (LangSmith, Langfuse, or OpenTelemetry's GenAI conventions).",
      "Online evals: run reference-free checks (judges, code assertions) on a sample of production traces; alert on drops per criterion and slice."
    ],
    "resources": [
      {
        "id": "CH-09-r1",
        "kind": "doc",
        "title": "Demystifying evals for AI agents",
        "source": "anthropic.com",
        "url": "https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents",
        "minutes": 20,
        "estimate": true,
        "note": "Graders (code, model, human), capability vs regression, pass@k vs pass^k, and an eight-step roadmap that starts from 20–50 real failures."
      },
      {
        "id": "CH-09-r2",
        "kind": "video",
        "title": "How to evaluate agent trajectories with AgentEvals",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=FCKjETgr54U",
        "minutes": 12,
        "note": ""
      },
      {
        "id": "CH-09-r3",
        "kind": "video",
        "title": "How to evaluate agents in practice",
        "source": "Google Cloud Tech",
        "url": "https://www.youtube.com/watch?v=vuBvf7ZRKTA",
        "minutes": 11,
        "note": ""
      },
      {
        "id": "CH-09-r4",
        "kind": "video",
        "title": "Observability and Evals for AI Agents: A Simple Breakdown",
        "source": "LangChain",
        "url": "https://www.youtube.com/watch?v=FDVdLrloFOw",
        "minutes": 15,
        "note": ""
      },
      {
        "id": "CH-09-r5",
        "kind": "video",
        "title": "10 min Walkthrough of Langfuse – Open Source LLM Observability, Evaluation, and Prompt Management",
        "source": "Langfuse",
        "url": "https://www.youtube.com/watch?v=2E8iTvGo9Hs",
        "minutes": 10,
        "note": ""
      },
      {
        "id": "CH-09-r6",
        "kind": "course",
        "title": "LangSmith Essentials",
        "source": "LangChain Academy · free",
        "url": "https://academy.langchain.com/courses/quickstart-langsmith-essentials",
        "minutes": 0,
        "estimate": false,
        "note": "Tracing, datasets, experiments and online evaluation in the tool your stack already uses."
      },
      {
        "id": "CH-09-r7",
        "kind": "doc",
        "title": "Evaluation concepts",
        "source": "docs.langchain.com",
        "url": "https://docs.langchain.com/langsmith/evaluation-concepts",
        "minutes": 20,
        "estimate": true,
        "note": "Offline vs online evaluation, evaluator types, datasets and experiments."
      }
    ],
    "minutes": 88,
    "duration": "≈1h 28m",
    "questions": [
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
      "items": 8
    }
  },
  {
    "id": "CH-10",
    "section": "D",
    "sectionLabel": "Part 5 · System design",
    "priority": "P0",
    "title": "Chapter 10 — Designing LLM systems: from one assistant to forty franchises",
    "why": "The design round rewards a repeatable structure, the simplest architecture that works, and controls designed in from the start. Two complete worked designs, document Q&A for many tenants and an agent that changes data, cover most of what gets asked.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "run the seven-step framework with numbers, choose workflow vs agent with the controls every agent needs, and present both worked designs.",
      "tooDeep": "GPU capacity planning; vendor comparisons."
    },
    "know": [
      "1 · Clarify: users, task, quality bar, scale (QPS, corpus size), latency target, budget, and the cost of a wrong answer.",
      "2 · Success metrics and the baseline (today's human or process), offline and online.",
      "The ladder: one LLM call (with retrieval and tools) → a workflow (code decides the steps) → an agent (the model decides the steps). Climb only when the eval shows the lower rung failing.",
      "Workflow patterns: prompt chaining · routing · parallelisation · orchestrator-workers · evaluator-optimizer.",
      "Ingestion: connectors → parse → chunk → embed → index, with document id, version, tenant, ACL and timestamps as metadata.",
      "Freshness: change capture (webhooks, CDC, scheduled diffs); an update replaces all of a document's chunks; deletes and revocations propagate fast.",
      "Tools: typed and least-privilege; reads separate from writes; writes go through propose → approve → commit.",
      "Controls in code: per-user and per-tool permissions, caps on steps, tokens and spend, idempotency keys, approval tiers, timeouts."
    ],
    "resources": [
      {
        "id": "CH-10-r1",
        "kind": "doc",
        "title": "Building A Generative AI Platform",
        "source": "huyenchip.com",
        "url": "https://huyenchip.com/2024/07/25/genai-platform.html",
        "minutes": 40,
        "estimate": true,
        "note": "Builds the platform one component at a time — context, guardrails, router and gateway, caches, agents, observability. The diagram to have in your head."
      },
      {
        "id": "CH-10-r2",
        "kind": "video",
        "title": "AI System Design Tutorial",
        "source": "codebasics",
        "url": "https://www.youtube.com/watch?v=S6jy0T85DFs",
        "minutes": 43,
        "note": "05:58 gateway and auth, 10:53 guardrails, 13:59 semantic cache, 17:15 data freshness and CDC, 21:01 human in the loop, 23:15 model router, 30:03 fallback provider, 35:14 observability."
      },
      {
        "id": "CH-10-r3",
        "kind": "doc",
        "title": "Building effective agents",
        "source": "anthropic.com",
        "url": "https://www.anthropic.com/engineering/building-effective-agents",
        "minutes": 25,
        "estimate": true,
        "note": "The most-cited agent design reference. Know its five workflow patterns by name."
      },
      {
        "id": "CH-10-r4",
        "kind": "video",
        "title": "How We Build Effective Agents: Barry Zhang, Anthropic",
        "source": "AI Engineer",
        "url": "https://www.youtube.com/watch?v=D7_ipDqhtwk",
        "minutes": 15,
        "note": ""
      },
      {
        "id": "CH-10-r5",
        "kind": "video",
        "title": "12-Factor Agents: Patterns of reliable LLM applications — Dex Horthy, HumanLayer",
        "source": "AI Engineer",
        "url": "https://www.youtube.com/watch?v=8kMaTybvDUw",
        "minutes": 17,
        "note": "Twelve principles for agents that survive production — most of them are about owning control flow and context."
      },
      {
        "id": "CH-10-r6",
        "kind": "video",
        "title": "RAG at 10 Million Documents — System Design",
        "source": "Code with Lucian",
        "url": "https://www.youtube.com/watch?v=NQZqET-jjws",
        "minutes": 15,
        "note": ""
      },
      {
        "id": "CH-10-r7",
        "kind": "video",
        "title": "Access control for RAG and LLMs",
        "source": "Cerbos",
        "url": "https://www.youtube.com/watch?v=4VBHpziqw3o",
        "minutes": 7,
        "note": ""
      },
      {
        "id": "CH-10-r8",
        "kind": "video",
        "title": "20 Agentic AI System Design Interview Questions & Solutions",
        "source": "Keerti Purswani",
        "url": "https://www.youtube.com/watch?v=I4sGn8Z1vpI",
        "minutes": 30,
        "note": ""
      },
      {
        "id": "CH-10-r9",
        "kind": "doc",
        "title": "Patterns for Building LLM-based Systems & Products",
        "source": "eugeneyan.com",
        "url": "https://eugeneyan.com/writing/llm-patterns/",
        "minutes": 40,
        "estimate": true,
        "note": "Seven patterns: evals, RAG, fine-tuning, caching, guardrails, defensive UX and user feedback."
      }
    ],
    "minutes": 232,
    "duration": "≈3h 52m",
    "questions": [
      "How do you structure an LLM system design answer?",
      "Rough cost estimate: 1M queries a day, 3K input and 300 output tokens each.",
      "What are the components of a production LLM platform?",
      "Which failure modes would you design for in any LLM system?",
      "Workflow or agent — which is your default, and why?",
      "Name the workflow patterns and a use for each.",
      "What controls does every production agent need?",
      "What is the agent-computer interface, and why does it matter?",
      "Design document Q&A for 500 tenants and 10M documents. Walk me from ingestion to answer.",
      "An index per tenant, partitions, or a shared index with a filter — trade-offs?",
      "A document is deleted or a user loses access. How does the index stay correct, and how fast?",
      "Set a latency budget for the whole path.",
      "What's your fallback when the vector store or the model provider is down?",
      "Design an agent that lets planners query and change replenishment settings in plain English.",
      "A tool call times out and the agent retries. How do you stop a write applying twice?",
      "How do you verify the agent's claim that it succeeded?",
      "Which tools get which permissions, and where is that enforced?",
      "What do you trace so a bad run can be debugged after the fact?"
    ],
    "asked": {
      "posts": 0,
      "items": 18
    }
  },
  {
    "id": "CH-11",
    "section": "D",
    "sectionLabel": "Part 5 · System design",
    "priority": "P1",
    "title": "Chapter 11 — Keeping it safe, fast and affordable: security, cost and latency",
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
      "Prompt caching: the provider reuses an exact cached prefix — static content first; cached input is much cheaper and faster."
    ],
    "resources": [
      {
        "id": "CH-11-r1",
        "kind": "video",
        "title": "Prompt Injection, explained",
        "source": "Simon Willison",
        "url": "https://www.youtube.com/watch?v=FgxwCaL6UTA",
        "minutes": 12,
        "note": ""
      },
      {
        "id": "CH-11-r2",
        "kind": "video",
        "title": "LLM Chronicles #6.9: Design Patterns for Securing LLM Agents Against Prompt Injection (Paper Review)",
        "source": "Donato Capitella",
        "url": "https://www.youtube.com/watch?v=2Er7bmyhPfM",
        "minutes": 34,
        "note": "The six design patterns for agents that resist prompt injection, from the 2025 paper."
      },
      {
        "id": "CH-11-r3",
        "kind": "doc",
        "title": "The lethal trifecta for AI agents",
        "source": "simonwillison.net",
        "url": "https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/",
        "minutes": 10,
        "estimate": true,
        "note": "Private data, untrusted content and a way to communicate out: remove one of the three."
      },
      {
        "id": "CH-11-r4",
        "kind": "doc",
        "title": "OWASP Top 10 for LLM Applications",
        "source": "genai.owasp.org",
        "url": "https://genai.owasp.org/llm-top-10/",
        "minutes": 20,
        "estimate": true,
        "note": "Skim all ten; know prompt injection, improper output handling, excessive agency and unbounded consumption well."
      },
      {
        "id": "CH-11-r5",
        "kind": "video",
        "title": "Prompt Caching Explained: Stop Overpaying for AI Agents",
        "source": "Hugging Face",
        "url": "https://www.youtube.com/watch?v=SkM4k4SKvCM",
        "minutes": 17,
        "note": ""
      },
      {
        "id": "CH-11-r6",
        "kind": "doc",
        "title": "Prompt caching",
        "source": "platform.claude.com",
        "url": "https://platform.claude.com/docs/en/build-with-claude/prompt-caching",
        "minutes": 15,
        "estimate": true,
        "note": "How prefix caching works and what it costs; the same idea applies across providers."
      },
      {
        "id": "CH-11-r7",
        "kind": "video",
        "title": "Semantic Caching with Valkey and Redis: Reducing LLM Cost and Latency - Martin Visser",
        "source": "Percona",
        "url": "https://www.youtube.com/watch?v=7vdFUJgGOSs",
        "minutes": 26,
        "note": "Semantic caching in practice — thresholds, scoping and where it goes wrong."
      }
    ],
    "minutes": 134,
    "duration": "≈2h 14m",
    "questions": [
      "How do you stop a text-to-SQL agent from running DROP TABLE?",
      "What is indirect prompt injection, and how do you defend a RAG agent against it?",
      "Explain the lethal trifecta.",
      "A user may only see documents they're permitted to. Where is that enforced?",
      "Quality improved but p95 latency doubled and cost tripled. What do you do, in order?",
      "How would you add semantic caching, and what can go wrong?",
      "What drives time to first token, and what drives total latency?",
      "Define cost per resolved task, and say why it beats cost per request."
    ],
    "asked": {
      "posts": 0,
      "items": 8
    }
  },
  {
    "id": "CH-12",
    "section": "F",
    "sectionLabel": "Part 6 · Advanced",
    "priority": "P2",
    "title": "Chapter 12 — Going further: fine-tuning, running your own models, and MCP",
    "why": "Asked once the basics are solid: when fine-tuning beats prompting and RAG (and how LoRA, DPO and distillation work), what it takes to serve a model yourself (batching, KV cache, quantisation), and how MCP standardises tools.",
    "resumeLinked": false,
    "flag": "",
    "ceiling": {
      "enough": "say when to fine-tune and which method, explain continuous batching, PagedAttention and quantisation, and what MCP adds over function calling.",
      "tooDeep": "training loops, CUDA kernels, the MCP transport spec."
    },
    "know": [
      "Fine-tuning teaches behaviour (format, style, a narrow task) reliably and facts unreliably; facts stay in RAG.",
      "SFT trains on input-output pairs; quality beats quantity; always compare with the best prompt on the base model.",
      "Prefill processes the prompt (decides time to first token); decode generates token by token (limited by memory speed).",
      "Continuous batching adds and removes requests every step, keeping GPUs busy; bigger batches trade latency for throughput.",
      "MCP standardises how applications expose tools and data to models: servers offer tools (actions), resources (data to read) and prompts (templates); the host application's client connects and passes them to the model.",
      "Transports: stdio for local servers; Streamable HTTP for remote ones, with authorisation."
    ],
    "resources": [
      {
        "id": "CH-12-r1",
        "kind": "video",
        "title": "What is Low-Rank Adaptation (LoRA) | explained by the inventor",
        "source": "Edward Hu",
        "url": "https://www.youtube.com/watch?v=DhRoTONcyZE",
        "minutes": 7,
        "note": ""
      },
      {
        "id": "CH-12-r2",
        "kind": "video",
        "title": "LoRA & QLoRA Fine-tuning Explained In-Depth",
        "source": "Mark Hennings",
        "url": "https://www.youtube.com/watch?v=t1caDsMzWBk",
        "minutes": 15,
        "note": ""
      },
      {
        "id": "CH-12-r3",
        "kind": "video",
        "title": "Direct Preference Optimization (DPO) - How to fine-tune LLMs directly without reinforcement learning",
        "source": "Luis Serrano Academy",
        "url": "https://www.youtube.com/watch?v=k2pD3k1485A",
        "minutes": 21,
        "note": ""
      },
      {
        "id": "CH-12-r4",
        "kind": "video",
        "title": "PagedAttention: Behind vLLM's Insane Speed",
        "source": "Tales Of Tensors",
        "url": "https://www.youtube.com/watch?v=6uPnLkCiy5g",
        "minutes": 7,
        "note": ""
      },
      {
        "id": "CH-12-r5",
        "kind": "video",
        "title": "How LLMs survive in low precision | Quantization Fundamentals",
        "source": "Julia Turc",
        "url": "https://www.youtube.com/watch?v=qoQJq5UwV1c",
        "minutes": 21,
        "note": ""
      },
      {
        "id": "CH-12-r6",
        "kind": "doc",
        "title": "vLLM: Easy, Fast, and Cheap LLM Serving with PagedAttention",
        "source": "vllm.ai",
        "url": "https://vllm.ai/blog/2023-06-20-vllm",
        "minutes": 15,
        "estimate": true,
        "note": ""
      },
      {
        "id": "CH-12-r7",
        "kind": "video",
        "title": "The Model Context Protocol (MCP)",
        "source": "Anthropic",
        "url": "https://www.youtube.com/watch?v=CQywdSdi5iA",
        "minutes": 20,
        "note": ""
      },
      {
        "id": "CH-12-r8",
        "kind": "doc",
        "title": "What is the Model Context Protocol?",
        "source": "modelcontextprotocol.io",
        "url": "https://modelcontextprotocol.io/docs/getting-started/intro",
        "minutes": 15,
        "estimate": true,
        "note": ""
      }
    ],
    "minutes": 121,
    "duration": "≈2h 1m",
    "questions": [
      "When would you fine-tune instead of using RAG?",
      "What does LoRA change, and why is it cheaper?",
      "RLHF vs DPO?",
      "Your extraction prompt is 95% accurate on a large model but too slow and expensive. What do you do?",
      "Why is continuous batching faster than static batching?",
      "What problem does PagedAttention solve?",
      "Time to first token jumped from 400 ms to 4 seconds at peak. What do you check?",
      "What does quantisation trade off?",
      "What problem does MCP solve that plain function calling doesn't?",
      "Tools, resources and prompts in MCP — an example of each.",
      "How do you treat a third-party MCP server's tool descriptions?",
      "stdio or HTTP transport — when each?"
    ],
    "asked": {
      "posts": 0,
      "items": 12
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

export const AI_STACK_TOTAL = 13;

export const AI_STACK_PRIORITY_COUNTS = {"P0":9,"P1":3,"P2":1,"P3":0};

export const AI_STACK_SECTION_COUNTS = {"S":1,"B":1,"R":3,"A":3,"E":2,"D":2,"F":1};

export const AI_STACK_MINUTES = 2050;
