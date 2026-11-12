// Temporary: estimated timings for beats not yet voiced, so QA can run.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { CHAPTERS } from "../src/chapters/index.ts";
import { keyFor } from "../src/lib/timeline.ts";
for (const id of process.argv.slice(2)) {
  const ch = CHAPTERS.find((c) => c.id === id)!;
  mkdirSync(`data/${id}`, { recursive: true });
  const f = `data/${id}/timings.json`;
  const real = existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : {};
  const out: Record<string, unknown> = {};
  let n = 0, w = 0;
  for (const s of ch.scenes) for (const b of s.beats) {
    const k = keyFor(ch, b);
    const ws = b.say.split(/\s+/); w += ws.length;
    if (real[k]) out[k] = real[k];
    else { n++; out[k] = { dur: ws.length / 2.5, words: ws.map((x, i) => ({ w: x, t: i / 2.5 })) }; }
  }
  writeFileSync(f, JSON.stringify(out));
  console.log(id, ch.scenes.length, "scenes, faked", n, "beats,", Math.round(w / 2.4 / 60), "min est");
}
