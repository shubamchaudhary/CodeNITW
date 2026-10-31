import { loadFont as inter } from "@remotion/google-fonts/Inter";
import { loadFont as mono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as deva } from "@remotion/google-fonts/NotoSansDevanagari";

export const FONT = inter("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin"] }).fontFamily;
export const MONO = mono("normal", { weights: ["400", "600"], subsets: ["latin"] }).fontFamily;
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
};

export const tone = (name?: string): string =>
  ({ blue: C.blue, green: C.green, amber: C.amber, pink: C.pink, purple: C.purple, red: C.red, cyan: C.cyan, muted: C.muted } as Record<string, string>)[
    name ?? "blue"
  ] ?? C.blue;

// Distinct, readable colours for chips (tokens, bars).
export const PALETTE = [C.blue, C.pink, C.amber, C.green, C.purple, C.cyan, "#ff8a5b", "#9bd95b"];
