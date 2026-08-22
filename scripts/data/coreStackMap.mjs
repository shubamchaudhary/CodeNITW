/* THE CURATED CORE STACK MAP — edit this, then run `node scripts/genCoreStack.mjs`.

   Scope: Java, Spring Boot, and the non-AI technologies on the resume
   (PostgreSQL, Redis, Kafka, Docker/Kubernetes, JUnit/Mockito/Testcontainers,
   microservices, multi-tenancy). No LLD, no HLD — those are a separate track.

   ── Priorities ─────────────────────────────────────────────────────────────
   P0  Asked in nearly every Java backend loop at this level, or a resume claim
       that sinks the round if fumbled.
   P1  Very likely. Do before any real interview.
   P2  Depth. Separates a good offer from a great one; skip under time pressure.

   Priority is set from what interview write-ups actually report being asked
   (see the sources block at the bottom of this file), not from taste.

   ── Resource kinds ─────────────────────────────────────────────────────────
   csv:      "CC-SB#13"  → resolved against scripts/data/javaSpringPrepTracker.csv,
                           which carries the verified channel/playlist/title/
                           duration for every video the original plan used. The
                           generator FAILS if the reference is not in that file.
   playlist: "CC-J#19"   → a video known by playlist position and title but whose
                           duration was never tracked. Rendered without a runtime.
   video:    {...}        → a direct watch URL.
   doc:      {...}        → written reference.
   self:     {...}        → your own codebase. There is no substitute for it and
                           no link to give; the questions are the whole card.

   `inherit` pulls a topic's question list from scripts/data/javaSpringPrepHandoff.md
   by its old id; `questions` adds to that (or stands alone when there is no
   inherit). Nothing is retyped, so nothing drifts.
*/

export const SECTIONS = [
  { key: "java", label: "Java Core" },
  { key: "concurrency", label: "Concurrency & Multithreading" },
  { key: "spring", label: "Spring Boot & Data Access" },
  { key: "data", label: "Databases & Caching" },
  { key: "kafka", label: "Kafka & Messaging" },
  { key: "platform", label: "Microservices & Platform" },
  { key: "testing", label: "Testing & Delivery" },
  { key: "resume", label: "Your Systems — resume defence" },
];

export const TOPICS = [
  // ─── Java Core ─────────────────────────────────────────────────────────────
  {
    id: "JAVA-01",
    section: "java",
    priority: "P0",
    title: "Collections framework + HashMap internals",
    why: "The single most reliably asked core-Java topic; HashMap internals came up by name in SDE-2 write-ups.",
    resources: [{ csv: "CC-J#22" }, { csv: "CC-J#25" }],
    inherit: "P0-05",
  },
  {
    id: "JAVA-02",
    section: "java",
    priority: "P0",
    title: "Streams, lambdas & functional interfaces",
    why: "Java 8 stream/lambda questions appear in essentially every loop at 2–4 years.",
    resources: [{ csv: "CC-J#17" }, { csv: "CC-J#28" }],
    inherit: "P0-06",
  },
  {
    id: "JAVA-03",
    section: "java",
    priority: "P0",
    title: "OOP, exceptions & error handling",
    why: "Reported verbatim in SDE-2 rounds: exception hierarchy, checked vs unchecked, try-with-resources, propagation. It was buried in the old plan's remedial pile — it should not have been.",
    resources: [
      {
        playlist: "CC-J#1",
        title: "OOPs Concept in Java with Examples | 4 Pillars of Object Oriented Programming",
        minutes: 217,
        note: "3h36m — you have shipped Java for 2.5 years. Skim it to find gaps, don't watch it end to end.",
      },
      {
        playlist: "CC-J#15",
        title: "Default, Static & Private Method in Interface - Java8 and Java9 features | Java Interfaces Part2",
        minutes: 24,
      },
      { playlist: "CC-J#19", title: "Exception Handling in Java with Examples", minutes: 115 },
    ],
    questions: [
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
      "What is the cost of throwing an exception, and why is exception-as-control-flow discouraged?",
    ],
  },
  {
    id: "JAVA-04",
    section: "java",
    priority: "P1",
    title: "JVM memory model & garbage collection",
    why: "Standard at this level, and your K8s pods make the container-vs-heap question personal.",
    resources: [{ csv: "CC-J#10" }],
    inherit: "P1-22",
  },
  {
    id: "JAVA-05",
    section: "java",
    priority: "P1",
    title: "Java 17 & 21 — records, sealed types, pattern matching, virtual threads",
    why: "Raised from P2: 2026 write-ups treat Java 17 features as assumed knowledge, and virtual threads are now a live interview topic. You ship Java 17 — being vague here reads badly.",
    resources: [
      { csv: "CC-J#41" },
      { csv: "CC-J#42" },
      { csv: "CC-J#43" },
      { csv: "CC-J#44" },
      { csv: "CC-J#45" },
      { csv: "CC-J#38" },
    ],
    inherit: "P2-36",
    questions: [
      "Platform thread vs virtual thread — what actually changes, and what does not?",
      "What is pinning, what causes it, and how would you detect it?",
      "Why are thread pools mostly pointless with virtual threads — and where do you still want one?",
      "Virtual threads vs reactive (WebFlux/Reactor) — what problem does each solve? Which would you pick now?",
      "Where do virtual threads NOT help? (CPU-bound work — say so plainly.)",
      "Which of Java 17/21's features have you actually used at work, and which would you adopt next?",
    ],
  },
  {
    id: "JAVA-06",
    section: "java",
    priority: "P1",
    title: "Immutability, equals/hashCode & singletons",
    resources: [{ csv: "CC-J#14" }],
    inherit: "P1-23",
  },
  {
    id: "JAVA-07",
    section: "java",
    priority: "P1",
    title: "Generics & type erasure",
    resources: [{ csv: "CC-J#12" }],
    inherit: "P1-24",
  },
  {
    id: "JAVA-08",
    section: "java",
    priority: "P2",
    title: "Optional — the API and its misuse",
    resources: [{ csv: "CC-J#47" }],
    inherit: "P2-37",
  },
  {
    id: "JAVA-09",
    section: "java",
    priority: "P2",
    title: "Comparable vs Comparator, TreeMap, LinkedHashMap & Set",
    why: "Cheap points. Comparator questions show up constantly as a warm-up before something harder.",
    resources: [
      { playlist: "CC-J#23", title: "Collections in Java - Part2 | Comparator Vs Comparable | PriorityQueue", minutes: 61 },
      { playlist: "CC-J#26", title: "Collections in Java - Part5 | LinkedHashMap and TreeMap in depth", minutes: 37 },
      { playlist: "CC-J#27", title: "Collections in Java - Part6 | SET", minutes: 21 },
    ],
    questions: [
      "Comparable vs Comparator — which one changes the class, and which one do you reach for in practice?",
      "Sort a list of objects by two fields, second descending. Write it with Comparator chaining.",
      "What breaks if your comparator is inconsistent with equals? Where does it bite you? (TreeMap/TreeSet.)",
      "HashSet vs LinkedHashSet vs TreeSet — ordering, cost, and when each is the right pick.",
      "How does TreeMap achieve ordering, and what is the complexity of get/put?",
      "LinkedHashMap in access-order mode — how do you build an LRU cache from it in five lines?",
      "Your comparator throws \"Comparison method violates its general contract\" in production. What happened?",
    ],
  },

  // ─── Concurrency ───────────────────────────────────────────────────────────
  {
    id: "CONC-01",
    section: "concurrency",
    priority: "P0",
    title: "Threads, executors & ThreadPoolExecutor",
    why: "Your resume says Multithreading & Concurrency and Asynchronous Processing. Expect a whole round.",
    resources: [
      { csv: "CC-J#29" },
      { csv: "CC-J#34" },
      {
        playlist: "CC-J#37",
        title: "Java ScheduledThreadPoolExecutor || Shutdown Vs AwaitTermination || Multithreading in Java",
        minutes: 23,
        note: "Where shutdown() vs shutdownNow() vs awaitTermination() is actually taught.",
      },
    ],
    inherit: "P0-07",
  },
  {
    id: "CONC-01B",
    section: "concurrency",
    priority: "P0",
    title: "Thread lifecycle, creation & inter-thread communication",
    why: "MISSED IN THE FIRST PASS. The plan asked you to name every thread state and to explain wait/notify, but pointed at no video that teaches either — this is where both live, along with the classic 'N threads printing in sequence' machinery. Thread states, wait/notify and daemon threads are standard asks at 2–3 years.",
    resources: [
      {
        playlist: "CC-J#30",
        title: "Thread Creation, Thread Lifecycle and Inter-Thread Communication | Multithreading in Java: Part2",
        minutes: 98,
      },
      {
        playlist: "CC-J#31",
        title: "Thread Joining, Daemon Thread, Thread Priority | Multithreading in Java: Part3",
      },
    ],
    questions: [
      "Name every thread state and every transition between them. Which state does a thread blocked on a monitor sit in — and which one does wait() put it in?",
      "Thread vs Runnable vs Callable — which do you extend, which do you implement, and why does it matter?",
      "start() vs run() — what actually happens if you call run() directly?",
      "Can you call start() twice on the same Thread object? What happens?",
      "wait(), notify() and notifyAll() — why must all three be called inside a synchronized block?",
      "Why is wait() on Object and sleep() on Thread? What does each do to the lock?",
      "What is a lost wakeup, and why must wait() always sit in a while loop?",
      "notify() vs notifyAll() — when is notify() a bug waiting to happen?",
      "What does join() do, and how would you wait for ten threads with a timeout?",
      "What is a daemon thread? What happens to one when the last non-daemon thread exits — and why does that make daemon threads wrong for a write path?",
      "Does thread priority guarantee anything? What does it actually do?",
      "An uncaught exception kills a thread. Where does it go, and how do you catch it? (UncaughtExceptionHandler.)",
      "Deadlock vs livelock vs starvation — one line each, and which one does a thread dump make obvious?",
    ],
  },
  {
    id: "CONC-02",
    section: "concurrency",
    priority: "P0",
    title: "volatile, atomics, CAS & the Java Memory Model",
    why: "\"volatile vs atomic\" is reported almost verbatim in SDE-2 loops.",
    resources: [{ csv: "CC-J#33" }, { csv: "DT#4" }],
    inherit: "P0-09",
  },
  {
    id: "CONC-03",
    section: "concurrency",
    priority: "P0",
    title: "Locks, wait/notify & coordination primitives",
    why: "This is where the classic live-coding ask lands: N threads printing in strict sequence.",
    resources: [{ csv: "CC-J#32" }],
    inherit: "P0-10",
    questions: [
      "Three threads must print 1,2,3,1,2,3… in strict order. Write it with wait/notify, then with Semaphores. Which would you ship?",
      "Print odd/even alternately with two threads — where does the naive version deadlock or miss a signal?",
      "Why notifyAll() over notify()? What is the lost-wakeup problem?",
      "Why must wait() always sit inside a loop that rechecks the condition?",
      "Producer–consumer with a bounded buffer: implement it with BlockingQueue, then say what BlockingQueue is doing for you underneath.",
    ],
  },
  {
    id: "CONC-04",
    section: "concurrency",
    priority: "P0",
    title: "CompletableFuture & @Async",
    why: "Directly backs the async/sync-fallback work on your resume.",
    resources: [{ csv: "CC-J#35" }, { csv: "CC-SB#16" }, { csv: "CC-SB#17" }],
    inherit: "P0-08",
  },
  {
    id: "CONC-05",
    section: "concurrency",
    priority: "P2",
    title: "ForkJoinPool, work stealing & parallel streams",
    resources: [{ csv: "CC-J#36" }, { csv: "DT#20" }],
    inherit: "P2-33",
  },
  {
    id: "CONC-06",
    section: "concurrency",
    priority: "P2",
    title: "Deadlock detection, thread dumps & ThreadLocal leaks",
    resources: [{ csv: "DT#25" }, { csv: "CC-J#38" }],
    inherit: "P2-35",
    questions: [
      "Why is ThreadLocal a leak risk in a pooled thread, and what is the fix?",
      "How does ThreadLocal behave with virtual threads?",
      "A request-scoped ThreadLocal leaks into the next request. How does that happen and how do you prove it?",
    ],
  },

  // ─── Spring Boot & Data Access ─────────────────────────────────────────────
  {
    id: "SPRING-01",
    section: "spring",
    priority: "P0",
    title: "@Transactional — propagation, isolation & proxy failure",
    why: "The self-invocation question is reported by name in interview write-ups. Highest-yield Spring topic there is.",
    resources: [{ csv: "CC-SB#13" }, { csv: "CC-SB#14" }, { csv: "CC-SB#15" }],
    inherit: "P0-01",
  },
  {
    id: "SPRING-02",
    section: "spring",
    priority: "P0",
    title: "Bean lifecycle, IoC, DI & scopes",
    why: "\"Spring lifecycle\", @Component vs @Bean vs @Qualifier — reported repeatedly.",
    resources: [{ csv: "CC-SB#6" }, { csv: "CC-SB#7" }, { csv: "CC-SB#8" }],
    inherit: "P0-03",
  },
  {
    id: "SPRING-03",
    section: "spring",
    priority: "P0",
    title: "Spring Boot fundamentals — starters, auto-configuration, profiles & config",
    why: "MISSING FROM THE OLD PLAN. \"How does auto-configuration work?\" is one of the most-asked Spring Boot questions at 2–5 years, and the old plan only covered @ConditionalOnProperty in passing.",
    resources: [
      { csv: "CC-SB#10" },
      { csv: "CC-SB#11" },
      { csv: "CC-SB#44" },
      {
        playlist: "CC-SB#1",
        title: "Introduction to Spring boot | Its Advantage over Spring MVC and Servlets based Web applications",
        minutes: 46,
      },
      {
        playlist: "CC-SB#3",
        title: "Introduction to Maven and its Lifecycle | Spring boot Maven project",
        minutes: 48,
      },
      {
        playlist: "CC-SB#8",
        title: "Spring boot: Dynamically Initialized Beans | Value Annotation",
        minutes: 11,
      },
      {
        doc: {
          title: "Spring Boot reference — Auto-configuration",
          site: "docs.spring.io",
          url: "https://docs.spring.io/spring-boot/reference/using/auto-configuration.html",
          note: "The playlist never opens up auto-configuration itself. Read this for @EnableAutoConfiguration, the conditions report (--debug) and excluding a configuration.",
          minutes: 20,
          estimate: true,
        },
      },
    ],
    inherit: "P1-14",
    questions: [
      "What does @SpringBootApplication actually expand to? Name all three annotations and what each does.",
      "Walk auto-configuration end to end: what reads spring.factories / AutoConfiguration.imports, and when does a condition get evaluated?",
      "@ConditionalOnMissingBean — why is it the backbone of auto-configuration, and how do you override an auto-configured bean?",
      "How do you debug why a bean you expected was NOT created? (--debug / the conditions report.)",
      "What is a starter, and what would you put in one if you wrote your own?",
      "Property resolution order: env var vs application.yml vs profile-specific yml vs CLI arg — which wins?",
      "@Value vs @ConfigurationProperties — when does the latter win, and how do you validate it?",
      "How does an embedded server get chosen and started? What changes if you exclude Tomcat?",
      "Fat jar layout — why can't a plain java -cp run it, and what does the loader do?",
    ],
  },
  {
    id: "SPRING-04",
    section: "spring",
    priority: "P0",
    title: "JPA core — entity lifecycle, L1 cache & the N+1 problem",
    why: "N+1 and lazy loading are named explicitly in current interview guides. Spring Data JPA is your loudest resume claim.",
    resources: [{ csv: "CC-SB#24" }, { csv: "CC-SB#25" }, { csv: "CC-SB#30" }],
    inherit: "P0-04",
  },
  {
    id: "SPRING-05",
    section: "spring",
    priority: "P0",
    title: "REST API design — status codes, idempotency, versioning, pagination",
    why: "Raised from P1: \"REST API design\" appears as its own round topic in SDE-2 write-ups, and it is the easiest place to sound senior or junior.",
    resources: [
      { csv: "CC-SB#21" },
      {
        playlist: "CC-SB#4",
        title: "Spring boot Annotations (Controller Layer) | Controller, RestController, RequestMapping etc.",
        minutes: 35,
      },
    ],
    inherit: "P1-21",
    questions: [
      "@Controller vs @RestController — what does the difference actually change at runtime?",
      "@RequestParam vs @PathVariable vs @RequestBody — and when is each the wrong choice?",
      "How do you validate a request body, and what does the failure response look like end to end?",
      "Design the idempotency-key flow for a POST that creates a payment. Where do you store the key, and for how long?",
      "A client retries a timed-out POST. Walk through what your server does — twice.",
    ],
  },
  {
    id: "SPRING-06",
    section: "spring",
    priority: "P1",
    title: "AOP & the proxy mechanism",
    why: "The mechanism under @Transactional, @Async and @Cacheable — reach for it whenever a self-invocation follow-up lands.",
    resources: [{ csv: "CC-SB#12" }],
    inherit: "P0-02",
  },
  {
    id: "SPRING-07",
    section: "spring",
    priority: "P1",
    title: "JPA relationships, fetching & cascades",
    why: "Raised from P2: mapping questions are routine, and they are where N+1 actually originates.",
    resources: [{ csv: "CC-SB#28" }, { csv: "CC-SB#29" }],
    inherit: "P2-26",
  },
  {
    id: "SPRING-08",
    section: "spring",
    priority: "P1",
    title: "Exception handling — @ControllerAdvice & error contracts",
    resources: [{ csv: "CC-SB#22" }],
    inherit: "P1-20",
  },
  {
    id: "SPRING-09",
    section: "spring",
    priority: "P1",
    title: "Spring Security architecture, JWT & stateless auth",
    why: "Merged: the filter chain and JWT are one story in an interview, and current guides list securing endpoints with OAuth2/JWT as a core expectation.",
    resources: [{ csv: "CC-SB#34" }, { csv: "CC-SB#35" }, { csv: "CC-SB#37" }, { csv: "CC-SB#38" }],
    inherit: "P2-29",
    extraInherit: "P1-19",
  },
  {
    id: "SPRING-10",
    section: "spring",
    priority: "P1",
    title: "OAuth 2.0 & service-to-service tokens",
    why: "Your Snowflake B2C auth and adaptive S2S tokens live here.",
    resources: [{ csv: "CC-SB#40" }, { csv: "CC-SB#41" }],
    inherit: "P1-18",
  },
  {
    id: "SPRING-11",
    section: "spring",
    priority: "P2",
    title: "Filters vs interceptors — and where tenant resolution goes",
    resources: [{ csv: "CC-SB#18" }, { csv: "CC-SB#19" }],
    inherit: "P2-28",
  },
  {
    id: "SPRING-12",
    section: "spring",
    priority: "P2",
    title: "Criteria API & Specifications — dynamic queries",
    resources: [{ csv: "CC-SB#31" }, { csv: "CC-SB#32" }],
    inherit: "P2-27",
  },
  {
    id: "SPRING-13",
    section: "spring",
    priority: "P2",
    title: "Method security — @PreAuthorize & @PostAuthorize",
    resources: [{ csv: "CC-SB#42" }],
    inherit: "P2-30",
  },
  {
    id: "SPRING-14",
    section: "spring",
    priority: "P2",
    title: "Actuator, health probes & metrics",
    resources: [{ csv: "CC-SB#43" }],
    inherit: "P2-31",
  },
  {
    id: "SPRING-15",
    section: "spring",
    priority: "P2",
    title: "Web attacks — CSRF, XSS, CORS, SQL injection",
    resources: [{ csv: "CC-SB#33" }],
    inherit: "P2-32",
  },
  {
    id: "SPRING-16",
    section: "spring",
    priority: "P2",
    title: "JPA second-level cache",
    resources: [{ csv: "CC-SB#26" }],
    inherit: "P2-25",
  },

  // ─── Databases & Caching ───────────────────────────────────────────────────
  {
    id: "DATA-01",
    section: "data",
    priority: "P0",
    title: "SQL & indexing — B-Tree, composite indexes, EXPLAIN, join order",
    why: "MISSING FROM THE OLD PLAN, and it is a standing round of its own. Write-ups put SQL beside Core Java and Spring Boot; 2026 guides stress index-vs-scan reasoning and reading a plan. You claim PostgreSQL and a GIN/B-Tree/HNSW index design — this will be probed.",
    resources: [
      {
        doc: {
          title: "Use The Index, Luke! — SQL indexing and tuning for developers",
          site: "use-the-index-luke.com",
          url: "https://use-the-index-luke.com/sql/table-of-contents",
          note: "Read: Anatomy of an Index, The Where Clause, Sorting & Grouping, Partial Results. Skip the rest.",
          minutes: 90,
          estimate: true,
        },
      },
    ],
    questions: [
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
      "When is a full table scan the RIGHT plan?",
    ],
  },
  {
    id: "DATA-02",
    section: "data",
    priority: "P0",
    title: "Redis & caching patterns",
    why: "MISSING FROM THE OLD PLAN. Redis and Caching are both listed on your resume, and your LLM agent stages writes in Redis — expect the consistency question. Cache-aside, invalidation, stampede and distributed locks are standard asks.",
    resources: [
      {
        video: {
          title: "Spring Boot | Spring Data Redis as Cache | @Cacheable | @CacheEvict | @CachePut",
          channel: "Java Techie",
          url: "https://www.youtube.com/watch?v=vpe4aDu5ixI",
          minutes: 25,
          estimate: true,
        },
      },
      {
        doc: {
          title: "Redis — data types & key eviction",
          site: "redis.io",
          url: "https://redis.io/docs/latest/develop/data-types/",
          note: "Enough to say which structure you'd pick and why; skip the command reference.",
          minutes: 20,
          estimate: true,
        },
      },
    ],
    questions: [
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
      "Your cache hit rate drops from 95% to 40% overnight. Walk your investigation.",
    ],
  },
  {
    id: "DATA-03",
    section: "data",
    priority: "P1",
    title: "Postgres transactions, MVCC, locking & connection pooling",
    why: "MISSING FROM THE OLD PLAN. The old plan taught JPA isolation levels but never the database that implements them. Long transactions, lock waits and pool exhaustion are the incidents you will be asked to debug.",
    resources: [
      {
        doc: {
          title: "PostgreSQL — Chapter 13: Concurrency Control (MVCC & transaction isolation)",
          site: "postgresql.org",
          url: "https://www.postgresql.org/docs/current/mvcc.html",
          note: "Sections 13.1–13.3 only.",
          minutes: 45,
          estimate: true,
        },
      },
    ],
    questions: [
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
      "Deadlock in production: how do you find the two statements involved?",
    ],
  },

  // ─── Kafka ─────────────────────────────────────────────────────────────────
  {
    id: "KAFKA-01",
    section: "kafka",
    priority: "P0",
    title: "Kafka fundamentals & consumer groups",
    why: "Raised from P1. Kafka is on your resume and drives LogLens; current guides list consumer-group and rebalance mechanics as standard for experienced Java devs.",
    resources: [{ csv: "JT-K#2" }, { csv: "JT-K#7" }, { csv: "JT-K#8" }],
    inherit: "P1-11",
    questions: [
      "What triggers a rebalance, and what does StickyAssignor change about it?",
      "Your consumer takes 40s per message and max.poll.interval.ms is 300000 with max.poll.records 500. What goes wrong?",
      "Which metrics tell you a consumer is falling behind vs failing to commit? (records-lag-max vs commit-rate.)",
    ],
  },
  {
    id: "KAFKA-02",
    section: "kafka",
    priority: "P0",
    title: "Ordering, idempotency & exactly-once effects",
    why: "Your headline resume claim: at-least-once delivery turned into exactly-once effects. If one Kafka topic is P0, it is this one.",
    resources: [{ csv: "JT-K#15" }, { csv: "JT-K#16" }],
    inherit: "P1-12",
    questions: [
      "enable.idempotence=true is set. Can a downstream sink still see duplicates? Why?",
      "Where exactly do you commit the offset relative to the durable write, and what does each ordering cost you?",
    ],
  },
  {
    id: "KAFKA-03",
    section: "kafka",
    priority: "P1",
    title: "Error handling, retries & dead-letter topics",
    resources: [{ csv: "JT-K#13" }],
    inherit: "P1-13",
  },

  // ─── Microservices & Platform ──────────────────────────────────────────────
  {
    id: "PLAT-01",
    section: "platform",
    priority: "P1",
    title: "Distributed data — saga, outbox, idempotency & eventual consistency",
    why: "MISSING FROM THE OLD PLAN. Saga/compensation/idempotency is called out as an SDE-2-level expectation, and it is the theory behind what you already built in LogLens.",
    resources: [
      {
        doc: {
          title: "Pattern: Saga",
          site: "microservices.io",
          url: "https://microservices.io/patterns/data/saga.html",
          note: "Also read Database per service and Transactional outbox from the same pattern language.",
          minutes: 40,
          estimate: true,
        },
      },
    ],
    questions: [
      "Why can't you just use a distributed transaction (2PC) across services? What does it cost you?",
      "Saga: choreography vs orchestration. Which did you pick, and when does the other win?",
      "What is a compensating transaction, and why must it be idempotent?",
      "Your compensation itself fails. Now what?",
      "What is the dual-write problem, and how does the transactional outbox fix it?",
      "Design an idempotency key for an at-least-once consumer. What do you key on, and where does state live? ← your fingerprint-keyed upserts",
      "Eventual consistency: how do you explain the user-visible behaviour to a product manager?",
      "How do you test a saga's failure paths?",
    ],
  },
  {
    id: "PLAT-02",
    section: "platform",
    priority: "P1",
    title: "Resiliency — circuit breaker, retry, backoff & bulkhead",
    resources: [{ csv: "JT-M#10" }, { csv: "JT-M#11" }],
    inherit: "P1-15",
  },
  {
    id: "PLAT-03",
    section: "platform",
    priority: "P1",
    title: "Service discovery & API gateway",
    why: "Backs your zero-downtime dual-APIM migration.",
    resources: [{ csv: "JT-M#1" }, { csv: "JT-M#2" }],
    inherit: "P1-16",
  },
  {
    id: "PLAT-04",
    section: "platform",
    priority: "P1",
    title: "Docker — images, layers & containerising a Spring Boot service",
    why: "MISSING FROM THE OLD PLAN, which jumped straight to Kubernetes. Docker is named directly in an SDE-2 round write-up, and it is on your resume.",
    resources: [
      {
        video: {
          title: "Docker — Dockerizing your Spring Boot Application",
          channel: "Java Techie",
          url: "https://www.youtube.com/watch?v=e3YERpG2rMs",
          minutes: 20,
          estimate: true,
        },
      },
      {
        doc: {
          title: "Java Techie — Docker playlist (for anything the above leaves open)",
          site: "youtube.com",
          url: "https://www.youtube.com/playlist?list=PLVz2XdJiJQxzMiFDnwxUDxmuZQU3igcBb",
          minutes: 0,
        },
      },
    ],
    questions: [
      "Container vs VM — what is actually shared, and what isolates them? (Namespaces, cgroups.)",
      "What is a layer? Why does the ORDER of Dockerfile instructions change your build time?",
      "Why is a multi-stage build the norm for a Spring Boot jar, and what does it save?",
      "COPY vs ADD; CMD vs ENTRYPOINT — the difference and when it bites.",
      "How do you keep an image small, and why does that matter beyond disk?",
      "Your JVM inside a container ignores the memory limit and gets OOM-killed. What's the fix? (Container-aware flags / MaxRAMPercentage.)",
      "Where do logs and config belong for a containerised service, and why not in the image?",
      "How would you debug a container that exits immediately on start?",
    ],
  },
  {
    id: "PLAT-05",
    section: "platform",
    priority: "P2",
    title: "Kubernetes basics — pods, deployments, services",
    resources: [{ csv: "JT-K8#1" }, { csv: "JT-K8#2" }, { csv: "JT-K8#3" }],
    inherit: "P2-38",
  },
  {
    id: "PLAT-06",
    section: "platform",
    priority: "P2",
    title: "K8s deployment, ConfigMaps/Secrets, probes & resource limits",
    resources: [{ csv: "JT-K8#6" }, { csv: "JT-K8#8" }],
    inherit: "P2-39",
  },
  {
    id: "PLAT-07",
    section: "platform",
    priority: "P2",
    title: "Distributed tracing & correlation",
    resources: [{ csv: "JT-M#7" }],
    inherit: "P1-17",
  },

  // ─── Testing & Delivery ────────────────────────────────────────────────────
  {
    id: "TEST-01",
    section: "testing",
    priority: "P1",
    title: "JUnit 5 & Mockito",
    why: "MISSING FROM THE OLD PLAN despite JUnit and Mockito being on your resume and you claiming 90%+ coverage. @Mock vs @InjectMocks vs @MockBean is a standard question, and 'how do you test this?' follows most design answers.",
    resources: [
      {
        video: {
          title: "Spring Boot Testing | Writing JUnit Tests using JUnit and Mockito",
          channel: "Java Techie",
          url: "https://www.youtube.com/watch?v=kXhYu939_5s",
          minutes: 30,
          estimate: true,
        },
      },
    ],
    questions: [
      "@Mock vs @InjectMocks vs @Spy vs @MockBean — what does each do, and which needs a Spring context?",
      "when/thenReturn vs doReturn/when — when are they not interchangeable?",
      "How do you verify an interaction, and how do you assert on the argument that was passed? (ArgumentCaptor.)",
      "How do you test a void method that throws?",
      "You cannot mock a static or final method with plain Mockito — what are your options, and what does needing one tell you about the design?",
      "What belongs in a unit test vs an integration test? Where do you draw the line in a Spring service?",
      "90% coverage and a bug still shipped. What was the test suite not measuring?",
      "How do you test time-dependent code without Thread.sleep?",
      "How do you test a @Transactional method's rollback behaviour?",
    ],
  },
  {
    id: "TEST-02",
    section: "testing",
    priority: "P1",
    title: "Testcontainers & Spring Boot test slices",
    why: "MISSING FROM THE OLD PLAN — and you BUILT your team's Postgres-Testcontainers regression framework gating every PR. This is a story you should be able to tell cold; instead it had no card.",
    resources: [
      {
        video: {
          title: "Spring Boot 3 Integration Testing With TestContainers | JUnit 5",
          channel: "Java Techie",
          url: "https://www.youtube.com/watch?v=Q-0Z6KZF1xM",
          minutes: 30,
          estimate: true,
        },
      },
    ],
    questions: [
      "Why Testcontainers over H2 for a Postgres app? Name a bug H2 would hide.",
      "What does @DataJpaTest give you, and what does it replace by default? How do you stop it swapping your datasource?",
      "@SpringBootTest vs a slice (@WebMvcTest / @DataJpaTest) — cost, and what each actually proves.",
      "Containers are slow to start. How do you keep a suite fast? (Reuse, singleton container, @ServiceConnection.)",
      "How do you keep tests isolated when they share one database container?",
      "Walk me through the regression framework you built: what gates a merge, and what happens when it goes red?",
      "How do you test a Kafka consumer end to end?",
      "Flaky integration test — how do you find the cause instead of retrying it?",
    ],
  },
  {
    id: "TEST-03",
    section: "testing",
    priority: "P2",
    title: "CI/CD with GitHub Actions & release safety",
    why: "On your resume (batch regression + quality dashboard across 7 repos). Rarely a whole round, but it comes up as 'how does your code reach production?'.",
    resources: [
      {
        self: {
          title: "Your own workflows",
          note: "Re-read the batch regression and master quality workflows, and the Pages dashboard job. No video will teach you your own pipeline.",
        },
      },
    ],
    questions: [
      "Walk your pipeline from a push to a deployed artifact. What gates exist, and which can be skipped?",
      "How do you run the same workflow across 7 repositories without maintaining 7 copies? (Reusable workflows / composite actions.)",
      "Where do secrets live, and how do you keep them out of logs?",
      "A regression suite takes 40 minutes. How do you decide what runs per PR vs nightly?",
      "How do you roll back a bad deploy, and how fast can you actually do it?",
      "What makes a build reproducible? Where does your pipeline break that?",
    ],
  },

  // ─── Your Systems ──────────────────────────────────────────────────────────
  {
    id: "SELF-01",
    section: "resume",
    priority: "P0",
    title: "Multi-tenancy, sharding & runtime datasource routing",
    why: "The most distinctive thing on your resume: feature-flag-controlled Snowflake routing across three modes, lazy datasource init, 1,000+ tenants. An interviewer probing your own bullets is the round you cannot bluff.",
    resources: [
      {
        self: {
          title: "The routing framework you built",
          note: "Write down the WHY for each decision: three modes, lazy init, the tenant-mapping API, and what you would change now.",
        },
      },
    ],
    questions: [
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
      "The 10% batch runtime cut — where did the time actually go, and how did you measure it?",
    ],
  },
  {
    id: "SELF-02",
    section: "resume",
    priority: "P0",
    title: "Exactly-once effects on at-least-once delivery (LogLens)",
    why: "You claim it in one line on the resume. Expect the full walk-through: consumer dies after processing, before commit.",
    resources: [
      {
        self: {
          title: "The LogLens ingest path",
          note: "Reconstruct the exact ordering: ranged blob read → parse → durable upsert → offset commit. Know what is idempotent and what is not.",
        },
      },
    ],
    questions: [
      "Consumer crashes after the durable write but before the offset commit. Walk the restart.",
      "What exactly is in the fingerprint key, and what happens if two different log lines collide on it?",
      "Where is the upsert idempotent — the database, the application, or both? Show the constraint.",
      "Why not Kafka transactions / exactly-once semantics? What did you trade away by not using them?",
      "Constant-heap ingest at any file size — how? What is the actual memory ceiling and what sets it?",
      "One window-aligned byte range fails permanently. What happens to the rest of the file?",
      "How would you prove, after a run, that nothing was double-counted?",
    ],
  },
  {
    id: "SELF-03",
    section: "resume",
    priority: "P0",
    title: "Redis-staged writes & Base+Overlay persistence",
    why: "A distributed-consistency claim sitting in your GenAI bullet, but it is a backend question and it will be asked as one.",
    resources: [
      {
        self: {
          title: "The data-management layer of the inventory agent",
          note: "Be able to draw the Base+Overlay model on a whiteboard, including what happens on approval, rejection and timeout.",
        },
      },
    ],
    questions: [
      "Why stage in Redis at all instead of writing straight to Postgres?",
      "Redis write succeeds, Postgres commit fails. What does the user see, and what cleans up?",
      "What is scenario-scoped Base+Overlay, and how does a read merge the two?",
      "The human approval never arrives. What happens to the staged write, and who decides the TTL?",
      "The underlying data changed while the approval was pending. Now what?",
      "Two planners stage conflicting overlays on the same rows. How is that resolved?",
      "How would you make the approval step survive a pod restart?",
    ],
  },
  {
    id: "SELF-04",
    section: "resume",
    priority: "P1",
    title: "Zero-downtime dual-gateway migration",
    resources: [
      {
        self: {
          title: "The Azure APIM ↔ Gravitee migration",
          note: "The interviewer wants your verification and rollback story, not the architecture diagram.",
        },
      },
    ],
    questions: [
      "How did you VERIFY zero downtime? What signal would have told you that you were wrong?",
      "What was the rollback trigger, and how long would a rollback have taken?",
      "How did identity propagate across sync, async and batch flows without the services caring which gateway they were behind?",
      "What is an adaptive S2S token, and what problem forced it?",
      "What broke first in staging, and what did that teach you?",
      "Isn't the gateway a single point of failure? How is that addressed?",
    ],
  },
  {
    id: "SELF-05",
    section: "resume",
    priority: "P1",
    title: "Sync/async fallback & the 10% timeout failure rate",
    resources: [
      {
        self: {
          title: "The Pack Service integration layer",
          note: "This is your cleanest 'I found a failure mode and killed it' story. Know the numbers.",
        },
      },
    ],
    questions: [
      "What was actually timing out, and how did you establish it was 10%?",
      "How does the sync path decide to fall back to async? What is the timeout, and how did you choose it?",
      "The async fallback also fails. What does the caller see?",
      "How do you avoid doing the work twice when the sync call actually succeeded after the timeout?",
      "Why a feature flag here — what were you protecting against?",
      "How would you design this today with virtual threads available?",
    ],
  },
];

/* ── Where the priorities come from ──────────────────────────────────────────
   Interview write-ups and current question banks consulted (Aug 2026):
     • HERE Technologies SDE-2 (3+ yrs Java backend) — R1 Core Java, SQL, Spring
       Boot, Maven, REST API, DSA; R2 HashMap internals, multithreading, REST API
       design, Docker, Spring lifecycle.  geeksforgeeks.org
     • HSBC SDE-2 (4 yrs Java) — Java 8 generics/lambda/functional interfaces,
       concurrency, streams, SOLID.  geeksforgeeks.org
     • Java SDE-2 loop write-up — exception hierarchy, checked vs unchecked,
       try-with-resources, propagation, autoboxing, 5-threads-in-sequence,
       volatile vs atomic, @Component/@Bean/@Qualifier/@Value, @Controller vs
       @RestController, Spring Data JPA interfaces.  linkedin.com
     • Spring Boot question banks for 2–5 yrs — auto-configuration, the
       self-invocation @Transactional trap, N+1, Actuator, OAuth2/JWT.
       geeksforgeeks.org, codingshuttle.com, interviewbit.com
     • Kafka question banks for experienced Java devs — rebalance triggers and
       StickyAssignor, __consumer_offsets, idempotent producer vs downstream
       duplicates, commit-vs-sink ordering.  medium.com, wecreateproblems.com
     • SQL for backend engineers 2026 — index seek vs table scan, EXPLAIN, join
       order, transaction locking scenarios.  codeforgeek.com, nareshit.com
     • Redis/caching — cache-aside vs write-through, TTL and invalidation,
       stampede mitigations, SET NX PX locks.  hirist.tech, dev.to, java9r.com
     • Testing — @Mock vs @InjectMocks vs @MockBean, AAA, Testcontainers with
       JUnit 5.  geeksforgeeks.org, javarevisited.blogspot.com
     • Microservices at SDE-2/3 — saga choreography vs orchestration,
       compensating transactions, idempotency, circuit breaker.
       perfectnotes.org, codebegun.com
     • Java 17/21 — records/sealed/pattern matching assumed; virtual threads now
       asked, including vs reactive.  apna.co, datacamp.com, kore1.com
   Channel choice: Concept && Coding (Shrayansh Jain) stays primary for Java and
   Spring Boot; Defog Tech is used where it is strongest — the Java Memory Model
   and ForkJoinPool/deadlock material — since it is widely cited as the best
   free Java concurrency explainer. Java Techie covers Kafka, microservices,
   Docker, K8s and testing.
*/
