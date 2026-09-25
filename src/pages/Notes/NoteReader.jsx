import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { toast } from "react-toastify";
import { requireAuth } from "../../Data/authGate";
import { ASSET_PREFIX } from "../../Data/noteAssets";
import {
  splitSections,
  spliceSection,
  appendBlock,
  TOOLBAR,
  formatSelection,
  HIGHLIGHTS,
  markOpen,
  findNthInSource,
  occurrences,
  applyWraps,
  unwrapMarkAt,
  recolorMarkAt,
} from "./noteMarkdown";
import {
  buildTextIndex,
  rangeFor,
  anchorFromRange,
  locate,
  caretFromPoint,
  paintRanges,
} from "./noteAnchors";
import "./notes.css";

// The reading view. One surface, like a printed page: the note on the left,
// its contents and your personal notes in a column on the right that stays
// put while the note scrolls.
//
// The note is cut into heading sections (see splitSections) and each renders
// on its own, which is what lets one section flip into an editor in place.
// Every block element carries the offsets of the markdown that produced it,
// so a selection can be traced back to the source and wrapped in a <mark>.
// Personal notes are different: they are pinned to the rendered text (see
// noteAnchors) and never touch the markdown, so they can sit on code too.

// Elements tagged with their source span. `mark` and `code` are tagged for
// removal and whole-span wrapping; the rest are the blocks a selection is
// resolved against.
const TRACKED = ["p", "li", "td", "th", "h1", "h2", "h3", "h4", "h5", "h6", "summary", "details", "dt", "dd", "mark", "code"];
const BLOCK_SELECTOR = TRACKED.filter((t) => t !== "mark" && t !== "code")
  .map((t) => `${t}[data-s]`)
  .join(",");

function tracked(tag) {
  return function Tracked({ node, ...props }) {
    const pos = node && node.position;
    const extra = pos ? { "data-s": pos.start.offset, "data-e": pos.end.offset } : null;
    return React.createElement(tag, extra ? { ...props, ...extra } : props);
  };
}
const TRACKED_COMPONENTS = Object.fromEntries(TRACKED.map((t) => [t, tracked(t)]));

const PAINT_ALL = "note-annotation";
const PAINT_ACTIVE = "note-annotation-active";
const MAX_QUOTE = 2000;

// ─── Rendering ───────────────────────────────────────────────────────────────

// A screenshot is stored as its own document, so the markdown holds a path and
// this swaps in the resolved data URL. Anything else (an ordinary URL from an
// older note) renders untouched.
export function noteImage(assets) {
  return function Img({ node, src, alt, ...rest }) {
    if (typeof src === "string" && src.startsWith(ASSET_PREFIX)) {
      const data = assets[src.slice(ASSET_PREFIX.length)];
      if (!data) {
        return (
          <span className="inline-flex items-center gap-2 my-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 dark:border-white/15 text-[12px] text-gray-400 dark:text-gray-500">
            <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-white/20 animate-pulse" />
            loading screenshot…
          </span>
        );
      }
      return <img src={data} alt={alt || "screenshot"} className="note-img" />;
    }
    return <img src={src} alt={alt} {...rest} className="note-img" />;
  };
}

const MarkdownBlock = memo(function MarkdownBlock({ source, components, colorMode }) {
  return (
    <MarkdownPreview
      source={source}
      components={components}
      style={{ background: "transparent" }}
      wrapperElement={{ "data-color-mode": colorMode }}
    />
  );
});

// How much of the top of the viewport the site header covers once the page is
// scrolled. Its bar is `sticky`, but it sits inside a <header> of exactly its
// own height, so it has nowhere to stick and scrolls away — in that case this
// is 0. It only reports the bar's height if the bar can really stay put.
export function useStickyHeaderOffset() {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const nav = document.querySelector("#root > header nav, #root > nav");
    if (!nav) return undefined;
    const update = () => {
      const { position } = getComputedStyle(nav);
      const own = nav.getBoundingClientRect().height;
      const room = nav.parentElement ? nav.parentElement.getBoundingClientRect().height : 0;
      const sticks = position === "fixed" || (position === "sticky" && room > own + 1);
      setOffset(sticks ? Math.round(own) : 0);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(nav);
    return () => observer.disconnect();
  }, []);
  return offset;
}

// ─── Reader ──────────────────────────────────────────────────────────────────

export default function NoteReader({
  text,
  onCommit,
  assets,
  colorMode,
  fontSize,
  accent,
  uploadInto,
  topOffset = 0, // px of the viewport covered by anything sticky above the page
  immersive = false,
  annotations = [],
  onAnnotationsChange,
  learnt = {},
  onToggleLearnt,
}) {
  const navTop = topOffset;
  const sections = useMemo(() => splitSections(text), [text]);
  const components = useMemo(() => ({ ...TRACKED_COMPONENTS, img: noteImage(assets) }), [assets]);

  const [editing, setEditing] = useState(null); // section index | "append" | null
  const [toolbar, setToolbar] = useState(null); // selection toolbar
  const [markMenu, setMarkMenu] = useState(null); // clicked highlight
  const [notePop, setNotePop] = useState(null); // { mode: new|view|edit, id?, anchor?, top, left }
  const [panel, setPanel] = useState("contents"); // right column: contents | notes
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [placed, setPlaced] = useState({ order: [], badges: [] }); // located notes + margin markers
  const articleRef = useRef(null);
  const mdRef = useRef(null);
  const rangesRef = useRef(new Map()); // annotation id → live Range

  // Section edits can outlive a re-split (a new heading adds sections).
  const editingSection = typeof editing === "number" ? sections[editing] : null;
  useEffect(() => {
    if (typeof editing === "number" && !sections[editing]) setEditing(null);
  }, [editing, sections]);

  const isEmpty = !text.trim();

  // ── Scroll: reading progress and the contents column's active entry ──
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const article = articleRef.current;
      if (!article) return;
      const rect = article.getBoundingClientRect();
      const span = rect.height - (window.innerHeight - navTop);
      setProgress(span > 0 ? Math.min(1, Math.max(0, (navTop - rect.top) / span)) : 1);

      const els = article.querySelectorAll("section[data-sec]");
      let current = 0;
      for (const el of els) {
        if (el.getBoundingClientRect().top <= navTop + 120) current = Number(el.dataset.sec);
        else break;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
      setToolbar(null);
      setMarkMenu(null);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [navTop, sections.length]);

  // ── Personal notes: find each passage, paint it, place its margin marker ──
  const placeNotes = useCallback(() => {
    const md = mdRef.current;
    const article = articleRef.current;
    if (!md || !article) return;
    const index = buildTextIndex(md);
    const ranges = new Map();
    const found = [];
    for (const a of annotations) {
      const span = locate(index, a);
      const range = span && rangeFor(index, span[0], span[1]);
      if (range) {
        ranges.set(a.id, range);
        found.push({ id: a.id, start: span[0] });
      }
    }
    rangesRef.current = ranges;
    paintRanges(PAINT_ALL, [...ranges.values()]);

    // One marker per note, in the right margin, level with the passage's first
    // line. Notes inside a closed answer have no box yet and get no marker.
    const base = article.getBoundingClientRect().top;
    const badges = [];
    for (const { id } of found.sort((x, y) => x.start - y.start)) {
      const rect = ranges.get(id).getClientRects()[0];
      if (!rect || (!rect.width && !rect.height)) continue;
      const top = Math.round(rect.top - base + rect.height / 2 - 13);
      const prev = badges[badges.length - 1];
      const shift = prev && Math.abs(prev.top - top) < 26 ? prev.shift + 1 : 0;
      badges.push({ id, top, shift });
    }
    const orphans = annotations.filter((a) => !ranges.has(a.id)).map((a) => a.id);
    setPlaced({ order: [...found.map((f) => f.id), ...orphans], badges, orphans: new Set(orphans) });
  }, [annotations]);

  useLayoutEffect(() => {
    placeNotes();
  }, [placeNotes, text, editing, fontSize, colorMode, assets]);

  // Layout moves without the text changing too: fonts arriving, an answer
  // opening, the window resizing.
  useEffect(() => {
    const article = articleRef.current;
    if (!article) return undefined;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      if (!frame) frame = requestAnimationFrame(() => {
        frame = 0;
        placeNotes();
      });
    });
    observer.observe(article);
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [placeNotes]);

  useEffect(() => () => {
    paintRanges(PAINT_ALL, []);
    paintRanges(PAINT_ACTIVE, []);
  }, []);

  // The note being looked at gets a stronger paint.
  useEffect(() => {
    const range = notePop?.id ? rangesRef.current.get(notePop.id) : null;
    paintRanges(PAINT_ACTIVE, range ? [range] : []);
  }, [notePop, placed]);

  const popoverAt = useCallback((rect) => {
    const article = articleRef.current.getBoundingClientRect();
    const width = Math.min(360, article.width - 24);
    const left = Math.min(Math.max(12, rect.left - article.left), article.width - width - 12);
    return { top: Math.round(rect.bottom - article.top + 10), left: Math.round(left) };
  }, []);

  const openNote = useCallback(
    (id, { scroll = false } = {}) => {
      const range = rangesRef.current.get(id);
      if (!range) {
        setNotePop({ mode: "view", id, top: null, left: null });
        return;
      }
      if (scroll) {
        const r = range.getBoundingClientRect();
        window.scrollTo({ top: window.scrollY + r.top - Math.max(navTop + 80, window.innerHeight * 0.3), behavior: "smooth" });
      }
      setToolbar(null);
      setMarkMenu(null);
      setNotePop({ mode: "view", id, ...popoverAt(range.getClientRects()[0] || range.getBoundingClientRect()) });
    },
    [navTop, popoverAt]
  );

  // ── Selection → toolbar; click on a highlight or a noted passage → its menu ──
  const onMouseUp = useCallback(
    (e) => {
      if (e.target.closest("textarea, button, input, .note-float, .note-editor, .note-ui")) return;
      const target = e.target;
      const { clientX, clientY } = e;
      // Wait a tick: a click that clears the selection only lands after mouseup.
      setTimeout(() => {
        const sel = window.getSelection();
        const article = articleRef.current;
        if (!article) return;
        if (!sel || !sel.rangeCount || sel.isCollapsed) {
          setToolbar(null);
          // A noted passage wins over a highlight: it's the richer thing.
          const hit = caretFromPoint(clientX, clientY);
          if (hit) {
            for (const [id, range] of rangesRef.current) {
              try {
                if (range.isPointInRange(hit.node, hit.offset)) {
                  openNote(id);
                  setMarkMenu(null);
                  return;
                }
              } catch (_) {}
            }
          }
          const mark = target.closest && target.closest("mark[data-s]");
          const section = mark && mark.closest("section[data-sec]");
          if (mark && section && article.contains(mark)) {
            const r = mark.getBoundingClientRect();
            setMarkMenu({
              x: r.left + r.width / 2,
              y: r.top,
              sec: Number(section.dataset.sec),
              s: Number(mark.dataset.s),
              e: Number(mark.dataset.e),
            });
          } else setMarkMenu(null);
          return;
        }
        const range = sel.getRangeAt(0);
        if (!mdRef.current || !mdRef.current.contains(range.commonAncestorContainer)) return;
        const r = range.getBoundingClientRect();
        const start = range.startContainer.nodeType === Node.TEXT_NODE ? range.startContainer.parentElement : range.startContainer;
        const end = range.endContainer.nodeType === Node.TEXT_NODE ? range.endContainer.parentElement : range.endContainer;
        const inCode = !!(start.closest("pre") && end.closest("pre"));
        setMarkMenu(null);
        setToolbar({ x: r.left + r.width / 2, y: r.top, range: range.cloneRange(), text: sel.toString(), inCode });
      }, 0);
    },
    [openNote]
  );

  const applyHighlight = useCallback(
    (color) => {
      if (!toolbar) return;
      if (!requireAuth("Sign in to highlight — highlights are saved to your account.")) {
        setToolbar(null);
        return;
      }
      const { range } = toolbar;
      const root =
        range.commonAncestorContainer.nodeType === Node.TEXT_NODE
          ? range.commonAncestorContainer.parentNode
          : range.commonAncestorContainer;
      const nodes = [];
      if (range.commonAncestorContainer.nodeType === Node.TEXT_NODE) nodes.push(range.commonAncestorContainer);
      else {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        for (let n = walker.nextNode(); n; n = walker.nextNode()) if (range.intersectsNode(n)) nodes.push(n);
      }

      const spans = [];
      const codeDone = new Set();
      let skipped = 0;
      for (const node of nodes) {
        let a = node === range.startContainer ? range.startOffset : 0;
        let b = node === range.endContainer ? range.endOffset : node.data.length;
        while (a < b && /\s/.test(node.data[a])) a++;
        while (b > a && /\s/.test(node.data[b - 1])) b--;
        if (a >= b) continue;

        const el = node.parentElement;
        const section = el && el.closest("section[data-sec]");
        if (!section) continue;
        if (el.closest("pre")) {
          skipped++;
          continue;
        }
        if (el.closest("mark")) continue; // already highlighted
        const base = sections[Number(section.dataset.sec)].start;

        // Inline code is literal text: wrap the whole `code` span, never inside it.
        const code = el.closest("code[data-s]");
        if (code) {
          if (!codeDone.has(code)) {
            codeDone.add(code);
            spans.push([base + Number(code.dataset.s), base + Number(code.dataset.e)]);
          }
          continue;
        }

        const block = el.closest(BLOCK_SELECTOR);
        if (!block || !section.contains(block)) {
          skipped++;
          continue;
        }
        const before = document.createRange();
        before.setStart(block, 0);
        before.setEnd(node, a);
        const portion = node.data.slice(a, b);
        const k = occurrences(block.textContent, portion).indexOf(before.toString().length);
        const bs = base + Number(block.dataset.s);
        const hit = k === -1 ? null : findNthInSource(text.slice(bs, base + Number(block.dataset.e)), portion, k);
        if (!hit) {
          skipped++;
          continue;
        }
        spans.push([bs + hit[0], bs + hit[1]]);
      }

      window.getSelection()?.removeAllRanges();
      setToolbar(null);
      if (!spans.length) {
        toast.info(skipped ? "Code can't be highlighted — add a Note to it instead." : "Already highlighted.");
        return;
      }
      onCommit(applyWraps(text, spans, markOpen(color)));
      if (skipped) toast.info("Highlighted what I could — code was left alone.");
    },
    [toolbar, sections, text, onCommit]
  );

  const startNote = useCallback(() => {
    if (!toolbar || !mdRef.current) return;
    if (!requireAuth("Sign in to add personal notes — they're saved to your account.")) {
      setToolbar(null);
      return;
    }
    const anchor = anchorFromRange(buildTextIndex(mdRef.current), toolbar.range);
    const rect = toolbar.range.getBoundingClientRect();
    window.getSelection()?.removeAllRanges();
    setToolbar(null);
    if (!anchor) return;
    if (anchor.quote.length > MAX_QUOTE) {
      toast.info("That's a lot of text for one note — select a shorter passage.");
      return;
    }
    setNotePop({ mode: "new", anchor, ...popoverAt(rect) });
  }, [toolbar, popoverAt]);

  const saveNote = useCallback(
    (body) => {
      const trimmed = body.trim();
      if (!notePop) return;
      if (notePop.mode === "new") {
        if (trimmed) {
          const now = Date.now();
          const id = `n${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
          onAnnotationsChange([...annotations, { id, ...notePop.anchor, body: trimmed, createdAt: now, updatedAt: now }]);
          setNotePop({ ...notePop, mode: "view", id });
          return;
        }
        setNotePop(null);
        return;
      }
      if (!trimmed) return;
      onAnnotationsChange(annotations.map((a) => (a.id === notePop.id ? { ...a, body: trimmed, updatedAt: Date.now() } : a)));
      setNotePop({ ...notePop, mode: "view" });
    },
    [notePop, annotations, onAnnotationsChange]
  );

  const deleteNote = useCallback(
    (id) => {
      onAnnotationsChange(annotations.filter((a) => a.id !== id));
      setNotePop((p) => (p && p.id === id ? null : p));
    },
    [annotations, onAnnotationsChange]
  );

  const editFromSelection = useCallback(() => {
    if (!requireAuth("Sign in to edit notes — your notes, highlights and personal notes are saved to your account.")) {
      setToolbar(null);
      return;
    }
    const node = toolbar?.range.startContainer;
    const el = node && (node.nodeType === Node.TEXT_NODE ? node.parentElement : node);
    const section = el && el.closest("section[data-sec]");
    window.getSelection()?.removeAllRanges();
    setToolbar(null);
    if (section) setEditing(Number(section.dataset.sec));
  }, [toolbar]);

  const onMarkAction = useCallback(
    (color) => {
      if (!markMenu) return;
      if (!requireAuth("Sign in to change highlights.")) {
        setMarkMenu(null);
        return;
      }
      const base = sections[markMenu.sec]?.start ?? 0;
      const s = base + markMenu.s;
      const e = base + markMenu.e;
      const next = color ? recolorMarkAt(text, s, e, color) : unwrapMarkAt(text, s, e);
      setMarkMenu(null);
      if (next == null) toast.error("Couldn't find that highlight in the note — edit the section instead.");
      else onCommit(next);
    },
    [markMenu, sections, text, onCommit]
  );

  const startEdit = useCallback((index) => {
    if (!requireAuth("Sign in to edit notes — your notes, highlights and personal notes are saved to your account.")) return;
    setToolbar(null);
    setMarkMenu(null);
    setNotePop(null);
    setEditing(index);
  }, []);

  const saveSection = useCallback(
    (section, draft) => {
      onCommit(spliceSection(text, section, draft));
      setEditing(null);
    },
    [text, onCommit]
  );

  const toc = useMemo(
    () => sections.map((s, i) => ({ ...s, index: i })).filter((s) => s.level >= 1 && s.level <= 3 && s.title),
    [sections]
  );
  // The topics you can mark as learnt: the outline-level headings — the same
  // entries the contents column lists at its top level. Keyed by heading text
  // (a repeated heading gets #2, #3…), so the mark follows the topic even when
  // sections are added or moved around it.
  const topicKeys = useMemo(() => {
    const top = outlineLevel(toc);
    const seen = {};
    const keys = new Map(); // section index → key
    for (const t of toc) {
      if (t.level !== top) continue;
      const base = t.title.toLowerCase().replace(/\s+/g, " ").trim();
      seen[base] = (seen[base] || 0) + 1;
      keys.set(t.index, seen[base] > 1 ? `${base}#${seen[base]}` : base);
    }
    return keys;
  }, [toc]);
  const learntCount = useMemo(() => [...topicKeys.values()].filter((k) => learnt[k]).length, [topicKeys, learnt]);

  const activeTocId = useMemo(() => {
    let id = toc[0]?.id;
    for (const entry of toc) if (entry.index <= active) id = entry.id;
    return id;
  }, [toc, active]);

  const jumpTo = useCallback((id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const byId = useMemo(() => new Map(annotations.map((a) => [a.id, a])), [annotations]);
  const popNote = notePop?.id ? byId.get(notePop.id) : null;

  return (
    <div>
      {/* One surface for the note and its side column, split by a hairline.
          Solid, not frosted: backdrop blur would make the floating toolbars'
          fixed positioning relative to this box instead of the window. */}
      <div
        className={`bg-white dark:bg-[#0e1427] border-gray-200/90 dark:border-white/[0.07] ${
          immersive ? "-mx-3 sm:-mx-5 lg:-mx-8" : "rounded-3xl border shadow-[0_10px_40px_-18px_rgba(15,23,42,0.25)] dark:shadow-[0_10px_40px_-12px_rgba(0,0,0,0.6)]"
        }`}
        // In full screen the page runs from the bar to the bottom of the
        // window with no frame, so nothing of the backdrop shows around it.
        style={immersive ? { minHeight: `calc(100vh - ${navTop}px)` } : undefined}
      >
        <div className="grid xl:grid-cols-[minmax(0,1fr)_19rem] 2xl:grid-cols-[minmax(0,1fr)_21rem]">
          <article
            ref={articleRef}
            onMouseUp={onMouseUp}
            onMouseDown={() => setToolbar(null)}
            className="relative min-w-0 px-5 sm:px-10 lg:px-16 py-8 lg:py-12"
          >
            {toc.length > 2 && (
              <MobileContents toc={toc} activeId={activeTocId} onJump={jumpTo} topicKeys={topicKeys} learnt={learnt} />
            )}

            <div ref={mdRef} className="note-md note-reader" data-color-mode={colorMode} style={{ "--note-fs": `${fontSize}px` }}>
              {isEmpty && editing !== "append" && (
                <div className="text-center py-16">
                  <p className="text-[15px] text-gray-500 dark:text-gray-400">This note is empty.</p>
                  <button
                    onClick={() => startEdit("append")}
                    className={`mt-4 px-4 h-9 rounded-xl text-[13px] font-bold text-white shadow-lg ${accent.button}`}
                  >
                    Start writing
                  </button>
                </div>
              )}

              {!isEmpty &&
                sections.map((s, i) =>
                  editing === i && editingSection ? (
                    <SectionEditor
                      key={`edit-${s.start}`}
                      initial={text.slice(s.start, s.end).replace(/\s+$/, "")}
                      onSave={(draft) => saveSection(s, draft)}
                      onCancel={() => setEditing(null)}
                      uploadInto={uploadInto}
                      accent={accent}
                      navTop={navTop}
                      id={s.id}
                    />
                  ) : (
                    <Section
                      key={i}
                      id={s.id}
                      index={i}
                      level={s.level}
                      source={text.slice(s.start, s.end)}
                      components={components}
                      colorMode={colorMode}
                      navTop={navTop}
                      onEdit={startEdit}
                      learnKey={topicKeys.get(i) || null}
                      learnt={!!learnt[topicKeys.get(i)]}
                      onToggleLearnt={onToggleLearnt}
                    />
                  )
                )}

              {editing === "append" ? (
                <SectionEditor
                  initial=""
                  placeholder={"## New section\n\nWrite in markdown — paste a screenshot straight in."}
                  onSave={(draft) => {
                    onCommit(appendBlock(text, draft));
                    setEditing(null);
                  }}
                  onCancel={() => setEditing(null)}
                  uploadInto={uploadInto}
                  accent={accent}
                  navTop={navTop}
                />
              ) : (
                !isEmpty && (
                  <button
                    onClick={() => startEdit("append")}
                    className="note-add mt-12 w-full rounded-2xl border-2 border-dashed border-gray-300/80 dark:border-white/10 py-4 text-[14px] font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-400 dark:hover:border-white/25 transition-colors"
                  >
                    ＋ Add a section
                  </button>
                )
              )}
            </div>

            {/* Margin markers for personal notes */}
            {placed.badges.map((b) => (
              <button
                key={b.id}
                onClick={() => openNote(b.id)}
                title={byId.get(b.id)?.body}
                style={{ top: b.top, "--shift": b.shift }}
                className={`note-ui note-badge absolute z-10 w-[26px] h-[26px] rounded-full flex items-center justify-center shadow-sm border transition-transform hover:scale-110 ${
                  notePop?.id === b.id
                    ? "bg-amber-400 border-amber-500 text-amber-950"
                    : "bg-amber-100 dark:bg-amber-400/15 border-amber-300 dark:border-amber-400/40 text-amber-700 dark:text-amber-300"
                }`}
              >
                <NoteIcon className="w-3.5 h-3.5" />
              </button>
            ))}

            {notePop && notePop.top != null && (
              <NotePopover
                pop={notePop}
                note={popNote}
                accent={accent}
                onSave={saveNote}
                onClose={() => setNotePop(null)}
                onEdit={() => setNotePop({ ...notePop, mode: "edit" })}
                onDelete={() => deleteNote(notePop.id)}
              />
            )}
          </article>

          {/* The side column: part of the same page, pinned while the note scrolls. */}
          <aside className="hidden xl:block border-l border-gray-200/90 dark:border-white/[0.07]">
            <div className="sticky px-7 pt-10 pb-6" style={{ top: navTop }}>
              <SidePanel
                panel={panel}
                setPanel={setPanel}
                toc={toc}
                activeId={activeTocId}
                activeIndex={active}
                progress={progress}
                onJump={jumpTo}
                accent={accent}
                topOffset={navTop}
                notes={placed.order.map((id) => byId.get(id)).filter(Boolean)}
                orphans={placed.orphans}
                openNoteId={notePop?.id}
                onOpenNote={(id) => openNote(id, { scroll: true })}
                onDeleteNote={deleteNote}
                topicKeys={topicKeys}
                learnt={learnt}
                learntCount={learntCount}
              />
            </div>
          </aside>
        </div>
      </div>

      {toolbar && (
        <FloatingBar x={toolbar.x} y={toolbar.y}>
          {!toolbar.inCode && (
            <>
              {HIGHLIGHTS.map((h) => (
                <SwatchButton key={h.key} swatch={h.swatch} title={`Highlight ${h.label.toLowerCase()}`} onPick={() => applyHighlight(h.key)} />
              ))}
              <Divider />
            </>
          )}
          <FloatText onPick={startNote}>
            <span className="flex items-center gap-1.5">
              <NoteIcon className="w-3.5 h-3.5" />
              Note
            </span>
          </FloatText>
          <FloatText
            onPick={() => {
              navigator.clipboard?.writeText(toolbar.text);
              setToolbar(null);
              toast.success("Copied");
            }}
          >
            Copy
          </FloatText>
          <FloatText onPick={editFromSelection}>Edit</FloatText>
        </FloatingBar>
      )}

      {markMenu && (
        <FloatingBar x={markMenu.x} y={markMenu.y}>
          {HIGHLIGHTS.map((h) => (
            <SwatchButton key={h.key} swatch={h.swatch} title={`Make it ${h.label.toLowerCase()}`} onPick={() => onMarkAction(h.key)} />
          ))}
          <Divider />
          <FloatText onPick={() => onMarkAction(null)}>Remove</FloatText>
        </FloatingBar>
      )}
    </div>
  );
}

// ─── Pieces ──────────────────────────────────────────────────────────────────

const Section = memo(function Section({
  id,
  index,
  level,
  source,
  components,
  colorMode,
  navTop,
  onEdit,
  learnKey,
  learnt,
  onToggleLearnt,
}) {
  return (
    <section
      id={id}
      data-sec={index}
      data-level={level}
      data-learnable={learnKey ? "" : undefined}
      className="note-sec group relative"
      style={{ scrollMarginTop: navTop + 24 }}
    >
      {learnKey && <LearntButton learnt={learnt} onClick={() => onToggleLearnt(learnKey)} />}
      {/* Left gutter on wide screens, so the right one is free for note markers. */}
      <button
        onClick={() => onEdit(index)}
        title="Edit this section"
        className={`note-sec-edit absolute z-10 right-0 lg:right-auto lg:-left-12 lg:top-0 ${learnKey ? "top-11" : "top-0"} w-8 h-8 rounded-lg flex items-center justify-center bg-white/90 dark:bg-slate-800/90 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100 [@media(hover:none)]:opacity-60 transition-opacity`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
          <path d="M11.2 2.3l2.5 2.5-8 8H3.2v-2.5l8-8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      </button>
      <MarkdownBlock source={source} components={components} colorMode={colorMode} />
    </section>
  );
});

// Beside each topic heading: "Mark as learnt", then a solid green "Learnt"
// once done. Clicking a learnt topic undoes it.
function LearntButton({ learnt, onClick }) {
  return (
    <button
      onClick={onClick}
      title={learnt ? "Learnt — click to mark as not learnt" : "Mark this topic as learnt"}
      className={`note-learnt absolute z-10 top-0.5 right-0 h-8 pl-2 pr-3 rounded-full flex items-center gap-1.5 text-[12.5px] font-bold border transition-colors ${
        learnt
          ? "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/30 hover:bg-emerald-600"
          : "bg-white dark:bg-white/[0.03] border-gray-300 dark:border-white/[0.14] text-gray-500 dark:text-gray-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300"
      }`}
    >
      <CheckCircle done={learnt} className="w-4 h-4" onColor="text-white" />
      {learnt ? "Learnt" : "Mark as learnt"}
    </button>
  );
}

// A round tick: filled when done, an empty ring when not.
function CheckCircle({ done, className = "w-4 h-4", onColor = "text-emerald-500" }) {
  return done ? (
    <svg className={`${className} ${onColor} shrink-0`} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="currentColor" opacity={onColor === "text-white" ? 0.25 : 1} />
      <path d="M4.8 8.2l2.1 2.1 4.3-4.5" stroke={onColor === "text-white" ? "currentColor" : "white"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg className={`${className} shrink-0`} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" opacity="0.55" />
    </svg>
  );
}

// In-place editor for one section (or a new one at the end). Anything typed is
// kept even if the editor goes away without Save — switching views or leaving
// the page commits the draft rather than dropping it.
function SectionEditor({ initial, placeholder, onSave, onCancel, uploadInto, accent, navTop, id }) {
  const [draft, setDraftState] = useState(initial);
  const [busy, setBusy] = useState(0);
  const ref = useRef(null);
  const draftRef = useRef(initial);
  const doneRef = useRef(false);
  const saveRef = useRef(onSave);
  saveRef.current = onSave;

  const setDraft = useCallback((value) => {
    draftRef.current = value;
    setDraftState(value);
  }, []);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 6}px`;
  }, [draft]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    el.focus({ preventScroll: true });
    el.setSelectionRange(el.value.length, el.value.length);
    el.scrollIntoView({ block: "nearest" });
    return () => {
      if (!doneRef.current && draftRef.current !== initial) saveRef.current(draftRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = (save) => {
    doneRef.current = true;
    if (save) onSave(draftRef.current);
    else onCancel();
  };

  const target = useMemo(() => ({ get el() { return ref.current; }, get: () => draftRef.current, set: setDraft }), [setDraft]);

  const format = (action) => {
    const el = ref.current;
    if (!el) return;
    const out = formatSelection(el.value, el.selectionStart, el.selectionEnd, action);
    if (!out) return;
    setDraft(out.next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(out.caret, out.caret);
    });
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      finish(false);
      return;
    }
    if (!(e.metaKey || e.ctrlKey)) return;
    const key = e.key.toLowerCase();
    if (key === "enter" || key === "s") {
      e.preventDefault();
      if (!busy) finish(true);
    } else if (key === "b" || key === "i") {
      e.preventDefault();
      format(TOOLBAR.find((t) => t.key === (key === "b" ? "bold" : "italic")));
    }
  };

  const onPaste = async (e) => {
    const files = [...(e.clipboardData?.files || [])];
    if (!files.some((f) => f.type.startsWith("image/"))) return;
    e.preventDefault();
    setBusy((n) => n + 1);
    try {
      await uploadInto(files, target);
    } finally {
      setBusy((n) => n - 1);
    }
  };

  return (
    <div id={id} className="note-editor my-6 rounded-2xl border-2 border-dashed p-2 sm:p-3" style={{ scrollMarginTop: navTop + 24 }}>
      <div className="flex flex-wrap items-center gap-0.5 mb-2">
        {TOOLBAR.map((action) => (
          <button
            key={action.key}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => format(action)}
            title={action.title}
            className={`min-w-[30px] h-7 px-1.5 rounded-md text-[12px] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white ${
              action.bold ? "font-extrabold" : ""
            } ${action.italic ? "italic font-serif" : ""}`}
          >
            {action.label}
          </button>
        ))}
        {busy > 0 && <span className={`ml-2 text-[12px] font-semibold ${accent.text}`}>uploading…</span>}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="hidden sm:inline text-[11px] text-gray-400 dark:text-gray-500 mr-1">Esc to cancel · Ctrl+Enter to save</span>
          <button
            onClick={() => finish(false)}
            className="h-8 px-3 rounded-lg text-[12.5px] font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
          >
            Cancel
          </button>
          <button
            onClick={() => finish(true)}
            disabled={busy > 0}
            className={`h-8 px-3.5 rounded-lg text-[12.5px] font-bold text-white shadow-md disabled:opacity-50 ${accent.button}`}
          >
            Save
          </button>
        </div>
      </div>
      <textarea
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        spellCheck={false}
        placeholder={placeholder}
        className={`note-editor-area w-full min-h-[8rem] resize-none rounded-xl px-4 py-3 font-mono text-[14.5px] leading-relaxed bg-white/80 dark:bg-slate-950/40 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 border border-gray-200 dark:border-white/[0.08] focus:outline-none focus:ring-2 ${accent.ring}`}
      />
    </div>
  );
}

// A personal note, shown under the passage it belongs to. It scrolls with the
// page (it lives inside the article), so typing in it survives a scroll.
function NotePopover({ pop, note, accent, onSave, onClose, onEdit, onDelete }) {
  const editing = pop.mode !== "view";
  const [draft, setDraft] = useState(editing ? note?.body || "" : "");
  const boxRef = useRef(null);
  const areaRef = useRef(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    setDraft(pop.mode === "edit" ? note?.body || "" : pop.mode === "new" ? "" : "");
  }, [pop.mode, pop.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (editing) areaRef.current?.focus({ preventScroll: true });
    boxRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [editing, pop.id]);

  // Click outside: a typed note is kept, not thrown away.
  useEffect(() => {
    const onDown = (e) => {
      if (boxRef.current?.contains(e.target) || e.target.closest?.(".note-ui")) return;
      if (editing && draftRef.current.trim()) onSave(draftRef.current);
      else onClose();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [editing, onSave, onClose]);

  const quote = pop.mode === "new" ? pop.anchor?.quote : note?.quote;
  const when = note?.updatedAt ? new Date(note.updatedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "";

  return (
    <div
      ref={boxRef}
      className="note-ui absolute z-30 w-[22.5rem] max-w-[calc(100%-1.5rem)] rounded-2xl bg-white dark:bg-[#161d33] border border-amber-200 dark:border-amber-400/25 shadow-[0_18px_50px_-12px_rgba(15,23,42,0.35)] dark:shadow-[0_18px_50px_-8px_rgba(0,0,0,0.7)] p-4"
      style={{ top: pop.top, left: pop.left }}
      onMouseUp={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
          <NoteIcon className="w-3.5 h-3.5" /> {pop.mode === "new" ? "New note" : "Your note"}
        </p>
        <button onClick={onClose} title="Close" className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/[0.06]">
          ✕
        </button>
      </div>
      {quote && (
        <p className="mb-3 border-l-[3px] border-amber-300 dark:border-amber-400/50 pl-2.5 text-[12.5px] leading-relaxed italic text-gray-500 dark:text-gray-400 line-clamp-3 whitespace-pre-line">
          {quote}
        </p>
      )}

      {editing ? (
        <>
          <textarea
            ref={areaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                if (pop.mode === "edit") onSave(note?.body || "");
                else onClose();
              } else if ((e.ctrlKey || e.metaKey) && (e.key === "Enter" || e.key.toLowerCase() === "s")) {
                e.preventDefault();
                onSave(draft);
              }
            }}
            rows={4}
            placeholder="What do you want to remember about this?"
            className={`w-full resize-y rounded-xl px-3 py-2.5 text-[14px] leading-relaxed bg-amber-50/60 dark:bg-white/[0.04] text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 border border-amber-200/80 dark:border-white/[0.08] focus:outline-none focus:ring-2 ${accent.ring}`}
          />
          <div className="mt-2.5 flex items-center justify-end gap-1.5">
            <span className="mr-auto text-[11px] text-gray-400 dark:text-gray-500">Ctrl+Enter to save</span>
            <button
              onClick={() => (pop.mode === "edit" ? onSave(note?.body || "") : onClose())}
              className="h-8 px-3 rounded-lg text-[12.5px] font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(draft)}
              disabled={!draft.trim()}
              className="h-8 px-3.5 rounded-lg text-[12.5px] font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 shadow-md shadow-amber-500/20"
            >
              Save note
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-[14.5px] leading-relaxed text-gray-800 dark:text-gray-100 whitespace-pre-wrap break-words">{note?.body}</p>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="mr-auto text-[11px] text-gray-400 dark:text-gray-500">{when}</span>
            <button onClick={onEdit} className="h-8 px-3 rounded-lg text-[12.5px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06]">
              Edit
            </button>
            <button onClick={onDelete} className="h-8 px-3 rounded-lg text-[12.5px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10">
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// The level that actually structures the note: the shallowest heading level
// used more than once. A lone "# Title" above numbered "## Topic" sections is
// the title, not the outline, so the outline starts at ##.
function outlineLevel(toc) {
  const counts = {};
  toc.forEach((t) => (counts[t.level] = (counts[t.level] || 0) + 1));
  const levels = Object.keys(counts).map(Number).sort((a, b) => a - b);
  return levels.find((l) => counts[l] > 1) ?? levels[0] ?? 1;
}

// Which entries to list: everything at the outline level, plus the
// sub-headings of the part you are reading. A 13-topic note with ten
// sub-headings each stays a short list instead of 130 lines.
function visibleEntries(toc, activeIndex) {
  const top = outlineLevel(toc);
  let group = -1; // index into toc of the outline entry you are inside
  toc.forEach((t, i) => {
    if (t.level === top && t.index <= activeIndex) group = i;
  });
  const out = [];
  let parent = -1;
  toc.forEach((t, i) => {
    if (t.level < top) {
      // A heading above the outline is the note's title — the page header
      // already shows the topic, and "Back to top" goes there.
      parent = -1;
    } else if (t.level === top) {
      parent = i;
      out.push(t);
    } else if (parent === group && group !== -1) out.push(t);
  });
  return { entries: out.length ? out : toc, top };
}

// Keep one entry in view inside a list that scrolls without a scrollbar —
// scroll the list itself, never the page.
function useKeepInView(listRef, selector, deps) {
  useEffect(() => {
    const list = listRef.current;
    const el = selector && list?.querySelector(selector);
    if (!list || !el) return;
    const above = el.offsetTop - list.scrollTop;
    const below = above + el.offsetHeight - list.clientHeight;
    if (above < 24) list.scrollTo({ top: el.offsetTop - 24, behavior: "smooth" });
    else if (below > -24) list.scrollTo({ top: el.offsetTop - list.clientHeight + el.offsetHeight + 24, behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

function SidePanel({
  panel,
  setPanel,
  toc,
  activeId,
  activeIndex,
  progress,
  onJump,
  accent,
  topOffset,
  notes,
  orphans,
  openNoteId,
  onOpenNote,
  onDeleteNote,
  topicKeys,
  learnt,
  learntCount,
}) {
  const listRef = useRef(null);
  const { entries, top } = useMemo(() => visibleEntries(toc, activeIndex), [toc, activeIndex]);
  const minLevel = Math.min(...entries.map((t) => t.level), top);
  useKeepInView(listRef, panel === "contents" ? `[data-toc="${activeId}"]` : openNoteId && `[data-note="${openNoteId}"]`, [
    panel,
    activeId,
    entries.length,
    openNoteId,
  ]);

  const listStyle = { maxHeight: `calc(100vh - ${topOffset + 230}px)` };
  const tab = (key, label) => (
    <button
      onClick={() => setPanel(key)}
      className={`pb-2 -mb-px border-b-2 text-[15px] font-semibold transition-colors ${
        panel === key
          ? "border-current text-gray-900 dark:text-gray-50"
          : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Reading progress</p>
        <span className={`text-[12px] font-bold tabular-nums ${accent.text}`}>{Math.round(progress * 100)}%</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-gray-200/90 dark:bg-white/[0.08] overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${accent.bar} transition-[width] duration-200`} style={{ width: `${progress * 100}%` }} />
      </div>

      {topicKeys.size > 0 && (
        <>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Topics learnt</p>
            <span className="text-[12px] font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {learntCount}/{topicKeys.size}
            </span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-gray-200/90 dark:bg-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-[width] duration-300"
              style={{ width: `${(learntCount / topicKeys.size) * 100}%` }}
            />
          </div>
        </>
      )}

      <div className="mt-7 mb-3 flex items-end gap-5 border-b border-gray-200/90 dark:border-white/[0.07]">
        {tab("contents", "On this page")}
        {tab("notes", `Notes${notes.length ? ` · ${notes.length}` : ""}`)}
      </div>

      {panel === "contents" ? (
        entries.length ? (
          <nav ref={listRef} className="note-toc relative overflow-y-auto -ml-2" style={listStyle}>
            {entries.map((t) => {
              const on = t.id === activeId;
              const depth = t.level - minLevel;
              const key = topicKeys.get(t.index);
              const done = !!(key && learnt[key]);
              return (
                <button
                  key={t.id}
                  data-toc={t.id}
                  onClick={() => onJump(t.id)}
                  title={t.title}
                  style={{ paddingLeft: `${8 + depth * 16}px` }}
                  className={`flex w-full items-start gap-2 text-left pr-2 rounded-md leading-snug transition-colors ${
                    depth === 0 ? "py-1.5 text-[14.5px]" : "py-1 text-[13.5px]"
                  } ${
                    on
                      ? `${accent.text} font-semibold`
                      : done
                      ? "text-emerald-700 dark:text-emerald-300 font-medium hover:text-emerald-800 dark:hover:text-emerald-200"
                      : depth === 0
                      ? "text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  }`}
                >
                  {key && (
                    <span className={`mt-[2px] ${done ? "" : "text-gray-300 dark:text-gray-600"}`} title={done ? "Learnt" : "Not learnt yet"}>
                      <CheckCircle done={done} />
                    </span>
                  )}
                  <span className="line-clamp-2">{t.title}</span>
                </button>
              );
            })}
          </nav>
        ) : (
          <p className="text-[13px] text-gray-400 dark:text-gray-500">Add headings (## …) and they show up here.</p>
        )
      ) : notes.length ? (
        <div ref={listRef} className="note-toc overflow-y-auto space-y-2 -mx-1 px-1" style={listStyle}>
          {notes.map((n) => {
            const lost = orphans?.has(n.id);
            return (
              <div
                key={n.id}
                data-note={n.id}
                className={`rounded-xl border px-3 py-2.5 transition-colors ${
                  openNoteId === n.id
                    ? "border-amber-300 dark:border-amber-400/40 bg-amber-50/80 dark:bg-amber-400/[0.07]"
                    : "border-gray-200/90 dark:border-white/[0.07] hover:border-amber-300/80 dark:hover:border-amber-400/30"
                }`}
              >
                <button onClick={() => !lost && onOpenNote(n.id)} className="block w-full text-left" disabled={lost}>
                  <p className="border-l-2 border-amber-300 dark:border-amber-400/50 pl-2 text-[12px] italic text-gray-500 dark:text-gray-400 line-clamp-2">
                    {n.quote}
                  </p>
                  <p className="mt-1.5 text-[13.5px] leading-snug text-gray-800 dark:text-gray-100 line-clamp-3 whitespace-pre-line">{n.body}</p>
                </button>
                {lost && (
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-rose-500 dark:text-rose-400">That text changed — note unpinned</span>
                    <button onClick={() => onDeleteNote(n.id)} className="text-[11px] font-bold text-gray-400 hover:text-rose-500">
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[13px] leading-relaxed text-gray-400 dark:text-gray-500">
          Select any text — a line of code, a question, an answer — and choose <b className="font-semibold">Note</b> to pin your own note to it.
        </p>
      )}

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="mt-4 text-[12.5px] font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
      >
        ↑ Back to top
      </button>
    </div>
  );
}

function MobileContents({ toc, activeId, onJump, topicKeys, learnt }) {
  const minLevel = Math.min(...toc.map((t) => t.level), 3);
  return (
    <details className="xl:hidden mb-6 rounded-xl border border-gray-200/90 dark:border-white/[0.08] bg-gray-50/70 dark:bg-white/[0.02] px-4 py-2.5">
      <summary className="cursor-pointer text-[13px] font-bold text-gray-600 dark:text-gray-300">On this page</summary>
      <div className="mt-2 max-h-72 overflow-y-auto">
        {toc.map((t) => (
          <button
            key={t.id}
            onClick={() => onJump(t.id)}
            style={{ paddingLeft: `${(t.level - minLevel) * 12}px` }}
            className={`flex w-full items-start gap-2 text-left py-1 text-[13px] ${
              t.id === activeId
                ? "font-semibold text-gray-900 dark:text-white"
                : learnt[topicKeys.get(t.index)]
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {topicKeys.has(t.index) && (
              <span className={`mt-[1px] ${learnt[topicKeys.get(t.index)] ? "" : "text-gray-300 dark:text-gray-600"}`}>
                <CheckCircle done={!!learnt[topicKeys.get(t.index)]} className="w-3.5 h-3.5" />
              </span>
            )}
            {t.title}
          </button>
        ))}
      </div>
    </details>
  );
}

function NoteIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 16 16">
      <path
        d="M3 3.5A1.5 1.5 0 014.5 2h7A1.5 1.5 0 0113 3.5v6A1.5 1.5 0 0111.5 11H7l-3 3v-3h0A1 1 0 013 10V3.5z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M5.5 5.5h5M5.5 8h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function FloatingBar({ x, y, children }) {
  // Keep it on screen near the edges; flip below the selection near the top.
  const left = Math.min(Math.max(x, 170), window.innerWidth - 170);
  const below = y < 120;
  return (
    <div
      className="note-float fixed z-[70] flex items-center gap-1 rounded-xl px-1.5 py-1.5 bg-slate-900/95 dark:bg-slate-800/95 text-white shadow-2xl ring-1 ring-white/10"
      style={{ left, top: below ? y + 28 : y - 10, transform: below ? "translate(-50%, 0)" : "translate(-50%, -100%)" }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );
}

function SwatchButton({ swatch, title, onPick }) {
  return (
    <button
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onPick}
      className="w-6 h-6 rounded-full ring-2 ring-white/20 hover:ring-white/70 hover:scale-110 transition-transform"
      style={{ background: swatch }}
    />
  );
}

function FloatText({ onPick, children }) {
  return (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={onPick}
      className="h-7 px-2 rounded-lg text-[12.5px] font-semibold text-white/85 hover:text-white hover:bg-white/10"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-5 bg-white/15 mx-0.5" />;
}
