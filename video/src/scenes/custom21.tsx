// Spring Parts 8 and 11 scenes: an exception falling through the resolvers,
// the reach of each advice annotation, a ProblemDetail body, translating at
// the web edge; then a request's trip through filters and interceptors, a
// filter wrapping the chain, the three interceptor hooks, and tenant context.
// Widths only, never heights; the top-right corner stays free for the term card.
import { C, MONO } from "../lib/theme.ts";
import { ease, enter, lerp, pop, rise } from "../lib/anim.ts";
import { Abs, card, Chip } from "./ui.tsx";
import { at, Big, clamp01 } from "./custom3.tsx";
import { type CP, Svg } from "./secui.tsx";

// ================================================================== Part 8

export const FiveHundred = ({ t }: CP) => {
  const f = t.frame;
  return (
    <>
      <Abs x={160} y={270} w={760} style={{ ...card(C.blue), padding: "16px 22px", fontFamily: MONO, fontSize: 28, ...rise(f, 4) }}>GET /orders/999</Abs>
      <Abs x={160} y={370} w={760} style={{ ...card(C.red), padding: "16px 22px", fontFamily: MONO, fontSize: 20, lineHeight: 1.5, ...rise(f, 30) }}>
        <div style={{ fontSize: 28, color: C.red, fontWeight: 800, fontFamily: "inherit" }}>500 Internal Server Error</div>
        com.shop.OrderNotFoundException: 999
        <br />
        &nbsp;&nbsp;at com.shop.OrderService.find(OrderService.java:42)
        <br />
        &nbsp;&nbsp;at jdk.internal.reflect…
      </Abs>
      {t.step >= 1 && (
        <Abs x={1000} y={370} w={760} style={{ ...card(C.green), padding: "16px 22px", fontFamily: MONO, fontSize: 22, lineHeight: 1.5, ...rise(f, at(t, 1)) }}>
          <div style={{ fontSize: 28, color: C.green, fontWeight: 800, fontFamily: "inherit" }}>404 · application/problem+json</div>
          {'{ "title": "Order not found",'}
          <br />
          {'  "status": 404, "detail": "Order 999 does not exist" }'}
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={160} y={700} w={1600} style={{ textAlign: "center", ...rise(f, at(t, 2)) }}>
          <Big size={38}>one place, one shape, for the whole API</Big>
        </Abs>
      )}
    </>
  );
};

export const Resolvers = ({ t }: CP) => {
  const f = t.frame;
  const layers = [
    { n: "ExceptionHandlerExceptionResolver", s: "@ExceptionHandler: this controller, then advice", col: C.green, step: 1 },
    { n: "ResponseStatusExceptionResolver", s: "@ResponseStatus · ResponseStatusException", col: C.blue, step: 2 },
    { n: "DefaultHandlerExceptionResolver", s: "Spring's own: 400 · 405 · 415", col: C.purple, step: 3 },
    { n: "servlet /error → BasicErrorController", s: "the 500 fallback", col: C.red, step: 3 },
  ];
  const caught = Math.min(t.step, 3);
  const ballY = t.step === 0 ? lerp(250, 300, ease(f, 20, 20)) : lerp(330, 330 + (caught - 1) * 120, ease(f, at(t, Math.max(1, caught)), 30));
  return (
    <>
      <Abs x={160} y={250} w={460} style={{ ...card(C.red), padding: "12px 18px", fontFamily: MONO, fontSize: 22, ...rise(f, 4) }}>throw OrderNotFoundException</Abs>
      {t.step >= 1 &&
        layers.map((l, i) => (
          <Abs key={l.n} x={700} y={320 + i * 120} w={1060} style={{ ...card(t.step >= l.step && i === caught - 1 && t.step < 4 ? l.col : C.line), padding: "12px 20px", opacity: Math.min(1, pop(f, at(t, 1) + i * 10)) }}>
            <div style={{ fontSize: 26, fontWeight: 800 }}>
              {i + 1}. {l.n}
            </div>
            <div style={{ fontSize: 20, color: C.muted }}>{l.s}</div>
          </Abs>
        ))}
      {t.step >= 1 && t.step < 4 && <div style={{ position: "absolute", left: 640, top: ballY, width: 36, height: 36, borderRadius: 18, background: C.red }} />}
      {t.step >= 4 && (
        <Abs x={160} y={820} w={1600} style={{ ...rise(f, at(t, 4)) }}>
          <Chip color={C.amber} style={{ fontSize: 24 }}>thrown in a filter (incl. Security's 401/403)? before DispatcherServlet: advice never sees it</Chip>
        </Abs>
      )}
    </>
  );
};

export const Scopes = ({ t }: CP) => {
  const f = t.frame;
  const ctrls = ["OrderController", "UserController", "CartController"];
  const big = t.step >= 1;
  return (
    <>
      {ctrls.map((c, i) => (
        <Abs key={c} x={260 + i * 460} y={380} w={400} style={{ ...card(i === 0 || big ? C.green : C.line), padding: "16px 0", textAlign: "center", fontSize: 26, fontWeight: 700, ...rise(f, 6 + i * 8) }}>
          {c}
          {i === 0 && <div style={{ fontFamily: MONO, fontSize: 18, color: C.green }}>@ExceptionHandler inside</div>}
        </Abs>
      ))}
      <Svg>
        <rect x={240} y={360} width={440} height={140} rx={24} fill="none" stroke={C.green} strokeWidth={3} strokeDasharray="10 8" opacity={enter(f, 30)} />
        {big && <rect x={200} y={310} width={1480} height={240} rx={30} fill="none" stroke={C.purple} strokeWidth={4} strokeDasharray="14 10" opacity={enter(f, at(t, 1))} />}
      </Svg>
      <Abs x={160} y={260} w={800} style={{ fontSize: 24, color: C.green, ...rise(f, 30) }}>@ExceptionHandler in a controller: that controller only</Abs>
      {big && (
        <Abs x={160} y={580} w={1600} style={{ fontSize: 26, color: C.purple, ...rise(f, at(t, 1) + 10) }}>
          @ControllerAdvice: every controller, or ones you pick (basePackages, assignableTypes)
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={160} y={650} w={1600} style={{ fontSize: 26, ...rise(f, at(t, 2)) }}>
          @RestControllerAdvice = @ControllerAdvice + @ResponseBody → returns JSON
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={160} y={740} w={1600} style={{ display: "flex", gap: 14, flexWrap: "wrap", ...rise(f, at(t, 3)) }}>
          <Chip color={C.green} style={{ fontSize: 22 }}>local beats global</Chip>
          <Chip color={C.blue} style={{ fontSize: 22 }}>most specific exception type wins</Chip>
          <Chip color={C.purple} style={{ fontSize: 22 }}>@Order between advices</Chip>
          <Chip color={C.amber} style={{ fontSize: 22 }}>catch-all Exception → 500 + traceId, no stack trace</Chip>
        </Abs>
      )}
    </>
  );
};

export const Problem = ({ t }: CP) => {
  const f = t.frame;
  const fields: [string, string, string, number][] = [
    ['"type"', '"https://api.example/errors/order-not-found"', "what kind of error: clients switch on it", 0],
    ['"title"', '"Order not found"', "fixed summary for the type", 1],
    ['"status"', "404", "the HTTP status, repeated", 1],
    ['"detail"', '"Order 999 does not exist"', "this occurrence", 1],
    ['"instance"', '"/orders/999"', "which request", 1],
    ['"traceId"', '"4bf92f3577b34da6"', "an extension: find the log line", 2],
  ];
  return (
    <>
      <Abs x={160} y={260} w={1600} style={{ fontFamily: MONO, fontSize: 22, color: C.muted, ...rise(f, 4) }}>Content-Type: application/problem+json</Abs>
      {fields.map(([k, v, why, st], i) =>
        t.step >= st ? (
          <Abs key={k} x={160} y={310 + i * 70} w={1600} style={{ display: "flex", gap: 20, alignItems: "center", opacity: Math.min(1, pop(f, at(t, st) + i * 8)) }}>
            <span style={{ fontFamily: MONO, fontSize: 26, color: st === 2 ? C.amber : C.purple, width: 180 }}>{k}</span>
            <span style={{ fontFamily: MONO, fontSize: 24, width: 820 }}>{v}</span>
            <span style={{ fontSize: 22, color: C.muted }}>{why}</span>
          </Abs>
        ) : null,
      )}
      {t.step >= 3 && (
        <Abs x={160} y={760} w={1600} style={{ display: "flex", gap: 14, flexWrap: "wrap", ...rise(f, at(t, 3)) }}>
          <Chip color={C.green} style={{ fontSize: 22 }}>return ProblemDetail from @ExceptionHandler</Chip>
          <Chip color={C.blue} style={{ fontSize: 22 }}>spring.mvc.problemdetails.enabled=true</Chip>
          <Chip color={C.purple} style={{ fontSize: 22 }}>extend ResponseEntityExceptionHandler</Chip>
        </Abs>
      )}
    </>
  );
};

export const Translate = ({ t }: CP) => {
  const f = t.frame;
  const fixed = t.step >= 1;
  return (
    <>
      <Abs x={160} y={260} w={1100} style={{ ...card(fixed ? C.blue : C.red), padding: "16px 22px", fontFamily: MONO, fontSize: 22, ...rise(f, 4) }}>
        <div style={{ fontFamily: "inherit", fontSize: 20, color: C.muted }}>OrderService.find(id)</div>
        orElseThrow(() -&gt; new <span style={{ color: fixed ? C.blue : C.red }}>{fixed ? "OrderNotFoundException(id)" : "ResponseStatusException(NOT_FOUND)"}</span>)
      </Abs>
      {!fixed && (
        <Abs x={160} y={400} w={1600} style={{ fontSize: 26, color: C.red, ...rise(f, 40) }}>
          HTTP leaks into the service · and a Kafka consumer calling it gets an HTTP 404?
        </Abs>
      )}
      {fixed && (
        <>
          {[
            ["repository", "Optional.empty() · DataAccessException", C.muted],
            ["service", "domain exceptions, no HTTP", C.blue],
            ["@RestControllerAdvice", "domain → status + ProblemDetail", C.purple],
          ].map(([n, s, col], i) => (
            <Abs key={n} x={160 + i * 540} y={400} w={500} style={{ ...card(col), padding: "14px 18px", textAlign: "center", opacity: Math.min(1, pop(f, at(t, 1) + i * 12)) }}>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{n}</div>
              <div style={{ fontSize: 20, color: C.muted }}>{s}</div>
            </Abs>
          ))}
        </>
      )}
      {t.step >= 2 && (
        <Abs x={160} y={560} w={1600} style={{ display: "flex", gap: 12, flexWrap: "wrap", ...rise(f, at(t, 2)) }}>
          {[
            ["400 invalid input", C.amber],
            ["404 not found", C.blue],
            ["409 conflict", C.purple],
            ["422 business rule", C.cyan],
            ["500 our bug", C.red],
          ].map(([s, col]) => (
            <Chip key={s} color={col} style={{ fontSize: 24 }}>{s}</Chip>
          ))}
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={160} y={660} w={1600} style={{ ...card(C.amber), padding: "14px 20px", fontSize: 24, ...rise(f, at(t, 3)) }}>
          @Valid fails → MethodArgumentNotValidException → 400 with "errors": [{"{"}field, message{"}"}]
        </Abs>
      )}
      {t.step >= 4 && (
        <Abs x={160} y={780} w={1600} style={{ fontSize: 26, color: C.muted, ...rise(f, at(t, 4)) }}>
          domain exceptions unchecked: no throws clauses, and @Transactional rolls back on them by default
        </Abs>
      )}
    </>
  );
};

// ================================================================== Part 11

export const Pipeline2 = ({ t }: CP) => {
  const f = t.frame;
  const stops = [
    { n: "Tomcat", col: C.muted },
    { n: "servlet filters", sub: "incl. Spring Security", col: C.blue },
    { n: "DispatcherServlet", sub: "picks the handler", col: C.muted },
    { n: "preHandle", col: C.purple },
    { n: "controller", col: C.green },
    { n: "postHandle", col: C.purple },
    { n: "afterCompletion", col: C.purple },
  ];
  const p = clamp01((f - at(t, Math.min(t.step, 2)) - 10) / 140);
  const reach = t.step === 0 ? 2 : t.step === 1 ? 4 : 6;
  const from0 = t.step === 0 ? 0 : t.step === 1 ? 2 : 4;
  const pos = lerp(from0, reach, p);
  const x = (i: number) => 140 + i * 250;
  return (
    <>
      {stops.map((s, i) => (
        <Abs key={s.n} x={x(i)} y={420} w={220} style={{ ...card(pos >= i - 0.01 ? s.col : C.line), padding: "14px 6px", textAlign: "center", opacity: Math.min(1, pop(f, 4 + i * 6)) }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{s.n}</div>
          {s.sub && <div style={{ fontSize: 16, color: C.muted }}>{s.sub}</div>}
        </Abs>
      ))}
      <div style={{ position: "absolute", left: x(0) + 110 + pos * 250 - 14, top: 380, width: 28, height: 28, borderRadius: 14, background: C.amber }} />
      <Abs x={x(1) - 10} y={330} w={1000} style={{ fontSize: 22, color: C.blue, ...rise(f, 20) }}>servlet container</Abs>
      <Abs x={x(3)} y={330} w={800} style={{ fontSize: 22, color: C.purple, ...rise(f, 20) }}>Spring MVC: HandlerInterceptor hooks</Abs>
      {t.step >= 3 && (
        <Abs x={160} y={640} w={1600} style={{ textAlign: "center", ...rise(f, at(t, 3)) }}>
          <Big size={36}>then the response unwinds back out through the filters</Big>
        </Abs>
      )}
    </>
  );
};

export const FilterWrap = ({ t }: CP) => {
  const f = t.frame;
  return (
    <>
      <Abs x={160} y={260} w={1000} style={{ ...card(C.blue), padding: "18px 22px", fontFamily: MONO, fontSize: 22, lineHeight: 1.6, ...rise(f, 4) }}>
        <div style={{ color: C.muted, fontFamily: "inherit" }}>class CorrelationIdFilter extends OncePerRequestFilter</div>
        <span style={{ color: C.green }}>MDC.put("requestId", id);</span> <span style={{ color: C.muted }}>// before</span>
        <br />
        try {"{"} <span style={{ color: C.amber }}>chain.doFilter(req, res);</span> {"}"} <span style={{ color: C.muted }}>// everything else runs here</span>
        <br />
        finally {"{"} <span style={{ color: C.red }}>MDC.remove("requestId");</span> {"}"} <span style={{ color: C.muted }}>// after</span>
      </Abs>
      {t.step >= 1 && (
        <Abs x={1220} y={260} w={540} style={{ display: "flex", flexDirection: "column", gap: 12, ...rise(f, at(t, 1)) }}>
          <div style={{ ...card(C.green), padding: "12px 18px", fontSize: 22 }}>✓ every request: static files, errors, unmapped URLs</div>
          <div style={{ ...card(C.green), padding: "12px 18px", fontSize: 22 }}>✓ raw request/response; can wrap them (cache a body)</div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={1220} y={480} w={540} style={{ display: "flex", flexDirection: "column", gap: 12, ...rise(f, at(t, 2)) }}>
          <div style={{ ...card(C.red), padding: "12px 18px", fontSize: 22 }}>✗ doesn't know which controller will run</div>
          <div style={{ ...card(C.red), padding: "12px 18px", fontSize: 22 }}>✗ its exceptions never reach @ControllerAdvice</div>
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={160} y={560} w={1000} style={{ display: "flex", gap: 12, flexWrap: "wrap", ...rise(f, at(t, 3)) }}>
          {["authentication", "CORS", "correlation id", "body logging", "rate limiting"].map((s) => (
            <Chip key={s} color={C.blue} style={{ fontSize: 22 }}>{s}</Chip>
          ))}
          <div style={{ width: "100%", fontSize: 22, color: C.muted, marginTop: 8 }}>register: @Component (all URLs) or FilterRegistrationBean (patterns, order)</div>
        </Abs>
      )}
    </>
  );
};

export const Hooks = ({ t }: CP) => {
  const f = t.frame;
  const hooks = [
    { n: "preHandle(req, res, handler)", s: "handler = HandlerMethod: read @Audited · return false to stop", col: C.green, step: 1 },
    { n: "postHandle(…, ModelAndView)", s: "skipped if the controller threw · REST body already written", col: C.amber, step: 2 },
    { n: "afterCompletion(…, Exception ex)", s: "always runs: timing, cleanup", col: C.blue, step: 3 },
  ];
  return (
    <>
      <Abs x={160} y={260} w={1600} style={{ fontSize: 28, fontWeight: 800, ...rise(f, 4) }}>HandlerInterceptor: after DispatcherServlet picks the controller</Abs>
      {hooks.map((h, i) =>
        t.step >= h.step ? (
          <Abs key={h.n} x={160} y={340 + i * 140} w={1600} style={{ ...card(h.col), padding: "16px 22px", ...rise(f, at(t, h.step)) }}>
            <div style={{ fontFamily: MONO, fontSize: 28, color: h.col }}>{h.n}</div>
            <div style={{ fontSize: 24, color: C.muted, marginTop: 6 }}>{h.s}</div>
          </Abs>
        ) : null,
      )}
      {t.step === 0 && (
        <Abs x={160} y={340} w={1600} style={{ fontFamily: MONO, fontSize: 24, color: C.muted, ...rise(f, 30) }}>
          WebMvcConfigurer.addInterceptors(reg) · addPathPatterns("/api/**")
        </Abs>
      )}
      {t.step >= 4 && (
        <Abs x={160} y={780} w={1600} style={{ display: "flex", gap: 14, flexWrap: "wrap", ...rise(f, at(t, 4)) }}>
          <Chip color={C.purple} style={{ fontSize: 22 }}>change a REST body: ResponseBodyAdvice</Chip>
          <Chip color={C.cyan} style={{ fontSize: 22 }}>method arguments, any layer: an @Around aspect</Chip>
        </Abs>
      )}
    </>
  );
};

export const Choose = ({ t }: CP) => {
  const f = t.frame;
  const rows = [
    ["every raw request, or before Spring Security", "filter", C.blue],
    ["needs the controller method or its annotations", "interceptor", C.purple],
    ["needs method arguments, in any layer", "aspect", C.cyan],
  ] as const;
  return (
    <>
      {rows.map(([q, a, col], i) => (
        <Abs key={a} x={160} y={300 + i * 130} w={1600} style={{ display: "flex", gap: 24, alignItems: "center", opacity: Math.min(1, pop(f, 10 + i * 20)) }}>
          <div style={{ ...card(C.line), padding: "16px 22px", fontSize: 26, flex: 1 }}>{q}</div>
          <div style={{ fontSize: 30, color: C.muted }}>→</div>
          <div style={{ ...card(col), padding: "16px 22px", fontSize: 28, fontWeight: 800, width: 280, textAlign: "center" }}>{a}</div>
        </Abs>
      ))}
      {t.step >= 1 && (
        <Abs x={160} y={720} w={1600} style={{ ...rise(f, at(t, 1)) }}>
          <Big size={34} color={C.amber}>auth, CORS, correlation ids → filters · annotation checks, per-handler audit → interceptors</Big>
        </Abs>
      )}
    </>
  );
};

export const TenantFlow = ({ t }: CP) => {
  const f = t.frame;
  const chain = [
    ["BearerTokenAuthenticationFilter", C.green],
    ["TenantFilter", C.amber],
    ["AuthorizationFilter", C.purple],
  ] as const;
  const leak = t.step >= 3;
  return (
    <>
      {t.step < 3 && (
        <>
          {chain.map(([n, col], i) => (
            <Abs key={n} x={160} y={290 + i * 100} w={640} style={{ ...card(col), padding: "14px 20px", fontSize: 24, fontWeight: i === 1 ? 800 : 500, opacity: Math.min(1, pop(f, 6 + i * 10)) }}>
              {i + 1}. {n}
            </Abs>
          ))}
          <Abs x={880} y={290} w={880} style={{ ...card(C.amber), padding: "16px 22px", fontFamily: MONO, fontSize: 22, lineHeight: 1.6, ...rise(f, 30) }}>
            tenant = jwt.claim("tenant_id")
            <br />
            X-Tenant-ID ≠ tenant → 403
            <br />
            TenantContext.set(tenant) // ThreadLocal
          </Abs>
          {t.step >= 1 && (
            <Abs x={880} y={480} w={880} style={{ ...card(C.blue), padding: "14px 22px", fontSize: 24, ...rise(f, at(t, 1)) }}>
              data layer reads TenantContext → WHERE tenant_id = ? (or Hibernate multi-tenancy)
            </Abs>
          )}
          {t.step >= 2 && (
            <Abs x={880} y={600} w={880} style={{ ...card(C.red), padding: "14px 22px", fontFamily: MONO, fontSize: 24, ...rise(f, at(t, 2)) }}>
              finally {"{"} TenantContext.clear(); {"}"}
            </Abs>
          )}
        </>
      )}
      {leak && (
        <>
          <Abs x={160} y={270} w={1600} style={{ fontSize: 28, fontWeight: 800, ...rise(f, at(t, 3)) }}>without the finally: Tomcat thread #7 is reused</Abs>
          {[
            ["request 1 · tenant A", "TenantContext = A", C.green],
            ["request 2 · tenant B (no tenant set yet)", "still A!", C.red],
          ].map(([r, ctx, col], i) => (
            <Abs key={r} x={160} y={350 + i * 110} w={1600} style={{ display: "flex", gap: 24, alignItems: "center", opacity: Math.min(1, pop(f, at(t, 3) + 20 + i * 40)) }}>
              <div style={{ ...card(C.line), padding: "12px 20px", fontSize: 24, width: 640 }}>🧵 thread #7 · {r}</div>
              <div style={{ ...card(col), padding: "12px 20px", fontFamily: MONO, fontSize: 24 }}>{ctx}</div>
            </Abs>
          ))}
          <Abs x={160} y={600} w={1600} style={{ fontSize: 28, color: C.red, fontWeight: 800, ...rise(f, at(t, 3) + 100) }}>tenant B reads tenant A's data</Abs>
        </>
      )}
      {t.step >= 4 && (
        <Abs x={160} y={700} w={1600} style={{ display: "flex", gap: 14, flexWrap: "wrap", ...rise(f, at(t, 4)) }}>
          <Chip color={C.purple} style={{ fontSize: 22 }}>@Async: copy it with a TaskDecorator</Chip>
          <Chip color={C.blue} style={{ fontSize: 22 }}>Kafka: tenant in a message header</Chip>
          <Chip color={C.green} style={{ fontSize: 22 }}>defence in depth: row-level security or schema per tenant</Chip>
        </Abs>
      )}
    </>
  );
};
