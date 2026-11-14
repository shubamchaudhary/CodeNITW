import type { Chapter } from "../lib/types.ts";
import { p1 } from "./ipp02/p1.ts";
import { p2 } from "./ipp02/p2.ts";
import { p3 } from "./ipp02/p3.ts";

// Projects · IPP-02: Firebase and Firestore from zero (Auth and ID tokens,
// documents, queries, writes, listeners, the offline cache, security rules,
// the admin SDK, limits and cost), each mapped to InterviewPlanPrep's own code,
// then the answers to give. LL-01's boards; IPP-01's look. Parts in ipp02/.
export const ipp02: Chapter = {
  id: "ipp02",
  title: "Firebase and Firestore, and how InterviewPlanPrep uses them",
  label: "InterviewPlanPrep",
  theme: "ipp",
  voice: "en-US-AndrewMultilingualNeural",
  pace: { normal: "-3%", ask: "-5%", aside: "+4%", excite: "+4%" },
  scenes: [...p1, ...p2, ...p3],
};
