import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { toast } from "react-toastify";
import { requireAuth } from "../Data/authGate";
import { GLASS } from "./glass";
import PageShell from "./PageShell";
import {
  KEYS,
  loadJSON,
  setSourceComplete,
  setSourceNote,
  subscribe,
  dateKey,
  getDay,
  addToPlanDay,
  removeFromPlanDay,
} from "../Data/planStore";

// The study board behind Core Stack and AI Stack: a filterable list of topic
// cards, each with a tick (and how long ago it was ticked), a notes-bearing
// detail panel and a one-click push onto today's plan. Everything that differs
// between the two boards — palette, badges, sections, detail body — arrives as
// props, so a change to the layout lands on both pages at once.
//
// It follows the DSA board's shape deliberately: same glass surfaces, same
// header ring, same expand behaviour, so the three prep pages read as one app.

// One accent per card, cycled — the coloured dot that gives the list its rhythm.
const ACCENTS = [
  { dot: "bg-emerald-500", ring: "shadow-emerald-500/40" },
  { dot: "bg-teal-500", ring: "shadow-teal-500/40" },
  { dot: "bg-sky-500", ring: "shadow-sky-500/40" },
  { dot: "bg-violet-500", ring: "shadow-violet-500/40" },
  { dot: "bg-indigo-500", ring: "shadow-indigo-500/40" },
  { dot: "bg-cyan-500", ring: "shadow-cyan-500/40" },
];

export default function TopicBoard({
  source,          // planStore source key: "corestack" | "aistack"
  storeKeys,       // { completed, notes, timestamps }
  daysSinceChecked,// (id) => number | null
  planItem,        // (topic) => plan item for today's plan
  title,           // page title
  headBadge,       // short string beside the title
  accent,          // palette, see the pages for the shape
  sections,        // [{ key, label, topics }] in display order
  filters,         // [{ key, label, title }] — "ALL" plus whatever the page wants
  matchFilter,     // (topic, filterKey) => boolean
  badgeOf,         // (topic) => { label, cls, title }
  metaOf,          // (topic) => string under the title
  renderDetail,    // (topic, { note, onNoteChange, checkedDays }) => node
  footer,          // optional node below the list (shown on the ALL filter)
}) {
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), () => setAuthReady(true));
    return unsubscribe;
  }, []);

  const [checked, setChecked] = useState(() => loadJSON(storeKeys.completed, {}));
  const [notes, setNotes] = useState(() => loadJSON(storeKeys.notes, {}));
  // Bumped whenever a tick changes, so the "Nd ago" labels re-read their stamps.
  const [stampRev, setStampRev] = useState(0);
  const [openTopicId, setOpenTopicId] = useState(null);
  const [filter, setFilter] = useState("ALL");

  // Which topics are already on today's plan — drives the ⊕ Today toggle.
  const today = dateKey();
  const readPlanned = useCallback(
    () => new Set(getDay(today).filter((i) => i.source === source).map((i) => i.refId)),
    [today, source]
  );
  const [plannedToday, setPlannedToday] = useState(readPlanned);

  // Stay in sync with the Planning page and with another device's cloud push.
  useEffect(
    () =>
      subscribe((key) => {
        if (key === storeKeys.completed) setChecked(loadJSON(storeKeys.completed, {}));
        if (key === storeKeys.notes) setNotes(loadJSON(storeKeys.notes, {}));
        if (key === storeKeys.timestamps) setStampRev((n) => n + 1);
        if (key === KEYS.PLAN_DAYS) setPlannedToday(readPlanned());
      }),
    [readPlanned, storeKeys]
  );

  const allTopics = useMemo(() => sections.flatMap((s) => s.topics), [sections]);

  const visibleSections = useMemo(() => {
    if (filter === "ALL") return sections.filter((s) => s.topics.length);
    return sections
      .map((s) => ({ ...s, topics: s.topics.filter((t) => matchFilter(t, filter)) }))
      .filter((s) => s.topics.length);
  }, [sections, filter, matchFilter]);

  const visibleTopics = useMemo(
    () => visibleSections.flatMap((s) => s.topics),
    [visibleSections]
  );

  // Age of every tick, recomputed when a tick changes rather than per render, so
  // the "Nd ago" badges stay in step with the timestamp store.
  const checkedAges = useMemo(() => {
    const out = {};
    allTopics.forEach((t) => {
      if (checked[t.id]) out[t.id] = daysSinceChecked(t.id);
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTopics, checked, stampRev]);

  // Header stats follow the active filter, so the ring always describes the set
  // you are actually looking at rather than the whole list.
  const scoped = useMemo(() => {
    const done = visibleTopics.filter((t) => checked[t.id]).length;
    return {
      total: visibleTopics.length,
      done,
      pct: visibleTopics.length ? Math.round((100 * done) / visibleTopics.length) : 0,
    };
  }, [visibleTopics, checked]);

  const toggleChecked = useCallback(
    (id, value) => {
      setSourceComplete(source, id, value);
      setChecked((m) => ({ ...m, [id]: value }));
      setStampRev((n) => n + 1);
    },
    [source]
  );

  const saveNote = useCallback(
    (id, val) => {
      setSourceNote(source, id, val);
      setNotes((m) => ({ ...m, [id]: val }));
    },
    [source]
  );

  const togglePlannedToday = useCallback(
    (topic) => {
      if (!requireAuth("Sign in to plan your day — your plan is saved to your account.")) return;
      if (plannedToday.has(topic.id)) {
        removeFromPlanDay(today, source, topic.id);
        toast.info(`Removed "${topic.title}" from today's plan`);
      } else {
        addToPlanDay(today, planItem(topic));
        toast.success(`Added "${topic.title}" to today's plan`);
      }
      setPlannedToday(readPlanned());
    },
    [plannedToday, today, source, planItem, readPlanned]
  );

  if (!authReady) return null;

  let cardIndex = 0;

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
                  <h1 className="text-[26px] leading-none font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-slate-800 via-slate-700 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-400">
                    {title}
                  </h1>
                  <span className={`px-2.5 py-1 text-[12px] font-bold rounded-full backdrop-blur-sm ${accent.headBadge}`}>
                    {headBadge}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <StatPill label="Done" value={`${scoped.done}`} sub={`/${scoped.total}`} />
                <div className="relative w-16 h-16 shrink-0">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="currentColor" className="text-gray-200/80 dark:text-white/10" strokeWidth="5" />
                    <circle cx="28" cy="28" r="22" fill="none" stroke={`url(#${accent.gradId})`} strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 22}`}
                      strokeDashoffset={`${2 * Math.PI * 22 * (1 - scoped.pct / 100)}`}
                      style={{ transition: "stroke-dashoffset 0.5s ease" }} />
                    <defs>
                      <linearGradient id={accent.gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={accent.ringFrom} />
                        <stop offset="100%" stopColor={accent.ringTo} />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className={`absolute inset-0 flex items-center justify-center text-xs font-extrabold ${accent.pctText}`}>{scoped.pct}%</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Filter ── */}
          <div className={`mb-5 rounded-2xl ${GLASS} p-1.5 inline-flex flex-wrap gap-1`}>
            {filters.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                title={tab.title}
                className={`px-4 py-1.5 text-[13px] font-bold rounded-xl transition-all ${
                  filter === tab.key
                    ? accent.chipActive
                    : `text-gray-600 dark:text-gray-400 hover:bg-white/70 dark:hover:bg-white/[0.06] ${accent.chipHover}`
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Sections ── */}
          {visibleSections.length === 0 ? (
            <div className={`rounded-2xl ${GLASS} py-14 text-center`}>
              <p className="text-sm text-gray-400 dark:text-gray-500">No topics match this filter.</p>
            </div>
          ) : (
            visibleSections.map((section) => {
              const done = section.topics.filter((t) => checked[t.id]).length;
              return (
                <div key={section.key} className="mb-6">
                  <div className="flex items-center gap-3 mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-6 rounded-full bg-gradient-to-b ${accent.sectionBar}`} />
                      <h2 className="text-[15px] font-bold text-gray-700 dark:text-gray-300">{section.label}</h2>
                    </div>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
                    <span className="text-[13px] text-gray-400 dark:text-gray-500">{done}/{section.topics.length} done</span>
                  </div>

                  <div className="space-y-2.5">
                    {section.topics.map((topic) => {
                      const accentDot = ACCENTS[cardIndex++ % ACCENTS.length];
                      return (
                        <TopicCard
                          key={topic.id}
                          topic={topic}
                          dot={accentDot}
                          accent={accent}
                          badge={badgeOf(topic)}
                          meta={metaOf(topic)}
                          isOpen={openTopicId === topic.id}
                          onToggleOpen={() => setOpenTopicId((p) => (p === topic.id ? null : topic.id))}
                          isChecked={!!checked[topic.id]}
                          checkedDays={checked[topic.id] ? checkedAges[topic.id] ?? null : null}
                          note={notes[topic.id] || ""}
                          isPlanned={plannedToday.has(topic.id)}
                          onToggleChecked={toggleChecked}
                          onNoteChange={saveNote}
                          onTogglePlanned={togglePlannedToday}
                          renderDetail={renderDetail}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

          {filter === "ALL" && footer}
        </div>
      </div>
    </PageShell>
  );
}

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

function TopicCard({
  topic,
  dot,
  accent,
  badge,
  meta,
  isOpen,
  onToggleOpen,
  isChecked,
  checkedDays,
  note,
  isPlanned,
  onToggleChecked,
  onNoteChange,
  onTogglePlanned,
  renderDetail,
}) {
  const checkedLabel =
    checkedDays == null ? null : checkedDays === 0 ? "today" : checkedDays === 1 ? "1d ago" : `${checkedDays}d ago`;

  return (
    <div
      className={`rounded-2xl ${GLASS} overflow-hidden transition-all ${
        isChecked ? accent.cardChecked : "hover:border-white/90 dark:hover:border-white/[0.14]"
      } ${isPlanned && !isChecked ? "ring-1 ring-sky-400/50 dark:ring-sky-500/40" : ""}`}
    >
      <div className="flex items-center gap-2.5 sm:gap-3 px-4 sm:px-5 py-3.5 cursor-pointer select-none" onClick={onToggleOpen}>
        <span className={`w-2 h-2 rounded-full shrink-0 ${dot.dot} shadow-[0_0_10px_2px] ${dot.ring}`} />

        {badge && (
          <span
            className={`text-[11px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0 border ${badge.cls}`}
            title={badge.title}
          >
            {badge.label}
          </span>
        )}

        <div className="flex-1 min-w-0">
          <h2
            className={`text-[15px] font-bold truncate ${
              isChecked ? "text-gray-400 dark:text-gray-500 line-through decoration-1" : "text-gray-700 dark:text-gray-200"
            }`}
          >
            {topic.title}
          </h2>
          <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">{meta}</p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {note && <span title="Has notes" className="text-blue-400 dark:text-blue-500 text-sm hidden sm:inline">✎</span>}

          {checkedLabel && (
            <span
              title={`You checked this off ${checkedLabel === "today" ? "today" : checkedLabel}`}
              className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap border ${accent.checkedBadge}`}
            >
              ✓ {checkedLabel}
            </span>
          )}

          {/* Add / remove from today's plan — mirrors straight into Planning */}
          <button
            onClick={() => onTogglePlanned(topic)}
            title={isPlanned ? "Remove from today's plan" : "Add to today's plan"}
            className={`inline-flex items-center gap-1 text-[12px] font-bold px-2 py-1 rounded-md border transition-all ${
              isPlanned
                ? "bg-sky-500 border-sky-500 text-white shadow-md shadow-sky-500/30"
                : "bg-white/60 dark:bg-white/[0.05] border-gray-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-sky-400 hover:text-sky-600 dark:hover:text-sky-300"
            }`}
          >
            {isPlanned ? "◉" : "⊕"}
            <span className="hidden sm:inline">Today</span>
          </button>

          <button
            onClick={() => onToggleChecked(topic.id, !isChecked)}
            title={isChecked ? "Uncheck" : "Mark as done"}
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
              isChecked ? accent.checkbox : `border-gray-300 dark:border-slate-600 ${accent.checkboxHover}`
            }`}
          >
            {isChecked && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            )}
          </button>

          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-gray-400 dark:text-gray-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="border-t border-white/60 dark:border-white/[0.06] px-3 sm:px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
              {renderDetail(topic, {
                note,
                onNoteChange: (val) => onNoteChange(topic.id, val),
                checkedDays,
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
