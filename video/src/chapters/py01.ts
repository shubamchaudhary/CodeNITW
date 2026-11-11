import type { Chapter } from "../lib/types.ts";
import { p1 } from "./py01/p1.ts";
import { p2 } from "./py01/p2.ts";
import { p3 } from "./py01/p3.ts";
import { p4 } from "./py01/p4.ts";

// PY-01: Python for GenAI interviews, on the /python page. Slow, one bug per
// topic, a check after each; AskDocs is the running example.
export const py01: Chapter = {
  id: "py01",
  title: "Python for GenAI interviews",
  label: "Python",
  theme: "py",
  voice: "en-US-AndrewMultilingualNeural",
  pace: { normal: "-3%", ask: "-5%", aside: "+4%", excite: "+4%" },
  scenes: [...p1, ...p2, ...p3, ...p4],
};
