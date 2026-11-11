import type { Scene } from "../../lib/types.ts";
import { B, qa, sec } from "../web/h.ts";
import { check } from "./p1.ts";

// Part 4: module 10 (browser and DOM), module 11 (modules, memory and the
// runtime), module 12 (classic implementations) and the close.
export const p4: Scene[] = [
  // ================================================================ module 10
  sec("10", "Browser and DOM basics", "Module ten. Browser and DOM basics. Eleven questions about what happens around your JavaScript in a web page."),
  {
    kind: "flow",
    title: "The idea: an event travels down, then back up",
    cols: 2,
    rows: 4,
    nodeW: 420,
    nodeH: 100,
    nodes: [
      { id: "w", label: "window", c: 0, r: 0 },
      { id: "d", label: "document → body", c: 0, r: 1 },
      { id: "u", label: "ul#list", c: 0, r: 2 },
      { id: "l", label: "li  (the target)", c: 0, r: 3, tone: "amber" },
      { id: "cap", label: "1. capturing: window → target\n(addEventListener(…, { capture: true }))", c: 1, r: 1, tone: "cyan", w: 700 },
      { id: "bub", label: "2. target, then 3. bubbling: target → window\n(the default for listeners)", c: 1, r: 2, tone: "green", w: 700 },
    ],
    edges: [
      { from: "w", to: "d" },
      { from: "d", to: "u" },
      { from: "u", to: "l" },
    ],
    show: [["w", "d", "u", "l"], ["cap"], ["bub"]],
    beats: B(
      "Here's the idea of the module. The page is a tree of elements, and when you click an li, the event doesn't just happen on the li.",
      "First it travels down from the window to the target. That's the capturing phase, and only listeners registered with capture true run on the way down.",
      { say: "Then it reaches the target, and bubbles back up through every ancestor, running ordinary listeners on the way. That's why a single listener on the list can handle clicks on all its items. Event delegation.", tone: "key" },
    ),
  },
  qa(83, "What is the DOM, and what is the difference between window and document?", [
    "DOM: the browser's live tree of objects for the page, which JavaScript reads and changes",
    "window: the global object for the tab: timers, location, storage, history",
    "document: the page itself, window.document: the root of the DOM tree",
  ]),
  qa(84, "How does event propagation work (capturing, target, bubbling)?", [
    "Capturing: window down to the target's parent; listeners with { capture: true }",
    "Target: listeners on the element itself",
    "Bubbling: back up to window: the default; some events don't bubble (focus, mouseenter)",
  ]),
  qa(85, "What is event delegation?", [
    "One listener on a parent handles events from all its children, thanks to bubbling",
    "Find the real target with event.target.closest(\"li\")",
    "Fewer listeners, and it works for children added later",
  ], { code: `list.addEventListener("click", (e) => {\n  const item = e.target.closest("li");\n  if (item) select(item.dataset.id);\n});` }),
  qa(86, "What is the difference between preventDefault and stopPropagation?", [
    "preventDefault: stop the browser's default action (submitting, following a link)",
    "stopPropagation: stop the event travelling to other elements",
    "They're independent; stopImmediatePropagation also stops other listeners on the same element",
  ]),
  qa(87, "What is the difference between `<script>`, `<script async>` and `<script defer>`?", [
    "Plain: parsing stops while the script downloads and runs",
    "async: downloads in parallel, runs as soon as it arrives, in any order",
    "defer: downloads in parallel, runs in order after parsing, before DOMContentLoaded",
    "Modules (type=\"module\") are deferred by default",
  ], { ask: "Question 87. What's the difference between a plain script tag, script async, and script defer?" }),
  qa(88, "What is the difference between DOMContentLoaded and load?", [
    "DOMContentLoaded: the HTML is parsed and deferred scripts have run",
    "load: everything is loaded, images, styles and iframes included",
    "Most setup code only needs DOMContentLoaded",
  ]),
  qa(89, "What are the differences between cookies, localStorage and sessionStorage?", [
    "Cookies: small (~4 KB), sent with every request to the server, can be HttpOnly and Secure",
    "localStorage: ~5 MB, per origin, stays until cleared; sessionStorage: per tab, cleared when it closes",
    "Storage is readable by any script on the page: never put tokens there if XSS is a risk",
  ]),
  qa(90, "What are the same-origin policy and CORS?", [
    "Same origin = same scheme, host and port; scripts can't read responses from other origins",
    "CORS: the server opts in with headers like Access-Control-Allow-Origin",
    "Non-simple requests send a preflight OPTIONS first; the browser enforces it, not the server",
  ]),
  qa(91, "How does fetch work, and why doesn't it reject on a 404?", [
    "fetch returns a promise of a Response; read the body with await res.json()",
    "It rejects only on network failure; a 404 or 500 is still a response",
    "Check res.ok (status 200–299) and throw yourself; no timeout by default: use AbortSignal",
  ]),
  qa(92, "What is XSS, and how do you prevent it?", [
    "Cross-site scripting: attacker-controlled input runs as script in your page",
    "Prevent: escape output, use textContent instead of innerHTML, sanitise HTML (DOMPurify)",
    "Defence in depth: a Content Security Policy, and HttpOnly cookies so scripts can't read sessions",
  ]),
  qa(93, "What are reflow and repaint?", [
    "Reflow (layout): recomputing sizes and positions; repaint: redrawing pixels",
    "Reading layout (offsetHeight) right after writing styles forces a synchronous reflow",
    "Batch reads then writes; animate transform and opacity, which skip layout",
  ]),
  check({
    topic: "fetch",
    q: "try { await fetch(\"/api/missing\") } catch { showError() } — the API returns 404. Does showError run?",
    say: "You await fetch of a missing API path inside a try, with show error in the catch. The server returns four oh four. Does show error run?",
    a: "No: fetch only rejects on network failure. Check res.ok and throw for 4xx/5xx.",
    aSay: "No. Fetch only rejects when the network fails. A four oh four is a normal response, so check res dot ok, and throw yourself.",
  }),

  // ================================================================ module 11
  sec("11", "Modules, memory and the runtime", "Module eleven. Modules, memory and the runtime. Seven questions about how code is loaded, how memory is freed, and how the engine runs it."),
  qa(94, "What is the difference between ES Modules and CommonJS?", [
    "ESM: import / export, static, async loading, live bindings; the standard (browsers and Node)",
    "CommonJS: require / module.exports, synchronous, dynamic, values copied; Node's original",
    "ESM's static shape enables tree shaking and top-level await",
  ]),
  qa(95, "What are dynamic imports and tree shaking?", [
    "import(\"./chart.js\") loads a module on demand and returns a promise: code splitting",
    "Tree shaking: the bundler drops exports nothing imports",
    "It needs static ESM imports and side-effect-free modules",
  ]),
  qa(96, "How does garbage collection work in JavaScript?", [
    "Reachability: anything reachable from the roots (globals, the stack) stays; the rest is freed",
    "Mark-and-sweep: mark everything reachable, sweep the rest; cycles are no problem",
    "V8 is generational: a fast young generation for short-lived objects, an old one collected less often",
  ]),
  qa(97, "What are common causes of memory leaks in JavaScript?", [
    "Forgotten timers and event listeners still referencing big objects",
    "Detached DOM nodes kept in variables; growing global caches",
    "Closures holding large data longer than needed",
    "Find them: DevTools heap snapshots, compare before and after",
  ]),
  qa(98, "How does error handling work in JavaScript (error types, finally, custom errors)?", [
    "Built-ins: Error, TypeError, ReferenceError, RangeError, SyntaxError",
    "try / catch / finally; finally always runs",
    "Custom: class NotFoundError extends Error, with a name; pass { cause } to keep the original",
    "Throw Error objects, never strings: they carry a stack trace",
  ]),
  qa(99, "What is a polyfill, and how is it different from transpiling (Babel)?", [
    "Polyfill: code that adds a missing API at runtime (Promise.allSettled for old browsers)",
    "Transpiling: rewrites new syntax into old syntax at build time (optional chaining, classes)",
    "Syntax can't be polyfilled; APIs can't be transpiled: modern builds use both",
  ]),
  {
    kind: "custom",
    name: "pypipe",
    props: {
      title: "How V8 runs your code",
      stages: [
        { name: "Parse", icon: "🌳", sub: "source → AST" },
        { name: "Ignition", icon: "🔥", sub: "bytecode interpreter" },
        { name: "Profile", icon: "📈", sub: "find hot functions" },
        { name: "TurboFan", icon: "🚀", sub: "optimised machine code" },
      ],
      steps: [
        { at: 0, text: "The source is parsed into an abstract syntax tree (lazily: inner functions only when first called)." },
        { at: 1, text: "Ignition, an interpreter, compiles it to bytecode and starts running quickly." },
        { at: 2, text: "While it runs, V8 records the types it actually sees in each function." },
        { at: 3, text: "Hot functions are compiled by optimising JITs to fast machine code, assuming those types." },
        { at: [3, 1], text: "If the assumption breaks (a new type shows up), V8 deoptimises back to bytecode. Keep object shapes and types consistent.", back: true },
      ],
    },
    beats: B(
      "And the last question in this module: how does an engine like V8 run your code? First it parses the source into a syntax tree, lazily, so functions that are never called are barely parsed.",
      "Ignition, an interpreter, turns that into bytecode and starts running it right away, so pages start fast.",
      "While it runs, V8 profiles it: which functions are hot, and what types they actually receive.",
      "Hot functions go to the optimising compilers, TurboFan and friends, which produce fast machine code, specialised for the types seen so far.",
      { say: "And if a new type shows up that breaks the assumption, V8 deoptimises, back to bytecode. That's the reason for advice like: keep object shapes consistent, and don't mix types in hot code.", tone: "key" },
    ),
  },
  qa(100, "How does a JavaScript engine like V8 run your code?", [
    "Parse to an AST → Ignition bytecode → profile → JIT-compile hot code (TurboFan)",
    "Optimised code assumes the types and object shapes it has seen (hidden classes, inline caches)",
    "Surprises cause deoptimisation; the GC and the event loop run alongside",
  ]),

  // ================================================================ module 12
  sec("12", "Classic implementations", "Module twelve. The classic implementations: four functions you may be asked to write from scratch."),
  qa(101, "Implement a deep clone function.", [
    "Primitives and functions: return as is",
    "Arrays and objects: create an empty one and clone each value recursively",
    "Track already-cloned objects in a WeakMap to handle cycles; mention structuredClone",
  ], { code: `function deepClone(v, seen = new WeakMap()) {\n  if (v === null || typeof v !== "object") return v;\n  if (seen.has(v)) return seen.get(v);\n  if (v instanceof Date) return new Date(v);\n  const out = Array.isArray(v) ? [] : {};\n  seen.set(v, out);\n  for (const k of Object.keys(v))\n    out[k] = deepClone(v[k], seen);\n  return out;\n}` }),
  qa(102, "Implement array flatten without using flat().", [
    "Recursive: for each item, if it's an array, flatten it into the result",
    "Support a depth parameter: stop recursing at depth 0",
    "Iterative version with a stack avoids deep recursion",
  ], { code: `function flatten(arr, depth = Infinity) {\n  const out = [];\n  for (const x of arr) {\n    if (Array.isArray(x) && depth > 0)\n      out.push(...flatten(x, depth - 1));\n    else out.push(x);\n  }\n  return out;\n}` }),
  qa(103, "Implement a retry with exponential backoff for an async function.", [
    "Loop up to N attempts; return on success",
    "On failure, wait base × 2^attempt (capped) plus random jitter, then try again",
    "Retry only transient errors; rethrow the last error when out of attempts",
  ], { code: `async function retry(fn, tries = 4, base = 300) {\n  for (let i = 0; ; i++) {\n    try {\n      return await fn();\n    } catch (err) {\n      if (i >= tries - 1) throw err;\n      const ms = Math.min(5000, base * 2 ** i);\n      await new Promise((r) =>\n        setTimeout(r, ms + Math.random() * ms / 4));\n    }\n  }\n}` }),
  qa(104, "Implement a simple event emitter (pub/sub).", [
    "A Map from event name to a list of listeners",
    "on adds (and returns an unsubscribe), emit calls each with the arguments, off removes",
    "once wraps the listener so it removes itself after the first call",
  ], { code: `class Emitter {\n  #m = new Map();\n  #list(e) {\n    if (!this.#m.has(e)) this.#m.set(e, new Set());\n    return this.#m.get(e);\n  }\n  on(e, fn) {\n    this.#list(e).add(fn);\n    return () => this.off(e, fn);\n  }\n  off(e, fn) { this.#list(e).delete(fn); }\n  emit(e, ...args) {\n    for (const fn of [...this.#list(e)]) fn(...args);\n  }\n  once(e, fn) {\n    const off = this.on(e, (...a) => { off(); fn(...a); });\n  }\n}` }),
  check({
    topic: "deep clone",
    q: "Your deepClone recurses forever on const a = {}; a.self = a. What's the fix?",
    say: "Your deep clone recurses forever on an object that refers to itself. What's the fix?",
    a: "Remember objects already cloned (a WeakMap from original to copy) and return the copy when you meet one again.",
    aSay: "Keep a weak map from each original object to its copy. When you meet an object you've already cloned, return its copy instead of recursing again.",
  }),

  // ================================================================ close
  {
    kind: "drill",
    items: [
      { q: "typeof null?", a: "\"object\": a historic bug" },
      { q: "[] + {} ?", a: "\"[object Object]\"" },
      { q: "let before its line?", a: "ReferenceError: the TDZ" },
      { q: "this in an arrow function?", a: "The surrounding code's this" },
      { q: "Promise callback or setTimeout(0): which runs first?", a: "The promise callback (microtask)" },
      { q: "Does fetch reject on 500?", a: "No: check res.ok" },
    ],
    beats: B(
      { say: "A last rapid-fire round. Typeof null?", hold: 3 },
      "Object. A bug from the first version.",
      { say: "An empty array plus an empty object?", hold: 3 },
      "The string, object Object.",
      { say: "Using a let variable before its line?", hold: 3 },
      "A reference error. The temporal dead zone.",
      { say: "This, inside an arrow function?", hold: 3 },
      "The this of the surrounding code.",
      { say: "A promise callback or set timeout zero: which runs first?", hold: 3 },
      "The promise callback. Microtasks run before the next task.",
      { say: "Does fetch reject on a five hundred?", hold: 3 },
      "No. Check res dot ok.",
    ),
  },
  {
    kind: "bullets",
    title: "Where to go from here",
    items: [
      { icon: "📖", text: "Each module page starts this lecture at its own part", sub: "rewatch exactly what you need" },
      { icon: "🧠", text: "Read the module's theory, then the answers", sub: "the same pictures as here" },
      { icon: "⌨️", text: "Write the implementations yourself", sub: "debounce, bind, Promise.all, deep clone, emitter" },
    ],
    beats: B(
      "That's the whole JavaScript page. Each module page has a watch card that starts this lecture at that module.",
      "Read the module's theory first, then the answers.",
      { say: "And write the implementations yourself, without looking: debounce, throttle, bind, promise all, deep clone, and the event emitter. Interviewers ask you to write them, and writing them once is what makes them stick. Good luck.", tone: "key" },
    ),
  },
];
