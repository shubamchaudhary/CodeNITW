# LangChain and LangGraph in 40 minutes

Two parts, about 20 minutes each. Read the bold lines and the "Say it" lines twice; those are what you say out loud.

---

# Part 1: LangChain (20 min)

## 1. What it is, in one breath

LangChain is a Python/JS library for building LLM apps. **Since version 1 (Oct 2025) its center is `create_agent` + middleware, running on LangGraph underneath.** The old "chains" (`LLMChain`, `RetrievalQA`, `AgentExecutor`) moved to `langchain-classic`.

The package family (interviewers check you know this):

```
langchain-core     messages, Runnables, tool + retriever base classes
langchain-openai,  one integration package per provider
langchain-anthropic ...
langchain          create_agent, middleware, structured output
langgraph          the runtime underneath (state, checkpoints, interrupts, streaming)
LangSmith          hosted tracing + evals (a service, optional)
```

**Say it:** "LangChain is now mainly an agent framework: one model interface across providers, tools, structured output, and `create_agent` with middleware, which compiles to a LangGraph graph."

## 2. Models and messages

One interface for every provider:

```python
from langchain.chat_models import init_chat_model
model = init_chat_model("anthropic:claude-sonnet-4-5", temperature=0, max_retries=3)

model.invoke("What is RAG?")        # one answer (AIMessage)
model.stream("...")                 # tokens as they arrive
model.batch(["q1", "q2"])           # many inputs concurrently
await model.ainvoke("...")          # async versions exist for all
```

Switching provider = changing the string (`"openai:gpt-5"`).

A conversation is a list of messages:

```
SystemMessage  your instructions
HumanMessage   the user's question
AIMessage      the model's reply: text and/or tool_calls, plus token usage
ToolMessage    your tool's result, linked by tool_call_id
```

**Q: How do you switch providers or survive an outage?** Model as config via `init_chat_model`, no provider-specific prompt tricks, run the eval set on both before switching, and `with_fallbacks` (or `ModelFallbackMiddleware` in an agent) for outages.

## 3. Runnables and LCEL

Everything runnable (model, prompt, retriever, parser, agent) is a **Runnable** with `invoke / stream / batch` (+ async). The `|` pipe chains them. That syntax is **LCEL**.

```python
prompt = ChatPromptTemplate.from_messages([
    ("system", "Answer in at most two sentences."),
    ("human", "{question}"),
])
chain = prompt | model | StrOutputParser()
chain.invoke({"question": "What is an embedding?"})
```

You get streaming, batching, async and tracing for free across the whole chain.

**Say it:** "LCEL is great for short fixed pipelines like prompt, model, parser. Anything with loops, branches or state, I write in LangGraph instead."

## 4. Structured output

Get a typed object, not text:

```python
class Ticket(BaseModel):
    category: Literal["billing", "bug", "how-to"]
    urgency: int = Field(ge=1, le=5)
    summary: str

ticket = model.with_structured_output(Ticket).invoke("I was charged twice!")
```

In an agent: `create_agent(model, tools, response_format=Ticket)` and read `result["structured_response"]`. LangChain uses the provider's native structured output when available (`ProviderStrategy`), otherwise forces it through a tool call (`ToolStrategy`).

**Q: The model returns invalid JSON sometimes?** Validate with Pydantic at the boundary, use native structured output where possible, feed the validation error back for a bounded number of retries, and log the failure rate.

## 5. Tools

A tool is a function the model may ask you to run:

```python
@tool
def search_orders(customer_email: str, status: Literal["open", "shipped", "any"] = "any") -> list[dict]:
    """Find a customer's orders, newest first. Use before answering any order question."""
    return db.find_orders(customer_email, status)
```

LangChain turns the name, the **docstring** and the type hints into a JSON schema. That schema is all the model sees, so **the docstring is a prompt.**

Things the model must not choose (the current user, a DB handle) come through `ToolRuntime`, injected at call time and hidden from the schema:

```python
@tool
def my_orders(runtime: ToolRuntime[UserContext]) -> list[dict]:
    """List the current user's open orders."""
    return db.find_orders(runtime.context.user_id, "open")   # model can't pick another user
```

**Good tools:** few, one clear job each, ids and enums as arguments (not free text), small results, errors returned as text the model can act on, permission checks in code (never trusted to the model).

## 6. RAG pieces

```
loader -> text splitter (chunks + overlap) -> embeddings -> vector store -> retriever
```

```python
chunks = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100).split_documents(docs)
store = PGVector.from_documents(chunks, OpenAIEmbeddings(), connection=DB_URL)
retriever = store.as_retriever(search_type="mmr", search_kwargs={"k": 5})
```

Two ways to use it:
- **Two-step chain:** always retrieve, then answer. Predictable, one model call. Default for document Q&A.
- **Agentic RAG:** retriever as a tool; the agent decides when and how often to search. Better for mixed questions, costs more calls.

## 7. create_agent: the loop

```python
agent = create_agent(
    model="anthropic:claude-sonnet-4-5",
    tools=[search_orders, my_orders, refund_order],
    system_prompt="You are a support agent. Never promise refunds over $100.",
    checkpointer=PostgresSaver(...),   # memory per thread
    middleware=[...],
)
agent.invoke({"messages": [("user", "Where is my order?")]},
             {"configurable": {"thread_id": "conv-42"}})
```

What it builds (as a LangGraph graph):

```
model -> asks for tools? -> yes: run tools, add ToolMessages, back to model
                         -> no:  done
```

It replaced `create_react_agent` and `AgentExecutor`. Because it's a graph, it gets LangGraph's checkpoints, streaming and interrupts for free.

## 8. Middleware (the version 1 headline)

Hooks around the loop, so you add production controls without rewriting it:

- `before_agent`, `before_model`, `after_model`, `after_agent`: run at a point, can update state.
- `wrap_model_call`, `wrap_tool_call`: surround the call: retry, switch model, skip, fall back.

Order for `[m1, m2, m3]`: before hooks m1 -> m3, wrap hooks nest with m1 outermost, after hooks m3 -> m1. Same as web middleware.

Built-ins worth naming: **Summarization** (shrink old messages near the context limit), **HumanInTheLoop** (pause before chosen tools), **PII** (mask personal data), **ModelCallLimit / ToolCallLimit** (stop runaway loops), **ModelFallback / ModelRetry** (outages).

```python
@wrap_model_call
def cheap_first(request, handler):
    if len(request.messages) < 4:
        return handler(request.override(model=small_model))   # easy turn: cheaper model
    return handler(request)
```

**Say it:** "Middleware is where production concerns live: summarization for long threads, approvals before risky tools, call limits, PII masking, fallbacks, without touching the agent loop."

## 9. Memory, streaming, tracing

- **Short-term memory** = the conversation in the agent's state, saved by the **checkpointer** per `thread_id`. Same thread id = it remembers. `InMemorySaver` in dev, `PostgresSaver` in prod. Trim or summarize long threads.
- **Long-term memory** = a **store** across conversations, namespaced like `("users", user_id)`, used by tools via `runtime.store`.
- **Streaming** modes: `"messages"` (tokens, for the typing effect), `"updates"` (each step: "looking up your order"), `"values"` (full state), `"custom"` (progress a tool sends). Over HTTP, forward as Server-Sent Events.
- **LangSmith**: set `LANGSMITH_TRACING=true` and every run is a trace: each prompt, reply, tool call, tokens, cost, latency. Plus datasets and evals to compare a prompt or model change before release.

## 10. Should you use it? (they love this question)

**For:** one interface across providers, tools/structured output/middleware already solved, LangGraph persistence underneath, tracing.
**Against:** layers to debug through, abstractions that can hide the exact prompt, a history of breaking changes (calmer since v1).

**Say it:** "I use `create_agent` with middleware for a standard tool-calling agent, LangGraph directly when I need custom control flow, and the raw SDK for a single model call. In every case I pin versions, keep prompts and business logic in my own code, and trace everything."

## LangChain quick-fire

- **Chain vs agent?** A chain's steps are fixed by you; an agent's model decides which tools to call and when to stop.
- **What does `bind_tools` / the tool schema do?** Sends the tools' JSON schemas to the model so it can return `tool_calls`; your code runs them.
- **How does the model "call" a tool?** It doesn't. It returns a tool call with JSON arguments; your code runs it and sends back a `ToolMessage`.
- **Stop an agent looping forever?** `ModelCallLimitMiddleware` / `ToolCallLimitMiddleware`, plus a recursion limit.
- **Long conversations blow the context?** Trim, or `SummarizationMiddleware`.

---

# Part 2: LangGraph (20 min)

## 1. Why it exists

In an agent loop, the model decides every step. It can skip the policy check, call tools in the wrong order, or loop forever. Real systems need **some steps fixed by you**: classify first, check permissions before a refund, ask a human before sending money, run three searches in parallel then merge.

**LangGraph is a low-level runtime where you write the workflow as a graph: nodes are steps, edges say what runs next, and a typed shared state carries everything.** On top it gives you what long-running AI work needs: state saved after every step, pause for a human, streaming, and replay.

```
create_agent: the model decides the steps, a few lines, standard tool agents
LangGraph:    you decide the steps (the model can still decide at chosen points)
```

They're not rivals: `create_agent` compiles to a LangGraph graph, and an agent can be one node in a bigger graph.

**Say it:** "LangGraph is for when the control flow must be mine: fixed order, branches, parallel work, approvals, multiple agents, with durable state."

## 2. State and reducers (the most asked part)

```python
class State(TypedDict):
    messages: Annotated[list, add_messages]      # append (or replace by id)
    sources: Annotated[list[str], operator.add]  # concatenate
    ticket: dict                                 # no reducer: overwrite
    tries: int
```

A node never edits state. It **returns a partial update** (only the keys it changed), and LangGraph merges it using each key's **reducer**:
- no reducer: **replace**
- `operator.add`: **concatenate** lists
- `add_messages`: **append**, or replace a message with the same id

**Q: Two parallel nodes both write `sources`. What happens?** With `operator.add`, both lists are kept. With no reducer, LangGraph can't pick a winner and raises `InvalidUpdateError`. Fix: add a reducer or give each node its own key.

Keep state small: ids and facts, not whole documents, because it's saved at every step.

## 3. Nodes and edges

```python
g = StateGraph(State)
g.add_node("classify", classify)
g.add_node("refunds", refunds)
g.add_node("answer", answer)
g.add_edge(START, "classify")
g.add_conditional_edges("classify", route, ["refunds", "answer"])
g.add_edge("refunds", END)
g.add_edge("answer", END)
app = g.compile()
```

```
START -> classify -> billing?  -> refunds -> END
                  -> otherwise -> answer  -> END
```

- **Node** = function `state -> partial update`.
- **Normal edge** = always go there. **Conditional edge** = a router function reads state, returns the next node's name.
- **`Command`**: a node can update state and choose the next node in one move: `return Command(update={"ticket": t}, goto="refunds")`. Good for handoffs.
- `compile()` validates the graph and gives you `invoke / stream / batch`.

## 4. How it runs: super-steps

LangGraph runs in rounds (from Google's Pregel model):

1. All nodes scheduled for this round run, **in parallel**.
2. They all see the state as it was at the start of the round.
3. At the end, updates merge through the reducers, and a **checkpoint** is saved.
4. Edges pick the next round's nodes. Nothing scheduled = done.

So **fan-out** = one node with edges to several (they run together), and **fan-in** = several edges into one node (it runs once, after all finish).

Loops need a brake: set `recursion_limit` in the config (raises `GraphRecursionError`), and better, a `tries` counter in state so the graph ends gracefully with a fallback answer.

**Dynamic fan-out with `Send`** (map-reduce) when the count is only known at run time:

```python
def fan_out(state):
    return [Send("summarise", {"doc": d}) for d in state["docs"]]   # one copy per doc, in parallel
g.add_conditional_edges("search", fan_out, ["summarise"])
g.add_edge("summarise", "combine")   # combine waits for all
```

Each copy appends to a key with `operator.add`, so results add up instead of overwriting. Cap the fan-out for rate limits and cost.

## 5. Checkpoints and threads (the superpower)

```python
app = g.compile(checkpointer=PostgresSaver.from_conn_string(DB_URL))
config = {"configurable": {"thread_id": "conv-42"}}
app.invoke({"messages": [("user", "Refund order 48213")]}, config)
app.invoke({"messages": [("user", "And the second item?")]}, config)   # continues the thread
```

- A **checkpoint** = a snapshot of state + what runs next, saved after every super-step.
- A **thread** (`thread_id`) = one conversation/ticket/job. Same id, same memory.
- `InMemorySaver` (dev), `SqliteSaver`, `PostgresSaver` (prod).
- **Time travel:** `get_state_history` lists checkpoints; replay from an old one, or `update_state` to fix a value and continue (a fork). Great for debugging a bad run.

**Say it:** "Checkpoints are what give you memory, human-in-the-loop, and resume after a crash, all from the same mechanism."

## 6. Human-in-the-loop: interrupt and resume

```python
def approve_refund(state):
    decision = interrupt({"order": state["ticket"]["order_id"], "amount": state["ticket"]["amount"]})
    if decision["approved"]:
        return {"messages": [("ai", "Refund approved.")]}
    return Command(goto="explain_denial")

out = app.invoke(inputs, config)                      # pauses; out["__interrupt__"] has the payload
app.invoke(Command(resume={"approved": True}), config)  # hours later, same thread
```

`interrupt()` pauses, saves, and hands the payload to your app. `Command(resume=...)` continues the same thread.

**The trap interviewers check: on resume, the node re-runs from its first line**, and `interrupt()` now returns the resume value. So anything before the `interrupt()` runs twice. Put side effects (charging, emailing) **after** the interrupt or in a separate node, and make them idempotent. A checkpointer is required.

## 7. Failures and retries

- **Retry policy per node:** `add_node("call_api", call_api, retry_policy=RetryPolicy(max_attempts=3))` for transient errors.
- **Resume after a crash:** `app.invoke(None, config)` continues from the last checkpoint; nodes that already finished in that round aren't redone.
- **Danger:** a node that crashed after charging a card charges again when it re-runs. Make it idempotent (an idempotency key) or wrap it in `@task`, whose result is saved and reused.

## 8. Memory and streaming

- **Short-term:** the thread's state, via the checkpointer. Trim or summarize old messages.
- **Long-term:** a **Store** (`compile(store=...)`), namespaced like `("users", user_id)`, with `put / get / search`, reached via `runtime.store`.
- **Per-run settings** that aren't state (user id, model choice) go in a **context schema**, read as `runtime.context`.
- **Streaming modes:** `values` (full state each step), `updates` (each node's change), `messages` (LLM tokens from any node), `custom` (your progress events), `debug`. `subgraphs=True` includes events from inside subgraphs.

## 9. Subgraphs and multi-agent

A compiled graph can be a node in another graph (shared keys: add it directly; different schemas: call it inside a node and translate).

- **Supervisor:** one coordinator routes to specialist agents and collects results. Easier to control and debug.
- **Handoffs / swarm:** agents pass control directly with `Command(goto="writer", graph=Command.PARENT)`. Fewer hops, harder to reason about.

**Say it:** "I split into multiple agents only when parts need different tools or instructions, or can run in parallel. Otherwise one agent with good tools is cheaper and easier to evaluate."

**Functional API:** the same features (checkpoints, interrupts, streaming) as plain Python, with `@entrypoint` and `@task`, for mostly linear workflows.

## 10. Production

- **Compile once** at startup; the graph is stateless, state lives in the checkpointer.
- **One thread per conversation/job**; the thread id comes from your system, so users only reach their own threads.
- **Postgres** checkpointer + store, so any instance can continue any thread after a restart.
- Serve with your own FastAPI + SSE, or LangGraph's Agent Server (task queues, background runs, cron, and **double-texting** handling: a new message while a run is still going can be rejected, queued, or interrupt it).
- **Caps everywhere:** loop counter, recursion limit, token/cost budgets, tool timeouts.
- Trace in LangSmith or OpenTelemetry; evaluate whole trajectories, not just final answers.

## LangGraph quick-fire

- **Why not just a while loop in Python?** You'd rebuild state saving, resume after a crash, pause-for-human, streaming of every step, and parallel branches with safe merging. LangGraph gives you all of it.
- **What's a reducer?** The rule for merging a node's update into a state key: replace, append, or `add_messages`.
- **What's a super-step?** One round where all scheduled nodes run in parallel, then updates merge and a checkpoint is saved.
- **How does a conversation remember?** Checkpointer + the same `thread_id`.
- **What happens on resume after `interrupt`?** The node runs again from the top; `interrupt` returns the resume value.
- **Send vs a normal edge?** `Send` creates a variable number of parallel tasks at run time, each with its own input (map-reduce).
- **`Command`?** Update state and choose the next node in one return value.

---

# If they ask "where have you used it?"

DeepLogLens uses LangGraph in two places:
- **Root cause:** a pipeline groups related findings into incidents and ranks likely causes, and a judge checks each story against the evidence it cites.
- **Q&A:** a decision graph reads the chat so far from Redis, resolves follow-up questions, and picks a route: hybrid search, the log profile, or general knowledge.

**Say it:** "I used LangGraph where I wanted the steps to be mine: a fixed root-cause pipeline with a judge step, and a routing graph for chat that picks hybrid search, the log profile, or general knowledge, with history from Redis."

## The 30-second answer: "LangChain vs LangGraph?"

"LangChain gives me the building blocks: one model interface across providers, tools, structured output, and `create_agent` with middleware for a standard tool-calling agent. LangGraph is the runtime underneath. I use it directly when I need to own the control flow: typed state with reducers, branches and parallel fan-out, checkpoints per thread for memory and crash recovery, and interrupts for human approval. Rule of thumb: raw SDK for one call, `create_agent` for a standard agent, LangGraph for custom workflows."
