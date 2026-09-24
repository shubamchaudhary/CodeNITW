import React, {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { toast } from "react-toastify";
import { GLASS } from "../../components/glass";
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
import "./notes.css";

// The reading view. The note is cut into heading sections (see splitSections)
// and each renders on its own, which is what lets one section flip into an
// editor in place while the rest of the page stays put. Every block element
// carries the offsets of the markdown that produced it, so a text selection
// can be traced back to the source and wrapped in a <mark>.

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

// Whole-note render for the Split view: no sections, no highlighting, and a
// deferred source so typing never waits on a 9,000-word re-render.
export function NotePreview({ text, assets, colorMode, fontSize }) {
  const deferred = useDeferredValue(text);
  const components = useMemo(() => ({ img: noteImage(assets) }), [assets]);
  return (
    <div className="note-md" data-color-mode={colorMode} style={{ "--note-fs": `${fontSize}px` }}>
      <MarkdownBlock source={deferred} components={components} colorMode={colorMode} />
    </div>
  );
}

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
  wide,
  accent,
  uploadInto,
  topOffset = 0, // px of the viewport covered by anything sticky above the page
}) {
  const navTop = topOffset;
  const sections = useMemo(() => splitSections(text), [text]);
  const components = useMemo(() => ({ ...TRACKED_COMPONENTS, img: noteImage(assets) }), [assets]);

  const [editing, setEditing] = useState(null); // section index | "append" | null
  const [toolbar, setToolbar] = useState(null); // selection toolbar
  const [markMenu, setMarkMenu] = useState(null); // clicked highlight
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const articleRef = useRef(null);

  // Section edits can outlive a re-split (a new heading adds sections), so the
  // editor is keyed to the section's start offset, not just its index.
  const editingSection = typeof editing === "number" ? sections[editing] : null;
  useEffect(() => {
    if (typeof editing === "number" && !sections[editing]) setEditing(null);
  }, [editing, sections]);

  const isEmpty = !text.trim();

  // ── Scroll: progress bar and the contents rail's active entry ──
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

  const toc = useMemo(
    () => sections.map((s, i) => ({ ...s, index: i })).filter((s) => s.level >= 1 && s.level <= 3 && s.title),
    [sections]
  );
  const activeTocId = useMemo(() => {
    let id = toc[0]?.id;
    for (const entry of toc) if (entry.index <= active) id = entry.id;
    return id;
  }, [toc, active]);

  const jumpTo = useCallback((id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // ── Selection → highlight toolbar; click on a highlight → its menu ──
  const onMouseUp = useCallback((e) => {
    if (e.target.closest("textarea, button, input, .note-float, .note-editor")) return;
    const target = e.target;
    // Wait a tick: a click that clears the selection only lands after mouseup.
    setTimeout(() => {
      const sel = window.getSelection();
      const article = articleRef.current;
      if (!article) return;
      if (!sel || !sel.rangeCount || sel.isCollapsed) {
        setToolbar(null);
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
      if (!article.contains(range.commonAncestorContainer)) return;
      const r = range.getBoundingClientRect();
      setMarkMenu(null);
      setToolbar({ x: r.left + r.width / 2, y: r.top, range: range.cloneRange(), text: sel.toString() });
    }, 0);
  }, []);

  const applyHighlight = useCallback(
    (color) => {
      if (!toolbar) return;
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
        toast.info(skipped ? "Code blocks and formatted symbols can't be highlighted — try plain text." : "Already highlighted.");
        return;
      }
      onCommit(applyWraps(text, spans, markOpen(color)));
      if (skipped) toast.info("Highlighted what I could — code blocks were left alone.");
    },
    [toolbar, sections, text, onCommit]
  );

  const editFromSelection = useCallback(() => {
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
    setToolbar(null);
    setMarkMenu(null);
    setEditing(index);
  }, []);

  const saveSection = useCallback(
    (section, draft) => {
      onCommit(spliceSection(text, section, draft));
      setEditing(null);
    },
    [text, onCommit]
  );

  return (
    <div className="grid gap-6 xl:gap-0 xl:grid-cols-[minmax(0,1fr)_17rem] 2xl:grid-cols-[minmax(0,1fr)_18.5rem]">
      <article
        ref={articleRef}
        onMouseUp={onMouseUp}
        onMouseDown={() => setToolbar(null)}
        className={`${GLASS} rounded-3xl min-w-0 self-start px-5 sm:px-8 lg:px-12 py-7 lg:py-11 xl:mr-8`}
      >
        {toc.length > 2 && <MobileContents toc={toc} activeId={activeTocId} onJump={jumpTo} />}

        <div
          className={`note-md note-reader ${wide ? "" : "max-w-[52rem] mx-auto"}`}
          data-color-mode={colorMode}
          style={{ "--note-fs": `${fontSize}px` }}
        >
          {isEmpty && editing !== "append" && (
            <div className="text-center py-16">
              <p className="text-[15px] text-gray-500 dark:text-gray-400">This note is empty.</p>
              <button
                onClick={() => setEditing("append")}
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
                onClick={() => setEditing("append")}
                className="note-add mt-10 w-full rounded-2xl border-2 border-dashed border-gray-300/80 dark:border-white/10 py-4 text-[14px] font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-400 dark:hover:border-white/25 transition-colors"
              >
                ＋ Add a section
              </button>
            )
          )}
        </div>
      </article>

      {/* Contents: plain text in its own column behind a hairline, not a card.
          The column stretches to the article's height so the line runs the
          full length, and the list inside it sticks. */}
      <aside className="hidden xl:block border-l border-gray-300/60 dark:border-white/[0.09] pl-7">
        <div className="sticky" style={{ top: navTop + 24 }}>
          <Contents toc={toc} activeId={activeTocId} activeIndex={active} progress={progress} onJump={jumpTo} accent={accent} topOffset={navTop} />
        </div>
      </aside>

      {toolbar && (
        <FloatingBar x={toolbar.x} y={toolbar.y}>
          {HIGHLIGHTS.map((h) => (
            <SwatchButton key={h.key} swatch={h.swatch} title={`Highlight ${h.label.toLowerCase()}`} onPick={() => applyHighlight(h.key)} />
          ))}
          <Divider />
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

const Section = memo(function Section({ id, index, level, source, components, colorMode, navTop, onEdit }) {
  return (
    <section
      id={id}
      data-sec={index}
      data-level={level}
      className="note-sec group relative"
      style={{ scrollMarginTop: navTop + 24 }}
    >
      <button
        onClick={() => onEdit(index)}
        title="Edit this section"
        className="note-sec-edit absolute z-10 top-0 right-0 lg:-right-11 w-8 h-8 rounded-lg flex items-center justify-center bg-white/90 dark:bg-slate-800/90 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100 [@media(hover:none)]:opacity-60 transition-opacity"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
          <path d="M11.2 2.3l2.5 2.5-8 8H3.2v-2.5l8-8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      </button>
      <MarkdownBlock source={source} components={components} colorMode={colorMode} />
    </section>
  );
});

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

// The level that actually structures the note: the shallowest heading level
// used more than once. A lone "# Title" above numbered "## Topic" sections is
// the title, not the outline, so the outline starts at ##.
function outlineLevel(toc) {
  const counts = {};
  toc.forEach((t) => (counts[t.level] = (counts[t.level] || 0) + 1));
  const levels = Object.keys(counts).map(Number).sort((a, b) => a - b);
  return levels.find((l) => counts[l] > 1) ?? levels[0] ?? 1;
}

// Which entries to list: everything down to the outline level, plus the
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

function Contents({ toc, activeId, activeIndex, progress, onJump, accent, topOffset }) {
  const listRef = useRef(null);
  const { entries, top } = useMemo(() => visibleEntries(toc, activeIndex), [toc, activeIndex]);
  const minLevel = Math.min(...entries.map((t) => t.level), top);

  // Keep the active entry in view without a scrollbar: scroll the list itself,
  // never the page.
  useEffect(() => {
    const list = listRef.current;
    const el = list?.querySelector(`[data-toc="${activeId}"]`);
    if (!list || !el) return;
    const above = el.offsetTop - list.scrollTop;
    const below = above + el.offsetHeight - list.clientHeight;
    if (above < 24) list.scrollTo({ top: el.offsetTop - 24, behavior: "smooth" });
    else if (below > -24) list.scrollTo({ top: el.offsetTop - list.clientHeight + el.offsetHeight + 24, behavior: "smooth" });
  }, [activeId, entries.length]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Reading progress</p>
        <span className={`text-[12px] font-bold tabular-nums ${accent.text}`}>{Math.round(progress * 100)}%</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-gray-200/90 dark:bg-white/[0.08] overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${accent.bar} transition-[width] duration-200`} style={{ width: `${progress * 100}%` }} />
      </div>

      <p className="mt-7 mb-3 text-[17px] font-semibold text-gray-800 dark:text-gray-100">On this page</p>
      {entries.length ? (
        <nav
          ref={listRef}
          className="note-toc relative overflow-y-auto -ml-2"
          style={{ maxHeight: `calc(100vh - ${topOffset + 210}px)` }}
        >
          {entries.map((t) => {
            const on = t.id === activeId;
            const depth = t.level - minLevel;
            return (
              <button
                key={t.id}
                data-toc={t.id}
                onClick={() => onJump(t.id)}
                title={t.title}
                style={{ paddingLeft: `${8 + depth * 16}px` }}
                className={`block w-full text-left pr-2 rounded-md leading-snug transition-colors ${
                  depth === 0 ? "py-1.5 text-[14.5px]" : "py-1 text-[13.5px]"
                } ${
                  on
                    ? `${accent.text} font-semibold`
                    : depth === 0
                    ? "text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                <span className="line-clamp-2">{t.title}</span>
              </button>
            );
          })}
        </nav>
      ) : (
        <p className="text-[13px] text-gray-400 dark:text-gray-500">Add headings (## …) and they show up here.</p>
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

function MobileContents({ toc, activeId, onJump }) {
  const minLevel = Math.min(...toc.map((t) => t.level), 3);
  return (
    <details className="xl:hidden mb-6 rounded-xl border border-gray-200/90 dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.02] px-4 py-2.5">
      <summary className="cursor-pointer text-[13px] font-bold text-gray-600 dark:text-gray-300">On this page</summary>
      <div className="mt-2 max-h-72 overflow-y-auto">
        {toc.map((t) => (
          <button
            key={t.id}
            onClick={() => onJump(t.id)}
            style={{ paddingLeft: `${(t.level - minLevel) * 12}px` }}
            className={`block w-full text-left py-1 text-[13px] ${
              t.id === activeId ? "font-semibold text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>
    </details>
  );
}

function FloatingBar({ x, y, children }) {
  // Keep it on screen near the edges; flip below the selection near the top.
  const left = Math.min(Math.max(x, 140), window.innerWidth - 140);
  const below = y < 120;
  return (
    <div
      className="note-float fixed z-[70] flex items-center gap-1 rounded-xl px-1.5 py-1.5 bg-slate-900/95 dark:bg-slate-800/95 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur"
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
