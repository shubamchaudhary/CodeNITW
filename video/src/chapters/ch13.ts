import type { Chapter, Scene } from "../lib/types.ts";
import { makeCheck } from "./checks.ts";
import { B, custom, q, sec } from "./lc/h.ts";

// Chapter 13 of the AI Stack: LangChain in depth, topic by topic (the order of
// src/Data/aiStackDocs/CH-13.md): what it is, models, Runnables, structured
// output, tools, RAG pieces, create_agent, middleware, memory, streaming,
// tracing, and when to use it.
const check = makeCheck();

const scenes: Scene[] = [
  {
    kind: "title",
    eyebrow: "AI Stack · Chapter 13",
    title: "LangChain in depth",
    subtitle: "models, Runnables, tools, agents and middleware, topic by topic",
    beats: B("Chapter thirteen. LangChain, in depth. Chapter five used LangChain as one tool among many. This time we take the library itself apart, one topic at a time, in the order you meet it in a project, and in an interview."),
  },
  {
    kind: "bullets",
    title: "How this chapter goes",
    firstItemStep: 1,
    items: [
      { icon: "🧠", text: "Each topic starts with the idea, as a picture", sub: "then the code that matches it" },
      { icon: "❓", text: "Then the questions interviewers ask about it", sub: "with an answer you can say out loud" },
      { icon: "✋", text: "A check every few topics", sub: "answer before I do" },
    ],
    beats: B(
      "Twelve topics. Each one goes the same way.",
      "The idea first, as a picture, and then the code that matches it.",
      "Then the questions interviewers actually ask about that topic, with answers you can say.",
      { say: "And every few topics, a check. When the timer ring appears, answer out loud before I do.", tone: "key" },
    ),
  },

  // ---------------------------------------------------------------- 1
  sec("1", "What LangChain is today", "Topic one. What LangChain is today. Since version one, released in October twenty twenty five, it's a family of packages, and knowing which does what is the first thing interviewers check."),
  {
    kind: "flow",
    title: "The LangChain family, from bottom to top",
    cols: 2,
    rows: 3,
    nodeW: 700,
    nodeH: 120,
    nodes: [
      { id: "core", label: "langchain-core\nmessages, Runnables, tool base classes", c: 1, r: 2, tone: "cyan" },
      { id: "int", label: "integrations\nlangchain-openai, langchain-anthropic, …", c: 0, r: 2 },
      { id: "lg", label: "langgraph\nthe runtime: state, checkpoints, interrupts", c: 1, r: 1, tone: "purple" },
      { id: "lc", label: "langchain\ncreate_agent, middleware, structured output", c: 0, r: 1, tone: "amber" },
      { id: "ls", label: "LangSmith (a service)\ntracing, evals, deployment", c: 1, r: 0, tone: "green" },
      { id: "da", label: "Deep Agents\nplanning, files, subagents", c: 0, r: 0 },
    ],
    edges: [
      { from: "int", to: "core" },
      { from: "lc", to: "core" },
      { from: "lc", to: "lg" },
      { from: "da", to: "lc" },
    ],
    show: [["core"], ["int"], ["lc", "lg"], ["da", "ls"]],
    beats: B(
      "At the bottom, langchain core: the shared building blocks. Message types, the Runnable interface, and base classes for tools and retrievers.",
      "Next to it, one integration package per provider: langchain openai, langchain anthropic, langchain postgres and so on, each versioned on its own, so a provider's change doesn't wait for a LangChain release.",
      "Then langchain itself, which since version one is about agents: create agent, middleware, structured output. And it's built on langgraph, the lower-level runtime, which is chapter fourteen.",
      { say: "On top, Deep Agents, an opinionated harness with planning and subagents. And beside everything, LangSmith, a hosted service for traces, evaluations and deployment. The old chains, like LLM chain, retrieval QA and agent executor, moved into a separate package, langchain classic.", tone: "key" },
    ),
  },
  q("What is LangChain today, and what changed in version 1?", "the packages, the new centre, and what moved out", "What is LangChain today, and what changed in version one?", "Name the layers, say that version one centred it on agents, and say what moved out. Interviewers use this to check you're current."),
  {
    kind: "trap",
    myth: "LangChain is a library of chains: LLMChain, RetrievalQA, AgentExecutor.",
    truth: "That's 2023. Version 1 is create_agent, middleware and structured output, on LangGraph.",
    why: "The old chains live in langchain-classic. Using them in an answer signals you haven't used it recently.",
    beats: B(
      "The trap answer: LangChain is a library of chains. LLM chain, retrieval QA, agent executor.",
      "That describes twenty twenty three. Version one is create agent, middleware, and structured output, running on LangGraph.",
      { say: "The old chains now live in langchain classic. If your answer starts with them, the interviewer hears: hasn't touched it lately.", tone: "key" },
    ),
  },

  // ---------------------------------------------------------------- 2
  sec("2", "Models and messages", "Topic two. Models and messages: one interface for every provider."),
  {
    kind: "code",
    title: "One interface, any provider",
    lang: "python",
    code: `from langchain.chat_models import init_chat_model

model = init_chat_model("anthropic:claude-sonnet-4-5",
                        temperature=0, max_retries=3, timeout=30)

model.invoke("What is a vector database?")      # one AIMessage
for chunk in model.stream("Explain RAG"):       # tokens as they arrive
    print(chunk.text, end="")
model.batch(["q1", "q2", "q3"])                 # many, concurrently
await model.ainvoke("...")                      # async: ainvoke, astream, abatch`,
    highlight: [[1, 4], [6, 8], [9, 10]],
    beats: B(
      "Init chat model takes a provider and a model name in one string, plus the settings every serious call needs: temperature, retries, and a timeout. Switching to OpenAI is a string change, as long as the integration package is installed.",
      "Every model has the same three ways to run. Invoke, for one answer. Stream, for tokens as they're generated.",
      { say: "And batch, for many inputs run concurrently. Each has an async twin: ainvoke, astream, abatch. Learn these once, and they work on every model, and, as we'll see, on every Runnable.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "A conversation is a list of messages",
    cols: [
      { title: "SystemMessage", tone: "purple", items: ["From you", "Instructions, rules, persona"] },
      { title: "HumanMessage", tone: "blue", items: ["From the user", "Text, images, files"] },
      { title: "AIMessage", tone: "green", items: ["From the model", "Text and/or tool_calls", "usage_metadata: tokens"] },
      { title: "ToolMessage", tone: "amber", items: ["From your code", "A tool's result", "Linked by tool_call_id"] },
    ],
    footer: "content_blocks: the same reply shape whatever provider wrote it",
    beats: B(
      "A conversation is a list of messages, each with a role. System messages carry your instructions.",
      "Human messages carry the user's input: text, images or files.",
      "AI messages are the model's replies. They hold text, or tool calls, or both, plus usage metadata, which is where token counts come from.",
      "And tool messages carry a tool's result back, linked to the call by its tool call id.",
      { say: "Messages also expose standard content blocks: text, reasoning, images and tool calls in one provider-independent shape, so the code that reads a reply doesn't care which provider wrote it.", tone: "key" },
    ),
  },
  q("How would you switch from OpenAI to Anthropic, or survive one being down?", "configuration, portable prompts, evals, and fallbacks", "How would you switch from OpenAI to Anthropic, or survive when one of them is down?", "Four parts. The model is configuration, the prompts are portable, you measure before switching, and you fall back automatically. With init chat model, the model is a string from settings. Keep prompts free of provider-specific tricks. Run your eval set on both before switching. And for outages, with fallbacks on a model, or model fallback middleware in an agent."),

  // ---------------------------------------------------------------- 3
  sec("3", "Prompts and the Runnable interface", "Topic three. Prompts, and the Runnable interface, also known as LCEL."),
  custom(
    "pypipe",
    {
      title: "prompt | model | parser: a Runnable pipeline",
      stages: [
        { name: "dict of inputs", icon: "🧾", sub: "{language, question}" },
        { name: "Prompt template", icon: "📝", sub: "fills the slots" },
        { name: "Chat model", icon: "🤖", sub: "returns an AIMessage" },
        { name: "Output parser", icon: "🔤", sub: "returns a string" },
      ],
      steps: [
        { at: 0, text: "Everything you can run in LangChain is a Runnable: models, prompts, retrievers, parsers, whole agents. Each has invoke, stream, batch and async versions." },
        { at: 1, text: "ChatPromptTemplate turns the input dict into messages: a system message in the right language, the user's question." },
        { at: 2, text: "The | operator pipes each Runnable's output into the next. The model turns messages into an AIMessage." },
        { at: 3, text: "StrOutputParser pulls out the text. chain.invoke, chain.stream and chain.batch now work on the whole pipeline." },
        { at: [0, 1, 2, 3], text: "Good for short, fixed pipelines. Loops, branches or state across steps: write a LangGraph graph instead." },
      ],
    },
    B(
      "Here's the idea. Everything you can run in LangChain is a Runnable: a model, a prompt template, a retriever, a parser, even a whole agent. And every Runnable has the same methods: invoke, stream, batch, and their async versions.",
      "A chat prompt template turns a dict of inputs into messages: a system message saying answer in this language, and the user's question.",
      "The pipe operator connects Runnables, so the output of one becomes the input of the next. The model turns the messages into an AI message.",
      "And an output parser pulls out the text. The pipe syntax is called LCEL, the LangChain Expression Language. And here's the payoff: the whole chain now streams, batches, runs async, and shows up in traces, for free.",
      { say: "Is LCEL still worth using? For short, fixed pipelines, yes. Prompt, model, parser. A two-step RAG chain. For anything with loops, branches, or state across steps, a LangGraph graph is far easier to read and debug.", tone: "key" },
    ),
  ),
  {
    kind: "code",
    title: "The Runnable helpers you'll meet",
    lang: "python",
    code: `from langchain_core.runnables import RunnableParallel, RunnablePassthrough, RunnableLambda

rag = (
    RunnableParallel(context=retriever | format_docs,     # two branches,
                     question=RunnablePassthrough())      # same input
    | prompt | model | StrOutputParser()
)

clean = RunnableLambda(lambda s: s.strip())               # any function
safe = (prompt | model).with_retry(stop_after_attempt=3)  # retries
robust = model.with_fallbacks([backup_model])             # outages`,
    highlight: [[3, 7], [9, 9], [10, 11]],
    beats: B(
      "Three helpers come up often. Runnable parallel runs several branches on the same input and returns a dict. Here, one branch retrieves documents and formats them as context, and runnable passthrough passes the question through untouched. That's a two-step RAG chain in four lines.",
      "Runnable lambda wraps any plain function as a Runnable, so it can sit in a pipeline.",
      { say: "And every Runnable has with retry and with fallbacks: retries for transient errors, and a backup model for outages.", tone: "key" },
    ),
  },
  check({
    topic: "LangChain",
    q: "A teammate wants a 15-step workflow with two loops and an approval step written as one long LCEL pipe. What do you suggest?",
    say: "A teammate wants a fifteen step workflow, with two loops and an approval step, written as one long LCEL pipe. What do you suggest?",
    a: "A LangGraph graph. LCEL suits short fixed pipelines; loops, branches, state and pausing for approval are what LangGraph is for (and long pipes are hard to debug).",
    aSay: "Write it as a LangGraph graph. LCEL is for short, fixed pipelines. Loops, branches, state that carries across steps, and pausing for an approval are exactly what LangGraph is built for, and a fifteen step pipe would be miserable to debug.",
  }),

  // ---------------------------------------------------------------- 4
  sec("4", "Structured output", "Topic four. Structured output: answers your code can use."),
  {
    kind: "code",
    title: "Two ways to get a typed object",
    lang: "python",
    code: `class Ticket(BaseModel):
    category: Literal["billing", "bug", "how-to"]
    urgency: int = Field(ge=1, le=5)
    summary: str

# one call
ticket = model.with_structured_output(Ticket).invoke(email_text)

# an agent: tools first, then a typed answer
agent = create_agent(model, tools=[search_orders], response_format=Ticket)
result = agent.invoke({"messages": [("user", email_text)]})
result["structured_response"]          # a Ticket`,
    highlight: [[1, 4], [6, 7], [9, 12]],
    beats: B(
      "Declare the shape you want as a Pydantic model: a category from a fixed set, an urgency from one to five, and a summary.",
      "For one call, model dot with structured output, passing the model class. Invoke it, and you get a Ticket object back, not text.",
      { say: "In an agent, pass the schema as response format. The agent uses its tools first, and its final answer arrives, validated, in the structured response key of the result.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "How LangChain gets the structure",
    cols: [
      { title: "ProviderStrategy", icon: "🏭", tone: "green", items: ["The provider's native structured output", "Chosen when the model supports it", "Most reliable"] },
      { title: "ToolStrategy", icon: "🔧", tone: "amber", items: ["The schema offered as a tool the model must call", "Works with any tool-calling model", "handle_errors: feed the error back, try again"] },
    ],
    footer: "Pass the schema directly and LangChain picks the strategy; always validate and log failures",
    beats: B(
      "Under the hood there are two strategies. Provider strategy uses the provider's native structured output mode, where the provider guarantees the JSON matches the schema. LangChain picks it when the model supports it.",
      { say: "Tool strategy offers the schema as a tool the model must call, which works with any model that can call tools. Its handle errors option sends a validation error back to the model and asks again. Pass the schema directly, and LangChain chooses. And the interview follow-up, what if it still fails: validate at the boundary, retry a bounded number of times, and log the failure rate.", tone: "key" },
    ),
  },

  // ---------------------------------------------------------------- 5
  sec("5", "Tools", "Topic five. Tools: how the model learns what it can do."),
  custom(
    "pypipe",
    {
      title: "From a Python function to a tool call",
      stages: [
        { name: "def + hints + docstring", icon: "🐍", sub: "your function" },
        { name: "Schema", icon: "📋", sub: "name, description, JSON args" },
        { name: "Model", icon: "🤖", sub: "picks a tool, writes args" },
        { name: "Your code runs it", icon: "⚙️", sub: "→ ToolMessage" },
      ],
      steps: [
        { at: 0, text: "@tool on a typed, documented function: search_orders(customer_email: str, status: Literal[...] = \"any\", limit: int = 5)." },
        { at: 1, text: "LangChain builds the schema: the function's name, its docstring as the description, and JSON for the arguments from the type hints. Literal becomes an enum; defaults become optional." },
        { at: 2, text: "That schema is all the model knows about the tool. It replies with a tool call: the name and JSON arguments. It never runs anything." },
        { at: 3, text: "Your code validates and runs it, and the result goes back as a ToolMessage. The docstring is a prompt: write it like one." },
      ],
    },
    B(
      "Here's the idea. You write a normal Python function with type hints and a docstring, and put at tool on it.",
      "LangChain builds a schema from it: the name, the docstring as the description, and a JSON schema of the arguments from the type hints. A Literal becomes an enum of allowed values, and a default makes an argument optional.",
      "That schema is everything the model knows about your tool. The model replies with a tool call, which is just a name and some JSON arguments. It never runs anything itself.",
      { say: "Your code runs the function, and the result goes back to the model as a tool message. So the interview answer to how does the model know how to call my tool is: from the name, the docstring and the type hints. Which means the docstring is a prompt. Say what the tool does, when to use it, and what it returns.", tone: "key" },
    ),
  ),
  {
    kind: "code",
    title: "ToolRuntime: what the model must not choose",
    lang: "python",
    code: `from langchain.tools import tool, ToolRuntime

@tool
def my_orders(status: Literal["open", "shipped"], runtime: ToolRuntime[UserContext]) -> list[dict]:
    """List the current user's orders with this status, newest first."""
    return db.find_orders(runtime.context.user_id, status, limit=5)

# runtime is injected at call time and hidden from the schema:
#   runtime.context   per-run data (user id, plan)
#   runtime.state     the agent's state (messages so far)
#   runtime.store     long-term memory
#   runtime.stream_writer, runtime.tool_call_id`,
    highlight: [[3, 6], [8, 12]],
    beats: B(
      "Some arguments must never be chosen by the model: whose orders to read, for example. Add a parameter called runtime, typed as ToolRuntime. LangChain injects it when the tool runs, and hides it from the schema. So the model can choose the status, but the user id comes from the run's context, and the model can't ask for someone else's orders.",
      { say: "Runtime also gives the agent's state, the long-term store, a stream writer for progress updates, and the tool call id. Older code did this with injected state and injected tool arg. In version one, it's ToolRuntime.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "What makes a good tool",
    items: [
      { icon: "🎯", text: "Few tools, clearly named, one meaningful job each", sub: "a model choosing among 40 similar tools chooses badly" },
      { icon: "🔢", text: "Arguments the model can fill reliably", sub: "ids, enums and numbers, not free-text instructions" },
      { icon: "📦", text: "Small, useful results", sub: "the five relevant fields, not the whole database row" },
      { icon: "💬", text: "Errors returned as text the model can act on", sub: "“no order 48213 for this customer”, not a stack trace" },
      { icon: "🔒", text: "Permissions checked in code", sub: "never trusted to the prompt" },
    ],
    beats: B(
      "And the follow-up: what makes a good tool? Few tools, clearly named, each doing one meaningful job. A model choosing among forty similar tools chooses badly.",
      "Arguments the model can fill reliably: ids, enums and numbers, rather than free-text instructions.",
      "Small, useful results. The five relevant fields, not the whole database row, because every token of the result goes into the context.",
      "Errors returned as text the model can act on, like no order four eight two one three for this customer, rather than an exception that kills the run.",
      { say: "And permissions checked in code, inside the tool. A rule in the prompt is a suggestion. A check in code is a control.", tone: "key" },
    ),
  },

  // ---------------------------------------------------------------- 6
  sec("6", "The pieces for RAG", "Topic six. The pieces LangChain gives you for retrieval."),
  custom(
    "pypipe",
    {
      title: "One standard interface per stage",
      stages: [
        { name: "Loaders", icon: "📄", sub: "PDF, web, Notion" },
        { name: "Splitters", icon: "✂️", sub: "chunks + overlap" },
        { name: "Embeddings", icon: "🧭", sub: "text → vectors" },
        { name: "Vector store", icon: "🗄️", sub: "pgvector, Chroma…" },
        { name: "Retriever", icon: "🔎", sub: ".invoke(query)" },
      ],
      steps: [
        { at: 0, text: "Document loaders read sources into Documents: page_content plus metadata, like the source file and page, which is what citations are built from." },
        { at: 1, text: "RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100) splits on paragraphs, then lines, then sentences." },
        { at: [2, 3], text: "An embeddings model turns chunks into vectors, stored in a vector store: PGVector.from_documents(chunks, embeddings, connection=DB_URL)." },
        { at: 4, text: "store.as_retriever(search_type=\"mmr\", search_kwargs={\"k\": 5}) gives a Runnable: invoke it with a question, get Documents back." },
      ],
    },
    B(
      "LangChain has a standard interface for each stage of retrieval, from chapters two to four, so you can swap any one of them. Document loaders read PDFs, web pages, Notion and so on into Documents: the text, plus metadata like the source and the page, which is what citations are built from.",
      "Text splitters cut documents into chunks. The recursive character text splitter tries paragraphs first, then lines, then sentences, with some overlap between chunks.",
      "An embeddings model turns each chunk into a vector, and a vector store, like pgvector, stores them.",
      { say: "And as retriever turns the store into a Runnable: invoke it with a question, and you get documents back. Here with MMR, so the five results aren't near-duplicates of each other.", tone: "key" },
    ),
  ),
  {
    kind: "compare",
    title: "Two ways to use the retriever",
    cols: [
      { title: "Two-step chain", icon: "➡️", tone: "blue", items: ["Always retrieve, then answer", "One model call: predictable, cheap", "The default for document Q&A"] },
      { title: "Agentic RAG", icon: "🤖", tone: "amber", items: ["The retriever is a tool", "The agent decides whether and how often to search", "Better for mixed questions; more calls, less predictable"] },
    ],
    beats: B(
      "Then there are two ways to use the retriever. A two-step chain always retrieves, then answers. One model call, predictable and cheap. That's the right default when every question is about the documents.",
      { say: "Agentic RAG wraps the retriever as a tool and hands it to an agent, which decides whether to search, and how many times, maybe rewriting the query in between. Better for mixed questions, but more calls, more cost, and less predictable. Interviewers like hearing you'd start with the chain, and move to the agent only when the questions need it.", tone: "key" },
    ),
  },

  // ---------------------------------------------------------------- 7
  sec("7", "create_agent", "Topic seven. Create agent: the agent loop, built for you."),
  {
    kind: "code",
    title: "create_agent",
    lang: "python",
    code: `from langchain.agents import create_agent
from langgraph.checkpoint.memory import InMemorySaver

agent = create_agent(
    model="anthropic:claude-sonnet-4-5",
    tools=[search_orders, my_orders, refund_order],
    system_prompt="You are a store's support agent. Never promise refunds over $100.",
    context_schema=UserContext,        # per-run data: user id, plan
    checkpointer=InMemorySaver(),      # memory per thread (Postgres in production)
    middleware=[...],                  # controls around the loop
)

config = {"configurable": {"thread_id": "conv-42"}}
agent.invoke({"messages": [("user", "Where's my last order?")]},
             config, context=UserContext(user_id="u7"))`,
    highlight: [[4, 7], [8, 10], [13, 15]],
    beats: B(
      "Create agent takes a model, a list of tools, and a system prompt.",
      "Then the production pieces: a context schema for per-run data like the user id, a checkpointer so each conversation keeps its memory, and middleware, which is the next topic.",
      { say: "You run it with invoke, passing a thread id in the config, so the conversation continues next time, and the context for this run. Same invoke, stream and batch as every other Runnable.", tone: "key" },
    ),
  },
  {
    kind: "flow",
    title: "What create_agent builds: a LangGraph graph",
    cols: 3,
    rows: 2,
    nodeW: 380,
    nodeH: 130,
    nodes: [
      { id: "s", label: "start", c: 0, r: 0, w: 220 },
      { id: "m", label: "model node\ncall the LLM", c: 1, r: 0, tone: "amber" },
      { id: "t", label: "tools node\nrun each tool call", c: 1, r: 1, tone: "cyan" },
      { id: "e", label: "end\nno more tool calls", c: 2, r: 0, tone: "green" },
    ],
    edges: [
      { from: "s", to: "m" },
      { from: "m", to: "t", label: "tool calls", bend: -170 },
      { from: "t", to: "m", label: "results", bend: -170 },
      { from: "m", to: "e" },
    ],
    show: [["s", "m"], ["t"], ["e"], []],
    overlay: { step: 3, text: "Because it's a graph: checkpointed threads, streaming, interrupts — and it replaced create_react_agent and AgentExecutor", tone: "amber" },
    beats: B(
      "What does it build? A small LangGraph graph. Start, then a model node that calls the LLM.",
      "If the reply contains tool calls, the tools node runs each one, adds the results as tool messages, and goes back to the model.",
      "When a reply has no tool calls, that's the final answer, and the run ends.",
      { say: "And because it's a graph, a create agent agent inherits everything LangGraph has: per-thread memory through the checkpointer, streaming of every step, and interrupts for human approval. It replaced the older create react agent and agent executor.", tone: "key" },
    ),
  },
  check({
    topic: "tools",
    q: "Your refund tool takes customer_id as an argument. Why is that a security problem, and what's the fix?",
    say: "Your refund tool takes customer id as an argument. Why is that a security problem, and what's the fix?",
    a: "The model chooses arguments, and text it reads can steer it, so it could refund another customer. Take the user from ToolRuntime context (hidden from the schema) and check permissions in the tool.",
    aSay: "Because the model chooses arguments, and text it reads can steer it, so it could act on another customer's account. Take the user id from the run's context through ToolRuntime, which the model never sees, and check permissions inside the tool.",
  }),

  // ---------------------------------------------------------------- 8
  sec("8", "Middleware", "Topic eight. Middleware: production controls around the loop, without rewriting it."),
  custom(
    "pyonion",
    {
      title: "middleware=[m1, m2, m3]: m1 is the outermost layer",
      sub: "before_*: m1 → m3   ·   wrap_*: m1( m2( m3( call ) ) )   ·   after_*: m3 → m1",
      core: "model call",
      layers: [
        { name: "m3: PIIMiddleware", does: "listed last: innermost, runs right before the model", tone: "cyan" },
        { name: "m2: SummarizationMiddleware", does: "shortens old messages near the limit", tone: "amber" },
        { name: "m1: ModelRetry / logging", does: "listed first: outermost, sees everything", tone: "green" },
      ],
      call: "going in: m1 → m2 → m3 → model",
      back: "coming out: model → m3 → m2 → m1",
    },
    B(
      "Middleware hooks into fixed points of the agent loop. Two kinds of hook. Node-style hooks, before agent, before model, after model and after agent, run at a point, can update the state, and can jump. Wrap-style hooks, wrap model call and wrap tool call, surround a call, and can change it, retry it, skip it, or swap the model.",
      "The order is a favourite question. With middleware equals m1, m2, m3, the one listed last is the innermost layer, closest to the model call. A PII mask belongs here, so nothing unmasked slips past it.",
      "M2 sits around it.",
      "And m1, listed first, is the outermost layer. Retries and logging belong here, so they see everything.",
      { say: "So before hooks run m1, m2, m3. Wrap hooks nest with m1 outermost. And after hooks run in reverse: m3, m2, m1. It's the same onion as web middleware, and as stacked decorators.", tone: "key" },
    ),
  ),
  {
    kind: "bullets",
    title: "Built-in middleware, mapped to real problems",
    items: [
      { icon: "🔁", text: "A loop of 40 tool calls", sub: "ModelCallLimitMiddleware, ToolCallLimitMiddleware" },
      { icon: "🕵️", text: "An email address in a trace", sub: "PIIMiddleware: mask, redact or block" },
      { icon: "🌩️", text: "The provider is down on a Friday night", sub: "ModelRetryMiddleware, ModelFallbackMiddleware" },
      { icon: "🐢", text: "Long conversations get slow and expensive", sub: "SummarizationMiddleware, ContextEditingMiddleware" },
      { icon: "✋", text: "Refunds need a person", sub: "HumanInTheLoopMiddleware: pause before chosen tools" },
    ],
    beats: B(
      "The built-ins, mapped to the problems they solve. A conversation that loops through forty tool calls: model call limit and tool call limit middleware.",
      "A customer's email address showing up in a trace: PII middleware, which masks, redacts or blocks personal data.",
      "The provider goes down on a Friday night: model retry and model fallback middleware.",
      "Long conversations getting slow and expensive: summarization middleware, and context editing, which clears out old, bulky tool results.",
      { say: "And refunds that need a person: human in the loop middleware, which pauses before the tools you choose and waits for an approval. That one runs on LangGraph's interrupts, from chapter seven.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "Your own middleware is a decorated function",
    lang: "python",
    code: `from langchain.agents.middleware import dynamic_prompt, wrap_model_call

@dynamic_prompt
def by_plan(request) -> str:
    extra = "\\nOffer priority shipping." if request.runtime.context.plan == "pro" else ""
    return BASE_PROMPT + extra

@wrap_model_call
def cheap_first(request, handler):
    if len(request.messages) < 4:                       # an easy, early turn
        return handler(request.override(model=small_model))
    return handler(request)

agent = create_agent(model, tools, middleware=[cheap_first, by_plan])`,
    highlight: [[3, 6], [8, 12], [14, 14]],
    beats: B(
      "Custom middleware is just a decorated function. Dynamic prompt builds the system prompt per request, here from the user's plan in the run's context.",
      "Wrap model call receives the request and a handler that makes the real call. This one routes easy, early turns to a cheaper model, by overriding the model on the request, and passes everything else through.",
      { say: "And they go in the middleware list, in the order we just learnt. The risk to mention: middleware changes requests invisibly. A fallback model may follow your prompt differently. So test with the full stack, and log every time a fallback or a summary fires.", tone: "key" },
    ),
  },

  // ---------------------------------------------------------------- 9
  sec("9", "Memory", "Topic nine. Memory: short-term and long-term."),
  {
    kind: "compare",
    title: "Two kinds of memory",
    cols: [
      { title: "Short-term", icon: "💬", tone: "blue", items: ["The conversation so far: the agent's state", "Saved by the checkpointer per thread_id", "InMemorySaver in dev, PostgresSaver in production", "Trim or summarise as it grows"] },
      { title: "Long-term", icon: "🗃️", tone: "green", items: ["Facts across conversations: preferences, past issues", "A store, by namespace: (\"users\", user_id)", "Read and written by tools via runtime.store", "Optionally searched by meaning"] },
    ],
    beats: B(
      "Short-term memory is the conversation so far. It lives in the agent's state, and the checkpointer saves it under a thread id. Call again with the same thread id, and the agent continues the conversation. In-memory saver for development, which is lost on restart, and the Postgres saver in production. And because the window fills up, long threads are trimmed or summarised.",
      { say: "Long-term memory is facts that outlive a conversation: a user's preferences, their past issues. It lives in a store, organised by namespace, like users, then the user id. Tools read and write it through runtime dot store, and it can be searched by meaning. Short-term is per thread. Long-term is per user, across threads.", tone: "key" },
    ),
  },

  // ---------------------------------------------------------------- 10
  sec("10", "Streaming", "Topic ten. Streaming: users should see progress, not a spinner."),
  {
    kind: "compare",
    title: "stream_mode: what you get back",
    cols: [
      { title: "messages", tone: "green", items: ["LLM tokens as generated", "The chat UI's typing effect"] },
      { title: "updates", tone: "blue", items: ["Each step's state change", "“Looking up your order…”"] },
      { title: "values", tone: "purple", items: ["The full state after each step", "Debugging"] },
      { title: "custom", tone: "amber", items: ["Whatever a tool sends via stream_writer", "“Searched 3 of 10 sources”"] },
    ],
    footer: "stream_mode=[\"updates\", \"messages\"] for both · forward as Server-Sent Events from your API",
    beats: B(
      "Agents stream in modes. Messages mode yields the model's tokens as they're generated: the typing effect in a chat UI.",
      "Updates mode yields each step's state change, like the agent called search orders, which you turn into progress lines: looking up your order.",
      "Values mode yields the whole state after each step. Mostly for debugging.",
      "And custom mode yields whatever your tools send through the stream writer, like searched three of ten sources.",
      { say: "Ask for several at once with a list. And behind an API, you forward them as Server-Sent Events, exactly as in the FastAPI lecture.", tone: "key" },
    ),
  },

  // ---------------------------------------------------------------- 11
  sec("11", "Tracing and evaluation", "Topic eleven. Tracing and evaluation, with LangSmith."),
  {
    kind: "bullets",
    title: "LangSmith: answer “why did the agent do that?”",
    items: [
      { icon: "🧵", text: "A trace per run", sub: "every model call with its full prompt and reply; every tool call with arguments and result" },
      { icon: "💰", text: "Tokens, cost and latency per step", sub: "find the slow tool, the expensive prompt" },
      { icon: "🧪", text: "Datasets and evaluations", sub: "compare a prompt or model change before release (chapter 8)" },
      { icon: "🔌", text: "One environment variable to start", sub: "LANGSMITH_TRACING=true; Langfuse or OpenTelemetry work too" },
    ],
    beats: B(
      "Set LangSmith tracing to true and add an API key, and every run is recorded as a trace: each model call with its full prompt and reply, each tool call with its arguments and result, nested in the order they happened. That's how you answer the question every agent raises: why did it do that?",
      "Each step shows tokens, cost and latency, so you can find the slow tool or the expensive prompt.",
      "The same service holds datasets and runs evaluations, with code checks or LLM judges, so you can compare a prompt or model change before you release it. That's chapter eight.",
      { say: "And you can use LangSmith without the rest of LangChain, or LangChain without LangSmith: open alternatives like Langfuse, or anything built on OpenTelemetry, work too.", tone: "key" },
    ),
  },

  // ---------------------------------------------------------------- 12
  sec("12", "Should you use it?", "Topic twelve. The question that ends most LangChain conversations: would you use it in production?"),
  {
    kind: "compare",
    title: "LangChain in production: for and against",
    cols: [
      { title: "For", icon: "✅", tone: "green", items: ["One interface across providers", "Tools, structured output, middleware: solved", "LangGraph persistence, interrupts, streaming underneath", "Traces of every step"] },
      { title: "Against", icon: "⚠️", tone: "red", items: ["Layers to debug through", "Abstractions can hide the exact prompt sent", "API churn (much calmer since v1)"] },
      { title: "How to use it well", icon: "🛠️", tone: "amber", items: ["Pin versions", "Prompts and logic in your own modules", "Tools as plain, testable functions", "Skip it for single model calls"] },
    ],
    beats: B(
      "For: one interface across providers; tools, structured output and middleware already solved; LangGraph's persistence, interrupts and streaming underneath; and traces of every step.",
      "Against: layers to debug through; abstractions that can hide the exact prompt that was sent; and a history of breaking changes, much calmer since version one.",
      { say: "So, how teams use it well: pin versions, keep prompts and business logic in your own modules, write tools as plain functions you can test without the framework, and skip it entirely when the job is a single model call. A nightly classification job needs the SDK, Pydantic and a retry, not an agent framework.", tone: "key" },
    ),
  },
  {
    kind: "sayit",
    q: "Would you use LangChain in production?",
    lines: [
      "Yes, selectively: for agents that need tools, structured output and production controls.",
      "create_agent with middleware for the standard loop; LangGraph directly for custom control flow.",
      "The raw SDK for single calls.",
      "Pin versions, keep prompts and tools in my own code, test tools without the framework.",
      "Trace everything, and evaluate before each change.",
    ],
    beats: B(
      { say: "The answer, out loud.", tone: "ask" },
      "Yes, selectively: for agents that need tools, structured output and production controls.",
      "I'd use create agent with middleware for the standard tool-calling loop, and LangGraph directly when I need custom control flow.",
      "For a single model call, the raw SDK is simpler.",
      "Either way, I pin versions, keep prompts and tools in my own code, and test the tools without the framework.",
      { say: "And I trace every run, and evaluate before every prompt or model change.", tone: "key" },
    ),
  },
  check({
    topic: "middleware",
    q: "middleware=[logging, pii_mask]. Does the logging middleware's wrap_model_call see the masked or the unmasked messages?",
    say: "Middleware equals logging, then PII mask. Does the logging middleware's wrap model call see the masked messages, or the unmasked ones?",
    options: ["Masked", "Unmasked", "Both", "Neither"],
    oSay: ["masked", "unmasked", "both", "neither"],
    answer: 1,
    a: "Unmasked: logging is listed first, so it is the outermost layer and sees the request before pii_mask (inner) changes it. Mask first, or log from inside.",
    aSay: "B. Unmasked. Logging is listed first, so it's the outermost layer, and sees the request before the PII mask, further in, changes it. So list the mask before the logger, or the raw data ends up in your logs.",
  }),
  {
    kind: "drill",
    items: [
      { q: "Where did AgentExecutor go?", a: "langchain-classic; use create_agent" },
      { q: "invoke, stream, batch: which objects have them?", a: "Every Runnable: models, prompts, retrievers, agents" },
      { q: "What does the model see of a tool?", a: "Name, docstring, JSON schema of the args" },
      { q: "How does a tool get the user id safely?", a: "ToolRuntime context, hidden from the schema" },
      { q: "Where's an agent's structured answer?", a: "result[\"structured_response\"]" },
      { q: "after_model order for [m1, m2, m3]?", a: "m3, m2, m1" },
    ],
    beats: B(
      { say: "Rapid fire. Where did agent executor go?", hold: 3 },
      "Into langchain classic. Use create agent.",
      { say: "Invoke, stream and batch: which objects have them?", hold: 3 },
      "Every Runnable: models, prompts, retrievers, and agents.",
      { say: "What does the model see of a tool?", hold: 3 },
      "Its name, its docstring, and the JSON schema of its arguments.",
      { say: "How does a tool get the user id safely?", hold: 3 },
      "From the ToolRuntime context, which is hidden from the schema.",
      { say: "Where's an agent's structured answer?", hold: 3 },
      "In the structured response key of the result.",
      { say: "After model hooks, with m1, m2, m3: what order?", hold: 3 },
      "M3, m2, m1.",
    ),
  },
  {
    kind: "bullets",
    title: "Next: LangGraph in depth",
    items: [
      { icon: "🕸️", text: "create_agent is a graph you didn't draw", sub: "chapter 14 is drawing your own" },
      { icon: "📖", text: "The chapter's notes and drill have every answer", sub: "say them out loud" },
    ],
    beats: B(
      "Create agent is a graph you didn't have to draw. When the steps must be yours, fixed order, parallel branches, approvals, several agents, you draw it yourself. That's LangGraph, chapter fourteen.",
      { say: "Below this video, the chapter's notes and its interview drill have every answer from today, written out. Say them out loud. See you in chapter fourteen.", tone: "key" },
    ),
  },
];

export const ch13: Chapter = {
  id: "ch13",
  title: "LangChain in depth",
  voice: "en-US-AndrewMultilingualNeural",
  pace: { normal: "-3%", ask: "-5%", aside: "+4%", excite: "+4%" },
  next: "Chapter 14 — LangGraph in depth",
  scenes,
};
