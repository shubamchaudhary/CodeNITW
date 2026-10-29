import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { requireAuth } from "../../Data/authGate";
import { loadJSON, saveJSON } from "../../Data/planStore";
import { recordNow } from "../../Data/noteHistory";
import { ProgressBar, Segmented, PriorityTag, buttonClass } from "../../components/ui";

// The left column of the notes page: every topic of the stack, grouped by
// section, with a tick for what's done — the course outline you'd find on a
// learning site. Picking a topic opens it; the open one is highlighted and kept
// in view.

const PREF = (stackKey) => `stackNav:${stackKey}`;
function loadNavPrefs(stackKey) {
  try {
    return { filter: "ALL", collapsed: {}, ...JSON.parse(localStorage.getItem(PREF(stackKey)) || "{}") };
  } catch (_) {
    return { filter: "ALL", collapsed: {} };
  }
}

export default function StackNav({ stack, activeId, completed, planned, onPick }) {
  const [prefs, setPrefs] = useState(() => loadNavPrefs(stack.key));
  const listRef = useRef(null);

  useEffect(() => setPrefs(loadNavPrefs(stack.key)), [stack.key]);
  const save = (next) => {
    setPrefs(next);
    try {
      localStorage.setItem(PREF(stack.key), JSON.stringify(next));
    } catch (_) {}
  };

  const filter = stack.filters && prefs.filter !== "ALL" ? prefs.filter : null;
  const sections = useMemo(
    () =>
      stack.sections
        .map((s) => ({ ...s, shown: filter ? s.topics.filter((t) => stack.matchFilter(t, filter)) : s.topics }))
        .filter((s) => s.shown.length),
    [stack, filter]
  );

  const total = stack.topics.length;
  const done = stack.topics.filter((t) => completed[t.id]).length;

  // The section holding the open topic is never collapsed, and the open topic
  // scrolls into view inside the list (never the page).
  const activeSection = stack.sections.find((s) => s.topics.some((t) => t.id === activeId))?.key;
  useEffect(() => {
    const list = listRef.current;
    const el = list?.querySelector(`[data-topic="${activeId}"]`);
    if (!list || !el) return;
    const top = el.offsetTop - list.offsetTop;
    if (top < list.scrollTop + 40 || top > list.scrollTop + list.clientHeight - 80) {
      list.scrollTo({ top: Math.max(0, top - list.clientHeight / 3) });
    }
  }, [activeId]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-5 pb-4 border-b border-line">
        <div className="flex items-baseline justify-between">
          <p className="text-[14px] font-semibold text-fg">{stack.label}</p>
          <span className="font-mono text-[12px] font-medium tabular-nums text-fg-subtle">
            {done}/{total}
          </span>
        </div>
        <ProgressBar value={total ? done / total : 0} className="mt-2.5" />
        {stack.filters && (
          <Segmented
            size="sm"
            className="mt-3"
            options={["ALL", ...stack.filters].map((f) => ({ key: f, label: f === "ALL" ? "All" : f }))}
            value={prefs.filter || "ALL"}
            onChange={(f) => save({ ...prefs, filter: f })}
          />
        )}
        {stack.importable && <ImportChapters stack={stack} onPick={onPick} />}
      </div>

      <nav ref={listRef} className="note-toc flex-1 overflow-y-auto p-2">
        {sections.map((s) => {
          const open = s.key === activeSection || !prefs.collapsed[s.key];
          const sDone = s.topics.filter((t) => completed[t.id]).length;
          return (
            <div key={s.key} className="mb-1">
              <button
                onClick={() => save({ ...prefs, collapsed: { ...prefs.collapsed, [s.key]: open } })}
                aria-expanded={open}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-surface-hover transition-colors"
              >
                <span className="flex-1 text-[13px] font-semibold text-fg">{s.label}</span>
                <span className="font-mono text-[12px] tabular-nums text-fg-subtle">
                  {sDone}/{s.topics.length}
                </span>
                <svg
                  className={`w-4 h-4 text-fg-subtle transition-transform ${open ? "" : "-rotate-90"}`}
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {open && (
                <ul className="mt-0.5 mb-2 space-y-px">
                  {s.shown.map((t) => {
                    const active = t.id === activeId;
                    const isDone = !!completed[t.id];
                    const tag = stack.tag(t);
                    return (
                      <li key={t.id}>
                        <button
                          data-topic={t.id}
                          onClick={() => onPick(t.id)}
                          aria-current={active ? "page" : undefined}
                          className={`w-full flex items-start gap-2.5 pl-2.5 pr-2 py-1.5 rounded-md text-left transition-colors ${
                            active ? "bg-surface-hover" : "hover:bg-surface-hover"
                          }`}
                        >
                          <DoneCircle done={isDone} className="w-4 h-4 mt-0.5" />
                          <span className={`flex-1 text-[14px] leading-5 ${active ? "text-fg font-medium" : "text-fg-muted"}`}>
                            {t.title}
                          </span>
                          {planned.has(t.id) && (
                            <span title="On today's plan" className="mt-[7px] w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                          )}
                          {tag && <PriorityTag tag={tag} className="mt-px" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

// Which parts a guide says each chapter holds, from its own contents table:
// "| LL-02 Streaming ingest | Parts 5–11 (…) |", "| IPP-02 … | Part 1 (…), Part 2 (…) |".
function declaredParts(lines, topics) {
  const map = new Map();
  for (const line of lines) {
    const row = line.match(/^\|\s*([A-Z]+-\d+)\b(.*)$/);
    if (!row || !topics.some((t) => t.id === row[1])) continue;
    const parts = [];
    for (const r of row[2].matchAll(/Parts?\s+(\d+)(?:\s*[–-]\s*(\d+))?/g)) {
      for (let p = Number(r[1]); p <= Number(r[2] ?? r[1]); p++) parts.push(p);
    }
    if (parts.length) map.set(row[1], parts);
  }
  return map;
}

// A whole guide in one file: cut it at its "# Part N" headings (not ones inside
// code blocks) and give each part to the chapter that holds it — as the
// guide's own contents table says, or else by the topics' `parts`, but only
// for the project the guide's title names (so one project's guide can never
// land in another's chapters). Whatever comes before the first part goes
// with it.
function splitByParts(text, topics) {
  const lines = text.split("\n");
  const cuts = [];
  let fence = null;
  lines.forEach((line, i) => {
    const f = line.match(/^\s*(`{3,}|~{3,})/);
    if (f) {
      if (!fence) fence = f[1];
      else if (line.trim().startsWith(fence)) fence = null;
      return;
    }
    const m = !fence && line.match(/^# Part (\d+)\b/);
    if (m) cuts.push({ i, part: Number(m[1]) });
  });
  const declared = declaredParts(lines, topics);
  const title = (lines.find((l) => l.startsWith("# ")) || "").toLowerCase();
  const holderOf = (part) =>
    declared.size
      ? topics.find((t) => (declared.get(t.id) || []).includes(part))
      : topics.find((t) => (t.parts || []).includes(part) && title.includes(String(t.sectionLabel).toLowerCase()));
  const byTopic = new Map();
  cuts.forEach((c, k) => {
    const topic = holderOf(c.part);
    if (!topic) return;
    const chunk = lines.slice(k === 0 ? 0 : c.i, k + 1 < cuts.length ? cuts[k + 1].i : lines.length).join("\n");
    byTopic.set(topic.id, [...(byTopic.get(topic.id) || []), chunk.replace(/(\s*\n---\s*)+$/, "").trim()]);
  });
  return [...byTopic].map(([id, chunks]) => ({ id, text: chunks.join("\n\n---\n\n") + "\n" }));
}

// Fill a stack's topics from Markdown files: one per topic, named with its id
// ("IPP-03 - ….md"), or a whole guide in one file, split by its parts. Read
// here in the browser and saved as this account's own notes, so they sync,
// version and stay private exactly like notes typed on the page. A topic that
// already has other notes is only replaced if you say so, and what it had
// stays in its History.
function ImportChapters({ stack, onPick }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const run = async (fileList) => {
    const files = [...(fileList || [])];
    if (!files.length) return;
    setBusy(true);
    try {
      const byId = new Map();
      const unmatched = [];
      for (const file of files) {
        const text = (await file.text()).replace(/\r\n/g, "\n");
        const id = (file.name.match(/\b[A-Z]+-\d+\b/) || [])[0];
        if (id && stack.getTopic(id)) {
          byId.set(id, text);
          continue;
        }
        const split = splitByParts(text, stack.topics);
        if (split.length) split.forEach((c) => !byId.has(c.id) && byId.set(c.id, c.text));
        else unmatched.push(file.name);
      }
      if (!byId.size) {
        toast.error(
          `Couldn't match ${unmatched.join(", ")} to a chapter. Pick the chapter files (“IPP-01 - ….md” …) or the whole study guide.`
        );
        return;
      }
      const found = [...byId].map(([id, text]) => ({ id, text }));
      const notes = loadJSON(stack.notesKey, {});
      const differs = (c) => (notes[c.id] || "").trim() && notes[c.id] !== c.text;
      const taken = found.filter((c) => notes[c.id] !== c.text);
      const replacing = taken.filter(differs);
      const ok =
        !replacing.length ||
        window.confirm(
          `${replacing.map((c) => `${c.id} (${stack.getTopic(c.id).title})`).join(", ")} already ${
            replacing.length === 1 ? "has" : "have"
          } notes.\n\nReplace ${replacing.length === 1 ? "it" : "them"} with what's in ${files.map((f) => f.name).join(", ")}? What's there now stays in History.`
        );
      const chosen = ok ? taken : taken.filter((c) => !differs(c));
      if (!chosen.length) {
        toast.info(taken.length ? "Nothing imported." : "Those chapters are already up to date.");
        return;
      }
      const next = { ...notes };
      chosen.forEach((c) => (next[c.id] = c.text));
      if (saveJSON(stack.notesKey, next) === false) return; // a guest: asked to sign in
      chosen.forEach((c) => recordNow(stack.notesKey, c.id));
      toast.success(`Imported ${chosen.length} chapter${chosen.length === 1 ? "" : "s"}`);
      onPick(chosen.map((c) => c.id).sort()[0]);
    } catch (_) {
      toast.error("Couldn't read those files.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => requireAuth("Sign in to import notes.") && inputRef.current?.click()}
        disabled={busy}
        title="Pick the chapter files (IPP-01 - ….md and so on) or the whole study guide. Each chapter fills its topic."
        className={`mt-3 w-full ${buttonClass("secondary")}`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M8 2.5v7.5M4.8 6.8L8 10l3.2-3.2M3 12.5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {busy ? "Importing…" : "Import chapters (.md)"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".md,.markdown,.txt,text/markdown,text/plain"
        multiple
        className="hidden"
        onChange={(e) => {
          run(e.target.files);
          e.target.value = "";
        }}
      />
    </>
  );
}

// A round tick: filled green when done, an empty ring when not.
export function DoneCircle({ done, className = "w-4 h-4" }) {
  return done ? (
    <svg className={`${className} shrink-0 text-success`} viewBox="0 0 16 16" fill="none" aria-label="Done">
      <circle cx="8" cy="8" r="7.5" fill="currentColor" />
      <path d="M4.8 8.2l2.1 2.1 4.3-4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg className={`${className} shrink-0 text-line-strong`} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.75" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
