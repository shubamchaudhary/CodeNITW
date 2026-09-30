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
  if (sandbox) return;
  promptListeners.forEach((fn) => fn(reason));
}

// The site tour's sandbox (see Data/tourSandbox): while it's on, a guest's
// actions go through, into a throwaway copy of the store, so the tour can
// really write a note or plan a day. Nobody is asked to sign in meanwhile.
let sandbox = false;
const sandboxListeners = new Set();

export function setSandbox(on) {
  if (on === sandbox) return;
  sandbox = on;
  sandboxListeners.forEach((fn) => fn(on));
}

export function isSandbox() {
  return sandbox;
}

export function onSandboxChange(fn) {
  sandboxListeners.add(fn);
  return () => sandboxListeners.delete(fn);
}

export function onSignInRequest(fn) {
  promptListeners.add(fn);
  return () => promptListeners.delete(fn);
}

// For a UI action that changes data: true if the user may go ahead; otherwise
// asks a guest to sign in and returns false. While auth is still loading it
// just says no, quietly — that window is a fraction of a second.
export function requireAuth(reason) {
  if (state === "user" || sandbox) return true;
  if (state === "guest") requestSignIn(reason);
  return false;
}
