// One-off generator: consolidates the interview plan (AI/HLD/LLD) into a small
// set of topic cards (merging same-topic cards across days, no content lost),
// drops all revision/mock/process cards, and adds a Spring Boot section.
// Run: node scripts/genInterviewPlan.mjs   (from repo root)
import fs from "fs";
import { jobHuntPlan } from "../src/Data/JobHuntPlan.js";

const byId = Object.fromEntries(jobHuntPlan.map((c) => [c.id, c]));

// ── Consolidation groups: each becomes ONE card merging the listed source cards.
const GROUPS = [
  // ── AI / GenAI ──────────────────────────────────────────────────────────
  { id: "ai-rag-retrieval", cat: "AI", priority: "P0", title: "RAG: Chunking, Embeddings, Retrieval & Reranking", src: ["p1-w1-1", "p1-w1-3", "p1-w1-5", "p1-w2-1"] },
  { id: "ai-rag-generation", cat: "AI", priority: "P0", title: "RAG: Prompting, Failure Modes, Context & Caching", src: ["p1-w2-3", "p1-w2-5", "p3-w10-3", "p2-w8-1"] },
  { id: "ai-rag-advanced", cat: "AI", priority: "P1", title: "Advanced RAG: Agentic, GraphRAG & Multimodal", src: ["p3-w9-5", "p3-w9-7", "p3-w9-8"] },
  { id: "ai-agents-core", cat: "AI", priority: "P0", title: "AI Agents: ReAct, Tool Calling & Memory", src: ["p1-w3-1", "p1-w3-3", "p1-w3-5"] },
  { id: "ai-agent-architectures", cat: "AI", priority: "P0", title: "Agent Architectures, Frameworks & MCP", src: ["p1-w4-1", "p3-w10-8", "p3-w10-7"] },
  { id: "ai-langgraph", cat: "AI", priority: "P0", title: "LangGraph End-to-End: State, Routing, HITL & Persistence", src: ["p2-w5-1", "p2-w5-3", "p2-w5-5", "p2-w6-1", "p2-w6-3", "p2-w6-5"] },
  { id: "ai-reliability-safety", cat: "AI", priority: "P0", title: "Agent Reliability: Errors, Guardrails, Safety & Prompt Injection", src: ["p1-w4-3", "p1-w4-5", "p2-w7-3", "p2-w8-5", "p2-w7-1"] },
  { id: "ai-evaluation", cat: "AI", priority: "P0", title: "Evaluating RAG & Agents (RAGAS, LLM-as-Judge, Regression)", src: ["p3-w9-1", "p3-w9-9"] },
  { id: "ai-production", cat: "AI", priority: "P1", title: "Production AI: Cost, Observability & Inference/Serving", src: ["p2-w7-5", "p2-w8-3", "p3-w10-11"] },
  { id: "ai-structured-sql", cat: "AI", priority: "P0", title: "Structured Outputs & Text-to-SQL Agents", src: ["p3-w9-3", "p3-w10-1"] },
  { id: "ai-finetuning", cat: "AI", priority: "P1", title: "Fine-Tuning vs RAG vs Prompting (SFT, LoRA, DPO/RLHF)", src: ["p3-w10-5", "p3-w10-9"] },
  { id: "ai-behavioral", cat: "AI", priority: "P2", title: "Behavioral & Project Storytelling for AI Roles", src: ["p3-w12-1", "p4-w14-5"] },

  // ── High-Level Design ─────────────────────────────────────────────────────
  { id: "hld-ai-systems", cat: "HLD", priority: "P0", title: "Designing AI/LLM Systems (RAG support, Text-to-SQL, Multi-Agent, Real-Time)", src: ["p1-w2-2", "p1-w3-2", "p3-w11-2", "p4-w13-2"] },
  { id: "hld-saas-scaling", cat: "HLD", priority: "P1", title: "Multi-Tenant SaaS, API Gateway & Distributed Cache", src: ["p1-w1-2", "p2-w8-2", "p3-w10-2"] },
  { id: "hld-messaging", cat: "HLD", priority: "P1", title: "Notifications at Scale & Async Job Processing", src: ["p2-w5-2", "p2-w7-2"] },
  { id: "hld-url-shortener", cat: "HLD", priority: "P1", title: "URL Shortener with Analytics", src: ["p2-w6-2", "p3-w9-2"] },
  { id: "hld-ai-platform", cat: "HLD", priority: "P1", title: "AI Platform: Pipelines, Eval/Monitoring, Dashboards & CI/CD", src: ["p1-w4-2", "p3-w12-2", "p4-w14-2", "p4-w15-2"] },

  // ── Low-Level Design ──────────────────────────────────────────────────────
  { id: "lld-oop-patterns", cat: "LLD", priority: "P0", title: "SOLID & Design Patterns (Creational, Structural, Behavioral)", src: ["p3-w10-6", "p3-w9-4", "p3-w9-6"] },
  { id: "lld-caching-pools", cat: "LLD", priority: "P0", title: "Caching, Rate Limiting & Connection Pools", src: ["p1-w1-4", "p1-w2-4", "p4-w14-4"] },
  { id: "lld-concurrency", cat: "LLD", priority: "P1", title: "Concurrency Patterns in Java", src: ["p3-w10-4"] },
  { id: "lld-messaging-logging", cat: "LLD", priority: "P1", title: "Notifications, Pub/Sub & Logging Framework", src: ["p1-w2-6", "p2-w8-6", "p2-w5-4", "p1-w3-6"] },
  { id: "lld-schedulers", cat: "LLD", priority: "P1", title: "Schedulers, Workflow Engine & Feature Flags", src: ["p1-w4-4", "p2-w7-4", "p4-w13-6", "p4-w14-6"] },
  { id: "lld-machines", cat: "LLD", priority: "P1", title: "Stateful Machines: Parking Lot, Elevator, ATM, Vending", src: ["p1-w3-4", "p2-w8-4", "p2-w6-6", "p1-w1-6"] },
  { id: "lld-booking", cat: "LLD", priority: "P1", title: "Booking & Marketplace: Hotel, Cab, Food Delivery, E-Commerce", src: ["p2-w7-6", "p3-w12-4", "p3-w12-6", "p2-w5-6"] },
  { id: "lld-ai-specific", cat: "LLD", priority: "P1", title: "AI-Specific LLD: Agent Framework & RAG Pipeline", src: ["p3-w11-4", "p3-w11-6"] },
  { id: "lld-games", cat: "LLD", priority: "P2", title: "Game Design: Snake & Ladder, Chess", src: ["p2-w6-4", "p4-w13-4"] },
  { id: "lld-storage", cat: "LLD", priority: "P2", title: "File Storage System (S3-style)", src: ["p1-w4-6"] },
];

function mergeGroup(g) {
  const cards = g.src.map((id) => byId[id]).filter(Boolean);
  const missing = g.src.filter((id) => !byId[id]);
  if (missing.length) console.warn(`  ! ${g.id} missing sources:`, missing);

  const keyTopics = [];
  const seen = new Set();
  cards.forEach((c) =>
    (c.keyTopics || []).forEach((t) => {
      if (!seen.has(t)) { seen.add(t); keyTopics.push(t); }
    })
  );

  const prompt =
    cards.length === 1
      ? cards[0].prompt
      : cards
          .map((c) => `════════════════════ ${c.title} ════════════════════\n\n${c.prompt}`)
          .join("\n\n\n");

  const tags = [...new Set(cards.flatMap((c) => c.tags || []))].slice(0, 12);

  return {
    id: g.id,
    categories: [g.cat],
    primaryCategory: g.cat,
    priority: g.priority,
    title: g.title,
    keyTopics,
    prompt,
    tags,
  };
}

// ── Spring Boot section (from the Java & Spring Boot Mastery Plan PDF) ─────────
// Ordered by interview frequency; the plan's Week 15 (pure revision) is dropped.
const SB = [
  { id: "sb-hashmap", priority: "P0", title: "HashMap Internals + equals/hashCode Contract",
    kt: ["How HashMap works: hashing, bucket array, collision handling (linked list → red-black tree at threshold 8)", "What happens during resize (capacity doubles, rehashing)", "equals/hashCode contract: why both must be overridden together", "What breaks in HashMap if hashCode is bad or equals is inconsistent", "TreeMap (sorted, O(log n)) vs LinkedHashMap (insertion order) vs HashMap (unordered, O(1))", "ConcurrentHashMap — how it differs from synchronized HashMap"],
    tests: ["What happens if two objects have the same hashCode?", "What if you override equals but not hashCode?"],
    tags: ["HashMap", "equals/hashCode", "Collections", "ConcurrentHashMap"] },
  { id: "sb-transactional", priority: "P0", title: "@Transactional — Complete Mastery",
    kt: ["How Spring implements it: AOP proxy wrapping your bean", "Why self-invocation (calling @Transactional from same class) doesn't work — proxy is bypassed", "Propagation levels: REQUIRED, REQUIRES_NEW, NESTED, SUPPORTS, NOT_SUPPORTED", "Isolation levels: READ_COMMITTED, REPEATABLE_READ, SERIALIZABLE — anomalies each prevents", "Rollback rules: unchecked exceptions roll back by default, checked do NOT unless specified", "readOnly=true — Hibernate flush mode, query optimization"],
    tests: ["Explain a scenario where REQUIRES_NEW is necessary.", "Why didn't your transaction roll back?"],
    tags: ["@Transactional", "Spring AOP", "Propagation", "Isolation", "Hibernate"] },
  { id: "sb-concurrency", priority: "P0", title: "Concurrency Fundamentals",
    kt: ["synchronized — object monitor, intrinsic lock, method-level vs block-level", "volatile — visibility guarantee, when it's enough vs when you need synchronization", "ReentrantLock vs synchronized — tryLock, fairness, interruptibility", "Semaphore — permit-based concurrency control", "Common problems: race condition, deadlock, livelock, starvation", "Write programs that break without synchronization — observe the failures"],
    tests: ["Difference between volatile and synchronized?", "Write a thread-safe singleton."],
    tags: ["Concurrency", "synchronized", "volatile", "Locks", "Threads"] },
  { id: "sb-di-lifecycle", priority: "P0", title: "Spring DI + Bean Lifecycle",
    kt: ["Full bean lifecycle: instantiation → DI → BeanPostProcessor.before → @PostConstruct → InitializingBean.afterPropertiesSet → BeanPostProcessor.after → ready → @PreDestroy → DisposableBean.destroy", "Scopes: singleton, prototype, request, session", "@Qualifier vs @Primary — resolution order when multiple beans of same type exist", "Circular dependencies — why they happen, how Spring solves (singletons, three-level cache), why constructor injection fails fast", "@Lazy — when and why to use"],
    tests: ["Explain bean lifecycle.", "How does Spring resolve circular dependencies?"],
    tags: ["Spring DI", "Bean Lifecycle", "Scopes", "Circular Dependency"] },
  { id: "sb-java8", priority: "P0", title: "Java 8+ Features + Functional Model",
    kt: ["Optional — proper usage (return type, never field/param), orElse vs orElseGet (lazy), anti-patterns", "Functional interfaces — Predicate, Function, Consumer, Supplier, BiFunction", "Method references (Class::method, instance::method)", "Streams internals — lazy evaluation, short-circuiting (findFirst, anyMatch), parallel streams (when they help vs hurt)", "Records (Java 16+), sealed classes (Java 17) — what and when"],
    tests: ["Difference between orElse and orElseGet?", "When would a parallel stream be slower?"],
    tags: ["Java 8", "Streams", "Optional", "Functional", "Records"] },
  { id: "sb-threadpools", priority: "P1", title: "Thread Pools + CompletableFuture + @Async",
    kt: ["ExecutorService — fixed, cached, scheduled, work-stealing thread pools", "Thread pool sizing: CPU-bound (cores + 1) vs IO-bound (cores × (1 + wait/service))", "CompletableFuture — thenApply vs thenCompose, exceptionally, allOf, anyOf", "Exception handling in async chains — where exceptions go and how to catch them", "Spring @Async — how the proxy works, why it fails without @EnableAsync, custom executor config", "Default SimpleAsyncTaskExecutor creates unbounded threads — why that's dangerous in production"],
    tests: ["How would you size a thread pool for an IO-heavy service?", "What happens if a CompletableFuture stage throws?"],
    tags: ["Thread Pools", "CompletableFuture", "@Async", "ExecutorService"] },
  { id: "sb-aop-proxy", priority: "P1", title: "AOP + Spring Proxy Mechanism",
    kt: ["AOP concepts: aspect, advice (before, after, around), pointcut, join point", "JDK dynamic proxy (interface-based) vs CGLIB (subclassing) — which Spring uses when", "The foundation for @Transactional, @Async, @Cacheable — all work through proxies", "Why final classes/methods can't be proxied by CGLIB", "Writing a custom aspect — logging, timing, retry logic", "Proxy chain order when multiple aspects apply to the same method"],
    tests: ["How does Spring implement @Transactional internally?", "Why won't @Cacheable work on a private method?"],
    tags: ["Spring AOP", "Proxy", "CGLIB", "JDK Dynamic Proxy"] },
  { id: "sb-jpa-hibernate", priority: "P1", title: "JPA/Hibernate Internals",
    kt: ["First-level cache (persistence context) — entities cached per transaction, dirty checking at flush", "N+1 problem — why it happens with lazy loading; solutions (JOIN FETCH, @EntityGraph, @BatchSize)", "FetchType.LAZY vs EAGER, LazyInitializationException and how to handle", "EntityManager lifecycle — open, managed, detached, removed states", "Hibernate query generation — derived queries, @Query for JPQL/native", "Optimistic locking (@Version) vs pessimistic locking — when to use which"],
    tests: ["Explain the N+1 problem and how you solved it.", "What is dirty checking?"],
    tags: ["JPA", "Hibernate", "N+1", "Locking", "EntityManager"] },
  { id: "sb-autoconfig", priority: "P1", title: "Spring Boot Auto-Configuration + Externalized Config",
    kt: ["@SpringBootApplication = @Configuration + @EnableAutoConfiguration + @ComponentScan", "How auto-configuration works: AutoConfiguration.imports / spring.factories", "@Conditional annotations: @ConditionalOnClass, @ConditionalOnProperty, @ConditionalOnMissingBean", "Property resolution order: command line → env vars → application-{profile}.yml → application.yml → defaults", "@ConfigurationProperties vs @Value — type-safe binding vs individual injection", "Spring Profiles — @Profile, environment-specific config"],
    tests: ["How does Spring Boot know to configure a DataSource automatically?", "Explain property resolution order."],
    tags: ["Spring Boot", "Auto-Configuration", "@Conditional", "Profiles"] },
  { id: "sb-string-generics", priority: "P2", title: "String Internals + Generics + Exception Handling",
    kt: ["String pool (intern()), immutability — why String is immutable (security, caching, thread-safety)", "String vs StringBuilder vs StringBuffer", "Generics — type erasure, bounded types (<T extends Comparable>), wildcards (? extends / ? super)", "PECS principle: Producer Extends, Consumer Super", "Checked vs unchecked exceptions — when to use custom exceptions", "How Spring @ControllerAdvice handles exceptions globally"],
    tests: ["Why can't you do new T() in Java?", "Explain PECS with an example."],
    tags: ["String", "Generics", "Type Erasure", "Exceptions", "@ControllerAdvice"] },
  { id: "sb-pooling-cache-rest", priority: "P2", title: "Connection Pooling + Caching + REST Fundamentals",
    kt: ["HikariCP — how pooling works, sizing (cores × 2 + effective_spindle_count), timeout config", "Multiple datasource configuration (relevant to sharding work)", "@Cacheable, @CacheEvict, @CachePut — how the proxy intercepts and checks cache", "Cache eviction strategies: LRU, LFU, TTL — when each makes sense", "Caffeine cache internals", "REST: HTTP method usage, idempotency (GET/PUT/DELETE idempotent, POST not), status codes, API versioning"],
    tests: ["How do you size a connection pool?", "Explain cache-aside pattern."],
    tags: ["HikariCP", "Caching", "Caffeine", "REST", "Idempotency"] },
  { id: "sb-security-jvm", priority: "P2", title: "Spring Security + JVM Basics",
    kt: ["Spring Security filter chain — how requests flow through filters before the controller", "OncePerRequestFilter — how to write custom filters", "Authentication (who are you) vs Authorization (what can you do)", "Connect to Gravitee/OAuth work — same concepts, different layer", "JVM memory: heap (young: Eden + Survivor, old gen) vs stack (per thread, method frames)", "GC: G1 (default Java 17), minor vs major GC, what triggers full GC", "Class loading: bootstrap → extension → application", "Common OOM scenarios: heap space, metaspace, unable to create native thread"],
    tests: ["Explain Spring Security filter chain.", "What causes an OOM error and how do you debug it?"],
    tags: ["Spring Security", "Filter Chain", "JVM", "GC", "OOM"] },
  { id: "sb-sql", priority: "P3", title: "SQL + Query Optimization",
    kt: ["Joins deep dive: INNER, LEFT, RIGHT, FULL, CROSS — visual mental model", "Indexing: B-tree, when index helps vs hurts, composite index column order matters", "EXPLAIN/EXPLAIN ANALYZE — reading plans, seq scan vs index scan", "Window functions: ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD", "Query optimization: avoiding SELECT *, index-only scans, covering indexes", "Snowflake-specific: how sharding affects query routing"],
    tests: ["This query is slow, how do you debug it?", "Difference between clustered and non-clustered index."],
    tags: ["SQL", "Indexing", "Query Optimization", "Window Functions"] },
  { id: "sb-design-patterns", priority: "P3", title: "Design Patterns in Practice",
    kt: ["Patterns you already use: Factory, Builder, Strategy, Observer, Singleton, Template Method", "Identify where each is used in your codebase (don't memorize definitions)", "Factory: how Spring uses it for BeanFactory", "Strategy: FeatureToggle routing", "Observer: event-driven patterns in Spring (@EventListener)", "Template Method: JdbcTemplate, RestTemplate", "Builder: entity builders, query builders"],
    tests: ["Give me a real example of Strategy pattern from your project."],
    tags: ["Design Patterns", "Strategy", "Factory", "Template Method"] },
];

function sbPrompt(title, kt, tests) {
  return (
    `Teach me "${title}" in depth for an SDE-2 Java + Spring Boot interview.\n\n` +
    `Cover each of these:\n${kt.map((t) => `- ${t}`).join("\n")}\n\n` +
    `Make sure I can answer these interview questions crisply:\n${tests.map((t) => `- ${t}`).join("\n")}\n\n` +
    `For each point give me: the underlying mechanism, a short code example, the common gotchas, and how it shows up in a real Java/Spring backend (e.g. a multi-tenant Blue Yonder service).`
  );
}

const sbCards = SB.map((s) => ({
  id: s.id,
  categories: ["Spring Boot"],
  primaryCategory: "Spring Boot",
  priority: s.priority,
  title: s.title,
  keyTopics: s.kt,
  prompt: sbPrompt(s.title, s.kt, s.tests),
  tags: s.tags,
}));

const consolidated = GROUPS.map(mergeGroup);
const all = [...consolidated, ...sbCards];

const CONFIG = `
export const CATEGORIES = ["AI", "HLD", "LLD", "Spring Boot"];

export const CATEGORY_CONFIG = {
  AI: {
    label: "AI / GenAI",
    color: "purple",
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800",
    bar: "bg-gradient-to-r from-purple-500 to-violet-500",
    icon: "🤖",
  },
  HLD: {
    label: "High-Level Design",
    color: "blue",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
    bar: "bg-gradient-to-r from-blue-500 to-sky-500",
    icon: "🏗️",
  },
  LLD: {
    label: "Low-Level Design",
    color: "emerald",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
    bar: "bg-gradient-to-r from-emerald-500 to-green-500",
    icon: "⚙️",
  },
  DSA: {
    label: "Data Structures & Algorithms",
    color: "orange",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800",
    bar: "bg-gradient-to-r from-orange-500 to-amber-500",
    icon: "🧩",
  },
  "Spring Boot": {
    label: "Java & Spring Boot",
    color: "teal",
    badge: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800",
    bar: "bg-gradient-to-r from-teal-500 to-cyan-500",
    icon: "🍃",
  },
};

export const DIFFICULTY_CONFIG = {
  Easy: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  Medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  Hard: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

// P0 = highest (asked in nearly every loop) … P3 = polish/lower frequency.
export const PRIORITY_CONFIG = {
  P0: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800",
  P1: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800",
  P2: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
  P3: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600",
  P4: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700",
};
`;

const header = `// Interview Prep plan — consolidated topic cards (AI / HLD / LLD) + a Java &
// Spring Boot section. Same-topic cards were merged so no learning content is
// lost; revision / mock / process cards were removed.
// Generated by scripts/genInterviewPlan.mjs — edit there and re-run.

export const jobHuntPlan = ${JSON.stringify(all, null, 2)};
`;

fs.writeFileSync("src/Data/JobHuntPlan.js", header + CONFIG);

const counts = all.reduce((a, c) => ((a[c.primaryCategory] = (a[c.primaryCategory] || 0) + 1), a), {});
console.log(`Wrote ${all.length} cards:`, counts);
console.log(`  interview (AI+HLD+LLD): ${all.length - sbCards.length}, Spring Boot: ${sbCards.length}`);
