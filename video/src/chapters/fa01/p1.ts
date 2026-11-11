import type { Scene } from "../../lib/types.ts";
import { asked, B, check, custom, sec } from "./h.ts";

// Part 1: what FastAPI is (ASGI, Starlette + Pydantic, workers), the life of
// a request (parameters, 422, response_model), and dependency injection.
export const p1: Scene[] = [
  {
    kind: "title",
    eyebrow: "FastAPI · interview lecture",
    title: "FastAPI for GenAI interviews",
    subtitle: "Putting an LLM app behind an API: the questions that get asked, and the mistakes that freeze servers",
    beats: B(
      "FastAPI for GenAI interviews. In the Python lecture we built AskDocs, an assistant that answers questions from company documents. Now we put it behind an API. Along the way we'll meet every FastAPI question that comes up for AI roles, and the async mistakes that quietly freeze a server under load.",
    ),
  },
  {
    kind: "bullets",
    title: "The AskDocs API we'll build",
    firstItemStep: 1,
    items: [
      { icon: "❓", text: "POST /ask: a question in, a validated answer out" },
      { icon: "💬", text: "POST /chat: the answer streamed token by token" },
      { icon: "📥", text: "POST /ingest: 500 PDFs to embed, without making anyone wait" },
      { icon: "🔐", text: "Every route: who are you, and how many tokens have you used today?" },
    ],
    beats: B(
      "Here's the API, four pieces, and each one is a cluster of interview questions.",
      "Ask: a question goes in, and a validated answer comes out.",
      "Chat: the same, but the answer is streamed to the user token by token, the way every chatbot does it.",
      "Ingest: someone uploads five hundred PDFs to embed, and nobody should have to wait for that.",
      { say: "And on every route: who are you, and how many tokens have you used today. Same format as before: a problem, the mechanism, the interview answer, and a check where you pause and answer first.", tone: "key" },
    ),
  },

  // ------------------------------------------------------------ 1
  sec("1", "What FastAPI is, and why GenAI teams pick it", "Topic one. What FastAPI actually is. Twelve write-ups asked some form of: what is FastAPI, and why use it over Flask or Django?"),
  asked(
    "Why would you build a GenAI service on FastAPI?",
    "ASGI and async · Pydantic validation · streaming · automatic docs · type hints",
    "The question you'll get first.",
    { say: "Why would you build a GenAI service on FastAPI?", tone: "ask" },
    "A good answer names what it's built on and why that fits LLM work: async for waiting on models, Pydantic for validation, streaming, and the docs it writes for you.",
  ),
  {
    kind: "compare",
    title: "WSGI vs ASGI",
    cols: [
      { title: "WSGI (Flask, classic Django)", icon: "🧍", tone: "muted", items: ["one request holds one worker thread until done", "a 20 s LLM call = a thread doing nothing for 20 s", "no native WebSockets or streaming"] },
      { title: "ASGI (FastAPI, Starlette)", icon: "🔀", tone: "green", items: ["requests are async tasks on an event loop", "while one awaits the model, others run", "WebSockets, SSE, long-lived streams"] },
    ],
    footer: "LLM services spend most of their time waiting. ASGI lets one process wait on hundreds of calls at once.",
    beats: B(
      "The foundation first. WSGI is the older standard interface between Python web apps and servers. Each request holds a worker thread until it's done. With an LLM call that takes twenty seconds, that's a thread doing nothing for twenty seconds.",
      "ASGI is the async successor. Requests run as tasks on an event loop, so while one request awaits the model, others keep running. It also supports WebSockets and long lived streams.",
      { say: "And that's why it fits GenAI: these services spend most of their time waiting for a model. ASGI lets one process wait on hundreds of calls at once.", tone: "key", term: { word: "ASGI", meaning: "async server gateway interface: Python web apps as async tasks" } },
    ),
  },
  {
    kind: "bullets",
    title: "What FastAPI is made of",
    firstItemStep: 1,
    items: [
      { icon: "🌉", text: "Starlette: the ASGI toolkit underneath", sub: "routing, requests, responses, middleware, WebSockets, streaming" },
      { icon: "🛡️", text: "Pydantic: validation and serialisation", sub: "your type hints become runtime checks" },
      { icon: "🏷️", text: "Type hints read at startup", sub: "they decide where each parameter comes from, and generate the OpenAPI schema" },
      { icon: "🚀", text: "Uvicorn runs it", sub: "an ASGI server; in production, several worker processes" },
    ],
    beats: B(
      "So what is FastAPI made of? It's thin, on purpose.",
      "Starlette underneath: the ASGI toolkit that does routing, requests, responses, middleware, WebSockets and streaming.",
      "Pydantic for validation and serialisation. Your type hints become runtime checks.",
      { say: "And the clever part: FastAPI reads your function's type hints when the app starts, and uses them to decide where each parameter comes from, to validate it, and to generate the OpenAPI schema and the docs page.", tone: "key" },
      "Uvicorn is the ASGI server that runs it. In production, you run several worker processes, because one process is one event loop on one core.",
    ),
  },
  check({
    topic: "ASGI",
    q: "A Flask (WSGI) app with 4 worker threads calls an LLM that takes 15 s. Ten users ask at once. Roughly how long does the tenth wait, and what changes with FastAPI and async calls?",
    say: "A Flask app with four worker threads calls an LLM that takes fifteen seconds. Ten users ask at once. Roughly how long does the tenth wait, and what changes with FastAPI and async calls?",
    a: "About 45 s: three rounds of 4 (15 s each). With async calls, all 10 wait on the model at the same time on one event loop: about 15 s each.",
    aSay: "About forty five seconds. Four threads serve four users at a time, so ten users need three rounds of fifteen seconds. With FastAPI and async calls, all ten requests wait on the model at the same time, on one event loop, so everyone gets an answer in about fifteen seconds.",
    hold: 12,
  }),

  // ------------------------------------------------------------ 2
  sec("2", "The life of a request", "Topic two. The life of a request. What happens between a client sending JSON and your function running, which explains the four hundred and twenty two error everyone meets on day one."),
  custom(
    "pypipe",
    {
      title: "POST /ask, from the socket to your function",
      stages: [
        { name: "Uvicorn", icon: "🚀", sub: "bytes → ASGI call" },
        { name: "Middleware", icon: "🧅", sub: "CORS, timing, request id" },
        { name: "Router", icon: "🧭", sub: "method + path → route" },
        { name: "Dependencies", icon: "🔌", sub: "auth, DB, LLM client" },
        { name: "Validation", icon: "🛡️", sub: "Pydantic: path, query, body" },
        { name: "Your function", icon: "⚙️", sub: "async def ask(...)" },
      ],
      steps: [
        { at: 0, text: "Uvicorn reads the bytes off the socket and calls the app through ASGI." },
        { at: 1, text: "Middleware wraps every request: CORS headers, a request id, timing." },
        { at: 2, text: "The router matches the method and path, POST /ask, to your route." },
        { at: [3, 4], text: "Dependencies are resolved and every parameter is validated by Pydantic. Bad input stops here with 422, before your code runs." },
        { at: 5, text: "Only now does your function run, with clean, typed arguments." },
        { at: 0, back: true, text: "On the way out: the return value is filtered through response_model, serialised to JSON, and passes back through the middleware." },
      ],
    },
    B(
      "Follow one request through. Uvicorn reads the bytes off the socket and calls the app through ASGI.",
      "Middleware wraps every request: CORS headers, a request id, timing.",
      "The router matches the method and path to your route.",
      { say: "Then dependencies are resolved and every parameter is validated by Pydantic. If the input is bad, the request stops here, with a four twenty two error, and your code never runs.", tone: "key" },
      "Only now does your function run, with clean, typed arguments.",
      "And on the way out, the return value is filtered through the response model, turned into JSON, and passes back out through the middleware.",
    ),
  ),
  {
    kind: "code",
    title: "Path, query and body: decided by the type hints",
    lang: "python",
    code: `class AskIn(BaseModel):
    question: str = Field(min_length=3, max_length=2000)
    top_k: int = Field(5, ge=1, le=20)

class AskOut(BaseModel):
    answer: str
    sources: list[str]

@app.post("/collections/{collection_id}/ask", response_model=AskOut)
async def ask(collection_id: int, body: AskIn, debug: bool = False):
    result = await rag.answer(collection_id, body.question, body.top_k)
    return result          # may carry cost, raw prompt... filtered out`,
    highlight: [[1, 3], [5, 7], [9, 10], [10, 10], [12, 12]],
    beats: B(
      "Here's the ask endpoint. The input is a Pydantic model: a question between three and two thousand characters, and top k, between one and twenty, defaulting to five.",
      "The output is a model too: an answer and its sources.",
      "Now the parameters. FastAPI looks at each one's type hint and where its name appears.",
      { say: "Collection id appears in the path, so it's a path parameter, converted to an int. Body is a Pydantic model, so it's read from the JSON body. Debug is a simple type that's not in the path, so it's a query parameter. You never parse anything yourself.", tone: "key" },
      "And the return value is filtered through the response model. If your internal result also carries the raw prompt or the cost of the call, those fields never reach the client.",
    ),
  },
  {
    kind: "trap",
    myth: "If a request fails validation, my function gets None or a bad value and has to check it.",
    truth: "Your function never runs. FastAPI answers 422 Unprocessable Entity, with a body listing every bad field and why.",
    why: "So validation lives in the models, once. And response_model protects the other direction: no internal field leaks out by accident.",
    beats: B(
      "A belief to correct.",
      { say: "If the body fails validation, your function doesn't run at all. FastAPI answers four twenty two, unprocessable entity, with a body that lists every bad field and the reason.", tone: "key" },
      "So validation lives in the models, written once. And the response model guards the other direction: nothing internal leaks out by accident, which matters when your internals include prompts and costs.",
    ),
  },
  check({
    topic: "parameters",
    q: "In @app.get(\"/docs/{doc_id}\") async def get_doc(doc_id: int, page: int = 1), a client calls /docs/abc?page=2. What happens?",
    say: "A route reads doc id from the path as an int, and page as an int with default one. A client calls slash docs slash a b c, with page equals two. What happens?",
    options: ["doc_id is \"abc\" inside the function", "422: doc_id must be an integer", "404: no route matches", "500: int(\"abc\") crashes"],
    oSay: ["doc id is the string a b c inside the function", "a four twenty two, because doc id must be an integer", "a four oh four, no route matches", "a five hundred, because converting a b c to int crashes"],
    answer: 1,
    a: "422. The route matches, but validation fails on the path parameter before the function runs.",
    aSay: "B, four twenty two. The path matches the route, but validation fails on doc id, which must be an integer, before your function is ever called.",
  }),

  // ------------------------------------------------------------ 3
  sec("3", "Dependency injection", "Topic three. Dependency injection with Depends. Asked in four write-ups by name, and it's how every real FastAPI app shares its database session, its LLM client and its current user."),
  custom(
    "analogy",
    {
      title: "Depends is a hotel concierge",
      a: "At a hotel",
      b: "FastAPI",
      rows: [
        { icon: "🛎️", a: "You ask for a car; you don't build one", b: "def ask(llm = Depends(get_llm))" },
        { icon: "🗂️", a: "The concierge knows how to get one", b: "get_llm() is a plain function FastAPI calls" },
        { icon: "🔑", a: "Some services need your room key first", b: "dependencies can depend on others: user → db" },
        { icon: "🧹", a: "Housekeeping comes after you leave", b: "yield: cleanup runs once the route is done" },
      ],
      footer: "Your route says what it needs; FastAPI builds it, for every request, and cleans up after.",
    },
    B(
      "Here's the picture. Depends is a hotel concierge.",
      "You ask for a car. You don't build one. In FastAPI, a route parameter says: give me an LLM client, using Depends of get LLM.",
      "The concierge knows how. Get LLM is a plain function, and FastAPI calls it for you on each request.",
      "Some services need your room key first. Dependencies can depend on other dependencies: the current user needs the database, which needs the settings.",
      { say: "And housekeeping comes after you leave. A dependency written with yield runs its cleanup once the route is done.", tone: "key" },
      { say: "So your route only declares what it needs. FastAPI builds it, for every request, and cleans up after.", tone: "key", term: { word: "Dependency injection", meaning: "the framework builds what a function declares it needs" } },
    ),
  ),
  {
    kind: "code",
    title: "Dependencies: a session with cleanup, a user, a client",
    lang: "python",
    code: `async def get_db():
    async with SessionLocal() as session:   # opened per request
        yield session                       # the route runs here
    # closed once the route is done, even if it raised

async def get_user(token: str = Depends(oauth2), db = Depends(get_db)):
    user = await verify(token, db)
    if not user:
        raise HTTPException(401, "invalid token")
    return user

def get_llm(request: Request) -> LLMClient:
    return request.app.state.llm            # one shared client (topic 5)

@app.post("/ask")
async def ask(body: AskIn, user = Depends(get_user), llm = Depends(get_llm), db = Depends(get_db)):
    ...`,
    highlight: [[1, 4], [6, 10], [12, 13], [15, 17]],
    beats: B(
      "Three dependencies AskDocs needs. First, a database session. It's opened per request, yielded to the route, and closed when the route is done, even if the route raised an exception.",
      "Second, the current user. It depends on the bearer token and on the database, so dependencies form a tree. If the token is bad, it raises four oh one, and the route never runs.",
      "Third, the LLM client, which is created once at startup and simply handed out. More on that in topic five.",
      { say: "The route declares all three. Notice get db appears twice, once directly and once inside get user. FastAPI caches a dependency per request, so both get the same session, created once. And in tests, dependency overrides swaps any of these for a fake, which is topic ten.", tone: "key" },
    ),
  },
  check({
    topic: "dependencies",
    q: "get_db is a yield dependency. The route raises HTTPException(404). Does the session still close?",
    say: "Get db is a dependency written with yield. The route raises an HTTP exception, four oh four. Does the session still close?",
    a: "Yes. The code after yield (or the async with around it) runs after the route finishes, even when it raised, so the session always closes.",
    aSay: "Yes. The yield sits inside an async with block, and FastAPI resumes the dependency after the route finishes, even when the route raised. So the session always closes. That's exactly why yield dependencies are the way to manage sessions and connections.",
  }),
  {
    kind: "sayit",
    q: "How does dependency injection work in FastAPI?",
    lines: [
      "A route declares what it needs with Depends(fn); FastAPI calls fn per request and passes the result in.",
      "Dependencies can depend on others, forming a tree; each is cached once per request.",
      "A yield dependency gives setup before and cleanup after the route: DB sessions, connections.",
      "Raising HTTPException in a dependency stops the request: that's how auth works.",
      "In tests, app.dependency_overrides swaps any of them for a fake.",
    ],
    beats: B(
      { say: "Model answer. How does dependency injection work in FastAPI?", tone: "ask" },
      "A route declares what it needs with Depends of a function. FastAPI calls that function for each request and passes the result in.",
      "Dependencies can depend on other dependencies, forming a tree, and each one is cached once per request.",
      "A dependency written with yield gives setup before the route and cleanup after it, which is how you manage database sessions.",
      "Raising an HTTP exception inside a dependency stops the request, which is how authentication works.",
      { say: "And in tests, app dot dependency overrides swaps any of them for a fake.", tone: "key" },
    ),
  },
];
