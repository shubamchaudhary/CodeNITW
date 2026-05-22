import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { CATEGORY_CONFIG } from "../../Data/JobHuntPlan";
import { DSA_DIFFICULTY_CONFIG } from "../../Data/DSAPrep";
import {
  INTERVIEW_CARDS,
  DSA_PROBLEMS,
  KEYS,
  loadJSON,
  setSourceComplete,
  setSourceNote,
  isSourceComplete,
  getSourceNote,
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

const ALLOWED_EMAIL = "beshubam@gmail.com";

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

const Planning = () => {
  const [authReady, setAuthReady] = useState(false);
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
      setUserEmail(user ? user.email : null);
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => { pruneExpiredDsaSolves(); }, []);

  const today = dateKey();
  const [current, setCurrent] = useState(today);
  const [items, setItems] = useState(() => getDay(today));
  // Local mirrors of the source stores so completion/notes stay reactive here.
  const [ipCompleted, setIpCompleted] = useState(() => loadJSON(KEYS.IP_COMPLETED, {}));
  const [dsaCompleted, setDsaCompleted] = useState(() => loadJSON(KEYS.DSA_COMPLETED, {}));
  const [ipNotes, setIpNotes] = useState(() => loadJSON(KEYS.IP_NOTES, {}));
  const [dsaNotes, setDsaNotes] = useState(() => loadJSON(KEYS.DSA_NOTES, {}));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [openItem, setOpenItem] = useState(null);

  useEffect(() => setItems(getDay(current)), [current]);

  useEffect(
    () =>
      subscribe((key) => {
        if (key === KEYS.IP_COMPLETED) setIpCompleted(loadJSON(KEYS.IP_COMPLETED, {}));
        if (key === KEYS.DSA_COMPLETED) setDsaCompleted(loadJSON(KEYS.DSA_COMPLETED, {}));
        if (key === KEYS.IP_NOTES) setIpNotes(loadJSON(KEYS.IP_NOTES, {}));
        if (key === KEYS.DSA_NOTES) setDsaNotes(loadJSON(KEYS.DSA_NOTES, {}));
      }),
    []
  );

  const persist = useCallback(
    (next) => {
      setItems(next);
      setDay(current, next);
    },
    [current]
  );

  // Resolve an item's live completion + notes from the right source.
  const resolve = useCallback(
    (item) => {
      if (item.source === "custom") {
        return { complete: !!item.completed, note: item.notes || "" };
      }
      if (item.source === "dsa") {
        return { complete: !!dsaCompleted[item.refId], note: dsaNotes[item.refId] || "" };
      }
      return { complete: !!ipCompleted[item.refId], note: ipNotes[item.refId] || "" };
    },
    [ipCompleted, dsaCompleted, ipNotes, dsaNotes]
  );

  const addItem = useCallback(
    (item) => {
      if (item.source !== "custom" && items.some((i) => i.source === item.source && i.refId === item.refId)) {
        return; // already on today's plan
      }
      persist([...items, item]);
    },
    [items, persist]
  );

  const removeItem = useCallback((id) => persist(items.filter((i) => i.uid !== id)), [items, persist]);

  const toggleComplete = useCallback(
    (item) => {
      if (item.source === "custom") {
        persist(items.map((i) => (i.uid === item.uid ? { ...i, completed: !i.completed } : i)));
        return;
      }
      const next = !resolve(item).complete;
      setSourceComplete(item.source, item.refId, next);
      if (item.source === "dsa") setDsaCompleted((m) => ({ ...m, [item.refId]: next }));
      else setIpCompleted((m) => ({ ...m, [item.refId]: next }));
    },
    [items, persist, resolve]
  );

  const changeNote = useCallback(
    (item, val) => {
      if (item.source === "custom") {
        persist(items.map((i) => (i.uid === item.uid ? { ...i, notes: val } : i)));
        return;
      }
      setSourceNote(item.source, item.refId, val);
      if (item.source === "dsa") setDsaNotes((m) => ({ ...m, [item.refId]: val }));
      else setIpNotes((m) => ({ ...m, [item.refId]: val }));
    },
    [items, persist]
  );

  const doneCount = items.filter((i) => resolve(i).complete).length;
  const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  // Timeline: last 14 days + today + any day that has a saved plan.
  const timeline = useMemo(() => {
    const set = new Set();
    for (let i = 0; i < 14; i++) set.add(addDays(today, -i));
    getAllDayKeys().forEach((k) => set.add(k));
    set.add(current);
    return [...set].sort().reverse();
  }, [today, current, items]);

  const dayDoneCount = useCallback(
    (key) => {
      const dayItems = key === current ? items : getDay(key);
      let done = 0;
      dayItems.forEach((it) => {
        if (it.source === "custom") { if (it.completed) done++; }
        else if (it.source === "dsa") { if (dsaCompleted[it.refId]) done++; }
        else if (ipCompleted[it.refId]) done++;
      });
      return { done, total: dayItems.length };
    },
    [current, items, ipCompleted, dsaCompleted]
  );

  if (!authReady) return null;

  if (userEmail !== ALLOWED_EMAIL) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center px-6 py-12 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-5V9m0 0V7m0 2h2m-2 0H10M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Access Restricted</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">This page is private. Please sign in with the authorised account.</p>
        </div>
      </div>
    );
  }

  const isToday = current === today;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pb-16">
      <div className="min-h-screen flex justify-center px-2">
        <div className="w-full sm:w-11/12 lg:w-3/4 xl:w-2/3">

          {/* ── Header ── */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-6 mb-4 px-2">
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
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-violet-600 dark:text-violet-400">{pct}%</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Date stepper ── */}
          <div className="flex items-center justify-between gap-2 mb-3 px-2">
            <button onClick={() => setCurrent(addDays(current, -1))} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 text-sm font-semibold transition-all" title="Previous day">‹ Prev</button>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{relativeLabel(current)}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">{prettyDate(current)}</p>
            </div>
            <div className="flex items-center gap-2">
              {!isToday && (
                <button onClick={() => setCurrent(today)} className="px-3 py-1.5 rounded-lg border border-violet-300 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 text-sm font-semibold transition-all">Today</button>
              )}
              <button onClick={() => setCurrent(addDays(current, 1))} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 text-sm font-semibold transition-all" title="Next day">Next ›</button>
            </div>
          </div>

          {/* ── Timeline strip ── */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 px-2 scrollbar-thin">
            {timeline.map((key) => {
              const { done, total } = dayDoneCount(key);
              const sel = key === current;
              const isT = key === today;
              const [yy, mm, dd] = key.split("-");
              const localDate = new Date(Number(yy), Number(mm) - 1, Number(dd));
              return (
                <button
                  key={key}
                  onClick={() => setCurrent(key)}
                  className={`shrink-0 w-16 rounded-xl border px-2 py-2 text-center transition-all ${
                    sel
                      ? "border-violet-500 bg-violet-600 text-white shadow-md"
                      : "border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:border-violet-400"
                  }`}
                >
                  <p className={`text-[10px] font-semibold ${sel ? "text-violet-100" : "text-gray-400 dark:text-gray-500"}`}>
                    {isT ? "TODAY" : localDate.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase()}
                  </p>
                  <p className="text-sm font-bold leading-tight">{mm}/{dd}</p>
                  <p className={`text-[10px] ${sel ? "text-violet-100" : total && done === total ? "text-green-500" : "text-gray-400 dark:text-gray-500"}`}>
                    {total ? `${done}/${total}` : "—"}
                  </p>
                </button>
              );
            })}
          </div>

          {/* ── Day plan box (grows as cards are added) ── */}
          <div className="px-2 mb-4">
            <motion.div
              layout
              className="rounded-2xl border-2 border-dashed border-violet-300 dark:border-violet-800 bg-violet-50/40 dark:bg-violet-900/10 p-3 sm:p-4 transition-colors"
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  Tasks for {relativeLabel(current)}
                </h3>
                <span className="text-[11px] text-gray-400 dark:text-gray-500">
                  {doneCount}/{items.length} done
                </span>
              </div>

              {items.length === 0 ? (
                <p className="text-center text-xs text-gray-400 dark:text-gray-500 py-6">
                  Nothing planned yet — add cards from Interview Prep, DSA, or create a custom one.
                </p>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {items.map((item) => {
                      const { complete, note } = resolve(item);
                      return (
                        <motion.div key={item.uid} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
                          <DayCard
                            item={item}
                            complete={complete}
                            note={note}
                            isOpen={openItem === item.uid}
                            onToggleOpen={() => setOpenItem((p) => (p === item.uid ? null : item.uid))}
                            onToggleComplete={() => toggleComplete(item)}
                            onNoteChange={(val) => changeNote(item, val)}
                            onRemove={() => removeItem(item.uid)}
                          />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}

              {/* Add button — pinned to the bottom, inside the box */}
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
        {pickerOpen && (
          <CardPicker
            dayItems={items}
            onClose={() => setPickerOpen(false)}
            onAdd={addItem}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const SOURCE_META = {
  interview: { label: "Interview", badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300", border: "border-l-indigo-400" },
  dsa: { label: "DSA", badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300", border: "border-l-orange-400" },
  custom: { label: "Custom", badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300", border: "border-l-violet-400" },
};

function DayCard({ item, complete, note, isOpen, onToggleOpen, onToggleComplete, onNoteChange, onRemove }) {
  const meta = SOURCE_META[item.source];
  const debounceRef = useRef(null);
  const [localNote, setLocalNote] = useState(note);

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

  const syncLabel = item.source === "custom" ? "saved on this day" : `synced with ${meta.label} Prep`;

  return (
    <div className={`rounded-xl border border-gray-200 dark:border-slate-600 border-l-4 ${complete ? "border-l-green-400" : meta.border} bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden ${complete ? "opacity-80" : ""}`}>
      <div className="flex items-center gap-3 px-4 py-2.5 cursor-pointer select-none" onClick={onToggleOpen}>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleComplete(); }}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${complete ? "bg-green-500 border-green-500" : "border-gray-300 dark:border-slate-500 hover:border-green-400"}`}
          title={complete ? "Mark incomplete" : "Mark complete"}
        >
          {complete && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          )}
        </button>

        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${meta.badge}`}>{meta.label}</span>
        {item.meta && <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0 hidden sm:inline">{item.meta}</span>}

        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-semibold truncate ${complete ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-800 dark:text-gray-200"}`}>{item.title}</h3>
        </div>

        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {localNote && <span title="Has notes" className="text-blue-400 dark:text-blue-500 text-xs">✎</span>}
          {item.link && (
            <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-[10px] font-semibold px-2 py-1 rounded-md border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:text-violet-600 hover:border-violet-300 transition-colors" title="Open link">↗</a>
          )}
          <button onClick={onRemove} className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors" title="Remove from this day">
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
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1 h-4 rounded-full bg-gradient-to-b from-violet-400 to-indigo-400" />
                  Notes
                </h4>
                <span className="text-[10px] font-normal text-gray-400 dark:text-gray-500">auto-saved · {syncLabel}</span>
              </div>
              <textarea
                value={localNote}
                onChange={handleNoteInput}
                placeholder="What did you work on, key takeaways, blockers..."
                rows={5}
                className="w-full p-4 text-sm rounded-lg border border-violet-200 dark:border-slate-600 bg-white dark:bg-slate-900/60 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-400 dark:focus:border-violet-500 resize-y min-h-[120px] transition-all leading-relaxed shadow-sm"
              />
              <div className="flex items-center justify-end mt-2">
                <span className="text-[10px] text-gray-400 dark:text-gray-500">{localNote.length} chars</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CardPicker({ dayItems, onClose, onAdd }) {
  const [tab, setTab] = useState("interview");
  const [query, setQuery] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customNote, setCustomNote] = useState("");

  const addedKey = useMemo(() => {
    const s = new Set();
    dayItems.forEach((i) => { if (i.source !== "custom") s.add(`${i.source}:${i.refId}`); });
    return s;
  }, [dayItems]);

  const q = query.trim().toLowerCase();

  const interviewResults = useMemo(() => {
    if (tab !== "interview") return [];
    return INTERVIEW_CARDS.filter(
      (c) => !q || c.title.toLowerCase().includes(q) || c.categories.join(" ").toLowerCase().includes(q)
    );
  }, [tab, q]);

  const dsaResults = useMemo(() => {
    if (tab !== "dsa") return [];
    return DSA_PROBLEMS.filter(
      (p) => !q || p.title.toLowerCase().includes(q) || p.topic.toLowerCase().includes(q)
    );
  }, [tab, q]);

  const addCustom = () => {
    const title = customTitle.trim();
    if (!title) return;
    onAdd({ uid: uid(), source: "custom", title, completed: false, notes: customNote.trim() });
    setCustomTitle("");
    setCustomNote("");
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
            { key: "interview", label: "Interview Prep" },
            { key: "dsa", label: "DSA" },
            { key: "custom", label: "Custom" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                tab === t.key
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-600 hover:border-violet-400"
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
              placeholder={tab === "interview" ? "Search topics, AI / HLD / LLD..." : "Search problems or patterns..."}
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
                      onClick={() =>
                        onAdd({ uid: uid(), source: "interview", refId: c.id, title: c.title, meta: `${c.primaryCategory} · Wk ${c.week}` })
                      }
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all ${added ? "border-green-200 dark:border-green-900/40 bg-green-50 dark:bg-green-900/10 cursor-default" : "border-gray-200 dark:border-slate-600 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/10"}`}
                    >
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${CATEGORY_CONFIG[c.primaryCategory].badge}`}>{c.primaryCategory}</span>
                      <span className="flex-1 text-sm text-gray-700 dark:text-gray-200 truncate">{c.title}</span>
                      <span className="text-[10px] text-gray-400 shrink-0">{added ? "Added ✓" : "Add +"}</span>
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
                      onClick={() =>
                        onAdd({ uid: uid(), source: "dsa", refId: p.id, title: p.title, meta: p.topic, link: p.link })
                      }
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all ${added ? "border-green-200 dark:border-green-900/40 bg-green-50 dark:bg-green-900/10 cursor-default" : "border-gray-200 dark:border-slate-600 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10"}`}
                    >
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${DSA_DIFFICULTY_CONFIG[p.difficulty]}`}>{p.difficulty}</span>
                      <span className="flex-1 text-sm text-gray-700 dark:text-gray-200 truncate">{p.title}</span>
                      <span className="text-[10px] text-gray-400 shrink-0">{added ? "Added ✓" : "Add +"}</span>
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
                  onKeyDown={(e) => { if (e.key === "Enter") addCustom(); }}
                  placeholder="e.g. Mock interview with friend, update resume..."
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Notes (optional)</label>
                <textarea
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  rows={3}
                  placeholder="Any details..."
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40 resize-y"
                />
              </div>
              <button
                onClick={addCustom}
                disabled={!customTitle.trim()}
                className="w-full py-2.5 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Add custom card
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default Planning;
