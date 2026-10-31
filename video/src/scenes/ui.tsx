import type { CSSProperties, ReactNode } from "react";
import { C } from "../lib/theme.ts";
import { rise } from "../lib/anim.ts";

export const SceneTitle = ({ text, frame, start = 0, sub }: { text: string; frame: number; start?: number; sub?: string }) => (
  <div style={{ position: "absolute", left: 80, top: 118, right: 80, ...rise(frame, start) }}>
    <div style={{ fontSize: 50, fontWeight: 800, letterSpacing: -0.5 }}>{text}</div>
    {sub && <div style={{ fontSize: 30, color: C.muted, marginTop: 8 }}>{sub}</div>}
  </div>
);

export const card = (accent?: string): CSSProperties => ({
  background: C.card,
  border: `2px solid ${accent ?? C.line}`,
  borderRadius: 22,
  boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
});

export const Chip = ({ children, color, style }: { children: ReactNode; color: string; style?: CSSProperties }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "8px 18px",
      borderRadius: 999,
      background: `${color}22`,
      border: `2px solid ${color}`,
      color,
      fontWeight: 700,
      fontSize: 26,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Abs = ({ x, y, w, h, children, style }: { x: number; y: number; w?: number; h?: number; children?: ReactNode; style?: CSSProperties }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, ...style }}>{children}</div>
);
