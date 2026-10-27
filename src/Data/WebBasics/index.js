// The owner-only question banks: JS · React · Node, and Python · FastAPI.
// One markdown file per tech, so answers can carry tables and code. Each file
// is a list of modules ("## Title") in learning order, each a list of
// questions ("### id | Question", optionally "| asked=N" for how many real
// interview write-ups asked it) whose body is the answer. The ids are what
// the ticks are stored under, so never renumber them — add new ones at the end.

export const WEB_BASICS = [
  { key: "javascript", group: "web", path: "/javascript", label: "JavaScript", load: () => import("./javascript.md?raw") },
  { key: "react", group: "web", path: "/react", label: "React", load: () => import("./react.md?raw") },
  { key: "nodejs", group: "web", path: "/nodejs", label: "Node.js", load: () => import("./nodejs.md?raw") },
  { key: "python", group: "python", path: "/python", label: "Python", load: () => import("./python.md?raw") },
  { key: "fastapi", group: "python", path: "/fastapi", label: "FastAPI", load: () => import("./fastapi.md?raw") },
];

export const WEB_BASICS_PATHS = WEB_BASICS.filter((t) => t.group === "web").map((t) => t.path);
export const PYTHON_BASICS_PATHS = WEB_BASICS.filter((t) => t.group === "python").map((t) => t.path);

// What the evidence behind the "asked" counts is, per group (null: none).
// (scripts/data/pythonInterviewEvidence.md says how the Python counts were made.)
export const ASKED_SOURCE = {
  web: null,
  python:
    "“asked N×”: how many of 456 LeetCode Discuss interview write-ups (Oct 2024 – Oct 2026) that mention Python asked it. Question banks excluded; read it as an ordering, not a percentage.",
};

// First read plus trying the answer out loud: 2.5 minutes a question, and
// another minute for every hundred words of answer and code.
function minutesFor(answer) {
  const words = answer.split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(2.5 + words / 100));
}

// Headings inside fenced code are code (a "## " line in a bash snippet), so
// only lines outside a fence can open a module or a question.
export function parseQuestionBank(text) {
  const modules = [];
  let mod = null;
  let q = null;
  let fence = null;
  const flush = () => {
    if (q) {
      q.answer = q.lines.join("\n").trim();
      q.minutes = minutesFor(q.answer);
      delete q.lines;
      q = null;
    }
  };

  for (const line of text.replace(/\r/g, "").split("\n")) {
    const f = line.match(/^\s*(`{3,}|~{3,})/);
    if (fence) {
      if (f && f[1][0] === fence[0] && f[1].length >= fence.length && line.trim() === f[1]) fence = null;
      if (q) q.lines.push(line);
      continue;
    }
    if (f) {
      fence = f[1];
      if (q) q.lines.push(line);
      continue;
    }
    const m = line.match(/^## (.+)$/);
    if (m) {
      flush();
      mod = { title: m[1].trim(), questions: [] };
      modules.push(mod);
      continue;
    }
    const h = line.match(/^### ([\w-]+) \| (.+?)(?: \| asked=(\d+))?$/);
    if (h && mod) {
      flush();
      q = { id: h[1], question: h[2].trim(), asked: h[3] ? Number(h[3]) : null, lines: [] };
      mod.questions.push(q);
      continue;
    }
    if (q) q.lines.push(line);
  }
  flush();

  let n = 0;
  modules.forEach((md) => md.questions.forEach((x) => (x.number = ++n)));
  return modules;
}
