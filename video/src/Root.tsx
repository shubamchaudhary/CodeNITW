import { Composition } from "remotion";
import { CHAPTERS } from "./chapters/index.ts";
import { buildTimeline, FPS, type Timing } from "./lib/timeline.ts";
import { H, W } from "./lib/theme.ts";
import { Lecture } from "./Lecture.tsx";
import ch01Timings from "../data/ch01/timings.json";
import ch02Timings from "../data/ch02/timings.json";
import ch03Timings from "../data/ch03/timings.json";
import ch04Timings from "../data/ch04/timings.json";
import ch05Timings from "../data/ch05/timings.json";
import ch06Timings from "../data/ch06/timings.json";
import ch07Timings from "../data/ch07/timings.json";
import ch08Timings from "../data/ch08/timings.json";
import ch09Timings from "../data/ch09/timings.json";
import ch10Timings from "../data/ch10/timings.json";
import ch11Timings from "../data/ch11/timings.json";
import ch12Timings from "../data/ch12/timings.json";

const TIMINGS: Record<string, Record<string, Timing>> = { ch01: ch01Timings as Record<string, Timing>, ch02: ch02Timings as Record<string, Timing>, ch03: ch03Timings as Record<string, Timing>, ch04: ch04Timings as Record<string, Timing>, ch05: ch05Timings as Record<string, Timing>, ch06: ch06Timings as Record<string, Timing>, ch07: ch07Timings as Record<string, Timing>, ch08: ch08Timings as Record<string, Timing>, ch09: ch09Timings as Record<string, Timing>, ch10: ch10Timings as Record<string, Timing>, ch11: ch11Timings as Record<string, Timing>, ch12: ch12Timings as Record<string, Timing> };

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
