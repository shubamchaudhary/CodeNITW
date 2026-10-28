import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import PageSkeleton from "../../components/PageSkeleton";
import { motion, AnimatePresence } from "framer-motion";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { isOwner } from "../../components/OwnerRoute";
import { DSA_DIFFICULTY_CONFIG } from "../../Data/DSAPrep";
import { CORE_STACK_PRIORITY_CONFIG } from "../../Data/CoreStack";
import { AI_STACK_TOPICS } from "../../Data/AIStack";
import {
  InterviewCardDetail,
  DsaProblemDetail,
  CoreStackTopicDetail,
  AIStackTopicDetail,
  ProjectTopicDetail,
} from "../../components/cardDetails";
import { Button, buttonClass, Icon, Kbd, ProgressBar } from "../../components/ui";
import PageShell from "../../components/PageShell";
import {
  CORE_STACK_TOPICS,
  DSA_PROBLEMS,
  KEYS,
  loadJSON,
  saveJSON,
  setSourceComplete,
  setSourceNote,
  getCoreStackTopic,
  getAIStackTopic,
  projectDaysSinceChecked,
  getDsaProblem,
  setDsaStarred,
  dsaDaysSinceSolved,
  coreStackDaysSinceChecked,
  coreStackPlanItem,
  aiStackDaysSinceChecked,
  aiStackPlanItem,
  getDay,
  setDay,
  getAllDayKeys,
  backfillDsaTimestamps,
  dateKey,
  addDays,
  prettyDate,
  relativeLabel,
  subscribe,
  timeTarget,
  getTimeLog,
  addTime,
  setDayTime,
  migrateCardTime,
} from "../../Data/planStore";
import { getInterviewCard } from "../../Data/interviewCards";
import { getProjectTopic } from "../../Data/Projects";
import { demoPlan } from "../../Data/planDemo";
import { requireAuth, requestSignIn } from "../../Data/authGate";
import { startTour } from "../../components/SiteTour";
import OfferHero from "./OfferHero";
import useTourSandbox from "../../hooks/useTourSandbox";

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

// Total work seconds elapsed so far in a running/paused/complete pomo session.
function pomoElapsedWorkSeconds(p) {
  if (!p) return 0;
  let sec = 0;
  for (let i = 0; i < p.currentIdx; i++) {
    if (p.sessions[i].type === "work") sec += p.sessions[i].duration;
  }
  const cur = p.sessions[p.currentIdx];
  if (cur?.type === "work") sec += cur.duration - p.remaining;
  return sec;
}

// Work seconds of a pomo not yet written to the time log.
function unloggedSec(p) {
  if (!p) return 0;
  return Math.max(0, pomoElapsedWorkSeconds(p) - (p.flushedSec || 0));
}

// What the time log needs to know about a card.
function cardRef(item) {
  return { source: item.source, refId: item.refId, uid: item.uid, title: item.title };
}

// The card a pomo is timing. A session started before the time log only
// names the card's uid, so look for it on its day.
function pomoCard(p) {
  if (!p) return null;
  if (p.card) return p.card;
  const item = getDay(p.day || dateKey()).find((i) => i.uid === p.itemUid);
  return item ? cardRef(item) : null;
}

// Log a pomo's unlogged work time on the day it ran. Returns the pomo, marked
// as logged up to now.
function logPomoTime(p) {
  const sec = unloggedSec(p);
  if (!sec) return p;
  const card = pomoCard(p);
  if (card) addTime(p.day || dateKey(), card, sec, p.subItemUid || null);
  return { ...p, flushedSec: pomoElapsedWorkSeconds(p) };
}

// Same timer? Each start gets its own id (one saved before ids existed is
// told apart by its card and day).
function sameTimer(a, b) {
  return !!a && !!b && a.id === b.id && a.itemUid === b.itemUid
    && (a.subItemUid || null) === (b.subItemUid || null) && a.day === b.day;
}

// Log a timer's unlogged seconds, brought up to this moment first so a pause
// or stop logs every second. Another tab or device may have logged some of
// them already, and its save says how many, so none is logged twice; if
// what's saved is another timer or none, this one was stopped elsewhere,
// which logged it. Returns the timer, marked as logged up to now.
function flushPomo(p) {
  if (!p) return null;
  const now = advancePomo(p).pomo;
  const saved = loadJSON(KEYS.POMO_STATE, null);
  if (!sameTimer(saved, now)) return { ...now, flushedSec: pomoElapsedWorkSeconds(now) };
  return logPomoTime({ ...now, flushedSec: Math.max(now.flushedSec || 0, saved.flushedSec || 0) });
}

// The timer as saved (and synced to the account): while it runs, rewound to
// its first session, with `anchor` moved back by the time it has run. It
// counts down just the same, but holds still while it runs, so it's written
// only when something happens (start, pause, resume, extend, finish, stop),
// not every second.
function storedPomo(p) {
  if (!p) return null;
  const { updatedAt, ...rest } = p; // saves used to be stamped every second
  if (p.status !== "running") return rest;
  let ran = p.sessions[p.currentIdx].duration - p.remaining;
  for (let i = 0; i < p.currentIdx; i++) ran += p.sessions[i].duration;
  const anchor = p.anchor ?? updatedAt ?? Date.now();
  return { ...rest, currentIdx: 0, remaining: p.sessions[0].duration, anchor: anchor - ran * 1000 };
}

// The saved timer, brought up to now.
function loadPomo() {
  return advancePomo(loadJSON(KEYS.POMO_STATE, null)).pomo;
}

// "tomorrow", "yesterday", "Oct 2"…
function dayName(key, today) {
  if (key === today) return "today";
  if (key === addDays(today, 1)) return "tomorrow";
  if (key === addDays(today, -1)) return "yesterday";
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function fmtSpent(sec) {
  if (!sec || sec < 1) return "";
  if (sec < 60) return "<1m";
  return fmt(Math.round(sec / 60));
}

// Bring a running timer up to `now` by the time that has really passed — the
// clock, not a count of ticks. Browsers slow timers down in background tabs
// (to about once a minute after a few minutes hidden), so counting ticks lost
// all that time; this works out how far the timer really got, walking through
// any focus/break sessions that finished meanwhile. The same catch-up runs
// when the page is reopened.
//   `anchor` is when `remaining` was last exact (a timer saved before anchors
//   existed falls back to its last save). The leftover fraction of a second
//   stays in the new anchor, so the count never drifts.
// → { pomo, entered }: the sessions started along the way, ending with
//   "complete" if the whole timer finished.
function advancePomo(p, now = Date.now()) {
  if (!p || p.status !== "running") return { pomo: p, entered: [] };
  const anchor = p.anchor ?? p.updatedAt ?? now;
  let whole = Math.floor((now - anchor) / 1000);
  if (whole < 1) return { pomo: p, entered: [] };
  const nextAnchor = anchor + whole * 1000;
  let idx = p.currentIdx;
  let remaining = p.remaining;
  const entered = [];
  while (whole > 0) {
    if (whole < remaining) {
      remaining -= whole;
      whole = 0;
    } else {
      whole -= remaining;
      if (idx + 1 >= p.sessions.length) {
        return { pomo: { ...p, currentIdx: idx, remaining: 0, status: "complete", anchor: undefined }, entered: [...entered, "complete"] };
      }
      idx += 1;
      remaining = p.sessions[idx].duration;
      entered.push(idx);
    }
  }
  return { pomo: { ...p, currentIdx: idx, remaining, anchor: nextAnchor }, entered };
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

// Where a card came from. The chip is neutral: colour on this page means
// state (done, running), never category.
const CHIP = "border border-line bg-surface-subtle text-fg-muted";
const SOURCE_META = {
  corestack: { label: "Core", badge: CHIP },
  aistack: { label: "AI", badge: CHIP },
  projects: { label: "Project", badge: CHIP },
  // Retired Topics page. Kept so days planned before Core Stack still render.
  interview: { label: "Topic", badge: CHIP },
  dsa: { label: "DSA", badge: CHIP },
  custom: { label: "Custom", badge: CHIP },
};

const WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// A text field: 32px, outlined, the focus ring in the focus colour.
const FIELD =
  "h-8 px-2.5 text-[13px] rounded-md border border-line-strong bg-canvas text-fg placeholder:text-fg-subtle focus:outline-none focus:border-focus focus:ring-1 focus:ring-focus";

// Row actions that wait for the pointer: hidden until the row is hovered or
// one of them has focus. A touch screen has no hover, so there they stay.
const HOVER_REVEAL =
  "transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-within:opacity-100";

const Dot = () => <span aria-hidden="true" className="text-line-strong">·</span>;

// A round tick box: empty ring, or filled green with a tick.
function CheckCircle({ done, disabled, onClick, title, small, ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={!!done}
      aria-label={done ? "Mark not done" : "Mark done"}
      className={`${small ? "w-4 h-4" : "w-[18px] h-[18px]"} shrink-0 rounded-full border-[1.5px] flex items-center justify-center transition-colors disabled:cursor-not-allowed ${
        done ? "bg-success border-success text-white" : "border-line-strong enabled:hover:border-success"
      } ${disabled && !done ? "opacity-50" : ""}`}
      {...rest}
    >
      {done && <Icon.check className={small ? "w-2.5 h-2.5" : "w-3 h-3"} />}
    </button>
  );
}

// A ring that fills with the day's progress, the percentage in its centre.
function ProgressRing({ pct, size = 56 }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 52 52" aria-hidden="true">
        <circle cx="26" cy="26" r={r} fill="none" stroke="var(--surface-hover)" strokeWidth="5" />
        <circle
          cx="26" cy="26" r={r} fill="none" strokeWidth="5" strokeLinecap="round"
          stroke={pct >= 100 ? "var(--success)" : "var(--brand)"}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-[12px] font-medium text-fg tabular-nums">{pct}%</span>
    </div>
  );
}

// ─── Week Strip ──────────────────────────────────────────────────────────────
// The week (Monday first) around the day on screen: each day's date and how
// much of its plan is done. A day with nothing planned shows no bar.
function WeekStrip({ current, today, onSelect, statsFor }) {
  const [y, m, d] = current.split("-").map(Number);
  const start = addDays(current, -((new Date(y, m - 1, d).getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return (
    <div className="grid grid-cols-7 gap-1 rounded-lg border border-line bg-canvas p-1">
      {days.map((key) => {
        const [ky, km, kd] = key.split("-").map(Number);
        const date = new Date(ky, km - 1, kd);
        const selected = key === current;
        const isT = key === today;
        const { total, done } = statsFor(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            aria-current={selected ? "date" : undefined}
            title={total ? `${done} of ${total} done` : "Nothing planned"}
            className={`flex flex-col items-center gap-1.5 py-2 rounded-md transition-colors ${selected ? "bg-surface-hover" : "hover:bg-surface-subtle"}`}
          >
            <span className={`font-mono text-[11px] uppercase tracking-[0.04em] ${isT ? "text-brand-fg" : "text-fg-subtle"}`}>
              {date.toLocaleDateString(undefined, { weekday: "short" })}
            </span>
            <span className={`text-[15px] leading-5 font-semibold tabular-nums ${isT ? "text-brand-fg" : key < today && !selected ? "text-fg-muted" : "text-fg"}`}>
              {kd}
            </span>
            <span className={`h-1 w-6 sm:w-8 rounded-full overflow-hidden ${total ? "bg-line" : ""}`}>
              {total > 0 && (
                <span
                  className={`block h-full rounded-full ${done === total ? "bg-success" : "bg-brand"}`}
                  style={{ width: `${(done / total) * 100}%` }}
                />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Calendar Picker ─────────────────────────────────────────────────────────
function CalendarPicker({ current, today, planDays, onSelect, onClose }) {
  const ref = useRef(null);
  const [view, setView] = useState(() => {
    const [y, m] = current.split("-").map(Number);
    return { year: y, month: m - 1 };
  });

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const esc = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("keydown", esc);
    };
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
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full mt-2 right-0 z-50 w-72 rounded-lg border border-line bg-canvas shadow-overlay p-3"
    >
      <div className="flex items-center justify-between mb-2">
        <button onClick={prev} aria-label="Previous month" className={buttonClass("ghost", "icon-sm")}><Icon.chevronLeft /></button>
        <span className="text-[13px] font-medium text-fg">{label}</span>
        <button onClick={next} aria-label="Next month" className={buttonClass("ghost", "icon-sm")}><Icon.chevronRight /></button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {WEEK.map((d) => (
          <span key={d} className="font-mono text-[11px] text-fg-subtle py-1">{d}</span>
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
              className={`relative w-9 h-9 mx-auto rounded-md text-[13px] tabular-nums transition-colors ${
                isSel
                  ? "bg-primary text-on-primary font-medium"
                  : isT
                  ? "text-brand-fg font-semibold hover:bg-surface-hover"
                  : "text-fg hover:bg-surface-hover"
              }`}
            >
              {d}
              {has && !isSel && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand" />}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Pomodoro Timer ──────────────────────────────────────────────────────────
const R = 52;
const CIRC = 2 * Math.PI * R;

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

  // Focus is the brand colour, a break is green, a pause is grey.
  const stroke = isComplete || !isWork ? "var(--success)" : isPaused ? "var(--fg-subtle)" : "var(--brand)";
  const tone = isComplete || (!isWork && !isPaused) ? "text-success-fg" : isPaused ? "text-fg-subtle" : "text-brand-fg";
  const state = isComplete ? "Complete" : isPaused ? "Paused" : isWork ? "Focus" : "Break";

  const extend = () => {
    const m = parseInt(extendVal);
    if (m > 0) { onExtend(m); setExtendVal(""); }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="rounded-lg border border-line bg-canvas"
    >
      <div className="flex items-center justify-between px-4 h-11 border-b border-line">
        <h2 className="text-[13px] font-medium text-fg">Focus session</h2>
        <span className={`inline-flex items-center gap-1.5 font-mono text-[12px] ${tone}`}>
          {!isPaused && !isComplete && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
          {state}
        </span>
      </div>

      <div className="p-4 flex flex-col items-center">
        <p className="w-full text-center text-[13px] text-fg-muted truncate" title={pomo.itemTitle}>{pomo.itemTitle}</p>

        <div className="relative mt-3">
          <svg viewBox="0 0 120 120" className="w-40 h-40 -rotate-90" aria-hidden="true">
            <circle cx="60" cy="60" r={R} fill="none" stroke="var(--surface-hover)" strokeWidth="6" />
            <circle
              cx="60" cy="60" r={R} fill="none" stroke={stroke} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - progress)}
              style={{ transition: "stroke-dashoffset 0.5s linear, stroke 0.2s" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isComplete ? (
              <Icon.check className="w-8 h-8 text-success-fg" />
            ) : (
              <span className="font-mono text-[30px] leading-none font-medium tabular-nums text-fg">{fmtClock(remaining)}</span>
            )}
            <span className="mt-2 font-mono text-[12px] text-fg-subtle">
              {isComplete ? "All sessions done" : `Session ${workIdx} of ${totalWork}`}
            </span>
          </div>
        </div>

        {totalWork > 1 && (
          <div className="flex items-center gap-1 mt-3">
            {sessions.filter((s) => s.type === "work").map((_, i) => {
              const done = i < workIdx - (isWork || isComplete ? 0 : 1);
              const active = !isComplete && i === workIdx - 1 && isWork;
              return (
                <span
                  key={i}
                  className={`h-1 w-5 rounded-full transition-colors ${active ? "bg-brand animate-pulse" : done ? "bg-brand" : "bg-surface-hover"}`}
                />
              );
            })}
          </div>
        )}

        {isComplete ? (
          <div className="mt-4 w-full space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={extendVal}
                onChange={(e) => setExtendVal(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => { if (e.key === "Enter") extend(); }}
                placeholder="Minutes"
                aria-label="Minutes to add"
                className={`${FIELD} min-w-0 flex-1`}
              />
              <Button onClick={extend} disabled={!parseInt(extendVal)}>Keep going</Button>
            </div>
            <Button variant="primary" className="w-full" onClick={onDismiss}>Done</Button>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-2 w-full">
            <Button data-tour="pomo-stop" onClick={onStop}>
              <Icon.stop className="w-3.5 h-3.5" />
              Stop
            </Button>
            <Button variant="primary" onClick={isPaused ? onResume : onPause}>
              {isPaused ? <Icon.start className="w-3.5 h-3.5" /> : <Icon.pause className="w-3.5 h-3.5" />}
              {isPaused ? "Resume" : "Pause"}
            </Button>
          </div>
        )}
      </div>
    </motion.section>
  );
}

// ─── Day Card ────────────────────────────────────────────────────────────────
// One row of the task list. Click it to open its details; the tick box,
// estimate and focus button work without opening it.
function DayCard({
  item, index, complete, note, isOpen, canComplete, isToday: dayIsToday,
  onToggleOpen, onToggleComplete, onNoteChange, onRemove, onMove, moveLabel,
  isStarred, onToggleStar, solvedDays,
  onTimeChange, onToggleSubItem, onAddSubItem, onRemoveSubItem, onSubItemTimeChange,
  pomoActive, pomoItemUid, onStartPomo,
  daySec, totalSec, subSec, dayLabel, canLog, onLogTime,
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
  const [logVal, setLogVal] = useState("");

  const logTime = (e) => {
    e.preventDefault();
    const m = parseInt(logVal) || 0;
    if (m > 0) onLogTime(m);
    setLogVal("");
  };

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

  const addSub = () => {
    if (!subInput.trim()) return;
    onAddSubItem(item.uid, subInput.trim(), parseInt(subTimeInput) || 25);
    setSubInput("");
  };

  const interviewCard = item.source === "interview" ? getInterviewCard(item.refId) : null;
  const coreStackTopic = item.source === "corestack" ? getCoreStackTopic(item.refId) : null;
  const aiStackTopic = item.source === "aistack" ? getAIStackTopic(item.refId) : null;
  const projectTopic = item.source === "projects" ? getProjectTopic(item.refId) : null;
  const dsaProblem = item.source === "dsa" ? getDsaProblem(item.refId) : null;
  const subs = item.subItems || [];
  const subDone = subs.filter((s) => s.completed).length;
  const hasSubs = subs.length > 0;
  const parentAutoComplete = hasSubs;
  const totalMin = itemTotalMinutes(item);
  // Its time across every day, shown once some came from another day.
  const overallSec = totalSec > daySec ? totalSec : 0;

  const isThisPomo = pomoItemUid === item.uid;
  const canStart = dayIsToday && !hasSubs && item.estimatedMinutes > 0 && !complete;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      className={`relative transition-opacity ${isDragging ? "opacity-30" : ""}`}
    >
      {isOver && !isDragging && <div className="absolute inset-x-0 -top-px h-0.5 bg-brand z-10" />}

      <div
        className={`group flex items-center gap-3 pl-3 sm:pl-2 pr-2 sm:pr-3 min-h-[56px] py-2 cursor-pointer select-none transition-colors ${
          isOpen ? "bg-surface-subtle" : "hover:bg-surface-subtle"
        }`}
        onClick={onToggleOpen}
      >
        <span
          className="hidden sm:flex w-4 justify-center text-fg-subtle cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          onMouseDown={(e) => e.stopPropagation()}
          title="Drag to reorder"
        >
          <Icon.grip className="w-3.5 h-3.5" />
        </span>

        <CheckCircle
          data-tour-check={item.refId || item.uid}
          done={complete}
          onClick={(e) => { e.stopPropagation(); if (canComplete && !parentAutoComplete) onToggleComplete(); }}
          disabled={!canComplete || parentAutoComplete}
          title={parentAutoComplete ? "Finish its sub-tasks to complete it" : !canComplete ? "Only today's tasks can be ticked" : undefined}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className={`text-[14px] leading-5 font-medium truncate ${complete ? "text-fg-subtle line-through decoration-line-strong" : "text-fg"}`}>
              {item.title}
            </h3>
            {isThisPomo && (
              <span className="shrink-0 inline-flex items-center gap-1 h-5 px-1.5 rounded bg-brand-subtle font-mono text-[11px] text-brand-fg">
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                Focusing
              </span>
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 text-[12px] leading-4 text-fg-subtle whitespace-nowrap overflow-hidden">
            <span>{meta.label}</span>
            {hasSubs && (
              <>
                <Dot />
                <span><span className="font-mono">{subDone}/{subs.length}</span> sub-tasks</span>
              </>
            )}
            {daySec > 0 && (
              <>
                <Dot />
                <span className="text-success-fg" title={`Time spent ${dayLabel}`}><span className="font-mono">{fmtSpent(daySec)}</span> spent</span>
              </>
            )}
            {overallSec > 0 && (
              <>
                <Dot />
                <span className="hidden sm:inline" title="Time on this card across all days"><span className="font-mono">{fmtSpent(overallSec)}</span> in total</span>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* On a phone these live in the opened row instead, leaving the title room. */}
          <div className={`hidden sm:flex items-center gap-0.5 ${HOVER_REVEAL}`}>
            {onMove && (
              <button onClick={onMove} title={`Move to ${moveLabel.toLowerCase()}`} className={buttonClass("ghost", "sm")}>
                <Icon.arrowRight className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{moveLabel}</span>
              </button>
            )}
            <button onClick={onRemove} title="Remove from plan" aria-label="Remove from plan" className={buttonClass("ghost", "icon-sm")}>
              <Icon.x className="w-3.5 h-3.5" />
            </button>
          </div>

          {hasSubs ? (
            <span className="w-[60px] text-right font-mono text-[12px] text-fg-subtle">{totalMin > 0 ? fmt(totalMin) : ""}</span>
          ) : editingTime ? (
            <input
              autoFocus
              type="text"
              inputMode="numeric"
              value={timeVal}
              onChange={(e) => setTimeVal(e.target.value.replace(/\D/g, ""))}
              onBlur={saveTime}
              onKeyDown={(e) => { if (e.key === "Enter") saveTime(); if (e.key === "Escape") setEditingTime(false); }}
              aria-label="Minutes"
              className={`${FIELD} !h-7 w-[60px] text-center font-mono !text-[12px]`}
            />
          ) : (
            <button
              onClick={() => { setTimeVal(String(item.estimatedMinutes || 25)); setEditingTime(true); }}
              className="w-[60px] h-7 inline-flex items-center justify-end gap-1 rounded-md px-1.5 font-mono text-[12px] text-fg-muted hover:text-fg hover:bg-surface-hover transition-colors"
              title="Set time estimate"
            >
              <Icon.clock className="w-3 h-3 text-fg-subtle" />
              {item.estimatedMinutes ? fmt(item.estimatedMinutes) : "set"}
            </button>
          )}

          {/* A fixed slot, so the estimates line up whether or not a row can be timed. */}
          <span className="w-7 h-7 flex items-center justify-center">
            {canStart && (
              <button
                data-tour-pomo={item.refId || item.uid}
                onClick={() => { if (!pomoActive || isThisPomo) onStartPomo(item); }}
                disabled={pomoActive && !isThisPomo}
                aria-label="Start focus"
                title={pomoActive && !isThisPomo ? "Stop the running session first" : isThisPomo ? "Focusing on this" : "Start focus"}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                  isThisPomo
                    ? "bg-brand text-white"
                    : "border border-line-strong text-fg-muted enabled:hover:bg-primary enabled:hover:text-on-primary enabled:hover:border-transparent"
                }`}
              >
                <Icon.start className="w-3 h-3 ml-px" />
              </button>
            )}
          </span>

          <Icon.chevronDown className={`w-4 h-4 text-fg-subtle transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="bg-surface-subtle border-t border-line pl-[42px] sm:pl-[66px] pr-4 py-4 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
                <span className="inline-flex items-center gap-1.5 text-fg-muted">
                  <Icon.clock className="w-3.5 h-3.5 text-fg-subtle" />
                  {daySec > 0 ? (
                    <span><span className="font-mono text-fg">{fmtSpent(daySec)}</span> spent {dayLabel}</span>
                  ) : (
                    <span>No time logged {dayLabel}</span>
                  )}
                  {overallSec > 0 && <span className="text-fg-subtle">· <span className="font-mono">{fmtSpent(overallSec)}</span> in total</span>}
                </span>
                {canLog && (
                  <form onSubmit={logTime} className="ml-auto flex items-center gap-1.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={logVal}
                      onChange={(e) => setLogVal(e.target.value.replace(/\D/g, "").slice(0, 3))}
                      placeholder="min"
                      aria-label="Minutes spent"
                      className={`${FIELD} !h-7 w-14 text-center font-mono !text-[12px]`}
                    />
                    <button
                      type="submit"
                      disabled={!(parseInt(logVal) > 0)}
                      className={buttonClass("secondary", "sm")}
                      title={`Add time you spent on this card ${dayLabel} without the timer`}
                    >
                      Log time
                    </button>
                  </form>
                )}
              </div>

              {item.source === "custom" && hasSubs && (
                <div>
                  <h4 className="text-[12px] font-medium text-fg-muted mb-2">Sub-tasks</h4>
                  <ul className="rounded-md border border-line bg-canvas divide-y divide-line">
                    {subs.map((s) => (
                      <li key={s.uid} className="group flex items-center gap-3 px-3 min-h-[40px] py-1.5">
                        <CheckCircle small done={s.completed} disabled={!canComplete} onClick={() => onToggleSubItem(item.uid, s.uid)} />
                        <span className={`flex-1 min-w-0 truncate text-[13px] ${s.completed ? "line-through text-fg-subtle" : "text-fg"}`}>{s.title}</span>

                        {subSec(s.uid) > 0 && (
                          <span className="font-mono text-[12px] text-success-fg" title={`Time spent ${dayLabel}`}>{fmtSpent(subSec(s.uid))}</span>
                        )}
                        {editingSubTime === s.uid ? (
                          <input
                            autoFocus
                            type="text"
                            inputMode="numeric"
                            value={subTimeVal}
                            onChange={(e) => setSubTimeVal(e.target.value.replace(/\D/g, ""))}
                            onBlur={() => saveSubTime(s.uid)}
                            onKeyDown={(e) => { if (e.key === "Enter") saveSubTime(s.uid); if (e.key === "Escape") setEditingSubTime(null); }}
                            aria-label="Minutes"
                            className={`${FIELD} !h-7 w-14 text-center font-mono !text-[12px]`}
                          />
                        ) : (
                          <button
                            onClick={() => { setSubTimeVal(String(s.estimatedMinutes || 25)); setEditingSubTime(s.uid); }}
                            className="h-7 px-1.5 rounded-md font-mono text-[12px] text-fg-muted hover:text-fg hover:bg-surface-hover transition-colors"
                            title="Set time estimate"
                          >
                            {s.estimatedMinutes ? fmt(s.estimatedMinutes) : "set"}
                          </button>
                        )}

                        {dayIsToday && (s.estimatedMinutes || 0) > 0 && !s.completed && (
                          <button
                            onClick={() => { if (!pomoActive) onStartPomo(item, s); }}
                            disabled={pomoActive}
                            aria-label="Start focus"
                            title={pomoActive ? "Stop the running session first" : "Start focus"}
                            className="w-6 h-6 rounded-full flex items-center justify-center border border-line-strong text-fg-muted enabled:hover:bg-primary enabled:hover:text-on-primary enabled:hover:border-transparent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <Icon.start className="w-2.5 h-2.5 ml-px" />
                          </button>
                        )}

                        <button onClick={() => onRemoveSubItem(item.uid, s.uid)} aria-label="Remove sub-task" className={`${buttonClass("ghost", "icon-sm")} ${HOVER_REVEAL}`}>
                          <Icon.x className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {item.source === "custom" && canComplete && (
                <div className="flex gap-2">
                  <input
                    value={subInput}
                    onChange={(e) => setSubInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addSub(); }}
                    placeholder="Add a sub-task"
                    className={`${FIELD} flex-1 min-w-0`}
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={subTimeInput}
                    onChange={(e) => setSubTimeInput(e.target.value.replace(/\D/g, ""))}
                    className={`${FIELD} w-16 text-center font-mono`}
                    placeholder="min"
                    title="Time estimate (minutes)"
                  />
                  <Button onClick={addSub} disabled={!subInput.trim()}>Add</Button>
                </div>
              )}

              {item.source === "corestack" && (
                <CoreStackTopicDetail
                  topic={coreStackTopic}
                  note={note}
                  checkedDays={complete ? coreStackDaysSinceChecked(item.refId) : null}
                />
              )}
              {item.source === "projects" && (
                <ProjectTopicDetail
                  topic={projectTopic}
                  note={note}
                  checkedDays={complete ? projectDaysSinceChecked(item.refId) : null}
                />
              )}
              {item.source === "aistack" && (
                <AIStackTopicDetail
                  topic={aiStackTopic}
                  note={note}
                  checkedDays={complete ? aiStackDaysSinceChecked(item.refId) : null}
                />
              )}
              {item.source === "interview" && <InterviewCardDetail item={interviewCard} note={note} onNoteChange={onNoteChange} />}
              {item.source === "dsa" && <DsaProblemDetail problem={dsaProblem} note={note} onNoteChange={onNoteChange} isStarred={isStarred} onToggleStar={onToggleStar} solvedDays={solvedDays} />}
              {item.source === "custom" && (
                <div>
                  <h4 className="text-[12px] font-medium text-fg-muted mb-2">Notes</h4>
                  <textarea
                    value={localNote}
                    onChange={handleNoteInput}
                    placeholder="What you worked on, key takeaways, blockers"
                    rows={4}
                    className="w-full p-3 text-[13px] leading-relaxed rounded-md border border-line-strong bg-canvas text-fg placeholder:text-fg-subtle focus:outline-none focus:border-focus focus:ring-1 focus:ring-focus resize-y min-h-[80px]"
                  />
                </div>
              )}

              <div className="sm:hidden flex items-center gap-2 pt-1">
                {onMove && (
                  <Button size="sm" onClick={onMove}>
                    <Icon.arrowRight className="w-3.5 h-3.5" />
                    Move to {moveLabel.toLowerCase()}
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={onRemove}>
                  <Icon.x className="w-3.5 h-3.5" />
                  Remove
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Time Spent ──────────────────────────────────────────────────────────────
// Everything the day's time went to — including cards since moved to another
// day or removed, whose time stays here. A row's time can be corrected.
function TimeSpent({ rows, dayLabel, canEdit, onSetTime, className = "" }) {
  const [editing, setEditing] = useState(null);
  const [val, setVal] = useState("");
  const total = rows.reduce((a, r) => a + r.sec, 0);

  const save = (row) => {
    const m = parseInt(val);
    if (!Number.isNaN(m) && m !== Math.round(row.sec / 60)) onSetTime(row.target, m * 60);
    setEditing(null);
  };

  return (
    <section className={`rounded-lg border border-line bg-canvas ${className}`}>
      <div className="flex items-center justify-between px-4 h-11 border-b border-line">
        <h2 className="text-[13px] font-medium text-fg">Time spent {dayLabel}</h2>
        <span className="font-mono text-[12px] text-fg-muted">{fmtSpent(total)}</span>
      </div>
      <ul className="divide-y divide-line">
        {rows.map((r) => (
          <li key={r.target} className="flex items-center gap-3 px-4 py-2.5">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-fg truncate" title={r.title}>{r.title}</p>
              <p className="text-[12px] text-fg-subtle truncate">
                {(SOURCE_META[r.source] || SOURCE_META.custom).label}
                {r.where && ` · ${r.where}`}
              </p>
            </div>
            {editing === r.target ? (
              <input
                autoFocus
                type="text"
                inputMode="numeric"
                value={val}
                onChange={(e) => setVal(e.target.value.replace(/\D/g, "").slice(0, 4))}
                onBlur={() => save(r)}
                onKeyDown={(e) => { if (e.key === "Enter") save(r); if (e.key === "Escape") setEditing(null); }}
                aria-label="Minutes spent"
                className={`${FIELD} !h-7 w-14 text-center font-mono !text-[12px]`}
              />
            ) : (
              <button
                onClick={() => { setVal(String(Math.round(r.sec / 60))); setEditing(r.target); }}
                disabled={!canEdit || r.live}
                title={r.live ? "Timer running" : canEdit ? "Correct the time (minutes, 0 removes it)" : undefined}
                className="shrink-0 inline-flex items-center gap-1.5 h-7 px-1.5 rounded-md font-mono text-[13px] tabular-nums text-fg enabled:hover:bg-surface-hover transition-colors"
              >
                {r.live && <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />}
                {fmtSpent(r.sec)}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─── Card Picker ─────────────────────────────────────────────────────────────
function CardPicker({ dayItems, onClose, onAdd, showAI, showPriority }) {
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

  const coreStackResults = useMemo(() => {
    if (tab !== "corestack") return [];
    return CORE_STACK_TOPICS.filter(
      (t) => !q || t.title.toLowerCase().includes(q) || (showPriority && t.priority.toLowerCase() === q)
    );
  }, [tab, q, showPriority]);

  const aiStackResults = useMemo(() => {
    if (tab !== "aistack" || !showAI) return [];
    return AI_STACK_TOPICS.filter(
      (t) =>
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.id.toLowerCase() === q ||
        t.priority.toLowerCase() === q ||
        t.sectionLabel.toLowerCase().includes(q)
    );
  }, [tab, q, showAI]);

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
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full sm:max-w-lg bg-canvas rounded-t-xl sm:rounded-xl border border-line shadow-overlay max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <h3 className="text-[15px] font-semibold text-fg">Add a task</h3>
          <button data-tour="picker-close" onClick={onClose} aria-label="Close" className={buttonClass("ghost", "icon-sm")}>
            <Icon.x />
          </button>
        </div>

        <div className="px-4 pt-3">
          <div role="tablist" className="flex gap-0.5 p-0.5 rounded-md bg-surface-hover">
          {[
            { key: "custom", label: "Custom" },
            { key: "corestack", label: "Core" },
            ...(showAI ? [{ key: "aistack", label: "AI" }] : []),
            { key: "dsa", label: "DSA" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              role="tab"
              aria-selected={tab === t.key}
              className={`flex-1 h-7 text-[13px] font-medium rounded transition-colors ${
                tab === t.key ? "bg-canvas text-fg shadow-xs" : "text-fg-muted hover:text-fg"
              }`}
            >
              {t.label}
            </button>
          ))}
          </div>
        </div>

        {tab !== "custom" && (
          <div className="px-4 pt-3">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tab === "dsa" ? "Search problems or patterns" : "Search topics"}
              className={`${FIELD} w-full h-9`}
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {tab === "corestack" && (
            <ul className="space-y-0.5">
              {coreStackResults.map((t) => {
                const added = addedKey.has(`corestack:${t.id}`);
                return (
                  <li key={t.id}>
                    <button
                      disabled={added}
                      onClick={() => onAdd(coreStackPlanItem(t))}
                      className={`w-full flex items-center gap-2.5 px-3 h-10 rounded-md text-left transition-colors ${added ? "cursor-default" : "hover:bg-surface-hover"}`}
                    >
                      {showPriority && <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 border ${CORE_STACK_PRIORITY_CONFIG[t.priority].cls}`}>{t.priority}</span>}
                      <span className="flex-1 min-w-0 text-[13px] text-fg truncate">{t.title}</span>
                      {added ? <span className="inline-flex items-center gap-1 text-[12px] text-success-fg shrink-0"><Icon.check className="w-3.5 h-3.5" />Added</span> : <Icon.plus className="w-4 h-4 text-fg-subtle" />}
                    </button>
                  </li>
                );
              })}
              {coreStackResults.length === 0 && <p className="text-center text-[13px] text-fg-subtle py-8">No matches</p>}
            </ul>
          )}

          {tab === "aistack" && showAI && (
            <ul className="space-y-0.5">
              {aiStackResults.map((t) => {
                const added = addedKey.has(`aistack:${t.id}`);
                return (
                  <li key={t.id}>
                    <button
                      disabled={added}
                      onClick={() => onAdd(aiStackPlanItem(t))}
                      className={`w-full flex items-center gap-2.5 px-3 h-10 rounded-md text-left transition-colors ${added ? "cursor-default" : "hover:bg-surface-hover"}`}
                    >
                      <span className="font-mono text-[11px] px-1.5 h-[18px] inline-flex items-center rounded shrink-0 border border-line text-fg-muted">{t.id}</span>
                      <span className="flex-1 min-w-0 text-[13px] text-fg truncate">{t.title}</span>
                      {added ? <span className="inline-flex items-center gap-1 text-[12px] text-success-fg shrink-0"><Icon.check className="w-3.5 h-3.5" />Added</span> : <Icon.plus className="w-4 h-4 text-fg-subtle" />}
                    </button>
                  </li>
                );
              })}
              {aiStackResults.length === 0 && <p className="text-center text-[13px] text-fg-subtle py-8">No matches</p>}
            </ul>
          )}

          {tab === "dsa" && (
            <ul className="space-y-0.5">
              {dsaResults.map((p) => {
                const added = addedKey.has(`dsa:${p.id}`);
                return (
                  <li key={p.id}>
                    <button
                      disabled={added}
                      onClick={() => onAdd({ uid: uid(), source: "dsa", refId: p.id, title: p.title, meta: p.topic, link: p.link, estimatedMinutes: 25 })}
                      className={`w-full flex items-center gap-2.5 px-3 h-10 rounded-md text-left transition-colors ${added ? "cursor-default" : "hover:bg-surface-hover"}`}
                    >
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 ${DSA_DIFFICULTY_CONFIG[p.difficulty]}`}>{p.difficulty}</span>
                      <span className="flex-1 min-w-0 text-[13px] text-fg truncate">{p.title}</span>
                      {added ? <span className="inline-flex items-center gap-1 text-[12px] text-success-fg shrink-0"><Icon.check className="w-3.5 h-3.5" />Added</span> : <Icon.plus className="w-4 h-4 text-fg-subtle" />}
                    </button>
                  </li>
                );
              })}
              {dsaResults.length === 0 && <p className="text-center text-[13px] text-fg-subtle py-8">No matches</p>}
            </ul>
          )}

          {tab === "custom" && (
            <div className="space-y-3">
              <div>
                <label className="block mb-1.5 text-[12px] font-medium text-fg-muted">Title</label>
                <input
                  data-tour="custom-title"
                  autoFocus
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && customTitle.trim()) addCustom(); }}
                  placeholder="e.g. Mock interview, Sharding deep-dive"
                  className={`${FIELD} w-full h-9`}
                />
              </div>

              {!hasSubs && (
                <div>
                  <label className="block mb-1.5 text-[12px] font-medium text-fg-muted">Time estimate (minutes)</label>
                  <input
                    data-tour="custom-time"
                    type="text"
                    inputMode="numeric"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value.replace(/\D/g, ""))}
                    className={`${FIELD} w-full h-9`}
                  />
                  <p className="text-[12px] text-fg-subtle mt-1.5"><span className="font-mono">{fmt(parseInt(customTime) || 0)}</span> · {((n) => `${n} focus session${n === 1 ? "" : "s"}`)(buildSessions(parseInt(customTime) || 0).filter((s) => s.type === "work").length)}</p>
                </div>
              )}

              <div>
                <label className="block mb-1.5 text-[12px] font-medium text-fg-muted">Sub-tasks (optional){hasSubs ? ` — ${fmt(subItems.reduce((s, i) => s + (i.estimatedMinutes || 0), 0))} total` : ""}</label>
                {hasSubs && (
                  <div className="space-y-1 mt-1.5">
                    {subItems.map((s) => (
                      <div key={s.uid} className="flex items-center gap-2 pl-3 pr-1 h-9 rounded-md border border-line text-[13px]">
                        <span className="flex-1 min-w-0 truncate text-fg">{s.title}</span>
                        <span className="font-mono text-[12px] text-fg-subtle shrink-0">{fmt(s.estimatedMinutes || 0)}</span>
                        <button onClick={() => setSubItems(subItems.filter((x) => x.uid !== s.uid))} aria-label="Remove sub-task" className={buttonClass("ghost", "icon-sm")}><Icon.x className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-1.5">
                  <input
                    value={subInput}
                    onChange={(e) => setSubInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addSub(); }}
                    placeholder="Add a sub-task"
                    className={`${FIELD} flex-1 min-w-0`}
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={subTimeInput}
                    onChange={(e) => setSubTimeInput(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => { if (e.key === "Enter") addSub(); }}
                    className={`${FIELD} w-16 text-center font-mono`}
                    placeholder="min"
                    title="Minutes"
                  />
                  <Button onClick={addSub} disabled={!subInput.trim()}>Add</Button>
                </div>
                {hasSubs && (
                  <p className="text-[12px] text-fg-subtle mt-1.5">Each sub-task has its own estimate and its own timer.</p>
                )}
              </div>

              <div>
                <label className="block mb-1.5 text-[12px] font-medium text-fg-muted">Notes (optional)</label>
                <textarea
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  rows={2}
                  placeholder="Any details"
                  className={`${FIELD} w-full h-9 !h-auto py-2 resize-y`}
                />
              </div>
              <button
                data-tour="custom-add"
                onClick={addCustom}
                disabled={!customTitle.trim()}
                className={`${buttonClass("primary")} w-full !h-9`}
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
  // AI Stack is owner-only, so its topics stay out of the picker for anyone
  // else, and so are Core Stack priorities.
  const [canSeeAI, setCanSeeAI] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), (user) => {
      setCanSeeAI(isOwner(user));
      setIsGuest(!user);
      setAuthReady(true);
    });
    return unsub;
  }, []);
  useEffect(() => { backfillDsaTimestamps(); }, []);
  // Once the account is known, so the moved time lands in (and syncs to) it.
  useEffect(() => { if (authReady) migrateCardTime(); }, [authReady]);

  const today = dateKey();
  const [current, setCurrent] = useState(today);
  const [storedItems, setItems] = useState(() => getDay(today));
  // A signed-out visitor sees a sample day (Data/planDemo) instead of an empty
  // page. It's display-only: every change asks them to sign in, and once they
  // do, they see their own plan.
  // The site tour plans a real (throwaway) day, so it sees the signed-in view.
  const sandbox = useTourSandbox();
  const demo = useMemo(() => (isGuest && !sandbox && current === today ? demoPlan(today) : null), [isGuest, sandbox, current, today]);
  const items = demo ? demo.items : storedItems;
  const [ipCompleted, setIpCompleted] = useState(() => loadJSON(KEYS.IP_COMPLETED, {}));
  const [dsaCompleted, setDsaCompleted] = useState(() => loadJSON(KEYS.DSA_COMPLETED, {}));
  const [ipNotes, setIpNotes] = useState(() => loadJSON(KEYS.IP_NOTES, {}));
  const [csCompleted, setCsCompleted] = useState(() => loadJSON(KEYS.CS_COMPLETED, {}));
  const [csNotes, setCsNotes] = useState(() => loadJSON(KEYS.CS_NOTES, {}));
  const [aiCompleted, setAiCompleted] = useState(() => loadJSON(KEYS.AI_COMPLETED, {}));
  const [aiNotes, setAiNotes] = useState(() => loadJSON(KEYS.AI_NOTES, {}));
  const [pjCompleted, setPjCompleted] = useState(() => loadJSON(KEYS.PJ_COMPLETED, {}));
  const [pjNotes, setPjNotes] = useState(() => loadJSON(KEYS.PJ_NOTES, {}));
  const [dsaNotes, setDsaNotes] = useState(() => loadJSON(KEYS.DSA_NOTES, {}));
  const [dsaStarred, setDsaStarredMap] = useState(() => loadJSON(KEYS.DSA_STARRED, {}));
  const [timeLog, setTimeLog] = useState(() => getTimeLog());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [openItem, setOpenItem] = useState(null);
  const [calOpen, setCalOpen] = useState(false);
  const [showDone, setShowDone] = useState(true);

  // Keys: N adds a task, T goes to today, ← and → step a day. Not while
  // typing, and not while the picker or calendar is open.
  useEffect(() => {
    if (pickerOpen || calOpen) return undefined;
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      const t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      const key = e.key.toLowerCase();
      if (key === "n") { e.preventDefault(); setPickerOpen(true); }
      else if (key === "t") setCurrent(dateKey());
      else if (key === "arrowleft") setCurrent((c) => addDays(c, -1));
      else if (key === "arrowright") setCurrent((c) => addDays(c, 1));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pickerOpen, calOpen]);

  // The timer is saved to the account, so a refresh, another tab or another
  // device picks it up where it is.
  const [pomo, setPomo] = useState(loadPomo);
  const pomoRef = useRef(pomo);
  useEffect(() => { pomoRef.current = pomo; }, [pomo]);
  const showPomo = useCallback((next) => {
    pomoRef.current = next;
    setPomo(next);
  }, []);
  // A change made here: shown, and saved. Only these are saved — never a
  // timer this page merely loaded, which may be the signed-out one (see the
  // subscription below) and would overwrite the account's running timer.
  const commitPomo = useCallback((next) => {
    showPomo(next);
    saveJSON(KEYS.POMO_STATE, storedPomo(next));
  }, [showPomo]);

  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);

  const currentRef = useRef(current);
  useEffect(() => { currentRef.current = current; }, [current]);
  useEffect(() => setItems(getDay(current)), [current]);

  useEffect(
    () =>
      subscribe((key, info = {}) => {
        if (key === KEYS.IP_COMPLETED) setIpCompleted(loadJSON(KEYS.IP_COMPLETED, {}));
        if (key === KEYS.DSA_COMPLETED) setDsaCompleted(loadJSON(KEYS.DSA_COMPLETED, {}));
        if (key === KEYS.IP_NOTES) setIpNotes(loadJSON(KEYS.IP_NOTES, {}));
        if (key === KEYS.CS_COMPLETED) setCsCompleted(loadJSON(KEYS.CS_COMPLETED, {}));
        if (key === KEYS.CS_NOTES) setCsNotes(loadJSON(KEYS.CS_NOTES, {}));
        if (key === KEYS.AI_COMPLETED) setAiCompleted(loadJSON(KEYS.AI_COMPLETED, {}));
        if (key === KEYS.AI_NOTES) setAiNotes(loadJSON(KEYS.AI_NOTES, {}));
        if (key === KEYS.PJ_COMPLETED) setPjCompleted(loadJSON(KEYS.PJ_COMPLETED, {}));
        if (key === KEYS.PJ_NOTES) setPjNotes(loadJSON(KEYS.PJ_NOTES, {}));
        if (key === KEYS.DSA_NOTES) setDsaNotes(loadJSON(KEYS.DSA_NOTES, {}));
        if (key === KEYS.DSA_STARRED) setDsaStarredMap(loadJSON(KEYS.DSA_STARRED, {}));
        if (key === KEYS.TIME_LOG) setTimeLog(getTimeLog());
        if (key === KEYS.PLAN_DAYS) {
          setItems(getDay(currentRef.current));
          // Cards synced from a device that hasn't moved their time out yet.
          // Deferred: not a write from inside the sync layer's own update.
          if (info.remote || info.account) setTimeout(migrateCardTime, 0);
        }
        // The timer changed in another tab or on another device — or the
        // account changed: on a refresh this page opens before sign-in is
        // restored, so at first it read the signed-out timer (none).
        if (key === KEYS.POMO_STATE && (info.remote || info.external || info.account || info.blocked)) {
          showPomo(loadPomo());
        }
      }),
    [showPomo]
  );

  const isRunning = pomo?.status === "running";
  useEffect(() => {
    if (!isRunning) return undefined;
    const tick = () => {
      const p = pomoRef.current;
      if (!p || p.status !== "running") return;
      const { pomo: advanced, entered } = advancePomo(p);
      if (advanced === p) return;
      // One sound for however many sessions went by while the tab was hidden.
      const last = entered[entered.length - 1];
      if (last === "complete") playSound("timerDone");
      else if (last !== undefined) playSound(advanced.sessions[last].type === "work" ? "focusStart" : "breakStart");
      if (advanced.status !== "complete") {
        showPomo(advanced);
        return;
      }
      // Finished: log its time and save it as done — going by the saved
      // timer, which another tab or device may have paused, extended, stopped
      // or finished already (that change may not have reached this page yet).
      const saved = loadPomo();
      if (sameTimer(saved, advanced) && saved.status === "complete") commitPomo(flushPomo(saved));
      else showPomo(saved);
    };
    // Twice a second, so the display never skips a second through timer
    // jitter; each tick advances by the clock, however late it runs.
    const id = setInterval(tick, 500);
    // Coming back to the tab: catch up at once, not on the next (throttled) tick.
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isRunning, showPomo, commitPomo]);

  const toggleStar = useCallback((id) => {
    const next = !dsaStarred[id];
    setDsaStarred(id, next);
    setDsaStarredMap((m) => ({ ...m, [id]: next }));
  }, [dsaStarred]);

  const persist = useCallback((next) => {
    setItems(next);
    setDay(current, next);
  }, [current]);

  // Log the timer's time and stop it, if it's timing this card — or, given a
  // subUid, that sub-task (null: the card itself, not one of its sub-tasks).
  const stopPomoOn = useCallback((itemUid, subUid) => {
    const p = pomoRef.current;
    if (!p || p.itemUid !== itemUid) return;
    if (subUid !== undefined && (p.subItemUid || null) !== subUid) return;
    flushPomo(p);
    commitPomo(null);
  }, [commitPomo]);

  const resolve = useCallback((item) => {
    if (demo) return { complete: demo.complete.has(item.uid), note: "" };
    if (item.source === "custom") return { complete: !!item.completed, note: item.notes || "" };
    if (item.source === "dsa") return { complete: !!dsaCompleted[item.refId], note: dsaNotes[item.refId] || "" };
    if (item.source === "corestack") return { complete: !!csCompleted[item.refId], note: csNotes[item.refId] || "" };
    if (item.source === "aistack") return { complete: !!aiCompleted[item.refId], note: aiNotes[item.refId] || "" };
    if (item.source === "projects") return { complete: !!pjCompleted[item.refId], note: pjNotes[item.refId] || "" };
    return { complete: !!ipCompleted[item.refId], note: ipNotes[item.refId] || "" };
  }, [demo, ipCompleted, dsaCompleted, csCompleted, aiCompleted, pjCompleted, ipNotes, dsaNotes, csNotes, aiNotes, pjNotes]);

  const addItem = useCallback((item) => {
    if (item.source !== "custom" && items.some((i) => i.source === item.source && i.refId === item.refId)) return;
    persist([...items, item]);
  }, [items, persist]);

  // The card's time stays in the log, on the days it was spent.
  const removeItem = useCallback((id) => {
    stopPomoOn(id);
    persist(items.filter((i) => i.uid !== id));
  }, [items, persist, stopPomoOn]);

  const moveItem = useCallback((item, targetKey) => {
    if (targetKey === current) return;
    stopPomoOn(item.uid);
    persist(items.filter((i) => i.uid !== item.uid));
    const targetItems = getDay(targetKey);
    const dup = item.source !== "custom" && targetItems.some((i) => i.source === item.source && i.refId === item.refId);
    if (!dup) setDay(targetKey, [...targetItems, item]);
  }, [items, current, persist, stopPomoOn]);

  const toggleComplete = useCallback((item) => {
    if (current !== today) return;
    const hasSubs = (item.subItems || []).length > 0;
    if (item.source === "custom" && hasSubs) return; // parent auto-completes with sub-tasks

    // If a timer is running for this exact task, log its time and stop it.
    stopPomoOn(item.uid, null);

    if (item.source === "custom") {
      const next = !item.completed;
      persist(items.map((i) => (i.uid === item.uid ? { ...i, completed: next } : i)));
      if (next) playSound("taskDone");
      return;
    }

    const next = !resolve(item).complete;
    setSourceComplete(item.source, item.refId, next);
    if (item.source === "dsa") setDsaCompleted((m) => ({ ...m, [item.refId]: next }));
    else if (item.source === "corestack") setCsCompleted((m) => ({ ...m, [item.refId]: next }));
    else if (item.source === "aistack") setAiCompleted((m) => ({ ...m, [item.refId]: next }));
    else if (item.source === "projects") setPjCompleted((m) => ({ ...m, [item.refId]: next }));
    else setIpCompleted((m) => ({ ...m, [item.refId]: next }));
    if (next) playSound("taskDone");
  }, [items, current, today, persist, resolve, stopPomoOn]);

  const changeNote = useCallback((item, val) => {
    if (item.source === "custom") { persist(items.map((i) => (i.uid === item.uid ? { ...i, notes: val } : i))); return; }
    setSourceNote(item.source, item.refId, val);
    if (item.source === "dsa") setDsaNotes((m) => ({ ...m, [item.refId]: val }));
    else if (item.source === "corestack") setCsNotes((m) => ({ ...m, [item.refId]: val }));
    else if (item.source === "aistack") setAiNotes((m) => ({ ...m, [item.refId]: val }));
    else if (item.source === "projects") setPjNotes((m) => ({ ...m, [item.refId]: val }));
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
    // If a timer is running for this exact sub-task, log its time and stop it.
    stopPomoOn(itemUid, subUid);
    persist(items.map((i) => {
      if (i.uid !== itemUid) return i;
      const subs = (i.subItems || []).map((s) => (s.uid === subUid ? { ...s, completed: !s.completed } : s));
      const toggled = subs.find((s) => s.uid === subUid);
      if (toggled?.completed) playSound("taskDone");
      const allDone = subs.length > 0 && subs.every((s) => s.completed);
      if (allDone && !i.completed) playSound("timerDone");
      return { ...i, subItems: subs, completed: allDone };
    }));
  }, [items, persist, current, today, stopPomoOn]);

  const addSubItem = useCallback((itemUid, title, estimatedMinutes = 25) => {
    persist(items.map((i) => (i.uid !== itemUid ? i : {
      ...i,
      subItems: [...(i.subItems || []), { uid: uid(), title, completed: false, estimatedMinutes }],
      completed: false,
    })));
  }, [items, persist]);

  const removeSubItem = useCallback((itemUid, subUid) => {
    stopPomoOn(itemUid, subUid);
    persist(items.map((i) => {
      if (i.uid !== itemUid) return i;
      const subs = (i.subItems || []).filter((s) => s.uid !== subUid);
      const allDone = subs.length > 0 && subs.every((s) => s.completed);
      return { ...i, subItems: subs, completed: subs.length > 0 ? allDone : i.completed };
    }));
  }, [items, persist, stopPomoOn]);

  const startPomo = useCallback((item, subItem) => {
    if (!requireAuth("Sign in to time your focus sessions — the time is saved to your account.")) return;
    const target = subItem || item;
    const mins = target.estimatedMinutes || 25;
    const sessions = buildSessions(mins);
    if (!sessions.length) return;
    playSound("focusStart");
    commitPomo({
      id: uid(),
      itemUid: item.uid,
      subItemUid: subItem?.uid || null,
      // Its time is logged against this card, on the day it started.
      card: cardRef(item),
      day: dateKey(),
      itemTitle: subItem ? `${item.title} → ${subItem.title}` : item.title,
      sessions,
      currentIdx: 0,
      remaining: sessions[0].duration,
      status: "running",
      anchor: Date.now(),
      flushedSec: 0,
    });
  }, [commitPomo]);

  const extendPomo = useCallback((addMinutes) => {
    const p = pomoRef.current;
    const extra = buildSessions(addMinutes);
    if (!p || !extra.length) return;
    const sessions = [...p.sessions, ...extra];
    commitPomo({ ...p, sessions, currentIdx: p.sessions.length, remaining: extra[0].duration, status: "running", anchor: Date.now() });
    playSound("focusStart");
  }, [commitPomo]);

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

  // Logged time: this day's, per card, and each card's total over every day.
  const { dayLog, totals } = useMemo(() => {
    const dayLog = {};
    const totals = {};
    for (const e of Object.values(demo ? demo.timeLog : timeLog)) {
      totals[e.target] = (totals[e.target] || 0) + e.sec;
      if (e.day === current) dayLog[e.target] = e;
    }
    return { dayLog, totals };
  }, [demo, timeLog, current]);

  // Cards with time this day that are no longer on its plan: where they went.
  const whereNow = useMemo(() => {
    const onPlan = new Set(items.map(timeTarget));
    const days = loadJSON(KEYS.PLAN_DAYS, {});
    const out = {};
    for (const target of Object.keys(dayLog)) {
      if (onPlan.has(target)) continue;
      const on = Object.keys(days).filter((d) => d !== current && (days[d] || []).some((i) => timeTarget(i) === target)).sort();
      const to = on.find((d) => d > current) || on[on.length - 1];
      out[target] = to ? `Moved to ${dayName(to, today)}` : "Removed";
    }
    return out;
  }, [dayLog, items, current, today]);

  // The running timer's seconds not logged yet count too.
  const liveCard = pomoCard(pomo);
  const liveTarget = liveCard && timeTarget(liveCard);
  const liveSec = liveCard ? unloggedSec(pomo) : 0;
  const liveToday = liveSec > 0 && (pomo.day || today) === current;

  const timeOn = (item) => {
    const target = timeTarget(item);
    const entry = dayLog[target];
    const live = target === liveTarget ? liveSec : 0;
    return {
      daySec: (entry?.sec || 0) + (liveToday ? live : 0),
      totalSec: (totals[target] || 0) + live,
      subSec: (subUid) => ((entry?.subs || {})[subUid] || 0) + (liveToday && live && pomo.subItemUid === subUid ? live : 0),
    };
  };

  const timeRows = Object.values(dayLog).map((e) => ({ ...e, where: whereNow[e.target] }));
  if (liveToday) {
    const row = timeRows.find((r) => r.target === liveTarget);
    if (row) Object.assign(row, { sec: row.sec + liveSec, live: true });
    else timeRows.push({ target: liveTarget, source: liveCard.source, title: liveCard.title, sec: liveSec, live: true });
  }
  const planOrder = new Map(items.map((i, n) => [timeTarget(i), n]));
  timeRows.sort((a, b) => (planOrder.get(a.target) ?? 1e9) - (planOrder.get(b.target) ?? 1e9) || a.title.localeCompare(b.title));

  const canLog = current <= today; // no time spent on a day that hasn't come
  const dayLabel = isToday ? "today" : current === addDays(today, -1) ? "yesterday" : "this day";
  const totalPlanned = items.reduce((s, i) => s + itemTotalMinutes(i), 0);
  const totalDone = Math.round(timeRows.reduce((s, r) => s + r.sec, 0) / 60);

  // Open tasks first, finished ones in their own list below. Each keeps its
  // place in the day's order, which dragging changes.
  const rows = items.map((item, idx) => ({ item, idx, ...resolve(item) }));
  const openRows = rows.filter((r) => !r.complete);
  const doneRows = rows.filter((r) => r.complete);
  const minutesLeft = openRows.reduce((s, { item }) => {
    const subs = item.subItems || [];
    if (subs.length) return s + subs.filter((x) => !x.completed).reduce((a, x) => a + (x.estimatedMinutes || 0), 0);
    return s + (item.estimatedMinutes || 0);
  }, 0);

  // The first open task (or sub-task) with an estimate: what to focus on next.
  let nextUp = null;
  for (const { item } of openRows) {
    const subs = item.subItems || [];
    if (subs.length) {
      const sub = subs.find((x) => !x.completed && x.estimatedMinutes > 0);
      if (sub) { nextUp = { item, sub }; break; }
    } else if (item.estimatedMinutes > 0) {
      nextUp = { item };
      break;
    }
  }

  // Each day of the week strip: how many tasks, how many done.
  const statsFor = (key) => {
    const list = key === current ? items : getDay(key);
    return { total: list.length, done: key === current ? doneCount : list.filter((i) => resolve(i).complete).length };
  };

  const openPicker = () => setPickerOpen(true);
  const dayWord = relativeLabel(current).toLowerCase();

  const renderRow = ({ item, idx, complete, note }) => (
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
      solvedDays={item.source === "dsa" && complete ? dsaDaysSinceSolved(item.refId) : null}
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
      {...timeOn(item)}
      dayLabel={dayLabel}
      canLog={canLog}
      onLogTime={(minutes) => addTime(current, item, minutes * 60)}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      isDragging={dragIdx === idx}
      isOver={overIdx === idx && dragIdx !== idx}
    />
  );

  const timeSpent = (className) =>
    timeRows.length > 0 && (
      <TimeSpent
        className={className}
        rows={timeRows}
        dayLabel={dayLabel}
        canEdit={canLog}
        onSetTime={(target, sec) => setDayTime(current, target, sec)}
      />
    );

  if (!authReady) return <PageSkeleton />;

  return (
    <PageShell allowSticky>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {isGuest && !sandbox && (
          <div className="mt-6">
            <OfferHero onTour={() => startTour()} onSignIn={() => requestSignIn()} />
          </div>
        )}

        {/* The day: its date, the way to other days, and the one main action. */}
        <header className="pt-10 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[12px] text-fg-subtle">{prettyDate(current)}</p>
            <h1 className="mt-1 text-[32px] leading-10 font-semibold tracking-[-0.02em] text-fg">{relativeLabel(current)}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex h-8 items-stretch rounded-md border border-line-strong bg-canvas overflow-hidden divide-x divide-line-strong">
              <button
                onClick={() => setCurrent(addDays(current, -1))}
                aria-label="Previous day"
                title="Previous day (←)"
                className="w-8 flex items-center justify-center text-fg-muted hover:text-fg hover:bg-surface-subtle transition-colors"
              >
                <Icon.chevronLeft />
              </button>
              <button
                onClick={() => setCurrent(today)}
                disabled={isToday}
                title="Go to today (T)"
                className="px-3 text-[13px] font-medium text-fg enabled:hover:bg-surface-subtle disabled:text-fg-subtle transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => setCurrent(addDays(current, 1))}
                aria-label="Next day"
                title="Next day (→)"
                className="w-8 flex items-center justify-center text-fg-muted hover:text-fg hover:bg-surface-subtle transition-colors"
              >
                <Icon.chevronRight />
              </button>
            </div>
            <div className="relative">
              {/* Its own mousedown would count as a click outside the open calendar. */}
              <Button
                size="icon"
                aria-label="Pick a date"
                title="Pick a date"
                aria-expanded={calOpen}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => setCalOpen((o) => !o)}
              >
                <Icon.calendar />
              </Button>
              <AnimatePresence>
                {calOpen && <CalendarPicker current={current} today={today} planDays={planDays} onSelect={setCurrent} onClose={() => setCalOpen(false)} />}
              </AnimatePresence>
            </div>
            <Button variant="primary" className="ml-auto sm:ml-0" data-tour="open-picker" title="Add a task (N)" onClick={openPicker}>
              <Icon.plus />
              Add task
            </Button>
          </div>
        </header>

        <WeekStrip current={current} today={today} onSelect={setCurrent} statsFor={statsFor} />

        <div className="mt-6 grid items-start gap-6 lg:gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Side panel. First in the page so a phone shows the summary and a
              running timer above the list; on wide screens it sits right. */}
          <aside className="space-y-4 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-20">
            <section className="rounded-lg border border-line bg-canvas p-4">
              <div className="flex items-center gap-4">
                <ProgressRing pct={pct} />
                <div className="min-w-0">
                  <p className="text-[13px] text-fg-muted">{isToday ? "Today's progress" : "Progress"}</p>
                  <p className="mt-0.5 font-mono text-[22px] leading-7 font-medium tabular-nums text-fg">
                    {doneCount}<span className="text-fg-subtle">/{items.length}</span>
                    <span className="ml-2 font-sans text-[13px] font-normal text-fg-subtle">tasks done</span>
                  </p>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-md border border-line bg-line">
                {[
                  ["Planned", totalPlanned],
                  ["Left", minutesLeft],
                  ["Focused", totalDone],
                ].map(([label, min]) => (
                  <div key={label} className="bg-canvas px-3 py-2">
                    <dt className="text-[12px] text-fg-subtle">{label}</dt>
                    <dd className="mt-0.5 font-mono text-[14px] font-medium tabular-nums text-fg">{fmt(min) || "0m"}</dd>
                  </div>
                ))}
              </dl>
              {totalPlanned > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5 text-[12px] text-fg-subtle">
                    <span>Focus time vs plan</span>
                    <span className="font-mono">{Math.min(100, Math.round((totalDone / totalPlanned) * 100))}%</span>
                  </div>
                  <ProgressBar value={Math.min(1, totalDone / totalPlanned)} />
                </div>
              )}
            </section>

            <AnimatePresence mode="wait">
              {pomo ? (
                <PomodoroTimer
                  key="timer"
                  pomo={pomo}
                  onPause={() => { const np = flushPomo(pomoRef.current); commitPomo(np ? { ...np, status: "paused", anchor: undefined } : null); }}
                  onResume={() => { const p = pomoRef.current; if (p) commitPomo({ ...p, status: "running", anchor: Date.now() }); }}
                  onStop={() => { flushPomo(pomoRef.current); commitPomo(null); }}
                  onDismiss={() => { flushPomo(pomoRef.current); commitPomo(null); }}
                  onExtend={extendPomo}
                />
              ) : isToday && nextUp ? (
                <motion.section key="next" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-lg border border-line bg-canvas">
                  <div className="flex items-center justify-between px-4 h-11 border-b border-line">
                    <h2 className="text-[13px] font-medium text-fg">Up next</h2>
                    <span className="font-mono text-[12px] text-fg-subtle">{fmt((nextUp.sub || nextUp.item).estimatedMinutes)}</span>
                  </div>
                  <div className="p-4">
                    <p className="text-[14px] font-medium leading-5 text-fg">{nextUp.item.title}</p>
                    {nextUp.sub && <p className="mt-0.5 text-[13px] text-fg-muted">{nextUp.sub.title}</p>}
                    <p className="mt-1.5 text-[12px] text-fg-subtle">
                      {(() => {
                        const n = buildSessions((nextUp.sub || nextUp.item).estimatedMinutes).filter((s) => s.type === "work").length;
                        return n > 1 ? `${n} focus sessions with 5-minute breaks` : "One focus session";
                      })()}
                    </p>
                    <Button variant="primary" className="mt-4 w-full" onClick={() => startPomo(nextUp.item, nextUp.sub)}>
                      <Icon.start className="w-3.5 h-3.5" />
                      Start focus
                    </Button>
                  </div>
                </motion.section>
              ) : isToday && items.length > 0 && doneCount === items.length ? (
                <motion.section key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-lg border border-line bg-canvas p-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-success-subtle text-success-fg flex items-center justify-center shrink-0">
                    <Icon.check />
                  </span>
                  <div>
                    <p className="text-[14px] font-medium text-fg">All done for today</p>
                    <p className="text-[12px] text-fg-subtle">Plan tomorrow while it's fresh.</p>
                  </div>
                </motion.section>
              ) : null}
            </AnimatePresence>

            {timeSpent("hidden lg:block")}
          </aside>

          <div className="min-w-0 lg:col-start-1 lg:row-start-1">
            {items.length === 0 ? (
              <div className="rounded-lg border border-dashed border-line-strong px-6 py-14 text-center">
                <span className="mx-auto w-10 h-10 rounded-full bg-surface-hover text-fg-muted flex items-center justify-center">
                  <Icon.calendar />
                </span>
                <h2 className="mt-4 text-[15px] font-semibold text-fg">Nothing planned for {dayWord}</h2>
                <p className="mt-1 mx-auto max-w-sm text-[13px] leading-5 text-fg-muted">
                  Add topics from Core Stack or problems from DSA, or write a task of your own. Every task gets a focus timer.
                </p>
                <Button variant="primary" className="mt-5" onClick={openPicker}>
                  <Icon.plus />
                  Add task
                </Button>
              </div>
            ) : (
              <>
                <section className="rounded-lg border border-line bg-canvas overflow-hidden">
                  <div className="flex items-center justify-between px-4 h-11 border-b border-line">
                    <h2 className="text-[13px] font-medium text-fg">
                      To do <span className="ml-1 font-mono text-fg-subtle">{openRows.length}</span>
                    </h2>
                    {minutesLeft > 0 && <span className="font-mono text-[12px] text-fg-subtle">{fmt(minutesLeft)} left</span>}
                  </div>
                  {openRows.length > 0 ? (
                    <div className="divide-y divide-line">{openRows.map(renderRow)}</div>
                  ) : (
                    <p className="px-4 py-6 text-center text-[13px] text-fg-subtle">Every task on {dayWord}'s plan is done.</p>
                  )}
                  <button
                    onClick={openPicker}
                    className="w-full flex items-center gap-3 pl-3 sm:pl-[37px] pr-4 h-11 border-t border-line text-[13px] text-fg-subtle hover:text-fg hover:bg-surface-subtle transition-colors"
                  >
                    <Icon.plus />
                    Add task
                    <Kbd className="ml-auto hidden sm:inline-flex">N</Kbd>
                  </button>
                </section>

                {doneRows.length > 0 && (
                  <section className="mt-4 rounded-lg border border-line bg-canvas overflow-hidden">
                    <button
                      onClick={() => setShowDone((v) => !v)}
                      aria-expanded={showDone}
                      className="w-full flex items-center justify-between px-4 h-11 hover:bg-surface-subtle transition-colors"
                    >
                      <h2 className="text-[13px] font-medium text-fg">
                        Completed <span className="ml-1 font-mono text-fg-subtle">{doneRows.length}</span>
                      </h2>
                      <Icon.chevronDown className={`w-4 h-4 text-fg-subtle transition-transform duration-200 ${showDone ? "rotate-180" : ""}`} />
                    </button>
                    {showDone && <div className="divide-y divide-line border-t border-line">{doneRows.map(renderRow)}</div>}
                  </section>
                )}
              </>
            )}

            {timeSpent("mt-6 lg:hidden")}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {pickerOpen && (
          <CardPicker dayItems={items} onClose={() => setPickerOpen(false)} onAdd={addItem} showAI={canSeeAI} showPriority={canSeeAI} />
        )}
      </AnimatePresence>
    </PageShell>
  );
};

export default Planning;
