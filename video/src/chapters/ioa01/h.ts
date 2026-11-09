import type { Beat, Scene } from "../../lib/types.ts";
import { makeCheck } from "../checks.ts";
export { B, arch, sec } from "../ll01/h.ts";

// Check-yourself cards, numbered in the order the parts are evaluated (a.ts first).
export const check = makeCheck();

// Something familiar on the left, the system on the right: beat 0 sets it up,
// one beat per row, and a last beat for the footer if there is one.
export const amap = (title: string, a: string, b: string, rows: { icon: string; a: string; b: string }[], beats: Beat[], footer?: string): Scene => ({
  kind: "custom",
  name: "analogy",
  props: { title, a, b, rows, footer },
  beats,
});
