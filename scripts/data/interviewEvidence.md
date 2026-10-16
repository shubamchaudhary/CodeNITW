# Interview evidence — what 2024–26 Java backend interviews actually asked

The ground under the Core Stack priorities (`coreStackMap.mjs`) and the
"Asked in interviews" section at the foot of every Java, Concurrency and Spring
note (`askedQuestions.mjs`).

## How it was collected (Oct 2026)

- **LeetCode Discuss**, through its public GraphQL search: 33 Java / Spring /
  concurrency search terms, every post from 16 Oct 2024 to 16 Oct 2026 — 7,219
  unique posts downloaded in full.
- Kept only **candidate interview write-ups**: titles that read like an
  experience (experience, round, onsite, offer, rejected, a company plus a
  level). Question lists, guides, roadmaps, articles and help requests were
  dropped. Then kept only write-ups that mention Java, Spring or threads:
  **1,592 write-ups**.
- Plus a handful of **LinkedIn** posts, **Taro** and **GeeksforGeeks**
  experiences readable in full. Naukri/AmbitionBox could not be reached; Glassdoor
  and Medium block automated reads; LinkedIn profile pages (status 999) hide most
  posts, so LinkedIn is thin.
- Each card's questions were written from the real phrasings, each with a
  pattern; a question's **count is distinct write-ups whose text matches it**.
  Companies come from the post's company tag or title, cleaned by hand.

### Read the numbers as an ordering, not a percentage

- LeetCode Discuss leans to product companies and DSA; services-company loops
  and Spring-heavy rounds are under-reported, so Spring counts run low.
- Search returns at most 3,000 posts per term, so the broad terms ("java")
  reach back only a few months; Oct 2024 – Feb 2025 is thinner than 2025–26.
- Write-ups often summarise ("Spring Boot questions"), so counts are lower bounds.
- A pattern can miss a phrasing or catch a stray one; the high-count
  questions were spot-checked by reading their matches.

## Per card (Java, Concurrency, Spring)

| Card | Priority | Write-ups | Most-asked question (write-ups) | Top companies |
|---|---|---:|---|---|
| JAVA-01 Collections framework + HashMap internals | P0 | 135 | How does HashMap work internally — hashing, buckets and collisions? (68) | Goldman Sachs, Walmart, Amazon, Arista Networks, EPAM |
| JAVA-02 Streams, lambdas & functional interfaces | P0 | 56 | What is a lambda expression, and how does it relate to functional interfaces? (27) | Oracle, Accolite, Apple, BukuWarung, Deutsche Bank |
| JAVA-10 Streams live-coding | P0 | 77 | Group employees by department with streams — then count, average or list names per group. (28) | Visa, ADP, Adyen, Bajaj Finserv Health, Cisco |
| JAVA-03 OOP, exceptions & error handling | P0 | 201 | Explain the four pillars of OOP with real examples. (129) | Cognizant, Microsoft, Adobe, Amazon, Infosys |
| JAVA-06 Strings, immutability, equals/hashCode & singletons | P0 | 111 | Write a thread-safe Singleton — then make it lazy with double-checked locking. Why is volatile needed? (69) | Goldman Sachs, Adobe, Microsoft, Walmart, Amazon |
| JAVA-04 JVM memory model & garbage collection | P0 | 108 | Stack vs heap memory — what lives where? (61) | Adobe, Cisco, LinkedIn, Microsoft, Publicis Sapient |
| JAVA-05 Java 17 → 25 | P0 | 18 | Java 8 vs 11 vs 17 vs 21 — what changed that you actually use? (13) | Cognizant, Walmart, EPAM, Goldman Sachs, JPMorgan |
| JAVA-07 Generics & type erasure | P1 | 8 | What are generics, and what do they buy you? (6) | Recruit CRM, Rippling, Truemeds, Walmart, Visa |
| JAVA-09 Comparable vs Comparator, TreeMap, LinkedHashMap & Set | P2 | 105 | Implement an LRU cache with O(1) get and put. (63) | Apple, Goldman Sachs, Amazon, Freshworks, LinkedIn |
| JAVA-08 Optional | P2 | 7 | What is Optional for — and where should you not use it? (7) | EPAM, Accolite, Nagarro, Visa |
| JAVA-11 Reflection, annotations, serialization & class loading | P1 | 27 | Serialization — what do Serializable, transient and serialVersionUID do? (17) | EPAM, Oracle, Publicis Sapient, Cerner, Delivery Hero |
| CONC-07 Threads vs processes & what each thread owns | P0 | 80 | Process vs thread — what does each own, and what do threads share? (36) | LinkedIn, Microsoft, Arista Networks, Cisco, Qualcomm |
| CONC-08 Creating threads, the thread lifecycle & wait/notify | P0 | 28 | How does synchronized work — method vs block, static vs instance lock? (11) | Walmart, DP World, EPAM, Google, Microsoft |
| CONC-09 join, daemon threads, interrupts & priority | P1 | 4 | How do you stop a thread properly — what does interrupt() do? (2) | Rubrik, Uber, Walmart |
| CONC-03 Locks & Conditions | P0 | 113 | Make this code thread-safe (a counter, a cache, a booking flow). (50) | Apple, Flipkart, Goldman Sachs, Oracle, Wise |
| CONC-02 volatile, atomics, CAS & the Java Memory Model | P0 | 34 | What does volatile do — and why isn't it enough for count++? (20) | Rakuten, UKG, Walmart, Birdeye, EPAM |
| CONC-01 Thread pools & ThreadPoolExecutor | P0 | 43 | What is ExecutorService — why use a thread pool instead of new Thread()? (34) | Microsoft, Rubrik, Walmart, Goldman Sachs, LinkedIn |
| CONC-04 Future, Callable & CompletableFuture | P0 | 15 | What is CompletableFuture — how do you chain, combine and handle errors? (8) | EPAM, Apple, NPCI, Oracle, S&P Global |
| CONC-05 ForkJoinPool, work stealing & the Executors factory pools | P1 | 4 | Stream vs parallel stream — how does parallelStream work, and when does it hurt? (2) | Meesho, Goldman Sachs, S&P Global |
| CONC-10 Scheduled executors & graceful shutdown | P1 | 9 | shutdown() vs shutdownNow() — how do you shut a pool down gracefully? (5) | Rubrik, Adobe, LinkedIn, Walmart, Microsoft |
| CONC-11 Virtual threads & ThreadLocal | P2 | 4 | Virtual threads — how are they different from platform threads, and do they block on I/O? (4) | Apple, Fidelity, Kotak Mahindra Bank, MobiKwik |
| CONC-13 Concurrency coding drills | P0 | 43 | Print odd and even numbers alternately using two threads. (23) | DP World, Arize, D. E. Shaw, Delivery Hero, Flipkart |
| CONC-14 Spring Boot @Async & @Scheduled | P0 | 10 | @Async or a message queue for long-running background work? (6) | Adobe, Kotak Mahindra Bank, Microsoft, Paytm, ServiceNow |
| CONC-06 Production JVM debugging | P0 | 45 | A service gets slow (high latency) in production — how do you debug it? (19) | Microsoft, Goldman Sachs, PayPal, Arista Networks, Astrotalk |
| SPRING-01 @Transactional | P0 | 42 | What are the isolation levels, and what does each prevent? (18) | Paytm, Adobe, Agoda, Autodesk, Cisco |
| SPRING-17 Request lifecycle | P0 | 22 | Spring vs Spring Boot — what does Boot actually add? (11) | Apple, BharatPe, Cognizant, Goldman Sachs, Lenskart |
| SPRING-02 IoC, bean lifecycle & dependency injection | P0 | 73 | What are dependency injection and Inversion of Control — and what do they buy you? (45) | EPAM, Visa, Adobe, Agoda, Amazon |
| SPRING-21 Bean scopes | P1 | 11 | What bean scopes does Spring have? (8) | JPMorgan, Lenovo, Mastercard, Oracle, Publicis Sapient |
| SPRING-03 Auto-configuration & starters | P0 | 10 | How does Spring Boot auto-configuration work? (5) | Citi, EPAM, Truemeds, IBS, Rakuten Symphony |
| SPRING-18 Profiles & externalized config | P0 | 12 | How do you manage configuration across dev / staging / prod? (6) | Walmart, Infosys, JPMorgan, Truemeds, PayPal |
| SPRING-06 AOP & the proxy mechanism | P2 | 7 | What is AOP, and how does Spring AOP work internally? (7) | Citi, EPAM, Kotak Mahindra Bank, Mastercard, MobiKwik |
| SPRING-05 REST API design | P0 | 88 | How do you make an API idempotent — e.g. a payment POST that gets retried? (26) | JPMorgan, American Express, Astrotalk, Blinkit, Goldman Sachs |
| SPRING-08 Exception handling | P0 | 20 | How do you implement global exception handling in Spring Boot? (19) | Aditya Birla, Deloitte, EPAM, Goldman Sachs, IBS |
| SPRING-11 Filters vs interceptors | P0 | 6 | Filter vs interceptor — where does each run, and which would you use? (6) | Demandbase, Mastercard, Visa, Zinier |
| SPRING-04 JPA core | P0 | 29 | Optimistic vs pessimistic locking in JPA — when do you use each? (20) | Paytm, Walmart, Autodesk, Bloomberg, Cisco |
| SPRING-07 JPA relationships I | P0 | 10 | One-to-one vs one-to-many — how do you map them, and what is the owning side (mappedBy)? (8) | Blinkit, Target, Urban Company, VMware, Yes Madam |
| SPRING-22 JPA relationships II | P0 | 4 | How do you model a many-to-many relationship (e.g. Person ↔ Job)? (3) | Microsoft, Paytm, eBay, Target |
| SPRING-20 Spring Data queries | P0 | 34 | Lazy vs eager loading — and what causes LazyInitializationException? (13) | American Express, Arctic Wolf, Fortinet, IBM, Oracle |
| SPRING-16 JPA second-level cache | P1 | 0 | — | — |
| SPRING-12 Criteria API & Specifications | P1 | 0 | — | — |
| SPRING-15 Web attacks | P0 | 11 | What is SQL injection — and how do PreparedStatement and ORMs prevent it? (4) | Fortinet, JPMorgan, Apple, Swiggy, Fynd |
| SPRING-09 Spring Security architecture | P0 | 50 | How does Spring Security work — the filter chain and the authentication flow? (21) | Publicis Sapient, Citi, EPAM, Goldman Sachs, Google |
| SPRING-23 JWT | P0 | 32 | How does JWT work — structure and verification? (29) | Apple, Goldman Sachs, Avathon, Delivery Hero, Hyperverge |
| SPRING-10 OAuth 2.0 & service-to-service tokens | P0 | 10 | Explain the OAuth 2.0 flow — authorization code vs client credentials. (10) | Apple, Avathon, Fortinet, Goldman Sachs, IBM |
| SPRING-13 Method security | P1 | 13 | How do you implement role-based access control in Spring (@PreAuthorize)? (13) | Amazon, Arctic Wolf, Citi, Gartner, Goldman Sachs |
| SPRING-14 Actuator, health probes & metrics | P1 | 34 | How do you monitor a Spring Boot service in production? (30) | Microsoft, Autodesk, Agoda, Apple, BharatPe |
| SPRING-19 Maven | P2 | 6 | Maven lifecycle and pom.xml — what happens on mvn package? (4) | Infosys, Rakuten Symphony, Autodesk |

Cards with 0 write-ups still show their questions, labelled "question banks only".

## What the counts changed

- **Confirmed P0**: OOP & exceptions (201 write-ups), HashMap internals (135),
  locks & deadlocks (113), Strings/singleton/equals-hashCode (111), JVM & GC
  (108), REST design & idempotency (88), streams coding (77), DI & bean
  lifecycle (73), Spring Security (50), production debugging (45).
- **Lowered**: bean scopes P0 → P1 (11), virtual threads & ThreadLocal P1 → P2 (4).
- **Kept although rare**, because they are owner-set (resume) priorities: filters
  vs interceptors (6), JPA relationships (10 and 4), Criteria and the L2 cache (0).
- **Worth noting**: LRU cache was asked in 63 write-ups (it lives on the
  Comparator / TreeMap / LinkedHashMap card, already done); optimistic vs
  pessimistic locking in about 20 (now on the JPA core card).

Priorities of cards already marked done were not changed.
