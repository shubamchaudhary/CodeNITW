import type { Scene } from "../../lib/types.ts";
import { B, check, custom, q, sec } from "./h.ts";

// Part 2: module 5 (async), module 6 (structure and lifecycle) and module 7
// (security).
export const p2: Scene[] = [
  // ================================================================ module 5
  sec("5", "Async in FastAPI", "Module five. Async in FastAPI. Three questions about the single most common way to make a FastAPI service slow: blocking the event loop."),
  custom(
    "pyloop",
    {
      title: "The idea: async def runs on the loop, def runs in a thread pool",
      sub: "one Uvicorn worker",
      runLabel: "EVENT LOOP",
      steps: [
        { running: "async def ask()", ready: ["async def health()", "async def list_docs()"], waiting: [], note: "async def routes run directly on the event loop: they must await, never block" },
        { running: "async def health()", ready: ["async def list_docs()"], waiting: ["ask: await llm()"], note: "while ask awaits the model, the loop serves other requests" },
        { running: "async def list_docs()", ready: [], waiting: ["ask: await llm()", "def report(): in a thread"], note: "a plain def route is sent to a thread pool (40 threads by default), so blocking code there can't freeze the loop" },
      ],
    },
    B(
      "Here's the idea of this module. Each Uvicorn worker has one event loop. A route defined with async def runs directly on that loop. So it must await its I/O, and never block.",
      "While ask awaits the model's reply, the loop is free to serve the health check, and every other request.",
      { say: "A route defined with plain def is treated differently. FastAPI runs it in a thread pool, forty threads by default, so the blocking code inside it can't freeze the loop. That one difference decides the next three answers.", tone: "key" },
    ),
  ),

  // ---- Q16
  q(16, 1, "What is the difference between async def and def routes in FastAPI?", "where each one runs, and how to choose", "Question sixteen. What's the difference between async def and def routes in FastAPI?", "Where each one runs, and the rule for choosing."),
  {
    kind: "compare",
    title: "async def vs def",
    cols: [
      { title: "async def", tone: "green", items: ["Runs on the event loop", "Use when everything inside is async: await httpx, asyncpg, redis.asyncio", "Thousands of concurrent waits, cheaply", "One blocking call stalls the whole worker"] },
      { title: "def", tone: "blue", items: ["Runs in a thread pool (40 threads)", "Use with blocking libraries: requests, a sync DB driver, a sync SDK", "Safe, but limited by the pool size", "The 41st slow request waits for a free thread"] },
    ],
    footer: "Async libraries inside → async def. Blocking libraries inside → def (or to_thread).",
    beats: B(
      "An async def route runs on the event loop. Use it when everything inside is async: an async HTTP client, an async database driver, async Redis. Then one worker can handle thousands of concurrent requests that are waiting. But one blocking call inside it stalls the whole worker.",
      "A def route runs in the thread pool. Use it when you call blocking libraries, like requests, a synchronous database driver, or a synchronous SDK. It's safe, but limited by the pool: with forty threads, the forty first slow request waits for a thread to free up.",
      { say: "So the rule: if the libraries inside are async, async def. If they're blocking, plain def, or await them with to thread. The worst choice is async def with blocking calls inside.", tone: "key" },
    ),
  },

  // ---- Q17
  q(17, null, "What happens if you call blocking code inside an async endpoint, and how do you fix it?", "the whole worker freezes; four fixes", "Question seventeen. What happens if you call blocking code inside an async endpoint, and how do you fix it?", "What the symptom looks like in production, and the fixes."),
  custom(
    "pylanes",
    {
      title: "One blocking call in async def: everyone on that worker waits",
      sub: "a sync LLM SDK call takes 3 s inside async def",
      max: 4,
      rows: [
        { label: "/ask (sync SDK)", step: 0, bars: [{ s: 0, e: 3, kind: "block", text: "client.complete() blocks" }] },
        { label: "/health", step: 1, bars: [{ s: 0.2, e: 3, kind: "frozen", text: "stuck" }, { s: 3, e: 3.1, kind: "run" }] },
        { label: "/docs", step: 1, bars: [{ s: 0.5, e: 3, kind: "frozen", text: "stuck" }, { s: 3.1, e: 3.3, kind: "run" }] },
        { label: "fixed: await to_thread()", step: 2, bars: [{ s: 0, e: 3, kind: "wait", text: "in a thread; loop free" }] },
      ],
      note: { step: 2, text: "Fixes: an async client · plain def · await asyncio.to_thread(fn) · a process pool or queue for CPU work", tone: "green" },
    },
    B(
      "Here's an async def route calling a synchronous LLM SDK, which takes three seconds. That call never awaits, so the event loop can't switch to anything else.",
      "So every other request on that worker, even the health check, is stuck for three seconds. In production, the symptom is latency spiking across all endpoints together, and health checks failing under load, even though CPU is low.",
      { say: "The fixes. Use the async version of the client. Or make the route a plain def. Or await asyncio dot to thread on the blocking call. And for heavy CPU work, a process pool, or a job queue with separate workers.", tone: "key" },
    ),
  ),

  // ---- Q18
  q(18, null, "How do you call external APIs efficiently from FastAPI?", "one shared async client, timeouts, limits, concurrency", "Question eighteen. How do you call external APIs efficiently from FastAPI?", "One shared client created at startup, timeouts everywhere, and calls made concurrently but capped."),
  {
    kind: "code",
    title: "One shared AsyncClient, made at startup",
    lang: "python",
    code: `@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http = httpx.AsyncClient(
        timeout=httpx.Timeout(10, connect=3),
        limits=httpx.Limits(max_connections=100),
    )
    yield
    await app.state.http.aclose()

async def enrich(ids, http):
    sem = asyncio.Semaphore(10)
    async def one(i):
        async with sem:
            return (await http.get(f"/items/{i}")).json()
    return await asyncio.gather(*(one(i) for i in ids))`,
    highlight: [[1, 8], [10, 15]],
    beats: B(
      "One shared async client for the whole app, created at startup in the lifespan and closed at shutdown, so connections are pooled and reused. With a timeout on every call, and a limit on connections. Creating a new client per request means a new TCP and TLS handshake every time.",
      { say: "And independent calls run concurrently, with gather or a TaskGroup, capped by a semaphore. Plus retries with backoff on transient errors, and a circuit breaker if a dependency is down, so you fail fast instead of piling up waiting requests.", tone: "key" },
    ),
  },
  check({
    topic: "blocking",
    q: "An async def route calls requests.get(). Under load, /health starts timing out. Why?",
    say: "An async def route calls requests dot get. Under load, the health check starts timing out. Why?",
    a: "requests is blocking: inside async def it stalls the event loop, so every request on that worker waits, health checks included. Use httpx.AsyncClient, def, or to_thread.",
    aSay: "Because requests is blocking. Inside async def, it stalls the event loop, so every request on that worker waits, health checks included. Use an async client like httpx, make the route a plain def, or await to thread.",
  }),

  // ================================================================ module 6
  sec("6", "Application structure and lifecycle", "Module six. Application structure and lifecycle. How a bigger app is organised, what happens at startup and shutdown, middleware, and errors."),
  custom(
    "pypipe",
    {
      title: "The idea: an app has a lifecycle, and requests pass through layers",
      stages: [
        { name: "Lifespan start", icon: "🚀", sub: "pools, clients, models" },
        { name: "Middleware", icon: "🧅", sub: "every request" },
        { name: "Router", icon: "🗂️", sub: "prefix, tags, deps" },
        { name: "Route", icon: "🐍", sub: "service → repository" },
        { name: "Lifespan end", icon: "🛑", sub: "close everything" },
      ],
      steps: [
        { at: 0, text: "Once, before serving: open the DB pool, create the HTTP client, load models. If this fails, the app doesn't start." },
        { at: [1, 2, 3], text: "Then, for every request: through the middleware, to a router, to the route, which calls a service and a repository." },
        { at: 2, text: "Routers group routes by domain, each with its own prefix, tags and shared dependencies." },
        { at: 4, text: "Once, on shutdown: close pools and clients gracefully, after in-flight requests finish." },
      ],
    },
    B(
      "Here's the idea of the module. An app has a lifecycle. Once, before it serves anything, the lifespan opens database pools, creates shared clients, and loads models.",
      "Then every request passes through layers: middleware, then a router, then the route, which calls a service and a repository.",
      "Routers are how a big app is split up: one per domain, each with its own prefix and dependencies.",
      { say: "And once, on shutdown, the lifespan closes everything gracefully. Lifespan, middleware, routers, errors: the four questions of this module.", tone: "key" },
    ),
  ),

  // ---- Q19
  q(19, 3, "How do you structure a larger FastAPI application (APIRouter)?", "routers per domain, and layers inside each", "Question nineteen, asked in three write-ups. How do you structure a larger FastAPI application?", "Routers to split the app, a layout by domain, and layers inside each domain."),
  {
    kind: "code",
    title: "Routers by domain, layers inside",
    lang: "python",
    code: `src/
  main.py                 # app = FastAPI(lifespan=…); include_router(...)
  core/config.py, db.py   # settings, engine, session dependency
  chat/router.py          # HTTP only: params, status codes
  chat/service.py         # business logic, no FastAPI imports
  chat/repository.py      # database queries
  chat/schemas.py         # Pydantic in/out models
  documents/…             # the same shape per domain

router = APIRouter(prefix="/chat", tags=["chat"],
                   dependencies=[Depends(get_current_user)])
app.include_router(router)`,
    highlight: [[1, 8], [10, 12]],
    beats: B(
      "Organise by domain: a folder per area, like chat and documents, each with the same shape. A router that does HTTP only: parameters, status codes. A service with the business logic, which doesn't import FastAPI, so it's easy to test. A repository for database queries. And schemas for the Pydantic models. It's the same layering as controller, service, repository in Spring.",
      { say: "Each domain's APIRouter has a prefix, tags for the docs, and shared dependencies, like requiring a logged-in user. Main dot py creates the app with its lifespan, and includes each router.", tone: "key" },
    ),
  },

  // ---- Q20
  q(20, null, "What are lifespan events, and what should run at startup and shutdown?", "one async context manager around the app's whole life", "Question twenty. What are lifespan events, and what should run at startup and shutdown?", "The shape, and what belongs in it."),
  {
    kind: "code",
    title: "lifespan: before the yield is startup, after it is shutdown",
    lang: "python",
    code: `@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.db = create_async_engine(settings.database_url)
    app.state.http = httpx.AsyncClient(timeout=10)
    app.state.embedder = load_embedding_model()     # once, not per request
    yield                                           # the app serves here
    await app.state.http.aclose()
    await app.state.db.dispose()

app = FastAPI(lifespan=lifespan)`,
    highlight: [[1, 5], [6, 6], [7, 10]],
    beats: B(
      "The lifespan is an async context manager around the app's whole life. Code before the yield runs once at startup: connection pools, shared HTTP clients, and anything slow to build, like loading an embedding model. Loading a model per request is a classic mistake.",
      "The app serves requests while the lifespan sits at the yield.",
      { say: "Code after the yield runs at shutdown: close clients and pools. It replaces the old on event startup and shutdown decorators. Store the objects on app dot state, and hand them out with dependencies.", tone: "key" },
    ),
  },

  // ---- Q21
  q(21, 4, "How does middleware work in FastAPI?", "wraps every request; order; middleware vs dependencies", "Question twenty one, asked in four write-ups. How does middleware work in FastAPI?", "What it wraps, the order layers run in, and when to use a dependency instead."),
  custom(
    "pyonion",
    {
      title: "Middleware wraps every request, like an onion",
      sub: "app.add_middleware(…): the last one added is the outermost",
      core: "your routes",
      layers: [
        { name: "timing", does: "added first: innermost, nearest the route", tone: "amber" },
        { name: "request_id", does: "tags the request and the response with an id", tone: "cyan" },
        { name: "CORS", does: "added last: outermost, sees the request first", tone: "green" },
      ],
      call: "a request goes in: CORS → request_id → timing → route",
      back: "the response comes out: timing → request_id → CORS",
    },
    B(
      "Middleware wraps every request and response. It runs code before the request reaches the routes, and after the response is produced. And like stacked decorators, the order matters.",
      "Timing was added first, so it sits nearest the routes.",
      "Request id goes around it: it tags each request and response with an id, for the logs.",
      "CORS was added last, so it's the outermost layer, and sees the request first. With add middleware, the last one added is the outermost.",
      { say: "A request goes in through the layers to the route, and the response comes back out in reverse. Use middleware for cross-cutting concerns that apply to everything: logging, timing, request ids, CORS, compression, security headers.", tone: "key" },
    ),
  ),
  {
    kind: "code",
    title: "A timing middleware, and when to use a dependency instead",
    lang: "python",
    code: `@app.middleware("http")
async def timing(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)          # the rest of the app
    response.headers["X-Process-Time"] = f"{time.perf_counter() - start:.3f}"
    return response

# middleware: every request, no access to route params or Depends
# dependency: per route or router, typed, injectable, testable
#   → auth and permissions belong in dependencies`,
    highlight: [[1, 6], [8, 10]],
    beats: B(
      "A function middleware receives the request and call next. Await call next to run the rest of the app, then change the response, here adding a timing header.",
      { say: "Middleware versus dependencies. Middleware runs for every request, but it can't see route parameters, and can't use Depends. Dependencies attach to specific routes or routers, are typed, and are easy to override in tests. So authentication and permissions belong in dependencies, and truly global concerns in middleware.", tone: "key" },
    ),
  },

  // ---- Q22
  q(22, null, "How do you handle errors in FastAPI (HTTPException and custom exception handlers)?", "domain errors mapped to one consistent error contract", "Question twenty two. How do you handle errors in FastAPI?", "HTTPException for the simple case, and custom handlers for a clean design."),
  {
    kind: "code",
    title: "Domain errors in the service, HTTP in one handler",
    lang: "python",
    code: `class AppError(Exception): status = 500; code = "internal"
class NotFound(AppError): status = 404; code = "not_found"
class ProviderBusy(AppError): status = 503; code = "llm_busy"

@app.exception_handler(AppError)
async def on_app_error(request: Request, exc: AppError):
    return JSONResponse(
        {"error": exc.code, "message": str(exc),
         "request_id": request.state.request_id},
        status_code=exc.status)

# in a service: raise ProviderBusy("model overloaded, retry soon")`,
    highlight: [[1, 3], [5, 10], [12, 12]],
    beats: B(
      "HTTPException is fine for simple cases in a route. For a clean design, the service layer raises domain errors, like not found or provider busy, without knowing anything about HTTP.",
      "One exception handler turns all of them into a consistent JSON error contract: an error code, a message, and the request id, so support can find it in the logs.",
      { say: "Services stay framework-agnostic and testable. And never return stack traces or SQL errors to clients: log them with the request id, and send a generic 500.", tone: "key" },
    ),
  },
  check({
    topic: "lifespan",
    q: "Where should a 2 GB embedding model be loaded in a FastAPI app, and why not in the route?",
    say: "Where should a two gigabyte embedding model be loaded in a FastAPI app, and why not in the route?",
    a: "In the lifespan, once at startup (stored on app.state, handed out by a dependency). In the route it would reload on every request: seconds of latency and memory churn.",
    aSay: "In the lifespan, once at startup, stored on app dot state and handed out with a dependency. Loading it in the route would reload it on every request, costing seconds of latency and a lot of memory churn.",
  }),
  check({
    topic: "middleware",
    q: "app.add_middleware(A) then app.add_middleware(B). Which sees the request first?",
    say: "You add middleware A, then middleware B. Which one sees the request first?",
    a: "B: the last one added is the outermost layer, so it sees the request first and the response last.",
    aSay: "B. The last middleware added is the outermost layer, so it sees the request first, and the response last.",
  }),

  // ================================================================ module 7
  sec("7", "Security", "Module seven. Security. JWT authentication was asked in four write-ups, and role checks and API keys follow from it."),
  {
    kind: "seq",
    title: "The idea: log in once, then send a signed token with every request",
    actors: [
      { id: "c", name: "Client", icon: "📱" },
      { id: "a", name: "POST /token", icon: "🔑", tone: "amber" },
      { id: "r", name: "GET /chats", icon: "🛡️", tone: "green" },
    ],
    msgs: [
      { from: "c", to: "a", label: "username + password", step: 0 },
      { from: "a", to: "c", label: "check the hash; sign a JWT {sub, exp}", step: 0, tone: "amber" },
      { from: "c", to: "r", label: "Authorization: Bearer <jwt>", step: 1 },
      { from: "r", to: "c", label: "verify signature + expiry → user, no DB lookup needed", step: 2, tone: "green" },
    ],
    beats: B(
      "Here's the idea. The client logs in once, sending a username and password. The server checks the password against its stored hash, and signs a token, a JWT, saying who the user is and when the token expires.",
      "Then every request carries that token, in the Authorization header, as a bearer token.",
      { say: "The server verifies the signature and the expiry, and knows who the user is, without a database lookup for the session. That's what makes JWTs stateless.", tone: "key" },
    ),
  },

  // ---- Q23
  q(23, 4, "How do you implement JWT authentication in FastAPI?", "OAuth2PasswordBearer, a get_current_user dependency, and the security points", "Question twenty three, asked in four write-ups. How do you implement JWT authentication in FastAPI?", "The code shape, and then the security points, which are what interviewers are listening for."),
  {
    kind: "code",
    title: "A get_current_user dependency",
    lang: "python",
    code: `oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

def create_token(user_id: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=15)
    return jwt.encode({"sub": user_id, "exp": exp}, SECRET, algorithm="HS256")

async def get_current_user(token: str = Depends(oauth2_scheme),
                           db=Depends(get_db)) -> User:
    try:
        payload = jwt.decode(token, SECRET, algorithms=["HS256"])  # checks exp
    except jwt.InvalidTokenError:
        raise HTTPException(401, "invalid or expired token",
                            headers={"WWW-Authenticate": "Bearer"})
    return await users.get(db, payload["sub"])`,
    highlight: [[1, 1], [3, 5], [7, 14]],
    beats: B(
      "OAuth2 password bearer reads the bearer token from the Authorization header, and makes the Authorize button work in the docs.",
      "Creating a token: the user id as the subject, a short expiry, signed with a secret.",
      { say: "And the dependency: decode and verify the token, which checks the signature and the expiry, and pin the allowed algorithms. On failure, a 401. On success, load the user. Then any route that needs a user just depends on get current user.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "The security points to say",
    items: [
      { icon: "🔒", text: "Hash passwords with bcrypt or Argon2", sub: "slow and salted; never store or log plain passwords" },
      { icon: "⏱️", text: "Short-lived access tokens + refresh tokens", sub: "a JWT can't be revoked before it expires, so keep it short" },
      { icon: "👁️", text: "A JWT is signed, not encrypted", sub: "anyone can read the payload: no secrets in it" },
      { icon: "🧾", text: "Pin the algorithm; check exp, and aud/iss if used", sub: "never accept alg=none; HTTPS everywhere" },
    ],
    beats: B(
      "Hash passwords with bcrypt or Argon2, which are slow and salted on purpose. Never store or log a plain password.",
      "Keep access tokens short-lived, minutes, with refresh tokens to get new ones. A JWT can't be revoked before it expires without extra state, like a deny list, so short expiry is your main control.",
      "A JWT is signed, not encrypted. Anyone holding it can read the payload. So never put secrets in it.",
      { say: "And verify properly: pin the algorithm, check expiry, and audience and issuer if you use them. Never accept the algorithm none. And HTTPS everywhere, because a stolen token is a stolen session.", tone: "key" },
    ),
  },

  // ---- Q24
  q(24, null, "How do you implement role-based access and API keys?", "a dependency factory for roles; APIKeyHeader for services", "Question twenty four. How do you implement role-based access and API keys?", "Both are dependencies. Roles use a factory; API keys use a header scheme."),
  {
    kind: "code",
    title: "Roles with a dependency factory; API keys with a header",
    lang: "python",
    code: `def require_role(*roles: str):
    async def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(403, "not allowed")
        return user
    return checker

@app.delete("/docs/{id}")
async def delete_doc(id: int, user=Depends(require_role("admin"))): ...

api_key = APIKeyHeader(name="X-API-Key")
async def verify_key(key: str = Depends(api_key)):
    if not secrets.compare_digest(hash_key(key), STORED_HASH):
        raise HTTPException(401, "bad API key")`,
    highlight: [[1, 6], [8, 9], [11, 14]],
    beats: B(
      "Role-based access is a dependency factory: a function that takes the allowed roles, and returns a dependency that checks the current user's role. A closure, just like a decorator with arguments.",
      "So a route says depends on require role admin. 401 means we don't know who you are; 403 means we know, and you're not allowed.",
      { say: "API keys, for service-to-service or partner access, use APIKeyHeader. Store only a hash of each key, compare in constant time with secrets dot compare digest, and support rotation. These security classes also show lock icons in the docs.", tone: "key" },
    ),
  },
  check({
    topic: "JWT",
    q: "Can you put a user's email and plan inside a JWT payload? Their password? Why?",
    say: "Can you put a user's email and plan inside a JWT payload? What about their password? Why?",
    a: "Email/plan: fine if it's OK for the client to read them. Password: never. A JWT is signed (tamper-proof), not encrypted (anyone can base64-decode it).",
    aSay: "The email and plan are fine, as long as it's acceptable for the client to read them. The password, never. A JWT is signed, so it can't be tampered with, but it isn't encrypted, so anyone can decode and read it.",
  }),
];
