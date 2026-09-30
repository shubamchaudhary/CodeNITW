import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// What a signed-out visitor sees first on the landing page: one short line at
// a time, typed out, held, erased, then the next — so it reads like a pitch
// instead of a feature list. Below it, the tour button.

const LINES = [
  { icon: "👋", text: "What do we offer?", grad: "from-gray-900 to-gray-700 dark:from-white dark:to-gray-300" },
  { icon: "🧩", text: "350+ most-asked DSA problems", grad: "from-orange-500 to-amber-400" },
  { icon: "☕", text: "Java & Spring Boot, made simple", grad: "from-emerald-500 to-teal-400" },
  { icon: "📝", text: "Your notes on every topic", grad: "from-sky-500 to-cyan-400" },
  { icon: "📋", text: "Track every job application", grad: "from-violet-500 to-fuchsia-400" },
  { icon: "🏆", text: "Contest alerts in your inbox", grad: "from-yellow-500 to-orange-400" },
  { icon: "⏱️", text: "Plan your day. Focus with Pomodoro.", grad: "from-pink-500 to-rose-400" },
];

const TYPE_MS = 45;
const ERASE_MS = 20;
const HOLD_MS = 1500;

function useTypewriter() {
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [i, setI] = useState(0);
  const [len, setLen] = useState(reduced ? LINES[0].text.length : 0);
  const [erasing, setErasing] = useState(false);

  useEffect(() => {
    const full = LINES[i].text.length;
    let t;
    if (reduced) {
      t = setTimeout(() => {
        const n = (i + 1) % LINES.length;
        setI(n);
        setLen(LINES[n].text.length);
      }, HOLD_MS + 1000);
    } else if (!erasing && len < full) t = setTimeout(() => setLen(len + 1), TYPE_MS);
    else if (!erasing) t = setTimeout(() => setErasing(true), HOLD_MS);
    else if (len > 0) t = setTimeout(() => setLen(len - 1), ERASE_MS);
    else t = setTimeout(() => { setErasing(false); setI((i + 1) % LINES.length); }, 250);
    return () => clearTimeout(t);
  }, [i, len, erasing, reduced]);

  return { i, line: LINES[i], shown: LINES[i].text.slice(0, len) };
}

export default function OfferHero({ onTour, onSignIn }) {
  const { i, line, shown } = useTypewriter();
  return (
    <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-violet-500/60 via-fuchsia-500/40 to-indigo-500/60 overflow-hidden">
      <div className="relative rounded-[15px] bg-white/90 dark:bg-[#100e26]/95 light:bg-white px-5 sm:px-8 py-7 sm:py-9 overflow-hidden">
        {/* soft glow behind the line */}
        <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[36rem] h-48 rounded-full bg-violet-500/15 blur-3xl" />

        <div className="relative flex flex-col items-center text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
            Interview prep, planned
          </span>

          <div className="mt-4 min-h-[5.5rem] sm:min-h-[3.25rem] flex items-center justify-center gap-3" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.span
                key={i}
                initial={{ scale: 0.4, opacity: 0, rotate: -20 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                className="text-3xl sm:text-4xl shrink-0"
                aria-hidden
              >
                {line.icon}
              </motion.span>
            </AnimatePresence>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-left">
              <span className={`bg-gradient-to-r ${line.grad} bg-clip-text text-transparent`}>{shown}</span>
              <span className="inline-block w-[3px] h-[0.9em] ml-1 align-[-0.1em] bg-violet-500 animate-[caret_1s_steps(1)_infinite]" />
            </h2>
          </div>

          {/* one dot per line: where the pitch is */}
          <div className="mt-4 flex gap-1.5" aria-hidden>
            {LINES.map((_, k) => (
              <span
                key={k}
                className={`h-1.5 rounded-full transition-all duration-300 ${k === i ? "w-5 bg-violet-500" : "w-1.5 bg-gray-300 dark:bg-white/15"}`}
              />
            ))}
          </div>

          <motion.button
            onClick={onTour}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-bold shadow-[0_10px_30px_-8px_rgba(139,92,246,0.7)]"
          >
            <span className="grid place-items-center h-5 w-5 rounded-full bg-white/20 text-[10px]">▶</span>
            Take a quick tour
          </motion.button>

          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Below is a sample day ·{" "}
            <button onClick={onSignIn} className="font-semibold text-violet-600 dark:text-violet-300 hover:underline">
              Sign in to plan your own
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
