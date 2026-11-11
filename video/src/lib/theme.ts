import { loadFont as inter } from "@remotion/google-fonts/Inter";
import { loadFont as mono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as deva } from "@remotion/google-fonts/NotoSansDevanagari";

export const FONT = inter("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin"] }).fontFamily;
export const MONO = mono("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin"] }).fontFamily;
export const DEVA = deva("normal", { weights: ["500", "700"], subsets: ["devanagari"] }).fontFamily;

export const W = 1920;
export const H = 1080;
// The stage sits between the header (top) and the captions (bottom).
export const STAGE = { top: 130, bottom: 900 };

export const C = {
  bg: "#0c1018",
  bg2: "#121826",
  card: "#171e2e",
  card2: "#1d2638",
  line: "#2b3550",
  text: "#eef2f8",
  muted: "#93a0b8",
  faint: "#5d6984",
  blue: "#5b9cff",
  green: "#38d996",
  amber: "#ffb547",
  pink: "#ff6fa5",
  purple: "#a78bfa",
  red: "#ff6262",
  cyan: "#3fd2e8",
  progress: "#f97316", // the line along the bottom: the site's orange
  head: FONT, // headline font
  glow1: "#5b9cff", // the two drifting backdrop lights
  glow2: "#a78bfa",
  soft: "#1a2a47", // behind a lit box on a board
  grad2: "#a78bfa", // second stop of a board's step-number gradient
};

// A chapter can restyle every scene by naming a theme: C is reset from BASE and
// overlaid with the theme each time the lecture renders, so other chapters
// shown later in the same page get the default look back.
const BASE = { ...C };
const THEMES: Record<string, Partial<typeof C>> = {
  // The LogLens site: near-black, one amber accent, a teal second colour, mono headlines.
  loglens: {
    bg: "#0b0d10",
    bg2: "#12161b",
    card: "#12161b",
    card2: "#161b21",
    line: "#2a333e",
    text: "#ece8df",
    muted: "#a3abb6",
    faint: "#6b737e",
    blue: "#ffa23e",
    amber: "#5fd3d0",
    progress: "#ffa23e",
    cyan: "#5fd3d0",
    head: MONO,
    glow1: "#ffa23e",
    glow2: "#5fd3d0",
    soft: "#2a1f12",
    grad2: "#ffd08a",
  },
};
// InterviewPlanPrep: the site's dark canvas and its violet brand.
THEMES.ipp = {
  bg: "#0a0a0b",
  bg2: "#111113",
  card: "#131316",
  card2: "#18181c",
  line: "#2a2a31",
  blue: "#8b5cf6",
  purple: "#c084fc",
  glow1: "#8b5cf6",
  glow2: "#38d996",
  soft: "#1e1530",
  grad2: "#c4b5fd",
};
// The Python and FastAPI lectures: the site's dark canvas and its orange.
THEMES.py = {
  bg: "#0b0c0f",
  bg2: "#121318",
  card: "#15161c",
  card2: "#1c1e25",
  line: "#2d3039",
  blue: "#ff8a3d",
  amber: "#ffd166",
  purple: "#ffc46b",
  cyan: "#2dd4bf",
  glow1: "#ff8a3d",
  glow2: "#2dd4bf",
  soft: "#2a1a0e",
  grad2: "#ffc46b",
  progress: "#f97316",
};
export const applyTheme = (name?: string) => {
  Object.assign(C, BASE, (name && THEMES[name]) || {});
};

export const tone = (name?: string): string =>
  ({ blue: C.blue, green: C.green, amber: C.amber, pink: C.pink, purple: C.purple, red: C.red, cyan: C.cyan, muted: C.muted } as Record<string, string>)[
    name ?? "blue"
  ] ?? C.blue;

// Distinct, readable colours for chips (tokens, bars).
export const PALETTE = [C.blue, C.pink, C.amber, C.green, C.purple, C.cyan, "#ff8a5b", "#9bd95b"];
