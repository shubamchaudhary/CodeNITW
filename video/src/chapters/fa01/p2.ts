import type { Scene } from "../../lib/types.ts";
import { asked, B, check, custom, sec } from "./h.ts";

// Part 2: async def vs def (and the blocking call that freezes everyone),
// lifespan and shared clients, streaming tokens, and long jobs.
export const p2: Scene[] = [
  // ------------------------------------------------------------ 4
  sec("4", "async def vs def, and the call that freezes everyone", "Topic four. Async def versus def. The most important FastAPI question for GenAI roles, because getting it wrong doesn't fail a test. It makes the whole server stall under load."),
  asked(
    "When do you write a route with async def, and when with plain def?",
    "async def runs on the event loop · def runs in a threadpool · never block inside async def",
    "The question, as it's usually asked.",
    { say: "When do you write a route with async def, and when with plain def?", tone: "ask" },
    "The answer hinges on one fact about where each kind runs. Let's watch three versions of the same route.",
  ),
  custom(
    "pylanes",
    {
      title: "async def + a blocking SDK call",
      sub: "async def ask(): reply = openai_sync.chat(...)  # no await",
      max: 9,
      rows: [
        { label: "Request 1", step: 0, bars: [{ s: 0, e: 4, kind: "block", text: "blocking LLM call: loop held" }] },
        { label: "Request 2", step: 0, bars: [{ s: 0, e: 4, kind: "frozen", text: "can't even start" }, { s: 4, e: 8, kind: "block" }] },
        { label: "Health check", step: 0, bars: [{ s: 0, e: 8, kind: "frozen", text: "times out: the pod gets restarted" }] },
      ],
      note: { step: 1, text: "Inside async def, every call must be awaited or moved off the loop. One blocking call stalls every request in the process." },
    },
    B(
      { say: "Version one, the disaster. The route is async def, but inside it calls a synchronous LLM SDK, with no await. That call holds the event loop for four seconds. Request two can't even start. And the health check times out, so your orchestrator decides the pod is dead and restarts it, mid traffic.", tone: "key" },
      "So the rule. Inside async def, every slow call must be awaited, or moved off the loop. One blocking call stalls every request in that process.",
    ),
  ),
  custom(
    "pylanes",
    {
      title: "Two correct versions",
      sub: "plain def runs in a threadpool · async def with an awaited async client shares the loop",
      max: 6,
      rows: [
        { label: "def → threadpool: req 1", step: 0, bars: [{ s: 0, e: 4, kind: "wait", text: "in worker thread 1" }] },
        { label: "def → threadpool: req 2", step: 0, bars: [{ s: 0.1, e: 4.1, kind: "wait", text: "in worker thread 2" }], done: "fine, up to ~40 threads" },
        { label: "async + await: req 1", step: 1, bars: [{ s: 0, e: 0.1, kind: "run" }, { s: 0.1, e: 4, kind: "wait", text: "await client.chat(...)" }] },
        { label: "async + await: req 2", step: 1, bars: [{ s: 0.1, e: 0.2, kind: "run" }, { s: 0.2, e: 4.1, kind: "wait", text: "await client.chat(...)" }], done: "fine, thousands" },
      ],
    },
    B(
      { say: "Version two: write the route as plain def. FastAPI runs plain def routes in a threadpool, so the blocking call blocks a worker thread, not the event loop. That works, up to the size of the pool, which is forty threads by default.", tone: "key" },
      "Version three: keep async def, and use an async client, awaited. Each request pauses at the await, and the loop serves the others. That scales to thousands of concurrent requests in one process.",
    ),
  ),
  {
    kind: "compare",
    title: "Which to write",
    cols: [
      { title: "async def", icon: "🔀", tone: "green", items: ["you await async libraries: httpx, the async OpenAI client, asyncpg", "best for many slow LLM calls", "NEVER: requests, time.sleep, a sync SDK, heavy CPU"] },
      { title: "def", icon: "🧵", tone: "cyan", items: ["you call blocking libraries", "FastAPI runs it in the threadpool for you", "fine at moderate concurrency"] },
      { title: "neither: offload", icon: "📤", tone: "amber", items: ["CPU work (embedding locally, parsing PDFs)", "a process pool, or a worker queue (topic 7)", "keeps the API responsive"] },
    ],
    footer: "Stuck with a blocking library inside async def? await run_in_threadpool(fn, ...) or await asyncio.to_thread(fn, ...).",
    beats: B(
      "So which to write. Async def when you await async libraries: httpx, the async OpenAI or Anthropic clients, asyncpg. That's the best choice for many slow LLM calls. And inside it, never requests, never time dot sleep, never a synchronous SDK, never heavy CPU.",
      "Plain def when you have to call blocking libraries. FastAPI puts it in the threadpool for you. Fine at moderate concurrency.",
      "And CPU heavy work, like running an embedding model locally or parsing PDFs, should leave the request path entirely: a process pool, or a worker queue, which is topic seven.",
      { say: "And if you're stuck with one blocking call inside async def, await run in threadpool, or asyncio dot to thread. The blocking part moves to a thread and the loop stays free.", tone: "key" },
    ),
  },
  check({
    topic: "async routes",
    q: "Under load, the service's p99 latency explodes and health checks fail, but CPU is at 10%. The code has async def routes calling requests.post(LLM_URL). What's happening, and what are two fixes?",
    say: "Under load, the service's tail latency explodes and health checks fail, but CPU is at ten percent. The code has async def routes calling requests dot post to the LLM. What's happening, and what are two fixes?",
    a: "requests.post blocks the event loop, so every request (and the health check) waits behind whichever call is in progress. Fix: an async client awaited (httpx.AsyncClient), or make the route plain def / wrap the call in asyncio.to_thread.",
    aSay: "Requests dot post is blocking, so inside async def it holds the event loop, and every other request, including the health check, waits behind whichever LLM call is in progress. Low CPU is the giveaway: nothing is computing, everything is queued. Fixes: switch to an async client and await it, like httpx async client, or make the route a plain def so it runs in the threadpool, or wrap the call in asyncio dot to thread.",
    hold: 12,
  }),

  // ------------------------------------------------------------ 5
  sec("5", "Lifespan: create expensive things once", "Topic five. Lifespan. What to create once when the app starts, and why creating an HTTP client per request is a quiet performance bug."),
  {
    kind: "code",
    title: "The lifespan: startup, yield, shutdown",
    lang: "python",
    code: `from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http = httpx.AsyncClient(timeout=30)     # one connection pool
    app.state.llm = LLMClient(http=app.state.http)
    app.state.embedder = load_embedding_model()         # big: load once
    yield                                              # the app serves here
    await app.state.http.aclose()                      # graceful shutdown

app = FastAPI(lifespan=lifespan)`,
    highlight: [[3, 4], [5, 7], [8, 8], [9, 9], [11, 11]],
    beats: B(
      "The lifespan is an async context manager, like the timer from the Python lecture, handed to the app.",
      "Code before the yield runs once, at startup: create one HTTP client with its connection pool, the LLM client on top of it, and load the embedding model, which can take seconds and gigabytes.",
      "At the yield, the app starts serving requests.",
      "Code after the yield runs at shutdown: close the client so connections end cleanly.",
      "Hand it to the app. This replaced the old on startup and on shutdown events.",
    ),
  },
  {
    kind: "trap",
    myth: "Creating a new HTTP client inside each request is cleaner.",
    truth: "Every new client opens new TCP and TLS connections: tens of milliseconds per call, and sockets that pile up.",
    why: "One shared client per process reuses its connection pool. Create it in lifespan; hand it out with a dependency.",
    beats: B(
      "And the quiet bug it prevents.",
      { say: "Creating a new HTTP client per request looks clean, but each new client opens new TCP and TLS connections to the model provider. That's tens of milliseconds per call, and under load, thousands of sockets.", tone: "key" },
      "One shared client per process reuses its connection pool. Create it in the lifespan, and hand it to routes with a dependency, like the get LLM function we wrote in topic three.",
    ),
  },
  check({
    topic: "lifespan",
    q: "Where should each go: (1) loading a 400 MB embedding model, (2) the current user's database session, (3) the httpx client to the LLM provider?",
    say: "Where should each one go? One: loading a four hundred megabyte embedding model. Two: the current user's database session. Three: the httpx client to the LLM provider.",
    a: "(1) lifespan, once. (2) a yield dependency, per request. (3) lifespan, shared, handed out through a dependency.",
    aSay: "One, the lifespan, loaded once at startup. Two, a yield dependency, because a session belongs to one request and must be closed after it. Three, the lifespan as well, one shared client per process, handed to routes through a dependency.",
  }),

  // ------------------------------------------------------------ 6
  sec("6", "Streaming tokens to the user", "Topic six. Streaming. Every chat UI shows the answer as it's generated. Two write-ups asked how to stream LLM tokens from FastAPI, and the follow-ups are where people struggle."),
  {
    kind: "seq",
    title: "POST /chat: tokens flow as they're made",
    actors: [
      { id: "b", name: "Browser", icon: "🧑‍💻" },
      { id: "api", name: "FastAPI", icon: "⚡", tone: "amber" },
      { id: "llm", name: "LLM provider", icon: "🤖", tone: "green" },
    ],
    msgs: [
      { from: "b", to: "api", label: "POST /chat", step: 0 },
      { from: "api", to: "llm", label: "stream=True", step: 1 },
      { from: "llm", to: "api", label: "\"Our\" \"refund\" …", step: 2, tone: "green", dash: true },
      { from: "api", to: "b", label: "data: Our ⏎⏎  data: refund ⏎⏎", step: 3, tone: "amber", dash: true },
      { from: "api", to: "b", label: "data: [DONE]", step: 4 },
    ],
    note: { step: 5, text: "The user sees the first words in ~300 ms instead of waiting 8 s for the whole answer." },
    beats: B(
      "The flow. The browser posts a message to the chat endpoint.",
      "FastAPI calls the model with streaming turned on.",
      "The model sends back small chunks of text as it generates them.",
      { say: "And FastAPI forwards each chunk to the browser immediately, in server sent events format: a line starting with data, then a blank line. One HTTP response, held open, written in pieces.", tone: "key", term: { word: "SSE", meaning: "server-sent events: one long HTTP response the server writes in pieces" } },
      "At the end, a done marker, so the client knows the answer is complete.",
      "The point is the first words. The user sees them in about three hundred milliseconds, instead of staring at a spinner for eight seconds.",
    ),
  },
  {
    kind: "code",
    title: "StreamingResponse with an async generator",
    lang: "python",
    code: `@app.post("/chat")
async def chat(body: ChatIn, request: Request, llm = Depends(get_llm)):
    async def events():
        try:
            async for token in llm.stream(body.messages):
                if await request.is_disconnected():
                    break                              # stop paying for tokens
                yield f"data: {json.dumps({'t': token})}\\n\\n"
            yield "data: [DONE]\\n\\n"
        finally:
            await llm.close_stream()                    # cancel upstream too

    return StreamingResponse(events(), media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})`,
    highlight: [[3, 5], [8, 9], [6, 7], [10, 11], [13, 14]],
    beats: B(
      "The code is the async generator from the Python lecture. An inner async def with yield. It loops over the model's stream with async for.",
      "Each token is yielded as one server sent event: data, a little JSON, and a blank line. Then a done marker.",
      { say: "Now the follow-up that separates people. What if the user closes the tab halfway? Without a check, you keep reading the model's stream to the end, and you keep paying for tokens nobody will see. So check whether the client disconnected, and stop.", tone: "key" },
      "And in a finally, close the upstream stream, so the provider stops generating too. When the client goes away, Starlette also cancels the generator, and finally is what makes the cleanup reliable either way.",
      { say: "Return a streaming response with the event stream media type. And the two headers matter in production: no cache, and X accel buffering no, which tells an Nginx proxy not to buffer. A buffering proxy is the classic reason streaming works locally and arrives all at once in production.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "SSE or WebSocket?",
    cols: [
      { title: "SSE (StreamingResponse)", icon: "📡", tone: "green", items: ["server → client only", "plain HTTP: auth headers, proxies, retries just work", "the default for LLM answers"] },
      { title: "WebSocket", icon: "🔌", tone: "cyan", items: ["both directions, any time", "voice, live collaboration, 'stop generating' mid-stream", "stateful connections: harder to scale and balance"] },
    ],
    beats: B(
      "And the comparison they'll ask for. Server sent events go one way, server to client, over plain HTTP, so authentication headers, proxies and retries just work. For streaming an LLM answer, it's the default.",
      { say: "A WebSocket goes both ways at any time. You pick it when the client must talk during the stream: voice, live collaboration, or a stop button that interrupts generation. The cost is stateful connections, which are harder to scale and load balance.", tone: "key" },
    ),
  },
  check({
    topic: "streaming",
    q: "Streaming works on your laptop, but in production the whole answer arrives at once after 8 s. Name the most likely cause and the fix.",
    say: "Streaming works on your laptop, but in production the whole answer arrives at once after eight seconds. What's the most likely cause, and the fix?",
    a: "A proxy in between (Nginx, a load balancer, a CDN) is buffering the response. Disable buffering for that route: X-Accel-Buffering: no, proxy_buffering off, and Cache-Control: no-cache.",
    aSay: "A proxy in between, Nginx, a load balancer or a CDN, is buffering the response and only forwarding it when it's complete. Turn buffering off for that route: the X accel buffering no header, proxy buffering off in Nginx, and cache control no cache.",
  }),
  {
    kind: "sayit",
    q: "How do you stream LLM tokens from FastAPI?",
    lines: [
      "Call the model with streaming on and iterate it in an async generator.",
      "Yield each token as a server-sent event and return a StreamingResponse with text/event-stream.",
      "Stop on client disconnect and close the upstream stream, so you stop paying for tokens.",
      "Disable proxy buffering; use a WebSocket only if the client must talk mid-stream.",
    ],
    beats: B(
      { say: "Model answer. How do you stream LLM tokens from FastAPI?", tone: "ask" },
      "I call the model with streaming on, and iterate its chunks inside an async generator.",
      "Each token is yielded as a server sent event, and the route returns a streaming response with the text event stream media type.",
      "If the client disconnects, I stop and close the upstream stream, so we stop paying for tokens.",
      { say: "In production, I disable proxy buffering. And I'd use a WebSocket only if the client needs to talk during the stream.", tone: "key" },
    ),
  },

  // ------------------------------------------------------------ 7
  sec("7", "Long jobs: don't make the request wait", "Topic seven. Long jobs. Someone uploads five hundred PDFs to embed. That takes twenty minutes. What does the API do?"),
  custom(
    "pypipe",
    {
      title: "POST /ingest: accept now, work later",
      stages: [
        { name: "POST /ingest", icon: "📥", sub: "files saved to storage" },
        { name: "Queue", icon: "📬", sub: "Redis / SQS: job 812" },
        { name: "Worker", icon: "🛠️", sub: "Celery / Arq: parse, chunk, embed" },
        { name: "Vector DB", icon: "🗄️", sub: "chunks + embeddings" },
        { name: "GET /jobs/812", icon: "🔎", sub: "status, progress" },
      ],
      steps: [
        { at: 0, text: "The API saves the files and returns at once: 202 Accepted, with a job id. No request waits 20 minutes." },
        { at: 1, text: "The job goes onto a queue, which survives API restarts and deploys." },
        { at: 2, text: "Separate worker processes take jobs, with retries and their own CPU, so the API stays fast." },
        { at: 3, text: "Results land in the vector store; progress is written as the worker goes." },
        { at: 4, back: true, text: "The client polls GET /jobs/{id} (or gets a webhook, or an SSE progress stream) until it's done." },
      ],
    },
    B(
      { say: "The pattern. The ingest endpoint saves the files and returns at once, with status two oh two, accepted, and a job id. No HTTP request ever waits twenty minutes.", tone: "key" },
      "The job goes onto a queue, like Redis or SQS, which survives restarts and deploys of the API.",
      "Separate worker processes, with Celery or Arq, take jobs off the queue: parse, chunk, embed, with retries. They use their own CPU, so the API stays responsive.",
      "Results go into the vector database, and the worker writes progress as it goes.",
      "The client polls a status endpoint with the job id, or receives a webhook, or a progress stream, until the job is done.",
    ),
  ),
  {
    kind: "compare",
    title: "BackgroundTasks vs a real queue",
    cols: [
      { title: "BackgroundTasks", icon: "⏱️", tone: "cyan", items: ["runs after the response, in the same process", "lost if the process restarts", "no retries, no progress, shares the API's CPU", "for small things: an email, a log, a cache warm-up"] },
      { title: "Queue + workers", icon: "🏭", tone: "green", items: ["durable: survives restarts and deploys", "retries, progress, scale workers separately", "Celery, RQ, Arq, Dramatiq; Redis, SQS, RabbitMQ", "for ingestion, batch embedding, evals"] },
    ],
    beats: B(
      "FastAPI has a built-in option, BackgroundTasks, and the question is when it's enough. It runs a function after the response is sent, in the same process. If that process restarts, the work is lost. No retries, no progress, and it competes with your requests for CPU. Good for small things: sending an email, writing a log.",
      { say: "For anything long or important, a queue with workers: durable across restarts, with retries, progress, and workers you scale separately from the API. Ingestion, batch embedding and evaluation runs belong here.", tone: "key" },
    ),
  },
  check({
    topic: "long jobs",
    q: "A teammate embeds uploaded PDFs with BackgroundTasks. A deploy restarts the pods mid-way. What happens, and what would you change?",
    say: "A teammate embeds uploaded PDFs using BackgroundTasks. A deploy restarts the pods halfway through. What happens, and what would you change?",
    a: "The in-progress work is simply lost: background tasks live in the process's memory, with no record and no retry. Use a durable queue with workers, a job id (202) and a status endpoint.",
    aSay: "The work in progress is lost. Background tasks live only in that process's memory, so there's no record that they existed and nothing retries them. I'd move it to a durable queue with worker processes, return two oh two with a job id, and expose a status endpoint.",
  }),
];
