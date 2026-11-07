// Data-driven scenes for the interview-ready lectures: model answers, rapid
// fire drills, corrected beliefs, side-by-side columns, big numbers, message
// sequences and charts. Titles stop at x = 1300 so the term card (top right)
// never covers them.
import { interpolate } from "remotion";
import type { Scene } from "../lib/types.ts";
import type { Clock } from "../lib/timeline.ts";
import { C, MONO, tone } from "../lib/theme.ts";
import { ease, enter, lerp, pop, rise } from "../lib/anim.ts";
import { Abs, card, Chip } from "./ui.tsx";

type Of<K extends Scene["kind"]> = Extract<Scene, { kind: K }>;
type P<K extends Scene["kind"]> = { s: Of<K>; t: Clock };

const at = (t: Clock, i: number) => (i <= 0 ? 4 : (t.beats[i]?.stepStart ?? Infinity));

export const Title = ({ text, f, sub, w = 1220 }: { text: string; f: number; sub?: string; w?: number }) => (
  <Abs x={80} y={118} w={w} style={rise(f, 2)}>
    <div style={{ fontSize: 50, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.15 }}>{text}</div>
    {sub && <div style={{ fontSize: 30, color: C.muted, marginTop: 8 }}>{sub}</div>}
  </Abs>
);

// A ring that empties while the narrator is silent: thinking time.
const ThinkRing = ({ f, from, to, size = 90, color = C.amber }: { f: number; from: number; to: number; size?: number; color?: string }) => {
  const hp = interpolate(f, [from, Math.max(from + 1, to)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const r = size / 2 - 6;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke={C.line} strokeWidth={7} fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={7} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={hp} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </svg>
  );
};

// ------------------------------------------------------------------ say it

export const SayItScene = ({ s, t }: P<"sayit">) => {
  const f = t.frame;
  return (
    <>
      <Abs x={80} y={130} w={1220} style={rise(f, 2)}>
        <Chip color={C.amber}>🎤 SAY IT IN THE INTERVIEW</Chip>
        <div style={{ fontSize: 44, fontWeight: 800, marginTop: 18, lineHeight: 1.22 }}>“{s.q}”</div>
      </Abs>
      <Abs x={80} y={370} w={1760} style={{ ...card(C.green), background: "rgba(23,30,46,0.92)", padding: "26px 40px", display: "flex", flexDirection: "column", gap: 16, opacity: t.step >= 1 ? enter(f, at(t, 1), 12) : 0 }}>
        {s.lines.map((ln, i) => {
          const st = i + 1;
          if (t.step < st) return null;
          const on = t.step === st;
          return (
            <div key={i} style={{ display: "flex", gap: 20, alignItems: "baseline", fontSize: 34, lineHeight: 1.3, color: on ? C.text : C.muted, fontWeight: on ? 700 : 500, ...rise(f, at(t, st), 18) }}>
              <span style={{ color: C.green, fontWeight: 800, fontSize: 28, flexShrink: 0 }}>{i + 1}</span>
              <span>{ln}</span>
            </div>
          );
        })}
      </Abs>
    </>
  );
};

// ------------------------------------------------------------------ drill

export const DrillScene = ({ s, t }: P<"drill">) => {
  const f = t.frame;
  const item = Math.min(s.items.length - 1, Math.floor(t.step / 2));
  const answered = t.step % 2 === 1;
  const qb = t.beats[item * 2];
  const qStart = at(t, item * 2);
  const it = s.items[item];
  const fade = item === s.items.length - 1 ? 1 : 1 - enter(f, at(t, item * 2 + 2) - 8, 8);
  return (
    <>
      <Abs x={80} y={130} w={1220} style={{ display: "flex", alignItems: "center", gap: 20, ...rise(f, 2) }}>
        <Chip color={C.pink}>⚡ RAPID FIRE</Chip>
        <div style={{ fontSize: 30, fontWeight: 700, color: C.muted }}>
          {item + 1} / {s.items.length}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {s.items.map((_, i) => (
            <div key={i} style={{ width: 26, height: 8, borderRadius: 4, background: i < item ? C.pink : i === item ? C.text : C.line }} />
          ))}
        </div>
      </Abs>
      <div style={{ opacity: fade }}>
        <Abs x={160} y={270} w={1600} style={{ display: "flex", gap: 36, alignItems: "flex-start", ...rise(f, qStart, 30) }}>
          <div style={{ fontSize: 64, fontWeight: 900, color: C.pink, lineHeight: 1 }}>Q</div>
          <div style={{ fontSize: it.q.length > 80 ? 46 : 54, fontWeight: 800, lineHeight: 1.22 }}>{it.q}</div>
        </Abs>
        {!answered && qb && f > qb.audioEnd && (
          <Abs x={160} y={560} w={900} style={{ display: "flex", alignItems: "center", gap: 24, opacity: enter(f, qb.audioEnd, 8) }}>
            <ThinkRing f={f} from={qb.audioEnd} to={qb.end} />
            <div style={{ fontSize: 34, fontWeight: 700, color: C.amber }}>answer it out loud first…</div>
          </Abs>
        )}
        {answered && (
          <Abs x={160} y={540} w={1600} style={{ ...card(C.green), padding: "26px 36px", display: "flex", gap: 30, alignItems: "flex-start", ...rise(f, at(t, item * 2 + 1), 24) }}>
            <div style={{ fontSize: 48, fontWeight: 900, color: C.green, lineHeight: 1 }}>A</div>
            <div style={{ fontSize: it.a.length > 150 ? 32 : 36, lineHeight: 1.35, fontWeight: 600 }}>{it.a}</div>
          </Abs>
        )}
      </div>
    </>
  );
};

// ------------------------------------------------------------------ trap

export const TrapScene = ({ s, t }: P<"trap">) => {
  const f = t.frame;
  const strike = ease(f, at(t, 1), 16);
  return (
    <>
      <Abs x={210} y={170} w={1500} style={{ ...rise(f, 2), opacity: (rise(f, 2).opacity as number) * (t.step >= 1 ? 0.7 : 1) }}>
        <Chip color={C.red}>✗ COMMON BELIEF</Chip>
        <div style={{ position: "relative", marginTop: 20 }}>
          <div style={{ fontSize: s.myth.length > 70 ? 46 : 56, fontWeight: 800, lineHeight: 1.2, color: t.step >= 1 ? C.muted : C.text }}>“{s.myth}”</div>
          {t.step >= 1 && <div style={{ position: "absolute", left: 0, top: "50%", height: 7, width: `${strike * 100}%`, background: C.red, borderRadius: 4 }} />}
        </div>
      </Abs>
      {t.step >= 1 && (
        <Abs x={210} y={460} w={1500} style={rise(f, at(t, 1) + 8, 30)}>
          <Chip color={C.green}>✓ CORRECTION</Chip>
          <div style={{ fontSize: s.truth.length > 90 ? 44 : 52, fontWeight: 800, lineHeight: 1.25, marginTop: 20, borderLeft: `10px solid ${C.green}`, paddingLeft: 34 }}>{s.truth}</div>
        </Abs>
      )}
      {s.why && t.step >= 2 && (
        <Abs x={254} y={760} w={1456} style={{ fontSize: 34, color: C.muted, lineHeight: 1.35, ...rise(f, at(t, 2)) }}>
          {s.why}
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ compare

export const CompareScene = ({ s, t }: P<"compare">) => {
  const f = t.frame;
  const n = s.cols.length;
  const gap = 36;
  const w = (1760 - gap * (n - 1)) / n;
  return (
    <>
      <Title text={s.title} f={f} />
      <Abs x={80} y={250} w={1760} style={{ display: "flex", gap, alignItems: "flex-start" }}>
        {s.cols.map((c, i) => {
          const col = tone(c.tone ?? ["blue", "green", "purple", "amber"][i % 4]);
          const st = at(t, i);
          const p = Math.min(1, pop(f, st));
          const active = t.step === i;
          return (
            <div key={i} style={{ width: w, ...card(active ? col : C.line), padding: "26px 30px", opacity: p, transform: `translateY(${(1 - p) * 40}px)` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {c.icon && <div style={{ fontSize: 48 }}>{c.icon}</div>}
                <div style={{ fontSize: 38, fontWeight: 800, color: col, lineHeight: 1.15 }}>{c.title}</div>
              </div>
              {c.items.map((it, j) => (
                <div key={j} style={{ display: "flex", gap: 14, fontSize: n > 2 ? 28 : 31, lineHeight: 1.32, marginTop: 16, ...rise(f, st + 8 + j * 7, 14) }}>
                  <span style={{ color: col, fontWeight: 800 }}>›</span>
                  <span>{it}</span>
                </div>
              ))}
            </div>
          );
        })}
      </Abs>
      {s.footer && t.step >= n && (
        <Abs x={80} y={820} w={1760} style={{ textAlign: "center", ...rise(f, at(t, n)) }}>
          <Chip color={C.amber} style={{ fontSize: 32, padding: "12px 30px" }}>
            {s.footer}
          </Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ numbers

const countUp = (v: string, p: number) => {
  const m = v.match(/^([^\d]*)([\d,]*\.?\d+)(.*)$/);
  if (!m) return v;
  const num = parseFloat(m[2].replace(/,/g, ""));
  const dec = (m[2].split(".")[1] ?? "").length;
  const cur = num * p;
  const txt = m[2].includes(",") ? Math.round(cur).toLocaleString("en-US") : cur.toFixed(dec);
  return m[1] + txt + m[3];
};

export const NumbersScene = ({ s, t }: P<"numbers">) => {
  const f = t.frame;
  const n = s.items.length;
  const gap = 32;
  const w = (1760 - gap * (n - 1)) / n;
  return (
    <>
      <Title text={s.title} f={f} />
      <Abs x={80} y={300} w={1760} style={{ display: "flex", gap, alignItems: "stretch" }}>
        {s.items.map((it, i) => {
          const st = at(t, i);
          const col = tone(it.tone ?? ["blue", "green", "amber", "purple"][i % 4]);
          const p = Math.min(1, pop(f, st));
          const size = Math.min(100, Math.floor((w - 50) / (Math.max(3, it.value.length) * 0.6)));
          return (
            <div key={i} style={{ width: w, ...card(t.step === i ? col : C.line), padding: "34px 28px", textAlign: "center", opacity: p, transform: `scale(${0.85 + 0.15 * p})` }}>
              <div style={{ fontSize: size, fontWeight: 900, color: col, letterSpacing: -1, lineHeight: 1.05, fontVariantNumeric: "tabular-nums" }}>{countUp(it.value, ease(f, st, 36))}</div>
              <div style={{ fontSize: 32, fontWeight: 800, marginTop: 16, lineHeight: 1.2 }}>{it.label}</div>
              {it.sub && <div style={{ fontSize: 25, color: C.muted, marginTop: 10, lineHeight: 1.3 }}>{it.sub}</div>}
            </div>
          );
        })}
      </Abs>
      {s.footer && t.step >= n && (
        <Abs x={80} y={790} w={1760} style={{ textAlign: "center", ...rise(f, at(t, n)) }}>
          <Chip color={C.amber} style={{ fontSize: 32, padding: "12px 30px" }}>
            {s.footer}
          </Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ sequence

export const SeqScene = ({ s, t }: P<"seq">) => {
  const f = t.frame;
  const n = s.actors.length;
  const left = 230;
  const right = 1690;
  const xs = Object.fromEntries(s.actors.map((a, i) => [a.id, n === 1 ? 960 : left + ((right - left) * i) / (n - 1)]));
  const aw = Math.min(300, ((right - left) / Math.max(1, n - 1)) * 0.85);
  const top = 262;
  const rows = s.msgs.length;
  const y0 = 395;
  const rowH = Math.min(78, Math.floor(((s.note ? 815 : 880) - y0) / Math.max(1, rows)));
  // messages that arrive in the same step follow each other
  const delay = s.msgs.map((m, i) => s.msgs.slice(0, i).filter((x) => x.step === m.step).length * 16);
  return (
    <>
      <Title text={s.title} f={f} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {s.actors.map((a) => (
          <line key={a.id} x1={xs[a.id]} y1={top + 120} x2={xs[a.id]} y2={y0 + rows * rowH} stroke={C.line} strokeWidth={3} strokeDasharray="6 10" opacity={enter(f, 6)} />
        ))}
        {s.msgs.map((m, i) => {
          const st = at(t, m.step) + delay[i];
          if (f < st) return null;
          const p = ease(f, st, 18);
          const y = y0 + i * rowH + rowH * 0.62;
          const col = tone(m.tone);
          const x1 = xs[m.from];
          const x2 = xs[m.to];
          if (x1 === x2) {
            return <path key={i} d={`M ${x1} ${y - 20} h 60 v 26 h -50`} stroke={col} strokeWidth={4} fill="none" opacity={p} />;
          }
          const dir = Math.sign(x2 - x1);
          const xe = lerp(x1 + dir * 8, x2 - dir * 8, p);
          return (
            <g key={i} opacity={t.step > m.step + 1 ? 0.55 : 1}>
              <line x1={x1 + dir * 8} y1={y} x2={xe} y2={y} stroke={col} strokeWidth={4} strokeDasharray={m.dash ? "12 9" : undefined} strokeLinecap="round" />
              {p > 0.95 && <polygon points={`${x2 - dir * 8},${y} ${x2 - dir * 26},${y - 10} ${x2 - dir * 26},${y + 10}`} fill={col} />}
            </g>
          );
        })}
      </svg>
      {s.actors.map((a) => (
        <Abs key={a.id} x={xs[a.id] - aw / 2} y={top} w={aw} style={{ ...card(tone(a.tone ?? "muted")), padding: "12px 10px", textAlign: "center", ...rise(f, 4) }}>
          <div style={{ fontSize: 42, lineHeight: 1 }}>{a.icon}</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6, lineHeight: 1.15 }}>{a.name}</div>
        </Abs>
      ))}
      {s.msgs.map((m, i) => {
        const st = at(t, m.step) + delay[i];
        if (f < st) return null;
        const x1 = xs[m.from];
        const x2 = xs[m.to];
        const y = y0 + i * rowH + rowH * 0.62;
        const self = x1 === x2;
        const lw = self ? 520 : Math.abs(x2 - x1) - 40;
        const lx = self ? x1 + 76 : Math.min(x1, x2) + 20;
        const fs = rowH < 60 ? 23 : 25;
        return (
          <Abs key={i} x={lx} y={self ? y - 20 : y - fs * 1.45 - 6} w={lw} style={{ textAlign: self ? "left" : "center", fontFamily: MONO, fontSize: fs, lineHeight: 1.2, color: t.step === m.step ? C.text : C.muted, opacity: enter(f, st + 6, 10), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {m.label}
          </Abs>
        );
      })}
      {s.note && t.step >= s.note.step && (
        <Abs x={80} y={830} w={1760} style={{ textAlign: "center", ...rise(f, at(t, s.note.step)) }}>
          <Chip color={tone(s.note.tone ?? "amber")} style={{ fontSize: 30, padding: "10px 28px" }}>
            {s.note.text}
          </Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ chart

export const ChartScene = ({ s, t }: P<"chart">) => {
  const f = t.frame;
  const box = { x: 230, y: 270, w: 1500, h: 470 };
  const max = s.max ?? Math.max(...s.series.flatMap((x) => x.values)) * 1.1;
  const n = s.labels.length;
  const slot = box.w / n;
  const yOf = (v: number) => box.y + box.h - (v / max) * box.h;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((k) => k * max);
  const fmt = (v: number) => (max >= 10 ? Math.round(v).toLocaleString("en-US") : v.toFixed(1)) + (s.unit ?? "");
  const shown = s.series.filter((x) => t.step >= x.step);
  return (
    <>
      <Title text={s.title} f={f} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: enter(f, 4) }}>
        {ticks.map((v, i) => (
          <g key={i}>
            <line x1={box.x} x2={box.x + box.w} y1={yOf(v)} y2={yOf(v)} stroke={C.line} strokeWidth={i === 0 ? 3 : 1.5} />
            <text x={box.x - 18} y={yOf(v) + 8} fill={C.faint} fontSize={22} textAnchor="end">
              {fmt(v)}
            </text>
          </g>
        ))}
        {s.labels.map((l, i) => (
          <g key={i}>
            <text x={box.x + slot * (i + 0.5)} y={box.y + box.h + 40} fill={C.muted} fontSize={24} fontWeight={600} textAnchor="middle">
              {l}
            </text>
          </g>
        ))}
        {s.type === "bars" &&
          shown.map((ser, k) => {
            const bw = Math.min(110, (slot * 0.7) / s.series.length);
            const col = tone(ser.tone ?? ["blue", "pink", "green", "amber"][k % 4]);
            const si = s.series.indexOf(ser);
            return ser.values.map((v, i) => {
              const p = ease(f, at(t, ser.step) + i * 5, 24);
              const x = box.x + slot * (i + 0.5) - (bw * s.series.length) / 2 + si * bw;
              return <rect key={`${k}-${i}`} x={x + 4} y={yOf(v * p)} width={bw - 8} height={box.y + box.h - yOf(v * p)} rx={6} fill={col} opacity={0.9} />;
            });
          })}
        {s.type === "line" &&
          shown.map((ser, k) => {
            const col = tone(ser.tone ?? ["blue", "pink", "green", "amber"][s.series.indexOf(ser) % 4]);
            const pts = ser.values.map((v, i) => `${box.x + slot * (i + 0.5)},${yOf(v)}`).join(" ");
            const p = ease(f, at(t, ser.step), 40);
            return (
              <g key={k}>
                <polyline points={pts} fill="none" stroke={col} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
                {ser.values.map((v, i) => (i / Math.max(1, n - 1) <= p + 0.01 ? <circle key={i} cx={box.x + slot * (i + 0.5)} cy={yOf(v)} r={9} fill={col} /> : null))}
              </g>
            );
          })}
        {s.xLabel && (
          <text x={box.x + box.w / 2} y={box.y + box.h + 86} fill={C.faint} fontSize={24} textAnchor="middle">
            {s.xLabel}
          </text>
        )}
      </svg>
      <Abs x={box.x} y={196} w={1070} style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
        {shown.map((ser) => {
          const col = tone(ser.tone ?? ["blue", "pink", "green", "amber"][s.series.indexOf(ser) % 4]);
          return (
            <div key={ser.name} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 26, fontWeight: 700, background: "rgba(12,16,24,0.8)", padding: "4px 12px", borderRadius: 10, ...rise(f, at(t, ser.step)) }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: col }} />
              {ser.name}
            </div>
          );
        })}
      </Abs>
      {s.note && t.step >= s.note.step && (
        <Abs x={80} y={840} w={1760} style={{ textAlign: "center", ...rise(f, at(t, s.note.step)) }}>
          <Chip color={tone(s.note.tone ?? "amber")} style={{ fontSize: 30, padding: "10px 28px" }}>
            {s.note.text}
          </Chip>
        </Abs>
      )}
    </>
  );
};
