import React, { useEffect, useMemo, useRef, useState } from "react";

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
      <div className="px-5 pt-6 pb-4 border-b border-gray-200/80 dark:border-white/[0.07]">
        <div className="flex items-baseline justify-between">
          <p className="text-[17px] font-bold tracking-tight text-gray-900 dark:text-gray-50">{stack.label}</p>
          <span className="text-[12.5px] font-semibold tabular-nums text-gray-500 dark:text-gray-400">
            {done}/{total} done
          </span>
        </div>
        <div className="mt-2.5 h-1.5 rounded-full bg-gray-200/90 dark:bg-white/[0.08] overflow-hidden">
          <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-300" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
        </div>
        {stack.filters && (
          <div className="mt-4 flex gap-1">
            {["ALL", ...stack.filters].map((f) => (
              <button
                key={f}
                onClick={() => save({ ...prefs, filter: f })}
                className={`h-7 px-2.5 rounded-md text-[12px] font-semibold transition-colors ${
                  (prefs.filter || "ALL") === f
                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                {f === "ALL" ? "All" : f}
              </button>
            ))}
          </div>
        )}
      </div>

      <nav ref={listRef} className="note-toc flex-1 overflow-y-auto px-3 py-3">
        {sections.map((s) => {
          const open = s.key === activeSection || !prefs.collapsed[s.key];
          const sDone = s.topics.filter((t) => completed[t.id]).length;
          return (
            <div key={s.key} className="mb-1.5">
              <button
                onClick={() => save({ ...prefs, collapsed: { ...prefs.collapsed, [s.key]: open } })}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-white/[0.03]"
              >
                <span className="flex-1 text-[14.5px] font-semibold text-gray-800 dark:text-gray-100">{s.label}</span>
                <span className="text-[11.5px] tabular-nums text-gray-400 dark:text-gray-500">
                  {sDone}/{s.topics.length}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${open ? "" : "-rotate-90"}`}
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {open && (
                <ul className="mt-0.5 space-y-px">
                  {s.shown.map((t) => {
                    const active = t.id === activeId;
                    const isDone = !!completed[t.id];
                    const tag = stack.tag(t);
                    return (
                      <li key={t.id}>
                        <button
                          data-topic={t.id}
                          onClick={() => onPick(t.id)}
                          className={`w-full flex items-start gap-2.5 pl-3 pr-2 py-[7px] rounded-lg text-left transition-colors ${
                            active
                              ? "bg-emerald-50 dark:bg-emerald-400/10"
                              : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                          }`}
                        >
                          <DoneCircle done={isDone} className="w-[17px] h-[17px] mt-[1px]" />
                          <span
                            className={`flex-1 text-[14px] leading-snug ${
                              active
                                ? "text-emerald-700 dark:text-emerald-300 font-medium"
                                : "text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {t.title}
                          </span>
                          {planned.has(t.id) && (
                            <span title="On today's plan" className="mt-[7px] w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                          )}
                          <span className={`mt-[2px] text-[10.5px] font-bold tabular-nums shrink-0 ${tag.cls}`}>{tag.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}

        {stack.skip && (
          <div className="mt-4 mx-2 rounded-xl border border-gray-200/90 dark:border-white/[0.07] px-3 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Not studying</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-gray-500 dark:text-gray-400">
              {stack.skip.topics.map((t) => t.replace(/\.$/, "")).join(" · ")}
            </p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-gray-600 dark:text-gray-300">
              <span className="font-semibold">If asked: </span>“{stack.skip.line}”
            </p>
          </div>
        )}
      </nav>
    </div>
  );
}

// A round tick: filled green when done, an empty ring when not.
export function DoneCircle({ done, className = "w-4 h-4" }) {
  return done ? (
    <svg className={`${className} shrink-0 text-emerald-500`} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7.5" fill="currentColor" />
      <path d="M4.8 8.2l2.1 2.1 4.3-4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg className={`${className} shrink-0 text-gray-300 dark:text-gray-600`} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.75" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
