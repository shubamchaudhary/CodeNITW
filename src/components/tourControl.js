// Starting the site tour from anywhere, without loading it. The tour (and
// the animation library it brings) is fetched only when someone asks for it:
// App mounts it on the first startTour(), and the request is handed to it as
// soon as it has mounted.
const listeners = new Set();
let pending = false;
let mount = null;

export function startTour() {
  if (listeners.size) {
    listeners.forEach((fn) => fn());
    return;
  }
  pending = true;
  mount?.();
}

// The mounted tour registers its start function here (returns the cleanup).
export function onTourStart(fn) {
  listeners.add(fn);
  if (pending) {
    pending = false;
    fn();
  }
  return () => listeners.delete(fn);
}

// App: how to mount the tour when it's first wanted.
export function setTourMount(fn) {
  mount = fn;
  if (pending) fn();
}
