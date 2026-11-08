import type { Beat, Scene } from "../../lib/types.ts";
export { B, arch, sec } from "../ll01/h.ts";

// A check-yourself card. Beat 0 asks (and reads the options), then holds for
// thinking time; beat 1 answers; beat 2 (optional) gives the why. Checks are
// numbered in the order the parts are evaluated (a.ts first).
let N = 0;
type Check = {
  topic: string;
  q: string; // on screen
  say?: string; // spoken question, if it differs from q
  options?: string[];
  oSay?: string[]; // spoken options, if they differ
  answer?: number;
  a: string; // on screen
  aSay: string; // spoken answer
  why?: string;
  whySay?: string;
  hold?: number;
};
export const check = (c: Check): Scene => {
  const n = ++N;
  const opts = c.oSay ?? c.options;
  const letters = ["A", "B", "C", "D"];
  const asked =
    (c.say ?? c.q) +
    (opts ? " " + opts.map((o, i) => `${i === opts.length - 1 ? "Or " : ""}${letters[i]}, ${o.replace(/\.$/, "")}.`).join(" ") : "");
  const beats: Beat[] = [
    { say: `Check ${n}. ${asked}`, tone: "ask", hold: c.hold ?? (c.options ? 6 : 9) },
    { say: c.aSay },
  ];
  if (c.whySay) beats.push({ say: c.whySay });
  return { kind: "custom", name: "check", props: { n, topic: c.topic, q: c.q, options: c.options, answer: c.answer, a: c.a, why: c.why }, beats };
};

// Something familiar on the left, the system on the right: beat 0 sets it up,
// one beat per row, and a last beat for the footer if there is one.
export const amap = (title: string, a: string, b: string, rows: { icon: string; a: string; b: string }[], beats: Beat[], footer?: string): Scene => ({
  kind: "custom",
  name: "analogy",
  props: { title, a, b, rows, footer },
  beats,
});
