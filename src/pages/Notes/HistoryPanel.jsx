import React, { useCallback, useEffect, useMemo, useState } from "react";
import { hashContent, listRevisions } from "../../Data/noteHistory";

// Every saved version of a note, newest first — like a file's history on
// GitHub. Picking one previews it in the page; restoring it (from the page)
// adds it back on top, so the history itself never changes.

const dayKey = (t) => new Date(t).toLocaleDateString("en-CA");
function dayTitle(t) {
  const today = dayKey(Date.now());
  if (dayKey(t) === today) return "Today";
  if (dayKey(t) === dayKey(Date.now() - 864e5)) return "Yesterday";
  return new Date(t).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}
const timeOf = (t) => new Date(t).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

export function describeVersion(rev) {
  return `${dayTitle(rev.at)}, ${timeOf(rev.at)} · ${rev.device?.label || "unknown device"}`;
}

const REASONS = {
  "not-kept": { label: "Older edit, not used", cls: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300" },
  conflict: { label: "Conflicting edit, not used", cls: "bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-300" },
  merge: { label: "Merged", cls: "bg-violet-100 text-violet-800 dark:bg-violet-400/15 dark:text-violet-300" },
  restore: { label: "Restored", cls: "bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-300" },
  before: { label: "Before an edit", cls: "bg-gray-100 text-gray-600 dark:bg-white/[0.07] dark:text-gray-400" },
};

export default function HistoryPanel({ notesKey, noteId, current, previewId, onPreview, onClose }) {
  const [state, setState] = useState({ status: "loading", items: [] });

  const load = useCallback(() => {
    setState({ status: "loading", items: [] });
    listRevisions(notesKey, noteId, 200)
      .then((items) => setState({ status: "ready", items }))
      .catch((err) => setState({ status: "error", code: err?.code || "", items: [] }));
  }, [notesKey, noteId]);
  useEffect(load, [load]);

  const currentHash = useMemo(() => hashContent(current), [current]);

  // The same content recorded twice in a row (say, by two devices) is one
  // version; the list shows it once.
  const rows = useMemo(() => {
    const out = [];
    for (const r of state.items) {
      if (out.length && out[out.length - 1].hash === r.hash && r.reason !== "not-kept" && r.reason !== "conflict") continue;
      out.push(r);
    }
    return out.map((r, i) => {
      const older = out.slice(i + 1).find((x) => x.reason !== "not-kept" && x.reason !== "conflict");
      return { ...r, delta: older ? (r.words || 0) - (older.words || 0) : null };
    });
  }, [state.items]);

  // Only the newest version matching what's on the page is "Current" — an
  // older identical one (say, the original a restore brought back) isn't.
  const currentId = useMemo(() => rows.find((r) => r.hash === currentHash)?.id, [rows, currentHash]);

  const groups = useMemo(() => {
    const g = [];
    for (const r of rows) {
      const key = dayKey(r.at);
      if (g[g.length - 1]?.key !== key) g.push({ key, title: dayTitle(r.at), rows: [] });
      g[g.length - 1].rows.push(r);
    }
    return g;
  }, [rows]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/30 dark:bg-black/40" onClick={onClose} />
      <aside className="relative w-full sm:w-[400px] h-full bg-white dark:bg-[#0e1427] border-l border-gray-200/90 dark:border-white/[0.08] shadow-2xl flex flex-col">
        <div className="px-5 pt-5 pb-4 border-b border-gray-200/90 dark:border-white/[0.07]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[17px] font-bold tracking-tight text-gray-900 dark:text-gray-50">Version history</h2>
              <p className="mt-1 text-[12.5px] leading-relaxed text-gray-500 dark:text-gray-400">
                Every change is kept. Restoring a version adds it back on top — nothing after it is lost.
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close history"
              className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.07]"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {state.status === "loading" && <p className="px-2 py-6 text-[13px] text-gray-500 dark:text-gray-400">Loading versions…</p>}

          {state.status === "error" && (
            <div className="px-2 py-6 text-[13px] text-gray-600 dark:text-gray-300">
              {state.code === "permission-denied"
                ? "Version history isn't switched on for this account yet."
                : "Couldn't load the history."}{" "}
              <button onClick={load} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                Try again
              </button>
            </div>
          )}

          {state.status === "ready" && !rows.length && (
            <p className="px-2 py-6 text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
              No versions yet. From your next change on, every version of this note is kept here.
            </p>
          )}

          {groups.map((g) => (
            <section key={g.key} className="mb-3">
              <h3 className="px-2 pt-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{g.title}</h3>
              {g.rows.map((r) => {
                const isCurrent = r.id === currentId;
                const selected = r.id === previewId;
                const reason = REASONS[r.reason];
                return (
                  <button
                    key={r.id}
                    onClick={() => onPreview(isCurrent ? null : r)}
                    className={`w-full text-left rounded-xl px-3 py-2.5 mb-1 transition-colors ${
                      selected ? "bg-indigo-50 dark:bg-indigo-400/10 ring-1 ring-indigo-300/60 dark:ring-indigo-400/30" : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100">{timeOf(r.at)}</span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10.5px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300">
                          Current
                        </span>
                      )}
                      {reason && <span className={`px-1.5 py-0.5 rounded-md text-[10.5px] font-bold ${reason.cls}`}>{reason.label}</span>}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-gray-500 dark:text-gray-400">
                      <span className="inline-flex items-center gap-1">
                        {r.device?.mobile ? <PhoneIcon /> : <LaptopIcon />}
                        {r.device?.label || "Unknown device"}
                      </span>
                      <span>· {(r.words || 0).toLocaleString()} words</span>
                      {r.delta != null && r.delta !== 0 && (
                        <span className={r.delta > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                          {r.delta > 0 ? "+" : "−"}
                          {Math.abs(r.delta).toLocaleString()}
                        </span>
                      )}
                      {Array.isArray(r.annotations) && r.annotations.length > 0 && (
                        <span>
                          · {r.annotations.length} personal note{r.annotations.length === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </section>
          ))}
        </div>
      </aside>
    </div>
  );
}

function LaptopIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="3" y="3.5" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.5 12.5h13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="4.5" y="1.5" width="7" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M7 12.5h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
