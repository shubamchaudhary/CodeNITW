## Python basics and the data model

### py01 | How is Python different from Java? | asked=2

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

### pe01 | FizzBuzz, the Python way | write

Write `fizzbuzz(n)`: return a **list of strings** for the numbers 1 to n. Use `"Fizz"` for multiples of 3, `"Buzz"` for multiples of 5, `"FizzBuzz"` for multiples of both, and the number itself otherwise.

**New here:** `def`, indentation instead of braces, `for … in range(…)`, `if / elif / else`, `%`, `list.append`, `str()`.

```python starter
def fizzbuzz(n):
    # Java: List<String> out = new ArrayList<>(); for (int i = 1; i <= n; i++) ...
    pass
```

```python tests
assert fizzbuzz(5) == ["1", "2", "Fizz", "4", "Buzz"]
assert fizzbuzz(15)[-1] == "FizzBuzz"
assert fizzbuzz(0) == [], "n = 0 gives an empty list"
assert len(fizzbuzz(100)) == 100
```

#### Hint

`range(1, n + 1)` gives 1…n (the end is excluded). An empty list is `[]`, and `out.append(x)` adds to it. Check "both" first.

```python solution
def fizzbuzz(n):
    out = []
    for i in range(1, n + 1):
        if i % 15 == 0:
            out.append("FizzBuzz")
        elif i % 3 == 0:
            out.append("Fizz")
        elif i % 5 == 0:
            out.append("Buzz")
        else:
            out.append(str(i))
    return out
```

#### Why

- A block is whatever is indented under a line ending in `:`. No braces, no semicolons, and no types to declare.
- `range(start, stop)` stops **before** `stop`, so 1…n is `range(1, n + 1)`.
- `elif` is Python's `else if`. `and` / `or` / `not` replace `&&` / `||` / `!`.
- `str(i)` turns a number into text. Python won't do `"x" + 5` for you.


### py02 | What does "everything is an object" mean, and how do names and references work? | asked=1

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

### py03 | Which types are mutable and which are immutable, and why does it matter? | asked=5

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

### pe38 | Tuples as keys | write

1. `distinct_points(points)`: `points` is a list of `[x, y]` lists. Return how many **different** points there are.
2. `count_visits(path)`: return a dict of `(x, y)` tuple → how many times that point appears in `path`.

**New here:** only immutable (hashable) values can be dict keys or set members, so you convert a list with `tuple(p)`. Also `d.get(k, 0) + 1` for counting.

```python starter
def distinct_points(points):
    pass


def count_visits(path):
    pass
```

```python tests
assert distinct_points([[1, 2], [3, 4], [1, 2]]) == 2
assert distinct_points([]) == 0
assert count_visits([[0, 0], [0, 1], [0, 0]]) == {(0, 0): 2, (0, 1): 1}
assert raises(TypeError, set, [[1, 2]]), "a list can't go in a set: it's mutable, so unhashable"
```

```python solution
def distinct_points(points):
    return len({tuple(p) for p in points})


def count_visits(path):
    visits = {}
    for p in path:
        key = tuple(p)
        visits[key] = visits.get(key, 0) + 1
    return visits
```

#### Why

A dict or set finds things by hash, and a value that can change would change its hash. So `int`, `str`, `tuple` (of immutables) and `frozenset` can be keys, but `list`, `dict` and `set` can't. In DSA you'll keep `(row, col)` tuples in a `visited` set all the time.


### py04 | What is the difference between `is` and `==`? | asked=2

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

### pe02 | Names, copies, `is` and `==` | predict

Read the code, then type exactly what it prints, one line per `print`.

**New here:** a variable is a *name* stuck on an object, `[:]` makes a copy, `is` checks "same object" (Java's `==` on objects), `==` checks "equal value" (Java's `.equals`), and `print(a, b)` puts a space between its arguments.

```python predict
a = [1, 2, 3]
b = a
c = a[:]
b.append(4)
print(a)
print(c)
print(b is a, c is a)
print(c == [1, 2, 3])
x = 5
y = x
y += 1
print(x, y)
```

```python solution
[1, 2, 3, 4]
[1, 2, 3]
True False
True
5 6
```

#### Why

`b = a` copies nothing: `b` is a second name for the same list, so `b.append(4)` changes what `a` shows too. `a[:]` slices the whole list into a **new** list, so `c` isn't affected. `y += 1` on an int makes a new int object (ints are immutable) and points `y` at it, so `x` is unchanged.


### py05 | What is the difference between a shallow copy and a deep copy? | asked=3

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

### pe39 | Build and copy a grid | write

1. `make_grid(rows, cols, fill=0)`: a list of `rows` lists of `cols` items, each row its **own** list.
2. `clone_board(board)`: a copy of a 2-D board that you can change without touching the original.

**New here:** the `[[0] * cols] * rows` trap, shallow versus deep copies, and `row[:]`.

```python starter
def make_grid(rows, cols, fill=0):
    pass


def clone_board(board):
    pass
```

```python tests
g = make_grid(2, 3)
assert g == [[0, 0, 0], [0, 0, 0]]
g[0][0] = 1
assert g == [[1, 0, 0], [0, 0, 0]], "changing one row leaves the others alone"
assert make_grid(1, 2, ".") == [[".", "."]]
board = [["x", "."], [".", "o"]]
clone = clone_board(board)
clone[0][0] = "o"
assert board[0][0] == "x", "the original board is untouched"
assert clone == [["o", "."], [".", "o"]]
```

#### Hint

`[[0] * 3] * 2` repeats **the same** inner list twice. Build each row in a comprehension instead. For the copy, copy every row.

```python solution
def make_grid(rows, cols, fill=0):
    return [[fill] * cols for _ in range(rows)]


def clone_board(board):
    return [row[:] for row in board]
```

#### Why

`board[:]` or `list(board)` copies only the outer list, so both boards would share their rows (a shallow copy). Copying each row is enough for a 2-D grid. For any depth of nesting use `copy.deepcopy(obj)`. You'll need this in backtracking problems (sudoku, N-Queens) whenever you save a board state.


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

### pe03 | Fix the shared default list | fix

`add_tag` should return a fresh list each time you leave `tags` out, but the second call remembers the first. Fix it.

**New here:** default values are created **once**, when `def` runs; `None` as a "nothing passed" sentinel; `is None`.

```python starter
def add_tag(tag, tags=[]):
    tags.append(tag)
    return tags
```

```python tests
assert add_tag("a") == ["a"]
assert add_tag("b") == ["b"], "a second call starts from an empty list"
assert add_tag("c", ["x"]) == ["x", "c"]
mine = ["y"]
add_tag("z", mine)
assert mine == ["y", "z"], "a list you pass in is still extended"
```

#### Hint

Default to `None`, and make the new list inside the function body, which runs on every call.

```python solution
def add_tag(tag, tags=None):
    if tags is None:
        tags = []
    tags.append(tag)
    return tags
```

#### Why

`tags=[]` builds one list when the function is defined, and every call that leaves `tags` out shares it. The `None` sentinel moves the `[]` into the body, which runs per call. Compare with `is None`, not `== None`.


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

### py08 | What is the difference between a list and a tuple? | asked=5

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

### pe04 | Min, max and average in one go | write

Write `stats(nums)`: return a **tuple** `(smallest, largest, average)`, with the average rounded to 2 decimal places. An empty list returns `None`.

**New here:** returning several values as a tuple, unpacking it (`lo, hi, avg = …`), the built-ins `min`, `max`, `sum`, `len`, `round`, and "empty is falsy" (`if not nums`).

```python starter
def stats(nums):
    pass
```

```python tests
assert stats([3, 1, 2]) == (1, 3, 2.0)
assert stats([5]) == (5, 5, 5.0)
assert stats([1, 2, 2]) == (1, 2, 1.67), "average rounded to 2 places"
assert stats([]) is None, "an empty list gives None"
lo, hi, avg = stats([10, 20, 30, 40])
assert (lo, hi, avg) == (10, 40, 25.0), "the tuple unpacks into three names"
```

#### Hint

`return a, b, c` returns a tuple, no brackets needed. `round(x, 2)`.

```python solution
def stats(nums):
    if not nums:
        return None
    return min(nums), max(nums), round(sum(nums) / len(nums), 2)
```

#### Why

- A tuple is Python's lightweight "return several things". Java would need a record or an array.
- `/` **always** gives a float in Python (`7 / 2 == 3.5`). For Java-style integer division use `//` (`7 // 2 == 3`).
- Empty containers, `0`, `""` and `None` all count as false, so `if not nums:` is the usual empty check.


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

### pe40 | Move zeroes in place | write

Write `move_zeroes(nums)`: move every `0` to the end **in place**, keeping the other numbers in order. Return nothing. Use O(n) time and O(1) extra space.

**New here:** changing a list in place (the caller sees it), the swap `a[i], a[j] = a[j], a[i]`, and two pointers.

```python starter
def move_zeroes(nums):
    pass
```

```python tests
nums = [0, 1, 0, 3, 12]
assert move_zeroes(nums) is None, "in place: returns nothing, like list.sort()"
assert nums == [1, 3, 12, 0, 0]
same = [1, 2]
move_zeroes(same)
assert same == [1, 2]
zeros = [0, 0]
move_zeroes(zeros)
assert zeros == [0, 0]
```

#### Hint

Keep a `write` index. Walk `read` over the list, and every time `nums[read]` isn't zero, swap it into `nums[write]` and move `write` on.

```python solution
def move_zeroes(nums):
    write = 0
    for read in range(len(nums)):
        if nums[read] != 0:
            nums[write], nums[read] = nums[read], nums[write]
            write += 1
```

#### Why

Python lists are dynamic arrays. `append` and `pop()` at the end are O(1), but `insert(0, x)`, `pop(0)` and `remove(x)` shift everything, so they're O(n). Using them in a loop makes it O(n²). Note that `nums = something_new` inside the function only rebinds the local name. To replace the contents in place, write `nums[:] = something_new`.


### py10 | How does a dict work internally? | asked=1

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

### pe05 | Two Sum with a dict | write

Write `two_sum(nums, target)`: return the indices `[i, j]` (with `i < j`) of the two numbers that add up to `target`, or `[]` if there are none. Do it in **one pass** with a dict.

**New here:** a dict as a HashMap, `key in d`, `d[key] = value`, and `enumerate` for index and value together.

```python starter
def two_sum(nums, target):
    pass
```

```python tests
assert two_sum([2, 7, 11, 15], 9) == [0, 1]
assert two_sum([3, 2, 4], 6) == [1, 2]
assert two_sum([3, 3], 6) == [0, 1], "the same value twice"
assert two_sum([-1, 5, 8, 0], -1) == [0, 3]
assert two_sum([1, 2], 10) == [], "no pair gives an empty list"
```

#### Hint

For each number `n`, the partner you need is `target - n`. Keep a dict of value → index for the numbers seen so far.

```python solution
def two_sum(nums, target):
    seen = {}                      # value -> index
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i
    return []
```

#### Why

`for i, n in enumerate(nums)` is Python's `for (int i = 0; …)` with the value handed to you. `in` on a dict checks the **keys** in O(1), so the whole thing is O(n) time and O(n) space. Say that out loud in an interview.


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

### pe06 | First repeated item | write

Write `first_repeat(items)`: scan from the left and return the first item that shows up a **second** time, or `None` if nothing repeats. It should work on any iterable: a list, a string…

**New here:** `set()`, `.add`, O(1) membership with `in`, and looping over any iterable.

```python starter
def first_repeat(items):
    pass
```

```python tests
assert first_repeat([3, 1, 4, 1, 5, 3]) == 1, "1 repeats before 3 does"
assert first_repeat(["a", "b", "c"]) is None
assert first_repeat([]) is None
assert first_repeat("hello") == "l", "a string is iterable too"
```

```python solution
def first_repeat(items):
    seen = set()
    for x in items:
        if x in seen:
            return x
        seen.add(x)
    return None
```

#### Why

A set is a HashSet. `{}` is an empty **dict**, so an empty set is `set()`. Sets also have operators worth knowing: `a & b` (in both), `a | b` (in either), `a - b` (only in a).


### py12 | Why are strings immutable, and how should you build strings efficiently? | asked=2

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

### pe07 | Run-length compress a string | write

Write `compress(s)`: turn runs of the same character into the character plus the run length. `"aaabccdddd"` becomes `"a3b1c2d4"`.

**New here:** building a string the fast way (collect pieces in a list, `"".join` them once), f-strings, and swapping two names at once with `prev, count = ch, 1`.

```python starter
def compress(s):
    pass
```

```python tests
assert compress("aaabccdddd") == "a3b1c2d4"
assert compress("abc") == "a1b1c1"
assert compress("aabaa") == "a2b1a2", "runs, not totals"
assert compress("z") == "z1"
assert compress("") == ""
```

#### Hint

Remember the previous character and how many times you've seen it in a row. When the character changes, write out the finished run. Don't forget the last run after the loop.

```python solution
def compress(s):
    if not s:
        return ""
    parts = []
    prev, count = s[0], 0
    for ch in s:
        if ch == prev:
            count += 1
        else:
            parts.append(f"{prev}{count}")
            prev, count = ch, 1
    parts.append(f"{prev}{count}")
    return "".join(parts)
```

#### Why

Strings are immutable, so `result += piece` in a loop can copy the growing string each time. A list plus one `join` is linear, the same idea as Java's `StringBuilder`. `f"{prev}{count}"` drops the values straight into the text. (The library way is `itertools.groupby(s)`, but write the loop in an interview.)


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

### pe08 | Slicing | predict

What does each line print?

**New here:** `[start:stop:step]`, negative indexes counting from the end, `[::-1]` to reverse, and slices that never raise `IndexError`.

```python predict
s = "python"
print(s[1:4])
print(s[-2:])
print(s[::2])
print(s[::-1])
nums = [0, 1, 2, 3, 4, 5]
print(nums[2:-1])
print(nums[10:])
print(nums[-3:] + nums[:2])
```

```python solution
yth
on
pto
nohtyp
[2, 3, 4]
[]
[3, 4, 5, 0, 1]
```

#### Why

A slice starts at `start` and stops **before** `stop`. A missing `start` or `stop` means "from the beginning" or "to the end". `-1` is the last item, so `[2:-1]` drops the last one. An out-of-range slice just comes back empty. A negative step walks backwards, so `[::-1]` is a reversed copy.

### pe09 | Palindrome check | write

Write `is_palindrome(s)`: `True` if `s` reads the same backwards, **ignoring case and anything that isn't a letter or digit**.

**New here:** `str.lower()`, `str.isalnum()`, a generator expression inside `"".join(…)`, and `[::-1]` for a reversed copy.

```python starter
def is_palindrome(s):
    pass
```

```python tests
assert is_palindrome("racecar")
assert is_palindrome("A man, a plan, a canal: Panama")
assert is_palindrome("Was it a car or a cat I saw?")
assert not is_palindrome("hello")
assert is_palindrome(""), "the empty string counts"
```

```python solution
def is_palindrome(s):
    cleaned = "".join(ch.lower() for ch in s if ch.isalnum())
    return cleaned == cleaned[::-1]
```

#### Why

`"".join(ch.lower() for ch in s if ch.isalnum())` reads like a sentence: keep the letters and digits, lowercased, glued together. If the interviewer wants O(1) extra space, use two indexes walking inwards (`i, j = 0, len(s) - 1`) and skip non-alphanumerics, the same algorithm you'd write in Java.


### py14 | What are list, dict and set comprehensions, and generator expressions? | asked=11

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

### pe10 | Three comprehensions | write

Fill in three one-liners, one of each kind of comprehension:

1. `squares_of_evens(nums)`: a **list** of the squares of the even numbers.
2. `lengths(words)`: a **dict** of word → its length.
3. `initials(names)`: a **set** of the first letters, uppercased.

**New here:** `[x for …]`, `{k: v for …}`, `{x for …}`, and the `if` filter inside a comprehension.

```python starter
def squares_of_evens(nums):
    pass


def lengths(words):
    pass


def initials(names):
    pass
```

```python tests
assert squares_of_evens([1, 2, 3, 4]) == [4, 16]
assert squares_of_evens([-2, 3]) == [4]
assert squares_of_evens([]) == []
assert lengths(["hi", "hello"]) == {"hi": 2, "hello": 5}
assert initials(["alice", "Bob", "anna"]) == {"A", "B"}
```

#### Hint

The shape is always *expression*, then `for`, then an optional `if`: `[n * n for n in nums if n % 2 == 0]`.

```python solution
def squares_of_evens(nums):
    return [n * n for n in nums if n % 2 == 0]


def lengths(words):
    return {w: len(w) for w in words}


def initials(names):
    return {name[0].upper() for name in names}
```

#### Why

Comprehensions replace most "make an empty list, loop, append" code, and the Java Stream `filter → map → collect`. The brackets say what you get back: `[]` a list, `{k: v}` a dict, `{x}` a set, and `()` a lazy generator.


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

### pe11 | Group anagrams | write

Write `group_anagrams(words)`: put words made of the same letters together. Return the groups as a list of lists, with groups in the order their first word appeared.

**New here:** `collections.defaultdict(list)`, `sorted()` on a string, a string as a dict key, and dicts keeping insertion order.

```python starter
from collections import defaultdict


def group_anagrams(words):
    pass
```

```python tests
assert group_anagrams(["eat", "tea", "tan", "ate", "nat", "bat"]) == [["eat", "tea", "ate"], ["tan", "nat"], ["bat"]]
assert group_anagrams(["a"]) == [["a"]]
assert group_anagrams([]) == []
```

#### Hint

Two words are anagrams when their sorted letters match: `"".join(sorted("tea")) == "aet"`. Use that as the key.

```python solution
from collections import defaultdict


def group_anagrams(words):
    groups = defaultdict(list)
    for w in words:
        groups["".join(sorted(w))].append(w)
    return list(groups.values())
```

#### Why

`defaultdict(list)` creates the empty list the first time you touch a key, so there's no `if key not in d: d[key] = []` (Java's `computeIfAbsent`). `sorted("tea")` returns a list of characters, and `join` turns it back into a hashable string. Since 3.7 dicts keep insertion order, which is why the groups come out in first-seen order. Time: O(n · k log k) for n words of length k.


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

### pe12 | Leaderboard | write

Write `leaderboard(scores)`, where `scores` is a dict of name → points. Return lines like `"1. alice (90)"`, highest points first, with **ties in name order**.

**New here:** `sorted(…, key=…)` with a `lambda`, sorting by a tuple key, `-x` to flip one part, `.items()`, and `enumerate(…, start=1)`.

```python starter
def leaderboard(scores):
    pass
```

```python tests
assert leaderboard({"bob": 70, "alice": 90, "cara": 70}) == ["1. alice (90)", "2. bob (70)", "3. cara (70)"]
assert leaderboard({"zed": 1}) == ["1. zed (1)"]
assert leaderboard({}) == []
```

#### Hint

`key=lambda kv: (-kv[1], kv[0])` sorts by points descending, then by name ascending.

```python solution
def leaderboard(scores):
    ranked = sorted(scores.items(), key=lambda kv: (-kv[1], kv[0]))
    return [f"{i}. {name} ({pts})" for i, (name, pts) in enumerate(ranked, start=1)]
```

#### Why

Python sorts by comparing whatever `key` returns, and tuples compare item by item, so a tuple key is a multi-field `Comparator` in one line. `for i, (name, pts) in …` unpacks the index and the pair at once. Python's sort is stable (Timsort), which also lets you sort twice: by the minor key first, then the major one.


## Functions and scope

### py17 | What are *args and **kwargs? | asked=3

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

### pe13 | Build an HTML tag | write

Write `make_tag(name, *children, **attrs)`:
`make_tag("a", "docs", href="/docs")` returns `'<a href="/docs">docs</a>'`. The children are joined with nothing between them, and the attributes keep the order they were passed in.

**New here:** `*args` arrives as a tuple and `**kwargs` as a dict, and `*` / `**` also **unpack** when you call a function.

```python starter
def make_tag(name, *children, **attrs):
    # children: a tuple of strings; attrs: a dict of attribute -> value
    pass
```

```python tests
assert make_tag("p", "hi") == "<p>hi</p>"
assert make_tag("a", "docs", href="/docs") == '<a href="/docs">docs</a>'
assert make_tag("div", "a", "b", id="x", title="y") == '<div id="x" title="y">ab</div>'
assert make_tag("br") == "<br></br>"
parts = ["one", "two"]
assert make_tag("li", *parts) == "<li>onetwo</li>", "unpacking a list into *children"
opts = {"lang": "en"}
assert make_tag("html", **opts) == '<html lang="en"></html>', "unpacking a dict into **attrs"
```

```python solution
def make_tag(name, *children, **attrs):
    attr_text = "".join(f' {k}="{v}"' for k, v in attrs.items())
    return f"<{name}{attr_text}>{''.join(children)}</{name}>"
```

#### Why

`*children` collects any number of positional arguments, like Java varargs. `**attrs` collects keyword arguments into a dict, which Java has no direct equivalent for. At a call site, `f(*lst)` spreads a list into positional arguments and `f(**d)` spreads a dict into keyword arguments. That's how decorators pass everything through: `fn(*args, **kwargs)`.


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

### pe14 | A counter that remembers | write

Write `make_counter(start=0)`: it returns a **function**, and each call to that function returns the next number. Every counter keeps its own count.

**New here:** functions as values, a function defined inside a function, a closure keeping a variable alive, and `nonlocal`.

```python starter
def make_counter(start=0):
    pass
```

```python tests
c = make_counter()
assert c() == 1
assert c() == 2
d = make_counter(10)
assert d() == 11, "each counter has its own count"
assert c() == 3, "and the first one carried on"
```

#### Hint

Define `def next_number():` inside, and return it **without calling it** (`return next_number`, no brackets). Changing the outer variable needs `nonlocal count`.

```python solution
def make_counter(start=0):
    count = start

    def next_number():
        nonlocal count
        count += 1
        return count

    return next_number
```

#### Why

The inner function closes over `count`: it keeps the variable alive after `make_counter` has returned. Without `nonlocal`, the line `count += 1` would make `count` a new **local** variable and raise `UnboundLocalError`. In Java, a lambda can only capture effectively-final variables, so you'd need an `AtomicInteger` or a class.


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

### pe15 | When closures look up names | predict

What does it print?

**New here:** a closure looks a name up **when it's called**, not when it's created, and a default argument freezes the value early.

```python predict
funcs = []
for i in range(3):
    funcs.append(lambda: i * 10)
print([f() for f in funcs])

fixed = [lambda i=i: i * 10 for i in range(3)]
print([f() for f in fixed])

def outer():
    x = "outer"
    def inner():
        return x
    x = "changed"
    return inner()
print(outer())
```

```python solution
[20, 20, 20]
[0, 10, 20]
changed
```

#### Why

All three lambdas share one `i` and read it only when called, after the loop has finished with `i == 2`. `lambda i=i:` copies the current `i` into a default, which is evaluated at definition time. `inner` reads `x` when it's called, by which point `x` is `"changed"`.


### py20 | What are decorators, and how do they work? | asked=17

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

### pe16 | A memoize decorator | write

Write `memoize(fn)`: a decorator that remembers `fn`'s result for each set of arguments, so repeat calls skip the work. Keep the function's name with `functools.wraps`.

**New here:** a decorator is a function that takes a function and returns a new one, `@` is shorthand for `f = memoize(f)`, a cache dict inside a closure, `*args` as a dict key, and `functools.wraps`.

```python starter
import functools


def memoize(fn):
    # return a wrapper that remembers fn's result for each set of arguments
    return fn
```

```python tests
calls = []

@memoize
def square(n):
    calls.append(n)
    return n * n

assert square(4) == 16
assert square(4) == 16
assert calls == [4], "the second square(4) came from the cache"
assert square(5) == 25
fib_calls = []

@memoize
def fib(n):
    fib_calls.append(n)
    return n if n < 2 else fib(n - 1) + fib(n - 2)

assert fib(20) == 6765
assert len(fib_calls) == 21, "each n from 0 to 20 computed once (21,891 calls without the cache)"
assert fib.__name__ == "fib", "functools.wraps keeps the name"
```

#### Hint

```python
def memoize(fn):
    cache = {}
    @functools.wraps(fn)
    def wrapper(*args):
        ...           # look in cache, else call fn(*args) and store it
    return wrapper
```

```python solution
import functools


def memoize(fn):
    cache = {}

    @functools.wraps(fn)
    def wrapper(*args):
        if args not in cache:
            cache[args] = fn(*args)
        return cache[args]

    return wrapper
```

#### Why

`args` is a tuple, and tuples are hashable, so they work as dict keys (lists don't). Recursive calls to `fib` go through the decorated name, so they hit the cache too. That's what turns an exponential `fib` into a linear one. In real code use the built-in `@functools.cache` (or `lru_cache(maxsize=…)`), but interviewers like you to write this one by hand.


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

### pe41 | A retry decorator | write

Write `retry(times, exceptions=(Exception,))`, a decorator **with arguments**: it calls the function up to `times` times in total, tries again only on the listed exceptions, and lets the last error out.

**New here:** three levels of nesting (arguments → decorator → wrapper), `except` with a tuple of exception types, and a bare `raise` to re-raise.

```python starter
import functools


def retry(times, exceptions=(Exception,)):
    # retry(3) must RETURN a decorator; that decorator wraps the function
    pass
```

```python tests
attempts = []

@retry(3)
def flaky():
    attempts.append(1)
    if len(attempts) < 3:
        raise ConnectionError("try again")
    return "ok"

assert flaky() == "ok", "succeeds on the third try"
assert len(attempts) == 3
tries = []

@retry(2)
def always_fails():
    tries.append(1)
    raise TimeoutError("down")

assert raises(TimeoutError, always_fails), "after the last try, the error comes out"
assert len(tries) == 2, "tried exactly twice"
wrong = []

@retry(5, exceptions=(ConnectionError,))
def bad_input():
    wrong.append(1)
    raise ValueError("bad")

assert raises(ValueError, bad_input)
assert len(wrong) == 1, "errors not listed in `exceptions` aren't retried"
assert flaky.__name__ == "flaky"
```

#### Hint

```python
def retry(times, exceptions=(Exception,)):
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            ...   # loop; try fn; on the last attempt, `raise`
        return wrapper
    return decorator
```

```python solution
import functools


def retry(times, exceptions=(Exception,)):
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            for attempt in range(1, times + 1):
                try:
                    return fn(*args, **kwargs)
                except exceptions:
                    if attempt == times:
                        raise
        return wrapper
    return decorator
```

#### Why

`@retry(3)` first **calls** `retry(3)`, which returns the real decorator, and that decorator is then applied to the function. A bare `raise` inside `except` re-raises the current error with its traceback. In real code, add a backoff between tries (`time.sleep(base * 2 ** attempt)`) or use the `tenacity` library. This is the usual wrapper around LLM and HTTP calls.


### py61 | Write a decorator that logs every call (arguments, duration, result or exception). What happens on a recursive function? | asked=3

```python
import functools, logging, time

log = logging.getLogger(__name__)

def log_calls(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):                       # works for any signature
        call = ", ".join([*map(repr, args), *(f"{k}={v!r}" for k, v in kwargs.items())])
        start = time.perf_counter()
        try:
            result = func(*args, **kwargs)
        except Exception:
            log.exception("%s(%s) raised after %.2fms", func.__name__, call, (time.perf_counter() - start) * 1000)
            raise                                       # never swallow the caller's error
        log.info("%s(%s) -> %r in %.2fms", func.__name__, call, result, (time.perf_counter() - start) * 1000)
        return result
    return wrapper
```

**The recursion trap** (a real follow-up): decorating a recursive function wraps **every** recursive call, because the function's name now points at the wrapper:

```python
@timer
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)   # these calls go through the wrapper too

fib(20)   # prints ~20,000 timing lines, not one
```

Fixes:
1. Decorate a thin **outer** function and keep the recursion in an inner one:
```python
@timer
def fib(n):
    def _fib(k):
        return k if k < 2 else _fib(k - 1) + _fib(k - 2)
    return _fib(n)
```
2. Or track the **depth** inside the wrapper and only log the outermost call:
```python
def timer(func):
    depth = 0
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        nonlocal depth
        depth += 1
        start = time.perf_counter()
        try:
            return func(*args, **kwargs)
        finally:
            depth -= 1
            if depth == 0:
                print(f"{func.__name__} took {time.perf_counter() - start:.3f}s")
    return wrapper
```

The flip side: `@lru_cache` on a recursive function *wants* this behaviour. Every recursive call hitting the cache is what makes memoised fibonacci fast.

### pe42 | A call-tracing decorator | write

Write `@trace`: for each call, add `"name(args) -> result"` to `CALLS`, or `"name(args) raised ErrorName"` if it raised (and still let the error out). Show arguments with `repr`, and keyword arguments as `key=value`.

**New here:** `!r` in f-strings, logging and then re-raising, and what a decorator does to a recursive function.

```python starter
import functools

CALLS = []


def trace(fn):
    return fn
```

```python tests
@trace
def add(a, b):
    return a + b

assert add(2, 3) == 5
assert CALLS[-1] == "add(2, 3) -> 5"

@trace
def div(a, b):
    return a / b

assert raises(ZeroDivisionError, div, 1, 0), "the error still reaches the caller"
assert CALLS[-1] == "div(1, 0) raised ZeroDivisionError"

@trace
def greet(name, punct="!"):
    return f"hi {name}{punct}"

assert greet("asha", punct="?") == "hi asha?"
assert CALLS[-1] == "greet('asha', punct='?') -> 'hi asha?'", "repr of args, key=value for kwargs"
CALLS.clear()

@trace
def fact(n):
    return 1 if n <= 1 else n * fact(n - 1)

assert fact(3) == 6
assert CALLS == ["fact(1) -> 1", "fact(2) -> 2", "fact(3) -> 6"], "recursive calls are traced too, innermost first"
```

```python solution
import functools

CALLS = []


def trace(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        parts = [repr(a) for a in args] + [f"{k}={v!r}" for k, v in kwargs.items()]
        call = f"{fn.__name__}({', '.join(parts)})"
        try:
            result = fn(*args, **kwargs)
        except Exception as e:
            CALLS.append(f"{call} raised {type(e).__name__}")
            raise
        CALLS.append(f"{call} -> {result!r}")
        return result
    return wrapper
```

#### Why

`{v!r}` formats with `repr`, so strings get their quotes. The recursive `fact(n - 1)` looks up the name `fact`, which is now the wrapper, so every level is traced, and inner calls finish first. For timing, take `time.perf_counter()` before and after. In a real service you'd call `logger.info(...)` from the `logging` module instead of appending to a list.


### py22 | What are lambda functions, and how do map, filter and reduce compare with comprehensions? | asked=1

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

### pe43 | Largest number, with a comparator | write

Write `largest_number(nums)`: arrange the non-negative integers to form the largest number, returned as a string. `[3, 30, 34, 5, 9]` gives `"9534330"`.

**New here:** `functools.cmp_to_key`, which turns a Java-style comparator (negative / zero / positive) into a `key=`.

```python starter
from functools import cmp_to_key


def largest_number(nums):
    pass
```

```python tests
assert largest_number([10, 2]) == "210"
assert largest_number([3, 30, 34, 5, 9]) == "9534330"
assert largest_number([0, 0]) == "0", "no leading zeros"
assert largest_number([1]) == "1"
```

#### Hint

As strings, `a` should come before `b` when `a + b > b + a` (`"9" + "34"` beats `"34" + "9"`).

```python solution
from functools import cmp_to_key


def largest_number(nums):
    strs = [str(n) for n in nums]

    def compare(a, b):
        if a + b > b + a:
            return -1
        if a + b < b + a:
            return 1
        return 0

    strs.sort(key=cmp_to_key(compare))
    result = "".join(strs)
    return "0" if result[0] == "0" else result
```

#### Why

Python's sort only takes a `key`. When the order depends on comparing two items **together**, wrap a comparator with `cmp_to_key`. That's the Java `Comparator` you already know. The other functools tools to know are `cache` / `lru_cache` (E16), `wraps`, `partial` (pre-fill some arguments) and `reduce`.


## Iterators and generators

### py24 | What is the difference between an iterable and an iterator? | asked=4

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

### pe44 | A peeking iterator | write

Write `PeekingIterator(iterable)` with `peek()` (the next value, without using it up), `has_next()`, and the iterator protocol, so `next(it)` and `for x in it` work.

**New here:** `iter()`, `next(it, default)`, `__iter__` / `__next__`, `StopIteration`, and a sentinel object.

```python starter
class PeekingIterator:
    def __init__(self, iterable):
        pass

    def peek(self):
        pass

    def has_next(self):
        pass

    def __iter__(self):
        return self

    def __next__(self):
        raise StopIteration
```

```python tests
it = PeekingIterator([1, 2, 3])
assert it.peek() == 1
assert it.peek() == 1, "peek doesn't move forward"
assert next(it) == 1
assert next(it) == 2
assert it.has_next()
assert next(it) == 3
assert not it.has_next()
assert raises(StopIteration, next, it), "next() past the end raises StopIteration"
assert list(PeekingIterator("abc")) == ["a", "b", "c"], "works with list() and for loops"
assert list(PeekingIterator(x * x for x in range(3))) == [0, 1, 4], "and on a generator"
```

#### Hint

Always hold the **next** value ready: `self._it = iter(iterable)` and `self._next = next(self._it, END)`, where `END = object()` marks "no more".

```python solution
END = object()


class PeekingIterator:
    def __init__(self, iterable):
        self._it = iter(iterable)
        self._next = next(self._it, END)

    def peek(self):
        if self._next is END:
            raise StopIteration
        return self._next

    def has_next(self):
        return self._next is not END

    def __iter__(self):
        return self

    def __next__(self):
        value = self.peek()
        self._next = next(self._it, END)
        return value
```

#### Why

A `for` loop calls `iter(x)` once, then `next()` until `StopIteration`. An **iterable** (a list) gives you a fresh iterator each time, while an **iterator** is one pass only. `next(it, default)` returns the default instead of raising. This is LeetCode 284, and the same idea behind the "BST iterator" questions.


### py25 | What are generators, and how does yield work? | asked=16

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

### pe17 | Chunk a list with a generator | write

Write a **generator** `chunks(items, size)` that yields consecutive slices of `size` items (the last one may be shorter).

**New here:** `yield`, `range(start, stop, step)`, and laziness: nothing runs until someone asks for the next value.

```python starter
def chunks(items, size):
    pass
```

```python tests
import types
assert list(chunks([1, 2, 3, 4, 5], 2)) == [[1, 2], [3, 4], [5]]
assert list(chunks([1, 2, 3], 3)) == [[1, 2, 3]]
assert list(chunks([], 4)) == []
assert list(chunks("abcdefg", 3)) == ["abc", "def", "g"], "slices keep the type: a string gives strings"
assert isinstance(chunks([1], 1), types.GeneratorType), "uses yield"
```

```python solution
def chunks(items, size):
    for i in range(0, len(items), size):
        yield items[i:i + size]
```

#### Why

Any function containing `yield` returns a generator. Each `next()` runs the body up to the next `yield` and pauses there. `range(0, len(items), size)` steps through 0, size, 2·size… and the slice `items[i:i + size]` never runs off the end. Generators are how Python streams big files and pages through results using constant memory.


### py26 | What is the difference between a generator and a list (and between yield and return)? | asked=4

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

### pe45 | Generators run once, and lazily | predict

What does it print?

**New here:** a generator is used up after one pass, and its body runs only when you ask for the next value.

```python predict
squares = (n * n for n in range(4))
print(sum(squares))
print(sum(squares))
nums = [n * n for n in range(4)]
print(sum(nums), sum(nums))

def gen():
    print("start")
    yield 1
    print("end")

g = gen()
print("made")
print(next(g))
print(list(g))
```

```python solution
14
0
14 14
made
start
1
end
[]
```

#### Why

The first `sum` uses up the generator, so the second gets nothing and returns 0. A list can be summed again and again. Calling `gen()` runs **none** of its body. `next(g)` runs up to the first `yield`, and `list(g)` resumes after it, prints `end`, and finds no more values. That's a classic bug: passing a generator to two consumers.


### py63 | What are async generators and async iterators? | asked=1

An **async generator** is an `async def` function that uses `yield`. It produces values **lazily**, and it can `await` between them: ideal for streaming data that arrives over the network.

```python
import asyncio, httpx

async def paginate(client: httpx.AsyncClient, url: str):
    """Yield every item across all pages, fetching each page only when it's needed."""
    while url:
        r = await client.get(url)                  # await inside the generator
        data = r.json()
        for item in data["items"]:
            yield item                             # hand back one item at a time
        url = data.get("next")

async def main():
    async with httpx.AsyncClient() as client:
        async for item in paginate(client, "https://api.example.com/orders"):   # async for
            process(item)
            if done(item):
                break                              # stops fetching further pages

# async comprehension
names = [u["name"] async for u in paginate(client, url)]
```

The protocol underneath (the async version of the iterator protocol):
- an **async iterable** has `__aiter__()`, which returns an async iterator;
- an **async iterator** has `async __anext__()`, which raises `StopAsyncIteration` at the end.

Where you meet them:
- streaming LLM tokens (`async for chunk in client.messages.stream(...)`);
- reading a DB cursor or Kafka consumer without loading everything;
- FastAPI `StreamingResponse` and Server-Sent Events, which take an async generator;
- `async with` + `async for` in aiohttp, httpx and websockets.

Caveats: you can't use a plain `for` on them; closing early runs the generator's cleanup (`finally`) via `aclose()`; and `contextlib.aclosing()` guarantees that cleanup happens.

### pe46 | Stream tokens with an async generator | write

1. `stream_tokens(text)`: an **async generator** yielding each word of `text`, with `await asyncio.sleep(0)` before each one (standing in for the network).
2. `first_n(agen, n)`: collect up to `n` items from an async generator with `async for`.

**New here:** `yield` inside `async def`, `async for`, and async comprehensions. This is how LLM responses stream.

```python starter
import asyncio


async def stream_tokens(text):
    pass


async def first_n(agen, n):
    pass
```

```python tests
import inspect
assert inspect.isasyncgen(stream_tokens("a b")), "uses yield inside async def"
assert [t async for t in stream_tokens("hello brave new world")] == ["hello", "brave", "new", "world"]
assert await first_n(stream_tokens("one two three four"), 2) == ["one", "two"]
assert await first_n(stream_tokens("solo"), 5) == ["solo"]
```

```python solution
import asyncio


async def stream_tokens(text):
    for word in text.split():
        await asyncio.sleep(0)
        yield word


async def first_n(agen, n):
    items = []
    async for item in agen:
        items.append(item)
        if len(items) == n:
            break
    return items
```

#### Why

The Anthropic and OpenAI SDKs stream with `async for chunk in stream:`. FastAPI's `StreamingResponse` takes an async generator like `stream_tokens`. `await asyncio.sleep(0)` hands control back to the event loop so other tasks can run, and `break` stops pulling from the stream early.


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

### pe18 | An endless Fibonacci stream | write

1. Write `fibonacci()`: an **infinite** generator of 0, 1, 1, 2, 3, 5, …
2. Write `first_over(limit)`: the first Fibonacci number greater than `limit`, using your generator.

**New here:** `while True:` with `yield`, the swap `a, b = b, a + b`, `itertools.islice` to take n items from an endless stream, and `next()` on a generator expression.

```python starter
def fibonacci():
    pass


def first_over(limit):
    pass
```

```python tests
from itertools import islice
assert list(islice(fibonacci(), 8)) == [0, 1, 1, 2, 3, 5, 8, 13]
gen = fibonacci()
assert [next(gen), next(gen), next(gen)] == [0, 1, 1], "next() pulls one value at a time"
assert first_over(100) == 144
assert first_over(0) == 1
```

#### Hint

`next(x for x in fibonacci() if x > limit)` stops at the first match, so the endless stream is never a problem.

```python solution
def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b


def first_over(limit):
    return next(x for x in fibonacci() if x > limit)
```

#### Why

`a, b = b, a + b` evaluates the whole right side first, so there's no temp variable. An infinite generator is safe because the consumer decides how much to take: `islice` takes n items, and `next` takes the first one that matches. Never call `list()` on it!


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

### pe19 | A bank account class | write

Write a `BankAccount` class:
- `BankAccount(owner, balance=0)` stores `owner` and `balance`.
- `deposit(amount)` adds to the balance, and raises `ValueError` if the amount isn't positive.
- `withdraw(amount)` subtracts, and raises `ValueError` (changing nothing) if there isn't enough money.

**New here:** `class`, `__init__`, the explicit `self`, creating objects without `new`, and `raise`.

```python starter
class BankAccount:
    def __init__(self, owner, balance=0):
        pass

    def deposit(self, amount):
        pass

    def withdraw(self, amount):
        pass
```

```python tests
acct = BankAccount("asha", 100)
assert acct.owner == "asha"
assert acct.balance == 100
acct.deposit(50)
assert acct.balance == 150
acct.withdraw(30)
assert acct.balance == 120
assert raises(ValueError, acct.withdraw, 1000), "can't take out more than there is"
assert acct.balance == 120, "a refused withdrawal changes nothing"
assert raises(ValueError, acct.deposit, -5), "deposits must be positive"
assert BankAccount("ravi").balance == 0
```

```python solution
class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        if amount <= 0:
            raise ValueError("deposit must be positive")
        self.balance += amount

    def withdraw(self, amount):
        if amount > self.balance:
            raise ValueError("insufficient funds")
        self.balance -= amount
```

#### Why

`self` is Java's `this`, but you write it out as the first parameter. Fields aren't declared up front: assigning `self.balance = …` in `__init__` creates them. `BankAccount("asha", 100)` calls the class directly, with no `new`. `raise ValueError("…")` is `throw new IllegalArgumentException("…")`.


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

### py30 | What is the difference between instance methods, @classmethod and @staticmethod? | asked=2

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

### pe47 | classmethod and staticmethod | write

Add to `Point`:
- `@classmethod from_string("3,4")` returns `Point(3, 4)`, allowing spaces around the numbers.
- `@classmethod origin()` returns `Point(0, 0)`.
- `@staticmethod distance(a, b)` returns the straight-line distance.

**New here:** `cls` versus `self`, alternative constructors, and why a classmethod builds the right subclass.

```python starter
import math


class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y
```

```python tests
p = Point.from_string("3,4")
assert (p.x, p.y) == (3, 4)
assert (Point.origin().x, Point.origin().y) == (0, 0)
assert Point.distance(Point.origin(), p) == 5.0
assert Point.from_string(" 5 , -1 ").y == -1, "spaces are fine"

class Point3D(Point):
    pass

assert type(Point3D.from_string("1,2")) is Point3D, "cls(...), not Point(...): a subclass gets its own type back"
```

```python solution
import math


class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    @classmethod
    def from_string(cls, text):
        x, y = (int(part) for part in text.split(","))
        return cls(x, y)

    @classmethod
    def origin(cls):
        return cls(0, 0)

    @staticmethod
    def distance(a, b):
        return math.hypot(a.x - b.x, a.y - b.y)
```

#### Why

A classmethod receives the class, which is why it's the Python way to write extra constructors (`dict.fromkeys`, `datetime.fromisoformat`, Pydantic's `model_validate`). Because it calls `cls(...)`, a subclass gets an instance of itself, which Java static factories can't do. A staticmethod is just a function kept in the class's namespace, like a Java `static` helper.


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

### pe20 | A Fahrenheit property | write

Give `Temperature` a `fahrenheit` **property** (`celsius * 9 / 5 + 32`) and a **setter**, so `t.fahrenheit = 212` updates `celsius`.

**New here:** `@property` and `@x.setter`: attribute syntax with methods behind it, instead of Java's `getX()` / `setX()`.

```python starter
class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius

    # add a `fahrenheit` property and its setter here
```

```python tests
t = Temperature(100)
assert t.fahrenheit == 212.0
t.fahrenheit = 32
assert t.celsius == 0.0, "setting fahrenheit updates celsius"
assert Temperature(-40).fahrenheit == -40.0
```

```python solution
class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius

    @property
    def fahrenheit(self):
        return self.celsius * 9 / 5 + 32

    @fahrenheit.setter
    def fahrenheit(self, value):
        self.celsius = (value - 32) * 5 / 9
```

#### Why

In Python you start with plain attributes and switch to a `@property` later if you need logic, and callers never change. That's why Python code has no getters and setters "just in case". Store one source of truth (`celsius`) and compute the other.


### py32 | How do inheritance, super() and the MRO work (including multiple inheritance)? | asked=2

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

### pe21 | Shapes: inheritance and super() | write

`Shape` is done. Fill in `Rectangle(width, height)`, `Square(side)` (a kind of Rectangle) and `Circle(radius)`, each with an `area()` method.

**New here:** `class Child(Parent)`, overriding a method, `super().__init__(…)`, polymorphism, `import math`, and the f-string format `:.2f`.

```python starter
import math


class Shape:
    def area(self):
        raise NotImplementedError

    def describe(self):
        return f"{type(self).__name__} with area {self.area():.2f}"


class Rectangle(Shape):
    pass


class Square(Rectangle):
    pass


class Circle(Shape):
    pass
```

```python tests
assert Rectangle(2, 3).area() == 6
assert Square(4).area() == 16
assert isinstance(Square(1), Rectangle), "a Square is a Rectangle"
assert round(Circle(1).area(), 2) == 3.14
assert Square(2).describe() == "Square with area 4.00", "describe() is inherited and calls your area()"
shapes = [Rectangle(1, 2), Square(3), Circle(2)]
assert round(sum(s.area() for s in shapes), 2) == 23.57
```

#### Hint

`Square` only needs an `__init__` that calls `super().__init__(side, side)`, and it inherits `area` from `Rectangle`.

```python solution
import math


class Shape:
    def area(self):
        raise NotImplementedError

    def describe(self):
        return f"{type(self).__name__} with area {self.area():.2f}"


class Rectangle(Shape):
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        return self.width * self.height


class Square(Rectangle):
    def __init__(self, side):
        super().__init__(side, side)


class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return math.pi * self.radius ** 2
```

#### Why

`super().__init__(side, side)` runs the parent's constructor. Unlike Java it isn't automatic, so if you leave it out, `width` and `height` never get set. `describe()` lives in `Shape` but calls `self.area()`, which picks the subclass's version: that's polymorphism. `**` is power. `:.2f` formats to two decimals.


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

### pe22 | A Vector with operators | write

Make `Vector(x, y)` work with Python's operators: `+` adds vectors, `* k` scales, `abs(v)` is the length, `==` compares values, and `repr` prints `Vector(1, 2)`.

**New here:** dunder methods, `__add__`, `__mul__`, `__abs__`, `__eq__` (Java's `equals`) and `__repr__` (`toString`), plus `!=` and `sum()` working for free.

```python starter
import math


class Vector:
    def __init__(self, x, y):
        self.x = x
        self.y = y
```

```python tests
assert Vector(1, 2) == Vector(1, 2), "equal by value, not identity"
assert Vector(1, 2) + Vector(3, 4) == Vector(4, 6)
assert Vector(1, 2) * 3 == Vector(3, 6)
assert abs(Vector(3, 4)) == 5.0
assert repr(Vector(1, 2)) == "Vector(1, 2)"
assert Vector(1, 2) != Vector(2, 1)
assert sum([Vector(1, 1), Vector(2, 2)], Vector(0, 0)) == Vector(3, 3), "sum() works because + works"
```

```python solution
import math


class Vector:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self):
        return f"Vector({self.x}, {self.y})"

    def __eq__(self, other):
        return isinstance(other, Vector) and (self.x, self.y) == (other.x, other.y)

    def __add__(self, other):
        return Vector(self.x + other.x, self.y + other.y)

    def __mul__(self, k):
        return Vector(self.x * k, self.y * k)

    def __abs__(self):
        return math.hypot(self.x, self.y)
```

#### Why

`a + b` is really `a.__add__(b)`, `abs(v)` is `v.__abs__()`, and `a == b` is `a.__eq__(b)`. Without `__eq__`, `==` falls back to "same object". Python derives `!=` from `__eq__`. `sum()` just keeps using `+`, starting from the value you give it. (Defining `__eq__` makes objects unhashable unless you also define `__hash__`, the same contract as Java's `equals` / `hashCode`.)


### py34 | What are abstract base classes, duck typing and Protocols? | asked=3

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

### pe49 | Notifiers: abstract class and duck typing | write

- `Notifier` is an **abstract** class with an abstract `send(user, message)` and a normal method `notify_all(users, message)` that returns the list of `send` results.
- `EmailNotifier.send` returns `"email to {user}: {message}"`.
- `SmsNotifier.send` returns `"sms to {user}: {first 20 chars of message}"`.
- `broadcast(notifiers, user, message)` calls `send` on **anything** that has it.

**New here:** `ABC` and `@abstractmethod`, a template method in the base class, and duck typing.

```python starter
from abc import ABC, abstractmethod


class Notifier(ABC):
    pass


class EmailNotifier(Notifier):
    pass


class SmsNotifier(Notifier):
    pass


def broadcast(notifiers, user, message):
    pass
```

```python tests
assert raises(TypeError, Notifier), "an abstract class can't be created"

class Half(Notifier):
    pass

assert raises(TypeError, Half), "nor can a subclass that skipped send()"
assert EmailNotifier().send("asha", "hi") == "email to asha: hi"
assert SmsNotifier().send("ravi", "your order has shipped today") == "sms to ravi: your order has shipp"
assert EmailNotifier().notify_all(["a", "b"], "yo") == ["email to a: yo", "email to b: yo"]

class Pager:
    def send(self, user, message):
        return f"page {user}"

assert broadcast([EmailNotifier(), Pager()], "kim", "up") == ["email to kim: up", "page kim"], "duck typing: Pager just has a send()"
```

```python solution
from abc import ABC, abstractmethod


class Notifier(ABC):
    @abstractmethod
    def send(self, user, message):
        ...

    def notify_all(self, users, message):
        return [self.send(u, message) for u in users]


class EmailNotifier(Notifier):
    def send(self, user, message):
        return f"email to {user}: {message}"


class SmsNotifier(Notifier):
    def send(self, user, message):
        return f"sms to {user}: {message[:20]}"


def broadcast(notifiers, user, message):
    return [n.send(user, message) for n in notifiers]
```

#### Why

`ABC` plus `@abstractmethod` is Java's abstract class or interface, checked when you create an object. `broadcast` shows the other side of Python: it needs no base class at all, just an object with `send()`. `typing.Protocol` lets a type checker verify "has a `send`" without inheritance. This is the Strategy pattern from LLD rounds.


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

### pe23 | An order with dataclasses | write

Using `@dataclass`, write:
- `Item(name, price, qty=1)`
- `Order(id, items)`, where `items` starts as an empty list, with `add(item)` and `total()` (the sum of price × qty).

**New here:** `@dataclass` generates `__init__`, `__repr__` and `__eq__` from type-annotated fields, and `field(default_factory=list)` gives each object its own list (remember E3?).

```python starter
from dataclasses import dataclass, field

# Item: name (str), price (float), qty (int, default 1)

# Order: id (int), items (a list, empty to start), add(item), total()
```

```python tests
assert Item("pen", 10) == Item("pen", 10, 1), "dataclasses compare by value"
assert repr(Item("pen", 10)) == "Item(name='pen', price=10, qty=1)"
o = Order(1)
o.add(Item("pen", 10, 3))
o.add(Item("book", 250))
assert o.total() == 280
assert Order(2).items == [], "a new order starts empty, not sharing the first one's list"
```

#### Hint

```python
@dataclass
class Item:
    name: str
    price: float
    qty: int = 1
```
A field can't default to `[]`. Use `items: list = field(default_factory=list)`.

```python solution
from dataclasses import dataclass, field


@dataclass
class Item:
    name: str
    price: float
    qty: int = 1


@dataclass
class Order:
    id: int
    items: list = field(default_factory=list)

    def add(self, item):
        self.items.append(item)

    def total(self):
        return sum(i.price * i.qty for i in self.items)
```

#### Why

A dataclass is Python's answer to a Java `record` (or Lombok `@Data`). The annotations aren't enforced at runtime, they just name the fields. `default_factory=list` calls `list()` for every new object, which is exactly the mutable-default fix from E3, built in. Add `frozen=True` for immutability or `order=True` for `<`.

### pe48 | A priority task scheduler | write

Write `Scheduler` with `add(name, priority)` (a lower number is more urgent), `pop()` (the most urgent name; **equal priorities come out first-in, first-out**; an empty scheduler raises `IndexError`) and `len(s)`.

**New here:** `heapq` with records, `@dataclass(order=True)` with `field(compare=False)`, `itertools.count()` as a tie-breaker, and `__len__`.

```python starter
import heapq
import itertools
from dataclasses import dataclass, field


class Scheduler:
    pass
```

```python tests
s = Scheduler()
s.add("email", 3)
s.add("deploy", 1)
s.add("lunch", 3)
s.add("fix bug", 1)
assert len(s) == 4
assert s.pop() == "deploy"
assert s.pop() == "fix bug", "ties: first in, first out"
assert s.pop() == "email"
assert len(s) == 1
assert s.pop() == "lunch"
assert raises(IndexError, s.pop), "popping an empty scheduler raises IndexError"
```

#### Hint

Push `Task(priority, seq, name)`, where `seq = next(counter)` grows with each add, and leave `name` out of comparisons.

```python solution
import heapq
import itertools
from dataclasses import dataclass, field


@dataclass(order=True)
class Task:
    priority: int
    seq: int
    name: str = field(compare=False)


class Scheduler:
    def __init__(self):
        self._heap = []
        self._counter = itertools.count()

    def add(self, name, priority):
        heapq.heappush(self._heap, Task(priority, next(self._counter), name))

    def pop(self):
        return heapq.heappop(self._heap).name

    def __len__(self):
        return len(self._heap)
```

#### Why

`heapq` orders items with `<`. `order=True` generates it from the fields in order, and `compare=False` leaves a field out. The ever-increasing `seq` breaks ties first-in, first-out and stops Python from ever comparing two things that can't be compared. A plain tuple `(priority, seq, name)` works the same way, and it's the pattern behind Dijkstra's `(dist, node)` heap.



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

### py38 | What is a metaclass? | asked=1

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

### pe50 | A singleton with __new__ | write

Make `Config()` return the **same object** every time, without wiping `settings` when it's called again.

**New here:** `__new__` creates the object and `__init__` fills it in, and `__init__` runs on **every** `Config()` call, even when `__new__` hands back the existing object.

```python starter
class Config:
    def __init__(self):
        self.settings = {}
```

```python tests
a = Config()
a.settings["env"] = "prod"
b = Config()
assert a is b, "every Config() is the same object"
assert b.settings == {"env": "prod"}, "calling Config() again doesn't wipe the settings"
assert Config().settings["env"] == "prod"
```

```python solution
class Config:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.settings = {}
        return cls._instance
```

#### Why

`Config()` runs `__new__` and then `__init__` on whatever it returned. So keeping `self.settings = {}` in `__init__` would reset it every time: set up state once, in `__new__`. The everyday Python singleton is simpler still: a module-level instance (`settings = Config()` in `config.py`), because modules are imported only once. Add a `threading.Lock` around the check if threads can race to create it.


## Errors and context managers

### py40 | How does exception handling work (try, except, else, finally)? | asked=4

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

### pe51 | try, except, else, finally | predict

What does it print?

**New here:** the order of `try` / `except` / `else` / `finally`, and `finally` running even when the block `return`s.

```python predict
def divide(a, b):
    try:
        print("try")
        result = a // b
    except ZeroDivisionError:
        print("except")
        return "error"
    else:
        print("else")
        return result
    finally:
        print("finally")

print(divide(7, 2))
print(divide(1, 0))

def tricky():
    try:
        return "from try"
    finally:
        print("cleanup runs first")

print(tricky())
```

```python solution
try
else
finally
3
try
except
finally
error
cleanup runs first
from try
```

#### Why

`else` runs only if the `try` raised nothing, which keeps the `try` block small. `finally` always runs, even on `return`. The return value is held while `finally` runs, so `"cleanup runs first"` prints before the caller prints the result. A `return` **inside** `finally` would override it (don't do that).


### py41 | How do you create custom exceptions, and what are EAFP and LBYL? | asked=2

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

### pe24 | Fix the number parser | fix

`parse_numbers(strings)` should return `(numbers, bad)`: every string `int()` can read goes into `numbers`, and the rest into `bad`. Checking `isdigit()` first gets negatives, `+2` and padded strings wrong. Switch to trying the conversion and catching the error.

**New here:** `try / except ValueError`, EAFP ("easier to ask forgiveness than permission") over LBYL ("look before you leap"), and returning two lists at once.

```python starter
def parse_numbers(strings):
    numbers, bad = [], []
    for s in strings:
        if s.isdigit():
            numbers.append(int(s))
        else:
            bad.append(s)
    return numbers, bad
```

```python tests
assert parse_numbers(["1", "x", "3"]) == ([1, 3], ["x"])
assert parse_numbers(["-3", "+2"]) == ([-3, 2], []), "isdigit() rejects these, int() doesn't"
assert parse_numbers([" 7 ", "4.5", ""]) == ([7], ["4.5", ""])
assert parse_numbers([]) == ([], [])
```

```python solution
def parse_numbers(strings):
    numbers, bad = [], []
    for s in strings:
        try:
            numbers.append(int(s))
        except ValueError:
            bad.append(s)
    return numbers, bad
```

#### Why

Let the function that knows the rules (`int`) decide, and catch the specific error it raises. Pre-checking duplicates those rules and gets them subtly wrong. Catch the **narrowest** exception (`ValueError`, never a bare `except:`), and keep the `try` block as small as you can.

### pe52 | Your own exception classes | write

- `NotFound(AppError)` with `status = 404`, and `Conflict(AppError)` with `status = 409`.
- `get_user` raises `NotFound("user 7 not found")` for a missing id, **chained** to the original `KeyError`.
- `add_user` raises `Conflict("user 1 already exists")` if the id is taken, changing nothing.

**New here:** subclassing `Exception`, a class attribute per error type, and `raise … from e`.

```python starter
class AppError(Exception):
    status = 500


def get_user(users, user_id):
    return users[user_id]


def add_user(users, user_id, name):
    users[user_id] = name
```

```python tests
users = {1: "asha"}
assert get_user(users, 1) == "asha"
assert raises(NotFound, get_user, users, 7)
assert raises(AppError, get_user, users, 7), "a NotFound is an AppError too"
try:
    get_user(users, 7)
except AppError as e:
    err = e
assert str(err) == "user 7 not found"
assert err.status == 404
assert isinstance(err.__cause__, KeyError), "raise ... from keeps the original KeyError"
assert raises(Conflict, add_user, users, 1, "ravi")
assert users == {1: "asha"}, "a refused add changes nothing"
add_user(users, 2, "ravi")
assert users[2] == "ravi"
```

```python solution
class AppError(Exception):
    status = 500


class NotFound(AppError):
    status = 404


class Conflict(AppError):
    status = 409


def get_user(users, user_id):
    try:
        return users[user_id]
    except KeyError as e:
        raise NotFound(f"user {user_id} not found") from e


def add_user(users, user_id, name):
    if user_id in users:
        raise Conflict(f"user {user_id} already exists")
    users[user_id] = name
```

#### Why

One base class for your app's errors lets the API layer catch `AppError` once and turn `status` into the HTTP response. That's exactly what a FastAPI exception handler does. `raise … from e` records the cause, and the traceback shows both errors. Subclass `Exception`, never `BaseException`.



### py42 | What are context managers, and how do you write one? | asked=2

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

### pe25 | A context manager that undoes itself | write

Write `temporarily(settings, key, value)` with `@contextmanager`: inside the `with` block `settings[key] == value`, and afterwards the old value is back, **even if the block raised**. A key that wasn't there before is removed again.

**New here:** `with`, `@contextmanager`, `try / finally` around `yield`, and a unique sentinel object for "was missing".

```python starter
from contextlib import contextmanager


@contextmanager
def temporarily(settings, key, value):
    # set settings[key] = value for the with-block, then put back what was there
    yield
```

```python tests
cfg = {"debug": False}
with temporarily(cfg, "debug", True):
    inside = cfg["debug"]
assert inside is True, "set inside the block"
assert cfg["debug"] is False, "restored after the block"

def boom():
    with temporarily(cfg, "debug", True):
        raise RuntimeError("oops")

assert raises(RuntimeError, boom), "the error still comes out"
assert cfg == {"debug": False}, "restored even though the block raised"
with temporarily(cfg, "mode", "test"):
    pass
assert "mode" not in cfg, "a key that wasn't there is removed again"
```

#### Hint

Everything before `yield` is the "enter" part and everything after is the "exit" part. An exception in the `with` block is re-raised **at the `yield`**, so wrap the `yield` in `try / finally`.

```python solution
from contextlib import contextmanager

MISSING = object()


@contextmanager
def temporarily(settings, key, value):
    old = settings.get(key, MISSING)
    settings[key] = value
    try:
        yield settings
    finally:
        if old is MISSING:
            del settings[key]
        else:
            settings[key] = old
```

#### Why

`with` guarantees the cleanup, like Java's try-with-resources. `@contextmanager` lets you write one as a generator instead of a class with `__enter__` / `__exit__`. `MISSING = object()` is a value nobody else can have, so it tells "key absent" apart from "key set to `None`".


## Concurrency: GIL, threads, processes and asyncio

### py43 | What is the GIL? | asked=5

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

### py44 | When do you use threading vs multiprocessing vs asyncio? | asked=13

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

### py46 | How does asyncio work (event loop, coroutines, await)? | asked=3

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

### pe53 | Tasks and the event loop | predict

What does it print? (Top-level `await` works here like in a notebook. In a script you'd call `asyncio.run(main())`.)

**New here:** `create_task` starts a coroutine running in the background, `await` is where a coroutine lets others run, and finishing order follows the sleeps.

```python predict
import asyncio

async def worker(name, delay):
    print(name, "start")
    await asyncio.sleep(delay)
    print(name, "done")
    return name

async def main():
    t1 = asyncio.create_task(worker("A", 0.05))
    t2 = asyncio.create_task(worker("B", 0.01))
    print("tasks created")
    print(await t1, await t2)
    await worker("C", 0)
    print("main done")

await main()
```

```python solution
tasks created
A start
B start
B done
A done
A B
C start
C done
main done
```

#### Why

`create_task` schedules a coroutine but doesn't run it yet. Nothing else runs until `main` reaches its first `await`. Then A and B both start, each one pauses at its `sleep`, and B, with the shorter sleep, finishes first. `await worker("C", 0)` runs C right there, without a task. Everything is on **one** thread, and switching only happens at an `await`.


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

### pe26 | Fix the slow fetcher | fix

`fetch_all` gives the right results but waits for each fetch before starting the next. Make the fetches run **concurrently** and keep the results in the order of `jobs`.

**New here:** `async def`, `await`, and `asyncio.gather`. (Don't call `asyncio.run` here: the checks `await fetch_all(…)` for you. In a script you'd write `asyncio.run(main())`.)

```python starter
import asyncio


async def fetch(name, delay):
    await asyncio.sleep(delay)   # pretend this is a network call
    return name.upper()


async def fetch_all(jobs):
    # jobs: a list of (name, delay)
    results = []
    for name, delay in jobs:
        results.append(await fetch(name, delay))
    return results
```

```python tests
import time
start = time.perf_counter()
results = await fetch_all([("a", 0.3), ("b", 0.2), ("c", 0.3)])
elapsed = time.perf_counter() - start
assert results == ["A", "B", "C"], "results in the order of the jobs"
assert elapsed < 0.55, "ran together (about 0.3 s), not one after another (0.8 s)"
assert await fetch_all([]) == []
```

#### Hint

Calling `fetch(name, delay)` without `await` just makes a coroutine object. Hand them all to `asyncio.gather(*coros)` and await that once.

```python solution
import asyncio


async def fetch(name, delay):
    await asyncio.sleep(delay)
    return name.upper()


async def fetch_all(jobs):
    return await asyncio.gather(*(fetch(name, delay) for name, delay in jobs))
```

#### Why

`await` inside a loop is sequential: each wait finishes before the next one starts. `gather` starts them all on the event loop and returns their results **in the order you passed them**, whatever order they finish in. One thread does all of this, which is why asyncio suits I/O-bound work (HTTP calls, DB queries) and not CPU-bound work.


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

### pe54 | Limit concurrent API calls | fix

`run_all` fires every call at once. Allow at most `limit` calls running at the same time, still concurrent and still in prompt order.

**New here:** `asyncio.Semaphore`, `async with`, and a small async helper defined inside the function.

```python starter
import asyncio


async def call_llm(prompt, stats):
    stats["running"] += 1
    stats["peak"] = max(stats["peak"], stats["running"])
    await asyncio.sleep(0.05)       # pretend this is a slow API call
    stats["running"] -= 1
    return prompt.upper()


async def run_all(prompts, limit, stats):
    return await asyncio.gather(*(call_llm(p, stats) for p in prompts))
```

```python tests
stats = {"running": 0, "peak": 0}
results = await run_all([f"p{i}" for i in range(10)], 3, stats)
assert results == [f"P{i}" for i in range(10)], "results in prompt order"
assert stats["peak"] == 3, "never more than 3 at once, and all 3 slots used"
small = {"running": 0, "peak": 0}
assert await run_all(["a", "b"], 5, small) == ["A", "B"]
assert small["peak"] == 2
```

#### Hint

```python
sem = asyncio.Semaphore(limit)

async def limited(p):
    async with sem:
        return await call_llm(p, stats)
```

```python solution
import asyncio


async def call_llm(prompt, stats):
    stats["running"] += 1
    stats["peak"] = max(stats["peak"], stats["running"])
    await asyncio.sleep(0.05)
    stats["running"] -= 1
    return prompt.upper()


async def run_all(prompts, limit, stats):
    sem = asyncio.Semaphore(limit)

    async def limited(p):
        async with sem:
            return await call_llm(p, stats)

    return await asyncio.gather(*(limited(p) for p in prompts))
```

#### Why

LLM and HTTP APIs rate-limit you, and gathering 1,000 calls would open 1,000 connections. `Semaphore(n)` lets at most n coroutines inside `async with` at once while the rest wait their turn. For a **blocking** function (a sync SDK, file I/O) inside async code, use `await asyncio.to_thread(fn, *args)` so it doesn't freeze the loop.


## Memory, modules and tooling

### py49 | How does memory management and garbage collection work in Python? | asked=10

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

### py50 | What is the difference between a module and a package, and what does `if __name__ == "__main__"` do? | asked=1

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

### py54 | How do type hints work in Python, and are they enforced? | asked=1

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

### pe56 | Type-hinted helpers | write

Write both functions **with type hints**:
1. `group_by(items, key)`: a dict of `key(item)` → the items with that key, in order.
2. `first_or_none(items)`: the first item, or `None` for an empty list.

**New here:** annotations, `list[T]` and `dict[K, V]`, `Callable`, `TypeVar` generics, `T | None`, `setdefault`, and the conditional expression `a if cond else b`.

```python starter
from typing import Callable, TypeVar

T = TypeVar("T")
K = TypeVar("K")


def group_by(items, key):
    pass


def first_or_none(items):
    pass
```

```python tests
from typing import get_type_hints
assert group_by(["apple", "avocado", "banana"], key=lambda w: w[0]) == {"a": ["apple", "avocado"], "b": ["banana"]}
assert group_by([1, 2, 3, 4], key=lambda n: n % 2 == 0) == {False: [1, 3], True: [2, 4]}
assert first_or_none([]) is None
assert first_or_none([9, 8]) == 9
hints = get_type_hints(group_by)
assert set(hints) == {"items", "key", "return"}, "both parameters and the return value are annotated"
assert getattr(hints["return"], "__origin__", None) is dict, "returns a dict[K, list[T]]"
assert set(get_type_hints(first_or_none)) == {"items", "return"}
```

```python solution
from typing import Callable, TypeVar

T = TypeVar("T")
K = TypeVar("K")


def group_by(items: list[T], key: Callable[[T], K]) -> dict[K, list[T]]:
    groups: dict[K, list[T]] = {}
    for item in items:
        groups.setdefault(key(item), []).append(item)
    return groups


def first_or_none(items: list[T]) -> T | None:
    return items[0] if items else None
```

#### Why

Python never checks hints at runtime. mypy and pyright check them before you run, and FastAPI and Pydantic **read** them to validate and convert data. `TypeVar` is Java's `<T>`, and since 3.12 you can also write `def group_by[T, K](items: list[T], …)`. `d.setdefault(k, [])` returns the existing list or stores a new one, and `x if cond else y` is Java's `cond ? x : y`.


### py55 | What is Pydantic, and why is it used? | asked=2

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

### pe57 | A Pydantic model | write

Write a Pydantic `User` model:
- `name`: str, 1–50 characters
- `email`: str, must contain `@`, stored **lowercase**
- `age`: int, 0–150
- `tags`: list of str, empty by default

(The first run downloads Pydantic, about 2 MB.)

**New here:** `BaseModel`, `Field(...)` constraints, `@field_validator`, type coercion, `ValidationError`, `model_dump()` and `model_validate_json()`.

```python starter
from pydantic import BaseModel, Field, ValidationError, field_validator
```

```python tests
u = User(name="Asha", email="Asha@Example.com", age="31")
assert u.age == 31, "the string '31' is converted to an int"
assert u.email == "asha@example.com", "the validator lowercased it"
assert u.tags == []
assert u.model_dump() == {"name": "Asha", "email": "asha@example.com", "age": 31, "tags": []}
assert raises(ValidationError, User, name="", email="a@b.c", age=1), "empty name rejected"
assert raises(ValidationError, User, name="X", email="no-at-sign", age=1), "email needs an @"
assert raises(ValidationError, User, name="X", email="a@b.c", age=200), "age capped at 150"
assert raises(ValidationError, User, name="X", email="a@b.c", age="old"), "age must be a number"
data = '{"name": "Ravi", "email": "R@X.IO", "age": 40, "tags": ["admin"]}'
assert User.model_validate_json(data).tags == ["admin"], "straight from JSON"
```

#### Hint

```python
class User(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    age: int = Field(ge=0, le=150)
    ...
    @field_validator("email")
    @classmethod
    def check_email(cls, v): ...   # raise ValueError, or return the cleaned value
```

```python solution
from pydantic import BaseModel, Field, ValidationError, field_validator


class User(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    email: str
    age: int = Field(ge=0, le=150)
    tags: list[str] = []

    @field_validator("email")
    @classmethod
    def check_email(cls, v: str) -> str:
        if "@" not in v:
            raise ValueError("email must contain @")
        return v.lower()
```

#### Why

Pydantic is a dataclass that **validates**: it converts what it safely can (`"31"` → 31), and otherwise raises one `ValidationError` listing every problem. A validator either returns the cleaned value or raises `ValueError`. FastAPI request bodies are Pydantic models, and so are LLM structured outputs (`User.model_json_schema()` is the JSON schema you hand the model). Unlike a plain class, a `[]` default is safe here because Pydantic copies it for each instance.


## Testing

### py56 | How do you test Python code with pytest (fixtures, parametrize)? | asked=1

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

### pe58 | Write tests that catch bugs | write

`is_leap` is correct. Write `test_is_leap()` with plain `assert`s, pytest style, strong enough to **fail** on each of four buggy versions the checker swaps in.

**New here:** pytest-style `test_` functions, picking edge cases, and checking that your tests can actually fail.

```python starter
def is_leap(year):
    return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)


def test_is_leap():
    assert is_leap(2024)
```

```python tests
def _passes():
    test_is_leap()
    return True

assert _passes(), "your test passes on the correct is_leap"

def _caught(bug):
    global is_leap
    real = is_leap
    is_leap = bug
    try:
        test_is_leap()
        return False
    except AssertionError:
        return True
    finally:
        is_leap = real

assert _caught(lambda y: y % 4 == 0), "catches: forgot the 100-year rule"
assert _caught(lambda y: y % 4 == 0 and y % 100 != 0), "catches: forgot the 400-year rule"
assert _caught(lambda y: y % 400 == 0), "catches: only every 400 years"
assert _caught(lambda y: True), "catches: always True"
```

#### Hint

Hit every branch: a normal leap year, a normal non-leap year, a century that isn't a leap year, and a century that is.

```python solution
def is_leap(year):
    return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)


def test_is_leap():
    assert is_leap(2024)          # divisible by 4
    assert not is_leap(2023)      # not divisible by 4
    assert not is_leap(1900)      # divisible by 100 but not by 400
    assert is_leap(2000)          # divisible by 400
```

#### Why

pytest finds `test_*` functions and plain `assert`s, and shows both sides of a failing comparison. The same cases as one parametrized test:

```python
@pytest.mark.parametrize("year, expected", [(2024, True), (2023, False), (1900, False), (2000, True)])
def test_is_leap(year, expected):
    assert is_leap(year) == expected
```

"How would you test this?" means: one case per branch, plus the boundaries. The checker is doing *mutation testing*: a test that can't fail on a broken version isn't testing anything.


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

### pe59 | Test with mocks | write

`send_alert_if_hot` talks to a weather API and a message sender. Write the two tests using `Mock()` objects, so nothing real is called. They must fail on three broken versions the checker swaps in.

**New here:** `unittest.mock.Mock`, `.return_value`, `assert_called_once_with`, `assert_not_called`, and why passing dependencies in makes code testable.

```python starter
from unittest.mock import Mock


def send_alert_if_hot(weather_api, sender, city):
    temp = weather_api.get_temperature(city)
    if temp > 40:
        sender.send(f"Heat alert for {city}: {temp}°C")
        return True
    return False


def test_sends_alert_when_hot():
    # Mock() the api and the sender, make get_temperature return 45,
    # call the function, then check what was sent
    pass


def test_no_alert_when_mild():
    # same with 25°C: nothing should be sent
    pass
```

```python tests
def _passes():
    test_sends_alert_when_hot()
    test_no_alert_when_mild()
    return True

assert _passes(), "both tests pass on the real function"

def _caught(bug):
    global send_alert_if_hot
    real = send_alert_if_hot
    send_alert_if_hot = bug
    try:
        test_sends_alert_when_hot()
        test_no_alert_when_mild()
        return False
    except AssertionError:
        return True
    finally:
        send_alert_if_hot = real

def _never_sends(api, sender, city):
    api.get_temperature(city)
    return False

def _always_sends(api, sender, city):
    t = api.get_temperature(city)
    sender.send(f"Heat alert for {city}: {t}°C")
    return True

def _wrong_text(api, sender, city):
    t = api.get_temperature(city)
    if t > 40:
        sender.send("Heat alert")
        return True
    return False

assert _caught(_never_sends), "catches: never sends"
assert _caught(_always_sends), "catches: sends even when it's mild"
assert _caught(_wrong_text), "catches: the wrong message text"
```

```python solution
from unittest.mock import Mock


def send_alert_if_hot(weather_api, sender, city):
    temp = weather_api.get_temperature(city)
    if temp > 40:
        sender.send(f"Heat alert for {city}: {temp}°C")
        return True
    return False


def test_sends_alert_when_hot():
    api, sender = Mock(), Mock()
    api.get_temperature.return_value = 45
    assert send_alert_if_hot(api, sender, "Delhi") is True
    api.get_temperature.assert_called_once_with("Delhi")
    sender.send.assert_called_once_with("Heat alert for Delhi: 45°C")


def test_no_alert_when_mild():
    api, sender = Mock(), Mock()
    api.get_temperature.return_value = 25
    assert send_alert_if_hot(api, sender, "Pune") is False
    sender.send.assert_not_called()
```

#### Why

A `Mock` accepts any call and records it. `return_value` sets what a call gives back, and `side_effect` makes it raise or return a sequence. When code imports its dependency directly, use `patch("myapp.services.requests.get")`, patching where the name is **looked up**. Passing dependencies in, as here, needs no patching, and it's the same idea as FastAPI's `Depends` and `dependency_overrides`.


## Classic Python coding questions

### py62 | Predict the output: the Python gotchas interviewers like

```python
# 1. Mutable default argument
def f(x, acc=[]):
    acc.append(x); return acc
f(1); print(f(2))                 # [1, 2]      (the default list is shared across calls)

# 2. Late-binding closures
fs = [lambda: i for i in range(3)]
print([g() for g in fs])          # [2, 2, 2]   (i is looked up when called)

# 3. List multiplication shares the inner list
grid = [[0] * 3] * 3
grid[0][0] = 1
print(grid)                       # [[1,0,0],[1,0,0],[1,0,0]]  use [[0]*3 for _ in range(3)]

# 4. Tuples are immutable, but their contents may not be
t = ([1], 2)
t[0].append(3); print(t)          # ([1, 3], 2)
t[0] += [4]                       # TypeError... AND t[0] is still extended to [1, 3, 4]!

# 5. Integer caching and `is`
a = 256; b = 256; print(a is b)   # True  (small ints are cached)
a = 1000; b = 1000; print(a is b) # implementation detail: don't use `is` for values

# 6. Chained comparisons
print(1 < 2 < 3, 3 > 2 > 1 > 0, (1 < 3) < 2)   # True True True

# 7. Modifying a list while iterating
nums = [1, 2, 3, 4]
for n in nums:
    if n % 2 == 0: nums.remove(n)
print(nums)                       # [1, 3]  works here by luck; with [2, 4] you'd get [4]

# 8. Truthiness
print(bool([]), bool([0]), bool(""), bool(" "), bool(0.0))   # False True False True False

# 9. Variables in a loop survive it
for i in range(3): pass
print(i)                          # 2  (no block scope)

# 10. Default dict iteration order and dict views
d = {"b": 1, "a": 2}
print(list(d), sorted(d))         # ['b', 'a'] ['a', 'b']
```

How to answer output questions: say what each line does **out loud**, call out which objects are **shared** (references and mutability) and **when** names are looked up (closures, defaults evaluated at definition time). Most Python gotchas come down to those two ideas.

### pe27 | Fix: removing while looping | fix

`remove_evens(nums)` should return the odd numbers and **leave the caller's list alone**. It modifies the list while looping over it, which skips elements. Fix it.

**New here:** never mutate a list you're iterating, and build a new list with a comprehension instead.

```python starter
def remove_evens(nums):
    for n in nums:
        if n % 2 == 0:
            nums.remove(n)
    return nums
```

```python tests
assert remove_evens([1, 2, 3, 4]) == [1, 3]
assert remove_evens([2, 4, 6, 1]) == [1], "evens next to each other"
assert remove_evens([]) == []
orig = [2, 3]
remove_evens(orig)
assert orig == [2, 3], "the list you passed in is left alone"
```

```python solution
def remove_evens(nums):
    return [n for n in nums if n % 2 != 0]
```

#### Why

The loop walks by index. Removing an item shifts everything left, so the next item slides into the slot just visited and gets skipped. `[2, 4, 6, 1]` comes back as `[4, 1]`. Java throws `ConcurrentModificationException` here, but Python silently gives the wrong answer. A comprehension makes a new list and also stops you surprising the caller.

### pe28 | Valid brackets | write

**Interview mode from here on.** For each problem: say your approach first, write it without the hint, run it, then say the time and space complexity.

Write `is_valid(s)`: `True` if every bracket in `s` (only `()[]{}`) is closed by the right kind, in the right order.

**New here:** a list as a stack (`append` / `pop`), a dict mapping closers to openers, and `return not stack`.

```python starter
def is_valid(s):
    pass
```

```python tests
assert is_valid("()")
assert is_valid("()[]{}")
assert is_valid("{[]}")
assert not is_valid("(]")
assert not is_valid("([)]"), "closed in the wrong order"
assert not is_valid("(("), "never closed"
assert not is_valid(")("), "closed before opened"
assert is_valid("")
```

#### Hint

Push openers. On a closer, the stack must be non-empty **and** its top must be the matching opener.

```python solution
def is_valid(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
        else:
            stack.append(ch)
    return not stack
```

#### Why

The most recent unclosed opener must be closed first: last in, first out, so a stack. A Python list's `append` / `pop` at the end are O(1), so there's no need for Java's `Deque<Character>`. O(n) time, O(n) space.

### pe29 | Binary search | write

Write `search(nums, target)` for a **sorted** list: return the index of `target`, or `-1`. O(log n), so no `.index()` and no `in`.

**New here:** a `while` loop with two pointers, `//` integer division, and multiple assignment `lo, hi = 0, len(nums) - 1`.

```python starter
def search(nums, target):
    pass
```

```python tests
assert search([1, 3, 5, 7, 9], 7) == 3
assert search([1, 3, 5, 7, 9], 1) == 0, "first item"
assert search([1, 3, 5, 7, 9], 9) == 4, "last item"
assert search([1, 3, 5, 7, 9], 4) == -1, "missing"
assert search([], 1) == -1, "empty list"
big = list(range(0, 2_000_000, 2))
assert search(big, 1_999_998) == 999_999
```

```python solution
def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
```

#### Why

The same algorithm as in Java, but Python ints never overflow, so `(lo + hi) // 2` is safe. Use `//`, because `/` would give a float index. `2_000_000` shows that underscores are allowed in numbers. The standard library has this too: `bisect.bisect_left(nums, target)` gives the insertion point.

### pe30 | Merge overlapping intervals | write

Write `merge(intervals)`: merge every overlapping or touching pair of `[start, end]` intervals and return them sorted by start. The input may be unsorted.

**New here:** sorting with `key=lambda`, `result[-1]` for "the last one so far", and unpacking `for start, end in …`.

```python starter
def merge(intervals):
    pass
```

```python tests
assert merge([[1, 3], [2, 6], [8, 10], [15, 18]]) == [[1, 6], [8, 10], [15, 18]]
assert merge([[1, 4], [4, 5]]) == [[1, 5]], "touching intervals merge"
assert merge([[5, 6], [1, 2]]) == [[1, 2], [5, 6]], "the input can be unsorted"
assert merge([[1, 10], [2, 3]]) == [[1, 10]], "one inside another"
assert merge([]) == []
```

#### Hint

Sort by start. Then each interval either overlaps the last merged one (`start <= merged[-1][1]`) and stretches it, or starts a new one.

```python solution
def merge(intervals):
    merged = []
    for start, end in sorted(intervals, key=lambda iv: iv[0]):
        if merged and start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged
```

#### Why

After sorting, an interval can only overlap the **last** merged one, so one pass is enough. `max` handles one interval sitting inside another. O(n log n) for the sort, O(n) for the output. `sorted()` returns a new list, while `list.sort()` sorts in place and returns `None` (a classic slip).

### pe31 | Rotate a matrix with zip | write

Write `rotate(matrix)`: return the matrix turned **90° clockwise** as a list of lists. It doesn't have to be square.

**New here:** `zip(*rows)` turns rows into columns (a transpose), `*` unpacks a list into arguments, and `[::-1]` reverses the row order.

```python starter
def rotate(matrix):
    pass
```

```python tests
assert rotate([[1, 2], [3, 4]]) == [[3, 1], [4, 2]]
assert rotate([[1, 2, 3], [4, 5, 6], [7, 8, 9]]) == [[7, 4, 1], [8, 5, 2], [9, 6, 3]]
assert rotate([[1, 2, 3], [4, 5, 6]]) == [[4, 1], [5, 2], [6, 3]], "2 × 3 becomes 3 × 2"
assert rotate([[1]]) == [[1]]
assert rotate([]) == []
```

#### Hint

Clockwise = reverse the rows, then transpose. `zip(*[[3, 4], [1, 2]])` gives `(3, 1), (4, 2)`.

```python solution
def rotate(matrix):
    return [list(row) for row in zip(*matrix[::-1])]
```

#### Why

`zip(*m)` calls `zip(row0, row1, …)`, which pairs up the first items, then the second items, and so on: that's columns. `zip` returns tuples, hence `list(row)`. If asked for the explicit version: `[[matrix[r][c] for r in range(len(matrix) - 1, -1, -1)] for c in range(len(matrix[0]))]`. Counter-clockwise is `[list(r) for r in zip(*matrix)][::-1]`.

### pe32 | Kth largest with a heap | write

Write `kth_largest(nums, k)` in O(n log k) using a **min-heap of size k**, not a full sort.

**New here:** `heapq` (Python's PriorityQueue, a min-heap over a plain list), `heappush`, `heappop`, and `heap[0]` to peek at the smallest.

```python starter
import heapq


def kth_largest(nums, k):
    pass
```

```python tests
assert kth_largest([3, 2, 1, 5, 6, 4], 2) == 5
assert kth_largest([3, 2, 3, 1, 2, 4, 5, 5, 6], 4) == 4, "duplicates count"
assert kth_largest([7], 1) == 7
assert kth_largest([1, 2, 3], 3) == 1
assert kth_largest([-1, -5, -3], 1) == -1
```

#### Hint

Push every number, and whenever the heap holds more than k, pop the smallest. What's left are the k largest, with the kth largest on top (`heap[0]`).

```python solution
import heapq


def kth_largest(nums, k):
    heap = []
    for n in nums:
        heapq.heappush(heap, n)
        if len(heap) > k:
            heapq.heappop(heap)
    return heap[0]
```

#### Why

`heapq` only does **min**-heaps. For a max-heap, push `-n` and negate again when you pop. To heap-order a list in place in O(n), use `heapq.heapify(lst)`. The one-liner is `heapq.nlargest(k, nums)[-1]`. Know it, but write the loop when they ask for the heap.

### pe33 | Longest substring without repeats | write

Write `longest_unique(s)`: the length of the longest substring with no repeated character.

**New here:** a sliding window with a `start` index, a dict of each character's last index, `dict.get(key, default)`, and `max`.

```python starter
def longest_unique(s):
    pass
```

```python tests
assert longest_unique("abcabcbb") == 3
assert longest_unique("bbbbb") == 1
assert longest_unique("pwwkew") == 3, "a substring, so 'pwke' doesn't count"
assert longest_unique("abba") == 2, "an old repeat before the window doesn't move start back"
assert longest_unique("dvdf") == 3
assert longest_unique("") == 0
```

#### Hint

Walk `i` over the string. If the character was last seen **inside** the current window (`last.get(ch, -1) >= start`), move `start` just past that spot. The window is `i - start + 1` long.

```python solution
def longest_unique(s):
    last = {}            # char -> index it was last seen at
    start = best = 0
    for i, ch in enumerate(s):
        if last.get(ch, -1) >= start:
            start = last[ch] + 1
        last[ch] = i
        best = max(best, i - start + 1)
    return best
```

#### Why

Each character enters the window once and `start` only moves forward, so it's O(n) time and O(alphabet) space. `d.get(k, -1)` is Java's `getOrDefault`. The `>= start` check is what the `"abba"` case tests, and most bugs in this problem come from leaving it out.

### pe63 | Subarrays that sum to k | write

Write `count_subarrays(nums, k)`: how many contiguous subarrays add up to `k`. The numbers can be negative. O(n).

**New here:** prefix sums, `defaultdict(int)` as a counter, and the `seen[0] = 1` start.

```python starter
from collections import defaultdict


def count_subarrays(nums, k):
    pass
```

```python tests
assert count_subarrays([1, 1, 1], 2) == 2
assert count_subarrays([1, 2, 3], 3) == 2, "[1, 2] and [3]"
assert count_subarrays([1, -1, 0], 0) == 3, "negatives: a sliding window can't do this one"
assert count_subarrays([3], 3) == 1
assert count_subarrays([], 0) == 0
```

#### Hint

Keep a running `total`. A subarray ending here sums to `k` when some earlier running total equals `total - k`, so count how often each total has appeared.

```python solution
from collections import defaultdict


def count_subarrays(nums, k):
    seen = defaultdict(int)
    seen[0] = 1                 # the empty prefix
    total = count = 0
    for n in nums:
        total += n
        count += seen[total - k]
        seen[total] += 1
    return count
```

#### Why

`sum(nums[i:j + 1]) == prefix[j] - prefix[i - 1]`, so this is Two Sum on prefix sums. `seen[0] = 1` counts subarrays that start at index 0. A sliding window needs every number to be non-negative (so growing the window only ever increases the sum). Prefix sums don't. O(n) time and space.


### pe34 | Flatten a nested list | write

Write `flatten(nested)`: a flat list of every non-list item, at any depth, in order. Strings stay whole.

**New here:** recursion, `isinstance(x, list)`, and `extend` versus `append`.

```python starter
def flatten(nested):
    pass
```

```python tests
assert flatten([1, [2, [3, [4]], 5]]) == [1, 2, 3, 4, 5]
assert flatten([1, 2]) == [1, 2]
assert flatten([[[]]]) == [], "only empty lists inside"
assert flatten(["ab", ["c"]]) == ["ab", "c"], "strings stay whole"
assert flatten([]) == []
deep = [7]
for _ in range(50):
    deep = [deep]
assert flatten(deep) == [7], "50 levels deep"
```

#### Hint

For each item: if it's a list, `extend` with `flatten(item)`, otherwise `append` it.

```python solution
def flatten(nested):
    flat = []
    for item in nested:
        if isinstance(item, list):
            flat.extend(flatten(item))
        else:
            flat.append(item)
    return flat
```

#### Why

`append(x)` adds `x` as one element, while `extend(xs)` adds each element of `xs`. The generator version is neat to mention: `yield from flatten(item)`. Python's default recursion limit is about 1000 frames, so for very deep data use an explicit stack (`stack = [iter(nested)]`) instead. `_` is the name for a loop variable you don't use.

### pe60 | Subsets and permutations (backtracking) | write

Write `subsets(nums)` (every subset) and `permutations(nums)` (every ordering) by **backtracking**, without itertools. Any order is fine.

**New here:** the choose → explore → un-choose template, a nested function closing over `result` and `path`, and `path[:]` to save a snapshot.

```python starter
def subsets(nums):
    pass


def permutations(nums):
    pass
```

```python tests
assert sorted(subsets([1, 2, 3])) == [[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]]
assert subsets([]) == [[]]
assert len(subsets(list(range(10)))) == 1024
assert sorted(permutations([1, 2, 3])) == [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]
assert len(permutations([1, 2, 3, 4])) == 24
assert permutations([]) == [[]]
```

#### Hint

```python
result, path = [], []
def backtrack(start):
    result.append(path[:])          # record a COPY
    for i in range(start, len(nums)):
        path.append(nums[i])        # choose
        backtrack(i + 1)            # explore
        path.pop()                  # un-choose
```

```python solution
def subsets(nums):
    result, path = [], []

    def backtrack(start):
        result.append(path[:])
        for i in range(start, len(nums)):
            path.append(nums[i])
            backtrack(i + 1)
            path.pop()

    backtrack(0)
    return result


def permutations(nums):
    result, path, used = [], [], [False] * len(nums)

    def backtrack():
        if len(path) == len(nums):
            result.append(path[:])
            return
        for i, n in enumerate(nums):
            if not used[i]:
                used[i] = True
                path.append(n)
                backtrack()
                path.pop()
                used[i] = False

    backtrack()
    return result
```

#### Why

The same template solves combinations, combination sum, N-Queens and word search. Only the loop and the stopping condition change. `result.append(path)` without `[:]` would store the **same** list many times, and it's empty by the end. The inner function can append to `result` without `nonlocal` because it mutates the list rather than rebinding it. In library code you'd use `itertools.combinations` / `permutations`, but interviews want the template.


### pe35 | Shortest path in a grid (BFS) | write

`grid` is a list of strings: `"."` is open and `"#"` is a wall. Write `shortest_path(grid)`: the fewest steps (up, down, left or right) from the top-left corner to the bottom-right corner, or `-1` if there's no way through.

**New here:** `collections.deque` as a queue (`append` / `popleft`), a `set` of `(row, col)` tuples for visited cells, and looping over direction pairs.

```python starter
from collections import deque


def shortest_path(grid):
    pass
```

```python tests
assert shortest_path(["..", ".."]) == 2
assert shortest_path(["..#", ".##", "..."]) == 4
assert shortest_path([".#", "#."]) == -1, "walled off"
assert shortest_path(["."]) == 0, "already there"
assert shortest_path(["#", "."]) == -1, "the start is a wall"
maze = [
    "....#",
    ".##.#",
    ".#...",
    "...#.",
]
assert shortest_path(maze) == 7
```

#### Hint

Queue items are `(row, col, steps)`. Mark a cell visited **when you add it** to the queue, not when you pop it, or cells get queued many times.

```python solution
from collections import deque


def shortest_path(grid):
    rows, cols = len(grid), len(grid[0])
    if grid[0][0] == "#" or grid[rows - 1][cols - 1] == "#":
        return -1
    queue = deque([(0, 0, 0)])
    seen = {(0, 0)}
    while queue:
        r, c, steps = queue.popleft()
        if (r, c) == (rows - 1, cols - 1):
            return steps
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "." and (nr, nc) not in seen:
                seen.add((nr, nc))
                queue.append((nr, nc, steps + 1))
    return -1
```

#### Why

BFS explores in rings of equal distance, so the first time it reaches the target is the shortest path (when every step costs 1). Use `deque`: `list.pop(0)` is O(n). `0 <= nr < rows` is a chained comparison, a Python nicety. O(rows × cols) time and space.

### pe61 | A Trie with nested dicts | write

Write `Trie` with `insert(word)`, `search(word)` (was this exact word inserted?) and `starts_with(prefix)`.

**New here:** dicts of dicts as tree nodes, `setdefault` to walk-or-create, an end-of-word marker, and a private helper method.

```python starter
class Trie:
    def __init__(self):
        pass

    def insert(self, word):
        pass

    def search(self, word):
        pass

    def starts_with(self, prefix):
        pass
```

```python tests
t = Trie()
t.insert("apple")
assert t.search("apple")
assert not t.search("app"), "app was only passed through, never inserted"
assert t.starts_with("app")
t.insert("app")
assert t.search("app")
assert not t.starts_with("b")
assert not t.search("apples")
```

#### Hint

`node = node.setdefault(ch, {})` walks down one letter, creating the node if needed. Mark the end of a word with a key like `"$"`.

```python solution
class Trie:
    def __init__(self):
        self.root = {}

    def insert(self, word):
        node = self.root
        for ch in word:
            node = node.setdefault(ch, {})
        node["$"] = True

    def _find(self, prefix):
        node = self.root
        for ch in prefix:
            if ch not in node:
                return None
            node = node[ch]
        return node

    def search(self, word):
        node = self._find(word)
        return node is not None and "$" in node

    def starts_with(self, prefix):
        return self._find(prefix) is not None
```

#### Why

In Java you'd write a `TrieNode` class with `children[26]` and an `isEnd` flag. In Python a dict per node does both jobs. Every operation is O(length of the word). Tries power autocomplete, prefix search and "word search II". The leading `_` in `_find` means "internal", by convention only.

### pe62 | Course order (topological sort) | write

`prereqs` is a list of `[course, needs]` pairs for courses `0 … n-1`. Write `course_order(n, prereqs)`: an order to take every course in, or `[]` if there's a cycle.

**New here:** an adjacency list with `defaultdict(list)`, in-degree counts, Kahn's algorithm with a `deque`, and detecting a cycle.

```python starter
from collections import defaultdict, deque


def course_order(n, prereqs):
    pass
```

```python tests
def _valid(order, n, prereqs):
    pos = {c: i for i, c in enumerate(order)}
    return sorted(order) == list(range(n)) and all(pos[needs] < pos[c] for c, needs in prereqs)

assert _valid(course_order(2, [[1, 0]]), 2, [[1, 0]]), "a simple chain"
assert _valid(course_order(4, [[1, 0], [2, 0], [3, 1], [3, 2]]), 4, [[1, 0], [2, 0], [3, 1], [3, 2]]), "a diamond"
assert _valid(course_order(3, []), 3, []), "no prerequisites at all"
assert course_order(2, [[1, 0], [0, 1]]) == [], "a cycle means there's no order"
```

#### Hint

Count how many prerequisites each course still has. Start a queue with the courses that have none, and as you take each course, lower the count of the courses that need it. If you finish with fewer than `n` courses, there was a cycle.

```python solution
from collections import defaultdict, deque


def course_order(n, prereqs):
    graph = defaultdict(list)
    indegree = [0] * n
    for course, needs in prereqs:
        graph[needs].append(course)
        indegree[course] += 1
    queue = deque(c for c in range(n) if indegree[c] == 0)
    order = []
    while queue:
        c = queue.popleft()
        order.append(c)
        for nxt in graph[c]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)
    return order if len(order) == n else []
```

#### Why

O(V + E). The same algorithm orders build steps, migrations, task DAGs and agent workflows. Courses caught in a cycle never reach in-degree 0, so they never enter the queue. The standard library has `graphlib.TopologicalSorter`, but interviews want Kahn's algorithm (or DFS with three colours).



### py58 | Implement an LRU cache. | asked=6

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

### pe36 | LRU cache, your turn | write

Now write the LRU cache yourself, **without scrolling up**: `LRUCache(capacity)` with `get(key)` (return the value or `-1`) and `put(key, value)`. Both are O(1). Using a key counts as using it, and the least recently used key is evicted once the cache is over capacity.

**New here:** `collections.OrderedDict`, `move_to_end`, and `popitem(last=False)`.

```python starter
from collections import OrderedDict


class LRUCache:
    def __init__(self, capacity):
        pass

    def get(self, key):
        pass

    def put(self, key, value):
        pass
```

```python tests
cache = LRUCache(2)
cache.put(1, 1)
cache.put(2, 2)
assert cache.get(1) == 1
cache.put(3, 3)
assert cache.get(2) == -1, "2 was least recently used, so it was evicted"
cache.put(4, 4)
assert cache.get(1) == -1, "then 1 was"
assert cache.get(3) == 3
assert cache.get(4) == 4
one = LRUCache(1)
one.put("a", 1)
one.put("a", 2)
assert one.get("a") == 2, "put on an existing key updates it"
```

```python solution
from collections import OrderedDict


class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.data = OrderedDict()

    def get(self, key):
        if key not in self.data:
            return -1
        self.data.move_to_end(key)
        return self.data[key]

    def put(self, key, value):
        if key in self.data:
            self.data.move_to_end(key)
        self.data[key] = value
        if len(self.data) > self.capacity:
            self.data.popitem(last=False)
```

#### Why

An `OrderedDict` is a hash map plus a doubly linked list, the same thing as Java's `LinkedHashMap` in access order. The "end" is the most recent and the front is the oldest. If they ban `OrderedDict`, build it from a dict of key → node plus your own doubly linked list with sentinel head and tail nodes.


### py59 | Write a word-frequency counter for a large file. | asked=1

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

### pe37 | Top k words | write

Write `top_words(text, k)`: the `k` most common words as `(word, count)` pairs, most common first. Ignore case and punctuation, but keep apostrophes (`"it's"` is one word). Ties keep the order the words first appeared.

**New here:** `re.findall`, `collections.Counter`, and `most_common(k)`.

```python starter
import re
from collections import Counter


def top_words(text, k):
    pass
```

```python tests
assert top_words("the cat and the hat and the bat", 2) == [("the", 3), ("and", 2)]
assert top_words("Hi! hi, HI.", 1) == [("hi", 3)], "case and punctuation ignored"
assert top_words("It's it's fine", 1) == [("it's", 2)]
assert top_words("b a b a c", 2) == [("b", 2), ("a", 2)], "ties keep first-seen order"
assert top_words("", 3) == []
```

```python solution
import re
from collections import Counter


def top_words(text, k):
    words = re.findall(r"[a-z']+", text.lower())
    return Counter(words).most_common(k)
```

#### Why

`Counter` is a dict of item → count with extras: `most_common(k)`, `+` / `-` between counters, and `c[missing] == 0`. `re.findall` returns every match, and the `r"…"` raw string keeps backslashes literal. Without `Counter` you'd write `counts[w] = counts.get(w, 0) + 1` and then `sorted(counts.items(), key=lambda kv: -kv[1])[:k]`. Show that you know both.


### py60 | Write an async function that fetches many URLs with a concurrency limit, retries and timeouts. | asked=5

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

### pe55 | Async retry with a timeout | write

Write `with_retry(make_call, attempts, timeout)`. `make_call()` returns a **new** coroutine each time. Give each try at most `timeout` seconds. On a timeout or a `ConnectionError`, try again, up to `attempts` tries in total, then let the last error out.

**New here:** `asyncio.wait_for`, `TimeoutError`, passing a factory instead of a coroutine, and backoff between tries.

```python starter
import asyncio


async def with_retry(make_call, attempts, timeout):
    return await make_call()
```

```python tests
calls = []

async def slow_then_fast():
    calls.append(1)
    await asyncio.sleep(1 if len(calls) == 1 else 0)
    return "answer"

assert await with_retry(slow_then_fast, attempts=3, timeout=0.1) == "answer", "the slow first try is cut off and retried"
assert len(calls) == 2
errors = []

async def broken():
    errors.append(1)
    raise ConnectionError("reset")

try:
    await with_retry(broken, attempts=3, timeout=1)
    outcome = "no error"
except ConnectionError:
    outcome = "ConnectionError"
assert outcome == "ConnectionError", "after the last try, the error comes out"
assert len(errors) == 3, "tried exactly 3 times"
```

#### Hint

Loop over the attempts: `return await asyncio.wait_for(make_call(), timeout)` inside `try`, and catch `(TimeoutError, ConnectionError)`. Re-raise on the last attempt, otherwise `await asyncio.sleep(...)` a little and go round again.

```python solution
import asyncio


async def with_retry(make_call, attempts, timeout):
    for attempt in range(1, attempts + 1):
        try:
            return await asyncio.wait_for(make_call(), timeout)
        except (TimeoutError, ConnectionError):
            if attempt == attempts:
                raise
        await asyncio.sleep(0.01 * 2 ** attempt)   # exponential backoff
```

#### Why

`wait_for` **cancels** the slow call when time runs out. A coroutine object can be awaited only once, which is why you pass `make_call` and call it once per try. Since Python 3.11, `asyncio.TimeoutError` is the built-in `TimeoutError`. Put this together with the Semaphore from E54 and you have the full answer to "fetch many URLs with a limit, retries and timeouts".

