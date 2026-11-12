import type { Chapter } from "../lib/types.ts";
import { makeCheck } from "./checks.ts";
import { ask, B, sayit, sec } from "./core/h.ts";
import { old } from "./core/java04old.ts";
import { qa } from "./web/h.ts";

// Java Part 4 (src/Data/coreStackDocs/JAVA-04.md): JVM memory and garbage
// collection, question by question from the topic's interview list. Reuses
// the first lecture's diagrams (core/java04old.ts).
const check = makeCheck();

export const java04: Chapter = {
  id: "java04",
  label: "Java 4",
  title: "JVM memory and garbage collection",
  theme: "py",
  voice: "en-US-AndrewMultilingualNeural",
  pace: { normal: "-3%", ask: "-5%", aside: "+4%", excite: "+4%" },
  scenes: [
    old("sawtooth"),
    {
      kind: "title",
      eyebrow: "Java · Part 4",
      title: "JVM memory and garbage collection",
      subtitle: "the seven questions Java rounds ask once they get past collections",
      beats: B("Java, part four. JVM memory and garbage collection. Once a Java round gets past collections, it usually lands here. We'll take the seven questions real write-ups ask, one at a time, and end each with an answer you can say."),
    },
    {
      kind: "bullets",
      title: "What interviews ask on this topic",
      firstItemStep: 1,
      items: [
        { icon: "🧱", text: "Stack vs heap; when is an object eligible for GC; the generations" },
        { icon: "🔗", text: "Strong vs soft vs weak vs phantom references; what does System.gc() do?" },
        { icon: "🏗️", text: "JVM architecture: class loaders, runtime areas, JIT; JDK vs JRE vs JVM" },
        { icon: "⚙️", text: "Serial, Parallel, G1, ZGC: which would you pick?" },
        { icon: "💥", text: "OutOfMemoryError: causes, and what a leak is in Java" },
      ],
      beats: B(
        "Here's the list, in the order we'll take it.",
        "Stack versus heap, when an object becomes garbage, and the generations.",
        "Reference strengths, and what System dot gc really does.",
        "The JVM's architecture, and JDK versus JRE versus JVM.",
        "The collectors, and which one you'd pick.",
        { say: "And out of memory errors, which brings us back to that service dying every three days.", tone: "key" },
      ),
    },

    // ================================================================ 1
    sec("1", "Stack and heap", "Question one. Stack versus heap. What lives where?"),
    old("frames"),
    sayit("Stack vs heap: what lives where?", "Said in an interview:", [
      ["Each thread has its own stack of frames: local variables, primitives, references", "Each thread has its own stack, a frame per method call, holding local variables: primitives, and references."],
      ["All objects live on the heap, shared by every thread; GC manages it", "Every object lives on the heap, which all threads share, and which the garbage collector manages."],
      ["Frames vanish on return; objects live while reachable", "A frame disappears when its method returns. An object lives as long as something can still reach it."],
      ["Too deep: StackOverflowError; heap full: OutOfMemoryError", "Recursion that's too deep gives a stack overflow error. A full heap gives an out of memory error."],
    ]),

    // ================================================================ 2
    sec("2", "When an object becomes garbage", "Question two. When is an object eligible for garbage collection, and what are the generations?"),
    old("roots"),
    old("eden"),
    old("compact"),
    old("meta"),
    sayit("When is an object eligible for GC? What are the generations?", "Out loud:", [
      ["Eligible when no chain of references from a GC root reaches it", "An object is eligible when no chain of references from a GC root reaches it. Roots are live stack variables, static fields, and running threads."],
      ["Tracing, not counting: cycles are collected", "Java traces from the roots rather than counting references, so cycles are collected too."],
      ["Generational: most objects die young; new objects in Eden", "The heap is generational, because most objects die young. New objects go into Eden."],
      ["Minor GC copies survivors and ages them; old ones are promoted", "A minor GC copies the survivors between survivor spaces and ages them; long-lived ones are promoted to the old generation."],
      ["Old gen is collected less often (mark, sweep, compact); class metadata is in metaspace", "The old generation is collected less often, with marking and compaction, and class metadata lives outside the heap, in metaspace."],
    ]),

    // ================================================================ 3
    sec("3", "References and System.gc()", "Question three. Reference strengths, and what System dot gc actually does."),
    old("refkinds"),
    qa(1, "Strong vs soft vs weak vs phantom: where would you use each?", [
      "Strong: normal references; never collected while reachable",
      "Soft: kept until memory is short: memory-sensitive caches (but a bounded cache like Caffeine is usually better)",
      "Weak: collected at the next GC: WeakHashMap keys, listeners, canonicalising maps",
      "Phantom: tells you after the object is gone: cleanup via Cleaner (instead of finalize, which is deprecated)",
    ], { ask: "So where would you actually use each one?" }),
    qa(2, "What does System.gc() do?", [
      "It's only a request: the JVM may run a full GC, or ignore it",
      "-XX:+DisableExplicitGC makes it a no-op; libraries sometimes call it (direct buffers)",
      "Never call it to “fix” memory: find the leak or size the heap instead",
    ], { ask: "Question three, part two. What does System dot gc do?" }),

    // ================================================================ 4
    sec("4", "JVM architecture", "Question four. Explain the JVM's architecture, and the difference between the JDK, the JRE and the JVM."),
    {
      kind: "flow",
      title: "From .java to running code",
      cols: 4,
      rows: 2,
      nodeW: 380,
      nodeH: 140,
      nodes: [
        { id: "src", label: "Order.java\n→ javac →\nOrder.class (bytecode)", c: 0, r: 0 },
        { id: "cl", label: "Class loaders\nbootstrap → platform → app\nparent-first delegation", c: 1, r: 0, tone: "amber" },
        { id: "rt", label: "Runtime data areas\nheap · metaspace\nper thread: stack, PC", c: 2, r: 0, tone: "cyan" },
        { id: "ex", label: "Execution engine\ninterpreter + JIT (C1, C2)\n+ garbage collector", c: 3, r: 0, tone: "green" },
        { id: "jit", label: "hot methods are compiled to machine code;\ncold code stays interpreted", c: 2, r: 1, w: 820 },
      ],
      edges: [
        { from: "src", to: "cl", label: "load" },
        { from: "cl", to: "rt", label: "link, init" },
        { from: "rt", to: "ex" },
        { from: "ex", to: "jit" },
      ],
      show: [["src"], ["cl"], ["rt"], ["ex", "jit"]],
      beats: B(
        "javac compiles your source to bytecode, in class files. Platform-independent instructions for the JVM, not for any CPU.",
        "Class loaders bring classes in when they're first needed. There's a hierarchy: the bootstrap loader for the core library, the platform loader, then the application loader for your classpath. Each asks its parent first, so nobody can replace java dot lang dot String with their own. Loading is followed by linking, which verifies the bytecode, and initialisation, which runs static blocks.",
        "The runtime data areas: the heap and metaspace are shared by all threads; each thread gets its own stack and program counter.",
        { say: "And the execution engine runs the bytecode. It starts by interpreting, profiles what runs often, and the JIT compilers, C1 quickly and C2 with heavy optimisation, turn hot methods into machine code. That's why Java warms up: it gets faster after the first few thousand calls. The garbage collector is part of the engine too.", tone: "key" },
      ),
    },
    {
      kind: "compare",
      title: "JDK vs JRE vs JVM",
      cols: [
        { title: "JVM", tone: "cyan", items: ["Runs bytecode", "Class loading, memory, GC, JIT", "One per platform (HotSpot, OpenJ9)"] },
        { title: "JRE", tone: "blue", items: ["JVM + the standard library", "Enough to run apps", "No longer shipped separately since Java 11"] },
        { title: "JDK", tone: "green", items: ["JRE + tools: javac, jcmd, jstack, jlink", "What developers install", "jlink builds a trimmed runtime for containers"] },
      ],
      beats: B(
        "The JVM is the engine that runs bytecode: loading, memory, garbage collection, JIT.",
        "The JRE is the JVM plus the standard library: enough to run an application. Since Java eleven it's no longer shipped on its own.",
        { say: "And the JDK is the JRE plus the developer tools: javac, jcmd, jstack, and jlink, which builds a trimmed runtime with only the modules your app needs. That's a nice detail for container images.", tone: "key" },
      ),
    },

    // ================================================================ 5
    sec("5", "The collectors", "Question five. Which garbage collectors do you know, and which would you pick?"),
    old("collectors"),
    old("regions"),
    {
      kind: "compare",
      title: "Picking a collector today",
      cols: [
        { title: "G1 (default)", icon: "🗺️", tone: "blue", items: ["Balanced throughput and pauses", "A pause-time target (200 ms)", "Most services: start here"] },
        { title: "Parallel", icon: "🏭", tone: "amber", items: ["Best throughput, longer pauses", "Batch jobs, data crunching", "Pauses don't matter"] },
        { title: "ZGC (generational)", icon: "⚡", tone: "green", items: ["Sub-millisecond pauses, huge heaps", "Generational by default since JDK 23", "Latency-critical APIs"] },
        { title: "Shenandoah", icon: "🌊", tone: "purple", items: ["Concurrent compaction, low pause", "Generational mode final in JDK 25", "Red Hat builds"] },
      ],
      footer: "Measure with GC logs (-Xlog:gc*) before tuning; most problems are allocation or leaks, not the collector",
      beats: B(
        "So which would you pick? G1 is the default, and the right starting point for most services: balanced throughput, with a pause target you can set.",
        "Parallel, when only throughput matters, like a nightly batch job.",
        "ZGC, when latency matters most. Pauses stay under a millisecond even on very large heaps, and since JDK twenty three it's generational by default, which fixed its old weakness with lots of short-lived objects.",
        "And Shenandoah, Red Hat's low-pause collector, whose generational mode became a full feature in JDK twenty five.",
        { say: "And the senior part of the answer: measure first, with GC logs, before changing anything. Most memory problems are too much allocation, or a leak, not the wrong collector.", tone: "key" },
      ),
    },
    sayit("Which GC algorithms do you know? Which would you pick?", "The answer:", [
      ["Serial (one thread), Parallel (throughput), G1 (regions, pause target, the default), ZGC and Shenandoah (concurrent, low pause)", "Serial, one thread, for tiny heaps. Parallel, for throughput. G1, the default, region-based with a pause target. And ZGC and Shenandoah, which do almost everything concurrently, for very low pauses."],
      ["G1 for a typical service", "For a typical service, I'd keep G1."],
      ["Parallel for batch; generational ZGC for strict latency or very large heaps", "Parallel for batch jobs, and generational ZGC for strict latency or very large heaps."],
      ["Decide from GC logs and latency percentiles, not by guessing", "And I'd decide from GC logs and latency percentiles, not by guessing."],
    ]),

    // ================================================================ 6
    sec("6", "OutOfMemoryError and leaks", "Question six. Out of memory errors: what causes them, and what is a memory leak in a garbage-collected language?", ),
    {
      kind: "bullets",
      title: "Read the message: each OutOfMemoryError means something different",
      items: [
        { icon: "🧺", text: "Java heap space", sub: "the heap is full: a leak, or a heap too small for the load" },
        { icon: "⏱️", text: "GC overhead limit exceeded", sub: "98% of time in GC, under 2% freed: the heap is nearly full of live objects" },
        { icon: "📚", text: "Metaspace", sub: "too many classes: classloader leaks on redeploy, runaway proxies" },
        { icon: "🧵", text: "unable to create native thread", sub: "too many threads, or an OS/container limit" },
        { icon: "🔌", text: "Direct buffer memory", sub: "off-heap NIO buffers (Netty, NIO) beyond MaxDirectMemorySize" },
      ],
      beats: B(
        "First, read the message, because each out of memory error means something different. Java heap space: the heap is full, either from a leak, or because it's simply too small for the load.",
        "GC overhead limit exceeded: the JVM spends almost all its time collecting and frees almost nothing. Usually the same cause as heap space, caught earlier.",
        "Metaspace: too many classes loaded. Typically a classloader leak on hot redeploys, or a library generating proxy classes without limit.",
        "Unable to create native thread: too many threads, or the operating system's or container's limit on them. More heap won't help; less does.",
        { say: "And direct buffer memory: off-heap buffers, used by Netty and NIO, beyond their limit. So the message tells you where to look.", tone: "key" },
      ),
    },
    old("leak"),
    old("pod"),
    sayit("OutOfMemoryError: what causes it, and what's a memory leak in Java?", "Here's how I'd answer:", [
      ["A leak = objects you no longer need that are still reachable, so GC can't free them", "A leak in Java is objects you no longer need that are still reachable, so the collector isn't allowed to free them."],
      ["Typical: static maps/caches without eviction, listeners never removed, ThreadLocals in pools", "The usual causes: static maps or caches without eviction, listeners that are never removed, and thread locals left in pooled threads."],
      ["Symptom: the floor after each GC keeps rising, then OOM", "The symptom is the heap's floor after each collection creeping up, until it runs out."],
      ["Diagnose: heap dump on OOM, Eclipse MAT dominator tree; fix: remove, bound or expire", "I'd take a heap dump on out of memory, open it in Eclipse MAT, find what dominates the retained heap, then remove, bound, or expire it."],
      ["In containers, size the heap with MaxRAMPercentage, leaving room for non-heap memory", "And in containers, size the heap with max RAM percentage, leaving room for memory outside the heap."],
    ]),
    check({
      topic: "GC",
      q: "Two objects reference only each other, and nothing else references them. Are they garbage?",
      say: "Two objects reference only each other, and nothing else references them. Are they garbage?",
      a: "Yes. Java's GC traces from roots; no root reaches them, so both are collected. Cycles don't keep objects alive.",
      aSay: "Yes. The collector traces from the GC roots, and no root reaches either of them, so both are collected. Cycles don't keep objects alive in Java.",
    }),
    check({
      topic: "OOM",
      q: "A pod with a 2 GB limit keeps getting OOMKilled (exit 137), but the Java heap never fills. What's going on?",
      say: "A pod with a two gigabyte limit keeps getting OOM killed, exit code one three seven, but the Java heap never fills up. What's going on?",
      a: "The process's total memory (heap + metaspace + thread stacks + code cache + direct buffers) exceeds the container limit, so the kernel kills it. Lower -Xmx / use MaxRAMPercentage≈75 to leave headroom.",
      aSay: "The kernel killed it, because the whole process, heap plus metaspace, thread stacks, code cache and direct buffers, went over the container limit. Give the heap less, around seventy five percent with max RAM percentage, to leave headroom.",
    }),
    {
      kind: "drill",
      items: [
        { q: "Where do objects live?", a: "The heap" },
        { q: "What's a GC root?", a: "Live stack vars, statics, threads" },
        { q: "Default collector since Java 9?", a: "G1" },
        { q: "Where is class metadata?", a: "Metaspace (native memory)" },
        { q: "Does System.gc() force a GC?", a: "No: it's a hint" },
        { q: "OOMKilled, heap fine?", a: "Non-heap memory over the pod limit" },
      ],
      beats: B(
        { say: "Rapid fire. Where do objects live?", hold: 3 },
        "On the heap.",
        { say: "What's a GC root?", hold: 3 },
        "Live stack variables, static fields, and running threads.",
        { say: "The default collector since Java nine?", hold: 3 },
        "G1.",
        { say: "Where does class metadata live?", hold: 3 },
        "In metaspace, in native memory.",
        { say: "Does System dot gc force a collection?", hold: 3 },
        "No. It's a hint.",
        { say: "OOM killed, but the heap was fine?", hold: 3 },
        { say: "Non-heap memory pushed the pod over its limit. That's part four.", tone: "key" },
      ),
    },
  ],
};
