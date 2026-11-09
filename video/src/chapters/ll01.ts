import type { Chapter } from "../lib/types.ts";
import { p1 } from "./ll01/p1.ts";
import { p2 } from "./ll01/p2.ts";
import { p3 } from "./ll01/p3.ts";
import { p4 } from "./ll01/p4.ts";
import { p5 } from "./ll01/p5.ts";
import { p6 } from "./ll01/p6.ts";
import { p7 } from "./ll01/p7.ts";
import { p8 } from "./ll01/p8.ts";
import { p9 } from "./ll01/p9.ts";
import { p10 } from "./ll01/p10.ts";

// Projects · LL-01: DeepLogLens, the architecture as the resume states it,
// taught slowly: each topic is the problem, the mechanism box by box, the
// rejected alternatives, then a check question. Drawn in the LogLens site's
// own style. The parts live in ll01/ (p1.ts to p10.ts).
export const ll01: Chapter = {
  id: "ll01",
  title: "DeepLogLens, end to end",
  label: "DeepLogLens",
  theme: "loglens",
  voice: "en-US-AndrewMultilingualNeural",
  pace: { normal: "-3%", ask: "-5%", aside: "+4%", excite: "+4%" },
  scenes: [...p1, ...p2, ...p3, ...p4, ...p5, ...p6, ...p7, ...p8, ...p9, ...p10],
};
