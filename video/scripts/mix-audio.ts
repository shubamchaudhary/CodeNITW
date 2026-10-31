// Mixes a chapter's recorded lines (.cache/<id>/*.mp3) into one narration
// track, each line placed at the frame the timeline gives it:
// ../public/lectures/<id>/lecture.mp3, played by both the render and the site.
//   node scripts/mix-audio.ts [chapter-id ...]
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { CHAPTERS } from "../src/chapters/index.ts";
import { buildTimeline, FPS, type Timing } from "../src/lib/timeline.ts";

const ids = process.argv.slice(2);
for (const ch of CHAPTERS.filter((c) => !ids.length || ids.includes(c.id))) {
  const timings = JSON.parse(readFileSync(`data/${ch.id}/timings.json`, "utf8")) as Record<string, Timing>;
  const { scenes, total } = buildTimeline(ch, timings);
  const beats = scenes.flatMap((sc) => sc.beats.map((b) => ({ file: `.cache/${ch.id}/${b.file.split("/").pop()}`, at: sc.from + b.audioStart })));
  const graph =
    beats.map((b, i) => `[${i}:a]adelay=${Math.round((b.at / FPS) * 1000)}:all=1[a${i}]`).join(";\n") +
    `;\n${beats.map((_, i) => `[a${i}]`).join("")}amix=inputs=${beats.length}:normalize=0:duration=longest,apad,atrim=0:${(total / FPS).toFixed(3)}[out]`;
  mkdirSync(`../public/lectures/${ch.id}`, { recursive: true });
  writeFileSync(`.cache/${ch.id}.filter`, graph);
  const out = `../public/lectures/${ch.id}/lecture.mp3`;
  const args = ["remotion", "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", ...beats.flatMap((b) => ["-i", b.file]), "-filter_complex_script", `.cache/${ch.id}.filter`, "-map", "[out]", "-ac", "1", "-ar", "24000", "-c:a", "libmp3lame", "-b:a", "64k", out];
  // Paths here never contain spaces, so one command string is safe for the shell.
  const r = spawnSync(["npx", ...args].join(" "), { stdio: "inherit", shell: true });
  if (r.status !== 0) throw new Error(`ffmpeg failed for ${ch.id}`);
  console.log(`${ch.id}: ${beats.length} lines → ${out} (${(total / FPS / 60).toFixed(1)} min)`);
}
