import type { Beat, Scene } from "../../lib/types.ts";

// Helpers for the two framework chapters of the AI Stack (ch13 LangChain,
// ch14 LangGraph), which go topic by topic like the Python lectures.
export const B = (...xs: (string | Beat)[]): Beat[] => xs.map((x) => (typeof x === "string" ? { say: x } : x));

export const sec = (num: string, title: string, say: string): Scene => ({ kind: "section", num, title, beats: [{ say }] });

export const custom = (name: string, props: Record<string, unknown>, beats: Beat[]): Scene => ({ kind: "custom", name, props, beats });

// An interview question on its own card: beat 0 reads it, beat 1 says what a
// good answer covers (shown as `after`).
export const q = (text: string, after: string, ask: string, cover: string): Scene => ({
  kind: "big",
  tone: "interview",
  lead: "Asked in interviews",
  text,
  after,
  beats: B({ say: ask, tone: "ask" }, cover),
});
