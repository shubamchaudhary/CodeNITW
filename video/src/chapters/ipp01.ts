import type { Chapter } from "../lib/types.ts";
import { p1 } from "./ipp01/p1.ts";
import { p2 } from "./ipp01/p2.ts";
import { p3 } from "./ipp01/p3.ts";
import { p4 } from "./ipp01/p4.ts";
import { p5 } from "./ipp01/p5.ts";

// Projects · IPP-01: InterviewPlanPrep (this site) as a signed-in student
// uses it, every resume line defended: what the student sees (real
// screenshots in public/lectures/ipp01), the mechanism, the alternatives, the
// interviewer's attack, then a check. Mostly frontend; kept short.
export const ipp01: Chapter = {
  id: "ipp01",
  title: "InterviewPlanPrep, end to end",
  label: "InterviewPlanPrep",
  theme: "ipp",
  voice: "en-US-AndrewMultilingualNeural",
  pace: { normal: "-3%", ask: "-5%", aside: "+4%", excite: "+4%" },
  scenes: [...p1, ...p2, ...p3, ...p4, ...p5],
};
