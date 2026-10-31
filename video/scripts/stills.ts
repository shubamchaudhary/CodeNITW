// Renders review stills: by default one per scene (near its end), or the
// frames given as "scene:step" / absolute numbers. Writes out/stills/*.jpeg.
//   node scripts/stills.ts ch01 [12:3 840 ...]
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import { CHAPTERS } from "../src/chapters/index.ts";
import { buildTimeline, type Timing } from "../src/lib/timeline.ts";

const [id = "ch01", ...picks] = process.argv.slice(2);
const chapter = CHAPTERS.find((c) => c.id === id)!;
const timings = JSON.parse(readFileSync(`public/${id}/timings.json`, "utf8")) as Record<string, Timing>;
const { scenes } = buildTimeline(chapter, timings);

const frames: [string, number][] = picks.length
  ? picks.map((p) => {
      if (!p.includes(":")) return [`f${p}`, Number(p)];
      const [s, st] = p.split(":").map(Number);
      const sc = scenes[s];
      const b = sc.beats[st];
      const end = sc.beats[st + 1]?.stepStart ?? sc.dur - 12;
      return [`s${s}-${st}`, sc.from + Math.min(end - 4, b.stepStart + 75)];
    })
  : scenes.map((sc) => [`s${String(sc.index).padStart(2, "0")}-${sc.scene.kind}`, sc.from + sc.dur - 16]);

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browser = await openBrowser("chrome");
const composition = await selectComposition({ serveUrl, id, puppeteerInstance: browser });
mkdirSync("out/stills", { recursive: true });
for (const [name, frame] of frames) {
  await renderStill({ serveUrl, composition, frame, output: `out/stills/${name}.jpeg`, imageFormat: "jpeg", scale: 0.5, puppeteerInstance: browser });
  console.log(name, frame);
}
await browser.close({ silent: true });
