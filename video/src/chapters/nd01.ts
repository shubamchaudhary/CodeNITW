import type { Chapter } from "../lib/types.ts";
import { p1 } from "./nd01/p1.ts";
import { p2 } from "./nd01/p2.ts";
import { p3 } from "./nd01/p3.ts";
import { p4 } from "./nd01/p4.ts";

// ND-01: the Node.js page, topic by topic, on /nodejs. Section N = module N of
// src/Data/WebBasics/nodejs.md, every question in page order.
export const nd01: Chapter = {
  id: "nd01",
  title: "Node.js, topic by topic",
  label: "Node.js",
  theme: "py",
  voice: "en-US-AndrewMultilingualNeural",
  pace: { normal: "-3%", ask: "-5%", aside: "+4%", excite: "+4%" },
  scenes: [...p1, ...p2, ...p3, ...p4],
};
