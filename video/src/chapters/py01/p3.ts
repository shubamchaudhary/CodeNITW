import type { Scene } from "../../lib/types.ts";
import { analogy, asked, B, check, custom, sec } from "./h.ts";

// Part 3: classes for GenAI code (protocols, dataclasses vs Pydantic, dunder
// methods), errors and context managers, and concurrency.
export const p3: Scene[] = [
  // ------------------------------------------------------------ 6
  sec("6", "Classes, dataclasses and protocols", "Topic six. Classes, the Python way. How to swap one model provider for another, and when to use a dataclass versus a Pydantic model."),
  {
    kind: "code",
    title: "One interface, many model providers",
    lang: "python",
    code: `from typing import Protocol

class ChatModel(Protocol):
    def complete(self, prompt: str) -> str: ...

class OpenAIModel:                      # no base class needed
    def complete(self, prompt: str) -> str:
        return self.client.chat(prompt)

class LocalModel:
    def complete(self, prompt: str) -> str:
        return self.pipe(prompt)

def answer(model: ChatModel, q: str) -> str:
    return model.complete(q)            # works with either`,
    highlight: [[3, 4], [6, 12], [14, 15]],
    beats: B(
      "AskDocs should work with a hosted model in production and a local model in tests. So we describe what a model must do, not what it is. A Protocol says: anything with a complete method that takes a string and returns a string.",
      { say: "The two providers don't inherit from anything. They just have a complete method with the right shape. That's duck typing: if it walks like a duck and quacks like a duck, Python treats it as a duck. The Protocol only lets a type checker verify it.", tone: "key", term: { word: "Duck typing", meaning: "an object fits if it has the methods used, whatever its class" } },
      "And the answer function accepts any chat model. Swapping providers is now a one line change where the app starts. If you want a check at runtime instead, an abstract base class with abstractmethod refuses to instantiate a subclass that forgot a method.",
    ),
  },
  {
    kind: "compare",
    title: "dict, dataclass, or Pydantic model?",
    cols: [
      { title: "dict", icon: "🗂️", tone: "muted", items: ["no fields declared", "typos fail late", "fine for one-off JSON"] },
      { title: "@dataclass", icon: "🧱", tone: "cyan", items: ["fields + __init__, __repr__, __eq__ written for you", "type hints NOT checked", "your own trusted data"] },
      { title: "Pydantic BaseModel", icon: "🛡️", tone: "green", items: ["validates and converts at runtime", "clear errors on bad data", "untrusted input: requests, LLM output"] },
    ],
    footer: "Trusted data inside your code → dataclass. Data crossing a boundary → Pydantic.",
    beats: B(
      "A very common question: dict, dataclass, or Pydantic? A plain dict declares nothing, so a typo in a key fails late, somewhere far away. Fine for one-off JSON.",
      "A dataclass writes the init, repr and equality methods from your field list. But it does not check types at runtime. Pass a string where an int belongs, and it just stores the string.",
      "A Pydantic model validates and converts at runtime, and gives clear errors on bad data.",
      { say: "So the rule: trusted data inside your own code, a dataclass. Data crossing a boundary, an HTTP request, a config file, or anything an LLM produced, a Pydantic model.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "Dunder methods worth naming",
    firstItemStep: 1,
    items: [
      { icon: "🖨️", text: "__repr__: what you see in logs and the debugger", sub: "Prompt(id=7, tokens=812) instead of <Prompt object at 0x…>" },
      { icon: "⚖️", text: "__eq__ and __hash__: equality, and use as dict keys", sub: "define both together, or neither" },
      { icon: "🔁", text: "__len__, __iter__, __getitem__: behave like a collection", sub: "len(conversation), for msg in conversation" },
      { icon: "🚪", text: "__enter__ / __exit__: work with the with statement", sub: "the next topic" },
      { icon: "📞", text: "__call__: an object you can call like a function", sub: "a configured tool or model instance" },
    ],
    beats: B(
      "Dunder methods, short for double underscore, are how your classes plug into Python's syntax. Name a few with a use, and you've answered the question.",
      "Dunder repr: what you see in logs and in the debugger. Without it you get an address, not your data.",
      "Dunder eq and dunder hash: equality, and using objects as dict keys. Define both together, or neither.",
      "Dunder len, iter and getitem make an object behave like a collection, so you can loop over a conversation's messages.",
      "Dunder enter and exit make an object work with the with statement. That's the next topic.",
      "And dunder call lets you call an object like a function, which is handy for a configured tool or model.",
    ),
  },
  check({
    topic: "classes",
    q: "The LLM returns {\"score\": \"0.9\", \"sources\": null}. You load it into a @dataclass and into a Pydantic model with score: float and sources: list[str]. What happens in each?",
    say: "The model returns J S O N where score is the string zero point nine, and sources is null. You load it into a dataclass, and into a Pydantic model where score is a float and sources is a list of strings. What happens in each?",
    a: "The dataclass stores it as-is: a string score and None sources, failing later somewhere else. Pydantic converts \"0.9\" to 0.9 and raises a ValidationError for sources=None, right at the boundary.",
    aSay: "The dataclass stores it as it is: a string score and a None for sources, and something fails later, far away. Pydantic converts the string zero point nine into the float, and raises a validation error for sources being null, right at the boundary, where you can still do something about it, like asking the model again.",
  }),

  // ------------------------------------------------------------ 7
  sec("7", "Errors and context managers", "Topic seven. Errors and context managers. How to fail in a way the rest of the app can handle, and how to guarantee cleanup even when things go wrong."),
  {
    kind: "code",
    title: "Your own exceptions, and try / except / else / finally",
    lang: "python",
    code: `class LLMError(Exception): ...
class RateLimitError(LLMError): ...       # retry these
class ContextTooLongError(LLMError): ...  # shorten the prompt instead

try:
    reply = call_llm(prompt)
except RateLimitError:
    reply = fallback_model(prompt)
except ContextTooLongError:
    reply = call_llm(truncate(prompt))
else:
    cache[prompt] = reply                 # only when nothing was raised
finally:
    metrics.record("llm_call")            # always, success or failure`,
    highlight: [[1, 3], [5, 6], [7, 10], [11, 12], [13, 14]],
    beats: B(
      "Start with your own exceptions, in a small hierarchy. One base class, LLM error, and specific ones beneath it. Callers can catch the specific case they can fix, or the base class to catch all of them.",
      "The try block holds only the call that can fail. Keep it small, so you don't accidentally catch an error from somewhere else.",
      "Each except handles one failure differently. A rate limit falls back to another model. A prompt that's too long gets truncated and sent again.",
      { say: "The else block runs only if nothing was raised. Here it caches the reply. Putting that line inside try would also catch errors from the cache itself, which you didn't mean to handle.", tone: "key" },
      "And finally always runs: success, failure, even a return inside try. That's where you record metrics or release resources.",
    ),
  },
  {
    kind: "compare",
    title: "EAFP vs LBYL",
    cols: [
      { title: "LBYL: look before you leap", icon: "👀", tone: "muted", items: ["if 'answer' in data: …", "check first, then act", "racy: things change between check and act"] },
      { title: "EAFP: easier to ask forgiveness", icon: "🙏", tone: "green", items: ["try: data['answer'] except KeyError: …", "act, handle the failure", "the Pythonic default"] },
    ],
    beats: B(
      "Two styles come up by name. Look before you leap: check that the key exists, then use it.",
      { say: "Easier to ask forgiveness than permission: just use it, and handle the KeyError. That's the Pythonic default. It's also safer around files and network calls, because the world can change between your check and your action.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "Context managers: setup and guaranteed cleanup",
    lang: "python",
    code: `from contextlib import contextmanager

@contextmanager
def timer(name):
    start = time.perf_counter()
    try:
        yield                            # the body of the with block runs here
    finally:
        log(name, time.perf_counter() - start)

with timer("retrieval"):
    chunks = search(question)

async with httpx.AsyncClient() as client:   # closes connections for you
    r = await client.post(url, json=payload)`,
    highlight: [[3, 4], [5, 7], [8, 9], [11, 12], [14, 15]],
    beats: B(
      "Context managers. The with statement guarantees that cleanup runs, however the block ends. The quickest way to write one is the contextmanager decorator on a generator.",
      "Code before yield is the setup. The yield is where the body of the with block runs.",
      { say: "Code after yield, in a finally, is the cleanup. It runs even if the body raises. Without the try finally, an exception would skip your cleanup, which is the most common mistake here.", tone: "key" },
      "And using it reads naturally: with timer retrieval, do the search.",
      "The same idea in async code is async with. An async HTTP client closes its connections when the block ends. As a class, you'd write dunder enter and dunder exit, or their async versions.",
    ),
  },
  check({
    topic: "errors",
    q: "def f(): try: return \"try\" · finally: print(\"finally\"). What does f() print, and what does it return?",
    say: "A function has try with return the string try, and a finally that prints the word finally. What does calling it print, and what does it return?",
    a: "It prints \"finally\" and returns \"try\". finally runs even when try returns, just before the function actually leaves.",
    aSay: "It prints finally, and returns try. The finally block always runs, even when the try block returns, just before the function actually leaves. That's why it's the right place for cleanup.",
  }),

  // ------------------------------------------------------------ 8
  sec("8", "Concurrency: GIL, threads, processes, asyncio", "Topic eight. Concurrency. Thirteen write-ups asked threads versus processes, and for GenAI roles this is the big one, because almost all your time is spent waiting for a model to answer."),
  asked(
    "You must send 1,000 prompts to an LLM API. How do you do it fast, without getting rate-limited?",
    "I/O-bound → asyncio · a semaphore to cap concurrency · timeouts · retry with backoff",
    "Here's the question in its GenAI form.",
    { say: "You must send a thousand prompts to an LLM API. How do you do it fast, without getting rate limited?", tone: "ask" },
    "To answer it you need four ideas: why waiting is the whole problem, what the GIL does and doesn't stop, which of threads, processes or asyncio fits, and how to cap concurrency. One at a time.",
  ),
  custom(
    "pylanes",
    {
      title: "Three calls, one after another vs at once",
      sub: "each LLM call: 0.1 s of our work, then ~2 s waiting for the model",
      max: 7,
      rows: [
        { label: "Sequential", step: 0, bars: [{ s: 0, e: 0.15, kind: "run" }, { s: 0.15, e: 2.1, kind: "wait", text: "call 1" }, { s: 2.1, e: 2.25, kind: "run" }, { s: 2.25, e: 4.2, kind: "wait", text: "call 2" }, { s: 4.2, e: 4.35, kind: "run" }, { s: 4.35, e: 6.3, kind: "wait", text: "call 3" }], done: "6.3 s" },
        { label: "Concurrent: call 1", step: 1, bars: [{ s: 0, e: 0.15, kind: "run" }, { s: 0.15, e: 2.1, kind: "wait", text: "call 1" }] },
        { label: "call 2", step: 1, bars: [{ s: 0.15, e: 0.3, kind: "run" }, { s: 0.3, e: 2.25, kind: "wait", text: "call 2" }] },
        { label: "call 3", step: 1, bars: [{ s: 0.3, e: 0.45, kind: "run" }, { s: 0.45, e: 2.4, kind: "wait", text: "call 3" }], done: "2.4 s" },
      ],
      note: { step: 2, text: "The CPU was idle 95% of the time. Overlapping the waiting is the whole speed-up." },
    },
    B(
      "First, the picture. Each LLM call is a tiny bit of our work, building the request, then about two seconds of waiting for the model. Three calls, one after another: six point three seconds, and the striped parts are waiting.",
      { say: "Now start all three, then wait for all three. The waits overlap. Two point four seconds for the same work.", tone: "key" },
      { say: "During the sequential version, our CPU was idle ninety five percent of the time. Overlapping the waiting is the entire speed-up. That's what I O bound means.", tone: "key", term: { word: "I/O-bound", meaning: "slow because it waits on the network or disk, not the CPU" } },
    ),
  ),
  {
    kind: "trap",
    myth: "Because of the GIL, Python threads can't run anything concurrently.",
    truth: "The GIL lets only one thread run Python bytecode at a time, but it's released while a thread waits on I/O.",
    why: "So threads overlap network waits fine. What they can't do is speed up pure-Python CPU work. (NumPy and many C libraries release the GIL too; 3.13+ has an optional free-threaded build.)",
    beats: B(
      "Now the GIL, which comes up in five write-ups by name.",
      { say: "The global interpreter lock lets only one thread run Python bytecode at a time. But a thread releases it while it waits for I O. So threads overlap network waits perfectly well.", tone: "key", term: { word: "GIL", meaning: "global interpreter lock: one thread runs Python bytecode at a time" } },
      "What threads can't do is speed up pure Python CPU work, like counting tokens in a big loop. Libraries written in C, like NumPy, release the GIL during heavy work. And since Python three thirteen there's an optional free threaded build, but the standard build still has the GIL.",
    ),
  },
  custom(
    "pylanes",
    {
      title: "CPU work: two threads vs two processes",
      sub: "parsing two big PDFs in pure Python: 2 s of CPU each",
      max: 5,
      rows: [
        { label: "Thread A", step: 0, bars: [{ s: 0, e: 0.5, kind: "run" }, { s: 0.5, e: 1, kind: "frozen" }, { s: 1, e: 1.5, kind: "run" }, { s: 1.5, e: 2, kind: "frozen" }, { s: 2, e: 2.5, kind: "run" }, { s: 2.5, e: 3, kind: "frozen" }, { s: 3, e: 3.5, kind: "run" }] },
        { label: "Thread B", step: 0, bars: [{ s: 0, e: 0.5, kind: "frozen" }, { s: 0.5, e: 1, kind: "run" }, { s: 1, e: 1.5, kind: "frozen" }, { s: 1.5, e: 2, kind: "run" }, { s: 2, e: 2.5, kind: "frozen" }, { s: 2.5, e: 3, kind: "run" }, { s: 3, e: 3.5, kind: "frozen" }, { s: 3.5, e: 4, kind: "run" }], done: "4 s: no faster" },
        { label: "Process A", step: 1, bars: [{ s: 0, e: 2, kind: "run" }] },
        { label: "Process B", step: 1, bars: [{ s: 0, e: 2, kind: "run" }], done: "2 s: two cores" },
      ],
      note: { step: 2, text: "CPU-bound pure Python: processes (each has its own interpreter and its own GIL)." },
    },
    B(
      "Here's what the GIL does to CPU work. Two threads parsing two big PDFs in pure Python. They take turns holding the GIL, so the total is four seconds. No faster than doing them one after the other.",
      { say: "Two processes. Each process has its own interpreter and its own GIL, so they really run on two cores at once. Two seconds.", tone: "key" },
      "So for CPU bound pure Python work, like parsing documents or tokenizing a corpus, you reach for processes.",
    ),
  ),
  {
    kind: "compare",
    title: "Which tool for which job",
    cols: [
      { title: "asyncio", icon: "🔀", tone: "green", items: ["thousands of concurrent I/O waits, one thread", "LLM and HTTP calls, DB queries", "needs async libraries (httpx, asyncpg)"] },
      { title: "threads", icon: "🧵", tone: "cyan", items: ["tens of I/O waits", "libraries that only block (old SDKs, boto3)", "ThreadPoolExecutor"] },
      { title: "processes", icon: "🧠", tone: "amber", items: ["CPU-bound pure Python", "parsing PDFs, tokenizing, heavy pre-processing", "ProcessPoolExecutor; pickled arguments"] },
    ],
    footer: "1,000 LLM calls → asyncio. Same calls through a blocking-only SDK → threads. Parsing 10,000 PDFs → processes.",
    beats: B(
      "So which tool for which job. Asyncio: thousands of concurrent waits on a single thread. LLM calls, HTTP calls, database queries. It needs async libraries, like httpx or asyncpg.",
      "Threads: tens of waits, especially with libraries that only offer blocking calls. A thread pool executor.",
      "Processes: CPU bound pure Python, like parsing PDFs or heavy preprocessing. A process pool executor. Arguments are pickled to cross between processes, so keep them small.",
      { say: "One line to remember. A thousand LLM calls: asyncio. The same calls through an SDK that can only block: threads. Parsing ten thousand PDFs: processes.", tone: "key" },
    ),
  },
  custom(
    "analogy",
    {
      title: "The event loop is one waiter, many tables",
      a: "A restaurant with one waiter",
      b: "asyncio",
      rows: [
        { icon: "🧑‍🍳", a: "One waiter", b: "the event loop (one thread)" },
        { icon: "🍽️", a: "Each table's order", b: "a task (a running coroutine)" },
        { icon: "📝", a: "Sends an order to the kitchen, walks on", b: "await client.post(...): the task pauses" },
        { icon: "🔔", a: "The kitchen rings: dish ready", b: "the response arrives; the task is resumed" },
        { icon: "🧍", a: "A waiter who stands at the kitchen door waiting", b: "a blocking call: time.sleep, requests.get" },
      ],
      footer: "await is where a task politely steps aside. A blocking call never steps aside: every table waits.",
    },
    B(
      "Now how asyncio does it with one thread. Picture a restaurant with one waiter.",
      "The waiter is the event loop. One thread.",
      "Each table's order is a task, a running coroutine.",
      { say: "When the waiter sends an order to the kitchen, he doesn't stand there. He walks on to the next table. That's await: the task pauses and gives the loop back.", tone: "key" },
      "When the kitchen rings because a dish is ready, the waiter picks that table back up. That's the response arriving and the task being resumed.",
      { say: "And the disaster: a waiter who stands at the kitchen door until the dish is ready. That's a blocking call inside async code, like time dot sleep or requests dot get. Every other table waits.", tone: "key" },
      "So await is where a task politely steps aside. A blocking call never steps aside.",
    ),
  ),
  custom(
    "pylanes",
    {
      title: "One blocking call freezes every task",
      sub: "task 2 calls requests.get(...) instead of await client.get(...)",
      max: 5,
      rows: [
        { label: "Task 1", step: 0, bars: [{ s: 0, e: 0.2, kind: "run" }, { s: 0.2, e: 0.6, kind: "wait" }, { s: 0.6, e: 3.6, kind: "frozen", text: "ready, but stuck" }, { s: 3.6, e: 3.8, kind: "run" }] },
        { label: "Task 2", step: 0, bars: [{ s: 0.2, e: 0.6, kind: "run" }, { s: 0.6, e: 3.6, kind: "block", text: "requests.get: holds the loop 3 s" }] },
        { label: "Task 3", step: 0, bars: [{ s: 0.6, e: 3.6, kind: "frozen", text: "never even started" }, { s: 3.6, e: 3.8, kind: "run" }, { s: 3.8, e: 4.6, kind: "wait" }] },
      ],
      note: { step: 1, text: "Fix: an async client (await httpx), or push the blocking call to a thread: await asyncio.to_thread(fn, ...)" },
    },
    B(
      { say: "Here's that disaster on the timeline. Task two calls requests dot get, a blocking call, inside an async function. For three seconds it holds the loop. Task one's response arrived, but nobody can resume it. Task three never even started.", tone: "key" },
      "The fix: use an async client and await it. Or, when a library only blocks, push the call to a thread with await asyncio dot to thread. The loop keeps serving everyone else while the thread waits.",
    ),
  ),
  {
    kind: "code",
    title: "1,000 prompts: concurrent, capped, with timeouts and retries",
    lang: "python",
    code: `sem = asyncio.Semaphore(10)              # at most 10 calls in flight

async def ask(client, prompt):
    async with sem:
        for attempt in range(4):
            try:
                async with asyncio.timeout(30):
                    r = await client.post(URL, json={"prompt": prompt})
                    r.raise_for_status()
                    return r.json()["answer"]
            except (httpx.TimeoutException, RateLimited):
                await asyncio.sleep(0.5 * 2 ** attempt + random.random() / 10)
        raise LLMError(f"gave up on: {prompt[:40]}")

async def main(prompts):
    async with httpx.AsyncClient() as client:
        async with asyncio.TaskGroup() as tg:
            tasks = [tg.create_task(ask(client, p)) for p in prompts]
    return [t.result() for t in tasks]`,
    highlight: [[1, 1], [3, 4], [7, 10], [11, 12], [13, 13], [15, 18], [19, 19]],
    beats: B(
      "And here's the full answer to the opening question, a coding exercise five write-ups asked. A semaphore with ten permits: at most ten calls in flight at once, however many tasks exist.",
      "Each task enters the semaphore before calling. The eleventh waits until one of the ten finishes.",
      "Every call gets a timeout, so one stuck request can't hang the whole batch. Asyncio dot timeout arrived in Python three eleven; before that, wait for.",
      "On a timeout or a rate limit, back off exponentially with jitter, exactly like our decorator, but with await asyncio dot sleep. Never time dot sleep in async code.",
      "After four attempts, raise a clear error.",
      { say: "The main function opens one shared client, so connections are reused, and a task group starts a task for every prompt. A thousand tasks exist, but the semaphore lets only ten talk to the API at a time.", tone: "key" },
      "When the task group block ends, every task has finished, and we collect the results in order.",
    ),
  },
  custom(
    "pylanes",
    {
      title: "A semaphore of 3, six calls",
      sub: "tasks 4–6 wait for a free permit",
      max: 7,
      rows: [
        { label: "calls 1–3", step: 0, bars: [{ s: 0, e: 2.2, kind: "wait", text: "in flight" }] },
        { label: "calls 4–6", step: 0, bars: [{ s: 0, e: 2.2, kind: "frozen", text: "waiting for a permit" }, { s: 2.2, e: 4.4, kind: "wait", text: "in flight" }], done: "≈4.4 s" },
      ],
      note: { step: 1, text: "The cap is your rate limit made visible: fast enough, never more than the provider allows." },
    },
    B(
      "On the timeline, with a semaphore of three and six calls: the first three are in flight at once, and the next three wait for a free permit, then go.",
      { say: "So the semaphore turns your provider's rate limit into a number in your code. As fast as allowed, and never more than allowed.", tone: "key", term: { word: "Semaphore", meaning: "a counter of permits: at most N tasks inside at once" } },
    ),
  ),
  {
    kind: "compare",
    title: "await, gather, create_task, TaskGroup",
    cols: [
      { title: "await coro()", icon: "1️⃣", tone: "muted", items: ["runs one, waits for it", "two awaits in a row = sequential"] },
      { title: "gather()", icon: "📦", tone: "cyan", items: ["runs many, results in order", "one failure raises; others keep running", "return_exceptions=True collects errors"] },
      { title: "create_task()", icon: "🚀", tone: "amber", items: ["starts it now, in the background", "keep a reference, or it can vanish", "you must await or cancel it"] },
      { title: "TaskGroup (3.11+)", icon: "👥", tone: "green", items: ["structured: all done when the block ends", "one fails → the rest are cancelled", "errors raised together (ExceptionGroup)"] },
    ],
    beats: B(
      "And a common follow-up: the four ways to run coroutines. Awaiting one runs it and waits. Two awaits in a row are sequential, which is the most common accidental slowness in async code.",
      "Gather runs many and returns results in order. If one fails, gather raises, but the others keep running. With return exceptions true, you get the errors back as results instead.",
      "Create task starts a coroutine in the background right away. Keep a reference to it, because the loop holds only a weak one, and await or cancel it eventually.",
      { say: "Task group, from Python three eleven, is structured. When the block ends, every task is done. If one fails, the rest are cancelled, and the errors come out together as an exception group. For new code, it's the default choice.", tone: "key" },
    ),
  },
  check({
    topic: "concurrency",
    q: "Which tool for each job? (1) re-ranking 5,000 chunks with a pure-Python scoring loop, (2) 500 calls to an embedding API with an async client, (3) 20 uploads with a library that only has blocking calls.",
    say: "Which tool for each job? One: re-ranking five thousand chunks with a pure Python scoring loop. Two: five hundred calls to an embedding API with an async client. Three: twenty uploads with a library that only has blocking calls.",
    a: "(1) processes: CPU-bound pure Python. (2) asyncio, with a semaphore. (3) threads (a ThreadPoolExecutor, or asyncio.to_thread from async code).",
    aSay: "One, processes, because it's CPU bound pure Python and the GIL would serialise threads. Two, asyncio with a semaphore, because it's lots of I O waiting and you have an async client. Three, threads, a thread pool executor, or asyncio dot to thread if you're already in async code, because the library can only block.",
    hold: 12,
  }),
  check({
    topic: "asyncio",
    q: "Inside an async def, someone wrote time.sleep(2) for backoff. 50 tasks are running. What happens?",
    say: "Inside an async function, someone wrote time dot sleep two seconds for the backoff. Fifty tasks are running. What happens?",
    a: "Every one of the 50 tasks freezes for 2 s each time: time.sleep blocks the event loop's only thread. Use await asyncio.sleep(2), which pauses only that task.",
    aSay: "All fifty tasks freeze for two seconds, every time any task backs off, because time dot sleep blocks the event loop's only thread. Use await asyncio dot sleep, which pauses only that one task and lets the loop serve the rest.",
  }),
  {
    kind: "sayit",
    q: "When do you use threading vs multiprocessing vs asyncio?",
    lines: [
      "The GIL lets one thread run Python bytecode at a time, but it's released during I/O.",
      "I/O-bound at scale, like LLM or HTTP calls: asyncio, one thread, thousands of awaits.",
      "I/O with blocking-only libraries: threads.",
      "CPU-bound pure Python: processes, each with its own GIL, on every core.",
      "For LLM calls I cap concurrency with a semaphore, add timeouts, and retry with backoff.",
    ],
    beats: B(
      { say: "Model answer. When do you use threading versus multiprocessing versus asyncio?", tone: "ask" },
      "The GIL lets one thread run Python bytecode at a time, but it's released while a thread waits on I O.",
      "So for I O bound work at scale, like LLM or HTTP calls, I use asyncio: one thread, thousands of concurrent awaits.",
      "For I O with libraries that only block, threads.",
      "For CPU bound pure Python, processes, because each has its own interpreter and GIL, and they use every core.",
      { say: "And for LLM calls specifically, I cap concurrency with a semaphore, put a timeout on every call, and retry transient errors with backoff.", tone: "key" },
    ),
  },
];
