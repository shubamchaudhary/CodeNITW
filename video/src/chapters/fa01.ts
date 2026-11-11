import type { Chapter } from "../lib/types.ts";
import { p1 } from "./fa01/p1.ts";
import { p2 } from "./fa01/p2.ts";
import { p3 } from "./fa01/p3.ts";

// FA-01: FastAPI for GenAI interviews, on the /fastapi page. The AskDocs app
// from PY-01 behind an API; slow, a check after each topic.
export const fa01: Chapter = {
  id: "fa01",
  title: "FastAPI for GenAI interviews",
  label: "FastAPI",
  theme: "py",
  voice: "en-US-AndrewMultilingualNeural",
  pace: { normal: "-3%", ask: "-5%", aside: "+4%", excite: "+4%" },
  scenes: [...p1, ...p2, ...p3],
};
