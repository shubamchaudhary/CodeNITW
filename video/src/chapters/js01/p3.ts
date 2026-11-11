import type { Scene } from "../../lib/types.ts";
import { B, custom, qa, sec } from "../web/h.ts";
import { check } from "./p1.ts";

// Part 3: module 8 (arrays) and module 9 (asynchronous JavaScript and the
// event loop).
export const p3: Scene[] = [
  // ================================================================ module 8
  sec("8", "Arrays", "Module eight. Arrays. Five questions: the array methods, writing them yourself, and the ones that quietly change the original."),
  qa(62, "What is the difference between map, forEach, filter and reduce?", [
    "forEach: runs a function per item, returns undefined: for side effects",
    "map: returns a new array of the same length, each item transformed",
    "filter: returns a new array of the items that pass a test",
    "reduce: folds the array into one value: sums, objects, groupings",
  ], { code: `const prices = [5, 12, 30];\nprices.map((p) => p * 2);      // [10, 24, 60]\nprices.filter((p) => p > 10);  // [12, 30]\nprices.reduce((s, p) => s + p, 0);  // 47` }),
  qa(63, "Implement polyfills for map, filter and reduce.", [
    "Loop over this, call the callback with (item, index, array)",
    "Skip holes in sparse arrays (i in this) and pass thisArg along",
    "reduce: with no initial value, start from the first item; empty and no initial value → TypeError",
  ], { code: `Array.prototype.myMap = function (fn, ctx) {\n  const out = [];\n  for (let i = 0; i < this.length; i++)\n    if (i in this)\n      out[i] = fn.call(ctx, this[i], i, this);\n  return out;\n};\nArray.prototype.myReduce = function (fn, init) {\n  let i = 0, acc = init;\n  if (arguments.length < 2) {\n    if (!this.length) throw new TypeError("empty");\n    acc = this[i++];\n  }\n  for (; i < this.length; i++)\n    acc = fn(acc, this[i], i, this);\n  return acc;\n};` }),
  qa(64, "What is the difference between slice and splice, and which array methods mutate?", [
    "slice(start, end): returns a copy of a part; doesn't change the array",
    "splice(start, count, ...items): removes and inserts in place; returns the removed items",
    "Mutating: push, pop, shift, unshift, splice, sort, reverse, fill",
    "Copying versions: toSorted, toReversed, toSpliced, with (ES2023)",
  ]),
  qa(65, "What are the pitfalls of Array.prototype.sort?", [
    "Without a comparator it sorts as strings: [10, 9, 1].sort() → [1, 10, 9]",
    "Numbers: sort((a, b) => a - b)",
    "It sorts in place (use toSorted for a copy); it is stable since ES2019",
  ]),
  qa(66, "What are common array tricks (dedupe, flatten, checks)?", [
    "Dedupe: [...new Set(arr)]",
    "Flatten: arr.flat(Infinity), or flatMap to map and flatten one level",
    "Checks: Array.isArray, some, every, includes (finds NaN; indexOf doesn't)",
    "Last item: arr.at(-1); group: Object.groupBy(arr, fn)",
  ]),

  // ================================================================ module 9
  sec("9", "Asynchronous JavaScript", "Module nine. Asynchronous JavaScript. Sixteen questions, the biggest module, and the one interviewers spend the most time on. It all rests on the event loop, so we start there."),
  custom(
    "chipcols",
    {
      title: "The idea: one call stack, and queues waiting for it to empty",
      sub: "console.log(1); setTimeout(() => log(2)); Promise.resolve().then(() => log(3)); console.log(4)",
      cols: [
        { title: "CALL STACK", sub: "runs one thing at a time", stack: true },
        { title: "WEB APIs / NODE", sub: "timers, network, I/O" },
        { title: "MICROTASKS", sub: "promise callbacks, all of them" },
        { title: "TASKS (MACRO)", sub: "timers, events: one per turn" },
      ],
      steps: [
        { cols: [["script", "log(1)"], [], [], []], out: "1", note: "the script runs on the stack" },
        { cols: [["script", "setTimeout"], ["timer 0ms"], [], []], out: "1", note: "setTimeout hands the timer to the runtime and returns at once" },
        { cols: [["script"], [], [], ["() => log(2)"]], out: "1", note: "the timer finishes: its callback waits in the task queue" },
        { cols: [["script", "then"], [], ["() => log(3)"], ["() => log(2)"]], out: "1", note: "the promise is already resolved: its callback goes to the microtask queue" },
        { cols: [["script", "log(4)"], [], ["() => log(3)"], ["() => log(2)"]], out: "1 4", note: "the script carries on: synchronous code always finishes first" },
        { cols: [["() => log(3)"], [], [], ["() => log(2)"]], out: "1 4 3", note: "stack empty: drain ALL microtasks first" },
        { cols: [["() => log(2)"], [], [], []], out: "1 4 3 2", note: "then one task; then microtasks again; then render; repeat" },
      ],
    },
    B(
      "Here's the idea, in one example. JavaScript runs on a single call stack. The script logs one.",
      "Set timeout doesn't wait. It hands a timer to the runtime, the browser or Node, and returns immediately.",
      "When the timer fires, its callback doesn't run. It joins the task queue, sometimes called the macrotask queue, and waits for the stack to be empty.",
      "Then a promise that's already resolved. Its then callback goes to a different queue: the microtask queue.",
      "The script carries on and logs four. Synchronous code always finishes first.",
      "Now the stack is empty, so the event loop takes over. First, it runs every microtask, until that queue is empty. Three.",
      { say: "Only then does it take one task from the task queue. Two. Then microtasks again, then the browser may render, and around it goes. So the output is one, four, three, two. Stack first, then all microtasks, then one task. That rule answers most predict-the-output questions.", tone: "key" },
    ),
  ),
  qa(67, "How can JavaScript be asynchronous if it is single-threaded?", [
    "Your JavaScript runs on one thread, but the runtime (browser, Node) is multi-threaded",
    "Timers, network and file I/O happen outside the stack, in the runtime",
    "When they finish, callbacks are queued, and the event loop runs them when the stack is empty",
  ]),
  qa(68, "What is callback hell, and how do promises solve it?", [
    "Nested callbacks for sequential async steps: a pyramid, with errors handled at every level",
    "Promises return a value you can chain: .then().then(), one .catch for all errors",
    "async/await then makes it read like synchronous code",
  ]),
  {
    kind: "flow",
    title: "A promise: pending, then settled once, for good",
    cols: 3,
    rows: 2,
    nodeW: 400,
    nodeH: 140,
    nodes: [
      { id: "p", label: "pending\nwaiting for a result", c: 0, r: 0, tone: "amber" },
      { id: "f", label: "fulfilled\nresolve(value) → .then", c: 2, r: 0, tone: "green" },
      { id: "r", label: "rejected\nreject(error) → .catch", c: 2, r: 1, tone: "red" },
    ],
    edges: [
      { from: "p", to: "f", label: "resolve" },
      { from: "p", to: "r", label: "reject / throw" },
    ],
    show: [["p"], ["f", "r"], []],
    overlay: { step: 2, text: "Settled is final: later resolve or reject calls are ignored, and .then on a settled promise still runs (as a microtask)", tone: "amber" },
    beats: B(
      "A promise is an object standing for a result that isn't there yet. It starts pending.",
      "It settles exactly once: fulfilled with a value, which runs the then callbacks, or rejected with an error, which runs the catch callbacks. Throwing inside the executor rejects it too.",
      { say: "And settled is final. Calling resolve or reject again does nothing. Attaching a then to a promise that's already settled still works: the callback just runs as a microtask.", tone: "key" },
    ),
  },
  qa(69, "What is a Promise, and what are its states?", [
    "An object for a value that will be available later",
    "States: pending, then fulfilled (with a value) or rejected (with a reason)",
    "Settles once; callbacks always run asynchronously, as microtasks",
  ]),
  qa(70, "How does promise chaining work?", [
    ".then returns a new promise, resolved with whatever the callback returns",
    "Return a promise and the chain waits for it; throw and the chain rejects",
    "A rejection skips .then steps until the next .catch; .finally runs either way",
  ], { code: `fetchUser(id)\n  .then((u) => fetchOrders(u.id))  // waits\n  .then((orders) => render(orders))\n  .catch(showError)                  // any step\n  .finally(hideSpinner);` }),
  qa(71, "What is the difference between Promise.all, allSettled, race and any?", [
    "all: every value, in order; rejects as soon as one rejects",
    "allSettled: waits for all, gives each one's status and value or reason",
    "race: settles like the first to settle, success or failure",
    "any: the first to fulfil; rejects (AggregateError) only if all reject",
  ]),
  qa(72, "Does Promise.all cancel the other promises when one fails? How do you cancel a fetch?", [
    "No: the others keep running; Promise.all just stops waiting for them",
    "Promises themselves can't be cancelled",
    "Cancel the underlying work with AbortController: fetch(url, { signal }), then controller.abort()",
    "AbortSignal.timeout(5000) gives a fetch a timeout",
  ]),
  qa(73, "What is async/await, and how does it work?", [
    "An async function always returns a promise",
    "await pauses that function until the promise settles, without blocking the thread",
    "The rest of the function continues as a microtask; it's promises with nicer syntax",
  ]),
  qa(74, "How do you handle errors in async code?", [
    "async/await: try / catch / finally around the awaits",
    "Promises: .catch at the end of the chain",
    "Unhandled rejections: log them (unhandledrejection event, process.on in Node)",
    "Don't forget to await: an un-awaited promise's error escapes your try",
  ]),
  qa(75, "How do you run async operations sequentially vs in parallel?", [
    "Sequential: await one after another (when each needs the previous result)",
    "Parallel: start them all, then await Promise.all([...])",
    "await inside forEach does NOT wait: use for...of for sequence, map + Promise.all for parallel",
    "Many items: a concurrency limit (a pool of N at a time)",
  ], { code: `// sequential: ~3 s\nfor (const id of ids) await load(id);\n\n// parallel: ~1 s\nawait Promise.all(ids.map(load));` }),
  qa(76, "Implement Promise.all.", [
    "Return a new promise; keep results by index, count how many are done",
    "Resolve when all are done; reject on the first rejection",
    "Wrap each item in Promise.resolve (plain values allowed); an empty list resolves to []",
  ], { code: `function all(items) {\n  return new Promise((resolve, reject) => {\n    const out = [];\n    let done = 0;\n    if (items.length === 0) resolve(out);\n    items.forEach((p, i) =>\n      Promise.resolve(p).then((v) => {\n        out[i] = v;\n        if (++done === items.length) resolve(out);\n      }, reject));\n  });\n}` }),
  qa(77, "How do you convert a callback-based function into a promise?", [
    "Wrap it in new Promise and call resolve or reject from the callback",
    "Node-style (err, result) callbacks: util.promisify does it for you",
    "Many APIs already have promise versions: fs/promises, timers/promises",
  ], { code: `const readFileP = (path) =>\n  new Promise((resolve, reject) =>\n    fs.readFile(path, "utf8", (err, data) =>\n      err ? reject(err) : resolve(data)));` }),
  qa(78, "How does the event loop work?", [
    "Run the current task until the call stack is empty",
    "Run all microtasks (promise callbacks, queueMicrotask), including new ones added meanwhile",
    "Let the browser render if needed, then take the next task (timer, event, message)",
    "A long task blocks everything: no clicks, no rendering",
  ]),
  qa(79, "What is the difference between microtasks and macrotasks? Predict the output.", [
    "Microtasks: promise callbacks, queueMicrotask, MutationObserver: all run before the next task",
    "Macrotasks: setTimeout, setInterval, events, I/O: one per turn of the loop",
    "Output here: start, end, promise, timeout",
  ], { code: `console.log("start");\nsetTimeout(() => console.log("timeout"));\nPromise.resolve().then(() => console.log("promise"));\nconsole.log("end");` }),
  qa(80, "Why isn't setTimeout(fn, 0) immediate, and why do timers drift?", [
    "0 means “as soon as possible after the current task and all microtasks”, not now",
    "Browsers clamp nested timers to about 4ms, and background tabs throttle them",
    "A busy stack delays every timer: they're a minimum, not a promise",
    "For accurate intervals, compute from Date.now / performance.now; for animation, requestAnimationFrame",
  ], { ask: "Question 80. Why isn't set timeout with zero immediate, and why do timers drift?" }),
  qa(81, "What are iterators and generators?", [
    "Iterator: an object with next() returning { value, done }",
    "Iterable: has [Symbol.iterator]: what for...of, spread and destructuring use",
    "Generator: function* that pauses at each yield: lazy sequences, custom iterables",
    "Async generators with for await...of: streams and paginated APIs",
  ]),
  qa(82, "What are Web Workers?", [
    "Real background threads in the browser for CPU-heavy work",
    "No DOM access; they talk to the page with postMessage (data is copied or transferred)",
    "Use for parsing, image processing, crypto: anything that would freeze the UI",
  ]),
  check({
    topic: "event loop",
    q: "setTimeout(A, 0); queueMicrotask(B); Promise.resolve().then(C); console.log(\"D\"). Order?",
    say: "Set timeout A with zero, queue microtask B, a resolved promise then C, and console log D. In what order do they run?",
    options: ["D, A, B, C", "D, B, C, A", "B, C, D, A", "A, B, C, D"],
    oSay: ["D, A, B, C", "D, B, C, A", "B, C, D, A", "A, B, C, D"],
    answer: 1,
    a: "D, B, C, A: synchronous code first, then all microtasks in order (B, C), then the timer task.",
    aSay: "B. D, then B, then C, then A. Synchronous code first, then every microtask in the order they were queued, and only then the timer's task.",
  }),
  check({
    topic: "async",
    q: "ids.forEach(async (id) => await save(id)); console.log(\"all saved\"). What's wrong?",
    say: "You write ids dot for each, with an async callback that awaits save. Then you log all saved. What's wrong?",
    a: "forEach ignores the returned promises: \"all saved\" logs before any save finishes, and errors go unhandled. Use for...of with await, or await Promise.all(ids.map(save)).",
    aSay: "For each ignores the promises the callbacks return, so all saved is logged before any save finishes, and errors go unhandled. Use for of with await for a sequence, or await promise dot all over map for parallel.",
  }),
];
