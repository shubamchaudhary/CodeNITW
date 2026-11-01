import type { Chapter } from "../lib/types.ts";

// Spring Part 8 (src/Data/coreStackDocs/SPRING-08.md): the exception resolver
// chain, advice scopes, ProblemDetail, and translating at the web edge.

export const spring08: Chapter = {
  id: "spring08",
  label: "Spring 8",
  title: "Exception handling: @ControllerAdvice and error contracts",
  voice: "en-US-AndrewMultilingualNeural",
  scenes: [
    {
      kind: "custom",
      name: "fivehundred",
      beats: [
        { say: "Get order nine nine nine. The order doesn't exist, the service throws, and with no handling, the client gets a five hundred. Maybe even a stack trace, with your class names in it." },
        { say: "What you want is a four oh four, with a body every client can parse." },
        { say: "Built in one place, in one shape, for the whole API.", tone: "key" },
      ],
    },
    {
      kind: "title",
      eyebrow: "Spring · Part 8",
      title: "Exception handling",
      subtitle: "@ControllerAdvice, ProblemDetail, error contracts",
      beats: [{ say: "Spring, part eight. Exception handling." }],
    },

    { kind: "section", num: "1", title: "Who catches it", beats: [{ say: "First: who catches a thrown exception?" }] },
    {
      kind: "custom",
      name: "resolvers",
      beats: [
        { say: "The controller throws. The dispatcher servlet asks a list of exception resolvers, in order, to turn it into a response." },
        {
          say: "First, the exception handler resolver. It looks for an exception handler method: in the controller that threw, then in controller advice classes.",
          term: { word: "HandlerExceptionResolver", meaning: "turns a thrown exception into a response" },
        },
        { say: "If nothing matches, the response status resolver handles exceptions marked with at response status, or a response status exception." },
        { say: "Then Spring's own mappings: a missing parameter is four hundred, a wrong method four oh five. And anything left falls through to the slash error page: a five hundred." },
        { say: "And the trap. An exception thrown in a servlet filter, including Spring Security's four oh one and four oh three, happens before the dispatcher servlet. Controller advice never sees it.", tone: "key" },
      ],
    },

    { kind: "section", num: "2", title: "Advice and its scope", beats: [{ say: "Now the three annotations." }] },
    {
      kind: "custom",
      name: "scopes",
      beats: [
        { say: "An exception handler method inside a controller handles that controller's exceptions, and nothing else." },
        {
          say: "Put it in a class marked controller advice, and it applies to every controller. Or to the ones you pick, by package or type.",
          term: { word: "@ControllerAdvice", meaning: "exception handlers shared across controllers" },
        },
        { say: "Rest controller advice is the same thing, plus response body, so return values become JSON. That's the one for REST APIs." },
        { say: "The rules: local beats global. The most specific exception type wins. Order several advices with at order. And add one catch all for exception, returning a clean five hundred with a trace id, never a stack trace.", tone: "key" },
      ],
    },

    { kind: "section", num: "3", title: "The error contract", beats: [{ say: "So what should the body look like?" }] },
    {
      kind: "custom",
      name: "problem",
      beats: [
        {
          say: "There's a standard: RFC nine four five seven, problem details. Type is a URI naming the kind of error. Clients switch on it, not on the message.",
          term: { word: "ProblemDetail", meaning: "the RFC 9457 error body: type, title, status..." },
        },
        { say: "Title is a fixed summary for that type. Status repeats the HTTP code. Detail describes this occurrence. And instance says which request failed." },
        { say: "Then add extensions. A trace id lets support find the exact log line, while the stack trace stays in your logs.", tone: "key" },
        { say: "In Spring six, return a problem detail from your handler. And turn on problem details, so Spring's own errors use the same shape." },
      ],
    },

    { kind: "section", num: "4", title: "Translate at the edge", beats: [{ say: "Last: which layer should know about HTTP?" }] },
    {
      kind: "custom",
      name: "translate",
      beats: [
        { say: "If the service throws a response status exception, HTTP has leaked into your business layer. And when a Kafka consumer calls the same service, what does a four oh four even mean there?", tone: "ask" },
        {
          say: "So the service throws a domain exception: order not found. It knows nothing about HTTP. One rest controller advice, at the web edge, maps each domain exception to a status and a problem detail.",
          tone: "key",
          term: { word: "Domain exception", meaning: "names the business problem, no HTTP" },
        },
        { say: "Get the codes right. Four hundred for invalid input. Four oh four not found. Four oh nine for a conflict. Four twenty two for a broken business rule. And five hundred only for our own bugs." },
        { say: "Validation failures throw method argument not valid exception. Map it to four hundred, with every field error listed." },
        { say: "And make domain exceptions unchecked. No throws clauses everywhere, and transactional rolls back on them by default.", tone: "aside" },
      ],
    },
    {
      kind: "custom",
      name: "recap",
      props: {
        items: [
          ["🪜", "Resolver chain", "handler, status, defaults, /error"],
          ["🌐", "@RestControllerAdvice", "global handlers, JSON"],
          ["🎯", "Most specific wins", "local beats global"],
          ["📄", "ProblemDetail", "RFC 9457 contract"],
          ["🧱", "Domain exceptions", "no HTTP in services"],
          ["🚧", "Filter exceptions", "never reach advice"],
        ],
      },
      beats: [
        { say: "Let's lock it in." },
        { say: "Resolvers run in order: handler methods, response status, Spring's defaults, then slash error." },
        { say: "Rest controller advice holds global handlers, returning JSON." },
        { say: "The most specific, most local handler wins." },
        { say: "Problem details is the standard error contract." },
        { say: "Services throw domain exceptions, with no HTTP in them." },
        { say: "And exceptions from filters never reach controller advice.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "recall",
      props: { a: "from memory: draw the resolver chain from a throw to /error", b: "then write the five ProblemDetail fields, and a handler mapping a domain exception to 404" },
      beats: [
        { say: "Before your interview: from memory, draw the resolver chain, from a thrown exception, to slash error." },
        { say: "Then write the five problem detail fields, and a handler mapping a domain exception to four oh four.", tone: "key", hold: 3 },
      ],
    },
    {
      kind: "title",
      eyebrow: "Spring · Part 8",
      title: "That's exception handling",
      subtitle: "next: filters vs interceptors",
      beats: [{ say: "That's exception handling. Next: filters versus interceptors.", tone: "excite" }],
    },
  ],
};
