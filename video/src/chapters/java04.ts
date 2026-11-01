import type { Chapter } from "../lib/types.ts";

// Java Part 4 (src/Data/coreStackDocs/JAVA-04.md): where memory lives, how
// the JVM decides what is garbage, generations, collectors, and leaks.

export const java04: Chapter = {
  id: "java04",
  label: "Java 4",
  title: "JVM memory and garbage collection",
  voice: "en-US-AndrewMultilingualNeural",
  scenes: [
    {
      kind: "custom",
      name: "sawtooth",
      beats: [
        { say: "A service runs fine for three days. Its heap rises, drops at every garbage collection, rises again. But the low point keeps creeping up. Then: out of memory error, Java heap space." },
        { say: "Restart it, and it's fine for three more days. Then it dies again." },
        { say: "So where does memory go in Java? And who is supposed to free it?", tone: "ask" },
      ],
    },
    {
      kind: "title",
      eyebrow: "Java · Part 4",
      title: "JVM memory and garbage collection",
      subtitle: "stack and heap, GC roots, generations, collectors, leaks",
      beats: [{ say: "Java, part four. JVM memory, and garbage collection." }],
    },

    // ------------------------------------------------------------ 1
    { kind: "section", num: "1", title: "Stack and heap", beats: [{ say: "Start with where values live." }] },
    {
      kind: "custom",
      name: "frames",
      beats: [
        {
          say: "Every thread gets its own stack. Calling main pushes a frame, holding main's local variables. Here, demo: a reference to an object.",
          term: { word: "Stack", meaning: "per-thread frames of local variables" },
        },
        {
          say: "Main calls run, and a second frame goes on top. Count equals ten is stored right in the frame. But new Person creates the object on the heap, shared by every thread. P one holds its address. P two copies the address, so both point to one object.",
          term: { word: "Heap", meaning: "where every object lives, shared by all threads" },
        },
        { say: "String literals go to the String pool, inside the heap. S one and S two share one pooled string. New String always makes a fresh object, so s one equals equals s three is false." },
        { say: "When run returns, its frame is popped. Last in, first out. The variables are gone. But the Person object is still on the heap, with nothing pointing to it.", tone: "key" },
        { say: "And if recursion never stops, frames pile up until the stack runs out: a stack overflow error.", tone: "aside" },
      ],
    },

    // ------------------------------------------------------------ 2
    { kind: "section", num: "2", title: "What counts as garbage", beats: [{ say: "So when is an object garbage?" }] },
    {
      kind: "custom",
      name: "roots",
      beats: [
        { say: "A equals b. Now nothing points to object one. It looks like garbage. But that's not quite how Java decides." },
        {
          say: "The JVM starts from GC roots. Local variables in live stack frames, static fields, running threads. It follows every reference from there. Whatever it reaches is live.",
          term: { word: "GC roots", meaning: "where tracing starts: stack vars, statics, threads" },
        },
        { say: "Objects four and five point to each other, but no root reaches them. So both are garbage. Java doesn't count references. It traces from roots, so cycles get collected.", tone: "key" },
        { say: "And System dot gc is only a hint. The JVM decides when to collect.", tone: "aside" },
      ],
    },
    {
      kind: "custom",
      name: "refkinds",
      beats: [
        { say: "References also come in strengths. A normal, strong reference keeps an object alive, no matter what." },
        {
          say: "A soft reference lets the GC take the object, but only when memory runs low. Perfect for a cache.",
          term: { word: "Soft reference", meaning: "cleared only when memory runs low" },
        },
        {
          say: "A weak reference lets it go at the very next collection. That's how a weak hash map drops entries nobody uses.",
          term: { word: "Weak reference", meaning: "cleared at the next GC" },
        },
        { say: "And a phantom reference never returns the object. It only tells you it's gone, so you can clean up.", tone: "aside" },
      ],
    },

    // ------------------------------------------------------------ 3
    { kind: "section", num: "3", title: "Generations", beats: [{ say: "Now, how the heap is organised." }] },
    {
      kind: "custom",
      name: "eden",
      beats: [
        { say: "Most objects die young. A request creates thousands of little objects, and a few milliseconds later they're garbage. So the heap is split by age: a young generation, and an old one." },
        { say: "Every new object starts in Eden. Here are five: O one to O five." },
        {
          say: "Eden fills, and a minor GC runs. It pauses the app, finds O one, three and four still alive, and copies them into survivor space zero, with age one. Then it wipes Eden in one go. Dead objects cost nothing.",
          tone: "key",
          term: { word: "Minor GC", meaning: "collects the young generation by copying" },
        },
        { say: "Two new objects arrive. Next minor GC: O four and O six are dead. The survivors move to survivor space one, and their ages go up. The two survivor spaces swap every time." },
        {
          say: "With a threshold of three, O one and O three have now survived three collections. They're promoted to the old generation.",
          tone: "excite",
          term: { word: "Promotion", meaning: "moving long-lived objects to the old generation" },
        },
        { say: "The real default threshold is fifteen. And the old generation is collected less often, by a major GC, with longer pauses.", tone: "aside" },
      ],
    },
    {
      kind: "custom",
      name: "compact",
      beats: [
        { say: "How does a collector actually free memory? First, mark: everything reachable from the roots gets marked live." },
        { say: "Then sweep: everything unmarked is freed. But now free space is scattered in little holes. A big array might not fit anywhere." },
        {
          say: "So compact: slide the survivors together, leaving one free block.",
          term: { word: "Compaction", meaning: "sliding live objects together to remove holes" },
        },
        { say: "The young generation skips all that. It copies live objects out, and wipes the whole space.", tone: "aside" },
      ],
    },
    {
      kind: "custom",
      name: "meta",
      beats: [
        {
          say: "Class metadata lives outside the heap, in metaspace. Before Java eight, it lived in a fixed size area called perm gen, which filled up and crashed app servers. Metaspace grows as needed.",
          term: { word: "Metaspace", meaning: "native memory for class metadata, since Java 8" },
        },
        { say: "Static fields and the string pool are not there. They're on the heap.", tone: "aside" },
      ],
    },

    // ------------------------------------------------------------ 4
    { kind: "section", num: "4", title: "The collectors", beats: [{ say: "Next: which collector?" }] },
    {
      kind: "custom",
      name: "collectors",
      beats: [
        {
          say: "Every collector trades throughput against pauses. A stop the world pause freezes every application thread while the collector works.",
          term: { word: "Stop-the-world", meaning: "every app thread pauses during the GC" },
        },
        { say: "Serial uses one GC thread. One long pause. Fine for tiny heaps." },
        { say: "Parallel uses many GC threads. Shorter pauses, the best throughput. Great for batch jobs. It was the default up to Java eight." },
        {
          say: "G1, the default since Java nine, splits the heap into regions, and keeps each pause near a target of two hundred milliseconds.",
          term: { word: "G1", meaning: "region-based default collector with a pause target" },
        },
        { say: "And ZGC does almost all its work while your app keeps running. Pauses under about a millisecond, even on huge heaps." },
        { say: "So: default to G1. Parallel for batch. ZGC for strict latency. And CMS? Removed in Java fourteen.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "regions",
      beats: [
        { say: "Here's G1's heap. Equal regions, each one Eden, survivor, old, or humongous, for very large objects." },
        { say: "Each pause collects the regions with the most garbage first. That's the name: garbage first. Their live objects are copied into free regions, so it compacts as it goes.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 5
    { kind: "section", num: "5", title: "Leaks and out of memory", beats: [{ say: "Back to the service that dies every three days.", tone: "excite" }] },
    {
      kind: "custom",
      name: "leak",
      beats: [
        {
          say: "Login puts each session into a static map. Logout never removes it. A static field is a GC root.",
          term: { word: "Memory leak", meaning: "unneeded objects that are still reachable" },
        },
        { say: "So every session ever created stays reachable, and the GC can never free it. The low point after each collection keeps rising, until the heap is full." },
        { say: "To prove it, take a heap dump, automatically on out of memory, or live with j c m d. Open it in Eclipse MAT, and the leak suspect points straight at the map." },
        { say: "The fix: remove on logout, and bound the cache, with a size limit or an expiry.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "pod",
      beats: [
        { say: "One more trap, in Kubernetes. A pod with a one gigabyte limit, and no heap flags. The JVM takes just a quarter of it: two hundred fifty six megabytes. Out of memory, with most of the pod unused." },
        { say: "Set the heap to the full gigabyte instead, and the JVM still needs memory outside the heap: metaspace, thread stacks, the code cache. The pod goes over its limit, and the kernel kills it. O O M killed. Exit code one three seven.", tone: "excite" },
        { say: "So set max RAM percentage to around seventy five. The heap scales with the pod, and leaves room for the rest.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "recap",
      props: {
        items: [
          ["🧱", "Stack and heap", "frames per thread, objects shared"],
          ["🌱", "GC roots", "reachable = live"],
          ["🔁", "Minor GC", "copy survivors, age them"],
          ["⬆️", "Promotion", "old enough, move to old gen"],
          ["🗺️", "G1", "regions, pause target"],
          ["🚰", "Memory leak", "still reachable, never freed"],
        ],
      },
      beats: [
        { say: "Let's lock it in." },
        { say: "Stack frames hold locals, per thread. Every object lives on the shared heap." },
        { say: "Anything reachable from a GC root is live. Everything else is garbage." },
        { say: "A minor GC copies survivors between survivor spaces, and ages them." },
        { say: "Old enough, and they're promoted to the old generation." },
        { say: "G1 is the default: regions, and a pause target." },
        { say: "And a memory leak is something still reachable, that you no longer need.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "drawheap",
      beats: [
        { say: "Before the next part: from memory, draw Eden, the two survivor spaces, and the old generation." },
        { say: "Then walk five objects through three minor GCs, with a threshold of three, and write every age.", tone: "key", hold: 3 },
      ],
    },
    {
      kind: "title",
      eyebrow: "Java · Part 4",
      title: "That's JVM memory",
      subtitle: "next: records, sealed types and pattern matching",
      beats: [{ say: "That's JVM memory. See you in part five.", tone: "excite" }],
    },
  ],
};
