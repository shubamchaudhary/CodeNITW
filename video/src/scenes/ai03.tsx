// Chapter 3 (Search fast, search well), told with a general example: a
// support assistant searching 10 million chunks for 500 customer workspaces.
import { C, MONO, PALETTE } from "../lib/theme.ts";
import { ease, enter, pop, rise } from "../lib/anim.ts";
import { Abs, card, Chip } from "./ui.tsx";
import { at, rnd } from "./custom3.tsx";
import { Svg, type CP } from "./secui.tsx";

// ------------------------------------------------------------------ hook

export const A3Hook = ({ t }: CP) => {
  const f = t.frame;
  const items: [string, string, string][] = [
    ["🐢", "2.4 seconds per search", "at 10 million chunks"],
    ["🫥", "workspace “acme”: no results", "its documents exist"],
    ["🔍", "“ERR_TOKEN_EXPIRED” finds nothing useful", "the runbook names it exactly"],
    ["4️⃣", "the right answer ranks 4th", "the model trusts the first ones"],
  ];
  return (
    <>
      <Abs x={80} y={170} w={1220} style={{ fontSize: 44, fontWeight: 800, ...rise(f, 2) }}>
        Version 1 shipped. Then it grew.
      </Abs>
      <Abs x={80} y={280} w={1760} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26 }}>
        {items.map(([icon, a, b], i) => {
          const st = at(t, i);
          if (t.step < i) return <div key={i} />;
          const p = Math.min(1, pop(f, st));
          return (
            <div key={i} style={{ ...card(t.step === i ? C.red : C.line), padding: "24px 30px", display: "flex", gap: 24, alignItems: "center", opacity: p, transform: `scale(${0.85 + 0.15 * p})` }}>
              <div style={{ fontSize: 64 }}>{icon}</div>
              <div>
                <div style={{ fontSize: 34, fontWeight: 800 }}>{a}</div>
                <div style={{ fontSize: 26, color: C.muted, marginTop: 4 }}>{b}</div>
              </div>
            </div>
          );
        })}
      </Abs>
      {t.step >= 4 && (
        <Abs x={80} y={720} w={1760} style={{ textAlign: "center", ...rise(f, at(t, 4)) }}>
          <Chip color={C.amber} style={{ fontSize: 34, padding: "12px 30px" }}>
            four bugs · four ideas every retrieval interview probes
          </Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ brute force

export const A3Brute = ({ t }: CP) => {
  const f = t.frame;
  const cols = 60;
  const rows = 22;
  const scan = t.step === 1 ? ease(f, at(t, 1), 120) : t.step > 1 ? 1 : 0;
  const ann = t.step >= 2;
  const cx = 18;
  const cy = 9;
  return (
    <>
      <Abs x={80} y={180} w={1220} style={{ fontSize: 34, fontWeight: 800, ...rise(f, 2) }}>
        one dot = 1,000 stored vectors · <span style={{ color: C.blue }}>10 million</span> in all
      </Abs>
      <Svg>
        {Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) => {
            const i = r * cols + c;
            const done = i / (rows * cols) < scan;
            const near = Math.hypot(c - cx, (r - cy) * 1.6) < 6;
            const fill = ann ? (near ? C.green : C.line) : done ? C.amber : C.line;
            return <circle key={i} cx={120 + c * 28} cy={290 + r * 24} r={7} fill={fill} opacity={ann && !near ? 0.35 : 0.9} />;
          }),
        )}
        {t.step >= 2 && <circle cx={120 + cx * 28} cy={290 + cy * 24} r={12} fill={C.blue} stroke="#fff" strokeWidth={3} />}
      </Svg>
      {t.step === 1 && (
        <Abs x={1180} y={830} w={660} style={{ textAlign: "right", fontFamily: MONO, fontSize: 30, color: C.amber, fontWeight: 700 }}>
          {Math.round(scan * 10_000_000).toLocaleString("en-US")} compared
        </Abs>
      )}
      {t.step === 0 && (
        <Abs x={1240} y={830} w={600} style={{ textAlign: "right", fontSize: 28, color: C.muted, fontWeight: 700, opacity: enter(f, 30) }}>
          10M × 1,024 ≈ 10 billion multiplications
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={1180} y={830} w={660} style={{ textAlign: "right", fontSize: 30, color: C.green, fontWeight: 800, ...rise(f, at(t, 2)) }}>
          look only nearby: milliseconds
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={1120} y={290} w={720} style={{ ...card(C.green), padding: "22px 28px", ...rise(f, at(t, 3)) }}>
          <div style={{ fontSize: 30, fontWeight: 800 }}>recall@10</div>
          <div style={{ fontSize: 26, color: C.muted, marginTop: 6 }}>of the true 10 nearest, how many came back?</div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} style={{ width: 44, height: 44, borderRadius: 10, background: i < 9 ? C.green : C.red, opacity: enter(f, at(t, 3) + 10 + i * 4) }} />
            ))}
          </div>
          <div style={{ fontSize: 34, fontWeight: 900, color: C.green, marginTop: 10 }}>0.9</div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ skip list

export const A3Skip = ({ t }: CP) => {
  const f = t.frame;
  const vals = [3, 8, 12, 19, 24, 31, 38, 42, 47, 55, 61, 70];
  const lanes = [
    [0, 4, 8, 11],
    [0, 2, 4, 6, 8, 10, 11],
    vals.map((_, i) => i),
  ];
  const X = (i: number) => 140 + i * 140;
  const Y = [330, 480, 630];
  // path to 47: top 3→24→47, then stop
  const path: [number, number][] = [
    [0, 0],
    [0, 4],
    [0, 8],
  ];
  const hop = t.step >= 1 ? Math.floor(ease(f, at(t, 1) + 10, 50) * path.length) : 0;
  return (
    <>
      <Abs x={80} y={170} w={1220} style={{ fontSize: 36, fontWeight: 800, ...rise(f, 2) }}>
        Find <span style={{ color: C.amber }}>47</span> in a sorted list
      </Abs>
      <Svg>
        {lanes.map((lane, l) =>
          lane.slice(0, -1).map((a, k) => <line key={`${l}-${k}`} x1={X(a) + 34} y1={Y[l]} x2={X(lane[k + 1]) - 34} y2={Y[l]} stroke={l === 0 ? C.amber : l === 1 ? C.purple : C.line} strokeWidth={4} opacity={enter(f, 6 + l * 8)} />),
        )}
        {t.step >= 1 &&
          path.slice(0, hop).map(([l, i], k) => (k === 0 ? null : <line key={k} x1={X(path[k - 1][1])} y1={Y[l] - 46} x2={X(i)} y2={Y[l] - 46} stroke={C.green} strokeWidth={6} strokeDasharray="12 8" />))}
      </Svg>
      {lanes.map((lane, l) =>
        lane.map((i) => {
          const hit = t.step >= 1 && vals[i] === 47 && hop >= path.length;
          return (
            <Abs key={`${l}-${i}`} x={X(i) - 32} y={Y[l] - 28} w={64} h={56} style={{ ...card(hit ? C.green : l === 0 ? C.amber : l === 1 ? C.purple : C.line), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 26, fontWeight: 800, opacity: enter(f, 6 + l * 8) }}>
              {vals[i]}
            </Abs>
          );
        }),
      )}
      {["express lane", "faster lane", "every item"].map((n, l) => (
        <Abs key={n} x={1790} y={Y[l] - 18} w={110} style={{ fontSize: 20, color: C.muted, fontWeight: 700, opacity: enter(f, 10 + l * 8) }}>
          {n}
        </Abs>
      ))}
      {t.step >= 2 && (
        <Abs x={140} y={730} w={1640} style={{ ...card(C.green), padding: "18px 26px", fontSize: 30, fontWeight: 700, ...rise(f, at(t, 2)) }}>
          3 hops instead of 9 · ride the express lane, drop down when you'd overshoot. HNSW does this with a graph of vectors.
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ HNSW

const NODES: [number, number, number][] = Array.from({ length: 34 }, (_, i) => [0.05 + rnd(i + 1) * 0.9, 0.1 + rnd(i + 50) * 0.8, i % 9 === 0 ? 2 : i % 3 === 0 ? 1 : 0]);

export const A3Hnsw = ({ t }: CP) => {
  const f = t.frame;
  const layers = [2, 1, 0];
  const LY = [270, 470, 670];
  const W = 1000;
  const X0 = 120;
  const pt = (n: number, l: number) => ({ x: X0 + NODES[n][0] * W + (2 - l) * 30, y: LY[2 - l] + NODES[n][1] * 150 - 20 });
  const target = { x: 0.78, y: 0.6 };
  const near = (l: number) => NODES.map((_, i) => i).filter((i) => NODES[i][2] >= l);
  const best = (l: number) => near(l).sort((a, b) => Math.hypot(NODES[a][0] - target.x, NODES[a][1] - target.y) - Math.hypot(NODES[b][0] - target.x, NODES[b][1] - target.y));
  const walk = [best(2).slice(0, 2).reverse(), best(1).slice(0, 3).reverse(), best(0).slice(0, 4).reverse()];
  const lit = t.step >= 2 ? Math.min(3, Math.floor(ease(f, at(t, 2) + 6, 70) * 3.99)) : 0;
  return (
    <>
      <Svg>
        {layers.map((l, k) => {
          const ids = near(l);
          return (
            <g key={l} opacity={enter(f, 6 + k * 10)}>
              <polygon points={`${X0 - 20 + (2 - l) * 30},${LY[k] - 40} ${X0 + W + 40 + (2 - l) * 30},${LY[k] - 40} ${X0 + W + 10 + (2 - l) * 30},${LY[k] + 150} ${X0 - 50 + (2 - l) * 30},${LY[k] + 150}`} fill={C.card} stroke={C.line} strokeWidth={2} opacity={0.8} />
              {ids.map((a) =>
                ids
                  .filter((b) => b > a)
                  .sort((b1, b2) => Math.hypot(NODES[a][0] - NODES[b1][0], NODES[a][1] - NODES[b1][1]) - Math.hypot(NODES[a][0] - NODES[b2][0], NODES[a][1] - NODES[b2][1]))
                  .slice(0, 2)
                  .map((b) => <line key={`${a}-${b}`} x1={pt(a, l).x} y1={pt(a, l).y} x2={pt(b, l).x} y2={pt(b, l).y} stroke={C.faint} strokeWidth={2} />),
              )}
              {ids.map((a) => (
                <circle key={a} cx={pt(a, l).x} cy={pt(a, l).y} r={l === 2 ? 11 : 8} fill={l === 2 ? C.amber : l === 1 ? C.purple : C.blue} />
              ))}
            </g>
          );
        })}
        {t.step >= 2 &&
          walk.slice(0, lit).map((w, k) => {
            const l = 2 - k;
            return (
              <g key={k}>
                {w.slice(1).map((n, j) => (
                  <line key={j} x1={pt(w[j], l).x} y1={pt(w[j], l).y} x2={pt(n, l).x} y2={pt(n, l).y} stroke={C.green} strokeWidth={6} />
                ))}
                {k < 2 && <line x1={pt(w[w.length - 1], l).x} y1={pt(w[w.length - 1], l).y} x2={pt(w[w.length - 1], l - 1).x} y2={pt(w[w.length - 1], l - 1).y} stroke={C.green} strokeWidth={3} strokeDasharray="8 8" />}
              </g>
            );
          })}
        {t.step >= 1 && <circle cx={X0 + target.x * W} cy={LY[2] + target.y * 150 - 20} r={16} fill="none" stroke={C.pink} strokeWidth={5} opacity={enter(f, at(t, 1))} />}
      </Svg>
      {["top layer: few points, long links", "middle: more points", "bottom: every chunk, short links"].map((s, k) => (
        <Abs key={s} x={1220} y={LY[k] + 30} w={620} style={{ fontSize: 28, fontWeight: 700, color: [C.amber, C.purple, C.blue][k], opacity: enter(f, 10 + k * 10) }}>
          {s}
        </Abs>
      ))}
      {t.step >= 3 && (
        <Abs x={1220} y={790} w={620} style={{ ...card(C.green), padding: "14px 20px", fontSize: 26, fontWeight: 700, ...rise(f, at(t, 3)) }}>
          bottom layer: keep the best <span style={{ fontFamily: MONO, color: C.green }}>ef_search</span> candidates, return the top 10
        </Abs>
      )}
      {t.step >= 4 && (
        <Abs x={120} y={845} w={1080} style={{ fontSize: 26, color: C.amber, fontWeight: 700, ...rise(f, at(t, 4)) }}>
          approximate: a greedy walk can stop at a local best, like a driver in a nearby dead end
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ filters

export const A3Filter = ({ t }: CP) => {
  const f = t.frame;
  const cands = Array.from({ length: 40 }, (_, i) => i);
  const acme = (i: number) => i === 23;
  const filt = t.step >= 1 ? ease(f, at(t, 1) + 20, 30) : 0;
  return (
    <>
      <Abs x={80} y={170} w={1220} style={{ fontSize: 34, fontWeight: 800, ...rise(f, 2) }}>
        Top 10 where <span style={{ fontFamily: MONO, color: C.amber }}>workspace = 'acme'</span> · acme owns 1% of chunks
      </Abs>
      {t.step <= 2 && (
        <>
          <Abs x={80} y={270} w={600} style={{ fontSize: 28, fontWeight: 700, color: C.muted, opacity: enter(f, 8) }}>
            1 · HNSW returns its 40 best, from all workspaces
          </Abs>
          <Abs x={80} y={320} w={1100} style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {cands.map((i) => {
              const keep = acme(i);
              return <div key={i} style={{ width: 96, height: 56, borderRadius: 10, background: keep ? `${C.green}55` : PALETTE[i % 6] + "40", border: `2px solid ${keep ? C.green : C.line}`, opacity: enter(f, 10 + i) * (keep ? 1 : 1 - 0.85 * filt), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontFamily: MONO, color: keep ? C.text : C.faint }}>{keep ? "acme" : "ws" + ((i * 37) % 500)}</div>;
            })}
          </Abs>
          {t.step >= 1 && (
            <Abs x={1240} y={320} w={600} style={{ ...card(C.red), padding: "22px 28px", ...rise(f, at(t, 1)) }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.muted }}>2 · then the filter</div>
              <div style={{ fontSize: 76, fontWeight: 900, color: C.red }}>{t.step >= 1 && filt > 0.9 ? "1 of 10" : "…"}</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>post-filtering: results vanish</div>
              <div style={{ fontSize: 24, color: C.muted, marginTop: 6 }}>although acme has 100,000 chunks</div>
            </Abs>
          )}
          {t.step >= 2 && (
            <Abs x={1240} y={640} w={600} style={{ ...card(C.amber), padding: "18px 26px", ...rise(f, at(t, 2)) }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: C.amber }}>filter during the walk?</div>
              <div style={{ fontSize: 25, color: C.muted, marginTop: 6 }}>99% of links lead to forbidden points: dead ends, recall drops again</div>
            </Abs>
          )}
        </>
      )}
      {t.step >= 3 && (
        <Abs x={80} y={280} w={1760} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {[
            ["🧱", "Partition by the filter", "one index per large tenant: the filter is free, each graph is small", C.green],
            ["🔁", "Filter-aware / iterative scans", "keep walking until enough rows pass (pgvector 0.8: hnsw.iterative_scan)", C.blue],
            ["🎣", "Over-fetch", "ask for 400 to keep 10: a quick patch, not a design", C.amber],
          ].map(([i, a, b, col], k) => (
            <div key={k} style={{ ...card(col), padding: "18px 26px", display: "flex", gap: 22, alignItems: "center", opacity: t.step >= 3 + Math.min(k, 1) ? 1 : 0, ...rise(f, at(t, 3 + Math.min(k, 1)) + k * 10) }}>
              <div style={{ fontSize: 50 }}>{i}</div>
              <div>
                <div style={{ fontSize: 34, fontWeight: 800, color: col }}>{a}</div>
                <div style={{ fontSize: 27, color: C.muted, marginTop: 4 }}>{b}</div>
              </div>
            </div>
          ))}
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ quantisation

export const A3Quant = ({ t }: CP) => {
  const f = t.frame;
  const rows: [string, string, number, string][] = [
    ["float32", "4 KB", 1, "40 GB"],
    ["float16", "2 KB", 0.5, "20 GB"],
    ["int8", "1 KB", 0.25, "10 GB"],
    ["binary (1 bit)", "128 B", 1 / 32, "1.3 GB"],
  ];
  return (
    <>
      <Abs x={80} y={170} w={1220} style={{ fontSize: 34, fontWeight: 800, ...rise(f, 2) }}>
        One vector: 1,024 numbers · 10 million of them
      </Abs>
      {rows.map(([name, size, w, total], i) => {
        const st = i === 0 ? 0 : Math.min(i, 2);
        if (t.step < st) return null;
        return (
          <Abs key={name} x={80} y={280 + i * 110} w={1760} style={{ display: "flex", alignItems: "center", gap: 24, ...rise(f, at(t, st) + (i === 3 ? 0 : i === 2 ? 14 : 0)) }}>
            <div style={{ width: 230, fontFamily: MONO, fontSize: 30, fontWeight: 700 }}>{name}</div>
            <div style={{ width: 1000 * w * ease(f, at(t, st) + 6, 24) + 6, height: 60, borderRadius: 10, background: i === 3 ? C.green : C.blue, opacity: 0.85 }} />
            <div style={{ fontSize: 30, fontWeight: 800 }}>{size}</div>
            <div style={{ fontSize: 28, color: C.muted }}>→ {total}</div>
          </Abs>
        );
      })}
      {t.step >= 3 && (
        <Abs x={80} y={740} w={1760} style={{ display: "flex", alignItems: "center", gap: 18, ...rise(f, at(t, 3)) }}>
          {["1-bit index: top 200, rough and fast", "rescore the 200 with full vectors", "true top 10"].map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ ...card(i === 2 ? C.green : C.line), padding: "14px 22px", fontSize: 28, fontWeight: 700 }}>{s}</div>
              {i < 2 && <div style={{ fontSize: 36, color: C.faint }}>→</div>}
            </div>
          ))}
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ BM25

export const A3Bm25 = ({ t }: CP) => {
  const f = t.frame;
  const panel = (i: number, title: string, body: React.ReactNode) => (
    <div style={{ flex: 1, ...card(t.step === i + 1 ? C.amber : C.line), padding: "22px 26px", opacity: t.step >= i + 1 ? 1 : 0.15, ...rise(f, at(t, i + 1)) }}>
      <div style={{ fontSize: 32, fontWeight: 800, color: C.amber }}>{title}</div>
      <div style={{ marginTop: 14 }}>{body}</div>
    </div>
  );
  const tf = (n: number, k1 = 1.2) => (n * (k1 + 1)) / (n + k1);
  return (
    <>
      <Abs x={80} y={170} w={1220} style={{ ...rise(f, 2) }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>QUERY</div>
        <div style={{ fontFamily: MONO, fontSize: 40, fontWeight: 700, marginTop: 6 }}>
          login fails with <span style={{ color: C.amber }}>ERR_TOKEN_EXPIRED</span>
        </div>
      </Abs>
      <Abs x={80} y={340} w={1760} style={{ display: "flex", gap: 26, alignItems: "stretch" }}>
        {panel(
          0,
          "1 · How rare is the word?",
          <>
            <div style={{ fontFamily: MONO, fontSize: 26 }}>ERR_TOKEN_EXPIRED: 3 chunks</div>
            <div style={{ height: 16, width: 30, background: C.green, borderRadius: 4, margin: "6px 0 14px" }} />
            <div style={{ fontFamily: MONO, fontSize: 26 }}>login: 2.1M chunks</div>
            <div style={{ height: 16, width: 360, background: C.faint, borderRadius: 4, marginTop: 6 }} />
            <div style={{ fontSize: 24, color: C.muted, marginTop: 14 }}>rare match = strong evidence (IDF)</div>
          </>,
        )}
        {panel(
          1,
          "2 · How often here?",
          <>
            <svg width={440} height={170}>
              <line x1={20} y1={150} x2={430} y2={150} stroke={C.line} strokeWidth={2} />
              <polyline points={Array.from({ length: 11 }, (_, n) => `${20 + n * 40},${150 - tf(n) * 60}`).join(" ")} fill="none" stroke={C.amber} strokeWidth={5} />
              <text x={300} y={40} fill={C.muted} fontSize={22}>
                levels off (k1)
              </text>
            </svg>
            <div style={{ fontSize: 24, color: C.muted }}>the 10th mention adds almost nothing over the 3rd</div>
          </>,
        )}
        {panel(
          2,
          "3 · Is the chunk just long?",
          <>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-end", height: 150 }}>
              <div style={{ width: 80, height: 60, background: C.green, borderRadius: 6 }} />
              <div style={{ width: 80, height: 150, background: C.faint, borderRadius: 6 }} />
            </div>
            <div style={{ fontSize: 24, color: C.muted, marginTop: 14 }}>long chunks match by chance: scores are scaled for length (b)</div>
          </>,
        )}
      </Abs>
    </>
  );
};

// ------------------------------------------------------------------ RRF

const KW = ["runbook-17", "faq-3"];
const VS = ["faq-3", "incident-9", "runbook-17"];

export const A3Rrf = ({ t }: CP) => {
  const f = t.frame;
  const list = (title: string, items: string[], x: number, col: string, start: number) => (
    <Abs x={x} y={260} w={400} style={{ ...card(col), padding: "18px 24px", ...rise(f, start) }}>
      <div style={{ fontSize: 26, fontWeight: 800, color: col, letterSpacing: 1 }}>{title}</div>
      {items.map((d, i) => (
        <div key={d} style={{ fontFamily: MONO, fontSize: 30, marginTop: 12 }}>
          {i + 1}. {d}
        </div>
      ))}
    </Abs>
  );
  const scores: [string, string, number][] = [
    ["faq-3", "1/62 + 1/61", 1 / 62 + 1 / 61],
    ["runbook-17", "1/61 + 1/63", 1 / 61 + 1 / 63],
    ["incident-9", "1/62", 1 / 62],
  ];
  return (
    <>
      {list("KEYWORD (BM25 14.2, 9.8)", KW, 80, C.amber, 4)}
      {list("VECTOR (0.83, 0.81, 0.79)", VS, 520, C.blue, 10)}
      {t.step >= 1 && (
        <Abs x={1000} y={260} w={840} style={{ ...card(C.purple), padding: "20px 28px", ...rise(f, at(t, 1)) }}>
          <div style={{ fontSize: 30, fontWeight: 800 }}>scores on different scales: don't add them</div>
          <div style={{ fontFamily: MONO, fontSize: 34, marginTop: 14, color: C.purple }}>RRF = Σ 1 / (60 + rank)</div>
          <div style={{ fontSize: 24, color: C.muted, marginTop: 8 }}>only positions count · 60 from Cormack et al., 2009</div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={1000} y={520} w={840} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {scores.map(([d, sum, v], i) => (
            <div key={d} style={{ ...card(i === 0 ? C.green : C.line), padding: "12px 22px", display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 28, ...rise(f, at(t, 2) + i * 14) }}>
              <span>
                {i + 1}. {d}
              </span>
              <span style={{ color: C.muted }}>{sum}</span>
              <span style={{ color: C.green, fontWeight: 800 }}>{v.toFixed(4)}</span>
            </div>
          ))}
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={80} y={560} w={840} style={{ fontSize: 30, lineHeight: 1.4, fontWeight: 700, ...rise(f, at(t, 3)) }}>
          found by both → rises to the top
          <br />
          <span style={{ color: C.muted }}>found by one → still gets points</span>
          <br />
          <span style={{ color: C.muted }}>trust one more? multiply its points by a weight</span>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ bi vs cross encoder

export const A3Rerank = ({ t }: CP) => {
  const f = t.frame;
  const box = (x: number, txt: string, col: string, w = 220) => (
    <div style={{ position: "absolute", left: x, width: w, ...card(col), padding: "12px 0", textAlign: "center", fontSize: 26, fontWeight: 800 }}>{txt}</div>
  );
  return (
    <>
      <Abs x={80} y={180} w={860} h={400} style={{ ...rise(f, 4) }}>
        <div style={{ fontSize: 36, fontWeight: 800, color: C.blue }}>Bi-encoder</div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 4 }}>question and chunk encoded separately</div>
        <div style={{ position: "relative", marginTop: 30, height: 200 }}>
          <div style={{ position: "absolute", top: 0, width: "100%" }}>
            {box(0, "question", C.line)}
            {box(300, "encoder", C.blue)}
            {box(600, "vector", C.cyan, 160)}
          </div>
          <div style={{ position: "absolute", top: 90, width: "100%" }}>
            {box(0, "chunk", C.line)}
            {box(300, "encoder", C.blue)}
            {box(600, "vector", C.cyan, 160)}
          </div>
        </div>
        <div style={{ fontSize: 27, fontWeight: 700 }}>
          compare vectors · chunk side <span style={{ color: C.green }}>precomputed</span> → millions in ms
        </div>
      </Abs>
      {t.step >= 1 && (
        <Abs x={1000} y={180} w={840} style={{ ...rise(f, at(t, 1)) }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: C.pink }}>Cross-encoder</div>
          <div style={{ fontSize: 26, color: C.muted, marginTop: 4 }}>question and chunk read together</div>
          <div style={{ position: "relative", marginTop: 30, height: 200 }}>
            <div style={{ position: "absolute", top: 40, width: "100%" }}>
              {box(0, "question + chunk", C.line, 300)}
              {box(360, "model", C.pink, 180)}
              {box(600, "0.94", C.green, 140)}
            </div>
          </div>
          <div style={{ fontSize: 27, fontWeight: 700 }}>
            sees word-to-word links · <span style={{ color: C.red }}>nothing precomputed</span> → only for a shortlist
          </div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={80} y={640} w={1760} style={{ display: "flex", gap: 30 }}>
          {[
            ["📄 CV screen", "10,000 CVs, keyword filter: fast, rough", C.blue],
            ["🤝 Interview", "top 20, properly: slow, accurate", C.pink],
          ].map(([a, b, col], i) => (
            <div key={i} style={{ flex: 1, ...card(col), padding: "18px 26px", ...rise(f, at(t, 2) + i * 12) }}>
              <div style={{ fontSize: 32, fontWeight: 800 }}>{a}</div>
              <div style={{ fontSize: 27, color: C.muted, marginTop: 4 }}>{b}</div>
            </div>
          ))}
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ MMR + threshold

export const A3Mmr = ({ t }: CP) => {
  const f = t.frame;
  const top: [string, number, boolean][] = [
    ["policy §3: tokens expire after 60 min", 0.91, false],
    ["FAQ: tokens expire after 60 min", 0.9, true],
    ["training deck: tokens expire after 60 min", 0.89, true],
    ["runbook: refresh the token, retry", 0.84, false],
    ["incident-9: clock skew rejects tokens", 0.8, false],
  ];
  const mmr = t.step >= 1;
  return (
    <>
      <Abs x={80} y={180} w={1220} style={{ fontSize: 34, fontWeight: 800, ...rise(f, 2) }}>
        {mmr ? "MMR: relevant, and different from what's already picked" : "Top 5 by score alone"}
      </Abs>
      <Abs x={80} y={280} w={1220} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {top.map(([s, v, dup], i) => {
          const out = mmr && dup;
          return (
            <div key={s} style={{ ...card(out ? C.red : mmr ? C.green : C.line), padding: "14px 22px", display: "flex", justifyContent: "space-between", fontSize: 28, opacity: out ? 0.35 : 1, textDecoration: out ? "line-through" : "none", ...rise(f, 6 + i * 5) }}>
              <span>{s}</span>
              <span style={{ fontFamily: MONO, color: C.muted }}>{v.toFixed(2)}</span>
            </div>
          );
        })}
      </Abs>
      {t.step >= 2 && (
        <Abs x={1360} y={300} w={480} style={{ ...card(C.amber), padding: "22px 26px", ...rise(f, at(t, 2)) }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.amber }}>score threshold</div>
          <div style={{ fontSize: 27, color: C.muted, marginTop: 8, lineHeight: 1.35 }}>drop candidates below, say, 0.3: when nothing passes, the assistant can honestly say “I couldn't find it”</div>
        </Abs>
      )}
    </>
  );
};
