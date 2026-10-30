At a quarterly review, three ideas come up that would each change Ask FreshCart's design. "The new models read a million tokens, so let's skip search and give them everything." "Leadership wants to ask questions across all 10,000 complaints at once." "Agents keep asking for counts and totals." Each is a classic interview follow-up.

## 1. Long context: is RAG dead?

A model that reads a million tokens could, in principle, take FreshCart's entire policy library in every prompt. It still is not a replacement for retrieval:

- **Cost and time**: every question pays for every input token, and the wait for the first word grows with prompt length. Search sends a few thousand tokens instead of hundreds of thousands.
- **Quality**: answers get worse as the input grows (the "lost in the middle" and "context rot" findings from the debugging page). A focused prompt is usually more accurate.
- **Access control and freshness**: search filters each chunk by who may see it and reflects today's documents. A prompt stuffed with everything does neither.
- **Citations** come naturally from retrieval.

Long context is the right tool for a small, fixed corpus (paste it in, use prompt caching to make repeats cheap), for whole-document tasks such as summarising one contract, and as a generous window after retrieval.

## 2. GraphRAG: questions no single chunk can answer

Two kinds of question defeat chunk search:

- **Multi-hop**: "which suppliers of our largest franchise had food-safety incidents?" The answer needs following links: franchise to suppliers to incidents.
- **Whole-corpus**: "what are the main complaint themes across 10,000 tickets?" No single chunk holds the answer.

**GraphRAG** (an approach from Microsoft) uses a model to extract entities (franchises, suppliers, products) and the relationships between them into a **knowledge graph**: nodes for things, edges for how they relate. It then groups the graph into communities of closely connected nodes and writes a summary of each. Multi-hop questions walk the graph; whole-corpus questions combine the community summaries.

```mermaid
flowchart LR
    T["10,000 tickets"] --> X["Model extracts<br/>entities and<br/>relations"]
    X --> G[("Graph:<br/>franchise, supplier,<br/>product, incident")]
    G --> CM["Group into<br/>communities,<br/>summarise each"]
    CM --> GL["Whole-corpus<br/>question: combine<br/>summaries"]
    G --> LO["Multi-hop question:<br/>walk the edges"]
```

The price: indexing makes many model calls per chunk, so it is slow and expensive; updating the graph incrementally is hard; and extraction mistakes become wrong edges. Use it when these question types matter and you can measure the gain; otherwise hybrid search is cheaper.

## 3. Counts and totals belong in SQL

"How many orders were delivered late in Kothrud last week?" Search returns some late-delivery documents; it cannot count every order. That is a database query. Give the assistant a tool that runs safe, read-only SQL (the security page covers the guard rails) or a typed function such as `count_late_deliveries(area, week)`, and keep RAG for the "why" questions that follow, such as "what were the common causes?".
