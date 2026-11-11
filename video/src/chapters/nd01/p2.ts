import type { Scene } from "../../lib/types.ts";
import { B, custom, qa, sec } from "../web/h.ts";
import { check } from "./p1.ts";

// Part 2: module 3 (modules and npm), module 4 (async patterns and events),
// module 5 (buffers and streams) and module 6 (files and HTTP).
export const p2: Scene[] = [
  // ================================================================ module 3
  sec("3", "Modules and npm", "Module three. Modules and npm. Six questions about how code is loaded and how dependencies are managed."),
  custom(
    "pypipe",
    {
      title: "The idea: what require(\"./db\") does, once",
      stages: [
        { name: "Resolve", icon: "🧭", sub: "find the file" },
        { name: "Cache?", icon: "🗃️", sub: "require.cache" },
        { name: "Wrap", icon: "🎁", sub: "function(exports, require, module…)" },
        { name: "Run", icon: "▶️", sub: "top-level code" },
        { name: "Return", icon: "📤", sub: "module.exports" },
      ],
      steps: [
        { at: 0, text: "Resolve the path: core module, relative file (.js, .json, index.js), or node_modules up the folder tree." },
        { at: 1, text: "If it's already in the cache, return the cached exports immediately: modules are singletons." },
        { at: 2, text: "Otherwise wrap the file's code in a function, which is where exports, require, module, __filename and __dirname come from." },
        { at: 3, text: "Run it, synchronously, once." },
        { at: 4, text: "Cache it and return module.exports. Every later require gets the same object." },
      ],
    },
    B(
      "Here's the idea: what require does. First it resolves the name to a file: a core module, a relative path, trying dot j s, dot json and index files, or a package in node modules, searching up the folders.",
      "Then it checks the cache. If the module was loaded before, it returns the same exports straight away. That's why a module is effectively a singleton.",
      "Otherwise it wraps the file's code in a function. That wrapper is where exports, require, module, double underscore filename and dirname come from. They're parameters, not globals.",
      "It runs the code, synchronously, once.",
      { say: "And it caches and returns module dot exports. Resolve, cache, wrap, run, return.", tone: "key" },
    ),
  ),
  qa(16, "How does require() work?", [
    "Resolve the path → check require.cache → wrap the code in a function → run it → return module.exports",
    "Synchronous, and cached: a second require returns the same object",
    "Circular requires get a partially-filled exports object",
  ]),
  qa(17, "What is the difference between module.exports and exports?", [
    "exports starts as a reference to module.exports; require returns module.exports",
    "exports.add = … works (it mutates the shared object)",
    "exports = { add } breaks the link and exports nothing; assign module.exports instead",
  ]),
  qa(18, "How do you use ES modules in Node, and how do they interoperate with CommonJS?", [
    "Use .mjs, or \"type\": \"module\" in package.json; import / export; top-level await",
    "ESM can import CommonJS (module.exports becomes the default export)",
    "CommonJS loads ESM with await import(); newer Node versions can require() ESM without top-level await",
    "No __dirname in ESM: use import.meta.dirname or import.meta.url",
  ]),
  qa(19, "What is in package.json, and what is the difference between dependencies, devDependencies and peerDependencies?", [
    "name, version, scripts, main/exports, type, engines, and the dependency lists",
    "dependencies: needed at runtime; devDependencies: only to build and test",
    "peerDependencies: a plugin says “I need the host's copy”, e.g. a React library needs react",
  ]),
  qa(20, "How do semantic versioning and package-lock.json work?", [
    "MAJOR.MINOR.PATCH: breaking . features . fixes",
    "^1.2.3 allows 1.x updates; ~1.2.3 allows 1.2.x only",
    "package-lock.json pins the exact tree; commit it, and install in CI with npm ci",
  ]),
  qa(21, "What is the difference between npm and npx?", [
    "npm installs and manages packages and runs scripts",
    "npx runs a package's binary without installing it globally (npx create-vite)",
    "It uses the local node_modules/.bin first, then downloads if needed",
  ]),

  // ================================================================ module 4
  sec("4", "Async patterns and events", "Module four. Async patterns and events. Four questions on Node's own conventions."),
  qa(22, "What is the error-first callback convention?", [
    "Node callbacks are called as callback(err, result)",
    "Check err first and return; otherwise use the result",
    "Always call the callback exactly once, and asynchronously",
  ], { code: `fs.readFile("a.txt", "utf8", (err, data) => {\n  if (err) return handle(err);\n  use(data);\n});` }),
  qa(23, "How do you convert callback APIs to promises in Node (util.promisify)?", [
    "util.promisify(fn) turns an error-first callback function into one that returns a promise",
    "Most core modules already have promise versions: fs/promises, timers/promises, stream/promises",
    "Then use async/await everywhere",
  ]),
  qa(24, "What is the EventEmitter, and how does it work?", [
    "The base of streams, servers and sockets: on(event, fn), once, emit, off",
    "emit calls listeners synchronously, in the order they were added",
    "An 'error' event with no listener crashes the process; too many listeners warns of a leak",
  ]),
  qa(25, "How do you limit concurrency when running many async operations?", [
    "Promise.all on 10,000 items starts 10,000 requests at once: rate limits, memory, sockets",
    "Run in batches, or a pool of N workers pulling from a queue",
    "Libraries: p-limit, p-queue; or for await over a stream",
  ], { code: `async function mapLimit(items, n, fn) {\n  const out = [];\n  let i = 0;\n  async function worker() {\n    while (i < items.length) {\n      const k = i++;\n      out[k] = await fn(items[k]);\n    }\n  }\n  await Promise.all(Array.from({ length: n }, worker));\n  return out;\n}` }),

  // ================================================================ module 5
  sec("5", "Buffers and streams", "Module five. Buffers and streams. Six questions about handling data too big, or too continuous, to hold in memory at once."),
  custom(
    "pypipe",
    {
      title: "The idea: a stream moves data in chunks, at the speed of the slowest part",
      stages: [
        { name: "Readable", icon: "📄", sub: "fs.createReadStream" },
        { name: "Transform", icon: "🗜️", sub: "zlib.createGzip" },
        { name: "Writable", icon: "🌐", sub: "the HTTP response" },
      ],
      steps: [
        { at: 0, text: "A 2 GB file is read in chunks (64 KB by default), never all at once." },
        { at: 1, text: "Each chunk is transformed (compressed) as it passes through." },
        { at: 2, text: "And written out to a slow client. Memory stays at a few chunks, whatever the file size." },
        { at: [2, 0], text: "If the client is slower than the disk, write() returns false: the readable pauses until 'drain'. That's backpressure.", back: true },
      ],
    },
    B(
      "Here's the idea. A stream moves data in chunks. A two gigabyte file is read sixty four kilobytes at a time, never all at once.",
      "Each chunk can be transformed as it passes, here compressed with gzip.",
      "And written out, here to an HTTP response going to a slow phone. Memory stays at a few chunks, however big the file.",
      { say: "And when the client is slower than the disk, the writable's buffer fills up, write returns false, and the readable is paused until the writable emits drain. That's backpressure: the pipeline runs at the speed of its slowest part, instead of piling data up in memory.", tone: "key" },
    ),
  ),
  qa(26, "What is a Buffer?", [
    "A fixed-size chunk of raw binary memory, outside the V8 heap (a Uint8Array subclass)",
    "For files, sockets, images, crypto: anything that isn't text",
    "Convert with Buffer.from(\"hi\", \"utf8\") and buf.toString(\"base64\")",
  ]),
  qa(27, "What are streams, and why use them?", [
    "Process data piece by piece as it arrives, instead of loading it all",
    "Constant memory for huge files; start sending before you've finished reading",
    "Composable: read → transform → write; HTTP requests and responses are streams",
  ]),
  qa(28, "What are the four types of streams?", [
    "Readable: a source (fs.createReadStream, an incoming request)",
    "Writable: a destination (fs.createWriteStream, the response)",
    "Duplex: both, independently (a TCP socket); Transform: a duplex that changes data (gzip, crypto)",
  ]),
  qa(29, "What is backpressure, and how does Node handle it?", [
    "The consumer is slower than the producer: unchecked, data piles up in memory",
    "write() returns false when the buffer passes highWaterMark; stop writing until 'drain'",
    "pipe() and pipeline() do this for you",
  ]),
  qa(30, "Why is pipeline() better than pipe()?", [
    "pipe() doesn't forward errors or destroy the other streams when one fails: leaks",
    "pipeline() connects them, handles errors and cleanup for every stream, and tells you when it's done",
    "Use the promise version: await pipeline(src, transform, dest)",
  ], { code: `import { pipeline } from "node:stream/promises";\n\nawait pipeline(\n  fs.createReadStream("big.log"),\n  zlib.createGzip(),\n  fs.createWriteStream("big.log.gz"),\n);` }),
  qa(31, "What is the difference between fs.readFile and fs.createReadStream?", [
    "readFile loads the whole file into memory, then gives it to you",
    "createReadStream gives you chunks as they're read: constant memory",
    "readFile for small files (config); streams for big files or sending to clients",
  ]),
  check({
    topic: "streams",
    q: "An endpoint serves 1 GB video files with fs.readFile. What goes wrong under load, and what's the fix?",
    say: "An endpoint serves one gigabyte video files using read file. What goes wrong under load, and what's the fix?",
    a: "Each request holds 1 GB in memory before sending anything: a few requests exhaust RAM. Stream it: pipeline(fs.createReadStream(path), res), ideally with range support.",
    aSay: "Every request loads a whole gigabyte into memory before sending a byte, so a few concurrent requests run the server out of memory. Stream it instead, with pipeline from a read stream to the response.",
  }),

  // ================================================================ module 6
  sec("6", "Files and HTTP", "Module six. Files and HTTP. Five questions, from the fs module to Express."),
  qa(32, "What are the three styles of fs API, and which should you use?", [
    "Callbacks: fs.readFile(path, cb); Sync: fs.readFileSync(path); Promises: fs/promises",
    "Use fs/promises with async/await in servers",
    "Sync only at startup or in CLI scripts, never in a request handler",
  ]),
  qa(33, "What is the path module for?", [
    "Building file paths that work on every OS: path.join, path.resolve",
    "Pieces of a path: basename, dirname, extname, parse",
    "Never concatenate paths with \"/\"; resolve user input carefully (path traversal)",
  ]),
  qa(34, "How do you create an HTTP server with the core http module?", [
    "http.createServer((req, res) => { … }).listen(3000)",
    "You parse the URL, method and body yourself; res.writeHead, res.end",
    "Fine for learning; frameworks add routing, parsing and middleware",
  ], { code: `import http from "node:http";\n\nhttp.createServer((req, res) => {\n  if (req.method === "GET" && req.url === "/health") {\n    res.writeHead(200, { "content-type": "application/json" });\n    return res.end(JSON.stringify({ ok: true }));\n  }\n  res.writeHead(404).end();\n}).listen(3000);` }),
  qa(35, "What is Express, and why use it over plain http?", [
    "A minimal web framework on top of http",
    "Routing, middleware, body parsing, req/res helpers, a huge ecosystem",
    "Express 5 handles rejected promises in async handlers; alternatives: Fastify, NestJS, Hono",
  ]),
  qa(36, "What is the difference between req.params, req.query and req.body?", [
    "req.params: route parameters: /users/:id → req.params.id",
    "req.query: the query string: ?page=2 → req.query.page (always strings)",
    "req.body: the parsed request body, only with a parser like express.json()",
  ]),
];
