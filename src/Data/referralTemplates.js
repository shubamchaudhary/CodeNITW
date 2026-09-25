// The owner's personal referral-request messages, one per company category.
// Kept out of jobTrackerCompanies.js so the shared company list can be served
// to every user without these: the Job Tracker loads this file only for the
// owner account.

export const REFERRAL_TEMPLATES = {
 "FAANG": {
  "when": "Google, MS, Amazon, Meta, Apple, Netflix",
  "message": "Hi [Name], hope you're doing well!\n\nI'm Shubam, an SDE at Blue Yonder (~2 YOE, NIT Warangal '24). I work on a multi-tenant retail supply-chain platform serving 1200+ tenants — recently led Snowflake sharding with realm-level routing and migrated our API gateway from Azure APIM to Gravitee with backward-compatible dual-stack support.\n\nI saw an SDE-2 opening at [Company] ([Role/JR ID]) and would love to be referred. 800+ DSA solved, preparing thoroughly for the loop. Could you help with a referral?\n\nThanks!\nShubam"
 },
 "Snowflake": {
  "when": "ONLY for Snowflake",
  "message": "Hi [Name],\n\nI'm Shubam, an SDE at Blue Yonder. I actually work with Snowflake every day — recently implemented a realm-level sharding system in our allocation platform that maps 1200+ tenants to dedicated Snowflake accounts via OAuth M2M, dynamic datasource creation, and Caffeine-cached metadata. Cut query latency by 20%.\n\nGiven I already use your product deeply in production, I'd love to contribute on the other side. Saw [Role/JR ID] — would you refer me?\n\nThanks!\nShubam Chaudhary | NIT Warangal '24"
 },
 "SCMCompetitor": {
  "when": "Manhattan, Kinaxis, o9 — direct BY competitors",
  "message": "Hi [Name],\n\nI'm Shubam from Blue Yonder — I work on the Cognitive Allocation platform (multi-tenant, 1200+ retailers). Recently designed our Priority Allocation engine that converts SKU-level priorities to store-level and handles bulk/pack/mixed supply modes — used in 90% of customer allocations.\n\nGiven [Company] solves the same problem space, I'd love to bring this domain expertise across. Saw [Role/JR ID] — could you help with a referral?\n\nThanks!\nShubam | NIT Warangal '24 | 2 YOE"
 },
 "SCM": {
  "when": "Coupa, GEP, Flexport, Project44, FourKites, Locus, FarEye etc.",
  "message": "Hi [Name],\n\nI'm Shubam, SDE at Blue Yonder working on retail allocation/supply-chain (1200+ tenants, Java/Spring/Snowflake). My recent work — Snowflake sharding, async integrations with retry/fallback, priority allocation algorithms — overlaps significantly with what [Company] is building.\n\nSaw [Role/JR ID]. Would love a referral if you're open to it.\n\nThanks!\nShubam | NIT Warangal '24"
 },
 "Retail": {
  "when": "Walmart, Target, Lowe's, HD, Tesco, Flipkart, Myntra etc.",
  "message": "Hi [Name],\n\nI'm Shubam, an SDE at Blue Yonder where I build allocation systems for retailers (1200+ tenants). Recent work: Snowflake sharding for tenant isolation, async integration with the Pack Service that eliminated all timeout failures, and priority allocation logic running in 90% of customer flows.\n\nRetail-tech is the domain I want to grow in, and [Company] is a top pick. Saw [Role/JR ID] — could you refer me?\n\nThanks!\nShubam | NIT Warangal '24 | Java/Spring/Snowflake"
 },
 "Fintech": {
  "when": "Visa, MC, PayPal, Stripe, PhonePe, Razorpay, Goldman etc.",
  "message": "Hi [Name],\n\nI'm Shubam, SDE at Blue Yonder (~2 YOE). I build backend systems on a multi-tenant Java/Spring platform — recently led an API gateway migration (Azure APIM to Gravitee) with token generation per-origin, OAuth 2.0 across 1000+ realms, and built an async integration with retry/backoff that eliminated production timeouts.\n\nThe scale + reliability + auth work overlaps with what [Company] does. Saw [Role/JR ID] — would love a referral.\n\nThanks!\nShubam | NIT Warangal '24"
 },
 "Auth": {
  "when": "Okta, Auth0, Stytch, WorkOS, Clerk, Frontegg",
  "message": "Hi [Name],\n\nI'm Shubam, SDE at Blue Yonder. I work on a multi-tenant platform where I recently built a gateway-aware token generation service handling OAuth 2.0 M2M credentials per request origin, UserInfo enrichment filters, and thread-local context propagation across 1000+ Azure realms and 200+ Gravitee realms.\n\nIdentity/auth at multi-tenant scale is exactly what I want to specialize in, and [Company] is the obvious place. Saw [Role/JR ID] — could you refer me?\n\nThanks!\nShubam | NIT Warangal '24"
 },
 "MultiTenantSaaS": {
  "when": "Salesforce, Workday, ServiceNow, Freshworks, Rippling etc.",
  "message": "Hi [Name],\n\nI'm Shubam, SDE at Blue Yonder. I work on a multi-tenant retail SaaS serving 1200+ tenants — recently implemented per-tenant Snowflake sharding with realm-level routing, OAuth M2M auth, and feature-flag-controlled rollout.\n\nMulti-tenant systems are what I want to keep building, and [Company] does it at the scale I want to grow into. Saw [Role/JR ID] — would love a referral.\n\nThanks!\nShubam | NIT Warangal '24 | Java/Spring/Snowflake"
 },
 "DataPlatform": {
  "when": "MongoDB, Confluent, Databricks, Fivetran, dbt, Atlan, Cockroach etc.",
  "message": "Hi [Name],\n\nI'm Shubam, SDE at Blue Yonder. Recent work: Snowflake sharding across 1200+ tenants with dynamic datasource creation + connection pooling, async data integration with poll/backoff/fallback, and an integration testing framework that runs full workflows against Snowflake on every PR.\n\nData infra is where I want to head, and [Company] is at the center of that. Saw [Role/JR ID] — could you refer me?\n\nThanks!\nShubam | NIT Warangal '24"
 },
 "DevTools": {
  "when": "Atlassian, GitHub, GitLab, Postman, MuleSoft, Datadog, Sentry etc.",
  "message": "Hi [Name],\n\nI'm Shubam, SDE at Blue Yonder (~2 YOE, Java/Spring). Beyond product code, I built our team's quality automation infra — parallel test runs across 7 repos via GitHub Actions, aggregating unit/mutation/CodeQL/Codacy/BlackDuck reports with branch-specific dashboards. Also built an integration test framework that blocks regressions on every PR.\n\nDeveloper-experience is something I genuinely care about. Saw [Role/JR ID] at [Company] — would love a referral.\n\nThanks!\nShubam | NIT Warangal '24"
 },
 "DistributedSystems": {
  "when": "Uber, Swiggy, Hotstar, DoorDash, Dream11",
  "message": "Hi [Name],\n\nI'm Shubam, SDE at Blue Yonder. I work on a multi-tenant retail allocation platform — recent work includes Snowflake sharding with realm-level routing, async integration handling 10%+ of traffic with submit/poll/backoff/fallback patterns, and feature-flag-gated rollouts across 1000+ realms.\n\n[Company]'s scale is exactly the next challenge I want to take on. Saw [Role/JR ID] — could you refer me?\n\nThanks!\nShubam | NIT Warangal '24 | 800+ DSA"
 },
 "Security": {
  "when": "Palo Alto, CrowdStrike, Wiz, Snyk, Zscaler, SentinelOne",
  "message": "Hi [Name],\n\nI'm Shubam, SDE at Blue Yonder (~2 YOE Java/Spring). I work on a multi-tenant platform — recently built OAuth 2.0 M2M token services, request-origin-aware credential routing, and integrated Codacy/CodeQL/BlackDuck scanning into our CI for security/SCA across 7 repos.\n\nSecurity is the direction I'd like to go deeper in. Saw [Role/JR ID] at [Company] — would love a referral.\n\nThanks!\nShubam | NIT Warangal '24"
 },
 "AgenticAI": {
  "when": "OpenAI, Anthropic, LangChain, Sarvam, Glean, Composio, Lyzr - GenAI/Agent companies",
  "message": "Hi [Name],\n\nI'm Shubam, SDE at Blue Yonder (~2 YOE). At work I'm building LLM-driven agents for inventory operations using LangChain/LangGraph + Python, on top of our existing Java service layer.\n\nIn parallel I built DeepDocAI (deepdocai.vercel.app) — a RAG document Q&A system with multi-provider LLM orchestration (Gemini/SambaNova/Cerebras/Cohere/Grok) using weighted round-robin routing across providers to work within free-tier rate limits, parallel batch embedding (50 chunks/call), and HikariCP+CompletableFuture for async pipelines. Cut document ingestion from 2 hours to ~2 minutes.\n\nAgent systems and LLM infra are exactly where I want to focus full-time. Saw [Role/JR ID] at [Company] — would love a referral.\n\nThanks!\nShubam | NIT Warangal '24"
 },
 "LLMInfra": {
  "when": "Portkey, LangSmith, Langfuse, Helicone, Arize, Galileo - LLM ops/gateway",
  "message": "Hi [Name],\n\nI'm Shubam, SDE at Blue Yonder. Two pieces of my background that map directly to [Company]:\n\n1) At work, I led an API gateway migration (Azure APIM to Gravitee) with backward-compatible dual-stack routing, per-origin credential adaptation, and multi-realm OAuth M2M — exactly the gateway/routing patterns LLM-ops platforms need.\n\n2) On the side, I built DeepDocAI — a RAG system with weighted round-robin routing across 5 LLM providers (Gemini/SambaNova/Cerebras/Cohere/Grok), retry/backoff, and observability hooks. Built it because I needed to work within free-tier rate limits — basically a tiny version of what [Company] does at scale.\n\nLLM infra is where I want to focus full-time. Saw [Role/JR ID] — would love a referral.\n\nThanks!\nShubam | NIT Warangal '24"
 },
 "VectorDB": {
  "when": "Pinecone, Weaviate, Qdrant, Chroma, Milvus/Zilliz, Vespa",
  "message": "Hi [Name],\n\nI'm Shubam, SDE at Blue Yonder. I built DeepDocAI (deepdocai.vercel.app) using PostgreSQL+pgvector for embeddings storage — multi-stage RAG query flow with context aggregation, parallel batch embedding via Gemini's batch API (50 chunks/call), HikariCP connection pooling, and CompletableFuture async orchestration. Reduced ingestion from 2hrs to 2min.\n\nWorking with pgvector at the application layer made me want to go deeper into how vector DBs work internally. Saw [Role/JR ID] at [Company] — would love a referral.\n\nThanks!\nShubam | NIT Warangal '24 | Java/Python"
 },
 "AICodeAssistant": {
  "when": "Cursor, Codeium, Sourcegraph, Replit, Continue, Tabnine - AI dev tools",
  "message": "Hi [Name],\n\nI'm Shubam, SDE at Blue Yonder (~2 YOE Java/Spring + Python). I use AI coding assistants daily and have built RAG systems myself (DeepDocAI — deepdocai.vercel.app) with multi-provider LLM orchestration, embedding pipelines, and context aggregation.\n\nAt work I'm now building LLM agents on top of our service layer using LangChain/LangGraph. AI dev-tools is the intersection of all of this for me. Saw [Role/JR ID] at [Company] — would love a referral.\n\nThanks!\nShubam | NIT Warangal '24"
 },
 "OpenSource": {
  "when": "Red Hat, Automattic, GitLab, HuggingFace",
  "message": "Hi [Name],\n\nI'm Shubam, SDE at Blue Yonder (~2 YOE Java/Spring). My work involves a lot of OSS — Spring, Snowflake JDBC, Caffeine, HikariCP, GitHub Actions automation across 7 repos, and a personal RAG project (DeepDocAI) using PDFBox/POI/Tesseract + pgvector.\n\n[Company]'s OSS-first culture is what I'm looking for. Saw [Role/JR ID] — would love a referral.\n\nThanks!\nShubam | NIT Warangal '24"
 },
 "Generic": {
  "when": "Default for any company without a specialized template",
  "message": "Hi [Name],\n\nI'm Shubam, an SDE at Blue Yonder (~2 YOE, NIT Warangal '24). I work on a multi-tenant retail supply-chain platform serving 1200+ tenants in Java/Spring/PostgreSQL/Snowflake. Recently led Snowflake sharding, an API gateway migration (Azure APIM to Gravitee), and async integrations with retry/fallback patterns.\n\nSaw [Role/JR ID] open at [Company] and would love to be referred. 800+ DSA solved, preparing thoroughly. Could you help?\n\nThanks!\nShubam"
 },
 "AlumniNITW": {
  "when": "PREFIX for any NIT-W alumni",
  "message": "Hi [Name], NIT-W batch [year] here!\n\n[Then continue with the relevant template]"
 },
 "ExBlueYonder": {
  "when": "PREFIX for ex-Blue Yonder people",
  "message": "Hi [Name],\n\nI'm Shubam — currently at Blue Yonder (Cognitive Allocation team under Shashi). Saw you were here before moving to [Company] and figured you'd be a great person to reach out to.\n\n[Then continue with the relevant template]"
 }
};
