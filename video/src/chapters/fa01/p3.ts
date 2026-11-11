import type { Scene } from "../../lib/types.ts";
import { B, check, custom, q, sec } from "./h.ts";

// Part 3: module 8 (databases), module 9 (beyond request/response) and
// module 10 (testing, docs and deployment), then the close.
export const p3: Scene[] = [
  // ================================================================ module 8
  sec("8", "Databases", "Module eight. Databases. Async SQLAlchemy, and the N plus one problem, which was asked in two write-ups."),
  {
    kind: "flow",
    title: "The idea: one engine per app, one session per request",
    cols: 3,
    rows: 2,
    nodeW: 440,
    nodeH: 130,
    nodes: [
      { id: "e", label: "engine + connection pool\ncreated once, in the lifespan", c: 1, r: 0, tone: "amber" },
      { id: "r1", label: "request 1\nits own AsyncSession", c: 0, r: 1 },
      { id: "r2", label: "request 2\nits own AsyncSession", c: 1, r: 1 },
      { id: "r3", label: "request 3\nits own AsyncSession", c: 2, r: 1 },
    ],
    edges: [
      { from: "r1", to: "e", label: "borrow a connection" },
      { from: "r2", to: "e" },
      { from: "r3", to: "e" },
    ],
    show: [["e"], ["r1", "r2", "r3"]],
    beats: B(
      "Here's the idea. The engine, with its pool of database connections, is created once for the whole app, in the lifespan. Opening a database connection is slow, so they're kept and reused.",
      { say: "Each request gets its own session, from a yield dependency, which borrows a connection from the pool and gives it back at the end. One engine per app, one session per request. Never share a session between requests.", tone: "key" },
    ),
  },

  // ---- Q25
  q(25, 1, "How do you use SQLAlchemy (async) with FastAPI?", "async engine and session, explicit loading, and the gotchas", "Question twenty five. How do you use SQLAlchemy, async, with FastAPI?", "The setup, how queries look, and the two async gotchas."),
  {
    kind: "code",
    title: "Async SQLAlchemy in a route",
    lang: "python",
    code: `engine = create_async_engine("postgresql+asyncpg://…", pool_size=10)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

@router.get("/chats/{id}", response_model=ChatOut)
async def get_chat(id: int, db: AsyncSession = Depends(get_db)):
    stmt = (select(Chat)
            .where(Chat.id == id)
            .options(selectinload(Chat.messages)))    # load it now
    chat = (await db.execute(stmt)).scalar_one_or_none()
    if chat is None:
        raise HTTPException(404, "chat not found")
    return chat`,
    highlight: [[1, 2], [4, 9], [10, 12]],
    beats: B(
      "An async engine with an async driver, like asyncpg, and a pool. The session maker with expire on commit false, so objects stay readable after a commit without another query.",
      "Queries use the two point oh style: build a select, then await db dot execute. And here's the first gotcha: lazy loading doesn't work implicitly in async. Touching chat dot messages later would raise an error called missing greenlet. So load relationships explicitly, with selectinload.",
      { say: "The second gotcha: don't mix in synchronous database calls inside async routes. And use Alembic for migrations, never create all in production.", tone: "key" },
    ),
  },

  // ---- Q26
  q(26, 2, "How do you avoid N+1 queries and tune database access in FastAPI?", "what N+1 is, eager loading, and a tuning checklist", "Question twenty six, asked twice. How do you avoid N plus one queries, and tune database access in FastAPI?", "What N plus one looks like, the fix, and a short checklist."),
  {
    kind: "chart",
    title: "N+1: listing 100 chats with their messages",
    type: "bars",
    labels: ["lazy: 1 + N", "selectinload", "joinedload"],
    series: [{ name: "queries", values: [101, 2, 1], step: 0 }],
    note: { step: 1, text: "selectinload: one extra IN query for the children (good for one-to-many) · joinedload: one JOIN (good for many-to-one)", tone: "amber" },
    beats: B(
      "N plus one: one query loads a hundred chats, and then reading each chat's messages fires one more query per chat. A hundred and one round trips, and it gets worse as the data grows.",
      { say: "The fix is eager loading. Selectinload runs one extra query, with an IN list of ids, for all the children: two queries total, which suits one to many. Joinedload does it in a single join, which suits many to one. Then the checklist: indexes on foreign keys and filter columns, checked with explain analyze; select only the columns you need; paginate; and size the pool to what the database can take.", tone: "key" },
    ),
  },
  check({
    topic: "N+1",
    q: "A page lists 50 orders and shows each order's customer name. The logs show 51 queries. What's happening, and the fix?",
    say: "A page lists fifty orders, and shows each order's customer name. The logs show fifty one queries. What's happening, and what's the fix?",
    a: "N+1: one query for the orders, then one lazy query per order for its customer. Eager-load: joinedload(Order.customer) (many-to-one) → 1 query.",
    aSay: "That's N plus one. One query loads the orders, then each order lazily loads its customer, one query each. Eager load the customer, with joinedload, since it's many to one, and it becomes a single query.",
  }),

  // ================================================================ module 9
  sec("9", "Beyond request/response", "Module nine. Beyond request and response. Background work, streaming, WebSockets, rate limits, and token budgets. This is where GenAI services live, because model calls are slow and expensive."),
  {
    kind: "compare",
    title: "The idea: pick the tool by how long the work takes",
    cols: [
      { title: "Milliseconds", icon: "⚡", tone: "green", items: ["Normal request → response", "Validate, query, return JSON"] },
      { title: "Seconds, live", icon: "🌊", tone: "blue", items: ["StreamingResponse / SSE", "LLM tokens as they're made"] },
      { title: "After the reply", icon: "📨", tone: "amber", items: ["BackgroundTasks", "A quick email, an audit log"] },
      { title: "Minutes", icon: "🏭", tone: "pink", items: ["A queue + workers", "202 + a job id; poll or notify"] },
    ],
    footer: "And WebSockets when both sides need to talk, any time",
    beats: B(
      "Here's the idea of this module: pick the tool by how long the work takes. Milliseconds: a normal request and response.",
      "Seconds, and the user should see progress: stream the response, with Server-Sent Events. That's how LLM tokens reach a chat UI.",
      "Small work that can happen after the reply: background tasks.",
      "Minutes, like ingesting a big document: a queue with separate workers. Reply 202 with a job id, and let the client poll or get notified.",
      { say: "And when both sides need to send messages at any time, a WebSocket.", tone: "key" },
    ),
  },

  // ---- Q27
  q(27, 1, "What are BackgroundTasks, and when should you use Celery or a queue instead?", "after the response, in the same process, no guarantees", "Question twenty seven. What are background tasks, and when should you use Celery or a queue instead?", "What background tasks really are, their limits, and when the limits matter."),
  {
    kind: "compare",
    title: "BackgroundTasks vs a real queue",
    cols: [
      { title: "BackgroundTasks", icon: "📨", tone: "amber", items: ["Runs after the response, in the same process", "No retries, no persistence: a restart loses it", "Uses the same worker's CPU", "Quick, non-critical follow-ups"] },
      { title: "Queue (Celery, RQ, Arq, SQS)", icon: "🏭", tone: "green", items: ["Stored in a broker; separate workers", "Retries, scheduling, monitoring", "Scales apart from the API", "Long, heavy, or must-not-lose work"] },
    ],
    footer: "Long job → enqueue, return 202 + job_id, client polls GET /jobs/{id}",
    beats: B(
      "Background tasks run a function after the response is sent, in the same process. That's all. No retries, no persistence: if the process restarts or crashes, the task is gone. And it uses the API worker's own resources. Good for quick, non-critical follow-ups: sending an email, writing an audit log.",
      { say: "For anything long, heavy, or that must not be lost, like embedding a thousand page document, use a real queue: Celery, RQ, Arq, or a cloud queue. Jobs are stored in a broker, run by separate workers with retries, and scale apart from the API. The API enqueues the job, replies 202 with a job id, and the client polls a status endpoint.", tone: "key" },
    ),
  },

  // ---- Q28
  q(28, 2, "How do you stream responses (StreamingResponse, Server-Sent Events, LLM tokens)?", "an async generator, the SSE format, disconnects, and proxies", "Question twenty eight, asked twice. How do you stream responses? StreamingResponse, Server-Sent Events, and LLM tokens.", "The generator, the format, and the two production details everyone forgets."),
  {
    kind: "seq",
    title: "Server-Sent Events: one request, many small messages",
    actors: [
      { id: "b", name: "Browser", icon: "🖥️" },
      { id: "a", name: "FastAPI", icon: "⚡", tone: "amber" },
      { id: "l", name: "LLM", icon: "🤖", tone: "green" },
    ],
    msgs: [
      { from: "b", to: "a", label: "POST /chat/stream", step: 0 },
      { from: "a", to: "l", label: "stream=True", step: 0, tone: "green" },
      { from: "l", to: "a", label: "token, token, token…", step: 1, tone: "green" },
      { from: "a", to: "b", label: "data: {\"t\": \"Hel\"}\\n\\n  data: …", step: 1, tone: "amber" },
      { from: "a", to: "b", label: "data: [DONE]", step: 2, tone: "amber" },
    ],
    note: { step: 2, text: "Time to first token drops from ~8 s to ~0.5 s: the user sees words immediately", tone: "green" },
    beats: B(
      "The browser sends one request. FastAPI calls the model with streaming turned on.",
      "As tokens arrive from the model, FastAPI forwards each one immediately, as a server sent event: a line starting with data, then a blank line.",
      { say: "And a final done event. The whole answer takes just as long, but the user sees the first words in half a second instead of waiting eight. That's why every chat product streams.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "Stream from an async generator",
    lang: "python",
    code: `@app.post("/chat/stream")
async def chat_stream(body: ChatIn, request: Request, llm=Depends(get_llm)):
    async def events():
        async for token in llm.stream(body.messages):
            if await request.is_disconnected():
                break                              # stop paying for tokens
            yield f"data: {json.dumps({'t': token})}\\n\\n"
        yield "data: [DONE]\\n\\n"
    return StreamingResponse(events(), media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})`,
    highlight: [[3, 4], [5, 6], [7, 8], [9, 10]],
    beats: B(
      "StreamingResponse takes an async generator, the async generator from the Python lecture. It loops over the model's stream.",
      "Production detail one: check whether the client disconnected, and stop. Otherwise you keep generating, and paying for, tokens nobody will read.",
      "Each token is yielded in SSE format: data, the JSON, and a blank line. Then a done marker.",
      { say: "Production detail two: proxies like nginx buffer responses by default, which would deliver the whole stream at the end. The X Accel Buffering no header, plus no cache, turn that off. SSE is one-way and runs over plain HTTP, so it's simpler than WebSockets for token streaming.", tone: "key" },
    ),
  },

  // ---- Q29
  q(29, null, "How do WebSockets work in FastAPI?", "a persistent two-way connection, and scaling it", "Question twenty nine. How do WebSockets work in FastAPI?", "The endpoint shape, and the scaling problem every interviewer asks about next."),
  {
    kind: "code",
    title: "A WebSocket endpoint",
    lang: "python",
    code: `@app.websocket("/ws/{room}")
async def ws(websocket: WebSocket, room: str):
    await websocket.accept()
    await manager.join(room, websocket)
    try:
        while True:
            msg = await websocket.receive_json()
            await manager.broadcast(room, msg)     # local connections only!
    except WebSocketDisconnect:
        manager.leave(room, websocket)

# several workers or pods: publish through Redis pub/sub,
# each process delivers to its own connections`,
    highlight: [[1, 4], [5, 10], [12, 13]],
    beats: B(
      "A WebSocket is a persistent, two-way connection: chat, live dashboards, collaborative editing. The endpoint accepts the connection, and registers it.",
      "Then it loops, receiving messages and broadcasting them, until the client disconnects.",
      { say: "The scaling catch: an in-memory connection manager only knows the connections on its own process. With several workers or pods, a message must go through something shared, like Redis pub sub, so every process can deliver it to its own clients. Also: authenticate on connect, and use heartbeats to detect dead connections.", tone: "key" },
    ),
  },

  // ---- Q30
  q(30, 3, "How do you add rate limiting, caching and pagination to a FastAPI API?", "counters in Redis, cache with TTLs, cursor pagination", "Question thirty, asked in three write-ups. How do you add rate limiting, caching and pagination?", "Three separate tools. The common thread: anything shared lives in Redis, not process memory."),
  {
    kind: "bullets",
    title: "Three tools, one rule: shared state lives in Redis",
    items: [
      { icon: "🚦", text: "Rate limiting: a counter per user per window, in Redis", sub: "INCR + EXPIRE, or a token bucket; 429 with Retry-After" },
      { icon: "🗃️", text: "Caching: read-through with a TTL", sub: "key by everything that changes the answer; invalidate on writes; HTTP ETag / Cache-Control too" },
      { icon: "📄", text: "Pagination: prefer cursors over offsets", sub: "WHERE id > :last ORDER BY id LIMIT 20 stays fast; OFFSET 100000 scans and skips" },
      { icon: "🌍", text: "Why Redis: you run many workers and pods", sub: "a counter in process memory only limits one worker" },
    ],
    beats: B(
      "Rate limiting: a counter per user, or per key, per time window, stored in Redis. Increment it, set an expiry, and over the limit, reply 429 with a retry after header. A token bucket smooths out bursts. Or do it at the API gateway.",
      "Caching: check the cache, and on a miss, compute and store it with a time to live. The key must include everything that changes the answer, and writes must invalidate it.",
      "Pagination: prefer cursors to offsets. Where id is greater than the last id seen, order by id, limit twenty, uses the index and stays fast. Offset one hundred thousand makes the database scan and throw away a hundred thousand rows.",
      { say: "And the common thread: you run many workers and pods, so a counter or cache in process memory only works for one of them. Anything shared lives in Redis.", tone: "key" },
    ),
  },

  // ---- Q31 (fa35)
  q(31, null, "How do you enforce per-user token budgets, and keep the whole service under the LLM provider's rate limit?", "two limits: per user in Redis, global with a semaphore or shared limiter", "Question thirty one. How do you enforce per-user token budgets, and keep the whole service under the LLM provider's rate limit?", "Two different limits. One per user, for fairness and cost. One global, for the provider's limit on your key."),
  {
    kind: "code",
    title: "Check before, record actual usage after",
    lang: "python",
    code: `async def check_budget(user=Depends(get_user), redis=Depends(get_redis)):
    used = int(await redis.get(f"tokens:{user.id}:{date.today()}") or 0)
    if used >= user.daily_tokens:
        raise HTTPException(429, "daily token budget used",
                            headers={"Retry-After": "3600"})
    return user

llm_slots = asyncio.Semaphore(20)          # per process: provider limit / workers

@app.post("/ask")
async def ask(body: AskIn, user=Depends(check_budget), redis=Depends(get_redis)):
    async with llm_slots:
        reply = await llm.complete(body.question)
    await redis.incrby(f"tokens:{user.id}:{date.today()}", reply.usage.total_tokens)
    return reply`,
    highlight: [[1, 6], [8, 8], [10, 15]],
    beats: B(
      "Per user: a dependency checks today's token count in Redis before calling the model, and replies 429 when the budget is used up. Limit tokens, not just requests: one request can cost fifty tokens, or fifty thousand.",
      "Globally: a semaphore per process caps the calls in flight. Divide the provider's limit by the number of processes, or use a shared limiter in Redis.",
      { say: "And record the actual usage after the call, because output length is only known at the end. For streaming, record when the stream ends, including when the client disconnects. Status codes: the user's own limit is 429; the provider being saturated is 503, with retry after.", tone: "key" },
    ),
  },
  check({
    topic: "background work",
    q: "Uploading a 500-page PDF triggers chunking and embedding (≈ 4 min). BackgroundTasks or a queue?",
    say: "Uploading a five hundred page PDF triggers chunking and embedding, about four minutes of work. Background tasks, or a queue?",
    a: "A queue: it's long, heavy and must not be lost on a restart. Return 202 + job_id; workers process it with retries; the client polls the job status.",
    aSay: "A queue. It's long, heavy, and must not be lost if the API restarts. Reply 202 with a job id, let separate workers process it with retries, and have the client poll the job's status.",
  }),
  check({
    topic: "streaming",
    q: "Your SSE endpoint works locally, but behind nginx the whole answer arrives at once at the end. Why?",
    say: "Your SSE endpoint works locally, but behind nginx, the whole answer arrives at once, at the end. Why?",
    a: "nginx buffers the response. Send X-Accel-Buffering: no (and Cache-Control: no-cache), or turn off proxy_buffering for that route.",
    aSay: "Because nginx buffers the response before passing it on. Send the X Accel Buffering no header, with cache control no cache, or turn off proxy buffering for that route.",
  }),

  // ================================================================ module 10
  sec("10", "Testing, docs and deployment", "Module ten. Testing, docs and deployment. The last five questions, ending with the design question that pulls the whole lecture together."),
  {
    kind: "bullets",
    title: "The idea: what makes a service production-ready",
    items: [
      { icon: "🧪", text: "Tested", sub: "dependency overrides, a real test database, the lifespan running" },
      { icon: "📘", text: "Documented", sub: "OpenAPI from the code, so docs never drift" },
      { icon: "📦", text: "Packaged and run well", sub: "a slim image, one process per container, health checks" },
      { icon: "📈", text: "Fast and observable", sub: "latency, errors, tokens and cost, traced per request" },
    ],
    beats: B(
      "Here's the idea of the last module: what makes a service production-ready. It's tested, with fakes for the slow and expensive parts, and the real thing where it matters.",
      "It's documented, and in FastAPI, the documentation comes from the code itself, so it never drifts.",
      "It's packaged and run well: a slim image, one process per container, and health checks the platform can use.",
      { say: "And it's fast and observable: you can see latency, errors, tokens and cost, per request. One question each, then the design question.", tone: "key" },
    ),
  },

  // ---- Q32 (fa31)
  q(32, null, "How do you test FastAPI applications?", "TestClient, overrides, a real database, and the lifespan", "Question thirty two. How do you test FastAPI applications?", "The client to use, what to fake, what to keep real, and one trap."),
  {
    kind: "code",
    title: "Tests: override the edges, keep the core real",
    lang: "python",
    code: `@pytest.fixture
def client():
    app.dependency_overrides[get_llm] = lambda: FakeLLM()
    with TestClient(app) as c:          # "with" runs the lifespan
        yield c
    app.dependency_overrides.clear()

def test_empty_question_is_422(client):
    assert client.post("/ask", json={"text": ""}).status_code == 422

async def test_ask_async():             # pytest-asyncio / anyio
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://t") as ac:
        r = await ac.post("/ask", json={"text": "hi"})`,
    highlight: [[1, 6], [8, 9], [11, 14]],
    beats: B(
      "A fixture overrides the edges: the LLM client, payment, email, auth. And creates a TestClient. The trap: use it as a context manager, with with. Only then does the lifespan run, so the startup objects exist.",
      "Test the contract, including the failures: an empty question must give 422, a missing token 401, an unknown id 404.",
      { say: "For async tests, httpx's AsyncClient with an ASGI transport. And keep the core real: a real Postgres in Docker, using Testcontainers, with each test inside a transaction that's rolled back, so tests are fast and isolated.", tone: "key" },
    ),
  },

  // ---- Q33 (fa32)
  q(33, null, "How do the automatic API docs work, and how do you customise them?", "OpenAPI generated from your code", "Question thirty three. How do the automatic API docs work, and how do you customise them?", "Where the docs come from, and the knobs."),
  {
    kind: "bullets",
    title: "OpenAPI, generated from your code",
    items: [
      { icon: "🧾", text: "/openapi.json: an OpenAPI 3 schema", sub: "built from routes, type hints, models, dependencies and security schemes" },
      { icon: "🖱️", text: "/docs (Swagger UI) and /redoc", sub: "try requests, authorise with a token" },
      { icon: "✍️", text: "Customise: summary, description, tags, examples, responses={404: …}", sub: "Field(description=…), json_schema_extra examples, include_in_schema=False" },
      { icon: "🧰", text: "Generate typed client SDKs from the schema", sub: "and turn docs off or protect them in production if the API is private" },
    ],
    beats: B(
      "FastAPI builds an OpenAPI three schema from your routes, type hints, Pydantic models, dependencies and security schemes, served at slash openapi dot json.",
      "On top of it, Swagger UI at slash docs, where you can try requests and authorise with a token, and ReDoc at slash redoc.",
      "You customise it with summaries, descriptions, tags, examples, and documented error responses, and hide internal routes with include in schema false.",
      { say: "And because the schema is standard, you can generate typed client SDKs from it. For a private API, disable or protect the docs in production.", tone: "key" },
    ),
  },

  // ---- Q34 (fa33)
  q(34, null, "How do you deploy FastAPI with Docker?", "a slim image, one process, health checks, graceful shutdown", "Question thirty four. How do you deploy FastAPI with Docker?", "The Dockerfile, then the production checklist."),
  {
    kind: "code",
    title: "A slim, cache-friendly image",
    lang: "dockerfile",
    code: `FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN pip install uv && uv sync --frozen --no-dev    # deps layer, cached
COPY src/ ./src
RUN useradd -m app
USER app                                           # not root
EXPOSE 8000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]`,
    highlight: [[1, 4], [5, 7], [8, 9]],
    beats: B(
      "A slim base image. Copy the dependency files first and install from the lock file, so that layer is cached, and only rebuilds when dependencies change.",
      "Then the code, and run as a non-root user.",
      { say: "One Uvicorn process per container, and scale with replicas. Then the checklist: a liveness endpoint, saying the process is up, and a readiness endpoint, saying the database and Redis are reachable. Graceful shutdown so in-flight requests finish. Config from the environment, secrets from a secret manager, never baked into the image.", tone: "key" },
    ),
  },

  // ---- Q35 (fa34)
  q(35, null, "How do you make a FastAPI service fast and observable in production?", "never block, reuse connections, time out everything; measure p95, TTFT and cost", "Question thirty five. How do you make a FastAPI service fast and observable in production?", "Performance habits, then what you measure. For a GenAI service, a few metrics are special."),
  {
    kind: "compare",
    title: "Fast, and observable",
    cols: [
      { title: "Fast", icon: "⚡", tone: "green", items: ["Async all the way; never block the loop", "One pool per DB, one shared HTTP client", "Timeouts on every outbound call", "Cache, paginate, stream LLM answers"] },
      { title: "Observable", icon: "📈", tone: "blue", items: ["Latency p50/p95/p99 per route, error rates", "LLM: time to first token, tokens in/out, cost", "Structured JSON logs with a request id", "Traces across API → vector DB → LLM (OpenTelemetry)"] },
    ],
    footer: "Averages hide pain: alert on p95 and error rate",
    beats: B(
      "Fast: async all the way, and never block the loop. One connection pool per database and one shared HTTP client, created at startup. A timeout on every outbound call, because one slow dependency without a timeout can hold every worker. And cache, paginate, and stream.",
      { say: "Observable: latency percentiles per route, p50, p95, p99, and error rates. For an LLM service, also time to first token, tokens in and out, and cost per request. Structured JSON logs carrying a request id. And traces across the API, the vector store and the model, with OpenTelemetry, so you can see where a slow request spent its time. Averages hide pain, so alert on p95.", tone: "key" },
    ),
  },

  // ---- Q36 (fa36)
  q(36, null, "Design the chat endpoint of a GenAI app in FastAPI.", "every layer, in the order a request meets them", "Question thirty six, the design question. Design the chat endpoint of a GenAI app in FastAPI.", "Walk through every layer, in the order a request meets them. Every module of this lecture shows up once."),
  custom(
    "pypipe",
    {
      title: "POST /chat, layer by layer",
      stages: [
        { name: "Validate", icon: "🛡️", sub: "Pydantic, bounded" },
        { name: "Auth + budget", icon: "🔑", sub: "JWT, Redis tokens" },
        { name: "Retrieve", icon: "📚", sub: "vector store, timeout" },
        { name: "LLM", icon: "🤖", sub: "shared client, semaphore" },
        { name: "Stream back", icon: "🌊", sub: "SSE, disconnects" },
      ],
      steps: [
        { at: 0, text: "async def route; a Pydantic body: messages, a model from an allowed set, max_tokens bounded. Bad input → 422." },
        { at: 1, text: "get_current_user verifies the JWT; check_budget reads today's tokens in Redis → 429 when spent." },
        { at: 2, text: "If it's RAG: async retrieval with its own timeout; CPU-heavy re-ranking off the event loop." },
        { at: 3, text: "One async LLM client from the lifespan, a semaphore under the provider's limit, a timeout, retries on transient errors only." },
        { at: 4, text: "StreamingResponse with SSE; stop on disconnect; afterwards record token usage and save the conversation, with the request id.", back: true },
        { at: [0, 1, 2, 3, 4], text: "Errors: provider overloaded → 503 + Retry-After, timeout → 504. Observe TTFT, p95, tokens and cost. Scale with workers/pods; nothing per-user in process memory." },
      ],
    },
    B(
      "The route is async def, with a Pydantic body: the messages, a model from an allowed set, and max tokens with an upper bound. Bad input is a 422 before anything costs money.",
      "Then two dependencies. Get current user verifies the JWT. Check budget reads the user's token count in Redis, and replies 429 when it's spent.",
      "If it's retrieval augmented, retrieval runs as async calls to the vector store, with their own timeout. Any CPU-heavy step, like local re-ranking, goes off the event loop.",
      "The model call uses one async client created in the lifespan, a semaphore to stay under the provider's limit, a timeout, and retries with backoff on transient errors only.",
      "The answer streams back as server sent events, stopping if the client disconnects. After the stream, record the actual token usage and save the conversation, tagged with the request id.",
      { say: "And around it: provider overloaded becomes 503 with retry after; a timeout becomes 504. Observe time to first token, p95 latency, tokens and cost. Scale with more workers or pods, keeping nothing per user in process memory. Every module of this lecture, in one endpoint.", tone: "key" },
    ),
  ),
  {
    kind: "sayit",
    q: "Design a chat endpoint in FastAPI.",
    lines: [
      "async def POST /chat with a bounded Pydantic body; JWT auth and a token budget as dependencies.",
      "Shared async clients from the lifespan; a semaphore, timeouts, retries on transient errors.",
      "Retrieval with its own timeout; CPU work off the loop.",
      "Stream tokens with SSE; stop on disconnect; record usage after.",
      "503/504 mapped cleanly; TTFT, p95, tokens and cost observed; stateless workers that scale out.",
    ],
    beats: B(
      { say: "Compressed into an answer you can say in forty seconds.", tone: "ask" },
      "An async def POST chat route with a bounded Pydantic body, and JWT auth and a token budget as dependencies.",
      "Shared async clients created in the lifespan, with a semaphore, timeouts, and retries on transient errors only.",
      "Retrieval with its own timeout, and any CPU work kept off the event loop.",
      "Tokens streamed with server sent events, stopping on disconnect, and usage recorded at the end.",
      { say: "Provider errors mapped cleanly to 503 and 504; time to first token, p95, tokens and cost observed; and stateless workers that scale out. Then the interviewer picks a layer, and you go deeper.", tone: "key" },
    ),
  },

  // ================================================================ close
  {
    kind: "drill",
    items: [
      { q: "What two libraries is FastAPI built on?", a: "Starlette and Pydantic" },
      { q: "Invalid body: what status, and does your code run?", a: "422, and no" },
      { q: "A def route runs where?", a: "In a thread pool" },
      { q: "requests.get() in async def does what?", a: "Blocks the event loop for every request" },
      { q: "Where do you load a model or create clients?", a: "In the lifespan" },
      { q: "Which middleware sees the request first?", a: "The last one added" },
      { q: "How do you swap the LLM client in tests?", a: "app.dependency_overrides" },
    ],
    beats: B(
      { say: "A last rapid-fire round. What two libraries is FastAPI built on?", hold: 3 },
      "Starlette and Pydantic.",
      { say: "An invalid body arrives. What status, and does your code run?", hold: 3 },
      "422, and no, it never runs.",
      { say: "A plain def route runs where?", hold: 3 },
      "In a thread pool.",
      { say: "Requests dot get inside async def does what?", hold: 3 },
      "It blocks the event loop, for every request on that worker.",
      { say: "Where do you load a model, or create shared clients?", hold: 3 },
      "In the lifespan, once at startup.",
      { say: "Which middleware sees the request first?", hold: 3 },
      "The last one added.",
      { say: "How do you swap the LLM client for a fake in tests?", hold: 3 },
      "App dot dependency overrides.",
    ),
  },
  {
    kind: "bullets",
    title: "Where to go from here",
    items: [
      { icon: "📖", text: "Each module page starts this lecture at its own part", sub: "rewatch exactly what you need" },
      { icon: "🧠", text: "Read the module's theory, then the answers", sub: "the same pictures and words as here" },
      { icon: "🎤", text: "Practise the design question out loud", sub: "then go one layer deeper on each step" },
    ],
    beats: B(
      "That's the whole FastAPI page. Each module page has a watch card that starts this lecture at that module.",
      "On each page, read the module's theory first, then the answers.",
      { say: "And practise the design question out loud, then pick any layer and go one level deeper. That's exactly how the interview will go. Good luck.", tone: "key" },
    ),
  },
];
