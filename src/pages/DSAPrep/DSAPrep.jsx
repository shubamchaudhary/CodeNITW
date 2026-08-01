import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { toast } from "react-toastify";
import { DSA_TOPICS, DSA_TOTAL } from "../../Data/DSAPrep";
import { GLASS, GLASS_PANEL } from "../../components/glass";
import PageShell from "../../components/PageShell";
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
  hasLegacyPersonalPlanData,
  isPersonalPlanMigrated,
  migratePersonalPlanProgress,
  dismissPersonalPlanImport,
  dateKey,
  getDay,
  addToPlanDay,
  removeFromPlanDay,
  dsaPlanItem,
} from "../../Data/planStore";

// Page-level card and row surfaces now come from the shared glass tokens, so
// every page frosts identically.
const CARD = GLASS;
const ROW = GLASS_PANEL;

// One accent per topic card, cycled — the coloured dot + progress bar that give
// the board its rhythm (borrowed from the kanban-style reference).
const ACCENTS = [
  { dot: "bg-orange-500", ring: "shadow-orange-500/40", bar: "from-orange-500 to-amber-400" },
  { dot: "bg-violet-500", ring: "shadow-violet-500/40", bar: "from-violet-500 to-fuchsia-400" },
  { dot: "bg-sky-500", ring: "shadow-sky-500/40", bar: "from-sky-500 to-cyan-400" },
  { dot: "bg-emerald-500", ring: "shadow-emerald-500/40", bar: "from-emerald-500 to-teal-400" },
  { dot: "bg-rose-500", ring: "shadow-rose-500/40", bar: "from-rose-500 to-pink-400" },
  { dot: "bg-indigo-500", ring: "shadow-indigo-500/40", bar: "from-indigo-500 to-blue-400" },
];

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
  const [bannerHidden, setBannerHidden] = useState(false);

  // Which problems are already on today's plan — drives the ⊕ Today toggle.
  const today = dateKey();
  const readPlanned = useCallback(
    () => new Set(getDay(today).filter((i) => i.source === "dsa").map((i) => i.refId)),
    [today]
  );
  const [plannedToday, setPlannedToday] = useState(readPlanned);

  const handleImportPlan = useCallback(() => {
    const n = migratePersonalPlanProgress();
    setSolved(loadJSON(KEYS.DSA_COMPLETED, {}));
    setStarred(loadJSON(KEYS.DSA_STARRED, {}));
    setBannerHidden(true);
    toast.success(
      n > 0
        ? `Imported ${n} solved problem${n === 1 ? "" : "s"} from your Personal Plan`
        : "Personal Plan progress imported"
    );
  }, []);

  const handleDismissPlan = useCallback(() => {
    dismissPersonalPlanImport();
    setBannerHidden(true);
  }, []);

  useEffect(
    () =>
      subscribe((key) => {
        if (key === KEYS.DSA_COMPLETED) setSolved(loadJSON(KEYS.DSA_COMPLETED, {}));
        if (key === KEYS.DSA_NOTES) setNotes(loadJSON(KEYS.DSA_NOTES, {}));
        if (key === KEYS.DSA_STARRED) setStarred(loadJSON(KEYS.DSA_STARRED, {}));
        // Keep the toggles honest when the Planning page edits the same day.
        if (key === KEYS.PLAN_DAYS) setPlannedToday(readPlanned());
      }),
    [readPlanned]
  );

  const totalSolved = useMemo(
    () => DSA_TOPICS.reduce((a, t) => a + t.problems.filter((p) => solved[p.id]).length, 0),
    [solved]
  );
  const totalPct = DSA_TOTAL ? Math.round((totalSolved / DSA_TOTAL) * 100) : 0;
  const starredCount = useMemo(() => Object.values(starred).filter(Boolean).length, [starred]);

  const visibleTopics = useMemo(() => {
    if (filter === "ALL") return DSA_TOPICS;
    if (filter === "Today")
      return DSA_TOPICS.map((t) => ({
        ...t,
        problems: t.problems.filter((p) => plannedToday.has(p.id)),
      })).filter((t) => t.problems.length);
    return DSA_TOPICS.map((t) => ({
      ...t,
      problems: t.problems.filter((p) =>
        filter === "Starred" ? starred[p.id] : p.difficulty === filter
      ),
    })).filter((t) => t.problems.length);
  }, [filter, starred, plannedToday]);

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

  // Push a problem onto today's plan (or pull it back off) without leaving this
  // page. Planning listens on PLAN_DAYS, so it appears there immediately.
  const togglePlannedToday = useCallback(
    (problem, topic) => {
      if (plannedToday.has(problem.id)) {
        removeFromPlanDay(today, "dsa", problem.id);
        toast.info(`Removed "${problem.title}" from today's plan`);
      } else {
        addToPlanDay(today, dsaPlanItem(problem, topic));
        toast.success(`Added "${problem.title}" to today's plan`);
      }
      setPlannedToday(readPlanned());
    },
    [plannedToday, today, readPlanned]
  );

  if (!authReady) return null;

  const showImport = !bannerHidden && hasLegacyPersonalPlanData() && !isPersonalPlanMigrated();

  return (
    <PageShell>
      <div className="min-h-screen flex justify-center px-3">
        <div className="w-full sm:w-11/12 lg:w-5/6 xl:w-3/4 2xl:w-2/3">

          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`mt-6 mb-5 rounded-3xl ${CARD} px-5 sm:px-7 py-5`}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-[26px] leading-none font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-slate-800 via-slate-700 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-400">
                    DSA
                  </h1>
                  <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-orange-500/10 dark:bg-orange-400/10 text-orange-600 dark:text-orange-300 border border-orange-500/25 dark:border-orange-400/25 backdrop-blur-sm">
                    {DSA_TOTAL} most-asked
                  </span>
                </div>
                <p className="text-[11.5px] text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                  Medium &amp; Hard · {DSA_REVISIT_DAYS}-day spaced repetition — solved problems reopen after {DSA_REVISIT_DAYS} days
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <StatPill label="Solved" value={`${totalSolved}`} sub={`/${DSA_TOTAL}`} />
                <StatPill label="Starred" value={starredCount} accent="text-yellow-500 dark:text-yellow-400" />
                <StatPill label="Today" value={plannedToday.size} accent="text-sky-600 dark:text-sky-400" />
                <div className="relative w-16 h-16 shrink-0">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="currentColor" className="text-gray-200/80 dark:text-white/10" strokeWidth="5" />
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
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-orange-600 dark:text-orange-400">{totalPct}%</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Import old Personal Plan progress ── */}
          {showImport && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-2xl border border-indigo-300/50 dark:border-indigo-500/25 bg-indigo-500/10 dark:bg-indigo-500/10 backdrop-blur-xl px-4 py-3 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Continue from your Personal Plan</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Found earlier progress on this device — import your solved &amp; starred problems into this account.
                </p>
              </div>
              <button
                onClick={handleImportPlan}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 transition-all shrink-0"
              >
                Import
              </button>
              <button
                onClick={handleDismissPlan}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
                title="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16"><path d="M5 5l6 6M11 5l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </motion.div>
          )}

          {/* ── Filter ── */}
          <div className={`mb-5 rounded-2xl ${CARD} p-1.5 inline-flex flex-wrap gap-1`}>
            {[
              { key: "ALL", label: `All ${DSA_TOTAL}` },
              { key: "Medium", label: "Medium" },
              { key: "Hard", label: "Hard" },
              { key: "Starred", label: `★ ${starredCount}` },
              { key: "Today", label: `◉ Today ${plannedToday.size}` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  filter === tab.key
                    ? "bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30"
                    : "text-gray-600 dark:text-gray-400 hover:bg-white/70 dark:hover:bg-white/[0.06] hover:text-orange-600 dark:hover:text-orange-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Topic cards ── */}
          {visibleTopics.length === 0 ? (
            <div className={`rounded-2xl ${CARD} py-14 text-center`}>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {filter === "Today"
                  ? "Nothing queued for today yet — hit ⊕ Today on any problem."
                  : "No problems match this filter."}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {visibleTopics.map((topic, i) => (
                <TopicCard
                  key={topic.topic}
                  topic={topic}
                  accent={ACCENTS[i % ACCENTS.length]}
                  isOpen={selectedTopic === topic.topic}
                  onToggle={() => setSelectedTopic((p) => (p === topic.topic ? null : topic.topic))}
                  solved={solved}
                  starred={starred}
                  notes={notes}
                  plannedToday={plannedToday}
                  onToggleSolved={toggleSolved}
                  onToggleStar={toggleStar}
                  onNoteChange={saveNote}
                  onTogglePlanned={togglePlannedToday}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

function StatPill({ label, value, sub, accent = "text-gray-800 dark:text-gray-100" }) {
  return (
    <div className="hidden sm:block text-right px-3 py-1.5 rounded-xl bg-white/50 dark:bg-white/[0.04] border border-white/60 dark:border-white/[0.06]">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
      <p className={`text-base font-extrabold leading-tight ${accent}`}>
        {value}
        {sub && <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">{sub}</span>}
      </p>
    </div>
  );
}

function TopicCard({ topic, accent, isOpen, onToggle, solved, starred, notes, plannedToday, onToggleSolved, onToggleStar, onNoteChange, onTogglePlanned }) {
  const done = topic.problems.filter((p) => solved[p.id]).length;
  const pct = topic.problems.length ? (100 * done) / topic.problems.length : 0;
  const queued = topic.problems.filter((p) => plannedToday.has(p.id)).length;

  return (
    <div className={`rounded-2xl ${CARD} overflow-hidden transition-all hover:border-white/90 dark:hover:border-white/[0.14]`}>
      <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 cursor-pointer select-none" onClick={onToggle}>
        <span className={`w-2 h-2 rounded-full shrink-0 ${accent.dot} shadow-[0_0_10px_2px] ${accent.ring}`} />
        <div className="flex-1 min-w-0">
          <h2 className="text-[13.5px] font-bold text-gray-700 dark:text-gray-200 truncate">{topic.topic}</h2>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {queued > 0 && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/25"
              title={`${queued} queued on today's plan`}
            >
              ◉ {queued}
            </span>
          )}
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 tabular-nums">{done}/{topic.problems.length}</span>
          <div className="w-16 sm:w-24 h-1.5 rounded-full bg-gray-200/70 dark:bg-white/10 overflow-hidden">
            <div className={`h-full rounded-full bg-gradient-to-r ${accent.bar}`} style={{ width: `${pct}%`, transition: "width 0.4s ease" }} />
          </div>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-gray-400 dark:text-gray-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="border-t border-white/60 dark:border-white/[0.06] px-2 sm:px-3 py-3 space-y-2" onClick={(e) => e.stopPropagation()}>
              {topic.problems.map((p) => (
                <QuestionRow
                  key={p.id}
                  problem={p}
                  topicName={topic.topic}
                  isSolved={!!solved[p.id]}
                  isStarred={!!starred[p.id]}
                  isPlanned={plannedToday.has(p.id)}
                  note={notes[p.id] || ""}
                  onToggleSolved={onToggleSolved}
                  onToggleStar={onToggleStar}
                  onNoteChange={onNoteChange}
                  onTogglePlanned={onTogglePlanned}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuestionRow({ problem, topicName, isSolved, isStarred, isPlanned, note, onToggleSolved, onToggleStar, onNoteChange, onTogglePlanned }) {
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
      ? { label: "Hard", badge: "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/25" }
      : { label: "Med", badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25" };

  return (
    <div>
      <div
        onClick={() => setShowNotes((s) => !s)}
        className={`group flex items-center gap-2.5 rounded-xl px-3 py-2.5 cursor-pointer transition-all ${
          isSolved
            ? "bg-emerald-500/10 dark:bg-emerald-500/[0.07] border border-emerald-500/30 dark:border-emerald-500/20"
            : `${ROW} hover:border-orange-400/60 dark:hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/5`
        } ${isPlanned && !isSolved ? "ring-1 ring-sky-400/50 dark:ring-sky-500/40" : ""}`}
      >
        {/* Difficulty */}
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 border ${diff.badge}`}>
          {diff.label}
        </span>

        {/* Title */}
        <span className={`text-[13px] font-semibold truncate flex-1 min-w-0 ${isSolved ? "text-gray-400 dark:text-gray-500 line-through decoration-1" : "text-gray-800 dark:text-gray-100"}`}>
          {problem.title}
        </span>

        {/* Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {localNote && <span title="Has notes" className="text-blue-400 dark:text-blue-500 text-xs hidden sm:inline">✎</span>}

          {daysLeft != null && (
            <span
              title={`Reopens for re-attempt in ${Math.max(daysLeft, 0)} day(s)`}
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold whitespace-nowrap border border-emerald-500/25"
            >
              {Math.max(daysLeft, 0)}d
            </span>
          )}

          {/* Add / remove from today's plan — mirrors straight into Planning */}
          <button
            onClick={(e) => { e.stopPropagation(); onTogglePlanned(problem, topicName); }}
            title={isPlanned ? "Remove from today's plan" : "Add to today's plan"}
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md border transition-all ${
              isPlanned
                ? "bg-sky-500 border-sky-500 text-white shadow-md shadow-sky-500/30"
                : "bg-white/60 dark:bg-white/[0.05] border-gray-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-sky-400 hover:text-sky-600 dark:hover:text-sky-300"
            }`}
          >
            {isPlanned ? "◉" : "⊕"}
            <span className="hidden sm:inline">Today</span>
          </button>

          <a
            href={problem.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md bg-white/60 dark:bg-white/[0.05] border border-gray-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-orange-400 hover:text-orange-600 dark:hover:text-orange-300 transition-all"
            title="Open on LeetCode"
          >
            <span className="hidden sm:inline">LeetCode</span>
            <span className="sm:hidden">LC</span>
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 12 12"><path d="M3.5 8.5l5-5M4.5 3.5h4v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </a>

          <button
            onClick={(e) => { e.stopPropagation(); onToggleStar(problem.id); }}
            title={isStarred ? "Unstar" : "Star"}
            className={`text-lg leading-none transition-transform hover:scale-110 ${isStarred ? "text-yellow-400" : "text-gray-300 dark:text-slate-600 hover:text-yellow-400"}`}
          >
            {isStarred ? "★" : "☆"}
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onToggleSolved(problem.id, !isSolved); }}
            title={isSolved ? "Mark unsolved" : `Mark solved (starts ${DSA_REVISIT_DAYS}-day timer)`}
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${isSolved ? "bg-emerald-500 border-emerald-500 shadow-md shadow-emerald-500/30" : "border-gray-300 dark:border-slate-600 hover:border-emerald-400"}`}
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
            <div className="mx-1 mt-2 mb-1 rounded-xl border border-gray-200/90 dark:border-white/[0.07] bg-white/60 dark:bg-white/[0.03] p-3.5">
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
                className="w-full p-3 text-xs rounded-lg border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 resize-y min-h-[90px] leading-relaxed backdrop-blur-sm"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DSAPrep;
