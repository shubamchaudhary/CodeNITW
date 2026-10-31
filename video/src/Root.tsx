import { Composition } from "remotion";
import { CHAPTERS } from "./chapters/index.ts";
import { buildTimeline, FPS, type Timing } from "./lib/timeline.ts";
import { H, W } from "./lib/theme.ts";
import { Lecture } from "./Lecture.tsx";
import ch01Timings from "../data/ch01/timings.json";
import ch02Timings from "../data/ch02/timings.json";

const TIMINGS: Record<string, Record<string, Timing>> = { ch01: ch01Timings as Record<string, Timing>, ch02: ch02Timings as Record<string, Timing> };

export const Root = () => (
  <>
    {CHAPTERS.map((chapter) => {
      const timings = TIMINGS[chapter.id];
      return (
        <Composition
          key={chapter.id}
          id={chapter.id}
          component={Lecture}
          durationInFrames={buildTimeline(chapter, timings).total}
          fps={FPS}
          width={W}
          height={H}
          defaultProps={{ chapter, timings }}
        />
      );
    })}
  </>
);
