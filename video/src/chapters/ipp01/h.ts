import type { Beat, Scene } from "../../lib/types.ts";
import { makeCheck } from "../checks.ts";

// Beats from plain sentences; a Beat object passes through for tone, terms and holds.
export const B = (...xs: (string | Beat)[]): Beat[] => xs.map((x) => (typeof x === "string" ? { say: x } : x));

export const sec = (num: string, title: string, say: string): Scene => ({ kind: "section", num, title, beats: [{ say }] });

// A screenshot of the site as a signed-in student sees it (public/lectures/ipp01),
// on the site's own dark canvas. notes[i] and focus[i] belong to beat i.
export const shot = (src: string, title: string, notes: string[], focus: [number, number, number][], beats: Beat[]): Scene => ({
  kind: "image",
  src: `ipp01/${src}`,
  credit: "InterviewPlanPrep, as a signed-in student sees it",
  title,
  notes,
  focus,
  frame: "#0a0a0b",
  beats,
});

// IPP-01's own numbered check-yourself cards (parts are evaluated p1 first).
export const check = makeCheck();
