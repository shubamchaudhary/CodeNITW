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
const ACCENTS = [
  { dot: "bg-rose-500", ring: "shadow-rose-500/40", halo: "light:shadow-[0_0_0_3px_rgba(244,63,94,0.16)]", bar: "from-rose-500 to-pink-400" },
  { dot: "bg-orange-500", ring: "shadow-orange-500/40", halo: "light:shadow-[0_0_0_3px_rgba(249,115,22,0.16)]", bar: "from-orange-500 to-amber-400" },
  { dot: "bg-sky-500", ring: "shadow-sky-500/40", halo: "light:shadow-[0_0_0_3px_rgba(14,165,233,0.16)]", bar: "from-sky-500 to-cyan-400" },
  { dot: "bg-violet-500", ring: "shadow-violet-500/40", halo: "light:shadow-[0_0_0_3px_rgba(139,92,246,0.16)]", bar: "from-violet-500 to-fuchsia-400" },
];

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
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`mt-6 mb-5 rounded-3xl ${CARD} px-5 sm:px-7 py-5`}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-[26px] leading-none font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-slate-800 via-slate-700 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-400 light:bg-none light:text-slate-900">
                    HLD
                  </h1>
                  <span
                    className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-orange-500/10 dark:bg-orange-400/10 text-orange-600 dark:text-orange-300 border border-orange-500/25 dark:border-orange-400/25 backdrop-blur-sm light:bg-orange-50 light:text-orange-700 light:border-orange-600/15 light:backdrop-filter-none"
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
                    <circle cx="28" cy="28" r="22" fill="none" stroke="currentColor" className="text-gray-200/80 dark:text-white/10 light:text-slate-900/[0.06]" strokeWidth="5" />
                    <circle cx="28" cy="28" r="22" fill="none" stroke="url(#hldProgressGrad)" strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 22}`}
                      strokeDashoffset={`${2 * Math.PI * 22 * (1 - stats.pct / 100)}`}
                      style={{ transition: "stroke-dashoffset 0.5s ease" }} />
                    <defs>
                      <linearGradient id="hldProgressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-orange-600 dark:text-orange-400">{stats.pct}%</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Filter ── */}
          <div className={`mb-5 rounded-2xl ${GLASS_TRACK} p-1.5 inline-flex flex-wrap gap-1`}>
            {[
              { key: "ALL", label: "All", title: "Every problem, in order" },
              { key: "TODO", label: "To do", title: "Only what's left" },
              { key: "Starred", label: "★", title: "Starred" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                title={tab.title}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  filter === tab.key
                    ? `bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 ${SEGMENT_ON}`
                    : `text-gray-600 dark:text-gray-400 hover:bg-white/70 dark:hover:bg-white/[0.06] hover:text-orange-600 dark:hover:text-orange-300 ${SEGMENT_OFF}`
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Tier cards ── */}
          {visibleTiers.length === 0 ? (
            <div className={`rounded-2xl ${CARD} py-14 text-center`}>
              <p className="text-sm text-gray-400 dark:text-gray-500">
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

          <p className="mt-5 px-1 text-[11px] leading-relaxed text-gray-400 dark:text-gray-500 light:text-slate-400">
            {HLD_EVIDENCE.summary}
          </p>
        </div>
      </div>
    </PageShell>
  );
};

function StatPill({ label, value, sub, accent = "text-gray-800 dark:text-gray-100 light:text-slate-900" }) {
  return (
    <div className="hidden sm:block text-right px-3 py-1.5 rounded-xl bg-white/50 dark:bg-white/[0.04] border border-white/60 dark:border-white/[0.06] light:bg-slate-50 light:border-slate-900/[0.06]">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 light:text-slate-500">{label}</p>
      <p className={`text-base font-extrabold leading-tight ${accent}`}>
        {value}
        {sub && <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">{sub}</span>}
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
    <div className={`rounded-2xl ${CARD} overflow-hidden`}>
      <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5">
        <span className={`w-2 h-2 rounded-full shrink-0 ${accent.dot} shadow-[0_0_10px_2px] ${accent.ring} ${accent.halo}`} />
        <div className="flex-1 min-w-0 flex items-baseline gap-2">
          <h2 className="text-[13.5px] font-bold text-gray-700 dark:text-gray-200 light:text-slate-900 light:font-semibold truncate">{tier.title}</h2>
          <span className="hidden sm:inline text-[11px] font-medium text-gray-400 dark:text-gray-500 light:text-slate-400 truncate">{tier.blurb}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${prio.cls}`} title={prio.blurb}>
            {prio.label}
          </span>
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 light:text-slate-500 tabular-nums">{n}/{all.length}</span>
          <div className="w-16 sm:w-24 h-1.5 rounded-full bg-gray-200/70 dark:bg-white/10 light:bg-slate-900/[0.06] overflow-hidden">
            <div className={`h-full rounded-full bg-gradient-to-r ${accent.bar}`} style={{ width: `${pct}%`, transition: "width 0.4s ease" }} />
          </div>
        </div>
      </div>

      <div className="border-t border-white/60 dark:border-white/[0.06] light:border-slate-900/[0.06] light:bg-slate-50/60 px-2 sm:px-3 py-3 space-y-2">
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
        className={`group flex items-center gap-2.5 rounded-xl px-3 py-2.5 cursor-pointer transition-all ${
          isDone
            ? "bg-emerald-500/10 dark:bg-emerald-500/[0.07] border border-emerald-500/30 dark:border-emerald-500/20 light:bg-emerald-50/60 light:border-emerald-600/[0.14]"
            : `${ROW} hover:border-orange-400/60 dark:hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/5 light:shadow-[0_1px_1px_rgba(15,23,42,0.03)] light:hover:border-slate-900/[0.14] light:hover:shadow-[0_4px_12px_-4px_rgba(15,23,42,0.10)]`
        } ${isNext ? "ring-1 ring-orange-400/60 dark:ring-orange-500/40 light:ring-orange-500/30 light:border-orange-500/40" : ""}`}
      >
        {/* Rank: the order to study them in */}
        <span
          className="w-6 text-right text-[11px] font-extrabold tabular-nums text-gray-400 dark:text-gray-500 light:text-slate-400 shrink-0"
          title={`#${problem.rank} of ${HLD_PROBLEMS.length}`}
        >
          {problem.rank}
        </span>

        {/* Title, plus the names it is also asked under */}
        <span className="flex items-baseline gap-2 flex-1 min-w-0">
          <span className={`text-[13px] font-semibold truncate ${isDone ? "text-gray-400 dark:text-gray-500 light:text-slate-400 line-through decoration-1" : "text-gray-800 dark:text-gray-100 light:text-slate-900 light:font-medium"}`}>
            {problem.title}
          </span>
          {problem.askedAs.length > 0 && (
            <span
              className="hidden lg:inline text-[10px] font-semibold text-gray-400 dark:text-gray-500 light:text-slate-400 light:font-medium truncate"
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
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-300 font-bold whitespace-nowrap border border-orange-500/30 light:bg-orange-50 light:text-orange-700 light:border-orange-600/15"
            >
              Next
            </span>
          )}

          {doneLabel && (
            <span
              title={`You finished this ${doneLabel}`}
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold whitespace-nowrap border border-emerald-500/25 light:bg-emerald-50 light:border-emerald-600/15"
            >
              ✓ {doneLabel}
            </span>
          )}

          <a
            href={problem.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md bg-white/60 dark:bg-white/[0.05] border border-gray-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-orange-400 hover:text-orange-600 dark:hover:text-orange-300 ${LIGHT_BUTTON} transition-all`}
            title="Open the breakdown on HelloInterview"
          >
            <span className="hidden sm:inline">Breakdown</span>
            <span className="sm:hidden">HI</span>
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 12 12"><path d="M3.5 8.5l5-5M4.5 3.5h4v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </a>

          <button
            onClick={(e) => { e.stopPropagation(); onToggleStar(problem.id); }}
            title={isStarred ? "Unstar" : "Star"}
            className={`text-lg leading-none transition-transform hover:scale-110 ${isStarred ? "text-yellow-400 light:text-amber-400" : "text-gray-300 dark:text-slate-600 hover:text-yellow-400 light:text-slate-300 light:hover:text-amber-400"}`}
          >
            {isStarred ? "★" : "☆"}
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onToggleDone(problem.id, !isDone); }}
            title={isDone ? "Mark not done" : "Mark done"}
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${isDone ? "bg-emerald-500 border-emerald-500 shadow-md shadow-emerald-500/30 light:shadow-[0_1px_2px_rgba(5,150,105,0.3)]" : "border-gray-300 dark:border-slate-600 hover:border-emerald-400 light:border-slate-300 light:bg-white"}`}
          >
            {isDone && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            )}
          </button>

          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-gray-400 dark:text-gray-500 light:text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="mx-1 mt-2 mb-1 rounded-xl border border-gray-200/90 dark:border-white/[0.07] bg-white/60 dark:bg-white/[0.03] light:bg-white light:border-slate-900/[0.07] light:shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-3.5 space-y-3">
              <Detail label="What it tests">
                <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300 light:text-slate-700">{problem.tests}</p>
              </Detail>
              {problem.askedAs.length > 0 && (
                <Detail label="Also asked as">
                  <div className="flex flex-wrap gap-1.5">
                    {problem.askedAs.map((a) => (
                      <span key={a} className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/70 dark:bg-white/[0.05] border border-gray-200/80 dark:border-white/10 text-gray-600 dark:text-gray-300 light:bg-slate-50 light:border-slate-900/[0.07] light:text-slate-600">
                        {a}
                      </span>
                    ))}
                  </div>
                </Detail>
              )}
              <Detail label="Why this rank">
                <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300 light:text-slate-700">
                  Named in <b>{problem.seen.mid}</b> SDE2-level interview reports ({problem.seen.mid2025} since 2025) and{" "}
                  <b>{problem.seen.all}</b> reports at any level, out of {HLD_EVIDENCE.midPosts} and {HLD_EVIDENCE.posts} on LeetCode Discuss.
                  {problem.lists != null && <> On {problem.lists} of 11 published "most asked" lists.</>}
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
      <h5 className="mb-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
        <span className="w-1 h-3.5 rounded-full bg-gradient-to-b from-orange-400 to-amber-400" />
        {label}
      </h5>
      {children}
    </div>
  );
}

export default HLDPrep;
