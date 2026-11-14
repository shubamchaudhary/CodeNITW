import type { Chapter } from "../lib/types.ts";
import { p1 } from "./brik01/p1.ts";
import { p2 } from "./brik01/p2.ts";
import { p3 } from "./brik01/p3.ts";
import { p4 } from "./brik01/p4.ts";

// Projects · BRIK-01: Brikby, prep for a system design round, from public
// signals only: the lender's due-diligence problem, the business and its scale
// (estimates labelled), the observed stack vs the inferred pipeline, durable
// jobs, portal agents, evals, cost, and two design questions. Told in LL-01's
// style (problem, mechanism on a board, alternatives, then a check) and drawn
// with its boards. The parts live in brik01/ (p1.ts to p4.ts).
export const brik01: Chapter = {
  id: "brik01",
  title: "Brikby: the business, the workflow, the architecture",
  label: "Brikby",
  theme: "loglens",
  voice: "en-US-AndrewMultilingualNeural",
  pace: { normal: "-3%", ask: "-5%", aside: "+4%", excite: "+4%" },
  scenes: [...p1, ...p2, ...p3, ...p4],
};
