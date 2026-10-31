// Lists every narrated beat of every chapter in public/<id>/beats.json, for
// scripts/tts.py to record. Run with Node 23+ (it strips TypeScript types).
import { mkdirSync, writeFileSync } from "node:fs";
import { CHAPTERS } from "../src/chapters/index.ts";
import { beatKey } from "../src/lib/hash.ts";

for (const ch of CHAPTERS) {
  const beats = ch.scenes.flatMap((s) => s.beats.map((b) => ({ key: beatKey(ch.voice, ch.rate, b.say), say: b.say })));
  mkdirSync(`public/${ch.id}`, { recursive: true });
  writeFileSync(`public/${ch.id}/beats.json`, JSON.stringify({ voice: ch.voice, rate: ch.rate, beats }, null, 1));
  const words = beats.reduce((n, b) => n + b.say.split(/\s+/).length, 0);
  console.log(`${ch.id}: ${ch.scenes.length} scenes, ${beats.length} beats, ${words} words (~${Math.round(words / 150)} min)`);
}
