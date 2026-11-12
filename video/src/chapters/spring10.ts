import type { Chapter } from "../lib/types.ts";
import { makeCheck } from "./checks.ts";
import { B, sayit, sec } from "./core/h.ts";
import { old } from "./core/spring10old.ts";
import { qa } from "./web/h.ts";

// Spring Part 10 (src/Data/coreStackDocs/SPRING-10.md): OAuth 2.0 and
// service-to-service tokens, question by question; reuses core/spring10old.ts.
const check = makeCheck();

export const spring10: Chapter = {
  id: "spring10",
  label: "Spring 10",
  title: "OAuth 2.0 and service-to-service tokens",
  theme: "py",
  voice: "en-US-AndrewMultilingualNeural",
  pace: { normal: "-3%", ask: "-5%", aside: "+4%", excite: "+4%" },
  scenes: [
    old("valet"),
    {
      kind: "title",
      eyebrow: "Spring · Part 10",
      title: "OAuth 2.0",
      subtitle: "authorization code + PKCE, client credentials, OIDC, and how it relates to JWT",
      beats: B("Spring, part ten. OAuth two point oh, and service-to-service tokens. Two questions come up again and again: walk me through the OAuth flow, authorization code versus client credentials, and how OAuth relates to JWT. We'll build up to both."),
    },

    // ================================================================ 1
    sec("1", "The four roles", "First, the vocabulary, because every answer uses it."),
    old("roles"),

    // ================================================================ 2
    sec("2", "Authorization code with PKCE", "Question one, part one. The authorization code flow, with PKCE: the flow for anything a user logs into."),
    old("codeflow", { 7: "So that's a user's app. Now: your own microservices, with no user at all." }),
    {
      kind: "code",
      title: "The client side in Spring: oauth2Login",
      lang: "yaml",
      code: `# application.yml
spring.security.oauth2.client.registration.google:
  client-id: \${GOOGLE_CLIENT_ID}
  client-secret: \${GOOGLE_CLIENT_SECRET}
  scope: openid, email, profile

# SecurityFilterChain
http.oauth2Login(Customizer.withDefaults());
# Spring runs the whole code flow: the redirect, state,
# the code exchange, the ID token check, then a session`,
      highlight: [[1, 5], [7, 10]],
      beats: B(
        "In Spring, the client side is configuration. Register the provider with its client id, secret, and scopes. The secret comes from the environment, never from the code.",
        { say: "Then oauth two login in the filter chain. Spring runs the whole code flow for you: the redirect, the state parameter against CSRF, the code exchange, validating the ID token, and finally a session for the user.", tone: "key" },
      ),
    },

    // ================================================================ 3
    sec("3", "Client credentials", "Question one, part two. Client credentials: how one service calls another, with no user involved."),
    old("clientcreds"),
    sayit("Explain the OAuth 2.0 flow: authorization code vs client credentials.", "Say it like this:", [
      ["OAuth 2.0 is delegated authorization: a client gets a scoped, expiring access token", "OAuth two is delegated authorisation. A client gets a scoped, expiring access token instead of the user's password."],
      ["Authorization code + PKCE: user apps; the browser only carries a one-time code", "Authorization code with PKCE is for apps a user signs into. The user logs in at the authorization server, the browser only carries a short-lived one-time code, and the client exchanges it, with the PKCE verifier, for tokens on the back channel."],
      ["Client credentials: machine to machine, the service authenticates as itself", "Client credentials is machine to machine. A service authenticates as itself with its client id and secret, and gets a token for its own scopes."],
      ["Implicit and password grants: don't use (RFC 9700, Jan 2025)", "And the implicit and password grants shouldn't be used anymore. The current security best practice, RFC ninety seven hundred from January twenty twenty five, says so."],
    ]),

    // ================================================================ 4
    sec("4", "OAuth vs JWT, and OpenID Connect", "Question two. OAuth versus JWT: how are they related? And where login fits in."),
    old("opaque"),
    old("oidc"),
    sayit("OAuth 2.0 vs JWT: how are they related?", "The answer:", [
      ["Different layers: OAuth is the protocol for getting tokens; JWT is a token format", "They're different layers. OAuth is the protocol for how a client gets a token. JWT is a format a token can have."],
      ["Access tokens may be JWTs (verified locally) or opaque (introspected)", "An OAuth access token may be a JWT, verified locally with the issuer's public keys, or an opaque string, checked by calling introspection."],
      ["JWT: fast, no lookup, hard to revoke; opaque: one call per check, revocable instantly", "JWTs are fast but hard to revoke. Opaque tokens cost a call per check, but can be revoked instantly."],
      ["OIDC adds login on top: the ID token (always a JWT) says who signed in", "And OpenID Connect adds login on top: an ID token, always a JWT, that says who signed in. Never send the ID token to APIs: that's the access token's job."],
    ]),
    qa(1, "How does a Spring service accept tokens from another service?", [
      "Calling side: Spring's OAuth2 client with client_credentials; the token is cached until just before expiry",
      "Receiving side: oauth2ResourceServer().jwt(): verifies signature, expiry, issuer and audience",
      "Authorise by scope: hasAuthority(\"SCOPE_inventory.read\"); one audience per API",
      "Inside a cluster, mTLS or a service mesh can add the network layer of trust",
    ], { ask: "And the practical follow-up: how does a Spring service accept tokens from another service?" }),
    check({
      topic: "OAuth",
      q: "A nightly job in order-service must call inventory-service. Which grant, and what does inventory check?",
      say: "A nightly job in the order service must call the inventory service. Which grant, and what does inventory check?",
      a: "Client credentials: order-service gets a token as itself. Inventory, a resource server, verifies the signature, expiry, issuer, audience, and the scope (e.g. inventory.read).",
      aSay: "Client credentials. The order service gets a token as itself. The inventory service, as a resource server, verifies the signature, expiry, issuer and audience, and checks the scope, like inventory read.",
    }),
    check({
      topic: "PKCE",
      q: "Why does a single-page app need PKCE with the authorization code flow?",
      say: "Why does a single-page app need PKCE, with the authorization code flow?",
      a: "It can't keep a client secret. PKCE binds the code to a verifier only the app knows, so a stolen authorization code is useless to an attacker.",
      aSay: "Because a single-page app can't keep a client secret. PKCE binds the code to a random verifier only that app knows, so a stolen code is useless to anyone else.",
    }),
    {
      kind: "drill",
      items: [
        { q: "Is OAuth 2.0 a login protocol?", a: "No: delegated authorization (OIDC adds login)" },
        { q: "Grant for a user-facing app?", a: "Authorization code + PKCE" },
        { q: "Grant for service to service?", a: "Client credentials" },
        { q: "Which grants are deprecated?", a: "Implicit and password" },
        { q: "Token that says who logged in?", a: "The ID token" },
        { q: "Opaque tokens are checked how?", a: "Introspection" },
      ],
      beats: B(
        { say: "Rapid fire. Is OAuth two a login protocol?", hold: 3 },
        "No. It's delegated authorisation. OpenID Connect adds login.",
        { say: "The grant for an app a user signs into?", hold: 3 },
        "Authorization code with PKCE.",
        { say: "The grant for service to service?", hold: 3 },
        "Client credentials.",
        { say: "Which grants shouldn't be used anymore?", hold: 3 },
        "Implicit, and password.",
        { say: "The token that says who logged in?", hold: 3 },
        "The ID token.",
        { say: "How are opaque tokens checked?", hold: 3 },
        { say: "By introspection. That's OAuth two.", tone: "key" },
      ),
    },
  ],
};
