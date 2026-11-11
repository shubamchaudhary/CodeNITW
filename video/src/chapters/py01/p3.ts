import type { Scene } from "../../lib/types.ts";
import { B, check, custom, q, sec } from "./h.ts";

// Part 3: module 5 (object-oriented Python) and module 6 (errors and
// context managers).
export const p3: Scene[] = [
  // ================================================================ module 5
  sec("5", "Object-oriented Python", "Module five. Object-oriented Python. Twelve questions, and nearly all of them come down to one mechanism: how Python finds an attribute."),
  {
    kind: "flow",
    title: "The idea: rex.speak() looks in four places, in order",
    cols: 4,
    rows: 2,
    nodeW: 360,
    nodeH: 150,
    nodes: [
      { id: "i", label: "rex.__dict__\nthe instance's own attributes", c: 0, r: 0, tone: "amber" },
      { id: "d", label: "class Dog\nmethods, class attributes", c: 1, r: 0 },
      { id: "a", label: "class Animal\nthe base class", c: 2, r: 0 },
      { id: "o", label: "object\nthe root of everything", c: 3, r: 0, tone: "cyan" },
      { id: "n", label: "nothing found anywhere:\nAttributeError", c: 3, r: 1, tone: "red" },
    ],
    edges: [
      { from: "i", to: "d", label: "not here" },
      { from: "d", to: "a", label: "not here" },
      { from: "a", to: "o", label: "not here" },
      { from: "o", to: "n" },
    ],
    show: [["i"], ["d"], ["a", "o"], ["n"]],
    beats: B(
      "Here's the idea. When you write rex dot speak, Python first looks in the instance's own dictionary, rex dot dunder dict. That's where values you set on self live.",
      "If it's not there, it looks in the class, Dog. That's where methods and class attributes live.",
      "Then up through the base classes, Animal, and finally object, the root of every class. The order it walks is called the MRO, the method resolution order.",
      { say: "And if it's nowhere, you get an attribute error. Instance, then class, then base classes. Hold on to that chain, because self, class attributes, inheritance, super and even properties are all explained by it.", tone: "key" },
    ),
  },

  // ---- Q31 (py28)
  q(31, null, "How do classes work in Python (self, instance vs class attributes)?", "what self is, where attributes live, and the shared class attribute bug", "Question thirty one. How do classes work in Python? Self, and instance versus class attributes.", "What self really is, where each kind of attribute lives, and the bug that comes from mixing them up."),
  {
    kind: "code",
    title: "self is just the first parameter",
    lang: "python",
    code: `class Account:
    rate = 0.03                    # class attribute: one, shared
    def __init__(self, owner):
        self.owner = owner         # instance attribute: one per object
        self.balance = 0

    def deposit(self, amount):     # self = the instance it was called on
        self.balance += amount

a = Account("ana")
a.deposit(10)                      # really: Account.deposit(a, 10)`,
    highlight: [[2, 2], [3, 5], [7, 11]],
    beats: B(
      "A class attribute is defined in the class body. There's one copy, stored on the class, shared by every instance.",
      "Instance attributes are set on self, usually in dunder init. Each object gets its own, in its own dict.",
      { say: "And self isn't a keyword. It's just the first parameter: the instance the method was called on. A dot deposit of ten is really Account dot deposit of a, ten. Python passes the instance for you.", tone: "key" },
    ),
  },
  custom(
    "pynames",
    {
      title: "The shared class attribute bug",
      sub: "class Team: members = []",
      steps: [
        { tags: [{ name: "Team.members", to: "L" }], objs: [{ id: "L", text: "[]", sub: "one list, on the class" }] },
        { tags: [{ name: "Team.members", to: "L" }, { name: "red.members", to: "L", tone: "pink" }, { name: "blue.members", to: "L", tone: "cyan" }], objs: [{ id: "L", text: "[]" }], note: "neither instance has its own members, so both find the class's list" },
        { tags: [{ name: "Team.members", to: "L" }, { name: "red.members", to: "L", tone: "pink" }, { name: "blue.members", to: "L", tone: "cyan" }], objs: [{ id: "L", text: '["ana"]', sub: "red.members.append(\"ana\")" }], note: "blue sees red's player: mutable state belongs in __init__, on self" },
      ],
    },
    B(
      "Here's the bug. A class Team with a class attribute members, an empty list. One list, stored on the class.",
      "Make two teams, red and blue. Neither instance has its own members, so following the lookup chain, both find the class's list.",
      { say: "Red appends a player, and blue has that player too. The fix: create mutable state in dunder init, on self, so each instance gets its own list. It's the mutable default problem from module one, wearing a class.", tone: "key" },
    ),
  ),

  // ---- Q32 (py29)
  q(32, null, "What is the difference between __init__ and __new__?", "create versus initialise, and when you'd ever override __new__", "Question thirty two. What's the difference between dunder init and dunder new?", "Which one creates the object and which one fills it in, and the few times you override new."),
  {
    kind: "seq",
    title: "Account(\"ana\"): create, then initialise",
    actors: [
      { id: "c", name: "Account(\"ana\")", icon: "📞" },
      { id: "n", name: "__new__(cls)", icon: "🏗️", tone: "amber" },
      { id: "i", name: "__init__(self)", icon: "🧰", tone: "green" },
    ],
    msgs: [
      { from: "c", to: "n", label: "1. create: allocate a new object", step: 0 },
      { from: "n", to: "c", label: "returns the empty instance", step: 0, tone: "amber" },
      { from: "c", to: "i", label: "2. initialise it: set attributes", step: 1 },
      { from: "i", to: "c", label: "returns None", step: 1, tone: "green" },
    ],
    note: { step: 2, text: "Override __new__ only to control creation: subclassing str or int, singletons, caching instances", tone: "amber" },
    beats: B(
      "Calling a class does two things. First, dunder new, which receives the class, creates the object, and returns it. It runs first.",
      "Then dunder init receives that new object as self, and initialises it, setting its attributes. It returns None.",
      { say: "So new creates, and init initialises. You almost never override new. When you do, it's to control creation itself: subclassing an immutable type like str or int, where the value must be set at creation, or returning an existing instance, as in a singleton.", tone: "key" },
    ),
  },

  // ---- Q33 (py30)
  q(33, 2, "What is the difference between instance methods, @classmethod and @staticmethod?", "what each receives, and what each is for", "Question thirty three, asked twice. What's the difference between instance methods, class methods and static methods?", "What each one receives, and the use each one is for."),
  {
    kind: "compare",
    title: "Three kinds of method",
    cols: [
      { title: "instance method", tone: "blue", items: ["Receives self: the instance", "Reads and changes that object", "Normal behaviour"] },
      { title: "@classmethod", tone: "amber", items: ["Receives cls: the class", "Builds and returns instances", "Alternative constructors: from_json"] },
      { title: "@staticmethod", tone: "cyan", items: ["Receives nothing implicit", "A plain function in the class's namespace", "Helpers that belong with the class"] },
    ],
    footer: "A classmethod called on a subclass builds the subclass: that's why it gets cls",
    beats: B(
      "An instance method receives self, the instance, so it can read and change that object. That's normal behaviour.",
      "A class method receives cls, the class itself. Its classic use is an alternative constructor, like point dot from string, or config dot from env, that builds and returns an instance.",
      "A static method receives nothing implicit. It's a plain function that lives in the class's namespace because it belongs there, like a validation helper.",
      { say: "And why does a class method get cls, instead of naming the class? Because called on a subclass, cls is the subclass, so the alternative constructor builds the right type.", tone: "key" },
    ),
  },

  // ---- Q34 (py31)
  q(34, null, "What does @property do?", "attribute syntax with a method behind it", "Question thirty four. What does at property do?", "Attribute syntax, with a method behind it, and why that means no getters and setters."),
  {
    kind: "code",
    title: "@property: start with a plain attribute, add logic later",
    lang: "python",
    code: `class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius

    @property
    def fahrenheit(self):             # read like an attribute
        return self.celsius * 9 / 5 + 32

    @fahrenheit.setter
    def fahrenheit(self, value):      # assign like an attribute
        self.celsius = (value - 32) * 5 / 9

t = Temperature(100)
t.fahrenheit          # 212.0: no parentheses
t.fahrenheit = 32     # runs the setter: celsius = 0`,
    highlight: [[5, 7], [9, 11], [13, 15]],
    beats: B(
      "At property turns a method into something you read like an attribute. T dot fahrenheit, without parentheses, runs this method.",
      "A setter, with at fahrenheit dot setter, runs when you assign to it. That's where validation goes.",
      { say: "The point is that callers never change. In Python, you start with plain public attributes, no getters and setters. If you later need validation, or a computed value, you swap in a property, and every line that uses the attribute keeps working.", tone: "key" },
    ),
  },

  // ---- Q35 (py32)
  q(35, 2, "How do inheritance, super() and the MRO work (including multiple inheritance)?", "the diamond, C3 linearisation, and what super() really calls", "Question thirty five, asked twice. How do inheritance, super and the MRO work, including multiple inheritance?", "Draw the diamond, give the MRO, and say what super actually calls, which is not always the parent."),
  {
    kind: "flow",
    title: "The diamond: class D(B, C), where B and C both inherit A",
    cols: 3,
    rows: 3,
    nodeW: 260,
    nodeH: 110,
    nodes: [
      { id: "a", label: "A", c: 1, r: 0, tone: "cyan" },
      { id: "b", label: "B(A)", c: 0, r: 1 },
      { id: "c", label: "C(A)", c: 2, r: 1 },
      { id: "d", label: "D(B, C)", c: 1, r: 2, tone: "amber" },
    ],
    edges: [
      { from: "d", to: "b" },
      { from: "d", to: "c" },
      { from: "b", to: "a" },
      { from: "c", to: "a" },
    ],
    show: [["a", "b", "c", "d"], []],
    overlay: { step: 1, text: "D.__mro__  →  D, B, C, A, object", tone: "amber" },
    beats: B(
      "Python supports multiple inheritance, and that raises the diamond problem. D inherits from B and C, and both inherit from A. When D calls a method, which path wins, and does A run twice?",
      { say: "Python answers with the MRO, computed by an algorithm called C3 linearisation. Children come before parents, and the left to right order of the bases is kept. So for D, it's D, B, C, A, then object. A appears once, at the end. You can print it with D dot dunder mro.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "super() means “the next class in the MRO”",
    lang: "python",
    code: `class A:
    def hello(self): print("A")
class B(A):
    def hello(self): print("B"); super().hello()
class C(A):
    def hello(self): print("C"); super().hello()
class D(B, C):
    def hello(self): print("D"); super().hello()

D().hello()     # D B C A: each runs once, in MRO order`,
    highlight: [[1, 8], [10, 10]],
    beats: B(
      "Now super. Each class prints its name and calls super dot hello.",
      { say: "D, B, C, A. Look at B: B's super call went to C, not to A, even though B only inherits from A. Super doesn't mean my parent. It means the next class in the MRO of the object you're working on. That's what lets every class in the diamond run exactly once, which is called cooperative multiple inheritance.", tone: "key" },
    ),
  },

  // ---- Q36 (py33)
  q(36, null, "What are dunder (magic) methods? Give important examples.", "how your classes plug into Python's syntax", "Question thirty six. What are dunder methods? Give important examples.", "What they're for, and a good spread of examples."),
  {
    kind: "bullets",
    title: "Dunder methods: Python's syntax calls them for you",
    items: [
      { icon: "🖨️", text: "repr(x), str(x)  →  __repr__, __str__", sub: "repr for developers (unambiguous), str for users" },
      { icon: "⚖️", text: "a == b, hash(a)  →  __eq__, __hash__", sub: "override both together, or neither" },
      { icon: "➕", text: "a + b, a < b  →  __add__, __lt__", sub: "operators on your own types" },
      { icon: "📦", text: "len(x), x[i], v in x, for v in x  →  __len__, __getitem__, __contains__, __iter__", sub: "behave like a container" },
      { icon: "🚪", text: "with x:, x()  →  __enter__ / __exit__, __call__", sub: "context managers, callable objects" },
    ],
    beats: B(
      "Dunder methods, double underscore methods, are how your classes plug into Python's built-in syntax. You don't call them. Python does. Repr and str: repr is for developers and should be unambiguous, ideally something that looks like the code to rebuild the object. Str is for users.",
      "Double equals calls dunder eq, and hashing calls dunder hash. As we saw with dicts, override both together.",
      "Operators: plus calls dunder add, less than calls dunder lt.",
      "Containers: len, indexing, in, and for loops call dunder len, getitem, contains and iter.",
      { say: "And with statements call dunder enter and exit, while dunder call makes an instance callable like a function. This whole system is called the Python data model.", tone: "key" },
    ),
  },

  // ---- Q37 (py34)
  q(37, 3, "What are abstract base classes, duck typing and Protocols?", "three ways to say “this object can do X”", "Question thirty seven, asked in three write-ups. What are abstract base classes, duck typing and Protocols?", "Three ways to say: this object can do this job. And when you'd pick each."),
  {
    kind: "compare",
    title: "Three ways to describe an interface",
    cols: [
      { title: "Duck typing", icon: "🦆", tone: "amber", items: ["No declaration at all", "If it has .send(), call it", "Fails at runtime if it doesn't"] },
      { title: "ABC", icon: "📜", tone: "blue", items: ["class Notifier(ABC) with @abstractmethod", "Subclasses must inherit and implement", "Can't instantiate an unfinished one"] },
      { title: "Protocol", icon: "🔌", tone: "green", items: ["class Sender(Protocol): def send(...)", "Structural: matches anything with send", "Checked by mypy, no inheritance needed"] },
    ],
    footer: "Duck typing at runtime · ABCs to enforce · Protocols to type-check without coupling",
    beats: B(
      "Duck typing: Python cares what an object can do, not what class it is. If it walks like a duck and quacks like a duck, it's a duck. You just call dot send, and if the object doesn't have it, you find out at runtime.",
      "Abstract base classes, from the abc module, enforce an interface. A class inherits from ABC and marks methods with at abstractmethod. A subclass that doesn't implement them can't even be instantiated.",
      "Protocols, from typing, are structural typing. You describe the methods a type needs, and anything that has them matches, with no inheritance. A static checker like mypy verifies it.",
      { say: "So: duck typing at runtime, ABCs when you want to enforce a contract, and Protocols when you want type checking without coupling. In AI code, a Protocol for an LLM client is perfect: the real client, and a fake one for tests, both match without sharing a base class.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "A Protocol: anything with the right method fits",
    lang: "python",
    code: `from typing import Protocol

class ChatModel(Protocol):
    def complete(self, prompt: str) -> str: ...

class OpenAIModel:                      # no inheritance
    def complete(self, prompt: str) -> str: ...

class FakeModel:                        # for tests
    def complete(self, prompt: str) -> str:
        return "canned answer"

def answer(model: ChatModel, q: str) -> str:
    return model.complete(q)            # both type-check`,
    highlight: [[3, 4], [6, 11], [13, 14]],
    beats: B(
      "Here's that Protocol. Chat model says: anything with a complete method that takes a string and returns a string.",
      "The real model class and a fake one for tests both have that method. Neither inherits from anything.",
      { say: "And answer accepts any chat model. Mypy checks both fit, and swapping one for the other needs no base class at all.", tone: "key" },
    ),
  },

  // ---- Q38 (py35)
  q(38, null, "What are dataclasses, and how do they compare with namedtuple and Pydantic?", "generated boilerplate, and which one to pick", "Question thirty eight. What are dataclasses, and how do they compare with namedtuple and Pydantic?", "What a dataclass generates, and when to use each of the three."),
  {
    kind: "compare",
    title: "namedtuple vs dataclass vs Pydantic",
    cols: [
      { title: "NamedTuple", tone: "cyan", items: ["Immutable, a tuple underneath", "Tiny, hashable, unpackable", "Small fixed records"] },
      { title: "@dataclass", tone: "blue", items: ["Generates __init__, __repr__, __eq__", "Mutable, or frozen=True", "No validation: hints aren't checked", "Internal data in your code"] },
      { title: "Pydantic", tone: "green", items: ["Validates and converts at runtime", "Parses JSON, gives clear errors", "Data from outside: APIs, LLMs, config"] },
    ],
    footer: "Trust the source? dataclass. Data crosses a boundary? Pydantic.",
    beats: B(
      "A named tuple is immutable, a real tuple underneath. Tiny, hashable, and you can unpack it. Good for small fixed records.",
      "A dataclass generates init, repr and eq from type-annotated fields, so a data class needs no boilerplate. It can be mutable or frozen. But it doesn't validate: pass a string where an int is hinted, and it's stored as a string. Use field with default factory for a list, to avoid the shared mutable default.",
      "Pydantic validates and converts at runtime. It parses JSON, coerces safe cases, and raises clear errors on bad data.",
      { say: "So the rule: if you trust the source, because it's your own code, a dataclass. If the data crosses a boundary, from an API, a user, a config file, or an LLM, use Pydantic.", tone: "key" },
    ),
  },

  // ---- Q39–Q42
  q(39, null, "What do single and double underscores mean (_x, __x, __x__)?", "convention, name mangling, and reserved names", "Question thirty nine. What do single and double underscores mean?", "Three forms, three meanings, and none of them is real privacy."),
  {
    kind: "bullets",
    title: "Underscores: conventions, not locks",
    items: [
      { icon: "🤫", text: "_x: internal, by convention", sub: "“don't use this from outside”: not enforced; import * skips it" },
      { icon: "🔀", text: "__x in a class: name mangling", sub: "becomes _ClassName__x, so subclasses don't clash with it by accident" },
      { icon: "✨", text: "__x__: dunder, reserved for Python", sub: "don't invent your own" },
      { icon: "🗑️", text: "_ alone: a throwaway name", sub: "for _ in range(3); also the last result in the REPL" },
    ],
    beats: B(
      "A single leading underscore means internal, by convention. Nothing stops you using it, but you've been warned. And from module import star skips it.",
      "Two leading underscores inside a class trigger name mangling: Python renames it to underscore classname double underscore x. It's there so a subclass doesn't override it by accident. It isn't privacy either.",
      "Double underscores on both sides are dunders, reserved for Python's own protocols.",
      { say: "And a lone underscore is a throwaway name, like for underscore in range three. Python has no private keyword: we're all consenting adults here.", tone: "key" },
    ),
  },
  q(40, null, "What are __slots__ used for?", "a fixed set of attributes, much less memory", "Question forty. What are dunder slots used for?", "What they replace, what you gain, and what you give up."),
  {
    kind: "code",
    title: "__slots__: no per-instance dict",
    lang: "python",
    code: `class Point:
    __slots__ = ("x", "y")     # only these attributes, ever
    def __init__(self, x, y):
        self.x, self.y = x, y

p = Point(1, 2)
p.z = 3        # AttributeError: no __dict__ to put it in

# a few million small objects: often 40–60% less memory`,
    highlight: [[1, 4], [6, 7], [9, 9]],
    beats: B(
      "Normally every instance carries its own dunder dict, a whole hash table, which is flexible but heavy. Dunder slots declares a fixed set of attribute names, stored in a compact array instead.",
      "The price: you can't add new attributes, and there's no instance dict.",
      { say: "The gain is memory, often forty to sixty percent less per instance, and slightly faster attribute access. It matters when you have millions of small objects. Dataclasses can do it for you with slots equals true.", tone: "key" },
    ),
  },
  q(41, 1, "What is a metaclass?", "the class of a class", "Question forty one. What is a metaclass?", "One line of definition, how a class statement uses it, and where you meet them."),
  {
    kind: "flow",
    title: "Instances come from classes; classes come from metaclasses",
    cols: 3,
    rows: 1,
    nodeW: 420,
    nodeH: 150,
    nodes: [
      { id: "i", label: "rex\nan instance", c: 0, r: 0 },
      { id: "c", label: "Dog\na class (an object too)", c: 1, r: 0, tone: "amber" },
      { id: "m", label: "type\nthe default metaclass", c: 2, r: 0, tone: "cyan" },
    ],
    edges: [
      { from: "i", to: "c", label: "type(rex)" },
      { from: "c", to: "m", label: "type(Dog)" },
    ],
    show: [["i", "c"], ["m"], []],
    overlay: { step: 2, text: "class Dog: … ≈ Dog = type(\"Dog\", (Animal,), namespace)  ·  used by ORMs and Pydantic; usually __init_subclass__ or a decorator is simpler", tone: "amber" },
    beats: B(
      "Classes are objects too, so they have a type. Rex's type is Dog.",
      "And Dog's type is type. Type is the default metaclass: the class of classes. A class makes instances; a metaclass makes classes.",
      { say: "A class statement is roughly a call to type, with the name, the bases, and the namespace of the body. A custom metaclass hooks into that, which is how ORMs and Pydantic turn a class body into fields. But for most needs, a class decorator or dunder init subclass is simpler, and that's worth saying.", tone: "key" },
    ),
  },
  q(42, null, "How do you implement a singleton in Python?", "a module, __new__, or one instance created at startup", "Question forty two. How do you implement a singleton in Python?", "A few ways, from most Pythonic to least, and what you'd actually do."),
  {
    kind: "code",
    title: "Singletons, from most to least Pythonic",
    lang: "python",
    code: `# 1. a module is already a singleton: import it anywhere
settings = Settings()          # in config.py

# 2. __new__ hands back the one instance
class Config:
    _instance = None
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

# 3. or cache a factory
@functools.cache
def get_client(): return LLMClient()`,
    highlight: [[1, 2], [4, 10], [12, 14]],
    beats: B(
      "The most Pythonic singleton is a module. Modules are imported once and cached, so an object created at module level is shared everywhere.",
      "The classic way is dunder new: keep the one instance on the class, and hand it back every time. Watch out: dunder init still runs on every call, and two threads can race to create it, so guard it with a lock if that matters.",
      { say: "Or cache a factory function with functools cache. In a FastAPI service, what I'd actually do is create the one client at startup, in the lifespan, and hand it out with a dependency. Explicit, and easy to replace in tests.", tone: "key" },
    ),
  },
  check({
    topic: "class attributes",
    q: "class Cart: items = []. a, b = Cart(), Cart(); a.items.append('pen'). What is b.items?",
    say: "Class Cart has items equals an empty list, in the class body. You make two carts, a and b, and a dot items dot append pen. What is b dot items?",
    a: "['pen']. items is a class attribute: one list shared through the class. Set self.items = [] in __init__.",
    aSay: "A list with pen in it. Items is a class attribute, so both carts find the same list on the class. Create it in dunder init, as self dot items equals an empty list, so each cart gets its own.",
  }),
  check({
    topic: "MRO",
    q: "class D(B, C), with B(A) and C(A). Inside B.hello, super().hello() calls whose method, for a D object?",
    say: "Class D inherits from B and C, and both inherit from A. Inside B's hello, super dot hello is called, on a D object. Whose hello runs?",
    options: ["A's", "C's", "D's", "B's again"],
    oSay: ["A's", "C's", "D's", "B's again"],
    answer: 1,
    a: "C's. super() is the next class in the object's MRO: D, B, C, A, object. After B comes C.",
    aSay: "B. C's. Super means the next class in the object's MRO, and for D that's D, B, C, A, object. After B comes C, not A.",
  }),

  // ================================================================ module 6
  sec("6", "Errors and context managers", "Module six. Errors and context managers. Three questions, and they share one idea: cleanup code that must run whatever happens."),
  {
    kind: "flow",
    title: "The idea: the four blocks of try",
    cols: 4,
    rows: 2,
    nodeW: 340,
    nodeH: 130,
    nodes: [
      { id: "t", label: "try:\nthe risky code", c: 0, r: 0, tone: "amber" },
      { id: "e", label: "except Error:\nonly if it raised", c: 1, r: 1, tone: "red" },
      { id: "l", label: "else:\nonly if it did NOT raise", c: 1, r: 0, tone: "green" },
      { id: "f", label: "finally:\nalways, no matter what", c: 2, r: 0, tone: "cyan" },
      { id: "x", label: "carry on\n(or the error goes up)", c: 3, r: 0 },
    ],
    edges: [
      { from: "t", to: "l", label: "no error" },
      { from: "t", to: "e", label: "raised" },
      { from: "l", to: "f" },
      { from: "e", to: "f" },
      { from: "f", to: "x" },
    ],
    show: [["t"], ["e"], ["l"], ["f", "x"]],
    beats: B(
      "Here's the idea. Try holds the code that might fail.",
      "Except runs only if it raised one of the exceptions you name.",
      "Else runs only if nothing was raised. It's for the code that depends on the try succeeding, kept outside the try so you don't catch its errors by accident.",
      { say: "And finally runs always: after success, after a handled error, after an unhandled one, even after a return. That's where cleanup goes. Hold on to finally: context managers, at the end of this module, are finally made reusable.", tone: "key" },
    ),
  },

  // ---- Q43 (py40)
  q(43, 4, "How does exception handling work (try, except, else, finally)?", "the four blocks, catching narrowly, and the traps", "Question forty three, asked in four write-ups. How does exception handling work? Try, except, else and finally.", "The four blocks, which we just saw, then the habits and traps interviewers listen for."),
  {
    kind: "code",
    title: "Catch narrowly, keep the cause, never hide errors",
    lang: "python",
    code: `try:
    data = json.loads(raw)
except json.JSONDecodeError as e:          # narrow: one known failure
    raise InvalidReply("model sent bad JSON") from e   # keep the cause
else:
    save(data)                             # only if parsing worked
finally:
    timer.stop()                           # always

except Exception:      # ok at a top level, with logging
except:                # never: also catches Ctrl+C and SystemExit
finally: return x      # never: a return here swallows the error`,
    highlight: [[1, 8], [10, 10], [11, 12]],
    beats: B(
      "Catch the narrowest exception you can handle: here, a JSON decode error, and nothing else. When you turn it into your own error, use raise from, so the original cause stays in the traceback.",
      "Catching Exception is acceptable at a top-level boundary, like a request handler or a worker loop, as long as you log it.",
      { say: "Two traps to name. A bare except also catches keyboard interrupt and system exit, so never use it. And a return inside finally silently swallows any exception in flight. Exceptions in Python are cheap when nothing is raised, so try is not a performance concern.", tone: "key" },
    ),
  },

  // ---- Q44 (py41)
  q(44, 2, "How do you create custom exceptions, and what are EAFP and LBYL?", "an exception hierarchy, and two styles of checking", "Question forty four, asked twice. How do you create custom exceptions, and what are EAFP and LBYL?", "How to design your own exceptions, and the two styles, with the reason Python prefers one."),
  {
    kind: "code",
    title: "Your own exceptions: a small hierarchy",
    lang: "python",
    code: `class AppError(Exception):
    """Base for everything this app raises."""

class NotFound(AppError):
    def __init__(self, kind, key):
        super().__init__(f"{kind} {key!r} not found")
        self.kind, self.key = kind, key

class RateLimited(AppError):
    def __init__(self, retry_after: float):
        super().__init__(f"retry after {retry_after}s")
        self.retry_after = retry_after`,
    highlight: [[1, 2], [4, 12]],
    beats: B(
      "Custom exceptions are just classes that inherit from Exception, never from BaseException. Give the app one base class, so callers can catch everything from your code with one except.",
      { say: "Then specific ones underneath, carrying the data a handler needs, like the retry after time. Callers catch the precise one they can handle, and a web layer can map each class to a status code.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "Look before you leap, or ask forgiveness",
    cols: [
      { title: "LBYL", icon: "👀", tone: "cyan", items: ["if key in d: value = d[key]", "Check first, then act", "Can race: the state may change between check and act"] },
      { title: "EAFP", icon: "🙏", tone: "green", items: ["try: value = d[key]  except KeyError: …", "Act, and handle the failure", "Pythonic; no race; one lookup"] },
    ],
    beats: B(
      "LBYL, look before you leap: check first, then act. If the key is in the dict, read it. The problem is a race: between the check and the act, another thread or process can change things, like a file being deleted.",
      { say: "EAFP, easier to ask forgiveness than permission: just do it, and handle the exception. It's the Pythonic style: no race, and only one lookup. Use LBYL when failure is common and cheap to check, and EAFP when failure is rare.", tone: "key" },
    ),
  },

  // ---- Q45 (py42)
  q(45, 2, "What are context managers, and how do you write one?", "with, __enter__ and __exit__, and @contextmanager", "Question forty five, asked twice. What are context managers, and how do you write one?", "What with guarantees, the two methods behind it, and the shortcut with a generator."),
  {
    kind: "seq",
    title: "with: set up, run the body, always clean up",
    actors: [
      { id: "w", name: "with open(p) as f:", icon: "🚪" },
      { id: "m", name: "the context manager", icon: "🧹", tone: "amber" },
      { id: "b", name: "the body", icon: "📝", tone: "green" },
    ],
    msgs: [
      { from: "w", to: "m", label: "__enter__(): set up, return f", step: 0 },
      { from: "w", to: "b", label: "run the body", step: 1, tone: "green" },
      { from: "w", to: "m", label: "__exit__(exc_type, exc, tb): always", step: 2, tone: "amber" },
    ],
    note: { step: 3, text: "__exit__ runs on success, on error, and on return; returning True from it swallows the error (rarely what you want)", tone: "amber" },
    beats: B(
      "A context manager is an object you use with with. On entry, Python calls its dunder enter, which sets things up and returns the value bound by as. Here, the open file.",
      "Then the body runs.",
      "And when the body ends, however it ends, Python calls dunder exit, with the exception details if there was one, or three Nones if not.",
      { say: "So it guarantees cleanup: the file is closed, the lock released, the transaction rolled back, even if the body raised. It's a try finally that you can reuse. And if exit returns true, the exception is swallowed, which you rarely want.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "The shortcut: @contextmanager",
    lang: "python",
    code: `from contextlib import contextmanager

@contextmanager
def timer(label):
    start = time.perf_counter()        # __enter__
    try:
        yield                          # the body runs here
    finally:
        print(label, time.perf_counter() - start)   # __exit__

with timer("retrieval"):
    docs = search(question)

# async version: @asynccontextmanager, used with async with`,
    highlight: [[3, 5], [6, 7], [8, 9], [11, 14]],
    beats: B(
      "Writing a class with enter and exit is fine, but the shortcut is at contextmanager, from contextlib. You write a generator.",
      "Everything before the yield is the enter part. The yield is where the with body runs.",
      "Everything after it, in a finally, is the exit part. The finally is essential, or an error in the body skips your cleanup.",
      { say: "And it's used like any other. The async version is at async context manager, used with async with. That's exactly how FastAPI's lifespan and its yield dependencies work, which you'll see in the FastAPI lecture.", tone: "key" },
    ),
  },
  check({
    topic: "finally",
    q: "A function has try: return 1 and finally: print('done'). Does 'done' print?",
    say: "A function has try, return one, and finally, print done. Does done print?",
    a: "Yes. finally runs even when the try block returns; the 1 is returned after it.",
    aSay: "Yes. Finally runs even when the try block returns. Python runs the finally, and then hands back the one.",
  }),
  check({
    topic: "context managers",
    q: "In a @contextmanager function, why must the code after yield sit in a finally?",
    say: "In an at contextmanager function, why must the code after the yield sit in a finally?",
    a: "If the with body raises, the exception is thrown in at the yield; without finally, the cleanup after it never runs.",
    aSay: "Because if the with body raises, the exception is thrown into the generator at the yield. Without a finally, everything after the yield is skipped, so the cleanup never runs.",
  }),
];
