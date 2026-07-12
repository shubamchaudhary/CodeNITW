import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { CATEGORY_CONFIG } from "../../Data/JobHuntPlan";
import { DSA_DIFFICULTY_CONFIG } from "../../Data/DSAPrep";
import { InterviewCardDetail, DsaProblemDetail } from "../../components/cardDetails";
import { GLASS } from "../../components/glass";
import {
  INTERVIEW_CARDS,
  DSA_PROBLEMS,
  KEYS,
  loadJSON,
  saveJSON,
  setSourceComplete,
  setSourceNote,
  getInterviewCard,
  getDsaProblem,
  setDsaStarred,
  dsaDaysLeft,
  getDay,
  setDay,
  getAllDayKeys,
  pruneExpiredDsaSolves,
  dateKey,
  addDays,
  prettyDate,
  relativeLabel,
  subscribe,
} from "../../Data/planStore";

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function fmt(min) {
  if (!min) return "";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function fmtClock(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function buildSessions(totalMin) {
  if (!totalMin || totalMin <= 0) return [];
  const n = Math.max(1, Math.round(totalMin / 30));
  if (n === 1) return [{ type: "work", duration: totalMin * 60 }];
  const breakTime = (n - 1) * 5;
  const workPerSession = (totalMin - breakTime) / n;
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({ type: "work", duration: Math.round(workPerSession * 60) });
    if (i < n - 1) out.push({ type: "break", duration: 300 });
  }
  return out;
}

function itemTotalMinutes(item) {
  const subs = item.subItems || [];
  if (subs.length > 0) return subs.reduce((s, sub) => s + (sub.estimatedMinutes || 0), 0);
  return item.estimatedMinutes || 0;
}

function itemDoneMinutes(item) {
  const subs = item.subItems || [];
  if (subs.length > 0) return subs.filter((s) => s.completed).reduce((s, sub) => s + (sub.actualMinutes ?? sub.estimatedMinutes ?? 0), 0);
  return 0;
}

function pomoElapsedWorkMinutes(p) {
  if (!p) return 0;
  let sec = 0;
  for (let i = 0; i < p.currentIdx; i++) {
    if (p.sessions[i].type === "work") sec += p.sessions[i].duration;
  }
  const cur = p.sessions[p.currentIdx];
  if (cur?.type === "work") sec += cur.duration - p.remaining;
  return Math.max(1, Math.ceil(sec / 60));
}

function catchUpPomo(saved) {
  if (!saved) return null;
  if (saved.status !== "running") return saved;
  let elapsed = Math.floor((Date.now() - (saved.updatedAt || Date.now())) / 1000);
  if (elapsed <= 0) return saved;
  let idx = saved.currentIdx;
  let remaining = saved.remaining;
  while (elapsed > 0) {
    if (elapsed < remaining) {
      remaining -= elapsed;
      elapsed = 0;
    } else {
      elapsed -= remaining;
      const nextIdx = idx + 1;
      if (nextIdx >= saved.sessions.length) {
        return { ...saved, currentIdx: idx, remaining: 0, status: "complete" };
      }
      idx = nextIdx;
      remaining = saved.sessions[idx].duration;
    }
  }
  return { ...saved, currentIdx: idx, remaining };
}

function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const configs = {
      focusStart: { tones: [440, 660], gap: 0.12, gain: 0.18, decay: 0.35, wave: "triangle" },
      breakStart: { tones: [660, 440], gap: 0.15, gain: 0.15, decay: 0.4, wave: "sine" },
      transition: { tones: [680, 880], gap: 0.15, gain: 0.2, decay: 0.4, wave: "triangle" },
      timerDone: { tones: [523, 659, 784], gap: 0.2, gain: 0.22, decay: 0.5, wave: "triangle" },
      taskDone: { tones: [800, 1200], gap: 0.08, gain: 0.12, decay: 0.2, wave: "sine" },
    };
    const c = configs[type] || configs.transition;
    c.tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g);
      g.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = c.wave;
      g.gain.value = 0;
      g.gain.linearRampToValueAtTime(c.gain, now + i * c.gap + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * c.gap + c.decay);
      osc.start(now + i * c.gap);
      osc.stop(now + i * c.gap + c.decay);
    });
  } catch (_) {}
}

const SOURCE_META = {
  interview: { label: "Topic", badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300", border: "border-l-indigo-400" },
  dsa: { label: "DSA", badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300", border: "border-l-orange-400" },
  custom: { label: "Custom", badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300", border: "border-l-violet-400" },
};

const WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// ─── Calendar Picker ─────────────────────────────────────────────────────────
function CalendarPicker({ current, today, planDays, onSelect, onClose }) {
  const ref = useRef(null);
  const [view, setView] = useState(() => {
    const [y, m] = current.split("-").map(Number);
    return { year: y, month: m - 1 };
  });

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const { year, month } = view;
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: first }, () => null).concat(Array.from({ length: days }, (_, i) => i + 1));
  const label = new Date(year, month).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const prev = () => setView((v) => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 });
  const next = () => setView((v) => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 w-72 rounded-2xl border border-gray-200/70 dark:border-slate-700/60 bg-white dark:bg-slate-800 shadow-2xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold">‹</button>
        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{label}</span>
        <button onClick={next} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold">›</button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {WEEK.map((d) => (
          <span key={d} className="text-[10px] font-bold text-gray-400 dark:text-gray-500 py-1">{d}</span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={`e${i}`} />;
          const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const isT = key === today;
          const isSel = key === current;
          const has = planDays.has(key);
          return (
            <button
              key={i}
              onClick={() => { onSelect(key); onClose(); }}
              className={`relative w-9 h-9 mx-auto rounded-xl text-xs font-semibold transition-all ${
                isSel
                  ? "bg-violet-600 text-white shadow-md"
                  : isT
                  ? "ring-2 ring-violet-400 text-violet-600 dark:text-violet-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
              }`}
            >
              {d}
              {has && !isSel && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-400" />}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Pomodoro Timer ──────────────────────────────────────────────────────────
const R = 80;
const CIRC = 2 * Math.PI * R;
const TICK_COUNT = 60;
const TICK_R_OUTER = 92;
const TICK_R_INNER_MAJOR = 85;
const TICK_R_INNER_MINOR = 88;

function PomodoroTimer({ pomo, onPause, onResume, onStop, onDismiss, onExtend }) {
  const [extendVal, setExtendVal] = useState("");
  if (!pomo) return null;
  const { sessions, currentIdx, remaining, status } = pomo;
  const session = sessions[currentIdx];
  const progress = session ? (session.duration - remaining) / session.duration : 1;
  const isWork = session?.type === "work";
  const isComplete = status === "complete";
  const isPaused = status === "paused";

  const workIdx = sessions.slice(0, currentIdx + 1).filter((s) => s.type === "work").length;
  const totalWork = sessions.filter((s) => s.type === "work").length;

  const ringColor = isComplete
    ? "#22c55e"
    : isPaused
    ? "#64748b"
    : isWork
    ? "url(#pomoFocus)"
    : "url(#pomoBreak)";

  const glowColor = isComplete ? "rgba(34,197,94,0.15)" : isWork ? "rgba(139,92,246,0.12)" : "rgba(52,211,153,0.12)";

  const ticks = useMemo(() => {
    const out = [];
    for (let i = 0; i < TICK_COUNT; i++) {
      const angle = (i / TICK_COUNT) * 360 - 90;
      const rad = (angle * Math.PI) / 180;
      const major = i % 5 === 0;
      const rInner = major ? TICK_R_INNER_MAJOR : TICK_R_INNER_MINOR;
      out.push({
        x1: 100 + Math.cos(rad) * rInner,
        y1: 100 + Math.sin(rad) * rInner,
        x2: 100 + Math.cos(rad) * TICK_R_OUTER,
        y2: 100 + Math.sin(rad) * TICK_R_OUTER,
        major,
      });
    }
    return out;
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className={`rounded-2xl ${GLASS} p-6 mb-4 relative overflow-hidden`}
    >
      <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ boxShadow: `inset 0 0 80px ${glowColor}` }} />
      <div className="flex flex-col items-center relative z-10">
        <div className="relative">
          <svg viewBox="0 0 200 200" className="w-48 h-48 sm:w-56 sm:h-56">
            <defs>
              <linearGradient id="pomoFocus" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="50%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
              <linearGradient id="pomoBreak" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="50%" stopColor="#6ee7b7" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
              <filter id="pomoGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {ticks.map((t, i) => (
              <line
                key={i}
                x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                stroke="currentColor"
                className={t.major ? "text-gray-300 dark:text-slate-600" : "text-gray-200 dark:text-slate-700"}
                strokeWidth={t.major ? 1.5 : 0.7}
                strokeLinecap="round"
              />
            ))}
            <circle cx="100" cy="100" r={R} fill="none" stroke="currentColor" className="text-gray-200/50 dark:text-slate-700/50" strokeWidth="6" />
            <motion.circle
              cx="100" cy="100" r={R} fill="none" stroke={ringColor} strokeWidth="7" strokeLinecap="round"
              strokeDasharray={CIRC}
              initial={false}
              animate={{ strokeDashoffset: CIRC * (1 - progress) }}
              transition={{ duration: 0.4, ease: "linear" }}
              style={{ transformOrigin: "100px 100px", transform: "rotate(-90deg)" }}
              filter={isPaused ? undefined : "url(#pomoGlow)"}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isComplete ? (
              <>
                <svg className="w-10 h-10 text-green-500 mb-1" fill="none" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span className="text-sm font-bold text-green-500">Complete!</span>
              </>
            ) : (
              <>
                <span className="text-3xl sm:text-4xl font-mono font-bold text-gray-800 dark:text-gray-100 tabular-nums tracking-wider">{fmtClock(remaining)}</span>
                <span className={`text-xs font-bold mt-1 tracking-wide ${isWork ? "text-violet-500" : "text-emerald-500"}`}>
                  {isPaused ? "Paused" : isWork ? "Focus" : "Break"}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                  Session {workIdx} of {totalWork}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-3">
          {sessions.filter((s) => s.type === "work").map((_, i) => {
            const done = i < workIdx - (isWork || isComplete ? 0 : 1);
            const active = !isComplete && i === workIdx - 1 && isWork;
            return (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  done ? "bg-violet-500" : active ? "bg-violet-400 animate-pulse" : "bg-gray-300 dark:bg-slate-600"
                }`}
              />
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-3 mt-4">
          {isComplete ? (
            <>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={extendVal}
                  onChange={(e) => setExtendVal(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => { if (e.key === "Enter" && parseInt(extendVal) > 0) { onExtend(parseInt(extendVal)); setExtendVal(""); } }}
                  placeholder="+min"
                  className="w-16 px-2 py-1.5 text-sm text-center rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
                />
                <button
                  onClick={() => { if (parseInt(extendVal) > 0) { onExtend(parseInt(extendVal)); setExtendVal(""); } }}
                  disabled={!parseInt(extendVal)}
                  className="px-4 py-1.5 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-40 transition-colors"
                >
                  Continue
                </button>
              </div>
              <button
                onClick={onDismiss}
                className="px-5 py-2 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
              >
                Done
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onStop}
                className="w-10 h-10 rounded-full border border-gray-200/70 dark:border-slate-600 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-red-500 hover:border-red-300 transition-colors"
                title="Stop"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><rect x="3" y="3" width="10" height="10" rx="1.5" /></svg>
              </button>
              <button
                onClick={isPaused ? onResume : onPause}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all ${
                  isWork
                    ? "bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50"
                    : "bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50"
                }`}
              >
                {isPaused ? (
                  <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 16 16"><path d="M5 3l9 5-9 5z" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 16 16"><path d="M4 2h3v12H4zM9 2h3v12H9z" /></svg>
                )}
              </button>
            </>
          )}
        </div>

        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 truncate max-w-full text-center">
          Working on: <span className="font-semibold text-gray-700 dark:text-gray-300">{pomo.itemTitle}</span>
        </p>
      </div>
    </motion.div>
  );
}

// ─── Day Card ────────────────────────────────────────────────────────────────
function DayCard({
  item, index, complete, note, isOpen, canComplete, isToday: dayIsToday,
  onToggleOpen, onToggleComplete, onNoteChange, onRemove, onMove, moveLabel,
  isStarred, onToggleStar, daysLeft,
  onTimeChange, onToggleSubItem, onAddSubItem, onRemoveSubItem, onSubItemTimeChange,
  pomoActive, pomoItemUid, onStartPomo,
  onDragStart, onDragOver, onDrop, onDragEnd, isDragging, isOver,
}) {
  const meta = SOURCE_META[item.source];
  const debounceRef = useRef(null);
  const [localNote, setLocalNote] = useState(note);
  const [editingTime, setEditingTime] = useState(false);
  const [timeVal, setTimeVal] = useState(String(item.estimatedMinutes || ""));
  const [subInput, setSubInput] = useState("");
  const [subTimeInput, setSubTimeInput] = useState("25");
  const [editingSubTime, setEditingSubTime] = useState(null);
  const [subTimeVal, setSubTimeVal] = useState("");

  useEffect(() => { setLocalNote(note); }, [note]);
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const handleNoteInput = useCallback(
    (e) => {
      const val = e.target.value;
      setLocalNote(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onNoteChange(val), 400);
    },
    [onNoteChange]
  );

  const saveTime = () => {
    const v = parseInt(timeVal) || 0;
    if (v > 0) onTimeChange(item.uid, v);
    setEditingTime(false);
  };

  const saveSubTime = (subUid) => {
    const v = parseInt(subTimeVal) || 0;
    if (v > 0) onSubItemTimeChange(item.uid, subUid, v);
    setEditingSubTime(null);
  };

  const interviewCard = item.source === "interview" ? getInterviewCard(item.refId) : null;
  const dsaProblem = item.source === "dsa" ? getDsaProblem(item.refId) : null;
  const subs = item.subItems || [];
  const subDone = subs.filter((s) => s.completed).length;
  const hasSubs = subs.length > 0;
  const parentAutoComplete = hasSubs;
  const totalMin = itemTotalMinutes(item);

  const isThisPomo = pomoItemUid === item.uid;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      className={`transition-opacity ${isDragging ? "opacity-30" : ""}`}
    >
      {isOver && !isDragging && <div className="h-0.5 bg-violet-500 rounded-full mb-1 -mt-0.5" />}
      <div className={`rounded-xl ${GLASS} border-l-4 ${complete ? "border-l-green-400" : meta.border} shadow-sm hover:shadow-md transition-all overflow-hidden ${complete ? "opacity-75" : ""}`}>
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 cursor-pointer select-none" onClick={onToggleOpen}>
          <span className="hidden sm:flex text-gray-300 dark:text-gray-600 cursor-grab active:cursor-grabbing shrink-0" onMouseDown={(e) => e.stopPropagation()}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><circle cx="5" cy="3" r="1.2" /><circle cx="11" cy="3" r="1.2" /><circle cx="5" cy="8" r="1.2" /><circle cx="11" cy="8" r="1.2" /><circle cx="5" cy="13" r="1.2" /><circle cx="11" cy="13" r="1.2" /></svg>
          </span>

          <button
            onClick={(e) => { e.stopPropagation(); if (canComplete && !parentAutoComplete) onToggleComplete(); }}
            disabled={!canComplete || parentAutoComplete}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${
              complete ? "bg-green-500 border-green-500" : "border-gray-300 dark:border-slate-500 hover:border-green-400"
            } ${(!canComplete || parentAutoComplete) ? "opacity-50 cursor-not-allowed" : ""}`}
            title={parentAutoComplete ? "Complete all sub-tasks to finish" : undefined}
          >
            {complete && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          </button>

          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${meta.badge}`}>{meta.label}</span>

          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-semibold truncate ${complete ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-800 dark:text-gray-200"}`}>{item.title}</h3>
            {hasSubs && (
              <p className="text-[10px] text-gray-400 dark:text-gray-500">{subDone}/{subs.length} sub-tasks{totalMin > 0 ? ` · ${fmt(totalMin)}` : ""}</p>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            {!hasSubs && (
              <>
                {editingTime ? (
                  <input
                    autoFocus
                    type="text"
                    inputMode="numeric"
                    value={timeVal}
                    onChange={(e) => setTimeVal(e.target.value.replace(/\D/g, ""))}
                    onBlur={saveTime}
                    onKeyDown={(e) => { if (e.key === "Enter") saveTime(); if (e.key === "Escape") setEditingTime(false); }}
                    className="w-14 px-1.5 py-0.5 text-[10px] rounded-md border border-violet-300 dark:border-violet-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 focus:outline-none text-center"
                  />
                ) : (
                  <button
                    onClick={() => { setTimeVal(String(item.estimatedMinutes || 25)); setEditingTime(true); }}
                    className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-violet-500 transition-colors"
                    title="Set time estimate"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" /><path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    {item.estimatedMinutes ? fmt(item.estimatedMinutes) : "set"}
                  </button>
                )}

                {dayIsToday && item.estimatedMinutes > 0 && !complete && (
                  <button
                    onClick={() => { if (!pomoActive || isThisPomo) onStartPomo(item); }}
                    disabled={pomoActive && !isThisPomo}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isThisPomo
                        ? "bg-violet-500 text-white animate-pulse"
                        : pomoActive
                        ? "bg-gray-200 dark:bg-slate-700 text-gray-400 cursor-not-allowed"
                        : "bg-violet-100 dark:bg-violet-900/30 text-violet-500 hover:bg-violet-200 dark:hover:bg-violet-900/50"
                    }`}
                    title={pomoActive && !isThisPomo ? "Stop current session first" : "Start focus"}
                  >
                    <svg className="w-3 h-3 ml-px" fill="currentColor" viewBox="0 0 16 16"><path d="M5 3l9 5-9 5z" /></svg>
                  </button>
                )}
              </>
            )}

            {onMove && (
              <button
                onClick={onMove}
                title={`Push to ${moveLabel}`}
                className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md border border-gray-200/70 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-violet-600 hover:border-violet-300 dark:hover:text-violet-400 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 16 16"><path d="M3 8h9M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span className="hidden sm:inline">{moveLabel}</span>
              </button>
            )}

            <button onClick={onRemove} className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors" title="Remove">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16"><path d="M5 5l6 6M11 5l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
          </div>

          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-gray-400 dark:text-gray-500 shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </motion.div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
              <div className="border-t border-gray-100 dark:border-slate-700 px-4 pb-4 pt-3" onClick={(e) => e.stopPropagation()}>
                {item.source === "custom" && hasSubs && (
                  <div className="mb-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Sub-tasks</h4>
                    <div className="space-y-1.5">
                      {subs.map((s) => (
                        <div key={s.uid} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${GLASS} ${s.completed ? "opacity-60" : ""}`}>
                          <button
                            onClick={() => onToggleSubItem(item.uid, s.uid)}
                            disabled={!canComplete}
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all shrink-0 ${
                              s.completed ? "bg-green-500 border-green-500" : "border-gray-300 dark:border-slate-500"
                            } ${!canComplete ? "opacity-50" : ""}`}
                          >
                            {s.completed && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                          </button>
                          <span className={`flex-1 text-xs ${s.completed ? "line-through text-gray-400" : "text-gray-700 dark:text-gray-300"}`}>{s.title}</span>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {editingSubTime === s.uid ? (
                              <input
                                autoFocus
                                type="text"
                                inputMode="numeric"
                                value={subTimeVal}
                                onChange={(e) => setSubTimeVal(e.target.value.replace(/\D/g, ""))}
                                onBlur={() => saveSubTime(s.uid)}
                                onKeyDown={(e) => { if (e.key === "Enter") saveSubTime(s.uid); if (e.key === "Escape") setEditingSubTime(null); }}
                                className="w-12 px-1 py-0.5 text-[10px] rounded-md border border-violet-300 dark:border-violet-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 focus:outline-none text-center"
                              />
                            ) : (
                              <button
                                onClick={() => { setSubTimeVal(String(s.estimatedMinutes || 25)); setEditingSubTime(s.uid); }}
                                className="text-[10px] font-semibold px-1 py-0.5 rounded text-gray-400 dark:text-gray-500 hover:text-violet-500 transition-colors flex items-center gap-0.5"
                              >
                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" /><path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                {s.estimatedMinutes ? fmt(s.estimatedMinutes) : "set"}
                              </button>
                            )}

                            {dayIsToday && (s.estimatedMinutes || 0) > 0 && !s.completed && (
                              <button
                                onClick={() => { if (!pomoActive) onStartPomo(item, s); }}
                                disabled={pomoActive}
                                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                                  pomoActive
                                    ? "bg-gray-200 dark:bg-slate-700 text-gray-400 cursor-not-allowed"
                                    : "bg-violet-100 dark:bg-violet-900/30 text-violet-500 hover:bg-violet-200 dark:hover:bg-violet-900/50"
                                }`}
                                title={pomoActive ? "Stop current session first" : "Start focus"}
                              >
                                <svg className="w-2.5 h-2.5 ml-px" fill="currentColor" viewBox="0 0 16 16"><path d="M5 3l9 5-9 5z" /></svg>
                              </button>
                            )}

                            <button onClick={() => onRemoveSubItem(item.uid, s.uid)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16"><path d="M5 5l6 6M11 5l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {item.source === "custom" && canComplete && (
                  <div className="flex gap-2 mb-3">
                    <input
                      value={subInput}
                      onChange={(e) => setSubInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && subInput.trim()) {
                          onAddSubItem(item.uid, subInput.trim(), parseInt(subTimeInput) || 25);
                          setSubInput("");
                        }
                      }}
                      placeholder="Add sub-task..."
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={subTimeInput}
                      onChange={(e) => setSubTimeInput(e.target.value.replace(/\D/g, ""))}
                      className="w-16 px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400/40 text-center"
                      placeholder="min"
                      title="Time estimate (minutes)"
                    />
                    <button
                      onClick={() => { if (subInput.trim()) { onAddSubItem(item.uid, subInput.trim(), parseInt(subTimeInput) || 25); setSubInput(""); } }}
                      disabled={!subInput.trim()}
                      className="px-3 py-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs font-semibold disabled:opacity-40 hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
                    >
                      +
                    </button>
                  </div>
                )}

                {item.source === "interview" && <InterviewCardDetail item={interviewCard} note={note} onNoteChange={onNoteChange} />}
                {item.source === "dsa" && <DsaProblemDetail problem={dsaProblem} note={note} onNoteChange={onNoteChange} isStarred={isStarred} onToggleStar={onToggleStar} daysLeft={daysLeft} />}
                {item.source === "custom" && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1 h-4 rounded-full bg-gradient-to-b from-violet-400 to-indigo-400" />
                        Notes
                      </h4>
                    </div>
                    <textarea
                      value={localNote}
                      onChange={handleNoteInput}
                      placeholder="What did you work on, key takeaways, blockers..."
                      rows={4}
                      className="w-full p-3 text-sm rounded-lg border border-violet-200 dark:border-slate-600 bg-white dark:bg-slate-900/60 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-400/40 resize-y min-h-[80px] transition-all leading-relaxed shadow-sm"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Card Picker ─────────────────────────────────────────────────────────────
function CardPicker({ dayItems, onClose, onAdd }) {
  const [tab, setTab] = useState("custom");
  const [query, setQuery] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [customTime, setCustomTime] = useState("30");
  const [subItems, setSubItems] = useState([]);
  const [subInput, setSubInput] = useState("");
  const [subTimeInput, setSubTimeInput] = useState("25");

  const addedKey = useMemo(() => {
    const s = new Set();
    dayItems.forEach((i) => { if (i.source !== "custom") s.add(`${i.source}:${i.refId}`); });
    return s;
  }, [dayItems]);

  const q = query.trim().toLowerCase();

  const interviewResults = useMemo(() => {
    if (tab !== "interview") return [];
    return INTERVIEW_CARDS.filter((c) => !q || c.title.toLowerCase().includes(q) || c.categories.join(" ").toLowerCase().includes(q));
  }, [tab, q]);

  const dsaResults = useMemo(() => {
    if (tab !== "dsa") return [];
    return DSA_PROBLEMS.filter((p) => !q || p.title.toLowerCase().includes(q) || p.topic.toLowerCase().includes(q));
  }, [tab, q]);

  const hasSubs = subItems.length > 0;

  const addCustom = () => {
    const title = customTitle.trim();
    if (!title) return;
    onAdd({
      uid: uid(), source: "custom", title, completed: false,
      notes: customNote.trim(),
      estimatedMinutes: hasSubs ? 0 : (parseInt(customTime) || 30),
      subItems: hasSubs ? subItems : undefined,
    });
    setCustomTitle("");
    setCustomNote("");
    setCustomTime("30");
    setSubItems([]);
  };

  const addSub = () => {
    const t = subInput.trim();
    if (!t) return;
    setSubItems([...subItems, { uid: uid(), title: t, completed: false, estimatedMinutes: parseInt(subTimeInput) || 25 }]);
    setSubInput("");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">Add to plan</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20"><path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="flex gap-1 px-4 pt-3">
          {[
            { key: "custom", label: "Custom" },
            { key: "interview", label: "Topics" },
            { key: "dsa", label: "DSA" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                tab === t.key ? "bg-violet-600 text-white border-violet-600" : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-600 hover:border-violet-400"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab !== "custom" && (
          <div className="px-4 pt-3">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tab === "interview" ? "Search topics..." : "Search problems or patterns..."}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {tab === "interview" && (
            <ul className="space-y-1.5">
              {interviewResults.map((c) => {
                const added = addedKey.has(`interview:${c.id}`);
                return (
                  <li key={c.id}>
                    <button
                      disabled={added}
                      onClick={() => onAdd({ uid: uid(), source: "interview", refId: c.id, title: c.title, meta: c.primaryCategory, estimatedMinutes: 25 })}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all ${added ? "border-green-200 dark:border-green-900/40 bg-green-50 dark:bg-green-900/10 cursor-default" : "border-gray-200 dark:border-slate-600 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/10"}`}
                    >
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${CATEGORY_CONFIG[c.primaryCategory].badge}`}>{c.primaryCategory}</span>
                      <span className="flex-1 text-sm text-gray-700 dark:text-gray-200 truncate">{c.title}</span>
                      <span className="text-[10px] text-gray-400 shrink-0">{added ? "Added" : "Add +"}</span>
                    </button>
                  </li>
                );
              })}
              {interviewResults.length === 0 && <p className="text-center text-xs text-gray-400 py-6">No matches.</p>}
            </ul>
          )}

          {tab === "dsa" && (
            <ul className="space-y-1.5">
              {dsaResults.map((p) => {
                const added = addedKey.has(`dsa:${p.id}`);
                return (
                  <li key={p.id}>
                    <button
                      disabled={added}
                      onClick={() => onAdd({ uid: uid(), source: "dsa", refId: p.id, title: p.title, meta: p.topic, link: p.link, estimatedMinutes: 25 })}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all ${added ? "border-green-200 dark:border-green-900/40 bg-green-50 dark:bg-green-900/10 cursor-default" : "border-gray-200 dark:border-slate-600 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10"}`}
                    >
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${DSA_DIFFICULTY_CONFIG[p.difficulty]}`}>{p.difficulty}</span>
                      <span className="flex-1 text-sm text-gray-700 dark:text-gray-200 truncate">{p.title}</span>
                      <span className="text-[10px] text-gray-400 shrink-0">{added ? "Added" : "Add +"}</span>
                    </button>
                  </li>
                );
              })}
              {dsaResults.length === 0 && <p className="text-center text-xs text-gray-400 py-6">No matches.</p>}
            </ul>
          )}

          {tab === "custom" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Title</label>
                <input
                  autoFocus
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && customTitle.trim()) addCustom(); }}
                  placeholder="e.g. Pair session, Sharding deep-dive, System Design..."
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
                />
              </div>

              {!hasSubs && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Time estimate (minutes)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value.replace(/\D/g, ""))}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">{fmt(parseInt(customTime) || 0)} &rarr; {buildSessions(parseInt(customTime) || 0).filter((s) => s.type === "work").length} focus sessions</p>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Sub-tasks (optional){hasSubs ? ` — ${fmt(subItems.reduce((s, i) => s + (i.estimatedMinutes || 0), 0))} total` : ""}</label>
                {hasSubs && (
                  <div className="space-y-1 mt-1.5">
                    {subItems.map((s) => (
                      <div key={s.uid} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-800 text-sm">
                        <span className="flex-1 text-gray-700 dark:text-gray-300">{s.title}</span>
                        <span className="text-[10px] text-gray-400 shrink-0">{fmt(s.estimatedMinutes || 0)}</span>
                        <button onClick={() => setSubItems(subItems.filter((x) => x.uid !== s.uid))} className="text-gray-400 hover:text-red-500">&times;</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-1.5">
                  <input
                    value={subInput}
                    onChange={(e) => setSubInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addSub(); }}
                    placeholder="Add a sub-task..."
                    className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={subTimeInput}
                    onChange={(e) => setSubTimeInput(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => { if (e.key === "Enter") addSub(); }}
                    className="w-16 px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400/40 text-center"
                    placeholder="min"
                    title="Minutes"
                  />
                  <button onClick={addSub} disabled={!subInput.trim()} className="px-3 py-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-sm font-semibold disabled:opacity-40">+</button>
                </div>
                {hasSubs && (
                  <p className="text-[10px] text-gray-400 mt-1">Time is set per sub-task. Timer runs on each sub-task individually.</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Notes (optional)</label>
                <textarea
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  rows={2}
                  placeholder="Any details..."
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40 resize-y"
                />
              </div>
              <button
                onClick={addCustom}
                disabled={!customTitle.trim()}
                className="w-full py-2.5 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Add to plan
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Planning Page ───────────────────────────────────────────────────────────
const Planning = () => {
  const [authReady, setAuthReady] = useState(false);
  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), () => setAuthReady(true));
    return unsub;
  }, []);
  useEffect(() => { pruneExpiredDsaSolves(); }, []);

  const today = dateKey();
  const [current, setCurrent] = useState(today);
  const [items, setItems] = useState(() => getDay(today));
  const [ipCompleted, setIpCompleted] = useState(() => loadJSON(KEYS.IP_COMPLETED, {}));
  const [dsaCompleted, setDsaCompleted] = useState(() => loadJSON(KEYS.DSA_COMPLETED, {}));
  const [ipNotes, setIpNotes] = useState(() => loadJSON(KEYS.IP_NOTES, {}));
  const [dsaNotes, setDsaNotes] = useState(() => loadJSON(KEYS.DSA_NOTES, {}));
  const [dsaStarred, setDsaStarredMap] = useState(() => loadJSON(KEYS.DSA_STARRED, {}));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [openItem, setOpenItem] = useState(null);
  const [calOpen, setCalOpen] = useState(false);

  const [pomo, setPomo] = useState(() => catchUpPomo(loadJSON(KEYS.POMO_STATE, null)));
  const pomoRef = useRef(null);
  useEffect(() => { pomoRef.current = pomo; }, [pomo]);
  useEffect(() => {
    saveJSON(KEYS.POMO_STATE, pomo ? { ...pomo, updatedAt: Date.now() } : null);
  }, [pomo]);

  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);

  const currentRef = useRef(current);
  useEffect(() => { currentRef.current = current; }, [current]);
  useEffect(() => setItems(getDay(current)), [current]);

  useEffect(
    () =>
      subscribe((key) => {
        if (key === KEYS.IP_COMPLETED) setIpCompleted(loadJSON(KEYS.IP_COMPLETED, {}));
        if (key === KEYS.DSA_COMPLETED) setDsaCompleted(loadJSON(KEYS.DSA_COMPLETED, {}));
        if (key === KEYS.IP_NOTES) setIpNotes(loadJSON(KEYS.IP_NOTES, {}));
        if (key === KEYS.DSA_NOTES) setDsaNotes(loadJSON(KEYS.DSA_NOTES, {}));
        if (key === KEYS.DSA_STARRED) setDsaStarredMap(loadJSON(KEYS.DSA_STARRED, {}));
        if (key === KEYS.PLAN_DAYS) setItems(getDay(currentRef.current));
      }),
    []
  );

  const isRunning = pomo?.status === "running";
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      const p = pomoRef.current;
      if (!p || p.status !== "running") return;
      let next;
      if (p.remaining <= 1) {
        const nextIdx = p.currentIdx + 1;
        if (nextIdx >= p.sessions.length) {
          playSound("timerDone");
          next = { ...p, remaining: 0, status: "complete" };
        } else {
          const nextSession = p.sessions[nextIdx];
          playSound(nextSession.type === "work" ? "focusStart" : "breakStart");
          next = { ...p, currentIdx: nextIdx, remaining: nextSession.duration };
        }
      } else {
        next = { ...p, remaining: p.remaining - 1 };
      }
      pomoRef.current = next;
      setPomo(next);
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  const toggleStar = useCallback((id) => {
    const next = !dsaStarred[id];
    setDsaStarred(id, next);
    setDsaStarredMap((m) => ({ ...m, [id]: next }));
  }, [dsaStarred]);

  const persist = useCallback((next) => {
    setItems(next);
    setDay(current, next);
  }, [current]);

  const resolve = useCallback((item) => {
    if (item.source === "custom") return { complete: !!item.completed, note: item.notes || "" };
    if (item.source === "dsa") return { complete: !!dsaCompleted[item.refId], note: dsaNotes[item.refId] || "" };
    return { complete: !!ipCompleted[item.refId], note: ipNotes[item.refId] || "" };
  }, [ipCompleted, dsaCompleted, ipNotes, dsaNotes]);

  const addItem = useCallback((item) => {
    if (item.source !== "custom" && items.some((i) => i.source === item.source && i.refId === item.refId)) return;
    persist([...items, item]);
  }, [items, persist]);

  const removeItem = useCallback((id) => persist(items.filter((i) => i.uid !== id)), [items, persist]);

  const moveItem = useCallback((item, targetKey) => {
    if (targetKey === current) return;
    persist(items.filter((i) => i.uid !== item.uid));
    const targetItems = getDay(targetKey);
    const dup = item.source !== "custom" && targetItems.some((i) => i.source === item.source && i.refId === item.refId);
    if (!dup) setDay(targetKey, [...targetItems, item]);
  }, [items, current, persist]);

  const toggleComplete = useCallback((item) => {
    if (current !== today) return;
    const hasSubs = (item.subItems || []).length > 0;
    const pomoForThis = pomo && pomo.itemUid === item.uid;
    if (item.source === "custom") {
      if (hasSubs) return;
      const next = !item.completed;
      const actual = next && pomoForThis && !pomo.subItemUid ? pomoElapsedWorkMinutes(pomo) : undefined;
      if (next && pomoForThis) setPomo(null);
      persist(items.map((i) => (i.uid === item.uid ? { ...i, completed: next, actualMinutes: next ? (actual ?? i.actualMinutes) : undefined } : i)));
      if (next) playSound("taskDone");
      return;
    }
    const next = !resolve(item).complete;
    if (next && pomoForThis) {
      const actual = pomoElapsedWorkMinutes(pomo);
      setPomo(null);
      persist(items.map((i) => (i.uid === item.uid ? { ...i, actualMinutes: actual } : i)));
    } else if (!next) {
      persist(items.map((i) => (i.uid === item.uid ? { ...i, actualMinutes: undefined } : i)));
    }
    setSourceComplete(item.source, item.refId, next);
    if (item.source === "dsa") setDsaCompleted((m) => ({ ...m, [item.refId]: next }));
    else setIpCompleted((m) => ({ ...m, [item.refId]: next }));
    if (next) playSound("taskDone");
  }, [items, current, today, persist, resolve, pomo]);

  const changeNote = useCallback((item, val) => {
    if (item.source === "custom") { persist(items.map((i) => (i.uid === item.uid ? { ...i, notes: val } : i))); return; }
    setSourceNote(item.source, item.refId, val);
    if (item.source === "dsa") setDsaNotes((m) => ({ ...m, [item.refId]: val }));
    else setIpNotes((m) => ({ ...m, [item.refId]: val }));
  }, [items, persist]);

  const updateItemTime = useCallback((itemUid, minutes) => {
    persist(items.map((i) => (i.uid === itemUid ? { ...i, estimatedMinutes: minutes } : i)));
  }, [items, persist]);

  const updateSubItemTime = useCallback((itemUid, subUid, minutes) => {
    persist(items.map((i) => {
      if (i.uid !== itemUid) return i;
      return { ...i, subItems: (i.subItems || []).map((s) => (s.uid === subUid ? { ...s, estimatedMinutes: minutes } : s)) };
    }));
  }, [items, persist]);

  const toggleSubItem = useCallback((itemUid, subUid) => {
    if (current !== today) return;
    const pomoForSub = pomo && pomo.itemUid === itemUid && pomo.subItemUid === subUid;
    persist(items.map((i) => {
      if (i.uid !== itemUid) return i;
      const subs = (i.subItems || []).map((s) => {
        if (s.uid !== subUid) return s;
        const nowDone = !s.completed;
        const actual = nowDone && pomoForSub ? pomoElapsedWorkMinutes(pomo) : undefined;
        return { ...s, completed: nowDone, actualMinutes: nowDone ? (actual ?? s.actualMinutes) : undefined };
      });
      const toggled = subs.find((s) => s.uid === subUid);
      if (toggled?.completed) playSound("taskDone");
      const allDone = subs.length > 0 && subs.every((s) => s.completed);
      if (allDone && !i.completed) playSound("timerDone");
      return { ...i, subItems: subs, completed: allDone };
    }));
    if (pomoForSub) setPomo(null);
  }, [items, persist, current, today, pomo]);

  const addSubItem = useCallback((itemUid, title, estimatedMinutes = 25) => {
    persist(items.map((i) => (i.uid !== itemUid ? i : {
      ...i,
      subItems: [...(i.subItems || []), { uid: uid(), title, completed: false, estimatedMinutes }],
      completed: false,
    })));
  }, [items, persist]);

  const removeSubItem = useCallback((itemUid, subUid) => {
    persist(items.map((i) => {
      if (i.uid !== itemUid) return i;
      const subs = (i.subItems || []).filter((s) => s.uid !== subUid);
      const allDone = subs.length > 0 && subs.every((s) => s.completed);
      return { ...i, subItems: subs, completed: subs.length > 0 ? allDone : i.completed };
    }));
  }, [items, persist]);

  const startPomo = useCallback((item, subItem) => {
    const target = subItem || item;
    const mins = target.estimatedMinutes || 25;
    const sessions = buildSessions(mins);
    if (!sessions.length) return;
    playSound("focusStart");
    setPomo({
      itemUid: item.uid,
      subItemUid: subItem?.uid || null,
      itemTitle: subItem ? `${item.title} → ${subItem.title}` : item.title,
      sessions,
      currentIdx: 0,
      remaining: sessions[0].duration,
      status: "running",
    });
  }, []);

  const extendPomo = useCallback((addMinutes) => {
    setPomo((p) => {
      if (!p) return null;
      const extra = buildSessions(addMinutes);
      if (!extra.length) return p;
      const sessions = [...p.sessions, ...extra];
      return { ...p, sessions, currentIdx: p.sessions.length, remaining: extra[0].duration, status: "running" };
    });
    playSound("focusStart");
  }, []);

  const handleDragStart = useCallback((e, idx) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  }, []);
  const handleDragOver = useCallback((e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverIdx(idx);
  }, []);
  const handleDrop = useCallback((e, idx) => {
    e.preventDefault();
    if (dragIdx !== null && dragIdx !== idx) {
      const next = [...items];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(idx, 0, moved);
      persist(next);
    }
    setDragIdx(null);
    setOverIdx(null);
  }, [dragIdx, items, persist]);
  const handleDragEnd = useCallback(() => { setDragIdx(null); setOverIdx(null); }, []);

  const planDays = useMemo(() => new Set(getAllDayKeys()), [items]);
  const doneCount = items.filter((i) => resolve(i).complete).length;
  const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0;
  const isToday = current === today;

  const totalPlanned = items.reduce((s, i) => s + itemTotalMinutes(i), 0);
  const totalDone = items.reduce((s, i) => {
    if (resolve(i).complete) {
      const subs = i.subItems || [];
      if (subs.length > 0) return s + subs.reduce((a, sub) => a + (sub.actualMinutes ?? sub.estimatedMinutes ?? 0), 0);
      return s + (i.actualMinutes ?? i.estimatedMinutes ?? 0);
    }
    return s + itemDoneMinutes(i);
  }, 0);

  if (!authReady) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pb-16">
      <div className="min-h-screen flex justify-center px-2">
        <div className="w-full sm:w-11/12 lg:w-3/4 xl:w-2/3">

          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 mb-4 px-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Planning</h1>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{relativeLabel(current)}</p>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{doneCount}/{items.length} done</p>
                </div>
                <div className="relative w-12 h-12">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="19" fill="none" stroke="currentColor" className="text-gray-200 dark:text-slate-700" strokeWidth="4" />
                    <circle cx="24" cy="24" r="19" fill="none" stroke="url(#planGrad)" strokeWidth="4" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 19}`}
                      strokeDashoffset={`${2 * Math.PI * 19 * (1 - pct / 100)}`}
                      style={{ transition: "stroke-dashoffset 0.5s ease" }} />
                    <defs>
                      <linearGradient id="planGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-violet-600 dark:text-violet-400">{pct}%</span>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="flex items-center justify-between gap-2 mb-3 px-2 relative">
            <button onClick={() => setCurrent(addDays(current, -1))} className="px-3 py-1.5 rounded-lg border border-gray-200/70 dark:border-white/10 bg-white/50 dark:bg-slate-800/40 backdrop-blur-md text-gray-600 dark:text-gray-300 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 text-sm font-semibold transition-all">&lsaquo;</button>

            <div className="relative text-center">
              <button onClick={() => setCalOpen(!calOpen)} className="group">
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{relativeLabel(current)}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                  {prettyDate(current)}
                  <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" /><path d="M2 7h12M5 1v4M11 1v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                </p>
              </button>
              <AnimatePresence>
                {calOpen && <CalendarPicker current={current} today={today} planDays={planDays} onSelect={setCurrent} onClose={() => setCalOpen(false)} />}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2">
              {!isToday && (
                <button onClick={() => setCurrent(today)} className="px-3 py-1.5 rounded-lg border border-violet-300 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 text-sm font-semibold transition-all">Today</button>
              )}
              <button onClick={() => setCurrent(addDays(current, 1))} className="px-3 py-1.5 rounded-lg border border-gray-200/70 dark:border-white/10 bg-white/50 dark:bg-slate-800/40 backdrop-blur-md text-gray-600 dark:text-gray-300 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 text-sm font-semibold transition-all">&rsaquo;</button>
            </div>
          </div>

          {totalPlanned > 0 && (
            <div className="px-2 mb-3">
              <div className={`rounded-xl ${GLASS} px-4 py-2.5 flex items-center gap-3`}>
                <svg className="w-4 h-4 text-violet-500 shrink-0" fill="none" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" /><path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{fmt(totalPlanned)} planned</span>
                    <span className="text-gray-400 dark:text-gray-500">{fmt(totalDone)} done</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${totalPlanned ? (totalDone / totalPlanned) * 100 : 0}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="px-2">
            <AnimatePresence>
              {pomo && (
                <PomodoroTimer
                  pomo={pomo}
                  onPause={() => setPomo((p) => p ? { ...p, status: "paused" } : null)}
                  onResume={() => setPomo((p) => p ? { ...p, status: "running" } : null)}
                  onStop={() => setPomo(null)}
                  onDismiss={() => setPomo(null)}
                  onExtend={extendPomo}
                />
              )}
            </AnimatePresence>
          </div>

          <div className="px-2 mb-4">
            <motion.div layout className="rounded-2xl border-2 border-dashed border-violet-300/80 dark:border-violet-700/60 bg-violet-50/30 dark:bg-violet-900/10 backdrop-blur-md p-3 sm:p-4 transition-colors">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  Tasks for {relativeLabel(current)}
                </h3>
                <span className="text-[11px] text-gray-400 dark:text-gray-500">{doneCount}/{items.length} done</span>
              </div>

              {items.length === 0 ? (
                <p className="text-center text-xs text-gray-400 dark:text-gray-500 py-6">
                  Nothing planned yet — add cards from Topics, DSA, or create a custom one.
                </p>
              ) : (
                <div className="space-y-2">
                  {items.map((item, idx) => {
                    const { complete, note } = resolve(item);
                    return (
                      <DayCard
                        key={item.uid}
                        item={item}
                        index={idx}
                        complete={complete}
                        note={note}
                        isOpen={openItem === item.uid}
                        canComplete={isToday}
                        isToday={isToday}
                        onToggleOpen={() => setOpenItem((p) => (p === item.uid ? null : item.uid))}
                        onToggleComplete={() => toggleComplete(item)}
                        onNoteChange={(val) => changeNote(item, val)}
                        onRemove={() => removeItem(item.uid)}
                        isStarred={item.source === "dsa" ? !!dsaStarred[item.refId] : false}
                        onToggleStar={item.source === "dsa" ? toggleStar : undefined}
                        daysLeft={item.source === "dsa" && complete ? dsaDaysLeft(item.refId) : null}
                        moveLabel={isToday ? "Tomorrow" : "Today"}
                        onMove={() => moveItem(item, isToday ? addDays(current, 1) : today)}
                        onTimeChange={updateItemTime}
                        onSubItemTimeChange={updateSubItemTime}
                        onToggleSubItem={toggleSubItem}
                        onAddSubItem={addSubItem}
                        onRemoveSubItem={removeSubItem}
                        pomoActive={!!pomo && pomo.status !== "complete"}
                        pomoItemUid={pomo?.itemUid}
                        onStartPomo={startPomo}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onDragEnd={handleDragEnd}
                        isDragging={dragIdx === idx}
                        isOver={overIdx === idx && dragIdx !== idx}
                      />
                    );
                  })}
                </div>
              )}

              <button
                onClick={() => setPickerOpen(true)}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-violet-400 dark:border-violet-700 text-violet-600 dark:text-violet-400 font-semibold text-sm bg-white/60 dark:bg-slate-800/40 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                Add to {isToday ? "today's" : "this day's"} plan
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {pickerOpen && <CardPicker dayItems={items} onClose={() => setPickerOpen(false)} onAdd={addItem} />}
      </AnimatePresence>
    </div>
  );
};

export default Planning;
