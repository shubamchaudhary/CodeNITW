import { Img, interpolate } from "remotion";
import { Gif } from "@remotion/gif";
import type { Scene } from "../lib/types.ts";
import type { Clock } from "../lib/timeline.ts";
import { C, MONO, tone } from "../lib/theme.ts";
import { ease, enter, lerp, pop, rise } from "../lib/anim.ts";
import { useAsset } from "../lib/assets.ts";
import { Abs, card, Chip, SceneTitle } from "./ui.tsx";

type Of<K extends Scene["kind"]> = Extract<Scene, { kind: K }>;
type P<K extends Scene["kind"]> = { s: Of<K>; t: Clock };

// Frame at which step i starts (first step shows almost at once).
const at = (t: Clock, i: number) => (i <= 0 ? 4 : (t.beats[i]?.stepStart ?? Infinity));

export const TitleScene = ({ s, t }: P<"title">) => {
  const f = t.frame;
  const bar = enter(f, 14, 24);
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: 180 }}>
      <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", color: C.blue, ...rise(f, 2) }}>{s.eyebrow}</div>
      <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: -2, marginTop: 18, ...rise(f, 8, 40) }}>{s.title}</div>
      <div style={{ height: 8, width: 520 * bar, background: `linear-gradient(90deg, ${C.blue}, ${C.purple})`, borderRadius: 4, marginTop: 26 }} />
      {s.subtitle && <div style={{ fontSize: 48, color: C.muted, marginTop: 30, ...rise(f, 18) }}>{s.subtitle}</div>}
    </div>
  );
};

export const SectionScene = ({ s, t }: P<"section">) => {
  const f = t.frame;
  const p = pop(f, 2);
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", paddingLeft: 200, gap: 70 }}>
      <div
        style={{
          width: 230,
          height: 230,
          borderRadius: 999,
          border: `6px solid ${C.blue}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 120,
          fontWeight: 800,
          color: C.blue,
          transform: `scale(${p})`,
          boxShadow: `0 0 80px ${C.blue}44`,
        }}
      >
        {s.num}
      </div>
      <div style={{ fontSize: 84, fontWeight: 800, maxWidth: 1250, lineHeight: 1.1, ...rise(f, 8, 40) }}>{s.title}</div>
    </div>
  );
};

export const StoryScene = ({ s, t }: P<"story">) => {
  const f = t.frame;
  return (
    <>
      <Abs x={80} y={130} w={1760} style={{ fontSize: 46, fontWeight: 700, ...rise(f, at(t, 0)) }}>
        <span style={{ color: C.green }}>FreshCart</span> · {s.intro.replace(/^Your first week at FreshCart: /, "your first week: ")}
      </Abs>
      {s.aside && (
        <Abs x={80} y={225} w={1760} style={{ ...rise(f, at(t, 1)), opacity: (rise(f, at(t, 1)).opacity as number) * (t.step >= 2 ? 0.55 : 1) }}>
          <div style={{ ...card(C.line), padding: "18px 28px", fontSize: 32, color: C.muted, display: "inline-block" }}>
            <b style={{ color: C.text }}>Manager:</b> “{s.aside}”
          </div>
        </Abs>
      )}
      {s.cards.map((c, i) => {
        const st = at(t, i + 2);
        const p = pop(f, st);
        const active = t.step === i + 2;
        const col = tone(c.tone);
        return (
          <Abs key={i} x={80 + i * 600} y={350} w={560} h={430} style={{ opacity: Math.min(1, p), transform: `translateY(${(1 - p) * 40}px) scale(${active ? 1.03 : 1})` }}>
            <div style={{ ...card(active ? col : C.line), height: "100%", padding: 34, display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ width: 72, height: 72, borderRadius: 999, background: col, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, fontWeight: 800, color: C.bg }}>
                  {c.who[0]}
                </div>
                <div>
                  <div style={{ fontSize: 34, fontWeight: 800 }}>{c.who}</div>
                  <div style={{ fontSize: 24, color: C.muted }}>{c.role}</div>
                </div>
              </div>
              <div style={{ fontSize: 33, lineHeight: 1.35 }}>“{c.text}”</div>
            </div>
          </Abs>
        );
      })}
      {s.closing && (
        <Abs x={80} y={815} w={1760} style={{ textAlign: "center", ...rise(f, at(t, s.beats.length - 1)) }}>
          <Chip color={C.amber} style={{ fontSize: 34, padding: "12px 30px" }}>
            {s.closing}
          </Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ flow

const AREA = { x: 80, y: 250, w: 1760, h: 590 };

export const FlowScene = ({ s, t }: P<"flow">) => {
  const f = t.frame;
  const nw = s.nodeW ?? 380;
  const nh = s.nodeH ?? 140;
  const cw = AREA.w / s.cols;
  const chh = AREA.h / s.rows;
  const pos = Object.fromEntries(s.nodes.map((n) => [n.id, { x: AREA.x + (n.c + 0.5) * cw, y: AREA.y + (n.r + 0.5) * chh }]));
  const revealStep = (id: string) => s.show.findIndex((ids) => ids.includes(id));
  const hideStep = (id: string) => (s.hide ?? []).findIndex((ids) => ids.includes(id));
  const nodeIn = (id: string) => {
    const st = revealStep(id);
    return st < 0 ? Infinity : at(t, st);
  };
  const nodeAlpha = (id: string) => {
    const a = enter(f, nodeIn(id));
    const h = hideStep(id);
    return h >= 0 ? a * (1 - 0.85 * enter(f, at(t, h))) : a;
  };

  const clip = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const sx = dx === 0 ? Infinity : (nw / 2 + 10) / Math.abs(dx);
    const sy = dy === 0 ? Infinity : (nh / 2 + 10) / Math.abs(dy);
    const k = Math.min(sx, sy);
    return { x: from.x + dx * k, y: from.y + dy * k };
  };

  return (
    <>
      {s.title && <SceneTitle text={s.title} frame={f} />}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {s.edges.map((e, i) => {
          const a = pos[e.from];
          const b = pos[e.to];
          const start = Math.max(nodeIn(e.from), nodeIn(e.to)) + 6;
          const p = enter(f, start, 16);
          if (p <= 0) return null;
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
          const bend = e.bend ?? 0;
          const ctrl = { x: mx + (-(b.y - a.y) / len) * bend, y: my + ((b.x - a.x) / len) * bend };
          const p0 = clip(a, bend ? ctrl : b);
          const p1 = clip(b, bend ? ctrl : a);
          const d = bend ? `M${p0.x},${p0.y} Q${ctrl.x},${ctrl.y} ${p1.x},${p1.y}` : `M${p0.x},${p0.y} L${p1.x},${p1.y}`;
          const ang = Math.atan2(p1.y - (bend ? ctrl.y : p0.y), p1.x - (bend ? ctrl.x : p0.x));
          const head = 18;
          const tip = `${p1.x},${p1.y} ${p1.x - head * Math.cos(ang - 0.42)},${p1.y - head * Math.sin(ang - 0.42)} ${p1.x - head * Math.cos(ang + 0.42)},${p1.y - head * Math.sin(ang + 0.42)}`;
          const dim = Math.min(nodeAlpha(e.from), nodeAlpha(e.to));
          const lp = bend ? { x: 0.25 * p0.x + 0.5 * ctrl.x + 0.25 * p1.x, y: 0.25 * p0.y + 0.5 * ctrl.y + 0.25 * p1.y } : { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
          return (
            <g key={i} opacity={Math.max(dim, 0.15)}>
              <path d={d} stroke={C.muted} strokeWidth={4} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} strokeLinecap="round" />
              <polygon points={tip} fill={C.muted} opacity={p > 0.9 ? 1 : 0} />
              {e.label && p > 0.6 && (
                <g opacity={enter(f, start + 10)}>
                  <rect x={lp.x - e.label.length * 7.5 - 14} y={lp.y - 20} width={e.label.length * 15 + 28} height={40} rx={20} fill={C.bg2} stroke={C.line} strokeWidth={2} />
                  <text x={lp.x} y={lp.y + 8} textAnchor="middle" fontSize={22} fill={C.muted} fontWeight={600}>
                    {e.label}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      {s.nodes.map((n) => {
        const st = revealStep(n.id);
        const a = nodeAlpha(n.id);
        if (a <= 0) return null;
        const p = pop(f, nodeIn(n.id));
        const current = st === t.step && (s.show[t.step] ?? []).length > 0;
        const col = n.tone ? tone(n.tone) : C.blue;
        const { x, y } = pos[n.id];
        const w = n.w ?? nw;
        return (
          <div
            key={n.id}
            style={{
              position: "absolute",
              left: x - w / 2,
              top: y - nh / 2,
              width: w,
              height: nh,
              ...card(current ? col : n.tone ? `${col}99` : C.line),
              background: current ? `${col}1f` : C.card,
              boxShadow: current ? `0 0 46px ${col}55` : card().boxShadow,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: 14,
              fontSize: nw < 330 ? 25 : 28,
              fontWeight: 600,
              lineHeight: 1.28,
              whiteSpace: "pre-line",
              opacity: a,
              transform: `scale(${0.85 + 0.15 * Math.min(1, p)})`,
            }}
          >
            {n.label}
          </div>
        );
      })}
      {s.overlay && t.step >= s.overlay.step && (
        <Abs x={80} y={855} w={1760} style={{ textAlign: "center", ...rise(f, at(t, s.overlay.step)) }}>
          <Chip color={tone(s.overlay.tone)} style={{ fontSize: 32, padding: "12px 30px" }}>
            {s.overlay.text}
          </Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ image

export const ImageScene = ({ s, t }: P<"image">) => {
  const f = t.frame;
  const asset = useAsset();
  const notes = s.notes ?? [];
  const box = notes.length ? { x: 80, y: 225, w: 1210, h: 640 } : { x: 210, y: 225, w: 1500, h: 640 };
  const focus = s.focus ?? [[50, 50, 1]];
  const fi = Math.min(t.step, focus.length - 1);
  const prev = focus[Math.max(0, fi - 1)];
  const cur = focus[fi];
  const k = fi === 0 ? 1 : ease(f, at(t, fi), 30);
  const fx = lerp(prev[0], cur[0], k);
  const fy = lerp(prev[1], cur[1], k);
  const z = lerp(prev[2], cur[2], k) * (1 + 0.02 * (f / t.dur));
  return (
    <>
      {s.title && <SceneTitle text={s.title} frame={f} />}
      <Abs x={box.x} y={box.y} w={box.w} h={box.h} style={{ ...rise(f, 4), borderRadius: 22, overflow: "hidden", background: "#ffffff", boxShadow: "0 18px 50px rgba(0,0,0,0.45)" }}>
        <div style={{ position: "absolute", inset: 18, transform: `scale(${z})`, transformOrigin: `${fx}% ${fy}%` }}>
          {s.gif ? (
            <Gif src={asset(s.src)} width={box.w - 36} height={box.h - 36} fit="contain" />
          ) : (
            <Img src={asset(s.src)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          )}
        </div>
      </Abs>
      <Abs x={box.x} y={box.y + box.h + 12} w={box.w} style={{ fontSize: 21, color: C.faint, opacity: enter(f, 10) }}>
        Image: {s.credit}
      </Abs>
      {notes.map((n, i) => {
        const st = Math.min(i, s.beats.length - 1);
        const shown = i < s.beats.length ? at(t, st) : at(t, s.beats.length - 1);
        return (
          <Abs key={i} x={1340} y={250 + i * 150} w={500} style={{ ...rise(f, shown), opacity: (rise(f, shown).opacity as number) * (t.step === st || i >= s.beats.length - 1 && t.step >= st ? 1 : 0.5) }}>
            <div style={{ borderLeft: `5px solid ${C.blue}`, paddingLeft: 24, fontSize: 34, lineHeight: 1.3, fontWeight: 600 }}>{n}</div>
          </Abs>
        );
      })}
    </>
  );
};

// ------------------------------------------------------------------ big statement

export const BigScene = ({ s, t }: P<"big">) => {
  const f = t.frame;
  const n = s.beats.length;
  const textStep = n === 2 ? 0 : 1;
  const afterStep = n - 1;
  const col = s.tone === "myth" ? C.red : s.tone === "interview" ? C.purple : C.amber;
  const strike = s.tone === "myth" ? enter(f, at(t, afterStep), 18) : 0;
  return (
    <div style={{ position: "absolute", left: 200, right: 200, top: 170, bottom: 160, display: "flex", flexDirection: "column", justifyContent: "center", gap: 40 }}>
      {s.lead && (
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", color: col, ...rise(f, at(t, 0)) }}>
          {s.tone === "myth" ? "✗ " : s.tone === "interview" ? "Q · " : "★ "}
          {s.lead}
        </div>
      )}
      <div style={{ position: "relative", ...rise(f, at(t, textStep), 34) }}>
        <div style={{ fontSize: s.text.length > 90 ? 54 : 70, fontWeight: 800, lineHeight: 1.2, borderLeft: `10px solid ${col}`, paddingLeft: 44, color: s.tone === "myth" ? C.muted : C.text }}>
          {s.text}
        </div>
        {strike > 0 && <div style={{ position: "absolute", left: 44, top: "50%", height: 8, width: `${strike * 90}%`, background: C.red, borderRadius: 4 }} />}
      </div>
      {s.after && <div style={{ fontSize: 42, color: s.tone === "myth" ? C.text : C.muted, fontWeight: 600, paddingLeft: 54, lineHeight: 1.35, ...rise(f, at(t, afterStep)) }}>{s.after}</div>}
    </div>
  );
};

// ------------------------------------------------------------------ bullets

export const BulletsScene = ({ s, t }: P<"bullets">) => {
  const f = t.frame;
  const first = s.firstItemStep ?? 0;
  const myth = s.tone === "myth";
  return (
    <>
      <Abs x={80} y={128} w={1760} style={rise(f, 4)}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {myth && <Chip color={C.red}>MYTH</Chip>}
          <div style={{ fontSize: 54, fontWeight: 800, textDecoration: myth && t.step >= 1 ? "line-through" : "none", textDecorationColor: C.red }}>{s.title}</div>
        </div>
        {s.lead && <div style={{ fontSize: 34, color: myth ? C.red : C.muted, marginTop: 14, fontWeight: 600 }}>{s.lead}</div>}
      </Abs>
      {s.items.map((it, i) => {
        const st = Math.min(first + i, s.beats.length - 1);
        const start = at(t, st);
        const active = t.step === st;
        const gap = s.items.length > 3 ? 150 : 175;
        return (
          <Abs key={i} x={110} y={(s.lead ? 300 : 270) + i * gap} w={1700} style={{ ...rise(f, start), opacity: (rise(f, start).opacity as number) * (active || t.step < st ? 1 : 0.62) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
              <div style={{ width: 92, height: 92, borderRadius: 24, background: active ? `${C.blue}33` : C.card, border: `2px solid ${active ? C.blue : C.line}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 46 }}>
                {it.icon ?? "•"}
              </div>
              <div>
                <div style={{ fontSize: 42, fontWeight: 700 }}>{it.text}</div>
                {it.sub && <div style={{ fontSize: 30, color: C.muted, marginTop: 6 }}>{it.sub}</div>}
              </div>
            </div>
          </Abs>
        );
      })}
    </>
  );
};

// ------------------------------------------------------------------ chat

export const ChatScene = ({ s, t }: P<"chat">) => {
  const f = t.frame;
  return (
    <>
      {s.title && <SceneTitle text={s.title} frame={f} />}
      <Abs x={360} y={225} w={1200} h={660} style={{ ...card(), background: C.bg2, padding: "30px 40px", display: "flex", flexDirection: "column", gap: 22, ...rise(f, 2) }}>
        {s.messages.map((m, i) => {
          const p = Math.min(1, pop(f, at(t, m.step) + (i % 2) * 14));
          const user = m.from === "user";
          return (
            <div key={i} style={{ alignSelf: user ? "flex-end" : "flex-start", maxWidth: 820, opacity: p, transform: `translateY(${(1 - p) * 30}px)` }}>
              <div style={{ background: user ? C.blue : C.card2, color: user ? "#06101f" : C.text, borderRadius: 26, borderBottomRightRadius: user ? 6 : 26, borderBottomLeftRadius: user ? 26 : 6, padding: "16px 28px", fontSize: 32, lineHeight: 1.32, fontWeight: user ? 600 : 500 }}>
                <div style={{ fontSize: 22, fontWeight: 800, opacity: 0.7, marginBottom: 4, color: user ? undefined : C.muted }}>{m.who ?? "Chat model"}</div>
                {m.text}
              </div>
            </div>
          );
        })}
      </Abs>
      {s.stamp && t.step >= s.stamp.step && (
        <Abs x={0} y={600} w={1920} style={{ display: "flex", justifyContent: "center" }}>
          <div
            style={{
              border: `8px solid ${C.red}`,
              color: C.red,
              fontSize: 76,
              fontWeight: 900,
              letterSpacing: 6,
              padding: "10px 40px",
              borderRadius: 16,
              background: "rgba(12,16,24,0.85)",
              transform: `rotate(-8deg) scale(${2 - Math.min(1, pop(f, at(t, s.stamp.step)))})`,
              opacity: enter(f, at(t, s.stamp.step), 6),
            }}
          >
            {s.stamp.text}
          </div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ pause

export const PauseScene = ({ s, t }: P<"pause">) => {
  const f = t.frame;
  const last = t.beats[t.beats.length - 1];
  const holdStart = last.audioEnd;
  const holdLen = Math.max(1, last.end - last.audioEnd);
  const hp = interpolate(f, [holdStart, holdStart + holdLen], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      {s.visual === "docs" && <DocsGrid frame={f} />}
      <div style={{ position: "absolute", left: s.visual === "docs" ? 900 : 200, right: 160, top: 170, bottom: 170, display: "flex", flexDirection: "column", justifyContent: "center", gap: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 26, ...rise(f, 2) }}>
          <svg width={110} height={110} viewBox="0 0 110 110">
            <circle cx={55} cy={55} r={48} stroke={C.line} strokeWidth={8} fill="none" />
            <circle cx={55} cy={55} r={48} stroke={C.amber} strokeWidth={8} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={hp} transform="rotate(-90 55 55)" />
            <rect x={38} y={34} width={11} height={42} rx={3} fill={C.amber} />
            <rect x={61} y={34} width={11} height={42} rx={3} fill={C.amber} />
          </svg>
          <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: 4, textTransform: "uppercase", color: C.amber }}>Pause and think</div>
        </div>
        <div style={{ fontSize: s.visual === "docs" ? 50 : 58, fontWeight: 700, lineHeight: 1.3, ...rise(f, 10, 30) }}>{s.question}</div>
      </div>
    </>
  );
};

const DocsGrid = ({ frame }: { frame: number }) => {
  const hits = [
    [37, 12],
    [81, 64],
    [22, 88],
  ];
  const glow = 0.5 + 0.5 * Math.sin(frame / 8);
  return (
    <svg width={720} height={600} style={{ position: "absolute", left: 120, top: 240, opacity: enter(frame, 4) }}>
      <defs>
        <pattern id="doc" width={6} height={6} patternUnits="userSpaceOnUse">
          <rect width={4.5} height={4.5} fill={C.line} />
        </pattern>
      </defs>
      <rect width={720} height={600} fill="url(#doc)" />
      {hits.map(([c, r], i) => (
        <g key={i}>
          <rect x={c * 6 - 9} y={r * 6 - 9} width={24} height={24} rx={6} fill="none" stroke={C.amber} strokeWidth={3} opacity={glow} />
          <rect x={c * 6} y={r * 6} width={6} height={6} fill={C.amber} />
        </g>
      ))}
      <text x={0} y={-14} fill={C.muted} fontSize={26} fontWeight={700}>
        12,000 documents
      </text>
    </svg>
  );
};

// ------------------------------------------------------------------ code

export const CodeScene = ({ s, t }: P<"code">) => {
  const f = t.frame;
  const lines = s.code.split("\n");
  const panel = { x: 80, y: 220, w: 1760, h: 650 };
  // Fit short listings whole; longer ones scroll to the highlighted lines.
  const lh = Math.max(31, Math.min(35, Math.floor((panel.h - 28) / lines.length)));
  const fs = lh < 35 ? 22 : 24;
  const visible = Math.floor((panel.h - 28) / lh);
  const hl = s.highlight[Math.min(t.step, s.highlight.length - 1)];
  const prevHl = s.highlight[Math.max(0, Math.min(t.step, s.highlight.length - 1) - 1)];
  const target = (h: [number, number] | null) =>
    h ? Math.max(0, Math.min(lines.length - visible, Math.round((h[0] + h[1]) / 2 - visible / 2))) : 0;
  const k = ease(f, at(t, t.step), 24);
  const scroll = lerp(target(prevHl), target(hl), t.step === 0 ? 1 : k);
  return (
    <>
      <SceneTitle text={s.title} frame={f} />
      <Abs x={panel.x} y={panel.y} w={panel.w} h={panel.h} style={{ ...card(), background: "#0a0e16", overflow: "hidden", ...rise(f, 4) }}>
        <div style={{ position: "absolute", left: 0, top: 14 - scroll * lh, fontFamily: MONO, fontSize: fs, width: "100%" }}>
          {lines.map((ln, i) => {
            const n = i + 1;
            const on = hl ? n >= hl[0] && n <= hl[1] : true;
            return (
              <div key={i} style={{ height: lh, display: "flex", alignItems: "center", background: hl && on ? `${C.blue}1f` : "transparent", opacity: on ? 1 : 0.32, whiteSpace: "pre" }}>
                <span style={{ width: 70, textAlign: "right", color: C.faint, paddingRight: 22 }}>{n}</span>
                <span style={{ color: syntaxColor(ln, s.lang) }}>{ln}</span>
              </div>
            );
          })}
        </div>
      </Abs>
      {s.badge && t.step >= s.badge.step && (
        <Abs x={1440} y={250} w={360} style={{ ...card(C.green), padding: "22px 28px", textAlign: "center", ...rise(f, at(t, s.badge.step)) }}>
          <div style={{ fontSize: 82, fontWeight: 900, color: C.green }}>
            {Math.round(lerp(s.badge.from, s.badge.to, ease(f, at(t, s.badge.step), 40)))}%
          </div>
          <div style={{ fontSize: 24, color: C.muted }}>
            {s.badge.label} (was {s.badge.from}%)
          </div>
        </Abs>
      )}
    </>
  );
};

const syntaxColor = (ln: string, lang: string) => {
  const s = ln.trim();
  if (lang === "python") {
    if (s.startsWith("#")) return C.faint;
    if (/^(def|import|return|for|if|break)\b/.test(s)) return C.purple;
    return C.text;
  }
  if (/^<ticket>/.test(s)) return C.cyan;
  if (/^[A-Z][a-z ]+:$/.test(s) || s.startsWith("Reply")) return C.amber;
  if (s.startsWith("-")) return C.text;
  return C.text;
};

// ------------------------------------------------------------------ decision

export const DecisionScene = ({ s, t }: P<"decision">) => {
  const f = t.frame;
  return (
    <>
      <Abs x={80} y={130} w={1760} style={rise(f, 4)}>
        <Chip color={C.amber}>DECISION POINT</Chip>
        <div style={{ fontSize: 48, fontWeight: 800, marginTop: 20, lineHeight: 1.25 }}>{s.question}</div>
      </Abs>
      <Abs x={80} y={350} w={1760} style={{ fontSize: 36, color: C.muted, ...rise(f, at(t, 1)) }}>
        {s.answer}
      </Abs>
      {[s.left, s.right].map((col, i) => {
        const c = i === 0 ? C.green : C.red;
        return (
          <Abs key={i} x={80 + i * 900} y={440} w={860} h={330} style={{ ...card(c), padding: 36, ...rise(f, at(t, 2) + i * 10) }}>
            <div style={{ fontSize: 40, fontWeight: 800, color: c }}>{col.title}</div>
            {col.items.map((it, j) => (
              <div key={j} style={{ fontSize: 34, marginTop: 18, color: C.text }}>
                · {it}
              </div>
            ))}
          </Abs>
        );
      })}
      {s.footer && (
        <Abs x={80} y={810} w={1760} style={{ textAlign: "center", ...rise(f, at(t, 3)) }}>
          <Chip color={C.blue} style={{ fontSize: 30 }}>
            {s.footer}
          </Chip>
        </Abs>
      )}
    </>
  );
};
