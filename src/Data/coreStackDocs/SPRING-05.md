# Spring Part 5: Controller Annotations, ResponseEntity and HTTP Status Codes

The questions, from most to least asked: **401 vs 403**, **@PathVariable vs @RequestParam**, **@Controller vs @RestController**, **the status after create, update and delete**, **ResponseEntity**, **400 vs 422**, **500 vs 503**, **@RequestBody**, and, rarely, **3xx and 1xx**.

## 1. HTTP status codes

Five families: **1xx** info, **2xx** success, **3xx** redirect, **4xx** client mistake, **5xx** server failure.

### 401 vs 403

- **401 Unauthorized**: **not authenticated**. The token is missing, invalid or expired. "Who are you?" The client should log in again.
- **403 Forbidden**: **authenticated but not allowed**. A normal user calling an ADMIN-only API. "I know you, but no." Logging in again won't help.

Correction: the name "Unauthorized" for 401 is misleading. It's about authentication, not permission; a wrong role is 403.

Say it like this: "401 means the request isn't authenticated: no token, or an invalid or expired one, so the client should log in again. 403 means the caller is authenticated but lacks permission, like a normal user calling an admin endpoint."

### 2xx: success

- **200 OK**: success, with data in the body (GET, or an update that returns data).
- **201 Created**: a new resource was created (POST). Send a `Location` header with its URL.
- **202 Accepted**: accepted, but processing isn't finished (async jobs like export or import). Return a job id or status URL the client can poll.
- **204 No Content**: success with no body (DELETE, or an update that returns nothing).
- Correction: **206 Partial Content** is for range downloads (resuming a file, video streaming), not for "95 of 100 users saved". For partial success in a bulk call, return 200 (or 207 Multi-Status) with a result per item.

**After create, update and delete:**
- Create: 201 + a `Location` header (`ResponseEntity.created(uri)`).
- Update: 200 with the updated body, or 204 with no body.
- Delete: 204. Async work: 202 with a status URL.

### 4xx: the client must fix the request

- **400 Bad Request**: the request is malformed: required field missing, wrong type, broken JSON.
- **401 Unauthorized** and **403 Forbidden**: above.
- **404 Not Found**: the resource doesn't exist (no user with id 123).
- **405 Method Not Allowed**: wrong HTTP method. The DispatcherServlet rejects it before the controller is reached.
- **409 Conflict**: clashes with the current state: email already registered, version conflict on update.
- **415 Unsupported Media Type**: the body's `Content-Type` isn't accepted.
- **422 Unprocessable Entity**: the request is well-formed, but fails a **business rule**: "accounts can't be opened for France yet".
- **429 Too Many Requests**: rate limit hit (max 10 calls per minute per user, and this is the 11th). Often sent with a `Retry-After` header.

**400 vs 422:** 400 means the request itself is broken (bad JSON, wrong type, missing required field); 422 means the request is valid but breaks a business rule.

### 5xx: the server failed, even though the request was valid

- **500 Internal Server Error**: a generic bug or unexpected exception.
- **501 Not Implemented**: the server doesn't support this yet.
- **502 Bad Gateway**: a proxy or gateway (like Nginx) got a bad response from the app behind it, for example a misconfigured port.
- **503 Service Unavailable**: the server is temporarily down: overloaded, under maintenance, or a dependency is down. Retry later.
- **504 Gateway Timeout**: the proxy or gateway waited too long for the app behind it.

**500 vs 503:** 500 is an unexpected bug in our code; 503 is temporary unavailability, so the client should retry later. 502 and 504 come from a gateway that got a bad response, or none in time, from the service behind it.

### 3xx: redirect (rarely asked)

- **301 / 308**: moved permanently, so clients should use the new URL (legacy API to new API). 308 keeps the HTTP method (POST stays POST). 301 may change it to GET.
- **302 / 307**: temporary redirect. 307 keeps the method.
- **304 Not Modified**: caching. The client sends `If-Modified-Since` (or `If-None-Match` with an ETag). If nothing changed, the server returns 304 with no body, and the client uses its cached copy. Don't use 304 for "update with the same value"; return 200 or 204 there.

### 1xx (rarely asked)

- **100 Continue**: before uploading a large body, the client sends just the headers with `Expect: 100-continue`. The server checks auth, size and type, and replies 100. The client then sends the body on the **same** request.

## 2. @Controller, @RestController, @ResponseBody

- **@Controller**: the class handles HTTP requests. It's a `@Component`, so it becomes a bean.
- **@ResponseBody**: the method's return value is written into the HTTP response body (objects become JSON through Jackson).
- **@RestController = @Controller + @ResponseBody** on every method. Use it for REST APIs.

```java
@Controller
public class UserController {
    @GetMapping("/api/get-user")
    public String getUser() { return "XYZ"; }     // treated as a VIEW name, not data
}
```

- With plain `@Controller`, `"XYZ"` is treated as the name of an HTML page (view). No such page exists, so the client gets a **404** error response, not `"XYZ"`.
- Fix: `@RestController`, or `@ResponseBody` on the method.

Say it like this: "@RestController is @Controller plus @ResponseBody on every method, so return values become the response body, as JSON for objects. With plain @Controller, a returned String is treated as a view name."

## 3. @RequestMapping and its shortcuts

```java
@RequestMapping(path = "/fetchUser", method = RequestMethod.GET,
                consumes = "application/json", produces = "application/json")
```

- `path` and `value` mean the same thing. On the class, it sets a common prefix (`/api`).
- Shortcuts: `@GetMapping`, `@PostMapping`, `@PutMapping`, `@PatchMapping`, `@DeleteMapping`.
- `consumes`: the request `Content-Type` it accepts. `produces`: the response type it returns.

Spring rejects a request before your code runs if it doesn't match:
- Wrong HTTP method (DELETE on a POST endpoint) -> **405** Method Not Allowed.
- Wrong `Content-Type` (text sent where JSON is expected) -> **415** Unsupported Media Type.
- Client's `Accept` header doesn't match `produces` -> **406** Not Acceptable.
- No matching path -> **404**.

## 4. @PathVariable vs @RequestParam

**@RequestParam** reads query parameters. URL: `/api/fetchUser?firstName=Alex&lastName=Lee&age=32`

```java
@GetMapping("/fetchUser")
public String getUserDetails(@RequestParam("firstName") String firstName,
                             @RequestParam(name = "lastName", required = false) String lastName,
                             @RequestParam(name = "age") int age,
                             @RequestParam(name = "role", defaultValue = "USER") Role role) { ... }
```

- `required` is **true** by default. A missing param -> **400** Bad Request (`MissingServletRequestParameterException`).
- `required = false`: a missing param becomes `null`. `defaultValue`: a missing param gets that value.
- Automatic type conversion from the query string: primitives, wrappers, `String`, enums. A bad value (`age=abc`, `role=BOSS`) -> **400** (`MethodArgumentTypeMismatchException`), before the method runs.
- Custom conversion (rarely asked): register a `PropertyEditor` in an `@InitBinder` method, for example to trim and lowercase `firstName` before your method gets it.

```java
@InitBinder
protected void initBinder(WebDataBinder binder) {
    binder.registerCustomEditor(String.class, "firstName", new FirstNamePropertyEditor());
}
```

**@PathVariable** reads values from the URL path. URL: `/api/fetchUser/Alex`

```java
@GetMapping("/fetchUser/{firstName}")
public String getUserDetails(@PathVariable("firstName") String firstName) { ... }
```

When to use which:
- **@PathVariable** identifies **which resource**: `/users/123`, the user with id 123.
- **@RequestParam** filters, sorts or pages a collection: `/users?city=Delhi&page=2&sort=name`.

Say it like this: "@PathVariable reads part of the URL path and identifies the resource. @RequestParam reads the query string and is used for optional filters, sorting and pagination."

## 5. @RequestBody: JSON body to a Java object

```java
@PostMapping("/saveUser")
public String saveUser(@RequestBody User user) { ... }

public class User {
    @JsonProperty("user_name")        // JSON key "user_name" -> field username
    String username;
    String email;
}
```

```
POST /api/saveUser   Content-Type: application/json
{ "user_name": "alex", "email": "alex@example.com" }
```

- Jackson converts the JSON into `User`. This is done by an HTTP message converter.
- Trap: with `@JsonProperty("user_name")`, a JSON key `"username"` is **ignored**, so the field stays `null`. The response JSON also uses `user_name`.
- Unknown JSON fields are ignored by default in Spring Boot.
- Missing body or malformed JSON -> **400** (`HttpMessageNotReadableException`).
- `@RequestBody` (request JSON -> object) is the mirror of `@ResponseBody` (object -> response JSON).

## 6. ResponseEntity: full control of the response

A response has 3 parts: **status code**, **headers** (optional), **body**.

```java
@GetMapping("/get-user")
public ResponseEntity<String> getUser() {
    HttpHeaders headers = new HttpHeaders();
    headers.add("My-Header1", "SomeValue1");
    return ResponseEntity.status(HttpStatus.OK)      // returns a builder
            .headers(headers)                        // still a builder
            .body("My response body");               // builds the ResponseEntity
}
```

- It's the builder pattern: `status()` and `headers()` return a builder. `body()` or `build()` (for no body) return the final `ResponseEntity`, so they come last.
- `ResponseEntity<Void>` + `.build()` when there's no body.
- Shortcuts:
  - `ResponseEntity.ok(body)` -> 200
  - `ResponseEntity.created(uri).body(x)` -> 201, plus a `Location` header with the new resource's URL
  - `ResponseEntity.noContent().build()` -> 204
  - `ResponseEntity.notFound().build()` -> 404
  - `ResponseEntity.badRequest().body(err)` -> 400
- Without `ResponseEntity`: returning a POJO gives **200** + JSON. A `void` method gives **200** with an empty body.
- Alternative for a fixed status: `@ResponseStatus(HttpStatus.CREATED)` on the method.

Say it like this: "ResponseEntity represents the whole HTTP response: status, headers and body. I use it when the status or headers depend on the logic, like 201 with a Location header after a create, or 404 when the resource isn't found."

**Before the next part:** from memory, write a POST endpoint that saves a `User` and returns 201 with a `Location` header. Then list one status code each for: bad JSON, wrong role, missing token, rate limit, server down for maintenance.
