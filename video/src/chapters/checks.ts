import type { Beat, Scene } from "../lib/types.ts";

// A check-yourself card (the "check" scene in scenes/ioa01.tsx). Beat 0 asks
// (and reads the options), then holds for thinking time; beat 1 answers; beat
// 2 (optional) gives the why. Each lecture makes its own numbered checker, so
// one lecture's checks never shift another's numbers.
export type Check = {
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

export const makeCheck = () => {
  let n = 0;
  return (c: Check): Scene => {
    const num = ++n;
    const opts = c.oSay ?? c.options;
    const letters = ["A", "B", "C", "D"];
    const asked =
      (c.say ?? c.q) +
      (opts ? " " + opts.map((o, i) => `${i === opts.length - 1 ? "Or " : ""}${letters[i]}, ${o.replace(/\.$/, "")}.`).join(" ") : "");
    const beats: Beat[] = [
      { say: `Check ${num}. ${asked}`, tone: "ask", hold: c.hold ?? (c.options ? 6 : 9) },
      { say: c.aSay },
    ];
    if (c.whySay) beats.push({ say: c.whySay });
    return { kind: "custom", name: "check", props: { n: num, topic: c.topic, q: c.q, options: c.options, answer: c.answer, a: c.a, why: c.why }, beats };
  };
};
