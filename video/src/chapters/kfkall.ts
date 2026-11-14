import type { Chapter } from "../lib/types.ts";
import { p1 } from "./kfkall/p1.ts";
import { p2 } from "./kfkall/p2.ts";
import { p3 } from "./kfkall/p3.ts";
import { p4 } from "./kfkall/p4.ts";
import { p5 } from "./kfkall/p5.ts";
import { p6 } from "./kfkall/p6.ts";

// Projects · KFK-ALL: all of Kafka in one lecture, following the one-page
// notes (src/Data/projectsDocs/KFK-ALL.md) part by part: the log, reading,
// the cluster and both flows, failures, the producer, Spring, retries,
// exactly-once. Boards move: records travel between brokers (boards.ts),
// partition logs grow and pointers slide (scenes/kafka.tsx).
export const kfkall: Chapter = {
  id: "kfkall",
  title: "Kafka end to end",
  label: "Kafka",
  theme: "loglens",
  voice: "en-US-AndrewMultilingualNeural",
  pace: { normal: "-3%", ask: "-5%", aside: "+4%", excite: "+4%" },
  scenes: [...p1, ...p2, ...p3, ...p4, ...p5, ...p6],
};
