import type { Chapter } from "../lib/types.ts";
import { p1 } from "./py01/p1.ts";
import { p2 } from "./py01/p2.ts";
import { p3 } from "./py01/p3.ts";
import { p4 } from "./py01/p4.ts";
import { p5 } from "./py01/p5.ts";

// PY-01: the Python page, topic by topic, on /python. One section per module
// of src/Data/WebBasics/python.md (section N = module N, so a module page can
// start the lecture at its own part), the questions in the page's order with
// its numbers, a picture for each idea, and a check at the end of each module.
export const py01: Chapter = {
  id: "py01",
  title: "Python, topic by topic",
  label: "Python",
  theme: "py",
  voice: "en-US-AndrewMultilingualNeural",
  pace: { normal: "-3%", ask: "-5%", aside: "+4%", excite: "+4%" },
  scenes: [...p1, ...p2, ...p3, ...p4, ...p5],
};
