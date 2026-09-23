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
                           duration for every playlist video this map uses. The
                           generator FAILS if the reference is not in that file.
                           An optional `note` says which part of the video to watch.
   playlist: "CC-J#19"   → a video known by playlist position and title but whose
                           duration was never tracked. Rendered without a runtime.
                           (None left: every such video now has a CSV row.)
   video:    {...}        → a direct watch URL.
   doc:      {...}        → written reference.
   self:     {...}        → your own codebase. There is no substitute for it and
                           no link to give; the questions are the whole card.

   `inherit` pulls a topic's question list from scripts/data/javaSpringPrepHandoff.md
   by its old id; `questions` adds to that (or stands alone when there is no
   inherit). Nothing is retyped, so nothing drifts.

   Topic ids are storage keys — progress, notes and check-in history hang off
   them. Never renumber or reuse one; a new topic gets the next free id and
   goes wherever it belongs in the array (array order is display order).
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
    why: "The single most reliably asked core-Java topic. 2025–26 SDE-2 write-ups still open with it: resize and rehashing, what changed in Java 8, how ConcurrentHashMap stays safe without a global lock, and whether a custom object can be a key.",
    resources: [{ csv: "CC-J#23" }, { csv: "CC-J#26" }],
    inherit: "P0-05",
    questions: [
      "HashMap allows one null key — where does it live? Why do ConcurrentHashMap and Hashtable reject null keys and values?",
      "Is get-then-put on a ConcurrentHashMap thread-safe? What do you use instead? (computeIfAbsent / compute / merge.)",
      "Can any object be a HashMap key? What must it guarantee, and what is the cheapest way to get it right? (Immutable + equals/hashCode — or a record.)",
    ],
  },
  {
    id: "JAVA-02",
    section: "java",
    priority: "P0",
    title: "Streams, lambdas & functional interfaces",
    why: "Java 8 stream/lambda questions appear in essentially every loop at 2–4 years. This card is the theory; JAVA-10 is the live-coding half.",
    resources: [{ csv: "CC-J#17" }, { csv: "CC-J#29" }],
    inherit: "P0-06",
  },
  {
    id: "JAVA-10",
    section: "java",
    priority: "P0",
    title: "Streams live-coding — the Employee / Transaction drill",
    why: "NEW. Streams are tested by writing them, not describing them: \"customers whose total amount > 5000 from a transaction list\" was reported verbatim in a 2026 SDE-2 loop, and second-highest-salary and group-by-department variants recur across write-ups. Knowing what map and flatMap do is not the same as producing groupingBy + collectingAndThen under a timer.",
    resources: [
      {
        doc: {
          title: "Guide to Java groupingBy Collector",
          site: "baeldung.com",
          url: "https://www.baeldung.com/java-groupingby-collector",
          note: "Reference only. The drill is the prompts below — write each one in an IDE without looking, then check.",
          minutes: 20,
          estimate: true,
        },
      },
    ],
    questions: [
      "Transaction(customerId, amount): return the customerIds whose total amount exceeds 5000, sorted by total descending.",
      "Employee(name, dept, salary): the second-highest distinct salary overall. Then the same per department.",
      "Highest-paid employee per department as Map<String, Employee> — groupingBy + maxBy, then collectingAndThen to unwrap the Optional.",
      "Average salary per department, sorted by that average, collected into a LinkedHashMap.",
      "Frequency of each character in a string; then the first non-repeating character.",
      "Duplicates in a List<Integer> — two ways (Set.add trick vs groupingBy + counting). Which is O(n)?",
      "Split employees into salary > 50k and the rest. partitioningBy vs groupingBy — what differs in the result?",
      "Flatten List<List<String>>, then return the distinct words sorted by length, then alphabetically.",
      "Employee names per department as one comma-separated string. (joining as a downstream collector.)",
      "Top 3 most frequent words in a paragraph, ties broken alphabetically.",
      "Collectors.toMap throws on a duplicate key — why, and what does the merge function fix?",
      "Turn a nested loop with an early break into a stream. Should you? (anyMatch / takeWhile — or keep the loop, and say why.)",
    ],
  },
  {
    id: "JAVA-03",
    section: "java",
    priority: "P0",
    title: "OOP, exceptions & error handling",
    why: "Reported verbatim in SDE-2 rounds: exception hierarchy, checked vs unchecked, try-with-resources, propagation. It was buried in the old plan's remedial pile — it should not have been.",
    resources: [{ csv: "CC-J#2" }, { csv: "CC-J#20" }],
    questions: [
      "Four pillars of OOP — give a real example of each from code you have written, not a textbook one.",
      "Abstract class vs interface in Java 17. When does an interface with default methods win?",
      "Two interfaces give you the same default method. What does the compiler make you do?",
      "Is Java pass-by-value or pass-by-reference? Prove it with a swap method.",
      "What is the superclass of every exception? Where do Error and RuntimeException sit?",
      "Checked vs unchecked — which do you throw from a service layer, and why?",
      "How does exception propagation work through a call stack? What does the JVM do if nothing catches?",
      "try-with-resources — what does it compile to, and what happens if both the body and close() throw?",
      "Why is catching Exception (or Throwable) usually wrong? When is it right?",
      "Overloading vs overriding — what is resolved at compile time and what at runtime?",
      "Can you override a static method? What actually happens if you try?",
      "Custom exception: checked or unchecked, and what do you put in it beyond a message?",
      "finally runs when? Name two cases where it does not.",
      "final vs finally vs finalize — and why is finalize deprecated for removal?",
      "What is the cost of throwing an exception, and why is exception-as-control-flow discouraged?",
    ],
  },
  {
    id: "JAVA-06",
    section: "java",
    priority: "P0",
    title: "Strings, immutability, equals/hashCode & singletons",
    why: "Raised from P1 and widened to Strings. A 2026 SDE-2 write-up asked both \"why are Strings immutable?\" and \"why does double-checked locking break without volatile?\" by name, and String vs StringBuilder vs StringBuffer is on every 2026 core-Java list. Cheap to own, embarrassing to miss.",
    resources: [
      { csv: "CC-J#14" },
      { csv: "CC-J#7", note: "The String, wrapper-class and autoboxing parts are what this card needs; the casting rules are revision." },
      { csv: "DT#27" },
    ],
    inherit: "P1-23",
    questions: [
      "String s = new String(\"abc\") — how many objects can that create, and where does each live?",
      "== vs equals on Strings. What does intern() do, and when would you ever call it?",
      "String vs StringBuilder vs StringBuffer — and why is + inside a loop slow?",
      "Why is String final as well as immutable? Give the security, hashCode-caching and pooling reasons.",
      "Integer a = 127, b = 127; a == b? Now 128. Explain. (The Integer cache behind valueOf.)",
      "Where can autoboxing throw a NullPointerException you did not see coming?",
      "Why keep a password in a char[] rather than a String?",
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
    title: "Java 17 → 25 — records, sealed types, pattern matching, virtual threads",
    why: "2026 write-ups treat Java 17 features as assumed knowledge, \"Java 8 vs 11 vs 17\" is asked by name, and virtual threads are now a live topic. Java 25 is the current LTS and finalised Scoped Values. You ship Java 17 — being vague here reads badly.",
    resources: [
      { csv: "CC-J#42" },
      { csv: "CC-J#43" },
      { csv: "CC-J#44" },
      { csv: "CC-J#45" },
      { csv: "CC-J#46" },
      { csv: "CC-J#39" },
    ],
    inherit: "P2-36",
    questions: [
      "Java 8 → 11 → 17 → 21 → 25: name the one change in each that you would actually use in a Spring service.",
      "Platform thread vs virtual thread — what actually changes, and what does not?",
      "What is pinning, what causes it, and how would you detect it? What did JDK 24 (JEP 491) change about synchronized, and what still pins?",
      "Why are thread pools mostly pointless with virtual threads — and where do you still want one?",
      "Virtual threads vs reactive (WebFlux/Reactor) — what problem does each solve? Which would you pick now?",
      "Where do virtual threads NOT help? (CPU-bound work — say so plainly.)",
      "spring.threads.virtual.enabled=true — what does Spring Boot switch over, and what do you check first? (Connection-pool limits: a million threads still share ten connections.)",
      "Scoped Values (final in Java 25) vs ThreadLocal — what problem do they fix for virtual threads?",
      "Which of Java 17/21's features have you actually used at work, and which would you adopt next?",
    ],
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
    id: "JAVA-09",
    section: "java",
    priority: "P2",
    title: "Comparable vs Comparator, TreeMap, LinkedHashMap & Set",
    why: "Cheap points. Comparator questions show up constantly as a warm-up before something harder, and the JAVA-10 drill leans on them.",
    resources: [{ csv: "CC-J#24" }, { csv: "CC-J#27" }, { csv: "CC-J#28" }],
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
  {
    id: "JAVA-08",
    section: "java",
    priority: "P2",
    title: "Optional — the API and its misuse",
    resources: [{ csv: "CC-J#48" }],
    inherit: "P2-37",
  },
  {
    id: "JAVA-11",
    section: "java",
    priority: "P2",
    title: "Reflection, annotations, serialization & class loading",
    why: "NEW. What Spring is built on. Rarely a round of its own, but \"how does Spring find your @Component?\" and \"write a custom annotation\" land here (a Gartner SDE-2 loop asked about custom annotations in the Spring lifecycle), and ClassNotFoundException vs NoClassDefFoundError is a classic production question.",
    resources: [{ csv: "CC-J#18" }, { csv: "CC-J#19" }],
    questions: [
      "Retention policies — SOURCE, CLASS, RUNTIME. Which one must an annotation Spring reads at runtime use, and why?",
      "You write @LogExecutionTime. What makes it do anything? (Nothing — until an aspect or a processor reads it. See SPRING-06.)",
      "How does Spring find your @Component classes at startup, and what does that scanning cost at boot?",
      "How can reflection break a singleton or an immutable class, and how do you defend against it?",
      "ClassNotFoundException vs NoClassDefFoundError — which is checked, and what usually causes the second one in production?",
      "ClassLoader hierarchy and parent delegation — what does delegation protect you from?",
      "Serializable, transient and serialVersionUID — what happens if the class changes after an object was serialised?",
      "Why is native Java serialization discouraged for anything crossing a trust boundary?",
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
      { csv: "CC-J#30" },
      { csv: "CC-J#35" },
      { csv: "CC-J#38" },
    ],
    inherit: "P0-07",
    questions: [
      "Runnable vs Callable; start() vs run() — what happens if you call run() directly?",
      "Daemon vs user thread — what happens to a daemon thread when main returns?",
      "scheduleAtFixedRate vs scheduleWithFixedDelay — and what happens to the schedule if one run throws?",
      "Tomcat already has a thread pool. When does your Spring service need its own executor, and how do you size it against the DB connection pool?",
    ],
  },
  {
    id: "CONC-02",
    section: "concurrency",
    priority: "P0",
    title: "volatile, atomics, CAS & the Java Memory Model",
    why: "\"volatile vs atomic\" is reported almost verbatim in SDE-2 loops, and \"what is volatile for?\" came up again in a Sept 2025 Walmart SDE-2 round.",
    resources: [{ csv: "CC-J#34" }, { csv: "DT#1" }, { csv: "DT#4" }],
    inherit: "P0-09",
  },
  {
    id: "CONC-03",
    section: "concurrency",
    priority: "P0",
    title: "Locks, wait/notify & coordination primitives",
    why: "This is where the classic live-coding ask lands: N threads printing in strict sequence, or producer–consumer. Defog #18 builds the wait/notify version; Defog #21 covers the latch/barrier question the locks video skips.",
    resources: [
      { csv: "CC-J#33" },
      { csv: "CC-J#31" },
      { csv: "DT#18" },
      { csv: "DT#21" },
    ],
    inherit: "P0-10",
    questions: [
      "Three threads must print 1,2,3,1,2,3… in strict order. Write it with wait/notify, then with Semaphores. Which would you ship?",
      "Print odd/even alternately with two threads — where does the naive version deadlock or miss a signal?",
      "Why notifyAll() over notify()? What is the lost-wakeup problem?",
      "Why must wait() always sit inside a loop that rechecks the condition?",
      "Producer–consumer with a bounded buffer: implement it with BlockingQueue, then say what BlockingQueue is doing for you underneath.",
      "ArrayBlockingQueue vs LinkedBlockingQueue vs SynchronousQueue — which one does newCachedThreadPool use, and why?",
      "CopyOnWriteArrayList — when is it the right choice, and what does every write cost?",
    ],
  },
  {
    id: "CONC-04",
    section: "concurrency",
    priority: "P0",
    title: "CompletableFuture & @Async",
    why: "Directly backs the async/sync-fallback work on your resume. \"Long-running background work — @Async and beyond\" was asked by name in a 2026 SDE-2 loop.",
    resources: [
      { csv: "CC-J#36" },
      { csv: "CC-SB#16" },
      { csv: "CC-SB#17" },
      { csv: "DT#19" },
    ],
    inherit: "P0-08",
    questions: [
      "A client triggers a 10-minute job over HTTP. @Async, a queue, or a scheduler? What does the client get back, and how does it learn the result?",
      "An @Scheduled job runs on all three pods. How do you make it run once? (ShedLock / leader election / a K8s CronJob.)",
    ],
  },
  {
    id: "CONC-06",
    section: "concurrency",
    priority: "P1",
    title: "Production JVM debugging — thread dumps, deadlocks, high CPU & leaks",
    why: "Raised from P2 and widened. SDE-2 loops increasingly ask you to walk a production incident, and the 2026 scenario questions (low CPU but requests timing out; a pool exhausted) are all answered with a thread dump. This card is the toolkit; JAVA-04 covers the heap side.",
    resources: [
      { csv: "DT#25" },
      { csv: "DT#2" },
      {
        doc: {
          title: "Java SE 21 Troubleshooting Guide — Diagnostic Tools",
          site: "docs.oracle.com",
          url: "https://docs.oracle.com/en/java/javase/21/troubleshoot/diagnostic-tools.html",
          note: "Skim jcmd, jstack and Java Flight Recorder. Skip the rest.",
          minutes: 30,
          estimate: true,
        },
      },
    ],
    inherit: "P2-35",
    questions: [
      "One pod sits at 100% CPU. Find the guilty thread. (top -H → thread id in hex → nid in a jcmd Thread.print dump.)",
      "p99 latency doubled after a deploy but CPU is flat. What are you looking for in a thread dump? (Threads BLOCKED or WAITING on a pool or a lock.)",
      "What would you switch on in production ahead of time so the next incident is debuggable? (JFR, GC logs, HeapDumpOnOutOfMemoryError.)",
      "Why is ThreadLocal a leak risk in a pooled thread, and what is the fix?",
      "How does ThreadLocal behave with virtual threads?",
      "A request-scoped ThreadLocal leaks into the next request. How does that happen and how do you prove it?",
    ],
  },
  {
    id: "CONC-05",
    section: "concurrency",
    priority: "P2",
    title: "ForkJoinPool, work stealing & parallel streams",
    resources: [{ csv: "CC-J#37" }, { csv: "DT#20" }],
    inherit: "P2-33",
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
    why: "\"Spring lifecycle\", @Component vs @Bean vs @Qualifier, DI styles and circular dependencies — reported repeatedly, including in 2026 SDE-2 loops.",
    resources: [{ csv: "CC-SB#6" }, { csv: "CC-SB#7" }, { csv: "CC-SB#8" }],
    inherit: "P0-03",
    questions: [
      "Spring Boot 2.6+ refuses circular references by default. What fails at startup, and why shouldn't you just set spring.main.allow-circular-references=true?",
    ],
  },
  {
    id: "SPRING-03",
    section: "spring",
    priority: "P0",
    title: "Spring Boot fundamentals — starters, auto-configuration, profiles, config & Maven",
    why: "\"How does auto-configuration work?\" is one of the most-asked Spring Boot questions at 2–5 years, and HERE's SDE-2 first round listed Maven by name. Add \"what changed in Boot 3 and 4?\" — a fair question now that Boot 4 has shipped.",
    resources: [
      { csv: "CC-SB#10" },
      { csv: "CC-SB#11" },
      { csv: "CC-SB#44" },
      { csv: "CC-SB#4" },
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
      "mvn package — which lifecycle phases run, and what is the difference between a phase and a plugin goal?",
      "Two libraries pull different versions of the same dependency. Which wins in Maven, and how do you force one? (Nearest wins; dependencyManagement / a BOM; mvn dependency:tree.)",
      "Dependency scopes — compile, provided, runtime, test: where does each end up?",
      "Spring Boot 2 → 3: what broke when you upgraded? (javax → jakarta, the Java 17 baseline, Sleuth → Micrometer Tracing.)",
      "What did Spring Boot 4 / Spring Framework 7 add that you would actually use? (Built-in API versioning, @Retryable and @ConcurrencyLimit in core, JSpecify null-safety, modular auto-configuration.)",
    ],
  },
  {
    id: "SPRING-17",
    section: "spring",
    priority: "P0",
    title: "Request lifecycle — DispatcherServlet, Tomcat threads & message converters",
    why: "NEW. \"What happens internally when a REST request hits a Spring Boot application?\" was reported verbatim in a 2026 SDE-2 loop, and \"Spring vs Spring Boot\" in PayPal's and other SDE-2 rounds. It is also the frame every filter, interceptor, security and exception-handling question hangs off.",
    resources: [
      { csv: "CC-SB#2", note: "Start at 10:30 (Spring MVC over servlets); the first ten minutes are plain servlets." },
      {
        doc: {
          title: "Spring Framework reference — DispatcherServlet",
          site: "docs.spring.io",
          url: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet.html",
          note: "Read Special Bean Types and Processing. Skip the configuration pages.",
          minutes: 20,
          estimate: true,
        },
      },
      {
        doc: {
          title: "Tomcat Server Threading Model",
          site: "codingshuttle.com",
          url: "https://www.codingshuttle.com/spring-boot-handbook/tomcat-server-threading-model/",
          minutes: 15,
          estimate: true,
        },
      },
    ],
    questions: [
      "A request hits your Spring Boot app. Walk it end to end: Tomcat connector → pooled thread → filter chain → DispatcherServlet → HandlerMapping → HandlerAdapter → argument resolvers → controller → HttpMessageConverter → response.",
      "What is the DispatcherServlet, and why is it called a front controller?",
      "Who turns your JSON body into a Java object, and who decides it is Jackson? (HttpMessageConverter + content negotiation.)",
      "Where on that path do filters, interceptors, Spring Security and @ControllerAdvice each sit?",
      "How many requests can a default Spring Boot app serve at once? What happens to request 201? (server.tomcat.threads.max, accept-count, max-connections.)",
      "Every request thread is blocked on a slow downstream and CPU is at 10%. What is actually saturated, and what do you change?",
      "Spring vs Spring MVC vs Spring Boot — what does each layer actually add?",
      "Servlet stack (Tomcat) vs reactive stack (Netty/WebFlux) — how does the threading model differ, and when is WebFlux worth it?",
      "What does the request thread look like once virtual threads are enabled?",
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
    questions: [
      "CrudRepository vs PagingAndSortingRepository vs JpaRepository — what does each add?",
      "spring.jpa.open-in-view is on by default. What does it do, why does Boot log a warning about it, and why turn it off?",
      "@Transactional(readOnly = true) — what does it change in Hibernate, and what does it NOT do?",
    ],
  },
  {
    id: "SPRING-05",
    section: "spring",
    priority: "P0",
    title: "REST API design — status codes, idempotency, versioning, pagination",
    why: "\"REST API design\" appears as its own round topic in SDE-2 write-ups (HERE, PayPal), and it is the easiest place to sound senior or junior.",
    resources: [{ csv: "CC-SB#21" }, { csv: "CC-SB#5" }],
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
    id: "SPRING-08",
    section: "spring",
    priority: "P0",
    title: "Exception handling — @ControllerAdvice & error contracts",
    why: "Raised from P1. Global exception handling and \"where should exception translation happen?\" appear in nearly every 2025–26 Spring write-up and guide. One video, one pattern — a cheap P0.",
    resources: [{ csv: "CC-SB#22" }],
    inherit: "P1-20",
    questions: [
      "Where should exception translation happen in a layered service — repository, service, or controller advice? What does each layer know that the others don't?",
      "ProblemDetail (RFC 9457) — what is it, and how does Spring Boot 3 let you return it?",
    ],
  },
  {
    id: "SPRING-06",
    section: "spring",
    priority: "P1",
    title: "AOP & the proxy mechanism",
    why: "The mechanism under @Transactional, @Async and @Cacheable — reach for it whenever a self-invocation follow-up lands. \"JDK vs CGLIB proxies\" is on current SDE-2 lists.",
    resources: [{ csv: "CC-SB#12" }],
    inherit: "P0-02",
    questions: [
      "Write a custom @LogExecutionTime annotation and the @Around aspect behind it. Why won't it fire on a call from inside the same class?",
    ],
  },
  {
    id: "SPRING-07",
    section: "spring",
    priority: "P1",
    title: "JPA relationships, fetching & cascades",
    why: "Mapping questions are routine, and they are where N+1 actually originates.",
    resources: [{ csv: "CC-SB#28" }, { csv: "CC-SB#29" }],
    inherit: "P2-26",
  },
  {
    id: "SPRING-09",
    section: "spring",
    priority: "P1",
    title: "Spring Security architecture, JWT & stateless auth",
    why: "The filter chain and JWT are one story in an interview. A 2026 SDE-2 loop asked exactly where the JWT is validated in the chain, what happens when validation fails, how to revoke one, and why localStorage is risky.",
    resources: [{ csv: "CC-SB#34" }, { csv: "CC-SB#35" }, { csv: "CC-SB#37" }, { csv: "CC-SB#38" }],
    inherit: "P2-29",
    extraInherit: "P1-19",
    questions: [
      "Where exactly is the JWT validated in the filter chain, and what does the client get if validation fails part-way?",
      "Where should token refresh live — frontend, backend or gateway? How do you stop the refresh call itself from being intercepted in a loop?",
    ],
  },
  {
    id: "SPRING-10",
    section: "spring",
    priority: "P1",
    title: "OAuth 2.0 & service-to-service tokens",
    why: "Your Snowflake B2C auth and adaptive S2S tokens live here.",
    resources: [{ csv: "CC-SB#40" }, { csv: "CC-SB#41" }],
    inherit: "P1-18",
    questions: [
      "How do you secure service-to-service calls when there is no user in the loop? (Client credentials, token audience, mTLS.)",
    ],
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
    why: "A standing round of its own. Write-ups put SQL beside Core Java and Spring Boot; 2026 guides stress index-vs-scan reasoning and reading a plan. You claim PostgreSQL and a GIN/B-Tree/HNSW index design — this will be probed.",
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
    why: "Redis and Caching are both listed on your resume, and your LLM agent stages writes in Redis — expect the consistency question. Cache-aside, invalidation, stampede and distributed locks are standard asks.",
    resources: [
      {
        video: {
          title: "Spring Boot | Spring Data Redis as Cache | @Cacheable | @CacheEvict | @CachePut",
          channel: "Java Techie",
          url: "https://www.youtube.com/watch?v=vpe4aDu5ixI",
          minutes: 14,
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
    id: "DATA-04",
    section: "data",
    priority: "P1",
    title: "SQL query writing — joins, GROUP BY / HAVING, window functions",
    why: "NEW. DATA-01 is the theory; this is the live part. HERE's SDE-2 first round put SQL beside Core Java, Walmart SDE-2 prep guides list SQL and DBMS, and \"Nth-highest salary\" / \"top earner per department\" are the standing warm-ups. You write SQL for a living — make it fast under a timer.",
    resources: [
      {
        doc: {
          title: "SQL 50 — Study Plan",
          site: "leetcode.com",
          url: "https://leetcode.com/studyplan/top-sql-50/",
          note: "Do Select, Basic Joins, Basic Aggregate Functions and Subqueries. Time-box each problem to 10 minutes.",
          minutes: 180,
          estimate: true,
        },
      },
      {
        doc: {
          title: "PostgreSQL tutorial — Window Functions",
          site: "postgresql.org",
          url: "https://www.postgresql.org/docs/current/tutorial-window.html",
          minutes: 15,
          estimate: true,
        },
      },
    ],
    questions: [
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
      "When would you NOT put this data in Postgres? (SQL vs NoSQL — argue from the access pattern, not the brand.)",
    ],
  },
  {
    id: "DATA-03",
    section: "data",
    priority: "P1",
    title: "Postgres transactions, MVCC, locking & connection pooling",
    why: "The JPA cards teach isolation levels; this is the database that implements them. Long transactions, lock waits and pool exhaustion are the incidents you will be asked to debug — pool exhaustion is a stock 2026 Spring Boot scenario question.",
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
      "Deadlock in production: how do you find the two statements involved?",
    ],
  },

  // ─── Kafka ─────────────────────────────────────────────────────────────────
  {
    id: "KAFKA-01",
    section: "kafka",
    priority: "P0",
    title: "Kafka fundamentals & consumer groups",
    why: "Kafka is on your resume and drives LogLens; current guides list consumer-group and rebalance mechanics as standard for experienced Java devs.",
    resources: [{ csv: "JT-K#2" }, { csv: "JT-K#7" }, { csv: "JT-K#8" }],
    inherit: "P1-11",
    questions: [
      "What triggers a rebalance, and what does StickyAssignor change about it?",
      "A rolling deploy of 6 consumers causes 6 rebalances. How do cooperative-sticky assignment and static membership (group.instance.id) cut that down?",
      "Spring Kafka listener concurrency = 10 on a 6-partition topic. How many threads do real work?",
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
    why: "Saga/compensation/idempotency is called out as an SDE-2-level expectation, and it is the theory behind what you already built in LogLens.",
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
    why: "\"Explain the circuit breaker pattern\" was asked in PayPal's SDE-2 loop; bulkheads are the 2026 answer to a slow downstream eating every thread.",
    resources: [{ csv: "JT-M#10" }, { csv: "JT-M#11" }],
    inherit: "P1-15",
  },
  {
    id: "PLAT-08",
    section: "platform",
    priority: "P1",
    title: "Service-to-service calls — RestClient / WebClient / Feign, timeouts, sync vs async",
    why: "NEW. \"How do your services talk to each other?\" follows every microservices answer, and 2026 guides list REST vs gRPC vs messaging as a core ask. It is also the ground under your Pack Service fix — a call with no timeout is the bug you already killed once.",
    resources: [
      {
        doc: {
          title: "Spring Framework reference — REST Clients",
          site: "docs.spring.io",
          url: "https://docs.spring.io/spring-framework/reference/integration/rest-clients.html",
          note: "Read RestClient and HTTP Service Clients; skim WebClient and RestTemplate.",
          minutes: 25,
          estimate: true,
        },
      },
    ],
    questions: [
      "RestTemplate vs RestClient vs WebClient vs OpenFeign — which would you pick for a new Spring Boot service, and why?",
      "Sync REST vs async messaging between two services — how do you decide, call by call?",
      "Which timeouts does an HTTP client need, and what happens if you set none? (Connect vs read vs pool-acquire; the JDK default is to wait forever.)",
      "How do you size the HTTP connection pool to one downstream, and what happens when it is exhausted?",
      "A downstream's p99 goes from 20 ms to 2 s. Walk what happens to your Tomcat threads, and what stops the cascade.",
      "Retries on a POST — when are they safe? (Only behind an idempotency key.)",
      "REST vs gRPC between internal services — what do you gain, and what do you give up?",
      "HTTP interface clients (@HttpExchange) vs Feign — what is the difference, and why did Spring add its own?",
    ],
  },
  {
    id: "PLAT-03",
    section: "platform",
    priority: "P1",
    title: "Service discovery & API gateway",
    why: "Backs your zero-downtime dual-APIM migration. Heads-up: these videos use Hystrix, which is retired — watch them for Eureka and the gateway, and say Resilience4j when the breaker comes up.",
    resources: [{ csv: "JT-M#1" }, { csv: "JT-M#2" }],
    inherit: "P1-16",
  },
  {
    id: "PLAT-04",
    section: "platform",
    priority: "P1",
    title: "Docker — images, layers & containerising a Spring Boot service",
    why: "Docker is named directly in an SDE-2 round write-up (HERE), and it is on your resume.",
    resources: [
      {
        video: {
          title: "Docker — Dockerizing your Spring Boot Application",
          channel: "Java Techie",
          url: "https://www.youtube.com/watch?v=e3YERpG2rMs",
          minutes: 14,
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
    why: "The video uses Spring Cloud Sleuth, which Spring Boot 3 replaced with Micrometer Tracing (OpenTelemetry or Brave underneath). Learn the concepts from it; name the current stack in the interview.",
    resources: [{ csv: "JT-M#7" }],
    inherit: "P1-17",
    questions: [
      "Sleuth is gone in Spring Boot 3. What replaced it, and what did you have to change?",
      "How do you get the trace ID into every log line? (MDC.)",
    ],
  },

  // ─── Testing & Delivery ────────────────────────────────────────────────────
  {
    id: "TEST-01",
    section: "testing",
    priority: "P1",
    title: "JUnit 5 & Mockito",
    why: "JUnit and Mockito are on your resume and you claim 90%+ coverage. @Mock vs @InjectMocks vs @MockBean is a standard question, and 'how do you test this?' follows most design answers.",
    resources: [
      {
        video: {
          title: "Spring Boot Testing | Writing JUnit Tests using JUnit and Mockito",
          channel: "Java Techie",
          url: "https://www.youtube.com/watch?v=kXhYu939_5s",
          minutes: 17,
        },
      },
    ],
    questions: [
      "@Mock vs @InjectMocks vs @Spy vs @MockBean — what does each do, and which needs a Spring context? (@MockBean is deprecated in Boot 3.4 for @MockitoBean — know the new name.)",
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
    why: "You BUILT your team's Postgres-Testcontainers regression framework gating every PR. This is a story you should be able to tell cold. The Kafka video answers the end-to-end consumer-test question below.",
    resources: [
      {
        video: {
          title: "Spring Boot 3 Integration Testing With TestContainers | JUnit 5",
          channel: "Java Techie",
          url: "https://www.youtube.com/watch?v=Q-0Z6KZF1xM",
          minutes: 22,
        },
      },
      { csv: "JT-K#10" },
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
      {
        video: {
          title: "SpringBoot - Build CI/CD Pipeline Using GitHub Actions | Build & Push Docker Image",
          channel: "Java Techie",
          url: "https://www.youtube.com/watch?v=NppkHKvnrqc",
          minutes: 33,
          note: "Watch for the build → push image → deploy stages, so you can place your regression and quality gates inside a full delivery pipeline.",
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
    id: "SELF-06",
    section: "resume",
    priority: "P0",
    title: "Priority allocation & lifecycle-driven eligibility — your lead bullet",
    why: "NEW. Your first resume bullet, and the one an interviewer opens with: ranking logic in 100% of customer allocations, a 20% sales-lift claim, a 30%+ cut in ineligible allocations, and cross-team API and schema changes. It had no card.",
    resources: [
      {
        self: {
          title: "The allocation ranking and lifecycle-eligibility code",
          note: "Be able to state the ranking rule, the tie-break, and how each number on the resume was measured — without hedging.",
        },
      },
    ],
    questions: [
      "Explain the ranking: what decides which store gets inventory first, and what are the inputs?",
      "Fair-share splitting on tied demand: 10 units, 3 tied stores. Who gets the remainder, and is the result the same on every run?",
      "What is the complexity of an allocation run, and at what store × SKU count did it start to matter?",
      "\"Contributed to a 20% sales lift\" — how was that measured, and what else changed in the same period?",
      "How did you measure the 30%+ drop in allocations to ineligible stores? What was the baseline?",
      "Lifecycle data is now the source of truth for eligibility. What happens when that data arrives late or wrong?",
      "You changed a schema other teams depend on. How did you roll it out without breaking them? (Expand → migrate → contract; backward-compatible API versions.)",
      "How do you test ranking logic that runs in every customer's allocation? What would a regression look like, and who would notice first?",
      "If you rebuilt it today, what would you change?",
    ],
  },
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

   Second pass (Sep 2026) — what moved and why:
     • Java SDE-2 loop, 2026 (LinkedIn, Padmanava Dutta) — HashMap resize and
       Java 8 changes, ConcurrentHashMap without a global lock, custom keys,
       Java 8/11/17 differences, singleton + double-checked locking, String
       immutability, "what happens internally when a REST request hits a Spring
       Boot app", circular dependencies, exception translation, idempotent APIs,
       long-running background work, where JWT is validated in the filter chain,
       revocation, refresh placement, S2S security, JWT in localStorage; live
       coding: customers with total > 5000 from a transaction list.
       → SPRING-17 and JAVA-10 added; JAVA-06 and SPRING-08 raised to P0.
     • PayPal SDE II (geeksforgeeks.org) — circuit breaker, HashMap internals,
       HashMap vs Hashtable, Spring vs Spring Boot, CompletableFuture/lambdas/
       streams, @Controller vs @RestController, CRUD REST design.
     • Walmart SE-III Java backend, Sept 2025 (interviewexperiences.in) — OOP,
       HashMap internals, volatile. Walmart SDE-2 prep guides also list SQL and
       DBMS beside Java.  → DATA-04 added.
     • LeetCode discuss summaries (Yes Madam SDE-2 Jan 2026, Gartner SDE-2,
       Apple L4) — Spring vs Spring Boot, bean lifecycle, DI styles,
       @Transactional, HashMap red-black trees, custom annotations in the
       Spring lifecycle.  → JAVA-11 added (P2).
     • KORE1 2026 guide — String/StringBuilder/StringBuffer, virtual threads as
       newly relevant, service communication (REST, gRPC, messaging).
       → PLAT-08 added.
     • 2026 production-scenario banks (javarevisited, javabulletin) — slow
       downstream exhausting request threads at low CPU, connection-pool
       exhaustion, fast-locally-slow-in-prod.  → CONC-06 widened and raised.
     • Stream coding banks (medium.com, github.com) — second-highest salary,
       group by department, averagingInt, maxBy.  SQL banks (geeksforgeeks.org,
       codebegun.com) — Nth-highest salary, DENSE_RANK vs subquery.
     • Current versions: Spring Boot 4.0 / Framework 7 GA Nov 2025 (spring.io) —
       API versioning, @Retryable, JSpecify. Java 25 LTS — Scoped Values final
       (openjdk.org, JEP 506).
     • The resume's lead bullet (priority allocation) had no card → SELF-06.

   Playlist positions and runtimes were re-checked against the live YouTube
   playlists on 23 Sep 2026. The Java playlist has 52 videos including
   "17. Java Reflection in Depth" at position 18, which the original index
   skipped — so every CC-J reference from 18 on moved down one. Five runtimes
   were corrected (Lock-Free Concurrency 42m, Pattern Matching for switch 19m,
   ConfigurationProperties 39m, JT-M #2 15m, JT-M #7 14m).

   Channel choice: Concept && Coding (Shrayansh Jain) stays primary for Java and
   Spring Boot; Defog Tech is used where it is strongest — the Java Memory Model,
   the short interview-build videos (producer–consumer, scatter–gather) and
   ForkJoinPool/deadlock material — since it is widely cited as the best free
   Java concurrency explainer. Java Techie covers Kafka, microservices, Docker,
   K8s and testing.
*/
