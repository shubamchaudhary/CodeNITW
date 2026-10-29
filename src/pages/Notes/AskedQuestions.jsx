import React, { useEffect, useState } from "react";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { buttonClass } from "../../components/ui";

// Each stack's asked-questions data, loaded on demand: most pages that import a
// stack never need it.
const LOADERS = {
  corestack: () => import("../../Data/CoreStackAsked").then((m) => [m.CORE_STACK_ASKED, m.CORE_STACK_ASKED_META]),
  projects: () => import("../../Data/KafkaAsked").then((m) => [m.KAFKA_ASKED, m.KAFKA_ASKED_META]),
};

export const hasAskedQuestions = (source) => !!LOADERS[source];

// The fixed foot of a Core Stack note (and the Kafka question bank): questions
// real interviews asked on this topic in the last two years, how often, where,
// and an answer for each. It is data, not part of the note — it can't be
// edited, and it always sits below whatever the reader has written. Answers
// stay folded so the question gets tried first.
export default function AskedQuestions({ source = "corestack", topicId, colorMode, standalone = false }) {
  const [entry, setEntry] = useState(null);
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    let live = true;
    LOADERS[source]().then(([entries, m]) => {
      if (!live) return;
      setEntry(entries[topicId] || null);
      setMeta(m);
    });
    return () => {
      live = false;
    };
  }, [source, topicId]);

  if (!entry || !meta) return null;

  return (
    <section className={`note-ui ${standalone ? "" : "mt-16 pt-10 border-t border-line"}`} aria-label="Asked in interviews">
      <p className="font-mono text-[12px] font-medium text-fg-subtle">
        Asked in interviews · {meta.window}
      </p>
      <h2 className="mt-1 text-[20px] leading-7 font-semibold tracking-[-0.01em] text-fg">
        What interviewers actually asked
      </h2>
      {entry.posts > 0 && (
        <p className="mt-2 max-w-[46rem] text-[14px] leading-relaxed text-fg-muted">
          {entry.posts} of {meta.posts.toLocaleString()} candidate write-ups touched this topic. Counts are write-ups that asked the
          question. Say your answer out loud before you open ours.
        </p>
      )}
      {entry.note && <p className="mt-2 max-w-[46rem] text-[14px] leading-relaxed text-warning-fg">{entry.note}</p>}

      <ol className="mt-4 divide-y divide-line">
        {entry.items.map((item, i) => (
          <AskedItem key={i} index={i} item={item} colorMode={colorMode} />
        ))}
      </ol>

      <p className="mt-6 text-[12px] leading-relaxed text-fg-subtle">
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
    <li className="py-4">
      <div className="flex gap-3">
        <span className="shrink-0 w-5 pt-[3px] font-mono text-[12px] font-medium tabular-nums text-fg-subtle">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] leading-[22px] font-semibold text-fg">{item.q}</p>
          <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12px] text-fg-subtle">
            {item.resume && <span className="mr-1 font-medium text-brand-fg">From your resume</span>}
            {item.n ? (
              <span className="mr-1 font-mono font-medium tabular-nums text-fg">
                {item.n} write-up{item.n === 1 ? "" : "s"}
              </span>
            ) : item.resume ? null : (
              <span className="mr-1 text-warning-fg">Question banks only</span>
            )}
            {item.video && (
              <span className="mr-1 inline-flex items-center h-5 px-1.5 rounded font-mono font-medium text-sky-600 dark:text-sky-400 bg-surface-subtle border border-line">
                {item.video}
              </span>
            )}
            {shown.map((c) => (
              <span key={c} className="inline-flex items-center h-5 px-1.5 rounded bg-surface-subtle border border-line text-fg-muted">
                {c}
              </span>
            ))}
            {more > 0 && <span>+{more} more</span>}
          </p>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className={`mt-3 ${buttonClass("secondary", "sm")}`}
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
