import type { Chapter } from "../lib/types.ts";
import { partA } from "./ll01/a.ts";
import { partB } from "./ll01/b.ts";
import { partC } from "./ll01/c.ts";
import { partD } from "./ll01/d.ts";
import { partE } from "./ll01/e.ts";

// Projects · LL-01: LogLens, the whole architecture with every decision, number
// and follow-up, checked against the repo (C:/PROJECTS/LogLens, branch fix-ui)
// and drawn in the LogLens site's own style. The parts live in ll01/.
export const ll01: Chapter = {
  id: "ll01",
  title: "LogLens, end to end",
  label: "LogLens",
  theme: "loglens",
  voice: "en-US-AndrewMultilingualNeural",
  scenes: [...partA, ...partB, ...partC, ...partD, ...partE],
};
