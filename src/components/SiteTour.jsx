import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { onAuthStateChange } from "../Data/authGate";
import { fetchContests } from "../Data/contestsFeed";
import { DSAPrep, StackHome, TopicNotes, JobTracker, Contests, Planning } from "../pageLoaders";

// A short auto-played walk through the main pages, so a visitor sees what the
// site offers without clicking around. startTour() (the landing page's "Take a
// quick tour" button) first loads every page it will show — code and the
// contests list — behind a "getting ready" card, then plays them like a clip:
// each page fades in, drifts down a little, and fades into the next. Any
// click, key press or scroll by the visitor hands control back.

const PREP_MIN_MS = 2000; // the "getting ready" card stays at least this long
const PREP_MAX_MS = 8000; // …and never longer: a slow network skips the wait
const STEP_MS = 2800; // how long each page is on screen
const FADE_OUT_MS = 260;
const FADE_IN_MS = 520;

const STEPS = [
  { path: "/dsa-prep", icon: "🧩", title: "DSA", line: "350+ most-asked problems" },
  { path: "/core-stack", icon: "☕", title: "Core Stack", line: "Java & Spring Boot, topic by topic" },
  { path: "/job-tracker", icon: "📋", title: "Jobs", line: "Every application, one pipeline" },
  { path: "/contests", icon: "🏆", title: "Contests", line: "Never miss a contest" },
  { path: "/planning", icon: "⏱️", title: "Planning", line: "Plan your day, focus with Pomodoro" },
];

const preloadAll = () =>
  Promise.allSettled([
    DSAPrep.preload(),
    StackHome.preload(),
    TopicNotes.preload(), // /core-stack opens a topic's notes page
    JobTracker.preload(),
    Contests.preload(),
    Planning.preload(),
    fetchContests(),
  ]);

const listeners = new Set();
export function startTour() {
  listeners.forEach((fn) => fn());
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const nextFrames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
const root = () => document.getElementById("page-root");
const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Opacity and a small slide only: both stay on the compositor, so they're
// smooth even on a very tall page, where a blur or scale of it all is not.
function animateRoot(frames, ms) {
  const el = root();
  if (!el?.animate || reducedMotion()) return Promise.resolve();
  const a = el.animate(frames, { duration: ms, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });
  return a.finished.catch(() => {});
}
const clearRoot = () => root()?.getAnimations?.().forEach((a) => a.cancel());
const fadeOut = () =>
  animateRoot(
    [{ opacity: 1, transform: "translateY(0)" }, { opacity: 0, transform: "translateY(-12px)" }],
    FADE_OUT_MS
  );
const fadeIn = async () => {
  await animateRoot(
    [{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "translateY(0)" }],
    FADE_IN_MS
  );
  clearRoot(); // leave no transform behind: it would break sticky/fixed children
};

// A slow camera drift down the page, eased at both ends.
function drift(ms, alive) {
  const dist = Math.min(180, document.documentElement.scrollHeight - window.innerHeight);
  if (dist <= 0 || reducedMotion()) return;
  const t0 = performance.now();
  const tick = (t) => {
    if (!alive()) return;
    const p = Math.min(1, (t - t0) / ms);
    const e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
    window.scrollTo(0, dist * e);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export default function SiteTour() {
  const navigate = useNavigate();
  // phase: idle | prep | play
  const [phase, setPhase] = useState("idle");
  const [step, setStep] = useState(0);
  const run = useRef(0); // bumps on every start/stop, so a stale run quits
  const pillRef = useRef(null);

  const stop = () => {
    run.current++;
    clearRoot();
    setPhase("idle");
  };

  const begin = async () => {
    const id = ++run.current;
    const alive = () => run.current === id;
    setPhase("prep");
    setStep(0);
    await Promise.race([Promise.all([preloadAll(), wait(PREP_MIN_MS)]), wait(PREP_MAX_MS)]);
    if (!alive()) return;
    setPhase("play");
    for (let i = 0; i < STEPS.length; i++) {
      await fadeOut();
      if (!alive()) return;
      setStep(i);
      navigate(STEPS[i].path);
      window.scrollTo(0, 0);
      await nextFrames(); // let the page render (and /core-stack redirect) first
      if (!alive()) return;
      await fadeIn();
      if (!alive()) return;
      const hold = STEP_MS - FADE_IN_MS - FADE_OUT_MS;
      if (i < STEPS.length - 1) drift(hold, alive);
      await wait(hold);
      if (!alive()) return;
    }
    stop();
  };

  useEffect(() => {
    listeners.add(begin);
    return () => listeners.delete(begin);
  });

  // The visitor takes over: a click, key or scroll outside the tour card ends
  // the tour where they are, and so does signing in.
  useEffect(() => {
    if (phase === "idle") return;
    const onInput = (e) => {
      if (pillRef.current && pillRef.current.contains(e.target)) return;
      stop();
    };
    const opts = { capture: true, passive: true };
    ["pointerdown", "keydown", "wheel", "touchmove"].forEach((t) => window.addEventListener(t, onInput, opts));
    const unsub = onAuthStateChange((s) => s === "user" && stop());
    return () => {
      ["pointerdown", "keydown", "wheel", "touchmove"].forEach((t) => window.removeEventListener(t, onInput, opts));
      unsub();
    };
  }, [phase]);

  const skip = () => {
    stop();
    navigate("/planning");
    window.scrollTo(0, 0);
  };

  const cur = STEPS[step];
  return (
    <AnimatePresence>
      {phase !== "idle" && (
        <motion.div
          ref={pillRef}
          key="tour"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="fixed bottom-5 inset-x-0 mx-auto z-[60] w-[min(92vw,440px)] rounded-2xl border border-violet-400/40 bg-white/90 dark:bg-[#141231]/90 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(124,58,237,0.5)] px-4 pt-3 pb-3.5"
          role="status"
          aria-live="polite"
        >
          {/* Story-style progress: one segment per page. */}
          <div className="flex gap-1.5 mb-3">
            {STEPS.map((s, i) => (
              <div key={s.path} className="h-1 flex-1 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                {phase === "play" && i <= step && (
                  <motion.div
                    key={i === step ? `run-${step}` : "done"}
                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                    initial={{ width: i < step ? "100%" : "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: i < step ? 0 : STEP_MS / 1000, ease: "linear" }}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {phase === "prep" ? (
                <motion.div
                  key="prep"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex-1 flex items-center gap-3"
                >
                  <span className="h-8 w-8 shrink-0 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">Getting your tour ready…</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">5 pages · about 15 seconds</div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={cur.path}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="flex-1 min-w-0 flex items-center gap-3"
                >
                  <span className="h-9 w-9 shrink-0 grid place-items-center rounded-xl bg-violet-100 dark:bg-violet-500/15 text-lg">{cur.icon}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{cur.title}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 truncate">{cur.line}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={skip}
              className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
            >
              Skip
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
