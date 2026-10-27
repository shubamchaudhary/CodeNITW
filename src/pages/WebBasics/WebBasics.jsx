import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MarkdownPreview from "@uiw/react-markdown-preview";
import "@uiw/react-markdown-preview/markdown.css";
import "../Notes/notes.css";
import PageShell from "../../components/PageShell";
import PageSkeleton from "../../components/PageSkeleton";
import { GLASS, GLASS_PANEL, GLASS_TRACK, SEGMENT_ON, SEGMENT_OFF } from "../../components/glass";
import useIsDark from "../../hooks/useIsDark";
import { KEYS, loadJSON, setSourceComplete, subscribe } from "../../Data/planStore";
import { WEB_BASICS, parseQuestionBank } from "../../Data/WebBasics";

// JS · React · Node basics: one question bank per tech, in learning order.
// The HLD page's look — a card per module, a row per question — but a row
// opens onto its full answer, and the tick is per question. Ticks share one
// store across the three techs (ids are prefixed js/re/nd), synced like every
// other tick.
const banks = {};

function useBank(tech) {
  const [modules, setModules] = useState(() => banks[tech.key] || null);
  useEffect(() => {
    let live = true;
    if (banks[tech.key]) {
      setModules(banks[tech.key]);
      return undefined;
    }
    setModules(null);
    tech.load().then((m) => {
      banks[tech.key] = parseQuestionBank(m.default);
      if (live) setModules(banks[tech.key]);
    });
    return () => {
      live = false;
    };
  }, [tech]);
  return modules;
}

const hours = (min) => (min >= 60 ? `${(min / 60).toFixed(1)}h` : `${min}m`);

export default function WebBasics({ techKey }) {
  const tech = WEB_BASICS.find((t) => t.key === techKey) || WEB_BASICS[0];
  const modules = useBank(tech);
  const navigate = useNavigate();
  const colorMode = useIsDark() ? "dark" : "light";

  const [done, setDone] = useState(() => loadJSON(KEYS.WB_COMPLETED, {}));
  const [filter, setFilter] = useState("ALL");
  const [open, setOpen] = useState(() => new Set());

  useEffect(
    () =>
      subscribe((key) => {
        if (key === KEYS.WB_COMPLETED) setDone(loadJSON(KEYS.WB_COMPLETED, {}));
      }),
    []
  );

  // A new tech starts with every answer closed.
  useEffect(() => setOpen(new Set()), [techKey]);

  const all = useMemo(() => (modules || []).flatMap((m) => m.questions), [modules]);
  const nextId = useMemo(() => (all.find((q) => !done[q.id]) || {}).id, [all, done]);

  const stats = useMemo(() => {
    const total = all.reduce((s, q) => s + q.minutes, 0);
    const left = all.filter((q) => !done[q.id]).reduce((s, q) => s + q.minutes, 0);
    const n = all.filter((q) => done[q.id]).length;
    return { n, count: all.length, total, left, pct: all.length ? Math.round((100 * n) / all.length) : 0 };
  }, [all, done]);

  const toggleDone = useCallback((id, value) => {
    setSourceComplete("webbasics", id, value);
    setDone((m) => ({ ...m, [id]: value }));
  }, []);

  const toggleOpen = useCallback((id) => {
    setOpen((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const jumpToNext = () => {
    if (!nextId) return;
    setFilter("ALL");
    setOpen((s) => new Set(s).add(nextId));
    setTimeout(() => document.getElementById(`q-${nextId}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  };

  if (!modules) return <PageSkeleton />;

  const visible = modules
    .map((m, i) => ({ ...m, index: i + 1, shown: m.questions.filter((q) => filter === "ALL" || !done[q.id]) }))
    .filter((m) => m.shown.length);

  return (
    <PageShell>
      <div className="min-h-screen flex justify-center px-3">
        <div className="w-full sm:w-11/12 lg:w-5/6 xl:w-3/4 2xl:w-2/3">
          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`mt-6 mb-5 rounded-3xl ${GLASS} px-5 sm:px-7 py-5`}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-[26px] leading-none font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-slate-800 via-slate-700 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-400 light:bg-none light:text-slate-900">
                    {tech.label}
                  </h1>
                  <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-sky-500/10 dark:bg-sky-400/10 text-sky-600 dark:text-sky-300 border border-sky-500/25 dark:border-sky-400/25 light:bg-sky-50 light:text-sky-700 light:border-sky-600/15">
                    {stats.count} questions · {hours(stats.total)}
                  </span>
                </div>
                <p className="mt-2 text-[12.5px] text-gray-500 dark:text-gray-400 light:text-slate-500">
                  Interview basics, in learning order. Say the answer out loud before you open it.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <StatPill label="Done" value={`${stats.n}`} sub={`/${stats.count}`} />
                <StatPill label="Left" value={hours(stats.left)} />
                <div className="relative w-16 h-16 shrink-0">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="currentColor" className="text-gray-200/80 dark:text-white/10 light:text-slate-900/[0.06]" strokeWidth="5" />
                    <circle
                      cx="28" cy="28" r="22" fill="none" stroke="url(#wbProgressGrad)" strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 22}`}
                      strokeDashoffset={`${2 * Math.PI * 22 * (1 - stats.pct / 100)}`}
                      style={{ transition: "stroke-dashoffset 0.5s ease" }}
                    />
                    <defs>
                      <linearGradient id="wbProgressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0ea5e9" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-sky-600 dark:text-sky-400">{stats.pct}%</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Tech tabs + filter ── */}
          <div className="mb-5 flex flex-wrap items-center gap-2.5">
            <div className={`rounded-2xl ${GLASS_TRACK} p-1.5 inline-flex flex-wrap gap-1`}>
              {WEB_BASICS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => navigate(t.path)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    t.key === tech.key
                      ? `bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-lg shadow-sky-500/30 ${SEGMENT_ON}`
                      : `text-gray-600 dark:text-gray-400 hover:bg-white/70 dark:hover:bg-white/[0.06] hover:text-sky-600 dark:hover:text-sky-300 ${SEGMENT_OFF}`
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className={`rounded-2xl ${GLASS_TRACK} p-1.5 inline-flex gap-1`}>
              {[
                { key: "ALL", label: "All" },
                { key: "TODO", label: "To do" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    filter === f.key
                      ? `bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-lg shadow-sky-500/30 ${SEGMENT_ON}`
                      : `text-gray-600 dark:text-gray-400 hover:bg-white/70 dark:hover:bg-white/[0.06] ${SEGMENT_OFF}`
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {nextId && (
              <button
                onClick={jumpToNext}
                className="px-3.5 py-2 text-xs font-bold rounded-xl border border-sky-500/30 text-sky-600 dark:text-sky-300 bg-sky-500/10 hover:bg-sky-500/15 light:bg-sky-50 light:text-sky-700"
              >
                Continue →
              </button>
            )}
          </div>

          {/* ── Modules ── */}
          {visible.length === 0 ? (
            <div className={`rounded-2xl ${GLASS} py-14 text-center`}>
              <p className="text-sm text-gray-400 dark:text-gray-500">All done — every question here is ticked.</p>
            </div>
          ) : (
            <div className="space-y-2.5 pb-10">
              {visible.map((m) => (
                <ModuleCard
                  key={m.title}
                  index={m.index}
                  module={m}
                  done={done}
                  nextId={nextId}
                  open={open}
                  colorMode={colorMode}
                  onToggleDone={toggleDone}
                  onToggleOpen={toggleOpen}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function StatPill({ label, value, sub }) {
  return (
    <div className="hidden sm:block text-right px-3 py-1.5 rounded-xl bg-white/50 dark:bg-white/[0.04] border border-white/60 dark:border-white/[0.06] light:bg-slate-50 light:border-slate-900/[0.06]">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 light:text-slate-500">{label}</p>
      <p className="text-base font-extrabold leading-tight text-gray-800 dark:text-gray-100 light:text-slate-900">
        {value}
        {sub && <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">{sub}</span>}
      </p>
    </div>
  );
}

function ModuleCard({ index, module, done, nextId, open, colorMode, onToggleDone, onToggleOpen }) {
  const n = module.questions.filter((q) => done[q.id]).length;
  const pct = (100 * n) / module.questions.length;
  const minutes = module.questions.reduce((s, q) => s + q.minutes, 0);

  return (
    <div className={`rounded-2xl ${GLASS} overflow-hidden`}>
      <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5">
        <span className="w-6 h-6 rounded-full shrink-0 bg-sky-500/15 text-sky-700 dark:text-sky-300 text-[11px] font-extrabold flex items-center justify-center">
          {index}
        </span>
        <h2 className="flex-1 min-w-0 text-[13.5px] font-bold text-gray-700 dark:text-gray-200 light:text-slate-900 light:font-semibold truncate">
          {module.title}
        </h2>
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:inline text-[11px] font-medium text-gray-400 dark:text-gray-500">{hours(minutes)}</span>
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 light:text-slate-500 tabular-nums">
            {n}/{module.questions.length}
          </span>
          <div className="w-16 sm:w-24 h-1.5 rounded-full bg-gray-200/70 dark:bg-white/10 light:bg-slate-900/[0.06] overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-400" style={{ width: `${pct}%`, transition: "width 0.4s ease" }} />
          </div>
        </div>
      </div>

      <div className="border-t border-white/60 dark:border-white/[0.06] light:border-slate-900/[0.06] light:bg-slate-50/60 px-2 sm:px-3 py-3 space-y-2">
        {module.shown.map((q) => (
          <QuestionRow
            key={q.id}
            q={q}
            isDone={!!done[q.id]}
            isNext={q.id === nextId}
            isOpen={open.has(q.id)}
            colorMode={colorMode}
            onToggleDone={onToggleDone}
            onToggleOpen={onToggleOpen}
          />
        ))}
      </div>
    </div>
  );
}

const QuestionRow = memo(function QuestionRow({ q, isDone, isNext, isOpen, colorMode, onToggleDone, onToggleOpen }) {
  return (
    <div id={`q-${q.id}`} className="scroll-mt-24">
      <div
        onClick={() => onToggleOpen(q.id)}
        className={`group flex items-center gap-2.5 rounded-xl px-3 py-2.5 cursor-pointer transition-all ${
          isDone
            ? "bg-emerald-500/10 dark:bg-emerald-500/[0.07] border border-emerald-500/30 dark:border-emerald-500/20 light:bg-emerald-50/60 light:border-emerald-600/[0.14]"
            : `${GLASS_PANEL} hover:border-sky-400/60 dark:hover:border-sky-500/40 light:hover:border-slate-900/[0.14]`
        } ${isNext ? "ring-1 ring-sky-400/60 dark:ring-sky-500/40 light:ring-sky-500/30" : ""}`}
      >
        <span className="w-7 text-right text-[11px] font-extrabold tabular-nums text-gray-400 dark:text-gray-500 light:text-slate-400 shrink-0">
          {q.number}
        </span>
        <span
          className={`flex-1 min-w-0 text-[13px] font-semibold ${
            isDone ? "text-gray-400 dark:text-gray-500 light:text-slate-400 line-through decoration-1" : "text-gray-800 dark:text-gray-100 light:text-slate-900 light:font-medium"
          }`}
        >
          {q.question}
        </span>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {isNext && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-300 font-bold border border-sky-500/30 light:bg-sky-50 light:text-sky-700">
              Next
            </span>
          )}
          <span className="hidden sm:inline text-[10.5px] font-semibold text-gray-400 dark:text-gray-500 tabular-nums w-8 text-right">{q.minutes}m</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleDone(q.id, !isDone);
            }}
            title={isDone ? "Mark not done" : "Mark done"}
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
              isDone
                ? "bg-emerald-500 border-emerald-500 shadow-md shadow-emerald-500/30"
                : "border-gray-300 dark:border-slate-600 hover:border-emerald-400 light:border-slate-300 light:bg-white"
            }`}
          >
            {isDone && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-gray-400 dark:text-gray-500 light:text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mx-1 mt-2 mb-1 rounded-xl border border-gray-200/90 dark:border-white/[0.07] bg-white/60 dark:bg-white/[0.03] light:bg-white light:border-slate-900/[0.07] px-4 sm:px-5 py-4">
              <div className="note-md" data-color-mode={colorMode} style={{ "--note-fs": "15px" }}>
                <MarkdownPreview source={q.answer} style={{ background: "transparent" }} wrapperElement={{ "data-color-mode": colorMode }} />
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    if (!isDone) onToggleDone(q.id, true);
                    onToggleOpen(q.id);
                  }}
                  className="h-8 px-3 rounded-lg text-[12.5px] font-semibold border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/15"
                >
                  {isDone ? "Close" : "Got it — mark done"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
