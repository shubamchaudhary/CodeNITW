The Inventory Ops Agent as an interview story: what to say, in what order, for 25 minutes, plus the problem you faced, the team around you, and the follow-ups IOA-01 does not already cover. IOA-01 is the reference (the whole system, section by section). This page is the script.

**Your resume line:**

> LLM Inventory Operations Agent: built a LangGraph data-management agent letting planners read and update inventory parameters conversationally in minutes instead of multi-day ticket cycles; implemented hierarchy-aware PostgreSQL querying, Redis-staged writes with Base+Overlay persistence, and human-in-the-loop approval via LangGraph interrupts.

## 1. What we did, and how the system changed

| | Before | After |
|---|---|---|
| Reading a parameter | ask someone with DB access, or dig through screens one item-location at a time | "show me ordering cost for the Milk class in the West DCs" in the planning UI's chat |
| Changing one | raise a ticket; days | the agent proposes, the planner approves, the write lands in the planner's scenario; minutes |
| Safety | a human with SQL access | the LLM can only *propose*; the write is a code-level interrupt that waits for approval |
| Isolation | edits risked shared data | edits go to a per-(user, scenario) overlay; shared Base is never modified |
| Audit | ticket history | user, scenario, status and timestamp on every written row |

**What all we did (the four parts you own):**

1. **Hierarchy-aware reads**: one parameterised query joining the fact view to item and location dimensions, filtering at any level (class, region, DC), with per-instance level-to-column maps, identifier allow-listing and bound values. Results summarised to markdown for the model, raw rows cached in Redis.
2. **Redis-staged writes**: a proposal computed against the rows the planner saw, validated (canonical column, range, target rows) and stored under a namespaced key with a TTL. Nothing touches the database until approval.
3. **Human-in-the-loop approval**: the write tool registered as a LangGraph interrupt; the graph pauses, the UI shows an approval card, the next request resumes the graph with the decision.
4. **Base + Overlay commit**: one transaction that UPSERTs into the scenario's overlay table keyed by natural key + user + scenario, capped at 5,000 rows, with a whitelist of editable columns.

Everything around it (the supervisor and its four subagents, middleware, checkpointing, streaming) is the agent platform you built on. Say "I built the data layer; the team built the supervisor; here is how they connect."

## 2. Technology, and why that one

| Technology | Why this one | Why not the alternative |
|---|---|---|
| **LangGraph** | durable state, interrupts (pause for a human, resume later), checkpointing, streaming | plain function calling has the loop but no pause/resume across HTTP requests |
| **LangChain `create_agent` + middleware** | retries, limits, summarisation and HITL as reusable layers on the agent | hand-written graph code for every concern |
| **PostgreSQL (per planning instance)** | the planning parameters live there; views give Base, `_u` tables hold overlays | text-to-SQL against it was rejected (no control over what runs) |
| **psycopg** | direct SQL with bound parameters; per-instance connections with `search_path` set on connect | an ORM adds little for one query shape and many dynamic schemas |
| **Redis** | staging across HTTP requests: shared by workers, out of the LLM's context, self-cleaning with TTL | graph state (bloats every checkpoint) or a pending table (writes to production for proposals that may be rejected) |
| **Postgres checkpointer (cached in memory per turn)** | the paused graph must survive the end of the request and resume on any worker | in-memory only: lost on restart or another worker |
| **FastAPI + SSE** | one-directional token streaming per turn; proxy-friendly | WebSockets: bidirectional and stateful, not needed |
| **Azure OpenAI** | the enterprise's approved model endpoint, with a fallback model on 429s | |
| **Azure Key Vault** | per-instance DB passwords, cached briefly | static env vars cannot serve hundreds of instances |
| **OpenTelemetry -> Langfuse** | per-conversation traces: subagent, tools, arguments, interrupts, tokens, latency | logs alone cannot show an agent's decision path |

## 3. The story to tell

### The 30-second pitch

> Planners tune replenishment parameters for thousands of item-locations, and changing one meant a ticket and days of waiting. We built a LangGraph agent in the planning UI. I built its data layer: hierarchy-aware reads so a planner can ask about a whole class or region; writes staged in Redis rather than the database; approval as a LangGraph interrupt, so the model physically cannot write until a human says yes; and the commit as an UPSERT into a per-scenario overlay, so shared data is never modified. A ticket cycle became a chat turn.

### The 25-minute walkthrough

| Minutes | Cover | Draw |
|---|---|---|
| 0-3 | the problem: planners, parameters, tickets | |
| 3-6 | the platform: supervisor, four subagents, middleware, my layer | IOA-01 section 2 board |
| 6-10 | one request end to end: read -> stage -> approve -> commit | IOA-01 section 8 sequence |
| 10-13 | hierarchy-aware reads; injection safety; markdown for the model | the SQL shape |
| 13-16 | Redis staging: why not state, why not a table | two keys with TTL |
| 16-19 | the interrupt; the checkpointer; resume on the next request | turn 1 / turn 2 |
| 19-21 | Base + Overlay; idempotent UPSERT; one transaction | conflict key |
| 21-24 | the problem I faced (section 4) | retry wrapper around the dispatch |
| 24-25 | results, team, what I'd improve | |

Stop at 10 and 19 and ask which part they want deeper.

## 4. The problem I faced: the approval that never reached the planner

**Use this in every interview.** It shows you understand how interrupts actually work, not just the API.

**Situation.** The first end-to-end test of a write: "set ordering cost to 12 for Milk in the West". The read worked, the proposal worked. Then, instead of an approval card, the planner saw a generic error after about six seconds.

**Investigation.**

1. The trace showed `update_parameters` being called, the HITL middleware raising its interrupt, and then **the same call again, twice more**, before the turn ended in an error.
2. In LangGraph, an interrupt is implemented as an **exception** (`GraphInterrupt`) that unwinds to the graph runtime, which saves the state and stops.
3. The supervisor wraps tool calls in a **retry middleware** for transient failures (timeouts, rate limits). The subagent dispatch tool (`task`) was inside that wrapper. So the interrupt raised inside the subagent bubbled up through `task`, the retry layer saw "an exception", and **retried the dispatch**. Each retry re-ran the subagent, hit the interrupt again, and after the last retry the exception surfaced as a failure.
4. Net effect: the pause meant for a human was treated as an error and retried away.

**Fix.**

1. Excluded the dispatch tool from tool-level retry, so interrupts from subagents propagate untouched to the runtime. Retries for transient model errors stay at the model layer, where interrupts cannot occur.
2. Made the retry policy an **allowlist** of transient exceptions (timeouts, 429, 5xx) rather than "any exception", so control-flow exceptions can never be retried.
3. Made sure the checkpoint is flushed when a turn ends in an interrupt (our checkpointer batches writes per turn), so the paused state is durable before the response returns.
4. Tests: a write request must end with `interrupted = true` and exactly one pending action; resuming with "approve" writes once; resuming with "reject" writes nothing.

**Result.** Approval cards appeared reliably, each approval produced exactly one write, and the retry rule became a documented convention for anyone adding middleware: **retries are for failures, never for control flow.**

**The deeper point to say:** "Anything implemented as an exception for control flow, interrupts in LangGraph, `InterruptedException` in Java, cancellation in asyncio, must be excluded from generic catch-and-retry. Otherwise the retry layer silently changes the program's semantics."

### A backup problem if they ask for another: the proposal that expired at lunch

A planner prepared a change, went to lunch, came back and approved. The commit found no staged proposal (Redis TTL had expired) and the agent replied "Updated 0 rows", which looked like success. Fix: the commit treats a missing proposal as an explicit "this proposal expired, please re-read and re-prepare" message, never a zero-row success, and the TTL was set from how long approvals realistically take.

## 5. Team collaboration

| Who | What |
|---|---|
| **Agent platform team** (supervisor, middleware) | the retry exclusion and the "retries are for failures" convention; how my tools register with the subagent and the HITL middleware |
| **Planning UI team** | the SSE contract: `interrupted`, `pending_actions`, the approval card label from a description map, and the resume request |
| **Planning database owners** | overlay table shape (`_u` tables), the conflict key (natural key + user + scenario), which columns planners may edit |
| **Planners (users)** | how they actually name hierarchy levels and parameters ("order cost" vs the column name), which drove the fuzzy-name resolution and level maps |
| **Security review** | per-instance credentials from Key Vault, identity from the authenticated request (never from the model), the 5,000-row cap |

**How to say it:** "I sat with two planners for an afternoon before designing the read tool. They never ask about an item at a store; they ask about a class in a region. That one observation is why the reads are hierarchy-aware."

## 6. Follow-ups IOA-01 does not already answer

**Q. How do you know the agent proposed the right change?** The proposal is computed by code from the rows the planner saw, and shown as old -> new per row before approval; the model only chooses the parameter, the value and the scope. A wrong scope is visible in the card (row count, sample rows) and the planner rejects it.

**Q. What stops a planner from approving something huge by mistake?** The 5,000-row cap refuses it; the card shows the count; and every overlay row can be reverted because Base was never touched.

**Q. Latency per turn?** Dominated by model calls: the supervisor hop plus the subagent's tool loop. Skipping the supervisor's re-synthesis when one subagent ran saves a full model round trip. Have your own numbers ready (from the traces); if you don't know them, say how you would read them from Langfuse.

**Q. Cost control?** Hard limits (40 model calls, 8 dispatches per run), summarisation of long conversations, pruning large tool payloads from context, and markdown summaries instead of raw rows.

**Q. How would you add a new parameter type?** Add the view and overlay table names and the editable-column whitelist for that kind; the read, stage and commit code is generic over kind. Add tests for the identifier allow-list and the UPSERT builder.

**Q. Why not let the LLM write SQL?** Control. With a typed tool and a fixed query shape, the model decides *what* to ask; the code decides *how* it runs. Identifiers are allow-listed, values bound, rows capped.

**Q. How is this different from a chatbot over the database?** It writes, safely: staging, a code-level approval gate, scenario isolation and audit. Reading is the easy half.

**Q. What would you do differently?** Optimistic concurrency at commit (refuse if Base changed since the read), structured approve/reject/edit buttons instead of classifying free text, an async connection pool, and an offline eval set run in CI on every prompt change (IOA-01 section 15).

### Rapid fire

| Question | Answer |
|---|---|
| Four steps of a write? | read, stage, approve, commit |
| Where is the proposal before approval? | Redis, with a TTL |
| What makes approval a guarantee? | an interrupt in middleware, not a prompt |
| Why a checkpointer? | the pause outlives the HTTP request |
| Where does the write go? | the scenario's overlay table, never Base |
| Approving twice? | UPSERT: same row, idempotent |
| Retry rule you added? | never retry control-flow exceptions; exclude the dispatch tool |
