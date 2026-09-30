import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { onAuthStateChange, requestSignIn } from "../Data/authGate";
import { fetchContests } from "../Data/contestsFeed";
import { KEYS } from "../Data/planStore";
import { recordNow } from "../Data/noteHistory";
import { enterSandbox, leaveSandbox } from "../Data/tourSandbox";
import { DSAPrep, StackHome, TopicNotes, JobTracker, Contests, Planning } from "../pageLoaders";

// A guided, auto-played walk through the site. startTour() (the landing
// page's "Take a quick tour" button) loads every page first, then a cursor
// really uses the site — writes a note, highlights it, plans a day, runs a
// focus timer — while a caption types out what it's doing. Everything it
// changes happens in a throwaway sandbox (Data/tourSandbox) that is wiped at
// the end. Any click, key press or scroll by the visitor ends the tour and
// hands control back.

const PREP_MIN_MS = 2000; // the "getting ready" card stays at least this long
const PREP_MAX_MS = 8000; // …and never longer: a slow network skips the wait
const FADE_OUT_MS = 260;
const FADE_IN_MS = 520;
const CAPTION_CHAR_MS = 28;
const TYPE_CHAR_MS = 22;
const CURSOR_MS = 650;

const CHAPTERS = ["Core Stack", "DSA", "Jobs", "Contests", "Planning"];

const NOTE_PART_1 = "## Group by department\n\nUse groupingBy to bucket employees by department, then count or average inside it.\n\n";
const NOTE_PART_2 = "## Top earner per department\n\nmaxBy gives an Optional per group, so unwrap it with collectingAndThen.\n";
const HIGHLIGHT_PHRASE = "bucket employees by department";
const NOTE_PHRASE = "maxBy gives an Optional per group";
const PERSONAL_NOTE = "Say why: a group could be empty, so maxBy can't promise a value.";

const preloadAll = () =>
  Promise.allSettled([
    DSAPrep.preload(),
    StackHome.preload(),
    TopicNotes.preload(),
    JobTracker.preload(),
    Contests.preload(),
    Planning.preload(),
    fetchContests(),
  ]);

const listeners = new Set();
export function startTour() {
  listeners.forEach((fn) => fn());
}

// ─── Small helpers ────────────────────────────────────────────────────────────
const CANCELLED = Symbol("tour cancelled");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const nextFrames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
const ease = (p) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);
const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const visible = (el) => !!el && el.getClientRects().length > 0;
const root = () => document.getElementById("page-root");

// Page transitions are plain inline styles with a CSS transition, cleared
// again at the end, so nothing can stay stuck on the page afterwards.
async function fadeRoot(to, ms) {
  const el = root();
  if (!el || reducedMotion()) return;
  el.style.transition = `opacity ${ms}ms cubic-bezier(.4,0,.2,1), transform ${ms}ms cubic-bezier(.4,0,.2,1)`;
  el.style.opacity = to.opacity;
  el.style.transform = to.transform || "none";
  await sleep(ms);
}
function placeRoot(style) {
  const el = root();
  if (!el || reducedMotion()) return;
  el.style.transition = "none";
  el.style.opacity = style.opacity;
  el.style.transform = style.transform || "none";
  void el.offsetHeight; // apply before the next transition starts
}
function clearRoot() {
  const el = root();
  if (!el) return;
  el.style.transition = "";
  el.style.opacity = "";
  el.style.transform = "";
}

// Set a React-controlled field's value the way typing would.
function setFieldValue(el, value) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

// The first text node under `scope` that contains `phrase`.
function findText(scope, phrase) {
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const i = n.data.indexOf(phrase);
    if (i !== -1 && visible(n.parentElement)) return { node: n, start: i };
  }
  return null;
}

export default function SiteTour() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState("idle"); // idle | prep | play | end
  const [chapter, setChapter] = useState(0);
  const [caption, setCaption] = useState("");
  const [cursor, setCursor] = useState(null); // { x, y, down }
  const run = useRef(0); // bumps on every start/stop, so a stale run quits
  const pillRef = useRef(null);
  const themeRef = useRef(null); // the visitor's theme while the tour borrows it

  const restoreTheme = () => {
    if (themeRef.current == null) return;
    document.documentElement.classList.toggle("dark", themeRef.current);
    themeRef.current = null;
  };

  const stop = () => {
    run.current++;
    clearRoot();
    restoreTheme();
    leaveSandbox();
    setCursor(null);
    setPhase("idle");
  };

  const begin = async () => {
    const id = ++run.current;
    const alive = () => run.current === id;
    const check = () => {
      if (!alive()) throw CANCELLED;
    };
    const wait = async (ms) => {
      await sleep(ms);
      check();
    };

    // ── Tools the script uses ──
    const find = async (sel, timeout = 4000) => {
      const t0 = Date.now();
      for (;;) {
        const el = [...document.querySelectorAll(sel)].find(visible);
        if (el) return el;
        if (Date.now() - t0 > timeout) throw new Error(`tour: nothing matches ${sel}`);
        await wait(60);
      }
    };
    const findByText = async (sel, text) => {
      const t0 = Date.now();
      for (;;) {
        const el = [...document.querySelectorAll(sel)].find((e) => visible(e) && e.textContent.trim() === text);
        if (el) return el;
        if (Date.now() - t0 > 4000) throw new Error(`tour: no "${text}"`);
        await wait(60);
      }
    };
    const say = async (text) => {
      setCaption("");
      for (let i = 1; i <= text.length; i++) {
        setCaption(text.slice(0, i));
        await wait(CAPTION_CHAR_MS);
      }
    };
    const scrollWindowTo = async (y, ms) => {
      const from = window.scrollY;
      const to = Math.max(0, Math.min(y, document.documentElement.scrollHeight - window.innerHeight));
      if (Math.abs(to - from) < 4) return;
      if (reducedMotion()) return window.scrollTo(0, to);
      const t0 = performance.now();
      for (;;) {
        const p = Math.min(1, (performance.now() - t0) / ms);
        window.scrollTo(0, from + (to - from) * ease(p));
        if (p >= 1) break;
        await new Promise(requestAnimationFrame);
        check();
      }
    };
    const scrollBox = async (el, by, ms) => {
      const from = el.scrollTop;
      const to = Math.min(from + by, el.scrollHeight - el.clientHeight);
      const t0 = performance.now();
      for (;;) {
        const p = Math.min(1, (performance.now() - t0) / ms);
        el.scrollTop = from + (to - from) * ease(p);
        if (p >= 1) break;
        await new Promise(requestAnimationFrame);
        check();
      }
    };
    // Bring an element on screen (gently), then glide the cursor onto it.
    const pointAt = async (el, { scrollMs = 700 } = {}) => {
      let r = el.getBoundingClientRect();
      if (r.top < 90 || r.bottom > window.innerHeight - 140) {
        await scrollWindowTo(window.scrollY + r.top - window.innerHeight * 0.4, scrollMs);
        r = el.getBoundingClientRect();
      }
      setCursor((c) => ({ x: r.left + Math.min(r.width / 2, 40), y: r.top + r.height / 2, down: false, from: c }));
      await wait(CURSOR_MS);
    };
    const click = async (el) => {
      await pointAt(el);
      setCursor((c) => c && { ...c, down: true });
      await wait(160);
      el.click();
      setCursor((c) => c && { ...c, down: false });
      await wait(250);
    };
    const type = async (el, text, from = el.value) => {
      el.focus({ preventScroll: true });
      for (let i = 1; i <= text.length; i++) {
        setFieldValue(el, from + text.slice(0, i));
        el.scrollTop = el.scrollHeight;
        await wait(text[i - 1] === "\n" ? 90 : TYPE_CHAR_MS);
      }
    };
    // Drag-select a phrase in the reading view, like a mouse would.
    const select = async (phrase) => {
      const scope = await find("section[data-sec]");
      let hit = null;
      for (const t0 = Date.now(); !hit && Date.now() - t0 < 4000; await wait(60)) {
        hit = [...document.querySelectorAll("section[data-sec]")].map((s) => findText(s, phrase)).find(Boolean);
      }
      if (!hit || !scope) throw new Error(`tour: no text "${phrase}"`);
      const range = document.createRange();
      range.setStart(hit.node, hit.start);
      range.setEnd(hit.node, hit.start);
      await pointAt(hit.node.parentElement);
      const startRect = range.getBoundingClientRect();
      setCursor({ x: startRect.left, y: startRect.top + startRect.height / 2, down: true });
      await wait(CURSOR_MS);
      const sel = window.getSelection();
      const steps = 14;
      for (let k = 1; k <= steps; k++) {
        range.setEnd(hit.node, hit.start + Math.round((phrase.length * k) / steps));
        sel.removeAllRanges();
        sel.addRange(range);
        const rects = range.getClientRects();
        const last = rects[rects.length - 1];
        if (last) setCursor({ x: last.right, y: last.top + last.height / 2, down: true, instant: true });
        await wait(35);
      }
      const r = range.getBoundingClientRect();
      hit.node.parentElement.dispatchEvent(
        new MouseEvent("mouseup", { bubbles: true, clientX: r.right, clientY: r.top + r.height / 2 })
      );
      setCursor((c) => c && { ...c, down: false, instant: false });
      await wait(450);
    };
    // Fade the page out, switch (running `whileHidden` first), fade back in.
    const go = async (path, chapterIdx, whileHidden) => {
      await fadeRoot({ opacity: "0", transform: "translateY(-12px)" }, FADE_OUT_MS);
      check();
      whileHidden?.();
      setCaption("");
      if (chapterIdx != null) setChapter(chapterIdx);
      navigate(path);
      window.scrollTo(0, 0);
      await nextFrames();
      check();
      placeRoot({ opacity: "0", transform: "translateY(16px)" });
      await fadeRoot({ opacity: "1" }, FADE_IN_MS);
      clearRoot();
      check();
    };

    try {
      setPhase("prep");
      setChapter(0);
      setCaption("");
      setCursor(null);
      await Promise.race([Promise.all([preloadAll(), sleep(PREP_MIN_MS)]), sleep(PREP_MAX_MS)]);
      check();
      setPhase("play");

      // ── Core Stack ──
      await go("/notes/corestack/JAVA-01", 0, () => {
        if (!enterSandbox()) throw CANCELLED; // signed in meanwhile: nothing to show
      });
      await say("Every topic comes with videos and interview questions");
      await wait(1200);
      await say("Topics are in the order interviews ask them");
      // The topic list; on a phone it lives in a drawer, opened first.
      const topicAt = async (i) => {
        const shown = () => [...document.querySelectorAll(".note-toc [data-topic]")].filter(visible);
        if (!shown().length) await click(await find('[data-tour="topics-drawer"]'));
        await find(".note-toc [data-topic]");
        return shown()[i];
      };
      await click(await topicAt(1));
      await wait(1300);
      const third = await topicAt(2);
      const noteId = third.dataset.topic;
      await click(third);
      await wait(900);
      const list = [...document.querySelectorAll(".note-toc")].find(visible);
      if (list) {
        const r = list.getBoundingClientRect();
        setCursor({ x: r.left + r.width / 2, y: r.top + r.height / 2, down: false });
        await scrollBox(list, 520, 2400);
        await wait(300);
        await scrollBox(list, -list.scrollTop, 900);
      }

      await say("Write your own notes, in Markdown");
      await click(await find('[data-tour="view-write"]'));
      const editor = await find('[data-tour="note-editor"]');
      await type(editor, NOTE_PART_1, "");
      await wait(800); // the editor saves after a short pause
      recordNow(KEYS.CS_NOTES, noteId);
      await type(editor, NOTE_PART_2);
      await wait(800);
      recordNow(KEYS.CS_NOTES, noteId);
      await click(await find('[data-tour="view-read"]'));
      await wait(500);

      await say("Highlight what matters");
      await select(HIGHLIGHT_PHRASE);
      await click(await find('button[title="Highlight yellow"]'));
      await wait(700);

      await say("Add a personal note to any line");
      await select(NOTE_PHRASE);
      await click(await findByText("button", "Note"));
      await type(await find(".note-ui textarea"), PERSONAL_NOTE, "");
      await click(await findByText(".note-ui button", "Save note"));
      await wait(1100);
      const closeNote = document.querySelector('.note-ui button[title="Close"]');
      if (visible(closeNote)) await click(closeNote);

      await say("Full screen, for focused reading");
      await click(await find('[data-tour="fullscreen"]'));
      await wait(1200);
      const wasDark = document.documentElement.classList.contains("dark");
      await say(wasDark ? "And a light mode for long reads" : "And a dark mode for late nights");
      themeRef.current = wasDark;
      document.documentElement.classList.toggle("dark", !wasDark);
      await scrollWindowTo(window.scrollY + 260, 1800);
      await wait(900);
      restoreTheme();
      await wait(300);
      await click(await find('[data-tour="fullscreen"]'));
      await wait(500);

      await say("Every change is kept in the note's history");
      await click(await find('[data-tour="history"]'));
      await wait(2600);
      await click(await find('button[aria-label="Close history"]'));

      await say("Mark a topic done once you've learnt it");
      await click(await find('[data-tour="mark-done"]'));
      await wait(900);
      await say("Or add it to today's plan");
      await click(await find('[data-tour="add-today"]'));
      await wait(1200);

      // ── DSA ──
      await go("/dsa-prep", 1);
      await say("350+ most-asked problems, grouped by pattern");
      const graphs = await find('[data-tour-dsa-topic="Graphs - Topological Sort and Cycle Detection"]');
      const gr = graphs.getBoundingClientRect();
      await scrollWindowTo(window.scrollY + gr.top - window.innerHeight * 0.3, 3200);
      await click(graphs);
      await wait(600);
      await say("Add any problem to today's plan");
      await click(await find('[data-tour-plan="alien-dictionary"]'));
      await wait(1300);

      // ── Jobs ──
      setCursor(null);
      await go("/job-tracker", 2);
      await say("Track every application in one pipeline");
      await wait(1000);

      // ── Contests ──
      await go("/contests", 3);
      await say("Contest reminders are emailed a day before and an hour before each contest");
      await wait(1600);

      // ── Planning ──
      await go("/planning", 4);
      await say("Everything you added is on today's plan");
      await wait(800);
      await say("Start a focus session on any task");
      await click(await find('[data-tour-pomo="alien-dictionary"]'));
      await wait(3000);
      await click(await find('[data-tour="pomo-stop"]'));
      await say("Done. The time you spent is logged for you");
      await click(await find('[data-tour-check="alien-dictionary"]'));
      await wait(1500);

      // ── The end: back to the visitor's own (empty) page ──
      setCursor(null);
      await go("/planning", 4, leaveSandbox);
      setPhase("end");
      await say("That's the tour. Sign in to make it yours.");
    } catch (err) {
      if (err !== CANCELLED && alive()) {
        console.warn(err);
        stop();
      }
    }
  };

  useEffect(() => {
    listeners.add(begin);
    return () => listeners.delete(begin);
  });

  // Leaving the page mid-tour (or a hot reload) must not strand the sandbox.
  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  // The visitor takes over: a click, key or scroll outside the tour card ends
  // the tour where they are, and so does signing in.
  useEffect(() => {
    if (phase !== "prep" && phase !== "play") return;
    const onInput = (e) => {
      if (!e.isTrusted) return; // the tour's own clicks and keys
      if (pillRef.current && pillRef.current.contains(e.target)) return;
      stop();
    };
    const opts = { capture: true, passive: true };
    const types = ["pointerdown", "keydown", "wheel", "touchmove"];
    types.forEach((t) => window.addEventListener(t, onInput, opts));
    const unsub = onAuthStateChange((s) => s === "user" && stop());
    return () => {
      types.forEach((t) => window.removeEventListener(t, onInput, opts));
      unsub();
    };
  }, [phase]);

  const skip = () => {
    stop();
    navigate("/planning");
    window.scrollTo(0, 0);
  };

  return (
    <>
      {/* The tour's cursor */}
      {cursor && phase === "play" && (
        <div
          aria-hidden
          className="fixed left-0 top-0 z-[70] pointer-events-none"
          style={{
            transform: `translate(${cursor.x}px, ${cursor.y}px)`,
            transition: cursor.instant ? "none" : `transform ${CURSOR_MS}ms cubic-bezier(.4,0,.2,1)`,
          }}
        >
          <span
            className={`absolute -left-4 -top-4 h-8 w-8 rounded-full bg-violet-500/30 transition-transform duration-150 ${cursor.down ? "scale-100" : "scale-0"}`}
          />
          <svg width="22" height="26" viewBox="0 0 22 26" className="relative drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]">
            <path d="M2 2l17 11.5-7.6 1.4 4.4 8.3-3 1.6-4.4-8.4L2 21.6z" fill="white" stroke="#111827" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      <AnimatePresence>
        {phase !== "idle" && (
          <motion.div
            ref={pillRef}
            key="tour"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-5 inset-x-0 mx-auto sm:right-5 sm:left-auto sm:mx-0 z-[80] w-[min(92vw,480px)] rounded-2xl border border-violet-400/40 bg-white/95 dark:bg-[#141231]/95 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(124,58,237,0.5)] px-4 pt-3 pb-3.5"
            role="status"
            aria-live="polite"
          >
            {/* One segment per chapter. On wide screens the card sits bottom
                right: the app's toasts use the bottom centre, and the notes
                page's topic list the left. */}
            <div className="flex gap-1.5 mb-2.5">
              {CHAPTERS.map((c, i) => (
                <div key={c} className="h-1 flex-1 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500 ${
                      phase === "end" || (phase === "play" && i < chapter) ? "w-full" : phase === "play" && i === chapter ? "w-1/2 animate-pulse" : "w-0"
                    }`}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300">
                  {phase === "prep" ? "Getting your tour ready" : phase === "end" ? "Tour complete" : CHAPTERS[chapter]}
                </div>
                <div className="mt-0.5 min-h-[2.5rem] text-sm font-medium text-gray-900 dark:text-white">
                  {phase === "prep" ? (
                    <span className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <span className="h-4 w-4 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
                      Loading every page first, so nothing waits.
                    </span>
                  ) : (
                    <>
                      {caption}
                      <span className="inline-block w-[2px] h-[1em] ml-0.5 align-[-0.15em] bg-violet-500 animate-[caret_1s_steps(1)_infinite]" />
                    </>
                  )}
                </div>
              </div>
              {phase === "end" ? (
                <div className="shrink-0 flex items-center gap-1.5">
                  <button
                    onClick={() => { setPhase("idle"); requestSignIn(); }}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => setPhase("idle")}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <button
                  onClick={skip}
                  className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
                >
                  Skip
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
