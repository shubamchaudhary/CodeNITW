// Core Stack — Java, Spring Boot and the non-AI stack from the resume.
//
// GENERATED FILE. Edit scripts/data/coreStackMap.mjs (what to study and in what
// order) or scripts/data/javaSpringPrepTracker.csv (video titles and runtimes)
// and re-run `node scripts/genCoreStack.mjs` — do not edit here.
//
// Every video reference is resolved against the CSV index at generation time
// and the build fails on a miss, so no title, playlist position or runtime on
// this page is invented. Resources with kind "self" have no link on purpose:
// they are your own systems, and only your codebase answers those questions.

export const CORE_STACK_SECTIONS = [
  {
    "key": "java",
    "label": "Java Core"
  },
  {
    "key": "concurrency",
    "label": "Concurrency & Multithreading"
  },
  {
    "key": "spring",
    "label": "Spring Boot & Data Access"
  },
  {
    "key": "data",
    "label": "Databases & Caching"
  },
  {
    "key": "kafka",
    "label": "Kafka & Messaging"
  },
  {
    "key": "platform",
    "label": "Microservices & Platform"
  },
  {
    "key": "testing",
    "label": "Testing & Delivery"
  },
  {
    "key": "resume",
    "label": "Your Systems — resume defence"
  }
];

export const CORE_STACK_TOPICS = [
  {
    "id": "JAVA-01",
    "section": "java",
    "sectionLabel": "Java Core",
    "priority": "P0",
    "title": "Collections framework + HashMap internals",
    "why": "The single most reliably asked core-Java topic; HashMap internals came up by name in SDE-2 write-ups.",
    "resources": [
      {
        "id": "JAVA-01-r1",
        "kind": "video",
        "title": "Collections in Java - Part1 | Java Collections Framework in depth",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 22,
        "minutes": 41
      },
      {
        "id": "JAVA-01-r2",
        "kind": "video",
        "title": "Collections in Java - Part4 | HashMap Internal Working in Java",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 25,
        "minutes": 58
      }
    ],
    "minutes": 99,
    "duration": "1h 39m",
    "questions": [
      "Walk through put() step by step: hash → index → collision → resize.",
      "Why is default capacity 16 and load factor 0.75?",
      "What is treeification? At what threshold, and why does it need a second condition (table size ≥ 64)?",
      "Why does HashMap re-hash the key's hashCode() instead of using it directly?",
      "Explain the equals/hashCode contract. What breaks if you override one only?",
      "You mutate a field used in hashCode() after inserting into a HashMap. What does get() return? Why?",
      "Why can't that happen with String keys?",
      "HashMap vs Hashtable vs ConcurrentHashMap vs Collections.synchronizedMap.",
      "How does ConcurrentHashMap achieve thread safety in Java 8+? (Not segment locking any more — say this.)",
      "Why is resizing a HashMap dangerous under concurrent access?",
      "ArrayList vs LinkedList — when is LinkedList actually the right choice? (Almost never. Say why.)",
      "Fail-fast vs fail-safe iterators. What is modCount?"
    ]
  },
  {
    "id": "JAVA-02",
    "section": "java",
    "sectionLabel": "Java Core",
    "priority": "P0",
    "title": "Streams, lambdas & functional interfaces",
    "why": "Java 8 stream/lambda questions appear in essentially every loop at 2–4 years.",
    "resources": [
      {
        "id": "JAVA-02-r1",
        "kind": "video",
        "title": "Functional Interface and Lambda Expression - Java8 features | Java Interfaces Part3",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 17,
        "minutes": 32
      },
      {
        "id": "JAVA-02-r2",
        "kind": "video",
        "title": "Streams in Java8 | Collections in Java - Part7",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 28,
        "minutes": 75
      }
    ],
    "minutes": 107,
    "duration": "1h 47m",
    "questions": [
      "Intermediate vs terminal operations. Why are streams lazy?",
      "map vs flatMap — give a concrete case where only flatMap works.",
      "Can you reuse a stream? What happens if you try?",
      "When does parallelStream() make things slower? Name two mechanisms.",
      "Why is parallelStream() dangerous inside a web request thread? (Shared common ForkJoinPool.)",
      "Collectors.groupingBy with a downstream collector — write one.",
      "reduce vs collect — when does each apply?",
      "findFirst vs findAny — what changes in parallel?",
      "What is a functional interface? Name four built-in ones and their signatures.",
      "Method reference types — four kinds, give an example of each.",
      "Why must variables captured by a lambda be effectively final?",
      "Are streams always better than a for loop? (No. Say when.)"
    ]
  },
  {
    "id": "JAVA-03",
    "section": "java",
    "sectionLabel": "Java Core",
    "priority": "P0",
    "title": "OOP, exceptions & error handling",
    "why": "Reported verbatim in SDE-2 rounds: exception hierarchy, checked vs unchecked, try-with-resources, propagation. It was buried in the old plan's remedial pile — it should not have been.",
    "resources": [
      {
        "id": "JAVA-03-r1",
        "kind": "video",
        "title": "OOPs Concept",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 2,
        "minutes": 0
      },
      {
        "id": "JAVA-03-r2",
        "kind": "video",
        "title": "Exception Handling",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 19,
        "minutes": 0
      }
    ],
    "minutes": 0,
    "duration": "—",
    "questions": [
      "Four pillars of OOP — give a real example of each from code you have written, not a textbook one.",
      "Abstract class vs interface in Java 17. When does an interface with default methods win?",
      "What is the superclass of every exception? Where do Error and RuntimeException sit?",
      "Checked vs unchecked — which do you throw from a service layer, and why?",
      "How does exception propagation work through a call stack? What does the JVM do if nothing catches?",
      "try-with-resources — what does it compile to, and what happens if both the body and close() throw?",
      "Why is catching Exception (or Throwable) usually wrong? When is it right?",
      "Overloading vs overriding — what is resolved at compile time and what at runtime?",
      "Can you override a static method? What actually happens if you try?",
      "Custom exception: checked or unchecked, and what do you put in it beyond a message?",
      "finally runs when? Name two cases where it does not.",
      "What is the cost of throwing an exception, and why is exception-as-control-flow discouraged?"
    ]
  },
  {
    "id": "JAVA-04",
    "section": "java",
    "sectionLabel": "Java Core",
    "priority": "P1",
    "title": "JVM memory model & garbage collection",
    "why": "Standard at this level, and your K8s pods make the container-vs-heap question personal.",
    "resources": [
      {
        "id": "JAVA-04-r1",
        "kind": "video",
        "title": "Java Memory Management and Garbage Collection in Depth",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 10,
        "minutes": 49
      }
    ],
    "minutes": 49,
    "duration": "49m",
    "questions": [
      "Draw the JVM memory layout. Which regions are per-thread vs shared?",
      "Stack vs heap — what lives where, and who cleans each?",
      "Young gen / old gen / metaspace — why the generational split?",
      "Minor vs major vs full GC. Which pauses the app and for how long?",
      "G1 vs Parallel vs ZGC — when would you pick each?",
      "Your pod OOM-kills in Kubernetes but heap dumps look fine. Where did the memory go? (Metaspace, direct buffers, thread stacks, native — container limit ≠ heap limit.)",
      "OutOfMemoryError: Java heap space vs Metaspace vs GC overhead limit exceeded — different causes.",
      "What is a memory leak in a GC'd language? Give a real example.",
      "How do you diagnose one in production? (Heap dump, MAT, jmap, jcmd.)",
      "Strong vs weak vs soft vs phantom references."
    ]
  },
  {
    "id": "JAVA-05",
    "section": "java",
    "sectionLabel": "Java Core",
    "priority": "P1",
    "title": "Java 17 & 21 — records, sealed types, pattern matching, virtual threads",
    "why": "Raised from P2: 2026 write-ups treat Java 17 features as assumed knowledge, and virtual threads are now a live interview topic. You ship Java 17 — being vague here reads badly.",
    "resources": [
      {
        "id": "JAVA-05-r1",
        "kind": "video",
        "title": "Java 17: Sealed Classes and Interfaces",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 41,
        "minutes": 11
      },
      {
        "id": "JAVA-05-r2",
        "kind": "video",
        "title": "Java 14: Switch Expressions Deep Dive",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 42,
        "minutes": 23
      },
      {
        "id": "JAVA-05-r3",
        "kind": "video",
        "title": "Java 16: Pattern Matching for instanceof",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 43,
        "minutes": 9
      },
      {
        "id": "JAVA-05-r4",
        "kind": "video",
        "title": "Java 21: Pattern Matching for switch",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 44,
        "minutes": 9
      },
      {
        "id": "JAVA-05-r5",
        "kind": "video",
        "title": "Java 16: Record class",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 45,
        "minutes": 36
      },
      {
        "id": "JAVA-05-r6",
        "kind": "video",
        "title": "Java VirtualThreads vs Normal Threads || ThreadLocal in Java",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 38,
        "minutes": 23
      }
    ],
    "minutes": 111,
    "duration": "1h 51m",
    "questions": [
      "What is a record and what does it generate?",
      "When is a record the wrong choice?",
      "What do sealed classes enable that final doesn't?",
      "How do sealed types + pattern matching give exhaustiveness?",
      "Which of these have you actually used on Java 17 at work?",
      "Platform thread vs virtual thread — what actually changes, and what does not?",
      "What is pinning, what causes it, and how would you detect it?",
      "Why are thread pools mostly pointless with virtual threads — and where do you still want one?",
      "Virtual threads vs reactive (WebFlux/Reactor) — what problem does each solve? Which would you pick now?",
      "Where do virtual threads NOT help? (CPU-bound work — say so plainly.)",
      "Which of Java 17/21's features have you actually used at work, and which would you adopt next?"
    ]
  },
  {
    "id": "JAVA-06",
    "section": "java",
    "sectionLabel": "Java Core",
    "priority": "P1",
    "title": "Immutability, equals/hashCode & singletons",
    "why": "",
    "resources": [
      {
        "id": "JAVA-06-r1",
        "kind": "video",
        "title": "Java Singleton and Immutable Class Explained with Examples | Java Classes in Depth - Part4",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 14,
        "minutes": 28
      }
    ],
    "minutes": 28,
    "duration": "28m",
    "questions": [
      "List every rule for making a class truly immutable. Which one do people forget? (Defensive copy of mutable fields.)",
      "Why is immutability inherently thread-safe?",
      "Is String immutable? What is the string pool and why does it exist?",
      "Write a thread-safe singleton four ways. Rank them.",
      "Why is enum singleton the best? What does it defend against that others don't?",
      "How can reflection or serialization break a singleton? How do you prevent it?",
      "Why is double-checked locking broken without volatile?"
    ]
  },
  {
    "id": "JAVA-07",
    "section": "java",
    "sectionLabel": "Java Core",
    "priority": "P1",
    "title": "Generics & type erasure",
    "why": "",
    "resources": [
      {
        "id": "JAVA-07-r1",
        "kind": "video",
        "title": "Java Generic Classes | Java Classes in Depth - Part2",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 12,
        "minutes": 52
      }
    ],
    "minutes": 52,
    "duration": "52m",
    "questions": [
      "What is type erasure? Name two things it makes impossible.",
      "List<Object> vs List<?> vs List<? extends Object> — what can you add to each?",
      "Explain PECS. Give a real method signature using it.",
      "Why can't you create new T[]?",
      "Why is List<String> not a subtype of List<Object>?",
      "Bounded type parameters — write a generic method that only accepts Comparable.",
      "What is a bridge method?"
    ]
  },
  {
    "id": "JAVA-08",
    "section": "java",
    "sectionLabel": "Java Core",
    "priority": "P2",
    "title": "Optional — the API and its misuse",
    "why": "",
    "resources": [
      {
        "id": "JAVA-08-r1",
        "kind": "video",
        "title": "Master Java Optional from Java 8 to 11 | All Methods with Real Examples",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 47,
        "minutes": 74
      }
    ],
    "minutes": 74,
    "duration": "1h 14m",
    "questions": [
      "What was Optional designed for? (Return types — not fields, not params.)",
      "Why is Optional as an entity field a bad idea?",
      "orElse vs orElseGet — which eagerly evaluates?",
      "Why is Optional.get() a code smell?",
      "Is Optional serializable?"
    ]
  },
  {
    "id": "JAVA-09",
    "section": "java",
    "sectionLabel": "Java Core",
    "priority": "P2",
    "title": "Comparable vs Comparator, TreeMap, LinkedHashMap & Set",
    "why": "Cheap points. Comparator questions show up constantly as a warm-up before something harder.",
    "resources": [
      {
        "id": "JAVA-09-r1",
        "kind": "video",
        "title": "Comparator vs Comparable",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 23,
        "minutes": 0
      },
      {
        "id": "JAVA-09-r2",
        "kind": "video",
        "title": "LinkedHashMap and TreeMap",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 26,
        "minutes": 0
      },
      {
        "id": "JAVA-09-r3",
        "kind": "video",
        "title": "SET",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 27,
        "minutes": 0
      }
    ],
    "minutes": 0,
    "duration": "—",
    "questions": [
      "Comparable vs Comparator — which one changes the class, and which one do you reach for in practice?",
      "Sort a list of objects by two fields, second descending. Write it with Comparator chaining.",
      "What breaks if your comparator is inconsistent with equals? Where does it bite you? (TreeMap/TreeSet.)",
      "HashSet vs LinkedHashSet vs TreeSet — ordering, cost, and when each is the right pick.",
      "How does TreeMap achieve ordering, and what is the complexity of get/put?",
      "LinkedHashMap in access-order mode — how do you build an LRU cache from it in five lines?",
      "Your comparator throws \"Comparison method violates its general contract\" in production. What happened?"
    ]
  },
  {
    "id": "CONC-01",
    "section": "concurrency",
    "sectionLabel": "Concurrency & Multithreading",
    "priority": "P0",
    "title": "Threads, executors & ThreadPoolExecutor",
    "why": "Your resume says Multithreading & Concurrency and Asynchronous Processing. Expect a whole round.",
    "resources": [
      {
        "id": "CONC-01-r1",
        "kind": "video",
        "title": "Multithreading and Concurrency in Java: Part1 | Threads, Process and their Memory Model in depth",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 29,
        "minutes": 48
      },
      {
        "id": "CONC-01-r2",
        "kind": "video",
        "title": "Thread Pools in Java | ThreadPoolExecutor Framework | Multithreading Part6",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 34,
        "minutes": 77
      }
    ],
    "minutes": 125,
    "duration": "2h 5m",
    "questions": [
      "Name all 7 ThreadPoolExecutor constructor parameters and what each controls.",
      "core=5, max=10, unbounded LinkedBlockingQueue. How many threads actually run under load? Why is this a production incident?",
      "Full task submission flow: when does it use a core thread vs queue vs spawn to max vs reject?",
      "Name the 4 rejection policies. Which would you pick for a payment API and why?",
      "newFixedThreadPool vs newCachedThreadPool — what's the hidden danger in each?",
      "How do you size a pool for CPU-bound vs IO-bound work? Give the formula.",
      "shutdown() vs shutdownNow() vs awaitTermination().",
      "What happens to an uncaught exception in a pooled task submitted via execute() vs submit()?",
      "Why is Executors.newFixedThreadPool() discouraged in production code?",
      "Thread lifecycle states — name all and the transitions.",
      "wait()/notify() vs await()/signal() — why does wait() require a synchronized block?",
      "What is thread starvation? How would you detect it in production?"
    ]
  },
  {
    "id": "CONC-02",
    "section": "concurrency",
    "sectionLabel": "Concurrency & Multithreading",
    "priority": "P0",
    "title": "volatile, atomics, CAS & the Java Memory Model",
    "why": "\"volatile vs atomic\" is reported almost verbatim in SDE-2 loops.",
    "resources": [
      {
        "id": "CONC-02-r1",
        "kind": "video",
        "title": "Lock-Free Concurrency | Compare-and-Swap | Atomic & Volatile Variables | Multithreading Part5",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 33,
        "minutes": 64
      },
      {
        "id": "CONC-02-r2",
        "kind": "video",
        "title": "Java Memory Model in 10 minutes",
        "source": "Defog Tech",
        "playlist": "Java Concurrency",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLhfHPmPYPPRk6yMrcbfafFGSbE2EPK_A6",
        "position": 4,
        "minutes": 11
      }
    ],
    "minutes": 75,
    "duration": "1h 15m",
    "questions": [
      "What exactly does volatile guarantee? What does it NOT guarantee?",
      "Give a concrete case where volatile fixes visibility but the code is still broken.",
      "What is the happens-before relationship? Name three ways to establish one.",
      "How does CAS work at the hardware level? What is the ABA problem?",
      "AtomicInteger.incrementAndGet() vs synchronized counter — which is faster and when does that flip?",
      "What is LongAdder and when does it beat AtomicLong?",
      "Double-checked locking — why is volatile mandatory on the instance field?",
      "What is instruction reordering? Why does it exist?",
      "Race condition vs data race — are they the same thing?",
      "Is synchronized reentrant? What would break if it weren't?",
      "Where is the memory barrier inserted for a volatile write vs read?",
      "When would you choose lock-free over locking in real code?"
    ]
  },
  {
    "id": "CONC-03",
    "section": "concurrency",
    "sectionLabel": "Concurrency & Multithreading",
    "priority": "P0",
    "title": "Locks, wait/notify & coordination primitives",
    "why": "This is where the classic live-coding ask lands: N threads printing in strict sequence.",
    "resources": [
      {
        "id": "CONC-03-r1",
        "kind": "video",
        "title": "Locks and Condition | Java Multithreading Part4 | Reentrant, ReadWrite, Stamped & Semaphore Lock",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 32,
        "minutes": 47
      }
    ],
    "minutes": 47,
    "duration": "47m",
    "questions": [
      "ReentrantLock vs synchronized — name four things ReentrantLock gives you.",
      "What is lock fairness? What does it cost?",
      "Why must unlock() be in a finally block?",
      "When does ReadWriteLock actually beat a plain lock? When does it lose?",
      "What is writer starvation in ReadWriteLock?",
      "StampedLock optimistic read — how does it work and what's the catch?",
      "Semaphore vs CountDownLatch vs CyclicBarrier — one line each.",
      "How do you detect a deadlock in a running production JVM?",
      "Four conditions for deadlock. Which one do you break in practice?",
      "tryLock() with timeout — give a real use case.",
      "Three threads must print 1,2,3,1,2,3… in strict order. Write it with wait/notify, then with Semaphores. Which would you ship?",
      "Print odd/even alternately with two threads — where does the naive version deadlock or miss a signal?",
      "Why notifyAll() over notify()? What is the lost-wakeup problem?",
      "Why must wait() always sit inside a loop that rechecks the condition?",
      "Producer–consumer with a bounded buffer: implement it with BlockingQueue, then say what BlockingQueue is doing for you underneath."
    ]
  },
  {
    "id": "CONC-04",
    "section": "concurrency",
    "sectionLabel": "Concurrency & Multithreading",
    "priority": "P0",
    "title": "CompletableFuture & @Async",
    "why": "Directly backs the async/sync-fallback work on your resume.",
    "resources": [
      {
        "id": "CONC-04-r1",
        "kind": "video",
        "title": "Java8 CompletableFuture | Future and Callable in Java | Multithreading in Java - Part7",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 35,
        "minutes": 66
      },
      {
        "id": "CONC-04-r2",
        "kind": "video",
        "title": "Spring boot @Async Annotation - Part1 | ThreadPoolExecutor",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 16,
        "minutes": 46
      },
      {
        "id": "CONC-04-r3",
        "kind": "video",
        "title": "Spring boot @Async Annotation - Part2 | Async Annotation Important Interview questions",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 17,
        "minutes": 24
      }
    ],
    "minutes": 136,
    "duration": "2h 16m",
    "questions": [
      "Future vs CompletableFuture — what does Future fundamentally not let you do?",
      "thenApply vs thenCompose vs thenCombine. When is thenCompose mandatory?",
      "thenApply vs thenApplyAsync — which thread runs the callback in each?",
      "How do you handle exceptions? exceptionally vs handle vs whenComplete.",
      "allOf vs anyOf — how do you collect results from allOf?",
      "What thread pool does CompletableFuture use by default? Why is that a problem in a web app?",
      "Why does @Async silently not work when called from within the same class?",
      "What must @Async methods return? What happens if one returns void and throws?",
      "How do you configure a custom executor for @Async? What breaks if you don't?",
      "Does the security context / @Transactional context propagate into @Async? Why not?",
      "How would you implement a timeout on a CompletableFuture?",
      "Scatter-gather: 5 parallel service calls, aggregate, fail fast if any fails. Write it."
    ]
  },
  {
    "id": "CONC-05",
    "section": "concurrency",
    "sectionLabel": "Concurrency & Multithreading",
    "priority": "P2",
    "title": "ForkJoinPool, work stealing & parallel streams",
    "why": "",
    "resources": [
      {
        "id": "CONC-05-r1",
        "kind": "video",
        "title": "Java ForkJoinPool || WorkStealingPool || FixedThreadPool || CachedThreadPool",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 36,
        "minutes": 39
      },
      {
        "id": "CONC-05-r2",
        "kind": "video",
        "title": "Understanding how ForkJoinPool works",
        "source": "Defog Tech",
        "playlist": "Java Concurrency",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLhfHPmPYPPRk6yMrcbfafFGSbE2EPK_A6",
        "position": 20,
        "minutes": 13
      }
    ],
    "minutes": 52,
    "duration": "52m",
    "questions": [
      "What is work stealing?",
      "Why does ForkJoinPool use a deque per thread?",
      "Why is blocking IO inside a ForkJoinPool task a bug?",
      "Who else uses the common pool by default? (parallelStream — link to P0-06.)"
    ]
  },
  {
    "id": "CONC-06",
    "section": "concurrency",
    "sectionLabel": "Concurrency & Multithreading",
    "priority": "P2",
    "title": "Deadlock detection, thread dumps & ThreadLocal leaks",
    "why": "",
    "resources": [
      {
        "id": "CONC-06-r1",
        "kind": "video",
        "title": "How detect and resolve DeadLocks in Java",
        "source": "Defog Tech",
        "playlist": "Java Concurrency",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLhfHPmPYPPRk6yMrcbfafFGSbE2EPK_A6",
        "position": 25,
        "minutes": 11
      },
      {
        "id": "CONC-06-r2",
        "kind": "video",
        "title": "Java VirtualThreads vs Normal Threads || ThreadLocal in Java",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 38,
        "minutes": 23
      }
    ],
    "minutes": 34,
    "duration": "34m",
    "questions": [
      "Detect a deadlock in a live JVM — what tools?",
      "What does a thread dump show?",
      "Lock ordering as prevention — how do you enforce it?",
      "Livelock vs deadlock vs starvation.",
      "Why is ThreadLocal a leak risk in a pooled thread, and what is the fix?",
      "How does ThreadLocal behave with virtual threads?",
      "A request-scoped ThreadLocal leaks into the next request. How does that happen and how do you prove it?"
    ]
  },
  {
    "id": "SPRING-01",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P0",
    "title": "@Transactional — propagation, isolation & proxy failure",
    "why": "The self-invocation question is reported by name in interview write-ups. Highest-yield Spring topic there is.",
    "resources": [
      {
        "id": "SPRING-01-r1",
        "kind": "video",
        "title": "Spring boot @Transactional Annotation - Part1",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 13,
        "minutes": 25
      },
      {
        "id": "SPRING-01-r2",
        "kind": "video",
        "title": "Spring boot @Transactional Annotation - Part2 | Declarative, Programmatic Approach and Propagation",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 14,
        "minutes": 38
      },
      {
        "id": "SPRING-01-r3",
        "kind": "video",
        "title": "Spring boot @Transactional Annotation - Part3 | Isolation Level and its different types",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 15,
        "minutes": 39
      }
    ],
    "minutes": 102,
    "duration": "1h 42m",
    "questions": [
      "methodA() (no annotation) calls this.methodB() (@Transactional) in the same class. Does a transaction start? Why not?",
      "Give three ways to fix self-invocation. Trade-off of each.",
      "Why doesn't @Transactional work on private / final methods?",
      "Explain all 7 propagation levels. Which have you actually used and why?",
      "REQUIRES_NEW inside a REQUIRED outer txn. Outer rolls back — what happens to the inner?",
      "Default rollback behaviour: which exceptions roll back, which don't? Why that default?",
      "How do you force rollback on a checked exception?",
      "Explain the 4 isolation levels via the anomaly each prevents (dirty read, non-repeatable read, phantom).",
      "What isolation does PostgreSQL actually default to? Does it differ from the JPA default?",
      "Where does the transaction actually open and commit in the call stack?",
      "@Transactional on a method that also spawns a @Async call — what happens to the transaction context?",
      "Long-running transaction holding a DB connection — what breaks at 1,000 tenants?"
    ]
  },
  {
    "id": "SPRING-02",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P0",
    "title": "Bean lifecycle, IoC, DI & scopes",
    "why": "\"Spring lifecycle\", @Component vs @Bean vs @Qualifier — reported repeatedly.",
    "resources": [
      {
        "id": "SPRING-02-r1",
        "kind": "video",
        "title": "Spring boot: Bean and its Lifecycle | Inversion of Control (IOC)",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 6,
        "minutes": 34
      },
      {
        "id": "SPRING-02-r2",
        "kind": "video",
        "title": "Dependency Injection in Spring boot | With Advantages and Disadvantages",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 7,
        "minutes": 39
      },
      {
        "id": "SPRING-02-r3",
        "kind": "video",
        "title": "Spring boot: Bean Scopes | Singleton, Prototype, Request, Session Scopes with Examples in Java",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 8,
        "minutes": 40
      }
    ],
    "minutes": 113,
    "duration": "1h 53m",
    "questions": [
      "Walk the full bean lifecycle from instantiation to destruction. Name the callbacks.",
      "Constructor vs setter vs field injection. Which does Spring recommend and why?",
      "Two beans depend on each other. Constructor injection fails, field injection works. Why is the \"working\" one worse?",
      "How do you legitimately break a circular dependency? (@Lazy, redesign, ApplicationContextAware)",
      "Inject a prototype bean into a singleton. How many instances get created? How do you fix it?",
      "Difference between @Component, @Service, @Repository, @Bean. Is it purely semantic?",
      "What does @Repository actually do beyond marking a bean?",
      "Two beans of the same type — how does Spring resolve it? (@Primary, @Qualifier)",
      "@PostConstruct vs InitializingBean vs initMethod — which runs first?",
      "Is a singleton bean thread-safe? (Trick: no. The container guarantees one instance, not safety.)",
      "Are prototype beans destroyed by the container? Why not?",
      "What is ApplicationContext vs BeanFactory?"
    ]
  },
  {
    "id": "SPRING-03",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P0",
    "title": "Spring Boot fundamentals — starters, auto-configuration, profiles & config",
    "why": "MISSING FROM THE OLD PLAN. \"How does auto-configuration work?\" is one of the most-asked Spring Boot questions at 2–5 years, and the old plan only covered @ConditionalOnProperty in passing.",
    "resources": [
      {
        "id": "SPRING-03-r1",
        "kind": "video",
        "title": "Spring boot @ConditionalOnProperty Annotation",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 10,
        "minutes": 20
      },
      {
        "id": "SPRING-03-r2",
        "kind": "video",
        "title": "Spring boot @Profile annotation | How Profiling works in Spring boot",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 11,
        "minutes": 33
      },
      {
        "id": "SPRING-03-r3",
        "kind": "video",
        "title": "Spring Boot: ConfigurationProperties in-depth",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 44,
        "minutes": 24
      },
      {
        "id": "SPRING-03-r4",
        "kind": "video",
        "title": "Introduction to Spring Boot",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 2,
        "minutes": 0
      },
      {
        "id": "SPRING-03-r5",
        "kind": "video",
        "title": "Maven",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 4,
        "minutes": 0
      }
    ],
    "minutes": 77,
    "duration": "1h 17m+",
    "questions": [
      "Your feature flag flips mid-request. What happens? (His actual system.)",
      "@ConditionalOnProperty is evaluated at startup. So how do you build a runtime-togglable flag?",
      "What is the property resolution order in Spring Boot? (env var vs application.yml vs CLI arg.)",
      "@Value vs @ConfigurationProperties — when does the latter win?",
      "How do you refresh config without restarting? What are the risks?",
      "How do you scope a feature flag per tenant across 1,000+ tenants?",
      "How do you test both sides of a feature flag in CI?",
      "What's your rollback plan when a flag causes an incident?",
      "What does @SpringBootApplication actually expand to? Name all three annotations and what each does.",
      "Walk auto-configuration end to end: what reads spring.factories / AutoConfiguration.imports, and when does a condition get evaluated?",
      "@ConditionalOnMissingBean — why is it the backbone of auto-configuration, and how do you override an auto-configured bean?",
      "How do you debug why a bean you expected was NOT created? (--debug / the conditions report.)",
      "What is a starter, and what would you put in one if you wrote your own?",
      "Property resolution order: env var vs application.yml vs profile-specific yml vs CLI arg — which wins?",
      "@Value vs @ConfigurationProperties — when does the latter win, and how do you validate it?",
      "How does an embedded server get chosen and started? What changes if you exclude Tomcat?",
      "Fat jar layout — why can't a plain java -cp run it, and what does the loader do?"
    ]
  },
  {
    "id": "SPRING-04",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P0",
    "title": "JPA core — entity lifecycle, L1 cache & the N+1 problem",
    "why": "N+1 and lazy loading are named explicitly in current interview guides. Spring Data JPA is your loudest resume claim.",
    "resources": [
      {
        "id": "SPRING-04-r1",
        "kind": "video",
        "title": "Spring boot: JPA (Part-2) | Setup, JPA Architecture, Entity Lifecycle",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 24,
        "minutes": 63
      },
      {
        "id": "SPRING-04-r2",
        "kind": "video",
        "title": "Spring boot: JPA (Part-3) | First Level Caching in JPA",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 25,
        "minutes": 24
      },
      {
        "id": "SPRING-04-r3",
        "kind": "video",
        "title": "Spring boot: JPA (Part-8) | JPQL, Derived Query, N+1 Problem, Joins, Pagination and Sorting etc.",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 30,
        "minutes": 59
      }
    ],
    "minutes": 146,
    "duration": "2h 26m",
    "questions": [
      "Name the 4 entity states and every transition between them.",
      "You load an entity, change a field, never call save(). Is it persisted? Why?",
      "What is the persistence context? What is its scope by default?",
      "Return a JPA entity from a @RestController → LazyInitializationException. Trace the full sequence.",
      "Why is FetchType.EAGER the wrong fix for that? Give the right ones.",
      "Explain N+1. Show a query that causes it and three fixes (JOIN FETCH, @EntityGraph, batch size).",
      "Difference between getReference() and findById().",
      "save() vs saveAndFlush() vs persist() vs merge().",
      "Why is L1 cache not a cache you can rely on for performance?",
      "Pagination + JOIN FETCH on a collection → why does Hibernate warn and load everything into memory?",
      "What is dirty checking and when does it run?",
      "Derived query methods vs JPQL vs native — when do you reach for each?"
    ]
  },
  {
    "id": "SPRING-05",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P0",
    "title": "REST API design — status codes, idempotency, versioning, pagination",
    "why": "Raised from P1: \"REST API design\" appears as its own round topic in SDE-2 write-ups, and it is the easiest place to sound senior or junior.",
    "resources": [
      {
        "id": "SPRING-05-r1",
        "kind": "video",
        "title": "Spring boot ResponseEntity and Response Codes | 1xx, 2xx, 3xx, 4xx and 5xx Return Codes",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 21,
        "minutes": 43
      },
      {
        "id": "SPRING-05-r2",
        "kind": "video",
        "title": "Controller Annotations",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 5,
        "minutes": 0
      }
    ],
    "minutes": 43,
    "duration": "43m+",
    "questions": [
      "401 vs 403. 400 vs 422. 409 — when?",
      "PUT vs PATCH vs POST — which are idempotent? Is POST ever?",
      "What does idempotency mean for an API, and how do you implement an idempotency key?",
      "Async job accepted but not finished — what status code, what response body?",
      "How do you version a REST API? Trade-offs of URL vs header versioning.",
      "When should a POST return 201 vs 200?",
      "Design pagination for a large collection. Offset vs cursor — which and why?",
      "@Controller vs @RestController — what does the difference actually change at runtime?",
      "@RequestParam vs @PathVariable vs @RequestBody — and when is each the wrong choice?",
      "How do you validate a request body, and what does the failure response look like end to end?",
      "Design the idempotency-key flow for a POST that creates a payment. Where do you store the key, and for how long?",
      "A client retries a timed-out POST. Walk through what your server does — twice."
    ]
  },
  {
    "id": "SPRING-06",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P1",
    "title": "AOP & the proxy mechanism",
    "why": "The mechanism under @Transactional, @Async and @Cacheable — reach for it whenever a self-invocation follow-up lands.",
    "resources": [
      {
        "id": "SPRING-06-r1",
        "kind": "video",
        "title": "Spring boot AOP (Aspect Oriented Programming)",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 12,
        "minutes": 69
      }
    ],
    "minutes": 69,
    "duration": "1h 9m",
    "questions": [
      "JDK dynamic proxy vs CGLIB — when does Spring pick which?",
      "Why can't CGLIB proxy a final class or final method?",
      "Explain the 5 advice types and their execution order.",
      "Difference between @Around and @Before + @After combined.",
      "Two aspects on the same method — how do you control ordering?",
      "What is a pointcut expression? Write one matching all methods in a package returning List.",
      "How does AOP relate to @Transactional, @Async, and @Cacheable? (Same mechanism — say this.)",
      "Performance cost of AOP. When is it the wrong tool?",
      "What is a BeanPostProcessor, and how does it relate to proxy creation?"
    ]
  },
  {
    "id": "SPRING-07",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P1",
    "title": "JPA relationships, fetching & cascades",
    "why": "Raised from P2: mapping questions are routine, and they are where N+1 actually originates.",
    "resources": [
      {
        "id": "SPRING-07-r1",
        "kind": "video",
        "title": "Spring boot: JPA (Part-6) | OneToOne Unidirectional and Bidirectional Mapping",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 28,
        "minutes": 66
      },
      {
        "id": "SPRING-07-r2",
        "kind": "video",
        "title": "Spring boot: JPA (Part-7) | OneToMany, ManyToOne & ManyToMany Unidirectional & Bidirectional Mapping",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 29,
        "minutes": 59
      }
    ],
    "minutes": 125,
    "duration": "2h 5m",
    "questions": [
      "Who owns a bidirectional relationship? What does mappedBy do?",
      "Why does @OneToMany without mappedBy create a join table?",
      "CascadeType.ALL — when is it dangerous?",
      "What is orphan removal and how does it differ from CascadeType.REMOVE?",
      "Why avoid @ManyToMany in real systems?"
    ]
  },
  {
    "id": "SPRING-08",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P1",
    "title": "Exception handling — @ControllerAdvice & error contracts",
    "why": "",
    "resources": [
      {
        "id": "SPRING-08-r1",
        "kind": "video",
        "title": "Spring boot - Exception Handling | @ControllerAdvice | @ResponseStatus | @ExceptionHandler",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 22,
        "minutes": 56
      }
    ],
    "minutes": 56,
    "duration": "56m",
    "questions": [
      "@ControllerAdvice vs @ExceptionHandler vs @ResponseStatus — scope of each.",
      "Two handlers could match the same exception. Which wins?",
      "Checked vs unchecked — which do you throw from a service layer and why?",
      "How do you return a consistent error response shape across all endpoints?",
      "Why should you never leak a stack trace in an API response?",
      "How do you handle validation errors (MethodArgumentNotValidException) cleanly?",
      "Does @ControllerAdvice catch exceptions thrown from a filter? (No — say why.)"
    ]
  },
  {
    "id": "SPRING-09",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P1",
    "title": "Spring Security architecture, JWT & stateless auth",
    "why": "Merged: the filter chain and JWT are one story in an interview, and current guides list securing endpoints with OAuth2/JWT as a core expectation.",
    "resources": [
      {
        "id": "SPRING-09-r1",
        "kind": "video",
        "title": "Spring boot: Security (Part-1) | Architecture and SetUp",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 34,
        "minutes": 18
      },
      {
        "id": "SPRING-09-r2",
        "kind": "video",
        "title": "Spring boot: Security (Part-2) | Multiple User Creation & Storing Username & Password | inMemory, DB",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 35,
        "minutes": 47
      },
      {
        "id": "SPRING-09-r3",
        "kind": "video",
        "title": "Spring boot: Security (Part-4) | Basic Authentication & Authorization | Stateless Authentication",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 37,
        "minutes": 20
      },
      {
        "id": "SPRING-09-r4",
        "kind": "video",
        "title": "JWT Explained | JWT vs SessionID | JSON Web Token | Security Challenges with JWT & its Handling",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 38,
        "minutes": 49
      }
    ],
    "minutes": 134,
    "duration": "2h 14m",
    "questions": [
      "Walk the filter chain top to bottom.",
      "What is SecurityContextHolder and where is it stored by default?",
      "Does the security context propagate to a child thread?",
      "How do you add a custom filter at the right position?",
      "Why BCrypt over SHA-256 for passwords?",
      "Three parts of a JWT. What's in each?",
      "Is a JWT encrypted? (No — signed. Correct anyone who says encrypted.)",
      "How do you invalidate a JWT before expiry? (The hard one. Blocklist, short TTL + refresh, token versioning.)",
      "JWT vs session ID — what do you trade away?",
      "Where do you store a JWT client-side? localStorage vs httpOnly cookie — which attack does each expose?",
      "HS256 vs RS256 — when is asymmetric required?",
      "What is the alg: none attack?",
      "How do you rotate signing keys without logging everyone out?"
    ]
  },
  {
    "id": "SPRING-10",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P1",
    "title": "OAuth 2.0 & service-to-service tokens",
    "why": "Your Snowflake B2C auth and adaptive S2S tokens live here.",
    "resources": [
      {
        "id": "SPRING-10-r1",
        "kind": "video",
        "title": "OAuth 2.0: Explained with API Request and Response Sample | High Level System Design",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 40,
        "minutes": 35
      },
      {
        "id": "SPRING-10-r2",
        "kind": "video",
        "title": "Spring boot: Security (Part-8) | OAUTH2 Authentication Implementation",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 41,
        "minutes": 52
      }
    ],
    "minutes": 87,
    "duration": "1h 27m",
    "questions": [
      "Name the four roles in OAuth 2.0.",
      "Authorization Code vs Client Credentials vs Implicit vs Password grant. Which is deprecated and why?",
      "Which grant did you use for machine-to-machine Snowflake auth? Why that one? (Client Credentials.)",
      "What is PKCE and what attack does it prevent?",
      "Why an access token AND a refresh token? Why not one long-lived token?",
      "Where do you store the client secret? (His answer: Azure Key Vault. Expect a follow-up on rotation.)",
      "OAuth vs OIDC — what does OIDC add?",
      "How do you revoke a token before it expires?"
    ]
  },
  {
    "id": "SPRING-11",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P2",
    "title": "Filters vs interceptors — and where tenant resolution goes",
    "why": "",
    "resources": [
      {
        "id": "SPRING-11-r1",
        "kind": "video",
        "title": "Spring boot: Custom Interceptors | How to Intercept Incoming HTTP Request and Custom Annotations",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 18,
        "minutes": 30
      },
      {
        "id": "SPRING-11-r2",
        "kind": "video",
        "title": "Spring boot: Filters vs Interceptors | Filters and Interceptors Advantage and UseCases for both",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 19,
        "minutes": 24
      }
    ],
    "minutes": 54,
    "duration": "54m",
    "questions": [
      "Where does each sit in the request pipeline?",
      "Which one can see the handler method?",
      "Which runs first?",
      "Where do you put tenant resolution in a multi-tenant app, and why?"
    ]
  },
  {
    "id": "SPRING-12",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P2",
    "title": "Criteria API & Specifications — dynamic queries",
    "why": "",
    "resources": [
      {
        "id": "SPRING-12-r1",
        "kind": "video",
        "title": "Spring boot: JPA (Part-9) | Native Query and Criteria API",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 31,
        "minutes": 44
      },
      {
        "id": "SPRING-12-r2",
        "kind": "video",
        "title": "Spring boot: JPA (Part-10) | Specification API, Problem with Criteria API and its solution",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 32,
        "minutes": 14
      }
    ],
    "minutes": 58,
    "duration": "58m",
    "questions": [
      "When do you need dynamic queries?",
      "Criteria API vs Specification — what problem does Specification solve?",
      "How do you compose filters safely without SQL injection?",
      "Why is Criteria API considered unreadable?"
    ]
  },
  {
    "id": "SPRING-13",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P2",
    "title": "Method security — @PreAuthorize & @PostAuthorize",
    "why": "",
    "resources": [
      {
        "id": "SPRING-13-r1",
        "kind": "video",
        "title": "Spring boot: Security (Part-9) | Method Security | Role based Authorization | @PreAuthorize and Post",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 42,
        "minutes": 29
      }
    ],
    "minutes": 29,
    "duration": "29m",
    "questions": [
      "@PreAuthorize vs @Secured vs @RolesAllowed.",
      "@PreAuthorize vs @PostAuthorize — when is Post necessary and what's the risk?",
      "Why does method security also fail on self-invocation? (Same proxy mechanism — link back to P0-02.)"
    ]
  },
  {
    "id": "SPRING-14",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P2",
    "title": "Actuator, health probes & metrics",
    "why": "",
    "resources": [
      {
        "id": "SPRING-14-r1",
        "kind": "video",
        "title": "Spring Boot Actuator in depth",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 43,
        "minutes": 31
      }
    ],
    "minutes": 31,
    "duration": "31m",
    "questions": [
      "Liveness vs readiness probe — what does K8s do differently with each?",
      "Which endpoints must never be public?",
      "How do you add a custom health indicator?",
      "How do actuator metrics reach Prometheus?"
    ]
  },
  {
    "id": "SPRING-15",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P2",
    "title": "Web attacks — CSRF, XSS, CORS, SQL injection",
    "why": "",
    "resources": [
      {
        "id": "SPRING-15-r1",
        "kind": "video",
        "title": "Understand Attacks: CSRF, XSS, CORS, SQL Injection with DEMO | Spring Security",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 33,
        "minutes": 25
      }
    ],
    "minutes": 25,
    "duration": "25m",
    "questions": [
      "Why can you disable CSRF for a stateless JWT API?",
      "CORS is enforced by whom — server or browser?",
      "How does a PreparedStatement actually prevent SQL injection?",
      "Stored vs reflected XSS."
    ]
  },
  {
    "id": "SPRING-16",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P2",
    "title": "JPA second-level cache",
    "why": "",
    "resources": [
      {
        "id": "SPRING-16-r1",
        "kind": "video",
        "title": "Spring boot: JPA (Part-4) | Second Level Caching | L2 Caching",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 26,
        "minutes": 41
      }
    ],
    "minutes": 41,
    "duration": "41m",
    "questions": [
      "L1 vs L2 — scope and lifetime of each.",
      "When does L2 hurt?",
      "How do you invalidate L2 across multiple app instances?",
      "Query cache — why is it usually a trap?",
      "How does Redis fit as an L2 provider?"
    ]
  },
  {
    "id": "DATA-01",
    "section": "data",
    "sectionLabel": "Databases & Caching",
    "priority": "P0",
    "title": "SQL & indexing — B-Tree, composite indexes, EXPLAIN, join order",
    "why": "MISSING FROM THE OLD PLAN, and it is a standing round of its own. Write-ups put SQL beside Core Java and Spring Boot; 2026 guides stress index-vs-scan reasoning and reading a plan. You claim PostgreSQL and a GIN/B-Tree/HNSW index design — this will be probed.",
    "resources": [
      {
        "id": "DATA-01-r1",
        "kind": "doc",
        "title": "Use The Index, Luke! — SQL indexing and tuning for developers",
        "source": "use-the-index-luke.com",
        "url": "https://use-the-index-luke.com/sql/table-of-contents",
        "minutes": 90,
        "note": "Read: Anatomy of an Index, The Where Clause, Sorting & Grouping, Partial Results. Skip the rest."
      }
    ],
    "minutes": 90,
    "duration": "1h 30m",
    "questions": [
      "How does a B-Tree index actually answer a range query? Why is lookup logarithmic and not constant?",
      "Composite index on (a, b, c): which of these use it — WHERE b = ?, WHERE a = ? AND c = ?, ORDER BY a, b?",
      "What is a covering index, and how would you know from a plan that you got one?",
      "Read this plan: Seq Scan on a 50M-row table with a filter. Give three reasons the index was not used.",
      "Why can a query get SLOWER after you add an index? Name two mechanisms.",
      "LIKE 'abc%' vs LIKE '%abc' — which can use a B-Tree and why?",
      "What does an index cost you on write paths? How many indexes is too many?",
      "GIN vs B-Tree — what is GIN for, and why did your log search need it?",
      "Pagination with OFFSET 100000 — why is it slow, and what is keyset pagination?",
      "How do you find the slow query in production in the first place? (pg_stat_statements, auto_explain.)",
      "Your ORM generated the query. How do you see the real SQL and its plan?",
      "When is a full table scan the RIGHT plan?"
    ]
  },
  {
    "id": "DATA-02",
    "section": "data",
    "sectionLabel": "Databases & Caching",
    "priority": "P0",
    "title": "Redis & caching patterns",
    "why": "MISSING FROM THE OLD PLAN. Redis and Caching are both listed on your resume, and your LLM agent stages writes in Redis — expect the consistency question. Cache-aside, invalidation, stampede and distributed locks are standard asks.",
    "resources": [
      {
        "id": "DATA-02-r1",
        "kind": "video",
        "title": "Spring Boot | Spring Data Redis as Cache | @Cacheable | @CacheEvict | @CachePut",
        "source": "Java Techie",
        "url": "https://www.youtube.com/watch?v=vpe4aDu5ixI",
        "minutes": 25,
        "note": ""
      },
      {
        "id": "DATA-02-r2",
        "kind": "doc",
        "title": "Redis — data types & key eviction",
        "source": "redis.io",
        "url": "https://redis.io/docs/latest/develop/data-types/",
        "minutes": 20,
        "note": "Enough to say which structure you'd pick and why; skip the command reference."
      }
    ],
    "minutes": 45,
    "duration": "45m",
    "questions": [
      "Cache-aside vs write-through vs write-behind — which do you run, and what does each lose on failure?",
      "@Cacheable, @CachePut, @CacheEvict — what does each do, and what is the self-invocation trap? (Same proxy mechanism as @Transactional.)",
      "Redis write succeeds, Postgres write fails. What is the state of the world, and how do you recover? ← your Base+Overlay design",
      "Two nodes invalidate the same key at once. What guarantees do you actually have?",
      "What is a cache stampede? Give two mitigations. (Distributed lock on recompute; probabilistic early expiry.)",
      "Implement a distributed lock in Redis. Why SET key val NX PX, why a random token, and why is releasing it not a plain DEL?",
      "Why is a Redis-based lock not safe under partition? (Say the honest thing — it is a lease, not a lock.)",
      "Which Redis data structure for: a session, a leaderboard, a rate limiter, a job queue?",
      "TTL strategy: how do you pick one, and what happens at the moment everything expires together?",
      "Redis is single-threaded — why is that a feature, and what does it mean for a slow command?",
      "How do you cap memory, and what does each eviction policy do? (allkeys-lru vs volatile-ttl vs noeviction.)",
      "Your cache hit rate drops from 95% to 40% overnight. Walk your investigation."
    ]
  },
  {
    "id": "DATA-03",
    "section": "data",
    "sectionLabel": "Databases & Caching",
    "priority": "P1",
    "title": "Postgres transactions, MVCC, locking & connection pooling",
    "why": "MISSING FROM THE OLD PLAN. The old plan taught JPA isolation levels but never the database that implements them. Long transactions, lock waits and pool exhaustion are the incidents you will be asked to debug.",
    "resources": [
      {
        "id": "DATA-03-r1",
        "kind": "doc",
        "title": "PostgreSQL — Chapter 13: Concurrency Control (MVCC & transaction isolation)",
        "source": "postgresql.org",
        "url": "https://www.postgresql.org/docs/current/mvcc.html",
        "minutes": 45,
        "note": "Sections 13.1–13.3 only."
      }
    ],
    "minutes": 45,
    "duration": "45m",
    "questions": [
      "What does MVCC actually do — how can a reader not block a writer?",
      "PostgreSQL's default isolation level is Read Committed. What anomaly does that still allow?",
      "Repeatable Read in Postgres vs the SQL standard — what does Postgres give you that the standard doesn't require?",
      "SELECT FOR UPDATE — when do you need it, and what does it do to concurrent readers?",
      "Two transactions update the same two rows in opposite order. What does Postgres do, and who wins?",
      "What is a long-running transaction's real cost? (Bloat, vacuum starvation, held connections.)",
      "What is autovacuum for, and what breaks when it can't keep up?",
      "HikariCP: pool size 10, 200 concurrent requests. What happens, and what does the caller see?",
      "How do you size a connection pool? Why is 'more connections' usually the wrong fix?",
      "Your @Transactional method makes an HTTP call in the middle. What is wrong with that at 1,000 tenants?",
      "Optimistic vs pessimistic locking in JPA — which did you use, and what does @Version cost you?",
      "Deadlock in production: how do you find the two statements involved?"
    ]
  },
  {
    "id": "KAFKA-01",
    "section": "kafka",
    "sectionLabel": "Kafka & Messaging",
    "priority": "P0",
    "title": "Kafka fundamentals & consumer groups",
    "why": "Raised from P1. Kafka is on your resume and drives LogLens; current guides list consumer-group and rebalance mechanics as standard for experienced Java devs.",
    "resources": [
      {
        "id": "KAFKA-01-r1",
        "kind": "video",
        "title": "Apache Kafka Components & Architecture Detailed Explanation in 15 min",
        "source": "Java Techie",
        "playlist": "Kafka for beginners",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxwpWGoNokohsSW2CysI6lDc",
        "position": 2,
        "minutes": 16
      },
      {
        "id": "KAFKA-01-r2",
        "kind": "video",
        "title": "Apache Kafka Producer Example using SpringBoot 3.x",
        "source": "Java Techie",
        "playlist": "Kafka for beginners",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxwpWGoNokohsSW2CysI6lDc",
        "position": 7,
        "minutes": 26
      },
      {
        "id": "KAFKA-01-r3",
        "kind": "video",
        "title": "Apache Kafka Consumer Example using SpringBoot 3 | Consumer Groups",
        "source": "Java Techie",
        "playlist": "Kafka for beginners",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxwpWGoNokohsSW2CysI6lDc",
        "position": 8,
        "minutes": 28
      }
    ],
    "minutes": 70,
    "duration": "1h 10m",
    "questions": [
      "Topic, partition, offset, consumer group — define each and how they interact.",
      "3 partitions, 5 consumers in one group. What happens to consumer 4 and 5?",
      "How does Kafka decide which partition a message goes to?",
      "What triggers a consumer group rebalance? What's the cost?",
      "What is ISR? What does acks=all actually wait for?",
      "Where does Kafka store consumer offsets?",
      "How does Kafka achieve high throughput? (Sequential IO, zero-copy, batching.)",
      "Kafka vs RabbitMQ — when would you pick each?",
      "What triggers a rebalance, and what does StickyAssignor change about it?",
      "Your consumer takes 40s per message and max.poll.interval.ms is 300000 with max.poll.records 500. What goes wrong?",
      "Which metrics tell you a consumer is falling behind vs failing to commit? (records-lag-max vs commit-rate.)"
    ]
  },
  {
    "id": "KAFKA-02",
    "section": "kafka",
    "sectionLabel": "Kafka & Messaging",
    "priority": "P0",
    "title": "Ordering, idempotency & exactly-once effects",
    "why": "Your headline resume claim: at-least-once delivery turned into exactly-once effects. If one Kafka topic is P0, it is this one.",
    "resources": [
      {
        "id": "KAFKA-02-r1",
        "kind": "video",
        "title": "Does Kafka Guarantee Message Ordering? | Microservices Fix Inside!",
        "source": "Java Techie",
        "playlist": "Kafka for beginners",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxwpWGoNokohsSW2CysI6lDc",
        "position": 15,
        "minutes": 28
      },
      {
        "id": "KAFKA-02-r2",
        "kind": "video",
        "title": "Why Kafka Processes the Same Message Twice? | Kafka Idempotency Real-Time Example",
        "source": "Java Techie",
        "playlist": "Kafka for beginners",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxwpWGoNokohsSW2CysI6lDc",
        "position": 16,
        "minutes": 24
      }
    ],
    "minutes": 52,
    "duration": "52m",
    "questions": [
      "Consumer crashes after processing but before committing the offset. What happens on restart?",
      "At-least-once vs at-most-once vs exactly-once. Which is Kafka's default?",
      "How did LogLens turn at-least-once delivery into exactly-once effects? (Fingerprint-keyed idempotent upserts + commit-after-durable-write. He must say this fluently.)",
      "What ordering does Kafka actually guarantee — and at what scope?",
      "You need global ordering across a topic. What are you forced to give up?",
      "Auto-commit vs manual commit. Why is auto-commit dangerous?",
      "What is the idempotent producer, and what does it protect against?",
      "Kafka transactions — what do they cover and what do they not?",
      "enable.idempotence=true is set. Can a downstream sink still see duplicates? Why?",
      "Where exactly do you commit the offset relative to the durable write, and what does each ordering cost you?"
    ]
  },
  {
    "id": "KAFKA-03",
    "section": "kafka",
    "sectionLabel": "Kafka & Messaging",
    "priority": "P1",
    "title": "Error handling, retries & dead-letter topics",
    "why": "",
    "resources": [
      {
        "id": "KAFKA-03-r1",
        "kind": "video",
        "title": "Kafka Error Handling with Spring Boot | Retry Strategies & Dead Letter Topics",
        "source": "Java Techie",
        "playlist": "Kafka for beginners",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxwpWGoNokohsSW2CysI6lDc",
        "position": 13,
        "minutes": 29
      }
    ],
    "minutes": 29,
    "duration": "29m",
    "questions": [
      "A poison-pill message fails forever. What happens to the partition without a DLT?",
      "Blocking vs non-blocking retry — what does blocking retry do to the rest of the partition?",
      "How do you design a DLT? What metadata goes on the message?",
      "How do you replay from a DLT safely?",
      "Retryable vs non-retryable exceptions — how do you classify them?"
    ]
  },
  {
    "id": "PLAT-01",
    "section": "platform",
    "sectionLabel": "Microservices & Platform",
    "priority": "P1",
    "title": "Distributed data — saga, outbox, idempotency & eventual consistency",
    "why": "MISSING FROM THE OLD PLAN. Saga/compensation/idempotency is called out as an SDE-2-level expectation, and it is the theory behind what you already built in LogLens.",
    "resources": [
      {
        "id": "PLAT-01-r1",
        "kind": "doc",
        "title": "Pattern: Saga",
        "source": "microservices.io",
        "url": "https://microservices.io/patterns/data/saga.html",
        "minutes": 40,
        "note": "Also read Database per service and Transactional outbox from the same pattern language."
      }
    ],
    "minutes": 40,
    "duration": "40m",
    "questions": [
      "Why can't you just use a distributed transaction (2PC) across services? What does it cost you?",
      "Saga: choreography vs orchestration. Which did you pick, and when does the other win?",
      "What is a compensating transaction, and why must it be idempotent?",
      "Your compensation itself fails. Now what?",
      "What is the dual-write problem, and how does the transactional outbox fix it?",
      "Design an idempotency key for an at-least-once consumer. What do you key on, and where does state live? ← your fingerprint-keyed upserts",
      "Eventual consistency: how do you explain the user-visible behaviour to a product manager?",
      "How do you test a saga's failure paths?"
    ]
  },
  {
    "id": "PLAT-02",
    "section": "platform",
    "sectionLabel": "Microservices & Platform",
    "priority": "P1",
    "title": "Resiliency — circuit breaker, retry, backoff & bulkhead",
    "why": "",
    "resources": [
      {
        "id": "PLAT-02-r1",
        "kind": "video",
        "title": "Microservice | Resilience4J Circuit Breaker Implementation on Spring Boot",
        "source": "Java Techie",
        "playlist": "Microservice",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxxWhFkucZBoMxeYE6qTgEF8",
        "position": 10,
        "minutes": 25
      },
      {
        "id": "PLAT-02-r2",
        "kind": "video",
        "title": "Microservice | Resilience4J Retry Module Implementation With Spring Boot",
        "source": "Java Techie",
        "playlist": "Microservice",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxxWhFkucZBoMxeYE6qTgEF8",
        "position": 11,
        "minutes": 13
      }
    ],
    "minutes": 38,
    "duration": "38m",
    "questions": [
      "Three circuit breaker states and every transition. What triggers each?",
      "Breaker is OPEN. A request arrives. What does the caller see?",
      "How does it decide to try again? What is HALF_OPEN?",
      "How do you tune failure threshold and wait duration? What goes wrong at each extreme?",
      "Retry + circuit breaker together — what's the ordering trap?",
      "Why is naive retry dangerous during an outage? (Retry storm, thundering herd.)",
      "What is exponential backoff with jitter and why the jitter?",
      "Bulkhead vs circuit breaker — what does each protect?"
    ]
  },
  {
    "id": "PLAT-03",
    "section": "platform",
    "sectionLabel": "Microservices & Platform",
    "priority": "P1",
    "title": "Service discovery & API gateway",
    "why": "Backs your zero-downtime dual-APIM migration.",
    "resources": [
      {
        "id": "PLAT-03-r1",
        "kind": "video",
        "title": "Microservice | Spring Cloud Eureka + API Gateway + Spring Cloud Hystrix | PART-1",
        "source": "Java Techie",
        "playlist": "Microservice",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxxWhFkucZBoMxeYE6qTgEF8",
        "position": 1,
        "minutes": 40
      },
      {
        "id": "PLAT-03-r2",
        "kind": "video",
        "title": "Microservice | Spring Cloud Eureka + Gateway + Hystrix | PART-2",
        "source": "Java Techie",
        "playlist": "Microservice",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxxWhFkucZBoMxeYE6qTgEF8",
        "position": 2,
        "minutes": 18
      }
    ],
    "minutes": 58,
    "duration": "58m",
    "questions": [
      "Client-side vs server-side discovery. Which is Eureka?",
      "What happens to in-flight requests when a service instance dies?",
      "What is Eureka self-preservation mode and why does it exist?",
      "What belongs in a gateway vs in the service itself?",
      "How did you verify zero downtime in your dual-gateway migration? What was your rollback trigger?",
      "How does the gateway propagate identity to downstream services?",
      "Isn't the gateway a single point of failure? How do you address that?"
    ]
  },
  {
    "id": "PLAT-04",
    "section": "platform",
    "sectionLabel": "Microservices & Platform",
    "priority": "P1",
    "title": "Docker — images, layers & containerising a Spring Boot service",
    "why": "MISSING FROM THE OLD PLAN, which jumped straight to Kubernetes. Docker is named directly in an SDE-2 round write-up, and it is on your resume.",
    "resources": [
      {
        "id": "PLAT-04-r1",
        "kind": "video",
        "title": "Docker — Dockerizing your Spring Boot Application",
        "source": "Java Techie",
        "url": "https://www.youtube.com/watch?v=e3YERpG2rMs",
        "minutes": 20,
        "note": ""
      },
      {
        "id": "PLAT-04-r2",
        "kind": "doc",
        "title": "Java Techie — Docker playlist (for anything the above leaves open)",
        "source": "youtube.com",
        "url": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxzMiFDnwxUDxmuZQU3igcBb",
        "minutes": 0,
        "note": ""
      }
    ],
    "minutes": 20,
    "duration": "20m+",
    "questions": [
      "Container vs VM — what is actually shared, and what isolates them? (Namespaces, cgroups.)",
      "What is a layer? Why does the ORDER of Dockerfile instructions change your build time?",
      "Why is a multi-stage build the norm for a Spring Boot jar, and what does it save?",
      "COPY vs ADD; CMD vs ENTRYPOINT — the difference and when it bites.",
      "How do you keep an image small, and why does that matter beyond disk?",
      "Your JVM inside a container ignores the memory limit and gets OOM-killed. What's the fix? (Container-aware flags / MaxRAMPercentage.)",
      "Where do logs and config belong for a containerised service, and why not in the image?",
      "How would you debug a container that exits immediately on start?"
    ]
  },
  {
    "id": "PLAT-05",
    "section": "platform",
    "sectionLabel": "Microservices & Platform",
    "priority": "P2",
    "title": "Kubernetes basics — pods, deployments, services",
    "why": "",
    "resources": [
      {
        "id": "PLAT-05-r1",
        "kind": "video",
        "title": "Kubernetes Tutorial | Basic Introduction and Getting Started part-1",
        "source": "Java Techie",
        "playlist": "Kubernetes",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxybsyOxK7WFtteH42ayn5i9",
        "position": 1,
        "minutes": 6
      },
      {
        "id": "PLAT-05-r2",
        "kind": "video",
        "title": "Kubernetes Tutorial | K8s Components Explained in 10 mins | Part-2",
        "source": "Java Techie",
        "playlist": "Kubernetes",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxybsyOxK7WFtteH42ayn5i9",
        "position": 2,
        "minutes": 10
      },
      {
        "id": "PLAT-05-r3",
        "kind": "video",
        "title": "Kubernetes Tutorial | Kubernetes Basics & Architecture Explained in 10 mins | Part-3",
        "source": "Java Techie",
        "playlist": "Kubernetes",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxybsyOxK7WFtteH42ayn5i9",
        "position": 3,
        "minutes": 11
      }
    ],
    "minutes": 27,
    "duration": "27m",
    "questions": [
      "Pod vs Deployment vs Service vs ReplicaSet.",
      "What does the control plane do?",
      "Which Service type for external traffic?",
      "What happens when a pod fails a liveness probe?"
    ]
  },
  {
    "id": "PLAT-06",
    "section": "platform",
    "sectionLabel": "Microservices & Platform",
    "priority": "P2",
    "title": "K8s deployment, ConfigMaps/Secrets, probes & resource limits",
    "why": "",
    "resources": [
      {
        "id": "PLAT-06-r1",
        "kind": "video",
        "title": "Kubernetes Tutorial | Run & Deploy Spring Boot Application in K8s Cluster using yaml configuration",
        "source": "Java Techie",
        "playlist": "Kubernetes",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxybsyOxK7WFtteH42ayn5i9",
        "position": 6,
        "minutes": 21
      },
      {
        "id": "PLAT-06-r2",
        "kind": "video",
        "title": "Kubernetes Tutorial | ConfigMap & Secrets Implementation in Spring Boot CRUD Example",
        "source": "Java Techie",
        "playlist": "Kubernetes",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxybsyOxK7WFtteH42ayn5i9",
        "position": 8,
        "minutes": 28
      }
    ],
    "minutes": 49,
    "duration": "49m",
    "questions": [
      "Resource requests vs limits — what happens when each is exceeded?",
      "Why does a container OOM-kill even when JVM heap looks healthy? (Link to P1-22.)",
      "ConfigMap vs Secret — is a Secret encrypted by default?",
      "Rolling update — how does K8s guarantee zero downtime?",
      "How do config changes reach a running pod?"
    ]
  },
  {
    "id": "PLAT-07",
    "section": "platform",
    "sectionLabel": "Microservices & Platform",
    "priority": "P2",
    "title": "Distributed tracing & correlation",
    "why": "",
    "resources": [
      {
        "id": "PLAT-07-r1",
        "kind": "video",
        "title": "Microservice | Distributed log tracing using Spring Cloud Sleuth & Zipkin | PART-7",
        "source": "Java Techie",
        "playlist": "Microservice",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxxWhFkucZBoMxeYE6qTgEF8",
        "position": 7,
        "minutes": 15
      }
    ],
    "minutes": 15,
    "duration": "15m",
    "questions": [
      "Trace ID vs span ID — what does each identify?",
      "How does the trace ID survive a hop into an async thread or a Kafka message?",
      "What is context propagation and where does it typically break?",
      "How do you correlate a tenant with a trace in a multi-tenant system?",
      "What is sampling and why can't you trace 100% in production?"
    ]
  },
  {
    "id": "TEST-01",
    "section": "testing",
    "sectionLabel": "Testing & Delivery",
    "priority": "P1",
    "title": "JUnit 5 & Mockito",
    "why": "MISSING FROM THE OLD PLAN despite JUnit and Mockito being on your resume and you claiming 90%+ coverage. @Mock vs @InjectMocks vs @MockBean is a standard question, and 'how do you test this?' follows most design answers.",
    "resources": [
      {
        "id": "TEST-01-r1",
        "kind": "video",
        "title": "Spring Boot Testing | Writing JUnit Tests using JUnit and Mockito",
        "source": "Java Techie",
        "url": "https://www.youtube.com/watch?v=kXhYu939_5s",
        "minutes": 30,
        "note": ""
      }
    ],
    "minutes": 30,
    "duration": "30m",
    "questions": [
      "@Mock vs @InjectMocks vs @Spy vs @MockBean — what does each do, and which needs a Spring context?",
      "when/thenReturn vs doReturn/when — when are they not interchangeable?",
      "How do you verify an interaction, and how do you assert on the argument that was passed? (ArgumentCaptor.)",
      "How do you test a void method that throws?",
      "You cannot mock a static or final method with plain Mockito — what are your options, and what does needing one tell you about the design?",
      "What belongs in a unit test vs an integration test? Where do you draw the line in a Spring service?",
      "90% coverage and a bug still shipped. What was the test suite not measuring?",
      "How do you test time-dependent code without Thread.sleep?",
      "How do you test a @Transactional method's rollback behaviour?"
    ]
  },
  {
    "id": "TEST-02",
    "section": "testing",
    "sectionLabel": "Testing & Delivery",
    "priority": "P1",
    "title": "Testcontainers & Spring Boot test slices",
    "why": "MISSING FROM THE OLD PLAN — and you BUILT your team's Postgres-Testcontainers regression framework gating every PR. This is a story you should be able to tell cold; instead it had no card.",
    "resources": [
      {
        "id": "TEST-02-r1",
        "kind": "video",
        "title": "Spring Boot 3 Integration Testing With TestContainers | JUnit 5",
        "source": "Java Techie",
        "url": "https://www.youtube.com/watch?v=Q-0Z6KZF1xM",
        "minutes": 30,
        "note": ""
      }
    ],
    "minutes": 30,
    "duration": "30m",
    "questions": [
      "Why Testcontainers over H2 for a Postgres app? Name a bug H2 would hide.",
      "What does @DataJpaTest give you, and what does it replace by default? How do you stop it swapping your datasource?",
      "@SpringBootTest vs a slice (@WebMvcTest / @DataJpaTest) — cost, and what each actually proves.",
      "Containers are slow to start. How do you keep a suite fast? (Reuse, singleton container, @ServiceConnection.)",
      "How do you keep tests isolated when they share one database container?",
      "Walk me through the regression framework you built: what gates a merge, and what happens when it goes red?",
      "How do you test a Kafka consumer end to end?",
      "Flaky integration test — how do you find the cause instead of retrying it?"
    ]
  },
  {
    "id": "TEST-03",
    "section": "testing",
    "sectionLabel": "Testing & Delivery",
    "priority": "P2",
    "title": "CI/CD with GitHub Actions & release safety",
    "why": "On your resume (batch regression + quality dashboard across 7 repos). Rarely a whole round, but it comes up as 'how does your code reach production?'.",
    "resources": [
      {
        "id": "TEST-03-r1",
        "kind": "self",
        "title": "Your own workflows",
        "source": "Your own codebase",
        "minutes": 0,
        "note": "Re-read the batch regression and master quality workflows, and the Pages dashboard job. No video will teach you your own pipeline."
      }
    ],
    "minutes": 0,
    "duration": "—",
    "questions": [
      "Walk your pipeline from a push to a deployed artifact. What gates exist, and which can be skipped?",
      "How do you run the same workflow across 7 repositories without maintaining 7 copies? (Reusable workflows / composite actions.)",
      "Where do secrets live, and how do you keep them out of logs?",
      "A regression suite takes 40 minutes. How do you decide what runs per PR vs nightly?",
      "How do you roll back a bad deploy, and how fast can you actually do it?",
      "What makes a build reproducible? Where does your pipeline break that?"
    ]
  },
  {
    "id": "SELF-01",
    "section": "resume",
    "sectionLabel": "Your Systems — resume defence",
    "priority": "P0",
    "title": "Multi-tenancy, sharding & runtime datasource routing",
    "why": "The most distinctive thing on your resume: feature-flag-controlled Snowflake routing across three modes, lazy datasource init, 1,000+ tenants. An interviewer probing your own bullets is the round you cannot bluff.",
    "resources": [
      {
        "id": "SELF-01-r1",
        "kind": "self",
        "title": "The routing framework you built",
        "source": "Your own codebase",
        "minutes": 0,
        "note": "Write down the WHY for each decision: three modes, lazy init, the tenant-mapping API, and what you would change now."
      }
    ],
    "minutes": 0,
    "duration": "—",
    "questions": [
      "How does an incoming request find its tenant's shard? Walk the whole path.",
      "The tenant-mapping API is down. What happens to in-flight requests, and what happens to new ones?",
      "Your feature flag flips mid-request. What happens?",
      "@ConditionalOnProperty is evaluated at startup — so how is your flag togglable at runtime at all?",
      "Why lazy datasource initialisation? What breaks if you eagerly initialise 1,000 datasources?",
      "How many connection pools exist in your JVM at steady state? What is the memory and connection cost?",
      "Schema-per-tenant vs database-per-tenant vs discriminator column — which did you use and what does it cost?",
      "How do you stop tenant A's query from ever seeing tenant B's rows? Prove it, don't assert it.",
      "A single tenant's load degrades everyone (noisy neighbour). How would you contain it?",
      "How did you test the sharded path? What did you not test?",
      "The 10% batch runtime cut — where did the time actually go, and how did you measure it?"
    ]
  },
  {
    "id": "SELF-02",
    "section": "resume",
    "sectionLabel": "Your Systems — resume defence",
    "priority": "P0",
    "title": "Exactly-once effects on at-least-once delivery (LogLens)",
    "why": "You claim it in one line on the resume. Expect the full walk-through: consumer dies after processing, before commit.",
    "resources": [
      {
        "id": "SELF-02-r1",
        "kind": "self",
        "title": "The LogLens ingest path",
        "source": "Your own codebase",
        "minutes": 0,
        "note": "Reconstruct the exact ordering: ranged blob read → parse → durable upsert → offset commit. Know what is idempotent and what is not."
      }
    ],
    "minutes": 0,
    "duration": "—",
    "questions": [
      "Consumer crashes after the durable write but before the offset commit. Walk the restart.",
      "What exactly is in the fingerprint key, and what happens if two different log lines collide on it?",
      "Where is the upsert idempotent — the database, the application, or both? Show the constraint.",
      "Why not Kafka transactions / exactly-once semantics? What did you trade away by not using them?",
      "Constant-heap ingest at any file size — how? What is the actual memory ceiling and what sets it?",
      "One window-aligned byte range fails permanently. What happens to the rest of the file?",
      "How would you prove, after a run, that nothing was double-counted?"
    ]
  },
  {
    "id": "SELF-03",
    "section": "resume",
    "sectionLabel": "Your Systems — resume defence",
    "priority": "P0",
    "title": "Redis-staged writes & Base+Overlay persistence",
    "why": "A distributed-consistency claim sitting in your GenAI bullet, but it is a backend question and it will be asked as one.",
    "resources": [
      {
        "id": "SELF-03-r1",
        "kind": "self",
        "title": "The data-management layer of the inventory agent",
        "source": "Your own codebase",
        "minutes": 0,
        "note": "Be able to draw the Base+Overlay model on a whiteboard, including what happens on approval, rejection and timeout."
      }
    ],
    "minutes": 0,
    "duration": "—",
    "questions": [
      "Why stage in Redis at all instead of writing straight to Postgres?",
      "Redis write succeeds, Postgres commit fails. What does the user see, and what cleans up?",
      "What is scenario-scoped Base+Overlay, and how does a read merge the two?",
      "The human approval never arrives. What happens to the staged write, and who decides the TTL?",
      "The underlying data changed while the approval was pending. Now what?",
      "Two planners stage conflicting overlays on the same rows. How is that resolved?",
      "How would you make the approval step survive a pod restart?"
    ]
  },
  {
    "id": "SELF-04",
    "section": "resume",
    "sectionLabel": "Your Systems — resume defence",
    "priority": "P1",
    "title": "Zero-downtime dual-gateway migration",
    "why": "",
    "resources": [
      {
        "id": "SELF-04-r1",
        "kind": "self",
        "title": "The Azure APIM ↔ Gravitee migration",
        "source": "Your own codebase",
        "minutes": 0,
        "note": "The interviewer wants your verification and rollback story, not the architecture diagram."
      }
    ],
    "minutes": 0,
    "duration": "—",
    "questions": [
      "How did you VERIFY zero downtime? What signal would have told you that you were wrong?",
      "What was the rollback trigger, and how long would a rollback have taken?",
      "How did identity propagate across sync, async and batch flows without the services caring which gateway they were behind?",
      "What is an adaptive S2S token, and what problem forced it?",
      "What broke first in staging, and what did that teach you?",
      "Isn't the gateway a single point of failure? How is that addressed?"
    ]
  },
  {
    "id": "SELF-05",
    "section": "resume",
    "sectionLabel": "Your Systems — resume defence",
    "priority": "P1",
    "title": "Sync/async fallback & the 10% timeout failure rate",
    "why": "",
    "resources": [
      {
        "id": "SELF-05-r1",
        "kind": "self",
        "title": "The Pack Service integration layer",
        "source": "Your own codebase",
        "minutes": 0,
        "note": "This is your cleanest 'I found a failure mode and killed it' story. Know the numbers."
      }
    ],
    "minutes": 0,
    "duration": "—",
    "questions": [
      "What was actually timing out, and how did you establish it was 10%?",
      "How does the sync path decide to fall back to async? What is the timeout, and how did you choose it?",
      "The async fallback also fails. What does the caller see?",
      "How do you avoid doing the work twice when the sync call actually succeeded after the timeout?",
      "Why a feature flag here — what were you protecting against?",
      "How would you design this today with virtual threads available?"
    ]
  }
];

export const CORE_STACK_PRIORITIES = ["P0","P1","P2"];

export const CORE_STACK_PRIORITY_CONFIG = {
  P0: { label: "P0", blurb: "Asked in nearly every loop, or a resume claim you can't fumble", cls: "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30" },
  P1: { label: "P1", blurb: "Very likely — do before any real interview", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  P2: { label: "P2", blurb: "Depth. Skip under time pressure", cls: "bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30" },
};

export const CORE_STACK_TOTAL = 52;

export const CORE_STACK_PRIORITY_COUNTS = {"P0":19,"P1":19,"P2":14};

export const CORE_STACK_SECTION_COUNTS = {"java":9,"concurrency":6,"spring":16,"data":3,"kafka":3,"platform":7,"testing":3,"resume":5};

export const CORE_STACK_MINUTES = 2817;
