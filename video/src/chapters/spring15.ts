import type { Chapter } from "../lib/types.ts";
import { makeCheck } from "./checks.ts";
import { ask, B, sayit, sec } from "./core/h.ts";
import { old } from "./core/spring15old.ts";
import { qa } from "./web/h.ts";

// Spring Part 15 (src/Data/coreStackDocs/SPRING-15.md): web attacks, question
// by question; reuses the first lecture's diagrams (core/spring15old.ts).
const check = makeCheck();

export const spring15: Chapter = {
  id: "spring15",
  label: "Spring 15",
  title: "Web attacks: SQL injection, XSS, CSRF, CORS",
  theme: "py",
  voice: "en-US-AndrewMultilingualNeural",
  pace: { normal: "-3%", ask: "-5%", aside: "+4%", excite: "+4%" },
  scenes: [
    {
      kind: "title",
      eyebrow: "Spring · Part 15",
      title: "Web attacks",
      subtitle: "SQL injection, XSS, CSRF and CORS",
      beats: B("Spring, part fifteen. Web attacks: SQL injection, cross-site scripting, cross-site request forgery, and CORS. These are the follow-ups every JWT or Spring Security answer draws, so we'll take each interview question in turn, see the attack, then the fix, then the answer to say."),
    },
    old("cardlist"),

    // ================================================================ 1
    sec("1", "SQL injection", "Question one. What is SQL injection, and how do prepared statements and ORMs prevent it?"),
    old("sqlinject", { 4: "So that's the attack and the fix. Now the details interviewers push on." }),
    {
      kind: "code",
      title: "Where ORMs stop protecting you",
      lang: "java",
      code: `// safe: derived queries and bound parameters
List<User> findByEmail(String email);
@Query("select u from User u where u.email = :email")
List<User> byEmail(@Param("email") String email);

// UNSAFE: an ORM can't protect a string you built
em.createQuery("select u from User u where u.name = '" + name + "'");

// ORDER BY and table names can't be parameters: allow-list them
private static final Set<String> SORTABLE = Set.of("name", "createdAt");
if (!SORTABLE.contains(sort)) throw new BadRequestException("sort");`,
      highlight: [[1, 4], [6, 7], [9, 11]],
      beats: B(
        "Spring Data's derived methods and JPQL with named parameters are safe: the values are bound, never parsed.",
        "But an ORM doesn't protect a string you built yourself. Concatenate input into create query, or into a native query, and you're back to injection, just in JPQL instead of SQL.",
        { say: "And some parts of a query can't be parameters at all, like the column in an order by, or a table name. Map the user's choice to an allow-list. And give the app's database user only the rights it needs, so even a successful injection can't drop a table.", tone: "key" },
      ),
    },
    sayit("What is SQL injection, and how do you prevent it?", "Say it like this:", [
      ["User input becomes part of the query text, so the database runs it as code", "SQL injection is user input becoming part of the query text, so the database runs data as code."],
      ["Prepared statements send the SQL and the values separately: values are never parsed", "Prepared statements send the query shape and the values separately, so values can never be parsed as SQL."],
      ["ORMs are safe only with parameters; never concatenate into JPQL or native queries", "ORMs are only safe when you use their parameters. Building JPQL or native query strings by concatenation is just as vulnerable."],
      ["Allow-list identifiers (ORDER BY columns); least-privilege DB users", "Identifiers like sort columns go through an allow-list, and the database user gets least privilege."],
    ]),

    // ================================================================ 2
    sec("2", "XSS, and tokens in localStorage", "Question two. What is cross-site scripting, and why is storing a JWT in local storage risky?"),
    old("xss", { 5: "So, where should a token live?" }),
    {
      kind: "compare",
      title: "Where a browser app can keep a token",
      cols: [
        { title: "localStorage", icon: "🗄️", tone: "red", items: ["Readable by any script on the page", "One XSS = every token stolen", "Survives reloads"] },
        { title: "HttpOnly cookie", icon: "🍪", tone: "green", items: ["Script can't read it", "Sent automatically → needs CSRF/SameSite", "Secure, SameSite=Lax or Strict"] },
        { title: "In memory", icon: "🧠", tone: "amber", items: ["Gone on reload", "Pair with a refresh token in an HttpOnly cookie", "Short-lived access token"] },
      ],
      footer: "A common setup: short access token in memory, refresh token in an HttpOnly, Secure, SameSite cookie",
      beats: B(
        "Local storage is readable by any script running on the page. One XSS hole, and every logged-in user's token is sent to the attacker, and a JWT stays valid until it expires.",
        "An HttpOnly cookie can't be read by JavaScript at all, so it can't be stolen. But because the browser sends it automatically, it brings CSRF back, which we handle next.",
        { say: "A common setup combines them: a short-lived access token kept in memory, and the refresh token in an HttpOnly, Secure, SameSite cookie, used only to get a new access token.", tone: "key" },
      ),
    },
    sayit("What is XSS, and why is a JWT in localStorage risky?", "Out loud:", [
      ["XSS = the attacker's script running in my site's origin (stored, reflected, DOM-based)", "XSS is the attacker's script running inside my site's origin, stored, reflected, or DOM-based."],
      ["Prevent: escape output by context, avoid raw HTML sinks, add a Content-Security-Policy", "I prevent it by escaping output for its context, avoiding raw HTML sinks like innerHTML, and adding a content security policy."],
      ["localStorage is readable by any injected script: one hole steals every token", "Local storage is readable by any injected script, so one hole steals every user's token."],
      ["HttpOnly cookies can't be read by script (XSS can still act in the page, though)", "HttpOnly cookies can't be read by script. XSS can still act inside the page, but it can't take the token away."],
    ]),

    // ================================================================ 3
    sec("3", "CSRF", "Question three. What is CSRF, and why can a stateless JWT API disable CSRF protection?"),
    old("csrf", { 6: "So here's the Spring side, and the answer." }),
    {
      kind: "code",
      title: "CSRF in Spring Security: on by default",
      lang: "java",
      code: `// a browser app with session cookies: keep it (the default)
http.csrf(Customizer.withDefaults());
// CsrfFilter requires a token on POST, PUT, PATCH, DELETE

// an API authenticated ONLY by "Authorization: Bearer ..."
http.csrf(csrf -> csrf.disable())
    .sessionManagement(s ->
        s.sessionCreationPolicy(SessionCreationPolicy.STATELESS));`,
      highlight: [[1, 3], [5, 8]],
      beats: B(
        "In Spring Security, CSRF protection is on by default. The CSRF filter demands a token on every state-changing method: post, put, patch and delete. Which is also why get requests must never change state.",
        { say: "For an API authenticated only by a bearer header, you can disable it, and make the API stateless. But only if no cookie authenticates anything. The moment auth rides on a cookie, keep CSRF protection, or at least SameSite cookies.", tone: "key" },
      ),
    },
    sayit("What is CSRF, and why can a stateless JWT API disable it?", "The answer:", [
      ["CSRF tricks a logged-in browser into sending a request the user didn't intend", "CSRF tricks a logged-in browser into sending a state-changing request the user never meant to send."],
      ["It works because browsers attach cookies automatically", "It works only because the browser attaches cookies automatically."],
      ["Defences: a CSRF token, SameSite cookies, Origin checks; Spring has it on by default", "The defences are a CSRF token, SameSite cookies, and checking the Origin header, and Spring Security enables CSRF protection by default."],
      ["A Bearer-header API can disable it: no browser adds that header on its own; a JWT in a cookie can't", "An API that only reads a bearer header can disable it, because no browser attaches that header by itself. If the JWT is in a cookie, it can't."],
    ]),
    check({
      topic: "CSRF",
      q: "Your API keeps the JWT in a cookie, and you disabled CSRF \"because we use JWT\". Is that safe?",
      say: "Your API keeps the JWT in a cookie, and you disabled CSRF, because you use JWT. Is that safe?",
      a: "No: the browser sends the cookie automatically, so a forged form post carries the token. Keep CSRF protection or SameSite=Strict/Lax, or move the token to an Authorization header.",
      aSay: "No. The browser sends that cookie automatically, so a forged form post arrives with a valid token. Keep CSRF protection or strict SameSite cookies, or move the token into the authorization header.",
    }),

    // ================================================================ 4
    sec("4", "CORS", "Question four. What is CORS, and who enforces it?"),
    old("origins"),
    old("preflight"),
    old("notprotect"),
    qa(1, "How do you configure CORS correctly in Spring?", [
      "In the security chain: http.cors(withDefaults()) plus a CorsConfigurationSource bean",
      "Otherwise the preflight (no credentials) is rejected with 401 before MVC's CORS runs",
      "List real origins: \"*\" can't be combined with allowCredentials(true)",
    ], { code: `http.cors(Customizer.withDefaults());\n\n@Bean CorsConfigurationSource cors() {\n  var c = new CorsConfiguration();\n  c.setAllowedOrigins(List.of("https://app.example"));\n  c.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));\n  c.setAllowedHeaders(List.of("Authorization", "Content-Type"));\n  c.setAllowCredentials(true);\n  var src = new UrlBasedCorsConfigurationSource();\n  src.registerCorsConfiguration("/**", c);\n  return src;\n}`, ask: "And the practical question: how do you configure CORS correctly in Spring?" }),
    sayit("What is CORS, and who enforces it?", "Say it like this:", [
      ["The browser's same-origin policy blocks reading other origins' responses", "The browser's same-origin policy lets a page send requests to another origin, but not read the responses."],
      ["CORS: the server's headers say which origins may read them", "CORS is the server's way of saying, with response headers, which other origins may read them."],
      ["The browser enforces it, with a preflight OPTIONS for non-simple requests", "The browser enforces it, sending a preflight options request first for anything non-simple, like a JSON body or an authorization header."],
      ["It doesn't protect the API (curl ignores it) and isn't a CSRF defence", "It doesn't protect the API, since curl ignores it, and it isn't a CSRF defence. Authentication and authorisation protect the API."],
    ]),
    check({
      topic: "CORS",
      q: "The browser says “blocked by CORS policy”, but the same call works in Postman. Why?",
      say: "The browser says blocked by CORS policy, but the same call works in Postman. Why?",
      a: "CORS is enforced by browsers only. The server isn't sending an Access-Control-Allow-Origin for that origin (often the preflight got a 401 because CORS isn't configured in the security chain).",
      aSay: "Because only browsers enforce CORS. The server isn't returning an allow-origin header for that origin. Often the preflight got a four oh one, because CORS wasn't configured in the security chain.",
    }),
    {
      kind: "drill",
      items: [
        { q: "Fix for SQL injection?", a: "Prepared statements / bound parameters" },
        { q: "Can ORDER BY be a parameter?", a: "No: allow-list it" },
        { q: "Can HttpOnly stop XSS?", a: "No: it stops token theft" },
        { q: "CSRF on by default in Spring?", a: "Yes" },
        { q: "Who enforces CORS?", a: "The browser" },
        { q: "Does CORS stop CSRF?", a: "No" },
      ],
      beats: B(
        { say: "Rapid fire. The fix for SQL injection?", hold: 3 },
        "Prepared statements: bound parameters.",
        { say: "Can an order by column be a parameter?", hold: 3 },
        "No. Allow-list it.",
        { say: "Does HttpOnly stop XSS?", hold: 3 },
        "No. It stops the token being stolen.",
        { say: "Is CSRF protection on by default in Spring Security?", hold: 3 },
        "Yes.",
        { say: "Who enforces CORS?", hold: 3 },
        "The browser.",
        { say: "Does CORS stop CSRF?", hold: 3 },
        { say: "No. That's web attacks.", tone: "key" },
      ),
    },
  ],
};
