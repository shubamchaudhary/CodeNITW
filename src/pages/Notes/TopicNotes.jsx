import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { toast } from "react-toastify";
import "@uiw/react-markdown-preview/markdown.css";
import { GLASS } from "../../components/glass";
import PageShell from "../../components/PageShell";
import { isOwner } from "../../components/OwnerRoute";
import { CORE_STACK_PRIORITY_CONFIG } from "../../Data/CoreStack";
import useIsDark from "../../hooks/useIsDark";
import { getSyncStatus, subscribeSyncStatus } from "../../Data/cloudSync";
import { requireAuth, requestSignIn } from "../../Data/authGate";
import {
  KEYS,
  loadJSON,
  getSourceNote,
  getAnnotations,
  setAnnotations,
  annotationsKey,
  getLearnt,
  setLearnt,
  learntKey,
  setSourceNote,
  getCoreStackTopic,
  getAIStackTopic,
  subscribe,
} from "../../Data/planStore";
import { uploadNoteImage, loadNoteAssets, assetIdsIn, NoteAssetError } from "../../Data/noteAssets";
import NoteReader, { useStickyHeaderOffset } from "./NoteReader";
import { TOOLBAR, formatSelection, noteStats } from "./noteMarkdown";

// A full page per topic, because a 4-line textarea inside a card is no place to
// think. It opens on the reading view — wide, large type, a contents column —
// where every section can be edited, highlighted or annotated with a personal
// note right there. Write keeps the raw-markdown editor for longer sessions.
// The text itself still lives in the same synced note store the board and the
// Planning page read; personal notes have a synced store of their own.

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

const VIEWS = [
  { key: "read", label: "Read", title: "Read — edit any section in place, select text to highlight or add a note" },
  { key: "write", label: "Write", title: "Markdown editor only" },
];

// Reading preferences are a per-device convenience, so localStorage is fine;
// they never touch the synced note store.
const PREFS_KEY = "notesReaderPrefs";
const FONT_MIN = 14;
const FONT_MAX = 22;
function loadPrefs() {
  try {
    return { fontSize: 17, ...JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") };
  } catch (_) {
    return { fontSize: 17 };
  }
}

export default function TopicNotes() {
  const { source, topicId } = useParams();
  const navigate = useNavigate();
  const config = SOURCES[source];
  const isDark = useIsDark();
  const colorMode = isDark ? "dark" : "light";
  const headerOffset = useStickyHeaderOffset();

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
  const [view, setView] = useState("read");
  const [dragging, setDragging] = useState(false);
  const [prefs, setPrefs] = useState(loadPrefs);
  const [immersive, setImmersive] = useState(false);
  const [annotations, setAnnotationList] = useState([]);
  const [learnt, setLearntMarks] = useState({});
  const [barHeight, setBarHeight] = useState(0);
  const barRef = useRef(null);

  const [assets, setAssets] = useState({});
  // Ids already looked up, so a screenshot whose document is missing is not
  // re-fetched forever.
  const fetchedRef = useRef(new Set());
  const areaRef = useRef(null);
  const saveTimer = useRef(null);
  const dirtyRef = useRef(false);
  // The newest text, for the unmount flush — in the reading view there is no
  // textarea to read it back from.
  const latestRef = useRef("");

  const updatePrefs = useCallback((patch) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  }, []);

  // ── Full-screen reading ──────────────────────────────────────────────────
  // Hides the site header and the topic card and asks the browser for real
  // full screen. If the browser refuses (or has no Fullscreen API), the page
  // still goes chrome-free and Esc brings it back.
  const enterImmersive = useCallback(() => {
    setView("read"); // full screen is for reading
    setImmersive(true);
    const root = document.documentElement;
    if (root.requestFullscreen && !document.fullscreenElement) root.requestFullscreen().catch(() => {});
  }, []);

  const exitImmersive = useCallback(() => {
    setImmersive(false);
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("notes-immersive", immersive);
    return () => document.documentElement.classList.remove("notes-immersive");
  }, [immersive]);

  // Leaving browser full screen (Esc, F11, the browser's own button) ends the
  // reading mode too, so the two never disagree.
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setImmersive(false);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    };
  }, []);

  // Without real full screen, Esc is ours — unless an editor already used it.
  useEffect(() => {
    if (!immersive) return undefined;
    const onKey = (e) => {
      if (e.key !== "Escape" || e.defaultPrevented || document.fullscreenElement) return;
      if (e.target instanceof Element && e.target.closest("textarea, input")) return;
      setImmersive(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [immersive]);

  // The slim bar is sticky in full screen, so anchors and the contents column
  // need to clear it.
  useEffect(() => {
    const el = barRef.current;
    if (!immersive || !el) {
      setBarHeight(0);
      return undefined;
    }
    const update = () => setBarHeight(Math.round(el.getBoundingClientRect().height));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [immersive]);

  // Hydrate once auth has settled, so the per-account note store is in scope.
  // A note with something in it opens to read; an empty one opens to write.
  useEffect(() => {
    if (!authReady || !config || !topic) return;
    const initial = getSourceNote(source, topicId);
    latestRef.current = initial;
    setText(initial);
    setAnnotationList(getAnnotations(source, topicId));
    setLearntMarks(getLearnt(source, topicId));
    setView(initial.trim() || !user ? "read" : "write");
    setLoaded(true);
  }, [authReady, config, topic, source, topicId, user]);

  // Another device (or the Planning page) edited this note — take it, unless
  // there are local edits in flight that would be lost.
  useEffect(() => {
    if (!config) return undefined;
    return subscribe((key) => {
      if (key === annotationsKey(source)) {
        setAnnotationList(getAnnotations(source, topicId));
        return;
      }
      if (key === learntKey(source)) {
        setLearntMarks(getLearnt(source, topicId));
        return;
      }
      if (key !== config.notesKey || dirtyRef.current) return;
      const incoming = loadJSON(config.notesKey, {})[topicId] || "";
      latestRef.current = incoming;
      setText((prev) => (incoming === prev ? prev : incoming));
    });
  }, [config, source, topicId]);

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

  // Typing: debounced save.
  const onChange = useCallback(
    (value) => {
      latestRef.current = value;
      setText(value);
      dirtyRef.current = true;
      setDirty(true);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => persist(value), 600);
    },
    [persist]
  );

  // A discrete change from the reading view (a saved section, a highlight):
  // there is nothing more coming, so save it now.
  const commit = useCallback(
    (value) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      latestRef.current = value;
      setText(value);
      persist(value);
    },
    [persist]
  );

  const changeAnnotations = useCallback(
    (list) => {
      setAnnotationList(list);
      setAnnotations(source, topicId, list);
    },
    [source, topicId]
  );

  // "Learnt" is per topic heading inside this note; ticking it again undoes it.
  const toggleLearnt = useCallback(
    (key) => {
      if (!requireAuth("Sign in to mark topics as learnt — your progress is saved to your account.")) return;
      const next = { ...getLearnt(source, topicId) };
      if (next[key]) delete next[key];
      else next[key] = Date.now();
      setLearnt(source, topicId, next);
      setLearntMarks(next);
    },
    [source, topicId]
  );

  // Flush on unmount so navigating away inside the debounce window still saves.
  useEffect(
    () => () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        if (dirtyRef.current) setSourceNote(source, topicId, latestRef.current);
      }
    },
    [source, topicId]
  );

  // ── Editing helpers ────────────────────────────────────────────────────────
  // An editing target is anything with a textarea and a way to read and set
  // its value: the full editor here, or a section editor in the reading view.
  const mainTarget = useMemo(
    () => ({
      get el() {
        return areaRef.current;
      },
      get: () => (areaRef.current ? areaRef.current.value : latestRef.current),
      set: onChange,
    }),
    [onChange]
  );

  const applyAction = useCallback(
    (action) => {
      const el = areaRef.current;
      if (!el) return;
      const out = formatSelection(el.value, el.selectionStart, el.selectionEnd, action);
      if (!out) return;
      onChange(out.next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(out.caret, out.caret);
      });
    },
    [onChange]
  );

  const insertInto = useCallback((target, snippet) => {
    const el = target.el;
    if (!el) {
      target.set(target.get() + snippet);
      return;
    }
    const { selectionStart: start, selectionEnd: end, value } = el;
    target.set(value.slice(0, start) + snippet + value.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + snippet.length;
      el.setSelectionRange(caret, caret);
    });
  }, []);

  // ── Screenshots ────────────────────────────────────────────────────────────
  const uploadFiles = useCallback(
    async (files, target = mainTarget) => {
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
        insertInto(target, `\n${token}\n`);
        try {
          const { id, path } = await uploadNoteImage({ uid: user.uid, source, topicId, file });
          target.set(target.get().replace(token, `![screenshot](${path})`));
          // The uploader cached the data URL, so mark it fetched and resolve it
          // from cache rather than reading the document straight back.
          fetchedRef.current.add(id);
          const local = await loadNoteAssets(user.uid, [id]);
          setAssets((prev) => ({ ...prev, ...local }));
        } catch (err) {
          target.set(target.get().replace(`\n${token}\n`, ""));
          toast.error(err instanceof NoteAssetError ? err.message : "Upload failed.");
        } finally {
          setUploading((n) => n - 1);
        }
      }
    },
    [user, source, topicId, insertInto, mainTarget]
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
        persist(areaRef.current?.value ?? latestRef.current);
        toast.success("Notes saved");
      }
    },
    [applyAction, persist]
  );

  const stats = useMemo(() => noteStats(text), [text]);

  if (!authReady) return null;
  if (!config) return <Navigate to="/core-stack" replace />;
  if (config.ownerOnly && !isOwner(user)) return <Navigate to="/core-stack" replace />;
  if (!topic) return <Navigate to={config.backTo} replace />;

  const prio = CORE_STACK_PRIORITY_CONFIG[topic.priority];
  const accent = config.accent;
  const isRead = view === "read";
  // What covers the top of the viewport once scrolled: the slim bar in full
  // screen, otherwise the site header only if it really sticks.
  const topOffset = immersive ? barHeight : headerOffset;

  // View switch, then reading or formatting tools, then full screen. Shared by
  // the topic card and the slim full-screen bar — which is for reading only,
  // so it has no view switch.
  const renderControls = (inBar) => (
    <div className={`flex flex-wrap items-center gap-2 ${inBar ? "" : "w-full"}`}>
      {!inBar && (
        <div className="flex items-center gap-0.5 rounded-xl bg-gray-100/80 dark:bg-white/[0.05] p-1">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => (v.key === "read" || requireAuth("Sign in to edit notes — your notes, highlights and personal notes are saved to your account.")) && setView(v.key)}
              title={v.title}
              className={`px-3.5 h-8 rounded-lg text-[13px] font-bold transition-all ${
                view === v.key
                  ? `${accent.button} text-white shadow-md`
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}

      {isRead ? (
        <>
          <div className="flex items-center gap-0.5 rounded-xl bg-gray-100/80 dark:bg-white/[0.05] p-1 ml-1" title="Text size">
            <IconButton
              onClick={() => updatePrefs({ fontSize: Math.max(FONT_MIN, prefs.fontSize - 1) })}
              disabled={prefs.fontSize <= FONT_MIN}
              title="Smaller text"
            >
              <span className="text-[12px] font-bold">A−</span>
            </IconButton>
            <span className="w-9 text-center text-[12px] font-bold tabular-nums text-gray-600 dark:text-gray-300">
              {prefs.fontSize}
            </span>
            <IconButton
              onClick={() => updatePrefs({ fontSize: Math.min(FONT_MAX, prefs.fontSize + 1) })}
              disabled={prefs.fontSize >= FONT_MAX}
              title="Larger text"
            >
              <span className="text-[15px] font-bold">A+</span>
            </IconButton>
          </div>
        </>
      ) : (
        <>
          <span className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-1" />
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
        </>
      )}

      <div className="ml-auto flex items-center gap-3">
        {!inBar && isRead && (
          <p className="hidden 2xl:block text-[12px] text-gray-400 dark:text-gray-500">
            Select text to highlight or add a note · hover a section and press ✎ to edit it
          </p>
        )}
        {(isRead || immersive) && (
          <button
            onClick={immersive ? exitImmersive : enterImmersive}
            title={immersive ? "Exit full screen (Esc)" : "Read in full screen"}
            className="h-9 px-3 rounded-xl flex items-center gap-1.5 text-[12.5px] font-bold text-gray-600 dark:text-gray-300 bg-gray-100/80 dark:bg-white/[0.05] hover:bg-gray-200/80 dark:hover:bg-white/[0.1] hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {immersive ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16"><path d="M6 2v4H2M10 2v4h4M6 14v-4H2M10 14v-4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16"><path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            )}
            {immersive ? "Exit full screen" : "Full screen"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <PageShell allowSticky className={immersive ? "!pb-0" : ""}>
      <div className="w-full max-w-[2200px] mx-auto px-3 sm:px-5 lg:px-8">
        {immersive ? (
          /* ── Full screen: a slim sticky bar sitting right on the page, instead
                of the site header + topic card ── */
          <div
            ref={barRef}
            className="sticky top-0 z-40 -mx-3 sm:-mx-5 lg:-mx-8 px-3 sm:px-5 lg:px-8 py-2.5 backdrop-blur-xl bg-white/90 dark:bg-[#0e1427]/90 border-b border-gray-200/90 dark:border-white/[0.07]"
          >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="min-w-0 flex-1 flex items-baseline gap-2.5">
                <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {topic.id}
                </span>
                <span className="truncate text-[15px] font-extrabold tracking-tight text-gray-900 dark:text-gray-50">{topic.title}</span>
                <span className="shrink-0 hidden sm:inline">
                  <SaveState dirty={dirty} savedAt={savedAt} accent={accent} guest={!user} />
                </span>
              </div>
              {renderControls(true)}
            </div>
          </div>
        ) : (
        /* ── Topic card ── */
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className={`mt-5 mb-5 rounded-3xl ${GLASS} px-4 sm:px-7 pt-5 pb-4`}
        >
          <div className="flex items-start gap-3 sm:gap-4">
            <button
              onClick={() => navigate(config.backTo)}
              title={`Back to ${config.label}`}
              className="mt-1 shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-white/60 dark:bg-white/[0.05] border border-gray-200/80 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {config.label} · {topic.id}
                </span>
                {prio && (
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border ${prio.cls}`}>{prio.label}</span>
                )}
              </div>
              <h1 className="text-[22px] sm:text-[28px] lg:text-[32px] font-extrabold tracking-tight text-gray-900 dark:text-gray-50 leading-tight mt-1">
                {topic.title}
              </h1>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1.5 flex flex-wrap items-center gap-x-2">
                <span>{stats.words.toLocaleString()} words</span>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                {stats.minutes > 0 && (
                  <>
                    <span>≈ {stats.minutes} min read</span>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                  </>
                )}
                <span>
                  {stats.images} screenshot{stats.images === 1 ? "" : "s"}
                </span>
                {annotations.length > 0 && (
                  <>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <span>
                      {annotations.length} personal note{annotations.length === 1 ? "" : "s"}
                    </span>
                  </>
                )}
                {uploading > 0 && <span className={accent.text}>· uploading {uploading}…</span>}
              </p>
            </div>

            <div className="shrink-0 pt-1">
              <SaveState dirty={dirty} savedAt={savedAt} accent={accent} guest={!user} />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200/70 dark:border-white/[0.07]">{renderControls(false)}</div>
        </motion.div>
        )}

        {/* ── Body ── */}
        {loaded && isRead && (
          <NoteReader
            text={text}
            onCommit={commit}
            assets={assets}
            colorMode={colorMode}
            fontSize={prefs.fontSize}
            accent={accent}
            uploadInto={uploadFiles}
            topOffset={topOffset}
            immersive={immersive}
            annotations={annotations}
            onAnnotationsChange={changeAnnotations}
            learnt={learnt}
            onToggleLearnt={toggleLearnt}
          />
        )}

        {loaded && !isRead && (
          <div className="mb-10">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`relative rounded-3xl ${GLASS} p-1.5 transition-all ${dragging ? "ring-2 ring-sky-400/60" : ""}`}
            >
              <textarea
                ref={areaRef}
                value={text}
                onChange={(e) => onChange(e.target.value)}
                onPaste={onPaste}
                onKeyDown={onKeyDown}
                spellCheck={false}
                placeholder={
                  "# What I got wrong\n\nParagraph, **bold**, `code`.\n\n```java\n// paste the snippet that bit you\n```\n\n- [ ] revisit before the next mock\n\nPaste a screenshot straight in — Ctrl/Cmd+V."
                }
                className={`w-full min-h-[75vh] resize-y px-5 py-4 text-[14.5px] leading-[1.7] font-mono rounded-[1.1rem] bg-white/75 dark:bg-slate-950/40 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 border border-gray-200/80 dark:border-white/[0.07] focus:outline-none focus:ring-2 ${accent.ring}`}
              />
              {dragging && (
                <div className="absolute inset-0 rounded-3xl bg-sky-500/10 border-2 border-dashed border-sky-400/70 flex items-center justify-center pointer-events-none">
                  <p className="text-sm font-bold text-sky-600 dark:text-sky-300">Drop the image to upload</p>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </PageShell>
  );
}

function IconButton({ onClick, disabled, title, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/[0.1] disabled:opacity-35 disabled:hover:bg-transparent transition-colors"
    >
      {children}
    </button>
  );
}

// Two steps, both shown: saved on this device (instant), then saved to the
// account (whenever the network allows). "Saved" only appears once the cloud
// has the change, so a slow connection can't hide an unsynced edit.
function SaveState({ dirty, savedAt, accent, guest }) {
  const [, tick] = useState(0);
  const [sync, setSync] = useState(getSyncStatus);
  useEffect(() => subscribeSyncStatus(setSync), []);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 15000);
    return () => clearInterval(t);
  }, []);

  const pill = (dot, text, cls, title) => (
    <span title={title} className={`text-[11px] font-semibold flex items-center gap-1.5 ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {text}
    </span>
  );

  if (guest) {
    return (
      <button onClick={() => requestSignIn()} className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
        Sign in to save changes
      </button>
    );
  }
  if (dirty) return pill("bg-amber-400 animate-pulse", "Saving…", "text-gray-400 dark:text-gray-500");
  if (sync.state === "offline") {
    return pill("bg-amber-400", "Offline · saved on this device", "text-amber-600 dark:text-amber-400", "Will sync to your account when you're back online.");
  }
  if (sync.state === "error") {
    return pill("bg-rose-500", "Not synced yet · retrying", "text-rose-600 dark:text-rose-400", `Saved on this device. Cloud sync failed (${sync.detail || "unknown error"}) and is retrying.`);
  }
  if (sync.state === "pending" || sync.state === "syncing") {
    return pill("bg-amber-400 animate-pulse", "Saved on this device · syncing…", "text-gray-500 dark:text-gray-400", "Waiting for the cloud to confirm.");
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
