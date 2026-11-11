import type { Scene } from "../../lib/types.ts";
import { analogy, asked, B, check, custom, sec } from "./h.ts";

// Part 2: *args/**kwargs and closures (the tools-in-a-loop bug), decorators
// (retry, timing, stacking, arguments), and generators.
export const p2: Scene[] = [
  // ------------------------------------------------------------ 3
  sec("3", "Functions: forwarding arguments, and closures", "Topic three. Functions. How to forward any arguments to an LLM client, and a closure bug that makes an agent call the wrong tool."),
  {
    kind: "code",
    title: "*args and **kwargs: pack, then unpack",
    lang: "python",
    code: `def call_model(prompt, *args, **kwargs):
    # args   -> a tuple of extra positional arguments
    # kwargs -> a dict of extra keyword arguments
    log(prompt, kwargs)
    return client.chat(prompt, *args, **kwargs)

call_model("Summarise this", temperature=0.2, max_tokens=300)
# kwargs == {"temperature": 0.2, "max_tokens": 300}`,
    highlight: [[1, 1], [2, 3], [5, 5], [7, 8]],
    beats: B(
      "Every LLM wrapper you'll ever write needs this. A function that takes a prompt, plus anything else the caller wants to pass through to the client.",
      "In the definition, star args packs extra positional arguments into a tuple, and double star kwargs packs extra keyword arguments into a dict. The names args and kwargs are only convention; the stars do the work.",
      { say: "In the call, the stars do the opposite. They unpack the tuple and the dict back into separate arguments. So the wrapper doesn't need to know every option the client supports.", tone: "key" },
      "Call it with temperature and max tokens, and inside, kwargs is a dict holding exactly those two. That's the whole trick, and it's the backbone of every decorator, which is topic four.",
    ),
  },
  {
    kind: "code",
    title: "The bug: every tool runs 'weather'",
    lang: "python",
    code: `tools = []
for name in ["search", "calculator", "weather"]:
    tools.append(lambda query: run_tool(name, query))

tools[0]("refund policy")   # expected "search"...
# runs run_tool("weather", "refund policy")`,
    highlight: [[1, 3], [3, 3], [5, 6]],
    beats: B(
      "Now the closure bug. An agent builds one small function per tool, in a loop: search, calculator, weather.",
      "Each lambda calls run tool with the loop variable name, and the user's query.",
      { say: "Then the agent picks the first tool, search, and calls it. And it runs weather. Every tool in the list runs weather. Why?", tone: "ask" },
    ),
  },
  {
    kind: "trap",
    myth: "The lambda remembers the value name had when the lambda was made.",
    truth: "It remembers the variable, and looks its value up when the lambda runs: after the loop, name is 'weather'.",
    why: "That's late binding. Fix: bind it now as a default, lambda query, name=name: ..., or use functools.partial(run_tool, name).",
    beats: B(
      "Here's the wrong belief.",
      { say: "A closure remembers the variable, not its value. The value is looked up when the function runs. By then the loop is over, and name holds its last value, weather.", tone: "key", term: { word: "Late binding", meaning: "a closure looks a variable up when it runs, not when it's made" } },
      "The fix: bind the value now. Give the lambda a default argument, name equals name, which is evaluated when the lambda is created. Or use functools dot partial with the tool name.",
    ),
  },
  {
    kind: "bullets",
    title: "Where Python looks a name up: LEGB",
    firstItemStep: 1,
    items: [
      { icon: "L", text: "Local: inside the current function" },
      { icon: "E", text: "Enclosing: the function(s) around it", sub: "this is where closures find their variables" },
      { icon: "G", text: "Global: the module's top level" },
      { icon: "B", text: "Built-in: len, print, dict…" },
    ],
    beats: B(
      "Why does the lambda find name at all? Because of the lookup order, called LEGB.",
      "Python looks in the local scope first, inside the current function.",
      { say: "Then the enclosing functions around it. That's where a closure finds its variables. It keeps a reference to that scope's variable, which is exactly why it sees the variable's latest value.", tone: "key", term: { word: "Closure", meaning: "a function plus the variables it uses from the scope around it" } },
      "Then the module's globals.",
      "Then the built-ins. To assign to an enclosing variable instead of making a new local, you declare it nonlocal, and global for a module variable.",
    ),
  },
  check({
    topic: "closures",
    q: "fs = [lambda: i for i in range(3)]. What does [f() for f in fs] give?",
    say: "F s is a list of lambdas, lambda returning i, for i in range three. What do you get if you call each of them?",
    options: ["[0, 1, 2]", "[2, 2, 2]", "[3, 3, 3]", "NameError"],
    oSay: ["zero, one, two", "two, two, two", "three, three, three", "a name error"],
    answer: 1,
    a: "[2, 2, 2]. Every lambda looks i up when it's called, and by then the comprehension's i ended at 2.",
    aSay: "B. Two, two, two. Each lambda looks up i when it's called, and by then the loop has finished with i equal to two. It's the same late binding as the tools bug.",
  }),

  // ------------------------------------------------------------ 4
  sec("4", "Decorators", "Topic four. Decorators. The single most asked Python question in those write-ups. We'll build the one GenAI teams write first: a retry around a flaky model call."),
  asked(
    "Write a decorator that retries a flaky LLM call.",
    "what a decorator is · *args/**kwargs · functools.wraps · arguments · backoff · which errors to retry",
    "The question usually comes in this form.",
    { say: "Write a decorator that retries a flaky LLM call.", tone: "ask" },
    "To answer it well you need: what a decorator really is, why wraps matters, how a decorator takes arguments, and which errors are worth retrying at all. Let's build it up.",
  ),
  custom(
    "analogy",
    {
      title: "A decorator is gift wrapping",
      a: "Wrapping a gift",
      b: "Python",
      rows: [
        { icon: "🎁", a: "The gift itself", b: "call_llm, the original function" },
        { icon: "🧻", a: "The wrapping paper", b: "wrapper(*args, **kwargs)" },
        { icon: "🏷️", a: "Writing @retry above def", b: "call_llm = retry(call_llm)" },
        { icon: "📦", a: "Whoever opens it touches the paper first", b: "every call runs wrapper, which calls the original" },
      ],
      footer: "A decorator takes a function and returns a new function that wraps it.",
    },
    B(
      "Here's the picture to hold on to. A decorator is gift wrapping.",
      "The gift is your original function, call LLM.",
      "The wrapping paper is a new function, usually called wrapper, that takes any arguments with star args and double star kwargs.",
      { say: "Writing at retry above the def is only shorthand. It means: call LLM equals retry of call LLM. The name now points at the wrapped version.", tone: "key" },
      "So whoever calls it touches the wrapper first. The wrapper can do something before, call the original, and do something after.",
      { say: "In one sentence: a decorator takes a function and returns a new function that wraps it.", tone: "key", term: { word: "Decorator", meaning: "a callable that takes a function and returns a wrapped one" } },
    ),
  ),
  {
    kind: "code",
    title: "The simplest useful decorator: a timer",
    lang: "python",
    code: `import functools, time

def timed(fn):
    @functools.wraps(fn)                 # keep fn's name, docstring, signature
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        try:
            return fn(*args, **kwargs)
        finally:
            log(f"{fn.__name__} took {time.perf_counter() - start:.2f}s")
    return wrapper

@timed
def call_llm(prompt): ...`,
    highlight: [[3, 3], [5, 5], [6, 8], [9, 10], [11, 11], [4, 4], [13, 14]],
    beats: B(
      "Let's write the simplest useful one: a timer for model calls.",
      "The decorator is a function that takes a function, fn.",
      "Inside, it defines wrapper, which accepts any arguments, so it can wrap any function.",
      "Wrapper notes the time, then calls the original with the same arguments, and returns its result.",
      "In a finally block it logs how long it took. Finally means we log even when the call raises.",
      "Then the decorator returns wrapper. Not calls it. Returns it.",
      { say: "And this line, functools dot wraps, copies the original's name, docstring and signature onto the wrapper. Without it, every decorated function calls itself wrapper in your logs and stack traces, and tools that read signatures, like FastAPI, see the wrong parameters.", tone: "key" },
      "Put at timed above call LLM, and every call is timed, without touching the function's own code.",
    ),
  },
  custom(
    "pyonion",
    {
      title: "Stacked decorators: the order matters",
      sub: "@timed · @retry(times=3) · @cache, written above def call_llm",
      core: "call_llm()",
      layers: [
        { name: "cache", does: "the one nearest def wraps first: returns a saved answer if it has one", tone: "green" },
        { name: "retry(times=3)", does: "on a transient error, waits and calls the inside again", tone: "amber" },
        { name: "timed", does: "the outermost: runs first, measures everything inside", tone: "blue" },
      ],
      call: "call → timed → retry → cache → call_llm",
      back: "← the result goes back out the same way",
    },
    B(
      "Now stack three of them, which is what real code looks like: timed, then retry three times, then cache, written above call LLM.",
      "Decorators apply from the bottom up. The one nearest the def wraps the function first. Cache is the innermost layer: if it has a saved answer, it returns it without calling the model.",
      "Retry wraps that. On a transient error, it waits and calls the inside again.",
      { say: "Timed wraps everything, so it's the outermost. Applied last, but it runs first.", tone: "key" },
      "So a call goes in through timed, then retry, then cache, reaches the real function, and the result comes back out the same way. Which means timed measures all the retry attempts together, not one.",
    ),
  ),
  {
    kind: "code",
    title: "A decorator with arguments: three levels",
    lang: "python",
    code: `def retry(times=3, base=0.5, on=(RateLimitError, TimeoutError)):
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            for attempt in range(times):
                try:
                    return fn(*args, **kwargs)
                except on:                       # only transient errors
                    if attempt == times - 1:
                        raise
                    time.sleep(base * 2 ** attempt + random.random() * 0.1)
        return wrapper
    return decorator

@retry(times=4)          # retry(times=4) runs first, returns decorator
def call_llm(prompt): ...`,
    highlight: [[1, 1], [2, 2], [4, 7], [8, 8], [9, 10], [11, 11], [15, 16]],
    beats: B(
      "Now the actual interview answer. A retry decorator that takes arguments needs three levels. The outer function takes the settings: how many times, the base delay, and which exceptions count as transient.",
      "It returns the real decorator, which takes the function.",
      "Which defines the wrapper, which tries the call in a loop.",
      { say: "And notice what it catches. Only the transient errors: rate limits and timeouts. A bad request, or an invalid API key, will fail the same way every time, so retrying it just wastes money and time.", tone: "key" },
      "On the last attempt it re-raises, so the caller sees the real error instead of a silent None.",
      { say: "Between attempts, exponential backoff: the base delay times two to the attempt number, so half a second, one, two. Plus a little random jitter, so a thousand clients that failed together don't all retry in the same millisecond.", tone: "key", term: { word: "Exponential backoff", meaning: "wait longer after each failure: 0.5s, 1s, 2s… plus jitter" } },
      "At retry with times four: that call runs first and returns the decorator, which then wraps call LLM. That's why there are three levels.",
    ),
  },
  check({
    topic: "decorators",
    q: "@timed is written above @retry(times=3). The model fails twice, then succeeds. What does timed report?",
    say: "At timed is written above at retry with times three. The model fails twice, then succeeds. What does timed report?",
    options: ["Only the successful attempt", "All three attempts plus the waits", "Nothing: retry swallows it", "The first failed attempt"],
    oSay: ["only the successful attempt", "all three attempts plus the waits between them", "nothing, retry swallows it", "the first failed attempt"],
    answer: 1,
    a: "All three attempts plus the backoff waits. timed is the outer layer, so retry (with all its attempts) runs inside it.",
    aSay: "B. All three attempts plus the backoff waits. Timed is the outer layer, so everything retry does, every attempt and every sleep, happens inside timed's measurement. If you wanted per attempt timing, you'd put timed below retry.",
  }),
  {
    kind: "bullets",
    title: "Two follow-ups interviewers add",
    firstItemStep: 1,
    items: [
      { icon: "🔁", text: "On a recursive function, every recursive call goes through the decorator", sub: "inside fib, the name fib now means the decorated version: a logger logs every level" },
      { icon: "🧰", text: "Decorators you use daily: @functools.cache, @lru_cache, @property, @classmethod, @app.get", sub: "FastAPI routes are decorators that register your function" },
    ],
    beats: B(
      "Two follow-ups interviewers like to add.",
      { say: "First: what happens if you put a logging decorator on a recursive function? Every recursive call is logged, because inside the function, its own name now refers to the decorated version. A Nutanix interview asked exactly this.", tone: "key" },
      "Second: name decorators you use. functools cache and lru cache, property, classmethod, and in FastAPI, app dot get, which is a decorator that registers your function as a route.",
    ),
  },
  {
    kind: "sayit",
    q: "What is a decorator, and how would you write one for retries?",
    lines: [
      "A decorator is a callable that takes a function and returns a wrapped one; @d is f = d(f).",
      "The wrapper takes *args, **kwargs, does work around the call, returns the result.",
      "functools.wraps keeps the name, docstring and signature.",
      "With arguments it's three levels: retry(times) returns the decorator.",
      "For LLM calls: retry only transient errors, with exponential backoff and jitter, then re-raise.",
    ],
    beats: B(
      { say: "Say it with me. What is a decorator, and how would you write one for retries?", tone: "ask" },
      "A decorator is a callable that takes a function and returns a wrapped one. The at syntax just means f equals d of f.",
      "The wrapper takes star args and double star kwargs, does work around the call, and returns the result.",
      "functools dot wraps keeps the original's name, docstring and signature.",
      "With arguments, it's three levels: retry of times returns the decorator, which returns the wrapper.",
      { say: "For LLM calls, I'd retry only transient errors, rate limits and timeouts, with exponential backoff and jitter, and re-raise after the last attempt.", tone: "key" },
    ),
  },

  // ------------------------------------------------------------ 5
  sec("5", "Generators: one item at a time", "Topic five. Generators and yield. Sixteen write-ups asked about them, and in GenAI they're everywhere: reading huge corpora, batching for embeddings, and streaming tokens."),
  asked(
    "You need embeddings for 2 million chunks in a 40 GB JSONL file. How do you read it?",
    "not into a list · a generator · batches · constant memory",
    "Here's the GenAI version of the generator question.",
    { say: "You need embeddings for two million chunks, stored in a forty gigabyte J S O N lines file. How do you read it?", tone: "ask" },
    "The answer they want: not into a list. With a generator, in batches, in constant memory. Let's see why.",
  ),
  custom(
    "pymem",
    {
      title: "A list vs a generator, same 2 million chunks",
      n: "2,000,000",
      left: "List: read everything, then start",
      right: "Generator: one chunk at a time",
      leftCode: "chunks = [json.loads(l) for l in f]",
      rightCode: "chunks = (json.loads(l) for l in f)",
      leftMem: "all 2,000,000 in memory before the first embedding",
      rightMem: "one chunk in memory at a time",
      note: "Same loop body, same result. One holds everything, the other holds one item.",
    },
    B(
      "Two ways to write it, and they look almost the same. On the left, a list comprehension. On the right, the same expression with round brackets: a generator.",
      "The list reads every line and parses all two million chunks before the first one is used. Memory climbs the whole time, and with forty gigabytes, the process dies before it starts working.",
      { say: "The generator produces one chunk, hands it over, and waits. The next chunk is only read when someone asks for it. Memory stays flat, no matter how big the file is.", tone: "key", term: { word: "Generator", meaning: "a lazy iterator: produces each value only when asked" } },
      "Same loop body, same final result. One holds everything at once; the other holds one item.",
    ),
  ),
  {
    kind: "code",
    title: "A generator pipeline for embeddings",
    lang: "python",
    code: `def read_chunks(path):
    with open(path) as f:
        for line in f:                 # files are lazy too
            yield json.loads(line)     # pause here, hand one over

def batched(items, size):
    batch = []
    for item in items:
        batch.append(item)
        if len(batch) == size:
            yield batch
            batch = []
    if batch:
        yield batch

for batch in batched(read_chunks("corpus.jsonl"), 256):
    store(embed([c["text"] for c in batch]))     # 256 per API call`,
    highlight: [[1, 4], [4, 4], [6, 14], [16, 17]],
    beats: B(
      "Here's the real pipeline. A function with yield in it is a generator function. Calling it doesn't run it; it returns a generator object.",
      { say: "Each time the loop asks for the next item, the function runs until the next yield, hands that value over, and pauses right there, with all its local variables kept. The next request resumes from the same line.", tone: "key" },
      "A second generator groups items into batches of a size. It pulls from the first one lazily, and yields a list of two hundred and fifty six at a time. In Python three twelve, itertools dot batched does this for you.",
      { say: "And the loop at the bottom pulls batches through the whole pipeline and sends each one to the embedding API. At any moment, memory holds one batch, not two million chunks.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "Iterator, iterable, generator",
    firstItemStep: 1,
    items: [
      { icon: "📚", text: "Iterable: something you can loop over", sub: "has __iter__: list, dict, file, range" },
      { icon: "👉", text: "Iterator: the cursor doing the looping", sub: "has __next__; raises StopIteration when it runs out" },
      { icon: "⚙️", text: "A for loop is iter() once, then next() until StopIteration" },
      { icon: "🌱", text: "A generator is an iterator written as a function with yield", sub: "Python writes __iter__ and __next__ for you" },
    ],
    beats: B(
      "The vocabulary interviewers check, because it's easy to mix up.",
      "An iterable is anything you can loop over: a list, a dict, a file, a range. It has a dunder iter method.",
      "An iterator is the cursor that does the looping. It has a dunder next method, and raises StopIteration when it runs out.",
      "A for loop calls iter once, to get an iterator, then calls next until StopIteration. That's all a for loop is.",
      { say: "And a generator is simply an iterator you write as a function with yield. Python writes the dunder iter and dunder next for you.", tone: "key" },
    ),
  },
  {
    kind: "trap",
    myth: "You can loop over a generator as many times as you like.",
    truth: "A generator is exhausted after one pass. The second loop gets nothing, silently.",
    why: "If you need the items twice, keep a list, or call the generator function again for a fresh generator.",
    beats: B(
      "And the bug that comes with them.",
      { say: "A generator can be consumed once. After the first full loop it's exhausted, and a second loop simply gets nothing. No error. Just an empty result.", tone: "key" },
      "Classic case: you count the chunks with one loop, then try to embed them with a second. The second does nothing. If you need the items twice, keep a list, or call the generator function again.",
    ),
  },
  {
    kind: "compare",
    title: "yield vs return",
    cols: [
      { title: "return", icon: "🛑", tone: "red", items: ["ends the function", "one value, once", "local state is gone"] },
      { title: "yield", icon: "⏸️", tone: "green", items: ["pauses the function", "many values, one per request", "state kept until the next one"] },
    ],
    footer: "Streaming tokens from an LLM is the same idea: async for token in stream pulls one token at a time.",
    beats: B(
      "So the short comparison. Return ends the function. It sends one value, once, and the function's local state is gone.",
      "Yield pauses it. It sends many values, one per request, and keeps the state between them.",
      { say: "And streaming tokens from an LLM is the same idea, made async: async for token in stream pulls one token at a time as the model produces it. We'll serve exactly that from FastAPI in the next lecture.", tone: "key" },
    ),
  },
  check({
    topic: "generators",
    q: "sum(x * x for x in range(10**8)) vs sum([x * x for x in range(10**8)]): which one can run on a laptop, and why?",
    say: "Sum of x squared for x in range ten to the eight, written with round brackets, versus with square brackets inside sum. Which can run on a laptop, and why?",
    a: "The round-bracket one: a generator expression feeds sum one value at a time, constant memory. The square-bracket one builds a 100-million-item list first: gigabytes.",
    aSay: "The one with round brackets. It's a generator expression, so sum receives one value at a time and memory stays constant. The square bracket version builds a list of a hundred million integers first, which is several gigabytes, before sum adds anything.",
  }),
  {
    kind: "sayit",
    q: "What is a generator, and when would you use one?",
    lines: [
      "A function with yield returns a generator: a lazy iterator.",
      "Each next() runs it to the next yield and pauses, keeping its local state.",
      "Values are produced on demand, so memory stays constant however big the input.",
      "I use them for large files, batching for embedding APIs, and pipelines of lazy steps.",
      "One pass only; async generators do the same for streams like LLM tokens.",
    ],
    beats: B(
      { say: "Model answer. What is a generator, and when would you use one?", tone: "ask" },
      "A function containing yield returns a generator, which is a lazy iterator.",
      "Each call to next runs it to the next yield, hands over that value, and pauses with its local state kept.",
      "Values are produced on demand, so memory stays constant however big the input is.",
      "I use them for large files, for batching inputs to an embedding API, and for pipelines of lazy steps.",
      { say: "They can be consumed only once. And async generators do the same thing for streams, like tokens coming from an LLM.", tone: "key" },
    ),
  },
];
