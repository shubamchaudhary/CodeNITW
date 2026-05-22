import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { DSA_TOPICS, DSA_DIFFICULTY_CONFIG, DSA_TOTAL } from "../../Data/DSAPrep";
import {
  KEYS,
  loadJSON,
  setSourceComplete,
  setSourceNote,
  subscribe,
} from "../../Data/planStore";

const ALLOWED_EMAIL = "beshubam@gmail.com";

const DSAPrep = () => {
  const [authReady, setAuthReady] = useState(false);
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
      setUserEmail(user ? user.email : null);
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  const [completed, setCompleted] = useState(() => loadJSON(KEYS.DSA_COMPLETED, {}));
  const [notes, setNotes] = useState(() => loadJSON(KEYS.DSA_NOTES, {}));
  const [openId, setOpenId] = useState(null);
  const [filter, setFilter] = useState("ALL");

  useEffect(
    () =>
      subscribe((key) => {
        if (key === KEYS.DSA_COMPLETED) setCompleted(loadJSON(KEYS.DSA_COMPLETED, {}));
        if (key === KEYS.DSA_NOTES) setNotes(loadJSON(KEYS.DSA_NOTES, {}));
      }),
    []
  );

  const counts = useMemo(() => {
    let medium = 0, hard = 0, medDone = 0, hardDone = 0;
    DSA_TOPICS.forEach((t) =>
      t.problems.forEach((p) => {
        if (p.difficulty === "Hard") { hard++; if (completed[p.id]) hardDone++; }
        else { medium++; if (completed[p.id]) medDone++; }
      })
    );
    return { medium, hard, medDone, hardDone };
  }, [completed]);

  const totalDone = counts.medDone + counts.hardDone;
  const totalPct = DSA_TOTAL ? Math.round((totalDone / DSA_TOTAL) * 100) : 0;

  const visibleTopics = useMemo(() => {
    if (filter === "ALL") return DSA_TOPICS;
    return DSA_TOPICS.map((t) => ({
      ...t,
      problems: t.problems.filter((p) => p.difficulty === filter),
    })).filter((t) => t.problems.length);
  }, [filter]);

  const toggleComplete = useCallback((id) => {
    setCompleted((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      setSourceComplete("dsa", id, updated[id]);
      return updated;
    });
  }, []);

  const saveNote = useCallback((id, val) => {
    setNotes((prev) => {
      const updated = { ...prev, [id]: val };
      setSourceNote("dsa", id, val);
      return updated;
    });
  }, []);

  if (!authReady) return null;

  if (userEmail !== ALLOWED_EMAIL) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center px-6 py-12 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-5V9m0 0V7m0 2h2m-2 0H10M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Access Restricted</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">This page is private. Please sign in with the authorised account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pb-16">
      <div className="min-h-screen flex justify-center px-2">
        <div className="w-full sm:w-11/12 lg:w-3/4 xl:w-2/3">

          {/* ── Header ── */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-6 mb-5 px-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">DSA Prep</h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                  {DSA_TOTAL} most-asked
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Solved</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    {totalDone}<span className="text-sm font-normal text-gray-500 dark:text-gray-400">/{DSA_TOTAL}</span>
                  </p>
                </div>
                <div className="relative w-14 h-14">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="currentColor" className="text-gray-200 dark:text-slate-700" strokeWidth="5" />
                    <circle cx="28" cy="28" r="22" fill="none" stroke="url(#dsaProgressGrad)" strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 22}`}
                      strokeDashoffset={`${2 * Math.PI * 22 * (1 - totalPct / 100)}`}
                      style={{ transition: "stroke-dashoffset 0.5s ease" }} />
                    <defs>
                      <linearGradient id="dsaProgressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-orange-600 dark:text-orange-400">{totalPct}%</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Difficulty summary + filter ── */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.15 }} className="flex flex-wrap items-center gap-2 mb-5 px-2">
            {[
              { key: "ALL", label: `All (${DSA_TOTAL})` },
              { key: "Medium", label: `Medium (${counts.medDone}/${counts.medium})` },
              { key: "Hard", label: `Hard (${counts.hardDone}/${counts.hard})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  filter === tab.key
                    ? "bg-orange-600 text-white border-orange-600 shadow-sm"
                    : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-600 hover:border-orange-400 hover:text-orange-600 dark:hover:text-orange-400"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </motion.div>

          {/* ── Topics ── */}
          {visibleTopics.map((topic) => {
            const done = topic.problems.filter((p) => completed[p.id]).length;
            return (
              <div key={topic.topic} className="mb-5">
                <div className="flex items-center gap-3 mb-2 px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-orange-500 to-amber-500" />
                    <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300">{topic.topic}</h2>
                  </div>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
                  <span className="text-xs text-gray-400 dark:text-gray-500">{done}/{topic.problems.length}</span>
                </div>
                {topic.problems.map((p, idx) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: idx * 0.02 }}>
                    <ProblemCard
                      problem={p}
                      isOpen={openId === p.id}
                      isComplete={!!completed[p.id]}
                      note={notes[p.id] || ""}
                      onToggleOpen={() => setOpenId((prev) => (prev === p.id ? null : p.id))}
                      onToggleComplete={() => toggleComplete(p.id)}
                      onNoteChange={(val) => saveNote(p.id, val)}
                    />
                  </motion.div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function ProblemCard({ problem, isOpen, isComplete, note, onToggleOpen, onToggleComplete, onNoteChange }) {
  const debounceRef = useRef(null);
  const [localNote, setLocalNote] = useState(note);

  useEffect(() => { setLocalNote(note); }, [note]);
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const handleNoteInput = useCallback(
    (e) => {
      const val = e.target.value;
      setLocalNote(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onNoteChange(val), 400);
    },
    [onNoteChange]
  );

  return (
    <div className={`mx-2 my-1.5 rounded-xl border border-gray-200 dark:border-slate-600 border-l-4 ${isComplete ? "border-l-green-400" : "border-l-orange-300"} bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden ${isComplete ? "opacity-80" : ""}`}>
      <div className="flex items-center gap-3 px-4 py-2.5 cursor-pointer select-none" onClick={onToggleOpen}>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleComplete(); }}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${isComplete ? "bg-green-500 border-green-500" : "border-gray-300 dark:border-slate-500 hover:border-green-400"}`}
          title={isComplete ? "Mark unsolved" : "Mark solved"}
        >
          {isComplete && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${DSA_DIFFICULTY_CONFIG[problem.difficulty]}`}>
          {problem.difficulty}
        </span>

        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-semibold truncate ${isComplete ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-800 dark:text-gray-200"}`}>
            {problem.title}
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {localNote && <span title="Has notes" className="text-orange-400 dark:text-orange-500 text-xs">✎</span>}
          <a
            href={problem.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-semibold px-2 py-1 rounded-md border border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-900/10 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-colors"
            title="Open on LeetCode"
          >
            Solve ↗
          </a>
        </div>

        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-gray-400 dark:text-gray-500 shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="border-t border-gray-100 dark:border-slate-700 px-4 pb-4 pt-3" onClick={(e) => e.stopPropagation()}>
              <div className="rounded-xl border border-orange-100 dark:border-orange-900/40 bg-gradient-to-br from-orange-50/60 via-white to-amber-50/40 dark:from-slate-800/60 dark:via-slate-800/40 dark:to-slate-800/60 p-4 shadow-inner">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1 h-4 rounded-full bg-gradient-to-b from-orange-400 to-amber-400" />
                    Solution Notes
                  </h4>
                  <span className="text-[10px] font-normal text-gray-400 dark:text-gray-500">auto-saved</span>
                </div>
                <textarea
                  value={localNote}
                  onChange={handleNoteInput}
                  placeholder="Approach, pattern, time/space complexity, key insight, edge cases..."
                  rows={6}
                  className="w-full p-4 text-sm rounded-lg border border-orange-200 dark:border-slate-600 bg-white dark:bg-slate-900/60 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 dark:focus:border-orange-500 resize-y min-h-[140px] transition-all leading-relaxed shadow-sm"
                />
                <div className="flex items-center justify-between mt-2 min-h-[16px]">
                  {localNote ? (
                    <p className="text-[11px] text-green-600 dark:text-green-400 flex items-center gap-1.5">
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" /></svg>
                      Saved
                    </p>
                  ) : <span />}
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">{localNote.length} chars</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DSAPrep;
