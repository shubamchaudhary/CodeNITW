// Motion-first scenes for the story-style lectures: each idea is something
// moving on screen (a wheel that spins, bricks that fall, a light that
// points), with as little text as possible.
import type { CSSProperties, ReactNode } from "react";
import type { Clock } from "../lib/timeline.ts";
import { C, DEVA, MONO, PALETTE } from "../lib/theme.ts";
import { ease, enter, lerp, pop, rise, softmax } from "../lib/anim.ts";
import { Abs, card, Chip } from "./ui.tsx";

type CP = { t: Clock; props?: Record<string, unknown> };
export const at = (t: Clock, i: number) => (i <= 0 ? 4 : (t.beats[i]?.stepStart ?? Infinity));
// 1 while the scene is on step i, fading in and out around it.
export const during = (t: Clock, i: number, last = false) => {
  const a = i === 0 ? 1 : enter(t.frame, at(t, i), 14);
  return Math.max(0, a - (last ? 0 : enter(t.frame, at(t, i + 1), 12)));
};
export const from = (t: Clock, i: number) => (i === 0 ? 1 : enter(t.frame, at(t, i), 14));
export const rnd = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const Big = ({ children, color = C.text, size = 72, style }: { children: ReactNode; color?: string; size?: number; style?: CSSProperties }) => (
  <div style={{ fontSize: size, fontWeight: 800, color, letterSpacing: -1, lineHeight: 1.15, ...style }}>{children}</div>
);

// ------------------------------------------------------------------ hook

export const Hook = ({ t }: CP) => {
  const f = t.frame;
  const answer = "Frozen items can be refunded within 48 hours if they arrive thawed. Just send a photo of the packaging.";
  const typed = answer.slice(0, Math.max(0, Math.floor((f - at(t, 1) - 10) * 1.6)));
  const s2 = at(t, 2);
  const shake = f >= s2 && f < s2 + 14 ? Math.sin((f - s2) * 2.2) * (14 - (f - s2)) : 0;
  const shrink = ease(f, at(t, 3), 30);
  return (
    <>
      <Abs x={360} y={170} w={1200} h={560} style={{ transform: `translate(${shake}px, ${-shrink * 70}px) scale(${1 - shrink * 0.25})`, ...card(), background: C.bg2, padding: 40, display: "flex", flexDirection: "column", gap: 26, opacity: enter(f, 2) }}>
        <div style={{ alignSelf: "flex-end", background: C.blue, color: "#06101f", borderRadius: 26, borderBottomRightRadius: 6, padding: "18px 28px", fontSize: 36, fontWeight: 600, transform: `scale(${Math.min(1, pop(f, 8))})` }}>
          What's the refund window for frozen food?
        </div>
        {f >= at(t, 1) && (
          <div style={{ alignSelf: "flex-start", maxWidth: 900, background: C.card2, borderRadius: 26, borderBottomLeftRadius: 6, padding: "18px 28px", fontSize: 36, lineHeight: 1.35, color: f >= s2 ? C.red : C.text, textDecoration: f >= s2 + 6 ? "line-through" : "none" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.muted, marginBottom: 6 }}>Chatbot · answered in 0.8 s</div>
            {typed}
            {typed.length < answer.length && <span style={{ color: C.blue }}>▌</span>}
          </div>
        )}
      </Abs>
      {f >= s2 && (
        <Abs x={0} y={470} w={1920} style={{ display: "flex", justifyContent: "center", opacity: 1 - shrink }}>
          <div style={{ border: `9px solid ${C.red}`, color: C.red, fontSize: 92, fontWeight: 900, letterSpacing: 6, padding: "6px 44px", borderRadius: 16, background: "rgba(12,16,24,0.88)", transform: `rotate(-7deg) scale(${2.2 - 1.2 * Math.min(1, pop(f, s2))})`, opacity: enter(f, s2, 5) }}>
            THIS RULE DOESN'T EXIST
          </div>
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={0} y={690} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 3) + 10, 40) }}>
          <Big size={84}>
            How can a machine <span style={{ color: C.amber }}>make things up?</span>
          </Big>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ phone → model

export const Phone2 = ({ t }: CP) => {
  const f = t.frame;
  const typed = "see you".slice(0, Math.max(0, Math.floor((f - 14) / 4)));
  const morph = ease(f, at(t, 2) + 40, 40); // phone becomes the model
  const docs = 46;
  return (
    <>
      {/* echoes: the phone has seen this a million times */}
      {t.step >= 1 &&
        Array.from({ length: 16 }, (_, i) => {
          const a = rnd(i) * Math.PI * 2;
          const d = 330 + rnd(i + 9) * 170;
          const st = at(t, 1) + i * 5;
          return (
            <div key={i} style={{ position: "absolute", left: 960 + Math.cos(a) * d * 1.5 - 130, top: 520 + Math.sin(a) * d * 0.8 - 22, opacity: enter(f, st, 10) * 0.55 * (1 - from(t, 2)), fontSize: 26, fontWeight: 600, background: `${C.blue}33`, color: C.text, borderRadius: 20, padding: "8px 18px", whiteSpace: "nowrap" }}>
              see you tomorrow!
            </div>
          );
        })}
      {t.step === 1 && (
        <Abs x={0} y={870} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 1) + 40) }}>
          <Chip color={C.green} style={{ fontSize: 34 }}>seen it a million times → most likely next word</Chip>
        </Abs>
      )}
      {/* the internet flying in */}
      {t.step >= 2 &&
        Array.from({ length: docs }, (_, i) => {
          const a = rnd(i * 3) * Math.PI * 2;
          const st = at(t, 2) + i * 1.6;
          const p = ease(f, st, 34);
          const x = lerp(960 + Math.cos(a) * 1200, 960, p);
          const y = lerp(540 + Math.sin(a) * 800, 520, p);
          return <div key={i} style={{ position: "absolute", left: x - 24, top: y - 30, width: 48, height: 60, borderRadius: 6, background: "#e8ecf3", opacity: f < st ? 0 : 1 - ease(f, st + 26, 8), transform: `rotate(${(rnd(i) - 0.5) * 90 * (1 - p)}deg)`, boxShadow: "0 6px 14px rgba(0,0,0,.4)" }}><div style={{ margin: "10px 8px", height: 5, background: "#aab", borderRadius: 2 }} /><div style={{ margin: "6px 8px", height: 5, background: "#aab", borderRadius: 2 }} /></div>;
        })}
      {/* phone */}
      <div style={{ position: "absolute", left: 960 - 210, top: 520 - 330, width: 420, height: 660, borderRadius: 54, background: "#05070c", border: `3px solid ${C.line}`, padding: 18, opacity: (1 - morph) * enter(f, 2), transform: `scale(${1 - morph * 0.4})` }}>
        <div style={{ background: C.bg2, borderRadius: 38, height: "100%", position: "relative" }}>
          <div style={{ position: "absolute", left: 16, right: 16, top: 330, background: C.card2, borderRadius: 16, padding: "14px 18px", fontSize: 32 }}>
            {typed}
            <span style={{ opacity: Math.floor(f / 15) % 2 ? 1 : 0, color: C.blue }}>|</span>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 410, display: "flex", justifyContent: "space-around", fontSize: 30, opacity: enter(f, 48) }}>
            <span style={{ color: C.muted }}>soon</span>
            <span style={{ color: C.green, fontWeight: 800, transform: `scale(${1 + 0.25 * Math.sin(clamp01((f - 48) / 18) * Math.PI)})` }}>tomorrow</span>
            <span style={{ color: C.muted }}>later</span>
          </div>
        </div>
      </div>
      {/* the model */}
      {morph > 0 && (
        <div style={{ position: "absolute", left: 960 - 260, top: 520 - 170, width: 520, height: 340, borderRadius: 40, background: `radial-gradient(circle at 50% 40%, ${C.purple}55, ${C.card} 70%)`, border: `4px solid ${C.purple}`, boxShadow: `0 0 ${60 + 30 * Math.sin(f / 9)}px ${C.purple}88`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", opacity: morph, transform: `scale(${0.5 + 0.5 * morph})` }}>
          <div style={{ fontSize: 96, fontWeight: 900, color: C.text }}>LLM</div>
          <div style={{ fontSize: 26, color: C.muted, marginTop: 6 }}>has read most of the internet</div>
        </div>
      )}
      {t.step >= 3 && (
        <>
          <Abs x={120} y={480} w={420} style={{ ...card(C.blue), padding: "20px 26px", fontSize: 34, fontWeight: 700, textAlign: "center", ...rise(f, at(t, 3)) }}>text so far</Abs>
          <Abs x={548} y={498} w={140} style={{ fontSize: 60, color: C.muted, opacity: enter(f, at(t, 3) + 8) }}>→</Abs>
          <Abs x={1240} y={498} w={140} style={{ fontSize: 60, color: C.muted, opacity: enter(f, at(t, 3) + 16) }}>→</Abs>
          {["the", "next", "piece", "of", "text"].map((w, i) => {
            const st = at(t, 3) + 24 + i * 12;
            return (
              <div key={i} style={{ position: "absolute", left: lerp(1260, 1380 + (i % 3) * 150, ease(f, st, 14)), top: 470 + Math.floor(i / 3) * 80, opacity: enter(f, st, 8), ...card(C.green), padding: "10px 20px", fontSize: 34, fontWeight: 700, color: C.green }}>
                {w}
              </div>
            );
          })}
        </>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the quiz and the dials

export const Quiz = ({ t }: CP) => {
  const f = t.frame;
  const s1 = at(t, 1);
  const wrong = f >= s1 + 20 && f < s1 + 70;
  const right = f >= s1 + 70;
  const nudge = (i: number) => (f >= s1 + 40 ? ease(f, s1 + 40, 24) * (rnd(i) - 0.5) * 70 : 0);
  return (
    <>
      <Abs x={0} y={150} w={1920} style={{ textAlign: "center", opacity: during(t, 0) + during(t, 1) + during(t, 2) }}>
        <Big size={56} color={C.muted}>trillions of tiny quizzes</Big>
      </Abs>
      <Abs x={260} y={290} w={1400} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 22, fontSize: 64, fontWeight: 700, opacity: (1 - from(t, 3)) * enter(f, 10) }}>
        The capital of France is
        <div style={{ minWidth: 260, height: 96, borderRadius: 18, border: `4px dashed ${right ? C.green : wrong ? C.red : C.muted}`, display: "flex", alignItems: "center", justifyContent: "center", color: right ? C.green : wrong ? C.red : C.muted, background: right ? `${C.green}22` : wrong ? `${C.red}22` : "transparent" }}>
          {right ? "Paris ✓" : wrong ? "Lyon ✗" : "?"}
        </div>
      </Abs>
      {/* the model and its dials */}
      <Abs x={560} y={470} w={800} h={340} style={{ ...card(C.purple), background: `${C.purple}14`, opacity: (1 - from(t, 3)) * enter(f, 16), display: "flex", flexWrap: "wrap", gap: 24, padding: 36, alignContent: "center", justifyContent: "center" }}>
        {Array.from({ length: t.step >= 2 ? 40 : 8 }, (_, i) => {
          const many = t.step >= 2;
          const size = many ? 56 : 110;
          const rot = (rnd(i + 3) - 0.5) * 200 + nudge(i) + (many ? Math.sin(f / 7 + i) * 25 : 0);
          return (
            <svg key={`${many}-${i}`} width={size} height={size} viewBox="0 0 100 100" style={{ opacity: many ? enter(f, at(t, 2) + i * 1.5, 8) : 1 }}>
              <circle cx={50} cy={50} r={42} fill={C.card2} stroke={C.purple} strokeWidth={6} />
              <line x1={50} y1={50} x2={50 + 34 * Math.sin((rot * Math.PI) / 180)} y2={50 - 34 * Math.cos((rot * Math.PI) / 180)} stroke={C.amber} strokeWidth={9} strokeLinecap="round" />
            </svg>
          );
        })}
      </Abs>
      {t.step === 1 && f >= s1 + 40 && (
        <Abs x={1390} y={600} w={420} style={{ fontSize: 32, color: C.amber, fontWeight: 700, ...rise(f, s1 + 40) }}>← wrong? nudge the dials</Abs>
      )}
      {t.step >= 2 && t.step < 3 && (
        <Abs x={1390} y={590} w={460} style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.3, ...rise(f, at(t, 2) + 20) }}>
          × billions of dials
        </Abs>
      )}
      {t.step >= 3 && (
        <div style={{ opacity: during(t, 3) }}>
          {[
            ["The capital of France is", "Paris", "→ it learned a fact", C.blue],
            ["12 × 4 + 3 = ?  Step 1:", "12 × 4 = 48", "→ it learned to reason", C.purple],
          ].map(([q, a, n, col], i) => (
            <Abs key={i} x={220} y={300 + i * 230} w={1480} style={{ ...card(col), padding: "30px 40px", display: "flex", gap: 24, alignItems: "center", fontSize: 46, fontWeight: 700, ...rise(f, at(t, 3) + i * 40) }}>
              {q} <span style={{ color: col }}>{a}</span>
              <span style={{ marginLeft: "auto", fontSize: 32, color: C.muted }}>{n}</span>
            </Abs>
          ))}
        </div>
      )}
      {t.step >= 4 && (
        <Abs x={0} y={380} w={1920} style={{ textAlign: "center" }}>
          <Big size={80} style={rise(f, at(t, 4))}>Nobody taught it facts.</Big>
          <Big size={52} color={C.green} style={{ marginTop: 30, ...rise(f, at(t, 4) + 50) }}>
            Facts were just useful for guessing the next word.
          </Big>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the one sentence

export const Idea = ({ t }: CP) => {
  const f = t.frame;
  const b = t.beats[1];
  const words = b?.words ?? [];
  return (
    <>
      <Abs x={0} y={200} w={1920} style={{ textAlign: "center", opacity: during(t, 0) }}>
        <Big size={54} color={C.muted}>Remember this one sentence.</Big>
      </Abs>
      {t.step >= 1 && (
        <Abs x={160} y={200} w={1600} style={{ textAlign: "center", opacity: 1 - 0.5 * from(t, 2) }}>
          <div style={{ fontSize: 110, fontWeight: 900, lineHeight: 1.2, letterSpacing: -2 }}>
            {words.map((w, i) => {
              const on = f >= w.f - 2;
              const clean = w.w.toLowerCase().replace(/[^a-z]/g, "");
              const col = clean === "likely" ? C.green : clean === "checked" ? C.red : C.text;
              return (
                <span key={i} style={{ color: on ? col : "transparent", display: "inline-block", transform: `translateY(${on ? 0 : 30}px) scale(${clean === "likely" || clean === "checked" ? 1 + 0.12 * Math.sin(clamp01((f - w.f) / 14) * Math.PI) : 1})`, transition: "none", marginRight: 26 }}>
                  {w.w}
                </span>
              );
            })}
          </div>
        </Abs>
      )}
      {t.step >= 2 && (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: enter(f, at(t, 2) + 10) }}>
          <circle cx={860} cy={760} r={170} fill={`${C.green}33`} stroke={C.green} strokeWidth={5} />
          <circle cx={1060} cy={760} r={170} fill={`${C.blue}33`} stroke={C.blue} strokeWidth={5} />
          <text x={760} y={768} fontSize={40} fontWeight={800} fill={C.green} textAnchor="middle">likely</text>
          <text x={1160} y={768} fontSize={40} fontWeight={800} fill={C.blue} textAnchor="middle">true</text>
          <text x={960} y={768} fontSize={30} fontWeight={700} fill={C.text} textAnchor="middle">usually</text>
          <g opacity={enter(f, at(t, 2) + 60)}>
            <circle cx={720} cy={680} r={14 + 4 * Math.sin(f / 5)} fill={C.red} />
            <text x={600} y={630} fontSize={30} fontWeight={800} fill={C.red} textAnchor="middle">confident nonsense</text>
          </g>
        </svg>
      )}
    </>
  );
};

// ------------------------------------------------------------------ Lego bricks

export const Brick = ({ label, color, w, h = 92, studs = 2, font }: { label: ReactNode; color: string; w: number; h?: number; studs?: number; font?: string }) => (
  <div style={{ position: "relative", width: w, height: h }}>
    <div style={{ position: "absolute", top: -14, left: 0, right: 0, display: "flex", justifyContent: "space-evenly" }}>
      {Array.from({ length: studs }, (_, i) => (
        <div key={i} style={{ width: 30, height: 16, borderRadius: "8px 8px 0 0", background: color, filter: "brightness(1.15)" }} />
      ))}
    </div>
    <div style={{ width: w, height: h, borderRadius: 10, background: color, boxShadow: "inset 0 -10px 0 rgba(0,0,0,.22), 0 10px 20px rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 800, color: "#0b0f17", fontFamily: font ?? MONO }}>
      {label}
    </div>
  </div>
);

export const Bricks = ({ t }: CP) => {
  const f = t.frame;
  const toks = ["Ref", "und", " for", " spoiled", " milk", "?"];
  const ids = [6943, 917, 329, 34781, 7545, 30];
  const ws = toks.map((s) => Math.max(110, s.trim().length * 30 + 60));
  const gap = 26;
  const total = ws.reduce((a, b) => a + b + gap, -gap);
  let x = (1920 - total) / 2;
  const xs = ws.map((w) => {
    const l = x;
    x += w + gap;
    return l;
  });
  const split = ease(f, at(t, 0) + 40, 30);
  const flip = ease(f, at(t, 2) + 10, 20);
  return (
    <>
      <Abs x={0} y={220} w={1920} style={{ textAlign: "center", opacity: 1 - split }}>
        <div style={{ display: "inline-block", ...card(), padding: "20px 50px", fontSize: 64, fontWeight: 700 }}>Refund for spoiled milk?</div>
      </Abs>
      {toks.map((tk, i) => {
        const drop = ease(f, at(t, 0) + 46 + i * 6, 22);
        const y = lerp(230, 430, drop) + (drop < 1 ? 0 : 0);
        const showId = flip > 0.5;
        return (
          <div key={i} style={{ position: "absolute", left: xs[i], top: y, opacity: split, transform: `rotateX(${flip * 180}deg)`, transformStyle: "preserve-3d" }}>
            <div style={{ transform: showId ? "rotateX(180deg)" : "none" }}>
              <Brick w={ws[i]} color={PALETTE[i % PALETTE.length]} label={showId ? ids[i] : tk.trim()} />
            </div>
          </div>
        );
      })}
      {t.step === 1 && (
        <>
          <Abs x={xs[0]} y={560} w={xs[1] + ws[1] - xs[0]} style={{ borderTop: `5px solid ${C.pink}`, textAlign: "center", paddingTop: 12, fontSize: 32, fontWeight: 800, color: C.pink, ...rise(f, at(t, 1) + 10) }}>1 word → 2 bricks</Abs>
          <Abs x={xs[4] - 20} y={560} w={ws[4] + 40} style={{ borderTop: `5px solid ${C.green}`, textAlign: "center", paddingTop: 12, fontSize: 32, fontWeight: 800, color: C.green, ...rise(f, at(t, 1) + 40) }}>1 brick</Abs>
        </>
      )}
      {t.step >= 2 && (
        <Abs x={0} y={600} w={1920} style={{ textAlign: "center", fontSize: 38, color: C.muted, fontWeight: 600, ...rise(f, at(t, 2) + 30) }}>
          what the model actually receives: <span style={{ color: C.text, fontFamily: MONO }}>{ids.join("  ")}</span>
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={0} y={740} w={1920} style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 30, ...rise(f, at(t, 3)) }}>
          <div style={{ display: "flex", gap: 8 }}>
            {[0, 1, 2, 3].map((i) => <Brick key={i} w={70} h={56} studs={1} color={PALETTE[i]} label="" />)}
          </div>
          <div style={{ fontSize: 48, fontWeight: 800 }}>≈</div>
          <div style={{ fontSize: 48, fontWeight: 800 }}>3 words</div>
          <Chip color={C.amber} style={{ fontSize: 30, marginLeft: 30 }}>100 tokens ≈ 75 words</Chip>
        </Abs>
      )}
    </>
  );
};

export const BrickCost = ({ t }: CP) => {
  const f = t.frame;
  const tower = (n: number, x: number, col: string, label: string, sentence: string, font: string | undefined, start: number) => (
    <>
      <Abs x={x - 300} y={150} w={600} style={{ textAlign: "center", fontSize: 34, fontWeight: 700, fontFamily: font, ...rise(f, 6) }}>
        <div style={{ color: col, fontSize: 28, letterSpacing: 2, fontFamily: undefined }}>{label}</div>
        {sentence}
      </Abs>
      {Array.from({ length: n }, (_, i) => {
        const st = start + i * 5;
        const p = ease(f, st, 14);
        const row = Math.floor(i / 3);
        const colI = i % 3;
        return (
          <div key={i} style={{ position: "absolute", left: x - 165 + colI * 112, top: lerp(-120, 820 - row * 66, p), opacity: f < st ? 0 : 1 }}>
            <Brick w={104} h={52} studs={2} color={col} label="" />
          </div>
        );
      })}
      {t.step >= 2 && (
        <Abs x={x - 200} y={900} w={400} style={{ textAlign: "center", ...rise(f, at(t, 2) + 10) }}>
          <Chip color={col} style={{ fontSize: 32 }}>{n} bricks · ₹{n === 9 ? "9" : "15"}</Chip>
        </Abs>
      )}
    </>
  );
  return (
    <>
      {tower(9, 560, C.green, "ENGLISH", "Can I get a refund for spoiled milk?", undefined, at(t, 1))}
      {tower(15, 1360, C.pink, "MARATHI", "खराब दुधासाठी परतावा मिळेल का?", DEVA, at(t, 1) + 30)}
      {t.step >= 2 && (
        <Abs x={0} y={420} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 2) + 40) }}>
          <Big size={58} color={C.amber}>you pay per brick</Big>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the weighted wheel

const BASE = { tokens: ["within", "only", "up", "after", "if", "for", "by", "until"], probs: [0.62, 0.21, 0.07, 0.04, 0.025, 0.015, 0.012, 0.008] };

const Wheel = ({ probs, labels, rot, cx, cy, r, cut = 1, highlight = -1 }: { probs: number[]; labels: string[]; rot: number; cx: number; cy: number; r: number; cut?: number; highlight?: number }) => {
  let a0 = 0;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <g transform={`rotate(${rot} ${cx} ${cy})`}>
        {probs.map((p, i) => {
          const a1 = a0 + p * 360;
          const mid = (a0 + a1) / 2;
          const rad = (d: number) => ((d - 90) * Math.PI) / 180;
          const large = a1 - a0 > 180 ? 1 : 0;
          const tail = i >= cut;
          const push = tail ? 0 : 0;
          const path =
            p >= 0.9999
              ? `M${cx},${cy - r} A${r},${r} 0 1,1 ${cx - 0.01},${cy - r} Z`
              : `M${cx},${cy} L${cx + r * Math.cos(rad(a0))},${cy + r * Math.sin(rad(a0))} A${r},${r} 0 ${large},1 ${cx + r * Math.cos(rad(a1))},${cy + r * Math.sin(rad(a1))} Z`;
          const lr = r * 0.66;
          const el = (
            <g key={i} opacity={tail ? 0.18 : 1} transform={`translate(${push} 0)`}>
              <path d={path} fill={PALETTE[i % PALETTE.length]} stroke={C.bg} strokeWidth={4} opacity={highlight >= 0 && highlight !== i ? 0.45 : 1} />
              {p > 0.05 && (
                <text x={cx + lr * Math.cos(rad(mid))} y={cy + lr * Math.sin(rad(mid))} textAnchor="middle" dominantBaseline="middle" fontSize={p > 0.3 ? 44 : 30} fontWeight={800} fill="#0b0f17" transform={`rotate(${upright(mid, rot)} ${cx + lr * Math.cos(rad(mid))} ${cy + lr * Math.sin(rad(mid))})`}>
                  {labels[i]}
                </text>
              )}
            </g>
          );
          a0 = a1;
          return el;
        })}
        <circle cx={cx} cy={cy} r={34} fill={C.bg} stroke={C.line} strokeWidth={6} />
      </g>
      <polygon points={`${cx - 26},${cy - r - 46} ${cx + 26},${cy - r - 46} ${cx},${cy - r + 8}`} fill={C.text} />
    </svg>
  );
};

// Text along a slice, flipped when the wheel has turned it upside down.
const upright = (mid: number, rot: number) => {
  const a = (((mid + rot) % 360) + 360) % 360;
  return a > 180 ? mid + 90 : mid - 90;
};

// Angle (clockwise from the pointer) at the centre of slice i.
const sliceMid = (probs: number[], i: number) => (probs.slice(0, i).reduce((a, b) => a + b, 0) + probs[i] / 2) * 360;

export const WheelScene = ({ t, props }: CP) => {
  const f = t.frame;
  const mode = (props?.mode as string) ?? "basic";
  const cx = 600;
  const cy = 600;
  const r = 330;
  if (mode === "temp") return <TempWheel t={t} cx={cx} cy={cy} r={r} />;

  const probs = BASE.probs;
  const labels = BASE.tokens.map((w, i) => (i < 2 ? `${w} ${Math.round(BASE.probs[i] * 100)}%` : w));
  // spins: step 3 lands on "within"; step 5 lands on "only"
  const spin = (start: number, turns: number, target: number, dur = 80) => {
    const p = ease(f, start, dur);
    return p * (turns * 360 - sliceMid(probs, target));
  };
  let rot = 0;
  if (t.step >= 3) rot = spin(at(t, 3), 4, 0);
  if (t.step >= 5) rot = spin(at(t, 3), 4, 0) + ease(f, at(t, 5), 70) * (3 * 360 - sliceMid(probs, 1) + sliceMid(probs, 0));
  const landedA = t.step >= 3 && f > at(t, 3) + 82;
  const landedB = t.step >= 5 && f > at(t, 5) + 72;
  const rest = [" 6", " hours", " of", " delivery."];
  const nA = t.step >= 4 ? Math.min(rest.length, Math.floor((f - at(t, 4)) / 16)) : 0;
  const wheelIn = enter(f, at(t, 1), 20);
  return (
    <>
      {/* Meera's two answers */}
      <div style={{ opacity: during(t, 0) }}>
        {["…can be refunded within 6 hours of delivery.", "…can only be refunded if reported in 6 hours."].map((s, i) => (
          <Abs key={i} x={260} y={330 + i * 200} w={1400} style={{ ...card(i ? C.pink : C.blue), padding: "28px 36px", fontSize: 44, fontWeight: 600, ...rise(f, 10 + i * 40) }}>
            <span style={{ color: C.muted, fontSize: 28, display: "block" }}>Ask #{i + 1} · same question</span>
            Bakery items {s}
          </Abs>
        ))}
      </div>
      {t.step >= 1 && (
        <div style={{ opacity: wheelIn, transform: `scale(${0.7 + 0.3 * wheelIn}) rotate(${(1 - wheelIn) * -40}deg)`, transformOrigin: `${cx}px ${cy}px`, position: "absolute", inset: 0 }}>
          <Wheel probs={probs} labels={labels} rot={rot} cx={cx} cy={cy} r={r} highlight={landedB ? 1 : landedA && t.step < 5 ? 0 : -1} />
        </div>
      )}
      {t.step >= 1 && (
        <Abs x={1040} y={230} w={820} style={{ ...card(), padding: "26px 32px", fontSize: 40, fontWeight: 600, lineHeight: 1.4, opacity: wheelIn }}>
          <div style={{ fontSize: 24, color: C.muted, fontWeight: 700 }}>THE ANSWER SO FAR</div>
          Bakery items can be refunded
          {landedA && !landedB && <span style={{ color: C.blue, fontWeight: 800 }}> within</span>}
          {landedA && !landedB && rest.slice(0, nA).map((w, i) => <span key={i} style={{ color: PALETTE[(i + 2) % PALETTE.length], fontWeight: 700 }}>{w}</span>)}
          {landedB && <span style={{ color: C.pink, fontWeight: 800 }}> only</span>}
          {landedB && <span style={{ fontWeight: 700, opacity: enter(f, at(t, 5) + 80) }}> if reported in the first 6 hours.</span>}
          <span style={{ opacity: Math.floor(f / 15) % 2 ? 1 : 0, color: C.blue }}> ▌</span>
        </Abs>
      )}
      {t.step === 2 && (
        <Abs x={1040} y={520} w={820} style={{ fontSize: 40, fontWeight: 700, lineHeight: 1.5, ...rise(f, at(t, 2) + 10) }}>
          <span style={{ color: PALETTE[0] }}>within</span> 62% · <span style={{ color: PALETTE[1] }}>only</span> 21%
          <div style={{ color: C.muted, fontSize: 32 }}>…and a long tail of others</div>
        </Abs>
      )}
      {t.step === 4 && (
        <Abs x={1040} y={560} w={820} style={{ fontSize: 36, color: C.muted, fontWeight: 700, ...rise(f, at(t, 4) + 20) }}>
          🎡 spin #{1 + nA} … one spin per word
        </Abs>
      )}
      {t.step >= 6 && (
        <Abs x={1040} y={560} w={820} style={{ ...rise(f, at(t, 6)) }}>
          <Big size={52}>
            Same question.<br />
            <span style={{ color: C.amber }}>Different spin.</span>
            <br />
            Different answer.
          </Big>
        </Abs>
      )}
    </>
  );
};

const TempWheel = ({ t, cx, cy, r }: { t: Clock; cx: number; cy: number; r: number }) => {
  const f = t.frame;
  const logits = BASE.probs.map((p) => Math.log(p));
  const plan = [1, 0.45, 1.9, 0, 1, 1, 1];
  const s = Math.min(t.step, plan.length - 1);
  const T = s === 0 ? 1 : lerp(plan[s - 1], plan[s], ease(f, at(t, s), 30));
  const probs = softmax(logits, Math.max(T, 0.02));
  const cutOn = t.step >= 4 ? ease(f, at(t, 4) + 30, 20) : 0;
  let cum = 0;
  const cut = cutOn > 0.5 ? probs.findIndex((p) => (cum += p) >= 0.9) + 1 : probs.length;
  const labels = BASE.tokens;
  const knob = (T / 2) * 270 - 135;
  const hot = T > 1.3;
  const cold = T < 0.6;
  return (
    <>
      <Wheel probs={probs} labels={labels} rot={Math.sin(f / 40) * 3} cx={cx} cy={cy} r={r} cut={cut} />
      {/* the temperature dial */}
      <Abs x={1100} y={210} w={700} style={{ display: "flex", alignItems: "center", gap: 40, opacity: enter(f, 6) }}>
        <svg width={240} height={240} viewBox="0 0 240 240">
          <circle cx={120} cy={120} r={100} fill={C.card} stroke={hot ? C.red : cold ? C.cyan : C.line} strokeWidth={10} />
          <line x1={120} y1={120} x2={120 + 78 * Math.sin((knob * Math.PI) / 180)} y2={120 - 78 * Math.cos((knob * Math.PI) / 180)} stroke={C.text} strokeWidth={14} strokeLinecap="round" />
          <circle cx={120} cy={120} r={16} fill={C.text} />
        </svg>
        <div>
          <div style={{ fontSize: 28, color: C.muted, fontWeight: 800, letterSpacing: 3 }}>TEMPERATURE</div>
          <div style={{ fontSize: 96, fontWeight: 900, fontFamily: MONO, color: hot ? C.red : cold ? C.cyan : C.text }}>{T.toFixed(1)}</div>
          <div style={{ fontSize: 36 }}>{T < 0.05 ? "🧊 always the favourite" : cold ? "❄ predictable" : hot ? "🔥 creative" : "balanced"}</div>
        </div>
      </Abs>
      {t.step === 4 && (
        <Abs x={1100} y={560} w={720} style={{ ...rise(f, at(t, 4)), fontSize: 44, fontWeight: 800 }}>
          <span style={{ fontSize: 80, display: "inline-block", transform: `rotate(${Math.sin(f / 4) * 20}deg)` }}>✂️</span> top-p cuts the tiny slices
        </Abs>
      )}
      {t.step >= 5 && (
        <Abs x={1100} y={540} w={720} style={{ display: "flex", flexDirection: "column", gap: 18, opacity: during(t, 5) }}>
          <div style={{ ...card(C.cyan), padding: "20px 28px", fontSize: 38, fontWeight: 700, ...rise(f, at(t, 5)) }}>❄ refund rules → low</div>
          <div style={{ ...card(C.red), padding: "20px 28px", fontSize: 38, fontWeight: 700, ...rise(f, at(t, 5) + 40) }}>🔥 10 subject lines → high</div>
        </Abs>
      )}
      {t.step >= 6 && (
        <Abs x={1100} y={560} w={720} style={{ ...card(C.amber), padding: "24px 30px", fontSize: 34, fontWeight: 700, lineHeight: 1.35, ...rise(f, at(t, 6)) }}>
          ⚠ Even at 0, hosted models vary a little.
          <div style={{ color: C.muted, fontSize: 30, marginTop: 8 }}>Pin the model version.</div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ never saw the policy

export const NoPolicy = ({ t }: CP) => {
  const f = t.frame;
  const typedSrc = "Frozen items can be refunded within 48 hours if they arrive thawed…";
  const typed = typedSrc.slice(0, Math.max(0, Math.floor((f - at(t, 1) - 20) * 1.4)));
  return (
    <>
      {/* internet → model */}
      <div style={{ opacity: 1 - from(t, 3) }}>
        {Array.from({ length: 24 }, (_, i) => {
          const st = 6 + i * 3;
          const loop = ((f - st) % 60) / 60;
          return <div key={i} style={{ position: "absolute", left: lerp(110, 640, loop) + rnd(i) * 40, top: 300 + rnd(i + 4) * 360, width: 40, height: 52, borderRadius: 6, background: "#e8ecf3", opacity: f < st ? 0 : 0.8 * Math.sin(loop * Math.PI) }} />;
        })}
        <Abs x={60} y={210} w={420} style={{ fontSize: 34, fontWeight: 800, color: C.muted, textAlign: "center" }}>the public internet</Abs>
        <div style={{ position: "absolute", left: 700, top: 350, width: 420, height: 280, borderRadius: 36, background: `radial-gradient(circle at 50% 40%, ${C.purple}55, ${C.card} 70%)`, border: `4px solid ${C.purple}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80, fontWeight: 900, ...rise(f, 4) }}>LLM</div>
        {/* the vault */}
        <Abs x={1360} y={300} w={420} h={380} style={{ ...card(C.amber), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, ...rise(f, 30) }}>
          <div style={{ fontSize: 110 }}>🔒</div>
          <div style={{ fontSize: 36, fontWeight: 800, textAlign: "center" }}>FreshCart's<br />refund policy</div>
          <div style={{ fontSize: 26, color: C.muted }}>private · never seen</div>
        </Abs>
        <Abs x={1150} y={450} w={200} style={{ textAlign: "center", fontSize: 90, color: C.red, fontWeight: 900, opacity: enter(f, 60) }}>✗</Abs>
      </div>
      {t.step >= 1 && (
        <Abs x={500} y={680} w={920} style={{ ...card(t.step >= 2 ? C.red : C.line), padding: "22px 30px", fontSize: 36, lineHeight: 1.35, ...rise(f, at(t, 1)), opacity: (1 - from(t, 3)) * enter(f, at(t, 1)) }}>
          <div style={{ fontSize: 24, color: C.muted, fontWeight: 800 }}>MOST LIKELY-SOUNDING ANSWER</div>
          {typed}
        </Abs>
      )}
      {t.step >= 2 && t.step < 3 && (
        <Abs x={0} y={180} w={1920} style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ display: "flex", gap: 20, ...rise(f, at(t, 2)) }}>
            {["Fluent", "Confident", "Wrong"].map((w, i) => (
              <Chip key={w} color={i === 2 ? C.red : C.green} style={{ fontSize: 40, padding: "12px 30px", opacity: enter(f, at(t, 2) + i * 18) }}>
                {w}
              </Chip>
            ))}
          </div>
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={260} y={260} w={1400} style={{ ...rise(f, at(t, 3)) }}>
          <Big size={60}>“Just train it on our policies?”</Big>
          <div style={{ display: "flex", gap: 30, marginTop: 50 }}>
            <div style={{ ...card(C.green), padding: "26px 34px", fontSize: 38, fontWeight: 700, flex: 1, ...rise(f, at(t, 3) + 30) }}>✓ teaches habits & style</div>
            <div style={{ ...card(C.red), padding: "26px 34px", fontSize: 38, fontWeight: 700, flex: 1, ...rise(f, at(t, 3) + 60) }}>✗ facts come out fuzzy<div style={{ fontSize: 28, color: C.muted, marginTop: 8 }}>retrain on every policy change</div></div>
          </div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ meaning map + attention spotlight

export const Spotlight = ({ t }: CP) => {
  const f = t.frame;
  const clusters = [
    { name: "dairy", col: C.blue, x: 0.25, y: 0.3, words: ["milk", "curd", "paneer", "butter"] },
    { name: "money back", col: C.green, x: 0.72, y: 0.28, words: ["refund", "return", "credit"] },
    { name: "cities", col: C.amber, x: 0.3, y: 0.75, words: ["Pune", "Bengaluru", "Mumbai"] },
    { name: "time", col: C.pink, x: 0.74, y: 0.74, words: ["hours", "minutes", "days"] },
  ];
  const toks = ["The", "milk", "was", "spoiled,", "so", "the", "customer", "returned", "it"];
  const weight = [0.03, 0.62, 0.02, 0.16, 0.01, 0.02, 0.07, 0.07];
  const widths = toks.map((s) => s.length * 28 + 56);
  const total = widths.reduce((a, b) => a + b + 22, -22);
  let x = (1920 - total) / 2;
  const xs = widths.map((w) => {
    const c = x + w / 2;
    x += w + 22;
    return c;
  });
  const y = 560;
  const beams = t.step >= 2 ? ease(f, at(t, 2) + 20, 40) : 0;
  const layers = from(t, 4);
  return (
    <>
      {/* map of meaning */}
      <div style={{ opacity: during(t, 0) }}>
        {clusters.map((c, ci) => (
          <div key={c.name}>
            <div style={{ position: "absolute", left: 160 + c.x * 1600 - 200, top: 150 + c.y * 760 - 140, width: 400, height: 280, borderRadius: 999, background: `${c.col}14`, border: `2px dashed ${c.col}66`, opacity: enter(f, 30 + ci * 12) }} />
            <div style={{ position: "absolute", left: 160 + c.x * 1600 - 200, top: 150 + c.y * 760 - 180, width: 400, textAlign: "center", color: c.col, fontSize: 28, fontWeight: 800, opacity: enter(f, 40 + ci * 12) }}>{c.name}</div>
            {c.words.map((w, wi) => {
              const ang = (wi / c.words.length) * Math.PI * 2 + ci + f / 120;
              const p = Math.min(1, pop(f, 10 + ci * 10 + wi * 5));
              return (
                <div key={w} style={{ position: "absolute", left: 160 + c.x * 1600 + Math.cos(ang) * 105, top: 150 + c.y * 760 + Math.sin(ang) * 65, transform: `scale(${p})` }}>
                  <div style={{ width: 18, height: 18, borderRadius: 999, background: c.col }} />
                  <div style={{ position: "absolute", left: 24, top: -12, fontSize: 32, fontWeight: 700, whiteSpace: "nowrap" }}>{w}</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {/* the sentence and the light from "it" */}
      {t.step >= 1 && (
        <div style={{ opacity: from(t, 1) * (1 - layers), transform: `translateY(${-layers * 120}px) scale(${1 - layers * 0.3})`, transformOrigin: "960px 560px", position: "absolute", inset: 0 }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <defs>
              <filter id="glow"><feGaussianBlur stdDeviation="6" /></filter>
            </defs>
            {weight.map((w, i) => (
              <path key={i} d={`M${xs[8]},${y - 4} Q${(xs[8] + xs[i]) / 2},${y - 120 - (xs[8] - xs[i]) * 0.22} ${xs[i]},${y - 4}`} stroke={C.amber} strokeWidth={3 + w * 46} strokeOpacity={(0.12 + w) * beams} fill="none" filter={w > 0.1 ? "url(#glow)" : undefined} />
            ))}
          </svg>
          {toks.map((s, i) => {
            const lit = i === 8 ? 1 : (weight[i] ?? 0) * beams;
            return (
              <div key={i} style={{ position: "absolute", left: xs[i] - widths[i] / 2, top: y, width: widths[i], padding: "18px 0", textAlign: "center", fontSize: 44, fontWeight: 800, borderRadius: 16, border: `3px solid ${i === 8 ? C.amber : C.line}`, background: i === 8 ? `${C.amber}33` : `rgba(255,181,71,${lit * 0.9})`, color: lit > 0.4 ? "#0b0f17" : C.text, boxShadow: lit > 0.4 ? `0 0 50px ${C.amber}` : "none", ...rise(f, at(t, 1) + i * 5) }}>
                {s}
              </div>
            );
          })}
          {t.step >= 3 && (
            <Abs x={0} y={720} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 3)) }}>
              <Big size={56}>“it” ≈ <span style={{ color: C.amber }}>milk</span></Big>
            </Abs>
          )}
        </div>
      )}
      {/* layers stacked, ending in the wheel */}
      {t.step >= 4 && (
        <div style={{ opacity: layers }}>
          {Array.from({ length: 8 }, (_, i) => {
            const pulse = Math.max(0, 1 - Math.abs((((f - at(t, 4)) % 60) / 60) * 8 - i) / 1.4);
            return <div key={i} style={{ position: "absolute", left: 560, top: 840 - i * 62, width: 800, height: 44, borderRadius: 10, background: `rgba(91,156,255,${0.2 + pulse * 0.7})`, border: `2px solid ${C.blue}`, opacity: enter(f, at(t, 4) + i * 4) }} />;
          })}
          <Abs x={1400} y={600} w={420} style={{ fontSize: 34, fontWeight: 700, color: C.muted, ...rise(f, at(t, 4) + 30) }}>dozens of layers, each refining the meaning</Abs>
          {f > at(t, 4) + 70 && (
            <svg width={300} height={300} style={{ position: "absolute", left: 820, top: 90, opacity: enter(f, at(t, 4) + 70) }} viewBox="0 0 300 300">
              <g transform={`rotate(${(f - at(t, 4)) * 8} 150 150)`}>
                {BASE.probs.slice(0, 5).map((p, i) => {
                  const a0 = BASE.probs.slice(0, i).reduce((a, b) => a + b, 0) * 2 * Math.PI;
                  const a1 = a0 + p * 2 * Math.PI;
                  return <path key={i} d={`M150,150 L${150 + 120 * Math.sin(a0)},${150 - 120 * Math.cos(a0)} A120,120 0 ${p > 0.5 ? 1 : 0},1 ${150 + 120 * Math.sin(a1)},${150 - 120 * Math.cos(a1)} Z`} fill={PALETTE[i]} stroke={C.bg} strokeWidth={3} />;
                })}
              </g>
            </svg>
          )}
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ why long prompts cost more

export const Cost = ({ t }: CP) => {
  const f = t.frame;
  const grid = (n: number, ox: number, col: string, start: number) => {
    const cells: [number, number][] = [];
    for (let r = 0; r < n; r++) for (let c = 0; c <= r; c++) cells.push([r, c]);
    return (
      <>
        {cells.map(([r, c], k) => (
          <div key={k} style={{ position: "absolute", left: ox + c * 54, top: 230 + r * 54, width: 46, height: 46, borderRadius: 10, background: col, opacity: 0.9 * enter(f, start + k * 1.3, 6) }} />
        ))}
        <Abs x={ox} y={690} w={600} style={{ fontSize: 38, fontWeight: 800, opacity: enter(f, start + 20) }}>
          {n} tokens → <span style={{ color: col }}>{cells.length} comparisons</span>
        </Abs>
      </>
    );
  };
  const pour = t.step >= 2 ? (f - at(t, 2)) : 0;
  return (
    <>
      <div style={{ opacity: during(t, 0) + during(t, 1) }}>
        {grid(4, 360, C.blue, 20)}
        {grid(8, 1000, C.pink, 80)}
        {t.step >= 1 && (
          <Abs x={0} y={790} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 1)) }}>
            <Big size={60} color={C.amber}>2× the prompt → ~3.6× the work</Big>
          </Abs>
        )}
      </div>
      {t.step >= 2 && (
        <div style={{ opacity: from(t, 2) * (1 - from(t, 3)) }}>
          {/* the context window as a box that fills and overflows */}
          <Abs x={710} y={330} w={500} h={460} style={{ border: `6px solid ${C.green}`, borderTop: "none", borderRadius: "0 0 30px 30px" }} />
          <Abs x={710} y={800} w={500} style={{ textAlign: "center", fontSize: 34, fontWeight: 800, color: C.green }}>context window</Abs>
          {Array.from({ length: 70 }, (_, i) => {
            const st = i * 2.2;
            const p = clamp01((pour - st) / 22);
            const inside = i < 40;
            const tx = inside ? 730 + (i % 8) * 58 : 700 + (rnd(i) - 0.3) * 900;
            const ty = inside ? lerp(140, 740 - Math.floor(i / 8) * 70, p) : lerp(140, 760 + rnd(i + 2) * 120, p);
            return <div key={i} style={{ position: "absolute", left: inside ? tx : lerp(940, tx, p), top: ty, width: 48, height: 60, borderRadius: 6, background: inside ? "#e8ecf3" : C.red, opacity: p > 0 ? 1 : 0, transform: `rotate(${inside ? 0 : rnd(i) * 80 - 40}deg)` }} />;
          })}
          <Abs x={1300} y={360} w={560} style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.4, ...rise(f, at(t, 2) + 60) }}>
            12,000 documents
            <div style={{ color: C.red }}>≈ 300 million tokens</div>
            <div style={{ color: C.muted, fontSize: 30 }}>windows hold ~1 million at most</div>
          </Abs>
        </div>
      )}
      {t.step >= 3 && (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: from(t, 3) }}>
          <rect x={460} y={300} width={1000} height={70} rx={14} fill={C.card} stroke={C.line} strokeWidth={3} />
          <rect x={460} y={300} width={180} height={70} rx={14} fill={C.green} />
          <rect x={1280} y={300} width={180} height={70} rx={14} fill={C.green} />
          <text x={960} y={346} textAnchor="middle" fontSize={34} fontWeight={800} fill={C.muted}>the middle gets overlooked</text>
          <path d="M470,470 C800,800 1120,800 1450,470" stroke={C.amber} strokeWidth={8} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease(f, at(t, 3), 40)} />
          <text x={960} y={790} textAnchor="middle" fontSize={30} fill={C.muted}>how well each part is used (illustrative)</text>
        </svg>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the prompt, the tickets, the patches

const Gauge = ({ value, color }: { value: number; color: string }) => (
  <svg width={300} height={300} viewBox="0 0 300 300">
    <circle cx={150} cy={150} r={120} stroke={C.line} strokeWidth={26} fill="none" />
    <circle cx={150} cy={150} r={120} stroke={color} strokeWidth={26} fill="none" pathLength={100} strokeDasharray={100} strokeDashoffset={100 - value} transform="rotate(-90 150 150)" strokeLinecap="round" />
    <text x={150} y={172} textAnchor="middle" fontSize={76} fontWeight={900} fill={C.text}>{Math.round(value)}%</text>
  </svg>
);

export const Tickets2 = ({ t }: CP) => {
  const f = t.frame;
  const bins = [["refund", C.pink], ["late delivery", C.amber], ["missing item", C.blue], ["other", C.muted]] as const;
  const s3 = at(t, 3);
  const acc = t.step < 2 ? 0 : t.step === 2 ? 81 * ease(f, at(t, 2), 40) : [81, 77, 83, 76][Math.min(3, Math.max(0, Math.floor((f - s3) / 45)))];
  return (
    <>
      <div style={{ opacity: during(t, 0) }}>
        <Abs x={0} y={300} w={1920} style={{ textAlign: "center" }}>
          <div style={{ fontSize: 150, transform: `rotate(${Math.sin(f / 18) * 25}deg)`, display: "inline-block" }}>🛞</div>
          <Big size={70} style={rise(f, 20)}>the prompt is your steering wheel</Big>
        </Abs>
      </div>
      {t.step === 1 && (
        <div style={{ opacity: during(t, 1) }}>
          {bins.map(([name, col], i) => (
            <Abs key={name} x={190 + i * 400} y={640} w={340} h={200} style={{ ...card(col), display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 20, fontSize: 34, fontWeight: 800, color: col }}>{name}</Abs>
          ))}
          {Array.from({ length: 18 }, (_, k) => {
            const bin = [0, 1, 2, 0, 3, 1, 0, 2, 1, 0, 3, 2, 0, 1, 2, 0, 1, 3][k];
            const st = at(t, 1) + 10 + k * 8;
            const p = ease(f, st, 24);
            return <div key={k} style={{ position: "absolute", left: lerp(900, 300 + bin * 400 + (k % 3) * 30 - 30, p), top: lerp(200, 680 + (k % 2) * 30, p), width: 120, height: 74, borderRadius: 10, background: "#f4f1e8", opacity: f < st ? 0 : 1, transform: `rotate(${(rnd(k) - 0.5) * 20}deg)`, boxShadow: "0 6px 18px rgba(0,0,0,.4)", color: "#222", fontSize: 18, padding: 8 }}>ticket</div>;
          })}
          <Abs x={0} y={170} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 1)) }}>
            <Big size={56}>3,000 tickets a day · sorted by hand</Big>
          </Abs>
        </div>
      )}
      {t.step >= 2 && (
        <>
          <Abs x={140} y={230} w={1050} style={{ ...card(), background: "#0a0e16", padding: 36, fontFamily: MONO, fontSize: 36, lineHeight: 1.5, ...rise(f, at(t, 2)) }}>
            Classify this ticket as refund, late_delivery, missing_item or other.
          </Abs>
          <Abs x={1400} y={230} w={340} style={{ textAlign: "center", ...rise(f, at(t, 2) + 10) }}>
            <Gauge value={acc} color={acc >= 80 ? C.amber : C.red} />
            <div style={{ fontSize: 28, color: C.muted }}>correct on 200 labelled tickets</div>
          </Abs>
          {t.step >= 3 &&
            ["IMPORTANT!!! refunds are NOT complaints", "late = slot missed (unless refund??)", "NEVER say refund to angry people"].map((n, i) => {
              const st = s3 + 10 + i * 45;
              const p = Math.min(1, pop(f, st));
              return (
                <Abs key={i} x={180 + i * 80} y={470 + i * 120} w={820} style={{ background: "#ffe773", color: "#2a2400", fontSize: 34, fontWeight: 800, padding: "20px 26px", borderRadius: 6, transform: `rotate(${[-3, 2.5, -1.5][i]}deg) scale(${p})`, opacity: p, boxShadow: "0 10px 26px rgba(0,0,0,.45)" }}>
                  {n}
                  <span style={{ position: "absolute", right: -190, top: 18, fontSize: 28, color: C.red, opacity: enter(f, st + 20) }}>💥 broke something</span>
                </Abs>
              );
            })}
        </>
      )}
    </>
  );
};

export const Brief = ({ t }: CP) => {
  const f = t.frame;
  const parts = [
    ["Role & goal", "You sort FreshCart support tickets so they reach the right team.", C.blue],
    ["Definitions", "refund = money back, for any reason — even if it was also late.", C.green],
    ["Examples (hard ones)", "“2 hours late, I want my fee back” → refund", C.purple],
    ["Answer format", '{"intent": "refund" | "late_delivery" | …}', C.amber],
  ] as const;
  const acc = t.step >= 5 ? lerp(81, 93, ease(f, at(t, 5), 40)) : 81;
  return (
    <>
      <Abs x={110} y={200} w={420} style={{ textAlign: "center", ...rise(f, 4) }}>
        <div style={{ fontSize: 150 }}>🧑‍💼</div>
        <div style={{ fontSize: 34, fontWeight: 800 }}>a smart new colleague</div>
        <div style={{ fontSize: 28, color: C.muted }}>day one, needs a good brief</div>
      </Abs>
      <Abs x={600} y={170} w={900} h={720} style={{ ...card(), background: "#0a0e16", padding: 30, display: "flex", flexDirection: "column", gap: 18, ...rise(f, 10) }}>
        {parts.map(([h, body, col], i) => {
          const st = at(t, i + 1);
          const p = enter(f, st, 18);
          return (
            <div key={h} style={{ opacity: p, transform: `translateX(${(1 - p) * 80}px)`, borderLeft: `8px solid ${col}`, paddingLeft: 22, background: t.step === i + 1 ? `${col}1a` : "transparent", borderRadius: 8, padding: "14px 22px" }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: col }}>{h}</div>
              <div style={{ fontSize: 28, fontFamily: MONO, color: C.text, marginTop: 6 }}>{body}</div>
            </div>
          );
        })}
      </Abs>
      {t.step >= 5 && (
        <Abs x={1540} y={260} w={330} style={{ textAlign: "center", ...rise(f, at(t, 5)) }}>
          <Gauge value={acc} color={C.green} />
          <div style={{ fontSize: 28, color: C.muted }}>same model</div>
          {Array.from({ length: 24 }, (_, i) => {
            const p = clamp01((f - at(t, 5) - 40) / 50);
            const a = rnd(i) * Math.PI * 2;
            return <div key={i} style={{ position: "absolute", left: 160 + Math.cos(a) * 260 * p, top: 150 + Math.sin(a) * 200 * p + 200 * p * p, width: 14, height: 14, borderRadius: 3, background: PALETTE[i % PALETTE.length], opacity: p > 0 && p < 1 ? 1 : 0 }} />;
          })}
        </Abs>
      )}
      {t.step >= 6 && (
        <Abs x={0} y={900} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 6)) }}>
          <span style={{ fontSize: 46, fontWeight: 800 }}>No magic words. <span style={{ color: C.green }}>Prompting, done well, is engineering.</span></span>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ recap

export const Recap = ({ t, props }: CP) => {
  const f = t.frame;
  const items = (props?.items as string[][] | undefined) ?? [
    ["🧠", "LLM", "predicts the next token"],
    ["🎡", "Sampling + temperature", "a weighted spin, shaped by a dial"],
    ["🤥", "Hallucination", "likely, not checked"],
    ["🔦", "Attention", "words look back at what matters"],
    ["🛞", "Prompt", "your steering wheel"],
  ];
  return (
    <>
      <Abs x={0} y={150} w={1920} style={{ textAlign: "center", ...rise(f, 4) }}>
        <Big size={64}>Lock it in</Big>
      </Abs>
      {items.map(([icon, word, meaning], i) => {
        const st = at(t, i + 1);
        const p = Math.min(1, pop(f, st));
        const col = PALETTE[i % PALETTE.length];
        return (
          <Abs key={word} x={i < 3 ? 120 + i * 580 : (1920 - (items.length - 3) * 580 + 40) / 2 + (i - 3) * 580} y={i < 3 ? 280 : 600} w={540} style={{ ...card(t.step === i + 1 ? col : C.line), padding: 30, minHeight: 260, opacity: p, transform: `scale(${0.6 + 0.4 * p})`, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 64 }}>{icon}</div>
            <div style={{ fontSize: 40, fontWeight: 900, color: col }}>{word}</div>
            <div style={{ fontSize: 30, color: C.muted }}>{meaning}</div>
          </Abs>
        );
      })}
    </>
  );
};
