// Opening → skills match scoring (runs in the radar GitHub Action, Node ESM).
//
// Approach (borrowed from Job_search_agent's LLM scorer, reworked to run free &
// deterministically): score each opening by how much of the tech it requires is
// covered by *your* skills. Your skills come from radar/skills.json (have/want
// lists you edit), and the opening's tech is detected from its FULL job
// description. Every score is explainable — we return the exact matched skills.
//
// The score is precomputed here and written into radar/openings.json, so the
// web app only sorts/displays it (no scoring, no résumé handling client-side).

// ── Skill dictionary ─────────────────────────────────────────────────────────
// canonical label → matcher + weight. Weight = how strong a signal the skill is
// for a backend/GenAI SDE profile. `rx` uses word-ish boundaries so "java"
// never matches "javascript" and "go" never matches "google".
const B = (s) => new RegExp(`(?:^|[^a-z0-9+#.])(?:${s})(?:$|[^a-z0-9+#])`, "i");

export const SKILL_DEFS = [
  // Languages
  ["Java", B("java"), 3],
  ["Kotlin", B("kotlin"), 3],
  ["Python", B("python"), 3],
  ["Go", B("go(?:lang)?"), 3],
  ["C++", B("c\\+\\+"), 3],
  ["C", B("\\bc\\b(?:\\s+programming)?"), 2],
  ["C#", B("c#|\\.net|dotnet"), 3],
  ["JavaScript", B("java\\s?script"), 2],
  ["TypeScript", B("type\\s?script"), 3],
  ["Scala", B("scala"), 3],
  ["Rust", B("rust"), 3],
  ["Ruby", B("ruby"), 2],
  ["PHP", B("php"), 2],
  ["Perl", B("perl"), 1],
  ["Shell", B("bash|shell scripting|shell script"), 1],
  ["SQL", B("sql"), 2],
  // Backend frameworks / runtimes
  ["Spring", B("spring(?:\\s?boot)?|spring\\s?cloud|spring\\s?mvc|spring\\s?security"), 3],
  ["Micronaut", B("micronaut"), 2],
  ["Quarkus", B("quarkus"), 2],
  ["Ktor", B("ktor"), 2],
  ["Node.js", B("node(?:\\.?js)?"), 3],
  ["Express", B("express(?:\\.?js)?"), 2],
  ["NestJS", B("nest\\.?js"), 2],
  ["Django", B("django"), 3],
  ["Flask", B("flask"), 2],
  ["FastAPI", B("fast\\s?api"), 3],
  ["Rails", B("rails|ruby on rails"), 2],
  ["Hibernate", B("hibernate|jpa"), 2],
  ["Microservices", B("micro\\s?services?"), 2],
  ["REST", B("rest(?:ful)?(?:\\s?api)?"), 1],
  ["GraphQL", B("graph\\s?ql"), 2],
  ["gRPC", B("grpc"), 2],
  ["WebSocket", B("web\\s?sockets?"), 1],
  ["API Gateway", B("api gateway"), 1],
  // Frontend
  ["React", B("react(?:\\.?js)?"), 3],
  ["Angular", B("angular"), 3],
  ["Vue", B("vue(?:\\.?js)?"), 3],
  ["Next.js", B("next\\.?js"), 2],
  ["Svelte", B("svelte"), 2],
  ["Tailwind", B("tailwind"), 1],
  ["HTML/CSS", B("html5?|css3?"), 1],
  // Data stores
  ["PostgreSQL", B("postgres(?:ql)?"), 2],
  ["MySQL", B("mysql|mariadb"), 2],
  ["Oracle DB", B("oracle db|oracle database|pl/?sql"), 1],
  ["MongoDB", B("mongo(?:db)?"), 2],
  ["Redis", B("redis|memcached"), 2],
  ["Cassandra", B("cassandra|scylla(?:db)?"), 2],
  ["DynamoDB", B("dynamo\\s?db"), 2],
  ["Elasticsearch", B("elastic\\s?search|opensearch|elk"), 2],
  ["Snowflake", B("snowflake"), 2],
  ["Neo4j", B("neo4j|graph database"), 2],
  ["ClickHouse", B("click\\s?house"), 2],
  ["CockroachDB", B("cockroach\\s?db"), 2],
  ["BigQuery", B("big\\s?query"), 2],
  ["Redshift", B("redshift"), 2],
  ["Databricks", B("databricks"), 2],
  // Messaging / streaming / data
  ["Kafka", B("kafka"), 3],
  ["RabbitMQ", B("rabbit\\s?mq"), 2],
  ["Pulsar", B("pulsar"), 2],
  ["SQS/SNS", B("\\bsqs\\b|\\bsns\\b"), 1],
  ["Kinesis", B("kinesis"), 2],
  ["NATS", B("\\bnats\\b"), 1],
  ["Celery", B("celery"), 1],
  ["Spark", B("spark"), 2],
  ["Flink", B("flink"), 2],
  ["Airflow", B("airflow"), 2],
  ["dbt", B("\\bdbt\\b"), 1],
  ["ETL", B("\\betl\\b|data pipelines?"), 1],
  // Cloud / infra / devops
  ["AWS", B("aws|amazon web services|ec2|\\bs3\\b|lambda|eks|\\becs\\b"), 3],
  ["GCP", B("gcp|google cloud|\\bgke\\b"), 3],
  ["Azure", B("azure|\\baks\\b"), 3],
  ["Kubernetes", B("kubernetes|k8s"), 3],
  ["Docker", B("docker|container(?:s|ized)?"), 2],
  ["Terraform", B("terraform"), 2],
  ["Helm", B("\\bhelm\\b"), 1],
  ["Ansible", B("ansible"), 1],
  ["Pulumi", B("pulumi"), 1],
  ["Istio", B("istio|service mesh"), 2],
  ["ArgoCD", B("argo\\s?cd|argo"), 1],
  ["CI/CD", B("ci/?cd|jenkins|github actions|gitlab ci|circle\\s?ci|travis"), 1],
  ["Observability", B("observability|prometheus|grafana|datadog|open\\s?telemetry|splunk"), 1],
  ["Linux", B("linux|unix"), 1],
  ["Serverless", B("serverless"), 1],
  // GenAI / ML
  ["GenAI", B("gen\\s?ai|generative ai"), 3],
  ["LLM", B("llm|large language model"), 3],
  ["LangChain", B("lang\\s?chain"), 3],
  ["LangGraph", B("lang\\s?graph"), 3],
  ["LlamaIndex", B("llama\\s?index"), 2],
  ["Agentic AI", B("agentic|ai agents?|autonomous agents?"), 3],
  ["RAG", B("rag|retrieval augmented"), 3],
  ["Vector DB", B("vector (?:db|database|store)|pinecone|weaviate|faiss|chroma|pgvector|milvus|qdrant"), 2],
  ["Embeddings", B("embeddings?|semantic search"), 2],
  ["Prompt Engineering", B("prompt engineering|prompt design"), 2],
  ["Fine-tuning", B("fine[-\\s]?tun(?:e|ing)|\\brlhf\\b"), 2],
  ["MLOps", B("ml\\s?ops|model deployment|kubeflow|sagemaker|ml\\s?flow"), 2],
  ["Machine Learning", B("machine learning"), 2],
  ["Deep Learning", B("deep learning|neural network|transformers?"), 2],
  ["PyTorch", B("py\\s?torch"), 2],
  ["TensorFlow", B("tensor\\s?flow"), 2],
  ["NLP", B("nlp|natural language processing"), 2],
  // Security / auth
  ["OAuth", B("oauth|oidc|openid"), 2],
  ["JWT", B("\\bjwt\\b|json web token"), 1],
  ["SAML/SSO", B("\\bsaml\\b|single sign[-\\s]?on|\\bsso\\b"), 1],
  ["Security", B("cybersecurity|application security|secure coding|owasp"), 1],
  // CS fundamentals / role signals
  ["Distributed Systems", B("distributed systems?|consensus|raft|paxos|leader election"), 2],
  ["System Design", B("system design|scalab(?:le|ility)|high availab|fault[-\\s]?toleran|load balanc"), 2],
  ["Event-Driven", B("event[-\\s]?driven|event sourcing|\\bcqrs\\b|message queue"), 2],
  ["Concurrency", B("concurrency|multi[-\\s]?threading|parallel(?:ism|ization)?"), 2],
  ["Caching", B("caching|cache invalidation|\\bcdn\\b"), 1],
  ["Sharding", B("sharding|partitioning|replication"), 1],
  ["Data Structures", B("data structures?|algorithms?"), 1],
  ["Design Patterns", B("design patterns?|\\boop\\b|object[-\\s]?oriented|domain[-\\s]?driven"), 1],
  ["Testing", B("unit test|integration test|\\btdd\\b|junit|pytest|mockito|selenium|cypress"), 1],
  ["Agile", B("agile|scrum|kanban"), 1],
  ["Backend", B("back\\s?end|server\\s?side"), 2],
  ["Full Stack", B("full[-\\s]?stack"), 1],
];

// Title words that mark a relevant engineering role — used for the low-signal
// fallback score when an opening exposes only a title (no description).
const ROLE_RX = /\b(software|engineer|developer|sde|swe|backend|back-end|full[- ]?stack|platform|distributed|architect)\b/i;

const MIN_DENOM = 8; // breadth floor so a thin JD (few detected skills) can't auto-score 100
const WANT_FACTOR = 0.7; // a "want to learn" skill is a partial fit, not full

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function wordRx(s) {
  return new RegExp(`(?:^|[^a-z0-9+#.])(?:${escapeRegex(s)})(?:$|[^a-z0-9+#])`, "i");
}

// Build a reusable scorer from your skills lists. Skills you list that aren't in
// the dictionary get a synthesized matcher so they still count.
export function buildScorer({ have = [], want = [] } = {}) {
  const known = new Set(SKILL_DEFS.map(([label]) => label.toLowerCase()));
  const defs = SKILL_DEFS.map(([label, rx, w]) => ({ label, rx, w }));
  for (const s of [...have, ...want]) {
    if (s && !known.has(s.toLowerCase())) {
      defs.push({ label: s, rx: wordRx(s), w: 2 });
      known.add(s.toLowerCase());
    }
  }
  const haveSet = new Set(have.map((s) => s.toLowerCase()));
  const wantSet = new Set(want.map((s) => s.toLowerCase()));

  const extract = (text) => {
    const t = ` ${text || ""} `;
    const hits = [];
    for (const d of defs) if (d.rx.test(t)) hits.push(d);
    return hits;
  };

  const score = (opening) => {
    const title = opening.title || "";
    const body = `${title} ${opening.desc || ""}`;
    const titleHits = new Set(extract(title).map((d) => d.label));

    let openingW = 0;
    let matchedW = 0;
    const matched = [];
    for (const d of extract(body)) {
      const w = titleHits.has(d.label) ? d.w * 2 : d.w;
      openingW += w;
      const low = d.label.toLowerCase();
      if (haveSet.has(low)) {
        matchedW += w;
        matched.push({ skill: d.label, type: "have", w });
      } else if (wantSet.has(low)) {
        matchedW += w * WANT_FACTOR;
        matched.push({ skill: d.label, type: "want", w });
      }
    }

    if (openingW > 0) {
      const s = Math.max(0, Math.min(100, Math.round((100 * matchedW) / Math.max(openingW, MIN_DENOM))));
      matched.sort((a, b) => b.w - a.w);
      return { score: s, matched: matched.slice(0, 8).map(({ skill, type }) => ({ skill, type })), basis: "skills" };
    }

    // Title-only fallback (big-company postings with no description): approximate
    // by whether any of your skills appear in the title, capped low.
    if (ROLE_RX.test(title)) {
      const inTitle = matched.length > 0;
      return { score: inTitle ? 45 : 30, matched: [], basis: "title" };
    }
    return { score: 0, matched: [], basis: "none" };
  };

  return { score };
}
