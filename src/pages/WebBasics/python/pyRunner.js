// The page's side of the Python worker: one worker for every exercise, booted
// on the first run (or warmUp), runs taken one at a time. A run that takes
// longer than the time limit is almost always an infinite loop: the worker is
// killed and the next run boots a fresh one (from the cache, a second or two).

const TIME_LIMIT_MS = 6000;

let worker = null;
let booted = null; // resolves once the interpreter is ready
let queue = Promise.resolve();
let seq = 0;
const pending = new Map();

let status = "idle"; // idle | loading | ready | failed
const listeners = new Set();
function setStatus(s) {
  status = s;
  listeners.forEach((fn) => fn(s));
}
export const getStatus = () => status;
export function onStatus(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function kill() {
  worker?.terminate();
  worker = null;
  booted = null;
}

function start() {
  if (booted) return booted;
  setStatus("loading");
  worker = new Worker(new URL("./pyWorker.js", import.meta.url), { type: "module" });
  booted = new Promise((resolve, reject) => {
    worker.onmessage = ({ data }) => {
      if (data.type === "ready") {
        setStatus("ready");
        return resolve();
      }
      const job = pending.get(data.id);
      if (data.type === "failed" && !job) {
        kill();
        setStatus("failed");
        return reject(new Error(data.message));
      }
      if (!job) return;
      pending.delete(data.id);
      if (data.type === "result") job.resolve(data.result);
      else job.reject(new Error(data.message));
    };
    worker.onerror = (e) => {
      kill();
      setStatus("failed");
      reject(new Error(e.message || "Python failed to load"));
    };
    worker.postMessage({ type: "boot" });
  });
  booted.catch(() => {});
  return booted;
}

export function warmUp() {
  return start().catch(() => {});
}

// → { stdout, error, checks: [{ label, ok, got?, want?, error? }] }, or
// { timedOut: true } when it ran past the limit.
export function runPython(code, tests = "") {
  const job = queue.then(async () => {
    await start();
    const id = ++seq;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        kill();
        setStatus("idle");
        resolve({ timedOut: true, limitMs: TIME_LIMIT_MS });
      }, TIME_LIMIT_MS);
      pending.set(id, {
        resolve: (r) => (clearTimeout(timer), resolve(r)),
        reject: (e) => (clearTimeout(timer), reject(e)),
      });
      worker.postMessage({ type: "run", id, code, tests });
    });
  });
  queue = job.catch(() => {});
  return job;
}
