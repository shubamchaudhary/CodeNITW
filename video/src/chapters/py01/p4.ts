import type { Scene } from "../../lib/types.ts";
import { B, check, custom, q, sec } from "./h.ts";

// Part 4: module 7 (concurrency: the GIL, threads, processes, asyncio) and
// module 8 (memory, modules and tooling).
export const p4: Scene[] = [
  // ================================================================ module 7
  sec("7", "Concurrency: GIL, threads, processes and asyncio", "Module seven. Concurrency. The GIL, threads, processes and asyncio. Threads versus processes versus asyncio was asked in thirteen write-ups, and for GenAI roles it matters even more, because AI services spend most of their time waiting on models."),
  custom(
    "pylanes",
    {
      title: "The idea: waiting and working are different problems",
      sub: "three calls that each wait 1 s on the network",
      max: 3.4,
      rows: [
        { label: "one after another", step: 0, bars: [{ s: 0, e: 1, kind: "wait", text: "call 1" }, { s: 1, e: 2, kind: "wait", text: "call 2" }, { s: 2, e: 3, kind: "wait", text: "call 3" }], done: "3 s" },
        { label: "call 1", step: 1, bars: [{ s: 0, e: 1, kind: "wait" }] },
        { label: "call 2", step: 1, bars: [{ s: 0.05, e: 1.05, kind: "wait" }] },
        { label: "call 3", step: 1, bars: [{ s: 0.1, e: 1.1, kind: "wait" }], done: "≈ 1 s" },
      ],
      note: { step: 2, text: "Waiting overlaps for free (threads, asyncio). Working in parallel needs more cores (processes).", tone: "amber" },
    },
    B(
      "Here's the idea that sorts out this whole module. Three calls to a model API, each waiting one second on the network. One after another, that's three seconds, and the CPU is idle almost the whole time.",
      "Start all three, and let them wait at the same time, and it's about one second. Overlapping the waiting is called concurrency.",
      { say: "So there are two different problems. Waiting, on networks, disks, databases and models, which overlaps cheaply. And working, actual computation on the CPU, which only goes faster with more cores working in parallel. Threads and asyncio solve the first. Processes solve the second.", tone: "key" },
    ),
  ),

  // ---- Q46 (py43)
  q(46, 5, "What is the GIL?", "what it is, why it exists, when it's released, and where it's going", "Question forty six, asked in five write-ups. What is the GIL?", "What it is, why it exists, when it's released, and what's changing."),
  custom(
    "pylanes",
    {
      title: "The GIL: one thread runs Python bytecode at a time",
      sub: "two threads, CPU-heavy work",
      max: 4,
      legend: false,
      rows: [
        { label: "thread 1", step: 0, bars: [{ s: 0, e: 0.5, kind: "run" }, { s: 0.5, e: 1, kind: "frozen" }, { s: 1, e: 1.5, kind: "run" }, { s: 1.5, e: 2, kind: "frozen" }, { s: 2, e: 2.5, kind: "run" }, { s: 2.5, e: 3, kind: "frozen" }, { s: 3, e: 3.5, kind: "run" }] },
        { label: "thread 2", step: 0, bars: [{ s: 0, e: 0.5, kind: "frozen" }, { s: 0.5, e: 1, kind: "run" }, { s: 1, e: 1.5, kind: "frozen" }, { s: 1.5, e: 2, kind: "run" }, { s: 2, e: 2.5, kind: "frozen" }, { s: 2.5, e: 3, kind: "run" }, { s: 3, e: 3.5, kind: "frozen" }, { s: 3.5, e: 4, kind: "run" }], done: "no faster" },
      ],
      note: { step: 1, text: "Released while a thread waits on I/O, and inside C code like NumPy, so I/O-bound threads still overlap", tone: "amber" },
    },
    B(
      "The GIL, the global interpreter lock, is a lock inside CPython that lets only one thread execute Python bytecode at a time. Two threads doing heavy computation just take turns holding it, so together they're no faster than one. Sometimes slower.",
      { say: "But it's released whenever a thread waits on I/O, like a network call or a file read, and inside many C extensions, like NumPy. So threads still help a lot for I/O-bound work. They just don't give you parallel Python computation.", tone: "key" },
    ),
  ),
  {
    kind: "sayit",
    q: "What is the GIL?",
    lines: [
      "A lock in CPython: one thread executes Python bytecode at a time.",
      "It exists because reference counting isn't thread-safe; one lock is simple and fast for single-threaded code.",
      "It's released during I/O and in many C extensions, so I/O-bound threads overlap fine.",
      "CPU-bound work needs processes (or C extensions) to use several cores.",
      "Python 3.13 added an optional free-threaded build without the GIL (PEP 703).",
    ],
    beats: B(
      { say: "And the full answer.", tone: "ask" },
      "The GIL is a lock in CPython that lets only one thread execute Python bytecode at a time.",
      "It exists because CPython's reference counting isn't thread-safe. One big lock was the simple solution, and it keeps single-threaded code fast.",
      "It's released during I/O and inside many C extensions, so I/O-bound threads overlap just fine.",
      "For CPU-bound work, you use processes, or C extensions, to get real parallelism across cores.",
      { say: "And it's changing. Python three thirteen added an optional free-threaded build without the GIL, from PEP seven oh three, though it isn't the default yet.", tone: "key" },
    ),
  },

  // ---- Q47 (py44)
  q(47, 13, "When do you use threading vs multiprocessing vs asyncio?", "the kind of work decides: waiting or computing, and how much", "Question forty seven, asked in thirteen write-ups. When do you use threading, versus multiprocessing, versus asyncio?", "The kind of work decides. Is it waiting or computing, and how many things at once?"),
  {
    kind: "compare",
    title: "Pick by the kind of work",
    cols: [
      { title: "threading", icon: "🧵", tone: "blue", items: ["I/O-bound, moderate concurrency", "Works with blocking libraries", "Shared memory: needs locks", "Tens to hundreds of threads"] },
      { title: "asyncio", icon: "🔁", tone: "green", items: ["I/O-bound, high concurrency", "One thread, an event loop", "Needs async libraries (httpx, asyncpg)", "Thousands of connections"] },
      { title: "multiprocessing", icon: "🏭", tone: "amber", items: ["CPU-bound work", "Separate processes, each with its own GIL", "Real parallelism on all cores", "Data is pickled between them"] },
    ],
    footer: "Waiting on many things → asyncio · waiting with blocking libraries → threads · computing → processes",
    beats: B(
      "Threading, for I/O-bound work at moderate concurrency, and especially when the libraries you need are blocking ones. Threads share memory, which is convenient, and dangerous, so you need locks. And each thread costs real memory, so tens or hundreds, not tens of thousands.",
      "Asyncio, for I/O-bound work at high concurrency. One thread, running an event loop, can juggle thousands of connections, because a waiting task costs almost nothing. But it needs async libraries all the way down: httpx instead of requests, asyncpg instead of a blocking driver.",
      "Multiprocessing, for CPU-bound work. Separate processes, each with its own interpreter and its own GIL, so they really do run in parallel on all your cores. The cost: they don't share memory, so data is pickled and copied between them.",
      { say: "So the rule. Waiting on many things: asyncio. Waiting, with blocking libraries: threads. Computing: processes. In a GenAI service, calling a model a thousand times is asyncio. Parsing PDFs or running a local embedding model on the CPU is processes.", tone: "key" },
    ),
  },
  {
    kind: "sayit",
    q: "Threading vs multiprocessing vs asyncio?",
    lines: [
      "First I ask: is the work waiting on I/O, or using the CPU?",
      "CPU-bound: multiprocessing (ProcessPoolExecutor), because the GIL stops threads computing in parallel.",
      "I/O-bound with many connections: asyncio, one thread and an event loop.",
      "I/O-bound with blocking libraries: threads (ThreadPoolExecutor).",
      "Mixed: an async service that sends CPU work to a process pool or a worker queue.",
    ],
    beats: B(
      { say: "Here's the answer to say.", tone: "ask" },
      "First I ask what kind of work it is: is it waiting on I/O, or using the CPU?",
      "If it's CPU-bound, I use multiprocessing, usually a process pool executor, because the GIL stops threads computing in parallel.",
      "If it's I/O-bound with many concurrent connections, like calling an LLM API for thousands of requests, I use asyncio: one thread and an event loop.",
      "If it's I/O-bound but the library only has a blocking API, I use a thread pool.",
      { say: "And for mixed work, which is most real services, an async web server that hands CPU-heavy jobs to a process pool, or to a queue with separate workers.", tone: "key" },
    ),
  },

  // ---- Q48 (py45)
  q(48, null, "How do you make threaded code thread-safe in Python?", "the GIL doesn't make your code safe; locks, queues, and not sharing", "Question forty eight. How do you make threaded code thread-safe in Python?", "Start by killing the myth that the GIL makes your code safe, then give the tools."),
  {
    kind: "code",
    title: "count += 1 is three steps, and a thread can switch between them",
    lang: "python",
    code: `count = 0
def work():
    global count
    for _ in range(100_000):
        count += 1        # read, add, write: not atomic

# two threads → often less than 200,000

lock = threading.Lock()
def work():
    global count
    for _ in range(100_000):
        with lock:        # one thread at a time in here
            count += 1`,
    highlight: [[1, 7], [9, 14]],
    beats: B(
      "The myth: the GIL makes my code thread-safe. It doesn't. The GIL protects the interpreter's own internals, not your logic. Count plus equals one is really three steps: read count, add one, write it back. A thread can be switched out between them, two threads read the same old value, and an update is lost.",
      { say: "The tools. A lock around the critical section, used with with, so it's always released. Better still, don't share: pass work through a queue dot Queue, which is thread-safe, or give each thread its own data and combine at the end. And immutable data is always safe to share.", tone: "key" },
    ),
  },

  // ---- Q49 (py46)
  q(49, 3, "How does asyncio work (event loop, coroutines, await)?", "coroutines, the loop, and what await gives up", "Question forty nine, asked in three write-ups. How does asyncio work? The event loop, coroutines, and await.", "What a coroutine is, what the event loop does, and what happens at an await."),
  custom(
    "pyloop",
    {
      title: "The event loop runs one task until it awaits",
      sub: "three tasks, each calling a model",
      steps: [
        { running: "task A", ready: ["task B", "task C"], waiting: [], note: "the loop picks a ready task and runs it" },
        { running: "task B", ready: ["task C"], waiting: ["A: await llm()"], note: "A reaches await: it parks on its network call and hands control back" },
        { running: "task C", ready: [], waiting: ["A: await llm()", "B: await llm()"] },
        { running: undefined, ready: [], waiting: ["A: await llm()", "B: await llm()", "C: await llm()"], note: "all three requests are in flight at once, on one thread" },
        { running: "task A", ready: ["task B"], waiting: ["C: await llm()"], note: "a reply arrives: that task becomes ready and resumes after its await" },
        { running: undefined, ready: [], waiting: [], done: ["task A", "task B", "task C"], note: "total time ≈ the slowest call, not the sum" },
      ],
    },
    B(
      "Asyncio runs on one thread, with an event loop. The loop keeps a queue of tasks that are ready to run, and it runs one of them. Task A.",
      "A runs until it reaches an await on something slow, like a call to the model. At that point, A gives control back to the loop, and parks, waiting for its network reply. The loop picks the next ready task, B.",
      "B also reaches its await, and parks. Then C runs.",
      "Now all three requests are in flight at the same time, and the loop is idle, waiting for the operating system to say a reply has arrived. One thread, three calls in progress.",
      "When A's reply comes in, A becomes ready again, and resumes exactly after its await.",
      { say: "So the total time is about the slowest call, not the sum of all of them. The key words: a coroutine is a function defined with async def. Calling it creates a coroutine object, without running it. Await pauses the coroutine and hands control to the loop. And it's cooperative: a task only gives up control at an await.", tone: "key" },
    ),
  ),
  {
    kind: "sayit",
    q: "How does asyncio work?",
    lines: [
      "One thread runs an event loop that schedules tasks.",
      "async def defines a coroutine; calling it makes a coroutine object, awaiting it runs it.",
      "At await, the coroutine pauses and the loop runs another ready task.",
      "When the I/O completes, the waiting task resumes right after its await.",
      "Cooperative: a task that never awaits, or blocks, freezes everything.",
    ],
    beats: B(
      { say: "Out loud.", tone: "ask" },
      "Asyncio runs an event loop on a single thread, and the loop schedules tasks.",
      "Async def defines a coroutine function. Calling it returns a coroutine object, and awaiting it, or wrapping it in a task, is what runs it.",
      "At each await, the coroutine pauses, and the loop runs another task that's ready.",
      "When the I/O it was waiting on completes, the task becomes ready, and resumes right after its await.",
      { say: "It's cooperative multitasking. So a task that does heavy computation, or calls a blocking function, without awaiting, freezes every other task on the loop.", tone: "key" },
    ),
  },

  // ---- Q50 (py47)
  q(50, null, "What is the difference between awaiting coroutines directly, gather, create_task and TaskGroup?", "sequential versus concurrent, and who cleans up on failure", "Question fifty. What's the difference between awaiting coroutines directly, gather, create task, and TaskGroup?", "Which of these actually run at the same time, and what happens when one of them fails."),
  {
    kind: "code",
    title: "Only tasks run concurrently",
    lang: "python",
    code: `a = await fetch(1)            # one after another:
b = await fetch(2)            # 2 calls = 2× the time

a, b = await asyncio.gather(fetch(1), fetch(2))   # together

t = asyncio.create_task(fetch(1))   # starts now, in the background
...                                 # do other work
a = await t

async with asyncio.TaskGroup() as tg:     # 3.11+: structured
    ta = tg.create_task(fetch(1))
    tb = tg.create_task(fetch(2))
# here both are done; if one failed, the other was cancelled`,
    highlight: [[1, 2], [4, 4], [6, 8], [10, 13]],
    beats: B(
      "Awaiting coroutines one after another runs them one after another. The second fetch doesn't start until the first is finished. This is the most common async mistake: code that looks async, and runs sequentially.",
      "Gather schedules them all as tasks, runs them concurrently, and returns the results in the order you passed them. By default, if one raises, gather raises, but the others keep running.",
      "Create task starts a coroutine in the background, right now, and gives you a handle to await later. Keep a reference to it, or it can be garbage collected.",
      { say: "And TaskGroup, from Python three eleven, is the structured way. Every task created in the block is awaited when the block ends, and if one fails, the others are cancelled, and the errors are raised together. For new code, TaskGroup is the one to reach for.", tone: "key" },
    ),
  },

  // ---- Q51 (py48)
  q(51, null, "How do you limit concurrency in asyncio, and how do you call blocking code from async code?", "a semaphore, and to_thread for blocking calls", "Question fifty one. How do you limit concurrency in asyncio, and how do you call blocking code from async code?", "Two tools: one to stay under a rate limit, one to keep the loop free."),
  custom(
    "pyloop",
    {
      title: "One blocking call freezes the whole loop",
      sub: "time.sleep(), requests.get(), a sync SDK, heavy CPU",
      steps: [
        { running: "A: requests.get()", ready: ["task B", "task C", "health check"], waiting: [], blocked: true, note: "a blocking call never awaits, so the loop can't switch: everything else waits" },
        { running: "task B", ready: ["task C", "health check"], waiting: ["A: await to_thread(…)"], note: "await asyncio.to_thread(fn): the blocking call runs in a thread, the loop stays free" },
      ],
    },
    B(
      "First, blocking code. If a task calls something blocking, like time dot sleep, requests dot get, a synchronous SDK, or heavy computation, it never awaits, so the loop can't switch. Every other task, even a health check, is stuck until it returns.",
      { say: "The fix: await asyncio dot to thread, passing the blocking function. It runs in a worker thread, and the task awaits it, so the loop stays free. For CPU-heavy work, use run in executor with a process pool. Better still, use an async library in the first place.", tone: "key" },
    ),
  ),
  {
    kind: "code",
    title: "A semaphore: at most N calls in flight",
    lang: "python",
    code: `sem = asyncio.Semaphore(10)        # at most 10 at once

async def ask(q):
    async with sem:                # wait here if 10 are running
        return await llm.complete(q)

async def ask_all(questions):
    async with asyncio.TaskGroup() as tg:
        tasks = [tg.create_task(ask(q)) for q in questions]
    return [t.result() for t in tasks]`,
    highlight: [[1, 1], [3, 5], [7, 10]],
    beats: B(
      "Second, limiting concurrency. Fire off a thousand tasks with gather, and you send a thousand requests at once, and the provider rate-limits you. A semaphore is a counter of free slots. Here, ten.",
      "Each call does async with the semaphore. If ten are already running, it waits for a slot, without blocking the loop.",
      { say: "So you can start a task for every question, and still never have more than ten calls in flight. Semaphore plus TaskGroup is the pattern for calling a model API at scale.", tone: "key" },
    ),
  },
  check({
    topic: "concurrency",
    q: "You must resize 50,000 images on an 8-core machine. threads, asyncio or processes?",
    say: "You must resize fifty thousand images on an eight core machine. Threads, asyncio, or processes?",
    options: ["Threads", "asyncio", "Processes", "It doesn't matter"],
    oSay: ["threads", "asyncio", "processes", "it doesn't matter"],
    answer: 2,
    a: "Processes. Resizing is CPU-bound; the GIL lets only one thread compute Python at a time, so a ProcessPoolExecutor uses all 8 cores.",
    aSay: "C. Processes. Resizing images is CPU work, and the GIL lets only one thread run Python at a time. A process pool gives each core its own interpreter, so all eight work in parallel.",
  }),
  check({
    topic: "asyncio",
    q: "for q in questions: answers.append(await ask(q)). Are the calls concurrent?",
    say: "For each question, you append await ask of q. Are the calls concurrent?",
    a: "No: each await finishes before the next call starts. Create tasks (TaskGroup or gather) to run them together.",
    aSay: "No. Each await finishes before the loop moves to the next question, so they run one by one. Create tasks, with a TaskGroup or gather, to run them together, with a semaphore to cap them.",
  }),

  // ================================================================ module 8
  sec("8", "Memory, modules and tooling", "Module eight. Memory, modules and tooling. Memory and garbage collection was asked in ten write-ups, and it all starts from one number every object carries."),
  custom(
    "pynames",
    {
      title: "The idea: every object counts its references",
      steps: [
        { tags: [{ name: "a", to: "O" }], objs: [{ id: "O", text: "{…} a big dict", sub: "refcount = 1" }] },
        { tags: [{ name: "a", to: "O" }, { name: "b = a", to: "O", tone: "amber" }, { name: "cache[k] = a", to: "O", tone: "cyan" }], objs: [{ id: "O", text: "{…} a big dict", sub: "refcount = 3" }] },
        { tags: [{ name: "a  (del a)", to: "" }, { name: "b = None", to: "" }, { name: "cache[k] = a", to: "O", tone: "cyan" }], objs: [{ id: "O", text: "{…} a big dict", sub: "refcount = 1: still alive" }], note: "the cache still holds it, so it can't be freed" },
        { tags: [{ name: "a  (del a)", to: "" }, { name: "b = None", to: "" }, { name: "cache.clear()", to: "" }], objs: [{ id: "O", text: "{…} a big dict", sub: "refcount = 0", gone: true }], note: "the count hits zero: freed immediately" },
      ],
    },
    B(
      "Here's the idea. Every object in CPython carries a count of how many references point at it. A equals a big dict: count one.",
      "B equals a, and storing it in a cache: count three.",
      "Delete a, and set b to None. The count drops to one. But the cache still holds it, so it stays alive.",
      { say: "Clear the cache, the count hits zero, and the object is freed at that exact moment. That's reference counting, and it's how CPython frees most memory: immediately, and predictably.", tone: "key" },
    ),
  ),

  // ---- Q52 (py49)
  q(52, 10, "How does memory management and garbage collection work in Python?", "reference counting, the cycle collector, the allocator, and leaks", "Question fifty two, asked in ten write-ups. How does memory management and garbage collection work in Python?", "Reference counting, the cycle collector, how the allocator behaves, and what leaks look like in Python."),
  {
    kind: "flow",
    title: "Reference counting can't free a cycle",
    cols: 3,
    rows: 2,
    nodeW: 380,
    nodeH: 130,
    nodes: [
      { id: "n", label: "your code\n(no names left)", c: 0, r: 0, tone: "red" },
      { id: "a", label: "node A\nrefcount 1", c: 1, r: 0, tone: "amber" },
      { id: "b", label: "node B\nrefcount 1", c: 2, r: 0, tone: "amber" },
      { id: "g", label: "cycle collector (gc)\nfinds groups unreachable from outside, frees them", c: 1, r: 1, tone: "green", w: 760 },
    ],
    edges: [
      { from: "a", to: "b", label: "a.next = b", bend: 40 },
      { from: "b", to: "a", label: "b.prev = a", bend: 40 },
    ],
    show: [["n", "a", "b"], ["g"]],
    beats: B(
      "Reference counting has one blind spot: cycles. Node A points at B, and B points back at A. Your code drops its names, so nothing outside can reach them, but each still has a count of one, because of the other. They'd never be freed.",
      { say: "So CPython adds a cycle collector, the gc module. Every so often, it looks for groups of container objects that are only reachable from each other, and frees them. It's generational: new objects are checked often, objects that survive are checked less, because most objects die young.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "What else to say about Python memory",
    items: [
      { icon: "🧱", text: "Small objects come from pymalloc's pools", sub: "freed memory is reused by Python, not always handed back to the OS: the process can stay big" },
      { icon: "🕳️", text: "Leaks are references you forgot", sub: "unbounded caches, growing globals, closures holding big objects, lru_cache on methods" },
      { icon: "🔎", text: "Find them with tracemalloc", sub: "compare snapshots; objgraph to see who holds a reference" },
      { icon: "🪶", text: "Use less", sub: "generators, __slots__, bounded caches, del big objects early" },
    ],
    beats: B(
      "Small objects are allocated from pools by Python's own allocator, pymalloc. Freed memory is reused by Python, but isn't always returned to the operating system, so a process can stay large after a spike.",
      "Python leaks aren't lost pointers, as in C. They're references you forgot about: an unbounded cache, a global list that grows on every request, a closure holding a big object, or LRU cache on a method.",
      "To find them, tracemalloc takes snapshots of where memory was allocated, and you compare two of them.",
      { say: "And to use less: generators instead of lists, dunder slots for many small objects, caches with a size limit, and dropping big objects as soon as you're done.", tone: "key" },
    ),
  },
  {
    kind: "sayit",
    q: "How does Python manage memory?",
    lines: [
      "Every object has a reference count; when it hits zero, it's freed immediately.",
      "A generational cycle collector frees groups of objects that only reference each other.",
      "Small objects come from pymalloc pools; memory isn't always returned to the OS.",
      "Leaks are forgotten references: unbounded caches, globals, closures.",
      "I'd find them with tracemalloc snapshots, and fix with bounded caches and generators.",
    ],
    beats: B(
      { say: "Put together, as an answer.", tone: "ask" },
      "CPython uses reference counting: every object counts its references, and it's freed the moment the count reaches zero.",
      "On top of that, a generational cycle collector frees groups of objects that only reference each other.",
      "Small objects come from pymalloc's pools, and freed memory isn't always returned to the operating system.",
      "In practice, leaks in Python are forgotten references: unbounded caches, growing globals, closures holding big objects.",
      { say: "I'd find one with tracemalloc snapshots, and fix it with bounded caches, generators, and not keeping state around longer than needed.", tone: "key" },
    ),
  },

  // ---- Q53 (py50)
  q(53, 1, "What is the difference between a module and a package, and what does if __name__ == \"__main__\" do?", "files, folders, and running versus importing", "Question fifty three. What's the difference between a module and a package, and what does if dunder name equals dunder main do?", "Files and folders, and the difference between running a file and importing it."),
  {
    kind: "code",
    title: "A module is a file; a package is a folder of them",
    lang: "python",
    code: `app/
    __init__.py        # makes app a (regular) package
    models.py          # the module app.models
    api/__init__.py    # a subpackage: app.api

# models.py
def main(): ...

if __name__ == "__main__":     # True only when run directly:
    main()                     #   python -m app.models
                               # imported → __name__ == "app.models"`,
    highlight: [[1, 4], [6, 11]],
    beats: B(
      "A module is a single dot py file. A package is a folder of modules, usually with a dunder init dot py, which runs when the package is first imported. Imports are cached in sys dot modules, so a module's top-level code runs only once.",
      { say: "Every module has a dunder name. When you run the file directly, it's set to dunder main. When it's imported, it's the module's import path. So code under if name equals main runs when you execute the file, but not when another module imports it. That's where a script's entry point, or a quick manual test, goes.", tone: "key" },
    ),
  },

  // ---- Q54 (py51)
  q(54, null, "What causes circular imports, and how do you fix them?", "two modules importing each other at the top, half-initialised", "Question fifty four. What causes circular imports, and how do you fix them?", "Why it fails, which is about half-finished modules, and the fixes, best first."),
  {
    kind: "flow",
    title: "a imports b, b imports a: one of them is half-built",
    cols: 2,
    rows: 2,
    nodeW: 560,
    nodeH: 140,
    nodes: [
      { id: "a", label: "models.py\nfrom services import notify", c: 0, r: 0, tone: "amber" },
      { id: "b", label: "services.py\nfrom models import User", c: 1, r: 0, tone: "amber" },
      { id: "e", label: "ImportError: cannot import name 'User'\nmodels is still half-executed", c: 0, r: 1, tone: "red", w: 760 },
      { id: "f", label: "fix: move shared code to a third module,\nimport inside the function, or import the module", c: 1, r: 1, tone: "green", w: 760 },
    ],
    edges: [
      { from: "a", to: "b", label: "1. imports", bend: 40 },
      { from: "b", to: "a", label: "2. imports back", bend: 40 },
    ],
    show: [["a", "b"], ["e"], ["f"]],
    beats: B(
      "Models imports services at the top. Python starts running services, which imports models back.",
      "But models is only half executed: it stopped at its first line to import services. So user doesn't exist yet, and you get cannot import name. The circle itself is legal. Reaching for a name that isn't defined yet is what fails.",
      { say: "The fixes, best first. Move the shared pieces into a third module that both import. Or import inside the function that needs it, so it happens at call time. Or import the module rather than the name. And for type hints only, use if TYPE CHECKING.", tone: "key" },
    ),
  },

  // ---- Q55 (py52)
  q(55, null, "How do virtual environments and dependency management work (venv, pip, pyproject, Poetry, uv)?", "isolation, declaring dependencies, and locking them", "Question fifty five. How do virtual environments and dependency management work?", "Three jobs: isolate, declare, and lock."),
  {
    kind: "bullets",
    title: "Isolate, declare, lock",
    items: [
      { icon: "📦", text: "venv: an isolated environment per project", sub: "its own python and site-packages: python -m venv .venv" },
      { icon: "📝", text: "pyproject.toml: declare what you depend on", sub: "the standard project file; requirements.txt is the older list" },
      { icon: "🔒", text: "A lock file pins every exact version", sub: "including dependencies of dependencies: same install everywhere" },
      { icon: "⚡", text: "Tools: pip + pip-tools, Poetry, or uv", sub: "uv is a very fast, all-in-one installer, resolver and lock" },
    ],
    beats: B(
      "A virtual environment isolates each project's packages: its own python and its own site packages folder, so two projects can need different versions of the same library.",
      "Pyproject dot toml is the standard file where a project declares its dependencies, usually with version ranges. Requirements dot txt is the older, simpler list.",
      "A lock file pins every exact version, including the dependencies of your dependencies, so your laptop, CI and production install exactly the same thing.",
      { say: "And the tools. Pip with pip tools, Poetry, or uv, which is a very fast all-in-one replacement written in Rust. In a Docker image, you install from the lock file.", tone: "key" },
    ),
  },

  // ---- Q56 (py53)
  q(56, null, "What tools keep Python code quality high (PEP 8, ruff, black, mypy)?", "style, lint, format, types, and running them automatically", "Question fifty six. What tools keep Python code quality high?", "One tool per job, and how you make sure they always run."),
  {
    kind: "bullets",
    title: "One tool per job, run automatically",
    items: [
      { icon: "📏", text: "PEP 8: the style guide", sub: "naming, spacing, line length: what the tools enforce" },
      { icon: "🧹", text: "ruff: linter (and formatter)", sub: "unused imports, bugs, style: replaces flake8, isort and more; very fast" },
      { icon: "🎨", text: "black / ruff format: formatting", sub: "no style debates in code review" },
      { icon: "🔍", text: "mypy / pyright: static type checking", sub: "catches wrong types before running" },
      { icon: "🤖", text: "pre-commit + CI run them all", sub: "with pytest and coverage, on every commit and pull request" },
    ],
    beats: B(
      "PEP 8 is the style guide: naming, spacing, line length. The tools enforce it.",
      "Ruff is a linter, written in Rust and very fast. It catches unused imports, likely bugs and style problems, and replaces a whole set of older tools.",
      "Black, or ruff format, formats the code automatically, so nobody argues about style in reviews.",
      "Mypy or pyright check the type hints statically, before the code runs.",
      { say: "And pre-commit hooks plus CI run all of them, with pytest, on every commit and pull request. The point is that nobody has to remember.", tone: "key" },
    ),
  },
  check({
    topic: "memory",
    q: "A FastAPI service's memory grows with every request and never drops. What's the most likely Python cause?",
    say: "A FastAPI service's memory grows with every request, and never drops. What's the most likely Python cause?",
    a: "A reference that keeps growing: an unbounded cache or a module-level list/dict that gets a new entry per request. Find it with tracemalloc; bound it or remove it.",
    aSay: "A reference that keeps growing. Usually an unbounded cache, or a module level list or dict that gets a new entry on every request, so nothing can ever reach a reference count of zero. Find it with tracemalloc snapshots, then bound it or remove it.",
  }),
];

