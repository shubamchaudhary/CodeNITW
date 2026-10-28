import React from "react";
import { ProgressBar, buttonClass } from "./ui";

// The reading pages' one piece of side information: a thin strip pinned to the
// top of the reading area, with how far down the page you've read and, on the
// right, whatever the page wants beside it (a done count, the full screen
// button). It's a strip of its own with a solid background, so it never sits
// on top of a line you're reading. `pct` runs 0–100; where it sticks comes in
// through `className` (Tailwind top-*) or `style` (a measured offset).
export default function ProgressStrip({ pct, label = null, className = "top-0", style, children }) {
  return (
    <div
      className={`sticky z-20 bg-canvas border-b border-line ${className}`}
      style={style}
    >
      <div className="px-4 sm:px-8 lg:px-16 py-1.5 flex items-center gap-4 min-h-[44px]">
        {label && (
          <span className="hidden md:block max-w-[40%] truncate text-[13px] font-medium text-fg">
            {label}
          </span>
        )}
        <ProgressBar value={pct / 100} className="flex-1" title={`${Math.round(pct)}% read`} />
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
      className={buttonClass("secondary")}
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
