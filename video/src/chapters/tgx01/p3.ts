import type { Scene } from "../../lib/types.ts";
import { B, arch, sec } from "../ll01/h.ts";
import { check } from "./k.ts";
import { FIELD, FIELD_STEPS } from "./boards.ts";

// Part 3: the heart of the code. The model boundary: HttpModel records every
// attempt, Recording checks identity (topic 6); Extraction and Rules turn a
// reply into validated fields, and one real field from bytes to pixels
// (topic 7); the confidence gate and the dotted-abbreviation rule (topic 8).
export const p3: Scene[] = [
  // ------------------------------------------------------------ 6
  sec("6", "Code tour II: the model boundary", "Topic six. The model boundary. One interface, two implementations, and a recording between them."),
  {
    kind: "code",
    title: "LanguageModel.java: the interface",
    lang: "java",
    code: `interface LanguageModel {
  record Prediction(String model, JsonNode reply) {}

  record Selector(int index, String label) {}        // "re-extract only this patient"

  Prediction predict(Path fixture, String digest, JsonNode catalog, String text,
                     Selector selector) throws Exception;

  /** A verbatim transcript of scanned page images. */
  default String transcribe(Path fixture, String digest, List<byte[]> pages)
      throws Exception {
    throw new IOException("This provider cannot read scanned pages.");
  }
}

// implementations:  HttpModel (live)  ·  Recording (replay)`,
    highlight: [[1, 2], [4, 4], [6, 7], [9, 13], [16, 16]],
    beats: B(
      "LanguageModel dot java. A prediction is the model's name, and its reply as JSON.",
      "A selector names one patient, by index and label. That's for the repair in topic nine.",
      { say: "And look at the arguments of predict. The fixture path is part of the contract. The recording isn't an afterthought bolted on later. Every implementation is told where the exchange lives.", tone: "key" },
      "Transcribe is for scanned pages. By default a provider says it can't read them.",
      "Two implementations. HttpModel, for live, and Recording, for replay.",
    ),
  },
  {
    kind: "code",
    title: "HttpModel.exchange(): identity first, then resume",
    lang: "java",
    code: `void exchange(Path fixture, String digest, ObjectNode request) throws Exception {
  var record = Json.object().put("source_sha256", digest).put("provider", provider);
  record.set("request", request);
  var attempts = record.putArray("attempts");
  if (Files.exists(fixture)) {
    var saved = Json.read(fixture);
    if (!saved.path("request").equals(request)
        || !saved.path("source_sha256").asText().equals(digest)
        || !saved.path("provider").asText().equals(provider))
      throw new IOException("Different existing recording. Choose a fresh --fixtures directory.");
    var previous = saved.required("attempts");
    if (previous.path(previous.size() - 1).path("status").asInt() == 200) return;
    previous.forEach(attempts::add);
  }
  var builder = HttpRequest.newBuilder(endpoint).timeout(timeout)
      .header("Content-Type", "application/json")
      .POST(HttpRequest.BodyPublishers.ofString(request.toString()));
  if (!key.isBlank()) builder.header("Authorization", "Bearer " + key);
  ...`,
    highlight: [[2, 4], [5, 10], [11, 12], [13, 13], [15, 18]],
    beats: B(
      "HttpModel, the live client. A fixture holds the source's hash, the provider, the exact request, and a list of attempts.",
      { say: "If a fixture already exists, it must be for the same request, the same source and the same provider. Otherwise it refuses: choose a fresh fixtures directory. A real exchange is never overwritten.", tone: "key" },
      "If its last attempt was a two hundred, it returns at once. That's resume. A rerun after a crash or a quota stop reuses every report that already succeeded.",
      "Otherwise the earlier failed attempts are kept, and new ones are appended.",
      "And the key goes only in the authorization header. It's never part of the request JSON, so it's never in a recording.",
    ),
  },
  {
    kind: "code",
    title: "HttpModel.exchange(): record every attempt",
    lang: "java",
    code: `for (int attempt = 0; attempt < 3; attempt++) {
  Thread.sleep(Math.max(0, nextRequest - System.currentTimeMillis()));   // MODEL_INTERVAL_MS
  nextRequest = System.currentTimeMillis() + spacing;
  var entry = attempts.addObject(); Json.write(fixture, record);   // written before sending
  HttpResponse<String> result;
  try { result = client.send(builder.build(), HttpResponse.BodyHandlers.ofString()); }
  catch (IOException failed) {
    entry.put("error", failed.getClass().getSimpleName()); Json.write(fixture, record);
    if (attempt == 2) throw failed;
    Thread.sleep(1000L << attempt); continue;
  }
  String body = key.isBlank() ? result.body() : result.body().replace(key, "[redacted]");
  body = ACCOUNT.matcher(body).replaceAll("org_[redacted]");      // \\borg_[A-Za-z0-9]{16,}\\b
  entry.put("status", result.statusCode()); entry.set("body", Json.parse(body));
  Json.write(fixture, record);
  if (result.statusCode() == 200) return;
  if (attempt == 2 || (result.statusCode() != 429 && result.statusCode() < 500))
    throw new IOException("Model returned HTTP " + result.statusCode() + "; inspect the recording.");
  long seconds = retryDelay(result.headers().firstValue("Retry-After").orElse(""), attempt);
  if (seconds > 60) throw new IOException("Quota wait is " + seconds + " seconds. Resume after ...");
  Thread.sleep(seconds * 1000);
}`,
    highlight: [[2, 3], [4, 4], [7, 10], [12, 15], [16, 18], [19, 21]],
    beats: B(
      "The loop. At most three attempts. Before each one, it waits until the minimum interval since the last request start has passed. That's how it respects requests per minute.",
      "The attempt is written to the fixture before the request is sent. So even a crash mid call leaves a trace.",
      "A network failure or a timeout is recorded by its exception name, and it backs off one second, then two.",
      "A response is recorded with its status and body. If the key ever appears in the body, it's replaced with redacted. And so is the provider's account id, which Groq prints in its rate limit errors.",
      "A two hundred returns. A four hundred that isn't a four twenty nine fails at once, and points you at the recording.",
      { say: "A four twenty nine or a five hundred waits for Retry After, in seconds or as an HTTP date, or one then two seconds. And if the provider asks for more than sixty seconds, that's a daily quota. It stops with a clear message, and tomorrow's rerun resumes.", tone: "key" },
    ),
  },
  {
    kind: "seq",
    title: "A throttled call, as the fixture records it",
    actors: [
      { id: "p", name: "Pipeline", icon: "⚙️" },
      { id: "h", name: "HttpModel", icon: "📡" },
      { id: "f", name: "fixtures/D01.json", icon: "📼" },
      { id: "m", name: "Groq", icon: "🧠", tone: "teal" },
    ],
    msgs: [
      { from: "p", to: "h", label: "predict(D01)", step: 1 },
      { from: "h", to: "m", label: "attempt 1 (written first)", step: 2 },
      { from: "m", to: "h", label: "429 · rate limit reached", step: 3, tone: "red", dash: true },
      { from: "h", to: "f", label: "attempt 1: 429, account id redacted", step: 4, tone: "amber" },
      { from: "h", to: "m", label: "attempt 2 → 429 again", step: 5, tone: "red" },
      { from: "h", to: "m", label: "attempt 3", step: 6 },
      { from: "m", to: "h", label: "200 · JSON reply", step: 7, tone: "green", dash: true },
      { from: "h", to: "p", label: "new Recording().predict(...)", step: 8, tone: "green", dash: true },
    ],
    note: { step: 9, text: "D01's real fixture: 429, 429, 200 · 9 of the 29 committed attempts were rate-limited", tone: "amber" },
    beats: B(
      "Here's a real one. D01's committed fixture, read as a conversation.",
      "The pipeline asks HttpModel for a prediction.",
      "HttpModel writes the attempt to the fixture, then sends the request to Groq.",
      "Four twenty nine. Rate limit reached.",
      "The rejection is recorded as attempt one, with Groq's account id scrubbed out.",
      "It waits, for Retry After or a short backoff, and tries again. Another four twenty nine, also recorded.",
      "Attempt three, the last one allowed.",
      "A two hundred, with the JSON reply.",
      "And HttpModel returns by reading its own recording back, exactly as replay would.",
      { say: "That's D01's real fixture: four twenty nine, four twenty nine, two hundred. Groq's free tier has an undocumented limit of about a thousand output tokens a minute, so calls twenty seconds apart were throttled, and the corpus run spaced them sixty two seconds apart. Nine of the twenty nine committed attempts were rate limited, and every one is in the files.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "Recording.java: replay checks identity before trusting anything",
    lang: "java",
    code: `public Prediction predict(Path fixture, String digest, JsonNode catalog, String text,
                          Selector selector) throws IOException {
  JsonNode record = Json.read(fixture);
  if (!record.required("source_sha256").asText().equals(digest))
    throw new IOException("Source differs from the recording for " + fixture.getFileName());
  var input = Json.parse(record.at("/request/messages/1/content").asText());
  var numbered = input.required("report");
  var evidence = Evidence.index(text);
  if (numbered.size() != evidence.passages().size()) throw new IOException("Passage count differs ...");
  for (int i = 0; i < evidence.passages().size(); i++)
    if (!numbered.get(i).path("text").asText().equals(evidence.modelText(i)))
      throw new IOException("Source passage " + (i + 1) + " differs from the recording: " + fixture);
  var reply = keyedFields(reply(record, fixture), fixture);   // last attempt must be 200
  Canonicalization.apply(reply, input.required("catalog"), evidence);
  return new Prediction(record.required("provider").asText() + "/"
      + record.required("request").required("model").asText(), reply);
}`,
    highlight: [[3, 5], [6, 12], [13, 13], [14, 14], [15, 16]],
    beats: B(
      "Recording dot java. Replay. First identity: the source's hash must match the recording. Change a newline in the report, and replay refuses.",
      { say: "Second identity: the numbered passages in the recorded request must equal today's index, passage by passage. Because a change to the splitting pattern could renumber passages even with identical bytes. Two identities, two different ways to break offsets.", tone: "key" },
      "Then the reply. The last attempt must be a two hundred, and a reply cut off at the token limit is an error, never half parsed. Fields given as an array are keyed by id, and a missing or repeated id fails visibly.",
      "The dotted abbreviation rule runs here, under the catalog that was in the recording. More on that in topic eight.",
      "And the model's name is provider slash model. Groq slash qwen slash qwen three point eight, twenty seven B. That string goes into every output. Recording also has a content method for plain text replies, which the scan transcript uses.",
    ),
  },
  {
    kind: "decision",
    question: "Temperature is zero. Why record at all?",
    answer: "Because sampling settings don't freeze the runtime, the quantization, the provider or its version. The recording freezes the output; everything after it is deterministic Java.",
    left: { title: "Trust temperature 0", items: ["the runtime can change", "a provider can update the model", "outputs drift silently", "reviewers need your key"] },
    right: { title: "Record and replay", items: ["the exact response, on disk", "byte-identical outputs, tested", "no key, no network to review", "a real before/after history"] },
    footer: "the corpus replay test compares every rebuilt file with the committed out/",
    beats: B(
      "The question. Temperature is zero, so the model is deterministic. Why record at all?",
      { say: "Because sampling settings don't freeze the runtime, the quantization, the provider, or its version. The recording freezes the model's output. Everything after it is deterministic Java.", tone: "key" },
      "Without recordings, outputs can drift silently, and every reviewer needs your key. With them, the exact response is on disk, outputs are byte identical, and you get a real history, like the original D07 run.",
      "And it's tested. The corpus replay test rebuilds every output and compares it with the committed files.",
    ),
  },
  check({
    topic: "the model boundary",
    q: "A live run dies halfway with a daily-quota 429. What happens when you rerun the same command tomorrow?",
    options: ["Everything is re-sent from the start", "Completed reports are reused; the interrupted one keeps its failures and appends new attempts", "The fixtures are deleted and rewritten", "It refuses: the fixtures already exist"],
    answer: 1,
    a: "Fixtures ending in a 200 are reused without a request. The interrupted report has the same request, digest and provider, so its failed attempts are kept and new ones appended.",
    aSay: "B. Every report whose fixture ends in a two hundred is reused, with no request at all. The interrupted report has the same request, source and provider, so its failed attempts are kept and new ones are appended. It refuses only when the request itself changed.",
  }),

  // ------------------------------------------------------------ 7
  sec("7", "Code tour III: from reply to a validated field", "Topic seven. From the model's reply to a validated field. This is where Java decides."),
  {
    kind: "code",
    title: "Extraction.build(): iterate the catalog, not the reply",
    lang: "java",
    code: `static ObjectNode build(String id, String text, JsonNode catalog, String model, JsonNode reply) {
  if (!reply.path("cases").isArray() || !reply.path("flags").isArray())
    throw new IllegalArgumentException("Model reply requires cases and flags arrays");
  var out = Json.object().put("document_id", id)
      .put("catalog_version", catalog.required("catalog_version").asText()).put("model", model);
  ...
  var evidence = Evidence.index(text);
  if (!evidence.excluded().isEmpty() && !Rules.contains(flags, "embedded_instruction_ignored"))
    flags.add("embedded_instruction_ignored");
  for (var candidate : reply.path("cases")) {
    var c = cases.addObject().put("case_index", cases.size() - 1);
    c.put("label", candidate.path("label").asText("Patient " + cases.size()));
    var fields = c.putObject("fields");
    for (var spec : catalog.required("fields")) {                 // every catalog field, in order
      String key = spec.required("id").asText();
      fields.set(key, validate(candidate.path("fields").path(key), spec, catalog, evidence));
    }
  }
  if (cases.size() > 1 && !Rules.contains(flags, "multiple_patients")) flags.add("multiple_patients");
  return out;
}`,
    highlight: [[2, 3], [4, 5], [7, 9], [14, 17], [19, 19]],
    beats: B(
      "Extraction dot java. A reply without cases and flags arrays is a visible failure, never a silent empty file.",
      "The output carries the document id, the catalog version it was validated against, and the model's name.",
      "If any paragraph was masked, the flag embedded instruction ignored is added, so the reviewer knows.",
      { say: "And the key loop. For each case, it walks the catalog, not the reply. So every catalog field appears in every case, as the brief requires. A field the model invented is ignored. And a new catalog field shows up as unknown, without a code change.", tone: "key" },
      "More than one case adds the multiple patients flag.",
    ),
  },
  {
    kind: "compare",
    title: "validate(): every failure becomes unknown, with a reason",
    cols: [
      { title: "No usable proposal", icon: "∅", tone: "blue", items: ["missing: \"No value for this field in the recording.\"", "null: \"The recording withheld this value.\"", "status unknown: the model's own note"] },
      { title: "Bad evidence or value", icon: "✗", tone: "red", items: ["no quotes, or one that won't resolve", "fails the catalog: type, option, pattern, range", "confidence not high, medium or low"] },
      { title: "Survives", icon: "✓", tone: "green", items: ["extracted: value, confidence, provenance", "conflict: no value, a note, both quotes", "conflict without a note: unknown"] },
    ],
    footer: "provenance is {quote, start, end}: start inclusive, end exclusive, in code points",
    beats: B(
      "Validate decides one field. Here are the ways it can end. No usable proposal: the field was missing, or null, or the model itself said unknown. Each gets a different note, so a reviewer knows why.",
      "Bad evidence or a bad value: no quotes, a quote that won't resolve unambiguously, a value that fails the catalog's type, options, pattern or range, or a confidence that isn't one of the three levels. All become unknown, with the reason.",
      { say: "And what survives. Extracted, with a value, a confidence, and the provenance spans. Or conflict: no value, the alternatives in a note, and the evidence for both. A conflict without a note becomes unknown.", tone: "key" },
      "Each provenance span is the quote, its start and its end. Start inclusive, end exclusive, in code points. So slicing the source from start to end gives exactly the quote.",
    ),
  },
  {
    kind: "code",
    title: "Rules.java: the seven types, generically",
    lang: "java",
    code: `static Optional<String> violation(JsonNode spec, JsonNode value) {
  String type = spec.path("type").asText();
  boolean valid = switch (type) {
    case "string" -> value.isTextual() && !value.asText().isBlank();
    case "integer" -> value.isIntegralNumber();
    case "number" -> value.isNumber() && Double.isFinite(value.doubleValue());
    case "date" -> isDate(value);              // YYYY-MM-DD and LocalDate.parse succeeds
    case "coded" -> allowed(spec, value);      // one of the option codes
    case "coded_multi", "string_list" -> arrayMatches(spec, value, type.equals("coded_multi"));
    default -> throw new IllegalArgumentException("Unrecognized catalog type " + type);
  };
  if (!valid) return Optional.of("Value fails catalog type or options (" + type + ").");
  var rule = spec.path("validation");
  if (rule.has("pattern") && !value.asText().matches(rule.get("pattern").asText()))
    return Optional.of("Value fails the catalog pattern.");
  if (value.isNumber()
      && ((rule.has("min") && value.decimalValue().compareTo(rule.get("min").decimalValue()) < 0)
          || (rule.has("max") && value.decimalValue().compareTo(rule.get("max").decimalValue()) > 0)))
    return Optional.of("Value is outside the catalog range.");
  return Optional.empty();
}`,
    highlight: [[3, 6], [7, 7], [8, 9], [12, 15], [16, 19]],
    beats: B(
      "Rules dot java. One switch on the type. A string is non blank text. An integer is integral. A number is finite.",
      { say: "A date must match year, month, day, and then actually parse. So February the thirtieth is rejected. The pattern alone would accept it.", tone: "key" },
      "Coded must be one of the option codes. Coded multi must be a non empty list of unique allowed codes. And a string list must be unique, non blank strings.",
      "Then the catalog's own rules. The pattern, for strings like initials and country codes.",
      { say: "And min and max, compared as big decimals. And here's the reuse to point at: the API calls this same method to check a reviewer's edit. The model and the human pass one gate.", tone: "key" },
    ),
  },
  arch(
    FIELD,
    FIELD_STEPS,
    B(
      "Now put it together. One real field, D01's age, from bytes to pixels.",
      "Java reads D01 dot t x t, decodes it strictly, and hashes the bytes.",
      "The report is split into passages. The sentence that gives the patient's age is passage eight.",
      "The request carries the policy in the system message, and the catalog plus the numbered passages as data.",
      { say: "The model answers: value fifty four, confidence high, quotes, eight. A passage number. Not a position.", tone: "key" },
      "That exchange is in the fixture for D01. Two rate limited attempts, four two nines, then a two hundred.",
      "Extraction checks it. An integer, inside zero to a hundred and twenty, and the number fifty four literally appears in passage eight, so it keeps high confidence.",
      { say: "The output says extracted, high, and the span: start two hundred and one, end three hundred and forty seven, with the quote.", tone: "key" },
      "And the desk slices the text by code point, highlights two oh one to three forty seven, marks it passage eight, and draws an arrow from that sentence to the three fields it feeds: initials, age and sex. If you can walk this board on a whiteboard, you can explain the whole system.",
    ),
    "One field, from bytes to pixels",
  ),
  {
    kind: "big",
    tone: "interview",
    lead: "The attack",
    text: "\"The model returns perfect JSON with a wrong value. What stops it?\"",
    after: "validation rejects what is checkable; D05's 54 was in the cited text, and cost −2",
    beats: B(
      "The attack. The model returns perfect JSON, with a value that's wrong. What stops it?",
      { say: "Honestly? Only what's checkable. A range or an option check catches an impossible value. A plausible wrong value passes. D05 gives the age as fifty four in the header and forty five in the narrative. The model chose fifty four, at high confidence. The number really is in the cited passage. It cost minus two. Catching that needs a check across the whole report, and the reviewer.", tone: "key" },
    ),
  },
  check({
    topic: "validation",
    q: "The model proposes value 130, confidence high, quotes [8] for age. What's in the output?",
    options: ["Extracted, 130, high", "Extracted, 130, lowered to medium", "Unknown: \"Value is outside the catalog range.\"", "Conflict"],
    answer: 2,
    a: "Unknown, with the note \"Value is outside the catalog range.\" The catalog says 0 to 120, and an unknown scores better than a wrong value.",
    aSay: "C. Unknown, with the note: value is outside the catalog range. The catalog says zero to a hundred and twenty, and an unknown always scores better than a wrong value.",
  }),

  // ------------------------------------------------------------ 8
  sec("8", "Calibration: what high confidence means here", "Topic eight. Calibration. What high confidence means in this code, and what it doesn't."),
  {
    kind: "big",
    tone: "idea",
    lead: "The idea",
    text: "High confidence must be earned: the cited words must literally contain the value.",
    after: "otherwise high becomes medium, with the note \"The cited wording needs interpretation.\"",
    beats: B(
      { say: "Wrong at high costs twice as much as wrong at medium. So in this code, high confidence must be earned. A model's high stays high only if the cited passages literally contain the value.", tone: "key" },
      "Otherwise it's lowered to medium, with a note: the cited wording needs interpretation, check the proposed value.",
    ),
  },
  {
    kind: "code",
    title: "Confidence.direct(): a lexical gate",
    lang: "java",
    code: `/** A lexical gate for high confidence. It cannot establish clinical correctness. */
static boolean direct(JsonNode value, Collection<Evidence.Span> spans, String type) {
  String source = String.join(" ", spans.stream().map(Evidence.Span::quote).toList())
      .toLowerCase(Locale.ROOT);
  if (value.isNumber()) {
    // some number token in the passages equals the value (BigDecimal, commas removed)
  }
  if (value.isArray()) {
    // every member appears as a whole word
  }
  if (type.equals("date")) {
    if (Pattern.compile("\\\\b(approximately|about|around|on or about)\\\\b").matcher(source).find())
      return false;
    for (String format : List.of("uuuu-MM-dd", "d MMMM uuuu", "d MMM uuuu", "MMMM d, uuuu"))
      if (contains(source, date.format(DateTimeFormatter.ofPattern(format, Locale.ENGLISH))))
        return true;
    return false;
  }
  return contains(source, value.asText());   // underscores become spaces · whole-word match
}`,
    highlight: [[1, 4], [5, 7], [8, 10], [11, 13], [14, 17], [19, 19]],
    beats: B(
      "Confidence dot java. Read the comment first: a lexical gate. It cannot establish clinical correctness. The cited passages are joined and lower cased.",
      "A number must appear as a number token in the passages. Fifty four matches fifty four, and one thousand with a comma matches one thousand.",
      "A list must have every member present as a whole word.",
      { say: "A date can never be high if the passage says approximately, about, around, or on or about. That matches the catalog's rule: a computed relative date must not be high.", tone: "key" },
      "Otherwise the date must appear in one of four English formats.",
      "And anything else, a code or a string, must appear as a whole word, with underscores read as spaces.",
    ),
  },
  {
    kind: "compare",
    title: "What the gate did to D01",
    cols: [
      { title: "Age · 54", icon: "✓", tone: "green", items: ["54 is in passage 8", "stays high"] },
      { title: "Sex · female", icon: "≈", tone: "amber", items: ["the passage says 'woman'", "lowered to medium"] },
      { title: "Initials · MK", icon: "≈", tone: "amber", items: ["the source writes M.K.", "lowered to medium, with a note"] },
    ],
    footer: "the gate only ever lowers confidence; the model's original label stays in the fixture",
    beats: B(
      "What it did to D01. The age: fifty four is literally in passage eight. It stays high.",
      "The sex: the model said female, but the passage describes a woman. The word female isn't there, so it's medium. Correct, but it needs a glance.",
      "The initials: the source writes them with full stops. So the literal M K isn't there. Medium. And the model had said high for all three. The local model even wrote the dots, M dot K dot, which brings us to the next rule.",
      { say: "The gate only ever lowers. It never raises a model's medium to high. And the model's original label is always there, in the fixture.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "Canonicalization.java: M.K. → MK, only when proven",
    lang: "java",
    code: `private static final Pattern DOTTED = Pattern.compile("(?:\\\\p{L}\\\\.)+\\\\p{L}\\\\.?");

static void apply(JsonNode reply, JsonNode originalFields, Evidence source) {
  for (var c : reply.path("cases"))
    for (var spec : originalFields) {
      if (!"string".equals(spec.path("type").asText()) || !spec.path("validation").has("pattern"))
        continue;
      ...
      if (!DOTTED.matcher(raw).matches() || Rules.violation(spec, field.get("value")).isEmpty())
        continue;                                    // not dotted, or already valid
      var canonical = Json.MAPPER.getNodeFactory().textNode(raw.replace(".", ""));
      if (Rules.violation(spec, canonical).isPresent()) continue;   // the compact form must pass
      for (var ref : field.path("quotes"))
        if (source.resolve(ref).map(s -> s.quote().contains(raw)).orElse(false)) {
          field.set("value", canonical);
          field.put("note", "Removed full stops from the source abbreviation " + raw);
          break;
        }
    }
}`,
    highlight: [[1, 1], [3, 7], [9, 10], [11, 12], [13, 18]],
    beats: B(
      "One normalisation, and only one. The initials pattern is upper case letters, no dots. So M dot K dot would fail, and become unknown.",
      "It runs only for string fields that have a pattern, and under the catalog that was originally sent to the model.",
      "The value must be a dotted abbreviation, and the original pattern must reject it.",
      "The compact form, with the dots removed, must pass.",
      { say: "And a cited passage must literally contain the dotted form. Only then is the value replaced, with a note saying exactly what was done. And the active catalog still validates the result afterwards in Extraction.", tone: "key" },
    ),
  },
  {
    kind: "trap",
    myth: "High confidence means the value is probably right.",
    truth: "It means the model said high and the cited words literally contain the value.",
    why: "There's no measured probability behind it. Measured: 1 wrong at high, 0 at medium, 0 at low (local run: 2, 1, 0).",
    beats: B(
      "And the trap to avoid in the room. High confidence means the value is probably right.",
      { say: "No. In this code it means two things: the model said high, and the cited words literally contain the value. There's no measured probability behind it.", tone: "key" },
      "A literal match can still be about the wrong patient or the wrong time. D05 is the example. On the public reports, the committed run has one wrong at high, D05's age, and none at medium or low. The local run had two, one and none.",
    ),
  },
  check({
    topic: "calibration",
    q: "Why does the gate never raise a medium to high?",
    options: ["Because the scorer forbids it", "Literal support is necessary for high, not sufficient: it can remove unsupported certainty, never add it", "Because medium scores better", "It does, for numbers"],
    answer: 1,
    a: "A literal match is necessary but not sufficient. The gate can say \"this needs interpretation\", never \"this is certain\". Raising confidence adds risk the scorer punishes at −2.",
    aSay: "B. A literal match is necessary for high, but not sufficient. So the gate can say this needs interpretation, but never this is certain. Raising a medium to high would only add risk, and the scorer punishes that at minus two.",
  }),
];
