import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PageShell from "../../components/PageShell";
import { GLASS, GLASS_PANEL } from "../../components/glass";
import {
  IK_STAGES,
  IK_COMPANY_NOTES,
  IK_RUBRIC,
  IK_ROUND_PLAYBOOK,
  IK_PLAN,
  IK_BEHAVIORAL_GROUPS,
  IK_BEHAVIORAL,
  IK_STAR_STORIES,
  IK_HR_GROUPS,
  IK_HR,
  IK_DESIGN_GROUPS,
  IK_DESIGN,
  IK_JAVA,
  IK_LOGLENS,
  IK_RESUME_PROBES,
} from "../../Data/InterviewKit";
import { KEYS, loadJSON, setSourceComplete, setSourceNote, subscribe, dateKey } from "../../Data/planStore";

// Everything for backend interview loops except DSA, which lives on the DSA
// page. Progress and notes are the "interviewkit" store in planStore.

const CARD = GLASS;
const ROW = GLASS_PANEL;

// Interview date is kept in the synced notes map under a reserved key, so it
// follows the account across devices like everything else.
const DATE_KEY = "__interviewDate";

const TABS = [
  { key: "plan", label: "Loops & Plan" },
  { key: "behavioral", label: "Behavioral" },
  { key: "star", label: "STAR Stories" },
  { key: "hr", label: "HR & Recruiter" },
  { key: "design", label: "Design" },
  { key: "java", label: "Java & Backend" },
  { key: "loglens", label: "LogLens" },
];

const TAB_STORE = "interviewKitTab";

// Every checkable id per tab — drives the per-tab counters and the rings.
const TAB_ITEMS = {
  plan: [...IK_ROUND_PLAYBOOK.map((i) => i.id), ...IK_PLAN.flatMap((w) => w.items.map((i) => i.id))],
  behavioral: IK_BEHAVIORAL.map((i) => i.id),
  star: [...IK_STAR_STORIES.map((i) => i.id), ...IK_RESUME_PROBES.map((i) => i.id)],
  hr: IK_HR.map((i) => i.id),
  design: IK_DESIGN.map((i) => i.id),
  java: IK_JAVA.map((i) => i.id),
  loglens: IK_LOGLENS.map((i) => i.id),
};
const ALL_IDS = Object.values(TAB_ITEMS).flat();

function readTab() {
  try {
    const t = localStorage.getItem(TAB_STORE);
    return TABS.some((x) => x.key === t) ? t : "plan";
  } catch (_) {
    return "plan";
  }
}

export default function InterviewKit() {
  const [tab, setTab] = useState(readTab);
  const [done, setDone] = useState(() => loadJSON(KEYS.IK_COMPLETED, {}));
  const [notes, setNotes] = useState(() => loadJSON(KEYS.IK_NOTES, {}));

  // Live updates from another device via cloud sync.
  useEffect(
    () =>
      subscribe((key) => {
        if (key === KEYS.IK_COMPLETED) setDone(loadJSON(KEYS.IK_COMPLETED, {}));
        if (key === KEYS.IK_NOTES) setNotes(loadJSON(KEYS.IK_NOTES, {}));
      }),
    []
  );

  // On a phone the tab strip scrolls sideways; keep the active tab in view
  // (it may be a remembered one far to the right).
  const stripRef = useRef(null);
  useEffect(() => {
    const strip = stripRef.current;
    const el = strip && strip.querySelector(`[data-tab="${tab}"]`);
    if (!el) return;
    if (el.offsetLeft < strip.scrollLeft || el.offsetLeft + el.offsetWidth > strip.scrollLeft + strip.clientWidth) {
      strip.scrollLeft = el.offsetLeft - 8;
    }
  }, [tab]);

  const chooseTab = useCallback((t) => {
    setTab(t);
    try {
      localStorage.setItem(TAB_STORE, t);
    } catch (_) {}
  }, []);

  const toggleDone = useCallback((id, value) => {
    setSourceComplete("interviewkit", id, value);
    setDone((m) => ({ ...m, [id]: value }));
  }, []);
  const saveNote = useCallback((id, val) => {
    setSourceNote("interviewkit", id, val);
    setNotes((m) => ({ ...m, [id]: val }));
  }, []);

  const countOf = (ids) => ids.filter((id) => done[id]).length;
  const shared = { done, notes, onToggle: toggleDone, onNote: saveNote };

  return (
    <PageShell>
      <div className="min-h-screen flex justify-center px-3">
        <div className="w-full sm:w-11/12 lg:w-5/6 xl:w-3/4 2xl:w-2/3">
          <Header
            rings={[
              { label: "Overall", done: countOf(ALL_IDS), total: ALL_IDS.length, from: "#2563eb", to: "#6366f1" },
              { label: "Behavioral", done: countOf(TAB_ITEMS.behavioral), total: TAB_ITEMS.behavioral.length, from: "#e11d48", to: "#f97316" },
              { label: "HR", done: countOf(TAB_ITEMS.hr), total: TAB_ITEMS.hr.length, from: "#059669", to: "#14b8a6" },
            ]}
            interviewDate={notes[DATE_KEY] || ""}
            onDateChange={(v) => saveNote(DATE_KEY, v)}
          />

          {/* ── Tabs ── */}
          <div ref={stripRef} className={`relative mb-5 rounded-2xl ${CARD} p-1.5 flex gap-1 overflow-x-auto`}>
            {TABS.map((t) => (
              <button
                key={t.key}
                data-tab={t.key}
                onClick={() => chooseTab(t.key)}
                className={`shrink-0 px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                  tab === t.key
                    ? "bg-gradient-to-br from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-600/30"
                    : "text-gray-600 dark:text-gray-400 hover:bg-white/70 dark:hover:bg-white/[0.06] hover:text-blue-600 dark:hover:text-blue-300"
                }`}
              >
                {t.label}
                <span className={`ml-1.5 text-[10px] font-semibold tabular-nums ${tab === t.key ? "text-white/80" : "text-gray-400 dark:text-gray-500"}`}>
                  {countOf(TAB_ITEMS[t.key])}/{TAB_ITEMS[t.key].length}
                </span>
              </button>
            ))}
          </div>

          {tab === "plan" && <PlanTab {...shared} />}
          {tab === "behavioral" && <BehavioralTab {...shared} />}
          {tab === "star" && <StarTab {...shared} />}
          {tab === "hr" && <HRTab {...shared} />}
          {tab === "design" && <DesignTab {...shared} />}
          {tab === "java" && (
            <QATab
              items={IK_JAVA}
              grouped
              intro="Answers stay hidden until you open a question — say your answer out loud first, then check. 'Your experience' questions tie the concept to what you built; interviewers love that link."
              {...shared}
            />
          )}
          {tab === "loglens" && (
            <QATab
              items={IK_LOGLENS}
              intro="Expect 15–20 minutes on LogLens whenever an interviewer picks it from your resume. Every [bracketed] detail is something to confirm against what you actually built — never guess in the room."
              {...shared}
            />
          )}
        </div>
      </div>
    </PageShell>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ rings, interviewDate, onDateChange }) {
  const daysLeft = useMemo(() => {
    if (!interviewDate) return null;
    const [y, m, d] = interviewDate.split("-").map(Number);
    const [ty, tm, td] = dateKey().split("-").map(Number);
    return Math.round((new Date(y, m - 1, d) - new Date(ty, tm - 1, td)) / 86400000);
  }, [interviewDate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`mt-6 mb-5 rounded-3xl ${CARD} px-5 sm:px-7 py-5`}
    >
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[26px] leading-none font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-slate-800 via-slate-700 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-400">
              Interview Kit
            </h1>
            <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/25">
              private
            </span>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 max-w-xl">
            Behavioral, HR, design, Java and your projects. Coding practice lives on the{" "}
            <Link to="/dsa-prep" className="font-semibold text-blue-600 dark:text-blue-300 hover:underline">DSA page</Link>.
          </p>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Next interview</label>
            <input
              type="date"
              value={interviewDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="text-xs px-2 py-1 rounded-lg border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 text-gray-800 dark:text-gray-200"
            />
            {daysLeft != null && (
              <span
                className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${
                  daysLeft < 0
                    ? "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/25"
                    : daysLeft <= 7
                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30"
                    : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25"
                }`}
              >
                {daysLeft < 0 ? "done" : daysLeft === 0 ? "today" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 flex-wrap">
          {rings.map((r) => (
            <Ring key={r.label} {...r} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function Ring({ label, done, total, from, to }) {
  const pct = total ? Math.round((100 * done) / total) : 0;
  const id = `ik-ring-${label}`;
  const c = 2 * Math.PI * 22;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-14 h-14">
        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="22" fill="none" stroke="currentColor" className="text-gray-200/80 dark:text-white/10" strokeWidth="5" />
          <circle cx="28" cy="28" r="22" fill="none" stroke={`url(#${id})`} strokeWidth="5" strokeLinecap="round"
            strokeDasharray={`${c}`} strokeDashoffset={`${c * (1 - pct / 100)}`} style={{ transition: "stroke-dashoffset 0.5s ease" }} />
          <defs>
            <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={from} />
              <stop offset="100%" stopColor={to} />
            </linearGradient>
          </defs>
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-gray-700 dark:text-gray-200">{pct}%</span>
      </div>
      <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 tabular-nums">
        {label} {done}/{total}
      </span>
    </div>
  );
}

// ─── Shared building blocks ───────────────────────────────────────────────────

// Minimal markup: blank line = paragraph, "- " = bullet, "### " = subheading,
// **bold**, and "~~~" fences a code block.
function RichText({ text, className = "" }) {
  const blocks = [];
  const lines = (text || "").split("\n");
  let para = [];
  let list = [];
  let code = null;
  const flushPara = () => {
    if (para.length) blocks.push({ t: "p", v: para.join(" ") });
    para = [];
  };
  const flushList = () => {
    if (list.length) blocks.push({ t: "ul", v: list });
    list = [];
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (code) {
      if (line.trim() === "~~~") {
        blocks.push({ t: "code", v: code.join("\n") });
        code = null;
      } else code.push(raw);
      continue;
    }
    if (line.trim() === "~~~") {
      flushPara();
      flushList();
      code = [];
    } else if (line.startsWith("### ")) {
      flushPara();
      flushList();
      blocks.push({ t: "h", v: line.slice(4) });
    } else if (line.startsWith("- ")) {
      flushPara();
      list.push(line.slice(2));
    } else if (!line.trim()) {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line);
    }
  }
  if (code) blocks.push({ t: "code", v: code.join("\n") });
  flushPara();
  flushList();

  return (
    <div className={`space-y-2 text-[12.5px] leading-relaxed text-gray-700 dark:text-gray-300 ${className}`}>
      {blocks.map((b, i) =>
        b.t === "p" ? (
          <p key={i}><Inline text={b.v} /></p>
        ) : b.t === "h" ? (
          <h5 key={i} className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 pt-1">{b.v}</h5>
        ) : b.t === "code" ? (
          <pre key={i} className="text-[11.5px] p-3 rounded-lg bg-slate-900/90 text-slate-100 overflow-x-auto">{b.v}</pre>
        ) : (
          <ul key={i} className="list-disc pl-5 space-y-1">
            {b.v.map((li, j) => (
              <li key={j}><Inline text={li} /></li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}

function Inline({ text }) {
  // A "[" glued to a word (dp[i], d[i]) is code, not a placeholder.
  const parts = text.split(/(\*\*[^*]+\*\*|(?<![\w\])])\[[^\]]+\])/g);
  return parts.map((part, i) => {
    if (i % 2 === 1 && part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-bold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
    }
    // [brackets] are placeholders to personalise — make them impossible to miss.
    if (i % 2 === 1 && part.startsWith("[") && part.endsWith("]")) {
      return <span key={i} className="px-1 rounded bg-amber-400/20 text-amber-800 dark:text-amber-200">{part}</span>;
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

function CheckButton({ checked, onClick, title }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={title || (checked ? "Mark not done" : "Mark done")}
      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
        checked ? "bg-emerald-500 border-emerald-500 shadow-md shadow-emerald-500/30" : "border-gray-300 dark:border-slate-600 hover:border-emerald-400"
      }`}
    >
      {checked && (
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      )}
    </button>
  );
}

function Chevron({ open }) {
  return (
    <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-gray-400 dark:text-gray-500 shrink-0">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </motion.div>
  );
}

function NotesBox({ value, onSave, placeholder = "Your notes — real numbers, names, phrasing that works for you…" }) {
  const [local, setLocal] = useState(value || "");
  const timer = useRef(null);
  useEffect(() => { setLocal(value || ""); }, [value]);
  useEffect(() => () => timer.current && clearTimeout(timer.current), []);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">My notes</span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500">auto-saved</span>
      </div>
      <textarea
        value={local}
        onChange={(e) => {
          const v = e.target.value;
          setLocal(v);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => onSave(v), 500);
        }}
        placeholder={placeholder}
        rows={3}
        className="w-full p-2.5 text-xs rounded-lg border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 resize-y min-h-[70px] leading-relaxed"
      />
    </div>
  );
}

// A checkable, expandable row. `children` is what shows when it's open.
function CheckItem({ id, title, meta, children, done, notes, onToggle, onNote, withNotes = true }) {
  const [open, setOpen] = useState(false);
  const checked = !!done[id];
  const hasNote = !!notes[id];
  return (
    <div>
      <div
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 cursor-pointer transition-all ${
          checked
            ? "bg-emerald-500/10 dark:bg-emerald-500/[0.07] border border-emerald-500/30 dark:border-emerald-500/20"
            : `${ROW} hover:border-blue-400/60 dark:hover:border-blue-500/40`
        }`}
      >
        <CheckButton checked={checked} onClick={() => onToggle(id, !checked)} />
        <div className="flex-1 min-w-0">
          <div className={`text-[13px] font-semibold ${checked ? "text-gray-500 dark:text-gray-400" : "text-gray-800 dark:text-gray-100"}`}>{title}</div>
          {meta && <div className="mt-1 flex flex-wrap items-center gap-1.5">{meta}</div>}
        </div>
        {hasNote && <span title="Has notes" className="text-blue-400 text-xs">✎</span>}
        {(children || withNotes) && <Chevron open={open} />}
      </div>
      <AnimatePresence>
        {open && (children || withNotes) && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="mx-1 mt-2 mb-1 rounded-xl border border-gray-200/90 dark:border-white/[0.07] bg-white/60 dark:bg-white/[0.03] p-3.5 space-y-3">
              {children}
              {withNotes && <NotesBox value={notes[id]} onSave={(v) => onNote(id, v)} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Section({ title, subtitle, ids, done, children }) {
  const count = ids ? ids.filter((id) => done[id]).length : null;
  return (
    <div className={`mb-4 rounded-2xl ${CARD} px-3 sm:px-4 py-4`}>
      <div className="flex items-start justify-between gap-3 px-1 mb-3">
        <div className="min-w-0">
          <h2 className="text-[14px] font-bold text-gray-800 dark:text-gray-100">{title}</h2>
          {subtitle && <p className="text-[11.5px] text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {ids && (
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 tabular-nums shrink-0">
            {count}/{ids.length}
          </span>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Chip({ children, cls = "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20", title }) {
  return (
    <span title={title} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border whitespace-nowrap ${cls}`}>
      {children}
    </span>
  );
}


const STORY_CHIP = "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-500/25";

// Items carrying a `group` field, rendered as one Section per group in the
// order given.
function GroupedSections({ groups, items, subtitles = {}, render, done }) {
  return groups.map((g) => {
    const list = items.filter((i) => i.group === g);
    if (!list.length) return null;
    return (
      <Section key={g} title={g} subtitle={subtitles[g]} ids={list.map((i) => i.id)} done={done}>
        {list.map(render)}
      </Section>
    );
  });
}

function Intro({ text }) {
  return (
    <div className={`mb-4 rounded-2xl ${CARD} px-4 py-3`}>
      <RichText text={text} />
    </div>
  );
}

// ─── Loops & Plan tab ─────────────────────────────────────────────────────────
function PlanTab(props) {
  return (
    <>
      <Section title="How a backend interview loop usually runs" subtitle="Stages vary by company, but these are the building blocks.">
        <div className="grid sm:grid-cols-2 gap-2">
          {IK_STAGES.map((r, i) => (
            <div key={r.id} className={`rounded-xl ${ROW} p-3`}>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-extrabold flex items-center justify-center shrink-0">{i + 1}</span>
                <span className="text-[13px] font-bold text-gray-800 dark:text-gray-100">{r.name}</span>
              </div>
              <p className="text-[10.5px] font-semibold text-blue-600 dark:text-blue-300 mt-1">{r.length}</p>
              <p className="text-[12px] text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed">{r.what}</p>
              <p className="text-[12px] text-gray-800 dark:text-gray-100 mt-1.5 leading-relaxed"><span className="font-bold">Focus: </span>{r.focus}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="What differs by company" subtitle="Commonly reported patterns — confirm the exact loop with each recruiter.">
        {IK_COMPANY_NOTES.map((c) => (
          <div key={c.name} className={`rounded-xl ${ROW} p-3`}>
            <p className="text-[13px] font-bold text-gray-800 dark:text-gray-100">{c.name}</p>
            <p className="text-[12px] text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">{c.note}</p>
          </div>
        ))}
      </Section>

      <Section title="What interviewers score" subtitle="Almost every rubric reduces to these five.">
        <div className="grid sm:grid-cols-2 gap-2">
          {IK_RUBRIC.map((r) => (
            <div key={r.name} className={`rounded-xl ${ROW} p-3`}>
              <p className="text-[13px] font-bold text-gray-800 dark:text-gray-100">{r.name}</p>
              <p className="text-[12px] text-gray-600 dark:text-gray-300 mt-1">{r.note}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="The coding-round routine" subtitle="Tick each once you've rehearsed it in a mock." ids={IK_ROUND_PLAYBOOK.map((i) => i.id)} done={props.done}>
        {IK_ROUND_PLAYBOOK.map((i) => (
          <CheckItem key={i.id} id={i.id} title={i.title} {...props}>
            <RichText text={i.body} />
          </CheckItem>
        ))}
      </Section>

      {IK_PLAN.map((w) => (
        <Section key={w.week} title={`${w.week} — ${w.theme}`} ids={w.items.map((i) => i.id)} done={props.done}>
          {w.items.map((i) => (
            <CheckItem key={i.id} id={i.id} title={i.title} {...props} />
          ))}
        </Section>
      ))}
    </>
  );
}

// ─── Behavioral tab ───────────────────────────────────────────────────────────
function BehavioralTab(props) {
  return (
    <>
      <Intro text={"**How to answer:** STAR in about 2 minutes — Situation and Task in 20–30 seconds, most of the time on Action (what **you** did, 'I' not 'we'), and a Result with a number. End with what you learned. Tick a question once you've said the answer out loud, timed.\n\nStory codes (S1–S9) refer to the STAR Stories tab. 'Your own' means none of the resume stories fits — write a real one in the notes."} />
      <GroupedSections
        groups={IK_BEHAVIORAL_GROUPS}
        items={IK_BEHAVIORAL}
        subtitles={{
          "Hypothetical scenarios": "'What would you do if…' — answer with principles plus concrete steps.",
          "Hiring-manager technical questions": "Behavioral questions about how you engineer, asked by managers and senior engineers.",
        }}
        done={props.done}
        render={(q) => (
          <CheckItem
            key={q.id}
            id={q.id}
            title={q.q}
            meta={q.story && q.story !== "—" && q.story !== "Hypothetical" ? <Chip cls={STORY_CHIP}>{q.story === "HR" ? "See HR tab" : `Story: ${q.story}`}</Chip> : null}
            {...props}
          >
            <RichText text={q.tip} />
          </CheckItem>
        )}
      />
    </>
  );
}

// ─── STAR tab ─────────────────────────────────────────────────────────────────
function StarTab(props) {
  return (
    <>
      <Intro text={"Built from your resume. Highlighted [brackets] are placeholders — swap in the real detail. Interviewers dig 2–3 levels deep, and invented specifics fall apart there. Put your final wording in each story's notes. Tick a story once you can tell it in under 2:30 without reading."} />
      <Section title="STAR stories" ids={IK_STAR_STORIES.map((s) => s.id)} done={props.done}>
        {IK_STAR_STORIES.map((s) => (
          <CheckItem
            key={s.id}
            id={s.id}
            title={`${s.code} · ${s.title}`}
            meta={s.competencies.map((c) => (
              <Chip key={c} cls={STORY_CHIP}>{c}</Chip>
            ))}
            {...props}
          >
            <StarBody story={s} />
          </CheckItem>
        ))}
      </Section>
      <Section title="Technical probes on your resume" subtitle="Not stories — the questions an engineer asks when they read your bullets." ids={IK_RESUME_PROBES.map((p) => p.id)} done={props.done}>
        {IK_RESUME_PROBES.map((p) => (
          <CheckItem key={p.id} id={p.id} title={p.q} {...props}>
            <RichText text={p.a} />
          </CheckItem>
        ))}
      </Section>
    </>
  );
}

function StarBody({ story }) {
  const block = (letter, label, content, cls) => (
    <div className="flex gap-2.5">
      <span className={`w-6 h-6 rounded-lg text-[11px] font-extrabold flex items-center justify-center shrink-0 ${cls}`}>{letter}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
        {content}
      </div>
    </div>
  );
  return (
    <div className="space-y-3">
      {block("S", "Situation", <RichText text={story.situation} />, "bg-sky-500/15 text-sky-600 dark:text-sky-300")}
      {block("T", "Task", <RichText text={story.task} />, "bg-violet-500/15 text-violet-600 dark:text-violet-300")}
      {block("A", "Action — what I did", <RichText text={story.action.map((a) => `- ${a}`).join("\n")} />, "bg-amber-500/15 text-amber-700 dark:text-amber-300")}
      {block("R", "Result", <RichText text={story.result} />, "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300")}
      <div className="rounded-lg bg-rose-500/[0.06] border border-rose-500/20 p-2.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-300 mb-1">Follow-ups to expect</p>
        <RichText text={story.followups.map((f) => `- ${f}`).join("\n")} />
      </div>
    </div>
  );
}


// ─── HR tab ───────────────────────────────────────────────────────────────────
function HRTab(props) {
  return (
    <>
      <Intro text={"Say these out loud until they sound natural, and keep your final wording in the notes. **Consistency is everything** — the same resignation reason, dates and CTC to every recruiter, matching your documents, because background checks verify them."} />
      <GroupedSections
        groups={IK_HR_GROUPS}
        items={IK_HR}
        subtitles={{
          "Resigned without an offer": "You'll be asked in almost every process. A calm, 20-second, true answer makes it a non-issue.",
          "Compensation & negotiation": "Without a current salary to anchor on, anchor on the role and the market.",
        }}
        done={props.done}
        render={(i) => (
          <CheckItem key={i.id} id={i.id} title={i.title} {...props}>
            <RichText text={i.body} />
          </CheckItem>
        )}
      />
    </>
  );
}

// ─── Design tab ───────────────────────────────────────────────────────────────
function DesignTab(props) {
  return (
    <>
      <Intro text={"At 2.5 years you're between SDE-1 and SDE-2: expect LLD or machine coding almost everywhere, and HLD at SDE-2 loops or inside a project deep-dive ('how would this scale?'). Fundamentals and your own systems come first; the named designs second."} />
      <GroupedSections
        groups={IK_DESIGN_GROUPS}
        items={IK_DESIGN}
        subtitles={{ "Machine coding": "90–120 minutes, your own IDE, working code. Time yourself on at least two." }}
        done={props.done}
        render={(i) => (
          <CheckItem key={i.id} id={i.id} title={i.title} {...props}>
            <RichText text={i.body} />
          </CheckItem>
        )}
      />
    </>
  );
}

// ─── Q&A tab (Java & Backend, LogLens) ────────────────────────────────────────
function QATab({ items, grouped = false, intro, ...props }) {
  const groups = useMemo(() => {
    if (!grouped) return [{ name: null, items }];
    const out = [];
    items.forEach((i) => {
      let g = out.find((x) => x.name === i.group);
      if (!g) out.push((g = { name: i.group, items: [] }));
      g.items.push(i);
    });
    return out;
  }, [items, grouped]);

  return (
    <>
      {intro && <Intro text={intro} />}
      {groups.map((g) => (
        <Section key={g.name || "all"} title={g.name || "Deep-dive questions"} ids={g.items.map((i) => i.id)} done={props.done}>
          {g.items.map((i) => (
            <CheckItem key={i.id} id={i.id} title={i.q} {...props}>
              <RichText text={i.a} />
            </CheckItem>
          ))}
        </Section>
      ))}
    </>
  );
}
