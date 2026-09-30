import { getAuth } from "firebase/auth";
import { getAuthState, onAuthStateChange } from "./authGate";
import { isOwner } from "../components/OwnerRoute";

// First-party visit stats: a page view on every route change, plus each real
// sign-in and sign-up, sent to /api/track (which keeps no raw IP — see
// api/_lib/visits.mjs). Nothing is sent from development builds, automated
// browsers, or the owner's devices: once the owner signs in on a device, that
// device never reports again, signed in or not.

const VISITOR = "ipp:visitor"; // stable per browser
const SESSION = "ipp:session"; // { id, last } — a new session after 30 idle minutes
const EXCLUDED = "ipp:noTrack";
const SESSION_IDLE_MS = 30 * 60 * 1000;

const randomId = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => (b % 36).toString(36)).join("");

function read(storage, key) {
  try {
    return storage.getItem(key);
  } catch (_) {
    return null;
  }
}
function write(storage, key, value) {
  try {
    storage.setItem(key, value);
  } catch (_) {}
}

export function isDeviceExcluded() {
  return read(localStorage, EXCLUDED) === "1";
}

export function setDeviceExcluded(on) {
  try {
    if (on) localStorage.setItem(EXCLUDED, "1");
    else localStorage.removeItem(EXCLUDED);
  } catch (_) {}
}

function ids() {
  let visitorId = read(localStorage, VISITOR);
  const newVisitor = !visitorId;
  if (!visitorId) {
    visitorId = randomId();
    write(localStorage, VISITOR, visitorId);
  }
  let session = null;
  try {
    session = JSON.parse(read(sessionStorage, SESSION) || "null");
  } catch (_) {}
  const now = Date.now();
  if (!session || now - session.last > SESSION_IDLE_MS) session = { id: randomId(), last: now };
  session.last = now;
  write(sessionStorage, SESSION, JSON.stringify(session));
  return { visitorId, sessionId: session.id, newVisitor };
}

// Resolves once Firebase knows whether someone is signed in (or after 4 s),
// so a signed-in visit is attributed to its account.
function authSettled() {
  if (getAuthState() !== "unknown") return Promise.resolve();
  return new Promise((resolve) => {
    const stop = onAuthStateChange((s) => {
      if (s !== "unknown") {
        stop();
        resolve();
      }
    });
    setTimeout(() => {
      stop();
      resolve();
    }, 4000);
  });
}

let firstView = true;

export async function trackVisit(type, path) {
  try {
    if (!import.meta.env.PROD || navigator.webdriver || isDeviceExcluded()) return;
    await authSettled();
    const user = getAuth().currentUser;
    if (isOwner(user)) {
      setDeviceExcluded(true);
      return;
    }
    const token = user ? await user.getIdToken().catch(() => null) : null;
    const body = {
      type,
      path,
      ...ids(),
      referrer: firstView ? document.referrer : "",
      screen: `${window.screen.width}x${window.screen.height}`,
      lang: navigator.language,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    if (type === "view") firstView = false;
    fetch("/api/track", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    }).catch(() => {});
  } catch (_) {
    // Stats must never get in the way of the page.
  }
}

// A real sign-in (or sign-up), not a session Firebase restored on page load:
// Firebase stamps the account's last sign-in, so only one moments ago counts.
export function trackSignIn(user) {
  if (!user) return;
  if (isOwner(user)) {
    setDeviceExcluded(true);
    return;
  }
  const signedInAt = Date.parse(user.metadata?.lastSignInTime || "") || 0;
  if (Date.now() - signedInAt > 2 * 60 * 1000) return;
  const key = `ipp:signin:${user.uid}:${signedInAt}`;
  if (read(sessionStorage, key)) return;
  write(sessionStorage, key, "1");
  const createdAt = Date.parse(user.metadata?.creationTime || "") || 0;
  trackVisit(Math.abs(signedInAt - createdAt) < 60 * 1000 ? "signup" : "signin", window.location.pathname);
}
