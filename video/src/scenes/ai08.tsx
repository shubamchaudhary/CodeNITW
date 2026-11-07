// Chapter 8 (Is it actually working?), told with a general example: a
// software company's support chatbot, measured properly.
import { Fragment } from "react";
import { C, MONO, PALETTE } from "../lib/theme.ts";
import { ease, enter, lerp, pop, rise } from "../lib/anim.ts";
import { Abs, card, Chip } from "./ui.tsx";
import { at, rnd } from "./custom3.tsx";
import { Arrow, Svg, type CP } from "./secui.tsx";

// ------------------------------------------------------------------ hook

export const A8Hook = ({ t }: CP) => {
  const f = t.frame;
  const strike = t.step >= 2 ? ease(f, at(t, 2) + 10, 16) : 0;
  return (
    <>
      <Abs x={80} y={190} w={1160} style={{ ...card(C.amber), padding: "22px 28px", ...rise(f, 4) }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>FROM: VP OF SUPPORT</div>
        <div style={{ fontSize: 40, fontWeight: 800, marginTop: 8 }}>“Is this thing actually working? How would we even know?”</div>
      </Abs>
      {t.step >= 1 && (
        <Abs x={80} y={420} w={1160} style={{ ...card(C.red), padding: "18px 26px", ...rise(f, at(t, 1)) }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>ATTACHED SCREENSHOT</div>
          <div style={{ fontSize: 30, marginTop: 6 }}>Bot: “You can request a refund within 60 days.”</div>
          <div style={{ fontSize: 28, color: C.red, fontWeight: 800, marginTop: 6 }}>Policy: 30 days.</div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={1300} y={300} w={540} style={{ textAlign: "center", ...rise(f, at(t, 2)) }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <div style={{ fontSize: 110, fontWeight: 900, color: C.muted }}>4.1/5</div>
            <div style={{ position: "absolute", left: -10, top: "50%", height: 10, width: `${strike * 105}%`, background: C.red, borderRadius: 5 }} />
          </div>
          <div style={{ fontSize: 30, color: C.muted }}>“helpfulness”, from a library default</div>
          <div style={{ fontSize: 30, color: C.red, fontWeight: 800, marginTop: 10, opacity: strike }}>says nothing: what's wrong, how often, what to fix</div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ error analysis

const CATS: [string, number, string][] = [
  ["outdated policy version retrieved", 11, C.red],
  ["right chunk found, answer contradicts it", 6, C.amber],
  ["account question, account never looked up", 5, C.purple],
  ["answer too long to read", 4, C.blue],
];
const NOTES = ["cited the 2023 refund policy", "never searched; answered from memory", "right chunk, wrong number", "fine", "fine", "too long", "old pricing page", "fine"];

export const A8Piles = ({ t }: CP) => {
  const f = t.frame;
  return (
    <>
      {t.step < 2 && (
        <Abs x={80} y={270} w={1760} style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {Array.from({ length: 40 }, (_, i) => (
            <div key={i} style={{ width: 160, height: 46, borderRadius: 8, background: C.card, border: `2px solid ${C.line}`, fontFamily: MONO, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, opacity: enter(f, 4 + i) }}>
              trace #{1000 + Math.floor(rnd(i) * 9000)}
            </div>
          ))}
        </Abs>
      )}
      {t.step === 1 && (
        <Abs x={80} y={600} w={1760} style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {NOTES.map((n, i) => (
            <div key={i} style={{ background: "#ffe27a", color: "#2a2200", padding: "10px 16px", fontSize: 24, fontWeight: 700, borderRadius: 6, transform: `rotate(${(rnd(i + 9) - 0.5) * 6}deg) scale(${Math.min(1, pop(f, at(t, 1) + i * 8))})` }}>
              {n}
            </div>
          ))}
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={80} y={220} w={1760} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: C.muted, letterSpacing: 2, ...rise(f, at(t, 2)) }}>FAILURES IN 100 TRACES</div>
          {CATS.map(([n, c, col], i) => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 24, ...rise(f, at(t, 2) + 8 + i * 8) }}>
              <div style={{ width: 640, fontSize: 30, fontWeight: 700 }}>{n}</div>
              <div style={{ height: 48, width: 70 * c * ease(f, at(t, 2) + 12 + i * 8, 24), background: col, borderRadius: 8 }} />
              <div style={{ fontSize: 34, fontWeight: 900, color: col }}>{c}</div>
            </div>
          ))}
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={80} y={720} w={1760} style={{ ...rise(f, at(t, 3)) }}>
          <Chip color={C.green} style={{ fontSize: 30, padding: "10px 26px" }}>
            the biggest pile isn't a prompt problem: old documents never deleted
          </Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ failures → checks

export const A8Checks = ({ t }: CP) => {
  const f = t.frame;
  const rows: [string, string, string, number][] = [
    ["outdated policy version", "every cited chunk is the latest version", "code", 0],
    ["account never looked up", "account tool called when an account id is present", "code", 0],
    ["answer too long", "answer under 120 words", "code", 0],
    ["answer contradicts its chunk", "is every claim supported by the cited chunks?", "LLM judge", 1],
  ];
  return (
    <>
      <Abs x={80} y={270} w={1760} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {rows.map(([fail, check, kind, st], i) => {
          if (t.step < st) return null;
          const col = kind === "code" ? C.green : C.purple;
          return (
            <div key={fail} style={{ display: "flex", alignItems: "center", gap: 20, ...rise(f, at(t, st) + (st === 0 ? i * 12 : 0)) }}>
              <div style={{ width: 460, ...card(C.red), padding: "14px 20px", fontSize: 27, fontWeight: 700 }}>{fail}</div>
              <div style={{ fontSize: 36, color: C.faint }}>→</div>
              <div style={{ flex: 1, ...card(col), padding: "14px 20px", fontSize: 27 }}>{check}</div>
              <Chip color={col} style={{ fontSize: 24, width: 150, justifyContent: "center" }}>
                {kind}
              </Chip>
            </div>
          );
        })}
      </Abs>
      {t.step >= 2 && (
        <Abs x={80} y={700} w={1760} style={{ display: "flex", gap: 24, ...rise(f, at(t, 2)) }}>
          {[
            ["💻 code first", "cheap, fast, never disagrees with itself", C.green],
            ["🧑‍⚖️ a judge only where code can't decide", "and checked against people", C.purple],
            ["🧑‍🏫 people label examples", "the domain expert, not a contractor", C.amber],
          ].map(([a, b, col]) => (
            <div key={a} style={{ flex: 1, ...card(col), padding: "14px 20px" }}>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{a}</div>
              <div style={{ fontSize: 24, color: C.muted, marginTop: 4 }}>{b}</div>
            </div>
          ))}
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ CI gate

export const A8Gate = ({ t }: CP) => {
  const f = t.frame;
  const stages: [string, string][] = [
    ["📝", "prompt change (pull request)"],
    ["🧪", "golden set: 300 cases"],
    ["⚖️", "compare with main, per group"],
  ];
  const blocked = t.step >= 2;
  return (
    <>
      <Svg>
        {stages.slice(0, -1).map((_, i) => (
          <Arrow key={i} x1={80 + i * 520 + 470} y1={330} x2={80 + (i + 1) * 520 - 6} y2={330} color={C.line} p={ease(f, 10 + i * 10, 14)} />
        ))}
      </Svg>
      {stages.map(([i, s], k) => (
        <Abs key={s} x={80 + k * 520} y={260} w={460} style={{ ...card(), padding: "18px 0", textAlign: "center", ...rise(f, 6 + k * 10) }}>
          <div style={{ fontSize: 44 }}>{i}</div>
          <div style={{ fontSize: 27, fontWeight: 800 }}>{s}</div>
        </Abs>
      ))}
      {t.step >= 1 && (
        <Abs x={80} y={460} w={1760} style={{ display: "flex", gap: 20, ...rise(f, at(t, 1)) }}>
          {[
            ["billing questions", "94% → 95%", C.green],
            ["refund questions", "97% → 88%", C.red],
            ["account questions", "91% → 91%", C.muted],
          ].map(([g, v, col]) => (
            <div key={g} style={{ flex: 1, ...card(col), padding: "14px 22px" }}>
              <div style={{ fontSize: 27, fontWeight: 700 }}>{g}</div>
              <div style={{ fontFamily: MONO, fontSize: 34, fontWeight: 800, color: col }}>{v}</div>
            </div>
          ))}
        </Abs>
      )}
      {blocked && (
        <Abs x={80} y={640} w={1760} style={{ textAlign: "center", ...rise(f, at(t, 2)) }}>
          <div style={{ display: "inline-block", border: `6px solid ${C.red}`, color: C.red, fontSize: 52, fontWeight: 900, letterSpacing: 3, padding: "4px 30px", borderRadius: 12, transform: `rotate(-3deg) scale(${2 - Math.min(1, pop(f, at(t, 2)))})` }}>MERGE BLOCKED</div>
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={80} y={800} w={1760} style={{ display: "flex", gap: 14, ...rise(f, at(t, 3)) }}>
          {["compare with main, not a fixed number", "re-run flaky cases 3×", "show which cases changed", "cache unchanged responses"].map((s, i) => (
            <Chip key={s} color={PALETTE[i]} style={{ fontSize: 23 }}>
              {s}
            </Chip>
          ))}
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ judge calibration

export const A8Judge = ({ t }: CP) => {
  const f = t.frame;
  const split: [string, number, string, string][] = [
    ["few-shot examples", 25, C.blue, "in the prompt"],
    ["dev: iterate the judge", 100, C.purple, "tune here"],
    ["test: held back", 75, C.green, "report once"],
  ];
  const cm = [
    ["judge pass", "judge fail"],
    [
      [90, 10],
      [20, 80],
    ],
  ] as const;
  return (
    <>
      <Abs x={80} y={190} w={1220} style={{ ...rise(f, 4) }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>200 ANSWERS, LABELLED PASS/FAIL BY THE DOMAIN EXPERT</div>
        <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
          {split.map(([n, c, col, sub], i) => (
            <div key={n} style={{ width: [250, 560, 398][i], ...card(col), padding: "12px 16px", opacity: t.step >= 0 ? enter(f, 10 + i * 10) : 0 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: col }}>{c}</div>
              <div style={{ fontSize: 22 }}>{n}</div>
              <div style={{ fontSize: 20, color: C.muted }}>{sub}</div>
            </div>
          ))}
        </div>
      </Abs>
      {t.step >= 1 && (
        <Abs x={80} y={460} w={900} style={{ ...rise(f, at(t, 1)) }}>
          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 1fr", gap: 8, fontSize: 26 }}>
            <div />
            {cm[0].map((h) => (
              <div key={h} style={{ textAlign: "center", fontWeight: 800, color: C.muted }}>
                {h}
              </div>
            ))}
            {["expert: pass", "expert: fail"].map((r, i) => (
              <Fragment key={r}>
                <div style={{ fontWeight: 800, color: C.muted, alignSelf: "center" }}>
                  {r}
                </div>
                {cm[1][i].map((v, j) => (
                  <div key={`${i}${j}`} style={{ ...card(i === j ? C.green : C.red), padding: "14px 0", textAlign: "center", fontFamily: MONO, fontSize: 36, fontWeight: 800 }}>
                    {v}
                  </div>
                ))}
              </Fragment>
            ))}
          </div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={1040} y={460} w={800} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ ...card(C.green), padding: "14px 22px", ...rise(f, at(t, 2)) }}>
            <div style={{ fontSize: 30, fontWeight: 800 }}>TPR = 90 / 100 = 0.90</div>
            <div style={{ fontSize: 24, color: C.muted }}>of answers the expert passed, the judge passed</div>
          </div>
          {t.step >= 3 && (
            <div style={{ ...card(C.amber), padding: "14px 22px", ...rise(f, at(t, 3)) }}>
              <div style={{ fontSize: 30, fontWeight: 800 }}>TNR = 80 / 100 = 0.80</div>
              <div style={{ fontSize: 24, color: C.muted }}>of answers the expert failed, the judge failed: matters most</div>
            </div>
          )}
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ Cohen's kappa

export const A8Kappa = ({ t }: CP) => {
  const f = t.frame;
  const vals: [string, string, string, number][] = [
    ["observed agreement", "34 / 40", "0.85", 0],
    ["chance agreement", "0.5·0.5 + 0.5·0.5", "0.50", 1],
    ["κ = (0.85 − 0.50) / (1 − 0.50)", "", "0.70", 2],
  ];
  return (
    <>
      <Abs x={80} y={190} w={1220} style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.4, ...rise(f, 4) }}>
        40 answers · you and the judge agree on 34 · each of you passes 20
      </Abs>
      <Abs x={80} y={320} w={1100} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {vals.map(([a, b, v, st]) =>
          t.step >= st ? (
            <div key={a} style={{ ...card(st === 2 ? C.green : C.line), padding: "18px 26px", display: "flex", alignItems: "center", gap: 24, ...rise(f, at(t, st) + 6) }}>
              <div style={{ flex: 1, fontFamily: st === 2 ? MONO : undefined, fontSize: 30, fontWeight: 700 }}>{a}</div>
              <div style={{ fontFamily: MONO, fontSize: 28, color: C.muted }}>{b}</div>
              <div style={{ fontFamily: MONO, fontSize: 44, fontWeight: 900, color: st === 2 ? C.green : C.text }}>{v}</div>
            </div>
          ) : null,
        )}
      </Abs>
      {t.step >= 1 && (
        <Abs x={1240} y={330} w={600} style={{ textAlign: "center", ...rise(f, at(t, 1)) }}>
          <div style={{ fontSize: 100 }}>🪙🪙</div>
          <div style={{ fontSize: 28, color: C.muted }}>two coin-flippers agree half the time: that's not skill</div>
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={80} y={720} w={1760} style={{ ...rise(f, at(t, 3)) }}>
          <Chip color={C.green} style={{ fontSize: 30 }}>
            0.70: usually read as substantial agreement
          </Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ correcting a rate

export const A8Correct = ({ t }: CP) => {
  const f = t.frame;
  const v = t.step >= 2 ? lerp(0.82, 0.886, ease(f, at(t, 2) + 20, 40)) : 0.82;
  return (
    <>
      <Abs x={80} y={200} w={1220} style={{ ...rise(f, 4) }}>
        <div style={{ fontSize: 30, fontWeight: 700 }}>The judge says production answers are grounded:</div>
        <div style={{ fontSize: 120, fontWeight: 900, color: t.step >= 2 ? C.green : C.amber, fontVariantNumeric: "tabular-nums" }}>{Math.round(v * 100)}%</div>
      </Abs>
      {t.step >= 1 && (
        <Abs x={80} y={460} w={1760} style={{ ...card(C.purple), padding: "20px 28px", ...rise(f, at(t, 1)) }}>
          <div style={{ fontFamily: MONO, fontSize: 34 }}>true = (observed + TNR − 1) / (TPR + TNR − 1)</div>
          {t.step >= 2 && <div style={{ fontFamily: MONO, fontSize: 34, color: C.green, marginTop: 10, ...rise(f, at(t, 2)) }}>= (0.82 + 0.80 − 1) / (0.90 + 0.80 − 1) = 0.62 / 0.70 ≈ 0.89</div>}
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={80} y={700} w={1760} style={{ fontSize: 28, color: C.muted, fontWeight: 700, ...rise(f, at(t, 3)) }}>
          the Rogan–Gladen correction, from medical testing · valid only when TPR + TNR is clearly above 1
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ ranking metrics

export const A8Ranks = ({ t }: CP) => {
  const f = t.frame;
  const rel = [2, 7, 11];
  const metrics: [string, string, string, number][] = [
    ["recall@5", "1 of 3 relevant in the top 5", "0.33", 1],
    ["recall@10", "2 of 3 in the top 10", "0.67", 1],
    ["reciprocal rank", "first relevant at position 2 → 1/2", "0.50", 2],
    ["average precision", "(1/2 + 2/7) / 3", "0.26", 3],
    ["nDCG@10", "(1/log₂3 + 1/log₂8) / ideal 2.131", "0.45", 4],
  ];
  return (
    <>
      <Abs x={80} y={190} w={1220} style={{ fontSize: 30, fontWeight: 700, ...rise(f, 2) }}>
        “refund window” · 3 relevant chunks · search ranks them at <span style={{ color: C.green }}>2, 7 and 11</span>
      </Abs>
      <Abs x={80} y={270} w={1760} style={{ display: "flex", gap: 8 }}>
        {Array.from({ length: 12 }, (_, i) => {
          const hit = rel.includes(i + 1);
          const cut = t.step === 1 ? 5 : 10;
          return (
            <div key={i} style={{ flex: 1, height: 70, borderRadius: 10, background: hit ? `${C.green}55` : C.card, border: `2px solid ${hit ? C.green : C.line}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 28, fontWeight: 800, opacity: (t.step >= 1 && i + 1 > cut ? 0.35 : 1) * enter(f, 6 + i * 2) }}>
              {i + 1}
            </div>
          );
        })}
      </Abs>
      <Abs x={80} y={380} w={1760} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {metrics.map(([n, how, v, st]) =>
          t.step >= st ? (
            <div key={n} style={{ ...card(t.step === st ? C.green : C.line), padding: "12px 24px", display: "flex", alignItems: "center", gap: 24, ...rise(f, at(t, st) + (n === "recall@10" ? 12 : 0)) }}>
              <div style={{ width: 300, fontFamily: MONO, fontSize: 30, fontWeight: 800, color: C.green }}>{n}</div>
              <div style={{ flex: 1, fontSize: 27, color: C.muted }}>{how}</div>
              <div style={{ fontFamily: MONO, fontSize: 36, fontWeight: 900 }}>{v}</div>
            </div>
          ) : null,
        )}
      </Abs>
    </>
  );
};
