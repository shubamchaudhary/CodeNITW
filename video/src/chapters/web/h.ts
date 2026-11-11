import type { Beat, Scene } from "../../lib/types.ts";

// Helpers for the JavaScript, React and Node.js lectures (js01, re01, nd01),
// which follow their question pages module by module like PY-01.
export const B = (...xs: (string | Beat)[]): Beat[] => xs.map((x) => (typeof x === "string" ? { say: x } : x));

export const sec = (num: string, title: string, say: string): Scene => ({ kind: "section", num, title, beats: [{ say }] });

export const custom = (name: string, props: Record<string, unknown>, beats: Beat[]): Scene => ({ kind: "custom", name, props, beats });

// A line is shown and spoken as is, or [shown, spoken] when the screen text
// has symbols the voice would read badly.
export type Line = string | [string, string];

// One question from the page, answered point by point (scenes/webviz WebQA):
// beat 0 asks it, then one beat per line; the last line is said as the key
// point. `code` adds a panel on the right.
export const qa = (n: number, q: string, lines: Line[], o: { ask?: string; code?: string; codeAt?: number; codeTitle?: string } = {}): Scene => {
  const shown = lines.map((l) => (typeof l === "string" ? l : l[0]));
  const said = lines.map((l) => (typeof l === "string" ? l : l[1]));
  return {
    kind: "custom",
    name: "webqa",
    props: { n, q, lines: shown, code: o.code, codeAt: o.codeAt, codeTitle: o.codeTitle },
    beats: [
      { say: o.ask ?? `Question ${n}. ${q}`, tone: "ask" },
      ...said.map((s, i): Beat => (i === said.length - 1 ? { say: s, tone: "key" } : { say: s })),
    ],
  };
};

// A question on its own card, before a picture that answers it.
export const q = (n: number, text: string, after: string, ask: string, cover: string): Scene => ({
  kind: "big",
  tone: "interview",
  lead: `Question ${n}`,
  text,
  after,
  beats: B({ say: ask, tone: "ask" }, cover),
});
