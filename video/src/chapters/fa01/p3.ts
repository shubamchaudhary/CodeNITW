import type { Scene } from "../../lib/types.ts";
import { B, check, custom, sec } from "./h.ts";

// Part 3: errors and middleware, security and per-user limits, testing,
// production, then the drill, the design answer and the close.
export const p3: Scene[] = [
  // ------------------------------------------------------------ 8
  sec("8", "Errors and middleware", "Topic eight. Errors and middleware. What the client should see when the model provider fails, and code that runs around every request."),
  {
    kind: "code",
    title: "Turn provider failures into honest HTTP answers",
    lang: "python",
    code: `@app.exception_handler(ProviderRateLimited)
async def provider_busy(request: Request, exc: ProviderRateLimited):
    return JSONResponse(
        status_code=503,                              # our upstream is busy
        headers={"Retry-After": str(exc.retry_after)},
        content={"error": "model_busy", "request_id": request.state.rid},
    )

@app.post("/ask")
async def ask(body: AskIn, user = Depends(get_user)):
    if await budget.exhausted(user.id):
        raise HTTPException(429, "daily token budget used")   # the user's limit
    ...`,
    highlight: [[1, 2], [3, 7], [9, 12]],
    beats: B(
      "Without a plan, a provider error escapes as a five hundred with a stack trace. Instead, register an exception handler for your own provider error class.",
      { say: "It returns a clean JSON error with the right status. When the model provider is rate limiting us, that's our service being temporarily unable to serve: five oh three, with a retry after header, and the request id so support can find the logs.", tone: "key" },
      "Compare that with the user exceeding their own daily token budget. That's four twenty nine, too many requests, raised directly with HTTP exception. Same root idea, rate limiting, but a different party is responsible, so a different status.",
    ),
  },
  custom(
    "pyonion",
    {
      title: "Middleware wraps every request",
      sub: "app.add_middleware(...): the LAST one added is the OUTERMOST",
      core: "the route",
      layers: [
        { name: "timing", does: "measures latency; logs route, status, tokens used", tone: "green" },
        { name: "request_id", does: "sets request.state.rid; adds X-Request-ID to the response", tone: "amber" },
        { name: "CORS", does: "answers browser preflights; added last so it's outermost", tone: "blue" },
      ],
      call: "request → CORS → request_id → timing → route",
      back: "← response passes back out through each layer",
    },
    B(
      "Middleware is the decorator onion again, around every request instead of one function.",
      "The innermost here, timing: it measures latency and logs the route, the status and the tokens used.",
      "Around it, request id: it gives every request an id, stores it on request state, and adds it to the response headers, so one id ties together the client error, the API log and the provider call.",
      { say: "Outermost, CORS, so browser preflight requests are answered before anything else runs. And the rule interviewers like: with add middleware, the last one added becomes the outermost, and runs first.", tone: "key" },
      "A request goes in through every layer to the route, and the response comes back out through each one in reverse.",
    ),
  ),
  check({
    topic: "errors",
    q: "The LLM provider is down for everyone. Should /ask return 429, 500, 503 or 504? And what if one user has burned through their own quota?",
    say: "The LLM provider is down for everyone. Should ask return four twenty nine, five hundred, five oh three, or five oh four? And what if one user has used up their own quota?",
    a: "Provider down or overloaded: 503 Service Unavailable, with Retry-After (504 if we gave up waiting on it). One user over their quota: 429 Too Many Requests. 500 means our own bug.",
    aSay: "Provider down or overloaded: five oh three, service unavailable, with a retry after header. Five oh four if we timed out waiting for it. A user over their own quota: four twenty nine, too many requests. And five hundred is for our own bugs, which this isn't.",
  }),

  // ------------------------------------------------------------ 9
  sec("9", "Security and per-user limits", "Topic nine. Who is calling, and how much may they spend. Four write-ups asked about JWT authentication in FastAPI, and for LLM APIs, rate limits are the follow-up."),
  {
    kind: "code",
    title: "JWT auth and roles, as dependencies",
    lang: "python",
    code: `oauth2 = OAuth2PasswordBearer(tokenUrl="token")   # reads "Authorization: Bearer ..."

async def get_user(token: str = Depends(oauth2)) -> User:
    try:
        claims = jwt.decode(token, PUBLIC_KEY, algorithms=["RS256"],
                            audience="askdocs")          # checks signature + exp
    except jwt.InvalidTokenError:
        raise HTTPException(401, "invalid token",
                            headers={"WWW-Authenticate": "Bearer"})
    return User(id=claims["sub"], roles=claims.get("roles", []))

def require(role: str):
    def check(user: User = Depends(get_user)) -> User:
        if role not in user.roles:
            raise HTTPException(403, "forbidden")
        return user
    return check

@app.post("/ingest")
async def ingest(files: list[UploadFile], user = Depends(require("editor"))): ...`,
    highlight: [[1, 1], [3, 6], [7, 9], [12, 17], [19, 20]],
    beats: B(
      "Authentication is just a dependency. OAuth two password bearer reads the token from the authorization header and documents it in the API docs.",
      { say: "Get user decodes the JWT, which verifies the signature and the expiry, and checks the audience, with an explicit list of allowed algorithms. Never decode without verifying.", tone: "key" },
      "A bad or expired token raises four oh one, with the WWW authenticate header the standard expects.",
      "Roles are a dependency factory: require of a role returns a dependency that needs the user and raises four oh three if the role is missing. A closure, from the Python lecture.",
      "So protecting the ingest route is one parameter: Depends of require editor. Four oh one means we don't know who you are; four oh three means we know, and the answer is no.",
    ),
  },
  {
    kind: "bullets",
    title: "Per-user limits for an LLM API",
    firstItemStep: 1,
    items: [
      { icon: "🔢", text: "Limit tokens, not just requests", sub: "one request can cost 50 tokens or 50,000" },
      { icon: "🧮", text: "Count in Redis, shared by every worker", sub: "INCRBY user:42:tokens:2026-11-11 · EXPIRE 1 day" },
      { icon: "🪣", text: "Token bucket for bursts, a daily budget for cost", sub: "check before calling the model, record actual usage after" },
      { icon: "🚦", text: "Over the limit: 429 with Retry-After", sub: "and a global semaphore so the provider's limit is never exceeded" },
    ],
    beats: B(
      "Then limits. For an LLM API, three things are different.",
      { say: "Limit tokens, not just requests. One request can cost fifty tokens or fifty thousand, so a requests per minute limit alone doesn't protect your bill.", tone: "key" },
      "Count in Redis, not in process memory, because you run several workers and they must share one count. Increment the user's counter for today by the tokens used, with a one day expiry.",
      "A token bucket smooths bursts, and a daily budget caps cost. Check before calling the model, and record the actual usage after, since you only know the output length at the end.",
      "Over the limit, return four twenty nine with retry after. And separately, a global semaphore keeps the whole service under the provider's own limit.",
    ),
  },
  check({
    topic: "auth",
    q: "A valid token for a user without the 'editor' role calls POST /ingest. 401 or 403?",
    say: "A valid token, for a user without the editor role, calls the ingest endpoint. Four oh one, or four oh three?",
    options: ["401 Unauthorized", "403 Forbidden", "404 Not Found", "422 Unprocessable Entity"],
    oSay: ["four oh one, unauthorized", "four oh three, forbidden", "four oh four, not found", "four twenty two, unprocessable entity"],
    answer: 1,
    a: "403. The token proved who they are (authentication passed); they just aren't allowed (authorisation failed).",
    aSay: "B, four oh three. The token proved who they are, so authentication passed. They just aren't allowed to do this, which is an authorisation failure. Four oh one is for when we don't know who you are.",
  }),

  // ------------------------------------------------------------ 10
  sec("10", "Testing without calling the model", "Topic ten. Testing. How do you test an LLM endpoint without paying for tokens, and without flaky answers?"),
  {
    kind: "code",
    title: "Override the dependency, test the API for real",
    lang: "python",
    code: `class FakeLLM:
    async def complete(self, prompt): return '{"answer": "30 days", "sources": ["policy.pdf"]}'
    async def stream(self, msgs):
        for t in ["30", " days"]: yield t

def test_ask():
    app.dependency_overrides[get_llm] = lambda: FakeLLM()
    with TestClient(app) as client:            # 'with' also runs the lifespan
        r = client.post("/ask", json={"question": "Refund window?"})
    assert r.status_code == 200
    assert r.json()["sources"] == ["policy.pdf"]
    app.dependency_overrides.clear()

def test_bad_input():
    with TestClient(app) as client:
        assert client.post("/ask", json={"question": ""}).status_code == 422`,
    highlight: [[1, 4], [7, 7], [8, 9], [10, 12], [14, 16]],
    beats: B(
      "A fake model: a class with the same methods, returning fixed answers instantly. Duck typing again: it doesn't inherit from anything.",
      { say: "Then dependency overrides: wherever a route depends on get LLM, use the fake instead. The rest of the app, validation, auth, error handling, runs for real.", tone: "key" },
      "Test client sends real requests through the whole stack, in memory. Use it as a context manager. That also runs the lifespan, which people forget, and then wonder why app state is empty.",
      "Assert on the status and the JSON. And clear the overrides afterwards, so the fake doesn't leak into other tests.",
      "And test the edges: an empty question must give four twenty two. For async tests, httpx async client with an ASGI transport does the same thing with await.",
    ),
  },
  check({
    topic: "testing",
    q: "In a test, app.state.llm is missing and the route crashes with AttributeError, though it works in production. You wrote client = TestClient(app). Why?",
    say: "In a test, app dot state dot llm is missing, and the route crashes with an attribute error, though it works in production. You wrote client equals test client of app. Why?",
    a: "Without 'with TestClient(app) as client:', the lifespan never runs, so nothing set app.state.llm. Use it as a context manager (or override get_llm).",
    aSay: "Because the test client was created without the with statement, the lifespan never ran, so nothing ever set app state llm. Use test client as a context manager, or override the get LLM dependency with a fake.",
  }),

  // ------------------------------------------------------------ 11
  sec("11", "Production: workers, timeouts, observability", "Topic eleven. Production. How you run it, how it fails safely, and what you watch on a dashboard."),
  {
    kind: "bullets",
    title: "Running FastAPI in production",
    firstItemStep: 1,
    items: [
      { icon: "🧮", text: "Processes: one event loop each", sub: "uvicorn --workers N, or gunicorn with uvicorn workers; on Kubernetes, often 1 per pod and scale pods" },
      { icon: "⏱️", text: "Timeouts nested: LLM call < route < proxy", sub: "30 s < 45 s < 60 s: the innermost gives up first, with a clean error" },
      { icon: "❤️", text: "Liveness vs readiness", sub: "alive = the loop answers; ready = the model and clients are loaded" },
      { icon: "🐳", text: "Docker: slim image, non-root, secrets from env", sub: "pydantic-settings reads them, validated at startup" },
    ],
    beats: B(
      "Running it. Four things to say.",
      "Processes: one event loop per process, so use several. Uvicorn with workers, or gunicorn managing uvicorn workers. On Kubernetes it's common to run one worker per pod and scale the pods instead.",
      { say: "Timeouts, nested: the LLM call times out before the route, and the route before the proxy. Say thirty, forty five, sixty seconds. The innermost layer gives up first, so it can return a clean error instead of the proxy cutting the connection.", tone: "key" },
      "Health checks: liveness means the event loop answers. Readiness means the model and clients are loaded, so traffic isn't sent to a pod that's still starting.",
      "And Docker: a slim image, a non root user, secrets from environment variables, read and validated at startup by pydantic settings.",
    ),
  },
  {
    kind: "numbers",
    title: "What a GenAI API dashboard shows",
    items: [
      { value: "TTFT", label: "Time to first token", sub: "what the user feels when streaming" },
      { value: "p95", label: "Total latency", sub: "per route, per model" },
      { value: "tokens", label: "In and out per request", sub: "and the cost they add up to" },
      { value: "errors", label: "By provider and type", sub: "429s, timeouts, invalid JSON" },
    ],
    footer: "Every log line and trace carries the request id, so one failed answer can be followed end to end.",
    beats: B(
      "And what you watch. Four numbers make a GenAI API dashboard.",
      { say: "Time to first token. When you stream, that's what the user actually feels.", tone: "key" },
      "Total latency, at the ninety fifth percentile, per route and per model.",
      "Tokens in and out per request, and the cost they add up to.",
      "And errors by provider and type: rate limits, timeouts, invalid JSON from the model.",
      { say: "All tied together by the request id from our middleware, so a single bad answer can be followed from the browser to the provider and back.", tone: "key" },
    ),
  },
  check({
    topic: "production",
    q: "Users say the chat 'feels slow', but the average total latency is unchanged at 6 s. Which metric would you look at first, and why?",
    say: "Users say the chat feels slow, but the average total latency is unchanged at six seconds. Which metric would you look at first, and why?",
    a: "Time to first token (and its p95). With streaming, perceived speed is how soon words appear; something before generation (retrieval, a queue, a cold client) may have grown.",
    aSay: "Time to first token, and its ninety fifth percentile rather than the average. With streaming, the perceived speed is how soon the first words appear. Something that happens before generation, like retrieval, waiting for a semaphore permit, or a cold connection, may have grown while the total stayed flat.",
  }),

  // ------------------------------------------------------------ finale
  {
    kind: "drill",
    items: [
      { q: "WSGI vs ASGI?", a: "a thread per request vs async tasks on an event loop" },
      { q: "FastAPI is built on…", a: "Starlette (ASGI) + Pydantic + type hints" },
      { q: "Bad request body →", a: "422, before your function runs" },
      { q: "response_model does…", a: "validates and filters what goes out" },
      { q: "A yield dependency is for…", a: "setup before, cleanup after: DB sessions" },
      { q: "Plain def routes run…", a: "in a threadpool (~40 threads)" },
      { q: "requests.get inside async def?", a: "blocks the loop: every request waits" },
      { q: "Create the HTTP client…", a: "once, in lifespan; share it" },
      { q: "Stream tokens with…", a: "StreamingResponse + async generator, SSE" },
      { q: "Client disconnects mid-stream?", a: "stop and close the upstream stream" },
      { q: "500 PDFs to embed?", a: "202 + job id + a queue and workers" },
      { q: "Test without the real model?", a: "app.dependency_overrides" },
    ],
    beats: B(
      { say: "Rapid fire. Answer before I do. W S G I versus A S G I?", hold: 3 },
      "A thread per request, versus async tasks on an event loop.",
      { say: "FastAPI is built on what?", hold: 3 },
      "Starlette, Pydantic, and your type hints.",
      { say: "A bad request body gives?", hold: 3 },
      "Four twenty two, before your function runs.",
      { say: "What does response model do?", hold: 3 },
      "It validates and filters what goes out.",
      { say: "A yield dependency is for?", hold: 3 },
      "Setup before and cleanup after. Database sessions.",
      { say: "Plain def routes run where?", hold: 3 },
      "In a threadpool, about forty threads by default.",
      { say: "Requests dot get inside async def?", hold: 3 },
      "It blocks the loop, so every request waits.",
      { say: "Where do you create the HTTP client?", hold: 3 },
      "Once, in the lifespan, and share it.",
      { say: "Stream tokens with?", hold: 3 },
      "A streaming response and an async generator, as server sent events.",
      { say: "The client disconnects mid stream?", hold: 3 },
      "Stop, and close the upstream stream.",
      { say: "Five hundred PDFs to embed?", hold: 3 },
      "Two oh two, a job id, and a queue with workers.",
      { say: "Test without the real model?", hold: 3 },
      "App dot dependency overrides.",
    ),
  },
  {
    kind: "sayit",
    q: "\"Design the chat endpoint of a GenAI app in FastAPI.\"",
    lines: [
      "POST /chat, async def, with a Pydantic request model and JWT auth as a dependency.",
      "One shared async LLM client from lifespan; a semaphore and per-call timeouts.",
      "Check the user's token budget in Redis first; record actual usage after.",
      "Stream tokens as SSE from an async generator; stop on disconnect.",
      "Map provider failures to 503 or 504, and log TTFT, tokens and the request id. Long ingestion goes to a queue.",
    ],
    beats: B(
      { say: "And the design question that ties it all together. Design the chat endpoint of a GenAI app in FastAPI. Here's an answer that uses every topic.", tone: "ask" },
      "Post chat, an async def route, with a Pydantic request model, and JWT authentication as a dependency.",
      "One shared async LLM client created in the lifespan, a semaphore to stay under the provider's limit, and a timeout on every call.",
      "Before calling the model, check the user's token budget in Redis, and record the actual usage afterwards.",
      "Stream the tokens as server sent events from an async generator, and stop if the client disconnects.",
      { say: "Map provider failures to five oh three or five oh four, and log time to first token, tokens used and the request id. Anything long, like ingestion, goes to a queue with workers.", tone: "key" },
    ),
  },
  {
    kind: "big",
    tone: "idea",
    lead: "That's FastAPI",
    text: "Declare what you need. Validate at the edges. Never block the loop. Stream what the user is waiting for.",
    after: "every question tonight is one of those four sentences, applied",
    beats: B(
      "That's FastAPI for GenAI.",
      { say: "Four sentences carry it. Declare what you need, and let dependencies build it. Validate at the edges. Never block the loop. And stream what the user is waiting for.", tone: "key" },
      "Every question in this lecture is one of those four sentences, applied. Go and answer them out loud.",
    ),
  },
];
