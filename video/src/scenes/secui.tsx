// Shared pieces for the Spring lectures: actors (browser, server...) with
// lifelines, packets that fly between them, and the closing recall card.
import type { CSSProperties, ReactNode } from "react";
import type { Clock } from "../lib/timeline.ts";
import { C, MONO } from "../lib/theme.ts";
import { ease, lerp, rise } from "../lib/anim.ts";
import { Abs, card } from "./ui.tsx";
import { at, Big } from "./custom3.tsx";

export type CP = { t: Clock; props?: Record<string, unknown> };

export const Svg = ({ children }: { children: ReactNode }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
    {children}
  </svg>
);

export const Arrow = ({ x1, y1, x2, y2, color = C.muted, p = 1, dash }: { x1: number; y1: number; x2: number; y2: number; color?: string; p?: number; dash?: boolean }) => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  return (
    <g>
      <line x1={x1} y1={y1} x2={lerp(x1, x2, p)} y2={lerp(y1, y2, p)} stroke={color} strokeWidth={4} strokeLinecap="round" strokeDasharray={dash ? "12 10" : undefined} />
      {p > 0.95 && <polygon points={`${x2},${y2} ${x2 - 18 * Math.cos(a - 0.42)},${y2 - 18 * Math.sin(a - 0.42)} ${x2 - 18 * Math.cos(a + 0.42)},${y2 - 18 * Math.sin(a + 0.42)}`} fill={color} />}
    </g>
  );
};

// A box with an icon and a name, standing at the top of a lifeline.
export const Actor = ({ x, y = 250, w = 300, icon, name, sub, color = C.line, style }: { x: number; y?: number; w?: number; icon: string; name: string; sub?: string; color?: string; style?: CSSProperties }) => (
  <Abs x={x - w / 2} y={y} w={w} style={{ ...card(color), padding: "14px 10px", textAlign: "center", ...style }}>
    <div style={{ fontSize: 44, lineHeight: 1 }}>{icon}</div>
    <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>{name}</div>
    {sub && <div style={{ fontSize: 20, color: C.muted }}>{sub}</div>}
  </Abs>
);

// A message travelling from x1 to x2 at height y, starting at frame `start`.
export const Packet = ({ f, start, x1, x2, y, label, color = C.blue, dur = 30, stay = true, w = 420 }: { f: number; start: number; x1: number; x2: number; y: number; label: ReactNode; color?: string; dur?: number; stay?: boolean; w?: number }) => {
  const p = ease(f, start, dur);
  if (f < start) return null;
  const x = lerp(x1, x2, p);
  return (
    <>
      <Svg>
        <line x1={x1} y1={y + 24} x2={x} y2={y + 24} stroke={color} strokeWidth={3} strokeDasharray="8 8" opacity={stay ? 0.7 : 0} />
      </Svg>
      <Abs x={x - w / 2} y={y} w={w} style={{ ...card(color), padding: "8px 14px", textAlign: "center", fontFamily: MONO, fontSize: 22, opacity: Math.min(1, (f - start) / 6) }}>
        {label}
      </Abs>
    </>
  );
};

// The closing recall task, shared by every Spring lecture.
export const Recall = ({ t, props }: CP) => {
  const f = t.frame;
  const a = (props?.a as string) ?? "";
  const b = (props?.b as string) ?? "";
  return (
    <>
      <Abs x={260} y={320} w={1400} style={{ textAlign: "center", ...rise(f, 4) }}>
        <div style={{ fontSize: 100 }}>✏️</div>
        <Big size={48} style={{ marginTop: 10 }}>{a}</Big>
      </Abs>
      {t.step >= 1 && (
        <Abs x={260} y={640} w={1400} style={{ textAlign: "center", ...rise(f, at(t, 1)) }}>
          <Big size={36} color={C.amber}>{b}</Big>
        </Abs>
      )}
    </>
  );
};
