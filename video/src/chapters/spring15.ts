import type { Chapter } from "../lib/types.ts";

// Spring Part 15 (src/Data/coreStackDocs/SPRING-15.md): the four web attacks
// behind every auth follow-up.

export const spring15: Chapter = {
  id: "spring15",
  label: "Spring 15",
  title: "Web attacks: SQL injection, XSS, CSRF, CORS",
  voice: "en-US-AndrewMultilingualNeural",
  scenes: [
    {
      kind: "custom",
      name: "cardlist",
      props: {
        title: "Four attacks behind every auth answer",
        items: [
          ["💉", "SQL injection", "input that becomes code"],
          ["📜", "XSS", "the attacker's script in your page"],
          ["🎭", "CSRF", "your browser, used against you"],
          ["🌍", "CORS", "who may read a response"],
        ],
      },
      beats: [
        { say: "Every answer about JWTs or Spring Security draws the same follow ups. Why is a token in local storage risky? Why can a stateless API turn off CSRF? Who actually enforces CORS?" },
        { say: "SQL injection: input that becomes code." },
        { say: "Cross site scripting: the attacker's script, running in your page." },
        { say: "Cross site request forgery: your own browser, used against you." },
        { say: "And CORS: who is allowed to read a response. Let's take them one at a time.", tone: "key" },
      ],
    },
    {
      kind: "title",
      eyebrow: "Spring · Part 15",
      title: "Web attacks",
      subtitle: "SQL injection, XSS, CSRF and CORS",
      beats: [{ say: "Spring, part fifteen. Web attacks." }],
    },

    { kind: "section", num: "1", title: "SQL injection", beats: [{ say: "First, the oldest one." }] },
    {
      kind: "custom",
      name: "sqlinject",
      beats: [
        { say: "A search endpoint builds its SQL by gluing the user's email into the query text." },
        {
          say: "Now the attacker types: quote, or, one equals one. The query becomes: email equals nothing, or one equals one. Always true. Every user comes back. The input became code. That's SQL injection.",
          tone: "excite",
          term: { word: "SQL injection", meaning: "user input becomes part of the query text" },
        },
        {
          say: "The fix is a prepared statement. The query shape, with a question mark, is sent and parsed first. The value travels separately, as data, and is never parsed as SQL. Now the same input is just an odd email address. Zero rows.",
          tone: "key",
          term: { word: "Prepared statement", meaning: "query text first, values sent separately" },
        },
        { say: "ORMs are safe only when you use their parameters. Find by email, or J P Q L with a named parameter, is safe. Gluing input into an at query string, or a native query, is not. And a column for order by can't be a parameter, so check it against an allow list.", tone: "aside" },
      ],
    },

    { kind: "section", num: "2", title: "XSS", beats: [{ say: "Next, cross site scripting." }] },
    {
      kind: "custom",
      name: "xss",
      beats: [
        { say: "A product page shows reviews as raw HTML." },
        {
          say: "An attacker posts a review containing a script tag. Now every visitor's browser runs that script, inside your site, with your site's permissions. That's cross site scripting.",
          term: { word: "XSS", meaning: "the attacker's script runs inside your site" },
        },
        { say: "And the script reads the token from local storage, and sends it to the attacker. Any script on the page can read local storage. An HttpOnly cookie, though, is invisible to JavaScript, so it can't be stolen this way.", tone: "key" },
        { say: "The fix: escape output. The angle bracket becomes ampersand l t, so the script shows as text instead of running. Templates like Thymeleaf's t h text and React do it by default. Then add a content security policy, so the browser refuses inline and foreign scripts." },
        { say: "One correction. HttpOnly doesn't stop XSS itself. The script can still send requests from the victim's browser. It only stops the token being stolen and used elsewhere.", tone: "aside" },
      ],
    },

    { kind: "section", num: "3", title: "CSRF", beats: [{ say: "Now the one people mix up the most.", tone: "excite" }] },
    {
      kind: "custom",
      name: "csrf",
      beats: [
        { say: "You're logged in to your bank. Your browser holds the bank's session cookie." },
        {
          say: "You visit an evil page. It holds a hidden form that posts to the bank's transfer endpoint, and submits it. Your browser attaches the bank's cookie automatically, because the request goes to the bank. The bank sees a valid session, and moves the money. That's cross site request forgery.",
          term: { word: "CSRF", meaning: "a forged request riding your logged-in cookie" },
        },
        {
          say: "The classic fix is a CSRF token. The bank puts a random token in its own pages, and demands it on every post. The evil page can't read the bank's pages, so the forged request has no token. Forbidden.",
          term: { word: "CSRF token", meaning: "a secret the attacker's page cannot read" },
        },
        { say: "Same site cookies help too. With same site lax, the browser won't send the cookie on a cross site post." },
        { say: "And here's the interview question. Why can a stateless JWT API disable CSRF? Because the token travels in an authorization header. No browser ever adds that header by itself, so a forged form arrives with no credentials at all.", tone: "key" },
        { say: "But if you store the JWT in a cookie, the browser sends it automatically again. Then CSRF protection has to stay on.", tone: "aside" },
      ],
    },

    { kind: "section", num: "4", title: "CORS", beats: [{ say: "Last, CORS." }] },
    {
      kind: "custom",
      name: "origins",
      beats: [
        {
          say: "An origin is the scheme, the host, and the port, together. App dot example and A P I dot example are different origins. So are localhost three thousand, and localhost eight thousand eighty.",
          term: { word: "Origin", meaning: "scheme + host + port" },
        },
        { say: "The browser's same origin policy says: a page may send a request to another origin, but may not read the answer. CORS is how that other origin says: you may.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "preflight",
      beats: [
        {
          say: "For anything beyond a simple request, like a PUT, a JSON body, or an authorization header, the browser first sends a preflight. An options request, asking: may this origin send a PUT, with an authorization header?",
          term: { word: "Preflight", meaning: "the browser's OPTIONS request asking permission" },
        },
        { say: "The server answers with access control allow origin, and the allowed methods and headers." },
        { say: "Only then does the browser send the real request, and let the page read the response." },
        { say: "Two traps. The preflight carries no credentials, so if you only use at cross origin, Spring Security rejects it with a four oh one first. Configure CORS in the security chain, with h t t p dot cors. And allow origin star can't be combined with credentials.", tone: "aside" },
      ],
    },
    {
      kind: "custom",
      name: "notprotect",
      beats: [
        {
          say: "And the line interviewers love. CORS does not protect your API. Curl, Postman, or another server ignore it completely. It only tells browsers who may read a response. Authentication and authorization protect the API.",
          tone: "key",
          term: { word: "CORS", meaning: "the server telling browsers who may read responses" },
        },
        { say: "It's not a CSRF defence either. A forged form post needs no preflight. CORS only stops the evil page from reading the answer.", tone: "aside" },
      ],
    },
    {
      kind: "custom",
      name: "recap",
      props: {
        items: [
          ["💉", "SQL injection", "prepared statements"],
          ["📜", "XSS", "escape output, CSP"],
          ["🍪", "HttpOnly", "script can't read it"],
          ["🎭", "CSRF", "token, SameSite, Bearer"],
          ["🛫", "Preflight", "OPTIONS before the real call"],
          ["🌍", "CORS", "browser-enforced, not a shield"],
        ],
      },
      beats: [
        { say: "Let's lock it in." },
        { say: "SQL injection: send values separately, with prepared statements." },
        { say: "XSS: escape output, and add a content security policy." },
        { say: "Keep tokens in HttpOnly cookies, out of the attacker's script." },
        { say: "CSRF: a token, same site cookies, or a Bearer header API." },
        { say: "A preflight asks permission before the real call." },
        { say: "And CORS is enforced by browsers. It is not a shield for your API.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "recall",
      props: { a: "from memory: draw the CSRF attack, then the CORS preflight", b: "then say why a Bearer-header API is safe from CSRF, and why CORS doesn't protect an API" },
      beats: [
        { say: "Before your interview: from memory, draw the CSRF attack, and then the CORS preflight." },
        { say: "Then say, in one line each, why a Bearer header API is safe from CSRF, and why CORS doesn't protect an API.", tone: "key", hold: 3 },
      ],
    },
    {
      kind: "title",
      eyebrow: "Spring · Part 15",
      title: "That's web attacks",
      subtitle: "next: Spring Security's filter chain",
      beats: [{ say: "That's web attacks. Next: how Spring Security is built.", tone: "excite" }],
    },
  ],
};
