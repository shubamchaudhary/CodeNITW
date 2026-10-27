import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import MarkdownPreview from "@uiw/react-markdown-preview";
import "@uiw/react-markdown-preview/markdown.css";
import "../Notes/notes.css";
import "./webBasics.css";
import PageSkeleton from "../../components/PageSkeleton";
import useIsDark from "../../hooks/useIsDark";
import { KEYS, loadJSON, saveJSON, setSourceComplete, subscribe } from "../../Data/planStore";
import { WEB_BASICS, ASKED_SOURCE, parseQuestionBank } from "../../Data/WebBasics";
import { buildTextIndex, anchorFromRange, locate, rangeFor, caretFromPoint, paintRanges, canPaintHighlights } from "../Notes/noteAnchors";

// The question banks (JS · React · Node, Python · FastAPI), read like a Core
// Stack topic: the left column lists every module of every bank in the group,
// the rest is one module with every question and its answer open, under a
// thin reading-progress strip. Each question has its own
// tick, and any passage can be highlighted — highlights are stored as the
// passage plus a little context (the same anchors personal notes use) and
// painted over the rendered answer, so the read-only bank is never edited.

const GROUP_LABEL = { web: "JS · React · Node", python: "Python · FastAPI" };

const COLORS = [
  { key: "yellow", swatch: "#facc15", label: "Yellow" },
  { key: "green", swatch: "#4ade80", label: "Green" },
  { key: "blue", swatch: "#60a5fa", label: "Blue" },
  { key: "pink", swatch: "#f472b6", label: "Pink" },
];

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Parsed banks, kept for the life of the tab: switching banks never reloads.
const banks = {};
function loadBank(tech) {
  if (!banks[tech.key]) {
    banks[tech.key] = tech.load().then((m) =>
      parseQuestionBank(m.default).map((mod) => ({ ...mod, slug: slug(mod.title), tech }))
    );
  }
  return banks[tech.key];
}

// Every bank of the group, loaded together the first time the page opens, so
// moving from JavaScript to React is instant.
function useGroup(group) {
  const techs = useMemo(() => WEB_BASICS.filter((t) => t.group === group), [group]);
  const [data, setData] = useState(null);
  useEffect(() => {
    let live = true;
    Promise.all(techs.map(loadBank)).then((lists) => {
      if (live) setData(techs.map((tech, i) => ({ tech, modules: lists[i] })));
    });
    // The other group too, quietly: it's small and it makes the next visit instant.
    WEB_BASICS.filter((t) => t.group !== group).forEach(loadBank);
    return () => {
      live = false;
    };
  }, [techs, group]);
  return data;
}

const LAST = (techKey) => `webBasicsLast:${techKey}`;

export default function WebBasics({ techKey }) {
  const { mod: modSlug } = useParams();
  const navigate = useNavigate();
  const tech = WEB_BASICS.find((t) => t.key === techKey) || WEB_BASICS[0];
  const group = useGroup(tech.group);
  const colorMode = useIsDark() ? "dark" : "light";

  const [done, setDone] = useState(() => loadJSON(KEYS.WB_COMPLETED, {}));
  const [highlights, setHighlights] = useState(() => loadJSON(KEYS.WB_HIGHLIGHTS, {}));
  useEffect(
    () =>
      subscribe((key) => {
        if (key === KEYS.WB_COMPLETED) setDone(loadJSON(KEYS.WB_COMPLETED, {}));
        if (key === KEYS.WB_HIGHLIGHTS) setHighlights(loadJSON(KEYS.WB_HIGHLIGHTS, {}));
      }),
    []
  );

  const modules = group?.find((g) => g.tech.key === tech.key)?.modules;
  const current = modules?.find((m) => m.slug === modSlug);

  // The footer sits below the columns; leaving its height out of the sticky
  // sidebar stops the sidebar jumping at the very bottom of the page.
  const [footerHeight, setFooterHeight] = useState(0);
  useEffect(() => {
    const footer = document.querySelector("#page-root + footer");
    if (!footer) return undefined;
    const update = () => setFooterHeight(Math.round(footer.getBoundingClientRect().height));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (current) {
      try {
        localStorage.setItem(LAST(tech.key), current.slug);
      } catch (_) {}
      window.scrollTo({ top: 0 });
    }
  }, [current, tech.key]);

  const toggleDone = useCallback((id, value) => {
    setSourceComplete("webbasics", id, value);
    setDone((m) => ({ ...m, [id]: value }));
  }, []);

  const saveHighlights = useCallback((qid, list) => {
    const map = { ...loadJSON(KEYS.WB_HIGHLIGHTS, {}) };
    if (list.length) map[qid] = list;
    else delete map[qid];
    saveJSON(KEYS.WB_HIGHLIGHTS, map);
    setHighlights(loadJSON(KEYS.WB_HIGHLIGHTS, {}));
  }, []);

  // Full screen, as on Core Stack: the site header, footer and the module list
  // go away (the "notes-immersive" class, see notes.css), and the browser goes
  // full screen where it can. Esc, or leaving browser full screen, ends it.
  const [immersive, setImmersive] = useState(false);
  const enterImmersive = useCallback(() => {
    setImmersive(true);
    document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);
  const exitImmersive = useCallback(() => {
    setImmersive(false);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("notes-immersive", immersive);
    return () => document.documentElement.classList.remove("notes-immersive");
  }, [immersive]);
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setImmersive(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape" && !document.fullscreenElement) setImmersive(false);
    };
    document.addEventListener("fullscreenchange", onChange);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      window.removeEventListener("keydown", onKey);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, []);

  if (!group || !modules) return <PageSkeleton />;

  // No module in the URL (or an old one): resume where you were, else the
  // first module with something left to do.
  if (!current) {
    let last = null;
    try {
      last = localStorage.getItem(LAST(tech.key));
    } catch (_) {}
    const target =
      modules.find((m) => m.slug === last) || modules.find((m) => m.questions.some((q) => !done[q.id])) || modules[0];
    return <Navigate to={`${tech.path}/${target.slug}`} replace />;
  }

  // The reading order runs across the whole group: the last JavaScript module
  // leads on to the first React one.
  const order = group.flatMap((g) => g.modules);
  const at = order.indexOf(current);
  const prev = order[at - 1];
  const next = order[at + 1];
  const go = (m) => navigate(`${m.tech.path}/${m.slug}`);

  const nav = <BankNav group={group} groupKey={tech.group} current={current} done={done} onPick={go} />;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0e1427]">
      <div className="flex">
        {!immersive && (
          <aside className="hidden lg:block w-[300px] shrink-0 border-r border-gray-200/90 dark:border-white/[0.07] light:bg-[#fafafb] light:border-slate-900/[0.07]">
            <div className="sticky top-0" style={{ height: `calc(100dvh - ${footerHeight}px)` }}>
              {nav}
            </div>
          </aside>
        )}

        <main className="flex-1 min-w-0">
          <div className={`${immersive ? "hidden" : "lg:hidden"} sticky top-0 z-30 px-4 py-2.5 border-b border-gray-200/90 dark:border-white/[0.07] bg-white/95 dark:bg-[#0e1427]/95 backdrop-blur light:border-slate-900/[0.07]`}>
            <select
              value={`${current.tech.key}/${current.slug}`}
              onChange={(e) => {
                const m = order.find((x) => `${x.tech.key}/${x.slug}` === e.target.value);
                if (m) go(m);
              }}
              className="w-full h-9 px-3 rounded-lg text-[13.5px] font-semibold bg-white dark:bg-white/[0.05] border border-gray-300 dark:border-white/[0.14] text-gray-800 dark:text-gray-100"
            >
              {group.map((g) => (
                <optgroup key={g.tech.key} label={g.tech.label}>
                  {g.modules.map((m) => (
                    <option key={m.slug} value={`${g.tech.key}/${m.slug}`}>
                      {m.title}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <ModuleReader
            key={`${current.tech.key}/${current.slug}`}
            module={current}
            askedSource={ASKED_SOURCE[tech.group]}
            done={done}
            highlights={highlights}
            colorMode={colorMode}
            onToggleDone={toggleDone}
            onSaveHighlights={saveHighlights}
            prev={prev}
            next={next}
            onGo={go}
            immersive={immersive}
            onToggleImmersive={immersive ? exitImmersive : enterImmersive}
          />
        </main>
      </div>
    </div>
  );
}

// ── Left column: every module of every bank in the group ──────────────────────

const NAV_PREF = (group) => `webBasicsNav:${group}`;

function BankNav({ group, groupKey, current, done, onPick }) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(NAV_PREF(groupKey)) || "{}");
    } catch (_) {
      return {};
    }
  });
  const toggle = (key, open) => {
    const next = { ...collapsed, [key]: open };
    setCollapsed(next);
    try {
      localStorage.setItem(NAV_PREF(groupKey), JSON.stringify(next));
    } catch (_) {}
  };
  const listRef = useRef(null);

  const all = group.flatMap((g) => g.modules.flatMap((m) => m.questions));
  const total = all.length;
  const n = all.filter((q) => done[q.id]).length;

  // The open module stays in view inside the list (never the page).
  useEffect(() => {
    const list = listRef.current;
    const el = list?.querySelector(`[data-mod="${current.tech.key}/${current.slug}"]`);
    if (!list || !el) return;
    const top = el.offsetTop - list.offsetTop;
    if (top < list.scrollTop + 40 || top > list.scrollTop + list.clientHeight - 80) {
      list.scrollTo({ top: Math.max(0, top - list.clientHeight / 3) });
    }
  }, [current]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-5 pt-6 pb-4 border-b border-gray-200/80 dark:border-white/[0.07] light:border-slate-900/[0.06]">
        <div className="flex items-baseline justify-between">
          <p className="text-[17px] font-bold tracking-tight text-gray-900 dark:text-gray-50 light:text-slate-900">{GROUP_LABEL[groupKey]}</p>
          <span className="text-[12.5px] font-semibold tabular-nums text-gray-500 dark:text-gray-400">
            {n}/{total} done
          </span>
        </div>
        <div className="mt-2.5 h-1.5 rounded-full bg-gray-200/90 dark:bg-white/[0.08] light:bg-slate-900/[0.06] overflow-hidden">
          <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-300" style={{ width: `${total ? (n / total) * 100 : 0}%` }} />
        </div>
      </div>

      <nav ref={listRef} className="note-toc flex-1 overflow-y-auto px-3 py-3">
        {group.map((g) => {
          const isCurrent = g.tech.key === current.tech.key;
          const open = isCurrent || !collapsed[g.tech.key];
          const qs = g.modules.flatMap((m) => m.questions);
          const gDone = qs.filter((q) => done[q.id]).length;
          return (
            <div key={g.tech.key} className="mb-1.5">
              <button
                onClick={() => toggle(g.tech.key, open)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-white/[0.03] light:hover:bg-slate-900/[0.035]"
              >
                <span className="flex-1 text-[14.5px] font-semibold text-gray-800 dark:text-gray-100 light:text-slate-900">{g.tech.label}</span>
                <span className="text-[11.5px] tabular-nums text-gray-400 dark:text-gray-500">
                  {gDone}/{qs.length}
                </span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? "" : "-rotate-90"}`} viewBox="0 0 16 16" fill="none">
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {open && (
                <ul className="mt-0.5 space-y-px">
                  {g.modules.map((m) => {
                    const active = isCurrent && m.slug === current.slug;
                    const mDone = m.questions.filter((q) => done[q.id]).length;
                    const complete = mDone === m.questions.length;
                    return (
                      <li key={m.slug}>
                        <button
                          data-mod={`${g.tech.key}/${m.slug}`}
                          onClick={() => onPick(m)}
                          className={`w-full flex items-start gap-2.5 pl-3 pr-2 py-[7px] rounded-lg text-left transition-colors ${
                            active
                              ? "bg-emerald-50 dark:bg-emerald-400/10 light:bg-white light:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_0_0_1px_rgba(15,23,42,0.06)]"
                              : "hover:bg-gray-50 dark:hover:bg-white/[0.04] light:hover:bg-slate-900/[0.035]"
                          }`}
                        >
                          <DoneCircle done={complete} className="w-[17px] h-[17px] mt-[1px]" />
                          <span
                            className={`flex-1 text-[14px] leading-snug ${
                              active ? "text-emerald-700 dark:text-emerald-300 font-medium light:text-slate-900" : "text-gray-700 dark:text-gray-300 light:text-slate-600"
                            }`}
                          >
                            {m.title}
                          </span>
                          <span className="mt-[2px] text-[10.5px] font-bold tabular-nums shrink-0 text-gray-400 dark:text-gray-500">
                            {mDone}/{m.questions.length}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

// ── Middle: one module, every answer open ─────────────────────────────────────

function ModuleReader({ module, askedSource, done, highlights, colorMode, onToggleDone, onSaveHighlights, prev, next, onGo, immersive, onToggleImmersive }) {
  const articleRef = useRef(null);
  const rangesRef = useRef(new Map()); // highlight id -> { range, qid }
  const [toolbar, setToolbar] = useState(null); // a fresh selection
  const [markMenu, setMarkMenu] = useState(null); // a clicked highlight

  const qs = module.questions;
  const nDone = qs.filter((q) => done[q.id]).length;

  // Paint every highlight of this module over the rendered answers.
  const moduleHighlights = useMemo(() => qs.flatMap((q) => (highlights[q.id] || []).map((h) => ({ ...h, qid: q.id }))), [qs, highlights]);
  useEffect(() => {
    const byColor = Object.fromEntries(COLORS.map((c) => [c.key, []]));
    const map = new Map();
    const indexes = {};
    for (const h of moduleHighlights) {
      const root = articleRef.current?.querySelector(`[data-answer="${h.qid}"]`);
      if (!root) continue;
      const index = (indexes[h.qid] ||= buildTextIndex(root));
      const pos = locate(index, h);
      if (!pos) continue;
      const range = rangeFor(index, pos[0], pos[1]);
      map.set(h.id, { range, qid: h.qid });
      (byColor[h.color] || byColor.yellow).push(range);
    }
    rangesRef.current = map;
    COLORS.forEach((c) => paintRanges(`wb-hl-${c.key}`, byColor[c.key]));
  }, [moduleHighlights, colorMode]);
  useEffect(() => () => COLORS.forEach((c) => paintRanges(`wb-hl-${c.key}`, [])), []);

  // A selection inside one answer offers the highlight colours.
  const onMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return setToolbar(null);
    const range = sel.getRangeAt(0);
    const answerOf = (node) => (node.nodeType === Node.TEXT_NODE ? node.parentElement : node)?.closest?.("[data-answer]");
    const a = answerOf(range.startContainer);
    const b = answerOf(range.endContainer);
    if (!a || a !== b) return setToolbar(null);
    const rect = range.getBoundingClientRect();
    setMarkMenu(null);
    setToolbar({ x: rect.left + rect.width / 2, y: rect.top, qid: a.dataset.answer, range: range.cloneRange() });
  };

  const applyHighlight = (color) => {
    if (!toolbar) return;
    if (!canPaintHighlights) {
      toast.info("This browser can't show highlights — try a recent Chrome, Edge or Safari.");
      return;
    }
    const root = articleRef.current?.querySelector(`[data-answer="${toolbar.qid}"]`);
    const anchor = root && anchorFromRange(buildTextIndex(root), toolbar.range);
    if (anchor) {
      const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      onSaveHighlights(toolbar.qid, [...(highlights[toolbar.qid] || []), { id, color, ...anchor, createdAt: Date.now() }]);
    }
    window.getSelection()?.removeAllRanges();
    setToolbar(null);
  };

  // A click on painted text opens that highlight's menu.
  const onClick = (e) => {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) return;
    const p = caretFromPoint(e.clientX, e.clientY);
    if (!p) return setMarkMenu(null);
    for (const [id, { range, qid }] of rangesRef.current) {
      try {
        if (range.isPointInRange(p.node, p.offset)) {
          setMarkMenu({ id, qid, x: e.clientX, y: e.clientY });
          return;
        }
      } catch (_) {}
    }
    setMarkMenu(null);
  };

  const recolor = (color) => {
    const list = (highlights[markMenu.qid] || []).map((h) => (h.id === markMenu.id ? { ...h, color } : h));
    onSaveHighlights(markMenu.qid, list);
    setMarkMenu(null);
  };
  const remove = () => {
    onSaveHighlights(markMenu.qid, (highlights[markMenu.qid] || []).filter((h) => h.id !== markMenu.id));
    setMarkMenu(null);
  };

  useEffect(() => {
    if (!toolbar && !markMenu) return undefined;
    const close = () => {
      setToolbar(null);
      setMarkMenu(null);
    };
    window.addEventListener("scroll", close, { passive: true });
    return () => window.removeEventListener("scroll", close);
  }, [toolbar, markMenu]);

  return (
    <div>
      <ReadingProgress
        articleRef={articleRef}
        nDone={nDone}
        total={qs.length}
        title={`${module.tech.label} · ${module.title}`}
        immersive={immersive}
        onToggleImmersive={onToggleImmersive}
      />
      <article
        ref={articleRef}
        onMouseUp={onMouseUp}
        onMouseDown={() => setToolbar(null)}
        onClick={onClick}
        className="relative min-w-0 px-5 sm:px-10 lg:px-16 py-8 lg:py-12"
      >
        <header className="mb-8">
          <p className="text-[13px] font-semibold text-emerald-700 dark:text-emerald-300">{module.tech.label}</p>
          <h1 className="mt-1.5 text-[30px] sm:text-[34px] leading-tight font-bold tracking-tight text-gray-900 dark:text-gray-50 light:text-slate-900">
            {module.title}
          </h1>
          <p className="mt-2.5 text-[14px] text-gray-500 dark:text-gray-400">
            {qs.length} questions · {nDone}/{qs.length} done
          </p>
          {askedSource && <p className="mt-1 text-[12.5px] text-gray-400 dark:text-gray-500">{askedSource}</p>}
        </header>

        {qs.map((q, i) => (
          <QuestionBlock
            key={q.id}
            q={q}
            last={i === qs.length - 1}
            isDone={!!done[q.id]}
            colorMode={colorMode}
            onToggleDone={onToggleDone}
          />
        ))}

        {/* The end of the module: a big card onto the next one (across techs
            too), and a quieter link back. */}
        <div className="mt-14 pt-8 border-t border-gray-200 dark:border-white/[0.08]">
          {next ? (
            <button
              onClick={() => onGo(next)}
              className="group w-full flex items-center gap-5 rounded-2xl px-6 py-5 text-left border border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-400/[0.07] hover:border-emerald-500/60 hover:bg-emerald-50 dark:hover:bg-emerald-400/[0.11] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Up next{next.tech.key !== module.tech.key ? ` · ${next.tech.label}` : ""}
                </p>
                <p className="mt-1 text-[20px] font-bold tracking-tight text-gray-900 dark:text-gray-50 light:text-slate-900 truncate">{next.title}</p>
                <p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-400">{next.questions.length} questions</p>
              </div>
              <span className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 group-hover:translate-x-0.5 transition-transform">
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10h11m0 0l-4.5-4.5M15 10l-4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
          ) : (
            <p className="text-center text-[15px] font-semibold text-emerald-700 dark:text-emerald-300">That's the last module of this bank.</p>
          )}
          {prev && (
            <button
              onClick={() => onGo(prev)}
              className="mt-4 text-[13.5px] font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              ← Previous: {prev.title}
            </button>
          )}
        </div>
      </article>

      {toolbar && (
        <Floating x={toolbar.x} y={toolbar.y}>
          {COLORS.map((c) => (
            <Swatch key={c.key} color={c} onPick={() => applyHighlight(c.key)} />
          ))}
        </Floating>
      )}
      {markMenu && (
        <Floating x={markMenu.x} y={markMenu.y - 8}>
          {COLORS.map((c) => (
            <Swatch key={c.key} color={c} onPick={() => recolor(c.key)} />
          ))}
          <span className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-1" />
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={remove}
            className="h-7 px-2 rounded-md text-[12.5px] font-semibold text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10"
          >
            Remove
          </button>
        </Floating>
      )}
    </div>
  );
}

// One question: the question as a heading with its tick, then the answer.
// Memoised on what it shows, so ticking a question never re-renders the other
// answers (which would move the text the highlights are painted on).
const QuestionBlock = memo(function QuestionBlock({ q, last, isDone, colorMode, onToggleDone }) {
  return (
    <section className={`${last ? "" : "mb-10 pb-10 border-b border-gray-200/80 dark:border-white/[0.07]"}`} id={`q-${q.id}`} style={{ scrollMarginTop: 24 }}>
      <div className="flex items-start gap-3.5 mb-4">
        <span className="shrink-0 min-w-[2.5rem] h-10 px-2 rounded-xl bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-300 text-[16px] font-extrabold flex items-center justify-center tabular-nums">
          Q{q.number}
        </span>
        <h2 className="flex-1 min-w-0 pt-1 text-[21px] sm:text-[22px] leading-snug font-bold tracking-tight text-gray-900 dark:text-gray-50 light:text-slate-900">
          <InlineCode text={q.question} />
        </h2>
        <div className="shrink-0 flex items-center gap-2 mt-1">
          {q.asked > 0 && (
            <span
              title={`Asked in ${q.asked} interview write-up${q.asked === 1 ? "" : "s"}`}
              className="hidden sm:inline text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/25 whitespace-nowrap"
            >
              asked {q.asked}×
            </span>
          )}
          <button
            onClick={() => onToggleDone(q.id, !isDone)}
            title={isDone ? "Done — click to mark not done" : "Mark this question done"}
            className={`h-8 pl-2 pr-3 rounded-full flex items-center gap-1.5 text-[12.5px] font-bold border transition-colors ${
              isDone
                ? "bg-emerald-500 border-emerald-500 text-white"
                : "border-gray-300 dark:border-white/[0.16] text-gray-600 dark:text-gray-300 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300"
            }`}
          >
            <DoneCircle done={isDone} className="w-4 h-4" onColor="text-white" />
            {isDone ? "Done" : "Mark done"}
          </button>
        </div>
      </div>
      <Answer qid={q.id} source={q.answer} colorMode={colorMode} />
    </section>
  );
});

const Answer = memo(function Answer({ qid, source, colorMode }) {
  return (
    <div data-answer={qid} className="note-md note-reader" data-color-mode={colorMode} style={{ "--note-fs": "17px" }}>
      <MarkdownPreview source={source} style={{ background: "transparent" }} wrapperElement={{ "data-color-mode": colorMode }} />
    </div>
  );
});

// ── Top strip: how far down this module you've read ───────────────────────────

function ReadingProgress({ articleRef, nDone, total, title, immersive, onToggleImmersive }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      setPct(span <= 0 ? 100 : Math.min(100, Math.max(0, (-rect.top / span) * 100)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [articleRef]);

  // A strip of its own above the text, with a solid background, so it never
  // sits on top of a line you're reading. On small screens it stacks under
  // the sticky module picker; in full screen it's the only bar, with the title.
  return (
    <div
      className={`sticky ${immersive ? "top-0" : "top-[57px] lg:top-0"} z-20 bg-white dark:bg-[#0e1427] border-b border-gray-200/80 dark:border-white/[0.07] light:border-slate-900/[0.06]`}
    >
      <div className="px-5 sm:px-10 lg:px-16 py-2 flex items-center gap-4">
        {immersive && (
          <span className="hidden md:block max-w-[40%] truncate text-[13.5px] font-semibold text-gray-800 dark:text-gray-100 light:text-slate-900">{title}</span>
        )}
        <div className="flex-1 h-1.5 rounded-full bg-gray-200/90 dark:bg-white/[0.08] light:bg-slate-900/[0.06] overflow-hidden" title={`${Math.round(pct)}% read`}>
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${pct}%` }} />
        </div>
        <span className="shrink-0 text-[12px] font-semibold tabular-nums text-gray-400 dark:text-gray-500">
          {nDone}/{total} done
        </span>
        <button
          onClick={onToggleImmersive}
          title={immersive ? "Exit full screen (Esc)" : "Read in full screen"}
          className="shrink-0 h-8 px-3 rounded-full flex items-center gap-1.5 text-[12.5px] font-semibold text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-white/[0.14] hover:bg-gray-50 dark:hover:bg-white/[0.05] light:bg-white light:border-slate-900/[0.10] light:text-slate-700"
        >
          {immersive ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16"><path d="M6 2v4H2M10 2v4h4M6 14v-4H2M10 14v-4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16"><path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          )}
          <span className="hidden sm:inline">{immersive ? "Exit full screen" : "Full screen"}</span>
        </button>
      </div>
    </div>
  );
}

// ── Small pieces ──────────────────────────────────────────────────────────────

// A question title with its `code` spans shown as code.
function InlineCode({ text }) {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith("`") && part.endsWith("`") && part.length > 2 ? (
      <code
        key={i}
        className="px-1.5 py-0.5 rounded-md text-[0.85em] font-mono font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-200"
      >
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    )
  );
}

function Floating({ x, y, children }) {
  return (
    <div
      className="fixed z-50 -translate-x-1/2 -translate-y-full flex items-center gap-1 p-1.5 rounded-xl bg-white dark:bg-[#151c33] border border-gray-200 dark:border-white/[0.1] shadow-xl"
      style={{ left: Math.max(90, Math.min(x, window.innerWidth - 90)), top: Math.max(56, y - 8) }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );
}

function Swatch({ color, onPick }) {
  return (
    <button
      title={`Highlight ${color.label.toLowerCase()}`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onPick}
      className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/[0.06]"
    >
      <span className="w-4 h-4 rounded-full border border-black/10" style={{ background: color.swatch }} />
    </button>
  );
}

function DoneCircle({ done, className = "w-4 h-4", onColor = "text-emerald-500" }) {
  return done ? (
    <svg className={`${className} ${onColor} shrink-0`} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" fill="currentColor" className={onColor === "text-white" ? "opacity-25" : ""} />
      <path d="M6 10.2l2.6 2.6L14 7.4" stroke={onColor === "text-white" ? "currentColor" : "white"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg className={`${className} text-gray-300 dark:text-gray-600 shrink-0`} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
