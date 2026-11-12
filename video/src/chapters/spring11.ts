import type { Chapter } from "../lib/types.ts";
import { makeCheck } from "./checks.ts";
import { ask, B, sayit, sec } from "./core/h.ts";
import { old } from "./core/spring11old.ts";

// Spring Part 11 (src/Data/coreStackDocs/SPRING-11.md): filters vs
// interceptors, and where tenant resolution goes; reuses core/spring11old.ts.
const check = makeCheck();

export const spring11: Chapter = {
  id: "spring11",
  label: "Spring 11",
  title: "Filters vs interceptors, and tenant resolution",
  theme: "py",
  voice: "en-US-AndrewMultilingualNeural",
  pace: { normal: "-3%", ask: "-5%", aside: "+4%", excite: "+4%" },
  scenes: [
    old("cardlist"),
    {
      kind: "title",
      eyebrow: "Spring · Part 11",
      title: "Filters vs interceptors",
      subtitle: "which runs first, what each can see, and where tenant resolution goes",
      beats: B("Spring, part eleven. Filters versus interceptors. It's a stock Spring question, which runs first, and which can see the controller method, often with code asked for. And the design follow-up: where does tenant resolution go?"),
    },
    ask("Filter vs interceptor: where does each run, and which would you use?", "order, what each can see, and a rule for choosing", "Filter versus interceptor. Where does each run, and which would you use?", "Three parts to a good answer: the order they run in, what each one can see, and a rule for choosing. Let's build each part."),

    // ================================================================ 1
    sec("1", "The order", "Part one. The order things run in."),
    old("pipeline2", { 4: "Now, what a filter can do, and can't." }),

    // ================================================================ 2
    sec("2", "Filters and interceptors", "Part two. What each one can see."),
    old("filterwrap", { 4: "And interceptors." }),
    old("hooks"),
    {
      kind: "code",
      title: "Both, side by side",
      lang: "java",
      code: `@Component
class CorrelationFilter extends OncePerRequestFilter {        // servlet level
  protected void doFilterInternal(HttpServletRequest req,
        HttpServletResponse res, FilterChain chain) throws … {
    MDC.put("cid", Optional.ofNullable(req.getHeader("X-Correlation-Id"))
                           .orElse(UUID.randomUUID().toString()));
    try { chain.doFilter(req, res); } finally { MDC.remove("cid"); }
  }
}

class AuditInterceptor implements HandlerInterceptor {      // Spring MVC level
  public boolean preHandle(HttpServletRequest req,
        HttpServletResponse res, Object handler) {
    if (handler instanceof HandlerMethod m && m.hasMethodAnnotation(Audited.class))
      audit.start(req, m.getMethod().getName());
    return true;                                // false = stop, controller never runs
  }
}
// registered in a WebMvcConfigurer: registry.addInterceptor(…).addPathPatterns("/api/**")`,
      highlight: [[1, 9], [11, 18], [19, 19]],
      beats: B(
        "A filter: once per request filter, at the servlet level. This one puts a correlation id into the logging context for every request, and always removes it in finally. It sees the raw request, and it wraps the whole chain.",
        "An interceptor: a handler interceptor, at the Spring MVC level. Its pre handle receives the handler, the actual controller method, so it can read annotations, like audited. Returning false stops the request before the controller.",
        { say: "Filters are registered as beans or with a filter registration. Interceptors are registered in a web MVC configurer, with path patterns.", tone: "key" },
      ),
    },
    old("choose", { 2: "So, the design question: where does tenant resolution go?" }),
    {
      kind: "compare",
      title: "Filter vs interceptor vs AOP aspect",
      cols: [
        { title: "Filter", tone: "blue", items: ["Servlet container, before DispatcherServlet", "Every request, raw request/response", "Auth, CORS, correlation ids, compression"] },
        { title: "Interceptor", tone: "green", items: ["Spring MVC, around the controller", "Knows the handler method + annotations", "Per-endpoint checks, audit, timing"] },
        { title: "AOP aspect", tone: "amber", items: ["Any Spring bean method, via a proxy", "Not tied to HTTP at all", "@Transactional, @Cacheable, @PreAuthorize"] },
      ],
      footer: "Raw request or before security → filter · needs the handler → interceptor · business methods → aspect",
      beats: B(
        "Interviewers sometimes add a third option. A filter belongs to the servlet container, and runs before Spring MVC for every request.",
        "An interceptor belongs to Spring MVC, and wraps the controller, knowing which method will run.",
        { say: "And an AOP aspect wraps any Spring bean's methods through a proxy, with nothing to do with HTTP. That's how transactional, cacheable and pre authorize work. So: raw requests and security, a filter. Needs the handler, an interceptor. Business methods, an aspect.", tone: "key" },
      ),
    },
    sayit("Filter vs interceptor: where does each run, and which would you use?", "Say it like this:", [
      ["Filters run in the servlet container, before DispatcherServlet; interceptors run inside Spring MVC", "Filters run in the servlet container, before the dispatcher servlet. Interceptors run inside Spring MVC, around the controller."],
      ["Order: filters → DispatcherServlet → preHandle → controller → postHandle → afterCompletion", "So the order is filters, the dispatcher servlet, pre handle, the controller, post handle, after completion, and back out through the filters."],
      ["Filters see every raw request; interceptors know the handler method and its annotations", "Filters see every raw request, including static files and errors. Interceptors know the handler method and its annotations."],
      ["Filters for auth, CORS, correlation ids; interceptors for per-endpoint checks and timing", "So filters for authentication, CORS and correlation ids. Interceptors for per-endpoint checks, auditing and timing."],
      ["postHandle is skipped on exceptions; afterCompletion always runs", "And a detail they like: post handle is skipped when the controller throws, while after completion always runs."],
    ]),

    // ================================================================ 3
    sec("3", "Tenant resolution", "Part three. The design question: in a multi-tenant API, where does tenant resolution go?"),
    old("tenantflow"),
    {
      kind: "code",
      title: "A tenant filter, after authentication",
      lang: "java",
      code: `class TenantFilter extends OncePerRequestFilter {
  protected void doFilterInternal(HttpServletRequest req,
        HttpServletResponse res, FilterChain chain) throws … {
    var auth = (JwtAuthenticationToken) SecurityContextHolder
                   .getContext().getAuthentication();
    String tenant = auth.getToken().getClaimAsString("tenant_id");  // from the token,
    TenantContext.set(tenant);                                       // never a header
    try {
      chain.doFilter(req, res);
    } finally {
      TenantContext.clear();                    // threads are reused
    }
  }
}
// http.addFilterAfter(new TenantFilter(), BearerTokenAuthenticationFilter.class)`,
      highlight: [[4, 7], [8, 12], [15, 15]],
      beats: B(
        "The tenant comes from the verified token's claim, not from a header the client could change. Put it in a tenant context, usually a thread local.",
        "Run the rest of the chain, and clear the context in finally, always, because Tomcat reuses threads. Forget it, and the next request on this thread runs as the previous tenant.",
        { say: "And place the filter right after the bearer token filter in the security chain, so the token is already verified. The data layer then scopes every query by tenant, for example with a Hibernate filter or row-level security in Postgres.", tone: "key" },
      ),
    },
    sayit("Where does tenant resolution go?", "The answer:", [
      ["A filter in the security chain, right after authentication", "In a filter inside the security chain, right after authentication."],
      ["Tenant from a verified token claim, not a client-controlled header", "The tenant comes from a verified claim in the token, never from a header the client controls."],
      ["Stored in a ThreadLocal context, cleared in finally (threads are pooled)", "It goes into a thread-local tenant context, cleared in finally, because threads are pooled."],
      ["Every query scoped by tenant; copy the context to async threads", "Every query is scoped by that tenant, and the context is copied explicitly to async threads, which don't inherit it."],
    ]),
    check({
      topic: "interceptors",
      q: "You need to reject calls to methods annotated @AdminOnly for non-admins. Filter or interceptor, and why?",
      say: "You need to reject calls to methods annotated admin only, for non-admins. Filter or interceptor, and why?",
      a: "Interceptor (or method security): only it receives the HandlerMethod, so it can read the annotation. A filter runs before the handler is known.",
      aSay: "An interceptor, or method security. Only the interceptor receives the handler method, so it can read the annotation. A filter runs before anyone knows which controller will handle the request.",
    }),
    check({
      topic: "tenant",
      q: "Requests occasionally see another tenant's data under load. What's the likely bug?",
      say: "Under load, requests occasionally see another tenant's data. What's the likely bug?",
      a: "The tenant ThreadLocal isn't cleared (no finally), so a pooled thread keeps the previous request's tenant. Or async work running on another thread without copying/clearing the context.",
      aSay: "The tenant thread local isn't cleared in a finally, so a reused thread still carries the previous request's tenant. Or async work runs on another thread without the context being copied and cleared.",
    }),
    {
      kind: "drill",
      items: [
        { q: "What runs first, filter or interceptor?", a: "The filter" },
        { q: "Who knows the controller method?", a: "The interceptor" },
        { q: "Skipped when the controller throws?", a: "postHandle" },
        { q: "Always runs?", a: "afterCompletion" },
        { q: "Where does the tenant come from?", a: "A verified token claim" },
        { q: "Why clear the ThreadLocal?", a: "Threads are reused" },
      ],
      beats: B(
        { say: "Rapid fire. What runs first, a filter or an interceptor?", hold: 3 },
        "The filter.",
        { say: "Which one knows the controller method?", hold: 3 },
        "The interceptor.",
        { say: "Which hook is skipped when the controller throws?", hold: 3 },
        "Post handle.",
        { say: "Which one always runs?", hold: 3 },
        "After completion.",
        { say: "Where does the tenant come from?", hold: 3 },
        "A verified claim in the token.",
        { say: "Why clear the thread local?", hold: 3 },
        { say: "Because threads are reused. That's filters and interceptors.", tone: "key" },
      ),
    },
  ],
};
