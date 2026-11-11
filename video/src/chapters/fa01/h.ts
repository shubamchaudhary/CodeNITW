import type { Beat, Scene } from "../../lib/types.ts";
import { makeCheck } from "../checks.ts";

// Beats from plain sentences; a Beat object passes through for tone, terms and holds.
export const B = (...xs: (string | Beat)[]): Beat[] => xs.map((x) => (typeof x === "string" ? { say: x } : x));

export const sec = (num: string, title: string, say: string): Scene => ({ kind: "section", num, title, beats: [{ say }] });

// The interview question, on its own card: beat 0 sets it up, beat 1 asks it,
// the last beat shows `after` (what a good answer has to cover).
export const asked = (text: string, after: string, ...beats: (string | Beat)[]): Scene => ({ kind: "big", tone: "interview", lead: "Asked in interviews", text, after, beats: B(...beats) });

// Something familiar on the left, the Python on the right (scenes/ioa01 IoaMap):
// beat 0 the headers, then one row per beat, then the footer.
export const analogy = (title: string, a: string, b: string, rows: { icon: string; a: string; b: string }[], footer: string | undefined, beats: Beat[]): Scene => ({
  kind: "custom",
  name: "analogy",
  props: { title, a, b, rows, footer },
  beats,
});

export const custom = (name: string, props: Record<string, unknown>, beats: Beat[]): Scene => ({ kind: "custom", name, props, beats });

// FA-01's own numbered check-yourself cards (parts are evaluated in order).
export const check = makeCheck();

// A question from the page, with the page's number and how many interview
// write-ups asked it: beat 0 reads it, beat 1 says what a good answer covers.
export const q = (n: number, times: number | null, text: string, after: string, ask: string | Beat, cover: string | Beat): Scene => ({
  kind: "big",
  tone: "interview",
  lead: `Question ${n}${times ? ` · asked ${times}× in interviews` : ""}`,
  text,
  after,
  beats: B(typeof ask === "string" ? { say: ask, tone: "ask" } : ask, cover),
});
