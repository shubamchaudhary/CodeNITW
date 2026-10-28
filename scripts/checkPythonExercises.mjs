// Checks every Python exercise in src/Data/WebBasics/python.md with the same
// Pyodide build and harness the page uses:
//   write / fix   the solution passes every check, and the starter does not
//                 (so the checks really test something)
//   predict       the code runs, and its output is exactly the answer given
//                 in the ```python solution block
// Run: node scripts/checkPythonExercises.mjs   (from repo root)
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadPyodide } from "pyodide";
import { parseQuestionBank } from "../src/Data/WebBasics/index.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bank = parseQuestionBank(readFileSync(resolve(ROOT, "src/Data/WebBasics/python.md"), "utf8"));
const harness = readFileSync(resolve(ROOT, "src/pages/WebBasics/python/harness.py"), "utf8");

const py = await loadPyodide();
py.FS.writeFile("/home/pyodide/_harness.py", harness);
py.runPython("import sys; sys.path.insert(0, '/home/pyodide'); import _harness");

async function run(code, tests = "") {
  await py.loadPackagesFromImports(code);
  py.globals.set("_code", code);
  py.globals.set("_tests", tests);
  return JSON.parse(await py.runPythonAsync("await _harness.run(_code, _tests)"));
}
const green = (r) => !r.error && r.checks.length > 0 && r.checks.every((c) => c.ok);
const describe = (r) =>
  r.error ? r.error.text : r.checks.filter((c) => !c.ok).map((c) => `  ✗ ${c.label} ${c.got ?? ""} ${c.want ?? ""} ${c.error?.text ?? ""}`).join("\n");

let failures = 0;
const ids = new Set();
for (const mod of bank) {
  for (const q of mod.questions.filter((x) => x.kind)) {
    const ex = q.exercise;
    const problems = [];
    if (ids.has(q.id)) problems.push("duplicate id");
    ids.add(q.id);

    if (q.kind === "predict") {
      if (!ex.predict) problems.push("no ```python predict block");
      const r = await run(ex.predict);
      if (r.error) problems.push(`predict code raised:\n${r.error.text}`);
      else if (r.stdout.trimEnd() !== ex.solution.trimEnd())
        problems.push(`answer differs from the real output:\n--- answer\n${ex.solution}\n--- real\n${r.stdout}`);
    } else {
      if (!ex.tests) problems.push("no ```python tests block");
      if (!ex.solution) problems.push("no ```python solution block");
      const sol = await run(ex.solution, ex.tests);
      if (!green(sol)) problems.push(`solution fails:\n${describe(sol)}`);
      const start = await run(ex.starter, ex.tests);
      if (start.error?.type === "SyntaxError") problems.push(`starter doesn't parse:\n${start.error.text}`);
      else if (green(start)) problems.push("starter already passes every check");
      if (sol.checks.length < 2) problems.push(`only ${sol.checks.length} check(s)`);
    }

    const tag = `E${q.number} ${q.id} [${q.kind}] ${q.question}`;
    if (problems.length) {
      failures++;
      console.log(`✗ ${tag}\n${problems.map((p) => "  " + p.replace(/\n/g, "\n  ")).join("\n")}`);
    } else {
      console.log(`✓ ${tag}`);
    }
  }
}
console.log(failures ? `\n${failures} exercise(s) need fixing` : `\nAll ${ids.size} exercises check out`);
process.exit(failures ? 1 : 0);
