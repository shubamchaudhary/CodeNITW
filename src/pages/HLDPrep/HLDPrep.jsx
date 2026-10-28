import React, { useState, useEffect, useCallback, useMemo } from "react";
import PageSkeleton from "../../components/PageSkeleton";
import { motion, AnimatePresence } from "framer-motion";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { HLD_PROBLEMS, HLD_TIERS, HLD_PRIORITY_CONFIG, HLD_EVIDENCE } from "../../Data/HLDPrep";
import { GLASS, GLASS_PANEL, GLASS_TRACK, SEGMENT_ON, SEGMENT_OFF, LIGHT_BUTTON } from "../../components/glass";
import PageShell from "../../components/PageShell";
import { getAuthState } from "../../Data/authGate";
import { KEYS, loadJSON, setSourceComplete, setHldStarred, hldDaysSinceDone, subscribe } from "../../Data/planStore";

// The DSA page's look, for system design: one card per priority tier, always
// open, the problems inside it in the order to study them. The order is the
// point, so every row carries its rank and the first one not yet done is
// marked Next.
const CARD = GLASS;
const ROW = GLASS_PANEL;

// Same accents as the DSA board, one per tier.
const ACCENTS = [{ dot: "", ring: "", halo: "", bar: "" }];

const HLDPrep = () => {
  // Already known when the page is opened after the app has loaded.
  const [authReady, setAuthReady] = useState(() => getAuthState() !== "unknown");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), () => setAuthReady(true));
    return unsubscribe;
  }, []);

  const [done, setDone] = useState(() => loadJSON(KEYS.HLD_COMPLETED, {}));
  const [starred, setStarred] = useState(() => loadJSON(KEYS.HLD_STARRED, {}));
  const [filter, setFilter] = useState("ALL");

  useEffect(
    () =>
      subscribe((key) => {
        if (key === KEYS.HLD_COMPLETED) setDone(loadJSON(KEYS.HLD_COMPLETED, {}));
        if (key === KEYS.HLD_STARRED) setStarred(loadJSON(KEYS.HLD_STARRED, {}));
      }),
    []
  );

  const nextId = useMemo(() => (HLD_PROBLEMS.find((p) => !done[p.id]) || {}).id, [done]);

  const matches = useCallback(
    (p) => {
      if (filter === "TODO") return !done[p.id];
      if (filter === "Starred") return !!starred[p.id];
      return true;
    },
    [filter, done, starred]
  );

  const visibleTiers = useMemo(
    () =>
      HLD_TIERS.map((t) => ({ ...t, problems: HLD_PROBLEMS.filter((p) => p.priority === t.key && matches(p)) })).filter(
        (t) => t.problems.length
      ),
    [matches]
  );

  // Header stats always describe the whole list: "To do" would read 0% forever.
  const stats = useMemo(() => {
    const n = HLD_PROBLEMS.filter((p) => done[p.id]).length;
    return { done: n, total: HLD_PROBLEMS.length, pct: Math.round((100 * n) / HLD_PROBLEMS.length) };
  }, [done]);

  const toggleDone = useCallback((id, checked) => {
    setSourceComplete("hld", id, checked);
    setDone((m) => ({ ...m, [id]: checked }));
  }, []);

  const toggleStar = useCallback(
    (id) => {
      const next = !starred[id];
      setHldStarred(id, next);
      setStarred((m) => ({ ...m, [id]: next }));
    },
    [starred]
  );

  if (!authReady) return <PageSkeleton />;

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
                    HLD
                  </h1>
                  <span
                    className="inline-flex items-center h-6 px-2 rounded border border-line font-mono text-[12px] text-fg-subtle"
                    title={HLD_EVIDENCE.summary}
                  >
                    {HLD_PROBLEMS.length} ranked for SDE2
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <StatPill label="Done" value={`${stats.done}`} sub={`/${stats.total}`} />
                <div className="relative w-16 h-16 shrink-0">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="currentColor" className="text-line-strong" strokeWidth="5" />
                    <circle cx="28" cy="28" r="22" fill="none" stroke="var(--brand)" strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 22}`}
                      strokeDashoffset={`${2 * Math.PI * 22 * (1 - stats.pct / 100)}`}
                      style={{ transition: "stroke-dashoffset 0.5s ease" }} />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-mono text-[11px] font-medium text-fg">{stats.pct}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Filter ── */}
          <div className={`mb-5 rounded-lg ${GLASS_TRACK} p-1.5 inline-flex flex-wrap gap-1`}>
            {[
              { key: "ALL", label: "All", title: "Every problem, in order" },
              { key: "TODO", label: "To do", title: "Only what's left" },
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

          {/* ── Tier cards ── */}
          {visibleTiers.length === 0 ? (
            <div className={`rounded-lg ${CARD} py-14 text-center`}>
              <p className="text-sm text-fg-subtle">
                {filter === "TODO" ? "All done — every breakdown is ticked." : "No problems match this filter."}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {visibleTiers.map((tier) => (
                <TierCard
                  key={tier.key}
                  tier={tier}
                  accent={ACCENTS[HLD_TIERS.findIndex((t) => t.key === tier.key) % ACCENTS.length]}
                  done={done}
                  starred={starred}
                  nextId={nextId}
                  onToggleDone={toggleDone}
                  onToggleStar={toggleStar}
                />
              ))}
            </div>
          )}

          <p className="mt-5 px-1 text-[11px] leading-relaxed text-fg-subtle">
            {HLD_EVIDENCE.summary}
          </p>
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

// Always open: the whole order is on screen, nothing to expand.
function TierCard({ tier, accent, done, starred, nextId, onToggleDone, onToggleStar }) {
  const all = HLD_PROBLEMS.filter((p) => p.priority === tier.key);
  const n = all.filter((p) => done[p.id]).length;
  const pct = all.length ? (100 * n) / all.length : 0;
  const prio = HLD_PRIORITY_CONFIG[tier.key];

  return (
    <div className={`rounded-lg ${CARD} overflow-hidden`}>
      <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5">
        <div className="flex-1 min-w-0 flex items-baseline gap-2">
          <h2 className="text-[13.5px] font-semibold text-fg-muted truncate">{tier.title}</h2>
          <span className="hidden sm:inline text-[11px] font-medium text-fg-subtle truncate">{tier.blurb}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${prio.cls}`} title={prio.blurb}>
            {prio.label}
          </span>
          <span className="text-[11px] font-semibold text-fg-subtle tabular-nums">{n}/{all.length}</span>
          <div className="w-16 sm:w-24 h-1 rounded-full bg-surface-hover overflow-hidden">
            <div className={`h-full rounded-full ${accent.bar} bg-brand`} style={{ width: `${pct}%`, transition: "width 0.4s ease" }} />
          </div>
        </div>
      </div>

      <div className="border-t border-line px-2 sm:px-3 py-3 space-y-2">
        {tier.problems.map((p) => (
          <ProblemRow
            key={p.id}
            problem={p}
            isDone={!!done[p.id]}
            isStarred={!!starred[p.id]}
            isNext={p.id === nextId}
            onToggleDone={onToggleDone}
            onToggleStar={onToggleStar}
          />
        ))}
      </div>
    </div>
  );
}

function ProblemRow({ problem, isDone, isStarred, isNext, onToggleDone, onToggleStar }) {
  const [open, setOpen] = useState(false);

  // Age of the tick, shown purely as information — a tick never expires.
  const doneDays = isDone ? hldDaysSinceDone(problem.id) : null;
  const doneLabel = doneDays == null ? null : doneDays === 0 ? "today" : doneDays === 1 ? "1d ago" : `${doneDays}d ago`;

  return (
    <div>
      <div
        onClick={() => setOpen((s) => !s)}
        className={`group flex items-center gap-2.5 rounded-lg px-3 py-2.5 cursor-pointer transition-all ${
          isDone
            ? "bg-success-subtle border border-line "
            : `${ROW} hover:border-line-strong      `
        } ${isNext ? "ring-1 ring-focus " : ""}`}
      >
        {/* Rank: the order to study them in */}
        <span
          className="w-6 text-right text-[11px] font-semibold tabular-nums text-fg-subtle shrink-0"
          title={`#${problem.rank} of ${HLD_PROBLEMS.length}`}
        >
          {problem.rank}
        </span>

        {/* Title, plus the names it is also asked under */}
        <span className="flex items-baseline gap-2 flex-1 min-w-0">
          <span className={`text-[13px] font-semibold truncate ${isDone ? "text-fg-subtle line-through decoration-1" : "text-fg "}`}>
            {problem.title}
          </span>
          {problem.askedAs.length > 0 && (
            <span
              className="hidden lg:inline text-[10px] font-semibold text-fg-subtle truncate"
              title={`Also asked as: ${problem.askedAs.join(", ")}`}
            >
              {problem.askedAs.slice(0, 3).join(" · ")}
            </span>
          )}
        </span>

        {/* Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {isNext && (
            <span
              title="The first one not done yet — do this next"
              className="inline-flex items-center h-[18px] px-[5px] rounded border border-line font-mono text-[11px] font-medium leading-none text-fg whitespace-nowrap"
            >
              Next
            </span>
          )}

          {doneLabel && (
            <span
              title={`You finished this ${doneLabel}`}
              className="inline-flex items-center h-[18px] px-[5px] rounded border border-line font-mono text-[11px] font-medium leading-none text-success-fg whitespace-nowrap"
            >
              ✓ {doneLabel}
            </span>
          )}

          <a
            href={problem.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md bg-canvas border border-line text-fg-muted hover:border-line-strong hover:text-fg ${LIGHT_BUTTON} transition-all`}
            title="Open the breakdown on HelloInterview"
          >
            <span className="hidden sm:inline">Breakdown</span>
            <span className="sm:hidden">HI</span>
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
            onClick={(e) => { e.stopPropagation(); onToggleDone(problem.id, !isDone); }}
            title={isDone ? "Mark not done" : "Mark done"}
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${isDone ? "bg-success border-success " : "border-line-strong hover:border-success "}`}
          >
            {isDone && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            )}
          </button>

          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-fg-subtle">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="mx-1 mt-2 mb-1 rounded-lg border border-line bg-canvas p-3.5 space-y-3">
              <Detail label="What it tests">
                <p className="text-xs leading-relaxed text-fg-muted">{problem.tests}</p>
              </Detail>
              {problem.askedAs.length > 0 && (
                <Detail label="Also asked as">
                  <div className="flex flex-wrap gap-1.5">
                    {problem.askedAs.map((a) => (
                      <span key={a} className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-canvas border border-line text-fg-muted">
                        {a}
                      </span>
                    ))}
                  </div>
                </Detail>
              )}
              <Detail label="Why this rank">
                <p className="text-xs leading-relaxed text-fg-muted">
                  Asked in <b>{problem.seen.lc.mid}</b> of {HLD_EVIDENCE.lcMid} SDE2-level interview reports on LeetCode Discuss
                  ({problem.seen.lc.all} at any level), and <b>{problem.seen.hi.mid}</b> of {HLD_EVIDENCE.hiMid} mid-level
                  reports on HelloInterview ({problem.seen.hi.all} at any level), since 2024.
                </p>
              </Detail>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Detail({ label, children }) {
  return (
    <div>
      <h5 className="mb-1.5 text-[11px] font-semibold text-fg-subtle flex items-center gap-1.5">
        {label}
      </h5>
      {children}
    </div>
  );
}

export default HLDPrep;
