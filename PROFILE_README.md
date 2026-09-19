<h1 align="center">Shubam Chaudhary</h1>

<p align="center">
  Backend Engineer · Java / Spring Boot · Python · GenAI systems (RAG, LLM agents)<br>
  Software Developer @ Blue Yonder · Hyderabad, India
</p>

<p align="center">
  <a href="https://www.linkedin.com/in/shubam-chaudhary-41005a241/"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white" alt="LinkedIn"></a>
  <a href="https://leetcode.com/SHUBAMCHAUDHARY/"><img src="https://img.shields.io/badge/LeetCode-FFA116?style=flat-square&logo=leetcode&logoColor=black" alt="LeetCode"></a>
  <a href="https://codeforces.com/profile/sam17"><img src="https://img.shields.io/badge/Codeforces-1F8ACB?style=flat-square&logo=codeforces&logoColor=white" alt="Codeforces"></a>
  <a href="mailto:beshubam@gmail.com"><img src="https://img.shields.io/badge/Email-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>
</p>

---

### What I do

- Build **backend services in Java / Spring Boot** — REST APIs, JPA/Hibernate, async processing, Kafka-based pipelines.
- Build **GenAI features that survive production** — RAG pipelines, LangGraph agent workflows, pgvector retrieval, grounding checks, multi-provider LLM orchestration.
- Care about the boring parts: idempotency, backpressure, rate limits, retries, DLQs, bounded memory.

---

### Featured

#### [LogLens](https://github.com/shubamchaudhary/LogLens) · [live demo](https://deeploglens.vercel.app)
**LangGraph-based log intelligence RAG pipeline.** Turns a GB-scale log archive into a grounded, cited incident report you can question in plain English.

- **Memory-bounded ingest** — a streaming splitter emits window-aligned byte ranges; parallel consumers do S3 ranged GETs, so heap stays constant whether the file is 1 MB or 10 GB.
- **Rate limits modeled as Kafka partitions** — one partition ↔ one API key ↔ one consumer, so each worker self-paces with zero distributed coordination.
- **LLMs never count** — deterministic parsers compute every metric; the model only explains anomalies, and a judge model rejects ungrounded claims. Every answer cites the exact log lines.

`Java` `Spring Boot` `Kafka` `PostgreSQL + pgvector` `Python` `FastAPI` `LangGraph` `S3` `React` `Docker`

#### [CodeNITW](https://github.com/shubamchaudhary/CodeNITW)
**Interview-prep platform for SDE aspirants.** HLD / LLD / DSA / Spring Boot / GenAI material, a job-openings feed, and a study planner.

`React` `Vite` `Firebase` `Cloud Functions` `Tailwind`

---

### Tech

**Languages** &nbsp;
![Java](https://img.shields.io/badge/Java-ED8B00?style=flat-square&logo=openjdk&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![C++](https://img.shields.io/badge/C++-00599C?style=flat-square&logo=cplusplus&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)

**Backend** &nbsp;
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![Spring Data JPA](https://img.shields.io/badge/Spring_Data_JPA-6DB33F?style=flat-square&logo=spring&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Kafka](https://img.shields.io/badge/Kafka-231F20?style=flat-square&logo=apachekafka&logoColor=white)

**GenAI** &nbsp;
![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=flat-square&logo=langchain&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-1C3C3C?style=flat-square&logo=langgraph&logoColor=white)
![RAG](https://img.shields.io/badge/RAG-5A45FF?style=flat-square)
![pgvector](https://img.shields.io/badge/pgvector-4169E1?style=flat-square&logo=postgresql&logoColor=white)

**Data** &nbsp;
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white)
![Snowflake](https://img.shields.io/badge/Snowflake-29B5E8?style=flat-square&logo=snowflake&logoColor=white)
![Elasticsearch](https://img.shields.io/badge/Elasticsearch-005571?style=flat-square&logo=elasticsearch&logoColor=white)

**Platform** &nbsp;
![Azure](https://img.shields.io/badge/Azure-0078D4?style=flat-square&logo=microsoftazure&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=flat-square&logo=kubernetes&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=flat-square&logo=git&logoColor=white)

---

### Currently

- Deepening **JVM internals, concurrency, Spring internals, and distributed-systems design**.
- Working on **agentic RAG** — evaluation (RAGAS, LLM-as-judge), guardrails, cost and observability.
- Grinding DSA — [LeetCode](https://leetcode.com/SHUBAMCHAUDHARY/) · [Codeforces](https://codeforces.com/profile/sam17)

---

<div align="center">
  <img height="150" src="https://github-readme-stats.vercel.app/api?username=shubamchaudhary&show_icons=true&hide_border=true&theme=github_dark&hide=issues" alt="GitHub stats">
  <img height="150" src="https://github-readme-stats.vercel.app/api/top-langs/?username=shubamchaudhary&layout=compact&hide_border=true&theme=github_dark&langs_count=6" alt="Top languages">
</div>

<div align="center">
  <img height="150" src="https://leetcard.jacoblin.cool/SHUBAMCHAUDHARY?theme=dark&font=baloo&ext=heatmap" alt="LeetCode stats">
</div>

<p align="center"><i>Open to backend / backend + GenAI roles.</i></p>
