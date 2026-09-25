// Who is using the app right now, and one way for any code to ask them to sign
// in. Every page is readable without an account; signing in is only needed to
// change something (tick a topic, write a note, highlight, plan a day).
//
// No React here: the store layer uses it to refuse a guest's write, and the
// app renders one sign-in prompt that listens for requests.

let state = "unknown"; // unknown (auth still loading) | guest | user
const stateListeners = new Set();
const promptListeners = new Set();

export function setAuthState(next) {
  if (next === state) return;
  state = next;
  stateListeners.forEach((fn) => fn(state));
}

export function getAuthState() {
  return state;
}

export function onAuthStateChange(fn) {
  stateListeners.add(fn);
  return () => stateListeners.delete(fn);
}

// Open the sign-in prompt. `reason` is a short line shown under its title.
export function requestSignIn(reason) {
  promptListeners.forEach((fn) => fn(reason));
}

export function onSignInRequest(fn) {
  promptListeners.add(fn);
  return () => promptListeners.delete(fn);
}

// For a UI action that changes data: true if the user may go ahead; otherwise
// asks a guest to sign in and returns false. While auth is still loading it
// just says no, quietly — that window is a fraction of a second.
export function requireAuth(reason) {
  if (state === "user") return true;
  if (state === "guest") requestSignIn(reason);
  return false;
}
