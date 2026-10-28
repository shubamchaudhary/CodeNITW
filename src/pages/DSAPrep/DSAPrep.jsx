import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import PageSkeleton from "../../components/PageSkeleton";
import { motion, AnimatePresence } from "framer-motion";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { toast } from "react-toastify";
import { DSA_TOPICS, DSA_TOTAL, DSA_PRIORITIES, DSA_PRIORITY_CONFIG } from "../../Data/DSAPrep";
import { GLASS, GLASS_PANEL, GLASS_TRACK, SEGMENT_ON, SEGMENT_OFF, LIGHT_LIFT, LIGHT_BUTTON } from "../../components/glass";
import PageShell from "../../components/PageShell";
import { Icon } from "../../components/ui";
import { isOwner } from "../../components/OwnerRoute";
import { requireAuth, getAuthState } from "../../Data/authGate";
import {
  KEYS,
  loadJSON,
  setSourceComplete,
  setSourceNote,
  setDsaStarred,
  backfillDsaTimestamps,
  dsaDaysSinceSolved,
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
const ACCENTS = [{ dot: "", ring: "", halo: "", bar: "" }];

const DSAPrep = () => {
  // Already known when the page is opened after the app has loaded.
  const [authReady, setAuthReady] = useState(() => getAuthState() !== "unknown");
  // Priorities (P0/P1/…) are the owner's own research, shown to no one else.
  const [owner, setOwner] = useState(() => isOwner(getAuth().currentUser));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (u) => {
      setOwner(isOwner(u));
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  // Give any older solve a timestamp so it can show an age. Never un-solves.
  useEffect(() => { backfillDsaTimestamps(); }, []);

  const [solved, setSolved] = useState(() => loadJSON(KEYS.DSA_COMPLETED, {}));
  const [notes, setNotes] = useState(() => loadJSON(KEYS.DSA_NOTES, {}));
  const [starred, setStarred] = useState(() => loadJSON(KEYS.DSA_STARRED, {}));
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [filter, setFilter] = useState("ALL");
  // Signing out while a priority chip is on would leave a filter no one can see.
  useEffect(() => {
    if (!owner) setFilter((f) => (DSA_PRIORITIES.includes(f) ? "ALL" : f));
  }, [owner]);
  const [bannerHidden, setBannerHidden] = useState(false);

  // Which problems are already on today's plan — drives the ⊕ Today toggle.
  const today = dateKey();
  const readPlanned = useCallback(
    () => new Set(getDay(today).filter((i) => i.source === "dsa").map((i) => i.refId)),
    [today]
  );
  const [plannedToday, setPlannedToday] = useState(readPlanned);

  const handleImportPlan = useCallback(() => {
    if (!requireAuth("Your imported progress is saved to your account.")) return;
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

  // One predicate per filter chip.
  const matches = useCallback(
    (p) => {
      if (filter === "ALL") return true;
      if (filter === "Starred") return !!starred[p.id];
      return p.priority === filter;
    },
    [filter, starred]
  );

  const visibleTopics = useMemo(() => {
    if (filter === "ALL") return DSA_TOPICS;
    return DSA_TOPICS.map((t) => ({ ...t, problems: t.problems.filter(matches) })).filter(
      (t) => t.problems.length
    );
  }, [filter, matches]);

  // Header stats follow the active filter, so "Solved" and the ring always
  // describe the set you are actually looking at rather than the whole list.
  const scoped = useMemo(() => {
    const problems = visibleTopics.flatMap((t) => t.problems);
    const done = problems.filter((p) => solved[p.id]).length;
    return { total: problems.length, done, pct: problems.length ? Math.round((100 * done) / problems.length) : 0 };
  }, [visibleTopics, solved]);

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
      if (!requireAuth("Sign in to plan your day — your plan is saved to your account.")) return;
      if (plannedToday.has(problem.id)) {
        removeFromPlanDay(today, "dsa", problem.id);
      } else {
        addToPlanDay(today, dsaPlanItem(problem, topic));
      }
      setPlannedToday(readPlanned());
    },
    [plannedToday, today, readPlanned]
  );

  if (!authReady) return <PageSkeleton />;

  const showImport = !bannerHidden && hasLegacyPersonalPlanData() && !isPersonalPlanMigrated();

  return (
    <PageShell>
      <div className="min-h-screen flex justify-center px-3">
        <div className="w-full sm:w-11/12 lg:w-5/6 xl:w-3/4 2xl:w-2/3">

          {/* ── Header ── */}
          <div
            className="mt-10 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-[32px] leading-10 font-semibold tracking-[-0.02em] text-fg">
                    DSA
                  </h1>
                  <span className="inline-flex items-center h-6 px-2 rounded border border-line font-mono text-[12px] text-fg-subtle">
                    {DSA_TOTAL} most-asked
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <StatPill label="Solved" value={`${scoped.done}`} sub={`/${scoped.total}`} />
                <div className="relative w-16 h-16 shrink-0">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="currentColor" className="text-line-strong" strokeWidth="5" />
                    <circle cx="28" cy="28" r="22" fill="none" stroke="var(--brand)" strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 22}`}
                      strokeDashoffset={`${2 * Math.PI * 22 * (1 - scoped.pct / 100)}`}
                      style={{ transition: "stroke-dashoffset 0.5s ease" }} />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-mono text-[11px] font-medium text-fg">{scoped.pct}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Import old Personal Plan progress ── */}
          {showImport && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-lg border border-line bg-brand-subtle px-4 py-3 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-fg">Continue from your Personal Plan</p>
                <p className="text-xs text-fg-subtle">
                  Found earlier progress on this device — import your solved &amp; starred problems into this account.
                </p>
              </div>
              <button
                onClick={handleImportPlan}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-primary text-on-primary hover:bg-primary-hover transition-all shrink-0"
              >
                Import
              </button>
              <button
                onClick={handleDismissPlan}
                className="text-fg-subtle hover:text-fg-muted shrink-0"
                title="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16"><path d="M5 5l6 6M11 5l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </motion.div>
          )}

          {/* ── Filter ── */}
          <div className={`mb-5 rounded-lg ${GLASS_TRACK} p-1.5 inline-flex flex-wrap gap-1`}>
            {[
              { key: "ALL", label: "All", title: "Every problem" },
              ...(owner ? DSA_PRIORITIES : []).map((p) => ({
                key: p,
                label: p,
                title: DSA_PRIORITY_CONFIG[p].blurb,
              })),
              { key: "Starred", label: "★", title: "Starred" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                title={tab.title}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  filter === tab.key
                    ? SEGMENT_ON
                    : `text-fg-muted  hover:bg-surface-subtle  hover:text-fg  ${SEGMENT_OFF}`
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Topic cards ── */}
          {visibleTopics.length === 0 ? (
            <div className={`rounded-lg ${CARD} py-14 text-center`}>
              <p className="text-sm text-fg-subtle">
                {filter === "Today"
                  ? "Nothing queued for today yet — hit ⊕ Today on any problem."
                  : "No problems match this filter."}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {visibleTopics.map((topic, i) => (
                <TopicCard
                  showP0Badge={owner && filter !== "P0"}
                  showPriority={owner}
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

function StatPill({ label, value, sub, accent = "text-fg  " }) {
  return (
    <div className="hidden sm:block text-right px-3 py-1.5 rounded-lg bg-canvas border border-line">
      <p className="text-[10px] font-semibold text-fg-subtle">{label}</p>
      <p className={`text-base font-semibold leading-tight ${accent}`}>
        {value}
        {sub && <span className="text-[11px] font-medium text-fg-subtle">{sub}</span>}
      </p>
    </div>
  );
}

function TopicCard({ topic, accent, isOpen, onToggle, solved, starred, notes, plannedToday, showP0Badge, showPriority, onToggleSolved, onToggleStar, onNoteChange, onTogglePlanned }) {
  const done = topic.problems.filter((p) => solved[p.id]).length;
  const pct = topic.problems.length ? (100 * done) / topic.problems.length : 0;
  const queued = topic.problems.filter((p) => plannedToday.has(p.id)).length;
  // Unsolved P0s are the reason to open this topic next — redundant noise
  // while the P0 filter is on, since every row shown is already a P0.
  const p0Left = showP0Badge
    ? topic.problems.filter((p) => p.priority === "P0" && !solved[p.id]).length
    : 0;

  return (
    <div className={`rounded-lg ${CARD} overflow-hidden transition-all ${LIGHT_LIFT}`}>
      <div data-tour-dsa-topic={topic.topic} className="flex items-center gap-3 px-4 sm:px-5 py-3.5 cursor-pointer select-none" onClick={onToggle}>
        <div className="flex-1 min-w-0">
          <h2 className="text-[13.5px] font-semibold text-fg-muted truncate">{topic.topic}</h2>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {p0Left > 0 && (
            <span
              className="inline-flex items-center h-[18px] px-[5px] rounded border border-line font-mono text-[11px] font-medium leading-none text-danger-fg whitespace-nowrap"
              title={`${p0Left} P0 problem${p0Left > 1 ? "s" : ""} still unsolved here`}
            >
              {p0Left} P0
            </span>
          )}
          {queued > 0 && (
            <span
              className="inline-flex items-center h-[18px] px-[5px] rounded border border-line font-mono text-[11px] font-medium leading-none text-brand-fg whitespace-nowrap"
              title={`${queued} queued on today's plan`}
            >
              {queued} today
            </span>
          )}
          <span className="text-[11px] font-semibold text-fg-subtle tabular-nums">{done}/{topic.problems.length}</span>
          <div className="w-16 sm:w-24 h-1 rounded-full bg-surface-hover overflow-hidden">
            <div className={`h-full rounded-full ${accent.bar} bg-brand`} style={{ width: `${pct}%`, transition: "width 0.4s ease" }} />
          </div>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-fg-subtle">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="border-t border-line px-2 sm:px-3 py-3 space-y-2" onClick={(e) => e.stopPropagation()}>
              {topic.problems.map((p) => (
                <QuestionRow
                  key={p.id}
                  problem={p}
                  showPriority={showPriority}
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

function QuestionRow({ problem, showPriority, topicName, isSolved, isStarred, isPlanned, note, onToggleSolved, onToggleStar, onNoteChange, onTogglePlanned }) {
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

  // Age of the solve, shown purely as information — a solve never expires.
  const solvedDays = isSolved ? dsaDaysSinceSolved(problem.id) : null;
  const solvedLabel =
    solvedDays == null ? null : solvedDays === 0 ? "today" : solvedDays === 1 ? "1d ago" : `${solvedDays}d ago`;

  const prio = showPriority ? DSA_PRIORITY_CONFIG[problem.priority] : null;

  // Three-way: the set now includes Easy problems, so this can't be a
  // Hard/everything-else binary any more.
  const diff =
    problem.difficulty === "Hard"
      ? { label: "Hard", badge: "bg-danger-subtle text-danger-fg border-line   " }
      : problem.difficulty === "Easy"
      ? { label: "Easy", badge: "bg-success-subtle text-success-fg border-line   " }
      : { label: "Med", badge: "bg-warning-subtle text-warning-fg border-line   " };

  return (
    <div>
      <div
        onClick={() => setShowNotes((s) => !s)}
        className={`group flex items-center gap-2.5 rounded-lg px-3 py-2.5 cursor-pointer transition-all ${
          isSolved
            ? "bg-success-subtle border border-line "
            : `${ROW} hover:border-line-strong      `
        } ${isPlanned && !isSolved ? "ring-1 ring-focus " : ""}`}
      >
        {/* Core = Blind 75, i.e. this problem *is* a pattern worth knowing */}
        {problem.core && (
          <span
            className="text-[11px] leading-none text-brand-fg shrink-0"
            title="Core pattern (Blind 75) — this problem is a topic in itself"
          >
            ◆
          </span>
        )}

        {/* Priority — how often this is actually asked across 200 companies */}
        {prio && (
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 border ${prio.cls}`}
            title={`${prio.label} — ${prio.blurb}`}
          >
            {prio.label}
          </span>
        )}

        {/* Difficulty */}
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 border ${diff.badge}`}>
          {diff.label}
        </span>

        {/* Title, plus the technique it teaches when it's a recognised anchor */}
        <span className="flex items-baseline gap-2 flex-1 min-w-0">
          <span className={`text-[13px] font-semibold truncate ${isSolved ? "text-fg-subtle line-through decoration-1" : "text-fg "}`}>
            {problem.title}
          </span>
          {problem.pattern && (
            <span
              className="hidden lg:inline text-[10px] font-semibold text-fg-subtle whitespace-nowrap shrink-0"
              title={`Teaches: ${problem.pattern}`}
            >
              {problem.pattern}
            </span>
          )}
        </span>

        {/* Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {localNote && <span title="Has notes" className="text-fg text-xs hidden sm:inline">✎</span>}

          {solvedLabel && (
            <span
              title={`You solved this ${solvedLabel === "today" ? "today" : solvedLabel}`}
              className="inline-flex items-center h-[18px] px-[5px] rounded border border-line font-mono text-[11px] font-medium leading-none text-success-fg whitespace-nowrap"
            >
              ✓ {solvedLabel}
            </span>
          )}

          {/* Add / remove from today's plan — mirrors straight into Planning */}
          <button
            data-tour-plan={problem.id}
            onClick={(e) => { e.stopPropagation(); onTogglePlanned(problem, topicName); }}
            title={isPlanned ? "Remove from today's plan" : "Add to today's plan"}
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md border transition-all ${
              isPlanned
                ? "bg-brand border-line text-white "
                : `bg-canvas  border-line  text-fg-subtle  hover:border-line-strong hover:text-fg  ${LIGHT_BUTTON} `
            }`}
          >
            {isPlanned ? <Icon.check className="w-3.5 h-3.5" /> : <Icon.plus className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Today</span>
          </button>

          <a
            href={problem.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md bg-canvas border border-line text-fg-muted hover:border-line-strong hover:text-fg ${LIGHT_BUTTON} transition-all`}
            title="Open on LeetCode"
          >
            <span className="hidden sm:inline">LeetCode</span>
            <span className="sm:hidden">LC</span>
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 12 12"><path d="M3.5 8.5l5-5M4.5 3.5h4v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </a>

          <button
            onClick={(e) => { e.stopPropagation(); onToggleStar(problem.id); }}
            title={isStarred ? "Unstar" : "Star"}
            className={`text-lg leading-none transition-transform ${isStarred ? "text-warning-fg " : "text-line-strong hover:text-fg "}`}
          >
            {isStarred ? "★" : "☆"}
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onToggleSolved(problem.id, !isSolved); }}
            title={isSolved ? "Mark unsolved" : "Mark solved"}
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${isSolved ? "bg-success border-success " : "border-line-strong hover:border-success "}`}
          >
            {isSolved && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            )}
          </button>

          <motion.div animate={{ rotate: showNotes ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-fg-subtle">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showNotes && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="mx-1 mt-2 mb-1 rounded-lg border border-line bg-canvas p-3.5">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-[11px] font-semibold text-fg-subtle flex items-center gap-1.5">
                  Solution Notes
                </h5>
                <span className="text-[10px] text-fg-subtle">auto-saved</span>
              </div>
              <textarea
                value={localNote}
                onChange={handleNoteInput}
                placeholder="Approach, pattern, time/space complexity, key insight, edge cases..."
                rows={4}
                className="w-full p-3 text-xs rounded-lg border border-line bg-canvas text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-orange-400/40 hover:border-line-strong resize-y min-h-[90px] leading-relaxed"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DSAPrep;
