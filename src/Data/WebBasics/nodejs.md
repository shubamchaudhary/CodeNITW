## Basics and architecture

### nd01 | What is Node.js, and when should (and shouldn't) you use it?

**Node.js** is a **JavaScript runtime** that runs JS outside the browser. It's built on Google's **V8** engine (which executes JS) and **libuv** (a C library for async I/O, the event loop and the thread pool). It's not a language and not a framework.

Its model: **single-threaded, event-driven, non-blocking I/O**. One thread runs your JS. Slow operations (network, disk, DB) are handed off, and their callbacks run when they finish.

**Good fit (I/O-bound work):**
- REST and GraphQL APIs, BFFs (backend-for-frontend), API gateways
- Real-time apps: chat, notifications, live dashboards (WebSockets)
- Streaming (file uploads, proxies), microservices
- Tooling: build tools, CLIs (npm, Vite, ESLint all run on Node)
- Sharing code and types with a JS/TS frontend

**Poor fit (CPU-bound work):**
- Heavy computation (video encoding, ML, large data crunching): it blocks the single thread and every other request waits. It can be done with `worker_threads`, but Java, Go or Rust are often better.

Interview framing: Node handles **many concurrent connections cheaply** because it doesn't dedicate a thread to each one.

### nd02 | How is JavaScript in Node different from JavaScript in the browser?

The **language** is the same (V8 runs it in Chrome too). The **environment and APIs** differ:

| | Browser | Node.js |
|---|---|---|
| Global object | `window` | `global` (both have `globalThis`) |
| DOM / BOM | `document`, `window.location`, `localStorage` | none |
| System access | sandboxed | file system, OS, processes, network sockets (`fs`, `os`, `child_process`, `net`) |
| Modules | ES modules (`<script type="module">`) | CommonJS (`require`) **and** ES modules |
| Process info | none | `process` (env vars, args, exit, signals) |
| Event loop | HTML spec (tasks, microtasks, rendering) | libuv phases (timers, poll, check, …) + `process.nextTick` |
| JS version | depends on the user's browser | **you control it** (the Node version on your server) |
| Security | runs untrusted code safely | full OS privileges: be careful with input |

Shared APIs now exist in both: `fetch`, `URL`, `AbortController`, `TextEncoder`, `structuredClone`, web streams, `crypto.randomUUID()`.

### nd03 | What are V8 and libuv, and what does each one do?

**V8** (from Google, written in C++):
- **Parses and executes JavaScript**: it compiles JS to machine code with a JIT (Ignition interpreter + TurboFan optimising compiler).
- Manages the **heap** and **garbage collection**, and the call stack.
- Knows nothing about files, networks or timers.

**libuv** (written in C):
- Provides the **event loop**.
- **Asynchronous I/O** across operating systems: it uses the OS's own non-blocking mechanisms (**epoll** on Linux, **kqueue** on macOS, **IOCP** on Windows) for network sockets.
- A **thread pool** (4 threads by default) for operations the OS can't do asynchronously: most **file system** calls, **DNS lookup** (`dns.lookup`), some **crypto** (`pbkdf2`, `scrypt`, `randomBytes`) and **zlib** compression.
- Timers, child processes, signals, pipes.

**Node's bindings** (C++) glue them together: your `fs.readFile` call in JS goes through a binding into libuv, and libuv later queues your callback back onto the JS thread.

One-liner for interviews: *"V8 runs the JavaScript; libuv makes it asynchronous."*

### nd04 | Is Node.js single-threaded?

**Your JavaScript runs on one main thread**, but **Node itself is multi-threaded**:

1. **Main thread**: runs your JS and the event loop. Only one piece of your JS executes at a time.
2. **libuv thread pool** (default 4 threads, `UV_THREADPOOL_SIZE` up to 1024): does blocking work like file I/O, `dns.lookup`, crypto (`pbkdf2`, `scrypt`) and zlib in the background.
3. **V8's own threads**: garbage collection and JIT compilation happen in the background.
4. **OS kernel async I/O**: network sockets don't need the pool at all; the OS notifies libuv (epoll/kqueue/IOCP).
5. **Optional extra JS threads**: `worker_threads` (each with its own V8 instance and event loop), and `cluster` / `child_process` (separate processes).

So: "single-threaded" describes the **programming model** (no locks or race conditions on shared variables in normal code), not the runtime.

### nd05 | How does Node handle thousands of concurrent requests with one thread?

Because most web-server work is **waiting** (for the DB, other APIs, disk), not computing. Node **never waits**: it starts the I/O, registers a callback, and moves on to the next request.

```js
app.get("/user/:id", async (req, res) => {
  const user = await db.findUser(req.params.id);   // the thread is FREE while the DB works
  res.json(user);
});
```

Timeline for 1,000 concurrent requests:
1. Request 1 arrives → the handler starts a DB query → it **yields** (`await`).
2. The thread immediately handles request 2, 3, … each one starting its own I/O.
3. When the OS or libuv reports "query 1 finished", its continuation is queued and runs on the main thread.

Each pending request costs only some memory (a closure/promise), not a whole thread with its own ~1MB stack. That's why Node scales well for **I/O-heavy** workloads, like nginx.

The flip side: if one request does **CPU-heavy** work (a 2-second loop, `JSON.parse` of a huge payload, a sync crypto call), **every** request waits. The golden rule is **don't block the event loop**.

### nd06 | What is the difference between blocking and non-blocking I/O?

- **Blocking**: the call **waits** until the operation completes; the thread can do nothing else meanwhile.
- **Non-blocking**: the call **returns immediately**; the result arrives later through a callback, promise or event.

```js
const fs = require("fs");

// BLOCKING: the whole server stalls until the file is read
const data = fs.readFileSync("big.json", "utf8");
console.log("after");                 // only after the read

// NON-BLOCKING
fs.readFile("big.json", "utf8", (err, data) => { /* later */ });
console.log("after");                 // runs immediately

// promise version (modern)
const text = await fs.promises.readFile("big.json", "utf8");
```

When **sync** APIs are fine: at **startup** (reading config before the server listens), and in CLI scripts. Never use them inside request handlers.

### nd07 | How is Node's model different from Java Spring's thread-per-request model?

**Spring MVC (Tomcat), the classic model**: each request gets a **thread from a pool** (e.g. 200 threads). The thread **blocks** while waiting for the DB. Concurrency is limited by the number of threads; each thread costs memory (~1MB stack) and context-switching.

**Node**: **one thread + an event loop**; I/O is non-blocking. Thousands of concurrent connections, each costing a little memory, no thread switching.

| | Node.js | Spring MVC (classic) |
|---|---|---|
| Concurrency | event loop, async I/O | thread per request |
| Waiting on I/O | the thread serves others | the thread is parked |
| CPU-heavy work | blocks everyone (needs workers) | only blocks its own thread; uses every core naturally |
| Multi-core | needs cluster / multiple processes | one JVM uses every core |
| Shared-state bugs | rare (one thread) | races, so locks and synchronisation are needed |
| Code style | async/await everywhere | simple, sequential, blocking code |

Modern Java narrows the gap:
- **Spring WebFlux** (reactive, Netty): an event-loop model like Node.
- **Virtual threads** (Java 21, Project Loom): blocking-style code where waiting virtual threads don't hold OS threads, so you get Node-like scalability with simple code.

A good interview answer: *Node shines for I/O-bound, high-concurrency services and JS-heavy teams; Java shines for CPU-heavy work, strong typing at scale and a mature enterprise ecosystem. With virtual threads, the concurrency gap is mostly gone.*

### nd08 | What is the reactor pattern in Node.js?

The **reactor pattern** is the design behind Node's event loop:

1. The application asks to perform an I/O operation and supplies a **handler** (callback). The request goes to the **event demultiplexer** (libuv on top of epoll/kqueue/IOCP). The call returns immediately: **non-blocking**.
2. When a set of I/O operations completes, the demultiplexer pushes **events** into the **event queue**.
3. The **event loop** iterates over the queue.
4. For each event, it invokes the associated **handler** on the main thread.
5. A handler may start more I/O, and the cycle continues. When nothing is pending, the process exits.

In one line: *"Handle I/O by registering a handler and reacting when the event happens, instead of blocking until it does."* It's the same idea as nginx and Netty.

### nd09 | What are Node's important global objects?

Available everywhere without `require`:

- **`process`**: info about and control of the current process (env vars, argv, exit, signals, memory usage).
- **`global` / `globalThis`**: the global object.
- **`console`**, **timers** (`setTimeout`, `setInterval`, `setImmediate`, `queueMicrotask`).
- **`Buffer`**: binary data.
- **Web-standard APIs**: `fetch`, `URL`, `URLSearchParams`, `AbortController`, `TextEncoder`, `structuredClone`, `crypto` (Web Crypto), `performance`.

Module-scoped in **CommonJS** (they look global but are function parameters injected per file):
- `require`, `module`, `exports`, `__filename`, `__dirname`

In **ES modules** these don't exist; use:
```js
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
// Node 20.11+: import.meta.dirname and import.meta.filename
```

Avoid putting your own data on `global`: it causes hidden coupling, just like browser globals.

### nd10 | What is the process object used for?

`process` is the bridge between your code and the running OS process.

```js
process.env.PORT;              // environment variables (always strings)
process.argv;                  // ["node", "/path/app.js", ...userArgs]
process.cwd();                 // current working directory
process.pid;
process.platform;              // "linux", "win32", "darwin"
process.memoryUsage();         // { rss, heapTotal, heapUsed, external, ... }
process.uptime();
process.hrtime.bigint();       // high-resolution timer for benchmarking

process.exitCode = 1;          // preferred: let pending work finish, then exit with 1
process.exit(1);               // immediate: may cut off pending writes and logs

process.on("SIGTERM", shutdown);              // container or orchestrator stop signal
process.on("unhandledRejection", (reason) => { /* log, then exit */ });
process.on("uncaughtException", (err) => { /* log, then exit */ });

process.nextTick(fn);           // highest-priority microtask
process.stdout.write("no newline");
```

Exit codes: `0` means success, anything else means failure, and orchestrators (Kubernetes, PM2, CI) act on them.

## The event loop

### nd11 | What are the phases of Node's event loop?

Each iteration (**tick**) of libuv's loop goes through these phases in order. Each phase has a FIFO queue of callbacks:

1. **Timers**: callbacks of `setTimeout`/`setInterval` whose time has come.
2. **Pending callbacks**: some system-level I/O callbacks deferred from the previous loop (e.g. certain TCP errors).
3. **Idle, prepare**: internal use.
4. **Poll**: fetch new I/O events and run their callbacks (most of your I/O callbacks: sockets, `fs` results). If nothing else is scheduled, the loop **waits here** for I/O, up to the next timer.
5. **Check**: `setImmediate` callbacks.
6. **Close callbacks**: e.g. `socket.on("close")`.

**Between every callback** (Node 11+), Node drains:
1. the **`process.nextTick` queue**, then
2. the **promise microtask queue** (`then`, `await` continuations, `queueMicrotask`),

repeating until both are empty.

```
   ┌──────────── timers ─────────────┐
   │      pending callbacks          │
   │      idle, prepare              │
   │      poll  (I/O; may wait here) │
   │      check (setImmediate)       │
   └────────── close callbacks ──────┘
   (nextTick + promise microtasks after each callback)
```

The process exits when no timers, I/O, handles or `setImmediate`s remain (unless something is `ref`'d).

### nd12 | What is the difference between process.nextTick, promise microtasks, setImmediate and setTimeout(0)?

| API | Runs | Priority |
|---|---|---|
| `process.nextTick(fn)` | right after the current operation, **before promise microtasks** | highest |
| `Promise.then`/`await`/`queueMicrotask` | after the nextTick queue is empty | high |
| `setTimeout(fn, 0)` | the **timers** phase of a later loop iteration (min 1ms) | macrotask |
| `setImmediate(fn)` | the **check** phase, right after poll | macrotask |

```js
setTimeout(() => console.log("timeout"), 0);
setImmediate(() => console.log("immediate"));
Promise.resolve().then(() => console.log("promise"));
process.nextTick(() => console.log("nextTick"));
console.log("sync");
// sync, nextTick, promise, then "timeout" and "immediate" in EITHER order
```

**setTimeout vs setImmediate in the main module is not deterministic**: it depends on whether 1ms has already passed when the loop starts (process performance). But **inside an I/O callback, `setImmediate` always runs first**, because the check phase comes right after poll:

```js
require("fs").readFile(__filename, () => {
  setTimeout(() => console.log("timeout"), 0);
  setImmediate(() => console.log("immediate"));
});
// always: immediate, timeout
```

Guidance: prefer `setImmediate` (or `queueMicrotask`) over `nextTick` for deferring work; use `nextTick` only when something must run before any other I/O (e.g. emitting an event after the constructor returns).

### nd13 | Predict the output of mixed nextTick, promises and timers.

```js
console.log("1: sync start");

setTimeout(() => {
  console.log("2: timeout");
  Promise.resolve().then(() => console.log("3: promise in timeout"));
  process.nextTick(() => console.log("4: nextTick in timeout"));
}, 0);

setImmediate(() => console.log("5: immediate"));

Promise.resolve().then(() => {
  console.log("6: promise");
  process.nextTick(() => console.log("7: nextTick in promise"));
});

process.nextTick(() => {
  console.log("8: nextTick");
  Promise.resolve().then(() => console.log("9: promise in nextTick"));
});

console.log("10: sync end");
```

Output (verified on Node 26):
```
1: sync start
10: sync end
8: nextTick
6: promise
9: promise in nextTick
7: nextTick in promise
2: timeout            <- these two blocks can swap places (main-module timeout vs immediate)
4: nextTick in timeout
3: promise in timeout
5: immediate
```

Reasoning:
- Sync code first: 1, 10.
- Drain the **nextTick queue**: 8 (it queues promise 9).
- Drain the **promise queue**: 6 (it queues nextTick 7), then 9, which was queued meanwhile. The promise queue is drained **completely** before Node goes back to the nextTick queue.
- The nextTick queue again: 7.
- Event loop: timers → 2, then its nextTick 4 **before** its promise 3. Then check → 5.

Common wrong answer: "7 before 9". It isn't, because Node finishes the current promise microtask queue before returning to the nextTick queue.

### nd14 | What does "don't block the event loop" mean, and how do you avoid it?

While a callback runs, **nothing else runs**: no other requests, timers or I/O callbacks. If one request spends 500ms on CPU work, every concurrent request waits 500ms. Latency spikes for everyone, and health checks may fail.

Common ways to block it:
- `*Sync` APIs in request paths (`readFileSync`, `execSync`, `crypto.pbkdf2Sync`)
- `JSON.parse`/`JSON.stringify` on huge payloads
- Heavy loops: sorting or filtering large arrays, image or PDF processing, compression
- **Catastrophic regexes** (ReDoS): `/(a+)+$/` on malicious input
- Infinite or very long synchronous loops

Fixes:
```js
// 1. Use async APIs
await fs.promises.readFile(p);
crypto.pbkdf2(pw, salt, 100000, 64, "sha512", cb);   // runs on the thread pool

// 2. Partition the work: yield to the loop between chunks
async function processInChunks(items) {
  for (let i = 0; i < items.length; i += 1000) {
    items.slice(i, i + 1000).forEach(work);
    await new Promise((r) => setImmediate(r));        // let other callbacks run
  }
}

// 3. Offload CPU work to worker_threads (or a separate service or queue)
```

Also: limit request body sizes, stream big data instead of buffering it, and avoid regexes with nested quantifiers on user input.

### nd15 | How do you detect that the event loop is blocked or lagging?

**Event loop lag**: how late timers fire compared with when they should. Healthy is a few ms; hundreds of ms means something is blocking.

```js
// built-in histogram
const { monitorEventLoopDelay } = require("node:perf_hooks");
const h = monitorEventLoopDelay({ resolution: 20 });
h.enable();
setInterval(() => {
  console.log(`p99 loop delay: ${(h.percentile(99) / 1e6).toFixed(1)}ms`);
  h.reset();
}, 5000);

// event loop utilisation (how busy the loop is, from 0 to 1)
const { performance } = require("node:perf_hooks");
let last = performance.eventLoopUtilization();
setInterval(() => {
  const elu = performance.eventLoopUtilization(last);
  console.log("ELU", elu.utilization.toFixed(2));
  last = performance.eventLoopUtilization();
}, 5000);
```

Finding **what** blocks it:
- `node --cpu-prof app.js`, or the Chrome DevTools profiler via `node --inspect`, to find hot functions.
- **clinic.js** (`clinic doctor`, `clinic flame`) for flame graphs.
- APM tools (Datadog, New Relic) report event loop lag per service.

Use loop lag as an **alert metric** and for **load shedding** (return 503 when the lag is too high, e.g. with the `under-pressure` plugin).

## Modules and npm

### nd16 | How does require() work?

`require("x")` loads a CommonJS module **synchronously**:

1. **Resolve** the path: core modules (`fs`, `node:fs`) → relative or absolute paths (`./x`, trying `.js`, `.json`, `.node`, then `x/index.js` or the `main` in package.json) → `node_modules` folders, walking up the directory tree.
2. **Check the cache** (`require.cache`): if the module was already loaded, return its existing `module.exports`.
3. **Load and wrap**: the file's code is wrapped in a function:
   ```js
   (function (exports, require, module, __filename, __dirname) {
     // your module code
   });
   ```
   This is why every file has its own scope and these "globals".
4. **Execute** the wrapper.
5. **Return `module.exports`**.

Consequences:
- **Modules are singletons**: the module code runs **once**; every later `require` gets the same object. That's handy for shared config or a DB connection pool.
- **Circular dependencies**: A requires B while B requires A, so B gets A's **partially filled** exports. Avoid them, or require inside functions.
- `require` is synchronous, so keep it at the top of the file, not in hot code paths.

### nd17 | What is the difference between module.exports and exports?

`exports` is just a **shortcut variable** that initially points at the same object as `module.exports`. **What `require` returns is always `module.exports`.**

```js
// ok: adding properties to the shared object
exports.add = (a, b) => a + b;
module.exports.sub = (a, b) => a - b;

// ok: replacing what the module exports
module.exports = function log(msg) {};
module.exports = { add, sub };

// BROKEN: reassigning `exports` only rebinds the local variable
exports = { add };          // require() still returns the old (empty) module.exports
```

Rule: to export **one thing** (a class or function) or a whole new object, assign `module.exports`. To add **named** exports, use `exports.x = ...`. Don't mix the two styles in one file.

### nd18 | How do you use ES modules in Node, and how do they interoperate with CommonJS?

Enable ESM by:
- `"type": "module"` in package.json → `.js` files are ESM (use `.cjs` for CommonJS ones), or
- the `.mjs` extension for individual files.

```js
// ESM
import fs from "node:fs/promises";
import { join } from "node:path";
import config from "./config.json" with { type: "json" };   // import attributes
export const read = (p) => fs.readFile(join(process.cwd(), p), "utf8");

const data = await read("a.txt");                            // top-level await
const { default: lib } = await import("./lazy.js");          // dynamic import
```

Differences from CJS: **file extensions are required** in relative imports (`./x.js`); no `__dirname`/`require` by default (use `import.meta.dirname` / `createRequire`); module loading is async and static.

Interop:
- **ESM → CJS**: `import pkg from "cjs-lib"` works. `module.exports` becomes the default export (named exports work when Node can detect them statically).
- **CJS → ESM**: use `await import("esm-lib")`. Newer Node versions (22.12+/20.19+) also support `require()` of ESM modules that don't use top-level await.

New projects should use ESM (or TypeScript compiled to it). Much of the npm ecosystem is now ESM-only.

### nd19 | What is in package.json, and what is the difference between dependencies, devDependencies and peerDependencies?

`package.json` describes the project: `name`, `version`, `scripts`, `main`/`exports` (the entry points), `type` (module or commonjs), `engines` (the required Node version), and its dependencies.

```json
{
  "name": "orders-api",
  "type": "module",
  "engines": { "node": ">=20" },
  "scripts": { "start": "node src/server.js", "dev": "node --watch src/server.js", "test": "vitest" },
  "dependencies": { "express": "^4.21.0", "pg": "^8.12.0" },
  "devDependencies": { "vitest": "^2.0.0", "eslint": "^9.0.0" },
  "peerDependencies": { "react": ">=18" }
}
```

- **dependencies**: needed **at runtime** in production (express, a DB driver).
- **devDependencies**: only for **development and build** (test runners, linters, TypeScript, bundlers). Skipped by `npm ci --omit=dev`, which keeps production images smaller.
- **peerDependencies**: for **libraries/plugins**: "the host app must provide this package". A React component library declares `react` as a peer so the app doesn't end up with two copies of React.
- **optionalDependencies**: installation may fail without breaking the install.

`npm run <script>` runs scripts with `node_modules/.bin` on the PATH.

### nd20 | How do semantic versioning and package-lock.json work?

**SemVer**: `MAJOR.MINOR.PATCH`, e.g. `4.21.3`
- **MAJOR**: breaking changes
- **MINOR**: new features, backwards-compatible
- **PATCH**: bug fixes

Version ranges in package.json:
- `^4.21.3`: `>=4.21.3 <5.0.0` (minor and patch updates; the npm default)
- `~4.21.3`: `>=4.21.3 <4.22.0` (patch updates only)
- `4.21.3`: exactly this version

**package-lock.json** records the **exact resolved version** (and integrity hash) of **every** package in the tree, including transitive dependencies. Without it, two installs on different days could get different versions within the ranges ("works on my machine").

- **Commit the lockfile** for applications.
- In CI and Docker, use **`npm ci`**: it installs **exactly** what the lockfile says, fails if it disagrees with package.json, and is faster and reproducible. `npm install` may update the lockfile.
- `npm outdated` shows newer versions; `npm audit` checks for known vulnerabilities.

### nd21 | What is the difference between npm and npx?

- **npm** (Node Package Manager): **installs and manages** packages (`npm install`, `npm ci`, `npm update`) and runs project scripts (`npm run build`).
- **npx**: **executes** a package's binary, either from the local project (`node_modules/.bin`) or by **downloading it temporarily** without installing it globally.

```bash
npm install -D eslint        # adds to devDependencies
npx eslint .                 # runs the project's local eslint

npx create-vite@latest my-app   # runs a one-off generator without a global install
npx prisma migrate dev
```

Why npx is useful: no globally installed tools with mismatched versions; every project uses its own pinned version, and one-off CLIs always run the latest.

Other package managers: **pnpm** (content-addressed store, fast, disk-efficient, strict) and **yarn**. Corepack, bundled with Node, manages their versions.

## Async patterns and events

### nd22 | What is the error-first callback convention?

Node's classic async APIs pass the callback **an error as the first argument**, and the result after it:

```js
fs.readFile("config.json", "utf8", (err, data) => {
  if (err) {
    // handle it or return early; don't throw (nothing up the stack can catch it)
    return console.error("read failed:", err.message);
  }
  const config = JSON.parse(data);
});
```

Rules:
- `err` is `null`/`undefined` on success.
- Always **check `err` first** and `return` after handling it.
- **Never throw** inside an async callback: the original caller's stack is gone, so it becomes an uncaught exception that crashes the process.
- Call the callback **exactly once**, and consistently async (don't sometimes call it synchronously; that's "releasing Zalgo").

Modern code uses promises instead: `fs/promises`, `util.promisify(fn)`, or `async/await`.

### nd23 | How do you convert callback APIs to promises in Node (util.promisify)?

```js
const util = require("node:util");
const fs = require("node:fs");

const readFile = util.promisify(fs.readFile);
const text = await readFile("a.txt", "utf8");

// better: most core modules have promise versions now
const fsp = require("node:fs/promises");
await fsp.writeFile("out.txt", "hello");

const { setTimeout: sleep } = require("node:timers/promises");
await sleep(1000);

const { pipeline } = require("node:stream/promises");
const { once } = require("node:events");
await once(server, "listening");      // wait for a single event as a promise
```

`util.promisify` works with any function that follows the **error-first callback** convention as its **last** argument. The reverse is `util.callbackify`.

### nd24 | What is the EventEmitter, and how does it work?

`EventEmitter` (from the `events` module) implements the **observer / pub-sub pattern**. Much of Node is built on it: HTTP servers, streams, sockets, `process`.

```js
const { EventEmitter } = require("node:events");

class OrderService extends EventEmitter {
  place(order) {
    // ...save the order
    this.emit("placed", order);                 // notify listeners
  }
}

const orders = new OrderService();
orders.on("placed", (o) => sendEmail(o));       // every time
orders.once("placed", (o) => log("first order", o.id)); // only once
orders.on("error", (err) => logger.error(err)); // IMPORTANT

orders.place({ id: 1 });
orders.off("placed", handler);                  // remove a listener
```

Key facts:
- **`emit` is synchronous**: listeners run immediately, in registration order, before `emit` returns. Wrap them in `setImmediate` if you need async.
- **The `"error"` event is special**: emitting `"error"` with **no listener** throws, which crashes the process. Always attach an error listener.
- **Memory leak warning**: more than 10 listeners for one event triggers `MaxListenersExceededWarning`. Usually it's a real leak (adding listeners per request without removing them). Raise the limit with `setMaxListeners` only if it's intended.
- `await once(emitter, "event")` and `for await (const [x] of on(emitter, "data"))` make events promise-friendly.

### nd25 | How do you limit concurrency when running many async operations?

`Promise.all(items.map(fetchItem))` on 10,000 items fires **10,000 requests at once**: rate limits, exhausted DB connections, out of memory, or a DoS on the downstream service.

Options:

```js
// 1. Batches: simple, but each batch waits for its slowest item
for (let i = 0; i < items.length; i += 10) {
  await Promise.all(items.slice(i, i + 10).map(processItem));
}

// 2. A worker pool: always keep N in flight (better throughput)
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;                    // safe: single-threaded JS
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
await mapLimit(urls, 5, fetchJson);

// 3. Libraries: p-limit, p-queue (also supports rate limiting)
import pLimit from "p-limit";
const limit = pLimit(5);
await Promise.all(urls.map((u) => limit(() => fetchJson(u))));
```

For very large or long-running jobs, use a **queue** (BullMQ on Redis, SQS, Kafka) with workers instead of in-process loops.

## Buffers and streams

### nd26 | What is a Buffer?

A **Buffer** is a fixed-size chunk of **raw binary data**, allocated **outside the V8 heap**. JavaScript strings are text (UTF-16); Buffers handle bytes: files, network packets, images, encryption.

```js
const b1 = Buffer.from("hello", "utf8");      // <Buffer 68 65 6c 6c 6f>
b1.toString("base64");                        // "aGVsbG8="
b1.toString("hex");                           // "68656c6c6f"
Buffer.from("aGVsbG8=", "base64").toString(); // "hello"

const b2 = Buffer.alloc(10);                  // zero-filled, safe
const b3 = Buffer.allocUnsafe(10);            // faster, may contain OLD memory: overwrite it before use

b1.length;                                    // byte length (not characters: "é" is 2 bytes)
Buffer.concat([b1, b2]);
b1.subarray(0, 2);                            // a view that SHARES memory (no copy)
Buffer.byteLength("héllo");                   // 6
```

Buffer is a subclass of `Uint8Array`. Uses: file and stream chunks (`fs.readFile` without an encoding returns a Buffer), binary protocols, hashing, base64 encoding. Watch out for character encoding when you split multi-byte text across chunks (use `setEncoding` or `StringDecoder`).

### nd27 | What are streams, and why use them?

A **stream** processes data **piece by piece (in chunks)** as it arrives, instead of loading it all into memory first.

```js
// WITHOUT streams: reads a whole 2GB file into memory
app.get("/video", async (req, res) => {
  const data = await fs.promises.readFile("movie.mp4");  // huge memory, slow first byte
  res.end(data);
});

// WITH streams: constant small memory, the first bytes go out immediately
app.get("/video", (req, res) => {
  fs.createReadStream("movie.mp4").pipe(res);
});
```

Benefits:
- **Memory efficiency**: memory stays constant (e.g. 64KB chunks) regardless of the file size.
- **Time efficiency**: you start processing or sending before everything has arrived.
- **Composability**: chain steps like Unix pipes (`read | gunzip | parse | write`).
- **Backpressure**: a slow consumer automatically slows down the producer.

Streams are everywhere in Node: HTTP requests and responses, files, sockets, `process.stdin/stdout`, zlib, crypto.

### nd28 | What are the four types of streams?

1. **Readable**: a data source you read from. `fs.createReadStream`, an HTTP **request** on the server, `process.stdin`.
2. **Writable**: a destination you write to. `fs.createWriteStream`, an HTTP **response** on the server, `process.stdout`.
3. **Duplex**: both readable and writable, **independently**. A TCP socket (`net.Socket`).
4. **Transform**: a duplex where the **output is computed from the input**. `zlib.createGzip()`, `crypto.createCipheriv()`, a CSV parser.

```js
const { Transform, pipeline } = require("node:stream");

const upperCase = new Transform({
  transform(chunk, encoding, callback) {
    callback(null, chunk.toString().toUpperCase());  // push the transformed chunk
  },
});

pipeline(process.stdin, upperCase, process.stdout, (err) => {
  if (err) console.error("failed", err);
});
```

Streams are EventEmitters. Readable events: `data`, `end`, `error`, `close`. Writable: `drain`, `finish`, `error`. **Object mode** streams pass JS objects instead of Buffers (e.g. rows from a DB cursor).

### nd29 | What is backpressure, and how does Node handle it?

**Backpressure** happens when data is **produced faster than it can be consumed**, e.g. reading a fast SSD and writing to a slow network client. Without control, the unsent data **piles up in memory** until the process crashes.

How Node handles it:
- Each writable has a buffer limit, **`highWaterMark`** (16KB by default, or 16 objects in object mode).
- `writable.write(chunk)` returns **`false`** when the buffer is full, which means "stop writing".
- The writable emits **`"drain"`** when it's ready for more.

```js
// manual handling (what pipe/pipeline do for you)
readable.on("data", (chunk) => {
  const ok = writable.write(chunk);
  if (!ok) {
    readable.pause();                          // stop reading
    writable.once("drain", () => readable.resume());
  }
});
```

**`pipe()` and `pipeline()` handle backpressure automatically.** The classic bug is ignoring `write()`'s return value in a manual loop, so memory grows without limit. The same idea exists in Kafka consumers, reactive streams and TCP flow control.

### nd30 | Why is pipeline() better than pipe()?

`a.pipe(b).pipe(c)` handles backpressure, but **not errors or cleanup**: if `b` fails, `a` keeps reading and nothing is closed, so file descriptors leak, memory leaks, and the request hangs. You'd need an error handler on every stream.

**`stream.pipeline`** wires up backpressure **and** propagates errors **and** destroys every stream on failure or completion:

```js
const { pipeline } = require("node:stream/promises");
const fs = require("node:fs");
const zlib = require("node:zlib");

async function compress(src, dest) {
  await pipeline(
    fs.createReadStream(src),
    zlib.createGzip(),
    fs.createWriteStream(dest)
  );                                           // throws if ANY step fails; everything is cleaned up
}

// in an HTTP handler
app.get("/export", async (req, res, next) => {
  try {
    await pipeline(db.queryStream(sql), toCsv(), res);
  } catch (err) {
    next(err);                                 // client disconnects are also handled
  }
});
```

Always prefer `pipeline` (the promise version from `node:stream/promises`) in production code.

### nd31 | What is the difference between fs.readFile and fs.createReadStream?

| | `fs.readFile` | `fs.createReadStream` |
|---|---|---|
| Loads | the **entire file** into memory | **chunks** (64KB by default) |
| Memory | proportional to the file size | constant and small |
| First data available | after the whole file is read | almost immediately |
| Max size | limited (around 2GB Buffer limit; huge files crash) | unlimited |
| API | a simple callback or promise | stream events / pipe / async iteration |
| Good for | small files (config, templates, small JSON) | large files, serving downloads, processing logs or CSVs |

```js
// process a large log file line by line with constant memory
const readline = require("node:readline");
const rl = readline.createInterface({ input: fs.createReadStream("app.log") });
for await (const line of rl) {
  if (line.includes("ERROR")) count++;
}
```

Readable streams are **async iterable**, so `for await (const chunk of stream)` is a clean way to consume them, with backpressure built in.

## Files and HTTP

### nd32 | What are the three styles of fs API, and which should you use?

```js
// 1. Synchronous: blocks the event loop
const cfg = fs.readFileSync("config.json", "utf8");

// 2. Callback: async, error-first
fs.readFile("data.txt", "utf8", (err, data) => {});

// 3. Promise: async, works with async/await (preferred)
const fsp = require("node:fs/promises");
const data = await fsp.readFile("data.txt", "utf8");
await fsp.writeFile("out.json", JSON.stringify(obj));
await fsp.mkdir("logs", { recursive: true });
const entries = await fsp.readdir(".", { withFileTypes: true });
await fsp.rm("tmp", { recursive: true, force: true });
```

Use:
- **Promises** in application code.
- **Sync** only at startup or in CLI scripts.
- **Streams** for large files.

Gotchas:
- File operations run on the **libuv thread pool** (4 threads by default). Thousands of concurrent file ops queue up behind each other and behind crypto/DNS work.
- Check-then-act races: don't call `exists` then `open`. Just `open` and handle `ENOENT`.
- Always build paths with `path.join`, and never trust user input in paths (path traversal: `../../etc/passwd`).

### nd33 | What is the path module for?

`path` builds and parses file paths **portably** (`/` on Linux and macOS, `\` on Windows).

```js
const path = require("node:path");

path.join("/users", "shubam", "../docs", "a.txt");  // "/users/docs/a.txt" (normalised)
path.resolve("src", "app.js");     // an absolute path from the current working directory
path.basename("/a/b/file.txt");    // "file.txt"
path.extname("photo.jpeg");        // ".jpeg"
path.dirname("/a/b/file.txt");     // "/a/b"
path.parse("/a/b/file.txt");       // { root, dir, base, ext, name }
path.relative("/a/b", "/a/c/d");   // "../c/d"
```

Security, against **path traversal**: when serving user-requested files, resolve the path and check it stays inside the allowed folder:

```js
const base = path.resolve("uploads");
const target = path.resolve(base, req.params.file);
if (!target.startsWith(base + path.sep)) return res.status(400).end();
```

### nd34 | How do you create an HTTP server with the core http module?

```js
const http = require("node:http");

const server = http.createServer(async (req, res) => {
  // req: an IncomingMessage (a Readable stream); res: a ServerResponse (a Writable stream)
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: true }));
  }

  if (req.method === "POST" && req.url === "/echo") {
    let body = "";
    for await (const chunk of req) body += chunk;   // the body arrives as a stream
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(body);
  }

  res.writeHead(404).end("Not found");
});

server.listen(3000, () => console.log("listening on 3000"));
```

What you have to do yourself here: routing, body parsing (and size limits), URL and query parsing (`new URL(req.url, "http://x")`), headers, errors and middleware. **Express, Fastify and Koa** are layers on top of exactly this API.

Also know: `server.keepAliveTimeout` / `headersTimeout` (tune them behind load balancers), and `http2`/`https` modules exist.

### nd35 | What is Express, and why use it over plain http?

**Express** is a minimal web framework on top of Node's `http` module. It adds:
- **Routing** by method + path, with params (`/users/:id`).
- A **middleware pipeline** for cross-cutting concerns (auth, logging, parsing, CORS).
- Request and response helpers: `req.params`, `req.query`, `req.body` (with parsers), `res.json()`, `res.status()`, `res.redirect()`, `res.sendFile()`.
- Error-handling middleware.
- A huge ecosystem (helmet, cors, multer, passport).

```js
const express = require("express");
const app = express();

app.use(express.json({ limit: "1mb" }));          // parse JSON bodies

app.get("/users/:id", async (req, res) => {
  const user = await db.find(req.params.id);
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json(user);
});

app.listen(3000);
```

Alternatives: **Fastify** (faster, schema-based validation and serialisation, first-class async), **NestJS** (structured, Angular/Spring-like: modules, dependency injection, decorators; the most familiar for Java/Spring developers), Koa, Hono.

### nd36 | What is the difference between req.params, req.query and req.body?

```js
// GET /users/42/orders?status=paid&page=2
app.get("/users/:userId/orders", (req, res) => {
  req.params;   // { userId: "42" }                  path segments from the route
  req.query;    // { status: "paid", page: "2" }     the query string (ALWAYS strings)
});

// POST /users  with JSON body {"name": "A", "email": "a@b.com"}
app.post("/users", express.json(), (req, res) => {
  req.body;     // { name: "A", email: "a@b.com" }   needs a body-parsing middleware
});
```

| | Where | Typical use |
|---|---|---|
| `params` | the URL path | identifying a resource (`/users/:id`) |
| `query` | after `?` | filtering, sorting, pagination, search |
| `body` | the request payload | data to create or update (POST/PUT/PATCH) |
| `headers` | HTTP headers | auth tokens, content type, tracing ids |

Everything here is **untrusted user input**: validate and convert types (`Number(req.query.page)`, a Zod/Joi schema). `req.body` is `undefined` without `express.json()` / `express.urlencoded()`.

## Express middleware and APIs

### nd37 | What is middleware in Express, and what does next() do?

**Middleware** is a function `(req, res, next)` that runs in the **request pipeline**. Each one can:
- read or modify `req`/`res` (attach `req.user`, set headers),
- **end** the request (send a response),
- or call **`next()`** to pass control to the next middleware.

```js
// logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => console.log(req.method, req.url, res.statusCode, Date.now() - start, "ms"));
  next();                                   // MUST call next() or respond, or the request hangs
});

// auth middleware
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });     // ends the chain
  }
}
app.get("/profile", requireAuth, (req, res) => res.json(req.user));
```

- `next()`: go to the next matching middleware or route.
- `next(err)`: skip to the **error-handling** middleware.
- `next("route")`: skip the remaining handlers of the current route.

Types: application-level (`app.use`), router-level (`router.use`), built-in (`express.json`, `express.static`), third-party (`cors`, `helmet`, `morgan`), and error-handling.

### nd38 | Why does the order of middleware matter, and what is the difference between app.use and app.get?

Express runs middleware and routes **in the order they were registered**, top to bottom, for every request that matches.

```js
app.use(helmet());                      // 1. security headers for everything
app.use(cors({ origin: allowed }));     // 2. CORS before the routes
app.use(express.json());                // 3. body parsing BEFORE routes that read req.body
app.use(requestLogger);

app.use("/api/admin", requireAdmin);    // 4. guard everything under /api/admin
app.use("/api/users", usersRouter);     // 5. routes

app.use((req, res) => res.status(404).json({ error: "Not found" })); // 6. 404 after every route
app.use(errorHandler);                  // 7. error handler LAST
```

Common bugs: a body parser registered after the route (`req.body` is undefined); auth middleware after the route it should protect; the 404 handler before the routes.

**`app.use(path?, fn)`**:
- Matches **any HTTP method**.
- Matches the path **as a prefix**: `app.use("/api", fn)` runs for `/api/users` too.
- Used for middleware and mounting routers.

**`app.get(path, fn)`** (and `.post`, `.put`, `.delete`, `.all`):
- Matches **only that method**.
- Matches the **exact path pattern** (with params).
- Used for endpoints.

### nd39 | How do you handle errors in Express, including async errors?

An **error-handling middleware** has **four parameters** `(err, req, res, next)` and is registered **last**:

```js
app.use((err, req, res, next) => {
  const status = err.status ?? 500;
  logger.error({ err, path: req.path, requestId: req.id });
  res.status(status).json({
    error: status === 500 ? "Internal Server Error" : err.message, // don't leak internals
  });
});
```

Errors reach it when you `throw` in **synchronous** code or call `next(err)`.

**Async errors** are the classic trap: in **Express 4**, a rejected promise in an `async` handler is **not caught**. The request hangs and you get an unhandled rejection.

```js
// Express 4: wrap the handler (or use the express-async-errors package)
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

app.get("/users/:id", asyncHandler(async (req, res) => {
  const user = await db.find(req.params.id);       // a rejection goes to the error handler
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
  res.json(user);
}));
```

**Express 5** (stable since 2024) forwards rejected promises from async handlers to the error middleware **automatically**.

Good practice: custom error classes (`NotFoundError`, `ValidationError`) with a status code; a consistent error response format; never send stack traces to clients in production.

### nd40 | How do you organise routes with express.Router?

`express.Router()` creates a **mini-app**: its own routes and middleware, which you mount under a path prefix. It keeps large apps modular.

```js
// routes/users.js
const router = require("express").Router();

router.use(requireAuth);                         // applies only to these routes

router.get("/", listUsers);                      // GET    /api/users
router.get("/:id", getUser);                     // GET    /api/users/:id
router.post("/", validate(userSchema), createUser);
router.patch("/:id", updateUser);
router.delete("/:id", requireAdmin, deleteUser);

module.exports = router;

// app.js
app.use("/api/users", require("./routes/users"));
app.use("/api/orders", require("./routes/orders"));
```

A typical layered structure, similar to Spring's controller → service → repository:
- **routes**: HTTP wiring only
- **controllers**: read the request, call services, shape the response
- **services**: business logic (no `req`/`res`)
- **repositories / models**: DB access
- **middlewares**, **config**, **utils**

Keeping business logic out of route handlers makes it testable without HTTP.

### nd41 | What are the key principles of a good REST API in Node?

```text
GET    /api/orders?status=paid&page=2   list (filter, paginate)   200
GET    /api/orders/42                   read one                  200 / 404
POST   /api/orders                      create                    201 + Location header
PUT    /api/orders/42                   replace the whole thing   200 / 204
PATCH  /api/orders/42                   partial update            200
DELETE /api/orders/42                   delete                    204
```

- **Resources are nouns**, plural; HTTP **methods** are the verbs.
- **PUT vs PATCH**: PUT replaces the whole resource (idempotent); PATCH changes some fields.
- **Idempotency**: GET, PUT and DELETE are idempotent; POST isn't. Use an **Idempotency-Key** header for safe retries of payments and orders.
- **Status codes**: 200, 201, 204; 400 (validation), 401 (not authenticated), 403 (not allowed), 404, 409 (conflict), 422, 429 (rate limited); 500, 503.
- **Validate input** at the edge (Zod/Joi/express-validator); return a consistent error shape.
- **Pagination**: offset/limit for simple cases; cursor-based for large or real-time data.
- **Versioning**: `/api/v1/...` or a header.
- Statelessness, auth with tokens, rate limiting, request ids for tracing, OpenAPI/Swagger docs.

```js
res.status(201).location(`/api/orders/${order.id}`).json(order);
```

### nd42 | How do you handle CORS in an Express app?

If your frontend (`https://app.example.com`) calls your API on another origin (`https://api.example.com`), the **browser** blocks reading the responses unless the API sends CORS headers.

```js
const cors = require("cors");

app.use(cors({
  origin: ["https://app.example.com", "http://localhost:5173"], // an allowlist, not "*" with credentials
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,          // allow cookies; requires an explicit origin, not *
  maxAge: 600,                // cache the preflight for 10 minutes
}));
```

What it does: answers the **preflight `OPTIONS`** request and adds `Access-Control-Allow-*` headers.

Remember:
- CORS is enforced by **browsers** only. It's **not** a security boundary for your API; anyone can call it with curl. Use auth for that.
- `origin: "*"` + `credentials: true` is invalid, and reflecting any origin with credentials is a security hole.
- Alternatives: serve the frontend and API from the **same origin** (via a reverse proxy, or a dev-server proxy in Vite) and CORS isn't needed.

## Errors and process lifecycle

### nd43 | What is the difference between operational errors and programmer errors?

- **Operational errors**: **expected runtime problems** in correct code: the network is down, the DB times out, a file isn't found, invalid user input, a downstream 500, out of disk.
  → **Handle them**: retry, return 4xx/5xx, fall back, log.
- **Programmer errors**: **bugs**: `undefined is not a function`, reading a property of null, a wrong argument type, a forgotten `await`, broken logic.
  → **Can't be handled meaningfully at runtime.** Fix the code. If one happens unexpectedly in production, the process may be in an **unknown state**: log it, crash, and let the process manager restart it.

```js
// operational: handle it
try {
  await paymentGateway.charge(order);
} catch (err) {
  if (err.code === "ETIMEDOUT") return retryLater(order);
  throw err;
}

// programmer error: let it surface; tests and types catch it
order.items.lenght; // typo -> undefined -> wrong total
```

This distinction drives Node's error philosophy: **handle operational errors locally; let programmer errors crash and restart** (the "let it crash" idea from Erlang), with good logging and monitoring.

### nd44 | What should you do on uncaughtException and unhandledRejection?

- **`uncaughtException`**: a synchronous `throw` that nothing caught (for example inside a callback).
- **`unhandledRejection`**: a promise rejected with no `.catch()` / `try` around its `await`. Since **Node 15**, this **crashes the process by default** (`--unhandled-rejections=throw`).

```js
process.on("unhandledRejection", (reason) => {
  logger.fatal({ reason }, "unhandled rejection");
  throw reason;                      // turn it into an uncaughtException -> same path
});

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "uncaught exception, shutting down");
  // best effort: stop accepting work, flush logs, then exit
  server.close(() => process.exit(1));
  setTimeout(() => process.exit(1), 10_000).unref();   // force exit if close hangs
});
```

**Don't use these handlers to "keep running"** as if nothing happened. After an unknown error the app may be corrupted: half-finished operations, leaked resources, broken invariants. Correct practice:
1. Log it with full context.
2. Exit with a non-zero code.
3. Let a **process manager** (Kubernetes, PM2, systemd, ECS) restart it, with several instances behind a load balancer so users aren't affected.

Prevent them in the first place: always `await` or `.catch` promises, use lint rules (`no-floating-promises`), and use async-aware error middleware.

### nd45 | How do you implement graceful shutdown?

On deploy or scale-down, the orchestrator sends **`SIGTERM`**, waits for a grace period (Kubernetes defaults to 30s), then **`SIGKILL`**. Graceful shutdown means finishing in-flight work instead of dropping requests:

```js
const server = app.listen(3000);
let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`${signal} received, shutting down`);

  // 1. fail the readiness probe so the load balancer stops sending traffic
  // 2. stop accepting new connections; wait for in-flight requests
  server.close(async () => {
    try {
      await queueConsumer.stop();      // 3. stop consuming jobs/messages
      await db.end();                  // 4. close DB pools, Redis, Kafka producers
      await logger.flush?.();
      process.exit(0);
    } catch (err) {
      process.exit(1);
    }
  });

  server.closeIdleConnections?.();     // close idle keep-alive sockets (Node 18.2+)
  setTimeout(() => process.exit(1), 25_000).unref(); // 5. hard deadline below the grace period
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));   // Ctrl+C locally

app.get("/health/ready", (req, res) => res.status(shuttingDown ? 503 : 200).end());
```

In Docker, run Node as PID 1 correctly (`CMD ["node", "server.js"]`, not `npm start`, which may not forward signals; or use `--init`/tini).

### nd46 | How should you do logging in a Node service?

- **Use a structured logger**, not `console.log`: **pino** (very fast, JSON) or winston.
- Log **JSON** with levels (`fatal`, `error`, `warn`, `info`, `debug`), so log platforms (ELK, Datadog, Loki) can search and filter.
- Include **context**: a request id / trace id, user id, route, latency, error stack.
- Log to **stdout**; let the platform collect it (12-factor), rather than writing files yourself.

```js
const pino = require("pino");
const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

app.use((req, res, next) => {
  req.id = req.headers["x-request-id"] ?? crypto.randomUUID();
  req.log = logger.child({ requestId: req.id });   // every log line carries the request id
  next();
});

req.log.info({ orderId }, "order placed");
req.log.error({ err }, "payment failed");
```

Don'ts:
- Don't log secrets, passwords, tokens or full card or personal data (redact them: pino has `redact`).
- Avoid heavy synchronous logging in hot paths.
- Don't log the same error at every layer.

Pair logs with **metrics** (Prometheus: latency, error rate, event loop lag) and **tracing** (OpenTelemetry) for full observability.

## Scaling and performance

### nd47 | What is the cluster module?

A single Node process runs your JS on **one CPU core**. **`cluster`** forks **multiple worker processes** (typically one per core) that **share the same server port**. The primary process distributes incoming connections between them (round-robin on most platforms).

```js
const cluster = require("node:cluster");
const os = require("node:os");

if (cluster.isPrimary) {
  for (let i = 0; i < os.availableParallelism(); i++) cluster.fork();
  cluster.on("exit", (worker, code) => {
    console.log(`worker ${worker.process.pid} died (${code}), restarting`);
    cluster.fork();                                   // self-healing
  });
} else {
  require("./server");                                // each worker runs the app
}
```

Things to know:
- Workers are **separate processes**, so they **share no memory**. In-memory sessions, caches and rate-limit counters aren't shared; use **Redis** for shared state (or sticky sessions for WebSockets).
- One worker crashing doesn't take down the others.
- In production you often don't write this yourself: **PM2** (`pm2 start app.js -i max`) does it. In **Kubernetes/containers**, the common approach is **one process per container** and scaling with **more pods/replicas**.

### nd48 | What are worker_threads, and when should you use them?

`worker_threads` run JavaScript in **parallel threads inside the same process**. Each worker has its **own V8 instance, event loop and heap**. Use them for **CPU-intensive** work so it doesn't block the main event loop.

```js
// main.js
const { Worker } = require("node:worker_threads");

function runHash(data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker("./hash-worker.js", { workerData: data });
    worker.once("message", resolve);
    worker.once("error", reject);
  });
}
app.post("/hash", async (req, res) => res.json({ hash: await runHash(req.body.text) }));

// hash-worker.js
const { parentPort, workerData } = require("node:worker_threads");
parentPort.postMessage(expensiveHash(workerData));
```

- Communication is through **messages** (data is copied with structured clone), or by **transferring** ArrayBuffers, or by sharing memory with **`SharedArrayBuffer`** + `Atomics`.
- Creating a worker is expensive (~a few ms plus memory). Use a **pool** (`piscina`) for repeated tasks.
- **Not** useful for I/O: async I/O is already non-blocking.

Use cases: image or video processing, PDF generation, compression, large JSON parsing or transformation, crypto, ML inference.

### nd49 | What is the difference between cluster, worker_threads and child_process?

| | `cluster` | `worker_threads` | `child_process` |
|---|---|---|---|
| Unit | processes (copies of your app) | threads in one process | any separate process (any program) |
| Memory | separate | separate heaps; can share via `SharedArrayBuffer` | separate |
| Purpose | **scale an HTTP server** across CPU cores | **offload CPU-heavy JS** from the event loop | run **external programs** or scripts (ffmpeg, Python, git, shell) |
| Communication | IPC messages | `postMessage` (fast, in-process) | stdio streams, IPC (with `fork`) |
| Overhead | high (a full process each) | medium | high |
| Crash isolation | strong | weaker (a worker crash is catchable) | strong |

One-liner: **cluster for request throughput, worker_threads for CPU tasks, child_process for running other programs.**

### nd50 | What is the difference between spawn, exec, execFile and fork?

All in `child_process`:

- **`spawn(cmd, args)`**: launches a process and gives you **streams** for stdout and stderr. No shell by default. Best for **long-running** processes or **large output**.
  ```js
  const ff = spawn("ffmpeg", ["-i", "in.mp4", "out.webm"]);
  ff.stderr.on("data", (d) => log(d.toString()));
  ff.on("close", (code) => console.log("exit", code));
  ```
- **`exec(commandString)`**: runs the command **in a shell** and **buffers** all output, which you get in a callback. Convenient for short commands, but there's a **maxBuffer** limit, and it's **dangerous with user input** (shell injection).
  ```js
  exec("git rev-parse HEAD", (err, stdout) => console.log(stdout.trim()));
  exec(`ls ${userInput}`);   // NEVER: "; rm -rf /" injection
  ```
- **`execFile(file, args)`**: like exec (buffered) but **without a shell**: arguments are passed safely. Prefer it over exec.
- **`fork(modulePath)`**: a special `spawn` for **Node scripts**, with a built-in **IPC channel** (`child.send()` / `process.on("message")`).

Promise versions exist via `util.promisify(execFile)`. Sync versions (`execSync`) block the event loop, so keep them for scripts only.

### nd51 | What causes memory leaks in Node, and how do you find them?

Symptoms: RSS / heap grows steadily under constant load, GC pauses get longer, and the process eventually crashes with `JavaScript heap out of memory` or is OOM-killed by the container.

Common causes:
- **Global or module-level caches** that grow forever (a `Map` keyed by request or user with no eviction). Use an LRU with a max size and TTL.
- **Event listeners** added per request and never removed (`emitter.on` inside handlers); look for `MaxListenersExceededWarning`.
- **Closures** holding large objects (a request body captured in a long-lived callback).
- **Timers/intervals** never cleared.
- Unbounded **queues or arrays** (buffering logs, an in-memory job list).
- Not consuming or destroying **streams**; unreleased DB connections.

Finding them:
```bash
node --inspect app.js                      # Chrome DevTools -> Memory -> heap snapshots
node --heapsnapshot-signal=SIGUSR2 app.js  # take a snapshot in production on demand
```
1. Take a heap snapshot → apply load → take another → **compare**: which object types keep growing, and their **retainers** (what holds them).
2. Watch `process.memoryUsage()` over time.
3. Tools: clinic.js `heapprofiler`, APM memory metrics.

`--max-old-space-size=4096` raises the heap limit. That's a stopgap, not a fix.

### nd52 | How does garbage collection work in V8 (Node)?

V8 uses **generational** garbage collection, based on the observation that **most objects die young**.

1. **Young generation** (new space, small: a few MB to tens of MB)
   - New objects are allocated here.
   - Collected **often and quickly** by the **Scavenger** (a copying collector): live objects are copied from one half ("from-space") to the other ("to-space"), and everything left behind is garbage.
   - Objects that survive two scavenges are **promoted** to the old generation.

2. **Old generation** (large)
   - Long-lived objects: caches, module state, connection pools.
   - Collected less often with **Mark-Sweep-Compact**: mark everything reachable from the roots, sweep the dead objects, compact to reduce fragmentation.
   - Done **incrementally and concurrently** (on helper threads) to keep pauses short.

GC is **stop-the-world** for parts of the work, and during those pauses **your event loop is blocked**. Lots of allocation means more GC means latency spikes.

Practical: avoid creating huge numbers of short-lived objects in hot paths; watch for steady old-generation growth (leaks). Flags: `--max-old-space-size`, `--trace-gc` for diagnosis.

### nd53 | How do you improve the performance of a Node.js API?

**Measure first**: latency percentiles (p95/p99), throughput, event loop lag, CPU and memory; profile with `--cpu-prof`, clinic.js or APM.

Then:
1. **Never block the event loop**: async APIs, worker_threads for CPU work, avoid huge sync JSON operations.
2. **Database**: indexes, avoid N+1 queries, select only the columns you need, **connection pooling**, pagination.
3. **Caching**: in-memory LRU for hot, small data; **Redis** for shared caching; HTTP caching headers / CDN for public responses.
4. **Parallelise independent I/O**: `Promise.all` instead of sequential awaits (with concurrency limits).
5. **Streams** for large payloads instead of buffering.
6. **Use every core**: cluster, PM2, or more container replicas behind a load balancer.
7. **Compression** (gzip/brotli, ideally at the proxy/CDN), smaller payloads, HTTP keep-alive (reuse connections to downstream services too).
8. **Faster frameworks or serialisation**: Fastify's schema-based JSON serialisation.
9. **Offload slow work** to background queues (emails, reports) and respond immediately.
10. Keep Node up to date (V8 improvements); avoid unnecessary middleware on hot routes.

### nd54 | How do you add caching to a Node application?

Layers, from closest to farthest:

1. **In-process memory** (an LRU cache): fastest (nanoseconds). But it's **per instance**: not shared across processes or pods, lost on restart, and it costs heap.
   ```js
   const { LRUCache } = require("lru-cache");
   const cache = new LRUCache({ max: 1000, ttl: 60_000 });
   ```
2. **Redis**: shared by every instance; supports TTLs, atomic counters (rate limiting), pub/sub, and also sessions and queues.
3. **HTTP / CDN caching**: `Cache-Control`, `ETag` for GET responses; a CDN for public content.

The common **cache-aside** pattern:
```js
async function getProduct(id) {
  const key = `product:${id}`;
  const hit = await redis.get(key);
  if (hit) return JSON.parse(hit);                       // cache hit

  const product = await db.products.findById(id);        // miss -> load from the DB
  await redis.set(key, JSON.stringify(product), { EX: 300 }); // TTL of 5 minutes
  return product;
}

async function updateProduct(id, data) {
  await db.products.update(id, data);
  await redis.del(`product:${id}`);                      // invalidate on write
}
```

Concerns to mention: **invalidation** (TTL vs explicit delete), **stampede** (many misses at once: lock or request coalescing), stale reads, and memory limits / eviction policy.

## Security and configuration

### nd55 | How do you manage configuration and secrets (env vars, dotenv, NODE_ENV)?

Follow the **12-factor** rule: keep config in the **environment**, not in code.

```js
// load .env in development only (Node 20.6+ can also do: node --env-file=.env app.js)
require("dotenv").config();

const config = {
  port: Number(process.env.PORT ?? 3000),
  dbUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  isProd: process.env.NODE_ENV === "production",
};

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);   // fail fast at startup
  return v;
}
```

- **Never commit `.env`** or secrets (add it to `.gitignore`; commit an `.env.example` instead).
- In production, inject secrets from a **secret manager** (Azure Key Vault, AWS Secrets Manager, Kubernetes Secrets, Vault).
- **Validate config at startup** (Zod or envalid), so a missing variable crashes immediately, not at 3am on the first request that needs it.
- `process.env` values are **always strings**: convert numbers and booleans explicitly.
- **`NODE_ENV=production`** matters: Express and other libraries enable caching and less verbose errors; `npm ci --omit=dev` skips devDependencies.

### nd56 | How does JWT authentication work in a Node API?

A **JWT** (JSON Web Token) is a signed token: `header.payload.signature` (base64url). The server signs claims (user id, roles, expiry); it can later **verify** the signature without a database lookup, which makes it **stateless**.

```js
const jwt = require("jsonwebtoken");

// login
app.post("/login", async (req, res) => {
  const user = await verifyPassword(req.body.email, req.body.password);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const accessToken = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "15m" });
  res.json({ accessToken });                 // or set it as an HttpOnly cookie
});

// protect routes
function auth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
```

Key points:
- The payload is **encoded, not encrypted**: anyone can read it. Never put secrets in it.
- **Short-lived access tokens** (5–15 minutes) + **refresh tokens** (longer, stored securely, rotated, revocable server-side).
- Revocation is the weakness of stateless tokens; use short expiry, a denylist, or token versioning.
- Store tokens in browsers as **HttpOnly, Secure, SameSite cookies** (safe from XSS) rather than localStorage. Add CSRF protection when using cookies.
- Pin the algorithm on verify; use RS256 (public/private keys) when other services need to verify tokens without the signing secret.

### nd57 | How do you store passwords securely?

**Never store plain text or fast hashes** (MD5, SHA-256). Use a **slow, salted, adaptive** password hashing algorithm: **bcrypt**, **scrypt** or **Argon2** (Argon2id is the current recommendation).

```js
const bcrypt = require("bcrypt");

// sign-up
const hash = await bcrypt.hash(password, 12);     // cost factor 12: ~250ms, a random salt is built in
await db.users.insert({ email, passwordHash: hash });

// login
const ok = await bcrypt.compare(password, user.passwordHash);   // constant-time comparison
```

Why:
- **Salt** (random per user): identical passwords get different hashes, which defeats precomputed rainbow tables.
- **Slow by design** (the cost factor): makes brute force expensive. Raise the cost as hardware gets faster.
- The async versions run on the **libuv thread pool**, so they don't block the event loop. Never use `hashSync` in request handlers.

Built-in alternative with no dependency: `crypto.scrypt`. Also: rate-limit login attempts, lock out or add CAPTCHA after failures, and use the generic message "invalid email or password".

### nd58 | What are the most important security practices for a Node/Express API?

1. **Validate all input** (Zod/Joi): types, lengths, formats; reject unknown fields.
2. **Prevent injection**: parameterised queries / ORMs, never string-concatenated SQL; watch for NoSQL operator injection (`{ "$gt": "" }`); no `exec` with user input; avoid `eval`.
3. **Security headers** with **helmet** (CSP, HSTS, `X-Content-Type-Options`, frame options).
4. **Rate limiting** (express-rate-limit with a Redis store) on login, OTP and expensive endpoints; request body size limits.
5. **Authentication and authorisation on every route**: check ownership (users can only access their own resources; IDOR is a top bug).
6. **Secrets** in env or a secret manager, never in code or logs.
7. **HTTPS** everywhere; secure cookies (`HttpOnly`, `Secure`, `SameSite`).
8. **Dependencies**: `npm audit`, Dependabot/Snyk, lockfiles, minimal packages (supply-chain attacks).
9. **Error handling**: no stack traces or internal details sent to clients.
10. **Avoid ReDoS** (unsafe regexes) and big synchronous work that lets a single request DoS the server.
11. **Prototype pollution**: don't deep-merge untrusted objects into config; strip `__proto__` and `constructor` keys.
12. Run as a **non-root** user in containers; use least-privilege DB users.

Reference: the **OWASP Top 10** and the Node.js security best practices guide.

### nd59 | What does the crypto module provide?

`node:crypto` provides cryptography built on OpenSSL:

```js
const crypto = require("node:crypto");

// secure random values
crypto.randomUUID();                          // "3b241101-e2bb-4255-8caf-4136c566a962"
crypto.randomBytes(32).toString("hex");       // tokens, reset links, API keys
crypto.randomInt(100000, 999999);             // a 6-digit OTP

// hashing (integrity, checksums, cache keys; NOT for passwords)
crypto.createHash("sha256").update(fileBuffer).digest("hex");

// HMAC (verify a webhook signature)
const sig = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
const valid = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(req.headers["x-signature"]));

// password hashing: scrypt (slow, salted); runs on the thread pool
crypto.scrypt(password, salt, 64, (err, key) => {});

// symmetric encryption (AES-256-GCM)
const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv("aes-256-gcm", key32, iv);
```

Rules: use `randomBytes`/`randomUUID`, never `Math.random()`, for anything security-related; compare secrets with `timingSafeEqual` (prevents timing attacks); use **authenticated** encryption (GCM). The async variants of heavy operations (`pbkdf2`, `scrypt`) use the libuv thread pool.

## Testing and debugging

### nd60 | How do you test a Node.js API?

Test levels:
- **Unit**: pure functions and services with dependencies mocked.
- **Integration**: routes + DB + services together, often against a real DB in a container (**Testcontainers**).
- **End-to-end / contract**: the deployed service; consumer-driven contracts (Pact).

Tools: **Jest** or **Vitest** (or the built-in `node:test` runner); **Supertest** for HTTP; **nock** / MSW to mock outgoing HTTP.

```js
// app.js exports the app WITHOUT calling listen() -> testable
const request = require("supertest");
const app = require("../src/app");

describe("POST /api/users", () => {
  it("creates a user", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ name: "A", email: "a@b.com" })
      .expect(201);
    expect(res.body).toMatchObject({ name: "A" });
  });

  it("rejects invalid email", async () => {
    await request(app).post("/api/users").send({ name: "A", email: "x" }).expect(400);
  });
});

// mocking a dependency
jest.mock("../src/services/mailer", () => ({ send: jest.fn().mockResolvedValue(true) }));
```

Good practices: separate `app` from `server` (listen); isolate test data (transactions, fresh containers); test error paths and edge cases; use fake timers for time-based logic; don't hit real third-party services in tests.

### nd61 | How do you debug and profile a Node.js application?

**Debugging**
```bash
node --inspect app.js          # then open chrome://inspect, or attach VS Code
node --inspect-brk app.js      # pause on the first line
node --watch app.js            # auto-restart on file changes (Node 18+)
```
- Breakpoints, the `debugger;` statement, stepping, watch expressions, the async call stack.
- VS Code's built-in Node debugger (launch.json or the auto-attach terminal).
- `NODE_DEBUG=http,net node app.js` for core-module debug logs.

**Profiling CPU (slow endpoints, high CPU)**
```bash
node --cpu-prof app.js         # writes a .cpuprofile -> open it in DevTools (flame chart)
npx clinic flame -- node app.js
```

**Memory**: heap snapshots via `--inspect` or `--heapsnapshot-signal`; compare snapshots to find leaks.

**In production**
- Structured logs with request ids; distributed tracing (OpenTelemetry) to see which downstream call is slow.
- Metrics: event loop lag, heap, GC pauses, request latency, error rate.
- Error tracking (Sentry) with source maps.
- Diagnostic reports: `node --report-on-fatalerror`.


## Data, real-time and production

### nd62 | Why do you need a database connection pool?

Opening a DB connection is expensive: TCP + TLS handshake + authentication, which takes tens of milliseconds, and the database limits how many connections it allows. A **pool** keeps a set of **open connections** and lends them out per query.

```js
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                       // at most 10 open connections from THIS process
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000, // fail fast instead of waiting forever when exhausted
});

// a simple query: borrow + release automatically
const { rows } = await pool.query("SELECT * FROM orders WHERE user_id = $1", [userId]); // parameterised!

// a transaction: hold ONE connection for every statement
const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query("UPDATE accounts SET balance = balance - $1 WHERE id = $2", [amt, from]);
  await client.query("UPDATE accounts SET balance = balance + $1 WHERE id = $2", [amt, to]);
  await client.query("COMMIT");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();              // ALWAYS release, or the pool leaks and the app hangs
}
```

Sizing: total connections = pool size × the number of processes/pods. Ten pods × 20 = 200, which may exceed Postgres's `max_connections`. For many instances or serverless, use **PgBouncer** or RDS Proxy. Create **one pool per process** at startup (a module singleton), never one per request.

### nd63 | ORM or raw SQL in Node (Prisma, Sequelize, TypeORM, Drizzle, Knex)?

| Option | What it is | Good for |
|---|---|---|
| Raw driver (`pg`, `mysql2`) | you write SQL | full control, performance-critical or complex queries |
| **Query builder** (Knex, Kysely) | SQL built in JS, type-safe with Kysely | flexibility with composable queries |
| **Prisma** | schema file → generated, fully typed client + migrations | TypeScript apps that want productivity and type safety |
| **Drizzle** | a light, SQL-like, type-safe ORM | type safety with SQL familiarity, serverless |
| Sequelize / TypeORM | classic Active Record / Data Mapper ORMs | existing projects; TypeORM feels close to JPA/Hibernate |

```ts
// Prisma
const user = await prisma.user.findUnique({
  where: { id },
  include: { orders: { where: { status: "PAID" } } },   // a relation, typed result
});
```

Trade-offs to mention:
- ORMs speed up CRUD and give types and migrations, but can hide **N+1 queries** and produce inefficient SQL. Know how to log or inspect the generated queries.
- Complex reports and analytics are often clearer in raw SQL (every ORM has a raw query escape hatch).
- Whichever you use: **parameterised queries** (no string concatenation), **migrations** in version control, indexes for the query patterns, transactions for multi-step writes.

For a Java developer: Prisma/TypeORM ≈ Spring Data JPA; Knex ≈ jOOQ / JdbcTemplate.

### nd64 | What is the difference between session-based and token-based (JWT) authentication?

**Session (stateful)**
- On login, the server creates a session record (in **Redis** or the DB) and sends a **session id in an HttpOnly cookie**.
- Every request: the cookie arrives → the server looks up the session → gets the user.
- **Revocation is easy** (delete the session); the session data stays on the server.
- Needs a shared session store when there are several instances; cookies need CSRF protection.

**Token (stateless JWT)**
- On login, the server signs a JWT containing the claims; the client sends it each time (header or cookie).
- The server **verifies the signature**: no lookup, so it scales across services and is easy for microservices and mobile clients.
- **Hard to revoke** before expiry (needs short TTLs + refresh tokens, or a denylist); bigger requests; claims can go stale (a changed role isn't seen until a refresh).

```js
// sessions in Express
app.use(session({
  store: new RedisStore({ client: redis }),
  secret: process.env.SESSION_SECRET,
  cookie: { httpOnly: true, secure: true, sameSite: "lax", maxAge: 86_400_000 },
  resave: false, saveUninitialized: false,
}));
req.session.userId = user.id;
```

Rule of thumb: **sessions** for a classic web app with its own backend (simpler, safer revocation); **JWT** for APIs consumed by several services or mobile apps, or SSO between services. Many systems mix them: a session at the edge, short JWTs between services.

### nd65 | How does OAuth 2.0 / "Login with Google" work?

**OAuth 2.0** lets an app get **limited access** to a user's resources at another provider without seeing their password. **OpenID Connect (OIDC)** adds **login (identity)** on top, through an **ID token** (a JWT about the user).

**Authorization Code flow (+ PKCE)**, the standard for web and mobile:
1. The user clicks "Login with Google" → the app redirects to Google with `client_id`, `redirect_uri`, `scope=openid email profile`, `state` (CSRF protection), and a `code_challenge` (PKCE).
2. The user signs in at **Google** (your app never sees the password) and consents.
3. Google redirects back to `redirect_uri?code=XYZ&state=...`.
4. Your **backend** exchanges the `code` (+ `client_secret` / `code_verifier`) at Google's token endpoint for an **access token** (+ ID token, + refresh token).
5. The backend verifies the ID token, finds or creates the user, then creates **its own session or JWT** for your app.

```js
// step 4 (simplified)
const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  body: new URLSearchParams({ code, client_id, client_secret, redirect_uri, grant_type: "authorization_code" }),
});
const { id_token, access_token } = await tokenRes.json();
```

Other grants: **Client Credentials** for service-to-service calls (machine identity, no user); refresh tokens for long sessions. Avoid the deprecated Implicit flow. In Node, libraries like Passport, openid-client, Auth.js or an IdP (Auth0, Cognito, Keycloak) handle the details.

### nd66 | How do you implement rate limiting?

Rate limiting protects APIs from abuse, brute force and overload by limiting requests per client (IP, user, API key) per time window.

```js
const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");

app.use("/api/", rateLimit({
  windowMs: 60_000,
  limit: 100,                               // 100 requests per minute per IP
  standardHeaders: "draft-7",               // RateLimit-* headers
  store: new RedisStore({ sendCommand: (...args) => redis.sendCommand(args) }), // shared across instances
}));

app.post("/api/login", rateLimit({ windowMs: 15 * 60_000, limit: 5 }), login);  // stricter on sensitive routes
```

Algorithms:
- **Fixed window**: a counter per minute. Simple, but allows bursts at window edges (2× the limit across a boundary).
- **Sliding window** (log or counter): smoother and more accurate.
- **Token bucket**: tokens refill at a steady rate, and each request spends one. Allows controlled bursts; the most common in APIs.
- **Leaky bucket**: processes at a constant rate; queues or drops the excess.

Key points:
- With several instances, store counters in **Redis** (atomic `INCR` + `EXPIRE`, or a Lua script), not in memory.
- Return **429 Too Many Requests** with a `Retry-After` header.
- Behind a proxy or load balancer, set `app.set("trust proxy", 1)` so the real client IP is used.
- Coarse limits often live at the **API gateway / nginx / CDN**.

### nd67 | How do you handle file uploads in Node?

**multer** (multipart/form-data) is the usual choice in Express:

```js
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),             // or diskStorage for temp files
  limits: { fileSize: 5 * 1024 * 1024 },       // 5MB limit: always set one
  fileFilter: (req, file, cb) => {
    const ok = ["image/png", "image/jpeg"].includes(file.mimetype);
    cb(ok ? null : new Error("Only PNG/JPEG allowed"), ok);
  },
});

app.post("/avatar", requireAuth, upload.single("avatar"), async (req, res) => {
  const key = `avatars/${req.user.id}/${crypto.randomUUID()}.png`;   // never trust the original file name
  await s3.send(new PutObjectCommand({ Bucket, Key: key, Body: req.file.buffer, ContentType: req.file.mimetype }));
  res.status(201).json({ key });
});
```

Better at scale: **pre-signed URLs**. The server generates a short-lived signed upload URL, and the browser uploads **directly to S3 / Azure Blob**. Large files then never pass through your Node process: no memory pressure, no event loop work, cheaper bandwidth.

Security checklist:
- Size limits.
- Validate the type by **content** (magic bytes), not just the extension or MIME header.
- Generate your own file names (avoids path traversal).
- Store **outside** the web root or in object storage.
- Virus-scan if users share files.
- Serve user files from a separate domain or with `Content-Disposition`.

For very large files, **stream** them (busboy) instead of buffering in memory.

### nd68 | How do WebSockets work in Node, and when do you use them?

**WebSocket** is a **persistent, full-duplex** connection over a single TCP socket. It starts as an HTTP request with `Upgrade: websocket`, then both sides can send messages at any time. That makes it a natural fit for Node's event-driven model: thousands of idle connections cost little.

```js
// with socket.io (rooms, reconnection, fallbacks, acknowledgements)
const { Server } = require("socket.io");
const io = new Server(httpServer, { cors: { origin: "https://app.example.com" } });

io.use(authenticateSocket);                     // verify the token on connect
io.on("connection", (socket) => {
  socket.join(`room:${socket.data.roomId}`);
  socket.on("message", async (msg) => {
    const saved = await saveMessage(msg);
    io.to(`room:${socket.data.roomId}`).emit("message", saved);  // broadcast to the room
  });
  socket.on("disconnect", () => {});
});
```

Plain alternative: the `ws` library (lighter, raw WebSocket protocol).

Use cases: chat, live collaboration, multiplayer games, live dashboards, notifications.

Scaling concerns:
- Connections are **stateful**, so with several instances you need a **pub/sub backplane** (Redis adapter for socket.io) to broadcast across servers, and often **sticky sessions** at the load balancer.
- Authenticate on connect; validate every message.
- Heartbeats (ping/pong) to detect dead connections; limits on message size and rate.

### nd69 | What is the difference between polling, long polling, Server-Sent Events and WebSockets?

| | Direction | How | Good for |
|---|---|---|---|
| **Short polling** | client → server | request every N seconds | simple, infrequent updates (wasteful otherwise) |
| **Long polling** | client → server | the server **holds** the request until there's data or a timeout, then the client re-requests | fallback for real-time when nothing else is available |
| **SSE** (Server-Sent Events) | **server → client only** | one long HTTP response streaming `text/event-stream` | live feeds, notifications, progress, **LLM token streaming** |
| **WebSocket** | **both ways** | an upgraded persistent TCP connection | chat, collaboration, games (frequent client messages) |

```js
// SSE in Express: simple, plain HTTP, with auto-reconnect built into the browser's EventSource
app.get("/events", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);
  const unsubscribe = bus.on("order:update", send);
  req.on("close", unsubscribe);                    // clean up on disconnect
});
// browser: new EventSource("/events").onmessage = (e) => console.log(JSON.parse(e.data));
```

Choose **SSE** when only the server pushes (simpler: works with HTTP/2, proxies and auth cookies, and reconnects automatically). Choose **WebSockets** when the client also sends frequent messages.

### nd70 | How do you run background jobs in Node?

Don't do slow work (emails, PDFs, video processing, third-party syncs) inside the request. **Enqueue a job, respond immediately, and let workers process it.**

```js
// BullMQ (Redis-backed queue)
const { Queue, Worker } = require("bullmq");
const connection = { host: "localhost", port: 6379 };

const emailQueue = new Queue("emails", { connection });

app.post("/signup", async (req, res) => {
  const user = await createUser(req.body);
  await emailQueue.add("welcome", { userId: user.id }, {
    attempts: 5,
    backoff: { type: "exponential", delay: 2000 },  // automatic retries
    removeOnComplete: true,
  });
  res.status(201).json(user);                       // fast response
});

// a separate worker process (scaled independently of the API)
new Worker("emails", async (job) => {
  await sendWelcomeEmail(job.data.userId);          // should be IDEMPOTENT: retries happen
}, { connection, concurrency: 10 });
```

What a queue gives you: retries with backoff, delayed and scheduled (cron) jobs, concurrency control, priorities, dead-letter handling, and survival across restarts (unlike `setTimeout` or in-memory arrays).

Options: **BullMQ** (Redis), cloud queues (**SQS**, Azure Service Bus, Pub/Sub), or **Kafka** for event streaming between services. Jobs must be **idempotent** (they can run more than once), and should be monitored (failed-job counts, queue depth).

### nd71 | How do Node microservices communicate (HTTP vs messaging, Kafka)?

**Synchronous (request/response)**: REST/HTTP, **gRPC** (fast, binary, typed contracts with protobuf), GraphQL federation.
- Simple and immediate, but creates **temporal coupling**: if the downstream service is slow or down, so are you. You need **timeouts, retries with backoff, and circuit breakers**.

**Asynchronous (messaging/events)**: **Kafka**, RabbitMQ, SQS/SNS.
- The producer publishes an event (`order.placed`); consumers react independently. **Loose coupling**, it absorbs load spikes, it's replayable (Kafka), and it suits event-driven architectures.
- Costs: eventual consistency, idempotent consumers, ordering and duplicates, and harder debugging.

```js
// Kafka with kafkajs
const { Kafka } = require("kafkajs");
const kafka = new Kafka({ clientId: "orders-svc", brokers: ["kafka:9092"] });

const producer = kafka.producer({ idempotent: true });
await producer.connect();
await producer.send({
  topic: "order-events",
  messages: [{ key: String(order.id), value: JSON.stringify({ type: "OrderPlaced", order }) }], // key -> same partition -> ordered per order
});

const consumer = kafka.consumer({ groupId: "billing-svc" });
await consumer.connect();
await consumer.subscribe({ topic: "order-events" });
await consumer.run({
  eachMessage: async ({ message }) => {
    const evt = JSON.parse(message.value.toString());
    await billing.handle(evt);        // idempotent: dedupe by event id (at-least-once delivery)
  },
});
```

Patterns to know: the **outbox pattern** (write the DB row and the event atomically), sagas for distributed transactions, correlation ids for tracing, and schema registry / versioned event contracts.

### nd72 | How do you make outbound HTTP calls resilient (timeouts, retries, circuit breakers)?

A slow dependency is worse than a dead one: requests pile up waiting, memory grows and the whole service degrades. Defend every outbound call:

```js
// 1. TIMEOUTS: never wait forever (fetch has no default timeout)
const res = await fetch(url, { signal: AbortSignal.timeout(2000) });

// 2. RETRIES with exponential backoff + jitter, only for transient failures
//    (network errors, 502/503/504, 429) and only for idempotent requests

// 3. CIRCUIT BREAKER: stop calling a failing service for a while (opossum)
const CircuitBreaker = require("opossum");
const breaker = new CircuitBreaker(callPaymentService, {
  timeout: 3000,                    // count slow calls as failures
  errorThresholdPercentage: 50,     // open when 50% fail...
  resetTimeout: 10_000,             // ...try again (half-open) after 10s
});
breaker.fallback(() => ({ status: "queued" }));   // degrade gracefully
const result = await breaker.fire(order);
```

The circuit breaker's states: **closed** (normal) → **open** (fail fast immediately, so you don't hammer the sick service and threads/sockets don't pile up) → **half-open** (let a few trial requests through; close again if they succeed).

Also: **bulkheads** (separate concurrency limits per dependency), **idempotency keys** on retried writes, **keep-alive agents** for connection reuse, and fallbacks or cached responses. This is the same as Resilience4j in the Spring world.

### nd73 | How do you containerise a Node app well (Docker best practices)?

```dockerfile
# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci                         # exact versions from the lockfile; cached layer
COPY . .
RUN npm run build && npm prune --omit=dev   # drop devDependencies after building

# ---- runtime stage: small, minimal ----
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
USER node                          # don't run as root
EXPOSE 3000
HEALTHCHECK CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/server.js"]     # node directly (not npm start) so SIGTERM reaches the process
```

Best practices:
- **Multi-stage builds**: build tools stay out of the final image, which makes it smaller and safer.
- Copy `package*.json` and install **before** copying the source, so the dependency layer is cached between builds.
- **`npm ci`** + a committed lockfile; `--omit=dev` in production.
- A **`.dockerignore`** (`node_modules`, `.git`, `.env`, tests).
- Run as the **non-root** `node` user; pin the base image version (`node:22-alpine`); scan images for vulnerabilities.
- **Signal handling** for graceful shutdown (`node` as the command, or `--init`/tini).
- Config through env vars; logs to stdout; one process per container (scale with replicas instead of cluster).
- Set memory limits, and `--max-old-space-size` to fit the container limit.

### nd74 | Why use TypeScript for Node backends, and how do you run it?

TypeScript adds **static types** to JavaScript: compile-time checks, autocomplete and safe refactoring. That's very valuable in backends with many models, DTOs and service boundaries. It feels natural if you come from Java.

```ts
interface CreateOrderDto {
  userId: string;
  items: { productId: string; qty: number }[];
}

export async function createOrder(dto: CreateOrderDto): Promise<Order> {
  // dto.itemz  -> compile error; the return type is checked
  return repo.insert(dto);
}

// validate untrusted input at RUNTIME too: types vanish after compilation
import { z } from "zod";
const CreateOrder = z.object({
  userId: z.string().uuid(),
  items: z.array(z.object({ productId: z.string(), qty: z.number().int().positive() })).min(1),
});
type CreateOrderInput = z.infer<typeof CreateOrder>;   // one source of truth for type + validation
const dto = CreateOrder.parse(req.body);
```

Running it:
- **Build** with `tsc` (or esbuild/tsup) into JS in `dist/`; run `node dist/server.js` in production.
- **Dev**: `tsx watch src/server.ts`. Newer Node versions can also run `.ts` files directly by **stripping the types** (type stripping, Node 22.6+ behind a flag, on by default from Node 23.6), but that doesn't type-check, so still run `tsc --noEmit` in CI.
- Use `"strict": true` in tsconfig.

Key point for interviews: **types are compile-time only**. Request bodies, env vars and external API responses must still be validated at runtime (Zod), which is why DTO validation libraries matter.

### nd75 | What is NestJS, and why might a Spring developer like it?

**NestJS** is a structured, opinionated Node framework (TypeScript-first) inspired by **Angular and Spring**. It runs on Express (or Fastify) underneath, but gives large teams a consistent architecture.

| Spring Boot | NestJS |
|---|---|
| `@RestController` + `@GetMapping` | `@Controller()` + `@Get()` |
| `@Service`, `@Component` + DI | `@Injectable()` providers + **dependency injection** |
| `@Configuration` / modules | `@Module({ controllers, providers, imports })` |
| Bean Validation (`@Valid`, DTOs) | `class-validator` DTOs + `ValidationPipe` |
| Filters / interceptors / AOP | Guards, Interceptors, Pipes, Exception filters |
| Spring Data JPA | TypeORM / Prisma / MikroORM integrations |

```ts
@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}   // injected

  @Get(":id")
  @UseGuards(AuthGuard)
  findOne(@Param("id") id: string) {
    return this.orders.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateOrderDto) {                    // validated by ValidationPipe
    return this.orders.create(dto);
  }
}
```

It includes microservice transports (Kafka, gRPC, Redis, RabbitMQ), WebSockets, GraphQL, testing utilities, OpenAPI generation and CQRS modules.

Trade-off: more boilerplate and decorators than plain Express, but much better consistency in large codebases. Express/Fastify suit small services where you want minimal structure.

### nd76 | REST vs GraphQL in Node: when would you choose each?

**REST**: multiple endpoints, one per resource; the server decides the response shape.
**GraphQL**: **one endpoint**; the **client asks for exactly the fields it needs**, across related data, in one request, against a typed schema.

```graphql
query {
  user(id: "42") {
    name
    orders(last: 3) { id total items { name } }
  }
}
```

| | REST | GraphQL |
|---|---|---|
| Over/under-fetching | common (several calls, or extra fields) | the client picks the fields; one round trip |
| Caching | easy: HTTP caching, CDN, ETags | harder (POSTs to one URL; needs client caches like Apollo) |
| Schema / types | OpenAPI (optional) | a strongly typed schema built in; introspection |
| Versioning | `/v1`, `/v2` | evolve the schema; deprecate fields |
| Performance pitfalls | chatty clients | **N+1 resolvers** (fix with DataLoader batching), expensive deep queries (needs depth/complexity limits) |
| Errors | HTTP status codes | usually 200 with an `errors` array |
| File uploads, streaming | simple | awkward |

Node options: Apollo Server, GraphQL Yoga, Mercurius (Fastify), NestJS GraphQL.

Choose **GraphQL** for client-driven UIs with varied data needs (mobile + web), or aggregating several backends (a BFF / federation). Choose **REST** for simple CRUD, public APIs, heavy HTTP caching, and service-to-service calls (or gRPC there).

### nd77 | What are Node.js release lines and LTS, and which version should you run?

Node releases a new **major version every six months**:
- **Even-numbered** versions (20, 22, 24…) become **LTS (Long-Term Support)**: about 30 months of support (Active LTS, then Maintenance LTS, with critical and security fixes).
- **Odd-numbered** versions (21, 23, 25…) are **Current** only, short-lived (about 6 months), for trying new features. They never become LTS.

In **production, run an Active or Maintenance LTS** version. Upgrade before it reaches **end-of-life** (no more security patches); check the schedule at nodejs.org.

Practical tips:
- Pin the version: `"engines": { "node": ">=22" }` in package.json, a `.nvmrc` / `.node-version` file, and the Docker base image tag.
- Manage local versions with **nvm**, fnm or Volta.
- Test upgrades in CI first: new V8 versions can change performance and deprecate APIs.
- Recent versions brought built-in `fetch`, the test runner, `--watch`, `--env-file`, a permission model, `require(esm)` and type stripping. Knowing them shows you're current.
