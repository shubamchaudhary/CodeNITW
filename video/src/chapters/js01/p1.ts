import type { Scene } from "../../lib/types.ts";
import { makeCheck } from "../checks.ts";
import { B, custom, qa, sec } from "../web/h.ts";

export const check = makeCheck();

// Part 1: the intro, module 1 (types and coercion), module 2 (scope and
// hoisting) and module 3 (functions).
export const p1: Scene[] = [
  {
    kind: "title",
    eyebrow: "JavaScript · interview lecture",
    title: "JavaScript, topic by topic",
    subtitle: "Every module of the JavaScript page, the idea behind it, and every question on it",
    beats: B("JavaScript, topic by topic. This lecture follows the JavaScript page exactly: twelve modules, in the same order, and every question in each module, with the same numbers. Each module starts with the one idea it hangs on, as a picture. Then the questions, answered point by point. And a check, where you answer before I do."),
  },

  // ================================================================ module 1
  sec("1", "Types, values and coercion", "Module one. Types, values and coercion. Twelve questions, and most of them are about one thing: JavaScript quietly converting values from one type to another."),
  {
    kind: "compare",
    title: "The idea: 7 primitives, and everything else is an object",
    cols: [
      { title: "Primitives (by value)", icon: "🧊", tone: "cyan", items: ["string, number, bigint, boolean", "undefined, null, symbol", "Immutable; copied when assigned"] },
      { title: "Objects (by reference)", icon: "📦", tone: "blue", items: ["Plain objects, arrays, functions", "Dates, Maps, Sets, everything else", "Mutable; assignment shares one object"] },
    ],
    footer: "Coercion: when an operator needs a different type, JavaScript converts the value for you",
    beats: B(
      "Here's the idea. JavaScript has seven primitive types: string, number, bigint, boolean, undefined, null, and symbol. Primitives are immutable, and they're copied when you assign them.",
      "Everything else is an object: plain objects, arrays, functions, dates, maps. Objects are mutable, and assigning one shares the same object, exactly like Python's names and objects.",
      { say: "And coercion is the source of the famous weirdness. When an operator needs a different type than it got, JavaScript converts the value for you, by a fixed set of rules. Learn those rules, and the trick questions become easy.", tone: "key" },
    ),
  },
  qa(1, "What are the data types in JavaScript?", [
    "Seven primitives: string, number, bigint, boolean, undefined, null, symbol",
    "Everything else is an object: arrays and functions are objects too",
    ["number is a 64-bit float: integers are exact only up to 2^53 − 1; bigint goes beyond", "Number is a sixty four bit float, so integers are exact only up to two to the fifty three, minus one. Bigint goes beyond that."],
  ]),
  qa(2, "What is the difference between pass by value and pass by reference in JavaScript?", [
    "JavaScript always passes by value",
    "For an object, the value passed is a reference: the function gets the same object",
    "So mutating it is visible to the caller; reassigning the parameter is not",
  ], { code: `function f(o) {\n  o.x = 1;      // caller sees this\n  o = { x: 2 }; // caller doesn't\n}\nconst a = {};\nf(a);  // a is { x: 1 }`, codeAt: 2 }),
  qa(3, "What is the difference between null, undefined and undeclared?", [
    "undefined: declared but no value yet, a missing property, or no return value",
    "null: an intentional “no value”, set by you",
    "Undeclared: never declared; reading it throws a ReferenceError",
    ["null == undefined is true; null === undefined is false", "And null loosely equals undefined, but they're not strictly equal."],
  ]),
  qa(4, "How does typeof work, and what are its quirks?", [
    "It returns a string naming the type: \"string\", \"number\", \"object\", \"function\"…",
    ["typeof null is \"object\": a bug kept since the first version", "Typeof null is object: a bug from the first version that can never be fixed."],
    ["typeof [] is \"object\": use Array.isArray to detect arrays", "Typeof an array is object too, so use array dot is array."],
    "typeof on an undeclared variable returns \"undefined\" instead of throwing",
  ], { ask: "Question 4. How does typeof work, and what are its quirks?" }),
  qa(5, "What is the difference between == and ===?", [
    ["=== compares type and value, with no conversion", "Triple equals compares type and value, with no conversion."],
    ["== converts the operands to a common type first: \"5\" == 5 is true", "Double equals converts both sides to a common type first, so the string five equals the number five."],
    ["Use === always; the one common exception: x == null checks null or undefined", "Use triple equals always. The one idiom people allow is x double-equals null, which catches both null and undefined."],
  ], { ask: "Question 5. What's the difference between double equals and triple equals?", code: `"5" == 5          // true
0 == ""           // true
null == undefined // true
NaN == NaN        // false
"5" === 5         // false` }),
  qa(6, "What are truthy and falsy values?", [
    ["Falsy: false, 0, -0, 0n, \"\", null, undefined, NaN", "There are exactly eight falsy values: false, zero, minus zero, the bigint zero, the empty string, null, undefined, and NaN."],
    ["Everything else is truthy: \"0\", \"false\", [] and {} included", "Everything else is truthy, including the string zero, the string false, an empty array and an empty object."],
    "if, &&, || and ! all test truthiness, not true or false",
  ]),
  qa(7, "What is NaN, and what is the difference between isNaN and Number.isNaN?", [
    "NaN is a number value meaning “not a valid number”: 0 / 0, Number(\"abc\")",
    "It's the only value not equal to itself: NaN === NaN is false",
    ["isNaN coerces first, so isNaN(\"abc\") is true; Number.isNaN doesn't, so it's false", "The global is NaN converts its argument first, so is NaN of the string abc is true. Number dot is NaN doesn't convert, so it's false."],
    "Use Number.isNaN (or Object.is(x, NaN))",
  ]),
  qa(8, "What does 1 + 2 + \"3\" evaluate to, and how does + coerce?", [
    "\"33\": left to right, 1 + 2 is 3, then 3 + \"3\" is the string \"33\"",
    "+ with a string on either side concatenates; otherwise it adds numbers",
    ["-, *, / always convert to numbers: \"6\" - 1 is 5", "Minus, times and divide always convert to numbers, so the string six minus one is five."],
    ["Objects are converted to primitives first: [] + {} is \"[object Object]\"", "And objects are first converted to primitives, which is why an empty array plus an empty object gives the string object Object."],
  ], { ask: "Question 8. What does one plus two plus the string three evaluate to, and how does plus coerce?" }),
  qa(9, "Why is 0.1 + 0.2 !== 0.3?", [
    "Numbers are binary floating point (IEEE 754); 0.1 and 0.2 have no exact binary form",
    "Their sum is 0.30000000000000004",
    ["Compare with a tolerance: Math.abs(a - b) < Number.EPSILON; for money, use integer cents", "Compare with a tolerance, using number dot epsilon. And for money, store integer cents."],
  ], { ask: "Question 9. Why is point one plus point two not equal to point three?" }),
  qa(10, "What are the nullish coalescing (??) and optional chaining (?.) operators?", [
    ["a ?? b: b only when a is null or undefined (0 and \"\" are kept)", "Nullish coalescing gives b only when a is null or undefined, so zero and the empty string are kept."],
    ["a || b would replace 0 and \"\" too: a classic bug with counts and prices", "Or would replace zero and the empty string as well, which is a classic bug with counts and prices."],
    ["user?.address?.city stops and returns undefined if anything is null or undefined", "Optional chaining, user, question dot, address, question dot, city, stops and returns undefined if anything along the way is missing, instead of throwing."],
  ], { ask: "Question 10. What are the nullish coalescing and optional chaining operators?" }),
  qa(11, "How does short-circuit evaluation work with && and ||?", [
    ["a && b: if a is falsy, return a without evaluating b; else return b", "A and B: if a is falsy, return a, and b is never evaluated. Otherwise return b."],
    ["a || b: if a is truthy, return a; else return b", "A or B: if a is truthy, return a. Otherwise return b."],
    "They return one of the operands, not a boolean: used for defaults and guards",
  ], { ask: "Question 11. How does short-circuit evaluation work with and, and or?" }),
  qa(12, "How can \"abc\".length work if a string is a primitive?", [
    "When you read a property on a primitive, JavaScript wraps it in a temporary object (String)",
    "The property is read from that wrapper, and the wrapper is thrown away",
    "So methods work, but you can't add properties to a primitive that stick",
  ]),
  check({
    topic: "coercion",
    q: "What are [] + [] , \"5\" * \"2\" and \"5\" + 2 ?",
    say: "What do these give: an empty array plus an empty array, the string five times the string two, and the string five plus two?",
    a: "\"\" (both become empty strings), 10 (* converts to numbers), \"52\" (+ with a string concatenates).",
    aSay: "An empty string, because both arrays become empty strings. Ten, because times converts to numbers. And the string fifty two, because plus with a string concatenates.",
  }),

  // ================================================================ module 2
  sec("2", "Variables, scope and hoisting", "Module two. Variables, scope and hoisting. Eleven questions, all explained by what the engine does before your code runs."),
  custom(
    "pyscope",
    {
      title: "The idea: scopes nest, and lookups go outward",
      layers: [
        { name: "Global", vars: ["window", "config"] },
        { name: "Module", vars: ["API_URL"] },
        { name: "Function", vars: ["user", "total"] },
        { name: "Block { }", vars: ["i"] },
      ],
      letters: ["1", "2", "3", "4"],
      steps: [
        { note: "every function and every { } block with let or const makes a new scope inside the one around it" },
        { find: "i", hit: 3, note: "a name is looked up in the innermost scope first" },
        { find: "API_URL", hit: 1, note: "then outward, scope by scope: this is the scope chain" },
        { find: "nope", hit: -1, note: "not found anywhere: ReferenceError" },
      ],
    },
    B(
      "Here's the idea. Scopes nest. The global scope, a module's scope, each function's scope, and, for let and const, each block in curly braces.",
      "When you use a name, the engine looks in the innermost scope first.",
      "Then outward, scope by scope, until it finds it. That's the scope chain, and it's fixed by where the code is written, which is called lexical scope.",
      { say: "Not found anywhere: a reference error. Closures, shadowing and most scope questions come from this picture.", tone: "key" },
    ),
  ),
  qa(13, "What are the differences between var, let and const?", [
    "var: function-scoped, hoisted as undefined, can be redeclared, global var becomes a window property",
    "let: block-scoped, in the TDZ until its line runs, can be reassigned",
    "const: like let, but must be initialised and can't be reassigned",
    "Default to const, use let when you must reassign, avoid var",
  ], { code: `for (var i = 0; i < 3; i++) {}\nconsole.log(i);  // 3: var leaks\n\nfor (let j = 0; j < 3; j++) {}\nconsole.log(j);  // ReferenceError` }),
  qa(14, "Does const make a value immutable?", [
    "No: const makes the binding constant, not the value",
    ["const user = {}; user.name = \"Ana\" works; user = {} throws", "A const object can still be changed. Setting user dot name works. Assigning a new object to user throws."],
    "For immutability, use Object.freeze (shallow) or immutable update patterns",
  ]),
  qa(15, "What is scope, and what are global, function and block scope?", [
    "Scope: the region of code where a name is visible",
    "Global: visible everywhere; function: inside the function; block: inside { } for let and const",
    "Modules have their own scope too: top-level names in a module aren't global",
  ]),
  qa(16, "What is the scope chain, and what is variable shadowing?", [
    "Scope chain: the inner-to-outer list of scopes searched for a name",
    "It's lexical: decided by where code is written, not where it's called",
    "Shadowing: an inner variable with the same name hides the outer one inside that scope",
  ]),
  custom(
    "chipcols",
    {
      title: "Hoisting: what the engine sets up before line 1 runs",
      cols: [
        { title: "var x", sub: "creation phase" },
        { title: "let y / const z", sub: "creation phase" },
        { title: "function f() {}", sub: "creation phase" },
      ],
      steps: [
        { cols: [["x = undefined"], ["y: uninitialised (TDZ)"], ["f = the whole function"]], note: "declarations are registered before any code runs" },
        { cols: [["x = undefined"], ["y: uninitialised (TDZ)"], ["f = the whole function"]], out: "console.log(x) → undefined   ·   f() → works", note: "var reads as undefined; a function declaration can be called early" },
        { cols: [["x = undefined"], ["y: uninitialised (TDZ)"], ["f = the whole function"]], out: "console.log(y) → ReferenceError", note: "let and const exist but can't be touched until their line: the Temporal Dead Zone" },
      ],
    },
    B(
      "Now hoisting. Before any line of a scope runs, the engine registers every declaration in it. That's called hoisting, although nothing actually moves.",
      "A var is created and set to undefined, so reading it early gives undefined. A function declaration is created with its whole body, so you can call it before the line where it's written.",
      { say: "Let and const are created too, but left uninitialised. Touching them before their line throws a reference error. That gap, from the start of the scope to the declaration, is the temporal dead zone.", tone: "key" },
    ),
  ),
  qa(17, "What is hoisting?", [
    "Declarations are registered when a scope is set up, before its code runs",
    "var → undefined; function declarations → the whole function; let, const, class → uninitialised (TDZ)",
    "Nothing moves: it's the creation phase of the execution context",
  ]),
  qa(18, "What is the Temporal Dead Zone (TDZ)?", [
    "The time between entering a scope and the let/const line running",
    "Touching the variable in that window throws ReferenceError, even typeof",
    "It catches use-before-declare bugs that var would hide",
  ]),
  qa(19, "What is the difference between a function declaration and a function expression?", [
    "Declaration: function add() {}: hoisted whole, callable before its line",
    "Expression: const add = function () {} (or an arrow): follows the variable's rules",
    "Expressions can be anonymous, passed around, and used as IIFEs",
  ]),
  qa(20, "What is an execution context?", [
    "The environment a piece of code runs in: its variables, scope chain and this",
    "One global context, plus a new one for every function call",
    "Created in two phases: creation (hoisting, this) then execution",
  ]),
  qa(21, "What is the call stack?", [
    "The stack of execution contexts: a call pushes one, a return pops it",
    "JavaScript has one call stack: it runs one thing at a time",
    "Infinite recursion overflows it: RangeError: Maximum call stack size exceeded",
  ]),
  qa(22, "What is strict mode?", [
    "\"use strict\" (automatic in modules and classes) turns silent mistakes into errors",
    "Assigning an undeclared variable throws instead of creating a global",
    "this is undefined in plain function calls instead of the global object",
  ]),
  qa(23, "Why are global variables a problem, and what is globalThis?", [
    "Any code can change them: name clashes, hidden coupling, hard tests, memory kept forever",
    "Use modules and pass values explicitly",
    "globalThis is the global object everywhere: window in browsers, global in Node",
  ]),
  check({
    topic: "hoisting",
    q: "console.log(a); var a = 1;  console.log(b); let b = 2;  What happens on each log?",
    say: "Console log a, then var a equals one. Console log b, then let b equals two. What happens on each log?",
    a: "First logs undefined (var is hoisted as undefined). Second throws ReferenceError (b is in the TDZ).",
    aSay: "The first logs undefined, because var is hoisted and set to undefined. The second throws a reference error, because b is in the temporal dead zone.",
  }),

  // ================================================================ module 3
  sec("3", "Functions", "Module three. Functions. Eleven questions, from arrow functions to debounce and throttle, which you'll often be asked to write."),
  {
    kind: "bullets",
    title: "The idea: functions are values",
    firstItemStep: 1,
    items: [
      { icon: "📦", text: "Store them, pass them, return them", sub: "first-class functions" },
      { icon: "🧩", text: "Functions that take or return functions", sub: "higher-order: map, debounce, memoize, compose" },
      { icon: "🎒", text: "A returned function remembers where it was made", sub: "closures: module 4" },
    ],
    beats: B(
      "Here's the idea of the module: in JavaScript, functions are values.",
      "You can store them in variables, pass them as arguments, and return them from other functions.",
      "So you can write functions that take or return functions. Map, debounce, memoize and compose are all just that.",
      { say: "And a function returned from another remembers the variables where it was made. That's closures, the next module, and it's what makes debounce and memoize work.", tone: "key" },
    ),
  },
  qa(24, "What are first-class and higher-order functions?", [
    "First-class: functions are values you can assign, pass and return",
    "Higher-order: a function that takes a function or returns one",
    "Examples: map, filter, setTimeout, addEventListener, debounce",
  ]),
  qa(25, "How are arrow functions different from regular functions?", [
    "No own this: they use the this of the surrounding code (lexical this)",
    "No arguments object, can't be used with new, no prototype",
    "Short syntax, implicit return for a single expression",
    "Great for callbacks; not for object methods that need this",
  ], { code: `const obj = {\n  n: 1,\n  regular() { return this.n },  // 1\n  arrow: () => this.n,          // undefined\n};` }),
  qa(26, "What is a callback function?", [
    "A function passed to another function, to be called later",
    "Synchronous (array.map) or asynchronous (setTimeout, an event listener)",
    "Nested async callbacks lead to callback hell: promises fix that (module 9)",
  ]),
  qa(27, "What is an IIFE, and why doesn't `function foo(){}()` work?", [
    "An Immediately Invoked Function Expression: (function () { … })()",
    "It creates a private scope right away: the pre-module way to avoid globals",
    "At the start of a statement, function is parsed as a declaration, and a declaration can't be called: the parentheses make it an expression",
  ], { ask: "Question 27. What is an IIFE, and why doesn't function foo, then parentheses, work?" }),
  qa(28, "What are default parameters, rest parameters and the arguments object?", [
    ["function f(a, b = 2): b is 2 when it's undefined", "Default parameters: b equals two is used when b is undefined."],
    ["function f(...nums): the remaining arguments as a real array", "Rest parameters, dot dot dot nums, collect the remaining arguments into a real array."],
    "arguments: an old array-like object of all arguments; not in arrow functions; prefer rest",
  ]),
  qa(29, "What is the difference between the spread operator and rest parameters?", [
    "Same three dots, opposite jobs",
    ["Spread expands: Math.max(...nums), [...a, ...b], { ...obj }", "Spread expands a collection into items: max of dot dot dot nums, or copying arrays and objects."],
    "Rest collects: function f(...args), const [first, ...others] = list",
  ]),
  qa(30, "What is a pure function, and what are side effects?", [
    "Pure: same inputs → same output, and changes nothing outside itself",
    "Side effects: mutating arguments or globals, I/O, network, DOM, logging, Date.now()",
    "Pure functions are easy to test, cache and reason about; push effects to the edges",
  ]),
  qa(31, "What are currying and partial application?", [
    "Currying: f(a, b, c) becomes f(a)(b)(c): one argument at a time",
    "Partial application: fix some arguments now, get a function for the rest",
    "Uses: reusable specialised functions, like a logger fixed to one module",
  ], { code: `const curry = (fn) => function c(...a) {\n  return a.length >= fn.length\n    ? fn(...a)\n    : (...b) => c(...a, ...b);\n};\nconst add = curry((a, b, c) => a + b + c);\nadd(1)(2)(3);  // 6`, codeAt: 1 }),
  qa(32, "What are compose and pipe?", [
    "Combine functions into one: the output of each feeds the next",
    "compose(f, g)(x) = f(g(x)): right to left",
    "pipe(f, g)(x) = g(f(x)): left to right, easier to read",
  ], { code: `const pipe = (...fns) => (x) =>\n  fns.reduce((v, f) => f(v), x);\nconst compose = (...fns) => (x) =>\n  fns.reduceRight((v, f) => f(v), x);` }),
  qa(33, "What is memoization? Implement it.", [
    "Cache a function's results by its arguments, so repeat calls are instant",
    "Only for pure functions; the cache key must capture all the arguments",
    "Bound the cache (an LRU) or it becomes a memory leak",
  ], { code: `function memoize(fn) {\n  const cache = new Map();\n  return function (...args) {\n    const key = JSON.stringify(args);\n    if (!cache.has(key))\n      cache.set(key, fn.apply(this, args));\n    return cache.get(key);\n  };\n}` }),
  custom(
    "pylanes",
    {
      title: "Debounce vs throttle: 10 keystrokes in 2 seconds",
      max: 3,
      legend: false,
      rows: [
        { label: "events (typing)", step: 0, bars: [0, 0.2, 0.4, 0.5, 0.7, 0.9, 1.1, 1.4, 1.6, 1.8].map((s) => ({ s, e: s + 0.08, kind: "run" as const })) },
        { label: "debounce 300ms", step: 1, bars: [{ s: 1.8, e: 2.1, kind: "wait" as const }, { s: 2.1, e: 2.18, kind: "block" as const }], done: "1 call" },
        { label: "throttle 500ms", step: 2, bars: [{ s: 0, e: 0.08, kind: "block" as const }, { s: 0.5, e: 0.58, kind: "block" as const }, { s: 1.1, e: 1.18, kind: "block" as const }, { s: 1.6, e: 1.68, kind: "block" as const }], done: "≈ 4 calls" },
      ],
      note: { step: 3, text: "Debounce: search-as-you-type, resize end, autosave · Throttle: scroll, mousemove, rate-limited buttons", tone: "amber" },
    },
    B(
      "Debounce and throttle both limit how often a function runs. Here are ten keystrokes in two seconds.",
      "Debounce waits until the events stop for, say, three hundred milliseconds, then runs once. Every new event restarts the timer. Ten keystrokes, one search request.",
      "Throttle runs at most once per interval, say every five hundred milliseconds, no matter how many events arrive. A steady trickle of calls.",
      { say: "So debounce for search as you type, the end of a resize, or autosave. Throttle for scroll and mousemove handlers, where you want regular updates, but not hundreds a second.", tone: "key" },
    ),
  ),
  qa(34, "What are debouncing and throttling? Implement both.", [
    "Debounce: clear the pending timer on every call, start a new one",
    "Throttle: run, then ignore calls until the interval has passed",
    "Keep this and the arguments with fn.apply(this, args)",
  ], { code: `function debounce(fn, ms) {\n  let t;\n  return function (...args) {\n    clearTimeout(t);\n    t = setTimeout(() => fn.apply(this, args), ms);\n  };\n}\nfunction throttle(fn, ms) {\n  let last = 0;\n  return function (...args) {\n    const now = Date.now();\n    if (now - last >= ms) {\n      last = now;\n      fn.apply(this, args);\n    }\n  };\n}` }),
  check({
    topic: "debounce",
    q: "A search box sends a request on every keystroke. Debounce or throttle, and why?",
    say: "A search box sends a request on every keystroke. Debounce or throttle, and why?",
    a: "Debounce: you want one request after the user pauses, not a steady stream while they type.",
    aSay: "Debounce. You want one request after the user pauses typing, not a steady stream of requests while they're still typing.",
  }),
];
