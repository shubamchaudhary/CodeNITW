// Overflow check for the lectures, run in the site's dev server:
//   /video/qa/check.html?ch=ch03
// Seeks the real player to every step and lists text that spills out of its
// card or off the frame. window.__qa holds the result.
import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import { Player } from "@remotion/player";
import { Lecture } from "../src/Lecture.tsx";
import { CHAPTERS } from "../src/chapters/index.ts";
import { buildTimeline, FPS } from "../src/lib/timeline.ts";

const TIMINGS = import.meta.glob("../data/*/timings.json", { eager: true, import: "default" });
const id = new URLSearchParams(location.search).get("ch") || "ch01";
const chapter = CHAPTERS.find((c) => c.id === id);
const timings = TIMINGS[`../data/${id}/timings.json`];
const { scenes, total } = buildTimeline(chapter, timings);

const opacityOf = (el, stop) => {
  let o = 1;
  for (let e = el; e && e !== stop; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity || "1");
  return o;
};
const isBox = (el) => {
  const s = getComputedStyle(el);
  const bg = s.backgroundColor;
  return (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") || parseFloat(s.borderTopWidth) > 0 || parseFloat(s.borderLeftWidth) > 0;
};

function check(root, frame, label) {
  const frameRect = root.getBoundingClientRect();
  const out = [];
  for (const el of root.querySelectorAll("*")) {
    const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim()).join(" ");
    if (!own || opacityOf(el, root) < 0.2) continue;
    const range = document.createRange();
    range.selectNodeContents(el);
    const r = range.getBoundingClientRect();
    if (!r.width) continue;
    const tol = 2;
    if (el.tagName === "text") {
      // SVG labels sit on a sibling <rect>, not inside it
      const rect = [...(el.parentElement?.children ?? [])].find((c) => c.tagName === "rect");
      if (rect) {
        const b = rect.getBoundingClientRect();
        if (r.left < b.left - tol || r.right > b.right + tol) out.push({ frame, label, text: own.slice(0, 60), issue: "wider than its shape" });
      }
      continue;
    }
    let box = el.parentElement;
    while (box && box !== root && !isBox(box)) box = box.parentElement;
    if (r.right > frameRect.right + tol || r.bottom > frameRect.bottom + tol || r.left < frameRect.left - tol || r.top < frameRect.top - tol)
      out.push({ frame, label, text: own.slice(0, 60), issue: "off frame" });
    else if (box && box !== root && el !== box) {
      const b = box.getBoundingClientRect();
      if (r.right > b.right + tol || r.bottom > b.bottom + tol || r.left < b.left - tol) out.push({ frame, label, text: own.slice(0, 60), issue: "outside its card" });
    }
  }
  return out;
}

function QA() {
  const ref = useRef(null);
  const holder = useRef(null);
  useEffect(() => {
    (async () => {
      await document.fonts.ready;
      const results = [];
      const frames = [];
      scenes.forEach((sc) =>
        sc.beats.forEach((b, i) => {
          const end = (sc.beats[i + 1]?.stepStart ?? sc.dur) - 3;
          frames.push([sc.from + Math.min(end, b.stepStart + 75), `s${sc.index}:${i} ${sc.scene.kind === "custom" ? sc.scene.name : sc.scene.kind}`]);
          frames.push([sc.from + end, `s${sc.index}:${i} end`]);
        }),
      );
      for (const [f, label] of frames) {
        ref.current.seekTo(f);
        await new Promise((r) => setTimeout(r, 120));
        const root = holder.current.querySelector("[style*='1920px']") || holder.current;
        results.push(...check(root, f, label));
      }
      const seen = new Set();
      window.__qa = results.filter((r) => {
        const k = r.label.split(" ")[0] + r.text;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      window.__qaDone = true;
    })();
  }, []);
  return (
    <div ref={holder} style={{ width: 1920 }}>
      <Player ref={ref} component={Lecture} inputProps={{ chapter, timings, assetBase: "/lectures/" }} durationInFrames={total} fps={FPS} compositionWidth={1920} compositionHeight={1080} style={{ width: 1920 }} acknowledgeRemotionLicense />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<QA />);
