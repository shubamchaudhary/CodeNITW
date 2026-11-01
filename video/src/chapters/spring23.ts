import type { Chapter } from "../lib/types.ts";

// Spring Part 23 (src/Data/coreStackDocs/SPRING-23.md): JWT structure,
// verification, where Spring checks it, refresh, storage and revocation.

export const spring23: Chapter = {
  id: "spring23",
  label: "Spring 23",
  title: "JWT: structure, stateless auth, revocation and refresh",
  voice: "en-US-AndrewMultilingualNeural",
  scenes: [
    {
      kind: "custom",
      name: "twenty",
      beats: [
        { say: "Asha logs in once. For the next fifteen minutes, every request she sends, to any of your service instances, proves who she is." },
        { say: "No database lookup. No session store. The token proves itself. Interviewers then dig into four things: how it's verified, where Spring checks it, how refresh works, and how you kill one early.", tone: "key" },
      ],
    },
    {
      kind: "title",
      eyebrow: "Spring · Part 23",
      title: "JWT",
      subtitle: "structure, verification, refresh, revocation",
      beats: [{ say: "Spring, part twenty three. J W T." }],
    },

    { kind: "section", num: "1", title: "Three parts", beats: [{ say: "First, what's actually inside one." }] },
    {
      kind: "custom",
      name: "anatomy",
      beats: [
        {
          say: "A JSON web token is three parts, separated by dots. Each part is base sixty four URL encoded.",
          term: { word: "JWT", meaning: "header.payload.signature, Base64URL encoded" },
        },
        { say: "The header says how it was signed: the algorithm, and a key id." },
        { say: "The payload holds the claims. Issuer, subject, audience, expiry, a unique id, and custom claims like roles." },
        { say: "The signature is computed over the header and the payload, with a key. Now watch: change the role from user to admin, and the signature no longer matches. Rejected.", tone: "excite" },
        { say: "But here's the catch. It's signed, not encrypted. Anyone can decode the payload and read it. So never put secrets in it.", tone: "key" },
      ],
    },

    { kind: "section", num: "2", title: "Signing and verifying", beats: [{ say: "So who signs, and who verifies?" }] },
    {
      kind: "custom",
      name: "keys",
      beats: [
        { say: "With H S two fifty six, there's one shared secret. Every service that verifies tokens also holds the secret, so it could mint tokens too. Leak it from any one service, and anyone can." },
        {
          say: "With R S two fifty six, only the auth server holds the private key, and signs. Services fetch public keys from a JWKS endpoint, and can only verify. The key id in the header says which key to use.",
          term: { word: "JWKS", meaning: "the published set of public keys" },
        },
        { say: "And verify four things, every time. The signature, with an algorithm you pin. Expiry. The issuer. And the audience: was this token meant for my API?", tone: "key" },
        { say: "Two classic attacks. A token with algorithm none, and no signature, that a careless library accepts." },
        { say: "And algorithm confusion: the server expects R S two fifty six, but receives H S two fifty six, signed with the server's own public key as the secret. Pinning the algorithm stops both.", tone: "aside" },
      ],
    },

    { kind: "section", num: "3", title: "Where Spring checks it", beats: [{ say: "Now, the question from a real SDE two loop: where in the filter chain is the token validated?" }] },
    {
      kind: "custom",
      name: "jwtpath",
      beats: [
        {
          say: "Use Spring's resource server. Point it at your issuer, and it adds a bearer token authentication filter, which reads the authorization header.",
          term: { word: "Resource server", meaning: "Spring's built-in JWT validation" },
        },
        { say: "The JWT decoder fetches the issuer's public keys once, caches them, and checks the signature, expiry and issuer." },
        { say: "A converter turns the scope claim into authorities, and the token lands in the security context holder." },
        { say: "Then the authorization filter checks the URL rules, as usual." },
        { say: "And the two failures. A bad or expired token stops at the decoder: four oh one, with error invalid token. A valid token without the right role: four oh three.", tone: "key" },
      ],
    },
    {
      kind: "code",
      title: "A hand-written JWT filter",
      lang: "java",
      code: `class JwtFilter extends OncePerRequestFilter {
  protected void doFilterInternal(req, res, chain) {
    String h = req.getHeader("Authorization");
    if (h != null && h.startsWith("Bearer ")) {
      try {
        Claims c = jwt.verify(h.substring(7));
        var auth = new UsernamePasswordAuthenticationToken(
            c.getSubject(), null, jwt.authorities(c));
        SecurityContextHolder.getContext().setAuthentication(auth);
      } catch (JwtException e) {
        SecurityContextHolder.clearContext();
      }
    }
    chain.doFilter(req, res);
  }
}
// http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)`,
      highlight: [[1, 4], [6, 9], [10, 14]],
      beats: [
        { say: "If you write your own, extend once per request filter, so it runs once per request, and read the bearer header." },
        { say: "Verify the token, build an authentication from its claims, and put it in the security context. Don't load the user from the database, or you're not stateless anymore." },
        { say: "On a bad token, don't throw. Clear the context, and keep going. The entry point returns a clean four oh one for protected URLs, and public ones still work. Register it before the username password filter.", tone: "key" },
      ],
    },

    { kind: "section", num: "4", title: "Refresh tokens", beats: [{ say: "Next: why there are two tokens." }] },
    {
      kind: "custom",
      name: "refresh",
      beats: [
        {
          say: "A stolen access token works until it expires, so it lives just fifteen minutes. A refresh token lives for days, is stored server side, and is only ever sent to the refresh endpoint.",
          term: { word: "Refresh token", meaning: "long-lived, server-side, only for new access tokens" },
        },
        { say: "When the access token expires, the app sends refresh token R one, and gets a new access token, plus a new refresh token, R two." },
        {
          say: "That's rotation. Every refresh token works exactly once.",
          term: { word: "Rotation", meaning: "each refresh issues a new refresh token" },
        },
        { say: "So if an attacker copied R one, and uses it again, the server sees a reused token. It revokes the whole family, and forces a fresh login.", tone: "excite" },
      ],
    },
    {
      kind: "custom",
      name: "storage",
      beats: [
        { say: "Where should the browser keep tokens? Local storage is easy. But any script on the page can read it. One XSS bug, and every token is stolen." },
        { say: "Memory, a plain variable, is out of a script's easy reach, but it's lost on every reload." },
        { say: "An HttpOnly cookie can't be read by script at all. But the browser sends it automatically, so you need same site, or a CSRF token." },
        { say: "A common answer: access token in memory. Refresh token in an HttpOnly, secure, same site strict cookie, scoped to the refresh path. After a reload, call refresh.", tone: "key" },
      ],
    },

    { kind: "section", num: "5", title: "Revoking early", beats: [{ say: "And the question that always comes: how do you revoke one?", tone: "excite" }] },
    {
      kind: "custom",
      name: "revoke",
      beats: [
        { say: "An admin bans Asha. Her token is still valid for twelve more minutes, and no service checks anywhere. That was the whole point of JWT.", tone: "ask" },
        { say: "First, keep expiry short. Five to fifteen minutes caps the damage, with no state at all." },
        {
          say: "For instant revocation, keep a denylist. Store the revoked token's j t i in Redis, with a time to live equal to its remaining life. The filter checks it on every request.",
          term: { word: "Denylist", meaning: "revoked token ids, kept until they expire" },
        },
        { say: "Or put a version number in the token, and bump the user's version to log out everywhere. And revoke the refresh token, so the session dies within one access lifetime." },
        { say: "Notice every option brings back a little server side state. Saying that trade off out loud is the answer they want.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "recap",
      props: {
        items: [
          ["🎫", "JWT", "signed, not encrypted"],
          ["🗝️", "JWKS", "public keys to verify"],
          ["🛡️", "Resource server", "Bearer filter + JwtDecoder"],
          ["♻️", "Refresh + rotation", "one use, reuse = revoke"],
          ["🍪", "Storage", "memory + HttpOnly cookie"],
          ["🚫", "Denylist", "jti in Redis, with TTL"],
        ],
      },
      beats: [
        { say: "Let's lock it in." },
        { say: "A JWT is signed, not encrypted." },
        { say: "Services verify with public keys from the JWKS endpoint." },
        { say: "Spring's resource server checks it in the bearer token filter, before authorization." },
        { say: "Refresh tokens rotate, and reuse revokes the family." },
        { say: "Keep the access token in memory, and the refresh token in an HttpOnly cookie." },
        { say: "And for instant revocation, a denylist with a time to live.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "recall",
      props: { a: "from memory: write a JWT's three parts with five claims", b: "then draw refresh with rotation, and list three ways to revoke, with the cost of each" },
      beats: [
        { say: "Before your interview: from memory, write a JWT's three parts, with five claims." },
        { say: "Then draw refresh with rotation, and list three ways to revoke a token, with the cost of each.", tone: "key", hold: 3 },
      ],
    },
    {
      kind: "title",
      eyebrow: "Spring · Part 23",
      title: "That's JWT",
      subtitle: "next: OAuth 2.0 and service-to-service tokens",
      beats: [{ say: "That's JWT. Next: OAuth two.", tone: "excite" }],
    },
  ],
};
