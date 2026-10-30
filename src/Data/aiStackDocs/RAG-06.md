Meera forwards a ticket: "Ask FreshCart said bakery items can be returned within 48 hours. The policy page clearly says 12." The right document exists. The answer is still wrong. Where did it break?

Guessing and tweaking the prompt is how teams lose weeks. Debugging RAG is a walk backwards through the pipeline, one stage at a time.

## 1. The trace: your debugging record

Every answer should leave a **trace**: a record of the full request. The question, the rewritten query if any, the chunk ids retrieved with their scores, the exact final prompt, the answer, and the time and tokens each step took. Without traces you are guessing. With them, every failure has a location.

## 2. Walking a wrong answer backwards

```mermaid
flowchart TB
    W["Wrong answer"] --> A{"Is the doc indexed,<br/>current version,<br/>visible to this user?"}
    A -->|"no"| A1["Ingestion bug:<br/>parser, stale index,<br/>access filter"]
    A -->|"yes"| B{"Was the right chunk<br/>in the top k?"}
    B -->|"no"| B1["Retrieval bug:<br/>chunk split, wording<br/>mismatch, k too small"]
    B -->|"yes"| C{"Did it reach the<br/>prompt, near<br/>the top?"}
    C -->|"no"| C1["Context bug:<br/>reranker or token<br/>budget dropped it"]
    C -->|"yes"| D["Generation bug:<br/>model ignored it, or<br/>chunks contradict"]
```

- **Ingestion**: is the bakery policy in the index at all, in its current version, and visible to this agent? A table parsed into garbage, an index that missed the last update, or a wrong access filter all fail here.
- **Retrieval**: search the index directly for the passage. If it is not in the top results, the answer may be split across two chunks, the agent's wording may not match the document's (add keyword search or a query rewrite), or too few results are fetched.
- **Context assembly**: the chunk was retrieved but dropped by the reranker, cut by the token limit, or buried in the middle of a long prompt.
- **Generation**: the chunk was right there in the prompt and the answer still contradicts it. Look for a second chunk that disagrees (often an outdated version) or weak grounding instructions.

FreshCart's bakery bug was the first box: the old 48-hour policy had never been deleted when the new one was published.

## 3. Separating the two halves at scale

One ticket can be traced by hand. A thousand need numbers. Two measurements split every failure into "search" or "answer" (the evals pages compute them in detail):

- **Context recall**: did the retrieved chunks contain the facts the answer needed?
- **Faithfulness**: are the claims in the answer supported by the retrieved chunks?

Low context recall means fix retrieval. High context recall with low faithfulness means the model strays from good evidence: fix generation. Both high and still wrong means the documents themselves are wrong or out of date.

## 4. Two traps in the prompt itself

**Lost in the middle.** Models use information at the start and end of a long prompt better than information in the middle (Liu and others, 2023). Chroma's "context rot" study found that answer quality drops as the input grows, even on simple tasks. So more chunks is not safer: send fewer, better chunks, most relevant first.

**Answering without evidence.** When the chunks do not contain the answer, the model still tends to produce one. Counter it in layers:

- An explicit instruction with an example: "If the documents do not answer the question, say you could not find it."
- Ask for a structured field `answerable: true/false` before the answer.
- If the best search score is weak, do not generate at all.
- Keep unanswerable questions in the test set and track how often the system correctly declines. Declining too often is also a failure.

Correction: fixing a RAG bug by editing the prompt until one failing example passes usually breaks other questions. Add the case to the test set and fix the category of failure.

Also asked: "The model answers confidently when the context lacks the answer. Fix it." The layered list above is the answer.
