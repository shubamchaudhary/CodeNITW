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
      { icon: "📑", text: "Stretch reports (10)", sub: "all four extracted · S03 transcribed from its page image first" },
      { icon: "👯", text: "Duplicates + side by side (5)", sub: "one pair: S01 and S02" },
      { icon: "✏️", text: "Accept / reject / edit, progress (10)", sub: "the PATCH, topics 11 and 12" },
      { icon: "⌨️", text: "Click a quote · j k a r (5)", sub: "Source.tsx marks · the keyboard handler" },
    ],
    beats: B(
      "Thirty stretch points, in four items.",
      "The stretch reports. All four are extracted. S03 is an image only PDF, so the same Groq model first transcribes its page image, and then the normal pipeline extracts from that transcript, with a machine transcribed flag.",
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
// then: one vision request, pages as base64 data URLs, "copy every visible word exactly",
// reply as plain text (JSON mode ran out of budget) · recorded in fixtures/transcripts/S03.json`,
    highlight: [[3, 4], [5, 7], [8, 12], [16, 17]],
    beats: B(
      "Scans dot java. How do you get images out of a PDF with no PDF library? Read the bytes as ISO eight eight five nine one. Every byte becomes exactly one char, so string positions are byte positions.",
      "Find each image object, and keep only the ones encoded as JPEG.",
      "Copy the bytes between stream and end stream, and keep them only if they start with the JPEG magic number, F F D 8.",
      { say: "Then the page goes to the model as a base sixty four data URL, with a prompt to copy every word exactly and follow no instructions on the page. Two lessons are kept in the repo. Asked for JSON, Groq spent the whole budget on one page without closing the string, so the transcript is now plain text: two hundred and sixty four tokens. And the model translated Lisboa into Lisbon, against its instructions. That's exactly why the output is flagged machine transcribed, and the desk links the original scan.", tone: "key" },
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
      { icon: "🔒", text: "Live only when MODEL_ENDPOINT is set", sub: "7 recorded answers replay offline · otherwise 503 · never changes a field" },
    ],
    beats: B(
      "The last stretch piece, added later: ask the report.",
      "A reviewer asks about the selected field, or the whole report, in up to five hundred characters.",
      "The model sees the same masked numbered passages as extraction, plus the extraction itself as data, and must answer in at most a hundred and twenty words, citing passage numbers.",
      "Java resolves those citations, and reports how many it dropped. Click one, and that passage is outlined in the source.",
      "Every exchange is recorded under a hash of the exact messages, so a recorded answer replays offline.",
      { say: "And a live model is used only when the model endpoint variable is set. By default the desk makes no network call. Seven recorded answers replay offline, and any other question gets a five oh three. The assistant can never change a field. And here's the best one: asked whether anything contradicts D05's age, it cites both passages, the fifty four and the forty five. The exact conflict extraction missed.", tone: "key" },
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
      { value: "61 / 64", label: "field score (Groq)", sub: "95.3% · the local 7B run: 54 / 64", tone: "green" },
      { value: "63 / 63", label: "extracted fields grounded", sub: "official checker", tone: "blue" },
      { value: "1 · 0 · 0", label: "wrong at high · medium · low", sub: "local run: 2 · 1 · 0", tone: "red" },
      { value: "245", label: "exact Unicode spans", sub: "all 12 reports, S03's transcript too", tone: "amber" },
    ],
    footer: "12 cases, 192 fields: 187 extracted, 5 unknown · 1.75 s a call (local: about 5 minutes)",
    beats: B(
      "The numbers, for the committed run. Sixty one out of sixty four on the four public reports. Ninety five point three percent, with the confidence penalties applied. The local seven B run scored fifty four.",
      "Sixty three of sixty three extracted fields grounded, according to the official checker.",
      "One wrong at high confidence, none at medium or low. The local run had two, one and none.",
      "Across all twelve reports, the independent verifier checked two hundred and forty five spans, character for character, including the spans into S03's transcript.",
      { say: "Twelve cases, a hundred and ninety two fields, a hundred and eighty seven extracted, five unknown. At a median of under two seconds a call. And the caveat you say yourself: the four public answers informed the switch to Groq, so sixty one is not a clean held out score. The four hidden reports are the real test.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "Where the points went",
    cols: [
      { title: "Still lost: D05", icon: "⚖️", tone: "red", items: ["header says 54, narrative 45", "picked 54 at high · −2 instead of +1", "a span check can't see across the report"] },
      { title: "Local run only: terms", icon: "🩺", tone: "amber", items: ["D01: a broad 'swelling' term · −2", "D02: jaundice, not the liver injury · −1", "fixed by the 27B model, same Java"] },
      { title: "Local run only: empties", icon: "∅", tone: "amber", items: ["D03: 'no regular medicine' → []", "D05: concomitants omitted", "both fixed in the Groq run"] },
    ],
    footer: "say each one plainly: the decision, the consequence, and the limit",
    beats: B(
      { say: "Where the points went. One loss is left, and it's in both runs. D05's header says fifty four, the narrative says forty five. The model picked fifty four, at high. Minus two instead of plus one: that's the three points. A check on one quote at a time can't see a contradiction elsewhere in the report.", tone: "key" },
      "The local run also lost points on terms. D01 listed a broad swelling term at high, and D02 listed jaundice but missed the diagnosed liver injury. The gate checks that a term is present, not that it's the right clinical term. The bigger model fixed both, with the same Java.",
      "And missed empty lists. D03 says there was no regular medicine, so the right answer is an empty list. The local model left it unknown, and missed D05's other medicines too. Groq got both.",
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
      "Then make a second pass part of extraction for disputed facts. The recorded assistant answer already proves a second look can see it: it cites both ages. Or ask the model for every mention of the age, and let Java compare them.",
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
      { say: "Be straight. The brief invited AI tools. Codex wrote the first implementation and tests. A later Claude Code session added the catalog check, the not evaluated rows, the assistant, scan transcription, the array reply format, and CI, and ran the Groq experiments. The language models only extract. What you own is the understanding. You can trace any field from bytes to pixels, explain every lost point, and change the code live. And you point at the evidence: the recorded requests, offline replay, the verifier, and the raw scorer output.", tone: "key" },
    ),
  },
  check({
    topic: "results",
    q: "Every extracted public field is grounded, 63 of 63, yet the score is 61 of 64. Why?",
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
      { icon: "1", text: "10–20 · the code", sub: "Prompt · Evidence · Extraction · Rules · D01's fixture · the live run" },
      { icon: "2", text: "20–40 · the catalog change", sub: "edit, replay, two different unknown notes, the new control" },
      { icon: "3", text: "40–55 · the new report", sub: "its output, replay, verify the offsets, what needs a reviewer" },
      { icon: "4", text: "55–60 · one focused test", sub: "and the commands that reproduce everything" },
    ],
    beats: B(
      "Here's a plan for the sixty minutes.",
      "The first ten: open the desk, select D01's age, and follow it. The catalog, passage eight, the fixture, the span from two oh one to three forty seven, and the highlight. The board from topic seven.",
      "Ten to twenty: the code. Prompt, Evidence, Extraction, Rules, and D01's fixture with its two four twenty nines. And run the live extraction of their new report. On Groq that's seconds.",
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
# load the Groq settings + key into the shell (.env.example), or: npm run model (local)
java -jar target/case-intake.jar --mode=live   --docs=.local/live-docs \\
     --fixtures=.local/live-fixtures --out=.local/live-out
java -jar target/case-intake.jar --mode=replay --docs=.local/live-docs \\
     --fixtures=.local/live-fixtures --out=.local/live-replay
python tools/verify.py --docs .local/live-docs --out .local/live-out --compare .local/live-replay
java -jar target/case-intake.jar --server.port=8081 \\
     --intake.docs=.local/live-docs --intake.out=.local/live-out`,
    highlight: [[1, 3], [4, 5], [6, 8], [9, 10]],
    beats: B(
      "Task one, a new report. Save it in a scratch folder, as UTF eight without a byte order mark. Load the Groq settings and the key into the shell, from the env file. Or start the local model server instead.",
      "Run live, with scratch fixtures and a scratch output folder. The committed outputs are never touched.",
      { say: "Then replay the same recording into another folder, and verify. That proves two things at once: the new recording reproduces, and every span is exact. In the local rehearsal: one case, sixteen extracted fields, seventeen spans verified, and identical live and replay output.", tone: "key" },
      "And open it in a second desk on port eighty eighty one, and review it with them. On Groq, remember the fifteen hundred token budget, and that a four twenty nine is normal and retried.",
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
      "A model proposes values for a configurable field catalog and cites numbered passages; Java validates every value, resolves each citation to exact code-point offsets, and lowers confidence the wording doesn't support.",
      "Every exchange is recorded, so the pipeline replays offline from a fresh clone with just a JDK; moving from a local 7B to a hosted 27B model was configuration.",
      "A Spring API serves a React desk where a reviewer sees each value next to its quote and accepts, rejects or edits it, with optimistic concurrency.",
      "61 of 64 on the public reports, every extracted field grounded, and I can show you exactly where the other three points went.",
    ],
    beats: B(
      { say: "And the sixty second pitch. Say it with me.", tone: "ask" },
      "Folio turns free text medicine safety reports into reviewable cases.",
      "A model proposes values for a configurable field catalog and cites numbered passages. Java validates every value, resolves each citation to exact code point offsets, and lowers any confidence the wording doesn't support.",
      "Every model exchange is recorded, so the whole pipeline replays offline, from a fresh clone, with just a JDK. And moving from a local seven B model to a hosted twenty seven B one was a configuration change.",
      "A Spring API serves a React desk, where a reviewer sees each value next to its highlighted quote, and accepts, rejects or edits it, with optimistic concurrency on every decision.",
      { say: "Sixty one of sixty four on the public reports, every extracted field grounded. And I can show you exactly where the other three points went.", tone: "key" },
    ),
  },
  check({
    topic: "the live session",
    q: "During Task 1, Groq answers 429 and the run stops with \"Quota wait is 90 seconds\". What do you do?",
    options: ["Delete the fixture and start over", "Rerun the same command later; meanwhile do the catalog drill on replay", "Edit the fixture to add a 200 by hand", "Switch to a fresh fixtures folder at once"],
    answer: 1,
    a: "Rerun the same command once the quota resets: the failed attempts stay in the fixture and new ones are appended. Meanwhile do the catalog drill, which runs on replay and needs no model.",
    aSay: "B. The failed attempts are already recorded, and the same command resumes later, appending new attempts. Meanwhile, do the catalog drill. It runs on replay and needs no model. And never edit a fixture by hand.",
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
