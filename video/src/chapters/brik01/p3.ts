import type { Scene } from "../../lib/types.ts";
import { B, arch, sec } from "../ll01/h.ts";
import { check } from "./k.ts";
import { AGENTS, AGENTS_STEPS, OBSERVED, OBSERVED_STEPS, PIPELINE, PIPELINE_STEPS } from "./boards.ts";

// Part 3: the observed stack, the inferred pipeline, durable jobs, and the
// government-source agents.
export const p3: Scene[] = [
  // ------------------------------------------------------------ 7
  sec("7", "The observed stack", "Topic seven. The stack, as any visitor's browser sees it. Observed, so it aims our questions, and we never quote it."),
  arch(
    OBSERVED,
    OBSERVED_STEPS,
    B(
      "Here's everything that's visible from the outside. The browser, Firebase Hosting, Firebase Auth, Cloud Storage, a set of serverless API functions, Firestore, Razorpay and PostHog. And one box on the right, the pipeline, that nobody outside can see.",
      "The shell. A single page React app, built with Vite, served by Firebase Hosting from Google's edge. Sign in is Firebase Auth.",
      "Upload. The documents go from the browser into Cloud Storage. PDFs and images, up to fifty megabytes each, whole folders allowed. The API never carries the bytes. Same idea as the presigned upload in DeepLogLens.",
      { say: "Create a job. The browser calls a same origin API function, with its Firebase ID token as a bearer token. The function records a job and returns its id. An asynchronous job, not a twenty minute request.", tone: "key" },
      "Behind that function, the real pipeline runs. None of it is visible from outside. So the next board is inference, and that's exactly where the interview will be.",
      { say: "Live status. The worker updates the job document's stage in Firestore. The browser listens to that one document, and opens the report when it completes. No polling.", term: { word: "onSnapshot", meaning: "a Firestore listener: the client is pushed every change to a document" } },
      "And credits. Organisations share a pool of report credits, bought through Razorpay. Product events, including the latency of each API call, go to PostHog.",
    ),
    "Observed: what a visitor's browser shows",
  ),
  {
    kind: "trap",
    myth: "\"I looked at your JavaScript bundle and your API is …\"",
    truth: "\"From the outside it looks like a lean Firebase / GCP stack.\"",
    why: "never quote endpoint names, regions, bucket names or customer formats: use what you saw only to choose good questions",
    beats: B(
      "Now the trap. Don't say, I looked at your JavaScript bundle and your API is this.",
      { say: "If they ask what you know about their stack, say: from the outside it looks like a lean Firebase and GCP stack. That's all you need.", tone: "key" },
      "Never quote endpoint names, regions, bucket names, or customer formats. Use what you saw only to choose good questions. It's public, but quoting it sounds like reconnaissance, not curiosity.",
    ),
  },
  check({
    topic: "the observed stack",
    q: "Why is a Firestore listener a good fit for a 20-minute job?",
    say: "Why is a Firestore listener a good fit for a twenty minute job?",
    a: "The worker writes stage changes to one document and every open tab is pushed the change in real time, with reconnection built in: no polling, no long-held request.",
    aSay: "Because the worker writes each stage change to one document, and every open tab is pushed that change in real time, with reconnection and offline handling built in. No polling, and no request held open for twenty minutes.",
  }),

  // ------------------------------------------------------------ 8
  sec("8", "The inferred pipeline", "Topic eight. The pipeline the product implies. This is inference, not observation: it's the board you'd draw in the room as, here's how I'd build it."),
  arch(
    PIPELINE,
    PIPELINE_STEPS,
    B(
      "Here's the inferred pipeline. Create job, a queue, split, OCR, classify, extract, the title chain, rules, portal agents, the report, a report store, an outbox, and a human review. Teal boxes are where a model does the work. White boxes are plain code.",
      "Accept. Create the job with an idempotency key, and answer at once. The work goes on a queue: Cloud Tasks for per job pushes with retry and rate control, or Pub Sub for fan out.",
      { say: "Split. Render every page, and hash it. The page is the unit of retry, the unit of parallelism, and the unit of caching. A deed that appears in two files is read once.", tone: "key" },
      "Read. OCR, or a vision model, per page, in parallel. Regional scripts, stamps, handwriting. It's the slow, flaky, expensive step: most of the cost, and most of the time.",
      "Understand. Classify each document: sale deed, encumbrance certificate, record of rights, building plan. Then extract its fields against that type's schema, and every field carries a page reference.",
      { say: "Chain and rules. Code, not a model, joins the deeds into a chain on parties and survey numbers. Then rules apply the state, the lender's policy and the loan type. Exact and explainable.", tone: "key" },
      "Verify. Portal agents fetch revenue records, encumbrance certificates and RERA entries, and reconcile them with the documents. They're slow and unreliable, so they're isolated.",
      "Report. One canonical, versioned JSON, with flags, severity and citations. A human reviews and edits it. Every lender's format is just a rendering of it. And every edit is labelled data for your evals.",
      "Deliver. The ready event is written in the same transaction as the report, then sent to the lender as a signed webhook. Never lost, and the receiver dedupes. That's topic nine.",
    ),
    "Inferred: the pipeline the product implies",
  ),
  {
    kind: "compare",
    title: "Where the model sits, and where code sits",
    cols: [
      { title: "Model", icon: "🧠", tone: "blue", items: ["read pages: scripts, handwriting", "extract fields into a schema", "fuzzy match: name variants, transliteration"] },
      { title: "Code", icon: "⚙️", tone: "green", items: ["join deeds into a chain", "compute search gaps in years", "apply lender policy and state rules"] },
      { title: "Human", icon: "🧑‍⚖️", tone: "amber", items: ["review the draft", "edit and sign the opinion", "edits feed the eval set"] },
    ],
    footer: "the LLM reads; code decides what must be exact; a lawyer signs",
    beats: B(
      "This is the most important design idea on the board. Where does the model sit, and where does code sit? The model reads. Pages in a dozen scripts, handwriting. It extracts fields into a schema. And it resolves fuzzy matches: is Ravi Kumar Gupta the same person as R. K. Gupta, transliterated from Hindi?",
      "Code decides everything that must be exact. Joining deeds into a chain. Computing the gap in the search period, in years. Applying the lender's policy and the state's rules.",
      "And a human reviews the draft, edits it, and signs the opinion. And every edit feeds the evaluation set.",
      { say: "In one line. The LLM reads, code decides what must be exact, and a lawyer signs. It's the same split as DeepLogLens: code counts, the model explains.", tone: "key" },
    ),
  },
  check({
    topic: "the inferred pipeline",
    q: "Why make the page, not the file, the unit of work?",
    options: ["Firestore documents can't hold a whole file", "Retries, parallelism and caching all get cheaper: one bad page is retried alone, pages run in parallel, a repeated deed is read once", "LLMs can only read one page", "It's required by Cloud Tasks"],
    answer: 1,
    a: "A failed page is retried alone, pages run in parallel (TAT = slowest page, not the sum), and a page hash lets a repeated deed be read once.",
    aSay: "B. One bad page is retried alone, instead of the whole file. Pages run in parallel, so the turnaround is the slowest page, not the sum. And a page hash means a deed that shows up in many files is read once.",
  }),

  // ------------------------------------------------------------ 9
  sec("9", "Durable jobs", "Topic nine. Queues, retries, idempotency, the outbox, and signed webhooks. These are words straight from their job description, so let's make each one concrete."),
  {
    kind: "compare",
    title: "Four failures a job pipeline must survive",
    cols: [
      { title: "Double submit", icon: "🖱", tone: "red", items: ["user clicks twice, or the client retries", "→ idempotency key: same job, one credit"] },
      { title: "Flaky calls", icon: "🌩", tone: "amber", items: ["429, 503, timeouts from OCR and LLM", "→ backoff with jitter, cap, dead-letter"] },
      { title: "Redelivery", icon: "🔁", tone: "blue", items: ["the queue delivers at least once", "→ steps keyed by job, page hash, version"] },
      { title: "Lost notify", icon: "📭", tone: "purple", items: ["crash between save and send", "→ outbox in the same transaction"] },
    ],
    footer: "at-least-once delivery, exactly-once effects",
    beats: B(
      "Four failures every job pipeline has to survive. One, the double submit. The user clicks twice, or the client retries after a timeout. The fix is an idempotency key. The second request returns the same job, and charges one credit, not two.",
      "Two, flaky calls. OCR and model APIs return four twenty nines, five oh threes and timeouts. Retry with exponential backoff and jitter, cap the attempts, then dead letter the task.",
      "Three, redelivery. Every queue delivers at least once. So each step's output is keyed by the job, the page hash and the step version. A redelivered task overwrites the same row; it never appends a duplicate.",
      "Four, the lost notification. The worker saves the report, then crashes before telling the lender. The fix is the outbox.",
      { say: "The phrase to use is one you already own from DeepLogLens. At least once delivery, exactly once effects.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "Idempotent job creation (Postgres)",
    lang: "sql",
    code: `CREATE TABLE jobs (
  id          uuid PRIMARY KEY,
  org_id      uuid NOT NULL,
  idem_key    text NOT NULL,
  status      text NOT NULL DEFAULT 'queued',
  UNIQUE (org_id, idem_key)
);

INSERT INTO jobs (id, org_id, idem_key)
VALUES ($1, $2, $3)
ON CONFLICT (org_id, idem_key) DO NOTHING
RETURNING id;   -- no row back? SELECT the existing job`,
    highlight: [null, [6, 6], [9, 12]],
    beats: B(
      "Here's the idempotency key, made concrete, in Postgres. A jobs table.",
      "The key is unique per organisation. That constraint is the whole mechanism.",
      { say: "Insert, on conflict do nothing, returning the id. If a row comes back, it's a new job, so charge the credit and enqueue. If nothing comes back, it's a retry: select the existing job and return it. The database, not the application, decides who wins the race.", tone: "key" },
    ),
  },
  {
    kind: "seq",
    title: "Outbox, then a signed webhook",
    actors: [
      { id: "w", name: "Worker", icon: "⚙️" },
      { id: "d", name: "Database", icon: "🗄" },
      { id: "r", name: "Relay", icon: "📮" },
      { id: "l", name: "Lender LOS", icon: "🏦" },
    ],
    msgs: [
      { from: "w", to: "d", label: "ONE tx: report + outbox row", step: 1, tone: "green" },
      { from: "r", to: "d", label: "read unsent rows", step: 2 },
      { from: "r", to: "l", label: "POST event · HMAC signature", step: 3, tone: "blue" },
      { from: "l", to: "r", label: "200 OK", step: 4, dash: true },
      { from: "r", to: "d", label: "mark sent", step: 5 },
    ],
    note: { step: 6, text: "crash anywhere → the relay resends · receiver dedupes on event id", tone: "green" },
    beats: B(
      "Here's the outbox, as a sequence. Four actors: the worker, the database, a relay, and the lender's loan origination system.",
      { say: "The worker writes the report, and an outbox row saying report completed, in one transaction. Either both exist, or neither does.", tone: "key", term: { word: "Outbox", meaning: "the event row written in the same transaction as the data it announces" } },
      "A relay reads the unsent outbox rows.",
      "And posts each event to the lender, with an HMAC signature over the timestamp and the body.",
      "The lender answers two hundred.",
      "And only then does the relay mark the row sent.",
      { say: "Crash anywhere, and the relay simply sends again. So the receiver must dedupe on the event id. Delivery is at least once; the effect is exactly once.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "Verifying a signed webhook (TypeScript)",
    lang: "ts",
    code: `import { createHmac, timingSafeEqual } from "node:crypto";

export function verify(raw: Buffer, ts: string, sig: string, secret: string) {
  const age = Math.abs(Date.now() / 1000 - Number(ts));
  if (!(age <= 300)) return false;                    // replay window: 5 min
  const mac = createHmac("sha256", secret)
    .update(\`\${ts}.\`).update(raw).digest("hex");      // sign ts + exact bytes
  const a = Buffer.from(mac), b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b); // constant-time compare
}`,
    highlight: [null, [4, 5], [6, 7], [8, 9]],
    beats: B(
      "And here's what the receiving side does with that signature, in TypeScript, their stack.",
      "First, the timestamp. Reject anything older than five minutes. That stops an attacker replaying a captured webhook later.",
      "Then recompute the HMAC with the shared secret, over the timestamp and the exact raw bytes of the body. Not the parsed JSON: re serialising can change the bytes.",
      { say: "And compare in constant time, with timing safe equal, so the comparison doesn't leak how many characters matched. Three lines of defence: freshness, integrity, and a safe compare.", tone: "key" },
    ),
  },
  check({
    topic: "durable jobs",
    q: "The worker saves the report, then crashes before the webhook is sent. What happens?",
    a: "Nothing is lost: the outbox row was committed with the report, so the relay sends it on its next pass; the lender dedupes on the event id.",
    aSay: "Nothing is lost. The outbox row was committed in the same transaction as the report, so the relay finds it on its next pass and sends it. And because delivery is at least once, the lender dedupes on the event id.",
  }),

  // ------------------------------------------------------------ 10
  sec("10", "Government-source agents", "Topic ten. The agents that pull records from government sources. Their job description says: build out our multi agent system and the tools it uses across government sources."),
  arch(
    AGENTS,
    AGENTS_STEPS,
    B(
      "Here's one portal check, as a tool an agent calls. A planner, a rate limiter, a record cache, one connector per portal, an evidence store, and a reconcile step. Teal boxes are model driven. The connectors are plain code.",
      "Plan. The planner reads the extracted documents and decides which portal checks this file needs, based on the state, the document types and the loan type.",
      "Cache first. A record fetched for the same property in the last few hours is reused. Cheaper for you, and kinder to the portal.",
      { say: "Politely. Every portal gets its own token bucket and a small concurrency limit, shared across all workers, in a shared store. One portal's rate limit never blocks another.", tone: "key" },
      "One connector per portal. It replays the portal's session and form steps, parses the HTML into a schema, and keeps the raw page as evidence. A parse failure is an alert, never a silent empty result.",
      "Reconcile. The structured record is compared with the documents. An owner who differs. A charge that's missing from the encumbrance certificate. Each difference becomes a flag, citing the portal page.",
    ),
    "A portal check, as a tool",
  ),
  {
    kind: "compare",
    title: "Four rules for scraping sites that were never built for you",
    cols: [
      { title: "Down", icon: "🛑", tone: "amber", items: ["mark the check pending", "ship the report on time", "retry on a schedule"] },
      { title: "Changed", icon: "🧪", tone: "blue", items: ["validate against a schema", "alert on parse failure", "re-parse from the raw page"] },
      { title: "CAPTCHA", icon: "🔐", tone: "red", items: ["never try to defeat it", "official API or licensed data", "else a human-assisted step"] },
      { title: "Evidence", icon: "📸", tone: "green", items: ["raw response + screenshot", "fetched-at time", "next to the extracted fields"] },
    ],
    footer: "a down portal delays one check, never the whole report",
    beats: B(
      "Four rules for sites that were never built for you. When a portal is down: mark that check pending, ship the report on time with the item marked, and retry on a schedule.",
      "When a layout changes: validate every parse against a schema, alert when it fails, and re parse later from the stored raw page.",
      { say: "CAPTCHAs: never try to defeat them. Prefer an official API, or licensed data where it exists, and a human assisted step otherwise. Say this clearly. It's a trust question for a company whose customers are regulated lenders.", tone: "key" },
      "And evidence. Keep the raw response, a screenshot and the fetch time next to the extracted fields, so a lawyer can see exactly what the portal said.",
      { say: "The principle: a down portal delays one check. Never the whole report.", tone: "key" },
    ),
  },
  check({
    topic: "portal agents",
    q: "A state portal is down for six hours at month-end. What should the customer see?",
    a: "The report on time, with that verification marked pending and retried automatically, not a stuck job.",
    aSay: "The report, on time, with that one verification marked pending, and retried automatically when the portal comes back. Not a job stuck at ninety percent.",
  }),
];
