import type { Chapter } from "../lib/types.ts";
import { p1 } from "./brik01/p1.ts";
import { p2 } from "./brik01/p2.ts";
import { p3 } from "./brik01/p3.ts";
import { p4 } from "./brik01/p4.ts";

// Projects · BRIK-01: Brikby, company prep from public signals, following the
// notes page section by section: the lender's problem, the workflow, what they
// sell, the business, scale (estimates labelled), the infrastructure at a high
// level, two questions, and what to say. The parts live in brik01/ (p1 to p4).
export const brik01: Chapter = {
  id: "brik01",
  title: "Brikby: the business, and what they do",
  label: "Brikby",
  theme: "loglens",
  voice: "en-US-AndrewMultilingualNeural",
  pace: { normal: "-3%", ask: "-5%", aside: "+4%", excite: "+4%" },
  scenes: [...p1, ...p2, ...p3, ...p4],
};
