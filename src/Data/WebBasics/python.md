## Python basics and the data model

### py01 | How is Python different from Java?

| | Python | Java |
|---|---|---|
| Typing | **dynamic** (types belong to values, checked at runtime); optional type hints | **static** (checked at compile time) |
| Execution | CPython compiles source to **bytecode** (`.pyc`) and **interprets** it in a VM; no JIT by default | compiled to bytecode, run on the JVM with a powerful **JIT** |
| Speed | slower for CPU-heavy pure-Python code; fast when the work is in C libraries (NumPy) | generally much faster for CPU work |
| Concurrency | the **GIL** stops threads running Python bytecode in parallel (free-threaded builds are optional from 3.13/3.14) | real parallel threads |
| Syntax | indentation defines blocks; very concise | braces, more ceremony |
| Everything is an object | yes: ints, functions, classes, modules | primitives (`int`) are not objects |
| Memory | reference counting + a cycle-detecting GC | tracing, generational GC |
| Interfaces | **duck typing** ("if it quacks..."); ABCs and Protocols optional | explicit interfaces |
| Packaging | pip / venv / pyproject | Maven / Gradle |

```python
# Java: List<Integer> nums = new ArrayList<>(); for (int n : nums) ...
nums = [3, 1, 2]
squares = [n * n for n in nums if n > 1]   # comprehension instead of a loop
```

Interview angle: Python trades raw speed for developer speed, a huge ecosystem (data, ML, scripting, web), and readability. CPU-heavy hot paths are pushed into C extensions, multiprocessing, or other services.

### py02 | What does "everything is an object" mean, and how do names and references work?

In Python, **variables are names bound to objects**, not boxes that hold values. Every value (int, string, list, function, class) is an object with an **identity** (`id()`), a **type** and a **value**.

```python
a = [1, 2, 3]
b = a            # b is another NAME for the same list object
b.append(4)
print(a)         # [1, 2, 3, 4]
print(a is b)    # True: same object

x = 10
y = x
y += 1           # ints are immutable: y is rebound to a NEW object 11
print(x)         # 10
```

**Argument passing is "pass by object reference"** (also called call by sharing): the function receives a reference to the same object.
- **Mutating** a mutable argument is visible to the caller.
- **Rebinding** the parameter name inside the function is not.

```python
def modify(lst):
    lst.append(99)    # visible outside
    lst = [0]         # rebinding: invisible outside

data = [1]
modify(data)
print(data)           # [1, 99]
```

This is the same mental model as Java object references, except that in Python **everything** (including ints) works this way.

### py03 | Which types are mutable and which are immutable, and why does it matter?

| Immutable | Mutable |
|---|---|
| `int`, `float`, `complex`, `bool` | `list` |
| `str`, `bytes` | `dict` |
| `tuple`, `frozenset` | `set` |
| `None` | `bytearray`, most user-defined objects |

Why it matters:
1. **Dict keys and set members must be hashable**, which in practice means immutable. `{(1, 2): "ok"}` works; `{[1, 2]: "x"}` raises `TypeError: unhashable type: 'list'`.
2. **Shared references**: mutating a list affects every name that points to it; "changing" an int or string always creates a new object.
3. **Thread safety and caching**: immutable objects can be shared freely.
4. **Augmented assignment differs**:
```python
t = (1, 2)
t += (3,)        # creates a new tuple, rebinds t
l = [1, 2]
l2 = l
l += [3]         # extends IN PLACE (list.__iadd__): l2 sees it too
print(l2)        # [1, 2, 3]
```

Subtle point: a tuple is immutable, but if it **contains** a list, that list can still change: `t = ([1],); t[0].append(2)` works. Such a tuple isn't hashable.

### py04 | What is the difference between `is` and `==`?

- `==` compares **values** (calls `__eq__`).
- `is` compares **identity**: are both names the same object (same `id()`)?

```python
a = [1, 2]
b = [1, 2]
a == b      # True: equal contents
a is b      # False: two different list objects

c = a
c is a      # True

x = None
x is None   # the correct way to check for None (None is a singleton)
```

**The small-integer and string interning trap**: CPython caches small ints (-5 to 256) and some strings, so `is` can *accidentally* be True:

```python
a = 256; b = 256
a is b      # True (cached)
a = 1000; b = 1000
a is b      # may be False: implementation detail, never rely on it
```

Rule: use `is` only for singletons (`None`, `True`, `False`, sentinel objects). Use `==` for everything else.

### py05 | What is the difference between a shallow copy and a deep copy?

- **Assignment** (`b = a`) copies nothing: both names point to the same object.
- **Shallow copy**: a new outer container, but the **elements are the same objects** (nested mutables are shared).
- **Deep copy**: recursively copies everything, so nothing is shared.

```python
import copy

original = [[1, 2], [3, 4]]

shallow = copy.copy(original)      # also: original[:], list(original), original.copy()
shallow[0].append(99)
print(original)                    # [[1, 2, 99], [3, 4]]  <- inner list shared!

deep = copy.deepcopy(original)
deep[0].append(100)
print(original)                    # unchanged
```

`deepcopy` handles circular references (it keeps a memo of copied objects) and can be customised with `__copy__` / `__deepcopy__`. It's slower and uses more memory, so use it only when you really need independent nested data.

Dicts: `d.copy()` and `{**d}` are shallow; sets: `s.copy()`.

### py06 | What is the mutable default argument problem?

**Default values are evaluated once, when the function is defined**, not on each call. A mutable default (list, dict) is therefore **shared across calls**.

```python
def add_item(item, bucket=[]):     # BUG
    bucket.append(item)
    return bucket

add_item(1)   # [1]
add_item(2)   # [1, 2]   <- the same list from the previous call!

# FIX: use None as a sentinel
def add_item(item, bucket=None):
    if bucket is None:
        bucket = []
    bucket.append(item)
    return bucket
```

You can see the shared object: `add_item.__defaults__`.

The same "evaluated once" rule applies to things like `def log(msg, when=datetime.now())`: the timestamp is fixed at definition time.

This is one of the most frequently asked Python gotchas. Linters (ruff `B006`) flag it.

### py07 | How does Python execute code (CPython, bytecode, the PVM)?

1. **Source → bytecode**: CPython parses your `.py` file into an AST and compiles it to **bytecode**, low-level instructions for a stack-based virtual machine. Imported modules' bytecode is cached in `__pycache__/*.pyc` so the next import skips compilation.
2. **The Python Virtual Machine** (a big evaluation loop in C, `ceval.c`) executes the bytecode one instruction at a time.

```python
import dis
def add(a, b):
    return a + b
dis.dis(add)
#  LOAD_FAST a
#  LOAD_FAST b
#  BINARY_OP + 
#  RETURN_VALUE
```

So Python is "interpreted" in the sense that bytecode is interpreted, not compiled to machine code.

Other implementations and speed-ups:
- **PyPy**: a JIT compiler, often much faster for pure-Python code.
- CPython 3.11+ got a **specialising adaptive interpreter** (10–60% faster), and 3.13 added an experimental **JIT**.
- **Cython / C extensions**: compile hot code to C (NumPy, pandas, pydantic-core in Rust).

Each `a + b` dispatches dynamically on types at runtime, which is the main reason pure-Python loops are slow.

## Built-in data structures

### py08 | What is the difference between a list and a tuple?

| | `list` | `tuple` |
|---|---|---|
| Mutability | mutable | **immutable** |
| Syntax | `[1, 2]` | `(1, 2)` or `1, 2` (the comma makes it; `(1,)` for one element) |
| Hashable (dict key / set member) | no | yes (if its contents are hashable) |
| Memory / speed | a little more memory (over-allocates for growth) | smaller, slightly faster to create |
| Typical meaning | a **homogeneous, variable-length** collection | a **fixed record** of positions: `(lat, lng)`, function returning several values |

```python
point = (12.97, 77.59)
lat, lng = point                 # tuple unpacking
def min_max(nums): return min(nums), max(nums)   # returns a tuple

from typing import NamedTuple
class Point(NamedTuple):         # a tuple with named fields
    x: float
    y: float
p = Point(1, 2); p.x
```

Use a tuple when the data shouldn't change or must be a dict key; use a list when you'll add, remove or sort items.

### py09 | How is a list implemented, and what are the time complexities?

A Python `list` is a **dynamic array of pointers** to objects (like Java's `ArrayList<Object>`). When it fills up, CPython allocates a bigger block (growing by about 1.125× plus a constant) and copies the pointers, so `append` is **amortised O(1)**.

| Operation | Complexity |
|---|---|
| `lst[i]`, `lst[i] = x`, `len(lst)` | O(1) |
| `append(x)`, `pop()` (from the end) | amortised O(1) |
| `insert(0, x)`, `pop(0)`, `del lst[0]` | **O(n)**: everything shifts |
| `x in lst`, `index(x)`, `remove(x)` | O(n) |
| `sort()` | O(n log n) (Timsort, stable) |
| slicing `lst[a:b]` | O(b − a) (creates a copy) |

```python
from collections import deque
q = deque()
q.append(1); q.appendleft(0)   # O(1) at both ends
q.popleft()                    # O(1), use deque for queues, not list.pop(0)
```

Need fast membership checks? Use a `set` (O(1) average). Need a sorted structure with insertions? Use `bisect` on a list, or the `sortedcontainers` package.

### py10 | How does a dict work internally?

A `dict` is a **hash table**:
1. `hash(key)` gives an integer; it picks a slot in an internal array.
2. If the slot is taken by a different key (a **collision**), CPython uses **open addressing**: it probes other slots in a pseudo-random sequence until it finds the key or an empty slot.
3. Equality (`__eq__`) confirms a match when the hashes are equal.
4. When the table is about two-thirds full, it's **resized** (rehashing every key).

Complexity: get, set, delete and `in` are **O(1) on average**, O(n) in the worst case (many collisions).

Since Python 3.7, dicts **preserve insertion order** (a language guarantee). CPython stores entries in a compact array in insertion order, with a separate sparse index table, which also saves memory.

```python
d = {"b": 1, "a": 2}
list(d)                 # ['b', 'a'] insertion order
d.get("x", 0)           # default instead of KeyError
d.setdefault("k", []).append(1)
{**d, "c": 3}           # merge (also d | {"c": 3} in 3.9+)
```

Keys must be **hashable**: immutable, with `__hash__` and `__eq__` that agree (equal objects must have equal hashes). That's why lists can't be keys.

### py11 | What is a set, and when do you use it?

A `set` is an **unordered collection of unique, hashable items**, implemented as a hash table without values. `frozenset` is its immutable (hashable) version.

```python
seen = set()
nums = [3, 1, 3, 2, 1]
unique = set(nums)                 # {1, 2, 3}
ordered_unique = list(dict.fromkeys(nums))  # [3, 1, 2]: dedupe and keep order

a, b = {1, 2, 3}, {2, 3, 4}
a | b    # union {1, 2, 3, 4}
a & b    # intersection {2, 3}
a - b    # difference {1}
a ^ b    # symmetric difference {1, 4}

2 in a   # O(1) average, vs O(n) for a list
```

Use it for: **fast membership tests**, deduplication, comparing groups (common followers, missing ids), and tracking visited nodes in BFS/DFS. Watch out: `{}` is an empty **dict**; an empty set is `set()`.

### py12 | Why are strings immutable, and how should you build strings efficiently?

Strings (`str`) are immutable sequences of Unicode code points. Immutability makes them **hashable** (usable as dict keys), safe to share, and lets CPython intern and cache them.

Consequence: every "modification" creates a new string, so building a string with `+=` in a loop can be **O(n²)**:

```python
# slow pattern (copies the growing string each time)
s = ""
for word in words:
    s += word + ","

# fast: join a list once (O(n))
s = ",".join(words)

# formatting
name, n = "Shubam", 3
f"{name} has {n} items"          # f-strings: fastest and most readable
f"{price:.2f}", f"{n:05d}", f"{value!r}"
```

Useful methods: `split`, `strip`, `replace`, `startswith`, `find` vs `index` (returns -1 vs raises), `lower`/`casefold`, `isdigit`, `partition`, `zfill`.

`str` vs `bytes`: `str` is text, `bytes` is raw binary. Convert with `.encode("utf-8")` / `.decode("utf-8")`, at the boundaries of your program (files, sockets, HTTP).

### py13 | How does slicing work?

`seq[start:stop:step]`: `start` is included, `stop` is **excluded**; negative indexes count from the end; any part can be omitted.

```python
s = [0, 1, 2, 3, 4, 5]
s[1:4]      # [1, 2, 3]
s[:3]       # [0, 1, 2]
s[3:]       # [3, 4, 5]
s[-2:]      # [4, 5]   last two
s[::2]      # [0, 2, 4]
s[::-1]     # [5, 4, 3, 2, 1, 0]  reversed copy
"hello"[::-1]   # "olleh"

s[1:3] = [9, 9, 9]   # slice assignment can change the length
del s[::2]           # delete every other element
```

Key facts:
- Slicing a list **creates a shallow copy**: `copy = s[:]`.
- Out-of-range slices don't raise: `s[10:20]` → `[]` (but `s[10]` raises `IndexError`).
- Objects support slicing through `__getitem__` receiving a `slice` object; NumPy arrays return **views** instead of copies.

### py14 | What are list, dict and set comprehensions, and generator expressions?

A **comprehension** builds a collection from an iterable in one expression: faster and clearer than an append loop.

```python
nums = range(10)

squares = [n * n for n in nums]                     # list
evens = [n for n in nums if n % 2 == 0]             # with a filter
labels = ["even" if n % 2 == 0 else "odd" for n in nums]  # conditional expression
pairs = [(x, y) for x in range(3) for y in range(3) if x != y]  # nested loops

squares_map = {n: n * n for n in nums}              # dict
unique_lens = {len(w) for w in ["a", "bb", "cc"]}   # set

total = sum(n * n for n in nums)                    # GENERATOR expression: lazy, no list built
```

**Generator expression** `( ... )` produces items **lazily, one at a time**: constant memory, ideal for big or streaming data passed into `sum`, `any`, `max`, `"".join`.

Guidelines: keep them simple (one loop and one condition); if it needs several lines of logic, write a normal loop. Comprehension variables don't leak into the enclosing scope (Python 3).

### py15 | What does the collections module give you?

```python
from collections import Counter, defaultdict, deque, OrderedDict, namedtuple, ChainMap

# Counter: counting hashable things
words = "a b a c b a".split()
c = Counter(words)                 # Counter({'a': 3, 'b': 2, 'c': 1})
c.most_common(2)                   # [('a', 3), ('b', 2)]

# defaultdict: no KeyError, creates a default value for missing keys
graph = defaultdict(list)
graph["a"].append("b")             # no need to check whether "a" exists
by_len = defaultdict(int)

# deque: O(1) appends and pops at BOTH ends; a bounded buffer with maxlen
recent = deque(maxlen=3)
for x in range(5): recent.append(x)   # deque([2, 3, 4])

# OrderedDict: move_to_end / popitem(last=False), handy for an LRU cache
lru = OrderedDict()
lru["k"] = 1; lru.move_to_end("k"); lru.popitem(last=False)

# namedtuple: lightweight immutable record
Point = namedtuple("Point", "x y")
```

Interview favourites: word frequency with `Counter`, grouping with `defaultdict(list)`, BFS queues with `deque`, and an **LRU cache** with `OrderedDict`.

### py16 | How do sorting, `key=` and `enumerate`/`zip` work?

```python
nums = [3, 1, 2]
sorted(nums)            # new list [1, 2, 3]; works on any iterable
nums.sort()             # in place, returns None (a classic bug: x = nums.sort())

users = [{"name": "B", "age": 30}, {"name": "A", "age": 30}, {"name": "C", "age": 25}]
sorted(users, key=lambda u: u["age"])                     # by one field
sorted(users, key=lambda u: (-u["age"], u["name"]))       # age desc, then name asc
from operator import itemgetter, attrgetter
sorted(users, key=itemgetter("age", "name"))
max(users, key=lambda u: u["age"])

for i, name in enumerate(["a", "b"], start=1):           # index + value
    print(i, name)

names, ages = ["A", "B"], [30, 25]
for n, a in zip(names, ages):                             # parallel iteration (stops at the shortest)
    print(n, a)
dict(zip(names, ages))                                    # {'A': 30, 'B': 25}
```

Python's sort is **Timsort**: O(n log n), very fast on partly sorted data, and **stable** (equal keys keep their order), so multi-key sorting can also be done in passes. `key=` is computed once per element, which is faster than old-style comparison functions (use `functools.cmp_to_key` if you need one).

## Functions and scope

### py17 | What are *args and **kwargs?

- `*args` collects extra **positional** arguments into a **tuple**.
- `**kwargs` collects extra **keyword** arguments into a **dict**.

```python
def log(level, *args, **kwargs):
    print(level, args, kwargs)

log("INFO", "user", 42, retry=True)   # INFO ('user', 42) {'retry': True}

# unpacking when CALLING
def area(w, h): return w * h
dims = (3, 4)
area(*dims)                        # area(3, 4)
opts = {"w": 3, "h": 4}
area(**opts)                       # area(w=3, h=4)

# typical use: wrappers and decorators that forward everything
def wrapper(*args, **kwargs):
    return original(*args, **kwargs)
```

Parameter order in a definition: `def f(pos_only, /, normal, *args, kw_only, **kwargs)`.
- Parameters after `*` (or `*args`) are **keyword-only**: `def connect(host, *, timeout=5)` forces `connect("db", timeout=3)`.
- Parameters before `/` are **positional-only** (3.8+).

Keyword-only arguments make call sites self-documenting and safer for boolean flags.

### py18 | What is the LEGB rule, and what do `global` and `nonlocal` do?

When you use a name, Python looks it up in this order:
1. **L**ocal: inside the current function
2. **E**nclosing: in any enclosing function (for nested functions)
3. **G**lobal: the module's top level
4. **B**uilt-in: `len`, `print`, `range`...

```python
x = "global"
def outer():
    x = "enclosing"
    def inner():
        x = "local"
        print(x)       # local
    inner()
```

**Assignment makes a name local** to the function, for the *whole* function:

```python
count = 0
def increment():
    count += 1         # UnboundLocalError: count is local here but not yet assigned

def increment_ok():
    global count       # assign to the module-level name
    count += 1

def counter():
    n = 0
    def inc():
        nonlocal n     # assign to the ENCLOSING function's variable
        n += 1
        return n
    return inc
```

`global` / `nonlocal` are only needed for **assignment**; reading outer names works without them. Prefer returning values or using a class over `global`.

Note: Python has **no block scope**: a variable assigned inside an `if` or `for` is visible after it in the same function.

### py19 | What is a closure, and what is the late-binding gotcha?

A **closure** is a nested function that **remembers variables from its enclosing scope** even after that scope has finished.

```python
def make_multiplier(factor):
    def multiply(x):
        return x * factor      # `factor` is captured from the enclosing scope
    return multiply

double = make_multiplier(2)
double(5)                       # 10
double.__closure__[0].cell_contents   # 2
```

Uses: function factories, decorators, keeping state without a class, callbacks.

**Late binding**: closures capture **variables, not values**. The value is looked up when the inner function **runs**:

```python
funcs = [lambda: i for i in range(3)]
[f() for f in funcs]            # [2, 2, 2]  all see the final i

# fix: bind the current value as a default argument
funcs = [lambda i=i: i for i in range(3)]
[f() for f in funcs]            # [0, 1, 2]

# or use functools.partial
```

This is the Python version of JavaScript's `var`-in-a-loop closure question.

### py20 | What are decorators, and how do they work?

A **decorator** is a function that **takes a function and returns a new function** (usually a wrapper that adds behaviour before or after the original). `@decorator` is just syntax for `func = decorator(func)`.

```python
import functools, time

def timer(func):
    @functools.wraps(func)              # keep the original name, docstring, signature
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        try:
            return func(*args, **kwargs)
        finally:
            print(f"{func.__name__} took {time.perf_counter() - start:.3f}s")
    return wrapper

@timer
def slow_add(a, b):
    time.sleep(0.5)
    return a + b

slow_add(1, 2)        # prints: slow_add took 0.501s
```

How it works: functions are first-class objects and closures keep `func` alive inside `wrapper`.

Why `functools.wraps`: without it, `slow_add.__name__` would be `"wrapper"`, which breaks logging, debugging, documentation and frameworks that inspect signatures (FastAPI and pytest do).

Real uses: logging, timing, **retry**, caching (`@lru_cache`), authentication and permission checks, rate limiting, registering routes (`@app.get("/")` in FastAPI / Flask), `@property`, `@staticmethod`, `@dataclass`.

Stacking: `@a` above `@b` above `def f` means `f = a(b(f))`: `b` wraps first, `a` is outermost.

### py21 | How do you write a decorator that takes arguments?

You need **one more level of nesting**: a function that takes the arguments and *returns a decorator*.

```python
import functools, time

def retry(times=3, delay=0.5, exceptions=(Exception,)):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(1, times + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    if attempt == times:
                        raise                       # out of attempts: re-raise
                    print(f"attempt {attempt} failed: {e}; retrying")
                    time.sleep(delay * 2 ** (attempt - 1))   # exponential backoff
        return wrapper
    return decorator

@retry(times=4, delay=0.2, exceptions=(ConnectionError,))
def fetch():
    ...
# equivalent to: fetch = retry(times=4, delay=0.2, ...)(fetch)
```

Other forms worth knowing:
- **Class-based decorators**: a class with `__call__`, useful when the decorator needs state.
- **Decorating classes**: `@dataclass` takes a class and returns it modified.
- **Async functions** need an `async def wrapper` that `await`s the original; check with `inspect.iscoroutinefunction(func)`.

Writing a timing, retry or caching decorator is one of the most common live-coding questions in Python interviews.

### py22 | What are lambda functions, and how do map, filter and reduce compare with comprehensions?

A `lambda` is a small **anonymous function limited to a single expression**:

```python
square = lambda x: x * x          # works, but a def is preferred for named functions
pairs = [(1, "b"), (2, "a")]
sorted(pairs, key=lambda p: p[1])  # the main use: short key functions and callbacks
```

`map`, `filter` and `reduce`:

```python
from functools import reduce
nums = [1, 2, 3, 4]

list(map(lambda n: n * 2, nums))           # [2, 4, 6, 8]
list(filter(lambda n: n % 2 == 0, nums))   # [2, 4]
reduce(lambda acc, n: acc + n, nums, 0)    # 10

# the Pythonic equivalents
[n * 2 for n in nums]
[n for n in nums if n % 2 == 0]
sum(nums)
```

- In Python 3, `map` and `filter` return **lazy iterators**, not lists.
- Comprehensions are usually preferred for readability. `map` is fine with an existing function: `map(str.upper, words)`, `map(int, line.split())`.
- `reduce` lives in `functools`; built-ins like `sum`, `max`, `any`, `all` and `math.prod` usually read better.

### py23 | What useful tools are in functools?

```python
from functools import lru_cache, cache, partial, wraps, reduce, cached_property, singledispatch

@lru_cache(maxsize=128)          # memoise results by arguments (args must be hashable)
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)
fib(100)                         # instant; fib.cache_info() shows hits and misses

@cache                           # unbounded cache (3.9+)
def load_config(env): ...

int_from_binary = partial(int, base=2)   # pre-fill arguments
int_from_binary("1010")                  # 10

class Report:
    @cached_property             # computed once per instance, then stored
    def totals(self):
        return expensive_sum(self.rows)

@singledispatch                  # function overloading by the type of the first argument
def to_json(obj): raise TypeError
@to_json.register
def _(obj: list): return [to_json(x) for x in obj]
```

Watch out with `lru_cache` on **methods**: the cache holds a reference to `self`, which keeps instances alive (a memory leak). Use `cached_property` or a cache on the class instead. Mutable return values from a cache are shared between callers.

## Iterators and generators

### py24 | What is the difference between an iterable and an iterator?

- **Iterable**: anything you can loop over. It has `__iter__()` that returns an iterator. Lists, tuples, strings, dicts, sets, files, ranges.
- **Iterator**: an object that produces values one at a time with `__next__()`, and raises `StopIteration` when done. Iterators are also iterable (`__iter__` returns `self`), and they're **one-shot**: once exhausted, they stay empty.

```python
nums = [1, 2]           # iterable (can be looped over many times)
it = iter(nums)         # iterator
next(it)                # 1
next(it)                # 2
next(it)                # StopIteration

# what a for loop does under the hood
it = iter(nums)
while True:
    try:
        x = next(it)
    except StopIteration:
        break
```

A custom iterator class:

```python
class Countdown:
    def __init__(self, start): self.n = start
    def __iter__(self): return self
    def __next__(self):
        if self.n <= 0:
            raise StopIteration
        self.n -= 1
        return self.n + 1

list(Countdown(3))      # [3, 2, 1]
```

The classic gotcha: iterating a generator or `map` object twice gives nothing the second time.

### py25 | What are generators, and how does yield work?

A **generator function** contains `yield`. Calling it doesn't run the body: it returns a **generator object** (an iterator). Each `next()` runs the body until the next `yield`, hands back that value, and **pauses with all local state saved**. The next call resumes right after the `yield`.

```python
def read_large_file(path):
    with open(path) as f:
        for line in f:          # the file itself is a lazy iterator
            yield line.rstrip()

def count_up_to(n):
    i = 1
    while i <= n:
        yield i                 # pause here
        i += 1                  # resume here on the next next()

gen = count_up_to(3)
next(gen), next(gen), next(gen)  # (1, 2, 3); then StopIteration

# pipeline of lazy steps: constant memory even for a 50GB file
errors = (l for l in read_large_file("app.log") if "ERROR" in l)
first_10 = [next(errors) for _ in range(10)]
```

Why use them:
- **Memory**: produce items on demand instead of building a full list (O(1) vs O(n) memory).
- **Infinite sequences**, streaming data, pipelines (read → filter → transform).
- Simpler than writing an iterator class.

`return` inside a generator ends it (raising `StopIteration`).

### py26 | What is the difference between a generator and a list (and between yield and return)?

| | List | Generator |
|---|---|---|
| Evaluation | **eager**: everything computed up front | **lazy**: one item per `next()` |
| Memory | all items stored | only the current state |
| Reusable | yes, iterate many times | **one pass** only |
| Indexing / `len()` | yes | no |
| Good for | small data you'll reuse or index | huge or infinite data, pipelines, streaming |

```python
import sys
sys.getsizeof([x for x in range(1_000_000)])   # ~8 MB
sys.getsizeof((x for x in range(1_000_000)))   # ~200 bytes
```

`return` vs `yield`:
- `return` **ends** the function and gives back a single value.
- `yield` **pauses** it, gives back a value, and can be resumed for more.

Related: **`yield from iterable`** delegates to another iterable or generator (flattening nested generators):

```python
def flatten(nested):
    for item in nested:
        if isinstance(item, list):
            yield from flatten(item)
        else:
            yield item
list(flatten([1, [2, [3, 4]], 5]))   # [1, 2, 3, 4, 5]
```

### py27 | What does itertools provide?

`itertools` has fast, memory-efficient, **lazy** building blocks for iteration:

```python
from itertools import count, cycle, repeat, chain, islice, groupby, product, permutations, combinations, accumulate, batched, zip_longest

list(islice(count(10), 3))            # [10, 11, 12]  first 3 of an infinite counter
list(chain([1, 2], (3,), "ab"))       # [1, 2, 3, 'a', 'b']  concatenate iterables
list(chain.from_iterable([[1], [2, 3]]))  # flatten one level

list(combinations([1, 2, 3], 2))      # [(1, 2), (1, 3), (2, 3)]
list(permutations("ab"))              # [('a', 'b'), ('b', 'a')]
list(product([0, 1], repeat=2))       # [(0,0), (0,1), (1,0), (1,1)]
list(accumulate([1, 2, 3]))           # [1, 3, 6]  running totals

# groupby groups CONSECUTIVE equal keys: sort by the key first!
data = sorted(["apple", "avocado", "banana"], key=lambda w: w[0])
{k: list(g) for k, g in groupby(data, key=lambda w: w[0])}  # {'a': [...], 'b': [...]}

list(batched(range(7), 3))            # [(0,1,2), (3,4,5), (6,)]  chunking (3.12+)
```

They're implemented in C and return iterators, so they compose into pipelines without building intermediate lists.

## Object-oriented Python

### py28 | How do classes work in Python (self, instance vs class attributes)?

```python
class Account:
    interest_rate = 0.04            # CLASS attribute: shared by all instances

    def __init__(self, owner, balance=0):
        self.owner = owner          # INSTANCE attributes: per object
        self.balance = balance

    def deposit(self, amount):      # instance method: gets the instance as `self`
        self.balance += amount
        return self.balance

a = Account("Shubam")
a.deposit(100)                      # really Account.deposit(a, 100)
```

- `self` is just the **explicit first parameter**: the instance the method was called on. Unlike Java's `this`, it's not a keyword.
- **Attribute lookup** goes: instance `__dict__` → class → base classes (following the MRO).
- **Class attributes are shared**, which creates a classic bug when the class attribute is mutable:

```python
class Team:
    members = []                    # BUG: one list shared by every Team
    def add(self, m): self.members.append(m)

class TeamFixed:
    def __init__(self): self.members = []   # each instance gets its own list
```

- Assigning `a.interest_rate = 0.05` creates an **instance attribute** that shadows the class one, only for `a`.
- Python has no `private`: by convention, `_name` means internal, and `__name` triggers name mangling.

### py29 | What is the difference between `__init__` and `__new__`?

- **`__new__(cls, ...)`** **creates** the instance: it's a static method that allocates and returns a new object. It runs **first**.
- **`__init__(self, ...)`** **initialises** the already-created instance (sets attributes). It returns `None`.

```python
class Point:
    def __new__(cls, *args, **kwargs):
        print("1. creating")
        return super().__new__(cls)       # allocate the object

    def __init__(self, x, y):
        print("2. initialising")
        self.x, self.y = x, y

Point(1, 2)    # 1. creating  -> 2. initialising
```

You rarely override `__new__`. It's used when:
- subclassing **immutable** types (`int`, `str`, `tuple`), whose value must be set at creation time;
- implementing a **singleton** or instance caching (return an existing object);
- metaclasses and some ORMs.

```python
class Singleton:
    _instance = None
    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
```

(Note: `__init__` still runs on every call. Often a plain **module-level instance** is the more Pythonic singleton, since modules are imported only once.)

### py30 | What is the difference between instance methods, @classmethod and @staticmethod?

| | Receives | Can access | Typical use |
|---|---|---|---|
| instance method | `self` (the instance) | instance and class data | normal behaviour |
| `@classmethod` | `cls` (the class) | class data; can create instances | **alternative constructors**, factories, class-level config |
| `@staticmethod` | nothing implicit | neither | a utility that belongs to the class's namespace |

```python
from datetime import date

class User:
    min_age = 18

    def __init__(self, name, birth_year):
        self.name, self.birth_year = name, birth_year

    def age(self):                                 # instance method
        return date.today().year - self.birth_year

    @classmethod
    def from_csv(cls, line):                       # alternative constructor
        name, year = line.split(",")
        return cls(name, int(year))                # `cls` respects subclasses

    @staticmethod
    def is_valid_name(name):                       # helper, no self/cls
        return name.isalpha()

u = User.from_csv("Asha,1998")
```

Why `cls` matters: with inheritance, `Admin.from_csv(...)` returns an **Admin**, because `cls` is whatever class it was called on. A static method hard-coding `User(...)` wouldn't.

Java comparison: `@staticmethod` ≈ a Java static method; `@classmethod` has no direct Java equivalent (it's like a static factory method that is polymorphic over subclasses).

### py31 | What does @property do?

`@property` turns a method into an **attribute-style accessor**, so you can add validation or computed values **without changing the public interface** (no Java-style `getX()` / `setX()` boilerplate).

```python
class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius            # goes through the setter below

    @property
    def celsius(self):                    # getter
        return self._celsius

    @celsius.setter
    def celsius(self, value):             # validation on assignment
        if value < -273.15:
            raise ValueError("below absolute zero")
        self._celsius = value

    @property
    def fahrenheit(self):                 # computed, read-only
        return self._celsius * 9 / 5 + 32

t = Temperature(25)
t.fahrenheit        # 77.0, accessed like an attribute
t.celsius = -300    # ValueError
t.fahrenheit = 1    # AttributeError: no setter
```

The Pythonic approach is to **start with plain public attributes** and switch to a property later only if you need logic. Callers don't change. `@cached_property` computes once and stores the result.

Properties are implemented with the **descriptor protocol** (`__get__`, `__set__`), the same mechanism behind methods, `classmethod`, and ORM fields.

### py32 | How do inheritance, super() and the MRO work (including multiple inheritance)?

```python
class Animal:
    def __init__(self, name):
        self.name = name
    def speak(self):
        return "..."

class Dog(Animal):
    def __init__(self, name, breed):
        super().__init__(name)          # call the parent's initialiser
        self.breed = breed
    def speak(self):                    # override
        return "Woof"
```

Python supports **multiple inheritance**. Method lookup follows the **MRO (Method Resolution Order)**, computed with the **C3 linearisation** algorithm: children before parents, and the left-to-right order of the bases is kept.

```python
class A:
    def hello(self): return "A"
class B(A):
    def hello(self): return "B -> " + super().hello()
class C(A):
    def hello(self): return "C -> " + super().hello()
class D(B, C):
    pass

D.__mro__        # (D, B, C, A, object)
D().hello()      # "B -> C -> A"
```

This is the **diamond problem**, solved by the MRO: `A` appears only once, at the end.

Key insight: **`super()` means "the next class in the MRO of the instance"**, not "my parent". In `B.hello`, `super()` goes to `C`, not `A`, because the object is a `D`. That's what makes cooperative multiple inheritance (mixins) work, as long as every class calls `super()`.

Typical use of multiple inheritance: **mixins** that add one capability (`class APIView(LoginRequiredMixin, JSONResponseMixin, View)`). Prefer composition for everything else.

### py33 | What are dunder (magic) methods? Give important examples.

**Dunder methods** (double underscore, like `__len__`) let your classes plug into Python's built-in syntax and functions. This is the **Python data model**.

```python
class Money:
    def __init__(self, amount, currency="INR"):
        self.amount, self.currency = amount, currency

    def __repr__(self):                 # unambiguous, for developers: repr(), the debugger, the REPL
        return f"Money({self.amount!r}, {self.currency!r})"

    def __str__(self):                  # readable, for users: print(), str(), f-strings
        return f"{self.currency} {self.amount:.2f}"

    def __eq__(self, other):            # ==
        return isinstance(other, Money) and (self.amount, self.currency) == (other.amount, other.currency)

    def __hash__(self):                 # needed to use it in sets / as a dict key once __eq__ is defined
        return hash((self.amount, self.currency))

    def __add__(self, other):           # +
        return Money(self.amount + other.amount, self.currency)

    def __lt__(self, other):            # <, enables sorted() and min()
        return self.amount < other.amount

    def __bool__(self):                 # truthiness
        return self.amount != 0
```

Other common ones:
- containers: `__len__`, `__getitem__`, `__setitem__`, `__contains__` (`in`), `__iter__`
- `__call__`: makes instances callable like functions
- `__enter__` / `__exit__`: context managers
- `__getattr__`: fallback for missing attributes (proxies)

`__str__` vs `__repr__`: if you define only one, define `__repr__` (`str()` falls back to it). Defining `__eq__` without `__hash__` makes instances **unhashable**. `functools.total_ordering` fills in the other comparison methods from `__eq__` + `__lt__`.

### py34 | What are abstract base classes, duck typing and Protocols?

**Duck typing**: Python cares about **what an object can do**, not what class it is. "If it walks like a duck and quacks like a duck, it's a duck."

```python
def total_length(items):
    return sum(len(x) for x in items)   # works for anything with __len__: str, list, dict, custom classes
```

**Abstract Base Classes (`abc`)**: when you want to **enforce** an interface:

```python
from abc import ABC, abstractmethod

class PaymentGateway(ABC):
    @abstractmethod
    def charge(self, amount: int) -> str: ...

class Razorpay(PaymentGateway):
    def charge(self, amount): return "txn_123"

PaymentGateway()        # TypeError: can't instantiate an abstract class
```

**Protocols** (`typing.Protocol`, 3.8+): **structural typing** for static type checkers. A class matches if it has the right methods, with **no inheritance needed**. That's duck typing that mypy can check, similar to Go interfaces:

```python
from typing import Protocol

class Notifier(Protocol):
    def send(self, msg: str) -> None: ...

class EmailNotifier:                       # doesn't inherit from Notifier
    def send(self, msg: str) -> None: print("email:", msg)

def alert(n: Notifier): n.send("disk full")
alert(EmailNotifier())                     # OK for the type checker
```

Compared with Java: ABC ≈ an abstract class or interface (nominal, explicit); Protocol ≈ an interface you satisfy implicitly.

### py35 | What are dataclasses, and how do they compare with namedtuple and Pydantic?

`@dataclass` generates `__init__`, `__repr__`, `__eq__` (and optionally ordering, hashing, immutability) from type-annotated fields, so plain data classes need no boilerplate.

```python
from dataclasses import dataclass, field

@dataclass
class Order:
    id: int
    items: list[str] = field(default_factory=list)   # safe mutable default
    total: float = 0.0
    paid: bool = False

o = Order(1, ["book"], 499.0)
print(o)                     # Order(id=1, items=['book'], total=499.0, paid=False)
o == Order(1, ["book"], 499.0)   # True (value equality)

@dataclass(frozen=True, slots=True)  # immutable + hashable; slots saves memory (3.10+)
class Point:
    x: float
    y: float
```

| | `namedtuple` / `NamedTuple` | `@dataclass` | Pydantic `BaseModel` |
|---|---|---|---|
| Mutable | no | yes (or `frozen=True`) | yes (configurable) |
| Validation | none | **none**: type hints aren't enforced | **validates and converts** at runtime |
| Speed | fastest | fast | slower (but pydantic-core is in Rust) |
| Best for | small immutable records | internal domain objects | **external data**: API requests, config, JSON |

Key interview point: dataclass type hints are **not checked** at runtime (`Order("x")` works). Use Pydantic at system boundaries (FastAPI request bodies, env config) and dataclasses inside your code.

### py36 | What do single and double underscores mean (_x, __x, __x__)?

| Form | Meaning |
|---|---|
| `_x` | **internal by convention**: "don't use this from outside". Not enforced. `from module import *` skips it. |
| `__x` (inside a class) | **name mangling**: becomes `_ClassName__x`, to avoid accidental clashes in **subclasses**. Not real privacy. |
| `__x__` | **dunder**: reserved for Python's special methods (`__init__`, `__len__`). Don't invent your own. |
| `x_` | avoids a clash with a keyword: `class_`, `type_` |
| `_` | a throwaway variable (`for _ in range(3)`), the last result in the REPL, and the wildcard in `match` |

```python
class Base:
    def __init__(self):
        self._internal = 1      # convention only
        self.__secret = 2       # stored as _Base__secret

b = Base()
b._internal          # works (you were warned)
b.__secret           # AttributeError
b._Base__secret      # 2: mangling isn't security
```

Python's philosophy is "we're all consenting adults": there's no `private` keyword. Use a single underscore for internal details; use double underscores only to prevent name clashes in classes designed for inheritance.

### py37 | What are `__slots__` used for?

By default, every instance stores its attributes in a per-instance **`__dict__`** (a hash table), which is flexible but memory-hungry. `__slots__` declares a **fixed set of attributes**, stored in a compact array instead.

```python
class PointDict:
    def __init__(self, x, y): self.x, self.y = x, y

class PointSlots:
    __slots__ = ("x", "y")
    def __init__(self, x, y): self.x, self.y = x, y

p = PointSlots(1, 2)
p.z = 3        # AttributeError: 'PointSlots' object has no attribute 'z'
```

Benefits: **much less memory per instance** (often 40–60% smaller; it matters with millions of objects) and slightly faster attribute access.

Trade-offs: you can't add new attributes dynamically; no `__dict__` (unless you include it in the slots); subclasses need their own `__slots__` to keep the benefit; weak references need `"__weakref__"` in the slots.

Modern shortcut: `@dataclass(slots=True)`.

### py38 | What is a metaclass?

In Python, **classes are objects too**, and their type is a **metaclass**. The default metaclass is `type`: `type(int)` is `type`, and `type(MyClass)` is `type`.

- A class creates instances; a **metaclass creates classes**.
- `class Foo: ...` is roughly `Foo = type("Foo", (object,), {...namespace...})`.

```python
class RegistryMeta(type):
    registry = {}
    def __new__(mcls, name, bases, namespace):
        cls = super().__new__(mcls, name, bases, namespace)
        if name != "Plugin":
            mcls.registry[name.lower()] = cls     # auto-register every subclass
        return cls

class Plugin(metaclass=RegistryMeta): pass
class CsvExporter(Plugin): pass

RegistryMeta.registry     # {'csvexporter': <class 'CsvExporter'>}
```

Real-world uses: ORMs (Django models and SQLAlchemy declarative turn class attributes into columns), validation frameworks, ABCs (`ABCMeta`), Enum.

Interview answer to "would you use one?": rarely. Simpler tools usually cover it: **`__init_subclass__`** (a hook on the base class called when it's subclassed), class decorators, or descriptors. "Metaclasses are deeper magic than 99% of users should ever worry about" (Tim Peters).

### py39 | How do you implement a singleton in Python?

Several ways, from most to least Pythonic:

```python
# 1. Module-level instance: modules are imported ONCE and cached in sys.modules
# config.py
class _Settings:
    def __init__(self): self.debug = False
settings = _Settings()
# elsewhere: from config import settings   (always the same object)

# 2. Cache a factory function
from functools import cache
@cache
def get_db_pool():
    return create_pool()

# 3. Override __new__
class Logger:
    _instance = None
    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

# 4. Metaclass
class SingletonMeta(type):
    _instances = {}
    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]
class Cache(metaclass=SingletonMeta): pass
```

Thread safety: options 3 and 4 can race when two threads create the instance at the same time. Guard the creation with a `threading.Lock` (double-checked) if it matters.

In practice (FastAPI and others), prefer **one instance created at startup** (lifespan or module level) and passed in through **dependency injection**: it's easier to test than a hidden global.

## Errors and context managers

### py40 | How does exception handling work (try, except, else, finally)?

```python
def read_config(path):
    try:
        f = open(path)
    except FileNotFoundError:
        return {}                        # handle a specific, expected error
    except (PermissionError, IsADirectoryError) as e:
        raise RuntimeError(f"cannot read {path}") from e   # wrap, keeping the cause
    else:
        with f:                          # runs ONLY if no exception happened in try
            return json.load(f)
    finally:
        print("done")                    # ALWAYS runs: success, error, or return
```

- `except` clauses are checked **top to bottom**: put specific exceptions before general ones.
- `else` keeps the "success path" out of the `try` so you don't accidentally catch errors from it.
- `finally` is for cleanup (prefer a `with` block for resources).
- `raise ... from e` chains exceptions (you see "The above exception was the direct cause of..."); `raise` alone re-raises the current one.

Anti-patterns:
- **Bare `except:`** also catches `KeyboardInterrupt` and `SystemExit`. Catch `Exception` at most, and only at boundaries (a request handler, a worker loop) where you log and recover.
- Silently swallowing errors (`except Exception: pass`).

The hierarchy: `BaseException` → `Exception` → `ValueError`, `KeyError`, `TypeError`, `OSError`... Python 3.11 added **exception groups** (`except*`), used with `asyncio.TaskGroup`.

### py41 | How do you create custom exceptions, and what are EAFP and LBYL?

```python
class AppError(Exception):
    """Base for this app's errors, so callers can catch them all."""

class NotFoundError(AppError):
    def __init__(self, resource, id):
        super().__init__(f"{resource} {id} not found")
        self.resource, self.id = resource, id

class PaymentDeclined(AppError):
    pass

try:
    raise NotFoundError("Order", 42)
except AppError as e:
    log.warning("app error: %s", e)
```

Good practice: one base exception per library or app, specific subclasses for specific failures, extra context as attributes. In FastAPI you map them to HTTP responses with an exception handler.

**EAFP vs LBYL**, two styles:
- **LBYL** ("Look Before You Leap"): check first, then act.
- **EAFP** ("Easier to Ask Forgiveness than Permission"): just try it, and handle the exception. This is the **Pythonic** style.

```python
# LBYL
if "port" in config and config["port"].isdigit():
    port = int(config["port"])

# EAFP
try:
    port = int(config["port"])
except (KeyError, ValueError):
    port = 8000
```

EAFP avoids race conditions (the file could be deleted between your check and your open) and double lookups. Exceptions in Python are relatively cheap, especially when they're rare.

### py42 | What are context managers, and how do you write one?

A **context manager** sets something up and **guarantees cleanup** with a `with` block, even if an exception happens: files, locks, DB transactions, connections, timers.

```python
with open("data.txt") as f:          # the file is closed automatically
    data = f.read()

with lock:                            # acquire, then always release
    counter += 1
```

**Class-based**: implement `__enter__` and `__exit__`:

```python
import time

class Timer:
    def __enter__(self):
        self.start = time.perf_counter()
        return self                               # bound to the `as` target
    def __exit__(self, exc_type, exc, tb):
        self.elapsed = time.perf_counter() - self.start
        print(f"took {self.elapsed:.3f}s")
        return False                              # False/None: don't swallow exceptions

with Timer() as t:
    work()
```

**Generator-based** with `contextlib`: shorter:

```python
from contextlib import contextmanager

@contextmanager
def transaction(conn):
    tx = conn.begin()
    try:
        yield conn            # the body of the with block runs here
        tx.commit()
    except Exception:
        tx.rollback()
        raise
```

`__exit__` receives the exception details; returning `True` suppresses the exception (use it carefully: `contextlib.suppress(FileNotFoundError)` does this deliberately). Async versions: `async with` and `__aenter__`/`__aexit__` (`@asynccontextmanager`), used for async DB sessions and FastAPI's lifespan.

Java equivalent: try-with-resources plus `AutoCloseable`.

## Concurrency: GIL, threads, processes and asyncio

### py43 | What is the GIL?

The **Global Interpreter Lock** is a mutex in CPython that lets **only one thread execute Python bytecode at a time** in a process.

Why it exists: CPython's memory management uses **reference counting**. The GIL makes refcount updates and the interpreter's internals thread-safe cheaply, without fine-grained locks everywhere, and makes single-threaded code and C extensions simple and fast.

Consequences:
- **CPU-bound** pure-Python code does **not** speed up with threads: two threads doing math take about as long as one (or longer, because of switching).
- **I/O-bound** code **does** benefit from threads: the GIL is **released** while waiting on I/O (network, disk, `time.sleep`), so other threads run.
- Many C extensions (NumPy, hashing, compression) **release the GIL** during heavy work, so they can run in parallel.
- The GIL does **not** make your code thread-safe: `count += 1` is several bytecodes, and a thread switch can happen between them. You still need locks.

```python
# CPU-bound: threads don't help; use processes
from concurrent.futures import ProcessPoolExecutor
with ProcessPoolExecutor() as pool:
    results = list(pool.map(heavy_compute, chunks))   # true parallelism, one GIL per process
```

What's changing: **PEP 703** added an optional **free-threaded build** (no GIL): experimental in 3.13 and officially supported (still optional, not the default) in 3.14. Single-threaded code is a bit slower, and C extensions need updates. The default CPython still has the GIL.

### py44 | When do you use threading vs multiprocessing vs asyncio?

| | `threading` | `multiprocessing` | `asyncio` |
|---|---|---|---|
| Parallel CPU work | **no** (GIL) | **yes**: separate processes, one GIL each | no (single thread) |
| Good for | **I/O-bound** work with blocking libraries | **CPU-bound** work | **I/O-bound** work with **many** concurrent connections |
| Memory | shared (needs locks) | separate (data is pickled between processes) | shared, single thread (no locks for normal code) |
| Overhead | medium (OS threads, ~8MB stack reserved) | high (process start-up, pickling) | very low (thousands of coroutines are cheap) |
| Switching | **preemptive** (the OS decides) | OS processes | **cooperative**: only at `await` |
| Library requirement | any blocking library works | picklable functions and data | needs **async libraries** (httpx, asyncpg, aiokafka) |

```python
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import asyncio, httpx

# threads: 50 blocking HTTP calls concurrently
with ThreadPoolExecutor(max_workers=20) as pool:
    pages = list(pool.map(requests_get, urls))

# processes: CPU-heavy image resizing on every core
with ProcessPoolExecutor() as pool:
    thumbs = list(pool.map(resize, images))

# asyncio: thousands of concurrent requests on one thread
async def main():
    async with httpx.AsyncClient() as client:
        pages = await asyncio.gather(*(client.get(u) for u in urls))
asyncio.run(main())
```

Rule of thumb: **CPU-bound → processes. I/O-bound with an async stack (FastAPI) → asyncio. I/O-bound with blocking libraries → threads.** `concurrent.futures` gives threads and processes the same simple API.

### py45 | How do you make threaded code thread-safe in Python?

The GIL protects the interpreter's internals, **not your data**. Compound operations can still interleave:

```python
import threading

counter = 0
def unsafe():
    global counter
    for _ in range(100_000):
        counter += 1          # LOAD, ADD, STORE: a thread switch in between loses updates

lock = threading.Lock()
def safe():
    global counter
    for _ in range(100_000):
        with lock:            # only one thread at a time in this block
            counter += 1
```

Tools in `threading`:
- `Lock` / `RLock` (re-entrant), `Semaphore` (limit concurrency, e.g. 5 parallel API calls), `Event` (signal between threads), `Condition`, `Barrier`.
- **`queue.Queue`**: a thread-safe producer–consumer queue. The cleanest way to pass work between threads.

```python
from queue import Queue
q = Queue(maxsize=100)
def worker():
    while (item := q.get()) is not None:
        process(item)
        q.task_done()
```

Also: use `ThreadPoolExecutor` instead of managing threads by hand; avoid shared mutable state where possible (pass data through queues, return results from futures); `threading.local()` for per-thread data. Single built-in operations like `list.append` or `dict[k] = v` happen to be atomic in CPython, but don't build correctness on that.

### py46 | How does asyncio work (event loop, coroutines, await)?

`asyncio` runs **many tasks concurrently on one thread** using **cooperative multitasking**: a task runs until it hits `await` on something that isn't ready (a network response), then **yields control** to the event loop, which runs another task that is ready.

```python
import asyncio

async def fetch(name, delay):          # `async def` defines a COROUTINE function
    print(f"start {name}")
    await asyncio.sleep(delay)         # yield to the loop while "waiting on I/O"
    print(f"done {name}")
    return name

async def main():
    # run concurrently: total ≈ 2s, not 3s
    results = await asyncio.gather(fetch("a", 1), fetch("b", 2))
    print(results)                     # ['a', 'b']

asyncio.run(main())                    # create the event loop, run main, close the loop
```

The pieces:
- **Coroutine**: what calling an `async def` function returns. Calling it doesn't run anything until it's awaited or scheduled.
- **Event loop**: the scheduler. It keeps a queue of ready tasks and uses the OS's I/O notification (epoll/kqueue/IOCP) to know which sockets are ready.
- **Task**: a coroutine scheduled to run on the loop (`asyncio.create_task`).
- **`await`**: "pause me until this finishes; let others run meanwhile".

The golden rule: **never block the loop**. `time.sleep(2)`, `requests.get()`, or a heavy CPU loop inside a coroutine freezes **every** task. Use async libraries, `await asyncio.sleep`, or offload with `asyncio.to_thread()`.

Same model as Node's event loop; the difference is that Python makes it explicit (`async`/`await` everywhere, a separate async library ecosystem).

### py47 | What is the difference between awaiting coroutines directly, gather, create_task and TaskGroup?

```python
async def main():
    # 1. Sequential: one after another (total = 1 + 2 = 3s)
    a = await fetch("a", 1)
    b = await fetch("b", 2)

    # 2. gather: run concurrently, results in INPUT order (total ≈ 2s)
    a, b = await asyncio.gather(fetch("a", 1), fetch("b", 2))
    results = await asyncio.gather(*coros, return_exceptions=True)  # errors returned as values

    # 3. create_task: start now, await later (do other work meanwhile)
    task = asyncio.create_task(fetch("c", 1))
    await do_something_else()
    c = await task

    # 4. TaskGroup (3.11+): structured concurrency, the modern default
    async with asyncio.TaskGroup() as tg:
        t1 = tg.create_task(fetch("x", 1))
        t2 = tg.create_task(fetch("y", 2))
    # here every task is finished; if one failed, the OTHERS ARE CANCELLED and
    # the errors are raised together as an ExceptionGroup
    print(t1.result(), t2.result())

    # timeouts
    async with asyncio.timeout(5):           # 3.11+ (or asyncio.wait_for(coro, 5))
        await slow_call()
```

Key differences:
- `gather` doesn't cancel the other tasks when one fails (unless you cancel them yourself). `TaskGroup` does: no orphaned tasks.
- Keep a reference to tasks created with `create_task`. The loop holds only weak references, so a fire-and-forget task can be garbage collected mid-run.
- `asyncio.as_completed(coros)` processes results **as they finish**.

### py48 | How do you limit concurrency in asyncio, and how do you call blocking code from async code?

**Limiting concurrency** (rate limits, connection pools): use a `Semaphore`:

```python
import asyncio, httpx

async def fetch_all(urls, limit=10):
    sem = asyncio.Semaphore(limit)                 # at most 10 requests in flight
    async with httpx.AsyncClient(timeout=10) as client:
        async def fetch(url):
            async with sem:
                r = await client.get(url)
                r.raise_for_status()
                return r.json()
        return await asyncio.gather(*(fetch(u) for u in urls))
```

Without it, `gather` over 10,000 URLs opens 10,000 connections at once.

**Calling blocking code** without freezing the event loop:

```python
import asyncio

def blocking_resize(image): ...           # CPU or blocking I/O (a sync library)

async def handler(image):
    # I/O-bound or GIL-releasing blocking call -> a worker thread
    result = await asyncio.to_thread(blocking_resize, image)

    # CPU-bound pure-Python work -> a process pool
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(process_pool, heavy_compute, data)
```

Other patterns: `asyncio.Queue` for producer–consumer pipelines with N worker coroutines, and `asyncio.wait_for` / `asyncio.timeout` around every network call.

FastAPI does the thread offloading automatically for routes declared with plain `def`.

## Memory, modules and tooling

### py49 | How does memory management and garbage collection work in Python?

CPython uses two mechanisms:

1. **Reference counting** (the main one): every object stores how many references point to it. When the count drops to **0**, the object is freed **immediately**, which gives predictable, prompt cleanup.
```python
import sys
a = []
sys.getrefcount(a)      # 2 (a + the temporary argument)
b = a                   # +1
del a                   # -1; the list is freed when the last reference goes
```

2. **A cyclic garbage collector** (the `gc` module): reference counting can't free **reference cycles** (`a.ref = b; b.ref = a`, or an object referencing itself). The GC periodically finds groups of objects that only reference each other and frees them. It's **generational** (three generations: new objects are checked most often; survivors are promoted).

```python
import gc
gc.collect()            # force a collection (rarely needed)
gc.get_count()          # allocation counters per generation
```

Other details:
- Memory comes from **pymalloc**, an allocator for small objects that keeps pools; freed memory is often reused rather than returned to the OS, so a process's RSS may not shrink.
- **`weakref`** references an object without increasing its count (caches, observers).
- Leaks in Python usually come from **objects that stay referenced**: global caches, unbounded lists, `lru_cache` on methods, closures. Tools: `tracemalloc`, `objgraph`, memray.

Compared with Java: no stop-the-world tracing GC for most objects; reference counting frees things as soon as they're unused.

### py50 | What is the difference between a module and a package, and what does `if __name__ == "__main__"` do?

- **Module**: a single `.py` file. Importing it runs it **once** and caches it in `sys.modules`.
- **Package**: a **directory** of modules, usually with an `__init__.py` (which runs on import and can expose a public API). Without one, it's a namespace package.

```
myapp/
  __init__.py
  services/
    __init__.py
    orders.py
  main.py
```
```python
from myapp.services.orders import create_order     # absolute import (preferred)
from .orders import create_order                   # relative import, inside the package
```

**`__name__ == "__main__"`**: every module has a `__name__`. When the file is **run directly** (`python script.py`), `__name__` is `"__main__"`; when it's **imported**, it's the module name. So this guard runs code only when the file is executed as a script, not when it's imported:

```python
def main():
    ...

if __name__ == "__main__":
    main()          # doesn't run during `import script` (e.g. in tests)
```

How imports find modules: `sys.path` (the script's directory, `PYTHONPATH`, site-packages). `python -m package.module` runs a module with the package context set correctly.

### py51 | What causes circular imports, and how do you fix them?

A **circular import** happens when module A imports B and B imports A (directly or through others). Because a module executes top to bottom on first import, one of them sees the other **half-initialised**:

```python
# models.py
from services import notify       # starts loading services...
class User: ...

# services.py
from models import User           # models is only partly loaded: ImportError
def notify(user: User): ...
```

`ImportError: cannot import name 'User' from partially initialized module 'models' (most likely due to a circular import)`.

Fixes, best first:
1. **Restructure**: move the shared code into a third module both can import (often the real design fix).
2. **Import the module, not the name**: `import models`, then use `models.User` at call time.
3. **Move the import inside the function** that needs it (a local import, run later).
4. For **type hints only**:
```python
from __future__ import annotations
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from models import User          # only imported by the type checker, never at runtime
def notify(user: "User"): ...
```

Circular imports usually signal tangled layers (routes ↔ services ↔ models). A clean dependency direction fixes them for good.

### py52 | How do virtual environments and dependency management work (venv, pip, pyproject, Poetry, uv)?

A **virtual environment** is an isolated Python installation per project (its own `site-packages`), so projects can use different package versions without conflicts. It's like a per-project `node_modules`.

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install fastapi uvicorn
pip freeze > requirements.txt    # pin exact versions
pip install -r requirements.txt
```

Modern project files:
- **`pyproject.toml`**: the standard project config (metadata, dependencies, tool settings for ruff, pytest, mypy). Like `package.json` or `pom.xml`.
- **Lockfiles** pin the exact versions of everything, including transitive dependencies, for reproducible builds.

Tools:
- **pip + venv**: built in, minimal (pip-tools adds lockfiles).
- **Poetry**: dependency resolution, lockfile, virtualenvs and publishing in one tool.
- **uv** (from Astral, written in Rust): a very fast replacement for pip, pip-tools, virtualenv and pyenv. `uv init`, `uv add fastapi`, `uv sync`, `uv run`. Quickly becoming the default in new projects.

```bash
uv init myapi && cd myapi
uv add fastapi "uvicorn[standard]"
uv run uvicorn app.main:app --reload
```

Best practices: one venv per project, never `sudo pip install` into the system Python, commit the lockfile, pin the Python version (`.python-version`), and separate dev dependencies (pytest, ruff) from runtime ones.

### py53 | What tools keep Python code quality high (PEP 8, ruff, black, mypy)?

- **PEP 8**: the official style guide. 4-space indentation, `snake_case` for functions and variables, `PascalCase` for classes, `UPPER_CASE` for constants, lines of about 79–100 characters, two blank lines between top-level definitions.
- **Formatter**: **black** or **ruff format** formats code automatically, so there are no style debates in code review.
- **Linter**: **ruff** (very fast, Rust) replaces flake8, isort, pyupgrade and many plugins. It catches unused imports, mutable defaults, bare excepts and likely bugs.
- **Type checker**: **mypy** or **pyright** verifies type hints statically, catching `None` errors and wrong argument types before runtime.
- **Tests**: pytest + coverage.
- **pre-commit** hooks run all of this on every commit; CI runs it on every pull request.

```toml
# pyproject.toml
[tool.ruff]
line-length = 100
[tool.ruff.lint]
select = ["E", "F", "I", "B", "UP"]   # pycodestyle, pyflakes, isort, bugbear, pyupgrade

[tool.mypy]
strict = true
```

The Zen of Python (`import this`) captures the philosophy: "Readability counts", "Explicit is better than implicit", "There should be one obvious way to do it".

## Type hints and Pydantic

### py54 | How do type hints work in Python, and are they enforced?

Type hints (PEP 484) annotate the expected types. **The interpreter ignores them at runtime**: they're for **static type checkers** (mypy, pyright), editors (autocomplete) and frameworks that **read them on purpose** (FastAPI, Pydantic, dataclasses).

```python
from typing import Optional, Union, Any, Callable, TypeVar, Literal
from collections.abc import Iterable, Sequence

def greet(name: str, times: int = 1) -> str:
    return " ".join([f"hi {name}"] * times)

greet(123)        # runs fine at runtime! mypy reports an error

# modern syntax (3.9+ built-in generics, 3.10+ union with |)
def first(items: list[int]) -> int | None:
    return items[0] if items else None

user_ages: dict[str, int] = {}
Callback = Callable[[int, str], bool]
Status = Literal["pending", "paid", "failed"]

T = TypeVar("T")
def last(items: Sequence[T]) -> T:          # generic function
    return items[-1]

# 3.12+ syntax for generics
def head[T](items: list[T]) -> T: return items[0]
```

Why use them in backend code: earlier bug detection, safer refactoring in big codebases, self-documenting APIs, and in FastAPI the same hints **drive validation, serialisation and OpenAPI docs**.

Interview point: hints are **not runtime checks**. To validate untrusted data at runtime, use **Pydantic**.

### py55 | What is Pydantic, and why is it used?

**Pydantic** validates and parses data using type hints: you declare a model, and it **checks and converts** incoming data at runtime, raising clear errors. It's the backbone of FastAPI and widely used for configuration and parsing LLM output. Version 2's core is written in **Rust** (pydantic-core), so it's fast.

```python
from pydantic import BaseModel, Field, EmailStr, field_validator, ValidationError
from datetime import datetime

class User(BaseModel):
    id: int
    email: EmailStr
    name: str = Field(min_length=1, max_length=50)
    age: int | None = Field(default=None, ge=0, le=130)
    tags: list[str] = []
    created_at: datetime

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip().title()

u = User(id="42", email="a@b.com", name=" asha ", created_at="2026-10-28T10:00:00")
u.id            # 42 (the string "42" was coerced to int)
u.name          # "Asha"
u.model_dump()  # to a dict;  u.model_dump_json() to JSON

try:
    User(id="x", email="bad", name="", created_at="nope")
except ValidationError as e:
    print(e.errors())   # every field error with its location and message
```

Key ideas:
- **Parsing, not just validation**: by default it converts compatible input (`"42"` → `42`); `strict=True` disables that.
- Nested models, lists of models, optional fields, defaults; mutable defaults are copied safely per instance.
- `model_validate(dict)` / `model_validate_json(text)` to parse; `model_dump(exclude=..., by_alias=True)` to serialise.
- **pydantic-settings** loads typed configuration from environment variables and `.env` files.

Pydantic vs dataclasses: **Pydantic for untrusted input** (API bodies, config, external APIs); dataclasses for internal objects.

## Testing

### py56 | How do you test Python code with pytest (fixtures, parametrize)?

**pytest** is the standard test runner: plain `assert` statements, automatic test discovery (`test_*.py`, `test_*` functions) and powerful **fixtures**.

```python
# test_pricing.py
import pytest
from pricing import apply_discount

def test_ten_percent():
    assert apply_discount(100, 10) == 90       # readable failure diff on its own

def test_negative_discount_rejected():
    with pytest.raises(ValueError, match="discount"):
        apply_discount(100, -5)

@pytest.mark.parametrize("price, pct, expected", [
    (100, 0, 100),
    (100, 50, 50),
    (80, 25, 60),
])
def test_table(price, pct, expected):            # one test per row
    assert apply_discount(price, pct) == expected

# fixtures: reusable setup and teardown, injected by name
@pytest.fixture
def db():
    conn = create_test_db()
    yield conn                                   # the test runs here
    conn.close()                                 # teardown

def test_save_user(db):
    db.insert(User(name="A"))
    assert db.count() == 1
```

Know these:
- **Fixture scopes**: `function` (default), `module`, `session` (e.g. one DB container for the whole run).
- `conftest.py` shares fixtures across test files.
- Built-in fixtures: `tmp_path`, `monkeypatch`, `capsys`.
- Plugins: `pytest-asyncio` for async tests, `pytest-cov` for coverage, `pytest-xdist` for parallel runs.

### py57 | How do you mock dependencies in Python tests?

`unittest.mock` replaces real dependencies (HTTP calls, the DB, time, email) with controllable fakes.

```python
from unittest.mock import patch, MagicMock, AsyncMock
import pytest

# services.py
import requests
def get_user_name(user_id):
    r = requests.get(f"https://api.example.com/users/{user_id}")
    r.raise_for_status()
    return r.json()["name"]

# test_services.py
@patch("services.requests.get")                 # patch WHERE IT IS LOOKED UP, not where it's defined
def test_get_user_name(mock_get):
    mock_get.return_value.json.return_value = {"name": "Asha"}
    assert get_user_name(1) == "Asha"
    mock_get.assert_called_once_with("https://api.example.com/users/1")

def test_handles_error():
    with patch("services.requests.get") as mock_get:
        mock_get.side_effect = ConnectionError("down")   # simulate a failure
        with pytest.raises(ConnectionError):
            get_user_name(1)

# async dependencies
mock_client = AsyncMock()
mock_client.fetch.return_value = {"ok": True}

# pytest's monkeypatch for env vars and attributes
def test_env(monkeypatch):
    monkeypatch.setenv("API_KEY", "test")
```

The classic mistake is patching the wrong path: if `services.py` does `from requests import get`, you must patch `services.get`, not `requests.get`.

Better design: **inject dependencies** (pass the client in, or use FastAPI's `dependency_overrides`) so tests can swap them without patching. Libraries like `respx` / `responses` mock HTTP at the transport level; **Testcontainers** gives a real Postgres in tests.

## Classic Python coding questions

### py58 | Implement an LRU cache.

An **LRU (least recently used) cache** evicts the item that hasn't been used for the longest time once it's full. Both `get` and `put` must be **O(1)**.

```python
from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.data: OrderedDict[int, int] = OrderedDict()

    def get(self, key: int) -> int:
        if key not in self.data:
            return -1
        self.data.move_to_end(key)          # mark as most recently used
        return self.data[key]

    def put(self, key: int, value: int) -> None:
        if key in self.data:
            self.data.move_to_end(key)
        self.data[key] = value
        if len(self.data) > self.capacity:
            self.data.popitem(last=False)   # evict the least recently used (the front)

cache = LRUCache(2)
cache.put(1, 1); cache.put(2, 2)
cache.get(1)        # 1  (1 is now most recent)
cache.put(3, 3)     # evicts 2
cache.get(2)        # -1
```

How it works: `OrderedDict` is a hash map **plus a doubly linked list**, giving O(1) lookup and O(1) move/evict. If the interviewer forbids `OrderedDict`, build it yourself: a `dict` mapping key → node, and a doubly linked list with dummy head and tail nodes.

For function results in real code: `@functools.lru_cache(maxsize=1000)`. For thread safety, guard with a lock. For multiple servers, use Redis with an `allkeys-lru` eviction policy.

### py59 | Write a word-frequency counter for a large file.

```python
import re
from collections import Counter

def top_words(path: str, n: int = 10) -> list[tuple[str, int]]:
    counts: Counter[str] = Counter()
    word_re = re.compile(r"[a-z']+")
    with open(path, encoding="utf-8") as f:
        for line in f:                          # streams line by line: constant memory
            counts.update(word_re.findall(line.lower()))
    return counts.most_common(n)                # uses a heap: O(N log n) for the top n
```

Points to mention:
- **Iterate the file lazily**, never `f.read()` on a huge file.
- `Counter.update` with an iterable; `most_common(n)` uses `heapq.nlargest` internally.
- Normalise case and punctuation with a precompiled regex.
- Follow-ups:
  - Too many **distinct** words to fit in memory → split the work (hash words into bucket files, count per bucket, merge), or use a streaming approximation (Count-Min Sketch + a heap).
  - **Multiple cores** → split the file into byte ranges, count each with a `ProcessPoolExecutor`, then add the Counters together (`sum(counters, Counter())`).
  - Many files across machines → MapReduce / Spark.

### py60 | Write an async function that fetches many URLs with a concurrency limit, retries and timeouts.

```python
import asyncio
import httpx

async def fetch_json(client: httpx.AsyncClient, url: str, sem: asyncio.Semaphore, retries: int = 3):
    async with sem:                                     # limit concurrent requests
        for attempt in range(1, retries + 1):
            try:
                r = await client.get(url, timeout=5.0)  # per-request timeout
                if r.status_code >= 500:
                    raise httpx.HTTPStatusError("server error", request=r.request, response=r)
                r.raise_for_status()                    # 4xx: don't retry, fail now
                return r.json()
            except (httpx.TransportError, httpx.HTTPStatusError) as e:
                is_4xx = isinstance(e, httpx.HTTPStatusError) and e.response.status_code < 500
                if is_4xx or attempt == retries:
                    raise
                await asyncio.sleep(0.2 * 2 ** (attempt - 1))   # exponential backoff

async def fetch_all(urls: list[str], limit: int = 10):
    sem = asyncio.Semaphore(limit)
    async with httpx.AsyncClient() as client:           # ONE client: connection pooling
        results = await asyncio.gather(
            *(fetch_json(client, u, sem) for u in urls),
            return_exceptions=True,                     # one failure doesn't lose the rest
        )
    ok = [r for r in results if not isinstance(r, Exception)]
    failed = [u for u, r in zip(urls, results) if isinstance(r, Exception)]
    return ok, failed

ok, failed = asyncio.run(fetch_all(["https://httpbin.org/json"] * 50))
```

What this shows: a semaphore for concurrency limits, one shared client for connection reuse, timeouts on every call, retries only for transient errors (network, 5xx) with backoff, and partial failure handling with `return_exceptions=True`. This is the pattern behind calling LLM APIs in parallel within rate limits.
