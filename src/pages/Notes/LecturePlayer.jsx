import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Player } from "@remotion/player";
import { Lecture } from "../../../video/src/Lecture.tsx";
import { buildTimeline, FPS } from "../../../video/src/lib/timeline.ts";

// The chapter as a narrated, animated lecture, drawn live in the page from the
// same scenes the MP4 is rendered from (video/). Narration and images are
// served from public/lectures/<chapter>/.
// "CH-04" → video/src/chapters/ch04.ts + video/data/ch04/timings.json, and
// "JAVA-01" → java01.ts, each a separate chunk loaded on demand.
const SCRIPTS = import.meta.glob("../../../video/src/chapters/[a-z]*[0-9].ts");
const TIMINGS = import.meta.glob("../../../video/data/*/timings.json", { import: "default" });
const LOAD = (id) => {
  const ch = id.toLowerCase().replace(/[^a-z0-9]/g, "");
  const script = SCRIPTS[`../../../video/src/chapters/${ch}.ts`];
  const timings = TIMINGS[`../../../video/data/${ch}/timings.json`];
  if (!script || !timings) return Promise.reject(new Error(`no lecture for ${id}`));
  return Promise.all([script(), timings()]).then(([m, t]) => ({ chapter: m[ch], timings: t }));
};

// Shown before the first play (the lecture itself opens on a fade from black).
// Sized in container units (cqw), so it scales with the player.
// A chapter with a theme (video/src/lib/theme.ts) gets the matching poster.
const POSTER = {
  default: { bg: "radial-gradient(120% 90% at 50% 35%, #121826, #0c1018)", text: "#eef2f8", accent: "#fb923c", bar: "linear-gradient(90deg, #f97316, #fbbf24)", muted: "#93a0b8", head: undefined },
  loglens: { bg: "radial-gradient(120% 90% at 50% 35%, #12161b, #0b0d10)", text: "#ece8df", accent: "#ffa23e", bar: "linear-gradient(90deg, #ffa23e, #5fd3d0)", muted: "#a3abb6", head: '"JetBrains Mono", ui-monospace, monospace' },
};

function Poster({ chapter }) {
  const title = chapter.scenes[0].kind === "title" ? chapter.scenes[0] : null;
  const p = POSTER[chapter.theme] ?? POSTER.default;
  return (
    <div style={{ position: "absolute", inset: 0, containerType: "size", pointerEvents: "none" }}>
      <div style={{ position: "absolute", inset: 0, background: p.bg, display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: "9cqw", color: p.text }}>
        <div style={{ fontSize: "1.6cqw", fontWeight: 700, letterSpacing: "0.2cqw", textTransform: "uppercase", color: p.accent }}>{title?.eyebrow}</div>
        <div style={{ fontSize: "6cqw", fontWeight: 800, lineHeight: 1.1, marginTop: "1cqw", fontFamily: p.head }}>{title?.title ?? chapter.title}</div>
        <div style={{ height: "0.45cqw", width: "27cqw", background: p.bar, borderRadius: "1cqw", marginTop: "1.4cqw" }} />
        {title?.subtitle && <div style={{ fontSize: "2.5cqw", color: p.muted, marginTop: "1.6cqw" }}>{title.subtitle}</div>}
      </div>
    </div>
  );
}

// Slower and faster than normal, in YouTube-like small steps.
const RATES = [0.8, 0.85, 0.9, 0.95, 1, 1.05, 1.1, 1.15, 1.2];
const SKIP_S = 10;

// Styled like Remotion's own control buttons (white icon, no chrome).
const ctrlButton = { appearance: "none", background: "none", border: "none", padding: "0 4px", color: "white", cursor: "pointer", display: "inline-flex", alignItems: "center", height: 25 };

// A circular arrow with "10" in it; mirrored for forward, the digits kept readable.
const SkipIcon = ({ back }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <g transform={back ? undefined : "translate(24 0) scale(-1 1)"}>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M6.4 2.9v4H10.4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <text x="12" y="15.6" textAnchor="middle" fontSize="7.6" fontWeight="700" fill="currentColor">
      10
    </text>
  </svg>
);

// The lecture body: the player and its section chips. The card around it
// (TopicLead) mounts this only when "Watch" is clicked.
export default function LecturePlayer({ id, autoPlay = false }) {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [section, setSection] = useState(-1);
  const player = useRef(null);
  const wrap = useRef(null);
  // Arrow keys seek only while the lecture is "in hand": clicked last, or full screen.
  const active = useRef(autoPlay);

  useEffect(() => {
    let live = true;
    LOAD(id)
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

  // Opened with "Watch": start playing as soon as it has loaded.
  useEffect(() => {
    if (autoPlay && timeline) player.current?.play();
  }, [autoPlay, timeline]);

  // Highlight the section being played.
  useEffect(() => {
    const p = player.current;
    if (!p || !sections.length) return undefined;
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

  // Resume where the voice stopped. On pause Remotion seeks the narration to
  // the video frame, and the frame clock can lag the audio (more on a busy
  // page), so a pause rewound the voice and resuming repeated a syllable. The
  // narration's own clock is sampled while it plays, and on pause the frame is
  // moved to the last sample (at most one sampling interval behind). The
  // sampling runs only while the lecture plays: an open but paused lecture
  // costs nothing.
  useEffect(() => {
    const p = player.current;
    if (!p || !timeline) return undefined;
    let heard = null;
    let settleUntil = 0; // after a seek the audio needs a moment to follow
    let sample = null;
    const stopSampling = () => {
      clearInterval(sample);
      sample = null;
    };
    const onPlay = () => {
      if (sample) return;
      sample = setInterval(() => {
        if (performance.now() < settleUntil) return;
        const a = [...(wrap.current?.querySelectorAll("audio") ?? [])].find((x) => !x.paused && /lecture\.mp3/.test(x.src));
        if (a) heard = a.currentTime;
      }, 15);
    };
    const onPause = () => {
      stopSampling();
      if (heard == null) return;
      const f = Math.round(heard * FPS);
      heard = null;
      if (f > p.getCurrentFrame() && f < timeline.total) p.seekTo(f);
    };
    const onSeek = () => {
      heard = null;
      settleUntil = performance.now() + 250;
    };
    p.addEventListener("play", onPlay);
    p.addEventListener("pause", onPause);
    p.addEventListener("ended", stopSampling);
    p.addEventListener("seeked", onSeek);
    // "Watch" may have started it before these listeners were added.
    if (p.isPlaying()) onPlay();
    return () => {
      stopSampling();
      p.removeEventListener("play", onPlay);
      p.removeEventListener("pause", onPause);
      p.removeEventListener("ended", stopSampling);
      p.removeEventListener("seeked", onSeek);
    };
  }, [sections, timeline]);

  const skip = useCallback(
    (seconds) => {
      const p = player.current;
      if (!p || !timeline) return;
      p.seekTo(Math.max(0, Math.min(timeline.total - 1, p.getCurrentFrame() + seconds * FPS)));
    },
    [timeline],
  );

  // Left and right arrows: 10 s back and forward, like YouTube.
  useEffect(() => {
    const onPointer = (e) => {
      active.current = !!wrap.current?.contains(e.target);
    };
    const onKey = (e) => {
      if ((e.key !== "ArrowLeft" && e.key !== "ArrowRight") || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.target.closest?.("input, textarea, select, [contenteditable='true']")) return;
      const full = document.fullscreenElement && wrap.current?.contains(document.fullscreenElement);
      if (!active.current && !full) return;
      e.preventDefault();
      skip(e.key === "ArrowLeft" ? -SKIP_S : SKIP_S);
    };
    document.addEventListener("pointerdown", onPointer, true);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [skip]);

  const renderSkip = useCallback(
    () => (
      <>
        <button type="button" style={ctrlButton} onClick={() => skip(-SKIP_S)} title="Back 10 seconds (←)" aria-label="Back 10 seconds">
          <SkipIcon back />
        </button>
        <button type="button" style={ctrlButton} onClick={() => skip(SKIP_S)} title="Forward 10 seconds (→)" aria-label="Forward 10 seconds">
          <SkipIcon />
        </button>
      </>
    ),
    [skip],
  );

  const jump = (from) => {
    player.current?.seekTo(from);
    player.current?.play();
  };

  return (
    <div ref={wrap}>
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
          showPlaybackRateControl={RATES}
          renderCustomControls={renderSkip}
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
                i === section ? "border-accent bg-accent-subtle text-fg" : "border-line text-fg-muted hover:text-fg hover:bg-surface-hover"
              }`}
            >
              <span className="font-mono tabular-nums text-fg-subtle mr-1">{s.num}</span>
              {s.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
