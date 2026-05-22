import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { DSA_TOPICS, DSA_DIFFICULTY_CONFIG, DSA_TOTAL } from "../../Data/DSAPrep";
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
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-6 mb-4 px-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">DSA Prep</h1>
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
    <div className="mx-2 my-1.5 rounded-xl border border-gray-200 dark:border-slate-600 border-l-4 border-l-orange-300 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden">
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

  return (
    <div className="mb-1.5">
      <div
        className={`flex items-center gap-2 rounded-lg px-2.5 py-2 shadow-sm transition-all ${
          isSolved
            ? "bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-800"
            : "bg-slate-50 dark:bg-slate-700/60 border border-transparent"
        }`}
      >
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${DSA_DIFFICULTY_CONFIG[problem.difficulty]}`}>
          {problem.difficulty === "Hard" ? "Hard" : "Med"}
        </span>

        <span className={`text-[13px] font-semibold truncate min-w-0 flex-1 ${isSolved ? "text-gray-500 dark:text-gray-400" : "text-gray-800 dark:text-gray-200"}`}>
          {problem.title}
        </span>

        <a
          href={problem.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-blue-500 dark:text-blue-400 hover:underline text-xs shrink-0 hidden sm:inline max-w-[230px] truncate"
          title={problem.link}
        >
          {problem.link.replace(/^https?:\/\//, "")}
        </a>
        <a
          href={problem.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-blue-500 dark:text-blue-400 hover:underline text-xs shrink-0 sm:hidden"
        >
          link
        </a>

        <div className="flex items-center gap-1.5 shrink-0">
          {daysLeft != null && (
            <span
              title={`Reopens for re-attempt in ${daysLeft} day(s)`}
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300 font-semibold whitespace-nowrap"
            >
              {Math.max(daysLeft, 0)}d
            </span>
          )}

          <button
            onClick={() => setShowNotes((s) => !s)}
            title="Notes"
            className={`text-base leading-none hover:text-blue-500 hover:scale-110 transition-all ${localNote ? "text-blue-500" : "text-gray-400 opacity-60"}`}
          >
            {"✎"}
          </button>

          <button
            onClick={() => onToggleStar(problem.id)}
            title={isStarred ? "Unstar" : "Star"}
            className={`text-lg leading-none text-yellow-500 hover:scale-110 transition-transform ${isStarred ? "" : "opacity-40"}`}
          >
            {isStarred ? "★" : "☆"}
          </button>

          <input
            type="checkbox"
            className="form-checkbox h-4 w-4 accent-green-500 cursor-pointer"
            checked={isSolved}
            onChange={(e) => onToggleSolved(problem.id, e.target.checked)}
            title={isSolved ? "Mark unsolved" : "Mark solved (starts 45-day timer)"}
          />
        </div>
      </div>

      <AnimatePresence>
        {showNotes && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="mx-1 mt-1 mb-1">
              <textarea
                value={localNote}
                onChange={handleNoteInput}
                placeholder="Approach, pattern, time/space complexity, key insight, edge cases..."
                rows={4}
                className="w-full p-3 text-xs rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-400 resize-y min-h-[80px]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DSAPrep;
