import type { Beat, Scene } from "../../lib/types.ts";
import type { Step } from "./diagrams.ts";

// Beats from plain sentences; a Beat object passes through for tone, terms and holds.
export const B = (...xs: (string | Beat)[]): Beat[] => xs.map((x) => (typeof x === "string" ? { say: x } : x));

// A LogLens-style board: step i of `steps` is shown while beat i is spoken.
export const arch = (board: object, steps: Step[], beats: Beat[], title?: string, panel = true): Scene => ({
  kind: "custom",
  name: "llarch",
  props: { ...board, steps, title, panel },
  beats,
});

export const sec = (num: string, title: string, say: string): Scene => ({ kind: "section", num, title, beats: [{ say }] });
