import React from "react";

// The reading pages' one piece of side information: a thin strip pinned to the
// top of the reading area, with how far down the page you've read and, on the
// right, whatever the page wants beside it (a done count, the full screen
// button). It's a strip of its own with a solid background, so it never sits
// on top of a line you're reading. `pct` runs 0–100; where it sticks comes in
// through `className` (Tailwind top-*) or `style` (a measured offset).
export default function ProgressStrip({ pct, label = null, className = "top-0", style, children }) {
  return (
    <div
      className={`sticky z-20 bg-white dark:bg-[#0e1427] border-b border-gray-200/80 dark:border-white/[0.07] light:border-slate-900/[0.06] ${className}`}
      style={style}
    >
      <div className="px-5 sm:px-10 lg:px-16 py-2 flex items-center gap-4 min-h-[44px]">
        {label && (
          <span className="hidden md:block max-w-[40%] truncate text-[13.5px] font-semibold text-gray-800 dark:text-gray-100 light:text-slate-900">
            {label}
          </span>
        )}
        <div
          className="flex-1 h-1.5 rounded-full bg-gray-200/90 dark:bg-white/[0.08] light:bg-slate-900/[0.06] overflow-hidden"
          title={`${Math.round(pct)}% read`}
        >
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${pct}%` }} />
        </div>
        {children}
      </div>
    </div>
  );
}

// The full screen toggle the strips carry on their right.
export function FullScreenButton({ immersive, onClick }) {
  return (
    <button
      onClick={onClick}
      title={immersive ? "Exit full screen (Esc)" : "Read in full screen"}
      className="shrink-0 h-8 px-3 rounded-full flex items-center gap-1.5 text-[12.5px] font-semibold text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-white/[0.14] hover:bg-gray-50 dark:hover:bg-white/[0.05] light:bg-white light:border-slate-900/[0.10] light:text-slate-700"
    >
      {immersive ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16"><path d="M6 2v4H2M10 2v4h4M6 14v-4H2M10 14v-4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16"><path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      )}
      <span className="hidden sm:inline">{immersive ? "Exit full screen" : "Full screen"}</span>
    </button>
  );
}
