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
    "why": "The single most reliably asked core-Java topic. 2025–26 SDE-2 write-ups still open with it: resize and rehashing, what changed in Java 8, how ConcurrentHashMap stays safe without a global lock, and whether a custom object can be a key.",
    "resources": [
      {
        "id": "JAVA-01-r1",
        "kind": "video",
        "title": "Collections in Java - Part1 | Java Collections Framework in depth",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 23,
        "minutes": 41,
        "note": ""
      },
      {
        "id": "JAVA-01-r2",
        "kind": "video",
        "title": "Collections in Java - Part4 | HashMap Internal Working in Java",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 26,
        "minutes": 58,
        "note": ""
      }
    ],
    "minutes": 99,
    "duration": "1h 39m",
    "questions": [
      "How does HashMap work internally — hashing, buckets and collisions?",
      "HashMap vs ConcurrentHashMap — how does ConcurrentHashMap stay thread-safe without locking the whole map?",
      "ArrayList vs LinkedList — and how does an ArrayList grow?",
      "What changed in HashMap in Java 8 (treeification)?",
      "What are load factor, resizing and rehashing in a HashMap?",
      "Fail-fast vs fail-safe iterators — what is ConcurrentModificationException?",
      "Explain the Collections framework hierarchy.",
      "How does HashSet work internally, and how does it detect duplicates?",
      "Implement your own HashMap (put / get) from scratch.",
      "Which collections are thread-safe — CopyOnWriteArrayList, synchronizedList, ConcurrentHashMap?",
      "HashMap vs Hashtable (and why can HashMap hold one null key)?",
      "Can a custom object be a HashMap key? What must it guarantee?"
    ],
    "asked": {
      "posts": 135,
      "items": 12
    }
  },
  {
    "id": "JAVA-02",
    "section": "java",
    "sectionLabel": "Java Core",
    "priority": "P0",
    "title": "Streams, lambdas & functional interfaces",
    "why": "Java 8 stream/lambda questions appear in essentially every loop at 2–4 years. This card is the theory; JAVA-10 is the live-coding half.",
    "resources": [
      {
        "id": "JAVA-02-r1",
        "kind": "video",
        "title": "Functional Interface and Lambda Expression - Java8 features | Java Interfaces Part3",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 17,
        "minutes": 32,
        "note": ""
      },
      {
        "id": "JAVA-02-r2",
        "kind": "video",
        "title": "Streams in Java8 | Collections in Java - Part7",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 29,
        "minutes": 75,
        "note": ""
      }
    ],
    "minutes": 107,
    "duration": "1h 47m",
    "questions": [
      "What is a lambda expression, and how does it relate to functional interfaces?",
      "What is a functional interface? Name the built-in ones.",
      "What are the main Java 8 features?",
      "What is a method reference?",
      "findFirst vs findAny — and toList() vs collect(Collectors.toList())?",
      "Intermediate vs terminal operations — and why are streams lazy?",
      "map vs flatMap?",
      "How do you handle exceptions inside a stream or lambda?"
    ],
    "asked": {
      "posts": 56,
      "items": 8
    }
  },
  {
    "id": "JAVA-10",
    "section": "java",
    "sectionLabel": "Java Core",
    "priority": "P0",
    "title": "Streams live-coding — the Employee / Transaction drill",
    "why": "NEW. Streams are tested by writing them, not describing them: \"customers whose total amount > 5000 from a transaction list\" was reported verbatim in a 2026 SDE-2 loop, and second-highest-salary and group-by-department variants recur across write-ups. Knowing what map and flatMap do is not the same as producing groupingBy + collectingAndThen under a timer.",
    "resources": [
      {
        "id": "JAVA-10-r1",
        "kind": "doc",
        "title": "Guide to Java groupingBy Collector",
        "source": "baeldung.com",
        "url": "https://www.baeldung.com/java-groupingby-collector",
        "minutes": 20,
        "estimate": true,
        "note": "Reference only. The drill is the prompts below — write each one in an IDE without looking, then check."
      }
    ],
    "minutes": 20,
    "duration": "≈20m",
    "questions": [
      "Group employees by department with streams — then count, average or list names per group.",
      "Split numbers into odd and even (or any two groups) with a single stream.",
      "Find the second-highest (or Nth highest) salary using streams.",
      "Given a list of employees, filter / sort / find the max with streams.",
      "Count character (or word) frequency in a string using streams.",
      "Find the first non-repeating (or first repeating) character using streams.",
      "Remove (or find) duplicates from a list using streams.",
      "Convert a List to a Map with streams — what happens on duplicate keys?",
      "Sort a map by its values (or keys) using streams."
    ],
    "asked": {
      "posts": 77,
      "items": 9
    }
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
        "title": "OOPs Concept in Java with Examples | 4 Pillars of Object Oriented Programming (OOPs)",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 2,
        "minutes": 97,
        "note": ""
      },
      {
        "id": "JAVA-03-r2",
        "kind": "video",
        "title": "Exception Handling in Java with Examples",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 20,
        "minutes": 75,
        "note": ""
      }
    ],
    "minutes": 172,
    "duration": "2h 52m",
    "questions": [
      "Explain the four pillars of OOP with real examples.",
      "Abstract class vs interface — which do you pick after Java 8?",
      "How does exception handling work — the hierarchy, try/catch/finally and propagation?",
      "Method overloading vs overriding — compile-time vs runtime polymorphism.",
      "final vs finally vs finalize — and what does the static keyword do?",
      "Diamond problem — how does Java handle multiple inheritance?",
      "Is Java pass-by-value or pass-by-reference?",
      "Checked vs unchecked exceptions — which do you throw from a service?",
      "What are default methods in interfaces, and why were they added?",
      "throw vs throws, and how do you write a custom exception?",
      "Composition vs inheritance — when do you prefer composition?"
    ],
    "asked": {
      "posts": 201,
      "items": 11
    }
  },
  {
    "id": "JAVA-06",
    "section": "java",
    "sectionLabel": "Java Core",
    "priority": "P0",
    "title": "Strings, immutability, equals/hashCode & singletons",
    "why": "Raised from P1 and widened to Strings. A 2026 SDE-2 write-up asked both \"why are Strings immutable?\" and \"why does double-checked locking break without volatile?\" by name, and String vs StringBuilder vs StringBuffer is on every 2026 core-Java list. Cheap to own, embarrassing to miss.",
    "resources": [
      {
        "id": "JAVA-06-r1",
        "kind": "video",
        "title": "Java Singleton and Immutable Class Explained with Examples | Java Classes in Depth - Part4",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 14,
        "minutes": 28,
        "note": ""
      },
      {
        "id": "JAVA-06-r2",
        "kind": "video",
        "title": "Java Variables - Part2 | Reference/Non-Primitive Data Types in Depth",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 7,
        "minutes": 43,
        "note": "The String, wrapper-class and autoboxing parts are what this card needs; the casting rules are revision."
      },
      {
        "id": "JAVA-06-r3",
        "kind": "video",
        "title": "Singleton and Double Checked Locking",
        "source": "Defog Tech",
        "playlist": "Java Concurrency",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLhfHPmPYPPRk6yMrcbfafFGSbE2EPK_A6",
        "position": 27,
        "minutes": 8,
        "note": ""
      }
    ],
    "minutes": 79,
    "duration": "1h 19m",
    "questions": [
      "Write a thread-safe Singleton — then make it lazy with double-checked locking. Why is volatile needed?",
      "equals() and hashCode() — what is the contract, and what breaks if you override only one?",
      "Why are Strings immutable? What is the String pool?",
      "How do you create an immutable class?",
      "Shallow copy vs deep copy?",
      "String vs StringBuilder vs StringBuffer — when do you use each?",
      "How does autoboxing work — and what is the Integer cache?",
      "How can a Singleton be broken (reflection, serialization, cloning) — and how do you stop it?"
    ],
    "asked": {
      "posts": 111,
      "items": 8
    }
  },
  {
    "id": "JAVA-04",
    "section": "java",
    "sectionLabel": "Java Core",
    "priority": "P0",
    "title": "JVM memory model & garbage collection",
    "why": "Raised from P1. Once a Java round gets past collections it usually reaches memory: young vs old generation, G1 vs Parallel, the OutOfMemoryError types, heap vs stack and strong/weak/soft references all show up in 2025–26 write-ups (an MNC Java backend round, a JPMorgan SDE-2 loop). One video, and your K8s pods make the container-vs-heap question personal.",
    "resources": [
      {
        "id": "JAVA-04-r1",
        "kind": "video",
        "title": "Java Memory Management and Garbage Collection in Depth",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 10,
        "minutes": 49,
        "note": ""
      }
    ],
    "minutes": 49,
    "duration": "49m",
    "questions": [
      "Stack vs heap memory — what lives where?",
      "How does garbage collection work — when is an object eligible, and what are the generations?",
      "OutOfMemoryError — what causes it, and what is a memory leak in Java?",
      "Explain the JVM architecture — class loader, runtime areas, JIT. JDK vs JRE vs JVM?",
      "Which GC algorithms do you know — Serial, Parallel, G1, ZGC? Which would you pick?",
      "Strong vs weak vs soft vs phantom references?",
      "What does System.gc() do?"
    ],
    "asked": {
      "posts": 108,
      "items": 7
    }
  },
  {
    "id": "JAVA-05",
    "section": "java",
    "sectionLabel": "Java Core",
    "priority": "P0",
    "title": "Java 17 → 25 — records, sealed types & pattern matching",
    "why": "Trimmed from five videos to three. What rounds name is records, sealed types and \"Java 8 vs 11 vs 17\" (Paytm, EPAM, and a 2026 MNC Java round that asked sealed classes, records and switch expressions). Switch expressions (#43) and instanceof pattern matching (#44) are syntax you can read in five minutes, not 32 minutes of video. Java 25 is the current LTS. Virtual threads are on CONC-11.",
    "resources": [
      {
        "id": "JAVA-05-r1",
        "kind": "video",
        "title": "Java 17: Sealed Classes and Interfaces",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 42,
        "minutes": 11,
        "note": ""
      },
      {
        "id": "JAVA-05-r2",
        "kind": "video",
        "title": "Java 21: Pattern Matching for switch",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 45,
        "minutes": 19,
        "note": "Assumes switch expressions (case ->, yield). If those are new, read them up first — five minutes."
      },
      {
        "id": "JAVA-05-r3",
        "kind": "video",
        "title": "Java 16: Record class",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 46,
        "minutes": 36,
        "note": ""
      }
    ],
    "minutes": 66,
    "duration": "1h 6m",
    "questions": [
      "Java 8 vs 11 vs 17 vs 21 — what changed that you actually use?",
      "What are sealed classes, and what do they give you?",
      "Pattern matching, switch expressions and text blocks — show an example.",
      "What are records — and when is a record the wrong choice?"
    ],
    "asked": {
      "posts": 18,
      "items": 4
    }
  },
  {
    "id": "JAVA-07",
    "section": "java",
    "sectionLabel": "Java Core",
    "priority": "P1",
    "title": "Generics & type erasure",
    "why": "Named in four 2024–26 loops (Truemeds, EPAM, HSBC, and a Walmart SDE-3 round that had candidates add generics to an LRU cache they had just written). Usually a quick-fire — type erasure, ? extends vs ? super — or a twist inside a coding round, not a round of its own.",
    "resources": [
      {
        "id": "JAVA-07-r1",
        "kind": "video",
        "title": "Java Generic Classes | Java Classes in Depth - Part2",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 12,
        "minutes": 52,
        "note": ""
      }
    ],
    "minutes": 52,
    "duration": "52m",
    "questions": [
      "What are generics, and what do they buy you?",
      "Make your class (e.g. the LRU cache you just wrote) generic.",
      "Wildcards: ? extends vs ? super — what is PECS?"
    ],
    "asked": {
      "posts": 8,
      "items": 3
    }
  },
  {
    "id": "JAVA-09",
    "section": "java",
    "sectionLabel": "Java Core",
    "priority": "P2",
    "title": "Comparable vs Comparator, TreeMap, LinkedHashMap & Set",
    "why": "Cheap points. Comparator questions show up constantly as a warm-up before something harder, and the JAVA-10 drill leans on them.",
    "resources": [
      {
        "id": "JAVA-09-r1",
        "kind": "video",
        "title": "Collections in Java - Part2 | Comparator Vs Comparable | PriorityQueue",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 24,
        "minutes": 61,
        "note": ""
      },
      {
        "id": "JAVA-09-r2",
        "kind": "video",
        "title": "Collections in Java - Part5 | LinkedHashMap and TreeMap in depth",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 27,
        "minutes": 37,
        "note": ""
      },
      {
        "id": "JAVA-09-r3",
        "kind": "video",
        "title": "Collections in Java - Part6 | SET",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 28,
        "minutes": 21,
        "note": ""
      }
    ],
    "minutes": 119,
    "duration": "1h 59m",
    "questions": [
      "Implement an LRU cache with O(1) get and put.",
      "HashMap vs LinkedHashMap vs TreeMap — how does each order keys, and how does TreeMap work inside?",
      "Implement an LFU cache.",
      "Comparable vs Comparator — when do you use which?",
      "Sort a list of custom objects by one or more fields.",
      "How does a PriorityQueue work — and can you build one from scratch?"
    ],
    "asked": {
      "posts": 105,
      "items": 6
    }
  },
  {
    "id": "JAVA-08",
    "section": "java",
    "sectionLabel": "Java Core",
    "priority": "P2",
    "title": "Optional — the API and its misuse",
    "why": "The playlist video (#48) runs 74 minutes. For a P2 card whose questions a 20-minute read answers, that is the wrong trade under a deadline — watch it later if you want the whole API.",
    "resources": [
      {
        "id": "JAVA-08-r1",
        "kind": "doc",
        "title": "Guide To Java Optional",
        "source": "baeldung.com",
        "url": "https://www.baeldung.com/java-optional",
        "minutes": 20,
        "estimate": true,
        "note": "Read creation, orElse vs orElseGet and map/flatMap. Skim the rest."
      }
    ],
    "minutes": 20,
    "duration": "≈20m",
    "questions": [
      "What is Optional for — and where should you not use it?"
    ],
    "asked": {
      "posts": 7,
      "items": 1
    }
  },
  {
    "id": "JAVA-11",
    "section": "java",
    "sectionLabel": "Java Core",
    "priority": "P1",
    "title": "Reflection, annotations, serialization & class loading",
    "why": "What Spring is built on. Rarely a round of its own, but it surfaces as a follow-up: reflection in a Jan 2026 Yes Madam SDE-2 round, custom annotations in the Spring lifecycle at Gartner, a reflection-proof singleton at Goldman Sachs. ClassNotFoundException vs NoClassDefFoundError is a classic production question. Trimmed to the reflection video: the 71-minute annotations video (#19) is too long for what gets asked — retention is one fact below, and SPRING-06 builds a custom annotation for real.",
    "resources": [
      {
        "id": "JAVA-11-r1",
        "kind": "video",
        "title": "Java Reflection in Depth (Using Examples)",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 18,
        "minutes": 38,
        "note": ""
      }
    ],
    "minutes": 38,
    "duration": "38m",
    "questions": [
      "Serialization — what do Serializable, transient and serialVersionUID do?",
      "What is reflection, and where do frameworks use it?",
      "How does class loading work — and ClassNotFoundException vs NoClassDefFoundError?",
      "How do you create a custom annotation, and what does @Retention do?"
    ],
    "asked": {
      "posts": 27,
      "items": 4
    }
  },
  {
    "id": "CONC-07",
    "section": "concurrency",
    "sectionLabel": "Concurrency & Multithreading",
    "priority": "P0",
    "title": "Threads vs processes & what each thread owns",
    "why": "The usual opener of a multithreading round, and the base for everything after it: what threads share (the heap) and what each keeps to itself (its stack) is why race conditions exist at all.",
    "resources": [
      {
        "id": "CONC-07-r1",
        "kind": "video",
        "title": "Multithreading and Concurrency in Java: Part1 | Threads, Process and their Memory Model in depth",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 30,
        "minutes": 48,
        "note": ""
      }
    ],
    "minutes": 48,
    "duration": "48m",
    "questions": [
      "Process vs thread — what does each own, and what do threads share?",
      "What is a race condition, and how do you prevent one?",
      "What is multithreading, and why use it in a backend service?",
      "What is context switching, and why do more threads stop helping?",
      "Concurrency vs parallelism?"
    ],
    "asked": {
      "posts": 80,
      "items": 5
    }
  },
  {
    "id": "CONC-08",
    "section": "concurrency",
    "sectionLabel": "Concurrency & Multithreading",
    "priority": "P0",
    "title": "Creating threads, the thread lifecycle & wait/notify",
    "why": "start() vs run(), the six thread states and wait vs sleep are asked in nearly every Java round, and wait/notify is what the live producer–consumer question is built on.",
    "resources": [
      {
        "id": "CONC-08-r1",
        "kind": "video",
        "title": "Thread Creation, Thread Lifecycle and Inter-Thread Communication | Multithreading in Java: Part2",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 31,
        "minutes": 68,
        "note": ""
      }
    ],
    "minutes": 68,
    "duration": "1h 8m",
    "questions": [
      "How does synchronized work — method vs block, static vs instance lock?",
      "How do you create a thread — extend Thread vs implement Runnable?",
      "Explain the thread lifecycle (states).",
      "How do threads communicate with wait() / notify()? Why call wait() in a loop?",
      "wait() vs sleep()?"
    ],
    "asked": {
      "posts": 28,
      "items": 5
    }
  },
  {
    "id": "CONC-09",
    "section": "concurrency",
    "sectionLabel": "Concurrency & Multithreading",
    "priority": "P1",
    "title": "join, daemon threads, interrupts & priority",
    "why": "join and daemon threads come up as quick checks, and \"how do you stop a thread?\" is a common follow-up. Thread priority is rarely asked — skim that part.",
    "resources": [
      {
        "id": "CONC-09-r1",
        "kind": "video",
        "title": "Thread Joining, Daemon Thread, Thread Priority | Multithreading in Java: Part3",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 32,
        "minutes": 45,
        "note": "Thread priority: skim. The OS may ignore it and it is rarely asked."
      }
    ],
    "minutes": 45,
    "duration": "45m",
    "questions": [
      "How do you stop a thread properly — what does interrupt() do?",
      "What does join() do?",
      "What is a daemon thread?"
    ],
    "asked": {
      "posts": 4,
      "items": 3
    }
  },
  {
    "id": "CONC-03",
    "section": "concurrency",
    "sectionLabel": "Concurrency & Multithreading",
    "priority": "P0",
    "title": "Locks & Conditions — ReentrantLock, ReadWrite, Stamped, Semaphore",
    "why": "\"synchronized vs ReentrantLock\" is one of the most reported concurrency questions. StampedLock is depth — skim it.",
    "resources": [
      {
        "id": "CONC-03-r1",
        "kind": "video",
        "title": "Locks and Condition | Java Multithreading Part4 | Reentrant, ReadWrite, Stamped & Semaphore Lock",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 33,
        "minutes": 47,
        "note": "StampedLock: skim, it is P2 depth."
      }
    ],
    "minutes": 47,
    "duration": "47m",
    "questions": [
      "Make this code thread-safe (a counter, a cache, a booking flow).",
      "What is a deadlock? Name the four conditions and how you prevent it.",
      "Semaphore vs mutex (lock)?",
      "synchronized vs ReentrantLock — when would you choose ReentrantLock?",
      "ReadWriteLock — when does it help?",
      "Deadlock vs livelock vs starvation?"
    ],
    "asked": {
      "posts": 113,
      "items": 6
    }
  },
  {
    "id": "CONC-02",
    "section": "concurrency",
    "sectionLabel": "Concurrency & Multithreading",
    "priority": "P0",
    "title": "volatile, atomics, CAS & the Java Memory Model",
    "why": "\"volatile vs atomic\" is reported almost verbatim in SDE-2 loops, and \"what is volatile for?\" came up again in a Sept 2025 Walmart SDE-2 round.",
    "resources": [
      {
        "id": "CONC-02-r1",
        "kind": "video",
        "title": "Lock-Free Concurrency | Compare-and-Swap | Atomic & Volatile Variables | Multithreading Part5",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 34,
        "minutes": 42,
        "note": ""
      },
      {
        "id": "CONC-02-r2",
        "kind": "video",
        "title": "Using volatile vs AtomicInteger in Java concurrency",
        "source": "Defog Tech",
        "playlist": "Java Concurrency",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLhfHPmPYPPRk6yMrcbfafFGSbE2EPK_A6",
        "position": 1,
        "minutes": 7,
        "note": ""
      },
      {
        "id": "CONC-02-r3",
        "kind": "video",
        "title": "Java Memory Model in 10 minutes",
        "source": "Defog Tech",
        "playlist": "Java Concurrency",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLhfHPmPYPPRk6yMrcbfafFGSbE2EPK_A6",
        "position": 4,
        "minutes": 11,
        "note": ""
      }
    ],
    "minutes": 60,
    "duration": "1h",
    "questions": [
      "What does volatile do — and why isn't it enough for count++?",
      "volatile vs synchronized vs AtomicInteger?",
      "What is CAS (compare-and-swap)?",
      "What is the Java Memory Model — what does happens-before mean?",
      "transient vs volatile?"
    ],
    "asked": {
      "posts": 34,
      "items": 5
    }
  },
  {
    "id": "CONC-01",
    "section": "concurrency",
    "sectionLabel": "Concurrency & Multithreading",
    "priority": "P0",
    "title": "Thread pools & ThreadPoolExecutor",
    "why": "Your resume says Multithreading & Concurrency and Asynchronous Processing. \"What happens when the queue is full?\" and pool sizing are asked in nearly every backend loop.",
    "resources": [
      {
        "id": "CONC-01-r1",
        "kind": "video",
        "title": "Thread Pools in Java | ThreadPoolExecutor Framework | Multithreading Part6",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 35,
        "minutes": 77,
        "note": ""
      }
    ],
    "minutes": 77,
    "duration": "1h 17m",
    "questions": [
      "What is ExecutorService — why use a thread pool instead of new Thread()?",
      "What is a BlockingQueue, and which implementation do you pick?",
      "Build your own thread pool.",
      "ThreadPoolExecutor: core size, max size, queue and rejection policy — what happens when the queue is full?"
    ],
    "asked": {
      "posts": 43,
      "items": 4
    }
  },
  {
    "id": "CONC-04",
    "section": "concurrency",
    "sectionLabel": "Concurrency & Multithreading",
    "priority": "P0",
    "title": "Future, Callable & CompletableFuture",
    "why": "CompletableFuture is asked by name in 2025–26 SDE-2 loops (PayPal, others): chaining, combining, error handling and which pool runs it. Defog #19 is the scatter–gather build they ask you to write.",
    "resources": [
      {
        "id": "CONC-04-r1",
        "kind": "video",
        "title": "Java8 CompletableFuture | Future and Callable in Java | Multithreading in Java - Part7",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 36,
        "minutes": 66,
        "note": ""
      },
      {
        "id": "CONC-04-r2",
        "kind": "video",
        "title": "Java Concurrency Interview: Implement Scatter Gather pattern",
        "source": "Defog Tech",
        "playlist": "Java Concurrency",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLhfHPmPYPPRk6yMrcbfafFGSbE2EPK_A6",
        "position": 19,
        "minutes": 10,
        "note": ""
      }
    ],
    "minutes": 76,
    "duration": "1h 16m",
    "questions": [
      "What is CompletableFuture — how do you chain, combine and handle errors?",
      "Runnable vs Callable?",
      "Call several services in parallel and combine the results (scatter-gather).",
      "Future vs CompletableFuture — what does Future not let you do?"
    ],
    "asked": {
      "posts": 15,
      "items": 4
    }
  },
  {
    "id": "CONC-05",
    "section": "concurrency",
    "sectionLabel": "Concurrency & Multithreading",
    "priority": "P1",
    "title": "ForkJoinPool, work stealing & the Executors factory pools",
    "why": "Raised from P2: the common ForkJoinPool runs both parallel streams and default CompletableFutures, so its traps come up whenever those do. The video also covers fixed vs cached pools — a frequent question.",
    "resources": [
      {
        "id": "CONC-05-r1",
        "kind": "video",
        "title": "Java ForkJoinPool || WorkStealingPool || FixedThreadPool || CachedThreadPool",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 37,
        "minutes": 39,
        "note": ""
      },
      {
        "id": "CONC-05-r2",
        "kind": "video",
        "title": "Understanding how ForkJoinPool works",
        "source": "Defog Tech",
        "playlist": "Java Concurrency",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLhfHPmPYPPRk6yMrcbfafFGSbE2EPK_A6",
        "position": 20,
        "minutes": 13,
        "note": ""
      }
    ],
    "minutes": 52,
    "duration": "52m",
    "questions": [
      "Stream vs parallel stream — how does parallelStream work, and when does it hurt?",
      "newFixedThreadPool vs newCachedThreadPool vs newSingleThreadExecutor — what's the hidden danger in each?"
    ],
    "asked": {
      "posts": 4,
      "items": 2
    }
  },
  {
    "id": "CONC-10",
    "section": "concurrency",
    "sectionLabel": "Concurrency & Multithreading",
    "priority": "P1",
    "title": "Scheduled executors & graceful shutdown",
    "why": "Shutdown order is what production-minded interviewers probe: what happens to in-flight work when a pod stops. Scheduling questions follow from any @Scheduled job on your resume.",
    "resources": [
      {
        "id": "CONC-10-r1",
        "kind": "video",
        "title": "Java ScheduledThreadPoolExecutor || Shutdown Vs AwaitTermination || Multithreading in Java",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 38,
        "minutes": 23,
        "note": ""
      }
    ],
    "minutes": 23,
    "duration": "23m",
    "questions": [
      "shutdown() vs shutdownNow() — how do you shut a pool down gracefully?",
      "Build a scheduler that runs tasks after a delay or periodically (ScheduledExecutorService)."
    ],
    "asked": {
      "posts": 9,
      "items": 2
    }
  },
  {
    "id": "CONC-11",
    "section": "concurrency",
    "sectionLabel": "Concurrency & Multithreading",
    "priority": "P2",
    "title": "Virtual threads & ThreadLocal",
    "why": "Lowered to P2: only 4 write-ups in two years asked about virtual threads (Kotak, MobiKwik, Fidelity, LinkedIn) — usually \"have you used them, and do they block on I/O?\". Know the one-paragraph answer; skip the depth under time pressure.",
    "resources": [
      {
        "id": "CONC-11-r1",
        "kind": "video",
        "title": "Java VirtualThreads vs Normal Threads || ThreadLocal in Java",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 39,
        "minutes": 23,
        "note": ""
      },
      {
        "id": "CONC-11-r2",
        "kind": "video",
        "title": "ThreadLocal in Java",
        "source": "Defog Tech",
        "playlist": "Java Concurrency",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLhfHPmPYPPRk6yMrcbfafFGSbE2EPK_A6",
        "position": 2,
        "minutes": 11,
        "note": ""
      }
    ],
    "minutes": 34,
    "duration": "34m",
    "questions": [
      "Virtual threads — how are they different from platform threads, and do they block on I/O?"
    ],
    "asked": {
      "posts": 4,
      "items": 1
    }
  },
  {
    "id": "CONC-13",
    "section": "concurrency",
    "sectionLabel": "Concurrency & Multithreading",
    "priority": "P0",
    "title": "Concurrency coding drills — print in order, odd/even, producer–consumer",
    "why": "The live-coding half of a multithreading round. 2025 SDE-2 reports: \"print 1 to 100 using 5 threads\" (Arrise), two threads printing two arrays alternately (Paytm), a hand-built blocking queue (SAP). Write each one without help, then time yourself.",
    "resources": [
      {
        "id": "CONC-13-r1",
        "kind": "video",
        "title": "Java Concurrency Interview: Implement Producer Consumer pattern using wait-notify",
        "source": "Defog Tech",
        "playlist": "Java Concurrency",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLhfHPmPYPPRk6yMrcbfafFGSbE2EPK_A6",
        "position": 18,
        "minutes": 11,
        "note": ""
      },
      {
        "id": "CONC-13-r2",
        "kind": "video",
        "title": "Phaser vs CountDownLatch vs CyclicBarrier",
        "source": "Defog Tech",
        "playlist": "Java Concurrency",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLhfHPmPYPPRk6yMrcbfafFGSbE2EPK_A6",
        "position": 21,
        "minutes": 14,
        "note": ""
      }
    ],
    "minutes": 25,
    "duration": "25m",
    "questions": [
      "Print odd and even numbers alternately using two threads.",
      "Implement producer–consumer with a bounded buffer.",
      "N threads must print 1, 2, 3 … in order, each thread taking its turn.",
      "Implement a thread-safe blocking queue yourself.",
      "CountDownLatch vs CyclicBarrier vs Semaphore — which solves what?"
    ],
    "asked": {
      "posts": 43,
      "items": 5
    }
  },
  {
    "id": "CONC-14",
    "section": "concurrency",
    "sectionLabel": "Concurrency & Multithreading",
    "priority": "P0",
    "title": "Spring Boot @Async & @Scheduled",
    "why": "From the Spring Boot playlist, not the Java one. Directly backs the async/sync-fallback work on your resume; \"long-running background work — @Async and beyond\" was asked by name in a 2026 SDE-2 loop.",
    "resources": [
      {
        "id": "CONC-14-r1",
        "kind": "video",
        "title": "Spring boot @Async Annotation - Part1 | ThreadPoolExecutor",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 16,
        "minutes": 46,
        "note": "The ThreadPoolExecutor part repeats CONC-01 — skim it, and slow down for how @Async picks its executor."
      },
      {
        "id": "CONC-14-r2",
        "kind": "video",
        "title": "Spring boot @Async Annotation - Part2 | Async Annotation Important Interview questions",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 17,
        "minutes": 24,
        "note": ""
      }
    ],
    "minutes": 70,
    "duration": "1h 10m",
    "questions": [
      "@Async or a message queue for long-running background work?",
      "@Async — how does it work, and why does it sometimes run synchronously?",
      "@Scheduled jobs — how do you stop a cron job running on every instance?",
      "How do you configure the executor for @Async (ThreadPoolTaskExecutor)?"
    ],
    "asked": {
      "posts": 10,
      "items": 4
    }
  },
  {
    "id": "CONC-06",
    "section": "concurrency",
    "sectionLabel": "Concurrency & Multithreading",
    "priority": "P0",
    "title": "Production JVM debugging — thread dumps, deadlocks, high CPU & leaks",
    "why": "SDE-2 loops increasingly ask you to walk a production incident, and the 2026 scenario questions (low CPU but requests timing out; a pool exhausted) are all answered with a thread dump. This card is the toolkit; JAVA-04 covers the heap side.",
    "resources": [
      {
        "id": "CONC-06-r1",
        "kind": "video",
        "title": "How detect and resolve DeadLocks in Java",
        "source": "Defog Tech",
        "playlist": "Java Concurrency",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLhfHPmPYPPRk6yMrcbfafFGSbE2EPK_A6",
        "position": 25,
        "minutes": 11,
        "note": ""
      },
      {
        "id": "CONC-06-r2",
        "kind": "doc",
        "title": "Java SE 21 Troubleshooting Guide — Diagnostic Tools",
        "source": "docs.oracle.com",
        "url": "https://docs.oracle.com/en/java/javase/21/troubleshoot/diagnostic-tools.html",
        "minutes": 30,
        "estimate": true,
        "note": "Skim jcmd, jstack and Java Flight Recorder. Skip the rest."
      }
    ],
    "minutes": 41,
    "duration": "≈41m",
    "questions": [
      "A service gets slow (high latency) in production — how do you debug it?",
      "How do you find a memory leak — what is a heap dump and when do you take one?",
      "What do you monitor for JVM health — GC pauses, GC logs, JVM flags?",
      "How do you detect and resolve a deadlock in a running system?",
      "One pod is at 100% CPU — how do you find the guilty thread?"
    ],
    "asked": {
      "posts": 45,
      "items": 5
    }
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
        "minutes": 25,
        "note": ""
      },
      {
        "id": "SPRING-01-r2",
        "kind": "video",
        "title": "Spring boot @Transactional Annotation - Part2 | Declarative, Programmatic Approach and Propagation",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 14,
        "minutes": 38,
        "note": ""
      },
      {
        "id": "SPRING-01-r3",
        "kind": "video",
        "title": "Spring boot @Transactional Annotation - Part3 | Isolation Level and its different types",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 15,
        "minutes": 39,
        "note": ""
      }
    ],
    "minutes": 102,
    "duration": "1h 42m",
    "questions": [
      "What are the isolation levels, and what does each prevent?",
      "What does @Transactional do, and where should you put it?",
      "Transaction propagation — REQUIRED vs REQUIRES_NEW (and the others)?",
      "Which exceptions roll back a @Transactional method by default?",
      "An order touches payment, inventory and receipt services — how do you roll back across them?",
      "How does @Transactional work under the hood — and why does it fail on self-invocation?"
    ],
    "asked": {
      "posts": 42,
      "items": 6
    }
  },
  {
    "id": "SPRING-17",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P0",
    "title": "Request lifecycle — DispatcherServlet, Tomcat threads & message converters",
    "why": "NEW. \"What happens internally when a REST request hits a Spring Boot application?\" was reported verbatim in a 2026 SDE-2 loop, and \"Spring vs Spring Boot\" in PayPal's and other SDE-2 rounds. It is also the frame every filter, interceptor, security and exception-handling question hangs off.",
    "resources": [
      {
        "id": "SPRING-17-r1",
        "kind": "video",
        "title": "Introduction to Spring boot | Its Advantage over Spring MVC and Servlets based Web applications",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 2,
        "minutes": 46,
        "note": "Start at 10:30 (Spring MVC over servlets); the first ten minutes are plain servlets."
      },
      {
        "id": "SPRING-17-r2",
        "kind": "doc",
        "title": "Spring Framework reference — DispatcherServlet",
        "source": "docs.spring.io",
        "url": "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet.html",
        "minutes": 20,
        "estimate": true,
        "note": "Read Special Bean Types and Processing. Skip the configuration pages."
      },
      {
        "id": "SPRING-17-r3",
        "kind": "doc",
        "title": "Tomcat Server Threading Model",
        "source": "codingshuttle.com",
        "url": "https://www.codingshuttle.com/spring-boot-handbook/tomcat-server-threading-model/",
        "minutes": 15,
        "estimate": true,
        "note": ""
      }
    ],
    "minutes": 81,
    "duration": "≈1h 21m",
    "questions": [
      "Spring vs Spring Boot — what does Boot actually add?",
      "What happens when a request hits a Spring Boot application? Explain the DispatcherServlet flow.",
      "Which embedded server does Spring Boot use — and how do you change the port or swap it?"
    ],
    "asked": {
      "posts": 22,
      "items": 3
    }
  },
  {
    "id": "SPRING-02",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P0",
    "title": "IoC, bean lifecycle & dependency injection",
    "why": "Split: scopes are now SPRING-21, so this is one sitting. \"Spring lifecycle\", @Component vs @Bean vs @Qualifier, DI styles and circular dependencies are reported again and again, including in 2026 SDE-2 loops.",
    "resources": [
      {
        "id": "SPRING-02-r1",
        "kind": "video",
        "title": "Spring boot: Bean and its Lifecycle | Inversion of Control (IOC)",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 6,
        "minutes": 34,
        "note": ""
      },
      {
        "id": "SPRING-02-r2",
        "kind": "video",
        "title": "Dependency Injection in Spring boot | With Advantages and Disadvantages",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 7,
        "minutes": 39,
        "note": ""
      }
    ],
    "minutes": 73,
    "duration": "1h 13m",
    "questions": [
      "What are dependency injection and Inversion of Control — and what do they buy you?",
      "@Component vs @Service vs @Repository vs @Bean — is the difference only semantic?",
      "Circular dependency — how does Spring handle it, and how do you fix it?",
      "Explain the Spring bean lifecycle.",
      "Constructor vs setter vs field injection — which is better and why?",
      "Two beans of the same type — how does Spring choose? (@Qualifier vs @Primary)",
      "ApplicationContext vs BeanFactory — how does the IoC container work?",
      "What is component scanning?"
    ],
    "asked": {
      "posts": 73,
      "items": 8
    }
  },
  {
    "id": "SPRING-21",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P1",
    "title": "Bean scopes — singleton vs prototype, request scope & thread safety",
    "why": "Split from SPRING-02. Lowered to P1: 11 of the last two years' write-ups asked it (Visa, Oracle, Mastercard, Publicis Sapient, Goldman Sachs) — usually as a follow-up inside a DI question, not on its own. \"Is a singleton bean thread-safe?\" ties straight back to the concurrency you finished.",
    "resources": [
      {
        "id": "SPRING-21-r1",
        "kind": "video",
        "title": "Spring boot: Bean Scopes | Singleton, Prototype, Request, Session Scopes with Examples in Java",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 8,
        "minutes": 40,
        "note": ""
      }
    ],
    "minutes": 40,
    "duration": "40m",
    "questions": [
      "What bean scopes does Spring have?",
      "Is a singleton bean thread-safe? How is a Spring singleton different from the Singleton pattern?",
      "A prototype bean injected into a singleton — does it stay prototype?"
    ],
    "asked": {
      "posts": 11,
      "items": 3
    }
  },
  {
    "id": "SPRING-03",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P0",
    "title": "Auto-configuration & starters — what @SpringBootApplication really does",
    "why": "\"How does auto-configuration work?\" is one of the most-asked Spring Boot questions at 2–5 years, and no video in the playlist teaches it head-on — so this card pairs the conditional-bean video with the reference page. Profiles and config moved to SPRING-18, Maven to SPRING-19, so this is one sitting.",
    "resources": [
      {
        "id": "SPRING-03-r1",
        "kind": "video",
        "title": "Spring boot @ConditionalOnProperty Annotation",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 10,
        "minutes": 20,
        "note": "Conditions are what auto-configuration is built from — and @ConditionalOnProperty is how your routing flags are wired."
      },
      {
        "id": "SPRING-03-r2",
        "kind": "doc",
        "title": "Spring Boot reference — Creating Your Own Auto-configuration",
        "source": "docs.spring.io",
        "url": "https://docs.spring.io/spring-boot/reference/features/developing-auto-configuration.html",
        "minutes": 20,
        "estimate": true,
        "note": "Read the first three sections: auto-configured beans, locating candidates, condition annotations. Skip testing and the starter how-to."
      }
    ],
    "minutes": 40,
    "duration": "≈40m",
    "questions": [
      "How does Spring Boot auto-configuration work?",
      "What does @SpringBootApplication do?",
      "What are Spring Boot starters?",
      "How do you create a bean only under some condition (e.g. per environment)?"
    ],
    "asked": {
      "posts": 10,
      "items": 4
    }
  },
  {
    "id": "SPRING-18",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P0",
    "title": "Profiles & externalized config — @Profile, @ConfigurationProperties & feature flags",
    "why": "NEW — split from SPRING-03. \"How do you manage dev/stage/prod config?\" is a routine practical question, and feature flags — fixed at startup vs togglable at runtime — are where it goes deep.",
    "resources": [
      {
        "id": "SPRING-18-r1",
        "kind": "video",
        "title": "Spring boot @Profile annotation | How Profiling works in Spring boot",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 11,
        "minutes": 33,
        "note": ""
      },
      {
        "id": "SPRING-18-r2",
        "kind": "video",
        "title": "Spring Boot: ConfigurationProperties in-depth",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 44,
        "minutes": 39,
        "note": ""
      }
    ],
    "minutes": 72,
    "duration": "1h 12m",
    "questions": [
      "How do you manage configuration across dev / staging / prod?",
      "How would you design feature flags — and handle a flag that breaks production?",
      "@Value vs @ConfigurationProperties — how do you read properties?",
      "How do you change configuration without restarting the service?"
    ],
    "asked": {
      "posts": 12,
      "items": 4
    }
  },
  {
    "id": "SPRING-06",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P2",
    "title": "AOP & the proxy mechanism",
    "why": "Lowered to P2: none of the ~45 2024–26 loops behind this map asked AOP on its own. It arrives as the reason @Transactional and @Async fail on self-invocation — which SPRING-01 already taught you. Do it for depth: \"JDK vs CGLIB proxies\" is still on SDE-2 question lists.",
    "resources": [
      {
        "id": "SPRING-06-r1",
        "kind": "video",
        "title": "Spring boot AOP (Aspect Oriented Programming)",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 12,
        "minutes": 69,
        "note": "Long. Of the pointcut types, execution(...) and @annotation(...) are the two you will actually write — skim the rest."
      }
    ],
    "minutes": 69,
    "duration": "1h 9m",
    "questions": [
      "What is AOP, and how does Spring AOP work internally?",
      "Write a custom annotation with an @Around aspect (e.g. log execution time)."
    ],
    "asked": {
      "posts": 7,
      "items": 2
    }
  },
  {
    "id": "SPRING-05",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P0",
    "title": "REST API design — status codes, idempotency, versioning, pagination",
    "why": "\"REST API design\" appears as its own round topic in SDE-2 write-ups (HERE, PayPal), and it is the easiest place to sound senior or junior.",
    "resources": [
      {
        "id": "SPRING-05-r1",
        "kind": "video",
        "title": "Spring boot ResponseEntity and Response Codes | 1xx, 2xx, 3xx, 4xx and 5xx Return Codes",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 21,
        "minutes": 43,
        "note": ""
      },
      {
        "id": "SPRING-05-r2",
        "kind": "video",
        "title": "Spring boot Annotations (Controller Layer) | Controller, RestController, RequestMapping etc.",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 5,
        "minutes": 35,
        "note": ""
      }
    ],
    "minutes": 78,
    "duration": "1h 18m",
    "questions": [
      "How do you make an API idempotent — e.g. a payment POST that gets retried?",
      "@Controller vs @RestController — and @RequestParam vs @PathVariable vs @RequestBody?",
      "How do you design a REST API — naming, versioning, pagination?",
      "PUT vs POST vs PATCH (and GET vs POST) — which are idempotent?",
      "Which HTTP status codes do you return — 200, 201, 204, 400, 401, 403, 404, 409, 500?",
      "How do you validate incoming requests?",
      "REST vs SOAP — what makes an API RESTful?"
    ],
    "asked": {
      "posts": 88,
      "items": 7
    }
  },
  {
    "id": "SPRING-08",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P0",
    "title": "Exception handling — @ControllerAdvice & error contracts",
    "why": "Raised from P1. Global exception handling and \"where should exception translation happen?\" appear in nearly every 2025–26 Spring write-up and guide. One video, one pattern — a cheap P0.",
    "resources": [
      {
        "id": "SPRING-08-r1",
        "kind": "video",
        "title": "Spring boot - Exception Handling | @ControllerAdvice | @ResponseStatus | @ExceptionHandler",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 22,
        "minutes": 56,
        "note": ""
      }
    ],
    "minutes": 56,
    "duration": "56m",
    "questions": [
      "How do you implement global exception handling in Spring Boot?",
      "What should an error response look like? (ProblemDetail / RFC 9457)",
      "@ControllerAdvice vs @RestControllerAdvice vs @ExceptionHandler — what's the scope of each?"
    ],
    "asked": {
      "posts": 20,
      "items": 3
    }
  },
  {
    "id": "SPRING-11",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P0",
    "title": "Filters vs interceptors — and where tenant resolution goes",
    "why": "\"Filter vs interceptor — which runs first, and which can see the controller method?\" is a stock Spring question, sometimes with a code example asked for. JWT validation (a filter) and tenant resolution both live here.",
    "resources": [
      {
        "id": "SPRING-11-r1",
        "kind": "video",
        "title": "Spring boot: Custom Interceptors | How to Intercept Incoming HTTP Request and Custom Annotations",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 18,
        "minutes": 30,
        "note": ""
      },
      {
        "id": "SPRING-11-r2",
        "kind": "video",
        "title": "Spring boot: Filters vs Interceptors | Filters and Interceptors Advantage and UseCases for both",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 19,
        "minutes": 24,
        "note": ""
      }
    ],
    "minutes": 54,
    "duration": "54m",
    "questions": [
      "Filter vs interceptor — where does each run, and which would you use?"
    ],
    "asked": {
      "posts": 6,
      "items": 1
    }
  },
  {
    "id": "SPRING-04",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P0",
    "title": "JPA core — persistence context, entity lifecycle & L1 cache",
    "why": "Entity states, dirty checking and save vs saveAndFlush are the JPA warm-ups, and Spring Data JPA is your loudest resume claim. Two of the playlist's ten JPA videos sit here; the JDBC Template (#23), L2 cache (#26) and DTO-to-table (#27) videos are skipped — their interview question is one line each, answered on this card.",
    "resources": [
      {
        "id": "SPRING-04-r1",
        "kind": "video",
        "title": "Spring boot: JPA (Part-2) | Setup, JPA Architecture, Entity Lifecycle",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 24,
        "minutes": 63,
        "note": "Setup comes first — skim it. The JPA architecture (EntityManager, persistence context) and the entity lifecycle are what gets asked."
      },
      {
        "id": "SPRING-04-r2",
        "kind": "video",
        "title": "Spring boot: JPA (Part-3) | First Level Caching in JPA",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 25,
        "minutes": 24,
        "note": "The L1 cache is the persistence context seen from the read side — same id, one SELECT. Hold on to \"L1 vs L2\": that comparison is the whole L2 question in interviews."
      }
    ],
    "minutes": 87,
    "duration": "1h 27m",
    "questions": [
      "Optimistic vs pessimistic locking in JPA — when do you use each?",
      "JPA vs Hibernate vs Spring Data JPA — why use Hibernate at all?",
      "EntityManager vs CrudRepository vs JpaRepository?",
      "save() vs saveAndFlush(), persist vs merge — and what is dirty checking?",
      "How do you configure Hibernate — dialect, ddl-auto, and SQL logging?",
      "JDBC vs Hibernate — why use an ORM, and when would you still drop to plain JDBC (JdbcTemplate)?",
      "First-level vs second-level cache in Hibernate — when does L2 help or hurt?"
    ],
    "asked": {
      "posts": 29,
      "items": 7
    }
  },
  {
    "id": "SPRING-07",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P0",
    "title": "JPA relationships I — @OneToOne, owning side & cascades",
    "why": "Split into two cards, one video each. Mapping questions are routine at 2–5 years, and they are where N+1 starts. This one carries owning side, mappedBy, cascades and fetch defaults.",
    "resources": [
      {
        "id": "SPRING-07-r1",
        "kind": "video",
        "title": "Spring boot: JPA (Part-6) | OneToOne Unidirectional and Bidirectional Mapping",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 28,
        "minutes": 66,
        "note": ""
      }
    ],
    "minutes": 66,
    "duration": "1h 6m",
    "questions": [
      "One-to-one vs one-to-many — how do you map them, and what is the owning side (mappedBy)?",
      "What is cascade in JPA — which cascade types are safe?"
    ],
    "asked": {
      "posts": 10,
      "items": 2
    }
  },
  {
    "id": "SPRING-22",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P0",
    "title": "JPA relationships II — @OneToMany, @ManyToOne & @ManyToMany",
    "why": "NEW — the second half of the old relationships card. One-to-many is the mapping you will actually draw in an interview; many-to-many is the one you should argue against.",
    "resources": [
      {
        "id": "SPRING-22-r1",
        "kind": "video",
        "title": "Spring boot: JPA (Part-7) | OneToMany, ManyToOne & ManyToMany Unidirectional & Bidirectional Mapping",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 29,
        "minutes": 59,
        "note": ""
      }
    ],
    "minutes": 59,
    "duration": "59m",
    "questions": [
      "How do you model a many-to-many relationship (e.g. Person ↔ Job)?",
      "Which side should own a one-to-many — and why keep collections in sync?"
    ],
    "asked": {
      "posts": 4,
      "items": 2
    }
  },
  {
    "id": "SPRING-20",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P0",
    "title": "Spring Data queries — derived queries, JPQL, N+1 & pagination",
    "why": "The most-asked JPA video in the playlist: lazy vs eager, LazyInitializationException and N+1 come up in more write-ups than every other JPA topic combined, and N+1 is the one you get asked to fix live. Comes after the relationship cards because N+1 lives on lazy associations. Native queries, Criteria and Specifications (#31, #32) are skipped — no write-up asked them; the one-line answer is on this card.",
    "resources": [
      {
        "id": "SPRING-20-r1",
        "kind": "video",
        "title": "Spring boot: JPA (Part-8) | JPQL, Derived Query, N+1 Problem, Joins, Pagination and Sorting etc.",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 30,
        "minutes": 59,
        "note": ""
      }
    ],
    "minutes": 59,
    "duration": "59m",
    "questions": [
      "Lazy vs eager loading — and what causes LazyInitializationException?",
      "What is the N+1 problem in Hibernate, and how do you fix it?",
      "How do you paginate in Spring Data — and why is a deep OFFSET slow?",
      "Derived queries vs JPQL vs native SQL — how do you write complex queries in JPA?",
      "How do you build dynamic queries — Criteria API vs Specifications?"
    ],
    "asked": {
      "posts": 34,
      "items": 5
    }
  },
  {
    "id": "SPRING-15",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P0",
    "title": "Web attacks — CSRF, XSS, CORS, SQL injection",
    "why": "25 minutes, and it answers the follow-ups every JWT answer draws: why localStorage is risky (XSS), why a stateless JWT API can disable CSRF, and who actually enforces CORS.",
    "resources": [
      {
        "id": "SPRING-15-r1",
        "kind": "video",
        "title": "Understand Attacks: CSRF, XSS, CORS, SQL Injection with DEMO | Spring Security",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 33,
        "minutes": 25,
        "note": ""
      }
    ],
    "minutes": 25,
    "duration": "25m",
    "questions": [
      "What is SQL injection — and how do PreparedStatement and ORMs prevent it?",
      "XSS — and why is storing a JWT in localStorage risky?",
      "What is CSRF — and why can a stateless JWT API disable CSRF protection?",
      "What is CORS, and who enforces it?"
    ],
    "asked": {
      "posts": 11,
      "items": 4
    }
  },
  {
    "id": "SPRING-09",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P0",
    "title": "Spring Security architecture — filter chain, users & authentication flow",
    "why": "Split: JWT is now SPRING-23. The filter chain is the frame every security question hangs off, and #35 is where users and passwords actually come from — in memory, then a database — so the login path is wired end to end before stateless auth in #37.",
    "resources": [
      {
        "id": "SPRING-09-r1",
        "kind": "video",
        "title": "Spring boot: Security (Part-1) | Architecture and SetUp",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 34,
        "minutes": 18,
        "note": ""
      },
      {
        "id": "SPRING-09-r2",
        "kind": "video",
        "title": "Spring boot: Security (Part-2) | Multiple User Creation & Storing Username & Password | inMemory, DB",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 35,
        "minutes": 47,
        "note": ""
      },
      {
        "id": "SPRING-09-r3",
        "kind": "video",
        "title": "Spring boot: Security (Part-4) | Basic Authentication & Authorization | Stateless Authentication",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 37,
        "minutes": 20,
        "note": ""
      }
    ],
    "minutes": 85,
    "duration": "1h 25m",
    "questions": [
      "How does Spring Security work — the filter chain and the authentication flow?",
      "Authentication vs authorization — and 401 vs 403?",
      "Stateful (session) vs stateless (token) authentication?",
      "Where do users and passwords come from — UserDetailsService and password hashing?",
      "How do you secure REST APIs in a Spring Boot service?"
    ],
    "asked": {
      "posts": 50,
      "items": 5
    }
  },
  {
    "id": "SPRING-23",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P0",
    "title": "JWT — structure, stateless auth, revocation & refresh",
    "why": "NEW — split from SPRING-09 and raised to P0. JWT is the security topic SDE-2 loops actually spend time on: a 2026 Java SDE-2 loop asked where the token is validated in the filter chain, what happens when validation fails, how to revoke one, where refresh lives and why localStorage is risky. Do SPRING-09 first.",
    "resources": [
      {
        "id": "SPRING-23-r1",
        "kind": "video",
        "title": "JWT Explained | JWT vs SessionID | JSON Web Token | Security Challenges with JWT & its Handling",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 38,
        "minutes": 49,
        "note": ""
      }
    ],
    "minutes": 49,
    "duration": "49m",
    "questions": [
      "How does JWT work — structure and verification?",
      "Where is the JWT validated in the Spring Security filter chain — how do you write a JWT filter?",
      "Access token vs refresh token — where should tokens live on the client?",
      "How do you revoke or invalidate a JWT before it expires?"
    ],
    "asked": {
      "posts": 32,
      "items": 4
    }
  },
  {
    "id": "SPRING-10",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P0",
    "title": "OAuth 2.0 & service-to-service tokens",
    "why": "Grants, tokens and service-to-service auth. #40 walks the protocol with real requests and responses; #41 builds it in Spring Security, so you can say where each step lives in code. Current spec: RFC 9700 (Jan 2025) says not to use the implicit or password grants.",
    "resources": [
      {
        "id": "SPRING-10-r1",
        "kind": "video",
        "title": "OAuth 2.0: Explained with API Request and Response Sample | High Level System Design",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 40,
        "minutes": 35,
        "note": ""
      },
      {
        "id": "SPRING-10-r2",
        "kind": "video",
        "title": "Spring boot: Security (Part-8) | OAUTH2 Authentication Implementation",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 41,
        "minutes": 52,
        "note": ""
      }
    ],
    "minutes": 87,
    "duration": "1h 27m",
    "questions": [
      "Explain the OAuth 2.0 flow — authorization code vs client credentials.",
      "OAuth 2.0 vs JWT — how are they related?"
    ],
    "asked": {
      "posts": 10,
      "items": 2
    }
  },
  {
    "id": "SPRING-13",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P1",
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
        "minutes": 29,
        "note": ""
      }
    ],
    "minutes": 29,
    "duration": "29m",
    "questions": [
      "How do you implement role-based access control in Spring (@PreAuthorize)?"
    ],
    "asked": {
      "posts": 13,
      "items": 1
    }
  },
  {
    "id": "SPRING-14",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P1",
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
        "minutes": 31,
        "note": ""
      }
    ],
    "minutes": 31,
    "duration": "31m",
    "questions": [
      "How do you monitor a Spring Boot service in production?",
      "What is Spring Boot Actuator — which endpoints, and how do you secure them?"
    ],
    "asked": {
      "posts": 34,
      "items": 2
    }
  },
  {
    "id": "SPRING-19",
    "section": "spring",
    "sectionLabel": "Spring Boot & Data Access",
    "priority": "P2",
    "title": "Maven — build lifecycle, scopes & dependency conflicts",
    "why": "NEW — split from SPRING-03 and lowered to P2. One SDE-2 write-up (HERE) listed Maven by name; most never reach it. When it does come up, it is the dependency-conflict question.",
    "resources": [
      {
        "id": "SPRING-19-r1",
        "kind": "video",
        "title": "Introduction to Maven and its Lifecycle | Spring boot Maven project",
        "source": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 4,
        "minutes": 49,
        "note": ""
      }
    ],
    "minutes": 49,
    "duration": "49m",
    "questions": [
      "Maven lifecycle and pom.xml — what happens on mvn package?",
      "How do you resolve dependency version conflicts in Maven or Gradle?"
    ],
    "asked": {
      "posts": 6,
      "items": 2
    }
  },
  {
    "id": "DATA-01",
    "section": "data",
    "sectionLabel": "Databases & Caching",
    "priority": "P0",
    "title": "SQL & indexing — B-Tree, composite indexes, EXPLAIN, join order",
    "why": "A standing round of its own. Write-ups put SQL beside Core Java and Spring Boot; 2026 guides stress index-vs-scan reasoning and reading a plan. You claim PostgreSQL and a GIN/B-Tree/HNSW index design — this will be probed.",
    "resources": [
      {
        "id": "DATA-01-r1",
        "kind": "doc",
        "title": "Use The Index, Luke! — SQL indexing and tuning for developers",
        "source": "use-the-index-luke.com",
        "url": "https://use-the-index-luke.com/sql/table-of-contents",
        "minutes": 90,
        "estimate": true,
        "note": "Read: Anatomy of an Index, The Where Clause, Sorting & Grouping, Partial Results. Skip the rest."
      }
    ],
    "minutes": 90,
    "duration": "≈1h 30m",
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
    ],
    "asked": null
  },
  {
    "id": "DATA-02",
    "section": "data",
    "sectionLabel": "Databases & Caching",
    "priority": "P0",
    "title": "Redis & caching patterns",
    "why": "Redis and Caching are both listed on your resume, and your LLM agent stages writes in Redis — expect the consistency question. Cache-aside, invalidation, stampede and distributed locks are standard asks.",
    "resources": [
      {
        "id": "DATA-02-r1",
        "kind": "video",
        "title": "Spring Boot | Spring Data Redis as Cache | @Cacheable | @CacheEvict | @CachePut",
        "source": "Java Techie",
        "url": "https://www.youtube.com/watch?v=vpe4aDu5ixI",
        "minutes": 14,
        "estimate": false,
        "note": ""
      },
      {
        "id": "DATA-02-r2",
        "kind": "doc",
        "title": "Redis — data types & key eviction",
        "source": "redis.io",
        "url": "https://redis.io/docs/latest/develop/data-types/",
        "minutes": 20,
        "estimate": true,
        "note": "Enough to say which structure you'd pick and why; skip the command reference."
      }
    ],
    "minutes": 34,
    "duration": "≈34m",
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
    ],
    "asked": null
  },
  {
    "id": "DATA-04",
    "section": "data",
    "sectionLabel": "Databases & Caching",
    "priority": "P1",
    "title": "SQL query writing — joins, GROUP BY / HAVING, window functions",
    "why": "NEW. DATA-01 is the theory; this is the live part. HERE's SDE-2 first round put SQL beside Core Java, Walmart SDE-2 prep guides list SQL and DBMS, and \"Nth-highest salary\" / \"top earner per department\" are the standing warm-ups. You write SQL for a living — make it fast under a timer.",
    "resources": [
      {
        "id": "DATA-04-r1",
        "kind": "doc",
        "title": "SQL 50 — Study Plan",
        "source": "leetcode.com",
        "url": "https://leetcode.com/studyplan/top-sql-50/",
        "minutes": 180,
        "estimate": true,
        "note": "Do Select, Basic Joins, Basic Aggregate Functions and Subqueries. Time-box each problem to 10 minutes."
      },
      {
        "id": "DATA-04-r2",
        "kind": "doc",
        "title": "PostgreSQL tutorial — Window Functions",
        "source": "postgresql.org",
        "url": "https://www.postgresql.org/docs/current/tutorial-window.html",
        "minutes": 15,
        "estimate": true,
        "note": ""
      }
    ],
    "minutes": 195,
    "duration": "≈3h 15m",
    "questions": [
      "Second-highest salary — once with a subquery, once with DENSE_RANK. What does each return with ties, or with no second value?",
      "Nth-highest salary per department with a window function. ROW_NUMBER vs RANK vs DENSE_RANK — which, and why?",
      "Employees who earn more than their manager. (Self-join.)",
      "Departments with more than 5 employees and an average salary above X. WHERE vs HAVING — when does each filter run?",
      "Find and delete duplicate rows, keeping the lowest id.",
      "Customers who never placed an order — LEFT JOIN … IS NULL vs NOT EXISTS vs NOT IN. Which one breaks when there are NULLs?",
      "Running total and 7-day moving average of daily sales.",
      "INNER vs LEFT vs FULL OUTER vs CROSS JOIN — and what a join with a missing condition does to your row count.",
      "UNION vs UNION ALL — which is cheaper, and why?",
      "Normalise this table to 3NF — then tell me when you would deliberately denormalise.",
      "When would you NOT put this data in Postgres? (SQL vs NoSQL — argue from the access pattern, not the brand.)"
    ],
    "asked": null
  },
  {
    "id": "DATA-03",
    "section": "data",
    "sectionLabel": "Databases & Caching",
    "priority": "P1",
    "title": "Postgres transactions, MVCC, locking & connection pooling",
    "why": "The JPA cards teach isolation levels; this is the database that implements them. Long transactions, lock waits and pool exhaustion are the incidents you will be asked to debug — pool exhaustion is a stock 2026 Spring Boot scenario question.",
    "resources": [
      {
        "id": "DATA-03-r1",
        "kind": "doc",
        "title": "PostgreSQL — Chapter 13: Concurrency Control (MVCC & transaction isolation)",
        "source": "postgresql.org",
        "url": "https://www.postgresql.org/docs/current/mvcc.html",
        "minutes": 45,
        "estimate": true,
        "note": "Sections 13.1–13.3 only."
      }
    ],
    "minutes": 45,
    "duration": "≈45m",
    "questions": [
      "ACID — what does each letter guarantee, and which of them does Postgres get from the write-ahead log?",
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
    ],
    "asked": null
  },
  {
    "id": "KAFKA-01",
    "section": "kafka",
    "sectionLabel": "Kafka & Messaging",
    "priority": "P0",
    "title": "Kafka fundamentals & consumer groups",
    "why": "Kafka is on your resume and drives LogLens; current guides list consumer-group and rebalance mechanics as standard for experienced Java devs.",
    "resources": [
      {
        "id": "KAFKA-01-r1",
        "kind": "video",
        "title": "Apache Kafka Components & Architecture Detailed Explanation in 15 min",
        "source": "Java Techie",
        "playlist": "Kafka for beginners",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxwpWGoNokohsSW2CysI6lDc",
        "position": 2,
        "minutes": 16,
        "note": ""
      },
      {
        "id": "KAFKA-01-r2",
        "kind": "video",
        "title": "Apache Kafka Producer Example using SpringBoot 3.x",
        "source": "Java Techie",
        "playlist": "Kafka for beginners",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxwpWGoNokohsSW2CysI6lDc",
        "position": 7,
        "minutes": 26,
        "note": ""
      },
      {
        "id": "KAFKA-01-r3",
        "kind": "video",
        "title": "Apache Kafka Consumer Example using SpringBoot 3 | Consumer Groups",
        "source": "Java Techie",
        "playlist": "Kafka for beginners",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxwpWGoNokohsSW2CysI6lDc",
        "position": 8,
        "minutes": 28,
        "note": ""
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
      "A rolling deploy of 6 consumers causes 6 rebalances. How do cooperative-sticky assignment and static membership (group.instance.id) cut that down?",
      "Spring Kafka listener concurrency = 10 on a 6-partition topic. How many threads do real work?",
      "Your consumer takes 40s per message and max.poll.interval.ms is 300000 with max.poll.records 500. What goes wrong?",
      "Which metrics tell you a consumer is falling behind vs failing to commit? (records-lag-max vs commit-rate.)"
    ],
    "asked": null
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
        "minutes": 28,
        "note": ""
      },
      {
        "id": "KAFKA-02-r2",
        "kind": "video",
        "title": "Why Kafka Processes the Same Message Twice? | Kafka Idempotency Real-Time Example",
        "source": "Java Techie",
        "playlist": "Kafka for beginners",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxwpWGoNokohsSW2CysI6lDc",
        "position": 16,
        "minutes": 24,
        "note": ""
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
    ],
    "asked": null
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
        "minutes": 29,
        "note": ""
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
    ],
    "asked": null
  },
  {
    "id": "PLAT-01",
    "section": "platform",
    "sectionLabel": "Microservices & Platform",
    "priority": "P1",
    "title": "Distributed data — saga, outbox, idempotency & eventual consistency",
    "why": "Saga/compensation/idempotency is called out as an SDE-2-level expectation, and it is the theory behind what you already built in LogLens.",
    "resources": [
      {
        "id": "PLAT-01-r1",
        "kind": "doc",
        "title": "Pattern: Saga",
        "source": "microservices.io",
        "url": "https://microservices.io/patterns/data/saga.html",
        "minutes": 40,
        "estimate": true,
        "note": "Also read Database per service and Transactional outbox from the same pattern language."
      }
    ],
    "minutes": 40,
    "duration": "≈40m",
    "questions": [
      "Why can't you just use a distributed transaction (2PC) across services? What does it cost you?",
      "Saga: choreography vs orchestration. Which did you pick, and when does the other win?",
      "What is a compensating transaction, and why must it be idempotent?",
      "Your compensation itself fails. Now what?",
      "What is the dual-write problem, and how does the transactional outbox fix it?",
      "Design an idempotency key for an at-least-once consumer. What do you key on, and where does state live? ← your fingerprint-keyed upserts",
      "Eventual consistency: how do you explain the user-visible behaviour to a product manager?",
      "How do you test a saga's failure paths?"
    ],
    "asked": null
  },
  {
    "id": "PLAT-02",
    "section": "platform",
    "sectionLabel": "Microservices & Platform",
    "priority": "P1",
    "title": "Resiliency — circuit breaker, retry, backoff & bulkhead",
    "why": "\"Explain the circuit breaker pattern\" was asked in PayPal's SDE-2 loop; bulkheads are the 2026 answer to a slow downstream eating every thread.",
    "resources": [
      {
        "id": "PLAT-02-r1",
        "kind": "video",
        "title": "Microservice | Resilience4J Circuit Breaker Implementation on Spring Boot",
        "source": "Java Techie",
        "playlist": "Microservice",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxxWhFkucZBoMxeYE6qTgEF8",
        "position": 10,
        "minutes": 25,
        "note": ""
      },
      {
        "id": "PLAT-02-r2",
        "kind": "video",
        "title": "Microservice | Resilience4J Retry Module Implementation With Spring Boot",
        "source": "Java Techie",
        "playlist": "Microservice",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxxWhFkucZBoMxeYE6qTgEF8",
        "position": 11,
        "minutes": 13,
        "note": ""
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
    ],
    "asked": null
  },
  {
    "id": "PLAT-08",
    "section": "platform",
    "sectionLabel": "Microservices & Platform",
    "priority": "P1",
    "title": "Service-to-service calls — RestClient / WebClient / Feign, timeouts, sync vs async",
    "why": "NEW. \"How do your services talk to each other?\" follows every microservices answer, and 2026 guides list REST vs gRPC vs messaging as a core ask. It is also the ground under your Pack Service fix — a call with no timeout is the bug you already killed once.",
    "resources": [
      {
        "id": "PLAT-08-r1",
        "kind": "doc",
        "title": "Spring Framework reference — REST Clients",
        "source": "docs.spring.io",
        "url": "https://docs.spring.io/spring-framework/reference/integration/rest-clients.html",
        "minutes": 25,
        "estimate": true,
        "note": "Read RestClient and HTTP Service Clients; skim WebClient and RestTemplate."
      }
    ],
    "minutes": 25,
    "duration": "≈25m",
    "questions": [
      "RestTemplate vs RestClient vs WebClient vs OpenFeign — which would you pick for a new Spring Boot service, and why?",
      "Sync REST vs async messaging between two services — how do you decide, call by call?",
      "Which timeouts does an HTTP client need, and what happens if you set none? (Connect vs read vs pool-acquire; the JDK default is to wait forever.)",
      "How do you size the HTTP connection pool to one downstream, and what happens when it is exhausted?",
      "A downstream's p99 goes from 20 ms to 2 s. Walk what happens to your Tomcat threads, and what stops the cascade.",
      "Retries on a POST — when are they safe? (Only behind an idempotency key.)",
      "REST vs gRPC between internal services — what do you gain, and what do you give up?",
      "HTTP interface clients (@HttpExchange) vs Feign — what is the difference, and why did Spring add its own?"
    ],
    "asked": null
  },
  {
    "id": "PLAT-03",
    "section": "platform",
    "sectionLabel": "Microservices & Platform",
    "priority": "P1",
    "title": "Service discovery & API gateway",
    "why": "Backs your zero-downtime dual-APIM migration. Heads-up: these videos use Hystrix, which is retired — watch them for Eureka and the gateway, and say Resilience4j when the breaker comes up.",
    "resources": [
      {
        "id": "PLAT-03-r1",
        "kind": "video",
        "title": "Microservice | Spring Cloud Eureka + API Gateway + Spring Cloud Hystrix | PART-1",
        "source": "Java Techie",
        "playlist": "Microservice",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxxWhFkucZBoMxeYE6qTgEF8",
        "position": 1,
        "minutes": 40,
        "note": ""
      },
      {
        "id": "PLAT-03-r2",
        "kind": "video",
        "title": "Microservice | Spring Cloud Eureka + Gateway + Hystrix | PART-2",
        "source": "Java Techie",
        "playlist": "Microservice",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxxWhFkucZBoMxeYE6qTgEF8",
        "position": 2,
        "minutes": 15,
        "note": ""
      }
    ],
    "minutes": 55,
    "duration": "55m",
    "questions": [
      "Client-side vs server-side discovery. Which is Eureka?",
      "What happens to in-flight requests when a service instance dies?",
      "What is Eureka self-preservation mode and why does it exist?",
      "What belongs in a gateway vs in the service itself?",
      "How did you verify zero downtime in your dual-gateway migration? What was your rollback trigger?",
      "How does the gateway propagate identity to downstream services?",
      "Isn't the gateway a single point of failure? How do you address that?"
    ],
    "asked": null
  },
  {
    "id": "PLAT-04",
    "section": "platform",
    "sectionLabel": "Microservices & Platform",
    "priority": "P1",
    "title": "Docker — images, layers & containerising a Spring Boot service",
    "why": "Docker is named directly in an SDE-2 round write-up (HERE), and it is on your resume.",
    "resources": [
      {
        "id": "PLAT-04-r1",
        "kind": "video",
        "title": "Docker — Dockerizing your Spring Boot Application",
        "source": "Java Techie",
        "url": "https://www.youtube.com/watch?v=e3YERpG2rMs",
        "minutes": 14,
        "estimate": false,
        "note": ""
      },
      {
        "id": "PLAT-04-r2",
        "kind": "doc",
        "title": "Java Techie — Docker playlist (for anything the above leaves open)",
        "source": "youtube.com",
        "url": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxzMiFDnwxUDxmuZQU3igcBb",
        "minutes": 0,
        "estimate": false,
        "note": ""
      }
    ],
    "minutes": 14,
    "duration": "≈14m",
    "questions": [
      "Container vs VM — what is actually shared, and what isolates them? (Namespaces, cgroups.)",
      "What is a layer? Why does the ORDER of Dockerfile instructions change your build time?",
      "Why is a multi-stage build the norm for a Spring Boot jar, and what does it save?",
      "COPY vs ADD; CMD vs ENTRYPOINT — the difference and when it bites.",
      "How do you keep an image small, and why does that matter beyond disk?",
      "Your JVM inside a container ignores the memory limit and gets OOM-killed. What's the fix? (Container-aware flags / MaxRAMPercentage.)",
      "Where do logs and config belong for a containerised service, and why not in the image?",
      "How would you debug a container that exits immediately on start?"
    ],
    "asked": null
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
        "minutes": 6,
        "note": ""
      },
      {
        "id": "PLAT-05-r2",
        "kind": "video",
        "title": "Kubernetes Tutorial | K8s Components Explained in 10 mins | Part-2",
        "source": "Java Techie",
        "playlist": "Kubernetes",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxybsyOxK7WFtteH42ayn5i9",
        "position": 2,
        "minutes": 10,
        "note": ""
      },
      {
        "id": "PLAT-05-r3",
        "kind": "video",
        "title": "Kubernetes Tutorial | Kubernetes Basics & Architecture Explained in 10 mins | Part-3",
        "source": "Java Techie",
        "playlist": "Kubernetes",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxybsyOxK7WFtteH42ayn5i9",
        "position": 3,
        "minutes": 11,
        "note": ""
      }
    ],
    "minutes": 27,
    "duration": "27m",
    "questions": [
      "Pod vs Deployment vs Service vs ReplicaSet.",
      "What does the control plane do?",
      "Which Service type for external traffic?",
      "What happens when a pod fails a liveness probe?"
    ],
    "asked": null
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
        "minutes": 21,
        "note": ""
      },
      {
        "id": "PLAT-06-r2",
        "kind": "video",
        "title": "Kubernetes Tutorial | ConfigMap & Secrets Implementation in Spring Boot CRUD Example",
        "source": "Java Techie",
        "playlist": "Kubernetes",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxybsyOxK7WFtteH42ayn5i9",
        "position": 8,
        "minutes": 28,
        "note": ""
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
    ],
    "asked": null
  },
  {
    "id": "PLAT-07",
    "section": "platform",
    "sectionLabel": "Microservices & Platform",
    "priority": "P2",
    "title": "Distributed tracing & correlation",
    "why": "The video uses Spring Cloud Sleuth, which Spring Boot 3 replaced with Micrometer Tracing (OpenTelemetry or Brave underneath). Learn the concepts from it; name the current stack in the interview.",
    "resources": [
      {
        "id": "PLAT-07-r1",
        "kind": "video",
        "title": "Microservice | Distributed log tracing using Spring Cloud Sleuth & Zipkin | PART-7",
        "source": "Java Techie",
        "playlist": "Microservice",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxxWhFkucZBoMxeYE6qTgEF8",
        "position": 7,
        "minutes": 14,
        "note": ""
      }
    ],
    "minutes": 14,
    "duration": "14m",
    "questions": [
      "Trace ID vs span ID — what does each identify?",
      "How does the trace ID survive a hop into an async thread or a Kafka message?",
      "What is context propagation and where does it typically break?",
      "How do you correlate a tenant with a trace in a multi-tenant system?",
      "What is sampling and why can't you trace 100% in production?",
      "Sleuth is gone in Spring Boot 3. What replaced it, and what did you have to change?",
      "How do you get the trace ID into every log line? (MDC.)"
    ],
    "asked": null
  },
  {
    "id": "TEST-01",
    "section": "testing",
    "sectionLabel": "Testing & Delivery",
    "priority": "P1",
    "title": "JUnit 5 & Mockito",
    "why": "JUnit and Mockito are on your resume and you claim 90%+ coverage. @Mock vs @InjectMocks vs @MockBean is a standard question, and 'how do you test this?' follows most design answers.",
    "resources": [
      {
        "id": "TEST-01-r1",
        "kind": "video",
        "title": "Spring Boot Testing | Writing JUnit Tests using JUnit and Mockito",
        "source": "Java Techie",
        "url": "https://www.youtube.com/watch?v=kXhYu939_5s",
        "minutes": 17,
        "estimate": false,
        "note": ""
      }
    ],
    "minutes": 17,
    "duration": "17m",
    "questions": [
      "@Mock vs @InjectMocks vs @Spy vs @MockBean — what does each do, and which needs a Spring context? (@MockBean is deprecated in Boot 3.4 for @MockitoBean — know the new name.)",
      "when/thenReturn vs doReturn/when — when are they not interchangeable?",
      "How do you verify an interaction, and how do you assert on the argument that was passed? (ArgumentCaptor.)",
      "How do you test a void method that throws?",
      "You cannot mock a static or final method with plain Mockito — what are your options, and what does needing one tell you about the design?",
      "What belongs in a unit test vs an integration test? Where do you draw the line in a Spring service?",
      "90% coverage and a bug still shipped. What was the test suite not measuring?",
      "How do you test time-dependent code without Thread.sleep?",
      "How do you test a @Transactional method's rollback behaviour?"
    ],
    "asked": null
  },
  {
    "id": "TEST-02",
    "section": "testing",
    "sectionLabel": "Testing & Delivery",
    "priority": "P1",
    "title": "Testcontainers & Spring Boot test slices",
    "why": "You BUILT your team's Postgres-Testcontainers regression framework gating every PR. This is a story you should be able to tell cold. The Kafka video answers the end-to-end consumer-test question below.",
    "resources": [
      {
        "id": "TEST-02-r1",
        "kind": "video",
        "title": "Spring Boot 3 Integration Testing With TestContainers | JUnit 5",
        "source": "Java Techie",
        "url": "https://www.youtube.com/watch?v=Q-0Z6KZF1xM",
        "minutes": 22,
        "estimate": false,
        "note": ""
      },
      {
        "id": "TEST-02-r2",
        "kind": "video",
        "title": "Mastering Kafka E2E Integration Testing in Spring Boot with TestContainers",
        "source": "Java Techie",
        "playlist": "Kafka for beginners",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxwpWGoNokohsSW2CysI6lDc",
        "position": 10,
        "minutes": 23,
        "note": ""
      }
    ],
    "minutes": 45,
    "duration": "45m",
    "questions": [
      "Why Testcontainers over H2 for a Postgres app? Name a bug H2 would hide.",
      "What does @DataJpaTest give you, and what does it replace by default? How do you stop it swapping your datasource?",
      "@SpringBootTest vs a slice (@WebMvcTest / @DataJpaTest) — cost, and what each actually proves.",
      "Containers are slow to start. How do you keep a suite fast? (Reuse, singleton container, @ServiceConnection.)",
      "How do you keep tests isolated when they share one database container?",
      "Walk me through the regression framework you built: what gates a merge, and what happens when it goes red?",
      "How do you test a Kafka consumer end to end?",
      "Flaky integration test — how do you find the cause instead of retrying it?"
    ],
    "asked": null
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
      },
      {
        "id": "TEST-03-r2",
        "kind": "video",
        "title": "SpringBoot - Build CI/CD Pipeline Using GitHub Actions | Build & Push Docker Image",
        "source": "Java Techie",
        "url": "https://www.youtube.com/watch?v=NppkHKvnrqc",
        "minutes": 33,
        "estimate": false,
        "note": "Watch for the build → push image → deploy stages, so you can place your regression and quality gates inside a full delivery pipeline."
      }
    ],
    "minutes": 33,
    "duration": "33m",
    "questions": [
      "Walk your pipeline from a push to a deployed artifact. What gates exist, and which can be skipped?",
      "How do you run the same workflow across 7 repositories without maintaining 7 copies? (Reusable workflows / composite actions.)",
      "Where do secrets live, and how do you keep them out of logs?",
      "A regression suite takes 40 minutes. How do you decide what runs per PR vs nightly?",
      "How do you roll back a bad deploy, and how fast can you actually do it?",
      "What makes a build reproducible? Where does your pipeline break that?"
    ],
    "asked": null
  },
  {
    "id": "SELF-06",
    "section": "resume",
    "sectionLabel": "Your Systems — resume defence",
    "priority": "P0",
    "title": "Priority allocation & lifecycle-driven eligibility — your lead bullet",
    "why": "NEW. Your first resume bullet, and the one an interviewer opens with: ranking logic in 100% of customer allocations, a 20% sales-lift claim, a 30%+ cut in ineligible allocations, and cross-team API and schema changes. It had no card.",
    "resources": [
      {
        "id": "SELF-06-r1",
        "kind": "self",
        "title": "The allocation ranking and lifecycle-eligibility code",
        "source": "Your own codebase",
        "minutes": 0,
        "note": "Be able to state the ranking rule, the tie-break, and how each number on the resume was measured — without hedging."
      }
    ],
    "minutes": 0,
    "duration": "—",
    "questions": [
      "Explain the ranking: what decides which store gets inventory first, and what are the inputs?",
      "Fair-share splitting on tied demand: 10 units, 3 tied stores. Who gets the remainder, and is the result the same on every run?",
      "What is the complexity of an allocation run, and at what store × SKU count did it start to matter?",
      "\"Contributed to a 20% sales lift\" — how was that measured, and what else changed in the same period?",
      "How did you measure the 30%+ drop in allocations to ineligible stores? What was the baseline?",
      "Lifecycle data is now the source of truth for eligibility. What happens when that data arrives late or wrong?",
      "You changed a schema other teams depend on. How did you roll it out without breaking them? (Expand → migrate → contract; backward-compatible API versions.)",
      "How do you test ranking logic that runs in every customer's allocation? What would a regression look like, and who would notice first?",
      "If you rebuilt it today, what would you change?"
    ],
    "asked": null
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
    ],
    "asked": null
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
    ],
    "asked": null
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
    ],
    "asked": null
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
    ],
    "asked": null
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
    ],
    "asked": null
  }
];

export const CORE_STACK_PRIORITIES = ["P0","P1","P2"];

export const CORE_STACK_PRIORITY_CONFIG = {
  P0: { label: "P0", blurb: "Asked in nearly every loop, or a resume claim you can't fumble", cls: "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30" },
  P1: { label: "P1", blurb: "Very likely — do before any real interview", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  P2: { label: "P2", blurb: "Depth. Skip under time pressure", cls: "bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30" },
};

export const CORE_STACK_TOTAL = 69;

export const CORE_STACK_PRIORITY_COUNTS = {"P0":40,"P1":20,"P2":9};

export const CORE_STACK_SECTION_COUNTS = {"java":11,"concurrency":13,"spring":21,"data":4,"kafka":3,"platform":8,"testing":3,"resume":6};

export const CORE_STACK_MINUTES = 3650;
