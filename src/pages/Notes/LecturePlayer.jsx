import React, { useEffect, useMemo, useRef, useState } from "react";
import { Player } from "@remotion/player";
import { Lecture } from "../../../video/src/Lecture.tsx";
import { buildTimeline, FPS } from "../../../video/src/lib/timeline.ts";
import { Icon } from "../../components/ui";

// The chapter as a narrated, animated lecture, drawn live in the page from the
// same scenes the MP4 is rendered from (video/). Narration and images are
// served from public/lectures/<chapter>/.
const LOAD = {
  "CH-01": () =>
    Promise.all([import("../../../video/src/chapters/ch01.ts"), import("../../../video/data/ch01/timings.json")]).then(([m, t]) => ({
      chapter: m.ch01,
      timings: t.default,
    })),
  "CH-02": () =>
    Promise.all([import("../../../video/src/chapters/ch02.ts"), import("../../../video/data/ch02/timings.json")]).then(([m, t]) => ({
      chapter: m.ch02,
      timings: t.default,
    })),
};

// Shown before the first play (the lecture itself opens on a fade from black).
// Sized in container units (cqw), so it scales with the player.
function Poster({ chapter }) {
  const title = chapter.scenes[0].kind === "title" ? chapter.scenes[0] : null;
  return (
    <div style={{ position: "absolute", inset: 0, containerType: "size", pointerEvents: "none" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 90% at 50% 35%, #121826, #0c1018)", display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: "9cqw", color: "#eef2f8" }}>
        <div style={{ fontSize: "1.6cqw", fontWeight: 700, letterSpacing: "0.2cqw", textTransform: "uppercase", color: "#5b9cff" }}>{title?.eyebrow}</div>
        <div style={{ fontSize: "6cqw", fontWeight: 800, lineHeight: 1.1, marginTop: "1cqw" }}>{title?.title ?? chapter.title}</div>
        <div style={{ height: "0.45cqw", width: "27cqw", background: "linear-gradient(90deg, #5b9cff, #a78bfa)", borderRadius: "1cqw", marginTop: "1.4cqw" }} />
        {title?.subtitle && <div style={{ fontSize: "2.5cqw", color: "#93a0b8", marginTop: "1.6cqw" }}>{title.subtitle}</div>}
      </div>
    </div>
  );
}

export default function LecturePlayer({ id }) {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [section, setSection] = useState(-1);
  const player = useRef(null);

  useEffect(() => {
    let live = true;
    LOAD[id]?.()
      .then((d) => live && setData(d))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [id]);

  const timeline = useMemo(() => data && buildTimeline(data.chapter, data.timings), [data]);
  const sections = useMemo(
    () => (timeline ? timeline.scenes.filter((s) => s.scene.kind === "section").map((s) => ({ from: s.from, num: s.scene.num, title: s.scene.title })) : []),
    [timeline],
  );
  const inputProps = useMemo(() => data && { ...data, assetBase: "/lectures/" }, [data]);

  // Highlight the section being played.
  useEffect(() => {
    const p = player.current;
    if (!p || !sections.length) return;
    const onFrame = (e) => {
      const f = e.detail.frame;
      let i = -1;
      sections.forEach((s, k) => {
        if (f >= s.from) i = k;
      });
      setSection((cur) => (cur === i ? cur : i));
    };
    p.addEventListener("frameupdate", onFrame);
    return () => p.removeEventListener("frameupdate", onFrame);
  }, [sections, timeline]);

  const jump = (from) => {
    player.current?.seekTo(from);
    player.current?.play();
  };

  const minutes = timeline ? Math.round(timeline.total / FPS / 60) : null;

  return (
    <section className="mt-6 rounded-lg border border-line bg-canvas overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 bg-surface-subtle border-b border-line">
        <span className="text-fg-subtle">
          <Icon.play />
        </span>
        <p className="text-[15px] leading-[22px] font-semibold text-fg">Watch the lecture</p>
        {minutes && <p className="font-mono text-[12px] tabular-nums text-fg-subtle">{minutes} min · narrated · captions</p>}
        <p className="ml-auto text-[12px] text-fg-subtle hidden sm:block">The whole chapter, animated</p>
      </div>

      {failed ? (
        <p className="px-4 py-6 text-[14px] text-fg-subtle">The lecture could not be loaded. Reload the page to try again.</p>
      ) : !data ? (
        <div className="aspect-video w-full bg-[#0c1018] animate-pulse" />
      ) : (
        <Player
          ref={player}
          component={Lecture}
          inputProps={inputProps}
          durationInFrames={timeline.total}
          fps={FPS}
          compositionWidth={1920}
          compositionHeight={1080}
          style={{ width: "100%" }}
          controls
          clickToPlay
          doubleClickToFullscreen
          allowFullscreen
          spaceKeyToPlayOrPause
          showVolumeControls
          showPlaybackRateControl={[0.75, 1, 1.25, 1.5, 1.75, 2]}
          showPosterWhenUnplayed
          renderPoster={() => <Poster chapter={data.chapter} />}
          acknowledgeRemotionLicense
        />
      )}

      {sections.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 py-3 border-t border-line">
          {sections.map((s, i) => (
            <button
              key={s.from}
              type="button"
              onClick={() => jump(s.from)}
              className={`rounded-full border px-2.5 py-1 text-[12px] leading-4 transition-colors ${
                i === section ? "border-brand bg-brand-subtle text-fg" : "border-line text-fg-muted hover:text-fg hover:bg-surface-hover"
              }`}
            >
              <span className="font-mono tabular-nums text-fg-subtle mr-1">{s.num}</span>
              {s.title}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
