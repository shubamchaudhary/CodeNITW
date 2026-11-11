import type { Scene } from "../../lib/types.ts";
import { B, custom, qa, sec } from "../web/h.ts";
import { check } from "./p1.ts";

// Part 2: module 4 (closures), module 5 (this), module 6 (objects) and
// module 7 (prototypes and classes).
export const p2: Scene[] = [
  // ================================================================ module 4
  sec("4", "Closures", "Module four. Closures. Only four questions, but closures are behind debounce, memoize, private state, and half the predict-the-output puzzles."),
  custom(
    "pynames",
    {
      title: "The idea: a function keeps the scope it was born in",
      sub: "const c1 = makeCounter(); const c2 = makeCounter();",
      steps: [
        { tags: [{ name: "c1", to: "F1" }], objs: [{ id: "F1", text: "function () { return ++count }" }, { id: "S1", text: "count = 0", col: 1, sub: "makeCounter's scope, kept alive" }], links: [{ from: "F1", to: "S1" }], note: "makeCounter has returned, but its scope lives on, because the inner function still refers to it" },
        { tags: [{ name: "c1", to: "F1" }], objs: [{ id: "F1", text: "function () { return ++count }" }, { id: "S1", text: "count = 2", col: 1, sub: "after c1(), c1()" }], links: [{ from: "F1", to: "S1" }] },
        { tags: [{ name: "c1", to: "F1" }, { name: "c2", to: "F2", tone: "green" }], objs: [{ id: "F1", text: "function () { return ++count }" }, { id: "F2", text: "another function", tone: "green" }, { id: "S1", text: "count = 2", col: 1 }, { id: "S2", text: "count = 0", col: 1, tone: "green" }], links: [{ from: "F1", to: "S1" }, { from: "F2", to: "S2", tone: "green" }], note: "each call to makeCounter makes a new scope: private state per counter" },
      ],
    },
    B(
      "Here's the idea. Make counter declares count, and returns an inner function that increments it. After make counter returns, you'd expect count to be gone. But the inner function still refers to it, so the scope stays alive. A function plus the scope it was born in is a closure.",
      "Call c1 twice, and count is two. The state lives in the closure, and nothing outside can touch it.",
      { say: "Call make counter again, and you get a brand new scope, with its own count. That's how closures give you private state.", tone: "key" },
    ),
  ),
  qa(35, "What is a closure?", [
    "A function together with the variables of the scope where it was created",
    "It can read and change them even after that outer function has returned",
    "Every function in JavaScript is a closure; it matters when a function outlives its scope",
  ]),
  qa(36, "What does this print, and why: setTimeout inside a for loop with var vs let?", [
    "With var: 3, 3, 3. There's one i for the whole loop, and the callbacks run after the loop ends",
    "With let: 0, 1, 2. let makes a new binding of i for each iteration",
    "Pre-ES6 fix: an IIFE (or bind) to capture each value",
  ], { code: `for (var i = 0; i < 3; i++)\n  setTimeout(() => console.log(i));  // 3 3 3\n\nfor (let i = 0; i < 3; i++)\n  setTimeout(() => console.log(i));  // 0 1 2` }),
  qa(37, "What are practical uses of closures?", [
    "Private state: counters, the module pattern, factory functions",
    "Function factories and partial application: makeMultiplier(2)",
    "Remembering state between calls: debounce, throttle, memoize, once",
    "Event handlers and callbacks that need values from where they were set up",
  ]),
  qa(38, "What are the pitfalls of closures?", [
    "Memory: a closure keeps its whole scope alive, big objects included",
    "Stale values: a callback sees the variable from when it was created (React's stale closures)",
    "Loop capture with var: every callback shares one variable",
  ]),

  // ================================================================ module 5
  sec("5", "The this keyword", "Module five. The this keyword. Four questions, and one rule decides all of them: this is set by how a function is called, not where it's written. Except for arrow functions."),
  {
    kind: "flow",
    title: "The idea: how was the function called?",
    cols: 5,
    rows: 2,
    nodeW: 320,
    nodeH: 150,
    nodes: [
      { id: "n", label: "new Foo()\nthis = the new object", c: 0, r: 0, tone: "green" },
      { id: "e", label: "f.call(o) / apply / bind\nthis = o", c: 1, r: 0, tone: "cyan" },
      { id: "m", label: "obj.method()\nthis = obj", c: 2, r: 0, tone: "amber" },
      { id: "p", label: "plain f()\nundefined (strict)\nor globalThis", c: 3, r: 0, tone: "red" },
      { id: "a", label: "arrow function\nthis from the code around it", c: 4, r: 0, tone: "purple" },
      { id: "o", label: "checked in this order: new → explicit → method → plain;  arrows ignore all four", c: 2, r: 1, w: 1500 },
    ],
    edges: [],
    show: [["n"], ["e"], ["m"], ["p"], ["a", "o"]],
    beats: B(
      "Here are the rules, in priority order. Called with new: this is the brand new object.",
      "Called with call, apply or bind: this is whatever you passed.",
      "Called as a method, obj dot method: this is the object before the dot.",
      "Called plainly, just f: this is undefined in strict mode, or the global object in sloppy mode.",
      { say: "And arrow functions ignore all four rules. They have no this of their own: they use the this of the code around them, at the moment they were created. So the question is never where was this function written, but how was it called.", tone: "key" },
    ),
  },
  qa(39, "How is `this` determined in JavaScript?", [
    "By how the function is called: new → explicit binding → method call → plain call",
    "Arrow functions use the surrounding this (lexical)",
    "In event listeners (regular functions), this is the element; in classes, methods follow the same rules",
  ], { ask: "Question 39. How is this determined in JavaScript?" }),
  qa(40, "What is the difference between call, apply and bind?", [
    "call(thisArg, a, b): calls now, arguments one by one",
    "apply(thisArg, [a, b]): calls now, arguments as an array",
    "bind(thisArg, a): doesn't call; returns a new function with this (and arguments) fixed",
  ]),
  qa(41, "Implement Function.prototype.bind.", [
    "Return a function that calls the original with the fixed this and arguments",
    "Merge the pre-set arguments with the ones given later",
    "A full version also handles being called with new",
  ], { code: `Function.prototype.myBind = function (ctx, ...pre) {\n  const fn = this;\n  return function (...later) {\n    return fn.apply(ctx, [...pre, ...later]);\n  };\n};` }),
  qa(42, "Why does `this` get \"lost\" in callbacks, and how do you fix it?", [
    "Passing obj.method as a callback passes the function alone: it's later called plainly",
    ["setTimeout(user.greet, 0) → this is undefined", "So set timeout with user dot greet calls greet with no object, and this is undefined."],
    "Fixes: an arrow wrapper () => user.greet(), user.greet.bind(user), or class fields with arrows",
  ], { ask: "Question 42. Why does this get lost in callbacks, and how do you fix it?" }),
  check({
    topic: "this",
    q: "const f = obj.getName; f(); — what is this inside getName (strict mode)?",
    say: "Const f equals obj dot get name. Then you call f. In strict mode, what is this inside get name?",
    a: "undefined: f() is a plain call; the method was detached from obj.",
    aSay: "Undefined. F is called plainly, so the method has been detached from obj, and there's no object before the dot.",
  }),

  // ================================================================ module 6
  sec("6", "Objects", "Module six. Objects. Twelve questions about creating, reading, copying, locking and serialising them."),
  qa(43, "What are the ways to create objects in JavaScript?", [
    "Object literals { }: the everyday way",
    "Constructor functions or classes with new",
    "Object.create(proto) to choose the prototype; factory functions that return objects",
  ]),
  qa(44, "What is the difference between dot and bracket notation?", [
    "obj.name: the key is a fixed, valid identifier",
    "obj[key]: the key is computed, or has spaces or dashes: obj[\"first-name\"]",
    "Brackets also take symbols and numbers (converted to strings)",
  ]),
  qa(45, "How do you check whether an object has a property?", [
    ["\"key\" in obj: own or inherited", "The in operator checks own and inherited properties."],
    ["Object.hasOwn(obj, \"key\"): own only (better than hasOwnProperty)", "Object dot has own checks only the object's own properties."],
    "obj.key !== undefined fails when the value is undefined on purpose",
  ]),
  qa(46, "What is the difference between for...in and for...of?", [
    "for...in loops over enumerable keys, inherited ones included: for objects",
    "for...of loops over values of an iterable: arrays, strings, Maps, Sets",
    "Don't use for...in on arrays: string keys, possible extra properties",
  ], { ask: "Question 46. What is the difference between for in, and for of?" }),
  qa(47, "What is destructuring?", [
    ["const { name, age = 30 } = user: pull properties into variables, with defaults", "Pull properties out into variables, with defaults, like name and age from user."],
    ["const [first, , third] = list: by position; also renaming: { name: n }", "Arrays destructure by position, and you can rename while destructuring."],
    "Works in parameters too: function f({ id, title })",
  ]),
  custom(
    "pynames",
    {
      title: "Shallow vs deep copy",
      sub: "const user = { name: \"Ana\", address: { city: \"Pune\" } }",
      steps: [
        { tags: [{ name: "user", to: "U" }, { name: "shallow = { ...user }", to: "S", tone: "amber" }], objs: [{ id: "U", text: "user object" }, { id: "S", text: "new object", tone: "amber" }, { id: "A", text: "{ city: \"Pune\" }", col: 1, sub: "shared" }], links: [{ from: "U", to: "A" }, { from: "S", to: "A", tone: "amber" }], note: "spread and Object.assign copy one level: nested objects are shared" },
        { tags: [{ name: "user", to: "U" }, { name: "deep = structuredClone(user)", to: "D", tone: "green" }], objs: [{ id: "U", text: "user object" }, { id: "D", text: "new object", tone: "green" }, { id: "A", text: "{ city: \"Pune\" }", col: 1 }, { id: "A2", text: "{ city: \"Pune\" }  (new)", col: 1, tone: "green" }], links: [{ from: "U", to: "A" }, { from: "D", to: "A2", tone: "green" }], note: "structuredClone copies all the way down (no functions, though)" },
      ],
    },
    B(
      "Copying. Spread, or object dot assign, makes a new top-level object, but nested objects are shared. Change shallow dot address dot city, and user's city changes too.",
      { say: "Structured clone copies all the way down, including maps, sets and dates, and even circular references. It can't copy functions or DOM nodes. And the old trick, JSON stringify then parse, loses dates, undefined, and functions.", tone: "key" },
    ),
  ),
  qa(48, "What is the difference between a shallow copy and a deep copy?", [
    "Shallow: a new outer object, nested objects shared ({ ...obj }, Object.assign, [...arr])",
    "Deep: everything copied recursively (structuredClone, or a custom clone)",
    "JSON.parse(JSON.stringify(x)) drops functions, undefined, Dates, Maps and fails on cycles",
  ]),
  qa(49, "What is the difference between Object.freeze, Object.seal and Object.preventExtensions?", [
    "preventExtensions: no new properties",
    "seal: no new properties, no deleting; existing ones can still change",
    "freeze: nothing can change at all; all three are shallow",
  ]),
  qa(50, "What are getters, setters and property descriptors?", [
    "get / set run functions when a property is read or assigned: computed values, validation",
    "Every property has a descriptor: value, writable, enumerable, configurable (or get/set)",
    "Object.defineProperty sets them; freeze works by setting writable and configurable to false",
  ]),
  qa(51, "When should you use a Map instead of an object?", [
    "Keys of any type (objects, numbers), not only strings and symbols",
    "Frequent adds and deletes, a size property, insertion-order iteration",
    "No accidental keys from the prototype (\"constructor\", \"__proto__\")",
    "Plain objects stay best for fixed records and JSON",
  ]),
  qa(52, "What are WeakMap and WeakSet?", [
    "Keys must be objects, held weakly: they don't stop garbage collection",
    "When the key object is gone, the entry disappears",
    "Not iterable, no size: used for metadata or caches attached to objects without leaks",
  ]),
  qa(53, "What are Symbols used for?", [
    "Unique, unguessable property keys: no clash with other code's properties",
    "Well-known symbols customise built-in behaviour: Symbol.iterator, Symbol.toPrimitive",
    "Skipped by for...in, Object.keys and JSON.stringify",
  ]),
  qa(54, "What do JSON.stringify and JSON.parse do, and what are their pitfalls?", [
    "stringify: value → JSON text; parse: text → value",
    "Lost: undefined, functions, symbols; Dates become strings; Map and Set become {}",
    "Throws on circular references and BigInt; parse throws on invalid JSON (wrap it in try)",
    "Extras: a replacer and spacing for stringify, a reviver for parse, toJSON on objects",
  ]),

  // ================================================================ module 7
  sec("7", "Prototypes and classes", "Module seven. Prototypes and classes. Seven questions on JavaScript's own kind of inheritance, which classes are only a nicer syntax for."),
  {
    kind: "flow",
    title: "The idea: a missing property is looked up the prototype chain",
    cols: 4,
    rows: 1,
    nodeW: 380,
    nodeH: 170,
    nodes: [
      { id: "r", label: "rex\nname: \"Rex\"", c: 0, r: 0, tone: "amber" },
      { id: "d", label: "Dog.prototype\nbark()", c: 1, r: 0 },
      { id: "a", label: "Animal.prototype\neat()", c: 2, r: 0 },
      { id: "o", label: "Object.prototype\ntoString(), hasOwnProperty()\n→ null", c: 3, r: 0, tone: "cyan" },
    ],
    edges: [
      { from: "r", to: "d", label: "[[Prototype]]" },
      { from: "d", to: "a", label: "[[Prototype]]" },
      { from: "a", to: "o", label: "[[Prototype]]" },
    ],
    show: [["r"], ["d"], ["a", "o"]],
    beats: B(
      "Here's the idea. Every object has a hidden link to another object, its prototype. Rex has its own property, name.",
      "Ask for rex dot bark: it isn't on rex, so the engine follows the link to Dog dot prototype, and finds it there.",
      { say: "Rex dot eat goes one step further, to Animal dot prototype. And to string comes from Object dot prototype, whose link is null, the end of the chain. That's prototypal inheritance: objects delegating to other objects. Classes build exactly this chain.", tone: "key" },
    ),
  },
  qa(55, "How does prototypal inheritance work?", [
    "Each object has a [[Prototype]] link to another object",
    "A missing property is looked up along that chain until null",
    "Methods live once on the prototype and are shared by every instance",
  ]),
  qa(56, "What is the difference between __proto__ and prototype?", [
    ["obj.__proto__ (or Object.getPrototypeOf(obj)): the object's own prototype link", "Dunder proto, or better, object dot get prototype of, is an object's own link to its prototype."],
    ["Foo.prototype: a property of a function: the object that instances made by new Foo() will link to", "Foo dot prototype is a property of a constructor function: the object that instances created with new Foo will link to."],
    ["So new Foo().__proto__ === Foo.prototype", "So an instance's proto is its constructor's prototype."],
  ], { ask: "Question 56. What's the difference between dunder proto, and prototype?" }),
  qa(57, "What does the `new` keyword do?", [
    "Creates an empty object, linked to Constructor.prototype",
    "Calls the constructor with this set to that object",
    "Returns the object (unless the constructor returns another object)",
  ], { ask: "Question 57. What does the new keyword do?", code: `function myNew(Ctor, ...args) {\n  const obj = Object.create(Ctor.prototype);\n  const out = Ctor.apply(obj, args);\n  return out instanceof Object ? out : obj;\n}` }),
  qa(58, "How do ES6 classes compare with constructor functions?", [
    "Classes are mostly syntax over constructor functions and prototypes",
    "Differences: must be called with new, strict mode, not hoisted usably (TDZ), methods non-enumerable",
    "Plus real features: private #fields, static blocks, cleaner extends/super",
  ]),
  qa(59, "How does inheritance work with extends and super?", [
    "class Dog extends Animal links Dog.prototype to Animal.prototype",
    "In the constructor, call super(...) before using this",
    "super.method() calls the parent's version of an overridden method",
  ]),
  qa(60, "What are static members and private fields in classes?", [
    "static: belongs to the class itself: Math-style helpers, factories, counters",
    "#field: truly private, enforced by the language, not just a convention",
    "#method() too; check with #field in obj",
  ]),
  qa(61, "What is the difference between Object.create and Object.assign?", [
    "Object.create(proto): a new empty object whose prototype is proto",
    "Object.assign(target, ...sources): copies own enumerable properties into target",
    "create sets up inheritance; assign copies data (shallowly)",
  ]),
  check({
    topic: "prototypes",
    q: "Two Dog instances: does each one get its own copy of bark(), defined as a class method?",
    say: "You create two Dog instances. Does each one get its own copy of bark, defined as a class method?",
    a: "No: bark lives once on Dog.prototype and both instances find it through the prototype chain.",
    aSay: "No. Bark lives once on Dog dot prototype, and both instances find it by following their prototype link.",
  }),
];
