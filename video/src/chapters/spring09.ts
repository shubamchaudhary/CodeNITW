import type { Chapter } from "../lib/types.ts";

// Spring Part 9 (src/Data/coreStackDocs/SPRING-09.md): the filter chain, the
// authentication flow, where users and passwords come from, sessions vs tokens.

export const spring09: Chapter = {
  id: "spring09",
  label: "Spring 9",
  title: "Spring Security architecture",
  voice: "en-US-AndrewMultilingualNeural",
  scenes: [
    {
      kind: "custom",
      name: "starter",
      beats: [
        { say: "You add one dependency, the Spring Boot security starter, to a working API." },
        { say: "Now every endpoint answers four oh one. A login page appears. And the log prints a generated password." },
        { say: "You didn't touch a single controller. Everything happened in a chain of filters, sitting in front of them. That chain is what interviewers want you to draw.", tone: "key" },
      ],
    },
    {
      kind: "title",
      eyebrow: "Spring · Part 9",
      title: "Spring Security architecture",
      subtitle: "filter chain, authentication flow, users, sessions vs tokens",
      beats: [{ say: "Spring, part nine. How Spring Security is built." }],
    },

    { kind: "section", num: "1", title: "Who you are, what you may do", beats: [{ say: "First, two words people mix up." }] },
    {
      kind: "custom",
      name: "doorman",
      beats: [
        {
          say: "Authentication asks: who are you? Checking a password, a token, or a certificate.",
          term: { word: "Authentication", meaning: "proving who you are" },
        },
        {
          say: "Authorization asks: what may you do? Checking your roles for this URL or this method. It always comes second.",
          term: { word: "Authorization", meaning: "deciding what you may do" },
        },
        { say: "And their failures. Four oh one: we don't know who you are, log in again. Four oh three: we know exactly who you are, and the answer is no. Despite its name, four oh one really means unauthenticated.", tone: "key" },
      ],
    },

    { kind: "section", num: "2", title: "The filter chain", beats: [{ say: "Now, the chain itself." }] },
    {
      kind: "custom",
      name: "chain",
      beats: [
        {
          say: "A servlet filter sees every request before Spring MVC does. But Tomcat knows nothing about Spring beans. So Spring Security registers one plain servlet filter as a bridge: the delegating filter proxy.",
          term: { word: "DelegatingFilterProxy", meaning: "servlet filter that hands off to a Spring bean" },
        },
        {
          say: "It hands the request to a bean called spring security filter chain: the filter chain proxy. That proxy picks the first security filter chain whose URL pattern matches.",
          term: { word: "SecurityFilterChain", meaning: "an ordered list of security filters for some URLs" },
        },
        { say: "Then the request walks the filters, in order. Load any existing context. CORS answers preflights. CSRF checks its token. Then the authentication filters, basic, bearer token or form login, read credentials and log the user in. If nobody did, an anonymous user is set." },
        { say: "Last come the exception translation filter, and the authorization filter. Authorization runs last, because it needs to know who you are.", tone: "key" },
        { say: "In Spring Security six, you configure this by declaring security filter chain beans. The old web security configurer adapter is gone.", tone: "aside" },
      ],
    },
    {
      kind: "code",
      title: "A stateless API chain",
      lang: "java",
      code: `@Bean
SecurityFilterChain api(HttpSecurity http) throws Exception {
  return http
    .securityMatcher("/api/**")
    .csrf(csrf -> csrf.disable())
    .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
    .authorizeHttpRequests(auth -> auth
      .requestMatchers("/api/public/**").permitAll()
      .requestMatchers(DELETE, "/api/**").hasRole("ADMIN")
      .anyRequest().authenticated())
    .httpBasic(Customizer.withDefaults())
    .build();
}`,
      highlight: [[1, 4], [5, 6], [7, 10], [11, 12]],
      beats: [
        { say: "Here's a real chain for an API. Security matcher limits it to slash API." },
        { say: "CSRF off, because tokens travel in a header. And no sessions at all: stateless." },
        { say: "Then the rules. They're checked top to bottom, and the first match wins. So specific rules first, and any request last.", tone: "key" },
        { say: "And finally, how users authenticate. Here, basic auth." },
      ],
    },

    { kind: "section", num: "3", title: "The authentication flow", beats: [{ say: "Now, who actually checks the password?" }] },
    {
      kind: "custom",
      name: "authflow",
      beats: [
        { say: "Asha logs in. An authentication filter reads her username and password, and wraps them in an unauthenticated token." },
        {
          say: "It hands the token to the authentication manager. The usual one, the provider manager, asks each of its providers: can you handle this kind of token? The DAO authentication provider says yes.",
          term: { word: "AuthenticationManager", meaning: "asks providers to authenticate a token" },
        },
        {
          say: "That provider loads Asha through the user details service: her password hash, and her roles. That's where users come from: memory, or your database.",
          term: { word: "UserDetailsService", meaning: "loads a user by username" },
        },
        { say: "Then the password encoder compares the raw password with the stored hash." },
        {
          say: "It matches. The authenticated token goes into the security context holder, a thread local. Any code on this request thread can now ask: who is this?",
          term: { word: "SecurityContextHolder", meaning: "holds the current user, per thread" },
        },
        { say: "A wrong password throws an authentication exception. The exception translation filter turns it into a four oh one. It all happens in the filter chain, so controller advice never sees it.", tone: "aside" },
      ],
    },

    { kind: "section", num: "4", title: "Storing passwords", beats: [{ say: "So how is that hash made?" }] },
    {
      kind: "custom",
      name: "hashing",
      beats: [
        { say: "Two users pick the same password. With a fast hash like SHA two fifty six, they get the same hash. And attackers can test billions of guesses a second." },
        {
          say: "B crypt adds a random salt to every password, so equal passwords get different hashes.",
          term: { word: "BCrypt", meaning: "salted, deliberately slow password hashing" },
        },
        { say: "And it's deliberately slow, with a work factor. Spring's delegating password encoder stores the algorithm as a prefix, so you can upgrade later. And you never compare hashes yourself: call matches.", tone: "key" },
      ],
    },

    { kind: "section", num: "5", title: "Sessions or tokens", beats: [{ say: "Last: where does the logged-in state live?" }] },
    {
      kind: "custom",
      name: "sessions",
      beats: [
        { say: "Stateful: the server keeps a session, and the browser holds a J session I D cookie. Easy to revoke, just delete the session. But many instances need a shared store, and cookies bring CSRF." },
        {
          say: "Stateless: the server keeps nothing. Every request carries a token, and any instance can verify it. It scales freely. But a token is hard to revoke before it expires.",
          term: { word: "Stateless auth", meaning: "every request carries its own proof" },
        },
        { say: "Session creation policy stateless tells Spring Security never to create or read a session.", tone: "key" },
        { say: "And for ownership checks, add pre authorize on service methods. It works through a proxy, so a call from inside the same class skips it.", tone: "aside" },
      ],
    },
    {
      kind: "custom",
      name: "recap",
      props: {
        items: [
          ["🚪", "401 vs 403", "unknown vs not allowed"],
          ["🌉", "DelegatingFilterProxy", "servlet filter to Spring bean"],
          ["⛓️", "SecurityFilterChain", "CORS, CSRF, auth, authorization"],
          ["🧑‍⚖️", "AuthenticationManager", "providers check tokens"],
          ["🗂️", "UserDetailsService", "loads users + hashes"],
          ["🧂", "BCrypt", "salted, slow hashes"],
        ],
      },
      beats: [
        { say: "Let's lock it in." },
        { say: "Four oh one: unknown. Four oh three: known, but not allowed." },
        { say: "The delegating filter proxy bridges Tomcat to Spring's filter chain proxy." },
        { say: "The security filter chain runs CORS, CSRF, authentication, and authorization last." },
        { say: "The authentication manager asks providers to check the token." },
        { say: "The user details service loads users, and their hashes." },
        { say: "And B crypt hashes are salted, and slow.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "recall",
      props: { a: "from memory: draw one request from Tomcat to the controller", b: "then draw the login path: filter, manager, provider, user details service, password encoder" },
      beats: [
        { say: "Before your interview: from memory, draw one request, from Tomcat, through the filter chain, to the controller." },
        { say: "Then draw the login path. Filter, manager, provider, user details service, and password encoder.", tone: "key", hold: 3 },
      ],
    },
    {
      kind: "title",
      eyebrow: "Spring · Part 9",
      title: "That's Spring Security",
      subtitle: "next: JWT, the token itself",
      beats: [{ say: "That's Spring Security. Next: the JWT itself.", tone: "excite" }],
    },
  ],
};
