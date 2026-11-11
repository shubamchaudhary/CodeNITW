import type { Scene } from "../../lib/types.ts";
import { B, check, custom, q, sec } from "./h.ts";

// Part 5: module 9 (type hints and Pydantic), module 10 (testing), module 11
// (the classic coding questions), then a rapid-fire round and the close.
export const p5: Scene[] = [
  // ================================================================ module 9
  sec("9", "Type hints and Pydantic", "Module nine. Type hints and Pydantic. Three questions, and one idea: hints describe, and something else has to check."),
  custom(
    "pypipe",
    {
      title: "The idea: hints describe; tools and Pydantic check",
      stages: [
        { name: "Type hints", icon: "🏷️", sub: "def f(x: int) -> str" },
        { name: "Python itself", icon: "🐍", sub: "ignores them at runtime" },
        { name: "mypy / pyright", icon: "🔍", sub: "check before running" },
        { name: "Pydantic", icon: "🛡️", sub: "checks at runtime, at the boundary" },
      ],
      steps: [
        { at: 0, text: "A type hint describes what a function expects and returns. It's documentation the tools can read." },
        { at: 1, text: "Python does not enforce it: f(\"hello\") runs, and fails later, or not at all.", fail: true },
        { at: 2, text: "Static checkers read the hints and catch mistakes before the code ever runs: in the editor and in CI." },
        { at: 3, text: "Pydantic reads the same hints at runtime, and validates real data as it enters: requests, config, LLM output." },
      ],
    },
    B(
      "Here's the idea. A type hint describes what a function expects, and what it returns.",
      "But Python itself doesn't enforce hints. Call f with a string instead of an int, and it runs anyway, and fails later, or silently does the wrong thing.",
      "Static type checkers, like mypy and pyright, read the hints and catch mistakes before the code runs, in your editor and in CI.",
      { say: "And Pydantic reads the very same hints at runtime, and uses them to validate real data as it comes in from outside. Describe once, checked twice.", tone: "key" },
    ),
  ),

  // ---- Q57 (py54)
  q(57, 1, "How do type hints work in Python, and are they enforced?", "not enforced at runtime; checked by tools; read by libraries", "Question fifty seven. How do type hints work in Python, and are they enforced?", "The direct answer is no, and then what they're good for anyway."),
  {
    kind: "code",
    title: "Hints: not enforced, but very useful",
    lang: "python",
    code: `def top_k(scores: dict[str, float], k: int = 3) -> list[str]:
    return sorted(scores, key=scores.get, reverse=True)[:k]

top_k({"a": 1.0}, "3")     # runs, then fails inside sorted()

from typing import Optional, TypedDict, Literal
def find(id: int) -> Optional[User]: ...      # or User | None
class Msg(TypedDict):
    role: Literal["system", "user", "assistant"]
    content: str`,
    highlight: [[1, 2], [4, 4], [6, 10]],
    beats: B(
      "Hints are annotations: built-in generics like dict of str to float, and a return type.",
      "And they're not enforced. Pass a string for k, and Python runs it, and it fails deep inside sorted, with a confusing error. The hint is stored in dunder annotations, and that's all.",
      { say: "So what are they for? Mypy and pyright catch the mistake before you run it. Editors autocomplete from them. And libraries like Pydantic and FastAPI read them at runtime to validate and convert data. Know optional, or the pipe None form, TypedDict for dict-shaped data, and Literal for a fixed set of values.", tone: "key" },
    ),
  },

  // ---- Q58 (py55)
  q(58, 2, "What is Pydantic, and why is it used?", "validation and parsing from type hints, at the boundary", "Question fifty eight, asked twice. What is Pydantic, and why is it used?", "What it does, the few features to name, and where it belongs."),
  {
    kind: "code",
    title: "Pydantic: declare the shape, get validation",
    lang: "python",
    code: `from pydantic import BaseModel, Field, ValidationError

class Chunk(BaseModel):
    id: str
    text: str = Field(min_length=1)
    score: float = Field(ge=0, le=1)
    tags: list[str] = []

Chunk.model_validate({"id": "7", "text": "hi", "score": "0.9"})
# Chunk(id='7', text='hi', score=0.9, tags=[])   "0.9" → 0.9

Chunk.model_validate({"id": "7", "text": "", "score": 3})
# ValidationError: text too short; score must be ≤ 1

chunk.model_dump()   # back to a dict;  model_dump_json() to JSON`,
    highlight: [[3, 7], [9, 10], [12, 13], [15, 15]],
    beats: B(
      "Pydantic is a validation and parsing library driven by type hints. You declare a model as a class: the fields, their types, and constraints with Field, like a minimum length, or a score between zero and one.",
      "Model validate takes raw data, checks it, and converts safe cases. The string zero point nine becomes the float zero point nine. You get a typed object back.",
      "Bad data raises a validation error that lists every problem, with where it is. That error is precise enough to show to a user, or to send back to an LLM.",
      { say: "And model dump turns it back into a dict or JSON. Pydantic version two has a core written in Rust, so it's fast. It's used for API bodies, which is the whole of FastAPI, for settings, and for parsing LLM output. Anywhere data crosses a boundary.", tone: "key" },
    ),
  },

  // ---- Q59 (py64)
  q(59, null, "The LLM returned JSON. How do you make sure it has the shape you expect, and what do you do when it doesn't?", "treat it as untrusted input: validate, feed the error back, bounded retries", "Question fifty nine. The LLM returned JSON. How do you make sure it has the shape you expect, and what do you do when it doesn't?", "Treat model output as untrusted input, validate it at the boundary, and have a bounded repair loop."),
  custom(
    "pypipe",
    {
      title: "Validate the model's answer, and repair it a bounded number of times",
      stages: [
        { name: "Prompt + schema", icon: "📝", sub: "show the model the shape" },
        { name: "LLM", icon: "🤖", sub: "returns text" },
        { name: "model_validate_json", icon: "🛡️", sub: "parse + validate" },
        { name: "Typed object", icon: "✅", sub: "the rest of the code" },
      ],
      steps: [
        { at: 0, text: "Put the JSON schema in the prompt, from Answer.model_json_schema(), or use the provider's structured-output mode." },
        { at: 1, text: "The model returns text. Even in JSON mode, treat it as untrusted input, like anything a user sends." },
        { at: 2, text: "Validate it with Pydantic: a missing field, a wrong type, a confidence of 7 all fail with a precise error.", fail: true },
        { at: [0, 1], text: "On failure, append the error to the prompt (“your JSON was invalid: …”) and ask again, at most 2 or 3 times; then raise.", back: true },
        { at: 3, text: "On success, everything after this point gets a typed, checked object. Log the failure rate: a jump means a prompt or model change broke something." },
      ],
    },
    B(
      "First, tell the model the shape. Put the JSON schema in the prompt, which Pydantic generates for you, or use the provider's structured output or tool calling mode.",
      "The model returns text. Even in JSON mode, treat it as untrusted input, exactly like something a user typed.",
      "Validate it with model validate json. Json loads would only prove it's JSON. Pydantic checks the required fields, the types and the ranges, and gives a precise error.",
      "If it fails, send that error back to the model, saying your JSON was invalid, here's why, return only JSON matching the schema. And ask again, but a bounded number of times, two or three, then raise.",
      { say: "Once it passes, the rest of the code gets a typed object instead of a dict that might be missing keys. And log validation failures: a rising rate is the first sign that a prompt or model change broke something.", tone: "key" },
    ),
  ),
  check({
    topic: "type hints",
    q: "def area(r: float) -> float: … and you call area(\"2\"). What happens?",
    say: "A function area takes r, hinted as float. You call it with the string two. What happens?",
    options: ["TypeError before it runs", "It runs; hints aren't enforced", "Python converts \"2\" to 2.0", "mypy stops the program"],
    oSay: ["a type error before it runs", "it runs, hints aren't enforced", "Python converts the string to two point oh", "mypy stops the program"],
    answer: 1,
    a: "It runs: hints aren't enforced at runtime. It fails (or misbehaves) inside, where the string is used. mypy would have flagged it before running.",
    aSay: "B. It runs, because Python doesn't enforce hints. It fails, or misbehaves, wherever the string is used inside. Mypy would have caught it before running, and Pydantic would have validated it at a boundary.",
  }),

  // ================================================================ module 10
  sec("10", "Testing", "Module ten. Testing. Two questions: how pytest works, and how you replace the parts of a system you don't want to call in a test, like a paid LLM API."),
  {
    kind: "seq",
    title: "The idea: pytest builds what a test asks for, then cleans up",
    actors: [
      { id: "p", name: "pytest", icon: "🧪" },
      { id: "f", name: "fixture db()", icon: "🧰", tone: "amber" },
      { id: "t", name: "test_save(db)", icon: "✅", tone: "green" },
    ],
    msgs: [
      { from: "p", to: "f", label: "the test names db: run the fixture up to its yield", step: 0, tone: "amber" },
      { from: "p", to: "t", label: "call the test with the yielded value", step: 1, tone: "green" },
      { from: "p", to: "f", label: "after the test: run the code after yield (teardown)", step: 2, tone: "amber" },
    ],
    beats: B(
      "Here's the idea behind pytest. A test asks for what it needs, by naming it as a parameter. This test names db. Pytest finds the fixture called db, and runs it up to its yield.",
      "Then it calls the test, passing in whatever the fixture yielded.",
      { say: "And after the test, pass or fail, it runs the rest of the fixture, after the yield. That's the teardown. It's the context manager pattern from module six, applied to tests.", tone: "key" },
    ),
  },

  // ---- Q60 (py56)
  q(60, 1, "How do you test Python code with pytest (fixtures, parametrize)?", "plain asserts, fixtures with scopes, parametrize, and raises", "Question sixty. How do you test Python code with pytest? Fixtures and parametrize.", "Plain asserts, fixtures and their scopes, parametrize, and testing that something raises."),
  {
    kind: "code",
    title: "pytest: plain asserts, fixtures, parametrize",
    lang: "python",
    code: `@pytest.fixture(scope="session")      # built once per test run
def model():
    return load_small_model()

@pytest.fixture
def db(tmp_path):                       # fixtures use fixtures
    conn = connect(tmp_path / "test.db")
    yield conn                          # the test runs here
    conn.close()                        # teardown

@pytest.mark.parametrize("text, n", [("a b", 2), ("", 0), ("  x ", 1)])
def test_count_words(text, n):
    assert count_words(text) == n       # plain assert, rich diffs

def test_rejects_empty():
    with pytest.raises(ValueError, match="empty"):
        embed("")`,
    highlight: [[1, 3], [5, 9], [11, 13], [15, 17]],
    beats: B(
      "Fixtures have a scope. Function scope is the default, a fresh one per test. Session scope builds it once for the whole run, which is right for something expensive, like a model.",
      "Fixtures can use other fixtures, like the built-in tmp path. And code after the yield is the teardown.",
      "Parametrize runs one test function over a table of inputs and expected outputs, each reported as its own test. And tests use plain assert: pytest rewrites it to show exactly what differed.",
      { say: "And to test that something fails, use pytest dot raises as a context manager, optionally matching the message. Shared fixtures go in a conftest dot py file, and pytest finds them automatically.", tone: "key" },
    ),
  },

  // ---- Q61 (py57)
  q(61, null, "How do you mock dependencies in Python tests?", "fakes, mock.patch where the name is looked up, and dependency injection", "Question sixty one. How do you mock dependencies in Python tests?", "The tools, the one rule that trips everyone up, and the design that makes mocking easy."),
  {
    kind: "code",
    title: "Patch where it's looked up, or better, inject it",
    lang: "python",
    code: `# app/answer.py
from app.llm import complete
def answer(q): return complete(q).strip()

# test: patch the name answer() actually uses
from unittest.mock import patch
def test_answer():
    with patch("app.answer.complete", return_value=" hi ") as m:
        assert answer("q") == "hi"
        m.assert_called_once_with("q")

# better: pass the dependency in, and hand it a fake
def answer(q, llm: ChatModel): return llm.complete(q).strip()
assert answer("q", FakeModel()) == "canned answer"`,
    highlight: [[1, 3], [5, 10], [12, 14]],
    beats: B(
      "Here, answer imports complete from the llm module, and calls it. In a test, we don't want a real, slow, paid API call.",
      "Unittest dot mock's patch replaces a name for the duration of the with block, with a mock that returns what you choose, and records how it was called. The rule that trips everyone up: patch where the name is looked up, not where it's defined. Answer did from import, so it has its own name, complete, in app dot answer. That's the one to patch.",
      { say: "And the better design: pass the dependency in, and in tests, hand it a fake that implements the same Protocol. No patching at all. FastAPI's dependency overrides are this same idea. Pytest's monkeypatch fixture is the other common tool, for setting attributes and environment variables.", tone: "key" },
    ),
  },
  check({
    topic: "mocking",
    q: "service.py does `from clients import fetch`. You patch \"clients.fetch\". Why does service still call the real one?",
    say: "Service dot py does, from clients import fetch. You patch clients dot fetch. Why does service still call the real one?",
    a: "from-import copied the reference into service's own namespace. Patch \"service.fetch\": where it's looked up.",
    aSay: "Because from import copied the reference into service's own namespace when it was imported. Patching clients dot fetch changes a different name. Patch service dot fetch, where the name is looked up.",
  }),

  // ================================================================ module 11
  sec("11", "Classic Python coding questions", "Module eleven. The classic coding questions. Interviews for Python roles mix in coding: predict the output, implement an LRU cache, process a huge file, and fetch many URLs at once. The LRU cache alone was asked six times."),
  {
    kind: "bullets",
    title: "The idea: a handful of tools solves most coding rounds",
    items: [
      { icon: "🗂️", text: "dict / Counter / defaultdict", sub: "count, group, look up in O(1): two sum, anagrams, frequencies" },
      { icon: "👀", text: "set", sub: "seen before? duplicates, visited nodes" },
      { icon: "👉👈", text: "two pointers and sliding windows", sub: "on arrays and strings, in one pass" },
      { icon: "⛰️", text: "heapq", sub: "top k, the k-th largest, merging sorted lists, schedulers" },
      { icon: "↔️", text: "deque", sub: "BFS, queues, fixed-size windows" },
    ],
    beats: B(
      "Here's the idea for coding rounds in Python. A handful of tools solves most problems. Dicts, Counters and defaultdicts, to count, group and look things up in constant time. Two sum, anagrams, word frequencies.",
      "Sets, for: have I seen this before?",
      "Two pointers and sliding windows, to walk an array or string once instead of twice.",
      "Heapq, for top k, the k-th largest, and merging sorted streams.",
      { say: "And deque, for breadth-first search and queues. When you read a problem, ask which of these five it needs. On the page, each one has an exercise you can run in the browser.", tone: "key" },
    ),
  },
  custom(
    "pytape",
    {
      title: "A sliding window: longest substring without repeats",
      sub: "\"abcabcbb\" → 3",
      cells: ["a", "b", "c", "a", "b", "c", "b", "b"],
      steps: [
        { ptr: 0, ptr2: 0, range: [0, 1], label: "left", label2: "right", out: "window \"a\", best 1" },
        { ptr: 0, ptr2: 2, range: [0, 3], label: "left", label2: "right", out: "window \"abc\", best 3", note: "grow the right edge while every character is new" },
        { ptr: 1, ptr2: 3, range: [1, 4], label: "left", label2: "right", out: "\"a\" repeats: move left past it → \"bca\"", note: "a repeat: jump the left edge just past the earlier copy (a dict of last positions)" },
        { ptr: 7, ptr2: 7, range: [7, 8], label: "left", label2: "right", out: "best = 3, in one pass: O(n)" },
      ],
    },
    B(
      "One picture for the sliding window, since it shows up so often. The longest substring without repeating characters. A window with a left and a right edge.",
      "Move the right edge forward while every character is new. A, b, c: best so far, three.",
      "The next a is a repeat. Instead of starting over, jump the left edge just past the earlier a. A dict of each character's last position makes that jump instant.",
      { say: "One pass over the string, so linear time. Grow the right edge, shrink the left when a rule breaks, and track the best. That's every sliding window problem.", tone: "key" },
    ),
  ),

  // ---- Q62 (py62)
  q(62, null, "Predict the output: the Python gotchas interviewers like", "each one is a module of this lecture in disguise", "Question sixty two. Predict the output: the Python gotchas interviewers like.", "Every one of these is a module of this lecture in disguise. Let's do them as a rapid-fire round. Answer each before I do."),
  {
    kind: "drill",
    items: [
      { q: "def f(x=[]): x.append(1); return x. f(); f() → ?", a: "[1, 1]: the default list is made once" },
      { q: "a = [[0] * 2] * 2; a[0][0] = 5; a → ?", a: "[[5, 0], [5, 0]]: two names for one row" },
      { q: "[f() for f in [lambda: i for i in range(3)]] → ?", a: "[2, 2, 2]: closures read i late" },
      { q: "t = (1, [2]); t[1] += [3] → ?", a: "TypeError, yet t is (1, [2, 3]): the list changed, then the tuple assignment failed" },
      { q: "g = (x for x in [1, 2]); sum(g), sum(g) → ?", a: "3 and 0: a generator is used up" },
      { q: "for x in lst: if x % 2 == 0: lst.remove(x) → safe?", a: "No: it skips items. Build a new list (a comprehension) instead" },
    ],
    beats: B(
      { say: "One. A function with a default empty list appends one and returns it. You call it twice. What does the second call return?", hold: 3 },
      "A list with one, one. The default list is made once, when def runs, and shared.",
      { say: "Two. A list containing zero times two, then times two. Set the first cell to five. What's a?", hold: 3 },
      "Five zero, five zero. The outer times two repeated a reference to one row.",
      { say: "Three. Lambdas in a loop returning i, each called. What comes back?", hold: 3 },
      "Two, two, two. The closures read i when called, after the loop ended.",
      { say: "Four. A tuple holding one and a list with two. You do t of one plus equals a list with three. What happens?", hold: 3 },
      "Both things. A type error is raised, because tuples don't support item assignment. But the list inside was already extended, so t now shows two and three. Plus equals on a list mutates it first, then the assignment back into the tuple fails.",
      { say: "Five. A generator expression over one and two. You sum it twice. What are the two sums?", hold: 3 },
      "Three, then zero. The first sum used the generator up.",
      { say: "Six. You loop over a list and remove the even numbers from it, inside the loop. Is that safe?", hold: 3 },
      { say: "No. Removing shifts the items left, so the loop skips the one after each removal. Build a new list with a comprehension instead.", tone: "key" },
    ),
  },

  // ---- Q63 (py58)
  q(63, 6, "Implement an LRU cache.", "O(1) get and put: a hash map plus an order", "Question sixty three, asked in six write-ups. Implement an LRU cache.", "Both get and put in constant time. The trick is combining a hash map with an order you can change in constant time."),
  custom(
    "pytape",
    {
      title: "LRU: keep keys in order of use, evict from the old end",
      sub: "capacity 3  ·  left = least recently used, right = most recent",
      idx: false,
      cells: ["a", "b", "c"],
      steps: [
        { cells: ["a", "b", "c"], note: "put a, b, c: each new key goes to the recent end" },
        { cells: ["b", "c", "a"], pick: [2], out: "get(a) → hit: move a to the recent end", note: "every use moves the key to the right" },
        { cells: ["c", "a", "d"], pick: [2], out: "put(d): full → evict b, the least recently used", note: "full: drop the leftmost key, add the new one on the right" },
        { cells: ["c", "a", "d"], out: "dict finds a key in O(1); the order must also move in O(1)" },
      ],
    },
    B(
      "An LRU cache, least recently used, keeps at most a fixed number of items, and when it's full, it throws out the one used longest ago. Picture the keys in order of use: oldest on the left, most recent on the right. Put a, b and c.",
      "Get a: it's a hit, so a becomes the most recently used, and moves to the right end.",
      "Now put d. The cache is full, so evict from the left: b, the least recently used. And d goes on the right.",
      { say: "To make all of this constant time, you need two things: a hash map to find any key instantly, and an order where you can move a key to the end, or drop the first one, instantly. A dict plus a doubly linked list. Or in Python, OrderedDict, which is exactly that.", tone: "key" },
    ),
  ),
  {
    kind: "code",
    title: "LRU cache with OrderedDict",
    lang: "python",
    code: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.data = OrderedDict()

    def get(self, key):
        if key not in self.data:
            return -1
        self.data.move_to_end(key)          # now the most recent
        return self.data[key]

    def put(self, key, value):
        self.data[key] = value
        self.data.move_to_end(key)
        if len(self.data) > self.cap:
            self.data.popitem(last=False)   # evict the oldest`,
    highlight: [[3, 6], [8, 12], [14, 18]],
    beats: B(
      "In Python, the clean implementation uses OrderedDict, which keeps a hash table plus a doubly linked list of its keys.",
      "Get: if the key is missing, return minus one. Otherwise, move it to the end, marking it most recent, and return the value.",
      { say: "Put: set the value, move it to the end, and if we're over capacity, pop the first item, which is the least recently used. Every step is constant time. If the interviewer says no OrderedDict, build the same thing: a dict from key to node, and a doubly linked list with dummy head and tail nodes. And mention functools dot lru cache, which does this for functions.", tone: "key" },
    ),
  },

  // ---- Q64 (py67)
  q(64, null, "How would you cache LLM responses? What makes a good cache key?", "everything that changes the answer goes in the key; bound it; mind privacy", "Question sixty four. How would you cache LLM responses? What makes a good cache key?", "The key must include everything that changes the answer. Then where the cache lives, and its limits."),
  {
    kind: "code",
    title: "Hash everything that changes the answer",
    lang: "python",
    code: `def cache_key(model, messages, temperature, **params) -> str:
    payload = json.dumps(
        {"model": model, "messages": messages,
         "temperature": temperature, **params},
        sort_keys=True, separators=(",", ":"))     # stable string
    return "llm:" + hashlib.sha256(payload.encode()).hexdigest()

async def cached_complete(client, redis, **req):
    key = cache_key(**req)
    if (hit := await redis.get(key)) is not None:
        return json.loads(hit)
    reply = await client.complete(**req)
    await redis.set(key, json.dumps(reply), ex=24 * 3600)   # a TTL
    return reply`,
    highlight: [[1, 6], [8, 14]],
    beats: B(
      "The key must include everything that changes the answer: the model and its version, the full messages including the system prompt, the temperature and other sampling settings, and any tool definitions. Serialise it stably, with sorted keys, and hash it.",
      { say: "Then the cache. In one process, a bounded LRU. Across servers, Redis with a time to live, because answers go stale. Cache only deterministic enough calls, like temperature zero. Never share cached answers across users when the prompt holds private data, unless the user is in the key. And a semantic cache, matching similar questions by embedding, catches paraphrases, but needs a threshold and evaluation.", tone: "key" },
    ),
  },

  // ---- Q65 (py59)
  q(65, 1, "Write a word-frequency counter for a large file.", "stream it, count with Counter, top k with a heap", "Question sixty five. Write a word frequency counter for a large file.", "The word large is the whole question: stream it, don't load it."),
  {
    kind: "code",
    title: "Stream the file, count, take the top k",
    lang: "python",
    code: `import re
from collections import Counter

WORD = re.compile(r"[a-z']+")

def top_words(path, k=10):
    counts = Counter()
    with open(path, encoding="utf-8") as f:
        for line in f:                       # one line in memory
            counts.update(WORD.findall(line.lower()))
    return counts.most_common(k)             # a heap: O(n log k)`,
    highlight: [[4, 4], [6, 10], [11, 11]],
    beats: B(
      "A compiled regular expression defines what a word is, and lowercasing makes the count case-insensitive.",
      "The key line: for line in f. A file object is an iterator over lines, so the file is streamed, one line in memory at a time, never read whole. Counter dot update adds each line's words.",
      { say: "And most common of k uses a heap, so it's n log k, not a full sort. Follow-ups: for many files, count each in a separate process and add the Counters together, which is map-reduce. And the memory that grows is the vocabulary, not the file.", tone: "key" },
    ),
  },

  // ---- Q66 (py60)
  q(66, 5, "Write an async function that fetches many URLs with a concurrency limit, retries and timeouts.", "one shared client, a semaphore, a timeout per call, retries with backoff, errors collected", "Question sixty six, asked in five write-ups, and the one that ties the lecture together. Write an async function that fetches many URLs with a concurrency limit, retries and timeouts.", "Five pieces: one shared client, a semaphore, a timeout on every call, retries with backoff on transient errors only, and errors collected instead of crashing the batch."),
  {
    kind: "code",
    title: "fetch_all: limit, timeout, retry, collect",
    lang: "python",
    code: `async def fetch_all(urls, limit=10, tries=3):
    sem = asyncio.Semaphore(limit)
    async with httpx.AsyncClient(timeout=10) as client:   # one pool

        async def fetch(url):
            async with sem:                                # ≤ limit
                for attempt in range(tries):
                    try:
                        r = await client.get(url)
                        r.raise_for_status()
                        return url, r.text
                    except (httpx.TransportError, httpx.HTTPStatusError) as e:
                        if attempt == tries - 1:
                            return url, e                  # collect it
                        await asyncio.sleep(2 ** attempt + random.random())

        return await asyncio.gather(*(fetch(u) for u in urls))`,
    highlight: [[1, 3], [5, 6], [7, 11], [12, 15], [17, 17]],
    beats: B(
      "One async client for everything, created once, so connections are pooled and reused, with a timeout on every request. Creating a client per URL is a classic mistake.",
      "A semaphore, so no more than ten requests are in flight at once.",
      "Each fetch tries a few times. Raise for status turns a 5 hundred response into an exception.",
      "On a transport error or a bad status, wait with exponential backoff and jitter, using asyncio dot sleep, never time dot sleep. After the last try, return the error instead of raising, so one bad URL doesn't sink the batch. In a real answer, retry only 429s and 5 hundreds, not 404s.",
      { say: "And gather runs them all, returning the results in order. Every piece of this came from the lecture: generators for the shape, decorators for retries, the event loop, the semaphore, and errors handled on purpose.", tone: "key" },
    ),
  },
  {
    kind: "sayit",
    q: "Fetch many URLs concurrently, safely?",
    lines: [
      "One shared AsyncClient: connection pooling, and a timeout on every request.",
      "A Semaphore caps how many requests are in flight.",
      "Retries only on transient errors, with exponential backoff and jitter.",
      "gather or a TaskGroup runs them; failures are collected, not fatal to the batch.",
      "For huge lists: a queue with a fixed number of workers, so tasks aren't all created at once.",
    ],
    beats: B(
      { say: "And the summary to say out loud.", tone: "ask" },
      "I'd use one shared async client, for connection pooling, with a timeout on every request.",
      "A semaphore to cap how many requests are in flight at once.",
      "Retries only on transient errors, with exponential backoff and jitter.",
      "Gather, or a TaskGroup, to run them, with each failure collected rather than failing the whole batch.",
      { say: "And for a really huge list, a queue with a fixed number of worker tasks, so I'm not creating a million tasks up front.", tone: "key" },
    ),
  },
  check({
    topic: "LRU",
    q: "Why does an O(1) LRU cache need a linked list as well as a dict?",
    say: "Why does a constant time LRU cache need a linked list, as well as a dict?",
    a: "The dict finds a key in O(1), but can't reorder; the doubly linked list moves a node to the end and drops the oldest in O(1). OrderedDict is both.",
    aSay: "Because the dict finds a key instantly, but can't tell you which key is oldest, or move one to the end. A doubly linked list moves a node to the end, and removes the oldest, in constant time. OrderedDict is both of them in one.",
  }),

  // ================================================================ close
  {
    kind: "drill",
    items: [
      { q: "b = a for a list, then b.append(1). Does a change?", a: "Yes: one object, two names" },
      { q: "Why can't a list be a dict key?", a: "It's mutable, so it isn't hashable" },
      { q: "@deco above def f means?", a: "f = deco(f)" },
      { q: "What does calling a generator function run?", a: "Nothing, until next()" },
      { q: "CPU-bound work: threads or processes?", a: "Processes: the GIL" },
      { q: "When is an object freed in CPython?", a: "When its refcount hits zero (cycles: by gc)" },
    ],
    beats: B(
      { say: "A last rapid-fire round, across the whole lecture. B equals a, for a list, then b dot append one. Does a change?", hold: 3 },
      "Yes. One object, two names.",
      { say: "Why can't a list be a dictionary key?", hold: 3 },
      "Because it's mutable, so it isn't hashable.",
      { say: "What does at deco above def f mean?", hold: 3 },
      "F equals deco of f.",
      { say: "What does calling a generator function run?", hold: 3 },
      "Nothing at all, until the first next.",
      { say: "CPU-bound work: threads or processes?", hold: 3 },
      "Processes, because of the GIL.",
      { say: "When is an object freed in CPython?", hold: 3 },
      "When its reference count hits zero. Cycles are freed by the garbage collector.",
    ),
  },
  {
    kind: "bullets",
    title: "Where to go from here",
    items: [
      { icon: "📖", text: "Each module page has this lecture's part for it", sub: "the Watch card starts at that module" },
      { icon: "🧠", text: "Read the module's theory, then the answers", sub: "the same pictures and words as here" },
      { icon: "⌨️", text: "Do the exercises in the browser", sub: "one per important concept: decorators, generators, LRU…" },
      { icon: "🎤", text: "Say the model answers out loud", sub: "speaking them is the practice that shows in interviews" },
    ],
    beats: B(
      "That's the whole Python page, module by module. Every module page has a watch card that starts this lecture at that module, so you can rewatch just the part you need.",
      "On each page, read the module's theory first. It uses the same pictures and words as this lecture. Then the answers.",
      "Then do the exercises, which run right in the browser. There's one for each important concept.",
      { say: "And say the model answers out loud, more than once. Knowing an answer and saying it smoothly under pressure are different skills, and only the second one shows in an interview. Good luck.", tone: "key" },
    ),
  },
];
