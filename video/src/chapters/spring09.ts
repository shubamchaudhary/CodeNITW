import type { Chapter } from "../lib/types.ts";
import { makeCheck } from "./checks.ts";
import { ask, B, sayit, sec } from "./core/h.ts";
import { old } from "./core/spring09old.ts";
import { qa } from "./web/h.ts";

// Spring Part 9 (src/Data/coreStackDocs/SPRING-09.md): Spring Security's
// architecture, question by question; reuses core/spring09old.ts diagrams.
const check = makeCheck();

export const spring09: Chapter = {
  id: "spring09",
  label: "Spring 9",
  title: "Spring Security architecture",
  theme: "py",
  voice: "en-US-AndrewMultilingualNeural",
  pace: { normal: "-3%", ask: "-5%", aside: "+4%", excite: "+4%" },
  scenes: [
    old("starter"),
    {
      kind: "title",
      eyebrow: "Spring · Part 9",
      title: "Spring Security architecture",
      subtitle: "the filter chain, the authentication flow, users and passwords",
      beats: B("Spring, part nine. Spring Security's architecture. The filter chain is the frame every security question hangs off, so once you can draw it, the rest of these answers fall into place."),
    },
    {
      kind: "bullets",
      title: "What interviews ask on this topic",
      firstItemStep: 1,
      items: [
        { icon: "⛓️", text: "How does Spring Security work: the filter chain and the authentication flow?" },
        { icon: "🚪", text: "Authentication vs authorization, and 401 vs 403" },
        { icon: "👤", text: "Where do users and passwords come from: UserDetailsService and hashing" },
        { icon: "🍪", text: "Stateful (session) vs stateless (token) authentication" },
        { icon: "🛡️", text: "How do you secure REST APIs in a Spring Boot service?" },
      ],
      beats: B(
        "Five questions, the ones real write-ups name, in this order.",
        "How it works: the filter chain and the authentication flow.",
        "Authentication versus authorisation, and four oh one versus four oh three.",
        "Where users and passwords come from.",
        "Sessions versus tokens.",
        { say: "And the open question: how would you secure a REST API in Spring Boot.", tone: "key" },
      ),
    },

    // ================================================================ 1
    sec("1", "The filter chain", "Question one. How does Spring Security work? Start with the filter chain."),
    old("chain"),
    {
      kind: "code",
      title: "A stateless API's SecurityFilterChain (Spring Security 6 and 7)",
      lang: "java",
      code: `@Bean
SecurityFilterChain api(HttpSecurity http) throws Exception {
    return http
        .securityMatcher("/api/**")
        .csrf(csrf -> csrf.disable())                 // Bearer header only
        .cors(Customizer.withDefaults())
        .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/health").permitAll()
            .requestMatchers(HttpMethod.DELETE, "/api/**").hasRole("ADMIN")
            .anyRequest().authenticated())             // most specific first
        .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
        .build();
}`,
      highlight: [[1, 4], [5, 7], [8, 11], [12, 13]],
      beats: B(
        "Since Spring Security six, you configure the chain by declaring security filter chain beans. The old WebSecurityConfigurerAdapter is gone, and version seven requires this lambda style. A security matcher limits a chain to some URLs, so you can have one chain for the API and another for an admin UI.",
        "For a stateless API: CSRF off, because auth comes in a header, CORS on, and no session.",
        "Authorisation rules are checked in order, first match wins, so put the specific rules first and any request authenticated last. Put any request first, and it swallows everything after it.",
        { say: "And oauth two resource server with jwt adds the filter that reads and verifies bearer tokens. That's the next lecture's topic.", tone: "key" },
      ),
    },
    sayit("How does Spring Security work?", "Say it like this:", [
      ["A servlet filter, DelegatingFilterProxy, hands every request to FilterChainProxy", "Spring Security is a chain of servlet filters. A delegating filter proxy, registered with Tomcat, hands every request to Spring's filter chain proxy."],
      ["FilterChainProxy picks the first SecurityFilterChain whose matcher fits", "The filter chain proxy picks the first security filter chain whose matcher fits the request."],
      ["Filters in order: context, CORS, CSRF, authentication, exception translation, authorization", "The request then runs through ordered filters: load the security context, CORS, CSRF, authentication, exception translation, and authorisation last."],
      ["Authentication fills the SecurityContext; authorization checks it against the rules", "Authentication filters put the user into the security context, and the authorisation filter checks it against the rules, before the request ever reaches a controller."],
    ]),

    // ================================================================ 2
    sec("2", "Authentication vs authorization", "Question two. Authentication versus authorisation, and four oh one versus four oh three."),
    old("doorman", { 3: "And who actually sends those two responses?" }),
    qa(1, "Who sends the 401 and who sends the 403 in Spring Security?", [
      "ExceptionTranslationFilter catches security exceptions from later in the chain",
      "Not authenticated (AuthenticationException) → AuthenticationEntryPoint → 401",
      "Authenticated but not allowed (AccessDeniedException) → AccessDeniedHandler → 403",
      "Customise both to return your JSON error format (ProblemDetail)",
    ], { ask: "Follow-up: who actually sends the four oh one, and who sends the four oh three?" }),

    // ================================================================ 3
    sec("3", "Users and passwords", "Question three. Where do users and passwords come from? Follow one login through the chain."),
    old("authflow", { 6: "And that stored hash: how is it made?" }),
    old("hashing", { 3: "Here's what you actually write." }),
    {
      kind: "code",
      title: "Users from a database, passwords hashed",
      lang: "java",
      code: `@Bean
UserDetailsService users(UserRepository repo) {
    return email -> repo.findByEmail(email)
        .map(u -> User.withUsername(u.email())
                      .password(u.passwordHash())     // stored hash, never plain
                      .roles(u.role())
                      .build())
        .orElseThrow(() -> new UsernameNotFoundException(email));
}

@Bean
PasswordEncoder passwordEncoder() {
    // "{bcrypt}$2a$10$…": the prefix lets you upgrade algorithms later
    return PasswordEncoderFactories.createDelegatingPasswordEncoder();
}`,
      highlight: [[1, 9], [11, 15]],
      beats: B(
        "A user details service has one job: load a user by username, with their password hash and roles. Here, from a JPA repository. You never load or compare plain passwords yourself.",
        { say: "And a password encoder. The delegating encoder stores a prefix like curly b crypt in front of each hash, so you can move to a stronger algorithm later, and old hashes still verify. Spring's DAO authentication provider wires these two together.", tone: "key" },
      ),
    },
    sayit("Where do users and passwords come from?", "The answer:", [
      ["A UserDetailsService loads the user, hash and roles (in memory, JDBC, JPA)", "A user details service loads the user by username, with their password hash and roles, from memory, JDBC, or JPA."],
      ["DaoAuthenticationProvider compares the raw password with the hash via a PasswordEncoder", "The DAO authentication provider uses a password encoder to compare the submitted password with that hash."],
      ["Hashes are salted and slow: bcrypt, scrypt or Argon2, never SHA-256 alone", "Hashes must be salted and deliberately slow: bcrypt, scrypt or Argon2, never a fast hash like SHA two fifty six."],
      ["DelegatingPasswordEncoder's {id} prefix allows algorithm upgrades", "And the delegating encoder's prefix lets you upgrade the algorithm without breaking existing users."],
    ]),

    // ================================================================ 4
    sec("4", "Sessions or tokens", "Question four. Stateful versus stateless authentication."),
    old("sessions"),
    sayit("Stateful (session) vs stateless (token) authentication?", "Said in an interview:", [
      ["Stateful: the server keeps a session; the browser holds a JSESSIONID cookie", "Stateful: the server stores a session, and the browser holds a session id cookie."],
      ["Easy to revoke and small cookies; needs sticky sessions or a shared store (Redis) to scale", "It's easy to revoke and the cookie is small, but scaling needs sticky sessions or a shared store like Redis, and cookies need CSRF protection."],
      ["Stateless: every request carries a signed token; any instance verifies it", "Stateless: every request carries a signed token, and any instance can verify it without a lookup."],
      ["Scales and suits APIs and mobile; revocation is hard, so keep tokens short-lived", "That scales well and suits APIs and mobile clients, but revocation is hard, so access tokens stay short-lived."],
    ]),

    // ================================================================ 5
    sec("5", "Securing a REST API", "Question five. The open one: how do you secure a REST API in a Spring Boot service?"),
    {
      kind: "bullets",
      title: "A checklist answer, in the order a request meets it",
      items: [
        { icon: "🔐", text: "HTTPS everywhere; CORS for known origins only", sub: "terminate TLS at the gateway or the app" },
        { icon: "🎫", text: "Stateless: OAuth2 resource server verifying JWTs", sub: "signature, expiry, issuer, audience" },
        { icon: "🚦", text: "URL rules in the chain, ownership checks in methods", sub: "@PreAuthorize(\"@orders.isOwner(#id, authentication)\")" },
        { icon: "🧾", text: "Validate input; consistent 401/403 JSON errors", sub: "@Valid, entry point and access-denied handler" },
        { icon: "📉", text: "Rate limits, secrets out of code, audit logs", sub: "and dependency updates" },
      ],
      beats: B(
        "Answer it as a checklist, in the order a request meets it. HTTPS everywhere, and CORS only for the front-end origins you know.",
        "Stateless authentication: Spring's OAuth two resource server, verifying JWTs: signature, expiry, issuer and audience.",
        "Authorisation at two levels. Coarse rules by URL in the filter chain, and fine-grained ownership checks on service methods, with pre authorize, enabled by enable method security. Pre authorize works through a proxy, so it doesn't fire on calls inside the same class.",
        "Validate input with bean validation, and return consistent JSON errors for four oh one and four oh three.",
        { say: "And around it: rate limits, secrets in a vault rather than the code, audit logs for sensitive actions, and keeping dependencies updated.", tone: "key" },
      ),
    },
    check({
      topic: "filter chain",
      q: "authorizeHttpRequests: anyRequest().authenticated() is listed before requestMatchers(\"/api/health\").permitAll(). What happens?",
      say: "In authorize HTTP requests, any request authenticated is listed before the rule that permits slash API slash health. What happens?",
      a: "Rules match in order and the first match wins, so /api/health requires authentication (Spring Security 6+ even fails at startup for rules after anyRequest). Put specific rules first.",
      aSay: "Rules are checked in order, and the first match wins, so health would require authentication. Newer Spring Security versions even refuse to start with rules after any request. Put the specific rules first.",
    }),
    check({
      topic: "401 vs 403",
      q: "A valid user without the ADMIN role calls DELETE /api/orders/7. 401 or 403?",
      say: "A valid, logged-in user without the admin role calls delete on an order. Four oh one, or four oh three?",
      a: "403: they're authenticated (we know who they are) but not authorised. 401 means we don't know who you are.",
      aSay: "Four oh three. We know who they are, so they're authenticated, but they're not authorised. Four oh one means we don't know who you are.",
    }),
    {
      kind: "drill",
      items: [
        { q: "Bridge from Tomcat to Spring Security?", a: "DelegatingFilterProxy → FilterChainProxy" },
        { q: "Which filter runs last?", a: "AuthorizationFilter" },
        { q: "Who loads users?", a: "UserDetailsService" },
        { q: "Unknown user status code?", a: "401" },
        { q: "Why does @PreAuthorize fail on self-calls?", a: "It works through a proxy" },
        { q: "Hash for passwords?", a: "bcrypt / scrypt / Argon2" },
      ],
      beats: B(
        { say: "Rapid fire. The bridge from Tomcat into Spring Security?", hold: 3 },
        "The delegating filter proxy, handing over to the filter chain proxy.",
        { say: "Which filter runs last?", hold: 3 },
        "The authorisation filter.",
        { say: "Who loads users?", hold: 3 },
        "The user details service.",
        { say: "The status code for an unknown user?", hold: 3 },
        "Four oh one.",
        { say: "Why doesn't pre authorize fire on a call inside the same class?", hold: 3 },
        "Because it works through a proxy, and self-calls skip it.",
        { say: "The hash for passwords?", hold: 3 },
        { say: "Bcrypt, scrypt or Argon2. That's Spring Security's architecture.", tone: "key" },
      ),
    },
  ],
};
