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
  ["C#", B("c#|\\.net|dotnet"), 3],
  ["JavaScript", B("java\\s?script"), 2],
  ["TypeScript", B("type\\s?script"), 3],
  ["Scala", B("scala"), 3],
  ["Rust", B("rust"), 3],
  ["Ruby", B("ruby"), 2],
  ["PHP", B("php"), 2],
  ["SQL", B("sql"), 2],
  // Backend frameworks / runtimes
  ["Spring", B("spring(?:\\s?boot)?"), 3],
  ["Node.js", B("node(?:\\.?js)?"), 3],
  ["Express", B("express(?:\\.?js)?"), 2],
  ["Django", B("django"), 3],
  ["Flask", B("flask"), 2],
  ["FastAPI", B("fast\\s?api"), 3],
  ["Hibernate", B("hibernate|jpa"), 2],
  ["Microservices", B("micro\\s?services?"), 2],
  ["REST", B("rest(?:ful)?(?:\\s?api)?"), 1],
  ["GraphQL", B("graph\\s?ql"), 2],
  ["gRPC", B("grpc"), 2],
  // Frontend
  ["React", B("react(?:\\.?js)?"), 3],
  ["Angular", B("angular"), 3],
  ["Vue", B("vue(?:\\.?js)?"), 3],
  ["Next.js", B("next\\.?js"), 2],
  ["Tailwind", B("tailwind"), 1],
  // Data stores
  ["PostgreSQL", B("postgres(?:ql)?"), 2],
  ["MySQL", B("mysql"), 2],
  ["MongoDB", B("mongo(?:db)?"), 2],
  ["Redis", B("redis"), 2],
  ["Cassandra", B("cassandra"), 2],
  ["DynamoDB", B("dynamo\\s?db"), 2],
  ["Elasticsearch", B("elastic\\s?search|elk"), 2],
  ["Snowflake", B("snowflake"), 2],
  // Messaging / streaming / data
  ["Kafka", B("kafka"), 3],
  ["RabbitMQ", B("rabbit\\s?mq"), 2],
  ["Pulsar", B("pulsar"), 2],
  ["Spark", B("spark"), 2],
  ["Flink", B("flink"), 2],
  ["Airflow", B("airflow"), 2],
  // Cloud / infra / devops
  ["AWS", B("aws|amazon web services"), 3],
  ["GCP", B("gcp|google cloud"), 3],
  ["Azure", B("azure"), 3],
  ["Kubernetes", B("kubernetes|k8s"), 3],
  ["Docker", B("docker|container(?:s|ized)?"), 2],
  ["Terraform", B("terraform"), 2],
  ["CI/CD", B("ci/?cd|jenkins|github actions|gitlab ci"), 1],
  ["Linux", B("linux|unix"), 1],
  ["Serverless", B("serverless|lambda"), 1],
  // GenAI / ML
  ["GenAI", B("gen\\s?ai|generative ai"), 3],
  ["LLM", B("llm|large language model"), 3],
  ["LangChain", B("lang\\s?chain"), 3],
  ["RAG", B("rag|retrieval augmented"), 3],
  ["Vector DB", B("vector (?:db|database)|pinecone|weaviate|faiss|chroma"), 2],
  ["Machine Learning", B("machine learning"), 2],
  ["Deep Learning", B("deep learning|neural network"), 2],
  ["PyTorch", B("py\\s?torch"), 2],
  ["TensorFlow", B("tensor\\s?flow"), 2],
  ["NLP", B("nlp|natural language processing"), 2],
  // CS fundamentals / role signals
  ["Distributed Systems", B("distributed systems?"), 2],
  ["System Design", B("system design|scalab(?:le|ility)|high availab"), 2],
  ["Data Structures", B("data structures?|algorithms?"), 1],
  ["Backend", B("back\\s?end|server\\s?side"), 2],
  ["Full Stack", B("full[-\\s]?stack"), 1],
];

// Title words that mark a relevant engineering role — used for the low-signal
// fallback score when an opening exposes only a title (no description).
const ROLE_RX = /\b(software|engineer|developer|sde|swe|backend|back-end|full[- ]?stack|platform|distributed|architect)\b/i;

const MIN_DENOM = 6; // breadth floor so a 1-skill opening can't auto-score 100
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
