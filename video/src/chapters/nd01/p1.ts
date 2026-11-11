import type { Scene } from "../../lib/types.ts";
import { makeCheck } from "../checks.ts";
import { B, custom, qa, sec } from "../web/h.ts";

export const check = makeCheck();

// Part 1: the intro, module 1 (basics and architecture) and module 2 (the
// event loop).
export const p1: Scene[] = [
  {
    kind: "title",
    eyebrow: "Node.js · interview lecture",
    title: "Node.js, topic by topic",
    subtitle: "Every module of the Node.js page, the idea behind it, and every question on it",
    beats: B("Node dot js, topic by topic. This lecture follows the Node page exactly: twelve modules, every question, in the page's order and with its numbers. Each module starts with its idea as a picture, then the questions, then a check."),
  },

  // ================================================================ module 1
  sec("1", "Basics and architecture", "Module one. Basics and architecture. Ten questions, all answered by one picture of what's inside Node."),
  {
    kind: "flow",
    title: "The idea: one JavaScript thread, and libuv doing the waiting",
    cols: 3,
    rows: 3,
    nodeW: 470,
    nodeH: 130,
    nodes: [
      { id: "js", label: "your JavaScript\nruns on ONE thread", c: 0, r: 0, tone: "amber" },
      { id: "v8", label: "V8\ncompiles and runs JS, heap, GC", c: 0, r: 1 },
      { id: "api", label: "Node APIs\nfs, net, http, crypto (C++ bindings)", c: 1, r: 0 },
      { id: "uv", label: "libuv\nthe event loop + async I/O", c: 1, r: 1, tone: "cyan" },
      { id: "os", label: "OS async I/O\nsockets: epoll, kqueue, IOCP", c: 2, r: 1, tone: "green" },
      { id: "tp", label: "thread pool (4 by default)\nfs, dns.lookup, crypto, zlib", c: 1, r: 2, tone: "purple" },
    ],
    edges: [
      { from: "js", to: "v8" },
      { from: "js", to: "api", label: "calls" },
      { from: "api", to: "uv" },
      { from: "uv", to: "os", label: "network" },
      { from: "uv", to: "tp", label: "files, CPU" },
    ],
    show: [["js", "v8"], ["api", "uv"], ["os", "tp"], []],
    overlay: { step: 3, text: "When the I/O finishes, libuv queues your callback; the event loop runs it on the JS thread", tone: "amber" },
    beats: B(
      "Here's the idea of Node. Your JavaScript runs on one thread, inside V8, Google's engine, which compiles it and manages memory.",
      "When you read a file or open a socket, you call Node's APIs, which are bindings into C plus plus. They hand the work to libuv, a C library that runs the event loop and does asynchronous I/O.",
      "For network sockets, libuv asks the operating system to watch them, with epoll, kqueue or IOCP, so no thread waits at all. For things the OS can't do asynchronously, like file reads, DNS lookups, crypto and compression, libuv uses a small thread pool, four threads by default.",
      { say: "When the work finishes, libuv queues your callback, and the event loop runs it back on the one JavaScript thread. So Node is single-threaded for your code, and multi-threaded underneath. That sentence answers half this module.", tone: "key" },
    ),
  },
  qa(1, "What is Node.js, and when should (and shouldn't) you use it?", [
    "A JavaScript runtime outside the browser: V8 plus libuv plus a standard library",
    "Great for I/O-heavy work: APIs, real-time apps, BFFs, streaming, tooling",
    "Not for CPU-heavy work on the main thread (video encoding, big number crunching) without worker threads",
  ]),
  qa(2, "How is JavaScript in Node different from JavaScript in the browser?", [
    "No DOM or window; instead fs, http, process, Buffer, streams",
    "Module systems: CommonJS and ES modules; you control the Node version",
    "Full system access: files, network, processes; no sandbox",
  ]),
  qa(3, "What are V8 and libuv, and what does each one do?", [
    "V8: Google's JavaScript engine: parses, JIT-compiles and runs JS, manages the heap and GC",
    "libuv: C library for the event loop, async I/O, the thread pool, timers",
    "Node glues them together with C++ bindings and the core modules",
  ]),
  qa(4, "Is Node.js single-threaded?", [
    "Your JavaScript runs on one main thread, with one event loop",
    "But libuv's thread pool and the OS handle I/O in parallel",
    "And you can add threads (worker_threads) or processes (cluster) yourself",
  ]),
  qa(5, "How does Node handle thousands of concurrent requests with one thread?", [
    "Each request does a little JavaScript, then waits on I/O (database, network)",
    "Waiting doesn't occupy the thread: the OS watches thousands of sockets at once",
    "When data arrives, the callback runs: the thread is only busy while computing",
  ]),
  qa(6, "What is the difference between blocking and non-blocking I/O?", [
    "Blocking: the thread waits until the operation finishes (fs.readFileSync)",
    "Non-blocking: start the operation, carry on, get a callback or promise later",
    "In a server, one blocking call stalls every request: use the async APIs",
  ]),
  custom(
    "pylanes",
    {
      title: "Thread-per-request (Spring MVC) vs one event loop (Node)",
      sub: "4 requests, each: 0.1 s of work, 1 s waiting on the database",
      max: 1.6,
      legend: false,
      rows: [
        { label: "Spring thread 1", step: 0, bars: [{ s: 0, e: 0.1, kind: "run" }, { s: 0.1, e: 1.1, kind: "wait", text: "blocked on DB" }] },
        { label: "Spring thread 2", step: 0, bars: [{ s: 0, e: 0.1, kind: "run" }, { s: 0.1, e: 1.1, kind: "wait", text: "blocked on DB" }] },
        { label: "Node: one thread", step: 1, bars: [{ s: 0, e: 0.1, kind: "run", text: "r1" }, { s: 0.1, e: 0.2, kind: "run", text: "r2" }, { s: 0.2, e: 0.3, kind: "run", text: "r3" }, { s: 0.3, e: 0.4, kind: "run", text: "r4" }, { s: 1.1, e: 1.2, kind: "run" }, { s: 1.2, e: 1.3, kind: "run" }, { s: 1.3, e: 1.4, kind: "run" }, { s: 1.4, e: 1.5, kind: "run" }], done: "all 4" },
      ],
      note: { step: 2, text: "Spring: a thread (~1 MB stack) waits per request. Node: the waits overlap for free; only computing uses the thread. Java 21 virtual threads close much of the gap.", tone: "amber" },
    },
    B(
      "Compare with Spring's classic model. Every request gets a thread, and while the database query runs, that thread just waits. A thousand slow requests need a thousand threads, each with its own stack.",
      "Node does each request's tiny bit of work on one thread, and while they all wait on the database, the thread is free for the others. When the replies come back, it finishes each one.",
      { say: "So Node shines when requests mostly wait, and suffers when they compute, because computing blocks everyone. And mention that Java twenty one's virtual threads give Spring much of the same benefit.", tone: "key" },
    ),
  ),
  qa(7, "How is Node's model different from Java Spring's thread-per-request model?", [
    "Spring MVC: one thread per request, blocking calls; simple code, threads are the limit",
    "Node: one event loop, non-blocking calls; huge concurrency for I/O, but CPU work blocks all",
    "Spring WebFlux is reactive like Node; Java 21 virtual threads make blocking cheap again",
  ]),
  qa(8, "What is the reactor pattern in Node.js?", [
    "One loop waits for I/O events (the demultiplexer: epoll, kqueue, IOCP)",
    "Each event is dispatched to its registered handler (your callback)",
    "Handlers must be quick and non-blocking so the loop can keep reacting",
  ]),
  qa(9, "What are Node's important global objects?", [
    "process, Buffer, globalThis (global), console",
    "Timers: setTimeout, setInterval, setImmediate, queueMicrotask",
    "Web-standard: fetch, URL, AbortController, TextEncoder, structuredClone; __dirname only in CommonJS",
  ]),
  qa(10, "What is the process object used for?", [
    "process.env (config), process.argv (CLI arguments), process.exit(code)",
    "Signals and lifecycle: process.on(\"SIGTERM\"), uncaughtException, unhandledRejection",
    "Info: process.memoryUsage(), cpuUsage(), pid, platform, version; nextTick",
  ]),
  check({
    topic: "architecture",
    q: "A Node API does fs.readFileSync on a 50 MB file inside a request handler. What happens to the other requests?",
    say: "A Node API reads a fifty megabyte file with read file sync, inside a request handler. What happens to the other requests?",
    a: "They all wait: the sync call blocks the only JavaScript thread until the read finishes. Use the async API or a stream.",
    aSay: "They all wait. The sync call blocks the one JavaScript thread until the whole file is read. Use the async version, or better, a stream.",
  }),

  // ================================================================ module 2
  sec("2", "The event loop", "Module two. The event loop. Five questions, and the most technical module of the page. It starts with the loop's phases."),
  custom(
    "pytape",
    {
      title: "The idea: Node's event loop goes round six phases",
      sub: "and between every callback, it drains nextTick, then promise microtasks",
      cells: ["timers", "pending", "idle", "poll", "check", "close"],
      idx: false,
      steps: [
        { ptr: 0, label: "timers", out: "expired setTimeout / setInterval callbacks" },
        { ptr: 1, label: "pending", out: "some deferred system callbacks (TCP errors)" },
        { ptr: 3, label: "poll", out: "I/O callbacks; waits here for new events if nothing else is due" },
        { ptr: 4, label: "check", out: "setImmediate callbacks" },
        { ptr: 5, label: "close", out: "close events (socket.on(\"close\"))", note: "then back to timers" },
        { ptr: 3, label: "after EVERY callback", out: "process.nextTick queue, then the promise microtask queue", note: "microtasks don't wait for a phase: they run as soon as the current callback ends" },
      ],
    },
    B(
      "Here's the idea of the module. Node's event loop goes round in phases. First, timers: callbacks of set timeouts and intervals whose time is up.",
      "Then pending callbacks: a few system callbacks deferred from the last round, like some TCP errors.",
      "Then the poll phase, the heart of the loop. It runs I/O callbacks, like a file read or an incoming request. If nothing else is due, the loop waits here for new events.",
      "Then check: set immediate callbacks.",
      "Then close callbacks, like a socket's close event, and around again to timers.",
      { say: "And between every single callback, in any phase, Node drains two queues: first everything queued with process dot next tick, then all promise microtasks. Phases for the big callbacks, and those two queues in between. That's the whole model.", tone: "key" },
    ),
  ),
  qa(11, "What are the phases of Node's event loop?", [
    "timers → pending callbacks → idle/prepare → poll (I/O) → check (setImmediate) → close callbacks",
    "Each phase has a queue of callbacks; the loop runs them, then moves on",
    "nextTick and promise microtasks run between callbacks, not as a phase",
  ]),
  qa(12, "What is the difference between process.nextTick, promise microtasks, setImmediate and setTimeout(0)?", [
    "nextTick: runs right after the current operation, before promise microtasks",
    "Promise callbacks: right after the nextTick queue",
    "setImmediate: the check phase, after I/O in this turn",
    "setTimeout(fn, 0): the timers phase (at least 1 ms); vs setImmediate the order is random at the top level, but setImmediate wins inside an I/O callback",
  ], { ask: "Question 12. What's the difference between process next tick, promise microtasks, set immediate, and set timeout zero?" }),
  custom(
    "chipcols",
    {
      title: "Predict the output",
      sub: "log(\"A\"); setTimeout(→ \"B\"); setImmediate(→ \"C\"); Promise.resolve().then(→ \"D\"); process.nextTick(→ \"E\"); log(\"F\")",
      cols: [
        { title: "STACK", stack: true },
        { title: "NEXTTICK" },
        { title: "PROMISES" },
        { title: "TIMERS" },
        { title: "CHECK" },
      ],
      steps: [
        { cols: [["script"], ["→ E"], ["→ D"], ["→ B"], ["→ C"]], out: "A F", note: "the script runs: A and F print; four callbacks are queued" },
        { cols: [["→ E"], [], ["→ D"], ["→ B"], ["→ C"]], out: "A F E", note: "script done: the nextTick queue first" },
        { cols: [["→ D"], [], [], ["→ B"], ["→ C"]], out: "A F E D", note: "then promise microtasks" },
        { cols: [[], [], [], [], []], out: "A F E D B C", note: "then the loop: timers (B) and check (C); at top level B/C can swap, inside an I/O callback C comes first" },
      ],
    },
    B(
      "Let's predict one. The script logs A, schedules a timeout B, an immediate C, a promise D, and a next tick E, and logs F. A and F print first: synchronous code always finishes.",
      "The script is done, so the next tick queue runs. E.",
      "Then promise microtasks. D.",
      { say: "Then the event loop proper. Timers, B, and the check phase, C. One honest caveat: at the top level of a script, a zero timeout and an immediate can come in either order, depending on how fast the loop starts. Inside an I/O callback, set immediate always comes first. So: A, F, E, D, then B and C.", tone: "key" },
    ),
  ),
  qa(13, "Predict the output of mixed nextTick, promises and timers.", [
    "1. synchronous code; 2. all nextTicks; 3. all promise microtasks",
    "4. timers phase (setTimeout); 5. check phase (setImmediate)",
    "Recursive nextTick can starve the loop: I/O never gets a turn",
  ]),
  qa(14, "What does \"don't block the event loop\" mean, and how do you avoid it?", [
    "Every request shares one thread: a 200 ms computation adds 200 ms to everyone",
    "Culprits: sync fs/crypto, big JSON.parse/stringify, heavy regex (ReDoS), large loops",
    "Fixes: async APIs, streams, chunk work with setImmediate, worker_threads, or a job queue",
  ]),
  qa(15, "How do you detect that the event loop is blocked or lagging?", [
    "Measure event-loop delay: perf_hooks.monitorEventLoopDelay() (p99), or a timer's lateness",
    "Event-loop utilisation (performance.eventLoopUtilization), APM tools, clinic.js doctor",
    "Find the cause with a CPU profile (--cpu-prof, clinic flame) and alert on lag",
  ]),
  check({
    topic: "event loop",
    q: "Promise.resolve().then(() => log(\"P\")); process.nextTick(() => log(\"N\")). Which prints first?",
    say: "A resolved promise logs P in its then, and process next tick logs N. Which prints first?",
    a: "N: the nextTick queue is drained before promise microtasks.",
    aSay: "N. Node drains the next tick queue before the promise microtask queue.",
  }),
];
