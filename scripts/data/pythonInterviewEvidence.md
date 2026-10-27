# Interview evidence: what 2024–26 interviews asked about Python and FastAPI

The ground under the "asked N×" badges on the Python and FastAPI question banks
(`src/Data/WebBasics/python.md`, `fastapi.md`). Same method as the Java and
Spring evidence (`interviewEvidence.md`).

## How it was collected (Oct 2026)

- **LeetCode Discuss**, through its public GraphQL search (the collector is
  `scripts/hld/collect.py` with Python search terms: python, python interview,
  python developer, python backend, fastapi, django, flask, pydantic, asyncio,
  GIL, python decorator, python generator), three sort orders each:
  **18,854 unique posts** downloaded in full.
- Kept only **candidate interview write-ups** from 16 Oct 2024 to 28 Oct 2026:
  titles that read like an experience (interview, round, onsite, offer, a
  company plus a level). Question banks, guides, roadmaps, hiring posts, mock
  interview requests and help requests were dropped, then only write-ups that
  mention Python, FastAPI, Django, Flask or Pydantic were kept: **456 write-ups**.
- Code blocks were stripped before matching, so a solution that merely uses a
  `Counter` or a `lambda` doesn't count as the interviewer asking about it.
- A question's count is the number of distinct write-ups whose text matches its
  pattern. Patterns for words that mean something else too ("mock", "SSE",
  memory management, singleton, multithreading) only count when Python is named
  nearby.

## Read the numbers as an ordering, not a percentage

- LeetCode Discuss leans to product companies and DSA rounds; most write-ups
  name Python only as the language they coded in, so concept questions are
  under-reported and every count is a lower bound.
- Questions written up only as summaries ("Python basics") match nothing.
- Unmatched does not mean unasked: questions without a badge come from the
  official docs (docs.python.org, fastapi.tiangolo.com, docs.pydantic.dev) as
  things an SDE2 should be able to explain.

## Most asked (write-ups)

| Question | Write-ups |
|---|---:|
| Decorators: what they are, how they work, write one | 17 |
| Generators and `yield` | 16 |
| Threading vs multiprocessing (and when to use which) | 13 |
| FastAPI (any question) | 12 |
| List comprehensions | 11 |
| Memory management and garbage collection in Python | 10 |
| LRU cache (coding) | 6 |
| Mutable vs immutable · list vs tuple · the GIL · async fetch with limits | 5 each |

Questions the docs-based draft lacked and that were added because write-ups
asked them: a logging/timing decorator on a recursive function (Nutanix MTS-2),
"predict the output" Python snippets (Celebal, data roles), and async
generators.
