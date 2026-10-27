## FastAPI foundations

### fa01 | What is FastAPI, and why is it popular?

**FastAPI** is a modern Python web framework for building APIs, built on two libraries:
- **Starlette**: the ASGI web toolkit (routing, requests, responses, middleware, WebSockets).
- **Pydantic**: data validation and serialisation from type hints.

Its central idea: **you write normal Python type hints, and FastAPI uses them to validate requests, convert types, serialise responses and generate OpenAPI docs.**

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str
    price: float

@app.post("/items/{item_id}")
async def create_item(item_id: int, item: Item, notify: bool = False):
    # item_id: from the path, converted to int (a 422 error if it isn't one)
    # item: from the JSON body, validated by Pydantic
    # notify: from the query string (?notify=true)
    return {"id": item_id, **item.model_dump()}
```

Why teams pick it:
- **Async-first** (ASGI): high concurrency for I/O-bound services: one of the fastest Python frameworks.
- **Automatic interactive docs** at `/docs` (Swagger UI) and `/redoc`, from the OpenAPI schema.
- **Less boilerplate and fewer bugs**: validation errors return a clear **422** response automatically.
- **Dependency injection** built in (`Depends`).
- Great editor support (autocomplete from the type hints).
- The default choice for **ML/LLM model serving** and microservices.

Trade-offs: less "batteries included" than Django (no ORM, admin or auth system: you bring SQLAlchemy and so on), and you must understand async to avoid blocking the event loop.

### fa02 | What is the difference between WSGI and ASGI?

- **WSGI** (Web Server Gateway Interface, PEP 3333): the classic **synchronous** interface between Python web servers and apps. One request ties up one worker (thread or process) from start to finish. Flask (classically) and Django (traditionally) use it, served by **Gunicorn** or uWSGI.
- **ASGI** (Asynchronous Server Gateway Interface): the **async** successor. The app is an `async` callable that handles **events**, so one worker can serve **many** concurrent connections, and it supports **WebSockets**, long-polling, **streaming** and HTTP/2. FastAPI and Starlette use it (Django supports it too now), served by **Uvicorn**, Hypercorn or Granian.

```python
# a raw ASGI app: an async callable with scope, receive, send
async def app(scope, receive, send):
    assert scope["type"] == "http"
    await send({"type": "http.response.start", "status": 200, "headers": [(b"content-type", b"text/plain")]})
    await send({"type": "http.response.body", "body": b"hello"})
```

Why it matters: with WSGI, 100 slow requests (each waiting 2s on an external API) need 100 workers. With ASGI and `async` code, one worker handles them all while they wait, much like Node.js.

### fa03 | What are Uvicorn and Gunicorn, and how do you run FastAPI in production?

- **Uvicorn**: an **ASGI server** (built on uvloop and httptools). It receives HTTP connections and calls your FastAPI app. Each Uvicorn process runs **one event loop**, which uses **one CPU core**.
- **Gunicorn**: a mature **process manager**. It forks several workers, restarts crashed ones and handles graceful reloads. Used with Uvicorn workers: `gunicorn -k uvicorn.workers.UvicornWorker`.

```bash
# development: auto-reload
fastapi dev app/main.py              # or: uvicorn app.main:app --reload

# production on a VM: several worker processes to use every core
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
# or
gunicorn app.main:app -k uvicorn.workers.UvicornWorker -w 4 --timeout 60
```

How many workers? A common starting point is about **one per CPU core** (more if routes do blocking work). Each worker is a separate process with **its own memory**: in-memory caches and rate-limit counters aren't shared, so put shared state in Redis.

In **Kubernetes / containers**, the usual pattern is **one Uvicorn process per container**, scaling with **more replicas** behind the load balancer, which leaves restarts and scaling to the orchestrator. Put a reverse proxy or ingress in front (TLS, compression, request size limits), and run with `--proxy-headers` so client IPs and the scheme are correct.

### fa04 | How does FastAPI compare with Flask and Django?

| | FastAPI | Flask | Django (+ DRF) |
|---|---|---|---|
| Style | modern, type-hint driven, API-first | minimal micro-framework | **batteries included**, full-stack |
| Interface | **ASGI, async-first** | WSGI (async views possible, but sync at heart) | WSGI and ASGI (async support is growing) |
| Validation | **built in** (Pydantic) | add-ons (marshmallow, etc.) | DRF serializers, forms |
| API docs | **automatic** OpenAPI / Swagger | add-ons | add-ons (drf-spectacular) |
| ORM / admin / auth | bring your own (SQLAlchemy, SQLModel) | bring your own | **built in**: ORM, migrations, admin, auth |
| Dependency injection | **built in** | none (globals / `g`) | none (middleware, class-based views) |
| Performance | **high** for I/O-bound APIs | moderate | moderate |
| Best for | microservices, ML/LLM serving, high-concurrency APIs | small apps, simple services | large monoliths, CMS/admin-heavy products, fast CRUD |

Interview framing: "FastAPI when the product is an **API** and concurrency or async I/O matters (AI services, gateways, microservices). Django when I need the full stack quickly (ORM, admin, auth, migrations) and a big ecosystem. Flask for small, simple services."

## Requests and responses

### fa05 | How do path parameters, query parameters and the request body work?

FastAPI decides where each parameter comes from **by its declaration**:
- Declared in the **path** string (`{item_id}`) → a **path parameter**.
- A plain type (`int`, `str`, `bool`...) not in the path → a **query parameter**.
- A **Pydantic model** → the JSON **request body**.

```python
from fastapi import FastAPI, Path, Query
from pydantic import BaseModel

app = FastAPI()

class OrderIn(BaseModel):
    product_id: int
    qty: int = 1

@app.get("/users/{user_id}/orders")
async def list_orders(
    user_id: int = Path(gt=0),                      # path param, validated (> 0)
    status: str | None = None,                      # optional query param
    page: int = Query(1, ge=1),                     # query param with a default + validation
    size: int = Query(20, le=100),
    tags: list[str] = Query([]),                    # ?tags=a&tags=b
):
    ...

@app.post("/users/{user_id}/orders", status_code=201)
async def create_order(user_id: int, order: OrderIn):   # order comes from the JSON body
    ...
```

- **Type conversion**: `"42"` in the path becomes `42`; `?flag=true` / `1` / `yes` becomes a `bool`.
- **Invalid input** → an automatic **422 Unprocessable Entity** with details of which field failed and why.
- **Route order matters**: declare `/users/me` **before** `/users/{user_id}`, or "me" is treated as a user id and fails validation.

Other sources: `Header()`, `Cookie()`, `Form()`, `File()` / `UploadFile`, and `Body()` for single values in the body.

### fa06 | What is response_model, and why use it?

`response_model` (or the return type annotation) tells FastAPI the **shape of the response**. FastAPI then **validates and filters** what you return and documents it in OpenAPI.

```python
from pydantic import BaseModel, EmailStr

class UserIn(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: EmailStr               # no password field

@app.post("/users", response_model=UserOut, status_code=201)
async def create_user(user: UserIn):
    db_user = await save(user)    # a DB object WITH hashed_password, etc.
    return db_user                # filtered to id + email: the password is never leaked

# the same with a return annotation (the modern style)
@app.get("/users/{id}")
async def get_user(id: int) -> UserOut:
    ...
```

Why it matters:
- **Security**: prevents accidentally leaking internal fields (password hashes, internal flags) even if you return the whole DB object.
- **Contracts and docs**: clients see the exact response schema in `/docs`.
- **Serialisation**: datetimes, UUIDs, nested models and ORM objects are converted to JSON. Use `model_config = ConfigDict(from_attributes=True)` to read from ORM objects.

Useful options: `response_model_exclude_none=True`, `response_model_exclude={"x"}`; `list[UserOut]` for lists. A common pattern is separate models per purpose: `UserCreate`, `UserUpdate` (all fields optional), `UserOut`.

### fa07 | How do you set status codes and return different kinds of responses?

```python
from fastapi import FastAPI, Response, status
from fastapi.responses import JSONResponse, RedirectResponse, FileResponse, StreamingResponse, PlainTextResponse

@app.post("/items", status_code=status.HTTP_201_CREATED)    # default status for success
async def create(item: Item):
    return item

@app.delete("/items/{id}", status_code=204)
async def delete(id: int):
    await repo.delete(id)
    return Response(status_code=204)                         # no body

@app.get("/legacy")
async def legacy():
    return RedirectResponse("/new", status_code=307)

@app.get("/report")
async def report():
    return FileResponse("report.pdf", filename="report.pdf")

@app.get("/custom")
async def custom(response: Response):
    response.headers["X-Request-Id"] = "abc"                 # add headers
    response.set_cookie("session", "xyz", httponly=True, secure=True, samesite="lax")
    return {"ok": True}

@app.get("/accepted")
async def accepted():
    return JSONResponse({"status": "queued"}, status_code=202)   # bypasses response_model
```

By default, the dict, list or model you return is serialised to JSON with status 200. Returning a `Response` subclass directly **skips** the response_model validation, so you're responsible for its content. For big JSON payloads, `ORJSONResponse` serialises faster.

### fa08 | How do you handle headers, cookies, forms and file uploads?

```python
from typing import Annotated
from fastapi import FastAPI, Header, Cookie, Form, File, UploadFile, HTTPException

@app.get("/me")
async def me(
    user_agent: Annotated[str | None, Header()] = None,        # the User-Agent header (underscores become hyphens)
    x_request_id: Annotated[str | None, Header()] = None,
    session: Annotated[str | None, Cookie()] = None,
):
    ...

@app.post("/login")
async def login(username: Annotated[str, Form()], password: Annotated[str, Form()]):  # form-encoded body
    ...

@app.post("/avatar")
async def upload_avatar(file: UploadFile):                      # multipart/form-data
    if file.content_type not in {"image/png", "image/jpeg"}:
        raise HTTPException(400, "Only PNG or JPEG")
    contents = await file.read()                                 # small files only
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(413, "Max 5MB")
    await storage.save(f"avatars/{uuid4()}.png", contents)      # never trust file.filename
    return {"size": len(contents)}
```

- `UploadFile` uses a **spooled temporary file** (kept in memory up to a limit, then on disk), with async `read`, `seek` and `close`. Prefer it over `bytes = File()`, which loads everything into memory.
- Form and file handling need the `python-multipart` package.
- For large files: stream in chunks (`while chunk := await file.read(1024 * 1024)`) to object storage, or use **pre-signed URLs** so clients upload directly to S3 / Azure Blob.
- `Annotated[...]` is the recommended modern style for declaring parameter metadata.

## Pydantic models in FastAPI

### fa09 | How does FastAPI use Pydantic for validation, and what happens when validation fails?

Every parameter with a type, and every Pydantic model, is **validated and converted before your function runs**. If anything is wrong, your code **never runs**: FastAPI returns **422 Unprocessable Entity** with details.

```python
from pydantic import BaseModel, Field, field_validator, model_validator

class Booking(BaseModel):
    room_id: int
    guests: int = Field(ge=1, le=6)
    check_in: date
    check_out: date
    email: EmailStr

    @field_validator("email")
    @classmethod
    def lower(cls, v: str) -> str:
        return v.lower()

    @model_validator(mode="after")              # validate across fields
    def dates_in_order(self):
        if self.check_out <= self.check_in:
            raise ValueError("check_out must be after check_in")
        return self

@app.post("/bookings")
async def book(b: Booking): ...
```

The error response:
```json
{
  "detail": [
    {"type": "greater_than_equal", "loc": ["body", "guests"], "msg": "Input should be greater than or equal to 1", "input": 0}
  ]
}
```

Customising the format (e.g. to match your company's error contract):

```python
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

@app.exception_handler(RequestValidationError)
async def validation_handler(request, exc):
    return JSONResponse(status_code=400, content={"error": "VALIDATION_FAILED", "fields": exc.errors()})
```

Pydantic **coerces** compatible types by default (`"5"` → `5`). Use `Field(strict=True)` or `ConfigDict(strict=True)` when exact types matter.

### fa10 | What changed between Pydantic v1 and v2?

Pydantic v2 (mid-2023) rewrote the core in **Rust** (`pydantic-core`): validation is roughly **5–50× faster**. FastAPI 0.100+ supports v2, and current FastAPI requires it.

| Pydantic v1 | Pydantic v2 |
|---|---|
| `.dict()`, `.json()` | `.model_dump()`, `.model_dump_json()` |
| `parse_obj()`, `parse_raw()` | `model_validate()`, `model_validate_json()` |
| `@validator`, `@root_validator` | `@field_validator`, `@model_validator` |
| `class Config:` | `model_config = ConfigDict(...)` |
| `orm_mode = True` | `from_attributes=True` |
| `BaseSettings` in pydantic | separate package: `pydantic-settings` |
| `Optional[int]` gets a default of `None` | `Optional[int]` is **required** unless you give it a default |

```python
from pydantic import BaseModel, ConfigDict, computed_field

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)
    first: str
    last: str

    @computed_field              # included in the output
    @property
    def full_name(self) -> str:
        return f"{self.first} {self.last}"

UserOut.model_validate(orm_user)   # build from an ORM object
```

Also new in v2: strict mode, `TypeAdapter` (validate any type, e.g. `list[int]`, without a model), discriminated unions for polymorphic payloads, and better JSON Schema output.

### fa11 | How do you manage configuration with pydantic-settings?

`pydantic-settings` loads **typed, validated configuration** from environment variables and `.env` files, so missing or malformed config fails **at startup**, not on the first request that needs it.

```python
# app/config.py
from functools import lru_cache
from pydantic import PostgresDsn, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="APP_", extra="ignore")

    env: str = "dev"
    debug: bool = False                    # "true"/"1" in env -> True
    database_url: PostgresDsn              # required: startup fails if missing or invalid
    jwt_secret: SecretStr                  # hidden when printed or logged
    allowed_origins: list[str] = []        # from a JSON env var: '["https://app.com"]'
    request_timeout: float = 5.0

@lru_cache                                  # read the env once, reuse the same object
def get_settings() -> Settings:
    return Settings()

# app/main.py
from fastapi import Depends
@app.get("/info")
async def info(settings: Settings = Depends(get_settings)):
    return {"env": settings.env}
```

Why inject it with `Depends(get_settings)` instead of a global import: tests can override it (`app.dependency_overrides[get_settings] = lambda: Settings(database_url=..., ...)`).

Production: real secrets come from the platform (Kubernetes Secrets, Key Vault / Secrets Manager injected as env vars), never committed `.env` files.

## Dependency injection

### fa12 | How does dependency injection work in FastAPI (Depends)?

A **dependency** is a function (or class) that FastAPI **calls for you** before the route runs, injecting its return value. Dependencies can declare their own parameters (query, headers, other dependencies), so they form a **tree** that FastAPI resolves.

```python
from typing import Annotated
from fastapi import Depends, FastAPI, Header, HTTPException

app = FastAPI()

def pagination(page: int = 1, size: int = 20) -> dict:     # reads query params itself
    return {"offset": (page - 1) * size, "limit": min(size, 100)}

async def current_user(authorization: Annotated[str | None, Header()] = None) -> User:
    if not authorization:
        raise HTTPException(401, "Not authenticated")
    return await verify_token(authorization.removeprefix("Bearer "))

def require_admin(user: Annotated[User, Depends(current_user)]) -> User:   # a dependency of a dependency
    if not user.is_admin:
        raise HTTPException(403, "Admins only")
    return user

CurrentUser = Annotated[User, Depends(current_user)]       # a reusable alias

@app.get("/orders")
async def list_orders(user: CurrentUser, page: Annotated[dict, Depends(pagination)]):
    return await repo.orders_for(user.id, **page)

@app.delete("/users/{id}", dependencies=[Depends(require_admin)])   # run it, don't need its value
async def delete_user(id: int): ...
```

Why it's useful:
- **Reuse** cross-cutting logic: auth, DB sessions, pagination, settings, rate limiting.
- **Testability**: swap any dependency in tests with `app.dependency_overrides`.
- **Declarative and documented**: a dependency's parameters appear in the OpenAPI docs.

Compared with Spring: no container or classpath scanning. Dependencies are plain functions resolved **per request** by type hints. Router- or app-level dependencies (`APIRouter(dependencies=[...])`) apply to every route in that group.

### fa13 | What are yield dependencies, and how do you manage a database session with them?

A dependency that **`yield`s** runs setup code before the request, hands the yielded value to the route, then runs **teardown code after the response**, like a context manager. It's the standard way to manage per-request resources.

```python
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

engine = create_async_engine(settings.database_url, pool_size=10, max_overflow=5, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def get_db():
    async with SessionLocal() as session:      # setup: one session per request
        try:
            yield session                      # the route runs here
            await session.commit()             # commit if the route succeeded
        except Exception:
            await session.rollback()           # roll back on any error
            raise
    # the session is closed here (its connection goes back to the pool)

DB = Annotated[AsyncSession, Depends(get_db)]

@app.post("/orders")
async def create_order(data: OrderIn, db: DB):
    order = Order(**data.model_dump())
    db.add(order)
    await db.flush()                           # get the generated id
    return order
```

Key points:
- **One session per request**, never a global session shared between requests (that isn't safe for concurrent use).
- The **engine and pool are created once** (at module level or in the lifespan), and sessions borrow connections from the pool.
- If a yield dependency raises after the yield, FastAPI propagates it. Exceptions raised in the route are visible in the dependency's `except` block, which is how rollback works.
- Other uses: opening an HTTP client per request, acquiring a lock, timing a request, tracing spans.

### fa14 | How are dependencies cached, and how do you use classes as dependencies?

**Caching per request**: if several dependencies in one request depend on the same function (e.g. `get_db` or `current_user`), FastAPI **calls it once and reuses the result** within that request. Every route and sub-dependency therefore shares the same DB session and the same user.

```python
async def get_user(db: DB, token: Token) -> User: ...
async def get_cart(db: DB, user: Annotated[User, Depends(get_user)]): ...

@app.get("/checkout")
async def checkout(user: Annotated[User, Depends(get_user)], cart: Annotated[Cart, Depends(get_cart)]):
    ...   # get_user and get_db each ran ONCE for this request

# opt out when you really need a fresh call
Depends(get_random_id, use_cache=False)
```

**Classes as dependencies**: any callable works. FastAPI inspects `__init__` for parameters, or `__call__` on an instance for **configurable** dependencies:

```python
class RateLimiter:
    def __init__(self, limit: int, window: int):
        self.limit, self.window = limit, window

    async def __call__(self, request: Request, redis: RedisDep):   # called per request
        key = f"rl:{request.client.host}:{request.url.path}"
        count = await redis.incr(key)
        if count == 1:
            await redis.expire(key, self.window)
        if count > self.limit:
            raise HTTPException(429, "Too many requests")

@app.post("/login", dependencies=[Depends(RateLimiter(limit=5, window=60))])
async def login(...): ...
```

This "callable instance" pattern is how you build parametrised dependencies: permission checkers (`RequireRole("admin")`), rate limiters, feature flags.

### fa15 | How do you override dependencies in tests?

`app.dependency_overrides` maps a dependency function to a replacement. Every route that depends on the original gets the fake instead. No monkeypatching needed.

```python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.deps import get_db, current_user, get_settings

@pytest.fixture
def client(test_db_session):
    async def override_db():
        yield test_db_session                      # a test DB / transaction

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[current_user] = lambda: User(id=1, email="t@t.com", is_admin=True)
    app.dependency_overrides[get_settings] = lambda: Settings(database_url="postgresql://test", jwt_secret="x")

    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()               # don't leak overrides into other tests

def test_list_orders(client):
    r = client.get("/orders")
    assert r.status_code == 200
```

This is the main reason to get things through `Depends` (DB sessions, settings, external clients like payment or LLM APIs) instead of importing globals: everything becomes swappable for tests, and for different environments.

## Async in FastAPI

### fa16 | What is the difference between `async def` and `def` routes in FastAPI?

FastAPI supports both and treats them differently:

- **`async def` route**: runs **directly on the event loop**. While it's `await`ing (DB, HTTP), the loop serves other requests. Use it when **everything inside is async** (`await asyncpg...`, `await httpx...`).
- **`def` route** (normal function): FastAPI runs it in a **thread pool** (via AnyIO; about 40 threads by default), so blocking calls inside **don't block the event loop**. Use it when you call **blocking libraries** (`requests`, a sync DB driver, `time.sleep`, file I/O).

```python
import time, asyncio, requests, httpx

@app.get("/good-async")
async def good_async():
    async with httpx.AsyncClient() as client:
        r = await client.get("https://api.example.com")    # non-blocking
    return r.json()

@app.get("/good-sync")
def good_sync():
    r = requests.get("https://api.example.com")           # blocking, but in a worker thread: fine
    return r.json()

@app.get("/BAD")
async def bad():
    time.sleep(5)                                          # blocks the ENTIRE event loop
    requests.get("https://api.example.com")                # also blocking: every request freezes
    return {}
```

The same rule applies to **dependencies**: sync dependencies run in the thread pool, async ones on the loop.

Interview summary: **"If you can await everything, use `async def`. If you must call blocking code, use plain `def` (or `run_in_threadpool`). Never call blocking code inside `async def`."** CPU-heavy work belongs in a process pool or a task queue: neither option solves it, because of the GIL.

### fa17 | What happens if you call blocking code inside an async endpoint, and how do you fix it?

The event loop runs on **one thread**. A blocking call inside `async def` (`time.sleep`, `requests`, a sync DB driver, heavy CPU work, a big `json.loads`) **stops the loop**: **every other request on that worker waits**, including health checks. Latency spikes across the board, and throughput collapses to one request at a time.

```python
@app.get("/report")
async def report():
    data = pandas.read_csv("big.csv")      # blocks the loop for seconds
    return summarize(data)
```

Fixes:

```python
from fastapi.concurrency import run_in_threadpool
import asyncio

# 1. Make the route sync (FastAPI runs it in the thread pool)
@app.get("/report")
def report():
    return summarize(pandas.read_csv("big.csv"))

# 2. Offload just the blocking part from an async route
@app.get("/report2")
async def report2():
    data = await run_in_threadpool(pandas.read_csv, "big.csv")   # or asyncio.to_thread(...)
    return summarize(data)

# 3. CPU-heavy work: a process pool (escapes the GIL) or a background job queue
@app.post("/thumbnail")
async def thumbnail(file: UploadFile):
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(process_pool, make_thumbnail, await file.read())

# 4. Use async libraries: httpx.AsyncClient, asyncpg / SQLAlchemy async, redis.asyncio, aiofiles
```

Detecting it: run with asyncio **debug mode** (`PYTHONASYNCIODEBUG=1` warns about slow callbacks, >100ms); watch for latency rising across **all** endpoints at once; profile with py-spy.

### fa18 | How do you call external APIs efficiently from FastAPI?

Use **one shared async HTTP client** (connection pooling, keep-alive), created at **startup** and closed at **shutdown**, with **timeouts** on every call:

```python
from contextlib import asynccontextmanager
import httpx
from fastapi import FastAPI, Request

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http = httpx.AsyncClient(
        timeout=httpx.Timeout(5.0, connect=2.0),
        limits=httpx.Limits(max_connections=100, max_keepalive_connections=20),
    )
    yield
    await app.state.http.aclose()

app = FastAPI(lifespan=lifespan)

def get_http(request: Request) -> httpx.AsyncClient:
    return request.app.state.http

@app.get("/dashboard")
async def dashboard(http: Annotated[httpx.AsyncClient, Depends(get_http)]):
    # independent calls run CONCURRENTLY
    profile, orders = await asyncio.gather(
        http.get("http://users-svc/profile"),
        http.get("http://orders-svc/recent"),
    )
    return {"profile": profile.json(), "orders": orders.json()}
```

Mistakes to avoid:
- Creating a new `AsyncClient` **per request**: a new TCP/TLS handshake every time, and connection churn.
- Using `requests` inside `async def` (blocking).
- No timeout: a slow dependency then holds connections and memory forever.
- Sequential awaits for independent calls.

Add retries with backoff for idempotent calls (tenacity), circuit breakers for flaky dependencies, and pass a request id or trace headers downstream.

## Application structure and lifecycle

### fa19 | How do you structure a larger FastAPI application (APIRouter)?

`APIRouter` groups related routes into modules that you **include** in the main app with a prefix, tags and shared dependencies.

```python
# app/orders/router.py
from fastapi import APIRouter, Depends
router = APIRouter(prefix="/orders", tags=["orders"], dependencies=[Depends(current_user)])

@router.get("/")
async def list_orders(service: OrderServiceDep): return await service.list()

@router.post("/", status_code=201)
async def create_order(data: OrderCreate, service: OrderServiceDep): return await service.create(data)

# app/main.py
from app.orders.router import router as orders_router
app = FastAPI(lifespan=lifespan)
app.include_router(orders_router, prefix="/api/v1")
```

A common **domain-based** layout (from fastapi-best-practices):

```
app/
  main.py              # create the app, include routers, middleware, lifespan
  config.py            # Settings (pydantic-settings)
  database.py          # engine, session dependency
  auth/
    router.py  schemas.py  service.py  dependencies.py  models.py  exceptions.py
  orders/
    router.py  schemas.py  service.py  repository.py  models.py
tests/
alembic/               # migrations
```

Layering, like Spring's controller → service → repository:
- **router**: HTTP only (parameters, status codes, response models).
- **service**: business logic, with no FastAPI imports, so it's testable on its own.
- **repository**: DB queries.
- **schemas**: Pydantic models (request and response); **models**: ORM tables.

Keeping Pydantic schemas separate from ORM models prevents leaking DB fields and lets the API and the database evolve independently.

### fa20 | What are lifespan events, and what should run at startup and shutdown?

The **lifespan** handler runs code **once when the app starts** (before it serves requests) and **once when it shuts down**. It replaces the older `@app.on_event("startup")` / `("shutdown")` hooks.

```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- startup ---
    app.state.db_engine = create_async_engine(settings.database_url)
    app.state.redis = redis.asyncio.from_url(settings.redis_url)
    app.state.http = httpx.AsyncClient(timeout=5)
    app.state.model = load_ml_model("model.onnx")      # load heavy resources once
    yield                                               # the app serves requests here
    # --- shutdown (on SIGTERM / Ctrl+C) ---
    await app.state.http.aclose()
    await app.state.redis.aclose()
    await app.state.db_engine.dispose()                 # close pooled connections

app = FastAPI(lifespan=lifespan)
```

Put here: **connection pools** (DB, Redis), shared **HTTP clients**, loading **ML models or embeddings**, warming caches, starting Kafka producers and consumers, and their cleanup.

Don't put here: per-request resources (those go in yield dependencies), or long blocking work that makes start-up slow enough to fail container health checks.

On shutdown, Uvicorn stops accepting new connections, waits for in-flight requests (up to a timeout), then runs the code after `yield`: a **graceful shutdown**.

### fa21 | How does middleware work in FastAPI?

**Middleware** wraps **every request and response**: it runs code before the request reaches the routes and after the response is produced. Use it for cross-cutting concerns: logging, timing, request ids, CORS, compression, security headers.

```python
import time, uuid, logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

app = FastAPI()

@app.middleware("http")
async def request_context(request: Request, call_next):
    request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
    start = time.perf_counter()
    response = await call_next(request)            # pass on to the next middleware / route
    response.headers["X-Request-Id"] = request_id
    logging.info("%s %s %s %.1fms", request.method, request.url.path,
                 response.status_code, (time.perf_counter() - start) * 1000)
    return response

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://app.example.com"],     # an explicit list, not "*" with credentials
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Middleware vs dependencies:
- **Middleware**: applies to *every* request (including 404s and static files), works on the raw Request and Response, and **has no access to route parameters or Pydantic models**.
- **Dependencies**: per route or router, typed and injectable, and can return values to the route (the current user, a DB session). Authentication usually belongs here.

Order: middleware added **later wraps the earlier ones** (the last added runs first on the request). For heavy middleware, pure ASGI middleware is faster than `@app.middleware("http")` (BaseHTTPMiddleware), which has overhead and quirks with streaming responses.

### fa22 | How do you handle errors in FastAPI (HTTPException and custom exception handlers)?

```python
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse

# 1. HTTPException: for expected client errors
@app.get("/orders/{id}")
async def get_order(id: int, db: DB):
    order = await db.get(Order, id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

# 2. Domain exceptions + handlers: keep HTTP details out of the service layer
class AppError(Exception):
    status_code = 400
    code = "APP_ERROR"
    def __init__(self, message: str): self.message = message

class InsufficientStock(AppError):
    status_code = 409
    code = "INSUFFICIENT_STOCK"

@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.code, "message": exc.message})

# 3. A catch-all for unexpected errors: log everything, reveal nothing
@app.exception_handler(Exception)
async def unhandled(request: Request, exc: Exception):
    logger.exception("unhandled error", extra={"path": request.url.path})
    return JSONResponse(status_code=500, content={"error": "INTERNAL_ERROR"})
```

The service layer raises `InsufficientStock("only 2 left")`; the handler turns it into a **consistent JSON error contract**. Services stay framework-agnostic and testable.

Also: `RequestValidationError` (422) can be customised the same way; never return stack traces or SQL errors to clients; include the request id in error responses so support can find the logs. This is the equivalent of Spring's `@ControllerAdvice`.

## Security

### fa23 | How do you implement JWT authentication in FastAPI?

The standard pattern uses FastAPI's **`OAuth2PasswordBearer`** (it reads `Authorization: Bearer <token>`, and makes the "Authorize" button work in `/docs`) plus a JWT library:

```python
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import jwt                                   # PyJWT
from pwdlib import PasswordHash              # or passlib[bcrypt]

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")
password_hash = PasswordHash.recommended()   # Argon2

def create_access_token(sub: str, minutes: int = 15) -> str:
    payload = {"sub": sub, "exp": datetime.now(timezone.utc) + timedelta(minutes=minutes)}
    return jwt.encode(payload, settings.jwt_secret.get_secret_value(), algorithm="HS256")

@app.post("/auth/token")
async def login(form: Annotated[OAuth2PasswordRequestForm, Depends()], db: DB):
    user = await users.get_by_email(db, form.username)
    if not user or not password_hash.verify(form.password, user.hashed_password):
        raise HTTPException(401, "Incorrect email or password", headers={"WWW-Authenticate": "Bearer"})
    return {"access_token": create_access_token(str(user.id)), "token_type": "bearer"}

async def current_user(token: Annotated[str, Depends(oauth2_scheme)], db: DB) -> User:
    try:
        payload = jwt.decode(token, settings.jwt_secret.get_secret_value(), algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token",
                            headers={"WWW-Authenticate": "Bearer"})
    user = await users.get(db, int(payload["sub"]))
    if user is None or not user.is_active:
        raise HTTPException(401, "Inactive user")
    return user

@app.get("/me")
async def me(user: Annotated[User, Depends(current_user)]) -> UserOut:
    return user
```

Points to make in an interview:
- **Hash passwords** with bcrypt/Argon2 (slow and salted); never store or log plain passwords.
- **Short-lived access tokens** plus refresh tokens (rotated, revocable).
- Always pass `algorithms=[...]` when decoding (prevents algorithm-confusion attacks); keep the secret in settings or a vault.
- For browsers, consider HttpOnly cookies instead of localStorage; for third-party login, use OAuth2/OIDC providers.
- **Authorisation** (roles, ownership checks) is a separate dependency layered on top: `require_role("admin")`, and "does this order belong to this user?".

### fa24 | How do you implement role-based access and API keys?

**Role-based access** with a parametrised dependency:

```python
def require_roles(*roles: str):
    async def checker(user: Annotated[User, Depends(current_user)]) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user
    return checker

@app.delete("/users/{id}", dependencies=[Depends(require_roles("admin"))])
async def delete_user(id: int): ...

# OWNERSHIP check: the most common real-world authorisation bug (IDOR)
@app.get("/orders/{order_id}")
async def get_order(order_id: int, user: CurrentUser, db: DB):
    order = await db.get(Order, order_id)
    if not order or (order.user_id != user.id and user.role != "admin"):
        raise HTTPException(404)          # 404, not 403: don't reveal that it exists
    return order
```

**API keys** for service-to-service or partner access:

```python
from fastapi.security import APIKeyHeader
import hmac, hashlib

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def verify_api_key(key: Annotated[str | None, Depends(api_key_header)], db: DB):
    if not key:
        raise HTTPException(401, "Missing API key")
    digest = hashlib.sha256(key.encode()).hexdigest()    # store only HASHES of keys
    client = await api_clients.get_by_hash(db, digest)
    if not client:
        raise HTTPException(401, "Invalid API key")
    return client

router = APIRouter(prefix="/partner", dependencies=[Depends(verify_api_key)])
```

FastAPI's security classes (`OAuth2PasswordBearer`, `APIKeyHeader`, `HTTPBearer`) also register the scheme in OpenAPI, so `/docs` shows lock icons and lets you authenticate interactively. For scopes (OAuth2 permissions per endpoint), use `Security(current_user, scopes=["orders:write"])` with `SecurityScopes`.

## Databases

### fa25 | How do you use SQLAlchemy (async) with FastAPI?

```python
# models.py: SQLAlchemy 2.0 typed declarative style
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase): pass

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    orders: Mapped[list["Order"]] = relationship(back_populates="user")

class Order(Base):
    __tablename__ = "orders"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    total: Mapped[int]
    user: Mapped[User] = relationship(back_populates="orders")

# repository / route: 2.0-style select()
from sqlalchemy import select
from sqlalchemy.orm import selectinload

@app.get("/users/{id}/orders")
async def user_orders(id: int, db: DB) -> list[OrderOut]:
    result = await db.execute(
        select(Order).where(Order.user_id == id).order_by(Order.id.desc()).limit(50)
    )
    return result.scalars().all()

@app.get("/users")
async def users_with_orders(db: DB):
    stmt = select(User).options(selectinload(User.orders))   # eager load: avoids N+1
    return (await db.execute(stmt)).scalars().all()
```

Essentials:
- **Async driver**: `postgresql+asyncpg://...`; the engine is created once (with a pool), and there's one `AsyncSession` per request (a yield dependency).
- **Lazy loading doesn't work implicitly in async** (it raises `MissingGreenlet`): load relationships explicitly with `selectinload` / `joinedload`. That also prevents **N+1 queries**.
- Pydantic response models read ORM objects with `from_attributes=True`.
- **Alembic** for schema migrations (`alembic revision --autogenerate`, `alembic upgrade head`), run in CI/CD, never `create_all()` in production.
- Transactions: commit once per unit of work (in the dependency or the service), and roll back on errors.

**SQLModel** (by FastAPI's author) merges Pydantic and SQLAlchemy models into one class. Convenient for simple apps; many teams keep them separate in larger ones.

### fa26 | How do you avoid N+1 queries and tune database access in FastAPI?

**N+1**: one query loads N parent rows, then accessing a relationship on each row fires **one more query per row**: 1 + N round trips.

```python
# N+1: 1 query for orders + 1 per order for its customer
orders = (await db.execute(select(Order).limit(100))).scalars().all()
for o in orders:
    print(o.customer.name)        # sync: lazy load per row. async: MissingGreenlet error

# FIX: eager loading
stmt = select(Order).options(
    joinedload(Order.customer),          # many-to-one: a JOIN in the same query
    selectinload(Order.items),           # one-to-many: a second query with WHERE id IN (...)
).limit(100)
```

Other tuning checklist:
- **Indexes** on foreign keys and columns used in filters and ORDER BY; check with `EXPLAIN ANALYZE`.
- **Select only the columns you need** for list endpoints; **paginate** (keyset/cursor pagination for large tables instead of a big OFFSET).
- **Connection pool sizing**: `pool_size` × number of workers × number of pods must stay below the database's `max_connections` (or use PgBouncer).
- **Bulk operations** (`insert().values([...])`, `executemany`) instead of a loop of single inserts.
- **Short transactions**: never hold a transaction open while calling an external API.
- Log slow queries (`echo=True` in development, or the DB's slow-query log) and add tracing (OpenTelemetry SQLAlchemy instrumentation).
- **Cache** hot reads (Redis) and invalidate them on writes.

## Beyond request/response

### fa27 | What are BackgroundTasks, and when should you use Celery or a queue instead?

`BackgroundTasks` runs a function **after the response is sent**, **in the same process**:

```python
from fastapi import BackgroundTasks

def send_welcome_email(email: str):          # sync functions run in the thread pool
    smtp.send(email, "Welcome!")

@app.post("/signup", status_code=201)
async def signup(data: SignupIn, background: BackgroundTasks):
    user = await users.create(data)
    background.add_task(send_welcome_email, user.email)   # runs after the 201 is returned
    return user
```

Good for **small, quick, non-critical** follow-ups: sending an email, writing an audit log, invalidating a cache.

**Limits**: no retries, no persistence (if the process restarts or crashes, the task is **lost**), it uses the web worker's resources (heavy work slows down request handling), and there's no visibility, scheduling or distribution across machines.

Use a **real task queue** (**Celery**, **ARQ**, Dramatiq, RQ; with Redis or RabbitMQ) or a message broker (Kafka, SQS) when the work is:
- **important** (payments, order processing): needs retries and durability;
- **slow or CPU-heavy** (reports, video, ML batch jobs, embedding generation);
- **scheduled** (cron-like jobs) or needs rate-limited workers that scale separately.

```python
# Celery
@celery_app.task(bind=True, max_retries=5, default_retry_delay=10)
def process_payment(self, order_id): ...

@app.post("/orders")
async def create_order(...):
    order = await save(...)
    process_payment.delay(order.id)           # enqueue; a worker process picks it up
    return {"id": order.id, "status": "processing"}
```

Design jobs to be **idempotent** (they may run twice) and let clients poll a status endpoint or receive a webhook.

### fa28 | How do you stream responses (StreamingResponse, Server-Sent Events, LLM tokens)?

`StreamingResponse` sends the body **incrementally** from a (preferably async) generator, so the client gets data as it's produced, with constant memory.

```python
from fastapi.responses import StreamingResponse
import json, asyncio

# 1. streaming a large export without loading it all
@app.get("/export.csv")
async def export(db: DB):
    async def rows():
        yield "id,total\n"
        async for order in stream_orders(db):          # DB server-side cursor / batches
            yield f"{order.id},{order.total}\n"
    return StreamingResponse(rows(), media_type="text/csv",
                             headers={"Content-Disposition": "attachment; filename=export.csv"})

# 2. Server-Sent Events: LLM token streaming to the browser
@app.post("/chat")
async def chat(req: ChatRequest, request: Request):
    async def events():
        async for token in llm.stream(req.messages):     # e.g. an OpenAI/Anthropic SDK stream
            if await request.is_disconnected():          # stop paying for tokens nobody reads
                break
            yield f"data: {json.dumps({'token': token})}\n\n"
        yield "data: [DONE]\n\n"
    return StreamingResponse(events(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
```

Points to know:
- Use **async generators** and async I/O inside them; a sync generator runs in the thread pool.
- SSE format: lines of `data: ...` followed by a blank line; the browser's `EventSource` reconnects automatically. It's one-way (server → client) over plain HTTP.
- Disable proxy buffering (nginx `X-Accel-Buffering: no`), or tokens arrive in bursts.
- Check for client disconnects to free resources.
- GZip middleware can buffer streams: exclude streaming routes.
- Middleware based on `BaseHTTPMiddleware` has historically had issues with streaming; prefer pure ASGI middleware.

### fa29 | How do WebSockets work in FastAPI?

FastAPI (through Starlette) supports **WebSockets** natively: a persistent, two-way connection, for chat, live dashboards, collaborative editing and notifications.

```python
from fastapi import WebSocket, WebSocketDisconnect

class ConnectionManager:
    def __init__(self):
        self.active: dict[str, set[WebSocket]] = {}

    async def connect(self, room: str, ws: WebSocket):
        await ws.accept()
        self.active.setdefault(room, set()).add(ws)

    def disconnect(self, room: str, ws: WebSocket):
        self.active.get(room, set()).discard(ws)

    async def broadcast(self, room: str, message: dict):
        for ws in list(self.active.get(room, ())):
            await ws.send_json(message)

manager = ConnectionManager()

@app.websocket("/ws/rooms/{room}")
async def room_ws(ws: WebSocket, room: str, token: str):     # token from the query string
    user = await verify_token(token)                          # authenticate BEFORE accepting
    await manager.connect(room, ws)
    try:
        while True:
            data = await ws.receive_json()
            await manager.broadcast(room, {"user": user.name, "text": data["text"]})
    except WebSocketDisconnect:
        manager.disconnect(room, ws)
```

Scaling considerations:
- This in-memory manager only knows the connections on **its own process**. With several workers or pods, broadcast through **Redis pub/sub** (or a broker) so every instance relays messages to its local clients.
- Load balancers need WebSocket support, long idle timeouts and often **sticky sessions**.
- Authenticate during the handshake (a token in the query string or a cookie: browsers can't set custom headers on WebSocket connections).
- Send heartbeats (ping/pong), limit message size and rate, and validate every incoming message (a Pydantic model).

If only the server pushes updates, **SSE** is simpler than WebSockets.

### fa30 | How do you add rate limiting, caching and pagination to a FastAPI API?

**Rate limiting**: protects against abuse and brute force. Use counters in **Redis** so the limit holds across every worker and pod:

```python
# with the slowapi library
from slowapi import Limiter
from slowapi.util import get_remote_address
limiter = Limiter(key_func=get_remote_address, storage_uri="redis://localhost:6379")
app.state.limiter = limiter

@app.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, ...): ...
```
(Or a custom dependency, like the RateLimiter in the class-dependency question; or do it at the API gateway / nginx.) Return **429** with `Retry-After`.

**Caching** (cache-aside with Redis):

```python
async def get_product(product_id: int, db: DB, redis: RedisDep) -> ProductOut:
    key = f"product:{product_id}"
    if cached := await redis.get(key):
        return ProductOut.model_validate_json(cached)
    product = await repo.get(db, product_id)
    if not product:
        raise HTTPException(404)
    out = ProductOut.model_validate(product)
    await redis.set(key, out.model_dump_json(), ex=300)     # 5-minute TTL
    return out
# invalidate on update: await redis.delete(f"product:{id}")
```
Also use HTTP caching for public GETs (`Cache-Control`, `ETag`) and a CDN.

**Pagination**:

```python
class Page(BaseModel, Generic[T]):
    items: list[T]
    next_cursor: str | None

@app.get("/orders")
async def list_orders(db: DB, limit: int = Query(20, le=100), cursor: int | None = None) -> Page[OrderOut]:
    stmt = select(Order).order_by(Order.id.desc()).limit(limit + 1)
    if cursor:
        stmt = stmt.where(Order.id < cursor)                 # keyset pagination: fast at any depth
    rows = (await db.execute(stmt)).scalars().all()
    next_cursor = str(rows[limit - 1].id) if len(rows) > limit else None
    return Page(items=rows[:limit], next_cursor=next_cursor)
```
Offset/limit is simple but slows down on deep pages and can skip or duplicate rows while data changes; cursor (keyset) pagination is stable and fast.

## Testing, docs and deployment

### fa31 | How do you test FastAPI applications?

```python
# sync-style tests with TestClient (uses httpx under the hood; runs the app in-process)
from fastapi.testclient import TestClient
from app.main import app

def test_create_order():
    with TestClient(app) as client:                # `with` also runs the lifespan (startup/shutdown)
        r = client.post("/api/v1/orders", json={"product_id": 1, "qty": 2},
                        headers={"Authorization": "Bearer test"})
        assert r.status_code == 201
        assert r.json()["qty"] == 2

def test_validation_error():
    with TestClient(app) as client:
        r = client.post("/api/v1/orders", json={"qty": 0})
        assert r.status_code == 422

# async tests (when the test itself must await things, e.g. an async DB)
import pytest, httpx

@pytest.mark.anyio
async def test_async_flow():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/health")
        assert r.status_code == 200
```

Strategy:
- **Override dependencies** (`app.dependency_overrides`) for auth, settings and external clients (payment, LLM, email).
- **Real database in tests**: Postgres in Docker (**Testcontainers**), each test wrapped in a transaction that's rolled back, so tests are isolated and fast.
- Mock outbound HTTP with **respx** (for httpx) instead of calling real services.
- Unit-test **services** directly (no HTTP); keep a smaller number of API-level tests for routing, validation, auth and error mapping.
- Contract checks: the OpenAPI schema can be snapshot-tested, or fuzzed with Schemathesis.

### fa32 | How do the automatic API docs work, and how do you customise them?

FastAPI builds an **OpenAPI 3** schema from your routes, type hints, Pydantic models, dependencies and security schemes, and serves:
- `/docs`: **Swagger UI** (interactive: try requests, authorise with a token)
- `/redoc`: ReDoc
- `/openapi.json`: the raw schema, used to **generate client SDKs** (openapi-generator, orval) and for contract testing

```python
app = FastAPI(
    title="Orders API",
    version="1.4.0",
    description="Order management for the storefront",
    docs_url="/docs" if settings.env != "prod" else None,   # often hidden in production
    redoc_url=None,
)

class OrderIn(BaseModel):
    product_id: int = Field(description="Catalogue product id", examples=[101])
    qty: int = Field(1, ge=1, le=10)

@app.post(
    "/orders",
    summary="Create an order",
    response_model=OrderOut,
    status_code=201,
    tags=["orders"],
    responses={409: {"model": ErrorOut, "description": "Out of stock"}},   # document error responses
)
async def create_order(order: OrderIn): ...
```

Benefits to mention: the docs **can't drift** from the code (they're generated from it), frontend and mobile teams can generate typed clients, and QA can explore the API without Postman collections. Use `include_in_schema=False` for internal routes, and protect or disable the docs in production when the API isn't public.

### fa33 | How do you deploy FastAPI with Docker?

```dockerfile
FROM python:3.13-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app

# install dependencies first: this layer is cached when only the code changes
COPY pyproject.toml uv.lock ./
RUN pip install --no-cache-dir uv && uv sync --frozen --no-dev
ENV PATH="/app/.venv/bin:$PATH"

COPY app ./app
RUN useradd --create-home appuser
USER appuser                                   # don't run as root

EXPOSE 8000
# exec form, so SIGTERM reaches uvicorn directly (graceful shutdown)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
```

Production checklist:
- **One Uvicorn process per container**, and scale with replicas (Kubernetes / ECS / Cloud Run); or `--workers N` / Gunicorn on a VM.
- **Health endpoints**: `/health/live` (the process is up) and `/health/ready` (DB and Redis reachable), wired to liveness and readiness probes.
- Config and secrets from **environment variables** (pydantic-settings); never bake `.env` into the image.
- Run **Alembic migrations** as a separate step or job before rolling out, not on every container start.
- **Logging** to stdout in JSON with request ids; metrics (Prometheus instrumentator); tracing (OpenTelemetry FastAPI instrumentation).
- A reverse proxy or ingress for TLS, timeouts and body-size limits; `--proxy-headers` with trusted forwarded IPs.
- Resource limits, with memory budgeted per worker (ML models are loaded once per process).
- A slim base image, a `.dockerignore`, pinned dependencies (lockfile), and image scanning in CI.

### fa34 | How do you make a FastAPI service fast and observable in production?

**Performance**
1. **Async all the way** for I/O routes (asyncpg / SQLAlchemy async, httpx, redis.asyncio); `def` routes or thread offloading for blocking libraries; **never** block the loop.
2. **Reuse connections**: one DB engine and pool, one shared HTTP client, created in the lifespan.
3. **Concurrent I/O** with `asyncio.gather` for independent calls.
4. **Database first**: indexes, no N+1, pagination, select only the columns you need. Most "slow API" problems are queries.
5. **Cache** hot reads in Redis; HTTP caching / CDN for public data.
6. **Offload** slow or CPU work to queues (Celery/ARQ) or process pools; stream large responses.
7. Faster serialisation for big payloads (ORJSONResponse, return-type models validated by pydantic-core); keep middleware lightweight.
8. Enough **workers or replicas** for the CPU cores; load-test (Locust, k6) before launch.

**Observability**
- **Structured logs** (JSON) with a request id / trace id on every line.
- **Metrics**: request rate, error rate, p95/p99 latency per route, DB pool usage, event-loop lag.
- **Distributed tracing** with OpenTelemetry (auto-instrument FastAPI, SQLAlchemy, httpx) to see which downstream call is slow.
- **Error tracking** (Sentry) with request context.
- Profiling: **py-spy** (sampling, attaches to a live process with no code changes) to find CPU hot spots and blocking calls.

Golden signals to alert on: latency, traffic, errors, saturation (CPU, memory, connection pools).
