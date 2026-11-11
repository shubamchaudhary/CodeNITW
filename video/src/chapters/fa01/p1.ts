import type { Scene } from "../../lib/types.ts";
import { B, check, custom, q, sec } from "./h.ts";

// Part 1: how the lecture is organised, then module 1 (foundations), module 2
// (requests and responses), module 3 (Pydantic models) and module 4
// (dependency injection), question by question in the page's order.
export const p1: Scene[] = [
  {
    kind: "title",
    eyebrow: "FastAPI · interview lecture",
    title: "FastAPI, topic by topic",
    subtitle: "Every module of the FastAPI page, the idea behind it, and the questions interviews ask about it",
    beats: B(
      "FastAPI, topic by topic. Like the Python lecture, this one follows the FastAPI page exactly: the same ten modules, in the same order, and in each module, the same questions with the same numbers. Each module starts with the idea as a picture, then the questions, then a check.",
    ),
  },
  {
    kind: "numbers",
    title: "What interviews ask about FastAPI most",
    items: [
      { value: "12", label: "What is FastAPI, and why is it popular?", sub: "module 1" },
      { value: "4", label: "Dependency injection", sub: "module 4" },
      { value: "4", label: "Middleware", sub: "module 6" },
      { value: "4", label: "JWT authentication", sub: "module 7" },
      { value: "3", label: "Rate limiting, caching, pagination", sub: "module 9" },
    ],
    footer: "Write-ups that asked it, out of the 456 that mention Python",
    beats: B(
      "Here's what gets asked most, from the same four hundred and fifty six interview write-ups. By far the most common: what is FastAPI, and why is it popular. Twelve write-ups.",
      "Dependency injection, four.",
      "Middleware, four.",
      "JWT authentication, four.",
      "Rate limiting, caching and pagination, three.",
      { say: "So the opening question deserves a really good answer, and that's where we start.", tone: "key" },
    ),
  },

  // ================================================================ module 1
  sec("1", "FastAPI foundations", "Module one. FastAPI foundations. What FastAPI is, what it's built on, how it runs, and how it compares with Flask and Django."),
  custom(
    "pypipe",
    {
      title: "The idea: FastAPI is a layer on top of two libraries",
      stages: [
        { name: "Uvicorn", icon: "🖧", sub: "ASGI server: sockets, HTTP" },
        { name: "Starlette", icon: "🧭", sub: "routing, middleware, WebSockets" },
        { name: "FastAPI", icon: "⚡", sub: "reads your type hints" },
        { name: "Pydantic", icon: "🛡️", sub: "validates and serialises" },
        { name: "Your function", icon: "🐍", sub: "plain Python" },
      ],
      steps: [
        { at: 0, text: "A request arrives at Uvicorn, an ASGI server. It handles the network and HTTP, and calls the app." },
        { at: 1, text: "Starlette is the web toolkit underneath: routing, requests, responses, middleware, WebSockets, streaming." },
        { at: [2, 3], text: "FastAPI adds the part you feel: it reads your function's type hints, and Pydantic validates and converts the data to match them." },
        { at: 4, text: "Your function receives clean, typed values. You write normal Python; the framework does the HTTP and the checking." },
      ],
    },
    B(
      "Here's the idea of the whole framework, as layers. A request first reaches Uvicorn, which is an ASGI server. It deals with sockets and HTTP, and then calls your application.",
      "Underneath FastAPI is Starlette, a lightweight web toolkit. Routing, requests and responses, middleware, WebSockets and streaming all come from Starlette.",
      "FastAPI's own contribution is reading your function signatures. It looks at the type hints, and Pydantic validates and converts the incoming data to match them.",
      { say: "So by the time your function runs, it receives clean, typed values. You write a normal Python function. The framework handles the HTTP, the checking, and the documentation.", tone: "key" },
    ),
  ),

  // ---- Q1
  q(1, 12, "What is FastAPI, and why is it popular?", "what it's built on, the one central idea, and four reasons", "Question one, asked in twelve write-ups. What is FastAPI, and why is it popular?", "Say what it's built on, the one central idea, and then a few concrete reasons, in that order."),
  {
    kind: "code",
    title: "One declaration, five things for free",
    lang: "python",
    code: `from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Question(BaseModel):
    text: str
    top_k: int = 5

@app.post("/ask/{space_id}")
async def ask(space_id: int, body: Question, debug: bool = False):
    return {"space": space_id, "q": body.text, "k": body.top_k}`,
    highlight: [[6, 8], [10, 12]],
    beats: B(
      "The central idea: you write normal Python type hints, and FastAPI uses them for everything. Here's a Pydantic model for the request body.",
      { say: "And one route. From this signature alone, FastAPI knows space id comes from the path and must be an int, the body must match Question, and debug is an optional query parameter. It validates all of it, converts the types, returns a clear 422 error if anything is wrong, serialises the response, and documents it all in interactive docs at slash docs. One declaration, five things for free.", tone: "key" },
    ),
  },
  {
    kind: "sayit",
    q: "What is FastAPI, and why is it popular?",
    lines: [
      "A modern Python framework for APIs, built on Starlette (ASGI) and Pydantic.",
      "Type hints drive validation, conversion, serialisation and docs: less code, fewer bugs.",
      "Async-first on ASGI: high concurrency for I/O-bound work like DB and LLM calls.",
      "Automatic OpenAPI docs at /docs, and a clean dependency injection system.",
      "Fast to write and fast to run: the default choice for Python APIs and ML/LLM services.",
    ],
    beats: B(
      { say: "Here's the answer, to say out loud.", tone: "ask" },
      "FastAPI is a modern Python framework for building APIs, built on Starlette for the web layer, which is ASGI, and Pydantic for data.",
      "Its central idea is that type hints drive everything: validation, conversion, serialisation and documentation. So there's less code, and fewer bugs.",
      "It's async-first, so one process handles many concurrent requests that are waiting on I/O, like database or LLM calls.",
      "It generates OpenAPI docs automatically, at slash docs, and it has a clean dependency injection system.",
      { say: "So it's fast to write and fast to run, which is why it's become the default for Python APIs, and especially for ML and LLM services.", tone: "key" },
    ),
  },

  // ---- Q2
  q(2, null, "What is the difference between WSGI and ASGI?", "synchronous, one request per worker, versus async, many connections per worker", "Question two. What's the difference between WSGI and ASGI?", "Both are contracts between a server and a Python app. The difference is what a worker can do while a request waits."),
  custom(
    "pylanes",
    {
      title: "WSGI ties up a worker; ASGI lets one worker juggle",
      sub: "three requests that each wait 1 s on a database",
      max: 3.4,
      rows: [
        { label: "WSGI worker", step: 0, bars: [{ s: 0, e: 1, kind: "wait", text: "req 1" }, { s: 1, e: 2, kind: "wait", text: "req 2" }, { s: 2, e: 3, kind: "wait", text: "req 3" }], done: "3 s" },
        { label: "ASGI: req 1", step: 1, bars: [{ s: 0, e: 1, kind: "wait" }] },
        { label: "ASGI: req 2", step: 1, bars: [{ s: 0.05, e: 1.05, kind: "wait" }] },
        { label: "ASGI: req 3", step: 1, bars: [{ s: 0.1, e: 1.1, kind: "wait" }], done: "≈ 1 s" },
      ],
      note: { step: 2, text: "ASGI also supports WebSockets, streaming and lifespan events: connections that live longer than one request", tone: "amber" },
    },
    B(
      "WSGI, the classic interface used by Flask and Django, is synchronous. A worker takes one request and is tied up until it finishes, waiting included. To serve more at once, you add more threads or processes.",
      "ASGI is the asynchronous successor. One worker runs an event loop, so while one request waits on the database, the same worker serves others.",
      { say: "And ASGI isn't only about speed. It also supports WebSockets, streaming responses, and lifespan events: connections that outlive a single request, which WSGI simply can't express. That's why FastAPI is built on ASGI.", tone: "key" },
    ),
  ),

  // ---- Q3
  q(3, null, "What are Uvicorn and Gunicorn, and how do you run FastAPI in production?", "the server, the process manager, and how many processes", "Question three. What are Uvicorn and Gunicorn, and how do you run FastAPI in production?", "What each one does, and how you get more than one CPU core working."),
  {
    kind: "flow",
    title: "One Uvicorn process = one event loop = one CPU core",
    cols: 4,
    rows: 2,
    nodeW: 340,
    nodeH: 130,
    nodes: [
      { id: "g", label: "Gunicorn (on a VM)\nmanages workers, restarts crashes", c: 0, r: 0, tone: "amber", w: 420 },
      { id: "w1", label: "Uvicorn worker 1\nevent loop · core 1", c: 1, r: 0 },
      { id: "w2", label: "Uvicorn worker 2\nevent loop · core 2", c: 2, r: 0 },
      { id: "w3", label: "… one per core", c: 3, r: 0 },
      { id: "k", label: "In Kubernetes: one Uvicorn per container, scale with replicas", c: 1, r: 1, tone: "green", w: 900 },
    ],
    edges: [
      { from: "g", to: "w1" },
      { from: "w1", to: "w2" },
      { from: "w2", to: "w3" },
    ],
    show: [["w1"], ["g", "w2", "w3"], ["k"]],
    beats: B(
      "Uvicorn is the ASGI server. It accepts connections and runs your app. Each Uvicorn process runs one event loop, and so uses one CPU core.",
      "To use more cores on one machine, you run several worker processes. Gunicorn is a mature process manager that does that: it starts the workers, restarts any that crash, and handles graceful reloads. Uvicorn also has a workers flag of its own now.",
      { say: "In containers, the usual choice is simpler: one Uvicorn process per container, and the platform, like Kubernetes, scales the number of replicas. Either way, behind a reverse proxy or load balancer that handles TLS.", tone: "key" },
    ),
  },

  // ---- Q4
  q(4, 4, "How does FastAPI compare with Flask and Django?", "style, async, what's built in, and when to pick each", "Question four, asked in four write-ups. How does FastAPI compare with Flask and Django?", "Compare honestly, and finish with when you'd choose each one. Interviewers like hearing that the others still have their place."),
  {
    kind: "compare",
    title: "FastAPI vs Flask vs Django",
    cols: [
      { title: "FastAPI", icon: "⚡", tone: "blue", items: ["API-first, type-hint driven", "ASGI, async-first", "Validation and docs built in", "Bring your own ORM, auth, admin"] },
      { title: "Flask", icon: "🧪", tone: "cyan", items: ["Minimal micro-framework", "WSGI, sync at heart", "Extensions for everything", "Simple apps, lots of freedom"] },
      { title: "Django", icon: "🏛️", tone: "green", items: ["Batteries included: ORM, admin, auth", "Full-stack, server-rendered pages", "DRF for APIs; async growing", "Big apps with a database at the centre"] },
    ],
    footer: "APIs and ML/LLM services → FastAPI · small simple apps → Flask · a full product with admin → Django",
    beats: B(
      "FastAPI is API-first and driven by type hints. It's async-first on ASGI, and validation and docs are built in. But it doesn't bring an ORM, an admin panel, or user management: you pick those.",
      "Flask is a minimal micro-framework. Synchronous at heart, with extensions for everything, and lots of freedom. Great for small and simple apps.",
      "Django is batteries included: an ORM, migrations, an admin site, authentication, templates. With Django REST Framework for APIs, and async support that's growing.",
      { say: "So: for APIs and ML or LLM services, FastAPI. For a small, simple app, Flask is fine. For a full product with a database at its centre and an admin site, Django is very hard to beat.", tone: "key" },
    ),
  },
  check({
    topic: "workers",
    q: "Your FastAPI app runs as one Uvicorn process on an 8-core VM, and CPU sits at 12%. Why, and what do you change?",
    say: "Your FastAPI app runs as one Uvicorn process on an eight core VM, and CPU sits at twelve percent. Why, and what do you change?",
    a: "One process = one event loop = one core (100/8 ≈ 12%). Run several workers (Gunicorn or --workers), or more replicas.",
    aSay: "One Uvicorn process runs one event loop, which uses one core, and one core out of eight is about twelve percent. Run several workers, with Gunicorn or the workers flag, or more replicas in containers.",
  }),

  // ================================================================ module 2
  sec("2", "Requests and responses", "Module two. Requests and responses. How FastAPI decides where each parameter comes from, what it does with what you return, and the details of status codes, headers and files."),
  custom(
    "pypipe",
    {
      title: "The idea: a request's trip through FastAPI",
      stages: [
        { name: "Match route", icon: "🧭", sub: "method + path" },
        { name: "Extract", icon: "📥", sub: "path, query, body, headers" },
        { name: "Validate", icon: "🛡️", sub: "convert or 422" },
        { name: "Your function", icon: "🐍", sub: "returns data" },
        { name: "Serialise", icon: "📤", sub: "response_model → JSON" },
      ],
      steps: [
        { at: 0, text: "POST /ask/7?debug=true is matched to a route by its method and path." },
        { at: 1, text: "Each parameter is pulled from the right place: 7 from the path, debug from the query string, the JSON body for the model." },
        { at: 2, text: "Everything is converted to its declared type and validated. One problem, and the reply is a 422: your function never runs.", fail: true },
        { at: 3, text: "Your function runs with typed values, and returns a dict, a model, or a Response." },
        { at: 4, text: "The return value is filtered through response_model and turned into JSON. Status 200 unless you say otherwise.", back: true },
      ],
    },
    B(
      "Here's the idea: one request's trip through FastAPI. First, the route is matched by its method and path.",
      "Then every parameter is extracted from the right place: the path, the query string, the JSON body, headers or cookies.",
      "Everything is converted to its declared type and validated. If anything is wrong, the client gets a 422, and your function never runs.",
      "Your function runs with clean values, and returns a dict, a Pydantic model, or a Response object.",
      { say: "And on the way out, the return value is filtered through the response model and serialised to JSON. Five stages. Most questions in this module are about one of them.", tone: "key" },
    ),
  ),

  // ---- Q5
  q(5, null, "How do path parameters, query parameters and the request body work?", "FastAPI decides by how you declare each one", "Question five. How do path parameters, query parameters and the request body work?", "The rule FastAPI follows to decide where each parameter comes from."),
  {
    kind: "code",
    title: "Where a parameter comes from is decided by its declaration",
    lang: "python",
    code: `@app.get("/users/{user_id}/docs")
async def list_docs(
    user_id: int,                      # in the path string → path
    q: str | None = None,              # plain type, not in path → query
    limit: int = Query(20, le=100),    # query, with a constraint
):
    ...

@app.post("/users/{user_id}/docs")
async def add_doc(user_id: int, doc: DocIn):   # a model → JSON body
    ...`,
    highlight: [[1, 3], [4, 5], [9, 11]],
    beats: B(
      "FastAPI decides where each parameter comes from by how you declare it. A name that appears in the path string, in curly braces, is a path parameter. Here, user id, converted to an int: send abc, and you get a 422.",
      "A plain type that's not in the path, like a str, int or bool, is a query parameter. Give it a default, and it's optional. Query lets you add constraints, like a maximum of a hundred.",
      { say: "And a Pydantic model is the JSON request body. For anything else, you say so explicitly, with Header, Cookie, Form or File.", tone: "key" },
    ),
  },

  // ---- Q6
  q(6, null, "What is response_model, and why use it?", "the shape of the response: filtering, validation and docs", "Question six. What is response model, and why use it?", "What it does to your return value, and the security reason it matters."),
  {
    kind: "code",
    title: "response_model filters what leaves the server",
    lang: "python",
    code: `class UserIn(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    email: str                  # no password field

@app.post("/users", response_model=UserOut, status_code=201)
async def create_user(body: UserIn):
    user = await repo.create(body)    # has password_hash, is_admin…
    return user                       # only id and email go out`,
    highlight: [[1, 7], [9, 12]],
    beats: B(
      "Response model, or simply the return type annotation, tells FastAPI the shape of the response. Separate models for input and output is the usual pattern: User In has a password; User Out doesn't.",
      { say: "Then even if the function returns the full database object, with the password hash and internal flags, only the fields in User Out are sent. That's the security reason: it stops you leaking internal fields by accident. It also validates the output, and documents it in the OpenAPI schema.", tone: "key" },
    ),
  },

  // ---- Q7
  q(7, null, "How do you set status codes and return different kinds of responses?", "status_code, HTTPException, and Response classes", "Question seven. How do you set status codes and return different kinds of responses?", "The default, how to change it, and the Response classes, with one catch."),
  {
    kind: "code",
    title: "Status codes and response classes",
    lang: "python",
    code: `@app.post("/jobs", status_code=202)          # accepted
async def start_job(...): ...

@app.get("/docs/{id}")
async def get_doc(id: int):
    doc = await repo.get(id)
    if doc is None:
        raise HTTPException(404, "document not found")
    return doc                                # 200 + JSON by default

return JSONResponse({"detail": "..."}, status_code=409)
return StreamingResponse(gen(), media_type="text/event-stream")
return FileResponse("report.pdf")             # skips response_model`,
    highlight: [[1, 2], [4, 9], [11, 13]],
    beats: B(
      "By default, whatever you return becomes JSON with status 200. Status code on the decorator changes the default, like 201 for created, or 202 for accepted.",
      "For errors, raise HTTPException with the status and a detail message. It stops the function and becomes a JSON error response.",
      { say: "And you can return a Response class directly: JSONResponse, StreamingResponse, FileResponse, HTML or redirects. The catch: a Response returned directly skips response model validation, so you're responsible for what's in it.", tone: "key" },
    ),
  },

  // ---- Q8
  q(8, null, "How do you handle headers, cookies, forms and file uploads?", "explicit markers, and UploadFile for files", "Question eight. How do you handle headers, cookies, forms and file uploads?", "The markers to use, and the right way to accept a file."),
  {
    kind: "code",
    title: "Headers, cookies, forms, files",
    lang: "python",
    code: `@app.post("/upload")
async def upload(
    file: UploadFile,                        # spooled: memory, then disk
    title: str = Form(...),                  # multipart form field
    user_agent: str | None = Header(None),   # User-Agent header
    session: str | None = Cookie(None),
):
    while chunk := await file.read(1 << 20):  # 1 MB at a time
        await storage.write(chunk)
    return {"name": file.filename, "type": file.content_type}`,
    highlight: [[3, 6], [8, 10]],
    beats: B(
      "Headers, cookies and form fields are declared with Header, Cookie and Form. Header converts underscores to hyphens, so user agent reads the User Agent header. Forms and files need the python multipart package installed.",
      { say: "For files, use UploadFile, not bytes. UploadFile is a spooled temporary file: kept in memory up to a size, then moved to disk, with async read. Read it in chunks for big files. Bytes would load the whole thing into memory. And validate the size and type before you trust it.", tone: "key" },
    ),
  },
  check({
    topic: "parameters",
    q: "async def search(tenant: str, q: str, page: int = 1) on @app.get(\"/{tenant}/search\"). Where does each come from?",
    say: "A route at slash tenant slash search has a function with tenant, a string, q, a string, and page, an int with default one. Where does each come from?",
    a: "tenant: path (it's in the path string). q: a required query parameter. page: an optional query parameter (default 1).",
    aSay: "Tenant is in the path string, so it's a path parameter. Q is a plain type not in the path, with no default, so it's a required query parameter. And page is an optional query parameter, with a default of one.",
  }),

  // ================================================================ module 3
  sec("3", "Pydantic models in FastAPI", "Module three. Pydantic models in FastAPI. What happens when data is wrong, what changed in Pydantic two, and typed configuration."),
  {
    kind: "code",
    title: "The idea: bad data never reaches your function",
    lang: "json",
    code: `POST /ask   {"text": "", "top_k": "many"}

422 Unprocessable Entity
{
  "detail": [
    { "loc": ["body", "text"],  "msg": "String should have at least 1 character" },
    { "loc": ["body", "top_k"], "msg": "Input should be a valid integer" }
  ]
}`,
    highlight: [[1, 1], [3, 9]],
    beats: B(
      "Here's the idea of this module. A request arrives with an empty text and a top k of the word many.",
      { say: "FastAPI validates before calling your function, finds both problems, and replies 422, Unprocessable Entity, listing every error with its location and a message. Your function never ran. So inside your function, you can trust the data completely.", tone: "key" },
    ),
  },

  // ---- Q9
  q(9, 1, "How does FastAPI use Pydantic for validation, and what happens when validation fails?", "validated and converted before your code runs; 422 with details", "Question nine. How does FastAPI use Pydantic for validation, and what happens when validation fails?", "When validation happens, what the error looks like, and how you'd customise it."),
  {
    kind: "code",
    title: "Constraints and custom checks",
    lang: "python",
    code: `class AskIn(BaseModel):
    text: str = Field(min_length=1, max_length=4000)
    top_k: int = Field(5, ge=1, le=50)
    model: Literal["small", "large"] = "small"

    @field_validator("text")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("text is blank")
        return v.strip()

@app.exception_handler(RequestValidationError)
async def on_422(request, exc):     # your own error format
    return JSONResponse({"errors": exc.errors()}, status_code=422)`,
    highlight: [[1, 4], [6, 11], [13, 15]],
    beats: B(
      "Every typed parameter and every model is validated and converted before your function runs. Field adds constraints: lengths, ranges. Literal limits a value to a fixed set.",
      "A field validator adds your own rule, and can also clean the value, like stripping whitespace.",
      { say: "If anything fails, FastAPI raises a request validation error and returns 422 with the details. To match your company's error format, register an exception handler for request validation error.", tone: "key" },
    ),
  },

  // ---- Q10
  q(10, null, "What changed between Pydantic v1 and v2?", "a Rust core, renamed methods, and stricter defaults", "Question ten. What changed between Pydantic version one and version two?", "The speed, and the renames you'll meet in real code."),
  {
    kind: "compare",
    title: "Pydantic v1 → v2",
    cols: [
      { title: "v1", tone: "muted", items: [".dict(), .json()", "parse_obj(), parse_raw()", "@validator, @root_validator", "class Config: orm_mode = True"] },
      { title: "v2", tone: "green", items: [".model_dump(), .model_dump_json()", "model_validate(), model_validate_json()", "@field_validator, @model_validator", "model_config = ConfigDict(from_attributes=True)"] },
    ],
    footer: "v2's core is written in Rust (pydantic-core): validation is several times to tens of times faster",
    beats: B(
      "Version one used dot dict and dot json, parse obj, the validator decorators, and an inner Config class with orm mode.",
      "Version two renamed them: model dump and model dump json, model validate and model validate json, field validator and model validator, and model config with from attributes.",
      { say: "And the big change underneath: version two's core was rewritten in Rust, so validation is several times, up to tens of times, faster. Current FastAPI requires version two.", tone: "key" },
    ),
  },

  // ---- Q11
  q(11, null, "How do you manage configuration with pydantic-settings?", "typed config from the environment, validated at startup", "Question eleven. How do you manage configuration with pydantic settings?", "Typed config that fails at startup, and how to hand it out."),
  {
    kind: "code",
    title: "Settings: typed, validated, from the environment",
    lang: "python",
    code: `from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")
    database_url: str                     # required: no default
    openai_api_key: SecretStr             # hidden in logs and reprs
    llm_timeout_s: float = 30.0

@lru_cache
def get_settings() -> Settings:
    return Settings()                     # read once

@app.get("/health")
async def health(s: Settings = Depends(get_settings)): ...`,
    highlight: [[3, 7], [9, 11], [13, 14]],
    beats: B(
      "Pydantic settings loads typed, validated configuration from environment variables and dot env files. A required field with no default means a missing variable fails at startup, not on the first request that needs it. Secret str hides keys in logs.",
      "Wrap it in a cached function, so it's read once.",
      { say: "And hand it out with Depends rather than a global import. That way, tests can override the settings with dependency overrides. Which is exactly the next module.", tone: "key" },
    ),
  },
  check({
    topic: "422",
    q: "A request has a bad body. Does any line of your route function run before the 422 is returned?",
    say: "A request has an invalid body. Does any line of your route function run before the 422 is returned?",
    a: "No. Validation happens before the function is called; the 422 comes straight from FastAPI.",
    aSay: "No. Validation happens before your function is called, so the 422 comes straight from FastAPI, and none of your code runs.",
  }),

  // ================================================================ module 4
  sec("4", "Dependency injection", "Module four. Dependency injection, with Depends. Asked in four write-ups, and it's the feature that makes FastAPI apps testable."),
  {
    kind: "flow",
    title: "The idea: a route declares what it needs, FastAPI builds the tree",
    cols: 3,
    rows: 3,
    nodeW: 420,
    nodeH: 120,
    nodes: [
      { id: "r", label: "POST /ask\nasync def ask(user, db)", c: 1, r: 0, tone: "amber" },
      { id: "u", label: "get_current_user\n(token, db)", c: 0, r: 1 },
      { id: "d", label: "get_db\none session per request", c: 2, r: 1, tone: "green" },
      { id: "t", label: "oauth2_scheme\nreads the Bearer token", c: 0, r: 2 },
      { id: "s", label: "get_settings\ncached", c: 2, r: 2, tone: "cyan" },
    ],
    edges: [
      { from: "r", to: "u", label: "Depends" },
      { from: "r", to: "d", label: "Depends" },
      { from: "u", to: "t" },
      { from: "u", to: "d", label: "same session" },
      { from: "d", to: "s" },
    ],
    show: [["r"], ["u", "d"], ["t", "s"], []],
    beats: B(
      "Here's the idea. A route doesn't build what it needs. It declares it. Ask needs a user and a database session.",
      "FastAPI calls those dependencies for you, before the route runs. Get current user, and get db.",
      "And dependencies can declare dependencies of their own. The user needs the bearer token, and the db needs the settings. So they form a tree, and FastAPI resolves it, from the leaves up.",
      { say: "Notice that both the route and get current user need get db. Within one request, FastAPI calls it once and shares the result, so they use the same session. That's per-request caching.", tone: "key" },
    ),
  },

  // ---- Q12
  q(12, 4, "How does dependency injection work in FastAPI (Depends)?", "declare, resolve, reuse, and override", "Question twelve, asked in four write-ups. How does dependency injection work in FastAPI?", "What a dependency is, how they chain, and the three reasons to use them."),
  {
    kind: "code",
    title: "Depends: functions FastAPI calls for you",
    lang: "python",
    code: `async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    user = await users.from_token(db, token)
    if not user:
        raise HTTPException(401, "invalid token")
    return user

@app.post("/ask")
async def ask(body: AskIn, user: User = Depends(get_current_user)):
    ...

router = APIRouter(dependencies=[Depends(verify_api_key)])   # every route`,
    highlight: [[1, 8], [10, 12], [14, 14]],
    beats: B(
      "A dependency is just a function, or a class, that FastAPI calls before the route, injecting what it returns. It can declare parameters exactly like a route: query parameters, headers, or other dependencies. And it can raise HTTPException to stop the request, like a 401 here.",
      "The route asks for the user with Depends. If the dependency raises, the route never runs.",
      { say: "And you can attach dependencies to a whole router, or the whole app, for checks like an API key on every route.", tone: "key" },
    ),
  },
  {
    kind: "sayit",
    q: "How does dependency injection work in FastAPI?",
    lines: [
      "A dependency is a function or class that FastAPI calls before the route, injecting its result.",
      "Dependencies can depend on others: FastAPI resolves the tree, once per request.",
      "yield dependencies add setup and teardown, like a DB session.",
      "Use: auth, DB sessions, settings, shared clients, permissions: reusable, declared once.",
      "And testable: app.dependency_overrides swaps any of them for a fake.",
    ],
    beats: B(
      { say: "Said out loud.", tone: "ask" },
      "A dependency is a function or class that FastAPI calls before the route, and injects its return value.",
      "Dependencies can depend on other dependencies. FastAPI resolves the whole tree, and calls each one once per request.",
      "A dependency that yields gets setup and teardown, which is how you manage a database session.",
      "I use them for authentication, database sessions, settings, shared clients and permission checks: declared once, reused everywhere.",
      { say: "And they make the app testable, because dependency overrides can swap any of them for a fake.", tone: "key" },
    ),
  },

  // ---- Q13
  q(13, null, "What are yield dependencies, and how do you manage a database session with them?", "setup, the route, teardown: one session per request", "Question thirteen. What are yield dependencies, and how do you manage a database session with them?", "The shape, when each part runs, and the rules for sessions."),
  {
    kind: "seq",
    title: "A yield dependency: set up, hand over, clean up",
    actors: [
      { id: "f", name: "FastAPI", icon: "⚡" },
      { id: "d", name: "get_db()", icon: "🗄️", tone: "amber" },
      { id: "r", name: "the route", icon: "🐍", tone: "green" },
    ],
    msgs: [
      { from: "f", to: "d", label: "run up to yield: open a session", step: 0, tone: "amber" },
      { from: "f", to: "r", label: "call the route with the session", step: 1, tone: "green" },
      { from: "f", to: "d", label: "after: commit or roll back, close", step: 2, tone: "amber" },
    ],
    note: { step: 3, text: "One session per request; never a global session shared between requests", tone: "amber" },
    beats: B(
      "A dependency that yields works like a context manager. FastAPI runs it up to the yield. Here, that opens a database session.",
      "The yielded value is injected into the route, which runs.",
      "Once the route is done, FastAPI resumes the dependency after the yield, to clean up: commit, or roll back if something raised, and close the session.",
      { say: "The rule: one session per request, created and closed by a yield dependency. Never a global session shared across requests, because sessions aren't safe to share between concurrent requests.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "get_db with yield",
    lang: "python",
    code: `SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def get_db():
    async with SessionLocal() as session:   # setup
        try:
            yield session                   # the route runs
            await session.commit()
        except Exception:
            await session.rollback()
            raise
                                            # close: by async with`,
    highlight: [[1, 1], [3, 6], [7, 11]],
    beats: B(
      "The engine, with its connection pool, is created once for the app. The session maker produces one session per request.",
      "Get db opens a session, and yields it to the route.",
      { say: "After the route, it commits, or on an exception, rolls back and re-raises. The async with closes the session either way. Exactly the context manager pattern from Python module six.", tone: "key" },
    ),
  },

  // ---- Q14
  q(14, null, "How are dependencies cached, and how do you use classes as dependencies?", "once per request, use_cache=False, and callable classes", "Question fourteen. How are dependencies cached, and how do you use classes as dependencies?", "The per-request cache, how to turn it off, and parameterised dependencies with classes."),
  {
    kind: "code",
    title: "Cached per request; classes for configurable dependencies",
    lang: "python",
    code: `# get_db used by the route AND by get_current_user → called once
Depends(get_db, use_cache=False)        # opt out: a fresh call

class RateLimiter:
    def __init__(self, per_minute: int):
        self.per_minute = per_minute
    async def __call__(self, request: Request, redis=Depends(get_redis)):
        if await too_many(redis, request.client.host, self.per_minute):
            raise HTTPException(429, "slow down")

@app.post("/ask", dependencies=[Depends(RateLimiter(10))])
async def ask(...): ...`,
    highlight: [[1, 2], [4, 9], [11, 12]],
    beats: B(
      "Within one request, if several dependencies use the same function, FastAPI calls it once and reuses the result. That's why the route and the user lookup share one session. Pass use cache equals false to get a fresh call.",
      "A class can be a dependency too. A class with dunder call is perfect for a configurable dependency: the constructor takes the settings, like ten per minute, and call runs on each request.",
      { say: "So Depends of RateLimiter of ten gives you a rate limit you can tune per route. Remember the instance is created once, when the app starts; dunder call runs per request.", tone: "key" },
    ),
  },

  // ---- Q15
  q(15, null, "How do you override dependencies in tests?", "app.dependency_overrides: swap the real thing for a fake", "Question fifteen. How do you override dependencies in tests?", "One dictionary, and why it's the main reason to route things through Depends."),
  {
    kind: "code",
    title: "dependency_overrides: no monkeypatching needed",
    lang: "python",
    code: `class FakeLLM:
    async def complete(self, prompt): return "fake answer"

def test_ask():
    app.dependency_overrides[get_llm] = lambda: FakeLLM()
    app.dependency_overrides[get_current_user] = lambda: User(id=1)
    with TestClient(app) as client:
        r = client.post("/ask", json={"text": "hi"})
    assert r.status_code == 200
    assert r.json()["answer"] == "fake answer"
    app.dependency_overrides.clear()`,
    highlight: [[1, 2], [4, 6], [7, 11]],
    beats: B(
      "A fake LLM client: same method, canned answer. No network, no cost, and a predictable result.",
      "App dot dependency overrides maps the real dependency function to a replacement. Every route that depends on get llm now gets the fake, and the user lookup returns a test user.",
      { say: "Then call the route with the test client, assert, and clear the overrides. This is the main reason to get everything through Depends: database sessions, settings, auth, and LLM clients all become swappable in tests.", tone: "key" },
    ),
  },
  check({
    topic: "dependencies",
    q: "The route and get_current_user both Depends(get_db). How many sessions does one request open?",
    say: "The route and get current user both depend on get db. How many database sessions does one request open?",
    options: ["One", "Two", "One per query", "None until commit"],
    oSay: ["one", "two", "one per query", "none until commit"],
    answer: 0,
    a: "One. FastAPI caches a dependency's result within a request, so both get the same session (unless use_cache=False).",
    aSay: "A. One. FastAPI caches each dependency's result within a request, so the route and the user lookup share the same session, unless you pass use cache equals false.",
  }),
];
