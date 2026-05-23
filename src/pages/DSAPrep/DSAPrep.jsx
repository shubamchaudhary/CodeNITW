import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { DSA_TOPICS, DSA_TOTAL } from "../../Data/DSAPrep";
import { GLASS } from "../../components/glass";
import {
  KEYS,
  loadJSON,
  setSourceComplete,
  setSourceNote,
  setDsaStarred,
  pruneExpiredDsaSolves,
  dsaDaysLeft,
  DSA_REVISIT_DAYS,
  subscribe,
} from "../../Data/planStore";

const DSAPrep = () => {
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), () => setAuthReady(true));
    return unsubscribe;
  }, []);

  // Expire any solves older than the revisit window before reading state.
  useEffect(() => { pruneExpiredDsaSolves(); }, []);

  const [solved, setSolved] = useState(() => loadJSON(KEYS.DSA_COMPLETED, {}));
  const [notes, setNotes] = useState(() => loadJSON(KEYS.DSA_NOTES, {}));
  const [starred, setStarred] = useState(() => loadJSON(KEYS.DSA_STARRED, {}));
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [filter, setFilter] = useState("ALL");

  useEffect(
    () =>
      subscribe((key) => {
        if (key === KEYS.DSA_COMPLETED) setSolved(loadJSON(KEYS.DSA_COMPLETED, {}));
        if (key === KEYS.DSA_NOTES) setNotes(loadJSON(KEYS.DSA_NOTES, {}));
        if (key === KEYS.DSA_STARRED) setStarred(loadJSON(KEYS.DSA_STARRED, {}));
      }),
    []
  );

  const totalSolved = useMemo(
    () => DSA_TOPICS.reduce((a, t) => a + t.problems.filter((p) => solved[p.id]).length, 0),
    [solved]
  );
  const totalPct = DSA_TOTAL ? Math.round((totalSolved / DSA_TOTAL) * 100) : 0;
  const starredCount = useMemo(() => Object.values(starred).filter(Boolean).length, [starred]);

  const visibleTopics = useMemo(() => {
    if (filter === "ALL") return DSA_TOPICS;
    return DSA_TOPICS.map((t) => ({
      ...t,
      problems: t.problems.filter((p) =>
        filter === "Starred" ? starred[p.id] : p.difficulty === filter
      ),
    })).filter((t) => t.problems.length);
  }, [filter, starred]);

  const toggleSolved = useCallback((id, checked) => {
    setSourceComplete("dsa", id, checked);
    setSolved((m) => ({ ...m, [id]: checked }));
  }, []);

  const toggleStar = useCallback(
    (id) => {
      const next = !starred[id];
      setDsaStarred(id, next);
      setStarred((m) => ({ ...m, [id]: next }));
    },
    [starred]
  );

  const saveNote = useCallback((id, val) => {
    setSourceNote("dsa", id, val);
    setNotes((m) => ({ ...m, [id]: val }));
  }, []);

  if (!authReady) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pb-16">
      <div className="min-h-screen flex justify-center px-2">
        <div className="w-full sm:w-11/12 lg:w-3/4 xl:w-2/3">

          {/* ── Header ── */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-6 mb-4 px-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">DSA</h1>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                    {DSA_TOTAL} most-asked
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  Medium &amp; Hard · {DSA_REVISIT_DAYS}-day spaced repetition (solved problems reopen after {DSA_REVISIT_DAYS} days)
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Solved</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    {totalSolved}<span className="text-sm font-normal text-gray-500 dark:text-gray-400">/{DSA_TOTAL}</span>
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

          {/* ── Filter ── */}
          <div className="flex flex-wrap items-center gap-2 mb-4 px-2">
            {[
              { key: "ALL", label: `All (${DSA_TOTAL})` },
              { key: "Medium", label: "Medium" },
              { key: "Hard", label: "Hard" },
              { key: "Starred", label: `★ Starred (${starredCount})` },
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
          </div>

          {/* ── Topic cards ── */}
          {visibleTopics.length === 0 ? (
            <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-12">No problems match this filter.</p>
          ) : (
            visibleTopics.map((topic) => (
              <TopicCard
                key={topic.topic}
                topic={topic}
                isOpen={selectedTopic === topic.topic}
                onToggle={() => setSelectedTopic((p) => (p === topic.topic ? null : topic.topic))}
                solved={solved}
                starred={starred}
                notes={notes}
                onToggleSolved={toggleSolved}
                onToggleStar={toggleStar}
                onNoteChange={saveNote}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

function TopicCard({ topic, isOpen, onToggle, solved, starred, notes, onToggleSolved, onToggleStar, onNoteChange }) {
  const done = topic.problems.filter((p) => solved[p.id]).length;
  const pct = topic.problems.length ? (100 * done) / topic.problems.length : 0;

  return (
    <div className={`mx-2 my-1.5 rounded-xl ${GLASS} border-l-4 border-l-orange-300 shadow-sm hover:shadow-md transition-all overflow-hidden`}>
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none" onClick={onToggle}>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate">{topic.topic}</h2>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[11px] text-gray-500 dark:text-gray-400">{done}/{topic.problems.length}</span>
          <div className="w-20 h-2 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500" style={{ width: `${pct}%`, transition: "width 0.4s ease" }} />
          </div>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-gray-400 dark:text-gray-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="border-t border-gray-100 dark:border-slate-700 px-2 sm:px-3 py-3" onClick={(e) => e.stopPropagation()}>
              {topic.problems.map((p) => (
                <QuestionRow
                  key={p.id}
                  problem={p}
                  isSolved={!!solved[p.id]}
                  isStarred={!!starred[p.id]}
                  note={notes[p.id] || ""}
                  onToggleSolved={onToggleSolved}
                  onToggleStar={onToggleStar}
                  onNoteChange={onNoteChange}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuestionRow({ problem, isSolved, isStarred, note, onToggleSolved, onToggleStar, onNoteChange }) {
  const [showNotes, setShowNotes] = useState(false);
  const [localNote, setLocalNote] = useState(note);
  const debounceRef = useRef(null);

  useEffect(() => { setLocalNote(note); }, [note]);
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const handleNoteInput = useCallback(
    (e) => {
      const val = e.target.value;
      setLocalNote(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onNoteChange(problem.id, val), 500);
    },
    [problem.id, onNoteChange]
  );

  const daysLeft = isSolved ? dsaDaysLeft(problem.id) : null;

  const diff =
    problem.difficulty === "Hard"
      ? { label: "Hard", badge: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300" }
      : { label: "Med", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" };

  return (
    <div className="mb-2">
      <div
        onClick={() => setShowNotes((s) => !s)}
        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer border backdrop-blur-md transition-all ${
          isSolved
            ? "bg-green-50/60 dark:bg-green-900/20 border-green-300/70 dark:border-green-800/50"
            : "bg-white/50 dark:bg-slate-800/40 border-gray-200/70 dark:border-white/10 hover:border-orange-300 dark:hover:border-orange-700/70 hover:shadow-sm"
        }`}
      >
        {/* Difficulty */}
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${diff.badge}`}>
          {diff.label}
        </span>

        {/* Title */}
        <span className={`text-sm font-semibold truncate flex-1 min-w-0 ${isSolved ? "text-gray-400 dark:text-gray-500 line-through decoration-1" : "text-gray-800 dark:text-gray-100"}`}>
          {problem.title}
        </span>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {localNote && <span title="Has notes" className="text-blue-400 dark:text-blue-500 text-xs hidden sm:inline">✎</span>}

          {daysLeft != null && (
            <span
              title={`Reopens for re-attempt in ${Math.max(daysLeft, 0)} day(s)`}
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-200 font-semibold whitespace-nowrap"
            >
              {Math.max(daysLeft, 0)}d
            </span>
          )}

          <a
            href={problem.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-orange-100 hover:text-orange-600 dark:hover:bg-orange-900/30 dark:hover:text-orange-300 transition-colors"
            title="Open on LeetCode"
          >
            LeetCode
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 12 12"><path d="M3.5 8.5l5-5M4.5 3.5h4v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </a>

          <button
            onClick={(e) => { e.stopPropagation(); onToggleStar(problem.id); }}
            title={isStarred ? "Unstar" : "Star"}
            className={`text-lg leading-none transition-transform hover:scale-110 ${isStarred ? "text-yellow-400" : "text-gray-300 dark:text-slate-500 hover:text-yellow-400"}`}
          >
            {isStarred ? "★" : "☆"}
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onToggleSolved(problem.id, !isSolved); }}
            title={isSolved ? "Mark unsolved" : "Mark solved (starts 45-day timer)"}
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${isSolved ? "bg-green-500 border-green-500" : "border-gray-300 dark:border-slate-500 hover:border-green-400"}`}
          >
            {isSolved && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            )}
          </button>

          <motion.div animate={{ rotate: showNotes ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-gray-400 dark:text-gray-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showNotes && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="mx-1 mt-1.5 mb-1 rounded-xl border border-orange-100 dark:border-orange-900/40 bg-gradient-to-br from-orange-50/60 via-white to-amber-50/40 dark:from-slate-800/60 dark:via-slate-800/40 dark:to-slate-800/60 p-3 shadow-inner">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1 h-3.5 rounded-full bg-gradient-to-b from-orange-400 to-amber-400" />
                  Solution Notes
                </h5>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">auto-saved</span>
              </div>
              <textarea
                value={localNote}
                onChange={handleNoteInput}
                placeholder="Approach, pattern, time/space complexity, key insight, edge cases..."
                rows={4}
                className="w-full p-3 text-xs rounded-lg border border-orange-200 dark:border-slate-600 bg-white dark:bg-slate-900/60 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 resize-y min-h-[90px] leading-relaxed"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DSAPrep;
