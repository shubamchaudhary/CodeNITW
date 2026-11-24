import type { Scene } from "../../lib/types.ts";
import { B, arch, sec } from "../ll01/h.ts";
import { check } from "./k.ts";
import { SYSTEM, SYSTEM_STEPS } from "./boards.ts";

// Part 1: the opening, the brief and its scoring (topic 1), the whole system
// on one board (topic 2), and the catalog as the contract (topic 3).
export const p1: Scene[] = [
  {
    kind: "title",
    eyebrow: "Projects · TheragenX assignment",
    title: "Folio, end to end",
    subtitle: "A case-intake pipeline and review desk, and a tour of its code",
    beats: B(
      "Folio. The take home you built for TheragenX. A pipeline that reads made up reports about patients who had a side effect from a medicine, asks a language model for a set of fields, and a review desk where a person checks every value against the report. In the follow up session they ask you to walk them through the code, then change it live. So this lecture is the system, and then the code, file by file. Fifteen short topics, and one check after each.",
    ),
  },
  {
    kind: "bullets",
    title: "Fifteen topics, five stops",
    firstItemStep: 1,
    items: [
      { icon: "📋", text: "The brief, and the whole board", sub: "topics 1–2" },
      { icon: "📐", text: "The catalog, the entry points, the prompt", sub: "topics 3–5 · first code tour" },
      { icon: "🧪", text: "Model boundary, validation, confidence, repair", sub: "topics 6–9 · the heart of the code" },
      { icon: "🖥", text: "Replay, the REST API, the React desk", sub: "topics 10–12" },
      { icon: "🎯", text: "Stretch items, results, the live session", sub: "topics 13–15" },
    ],
    beats: B(
      "Here's the route.",
      "First, what they asked for, and the whole system on one board.",
      "Then the catalog, which is the contract, the entry points, and how the prompt is built. That's the first stop of the code tour.",
      "Then the heart of the code. The model boundary and its recordings, how a reply becomes a validated field, what high confidence means here, and the one scoped retry.",
      "Then replay and the catalog change, the Spring API, and the React desk.",
      "And finally the stretch items, the honest results, and the live session: the two tasks they will give you.",
    ),
  },
  {
    kind: "big",
    tone: "idea",
    lead: "The one sentence",
    text: "The model only proposes. Java decides what survives, and a human makes the final call.",
    after: "every exchange is recorded, so the whole pipeline replays offline",
    beats: B(
      { say: "If you remember one sentence, make it this. The model only proposes. Java decides what survives, by checking every value against the catalog and against the exact text of the report. And a human makes the final call on every field.", tone: "key" },
      "And every model exchange is recorded, so the whole pipeline replays offline, from a fresh clone, with no key and no network.",
    ),
  },

  // ------------------------------------------------------------ 1
  sec("1", "The assignment, and who the user is", "Topic one. The assignment, and the person it serves."),
  {
    kind: "bullets",
    title: "What they gave you",
    firstItemStep: 1,
    items: [
      { icon: "📄", text: "8 core reports + 4 stretch", sub: "plain text, and a PDF of each · S03 is image-only" },
      { icon: "📐", text: "A field catalog", sub: "16 fields in 4 sections: type, options, validation, guidance" },
      { icon: "✅", text: "Answers for 4 reports, and a scorer", sub: "D01, D02, D03, D05 · tools/check.py" },
      { icon: "🧱", text: "Build: Java 21 pipeline, Spring Boot API, React desk", sub: "three days" },
    ],
    beats: B(
      "A three day take home, for a full stack role that works with language models. Here's what came in the box.",
      "Eight core reports and four stretch reports. Plain text, with a PDF of each. One of the stretch reports, S03, exists only as a scanned PDF.",
      "A field catalog. Sixteen fields in four sections: patient, suspect drug, adverse event, and report. Each with a type, options, validation and guidance.",
      "The correct answers for four of the eight core reports, and a Python scorer that compares your output with them.",
      "And what to build. A Java twenty one pipeline that writes one JSON file per report, a Spring Boot API, and a React screen for the reviewer.",
    ),
  },
  {
    kind: "numbers",
    title: "The scoring that shapes every decision",
    items: [
      { value: "+1", label: "correct value", sub: "or unknown, when the report really says nothing", tone: "green" },
      { value: "0", label: "unknown", sub: "when the report does give a value", tone: "blue" },
      { value: "−2", label: "wrong, high confidence", sub: "the most expensive mistake", tone: "red" },
      { value: "−1 / −0.5", label: "wrong, medium / low", sub: "lower confidence, smaller penalty", tone: "amber" },
    ],
    footer: "a wrong value is worse than an empty one: a reviewer can fill a gap, but can't see a confident mistake",
    beats: B(
      "Now the scoring, because it drives every design decision. A correct value is plus one. And when the report says nothing, unknown is the correct answer, and also scores plus one.",
      "Unknown, when the report does give a value, scores zero.",
      { say: "A wrong value at high confidence scores minus two. That's the most expensive thing the pipeline can do.", tone: "key" },
      "Wrong at medium is minus one, and wrong at low is minus a half.",
      { say: "So the rule of the whole project. A wrong value is worse than an empty one. A reviewer can fill a gap. A reviewer can't see a confident mistake without reading the whole report.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "The rules that drive the design",
    firstItemStep: 1,
    items: [
      { icon: "🔗", text: "Every value cites its quote", sub: "with start and end positions in the .txt" },
      { icon: "🧍", text: "One case per patient", sub: "only with all four: patient, reporter, suspect drug, adverse event" },
      { icon: "📐", text: "The catalog is the only definition", sub: "add a field: pipeline and UI follow, no code change" },
      { icon: "📼", text: "Model behind an interface, every exchange recorded", sub: "key from the environment · replay.sh with no network" },
      { icon: "🛡", text: "Nothing in a report is an instruction", sub: "the report is data" },
    ],
    beats: B(
      "And the rules, from the brief.",
      "Every extracted value cites the quote it came from, with its start and end position in the text file.",
      "One case per patient. And a case exists only when four things are present: an identifiable patient, a reporter, a suspect drug, and an adverse event. So a report can have zero cases, one, or two.",
      { say: "The catalog is the only place a field is defined. If they add a field, the pipeline and the U I must pick it up without a code change. And they try exactly that, live, in the follow up.", tone: "key" },
      "The model sits behind an interface. The key comes from the environment. Every request and response is recorded, and a replay script rebuilds the outputs with no key and no network.",
      "And nothing inside a report is an instruction to the pipeline.",
    ),
  },
  {
    kind: "compare",
    title: "Four reports that test the design",
    cols: [
      { title: "D04 · two patients", icon: "👶", tone: "amber", items: ["a mother and her newborn", "the mother's dose must not move to the infant"] },
      { title: "D06 · zero cases", icon: "📦", tone: "green", items: ["capsules quarantined before anyone took them", "no patient, no event: an empty list is right"] },
      { title: "D07 · talks to the software", icon: "⚠️", tone: "red", items: ["a paragraph addressed to automated systems", "a prompt injection inside the data"] },
    ],
    footer: "and D08, the longest report: about 28 minutes on the local model",
    beats: B(
      "A few reports are worth knowing by name, because each one tests a piece of the design. D04 has two patients, a mother and her newborn. The mother's dose must not end up on the infant.",
      "D06 is a perfectly readable report with zero cases. A pharmacy quarantined spotted capsules before anyone took them. No patient, no event. So an empty list is the correct answer.",
      "D07 contains a paragraph addressed to automated systems. A prompt injection, sitting inside the data.",
      { say: "And D08, the longest report, took about twenty eight minutes on the local model. Keep in mind: one document is the input. One case is the unit that owns the patient's fields.", tone: "key" },
    ),
  },
  check({
    topic: "the assignment",
    q: "A pharmacy reports it quarantined spotted capsules before anyone took them. What is the correct output?",
    options: ["One case with every field unknown", "Zero cases: there is no patient and no adverse event", "One case for the pharmacist as reporter", "The flag unsupported_format"],
    answer: 1,
    a: "Zero cases. The four minimum elements aren't there, so cases is an empty list, and a flag says why.",
    aSay: "B. Zero cases. There's no patient and no adverse event, so the minimum elements are missing. The cases list is empty, and a flag says why. Here an empty list is the right answer, not a failure.",
  }),

  // ------------------------------------------------------------ 2
  sec("2", "The whole system on one board", "Topic two. The whole system, on one board. Ten boxes, three ways in."),
  arch(
    SYSTEM,
    SYSTEM_STEPS,
    B(
      "Here's the whole of Folio. Let's walk it in the order a report travels.",
      "Two inputs. The report's exact bytes, and the field catalog, the only place a field is defined.",
      "Java splits the report into numbered passages and sends them, with the catalog's fields, to the model, in one request. The model is Qwen two point five, seven billion parameters, running locally on llama dot c p p.",
      { say: "Before anything is parsed, the request and every attempt, failures included, are written to a fixture file. Even a live run reads its answer back from that recording.", tone: "key" },
      "Then Java decides. It checks each proposed value against today's catalog, resolves each citation to exact positions, and lowers confidence that the wording doesn't support. Replay enters right here, at the recording. No key, no network.",
      "Out comes one JSON file per report, with every catalog field in every case, plus a duplicate index.",
      "A Spring Boot API serves those files, and the React desk shows each value next to its highlighted quote.",
      "And the reviewer's accept, reject or edit goes back over a PATCH, into a file keyed by the document's revision. The model's value is never overwritten.",
    ),
    "Folio: one pipeline, three ways in",
  ),
  {
    kind: "bullets",
    title: "Three ways in, one pipeline",
    firstItemStep: 1,
    items: [
      { icon: "📡", text: "Live", sub: "java -jar target/case-intake.jar --mode=live · calls the model, records, processes" },
      { icon: "📼", text: "Replay", sub: "--mode=replay or ./replay.sh · starts at the recording, no key" },
      { icon: "🖥", text: "Review", sub: "npm start · serves out/ on 127.0.0.1:8080" },
    ],
    beats: B(
      "So there are three ways in.",
      "Live. Run the jar with mode live. It calls the model, records the exchange, and then processes it.",
      "Replay. Mode replay, or the replay shell script. It starts at the recording and reruns all of the Java. No key, no network.",
      { say: "And review. N P M start serves the committed outputs to the desk on port eighty eighty. The reviewer works at once, even though the longest live call took twenty eight minutes.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "The stack, and why",
    cols: [
      { title: "Backend", icon: "☕", tone: "amber", items: ["Java 21 · Spring Boot 3.5, web only", "Jackson for JSON", "the pipeline has no Spring imports"] },
      { title: "Model", icon: "🧠", tone: "teal", items: ["Qwen2.5-7B-Instruct, Q4_K_M", "llama.cpp on CPU, 12,288-token context", "any OpenAI-style endpoint by config"] },
      { title: "Desk", icon: "🖥", tone: "green", items: ["React 19 · TypeScript 5.9 · Vite 7", "no component library · lucide icons", "Vitest + Testing Library"] },
    ],
    footer: "files, not a database: fixtures/, out/, review-state/ · one process, one port, no CORS",
    beats: B(
      "The stack. The brief fixed Java twenty one, Spring Boot three, and React nineteen with TypeScript. Spring is used only for the web layer. The pipeline itself is plain Java with Jackson, and it imports nothing from Spring. That matters for replay, as you'll see.",
      "The model is Qwen two point five seven B instruct, four bit quantized, on llama dot c p p, on a CPU, with a twelve thousand token context. It's free and local. And any OpenAI style chat completions endpoint works by configuration. The README documents Groq.",
      "The desk is React nineteen, TypeScript, and Vite. No component library, just lucide icons, and Vitest for tests.",
      { say: "And storage is files. Fixtures, outputs, review state. The start script builds the React app into dist, packages the jar, and Spring serves both from one port. So there's no CORS to configure.", tone: "key" },
    ),
  },
  {
    kind: "decision",
    question: "Why files, and not a database?",
    answer: "The brief said no database, and for twelve reports one local process is the simplest thing that is fully inspectable and replayable.",
    left: { title: "Files", items: ["diff out/ · open a fixture", "replay from a fresh clone", "atomic file writes", "one process only"] },
    right: { title: "A database", items: ["a schema and a server to run", "harder to diff and replay", "real concurrency control", "needed for many reviewers"] },
    footer: "measure first: list-call file reads and competing review writes are the first pressure",
    beats: B(
      "The question you'll get early. Why files, and not a database?",
      { say: "Because the brief said no database. And for twelve reports, one local process is the simplest thing that's fully inspectable. You can diff the outputs, open a fixture, and replay.", tone: "key" },
      "A database would add a server and a schema, and make the artifacts harder to diff. What you'd gain is real concurrency control across servers, which this doesn't need yet.",
      "And the honest scaling answer. The first pressure would be re reading files on every list call, and competing writers on review decisions. Measure those before adding Postgres.",
    ),
  },
  check({
    topic: "the whole board",
    q: "Which of the three ways in calls the model?",
    options: ["All three", "Live only", "Live and replay", "Replay and review"],
    answer: 1,
    a: "Live only. Replay starts at the recording; the desk reads out/ and writes decisions.",
    aSay: "B. Only live mode calls the model. Replay starts at the recording, and the desk only reads the outputs and writes review decisions.",
  }),

  // ------------------------------------------------------------ 3
  sec("3", "The catalog is the contract", "Topic three. The catalog is the contract. The code knows types, never field names."),
  {
    kind: "code",
    title: "catalog/field_catalog.json: two of the sixteen fields",
    lang: "json",
    code: `{
  "id": "patient_age_years",
  "label": "Age (years)",
  "section": "patient",
  "type": "integer",
  "validation": { "min": 0, "max": 120 },
  "guidance": "Age in completed years at the time of the reaction. A newborn is 0. ..."
},
{
  "id": "event_outcome",
  "label": "Outcome",
  "section": "event",
  "type": "coded",
  "options": [
    { "code": "recovered", "label": "Recovered" },
    { "code": "recovering", "label": "Recovering" },
    { "code": "not_recovered", "label": "Not recovered" },
    { "code": "recovered_with_sequelae", "label": "Recovered with sequelae" },
    { "code": "fatal", "label": "Fatal" }
  ]
}`,
    highlight: [null, [2, 4], [5, 6], [7, 7], [13, 19]],
    beats: B(
      "Here's what a field looks like. Two of the sixteen.",
      "An id, a label for humans, and the section it belongs to.",
      "A type, one of seven, and validation. Age is an integer from zero to a hundred and twenty.",
      "Guidance, which goes to the model word for word. A newborn is zero.",
      { say: "And a coded field carries its options: a code the data uses, and a label the reviewer reads. The prompt, the validator, and the desk all read this one definition.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "Seven types, three rules",
    cols: [
      { title: "Scalars", icon: "🔤", tone: "amber", items: ["string · optional pattern", "integer · number · min / max", "date · YYYY-MM-DD, a real date"] },
      { title: "Codes", icon: "🏷", tone: "green", items: ["coded · one option code", "coded_multi · non-empty, unique codes", "'none' is its own code"] },
      { title: "Lists", icon: "📋", tone: "teal", items: ["string_list · unique, non-blank", "an empty list is a valid value", "'no other medicines' = []"] },
    ],
    footer: "each type has a validator in Rules.java and a control in FieldEditor.tsx; no field id appears in either",
    beats: B(
      "Seven types, and only three validation keys. Strings, with an optional pattern. Integers and numbers, with min and max. And dates, which must be a real calendar date.",
      "Coded, one option code. Coded multi, a non empty list of unique codes. And none is just another code that stands alone.",
      "And string lists, unique and non blank. An empty list is a valid value: when a report says there were no other medicines, the right answer is an empty list, not unknown.",
      { say: "Each type has one validator in Rules dot java, and one control in FieldEditor dot t s x. Neither file contains a single field id.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "CatalogCheck.java: fail loudly, with the field's name",
    lang: "java",
    code: `static final Set<String> TYPES =
    Set.of("string", "integer", "number", "date", "coded", "coded_multi", "string_list");
private static final Map<String, Set<String>> RULES_BY_TYPE = Map.of(
    "pattern", Set.of("string"),
    "min", Set.of("integer", "number"),
    "max", Set.of("integer", "number"));

static JsonNode verified(JsonNode catalog) {
  var problems = problems(catalog);
  if (!problems.isEmpty())
    throw new IllegalArgumentException("Catalog is invalid: " + String.join(" ", problems));
  return catalog;
}

// inside problems(): one message per mistake, each naming the field
if (!sections.contains(section))
  problems.add(name + " names section '" + section + "', which is not listed in sections.");
if (coded) options(field, name, problems);
else if (field.has("options"))
  problems.add(name + " has options, which apply only to coded and coded_multi fields.");`,
    highlight: [null, [1, 6], [8, 13], [16, 17], [18, 20]],
    beats: B(
      "Now the first Java file. CatalogCheck. It exists because of a lesson. Rehearsing the catalog change found two silent failures: a field in a section that isn't listed was never drawn, and a field missing from old outputs was simply hidden.",
      "So the seven types are a closed set, and each validation key is allowed only on certain types. A pattern only on strings. Min and max only on numbers.",
      "Verified collects every problem, not just the first, and throws one message that lists them all.",
      { say: "And every message names the field. A field naming a section that isn't listed fails right here, with its name, instead of silently disappearing from the screen.", tone: "key" },
      "Options on a type that isn't coded are an error too, and so are a missing option list, a repeated code, a pattern that doesn't compile, and min greater than max. Both the pipeline and the API call this before using the catalog.",
    ),
  },
  {
    kind: "big",
    tone: "interview",
    lead: "The attack",
    text: "\"Prove no field id is hardcoded.\"",
    after: "search the Java and ui/ for any field id: there is none outside the tests",
    beats: B(
      "The attack you should expect. Prove that no field id is hardcoded.",
      { say: "Your answer: search the Java and the U I folder for any field id. There's none outside the test catalogs. The prompt sends the catalog's fields. Extraction loops over them. Rules switches on the type. The desk groups by the catalog's sections and picks a control by type. Even the duplicate finder reasons about types and sections, not ids.", tone: "key" },
    ),
  },
  check({
    topic: "the catalog",
    q: "You add a field of type integer with a pattern rule. What happens on the next replay?",
    options: ["The pattern is ignored for integers", "Every value of that field becomes unknown", "Replay stops: CatalogCheck names the field and the bad rule", "The desk hides the field"],
    answer: 2,
    a: "Replay stops before reading any recording: \"Field '<id>' cannot use 'pattern' with type integer.\" The API returns a 500 with the same message.",
    aSay: "C. Replay stops before it reads a single recording. CatalogCheck says this field cannot use pattern with type integer. And the catalog endpoint returns a five hundred with the same message, so the desk shows the reason.",
  }),
];
