import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { CATEGORY_CONFIG, PRIORITY_CONFIG } from "../../Data/JobHuntPlan";
import { InterviewCardDetail } from "../../components/cardDetails";
import { GLASS } from "../../components/glass";
import {
  INTERVIEW_CARDS,
  KEYS,
  loadJSON,
  setSourceComplete,
  setSourceNote,
  subscribe,
} from "../../Data/planStore";

const CATEGORIES = ["AI", "HLD", "LLD"];

function calcCategoryStats(completed) {
  return CATEGORIES.reduce((acc, cat) => {
    const items = INTERVIEW_CARDS.filter((i) => i.categories.includes(cat));
    const done = items.filter((i) => completed[i.id]).length;
    acc[cat] = {
      total: items.length,
      done,
      pct: items.length ? Math.round((done / items.length) * 100) : 0,
    };
    return acc;
  }, {});
}

const InterviewPrep = () => {
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), () => setAuthReady(true));
    return unsubscribe;
  }, []);

  const [completed, setCompleted] = useState(() => loadJSON(KEYS.IP_COMPLETED, {}));
  const [notes, setNotes] = useState(() => loadJSON(KEYS.IP_NOTES, {}));
  const [openCardId, setOpenCardId] = useState(null);
  const [filter, setFilter] = useState("ALL");

  // Keep in sync if the Planning page mutates the same stores.
  useEffect(
    () =>
      subscribe((key) => {
        if (key === KEYS.IP_COMPLETED) setCompleted(loadJSON(KEYS.IP_COMPLETED, {}));
        if (key === KEYS.IP_NOTES) setNotes(loadJSON(KEYS.IP_NOTES, {}));
      }),
    []
  );

  const categoryStats = useMemo(() => calcCategoryStats(completed), [completed]);

  const totalItems = INTERVIEW_CARDS.length;
  const totalDone = Object.values(completed).filter(Boolean).length;
  const totalPct = totalItems ? Math.round((totalDone / totalItems) * 100) : 0;

  const filteredItems = useMemo(() => {
    if (filter === "ALL") return INTERVIEW_CARDS;
    return INTERVIEW_CARDS.filter((i) => i.categories.includes(filter));
  }, [filter]);

  const toggleComplete = useCallback((id) => {
    setCompleted((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      setSourceComplete("interview", id, updated[id]);
      return updated;
    });
  }, []);

  const saveNote = useCallback((id, val) => {
    setNotes((prev) => {
      const updated = { ...prev, [id]: val };
      setSourceNote("interview", id, val);
      return updated;
    });
  }, []);

  const groupedByPhase = useMemo(() => {
    const groups = {};
    filteredItems.forEach((item) => {
      const key = `phase-${item.phase}`;
      if (!groups[key]) groups[key] = { phase: item.phase, items: [] };
      groups[key].items.push(item);
    });
    return Object.values(groups);
  }, [filteredItems]);

  if (!authReady) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pb-16">
      <div className="min-h-screen flex justify-center px-2">
        <div className="w-full sm:w-11/12 lg:w-3/4 xl:w-2/3">

          {/* ── Page Header ── */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-6 mb-5 px-2"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Interview Prep</h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  AI · HLD · LLD
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Overall Progress</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    {totalDone}
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/{totalItems}</span>
                  </p>
                </div>
                <div className="relative w-14 h-14">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="currentColor" className="text-gray-200 dark:text-slate-700" strokeWidth="5" />
                    <circle cx="28" cy="28" r="22" fill="none" stroke="url(#ipProgressGrad)" strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 22}`}
                      strokeDashoffset={`${2 * Math.PI * 22 * (1 - totalPct / 100)}`}
                      style={{ transition: "stroke-dashoffset 0.5s ease" }} />
                    <defs>
                      <linearGradient id="ipProgressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {totalPct}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Category Progress ── */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-3 gap-2 mb-4 px-2"
          >
            {CATEGORIES.map((cat) => {
              const stats = categoryStats[cat];
              const ringColor = {
                AI: { from: "#a855f7", to: "#7c3aed", text: "text-purple-600 dark:text-purple-400" },
                HLD: { from: "#3b82f6", to: "#0ea5e9", text: "text-blue-600 dark:text-blue-400" },
                LLD: { from: "#10b981", to: "#22c55e", text: "text-emerald-600 dark:text-emerald-400" },
              }[cat];
              const radius = 16;
              const circumference = 2 * Math.PI * radius;
              const gradId = `ipCatGrad-${cat}`;
              return (
                <div key={cat} className={`${GLASS} rounded-lg shadow-sm px-2.5 py-2 flex items-center gap-2`}>
                  <div className="relative w-11 h-11 shrink-0">
                    <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
                      <circle cx="22" cy="22" r={radius} fill="none" stroke="currentColor" className="text-gray-200 dark:text-slate-700" strokeWidth="5" />
                      <circle cx="22" cy="22" r={radius} fill="none" stroke={`url(#${gradId})`} strokeWidth="5" strokeLinecap="round"
                        strokeDasharray={`${circumference}`}
                        strokeDashoffset={`${circumference * (1 - stats.pct / 100)}`}
                        style={{ transition: "stroke-dashoffset 0.8s ease" }} />
                      <defs>
                        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor={ringColor.from} />
                          <stop offset="100%" stopColor={ringColor.to} />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className={`absolute inset-0 flex items-center justify-center text-[9px] font-bold ${ringColor.text}`}>
                      {stats.pct}%
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0 leading-tight">
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{cat}</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">{stats.done}/{stats.total}</span>
                  </div>
                </div>
              );
            })}
          </motion.div>

          {/* ── Filter Tabs ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-wrap gap-2 mb-5 px-2"
          >
            {[
              { key: "ALL", label: `All (${totalItems})` },
              { key: "AI", label: `AI (${categoryStats.AI.total})` },
              { key: "HLD", label: `HLD (${categoryStats.HLD.total})` },
              { key: "LLD", label: `LLD (${categoryStats.LLD.total})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  filter === tab.key
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-600 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </motion.div>

          {/* ── Phases / Weeks / Cards ── */}
          <AnimatePresence>
            {groupedByPhase.map((group) => (
              <div key={`phase-${group.phase}`}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 mb-3 px-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500" />
                    <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      Phase {group.phase}:{" "}
                      <span className="font-normal text-gray-500 dark:text-gray-400">
                        {group.phase === 1
                          ? "Foundations (Weeks 1–4)"
                          : group.phase === 2
                          ? "Depth (Weeks 5–8)"
                          : group.phase === 3
                          ? "Advanced Topics (Weeks 9–12)"
                          : "Interview Mode (Weeks 13–16)"}
                      </span>
                    </h2>
                  </div>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {group.items.filter((i) => completed[i.id]).length}/{group.items.length} done
                  </span>
                </motion.div>

                {(() => {
                  const byWeek = {};
                  group.items.forEach((item) => {
                    if (!byWeek[item.week]) byWeek[item.week] = [];
                    byWeek[item.week].push(item);
                  });
                  return Object.entries(byWeek).map(([week, items]) => (
                    <div key={`w${week}`} className="mb-4">
                      <div className="flex items-center gap-2 mb-2 px-2">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                          Week {week}
                        </span>
                        <div className="flex-1 h-px bg-gray-100 dark:bg-slate-700/50" />
                      </div>
                      {items.map((item, idx) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3, delay: idx * 0.04 }}
                        >
                          <PlanCard
                            item={item}
                            isOpen={openCardId === item.id}
                            isComplete={!!completed[item.id]}
                            note={notes[item.id] || ""}
                            onToggleOpen={() => setOpenCardId((prev) => (prev === item.id ? null : item.id))}
                            onToggleComplete={() => toggleComplete(item.id)}
                            onNoteChange={(val) => saveNote(item.id, val)}
                          />
                        </motion.div>
                      ))}
                    </div>
                  ));
                })()}
              </div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

function PlanCard({ item, isOpen, isComplete, note, onToggleOpen, onToggleComplete, onNoteChange }) {
  const cardRef = useRef(null);

  useEffect(() => {
    if (isOpen && cardRef.current) {
      const t = setTimeout(() => {
        const el = cardRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        window.scrollTo({ top: window.scrollY + rect.top - 80, behavior: "smooth" });
      }, 280);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const leftBorder = {
    AI: "border-l-purple-400",
    HLD: "border-l-blue-400",
    LLD: "border-l-emerald-400",
  }[item.primaryCategory] || "border-l-indigo-400";

  return (
    <div
      ref={cardRef}
      className={`mx-2 my-1.5 rounded-xl ${GLASS} border-l-4 ${leftBorder} shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${isComplete ? "opacity-75" : ""}`}
    >
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none" onClick={onToggleOpen}>
        <div className="flex items-center gap-1 shrink-0">
          {item.priority && (
            <span title={`Priority ${item.priority} (P0 = highest)`} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${PRIORITY_CONFIG[item.priority]}`}>
              {item.priority}
            </span>
          )}
          {item.categories.map((cat) => (
            <span key={cat} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${CATEGORY_CONFIG[cat].badge}`}>
              {cat}
            </span>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-semibold truncate ${isComplete ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-800 dark:text-gray-200"}`}>
            {item.title}
          </h3>
          {!isOpen && item.keyTopics.length > 0 && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate mt-0.5">{item.keyTopics[0]}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {note && <span title="Has notes" className="text-blue-400 dark:text-blue-500 text-xs">✎</span>}
          <button
            onClick={onToggleComplete}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isComplete ? "bg-green-500 border-green-500" : "border-gray-300 dark:border-slate-500 hover:border-green-400"}`}
            title={isComplete ? "Mark incomplete" : "Mark complete"}
          >
            {isComplete && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
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

              <InterviewCardDetail item={item} note={note} onNoteChange={onNoteChange} />

              <div className="mt-4 flex justify-end">
                <button
                  onClick={onToggleComplete}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${isComplete ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-300 dark:border-green-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-800" : "bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-600 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 hover:border-green-300 dark:hover:border-green-800"}`}
                >
                  {isComplete ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14"><path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      Completed · Click to undo
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" /><path d="M4.5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      Mark as Done
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default InterviewPrep;
