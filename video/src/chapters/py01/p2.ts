import type { Scene } from "../../lib/types.ts";
import { B, check, custom, q, sec } from "./h.ts";

// Part 2: module 3 (functions, scope, closures, decorators) and module 4
// (iterators and generators).
export const p2: Scene[] = [
  // ================================================================ module 3
  sec("3", "Functions and scope", "Module three. Functions and scope. This module holds the single most asked Python topic, decorators, and the way to understand decorators is to build them from three simpler facts first."),
  {
    kind: "bullets",
    title: "The idea: three facts about functions",
    lead: "put them together and you have a decorator",
    firstItemStep: 1,
    items: [
      { icon: "📦", text: "A function is an object", sub: "you can pass it, return it, store it" },
      { icon: "🪆", text: "A function can be defined inside a function", sub: "a new one is made each time the outer one runs" },
      { icon: "🎒", text: "The inner function remembers the outer one's variables", sub: "even after the outer function has returned: a closure" },
      { icon: "🎁", text: "Decorator = a function that takes a function and returns a wrapped one", sub: "facts one, two and three, together" },
    ],
    beats: B(
      "Here's the idea behind this whole module. Three facts about functions.",
      "One. A function is an object, as we saw in module one. You can pass it to another function, return it, or store it.",
      "Two. You can define a function inside another function. Every time the outer one runs, a brand new inner function is made.",
      "Three. The inner function remembers the variables of the outer one, even after the outer function has returned. That's called a closure.",
      { say: "Put the three together: a function that takes a function, defines a wrapper inside, and returns it. That's a decorator. Keep these three facts in mind, and the rest of the module follows.", tone: "key" },
    ),
  },

  // ---- Q17
  q(17, 3, "What are *args and **kwargs?", "collecting extra arguments, unpacking them, and parameter order", "Question seventeen, asked in three write-ups. What are star args and double star kwargs?", "Two jobs to explain: collecting extra arguments in a definition, and unpacking them in a call. Then the parameter order."),
  {
    kind: "code",
    title: "* and ** collect in a definition, unpack in a call",
    lang: "python",
    code: `def log(level, *args, **kwargs):
    print(level, args, kwargs)

log("INFO", 1, 2, user="ana", retry=True)
# INFO (1, 2) {'user': 'ana', 'retry': True}

nums = [3, 4]; opts = {"sep": "-"}
print(*nums, **opts)          # print(3, 4, sep="-")

def connect(host, *, timeout=5): ...    # timeout is keyword-only
def f(a, /, b, *args, c, **kwargs): ...  # the full order`,
    highlight: [[1, 5], [7, 8], [10, 11]],
    beats: B(
      "In a function definition, star args collects any extra positional arguments into a tuple, and double star kwargs collects any extra keyword arguments into a dict. The names args and kwargs are only a convention. The stars do the work.",
      "In a call, the stars do the opposite. They unpack. Star nums spreads a list into positional arguments, and double star opts spreads a dict into keyword arguments. This is how a wrapper passes everything through to the function it wraps.",
      { say: "And the order of parameters: positional-only ones before a slash, then normal ones, then star args, then keyword-only ones, then double star kwargs. A bare star means: everything after me must be passed by name, like timeout here. That's a nice way to make calls readable.", tone: "key" },
    ),
  },

  // ---- Q18
  q(18, null, "What is the LEGB rule, and what do global and nonlocal do?", "the lookup order, why assignment makes a name local, and the two keywords", "Question eighteen. What is the LEGB rule, and what do global and nonlocal do?", "The lookup order, the rule that assignment makes a name local, and the two keywords that change that."),
  custom(
    "pyscope",
    {
      title: "LEGB: where Python looks up a name",
      layers: [
        { name: "Built-in", vars: ["len", "print", "range"] },
        { name: "Global (the module)", vars: ["MODEL", "count"] },
        { name: "Enclosing (outer)", vars: ["total"] },
        { name: "Local (inner)", vars: ["x"] },
      ],
      steps: [
        { note: "every function call has its own local scope, nested inside the scopes around it" },
        { find: "x", hit: 3, note: "Local first: inside the function that's running" },
        { find: "total", hit: 2, note: "then Enclosing: the functions around it" },
        { find: "MODEL", hit: 1, note: "then Global: the module's top level" },
        { find: "len", hit: 0, note: "then Built-in" },
        { find: "nope", hit: -1, note: "found nowhere: NameError" },
      ],
    },
    B(
      "When you use a name, Python looks it up through nested scopes. Here, a function inner, defined inside a function outer, in a module.",
      "First, the local scope: the function that's running. X is found right there.",
      "If it's not local, Python tries the enclosing scopes: the functions around this one. Total lives in outer.",
      "Then the global scope, which means the module's top level. That's where model is.",
      "And last, the built-ins, like len and print.",
      { say: "If the name isn't in any of them, you get a name error. Local, enclosing, global, built-in: L, E, G, B.", tone: "key" },
    ),
  ),
  {
    kind: "code",
    title: "Assignment makes a name local, for the whole function",
    lang: "python",
    code: `count = 0
def bump():
    count += 1        # UnboundLocalError!

def bump():
    global count      # use the module's count
    count += 1

def make_counter():
    n = 0
    def step():
        nonlocal n    # use the enclosing function's n
        n += 1
        return n
    return step`,
    highlight: [[1, 3], [5, 7], [9, 15]],
    beats: B(
      "The rule that trips people up: if a function assigns to a name anywhere, that name is local for the whole function. So count plus equals one fails with an unbound local error, because Python decided count is local, and it has no value yet.",
      "The global keyword says: this name means the module's variable. It works, but global state is usually a smell.",
      { say: "And nonlocal says: this name means the variable in the enclosing function. That's how an inner function changes state it closed over, like this counter. Global reaches the module. Nonlocal reaches the function around you.", tone: "key" },
    ),
  },

  // ---- Q19
  q(19, null, "What is a closure, and what is the late-binding gotcha?", "remembering the enclosing scope, and capturing variables, not values", "Question nineteen. What is a closure, and what is the late-binding gotcha?", "What a closure remembers, and the consequence: it captures variables, not values."),
  custom(
    "pynames",
    {
      title: "A closure keeps the outer variable alive",
      sub: "c1 = make_counter(); c2 = make_counter()",
      steps: [
        { tags: [{ name: "c1", to: "F1" }], objs: [{ id: "F1", text: "step function" }, { id: "N1", text: "n = 0", col: 1, sub: "a cell, kept alive" }], links: [{ from: "F1", to: "N1" }], note: "make_counter has returned, but step still holds its n" },
        { tags: [{ name: "c1", to: "F1" }], objs: [{ id: "F1", text: "step function" }, { id: "N1", text: "n = 2", col: 1, sub: "after c1(), c1()" }], links: [{ from: "F1", to: "N1" }] },
        { tags: [{ name: "c1", to: "F1" }, { name: "c2", to: "F2", tone: "green" }], objs: [{ id: "F1", text: "step function" }, { id: "F2", text: "another step function", tone: "green" }, { id: "N1", text: "n = 2", col: 1 }, { id: "N2", text: "n = 0", col: 1, tone: "green" }], links: [{ from: "F1", to: "N1" }, { from: "F2", to: "N2", tone: "green" }], note: "each call to make_counter makes a new function with its own n" },
      ],
    },
    B(
      "A closure is an inner function that remembers variables from the enclosing scope, even after that scope has finished. Make counter has returned, but the step function it returned still holds on to n. Python keeps n in a small object called a cell, and you can see it in the function's dunder closure.",
      "Call c1 twice, and n is two. The state lives in the closure, with no class needed.",
      { say: "Call make counter again, and you get a new function, with its own n. Each closure has its own private state. That's what decorators use to remember the function they wrap.", tone: "key" },
    ),
  ),
  {
    kind: "code",
    title: "Late binding: closures capture variables, not values",
    lang: "python",
    code: `fns = [lambda: i for i in range(3)]
print([f() for f in fns])      # [2, 2, 2], not [0, 1, 2]

fns = [lambda i=i: i for i in range(3)]   # freeze the value now
print([f() for f in fns])      # [0, 1, 2]

from functools import partial
fns = [partial(show, i) for i in range(3)]  # or bind it explicitly`,
    highlight: [[1, 2], [4, 5], [7, 8]],
    beats: B(
      "Now the gotcha. Make three lambdas in a loop, each returning i, and call them. You get two, two, two. All three closures share the one variable i, and they read it only when they're called, after the loop has finished with i equal to two. Closures capture variables, not values.",
      "The classic fix is a default argument: lambda i equals i. Default values are evaluated when the function is defined, so each lambda freezes its own i.",
      { say: "Or bind the value explicitly with functools dot partial. Same idea: capture the value now, not the variable later.", tone: "key" },
    ),
  },

  // ---- Q20
  q(20, 17, "What are decorators, and how do they work?", "the definition, what @ means, wraps, and a real example", "Question twenty. The most asked Python question in the whole data set: seventeen write-ups. What are decorators, and how do they work?", "Give the definition, show what the at sign really does, write one, and mention functools dot wraps. Usually you'll be asked to write one on the spot."),
  {
    kind: "code",
    title: "A decorator: a function in, a wrapped function out",
    lang: "python",
    code: `import functools, time

def timed(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)      # call the original
        print(f"{func.__name__} took {time.perf_counter() - start:.3f}s")
        return result
    return wrapper

@timed                  # the same as: answer = timed(answer)
def answer(question): ...`,
    highlight: [[3, 3], [5, 9], [10, 10], [12, 13]],
    beats: B(
      "A decorator is a function that takes a function, and returns a new function, usually a wrapper that adds behaviour before or after the original. Timed takes func.",
      "Inside, it defines a wrapper. Star args and double star kwargs let the wrapper accept any arguments and pass them all through. It starts a timer, calls the original, prints how long it took, and returns the original's result.",
      "And it returns the wrapper. Not calls it. Returns it.",
      { say: "Then the at sign. At timed, above def answer, is just shorthand for: answer equals timed of answer. That's all the syntax does. The name answer now points at the wrapper.", tone: "key" },
    ),
  },
  custom(
    "pynames",
    {
      title: "What @timed does to the name",
      steps: [
        { tags: [{ name: "answer", to: "A" }], objs: [{ id: "A", text: "answer (the original)" }], note: "def answer: the name points at the original function" },
        { tags: [{ name: "answer", to: "W", tone: "amber" }], objs: [{ id: "W", text: "wrapper", tone: "amber" }, { id: "A", text: "answer (the original)", col: 1, sub: "kept in wrapper's closure as func" }], links: [{ from: "W", to: "A", tone: "amber" }], note: "answer = timed(answer): the name now points at the wrapper" },
        { tags: [{ name: "answer", to: "W", tone: "amber" }], objs: [{ id: "W", text: "wrapper  (__name__ = 'answer')", tone: "amber" }, { id: "A", text: "answer (the original)", col: 1, sub: "reachable as __wrapped__" }], links: [{ from: "W", to: "A", tone: "amber" }], note: "functools.wraps copies the name, docstring and signature info onto the wrapper" },
      ],
    },
    B(
      "Here's what happens to the name. After def, answer points at the original function.",
      "After the decorator runs, the name answer points at the wrapper. The original isn't gone. It lives on inside the wrapper's closure, as func. So every call goes through the wrapper first.",
      { say: "And that's why functools dot wraps matters. Without it, the wrapper's name would be wrapper, its docstring would be lost, and logs, debuggers and frameworks like FastAPI that read the signature would see the wrong thing. Wraps copies the name and docstring across, and keeps the original reachable as dunder wrapped.", tone: "key" },
    ),
  ),
  custom(
    "pyonion",
    {
      title: "Stacked decorators: the closest one wraps first",
      sub: "@log  @timed  def answer(): …",
      core: "answer()",
      layers: [
        { name: "timed", does: "written nearest to def: wraps first, sits inside", tone: "amber" },
        { name: "log", does: "written on top: wraps last, so it runs first", tone: "cyan" },
      ],
      call: "a call goes in: log → timed → answer",
      back: "the result comes out: answer → timed → log",
    },
    B(
      "Decorators stack. With at log on top of at timed, the one nearest the def wraps first. Answer equals log of timed of answer.",
      "Timed sits inside, closest to the function.",
      "Log wraps around everything, so it's the outermost layer.",
      { say: "So a call goes in through log first, then timed, then the function, and the result comes back out the other way. Top runs first on the way in, last on the way out. It's an onion.", tone: "key" },
    ),
  ),
  {
    kind: "sayit",
    q: "What is a decorator, and how does it work?",
    lines: [
      "A function that takes a function and returns a new one, usually a wrapper.",
      "@deco above def f is shorthand for f = deco(f).",
      "It works because functions are objects, and the wrapper is a closure over the original.",
      "The wrapper takes *args, **kwargs and passes them through; functools.wraps keeps the name and docstring.",
      "Uses: logging, timing, retries, caching, auth checks: behaviour around a function without editing it.",
    ],
    beats: B(
      { say: "Here's the answer to say out loud.", tone: "ask" },
      "A decorator is a function that takes a function and returns a new one, usually a wrapper around it.",
      "The at syntax above a def is just shorthand for: f equals decorator of f.",
      "It works because functions are objects, and the wrapper is a closure that keeps a reference to the original.",
      "The wrapper accepts star args and double star kwargs and passes them through, and I use functools dot wraps so the name and docstring survive.",
      { say: "I'd use one for logging, timing, retries, caching or auth checks: anywhere I want behaviour around a function without editing the function itself.", tone: "key" },
    ),
  },

  // ---- Q21
  q(21, null, "How do you write a decorator that takes arguments?", "one more level: a factory that returns the decorator", "Question twenty one. How do you write a decorator that takes arguments?", "One more level of nesting, and what at retry of three really calls."),
  {
    kind: "code",
    title: "Arguments → decorator → wrapper: three levels",
    lang: "python",
    code: `def repeat(times):                 # 1. takes the arguments
    def decorator(func):           # 2. takes the function
        @functools.wraps(func)
        def wrapper(*args, **kwargs):   # 3. runs on every call
            for _ in range(times):
                result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator

@repeat(3)          # repeat(3) runs first and returns decorator
def ping(): ...     # then: ping = decorator(ping)`,
    highlight: [[1, 1], [2, 2], [4, 7], [11, 12]],
    beats: B(
      "A decorator with arguments needs one more level. The outer function takes the arguments.",
      "It returns the real decorator, which takes the function.",
      "Which returns the wrapper, which runs on every call. Three levels: arguments, then function, then call.",
      { say: "The way to see it: at repeat of three is a call. Repeat of three runs first, and returns a decorator. Then that decorator is applied to ping. So it's ping equals repeat of three, of ping.", tone: "key" },
    ),
  },

  // ---- Q22 (py61)
  q(22, 3, "Write a decorator that logs every call. What happens on a recursive function?", "arguments, duration, result or exception, and the recursion trap", "Question twenty two, asked in three write-ups. Write a decorator that logs every call: arguments, duration, and the result or the exception. And what happens on a recursive function?", "The decorator itself, then the follow-up, which is the part that separates people."),
  {
    kind: "code",
    title: "Log the call, the time, and the result or the error",
    lang: "python",
    code: `def logged(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        try:
            result = func(*args, **kwargs)
        except Exception as e:
            log.error("%s%r raised %r", func.__name__, args, e)
            raise                      # never swallow it
        log.info("%s%r -> %r in %.3fs", func.__name__, args,
                 result, time.perf_counter() - start)
        return result
    return wrapper`,
    highlight: [[4, 6], [7, 9], [10, 12]],
    beats: B(
      "The shape is the timer we just wrote, with a try. Start the clock, and call the function.",
      "If it raises, log the error with the arguments, and then re-raise with a bare raise. A logging decorator must never swallow the exception: the caller still has to see it.",
      { say: "Otherwise, log the result and the duration, and return the result. Use repr for the arguments, so a string shows with its quotes.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "The recursion trap: every inner call is logged too",
    lang: "python",
    code: `@logged
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

fib(20)    # logs 21,891 calls, not 1

# fix: decorate a thin outer function, recurse in an inner one
@logged
def fib(n):
    def go(k):
        return k if k < 2 else go(k - 1) + go(k - 2)
    return go(n)`,
    highlight: [[1, 5], [7, 12]],
    beats: B(
      "Now the follow-up. Decorate a recursive function like fib. Inside fib, the name fib is looked up at call time, and it now points at the wrapper. So every recursive call goes through the wrapper, and fib of twenty logs nearly twenty two thousand lines, and the timing is nonsense.",
      { say: "The fix: decorate a thin outer function, and keep the recursion in an inner one that the decorator never sees. Or track the call depth inside the wrapper, and only log at depth zero.", tone: "key" },
    ),
  },

  // ---- Q23 (py65)
  q(23, null, "Write a retry decorator for a flaky LLM API call. Which errors do you retry, and how long do you wait?", "transient vs permanent errors, exponential backoff with a cap, and jitter", "Question twenty three. Write a retry decorator for a flaky LLM API call. Which errors do you retry, and how long do you wait?", "The code is the easy part. The answer is decided by what you retry, and how you wait."),
  {
    kind: "compare",
    title: "Retry the transient, fail fast on the permanent",
    cols: [
      { title: "Retry", icon: "🔁", tone: "green", items: ["429 rate limited", "Timeouts, dropped connections", "500, 502, 503 from the provider"] },
      { title: "Don't retry", icon: "⛔", tone: "red", items: ["400 bad request", "401 / 403: bad key, no access", "Context too long: same input, same failure"] },
    ],
    footer: "A permanent error fails the same way every time: retrying it only costs money and latency",
    beats: B(
      "Retry only transient errors: things that might work a second later. A 429, which means rate limited. Timeouts and dropped connections. And 5 hundred errors from the provider.",
      "Never retry permanent errors. A 400, bad request. A 401 or 403, a bad key or no access. Or a context length error.",
      { say: "Those fail the same way every time, so retrying them just burns money and adds latency.", tone: "key" },
    ),
  },
  {
    kind: "chart",
    title: "How long to wait: exponential backoff, capped, with jitter",
    type: "bars",
    labels: ["attempt 1", "attempt 2", "attempt 3", "attempt 4", "attempt 5", "attempt 6"],
    series: [{ name: "wait before retrying (s)", values: [0.5, 1, 2, 4, 8, 8], step: 0 }],
    unit: "s",
    note: { step: 1, text: "Plus random jitter, so a thousand failed clients don't all retry in the same millisecond. Honour Retry-After if the provider sends it.", tone: "amber" },
    beats: B(
      "How long to wait: double the wait each time. Half a second, one, two, four, and then a cap, here eight seconds, so you never wait forever.",
      { say: "And add random jitter to every wait. If a thousand clients failed at the same moment, jitter spreads their retries out, instead of hitting the provider again all at once. If the provider sends a Retry After header, wait exactly that long.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "The retry decorator",
    lang: "python",
    code: `def retry(times=4, base=0.5, cap=8.0,
          on=(RateLimitError, TimeoutError, ConnectionError)):
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            for attempt in range(times):
                try:
                    return fn(*args, **kwargs)
                except on:
                    if attempt == times - 1:
                        raise              # out of tries: the real error
                    delay = min(cap, base * 2 ** attempt)
                    time.sleep(delay + random.uniform(0, delay / 4))
        return wrapper
    return decorator`,
    highlight: [[1, 2], [6, 8], [9, 11], [12, 13]],
    beats: B(
      "It's a decorator with arguments, so three levels. The arguments are how many times, the base delay, the cap, and which exception types count as transient.",
      "The wrapper loops over attempts, and returns as soon as a call succeeds.",
      "It catches only the listed exceptions. Anything else, like a bad request, flies straight out. And on the last attempt, it re-raises, so the caller sees the real error, never a silent None.",
      { say: "Otherwise it waits: the base delay doubled per attempt, capped, plus jitter. In async code, it's the same shape, with async def and await asyncio dot sleep. Never time dot sleep inside async code. And in real projects, a library like tenacity, or the SDK's own max retries, does this for you.", tone: "key" },
    ),
  },

  // ---- Q24 (py22)
  q(24, 1, "What are lambda functions, and how do map, filter and reduce compare with comprehensions?", "a one-expression function, lazy map and filter, and why comprehensions usually win", "Question twenty four. What are lambda functions, and how do map, filter and reduce compare with comprehensions?", "What a lambda is limited to, what the three functions return, and which one you'd actually write."),
  {
    kind: "code",
    title: "lambda, map, filter, reduce",
    lang: "python",
    code: `square = lambda x: x * x          # one expression, no statements

list(map(square, nums))           # [1, 4, 9]  (map is lazy)
list(filter(lambda x: x > 1, nums))
from functools import reduce
reduce(lambda acc, x: acc + x, nums, 0)   # fold into one value

[x * x for x in nums]             # usually clearer
[x for x in nums if x > 1]
sorted(users, key=lambda u: u.age)   # where lambda shines`,
    highlight: [[1, 1], [3, 6], [8, 10]],
    beats: B(
      "A lambda is a small anonymous function, limited to a single expression. No statements, no annotations.",
      "Map applies a function to every item. Filter keeps the items where the function is true. In Python three, both return lazy iterators, not lists. And reduce, from functools, folds the items into one value.",
      { say: "In practice, comprehensions are usually clearer than map and filter with a lambda. Where lambda really shines is as a short key function, like sorting users by age. And map is fine with a function that already exists, like map of int over a line's fields.", tone: "key" },
    ),
  },

  // ---- Q25 (py23)
  q(25, null, "What useful tools are in functools?", "wraps, caching, partial, and the lru_cache-on-methods trap", "Question twenty five. What useful tools are in functools?", "Name the useful ones with a use for each, and the one trap."),
  {
    kind: "bullets",
    title: "functools, the useful parts",
    items: [
      { icon: "🎁", text: "wraps", sub: "keeps a wrapped function's name and docstring: every decorator" },
      { icon: "🗃️", text: "lru_cache(maxsize=…) and cache", sub: "memoise a pure function of hashable arguments" },
      { icon: "📌", text: "partial(f, x)", sub: "a new function with some arguments filled in" },
      { icon: "🧮", text: "reduce, cmp_to_key, total_ordering", sub: "fold; an old-style comparator as a key; fill in < <= > >= from one" },
      { icon: "⚠️", text: "lru_cache on a method keeps self alive", sub: "the cache holds every instance: a memory leak. Use cached_property" },
    ],
    beats: B(
      "Wraps, which every decorator should use.",
      "LRU cache, and its unbounded cousin, cache: memoisation for a pure function whose arguments are hashable. One line turns a slow recursive function into a fast one.",
      "Partial, which makes a new function with some arguments already filled in.",
      "Reduce, for folding. Cmp to key, which turns an old-style comparator into a key function. And total ordering, which fills in the other comparison methods from one.",
      { say: "And the trap. LRU cache on a method caches on self too, so the cache keeps every instance alive. That's a memory leak. Use cached property, or a cache on the class. Also remember that a cached mutable result is shared by every caller.", tone: "key" },
    ),
  },
  check({
    topic: "late binding",
    q: "handlers = [lambda: print(name) for name in ['a', 'b', 'c']]. What do the three calls print?",
    say: "Handlers is a list of lambdas, one per name in a, b, c, each printing name. You call all three. What do they print?",
    options: ["a, b, c", "c, c, c", "a, a, a", "NameError"],
    oSay: ["a, b, c", "c, c, c", "a, a, a", "a name error"],
    answer: 1,
    a: "c, c, c. The lambdas capture the variable name, not its value, and read it when called, after the loop ended on 'c'.",
    aSay: "B. C, c, c. The lambdas capture the variable, not its value, and they read it when they're called, after the loop has finished with name equal to c. Fix it with a default argument, name equals name.",
  }),
  check({
    topic: "decorators",
    q: "What does @retry(times=3) above def call(): … actually run, in order?",
    say: "What does at retry, times equals three, above def call, actually run, in order?",
    a: "retry(times=3) runs first and returns a decorator; then call = decorator(call). The name call now points at the wrapper.",
    aSay: "First, retry with times equals three is called, and it returns a decorator. Then that decorator is applied to call, so call equals decorator of call, and the name call now points at the wrapper, which runs on every call.",
  }),

  // ================================================================ module 4
  sec("4", "Iterators and generators", "Module four. Iterators and generators. Generators are the second most asked topic, with sixteen write-ups. And they make sense once you see what a for loop really does."),
  custom(
    "pytape",
    {
      title: "The idea: a for loop runs on two calls, iter() and next()",
      sub: "for x in [10, 20, 30]: …",
      cells: ["10", "20", "30"],
      idx: false,
      outLabel: "next(it) →",
      steps: [
        { ptr: 0, label: "it = iter(lst)", note: "iter() asks the list for an iterator: an object that remembers a position" },
        { ptr: 0, out: "10", label: "position", note: "each next() hands over the value and moves on" },
        { ptr: 1, out: "20", label: "position" },
        { ptr: 2, out: "30", label: "position" },
        { ptr: null, stop: true, out: "raise StopIteration", note: "nothing left: next() raises StopIteration, and the for loop ends quietly" },
      ],
    },
    B(
      "Here's the idea behind the module. A for loop over a list first calls iter on it. That asks the list for an iterator: a separate little object whose only job is to remember a position.",
      "Then the loop calls next on the iterator, again and again. Each next hands over a value, and moves the position on. Ten.",
      "Twenty.",
      "Thirty.",
      { say: "And when there's nothing left, next raises StopIteration, and the for loop catches it and ends quietly. That's the iterator protocol, and every for loop in Python runs on it: lists, dicts, files, and generators.", tone: "key" },
    ),
  ),

  // ---- Q26 (py24)
  q(26, 4, "What is the difference between an iterable and an iterator?", "__iter__ versus __next__, and reusable versus one pass", "Question twenty six, asked in four write-ups. What's the difference between an iterable and an iterator?", "The two methods, and the practical difference: one can be looped over again and again, the other only once."),
  {
    kind: "compare",
    title: "Iterable vs iterator",
    cols: [
      { title: "Iterable", icon: "📚", tone: "blue", items: ["Has __iter__(), which returns a new iterator", "list, tuple, str, dict, set, range, file", "Loop over it again and again"] },
      { title: "Iterator", icon: "👉", tone: "amber", items: ["Has __next__(); raises StopIteration at the end", "Remembers its position; __iter__ returns itself", "One pass only: then it's used up"] },
    ],
    footer: "Every iterator is iterable; not every iterable is an iterator",
    beats: B(
      "An iterable is anything you can loop over. It has dunder iter, which returns a new iterator each time. Lists, tuples, strings, dicts, sets, ranges, files. Because each loop gets a fresh iterator, you can loop over a list as many times as you like.",
      "An iterator is the thing that does the walking. It has dunder next, which returns the next value, and raises StopIteration at the end. It remembers its position, and its dunder iter returns itself. So it's one pass only. Once it's used up, it stays used up.",
      { say: "So every iterator is iterable, but not every iterable is an iterator. A list is iterable. Iter of the list is an iterator.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "What for really does, and the one-pass trap",
    lang: "python",
    code: `it = iter(items)           # for x in items: body
while True:
    try:
        x = next(it)
    except StopIteration:
        break
    body(x)

nums = map(int, ["1", "2", "3"])   # an iterator
print(sum(nums))    # 6
print(sum(nums))    # 0: it was used up`,
    highlight: [[1, 7], [9, 11]],
    beats: B(
      "Here is a for loop, written out by hand. Get an iterator, call next in a loop, and stop on StopIteration. That's exactly what for does for you.",
      { say: "And the trap that follows. Map returns an iterator. Sum it once, and you get six. Sum it again, and you get zero, because it was used up. Same with generators, zip, and file objects. If you need the values twice, make a list.", tone: "key" },
    ),
  },

  // ---- Q27 (py25)
  q(27, 16, "What are generators, and how does yield work?", "a function that pauses: what calling it does, what each next does, and why it saves memory", "Question twenty seven, asked in sixteen write-ups. What are generators, and how does yield work?", "What calling a generator function does, which surprises people, what each next does, and why you'd use one."),
  {
    kind: "seq",
    title: "A generator function pauses at each yield",
    actors: [
      { id: "c", name: "Caller", icon: "🧑‍💻" },
      { id: "g", name: "count_up(3)", icon: "⚙️", tone: "amber" },
    ],
    msgs: [
      { from: "c", to: "g", label: "g = count_up(3): nothing runs yet", step: 0, dash: true },
      { from: "c", to: "g", label: "next(g)", step: 1 },
      { from: "g", to: "c", label: "runs to yield 1, pauses", step: 1, tone: "green" },
      { from: "c", to: "g", label: "next(g)", step: 2 },
      { from: "g", to: "c", label: "resumes after the yield, yields 2", step: 2, tone: "green" },
      { from: "c", to: "g", label: "next(g) … after 3", step: 3 },
      { from: "g", to: "c", label: "body ends: StopIteration", step: 3, tone: "red" },
    ],
    note: { step: 4, text: "Between calls, the generator's local variables and its place in the code are saved", tone: "amber" },
    beats: B(
      "A generator function is any function with yield in it. And here's what surprises people: calling it runs none of its body. It just returns a generator object, which is an iterator.",
      "The first next runs the body until it reaches a yield. It hands back that value, one, and pauses right there.",
      "The next call to next resumes right after that yield, with every local variable exactly as it was, and runs to the next yield. Two.",
      "And when the body ends, the generator raises StopIteration, and a for loop over it simply stops.",
      { say: "So a generator is a function that can pause, keeping its local variables and its place in the code, and resume later. That's all yield is: pause here and hand this value out.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "Generators chain into a lazy pipeline",
    lang: "python",
    code: `def read_lines(path):
    with open(path) as f:
        for line in f:
            yield line.rstrip("\\n")

def only_errors(lines):
    for line in lines:
        if "ERROR" in line:
            yield line

def batched(items, size):
    batch = []
    for x in items:
        batch.append(x)
        if len(batch) == size:
            yield batch
            batch = []
    if batch:
        yield batch

for batch in batched(only_errors(read_lines("app.log")), 100):
    save(batch)        # a 20 GB file, one line in memory at a time`,
    highlight: [[1, 4], [6, 9], [11, 19], [21, 22]],
    beats: B(
      "Why use them? Because they chain into pipelines. Read lines is a generator that yields one line at a time from a file.",
      "Only errors takes any iterable of lines and yields the ones that matter.",
      "Batched groups items into lists of a fixed size, which is what you want before a bulk insert, or an embedding API that takes a hundred texts per call.",
      { say: "Chain them, and you can process a twenty gigabyte log file while holding about one line in memory. Nothing is read until the for loop asks for the next batch. That's the answer to why generators: memory, laziness, and clean pipelines.", tone: "key" },
    ),
  },
  {
    kind: "sayit",
    q: "What is a generator, and how does yield work?",
    lines: [
      "A function with yield; calling it returns a generator object, an iterator, and runs nothing.",
      "Each next() runs the body to the next yield, hands out the value, and pauses with its state saved.",
      "The next call resumes right after the yield; when the body ends, StopIteration.",
      "Why: constant memory, lazy evaluation, infinite sequences, and pipelines.",
      "One pass only; yield from delegates to another iterable.",
    ],
    beats: B(
      { say: "Out loud, it goes like this.", tone: "ask" },
      "A generator is a function that contains yield. Calling it returns a generator object, which is an iterator, and runs none of the body.",
      "Each call to next runs the body up to the next yield, hands out that value, and pauses, with its local state saved.",
      "The next call resumes right after the yield. When the function ends, it raises StopIteration.",
      "I use them for constant memory over big data, for lazy evaluation, for infinite sequences, and to build pipelines of small steps.",
      { say: "The catch is they're one pass only. And yield from delegates to another iterable or generator.", tone: "key" },
    ),
  },

  // ---- Q28 (py26)
  q(28, 4, "What is the difference between a generator and a list (and between yield and return)?", "eager versus lazy, and pause versus finish", "Question twenty eight, asked in four write-ups. What's the difference between a generator and a list, and between yield and return?", "Two comparisons. Eager versus lazy, and pausing versus finishing."),
  {
    kind: "compare",
    title: "List vs generator  ·  return vs yield",
    cols: [
      { title: "List", tone: "blue", items: ["Eager: everything computed now", "All items in memory", "Many passes, len(), indexing"] },
      { title: "Generator", tone: "green", items: ["Lazy: one item per next()", "Only the current state in memory", "One pass; no len(), no indexing"] },
      { title: "return / yield", tone: "amber", items: ["return: hand back one value and finish", "yield: hand back a value and pause", "return in a generator just stops it"] },
    ],
    beats: B(
      "A list is eager. Everything is computed up front and held in memory, and you can loop over it many times, take its length, or index into it.",
      "A generator is lazy. It produces one item per next, holding only its current state. But it's one pass, with no length and no indexing. Use a list for small data you'll reuse, and a generator for big or streaming data you'll pass over once.",
      { say: "And return versus yield. Return hands back one value, and the function is finished: its local variables are gone. Yield hands back a value and pauses, so the function can carry on later. A return inside a generator just ends it, with StopIteration.", tone: "key" },
    ),
  },

  // ---- Q29 (py63)
  q(29, 1, "What are async generators and async iterators?", "yield inside async def, async for, and streaming", "Question twenty nine. What are async generators and async iterators?", "The async version of everything we just did, and why AI code uses it constantly: streaming."),
  {
    kind: "code",
    title: "An async generator: yield inside async def",
    lang: "python",
    code: `async def stream_tokens(prompt):
    async with client.stream(prompt) as response:
        async for chunk in response:      # waits on the network
            yield chunk.text              # hands each piece on

async def main():
    async for token in stream_tokens("Explain GIL"):
        print(token, end="", flush=True)

# the protocol: __aiter__() returns an object whose
# async __anext__() raises StopAsyncIteration at the end`,
    highlight: [[1, 4], [6, 8], [10, 11]],
    beats: B(
      "An async generator is an async def function that uses yield. It produces values lazily, like any generator, but it can await between them. That's exactly the shape of streaming an LLM's answer: wait for the next chunk from the network, yield its text, and wait again.",
      "You consume it with async for, which awaits each next value. While it's waiting on the network, the event loop is free to serve other requests. This is what sits behind a streaming chat endpoint.",
      { say: "Underneath, it's the async version of the protocol: dunder aiter returns an async iterator, whose dunder anext is awaited for each value, and which raises StopAsyncIteration at the end.", tone: "key" },
    ),
  },

  // ---- Q30 (py27)
  q(30, null, "What does itertools provide?", "lazy building blocks in C that compose", "Question thirty. What does itertools provide?", "A handful of the useful ones, and why they're good: lazy, written in C, and they compose."),
  {
    kind: "code",
    title: "itertools: lazy building blocks",
    lang: "python",
    code: `from itertools import (count, islice, chain, groupby,
                       product, combinations, accumulate, batched)

islice(count(1), 5)              # 1 2 3 4 5 from an endless count
chain(list_a, list_b)            # one after the other, no copy
groupby(sorted(rows, key=k), k)  # group runs: sort first!
product("ab", repeat=2)          # aa ab ba bb
combinations([1, 2, 3], 2)       # (1,2) (1,3) (2,3)
accumulate([1, 2, 3])            # 1 3 6: running totals
batched(range(7), 3)             # (0,1,2) (3,4,5) (6,): 3.12+`,
    highlight: [[4, 5], [6, 6], [7, 10]],
    beats: B(
      "Itertools has fast, memory-efficient building blocks for iteration. Count counts forever, and islice takes a slice of any iterator, even an endless one. Chain joins iterables one after the other, without copying them.",
      "Groupby groups consecutive items with the same key. The trap: it only groups runs that are next to each other, so you sort by the same key first.",
      { say: "Product, combinations and permutations, for brute-force questions. Accumulate for running totals. And batched, new in three twelve, for chunks. They're written in C, and they return iterators, so they compose into pipelines without building lists in between.", tone: "key" },
    ),
  },
  check({
    topic: "generators",
    q: "def gen(): print('start'); yield 1. What does g = gen() print?",
    say: "A generator function prints start, then yields one. What does g equals gen, print?",
    options: ["start", "start, then 1", "Nothing", "1"],
    oSay: ["start", "start and then one", "nothing", "one"],
    answer: 2,
    a: "Nothing. Calling a generator function only creates the generator; the body runs on the first next(g).",
    aSay: "C. Nothing at all. Calling a generator function only creates the generator object. The body doesn't start until the first next, and then it prints start and yields one.",
  }),
  check({
    topic: "iterators",
    q: "pairs = zip(names, scores). You loop over pairs twice. What does the second loop do?",
    say: "Pairs equals zip of names and scores. You loop over pairs twice. What does the second loop do?",
    a: "Nothing: zip returns an iterator, used up by the first loop. Make a list if you need two passes.",
    aSay: "Nothing. Zip returns an iterator, not a list, and the first loop used it up. If you need two passes, wrap it in list.",
  }),
];
