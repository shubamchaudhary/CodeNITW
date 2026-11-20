// Connects the Naukri Refresher extension's job finder to this site, so there's no token to
// copy or paste. The extension's content script (extensions/naukri-refresher/site-bridge.js)
// answers this page's ping with a hello: its version, which list that browser searches for,
// and whether it needs a token. If it does, this page, signed in as the owner, asks /api/radar
// for the finder's own token ({ finder: "naukri", pair: true }; it can only send job finder
// openings) and posts it to the content script. The extension keeps it only once the site
// accepts it.
//
// Plain JS with no imports, so the extension's end-to-end test runs this exact file against a
// mock site (extensions/naukri-refresher-dev/mock-naukri.mjs).

const NS = "nr-finder";

// Post one message to the content script and wait for its answer (null on timeout).
function exchange(message, answer, { timeoutMs, repeatMs = 0 }) {
  return new Promise((resolve) => {
    let timer = null;
    let again = null;
    const done = (value) => {
      window.removeEventListener("message", onMessage);
      clearTimeout(timer);
      clearInterval(again);
      resolve(value);
    };
    // Only the extension's answers, from this same window (its content script posts here).
    const onMessage = (e) => {
      if (e.source !== window) return;
      const d = e.data;
      if (d && typeof d === "object" && d.ns === NS && d.from === "extension" && d.type === answer) done(d);
    };
    const post = () => window.postMessage({ ns: NS, from: "site", ...message }, window.location.origin);
    window.addEventListener("message", onMessage);
    timer = setTimeout(() => done(null), timeoutMs);
    if (repeatMs) again = setInterval(post, repeatMs); // the content script may not be listening yet
    post();
  });
}

/**
 * → { present: false } when this browser has no job finder;
 *   { present: true, version, scope, enabled, connected, justConnected?, error? }
 * `getIdToken` returns the signed-in owner's Firebase ID token.
 */
export async function connectFinder({ getIdToken, apiUrl = "/api/radar", timeoutMs = 3000 } = {}) {
  const hello = await exchange({ type: "ping" }, "hello", { timeoutMs, repeatMs: 400 });
  if (!hello) return { present: false };
  const info = {
    present: true,
    version: String(hello.version || ""),
    scope: ["backend", "ai", "both"].includes(hello.scope) ? hello.scope : "both",
    enabled: hello.enabled === true,
    connected: !hello.needsToken,
  };
  if (!hello.needsToken) return info;
  try {
    const idToken = getIdToken ? await getIdToken() : null;
    if (!idToken) return { ...info, error: "sign in to connect it" };
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ finder: "naukri", pair: true }),
    });
    const j = await res.json().catch(() => null);
    if (!res.ok || !j || typeof j.token !== "string") {
      return { ...info, error: res.status === 401 ? "only the owner account can connect it" : `the site answered HTTP ${res.status}` };
    }
    // The extension checks the token with the site before keeping it: allow it a few seconds.
    const paired = await exchange({ type: "token", token: j.token }, "paired", { timeoutMs: 20000 });
    if (!paired) return { ...info, error: "the extension didn't answer" };
    if (!paired.ok) return { ...info, error: paired.short || "the extension turned the token down" };
    return { ...info, connected: true, justConnected: true };
  } catch (e) {
    return { ...info, error: (e && e.message) || "failed" };
  }
}
