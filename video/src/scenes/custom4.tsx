// Chapter 2 scenes (RAG): open-book exam, keyword vs meaning search, the
// meaning map, contrastive "magnets", chunking, parent-child, the pipeline,
// stale versions, when not to use RAG, and the complaints that lead on.
import type { CSSProperties } from "react";
import type { Clock } from "../lib/timeline.ts";
import { C, MONO, PALETTE } from "../lib/theme.ts";
import { ease, enter, lerp, pop, rise } from "../lib/anim.ts";
import { Abs, card, Chip } from "./ui.tsx";
import { at, Big, clamp01, during, from, rnd } from "./custom3.tsx";

type CP = { t: Clock; props?: Record<string, unknown> };

const Doc = ({ x, y, w = 70, h = 90, color = "#e8ecf3", style }: { x: number; y: number; w?: number; h?: number; color?: string; style?: CSSProperties }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 8, background: color, boxShadow: "0 8px 18px rgba(0,0,0,.4)", padding: 10, ...style }}>
    {[0, 1, 2, 3].map((i) => (
      <div key={i} style={{ height: 6, marginTop: i ? 8 : 4, width: `${[90, 70, 85, 50][i]}%`, background: "#a9b1c4", borderRadius: 3 }} />
    ))}
  </div>
);

const Box = ({ x, y, w, h, color, label, sub, style }: { x: number; y: number; w: number; h: number; color: string; label: string; sub?: string; style?: CSSProperties }) => (
  <Abs x={x} y={y} w={w} h={h} style={{ ...card(color), background: `${color}1c`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 12, ...style }}>
    <div style={{ fontSize: 32, fontWeight: 800 }}>{label}</div>
    {sub && <div style={{ fontSize: 24, color: C.muted, marginTop: 4 }}>{sub}</div>}
  </Abs>
);

// ------------------------------------------------------------------ the open-book exam

export const OpenBook = ({ t }: CP) => {
  const f = t.frame;
  const open = ease(f, at(t, 3) + 6, 26);
  return (
    <>
      <div style={{ opacity: during(t, 0) + during(t, 1) }}>
        <Abs x={300} y={170} w={1320} style={{ ...card(C.pink), padding: "24px 34px", fontSize: 44, fontWeight: 700, ...rise(f, 6) }}>
          <span style={{ fontSize: 26, color: C.pink, display: "block" }}>Meera</span>
          Can bakery items be refunded after 6 hours?
        </Abs>
        <Abs x={300} y={400} w={560} h={420} style={{ background: "#f4f1e8", borderRadius: 14, padding: 30, color: "#222", ...rise(f, 40) }}>
          <div style={{ fontSize: 28, fontWeight: 800 }}>Refund policy · page 4</div>
          {[["Dairy", "24 h"], ["Bakery", "6 h"], ["Frozen", "48 h"]].map(([a, b], i) => (
            <div key={a} style={{ display: "flex", justifyContent: "space-between", fontSize: 30, marginTop: 22, padding: "8px 14px", borderRadius: 8, background: i === 1 && f > 80 ? "#ffe773" : "transparent" }}>
              <span>{a}</span>
              <b>{b}</b>
            </div>
          ))}
        </Abs>
        {t.step >= 1 && (
          <Abs x={1000} y={460} w={620} style={{ ...rise(f, at(t, 1)) }}>
            <div style={{ ...card(C.purple), padding: 30, fontSize: 36, fontWeight: 700, textAlign: "center" }}>
              🧠 the model never read this page
              <div style={{ color: C.red, fontSize: 30, marginTop: 14 }}>and 12,000 documents won't fit in a prompt</div>
            </div>
          </Abs>
        )}
      </div>
      {t.step === 2 && (
        <div style={{ opacity: during(t, 2) }}>
          {Array.from({ length: 60 }, (_, i) => (
            <Doc key={i} x={760 + (i % 6) * 18 + Math.sin(f / 6 + i) * 3 * (i / 60)} y={820 - i * 11} w={300} h={40} style={{ opacity: enter(f, at(t, 2) + i * 0.8, 6), padding: 6 }} />
          ))}
          <Abs x={1180} y={360} w={600} style={{ fontSize: 50, fontWeight: 800, ...rise(f, at(t, 2) + 30) }}>memorise all 12,000? 😵</Abs>
        </div>
      )}
      {t.step >= 3 && t.step < 5 && (
        <div style={{ opacity: during(t, 3) }}>
          <div style={{ position: "absolute", left: 960, top: 300, width: 0, height: 0, perspective: 1600 }}>
            <div style={{ position: "absolute", left: -420, top: 0, width: 420, height: 520, background: "#f4f1e8", borderRadius: "16px 0 0 16px", transformOrigin: "right center", transform: `rotateY(${(1 - open) * 85}deg)`, padding: 34, color: "#333" }}>
              {[0, 1, 2, 3, 4].map((i) => <div key={i} style={{ height: 10, margin: "22px 0", width: `${70 + (i % 3) * 10}%`, background: "#c8c2b2", borderRadius: 4 }} />)}
            </div>
            <div style={{ position: "absolute", left: 0, top: 0, width: 420, height: 520, background: "#f4f1e8", borderRadius: "0 16px 16px 0", padding: 34, color: "#333" }}>
              {[0, 1, 2, 3, 4].map((i) => <div key={i} style={{ height: 10, margin: "22px 0", width: `${65 + (i % 2) * 20}%`, background: i === 2 ? C.amber : "#c8c2b2", borderRadius: 4, boxShadow: i === 2 && open > 0.9 ? `0 0 20px ${C.amber}` : "none" }} />)}
              <div style={{ position: "absolute", left: 300, top: 150, fontSize: 70, opacity: enter(f, at(t, 3) + 40), transform: `translateX(${Math.sin(f / 8) * 6}px)` }}>👈</div>
            </div>
          </div>
          <Abs x={0} y={860} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 3) + 30) }}>
            <Big size={60} color={C.amber}>an open-book exam</Big>
          </Abs>
        </div>
      )}
      {t.step >= 4 && (
        <div style={{ opacity: from(t, 4) }}>
          <Box x={200} y={360} w={460} h={240} color={C.blue} label="🔎 Retrieve" sub="find the few passages" style={rise(f, at(t, 4))} />
          <Box x={1260} y={360} w={460} h={240} color={C.green} label="✍️ Generate" sub="answer only from them, and cite" style={rise(f, at(t, 4) + 40)} />
          {[0, 1, 2].map((i) => {
            const p = clamp01(((f - at(t, 4) - 20 - i * 12) % 80) / 60);
            return <Doc key={i} x={lerp(680, 1180, p)} y={430 + i * 14} w={60} h={76} style={{ opacity: f > at(t, 4) + 20 ? Math.sin(p * Math.PI) : 0 }} />;
          })}
          {t.step >= 5 && (
            <Abs x={0} y={700} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 5)) }}>
              <Big size={54}>the model becomes a <span style={{ color: C.green }}>reader of evidence</span> 👓</Big>
            </Abs>
          )}
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ paste the whole thing

export const PasteAll = ({ t }: CP) => {
  const f = t.frame;
  const fill = ease(f, 20, 40);
  return (
    <>
      <Abs x={700} y={250} w={520} h={560} style={{ border: `6px solid ${t.step >= 2 ? C.red : C.green}`, borderRadius: 28, background: C.bg2 }} />
      <Abs x={700} y={830} w={520} style={{ textAlign: "center", fontSize: 32, fontWeight: 800, color: C.muted }}>the prompt</Abs>
      {Array.from({ length: 10 }, (_, i) => (
        <Doc key={i} x={lerp(160, 760 + (i % 5) * 80, fill)} y={lerp(300, 300 + Math.floor(i / 5) * 110, fill)} w={66} h={86} style={{ opacity: f > 20 + i * 2 ? 1 : 0 }} />
      ))}
      <Abs x={160} y={240} w={400} style={{ fontSize: 34, fontWeight: 700, color: C.muted, opacity: 1 - fill }}>40-page refund policy</Abs>
      <Abs x={1300} y={420} w={520} style={{ ...card(C.green), padding: 26, fontSize: 34, fontWeight: 700, ...rise(f, 70), opacity: (during(t, 0) + during(t, 1)) * enter(f, 70) }}>
        ✓ correct, and it quotes page 4
      </Abs>
      {t.step === 1 && (
        <Abs x={1300} y={600} w={540} style={{ ...rise(f, at(t, 1)) }}>
          <Chip color={C.amber} style={{ fontSize: 28 }}>small & rarely changes → just paste it</Chip>
        </Abs>
      )}
      {t.step >= 2 &&
        Array.from({ length: 80 }, (_, i) => {
          const st = at(t, 2) + i * 1.2;
          const p = clamp01((f - st) / 22);
          const inside = i < 20;
          return <Doc key={`a${i}`} x={inside ? 720 + (i % 5) * 96 : lerp(960, 300 + rnd(i) * 1300, p)} y={inside ? lerp(-100, 520 + Math.floor(i / 5) * 60, p) : lerp(-100, 700 + rnd(i + 3) * 300, p)} w={60} h={78} color={inside ? "#e8ecf3" : "#ffb3b3"} style={{ opacity: p > 0 ? 1 : 0, transform: `rotate(${inside ? 0 : (rnd(i) - 0.5) * 120 * p}deg)` }} />;
        })}
      {t.step >= 2 && (
        <Abs x={0} y={150} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 2) + 30) }}>
          <Big size={60} color={C.red}>12,000 documents won't fit</Big>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ keyword search

export const Keyword = ({ t }: CP) => {
  const f = t.frame;
  const q = t.step >= 2 ? "eggs broken on arrival, can they get money back?" : t.step >= 1 ? "ERR_SLOT_EXPIRED" : "";
  const typedQ = q.slice(0, Math.max(0, Math.floor((f - at(t, t.step >= 2 ? 2 : 1) - 4) * 1.5)));
  const docs = ["Delivery slot runbook", "ERR_SLOT_EXPIRED: slot held > 10 min", "Bakery refund rules", "Franchise onboarding", "Dark store opening hours", "Damaged items policy"];
  const qWords = ["eggs", "broken", "on arrival,", "can they get", "money back?"];
  const pWords = ["Damaged items", "reported within 24 hours", "get a", "full refund."];
  const pairs: [number, number][] = [[1, 0], [4, 3], [2, 1]];
  return (
    <>
      <Abs x={260} y={150} w={1040} style={{ ...card(C.blue), padding: "20px 30px", fontSize: 40, fontFamily: MONO, display: "flex", gap: 20, alignItems: "center", ...rise(f, 4) }}>
        🔎 <span>{typedQ}</span>
        <span style={{ opacity: Math.floor(f / 15) % 2 ? 1 : 0, color: C.blue }}>|</span>
      </Abs>
      {t.step < 3 && (
        <div style={{ opacity: 1 - from(t, 3) }}>
          {docs.map((d, i) => {
            const hit = t.step === 1 && i === 1 && f > at(t, 1) + 50;
            const scanning = t.step >= 1 && Math.floor((f - at(t, 1)) / 6) % docs.length === i && !hit && t.step === 1;
            const miss = t.step === 2 && f > at(t, 2) + 70;
            return (
              <Abs key={d} x={260 + (i % 3) * 470} y={330 + Math.floor(i / 3) * 200} w={440} h={160} style={{ ...card(hit ? C.green : scanning ? C.blue : C.line), padding: 24, fontSize: 30, fontWeight: 600, background: hit ? `${C.green}22` : C.card, opacity: miss ? 0.35 : enter(f, 10 + i * 5), ...(hit ? { boxShadow: `0 0 40px ${C.green}` } : {}) }}>
                📄 {d}
              </Abs>
            );
          })}
          {t.step === 2 && f > at(t, 2) + 70 && (
            <Abs x={0} y={760} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 2) + 70) }}>
              <Big size={52} color={C.red}>no document shares these words…</Big>
            </Abs>
          )}
        </div>
      )}
      {t.step >= 3 && (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {qWords.map((w, i) => (
            <g key={`q${i}`} opacity={enter(f, at(t, 3) + i * 4)}>
              <rect x={150 + i * 330} y={360} width={300} height={80} rx={14} fill={C.card} stroke={C.blue} strokeWidth={3} />
              <text x={300 + i * 330} y={410} textAnchor="middle" fontSize={32} fontWeight={700} fill={C.text}>{w}</text>
            </g>
          ))}
          {pWords.map((w, i) => (
            <g key={`p${i}`} opacity={enter(f, at(t, 3) + 20 + i * 4)}>
              <rect x={150 + i * 420} y={640} width={390} height={80} rx={14} fill={C.card} stroke={C.green} strokeWidth={3} />
              <text x={345 + i * 420} y={690} textAnchor="middle" fontSize={32} fontWeight={700} fill={C.text}>{w}</text>
            </g>
          ))}
          <text x={960} y={560} textAnchor="middle" fontSize={44} fontWeight={900} fill={C.red} opacity={t.step === 3 ? enter(f, at(t, 3) + 50) : 0}>0 words in common ✗</text>
          {t.step >= 4 &&
            pairs.map(([qi, pi], k) => {
              const p = ease(f, at(t, 4) + k * 20, 24);
              const x1 = 300 + qi * 330;
              const x2 = 345 + pi * 420;
              return <path key={k} d={`M${x1},440 C${x1},540 ${x2},540 ${x2},640`} stroke={C.amber} strokeWidth={5} strokeDasharray="12 10" fill="none" opacity={p} />;
            })}
          {t.step >= 4 && (
            <text x={960} y={850} textAnchor="middle" fontSize={40} fontWeight={800} fill={C.amber} opacity={enter(f, at(t, 4) + 70)}>
              same meaning, different spelling
            </text>
          )}
        </svg>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the map of meaning

const SPOTS = [
  { label: "refund within 24h", x: 0.78, y: 0.22, g: 0 },
  { label: "money back deadline", x: 0.7, y: 0.32, g: 0 },
  { label: "damaged items policy", x: 0.74, y: 0.6, g: 1 },
  { label: "spoilt goods refund", x: 0.84, y: 0.7, g: 1 },
  { label: "slot moved twice", x: 0.18, y: 0.24, g: 2 },
  { label: "order arrived late", x: 0.28, y: 0.34, g: 2 },
  { label: "dark store stock", x: 0.2, y: 0.74, g: 3 },
];

export const MeaningMap = ({ t }: CP) => {
  const f = t.frame;
  const box = { x: 260, y: 170, w: 1400, h: 700 };
  const P = (s: { x: number; y: number }) => ({ x: box.x + s.x * box.w, y: box.y + s.y * box.h });
  const q = { x: 0.69, y: 0.7 };
  const qIn = t.step >= 3 ? ease(f, at(t, 3), 30) : 0;
  const qp = P(q);
  const radar = t.step >= 4 ? ease(f, at(t, 4), 40) : 0;
  const near = [2, 3];
  const groups = [C.green, C.pink, C.blue, C.amber];
  return (
    <>
      <Abs x={box.x} y={box.y} w={box.w} h={box.h} style={{ borderRadius: 30, background: C.bg2, border: `2px solid ${C.line}`, backgroundImage: `linear-gradient(${C.line}55 1px, transparent 1px), linear-gradient(90deg, ${C.line}55 1px, transparent 1px)`, backgroundSize: "70px 70px", opacity: enter(f, 2) }} />
      {t.step >= 1 &&
        [
          [0.74, 0.27, "money & deadlines"],
          [0.79, 0.65, "damaged goods"],
          [0.23, 0.29, "delivery timing"],
        ].map(([x, y, n], i) => {
          const c = P({ x: x as number, y: y as number });
          return (
            <div key={i} style={{ position: "absolute", left: c.x - 230, top: c.y - 110, width: 460, height: 220, borderRadius: 999, background: `${groups[i === 2 ? 2 : i]}12`, border: `2px dashed ${groups[i === 2 ? 2 : i]}66`, opacity: enter(f, at(t, 1) + i * 15) }}>
              <div style={{ position: "absolute", top: -36, width: "100%", textAlign: "center", fontSize: 24, fontWeight: 800, color: groups[i === 2 ? 2 : i] }}>{n}</div>
            </div>
          );
        })}
      {SPOTS.map((s, i) => {
        const p = P(s);
        const lit = radar > 0.5 && near.includes(i);
        const sc = Math.min(1, pop(f, 12 + i * 7));
        return (
          <div key={s.label} style={{ position: "absolute", left: p.x - 12, top: p.y - 12, transform: `scale(${sc})` }}>
            <div style={{ width: 24, height: 24, borderRadius: 999, background: groups[s.g], boxShadow: lit ? `0 0 30px ${groups[s.g]}` : "none" }} />
            <div style={{ position: "absolute", left: 34, top: -10, whiteSpace: "nowrap", fontSize: lit ? 34 : 28, fontWeight: lit ? 900 : 600, color: lit ? C.text : C.muted }}>{s.label}</div>
          </div>
        );
      })}
      {t.step === 2 && (
        <Abs x={300} y={790} w={1320} style={{ display: "flex", alignItems: "center", gap: 24, ...rise(f, at(t, 2)) }}>
          <div style={{ ...card(C.green), padding: "14px 22px", fontSize: 30, fontWeight: 700 }}>“refund within 24h”</div>
          <div style={{ fontSize: 40 }}>→</div>
          <div style={{ fontFamily: MONO, fontSize: 32, color: C.green }}>[0.82, −0.13, 0.44, 0.07, … 768 numbers]</div>
        </Abs>
      )}
      {qIn > 0 && (
        <>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {radar > 0 && <circle cx={qp.x} cy={qp.y} r={30 + radar * 170} fill={`${C.amber}10`} stroke={C.amber} strokeWidth={4} strokeDasharray="10 8" opacity={1 - 0.3 * radar} />}
            {radar > 0.5 &&
              near.map((i) => {
                const p = P(SPOTS[i]);
                return <line key={i} x1={qp.x} y1={qp.y} x2={p.x} y2={p.y} stroke={C.amber} strokeWidth={4} opacity={enter(f, at(t, 4) + 26)} />;
              })}
          </svg>
          <div style={{ position: "absolute", left: qp.x - 26, top: lerp(qp.y - 500, qp.y, qIn) - 26, fontSize: 52, lineHeight: 1, transform: `scale(${1 + 0.3 * Math.sin(clamp01((f - at(t, 3) - 30) / 14) * Math.PI)})` }}>⭐</div>
          <Abs x={qp.x - 520} y={qp.y + 40} w={480} style={{ textAlign: "right", fontSize: 32, fontWeight: 800, color: C.amber, opacity: enter(f, at(t, 3) + 30) }}>“eggs broken, money back?”</Abs>
        </>
      )}
      {t.step >= 5 && (
        <Abs x={0} y={890} w={1920} style={{ textAlign: "center", fontSize: 30, color: C.muted, ...rise(f, at(t, 5)) }}>real maps have hundreds of directions, not two</Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ contrastive learning as magnets

export const Magnets = ({ t }: CP) => {
  const f = t.frame;
  const pairs = [
    ["refund for spoiled milk?", "dairy refund within 24h", C.blue],
    ["change my delivery slot", "slots move until 2h before", C.green],
    ["dark store hours?", "open 6am to 1am", C.pink],
  ] as const;
  const pull = t.step >= 2 ? ease(f, at(t, 2), 50) : 0;
  return (
    <>
      <Abs x={0} y={150} w={1920} style={{ textAlign: "center", ...rise(f, 4), opacity: during(t, 0) }}>
        <Big size={64}>How does it learn the map? 🧲</Big>
      </Abs>
      {t.step >= 1 && t.step < 4 &&
        pairs.map(([q, a, col], i) => {
          const qx = lerp(220 + i * 520, 300 + i * 520, pull);
          const ax = lerp(1440 - i * 520, 300 + i * 520, pull);
          const ay = lerp(760 - i * 40, 520, pull);
          const qy = lerp(320 + i * 60, 420, pull);
          const hard = t.step >= 3 && i === 0;
          return (
            <div key={i} style={{ opacity: enter(f, at(t, 1) + i * 12) }}>
              <Abs x={qx} y={qy} w={420} style={{ ...card(col), padding: "16px 20px", fontSize: 28, fontWeight: 700 }}>Q: {q}</Abs>
              <Abs x={ax} y={ay} w={420} style={{ ...card(col), padding: "16px 20px", fontSize: 28, fontWeight: 600, background: `${col}22` }}>A: {a}</Abs>
              {hard && (
                <Abs x={lerp(300, 120, ease(f, at(t, 3) + 30, 40))} y={lerp(640, 760, ease(f, at(t, 3) + 30, 40))} w={420} style={{ ...card(C.red), padding: "16px 20px", fontSize: 28, fontWeight: 600, ...rise(f, at(t, 3)) }}>
                  ✗ bakery refund within 6h
                  <div style={{ fontSize: 22, color: C.red }}>look-alike wrong answer: pushed away</div>
                </Abs>
              )}
            </div>
          );
        })}
      {t.step === 2 && (
        <Abs x={0} y={820} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 2) + 40) }}>
          <Big size={52} color={C.amber}>pull pairs together · push the rest apart · repeat millions of times</Big>
        </Abs>
      )}
      {t.step >= 4 && (
        <div style={{ opacity: from(t, 4) }}>
          {["Model A's map", "Model B's map"].map((n, k) => (
            <Abs key={n} x={260 + k * 760} y={250} w={640} h={460} style={{ ...card(k ? C.purple : C.blue), padding: 20 }}>
              <div style={{ fontSize: 30, fontWeight: 800 }}>{n}</div>
              {Array.from({ length: 7 }, (_, i) => (
                <div key={i} style={{ position: "absolute", left: 60 + rnd(i + k * 31) * 500, top: 90 + rnd(i * 7 + k * 13) * 320, width: 22, height: 22, borderRadius: 999, background: PALETTE[i] }} />
              ))}
            </Abs>
          ))}
          <Abs x={0} y={760} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 4) + 30) }}>
            <Big size={48} color={C.red}>different maps can't mix → re-embed everything</Big>
          </Abs>
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ chunking

export const Chunker = ({ t }: CP) => {
  const f = t.frame;
  const box = { x: 900, y: 200, w: 900, h: 620 };
  const blob = { x: box.x + box.w / 2, y: box.y + box.h / 2 };
  const qs = [
    [0.15, 0.2],
    [0.85, 0.18],
    [0.2, 0.82],
    [0.82, 0.8],
  ];
  const cut = t.step >= 2 ? ease(f, at(t, 2) + 10, 40) : 0;
  const sizes = [
    ["200", 71],
    ["400", 84],
    ["800", 76],
  ] as const;
  return (
    <>
      {t.step < 3 && (
        <div style={{ opacity: 1 - from(t, 3) }}>
          <Abs x={box.x} y={box.y} w={box.w} h={box.h} style={{ borderRadius: 30, background: C.bg2, border: `2px solid ${C.line}` }} />
          {qs.map(([x, y], i) => (
            <div key={i} style={{ position: "absolute", left: box.x + x * box.w - 14, top: box.y + y * box.h - 14, fontSize: 30, opacity: enter(f, 20 + i * 6) }}>⭐</div>
          ))}
          {t.step >= 1 && (
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
              {qs.map(([x, y], i) => (
                <line key={i} x1={blob.x} y1={blob.y} x2={box.x + x * box.w} y2={box.y + y * box.h} stroke={C.muted} strokeWidth={2} strokeDasharray="6 8" opacity={enter(f, at(t, 1) + i * 6) * (1 - cut)} />
              ))}
            </svg>
          )}
          <div style={{ position: "absolute", left: blob.x - 120, top: blob.y - 120, width: 240, height: 240, borderRadius: 999, background: `radial-gradient(circle, ${C.amber}aa, ${C.amber}00 70%)`, filter: "blur(6px)", opacity: (1 - cut) * enter(f, 30) }} />
          <Abs x={blob.x - 200} y={blob.y + 120} w={400} style={{ textAlign: "center", fontSize: 28, fontWeight: 700, color: C.amber, opacity: 1 - cut }}>whole policy = one blurry spot</Abs>
          {/* the document being cut into cards */}
          {Array.from({ length: 6 }, (_, i) => {
            const tx = box.x + [0.18, 0.8, 0.25, 0.75, 0.5, 0.45][i] * box.w;
            const ty = box.y + [0.28, 0.25, 0.72, 0.7, 0.18, 0.86][i] * box.h;
            return (
              <div key={i} style={{ position: "absolute", left: lerp(200, tx - 60, cut), top: lerp(300 + i * 4, ty - 40, cut), width: lerp(400, 120, cut), height: lerp(500, 80, cut), borderRadius: 10, background: i === 0 || cut > 0.05 ? "#f4f1e8" : "transparent", border: cut > 0.05 ? `3px solid ${PALETTE[i]}` : "none", opacity: i === 0 || cut > 0.05 ? enter(f, 6) : 0, boxShadow: "0 8px 20px rgba(0,0,0,.4)", color: "#333", fontSize: lerp(30, 16, cut), fontWeight: 700, padding: 10, overflow: "hidden" }}>
                {cut < 0.05 ? "Refund policy (40 pages)" : ["dairy", "bakery", "frozen", "fees", "fraud", "disputes"][i]}
              </div>
            );
          })}
          {t.step === 2 && (
            <Abs x={150} y={150} w={700} style={{ fontSize: 46, fontWeight: 800, ...rise(f, at(t, 2)) }}>✂️ one idea per card</Abs>
          )}
        </div>
      )}
      {t.step === 3 && (
        <div style={{ opacity: during(t, 3) }}>
          <Abs x={200} y={260} w={700} h={460} style={{ background: "#f4f1e8", borderRadius: 14, padding: 24, color: "#555", fontSize: 18, lineHeight: 1.6, overflow: "hidden", ...rise(f, at(t, 3)) }}>
            {"Refunds for dairy… bakery items… frozen food must… delivery fees are… disputes go to… fraud checks… ".repeat(8)}
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, background: C.red, color: "#fff", fontSize: 30, fontWeight: 800, textAlign: "center" }}>too big: blurry again</div>
          </Abs>
          <Abs x={1020} y={360} w={700} style={{ ...rise(f, at(t, 3) + 40) }}>
            <div style={{ background: "#f4f1e8", borderRadius: 14, padding: 30, color: "#222", fontSize: 40, fontWeight: 700 }}>“The limit is 24 hours.”</div>
            <div style={{ fontSize: 44, fontWeight: 800, color: C.red, marginTop: 30, ...rise(f, at(t, 3) + 90) }}>too small: the limit on what? 🤔</div>
          </Abs>
        </div>
      )}
      {t.step >= 4 && (
        <div style={{ opacity: during(t, 4) }}>
          <Abs x={360} y={330} w={1200} style={{ background: "#f4f1e8", borderRadius: 18, overflow: "hidden", color: "#222", ...rise(f, at(t, 4)) }}>
            <div style={{ background: C.green, color: "#06101f", padding: "16px 30px", fontSize: 32, fontWeight: 800, transform: `translateY(${(1 - ease(f, at(t, 4) + 30, 20)) * -80}px)` }}>Refund policy › Damaged items › Dairy</div>
            <div style={{ padding: 30, fontSize: 40, fontWeight: 600 }}>The limit is 24 hours from delivery.</div>
          </Abs>
          <Abs x={0} y={680} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 4) + 60) }}>
            <Big size={50} color={C.green}>the heading travels with the card ✓</Big>
          </Abs>
        </div>
      )}
      {t.step >= 5 && (
        <div style={{ opacity: from(t, 5) }}>
          <Abs x={0} y={200} w={1920} style={{ textAlign: "center" }}>
            <Big size={52}>right passage found, on 80 real questions</Big>
          </Abs>
          {sizes.map(([s, v], i) => (
            <Abs key={s} x={400} y={340 + i * 140} w={1200} style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{ width: 200, fontSize: 34, fontWeight: 700 }}>{s} tokens</div>
              <div style={{ height: 70, width: v * 9 * ease(f, at(t, 5) + i * 10, 30), background: s === "400" ? C.green : C.line, borderRadius: 12 }} />
              <div style={{ fontSize: 36, fontWeight: 800, color: s === "400" ? C.green : C.muted }}>{v}%</div>
            </Abs>
          ))}
          <Abs x={1350} y={890} w={500} style={{ fontSize: 22, color: C.faint, textAlign: "right" }}>illustrative numbers</Abs>
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ parent-child retrieval

export const ParentChild = ({ t }: CP) => {
  const f = t.frame;
  const hit = t.step >= 1 && f > at(t, 1) + 30;
  const send = t.step >= 1 ? ease(f, at(t, 1) + 70, 40) : 0;
  const kids = ["dairy: reported within 24 h", "photo proof required", "bakery: within 6 h"];
  return (
    <>
      <div style={{ position: "absolute", left: lerp(200, 1020, send), top: 250, width: 720, transform: `scale(${1 - send * 0.1})` }}>
        <div style={{ ...card(hit && send > 0.05 ? C.amber : C.line), padding: 28, background: send > 0.05 ? `${C.amber}14` : C.card, opacity: enter(f, 4) }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.amber }}>Section 3: Damaged items</div>
          {kids.map((k, i) => (
            <div key={k} style={{ marginTop: 18, padding: "16px 22px", borderRadius: 12, fontSize: 30, fontWeight: 600, background: hit && i === 0 ? C.green : C.card2, color: hit && i === 0 ? "#06101f" : C.text, boxShadow: hit && i === 0 && send < 0.1 ? `0 0 30px ${C.green}` : "none" }}>
              {k}
            </div>
          ))}
        </div>
      </div>
      {t.step >= 1 && (
        <Abs x={send > 0.5 ? 200 : 1100} y={send > 0.5 ? 320 : 300} w={620} style={{ ...card(C.blue), padding: "22px 28px", fontSize: 34, fontWeight: 700, ...rise(f, at(t, 1)) }}>
          ⭐ “damaged milk, reported day 2?”
          <div style={{ fontSize: 26, color: C.muted, marginTop: 8 }}>{send > 0.5 ? "→ the whole section goes to the model" : "search the small cards"}</div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={200} y={620} w={620} style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.35, ...rise(f, at(t, 2)) }}>
          precise search ✓<br />
          <span style={{ color: C.amber }}>+ the context around it ✓</span>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the full pipeline

export const Pipeline = ({ t }: CP) => {
  const f = t.frame;
  const lane = (y: number, label: string, col: string, start: number) => (
    <Abs x={60} y={y} w={1800} h={250} style={{ borderRadius: 26, border: `2px dashed ${col}66`, opacity: enter(f, start) }}>
      <div style={{ position: "absolute", left: 24, top: -20, background: C.bg, padding: "0 12px", fontSize: 26, fontWeight: 800, color: col }}>{label}</div>
    </Abs>
  );
  const flow = (x1: number, x2: number, y: number, start: number, col: string) =>
    f > start &&
    [0, 1, 2].map((i) => {
      const p = (((f - start) / 45 + i / 3) % 1);
      return <div key={i} style={{ position: "absolute", left: lerp(x1, x2, p), top: y, width: 16, height: 16, borderRadius: 4, background: col, opacity: Math.sin(p * Math.PI) }} />;
    });
  const s = (i: number) => at(t, i);
  const top = 200;
  const bot = 560;
  return (
    <>
      {t.step >= 1 && lane(top - 20, "OFFLINE · whenever documents change", C.purple, s(1))}
      {t.step >= 1 && (
        <>
          {[["📚", "12,000 docs"], ["✂️", "cut into cards"], ["🗺️", "embed each"]].map(([i, l], k) => (
            <Box key={l} x={120 + k * 400} y={top + 30} w={300} h={150} color={C.purple} label={`${i} ${l}`} style={rise(f, s(1) + k * 12)} />
          ))}
          <Abs x={1320} y={top + 20} w={420} h={170} style={{ ...rise(f, s(1) + 40) }}>
            <svg width={420} height={170}>
              <ellipse cx={210} cy={30} rx={190} ry={26} fill={C.card2} stroke={C.purple} strokeWidth={4} />
              <rect x={20} y={30} width={380} height={110} fill={C.card2} />
              <ellipse cx={210} cy={140} rx={190} ry={26} fill={C.card2} stroke={C.purple} strokeWidth={4} />
              <line x1={20} y1={30} x2={20} y2={140} stroke={C.purple} strokeWidth={4} />
              <line x1={400} y1={30} x2={400} y2={140} stroke={C.purple} strokeWidth={4} />
              <text x={210} y={100} textAnchor="middle" fontSize={32} fontWeight={800} fill={C.text}>vector index</text>
            </svg>
          </Abs>
          {flow(420, 520, top + 98, s(1) + 20, C.purple)}
          {flow(820, 920, top + 98, s(1) + 30, C.purple)}
          {flow(1220, 1320, top + 98, s(1) + 40, C.purple)}
        </>
      )}
      {t.step >= 2 && lane(bot - 20, "ONLINE · every question", C.blue, s(2))}
      {t.step >= 2 && (
        <>
          <Box x={110} y={bot + 30} w={280} h={150} color={C.blue} label="⭐ question" sub="embedded the same way" style={rise(f, s(2))} />
          <Abs x={450} y={bot + 20} w={330} h={170} style={{ ...rise(f, s(2) + 20) }}>
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i} style={{ position: "absolute", left: (i % 10) * 30, top: Math.floor(i / 10) * 70 + 10, width: 24, height: 50, borderRadius: 4, background: "#e8ecf3", opacity: enter(f, s(2) + 30 + i * 1.5, 6) }} />
            ))}
            <div style={{ position: "absolute", top: 140, fontSize: 26, fontWeight: 800 }}>20 nearest cards</div>
          </Abs>
          {flow(390, 450, bot + 98, s(2) + 10, C.blue)}
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: enter(f, s(2) + 10) }}>
            <line x1={1530} y1={top + 190} x2={600} y2={bot + 20} stroke={C.purple} strokeWidth={3} strokeDasharray="8 8" />
          </svg>
        </>
      )}
      {t.step >= 3 && (
        <>
          <Box x={830} y={bot + 30} w={260} h={150} color={C.amber} label="🎯 reranker" sub="best 5" style={rise(f, s(3))} />
          {flow(770, 830, bot + 98, s(3) + 10, C.amber)}
        </>
      )}
      {t.step >= 4 && (
        <>
          <Abs x={1140} y={bot + 20} w={330} h={180} style={{ ...card(C.green), padding: 16, fontSize: 22, fontFamily: MONO, lineHeight: 1.4, ...rise(f, s(4)) }}>
            <div style={{ color: C.amber }}>rules first</div>
            <div style={{ color: C.green }}>[refund-v4:p4] …</div>
            <div style={{ color: C.green }}>[faq-12] …</div>
            <div style={{ color: C.blue }}>question last</div>
          </Abs>
          {flow(1090, 1140, bot + 98, s(4) + 10, C.green)}
        </>
      )}
      {t.step >= 5 && (
        <>
          <Abs x={1520} y={bot + 20} w={330} h={180} style={{ ...card(C.green), padding: 18, fontSize: 26, fontWeight: 600, ...rise(f, s(5)) }}>
            Bakery: refundable within 6 h.
            <div style={{ marginTop: 10 }}>
              <span style={{ background: C.green, color: "#06101f", borderRadius: 8, padding: "2px 10px", fontFamily: MONO, fontSize: 22, boxShadow: `0 0 ${20 + 10 * Math.sin(f / 6)}px ${C.green}` }}>[refund-v4:p4]</span>
            </div>
          </Abs>
          {flow(1470, 1520, bot + 98, s(5) + 10, C.green)}
        </>
      )}
      {t.step === 0 && (
        <Abs x={0} y={420} w={1920} style={{ textAlign: "center", ...rise(f, 4) }}>
          <Big size={64}>two machines, at two different times</Big>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ stale versions

export const Versions = ({ t }: CP) => {
  const f = t.frame;
  const v3gone = t.step >= 3 ? ease(f, at(t, 3) + 20, 30) : 0;
  return (
    <>
      <Abs x={200} y={220} w={760} h={560} style={{ ...card(C.line), padding: 30, opacity: enter(f, 4) }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: C.muted }}>the index</div>
        {[0, 1, 2].map((i) => (
          <div key={`v3${i}`} style={{ marginTop: 14, padding: "14px 20px", borderRadius: 10, background: C.card2, fontSize: 28, fontWeight: 600, opacity: 1 - v3gone, transform: `translateX(${v3gone * -60}px) rotate(${v3gone * (i - 1) * 8}deg)` }}>
            refund policy <b style={{ color: C.amber }}>v3</b> · card {i + 1}
          </div>
        ))}
        {t.step >= 1 &&
          [0, 1, 2].map((i) => (
            <div key={`v4${i}`} style={{ marginTop: 14, padding: "14px 20px", borderRadius: 10, background: `${C.green}22`, border: `2px solid ${C.green}`, fontSize: 28, fontWeight: 600, ...rise(f, at(t, 1) + i * 8) }}>
              refund policy <b style={{ color: C.green }}>v4</b> · card {i + 1}
            </div>
          ))}
      </Abs>
      {t.step === 1 && (
        <Abs x={1050} y={420} w={760} style={{ ...rise(f, at(t, 1) + 40) }}>
          <Big size={48}>…and the old cards? <span style={{ color: C.red }}>still there</span></Big>
        </Abs>
      )}
      {t.step === 2 && (
        <Abs x={1050} y={340} w={760} style={{ ...card(C.red), padding: 30, fontSize: 36, fontWeight: 600, lineHeight: 1.4, ...rise(f, at(t, 2)) }}>
          Bakery: <span style={{ background: `${C.amber}44`, padding: "0 6px" }}>12 h (v3)</span>… or <span style={{ background: `${C.green}44`, padding: "0 6px" }}>6 h (v4)</span>?
          <div style={{ color: C.red, fontSize: 30, marginTop: 10, fontWeight: 800 }}>answers quietly mix versions</div>
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={1050} y={320} w={760} style={{ ...rise(f, at(t, 3)) }}>
          <div style={{ ...card(C.green), padding: 28, fontSize: 36, fontWeight: 700 }}>✓ every update: add the new <b>and</b> delete the old, in one step</div>
          <div style={{ ...card(C.red), padding: 28, fontSize: 34, fontWeight: 700, marginTop: 24, ...rise(f, at(t, 3) + 60) }}>🔓 deleted doc still searchable = a data leak</div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ when RAG is the wrong tool

export const NotRag = ({ t }: CP) => {
  const f = t.frame;
  const lanes = [
    ["📖 RAG", C.green],
    ["📋 paste in prompt", C.blue],
    ["🔌 ask the live system", C.amber],
    ["🧮 database query", C.purple],
  ] as const;
  const items: [string, number, number][] = [
    ["large, changing facts", 0, 1],
    ["small, fixed facts", 1, 1],
    ["today's stock levels", 2, 2],
    ["how many refunds last week?", 3, 3],
  ];
  return (
    <>
      <Abs x={0} y={150} w={1920} style={{ textAlign: "center", ...rise(f, 4) }}>
        <Big size={56}>why RAG… and not something else?</Big>
      </Abs>
      {lanes.map(([l, col], i) => (
        <Abs key={l} x={130 + i * 430} y={700} w={380} h={170} style={{ ...card(col), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 800, color: col, opacity: enter(f, 10 + i * 6) }}>
          {l}
        </Abs>
      ))}
      {items.map(([txt, lane, step], i) => {
        const st = at(t, step) + (i === 1 ? 50 : 0);
        const p = ease(f, st + 20, 30);
        return (
          <Abs key={txt} x={lerp(760, 140 + lane * 430, p)} y={lerp(330, 560, p)} w={400} style={{ ...card(lanes[lane][1]), padding: "16px 20px", fontSize: 28, fontWeight: 700, textAlign: "center", opacity: f < st ? 0 : 1 }}>
            {txt}
          </Abs>
        );
      })}
      {t.step >= 3 && (
        <Abs x={0} y={300} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 3) + 60) }}>
          <Big size={46} color={C.purple}>search finds documents; it can't count records</Big>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the complaints that lead to chapter 3

export const Complaints = ({ t }: CP) => {
  const f = t.frame;
  const c = [
    ["🐢", "It's slow", "every question × 2,000,000 cards"],
    ["🏙️", "Bengaluru-North: 0 results", "for its own documents"],
    ["🔢", "ERR_SLOT_EXPIRED → vague answers", "exact match got lost"],
  ];
  return (
    <>
      <Abs x={0} y={160} w={1920} style={{ textAlign: "center", ...rise(f, 4), opacity: (1 - 0.6 * from(t, 1)) * enter(f, 4) }}>
        <Big size={60}>Ask FreshCart is live 🎉</Big>
      </Abs>
      {c.map(([icon, h, sub], i) => {
        const st = at(t, i + 1);
        const p = Math.min(1, pop(f, st));
        return (
          <Abs key={h} x={260} y={290 + i * 170} w={1400} style={{ ...card(C.red), padding: "22px 34px", display: "flex", alignItems: "center", gap: 30, opacity: p, transform: `translateX(${(1 - p) * 200}px) rotate(${(1 - p) * 4}deg)` }}>
            <div style={{ fontSize: 64 }}>{icon}</div>
            <div>
              <div style={{ fontSize: 40, fontWeight: 800 }}>{h}</div>
              <div style={{ fontSize: 28, color: C.muted }}>{sub}</div>
            </div>
            {i === 0 && t.step >= 1 && <div style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 34, color: C.red }}>{Math.min(2000000, Math.round(clamp01((f - st) / 60) * 2000000)).toLocaleString("en-US")}</div>}
          </Abs>
        );
      })}
      {t.step >= 4 && (
        <Abs x={0} y={820} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 4)) }}>
          <Big size={44} color={C.amber}>⏸ how would you fix each one?</Big>
        </Abs>
      )}
    </>
  );
};
