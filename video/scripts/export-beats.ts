// Lists every narrated beat of every chapter in data/<id>/beats.json, for
// scripts/tts.py to record. Run with Node 23+ (it strips TypeScript types).
import { mkdirSync, writeFileSync } from "node:fs";
import { CHAPTERS } from "../src/chapters/index.ts";
import { keyFor } from "../src/lib/timeline.ts";
import { prosody } from "../src/lib/types.ts";

for (const ch of CHAPTERS) {
  const beats = ch.scenes.flatMap((s) => s.beats.map((b) => ({ key: keyFor(ch, b), say: b.say, ...prosody(b) })));
  mkdirSync(`data/${ch.id}`, { recursive: true });
  writeFileSync(`data/${ch.id}/beats.json`, JSON.stringify({ voice: ch.voice, beats }, null, 1));
  const words = beats.reduce((n, b) => n + b.say.split(/\s+/).length, 0);
  console.log(`${ch.id}: ${ch.scenes.length} scenes, ${beats.length} beats, ${words} words (~${Math.round(words / 150)} min)`);
}
