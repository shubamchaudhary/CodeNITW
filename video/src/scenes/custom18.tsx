// Spring Part 9 scenes (Spring Security architecture): the starter locking
// everything, 401 vs 403 at a door, a request walking the filter chain, the
// login path through the managers, bcrypt salts, and sessions vs tokens.
// Widths only, never heights; the top-right corner stays free for the term card.
import { C, MONO } from "../lib/theme.ts";
import { ease, enter, lerp, pop, rise } from "../lib/anim.ts";
import { Abs, card, Chip } from "./ui.tsx";
import { at, Big, clamp01 } from "./custom3.tsx";
import { Actor, Arrow, type CP, Packet, Svg } from "./secui.tsx";

// ------------------------------------------------------------------ add the starter, everything locks

export const Starter = ({ t }: CP) => {
  const f = t.frame;
  const eps = ["GET /api/orders", "POST /api/orders", "GET /api/users/42", "GET /health"];
  return (
    <>
      <Abs x={160} y={270} w={760} style={{ ...card(C.blue), padding: "18px 24px", fontFamily: MONO, fontSize: 26, ...rise(f, 4) }}>
        + spring-boot-starter-security
      </Abs>
      {eps.map((e, i) => (
        <Abs key={e} x={160} y={380 + i * 80} w={760} style={{ display: "flex", justifyContent: "space-between", ...card(t.step >= 1 ? C.red : C.line), padding: "12px 20px", fontFamily: MONO, fontSize: 24, opacity: Math.min(1, pop(f, 20 + i * 8)) }}>
          <span>{e}</span>
          <span style={{ color: t.step >= 1 ? C.red : C.green }}>{t.step >= 1 ? "401" : "200"}</span>
        </Abs>
      ))}
      {t.step >= 1 && (
        <Abs x={1040} y={380} w={720} style={{ ...card(C.amber), padding: "18px 24px", fontFamily: MONO, fontSize: 22, ...rise(f, at(t, 1) + 30) }}>
          Using generated security password:
          <br />
          <span style={{ color: C.amber }}>8e3c…-…-a91f</span>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={1040} y={560} w={720} style={{ ...rise(f, at(t, 2)) }}>
          <Big size={38}>your controllers didn't change. a chain of filters in front of them did all of this.</Big>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ 401 vs 403 at a door

export const Doorman = ({ t }: CP) => {
  const f = t.frame;
  return (
    <>
      <Actor x={480} y={270} w={420} icon="🪪" name="authentication" sub="who are you?" color={C.blue} style={rise(f, 4)} />
      {t.step >= 1 && <Actor x={1440} y={270} w={420} icon="🔐" name="authorization" sub="what may you do?" color={C.purple} style={rise(f, at(t, 1))} />}
      {t.step >= 1 && (
        <Svg>
          <Arrow x1={700} y1={340} x2={1220} y2={340} p={ease(f, at(t, 1) + 10, 20)} />
        </Svg>
      )}
      {t.step >= 2 && (
        <>
          <Abs x={270} y={520} w={420} style={{ ...card(C.red), padding: "18px 22px", textAlign: "center", ...rise(f, at(t, 2)) }}>
            <div style={{ fontFamily: MONO, fontSize: 48, fontWeight: 800, color: C.red }}>401</div>
            <div style={{ fontSize: 24 }}>no or bad credentials</div>
            <div style={{ fontSize: 22, color: C.muted }}>log in and try again</div>
          </Abs>
          <Abs x={1230} y={520} w={420} style={{ ...card(C.amber), padding: "18px 22px", textAlign: "center", ...rise(f, at(t, 2) + 30) }}>
            <div style={{ fontFamily: MONO, fontSize: 48, fontWeight: 800, color: C.amber }}>403</div>
            <div style={{ fontSize: 24 }}>known user, not allowed</div>
            <div style={{ fontSize: 22, color: C.muted }}>logging in again won't help</div>
          </Abs>
        </>
      )}
      {t.step >= 2 && (
        <Abs x={160} y={780} w={1600} style={{ textAlign: "center", ...rise(f, at(t, 2) + 60) }}>
          <Chip color={C.amber} style={{ fontSize: 26 }}>401 is really “unauthenticated”; 403 is the real “unauthorized”</Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ a request walking the filter chain

export const Chain = ({ t }: CP) => {
  const f = t.frame;
  const filters = [
    ["SecurityContextHolderFilter", C.muted],
    ["CorsFilter", C.cyan],
    ["CsrfFilter", C.amber],
    ["LogoutFilter", C.muted],
    ["auth filters: Basic / Bearer / form", C.green],
    ["AnonymousAuthenticationFilter", C.muted],
    ["ExceptionTranslationFilter", C.red],
    ["AuthorizationFilter", C.purple],
  ] as const;
  const walk = t.step >= 2 ? clamp01((f - at(t, 2) - 10) / 150) * filters.length : -1;
  const top = ["Tomcat", "DelegatingFilterProxy", "FilterChainProxy"];
  return (
    <>
      {top.map((n, i) => (
        <Abs key={n} x={160 + i * 520} y={260} w={440} style={{ ...card(i === 0 ? C.line : (t.step === 0 && i === 1) || (t.step === 1 && i === 2) ? C.blue : C.line), padding: "16px 0", textAlign: "center", fontSize: 26, fontWeight: 800, opacity: i === 0 || t.step >= i - 1 ? Math.min(1, pop(f, 6 + i * 14)) : 0.3 }}>
          {n}
          {i === 1 && <div style={{ fontSize: 18, color: C.muted, fontWeight: 500 }}>servlet filter: the bridge</div>}
          {i === 2 && <div style={{ fontSize: 18, color: C.muted, fontWeight: 500, fontFamily: MONO }}>springSecurityFilterChain</div>}
        </Abs>
      ))}
      <Svg>
        <Arrow x1={605} y1={300} x2={675} y2={300} p={ease(f, 20, 10)} />
        <Arrow x1={1125} y1={300} x2={1195} y2={300} p={t.step >= 1 ? ease(f, at(t, 1), 10) : 0} />
      </Svg>
      {t.step >= 1 && (
        <Abs x={160} y={390} w={1100} style={{ ...rise(f, at(t, 1) + 10) }}>
          <div style={{ fontSize: 22, color: C.muted, marginBottom: 8 }}>SecurityFilterChain for /api/**</div>
          {filters.map(([n, col], i) => {
            const lit = walk >= i;
            return (
              <div key={n} style={{ ...card(lit ? col : C.line), padding: "6px 16px", marginBottom: 8, fontSize: 22, fontWeight: 700, display: "flex", gap: 14, opacity: lit || t.step < 2 ? 1 : 0.5, transform: `translateX(${lit && walk < i + 1 ? 16 : 0}px)` }}>
                <span style={{ fontFamily: MONO, color: C.muted }}>{i + 1}</span>
                {n}
              </div>
            );
          })}
        </Abs>
      )}
      {t.step >= 2 && walk >= filters.length - 0.01 && (
        <Abs x={1320} y={830} w={440} style={{ ...card(C.green), padding: "14px 0", textAlign: "center", fontSize: 24, fontWeight: 800, opacity: enter(f, at(t, 2) + 160) }}>
          DispatcherServlet → controller
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={1320} y={420} w={440} style={{ ...card(C.purple), padding: "16px 20px", fontSize: 24, ...rise(f, at(t, 3)) }}>
          authorization runs last: it needs to know who you are first
        </Abs>
      )}
      {t.step >= 4 && (
        <Abs x={1320} y={600} w={440} style={{ display: "flex", flexDirection: "column", gap: 10, ...rise(f, at(t, 4)) }}>
          <Chip color={C.red} style={{ fontSize: 20 }}>WebSecurityConfigurerAdapter: removed in 6</Chip>
          <Chip color={C.green} style={{ fontSize: 20 }}>declare SecurityFilterChain beans</Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the login path

export const AuthFlow = ({ t }: CP) => {
  const f = t.frame;
  const boxes = [
    { x: 160, y: 300, n: "auth filter", s: "wraps credentials", col: C.blue, step: 0 },
    { x: 700, y: 300, n: "ProviderManager", s: "AuthenticationManager", col: C.purple, step: 1 },
    { x: 1240, y: 300, n: "DaoAuthenticationProvider", s: "supports username+password", col: C.purple, step: 1 },
    { x: 1240, y: 530, n: "UserDetailsService", s: "loadUserByUsername", col: C.green, step: 2 },
    { x: 700, y: 530, n: "PasswordEncoder", s: "matches(raw, hash)", col: C.amber, step: 3 },
    { x: 160, y: 530, n: "SecurityContextHolder", s: "ThreadLocal", col: C.cyan, step: 4 },
  ];
  const tokenPath: [number, number][] = [
    [400, 360],
    [940, 360],
    [1480, 360],
    [1480, 590],
    [940, 590],
    [400, 590],
  ];
  const st = Math.min(t.step, 5);
  const k = Math.min(st, 4);
  const cur = [0, 2, 3, 4, 5][k];
  const prev = [0, 0, 2, 3, 4][k];
  const p = ease(f, at(t, k) + 10, 30);
  const tx = lerp(tokenPath[prev][0], tokenPath[cur][0], p);
  const ty = lerp(tokenPath[prev][1], tokenPath[cur][1], p);
  const failed = t.step >= 5;
  return (
    <>
      {boxes.map((b) => (
        <Abs key={b.n} x={b.x} y={b.y} w={480} style={{ ...card(t.step >= b.step ? b.col : C.line), padding: "18px 20px", textAlign: "center", opacity: t.step >= b.step ? 1 : 0.35 }}>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{b.n}</div>
          <div style={{ fontSize: 20, color: C.muted, fontFamily: MONO }}>{b.s}</div>
        </Abs>
      ))}
      {!failed && (
        <Abs x={tx - 120} y={ty + 60} w={240} style={{ ...card(st >= 4 ? C.green : C.amber), padding: "6px 0", textAlign: "center", fontSize: 18, fontFamily: MONO }}>
          {st >= 4 ? "authenticated ✓" : "token: asha / ••••"}
        </Abs>
      )}
      {t.step >= 4 && !failed && (
        <Abs x={160} y={740} w={1600} style={{ fontFamily: MONO, fontSize: 24, ...rise(f, at(t, 4) + 30) }}>
          SecurityContextHolder.getContext().getAuthentication().getName() → "asha"
        </Abs>
      )}
      {failed && (
        <Abs x={160} y={740} w={1600} style={{ ...rise(f, at(t, 5)) }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.red }}>wrong password → AuthenticationException → ExceptionTranslationFilter → 401</div>
          <div style={{ fontSize: 24, color: C.muted, marginTop: 8 }}>it happens in the filter chain, so @ControllerAdvice never sees it</div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ hashing passwords: salt and slowness

export const Hashing = ({ t }: CP) => {
  const f = t.frame;
  const users = ["asha", "ravi"];
  return (
    <>
      <Abs x={160} y={260} w={1600} style={{ fontFamily: MONO, fontSize: 26, color: C.muted, ...rise(f, 4) }}>two users, same password: "password123"</Abs>
      {users.map((u, i) => (
        <Abs key={u} x={160} y={330 + i * 90} w={1600} style={{ display: "flex", gap: 30, alignItems: "center", fontFamily: MONO, fontSize: 24, opacity: Math.min(1, pop(f, 14 + i * 10)) }}>
          <span style={{ width: 100 }}>{u}</span>
          <span style={{ ...card(C.red), padding: "8px 14px", width: 560 }}>SHA-256: ef92b778bafe771e…</span>
          {t.step >= 1 && <span style={{ ...card(C.green), padding: "8px 14px", ...rise(f, at(t, 1) + i * 14) }}>{i ? "{bcrypt}$2a$10$Q8xZ…k1" : "{bcrypt}$2a$10$Vh3p…9e"}</span>}
        </Abs>
      ))}
      {t.step === 0 && (
        <Abs x={160} y={560} w={1600} style={{ fontSize: 28, color: C.red, ...rise(f, 50) }}>
          same hash for both, and fast: billions of guesses a second
        </Abs>
      )}
      {t.step >= 1 && (
        <Abs x={160} y={560} w={1600} style={{ fontSize: 28, ...rise(f, at(t, 1) + 40) }}>
          bcrypt adds a random <span style={{ color: C.green, fontWeight: 800 }}>salt</span> per password, so equal passwords get different hashes
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={160} y={650} w={1600} style={{ display: "flex", gap: 14, flexWrap: "wrap", ...rise(f, at(t, 2)) }}>
          <Chip color={C.amber} style={{ fontSize: 24 }}>deliberately slow: work factor 10</Chip>
          <Chip color={C.blue} style={{ fontSize: 24 }}>{"{bcrypt}"} prefix: DelegatingPasswordEncoder</Chip>
          <Chip color={C.green} style={{ fontSize: 24 }}>passwordEncoder.matches(raw, hash)</Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ sessions vs tokens

export const Sessions = ({ t }: CP) => {
  const f = t.frame;
  const inst = [0, 1, 2];
  return (
    <>
      <Abs x={160} y={260} w={760} style={{ fontSize: 30, fontWeight: 800, color: C.blue, ...rise(f, 4) }}>stateful: sessions</Abs>
      <Abs x={160} y={320} w={760} style={{ ...card(C.blue), padding: "16px 22px", fontSize: 24, lineHeight: 1.5, ...rise(f, 10) }}>
        🍪 JSESSIONID → server looks up the session
        <div style={{ color: C.green }}>+ easy to revoke: delete the session</div>
        <div style={{ color: C.red }}>− many instances need a shared store (Redis)</div>
        <div style={{ color: C.red }}>− cookies bring CSRF</div>
      </Abs>
      {t.step >= 1 && (
        <>
          <Abs x={1000} y={260} w={760} style={{ fontSize: 30, fontWeight: 800, color: C.green, ...rise(f, at(t, 1)) }}>stateless: tokens</Abs>
          <Abs x={1000} y={320} w={760} style={{ ...card(C.green), padding: "16px 22px", fontSize: 24, lineHeight: 1.5, ...rise(f, at(t, 1) + 10) }}>
            🎫 Authorization: Bearer eyJ… on every request
            <div style={{ color: C.green }}>+ any instance verifies it, nothing stored</div>
            <div style={{ color: C.red }}>− hard to revoke before it expires</div>
          </Abs>
          <Abs x={1000} y={560} w={760} style={{ display: "flex", gap: 14 }}>
            {inst.map((i) => (
              <div key={i} style={{ ...card(C.green), padding: "10px 18px", fontSize: 22, opacity: enter(f, at(t, 1) + 40 + i * 10) }}>
                instance {i + 1} ✓
              </div>
            ))}
          </Abs>
        </>
      )}
      {t.step >= 2 && (
        <Abs x={160} y={700} w={1600} style={{ ...card(C.purple), padding: "14px 22px", fontFamily: MONO, fontSize: 24, ...rise(f, at(t, 2)) }}>
          .sessionManagement(s -&gt; s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={160} y={820} w={1600} style={{ fontFamily: MONO, fontSize: 24, ...rise(f, at(t, 3)) }}>
          @PreAuthorize("hasRole('ADMIN') or #userId == authentication.name")
          <span style={{ fontFamily: "inherit", color: C.muted, marginLeft: 16 }}>· via a proxy: self-calls skip it</span>
        </Abs>
      )}
    </>
  );
};
