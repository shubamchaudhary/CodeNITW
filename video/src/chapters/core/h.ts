import type { Beat, Scene } from "../../lib/types.ts";

// Helpers for the Core Stack lectures (java04-06, spring08-23): topic by
// topic, each interview question answered with a picture, code and a
// say-it-out-loud answer, like the question-bank lectures.
export const B = (...xs: (string | Beat)[]): Beat[] => xs.map((x) => (typeof x === "string" ? { say: x } : x));

export const sec = (num: string, title: string, say: string): Scene => ({ kind: "section", num, title, beats: [{ say }] });

export const custom = (name: string, props: Record<string, unknown>, beats: Beat[]): Scene => ({ kind: "custom", name, props, beats });

// An interview question on its own card.
export const ask = (text: string, after: string, say: string, cover: string): Scene => ({
  kind: "big",
  tone: "interview",
  lead: "Asked in interviews",
  text,
  after,
  beats: B({ say, tone: "ask" }, cover),
});

// The model answer, said out loud: lines[i] on screen, said[i] spoken.
export const sayit = (q: string, intro: string, lines: [string, string][]): Scene => ({
  kind: "sayit",
  q,
  lines: lines.map((l) => l[0]),
  beats: [{ say: intro, tone: "ask" }, ...lines.map((l, i): Beat => (i === lines.length - 1 ? { say: l[1], tone: "key" } : { say: l[1] }))],
});
