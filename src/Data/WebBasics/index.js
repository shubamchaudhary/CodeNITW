// JS · React · Node basics (owner-only): one question bank per tech, written
// as markdown so answers can carry tables and code. Each file is a list of
// modules ("## Title") in learning order, each a list of questions
// ("### id | Question") whose body is the answer. The ids are what the ticks
// are stored under, so never renumber them — add new ones at the end.

export const WEB_BASICS = [
  { key: "javascript", path: "/javascript", label: "JavaScript", short: "JS", load: () => import("./javascript.md?raw") },
  { key: "react", path: "/react", label: "React", short: "React", load: () => import("./react.md?raw") },
  { key: "nodejs", path: "/nodejs", label: "Node.js", short: "Node", load: () => import("./nodejs.md?raw") },
];

export const WEB_BASICS_PATHS = WEB_BASICS.map((t) => t.path);

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
    const h = line.match(/^### ([\w-]+) \| (.+)$/);
    if (h && mod) {
      flush();
      q = { id: h[1], question: h[2].trim(), lines: [] };
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
