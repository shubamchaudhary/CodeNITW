// Core Stack — the Java + Spring Boot topic set, one card per topic.
//
// GENERATED FILE. Edit scripts/data/javaSpringPrepTracker.csv (videos) or
// scripts/data/javaSpringPrepHandoff.md (durations, resume flags, interview
// questions) and re-run `node scripts/genCoreStack.mjs` — do not edit here.
//
// Order is the study order: topics are emitted in the CSV's row order and the
// page never re-sorts them.
//
// `videoUrl` is a YouTube search for the video's title + channel rather than a
// watch link: neither source carries per-video ids, and a search that always
// resolves beats a guessed id that rots.

export const CORE_STACK_SECTION = "Java and Spring Boot";

export const CORE_STACK_TOPICS = [
  {
    "id": "P0-01",
    "priority": "P0",
    "title": "@Transactional - propagation, isolation, proxy failure",
    "section": "Java and Spring Boot",
    "duration": "1h 41m",
    "resumeLinked": true,
    "videos": [
      {
        "id": "P0-01-CC-SB-13",
        "source": "CC-SB",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 13,
        "title": "Spring boot @Transactional Annotation - Part1",
        "minutes": 25,
        "videoUrl": "https://www.youtube.com/results?search_query=Spring%20boot%20%40Transactional%20Annotation%20-%20Part1%20Concept%20%26%26%20Coding"
      },
      {
        "id": "P0-01-CC-SB-14",
        "source": "CC-SB",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 14,
        "title": "Spring boot @Transactional Annotation - Part2 | Declarative, Programmatic Approach and Propagation",
        "minutes": 38,
        "videoUrl": "https://www.youtube.com/results?search_query=Spring%20boot%20%40Transactional%20Annotation%20-%20Part2%20%7C%20Declarative%2C%20Programmatic%20Approach%20and%20Propagation%20Concept%20%26%26%20Coding"
      },
      {
        "id": "P0-01-CC-SB-15",
        "source": "CC-SB",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 15,
        "title": "Spring boot @Transactional Annotation - Part3 | Isolation Level and its different types",
        "minutes": 39,
        "videoUrl": "https://www.youtube.com/results?search_query=Spring%20boot%20%40Transactional%20Annotation%20-%20Part3%20%7C%20Isolation%20Level%20and%20its%20different%20types%20Concept%20%26%26%20Coding"
      }
    ],
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
    ],
    "minutes": 102
  },
  {
    "id": "P0-02",
    "priority": "P0",
    "title": "AOP + proxy mechanism",
    "section": "Java and Spring Boot",
    "duration": "1h 09m",
    "resumeLinked": false,
    "videos": [
      {
        "id": "P0-02-CC-SB-12",
        "source": "CC-SB",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 12,
        "title": "Spring boot AOP (Aspect Oriented Programming)",
        "minutes": 69,
        "videoUrl": "https://www.youtube.com/results?search_query=Spring%20boot%20AOP%20(Aspect%20Oriented%20Programming)%20Concept%20%26%26%20Coding"
      }
    ],
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
    ],
    "minutes": 69
  },
  {
    "id": "P0-03",
    "priority": "P0",
    "title": "Bean lifecycle, IoC, DI, scopes",
    "section": "Java and Spring Boot",
    "duration": "1h 53m",
    "resumeLinked": false,
    "videos": [
      {
        "id": "P0-03-CC-SB-6",
        "source": "CC-SB",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 6,
        "title": "Spring boot: Bean and its Lifecycle | Inversion of Control (IOC)",
        "minutes": 34,
        "videoUrl": "https://www.youtube.com/results?search_query=Spring%20boot%3A%20Bean%20and%20its%20Lifecycle%20%7C%20Inversion%20of%20Control%20(IOC)%20Concept%20%26%26%20Coding"
      },
      {
        "id": "P0-03-CC-SB-7",
        "source": "CC-SB",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 7,
        "title": "Dependency Injection in Spring boot | With Advantages and Disadvantages",
        "minutes": 39,
        "videoUrl": "https://www.youtube.com/results?search_query=Dependency%20Injection%20in%20Spring%20boot%20%7C%20With%20Advantages%20and%20Disadvantages%20Concept%20%26%26%20Coding"
      },
      {
        "id": "P0-03-CC-SB-8",
        "source": "CC-SB",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 8,
        "title": "Spring boot: Bean Scopes | Singleton, Prototype, Request, Session Scopes with Examples in Java",
        "minutes": 40,
        "videoUrl": "https://www.youtube.com/results?search_query=Spring%20boot%3A%20Bean%20Scopes%20%7C%20Singleton%2C%20Prototype%2C%20Request%2C%20Session%20Scopes%20with%20Examples%20in%20Java%20Concept%20%26%26%20Coding"
      }
    ],
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
    ],
    "minutes": 113
  },
  {
    "id": "P0-04",
    "priority": "P0",
    "title": "JPA core - entity lifecycle, L1 cache, N+1",
    "section": "Java and Spring Boot",
    "duration": "2h 26m",
    "resumeLinked": true,
    "videos": [
      {
        "id": "P0-04-CC-SB-24",
        "source": "CC-SB",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 24,
        "title": "Spring boot: JPA (Part-2) | Setup, JPA Architecture, Entity Lifecycle",
        "minutes": 63,
        "videoUrl": "https://www.youtube.com/results?search_query=Spring%20boot%3A%20JPA%20(Part-2)%20%7C%20Setup%2C%20JPA%20Architecture%2C%20Entity%20Lifecycle%20Concept%20%26%26%20Coding"
      },
      {
        "id": "P0-04-CC-SB-25",
        "source": "CC-SB",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 25,
        "title": "Spring boot: JPA (Part-3) | First Level Caching in JPA",
        "minutes": 24,
        "videoUrl": "https://www.youtube.com/results?search_query=Spring%20boot%3A%20JPA%20(Part-3)%20%7C%20First%20Level%20Caching%20in%20JPA%20Concept%20%26%26%20Coding"
      },
      {
        "id": "P0-04-CC-SB-30",
        "source": "CC-SB",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 30,
        "title": "Spring boot: JPA (Part-8) | JPQL, Derived Query, N+1 Problem, Joins, Pagination and Sorting etc.",
        "minutes": 59,
        "videoUrl": "https://www.youtube.com/results?search_query=Spring%20boot%3A%20JPA%20(Part-8)%20%7C%20JPQL%2C%20Derived%20Query%2C%20N%2B1%20Problem%2C%20Joins%2C%20Pagination%20and%20Sorting%20etc.%20Concept%20%26%26%20Coding"
      }
    ],
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
    ],
    "minutes": 146
  },
  {
    "id": "P0-05",
    "priority": "P0",
    "title": "HashMap internals + Collections framework",
    "section": "Java and Spring Boot",
    "duration": "1h 40m",
    "resumeLinked": false,
    "videos": [
      {
        "id": "P0-05-CC-J-22",
        "source": "CC-J",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 22,
        "title": "Collections in Java - Part1 | Java Collections Framework in depth",
        "minutes": 41,
        "videoUrl": "https://www.youtube.com/results?search_query=Collections%20in%20Java%20-%20Part1%20%7C%20Java%20Collections%20Framework%20in%20depth%20Concept%20%26%26%20Coding"
      },
      {
        "id": "P0-05-CC-J-25",
        "source": "CC-J",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 25,
        "title": "Collections in Java - Part4 | HashMap Internal Working in Java",
        "minutes": 58,
        "videoUrl": "https://www.youtube.com/results?search_query=Collections%20in%20Java%20-%20Part4%20%7C%20HashMap%20Internal%20Working%20in%20Java%20Concept%20%26%26%20Coding"
      }
    ],
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
    ],
    "minutes": 99
  },
  {
    "id": "P0-06",
    "priority": "P0",
    "title": "Streams + functional interfaces + lambdas",
    "section": "Java and Spring Boot",
    "duration": "1h 47m",
    "resumeLinked": false,
    "videos": [
      {
        "id": "P0-06-CC-J-17",
        "source": "CC-J",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 17,
        "title": "Functional Interface and Lambda Expression - Java8 features | Java Interfaces Part3",
        "minutes": 32,
        "videoUrl": "https://www.youtube.com/results?search_query=Functional%20Interface%20and%20Lambda%20Expression%20-%20Java8%20features%20%7C%20Java%20Interfaces%20Part3%20Concept%20%26%26%20Coding"
      },
      {
        "id": "P0-06-CC-J-28",
        "source": "CC-J",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 28,
        "title": "Streams in Java8 | Collections in Java - Part7",
        "minutes": 75,
        "videoUrl": "https://www.youtube.com/results?search_query=Streams%20in%20Java8%20%7C%20Collections%20in%20Java%20-%20Part7%20Concept%20%26%26%20Coding"
      }
    ],
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
    ],
    "minutes": 107
  },
  {
    "id": "P0-07",
    "priority": "P0",
    "title": "Threads + ThreadPoolExecutor",
    "section": "Java and Spring Boot",
    "duration": "2h 05m",
    "resumeLinked": true,
    "videos": [
      {
        "id": "P0-07-CC-J-29",
        "source": "CC-J",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 29,
        "title": "Multithreading and Concurrency in Java: Part1 | Threads, Process and their Memory Model in depth",
        "minutes": 48,
        "videoUrl": "https://www.youtube.com/results?search_query=Multithreading%20and%20Concurrency%20in%20Java%3A%20Part1%20%7C%20Threads%2C%20Process%20and%20their%20Memory%20Model%20in%20depth%20Concept%20%26%26%20Coding"
      },
      {
        "id": "P0-07-CC-J-34",
        "source": "CC-J",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 34,
        "title": "Thread Pools in Java | ThreadPoolExecutor Framework | Multithreading Part6",
        "minutes": 77,
        "videoUrl": "https://www.youtube.com/results?search_query=Thread%20Pools%20in%20Java%20%7C%20ThreadPoolExecutor%20Framework%20%7C%20Multithreading%20Part6%20Concept%20%26%26%20Coding"
      }
    ],
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
    ],
    "minutes": 125
  },
  {
    "id": "P0-08",
    "priority": "P0",
    "title": "CompletableFuture + @Async",
    "section": "Java and Spring Boot",
    "duration": "2h 16m",
    "resumeLinked": true,
    "videos": [
      {
        "id": "P0-08-CC-J-35",
        "source": "CC-J",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 35,
        "title": "Java8 CompletableFuture | Future and Callable in Java | Multithreading in Java - Part7",
        "minutes": 66,
        "videoUrl": "https://www.youtube.com/results?search_query=Java8%20CompletableFuture%20%7C%20Future%20and%20Callable%20in%20Java%20%7C%20Multithreading%20in%20Java%20-%20Part7%20Concept%20%26%26%20Coding"
      },
      {
        "id": "P0-08-CC-SB-16",
        "source": "CC-SB",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 16,
        "title": "Spring boot @Async Annotation - Part1 | ThreadPoolExecutor",
        "minutes": 46,
        "videoUrl": "https://www.youtube.com/results?search_query=Spring%20boot%20%40Async%20Annotation%20-%20Part1%20%7C%20ThreadPoolExecutor%20Concept%20%26%26%20Coding"
      },
      {
        "id": "P0-08-CC-SB-17",
        "source": "CC-SB",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 17,
        "title": "Spring boot @Async Annotation - Part2 | Async Annotation Important Interview questions",
        "minutes": 24,
        "videoUrl": "https://www.youtube.com/results?search_query=Spring%20boot%20%40Async%20Annotation%20-%20Part2%20%7C%20Async%20Annotation%20Important%20Interview%20questions%20Concept%20%26%26%20Coding"
      }
    ],
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
    ],
    "minutes": 136
  },
  {
    "id": "P0-09",
    "priority": "P0",
    "title": "volatile, atomics, CAS + Java Memory Model",
    "section": "Java and Spring Boot",
    "duration": "1h 15m",
    "resumeLinked": false,
    "videos": [
      {
        "id": "P0-09-CC-J-33",
        "source": "CC-J",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 33,
        "title": "Lock-Free Concurrency | Compare-and-Swap | Atomic & Volatile Variables | Multithreading Part5",
        "minutes": 64,
        "videoUrl": "https://www.youtube.com/results?search_query=Lock-Free%20Concurrency%20%7C%20Compare-and-Swap%20%7C%20Atomic%20%26%20Volatile%20Variables%20%7C%20Multithreading%20Part5%20Concept%20%26%26%20Coding"
      },
      {
        "id": "P0-09-DT-4",
        "source": "DT",
        "channel": "Defog Tech",
        "playlist": "Java Concurrency",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLhfHPmPYPPRk6yMrcbfafFGSbE2EPK_A6",
        "position": 4,
        "title": "Java Memory Model in 10 minutes",
        "minutes": 11,
        "videoUrl": "https://www.youtube.com/results?search_query=Java%20Memory%20Model%20in%2010%20minutes%20Defog%20Tech"
      }
    ],
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
    ],
    "minutes": 75
  },
  {
    "id": "P0-10",
    "priority": "P0",
    "title": "Locks - Reentrant, ReadWrite, Semaphore",
    "section": "Java and Spring Boot",
    "duration": "47m",
    "resumeLinked": false,
    "videos": [
      {
        "id": "P0-10-CC-J-32",
        "source": "CC-J",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 32,
        "title": "Locks and Condition | Java Multithreading Part4 | Reentrant, ReadWrite, Stamped & Semaphore Lock",
        "minutes": 47,
        "videoUrl": "https://www.youtube.com/results?search_query=Locks%20and%20Condition%20%7C%20Java%20Multithreading%20Part4%20%7C%20Reentrant%2C%20ReadWrite%2C%20Stamped%20%26%20Semaphore%20Lock%20Concept%20%26%26%20Coding"
      }
    ],
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
      "tryLock() with timeout — give a real use case."
    ],
    "minutes": 47
  },
  {
    "id": "P1-11",
    "priority": "P1",
    "title": "Kafka fundamentals + consumer groups",
    "section": "Java and Spring Boot",
    "duration": "1h 10m",
    "resumeLinked": true,
    "videos": [
      {
        "id": "P1-11-JT-K-2",
        "source": "JT-K",
        "channel": "Java Techie",
        "playlist": "Kafka for beginners",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxwpWGoNokohsSW2CysI6lDc",
        "position": 2,
        "title": "Apache Kafka Components & Architecture Detailed Explanation in 15 min",
        "minutes": 16,
        "videoUrl": "https://www.youtube.com/results?search_query=Apache%20Kafka%20Components%20%26%20Architecture%20Detailed%20Explanation%20in%2015%20min%20Java%20Techie"
      },
      {
        "id": "P1-11-JT-K-7",
        "source": "JT-K",
        "channel": "Java Techie",
        "playlist": "Kafka for beginners",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxwpWGoNokohsSW2CysI6lDc",
        "position": 7,
        "title": "Apache Kafka Producer Example using SpringBoot 3.x",
        "minutes": 26,
        "videoUrl": "https://www.youtube.com/results?search_query=Apache%20Kafka%20Producer%20Example%20using%20SpringBoot%203.x%20Java%20Techie"
      },
      {
        "id": "P1-11-JT-K-8",
        "source": "JT-K",
        "channel": "Java Techie",
        "playlist": "Kafka for beginners",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxwpWGoNokohsSW2CysI6lDc",
        "position": 8,
        "title": "Apache Kafka Consumer Example using SpringBoot 3 | Consumer Groups",
        "minutes": 28,
        "videoUrl": "https://www.youtube.com/results?search_query=Apache%20Kafka%20Consumer%20Example%20using%20SpringBoot%203%20%7C%20Consumer%20Groups%20Java%20Techie"
      }
    ],
    "questions": [
      "Topic, partition, offset, consumer group — define each and how they interact.",
      "3 partitions, 5 consumers in one group. What happens to consumer 4 and 5?",
      "How does Kafka decide which partition a message goes to?",
      "What triggers a consumer group rebalance? What's the cost?",
      "What is ISR? What does acks=all actually wait for?",
      "Where does Kafka store consumer offsets?",
      "How does Kafka achieve high throughput? (Sequential IO, zero-copy, batching.)",
      "Kafka vs RabbitMQ — when would you pick each?"
    ],
    "minutes": 70
  },
  {
    "id": "P1-12",
    "priority": "P1",
    "title": "Kafka ordering, idempotency, exactly-once",
    "section": "Java and Spring Boot",
    "duration": "52m",
    "resumeLinked": true,
    "videos": [
      {
        "id": "P1-12-JT-K-15",
        "source": "JT-K",
        "channel": "Java Techie",
        "playlist": "Kafka for beginners",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxwpWGoNokohsSW2CysI6lDc",
        "position": 15,
        "title": "Does Kafka Guarantee Message Ordering? | Microservices Fix Inside!",
        "minutes": 28,
        "videoUrl": "https://www.youtube.com/results?search_query=Does%20Kafka%20Guarantee%20Message%20Ordering%3F%20%7C%20Microservices%20Fix%20Inside!%20Java%20Techie"
      },
      {
        "id": "P1-12-JT-K-16",
        "source": "JT-K",
        "channel": "Java Techie",
        "playlist": "Kafka for beginners",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxwpWGoNokohsSW2CysI6lDc",
        "position": 16,
        "title": "Why Kafka Processes the Same Message Twice? | Kafka Idempotency Real-Time Example",
        "minutes": 24,
        "videoUrl": "https://www.youtube.com/results?search_query=Why%20Kafka%20Processes%20the%20Same%20Message%20Twice%3F%20%7C%20Kafka%20Idempotency%20Real-Time%20Example%20Java%20Techie"
      }
    ],
    "questions": [
      "Consumer crashes after processing but before committing the offset. What happens on restart?",
      "At-least-once vs at-most-once vs exactly-once. Which is Kafka's default?",
      "How did LogLens turn at-least-once delivery into exactly-once effects? (Fingerprint-keyed idempotent upserts + commit-after-durable-write. He must say this fluently.)",
      "What ordering does Kafka actually guarantee — and at what scope?",
      "You need global ordering across a topic. What are you forced to give up?",
      "Auto-commit vs manual commit. Why is auto-commit dangerous?",
      "What is the idempotent producer, and what does it protect against?",
      "Kafka transactions — what do they cover and what do they not?"
    ],
    "minutes": 52
  },
  {
    "id": "P1-13",
    "priority": "P1",
    "title": "Kafka error handling, retries, DLT",
    "section": "Java and Spring Boot",
    "duration": "29m",
    "resumeLinked": true,
    "videos": [
      {
        "id": "P1-13-JT-K-13",
        "source": "JT-K",
        "channel": "Java Techie",
        "playlist": "Kafka for beginners",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxwpWGoNokohsSW2CysI6lDc",
        "position": 13,
        "title": "Kafka Error Handling with Spring Boot | Retry Strategies & Dead Letter Topics",
        "minutes": 29,
        "videoUrl": "https://www.youtube.com/results?search_query=Kafka%20Error%20Handling%20with%20Spring%20Boot%20%7C%20Retry%20Strategies%20%26%20Dead%20Letter%20Topics%20Java%20Techie"
      }
    ],
    "questions": [
      "A poison-pill message fails forever. What happens to the partition without a DLT?",
      "Blocking vs non-blocking retry — what does blocking retry do to the rest of the partition?",
      "How do you design a DLT? What metadata goes on the message?",
      "How do you replay from a DLT safely?",
      "Retryable vs non-retryable exceptions — how do you classify them?"
    ],
    "minutes": 29
  },
  {
    "id": "P1-14",
    "priority": "P1",
    "title": "Feature flags + externalized config",
    "section": "Java and Spring Boot",
    "duration": "1h 17m",
    "resumeLinked": true,
    "videos": [
      {
        "id": "P1-14-CC-SB-10",
        "source": "CC-SB",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 10,
        "title": "Spring boot @ConditionalOnProperty Annotation",
        "minutes": 20,
        "videoUrl": "https://www.youtube.com/results?search_query=Spring%20boot%20%40ConditionalOnProperty%20Annotation%20Concept%20%26%26%20Coding"
      },
      {
        "id": "P1-14-CC-SB-11",
        "source": "CC-SB",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 11,
        "title": "Spring boot @Profile annotation | How Profiling works in Spring boot",
        "minutes": 33,
        "videoUrl": "https://www.youtube.com/results?search_query=Spring%20boot%20%40Profile%20annotation%20%7C%20How%20Profiling%20works%20in%20Spring%20boot%20Concept%20%26%26%20Coding"
      },
      {
        "id": "P1-14-CC-SB-44",
        "source": "CC-SB",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 44,
        "title": "Spring Boot: ConfigurationProperties in-depth",
        "minutes": 24,
        "videoUrl": "https://www.youtube.com/results?search_query=Spring%20Boot%3A%20ConfigurationProperties%20in-depth%20Concept%20%26%26%20Coding"
      }
    ],
    "questions": [
      "Your feature flag flips mid-request. What happens? (His actual system.)",
      "@ConditionalOnProperty is evaluated at startup. So how do you build a runtime-togglable flag?",
      "What is the property resolution order in Spring Boot? (env var vs application.yml vs CLI arg.)",
      "@Value vs @ConfigurationProperties — when does the latter win?",
      "How do you refresh config without restarting? What are the risks?",
      "How do you scope a feature flag per tenant across 1,000+ tenants?",
      "How do you test both sides of a feature flag in CI?",
      "What's your rollback plan when a flag causes an incident?"
    ],
    "minutes": 77
  },
  {
    "id": "P1-15",
    "priority": "P1",
    "title": "Circuit breaker + retry (Resilience4j)",
    "section": "Java and Spring Boot",
    "duration": "38m",
    "resumeLinked": false,
    "videos": [
      {
        "id": "P1-15-JT-M-10",
        "source": "JT-M",
        "channel": "Java Techie",
        "playlist": "Microservice",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxxWhFkucZBoMxeYE6qTgEF8",
        "position": 10,
        "title": "Microservice | Resilience4J Circuit Breaker Implementation on Spring Boot",
        "minutes": 25,
        "videoUrl": "https://www.youtube.com/results?search_query=Microservice%20%7C%20Resilience4J%20Circuit%20Breaker%20Implementation%20on%20Spring%20Boot%20Java%20Techie"
      },
      {
        "id": "P1-15-JT-M-11",
        "source": "JT-M",
        "channel": "Java Techie",
        "playlist": "Microservice",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxxWhFkucZBoMxeYE6qTgEF8",
        "position": 11,
        "title": "Microservice | Resilience4J Retry Module Implementation With Spring Boot",
        "minutes": 13,
        "videoUrl": "https://www.youtube.com/results?search_query=Microservice%20%7C%20Resilience4J%20Retry%20Module%20Implementation%20With%20Spring%20Boot%20Java%20Techie"
      }
    ],
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
    "minutes": 38
  },
  {
    "id": "P1-16",
    "priority": "P1",
    "title": "Service discovery + API gateway",
    "section": "Java and Spring Boot",
    "duration": "58m",
    "resumeLinked": true,
    "videos": [
      {
        "id": "P1-16-JT-M-1",
        "source": "JT-M",
        "channel": "Java Techie",
        "playlist": "Microservice",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxxWhFkucZBoMxeYE6qTgEF8",
        "position": 1,
        "title": "Microservice | Spring Cloud Eureka + API Gateway + Spring Cloud Hystrix | PART-1",
        "minutes": 40,
        "videoUrl": "https://www.youtube.com/results?search_query=Microservice%20%7C%20Spring%20Cloud%20Eureka%20%2B%20API%20Gateway%20%2B%20Spring%20Cloud%20Hystrix%20%7C%20PART-1%20Java%20Techie"
      },
      {
        "id": "P1-16-JT-M-2",
        "source": "JT-M",
        "channel": "Java Techie",
        "playlist": "Microservice",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxxWhFkucZBoMxeYE6qTgEF8",
        "position": 2,
        "title": "Microservice | Spring Cloud Eureka + Gateway + Hystrix | PART-2",
        "minutes": 18,
        "videoUrl": "https://www.youtube.com/results?search_query=Microservice%20%7C%20Spring%20Cloud%20Eureka%20%2B%20Gateway%20%2B%20Hystrix%20%7C%20PART-2%20Java%20Techie"
      }
    ],
    "questions": [
      "Client-side vs server-side discovery. Which is Eureka?",
      "What happens to in-flight requests when a service instance dies?",
      "What is Eureka self-preservation mode and why does it exist?",
      "What belongs in a gateway vs in the service itself?",
      "How did you verify zero downtime in your dual-gateway migration? What was your rollback trigger?",
      "How does the gateway propagate identity to downstream services?",
      "Isn't the gateway a single point of failure? How do you address that?"
    ],
    "minutes": 58
  },
  {
    "id": "P1-17",
    "priority": "P1",
    "title": "Distributed tracing",
    "section": "Java and Spring Boot",
    "duration": "15m",
    "resumeLinked": true,
    "videos": [
      {
        "id": "P1-17-JT-M-7",
        "source": "JT-M",
        "channel": "Java Techie",
        "playlist": "Microservice",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxxWhFkucZBoMxeYE6qTgEF8",
        "position": 7,
        "title": "Microservice | Distributed log tracing using Spring Cloud Sleuth & Zipkin | PART-7",
        "minutes": 15,
        "videoUrl": "https://www.youtube.com/results?search_query=Microservice%20%7C%20Distributed%20log%20tracing%20using%20Spring%20Cloud%20Sleuth%20%26%20Zipkin%20%7C%20PART-7%20Java%20Techie"
      }
    ],
    "questions": [
      "Trace ID vs span ID — what does each identify?",
      "How does the trace ID survive a hop into an async thread or a Kafka message?",
      "What is context propagation and where does it typically break?",
      "How do you correlate a tenant with a trace in a multi-tenant system?",
      "What is sampling and why can't you trace 100% in production?"
    ],
    "minutes": 15
  },
  {
    "id": "P1-18",
    "priority": "P1",
    "title": "OAuth 2.0",
    "section": "Java and Spring Boot",
    "duration": "1h 28m",
    "resumeLinked": true,
    "videos": [
      {
        "id": "P1-18-CC-SB-40",
        "source": "CC-SB",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 40,
        "title": "OAuth 2.0: Explained with API Request and Response Sample | High Level System Design",
        "minutes": 35,
        "videoUrl": "https://www.youtube.com/results?search_query=OAuth%202.0%3A%20Explained%20with%20API%20Request%20and%20Response%20Sample%20%7C%20High%20Level%20System%20Design%20Concept%20%26%26%20Coding"
      },
      {
        "id": "P1-18-CC-SB-41",
        "source": "CC-SB",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 41,
        "title": "Spring boot: Security (Part-8) | OAUTH2 Authentication Implementation",
        "minutes": 52,
        "videoUrl": "https://www.youtube.com/results?search_query=Spring%20boot%3A%20Security%20(Part-8)%20%7C%20OAUTH2%20Authentication%20Implementation%20Concept%20%26%26%20Coding"
      }
    ],
    "questions": [
      "Name the four roles in OAuth 2.0.",
      "Authorization Code vs Client Credentials vs Implicit vs Password grant. Which is deprecated and why?",
      "Which grant did you use for machine-to-machine Snowflake auth? Why that one? (Client Credentials.)",
      "What is PKCE and what attack does it prevent?",
      "Why an access token AND a refresh token? Why not one long-lived token?",
      "Where do you store the client secret? (His answer: Azure Key Vault. Expect a follow-up on rotation.)",
      "OAuth vs OIDC — what does OIDC add?",
      "How do you revoke a token before it expires?"
    ],
    "minutes": 87
  },
  {
    "id": "P1-19",
    "priority": "P1",
    "title": "JWT + stateless auth",
    "section": "Java and Spring Boot",
    "duration": "1h 10m",
    "resumeLinked": false,
    "videos": [
      {
        "id": "P1-19-CC-SB-37",
        "source": "CC-SB",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 37,
        "title": "Spring boot: Security (Part-4) | Basic Authentication & Authorization | Stateless Authentication",
        "minutes": 20,
        "videoUrl": "https://www.youtube.com/results?search_query=Spring%20boot%3A%20Security%20(Part-4)%20%7C%20Basic%20Authentication%20%26%20Authorization%20%7C%20Stateless%20Authentication%20Concept%20%26%26%20Coding"
      },
      {
        "id": "P1-19-CC-SB-38",
        "source": "CC-SB",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 38,
        "title": "JWT Explained | JWT vs SessionID | JSON Web Token | Security Challenges with JWT & its Handling",
        "minutes": 49,
        "videoUrl": "https://www.youtube.com/results?search_query=JWT%20Explained%20%7C%20JWT%20vs%20SessionID%20%7C%20JSON%20Web%20Token%20%7C%20Security%20Challenges%20with%20JWT%20%26%20its%20Handling%20Concept%20%26%26%20Coding"
      }
    ],
    "questions": [
      "Three parts of a JWT. What's in each?",
      "Is a JWT encrypted? (No — signed. Correct anyone who says encrypted.)",
      "How do you invalidate a JWT before expiry? (The hard one. Blocklist, short TTL + refresh, token versioning.)",
      "JWT vs session ID — what do you trade away?",
      "Where do you store a JWT client-side? localStorage vs httpOnly cookie — which attack does each expose?",
      "HS256 vs RS256 — when is asymmetric required?",
      "What is the alg: none attack?",
      "How do you rotate signing keys without logging everyone out?"
    ],
    "minutes": 69
  },
  {
    "id": "P1-20",
    "priority": "P1",
    "title": "Exception handling / @ControllerAdvice",
    "section": "Java and Spring Boot",
    "duration": "56m",
    "resumeLinked": false,
    "videos": [
      {
        "id": "P1-20-CC-SB-22",
        "source": "CC-SB",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 22,
        "title": "Spring boot - Exception Handling | @ControllerAdvice | @ResponseStatus | @ExceptionHandler",
        "minutes": 56,
        "videoUrl": "https://www.youtube.com/results?search_query=Spring%20boot%20-%20Exception%20Handling%20%7C%20%40ControllerAdvice%20%7C%20%40ResponseStatus%20%7C%20%40ExceptionHandler%20Concept%20%26%26%20Coding"
      }
    ],
    "questions": [
      "@ControllerAdvice vs @ExceptionHandler vs @ResponseStatus — scope of each.",
      "Two handlers could match the same exception. Which wins?",
      "Checked vs unchecked — which do you throw from a service layer and why?",
      "How do you return a consistent error response shape across all endpoints?",
      "Why should you never leak a stack trace in an API response?",
      "How do you handle validation errors (MethodArgumentNotValidException) cleanly?",
      "Does @ControllerAdvice catch exceptions thrown from a filter? (No — say why.)"
    ],
    "minutes": 56
  },
  {
    "id": "P1-21",
    "priority": "P1",
    "title": "REST + ResponseEntity + status codes",
    "section": "Java and Spring Boot",
    "duration": "43m",
    "resumeLinked": false,
    "videos": [
      {
        "id": "P1-21-CC-SB-21",
        "source": "CC-SB",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 21,
        "title": "Spring boot ResponseEntity and Response Codes | 1xx, 2xx, 3xx, 4xx and 5xx Return Codes",
        "minutes": 43,
        "videoUrl": "https://www.youtube.com/results?search_query=Spring%20boot%20ResponseEntity%20and%20Response%20Codes%20%7C%201xx%2C%202xx%2C%203xx%2C%204xx%20and%205xx%20Return%20Codes%20Concept%20%26%26%20Coding"
      }
    ],
    "questions": [
      "401 vs 403. 400 vs 422. 409 — when?",
      "PUT vs PATCH vs POST — which are idempotent? Is POST ever?",
      "What does idempotency mean for an API, and how do you implement an idempotency key?",
      "Async job accepted but not finished — what status code, what response body?",
      "How do you version a REST API? Trade-offs of URL vs header versioning.",
      "When should a POST return 201 vs 200?",
      "Design pagination for a large collection. Offset vs cursor — which and why?"
    ],
    "minutes": 43
  },
  {
    "id": "P1-22",
    "priority": "P1",
    "title": "JVM memory + garbage collection",
    "section": "Java and Spring Boot",
    "duration": "49m",
    "resumeLinked": true,
    "videos": [
      {
        "id": "P1-22-CC-J-10",
        "source": "CC-J",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 10,
        "title": "Java Memory Management and Garbage Collection in Depth",
        "minutes": 49,
        "videoUrl": "https://www.youtube.com/results?search_query=Java%20Memory%20Management%20and%20Garbage%20Collection%20in%20Depth%20Concept%20%26%26%20Coding"
      }
    ],
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
    ],
    "minutes": 49
  },
  {
    "id": "P1-23",
    "priority": "P1",
    "title": "Immutable classes + Singleton",
    "section": "Java and Spring Boot",
    "duration": "28m",
    "resumeLinked": false,
    "videos": [
      {
        "id": "P1-23-CC-J-14",
        "source": "CC-J",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 14,
        "title": "Java Singleton and Immutable Class Explained with Examples | Java Classes in Depth - Part4",
        "minutes": 28,
        "videoUrl": "https://www.youtube.com/results?search_query=Java%20Singleton%20and%20Immutable%20Class%20Explained%20with%20Examples%20%7C%20Java%20Classes%20in%20Depth%20-%20Part4%20Concept%20%26%26%20Coding"
      }
    ],
    "questions": [
      "List every rule for making a class truly immutable. Which one do people forget? (Defensive copy of mutable fields.)",
      "Why is immutability inherently thread-safe?",
      "Is String immutable? What is the string pool and why does it exist?",
      "Write a thread-safe singleton four ways. Rank them.",
      "Why is enum singleton the best? What does it defend against that others don't?",
      "How can reflection or serialization break a singleton? How do you prevent it?",
      "Why is double-checked locking broken without volatile?"
    ],
    "minutes": 28
  },
  {
    "id": "P1-24",
    "priority": "P1",
    "title": "Generics",
    "section": "Java and Spring Boot",
    "duration": "52m",
    "resumeLinked": false,
    "videos": [
      {
        "id": "P1-24-CC-J-12",
        "source": "CC-J",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 12,
        "title": "Java Generic Classes | Java Classes in Depth - Part2",
        "minutes": 52,
        "videoUrl": "https://www.youtube.com/results?search_query=Java%20Generic%20Classes%20%7C%20Java%20Classes%20in%20Depth%20-%20Part2%20Concept%20%26%26%20Coding"
      }
    ],
    "questions": [
      "What is type erasure? Name two things it makes impossible.",
      "List<Object> vs List<?> vs List<? extends Object> — what can you add to each?",
      "Explain PECS. Give a real method signature using it.",
      "Why can't you create new T[]?",
      "Why is List<String> not a subtype of List<Object>?",
      "Bounded type parameters — write a generic method that only accepts Comparable.",
      "What is a bridge method?"
    ],
    "minutes": 52
  },
  {
    "id": "P2-25",
    "priority": "P2",
    "title": "JPA second-level caching",
    "section": "Java and Spring Boot",
    "duration": "41m",
    "resumeLinked": true,
    "videos": [
      {
        "id": "P2-25-CC-SB-26",
        "source": "CC-SB",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 26,
        "title": "Spring boot: JPA (Part-4) | Second Level Caching | L2 Caching",
        "minutes": 41,
        "videoUrl": "https://www.youtube.com/results?search_query=Spring%20boot%3A%20JPA%20(Part-4)%20%7C%20Second%20Level%20Caching%20%7C%20L2%20Caching%20Concept%20%26%26%20Coding"
      }
    ],
    "questions": [
      "L1 vs L2 — scope and lifetime of each.",
      "When does L2 hurt?",
      "How do you invalidate L2 across multiple app instances?",
      "Query cache — why is it usually a trap?",
      "How does Redis fit as an L2 provider?"
    ],
    "minutes": 41
  },
  {
    "id": "P2-26",
    "priority": "P2",
    "title": "JPA relationships",
    "section": "Java and Spring Boot",
    "duration": "2h 05m",
    "resumeLinked": false,
    "videos": [
      {
        "id": "P2-26-CC-SB-28",
        "source": "CC-SB",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 28,
        "title": "Spring boot: JPA (Part-6) | OneToOne Unidirectional and Bidirectional Mapping",
        "minutes": 66,
        "videoUrl": "https://www.youtube.com/results?search_query=Spring%20boot%3A%20JPA%20(Part-6)%20%7C%20OneToOne%20Unidirectional%20and%20Bidirectional%20Mapping%20Concept%20%26%26%20Coding"
      },
      {
        "id": "P2-26-CC-SB-29",
        "source": "CC-SB",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 29,
        "title": "Spring boot: JPA (Part-7) | OneToMany, ManyToOne & ManyToMany Unidirectional & Bidirectional Mapping",
        "minutes": 59,
        "videoUrl": "https://www.youtube.com/results?search_query=Spring%20boot%3A%20JPA%20(Part-7)%20%7C%20OneToMany%2C%20ManyToOne%20%26%20ManyToMany%20Unidirectional%20%26%20Bidirectional%20Mapping%20Concept%20%26%26%20Coding"
      }
    ],
    "questions": [
      "Who owns a bidirectional relationship? What does mappedBy do?",
      "Why does @OneToMany without mappedBy create a join table?",
      "CascadeType.ALL — when is it dangerous?",
      "What is orphan removal and how does it differ from CascadeType.REMOVE?",
      "Why avoid @ManyToMany in real systems?"
    ],
    "minutes": 125
  },
  {
    "id": "P2-27",
    "priority": "P2",
    "title": "Criteria API + Specification API",
    "section": "Java and Spring Boot",
    "duration": "59m",
    "resumeLinked": false,
    "videos": [
      {
        "id": "P2-27-CC-SB-31",
        "source": "CC-SB",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 31,
        "title": "Spring boot: JPA (Part-9) | Native Query and Criteria API",
        "minutes": 44,
        "videoUrl": "https://www.youtube.com/results?search_query=Spring%20boot%3A%20JPA%20(Part-9)%20%7C%20Native%20Query%20and%20Criteria%20API%20Concept%20%26%26%20Coding"
      },
      {
        "id": "P2-27-CC-SB-32",
        "source": "CC-SB",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 32,
        "title": "Spring boot: JPA (Part-10) | Specification API, Problem with Criteria API and its solution",
        "minutes": 14,
        "videoUrl": "https://www.youtube.com/results?search_query=Spring%20boot%3A%20JPA%20(Part-10)%20%7C%20Specification%20API%2C%20Problem%20with%20Criteria%20API%20and%20its%20solution%20Concept%20%26%26%20Coding"
      }
    ],
    "questions": [
      "When do you need dynamic queries?",
      "Criteria API vs Specification — what problem does Specification solve?",
      "How do you compose filters safely without SQL injection?",
      "Why is Criteria API considered unreadable?"
    ],
    "minutes": 58
  },
  {
    "id": "P2-28",
    "priority": "P2",
    "title": "Filters vs Interceptors",
    "section": "Java and Spring Boot",
    "duration": "55m",
    "resumeLinked": true,
    "videos": [
      {
        "id": "P2-28-CC-SB-18",
        "source": "CC-SB",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 18,
        "title": "Spring boot: Custom Interceptors | How to Intercept Incoming HTTP Request and Custom Annotations",
        "minutes": 30,
        "videoUrl": "https://www.youtube.com/results?search_query=Spring%20boot%3A%20Custom%20Interceptors%20%7C%20How%20to%20Intercept%20Incoming%20HTTP%20Request%20and%20Custom%20Annotations%20Concept%20%26%26%20Coding"
      },
      {
        "id": "P2-28-CC-SB-19",
        "source": "CC-SB",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 19,
        "title": "Spring boot: Filters vs Interceptors | Filters and Interceptors Advantage and UseCases for both",
        "minutes": 24,
        "videoUrl": "https://www.youtube.com/results?search_query=Spring%20boot%3A%20Filters%20vs%20Interceptors%20%7C%20Filters%20and%20Interceptors%20Advantage%20and%20UseCases%20for%20both%20Concept%20%26%26%20Coding"
      }
    ],
    "questions": [
      "Where does each sit in the request pipeline?",
      "Which one can see the handler method?",
      "Which runs first?",
      "Where do you put tenant resolution in a multi-tenant app, and why?"
    ],
    "minutes": 54
  },
  {
    "id": "P2-29",
    "priority": "P2",
    "title": "Spring Security architecture",
    "section": "Java and Spring Boot",
    "duration": "1h 04m",
    "resumeLinked": false,
    "videos": [
      {
        "id": "P2-29-CC-SB-34",
        "source": "CC-SB",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 34,
        "title": "Spring boot: Security (Part-1) | Architecture and SetUp",
        "minutes": 18,
        "videoUrl": "https://www.youtube.com/results?search_query=Spring%20boot%3A%20Security%20(Part-1)%20%7C%20Architecture%20and%20SetUp%20Concept%20%26%26%20Coding"
      },
      {
        "id": "P2-29-CC-SB-35",
        "source": "CC-SB",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 35,
        "title": "Spring boot: Security (Part-2) | Multiple User Creation & Storing Username & Password | inMemory, DB",
        "minutes": 47,
        "videoUrl": "https://www.youtube.com/results?search_query=Spring%20boot%3A%20Security%20(Part-2)%20%7C%20Multiple%20User%20Creation%20%26%20Storing%20Username%20%26%20Password%20%7C%20inMemory%2C%20DB%20Concept%20%26%26%20Coding"
      }
    ],
    "questions": [
      "Walk the filter chain top to bottom.",
      "What is SecurityContextHolder and where is it stored by default?",
      "Does the security context propagate to a child thread?",
      "How do you add a custom filter at the right position?",
      "Why BCrypt over SHA-256 for passwords?"
    ],
    "minutes": 65
  },
  {
    "id": "P2-30",
    "priority": "P2",
    "title": "Method security / @PreAuthorize",
    "section": "Java and Spring Boot",
    "duration": "29m",
    "resumeLinked": false,
    "videos": [
      {
        "id": "P2-30-CC-SB-42",
        "source": "CC-SB",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 42,
        "title": "Spring boot: Security (Part-9) | Method Security | Role based Authorization | @PreAuthorize and Post",
        "minutes": 29,
        "videoUrl": "https://www.youtube.com/results?search_query=Spring%20boot%3A%20Security%20(Part-9)%20%7C%20Method%20Security%20%7C%20Role%20based%20Authorization%20%7C%20%40PreAuthorize%20and%20Post%20Concept%20%26%26%20Coding"
      }
    ],
    "questions": [
      "@PreAuthorize vs @Secured vs @RolesAllowed.",
      "@PreAuthorize vs @PostAuthorize — when is Post necessary and what's the risk?",
      "Why does method security also fail on self-invocation? (Same proxy mechanism — link back to P0-02.)"
    ],
    "minutes": 29
  },
  {
    "id": "P2-31",
    "priority": "P2",
    "title": "Actuator",
    "section": "Java and Spring Boot",
    "duration": "31m",
    "resumeLinked": false,
    "videos": [
      {
        "id": "P2-31-CC-SB-43",
        "source": "CC-SB",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 43,
        "title": "Spring Boot Actuator in depth",
        "minutes": 31,
        "videoUrl": "https://www.youtube.com/results?search_query=Spring%20Boot%20Actuator%20in%20depth%20Concept%20%26%26%20Coding"
      }
    ],
    "questions": [
      "Liveness vs readiness probe — what does K8s do differently with each?",
      "Which endpoints must never be public?",
      "How do you add a custom health indicator?",
      "How do actuator metrics reach Prometheus?"
    ],
    "minutes": 31
  },
  {
    "id": "P2-32",
    "priority": "P2",
    "title": "Web attacks - CSRF, XSS, CORS, SQLi",
    "section": "Java and Spring Boot",
    "duration": "25m",
    "resumeLinked": false,
    "videos": [
      {
        "id": "P2-32-CC-SB-33",
        "source": "CC-SB",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "Spring Boot from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ",
        "position": 33,
        "title": "Understand Attacks: CSRF, XSS, CORS, SQL Injection with DEMO | Spring Security",
        "minutes": 25,
        "videoUrl": "https://www.youtube.com/results?search_query=Understand%20Attacks%3A%20CSRF%2C%20XSS%2C%20CORS%2C%20SQL%20Injection%20with%20DEMO%20%7C%20Spring%20Security%20Concept%20%26%26%20Coding"
      }
    ],
    "questions": [
      "Why can you disable CSRF for a stateless JWT API?",
      "CORS is enforced by whom — server or browser?",
      "How does a PreparedStatement actually prevent SQL injection?",
      "Stored vs reflected XSS."
    ],
    "minutes": 25
  },
  {
    "id": "P2-33",
    "priority": "P2",
    "title": "ForkJoinPool",
    "section": "Java and Spring Boot",
    "duration": "53m",
    "resumeLinked": false,
    "videos": [
      {
        "id": "P2-33-CC-J-36",
        "source": "CC-J",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 36,
        "title": "Java ForkJoinPool || WorkStealingPool || FixedThreadPool || CachedThreadPool",
        "minutes": 39,
        "videoUrl": "https://www.youtube.com/results?search_query=Java%20ForkJoinPool%20%7C%7C%20WorkStealingPool%20%7C%7C%20FixedThreadPool%20%7C%7C%20CachedThreadPool%20Concept%20%26%26%20Coding"
      },
      {
        "id": "P2-33-DT-20",
        "source": "DT",
        "channel": "Defog Tech",
        "playlist": "Java Concurrency",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLhfHPmPYPPRk6yMrcbfafFGSbE2EPK_A6",
        "position": 20,
        "title": "Understanding how ForkJoinPool works",
        "minutes": 13,
        "videoUrl": "https://www.youtube.com/results?search_query=Understanding%20how%20ForkJoinPool%20works%20Defog%20Tech"
      }
    ],
    "questions": [
      "What is work stealing?",
      "Why does ForkJoinPool use a deque per thread?",
      "Why is blocking IO inside a ForkJoinPool task a bug?",
      "Who else uses the common pool by default? (parallelStream — link to P0-06.)"
    ],
    "minutes": 52
  },
  {
    "id": "P2-34",
    "priority": "P2",
    "title": "Virtual threads + ThreadLocal",
    "section": "Java and Spring Boot",
    "duration": "23m",
    "resumeLinked": false,
    "videos": [
      {
        "id": "P2-34-CC-J-38",
        "source": "CC-J",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 38,
        "title": "Java VirtualThreads vs Normal Threads || ThreadLocal in Java",
        "minutes": 23,
        "videoUrl": "https://www.youtube.com/results?search_query=Java%20VirtualThreads%20vs%20Normal%20Threads%20%7C%7C%20ThreadLocal%20in%20Java%20Concept%20%26%26%20Coding"
      }
    ],
    "questions": [
      "Platform vs virtual thread — what changes?",
      "What is pinning and what causes it?",
      "Why are thread pools mostly pointless with virtual threads?",
      "Why is ThreadLocal a leak risk in a pooled thread?",
      "How does ThreadLocal behave with virtual threads?"
    ],
    "minutes": 23
  },
  {
    "id": "P2-35",
    "priority": "P2",
    "title": "Deadlock detection",
    "section": "Java and Spring Boot",
    "duration": "11m",
    "resumeLinked": false,
    "videos": [
      {
        "id": "P2-35-DT-25",
        "source": "DT",
        "channel": "Defog Tech",
        "playlist": "Java Concurrency",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLhfHPmPYPPRk6yMrcbfafFGSbE2EPK_A6",
        "position": 25,
        "title": "How detect and resolve DeadLocks in Java",
        "minutes": 11,
        "videoUrl": "https://www.youtube.com/results?search_query=How%20detect%20and%20resolve%20DeadLocks%20in%20Java%20Defog%20Tech"
      }
    ],
    "questions": [
      "Detect a deadlock in a live JVM — what tools?",
      "What does a thread dump show?",
      "Lock ordering as prevention — how do you enforce it?",
      "Livelock vs deadlock vs starvation."
    ],
    "minutes": 11
  },
  {
    "id": "P2-36",
    "priority": "P2",
    "title": "Java 17/21 features",
    "section": "Java and Spring Boot",
    "duration": "1h 27m",
    "resumeLinked": false,
    "videos": [
      {
        "id": "P2-36-CC-J-41",
        "source": "CC-J",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 41,
        "title": "Java 17: Sealed Classes and Interfaces",
        "minutes": 11,
        "videoUrl": "https://www.youtube.com/results?search_query=Java%2017%3A%20Sealed%20Classes%20and%20Interfaces%20Concept%20%26%26%20Coding"
      },
      {
        "id": "P2-36-CC-J-42",
        "source": "CC-J",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 42,
        "title": "Java 14: Switch Expressions Deep Dive",
        "minutes": 23,
        "videoUrl": "https://www.youtube.com/results?search_query=Java%2014%3A%20Switch%20Expressions%20Deep%20Dive%20Concept%20%26%26%20Coding"
      },
      {
        "id": "P2-36-CC-J-43",
        "source": "CC-J",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 43,
        "title": "Java 16: Pattern Matching for instanceof",
        "minutes": 9,
        "videoUrl": "https://www.youtube.com/results?search_query=Java%2016%3A%20Pattern%20Matching%20for%20instanceof%20Concept%20%26%26%20Coding"
      },
      {
        "id": "P2-36-CC-J-44",
        "source": "CC-J",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 44,
        "title": "Java 21: Pattern Matching for switch",
        "minutes": 9,
        "videoUrl": "https://www.youtube.com/results?search_query=Java%2021%3A%20Pattern%20Matching%20for%20switch%20Concept%20%26%26%20Coding"
      },
      {
        "id": "P2-36-CC-J-45",
        "source": "CC-J",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 45,
        "title": "Java 16: Record class",
        "minutes": 36,
        "videoUrl": "https://www.youtube.com/results?search_query=Java%2016%3A%20Record%20class%20Concept%20%26%26%20Coding"
      }
    ],
    "questions": [
      "What is a record and what does it generate?",
      "When is a record the wrong choice?",
      "What do sealed classes enable that final doesn't?",
      "How do sealed types + pattern matching give exhaustiveness?",
      "Which of these have you actually used on Java 17 at work?"
    ],
    "minutes": 88
  },
  {
    "id": "P2-37",
    "priority": "P2",
    "title": "Optional",
    "section": "Java and Spring Boot",
    "duration": "1h 14m",
    "resumeLinked": false,
    "videos": [
      {
        "id": "P2-37-CC-J-47",
        "source": "CC-J",
        "channel": "Concept && Coding - by Shrayansh",
        "playlist": "JAVA from Basics to Advanced",
        "playlistUrl": "https://www.youtube.com/playlist?list=PL6W8uoQQ2c63f469AyV78np0rbxRFppkx",
        "position": 47,
        "title": "Master Java Optional from Java 8 to 11 | All Methods with Real Examples",
        "minutes": 74,
        "videoUrl": "https://www.youtube.com/results?search_query=Master%20Java%20Optional%20from%20Java%208%20to%2011%20%7C%20All%20Methods%20with%20Real%20Examples%20Concept%20%26%26%20Coding"
      }
    ],
    "questions": [
      "What was Optional designed for? (Return types — not fields, not params.)",
      "Why is Optional as an entity field a bad idea?",
      "orElse vs orElseGet — which eagerly evaluates?",
      "Why is Optional.get() a code smell?",
      "Is Optional serializable?"
    ],
    "minutes": 74
  },
  {
    "id": "P2-38",
    "priority": "P2",
    "title": "Kubernetes basics",
    "section": "Java and Spring Boot",
    "duration": "27m",
    "resumeLinked": true,
    "videos": [
      {
        "id": "P2-38-JT-K8-1",
        "source": "JT-K8",
        "channel": "Java Techie",
        "playlist": "Kubernetes",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxybsyOxK7WFtteH42ayn5i9",
        "position": 1,
        "title": "Kubernetes Tutorial | Basic Introduction and Getting Started part-1",
        "minutes": 6,
        "videoUrl": "https://www.youtube.com/results?search_query=Kubernetes%20Tutorial%20%7C%20Basic%20Introduction%20and%20Getting%20Started%20part-1%20Java%20Techie"
      },
      {
        "id": "P2-38-JT-K8-2",
        "source": "JT-K8",
        "channel": "Java Techie",
        "playlist": "Kubernetes",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxybsyOxK7WFtteH42ayn5i9",
        "position": 2,
        "title": "Kubernetes Tutorial | K8s Components Explained in 10 mins | Part-2",
        "minutes": 10,
        "videoUrl": "https://www.youtube.com/results?search_query=Kubernetes%20Tutorial%20%7C%20K8s%20Components%20Explained%20in%2010%20mins%20%7C%20Part-2%20Java%20Techie"
      },
      {
        "id": "P2-38-JT-K8-3",
        "source": "JT-K8",
        "channel": "Java Techie",
        "playlist": "Kubernetes",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxybsyOxK7WFtteH42ayn5i9",
        "position": 3,
        "title": "Kubernetes Tutorial | Kubernetes Basics & Architecture Explained in 10 mins | Part-3",
        "minutes": 11,
        "videoUrl": "https://www.youtube.com/results?search_query=Kubernetes%20Tutorial%20%7C%20Kubernetes%20Basics%20%26%20Architecture%20Explained%20in%2010%20mins%20%7C%20Part-3%20Java%20Techie"
      }
    ],
    "questions": [
      "Pod vs Deployment vs Service vs ReplicaSet.",
      "What does the control plane do?",
      "Which Service type for external traffic?",
      "What happens when a pod fails a liveness probe?"
    ],
    "minutes": 27
  },
  {
    "id": "P2-39",
    "priority": "P2",
    "title": "K8s deployment + ConfigMap/Secrets",
    "section": "Java and Spring Boot",
    "duration": "50m",
    "resumeLinked": true,
    "videos": [
      {
        "id": "P2-39-JT-K8-6",
        "source": "JT-K8",
        "channel": "Java Techie",
        "playlist": "Kubernetes",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxybsyOxK7WFtteH42ayn5i9",
        "position": 6,
        "title": "Kubernetes Tutorial | Run & Deploy Spring Boot Application in K8s Cluster using yaml configuration",
        "minutes": 21,
        "videoUrl": "https://www.youtube.com/results?search_query=Kubernetes%20Tutorial%20%7C%20Run%20%26%20Deploy%20Spring%20Boot%20Application%20in%20K8s%20Cluster%20using%20yaml%20configuration%20Java%20Techie"
      },
      {
        "id": "P2-39-JT-K8-8",
        "source": "JT-K8",
        "channel": "Java Techie",
        "playlist": "Kubernetes",
        "playlistUrl": "https://www.youtube.com/playlist?list=PLVz2XdJiJQxybsyOxK7WFtteH42ayn5i9",
        "position": 8,
        "title": "Kubernetes Tutorial | ConfigMap & Secrets Implementation in Spring Boot CRUD Example",
        "minutes": 28,
        "videoUrl": "https://www.youtube.com/results?search_query=Kubernetes%20Tutorial%20%7C%20ConfigMap%20%26%20Secrets%20Implementation%20in%20Spring%20Boot%20CRUD%20Example%20Java%20Techie"
      }
    ],
    "questions": [
      "Resource requests vs limits — what happens when each is exceeded?",
      "Why does a container OOM-kill even when JVM heap looks healthy? (Link to P1-22.)",
      "ConfigMap vs Secret — is a Secret encrypted by default?",
      "Rolling update — how does K8s guarantee zero downtime?",
      "How do config changes reach a running pod?"
    ],
    "minutes": 49
  }
];

export const CORE_STACK_PRIORITIES = ["P0","P1","P2"];

export const CORE_STACK_PRIORITY_CONFIG = {
  P0: { label: "P0", blurb: "Asked in ~every loop", cls: "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30" },
  P1: { label: "P1", blurb: "Common, and claimed on the resume", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  P2: { label: "P2", blurb: "Depth differentiator", cls: "bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30" },
  P3: { label: "P3", blurb: "Remedial only", cls: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30" },
};

export const CORE_STACK_TOTAL = 39;

export const CORE_STACK_PRIORITY_COUNTS = {"P0":10,"P1":14,"P2":15};

export const CORE_STACK_VIDEO_TOTAL = 72;
