import type { Chapter } from "../lib/types.ts";
import { p1 } from "./brik02/p1.ts";
import { p2 } from "./brik02/p2.ts";

// Projects · BRIK-02: DeepLogLens and InterviewPlanPrep next to Brikby: the
// same decisions, the different ones and their defences, where each side is
// stronger, and the pitch. BRIK-01's labels (public / observed / inferred);
// LL-01's style and boards. Parts in brik02/.
export const brik02: Chapter = {
  id: "brik02",
  title: "Your designs vs Brikby's",
  label: "Brikby",
  theme: "loglens",
  voice: "en-US-AndrewMultilingualNeural",
  pace: { normal: "-3%", ask: "-5%", aside: "+4%", excite: "+4%" },
  scenes: [...p1, ...p2],
};
