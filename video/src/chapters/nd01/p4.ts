import type { Scene } from "../../lib/types.ts";
import { B, qa, sec } from "../web/h.ts";
import { check } from "./p1.ts";

// Part 4: module 10 (security and configuration), module 11 (testing and
// debugging), module 12 (data, real-time and production) and the close.
export const p4: Scene[] = [
  // ================================================================ module 10
  sec("10", "Security and configuration", "Module ten. Security and configuration. Five questions, from secrets to password hashing."),
  qa(55, "How do you manage configuration and secrets (env vars, dotenv, NODE_ENV)?", [
    "Config from environment variables (12-factor); .env files only for local development, never committed",
    "Validate config at startup (Zod) and fail fast if something is missing",
    "Secrets from a secret manager in production; NODE_ENV=production enables framework optimisations",
  ]),
  {
    kind: "seq",
    title: "JWT in a Node API",
    actors: [
      { id: "c", name: "Client", icon: "📱" },
      { id: "l", name: "POST /login", icon: "🔑", tone: "amber" },
      { id: "a", name: "GET /orders", icon: "🛡️", tone: "green" },
    ],
    msgs: [
      { from: "c", to: "l", label: "email + password", step: 0 },
      { from: "l", to: "c", label: "bcrypt.compare ✓ → jwt.sign({ sub, exp: 15 min })", step: 0, tone: "amber" },
      { from: "c", to: "a", label: "Authorization: Bearer <token>", step: 1 },
      { from: "a", to: "c", label: "middleware: jwt.verify → req.user, or 401", step: 2, tone: "green" },
    ],
    note: { step: 3, text: "Signed, not encrypted · short expiry + refresh token (HttpOnly cookie) · pin the algorithm · rotate secrets", tone: "amber" },
    beats: B(
      "JWT in a Node API, in one picture. The client logs in with an email and password. The server checks the password against the stored hash, and signs a token with the user's id and a short expiry.",
      "Then every request carries the token in the authorization header.",
      "An auth middleware verifies the signature and expiry, and attaches the user to the request, or replies four oh one.",
      { say: "And the points to say: a JWT is signed, not encrypted, so no secrets inside. Keep access tokens short-lived, with a refresh token in an HttpOnly cookie. Pin the algorithm when verifying. And have a way to rotate the signing secret.", tone: "key" },
    ),
  },
  qa(56, "How does JWT authentication work in a Node API?", [
    "On login, sign a token { sub, exp } with a secret or private key",
    "Clients send it as a Bearer token; middleware verifies it and sets req.user",
    "Short expiry plus refresh tokens; revocation needs a deny-list or short lifetimes",
  ]),
  qa(57, "How do you store passwords securely?", [
    "Never plain text, never fast hashes (MD5, SHA-256 alone)",
    "Slow, salted password hashes: bcrypt, scrypt or Argon2id (the salt is built in)",
    "Compare with the library's verify (constant time); rate-limit login attempts",
  ]),
  qa(58, "What are the most important security practices for a Node/Express API?", [
    "Validate all input; parameterised queries (no SQL/NoSQL injection)",
    "helmet for headers, a tight CORS allow-list, rate limiting, body size limits",
    "Authorise every request; secrets out of code; npm audit and updated dependencies",
    "Don't leak stack traces; HTTPS; log security events",
  ]),
  qa(59, "What does the crypto module provide?", [
    "Hashing (createHash), HMACs (createHmac) for signatures and webhooks",
    "Random values: randomBytes, randomUUID; password hashing: scrypt, pbkdf2",
    "Encryption (createCipheriv with AES-GCM), key pairs, sign/verify; timingSafeEqual",
  ]),

  // ================================================================ module 11
  sec("11", "Testing and debugging", "Module eleven. Testing and debugging. Two questions."),
  qa(60, "How do you test a Node.js API?", [
    "Unit tests for services with Vitest, Jest or node:test; mock only the edges",
    "Integration tests through HTTP with supertest against the real app",
    "A real database in Docker (Testcontainers); mock external APIs (nock, MSW); run in CI",
  ], { code: `import request from "supertest";\n\ntest("GET /users/:id returns 404 for unknown id", async () => {\n  const res = await request(app).get("/users/999");\n  expect(res.status).toBe(404);\n});` }),
  qa(61, "How do you debug and profile a Node.js application?", [
    "node --inspect, then Chrome DevTools or VS Code: breakpoints, stepping",
    "CPU: --cpu-prof or clinic flame for flame graphs; memory: heap snapshots",
    "Production: structured logs, metrics, tracing (OpenTelemetry), event-loop lag",
  ]),

  // ================================================================ module 12
  sec("12", "Data, real-time and production", "Module twelve. Data, real-time and production. Sixteen questions from building real Node services, starting with databases."),
  qa(62, "Why do you need a database connection pool?", [
    "Opening a connection is slow (TCP, TLS, auth); a pool keeps some open and reuses them",
    "It also caps how many connections hit the database",
    "Size it to the DB's limit divided by your instances; release connections in finally",
  ]),
  qa(63, "ORM or raw SQL in Node (Prisma, Sequelize, TypeORM, Drizzle, Knex)?", [
    "ORM (Prisma, TypeORM): types, migrations, relations; risk of hidden N+1 and slow queries",
    "Query builders (Knex, Drizzle): close to SQL, still typed and composable",
    "Raw SQL for complex, performance-critical queries; always parameterised",
  ]),
  qa(64, "What is the difference between session-based and token-based (JWT) authentication?", [
    "Session: the server stores the session (Redis); the client holds an id in an HttpOnly cookie",
    "JWT: the client holds a signed token; the server stores nothing per user",
    "Sessions are easy to revoke; JWTs scale statelessly but are hard to revoke early",
  ]),
  {
    kind: "seq",
    title: "OAuth 2.0: “Login with Google” (authorisation code + PKCE)",
    actors: [
      { id: "u", name: "Browser", icon: "🧑" },
      { id: "a", name: "Your app", icon: "🖥️", tone: "amber" },
      { id: "g", name: "Google", icon: "🔐", tone: "green" },
    ],
    msgs: [
      { from: "u", to: "g", label: "redirect: client_id, scope, state, code_challenge", step: 0 },
      { from: "g", to: "u", label: "user signs in, consents → redirect back with ?code", step: 1, tone: "green" },
      { from: "a", to: "g", label: "server: code + client secret + code_verifier", step: 2, tone: "amber" },
      { from: "g", to: "a", label: "access token + ID token (who the user is)", step: 2, tone: "green" },
    ],
    note: { step: 3, text: "Your app never sees the password; check state (CSRF) and the ID token; then start your own session", tone: "amber" },
    beats: B(
      "OAuth for login with Google. Your app redirects the browser to Google, with its client id, the scopes it wants, a random state value, and a PKCE code challenge.",
      "The user signs in at Google, and consents. Google redirects back to your app with a short-lived authorization code.",
      "Your server exchanges that code, with its client secret and the PKCE verifier, directly with Google, and receives an access token, and an ID token that says who the user is.",
      { say: "Your app never sees the user's password. Check the state value to stop CSRF, verify the ID token, and then create your own session or token for the user.", tone: "key" },
    ),
  },
  qa(65, "How does OAuth 2.0 / \"Login with Google\" work?", [
    "Authorisation code flow with PKCE: redirect to Google → user consents → code comes back",
    "The server exchanges the code for tokens (OpenID Connect adds the ID token: who the user is)",
    "Validate state and the ID token; then create your own session; libraries: passport, openid-client",
  ]),
  qa(66, "How do you implement rate limiting?", [
    "A counter per client (IP, user, API key) per time window",
    "Algorithms: fixed window, sliding window, token bucket (allows short bursts)",
    "Store counters in Redis so all instances share them; respond 429 with Retry-After; or at the gateway",
  ]),
  qa(67, "How do you handle file uploads in Node?", [
    "multipart/form-data parsed with multer or busboy, streamed, not buffered",
    "Limit size and type; check content, not just the extension; store outside the web root",
    "Large files: pre-signed URLs so the client uploads straight to S3",
  ]),
  qa(68, "How do WebSockets work in Node, and when do you use them?", [
    "An HTTP upgrade to a persistent, two-way connection (ws, Socket.IO)",
    "For chat, multiplayer, live collaboration: frequent messages both ways",
    "Several instances: sticky sessions plus a Redis pub/sub adapter; heartbeats; authenticate on connect",
  ]),
  {
    kind: "compare",
    title: "Polling, long polling, SSE, WebSockets",
    cols: [
      { title: "Polling", tone: "muted", items: ["Ask every N seconds", "Simple, wasteful, delayed"] },
      { title: "Long polling", tone: "blue", items: ["Server holds the request until there's news", "Near real time, one message per request"] },
      { title: "SSE", tone: "green", items: ["One HTTP response that stays open", "Server → client only; auto-reconnect", "Notifications, LLM tokens"] },
      { title: "WebSockets", tone: "amber", items: ["Persistent, two-way", "Chat, games, collaboration", "More to run and scale"] },
    ],
    beats: B(
      "Four ways to push updates. Polling: the client asks every few seconds. Simple, but wasteful and delayed.",
      "Long polling: the server holds each request open until it has something, then the client asks again. Near real time, on plain HTTP.",
      "Server-Sent Events: one HTTP response that stays open, with the server writing events into it. One direction only, with automatic reconnect. Perfect for notifications and streaming LLM tokens.",
      { say: "And WebSockets: a persistent, two-way connection. For chat, games and collaboration, where the client talks a lot too. Pick the simplest one that gives you the direction and latency you need.", tone: "key" },
    ),
  },
  qa(69, "What is the difference between polling, long polling, Server-Sent Events and WebSockets?", [
    "Polling: repeated requests; long polling: a held request per message",
    "SSE: one long response, server → client, plain HTTP, auto-reconnect",
    "WebSockets: full-duplex over one connection; choose by direction and frequency",
  ]),
  qa(70, "How do you run background jobs in Node?", [
    "Not in the request: enqueue a job and return 202",
    "A queue with workers: BullMQ (Redis), RabbitMQ, SQS; retries with backoff, dead-letter queues",
    "Idempotent jobs; scheduled jobs with repeatable jobs or a scheduler, not setInterval on every instance",
  ]),
  qa(71, "How do Node microservices communicate (HTTP vs messaging, Kafka)?", [
    "Synchronous: HTTP/REST or gRPC when you need an answer now; adds coupling and latency",
    "Asynchronous: messages and events (Kafka, RabbitMQ) for decoupling and spikes",
    "Kafka: a durable, partitioned log with consumer groups; design for at-least-once and idempotency",
  ]),
  qa(72, "How do you make outbound HTTP calls resilient (timeouts, retries, circuit breakers)?", [
    "A timeout on every call (AbortSignal.timeout); fetch has none by default",
    "Retries only for transient errors, with exponential backoff and jitter; idempotency keys",
    "A circuit breaker (opossum) to fail fast when a dependency is down; keep-alive connection pools",
  ]),
  qa(73, "How do you containerise a Node app well (Docker best practices)?", [
    "Multi-stage build; npm ci --omit=dev; a slim or distroless base; copy package files first for caching",
    "Run as non-root; node directly (not npm start) so signals arrive; handle SIGTERM",
    ".dockerignore; set memory limits and --max-old-space-size; health checks",
  ]),
  qa(74, "Why use TypeScript for Node backends, and how do you run it?", [
    "Types catch bugs before runtime, make refactors safe, and document APIs",
    "Compile with tsc (or esbuild/tsup) to JavaScript for production",
    "Development: tsx or ts-node; recent Node versions can run .ts directly by stripping types",
  ]),
  qa(75, "What is NestJS, and why might a Spring developer like it?", [
    "An opinionated Node framework built on Express or Fastify, in TypeScript",
    "Modules, controllers, providers, dependency injection, decorators: very Spring-like",
    "Built-in pipes (validation), guards (auth), interceptors; good for large teams",
  ]),
  qa(76, "REST vs GraphQL in Node: when would you choose each?", [
    "REST: simple, cacheable over HTTP, great tooling: the default for most APIs",
    "GraphQL: clients ask for exactly the fields they need; one endpoint; great for many different frontends",
    "GraphQL costs: N+1 (use DataLoader), harder caching, query cost limits",
  ]),
  qa(77, "What are Node.js release lines and LTS, and which version should you run?", [
    "A new major every six months; even-numbered majors become LTS (long-term support)",
    "Active LTS, then maintenance, about 30 months in total",
    "Run the current Active LTS in production; odd versions are for trying new features",
  ]),
  check({
    topic: "production",
    q: "Your Node container is killed on every deploy mid-request. Name two Dockerfile/runtime fixes.",
    say: "Your Node container cuts off requests on every deploy. Name two fixes in the Dockerfile or the runtime.",
    a: "Start with node directly (CMD [\"node\", \"server.js\"]) so SIGTERM reaches your process (npm start may not forward it), and handle SIGTERM with a graceful shutdown (stop accepting, finish in-flight, close, exit).",
    aSay: "Start the app with node directly, not npm start, so the SIGTERM signal actually reaches your process. And handle SIGTERM with a graceful shutdown: stop accepting, finish in-flight requests, close connections, then exit.",
  }),

  // ================================================================ close
  {
    kind: "drill",
    items: [
      { q: "Is Node single-threaded?", a: "Your JS is; libuv and the OS aren't" },
      { q: "nextTick or promise: which first?", a: "nextTick" },
      { q: "What handles fs and crypto off the main thread?", a: "libuv's thread pool" },
      { q: "What's backpressure?", a: "A slow consumer; write() returns false until 'drain'" },
      { q: "Express error handler signature?", a: "(err, req, res, next), registered last" },
      { q: "CPU-heavy work in Node?", a: "worker_threads (or a job queue)" },
    ],
    beats: B(
      { say: "A last rapid-fire round. Is Node single-threaded?", hold: 3 },
      "Your JavaScript is. Libuv and the operating system aren't.",
      { say: "Next tick, or a promise callback: which runs first?", hold: 3 },
      "Next tick.",
      { say: "What runs file system and crypto work off the main thread?", hold: 3 },
      "Libuv's thread pool.",
      { say: "What is backpressure?", hold: 3 },
      "A consumer slower than the producer. Write returns false until drain.",
      { say: "The Express error handler's signature?", hold: 3 },
      "Error, request, response, next, registered last.",
      { say: "CPU-heavy work in Node goes where?", hold: 3 },
      "To worker threads, or a job queue.",
    ),
  },
  {
    kind: "bullets",
    title: "Where to go from here",
    items: [
      { icon: "📖", text: "Each module page starts this lecture at its own part", sub: "rewatch exactly what you need" },
      { icon: "🧠", text: "Read the module's theory, then the answers", sub: "the same pictures as here" },
      { icon: "⌨️", text: "Build a tiny Express API end to end", sub: "middleware, errors, a stream, graceful shutdown" },
    ],
    beats: B(
      "That's the whole Node page. Each module page has a watch card that starts this lecture at that module.",
      "Read the module's theory first, then the answers.",
      { say: "And build a tiny Express API end to end: middleware in the right order, an error handler, one streamed download, and a graceful shutdown. Being able to explain your own small service is the best preparation there is. Good luck.", tone: "key" },
    ),
  },
];
