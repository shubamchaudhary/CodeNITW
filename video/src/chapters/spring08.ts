import type { Chapter } from "../lib/types.ts";
import { makeCheck } from "./checks.ts";
import { B, sayit, sec } from "./core/h.ts";
import { old } from "./core/spring08old.ts";
import { qa } from "./web/h.ts";

// Spring Part 8 (src/Data/coreStackDocs/SPRING-08.md): exception handling and
// error contracts, question by question; reuses core/spring08old.ts.
const check = makeCheck();

export const spring08: Chapter = {
  id: "spring08",
  label: "Spring 8",
  title: "Exception handling: @ControllerAdvice and error contracts",
  theme: "py",
  voice: "en-US-AndrewMultilingualNeural",
  pace: { normal: "-3%", ask: "-5%", aside: "+4%", excite: "+4%" },
  scenes: [
    old("fivehundred"),
    {
      kind: "title",
      eyebrow: "Spring · Part 8",
      title: "Exception handling",
      subtitle: "@ControllerAdvice, ProblemDetail, and where exceptions are translated",
      beats: B("Spring, part eight. Exception handling. Global exception handling, and where exception translation should happen, show up in nearly every Spring write-up. It's one pattern, done well."),
    },
    {
      kind: "bullets",
      title: "What interviews ask on this topic",
      firstItemStep: 1,
      items: [
        { icon: "🌐", text: "How do you implement global exception handling in Spring Boot?" },
        { icon: "🎯", text: "@ControllerAdvice vs @RestControllerAdvice vs @ExceptionHandler: the scope of each" },
        { icon: "🧾", text: "What should an error response look like? (ProblemDetail, RFC 9457)" },
      ],
      beats: B(
        "Three questions.",
        "How you implement global exception handling.",
        "The three annotations, and the scope of each.",
        { say: "And what an error response should look like. Then the design point that ties them together: which layer should know about HTTP at all.", tone: "key" },
      ),
    },

    // ================================================================ 1
    sec("1", "How Spring handles an exception", "Question one. How does global exception handling work? Follow one exception."),
    old("resolvers", { 5: "So, the three annotations." }),

    // ================================================================ 2
    sec("2", "The three annotations", "Question two. Controller advice, rest controller advice, and exception handler: the scope of each."),
    old("scopes", { 4: "Here's the whole thing in code." }),
    {
      kind: "code",
      title: "One global handler, returning ProblemDetail",
      lang: "java",
      code: `@RestControllerAdvice                       // every controller, JSON
public class ApiErrors {
    @ExceptionHandler(OrderNotFound.class)
    ProblemDetail notFound(OrderNotFound e) {
        var p = ProblemDetail.forStatusAndDetail(NOT_FOUND, e.getMessage());
        p.setProperty("orderId", e.orderId());
        return p;
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail invalid(MethodArgumentNotValidException e) {
        var p = ProblemDetail.forStatus(BAD_REQUEST);
        p.setProperty("errors", fieldErrors(e));   // field + message
        return p;
    }
    @ExceptionHandler(Exception.class)           // last resort
    ProblemDetail unexpected(Exception e) {
        log.error("unhandled", e);               // stack trace in logs only
        return ProblemDetail.forStatus(500);
    }
}`,
      highlight: [[1, 2], [3, 8], [9, 14], [15, 19]],
      beats: B(
        "One class, marked rest controller advice, applies to every controller, and writes JSON.",
        "Each exception handler method maps one exception type to a response. A domain exception, order not found, becomes a four oh four problem detail, with a type, a message, and the order id.",
        "Validation failures from at valid arrive as method argument not valid exception. Map them to a four hundred, with the list of field errors, so a form can show each message next to its field.",
        { say: "And a last-resort handler for any other exception: log it with the stack trace, and return a plain five hundred. Never send a stack trace to a client. The most specific handler wins, so this one only catches what nothing else did.", tone: "key" },
      ),
    },
    sayit("How do you implement global exception handling in Spring Boot?", "Say it like this:", [
      ["A @RestControllerAdvice class with @ExceptionHandler methods, one per exception type", "A rest controller advice class, with exception handler methods, one per exception type."],
      ["Local handlers in a controller beat global ones; the most specific type wins", "A handler inside a controller beats a global one, and the most specific exception type wins."],
      ["Return ProblemDetail (RFC 9457); validation errors as 400 with field details", "Each returns a problem detail, the standard error body, with validation errors as a four hundred listing the fields."],
      ["A catch-all logs and returns 500; filters' exceptions never reach the advice", "A catch-all logs and returns a five hundred. And remember: exceptions thrown in filters, like Spring Security's, never reach the advice."],
    ]),

    // ================================================================ 3
    sec("3", "The error contract", "Question three. What should an error response look like?"),
    old("problem", { 4: "One last design point: which layer should know about HTTP?" }),
    qa(1, "Problem Details in Spring: what do you turn on?", [
      "Return ProblemDetail from handlers (Spring 6+); content type application/problem+json",
      "spring.mvc.problemdetails.enabled=true makes Spring's own errors (400, 404, 405, 415) use it too",
      "Or extend ResponseEntityExceptionHandler to customise those built-in cases",
      "Same shape everywhere, including 401/403 from the security chain (entry point, access-denied handler)",
    ], { ask: "And the Spring side of it: what do you turn on to get problem details everywhere?" }),

    // ================================================================ 4
    sec("4", "Translate at the edge", "And the design point that ties it together: where exception translation happens."),
    old("translate"),
    check({
      topic: "advice",
      q: "Your JWT filter throws ExpiredJwtException, but the @RestControllerAdvice handler for it never runs. Why?",
      say: "Your JWT filter throws an expired JWT exception, but your rest controller advice handler for it never runs. Why?",
      a: "Filters run before the DispatcherServlet, so controller advice never sees their exceptions. Handle them in the filter / AuthenticationEntryPoint (or Spring's resource server, which returns 401).",
      aSay: "Because filters run before the dispatcher servlet, so controller advice never sees their exceptions. Handle it in the filter, or the authentication entry point, which is what Spring's resource server does.",
    }),
    check({
      topic: "error codes",
      q: "Which status for: invalid input, unknown order, duplicate email, an unexpected bug?",
      say: "Which status code for: invalid input, an unknown order, a duplicate email, and an unexpected bug?",
      a: "400 (or 422), 404, 409 Conflict, 500 (with a trace id, no stack trace).",
      aSay: "Four hundred for invalid input, four oh four for the unknown order, four oh nine conflict for the duplicate email, and five hundred for the bug, with a trace id and no stack trace.",
    }),
    {
      kind: "drill",
      items: [
        { q: "@RestControllerAdvice = ?", a: "@ControllerAdvice + @ResponseBody" },
        { q: "Local or global handler wins?", a: "Local" },
        { q: "Standard error body?", a: "ProblemDetail, RFC 9457" },
        { q: "Validation exception type?", a: "MethodArgumentNotValidException" },
        { q: "Should services throw ResponseStatusException?", a: "No: domain exceptions" },
        { q: "Do filter exceptions reach advice?", a: "No" },
      ],
      beats: B(
        { say: "Rapid fire. Rest controller advice equals?", hold: 3 },
        "Controller advice, plus response body.",
        { say: "Local handler or global handler: which wins?", hold: 3 },
        "The local one, in the controller.",
        { say: "The standard error body?", hold: 3 },
        "Problem details, RFC ninety four fifty seven.",
        { say: "The exception type for a failed at valid?", hold: 3 },
        "Method argument not valid exception.",
        { say: "Should a service throw response status exception?", hold: 3 },
        "No. It throws domain exceptions, and the edge translates them.",
        { say: "Do exceptions from filters reach controller advice?", hold: 3 },
        { say: "No. That's exception handling.", tone: "key" },
      ),
    },
  ],
};
