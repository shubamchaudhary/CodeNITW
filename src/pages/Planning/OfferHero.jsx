import { useEffect, useState } from "react";

// What a signed-out visitor sees first on the landing page: one short line at
// a time, typed out left to right from a fixed starting point, held, erased,
// then the next. Below it, the tour button.

const LINES = [
  { text: "350+ most-asked DSA problems", grad: "from-orange-500 to-amber-400" },
  { text: "Java & Spring Boot, made simple", grad: "from-emerald-500 to-teal-400" },
  { text: "Your notes on every topic", grad: "from-sky-500 to-cyan-400" },
  { text: "Track every job application", grad: "from-violet-500 to-fuchsia-400" },
  { text: "Contest alerts in your inbox", grad: "from-yellow-500 to-orange-400" },
  { text: "Plan your day. Focus with Pomodoro.", grad: "from-pink-500 to-rose-400" },
];

const TYPE_MS = 45;
const ERASE_MS = 20;
const HOLD_MS = 1600;

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
      <div className="relative rounded-[15px] bg-white/90 dark:bg-[#100e26]/95 light:bg-white px-5 sm:px-8 py-7 sm:py-8 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-24 -left-10 w-[32rem] h-48 rounded-full bg-violet-500/15 blur-3xl" />

        {/* The pitch on the left, the actions on the right (stacked below on a
            phone). */}
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
              Interview prep, planned
            </span>

            {/* Fixed height, left-aligned: the text grows to the right from one
                starting point and nothing around it moves. */}
            <h2
              className="mt-3 min-h-[4.5rem] sm:min-h-[2.75rem] text-2xl sm:text-4xl font-extrabold tracking-tight text-left"
              aria-live="polite"
              aria-label={line.text}
            >
              <span className={`bg-gradient-to-r ${line.grad} bg-clip-text text-transparent`}>{shown}</span>
              <span className="inline-block w-[3px] h-[0.9em] ml-1 align-[-0.1em] bg-violet-500 animate-[caret_1s_steps(1)_infinite]" />
            </h2>

            <div className="mt-3 flex gap-1.5" aria-hidden>
              {LINES.map((_, k) => (
                <span key={k} className={`h-1.5 rounded-full ${k === i ? "w-5 bg-violet-500" : "w-1.5 bg-gray-300 dark:bg-white/15"}`} />
              ))}
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-start md:items-center gap-3">
            <button
              onClick={onTour}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-bold shadow-[0_10px_30px_-8px_rgba(139,92,246,0.7)] hover:brightness-110 transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M5 3l9 5-9 5z" /></svg>
              Take a quick tour
            </button>
            <button onClick={onSignIn} className="text-sm font-semibold text-violet-600 dark:text-violet-300 hover:underline">
              Sign in to plan your own
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
