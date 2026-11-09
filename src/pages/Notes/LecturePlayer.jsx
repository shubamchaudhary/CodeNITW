import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Player } from "@remotion/player";
import { Lecture } from "../../../video/src/Lecture.tsx";
import { buildTimeline, FPS } from "../../../video/src/lib/timeline.ts";
import { openNarration } from "./narration.js";

// The chapter as a narrated, animated lecture, drawn live in the page from the
// same scenes the MP4 is rendered from (video/). Narration and images are
// served from public/lectures/<chapter>/; the narration is streamed a window
// at a time (narration.js) and played by this component, not by Remotion.
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
// The picture is moved to the voice when they drift further apart than this,
// to LEAD_FRAMES ahead of it: the Player resumes a render after the move.
const DRIFT_FRAMES = 4;
const LEAD_FRAMES = 2;
const VOLUME_KEY = "lecture-volume";

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

// A speaker, with sound waves or crossed out.
const SpeakerIcon = ({ silent }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="currentColor" />
    {silent ? (
      <path d="M16 9.5l5 5m0-5l-5 5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    ) : (
      <path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    )}
  </svg>
);

// Mute and volume for the narration element. The Player itself stays muted,
// so it never starts an audio context of its own for the picture to wait on.
// The setting is remembered on this device.
function VolumeControl({ audio }) {
  const [state, setState] = useState(() => ({ volume: audio.volume, muted: audio.muted }));
  useEffect(() => {
    const update = () => {
      setState({ volume: audio.volume, muted: audio.muted });
      try {
        localStorage.setItem(VOLUME_KEY, JSON.stringify({ volume: audio.volume, muted: audio.muted }));
      } catch {
        // storage unavailable: the setting just isn't remembered
      }
    };
    audio.addEventListener("volumechange", update);
    return () => audio.removeEventListener("volumechange", update);
  }, [audio]);
  const silent = state.muted || state.volume === 0;
  return (
    <span style={{ display: "inline-flex", alignItems: "center" }}>
      <button
        type="button"
        style={ctrlButton}
        onClick={() => {
          if (silent && audio.volume === 0) audio.volume = 1;
          audio.muted = !silent;
        }}
        title={silent ? "Unmute" : "Mute"}
        aria-label={silent ? "Unmute" : "Mute"}
      >
        <SpeakerIcon silent={silent} />
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={silent ? 0 : state.volume}
        onChange={(e) => {
          audio.volume = Number(e.target.value);
          audio.muted = audio.volume === 0;
        }}
        aria-label="Volume"
        className="hidden sm:block"
        style={{ width: 64, margin: "0 6px 0 2px", accentColor: "white", cursor: "pointer" }}
      />
    </span>
  );
}

const restoreVolume = (audio) => {
  try {
    const saved = JSON.parse(localStorage.getItem(VOLUME_KEY) || "null");
    if (saved && Number.isFinite(saved.volume)) {
      audio.volume = Math.min(1, Math.max(0, saved.volume));
      audio.muted = !!saved.muted;
    }
  } catch {
    // nothing saved, or storage unavailable
  }
};

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
  // The speed chosen in the Player's menu, for the narration to match.
  const rate = useRef(1);

  useEffect(() => {
    let live = true;
    LOAD(id)
      .then((d) => live && setData(d))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [id]);

  // The narration lives as long as this lecture is open.
  const [narration, setNarration] = useState(null);
  useEffect(() => {
    if (!data) return undefined;
    const n = openNarration(`/lectures/${data.chapter.id}/lecture.mp3`);
    restoreVolume(n.audio);
    setNarration(n);
    return () => {
      n.destroy();
      setNarration(null);
    };
  }, [data]);

  const timeline = useMemo(() => data && buildTimeline(data.chapter, data.timings), [data]);
  const sections = useMemo(
    () => (timeline ? timeline.scenes.filter((s) => s.scene.kind === "section").map((s) => ({ from: s.from, num: s.scene.num, title: s.scene.title })) : []),
    [timeline],
  );
  const inputProps = useMemo(() => data && narration && { ...data, assetBase: "/lectures/", narration }, [data, narration]);

  // Opened with "Watch": start playing as soon as it has loaded.
  useEffect(() => {
    if (autoPlay && timeline && narration) player.current?.play();
  }, [autoPlay, timeline, narration]);

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
    // The Player mounts once the narration is ready.
  }, [sections, timeline, narration]);

  // The voice leads and the picture follows. Two clocks run here: the
  // narration's (the audio hardware's) and the Player's (frames counted from
  // the wall clock). Moving the voice to match the picture is what is heard
  // as a jump back, so the voice moves only when the listener moves it (seek
  // bar, chips, skip, arrows). Everything else moves the picture: it starts
  // and stops with the voice, waits while the voice loads
  // (WaitForNarration in Lecture.tsx), and is put back on the voice whenever
  // the two drift more than DRIFT_FRAMES apart.
  useEffect(() => {
    const p = player.current;
    const a = narration?.audio;
    if (!p || !a || !timeline) return undefined;
    const frameOf = (s) => Math.max(0, Math.min(timeline.total - 1, Math.round(s * FPS)));
    // seekTo() on a playing Player pauses it, seeks, and resumes on the next
    // render. For the follower's own corrections that pause isn't the
    // listener's, so the voice keeps going through it.
    let correcting = false;
    let settleUntil = 0;
    // What the voice was last told to do. Its play and pause events arrive a
    // moment after the call (the seek bar pauses and resumes within one
    // click), so an event counts only if the element is still in that state
    // and wasn't told to be.
    let told = "pause";
    const onPlay = () => {
      // Pausing put the picture on the voice, and seeking moved both, so they
      // agree here; only a picture somewhere else entirely moves the voice.
      const at = p.getCurrentFrame() / FPS;
      if (Math.abs(a.currentTime - at) > 0.5) a.currentTime = at;
      told = "play";
      a.play().catch((e) => {
        // Not allowed to make sound before a click: wait for the play button.
        if (e?.name === "NotAllowedError") p.pause();
      });
    };
    const onPause = () => {
      if (correcting) return;
      told = "pause";
      a.pause();
      // Stop the picture on the word the voice stopped on.
      if (!a.seeking && a.readyState >= 2) {
        const f = frameOf(a.currentTime);
        if (f !== p.getCurrentFrame()) p.seekTo(f);
      }
    };
    // A seek by the listener moves the voice; the small corrections below
    // (and the one on pause) leave it alone.
    const onSeeked = (e) => {
      const at = e.detail.frame / FPS;
      if (Math.abs(a.currentTime - at) > 0.25) a.currentTime = at;
    };
    // Both: loading a source resets playbackRate to defaultPlaybackRate.
    const setRate = (r) => {
      a.defaultPlaybackRate = r;
      a.playbackRate = r;
    };
    const onRate = (e) => {
      rate.current = e.detail.playbackRate;
      setRate(rate.current);
    };
    const onEnded = () => {
      told = "pause";
      a.pause();
    };
    const onFrame = (e) => {
      if (!p.isPlaying() || a.paused || a.seeking || a.readyState < 3 || performance.now() < settleUntil) return;
      // A frame is shown for its whole length: compare its middle.
      if (Math.abs(e.detail.frame + 0.5 - a.currentTime * FPS) <= DRIFT_FRAMES) return;
      correcting = true;
      try {
        p.seekTo(frameOf(a.currentTime + LEAD_FRAMES / FPS));
      } finally {
        correcting = false;
      }
      // Let the Player resume before measuring again.
      settleUntil = performance.now() + 500;
    };
    // The voice paused or started without being told to (media keys, a
    // headset unplugged): the Player follows.
    const onVoicePause = () => {
      if (a.paused && told === "play" && !a.ended && p.isPlaying()) p.pause();
    };
    const onVoicePlay = () => {
      if (!a.paused && told === "pause" && !p.isPlaying()) p.play();
    };
    setRate(rate.current);
    p.addEventListener("play", onPlay);
    p.addEventListener("pause", onPause);
    p.addEventListener("seeked", onSeeked);
    p.addEventListener("ratechange", onRate);
    p.addEventListener("ended", onEnded);
    p.addEventListener("frameupdate", onFrame);
    a.addEventListener("pause", onVoicePause);
    a.addEventListener("play", onVoicePlay);
    // "Watch" may have started it before these listeners were added.
    if (p.isPlaying()) onPlay();
    return () => {
      p.removeEventListener("play", onPlay);
      p.removeEventListener("pause", onPause);
      p.removeEventListener("seeked", onSeeked);
      p.removeEventListener("ratechange", onRate);
      p.removeEventListener("ended", onEnded);
      p.removeEventListener("frameupdate", onFrame);
      a.removeEventListener("pause", onVoicePause);
      a.removeEventListener("play", onVoicePlay);
    };
  }, [narration, timeline]);

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
        {narration && <VolumeControl audio={narration.audio} />}
      </>
    ),
    [skip, narration],
  );

  const jump = (from) => {
    player.current?.seekTo(from);
    player.current?.play();
  };

  return (
    <div ref={wrap}>
      {failed ? (
        <p className="px-4 py-6 text-[14px] text-fg-subtle">The lecture could not be loaded. Reload the page to try again.</p>
      ) : !inputProps ? (
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
          initiallyMuted
          showVolumeControls={false}
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
