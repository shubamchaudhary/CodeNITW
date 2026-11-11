import type { Chapter } from "../lib/types.ts";
import { p1 } from "./fa01/p1.ts";
import { p2 } from "./fa01/p2.ts";
import { p3 } from "./fa01/p3.ts";

// FA-01: the FastAPI page, topic by topic, on /fastapi. One section per module
// of src/Data/WebBasics/fastapi.md (section N = module N), the questions in the
// page's order with its numbers, a picture for each idea, a check per module.
export const fa01: Chapter = {
  id: "fa01",
  title: "FastAPI, topic by topic",
  label: "FastAPI",
  theme: "py",
  voice: "en-US-AndrewMultilingualNeural",
  pace: { normal: "-3%", ask: "-5%", aside: "+4%", excite: "+4%" },
  scenes: [...p1, ...p2, ...p3],
};
