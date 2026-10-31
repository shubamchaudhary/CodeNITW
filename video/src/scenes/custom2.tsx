import type { Clock } from "../lib/timeline.ts";
import { C, MONO, PALETTE } from "../lib/theme.ts";
import { ease, enter, lerp, pop, rise } from "../lib/anim.ts";
import { Abs, card, Chip, SceneTitle } from "./ui.tsx";

type CP = { t: Clock; props?: Record<string, unknown> };
const at = (t: Clock, i: number) => (i <= 0 ? 4 : (t.beats[i]?.stepStart ?? Infinity));
// Visible only while the scene is on step `i` (fading between steps).
const only = (t: Clock, i: number, last = false) => {
  const f = t.frame;
  const a = i === 0 ? 1 : enter(f, at(t, i), 14);
  const b = last ? 0 : enter(f, at(t, i + 1), 12);
  return Math.max(0, a - b);
};
const rnd = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

// ------------------------------------------------------------------ embeddings

export const Embed = ({ t }: CP) => {
  const f = t.frame;
  const toks = [
    ["milk", 7545],
    ["refund", 34781],
    ["Pune", 21924],
  ] as const;
  const clusters = [
    { name: "dairy", col: C.blue, x: 0.22, y: 0.3, words: ["milk", "curd", "paneer", "butter"] },
    { name: "money back", col: C.green, x: 0.72, y: 0.26, words: ["refund", "return", "credit", "cashback"] },
    { name: "cities", col: C.amber, x: 0.28, y: 0.76, words: ["Pune", "Bengaluru", "Mumbai"] },
    { name: "time", col: C.pink, x: 0.76, y: 0.74, words: ["hours", "minutes", "days"] },
  ];
  const box = { x: 260, y: 230, w: 1400, h: 600 };
  return (
    <>
      <SceneTitle text={["Step 1 · every token becomes a list of numbers", "A space of meaning", "Order matters too: positions"][Math.min(t.step, 2)]} frame={f} />
      <div style={{ opacity: only(t, 0) }}>
        {toks.map(([w, id], i) => (
          <Abs key={w} x={160} y={290 + i * 180} w={1640} style={{ display: "flex", alignItems: "center", gap: 26, ...rise(f, 10 + i * 12) }}>
            <div style={{ width: 230, ...card(PALETTE[i]), padding: "16px 0", textAlign: "center", fontSize: 38, fontFamily: MONO, fontWeight: 700 }}>{w}</div>
            <div style={{ fontFamily: MONO, fontSize: 28, color: C.muted, width: 110 }}>#{id}</div>
            <div style={{ fontSize: 40, color: C.muted }}>→</div>
            <div style={{ display: "flex", gap: 6 }}>
              {Array.from({ length: 16 }, (_, k) => {
                const v = rnd(i * 31 + k) * 2 - 1;
                const shown = enter(f, 30 + i * 12 + k * 2, 8);
                return (
                  <div key={k} style={{ width: 62, height: 62, borderRadius: 8, opacity: shown, background: v > 0 ? `rgba(91,156,255,${0.25 + 0.7 * v})` : `rgba(255,111,165,${0.25 - 0.7 * v})`, fontSize: 17, fontFamily: MONO, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                    {v.toFixed(1)}
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 28, color: C.muted, opacity: enter(f, 80) }}>… 4,096 numbers</div>
          </Abs>
        ))}
        <Abs x={160} y={830} w={1600} style={{ fontSize: 30, color: C.muted, opacity: enter(f, 90) }}>
          A lookup table: one learned row of numbers (a <b style={{ color: C.text }}>vector</b>) per token.
        </Abs>
      </div>
      {t.step >= 1 && (
        <div style={{ opacity: only(t, 1) }}>
          <Abs x={box.x} y={box.y} w={box.w} h={box.h} style={{ ...card(), background: C.bg2 }} />
          {clusters.map((c, ci) => (
            <div key={c.name}>
              <div style={{ position: "absolute", left: box.x + c.x * box.w - 190, top: box.y + c.y * box.h - 130, width: 380, height: 260, borderRadius: 999, background: `${c.col}14`, border: `2px dashed ${c.col}66`, opacity: enter(f, at(t, 1) + 30 + ci * 10) }} />
              <div style={{ position: "absolute", left: box.x + c.x * box.w - 190, top: box.y + c.y * box.h - 170, width: 380, textAlign: "center", fontSize: 24, fontWeight: 700, color: c.col, opacity: enter(f, at(t, 1) + 40 + ci * 10) }}>{c.name}</div>
              {c.words.map((w, wi) => {
                const ang = (wi / c.words.length) * Math.PI * 2 + ci;
                const x = box.x + c.x * box.w + Math.cos(ang) * 95;
                const y = box.y + c.y * box.h + Math.sin(ang) * 60;
                const p = Math.min(1, pop(f, at(t, 1) + ci * 10 + wi * 5));
                return (
                  <div key={w} style={{ position: "absolute", left: x - 8, top: y - 8, transform: `scale(${p})` }}>
                    <div style={{ width: 16, height: 16, borderRadius: 999, background: c.col }} />
                    <div style={{ position: "absolute", left: 22, top: -10, fontSize: 28, fontWeight: 600, whiteSpace: "nowrap" }}>{w}</div>
                  </div>
                );
              })}
            </div>
          ))}
          <Abs x={box.x} y={box.y + box.h + 16} w={box.w} style={{ textAlign: "center", fontSize: 28, color: C.muted }}>
            similar use → similar numbers → close together (a 2-D sketch of thousands of dimensions)
          </Abs>
        </div>
      )}
      {t.step >= 2 && (
        <div style={{ opacity: only(t, 2, true) }}>
          {[
            ["dog", "bites", "man"],
            ["man", "bites", "dog"],
          ].map((row, ri) => (
            <Abs key={ri} x={360} y={300 + ri * 230} w={1300} style={{ display: "flex", gap: 30, alignItems: "center", ...rise(f, at(t, 2) + ri * 16) }}>
              {row.map((w, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <div style={{ ...card(w === "dog" ? C.amber : w === "man" ? C.blue : C.line), width: 230, padding: "22px 0", textAlign: "center", fontSize: 44, fontWeight: 700 }}>{w}</div>
                  <div style={{ position: "absolute", right: -14, top: -16, width: 44, height: 44, borderRadius: 999, background: C.purple, color: C.bg, fontWeight: 900, fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center", opacity: enter(f, at(t, 2) + 40 + i * 8) }}>
                    {i + 1}
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 34, color: C.muted, marginLeft: 30 }}>{ri === 0 ? "news: no" : "news: yes"}</div>
            </Abs>
          ))}
          <Abs x={360} y={780} w={1300} style={{ fontSize: 34, fontWeight: 700, ...rise(f, at(t, 2) + 60) }}>
            token vector <span style={{ color: C.purple }}>+ position vector</span> → same words, different meaning
          </Abs>
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ attention arcs

export const Attention = ({ t }: CP) => {
  const f = t.frame;
  const toks = ["The", "milk", "was", "spoiled,", "so", "the", "customer", "returned", "it"];
  const w = [0.03, 0.55, 0.02, 0.18, 0.02, 0.03, 0.08, 0.09];
  const widths = toks.map((s) => s.length * 26 + 48);
  const gap = 22;
  const total = widths.reduce((a, b) => a + b + gap, -gap);
  let x = (1920 - total) / 2;
  const xs = widths.map((wd) => {
    const c = x + wd / 2;
    x += wd + gap;
    return c;
  });
  const y = 690;
  const itX = xs[8];
  const arcH = (i: number) => 60 + (itX - xs[i]) * 0.26;
  const arcs = t.step >= 1 ? enter(f, at(t, 1) + 6, 30) : 0;
  return (
    <>
      <SceneTitle text="Step 2 · tokens look at each other: attention" frame={f} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {w.map((wt, i) => {
          const h = arcH(i);
          return (
            <path
              key={i}
              d={`M${itX},${y - 6} C${itX},${y - h} ${xs[i]},${y - h} ${xs[i]},${y - 6}`}
              stroke={C.pink}
              strokeWidth={2 + wt * 34}
              strokeOpacity={0.25 + wt * 1.2}
              fill="none"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - arcs}
              strokeLinecap="round"
            />
          );
        })}
        {arcs > 0.9 &&
          [1, 3].map((i) => (
            <text key={i} x={(xs[i] + itX) / 2} y={y - 0.75 * arcH(i) - 16} textAnchor="middle" fontSize={32} fontWeight={800} fill={C.pink}>
              {Math.round(w[i] * 100)}%
            </text>
          ))}
      </svg>
      {toks.map((s, i) => {
        const glow = i === 8 ? 1 : (w[i] ?? 0) * 1.6 * arcs;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: xs[i] - widths[i] / 2,
              top: y,
              width: widths[i],
              padding: "18px 0",
              textAlign: "center",
              fontSize: 40,
              fontWeight: 700,
              borderRadius: 14,
              border: `3px solid ${i === 8 ? C.pink : C.line}`,
              background: i === 8 ? `${C.pink}33` : `rgba(255,111,165,${glow * 0.5})`,
              ...rise(f, 6 + i * 5),
            }}
          >
            {s}
          </div>
        );
      })}
      <Abs x={0} y={820} w={1920} style={{ display: "flex", justifyContent: "center", ...rise(f, at(t, 1) + 50) }}>
        <div style={{ ...card(C.pink), padding: "20px 34px", fontSize: 36, fontWeight: 700 }}>
          new vector for <span style={{ color: C.pink }}>“it”</span> ≈ mostly <span style={{ color: C.pink }}>milk</span> + a bit of <span style={{ color: C.pink }}>spoiled</span>
        </div>
      </Abs>
    </>
  );
};

// ------------------------------------------------------------------ layers

export const Layers = ({ t }: CP) => {
  const f = t.frame;
  const cols = [560, 760, 960, 1160, 1360];
  const words = ["the", "milk", "was", "spoiled", "it"];
  const n = 12;
  const pulse = ((f - at(t, 1)) % 70) / 70;
  return (
    <>
      <SceneTitle text={["Step 3 · one layer", "Dozens of layers: an assembly line", "At the top: scores for the next token"][Math.min(t.step, 2)]} frame={f} />
      <div style={{ opacity: only(t, 0) }}>
        <Abs x={440} y={330} w={1040} h={120} style={{ ...card(C.purple), background: `${C.purple}22`, display: "flex", alignItems: "center", paddingLeft: 30, fontSize: 32, fontWeight: 800, ...rise(f, 30) }}>
          Feed-forward
        </Abs>
        <Abs x={440} y={530} w={1040} h={120} style={{ ...card(C.blue), background: `${C.blue}22`, display: "flex", alignItems: "center", paddingLeft: 30, fontSize: 32, fontWeight: 800, ...rise(f, 14) }}>
          Attention
        </Abs>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {cols.map((x, i) =>
            cols.slice(0, i).map((x2, j) => (
              <line key={`${i}-${j}`} x1={x} y1={650} x2={x2} y2={530} stroke={C.blue} strokeWidth={2} opacity={0.5 * enter(f, 24 + i * 4)} />
            )),
          )}
          {cols.map((x, i) => (
            <g key={i} opacity={enter(f, 40 + i * 4)}>
              <line x1={x} y1={530} x2={x} y2={450} stroke={C.purple} strokeWidth={4} />
              <line x1={x} y1={330} x2={x} y2={270} stroke={C.muted} strokeWidth={3} />
            </g>
          ))}
        </svg>
        {cols.map((x, i) => (
          <Abs key={i} x={x - 80} y={700} w={160} style={{ ...card(), padding: "14px 0", textAlign: "center", fontSize: 30, fontWeight: 700, ...rise(f, 6 + i * 4) }}>
            {words[i]}
          </Abs>
        ))}
        <Abs x={1520} y={560} w={360} style={{ fontSize: 26, color: C.blue, fontWeight: 700, ...rise(f, 24) }}>
          tokens share information
        </Abs>
        <Abs x={1520} y={360} w={360} style={{ fontSize: 26, color: C.purple, fontWeight: 700, ...rise(f, 40) }}>
          each token transformed on its own
        </Abs>
      </div>
      {t.step >= 1 && (
        <div style={{ opacity: Math.min(1, enter(f, at(t, 1), 14)) }}>
          {Array.from({ length: n }, (_, i) => {
            const y = 800 - i * 46;
            const lit = t.step === 1 ? Math.max(0, 1 - Math.abs(pulse * n - i) / 1.5) : 0.15;
            return (
              <div key={i} style={{ position: "absolute", left: 610, top: y, display: "flex", gap: 6, opacity: enter(f, at(t, 1) + i * 3) }}>
                <div style={{ width: 340, height: 36, borderRadius: 8, background: `rgba(91,156,255,${0.25 + lit * 0.7})` }} />
                <div style={{ width: 340, height: 36, borderRadius: 8, background: `rgba(167,139,250,${0.25 + lit * 0.7})` }} />
              </div>
            );
          })}
          <Abs x={610} y={850} w={700} style={{ display: "flex", justifyContent: "space-around", fontSize: 26, color: C.muted, fontWeight: 700 }}>
            <span style={{ color: C.blue }}>attention</span>
            <span style={{ color: C.purple }}>feed-forward</span>
          </Abs>
          <Abs x={1360} y={300} w={460} style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.4, ...rise(f, at(t, 1) + 30) }}>
            each station refines the meaning a little more
            <div style={{ color: C.purple, marginTop: 30 }}>much of the “facts” live in the feed-forward parts</div>
          </Abs>
        </div>
      )}
      {t.step >= 2 && (
        <Abs x={140} y={250} w={420} style={{ ...rise(f, at(t, 2)) }}>
          <div style={{ ...card(C.amber), padding: 26 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: C.amber }}>last token's vector → scores</div>
            {[0.62, 0.21, 0.09].map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
                <span style={{ width: 90, fontFamily: MONO, fontSize: 24 }}>{["within", "only", "up"][i]}</span>
                <div style={{ height: 26, width: p * 400 * ease(f, at(t, 2) + 10, 30), background: PALETTE[i], borderRadius: 6 }} />
              </div>
            ))}
            <div style={{ fontSize: 26, marginTop: 18 }}>🎲 back to the weighted die</div>
          </div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ decoder vs encoder

export const EncDec = ({ t }: CP) => {
  const f = t.frame;
  const panel = (i: number, title: string, sub: string, col: string, arrows: [number, number][], start: number) => (
    <Abs x={80 + i * 900} y={240} w={860} h={560} style={{ ...card(col), padding: 34, ...rise(f, start) }}>
      <div style={{ fontSize: 40, fontWeight: 800, color: col }}>{title}</div>
      <div style={{ fontSize: 28, color: C.muted, marginTop: 8 }}>{sub}</div>
      <svg width={800} height={300} style={{ position: "absolute", left: 30, top: 200 }}>
        {arrows.map(([a, b], k) => {
          const xa = 80 + a * 160;
          const xb = 80 + b * 160;
          const h = 40 + Math.abs(xa - xb) * 0.3;
          const p = enter(f, start + 16 + k * 5, 16);
          return <path key={k} d={`M${xa},200 C${xa},${200 - h} ${xb},${200 - h} ${xb},200`} stroke={col} strokeWidth={4} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />;
        })}
        {[0, 1, 2, 3, 4].map((k) => (
          <circle key={k} cx={80 + k * 160} cy={230} r={30} fill={C.card2} stroke={C.line} strokeWidth={3} />
        ))}
      </svg>
    </Abs>
  );
  return (
    <>
      <SceneTitle text="Two kinds of transformer" frame={f} />
      {panel(0, "Decoder-only", "chat models · writes text · looks backwards", C.blue, [[4, 0], [4, 1], [4, 2], [4, 3]], 6)}
      {t.step >= 1 && panel(1, "Encoder", "embedding models, rerankers · looks both ways", C.green, [[2, 0], [2, 1], [2, 3], [2, 4]], at(t, 1))}
    </>
  );
};

// ------------------------------------------------------------------ the director's questions

export const Director = ({ t }: CP) => {
  const f = t.frame;
  const titles = ["The director's questions", "Prefill: the first pass", "Attention compares every pair", "Why not paste in 12,000 documents? 1. Size", "2. Lost in the middle", "3. The KV cache"];
  return (
    <>
      <SceneTitle text={titles[Math.min(t.step, 5)]} frame={f} />
      <div style={{ opacity: only(t, 0) }}>
        {["Why does a longer prompt cost more, even for the same short answer?", "Why can't we paste all 12,000 documents into the prompt?"].map((q, i) => (
          <Abs key={i} x={180} y={300 + i * 230} w={1560} style={{ ...card(C.amber), padding: "30px 40px", fontSize: 44, fontWeight: 700, ...rise(f, 6 + i * 14) }}>
            <span style={{ color: C.amber }}>Q{i + 1} · </span>
            {q}
          </Abs>
        ))}
      </div>
      {t.step >= 1 && (
        <div style={{ opacity: only(t, 1) }}>
          {[0, 1, 2, 3].map((l) => {
            const wave = ((f - at(t, 1)) % 80) / 80;
            const lit = Math.max(0, 1 - Math.abs(wave * 4 - (l + 0.5)) / 0.9);
            return <Abs key={l} x={360} y={620 - l * 95} w={1200} h={70} style={{ borderRadius: 14, background: `rgba(91,156,255,${0.18 + lit * 0.6})`, border: `2px solid ${C.blue}`, fontSize: 26, fontWeight: 700, display: "flex", alignItems: "center", paddingLeft: 24 }}>layer {l + 1}</Abs>;
          })}
          <Abs x={360} y={740} w={1200} style={{ display: "flex", gap: 10 }}>
            {Array.from({ length: 14 }, (_, i) => (
              <div key={i} style={{ flex: 1, height: 54, borderRadius: 10, background: PALETTE[i % PALETTE.length], opacity: 0.8 * enter(f, at(t, 1) + i * 2) }} />
            ))}
          </Abs>
          <Abs x={360} y={820} w={1200} style={{ textAlign: "center", fontSize: 30, color: C.muted }}>
            every prompt token × every layer, before the first word appears
          </Abs>
        </div>
      )}
      {t.step >= 2 && (
        <div style={{ opacity: only(t, 2) }}>
          {[4, 8].map((n, gi) => {
            const cell = 46;
            const ox = gi === 0 ? 380 : 1000;
            const cells = [];
            for (let r = 0; r < n; r++) for (let c = 0; c <= r; c++) cells.push([r, c]);
            return (
              <div key={n}>
                {cells.map(([r, c], k) => (
                  <div key={k} style={{ position: "absolute", left: ox + c * (cell + 6), top: 280 + r * (cell + 6), width: cell, height: cell, borderRadius: 8, background: gi ? C.pink : C.blue, opacity: 0.85 * enter(f, at(t, 2) + gi * 30 + k * 1.2, 6) }} />
                ))}
                <Abs x={ox} y={280 + 8 * 52 + 20} w={460} style={{ fontSize: 32, fontWeight: 800 }}>
                  {n} tokens → <span style={{ color: gi ? C.pink : C.blue }}>{cells.length} comparisons</span>
                </Abs>
              </div>
            );
          })}
          <Abs x={0} y={800} w={1920} style={{ textAlign: "center", fontSize: 36, fontWeight: 700, color: C.amber, ...rise(f, at(t, 2) + 70) }}>
            double the prompt → more than double the work, and a longer wait for the first word
          </Abs>
        </div>
      )}
      {t.step >= 3 && (
        <div style={{ opacity: only(t, 3) }}>
          {[
            ["12,000 documents", 3e8, C.red],
            ["largest context windows", 1e6, C.amber],
            ["typical context windows", 1.28e5, C.green],
          ].map(([label, n, col], i) => {
            const w = ((Math.log10(n as number) - 4) / 5) * 1250 * ease(f, at(t, 3) + i * 12, 30);
            return (
              <Abs key={i} x={180} y={300 + i * 150} w={1600} style={{ opacity: enter(f, at(t, 3) + i * 12) }}>
                <div style={{ fontSize: 30, fontWeight: 700, marginBottom: 10 }}>
                  {label} <span style={{ color: col as string }}>≈ {(n as number).toLocaleString("en-US")} tokens</span>
                </div>
                <div style={{ height: 50, width: w, background: col as string, borderRadius: 10 }} />
              </Abs>
            );
          })}
          <Abs x={180} y={760} w={1600} style={{ fontSize: 26, color: C.faint }}>log scale · each step to the right is 10× more</Abs>
        </div>
      )}
      {t.step >= 4 && (
        <div style={{ opacity: only(t, 4) }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <line x1={300} y1={800} x2={1620} y2={800} stroke={C.line} strokeWidth={3} />
            <line x1={300} y1={800} x2={300} y2={260} stroke={C.line} strokeWidth={3} />
            <path d="M320,320 C700,760 1220,760 1600,330" stroke={C.amber} strokeWidth={7} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease(f, at(t, 4) + 6, 40)} />
            <text x={960} y={850} textAnchor="middle" fontSize={28} fill={C.muted}>where the fact sits in the input: start → middle → end</text>
            <text x={270} y={530} textAnchor="middle" fontSize={26} fill={C.muted} transform="rotate(-90 270 530)">how reliably it is used</text>
            <text x={960} y={720} textAnchor="middle" fontSize={34} fontWeight={800} fill={C.amber} opacity={enter(f, at(t, 4) + 40)}>lost in the middle</text>
          </svg>
          <Abs x={1400} y={880} w={440} style={{ textAlign: "right", fontSize: 20, color: C.faint }}>illustrative shape</Abs>
        </div>
      )}
      {t.step >= 5 && (
        <div style={{ opacity: only(t, 5, true) }}>
          {[0, 1].map((row) => {
            const users = row === 0 ? 8 : 2;
            const free = 1100;
            const start = at(t, 5) + row * Math.floor(t.len(5) * 0.45);
            return (
              <Abs key={row} x={180} y={310 + row * 250} w={1600} style={{ opacity: enter(f, start) }}>
                <div style={{ fontSize: 30, fontWeight: 700, marginBottom: 12 }}>{row === 0 ? "Short inputs: many users fit" : "Long inputs: only a few fit"}</div>
                <div style={{ display: "flex", height: 80, width: 1560, border: `3px solid ${C.line}`, borderRadius: 14, overflow: "hidden" }}>
                  <div style={{ width: 440, background: C.card2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, color: C.muted, fontWeight: 700 }}>model weights</div>
                  {Array.from({ length: users }, (_, u) => (
                    <div key={u} style={{ width: (free / users) * enter(f, start + 8 + u * 4, 10), borderLeft: `2px solid ${C.bg}`, background: PALETTE[u % PALETTE.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: C.bg, fontWeight: 800 }}>
                      {row === 1 ? "KV cache · user " + (u + 1) : ""}
                    </div>
                  ))}
                </div>
              </Abs>
            );
          })}
          <Abs x={180} y={800} w={1600} style={{ fontSize: 30, color: C.muted }}>
            GPU memory: the KV cache keeps keys and values of every earlier token, and grows with input length
          </Abs>
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ prompt caching

export const Cache = ({ t }: CP) => {
  const f = t.frame;
  const qs = ["Can bakery items be refunded after 6 hours?", "Is a missing item refunded to the wallet?", "What if the slot was moved twice?"];
  return (
    <>
      <SceneTitle text="Prompt caching" frame={f} />
      {qs.map((q, i) => {
        const st = 20 + i * 26;
        const cached = i > 0 && f > st + 14;
        return (
          <Abs key={i} x={120} y={260 + i * 130} w={1680} style={{ display: "flex", gap: 12, ...rise(f, st) }}>
            <div style={{ width: 860, height: 96, borderRadius: 16, background: cached ? `${C.green}33` : `${C.amber}22`, border: `3px solid ${cached ? C.green : C.amber}`, display: "flex", alignItems: "center", paddingLeft: 26, fontSize: 28, fontWeight: 700 }}>
              Fixed instructions (2,000 tokens)
              <span style={{ marginLeft: "auto", marginRight: 22, color: cached ? C.green : C.amber }}>{cached ? "♻ reused from cache" : "computed once"}</span>
            </div>
            <div style={{ flex: 1, height: 96, borderRadius: 16, background: C.card, border: `3px solid ${C.line}`, display: "flex", alignItems: "center", paddingLeft: 22, fontSize: 26 }}>{q}</div>
          </Abs>
        );
      })}
      <Abs x={120} y={660} w={1680} style={{ ...rise(f, 110), fontSize: 34, fontWeight: 800, color: C.green }}>
        same start → cheaper and faster requests
      </Abs>
      {t.step >= 1 && (
        <Abs x={120} y={740} w={1680} style={{ display: "flex", gap: 30, ...rise(f, at(t, 1)) }}>
          <Chip color={C.green} style={{ fontSize: 30, padding: "14px 28px" }}>✓ fixed instructions first, changing parts last</Chip>
          <Chip color={C.red} style={{ fontSize: 30, padding: "14px 28px" }}>✗ changing part first → nothing to reuse</Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the ticket sorting task

export const Tickets = ({ t }: CP) => {
  const f = t.frame;
  const bins = [
    ["refund", C.pink],
    ["late delivery", C.amber],
    ["missing item", C.blue],
    ["other", C.muted],
  ] as const;
  const s1 = at(t, 1);
  return (
    <>
      <div style={{ opacity: only(t, 0) }}>
        <Abs x={360} y={330} w={1200} style={{ ...card(C.blue), padding: 50, textAlign: "center", ...rise(f, 4) }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: C.blue, letterSpacing: 3 }}>WHAT YOU CONTROL</div>
          <div style={{ fontSize: 80, fontWeight: 900, marginTop: 14 }}>the prompt</div>
          <div style={{ fontSize: 36, color: C.muted, marginTop: 14 }}>the text instructions you send with each request</div>
        </Abs>
      </div>
      {t.step >= 1 && (
        <div style={{ opacity: enter(f, s1, 14) }}>
          <SceneTitle text="First task: sort 3,000 tickets a day" frame={f} start={s1} />
          {bins.map(([name, col], i) => (
            <Abs key={name} x={180 + i * 410} y={640} w={360} h={200} style={{ ...card(col), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", paddingBottom: 22 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: col }}>{name}</div>
            </Abs>
          ))}
          {Array.from({ length: 16 }, (_, k) => {
            const bin = [0, 1, 2, 0, 3, 1, 0, 2, 1, 0, 3, 2, 0, 1, 2, 0][k];
            const st = s1 + 20 + k * 9;
            const p = ease(f, st, 26);
            const x = lerp(900, 300 + bin * 410 + (k % 3) * 40 - 40, p);
            const y = lerp(250, 640 + 30 + (k % 2) * 30, p);
            return (
              <div key={k} style={{ position: "absolute", left: x, top: y, width: 120, height: 74, borderRadius: 10, background: "#f4f1e8", color: "#222", fontSize: 18, padding: 8, transform: `rotate(${(rnd(k) - 0.5) * 18}deg)`, opacity: f < st ? 0 : 1, boxShadow: "0 6px 18px rgba(0,0,0,.4)" }}>
                Ticket #{4810 + k}
                <div style={{ height: 6, background: "#ccc", borderRadius: 3, marginTop: 8 }} />
              </div>
            );
          })}
          <Abs x={1400} y={250} w={440} style={{ fontSize: 28, color: C.muted, textAlign: "right", ...rise(f, s1 + 30) }}>
            today: 2 people, every morning, by hand
          </Abs>
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ attempt one

export const Attempt1 = ({ t }: CP) => {
  const f = t.frame;
  const notes = ["IMPORTANT: refunds are NOT complaints!!!", "late = slot missed!! (unless refund??)", "never say refund for angry customers"];
  const s2 = at(t, 2);
  const acc = t.step < 2 ? 81 * ease(f, at(t, 1), 40) : [81, 78, 83, 77][Math.min(3, Math.max(0, Math.floor((f - s2) / 50)))];
  return (
    <>
      <SceneTitle text="Attempt one" frame={f} />
      <Abs x={80} y={250} w={1100} style={{ ...card(), background: "#0a0e16", padding: 34, fontFamily: MONO, fontSize: 32, lineHeight: 1.5, ...rise(f, 6) }}>
        Classify this ticket as refund, late_delivery, missing_item or other.
      </Abs>
      {notes.map((n, i) => {
        const st = s2 + 10 + i * 50;
        const p = Math.min(1, pop(f, st));
        return (
          <Abs key={i} x={140 + i * 90} y={430 + i * 110} w={760} style={{ background: "#ffe773", color: "#2a2400", fontSize: 30, fontWeight: 800, padding: "18px 24px", borderRadius: 6, transform: `rotate(${[-3, 2.5, -1.5][i]}deg) scale(${p})`, opacity: p, boxShadow: "0 10px 26px rgba(0,0,0,.45)" }}>
            {n}
            <span style={{ position: "absolute", right: -150, top: 14, fontSize: 24, color: C.red, opacity: enter(f, st + 20) }}>✗ broke {["“other”", "refunds", "late"][i]}</span>
          </Abs>
        );
      })}
      {t.step >= 1 && (
        <Abs x={1330} y={250} w={480} style={{ ...card(acc >= 80 ? C.amber : C.red), padding: 34, textAlign: "center", ...rise(f, at(t, 1)) }}>
          <svg width={260} height={260} viewBox="0 0 260 260">
            <circle cx={130} cy={130} r={110} stroke={C.line} strokeWidth={22} fill="none" />
            <circle cx={130} cy={130} r={110} stroke={C.amber} strokeWidth={22} fill="none" pathLength={100} strokeDasharray={100} strokeDashoffset={100 - acc} transform="rotate(-90 130 130)" strokeLinecap="round" />
            <text x={130} y={150} textAnchor="middle" fontSize={64} fontWeight={900} fill={C.text}>
              {Math.round(acc)}%
            </text>
          </svg>
          <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>on 200 hand-labelled tickets</div>
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={0} y={830} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 3)) }}>
          <span style={{ fontSize: 44, fontWeight: 800 }}>
            Prompting looks like writing. <span style={{ color: C.green }}>Done well, it is engineering.</span>
          </span>
        </Abs>
      )}
    </>
  );
};
