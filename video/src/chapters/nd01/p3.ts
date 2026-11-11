import type { Scene } from "../../lib/types.ts";
import { B, custom, qa, sec } from "../web/h.ts";
import { check } from "./p1.ts";

// Part 3: module 7 (Express middleware and APIs), module 8 (errors and the
// process lifecycle) and module 9 (scaling and performance).
export const p3: Scene[] = [
  // ================================================================ module 7
  sec("7", "Express middleware and APIs", "Module seven. Express middleware and APIs. Six questions, and one picture: a request walking down a chain of functions."),
  custom(
    "pypipe",
    {
      title: "The idea: a request walks a chain of middleware, in order",
      stages: [
        { name: "helmet / cors", icon: "🛡️", sub: "headers" },
        { name: "express.json()", icon: "📥", sub: "parse body → req.body" },
        { name: "auth", icon: "🔑", sub: "req.user or 401" },
        { name: "route handler", icon: "🎯", sub: "res.json(...)" },
        { name: "error handler", icon: "🚑", sub: "(err, req, res, next)" },
      ],
      steps: [
        { at: 0, text: "Each middleware is (req, res, next). It can change req and res, end the response, or call next() to pass the request on." },
        { at: 1, text: "Order is the order of app.use: the body parser must come before the routes that read req.body." },
        { at: 2, text: "Auth either sets req.user and calls next(), or ends the request with 401: later middleware never runs." },
        { at: 3, text: "The matching route handler sends the response." },
        { at: 4, text: "Anything that calls next(err), or throws (or rejects, in Express 5), skips ahead to the error handler: four arguments, registered last.", fail: true },
      ],
    },
    B(
      "Here's the idea. In Express, a request walks down a chain of middleware functions, in the order you registered them. Each one gets the request, the response, and next. It can change them, end the response, or call next to pass the request along.",
      "So order matters. The JSON body parser must come before any route that reads req dot body.",
      "An auth middleware either attaches the user and calls next, or replies four oh one and stops. Nothing after it runs.",
      "The matching route handler sends the response.",
      { say: "And an error anywhere, passed to next, or thrown, skips straight to the error handler, the one with four arguments, registered last. Chain, order, next, and a final error handler: that's Express.", tone: "key" },
    ),
  ),
  qa(37, "What is middleware in Express, and what does next() do?", [
    "A function (req, res, next) that runs during the request–response cycle",
    "next() passes control to the next matching middleware; next(err) jumps to error handlers",
    "If it neither responds nor calls next, the request hangs",
  ]),
  qa(38, "Why does the order of middleware matter, and what is the difference between app.use and app.get?", [
    "Middleware runs in registration order: parsers, auth and logging must come before routes",
    "app.use(path, fn): any method, matches path prefixes: for middleware",
    "app.get(path, fn): only GET, exact route match: for handlers",
  ]),
  qa(39, "How do you handle errors in Express, including async errors?", [
    "An error-handling middleware with four arguments (err, req, res, next), registered last",
    "Express 4: async handlers must catch and call next(err) (or use a wrapper); Express 5 catches rejected promises itself",
    "Map errors to status codes; never leak stack traces in production",
  ], { code: `app.get("/users/:id", async (req, res) => {\n  const user = await repo.find(req.params.id);\n  if (!user) throw new NotFound("user");  // Express 5\n  res.json(user);\n});\n\napp.use((err, req, res, next) => {\n  res.status(err.status ?? 500)\n     .json({ error: err.expose ? err.message : "internal" });\n});` }),
  qa(40, "How do you organise routes with express.Router?", [
    "A mini-app per resource: const router = express.Router(); router.get(\"/\", …)",
    "Mount it with a prefix: app.use(\"/api/users\", usersRouter)",
    "Router-level middleware (auth for one area); layers: route → controller → service → repository",
  ]),
  qa(41, "What are the key principles of a good REST API in Node?", [
    "Resources as nouns, HTTP methods as verbs, correct status codes",
    "Validate input at the edge (Zod, Joi); a consistent error format",
    "Pagination, filtering, versioning; idempotent PUT/DELETE; docs with OpenAPI",
  ]),
  qa(42, "How do you handle CORS in an Express app?", [
    "Browsers block cross-origin reads unless the server sends Access-Control-Allow-* headers",
    "Use the cors middleware with an allow-list of origins, not \"*\" with credentials",
    "Preflight OPTIONS requests must be answered too; CORS doesn't protect the server itself",
  ]),

  // ================================================================ module 8
  sec("8", "Errors and process lifecycle", "Module eight. Errors and the process lifecycle. Four questions about failing well and shutting down cleanly."),
  qa(43, "What is the difference between operational errors and programmer errors?", [
    "Operational: expected failures of a correct program: timeouts, 404s, invalid input, DB down",
    "Programmer errors: bugs: undefined is not a function, wrong arguments",
    "Handle operational errors (retry, report, respond); for bugs, log and restart",
  ]),
  qa(44, "What should you do on uncaughtException and unhandledRejection?", [
    "Log the error with as much context as possible",
    "Then exit (process.exit(1)) and let the process manager restart you: the state may be corrupt",
    "Since Node 15, an unhandled rejection already crashes the process by default",
  ]),
  custom(
    "pypipe",
    {
      title: "Graceful shutdown on SIGTERM",
      stages: [
        { name: "SIGTERM", icon: "📮", sub: "from Kubernetes / Docker" },
        { name: "Stop accepting", icon: "🚧", sub: "server.close(); not ready" },
        { name: "Finish in-flight", icon: "⏳", sub: "requests, jobs" },
        { name: "Close resources", icon: "🔌", sub: "DB pool, Redis, queues" },
        { name: "Exit", icon: "✅", sub: "process.exit(0)" },
      ],
      steps: [
        { at: 0, text: "The orchestrator sends SIGTERM and waits a grace period (30 s in Kubernetes) before SIGKILL." },
        { at: 1, text: "Stop taking new work: server.close() stops new connections; fail the readiness probe so the load balancer stops routing." },
        { at: 2, text: "Let in-flight requests and jobs finish." },
        { at: 3, text: "Close the database pool, Redis, message consumers; flush logs." },
        { at: 4, text: "Exit 0, with a timer that force-exits if anything hangs." },
      ],
    },
    B(
      "Graceful shutdown, step by step. Kubernetes or Docker sends SIGTERM, and waits a grace period, thirty seconds by default, before killing the process outright.",
      "First, stop taking new work: server dot close stops new connections, and the readiness probe starts failing so the load balancer stops sending traffic.",
      "Then let the requests and jobs already in progress finish.",
      "Then close resources: the database pool, Redis, queue consumers, and flush the logs.",
      { say: "And exit with code zero, with a safety timer that forces the exit if something hangs. Without this, every deploy cuts off requests mid-flight.", tone: "key" },
    ),
  ),
  qa(45, "How do you implement graceful shutdown?", [
    "process.on(\"SIGTERM\") (and SIGINT): stop accepting, fail readiness",
    "server.close() and wait for in-flight work; close the DB, Redis and consumers",
    "process.exit(0), with a force-exit timeout as a backstop",
  ]),
  qa(46, "How should you do logging in a Node service?", [
    "Structured JSON logs with a fast logger (pino), to stdout; the platform collects them",
    "Levels; a request id on every line (AsyncLocalStorage); no secrets or personal data",
    "console.log is synchronous to terminals and unstructured: not for production",
  ]),
  check({
    topic: "process lifecycle",
    q: "On uncaughtException, a teammate logs the error and lets the server keep running. Why is that risky?",
    say: "On an uncaught exception, a teammate logs the error and lets the server keep running. Why is that risky?",
    a: "The process may be in an unknown state (half-finished operations, leaked resources, broken invariants). Log, exit, and let the process manager restart it.",
    aSay: "Because after an unexpected exception, the process may be in an unknown state: half-finished work, leaked connections, broken assumptions. Log it, exit, and let the process manager start a clean one.",
  }),

  // ================================================================ module 9
  sec("9", "Scaling and performance", "Module nine. Scaling and performance. Eight questions about using more than one core, and about memory."),
  {
    kind: "compare",
    title: "The idea: three ways to use more than one CPU core",
    cols: [
      { title: "cluster", icon: "🧬", tone: "blue", items: ["Copies of your server process", "Share one port; OS balances connections", "Scale an HTTP server across cores", "Often replaced by PM2 or k8s replicas"] },
      { title: "worker_threads", icon: "🧵", tone: "green", items: ["Threads in one process", "Own event loop and V8 isolate", "Message passing, SharedArrayBuffer", "CPU-heavy work: hashing, parsing, images"] },
      { title: "child_process", icon: "🚀", tone: "amber", items: ["A separate program", "spawn, exec, execFile, fork", "Run CLIs (ffmpeg, git), other languages", "Talk via stdio or IPC"] },
    ],
    beats: B(
      "Here's the idea. Cluster runs several copies of your server process, one per core. They share the same port, and connections are spread across them. Today that job is often done by PM2, or simply more container replicas.",
      "Worker threads run JavaScript on other threads in the same process, each with its own event loop. They talk by messages, or shared memory. They're for CPU-heavy work, so the main thread stays free.",
      { say: "And child process starts a completely separate program, like ffmpeg or a Python script, and talks to it through standard input and output. More copies of the server, more threads for computing, or another program.", tone: "key" },
    ),
  },
  qa(47, "What is the cluster module?", [
    "The primary process forks workers (one per core); each is a full copy of the app",
    "They share the server port; connections are distributed (round-robin on Linux)",
    "No shared memory: sessions and caches go to Redis; in containers prefer replicas",
  ]),
  qa(48, "What are worker_threads, and when should you use them?", [
    "Real threads running JavaScript, each with its own event loop and heap",
    "For CPU-bound work that would block the main loop: image resizing, PDF parsing, hashing",
    "Use a pool (piscina); not for I/O, which is already async",
  ]),
  qa(49, "What is the difference between cluster, worker_threads and child_process?", [
    "cluster: processes running your server, to scale HTTP across cores",
    "worker_threads: threads inside one process, for CPU-heavy JavaScript",
    "child_process: any external program, separate memory, communicate via stdio/IPC",
  ]),
  qa(50, "What is the difference between spawn, exec, execFile and fork?", [
    "spawn: start a command, stream its output: long-running or big output",
    "exec: runs in a shell, buffers the whole output: small commands; beware shell injection",
    "execFile: like exec without a shell (safer); fork: spawn a Node script with an IPC channel",
  ]),
  qa(51, "What causes memory leaks in Node, and how do you find them?", [
    "Unbounded caches and global arrays; listeners never removed; closures holding big objects; timers never cleared",
    "Symptoms: heap grows request after request, then GC thrash and an out-of-memory crash",
    "Find: heap snapshots in Chrome DevTools (--inspect), compare two; clinic heapprofiler",
  ]),
  qa(52, "How does garbage collection work in V8 (Node)?", [
    "Generational: new objects in the young generation, collected often and fast (Scavenge)",
    "Survivors are promoted to the old generation, collected by mark-sweep-compact, mostly concurrently",
    "Heap limit set by --max-old-space-size; containers should set it to fit the memory limit",
  ]),
  qa(53, "How do you improve the performance of a Node.js API?", [
    "Measure first: latency percentiles, event-loop lag, a CPU profile",
    "Never block the loop; parallelise independent I/O; connection pools and keep-alive",
    "Cache, paginate, stream, compress; fix slow queries and N+1; use all cores",
  ]),
  qa(54, "How do you add caching to a Node application?", [
    "In-process: an LRU (lru-cache) for small, per-instance data",
    "Shared: Redis with TTLs, cache-aside (read → miss → load → set); invalidate on writes",
    "HTTP caching: Cache-Control, ETag; a CDN for public content; prevent stampedes",
  ]),
  check({
    topic: "scaling",
    q: "Password hashing with bcrypt makes the login endpoint slow and stalls other requests. Cluster or worker_threads?",
    say: "Password hashing makes the login endpoint slow, and stalls other requests. Cluster or worker threads?",
    a: "Use the async bcrypt API (it runs in libuv's thread pool) or worker_threads for the CPU work. Cluster adds processes but each one's loop would still stall.",
    aSay: "Move the CPU work off the event loop: the async bcrypt API runs in libuv's thread pool, or use worker threads. Cluster only adds more processes, and each one's loop would still stall during hashing.",
  }),
];
