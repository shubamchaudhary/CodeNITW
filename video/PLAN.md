# Lecture series: AI Stack, chapters 1–12

Each lecture stands alone, with its own general example (no running story), and is built to answer interview questions on its topic. The book chapters (`src/Data/aiStackDocs/CH-xx.md`) hold the full notes.

Every chapter follows the same shape:

1. **Hook**: a concrete failure or interview question.
2. **"By the end, you can answer"**: the questions the chapter prepares you for.
3. **Sections**: picture first, then the name (`term`); numbers where they help; wrong beliefs struck out (`trap`).
4. **"Say it in the interview"** (`sayit`): a model answer, line by line.
5. **Rapid fire** (`drill`): question, thinking pause, answer.
6. **Recap**, a **pause** on the next chapter's problem, and the next title.

| # | Lecture | Running example |
|---|---|---|
| 1 | How an LLM works | “The capital of France is”; river bank vs cash at the bank |
| 2 | RAG from scratch | an HR assistant over 3,000 internal documents |
| 3 | Search fast, search well | support search: 10M chunks, 500 customer workspaces |
| 4 | When retrieval still fails | a company knowledge assistant; vague questions, follow-ups, PDFs |
| 5 | From assistant to agent | an airline support agent (flight AB123 cancelled) |
| 6 | Agents that remember | an online store's refund agent: crashes, double refunds, memory |
| 7 | Ask before acting | a pricing agent whose changes need a manager's approval |
| 8 | Is it actually working? | a software company's support chatbot (60 days vs 30) |
| 9 | Testing agents, shipping safely | a refund agent that refunded the wrong order |
| 10 | Designing LLM systems | Q&A for 500 companies; an agent changing billing + CRM |
| 11 | Safe, fast, affordable | an email assistant with hidden instructions; the monthly bill |
| 12 | Going further | a ticket classifier, self-hosting, one CRM for three assistants |

Style rules:
- picture first, term second; plain words; one idea per beat; tone on what matters;
- generic scenes in `src/scenes/generic.tsx` and `generic2.tsx`, chapter visuals in `src/scenes/aiNN.tsx`;
- every text box sizes to its text (width, never a fixed height), the top-right corner stays free for the term card, and `qa/check.html?ch=chXX` must report no issues before a chapter is done.
