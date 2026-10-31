import { useMemo } from "react";
import { AbsoluteFill, Audio, Sequence, useCurrentFrame } from "remotion";
import type { Chapter } from "./lib/types.ts";
import { buildTimeline, clock, type SceneT, type Timing } from "./lib/timeline.ts";
import { C, FONT, W } from "./lib/theme.ts";
import { enter } from "./lib/anim.ts";
import { AssetBase, useAsset } from "./lib/assets.ts";
import { SceneView } from "./scenes/index.tsx";

type Props = { chapter: Chapter; timings: Record<string, Timing>; assetBase?: string };

export const Lecture = ({ chapter, timings, assetBase }: Props) => (
  <AssetBase.Provider value={assetBase ?? null}>
    <LectureBody chapter={chapter} timings={timings} />
  </AssetBase.Provider>
);

const LectureBody = ({ chapter, timings }: Props) => {
  const frame = useCurrentFrame();
  const asset = useAsset();
  const { scenes, total } = useMemo(() => buildTimeline(chapter, timings), [chapter, timings]);
  const current = scenes.find((s) => frame >= s.from && frame < s.from + s.dur) ?? scenes[scenes.length - 1];

  return (
    <AbsoluteFill style={{ background: `radial-gradient(1400px 900px at 50% 35%, ${C.bg2}, ${C.bg})`, fontFamily: FONT, color: C.text }}>
      {scenes.map((sc) => (
        <Sequence key={sc.index} from={sc.from} durationInFrames={sc.dur} premountFor={30}>
          <SceneShell sc={sc} />
        </Sequence>
      ))}
      {/* Every line, mixed onto one track at its place (scripts/mix-audio.ts). */}
      <Audio src={asset(`${chapter.id}/lecture.mp3`)} />
      <Header chapter={chapter} sc={current} frame={frame} />
      <Captions sc={current} frame={frame - current.from} />
      <Progress scenes={scenes} total={total} frame={frame} />
    </AbsoluteFill>
  );
};

const SceneShell = ({ sc }: { sc: SceneT }) => {
  const frame = useCurrentFrame();
  const t = clock(sc, frame);
  const opacity = Math.min(enter(frame, 0, 12), 1 - enter(frame, sc.dur - 10, 10));
  return (
    <AbsoluteFill style={{ opacity }}>
      <SceneView sc={sc} t={t} />
    </AbsoluteFill>
  );
};

const Header = ({ chapter, sc, frame }: { chapter: Chapter; sc: SceneT; frame: number }) => {
  if (sc.scene.kind === "title" || sc.scene.kind === "section") return null;
  const local = frame - sc.from;
  const o = Math.min(enter(local, 0, 12), 1 - enter(local, sc.dur - 10, 10));
  return (
    <div style={{ position: "absolute", left: 80, top: 44, display: "flex", alignItems: "center", gap: 18, opacity: Math.max(0.55, o) }}>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2, color: C.blue, textTransform: "uppercase" }}>Ch {chapter.id.slice(2).replace(/^0/, "")}</div>
      <div style={{ width: 1, height: 26, background: C.line }} />
      <div style={{ fontSize: 24, fontWeight: 600, color: C.muted }}>{sc.section || chapter.title}</div>
    </div>
  );
};

// Caption: the chunk of the current line that is being spoken, word by word.
const Captions = ({ sc, frame }: { sc: SceneT; frame: number }) => {
  const beat = sc.beats.find((b) => frame >= b.audioStart - 2 && frame < b.end);
  if (!beat || sc.scene.kind === "title") return null;
  const chunks: { w: string; f: number }[][] = [];
  let cur: { w: string; f: number }[] = [];
  let chars = 0;
  for (const w of beat.words) {
    cur.push(w);
    chars += w.w.length + 1;
    if (chars > 62 || (chars > 34 && /[.,:;?!]$/.test(w.w))) {
      chunks.push(cur);
      cur = [];
      chars = 0;
    }
  }
  if (cur.length) chunks.push(cur);
  const idx = Math.max(0, chunks.findIndex((c, i) => frame < (chunks[i + 1]?.[0].f ?? Infinity)));
  const chunk = chunks[idx];
  const o = enter(frame, beat.audioStart - 2, 6) * (1 - enter(frame, beat.audioEnd + 4, 6));
  return (
    <div style={{ position: "absolute", left: 0, width: W, top: 956, display: "flex", justifyContent: "center", opacity: o }}>
      <div style={{ background: "rgba(8,11,18,0.78)", border: `1px solid ${C.line}`, borderRadius: 14, padding: "12px 28px", fontSize: 36, fontWeight: 500, maxWidth: 1500, textAlign: "center", lineHeight: 1.3 }}>
        {chunk.map((w, i) => (
          <span key={i} style={{ color: frame >= w.f ? C.text : C.faint }}>
            {w.w}{" "}
          </span>
        ))}
      </div>
    </div>
  );
};

const Progress = ({ scenes, total, frame }: { scenes: SceneT[]; total: number; frame: number }) => (
  <div style={{ position: "absolute", left: 0, bottom: 0, width: W, height: 6, background: "rgba(255,255,255,0.06)" }}>
    <div style={{ width: (frame / total) * W, height: 6, background: C.blue }} />
    {scenes
      .filter((s) => s.scene.kind === "section")
      .map((s) => (
        <div key={s.index} style={{ position: "absolute", left: (s.from / total) * W, top: 0, width: 3, height: 6, background: C.bg }} />
      ))}
  </div>
);
