import type { Beat, Scene } from "../../lib/types.ts";
import { makeCheck } from "../checks.ts";

export { B, sec } from "../ll01/h.ts";

// KFK-ALL's own numbered checks.
export const check = makeCheck();

type Ptr = { at: number; l: string; tone?: string; top?: boolean };
type RowState = { cells: string[]; ptrs?: Ptr[]; dead?: boolean; label?: string; sub?: string; tone?: string };
export type LStep = { t?: string; b?: string; m?: string; rows: Record<string, RowState> };

// A partition-log scene (scenes/kafka.tsx) from [state, beat] pairs.
export const L = (rows: { id: string; label: string; sub?: string }[], title: string | undefined, ...pairs: [LStep, Beat | string][]): Scene => ({
  kind: "custom",
  name: "klog",
  props: { rows, title, steps: pairs.map((p) => p[0]) },
  beats: pairs.map((p) => (typeof p[1] === "string" ? { say: p[1] } : p[1])),
});

// "E0 E1 E2" -> ["E0", "E1", "E2"]
export const cells = (s: string) => s.split(" ").filter(Boolean);
