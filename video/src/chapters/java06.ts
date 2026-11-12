import type { Chapter } from "../lib/types.ts";
import { makeCheck } from "./checks.ts";
import { ask, B, custom, sayit, sec } from "./core/h.ts";
import { qa } from "./web/h.ts";

// Java Part 6 (Core Stack JAVA-06): Strings, immutability, equals/hashCode
// and singletons, question by question from the topic's interview list.
const check = makeCheck();

export const java06: Chapter = {
  id: "java06",
  label: "Java 6",
  title: "Strings, immutability, equals/hashCode and singletons",
  theme: "py",
  voice: "en-US-AndrewMultilingualNeural",
  pace: { normal: "-3%", ask: "-5%", aside: "+4%", excite: "+4%" },
  scenes: [
    {
      kind: "title",
      eyebrow: "Java · Part 6",
      title: "Strings, immutability, equals/hashCode and singletons",
      subtitle: "cheap to own, embarrassing to miss",
      beats: B("Java, part six. Strings, immutability, equals and hash code, and singletons. These come up in nearly every core Java round, usually as quick questions, and often as live code. They're cheap to own, and embarrassing to miss."),
    },
    {
      kind: "bullets",
      title: "What interviews ask on this topic",
      firstItemStep: 1,
      items: [
        { icon: "🧵", text: "Why are Strings immutable? What is the String pool?", sub: "and String vs StringBuilder vs StringBuffer" },
        { icon: "🧊", text: "How do you write an immutable class? Shallow vs deep copy?" },
        { icon: "⚖️", text: "The equals / hashCode contract: what breaks if you override only one?" },
        { icon: "📦", text: "Autoboxing and the Integer cache" },
        { icon: "1️⃣", text: "A thread-safe, lazy singleton: why volatile? How is it broken?" },
      ],
      beats: B(
        "These are the questions real write-ups name, in the order we'll take them.",
        "Why strings are immutable, what the string pool is, and when to use StringBuilder.",
        "How to write an immutable class, and shallow versus deep copies.",
        "The equals and hash code contract, which connects straight back to how HashMap works.",
        "Autoboxing, and a cache that makes double equals lie.",
        { say: "And singletons: making one thread-safe and lazy, why volatile is needed, and three ways people break it. Each one ends with an answer you can say out loud.", tone: "key" },
      ),
    },

    // ================================================================ 1
    sec("1", "Strings and the String pool", "Part one. Strings, and the string pool. Start with what actually happens in memory."),
    custom(
      "pynames",
      {
        title: "String literals share one object in the pool",
        sub: "String a = \"hello\"; String b = \"hello\"; String c = new String(\"hello\");",
        steps: [
          { tags: [{ name: "a = \"hello\"", to: "P" }], objs: [{ id: "P", text: "\"hello\"", sub: "in the String pool (on the heap)" }] },
          { tags: [{ name: "a = \"hello\"", to: "P" }, { name: "b = \"hello\"", to: "P", tone: "amber" }], objs: [{ id: "P", text: "\"hello\"", sub: "one object, reused" }], note: "a == b is true: the literal is looked up in the pool, not created again" },
          { tags: [{ name: "a = \"hello\"", to: "P" }, { name: "b = \"hello\"", to: "P", tone: "amber" }, { name: "c = new String(\"hello\")", to: "N", tone: "red" }], objs: [{ id: "P", text: "\"hello\"", sub: "pool" }, { id: "N", text: "\"hello\"", sub: "a new, separate object" }], note: "a == c is false, a.equals(c) is true: == compares references" },
          { tags: [{ name: "a = \"hello\"", to: "P" }, { name: "b = \"hello\"", to: "P", tone: "amber" }, { name: "c.intern()", to: "P", tone: "green" }], objs: [{ id: "P", text: "\"hello\"", sub: "pool" }, { id: "N", text: "\"hello\"", sub: "unused now" }], note: "intern() returns the pooled copy" },
        ],
      },
      B(
        "String a equals hello. A string literal goes into the string pool, a table of unique strings kept on the heap.",
        "B equals hello, the same literal. The JVM finds it in the pool and reuses the same object. So a double-equals b is true.",
        "C equals new String hello. New always creates a fresh object, outside the pool. So a double-equals c is false, while a dot equals c is true. Double equals compares references. Equals compares contents. Always compare strings with equals.",
        { say: "And c dot intern returns the pooled copy. Now, here's the key point: sharing one object between a, b, and every other hello in the program is only safe because nobody can change it. That's why strings are immutable.", tone: "key" },
      ),
    ),
    ask("Why are Strings immutable in Java?", "four reasons, each a real benefit", "Why are strings immutable in Java?", "Give four reasons, not one: the pool, security, hashing, and thread safety."),
    {
      kind: "bullets",
      title: "Four reasons Strings are immutable",
      items: [
        { icon: "🏊", text: "The pool: one object can be shared safely", sub: "thousands of references to \"OK\" cost one object" },
        { icon: "🔒", text: "Security: a checked value can't change after the check", sub: "file paths, URLs, class names, DB credentials" },
        { icon: "#️⃣", text: "Hashing: hashCode is cached, and a key can't drift", sub: "perfect HashMap keys" },
        { icon: "🧵", text: "Thread safety for free", sub: "shared across threads with no locks" },
      ],
      beats: B(
        "One. The pool. One object can be shared by every part of the program, because nobody can change it under anyone else.",
        "Two. Security. A string is checked, say a file path or a URL, and then used. If it could change between the check and the use, the check would mean nothing.",
        "Three. Hashing. A string's hash code is computed once and cached inside it, and a string key can never change after it's put into a HashMap. That's why strings are the perfect map key.",
        { say: "Four. Thread safety for free. Immutable objects can be shared across threads with no synchronisation at all. Pool, security, hashing, threads.", tone: "key" },
      ),
    },
    qa(1, "String vs StringBuilder vs StringBuffer: when do you use each?", [
      "String: immutable; every “change” makes a new object",
      "StringBuilder: mutable, fast, not synchronised: building strings in one thread (almost always)",
      "StringBuffer: like StringBuilder but synchronised: legacy; rarely needed",
      "+= in a loop copies the whole string each time (O(n²)); a single a + b + c is fine (the compiler optimises it)",
    ], { ask: "So: String, StringBuilder, or StringBuffer. When do you use each?", code: `String s = "";\nfor (String w : words)\n    s += w;              // a new String each time\n\nStringBuilder sb = new StringBuilder();\nfor (String w : words)\n    sb.append(w);        // one buffer, grows\nString result = sb.toString();` }),
    sayit("Why are Strings immutable? What is the String pool?", "Out loud, it goes like this.", [
      ["Literals are stored once in the String pool and shared", "String literals are stored once in the string pool, and every use of the same literal shares that one object."],
      ["Sharing is only safe because Strings can't change", "That sharing is only safe because strings can't change."],
      ["Immutability also gives security, cached hashCode, safe map keys, thread safety", "Immutability also gives security, since a checked value can't change after the check, a cached hash code, safe map keys, and thread safety for free."],
      ["Compare with equals, not ==; build strings with StringBuilder", "So compare strings with equals, never double equals, and build strings in loops with StringBuilder."],
    ]),

    // ================================================================ 2
    sec("2", "Immutable classes and copies", "Part two. Writing your own immutable class, and the difference between shallow and deep copies."),
    {
      kind: "code",
      title: "An immutable class: five rules",
      lang: "java",
      code: `public final class Order {                       // 1. can't be subclassed
    private final String id;                       // 2. private final fields
    private final List<String> items;

    public Order(String id, List<String> items) {
        this.id = id;
        this.items = List.copyOf(items);           // 3. defensive copy in
    }

    public String id() { return id; }              // 4. no setters
    public List<String> items() { return items; } // 5. never leak a mutable field
}                                                  //    (List.copyOf is unmodifiable)`,
      highlight: [[1, 1], [2, 3], [5, 8], [10, 11]],
      beats: B(
        "Five rules. One: make the class final, so a subclass can't add mutable behaviour.",
        "Two: all fields private and final.",
        "Three: copy mutable inputs in the constructor. If you stored the caller's list, the caller could still change it afterwards.",
        { say: "Four: no setters. And five: never hand out a mutable field. Return an unmodifiable copy. Here, list dot copy of gives an unmodifiable list, so both rules three and five are covered.", tone: "key" },
      ),
    },
    {
      kind: "trap",
      myth: "A record is immutable, so everything inside it is safe.",
      truth: "A record is shallowly immutable: its fields can't be reassigned, but a List inside it can still change.",
      why: "record Order(String id, List<String> items) {} — copy in the compact constructor: items = List.copyOf(items);",
      beats: B(
        "A common follow-up. A record is immutable, so everything inside it is safe, right?",
        "No. A record is shallowly immutable. Its fields can't be reassigned, but if a field is a list, the list itself can still be changed by whoever else holds it.",
        "The fix is the same defensive copy, in the record's compact constructor: items equals list dot copy of items.",
      ),
    },
    custom(
      "pynames",
      {
        title: "Shallow vs deep copy",
        sub: "Order copy of an order holding a List",
        steps: [
          { tags: [{ name: "original", to: "O" }, { name: "shallow", to: "S", tone: "amber" }], objs: [{ id: "O", text: "Order" }, { id: "S", text: "Order (copy)", tone: "amber" }, { id: "L", text: "List [\"pen\"]", col: 1, sub: "shared" }], links: [{ from: "O", to: "L" }, { from: "S", to: "L", tone: "amber" }], note: "shallow (the default clone()): a new outer object, the same inner objects" },
          { tags: [{ name: "original", to: "O" }, { name: "deep", to: "D", tone: "green" }], objs: [{ id: "O", text: "Order" }, { id: "D", text: "Order (copy)", tone: "green" }, { id: "L", text: "List [\"pen\"]", col: 1 }, { id: "L2", text: "List [\"pen\"]  (new)", col: 1, tone: "green" }], links: [{ from: "O", to: "L" }, { from: "D", to: "L2", tone: "green" }], note: "deep: mutable inner objects copied too; prefer a copy constructor over clone()" },
        ],
      },
      B(
        "Shallow versus deep copy. A shallow copy, which is what Object dot clone does by default, creates a new outer object, but its fields point at the same inner objects. Add an item through the copy's list, and the original sees it.",
        { say: "A deep copy also copies the mutable objects inside. In practice, prefer a copy constructor or a static factory over clone, which is awkward and easy to get wrong. And with immutable inner objects, a shallow copy is all you ever need.", tone: "key" },
      ),
    ),

    // ================================================================ 3
    sec("3", "The equals and hashCode contract", "Part three. The equals and hash code contract, which is really a question about how HashMap finds things."),
    {
      kind: "custom",
      name: "contract",
      beats: B(
        { say: "The split to remember: in a HashMap, hash code picks the bucket, and equals picks the entry inside it.", tone: "key" },
        { say: "Now a Point class that overrides equals, but not hash code. Two equal points get different default hash codes, so a lookup goes to a different bucket, and equals never even runs. Get returns null, and a HashSet happily holds duplicates.", term: { word: "hashCode contract", meaning: "equal objects must have equal hash codes" } },
        "The fix: build equals and hash code from the same fields. Or use a record, which writes both for you.",
      ),
    },
    {
      kind: "bullets",
      title: "The contract, precisely",
      items: [
        { icon: "1️⃣", text: "a.equals(b) → a.hashCode() == b.hashCode()", sub: "the rule that matters" },
        { icon: "2️⃣", text: "Equal hash codes do NOT imply equals", sub: "collisions are allowed (and handled)" },
        { icon: "3️⃣", text: "equals: reflexive, symmetric, transitive, consistent, x.equals(null) is false" },
        { icon: "4️⃣", text: "Override only hashCode: equal objects may land in one bucket, but still never match" },
      ],
      beats: B(
        "The contract, precisely. If two objects are equal, they must have the same hash code. That's the rule that matters.",
        "The reverse isn't required. Two different objects may share a hash code. That's a collision, and HashMap handles it by checking equals inside the bucket.",
        "Equals itself must be reflexive, symmetric, transitive and consistent, and never equal to null.",
        { say: "And the other half of the trick question: override only hash code, and equal objects land in the same bucket, but the default equals compares identity, so they still never match. You need both, built from the same fields.", tone: "key" },
      ),
    },
    {
      kind: "custom",
      name: "stranded",
      beats: B(
        "And why keys should be immutable. Put a point, one comma two, into a map as a key.",
        "Then change its x to five. The entry still sits in the bucket for one comma two, but the key now says five comma two.",
        { say: "Look it up with the same object, and Java searches the bucket for five comma two: empty. Look it up with a fresh one comma two, and equals fails. The entry is still there, but nobody can reach it. A memory leak.", tone: "excite" },
        { say: "So map keys must be immutable: strings, records, integers, enums. Which is part one's lesson again.", tone: "key" },
      ),
    },
    sayit("equals() and hashCode(): what's the contract, and what breaks if you override only one?", "Here's the answer.", [
      ["Equal objects must have equal hash codes; not the reverse", "Equal objects must have equal hash codes. Unequal objects may share one."],
      ["HashMap: hashCode picks the bucket, equals picks the entry", "HashMap uses hash code to pick the bucket, and equals to find the entry in it."],
      ["Only equals: lookups go to the wrong bucket, sets hold duplicates", "Override only equals, and equal objects land in different buckets, so lookups fail and sets hold duplicates."],
      ["Only hashCode: same bucket, but identity equals never matches", "Override only hash code, and they share a bucket, but the default identity equals still never matches."],
      ["Build both from the same immutable fields, or use a record", "So build both from the same immutable fields, or let a record generate them."],
    ]),

    // ================================================================ 4
    sec("4", "Autoboxing and the Integer cache", "Part four. Autoboxing, and the cache that makes double equals lie."),
    {
      kind: "code",
      title: "When == works by accident",
      lang: "java",
      code: `Integer a = 127, b = 127;
a == b;            // true:  -128..127 come from a cache

Integer c = 128, d = 128;
c == d;            // false: two different objects
c.equals(d);       // true

Integer missing = map.get("absent");   // null
int n = missing;   // NullPointerException: unboxing null

Long sum = 0L;
for (long i = 0; i < 1_000_000; i++)
    sum += i;      // a million Long objects created`,
      highlight: [[1, 2], [4, 6], [8, 9], [11, 13]],
      beats: B(
        "Autoboxing converts between int and Integer automatically, using Integer dot value of. And value of keeps a cache of Integer objects from minus one twenty eight to one twenty seven. So two boxed one twenty sevens are the same object, and double equals says true.",
        "One twenty eight is outside the cache, so you get two different objects, and double equals says false, while equals says true. The lesson: compare wrapper objects with equals, always.",
        "Unboxing null throws a null pointer exception. Get a missing key from a map of Integers, assign it to an int, and it blows up on a line that looks perfectly safe.",
        { say: "And boxing in a hot loop creates an object per iteration. A Long sum in a loop of a million makes a million objects. Use the primitive long.", tone: "key" },
      ),
    },

    // ================================================================ 5
    sec("5", "Singletons, safely", "Part five. Singletons. The live-coding favourite: write a thread-safe singleton, make it lazy, and explain why volatile is needed."),
    {
      kind: "code",
      title: "Double-checked locking, written correctly",
      lang: "java",
      code: `public final class Config {
    private static volatile Config instance;      // volatile is essential

    private Config() { }

    public static Config get() {
        Config c = instance;                       // 1st check, no lock
        if (c == null) {
            synchronized (Config.class) {
                c = instance;                      // 2nd check, with the lock
                if (c == null) {
                    instance = c = new Config();
                }
            }
        }
        return c;
    }
}`,
      highlight: [[4, 4], [7, 8], [9, 13], [2, 2]],
      beats: B(
        "A private constructor, so nobody else can create one.",
        "The first check happens without a lock. Once the instance exists, every call returns immediately, with no synchronisation cost.",
        "If it's null, take the lock, and check again, because another thread may have created it while we were waiting for the lock. That's why it's called double-checked.",
        { say: "And the field is volatile. Without it, this code is broken, and the reason is the question interviewers are really asking.", tone: "key" },
      ),
    },
    custom(
      "chipcols",
      {
        title: "Without volatile: another thread can see a half-built object",
        sub: "instance = new Config() is three steps, and they may be reordered",
        cols: [
          { title: "THREAD A", sub: "inside the lock", stack: false },
          { title: "SHARED FIELD", sub: "instance" },
          { title: "THREAD B", sub: "first check, no lock" },
        ],
        steps: [
          { cols: [["1. allocate memory", "2. run constructor", "3. assign to instance"], ["null"], []], note: "what the code says: allocate, construct, then publish" },
          { cols: [["1. allocate memory", "3. assign to instance", "2. run constructor (later)"], ["→ unfinished object"], []], note: "the JIT or CPU may publish the reference before the constructor finishes" },
          { cols: [["1. allocate memory", "3. assign to instance"], ["→ unfinished object"], ["instance != null", "return it", "uses empty fields!"]], note: "thread B skips the lock, sees non-null, and uses a half-constructed object" },
          { cols: [["1. allocate", "2. construct", "3. publish (volatile write)"], ["→ complete object"], ["volatile read: sees it complete"]], note: "volatile forbids that reordering: the write happens after construction, and readers see everything before it" },
        ],
      },
      B(
        "Here's why. Creating an object looks like one step, but it's three: allocate memory, run the constructor, and assign the reference to the field.",
        "Without volatile, the compiler or the CPU is allowed to reorder those, and publish the reference before the constructor has finished.",
        "Now thread B arrives, does the first check without a lock, sees that instance is not null, and returns it, a half-built object with empty fields. An intermittent, horrible bug.",
        { say: "Volatile forbids that reordering. The write to the volatile field happens after construction, and any thread that reads it sees the fully built object. That's the happens-before guarantee, and that's the answer.", tone: "key" },
      ),
    ),
    {
      kind: "compare",
      title: "Simpler singletons that are already thread-safe",
      cols: [
        { title: "Eager", tone: "blue", items: ["static final INSTANCE = new X()", "Class loading is thread-safe", "Not lazy"] },
        { title: "Holder idiom", tone: "green", items: ["static class Holder { static final X I = new X(); }", "Created on first get(): lazy", "No locks, no volatile"] },
        { title: "Enum", tone: "amber", items: ["enum Config { INSTANCE; }", "Safe against reflection and serialization", "Effective Java's recommendation"] },
      ],
      footer: "In Spring, beans are singletons per container by default: you rarely write one yourself",
      beats: B(
        "And mention the simpler options, because interviewers like hearing them. Eager: a static final field. Class loading is thread-safe, so this is safe, just not lazy.",
        "The holder idiom: a nested static class holds the instance. The JVM only loads it on the first call, so it's lazy, and still has no locks and no volatile.",
        "And an enum with a single value. It's thread-safe, and immune to reflection and serialization attacks. Effective Java recommends it.",
        { say: "And in a Spring application, beans are singletons by default, managed by the container, so you rarely hand-write one at all.", tone: "key" },
      ),
    },
    qa(2, "How can a Singleton be broken, and how do you stop it?", [
      "Reflection: setAccessible(true) calls the private constructor; throw if an instance already exists",
      "Serialization: deserializing creates a new object; add readResolve() returning the instance",
      "Cloning: if it's Cloneable, clone() makes a copy; don't implement Cloneable (or throw)",
      "Several class loaders each get their own; an enum singleton defends against the first three",
    ], { ask: "And the follow-up: how can a singleton be broken, and how do you stop it?" }),
    sayit("Write a thread-safe lazy Singleton. Why is volatile needed?", "The answer, out loud.", [
      ["Private constructor; double-checked locking: check, lock, check again", "Private constructor, and double-checked locking: check without a lock, then lock and check again before creating it."],
      ["The field must be volatile", "The field must be volatile."],
      ["new = allocate, construct, publish: without volatile the publish can be reordered before construction", "Because creating an object is allocate, construct, publish, and without volatile the publish can be reordered before the constructor finishes."],
      ["Another thread could then see a half-built object; volatile gives happens-before", "Another thread could then see a half-built object. Volatile forbids that, and guarantees readers see it complete."],
      ["Simpler: the holder idiom or an enum", "And I'd mention the simpler holder idiom, or an enum, which also resists reflection and serialization."],
    ]),
    check({
      topic: "Integer cache",
      q: "Integer x = 1000, y = 1000; System.out.println(x == y); What prints, and why?",
      say: "Integer x equals one thousand, Integer y equals one thousand. What does x double-equals y print, and why?",
      a: "false: values outside -128..127 aren't cached, so they're two different objects. Use x.equals(y).",
      aSay: "False. Only minus one twenty eight to one twenty seven are cached, so one thousand gives two different objects, and double equals compares references. Use equals.",
    }),
    check({
      topic: "equals/hashCode",
      q: "A HashSet<Point> contains duplicates of the same point. Point overrides equals. What's missing?",
      say: "A HashSet of points contains duplicates of the same point, and Point does override equals. What's missing?",
      a: "hashCode: equal points get different default hash codes, land in different buckets, and equals is never compared. Override hashCode from the same fields (or use a record).",
      aSay: "Hash code. Equal points get different default hash codes, so they land in different buckets, and equals never runs. Override hash code from the same fields, or use a record.",
    }),
    {
      kind: "drill",
      items: [
        { q: "\"a\" == new String(\"a\")?", a: "false: different objects" },
        { q: "StringBuilder or StringBuffer?", a: "StringBuilder (unsynchronised)" },
        { q: "Is a record deeply immutable?", a: "No: shallowly" },
        { q: "Equal hash codes mean equal objects?", a: "No: collisions exist" },
        { q: "Why volatile in DCL?", a: "Stops publishing a half-built object" },
        { q: "Most robust singleton?", a: "An enum" },
      ],
      beats: B(
        { say: "Rapid fire. The literal a, double-equals new String a?", hold: 3 },
        "False. Different objects.",
        { say: "StringBuilder or StringBuffer?", hold: 3 },
        "StringBuilder. It's unsynchronised and faster.",
        { say: "Is a record deeply immutable?", hold: 3 },
        "No. Shallowly.",
        { say: "Do equal hash codes mean equal objects?", hold: 3 },
        "No. Collisions exist.",
        { say: "Why volatile in double-checked locking?", hold: 3 },
        "It stops another thread from seeing a half-built object.",
        { say: "The most robust singleton?", hold: 3 },
        { say: "An enum. That's part six.", tone: "key" },
      ),
    },
  ],
};
