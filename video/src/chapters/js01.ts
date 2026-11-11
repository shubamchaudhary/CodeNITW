import type { Chapter } from "../lib/types.ts";
import { p1 } from "./js01/p1.ts";
import { p2 } from "./js01/p2.ts";
import { p3 } from "./js01/p3.ts";
import { p4 } from "./js01/p4.ts";

// JS-01: the JavaScript page, topic by topic, on /javascript. Section N =
// module N of src/Data/WebBasics/javascript.md, every question in page order.
export const js01: Chapter = {
  id: "js01",
  title: "JavaScript, topic by topic",
  label: "JavaScript",
  theme: "py",
  voice: "en-US-AndrewMultilingualNeural",
  pace: { normal: "-3%", ask: "-5%", aside: "+4%", excite: "+4%" },
  scenes: [...p1, ...p2, ...p3, ...p4],
};
