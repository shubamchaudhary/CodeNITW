import type { Scene } from "../../lib/types.ts";
import { B, sec } from "../ll01/h.ts";
import { check } from "./k.ts";

// Part 5: the stretch items (topic 13), the honest results and the tests
// (topic 14), and the live session: the plan, the two tasks, rapid fire and
// the pitch (topic 15).
export const p5: Scene[] = [
  // ------------------------------------------------------------ 13
  sec("13", "The stretch items: duplicates, scans, and Ask the report", "Topic thirteen. The stretch items. What was done, and exactly how far each one goes."),
  {
    kind: "bullets",
    title: "Thirty stretch points, item by item",
    firstItemStep: 1,
    items: [
      { icon: "📑", text: "Stretch reports (10)", sub: "S01, S02, S04 extracted · S03 image-only: unsupported_format, as allowed" },
      { icon: "👯", text: "Duplicates + side by side (5)", sub: "one pair: S01 and S02" },
      { icon: "✏️", text: "Accept / reject / edit, progress (10)", sub: "the PATCH, topics 11 and 12" },
      { icon: "⌨️", text: "Click a quote · j k a r (5)", sub: "Source.tsx marks · the keyboard handler" },
    ],
    beats: B(
      "Thirty stretch points, in four items.",
      "The stretch reports. S01, S02 and S04 are extracted. S03 is an image only PDF. The code can transcribe it, but no transcript recording is committed, so it's flagged unsupported format with no cases, which the brief explicitly allows.",
      "Duplicates, with a side by side comparison. One pair found: S01 and S02.",
      "Review actions with progress. That's the PATCH you've already seen.",
      "And click a quote to select its field, plus the keyboard. Both covered in topic twelve.",
    ),
  },
  {
    kind: "code",
    title: "Duplicates.reason(): three independent sections must agree",
    lang: "java",
    code: `for (var identity : matches) {
  if (!identity.type().equals("string") || !identity.spec().path("validation").has("pattern"))
    continue;                                               // initials: a string with a pattern
  boolean sameAge = matches.stream()
      .anyMatch(m -> m.section().equals(identity.section()) && m.type().equals("integer"));
  if (!sameAge) continue;                                   // + age, in the same section
  for (var drug : matches) {
    if (drug.section().equals(identity.section()) || !drug.type().equals("string")
        || drug.spec().has("validation")) continue;          // a drug name, another section
    for (var event : matches) {
      if (event.section().equals(identity.section()) || event.section().equals(drug.section())
          || !event.type().equals("string_list")) continue;  // a reaction, a third section
      return Optional.of("Shared " + identity.label() + " (" + identity.value().asText() + "), age, "
          + drug.label() + " (" + drug.value().asText() + ") and "
          + event.label() + " (" + event.value().asText() + ").");
    }
  }
}`,
    highlight: [[1, 3], [4, 6], [7, 9], [10, 12], [13, 15]],
    beats: B(
      "Duplicates dot java. Only single case reports are compared, in pairs, and only extracted values that agree count as matches. Then: an identity. A string field that has a pattern. In this catalog, the initials.",
      "Plus an integer in the same section. The age.",
      "Plus a plain string, with no validation, in a different section. The suspect drug.",
      { say: "Plus a string list in a third section. A reaction. And notice why it must be a third section: concomitant drugs is also a string list, but it lives in the drug section. So a shared co medication can never stand in for a shared reaction.", tone: "key" },
      "And the reason is written out for the reviewer. Shared patient initials E W, age, suspect drug digoxin, and reactions, nausea. All of it reasoned in types and sections. No field ids.",
    ),
  },
  {
    kind: "compare",
    title: "What counts as the same case",
    cols: [
      { title: "S01 + S02", icon: "✅", tone: "green", items: ["initials EW, age 81", "digoxin · nausea", "pharmacist vs physician, different dates"] },
      { title: "S04 + another report", icon: "✗", tone: "red", items: ["shares a drug", "different patient", "no group: correct"] },
      { title: "Chains", icon: "⛓", tone: "amber", items: ["A~B and B~C", "not merged into A~B~C", "could join two different people"] },
    ],
    footer: "Comparison.tsx: both originals side by side, every catalog field, and a 'differences only' filter",
    beats: B(
      "S01 and S02 match: initials E W, age eighty one, digoxin, nausea. One is a pharmacist's report and one a physician's, with different dates. Same patient, same reaction. A duplicate.",
      "S04 shares a drug with another report, but it's a different patient. No group. That's exactly the brief's warning: same drug, same reaction, different people, not a duplicate.",
      "And only direct pairs are reported. If A matches B and B matches C, they're not chained into one group, because that could join two different people.",
      "On the desk, the comparison shows both original reports side by side, every catalog field, and a filter for just the differences.",
    ),
  },
  {
    kind: "code",
    title: "Scans.java: reading an image-only PDF without a PDF library",
    lang: "java",
    code: `/** The JPEG streams of a PDF in file order. Other image encodings are not supported. */
static List<byte[]> jpegPages(byte[] pdf) {
  // ISO-8859-1 maps every byte to one char, so string offsets are byte offsets.
  String raw = new String(pdf, StandardCharsets.ISO_8859_1);
  var images = IMAGE.matcher(raw);                  // << ... /Subtype /Image ... >> stream
  while (images.find()) {
    if (!images.group().contains("/DCTDecode")) continue;           // JPEG only
    int start = images.end();
    int end = raw.indexOf("endstream", start);
    ...
    var jpeg = Arrays.copyOfRange(pdf, start, end);
    if (jpeg.length > 3 && (jpeg[0] & 0xff) == 0xff && (jpeg[1] & 0xff) == 0xd8) pages.add(jpeg);
  }
  return pages;
}
// then: one vision request, pages as base64 data URLs, "copy every visible word exactly"
// recorded in fixtures/transcripts/<id>.json against the PDF's SHA-256 · flag machine_transcribed`,
    highlight: [[3, 4], [5, 7], [8, 12], [16, 17]],
    beats: B(
      "Scans dot java. How do you get images out of a PDF with no PDF library? Read the bytes as ISO eight eight five nine one. Every byte becomes exactly one char, so string positions are byte positions.",
      "Find each image object, and keep only the ones encoded as JPEG.",
      "Copy the bytes between stream and end stream, and keep them only if they start with the JPEG magic number, F F D 8.",
      { say: "Then the pages go to a vision model as base sixty four data URLs, with a prompt to copy every word exactly and follow no instructions on the page. The transcript is recorded against the PDF's hash, becomes the source text, and carries a machine transcribed flag. In this repository no transcript is recorded, so S03 replays as unsupported. A test covers the whole path on a loopback server.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "Ask the report: Assistant.java + AssistantApi.java",
    firstItemStep: 1,
    items: [
      { icon: "❓", text: "About the selected field, or the whole report", sub: "POST /api/documents/{id}/ask · 1 to 500 characters" },
      { icon: "📑", text: "Same masked passages, extraction as data", sub: "answer in ≤ 120 words, with passage IDs" },
      { icon: "🔗", text: "Java resolves the citations", sub: "counts the dropped ones · click to outline the passage" },
      { icon: "📼", text: "Recorded by a hash of the messages", sub: "fixtures/assistant/<doc>/<24 hex>.json · replays offline" },
      { icon: "🔒", text: "Live only when MODEL_ENDPOINT is set", sub: "otherwise 503 · none committed · it never changes a field" },
    ],
    beats: B(
      "The last stretch piece, added later: ask the report.",
      "A reviewer asks about the selected field, or the whole report, in up to five hundred characters.",
      "The model sees the same masked numbered passages as extraction, plus the extraction itself as data, and must answer in at most a hundred and twenty words, citing passage numbers.",
      "Java resolves those citations, and reports how many it dropped. Click one, and that passage is outlined in the source.",
      "Every exchange is recorded under a hash of the exact messages, so a recorded answer replays offline.",
      { say: "And a live model is used only when the model endpoint variable is set. By default the desk makes no network call, and a new question gets a five oh three. No recordings are committed. And the assistant can never change a field. It's a second look, aimed at exactly the error the scorer exposed: does anything contradict this age?", tone: "key" },
    ),
  },
  check({
    topic: "the stretch items",
    q: "S04 and D01 share the suspect drug amoxicillin, but have different initials. Are they a duplicate candidate?",
    options: ["Yes: drug and reaction match", "No: the identity condition (initials, with age) fails", "Yes, at low confidence", "Only if the ages match"],
    answer: 1,
    a: "No. The identity condition fails. Same drug and same reaction in two different people is exactly what the brief says is not a duplicate.",
    aSay: "B. No. The identity condition fails, the initials with the age. Same drug and same reaction in two different people is exactly what the brief says is not a duplicate.",
  }),

  // ------------------------------------------------------------ 14
  sec("14", "Results, failures you can explain, and the tests", "Topic fourteen. The results. Including every point that was lost, and why."),
  {
    kind: "numbers",
    title: "On the four public reports",
    items: [
      { value: "54 / 64", label: "field score", sub: "84.4%, with confidence penalties", tone: "green" },
      { value: "61 / 61", label: "extracted fields grounded", sub: "official checker", tone: "blue" },
      { value: "2 · 1 · 0", label: "wrong at high · medium · low", sub: "two known values withheld", tone: "red" },
      { value: "295", label: "exact Unicode spans", sub: "all 12 reports · tools/verify.py", tone: "amber" },
    ],
    footer: "12 reports, 11 cases, 176 fields: 164 extracted, 12 unknown · model: median 5 min a report, D08 28 min",
    beats: B(
      "The numbers. Fifty four out of sixty four on the four public reports. Eighty four point four percent, with the confidence penalties applied.",
      "Sixty one of sixty one extracted fields grounded, according to the official checker.",
      "Two wrong at high confidence, one at medium, none at low. And two values withheld that the answers had.",
      "Across all twelve reports, the independent verifier checked two hundred and ninety five spans, character for character.",
      "Eleven cases, a hundred and seventy six fields, a hundred and sixty four extracted, twelve unknown. And on the local CPU, a median of about five minutes per report. D08 took twenty eight.",
    ),
  },
  {
    kind: "compare",
    title: "Where the ten points went",
    cols: [
      { title: "Wrong terms", icon: "🩺", tone: "red", items: ["D01: a broad 'swelling' term · −2 high", "D02: jaundice, but not the diagnosed liver injury · −1", "the gate checks presence, not the right term"] },
      { title: "A missed conflict", icon: "⚖️", tone: "red", items: ["D05: header says 54, narrative 45", "picked 54 at high · −2", "a span check can't see across the report"] },
      { title: "Missed empties", icon: "∅", tone: "amber", items: ["D03: 'no regular medicine' → should be []", "D05: concomitants omitted", "unknown scores 0, not −"] },
    ],
    footer: "say each one plainly: the decision, the consequence, and the limit",
    beats: B(
      "And where the ten points went. Wrong terms. D01 listed a broad swelling term, at high: minus two. D02 listed jaundice, but missed the diagnosed liver injury: minus one. The gate checks that a term is present, not that it's the right clinical term. And a diagnosis beats its symptoms was in the prompt; a seven billion parameter model didn't follow it.",
      { say: "A missed conflict. D05's header says fifty four, the narrative says forty five. The model picked fifty four, at high. Minus two. A check on one span can't see a contradiction across the report.", tone: "key" },
      "And missed empty lists. D03 says there was no regular medicine. The right answer is an empty list. The model said nothing, so unknown, zero points. Same for D05's other medicines.",
      "In the room, say each one plainly. The decision, the consequence, and the limit.",
    ),
  },
  {
    kind: "bullets",
    title: "How you'd fix the D05 class of error",
    firstItemStep: 1,
    items: [
      { icon: "🧪", text: "A fresh labelled set", sub: "agreeing ages · conflicting ages · ages of different people" },
      { icon: "🔍", text: "A second-evidence check for disputed facts", sub: "or ask the model for every mention, then compare in Java" },
      { icon: "📏", text: "Measure both directions", sub: "missed conflicts · false conflicts · extra calls per report" },
      { icon: "🚫", text: "Don't tune on the four public answers", sub: "that's evaluation leakage · keep the baseline recordings" },
    ],
    beats: B(
      "How you'd fix that class of error, if they ask.",
      "First, a fresh synthetic set: reports where the ages agree, where they conflict, and where two ages belong to different people.",
      "Then try a second evidence check for disputed facts. Or ask the model for every mention of the age, and let Java compare them.",
      "Measure both directions. Missed conflicts, false conflicts, and the extra calls per report.",
      { say: "And never tune on the four public answers. That's evaluation leakage. Keep the baseline recordings, so the before and after are both replayable.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "Where the tests are (run offline, 2026-11-25)",
    cols: [
      { title: "57 Java tests", icon: "☕", tone: "amber", items: ["ExtractionTest · ReplayTest · CorpusReplayTest", "ProviderTest: attempts, redaction, resume", "ReviewApiTest: routes, 409s, bad edits", "CatalogTest: 32 parameterized cases"] },
      { title: "20 React tests", icon: "⚛️", tone: "teal", items: ["loading, empty, error, case-free", "a PATCH updates progress", "an added field's typed control", "code-point highlights · the assistant"] },
      { title: "CI, with no key", icon: "🔁", tone: "green", items: ["tsc · Vitest · mvnw test · build", "replay.sh + git diff --exit-code out", "verify.py · the official scorer"] },
    ],
    footer: "a matching span proves grounding; only labelled evaluation proves correctness",
    beats: B(
      "The tests. Fifty seven Java tests, all passing offline. Extraction, replay, and a corpus test that rebuilds every committed output. The provider test runs a loopback server to prove attempts are recorded, the key is redacted, and a rerun resumes. The API test covers the routes, both four oh nines, and bad edits. And the catalog test alone is thirty two parameterized cases.",
      "Twenty React tests. Every state, a PATCH updating progress, a field the code has never seen getting its typed control, code point highlights, and the assistant.",
      "And CI runs it all with no key: the type check, both suites, the build, replay followed by a diff that must be empty, the span verifier, and the official scorer.",
      { say: "And the sentence that keeps you honest. A matching span proves grounding. Only labelled evaluation proves correctness.", tone: "key" },
    ),
  },
  {
    kind: "big",
    tone: "interview",
    lead: "The attack",
    text: "\"Did you write this, or did an AI?\"",
    after: "the brief invited AI tools · what you own is the understanding, and the evidence",
    beats: B(
      "The attack you must not dodge. Did you write this, or did an AI?",
      { say: "Be straight. The brief invited AI tools. Codex wrote the first implementation and tests. A later Claude Code session added the catalog check, the not evaluated rows, the assistant, and CI. Qwen only extracts. What you own is the understanding. You can trace any field from bytes to pixels, explain every lost point, and change the code live. And you point at the evidence: the recorded requests, offline replay, the verifier, and the raw scorer output.", tone: "key" },
    ),
  },
  check({
    topic: "results",
    q: "Every extracted public field is grounded, 61 of 61, yet the score is 54 of 64. Why?",
    options: ["The checker is wrong", "Grounding proves the quote exists, not that it supports that value for that patient", "Some offsets were off by one", "Unknown fields count as wrong"],
    answer: 1,
    a: "Grounding proves the quoted text is where we say it is; it doesn't prove it supports the value, so a correctly cited wrong reading (D05's header age) still loses points.",
    aSay: "B. Grounding proves the quoted text is exactly where we say it is. It doesn't prove that text supports that value, for that patient, at that time. D05's header age was correctly cited, and still wrong.",
  }),

  // ------------------------------------------------------------ 15
  sec("15", "The live session: walkthrough, two tasks, the pitch", "Topic fifteen. The live session. Sixty minutes: the walkthrough, then a new report, and a catalog change."),
  {
    kind: "bullets",
    title: "A 60-minute plan",
    firstItemStep: 1,
    items: [
      { icon: "0", text: "0–10 · one field, end to end", sub: "D01's age: catalog → passage 8 → fixture → [201, 347) → the desk" },
      { icon: "1", text: "10–20 · the code", sub: "Prompt · Evidence · Extraction · Rules · a fixture · start the live run" },
      { icon: "2", text: "20–40 · the catalog change", sub: "edit, replay, two different unknown notes, the new control" },
      { icon: "3", text: "40–55 · the new report", sub: "its output, replay, verify the offsets, what needs a reviewer" },
      { icon: "4", text: "55–60 · one focused test", sub: "and the commands that reproduce everything" },
    ],
    beats: B(
      "Here's a plan for the sixty minutes.",
      "The first ten: open the desk, select D01's age, and follow it. The catalog, passage eight, the fixture, the span from two oh one to three forty seven, and the highlight. The board from topic seven.",
      "Ten to twenty: the code. Prompt, Evidence, Extraction, Rules, one fixture. And start the live extraction of their new report early, because on a CPU it takes minutes.",
      "Twenty to forty: the catalog change. Edit, replay, show the two different unknown notes, and use the new control.",
      "Forty to fifty five: the new report's output. Replay it, verify the offsets, and say which values need a reviewer.",
      "And the last five minutes: run one focused test, and show the commands that reproduce everything.",
    ),
  },
  {
    kind: "code",
    title: "Task 1: a new report, in scratch folders",
    lang: "bash",
    code: `New-Item -ItemType Directory -Force .local/live-docs | Out-Null
# save their report as .local/live-docs/LIVE01.txt  (UTF-8, no BOM)
npm run model        # own terminal: llama-server on 127.0.0.1:8931
java -jar target/case-intake.jar --mode=live   --docs=.local/live-docs \\
     --fixtures=.local/live-fixtures --out=.local/live-out
java -jar target/case-intake.jar --mode=replay --docs=.local/live-docs \\
     --fixtures=.local/live-fixtures --out=.local/live-replay
python tools/verify.py --docs .local/live-docs --out .local/live-out --compare .local/live-replay
java -jar target/case-intake.jar --server.port=8081 \\
     --intake.docs=.local/live-docs --intake.out=.local/live-out`,
    highlight: [[1, 3], [4, 5], [6, 8], [9, 10]],
    beats: B(
      "Task one, a new report. Save it in a scratch folder, as UTF eight without a byte order mark, and start the model server in its own terminal.",
      "Run live, with scratch fixtures and a scratch output folder. The committed outputs are never touched.",
      { say: "Then replay the same recording into another folder, and verify. That proves two things at once: the new recording reproduces, and every span is exact. In rehearsal: one case, sixteen extracted fields, seventeen spans verified, and identical live and replay output.", tone: "key" },
      "And open it in a second desk on port eighty eighty one, and review it with them. With a hosted key instead, set the four model variables, and on Groq's free tier, a smaller token budget.",
    ),
  },
  {
    kind: "bullets",
    title: "Task 2: a catalog change",
    firstItemStep: 1,
    items: [
      { icon: "📝", text: "Edit a copy of the catalog", sub: "or python tools/catalog_drill.py" },
      { icon: "📼", text: "Replay with --catalog and --out", sub: "no model, seconds not minutes" },
      { icon: "🖥", text: "A desk with --intake.catalog and --intake.out", sub: "the new control, from the type" },
      { icon: "🗒", text: "Read the notes aloud", sub: "'not in the recording' vs 'outside the catalog range'" },
      { icon: "📡", text: "Say how to fill it", sub: "a live run with a fresh fixtures folder" },
    ],
    beats: B(
      "Task two, a catalog change. They'll add a field, or change a rule.",
      "Edit a copy of the catalog, or run the drill script.",
      "Replay with that catalog into a scratch folder. No model needed, so it takes seconds.",
      "Start a desk on the scratch catalog. The new field appears with the right control, because the control comes from its type.",
      "Read the two notes aloud. Not in the recording, for the new field. Outside the catalog range, for a value that broke a tightened rule. And save a typed decision through the PATCH.",
      { say: "And say how to fill the new field: a live run, with a fresh fixtures folder. If they break the catalog on purpose, CatalogCheck names the field.", tone: "key" },
    ),
  },
  {
    kind: "drill",
    items: [
      { q: "Who assigns offsets?", a: "Java. The model returns passage IDs" },
      { q: "Offset unit?", a: "Unicode code points · React uses Array.from" },
      { q: "Where is a field defined?", a: "only in field_catalog.json" },
      { q: "What makes replay trustworthy?", a: "source SHA-256 + recorded passages + a final 200 + the same Java" },
      { q: "A 429?", a: "3 attempts · Retry-After · over 60 s: stop and resume" },
      { q: "When does high become medium?", a: "the cited words don't literally contain the value" },
      { q: "What does the repair never do?", a: "fill a field the first reading withheld" },
      { q: "The review revision?", a: "SHA-256 of text + extraction + catalog" },
      { q: "The two 409s?", a: "a stale revision · a stale previous decision" },
      { q: "The duplicate rule?", a: "identity + age · a drug in another section · a reaction in a third" },
    ],
    beats: B(
      { say: "Rapid fire. Who assigns the offsets?", hold: 3 },
      "Java. The model only returns passage numbers.",
      { say: "In what unit?", hold: 3 },
      "Unicode code points. React uses array from.",
      { say: "Where is a field defined?", hold: 3 },
      "Only in the catalog file.",
      { say: "What makes replay trustworthy?", hold: 3 },
      "The source hash, the recorded passages, a final two hundred, and the same Java code.",
      { say: "A four twenty nine?", hold: 3 },
      "Three attempts, Retry After, and over sixty seconds it stops, and resumes later.",
      { say: "When does high become medium?", hold: 3 },
      "When the cited words don't literally contain the value.",
      { say: "What does the repair never do?", hold: 3 },
      "Fill a field the first reading withheld.",
      { say: "What's the review revision?", hold: 3 },
      "A hash of the text, the extraction and the catalog.",
      { say: "The two four oh nines?", hold: 3 },
      "A stale revision, and a stale previous decision.",
      { say: "And the duplicate rule?", hold: 3 },
      "Identity plus age, a drug in another section, and a reaction in a third.",
    ),
  },
  {
    kind: "sayit",
    q: "The 60-second pitch",
    lines: [
      "Folio turns free-text medicine-safety reports into reviewable cases.",
      "A local model proposes values for a configurable field catalog and cites numbered passages; Java validates every value, resolves each citation to exact code-point offsets, and lowers confidence the wording doesn't support.",
      "Every model exchange is recorded, so the whole pipeline replays offline from a fresh clone with just a JDK.",
      "A Spring API serves a React desk where a reviewer sees each value next to its quote and accepts, rejects or edits it, with optimistic concurrency.",
      "54 of 64 on the public reports, every extracted field grounded, and I can show you exactly where the other ten points went.",
    ],
    beats: B(
      { say: "And the sixty second pitch. Say it with me.", tone: "ask" },
      "Folio turns free text medicine safety reports into reviewable cases.",
      "A local model proposes values for a configurable field catalog and cites numbered passages. Java validates every value, resolves each citation to exact code point offsets, and lowers any confidence the wording doesn't support.",
      "Every model exchange is recorded, so the whole pipeline replays offline, from a fresh clone, with just a JDK.",
      "A Spring API serves a React desk, where a reviewer sees each value next to its highlighted quote, and accepts, rejects or edits it, with optimistic concurrency on every decision.",
      { say: "Fifty four of sixty four on the public reports, every extracted field grounded. And I can show you exactly where the other ten points went.", tone: "key" },
    ),
  },
  check({
    topic: "the live session",
    q: "Mid-session, the new report's live call is still running after five minutes. What do you do?",
    options: ["Restart it with a shorter timeout", "Keep going with replay work (the catalog drill, evidence on the desk), then come back to it", "Switch to a hosted provider mid-run", "Edit the fixture by hand"],
    answer: 1,
    a: "Keep going with something that doesn't need it: the catalog drill on replay, or evidence navigation. The CPU takes minutes per report (median about 5, D08 about 28). Then replay, verify and review when it finishes.",
    aSay: "B. Keep going with something that doesn't need it. The catalog drill runs on replay, and the desk works on the committed outputs. The CPU takes minutes per report, median about five. When it finishes, replay, verify and review. And never edit a fixture by hand.",
  }),
  {
    kind: "big",
    tone: "idea",
    lead: "Leave with this",
    text: "The model proposes. Java decides what survives. A human makes the final call.",
    after: "and every step is recorded, replayable, and explainable from the code",
    beats: B(
      { say: "So, one last time. The model proposes. Java decides what survives, against the catalog and the exact text. And a human makes the final call.", tone: "key" },
      "And every step is recorded, replayable, and explainable from the code. Open the repository, trace one field, and you're ready for the room.",
    ),
  },
];
