import type { CSSProperties } from "react";
import { Easing, interpolate, spring } from "remotion";
import { FPS } from "./timeline.ts";

// 0 → 1 as an element enters, starting at frame `start`.
export const enter = (frame: number, start: number, frames = 16) =>
  interpolate(frame - start, [0, frames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

export const pop = (frame: number, start: number) =>
  frame < start ? 0 : spring({ frame: frame - start, fps: FPS, config: { damping: 14, stiffness: 140, mass: 0.7 } });

export const ease = (frame: number, start: number, frames: number) =>
  interpolate(frame - start, [0, frames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

// Common "fade and rise" style for an element appearing at `start`.
export const rise = (frame: number, start: number, dist = 26): CSSProperties => {
  const p = enter(frame, start);
  return { opacity: p, transform: `translateY(${(1 - p) * dist}px)` };
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const softmax = (logits: number[], temperature: number) => {
  if (temperature <= 0.0001) {
    const best = logits.indexOf(Math.max(...logits));
    return logits.map((_, i) => (i === best ? 1 : 0));
  }
  const s = logits.map((l) => l / temperature);
  const m = Math.max(...s);
  const e = s.map((x) => Math.exp(x - m));
  const tot = e.reduce((a, b) => a + b, 0);
  return e.map((x) => x / tot);
};
