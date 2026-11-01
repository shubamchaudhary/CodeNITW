import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PageSkeleton from "../../components/PageSkeleton";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { toast } from "react-toastify";
import "@uiw/react-markdown-preview/markdown.css";
import { isOwner } from "../../components/OwnerRoute";
import useIsDark from "../../hooks/useIsDark";
import useTourSandbox from "../../hooks/useTourSandbox";
import { getSyncStatus, subscribeSyncStatus } from "../../Data/cloudSync";
import { requireAuth, requestSignIn, getAuthState } from "../../Data/authGate";
import {
  loadJSON,
  getSourceNote,
  getAnnotations,
  setAnnotations,
  annotationsKey,
  getLearnt,
  setLearnt,
  learntKey,
  setSourceNote,
  subscribe,
} from "../../Data/planStore";
import { uploadNoteImage, loadNoteAssets, assetIdsIn, NoteAssetError } from "../../Data/noteAssets";
import { recordNow, restoreVersion } from "../../Data/noteHistory";
import { hasBuiltInDoc, loadBuiltInDoc } from "../../Data/aiStackDocs";
import { builtInText, needsRebase, rebaseHighlights } from "./builtInCopy";
import NoteReader, { useStickyHeaderOffset } from "./NoteReader";
import StackNav from "./StackNav";
import ResizableSide from "../../components/ResizableSide";
import TopicLead from "./TopicLead";
import AskedQuestions, { hasAskedQuestions } from "./AskedQuestions";
import HistoryPanel, { describeVersion } from "./HistoryPanel";
import useStackProgress from "./useStackProgress";
import { STACKS, rememberTopic, stackForViewer } from "./stacks";
import { TOOLBAR, formatSelection, noteStats } from "./noteMarkdown";
import { Button, Segmented, Icon, buttonClass } from "../../components/ui";

// A topic's page, laid out like a course on a learning site: the stack's topic
// list on the left, the topic in the middle — its header, what to watch, then
// your notes — and the note's contents on the right. The notes open to read
// (wide, large type) and every section can be edited, highlighted or annotated
// in place; Write keeps the raw-markdown editor for longer sessions.

const VIEWS = [
  { key: "read", label: "Read", title: "Read — hover any part to edit it or write below it; select text to highlight or add a note" },
  { key: "write", label: "Write", title: "Markdown editor" },
];

// Reading preferences are a per-device convenience, so localStorage is fine;
// they never touch the synced note store.
const PREFS_KEY = "notesReaderPrefs";
// A built-in document has no images of its own; a stable empty keeps the
// reader from re-deriving on every render.
const NO_ASSETS = {};
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
  const config = STACKS[source];
  const stack = config || STACKS.corestack; // hooks below need a stack even on a bad URL
  const isDark = useIsDark();
  // The site tour acts like a signed-in person (in a throwaway store).
  const sandbox = useTourSandbox();
  const colorMode = isDark ? "dark" : "light";
  const headerOffset = useStickyHeaderOffset();

  // The site footer sits below this page's columns. A sticky sidebar as tall as
  // the window gets pushed up by it at the very bottom of the page, then snaps
  // back the moment the page grows (an answer opening) — the page seems to
  // jump. Leaving the footer's height out of the sidebar means it never moves.
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
  const { completed, planned, setDone, togglePlanned, stampRev } = useStackProgress(stack);

  // Already known when the page is opened after the app has loaded.
  const [authReady, setAuthReady] = useState(() => getAuthState() !== "unknown");
  const [user, setUser] = useState(() => (getAuthState() !== "unknown" ? getAuth().currentUser : null));
  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  const topic = config ? config.getTopic(topicId) : null;
  // The stack as this viewer may see it: Core Stack keeps some of it owner-only.
  const shown = useMemo(() => config && stackForViewer(config, isOwner(user)), [config, user]);

  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);
  // A topic that ships with a document (AI Stack) reads that document, the same
  // for every viewer, instead of the viewer's own note.
  const owner = isOwner(user);
  const builtIn = hasBuiltInDoc(source, topicId, owner);
  const [doc, setDoc] = useState(null);
  useEffect(() => {
    let live = true;
    setDoc(null);
    loadBuiltInDoc(source, topicId, owner).then((d) => live && setDoc(d));
    return () => {
      live = false;
    };
  }, [source, topicId, owner]);
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [preview, setPreview] = useState(null); // a past version being looked at
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

  // A new topic starts at the top, and becomes the one the stack's home reopens.
  useEffect(() => {
    if (!topic) return;
    rememberTopic(source, topic.id);
    window.scrollTo({ top: 0 });
    setDrawerOpen(false);
    setHistoryOpen(false);
    setPreview(null);
  }, [source, topic]);

  // ── Full-screen reading ──────────────────────────────────────────────────
  // Hides the site header and the topic list and asks the browser for real
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
  // A note with something in it opens to read; an empty one opens to write
  // (a guest can only read).
  useEffect(() => {
    if (!authReady || !config || !topic) return;
    const initial = getSourceNote(source, topicId);
    latestRef.current = initial;
    setText(initial);
    setAnnotationList(getAnnotations(source, topicId));
    setLearntMarks(getLearnt(source, topicId));
    setView(initial.trim() || !user || topic.questions?.length ? "read" : "write");
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
      if (config) recordNow(config.notesKey, topicId);
    },
    [persist, config, topicId]
  );

  const changeAnnotations = useCallback(
    (list) => {
      setAnnotationList(list);
      setAnnotations(source, topicId, list);
    },
    [source, topicId]
  );

  const restorePreview = useCallback(() => {
    if (!preview || !config) return;
    if (!requireAuth("Sign in to restore a version.")) return;
    const rev = preview;
    restoreVersion(config.notesKey, topicId, rev.id, () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      latestRef.current = rev.text || "";
      setText(rev.text || "");
      persist(rev.text || "");
      if (annotationsKey(source) && Array.isArray(rev.annotations)) changeAnnotations(rev.annotations);
    });
    setPreview(null);
    setHistoryOpen(false);
    window.scrollTo({ top: 0 });
    toast.success("Version restored. The version it replaced is still in History.");
  }, [preview, config, topicId, persist, changeAnnotations, source]);

  // "Learnt" is per topic heading inside this note; ticking it again undoes it.
  // Learning the last one marks the whole note done in the topic list, and
  // un-learning one while it's done takes the tick back off — "done" means
  // every topic in it is learnt.
  const toggleLearnt = useCallback(
    (key, allKeys = []) => {
      if (!requireAuth("Sign in to mark topics as learnt — your progress is saved to your account.")) return;
      const next = { ...getLearnt(source, topicId) };
      const unlearning = !!next[key];
      if (unlearning) delete next[key];
      else next[key] = Date.now();
      setLearnt(source, topicId, next);
      setLearntMarks(next);

      const allLearnt = allKeys.length > 0 && allKeys.every((k) => next[k]);
      const isDone = !!completed[topicId];
      if (allLearnt && !isDone) {
        setDone(topicId, true);
      } else if (unlearning && isDone && allKeys.length > 0) {
        setDone(topicId, false);
      }
    },
    [source, topicId, completed, setDone]
  );

  // A built-in document was rewritten since this viewer highlighted it: carry
  // their highlights over to the new text, and say so if some were lost.
  useEffect(() => {
    if (!builtIn || !loaded || doc == null || !needsRebase(doc, text)) return;
    const { text: next, kept, total } = rebaseHighlights(text, doc);
    commit(next);
    if (kept < total) toast.info(`This page was updated — ${kept} of ${total} highlights carried over.`);
  }, [builtIn, loaded, doc, text, commit]);

  // Flush on unmount (or topic switch) so leaving inside the debounce window
  // still saves — to the note that was being edited.
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
      }
    },
    [applyAction, persist]
  );

  const stats = useMemo(() => noteStats(builtIn ? doc || "" : text), [builtIn, doc, text]);
  const doneDays = useMemo(
    () => (topic && completed[topic.id] ? stack.daysSinceDone(topic.id) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [topic, completed, stampRev, stack]
  );

  // One Full screen button on screen at a time: the toolbar's while it's in
  // view, and once it scrolls up under the site header, a copy on the right of
  // the pinned progress strip. With no toolbar button (an older version open),
  // the strip's shows from the start.
  const [toolbarFsEl, setToolbarFsEl] = useState(null);
  const [toolbarFsSeen, setToolbarFsSeen] = useState(true);
  useEffect(() => {
    if (!toolbarFsEl) return undefined;
    const observer = new IntersectionObserver(([entry]) => setToolbarFsSeen(entry.isIntersecting), {
      rootMargin: `-${headerOffset}px 0px 0px 0px`,
    });
    observer.observe(toolbarFsEl);
    return () => observer.disconnect();
  }, [toolbarFsEl, headerOffset]);
  const toolbarFsInView = !!toolbarFsEl && toolbarFsSeen;

  if (!authReady) return <PageSkeleton />;
  if (!config) return <Navigate to="/core-stack" replace />;
  if (config.ownerOnly && !isOwner(user)) return <Navigate to="/core-stack" replace />;
  if (!topic) return <Navigate to={config.home} replace />;

  const accent = config.accent;
  const isRead = view === "read";
  // What covers the top of the viewport once scrolled: the slim bar in full
  // screen, otherwise the site header only if it really sticks.
  const topOffset = immersive ? barHeight : headerOffset;
  const pick = (id) => navigate(`/notes/${source}/${id}`);

  const textSize = (
    <div className="flex items-center h-8 rounded-md border border-line-strong bg-canvas" title="Text size">
      <SmallButton
        onClick={() => updatePrefs({ fontSize: Math.max(FONT_MIN, prefs.fontSize - 1) })}
        disabled={prefs.fontSize <= FONT_MIN}
        title="Smaller text"
      >
        A−
      </SmallButton>
      <span className="w-6 text-center font-mono text-[12px] tabular-nums text-fg-subtle">{prefs.fontSize}</span>
      <SmallButton
        onClick={() => updatePrefs({ fontSize: Math.min(FONT_MAX, prefs.fontSize + 1) })}
        disabled={prefs.fontSize >= FONT_MAX}
        title="Larger text"
      >
        A+
      </SmallButton>
    </div>
  );

  // `place`: "toolbar" (beside the text size), "bar" (full screen's slim bar)
  // or "rail" (the progress strip, for when the toolbar has scrolled away).
  const fullScreenButton = (place) => (
    <Button
      ref={place === "toolbar" ? setToolbarFsEl : undefined}
      data-tour={place === "rail" ? undefined : "fullscreen"}
      onClick={immersive ? exitImmersive : enterImmersive}
      title={immersive ? "Exit full screen (Esc)" : "Read in full screen"}
    >
      {immersive ? <Icon.collapse /> : <Icon.expand />}
      {immersive ? "Exit full screen" : "Full screen"}
    </Button>
  );

  const viewSwitch = (
    <Segmented
      options={VIEWS.map((v) => ({ key: v.key, label: v.label, title: v.title, "data-tour": `view-${v.key}` }))}
      value={view}
      onChange={(key) =>
        (key === "read" || requireAuth("Sign in to edit notes — your notes, highlights and personal notes are saved to your account.")) &&
        setView(key)
      }
    />
  );

  const historyButton = (user || sandbox) && (
    <Button data-tour="history" onClick={() => setHistoryOpen(true)} title="Every saved version of this note">
      <Icon.history />
      History
    </Button>
  );

  // Looking at a past version: say so, and offer the two ways out.
  const previewBanner = preview && (
    <div className="mb-6 rounded-lg bg-warning-subtle px-4 py-3 flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-[220px] text-[14px] leading-snug text-fg">
        <span className="font-semibold text-warning-fg">Viewing an older version</span>
        <span className="block text-[13px] text-fg-muted">
          {describeVersion(preview)} · {(preview.words || 0).toLocaleString()} words
          {Array.isArray(preview.annotations) && preview.annotations.length > 0
            ? ` · ${preview.annotations.length} personal note${preview.annotations.length === 1 ? "" : "s"}`
            : ""}
        </span>
      </div>
      <Button variant="primary" onClick={restorePreview}>
        Restore this version
      </Button>
      <Button onClick={() => setPreview(null)}>Back to current</Button>
    </div>
  );

  const meta = (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      {stats.words > 0 && (
        <span>
          {stats.words.toLocaleString()} words · ≈ {stats.minutes} min read
        </span>
      )}
      {annotations.length > 0 && (
        <span>
          · {annotations.length} personal note{annotations.length === 1 ? "" : "s"}
        </span>
      )}
      {uploading > 0 && <span className={accent.text}>· uploading {uploading}…</span>}
      <SaveState dirty={dirty} savedAt={savedAt} accent={accent} guest={!user && !sandbox} />
    </span>
  );

  // Real interview questions for this topic, fixed under the note in both views.
  const asked =
    hasAskedQuestions(source) && topic.asked && !shown.hideQuestions ? (
      <AskedQuestions source={source} topicId={topic.id} colorMode={colorMode} standalone={!!topic.noteless} />
    ) : null;

  const lead = (
    <TopicLead
      stack={shown}
      owner={owner}
      topic={topic}
      done={!!completed[topic.id]}
      doneDays={doneDays}
      planned={planned.has(topic.id)}
      onToggleDone={() => setDone(topic.id, !completed[topic.id])}
      onTogglePlanned={() => togglePlanned(topic)}
      meta={meta}
      tools={
        immersive || topic.noteless ? null : builtIn ? (
          <>
            {textSize}
            {fullScreenButton("toolbar")}
          </>
        ) : preview ? (
          historyButton
        ) : (
          <>
            {viewSwitch}
            {historyButton}
            {isRead && textSize}
            {isRead && fullScreenButton("toolbar")}
          </>
        )
      }
    />
  );
  const blocked = () => toast.info("This is an older version — restore it to change it.");

  const nav = (
    <StackNav stack={shown} activeId={topic.id} completed={completed} planned={planned} onPick={pick} />
  );

  return (
    <div className="min-h-screen bg-canvas">
      {immersive && (
        /* Full screen: a slim sticky bar instead of the site header */
        <div
          ref={barRef}
          className="sticky top-0 z-40 px-4 sm:px-6 py-2.5 bg-canvas border-b border-line"
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="min-w-0 flex-1 flex items-baseline gap-2.5">
              <span className="shrink-0 text-[13px] text-fg-subtle">{config.eyebrow(topic)}</span>
              <span className="truncate text-[15px] font-semibold text-fg">{topic.title}</span>
            </div>
            {textSize}
            {fullScreenButton("bar")}
          </div>
        </div>
      )}

      <div className="flex">
        {!immersive && (
          <ResizableSide footerHeight={footerHeight} prefKey="notesSide">
            {nav}
          </ResizableSide>
        )}

        <main className="flex-1 min-w-0">
          {!immersive && (
            <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-2 border-b border-line bg-canvas">
              <button
                data-tour="topics-drawer"
                onClick={() => setDrawerOpen(true)}
                className={buttonClass("secondary")}
              >
                <Icon.menu />
                {config.label}
              </button>
              <span className="truncate text-[13px] text-fg-subtle">{topic.title}</span>
            </div>
          )}

          {/* A question bank: the asked questions are the page, with no note to write. */}
          {loaded && topic.noteless && (
            <div className="px-5 sm:px-10 lg:px-16 py-8 lg:py-12">
              {lead}
              {asked}
            </div>
          )}

          {/* The topic's built-in document, the same for every viewer: its text
              can't be edited, but highlights (kept in the viewer's own copy),
              personal notes and learnt marks are the viewer's, as on any note. */}
          {loaded && builtIn && doc !== null && !topic.noteless && (
            <NoteReader
              key={`${source}:${topic.id}:doc`}
              flat
              lead={lead}
              starterQuestions={null}
              footer={asked}
              text={builtInText(doc, text)}
              onCommit={commit}
              assets={NO_ASSETS}
              colorMode={colorMode}
              fontSize={prefs.fontSize}
              accent={accent}
              topOffset={topOffset}
              immersive={immersive}
              railTop={immersive ? null : fullScreenButton("rail")}
              railTopShown={!immersive && !toolbarFsInView}
              annotations={annotations}
              onAnnotationsChange={changeAnnotations}
              learnt={learnt}
              onToggleLearnt={toggleLearnt}
              editable={false}
            />
          )}

          {loaded && isRead && !builtIn && !topic.noteless && (
            <NoteReader
              key={`${source}:${topic.id}${preview ? `:${preview.id}` : ""}`}
              flat
              lead={
                <>
                  {previewBanner}
                  {lead}
                </>
              }
              starterQuestions={asked || shown.hideQuestions ? null : topic.questions}
              footer={asked}
              text={preview ? preview.text || "" : text}
              onCommit={preview ? blocked : commit}
              assets={assets}
              colorMode={colorMode}
              fontSize={prefs.fontSize}
              accent={accent}
              uploadInto={uploadFiles}
              topOffset={topOffset}
              immersive={immersive}
              railTop={immersive ? null : fullScreenButton("rail")}
              railTopShown={!immersive && !toolbarFsInView}
              annotations={preview ? preview.annotations || [] : annotations}
              onAnnotationsChange={preview ? blocked : changeAnnotations}
              learnt={preview ? {} : learnt}
              onToggleLearnt={toggleLearnt}
              readOnly={!!preview}
            />
          )}

          {loaded && !isRead && !builtIn && !topic.noteless && (
            <div className="px-5 sm:px-10 lg:px-16 py-8 lg:py-12">
              {lead}
              <div className="mb-3 flex flex-wrap items-center gap-1">
                {TOOLBAR.map((action) => (
                  <button
                    key={action.key}
                    onClick={() => applyAction(action)}
                    title={action.title}
                    className={`min-w-[32px] h-8 px-2 rounded-md text-[13px] text-fg-muted hover:text-fg hover:bg-surface-hover transition-colors ${
                      action.bold ? "font-extrabold" : ""
                    } ${action.italic ? "italic font-serif" : ""}`}
                  >
                    {action.label}
                  </button>
                ))}
                <label
                  className={`${buttonClass("ghost")} cursor-pointer`}
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
              </div>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={`relative rounded-lg ${dragging ? "ring-2 ring-focus" : ""}`}
              >
                <textarea
                  data-tour="note-editor"
                  ref={areaRef}
                  value={text}
                  onChange={(e) => onChange(e.target.value)}
                  onPaste={onPaste}
                  onKeyDown={onKeyDown}
                  spellCheck={false}
                  placeholder={
                    "# What I got wrong\n\nParagraph, **bold**, `code`.\n\n```java\n// paste the snippet that bit you\n```\n\n- [ ] revisit before the next mock\n\nPaste a screenshot straight in — Ctrl/Cmd+V."
                  }
                  className={`w-full min-h-[75vh] resize-y px-5 py-4 text-[14px] leading-[1.7] font-mono rounded-lg bg-surface-subtle text-fg placeholder:text-fg-subtle border border-line focus:outline-none focus:ring-2 ${accent.ring}`}
                />
                {dragging && (
                  <div className="absolute inset-0 rounded-lg bg-brand-subtle border-2 border-dashed border-brand flex items-center justify-center pointer-events-none">
                    <p className="text-[14px] font-medium text-brand-fg">Drop the image to upload</p>
                  </div>
                )}
              </div>
              {asked}
            </div>
          )}
        </main>
      </div>

      {historyOpen && (
        <HistoryPanel
          notesKey={config.notesKey}
          noteId={topic.id}
          current={{ text, annotations: annotationsKey(source) ? annotations : null }}
          previewId={preview?.id}
          onPreview={(rev) => {
            setPreview(rev);
            if (rev) {
              setView("read");
              window.scrollTo({ top: 0 });
            }
          }}
          onClose={() => setHistoryOpen(false)}
        />
      )}

      {drawerOpen && !immersive && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-[340px] bg-surface-subtle shadow-overlay">{nav}</div>
        </div>
      )}
    </div>
  );
}

function SmallButton({ onClick, disabled, title, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className="w-8 h-full rounded-md flex items-center justify-center text-[13px] font-medium text-fg-muted hover:text-fg hover:bg-surface-hover disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
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
    <span title={title} className={`text-[13px] flex items-center gap-1.5 ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {text}
    </span>
  );

  if (guest) {
    return (
      <button onClick={() => requestSignIn()} className="text-[13px] font-medium text-brand-fg hover:underline underline-offset-2">
        Sign in to save changes
      </button>
    );
  }
  if (dirty) return pill("bg-warning-fg animate-pulse", "Saving…", "text-fg-subtle");
  if (sync.state === "offline") {
    return pill("bg-warning-fg", "Offline · saved on this device", "text-warning-fg", "Will sync to your account when you're back online.");
  }
  if (sync.state === "error") {
    return pill("bg-danger-fg", "Not synced yet · retrying", "text-danger-fg", `Saved on this device. Cloud sync failed (${sync.detail || "unknown error"}) and is retrying.`);
  }
  if (sync.state === "pending" || sync.state === "syncing") {
    return pill("bg-warning-fg animate-pulse", "Saved on this device · syncing…", "text-fg-subtle", "Waiting for the cloud to confirm.");
  }
  if (!savedAt) return null;
  const secs = Math.round((Date.now() - savedAt) / 1000);
  const when = secs < 5 ? "just now" : secs < 60 ? `${secs}s ago` : `${Math.round(secs / 60)}m ago`;
  return (
    <span className={`text-[13px] flex items-center gap-1.5 ${accent.text}`}>
      <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      Saved {when}
    </span>
  );
}
