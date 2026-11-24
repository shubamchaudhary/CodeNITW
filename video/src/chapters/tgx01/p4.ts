import type { Scene } from "../../lib/types.ts";
import { B, sec } from "../ll01/h.ts";
import { check } from "./k.ts";

// Part 4: the scoped repair for a malformed patient (topic 9), replay and the
// live catalog change (topic 10), the Spring review API with its two 409s
// (topic 11), and the React desk (topic 12).
export const p4: Scene[] = [
  // ------------------------------------------------------------ 9
  sec("9", "Repair: one scoped retry for a malformed patient", "Topic nine. The repair. One focused retry, for one patient, and a merge that refuses to guess."),
  {
    kind: "compare",
    title: "D04: the infant's fields came back as bare values",
    cols: [
      { title: "Drop them", icon: "🗑", tone: "red", items: ["valid JSON, but no citations", "the infant's fields all unknown", "a real patient lost"] },
      { title: "Accept the follow-up whole", icon: "⚠️", tone: "amber", items: ["the second call cites passages", "but proposes the mother's regimen", "the infant inherits a dose"] },
      { title: "Scoped retry + careful merge", icon: "✅", tone: "green", items: ["ask again for this patient only", "repair only what was proposed", "disagreement → unknown"] },
    ],
    footer: "the infant's diagnosis survived with its sentence; dose, route and start date stayed withheld",
    beats: B(
      "D04 again. The mother and her newborn. The model returned the infant's fields as bare values, like route colon oral, instead of objects with a confidence and quotes. Drop them, and you lose a real patient.",
      "Ask again and accept everything? The follow up does cite passages. But it also proposed the mother's regimen for the infant. The infant would inherit a dose it never received.",
      { say: "So: one scoped retry for that patient, and a merge that repairs only what the first reading actually proposed. If the two readings disagree, the answer is unknown.", tone: "key" },
      "The result. The infant's diagnosis, neonatal adaptation syndrome, survived, linked to the sentence that names it. The dose, route and start date stayed withheld.",
    ),
  },
  {
    kind: "code",
    title: "CaseRepair.apply(): when, and how",
    lang: "java",
    code: `for (int i = 0; i < cases.size(); i++) {
  var patient = cases.get(i);
  if (!(patient.path("fields") instanceof ObjectNode fields)) continue;
  boolean malformed = StreamSupport.stream(fields.spliterator(), false)
      .anyMatch(f -> !f.isObject() && !f.isNull());
  if (!malformed) continue;
  var selector = new LanguageModel.Selector(i, patient.path("label").asText("Patient " + (i + 1)));
  var file = fixtures.resolve("repairs").resolve(id).resolve("case-" + i + ".json");
  var repaired = model.predict(file, digest, catalog, text, selector).reply().path("cases");
  if (repaired.size() != 1
      || !repaired.path(0).path("label").asText().equalsIgnoreCase(selector.label())) {
    System.err.println("Repair did not identify the requested case in " + id + ". ...");
    continue;
  }
  for (var entry : repaired.path(0).path("fields").properties()) {
    var original = fields.path(entry.getKey());
    if (original.isMissingNode() || original.isNull() || original.isObject()) continue;
    if (!(entry.getValue() instanceof ObjectNode grounded)) continue;
    fields.set(entry.getKey(), reconcile(original, grounded, source));
  }
}`,
    highlight: [[4, 6], [7, 9], [10, 14], [16, 17], [18, 19]],
    beats: B(
      "CaseRepair dot java. When does it run? Only when a case has at least one field that is a bare value: not an object, and not null.",
      { say: "Then one follow up, through the same predict, with a selector for that patient, and its own recording: repairs, slash D04, slash case one. Replay checks the recorded selector matches.", tone: "key" },
      "The answer must be exactly one case, with the same label. Otherwise it logs that the repair didn't identify the patient, and the uncited values become unknown.",
      { say: "And the rule that saved the infant. Only bare values are repaired. A field that was missing or null in the first reading stays withheld, whatever the second reading says.", tone: "key" },
      "Each bare value is reconciled with the second reading's cited proposal.",
    ),
  },
  {
    kind: "code",
    title: "Prompt.focusMessage() and reconcile()",
    lang: "java",
    code: `static String focusMessage(LanguageModel.Selector selector) {
  return """
    Re-extract only the selected patient from the preceding report. Return exactly one case,
    with the exact supplied label. ... Data about another patient must not be transferred
    to the selected patient. The following object identifies the patient. Its label is data.
    """ + Json.object().put("case_index", selector.index()).put("label", selector.label());
}

private static JsonNode reconcile(JsonNode original, ObjectNode grounded, Evidence source) {
  if (original.equals(grounded.path("value"))) return grounded;          // agree: take the cited one
  var passages = /* the second reading's cited passages */;
  if ((original.isTextual() || original.isArray())
      && Confidence.direct(original, passages, "literal")) {
    var result = grounded.deepCopy();
    result.set("value", original);
    result.put("confidence", "low")
          .put("note", "The readings differ. The original term is present in the cited passage.");
    return result;
  }
  return Json.object().put("status", "unknown")
      .put("note", "The two model readings disagree about this value.");
}`,
    highlight: [[1, 6], [10, 10], [12, 18], [19, 20]],
    beats: B(
      "The follow up is the same conversation, plus one user message. Re extract only the selected patient. Data about another patient must not be transferred. And the label is passed as data.",
      "Reconcile. If both readings agree, take the cited one.",
      { say: "If they differ, but the original term literally appears in the passages the second reading cited, keep the original, at low confidence, with a note that the readings differ.", tone: "key" },
      "Otherwise, unknown. The two readings disagree, and the code refuses to pick a winner.",
    ),
  },
  {
    kind: "big",
    tone: "idea",
    lead: "Two kinds of retry",
    text: "A 429 retries the same request. A malformed patient gets a new, scoped request.",
    after: "each has its own recording; neither silently rewrites the other",
    beats: B(
      { say: "Don't mix up the two kinds of retry. A four twenty nine, or a timeout, retries the same request, inside HttpModel. A successful but malformed patient gets a new, scoped request, with its own recording.", tone: "key" },
      "Both are on disk, and neither silently rewrites the other. And the honest next step: test two patients with similar labels and genuinely different medicines before extending the merge.",
    ),
  },
  check({
    topic: "the repair",
    q: "In D04's first reading the infant's dose was null. The repair proposes 50 mg, with a citation. What is in the output?",
    options: ["50 mg at low confidence", "50 mg at the repair's confidence", "Unknown: null is not a bare value, so it stays withheld", "A conflict between null and 50"],
    answer: 2,
    a: "Unknown (\"The recording withheld this value.\"). Only bare values are repaired; a null stays withheld. The infant received no direct dose.",
    aSay: "C. Unknown. The recording withheld this value. Only bare values are repaired, and a null isn't one, so the second reading can't fill it. Which is right: the infant received no direct dose.",
  }),

  // ------------------------------------------------------------ 10
  sec("10", "Replay, and the catalog change they make live", "Topic ten. Replay, and the catalog change they will ask for, live."),
  {
    kind: "compare",
    title: "Today's catalog, yesterday's recordings",
    cols: [
      { title: "Add a field", icon: "➕", tone: "blue", items: ["e.g. coded 'Follow-up requested'", "unknown: \"No value for this field in the recording.\"", "the desk shows its new control"] },
      { title: "Tighten a rule", icon: "📏", tone: "amber", items: ["age max 120 → 30", "54 becomes unknown:", "\"Value is outside the catalog range.\""] },
      { title: "Break the structure", icon: "🛑", tone: "red", items: ["a section that isn't listed", "replay stops, naming the field", "a removed field just disappears"] },
    ],
    footer: "to fill a new field from the report: a live run, with the new catalog and a fresh fixtures folder",
    beats: B(
      "Replay runs today's catalog against yesterday's recordings. Add a field, say a coded follow up requested, and it appears in every case as unknown, with the note: no value for this field in the recording. And the desk already shows its control.",
      "Tighten a rule, say age at most thirty, and D01's fifty four becomes unknown, with a different note: value is outside the catalog range.",
      "Break the structure, a field in a section that isn't listed, and replay stops, naming the field. A removed field simply disappears.",
      { say: "And to fill the new field from the report, you need a live run with the new catalog and a fresh fixtures folder. The request changed, so the old recordings rightly refuse to be overwritten.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "The drill, and the desk's 'not evaluated' rows",
    lang: "ts",
    code: `# tools/catalog_drill.py builds .local/drill/catalog.json:
#   + coded field "Follow-up requested" (yes / no) in the last section
#   + the bounded integer (age) gets max 30
python tools/catalog_drill.py
java -jar target/case-intake.jar --mode=replay --catalog=.local/drill/catalog.json --out=.local/drill/out
python tools/verify.py --catalog .local/drill/catalog.json --out .local/drill/out
java -jar target/case-intake.jar --server.port=8082 \\
     --intake.catalog=.local/drill/catalog.json --intake.out=.local/drill/out

// ui/types.ts: a catalog field the extraction lacks is shown, never hidden
export const fieldFor = (patient: Patient, spec: FieldSpec): Field =>
  patient.fields[spec.id] ?? {
    status: "unknown",
    notEvaluated: true,
    note: "This field is in the active catalog but not in this extraction. Replay ...",
  };`,
    highlight: [[1, 4], [5, 6], [7, 8], [10, 16]],
    beats: B(
      "And you can rehearse it. The drill script writes a scratch catalog: a new coded field, follow up requested, and an age maximum of thirty.",
      "Replay with that catalog into a scratch output folder, and verify every span.",
      "Then start a second desk on port eighty eighty two, pointed at the scratch catalog and outputs. The committed files are never touched.",
      { say: "And on the desk, a catalog field that the served extraction doesn't have is shown as not evaluated, never hidden. The desk names the drift and asks for a replay. Hiding it was one of the silent failures the rehearsal found.", tone: "key" },
    ),
  },
  {
    kind: "trap",
    myth: "The replayed JSON equals the committed JSON, so replay passed.",
    truth: "On Windows, Git still showed every output as modified.",
    why: "The pretty printer used CRLF. Json.write now always writes LF, .gitattributes pins eol=lf, and CI runs git diff --exit-code on out/.",
    beats: B(
      "A real story from this project. The replayed JSON was equal to the committed JSON. So replay passed. Right?",
      { say: "On Windows, Git still showed every output file as modified. Two valid success criteria disagreed: equal JSON, and identical bytes. The brief's reviewers would see the second.", tone: "key" },
      "The cause: Jackson's pretty printer used the platform's line ending. Now Json dot write always writes a plain line feed, git attributes pins Unix line endings, the report files are marked so Git never touches their bytes, and CI replays and then fails on any diff in the outputs.",
    ),
  },
  {
    kind: "big",
    tone: "interview",
    lead: "The attack",
    text: "\"After a catalog change, are the reviewers' decisions still valid?\"",
    after: "no, and the system knows: the review revision hashes source + extraction + catalog",
    beats: B(
      "The attack. After a catalog change, are the reviewers' earlier decisions still valid?",
      { say: "No, and the system knows it. A document's review revision is a hash of the source text, the extraction and the catalog. Change any one, and the desk gets a fresh, empty decision map. Carrying decisions forward would need stable case identities, and a rule for when evidence is similar enough.", tone: "key" },
    ),
  },
  check({
    topic: "replay",
    q: "After tightening age and adding a field, D01 shows two unknowns: the age and the new field. What distinguishes them?",
    options: ["Nothing: both are unknown", "Their notes: the age failed the new range; the new field was never proposed", "The age is a conflict", "The new field is hidden"],
    answer: 1,
    a: "Different notes. The age was proposed and now fails the range (\"outside the catalog range\"); the new field has no proposal in the recording (\"No value for this field in the recording\"). Only a fresh live run can fill it.",
    aSay: "B. Their notes. The age was proposed, and now fails the range. The new field was never proposed, because the recording predates it. Only a fresh live run can fill the new field.",
  }),

  // ------------------------------------------------------------ 11
  sec("11", "Code tour IV: the REST API", "Topic eleven. The REST API. Six routes, and optimistic concurrency without a database."),
  {
    kind: "bullets",
    title: "ReviewApi.java: the routes",
    firstItemStep: 1,
    items: [
      { icon: "📐", text: "GET /api/catalog", sub: "after CatalogCheck · a 500 with the field's name if broken" },
      { icon: "📚", text: "GET /api/documents", sub: "id, title, caseCount, flags, reviewed" },
      { icon: "📄", text: "GET /api/documents/{id}", sub: "text, format, revision, extraction, reviews · /original serves the bytes" },
      { icon: "👯", text: "GET /api/duplicates", sub: "out/duplicates.json" },
      { icon: "✏️", text: "PATCH …/cases/{caseIndex}/fields/{fieldId}", sub: "accepted · rejected · edited, returns the decision map" },
    ],
    beats: B(
      "ReviewApi dot java. A plain Spring rest controller, with paths injected from properties, so a drill can start a second desk on other folders.",
      "Get the catalog, always through CatalogCheck. A broken catalog is a five hundred with the field's name, so the desk can show why.",
      "Get the documents. For each: the id, a title from the subject line or the first non blank line, the case count, the flags, and how many decisions are saved.",
      "Get one document. The text, its format, a revision, the extraction, and the saved decisions. And an original route serves the raw bytes, the text or the PDF.",
      "Get the duplicate candidates.",
      { say: "And the one write. A PATCH on one field of one case, with an action: accepted, rejected or edited. It returns the whole decision map.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "ReviewApi.review(): the PATCH",
    lang: "java",
    code: `@PatchMapping("/documents/{id}/cases/{caseIndex}/fields/{fieldId}")
synchronized JsonNode review(@PathVariable String id, @PathVariable int caseIndex,
                             @PathVariable String fieldId, @RequestBody JsonNode body) throws IOException {
  var detail = detail(id, source(id));
  if (!detail.get("revision").asText().equals(body.path("revision").asText()))
    throw new ResponseStatusException(HttpStatus.CONFLICT, "Source or catalog changed; reload the document.");
  ...                                           // 404 unknown case or field · 400 unknown action
  if (action.equals("edited"))
    Rules.violation(spec, value).ifPresent(error -> {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, error); });
  var state = (ObjectNode) detail.required("reviews");
  String key = caseIndex + "/" + fieldId;
  if (!Objects.equals(state.get(key), body.get("previous"))
      && !(state.get(key) == null && body.path("previous").isNull()))
    throw new ResponseStatusException(HttpStatus.CONFLICT, "Another reviewer changed this field; reload.");
  state.set(key, review);
  Json.write(reviews.resolve(detail.get("revision").asText() + ".json"), state);
  return state;
}
// revision = SHA-256 of (text + "\\n" + extraction + "\\n" + catalog)`,
    highlight: [[2, 3], [4, 6], [8, 10], [11, 15], [16, 18], [20, 20]],
    beats: B(
      "The PATCH. It's synchronized, so read, check and write are one step inside this process.",
      "First check: the revision the page was built on must still be the current one. Otherwise, four oh nine: source or catalog changed, reload.",
      "An edit goes through the same Rules dot violation as the model. An invalid value is a four hundred, and no decision is saved.",
      { say: "Second check: the previous decision the client saw must equal what's stored for that field. If another tab decided it in between, four oh nine: another reviewer changed this field. That's optimistic concurrency, without a database.", tone: "key" },
      "Then the map is written atomically to a file named after the revision, keyed by case index slash field id. And the model's extraction is never touched.",
      { say: "And the revision is the hash of the text, the extraction and the catalog. Change any one, and decisions start fresh. No decision silently applies to something it wasn't made on.", tone: "key" },
    ),
  },
  {
    kind: "seq",
    title: "Two tabs, one field",
    actors: [
      { id: "a", name: "Tab A", icon: "🅰️" },
      { id: "s", name: "ReviewApi", icon: "🛡" },
      { id: "b", name: "Tab B", icon: "🅱️" },
    ],
    msgs: [
      { from: "a", to: "s", label: "PATCH accepted · previous null", step: 1 },
      { from: "s", to: "a", label: "200 · map has 0/patient_age_years", step: 2, tone: "green", dash: true },
      { from: "b", to: "s", label: "PATCH rejected · previous null", step: 3 },
      { from: "s", to: "b", label: "409 · another reviewer changed this field", step: 4, tone: "red", dash: true },
      { from: "b", to: "s", label: "reload · PATCH with previous accepted", step: 5 },
      { from: "s", to: "b", label: "200", step: 6, tone: "green", dash: true },
    ],
    note: { step: 7, text: "different fields never conflict · one process only: a second server needs a real store", tone: "amber" },
    beats: B(
      "Two tabs open the same report. Neither has decided the age yet.",
      "Tab A accepts, saying the previous decision was none.",
      "Saved. The map now has case zero, patient age.",
      "Tab B, still showing the old page, rejects, also saying previous was none.",
      { say: "Four oh nine. What tab B saw is no longer true.", tone: "key" },
      "Tab B reloads, sees the accept, and sends its rejection with previous accepted.",
      "Now it's saved, knowingly.",
      "Two tabs on different fields both succeed. And this protects one server process. Two servers on the same folder would need a real store.",
    ),
  },
  {
    kind: "decision",
    question: "How would this work with ten reviewers and three servers?",
    answer: "Move decisions to Postgres: one row per revision, case and field, with a version column, reviewer identity and append-only history. The same check becomes UPDATE … WHERE version = ?.",
    left: { title: "Today", items: ["synchronized, one process", "a JSON file per revision", "previous-decision check", "no reviewer identity"] },
    right: { title: "At scale", items: ["a row per (revision, case, field)", "version column, conditional update", "who changed what, append-only", "works across replicas"] },
    footer: "then test simultaneous edits, and a retried PATCH whose first attempt actually succeeded",
    beats: B(
      "The follow up you should expect. How would this work with ten reviewers and three servers?",
      { say: "Move decisions into Postgres. One row per revision, case and field, with a version column, the reviewer's identity, and an append only history. The same check becomes an update where version equals the one you read.", tone: "key" },
      "Today it's synchronized in one process, with a file per revision. At scale, a conditional update works across replicas, and you know who changed what.",
      "And then test it. Simultaneous edits, and the nasty one: a retried PATCH whose first attempt actually succeeded. It gets a four oh nine, and the client should reload and compare.",
    ),
  },
  check({
    topic: "the API",
    q: "A reviewer opens D01, then the catalog is edited, then they click Accept. What happens?",
    options: ["Saved against the old catalog", "409: source or catalog changed; reload", "400: invalid value", "Saved, and the catalog change is reverted"],
    answer: 1,
    a: "409 \"Source or catalog changed; reload the document.\" Their page's revision hashed the old catalog. After a reload they get the new revision, with an empty decision map.",
    aSay: "B. Four oh nine: source or catalog changed, reload the document. The page's revision included the old catalog. After a reload, they see the new revision, with a fresh, empty decision map.",
  }),

  // ------------------------------------------------------------ 12
  sec("12", "Code tour V: the React desk", "Topic twelve. The React desk. The document on the left, the patient's fields on the right."),
  {
    kind: "bullets",
    title: "ui/: six components, one screen",
    firstItemStep: 1,
    items: [
      { icon: "🧭", text: "App.tsx", sub: "loads, selects, saves, the keyboard, every state" },
      { icon: "📄", text: "Source.tsx", sub: "the report, split at evidence boundaries, by code point" },
      { icon: "🗂", text: "Fields.tsx", sub: "rows by catalog section · status · accept / reject / edit" },
      { icon: "🎛", text: "FieldEditor.tsx", sub: "the control chosen by the field's type" },
      { icon: "💬", text: "AskPanel.tsx · Comparison.tsx", sub: "the assistant · the duplicate pair side by side" },
    ],
    beats: B(
      "The desk is one screen, and six components.",
      "App holds the state. It loads, selects, saves, handles the keyboard, and draws every loading, empty and error state.",
      "Source draws the report, split wherever any evidence starts or ends.",
      "Fields draws the rows, grouped by catalog section, with the status, and the accept, reject and edit buttons.",
      "FieldEditor picks the control from the field's type.",
      "And AskPanel and Comparison are the two stretch views: the assistant, and the duplicate pair side by side.",
    ),
  },
  {
    kind: "code",
    title: "App.tsx: load safely, select evidence, filter the risky fields",
    lang: "ts",
    code: `useEffect(() => {
  if (!id) return;
  const controller = new AbortController();
  setData(undefined);
  request<Detail>("/api/documents/" + encodeURIComponent(id), { signal: controller.signal })
    .then((d) => {
      if (!controller.signal.aborted) {
        setData(d);
        const entries = Object.entries(d.extraction.cases[0]?.fields ?? {});
        select((entries.find(([, field]) => field.provenance?.length) ?? entries[0])?.[0] ?? "");
      }
    })
    .catch((e) => { if (!controller.signal.aborted) setError(describe(e)); });
  return () => controller.abort();
}, [id, retry]);

// ui/types.ts
export const needsAttention = (f: Field) =>
  f.status !== "extracted" || f.confidence !== "high";`,
    highlight: [[3, 5], [7, 8], [9, 10], [14, 14], [17, 19]],
    beats: B(
      "App dot t s x. Opening a report fetches its detail with an abort controller.",
      "And data is applied only if this request wasn't aborted.",
      "Then it selects the first field that has evidence, so a highlight is visible the moment the report opens.",
      { say: "Moving to another report aborts the previous request. So a slow response can never overwrite the report you've moved to. That's a race, and the cleanup function closes it.", tone: "key" },
      "And the needs attention filter. Anything not extracted, or below high confidence. So unknowns, conflicts, and everything the gate lowered. A reviewer finds the risky fields without reading every row.",
    ),
  },
  {
    kind: "code",
    title: "Source.tsx: highlighting by code point",
    lang: "ts",
    code: `const pieces = useMemo(() => {
  const chars = Array.from(text);                           // code points, like Java
  const spans = Object.entries(fields).flatMap(([id, f]) =>
    (f.provenance ?? []).map((p) => ({ ...p, id })));
  const bounds = cited ? [cited.start, cited.end] : [];     // a passage the assistant cited
  const edges = [...new Set([0, chars.length, ...bounds,
                             ...spans.flatMap((s) => [s.start, s.end])])]
    .filter((n) => n >= 0 && n <= chars.length).sort((a, b) => a - b);
  return edges.slice(0, -1).map((start, i) => ({
    start,
    text: chars.slice(start, edges[i + 1]).join(""),
    ids: spans.filter((s) => s.start <= start && s.end >= edges[i + 1]).map((s) => s.id),
  }));
}, [text, fields, cited]);

// a piece with ids renders as <mark role="button" tabIndex={0}>
//   onClick → onSelect(active ? selected : p.ids[0])     · Enter and Space work too`,
    highlight: [[2, 2], [3, 4], [6, 8], [9, 12], [16, 17]],
    beats: B(
      { say: "Source dot t s x. The line that matters most: array from text. That splits by code point, the same unit as Java's offsets.", tone: "key" },
      "Collect every evidence span, of every field, tagged with its field id.",
      "Every start and end becomes a cut. Sort them, remove duplicates.",
      "Each piece between two cuts knows which fields cite it. So overlapping evidence just works: several fields often cite the same sentence.",
      "A piece with ids becomes a mark that acts like a button. Click it, and its field is selected. That's the stretch item: click a quote, select its field. And only the source pane scrolls, so the field row stays under your pointer.",
    ),
  },
  {
    kind: "code",
    title: "App.tsx: the keyboard",
    lang: "ts",
    code: `const press = (e: KeyboardEvent) => {
  if (dialog || busy || e.metaKey || e.ctrlKey || e.altKey || e.repeat ||
      (e.target instanceof HTMLElement &&
       e.target.closest("input,textarea,select,[contenteditable]")))
    return;
  const at = visible.findIndex((f) => f.id === selected);
  if ((e.key === "j" || e.key === "k") && visible.length) {
    e.preventDefault();
    pickField(visible[(at + (e.key === "j" ? 1 : -1) + visible.length) % visible.length].id, true);
  }
  if (e.key === "a" && selected) void save("accepted");
  if (e.key === "r" && selected) void save("rejected");
  if (e.key === "?") setDialog("keys");
};
// save(): PATCH with { action, value, revision: data.revision, previous: data.reviews[key] ?? null }`,
    highlight: [[2, 5], [6, 10], [11, 13], [15, 15]],
    beats: B(
      "The keyboard. Ignored while you type in an input, while a dialog is open, or while a save is in flight.",
      "J and K move through the visible fields, wrapping around. So with the filter on, J jumps from one risky field to the next.",
      "A accepts, R rejects, and question mark opens the list of shortcuts.",
      "And save sends the PATCH with the action, the value, the page's revision, and the previous decision. Exactly the two things the server checks.",
    ),
  },
  {
    kind: "compare",
    title: "What the reviewer sees",
    cols: [
      { title: "Every row", icon: "🗂", tone: "blue", items: ["label · value as option labels", "high / medium / low, or unknown / conflict", "in text, never colour alone"] },
      { title: "After a decision", icon: "✏️", tone: "amber", items: ["edits look different: 'Reviewer edit'", "the model's value stays visible", "progress: 0 / 32 reviewed"] },
      { title: "Every state", icon: "🧩", tone: "green", items: ["loading · no reports · couldn't load + retry", "a case-free report: 'No case to review' + why", "a narrow screen works too"] },
    ],
    footer: "FieldEditor: select · multi-select · date · number with min/max · text with pattern · one per line",
    beats: B(
      "Every row shows the label, the value using option labels, not codes, and the status: a confidence, or unknown, or conflict. In words, never colour alone.",
      "After a decision, an edit looks different, with a reviewer edit badge, the model's value stays visible underneath, and progress counts up per report.",
      "And every state is designed. Loading. No reports. Couldn't load, with try again. And a report with no cases looks intentional: no case to review, and the flag that explains why.",
      { say: "And the editor picks the control from the type. A select, a multi select, a date picker, a number input with the catalog's min and max, a text input with its pattern, or a box with one value per line. All from the catalog.", tone: "key" },
    ),
  },
  {
    kind: "big",
    tone: "interview",
    lead: "The attack",
    text: "\"Where's the field id in the UI source?\"",
    after: "nowhere: a test adds a field the code has never seen, and saves a typed value",
    beats: B(
      "The attack. Show me where the field id is in the U I source.",
      { say: "Nowhere. Fields renders from the catalog. The only names the U I knows are the seven types and three statuses. And there's a test, submits a typed number for an added catalog field, that adds a field the code has never seen, and saves it.", tone: "key" },
    ),
  },
  check({
    topic: "the desk",
    q: "Why does Source.tsx use Array.from(text) instead of text.slice(start, end)?",
    options: ["It's faster", "JavaScript indexes UTF-16 code units; Java's offsets are code points", "slice doesn't work on long strings", "To strip whitespace"],
    answer: 1,
    a: "JavaScript strings index UTF-16 code units; Java's offsets are code points. A character outside the BMP would shift every later highlight by one. Array.from splits by code point.",
    aSay: "B. JavaScript strings index UTF sixteen code units, but Java's offsets are code points. One emoji would shift every later highlight by one. Array from splits by code point, so both sides agree, and a test checks exactly that.",
  }),
];
