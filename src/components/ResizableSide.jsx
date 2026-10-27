import React, { useState } from "react";

// The left topic column of the reading pages (Core Stack, AI Stack, Projects
// and the question banks). Drag its right edge to resize it; drag it narrower
// than COLLAPSE_AT and it closes to a thin rail at the left edge, which drags
// (or clicks) open again. The width and whether it's open are remembered on
// this device, per page family (`prefKey`).
const SIDE_MIN = 220;
const SIDE_MAX = 520;
const COLLAPSE_AT = 150;
function loadSide(prefKey) {
  try {
    return { width: 300, open: true, ...JSON.parse(localStorage.getItem(prefKey) || "{}") };
  } catch (_) {
    return { width: 300, open: true };
  }
}

export default function ResizableSide({ footerHeight, prefKey, className = "", children }) {
  const [side, setSide] = useState(() => loadSide(prefKey));
  const [dragW, setDragW] = useState(null); // live width while dragging
  const save = (next) => {
    setSide(next);
    try {
      localStorage.setItem(prefKey, JSON.stringify(next));
    } catch (_) {}
  };

  // One drag handler for both the edge (open) and the rail (closed). A press
  // that never moves is a click: on the rail it opens the column.
  const startDrag = (e) => {
    e.preventDefault();
    const left = e.currentTarget.closest("[data-side]").getBoundingClientRect().left;
    const startX = e.clientX;
    let moved = false;
    let last = side.open ? side.width : 0;
    const onMove = (ev) => {
      if (Math.abs(ev.clientX - startX) > 3) moved = true;
      last = Math.min(SIDE_MAX, Math.max(0, ev.clientX - left));
      setDragW(last);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setDragW(null);
      if (!moved) {
        if (!side.open) save({ ...side, open: true });
        return;
      }
      if (last < COLLAPSE_AT) save({ ...side, open: false });
      else save({ width: Math.max(SIDE_MIN, last), open: true });
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const width = dragW != null ? dragW : side.open ? side.width : 0;
  const closed = width < COLLAPSE_AT;

  return (
    <aside
      data-side
      className={`${className} hidden lg:block relative shrink-0 border-r border-gray-200/90 dark:border-white/[0.07] light:bg-[#fafafb] light:border-slate-900/[0.07] ${
        dragW == null ? "transition-[width] duration-200" : ""
      }`}
      style={{ width: closed ? 14 : width }}
    >
      <div className="sticky top-0 overflow-hidden" style={{ height: `calc(100dvh - ${footerHeight}px)` }}>
        {!closed && <div style={{ width }}>{children}</div>}
        <div
          onPointerDown={startDrag}
          title={closed ? "Drag or click to show the topics" : "Drag to resize — drag all the way left to hide"}
          className={`group absolute top-0 right-0 h-full cursor-col-resize flex items-center justify-center ${closed ? "w-[14px]" : "w-2.5"}`}
        >
          <span
            className={`rounded-full transition-colors ${
              closed
                ? "w-1 h-14 bg-gray-300 dark:bg-white/20 group-hover:bg-emerald-500"
                : "w-[3px] h-full bg-transparent group-hover:bg-emerald-400/50"
            }`}
          />
        </div>
      </div>
    </aside>
  );
}
