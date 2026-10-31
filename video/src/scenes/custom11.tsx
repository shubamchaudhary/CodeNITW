// Chapter 9 scenes (testing agents and shipping safely): the claim vs the
// database, a trajectory with rule checks, pass^k falling, a trace as an
// X-ray, per-group online evals, and a rollout dial.
// Widths only, never heights; the top-right corner stays free for the term card.
import type { ReactNode } from "react";
import type { Clock } from "../lib/timeline.ts";
import { C, MONO, PALETTE } from "../lib/theme.ts";
import { ease, enter, pop, rise } from "../lib/anim.ts";
import { Abs, card, Chip } from "./ui.tsx";
import { at, Big, clamp01, during, from } from "./custom3.tsx";

type CP = { t: Clock; props?: Record<string, unknown> };

const Svg = ({ children }: { children: ReactNode }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
    {children}
  </svg>
);

// ------------------------------------------------------------------ the claim vs the database, then the path

export const ClaimVsDb = ({ t }: CP) => {
  const f = t.frame;
  const rows: [string, string, boolean][] = [
    ["Pune · Kothrud", "400", false],
    ["Pune · Wakad", "400", false],
    ["Nashik · Satpur", "480", true],
  ];
  const calls = [
    ["get_stock", "read before write"],
    ["get_forecast", ""],
    ["propose_change", ""],
    ["request_approval", "approval before commit"],
    ["commit_change", ""],
  ];
  return (
    <>
      {t.step < 2 && (
        <div style={{ opacity: 1 - from(t, 2) }}>
          <Abs x={160} y={320} w={680} style={{ ...rise(f, 4) }}>
            <div style={{ background: C.card2, borderRadius: 22, padding: "24px 30px", fontSize: 36, fontWeight: 700 }}>🤖 Done! ✅ Raised milk safety stock in Pune.</div>
            <div style={{ fontSize: 28, color: C.amber, marginTop: 14, textAlign: "center" }}>a claim</div>
          </Abs>
          {t.step >= 1 && (
            <Abs x={1000} y={300} w={760} style={{ ...card(C.blue), padding: "22px 28px", ...rise(f, at(t, 1)) }}>
              <div style={{ fontSize: 28, fontWeight: 800 }}>🗄️ the database: the truth</div>
              {rows.map(([w, v, bad]) => (
                <div key={w} style={{ display: "flex", fontFamily: MONO, fontSize: 28, padding: "8px 0", borderTop: `1px solid ${C.line}`, color: bad ? C.red : C.text }}>
                  <div style={{ flex: 1 }}>{w}</div>
                  <div>{v}</div>
                  <div style={{ width: 60, textAlign: "right" }}>{bad ? "✗" : ""}</div>
                </div>
              ))}
              <div style={{ fontSize: 26, color: C.red, marginTop: 10, opacity: enter(f, at(t, 1) + 60) }}>Pune unchanged · the wrong warehouse changed</div>
            </Abs>
          )}
        </div>
      )}
      {t.step >= 2 && (
        <div style={{ opacity: from(t, 2) }}>
          <Abs x={110} y={360} w={1700} style={{ display: "flex", gap: 16, alignItems: "flex-start", justifyContent: "center" }}>
            {calls.map(([c, rule], i) => (
              <div key={c} style={{ display: "flex", alignItems: "center", gap: 16, opacity: Math.min(1, pop(f, at(t, 2) + i * 14)) }}>
                <div style={{ width: 270 }}>
                  <div style={{ ...card(rule ? C.green : C.line), padding: "16px 0", textAlign: "center", fontFamily: MONO, fontSize: 24 }}>{c}</div>
                  {rule && <div style={{ fontSize: 22, color: C.green, textAlign: "center", marginTop: 10 }}>✓ {rule}</div>}
                </div>
                {i < calls.length - 1 && <span style={{ fontSize: 30, color: C.muted }}>→</span>}
              </div>
            ))}
          </Abs>
          <Abs x={110} y={560} w={1700} style={{ display: "flex", gap: 20, justifyContent: "center", ...rise(f, at(t, 2) + 80) }}>
            <Chip color={C.green} style={{ fontSize: 26 }}>✓ never called delete_rows</Chip>
            <Chip color={C.green} style={{ fontSize: 26 }}>✓ 5 steps ≤ 12</Chip>
          </Abs>
          {t.step >= 3 && (
            <Abs x={110} y={700} w={1700} style={{ textAlign: "center", ...rise(f, at(t, 3)) }}>
              <Big size={40} color={C.amber}>rules, not one exact sequence: there's usually more than one good path</Big>
            </Abs>
          )}
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ pass^k: the chance all k succeed

export const PassK = ({ t }: CP) => {
  const f = t.frame;
  const ks = [1, 2, 3, 4, 5, 6, 8, 10];
  const gx = (i: number) => 220 + i * 105;
  const gy = (v: number) => 800 - v * 480;
  const draw = t.step >= 2 ? clamp01((f - at(t, 2) - 10) / 70) : 0;
  const shown = Math.ceil(draw * ks.length);
  const line = (p: number) =>
    ks
      .slice(0, shown)
      .map((k, i) => `${gx(i)},${gy(Math.pow(p, k))}`)
      .join(" ");
  return (
    <>
      {t.step < 2 && (
        <div style={{ opacity: 1 - from(t, 2) }}>
          <Abs x={160} y={300} w={760} style={{ ...rise(f, 4) }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} style={{ width: 62, height: 62, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, background: i === 3 || i === 8 ? `${C.red}33` : `${C.green}22`, border: `2px solid ${i === 3 || i === 8 ? C.red : C.green}`, opacity: enter(f, 6 + i * 5) }}>
                  {i === 3 || i === 8 ? "✗" : "✓"}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 34, fontWeight: 800, marginTop: 20 }}>8 out of 10. good?</div>
            <div style={{ fontSize: 28, color: C.muted, marginTop: 8 }}>Arjun sends each request once, dozens a week</div>
          </Abs>
          {t.step >= 1 && (
            <Abs x={1040} y={320} w={720} style={{ ...card(C.blue), padding: "22px 28px", ...rise(f, at(t, 1)) }}>
              <div style={{ fontFamily: MONO, fontSize: 38, fontWeight: 800, color: C.blue }}>pass@k</div>
              <div style={{ fontSize: 28, marginTop: 8 }}>at least one of k attempts succeeds</div>
              <div style={{ fontSize: 24, color: C.muted, marginTop: 8 }}>fits: a person picks the best of several (code suggestions)</div>
            </Abs>
          )}
        </div>
      )}
      {t.step >= 2 && (
        <div style={{ opacity: from(t, 2) }}>
          <Svg>
            <line x1={200} y1={gy(0)} x2={gx(7) + 30} y2={gy(0)} stroke={C.line} strokeWidth={2} />
            <line x1={200} y1={gy(0)} x2={200} y2={gy(1) - 10} stroke={C.line} strokeWidth={2} />
            <polyline points={line(0.9)} fill="none" stroke={C.green} strokeWidth={5} />
            <polyline points={line(0.8)} fill="none" stroke={C.amber} strokeWidth={5} />
            {t.step >= 3 && <circle cx={gx(2)} cy={gy(0.512)} r={14} fill="none" stroke={C.red} strokeWidth={4} opacity={enter(f, at(t, 3))} />}
          </Svg>
          {ks.map((k, i) => (
            <Abs key={k} x={gx(i) - 20} y={812} w={40} style={{ textAlign: "center", fontFamily: MONO, fontSize: 22, color: C.muted }}>{k}</Abs>
          ))}
          <Abs x={200} y={850} w={800} style={{ fontSize: 22, color: C.muted, textAlign: "center" }}>attempts k</Abs>
          <Abs x={220} y={270} w={600} style={{ display: "flex", gap: 16 }}>
            <Chip color={C.green} style={{ fontSize: 22 }}>90% per try</Chip>
            <Chip color={C.amber} style={{ fontSize: 22 }}>80% per try</Chip>
          </Abs>
          <Abs x={1120} y={320} w={680} style={{ ...card(C.green), padding: "22px 28px" }}>
            <div style={{ fontFamily: MONO, fontSize: 38, fontWeight: 800, color: C.green }}>pass^k</div>
            <div style={{ fontSize: 28, marginTop: 8 }}>all k attempts succeed</div>
            <div style={{ fontSize: 24, color: C.muted, marginTop: 8 }}>fits: anything facing customers, or changing data</div>
          </Abs>
          {t.step >= 3 && (
            <Abs x={1120} y={570} w={680} style={{ ...card(C.red), padding: "20px 26px", ...rise(f, at(t, 3)) }}>
              <div style={{ fontFamily: MONO, fontSize: 32 }}>0.8 × 0.8 × 0.8 = 0.51</div>
              <div style={{ fontSize: 26, color: C.muted, marginTop: 6 }}>three of Arjun's requests in a row: a coin flip</div>
            </Abs>
          )}
          {t.step >= 4 && (
            <Abs x={1120} y={760} w={680} style={{ display: "flex", flexWrap: "wrap", gap: 12, ...rise(f, at(t, 4)) }}>
              <Chip color={C.purple} style={{ fontSize: 22 }}>a fresh sandbox per run</Chip>
              <Chip color={C.purple} style={{ fontSize: 22 }}>a model plays Arjun</Chip>
            </Abs>
          )}
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ a trace, as an X-ray

export const XRay = ({ t }: CP) => {
  const f = t.frame;
  const spans: [string, number, number, number][] = [
    ["request", 0, 100, 0],
    ["model call", 2, 22, 1],
    ["search_policy", 24, 44, 1],
    ["rerank", 32, 42, 2],
    ["get_order", 46, 58, 1],
    ["model call", 60, 98, 1],
  ];
  const fields = ["model + exact version", "prompt template v14", "chunk ids + scores", "tool args, results, errors", "tokens · time · cost", "who asked · thumbs up/down"];
  return (
    <>
      {t.step === 0 && (
        <div style={{ opacity: during(t, 0) }}>
          <Abs x={160} y={300} w={1600} style={{ display: "flex", gap: 24, justifyContent: "center", ...rise(f, 4) }}>
            {["📏 answers suddenly longer", "🙅 refusing simple questions", "🚫 nobody deployed"].map((s, i) => (
              <Chip key={s} color={i === 2 ? C.amber : C.red} style={{ fontSize: 32, opacity: enter(f, 10 + i * 16) }}>{s}</Chip>
            ))}
          </Abs>
          <Abs x={0} y={460} w={1920} style={{ textAlign: "center", ...rise(f, 70) }}>
            <Big size={48}>Tuesday morning. what should you have been recording?</Big>
          </Abs>
        </div>
      )}
      {t.step >= 1 && (
        <div style={{ opacity: from(t, 1) }}>
          <Abs x={140} y={280} w={1040} style={{ ...card(C.blue), padding: "22px 26px", ...rise(f, at(t, 1)) }}>
            <div style={{ fontSize: 26, color: C.muted, marginBottom: 12 }}>🩻 trace · one request</div>
            {spans.map(([name, a, b, depth], i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", height: 46 }}>
                <div style={{ width: 230, paddingLeft: depth * 26, fontFamily: MONO, fontSize: 22, color: depth ? C.text : C.blue }}>{name}</div>
                <div style={{ flex: 1, position: "relative", height: 24 }}>
                  <div style={{ position: "absolute", left: `${a}%`, width: `${(b - a) * ease(f, at(t, 1) + 10 + i * 8, 20)}%`, height: 24, borderRadius: 6, background: PALETTE[i % PALETTE.length] }} />
                </div>
              </div>
            ))}
          </Abs>
          {t.step >= 2 && (
            <Abs x={1240} y={280} w={560} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {fields.map((s, i) => (
                <div key={s} style={{ ...card(C.line), padding: "12px 18px", fontSize: 25, fontWeight: 600, ...rise(f, at(t, 2) + i * 10) }}>{s}</div>
              ))}
            </Abs>
          )}
          {t.step >= 3 && (
            <Abs x={140} y={760} w={1040} style={{ ...rise(f, at(t, 3)) }}>
              <Chip color={C.amber} style={{ fontSize: 26 }}>mask personal data · decide how long to keep traces</Chip>
            </Abs>
          )}
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ online evals, per group

export const Online = ({ t }: CP) => {
  const f = t.frame;
  const days = 14;
  const groups = [
    { name: "Pune", col: C.blue, v: (d: number) => 0.92 + Math.sin(d) * 0.01 },
    { name: "Mumbai", col: C.purple, v: (d: number) => 0.9 + Math.cos(d * 1.3) * 0.01 },
    { name: "Bengaluru", col: C.red, v: (d: number) => (d > 9 ? 0.74 : 0.91 + Math.sin(d * 0.7) * 0.01) },
  ];
  const avg = (d: number) => groups.reduce((s, g) => s + g.v(d), 0) / groups.length;
  const gx = (d: number) => 180 + d * 62;
  const gy = (v: number) => 780 - (v - 0.6) * 1100;
  const drawn = Math.min(days, Math.ceil(clamp01((f - 20) / 90) * days));
  const pts = (fn: (d: number) => number) =>
    Array.from({ length: drawn }, (_, d) => `${gx(d)},${gy(fn(d))}`).join(" ");
  const signals = [
    ["answer length", "↑ 40% on Tuesday"],
    ["refusal rate", "↑ 3× on Tuesday"],
    ["format failures", "steady"],
  ];
  return (
    <>
      <Svg>
        <line x1={160} y1={gy(0.6)} x2={gx(days - 1) + 20} y2={gy(0.6)} stroke={C.line} strokeWidth={2} />
        {t.step >= 1 && groups.map((g) => <polyline key={g.name} points={pts(g.v)} fill="none" stroke={g.col} strokeWidth={4} opacity={enter(f, at(t, 1))} />)}
        <polyline points={pts(avg)} fill="none" stroke={C.text} strokeWidth={6} strokeDasharray={t.step >= 1 ? "12 10" : undefined} />
      </Svg>
      <Abs x={180} y={270} w={900} style={{ fontSize: 26, color: C.muted, ...rise(f, 4) }}>
        grounded answers, sampled from live traffic, by day
      </Abs>
      <Abs x={180} y={320} w={900} style={{ display: "flex", gap: 14 }}>
        <Chip color={C.text} style={{ fontSize: 22 }}>average</Chip>
        {t.step >= 1 && groups.map((g) => <Chip key={g.name} color={g.col} style={{ fontSize: 22, opacity: enter(f, at(t, 1)) }}>{g.name}</Chip>)}
      </Abs>
      {t.step >= 1 && (
        <Abs x={1100} y={600} w={300} style={{ fontSize: 26, fontWeight: 800, color: C.red, ...rise(f, at(t, 1) + 30) }}>
          ← Bengaluru dropped; the average barely moved
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={1440} y={300} w={380} style={{ display: "flex", flexDirection: "column", gap: 14, ...rise(f, at(t, 2)) }}>
          <div style={{ fontSize: 28, fontWeight: 800 }}>a silent model update?</div>
          {signals.map(([k, v], i) => (
            <div key={k} style={{ ...card(i < 2 ? C.red : C.line), padding: "12px 18px" }}>
              <div style={{ fontSize: 26, fontWeight: 700 }}>{k}</div>
              <div style={{ fontSize: 22, color: i < 2 ? C.red : C.muted }}>{v}</div>
            </div>
          ))}
          <div style={{ fontSize: 22, color: C.green, marginTop: 4 }}>pin dated model versions · regression suite daily · old version one switch away</div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the rollout dial

export const Rollout = ({ t }: CP) => {
  const f = t.frame;
  const stages = [
    ["🧪", "offline", "golden set passes"],
    ["👻", "shadow", "real traffic, output hidden"],
    ["🐤", "canary", "5% of Pune agents"],
    ["🌍", "full", "everyone, watched live"],
  ];
  const lit = Math.min(2, t.step);
  const rolled = t.step === 3 && f > at(t, 3) + 50;
  return (
    <>
      {t.step < 4 && (
        <div style={{ opacity: 1 - from(t, 4) }}>
          {stages.map(([icon, name, sub], i) => {
            const on = i <= lit && !(rolled && i === 2);
            return (
              <Abs key={name} x={130 + i * 430} y={340} w={380} style={{ ...card(on ? PALETTE[i] : C.line), padding: "24px 20px", textAlign: "center", opacity: i <= lit ? 1 : 0.35, ...rise(f, 4 + i * 6) }}>
                <div style={{ fontSize: 64 }}>{icon}</div>
                <div style={{ fontSize: 34, fontWeight: 800 }}>{name}</div>
                <div style={{ fontSize: 24, color: C.muted }}>{sub}</div>
              </Abs>
            );
          })}
          {t.step >= 2 && (
            <Abs x={990} y={640} w={760} style={{ ...card(C.amber), padding: "16px 22px", fontSize: 26, ...rise(f, at(t, 2) + 30) }}>
              written down first: success = resolved without escalation · roll back if thumbs-down or escalations rise
            </Abs>
          )}
          {t.step >= 3 && (
            <Abs x={130} y={640} w={800} style={{ ...rise(f, at(t, 3)) }}>
              <Big size={40} color={rolled ? C.green : C.text}>{rolled ? "↩ rolled back in seconds: a config switch" : "something looks off…"}</Big>
            </Abs>
          )}
        </div>
      )}
      {t.step >= 4 && (
        <div style={{ opacity: from(t, 4) }}>
          <Abs x={160} y={290} w={760} style={{ ...card(C.blue), padding: "22px 28px", ...rise(f, at(t, 4)) }}>
            <div style={{ fontSize: 32, fontWeight: 800 }}>A/B test: is it better?</div>
            {["split by agent, not by request", "one metric, chosen in advance", "sample size fixed before you start"].map((s, i) => (
              <div key={s} style={{ fontSize: 27, padding: "8px 0", borderTop: `1px solid ${C.line}`, marginTop: i ? 0 : 12 }}>• {s}</div>
            ))}
          </Abs>
          {t.step >= 5 && (
            <Abs x={1000} y={290} w={800} style={{ ...card(C.purple), padding: "22px 28px", ...rise(f, at(t, 5)) }}>
              <div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 800, color: C.purple }}>ask-freshcart@2026-10-28.3</div>
              {["prompt v14", "model snapshot, pinned", "reranker on", "index v7"].map((s) => (
                <div key={s} style={{ fontFamily: MONO, fontSize: 26, padding: "6px 0", color: C.muted }}>· {s}</div>
              ))}
              <div style={{ fontSize: 24, marginTop: 8 }}>stamped on every trace · roll back = switch versions</div>
            </Abs>
          )}
        </div>
      )}
    </>
  );
};

