# Java + Spring Boot prep — topic map

Source for `scripts/genCoreStack.mjs`: the per-topic watch time, the resume-linked
flag and the interview-question chain behind each Core Stack card. Trimmed to the
map itself — the learner briefing and scheduling sections of the original handoff
are personal notes and deliberately not checked in.

> Only the question lists below are read by the generator. The video tables are
> historical: `CC-J` positions from #18 on are one low (this index skipped
> "17. Java Reflection in Depth"), and a few runtimes were wrong. Positions and
> runtimes live in `javaSpringPrepTracker.csv`, re-verified 23 Sep 2026.

---

## PART 1 — Source index

| Code | Playlist | Channel | Videos | Note |
|---|---|---|---|---|
| `CC-J` | JAVA from Basics to Advanced | Concept && Coding (Shrayansh Jain) | 52 | Free |
| `CC-SB` | Spring Boot from Basics to Advanced | Concept && Coding | 44 | **Largely members-only (~₹100–200/mo). Carries most of P0 — pay it.** |
| `DT` | Java Concurrency | Defog Tech | 29 | Free. Mostly redundant vs CC-J; only 3 videos used |
| `JT-K` | Kafka for beginners | Java Techie | 16 | Free |
| `JT-M` | Microservice | Java Techie | 16 | Free |
| `JT-K8` | Kubernetes | Java Techie | 14 | Free |
| `JT-KS` | Kafka Streams | Java Techie | 6 | **Not used — P3/skip** |

Reference format: `CC-SB #13` = video at position 13 in the Spring Boot playlist.

### Priority definitions

| Tier | Meaning | Hours |
|---|---|---|
| **P0** | Asked in ~every loop. Skipping = failed rounds. | ~17h |
| **P1** | Common **and** claimed on his resume. Do before any real interview. | ~12h |
| **P2** | Depth differentiator. Separates a 30L offer from a 40L one. | ~12.5h |
| **P3** | Rarely asked at SDE1/2. Remedial only. | ~20h |

**Rule applied:** anything his resume claims was promoted one tier, regardless of general frequency. An interviewer probing his own bullets is the round he cannot bluff.

---

# PART 2 — THE MAP

---

## P0 — NON-NEGOTIABLE (~17h)

### P0-01 · `@Transactional` — propagation, isolation, proxy failure
**1h 41m** · ☐

| # | Video | Dur |
|---|---|---|
| CC-SB #13 | Spring boot @Transactional Annotation - Part1 | 24:42 |
| CC-SB #14 | Spring boot @Transactional Annotation - Part2 \| Declarative, Programmatic Approach and Propagation | 37:33 |
| CC-SB #15 | Spring boot @Transactional Annotation - Part3 \| Isolation Level and its different types | 38:47 |

**Interview questions**
1. `methodA()` (no annotation) calls `this.methodB()` (`@Transactional`) in the same class. Does a transaction start? Why not?
2. Give three ways to fix self-invocation. Trade-off of each.
3. Why doesn't `@Transactional` work on `private` / `final` methods?
4. Explain all 7 propagation levels. Which have you actually used and why?
5. `REQUIRES_NEW` inside a `REQUIRED` outer txn. Outer rolls back — what happens to the inner?
6. Default rollback behaviour: which exceptions roll back, which don't? Why that default?
7. How do you force rollback on a checked exception?
8. Explain the 4 isolation levels via the anomaly each prevents (dirty read, non-repeatable read, phantom).
9. What isolation does PostgreSQL actually default to? Does it differ from the JPA default?
10. Where does the transaction actually *open* and *commit* in the call stack?
11. `@Transactional` on a method that also spawns a `@Async` call — what happens to the transaction context?
12. Long-running transaction holding a DB connection — what breaks at 1,000 tenants?

---

### P0-02 · AOP + proxy mechanism
**1h 09m** · ☐

| # | Video | Dur |
|---|---|---|
| CC-SB #12 | Spring boot AOP (Aspect Oriented Programming) | 1:08:52 |

**Interview questions**
1. JDK dynamic proxy vs CGLIB — when does Spring pick which?
2. Why can't CGLIB proxy a `final` class or `final` method?
3. Explain the 5 advice types and their execution order.
4. Difference between `@Around` and `@Before` + `@After` combined.
5. Two aspects on the same method — how do you control ordering?
6. What is a pointcut expression? Write one matching all methods in a package returning `List`.
7. How does AOP relate to `@Transactional`, `@Async`, and `@Cacheable`? (Same mechanism — say this.)
8. Performance cost of AOP. When is it the wrong tool?
9. What is a `BeanPostProcessor`, and how does it relate to proxy creation?

---

### P0-03 · Bean lifecycle, IoC, DI, scopes
**1h 53m** · ☐

| # | Video | Dur |
|---|---|---|
| CC-SB #6 | Spring boot: Bean and its Lifecycle \| Inversion of Control (IOC) | 33:49 |
| CC-SB #7 | Dependency Injection in Spring boot \| With Advantages and Disadvantages | 39:11 |
| CC-SB #8 | Spring boot: Bean Scopes \| Singleton, Prototype, Request, Session Scopes with Examples in Java | 39:34 |

**Interview questions**
1. Walk the full bean lifecycle from instantiation to destruction. Name the callbacks.
2. Constructor vs setter vs field injection. Which does Spring recommend and why?
3. Two beans depend on each other. Constructor injection fails, field injection works. Why is the "working" one worse?
4. How do you legitimately break a circular dependency? (`@Lazy`, redesign, `ApplicationContextAware`)
5. Inject a **prototype** bean into a **singleton**. How many instances get created? How do you fix it?
6. Difference between `@Component`, `@Service`, `@Repository`, `@Bean`. Is it purely semantic?
7. What does `@Repository` actually do beyond marking a bean?
8. Two beans of the same type — how does Spring resolve it? (`@Primary`, `@Qualifier`)
9. `@PostConstruct` vs `InitializingBean` vs `initMethod` — which runs first?
10. Is a singleton bean thread-safe? (Trick: no. The *container* guarantees one instance, not safety.)
11. Are prototype beans destroyed by the container? Why not?
12. What is `ApplicationContext` vs `BeanFactory`?

---

### P0-04 · JPA core — entity lifecycle, L1 cache, N+1
**2h 26m** · ☐

| # | Video | Dur |
|---|---|---|
| CC-SB #24 | Spring boot: JPA (Part-2) \| Setup, JPA Architecture, Entity Lifecycle | 1:02:33 |
| CC-SB #25 | Spring boot: JPA (Part-3) \| First Level Caching in JPA | 24:00 |
| CC-SB #30 | Spring boot: JPA (Part-8) \| JPQL, Derived Query, N+1 Problem, Joins, Pagination and Sorting etc. | 59:00 |

**Interview questions**
1. Name the 4 entity states and every transition between them.
2. You load an entity, change a field, never call `save()`. Is it persisted? Why?
3. What is the persistence context? What is its scope by default?
4. Return a JPA entity from a `@RestController` → `LazyInitializationException`. Trace the full sequence.
5. Why is `FetchType.EAGER` the wrong fix for that? Give the right ones.
6. Explain N+1. Show a query that causes it and three fixes (`JOIN FETCH`, `@EntityGraph`, batch size).
7. Difference between `getReference()` and `findById()`.
8. `save()` vs `saveAndFlush()` vs `persist()` vs `merge()`.
9. Why is L1 cache not a cache you can rely on for performance?
10. Pagination + `JOIN FETCH` on a collection → why does Hibernate warn and load everything into memory?
11. What is dirty checking and when does it run?
12. Derived query methods vs JPQL vs native — when do you reach for each?

---

### P0-05 · HashMap internals + Collections framework
**1h 40m** · ☐

| # | Video | Dur |
|---|---|---|
| CC-J #22 | Collections in Java - Part1 \| Java Collections Framework in depth | 41:26 |
| CC-J #25 | Collections in Java - Part4 \| HashMap Internal Working in Java | 58:11 |

**Interview questions**
1. Walk through `put()` step by step: hash → index → collision → resize.
2. Why is default capacity 16 and load factor 0.75?
3. What is treeification? At what threshold, and why does it need a *second* condition (table size ≥ 64)?
4. Why does `HashMap` re-hash the key's `hashCode()` instead of using it directly?
5. Explain the `equals`/`hashCode` contract. What breaks if you override one only?
6. You mutate a field used in `hashCode()` after inserting into a `HashMap`. What does `get()` return? Why?
7. Why can't that happen with `String` keys?
8. `HashMap` vs `Hashtable` vs `ConcurrentHashMap` vs `Collections.synchronizedMap`.
9. How does `ConcurrentHashMap` achieve thread safety in Java 8+? (Not segment locking any more — say this.)
10. Why is resizing a `HashMap` dangerous under concurrent access?
11. `ArrayList` vs `LinkedList` — when is `LinkedList` actually the right choice? (Almost never. Say why.)
12. Fail-fast vs fail-safe iterators. What is `modCount`?

---

### P0-06 · Streams + functional interfaces + lambdas
**1h 47m** · ☐

| # | Video | Dur |
|---|---|---|
| CC-J #17 | Functional Interface and Lambda Expression - Java8 features \| Java Interfaces Part3 | 31:32 |
| CC-J #28 | Streams in Java8 \| Collections in Java - Part7 | 1:15:16 |

**Interview questions**
1. Intermediate vs terminal operations. Why are streams lazy?
2. `map` vs `flatMap` — give a concrete case where only `flatMap` works.
3. Can you reuse a stream? What happens if you try?
4. When does `parallelStream()` make things **slower**? Name two mechanisms.
5. Why is `parallelStream()` dangerous inside a web request thread? (Shared common ForkJoinPool.)
6. `Collectors.groupingBy` with a downstream collector — write one.
7. `reduce` vs `collect` — when does each apply?
8. `findFirst` vs `findAny` — what changes in parallel?
9. What is a functional interface? Name four built-in ones and their signatures.
10. Method reference types — four kinds, give an example of each.
11. Why must variables captured by a lambda be effectively final?
12. Are streams always better than a `for` loop? (No. Say when.)

---

### P0-07 · Threads + ThreadPoolExecutor
**2h 05m** · ☐

| # | Video | Dur |
|---|---|---|
| CC-J #29 | Multithreading and Concurrency in Java: Part1 \| Threads, Process and their Memory Model in depth | 47:47 |
| CC-J #34 | Thread Pools in Java \| ThreadPoolExecutor Framework \| Multithreading Part6 | 1:16:55 |

**Interview questions**
1. Name all 7 `ThreadPoolExecutor` constructor parameters and what each controls.
2. core=5, max=10, **unbounded** `LinkedBlockingQueue`. How many threads actually run under load? Why is this a production incident?
3. Full task submission flow: when does it use a core thread vs queue vs spawn to max vs reject?
4. Name the 4 rejection policies. Which would you pick for a payment API and why?
5. `newFixedThreadPool` vs `newCachedThreadPool` — what's the hidden danger in each?
6. How do you size a pool for CPU-bound vs IO-bound work? Give the formula.
7. `shutdown()` vs `shutdownNow()` vs `awaitTermination()`.
8. What happens to an uncaught exception in a pooled task submitted via `execute()` vs `submit()`?
9. Why is `Executors.newFixedThreadPool()` discouraged in production code?
10. Thread lifecycle states — name all and the transitions.
11. `wait()`/`notify()` vs `await()`/`signal()` — why does `wait()` require a synchronized block?
12. What is thread starvation? How would you detect it in production?

---

### P0-08 · CompletableFuture + @Async
**2h 16m** · ☐

| # | Video | Dur |
|---|---|---|
| CC-J #35 | Java8 CompletableFuture \| Future and Callable in Java \| Multithreading in Java - Part7 | 1:06:02 |
| CC-SB #16 | Spring boot @Async Annotation - Part1 \| ThreadPoolExecutor | 45:47 |
| CC-SB #17 | Spring boot @Async Annotation - Part2 \| Async Annotation Important Interview questions | 24:00 |

**Interview questions**
1. `Future` vs `CompletableFuture` — what does `Future` fundamentally not let you do?
2. `thenApply` vs `thenCompose` vs `thenCombine`. When is `thenCompose` mandatory?
3. `thenApply` vs `thenApplyAsync` — which thread runs the callback in each?
4. How do you handle exceptions? `exceptionally` vs `handle` vs `whenComplete`.
5. `allOf` vs `anyOf` — how do you collect results from `allOf`?
6. What thread pool does `CompletableFuture` use by default? Why is that a problem in a web app?
7. Why does `@Async` silently not work when called from within the same class?
8. What must `@Async` methods return? What happens if one returns `void` and throws?
9. How do you configure a custom executor for `@Async`? What breaks if you don't?
10. Does the security context / `@Transactional` context propagate into `@Async`? Why not?
11. How would you implement a timeout on a `CompletableFuture`?
12. Scatter-gather: 5 parallel service calls, aggregate, fail fast if any fails. Write it.

---

### P0-09 · volatile, atomics, CAS + Java Memory Model
**1h 15m** · ☐

| # | Video | Dur |
|---|---|---|
| CC-J #33 | Lock-Free Concurrency \| Compare-and-Swap \| Atomic & Volatile Variables \| Multithreading Part5 | 1:03:38 |
| DT #4 | Java Memory Model in 10 minutes | 10:55 |

**Interview questions**
1. What exactly does `volatile` guarantee? What does it NOT guarantee?
2. Give a concrete case where `volatile` fixes visibility but the code is still broken.
3. What is the happens-before relationship? Name three ways to establish one.
4. How does CAS work at the hardware level? What is the ABA problem?
5. `AtomicInteger.incrementAndGet()` vs `synchronized` counter — which is faster and when does that flip?
6. What is `LongAdder` and when does it beat `AtomicLong`?
7. Double-checked locking — why is `volatile` mandatory on the instance field?
8. What is instruction reordering? Why does it exist?
9. Race condition vs data race — are they the same thing?
10. Is `synchronized` reentrant? What would break if it weren't?
11. Where is the memory barrier inserted for a `volatile` write vs read?
12. When would you choose lock-free over locking in real code?

---

### P0-10 · Locks — Reentrant, ReadWrite, Semaphore
**47m** · ☐

| # | Video | Dur |
|---|---|---|
| CC-J #32 | Locks and Condition \| Java Multithreading Part4 \| Reentrant, ReadWrite, Stamped & Semaphore Lock | 46:48 |

**Interview questions**
1. `ReentrantLock` vs `synchronized` — name four things `ReentrantLock` gives you.
2. What is lock fairness? What does it cost?
3. Why must `unlock()` be in a `finally` block?
4. When does `ReadWriteLock` actually beat a plain lock? When does it lose?
5. What is writer starvation in `ReadWriteLock`?
6. `StampedLock` optimistic read — how does it work and what's the catch?
7. `Semaphore` vs `CountDownLatch` vs `CyclicBarrier` — one line each.
8. How do you detect a deadlock in a running production JVM?
9. Four conditions for deadlock. Which one do you break in practice?
10. `tryLock()` with timeout — give a real use case.

---

## P1 — BEFORE ANY REAL INTERVIEW (~12h)

> Everything in P1 is claimed on his resume. Expect direct probing.

### P1-11 · Kafka fundamentals + consumer groups
**1h 10m** · ☐ · *Resume: LogLens*

| # | Video | Dur |
|---|---|---|
| JT-K #2 | Apache Kafka® Components & Architecture Detailed Explanation in 15 min | 15:41 |
| JT-K #7 | Apache Kafka® Producer Example using SpringBoot 3.x | 25:59 |
| JT-K #8 | Apache Kafka® Consumer Example using SpringBoot 3 \| Consumer Groups | 28:00 |

**Interview questions**
1. Topic, partition, offset, consumer group — define each and how they interact.
2. 3 partitions, 5 consumers in one group. What happens to consumer 4 and 5?
3. How does Kafka decide which partition a message goes to?
4. What triggers a consumer group rebalance? What's the cost?
5. What is ISR? What does `acks=all` actually wait for?
6. Where does Kafka store consumer offsets?
7. How does Kafka achieve high throughput? (Sequential IO, zero-copy, batching.)
8. Kafka vs RabbitMQ — when would you pick each?

---

### P1-12 · Kafka ordering, idempotency, exactly-once
**52m** · ☐ · **⚠️ Directly backs his "exactly-once effects" resume claim**

| # | Video | Dur |
|---|---|---|
| JT-K #15 | Does Kafka Guarantee Message Ordering? 🤔 Microservices Fix Inside! | 28:28 |
| JT-K #16 | 🚀 Why Kafka Processes the Same Message Twice? \| Kafka Idempotency Real-Time Example | 23:44 |

**Interview questions**
1. Consumer crashes **after** processing but **before** committing the offset. What happens on restart?
2. At-least-once vs at-most-once vs exactly-once. Which is Kafka's default?
3. **How did LogLens turn at-least-once delivery into exactly-once *effects*?** (Fingerprint-keyed idempotent upserts + commit-after-durable-write. He must say this fluently.)
4. What ordering does Kafka actually guarantee — and at what scope?
5. You need global ordering across a topic. What are you forced to give up?
6. Auto-commit vs manual commit. Why is auto-commit dangerous?
7. What is the idempotent producer, and what does it protect against?
8. Kafka transactions — what do they cover and what do they not?

---

### P1-13 · Kafka error handling, retries, DLT
**29m** · ☐ · *Resume: LogLens*

| # | Video | Dur |
|---|---|---|
| JT-K #13 | Kafka Error Handling with Spring Boot \| Retry Strategies & Dead Letter Topics | 28:34 |

**Interview questions**
1. A poison-pill message fails forever. What happens to the partition without a DLT?
2. Blocking vs non-blocking retry — what does blocking retry do to the rest of the partition?
3. How do you design a DLT? What metadata goes on the message?
4. How do you replay from a DLT safely?
5. Retryable vs non-retryable exceptions — how do you classify them?

---

### P1-14 · Feature flags + externalized config
**1h 17m** · ☐ · **⚠️ Directly backs his Snowflake routing resume claim**

| # | Video | Dur |
|---|---|---|
| CC-SB #10 | Spring boot @ConditionalOnProperty Annotation | 20:17 |
| CC-SB #11 | Spring boot @Profile annotation \| How Profiling works in Spring boot | 33:04 |
| CC-SB #44 | Spring Boot: ConfigurationProperties in-depth | 23:39 |

**Interview questions**
1. **Your feature flag flips mid-request. What happens?** (His actual system.)
2. `@ConditionalOnProperty` is evaluated at *startup*. So how do you build a runtime-togglable flag?
3. What is the property resolution order in Spring Boot? (env var vs `application.yml` vs CLI arg.)
4. `@Value` vs `@ConfigurationProperties` — when does the latter win?
5. How do you refresh config without restarting? What are the risks?
6. How do you scope a feature flag per tenant across 1,000+ tenants?
7. How do you test both sides of a feature flag in CI?
8. What's your rollback plan when a flag causes an incident?

---

### P1-15 · Circuit breaker + retry (Resilience4j)
**38m** · ☐

| # | Video | Dur |
|---|---|---|
| JT-M #10 | Microservice \| Resilience4J Circuit Breaker Implementation on Spring Boot \| JavaTechie | 24:59 |
| JT-M #11 | Microservice \| Resilience4J Retry Module Implementation With Spring Boot \| JavaTechie | 12:49 |

**Interview questions**
1. Three circuit breaker states and every transition. What triggers each?
2. Breaker is OPEN. A request arrives. What does the caller see?
3. How does it decide to try again? What is HALF_OPEN?
4. How do you tune failure threshold and wait duration? What goes wrong at each extreme?
5. Retry + circuit breaker together — what's the ordering trap?
6. Why is naive retry dangerous during an outage? (Retry storm, thundering herd.)
7. What is exponential backoff with jitter and why the jitter?
8. Bulkhead vs circuit breaker — what does each protect?

---

### P1-16 · Service discovery + API gateway
**58m** · ☐ · *Resume: Gravitee/APIM migration*

| # | Video | Dur |
|---|---|---|
| JT-M #1 | Microservice \| Spring Cloud Eureka + API Gateway + Spring Cloud Hystrix \| PART-1 | 39:48 |
| JT-M #2 | Microservice \| Spring Cloud Eureka + Gateway + Hystrix \| PART-2 | 18:24 |

**Interview questions**
1. Client-side vs server-side discovery. Which is Eureka?
2. What happens to in-flight requests when a service instance dies?
3. What is Eureka self-preservation mode and why does it exist?
4. What belongs in a gateway vs in the service itself?
5. **How did you verify zero downtime in your dual-gateway migration? What was your rollback trigger?**
6. How does the gateway propagate identity to downstream services?
7. Isn't the gateway a single point of failure? How do you address that?

---

### P1-17 · Distributed tracing
**15m** · ☐

| # | Video | Dur |
|---|---|---|
| JT-M #7 | Microservice \| Distributed log tracing using Spring Cloud Sleuth & Zipkin \| PART-7 | 14:25 |

**Interview questions**
1. Trace ID vs span ID — what does each identify?
2. How does the trace ID survive a hop into an async thread or a Kafka message?
3. What is context propagation and where does it typically break?
4. How do you correlate a tenant with a trace in a multi-tenant system?
5. What is sampling and why can't you trace 100% in production?

---

### P1-18 · OAuth 2.0
**1h 28m** · ☐ · **⚠️ Resume claims OAuth 2.0 + S2S tokens**

| # | Video | Dur |
|---|---|---|
| CC-SB #40 | OAuth 2.0: Explained with API Request and Response Sample \| High Level System Design | 35:24 |
| CC-SB #41 | Spring boot: Security (Part-8) \| OAUTH2 Authentication Implementation | 52:28 |

**Interview questions**
1. Name the four roles in OAuth 2.0.
2. Authorization Code vs Client Credentials vs Implicit vs Password grant. Which is deprecated and why?
3. **Which grant did you use for machine-to-machine Snowflake auth? Why that one?** (Client Credentials.)
4. What is PKCE and what attack does it prevent?
5. Why an access token AND a refresh token? Why not one long-lived token?
6. Where do you store the client secret? (His answer: Azure Key Vault. Expect a follow-up on rotation.)
7. OAuth vs OIDC — what does OIDC add?
8. How do you revoke a token before it expires?

---

### P1-19 · JWT + stateless auth
**1h 10m** · ☐

| # | Video | Dur |
|---|---|---|
| CC-SB #37 | Spring boot: Security (Part-4) \| Basic Authentication & Authorization \| Stateless Authentication | 20:16 |
| CC-SB #38 | JWT Explained \| JWT vs SessionID \| JSON Web Token \| Security Challenges with JWT & its Handling | 49:27 |

**Interview questions**
1. Three parts of a JWT. What's in each?
2. Is a JWT encrypted? (No — signed. Correct anyone who says encrypted.)
3. **How do you invalidate a JWT before expiry?** (The hard one. Blocklist, short TTL + refresh, token versioning.)
4. JWT vs session ID — what do you trade away?
5. Where do you store a JWT client-side? localStorage vs httpOnly cookie — which attack does each expose?
6. HS256 vs RS256 — when is asymmetric required?
7. What is the `alg: none` attack?
8. How do you rotate signing keys without logging everyone out?

---

### P1-20 · Exception handling / @ControllerAdvice
**56m** · ☐

| # | Video | Dur |
|---|---|---|
| CC-SB #22 | Spring boot - Exception Handling \| @ControllerAdvice \| @ResponseStatus \| @ExceptionHandler | 56:24 |

**Interview questions**
1. `@ControllerAdvice` vs `@ExceptionHandler` vs `@ResponseStatus` — scope of each.
2. Two handlers could match the same exception. Which wins?
3. Checked vs unchecked — which do you throw from a service layer and why?
4. How do you return a consistent error response shape across all endpoints?
5. Why should you never leak a stack trace in an API response?
6. How do you handle validation errors (`MethodArgumentNotValidException`) cleanly?
7. Does `@ControllerAdvice` catch exceptions thrown from a filter? (No — say why.)

---

### P1-21 · REST + ResponseEntity + status codes
**43m** · ☐

| # | Video | Dur |
|---|---|---|
| CC-SB #21 | Spring boot ResponseEntity and Response Codes \| 1xx, 2xx, 3xx, 4xx and 5xx Return Codes | 42:32 |

**Interview questions**
1. 401 vs 403. 400 vs 422. 409 — when?
2. PUT vs PATCH vs POST — which are idempotent? Is POST ever?
3. What does idempotency mean for an API, and how do you implement an idempotency key?
4. Async job accepted but not finished — what status code, what response body?
5. How do you version a REST API? Trade-offs of URL vs header versioning.
6. When should a POST return 201 vs 200?
7. Design pagination for a large collection. Offset vs cursor — which and why?

---

### P1-22 · JVM memory + garbage collection
**49m** · ☐

| # | Video | Dur |
|---|---|---|
| CC-J #10 | Java Memory Management and Garbage Collection in Depth | 48:48 |

**Interview questions**
1. Draw the JVM memory layout. Which regions are per-thread vs shared?
2. Stack vs heap — what lives where, and who cleans each?
3. Young gen / old gen / metaspace — why the generational split?
4. Minor vs major vs full GC. Which pauses the app and for how long?
5. G1 vs Parallel vs ZGC — when would you pick each?
6. **Your pod OOM-kills in Kubernetes but heap dumps look fine. Where did the memory go?** (Metaspace, direct buffers, thread stacks, native — container limit ≠ heap limit.)
7. `OutOfMemoryError: Java heap space` vs `Metaspace` vs `GC overhead limit exceeded` — different causes.
8. What is a memory leak in a GC'd language? Give a real example.
9. How do you diagnose one in production? (Heap dump, MAT, `jmap`, `jcmd`.)
10. Strong vs weak vs soft vs phantom references.

---

### P1-23 · Immutable classes + Singleton
**28m** · ☐

| # | Video | Dur |
|---|---|---|
| CC-J #14 | Java Singleton and Immutable Class Explained with Examples \| Java Classes in Depth - Part4 | 28:26 |

**Interview questions**
1. List every rule for making a class truly immutable. Which one do people forget? (Defensive copy of mutable fields.)
2. Why is immutability inherently thread-safe?
3. Is `String` immutable? What is the string pool and why does it exist?
4. Write a thread-safe singleton four ways. Rank them.
5. Why is enum singleton the best? What does it defend against that others don't?
6. How can reflection or serialization break a singleton? How do you prevent it?
7. Why is double-checked locking broken without `volatile`?

---

### P1-24 · Generics
**52m** · ☐

| # | Video | Dur |
|---|---|---|
| CC-J #12 | Java Generic Classes \| Java Classes in Depth - Part2 | 51:58 |

**Interview questions**
1. What is type erasure? Name two things it makes impossible.
2. `List<Object>` vs `List<?>` vs `List<? extends Object>` — what can you add to each?
3. Explain PECS. Give a real method signature using it.
4. Why can't you create `new T[]`?
5. Why is `List<String>` not a subtype of `List<Object>`?
6. Bounded type parameters — write a generic method that only accepts `Comparable`.
7. What is a bridge method?

---

## P2 — DEPTH DIFFERENTIATOR (~12.5h)

*Shorter question sets. Depth here separates a 30L offer from a 40L one.*

### P2-25 · JPA second-level caching — **41m** · ☐
`CC-SB #26` — Spring boot: JPA (Part-4) | Second Level Caching | L2 Caching (41:01)

1. L1 vs L2 — scope and lifetime of each. 2. When does L2 hurt? 3. How do you invalidate L2 across multiple app instances? 4. Query cache — why is it usually a trap? 5. How does Redis fit as an L2 provider?

### P2-26 · JPA relationships — **2h 05m** · ☐
`CC-SB #28` — JPA (Part-6) | OneToOne Unidirectional and Bidirectional Mapping (1:05:57)
`CC-SB #29` — JPA (Part-7) | OneToMany, ManyToOne & ManyToMany Unidirectional & Bidirectional Mapping (59:27)

1. Who owns a bidirectional relationship? What does `mappedBy` do? 2. Why does `@OneToMany` without `mappedBy` create a join table? 3. `CascadeType.ALL` — when is it dangerous? 4. What is orphan removal and how does it differ from `CascadeType.REMOVE`? 5. Why avoid `@ManyToMany` in real systems?

### P2-27 · Criteria API + Specification API — **59m** · ☐
`CC-SB #31` — JPA (Part-9) | Native Query and Criteria API (44:21)
`CC-SB #32` — JPA (Part-10) | Specification API, Problem with Criteria API and its solution (14:09)

1. When do you need dynamic queries? 2. Criteria API vs Specification — what problem does Specification solve? 3. How do you compose filters safely without SQL injection? 4. Why is Criteria API considered unreadable?

### P2-28 · Filters vs Interceptors — **55m** · ☐
`CC-SB #18` — Custom Interceptors | How to Intercept Incoming HTTP Request and Custom Annotations (~30:25)
`CC-SB #19` — Filters vs Interceptors | Filters and Interceptors Advantage and UseCases for both (24:18)

1. Where does each sit in the request pipeline? 2. Which one can see the handler method? 3. Which runs first? 4. Where do you put tenant resolution in a multi-tenant app, and why?

### P2-29 · Spring Security architecture — **1h 04m** · ☐
`CC-SB #34` — Security (Part-1) | Architecture and SetUp (17:43)
`CC-SB #35` — Security (Part-2) | Multiple User Creation & Storing Username & Password | inMemory, DB (46:51)

1. Walk the filter chain top to bottom. 2. What is `SecurityContextHolder` and where is it stored by default? 3. Does the security context propagate to a child thread? 4. How do you add a custom filter at the right position? 5. Why BCrypt over SHA-256 for passwords?

### P2-30 · Method security / @PreAuthorize — **29m** · ☐
`CC-SB #42` — Security (Part-9) | Method Security | Role based Authorization | @PreAuthorize and Post (29:12)

1. `@PreAuthorize` vs `@Secured` vs `@RolesAllowed`. 2. `@PreAuthorize` vs `@PostAuthorize` — when is Post necessary and what's the risk? 3. Why does method security also fail on self-invocation? (Same proxy mechanism — link back to P0-02.)

### P2-31 · Actuator — **31m** · ☐
`CC-SB #43` — Spring Boot Actuator in depth (30:53)

1. Liveness vs readiness probe — what does K8s do differently with each? 2. Which endpoints must never be public? 3. How do you add a custom health indicator? 4. How do actuator metrics reach Prometheus?

### P2-32 · Web attacks — CSRF, XSS, CORS, SQLi — **25m** · ☐
`CC-SB #33` — Understand Attacks: CSRF, XSS, CORS, SQL Injection with DEMO | Spring Security (24:51)

1. Why can you disable CSRF for a stateless JWT API? 2. CORS is enforced by whom — server or browser? 3. How does a `PreparedStatement` actually prevent SQL injection? 4. Stored vs reflected XSS.

### P2-33 · ForkJoinPool — **53m** · ☐
`CC-J #36` — Java ForkJoinPool || WorkStealingPool || FixedThreadPool || CachedThreadPool (39:15)
`DT #20` — Understanding how ForkJoinPool works (13:16)

1. What is work stealing? 2. Why does `ForkJoinPool` use a deque per thread? 3. Why is blocking IO inside a ForkJoinPool task a bug? 4. Who else uses the common pool by default? (`parallelStream` — link to P0-06.)

### P2-34 · Virtual threads + ThreadLocal — **23m** · ☐
`CC-J #38` — Java VirtualThreads vs Normal Threads || ThreadLocal in Java (22:44)

1. Platform vs virtual thread — what changes? 2. What is pinning and what causes it? 3. Why are thread pools mostly pointless with virtual threads? 4. Why is `ThreadLocal` a leak risk in a pooled thread? 5. How does `ThreadLocal` behave with virtual threads?

### P2-35 · Deadlock detection — **11m** · ☐
`DT #25` — How detect and resolve DeadLocks in Java (10:57)

1. Detect a deadlock in a live JVM — what tools? 2. What does a thread dump show? 3. Lock ordering as prevention — how do you enforce it? 4. Livelock vs deadlock vs starvation.

### P2-36 · Java 17/21 features — **1h 27m** · ☐
`CC-J #41` Java 17: Sealed Classes and Interfaces (10:39) · `CC-J #42` Java 14: Switch Expressions Deep Dive (23:06) · `CC-J #43` Java 16: Pattern Matching for instanceof (8:49) · `CC-J #44` Java 21: Pattern Matching for switch (~8:49) · `CC-J #45` Java 16: Record class (35:45)

1. What is a record and what does it generate? 2. When is a record the wrong choice? 3. What do sealed classes enable that `final` doesn't? 4. How do sealed types + pattern matching give exhaustiveness? 5. Which of these have you actually used on Java 17 at work?

### P2-37 · Optional — **1h 14m** · ☐
`CC-J #47` — Master Java Optional from Java 8 to 11 | All Methods with Real Examples (1:13:53)

1. What was `Optional` designed for? (Return types — not fields, not params.) 2. Why is `Optional` as an entity field a bad idea? 3. `orElse` vs `orElseGet` — which eagerly evaluates? 4. Why is `Optional.get()` a code smell? 5. Is `Optional` serializable?

### P2-38 · Kubernetes basics — **27m** · ☐ *(learner-requested)*
`JT-K8 #1` Basic Introduction and Getting Started part-1 (6:21) · `JT-K8 #2` K8s Components Explained in 10 mins Part-2 (10:06) · `JT-K8 #3` Kubernetes Basics & Architecture Explained in 10 mins Part-3 (10:33)

1. Pod vs Deployment vs Service vs ReplicaSet. 2. What does the control plane do? 3. Which Service type for external traffic? 4. What happens when a pod fails a liveness probe?

### P2-39 · K8s deployment + ConfigMap/Secrets — **50m** · ☐
`JT-K8 #6` Run & Deploy Spring Boot Application in K8s Cluster using yaml configuration (21:12) · `JT-K8 #8` ConfigMap & Secrets Implementation in Spring Boot CRUD Example (28:20)

1. Resource requests vs limits — what happens when each is exceeded? 2. **Why does a container OOM-kill even when JVM heap looks healthy?** (Link to P1-22.) 3. ConfigMap vs Secret — is a Secret encrypted by default? 4. Rolling update — how does K8s guarantee zero downtime? 5. How do config changes reach a running pod?

---

## P3 — REMEDIAL ONLY (~20h)

**Rule for the agent:** do NOT schedule these. Route here only when a P0/P1 question exposes a specific gap.

**CC-J:** #1 Roadmap · #2 OOPs Concept · #3 JVM/JRE/JDK · #4 Public Class Quiz · #5 Variables Part1 · #6 IEEE 754 · #7 Variables Part2 · #8 Methods · #9 Constructor · #11 Classes Part1 · #13 Enum/POJO/Final · #15 Interface Part1 · #16 Default/Static/Private Methods · #18 Annotations · #19 Exception Handling · #20 Operators · #21 Control Flow · #23 Comparator vs Comparable · #24 Deque and List · #26 LinkedHashMap and TreeMap · #27 SET · #30 Thread Lifecycle Part2 · #31 Thread Joining/Daemon Part3 · #37 ScheduledThreadPoolExecutor · #39 Lombok · #40 SequencedCollection · #46 Text Blocks · #48 File Handling · **#49–51 NIO (skip entirely)**

**CC-SB:** #1 Roadmap · #2 Introduction · #3 Project Setup · #4 Maven · #5 Controller Annotations · #9 @Value Dynamic Beans · #20 HATEOAS · #23 JDBC Template · #27 DTO Mapping · #36 Form Based Auth · #39 JWT Implementation

**DT:** all except #4, #20, #25 — CC-J covers the same ground deeper

**JT-M:** #3, #4, #5, #6 (ELK), #8, #9 (Trampoline), #12–16 (Keycloak, API key auth)

**JT-K:** #1, #3, #4, #5, #6, #9, #10, #11, #12, #14

**JT-K8:** #4, #5, #7, #9, #10, #11, #12, #13 (Helm), #14 (Ingress)

**JT-KS (Kafka Streams):** **entire playlist — skip.** He doesn't use it and shouldn't claim it.

> On the CC-J basics block (#2–#21): he has 2 years shipping Java. Do not pre-emptively assign 12 hours of fundamentals. Let the P0 questions expose gaps first.

---
