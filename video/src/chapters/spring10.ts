import type { Chapter } from "../lib/types.ts";

// Spring Part 10 (src/Data/coreStackDocs/SPRING-10.md): OAuth 2.0 roles, the
// authorization code flow with PKCE, client credentials between services,
// opaque vs JWT tokens, and OpenID Connect.

export const spring10: Chapter = {
  id: "spring10",
  label: "Spring 10",
  title: "OAuth 2.0 and service-to-service tokens",
  voice: "en-US-AndrewMultilingualNeural",
  scenes: [
    {
      kind: "custom",
      name: "valet",
      beats: [
        { say: "A photo printing site wants to print your Google Photos." },
        { say: "Give it your Google password? It could read your mail. And you could never take access back, without changing your password.", tone: "ask" },
        { say: "So you give it a valet key instead. It opens only your photos, it expires, and you can revoke it. Your password never leaves Google. That valet key is OAuth.", tone: "key" },
      ],
    },
    {
      kind: "title",
      eyebrow: "Spring · Part 10",
      title: "OAuth 2.0",
      subtitle: "authorization code + PKCE, client credentials, OIDC",
      beats: [{ say: "Spring, part ten. OAuth two, and service to service tokens." }],
    },

    { kind: "section", num: "1", title: "Four roles", beats: [{ say: "First, who's who." }] },
    {
      kind: "custom",
      name: "roles",
      beats: [
        { say: "You, the user who owns the photos, are the resource owner." },
        { say: "The printing site is the client: the app that wants access." },
        { say: "The authorization server logs you in and issues tokens. Google's login, or Keycloak, or Okta, in a company. And the resource server is the photos API, which accepts those tokens." },
        {
          say: "What the client gets is an access token, limited by a scope, like photos read.",
          term: { word: "Access token", meaning: "a scoped, expiring key to call an API" },
        },
        { say: "And remember: OAuth two is delegated authorization, not login. Login is added on top, by OpenID Connect.", tone: "aside" },
      ],
    },

    { kind: "section", num: "2", title: "Authorization code + PKCE", beats: [{ say: "Now the flow you'll be asked to draw.", tone: "excite" }] },
    {
      kind: "custom",
      name: "codeflow",
      beats: [
        { say: "The client makes a random code verifier, and its hash, the code challenge. Then it sends the browser to the authorization server, with the challenge, the scopes, and a random state value." },
        { say: "You log in there, and approve photos read. The client never sees your password." },
        {
          say: "The authorization server redirects back, with a short lived, one time code, and the same state. The client checks that state matches.",
          term: { word: "Authorization code", meaning: "a one-time code, swapped for tokens" },
        },
        { say: "Now the client's backend calls the token endpoint directly, never through the browser, with the code and the code verifier. The server hashes the verifier, compares it with the challenge, and returns an access token, and a refresh token." },
        { say: "Then the client calls the photos API, with the access token as a bearer header." },
        {
          say: "Why all the pieces? The browser only ever sees a short lived code, not the token. And if an attacker steals the code, they can't redeem it without the verifier. That's PKCE. State stops CSRF on the callback.",
          tone: "key",
          term: { word: "PKCE", meaning: "proof the code redeemer started the flow" },
        },
        { say: "And the implicit grant, and the password grant? Deprecated. RFC nine seven hundred, from twenty twenty five, says use authorization code with PKCE, for every app with a user.", tone: "aside" },
      ],
    },

    { kind: "section", num: "3", title: "Service to service", beats: [{ say: "Now, your own microservices." }] },
    {
      kind: "custom",
      name: "clientcreds",
      beats: [
        { say: "The order service calls the inventory service in a nightly job. There's no user anywhere. The service acts as itself." },
        {
          say: "It sends its own client id and secret to the token endpoint, with grant type client credentials, and the scope it needs. Back comes a short lived access token for the service itself. No refresh token: it just asks again.",
          term: { word: "Client credentials", meaning: "a service gets a token as itself" },
        },
        { say: "It calls inventory with that token. Inventory is a resource server: it verifies the JWT locally, with the issuer's cached public keys, and checks the scope." },
        { say: "In production, cache the token until just before it expires. Spring's authorized client manager does that. And give every service its own client, with the narrowest scopes.", tone: "key" },
        { say: "Need the user's identity downstream? Pass the user's token along, or swap it with token exchange. And mutual TLS can prove which service is calling, at the network level.", tone: "aside" },
      ],
    },
    {
      kind: "custom",
      name: "opaque",
      beats: [
        { say: "OAuth doesn't say what a token looks like. A JWT access token is verified locally. Fast, no call per request. But hard to revoke early." },
        {
          say: "An opaque token is just a random string. The API asks the authorization server's introspection endpoint: is this active, and what may it do? Instantly revocable, but a call per request.",
          term: { word: "Introspection", meaning: "asking the auth server if a token is active" },
        },
        { say: "So OAuth versus JWT isn't a real choice. OAuth is the framework. JWT is just a token format it often uses.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "oidc",
      beats: [
        {
          say: "Sign in with Google adds OpenID Connect. Ask for the open I D scope, and the same flow also returns an ID token: a JWT about the user, meant for the client.",
          term: { word: "OpenID Connect", meaning: "login on top of OAuth: the ID token" },
        },
        { say: "The ID token says who logged in. The access token is for APIs. Never send the ID token to an API.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "recap",
      props: {
        items: [
          ["🎟️", "Access token", "scoped, expiring key"],
          ["🔁", "Auth code + PKCE", "one-time code + verifier"],
          ["🤝", "Client credentials", "a service as itself"],
          ["💾", "Token caching", "until near expiry"],
          ["🔎", "Introspection", "opaque tokens, revocable"],
          ["🪪", "OpenID Connect", "ID token = login"],
        ],
      },
      beats: [
        { say: "Let's lock it in." },
        { say: "An access token is a scoped, expiring key." },
        { say: "Authorization code with PKCE: a one time code, and a verifier only the client knows." },
        { say: "Client credentials: a service gets a token as itself." },
        { say: "Cache service tokens until they're about to expire." },
        { say: "Opaque tokens are checked through introspection, and can be revoked instantly." },
        { say: "And OpenID Connect adds login, with the ID token.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "recall",
      props: { a: "from memory: draw the authorization code flow with PKCE", b: "then the client credentials call between two services, and say why code, PKCE and state each exist" },
      beats: [
        { say: "Before your interview: from memory, draw the authorization code flow with PKCE, with the parameters on each arrow." },
        { say: "Then draw client credentials between two services. And say why the code, PKCE, and state each exist.", tone: "key", hold: 3 },
      ],
    },
    {
      kind: "title",
      eyebrow: "Spring · Part 10",
      title: "That's OAuth 2.0",
      subtitle: "next: exception handling and error contracts",
      beats: [{ say: "That's OAuth. Next: exception handling.", tone: "excite" }],
    },
  ],
};
