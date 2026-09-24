import React from "react";

// The surface every page sits on: a soft violet gradient with three heavily
// blurred orbs behind it, giving the frosted cards something to refract. Kept
// faint and very wide-blurred so it reads as depth rather than a visible light.
//
// Children are wrapped in a positioned layer so they stack above the orbs —
// the orbs can't simply use a negative z-index, since that would drop them
// behind the page's own gradient background and hide them entirely.
//
// `allowSticky` swaps overflow-hidden for overflow-x-clip: a hidden-overflow
// ancestor becomes the scroll container for position: sticky, so nothing
// inside it could ever stick to the viewport. Clip trims the same sideways
// overflow without that side effect.
export default function PageShell({ children, className = "", allowSticky = false }) {
  return (
    <div
      className={`relative min-h-screen ${allowSticky ? "overflow-x-clip" : "overflow-hidden"} pb-16 bg-gradient-to-br from-slate-50 via-violet-50/50 to-indigo-50/60 dark:from-[#0b1020] dark:via-[#0d1226] dark:to-[#0a0e1c] ${className}`}
    >
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-28 w-[32rem] h-[32rem] rounded-full bg-violet-400/[0.10] dark:bg-violet-700/[0.09] blur-[140px]" />
        <div className="absolute top-1/4 -right-40 w-[34rem] h-[34rem] rounded-full bg-purple-400/[0.08] dark:bg-purple-800/[0.07] blur-[150px]" />
        <div className="absolute -bottom-48 left-1/3 w-[32rem] h-[32rem] rounded-full bg-indigo-400/[0.09] dark:bg-indigo-800/[0.07] blur-[150px]" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
