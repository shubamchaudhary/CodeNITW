import type { Scene } from "../../lib/types.ts";
import { B, sec } from "../ll01/h.ts";
import { check } from "./k.ts";

// Part 4: the scoped repair for a malformed patient (topic 9), replay and the
// live catalog change (topic 10), the Spring review API with its 409s, checks
// and sign-off (topic 11), and the React desk with its flow and arrows (topic 12).
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
    footer: "local run: the infant's diagnosis survived with its sentence; dose, route and start date stayed withheld",
    beats: B(
      "D04 again, and this story is from the first, local run. Groq needed no repair, but the code path is still live. The mother and her newborn. The local model returned the infant's fields as bare values, like route colon oral, instead of objects with a confidence and quotes. Drop them, and you lose a real patient.",
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
      { say: "Then one follow up, through the same predict, with a selector for that patient, and its own recording under repairs, slash D04, slash case one. That file now sits in the local history folder. Replay checks the recorded selector matches.", tone: "key" },
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
    q: "In the local run, D04's first reading gave the infant's dose as null. The repair proposes 50 mg, with a citation. What is in the output?",
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
  sec("11", "Code tour IV: the REST API", "Topic eleven. The REST API. Seven routes, a set of plain language checks, a sign off, and optimistic concurrency without a database."),
  {
    kind: "bullets",
    title: "ReviewApi.java: the routes",
    firstItemStep: 1,
    items: [
      { icon: "📐", text: "GET /api/catalog · /api/duplicates", sub: "after CatalogCheck (a 500 naming the field) · out/duplicates.json" },
      { icon: "📚", text: "GET /api/documents", sub: "id, title, caseCount, flags, reviewed, signed" },
      { icon: "📄", text: "GET /api/documents/{id}", sub: "text, revision, extraction, reviews + passages, checks, signoffs" },
      { icon: "✏️", text: "PATCH …/cases/{caseIndex}/fields/{fieldId}", sub: "accepted · rejected · edited, returns the decision map" },
      { icon: "🖊", text: "POST …/cases/{caseIndex}/sign", sub: "a named sign-off, once every field is decided" },
    ],
    beats: B(
      "ReviewApi dot java. A plain Spring rest controller, with paths injected from properties, so a drill can start a second desk on other folders.",
      "Get the catalog, always through CatalogCheck. A broken catalog is a five hundred with the field's name, so the desk can show why. And get the duplicate candidates.",
      "Get the documents. For each: the id, a title from the subject line, the case count, the flags, how many decisions are saved, and how many cases are signed.",
      { say: "Get one document. The text, a revision, the extraction and the saved decisions. Plus three things computed on every request and never stored: the passage boundaries, the checks for each case, and the sign offs. And an original route serves the raw bytes, the text or the PDF.", tone: "key" },
      "The first write. A PATCH on one field of one case, with an action: accepted, rejected or edited. It returns the whole decision map.",
      { say: "And the second write, which is new. A POST that signs one case, with the reviewer's name. It only works once every field of that case is decided.", tone: "key" },
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
  if (detail.path("signoffs").has(String.valueOf(caseIndex)))
    throw new ResponseStatusException(HttpStatus.CONFLICT, "This case is signed, so its decisions are locked.");
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
    highlight: [[2, 3], [4, 6], [7, 8], [10, 12], [13, 17], [18, 20], [22, 22]],
    beats: B(
      "The PATCH. It's synchronized, so read, check and write are one step inside this process.",
      "First check: the revision the page was built on must still be the current one. Otherwise, four oh nine: source or catalog changed, reload.",
      "New: if this case has been signed, four oh nine again. Its decisions are locked.",
      "An edit goes through the same Rules dot violation as the model. An invalid value is a four hundred, and no decision is saved.",
      { say: "Then the previous decision the client saw must equal what's stored for that field. If another tab decided it in between, four oh nine: another reviewer changed this field. That's optimistic concurrency, without a database.", tone: "key" },
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
    kind: "code",
    title: "Checks.java: the Check step, read from the catalog",
    lang: "java",
    code: `static ArrayNode forCase(String documentId, JsonNode catalog, JsonNode patient,
                         String text, JsonNode flags, JsonNode duplicates) {
  for (var section : catalog.path("sections")) {            // 1. every section has a value
    boolean any = false;
    for (var spec : catalog.path("fields"))
      if (spec.path("section").asText().equals(section.path("id").asText())
          && fields.path(spec.path("id").asText()).path("status").asText().equals("extracted"))
        any = true;
    (any ? present : empty).add(section.path("label").asText());
  }
  // "Patient, Suspect drug, Adverse event and Report details are all present"
  // 2. Rules.violation on every extracted value   → "All values are in the expected form"
  // 3. exact(text, span): the code-point slice equals the quote
  //                                               → "Every value is backed by a quote from the report"
  // 4. duplicates.json names this report?         → warn "May be the same case as report S02"
  // 5. flag embedded_instruction_ignored?         → warn, else "No hidden instructions in the report"
  // 6. flag machine_transcribed?                  → warn "This text was read from a scanned page"
}
// each check: { id, status: pass | warn | fail, label, detail }`,
    highlight: [[1, 2], [3, 11], [12, 14], [15, 17], [19, 19]],
    beats: B(
      "Checks dot java. It runs for every case on every document request, from the catalog, the case, the text, the flags and the duplicate index.",
      { say: "Check one. Does every catalog section have at least one extracted value? That stands in for the four minimum case elements: patient, drug, event, report. And look: no field id anywhere. Add a section to the catalog, and the check grows with it.", tone: "key" },
      "Check two runs the same Rules dot violation on every value. Check three re-slices the source by code points, and compares it with the stored quote, word for word. The same test the verifier makes.",
      "Check four warns when the duplicate index pairs this report with another. Check five warns when injected instructions were masked. And a sixth, only for scans, warns that the text was read from a page image.",
      { say: "And every check is written as an outcome a reviewer understands. Not provenance passed, but every value is backed by a quote from the report. Not a test name, a sentence.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "The checks on the committed outputs",
    cols: [
      { title: "All clear", icon: "✅", tone: "green", items: ["D01–D05, D08 and S04", "D01: '18 quotes matched word for word'", "five passes, no warnings"] },
      { title: "To look at", icon: "⚠️", tone: "blue", items: ["S01, S02: 'May be the same case as report …'", "D07: 'instructions to software … ignored'", "S03: 'read from a scanned page'"] },
      { title: "What they don't prove", icon: "⚖️", tone: "red", items: ["D05 passes all five", "54 is in range, cited, quoted exactly", "form and evidence, not truth"] },
    ],
    footer: "D06 has no case, so no checks · the label is the outcome, the detail one short fact",
    beats: B(
      "Here's what the checks say on the committed outputs.",
      "Almost everything is all clear. D01, for example: all five pass, and eighteen quotes matched word for word.",
      "Four reports have something to look at. S01 and S02 may be the same case. D07 had instructions to software, which were ignored. And S03 was read from a scanned page.",
      { say: "And the honest part. D05 passes all five, yet its age is wrong. Fifty four is an integer, in range, cited, and quoted exactly. The checks prove form and evidence, not truth. Which is exactly why a human signs.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "ReviewApi.sign(): a named sign-off that locks the case",
    lang: "java",
    code: `@PostMapping("/documents/{id}/cases/{caseIndex}/sign")
synchronized JsonNode sign(@PathVariable String id, @PathVariable int caseIndex,
                           @RequestBody JsonNode body) throws IOException {
  var detail = detail(id, source(id));
  if (!detail.get("revision").asText().equals(body.path("revision").asText()))
    throw new ResponseStatusException(HttpStatus.CONFLICT, "Source or catalog changed; reload the document.");
  ...                                       // 404 unknown case · 400 unless a 1-80 character name
  if (signoffs.has(key))
    throw new ResponseStatusException(HttpStatus.CONFLICT, "This case is already signed.");
  int open = 0;
  for (var field : c.path("fields").properties())
    if (!decisions.has(caseIndex + "/" + field.getKey())) open++;
  if (open > 0) throw new ResponseStatusException(HttpStatus.CONFLICT,
      "Decide every field before signing: " + open + " fields are still open.");
  signoffs.putObject(key).put("reviewer", reviewer).put("signedAt", now)
      .put("checksPassed", passed).put("checksTotal", checks.size());
  Json.write(reviews.resolve(detail.get("revision").asText() + ".signoff.json"), signoffs);
  return signoffs;
}`,
    highlight: [[1, 3], [4, 7], [8, 9], [10, 14], [15, 18]],
    beats: B(
      "The sign off. Also synchronized, also a POST on one case.",
      "Same revision check as the PATCH. And the reviewer's name must be one to eighty characters.",
      "A case can be signed only once.",
      { say: "And only when every field of the case has a decision. Otherwise four oh nine, with how many are still open. The desk hides the button until then, but the server is what enforces it.", tone: "key" },
      { say: "Then it records who, when, and how many checks passed, in a sign off file next to the decisions, under the same revision. A new source, extraction or catalog is a new revision, so an old sign off no longer applies.", tone: "key" },
    ),
  },
  {
    kind: "decision",
    question: "How would this work with ten reviewers and three servers?",
    answer: "Move decisions and sign-offs to Postgres: one row per revision, case and field, with a version column, the reviewer from the login, and append-only history. The same check becomes UPDATE … WHERE version = ?.",
    left: { title: "Today", items: ["synchronized, one process", "a JSON file per revision", "previous-decision check", "a typed name, no accounts"] },
    right: { title: "At scale", items: ["a row per (revision, case, field)", "version column, conditional update", "reviewer from the login, append-only", "works across replicas"] },
    footer: "then test simultaneous edits, and a retried PATCH whose first attempt actually succeeded",
    beats: B(
      "The follow up you should expect. How would this work with ten reviewers and three servers?",
      { say: "Move decisions and sign offs into Postgres. One row per revision, case and field, with a version column, the reviewer taken from the login, and an append only history. The same check becomes an update where version equals the one you read.", tone: "key" },
      "Today it's synchronized in one process, with a file per revision, and the signer is a typed name, because there are no accounts. At scale, a conditional update works across replicas, and you know who changed what.",
      "And then test it. Simultaneous edits, and the nasty one: a retried PATCH whose first attempt actually succeeded. It gets a four oh nine, and the client should reload and compare.",
    ),
  },
  check({
    topic: "the API",
    q: "Every field of D03's case is decided and it's signed. A reviewer then tries to change one decision. What happens?",
    options: ["Saved, and the sign-off is removed", "409: this case is signed, so its decisions are locked", "400: invalid value", "Saved as a second version"],
    answer: 1,
    a: "409 \"This case is signed, so its decisions are locked.\" The PATCH checks the sign-off map for that case before anything else about the decision. A new revision (source, extraction or catalog) starts fresh.",
    aSay: "B. Four oh nine: this case is signed, so its decisions are locked. The PATCH checks for a sign off before it looks at the decision. Only a new revision, a changed source, extraction or catalog, starts fresh, with no sign off.",
  }),

  // ------------------------------------------------------------ 12
  sec("12", "Code tour V: the React desk", "Topic twelve. The React desk. A review flow along the top, the report on the left, the fields on the right, and arrows between them."),
  {
    kind: "bullets",
    title: "ui/: one screen, fitted to the window",
    firstItemStep: 1,
    items: [
      { icon: "🧭", text: "App.tsx", sub: "loads, selects, saves, signs, the keyboard, every state" },
      { icon: "🪜", text: "ReviewFlow.tsx", sub: "Draft → Check → Review and sign, in one slim row" },
      { icon: "📄", text: "Source.tsx · Connector.tsx", sub: "the report, numbered and coloured · arrows to every field" },
      { icon: "🗂", text: "Fields.tsx · FieldEditor.tsx", sub: "rows by section, passage pills, the control by type" },
      { icon: "💬", text: "AskPanel.tsx · Comparison.tsx", sub: "the streamed assistant · the duplicate pair" },
    ],
    beats: B(
      "The desk is one screen, and it fits the browser window. Only the panes scroll.",
      "App holds the state. It loads, selects, saves, signs, handles the keyboard, and draws every loading, empty and error state.",
      "ReviewFlow is the slim strip on top: draft, check, review and sign.",
      "Source draws the report, split wherever any evidence starts or ends, with passage numbers and decision colours. And Connector draws the arrows, from the selected sentence to every field that cites it.",
      "Fields draws the rows, grouped by catalog section, each with its passage pill, and FieldEditor picks the control from the field's type.",
      "And AskPanel and Comparison are the two stretch views: the streamed assistant, and the duplicate pair side by side.",
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
      "Then it selects the first field that has evidence, so a highlight, and its arrows, are visible the moment the report opens.",
      { say: "Moving to another report aborts the previous request. So a slow response can never overwrite the report you've moved to. That's a race, and the cleanup function closes it.", tone: "key" },
      "And the needs attention filter. Anything not extracted, or below high confidence. So unknowns, conflicts, and everything the gate lowered. A reviewer finds the risky fields without reading every row.",
    ),
  },
  {
    kind: "code",
    title: "ReviewFlow.tsx: Draft, Check, Review and sign",
    lang: "ts",
    code: `const failed = checks.filter((c) => c.status === "fail").length;
const warned = checks.filter((c) => c.status === "warn").length;
const reviewable = catalog.fields.filter((s) => patient.fields[s.id]);
const decided = reviewable.filter((s) => reviews[patient.case_index + "/" + s.id]).length;
const ready = decided === reviewable.length && reviewable.length > 0;
const checkSummary = failed ? \`\${failed} need\${failed === 1 ? "s" : ""} attention\`
  : warned ? \`\${warned} to look at\` : "All clear";

<li data-state="done" title={provenance}><b>Draft</b></li>           // "Extracted by groq/qwen/…"
<li data-state={failed ? "fail" : warned ? "warn" : "pass"}>
  <b>Check</b> <button onClick={() => setOpen((v) => !v)}>{checkSummary}</button>
</li>
<li data-state={signoff ? "done" : ready ? "ready" : "active"}>
  <b>Review and sign</b>
  {signoff ? <>Signed by {signoff.reviewer}, {time}</>                // a lock icon
   : ready ? <form onSubmit={…}><input placeholder="Your name" /> Sign case</form>
   : <>{decided}/{reviewable.length} decided</>}
</li>`,
    highlight: [[1, 7], [9, 9], [10, 12], [13, 18]],
    beats: B(
      "ReviewFlow. It counts failures and warnings from the server's checks, and how many of the case's fields are decided.",
      "Step one, draft, is always done. Hover it, and it names the model and the catalog version that produced it.",
      "Step two, check. All clear, or how many to look at, or how many need attention. Click, and the plain language list opens.",
      { say: "Step three. Twelve of sixteen decided, until every field is decided. Then a name box, remembered in local storage, and sign case. Once signed: a lock, and who signed, and when. And note, ready only decides whether to show the form. The server is what refuses an early sign off.", tone: "key" },
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
}, [text, fields, cited, passages]);

// a piece with ids renders as <mark role="button" tabIndex={0} data-fields={p.ids.join(" ")}>
//   onClick → onSelect(active ? selected : p.ids[0])     · Enter and Space work too`,
    highlight: [[2, 2], [3, 4], [6, 8], [9, 12], [16, 17]],
    beats: B(
      { say: "Source dot t s x. The line that matters most: array from text. That splits by code point, the same unit as Java's offsets.", tone: "key" },
      "Collect every evidence span, of every field, tagged with its field id.",
      "Every start and end becomes a cut. Sort them, remove duplicates.",
      "Each piece between two cuts knows which fields cite it. So overlapping evidence just works: several fields often cite the same sentence.",
      "A piece with ids becomes a mark that acts like a button. Click it, and its field is selected. That's the stretch item: click a quote, select its field. And the mark carries the ids of every field citing it, which is what the arrows read.",
    ),
  },
  {
    kind: "code",
    title: "Numbered evidence, and colour once every field is decided",
    lang: "ts",
    code: `// ui/types.ts: the same passage IDs the prompt and the assistant use
export function passageOf(passages: [number, number][] | undefined, span: { start: number }) {
  const i = (passages ?? []).findIndex(([start, end]) => start <= span.start && span.start < end);
  return i < 0 ? undefined : i + 1;
}

// Source.tsx: a superscript where each cited passage ends; Fields.tsx: a pill on the row
<sup className="src-num" data-decision={decisionOf(ids)}>{n}</sup>

// a passage is "to judge" until every field citing it is decided
const decisionOf = (ids: string[]) => {
  const actions = ids.map((id) => decisions[id]);
  if (!ids.length || actions.some((a) => !a)) return undefined;
  if (actions.includes("rejected")) return "rejected";
  return actions.includes("edited") ? "edited" : "accepted";
};`,
    highlight: [[1, 5], [7, 8], [10, 13], [14, 16]],
    beats: B(
      { say: "Numbered evidence. The API now sends each passage's boundaries, and passage of maps a span to its number. The same numbers the model saw, and the assistant cites. So twenty two means one sentence, everywhere on screen.", tone: "key" },
      "The source shows that number as a small superscript where the passage ends. And each field row shows the same number on a pill. So you can see which sentence feeds which field without clicking anything.",
      "Then colour. A sentence can feed several fields, so it stays yellow, to judge, until every one of them is decided.",
      { say: "Then it shows the strongest decision. A rejection beats an edit, which beats an acceptance. So a red sentence always means: look again.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "Four colours: what's left, and what was decided",
    cols: [
      { title: "To judge", icon: "🟡", tone: "blue", items: ["every sentence and row starts here", "a sentence stays here while any", "field citing it is still open"] },
      { title: "Accepted · edited", icon: "✔", tone: "green", items: ["green: accepted", "violet: edited", "blue already means 'the assistant cited this'"] },
      { title: "Rejected", icon: "✗", tone: "red", items: ["red: rejected", "outweighs an edit and an acceptance", "confidence stays in words: colour is never alone"] },
    ],
    footer: "the footer legend lists all four · each row and each arrow takes its own field's colour",
    beats: B(
      "Four colours, one rule.",
      "Yellow: still to judge. Every sentence and every row starts there.",
      "Green when accepted. Violet when edited, because blue already marks the passages the assistant cites.",
      { say: "And red when rejected, which outweighs everything else. Confidence is still written in words on every row, so colour is never the only signal.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "Connector.tsx: one sentence, an arrow to every field it feeds",
    lang: "ts",
    code: `const mark = box.querySelector('.paper-text mark[data-active="true"][data-focus="true"]')
          ?? box.querySelector('.paper-text mark[data-active="true"]');
if (l.left < p.right) return null;                          // stacked panes: no arrows
for (const id of (mark.dataset.fields ?? "").split(" ").filter(Boolean)) {
  const field = document.getElementById("field-" + id);
  const row = field?.querySelector(".field-row");
  const r = row.getBoundingClientRect();
  const y2 = r.top + Math.min(r.height, 34) / 2;
  if (y2 < l.top || y2 > l.bottom) continue;                // row scrolled out of view
  arrows.push({
    id, primary: id === selected,
    state: field.getAttribute("data-decision") ?? "pending", // its own field's colour
    d: \`M \${x} \${y} C \${x + bend} \${y}, \${x2 - bend} \${y2r}, \${x2} \${y2r}\`,
  });
}
arrows.sort((a, b) => Number(a.primary) - Number(b.primary)); // the selected arrow on top

box.addEventListener("scroll", draw, true);                 // either pane, once per frame
window.addEventListener("resize", draw);
new ResizeObserver(draw).observe(box);
const settle = window.setTimeout(() => setFan(measure()), 120);`,
    highlight: [[1, 3], [4, 9], [10, 14], [16, 16], [18, 21]],
    beats: B(
      "Connector dot t s x. It finds the active mark in the source, and draws nothing when the panes are stacked on a narrow screen.",
      { say: "Then, for every field id that mark carries, it finds that field's row, measures it, and skips it if it's scrolled out of view. In D01, passage eight gives the initials, the age and the sex: three arrows. In D02, passage fourteen feeds five fields: drug, dose, unit, route and start date.", tone: "key" },
      "Each arrow is a cubic curve, in its own field's colour, taken from the row's decision.",
      "The selected field's arrow is drawn last, solid, on top. The others are dashed.",
      "And it redraws on scroll in either pane, throttled to animation frames, on resize, and once more a hundred and twenty milliseconds after a selection, because the source scrolls its evidence into view after rendering. It's decoration, hidden from screen readers. The pills say the same thing in text.",
    ),
  },
  {
    kind: "big",
    tone: "interview",
    lead: "The attack",
    text: "\"Why not highlight just the exact words for each field?\"",
    after: "positions stay Java's job · the fan of arrows shows every dependent field",
    beats: B(
      "The attack. Why do five fields point at one whole sentence? Why not highlight just the exact words for each one?",
      { say: "It was considered, and deliberately not done. The model cites passage numbers, and Java resolves them to whole sentences. That's the grounding guarantee. Asking the model for exact word positions would put positions back in the model's hands, the one thing the design avoids. So the sentence stays the evidence, and the arrows show every field that depends on it.", tone: "key" },
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
// save(): refuses on a signed case, else PATCH { action, value, revision, previous }`,
    highlight: [[2, 5], [6, 10], [11, 13], [15, 15]],
    beats: B(
      "The keyboard. Ignored while you type in an input, while a dialog is open, or while a save is in flight.",
      "J and K move through the visible fields, wrapping around. So with the filter on, J jumps from one risky field to the next.",
      "A accepts, R rejects, and question mark opens the list of shortcuts.",
      "And save refuses at once on a signed case. Otherwise it sends the PATCH with the action, the value, the page's revision, and the previous decision. Exactly the things the server checks.",
    ),
  },
  {
    kind: "compare",
    title: "What the reviewer sees",
    cols: [
      { title: "Every row", icon: "🗂", tone: "blue", items: ["label · value as option labels · passage pill", "high / medium / low, or unknown / conflict", "in text, never colour alone"] },
      { title: "After a decision", icon: "✏️", tone: "amber", items: ["edits look different: 'Reviewer edit'", "the model's value stays visible", "progress: 16 / 16 reviewed, then sign"] },
      { title: "Every state", icon: "🧩", tone: "green", items: ["loading · no reports · couldn't load + retry", "a case-free report: 'No case to review' + why", "a signed case: 'decisions are locked'"] },
    ],
    footer: "FieldEditor: select · multi-select · date · number with min/max · text with pattern · one per line",
    beats: B(
      "Every row shows the label, the value using option labels, not codes, its passage pill, and the status: a confidence, or unknown, or conflict. In words, never colour alone.",
      "After a decision, an edit looks different, with a reviewer edit badge, the model's value stays visible underneath, and progress counts up until the case can be signed.",
      "And every state is designed. Loading. No reports. Couldn't load, with try again. A report with no cases: no case to review, and the flag that explains why. And a signed case says its decisions are locked.",
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
      { say: "Nowhere. Fields renders from the catalog, and so do the checks on the server. The only names the U I knows are the seven types, the statuses, and the three decisions. And there's a test, submits a typed number for an added catalog field, that adds a field the code has never seen, and saves it.", tone: "key" },
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
  check({
    topic: "decision colours",
    q: "In D02, passage 14 feeds five fields. You accept four and edit the dose. What colour is the sentence?",
    options: ["Green: most were accepted", "Violet: all are decided, and an edit outweighs an acceptance", "Yellow: an edit needs a second look", "Red"],
    answer: 1,
    a: "Violet. All five fields are decided, so the sentence shows the strongest decision: edited beats accepted. The arrows keep their own fields' colours: four green, the dose violet. With one field still open, the sentence would stay yellow.",
    aSay: "B. Violet. All five are decided, so the sentence shows the strongest decision, and an edit beats an acceptance. The arrows keep their own colours: four green, and the dose violet. If one field were still open, the sentence would stay yellow.",
  }),
];
