# Interview evidence — what 2024–26 Java backend loops actually asked

The ground under the Core Stack priorities (`coreStackMap.mjs`). Collected Oct 2026
from candidate-written reports only — LeetCode Discuss, LinkedIn posts, GeeksforGeeks
and Naukri Code360 experiences, Glassdoor reviews. Question banks and listicles are
excluded: they list everything, so they say nothing about frequency.

Counts are **distinct loops that name the topic** (about 45 loops, mostly SDE-2 /
2–5 YOE, India). They are lower bounds — many write-ups only summarise ("Spring Boot
questions"), so a topic can be asked without being named. Read them as an ordering,
not a percentage.

## Java Core / Concurrency / Spring — counts per card

| Card | Loops | Where (examples) |
|---|---:|---|
| JAVA-01 HashMap / ConcurrentHashMap internals *(done)* | 16 | JPMC, Goldman Sachs (write one from scratch), Paytm (custom put/get), Walmart, Deloitte, PayPal, HERE, Yes Madam |
| SPRING-02 IoC, bean lifecycle, DI, circular deps | 18 | JPMC, Gartner, Swiggy, HiLabs (rejected on it), Truemeds, Yes Madam, Target, Apple, Nagarro, Accolite |
| JAVA-04 JVM memory & GC | 9 | JPMC (System.gc, GC algorithms), JPMorgan (weak/soft refs), MNC round (G1, OOM types), Nagarro (ZGC), Falabella (OOM at startup), Walmart SDE-3 |
| JAVA-10 Streams, written live | 9 | M2P (all coding in streams), Truemeds (groupingBy), UKG, Paytm SSE, Backbase, PayPal |
| SPRING-01 @Transactional *(done)* | 9 | JPMC, Truemeds, M2P, Yes Madam, EPAM, PayPay (internals) |
| SPRING-05 REST design, idempotency, validation | 8 | PayPay (double payment), RSA (PUT vs POST), Target (@Valid), Dassault, Infosys, PayPal |
| JAVA-06 Strings, immutability, equals/hashCode, singleton | 7 | Goldman Sachs (x2, incl. reflection-proof singleton), Cognitree (rejected on equals/hashCode), Dassault, M2P |
| SPRING-17 Spring vs Spring Boot, request internals | 7 | JPMC, UKG, Yes Madam, PayPal, 2026 SDE-2 loop, Glassdoor (several) |
| SPRING-03 @SpringBootApplication, auto-config, Boot startup | 6 | Truemeds, RSA (SpringApplication.run internals), Dassault, Infosys (embedded server), UKG |
| SPRING-08 Exception handling / @ControllerAdvice | 6 | Gartner, Walmart, 2026 SDE-2 loop, Glassdoor (most common of the three web-layer topics) |
| CONC-13 Thread coding (odd/even, print in order, blocking queue) | 5 | Walmart SDE-3, Arrise, Paytm, SAP, LinkedIn report |
| JAVA-05 Java 8 → 11 → 17 features | 4 | Paytm (8 vs 11 vs 17), EPAM, MNC round (records, sealed, switch), 2026 SDE-2 loop |
| JAVA-07 Generics | 4 | Truemeds, EPAM, Walmart SDE-3 (add generics to an LRU cache), HSBC |
| SPRING-21 Bean scopes, prototype in singleton | 4 | Backbase, Accolite, 2026 L1 round, LinkedIn report |
| SPRING-23 JWT | 4 | 2026 SDE-2 loop (four JWT questions), Zycus (write JWT generation), two 2026 LinkedIn rounds |
| JAVA-11 Reflection, custom annotations | 3 | Yes Madam (reflection), Gartner (custom annotations), Goldman Sachs |
| CONC-06 Production debugging (OOM, latency) | 3 | Yes Madam (latency), Falabella (OOM), LinkedIn report |
| SPRING-04 JPA / Hibernate core | 2 | Backbase, 2026 L1 round |
| SPRING-09 Spring Security | 2 | M2P (secure an endpoint), Glassdoor |
| SPRING-10 OAuth / S2S, SPRING-11 filters vs interceptors, SPRING-14 Actuator, SPRING-15 web attacks, SPRING-18 profiles, SPRING-19 Maven, SPRING-20 pagination, CONC-11 virtual threads, CONC-14 @Async | 1 each | — |
| SPRING-06 AOP, SPRING-07/22 relationships, SPRING-12 Criteria, SPRING-13 method security, SPRING-16 L2 cache, JAVA-08 Optional | 0 | Only in question banks |

N+1 is named in nearly every 2026 bank but in only one candidate report — it tends to
arrive as a follow-up to "explain your JPA layer", not as an opener.

## Outside these three sections (for the next pass)

- SQL and indexing: ~8 loops (Gartner, Yes Madam, Paytm, Walmart, JPMC live SQL, Truemeds).
- Kafka: ~8 loops (Walmart partitions/consumer groups, PayU idempotency and ordering, Falabella DLQ, M2P, PayPay, Paytm).
- Optimistic vs pessimistic locking / isolation levels: 5 loops (Paytm, JPMC, Walmart, M2P, Swiggy) — DATA-03 is P1 and likely deserves P0.
- Coding outside DSA: HashMap from scratch (Goldman Sachs, Paytm, JPMC), LRU cache (Sprinklr, Walmart), "guess the output" Java snippets (HiLabs, Backbase).
- Almost every loop opened with a resume/project deep-dive.

## Sources

LeetCode Discuss: Truemeds SDE-2 (6886380), M2P SDE-2 (5998447, 5270525, 5655315),
PayPay SDE-2 (6827319, 7603671), Gartner SDE-2 (6673971), Yes Madam SDE-2 Jan 2026
(7649722), JPMC SDE-2 (7614226, 7421234, 4584155), Swiggy SDE II (6836296), HiLabs SDE-2
Aug 2025 (7662240), Sprinklr SDE-2 Sep 2025 (7652869), Job Switch Journey —
AMEX/UKG/Walmart/NetApp/Paytm/GS (6135308), Job Switch Journey — UKG/Sigmoid/Freecharge/
PayU/Licious (6170013), "Java backend interviews — what actually gets asked" (8252891),
Goldman Sachs Java Associate (6786915), Walmart SDE-3 2025–26 (7774527, 7209928),
Job Switch Attempt 2025–26 (8289157), Pharmeasy SDE-2 Sep 2025 (7559900), Cognitree
(7079283), Apple L4 (6461783).
LinkedIn: padmanava-dutta Java SDE-2 loop (2026); java-by-madhu-vundavalli MNC round
and 2026 prep posts.
GeeksforGeeks: Dassault Systèmes 3+ YOE, Accolite senior, Infosys 2 YOE (Aug 2025),
Accenture 3+ YOE, HERE SDE-2, PayPal SDE II, HSBC SDE-2.
Glassdoor (glassdoor.co.in): Nagarro, Backbase, Deloitte Java interview reviews.
Naukri Code360: Optum, Revature experiences.
Earlier passes: Walmart SE-III (interviewexperiences.in), JPMorgan SDE-2 (devbrainiac.com),
Arrise / Paytm / SAP / Deloitte SDE-2 (leetcode.com, jointaro.com).

Gaps: Reddit is not reachable from the research tool, and LinkedIn/AmbitionBox pages
could only be read through search snippets, not opened in full.
