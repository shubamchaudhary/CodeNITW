import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { MOST_ASKED_TIERS, MOST_ASKED_TOTAL } from "../../Data/MostAskedDSA";
import { GLASS } from "../../components/glass";
import {
  KEYS,
  loadJSON,
  setSourceComplete,
  setDsaStarred,
  pruneExpiredDsaSolves,
  subscribe,
} from "../../Data/planStore";

const MostAskedDSA = () => {
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), () => setAuthReady(true));
    return unsubscribe;
  }, []);

  // Share the spaced-repetition pruning with the main DSA page.
  useEffect(() => { pruneExpiredDsaSolves(); }, []);

  const [solved, setSolved] = useState(() => loadJSON(KEYS.DSA_COMPLETED, {}));
  const [starred, setStarred] = useState(() => loadJSON(KEYS.DSA_STARRED, {}));
  const [openTier, setOpenTier] = useState(MOST_ASKED_TIERS[0]?.tier ?? null);

  useEffect(
    () =>
      subscribe((key) => {
        if (key === KEYS.DSA_COMPLETED) setSolved(loadJSON(KEYS.DSA_COMPLETED, {}));
        if (key === KEYS.DSA_STARRED) setStarred(loadJSON(KEYS.DSA_STARRED, {}));
      }),
    []
  );

  const totalSolved = useMemo(
    () =>
      MOST_ASKED_TIERS.reduce(
        (a, t) => a + t.problems.filter((p) => solved[p.id]).length,
        0
      ),
    [solved]
  );
  const totalPct = MOST_ASKED_TOTAL ? Math.round((totalSolved / MOST_ASKED_TOTAL) * 100) : 0;

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

  if (!authReady) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pb-16">
      <div className="min-h-screen flex justify-center px-2">
        <div className="w-full sm:w-11/12 lg:w-3/4 xl:w-2/3">

          {/* ── Header ── */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-6 mb-3 px-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Most Asked DSA</h1>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                    {MOST_ASKED_TOTAL} must-do
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  The highest-frequency interview problems, tiered by how much time you have left. Solved &amp; ★ sync with the full DSA list.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Solved</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    {totalSolved}<span className="text-sm font-normal text-gray-500 dark:text-gray-400">/{MOST_ASKED_TOTAL}</span>
                  </p>
                </div>
                <div className="relative w-14 h-14">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="currentColor" className="text-gray-200 dark:text-slate-700" strokeWidth="5" />
                    <circle cx="28" cy="28" r="22" fill="none" stroke="url(#mostAskedGrad)" strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 22}`}
                      strokeDashoffset={`${2 * Math.PI * 22 * (1 - totalPct / 100)}`}
                      style={{ transition: "stroke-dashoffset 0.5s ease" }} />
                    <defs>
                      <linearGradient id="mostAskedGrad" x1="0%" y1="0%" x2="100%" y2="0%">
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

          {/* ── Cvent call-out ── */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-2 mb-4 rounded-xl border border-amber-300 dark:border-amber-700/50 bg-amber-50/80 dark:bg-amber-900/20 backdrop-blur-md px-4 py-3"
          >
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              🎯 Cvent interview — flagged below
            </p>
            <p className="text-xs text-amber-700/90 dark:text-amber-300/80 mt-0.5">
              A previous candidate was asked <span className="font-semibold">3Sum</span> and <span className="font-semibold">LRU Cache</span>. Both are in Tier 1 with a <span className="font-semibold">Cvent</span> tag — do those first.
            </p>
          </motion.div>

          {/* ── Tiers ── */}
          {MOST_ASKED_TIERS.map((tier) => (
            <TierCard
              key={tier.tier}
              tier={tier}
              isOpen={openTier === tier.tier}
              onToggle={() => setOpenTier((p) => (p === tier.tier ? null : tier.tier))}
              solved={solved}
              starred={starred}
              onToggleSolved={toggleSolved}
              onToggleStar={toggleStar}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

function TierCard({ tier, isOpen, onToggle, solved, starred, onToggleSolved, onToggleStar }) {
  const done = tier.problems.filter((p) => solved[p.id]).length;
  const pct = tier.problems.length ? (100 * done) / tier.problems.length : 0;

  return (
    <div className={`mx-2 my-1.5 rounded-xl ${GLASS} border-l-4 border-l-orange-400 shadow-sm hover:shadow-md transition-all overflow-hidden`}>
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none" onClick={onToggle}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200">{tier.tier}</h2>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
              {tier.label}
            </span>
          </div>
          {!isOpen && (
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 truncate">{tier.blurb}</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[11px] text-gray-500 dark:text-gray-400">{done}/{tier.problems.length}</span>
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
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3 px-1">{tier.blurb}</p>
              {tier.problems.map((p) => (
                <QuestionRow
                  key={p.id}
                  problem={p}
                  isSolved={!!solved[p.id]}
                  isStarred={!!starred[p.id]}
                  onToggleSolved={onToggleSolved}
                  onToggleStar={onToggleStar}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuestionRow({ problem, isSolved, isStarred, onToggleSolved, onToggleStar }) {
  const diff =
    problem.difficulty === "Hard"
      ? { label: "Hard", badge: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300" }
      : problem.difficulty === "Easy"
      ? { label: "Easy", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" }
      : { label: "Med", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" };

  return (
    <div
      className={`group flex items-start gap-3 rounded-xl px-3 py-2.5 mb-2 border backdrop-blur-md transition-all ${
        isSolved
          ? "bg-green-50/60 dark:bg-green-900/20 border-green-300/70 dark:border-green-800/50"
          : "bg-white/50 dark:bg-slate-800/40 border-gray-200/70 dark:border-white/10 hover:border-orange-300 dark:hover:border-orange-700/70 hover:shadow-sm"
      }`}
    >
      {/* Difficulty */}
      <span className={`mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${diff.badge}`}>
        {diff.label}
      </span>

      {/* Title + pattern */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-semibold ${isSolved ? "text-gray-400 dark:text-gray-500 line-through decoration-1" : "text-gray-800 dark:text-gray-100"}`}>
            {problem.title}
          </span>
          {problem.asked && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-800 dark:bg-amber-800/60 dark:text-amber-200 uppercase tracking-wide">
              {problem.asked}
            </span>
          )}
        </div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
          <span className="font-medium text-gray-600 dark:text-gray-300">{problem.topic}</span>
          {problem.pattern ? ` · ${problem.pattern}` : ""}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 shrink-0 mt-0.5">
        <a
          href={problem.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-orange-100 hover:text-orange-600 dark:hover:bg-orange-900/30 dark:hover:text-orange-300 transition-colors"
          title="Open on LeetCode"
        >
          LeetCode
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 12 12"><path d="M3.5 8.5l5-5M4.5 3.5h4v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </a>

        <button
          onClick={() => onToggleStar(problem.id)}
          title={isStarred ? "Unstar" : "Star"}
          className={`text-lg leading-none transition-transform hover:scale-110 ${isStarred ? "text-yellow-400" : "text-gray-300 dark:text-slate-500 hover:text-yellow-400"}`}
        >
          {isStarred ? "★" : "☆"}
        </button>

        <button
          onClick={() => onToggleSolved(problem.id, !isSolved)}
          title={isSolved ? "Mark unsolved" : "Mark solved"}
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${isSolved ? "bg-green-500 border-green-500" : "border-gray-300 dark:border-slate-500 hover:border-green-400"}`}
        >
          {isSolved && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          )}
        </button>
      </div>
    </div>
  );
}

export default MostAskedDSA;
