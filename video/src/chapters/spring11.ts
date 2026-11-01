import type { Chapter } from "../lib/types.ts";

// Spring Part 11 (src/Data/coreStackDocs/SPRING-11.md): the request's path
// through filters and interceptors, what each can see, and tenant resolution.

export const spring11: Chapter = {
  id: "spring11",
  label: "Spring 11",
  title: "Filters vs interceptors, and tenant resolution",
  voice: "en-US-AndrewMultilingualNeural",
  scenes: [
    {
      kind: "custom",
      name: "cardlist",
      props: {
        title: "Every request needs three things",
        items: [
          ["🏢", "which tenant is calling", "and no data from any other"],
          ["🔖", "a correlation id", "on every log line"],
          ["⏱️", "timing and audit", "for some endpoints"],
        ],
      },
      beats: [
        { say: "A multi tenant API needs a few things on every single request." },
        { say: "Which tenant is calling, with no chance of seeing another tenant's data." },
        { say: "A correlation id, on every log line." },
        { say: "And timing, or an audit, for some endpoints. Each could live in a filter, an interceptor, or an aspect. Which runs first, and what can each one see?", tone: "ask" },
      ],
    },
    {
      kind: "title",
      eyebrow: "Spring · Part 11",
      title: "Filters vs interceptors",
      subtitle: "and where tenant resolution goes",
      beats: [{ say: "Spring, part eleven. Filters versus interceptors." }],
    },

    { kind: "section", num: "1", title: "The order", beats: [{ say: "First, the order everything runs in." }] },
    {
      kind: "custom",
      name: "pipeline2",
      beats: [
        { say: "Tomcat passes the request through every servlet filter. Spring Security's whole chain is one of them. Then the dispatcher servlet picks the controller method." },
        { say: "Now Spring MVC's interceptors run their pre handle. Then the controller." },
        { say: "Then post handle, and finally after completion." },
        { say: "And the response unwinds back out, through the filters again.", tone: "key" },
      ],
    },

    { kind: "section", num: "2", title: "Filters", beats: [{ say: "Now, what a filter can do." }] },
    {
      kind: "custom",
      name: "filterwrap",
      beats: [
        {
          say: "A filter belongs to the servlet container, not to Spring MVC. It runs code before and after the rest of the chain, around one call: chain dot do filter. Here, a correlation id goes into the logging context, and is removed in finally.",
          term: { word: "Filter", meaning: "servlet-level code around every request" },
        },
        { say: "It sees every request, even static files and errors. And it sees the raw request and response, so it can wrap them, for example to log a body." },
        { say: "But it doesn't know which controller will run. And its exceptions never reach controller advice." },
        { say: "So filters are for authentication, CORS, correlation ids, logging and rate limiting.", tone: "key" },
      ],
    },

    { kind: "section", num: "3", title: "Interceptors", beats: [{ say: "Next, interceptors." }] },
    {
      kind: "custom",
      name: "hooks",
      beats: [
        {
          say: "A handler interceptor belongs to Spring MVC. You register it in a web MVC configurer, for chosen paths.",
          term: { word: "HandlerInterceptor", meaning: "Spring MVC hooks around the controller" },
        },
        { say: "Pre handle runs before the controller, and receives the handler: the actual controller method. So it can read the method's annotations, like a custom at audited. That's what a filter can't do. Return false, and the request stops.", tone: "key" },
        { say: "Post handle runs after the controller, but it's skipped if the controller threw. And for REST, the body is already written, so it's too late to change it." },
        { say: "After completion always runs, even after an exception. That's the place for timing and cleanup." },
        { say: "To change a REST body, use response body advice. And for method arguments, in any layer, use an aspect.", tone: "aside" },
      ],
    },
    {
      kind: "custom",
      name: "choose",
      beats: [
        { say: "So the rule. Every raw request, or before security: a filter. Needs the controller method or its annotations: an interceptor. Needs method arguments, anywhere: an aspect." },
        { say: "Auth, CORS and correlation ids go in filters. Annotation checks and per handler audit go in interceptors.", tone: "key" },
      ],
    },

    { kind: "section", num: "4", title: "Tenant resolution", beats: [{ say: "Now the design question: where does tenant resolution go?", tone: "excite" }] },
    {
      kind: "custom",
      name: "tenantflow",
      beats: [
        {
          say: "In a filter, placed right after authentication in the security chain. It reads the tenant from the signed JWT claim, checks any tenant header against it, and stores it in a thread local tenant context.",
          term: { word: "TenantContext", meaning: "a ThreadLocal holding the current tenant" },
        },
        { say: "The data layer reads that context, and scopes every query to the tenant." },
        { say: "And in finally, the filter clears it. Here's why that matters.", tone: "key" },
        { say: "Tomcat reuses threads. Thread seven serves tenant A, and nobody clears the context. The next request on thread seven, from tenant B, still sees A. Tenant B reads tenant A's data.", tone: "excite" },
        { say: "Async methods run on other threads, so copy the tenant with a task decorator. Kafka listeners get it from a message header. And enforce it in the database too, as defence in depth.", tone: "aside" },
      ],
    },
    {
      kind: "custom",
      name: "recap",
      props: {
        items: [
          ["⛓️", "Order", "filters, dispatcher, interceptors"],
          ["🧰", "Filter", "every raw request"],
          ["🪝", "Interceptor", "knows the controller method"],
          ["⏹️", "postHandle", "skipped on exceptions"],
          ["🏢", "Tenant filter", "after auth, from the JWT"],
          ["🧹", "finally clear()", "threads are reused"],
        ],
      },
      beats: [
        { say: "Let's lock it in." },
        { say: "Filters run first, then the dispatcher servlet, then interceptors." },
        { say: "A filter sees every raw request." },
        { say: "An interceptor knows the controller method, and its annotations." },
        { say: "Post handle is skipped on exceptions. After completion always runs." },
        { say: "Resolve the tenant in a filter after authentication, from the JWT." },
        { say: "And always clear the thread local, because threads are reused.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "recall",
      props: { a: "from memory: draw a request through filters, DispatcherServlet and the three hooks", b: "then place the tenant filter in the security chain, and say why it must clear the ThreadLocal" },
      beats: [
        { say: "Before your interview: from memory, draw a request through the filters, the dispatcher servlet, and the three interceptor hooks." },
        { say: "Then place the tenant filter in the security chain, and say why it must clear the thread local.", tone: "key", hold: 3 },
      ],
    },
    {
      kind: "title",
      eyebrow: "Spring · Part 11",
      title: "That's filters and interceptors",
      subtitle: "you're ready for the Spring round",
      beats: [{ say: "That's filters and interceptors. Good luck in the interview.", tone: "excite" }],
    },
  ],
};
