// The Python and FastAPI lectures (PY-01, FA-01): five pictures shared by
// both. Names and the objects they point to (aliasing, copies, refcounts);
// timeline lanes (sequential vs concurrent calls, the GIL, a blocked event
// loop); a list against a generator racing for memory; a decorator onion; and
// a request pipeline with a packet moving through it.
import { C, MONO, tone } from "../lib/theme.ts";
import { ease, enter, lerp, rise } from "../lib/anim.ts";
import { Abs, card, Chip } from "./ui.tsx";
import { at } from "./custom3.tsx";
import type { CP } from "./secui.tsx";

const Title = ({ text, f, sub }: { text: string; f: number; sub?: string }) => (
  <Abs x={80} y={124} w={1240} style={rise(f, 2)}>
    <div style={{ fontFamily: C.head, fontSize: text.length > 44 ? 40 : 46, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.15 }}>{text}</div>
    {sub && <div style={{ fontSize: 26, color: C.muted, marginTop: 6 }}>{sub}</div>}
  </Abs>
);

const Note = ({ text, f, start, y = 820, color }: { text: string; f: number; start: number; y?: number; color?: string }) => (
  <Abs x={80} y={y} w={1760} style={{ display: "flex", justifyContent: "center", ...rise(f, start, 16) }}>
    <div style={{ ...card(color ?? C.amber), padding: "16px 34px", fontSize: text.length > 90 ? 28 : 32, fontWeight: 700, lineHeight: 1.3, maxWidth: 1700, textAlign: "center" }}>{text}</div>
  </Abs>
);

// ------------------------------------------------------------------ names → objects

// Name tags on the left point at objects on the right; each step is a new
// state of the program. A tag pointing nowhere ("to" empty) is drawn crossed.
type NState = {
  tags: { name: string; to: string; tone?: string }[];
  objs: { id: string; text: string; tone?: string; sub?: string; gone?: boolean }[];
  note?: string;
};
export const PyNames = ({ t, props }: CP) => {
  const f = t.frame;
  const p = props as { title: string; sub?: string; steps: NState[] };
  const s = p.steps[Math.min(t.step, p.steps.length - 1)];
  const since = at(t, Math.min(t.step, p.steps.length - 1));
  const top = 290;
  const room = 500;
  const th = Math.min(96, Math.floor(room / Math.max(1, s.tags.length)));
  const oh = Math.min(150, Math.floor(room / Math.max(1, s.objs.length)));
  const tagY = (i: number) => top + i * th + (room - th * s.tags.length) / 2;
  const objY = (i: number) => top + i * oh + (room - oh * s.objs.length) / 2;
  const tagX = 150;
  const tagW = 380;
  const objX = 860;
  const objW = 900;
  return (
    <>
      <Title text={p.title} f={f} sub={p.sub} />
      <Abs x={tagX} y={240} w={tagW} style={{ fontSize: 24, fontWeight: 800, color: C.muted, letterSpacing: 2, ...rise(f, 4) }}>
        NAMES
      </Abs>
      <Abs x={objX} y={240} w={objW} style={{ fontSize: 24, fontWeight: 800, color: C.muted, letterSpacing: 2, ...rise(f, 4) }}>
        OBJECTS IN MEMORY
      </Abs>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {s.tags.map((tg, i) => {
          const j = s.objs.findIndex((o) => o.id === tg.to);
          if (j < 0) return null;
          const x1 = tagX + tagW;
          const y1 = tagY(i) + (th - 14) / 2;
          const x2 = objX - 8;
          const y2 = objY(j) + (oh - 24) / 2;
          const pr = ease(f, since + 4 + i * 3, 18);
          const col = tone(tg.tone ?? "blue");
          const a = Math.atan2(y2 - y1, x2 - x1);
          return (
            <g key={`${tg.name}-${i}`}>
              <line x1={x1} y1={y1} x2={lerp(x1, x2, pr)} y2={lerp(y1, y2, pr)} stroke={col} strokeWidth={4} strokeLinecap="round" />
              {pr > 0.95 && <polygon points={`${x2},${y2} ${x2 - 18 * Math.cos(a - 0.42)},${y2 - 18 * Math.sin(a - 0.42)} ${x2 - 18 * Math.cos(a + 0.42)},${y2 - 18 * Math.sin(a + 0.42)}`} fill={col} />}
            </g>
          );
        })}
      </svg>
      {s.tags.map((tg, i) => (
        <Abs key={`t${i}`} x={tagX} y={tagY(i)} w={tagW} h={th - 14} style={{ ...card(tone(tg.tone ?? "blue")), display: "flex", alignItems: "center", padding: "0 22px", boxSizing: "border-box", ...rise(f, since + i * 3, 14) }}>
          <span style={{ fontFamily: MONO, fontSize: tg.name.length > 18 ? 22 : 27, fontWeight: 700, opacity: tg.to ? 1 : 0.5, textDecoration: tg.to ? undefined : "line-through" }}>{tg.name}</span>
        </Abs>
      ))}
      {s.objs.map((o, i) => (
        <Abs key={`o${i}`} x={objX} y={objY(i)} w={objW} h={oh - 24} style={{ ...card(o.gone ? C.red : o.tone ? tone(o.tone) : undefined), display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 28px", boxSizing: "border-box", opacity: o.gone ? 0.45 : 1, ...rise(f, since + 2 + i * 3, 14) }}>
          <div style={{ fontFamily: MONO, fontSize: o.text.length > 44 ? 23 : o.text.length > 30 ? 26 : 30, fontWeight: 600, lineHeight: 1.25, textDecoration: o.gone ? "line-through" : undefined }}>{o.text}</div>
          {o.sub && <div style={{ fontSize: 22, color: C.muted, marginTop: 6 }}>{o.sub}</div>}
        </Abs>
      ))}
      {s.note && <Note text={s.note} f={f} start={since + 16} />}
    </>
  );
};

// ------------------------------------------------------------------ timeline lanes

// One lane per task or worker; bars are time spans (run = doing work, wait =
// waiting on I/O, block = stuck, frozen = could run but nobody lets it). Each
// lane appears at its step and its bars grow from left to right.
type Bar = { s: number; e: number; kind?: "run" | "wait" | "block" | "frozen"; text?: string };
export const PyLanes = ({ t, props }: CP) => {
  const f = t.frame;
  const p = props as {
    title: string;
    sub?: string;
    max: number;
    unit?: string;
    rows: { label: string; step: number; bars: Bar[]; done?: string }[];
    note?: { step: number; text: string; tone?: string };
    legend?: boolean;
  };
  const x0 = 470;
  const w = 1300;
  const top = 290;
  const n = p.rows.length;
  const rh = Math.min(96, Math.floor(460 / n));
  const X = (v: number) => x0 + (v / p.max) * w;
  const colour = (k?: string) => (k === "wait" ? C.line : k === "block" ? C.red : k === "frozen" ? C.card2 : C.blue);
  const ticks = Array.from({ length: Math.floor(p.max) + 1 }, (_, i) => i).filter((i) => p.max <= 12 || i % Math.ceil(p.max / 10) === 0);
  const axisY = top + n * rh + 6;
  return (
    <>
      <Title text={p.title} f={f} sub={p.sub} />
      {ticks.map((v) => (
        <Abs key={v} x={X(v) - 40} y={axisY} w={80} style={{ textAlign: "center", fontSize: 22, color: C.faint, fontFamily: MONO, opacity: enter(f, 6) }}>
          {v}
          {v === ticks[ticks.length - 1] ? ` ${p.unit ?? "s"}` : ""}
        </Abs>
      ))}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: enter(f, 4) }}>
        {ticks.map((v) => (
          <line key={v} x1={X(v)} y1={top - 10} x2={X(v)} y2={axisY} stroke={C.line} strokeWidth={1.5} strokeDasharray="4 8" />
        ))}
      </svg>
      {p.rows.map((r, i) => {
        if (t.step < r.step) return null;
        const st = at(t, r.step);
        const y = top + i * rh;
        const end = Math.max(...r.bars.map((b) => b.e));
        const grow = ease(f, st + 4, Math.max(30, Math.min(70, end * 14)));
        const shown = grow * end;
        return (
          <div key={i}>
            <Abs x={80} y={y} w={370} h={rh - 18} style={{ display: "flex", alignItems: "center", fontSize: r.label.length > 22 ? 23 : 27, fontWeight: 700, ...rise(f, st, 12) }}>
              {r.label}
            </Abs>
            {r.bars.map((b, k) => {
              if (shown <= b.s) return null;
              const e = Math.min(b.e, shown);
              const col = colour(b.kind);
              return (
                <Abs
                  key={k}
                  x={X(b.s)}
                  y={y}
                  w={Math.max(4, X(e) - X(b.s) - 3)}
                  h={rh - 18}
                  style={{
                    borderRadius: 10,
                    background: b.kind === "wait" ? `repeating-linear-gradient(135deg, ${C.card2}, ${C.card2} 10px, ${C.line} 10px, ${C.line} 20px)` : b.kind === "frozen" ? C.card2 : col,
                    border: `2px solid ${b.kind === "frozen" ? C.red : col}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    boxSizing: "border-box",
                  }}
                >
                  {b.text && e === b.e && (
                    <span style={{ fontSize: 21, fontWeight: 800, color: b.kind === "run" || !b.kind || b.kind === "block" ? C.bg : C.muted, whiteSpace: "nowrap" }}>{b.text}</span>
                  )}
                </Abs>
              );
            })}
            {r.done && grow > 0.98 && (
              <Abs x={Math.min(X(end) + 14, 1700)} y={y} h={rh - 18} style={{ display: "flex", alignItems: "center", fontSize: 24, fontWeight: 800, color: C.green, whiteSpace: "nowrap", ...rise(f, st + 40, 8) }}>
                {r.done}
              </Abs>
            )}
          </div>
        );
      })}
      {p.legend !== false && (
        <Abs x={x0} y={axisY + 46} w={1300} style={{ display: "flex", gap: 34, fontSize: 22, color: C.muted, opacity: enter(f, 10) }}>
          <span><span style={{ display: "inline-block", width: 26, height: 16, borderRadius: 4, background: C.blue, marginRight: 10 }} />working</span>
          <span><span style={{ display: "inline-block", width: 26, height: 16, borderRadius: 4, background: `repeating-linear-gradient(135deg, ${C.card2}, ${C.card2} 4px, ${C.line} 4px, ${C.line} 8px)`, border: `1px solid ${C.line}`, marginRight: 10 }} />waiting on I/O</span>
          <span><span style={{ display: "inline-block", width: 26, height: 16, borderRadius: 4, background: C.red, marginRight: 10 }} />blocking</span>
          <span><span style={{ display: "inline-block", width: 26, height: 16, borderRadius: 4, background: C.card2, border: `2px solid ${C.red}`, marginRight: 10 }} />stuck behind it</span>
        </Abs>
      )}
      {p.note && t.step >= p.note.step && <Note text={p.note.text} f={f} start={at(t, p.note.step) + 6} y={axisY + 110} color={tone(p.note.tone ?? "amber")} />}
    </>
  );
};

// ------------------------------------------------------------------ list vs generator

// Two machines doing the same job over n items. Step 1: the list reads them
// all before the first is used (memory climbs). Step 2: the generator hands
// over one at a time (memory stays flat). Step 3: the footer.
export const PyMem = ({ t, props }: CP) => {
  const f = t.frame;
  const p = props as { title: string; sub?: string; n: string; left: string; right: string; leftCode: string; rightCode: string; leftMem: string; rightMem: string; note?: string };
  const boxes = 24;
  const panel = (x: number, label: string, code: string, col: string, i: number) => (
    <Abs x={x} y={250} w={840} style={{ ...card(col), padding: "22px 28px", ...rise(f, 4 + i * 6) }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: col }}>{label}</div>
      <div style={{ fontFamily: MONO, fontSize: 24, marginTop: 10, color: C.text, whiteSpace: "pre" }}>{code}</div>
    </Abs>
  );
  const lp = t.step >= 1 ? ease(f, at(t, 1) + 6, Math.max(40, t.len(1) * 0.7)) : 0;
  const rp = t.step >= 2 ? ease(f, at(t, 2) + 6, Math.max(40, t.len(2) * 0.8)) : 0;
  const meter = (x: number, v: number, label: string, col: string) => (
    <Abs x={x} y={750} w={840}>
      <div style={{ fontSize: 22, color: C.muted, marginBottom: 8 }}>memory in use</div>
      <div style={{ height: 26, borderRadius: 13, background: C.card2, border: `2px solid ${C.line}`, overflow: "hidden" }}>
        <div style={{ width: `${Math.max(2, v * 100)}%`, height: "100%", background: col }} />
      </div>
      <div style={{ fontFamily: MONO, fontSize: 24, marginTop: 8, color: col, fontWeight: 700 }}>{label}</div>
    </Abs>
  );
  const shown = Math.round(lp * boxes);
  const cur = Math.min(boxes - 1, Math.floor(rp * boxes));
  const local = (rp * boxes) % 1;
  return (
    <>
      <Title text={p.title} f={f} sub={p.sub} />
      {panel(80, p.left, p.leftCode, C.red, 0)}
      {panel(1000, p.right, p.rightCode, C.green, 1)}
      {/* the list: every item piles up before work starts */}
      <Abs x={80} y={440} w={840} h={280}>
        {Array.from({ length: shown }, (_, k) => (
          <div key={k} style={{ position: "absolute", left: (k % 8) * 104, top: 190 - Math.floor(k / 8) * 92, width: 92, height: 80, borderRadius: 12, background: `${C.red}33`, border: `2px solid ${C.red}`, fontFamily: MONO, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted }}>
            #{k + 1}
          </div>
        ))}
      </Abs>
      {/* the generator: one item on the belt at a time */}
      <Abs x={1000} y={560} w={840} h={150}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 96, height: 10, borderRadius: 5, background: C.line }} />
        {t.step >= 2 && rp < 1 && (
          <div style={{ position: "absolute", left: lerp(0, 740, local), top: 4, width: 100, height: 84, borderRadius: 12, background: `${C.green}33`, border: `2px solid ${C.green}`, fontFamily: MONO, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", color: C.text }}>
            #{cur + 1}
          </div>
        )}
        {t.step >= 2 && (
          <div style={{ position: "absolute", right: 0, top: -50, fontFamily: MONO, fontSize: 22, color: C.green }}>
            {rp >= 1 ? "all done" : `processed ${cur} …`}
          </div>
        )}
      </Abs>
      {t.step >= 1 && meter(80, lp, lp >= 1 ? p.leftMem : "loading…", C.red)}
      {t.step >= 2 && meter(1000, 0.04, p.rightMem, C.green)}
      {p.note && t.step >= 3 && <Note text={p.note} f={f} start={at(t, 3)} y={852} />}
    </>
  );
};

// ------------------------------------------------------------------ decorator onion

// The function in the middle; each step wraps one more layer around it (the
// first layer listed is the innermost, the one written nearest to def). The
// step after the last layer sends a call in through every layer and back.
export const PyOnion = ({ t, props }: CP) => {
  const f = t.frame;
  const p = props as { title: string; sub?: string; core: string; layers: { name: string; does: string; tone?: string }[]; call?: string; back?: string };
  const L = p.layers.length;
  const cx = 560;
  const cy = 540;
  const coreW = 320;
  const coreH = 110;
  const stepW = 150;
  const stepH = 104;
  const callStep = L + 1;
  const cp = t.step >= callStep ? ease(f, at(t, callStep) + 6, Math.max(60, t.len(callStep) * 0.8)) : 0;
  // the call goes in (0 → 0.5) and the result comes out (0.5 → 1)
  const depth = cp < 0.5 ? cp * 2 : (1 - cp) * 2;
  const reached = Math.round(depth * L); // how many layers deep the call is
  return (
    <>
      <Title text={p.title} f={f} sub={p.sub} />
      {p.layers
        .map((ly, i) => ({ ly, i }))
        .reverse()
        .map(({ ly, i }) => {
          if (t.step < i + 1) return null;
          const k = i + 1;
          const w = coreW + k * stepW;
          const h = coreH + k * stepH;
          const col = tone(ly.tone ?? "blue");
          const lit = cp > 0 && reached >= L - i;
          return (
            <Abs key={i} x={cx - w / 2} y={cy - h / 2} w={w} h={h} style={{ ...card(col), background: lit ? `${col}22` : C.card, opacity: enter(f, at(t, k), 14), transform: `scale(${lerp(1.06, 1, enter(f, at(t, k), 16))})` }}>
              <div style={{ position: "absolute", left: 18, top: 10, fontFamily: MONO, fontSize: 24, fontWeight: 800, color: col }}>@{ly.name}</div>
            </Abs>
          );
        })}
      <Abs x={cx - coreW / 2} y={cy - coreH / 2} w={coreW} h={coreH} style={{ ...card(C.green), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 28, fontWeight: 800, background: cp > 0 && reached >= L ? `${C.green}33` : C.card, ...rise(f, 4) }}>
        {p.core}
      </Abs>
      <Abs x={1120} y={260} w={720}>
        {p.layers.map((ly, i) => {
          if (t.step < i + 1) return null;
          const col = tone(ly.tone ?? "blue");
          return (
            <div key={i} style={{ ...card(t.step === i + 1 ? col : undefined), padding: "16px 24px", marginBottom: 16, ...rise(f, at(t, i + 1) + 6, 14) }}>
              <div style={{ fontFamily: MONO, fontSize: 26, fontWeight: 800, color: col }}>@{ly.name}</div>
              <div style={{ fontSize: 25, color: C.text, marginTop: 4, lineHeight: 1.3 }}>{ly.does}</div>
            </div>
          );
        })}
      </Abs>
      {t.step >= callStep && (
        <>
          <Abs x={80} y={860} w={1000} style={{ fontFamily: MONO, fontSize: 26, color: cp < 0.5 ? C.amber : C.green, fontWeight: 700, ...rise(f, at(t, callStep), 10) }}>
            {cp < 0.5 ? p.call ?? "call goes in →" : p.back ?? "← result comes back out"}
          </Abs>
          <div style={{ position: "absolute", left: cx - 18 + lerp(-(coreW + L * stepW) / 2 - 40, 0, depth), top: cy - 18, width: 36, height: 36, borderRadius: 18, background: cp < 0.5 ? C.amber : C.green, boxShadow: `0 0 26px ${cp < 0.5 ? C.amber : C.green}` }} />
        </>
      )}
    </>
  );
};

// ------------------------------------------------------------------ request pipeline

// Stages in a row and a packet travelling through them; beat i lights
// steps[i].at (a stage index, or several) and captions it. `back` sends the
// packet right to left (the response on its way out).
export const PyPipe = ({ t, props }: CP) => {
  const f = t.frame;
  const p = props as {
    title: string;
    sub?: string;
    stages: { name: string; icon: string; sub?: string; tone?: string }[];
    steps: { at: number | number[]; text: string; tone?: string; back?: boolean; fail?: boolean }[];
  };
  const n = p.stages.length;
  const gap = 34;
  const bw = Math.min(340, Math.floor((1760 - gap * (n - 1)) / n));
  const x0 = 80 + (1760 - (bw * n + gap * (n - 1))) / 2;
  const y = 320;
  const bh = 210;
  const X = (i: number) => x0 + i * (bw + gap);
  const si = Math.min(t.step, p.steps.length - 1);
  const st = p.steps[si];
  const lit = Array.isArray(st.at) ? st.at : [st.at];
  const prev = si > 0 ? p.steps[si - 1] : st;
  const pa = Array.isArray(prev.at) ? prev.at[prev.at.length - 1] : prev.at;
  const ca = lit[lit.length - 1];
  const k = ease(f, at(t, si) + 2, 22);
  const px = lerp(X(pa) + bw / 2, X(ca) + bw / 2, si === 0 ? 1 : k);
  const pcol = st.fail ? C.red : st.back ? C.green : C.amber;
  return (
    <>
      <Title text={p.title} f={f} sub={p.sub} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: enter(f, 6) }}>
        {p.stages.slice(0, -1).map((_, i) => (
          <g key={i}>
            <line x1={X(i) + bw + 4} y1={y + bh / 2} x2={X(i + 1) - 6} y2={y + bh / 2} stroke={C.line} strokeWidth={4} />
            <polygon points={`${X(i + 1) - 4},${y + bh / 2} ${X(i + 1) - 16},${y + bh / 2 - 8} ${X(i + 1) - 16},${y + bh / 2 + 8}`} fill={C.line} />
          </g>
        ))}
      </svg>
      {p.stages.map((s, i) => {
        const on = lit.includes(i);
        const col = on ? (st.fail ? C.red : tone(s.tone ?? st.tone ?? "blue")) : undefined;
        return (
          <Abs key={i} x={X(i)} y={y} w={bw} h={bh} style={{ ...card(col), background: on ? `${col}1c` : C.card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 12px", boxSizing: "border-box", opacity: on || t.step === 0 ? 1 : 0.6, ...rise(f, 4 + i * 4, 16) }}>
            <div style={{ fontSize: 56 }}>{s.icon}</div>
            <div style={{ fontSize: s.name.length > 16 ? 24 : 29, fontWeight: 800, marginTop: 6, lineHeight: 1.2 }}>{s.name}</div>
            {s.sub && <div style={{ fontSize: 20, color: C.muted, marginTop: 6, lineHeight: 1.25 }}>{s.sub}</div>}
          </Abs>
        );
      })}
      <div style={{ position: "absolute", left: px - 18, top: y - 52, width: 36, height: 36, borderRadius: 18, background: pcol, boxShadow: `0 0 24px ${pcol}`, opacity: enter(f, 8) }} />
      <Abs key={si} x={160} y={610} w={1600} style={{ ...card(pcol), padding: "24px 36px", fontSize: st.text.length > 120 ? 30 : 34, fontWeight: 600, lineHeight: 1.38, ...rise(f, at(t, si) + 4, 16) }}>
        {st.text}
      </Abs>
    </>
  );
};

// ------------------------------------------------------------------ chips row (topic map)

// The lecture's topics as chips; the current one lit. Used on section cards'
// companion "where we are" scenes.
export const PyMap = ({ t, props }: CP) => {
  const f = t.frame;
  const p = props as { title: string; items: string[]; current?: number };
  return (
    <>
      <Title text={p.title} f={f} />
      <Abs x={120} y={270} w={1680} style={{ display: "flex", flexWrap: "wrap", gap: 18 }}>
        {p.items.map((it, i) => (
          <div key={i} style={{ opacity: enter(f, 6 + i * 4, 12) }}>
            <Chip color={i === p.current ? C.amber : C.blue} style={{ fontSize: 28, padding: "12px 24px" }}>
              {i + 1} · {it}
            </Chip>
          </div>
        ))}
      </Abs>
    </>
  );
};
