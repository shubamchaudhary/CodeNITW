import type { Chapter } from "../lib/types.ts";
import { makeCheck } from "./checks.ts";
import { B, sayit, sec } from "./core/h.ts";
import { old } from "./core/spring23old.ts";
import { qa } from "./web/h.ts";

// Spring Part 23 (src/Data/coreStackDocs/SPRING-23.md): JWT, question by
// question; reuses core/spring23old.ts diagrams.
const check = makeCheck();

export const spring23: Chapter = {
  id: "spring23",
  label: "Spring 23",
  title: "JWT: structure, stateless auth, revocation and refresh",
  theme: "py",
  voice: "en-US-AndrewMultilingualNeural",
  pace: { normal: "-3%", ask: "-5%", aside: "+4%", excite: "+4%" },
  scenes: [
    old("twenty"),
    {
      kind: "title",
      eyebrow: "Spring · Part 23",
      title: "JWT",
      subtitle: "structure, verification, the filter chain, refresh and revocation",
      beats: B("Spring, part twenty three. JWT. This is the security topic SDE two loops actually spend time on. A real twenty twenty six loop asked every question in this lecture, in this order."),
    },
    {
      kind: "bullets",
      title: "What interviews ask on this topic",
      firstItemStep: 1,
      items: [
        { icon: "🧩", text: "How does a JWT work: structure and verification?" },
        { icon: "⛓️", text: "Where is it validated in the filter chain? Write a JWT filter" },
        { icon: "🔄", text: "Access vs refresh tokens; where should tokens live on the client?" },
        { icon: "🚫", text: "How do you revoke a JWT before it expires?" },
      ],
      beats: B(
        "Four questions.",
        "How a JWT works: its structure, and how it's verified.",
        "Where Spring validates it in the filter chain, and how you'd write the filter yourself.",
        "Access tokens versus refresh tokens, and where each one should live.",
        { say: "And the one that separates people: how do you revoke a token that's designed to need no server state?", tone: "key" },
      ),
    },

    // ================================================================ 1
    sec("1", "Structure and verification", "Question one. How does a JWT work? Its structure, and how it's verified."),
    old("anatomy", { 5: "So who signs it, and who checks it?" }),
    old("keys", { 5: "Now: where does Spring check all that?" }),
    sayit("How does a JWT work: structure and verification?", "Say it like this:", [
      ["Three base64url parts: header.payload.signature", "A JWT is three base64url parts: a header, a payload of claims, and a signature, joined by dots."],
      ["Claims: iss, sub, aud, exp, iat, jti, plus roles or scopes; signed, not encrypted", "The claims say who issued it, who it's about, for which audience, and when it expires. It's signed, not encrypted, so no secrets inside."],
      ["The issuer signs (RS256 private key); services verify with the public key from JWKS", "The issuer signs it, typically with a private key, and services verify it with the public key from the issuer's JWKS endpoint."],
      ["Verify signature with a pinned algorithm, then exp, iss, aud: no DB lookup needed", "Every service checks the signature with an algorithm it pins, then expiry, issuer and audience, with no database lookup. That's what makes it stateless."],
    ]),

    // ================================================================ 2
    sec("2", "Where Spring validates it", "Question two. Where is the JWT validated in the Spring Security filter chain, and how do you write a JWT filter?"),
    old("jwtpath"),
    {
      kind: "code",
      title: "If you must write the filter yourself",
      lang: "java",
      code: `public class JwtFilter extends OncePerRequestFilter {
  protected void doFilterInternal(HttpServletRequest req,
          HttpServletResponse res, FilterChain chain) throws … {
    String h = req.getHeader("Authorization");
    if (h != null && h.startsWith("Bearer ")) {
      try {
        Jwt jwt = decoder.decode(h.substring(7));     // signature, exp, iss, aud
        var auth = new JwtAuthenticationToken(jwt, authorities(jwt));
        SecurityContextHolder.getContext().setAuthentication(auth);
      } catch (JwtException e) {
        entryPoint.commence(req, res,
            new BadCredentialsException("bad token", e));
        return;                                         // 401, stop here
      }
    }
    chain.doFilter(req, res);                           // no token: anonymous
  }
}
// http.addFilterBefore(new JwtFilter(…), UsernamePasswordAuthenticationFilter.class)`,
      highlight: [[1, 3], [4, 9], [10, 14], [16, 19]],
      beats: B(
        "Interviewers sometimes ask you to write it by hand. Extend once per request filter, so it runs exactly once per request, even across forwards.",
        "Read the authorization header. If it's a bearer token, decode it: that checks the signature, expiry, issuer and audience. Build an authentication from the claims, and put it into the security context.",
        "If the token is invalid, reply four oh one through the entry point, and stop the chain.",
        { say: "No header at all? Just continue, as anonymous, and let the authorisation rules decide. Register it before the username password filter. But say this too: in production I'd use Spring's resource server instead of a hand-written filter, because it already does all of this correctly.", tone: "key" },
      ),
    },

    // ================================================================ 3
    sec("3", "Refresh tokens and storage", "Question three. Access tokens versus refresh tokens, and where tokens should live on the client."),
    old("refresh"),
    old("storage", { 4: "Which leaves the hardest question." }),
    sayit("Access token vs refresh token: where should each live?", "The answer:", [
      ["Access token: short-lived (5–15 min), sent on every API call, self-contained", "The access token is short-lived, five to fifteen minutes, sent on every call, and verified without a lookup."],
      ["Refresh token: long-lived, only sent to the auth server, stored server-side so it can be revoked", "The refresh token is long-lived, only ever sent to the auth server, and tracked server-side so it can be revoked."],
      ["Rotation: each refresh token works once; reuse revokes the whole family", "Refresh tokens rotate: each works once, and reusing an old one revokes the whole family, which catches theft."],
      ["Browser: access token in memory, refresh token in an HttpOnly, Secure, SameSite cookie", "In a browser, the access token lives in memory, and the refresh token in an HttpOnly, Secure, SameSite cookie, never local storage."],
    ]),

    // ================================================================ 4
    sec("4", "Revoking a JWT", "Question four. How do you revoke or invalidate a JWT before it expires?"),
    old("revoke"),
    qa(1, "Which revocation approach would you choose?", [
      "Short expiry always: caps the damage with zero state",
      "Logout or ban must be instant: a denylist of jti in Redis with a TTL = the token's remaining life",
      "“Log out everywhere”: a per-user token version (or issued-after time) checked against the claim",
      "Or opaque tokens with introspection when every request must be checked live",
    ], { ask: "So which approach would you actually choose?" }),
    check({
      topic: "JWT",
      q: "Can you put a user's password hash or PAN in a JWT's payload if the token is signed?",
      say: "Can you put a user's password hash, or a card number, in a JWT's payload, if the token is signed?",
      a: "No: a JWT is signed, not encrypted. Anyone holding it can base64-decode the payload. Signing only prevents tampering.",
      aSay: "No. A JWT is signed, not encrypted, so anyone holding it can decode the payload. The signature only stops tampering.",
    }),
    check({
      topic: "revocation",
      q: "An admin bans a user; their access token has 12 minutes left. What's the cheapest way to cut them off now?",
      say: "An admin bans a user, and their access token has twelve minutes left. What's the cheapest way to cut them off now?",
      a: "Add the token's jti (or the user's id/version) to a Redis denylist with a TTL of the remaining lifetime, checked in the filter; and revoke their refresh token so no new access tokens are issued.",
      aSay: "Put the token's id on a Redis denylist, with a time to live equal to its remaining life, checked in the filter. And revoke their refresh token, so they can't get a new one.",
    }),
    {
      kind: "drill",
      items: [
        { q: "Is a JWT encrypted?", a: "No: signed" },
        { q: "Where do services get the public key?", a: "The issuer's JWKS endpoint" },
        { q: "Which filter checks the bearer token?", a: "BearerTokenAuthenticationFilter" },
        { q: "Bad token: which status?", a: "401" },
        { q: "Refresh token reused?", a: "Revoke the family" },
        { q: "Instant revocation?", a: "jti denylist with a TTL" },
      ],
      beats: B(
        { say: "Rapid fire. Is a JWT encrypted?", hold: 3 },
        "No. Signed.",
        { say: "Where do services get the public key?", hold: 3 },
        "From the issuer's JWKS endpoint.",
        { say: "Which filter checks the bearer token in Spring?", hold: 3 },
        "The bearer token authentication filter, from the resource server.",
        { say: "A bad or expired token gives which status?", hold: 3 },
        "Four oh one.",
        { say: "An old refresh token is reused. What do you do?", hold: 3 },
        "Revoke the whole family.",
        { say: "Instant revocation?", hold: 3 },
        { say: "A denylist of token ids, with a time to live. That's JWT.", tone: "key" },
      ),
    },
  ],
};
