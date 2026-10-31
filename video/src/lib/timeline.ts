import type { Chapter, Scene } from "./types.ts";
import { beatKey } from "./hash.ts";

export const FPS = 30;
const LEAD = 0.5; // seconds of picture before a scene's first line
const GAP = 0.3; // breath between lines
const TAIL = 0.45; // picture after a scene's last line

export type Timing = { dur: number; words: { w: string; t: number }[] };

export type BeatT = {
  say: string;
  file: string;
  audioStart: number; // frames, relative to the scene
  audioEnd: number;
  end: number; // after the gap and any hold
  stepStart: number;
  words: { w: string; f: number }[]; // f: frame relative to the scene
};

export type SceneT = {
  scene: Scene;
  index: number;
  from: number; // absolute frame
  dur: number;
  beats: BeatT[];
  section: string; // "3 · Why the same question gets two answers"
};

const fr = (s: number) => Math.round(s * FPS);

export const buildTimeline = (ch: Chapter, timings: Record<string, Timing>) => {
  let from = 0;
  let section = "";
  const scenes: SceneT[] = ch.scenes.map((scene, index) => {
    if (scene.kind === "section") section = `${scene.num} · ${scene.title}`;
    let cursor = fr(LEAD);
    const beats = scene.beats.map((b) => {
      const key = beatKey(ch.voice, ch.rate, b.say);
      const tm = timings[key];
      if (!tm) throw new Error(`No recording for "${b.say.slice(0, 60)}". Run npm run tts.`);
      const audioStart = cursor;
      const audioEnd = audioStart + fr(tm.dur);
      const words = tm.words.map((w) => ({ w: w.w, f: audioStart + fr(w.t) }));
      let stepStart = audioStart;
      if (b.at) {
        const hit = words.find((w) => w.w.toLowerCase().replace(/[^a-z0-9]/g, "").startsWith(b.at!.toLowerCase()));
        if (hit) stepStart = hit.f;
      }
      cursor = audioEnd + fr(GAP + (b.hold ?? 0));
      return { say: b.say, file: `${ch.id}/audio/${key}.mp3`, audioStart, audioEnd, end: cursor, stepStart, words };
    });
    const dur = cursor + fr(TAIL);
    const st: SceneT = { scene, index, from, dur, beats, section };
    from += dur;
    return st;
  });
  return { scenes, total: from };
};

// Which step a scene is on at a scene-relative frame, and how far into it.
export const clock = (sc: SceneT, frame: number) => {
  let step = 0;
  sc.beats.forEach((b, i) => {
    if (frame >= b.stepStart) step = i;
  });
  const since = (i: number) => (sc.beats[i] ? frame - sc.beats[i].stepStart : -1);
  const len = (i: number) => {
    const b = sc.beats[i];
    return b ? Math.max(1, (sc.beats[i + 1]?.stepStart ?? sc.dur) - b.stepStart) : 1;
  };
  return { frame, step, since, len, beats: sc.beats, dur: sc.dur };
};
export type Clock = ReturnType<typeof clock>;
