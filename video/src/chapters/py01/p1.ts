import type { Scene } from "../../lib/types.ts";
import { B, check, custom, q, sec } from "./h.ts";

// Part 1: how the lecture is organised, then module 1 (the data model) and
// module 2 (the built-in data structures), question by question in the
// page's order.
export const p1: Scene[] = [
  {
    kind: "title",
    eyebrow: "Python · interview lecture",
    title: "Python, topic by topic",
    subtitle: "Every module of the Python page, the idea behind it, and the questions interviews ask about it",
    beats: B(
      "Python, topic by topic. This lecture follows the Python page exactly: the same eleven modules, in the same order, and inside each module, the same questions in the same order. So whatever module you are reading on the page, this lecture has a part for it.",
    ),
  },
  {
    kind: "bullets",
    title: "How each module goes",
    firstItemStep: 1,
    items: [
      { icon: "🧠", text: "The idea first, as a picture", sub: "the one mental model the whole module hangs on" },
      { icon: "❓", text: "Then the questions, in the page's order", sub: "same numbers as on the page, with how often each was asked" },
      { icon: "🎤", text: "For the big ones, an answer to say out loud", sub: "short enough to say in an interview" },
      { icon: "✋", text: "Then a check: answer before I do", sub: "pausing to recall is what makes it stick" },
    ],
    beats: B(
      "Every module goes the same way, so you always know where you are.",
      "First the idea, as a picture. Each module has one mental model, and once you can see it, the questions mostly answer themselves.",
      "Then the questions, in the order the page has them, with the page's question numbers. When a question was asked often in real interviews, I'll tell you how often.",
      "For the questions that come up the most, you get a model answer, written so you can say it out loud in about thirty seconds.",
      { say: "And each module ends with a check. When the timer ring appears, pause if you need to, and answer out loud before I do. Recalling an answer yourself is what moves it from the screen into your memory.", tone: "key" },
    ),
  },
  {
    kind: "numbers",
    title: "What interviews ask about Python most",
    items: [
      { value: "17", label: "Decorators", sub: "module 3" },
      { value: "16", label: "Generators and yield", sub: "module 4" },
      { value: "13", label: "Threads vs processes vs asyncio", sub: "module 7" },
      { value: "11", label: "Comprehensions", sub: "module 2" },
      { value: "10", label: "Memory and garbage collection", sub: "module 8" },
    ],
    footer: "Interview write-ups that asked it, out of 456 that mention Python (2024–2026)",
    beats: B(
      "One thing before we start: where the counts come from. They come from four hundred and fifty six real interview write-ups that mention Python.",
      "Decorators lead, with seventeen. That's module three.",
      "Generators and yield, sixteen. Module four.",
      "Threads versus processes versus asyncio, thirteen. Module seven.",
      "Comprehensions, eleven. Module two.",
      "Memory and garbage collection, ten. Module eight.",
      { say: "So those five get the most time. Everything else still gets explained properly, because a follow-up question can land anywhere.", tone: "key" },
    ),
  },

  // ================================================================ module 1
  sec("1", "Python basics and the data model", "Module one. Python basics and the data model. This is the module that explains most Python surprises, and it rests on a single idea: names point to objects."),
  custom(
    "pynames",
    {
      title: "The idea: a name is a label tied to an object",
      sub: "a variable is not a box that holds a value",
      steps: [
        { tags: [{ name: "a", to: "L" }], objs: [{ id: "L", text: "[1, 2]", sub: "a list object, somewhere in memory" }], note: "a = [1, 2] makes a list object, then ties the name a to it" },
        { tags: [{ name: "a", to: "L" }, { name: "b", to: "L", tone: "amber" }], objs: [{ id: "L", text: "[1, 2]", sub: "still one object" }], note: "b = a copies nothing: it ties a second label to the same object" },
        { tags: [{ name: "a", to: "L" }, { name: "b", to: "L", tone: "amber" }], objs: [{ id: "L", text: "[1, 2, 3]", sub: "changed through b, seen through a" }], note: "b.append(3) changes the one object, so a sees it too" },
        { tags: [{ name: "a", to: "L" }, { name: "b", to: "N", tone: "amber" }], objs: [{ id: "L", text: "[1, 2, 3]" }, { id: "N", text: "[9]", sub: "a new object" }], note: "b = [9] moves the label b; the object a points at is untouched" },
      ],
    },
    B(
      "Here is the idea the whole module hangs on. In Python, a variable is not a box that holds a value. It's a name, a label, tied to an object that lives somewhere in memory. A equals the list one, two makes a list object, and then ties the name a to it.",
      "Now b equals a. Nothing is copied. Python just ties a second label, b, to the very same object. There is still one list.",
      "So when you call b dot append three, you change that one object, and a sees the change, because a points at the same thing.",
      { say: "But b equals a new list, nine, is different. That doesn't change any object. It moves the label b to a new object. Changing an object, and moving a name, are the two things to keep apart for this whole module.", tone: "key" },
    ),
  ),

  // ---- Q1
  q(1, 2, "How is Python different from Java?", "typing, how it runs, memory, concurrency, and style", "Question one, asked in two write-ups. How is Python different from Java?", "A good answer compares a few dimensions, not a list of syntax: typing, how the code runs, memory, concurrency, and the style of the language."),
  {
    kind: "compare",
    title: "Python and Java, side by side",
    cols: [
      { title: "Python", icon: "🐍", tone: "blue", items: ["Dynamic typing: types belong to values, checked at runtime", "Bytecode run by an interpreter (CPython); no JIT by default", "Reference counting plus a cycle collector", "The GIL: one thread runs Python bytecode at a time", "Everything is an object; indentation is syntax"] },
      { title: "Java", icon: "☕", tone: "cyan", items: ["Static typing: checked at compile time", "Bytecode on the JVM, compiled to machine code by a JIT", "A tracing garbage collector", "Real parallel threads", "Primitives and objects; braces and classes everywhere"] },
    ],
    footer: "Python trades raw speed for speed of writing; C extensions (NumPy) do the heavy lifting",
    beats: B(
      "On the Python side. Typing is dynamic: a type belongs to the value, not to the variable, and it's checked when the code runs. Type hints exist, but Python itself doesn't enforce them. CPython compiles your code to bytecode and interprets it, with no just-in-time compiler by default. Memory is freed by reference counting, plus a collector for cycles. The GIL lets only one thread run Python bytecode at a time. And everything, even an int or a function, is an object.",
      "On the Java side. Static typing, checked at compile time. Bytecode on the JVM, where a JIT compiles hot code to machine code, which is a big reason Java is faster for CPU-heavy loops. A tracing garbage collector. Real parallel threads. And a split between primitives and objects.",
      { say: "The one-line summary: Python trades raw speed for speed of writing. And when speed matters, the heavy lifting happens in C extensions like NumPy, or in other processes, which is exactly how AI code in Python stays fast.", tone: "key" },
    ),
  },

  // ---- Q2
  q(2, 1, "What does “everything is an object” mean, and how do names and references work?", "identity, type, value; names are references; pass by object reference", "Question two. What does everything is an object mean, and how do names and references work?", "Cover three things. Every object has an identity, a type and a value. Names are references to objects. And arguments are passed by object reference."),
  {
    kind: "code",
    title: "Every object: an identity, a type, a value",
    lang: "python",
    code: `x = 42
id(x)        # identity: which object (its address in CPython)
type(x)      # <class 'int'>: what it is
x            # 42: its value

def greet(): ...
type(greet)  # <class 'function'>: functions are objects too
f = greet    # so they can be named, passed, stored in a dict
handlers = {"hi": greet}`,
    highlight: [[1, 4], [6, 9]],
    beats: B(
      "Everything is an object means every value carries three things. An identity, which the id function shows: in CPython, it's the object's address in memory. A type, which says what it is. And a value.",
      { say: "And everything really means everything. A function is an object of type function. So you can give it another name, pass it to another function, or store it in a dictionary. That one fact is what makes decorators possible in module three.", tone: "key" },
    ),
  },
  custom(
    "pynames",
    {
      title: "Passing an argument: the function gets the same object",
      sub: "def add(items): items.append(4); items = [0]",
      steps: [
        { tags: [{ name: "nums (caller)", to: "L" }], objs: [{ id: "L", text: "[1, 2, 3]" }] },
        { tags: [{ name: "nums (caller)", to: "L" }, { name: "items (inside add)", to: "L", tone: "amber" }], objs: [{ id: "L", text: "[1, 2, 3]" }], note: "the parameter is a new name for the same object: nothing is copied" },
        { tags: [{ name: "nums (caller)", to: "L" }, { name: "items (inside add)", to: "L", tone: "amber" }], objs: [{ id: "L", text: "[1, 2, 3, 4]", sub: "the caller sees this" }], note: "items.append(4) mutates the shared object" },
        { tags: [{ name: "nums (caller)", to: "L" }, { name: "items (inside add)", to: "N", tone: "amber" }], objs: [{ id: "L", text: "[1, 2, 3, 4]", sub: "the caller still has this" }, { id: "N", text: "[0]", sub: "only the function's name moved" }], note: "items = [0] rebinds the local name; the caller never sees it" },
      ],
    },
    B(
      "Now the part interviews really test: what happens when you pass an argument. The caller has a name, nums, pointing at a list.",
      "Calling add with nums makes the parameter, items, a new name for the same object. Nothing is copied. This is called pass by object reference, or call by sharing.",
      "So if the function mutates the object, with items dot append four, the caller sees it, because there is only one list.",
      { say: "But if the function assigns, items equals a new list, it only moves its own local label. The caller's list is untouched. Mutation is visible to the caller; rebinding is not. That sentence is the whole answer.", tone: "key" },
    ),
  ),

  // ---- Q3
  q(3, 5, "Which types are mutable and which are immutable, and why does it matter?", "the two lists, what a “change” does to each, and where it bites", "Question three, asked in five write-ups. Which types are mutable and which are immutable, and why does it matter?", "Name the types on each side, say what a change does to each, and then give the places where it matters, because that's what makes the answer sound experienced."),
  {
    kind: "compare",
    title: "Immutable and mutable",
    cols: [
      { title: "Immutable", icon: "🧊", tone: "cyan", items: ["int, float, bool, complex", "str, bytes", "tuple, frozenset", "None", "A “change” builds a new object"] },
      { title: "Mutable", icon: "🔧", tone: "blue", items: ["list", "dict", "set", "bytearray, most of your own classes", "A change happens in place, seen through every name"] },
    ],
    footer: "Only immutable (hashable) values can be dict keys or set members",
    beats: B(
      "Immutable types can never change after they're made: the numbers, strings and bytes, tuples and frozensets, and None. When you seem to change one, Python builds a new object and moves the name.",
      "Mutable types change in place: lists, dicts, sets, bytearrays, and most classes you write yourself. A change is visible through every name that points at the object.",
      { say: "And the reason it matters most: dict keys and set members must be hashable, which in practice means immutable. A tuple can be a key. A list can't.", tone: "key" },
    ),
  },
  custom(
    "pynames",
    {
      title: "The same += on a string and on a list",
      sub: "immutable: a new object  ·  mutable: the same object, changed",
      steps: [
        { tags: [{ name: "s", to: "S" }, { name: "t = s", to: "S", tone: "amber" }], objs: [{ id: "S", text: '"hi"', sub: "str: immutable" }] },
        { tags: [{ name: "s", to: "S2" }, { name: "t = s", to: "S", tone: "amber" }], objs: [{ id: "S", text: '"hi"', sub: "t still sees the old one" }, { id: "S2", text: '"hi!"', sub: "s += \"!\" built a new string" }], note: "for a str, += builds a new object and moves s" },
        { tags: [{ name: "a", to: "L" }, { name: "b = a", to: "L", tone: "amber" }], objs: [{ id: "L", text: "[1, 2]", sub: "list: mutable" }] },
        { tags: [{ name: "a", to: "L" }, { name: "b = a", to: "L", tone: "amber" }], objs: [{ id: "L", text: "[1, 2, 3]", sub: "a += [3] extended it in place" }], note: "for a list, += changes the object itself, so b sees it" },
      ],
    },
    B(
      "Here's the difference in one picture. S is the string hi, and t equals s, so two names, one string.",
      "Now s plus equals an exclamation mark. Strings can't change, so Python builds a new string, hi with the mark, and moves s to it. T still sees the old hi.",
      "Same operator on a list. A is one, two, and b equals a.",
      { say: "A plus equals a list with three. Lists are mutable, so plus equals extends the list in place, and b sees one, two, three. Same symbol, different behaviour, and the difference is mutability.", tone: "key" },
    ),
  ),
  {
    kind: "trap",
    myth: "A tuple is immutable, so nothing inside it can ever change.",
    truth: "The tuple can't change which objects it holds; a list inside it can still change.",
    why: "t = ([1], 2); t[0].append(9) works, and t becomes ([1, 9], 2). Such a tuple is also unhashable.",
    beats: B(
      "A favourite follow-up. True or false: a tuple is immutable, so nothing inside it can ever change.",
      "False. The tuple holds references, and those can't change. But if one of them points at a list, that list can still change.",
      "So a tuple holding a list, then appending to the list, works fine, and the tuple now shows the new item. And because its contents can change, that tuple can't be hashed, so it can't be a dict key.",
    ),
  },
  {
    kind: "sayit",
    q: "Mutable vs immutable: why does it matter?",
    lines: [
      "Names are references; assignment never copies.",
      "Immutable objects (int, str, tuple) can't change: a “change” builds a new object.",
      "Mutable objects (list, dict, set) change in place, visible through every name.",
      "It matters for function arguments, default arguments, and shared state.",
      "Only hashable, in practice immutable, values can be dict keys or set members.",
    ],
    beats: B(
      { say: "Here's how I'd say it in an interview.", tone: "ask" },
      "Names in Python are references to objects, and assignment never copies.",
      "Immutable objects, like ints, strings and tuples, can't change. Anything that looks like a change builds a new object.",
      "Mutable objects, like lists, dicts and sets, change in place, and every name pointing at them sees the change.",
      "It matters when you pass arguments, for default arguments, and for any state shared between parts of a program.",
      { say: "And only hashable values, which in practice means immutable ones, can be dictionary keys or set members.", tone: "key" },
    ),
  },

  // ---- Q4
  q(4, 2, "What is the difference between is and ==?", "value versus identity, and the one place to use is", "Question four. What is the difference between is, and double equals?", "Value versus identity, and the one rule for when to use is."),
  custom(
    "pynames",
    {
      title: "== asks “equal value?”  ·  is asks “same object?”",
      steps: [
        { tags: [{ name: "a", to: "A" }, { name: "b", to: "B2", tone: "amber" }], objs: [{ id: "A", text: "[1, 2]" }, { id: "B2", text: "[1, 2]", sub: "a different object with the same value" }], note: "a == b is True (same value)  ·  a is b is False (two objects)" },
        { tags: [{ name: "a", to: "A" }, { name: "b", to: "B2", tone: "amber" }, { name: "c = a", to: "A", tone: "green" }], objs: [{ id: "A", text: "[1, 2]" }, { id: "B2", text: "[1, 2]" }], note: "c is a is True: two names, one object" },
      ],
    },
    B(
      "Double equals compares values. It calls the dunder eq method. Is compares identity: are these two names pointing at the very same object? Here a and b are two separate lists that happen to hold the same values. So a double equals b is true, but a is b is false.",
      { say: "C equals a ties c to a's object, so c is a is true. Equal value is double equals. Same object is is.", tone: "key" },
    ),
  ),
  {
    kind: "trap",
    myth: "x = 256; y = 256; x is y is True, so `is` works for numbers.",
    truth: "That's an accident of caching: CPython keeps one copy of small ints (-5 to 256) and some strings.",
    why: "Use `is` only for singletons: None, True, False, and your own sentinel objects. Write `if x is None`.",
    beats: B(
      "The trap that comes with it. X equals two fifty six, y equals two fifty six, and x is y is true. So is works for numbers, right?",
      "No. That's an accident. CPython keeps a single cached copy of small integers, from minus five to two fifty six, and of some strings. With bigger numbers, the same test can be false.",
      { say: "So the rule: use is only for singletons. None, True, False, and sentinel objects you create yourself. If x is None, yes. If x is five, never.", tone: "key" },
    ),
  },

  // ---- Q5
  q(5, 3, "What is the difference between a shallow copy and a deep copy?", "assignment, shallow, deep: what each one shares", "Question five, asked in three write-ups. What's the difference between a shallow copy and a deep copy?", "Three things to separate: plain assignment, a shallow copy, and a deep copy, and what each one shares."),
  custom(
    "pynames",
    {
      title: "Copying a list of lists",
      sub: "grid = [[0, 0], [0, 0]]",
      steps: [
        {
          tags: [{ name: "grid", to: "G" }, { name: "same = grid", to: "G", tone: "red" }],
          objs: [{ id: "G", text: "outer list" }, { id: "R0", text: "[0, 0]", col: 1 }, { id: "R1", text: "[0, 0]", col: 1 }],
          links: [{ from: "G", to: "R0" }, { from: "G", to: "R1" }],
          note: "assignment: one outer list, two names",
        },
        {
          tags: [{ name: "grid", to: "G" }, { name: "shallow = grid.copy()", to: "S", tone: "amber" }],
          objs: [{ id: "G", text: "outer list" }, { id: "S", text: "new outer list", tone: "amber" }, { id: "R0", text: "[0, 0]", col: 1, sub: "shared" }, { id: "R1", text: "[0, 0]", col: 1, sub: "shared" }],
          links: [{ from: "G", to: "R0" }, { from: "G", to: "R1" }, { from: "S", to: "R0", tone: "amber" }, { from: "S", to: "R1", tone: "amber" }],
          note: "shallow: a new outer list, but the same inner rows",
        },
        {
          tags: [{ name: "grid", to: "G" }, { name: "deep = deepcopy(grid)", to: "D", tone: "green" }],
          objs: [{ id: "G", text: "outer list" }, { id: "D", text: "new outer list", tone: "green" }, { id: "R0", text: "[0, 0]", col: 1 }, { id: "R1", text: "[0, 0]", col: 1 }, { id: "D0", text: "[0, 0]  (new)", col: 1, tone: "green" }, { id: "D1", text: "[0, 0]  (new)", col: 1, tone: "green" }],
          links: [{ from: "G", to: "R0" }, { from: "G", to: "R1" }, { from: "D", to: "D0", tone: "green" }, { from: "D", to: "D1", tone: "green" }],
          note: "deep: copies recursively, so nothing is shared",
        },
      ],
    },
    B(
      "Take a grid, a list of two lists. Plain assignment, same equals grid, copies nothing at all. One outer list, two names.",
      "A shallow copy, with dot copy, or a slice, or list of grid, makes a new outer list. But its elements are the same row objects. So changing shallow's row zero, changes grid's row zero too.",
      { say: "A deep copy, with copy dot deepcopy, copies recursively, all the way down, so nothing is shared. Shallow copies the container. Deep copies everything inside it.", tone: "key" },
    ),
  ),
  {
    kind: "code",
    title: "The grid trap: [[0] * 3] * 3",
    lang: "python",
    code: `grid = [[0] * 3] * 3      # three names for ONE row
grid[0][0] = 1
print(grid)               # [[1, 0, 0], [1, 0, 0], [1, 0, 0]]

grid = [[0] * 3 for _ in range(3)]   # a new row each time
grid[0][0] = 1
print(grid)               # [[1, 0, 0], [0, 0, 0], [0, 0, 0]]`,
    highlight: [[1, 3], [5, 7]],
    beats: B(
      "The same idea hides in a classic trap. A list containing zero times three, then times three. The outer times three repeats the reference, not the row, so you get three references to one row. Set one cell, and it shows up in every row.",
      { say: "The fix is a comprehension, which runs the inner expression again for each row, so every row is its own list.", tone: "key" },
    ),
  },

  // ---- Q6
  q(6, null, "What is the mutable default argument problem?", "when defaults are made, and the None fix", "Question six. What is the mutable default argument problem?", "Say when default values are created, show what goes wrong, and give the standard fix."),
  {
    kind: "code",
    title: "A default value is made once, when def runs",
    lang: "python",
    code: `def add_item(item, items=[]):     # [] is made ONCE
    items.append(item)
    return items

add_item("a")    # ['a']
add_item("b")    # ['a', 'b']   ← the same list again

def add_item(item, items=None):   # the fix
    if items is None:
        items = []                # a new list per call
    items.append(item)
    return items`,
    highlight: [[1, 3], [5, 6], [8, 12]],
    beats: B(
      "Default values are evaluated once, when the def statement runs, and stored on the function object. Not on every call.",
      "So a mutable default, like an empty list, is shared by every call that doesn't pass its own. The second call sees the first call's item. You can even see the shared list, in add item dot dunder defaults.",
      { say: "The fix: default to None, and create the new list inside the body. The same once-only rule bites with things like a default of datetime dot now: the time is frozen at definition.", tone: "key" },
    ),
  },

  // ---- Q7
  q(7, null, "How does Python execute code (CPython, bytecode, the PVM)?", "source → bytecode → the evaluation loop", "Question seven. How does Python execute code? CPython, bytecode, and the Python virtual machine.", "Walk the pipeline from source code to running bytecode, and say where the speed goes."),
  custom(
    "pypipe",
    {
      title: "From a .py file to running code",
      stages: [
        { name: "Source", icon: "📄", sub: "your .py file" },
        { name: "Parse", icon: "🌳", sub: "tokens → syntax tree" },
        { name: "Compile", icon: "⚙️", sub: "→ bytecode (.pyc cache)" },
        { name: "PVM loop", icon: "🔁", sub: "runs one instruction at a time" },
      ],
      steps: [
        { at: 0, text: "CPython is the standard interpreter, written in C. It starts from your source file." },
        { at: 1, text: "It tokenises the text and parses it into an abstract syntax tree." },
        { at: 2, text: "The tree is compiled to bytecode: simple instructions for a stack machine. Imported modules cache it in __pycache__ as .pyc files." },
        { at: 3, text: "The virtual machine is a big loop in C that executes one bytecode instruction at a time, on objects. dis.dis(fn) shows the bytecode." },
        { at: [0, 1, 2, 3], text: "No JIT by default (3.13 has an experimental one), and every operation checks types at runtime: that's why pure-Python loops are slow, and why PyPy or C extensions are fast." },
      ],
    },
    B(
      "CPython is the standard interpreter, written in C. It starts from your source file.",
      "First it breaks the text into tokens and parses them into an abstract syntax tree.",
      "Then it compiles that tree to bytecode: simple instructions for a stack-based machine. For imported modules, the bytecode is cached in the pycache folder, as dot pyc files, so the next import skips this step.",
      "Then the Python virtual machine, which is really a big evaluation loop written in C, executes those instructions one at a time. You can see them yourself with the dis module.",
      { say: "And this is where the speed goes. There's no just-in-time compiler by default, and every single operation checks types while the program runs. That's why a pure Python loop is slow, and why PyPy, which has a JIT, or C extensions like NumPy, are much faster.", tone: "key" },
    ),
  ),
  check({
    topic: "copies",
    q: "a = [[1], [2]]; b = a.copy(); b[0].append(9). What is a now?",
    say: "A is a list holding the list one and the list two. B equals a dot copy. Then b, index zero, dot append nine. What is a now?",
    options: ["[[1], [2]]: copy() made it independent", "[[1, 9], [2]]", "[[1], [2], 9]", "TypeError"],
    oSay: ["unchanged, copy made it independent", "the first inner list becomes one, nine", "nine gets added at the end", "a type error"],
    answer: 1,
    a: "[[1, 9], [2]]. copy() is shallow: a new outer list, but b[0] is the same inner list as a[0].",
    aSay: "B. A becomes the list one nine, and two. Copy is shallow. It made a new outer list, but b's first element is the same inner list as a's first element, so appending to it shows through both.",
  }),
  check({
    topic: "defaults",
    q: "Why does def log(msg, when=datetime.now()) print the same time on every call?",
    say: "Why does a function with the default, when equals datetime dot now, print the same time on every call?",
    a: "Defaults are evaluated once, when def runs. Use when=None and set it inside the body.",
    aSay: "Because default values are evaluated once, when the def statement runs, not on every call. So the time is frozen at the moment the function was defined. Default to None, and compute the time inside the body.",
  }),

  // ================================================================ module 2
  sec("2", "Built-in data structures", "Module two. The built-in data structures: lists, tuples, dicts, sets and strings, how they work inside, and the comprehensions that build them. Eleven write-ups asked about comprehensions alone."),
  {
    kind: "compare",
    title: "The idea: four containers, two machines inside",
    cols: [
      { title: "list", tone: "blue", items: ["Ordered, mutable", "A growable array of pointers", "Index O(1), search O(n)"] },
      { title: "tuple", tone: "cyan", items: ["Ordered, immutable", "A fixed array of pointers", "Hashable if its items are"] },
      { title: "dict", tone: "amber", items: ["Key → value", "A hash table", "Lookup O(1) on average"] },
      { title: "set", tone: "green", items: ["Unique items", "A hash table, keys only", "Membership O(1)"] },
    ],
    footer: "Arrays answer “what's at position i?”; hash tables answer “is this key here?”",
    beats: B(
      "Here's the module in one picture. A list is ordered and mutable, and inside it's a growable array of pointers. So getting item i is instant, but searching means walking the list.",
      "A tuple is the same kind of array, but fixed: it can't change, so it can be hashed, as long as what's inside can.",
      "A dict maps keys to values, and inside it's a hash table, so looking a key up is constant time on average.",
      "And a set is a hash table with keys and no values. So asking: is this item in the set, is constant time too.",
      { say: "So there are really only two machines inside. Arrays answer: what's at position i. Hash tables answer: is this key here. Most questions in this module are one of those two.", tone: "key" },
    ),
  },

  // ---- Q8
  q(8, 5, "What is the difference between a list and a tuple?", "mutability, hashability, memory, and meaning", "Question eight, asked in five write-ups. What's the difference between a list and a tuple?", "Mutability first, then what follows from it: hashability, memory, and what each one is used to mean."),
  {
    kind: "compare",
    title: "list vs tuple",
    cols: [
      { title: "list  [1, 2]", tone: "blue", items: ["Mutable: append, remove, sort in place", "Not hashable: can't be a dict key", "Over-allocates room to grow", "Many items of the same kind"] },
      { title: "tuple  (1, 2)", tone: "cyan", items: ["Immutable: fixed once made", "Hashable if its items are: dict keys, set members", "Smaller, slightly faster to create", "A record: fixed positions, like (lat, lon)"] },
    ],
    footer: "The comma makes a tuple: (1,) is a tuple, (1) is just 1",
    beats: B(
      "A list is mutable. You append, remove and sort it in place. Because it can change, it isn't hashable, so it can't be a dict key. And it keeps spare room so it can grow.",
      "A tuple is immutable. Once made, it's fixed. So if its items are hashable, the tuple is too, and it can be a key, like a pair of coordinates. It's smaller, and a little faster to create. And it usually means a record: fixed positions, each with its own meaning, like latitude and longitude.",
      { say: "And one detail interviewers like: it's the comma that makes a tuple, not the brackets. One, comma, in brackets, is a tuple. One in brackets is just the number one.", tone: "key" },
    ),
  },
  {
    kind: "sayit",
    q: "List vs tuple?",
    lines: [
      "A list is mutable; a tuple is immutable.",
      "So a tuple of hashable items is hashable: it can be a dict key or a set member.",
      "Tuples are smaller and a bit faster; lists over-allocate to grow.",
      "Use a list for a collection that changes, a tuple for a fixed record.",
    ],
    beats: B(
      { say: "Said in an interview.", tone: "ask" },
      "A list is mutable, a tuple is immutable.",
      "Because of that, a tuple of hashable items is itself hashable, so it can be a dictionary key or a set member. A list never can.",
      "Tuples are smaller and slightly faster. Lists over-allocate memory so they can grow.",
      { say: "So I use a list for a collection that changes, and a tuple for a fixed record, like a coordinate or a row returned from a database.", tone: "key" },
    ),
  },

  // ---- Q9
  q(9, null, "How is a list implemented, and what are the time complexities?", "a dynamic array of pointers, over-allocation, what's O(1) and what's O(n)", "Question nine. How is a list implemented, and what are the time complexities?", "Describe the dynamic array, explain why append is cheap, and then say which operations are slow."),
  custom(
    "pylist",
    {
      title: "A list is a growable block of pointers",
      sub: "like Java's ArrayList<Object>",
      items: ["7", '"hi"', "3.5", "None", "[1]", "True", "'x'", "42", "0"],
      steps: [
        { len: 4, cap: 4, op: "lst = [7, 'hi', 3.5, None]" },
        { len: 4, cap: 4, hl: 2, op: "lst[2]  → O(1)", note: "position × pointer size: index straight to the slot" },
        { len: 5, cap: 8, grow: true, op: "append: full → grow", note: "full: allocate a bigger block, copy the pointers over, leave spare room" },
        { len: 6, cap: 8, op: "append → O(1)", note: "spare room: append just fills the next slot, so it's amortised O(1)" },
        { len: 7, cap: 8, shift: true, op: "insert(0, x) → O(n)", note: "inserting at the front moves every pointer one slot right" },
      ],
    },
    B(
      "A Python list is a dynamic array, and what it stores are pointers to objects, not the objects themselves. That's why one list can hold an int, a string and None side by side.",
      "Indexing is instant: Python computes where slot two is, and goes straight there. Constant time.",
      "When the block is full and you append, CPython allocates a bigger block, copies the pointers across, and leaves spare room. It grows by about an eighth plus a little, which is a smaller step than Java's.",
      "So most appends just fill the next spare slot. The occasional copy is spread across many appends, which is what amortised constant time means.",
      { say: "But inserting at the front, or popping from the front, has to move every pointer one slot. That's linear time. So if you need a queue, use collections dot deque, which adds and removes at both ends in constant time.", tone: "key" },
    ),
  ),
  {
    kind: "numbers",
    title: "List operations at a glance",
    items: [
      { value: "O(1)", label: "lst[i], len(lst), append, pop()", tone: "green" },
      { value: "O(n)", label: "insert(0, x), pop(0), remove(x)", tone: "red" },
      { value: "O(n)", label: "x in lst, lst.index(x)", tone: "red", sub: "use a set for membership" },
      { value: "O(n log n)", label: "lst.sort()", tone: "amber", sub: "Timsort, stable" },
    ],
    beats: B(
      "So, the costs. Indexing, length, append, and pop from the end: constant time.",
      "Insert at the front, pop from the front, and remove a value: linear, because things shift.",
      "Searching, with in or dot index, is linear too, because the list has to look at each item. If you test membership a lot, use a set.",
      "And sorting is n log n, using Timsort, which is stable.",
    ),
  },

  // ---- Q10
  q(10, 1, "How does a dict work internally?", "hash → slot, collisions, why keys must be hashable, ordering", "Question ten. How does a dict work internally?", "The hash table, step by step: hashing to a slot, collisions, why keys must be immutable, and why dicts keep insertion order."),
  custom(
    "pyhash",
    {
      title: "A dict is a hash table",
      sub: "8 slots to start; the hash decides the slot",
      size: 8,
      steps: [
        { key: '"alice"', value: "91", hash: "…5821", slot: 5, note: "the key's hash, modulo the table size, picks a slot" },
        { key: '"bob"', value: "78", hash: "…3402", slot: 2 },
        { key: '"carol"', value: "85", hash: "…7133", slot: 7, probe: [5], note: "collision: slot 5 is alice's, so CPython probes on to another slot" },
        { key: '"bob"', value: "78", hash: "…3402", slot: 2, lookup: true, note: "lookup repeats the same steps: hash, slot, compare the key with ==: O(1) on average" },
      ],
    },
    B(
      "A dict is a hash table. To store alice, Python calls hash on the key, takes it modulo the table size, and that picks a slot. Alice lands in slot five.",
      "Bob hashes to slot two.",
      "Carol hashes to slot five, but that's taken. That's a collision. CPython uses open addressing: it probes other slots in a fixed pseudo-random order until it finds a free one. Carol lands in seven.",
      { say: "And a lookup repeats the same steps. Hash the key, go to the slot, and confirm it's the right key with double equals. No scanning. That's why lookup is constant time on average.", tone: "key" },
    ),
  ),
  {
    kind: "bullets",
    title: "What follows from the hash table",
    firstItemStep: 0,
    items: [
      { icon: "🔑", text: "Keys must be hashable, and their hash must never change", sub: "a key that changed would sit in the wrong slot forever: so no lists" },
      { icon: "⚖️", text: "a == b must imply hash(a) == hash(b)", sub: "override __eq__ and you must override __hash__ too" },
      { icon: "📈", text: "The table resizes when about two-thirds full", sub: "so probe chains stay short; worst case O(n) with many collisions" },
      { icon: "📋", text: "Insertion order is kept (guaranteed since 3.7)", sub: "a compact index array plus a dense array of entries" },
    ],
    beats: B(
      "Four things follow from that picture. First, keys must be hashable, and the hash must never change. If a key could change after being stored, it would sit in the wrong slot forever and never be found. That's why lists can't be keys.",
      "Second, two keys that are equal must have the same hash. So if you override dunder eq in your own class, you must override dunder hash as well.",
      "Third, the table grows when it's about two thirds full, to keep probe chains short. With lots of collisions, the worst case is linear, but that's rare.",
      { say: "And fourth, dicts keep insertion order, guaranteed since Python three point seven. Inside, there's a small index array of slots, pointing into a dense array of entries kept in the order you added them.", tone: "key" },
    ),
  },

  // ---- Q11
  q(11, null, "What is a set, and when do you use it?", "a hash table of keys: membership, dedup, set algebra", "Question eleven. What is a set, and when do you use it?", "It's the same hash table without values, so say what that makes fast."),
  {
    kind: "code",
    title: "A set: unique, hashable items, O(1) membership",
    lang: "python",
    code: `seen = set()               # {} is an empty DICT, not a set
for user in events:
    if user in seen:       # O(1): a hash lookup, not a scan
        continue
    seen.add(user)

a, b = {1, 2, 3}, {2, 3, 4}
a | b      # {1, 2, 3, 4}   union
a & b      # {2, 3}         intersection
a - b      # {1}            difference
frozenset(a)   # immutable, so it can be a dict key`,
    highlight: [[1, 5], [7, 10], [11, 11]],
    beats: B(
      "A set is an unordered collection of unique, hashable items. It's a hash table with keys and no values. So the big use is fast membership: is this user in seen? That's a hash lookup, not a scan. It's how you deduplicate, and how BFS tracks visited nodes. And note: empty curly braces make an empty dict. An empty set is set with brackets.",
      "Sets also do algebra. Union with the bar, intersection with the ampersand, and difference with minus. Common followers, missing ids, that kind of question.",
      { say: "And frozenset is the immutable version, so it's hashable, and can itself be a dict key or sit inside another set.", tone: "key" },
    ),
  },

  // ---- Q12
  q(12, 2, "Why are strings immutable, and how should you build strings efficiently?", "what immutability buys, and join instead of += in a loop", "Question twelve, asked twice. Why are strings immutable, and how should you build strings efficiently?", "What immutability buys you, and the consequence for building strings."),
  {
    kind: "code",
    title: "Build a list of pieces, join once",
    lang: "python",
    code: `# slow: every += may copy everything built so far
out = ""
for word in words:
    out += word + " "          # can be O(n²) overall

# fast: collect the pieces, join once
out = " ".join(words)          # O(n)
parts = [f"{k}={v}" for k, v in params.items()]
query = "&".join(parts)`,
    highlight: [[1, 4], [6, 9]],
    beats: B(
      "Strings are immutable sequences of Unicode characters. That buys a lot: they're hashable, so they can be dict keys. They're safe to share between threads and functions. And CPython can intern and cache them. The cost: every change makes a new string. So adding to a string in a loop can copy everything built so far, every time, which is quadratic. CPython sometimes optimises this case, but you can't rely on it.",
      { say: "The fix is the idiom interviewers want to hear: collect the pieces in a list, and join them once at the end. That's linear.", tone: "key" },
    ),
  },

  // ---- Q13
  q(13, null, "How does slicing work?", "start included, stop excluded, negative indexes, step", "Question thirteen. How does slicing work?", "The three parts of a slice, negative indexes, and two facts that surprise people."),
  custom(
    "pytape",
    {
      title: "s[start : stop : step]",
      sub: "start is included, stop is not",
      cells: ["P", "Y", "T", "H", "O", "N"],
      neg: true,
      steps: [
        { note: "positive indexes from the left, negative from the right: -1 is the last" },
        { range: [1, 4], out: 's[1:4]  →  "YTH"', note: "from index 1 up to, but not including, index 4" },
        { range: [3, 6], out: 's[-3:]  →  "HON"', note: "a missing stop means “to the end”: the last three" },
        { pick: [0, 2, 4], out: 's[::2]  →  "PTO"', note: "a step of 2 takes every second item" },
        { pick: [0, 1, 2, 3, 4, 5], out: 's[::-1]  →  "NOHTYP"', note: "a step of -1 walks backwards: a reversed copy" },
      ],
    },
    B(
      "A slice has a start, a stop, and a step. Indexes count from zero on the left, and negative indexes count from the right, so minus one is the last item.",
      "S from one to four gives Y, T, H. Start is included, stop is excluded, so you get index one, two and three.",
      "Leave out the stop, and it runs to the end. S from minus three is the last three: H, O, N.",
      "A step of two takes every second item: P, T, O.",
      { say: "And a step of minus one walks backwards, so s with colon colon minus one is the classic way to reverse a sequence.", tone: "key" },
    ),
  ),
  {
    kind: "bullets",
    title: "Two facts that surprise people",
    items: [
      { icon: "📄", text: "A slice of a list is a new list: a shallow copy", sub: "copy = lst[:]" },
      { icon: "🛡️", text: "Slices never raise IndexError", sub: "lst[10:20] on a short list is just []; lst[10] raises" },
    ],
    beats: B(
      "Two facts that surprise people. Slicing a list creates a new list, a shallow copy. So lst with colon is a quick copy.",
      { say: "And slices never raise an index error. Slicing past the end just gives you an empty list, while indexing past the end raises.", tone: "key" },
    ),
  },

  // ---- Q14
  q(14, 11, "What are list, dict and set comprehensions, and generator expressions?", "the shape, the filter, when to use a generator expression, when not to", "Question fourteen, asked in eleven write-ups. What are list, dict and set comprehensions, and generator expressions?", "Show the shape of each, then the one difference that matters: building everything now, or one item at a time."),
  {
    kind: "code",
    title: "One shape: [expression for item in iterable if condition]",
    lang: "python",
    code: `squares = [n * n for n in nums if n % 2 == 0]   # list
lengths = {w: len(w) for w in words}            # dict
firsts  = {w[0] for w in words}                 # set

total = sum(n * n for n in nums)                # generator expression
pairs = [(r, c) for r in range(3) for c in range(3)]   # nested: outer first

# the loop it replaces
squares = []
for n in nums:
    if n % 2 == 0:
        squares.append(n * n)`,
    highlight: [[1, 1], [2, 3], [5, 5], [6, 6], [8, 12]],
    beats: B(
      "A comprehension builds a new collection from an iterable in one expression. Read it as: the expression, for each item, if the condition holds. This list comprehension squares the even numbers.",
      "Change the brackets to curly braces, and you get a set. Add a key and a colon, and you get a dict.",
      "Use round brackets, and you get a generator expression. It doesn't build anything. It produces items one at a time, on demand, so passing it straight to sum, any, max or join uses almost no memory.",
      "Two for clauses nest, and they read in the same order as nested loops: the outer one first.",
      { say: "It replaces exactly this loop: an empty list, a for, an if, and an append. The comprehension is shorter, and a little faster, because the append happens inside the interpreter, without a method lookup each time.", tone: "key" },
    ),
  },
  custom(
    "pymem",
    {
      title: "[ ] builds them all  ·  ( ) hands them over one by one",
      n: "10 million",
      left: "List comprehension",
      right: "Generator expression",
      leftCode: "sum([n * n for n in range(10**7)])",
      rightCode: "sum(n * n for n in range(10**7))",
      leftMem: "≈ 400 MB of squares held at once",
      rightMem: "one square at a time: a few bytes",
      note: "Same answer. Use ( ) when you only pass over the items once; [ ] when you need them again, or need len() or indexing.",
    },
    B(
      "Here's why the brackets matter. Ten million squares, summed.",
      "With square brackets, Python builds the whole list of ten million squares first, which is hundreds of megabytes, and only then sums them.",
      "With round brackets, sum pulls one square at a time, adds it, and throws it away. Memory stays flat.",
      { say: "Same answer. So use a generator expression when you'll pass over the items once. Use a list when you need them again, or need their length, or need to index into them. And keep comprehensions simple: if it needs two conditions and a nested loop, write the loop.", tone: "key" },
    ),
  ),
  {
    kind: "sayit",
    q: "What are comprehensions, and when do you use a generator expression?",
    lines: [
      "A comprehension builds a list, dict or set from an iterable in one expression, with an optional filter.",
      "It's shorter and a little faster than an append loop.",
      "A generator expression, with round brackets, yields items lazily: constant memory.",
      "I use it when the result is consumed once, like sum, any, or join.",
      "If the logic needs several steps or side effects, I write a normal loop.",
    ],
    beats: B(
      { say: "The answer, out loud.", tone: "ask" },
      "A comprehension builds a list, a dict or a set from an iterable in one expression, with an optional filter.",
      "It's more readable than an append loop, and a little faster.",
      "A generator expression, written with round brackets, produces items lazily, one at a time, so it uses constant memory.",
      "I use it whenever the result is consumed once, like passing it to sum, any or join.",
      { say: "And if the logic needs several steps, or has side effects, I write a normal loop instead. Readability wins.", tone: "key" },
    ),
  },

  // ---- Q15
  q(15, null, "What does the collections module give you?", "the five containers interviews use", "Question fifteen. What does the collections module give you?", "Five containers, each with the problem it's built for."),
  {
    kind: "bullets",
    title: "collections: five containers, five problems",
    items: [
      { icon: "🔢", text: "Counter: counts things", sub: "Counter(words).most_common(3)  → word frequency" },
      { icon: "🗂️", text: "defaultdict: a missing key gets a default", sub: "groups = defaultdict(list); groups[k].append(x)  → grouping" },
      { icon: "↔️", text: "deque: O(1) at both ends", sub: "queue.append(x); queue.popleft()  → BFS, sliding windows" },
      { icon: "📌", text: "OrderedDict: order you can move", sub: "move_to_end, popitem(last=False)  → an LRU cache" },
      { icon: "🏷️", text: "namedtuple: a tuple with field names", sub: "Point = namedtuple('Point', 'x y'); p.x" },
    ],
    beats: B(
      "Counter counts things. Hand it a list of words, and most common three gives you the top three. Word-frequency questions, in one line.",
      "Defaultdict gives a missing key a default value, from a function you pass in, like list. So grouping is just: groups of k, dot append. No checking whether the key exists.",
      "Deque, a double-ended queue, adds and removes at both ends in constant time. It's the queue for breadth-first search, and for sliding windows.",
      "OrderedDict keeps an order you can change, with move to end, and pop item from either end. That's the classic way to build an LRU cache, which comes back in module eleven.",
      { say: "And namedtuple is a tuple whose fields have names, so p dot x instead of p of zero. Interviews love these five. Counter, defaultdict and deque especially.", tone: "key" },
    ),
  },

  // ---- Q16
  q(16, null, "How do sorting, key= and enumerate/zip work?", "sorted vs sort, key functions, stability, and the looping helpers", "Question sixteen. How do sorting, the key argument, enumerate and zip work?", "The difference between sorted and sort, what key does, why stability matters, and the two looping helpers."),
  {
    kind: "code",
    title: "Sorting with key=, and looping helpers",
    lang: "python",
    code: `nums.sort()                      # in place, returns None
ranked = sorted(nums)            # a new list; any iterable

people.sort(key=lambda p: p.age)               # sort by a field
scores.sort(key=lambda s: (-s.points, s.name)) # points desc, then name

for i, name in enumerate(names, start=1):     # index and value
    print(i, name)
for name, score in zip(names, scores):        # walk two lists together
    print(name, score)`,
    highlight: [[1, 2], [4, 5], [7, 10]],
    beats: B(
      "Dot sort sorts a list in place and returns None. A classic bug is writing x equals x dot sort. Sorted works on any iterable and returns a new list.",
      "The key argument is a function computed once per element, and Python sorts by its result. To sort by several things, return a tuple. And to flip one part, negate it: minus points, then name, gives highest points first, with ties in name order. Python's sort is Timsort: n log n, fast on data that's partly sorted, and stable, so equal keys keep their original order.",
      { say: "And the two looping helpers. Enumerate gives you the index and the value together, so you never write range of len. Zip walks two or more iterables in step, and stops at the shortest.", tone: "key" },
    ),
  },
  check({
    topic: "dict",
    q: "Why is `key in my_dict` O(1), but `key in my_list` O(n)?",
    say: "Why is checking whether a key is in a dict constant time, but checking whether it's in a list linear?",
    a: "The dict hashes the key straight to a slot and compares one entry. The list has no index by value, so it compares item by item.",
    aSay: "Because a dict is a hash table. It hashes the key, jumps straight to the slot, and compares one entry. A list only knows positions, not values, so finding a value means comparing items one by one.",
  }),
  check({
    topic: "comprehensions",
    q: "You need the total length of 50 million lines from a file. [ ] or ( ) inside sum()?",
    say: "You need the total length of fifty million lines from a file. Square brackets or round brackets inside sum?",
    options: ["[ ]: lists are faster", "( ): one line in memory at a time", "Either: Python optimises it", "Neither: use a for loop"],
    oSay: ["square brackets, lists are faster", "round brackets, one line in memory at a time", "either, Python optimises it", "neither, use a for loop"],
    answer: 1,
    a: "( ). A generator expression passes one line at a time to sum, so memory stays flat; [ ] would hold 50 million lengths first.",
    aSay: "B. Round brackets. The generator expression hands one line's length at a time to sum, so memory stays flat. Square brackets would build a list of fifty million lengths before adding any of them.",
  }),
];
