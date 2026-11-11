import type { Scene } from "../../lib/types.ts";
import { asked, B, check, custom, sec } from "./h.ts";

// Part 1: how the lecture works, the app we keep breaking, names and objects
// (mutability, copies, is vs ==), and the built-in containers.
export const p1: Scene[] = [
  {
    kind: "title",
    eyebrow: "Python · interview lecture",
    title: "Python for GenAI interviews",
    subtitle: "The questions that really get asked, learnt by fixing the bugs real LLM apps have",
    beats: B(
      "Python for GenAI interviews. Not a tour of the language. We'll go through the Python questions that interviewers for AI and backend roles actually ask, and we'll learn each one the way it sticks: by watching a real bug happen, and then fixing it.",
    ),
  },
  {
    kind: "bullets",
    title: "How every topic goes",
    firstItemStep: 1,
    items: [
      { icon: "🐞", text: "A bug that really happens in LLM apps", sub: "you see it break before you hear the theory" },
      { icon: "🔬", text: "What Python is actually doing", sub: "a picture first, then the code, then the word for it" },
      { icon: "🎤", text: "The interview question, answered out loud", sub: "a model answer you can say in thirty seconds" },
      { icon: "✋", text: "A check: pause and answer before I do", sub: "the pause is the part that makes it stick" },
    ],
    beats: B(
      "Every topic follows the same four steps, so you always know where you are.",
      "First, a bug. A real one, the kind that ships in chatbots and retrieval pipelines every week.",
      "Then what Python is really doing underneath. A picture first, then the code.",
      "Then the interview question, and an answer you can actually say out loud.",
      { say: "And then a check. When the timer ring appears, pause the lecture if you need to, and answer out loud before I do. That pause is what moves this from your screen into your head.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "AskDocs: the app we'll keep breaking",
    lead: "A GenAI assistant that answers questions from a company's documents",
    firstItemStep: 1,
    items: [
      { icon: "💬", text: "A chat function that calls an LLM", sub: "with the conversation history" },
      { icon: "📚", text: "Two million document chunks to embed", sub: "far too many to hold in memory at once" },
      { icon: "🔁", text: "A flaky model API to call a thousand times", sub: "rate limits, timeouts, retries" },
      { icon: "🧾", text: "The model's JSON answer to trust", sub: "or not trust" },
    ],
    beats: B(
      "One app runs through the whole lecture. Call it AskDocs: an assistant that answers questions from a company's documents.",
      "It has a chat function that sends the conversation to an LLM.",
      "It has two million document chunks to turn into embeddings, which is far more than you want in memory at once.",
      "It calls a model API that is flaky, and it calls it a thousand times.",
      "And it gets JSON back from the model, which it has to decide whether to trust. Every Python topic today shows up as a problem in this app.",
    ),
  },
  {
    kind: "numbers",
    title: "What interviews ask about Python most",
    items: [
      { value: "17", label: "Decorators", sub: "write one, explain it" },
      { value: "16", label: "Generators and yield" },
      { value: "13", label: "Threads vs processes vs asyncio" },
      { value: "11", label: "Comprehensions" },
      { value: "10", label: "Memory and garbage collection" },
    ],
    footer: "Interview write-ups that asked it, out of 456 that mention Python (2024–2026)",
    beats: B(
      "Before we start, where the questions come from. These are counts from four hundred and fifty six real interview write-ups that mention Python.",
      "Decorators come first. Seventeen write-ups asked them.",
      "Generators and yield, sixteen.",
      "Threads versus processes versus asyncio, thirteen.",
      "Comprehensions, eleven.",
      "Memory and garbage collection, ten.",
      { say: "So those five get the most time today. Then we'll add what GenAI interviews pile on top: calling a model concurrently, retrying it safely, and validating what it returns.", tone: "key" },
    ),
  },

  // ------------------------------------------------------------ 1
  sec("1", "Names point to objects", "Topic one. Names point to objects. It sounds basic, but it explains half the Python gotchas interviewers love, starting with a chatbot that leaks one user's question into another user's chat."),
  {
    kind: "code",
    title: "The bug: user B's chat contains user A's question",
    lang: "python",
    code: `def ask(question, history=[]):
    history.append({"role": "user", "content": question})
    return call_llm(history)

ask("What is our refund policy?")     # user A
ask("How do I reset my password?")    # user B

# user B's request sends BOTH questions to the model`,
    highlight: [null, [1, 1], [2, 3], [5, 6], [8, 8]],
    beats: B(
      "Here's the bug. A small function that asks the model a question, with the conversation history as an optional argument.",
      "The history defaults to an empty list. That looks harmless. If you don't pass a history, you start fresh. Right?",
      "The function appends the new question to the history, and sends the history to the model.",
      "User A asks about the refund policy. Then user B, a different person, asks how to reset a password.",
      { say: "And user B's request goes to the model with both questions in it. User A's question leaked into user B's chat. Let's see why.", tone: "key" },
    ),
  },
  custom(
    "pynames",
    {
      title: "What really happened",
      sub: "the default list is made once, when def runs",
      steps: [
        { tags: [{ name: "ask's default", to: "L" }], objs: [{ id: "L", text: "[ ]", sub: "made once, when the def line ran" }], note: "def runs once: the default is evaluated then, and stored on the function" },
        { tags: [{ name: "ask's default", to: "L" }, { name: "history (call 1)", to: "L", tone: "amber" }], objs: [{ id: "L", text: "[ A's question ]", sub: "the same list object" }] },
        {
          tags: [{ name: "ask's default", to: "L" }, { name: "history (call 2)", to: "L", tone: "pink" }],
          objs: [{ id: "L", text: "[ A's question, B's question ]", tone: "red", sub: "still the same list object" }],
          note: "Every call that doesn't pass a history shares one list",
        },
      ],
    },
    B(
      "Here's the picture. On the left, names. On the right, objects in memory. When Python runs the def line, once, it evaluates the default, makes one empty list, and stores it on the function.",
      "First call. The name history points at that list, and the function appends A's question to it. It changes the list in place.",
      { say: "Second call. History points at the same list again, which still holds A's question. Python never made a new one. Every call that doesn't pass its own history shares this single list.", tone: "key" },
    ),
  ),
  {
    kind: "trap",
    myth: "A default argument is created fresh on every call.",
    truth: "It's evaluated once, when def runs, and stored on the function object.",
    why: "So a mutable default, a list or a dict, is shared by every call that doesn't pass its own.",
    beats: B(
      "So here's the belief most people carry in.",
      { say: "The truth: a default argument is evaluated once, when the def line runs, and then stored on the function object.", tone: "key" },
      "So if that default is mutable, a list, a dict, a set, it's shared by every call that leaves it out. In a server handling many users, that's a privacy bug.",
    ),
  },
  {
    kind: "code",
    title: "The fix: None as a sentinel",
    lang: "python",
    code: `def ask(question, history=None):
    if history is None:
        history = []          # a NEW list on every call
    history.append({"role": "user", "content": question})
    return call_llm(history)`,
    highlight: [[1, 1], [2, 3]],
    beats: B(
      "The fix is a pattern you'll write for the rest of your career. The default becomes None, which is immutable and safe to share.",
      { say: "And inside the function, if history is None, you make a new list. That line runs on every call, so every call gets its own list.", tone: "key", term: { word: "Sentinel", meaning: "a placeholder value (None) meaning 'not given'" } },
    ),
  },
  {
    kind: "compare",
    title: "Mutable vs immutable",
    cols: [
      { title: "Immutable", icon: "🧊", tone: "cyan", items: ["int, float, bool", "str", "tuple, frozenset", "bytes, None"] },
      { title: "Mutable", icon: "🔧", tone: "amber", items: ["list", "dict", "set, bytearray", "most objects you define"] },
    ],
    footer: "Immutable: a 'change' builds a new object. Mutable: changed in place, and every name pointing at it sees the change.",
    beats: B(
      "That bug is one case of the most asked basic question: mutable versus immutable. On the immutable side: numbers, strings, tuples, frozen sets, bytes, and None.",
      "On the mutable side: lists, dicts, sets, and most objects you define yourself.",
      { say: "Here's what it actually means. With an immutable object, anything that looks like a change builds a new object, and the name moves to it. With a mutable object, the change happens in place, and every name pointing at that object sees it.", tone: "key" },
    ),
  },
  custom(
    "pynames",
    {
      title: "Aliasing, shallow copy, deep copy",
      sub: "a base prompt that every request starts from",
      steps: [
        { tags: [{ name: "base", to: "L" }], objs: [{ id: "L", text: "[ system_msg ]", sub: "a list holding a dict" }, { id: "D", text: '{"role": "system", "content": "Be brief"}' }] },
        {
          tags: [{ name: "base", to: "L" }, { name: "msgs = base", to: "L", tone: "red" }],
          objs: [{ id: "L", text: "[ system_msg ]", tone: "red", sub: "ONE list, two names: append to msgs and base changes too" }, { id: "D", text: '{"role": "system", "content": "Be brief"}' }],
          note: "Assignment never copies. It's a second name for the same object.",
        },
        {
          tags: [{ name: "base", to: "L" }, { name: "msgs = base.copy()", to: "L2", tone: "amber" }],
          objs: [{ id: "L", text: "[ system_msg ]" }, { id: "L2", text: "[ system_msg ]", tone: "amber", sub: "new list... but the dict inside is shared" }, { id: "D", text: '{"role": "system", "content": "Be brief"}', tone: "amber" }],
          note: "Shallow copy: a new outer container, the same objects inside",
        },
        {
          tags: [{ name: "base", to: "L" }, { name: "msgs = deepcopy(base)", to: "L3", tone: "green" }],
          objs: [{ id: "L", text: "[ system_msg ]" }, { id: "L3", text: "[ system_msg' ]", tone: "green", sub: "new list AND a new dict inside" }, { id: "D", text: "two independent dicts now" }],
          note: "Deep copy: copies all the way down. Safe, but slower.",
        },
      ],
    },
    B(
      "Now the second most common version of this bug. AskDocs keeps a base prompt: a list holding one dict, the system message. Every request starts from it.",
      "First attempt: messages equals base. That doesn't copy anything. It's a second name for the same list. Append the user's question to messages, and the base prompt now contains it too, for every future request.",
      { say: "Second attempt: base dot copy. That's a shallow copy. You get a new list, but the dict inside is still the same dict. Change the system message's content in your copy, and you've changed the base.", tone: "key", term: { word: "Shallow copy", meaning: "a new container holding the same inner objects" } },
      "Third attempt: deep copy, from the copy module. It copies all the way down: a new list and a new dict inside. Now the two are independent. It's safe, but slower, so you use it when you'll change the nested parts.",
    ),
  ),
  {
    kind: "trap",
    myth: "'is' and '==' are two ways to write the same check.",
    truth: "== compares values (it calls __eq__). 'is' checks identity: are these the very same object?",
    why: "Use 'is' only for singletons like None. Small ints and short strings may be cached, so 'is' sometimes works by accident.",
    beats: B(
      "One more question from this family, asked a lot because it's short. Is versus double equals.",
      { say: "Double equals compares values. It calls the object's equality method. The word is checks identity: are these two names pointing at the very same object?", tone: "key" },
      "So you use is only for singletons, mostly None. And beware: Python caches small integers and some short strings, so is can appear to work in a quick test and then fail in production with bigger values.",
    ),
  },
  check({
    topic: "copies",
    q: "msgs = base.copy(), then msgs[0][\"content\"] = \"Be detailed\". What happens to base?",
    say: "Messages equals base dot copy. Then you change the content of the first message in messages to: be detailed. What happens to base?",
    options: ["Nothing: copy() made it independent", "base's system message changes too", "TypeError: lists can't be copied", "base becomes empty"],
    oSay: ["nothing, copy made it independent", "base's system message changes too", "a type error, lists can't be copied", "base becomes empty"],
    answer: 1,
    a: "base changes too. copy() is shallow: a new list, but msgs[0] is the same dict object base[0] points at.",
    aSay: "B. Base changes too. Copy is shallow. You got a new list, but the first element of both lists is the same dict object, so changing that dict shows up through both names. To change nested things safely, use deep copy.",
  }),
  {
    kind: "sayit",
    q: "What's the difference between mutable and immutable types, and why does it matter?",
    lines: [
      "Names are references to objects; assignment never copies.",
      "Immutable objects (int, str, tuple) can't change: a 'change' builds a new object.",
      "Mutable ones (list, dict, set) change in place, visible through every name.",
      "It matters for default arguments, shared state between requests, and copies.",
      "Only hashable (immutable) values can be dict keys or set members.",
    ],
    beats: B(
      { say: "So, the interview question. What's the difference between mutable and immutable types, and why does it matter? Here's how I'd say it.", tone: "ask" },
      "In Python, names are references to objects, and assignment never copies.",
      "Immutable objects, like ints, strings and tuples, can't change. Anything that looks like a change builds a new object.",
      "Mutable objects, like lists, dicts and sets, change in place, and the change is visible through every name that points at them.",
      "It matters for default arguments, for state shared between requests in a server, and for copying.",
      { say: "And only hashable values, which in practice means immutable ones, can be dict keys or set members. Which is our next topic.", tone: "key" },
    ),
  },

  // ------------------------------------------------------------ 2
  sec("2", "The containers and comprehensions", "Topic two. Lists, tuples, dicts and sets, and the comprehensions that build them. Eleven write-ups asked about comprehensions alone."),
  {
    kind: "compare",
    title: "Four containers, four jobs",
    cols: [
      { title: "list", icon: "📋", tone: "blue", items: ["ordered, mutable", "append O(1)", "x in list: O(n)", "the retrieved chunks, in rank order"] },
      { title: "tuple", icon: "📌", tone: "cyan", items: ["ordered, immutable", "hashable if its items are", "a fixed record", "(doc_id, chunk_no) as a key"] },
      { title: "dict", icon: "🗂️", tone: "amber", items: ["key → value hash table", "lookup O(1) on average", "keeps insertion order (3.7+)", "a cache: prompt → answer"] },
      { title: "set", icon: "🎯", tone: "green", items: ["unique, unordered", "x in set: O(1)", "union, intersection", "chunk ids already sent"] },
    ],
    footer: "Membership tests in a loop? A set, not a list: O(1) instead of O(n) each time.",
    beats: B(
      "Four containers, and each has its job. A list: ordered and mutable. Appending is constant time, but checking whether something is in a list scans it, so that's linear. In AskDocs, the retrieved chunks in rank order are a list.",
      "A tuple: ordered and immutable. Because it can't change, it's hashable if its items are. It's a fixed record, like a document id and chunk number pair, used as a key.",
      "A dict: a hash table from keys to values. Lookup is constant time on average, and since Python three point seven it keeps insertion order. A cache from prompt to answer is a dict.",
      "A set: unique items, no order, constant-time membership. The chunk ids you've already sent to the model are a set.",
      { say: "The classic performance bug: checking membership in a list inside a loop. That's n times n. Switch the list to a set and each check is constant time.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "How a dict finds a key in O(1)",
    firstItemStep: 1,
    items: [
      { icon: "#️⃣", text: "hash(key) → a number → a slot in an array", sub: "jump straight to the slot, no scanning" },
      { icon: "⚖️", text: "Equal keys must have equal hashes", sub: "if a == b, then hash(a) == hash(b)" },
      { icon: "🚫", text: "So a key's hash must never change", sub: "that's why lists and dicts can't be keys, but tuples can" },
      { icon: "📈", text: "Collisions probe for another slot; the table grows at ~2/3 full", sub: "O(1) on average, O(n) in a pathological worst case" },
    ],
    beats: B(
      "One level deeper, because dict internals come up. How does a dict find a key without scanning?",
      "It hashes the key into a number, turns that into a slot in an array, and jumps straight there.",
      "The rule that makes it work: equal keys must have equal hashes. Otherwise you'd look in the wrong slot.",
      { say: "And so a key's hash must never change while it's in the dict. That's the real reason a list can't be a key, but a tuple can.", tone: "key" },
      "When two keys land in the same slot, Python probes for another one, and it grows the table when it's about two thirds full. So lookups are constant time on average.",
    ),
  },
  check({
    topic: "hashing",
    q: "You want to cache answers by the pair (user_id, question). Why can you use a tuple as the key, but not a list?",
    say: "You want to cache answers by the pair of user id and question. Why can you use a tuple as the dict key, but not a list?",
    a: "A dict finds keys by their hash, so a key's hash must never change. A tuple of hashable values is immutable, so its hash is stable; a list can change, so Python refuses to hash it.",
    aSay: "Because a dict finds a key by its hash, and that hash must never change while the key is stored. A tuple of hashable values is immutable, so its hash is stable. A list can be changed in place, which would change its hash and lose the entry, so Python refuses to hash lists at all.",
  }),
  {
    kind: "code",
    title: "Comprehensions: one loop, one new collection",
    lang: "python",
    code: `chunks = retrieve(question)          # list of dicts with "text" and "score"

# list comprehension: transform + filter
good = [c["text"] for c in chunks if c["score"] > 0.75]

# dict comprehension
scores = {c["id"]: c["score"] for c in chunks}

# set comprehension
sources = {c["doc"] for c in chunks}

# generator expression: no list built at all
total_tokens = sum(count_tokens(c["text"]) for c in chunks)`,
    highlight: [[1, 1], [3, 4], [6, 7], [9, 10], [12, 13]],
    beats: B(
      "Now comprehensions. Retrieval gives AskDocs a list of chunks, each with text and a score.",
      "A list comprehension transforms and filters in one expression: the text of every chunk whose score is above zero point seven five. Read it left to right as: give me this, for each chunk, if this condition holds.",
      "The same shape with curly braces and a colon builds a dict: chunk id to score.",
      "Curly braces without the colon build a set: the unique documents the chunks came from.",
      { say: "And with round brackets you get a generator expression, which builds no collection at all. It hands values to sum one at a time. Keep that one in mind; it's the bridge to generators in topic five.", tone: "key" },
    ),
  },
  {
    kind: "trap",
    myth: "A comprehension is always the better way to write a loop.",
    truth: "Use one to build a new collection from one loop. For side effects or deep nesting, write the loop.",
    why: "A comprehension is a bit faster than append in a loop, but readability wins: three nested fors in one line is a code review comment.",
    beats: B(
      "And a trap interviewers like to check for.",
      { say: "Comprehensions are for building a new collection from one loop, maybe with a filter. If you're calling a function for its side effects, like sending emails, or nesting three loops, write a normal loop.", tone: "key" },
      "They are slightly faster than appending in a loop, because the loop runs in optimized bytecode. But readability wins. Three nested fors on one line will get flagged in a code review.",
    ),
  },
  check({
    topic: "containers",
    q: "Retrieval returned chunk ids with duplicates: [7, 3, 7, 9, 3]. Remove duplicates but keep the first-seen order. One line?",
    say: "Retrieval returned chunk ids with duplicates: seven, three, seven, nine, three. Remove the duplicates but keep the order they were first seen in. Can you do it in one line?",
    a: "list(dict.fromkeys(ids)) → [7, 3, 9]. Dict keys are unique and keep insertion order. (A set would drop the duplicates but lose the order.)",
    aSay: "List of dict dot from keys of the ids. That gives seven, three, nine. Dict keys are unique, and dicts keep insertion order, so the first time you see each id is the place it keeps. A set would remove duplicates too, but it doesn't keep any order.",
  }),
];
