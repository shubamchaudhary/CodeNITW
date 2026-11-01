// Spring Part 10 scenes (OAuth 2.0): a master key vs a valet key, the four
// roles, the authorization code flow with PKCE step by step, client
// credentials between services, opaque vs JWT tokens, and OIDC's ID token.
// Widths only, never heights; the top-right corner stays free for the term card.
import { C, MONO } from "../lib/theme.ts";
import { enter, rise } from "../lib/anim.ts";
import { Abs, card, Chip } from "./ui.tsx";
import { at, Big, clamp01 } from "./custom3.tsx";
import { Actor, type CP, Packet, Svg } from "./secui.tsx";

// ------------------------------------------------------------------ master key vs valet key

export const Valet = ({ t }: CP) => {
  const f = t.frame;
  return (
    <>
      <Actor x={420} y={280} w={420} icon="🖨️" name="printer.example" sub="wants your Google Photos" color={C.purple} style={rise(f, 4)} />
      {t.step >= 1 && (
        <Abs x={160} y={500} w={760} style={{ ...card(C.red), padding: "18px 24px", ...rise(f, at(t, 1)) }}>
          <div style={{ fontSize: 30, fontWeight: 800 }}>🔑 give it your Google password?</div>
          <div style={{ fontSize: 24, color: C.red, marginTop: 8 }}>it could read your mail, and you can't take it back without changing the password</div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={1000} y={500} w={760} style={{ ...card(C.green), padding: "18px 24px", ...rise(f, at(t, 2)) }}>
          <div style={{ fontSize: 30, fontWeight: 800 }}>🎟️ a valet key instead</div>
          <div style={{ fontSize: 24, color: C.green, marginTop: 8 }}>only photos.read · expires · revocable · password never shared</div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the four roles

export const Roles = ({ t }: CP) => {
  const f = t.frame;
  const roles = [
    { icon: "🧑", n: "resource owner", s: "you", col: C.blue },
    { icon: "🖨️", n: "client", s: "printer.example", col: C.purple },
    { icon: "🏛️", n: "authorization server", s: "Google login · Keycloak · Okta", col: C.amber },
    { icon: "🖼️", n: "resource server", s: "the Photos API", col: C.green },
  ];
  return (
    <>
      {roles.map((r, i) =>
        t.step >= Math.min(i, 2) ? (
          <Abs key={r.n} x={160 + i * 410} y={300} w={370} style={{ ...card(r.col), padding: "18px 10px", textAlign: "center", ...rise(f, at(t, Math.min(i, 2)) + (i === 3 ? 25 : 0)) }}>
            <div style={{ fontSize: 56 }}>{r.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{r.n}</div>
            <div style={{ fontSize: 22, color: C.muted }}>{r.s}</div>
          </Abs>
        ) : null,
      )}
      {t.step >= 3 && (
        <Abs x={160} y={600} w={1600} style={{ ...rise(f, at(t, 3)) }}>
          <div style={{ display: "inline-block", ...card(C.amber), padding: "12px 20px", fontFamily: MONO, fontSize: 26 }}>access token · scope=photos.read</div>
          <div style={{ fontSize: 26, color: C.muted, marginTop: 14 }}>issued by the authorization server, accepted by the resource server</div>
        </Abs>
      )}
      {t.step >= 4 && (
        <Abs x={160} y={780} w={1600} style={{ ...rise(f, at(t, 4)) }}>
          <Chip color={C.amber} style={{ fontSize: 26 }}>OAuth 2.0 is delegated authorization, not login: login comes from OpenID Connect</Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the authorization code flow with PKCE

export const CodeFlow = ({ t }: CP) => {
  const f = t.frame;
  const X = { b: 300, c: 760, a: 1220, r: 1640 };
  const showAll = t.step >= 5;
  return (
    <>
      <Actor x={X.b} y={230} w={260} icon="🌐" name="browser" color={C.blue} style={rise(f, 4)} />
      <Actor x={X.c} y={230} w={260} icon="🖨️" name="client" color={C.purple} style={rise(f, 8)} />
      <Actor x={X.a} y={230} w={300} icon="🏛️" name="auth server" color={C.amber} style={rise(f, 12)} />
      <Actor x={X.r} y={230} w={260} icon="🖼️" name="Photos API" color={C.green} style={rise(f, 16)} />
      <Svg>
        {Object.values(X).map((x) => (
          <line key={x} x1={x} y1={360} x2={x} y2={900} stroke={C.line} strokeWidth={3} strokeDasharray="6 10" />
        ))}
      </Svg>
      <Abs x={X.c - 200} y={370} w={400} style={{ textAlign: "center", fontFamily: MONO, fontSize: 18, color: C.purple, opacity: enter(f, 20) }}>
        verifier = random · challenge = SHA256(verifier)
      </Abs>
      <Packet f={f} start={30} x1={X.c} x2={X.a} y={410} label="/authorize?code_challenge=…&state=xyz" color={C.purple} w={560} />
      {t.step >= 1 && <Packet f={f} start={at(t, 1)} x1={X.b} x2={X.a} y={490} label="🧑 logs in, approves photos.read" color={C.blue} w={500} />}
      {t.step >= 2 && <Packet f={f} start={at(t, 2)} x1={X.a} x2={X.c} y={570} label="302 /cb?code=SplxlO&state=xyz" color={C.amber} w={480} />}
      {t.step >= 3 && <Packet f={f} start={at(t, 3)} x1={X.c} x2={X.a} y={650} label="POST /token · code + code_verifier" color={C.purple} w={540} />}
      {t.step >= 3 && <Packet f={f} start={at(t, 3) + 50} x1={X.a} x2={X.c} y={720} label="access + refresh token" color={C.green} w={380} />}
      {t.step >= 4 && <Packet f={f} start={at(t, 4)} x1={X.c} x2={X.r} y={800} label="GET /photos · Bearer …" color={C.green} w={380} />}
      {t.step >= 3 && !showAll && (
        <Abs x={X.a + 170} y={655} w={360} style={{ fontSize: 20, color: C.muted, opacity: enter(f, at(t, 3) + 30) }}>back channel: never through the browser</Abs>
      )}
      {showAll && (
        <Abs x={160} y={880} w={1600} style={{ display: "flex", gap: 14, flexWrap: "wrap", ...rise(f, at(t, 5)) }}>
          <Chip color={C.green} style={{ fontSize: 22 }}>stolen code + no verifier = useless (PKCE)</Chip>
          <Chip color={C.blue} style={{ fontSize: 22 }}>state stops callback CSRF</Chip>
          {t.step >= 6 && <Chip color={C.red} style={{ fontSize: 22 }}>implicit + password grants: deprecated (RFC 9700)</Chip>}
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ client credentials between services

export const ClientCreds = ({ t }: CP) => {
  const f = t.frame;
  const X = { o: 380, a: 960, i: 1540 };
  const left = t.step >= 3 ? 1 - clamp01((f - at(t, 3) - 10) / 120) * 0.9 : 1;
  return (
    <>
      <Actor x={X.o} y={260} w={360} icon="📦" name="order-service" sub="client_id + secret" color={C.purple} style={rise(f, 4)} />
      <Actor x={X.a} y={260} w={360} icon="🏛️" name="auth server" sub="Keycloak" color={C.amber} style={rise(f, 10)} />
      <Actor x={X.i} y={260} w={360} icon="🏭" name="inventory-service" sub="resource server" color={C.green} style={rise(f, 16)} />
      {t.step === 0 && (
        <Abs x={160} y={500} w={1600} style={{ textAlign: "center", ...rise(f, 30) }}>
          <Big size={40}>a nightly job: no user anywhere. the service acts as itself.</Big>
        </Abs>
      )}
      {t.step >= 1 && (
        <>
          <Packet f={f} start={at(t, 1)} x1={X.o} x2={X.a} y={470} label="POST /token · grant_type=client_credentials · scope=inventory.read" color={C.purple} w={760} />
          <Packet f={f} start={at(t, 1) + 50} x1={X.a} x2={X.o} y={550} label="access token (JWT, 5 min)" color={C.green} w={380} />
        </>
      )}
      {t.step >= 2 && (
        <>
          <Packet f={f} start={at(t, 2)} x1={X.o} x2={X.i} y={630} label="GET /stock · Bearer …" color={C.green} w={380} />
          <Abs x={X.i - 220} y={720} w={440} style={{ fontSize: 22, color: C.muted, textAlign: "center", ...rise(f, at(t, 2) + 40) }}>verifies locally with cached JWKS keys, checks the scope</Abs>
        </>
      )}
      {t.step >= 3 && (
        <Abs x={160} y={720} w={600} style={{ ...card(C.blue), padding: "14px 20px", ...rise(f, at(t, 3)) }}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>cache the token until near expiry</div>
          <div style={{ height: 14, borderRadius: 7, background: C.card2, marginTop: 10 }}>
            <div style={{ height: 14, borderRadius: 7, width: `${left * 100}%`, background: left > 0.2 ? C.blue : C.amber }} />
          </div>
          <div style={{ fontSize: 20, color: C.muted, marginTop: 6 }}>OAuth2AuthorizedClientManager does it · own client, narrow scopes</div>
        </Abs>
      )}
      {t.step >= 4 && (
        <Abs x={160} y={880} w={1600} style={{ display: "flex", gap: 14, flexWrap: "wrap", ...rise(f, at(t, 4)) }}>
          <Chip color={C.purple} style={{ fontSize: 22 }}>need the user downstream? pass their token, or token exchange (RFC 8693)</Chip>
          <Chip color={C.cyan} style={{ fontSize: 22 }}>mTLS: which service, at the network level</Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ JWT vs opaque, and OAuth vs JWT

export const Opaque = ({ t }: CP) => {
  const f = t.frame;
  return (
    <>
      <Abs x={160} y={270} w={760} style={{ ...card(C.green), padding: "20px 24px", ...rise(f, 4) }}>
        <div style={{ fontSize: 28, fontWeight: 800 }}>JWT access token</div>
        <div style={{ fontFamily: MONO, fontSize: 22, color: C.muted, marginTop: 8 }}>eyJhbGciOi…</div>
        <div style={{ fontSize: 24, marginTop: 10 }}>API verifies it locally with public keys</div>
        <div style={{ fontSize: 22, color: C.green }}>+ no call per request</div>
        <div style={{ fontSize: 22, color: C.red }}>− hard to revoke early</div>
      </Abs>
      {t.step >= 1 && (
        <Abs x={1000} y={270} w={760} style={{ ...card(C.amber), padding: "20px 24px", ...rise(f, at(t, 1)) }}>
          <div style={{ fontSize: 28, fontWeight: 800 }}>opaque token</div>
          <div style={{ fontFamily: MONO, fontSize: 22, color: C.muted, marginTop: 8 }}>8xLOxBtZp8…</div>
          <div style={{ fontSize: 24, marginTop: 10 }}>API asks POST /introspect: active? scopes?</div>
          <div style={{ fontSize: 22, color: C.green }}>+ revoke instantly</div>
          <div style={{ fontSize: 22, color: C.red }}>− a call per request (cache briefly)</div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={160} y={640} w={1600} style={{ textAlign: "center", ...rise(f, at(t, 2)) }}>
          <Big size={40}>OAuth 2.0 is the framework. JWT is just a token format it often uses.</Big>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ OIDC: the ID token

export const Oidc = ({ t }: CP) => {
  const f = t.frame;
  return (
    <>
      <Abs x={160} y={270} w={1600} style={{ fontFamily: MONO, fontSize: 28, ...rise(f, 4) }}>
        scope=<span style={{ color: C.amber }}>openid</span> profile email
      </Abs>
      <Abs x={160} y={360} w={760} style={{ ...card(C.purple), padding: "20px 24px", ...rise(f, 30) }}>
        <div style={{ fontSize: 28, fontWeight: 800 }}>🪪 ID token (JWT)</div>
        <div style={{ fontFamily: MONO, fontSize: 22, marginTop: 8 }}>sub, email, name · aud = the client</div>
        <div style={{ fontSize: 24, color: C.muted, marginTop: 8 }}>for the client: who logged in</div>
      </Abs>
      <Abs x={1000} y={360} w={760} style={{ ...card(C.green), padding: "20px 24px", ...rise(f, 50) }}>
        <div style={{ fontSize: 28, fontWeight: 800 }}>🎟️ access token</div>
        <div style={{ fontFamily: MONO, fontSize: 22, marginTop: 8 }}>scope, aud = the API</div>
        <div style={{ fontSize: 24, color: C.muted, marginTop: 8 }}>for calling APIs</div>
      </Abs>
      {t.step >= 1 && (
        <Abs x={160} y={640} w={1600} style={{ display: "flex", gap: 14, flexWrap: "wrap", ...rise(f, at(t, 1)) }}>
          <Chip color={C.red} style={{ fontSize: 24 }}>never send the ID token to an API</Chip>
          <Chip color={C.blue} style={{ fontSize: 24 }}>/.well-known/openid-configuration</Chip>
          <Chip color={C.green} style={{ fontSize: 24 }}>Spring: http.oauth2Login()</Chip>
        </Abs>
      )}
    </>
  );
};

