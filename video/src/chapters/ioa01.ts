import type { Chapter } from "../lib/types.ts";
import { partA } from "./ioa01/a.ts";
import { partB } from "./ioa01/b.ts";
import { partC } from "./ioa01/c.ts";
import { partD } from "./ioa01/d.ts";
import { partE } from "./ioa01/e.ts";
import { partF } from "./ioa01/f.ts";

// Projects · IOA-01: the Inventory Ops Agent, taught slowly: an everyday
// picture, then the mechanism on a diagram, then a check-yourself question,
// for every topic. Built from projectsDocs/IOA-01.md. Spoken a little slower
// than the other lectures (pace).
export const ioa01: Chapter = {
  id: "ioa01",
  title: "The Inventory Ops Agent",
  label: "Inventory Ops",
  voice: "en-US-AndrewMultilingualNeural",
  pace: { normal: "-3%", ask: "-5%", aside: "+4%", excite: "+4%" },
  scenes: [...partA, ...partB, ...partC, ...partD, ...partE, ...partF],
};
