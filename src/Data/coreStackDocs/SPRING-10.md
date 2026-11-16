# Spring Part 10: OAuth 2.0 and Service-to-Service Tokens

You build PrintMyPics, a site that prints photo books. Users keep their photos in Google Photos. The lazy design asks for the user's Google password and logs in as them. Now PrintMyPics can read the user's Gmail, delete their files, and keep that power forever: the user can only take it back by changing their password, which also breaks every other app they use. And if PrintMyPics is ever breached, the attacker gets real Google passwords.

OAuth 2.0 replaces "give me your password" with "Google, please give this app a limited key". The key opens only what the user approved (read photos), expires on its own, and can be revoked without touching the password. The same machinery also answers a backend question that comes up in every microservices interview: how does the order service prove to the inventory service that it is allowed to call it?

## 1. The four roles, and what a token is [P0]

Every OAuth conversation has four parties. Using PrintMyPics:

- **Resource owner**: the user, who owns the photos.
- **Client**: PrintMyPics, the application that wants access. "Client" means the app, not the browser.
- **Authorization server**: Google's account server. It logs the user in, shows the consent screen, and issues tokens. In company systems this is Keycloak, Okta, Auth0, Microsoft Entra ID (Azure AD) or Spring Authorization Server.
- **Resource server**: the Google Photos API, which holds the data and accepts tokens.

An **access token** is the limited key the client presents to the resource server, in a header: `Authorization: Bearer <token>`. "Bearer" means whoever holds it can use it, like cash, so it must be short-lived and kept secret.

A **scope** is a named permission inside the token, for example `photos.read`. The user approves scopes on the consent screen, and the resource server checks them on every call: a token with `photos.read` cannot delete photos.

The client registers with the authorization server once, in advance, and receives a **client_id** (public) and, if it can keep secrets, a **client_secret**. It also registers its exact **redirect URI**, the only address the authorization server will ever send results to.

Two kinds of client matter later:
- A **confidential client** runs on a server and can keep a secret (a Spring Boot backend).
- A **public client** cannot: a single-page app or a mobile app. Anything shipped to a browser or phone can be extracted.

Correction: "OAuth is a login protocol." OAuth 2.0 is about **authorization**: an app getting delegated access to an API. It never tells the client who the user is. Login is a layer added on top, called OpenID Connect (section 5).

Say it like this: "OAuth 2.0 lets a client app obtain a scoped, short-lived, revocable access token from an authorization server, and use it to call a resource server on the user's behalf, without ever seeing the user's password."

## 2. Authorization code flow with PKCE, request by request [P0]

This is the flow for any app with a human user: server-rendered web apps, single-page apps, mobile apps. Interviewers want the steps, who talks to whom, and why each parameter exists.

![The authorization code flow with PKCE](/docs-img/spring-10/auth-code.svg)

**Step 1: the client prepares PKCE and sends the user away.** The user clicks "Import from Google Photos". PrintMyPics generates a random secret, the **code_verifier** (43 to 128 characters), and its SHA-256 hash encoded in base64url, the **code_challenge**. It keeps the verifier in the user's session and redirects the browser:

```http
GET https://accounts.google.com/o/oauth2/v2/auth
    ?response_type=code
    &client_id=printmypics
    &redirect_uri=https://printmypics.com/oauth/callback
    &scope=photos.read
    &state=af0ifjsldkj
    &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
    &code_challenge_method=S256
```

`state` is a random value the client also stores; it comes back unchanged in step 3.

**Step 2: the user logs in and consents, at Google.** The browser is now on Google's page. The password is typed into Google, never into PrintMyPics. Google shows "PrintMyPics wants to: view your photos" and the user clicks Allow.

**Step 3: Google redirects back with a one-time code.**

```http
HTTP/1.1 302 Found
Location: https://printmypics.com/oauth/callback?code=SplxlOBeZQQYbYS6WxSbIA&state=af0ifjsldkj
```

The **authorization code** is not a token. It is a short-lived (typically under a minute), single-use ticket. PrintMyPics first checks that `state` equals what it stored; a mismatch means the callback was forged, and it stops.

**Step 4: the client's backend exchanges the code, on a back channel.** This call goes server to server, not through the browser:

```http
POST https://oauth2.googleapis.com/token
Content-Type: application/x-www-form-urlencoded
Authorization: Basic base64(printmypics:client_secret)

grant_type=authorization_code
&code=SplxlOBeZQQYbYS6WxSbIA
&redirect_uri=https://printmypics.com/oauth/callback
&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

**Step 5: the authorization server checks everything and issues tokens.** It verifies the client secret, that the code is unused and unexpired, that `redirect_uri` matches the one from step 1, and that `SHA-256(code_verifier)` equals the stored `code_challenge`. Then:

```json
{
  "access_token": "ya29.a0AfH6SMBx...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "1//0gLx...",
  "scope": "photos.read"
}
```

If anything fails, it answers `400` with `{"error": "invalid_grant"}` and no tokens.

**Step 6: the client calls the API.**

```http
GET https://photoslibrary.googleapis.com/v1/mediaItems
Authorization: Bearer ya29.a0AfH6SMBx...
```

The resource server validates the token and its scope, and returns the photos. An expired or invalid token gets `401` with `WWW-Authenticate: Bearer error="invalid_token"`; a valid token without the needed scope gets `403` with `error="insufficient_scope"`.

### Why each piece exists

- **A code, not a token, in the redirect.** Redirect URLs end up in browser history, server logs and `Referer` headers. Only a useless-on-its-own, one-minute, one-time code travels there; the real token comes over a direct HTTPS call.
- **PKCE** (Proof Key for Code Exchange, said "pixie"). Picture a malicious app on the same phone that registered the same custom URL scheme and intercepts the redirect with the code. Without PKCE it could redeem the code. With PKCE it cannot, because redeeming needs the verifier, which never left the real client. For public clients, which have no secret, PKCE is what proves "I am the same app that started this flow". Current guidance is to use PKCE for every client, confidential ones too, because it also stops code-injection attacks.
- **state.** Without it, an attacker can start a flow with their own Google account, then trick the victim's browser into loading the callback with the attacker's code. The victim ends up linked to the attacker's account (and uploads private photos into it). `state` ties the callback to a flow this browser actually started. This is CSRF on the callback.
- **Exact redirect URI matching.** If the authorization server accepted any URL under a domain, or a wildcard, an attacker could ask for the code to be sent to a page they control. Exact matching against the registered URI closes that.

Correction: the **implicit grant** (token returned directly in the URL fragment) and the **password grant** (the app collects the user's password and sends it to the token endpoint) are deprecated. RFC 9700, the OAuth 2.0 Security Best Current Practice (January 2025), says not to use them, and the OAuth 2.1 draft removes them. Single-page apps use authorization code with PKCE.

Say it like this: "The client redirects the user to the authorization server with a PKCE code challenge and a state value. The user logs in there, and the server redirects back with a one-time code. The client's backend exchanges that code plus the code verifier for tokens on a direct call. So the password never reaches the client, the token never travels through the browser URL, and a stolen code is useless without the verifier."

## 3. How the resource server checks a token [P0]

The inventory API receives `Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6...`. What exactly does it check before trusting it?

Most company setups issue access tokens as **JWTs**: three base64url parts, `header.payload.signature`, where the payload holds claims such as `iss` (issuer), `sub` (subject), `aud` (audience), `exp` (expiry) and `scope`, and the signature is made with the issuer's private key. The resource server validates locally, with no call to the authorization server per request:

1. **Find the key.** The token header names a key id (`kid`). The resource server fetched the issuer's public keys once from its **JWKS** endpoint (JSON Web Key Set, for example `https://auth.example.com/.well-known/jwks.json`) and caches them, refetching when an unknown `kid` appears. That is how key rotation works without downtime.
2. **Verify the signature** with that public key, using an algorithm the server has pinned (RS256 or ES256). Never trust the `alg` the token itself claims, and never accept `none`.
3. **Check the issuer** (`iss` must be exactly the expected authorization server).
4. **Check the audience** (`aud` must include this API). Without this, a token minted for the payments service would be accepted by the inventory service.
5. **Check time**: `exp` in the future, `nbf` in the past, with a small clock-skew allowance (Spring defaults to 60 seconds).
6. **Check scopes or roles** for this endpoint.

In Spring Boot this is one property, plus rules:

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://auth.example.com/realms/shop
          audiences: inventory-api
```

```java
@Bean
SecurityFilterChain api(HttpSecurity http) throws Exception {
    http
        .authorizeHttpRequests(a -> a
            .requestMatchers(HttpMethod.GET, "/stock/**").hasAuthority("SCOPE_inventory.read")
            .requestMatchers(HttpMethod.POST, "/stock/**").hasAuthority("SCOPE_inventory.write")
            .anyRequest().authenticated())
        .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
    return http.build();
}
```

From `issuer-uri`, Spring reads the issuer's discovery document, finds the JWKS URL, and validates signature, issuer and time. Each scope becomes an authority with a `SCOPE_` prefix. The filter that does this is `BearerTokenAuthenticationFilter`; on success it puts a `JwtAuthenticationToken` in the security context, so controllers can read claims.

Scopes vs roles: a **scope** says what the *client* may do on the user's behalf ("this app may read stock"). A **role** says what the *user* may do ("Asha is a warehouse manager"). Real systems check both: the token must carry the scope, and the user in it must have the role. Roles usually arrive as a custom claim, mapped with a `JwtAuthenticationConverter`.

Say it like this: "The resource server validates a JWT access token locally: it picks the public key by `kid` from the issuer's cached JWKS, verifies the signature with a pinned algorithm, checks issuer, audience and expiry, then checks the scope for the endpoint. No call to the authorization server per request."

## 4. Refresh tokens: staying logged in safely [P0]

Access tokens are short-lived on purpose (5 to 60 minutes): if one leaks, it dies soon. But users should not log in every 15 minutes. The **refresh token** solves this: a long-lived credential the client sends only to the authorization server, never to APIs, to get a new access token.

```http
POST /token
grant_type=refresh_token&refresh_token=1//0gLx...&client_id=printmypics
```

Because a refresh token lives for days or weeks, it needs stronger protection:

- **Rotation.** Each use returns a new refresh token and invalidates the old one. If an old one is ever presented again, someone stole it: the authorization server revokes the whole chain (the "token family"), logging out both the thief and the user. Rotation is required for public clients under current guidance, unless the token is sender-constrained.
- **Revocation.** Logging out or removing the app's access calls the revocation endpoint (RFC 7009); the next refresh fails, and existing access tokens die at their expiry.
- **Storage.** On a server, in the session store, encrypted. In a browser: not in localStorage (any injected script can read it).

**Where should a single-page app keep tokens?** The pattern recommended for browser apps today is the **Backend-for-Frontend (BFF)**: a small server next to the SPA acts as the confidential OAuth client, holds the tokens server-side, and gives the browser only an `HttpOnly`, `Secure`, `SameSite` session cookie. The browser calls the BFF, which attaches the access token when calling APIs. No token is ever reachable by JavaScript, so an XSS bug cannot steal it. If there is no BFF, keep the access token in memory only and accept that a reload needs a silent refresh.

Correction: "The access token can be revoked instantly." A JWT access token stays valid until its `exp`, because resource servers check it without asking anyone. Instant cutoff needs short lifetimes, a denylist, or opaque tokens (section 6).

## 5. Client credentials: service-to-service calls [P0]

Every night at 2 a.m. the order service reconciles stock with the inventory service. No user is involved. The order service is acting as itself, so there is no login, no consent and no redirect. This is the **client credentials grant**.

```mermaid
flowchart LR
    OS["order-service<br/>(client)"] -->|"1. POST /token<br/>client_credentials<br/>scope=inventory.read"| AS["Authorization<br/>server<br/>(Keycloak)"]
    AS -->|"2. access token<br/>JWT, 5 min"| OS
    OS -->|"3. GET /stock<br/>Bearer token"| IS["inventory-service<br/>(resource server)"]
    IS -.->|"4. JWKS keys,<br/>fetched once,<br/>cached"| AS
```

1. The order service authenticates itself to the token endpoint and asks for the scopes it needs:

```http
POST /realms/shop/protocol/openid-connect/token
Authorization: Basic base64(order-service:s3cr3t)

grant_type=client_credentials&scope=inventory.read
```

2. The authorization server returns `{"access_token": "...", "expires_in": 300, "token_type": "Bearer"}`. There is no refresh token: the service holds its credentials, so it simply asks again.
3. The order service calls the inventory service with the token.
4. The inventory service validates it exactly as in section 3. The `sub` claim is the order service's client id, so logs and audit show which service called.

**What to get right in production:**

- **Cache the token until shortly before it expires.** Fetching a new token per call doubles latency and can take down the authorization server at peak. Refresh at, say, 80% of the lifetime, and make sure a burst of concurrent requests triggers one fetch, not a hundred.
- **One client per service, narrowest scopes.** If the order service's secret leaks, the attacker gets only `inventory.read`, not the whole platform.
- **Audience per API.** Each API accepts only tokens minted for it.
- **Secrets out of code.** In a vault (Azure Key Vault, HashiCorp Vault, Kubernetes secrets), rotated. Stronger options replace the shared secret: a **signed JWT assertion** (`private_key_jwt`), or **mutual TLS** where the client proves itself with a certificate.

**In Spring**, the calling side is configuration plus a client:

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          inventory:
            client-id: order-service
            client-secret: ${INVENTORY_CLIENT_SECRET}
            authorization-grant-type: client_credentials
            scope: inventory.read
        provider:
          inventory:
            token-uri: https://auth.example.com/realms/shop/protocol/openid-connect/token
```

```java
@Bean
RestClient inventoryClient(OAuth2AuthorizedClientManager manager) {
    var interceptor = new OAuth2ClientHttpRequestInterceptor(manager);
    interceptor.setClientRegistrationIdResolver(request -> "inventory");
    return RestClient.builder()
        .baseUrl("https://inventory.internal")
        .requestInterceptor(interceptor)   // fetches, caches and attaches the Bearer token
        .build();
}
```

The `OAuth2AuthorizedClientManager` stores the token and fetches a new one only when it is about to expire. With `WebClient`, the equivalent is `ServletOAuth2AuthorizedClientExchangeFilterFunction`.

**Carrying the user's identity downstream.** Client credentials says "the order service is calling", not "the order service, on behalf of Asha". When the downstream service needs the user:
- **Forward the user's access token** if its audience includes the downstream API. Simple, but the token then works on every API in its audience.
- **Token exchange** (RFC 8693): the order service trades the user's token at the authorization server for a new token scoped and audienced for the inventory service, still naming Asha as the subject. This keeps least privilege per hop.

**Where mTLS fits.** A service mesh such as Istio can run mutual TLS between all services: each side presents a certificate, so the network knows *which workload* is calling and encrypts traffic. Tokens add *what it may do* and *on whose behalf*. They are layers, not alternatives.

Say it like this: "For service-to-service calls with no user, the calling service uses the client credentials grant: it authenticates with its own credentials, gets a short-lived token for itself with narrow scopes, and caches it until near expiry. The receiving service validates the JWT locally and checks scope and audience. If the user's identity must flow downstream, I'd use token exchange rather than handing the same token to every service."

## 6. OAuth vs JWT, and opaque tokens [P0]

"OAuth vs JWT" is a favourite trick question, because it compares two different kinds of thing:
- **OAuth 2.0** is a framework: which parties exist, which grants get tokens, how tokens are requested and used.
- **JWT** is a token format: a signed, self-contained JSON document.

OAuth does not say what an access token looks like. Two choices:

- **JWT access token** (standardised as RFC 9068): the resource server validates it locally with the issuer's public keys. Fast and scales with no shared state. The cost: it cannot be revoked before `exp` without extra machinery.
- **Opaque token**: a random string with no meaning. The resource server asks the authorization server's **introspection** endpoint (RFC 7662), "is this token active, and what may it do?", and gets back `{"active": true, "scope": "...", "sub": "..."}`. Revocation is instant, because the server's answer changes. The cost: a network call per request, usually cached for a few seconds.

A common split: opaque tokens for tokens that leave your perimeter (third-party clients, where instant revocation matters), JWTs inside the platform (where the volume of calls makes local validation worth it).

Say it like this: "OAuth is the authorization framework; JWT is one token format it often uses. A JWT access token is validated locally and is hard to revoke early; an opaque token is checked through introspection, costs a call, and can be revoked instantly."

## 7. OpenID Connect: adding login on top [P1]

"Sign in with Google" is not plain OAuth. **OpenID Connect (OIDC)** is a thin identity layer on the authorization code flow:

- The client adds the scope `openid` (plus `profile`, `email` if wanted).
- The token response then also contains an **ID token**: a JWT *about the user*, issued *to the client*: `sub` (a stable user id), `email`, `name`, `aud` = the client's id, `nonce` (echoing a value the client sent, to stop replay), `iat`, `exp`.
- A discovery document at `/.well-known/openid-configuration` lists every endpoint and the JWKS URL, so clients configure themselves from one issuer URL.
- A `/userinfo` endpoint returns more profile claims for a valid access token.

The rule interviewers check: the **ID token proves who logged in, for the client**. The **access token is for calling APIs**. Never send the ID token to an API as a bearer token; its audience is the client, not the API.

In Spring, `spring-boot-starter-oauth2-client` with `http.oauth2Login(Customizer.withDefaults())` runs the whole flow: redirect, callback, state and PKCE, code exchange, ID token validation, and a session for the logged-in user.

Say it like this: "OpenID Connect adds authentication to OAuth: with the `openid` scope, the code flow also returns an ID token, a signed JWT that tells the client who the user is. The access token stays for calling APIs."

## 8. Mistakes that show up in real systems [P1]

- **Skipping audience validation.** Every service trusts the same issuer, so a token for one internal API works on all of them. Set `aud` per API and validate it.
- **Long-lived access tokens "for convenience".** A 24-hour bearer token that leaks is a 24-hour breach. Keep access tokens short and use refresh tokens.
- **Tokens in localStorage.** One XSS bug exports every user's token. Use a BFF or memory-only storage.
- **Logging tokens.** Authorization headers end up in access logs and traces. Mask them at the logging layer.
- **Fetching a client-credentials token per request.** Latency doubles and the authorization server becomes the bottleneck. Cache until near expiry.
- **Trusting the gateway alone.** If only the API gateway validates tokens, anything that reaches a service directly bypasses auth. Services validate too (defence in depth).

For higher-risk APIs, **sender-constrained tokens** make a stolen token useless: with **DPoP** (RFC 9449) or **mTLS-bound tokens**, the token is tied to a key the legitimate client holds and must prove on every call.

## 9. Complete example: order-service calls inventory-service [P0]

Setup: Keycloak at `https://auth.example.com/realms/shop`. Client `order-service` with scope `inventory.read`. `inventory-service` is a resource server with the configuration from section 3 (`issuer-uri` and `audiences: inventory-api`), protecting `GET /stock/**` with `SCOPE_inventory.read`. The order service uses the `RestClient` from section 5.

Expected behaviour:

1. The first nightly call: the authorized client manager has no token, so it posts `client_credentials` to Keycloak, receives a 5-minute JWT with `aud: inventory-api` and `scope: inventory.read`, caches it, and sends `GET /stock/sku-17` with `Authorization: Bearer ...`. The inventory service fetches Keycloak's JWKS once, validates the signature, `iss`, `aud`, `exp` and the scope, and returns `200`.
2. The next 2,000 calls in the following four minutes reuse the cached token: no further calls to Keycloak. The inventory service validates each token locally against its cached keys.
3. Near expiry, the next call triggers exactly one new token request.
4. A developer misconfigures the order service with scope `orders.read` only. Keycloak issues a token, but the inventory service answers `403` with `WWW-Authenticate: Bearer error="insufficient_scope"`.
5. Someone replays a token that expired an hour ago: `401` with `error="invalid_token"`, and the log says why (expired), without logging the token itself.
6. Keycloak rotates its signing key. The next token carries a new `kid`; the inventory service does not recognise it, refetches the JWKS, finds the key, and accepts the token. No restart, no downtime.

**Before the next part:** without looking, draw the authorization code flow with PKCE as four boxes (browser, client backend, authorization server, API) and write the parameters on each arrow, then say in one sentence each why the code, PKCE, `state` and the exact redirect URI exist. Then explain to an imaginary colleague why the order service's token must carry an audience.
