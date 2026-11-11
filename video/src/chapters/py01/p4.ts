import type { Scene } from "../../lib/types.ts";
import { B, check, custom, sec } from "./h.ts";

// Part 4: memory management, type hints and Pydantic for LLM output, the LRU
// cache coding round, then the rapid-fire drill, the pitch and the close.
export const p4: Scene[] = [
  // ------------------------------------------------------------ 9
  sec("9", "Memory and garbage collection", "Topic nine. Memory management and garbage collection. Ten write-ups asked it, usually as: how does Python free memory, and how would you find a leak?"),
  custom(
    "pynames",
    {
      title: "Reference counting",
      sub: "every object counts the references to it",
      steps: [
        { tags: [{ name: "a = Embedding(...)", to: "E" }], objs: [{ id: "E", text: "Embedding  · refs: 1" }] },
        { tags: [{ name: "a", to: "E" }, { name: "b = a", to: "E", tone: "amber" }], objs: [{ id: "E", text: "Embedding  · refs: 2" }] },
        { tags: [{ name: "del a", to: "" }, { name: "b", to: "E", tone: "amber" }], objs: [{ id: "E", text: "Embedding  · refs: 1" }] },
        { tags: [{ name: "b = None", to: "", tone: "amber" }], objs: [{ id: "E", text: "Embedding  · refs: 0", gone: true, sub: "freed immediately" }], note: "Count hits zero → freed at once. No pause, no waiting for a collector." },
      ],
    },
    B(
      "CPython's main mechanism is reference counting. Every object keeps a count of how many references point to it. Create an embedding object and name it a: one reference.",
      "B equals a: two references to the same object, as we saw in topic one.",
      "Del a deletes the name, not the object. The count drops to one.",
      { say: "Set b to None, and the count hits zero. The object is freed right then. No pause, no waiting for a collector. That's why most Python memory is released immediately.", tone: "key", term: { word: "Reference counting", meaning: "free an object the moment nothing refers to it" } },
    ),
  ),
  {
    kind: "bullets",
    title: "Where reference counting isn't enough",
    firstItemStep: 1,
    items: [
      { icon: "🔄", text: "Cycles: a → b → a keep each other's count above zero", sub: "a node and its parent; a conversation and its messages pointing back" },
      { icon: "🧹", text: "The cyclic garbage collector finds unreachable cycles", sub: "the gc module; generations 0, 1, 2: young objects checked most often" },
      { icon: "📦", text: "Small objects come from pools (pymalloc)", sub: "freed memory is often reused by Python, not returned to the OS" },
    ],
    beats: B(
      "But reference counting has one gap.",
      "Cycles. If a points to b and b points back to a, both counts stay above zero even when nothing else can reach them. Think of a conversation object whose messages each point back to the conversation.",
      { say: "So CPython also runs a cyclic garbage collector, the gc module, which periodically finds groups of objects that only reference each other and frees them. It uses generations: young objects are checked most often, because most objects die young.", tone: "key" },
      "And one detail that explains confusing graphs: small objects come from memory pools, so freed memory is usually reused by Python rather than handed back to the operating system. A process's memory can stay high even after you free things.",
    ),
  },
  {
    kind: "compare",
    title: "Memory leaks in GenAI services, and the fix",
    cols: [
      { title: "The leak", icon: "💧", tone: "red", items: ["a module-level dict caching every prompt → answer", "keeping every response, embedding or chunk in a list", "@lru_cache on a method: it holds self forever", "tasks or callbacks you never cancel"] },
      { title: "The fix", icon: "🔧", tone: "green", items: ["a bounded cache (maxsize, TTL) or Redis", "generators and batches: stream, don't hoard", "cache on a function of plain values, or per instance", "TaskGroup, timeouts, cancel on disconnect"] },
    ],
    footer: "Find it: tracemalloc snapshots (compare two), objgraph, memray. In Python, a leak is almost always 'something still points to it'.",
    beats: B(
      "So how do Python services actually leak? Almost always, something still points to the data. A module level dict that caches every prompt and answer, forever. A list that keeps every response or embedding. A cache decorator on a method, which keeps self alive. And background tasks nobody cancels.",
      "The fixes match: a bounded cache, with a max size or a time to live, or an external cache like Redis. Generators and batches instead of hoarding. Caching functions of plain values. And structured tasks with timeouts.",
      { say: "To find one: tracemalloc, take two snapshots a few minutes apart and compare them, or tools like memray. And remember the sentence: in Python, a leak almost always means something still points to it.", tone: "key" },
    ),
  },
  check({
    topic: "memory",
    q: "A service keeps CACHE = {} at module level and stores every prompt → answer in it. Memory grows all day. Is the garbage collector broken?",
    say: "A service keeps a module level dict called cache, and stores every prompt and its answer in it. Memory grows all day. Is the garbage collector broken?",
    a: "No: every entry is still referenced by the dict, so nothing is garbage. Bound it (an LRU with maxsize, a TTL) or move it to Redis.",
    aSay: "No. Every entry is still referenced by the dict, which lives as long as the module, so none of it is garbage. The collector is doing its job. Bound the cache, with an LRU and a max size or a time to live, or move it out to Redis. Which happens to be our coding question in topic eleven.",
  }),
  {
    kind: "sayit",
    q: "How does Python manage memory?",
    lines: [
      "CPython counts references: an object is freed the moment its count hits zero.",
      "A cyclic garbage collector, with generations, frees cycles that refcounting can't.",
      "Small objects come from pools, so freed memory is often reused rather than returned to the OS.",
      "Leaks are references kept alive: unbounded caches, lists, unclosed tasks. I find them with tracemalloc.",
    ],
    beats: B(
      { say: "Model answer. How does Python manage memory?", tone: "ask" },
      "CPython counts references to every object, and frees an object the moment its count reaches zero.",
      "A cyclic garbage collector, organised in generations, frees groups of objects that only reference each other, which reference counting can't catch.",
      "Small objects are allocated from pools, so freed memory is often reused by Python rather than returned to the operating system.",
      { say: "And leaks are references kept alive by mistake: unbounded caches, growing lists, tasks never cancelled. I find them by comparing tracemalloc snapshots.", tone: "key" },
    ),
  },

  // ------------------------------------------------------------ 10
  sec("10", "Type hints and Pydantic: trusting the model's JSON", "Topic ten. Type hints and Pydantic. For GenAI roles this one is asked as: the model returned JSON. How do you make sure it's what you expect?"),
  {
    kind: "trap",
    myth: "Type hints are checked when the code runs.",
    truth: "Python ignores them at runtime. Tools read them: mypy or pyright before you run, Pydantic and FastAPI while you run.",
    why: "def f(x: int) happily accepts a string. Hints are documentation a machine can check, nothing more.",
    beats: B(
      "First, a misunderstanding that interviewers probe.",
      { say: "Python itself ignores type hints at runtime. A function annotated to take an int will accept a string without complaint. What reads the hints are tools: mypy or pyright before you run, and libraries like Pydantic and FastAPI while you run.", tone: "key" },
      "So hints are documentation a machine can check. Pydantic is what turns them into actual runtime validation.",
    ),
  },
  {
    kind: "code",
    title: "Structured output: validate, and ask again on failure",
    lang: "python",
    code: `from pydantic import BaseModel, Field, ValidationError

class Answer(BaseModel):
    answer: str
    sources: list[str]
    confidence: float = Field(ge=0, le=1)

def ask_structured(question, tries=3):
    prompt = build_prompt(question, schema=Answer.model_json_schema())
    for _ in range(tries):
        raw = call_llm(prompt)
        try:
            return Answer.model_validate_json(raw)
        except ValidationError as e:
            prompt += f"\\nYour JSON was invalid: {e}. Return only valid JSON."
    raise LLMError("no valid answer")`,
    highlight: [[3, 6], [9, 9], [11, 13], [14, 15], [16, 16]],
    beats: B(
      "Here's the pattern every GenAI team writes. Declare the shape you expect as a Pydantic model: an answer string, a list of source ids, and a confidence between zero and one. The Field adds the range check.",
      "Put the model's JSON schema into the prompt, so the LLM knows the exact shape you want.",
      { say: "Call the model, and parse its reply with model validate json. That one call parses the JSON, checks every field and type, converts what it safely can, and returns a real typed object.", tone: "key" },
      "If validation fails, don't crash and don't guess. Feed the error message back to the model and ask again. Models are good at fixing their own JSON when told exactly what was wrong.",
      "After a few tries, raise a clear error. Many providers now offer a structured output mode too, but you still validate: it's your boundary.",
    ),
  },
  custom(
    "pypipe",
    {
      title: "The model's output crosses a boundary",
      stages: [
        { name: "LLM reply", icon: "🤖", sub: "just text" },
        { name: "parse JSON", icon: "🧩", sub: "is it JSON at all?" },
        { name: "validate", icon: "🛡️", sub: "Pydantic: fields, types, ranges" },
        { name: "your code", icon: "✅", sub: "a typed Answer object" },
      ],
      steps: [
        { at: 0, text: "Whatever the prompt said, the model returns text. Treat it like user input: untrusted." },
        { at: [1, 2], text: "One call, model_validate_json, parses and validates: missing field, wrong type, confidence 1.7 → ValidationError." },
        { at: 0, fail: true, text: "On failure, the error goes back to the model as a correction, and you ask again (a bounded number of times)." },
        { at: 3, back: true, text: "Past the boundary, your code only ever sees a valid Answer: answer.confidence is a float between 0 and 1. No defensive checks scattered everywhere." },
      ],
    },
    B(
      "The way to think about it in an interview: the model's output crosses a boundary into your system. Whatever your prompt said, what comes back is text. Treat it like user input. Untrusted.",
      "Parsing and validation happen in one place, at the boundary. A missing field, a wrong type, a confidence of one point seven: each becomes a validation error.",
      "On failure, the error goes back to the model as a correction, and you ask again, a bounded number of times.",
      { say: "And past the boundary, your code only ever sees a valid answer object. No defensive checks scattered across the codebase. That sentence, validate at the boundary, is the answer interviewers are listening for.", tone: "key" },
    ),
  ),
  check({
    topic: "Pydantic",
    q: "Why validate the LLM's JSON with Pydantic instead of json.loads and reading the keys?",
    say: "Why validate the model's JSON with Pydantic, instead of just json dot loads and reading the keys you need?",
    a: "json.loads only checks it's JSON. Pydantic checks the shape: required fields, types, ranges, with a precise error you can send back to the model, and gives the rest of the code a typed object.",
    aSay: "Json dot loads only tells you it's valid JSON. It says nothing about the shape. Pydantic checks required fields, types and ranges, converts safe cases, and gives a precise error message, which you can send back to the model to fix. And the rest of your code gets a typed object, instead of dicts that might be missing keys.",
  }),

  // ------------------------------------------------------------ 11
  sec("11", "Coding round: an LRU cache for LLM answers", "Topic eleven. A coding question six write-ups asked: implement an LRU cache. In AskDocs, it's the bounded cache that fixes our memory leak."),
  {
    kind: "code",
    title: "LRU cache: O(1) get and put",
    lang: "python",
    code: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.data = OrderedDict()            # oldest first, newest last

    def get(self, key):
        if key not in self.data:
            return None
        self.data.move_to_end(key)           # just used → newest
        return self.data[key]

    def put(self, key, value):
        self.data[key] = value
        self.data.move_to_end(key)
        if len(self.data) > self.capacity:
            self.data.popitem(last=False)    # evict the least recently used`,
    highlight: [[1, 6], [8, 12], [11, 11], [14, 16], [17, 18]],
    beats: B(
      "Least recently used: when the cache is full, throw out the entry that was used longest ago. The neat Python answer uses an ordered dict, which keeps keys in order, oldest first, and can move a key to the end in constant time.",
      "Get: if the key isn't there, return None.",
      { say: "If it is, move it to the end, because it was just used, which makes it the newest. Then return it.", tone: "key" },
      "Put: store the value, and move the key to the end, since it's the newest now.",
      { say: "If that pushed us over capacity, pop item with last equals false removes the oldest entry, the least recently used. Both operations are constant time.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "What the interviewer asks next",
    firstItemStep: 1,
    items: [
      { icon: "🔗", text: "\"Without OrderedDict?\" A dict + a doubly linked list", sub: "the dict finds the node in O(1); the list moves and evicts it in O(1)" },
      { icon: "🧰", text: "\"In real code?\" @functools.lru_cache(maxsize=1024)", sub: "for pure functions of hashable arguments" },
      { icon: "🌐", text: "\"For LLM answers across servers?\" Redis, with a TTL", sub: "key on a normalised prompt + model + temperature" },
      { icon: "🧵", text: "\"Thread-safe?\" A lock around get and put", sub: "or one cache per async event loop" },
    ],
    beats: B(
      "And the follow-ups, which is where the interview is really decided.",
      "Without an ordered dict? A plain dict plus a doubly linked list. The dict finds the node in constant time, and the list moves it to the front or evicts the tail in constant time.",
      "In real code? Functools lru cache, with a max size, for pure functions with hashable arguments.",
      { say: "For LLM answers shared across several servers? Redis, with a time to live, keyed on the normalised prompt, the model name and the temperature, since the same prompt to a different model is a different answer.", tone: "key" },
      "And thread safety? Put a lock around get and put, because two threads can interleave a move and an evict.",
    ),
  },
  check({
    topic: "LRU",
    q: "Capacity 2. put(a), put(b), get(a), put(c). Which key gets evicted?",
    say: "Capacity two. Put a, put b, get a, then put c. Which key gets evicted?",
    options: ["a", "b", "c", "none"],
    answer: 1,
    a: "b. get(a) made a the most recently used, so b is the least recently used when c arrives.",
    aSay: "B, the key b. Getting a moved it to the newest position, so when c arrives and the cache is over capacity, b is the one used longest ago.",
  }),

  // ------------------------------------------------------------ finale
  {
    kind: "drill",
    items: [
      { q: "A mutable default argument is created…", a: "once, when def runs; use None" },
      { q: "copy() vs deepcopy()?", a: "new outer container vs copies all the way down" },
      { q: "is vs ==?", a: "same object vs equal value; is only for None" },
      { q: "Why can't a list be a dict key?", a: "it can change, so its hash could change" },
      { q: "Closure in a loop sees…", a: "the variable's last value; bind with a default" },
      { q: "Stacked decorators apply…", a: "bottom up; the top one runs first" },
      { q: "Why functools.wraps?", a: "keeps name, docstring, signature" },
      { q: "Generator memory for 2M chunks?", a: "one item (or one batch) at a time" },
      { q: "GIL released during…", a: "I/O waits (and in many C libraries)" },
      { q: "1,000 LLM calls?", a: "asyncio + semaphore + timeouts + backoff" },
      { q: "Blocking call in async code?", a: "await asyncio.to_thread(fn)" },
      { q: "Validate LLM JSON with…", a: "Pydantic: model_validate_json at the boundary" },
    ],
    beats: B(
      { say: "Rapid fire. Answer each one before I do. A mutable default argument is created when?", hold: 3 },
      "Once, when def runs. Use None as the default.",
      { say: "Copy versus deep copy?", hold: 3 },
      "Copy makes a new outer container. Deep copy copies all the way down.",
      { say: "Is versus double equals?", hold: 3 },
      "Same object versus equal value. Use is only for None.",
      { say: "Why can't a list be a dict key?", hold: 3 },
      "Because it can change, so its hash could change.",
      { say: "A closure created in a loop sees what?", hold: 3 },
      "The variable's last value. Bind it with a default argument.",
      { say: "Stacked decorators apply in which order?", hold: 3 },
      "Bottom up. And the top one runs first.",
      { say: "Why functools wraps?", hold: 3 },
      "It keeps the original's name, docstring and signature.",
      { say: "Memory for two million chunks with a generator?", hold: 3 },
      "One item, or one batch, at a time.",
      { say: "The GIL is released during what?", hold: 3 },
      "I O waits, and inside many C libraries.",
      { say: "A thousand LLM calls?", hold: 3 },
      "Asyncio, a semaphore, timeouts, and backoff.",
      { say: "A blocking call inside async code?", hold: 3 },
      "Await asyncio dot to thread.",
      { say: "Validate the model's JSON with?", hold: 3 },
      "Pydantic. Model validate json, at the boundary.",
    ),
  },
  {
    kind: "sayit",
    q: "\"Tell me about the Python behind a GenAI service you'd build.\"",
    lines: [
      "Model calls are I/O-bound, so the service is async: one shared httpx client, a semaphore per provider, timeouts on every call.",
      "Transient failures go through a retry decorator: backoff with jitter, only rate limits and timeouts.",
      "Large corpora are read with generators and embedded in batches, so memory stays flat.",
      "CPU-heavy parsing runs in a process pool, off the event loop.",
      "Everything the model returns is validated with Pydantic at the boundary, and answers are cached in a bounded LRU or Redis.",
    ],
    beats: B(
      { say: "And to finish, the open question that ties it all together. Tell me about the Python behind a GenAI service you'd build. Here's an answer that touches every topic.", tone: "ask" },
      "Model calls are I O bound, so the service is async: one shared HTTP client, a semaphore per provider, and a timeout on every call.",
      "Transient failures go through a retry decorator, with exponential backoff and jitter, retrying only rate limits and timeouts.",
      "Large corpora are read with generators and embedded in batches, so memory stays flat whatever the size.",
      "CPU heavy parsing runs in a process pool, off the event loop.",
      { say: "And everything the model returns is validated with Pydantic at the boundary, with answers cached in a bounded LRU, or Redis across servers.", tone: "key" },
    ),
  },
  {
    kind: "big",
    tone: "idea",
    lead: "That's the Python",
    text: "Names point to objects. Functions wrap functions. Generators wait to be asked. Await steps aside.",
    after: "next: the FastAPI lecture puts AskDocs behind an API",
    beats: B(
      "That's the Python.",
      { say: "Four sentences carry most of it. Names point to objects. Functions wrap functions. Generators wait to be asked. And await steps aside.", tone: "key" },
      "In the FastAPI lecture, we put AskDocs behind an API: streaming tokens, dependencies, and the async mistakes that freeze a server. See you there.",
    ),
  },
];
