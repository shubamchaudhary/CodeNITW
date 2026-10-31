// Chapter 8 scenes (is it actually working?): a meaningless score, 100 traces
// sorted into piles, piles turned into checks, a CI gate, a judge calibrated
// like a kitchen scale, and search vs answer metrics on one ranked list.
// Widths only, never heights; the top-right corner stays free for the term card.
import type { ReactNode } from "react";
import type { Clock } from "../lib/timeline.ts";
import { C, MONO, PALETTE } from "../lib/theme.ts";
import { ease, enter, lerp, pop, rise } from "../lib/anim.ts";
import { Abs, card, Chip } from "./ui.tsx";
import { at, Big, during, from, rnd } from "./custom3.tsx";

type CP = { t: Clock; props?: Record<string, unknown> };

const Svg = ({ children }: { children: ReactNode }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
    {children}
  </svg>
);

const Arrow = ({ x1, y1, x2, y2, color = C.muted, p = 1 }: { x1: number; y1: number; x2: number; y2: number; color?: string; p?: number }) => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  return (
    <g>
      <line x1={x1} y1={y1} x2={lerp(x1, x2, p)} y2={lerp(y1, y2, p)} stroke={color} strokeWidth={4} strokeLinecap="round" />
      {p > 0.95 && <polygon points={`${x2},${y2} ${x2 - 18 * Math.cos(a - 0.42)},${y2 - 18 * Math.sin(a - 0.42)} ${x2 - 18 * Math.cos(a + 0.42)},${y2 - 18 * Math.sin(a + 0.42)}`} fill={color} />}
    </g>
  );
};

// ------------------------------------------------------------------ a score that says nothing

export const Score = ({ t }: CP) => {
  const f = t.frame;
  const fill = ease(f, at(t, 1) + 10, 40);
  return (
    <>
      {t.step === 0 && (
        <Abs x={460} y={280} w={1000} style={{ ...card(C.red), padding: "26px 32px", opacity: during(t, 0), ...rise(f, 4) }}>
          <div style={{ fontSize: 26, color: C.muted }}>📱 from the COO</div>
          <div style={{ fontSize: 40, fontWeight: 800, marginTop: 10 }}>“Is this thing actually working, and how would we even know?”</div>
          <div style={{ fontSize: 28, color: C.muted, marginTop: 14 }}>📎 screenshot: bakery refunds within 48 hours (policy: 12)</div>
        </Abs>
      )}
      {t.step >= 1 && t.step < 3 && (
        <div style={{ opacity: from(t, 1) * (1 - from(t, 3)) }}>
          <Abs x={160} y={300} w={600} style={{ ...card(), padding: "18px 24px", fontFamily: MONO, fontSize: 28, ...rise(f, at(t, 1)) }}>
            $ pip install some-eval-lib
            <br />$ run --all
          </Abs>
          <Abs x={960} y={260} w={700} style={{ textAlign: "center", ...rise(f, at(t, 1) + 20) }}>
            <div style={{ fontSize: 30, color: C.muted }}>helpfulness</div>
            <div style={{ fontFamily: MONO, fontSize: 150, fontWeight: 800, color: C.green }}>{(4.1 * fill).toFixed(1)}</div>
            <div style={{ fontSize: 34, color: C.muted }}>out of 5</div>
          </Abs>
          {t.step >= 2 && (
            <Abs x={160} y={680} w={1600} style={{ display: "flex", gap: 24, justifyContent: "center", ...rise(f, at(t, 2)) }}>
              {["what's wrong?", "how often?", "what do we fix?"].map((s, i) => (
                <Chip key={s} color={C.red} style={{ fontSize: 34, opacity: enter(f, at(t, 2) + i * 16) }}>❓ {s}</Chip>
              ))}
            </Abs>
          )}
        </div>
      )}
      {t.step >= 3 && (
        <Abs x={160} y={380} w={1600} style={{ display: "flex", gap: 18, justifyContent: "center", alignItems: "center", opacity: from(t, 3) }}>
          {["👀 look", "🏷️ name", "🔢 count", "📏 then measure"].map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 18, opacity: Math.min(1, pop(f, at(t, 3) + i * 14)) }}>
              <div style={{ ...card(PALETTE[i]), padding: "20px 30px", fontSize: 38, fontWeight: 800 }}>{s}</div>
              {i < 3 && <span style={{ fontSize: 40, color: C.muted }}>→</span>}
            </div>
          ))}
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ error analysis: 100 traces into piles

export const Piles = ({ t }: CP) => {
  const f = t.frame;
  const cats = [
    { name: "outdated document version", n: 11, col: C.red },
    { name: "right chunk, answer contradicts it", n: 6, col: C.amber },
    { name: "order question, no order lookup", n: 5, col: C.purple },
    { name: "too long to read on a call", n: 4, col: C.blue },
  ];
  const notes = ["cited the 2023 bakery policy", "never searched, answered from memory", "right chunk, wrong number", "fine", "fine", "too long"];
  const sort = t.step >= 2 ? ease(f, at(t, 2) + 10, 40) : 0;
  return (
    <>
      {t.step < 2 &&
        Array.from({ length: 100 }, (_, i) => (
          <div key={i} style={{ position: "absolute", left: 180 + (i % 20) * 58, top: 290 + Math.floor(i / 20) * 70, width: 46, height: 56, borderRadius: 6, background: C.card2, border: `2px solid ${t.step >= 1 && i < 6 ? C.amber : C.line}`, opacity: enter(f, 4 + i * 0.6) * (1 - from(t, 2)) }} />
        ))}
      {t.step === 0 && (
        <Abs x={1400} y={330} w={400} style={{ ...rise(f, 50) }}>
          <div style={{ fontSize: 90 }}>🩺</div>
          <div style={{ fontSize: 34, fontWeight: 800 }}>read the charts before prescribing</div>
          <div style={{ fontFamily: MONO, fontSize: 28, color: C.muted, marginTop: 10 }}>100 real traces</div>
        </Abs>
      )}
      {t.step === 1 &&
        notes.map((n, i) => (
          <Abs key={i} x={1390} y={300 + i * 86} w={420} style={{ background: "#ffe58a", color: "#3a3000", borderRadius: 6, padding: "10px 14px", fontSize: 24, fontWeight: 700, transform: `rotate(${(rnd(i) - 0.5) * 5}deg)`, ...rise(f, at(t, 1) + 10 + i * 18) }}>
            #{i + 1}: {n}
          </Abs>
        ))}
      {t.step >= 2 && (
        <div style={{ opacity: sort }}>
          {cats.map((c, i) => (
            <Abs key={c.name} x={180} y={290 + i * 120} w={1500} style={{ display: "flex", alignItems: "center", gap: 22 }}>
              <div style={{ width: 560, fontSize: 30, fontWeight: 700, ...(t.step >= 3 && i === 0 ? { color: C.red } : {}) }}>{c.name}</div>
              <div style={{ display: "flex", gap: 6 }}>
                {Array.from({ length: c.n }, (_, k) => (
                  <div key={k} style={{ width: 36, height: 50, borderRadius: 5, background: c.col, opacity: enter(f, at(t, 2) + 20 + i * 10 + k * 3) }} />
                ))}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 36, fontWeight: 800, color: c.col }}>{c.n}</div>
            </Abs>
          ))}
          <Abs x={180} y={770} w={800} style={{ fontSize: 26, color: C.muted }}>the other 74: fine</Abs>
        </div>
      )}
      {t.step >= 3 && (
        <Abs x={1000} y={760} w={820} style={{ ...card(C.red), padding: "16px 22px", fontSize: 28, fontWeight: 700, ...rise(f, at(t, 3)) }}>
          the biggest pile isn't a prompt problem: old policies never deleted. the bakery bug.
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ failures become checks

export const Checks = ({ t }: CP) => {
  const f = t.frame;
  return (
    <>
      {t.step < 2 && (
        <div style={{ opacity: 1 - from(t, 2) }}>
          <Abs x={140} y={270} w={800} style={{ ...card(C.green), padding: "22px 26px", ...rise(f, 4) }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: C.green }}>⚙️ code checks: cheap, fast, never disagree</div>
            {["every cited chunk is the latest version", "order id in the question → order tool was called", "answer under 120 words"].map((s, i) => (
              <div key={s} style={{ fontSize: 27, padding: "10px 0", borderTop: `1px solid ${C.line}`, marginTop: i ? 0 : 12, ...rise(f, 20 + i * 14, 10) }}>✓ {s}</div>
            ))}
          </Abs>
          {t.step >= 1 && (
            <Abs x={1000} y={300} w={780} style={{ ...card(C.purple), padding: "22px 26px", ...rise(f, at(t, 1)) }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: C.purple }}>🧑‍⚖️ a model as judge</div>
              <div style={{ fontSize: 27, marginTop: 12 }}>only where code can't decide:</div>
              <div style={{ fontSize: 27, color: C.muted, marginTop: 6 }}>“is every claim supported by the chunks it cites?”</div>
            </Abs>
          )}
        </div>
      )}
      {t.step >= 2 && t.step < 3 && (
        <div style={{ opacity: from(t, 2) * (1 - from(t, 3)) }}>
          <Abs x={160} y={280} w={760} style={{ ...card(C.red), padding: "22px 26px", ...rise(f, at(t, 2)) }}>
            <div style={{ fontSize: 28, color: C.muted }}>rate it 1 to 5</div>
            <div style={{ display: "flex", gap: 14, marginTop: 16 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} style={{ width: 90, padding: "14px 0", textAlign: "center", borderRadius: 12, fontSize: 40, fontWeight: 800, border: `3px solid ${n === 3 || n === 4 ? C.red : C.line}` }}>{n}</div>
              ))}
            </div>
            <div style={{ fontSize: 28, color: C.red, marginTop: 14 }}>you say 3, I say 4 · “3.4 average” fixes nothing</div>
          </Abs>
          <Abs x={1000} y={280} w={760} style={{ ...card(C.green), padding: "22px 26px", ...rise(f, at(t, 2) + 40) }}>
            <div style={{ fontSize: 28, color: C.muted }}>does it cite the current policy?</div>
            <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
              <div style={{ padding: "14px 40px", borderRadius: 12, fontSize: 40, fontWeight: 800, border: `3px solid ${C.green}`, color: C.green }}>yes</div>
              <div style={{ padding: "14px 40px", borderRadius: 12, fontSize: 40, fontWeight: 800, border: `3px solid ${C.line}` }}>no</div>
            </div>
            <div style={{ fontSize: 28, color: C.green, marginTop: 14 }}>we agree · and a “no” says what to fix</div>
          </Abs>
        </div>
      )}
      {t.step >= 3 && (
        <div style={{ opacity: from(t, 3) }}>
          <Abs x={360} y={280} w={1200} style={{ ...card(C.amber), padding: "24px 30px", ...rise(f, at(t, 3)) }}>
            <div style={{ fontSize: 32, fontWeight: 800 }}>🏅 golden set · v12</div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 16 }}>
              {["refunds", "late orders", "Pune", "Bengaluru", "Marathi", "multi-part"].map((s, i) => (
                <Chip key={s} color={PALETTE[i]} style={{ fontSize: 24, opacity: enter(f, at(t, 3) + 20 + i * 8) }}>{s}</Chip>
              ))}
            </div>
            <div style={{ fontSize: 26, color: C.muted, marginTop: 16 }}>each case: the question, the right source chunks, facts it must contain, things it must not say</div>
          </Abs>
          {t.step >= 4 && (
            <Abs x={360} y={620} w={1200} style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", ...rise(f, at(t, 4)) }}>
              {["❓ unanswerable", "🌫️ ambiguous", "🦹 hidden instructions", "🆕 recently changed policies"].map((s) => (
                <Chip key={s} color={C.purple} style={{ fontSize: 26 }}>{s}</Chip>
              ))}
            </Abs>
          )}
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the CI gate

export const CiGate = ({ t }: CP) => {
  const f = t.frame;
  const nodes = [
    { x: 120, label: "pull request:\nchanges a prompt" },
    { x: 560, label: "run the\ngolden set" },
    { x: 1000, label: "compare with\nmain, per group" },
  ];
  const blocked = t.step >= 1 && f > at(t, 1) + 70;
  return (
    <>
      <Svg>
        {nodes.slice(0, 2).map((n, i) => (
          <Arrow key={i} x1={n.x + 340} y1={360} x2={nodes[i + 1].x - 10} y2={360} p={ease(f, 20 + i * 14, 14)} />
        ))}
        {t.step >= 1 && <Arrow x1={1340} y1={360} x2={1430} y2={360} p={ease(f, at(t, 1) + 40, 14)} color={blocked ? C.red : C.muted} />}
      </Svg>
      {nodes.map((n, i) => (
        <Abs key={n.label} x={n.x} y={300} w={340} style={{ ...card(), padding: "20px 0", textAlign: "center", fontSize: 30, fontWeight: 800, whiteSpace: "pre-line", ...rise(f, 4 + i * 14) }}>
          {n.label}
        </Abs>
      ))}
      {t.step >= 1 && (
        <Abs x={1440} y={300} w={360} style={{ ...card(blocked ? C.red : C.line), padding: "20px 18px", textAlign: "center", fontSize: 30, fontWeight: 800, ...rise(f, at(t, 1) + 50) }}>
          {blocked ? "⛔ blocked" : "…"}
          <div style={{ fontSize: 22, color: C.muted, fontWeight: 500 }}>drop bigger than run-to-run noise</div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={360} y={560} w={1200} style={{ ...card(C.red), padding: "20px 26px", ...rise(f, at(t, 2)) }}>
          <div style={{ fontSize: 28, fontWeight: 800 }}>cases that got worse</div>
          {[
            ["Pune · refunds · #41", "cited the 2023 policy"],
            ["Marathi · late · #87", "no order lookup"],
          ].map(([c, why], i) => (
            <div key={c} style={{ display: "flex", gap: 20, fontSize: 26, padding: "8px 0", borderTop: `1px solid ${C.line}`, marginTop: i ? 0 : 10 }}>
              <span style={{ fontFamily: MONO, width: 420 }}>{c}</span>
              <span style={{ color: C.red }}>{why}</span>
            </div>
          ))}
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ calibrating the judge, like a kitchen scale

export const JudgeCal = ({ t }: CP) => {
  const f = t.frame;
  const split = t.step >= 2 ? ease(f, at(t, 2) + 20, 30) : 0;
  return (
    <>
      {t.step < 2 && (
        <div style={{ opacity: 1 - from(t, 2) }}>
          <Abs x={0} y={300} w={1920} style={{ textAlign: "center", ...rise(f, 4) }}>
            <Big size={56}>“and who checks the judge?”</Big>
          </Abs>
          {t.step >= 1 && (
            <Abs x={560} y={440} w={800} style={{ display: "flex", gap: 40, alignItems: "center", justifyContent: "center", ...rise(f, at(t, 1)) }}>
              <div style={{ fontSize: 120 }}>⚖️</div>
              <div>
                <div style={{ fontFamily: MONO, fontSize: 60, fontWeight: 800, color: C.amber }}>300 g</div>
                <div style={{ fontSize: 28, color: C.red }}>really 500 g, and you trust it</div>
              </div>
            </Abs>
          )}
        </div>
      )}
      {t.step >= 2 && (
        <div style={{ opacity: from(t, 2) }}>
          <Abs x={140} y={280} w={420} style={{ ...card(C.blue), padding: "20px 24px", textAlign: "center", ...rise(f, at(t, 2)) }}>
            <div style={{ fontSize: 56 }}>👩‍💼</div>
            <div style={{ fontSize: 30, fontWeight: 800 }}>Meera labels 150</div>
            <div style={{ fontSize: 24, color: C.muted }}>pass or fail, with a reason</div>
          </Abs>
          {[
            ["75 to tune the judge", "read every disagreement, fix its instructions", C.amber],
            ["75 held back", "used once, at the very end", C.purple],
          ].map(([h, s, col], i) => (
            <Abs key={h} x={lerp(640, 680, split)} y={lerp(310, 270 + i * 190, split)} w={560} style={{ ...card(col), padding: "18px 24px", opacity: split }}>
              <div style={{ fontSize: 30, fontWeight: 800 }}>{h}</div>
              <div style={{ fontSize: 24, color: C.muted, marginTop: 4 }}>{s}</div>
            </Abs>
          ))}
          {t.step >= 3 && (
            <Abs x={1320} y={300} w={480} style={{ ...rise(f, at(t, 3)) }}>
              {[
                ["TPR", "of Meera's passes, judge passed", "0.90", C.green],
                ["TNR", "of Meera's fails, judge failed", "0.80", C.red],
              ].map(([k, s, v, col]) => (
                <div key={k} style={{ ...card(col), padding: "16px 22px", marginBottom: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: 34, fontWeight: 900 }}>{k}</span>
                    <span style={{ fontFamily: MONO, fontSize: 36, color: col }}>{v}</span>
                  </div>
                  <div style={{ fontSize: 24, color: C.muted }}>{s}</div>
                </div>
              ))}
            </Abs>
          )}
          {t.step >= 3 && (
            <Abs x={140} y={720} w={1660} style={{ textAlign: "center", ...rise(f, at(t, 3) + 60) }}>
              <Big size={40} color={C.red}>a judge that never fails anything has a TNR of zero</Big>
            </Abs>
          )}
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the judge's habits

export const Biases = ({ t }: CP) => {
  const f = t.frame;
  const items = [
    ["🥇", "position", "prefers whatever it reads first", "run both orders; count only agreement"],
    ["📜", "verbosity", "prefers the longer answer", "criteria about content, not length"],
    ["🪞", "self-preference", "prefers its own family's answers", "judge with a different model family"],
    ["😇", "leniency", "passes too much", "failing examples, reasoning first, watch TNR"],
  ];
  return (
    <>
      {items.map(([icon, name, what, fix], i) =>
        t.step >= i ? (
          <Abs key={name} x={140 + (i % 2) * 840} y={280 + Math.floor(i / 2) * 250} w={800} style={{ ...card(t.step === i ? C.amber : C.line), padding: "20px 26px", ...rise(f, at(t, i)) }}>
            <div style={{ fontSize: 34, fontWeight: 800 }}>
              {icon} {name}
            </div>
            <div style={{ fontSize: 27, color: C.muted, marginTop: 6 }}>{what}</div>
            <div style={{ fontSize: 27, color: C.green, marginTop: 8 }}>→ {fix}</div>
          </Abs>
        ) : null,
      )}
    </>
  );
};

// ------------------------------------------------------------------ search metrics on one ranked list, then answers

export const RankMetrics = ({ t }: CP) => {
  const f = t.frame;
  const rel = new Set([2, 7, 11]);
  const names = ["delivery FAQ", "bakery rule", "other", "other", "other", "other", "refund table", "other", "other", "other", "policy intro"];
  const k = t.step >= 1 ? (f > at(t, 1) + 60 ? 10 : 5) : 0;
  return (
    <>
      {t.step === 0 && (
        <div style={{ opacity: during(t, 0) }}>
          <Abs x={200} y={330} w={700} style={{ ...card(C.red), padding: "22px 28px", ...rise(f, 4) }}>
            <div style={{ fontSize: 28, color: C.muted }}>bakery bug</div>
            <div style={{ fontSize: 40, fontWeight: 800 }}>a search problem</div>
            <div style={{ fontSize: 26, color: C.muted, marginTop: 6 }}>the wrong version was found</div>
          </Abs>
          <Abs x={1020} y={330} w={700} style={{ ...card(C.amber), padding: "22px 28px", ...rise(f, 30) }}>
            <div style={{ fontSize: 28, color: C.muted }}>right chunk, wrong answer</div>
            <div style={{ fontSize: 40, fontWeight: 800 }}>an answer problem</div>
            <div style={{ fontSize: 26, color: C.muted, marginTop: 6 }}>the model strayed from good evidence</div>
          </Abs>
        </div>
      )}
      {t.step >= 1 && t.step < 3 && (
        <div style={{ opacity: from(t, 1) * (1 - from(t, 3)) }}>
          {names.map((n, i) => {
            const pos = i + 1;
            const right = rel.has(pos);
            return (
              <Abs key={i} x={180} y={270 + i * 54} w={560} style={{ ...card(right ? C.green : C.line), padding: "6px 18px", fontSize: 24, display: "flex", gap: 16, opacity: enter(f, at(t, 1) + i * 3), ...(pos <= k ? {} : { filter: "brightness(0.6)" }) }}>
                <span style={{ fontFamily: MONO, color: C.muted, width: 34 }}>{pos}</span>
                {n} {right ? "✓" : ""}
              </Abs>
            );
          })}
          {k > 0 && (
            <Svg>
              <rect x={760} y={270} width={10} height={k * 54 - 8} rx={5} fill={C.blue} />
            </Svg>
          )}
          <Abs x={820} y={300} w={980} style={{ ...rise(f, at(t, 1) + 20) }}>
            <div style={{ fontFamily: MONO, fontSize: 40, fontWeight: 800 }}>
              recall@{k}: <span style={{ color: C.blue }}>{k === 10 ? "2 of 3 = 0.67" : "1 of 3 = 0.33"}</span>
            </div>
            <div style={{ fontSize: 26, color: C.muted, marginTop: 6 }}>of the chunks that answer it, how many are in the top {k}?</div>
          </Abs>
          {t.step >= 2 && (
            <Abs x={820} y={480} w={980} style={{ ...rise(f, at(t, 2)) }}>
              <div style={{ fontFamily: MONO, fontSize: 40, fontWeight: 800 }}>
                reciprocal rank: <span style={{ color: C.green }}>1/2 = 0.5</span>
              </div>
              <div style={{ fontSize: 26, color: C.muted, marginTop: 6 }}>the first right one sits 2nd · averaged over questions: MRR</div>
            </Abs>
          )}
        </div>
      )}
      {t.step >= 3 && (
        <div style={{ opacity: from(t, 3) }}>
          <Abs x={160} y={280} w={1000} style={{ ...card(C.purple), padding: "22px 28px", ...rise(f, at(t, 3)) }}>
            <div style={{ fontSize: 28, color: C.muted }}>the answer's claims</div>
            {[
              ["bakery refunds: 12 hours", true],
              ["a photo is required", true],
              ["works on weekends too", false],
            ].map(([c, ok]) => (
              <div key={c as string} style={{ fontSize: 30, padding: "8px 0", color: ok ? C.text : C.red }}>
                {ok ? "✓" : "✗"} {c as string} <span style={{ fontSize: 22, color: C.muted }}>{ok ? "in the chunks" : "in no chunk"}</span>
              </div>
            ))}
            <div style={{ fontFamily: MONO, fontSize: 34, fontWeight: 800, color: C.purple, marginTop: 10 }}>faithfulness = 2 / 3</div>
          </Abs>
          {t.step >= 4 && (
            <Abs x={1200} y={300} w={600} style={{ display: "flex", flexDirection: "column", gap: 16, ...rise(f, at(t, 4)) }}>
              <div style={{ ...card(C.blue), padding: "16px 22px", fontSize: 28, fontWeight: 700 }}>low recall → fix search</div>
              <div style={{ ...card(C.purple), padding: "16px 22px", fontSize: 28, fontWeight: 700 }}>good recall, low faithfulness → fix the answer step</div>
            </Abs>
          )}
          {t.step >= 5 && (
            <Abs x={160} y={720} w={1600} style={{ textAlign: "center", ...rise(f, at(t, 5)) }}>
              <Big size={42} color={C.amber}>faithful ≠ correct: faithful to an outdated policy is still wrong</Big>
            </Abs>
          )}
        </div>
      )}
    </>
  );
};

