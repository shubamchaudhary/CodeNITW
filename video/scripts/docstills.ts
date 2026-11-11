// Renders lecture pictures for the notes (no captions): each entry is a scene
// found by its title, the step to show, and the file name.
//   node scripts/docstills.ts py01 ../public/docs-img/py-01 "title text|3|names" ...
// The frame is the end of that step, after its caption has faded.
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import { CHAPTERS } from "../src/chapters/index.ts";
import { buildTimeline, type Timing } from "../src/lib/timeline.ts";

const [id, outDir, ...picks] = process.argv.slice(2);
const chapter = CHAPTERS.find((c) => c.id === id)!;
const timings = JSON.parse(readFileSync(`data/${id}/timings.json`, "utf8")) as Record<string, Timing>;
const { scenes } = buildTimeline(chapter, timings);
const titleOf = (s: any) => String(s.title ?? s.props?.title ?? s.text ?? "");

const frames = picks.map((p) => {
  const [title, step, name] = p.split("|");
  const sc = scenes.find((x) => titleOf(x.scene).startsWith(title));
  if (!sc) throw new Error(`no scene titled "${title}"`);
  const st = Number(step);
  const end = sc.beats[st + 1]?.stepStart ?? sc.dur;
  return { name, frame: sc.from + end - 3 };
});

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("../public/lectures") });
const browser = await openBrowser("chrome");
const composition = await selectComposition({ serveUrl, id, puppeteerInstance: browser });
mkdirSync(outDir, { recursive: true });
for (const { name, frame } of frames) {
  await renderStill({ serveUrl, composition, frame, output: `${outDir}/${name}.jpg`, imageFormat: "jpeg", jpegQuality: 84, scale: 0.75, puppeteerInstance: browser });
  console.log(name, frame);
}
await browser.close({ silent: true });
