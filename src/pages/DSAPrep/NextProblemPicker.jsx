import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DSA_PROBLEMS, DSA_PRIORITY_CONFIG } from "../../Data/DSAPrep";
import {
  fillQueue,
  loadQueueState,
  saveQueueState,
  hiddenSkips,
  dueSkips,
  familyOf,
  SKIP_RETURN_AFTER,
} from "../../Data/dsaPicker";
import { getDsaTimestamps } from "../../Data/planStore";
import { Icon } from "../../components/ui";
import { LIGHT_BUTTON } from "../../components/glass";

const BY_ID = new Map(DSA_PROBLEMS.map((p) => [p.id, p]));

// "Next up": a queue of the next QUEUE_SIZE problems from the picker engine
// (src/Data/dsaPicker.js). Adding one to today or skipping it takes it out and
// a new one slides in at the end. A skipped problem sits out until two more
// batches have gone through, then comes back. Today's DSA problems sit below.
export default function NextProblemPicker({ solved, plannedToday, onAdd, onRemove, onToggleSolved }) {
  const [qs, setQs] = useState(loadQueueState);
  const hidden = useMemo(() => hiddenSkips(qs), [qs]);
  const due = useMemo(() => dueSkips(qs), [qs]);

  const queue = useMemo(
    () =>
      fillQueue({
        problems: DSA_PROBLEMS,
        solved,
        solvedAt: getDsaTimestamps(),
        todayIds: plannedToday,
        hidden,
        due,
        queue: qs.queue,
      }),
    [solved, plannedToday, hidden, due, qs.queue]
  );

  // Remember the queue as shown (so a reload keeps its order). A skip is
  // forgotten once it's still sitting out no longer and has been put back (or
  // can't be: solved or planned meanwhile); one still waiting for a free slot
  // is kept.
  useEffect(() => {
    const skipped = Object.fromEntries(
      Object.entries(qs.skipped).filter(([id]) => hidden.has(id) || (!queue.includes(id) && !solved[id] && !plannedToday.has(id)))
    );
    saveQueueState({ queue, served: qs.served, skipped });
  }, [queue, qs.served, qs.skipped, hidden, solved, plannedToday]);

  // Taking a problem out of the queue (either way) moves the count on by one.
  // A second click on the same row — before the screen updates, or while it
  // slides out — does nothing.
  const taken = useRef(new Set());
  useEffect(() => {
    taken.current = new Set();
  }, [queue]);
  const take = (id, skip) => {
    if (!queue.includes(id) || taken.current.has(id)) return false;
    taken.current.add(id);
    setQs((s) => ({
      served: s.served + 1,
      queue: queue.filter((x) => !taken.current.has(x)),
      // Adding a problem that came back from a skip ends that skip for good.
      skipped: skip
        ? { ...s.skipped, [id]: s.served + 1 }
        : Object.fromEntries(Object.entries(s.skipped).filter(([k]) => k !== id)),
    }));
    return true;
  };
  const add = (p) => {
    if (take(p.id, false)) onAdd(p);
  };
  const skip = (p) => take(p.id, true);
  const bringBack = () => setQs((s) => ({ ...s, skipped: {} }));

  const todays = [...plannedToday].map((id) => BY_ID.get(id)).filter(Boolean);
  const doneToday = todays.filter((p) => solved[p.id]).length;

  return (
    <section className="mb-5 rounded-lg bg-canvas border border-line overflow-hidden" aria-label="Next problems">
      <div className="px-4 sm:px-5 pt-4 pb-3">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-subtle">Next up</h2>
          {hidden.size > 0 && (
            <button
              onClick={bringBack}
              title={`Skipped problems come back after ${SKIP_RETURN_AFTER} more have gone through the queue`}
              className="text-[11px] text-fg-subtle hover:text-fg-muted"
            >
              {hidden.size} skipped · bring back now
            </button>
          )}
        </div>

        {queue.length === 0 ? (
          <p className="text-[13px] text-fg-muted py-2">Nothing left to pick — every open problem is solved, planned or skipped.</p>
        ) : (
          <ol className="divide-y divide-line">
            <AnimatePresence initial={false}>
              {queue.map((id, i) => (
                <QueueRow key={id} problem={BY_ID.get(id)} index={i} onAdd={add} onSkip={skip} />
              ))}
            </AnimatePresence>
          </ol>
        )}
      </div>

      {/* Today's DSA list */}
      <div className="border-t border-line bg-surface-subtle px-4 sm:px-5 py-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[11px] font-semibold text-fg-subtle">Today</h3>
          {todays.length > 0 && (
            <span className="text-[11px] text-fg-subtle tabular-nums">
              {doneToday}/{todays.length} done
            </span>
          )}
        </div>
        {todays.length === 0 ? (
          <p className="text-[12px] text-fg-subtle">Nothing on today's list yet — add one from the queue above.</p>
        ) : (
          <ul className="space-y-1">
            {todays.map((p) => (
              <li key={p.id} className="group flex items-center gap-2.5 min-w-0">
                <button
                  onClick={() => onToggleSolved(p.id, !solved[p.id])}
                  title={solved[p.id] ? "Mark unsolved" : "Mark solved"}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    solved[p.id] ? "bg-accent border-accent" : "border-line-strong hover:border-accent"
                  }`}
                >
                  {solved[p.id] && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <a
                  href={p.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-[12.5px] font-medium truncate hover:underline ${solved[p.id] ? "text-fg-subtle line-through" : "text-fg"}`}
                >
                  {p.title}
                </a>
                <span className="text-[11px] text-fg-subtle truncate hidden sm:inline">{familyOf(p.topic)}</span>
                <button
                  onClick={() => onRemove(p)}
                  title="Remove from today"
                  className="ml-auto text-fg-subtle hover:text-fg opacity-60 group-hover:opacity-100 shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16">
                    <path d="M5 5l6 6M11 5l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function QueueRow({ problem: p, index, onAdd, onSkip }) {
  const prio = DSA_PRIORITY_CONFIG[p.priority];
  const diff =
    p.difficulty === "Hard"
      ? { label: "Hard", cls: "bg-danger-subtle text-danger-fg" }
      : p.difficulty === "Easy"
      ? { label: "Easy", cls: "bg-success-subtle text-success-fg" }
      : { label: "Med", cls: "bg-warning-subtle text-warning-fg" };

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12, pointerEvents: "none", transition: { duration: 0.12 } }}
      transition={{ duration: 0.18 }}
      className="flex items-center gap-2.5 py-2.5 min-w-0"
    >
      <span className="w-4 text-[11px] font-mono text-fg-subtle tabular-nums shrink-0">{index + 1}</span>
      {prio && (
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border shrink-0 ${prio.cls}`} title={prio.blurb}>
          {prio.label}
        </span>
      )}
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border border-line shrink-0 ${diff.cls}`}>{diff.label}</span>
      <span className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 min-w-0 flex-1">
        <a
          href={p.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13.5px] font-semibold text-fg truncate hover:underline decoration-1 underline-offset-2"
        >
          {p.title}
        </a>
        <span className="text-[11px] text-fg-subtle truncate">{p.topic}</span>
      </span>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onAdd(p)}
          title="Add to today's list"
          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[12px] font-semibold bg-primary text-on-primary hover:bg-primary-hover transition-colors"
        >
          <Icon.plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Today</span>
        </button>
        <button
          onClick={() => onSkip(p)}
          title={`Skip — comes back after ${SKIP_RETURN_AFTER} more problems`}
          className={`inline-flex items-center h-7 px-2.5 rounded-md text-[12px] font-semibold border ${LIGHT_BUTTON} transition-colors`}
        >
          Skip
        </button>
      </div>
    </motion.li>
  );
}
