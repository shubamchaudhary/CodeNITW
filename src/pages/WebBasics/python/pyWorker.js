// Real CPython (Pyodide, WebAssembly) in a worker, so a `while True:` in an
// exercise can only freeze the worker — pyRunner kills it and starts another.
// The interpreter (~10 MB) comes from the CDN once and is cached after that;
// a package an exercise imports (Pydantic) is fetched the first time it's used.
import HARNESS from "./harness.py?raw";

const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/";

let ready = null;
function boot() {
  ready ||= (async () => {
    const url = `${PYODIDE_URL}pyodide.mjs`;
    const { loadPyodide } = await import(/* @vite-ignore */ url);
    const py = await loadPyodide({ indexURL: PYODIDE_URL });
    py.FS.writeFile("/home/pyodide/_harness.py", HARNESS);
    py.runPython("import sys; sys.path.insert(0, '/home/pyodide'); import _harness");
    return py;
  })();
  return ready;
}

self.onmessage = async ({ data }) => {
  try {
    const py = await boot();
    if (data.type === "boot") return self.postMessage({ type: "ready" });
    await py.loadPackagesFromImports(data.code);
    py.globals.set("_code", data.code);
    py.globals.set("_tests", data.tests || "");
    const json = await py.runPythonAsync("await _harness.run(_code, _tests)");
    self.postMessage({ type: "result", id: data.id, result: JSON.parse(json) });
  } catch (e) {
    ready = null;
    self.postMessage({ type: "failed", id: data.id, message: String(e?.message || e) });
  }
};
