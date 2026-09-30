import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { onAuthStateChange } from "../Data/authGate";
import { loadDSAPrep, loadStackHome, loadJobTracker, loadContests, loadPlanning } from "../pageLoaders";

// A short auto-played walk through the main pages, so a visitor sees what the
// site offers without clicking around. It plays when startTour() is called
// (the landing page's "Take a quick tour" button). Any click or key press
// outside the tour pill hands control back to them.

const STEP_MS = 2200; // how long each page stays on screen

const STEPS = [
  { path: "/dsa-prep", title: "DSA", line: "350+ hand-picked problems, by pattern and difficulty", load: loadDSAPrep },
  { path: "/core-stack", title: "Core Stack", line: "Java, Spring Boot & backend notes, topic by topic", load: loadStackHome },
  { path: "/job-tracker", title: "Jobs", line: "Track every application through your pipeline", load: loadJobTracker },
  { path: "/contests", title: "Contests", line: "Upcoming contests, with email reminders", load: loadContests },
  { path: "/planning", title: "Planning", line: "Plan your day and focus with a Pomodoro timer", load: loadPlanning },
];

const listeners = new Set();
export function startTour() {
  listeners.forEach((fn) => fn());
}

export default function SiteTour() {
  const navigate = useNavigate();
  const [step, setStep] = useState(-1); // -1: not running
  const pillRef = useRef(null);
  const running = step >= 0;

  const begin = () => {
    // Download every page up front, so no step waits on its chunk.
    STEPS.forEach((s) => s.load().catch(() => {}));
    setStep(0);
  };
  const stop = () => setStep(-1);

  useEffect(() => {
    listeners.add(begin);
    return () => listeners.delete(begin);
  });

  // Show the current step's page, then move on.
  useEffect(() => {
    if (!running) return;
    navigate(STEPS[step].path);
    window.scrollTo({ top: 0 });
    const t = setTimeout(() => setStep((i) => (i + 1 < STEPS.length ? i + 1 : -1)), STEP_MS);
    return () => clearTimeout(t);
  }, [step, running, navigate]);

  // The visitor takes over: a click or key outside the pill ends the tour,
  // and so does signing in.
  useEffect(() => {
    if (!running) return;
    const onInput = (e) => {
      if (pillRef.current && pillRef.current.contains(e.target)) return;
      stop();
    };
    window.addEventListener("pointerdown", onInput, true);
    window.addEventListener("keydown", onInput, true);
    const unsub = onAuthStateChange((s) => s === "user" && stop());
    return () => {
      window.removeEventListener("pointerdown", onInput, true);
      window.removeEventListener("keydown", onInput, true);
      unsub();
    };
  }, [running]);

  const cur = STEPS[step];
  return (
    <AnimatePresence>
      {running && (
        <motion.div
          ref={pillRef}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="fixed bottom-5 inset-x-0 mx-auto z-[60] w-[min(92vw,460px)] rounded-2xl border border-violet-400/40 bg-white/95 dark:bg-[#161433]/95 backdrop-blur-md shadow-2xl px-4 py-3"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            <span className="shrink-0 text-[11px] font-bold text-violet-600 dark:text-violet-300">
              {step + 1}/{STEPS.length}
            </span>
            <AnimatePresence mode="wait">
              <motion.div
                key={cur.path}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-w-0"
              >
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{cur.title}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300 truncate">{cur.line}</div>
              </motion.div>
            </AnimatePresence>
            <button
              onClick={() => { stop(); navigate("/planning"); }}
              className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
            >
              Skip
            </button>
          </div>
          <div className="mt-2 h-1 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
            <motion.div
              key={step}
              className="h-full bg-violet-600"
              initial={{ width: `${(step / STEPS.length) * 100}%` }}
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: STEP_MS / 1000, ease: "linear" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
