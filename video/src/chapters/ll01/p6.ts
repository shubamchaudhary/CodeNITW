import type { Scene } from "../../lib/types.ts";
import { B, sec } from "./h.ts";
import { check } from "./k.ts";

// Part 6: how an embedding is made and written (EMBED_BATCH), and how a
// flagged window is enriched into findings (ENRICH_WINDOW).
export const p6: Scene[] = [
  // ------------------------------------------------------------ 17
  sec("17", "How embeddings are made", "Topic seventeen. One embed batch item, from the moment a lane thread polls it to the moment eighty vectors are in Postgres."),
  {
    kind: "bullets",
    title: "One EMBED_BATCH item, step by step",
    firstItemStep: 1,
    items: [
      { icon: "🧾", text: "1. Ledger check: is this workId already done?", sub: "SELECT from enrich_work_done · if yes: skip, before any API call (a replay costs 0 tokens)" },
      { icon: "📖", text: "2. Read the 80 chunks by chunk_id, cap each at 8,000 chars", sub: "the leading slice retrieves the chunk just as well; the full text stays in Postgres" },
      { icon: "🛰", text: "3. One batchEmbedContents call: gemini-embedding-001", sub: "up to 80 texts per request · outputDimensionality = 768" },
      { icon: "🚦", text: "4. Paced by EmbeddingKeyPool", sub: "per Gemini key: 75 of 100 requests and 24K of 30K tokens per minute · a 429 benches the key 15 s" },
      { icon: "🧷", text: "5. One transaction: marker, then 80 UPDATEs", sub: "UPDATE … SET embedding = ? WHERE chunk_id = ? · then ack" },
    ],
    beats: B(
      "One embed batch item, step by step. Five steps.",
      { say: "One. Check the ledger. Has this work ID already been committed? If yes, skip it, before making any API call. So a full replay of the topic costs zero tokens.", tone: "key" },
      "Two. Read the eighty chunks' text from the session's chunk table, by chunk ID, since the message only carried the fingerprints. And cap each text at eight thousand characters. A window dense with stack traces can be bigger than the model's input limit, and the vector of the leading slice retrieves the chunk just as well. The full text in Postgres is never touched.",
      { say: "Three. One batch embed contents call to Gemini, model gemini embedding oh oh one, with up to eighty texts in one request, and output dimensionality set to seven hundred and sixty eight. The model's default is three thousand and seventy two dimensions, which wouldn't fit the vector column.", term: { word: "Embedding", meaning: "a vector whose distance tracks meaning" } },
      "Four. Paced by a key pool. Per Gemini key, a sliding window allows seventy five of the hundred requests per minute, and twenty four thousand of the thirty thousand tokens, so a call is only sent when it fits. A four two nine benches that key for fifteen seconds and rotates to the next.",
      { say: "Five. One transaction. Insert the work marker, and if it's new, eighty updates: set embedding where chunk ID equals the fingerprint. Then acknowledge.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "Writing the vectors: same rule as ingest",
    lang: "sql",
    code: `BEGIN;
INSERT INTO enrich_work_done (work_id, session_id)
VALUES (:workId, :sessionId)
ON CONFLICT DO NOTHING;                      -- 1 row = first time

-- only if that row was new:
UPDATE log_chunks_s_7f3a
SET    embedding = :vector                   -- vector(768)
WHERE  chunk_id = :fingerprint;              -- × 80
UPDATE sessions SET enriched_windows = enriched_windows + 1
WHERE  id = :sessionId;
COMMIT;                                      -- then ack`,
    highlight: [[2, 4], [6, 9], [10, 11], [12, 12]],
    beats: B(
      { say: "Here's the write. Insert the work ID into enrich work done, on conflict do nothing. One row inserted means first time. The same insert if absent rule as ingest, keyed by the work ID.", tone: "key" },
      "Then the updates. Set the embedding, where chunk ID is the fingerprint. Notice that this update is naturally idempotent: writing the same vector twice leaves the same row.",
      { say: "But the completion counter, enriched windows plus one, is additive. That's why everything sits behind the marker. A redelivered batch loses the marker insert, and writes nothing.", tone: "key" },
      "Commit, then acknowledge. And the H N S W and gin indexes are maintained by Postgres as the rows change. Nothing to rebuild.",
    ),
  },
  {
    kind: "compare",
    title: "When and what to embed: the alternatives",
    cols: [
      { title: "Inside the part transaction", icon: "🧷", tone: "red", items: ["a network call inside a DB transaction", "ingest runs at quota speed", "v1's pool exhaustion, again"] },
      { title: "Lazily, at query time", icon: "⏳", tone: "amber", items: ["the first question waits for 3,000 embeddings", "unembedded chunks can't be found", "unpredictable latency"] },
      { title: "Once, async, every chunk ✓", icon: "🛣", tone: "green", items: ["off the request path and out of ingest", "paced by its own key pool", "written idempotently, behind the marker"] },
    ],
    footer: "and why every chunk, not just flagged ones: questions ask about the minutes around an incident too",
    beats: B(
      "Defend the timing. Embedding inside the part transaction puts a network call inside a database transaction, ties ingest speed to the provider's quota, and repeats version one's pool exhaustion.",
      "Embedding lazily at query time means the first question waits for thousands of embeddings, chunks nobody embedded yet can't be found, and latency becomes unpredictable.",
      { say: "Once, asynchronously, for every chunk. Off the request path, out of ingest, paced by its own key pool, and written idempotently behind the marker.", tone: "key" },
      { say: "And why every chunk, not only the flagged ones? Because questions also ask about the minutes around an incident. What was happening just before the five oh threes started. Those windows weren't flagged, but they have to be searchable.", tone: "key" },
    ),
  },
  check({
    topic: "embeddings",
    q: "A lane thread polls an EMBED_BATCH item whose workId is already in enrich_work_done. What happens?",
    say: "A lane thread polls an embed batch item whose work ID is already in the enrich work done table. What happens?",
    options: ["It re-embeds the batch and overwrites the vectors", "It skips the item before any API call, then acks", "It sends the item to the DLQ", "It waits 60 seconds"],
    answer: 1,
    a: "The ledger check runs first: the item is skipped before any Gemini call, so a redelivery or a full replay costs zero tokens, and the offset is acked.",
    aSay: "B. The ledger check runs first, so it skips the item before making any Gemini call, and acknowledges it. A redelivery, or a full replay, costs zero tokens.",
  }),
  check({
    topic: "embeddings",
    q: "Why is the embedding requested with outputDimensionality = 768?",
    say: "Why is the embedding requested with an output dimensionality of seven hundred and sixty eight?",
    a: "The column is vector(768) and every vector must match it. gemini-embedding-001 defaults to 3,072 dimensions, which wouldn't fit; vectors from different sizes or models aren't comparable anyway.",
    aSay: "Because the column is vector seven sixty eight, and every vector in it has to have the same size. The model's default is three thousand and seventy two dimensions, which wouldn't fit. And vectors from different sizes or models aren't comparable anyway.",
  }),

  // ------------------------------------------------------------ 18
  sec("18", "How enrichment is done", "Topic eighteen. Enrichment. A flagged window goes in. A finding, an explanation with evidence attached by code, comes out."),
  {
    kind: "bullets",
    title: "One ENRICH_WINDOW item, step by step",
    firstItemStep: 1,
    items: [
      { icon: "🧾", text: "1. Ledger check on workId", sub: "already committed? skip before the LLM call" },
      { icon: "📖", text: "2. Read the window and its exact metrics", sub: "metrics labelled \"parser-extracted, authoritative\" · over 5,000 chars: split on record boundaries" },
      { icon: "🤖", text: "3. One Groq call per segment, paced by the lane", sub: "strict JSON: {category, severity, title, explanation, confidence}" },
      { icon: "🔗", text: "4. Code attaches the evidence", sub: "evidence_chunk_ids = the chunk this call was about · never taken from the model" },
      { icon: "🧬", text: "5. Fingerprint the finding, then one transaction", sub: "SHA-256(category + normalised title) · marker first, then the findings upsert" },
    ],
    beats: B(
      "One enrich window item, step by step. Five steps again.",
      "One. The ledger check on the work ID. Already committed? Skip it, before the LLM call.",
      { say: "Two. Read the window's text, and its exact metrics from log metrics. The metrics go into the prompt labelled parser extracted, authoritative. The model is told these numbers are facts, and not to compute its own. And a window over five thousand characters is split on record boundaries, so a stack trace is never cut across two calls.", tone: "key" },
      "Three. One Groq call per segment, paced by the lane, with a system prompt that demands strict JSON. Category, severity, title, explanation, confidence.",
      { say: "Four. Code attaches the evidence. The finding's evidence chunk IDs are set to the chunk this call was about. They're never taken from the model's output, so a hallucinated ID can never enter the evidence chain.", tone: "key" },
      "Five. Fingerprint the finding, then commit it in one transaction, with the marker first.",
    ),
  },
  {
    kind: "code",
    title: "The prompt (EnrichPrompts)",
    lang: "text",
    code: `SYSTEM:
You are a production-log analyst. You receive one time window of
application logs plus the exact metrics a deterministic parser already
extracted from it. Ground every statement in the provided lines and
metrics — never invent request ids, stack frames, or numbers.
Respond with STRICT JSON: one object, or an array of objects:
{ "category", "severity", "title", "explanation", "confidence" }
If the window is unremarkable, return [].

USER:
METRICS (parser-extracted, authoritative):
  API api_5xx count=212 · DATABASE pool_wait p95_ms=4100
LOG WINDOW:
  09:31:02 ERROR [pay] HTTP 503 /checkout ...`,
    highlight: [[1, 5], [6, 8], [11, 12], [13, 14]],
    beats: B(
      "Here's the prompt, shortened. The system part says: you're a production log analyst. You get one window, plus the exact metrics a deterministic parser already extracted. Ground every statement in those lines and metrics, and never invent IDs, stack frames, or numbers.",
      "Then the contract. Strict JSON, one object or an array of objects, with five fields. And an empty array if the window is unremarkable, so the model is allowed to say nothing happened.",
      { say: "The user part starts with the metrics, labelled authoritative. Two hundred and twelve five xx responses, a pool wait p ninety five of four point one seconds.", tone: "key" },
      "And then the window's raw lines.",
    ),
  },
  {
    kind: "custom",
    name: "dlltable",
    props: {
      title: "log_findings: what an explanation becomes",
      name: "log_findings",
      sub: "unique (session_id, fingerprint)",
      cols: [
        { n: "session_id", t: "UUID", k: "PK", note: "Part of the unique key: which investigation." },
        { n: "fingerprint", t: "CHAR(64)", k: "PK", note: "SHA-256 of the category plus the normalised title (lower-cased, digits dropped, whitespace collapsed), so the same recurring problem folds onto one row whatever its counts." },
        { n: "category · severity", t: "TEXT · TEXT", note: "Clamped to the allowed values: e.g. DATABASE · CRITICAL." },
        { n: "title · explanation", t: "TEXT · TEXT", note: "\"Payment DB pool exhausted\" · 1-3 sentences citing the concrete evidence." },
        { n: "evidence_chunk_ids", t: "TEXT[]", note: "Set by code: the chunk fingerprints the call was about. Merged when the finding repeats." },
        { n: "occurrence_count", t: "INTEGER", note: "How many windows produced this finding. Additive, so it only runs behind the work marker." },
        { n: "time_range_start / end", t: "TIMESTAMPTZ", note: "Widened as the finding recurs: when the problem started and stopped." },
      ],
      foot: "the evidence chain, all by code: report → incident → finding → chunk_id → line_start…line_end → raw lines",
    },
    beats: B(
      "And here's what an explanation becomes: a row in log findings.",
      "Session ID, part of the unique key.",
      { say: "The fingerprint, the other part. S H A two fifty six of the category plus the normalised title: lower cased, digits dropped, whitespace collapsed. So pool exhausted, two hundred and twelve times, and pool exhausted, ninety eight times, fold onto the same row. The same recurring problem is one finding, not fifty.", tone: "key" },
      "Category and severity, clamped to the allowed values.",
      "Title and explanation, in the model's words.",
      { say: "Evidence chunk IDs. Set by code, to the chunk fingerprints this call was about, and merged as the finding repeats.", tone: "key" },
      "Occurrence count: how many windows produced this finding. Additive, so it only runs behind the work marker.",
      "And the time range, widened as the finding recurs: when the problem started, and when it stopped.",
      { say: "So the whole evidence chain is built by code. Report, incident, finding, chunk ID, line start to line end, raw lines. No ID in that chain was ever written by a model.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "Committing findings: the same rule, a third time",
    lang: "sql",
    code: `BEGIN;
INSERT INTO enrich_work_done (work_id, session_id) VALUES (?, ?)
ON CONFLICT DO NOTHING;                       -- new? continue. not new? stop.

INSERT INTO log_findings (session_id, fingerprint, category, severity,
       title, explanation, evidence_chunk_ids, time_range_start, ...)
VALUES (...)
ON CONFLICT (session_id, fingerprint) DO UPDATE
SET occurrence_count = log_findings.occurrence_count + 1,
    evidence_chunk_ids = <union of old and new>,
    time_range_end = GREATEST(log_findings.time_range_end, EXCLUDED.time_range_end);
COMMIT;                                       -- then ack`,
    highlight: [[2, 3], [5, 8], [9, 11], [12, 12]],
    beats: B(
      "And the commit. First the work marker. Insert if absent. If the row isn't new, stop: this delivery already happened.",
      "Then the finding, upserted on session and fingerprint.",
      { say: "On conflict, it's a recurrence: occurrence count plus one, the evidence merged, the time range widened. Additive, so it lives behind the marker. Insert if absent, on a deterministic key, and anything additive only runs for what was new. The same rule as ingest, a third time.", tone: "key" },
      "Commit, then acknowledge.",
    ),
  },
  {
    kind: "compare",
    title: "Enrichment: the alternatives",
    cols: [
      { title: "One call for the whole session", icon: "🐘", tone: "red", items: ["doesn't fit any context window", "can't say which minute a claim is about", "nothing to cite"] },
      { title: "Explain every window", icon: "🌊", tone: "amber", items: ["~5× the calls", "mostly \"nothing happened\"", "days of free-tier quota"] },
      { title: "One flagged window per call ✓", icon: "🎯", tone: "green", items: ["the gate picks the windows", "each finding tied to one window by code", "metrics passed in as facts"] },
    ],
    footer: "and never let the model write the evidence ids: code knows which chunk it asked about",
    beats: B(
      "Defend it. One call for the whole session doesn't fit any context window, and even if it did, the model couldn't tell you which minute each claim is about. Nothing to cite.",
      "Explaining every window: about five times the calls, and most answers would be nothing happened.",
      "One flagged window per call. The gate picks the windows, each finding is tied to exactly one window by code, and the exact metrics go in as facts.",
      { say: "And the rule you never break: the model never writes the evidence IDs. Code already knows which chunk it asked about.", tone: "key" },
    ),
  },
  check({
    topic: "enrichment",
    q: "Where do a finding's evidence_chunk_ids come from?",
    say: "Where do a finding's evidence chunk IDs come from?",
    options: ["The model's JSON output", "Code: the chunk(s) the enrichment call was about", "A vector search after the call", "The judge in Graph 1"],
    oSay: ["The model's JSON output", "Code: the chunk or chunks the enrichment call was about", "A vector search after the call", "The judge in Graph one"],
    answer: 1,
    a: "From code. The work item named the chunk; the worker attaches that chunk's fingerprint. The model's JSON has no id field, so a hallucinated id can't enter the evidence chain.",
    aSay: "B. From code. The work item named the chunk, and the worker attaches that chunk's fingerprint. The model's JSON doesn't even have an ID field, so a made up ID can never enter the evidence chain.",
  }),
  check({
    topic: "enrichment",
    q: "Two windows both report \"Payment DB pool exhausted\" with different counts. How many finding rows, and why?",
    say: "Two windows both report: payment DB pool exhausted, with different counts. How many finding rows, and why?",
    a: "One. The fingerprint is SHA-256(category + normalised title), digits dropped, so both map to the same key; the second upsert raises occurrence_count and merges the evidence and time range.",
    aSay: "One row. The fingerprint is the S H A two fifty six of the category and the normalised title, with the digits dropped, so both windows map to the same key. The second upsert raises the occurrence count and merges the evidence and the time range.",
  }),
];
