import type { Chapter } from "../lib/types.ts";
import { p1 } from "./re01/p1.ts";
import { p2 } from "./re01/p2.ts";
import { p3 } from "./re01/p3.ts";
import { p4 } from "./re01/p4.ts";

// RE-01: the React page, topic by topic, on /react. Section N = module N of
// src/Data/WebBasics/react.md, every question in page order.
export const re01: Chapter = {
  id: "re01",
  title: "React, topic by topic",
  label: "React",
  theme: "py",
  voice: "en-US-AndrewMultilingualNeural",
  pace: { normal: "-3%", ask: "-5%", aside: "+4%", excite: "+4%" },
  scenes: [...p1, ...p2, ...p3, ...p4],
};
