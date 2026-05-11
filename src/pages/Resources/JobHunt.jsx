import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { jobHuntPlan, CATEGORY_CONFIG } from "../../Data/JobHuntPlan";
import mostAskedData from "../../Data/MostAskedQuestions.json";

const ALLOWED_EMAIL = "beshubam@gmail.com";

// ─── Daily DSA round-robin ────────────────────────────────────────────────────
// Walk across sections one problem at a time (Arrays[0], SlidingWindow[0], ...,
// Design[0], Arrays[1], SlidingWindow[1], ...). Skips sections that have run out
// of problems. Covers all 100 problems across the first 100 cards in plan order.
const DAILY_DSA_SEQUENCE = (() => {
  const sections = Object.entries(mostAskedData);
  const seq = [];
  let round = 0;
  let added = true;
  while (added) {
    added = false;
    for (const [section, problems] of sections) {
      if (round < problems.length) {
        seq.push({ ...problems[round], section });
        added = true;
      }
    }
    round++;
  }
  return seq;
})();

const CARD_DAILY_DSA = (() => {
  const map = {};
  jobHuntPlan.forEach((card, idx) => {
    if (idx < DAILY_DSA_SEQUENCE.length) {
      map[card.id] = { ...DAILY_DSA_SEQUENCE[idx], day: idx + 1 };
    }
  });
  return map;
})();

const STORAGE_KEY_COMPLETED = "JobHuntCompleted";
const STORAGE_KEY_NOTES = "JobHuntNotes";

// ─── Utility ──────────────────────────────────────────────────────────────────

function calcCategoryStats(completed) {
  return ["AI", "HLD", "LLD", "DSA"].reduce((acc, cat) => {
    const items = jobHuntPlan.filter((i) => i.categories.includes(cat));
    const done = items.filter((i) => completed[i.id]).length;
    acc[cat] = { total: items.length, done, pct: items.length ? Math.round((done / items.length) * 100) : 0 };
    return acc;
  }, {});
}

// ─── Main Component ────────────────────────────────────────────────────────────

const JobHunt = () => {
  const [authReady, setAuthReady] = useState(false);
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
      setUserEmail(user ? user.email : null);
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  const [completed, setCompleted] = useState(
    () => JSON.parse(localStorage.getItem(STORAGE_KEY_COMPLETED)) || {}
  );
  const [notes, setNotes] = useState(
    () => JSON.parse(localStorage.getItem(STORAGE_KEY_NOTES)) || {}
  );
  const [openCardId, setOpenCardId] = useState(null);
  const [filter, setFilter] = useState("ALL");

  const categoryStats = useMemo(() => calcCategoryStats(completed), [completed]);

  const totalItems = jobHuntPlan.length;
  const totalDone = Object.values(completed).filter(Boolean).length;
  const totalPct = Math.round((totalDone / totalItems) * 100);

  const filteredItems = useMemo(() => {
    if (filter === "ALL") return jobHuntPlan;
    return jobHuntPlan.filter((i) => i.categories.includes(filter));
  }, [filter]);

  const toggleComplete = useCallback((id) => {
    setCompleted((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      localStorage.setItem(STORAGE_KEY_COMPLETED, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const saveNote = useCallback((id, val) => {
    setNotes((prev) => {
      const updated = { ...prev, [id]: val };
      localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Group items by phase for section headers
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pb-16">
      <div className="min-h-screen flex justify-center px-2">
        <div className="w-full sm:w-11/12 lg:w-3/4 xl:w-2/3">

          {/* ── Page Header ─────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-6 mb-5 px-2"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    Job Hunt
                  </h1>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    16 Weeks
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Overall Progress</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    {totalDone}
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                      /{totalItems}
                    </span>
                  </p>
                </div>
                <div className="relative w-14 h-14">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="currentColor"
                      className="text-gray-200 dark:text-slate-700" strokeWidth="5" />
                    <circle cx="28" cy="28" r="22" fill="none"
                      stroke="url(#progressGrad)" strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 22}`}
                      strokeDashoffset={`${2 * Math.PI * 22 * (1 - totalPct / 100)}`}
                      style={{ transition: "stroke-dashoffset 0.5s ease" }}
                    />
                    <defs>
                      <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
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

          {/* ── Category Progress Bars ───────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5 px-2"
          >
            {["AI", "HLD", "LLD", "DSA"].map((cat) => {
              const stats = categoryStats[cat];
              const ringColor = {
                AI: { from: "#a855f7", to: "#7c3aed", text: "text-purple-600 dark:text-purple-400" },
                HLD: { from: "#3b82f6", to: "#0ea5e9", text: "text-blue-600 dark:text-blue-400" },
                LLD: { from: "#10b981", to: "#22c55e", text: "text-emerald-600 dark:text-emerald-400" },
                DSA: { from: "#f97316", to: "#f59e0b", text: "text-orange-600 dark:text-orange-400" },
              }[cat];
              const radius = 26;
              const circumference = 2 * Math.PI * radius;
              const gradId = `catGrad-${cat}`;
              return (
                <div
                  key={cat}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-600 shadow-sm px-4 py-3 flex items-center gap-3"
                >
                  <div className="relative w-16 h-16 shrink-0">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r={radius} fill="none" stroke="currentColor"
                        className="text-gray-200 dark:text-slate-700" strokeWidth="6" />
                      <circle cx="32" cy="32" r={radius} fill="none"
                        stroke={`url(#${gradId})`} strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${circumference}`}
                        strokeDashoffset={`${circumference * (1 - stats.pct / 100)}`}
                        style={{ transition: "stroke-dashoffset 0.8s ease" }}
                      />
                      <defs>
                        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor={ringColor.from} />
                          <stop offset="100%" stopColor={ringColor.to} />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${ringColor.text}`}>
                      {stats.pct}%
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      {cat}
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      {stats.done}/{stats.total} sessions
                    </span>
                  </div>
                </div>
              );
            })}
          </motion.div>

          {/* ── Filter Tabs ──────────────────────────────────────────────── */}
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
              { key: "DSA", label: `DSA (${categoryStats.DSA.total})` },
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

          {/* ── Phase Sections + Cards ───────────────────────────────────── */}
          <AnimatePresence>
            {groupedByPhase.map((group) => (
              <div key={`phase-${group.phase}`}>
                {/* Phase Header */}
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

                {/* Week group labels + cards */}
                {(() => {
                  // group by week within this phase
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
                            onToggleOpen={() =>
                              setOpenCardId((prev) => (prev === item.id ? null : item.id))
                            }
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

// ─── PlanCard ─────────────────────────────────────────────────────────────────

function PlanCard({ item, isOpen, isComplete, note, onToggleOpen, onToggleComplete, onNoteChange }) {
  const [copied, setCopied] = useState(false);
  const debounceRef = useRef(null);
  const cardRef = useRef(null);
  const [localNote, setLocalNote] = useState(note);

  useEffect(() => { setLocalNote(note); }, [note]);
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  useEffect(() => {
    if (isOpen && cardRef.current) {
      const t = setTimeout(() => {
        const el = cardRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const offset = window.scrollY + rect.top - 80;
        window.scrollTo({ top: offset, behavior: "smooth" });
      }, 280);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const handleNoteInput = useCallback(
    (e) => {
      const val = e.target.value;
      setLocalNote(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onNoteChange(val), 400);
    },
    [onNoteChange]
  );

  const copyPrompt = () => {
    navigator.clipboard.writeText(item.prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const primaryCfg = CATEGORY_CONFIG[item.primaryCategory];
  const cardBg = {
    AI: "bg-white dark:bg-slate-800 hover:shadow-purple-100 dark:hover:shadow-purple-900/20",
    HLD: "bg-white dark:bg-slate-800 hover:shadow-blue-100 dark:hover:shadow-blue-900/20",
    LLD: "bg-white dark:bg-slate-800 hover:shadow-emerald-100 dark:hover:shadow-emerald-900/20",
    DSA: "bg-white dark:bg-slate-800 hover:shadow-orange-100 dark:hover:shadow-orange-900/20",
  }[item.primaryCategory];

  const leftBorder = {
    AI: "border-l-purple-400",
    HLD: "border-l-blue-400",
    LLD: "border-l-emerald-400",
    DSA: "border-l-orange-400",
  }[item.primaryCategory];

  return (
    <div
      ref={cardRef}
      className={`mx-2 my-1.5 rounded-xl border border-gray-200 dark:border-slate-600 border-l-4 ${leftBorder} shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${cardBg} ${
        isComplete ? "opacity-75" : ""
      }`}
    >
      {/* ── Card Header ── */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={onToggleOpen}
      >
        {/* Category badges */}
        <div className="flex items-center gap-1 shrink-0">
          {item.categories.map((cat) => (
            <span
              key={cat}
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${CATEGORY_CONFIG[cat].badge}`}
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h3
            className={`text-sm font-semibold truncate ${
              isComplete
                ? "line-through text-gray-400 dark:text-gray-500"
                : "text-gray-800 dark:text-gray-200"
            }`}
          >
            {item.title}
          </h3>
          {!isOpen && item.keyTopics.length > 0 && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
              {item.keyTopics[0]}
            </p>
          )}
        </div>

        {/* Right side: note indicator + complete button + chevron */}
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {localNote && (
            <span title="Has notes" className="text-blue-400 dark:text-blue-500 text-xs">✎</span>
          )}
          <button
            onClick={onToggleComplete}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              isComplete
                ? "bg-green-500 border-green-500"
                : "border-gray-300 dark:border-slate-500 hover:border-green-400"
            }`}
            title={isComplete ? "Mark incomplete" : "Mark complete"}
          >
            {isComplete && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-gray-400 dark:text-gray-500 shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </div>

      {/* ── Expanded Content ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div
              className="border-t border-gray-100 dark:border-slate-700 px-4 pb-4 pt-3"
              onClick={(e) => e.stopPropagation()}
            >

              {/* Key Topics */}
              <div className="mb-4">
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className={`w-1 h-3 rounded-full ${primaryCfg.bar}`} />
                  What to Study
                </h4>
                <ul className="space-y-1">
                  {item.keyTopics.map((topic, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-slate-600 shrink-0" />
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Daily DSA Problem (round-robin across Most Asked sections) */}
              {CARD_DAILY_DSA[item.id] && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="w-1 h-3 rounded-full bg-gradient-to-b from-orange-500 to-amber-500" />
                    Daily DSA Problem
                    <span className="text-[10px] font-normal normal-case text-gray-400">
                      (Day {CARD_DAILY_DSA[item.id].day} · 45 min · move on after 25 min if stuck)
                    </span>
                  </h4>
                  <a
                    href={CARD_DAILY_DSA[item.id].Question_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-900/10 hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-colors group"
                  >
                    <span className="text-[10px] font-bold text-orange-500 dark:text-orange-400">
                      #{CARD_DAILY_DSA[item.id].Q_No}
                    </span>
                    <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-orange-600 dark:group-hover:text-orange-300 transition-colors">
                      {CARD_DAILY_DSA[item.id].Question}
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                      {CARD_DAILY_DSA[item.id].section}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 hidden sm:inline">
                      · {CARD_DAILY_DSA[item.id].Priority}
                    </span>
                  </a>
                </div>
              )}

              {/* Full Prompt */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className={`w-1 h-3 rounded-full ${primaryCfg.bar}`} />
                    Prompt for Claude
                  </h4>
                  <button
                    onClick={copyPrompt}
                    className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md border transition-all ${
                      copied
                        ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                        : "bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-700 dark:text-gray-400 dark:border-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300"
                    }`}
                  >
                    {copied ? (
                      <>✓ Copied!</>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 16 16">
                          <rect x="4" y="4" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M3 11V3.5A1.5 1.5 0 0 1 4.5 2H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        Copy Prompt
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <pre className="text-[11.5px] text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
                    {item.prompt}
                  </pre>
                </div>
              </div>

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Notes Section */}
              <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/60 via-white to-cyan-50/40 dark:from-slate-800/60 dark:via-slate-800/40 dark:to-slate-800/60 p-4 shadow-inner">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1 h-4 rounded-full bg-gradient-to-b from-blue-400 to-cyan-400" />
                    My Notes
                  </h4>
                  <span className="text-[10px] font-normal text-gray-400 dark:text-gray-500">
                    auto-saved · revisit at interview time
                  </span>
                </div>
                <textarea
                  value={localNote}
                  onChange={handleNoteInput}
                  placeholder="Write your notes, key insights, things to remember for the interview..."
                  rows={8}
                  className="w-full p-4 text-sm rounded-lg border border-blue-200 dark:border-slate-600 bg-white dark:bg-slate-900/60 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 dark:focus:border-blue-500 resize-y min-h-[180px] transition-all leading-relaxed shadow-sm"
                />
                <div className="flex items-center justify-between mt-2 min-h-[16px]">
                  {localNote ? (
                    <p className="text-[11px] text-green-600 dark:text-green-400 flex items-center gap-1.5">
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 8 8">
                        <circle cx="4" cy="4" r="4" />
                      </svg>
                      Notes saved
                    </p>
                  ) : <span />}
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    {localNote.length} chars
                  </span>
                </div>
              </div>

              {/* Complete toggle (bottom) */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={onToggleComplete}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    isComplete
                      ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-300 dark:border-green-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-800"
                      : "bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-600 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 hover:border-green-300 dark:hover:border-green-800"
                  }`}
                >
                  {isComplete ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
                        <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Completed · Click to undo
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
                        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M4.5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
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

export default JobHunt;
