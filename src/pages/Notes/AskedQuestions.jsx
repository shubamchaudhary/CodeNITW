import React, { useEffect, useState } from "react";
import MarkdownPreview from "@uiw/react-markdown-preview";

// The fixed foot of a Core Stack note: questions real interviews asked on this
// topic in the last two years, how often, where, and an answer for each. It is
// data, not part of the note — it can't be edited, and it always sits below
// whatever the reader has written. Answers stay folded so the question gets
// tried first. Loaded on demand: most pages that import Core Stack never need it.
export default function AskedQuestions({ topicId, colorMode }) {
  const [entry, setEntry] = useState(null);
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    let live = true;
    import("../../Data/CoreStackAsked").then((m) => {
      if (!live) return;
      setEntry(m.CORE_STACK_ASKED[topicId] || null);
      setMeta(m.CORE_STACK_ASKED_META);
    });
    return () => {
      live = false;
    };
  }, [topicId]);

  if (!entry || !meta) return null;

  return (
    <section className="note-ui mt-16 pt-10 border-t border-gray-200 dark:border-white/[0.08] light:border-slate-900/[0.08]" aria-label="Asked in interviews">
      <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-300">
        Asked in interviews · {meta.window}
      </p>
      <h2 className="mt-1.5 text-[24px] sm:text-[26px] font-bold tracking-tight text-gray-900 dark:text-gray-50 light:text-slate-900">
        What interviewers actually asked
      </h2>
      {entry.posts > 0 && (
        <p className="mt-2 max-w-[46rem] text-[14.5px] leading-relaxed text-gray-600 dark:text-gray-300 light:text-slate-600">
          {entry.posts} of {meta.posts.toLocaleString()} candidate write-ups touched this topic. Counts are write-ups that asked the
          question. Say your answer out loud before you open ours.
        </p>
      )}
      {entry.note && <p className="mt-2 max-w-[46rem] text-[14px] leading-relaxed text-amber-700 dark:text-amber-300/90">{entry.note}</p>}

      <ol className="mt-6 space-y-3">
        {entry.items.map((item, i) => (
          <AskedItem key={i} index={i} item={item} colorMode={colorMode} />
        ))}
      </ol>

      <p className="mt-6 text-[12.5px] leading-relaxed text-gray-500 dark:text-gray-400">
        From {meta.sources}. Each count is distinct write-ups, not people — one candidate posting two loops counts twice. A
        question with no company was asked in a write-up that did not name one.
      </p>
    </section>
  );
}

function AskedItem({ index, item, colorMode }) {
  const [open, setOpen] = useState(false);
  const names = item.companies || [];
  const shown = names.slice(0, 6);
  const more = names.length - shown.length;

  return (
    <li className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-gray-50/60 dark:bg-white/[0.02] light:border-slate-900/[0.07] light:bg-slate-50/60 px-4 sm:px-5 py-4">
      <div className="flex gap-3">
        <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[12px] font-bold flex items-center justify-center">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15.5px] font-semibold leading-snug text-gray-900 dark:text-gray-100 light:text-slate-900">{item.q}</p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-gray-500 dark:text-gray-400">
            {item.n ? (
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {item.n} write-up{item.n === 1 ? "" : "s"}
              </span>
            ) : (
              <span className="font-semibold text-amber-700 dark:text-amber-300">Question banks only</span>
            )}
            {shown.length > 0 && <span>·</span>}
            {shown.map((c) => (
              <span key={c} className="px-1.5 py-0.5 rounded-md bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-gray-300">
                {c}
              </span>
            ))}
            {more > 0 && <span>+{more} more</span>}
          </p>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="mt-3 h-8 px-3 rounded-lg text-[12.5px] font-semibold border border-gray-300 dark:border-white/[0.14] text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/[0.05]"
          >
            {open ? "Hide answer" : "Show answer"}
          </button>
          {open && (
            <div className="mt-3 asked-answer">
              <MarkdownPreview source={item.a} style={{ background: "transparent", fontSize: 14.5 }} wrapperElement={{ "data-color-mode": colorMode }} />
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
