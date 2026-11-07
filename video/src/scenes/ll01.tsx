// LogLens (LL-01), drawn in the LogLens site's own style: boxes on a near-black
// board, the path in use lit in amber with marching dashes, and the step
// explained in a panel on the right (loglens-frontend/src/components/Architecture.jsx).
import type { ReactNode } from "react";
import { C, MONO } from "../lib/theme.ts";
import { ease, enter, lerp, pop, rise } from "../lib/anim.ts";
import { Abs, card, Chip } from "./ui.tsx";
import { at } from "./custom3.tsx";
import type { CP } from "./secui.tsx";

type Side = "l" | "r" | "t" | "b";
type ANode = { id: string; x: number; y: number; w: number; h?: number; t: string; s?: string; at?: number; tone?: string };
type AGroup = { x: number; y: number; w: number; h: number; t: string; nodes?: string[]; at?: number };
type AEdge = {
  id: string;
  from?: string;
  to?: string;
  fs?: Side;
  ts?: Side;
  fo?: number; // offset of the start point along its side
  tof?: number; // offset of the end point along its side
  via?: [number, number][];
  d?: string; // explicit path, overrides the router
  l?: string;
  lx?: number;
  ly?: number;
  la?: "start" | "middle" | "end";
  at?: number;
};
type AStep = { n?: string; t?: string; b?: string; m?: string; nodes?: string[]; edges?: string[]; all?: boolean };
export type ArchProps = {
  title?: string;
  view: [number, number];
  nodes: ANode[];
  groups?: AGroup[];
  edges: AEdge[];
  steps: AStep[];
  panel?: boolean; // the step panel on the right (default true)
};

const NH = 84; // default node height, in view units
const SOFT = "#2a1f12"; // the site's accent-soft, behind a lit box
const LINE2 = "#3a4552";

const anchor = (n: ANode, side: Side, off = 0): [number, number] => {
  const h = n.h ?? NH;
  if (side === "l") return [n.x, n.y + h / 2 + off];
  if (side === "r") return [n.x + n.w, n.y + h / 2 + off];
  if (side === "t") return [n.x + n.w / 2 + off, n.y];
  return [n.x + n.w / 2 + off, n.y + h];
};

const guessSides = (a: ANode, b: ANode): [Side, Side] => {
  if (b.x >= a.x + a.w) return ["r", "l"];
  if (b.x + b.w <= a.x) return ["l", "r"];
  if (b.y >= a.y + (a.h ?? NH)) return ["b", "t"];
  return ["t", "b"];
};

// Orthogonal route from one box side to another; returns the points.
const route = (e: AEdge, byId: Record<string, ANode>): [number, number][] => {
  const a = byId[e.from!];
  const b = byId[e.to!];
  const [gs, gt] = guessSides(a, b);
  const fs = e.fs ?? gs;
  const ts = e.ts ?? gt;
  const p = anchor(a, fs, e.fo);
  const q = anchor(b, ts, e.tof);
  if (e.via) return [p, ...e.via, q];
  const hz = (s: Side) => s === "l" || s === "r";
  if (hz(fs) && hz(ts)) {
    if (Math.abs(p[1] - q[1]) < 1) return [p, q];
    const mx = (p[0] + q[0]) / 2;
    return [p, [mx, p[1]], [mx, q[1]], q];
  }
  if (!hz(fs) && !hz(ts)) {
    if (Math.abs(p[0] - q[0]) < 1) return [p, q];
    const my = (p[1] + q[1]) / 2;
    return [p, [p[0], my], [q[0], my], q];
  }
  if (hz(fs)) return [p, [q[0], p[1]], q];
  return [p, [p[0], q[1]], q];
};

const pathOf = (pts: [number, number][]) => pts.map((pt, i) => `${i ? "L" : "M"}${pt[0]} ${pt[1]}`).join(" ");

const labelAt = (pts: [number, number][]): [number, number, "start" | "middle"] => {
  let best = 0;
  let len = -1;
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    if (l > len) {
      len = l;
      best = i;
    }
  }
  const [x1, y1] = pts[best];
  const [x2, y2] = pts[best + 1];
  if (Math.abs(y1 - y2) < 1) return [(x1 + x2) / 2, y1 - 12, "middle"];
  return [x1 + 12, (y1 + y2) / 2 + 6, "start"];
};

export const Board = ({ p, step, f, since, x, y, w, h }: { p: ArchProps; step: number; f: number; since: number; x: number; y: number; w: number; h: number }) => {
  const [vw, vh] = p.view;
  const byId = Object.fromEntries(p.nodes.map((n) => [n.id, n]));
  const st = p.steps[Math.min(step, p.steps.length - 1)] ?? { all: true };
  const prev = p.steps[Math.min(step - 1, p.steps.length - 1)];
  const k = step === 0 ? 1 : enter(since, 0, 14);
  const litIn = (s: AStep | undefined, kind: "nodes" | "edges", id: string) => !s || s.all || !!s[kind]?.includes(id);
  const hot = (s: AStep | undefined, kind: "nodes" | "edges", id: string) => !!s && !s.all && !!s[kind]?.includes(id);
  const mix = (kind: "nodes" | "edges", id: string) => {
    const now = litIn(st, kind, id) ? 1 : 0;
    const was = step === 0 ? now : litIn(prev, kind, id) ? 1 : 0;
    return lerp(was, now, k);
  };
  const seen = (a?: number) => step >= (a ?? 0);
  const fadeIn = (a?: number) => (!a ? 1 : step > a ? 1 : enter(since, 0, 16));
  const dash = (f * 0.55) % 22;
  // Text is sized for the screen, not the view: a wide board scaled down
  // still reads at ~25 px titles and ~18 px labels. Text too wide for its box
  // is squeezed to fit.
  const sc = w / vw;
  const tF = Math.max(24, 26 / sc);
  const sF = Math.max(17, 18.5 / sc);
  const lF = Math.max(17, 18 / sc);
  const fit = (text: string, size: number, k: number, room: number) =>
    text.length * size * k > room ? { textLength: room, lengthAdjust: "spacingAndGlyphs" as const } : {};
  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} width={w} height={h} style={{ position: "absolute", left: x, top: y, overflow: "visible" }}>
      <defs>
        <marker id="ll-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill={C.faint} />
        </marker>
        <marker id="ll-arrow-on" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill={C.blue} />
        </marker>
      </defs>
      {(p.groups ?? []).filter((g) => seen(g.at)).map((g, i) => {
        const on = !!st && !st.all && (g.nodes ?? []).some((id) => st.nodes?.includes(id));
        const lit = st?.all || on || !(g.nodes ?? []).length ? 1 : 0.5;
        return (
          <g key={`g${i}`} opacity={lit * fadeIn(g.at)}>
            <rect x={g.x} y={g.y} width={g.w} height={g.h} rx={18} fill="none" strokeDasharray="7 6" strokeWidth={1.6} stroke={on ? C.blue : LINE2} />
            <text x={g.x + g.w / 2} y={g.y + 8 + lF} textAnchor="middle" fontSize={lF} fontWeight={600} fill={on ? C.blue : C.muted} fontFamily="Inter">
              {g.t}
            </text>
          </g>
        );
      })}
      {p.edges.map((e) => {
        if (e.from && (!seen(byId[e.from]?.at) || !seen(byId[e.to!]?.at))) return null;
        if (!seen(e.at)) return null;
        const pts = e.d ? null : route(e, byId);
        const d = e.d ?? pathOf(pts!);
        const on = hot(st, "edges", e.id);
        const o = lerp(0.35, 1, mix("edges", e.id)) * fadeIn(e.at ?? Math.max(byId[e.from ?? ""]?.at ?? 0, byId[e.to ?? ""]?.at ?? 0));
        const [lx, ly, la] = e.lx != null ? [e.lx, e.ly!, e.la ?? "middle"] : pts ? labelAt(pts) : [0, 0, "middle" as const];
        return (
          <g key={e.id} opacity={o}>
            <path d={d} fill="none" strokeWidth={on ? 2.8 : 1.6} stroke={on ? C.blue : LINE2} strokeDasharray={on ? "8 6" : undefined} strokeDashoffset={on ? -dash : 0} markerEnd={`url(#${on ? "ll-arrow-on" : "ll-arrow"})`} />
            {e.l && (
              <text x={lx} y={ly} textAnchor={la} fontSize={lF} fontWeight={500} fill={on ? C.blue : C.muted} fontFamily="Inter">
                {e.l}
              </text>
            )}
          </g>
        );
      })}
      {p.nodes.filter((n) => seen(n.at)).map((n) => {
        const on = hot(st, "nodes", n.id);
        const nh = n.h ?? NH;
        const o = lerp(0.42, 1, mix("nodes", n.id)) * fadeIn(n.at);
        const col = n.tone === "teal" ? C.cyan : n.tone === "red" ? C.red : n.tone === "green" ? C.green : C.blue;
        const lines = n.s ? n.s.split("\n") : [];
        const blockH = tF + lines.length * sF * 1.2 + (lines.length ? 4 : 0);
        const top = n.y + (nh - blockH) / 2;
        return (
          <g key={n.id} opacity={o}>
            <rect x={n.x} y={n.y} width={n.w} height={nh} rx={14} strokeWidth={on ? 2.4 : 1.2} fill={on ? (n.tone ? `${col}22` : SOFT) : C.card} stroke={on ? col : LINE2} />
            <text x={n.x + n.w / 2} y={top + tF * 0.82} textAnchor="middle" fontSize={tF} fontWeight={600} fill={C.text} fontFamily="Inter" {...fit(n.t, tF, 0.56, n.w - 16)}>
              {n.t}
            </text>
            {lines.map((ln, i) => (
              <text key={i} x={n.x + n.w / 2} y={top + tF + 4 + sF * 0.95 + i * sF * 1.2} textAnchor="middle" fontSize={sF} fill={C.muted} fontFamily="Inter" {...fit(ln, sF, 0.5, n.w - 14)}>
                {ln}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
};

// The step explained beside the board: number, title, text, and a measured fact.
const Panel = ({ s, f, start, idx }: { s: AStep; f: number; start: number; idx: number }) => (
  <Abs x={1352} y={262} w={500} style={rise(f, start, 18)}>
    <div style={{ fontFamily: MONO, fontSize: 84, fontWeight: 800, lineHeight: 1, background: `linear-gradient(90deg, ${C.blue}, #ffd08a)`, WebkitBackgroundClip: "text", color: "transparent" }}>
      {s.n ?? String(idx + 1).padStart(2, "0")}
    </div>
    {s.t && <div style={{ fontFamily: MONO, fontSize: s.t.length > 22 ? 32 : 38, fontWeight: 800, lineHeight: 1.15, marginTop: 14, letterSpacing: -0.5 }}>{s.t}</div>}
    {s.b && <div style={{ fontSize: 27, lineHeight: 1.45, color: "#c9cdd3", marginTop: 14 }}>{s.b}</div>}
    {s.m && (
      <div style={{ display: "inline-block", marginTop: 20, fontFamily: MONO, fontSize: 22, fontWeight: 600, color: C.blue, background: C.card2, border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 14px", lineHeight: 1.35 }}>
        {s.m}
      </div>
    )}
  </Abs>
);

export const LLArch = ({ t, props }: CP) => {
  const p = props as unknown as ArchProps;
  const f = t.frame;
  const panel = p.panel !== false;
  const top = p.title ? 230 : 170;
  const bw = panel ? 1240 : 1760;
  const bh = 880 - top;
  const [vw, vh] = p.view;
  const sc = Math.min(bw / vw, bh / vh);
  const w = vw * sc;
  const h = vh * sc;
  const x = 80 + (bw - w) / 2;
  const y = top + (bh - h) / 2;
  // The panel shows the latest step that has something to say.
  let pi = Math.min(t.step, p.steps.length - 1);
  while (pi > 0 && !p.steps[pi]?.t && !p.steps[pi]?.b) pi--;
  const ps = p.steps[pi];
  const numbered = p.steps.slice(0, pi + 1).filter((s) => s.t || s.b).length - 1;
  return (
    <>
      {p.title && (
        <Abs x={80} y={128} w={1220} style={{ fontFamily: MONO, fontSize: p.title.length > 40 ? 40 : 46, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.15, ...rise(f, 2) }}>
          {p.title}
        </Abs>
      )}
      <Board p={p} step={t.step} f={f} since={t.since(t.step)} x={x} y={y} w={w} h={h} />
      {panel && ps && (ps.t || ps.b) && <Panel key={pi} s={ps} f={f} start={at(t, pi)} idx={numbered} />}
    </>
  );
};

// ------------------------------------------------------------------ the splitter

// A file streamed once and cut into byte ranges: the cut needs a timestamped
// line, a new minute and 5 MB since the last cut (or 20 MB, whatever happens).
export const LLSplit = ({ t }: CP) => {
  const f = t.frame;
  const s = t.step;
  const X = 110;
  const W = 1700;
  const Y = 250;
  // part boundaries as fractions of the bar
  const cuts = [0, 0.13, 0.27, 0.4, 0.49, 0.62, 0.76, 0.88, 1];
  const sweep = s === 1 ? ease(f, at(t, 1), 160) : s > 1 ? 1 : 0;
  const lines: { ts?: string; txt: string; lvl?: string }[] = [
    { ts: "09:30:58.112", lvl: "INFO", txt: "order-service  GET /api/orders 200 41ms" },
    { ts: "09:30:59.870", lvl: "ERROR", txt: "payment  SSLHandshakeException: PKIX path" },
    { txt: "    at sun.security.ssl.Alert.createSSLException" },
    { txt: "    at sun.security.ssl.TransportContext.fatal" },
    { txt: "    at com.shop.pay.BankClient.authorize" },
    { ts: "09:31:00.004", lvl: "WARN", txt: "api-gateway  upstream payment 502 in 1.2s" },
    { ts: "09:31:00.311", lvl: "INFO", txt: "cart-service  POST /api/cart 200 18ms" },
  ];
  const cutRow = 5;
  return (
    <>
      <Abs x={80} y={128} w={1300} style={{ fontFamily: MONO, fontSize: 46, fontWeight: 800, ...rise(f, 2) }}>
        Virtual parts: byte ranges, never copies
      </Abs>
      <Abs x={X} y={Y - 44} w={W} style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 22, color: C.muted }}>
        <span>byte 0</span>
        <span>app.log · 2 GB · 15.5M lines</span>
        <span>byte 2,000,000,095</span>
      </Abs>
      <div style={{ position: "absolute", left: X, top: Y, width: W, height: 70, borderRadius: 12, border: `1.5px solid #3a4552`, background: C.card, overflow: "hidden" }}>
        {s >= 1 && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${sweep * 100}%`, background: `${C.blue}18` }} />}
        {s >= 4 &&
          cuts.slice(0, -1).map((c, i) => (
            <div key={i} style={{ position: "absolute", left: `${c * 100}%`, width: `${(cuts[i + 1] - c) * 100}%`, top: 0, bottom: 0, background: i % 2 ? `${C.blue}30` : `${C.cyan}26`, borderRight: `2px solid ${C.bg}`, opacity: enter(f, at(t, 4) + i * 5, 10), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 20, color: C.text }}>
              part {i}
            </div>
          ))}
        {s === 1 && <div style={{ position: "absolute", left: `${sweep * 100}%`, top: -4, bottom: -4, width: 4, background: C.blue, boxShadow: `0 0 18px ${C.blue}` }} />}
      </div>
      {s === 1 && (
        <Abs x={X} y={Y + 90} w={W} style={{ textAlign: "center", fontFamily: MONO, fontSize: 28, color: C.blue, ...rise(f, at(t, 1)) }}>
          one pass · 64 KB buffer · holds one line (max 1 MB) + counters · {Math.round(sweep * 2000).toLocaleString("en-US")} MB read
        </Abs>
      )}
      {s >= 2 && s <= 3 && (
        <Abs x={X} y={Y + 110} w={W} style={{ ...card(), padding: "20px 28px", fontFamily: MONO, fontSize: 25, lineHeight: 1.75, ...rise(f, at(t, 2)) }}>
          {lines.map((ln, i) => {
            const isCut = s >= 3 && i === cutRow;
            return (
              <div key={i} style={{ display: "flex", gap: 18, alignItems: "center", borderTop: isCut ? `3px dashed ${C.blue}` : "3px solid transparent", position: "relative" }}>
                <span style={{ width: 26, color: ln.ts ? C.green : C.faint }}>{ln.ts ? "●" : "·"}</span>
                <span style={{ width: 190, color: ln.ts ? C.text : C.faint }}>{ln.ts ?? ""}</span>
                <span style={{ width: 90, color: ln.lvl === "ERROR" ? C.red : ln.lvl === "WARN" ? C.blue : C.muted }}>{ln.lvl ?? ""}</span>
                <span style={{ color: ln.ts ? "#c9cdd3" : C.faint }}>{ln.txt}</span>
                {isCut && (
                  <span style={{ position: "absolute", right: 0, top: -40, fontFamily: "Inter", fontSize: 24, fontWeight: 700, color: C.blue, ...rise(f, at(t, 3)) }}>✂ cut here: new minute + timestamp + ≥ 5 MB</span>
                )}
              </div>
            );
          })}
          <div style={{ fontFamily: "Inter", fontSize: 24, color: C.muted, marginTop: 8 }}>● record start (has a timestamp) &nbsp;&nbsp; · stack frame: stays with its record</div>
        </Abs>
      )}
      {s >= 4 && (
        <Abs x={X} y={Y + 110} w={W} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, ...rise(f, at(t, 4)) }}>
          {[
            ["target", "5 MB", "cut only at a new minute, on a timestamped line"],
            ["hard cap", "20 MB", "4 × target: one runaway minute can't make a giant part"],
            ["no timestamps", "5,000 lines", "per part; windows of 500 lines by global line number"],
          ].map(([a, b, c], i) => (
            <div key={i} style={{ ...card(i === 1 && s >= 5 ? C.blue : undefined), padding: "22px 26px", opacity: enter(f, at(t, 4) + i * 8, 12) }}>
              <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 3, textTransform: "uppercase", color: C.blue }}>{a}</div>
              <div style={{ fontFamily: MONO, fontSize: 52, fontWeight: 800, marginTop: 6 }}>{b}</div>
              <div style={{ fontSize: 25, color: C.muted, marginTop: 6, lineHeight: 1.35 }}>{c}</div>
            </div>
          ))}
        </Abs>
      )}
      {s >= 6 && (
        <Abs x={X} y={640} w={W} style={{ ...card(C.blue), padding: "20px 30px", fontFamily: MONO, fontSize: 26, lineHeight: 1.6, ...rise(f, at(t, 6)) }}>
          <span style={{ color: C.muted }}>log.ingest.parts · key "docId:partIdx" →</span>
          <br />
          {"{ partIdx: 3, totalParts: 410, byteStart: 15_728_922, byteEndExclusive: 21_004_117, firstLineNumber: 121_408 }"}
        </Abs>
      )}
      {s >= 7 && (
        <Abs x={X} y={800} w={W} style={{ textAlign: "center", ...rise(f, at(t, 7)) }}>
          <Chip color={C.blue} style={{ fontSize: 28 }}>
            total_parts saved before the first part is sent · the file is never copied
          </Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ median and MAD

// Ten minutes of error counts. The mean is dragged by the outage; the median
// is not, and the MAD band shows how far is "far".
export const LLMad = ({ t }: CP) => {
  const f = t.frame;
  const s = t.step;
  const xs = [2, 3, 2, 4, 3, 2, 3, 250, 2, 3];
  const X0 = 200;
  const Y0 = 800; // baseline
  const top = 440;
  const cap = 40; // the axis tops out here; 250 is drawn broken
  const yOf = (v: number) => Y0 - (Math.min(v, cap) / cap) * (Y0 - top);
  const bw = 100;
  const gap = 46;
  const line = (v: number, col: string, label: string, st: number) => (
    <g opacity={enter(f, st, 14)}>
      <line x1={X0 - 20} x2={X0 + xs.length * (bw + gap)} y1={yOf(v)} y2={yOf(v)} stroke={col} strokeWidth={4} strokeDasharray="12 8" />
      <text x={X0 + xs.length * (bw + gap) + 10} y={yOf(v) + 9} fill={col} fontSize={28} fontWeight={700} fontFamily="Inter">
        {label}
      </text>
    </g>
  );
  const thr = 3 + 3.5 * Math.max(1.4826 * 1, 1);
  return (
    <>
      <Abs x={80} y={128} w={1300} style={{ fontFamily: MONO, fontSize: 46, fontWeight: 800, ...rise(f, 2) }}>
        Ten minutes of ERROR counts
      </Abs>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {s >= 3 && <rect x={X0 - 20} y={yOf(thr)} width={xs.length * (bw + gap) + 20} height={Y0 - yOf(thr)} fill={`${C.cyan}14`} opacity={enter(f, at(t, 3), 14)} />}
        {xs.map((v, i) => {
          const x = X0 + i * (bw + gap);
          const p = Math.min(1, pop(f, 6 + i * 4));
          const out = v > thr && s >= 4;
          const yy = lerp(Y0, yOf(v), p);
          return (
            <g key={i}>
              <rect x={x} y={yy} width={bw} height={Y0 - yy} rx={8} fill={out ? C.red : v > cap ? C.red : C.blue} opacity={out ? 1 : 0.85} />
              {v > cap && <path d={`M${x - 6} ${top + 40} l${bw + 12} -16 M${x - 6} ${top + 56} l${bw + 12} -16`} stroke={C.bg} strokeWidth={8} />}
              <text x={x + bw / 2} y={yy - 14} textAnchor="middle" fill={C.text} fontSize={34} fontWeight={800} fontFamily={MONO} opacity={p}>
                {v}
              </text>
              <text x={x + bw / 2} y={Y0 + 40} textAnchor="middle" fill={C.muted} fontSize={22} fontFamily={MONO}>
                09:{String(30 + i).padStart(2, "0")}
              </text>
            </g>
          );
        })}
        <line x1={X0 - 30} x2={X0 + xs.length * (bw + gap)} y1={Y0} y2={Y0} stroke="#3a4552" strokeWidth={2} />
        {s >= 1 && line(27.4, C.red, "mean 27.4", at(t, 1))}
        {s >= 2 && line(3, C.green, "median 3", at(t, 2))}
        {s >= 3 && line(thr, C.cyan, "threshold 8.2", at(t, 3))}
      </svg>
      {s >= 3 && (
        <Abs x={80} y={200} w={760} style={{ ...card(C.cyan), padding: "16px 24px", fontFamily: MONO, fontSize: 24, lineHeight: 1.5, ...rise(f, at(t, 3)) }}>
          MAD = median |x − 3| = 1<br />
          flag if count ≥ 3 and<br />
          count &gt; 3 + 3.5 × max(1.4826 × 1, 1) = 8.2
        </Abs>
      )}
      {s >= 4 && (
        <Abs x={880} y={200} w={660} style={{ ...card(C.red), padding: "16px 24px", fontFamily: MONO, fontSize: 26, lineHeight: 1.5, ...rise(f, at(t, 4)) }}>
          modified z for 250 = (250 − 3) / 1.48 ≈ 167
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ post-filtering

// One shared HNSW index walked for a small tenant: the 40 candidates belong to
// everybody else, and the filter leaves almost nothing.
export const LLFilter = ({ t }: CP) => {
  const f = t.frame;
  const s = t.step;
  const rnd = (n: number) => {
    const x = Math.sin(n * 91.3458) * 47453.5453;
    return x - Math.floor(x);
  };
  const N = 900;
  const pts = Array.from({ length: N }, (_, i) => ({ x: rnd(i) * 760, y: rnd(i + 5000) * 560, mine: i % 110 === 7 }));
  const q = { x: 380, y: 280 };
  const near = pts
    .map((p, i) => ({ i, d: Math.hypot(p.x - q.x, p.y - q.y) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 40)
    .map((x) => x.i);
  const nearSet = new Set(near);
  const own = Array.from({ length: 60 }, (_, i) => ({ x: rnd(i + 900) * 760, y: rnd(i + 7000) * 560 }));
  const R = Math.hypot(pts[near[39]].x - q.x, pts[near[39]].y - q.y);
  const Box = ({ x, title, children, col }: { x: number; title: string; children: ReactNode; col?: string }) => (
    <Abs x={x} y={250} w={820} h={640} style={{ ...card(col), padding: 0, overflow: "hidden" }}>
      <div style={{ fontFamily: MONO, fontSize: 26, fontWeight: 700, padding: "16px 24px", borderBottom: `1px solid ${C.line}` }}>{title}</div>
      <svg width={820} height={580}>
        <g transform="translate(30,10)">{children}</g>
      </svg>
    </Abs>
  );
  return (
    <>
      <Abs x={80} y={128} w={1300} style={{ fontFamily: MONO, fontSize: 44, fontWeight: 800, ...rise(f, 2) }}>
        Shared index vs a small session
      </Abs>
      <Box x={80} title="shared table · 120,000 vectors · 101 sessions" col={s >= 1 && s < 4 ? C.red : undefined}>
        {pts.map((p, i) => {
          const inN = nearSet.has(i);
          const dim = s >= 2 && !inN;
          const gone = s >= 3 && inN && !p.mine;
          return <circle key={i} cx={p.x} cy={p.y} r={p.mine ? 7 : 4} fill={p.mine ? C.blue : inN && s >= 2 ? C.text : "#3a4552"} opacity={gone ? 0.15 : dim ? 0.35 : 1} />;
        })}
        {s >= 1 && <circle cx={q.x} cy={q.y} r={12} fill={C.cyan} />}
        {s >= 2 && <circle cx={q.x} cy={q.y} r={R * ease(f, at(t, 2), 30)} fill="none" stroke={C.cyan} strokeWidth={3} strokeDasharray="10 8" />}
      </Box>
      <Abs x={80} y={900} w={820} style={{ textAlign: "center", fontSize: 28, color: C.muted }}>
        {s < 2 ? "● session s050: 0.83% of rows" : s < 3 ? "HNSW keeps the 40 nearest, from every session" : "filter session_id = s050 → 0.68 of 10 rows · recall 0.068"}
      </Abs>
      {s >= 4 && (
        <>
          <Box x={1020} title="own table · log_chunks_s_<uuid>" col={C.green}>
            {own.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={7} fill={C.blue} opacity={enter(f, at(t, 4) + (i % 20), 10)} />
            ))}
            <circle cx={q.x} cy={q.y} r={12} fill={C.cyan} />
          </Box>
          <Abs x={1020} y={900} w={820} style={{ textAlign: "center", fontSize: 28, color: C.green, ...rise(f, at(t, 4)) }}>
            only this session's vectors · recall 1.00 · 0.24 ms
          </Abs>
        </>
      )}
    </>
  );
};
