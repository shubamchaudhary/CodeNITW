import type { Chapter } from "../lib/types.ts";
import { p1 } from "./tgx01/p1.ts";
import { p2 } from "./tgx01/p2.ts";
import { p3 } from "./tgx01/p3.ts";
import { p4 } from "./tgx01/p4.ts";
import { p5 } from "./tgx01/p5.ts";

// Projects · TGX-01: Folio, the TheragenX case-intake take-home, following the
// notes page topic by topic, with a tour of every important code file (real
// excerpts from the TheragenX-Assisment repository): the catalog contract, the
// pipeline loop, numbered passages and code-point offsets, the recorded model
// boundary, validation, the confidence gate, the scoped repair, replay and the
// catalog change, the review API, the React desk, the stretch items, the
// results of both model runs, and the live session. One check per topic.
export const tgx01: Chapter = {
  id: "tgx01",
  title: "Folio, end to end",
  label: "TheragenX",
  theme: "loglens",
  voice: "en-US-AndrewMultilingualNeural",
  pace: { normal: "-3%", ask: "-5%", aside: "+4%", excite: "+4%" },
  scenes: [...p1, ...p2, ...p3, ...p4, ...p5],
};
