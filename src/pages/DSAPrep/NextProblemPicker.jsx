import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DSA_PROBLEMS, DSA_PRIORITY_CONFIG } from "../../Data/DSAPrep";
import { rankNextProblems, loadSkipped, saveSkipped, familyOf } from "../../Data/dsaPicker";
import { getDsaTimestamps } from "../../Data/planStore";
import { Icon } from "../../components/ui";
import { LIGHT_BUTTON } from "../../components/glass";

const BY_ID = new Map(DSA_PROBLEMS.map((p) => [p.id, p]));

// "Next up": one problem at a time, chosen by the picker engine
// (src/Data/dsaPicker.js). Add puts it on
// today's plan and the engine moves on to the next; Skip steps past it for
// today. Today's DSA problems sit underneath.
export default function NextProblemPicker({ solved, plannedToday, today, onAdd, onRemove, onToggleSolved }) {
  const [skipped, setSkipped] = useState(() => loadSkipped(today));

  const { picks } = useMemo(
    () =>
      rankNextProblems({
        problems: DSA_PROBLEMS,
        solved,
        solvedAt: getDsaTimestamps(),
        todayIds: plannedToday,
        skipped,
      }),
    [solved, plannedToday, skipped]
  );
  const pick = picks[0] || null;

  const skip = () => {
    if (!pick) return;
    const next = new Set(skipped).add(pick.problem.id);
    setSkipped(next);
    saveSkipped(today, next);
  };
  const resetSkips = () => {
    setSkipped(new Set());
    saveSkipped(today, []);
  };

  const todays = [...plannedToday].map((id) => BY_ID.get(id)).filter(Boolean);
  const doneToday = todays.filter((p) => solved[p.id]).length;

  return (
    <section className="mb-5 rounded-lg bg-canvas border border-line overflow-hidden" aria-label="Next problem">
      <div className="px-4 sm:px-5 pt-4 pb-3.5">
        <h2 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-subtle">Next up</h2>

        <AnimatePresence mode="wait" initial={false}>
          {pick ? (
            <motion.div
              key={pick.problem.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              <PickCard pick={pick} />
              <div className="mt-3.5 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onAdd(pick.problem)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[12.5px] font-semibold bg-primary text-on-primary hover:bg-primary-hover transition-colors"
                >
                  <Icon.plus className="w-3.5 h-3.5" />
                  Add to today
                </button>
                <button
                  onClick={skip}
                  title="Not this one — show the next best (comes back tomorrow)"
                  className={`inline-flex items-center h-8 px-3 rounded-md text-[12.5px] font-semibold border ${LIGHT_BUTTON} transition-colors`}
                >
                  Skip
                </button>
                <a
                  href={pick.problem.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-[12.5px] font-semibold text-fg-muted hover:text-fg transition-colors"
                >
                  LeetCode
                  <Icon.external className="w-3 h-3" />
                </a>
                {skipped.size > 0 && (
                  <button onClick={resetSkips} className="ml-auto text-[11px] text-fg-subtle hover:text-fg-muted">
                    {skipped.size} skipped · undo
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <p className="text-[13px] text-fg-muted py-2">
              Nothing left to pick — every open problem is solved, planned or skipped.
              {skipped.size > 0 && (
                <button onClick={resetSkips} className="ml-2 text-accent-fg font-semibold">
                  Bring back {skipped.size} skipped
                </button>
              )}
            </p>
          )}
        </AnimatePresence>
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
          <p className="text-[12px] text-fg-subtle">Nothing on today's list yet — add the pick above.</p>
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

function PickCard({ pick }) {
  const p = pick.problem;
  const prio = DSA_PRIORITY_CONFIG[p.priority];
  const diff =
    p.difficulty === "Hard"
      ? "bg-danger-subtle text-danger-fg"
      : p.difficulty === "Easy"
      ? "bg-success-subtle text-success-fg"
      : "bg-warning-subtle text-warning-fg";

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        {prio && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${prio.cls}`} title={prio.blurb}>
            {prio.label}
          </span>
        )}
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border border-line ${diff}`}>{p.difficulty}</span>
        <a
          href={p.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[16px] font-semibold text-fg hover:underline decoration-1 underline-offset-2"
        >
          {p.title}
        </a>
      </div>
      <p className="mt-1 text-[12px] text-fg-subtle">{p.topic}</p>
    </div>
  );
}
