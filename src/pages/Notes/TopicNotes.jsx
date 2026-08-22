import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { toast } from "react-toastify";
import MarkdownPreview from "@uiw/react-markdown-preview";
import "@uiw/react-markdown-preview/markdown.css";
import { GLASS, GLASS_PANEL } from "../../components/glass";
import PageShell from "../../components/PageShell";
import { isOwner } from "../../components/OwnerRoute";
import { CORE_STACK_PRIORITY_CONFIG } from "../../Data/CoreStack";
import {
  KEYS,
  loadJSON,
  getSourceNote,
  setSourceNote,
  getCoreStackTopic,
  getAIStackTopic,
  subscribe,
} from "../../Data/planStore";
import {
  uploadNoteImage,
  loadNoteAssets,
  assetIdsIn,
  ASSET_PREFIX,
  NoteAssetError,
} from "../../Data/noteAssets";

// A full page per topic, because a 4-line textarea inside a card is no place to
// think. Markdown in, live preview beside it, screenshots pasted straight from
// the clipboard. The text itself still lives in the same synced note store the
// board and the Planning page read, so nothing forked.

const SOURCES = {
  corestack: {
    label: "Core Stack",
    backTo: "/core-stack",
    notesKey: KEYS.CS_NOTES,
    getTopic: getCoreStackTopic,
    ownerOnly: false,
    accent: {
      text: "text-emerald-600 dark:text-emerald-400",
      bar: "from-emerald-500 to-teal-400",
      button: "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/30",
      ring: "focus:ring-emerald-400/40 focus:border-emerald-400",
      chip: "hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300",
    },
  },
  aistack: {
    label: "AI Stack",
    backTo: "/ai-stack",
    notesKey: KEYS.AI_NOTES,
    getTopic: getAIStackTopic,
    ownerOnly: true,
    accent: {
      text: "text-violet-600 dark:text-violet-400",
      bar: "from-violet-500 to-fuchsia-400",
      button: "bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-violet-500/30",
      ring: "focus:ring-violet-400/40 focus:border-violet-400",
      chip: "hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-300",
    },
  },
};

// Toolbar actions. `wrap` surrounds the selection, `line` prefixes each selected
// line — enough to cover everything people actually reach for.
const TOOLBAR = [
  { key: "h2", label: "H", title: "Heading", line: "## " },
  { key: "bold", label: "B", title: "Bold (Ctrl+B)", wrap: "**", bold: true },
  { key: "italic", label: "I", title: "Italic (Ctrl+I)", wrap: "*", italic: true },
  { key: "code", label: "</>", title: "Inline code", wrap: "`" },
  { key: "block", label: "{ }", title: "Code block", block: "```java\n", blockEnd: "\n```" },
  { key: "ul", label: "•", title: "Bullet list", line: "- " },
  { key: "ol", label: "1.", title: "Numbered list", line: "1. " },
  { key: "task", label: "☑", title: "Checklist", line: "- [ ] " },
  { key: "quote", label: "❝", title: "Quote", line: "> " },
  { key: "hr", label: "—", title: "Divider", insert: "\n\n---\n\n" },
];

export default function TopicNotes() {
  const { source, topicId } = useParams();
  const navigate = useNavigate();
  const config = SOURCES[source];

  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  const topic = config ? config.getTopic(topicId) : null;

  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [view, setView] = useState("split"); // split | write | preview
  const [dragging, setDragging] = useState(false);

  const [assets, setAssets] = useState({});
  // Ids already looked up, so a screenshot whose document is missing is not
  // re-fetched forever.
  const fetchedRef = useRef(new Set());
  const areaRef = useRef(null);
  const saveTimer = useRef(null);
  const dirtyRef = useRef(false);

  // Hydrate once auth has settled, so the per-account note store is in scope.
  useEffect(() => {
    if (!authReady || !config || !topic) return;
    setText(getSourceNote(source, topicId));
    setLoaded(true);
  }, [authReady, config, topic, source, topicId]);

  // Another device (or the Planning page) edited this note — take it, unless
  // there are local edits in flight that would be lost.
  useEffect(() => {
    if (!config) return undefined;
    return subscribe((key) => {
      if (key !== config.notesKey || dirtyRef.current) return;
      const incoming = loadJSON(config.notesKey, {})[topicId] || "";
      setText((prev) => (incoming === prev ? prev : incoming));
    });
  }, [config, topicId]);

  // Screenshots live in their own Firestore documents; the note only carries
  // their paths, so the preview resolves them to data URLs as they appear.
  useEffect(() => {
    if (!user?.uid) return undefined;
    const wanted = assetIdsIn(text).filter((id) => !fetchedRef.current.has(id));
    if (!wanted.length) return undefined;
    wanted.forEach((id) => fetchedRef.current.add(id));
    let alive = true;
    loadNoteAssets(user.uid, wanted).then((found) => {
      if (alive && Object.keys(found).length) setAssets((prev) => ({ ...prev, ...found }));
    });
    return () => {
      alive = false;
    };
  }, [text, user]);

  const persist = useCallback(
    (value) => {
      setSourceNote(source, topicId, value);
      dirtyRef.current = false;
      setDirty(false);
      setSavedAt(Date.now());
    },
    [source, topicId]
  );

  const onChange = useCallback(
    (value) => {
      setText(value);
      dirtyRef.current = true;
      setDirty(true);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => persist(value), 600);
    },
    [persist]
  );

  // Flush on unmount so navigating away inside the debounce window still saves.
  useEffect(
    () => () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        if (dirtyRef.current && areaRef.current) setSourceNote(source, topicId, areaRef.current.value);
      }
    },
    [source, topicId]
  );

  // ── Editing helpers ────────────────────────────────────────────────────────
  const applyAction = useCallback(
    (action) => {
      const el = areaRef.current;
      if (!el) return;
      const { selectionStart: start, selectionEnd: end, value } = el;
      const selected = value.slice(start, end);
      let next;
      let caret;

      if (action.insert) {
        next = value.slice(0, start) + action.insert + value.slice(end);
        caret = start + action.insert.length;
      } else if (action.block) {
        const body = selected || "// code";
        const chunk = action.block + body + action.blockEnd;
        next = value.slice(0, start) + chunk + value.slice(end);
        caret = start + action.block.length + body.length;
      } else if (action.wrap) {
        const body = selected || "text";
        next = value.slice(0, start) + action.wrap + body + action.wrap + value.slice(end);
        caret = start + action.wrap.length + body.length;
      } else if (action.line) {
        // Prefix every line the selection touches, list numbering included.
        const lineStart = value.lastIndexOf("\n", start - 1) + 1;
        const lineEnd = value.indexOf("\n", end);
        const stop = lineEnd === -1 ? value.length : lineEnd;
        const lines = value.slice(lineStart, stop).split("\n");
        const prefixed = lines
          .map((l, i) => (action.key === "ol" ? `${i + 1}. ${l}` : action.line + l))
          .join("\n");
        next = value.slice(0, lineStart) + prefixed + value.slice(stop);
        caret = lineStart + prefixed.length;
      } else return;

      onChange(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(caret, caret);
      });
    },
    [onChange]
  );

  const insertAtCursor = useCallback(
    (snippet) => {
      const el = areaRef.current;
      if (!el) return;
      const { selectionStart: start, selectionEnd: end, value } = el;
      const next = value.slice(0, start) + snippet + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        el.focus();
        const caret = start + snippet.length;
        el.setSelectionRange(caret, caret);
      });
    },
    [onChange]
  );

  // ── Screenshots ────────────────────────────────────────────────────────────
  const uploadFiles = useCallback(
    async (files) => {
      const images = [...files].filter((f) => f.type.startsWith("image/"));
      if (!images.length) return;
      if (!user?.uid) {
        toast.error("Sign in again to upload screenshots.");
        return;
      }

      for (const file of images) {
        setUploading((n) => n + 1);
        // A placeholder keeps the caret position meaningful while the upload
        // runs, and is swapped for the real link (or removed) when it settles.
        const token = `![uploading ${file.name || "screenshot"}…]()`;
        insertAtCursor(`\n${token}\n`);
        try {
          const { id, path } = await uploadNoteImage({ uid: user.uid, source, topicId, file });
          const el = areaRef.current;
          const current = el ? el.value : text;
          onChange(current.replace(token, `![screenshot](${path})`));
          // The uploader cached the data URL, so mark it fetched and resolve it
          // from cache rather than reading the document straight back.
          fetchedRef.current.add(id);
          const local = await loadNoteAssets(user.uid, [id]);
          setAssets((prev) => ({ ...prev, ...local }));
        } catch (err) {
          const el = areaRef.current;
          const current = el ? el.value : text;
          onChange(current.replace(`\n${token}\n`, ""));
          toast.error(err instanceof NoteAssetError ? err.message : "Upload failed.");
        } finally {
          setUploading((n) => n - 1);
        }
      }
    },
    [user, source, topicId, insertAtCursor, onChange, text]
  );

  const onPaste = useCallback(
    (e) => {
      const files = [...(e.clipboardData?.files || [])];
      if (files.some((f) => f.type.startsWith("image/"))) {
        e.preventDefault();
        uploadFiles(files);
      }
    },
    [uploadFiles]
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer?.files?.length) uploadFiles(e.dataTransfer.files);
    },
    [uploadFiles]
  );

  const onKeyDown = useCallback(
    (e) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const key = e.key.toLowerCase();
      if (key === "b") {
        e.preventDefault();
        applyAction(TOOLBAR.find((t) => t.key === "bold"));
      } else if (key === "i") {
        e.preventDefault();
        applyAction(TOOLBAR.find((t) => t.key === "italic"));
      } else if (key === "s") {
        e.preventDefault();
        persist(areaRef.current?.value ?? text);
        toast.success("Notes saved");
      }
    },
    [applyAction, persist, text]
  );

  const stats = useMemo(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const images = (text.match(/!\[[^\]]*\]\((?!\s*\))/g) || []).length;
    return { words, images, chars: text.length };
  }, [text]);

  if (!authReady) return null;
  if (!config) return <Navigate to="/core-stack" replace />;
  if (config.ownerOnly && !isOwner(user)) return <Navigate to="/core-stack" replace />;
  if (!topic) return <Navigate to={config.backTo} replace />;

  const prio = CORE_STACK_PRIORITY_CONFIG[topic.priority];
  const accent = config.accent;

  return (
    <PageShell>
      <div className="min-h-screen flex justify-center px-3">
        <div className="w-full sm:w-11/12 lg:w-5/6 2xl:w-3/4">

          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`mt-6 mb-4 rounded-3xl ${GLASS} px-4 sm:px-6 py-4`}
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() => navigate(config.backTo)}
                title={`Back to ${config.label}`}
                className="mt-0.5 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-white/60 dark:bg-white/[0.05] border border-gray-200/80 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {config.label} · {topic.id}
                  </span>
                  {prio && (
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border ${prio.cls}`}>
                      {prio.label}
                    </span>
                  )}
                </div>
                <h1 className="text-[19px] sm:text-[22px] font-extrabold text-gray-800 dark:text-gray-100 leading-tight mt-0.5">
                  {topic.title}
                </h1>
                <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-1">
                  {stats.words} words · {stats.images} screenshot{stats.images === 1 ? "" : "s"}
                  {uploading > 0 && <span className={accent.text}> · uploading {uploading}…</span>}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <SaveState dirty={dirty} savedAt={savedAt} accent={accent} />
              </div>
            </div>
          </motion.div>

          {/* ── Toolbar ── */}
          <div className={`mb-3 rounded-2xl ${GLASS} px-2 py-2 flex flex-wrap items-center gap-1`}>
            {TOOLBAR.map((action) => (
              <button
                key={action.key}
                onClick={() => applyAction(action)}
                title={action.title}
                className={`min-w-[32px] h-8 px-2 rounded-lg text-[13px] text-gray-600 dark:text-gray-300 border border-transparent hover:bg-white/70 dark:hover:bg-white/[0.06] transition-all ${accent.chip} ${
                  action.bold ? "font-extrabold" : ""
                } ${action.italic ? "italic font-serif" : ""}`}
              >
                {action.label}
              </button>
            ))}

            <span className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-1" />

            <label
              className={`h-8 px-2.5 rounded-lg text-[12px] font-bold flex items-center gap-1.5 cursor-pointer text-gray-600 dark:text-gray-300 border border-transparent hover:bg-white/70 dark:hover:bg-white/[0.06] transition-all ${accent.chip}`}
              title="Add a screenshot (or just paste one)"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16">
                <rect x="2" y="3.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M2 10.5l3-3 3 3 2-2 4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Screenshot
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  uploadFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>

            <div className="ml-auto flex items-center gap-1 rounded-lg bg-white/50 dark:bg-white/[0.04] p-0.5">
              {[
                { key: "write", label: "Write" },
                { key: "split", label: "Split" },
                { key: "preview", label: "Preview" },
              ].map((v) => (
                <button
                  key={v.key}
                  onClick={() => setView(v.key)}
                  className={`px-2.5 h-7 rounded-md text-[12px] font-bold transition-all ${
                    view === v.key
                      ? `${accent.button} text-white shadow-md`
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Editor + preview ── */}
          <div className={`grid gap-3 mb-10 ${view === "split" ? "lg:grid-cols-2" : "grid-cols-1"}`}>
            {view !== "preview" && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={`relative rounded-2xl ${GLASS} p-1 transition-all ${
                  dragging ? "ring-2 ring-sky-400/60" : ""
                }`}
              >
                <textarea
                  ref={areaRef}
                  value={loaded ? text : ""}
                  onChange={(e) => onChange(e.target.value)}
                  onPaste={onPaste}
                  onKeyDown={onKeyDown}
                  spellCheck={false}
                  placeholder={
                    "# What I got wrong\n\nParagraph, **bold**, `code`.\n\n```java\n// paste the snippet that bit you\n```\n\n- [ ] revisit before the next mock\n\nPaste a screenshot straight in — Ctrl/Cmd+V."
                  }
                  className={`w-full min-h-[62vh] p-4 text-[13.5px] leading-relaxed font-mono rounded-xl bg-white/70 dark:bg-slate-900/50 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 border border-gray-200/80 dark:border-white/[0.07] resize-y focus:outline-none focus:ring-2 ${accent.ring}`}
                />
                {dragging && (
                  <div className="absolute inset-0 rounded-2xl bg-sky-500/10 border-2 border-dashed border-sky-400/70 flex items-center justify-center pointer-events-none">
                    <p className="text-sm font-bold text-sky-600 dark:text-sky-300">Drop the image to upload</p>
                  </div>
                )}
              </div>
            )}

            {view !== "write" && (
              <div className={`rounded-2xl ${GLASS} p-4 overflow-x-auto`}>
                {text.trim() ? (
                  <div data-color-mode="auto" className="cs-markdown">
                    <MarkdownPreview
                      source={text}
                      style={{ background: "transparent", fontSize: "14px" }}
                      wrapperElement={{ "data-color-mode": "auto" }}
                      components={{ img: NoteImage(assets) }}
                    />
                  </div>
                ) : (
                  <div className={`${GLASS_PANEL} rounded-xl px-4 py-10 text-center`}>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      Nothing yet. Whatever you write on the left renders here.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

// A screenshot is stored as its own document, so the markdown holds a path and
// this swaps in the resolved data URL. Anything else (an ordinary URL from an
// older note) renders untouched.
function NoteImage(assets) {
  return function Img({ src, alt, ...rest }) {
    if (typeof src === "string" && src.startsWith(ASSET_PREFIX)) {
      const id = src.slice(ASSET_PREFIX.length);
      const data = assets[id];
      if (!data) {
        return (
          <span className="inline-flex items-center gap-2 my-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 dark:border-white/15 text-[12px] text-gray-400 dark:text-gray-500">
            <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-white/20 animate-pulse" />
            loading screenshot…
          </span>
        );
      }
      return (
        <img
          src={data}
          alt={alt || "screenshot"}
          className="rounded-lg border border-gray-200 dark:border-white/10 max-w-full my-2"
        />
      );
    }
    return <img src={src} alt={alt} {...rest} className="rounded-lg max-w-full my-2" />;
  };
}

function SaveState({ dirty, savedAt, accent }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 15000);
    return () => clearInterval(t);
  }, []);

  if (dirty) {
    return (
      <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        Saving…
      </span>
    );
  }
  if (!savedAt) {
    return <span className="text-[11px] text-gray-400 dark:text-gray-500">Synced</span>;
  }
  const secs = Math.round((Date.now() - savedAt) / 1000);
  const when = secs < 5 ? "just now" : secs < 60 ? `${secs}s ago` : `${Math.round(secs / 60)}m ago`;
  return (
    <span className={`text-[11px] font-semibold flex items-center gap-1.5 ${accent.text}`}>
      <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      Saved {when}
    </span>
  );
}
